"use client";

import { Suspense } from "react";
import {
    BackToTop,
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
import { useBossState } from "./hooks/useBossState";
import { BossHeader } from "./components/BossHeader";
import { BossCard, BossTableRow } from "./components/BossCard";
import { BossDetailsModal } from "./components/BossDetailsModal";
import { WorldBossRoutinePlanner } from "./components/WorldBossRoutinePlanner";
import styles from "./Bosses.module.css";

const MOBILE_SORT_OPTIONS = [
    { value: "nextSpawnTime", label: "Timer" },
    { value: "ev", label: "EV" },
    { value: "level", label: "Level" },
    { value: "name", label: "Name" },
] as const;

function BossesLoadingFallback() {
    return (
        <SkeletonContainer announcement="Loading world boss tracker..." className={styles.page}>
            <div className={styles.skeletonCard}>
                <Skeleton variant="text" width="38%" height={28} />
                <Skeleton variant="rectangular" width="100%" height={84} />
            </div>
            <div className={styles.skeletonCard}>
                <Skeleton variant="rectangular" width="100%" height={52} />
                <div className={styles.skeletonRows}>
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <Skeleton key={idx} variant="rectangular" width="100%" height={56} />
                    ))}
                </div>
            </div>
        </SkeletonContainer>
    );
}

function BossesContent() {
    const state = useBossState();
    const {
        isLoading,
        activeBossView,
        activeCombatLevel,
        rows,
        sortCol,
        sortDesc,
        setSortDesc,
        handleSort,
        getSortDirection,
        openBoss,
        resetFilters,
        now,
    } = state;

    const sortArrow = (col: string) =>
        sortCol !== col
            ? <Icon name="sort" size="xs" aria-hidden="true" />
            : <Icon name={sortDesc ? "sortDesc" : "sortAsc"} size="xs" aria-hidden="true" />;

    return (
        <main className={`container ${styles.page}`}>
            <BossHeader state={state} />

            <div className={styles.viewport} style={{ minHeight: "520px", contain: "layout" }}>
                {isLoading ? (
                    <BossesLoadingFallback />
                ) : activeBossView === "planner" ? (
                    <WorldBossRoutinePlanner state={state} />
                ) : rows.length === 0 ? (
                    <EmptyState
                        variant="search-empty"
                        title="No matching world bosses"
                        description="Try clearing your search query or switching back to all spawn phases."
                        action={{ label: "Reset filters", onClick: resetFilters }}
                    />
                ) : (
                    <>
                        <div className={styles.desktopTable}>
                            <TableContainer ariaLabel="World boss timers and expected loot value">
                                <Table hoverable>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead align="left" aria-sort={getSortDirection("name")}>
                                                <button type="button" className={styles.sortButton} onClick={() => handleSort("name")}>
                                                    <span>Boss &amp; Zone</span>
                                                    {sortArrow("name")}
                                                </button>
                                            </TableHead>
                                            <TableHead align="left" aria-sort={getSortDirection("level")}>
                                                <button type="button" className={styles.sortButton} onClick={() => handleSort("level")}>
                                                    <span>Level</span>
                                                    {sortArrow("level")}
                                                </button>
                                            </TableHead>
                                            <TableHead align="left" aria-sort={getSortDirection("nextSpawnTime")}>
                                                <button type="button" className={styles.sortButton} onClick={() => handleSort("nextSpawnTime")}>
                                                    <span>Status &amp; Timer</span>
                                                    {sortArrow("nextSpawnTime")}
                                                </button>
                                            </TableHead>
                                            <TableHead align="left">Schedule</TableHead>
                                            <TableHead align="right" aria-sort={getSortDirection("ev")}>
                                                <button type="button" className={styles.sortButton} onClick={() => handleSort("ev")}>
                                                    <span>Expected Loot</span>
                                                    {sortArrow("ev")}
                                                </button>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row) => (
                                            <BossTableRow
                                                key={row.id || row.name}
                                                row={row}
                                                now={now}
                                                activeCombatLevel={activeCombatLevel}
                                                onSelect={openBoss}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>

                        <div className={styles.mobileCards}>
                            <div className={styles.mobileSortBar}>
                                <div className={styles.mobileSortHeader}>
                                    <span>Sort Bosses</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Icon name={sortDesc ? "chevronDown" : "chevronUp"} size="sm" aria-hidden="true" />}
                                        onClick={() => setSortDesc((current) => !current)}
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
                                            className={`${styles.phasePill} ${sortCol === opt.value ? styles.phasePillActive : ""}`.trim()}
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
                                    <BossCard
                                        key={row.id || row.name}
                                        row={row}
                                        now={now}
                                        activeCombatLevel={activeCombatLevel}
                                        onSelect={openBoss}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <BossDetailsModal state={state} />
            <BackToTop />
        </main>
    );
}

export default function BossesPage() {
    return (
        <Suspense fallback={<BossesLoadingFallback />}>
            <BossesContent />
        </Suspense>
    );
}
