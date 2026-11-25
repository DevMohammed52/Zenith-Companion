"use client";

import React, { Suspense } from "react";
import { useEnemiesState } from "./hooks/useEnemiesState";
import { EnemiesHeader } from "./components/EnemiesHeader";
import { EnemiesControls } from "./components/EnemiesControls";
import { EnemiesGrid } from "./components/EnemiesGrid";
import { EnemyDetailModal } from "./components/EnemyDetailModal";
import { BackToTop } from "@/components/ui/BackToTop";
import styles from "./Enemies.module.css";

function EnemiesContent() {
  const state = useEnemiesState();

  return (
    <main className={styles.page} aria-labelledby="enemy-db-page-title">
      <div
        className={styles.shell}
        inert={state.selectedEnemy ? true : undefined}
        aria-hidden={state.selectedEnemy ? true : undefined}
      >
        <EnemiesHeader
          stats={state.stats}
          filteredEnemiesCount={state.filteredEnemies.length}
        />

        <EnemiesControls
          query={state.query}
          setQuery={state.setQuery}
          selectedLocation={state.selectedLocation}
          setSelectedLocation={state.setSelectedLocation}
          matchFilter={state.matchFilter}
          setMatchFilter={state.setMatchFilter}
          levelFilter={state.levelFilter}
          setLevelFilter={state.setLevelFilter}
          sortKey={state.sortKey}
          setSortKey={state.setSortKey}
          sortDesc={state.sortDesc}
          setSortDesc={state.setSortDesc}
          locationOptions={state.locationOptions}
          activeFilterCount={state.activeFilterCount}
          hasCustomSort={state.hasCustomSort}
          hasActiveControls={state.hasActiveControls}
          resetControls={state.resetControls}
          filteredCount={state.filteredEnemies.length}
          isCompactViewport={state.isCompactViewport}
        />

        <EnemiesGrid
          loading={state.loading}
          enemiesCount={state.enemies.length}
          filteredEnemies={state.filteredEnemies}
          paginatedEnemies={state.paginatedEnemies}
          hasActiveControls={state.hasActiveControls}
          resetControls={state.resetControls}
          onSelectEnemy={state.setSelectedEnemy}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          pageSize={state.pageSize}
          onPageChange={state.setCurrentPage}
          onPageSizeChange={state.setPageSize}
        />
      </div>

      {state.selectedEnemy && (
        <EnemyDetailModal
          enemy={state.selectedEnemy}
          marketData={state.marketData}
          onClose={() => state.setSelectedEnemy(null)}
          onOpenItem={(name) => {
            state.setSelectedEnemy(null);
            state.openItemByName(name);
          }}
        />
      )}

      <BackToTop label="Scroll back to top of enemy bestiary" />
    </main>
  );
}

export default function EnemiesPage() {
  return (
    <Suspense
      fallback={(
        <main className={styles.page}>
          <div className={styles.fallbackState}>Loading enemy bestiary...</div>
        </main>
      )}
    >
      <EnemiesContent />
    </Suspense>
  );
}
