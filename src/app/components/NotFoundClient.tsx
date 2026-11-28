"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ZenithMark } from "@/components/brand/ZenithBrand";
import { Badge, Button, Icon, SearchInput } from "@/components/ui";
import {
  filterRoutesByQuery,
  ROUTE_RECOVERY_ENTRIES,
  suggestRoutesForPath,
} from "@/lib/route-recovery";
import styles from "../not-found.module.css";

const BROWSE_GROUPS = ["Planning Tools", "Databases", "World & Encounters", "General"] as const;

export default function NotFoundClient() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setResolvedPath(pathname);
  }, [pathname]);

  const activePath = resolvedPath ?? "/";
  const clippedPath = activePath.length > 72 ? `${activePath.slice(0, 69)}...` : activePath;
  const hasAttemptedPath = Boolean(resolvedPath && resolvedPath !== "/");

  const suggestedRoutes = useMemo(
    () => suggestRoutesForPath(activePath, 3),
    [activePath],
  );

  const filteredRoutes = useMemo(
    () => filterRoutesByQuery(query),
    [query],
  );

  const groupedRoutes = useMemo(() => {
    return BROWSE_GROUPS.map((groupName) => ({
      groupName,
      items: filteredRoutes.filter((item) => item.groupLabel === groupName && item.href !== "/"),
    })).filter((group) => group.items.length > 0);
  }, [filteredRoutes]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (filteredRoutes.length === 1) {
      router.push(filteredRoutes[0].href);
      return;
    }
    router.push(`/items?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className={styles.page}>
      <section className={styles.heroPanel} aria-labelledby="not-found-title">
        <div className={styles.heroTopRow}>
          <div className={styles.brandRow}>
            <span className={styles.markWrap}>
              <ZenithMark size={26} variant="shaded" idPrefix="nf-mark" />
            </span>
            <Badge variant="neutral" size="sm">
              404 Route Not Found
            </Badge>
          </div>

          {hasAttemptedPath && (
            <code className={styles.pathChip} title={pathname}>
              {clippedPath}
            </code>
          )}
        </div>

        <div className={styles.heroBody}>
          <h1 id="not-found-title" className={styles.heading}>
            Page not found.
          </h1>
          <p className={styles.lead}>
            Jump to the closest matching tool below, or search across all {ROUTE_RECOVERY_ENTRIES.length} Zenith routes and the IdleMMO item catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.searchForm} role="search" aria-label="Find a route or item">
          <div className={styles.searchInputWrap}>
            <SearchInput
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
              placeholder="Find a tool, database, or item (e.g. alchemy, bosses, wyrmshadow)..."
              ariaLabel="Search Zenith routes or IdleMMO items"
              showShortcutHint={false}
            />
          </div>
          {query.trim() ? (
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Icon name="items" size="sm" aria-hidden="true" />}
            >
              Search Items
            </Button>
          ) : (
            <Link href="/" className={styles.primaryLinkBtn}>
              <Icon name="dashboard" size="sm" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
          )}
        </form>
      </section>

      {!query.trim() && suggestedRoutes.length > 0 && (
        <section className={styles.sectionBlock} aria-labelledby="suggested-routes-heading">
          <div className={styles.sectionHeader}>
            <h2 id="suggested-routes-heading" className={styles.sectionTitle}>
              <Icon name="map" size="sm" className={styles.sectionIcon} aria-hidden="true" />
              <span>Closest matches</span>
            </h2>
            <span className={styles.sectionMeta}>Based on the link you opened</span>
          </div>

          <div className={styles.suggestGrid}>
            {suggestedRoutes.map((route) => (
              <Link key={route.href} href={route.href} className={styles.suggestCard}>
                <div className={styles.suggestCardTop}>
                  <span className={styles.cardIcon}>
                    <Icon name={route.concept} size="md" aria-hidden="true" />
                  </span>
                  <div className={styles.cardTitleGroup}>
                    <strong className={styles.cardTitle}>{route.label}</strong>
                    <span className={styles.cardPath}>{route.href}</span>
                  </div>
                  <Icon name="arrowRight" size="sm" className={styles.cardArrow} aria-hidden="true" />
                </div>
                <p className={styles.cardDesc}>{route.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.sectionBlock} aria-labelledby="directory-routes-heading">
        <div className={styles.sectionHeader}>
          <h2 id="directory-routes-heading" className={styles.sectionTitle}>
            <Icon name="archiveLayers" size="sm" className={styles.sectionIcon} aria-hidden="true" />
            <span>{query.trim() ? `Matching routes (${filteredRoutes.length})` : "All Companion Tools"}</span>
          </h2>
          {query.trim() && (
            <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          )}
        </div>

        {groupedRoutes.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyCopy}>
              <strong>No Zenith tool matches &ldquo;{query.trim()}&rdquo;</strong>
              <span>It might be an item, monster, potion, or pet inside our database instead.</span>
            </div>
            <div className={styles.emptyActions}>
              <Link
                href={`/items?search=${encodeURIComponent(query.trim())}`}
                className={styles.primaryLinkBtn}
              >
                <Icon name="items" size="sm" aria-hidden="true" />
                <span>Search &ldquo;{query.trim()}&rdquo; in Items</span>
              </Link>
              <Button variant="secondary" size="md" onClick={() => setQuery("")}>
                Reset filter
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.directoryColumns}>
            {groupedRoutes.map((group) => (
              <div key={group.groupName} className={styles.directoryCard}>
                <h3 className={styles.directoryGroupTitle}>{group.groupName}</h3>
                <ul className={styles.routeList}>
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={styles.routeRowLink}>
                        <Icon name={item.concept} size="sm" className={styles.routeRowIcon} aria-hidden="true" />
                        <span className={styles.routeRowLabel}>{item.label}</span>
                        <Icon name="arrowRight" size="xs" className={styles.routeRowArrow} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
