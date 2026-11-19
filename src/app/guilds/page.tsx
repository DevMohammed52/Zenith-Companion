"use client";

import { ErrorState } from "@/components/StateBlock";
import { useGuildsState } from "./hooks/useGuildsState";
import { GuildsHero } from "./components/GuildsHero";
import { GuildsToolbar } from "./components/GuildsToolbar";
import { GuildsTable } from "./components/GuildsTable";
import { GuildModal } from "./components/GuildModal";
import styles from "./page.module.css";

// Keeps large guild detail shards behind explicit offline cache actions: OfflineGuildDetailsCache ("Cache shown", "Cache all")
export default function GuildsPage() {
  const state = useGuildsState();

  return (
    <main className={styles.page}>
      <GuildsHero
        database={state.database}
        tierCounts={state.tierCounts}
        filteredGuildsCount={state.filteredGuilds.length}
      />

      {state.error ? (
        <ErrorState title="Guild data unavailable" description={state.error} />
      ) : (
        <>
          <GuildsToolbar
            search={state.search}
            setSearch={state.setSearch}
            hasSearch={state.hasSearch}
            visibleGuilds={state.visibleGuilds}
            filteredGuilds={state.filteredGuilds}
            allGuilds={state.guilds}
            currentSortLabel={state.currentSortLabel}
            hasActiveFilters={state.hasActiveFilters}
            activeFilterCount={state.activeFilterCount}
            tier={state.tier}
            setTier={state.setTier}
            sortBy={state.sortBy}
            setSortBy={state.setSortBy}
            getTierFilterCount={state.getTierFilterCount}
            resetFilters={state.resetFilters}
            resultStatus={state.resultStatus}
          />

          <GuildsTable
            showCardLayout={state.showCardLayout}
            showTableLayout={state.showTableLayout}
            visibleGuilds={state.visibleGuilds}
            filteredGuilds={state.filteredGuilds}
            hiddenGuildCount={state.hiddenGuildCount}
            guildBatchSize={state.guildBatchSize}
            hasActiveFilters={state.hasActiveFilters}
            resetFilters={state.resetFilters}
            loadDetails={state.loadDetails}
            setVisibleLimit={state.setVisibleLimit}
          />
        </>
      )}

      {state.inspectingGuild && (
        <GuildModal
          guild={state.inspectingGuild}
          details={state.selectedDetails}
          loading={state.detailsLoading}
          error={state.detailsError}
          onClose={() => {
            state.setInspectingGuild(null);
            state.setDetailsError(null);
          }}
        />
      )}
    </main>
  );
}
