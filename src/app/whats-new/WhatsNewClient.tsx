"use client";

import React, {
  useState,
  useMemo,
  useDeferredValue,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import {
  type ParsedChangelog,
  type ChangelogCategory,
  type ChangelogSection,
  type ChangelogItem,
} from "@/lib/changelog-parser";
import { APP_VERSION, APP_RELEASE_DATE } from "@/lib/version";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import styles from "./WhatsNew.module.css";

const STORAGE_KEY_LAST_VERSION = "zenith_changelog_last_viewed_version";
const RELEASES_PER_PAGE = 4;

const CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  Added: "New Features",
  Changed: "Improvements",
  Fixed: "Fixes",
  Removed: "Removed",
  Deprecated: "Deprecated",
  Security: "Security",
};

interface WhatsNewClientProps {
  initialData: ParsedChangelog;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "In Progress";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function WhatsNewClient({ initialData }: WhatsNewClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());
  const [selectedCategory, setSelectedCategory] = useState<ChangelogCategory | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastReadVersion, setLastReadVersion] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Latest release expanded by default
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (initialData.releases[0]) {
      initial.add(initialData.releases[0].version);
    }
    return initial;
  });

  // Load last viewed version from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_VERSION);
      if (stored) {
        setLastReadVersion(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMarkAsRead = useCallback(() => {
    const latest = initialData.meta.latestVersion;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_VERSION, latest);
      setLastReadVersion(latest);
    } catch {
      // Ignore
    }
  }, [initialData.meta.latestVersion]);

  // Compute category counts across all releases
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    for (const release of initialData.releases) {
      for (const section of release.sections) {
        counts[section.category] = (counts[section.category] || 0) + section.items.length;
        counts.ALL += section.items.length;
      }
    }
    return counts;
  }, [initialData.releases]);

  // Filter releases by category and search query
  const filteredReleases = useMemo(() => {
    return initialData.releases
      .map((release) => {
        let matchingSections: ChangelogSection[] = [];

        for (const section of release.sections) {
          if (selectedCategory !== "ALL" && section.category !== selectedCategory) {
            continue;
          }

          let matchingItems: ChangelogItem[] = section.items;

          if (deferredSearch) {
            matchingItems = section.items.filter((item) => {
              const inTitle = item.title.toLowerCase().includes(deferredSearch);
              const inDesc = item.description.toLowerCase().includes(deferredSearch);
              const inVersion = release.version.toLowerCase().includes(deferredSearch);
              return inTitle || inDesc || inVersion;
            });
          }

          if (matchingItems.length > 0) {
            matchingSections.push({
              category: section.category,
              items: matchingItems,
            });
          }
        }

        const totalChanges = matchingSections.reduce((acc, s) => acc + s.items.length, 0);

        return {
          ...release,
          sections: matchingSections,
          totalChanges,
        };
      })
      .filter((release) => release.totalChanges > 0);
  }, [initialData.releases, selectedCategory, deferredSearch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredReleases.length / RELEASES_PER_PAGE));
  const paginatedReleases = useMemo(() => {
    const startIndex = (currentPage - 1) * RELEASES_PER_PAGE;
    return filteredReleases.slice(startIndex, startIndex + RELEASES_PER_PAGE);
  }, [filteredReleases, currentPage]);

  const toggleExpandRelease = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedVersions(new Set(filteredReleases.map((r) => r.version)));
  };

  const collapseAll = () => {
    setExpandedVersions(new Set());
  };

  const handleJumpToVersion = (version: string) => {
    if (!version) return;
    const index = filteredReleases.findIndex((r) => r.version === version);
    if (index === -1) return;

    const targetPage = Math.floor(index / RELEASES_PER_PAGE) + 1;
    setCurrentPage(targetPage);
    setExpandedVersions((prev) => new Set(prev).add(version));

    setTimeout(() => {
      const el = document.getElementById(`release-${version}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const versionOptions: SelectOption[] = useMemo(() => {
    return initialData.releases.map((r) => ({
      value: r.version,
      label: formatDate(r.date || r.version),
    }));
  }, [initialData.releases]);

  const hasUnreadReleases = useMemo(() => {
    if (!lastReadVersion || initialData.releases.length === 0) return false;
    return initialData.meta.latestVersion !== lastReadVersion;
  }, [lastReadVersion, initialData.meta.latestVersion, initialData.releases.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Card */}
      <header className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.headerMeta}>
              <span className={styles.versionTag}>
                Latest update: {formatDate(APP_RELEASE_DATE)}
              </span>
              {hasUnreadReleases && (
                <span className={styles.newBadge}>
                  NEW UPDATE
                </span>
              )}
            </div>
            <h1 className={styles.title}>What&apos;s New in Zenith</h1>
            <p className={styles.subtitle}>
              Recent features, tools, and fixes for Zenith Companion. Looking for official game updates? Check the{" "}
              <Link href="/patch-notes" style={{ color: "var(--text-accent)", textDecoration: "underline" }}>
                IdleMMO Patch Notes
              </Link>
              .
            </p>
          </div>

          {hasUnreadReleases && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAsRead}
              icon={<Icon name="check" size="sm" />}
            >
              Mark as read
            </Button>
          )}
        </div>
      </header>

      {/* 2. Search & Filter Toolbar */}
      <nav className={styles.toolbarCard} aria-label="Filter updates">
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery("")}
              placeholder="Search updates by feature or mechanic..."
              ariaLabel="Search updates"
              showShortcutHint={false}
            />
          </div>
          {versionOptions.length > 1 && (
            <div className={styles.jumpSelectWrapper}>
              <Select
                options={versionOptions}
                placeholder="Jump to date..."
                onChange={handleJumpToVersion}
                ariaLabel="Jump to release date"
              />
            </div>
          )}
        </div>

        <div className={styles.filterRow}>
          {/* Category Filter Pills */}
          <div className={styles.categoryPills} role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`${styles.filterPill} ${selectedCategory === "ALL" ? styles.filterPillActive : ""}`}
              onClick={() => setSelectedCategory("ALL")}
              aria-pressed={selectedCategory === "ALL"}
            >
              <span>All</span>
              <span className={styles.pillCount}>{categoryCounts.ALL || 0}</span>
            </button>

            {(["Added", "Changed", "Fixed"] as ChangelogCategory[]).map((cat) => {
              const count = categoryCounts[cat] || 0;
              if (count === 0 && selectedCategory !== cat) return null;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.filterPill} ${isSelected ? styles.filterPillActive : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={isSelected}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className={styles.pillCount}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse Controls */}
          <div className={styles.viewControls}>
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand all
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse all
            </Button>
          </div>
        </div>
      </nav>

      {/* 3. Releases Feed */}
      <main className={styles.releasesFeed} id="changelog-feed">
        {paginatedReleases.length === 0 ? (
          <EmptyState
            variant="search-empty"
            title="No updates found"
            description={
              searchQuery
                ? `No updates match "${searchQuery}".`
                : "No release notes available for this category."
            }
            action={{
              label: "Reset filters",
              onClick: handleClearFilters,
            }}
          />
        ) : (
          paginatedReleases.map((release) => {
            const isExpanded = expandedVersions.has(release.version);
            const isLatest = release.version === initialData.meta.latestVersion;

            return (
              <article
                key={release.version}
                id={`release-${release.version}`}
                className={styles.releaseCard}
              >
                {/* Release Card Header */}
                <div
                  className={`${styles.releaseHeader} ${isExpanded ? styles.releaseHeaderExpanded : ""}`}
                  onClick={() => toggleExpandRelease(release.version)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpandRelease(release.version);
                    }
                  }}
                >
                  <div className={styles.releaseHeaderLeft}>
                    <time
                      className={styles.versionBadge}
                      dateTime={release.date || release.version}
                    >
                      {formatDate(release.date || release.version)}
                    </time>
                    {isLatest && <span className={styles.newBadge}>LATEST</span>}
                    <span className={styles.changesCountPill}>
                      {release.totalChanges} {release.totalChanges === 1 ? "update" : "updates"}
                    </span>
                  </div>

                  <Icon
                    name="chevronDown"
                    size="md"
                    className={`${styles.chevronIcon} ${isExpanded ? styles.chevronIconRotated : ""}`}
                  />
                </div>

                {/* Optional Release Notice */}
                {release.notice && isExpanded && (
                  <aside className={styles.noticeBanner} role="note">
                    <Icon name="info" size="sm" />
                    <span>{release.notice}</span>
                  </aside>
                )}

                {/* Release Content */}
                {isExpanded && (
                  <div className={styles.releaseBody}>
                    {release.sections.map((section) => {
                      const headingClass =
                        section.category === "Added"
                          ? styles.headingAdded
                          : section.category === "Changed"
                          ? styles.headingChanged
                          : section.category === "Fixed"
                          ? styles.headingFixed
                          : styles.headingRemoved;

                      return (
                        <section
                          key={section.category}
                          className={styles.sectionGroup}
                          aria-label={CATEGORY_LABELS[section.category]}
                        >
                          <h2 className={`${styles.sectionHeading} ${headingClass}`}>
                            {CATEGORY_LABELS[section.category]}
                          </h2>

                          <ul className={styles.itemsList}>
                            {section.items.map((item) => (
                              <li key={item.id} className={styles.itemRow}>
                                <span className={styles.bulletDot} aria-hidden="true" />
                                <div className={styles.itemContent}>
                                  <span className={styles.itemTitle}>{item.title}</span>
                                  {item.description && (
                                    <span className={styles.itemDescription}>
                                      : {item.description}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })
        )}
      </main>

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredReleases.length}
          pageSize={RELEASES_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="releases"
          scrollToTop={true}
        />
      )}

      {/* 5. Floating Back To Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className={styles.backToTopButton}
          aria-label="Scroll to top"
          title="Back to top"
        >
          <Icon name="chevronUp" size="md" />
        </button>
      )}
    </div>
  );
}
