"use client";

import React, { useState } from "react";
import { BackToTop, Card, EmptyState, Skeleton, SkeletonContainer } from "@/components/ui";
import { useGuildsState } from "./hooks/useGuildsState";
import { GuildsHeader } from "./components/GuildsHeader";
import { GuildSpotlight } from "./components/GuildSpotlight";
import { GuildsToolbar } from "./components/GuildsToolbar";
import { GuildsTable } from "./components/GuildsTable";
import { GuildModal } from "./components/GuildModal";
import { GuildGuideModal } from "./components/GuildGuideModal";
import styles from "./page.module.css";

// Keeps large guild detail shards behind explicit offline cache actions: OfflineGuildDetailsCache ("Cache shown", "Cache all") inside GuildGuideModal.
function GuildsLoadingSkeleton() {
  return (
    <SkeletonContainer busy className={styles.shell}>
      <Card padding="md">
        <div className={styles.skeletonStack}>
          <Skeleton height={20} width="140px" />
          <Skeleton height={34} width="260px" />
          <Skeleton height={22} width="75%" />
        </div>
      </Card>
      <Card padding="md">
        <div className={styles.skeletonGrid}>
          <Skeleton height={160} width="100%" />
          <Skeleton height={160} width="100%" />
          <Skeleton height={160} width="100%" />
        </div>
      </Card>
      <Card padding="md">
        <div className={styles.skeletonStack}>
          <Skeleton height={44} width="100%" />
          <Skeleton height={320} width="100%" />
        </div>
      </Card>
    </SkeletonContainer>
  );
}

export default function GuildsPage() {
  const state = useGuildsState();
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <main className={styles.page}>
      {!state.database && !state.error ? (
        <GuildsLoadingSkeleton />
      ) : (
        <div className={styles.shell}>
          <GuildsHeader
            database={state.database}
            conquestGuildCount={state.conquestGuildCount}
            openSlotsGuildCount={state.openSlotsGuildCount}
            onOpenGuide={() => setGuideOpen(true)}
          />

          {state.error ? (
            <Card padding="md">
              <EmptyState
                variant="error"
                title="Guild data unavailable"
                description={state.error}
                action={{ label: "Retry", onClick: state.retryLoad }}
              />
            </Card>
          ) : (
            <>
              <GuildSpotlight
                yourGuild={state.yourGuild}
                seasonTopThree={state.seasonTopThree}
                onInspect={state.loadDetails}
              />

              <GuildsToolbar
                search={state.search}
                setSearch={state.setSearch}
                visibleGuilds={state.visibleGuilds}
                filteredGuilds={state.filteredGuilds}
                tier={state.tier}
                setTier={state.setTier}
                sortBy={state.sortBy}
                setSortBy={state.setSortBy}
                onlyOpenSlots={state.onlyOpenSlots}
                setOnlyOpenSlots={state.setOnlyOpenSlots}
                onlyConquest={state.onlyConquest}
                setOnlyConquest={state.setOnlyConquest}
                viewMode={state.viewMode}
                setViewMode={state.setViewMode}
                isCompactViewport={state.isCompactViewport}
                hasActiveFilters={state.hasActiveFilters}
                getTierFilterCount={state.getTierFilterCount}
                resetFilters={state.resetFilters}
                resultStatus={state.resultStatus}
              />

              <GuildsTable
                showCardLayout={state.showCardLayout}
                showTableLayout={state.showTableLayout}
                visibleGuilds={state.visibleGuilds}
                filteredGuilds={state.filteredGuilds}
                sortBy={state.sortBy}
                setSortBy={state.setSortBy}
                page={state.page}
                pageSize={state.pageSize}
                totalPages={state.totalPages}
                setPage={state.setPage}
                setPageSize={state.setPageSize}
                hasActiveFilters={state.hasActiveFilters}
                resetFilters={state.resetFilters}
                loadDetails={state.loadDetails}
              />
            </>
          )}
        </div>
      )}

      {state.inspectingGuild && (
        <GuildModal
          guild={state.inspectingGuild}
          details={state.selectedDetails}
          loading={state.detailsLoading}
          error={state.detailsError}
          onRetry={state.loadDetails}
          onClose={() => {
            state.setInspectingGuild(null);
            state.setDetailsError(null);
          }}
        />
      )}

      <GuildGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        shownGuilds={state.visibleGuilds}
        allGuilds={state.guilds}
      />

      <BackToTop label="Back to top" />
    </main>
  );
}
