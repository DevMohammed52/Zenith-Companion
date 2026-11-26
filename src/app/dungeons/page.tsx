"use client";

import { Suspense } from "react";
import {
  BackToTop,
  Banner,
  Button,
  EmptyState,
  Icon,
  Skeleton,
  SkeletonContainer,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { useDungeonState } from "./hooks/useDungeonState";
import { DungeonHeader } from "./components/DungeonHeader";
import { DungeonCard, DungeonTableRow } from "./components/DungeonCard";
import { DungeonDetailsModal } from "./components/DungeonDetailsModal";
import { getDungeonKey } from "./types";
import styles from "./Dungeons.module.css";

const MOBILE_SORT_OPTIONS = [
  { value: "netProfitPerRun", label: "EV / Run" },
  { value: "shardValue", label: "Entry / Shard" },
  { value: "runsInIdleAction", label: "Runs / Action" },
  { value: "readiness", label: "Profile Gap" },
  { value: "durationMins", label: "Duration" },
  { value: "name", label: "Name" },
] as const;

function DungeonsLoadingSkeleton() {
  return (
    <SkeletonContainer announcement="Loading dungeon calculator..." className={styles.page}>
      <div className={styles.skeletonCard}>
        <Skeleton variant="text" width="36%" height={28} />
        <Skeleton variant="rectangular" width="100%" height={84} />
      </div>
      <div className={styles.skeletonCard}>
        <Skeleton variant="rectangular" width="100%" height={52} />
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <Skeleton key={idx} variant="rectangular" width="100%" height={56} />
        ))}
      </div>
    </SkeletonContainer>
  );
}

function DungeonsContent() {
  const state = useDungeonState();
  const {
    isLoading,
    rows,
    activeProfile,
    completedRunsByDungeon,
    updateCompletedRuns,
    openDungeon,
    sortCol,
    sortDesc,
    handleSort,
    setSortDesc,
    getSortDirection,
    totalDungeonCount,
    resetFilters,
  } = state;

  const sortArrow = (col: string) =>
    sortCol !== col
      ? <Icon name="sort" size="xs" aria-hidden="true" />
      : <Icon name={sortDesc ? "sortDesc" : "sortAsc"} size="xs" aria-hidden="true" />;

  const renderSortHeader = (col: string, label: string, align: "left" | "right" = "left") => (
    <TableHead align={align} aria-sort={getSortDirection(col)}>
      <button type="button" className={styles.sortButton} onClick={() => handleSort(col)}>
        <span>{label}</span>
        {sortArrow(col)}
      </button>
    </TableHead>
  );

  return (
    <main className={`container ${styles.page}`}>
      <DungeonHeader state={state} />

      <div className={styles.viewport} style={{ minHeight: "520px", contain: "layout" }}>
        {isLoading ? (
          <DungeonsLoadingSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            variant="search-empty"
            title="No dungeons match these filters"
            description={`Loaded ${totalDungeonCount} dungeons, but none match the active filters or profit floor.`}
            action={{ label: "Reset filters", onClick: resetFilters }}
          />
        ) : (
          <>
            {state.summary.sensitiveDropCount > 0 && (
              <Banner variant="warning" icon="warning">
                Market EV includes {state.summary.sensitiveDropCount} low-volume gear or mythic{" "}
                {state.summary.sensitiveDropCount === 1 ? "drop" : "drops"}. Use <strong>Vendor</strong>,{" "}
                <strong>Manual</strong>, or <strong>Exclude</strong> above for conservative estimates.
              </Banner>
            )}
            <div className={styles.desktopTable}>
              <TableContainer ariaLabel="Dungeon drop tables, shards, and profit ranking">
                <Table hoverable>
                  <TableHeader>
                    <TableRow>
                      {renderSortHeader("name", "Dungeon", "left")}
                      {renderSortHeader("location", "Location", "left")}
                      {renderSortHeader("readiness", "Profile", "left")}
                      {renderSortHeader("netProfitPerRun", "EV / Run", "right")}
                      {renderSortHeader("shardValue", "Entry / Shard", "right")}
                      {renderSortHeader("runsInIdleAction", "Runs / Action", "right")}
                      <TableHead align="center">Done</TableHead>
                      {renderSortHeader("runsToDrop", "Runs / Drop", "right")}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <DungeonTableRow
                        key={getDungeonKey(row)}
                        row={row}
                        hasProfile={Boolean(activeProfile)}
                        completedRuns={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                        onOpen={openDungeon}
                        onUpdateCompletedRuns={updateCompletedRuns}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            <div className={styles.mobileCards}>
              <div className={styles.mobileSortBar}>
                <div className={styles.mobileSortHeader}>
                  <span>Sort Dungeons</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icon name={sortDesc ? "chevronDown" : "chevronUp"} size="sm" aria-hidden="true" />}
                    onClick={() => setSortDesc((prev) => !prev)}
                    aria-label={`Sort ${sortDesc ? "descending" : "ascending"}`}
                  >
                    {sortDesc ? "Desc" : "Asc"}
                  </Button>
                </div>
                <div className={styles.mobileSortChips}>
                  {MOBILE_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.sortChip} ${sortCol === opt.value ? styles.sortChipActive : ""}`.trim()}
                      aria-pressed={sortCol === opt.value}
                      onClick={() => handleSort(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.mobileCardGrid}>
                {rows.map((row) => (
                  <DungeonCard
                    key={getDungeonKey(row)}
                    row={row}
                    hasProfile={Boolean(activeProfile)}
                    completedRuns={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                    onOpen={openDungeon}
                    onUpdateCompletedRuns={updateCompletedRuns}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <DungeonDetailsModal state={state} />
      <BackToTop />
    </main>
  );
}

export default function DungeonsPage() {
  return (
    <Suspense fallback={<DungeonsLoadingSkeleton />}>
      <DungeonsContent />
    </Suspense>
  );
}
