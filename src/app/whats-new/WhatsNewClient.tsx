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
import {
  BackToTop,
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  Pagination,
  SearchInput,
  SegmentedControl,
  Select,
  Separator,
  Timeline,
  type SegmentedControlOption,
  type SelectOption,
  type TimelineItem,
} from "@/components/ui";
import styles from "./WhatsNew.module.css";

const STORAGE_KEY_LAST_VERSION = "zenith_changelog_last_viewed_version";
const RELEASES_PER_PAGE = 4;

const CATEGORY_ORDER: ChangelogCategory[] = [
  "Added",
  "Changed",
  "Fixed",
  "Security",
  "Deprecated",
  "Removed",
];

const CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  Added: "New Features",
  Changed: "Improvements",
  Fixed: "Fixes",
  Removed: "Removed",
  Deprecated: "Deprecated",
  Security: "Security",
};

const CATEGORY_SHORT_LABELS: Record<ChangelogCategory, string> = {
  Added: "New",
  Changed: "Improved",
  Fixed: "Fixed",
  Removed: "Removed",
  Deprecated: "Deprecated",
  Security: "Security",
};

interface WhatsNewClientProps {
  initialData: ParsedChangelog;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className={styles.inlineBold}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={index} className={styles.inlineCode}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "In Progress";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getReleaseHeadline(sections: ChangelogSection[], totalChanges: number, isLatest: boolean): string {
  const highlights = sections
    .flatMap((section) => section.items)
    .slice(0, 2)
    .map((item) => item.title);

  if (highlights.length === 0) {
    return `${totalChanges} ${totalChanges === 1 ? "update" : "updates"}`;
  }
  const remainder = totalChanges - highlights.length;
  const lead = highlights.join(", ");
  if (remainder > 0) {
    return `${lead} + ${remainder} more`;
  }
  return isLatest ? `Latest: ${lead}` : lead;
}

export default function WhatsNewClient({ initialData }: WhatsNewClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());
  const [selectedCategory, setSelectedCategory] = useState<ChangelogCategory | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastReadVersion, setLastReadVersion] = useState<string | null>(null);

  const latestVersion =
    initialData.meta.latestVersion ||
    initialData.releases[0]?.version ||
    APP_VERSION;
  const latestReleaseDate =
    initialData.meta.latestDate ||
    initialData.releases[0]?.date ||
    APP_RELEASE_DATE;

  // Latest release expanded by default
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (initialData.releases[0]) {
      initial.add(initialData.releases[0].version);
    }
    return initial;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_VERSION);
      if (stored) {
        setLastReadVersion(stored);
      }
    } catch {
      // Ignore storage access failures
    }
  }, []);

  const handleMarkAsRead = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_VERSION, latestVersion);
      setLastReadVersion(latestVersion);
    } catch {
      // Ignore storage access failures
    }
  }, [latestVersion]);

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

  const categoryOptions = useMemo<SegmentedControlOption<ChangelogCategory | "ALL">[]>(() => {
    const options: SegmentedControlOption<ChangelogCategory | "ALL">[] = [
      { value: "ALL", label: "All", badge: categoryCounts.ALL || 0 },
    ];
    for (const cat of CATEGORY_ORDER) {
      const count = categoryCounts[cat] || 0;
      if (count > 0 || selectedCategory === cat) {
        options.push({
          value: cat,
          label: CATEGORY_LABELS[cat],
          badge: count,
        });
      }
    }
    return options;
  }, [categoryCounts, selectedCategory]);

  const filteredReleases = useMemo(() => {
    return initialData.releases
      .map((release) => {
        const matchingSections: ChangelogSection[] = [];

        for (const section of release.sections) {
          if (selectedCategory !== "ALL" && section.category !== selectedCategory) {
            continue;
          }

          let matchingItems: ChangelogItem[] = section.items;

          if (deferredSearch) {
            matchingItems = section.items.filter((item) => {
              const inTitle = item.title.toLowerCase().includes(deferredSearch);
              const inDesc = item.description.toLowerCase().includes(deferredSearch);
              const inSubItems = item.subItems.some((sub) => sub.toLowerCase().includes(deferredSearch));
              const inVersion = release.version.toLowerCase().includes(deferredSearch);
              return inTitle || inDesc || inSubItems || inVersion;
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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredReleases.length / RELEASES_PER_PAGE));
  const paginatedReleases = useMemo(() => {
    const startIndex = (currentPage - 1) * RELEASES_PER_PAGE;
    return filteredReleases.slice(startIndex, startIndex + RELEASES_PER_PAGE);
  }, [filteredReleases, currentPage]);

  const toggleExpandRelease = useCallback((version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedVersions(new Set(filteredReleases.map((r) => r.version)));
  }, [filteredReleases]);

  const collapseAll = useCallback(() => {
    setExpandedVersions(new Set());
  }, []);

  const handleJumpToVersion = useCallback(
    (version: string) => {
      if (!version) return;
      const index = filteredReleases.findIndex((r) => r.version === version);
      if (index === -1) return;

      const targetPage = Math.floor(index / RELEASES_PER_PAGE) + 1;
      setCurrentPage(targetPage);
      setExpandedVersions((prev) => new Set(prev).add(version));

      window.setTimeout(() => {
        const el = document.getElementById(`release-${version}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    },
    [filteredReleases],
  );

  const versionOptions: SelectOption[] = useMemo(() => {
    return filteredReleases.map((r) => ({
      value: r.version,
      label: formatDate(r.date || r.version),
      meta: `${r.totalChanges} ${r.totalChanges === 1 ? "update" : "updates"}`,
    }));
  }, [filteredReleases]);

  const hasUnreadReleases = useMemo(() => {
    if (!lastReadVersion || initialData.releases.length === 0) return false;
    return latestVersion !== lastReadVersion;
  }, [lastReadVersion, latestVersion, initialData.releases.length]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("ALL");
  }, []);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    return paginatedReleases.map((release) => {
      const isLatest = release.version === latestVersion;
      const isExpanded = Boolean(deferredSearch) || expandedVersions.has(release.version);
      const panelId = `release-panel-${release.version}`;

      return {
        id: release.version,
        htmlId: `release-${release.version}`,
        timestamp: release.date || release.version,
        formattedTime: formatDate(release.date || release.version),
        variant: isLatest ? "success" : "default",
        status: isLatest
          ? `Latest • ${release.totalChanges} ${release.totalChanges === 1 ? "update" : "updates"}`
          : `${release.totalChanges} ${release.totalChanges === 1 ? "update" : "updates"}`,
        title: (
          <button
            type="button"
            className={styles.releaseTrigger}
            onClick={() => toggleExpandRelease(release.version)}
            aria-expanded={isExpanded}
            aria-controls={panelId}
          >
            <div className={styles.releaseTriggerText}>
              <span className={styles.releaseHeadline}>
                {getReleaseHeadline(release.sections, release.totalChanges, isLatest)}
              </span>
              <span className={styles.releaseSectionBreakdown}>
                {release.sections.map((section, idx) => (
                  <React.Fragment key={section.category}>
                    {idx > 0 && <span aria-hidden="true" className={styles.inlineDivider} />}
                    <span className={styles.breakdownToken}>
                      {CATEGORY_SHORT_LABELS[section.category]} {section.items.length}
                    </span>
                  </React.Fragment>
                ))}
              </span>
            </div>
            <span className={styles.releaseTriggerChevron} aria-hidden="true">
              <Icon
                name="chevronDown"
                size="md"
                className={`${styles.chevronIcon} ${isExpanded ? styles.chevronIconRotated : ""}`}
              />
            </span>
          </button>
        ),
        children: (
          <div
            id={panelId}
            className={`${styles.releaseDrawer} ${isExpanded ? styles.releaseDrawerOpen : ""}`}
            aria-hidden={!isExpanded}
          >
            <div className={styles.releaseDrawerInner}>
              <div className={styles.releaseBody}>
                {release.notice && (
                  <Banner variant="info" className={styles.noticeBanner}>
                    {release.notice}
                  </Banner>
                )}

                {release.sections.map((section) => {
                  const sectionToneClass =
                    section.category === "Added"
                      ? styles.sectionAdded
                      : section.category === "Changed"
                      ? styles.sectionChanged
                      : section.category === "Fixed"
                      ? styles.sectionFixed
                      : styles.sectionMuted;

                  return (
                    <section
                      key={section.category}
                      className={`${styles.sectionGroup} ${sectionToneClass}`}
                      aria-label={CATEGORY_LABELS[section.category]}
                    >
                      <h4 className={styles.sectionHeading}>
                        <span>{CATEGORY_LABELS[section.category]}</span>
                        <span className={styles.sectionCount}>{section.items.length}</span>
                      </h4>

                      <ul className={styles.itemsList}>
                        {section.items.map((item) => (
                          <li key={item.id} className={styles.itemRow}>
                            <span className={styles.bulletDot} aria-hidden="true" />
                            <div className={styles.itemContent}>
                              <span className={styles.itemTitle}>{item.title}</span>
                              {item.description && (
                                <span className={styles.itemDescription}>
                                  : {renderInlineMarkdown(item.description)}
                                </span>
                              )}
                              {item.subItems.length > 0 && (
                                <ul className={styles.subItemsList}>
                                  {item.subItems.map((sub, subIdx) => (
                                    <li key={subIdx} className={styles.subItemRow}>
                                      {renderInlineMarkdown(sub)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        ),
      };
    });
  }, [paginatedReleases, latestVersion, deferredSearch, expandedVersions, toggleExpandRelease]);

  return (
    <div className={styles.container}>
      {/* 1. Header */}
      <Card padding="lg" className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.headerMeta}>
              <Badge
                variant="neutral"
                size="md"
                icon={<Icon name="calendar" size="xs" aria-hidden="true" />}
              >
                Latest update: {formatDate(latestReleaseDate)}
              </Badge>
              <div className={styles.metaStatsGroup}>
                <Separator orientation="vertical" decorative className={styles.metaDivider} />
                <span className={styles.metaSummary}>
                  {initialData.releases.length} {initialData.releases.length === 1 ? "release" : "releases"}
                </span>
                <Separator orientation="vertical" decorative className={styles.metaDivider} />
                <span className={styles.metaSummary}>
                  {categoryCounts.ALL || 0} {categoryCounts.ALL === 1 ? "update" : "updates"}
                </span>
              </div>
              {hasUnreadReleases && (
                <Badge variant="success" size="sm">
                  New update
                </Badge>
              )}
            </div>
            <h1 className={styles.title}>What&apos;s New in Zenith</h1>
            <p className={styles.subtitle}>
              Recent features, tools, and fixes for Zenith Companion. Official game changes live in{" "}
              <Link href="/patch-notes" className={styles.inlineLink}>
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
      </Card>

      {/* 2. Search & Filter Toolbar */}
      <Card padding="md" overflowVisible className={styles.toolbarCard}>
        <nav aria-label="Filter updates" className={styles.toolbarNav}>
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

          <Separator orientation="horizontal" decorative />

          <div className={styles.filterRow}>
            <div className={styles.segmentedWrapper}>
              <SegmentedControl
                options={categoryOptions}
                value={selectedCategory}
                onChange={(nextValue) => setSelectedCategory(nextValue)}
                ariaLabel="Filter updates by category"
                size="md"
              />
            </div>

            <div className={styles.viewControls}>
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Expand all
              </Button>
              <Separator orientation="vertical" decorative className={styles.controlDivider} />
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Collapse all
              </Button>
            </div>
          </div>
        </nav>
      </Card>

      {/* 3. Chronological Release Timeline */}
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
          <Timeline
            title="Release History"
            headingLevel="h2"
            directionNotice={`Order: Newest updates first (${filteredReleases.length} ${
              filteredReleases.length === 1 ? "release" : "releases"
            })`}
            items={timelineItems}
            className={styles.timelineFeed}
          />
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

      <BackToTop label="Scroll to top" />
    </div>
  );
}
