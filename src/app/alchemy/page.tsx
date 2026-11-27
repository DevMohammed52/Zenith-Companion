"use client";

import { Suspense } from "react";
import { BackToTop, Pagination, Skeleton } from "@/components/ui";
import { useAlchemyState } from "./hooks/useAlchemyState";
import { AlchemyHeader } from "./components/AlchemyHeader";
import { AlchemyToolbar } from "./components/AlchemyToolbar";
import { AlchemyTable } from "./components/AlchemyTable";
import { AlchemyCardGrid } from "./components/AlchemyCardGrid";
import { AlchemyEmptyState } from "./components/AlchemyEmptyState";
import { AlchemyLoadoutDrawer } from "./components/AlchemyLoadoutDrawer";
import { AlchemyStrategyModal } from "./components/AlchemyStrategyModal";
import styles from "./page.module.css";

function AlchemyContent() {
  const state = useAlchemyState();

  return (
    <div className={styles.pageShell}>
      <AlchemyHeader
        isLoading={state.isLoading}
        activeProfileName={state.activeProfileName}
        profileAlchemyLevel={state.profileAlchemyLevel}
        hasProfileAlchemyLevel={state.hasProfileAlchemyLevel}
        membership={state.membership}
        marketTaxRate={state.buffTotals.marketTaxRate}
        efficiencyBonus={state.buffTotals.efficiencyBonus}
        expBonus={state.buffTotals.expBonus}
        effectiveSessionHours={state.effectiveSessionHours}
        activeModifierCount={state.buffTotals.activeModifierCount}
        hasWhatIfOverrides={state.hasWhatIfOverrides}
        rateMode={state.rateMode}
        summary={state.summary}
        strategyCount={state.rows.length}
        queuedRecipeCount={state.queuedRecipeCount}
        queuedTotalUnits={state.queuedTotalUnits}
        staleMarket={state.staleMarket}
        dataAgeMinutes={state.dataAgeMinutes}
        onOpenDrawer={() => state.setDrawerOpen(true)}
        onSelectRow={state.openStrategyRow}
      />

      <AlchemyToolbar
        activeCategory={state.activeCategory}
        onCategoryChange={state.handleCategoryChange}
        categoryCounts={state.categoryCounts}
        searchTerm={state.searchTerm}
        onSearchChange={state.setSearchTerm}
        sortCol={state.sortCol}
        sortDesc={state.sortDesc}
        onSortSelect={state.handleSortSelect}
        onToggleSortDirection={state.toggleSortDirection}
        rateMode={state.rateMode}
        onRateModeChange={state.setRateMode}
        viewMode={state.viewMode}
        onViewModeChange={state.setViewMode}
        minLevel={state.minLevel}
        onMinLevelChange={state.setMinLevel}
        maxLevel={state.maxLevel}
        onMaxLevelChange={state.setMaxLevel}
        minProfit={state.minProfit}
        onMinProfitChange={state.setMinProfit}
        minVolume={state.minVolume}
        onMinVolumeChange={state.setMinVolume}
        liquidityFilter={state.liquidityFilter}
        onLiquidityChange={state.setLiquidityFilter}
        onlyProfitable={state.onlyProfitable}
        onToggleOnlyProfitable={() => state.setOnlyProfitable((prev) => !prev)}
        hideAboveLevel={state.hideAboveLevel}
        onToggleHideAboveLevel={() => state.setHideAboveLevel((prev) => !prev)}
        hasProfileAlchemyLevel={state.hasProfileAlchemyLevel}
        profileAlchemyLevel={state.profileAlchemyLevel}
        ownedCostMode={state.ownedCostMode}
        onToggleOwnedMode={() => state.setOwnedMode(!state.ownedCostMode)}
        hideMissing={state.hideMissing}
        onToggleHideMissing={() => state.setHideMissing((prev) => !prev)}
        advancedFilterCount={state.advancedFilterCount}
        hasActiveFilters={state.hasActiveFilters}
        filteredRowCount={state.rows.length}
        totalRowCount={state.allRows.length}
        profitableRowCount={state.profitableRowCount}
        onReset={state.resetAlchemyControls}
      />

      <section
        id="alchemy-results-panel"
        className={styles.resultsPanel}
        aria-label="Alchemy recipes"
      >
        {state.isLoading ? (
          <div className={styles.skeletonList} aria-busy="true">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} height="52px" variant="rectangular" />
            ))}
          </div>
        ) : state.rows.length === 0 ? (
          <AlchemyEmptyState
            mythicSearchMatches={state.mythicSearchMatches}
            onReset={state.resetAlchemyControls}
          />
        ) : (
          <>
            <div className={styles.desktopOnly}>
              {state.viewMode === "table" ? (
                <AlchemyTable
                  rows={state.pagedRows}
                  sortCol={state.sortCol}
                  sortDesc={state.sortDesc}
                  rateMode={state.rateMode}
                  effectiveSessionHours={state.effectiveSessionHours}
                  hasProfileAlchemyLevel={state.hasProfileAlchemyLevel}
                  profileAlchemyLevel={state.profileAlchemyLevel}
                  deferredSearchTerm={state.deferredSearchTerm}
                  queue={state.queue}
                  onSort={state.handleSort}
                  onSelectRow={state.openStrategyRow}
                  onOpenItem={state.openItemByName}
                  onPrefetchItem={state.prefetchItem}
                  onAddToQueue={state.addToQueue}
                />
              ) : (
                <AlchemyCardGrid
                  rows={state.pagedRows}
                  rateMode={state.rateMode}
                  effectiveSessionHours={state.effectiveSessionHours}
                  hasProfileAlchemyLevel={state.hasProfileAlchemyLevel}
                  profileAlchemyLevel={state.profileAlchemyLevel}
                  deferredSearchTerm={state.deferredSearchTerm}
                  queue={state.queue}
                  onSelectRow={state.openStrategyRow}
                  onOpenItem={state.openItemByName}
                  onPrefetchItem={state.prefetchItem}
                  onAddToQueue={state.addToQueue}
                />
              )}
            </div>

            <div className={styles.mobileOnly}>
              <AlchemyCardGrid
                rows={state.pagedRows}
                rateMode={state.rateMode}
                effectiveSessionHours={state.effectiveSessionHours}
                hasProfileAlchemyLevel={state.hasProfileAlchemyLevel}
                profileAlchemyLevel={state.profileAlchemyLevel}
                deferredSearchTerm={state.deferredSearchTerm}
                queue={state.queue}
                onSelectRow={state.openStrategyRow}
                onOpenItem={state.openItemByName}
                onPrefetchItem={state.prefetchItem}
                onAddToQueue={state.addToQueue}
              />
            </div>

            <Pagination
              currentPage={state.currentPage}
              totalPages={state.totalPages}
              onPageChange={state.setCurrentPage}
              totalItems={state.rows.length}
              pageSize={state.pageSize}
              pageSizeOptions={[15, 25, 51]}
              onPageSizeChange={state.setPageSize}
              showPageSize
              itemLabel="recipes"
            />
          </>
        )}
      </section>

      <AlchemyLoadoutDrawer
        isOpen={state.drawerOpen}
        onClose={() => state.setDrawerOpen(false)}
        hasConfiguredProfile={Boolean(state.configuredProfile)}
        activeProfileName={state.activeProfileName}
        profileClassName={state.profileClassName}
        profileAlchemyLevel={state.profileAlchemyLevel}
        parsedBartering={state.parsedBartering}
        profileBartering={state.profileBartering}
        barteringOverride={state.barteringOverride}
        onBarteringOverrideChange={state.setBarteringOverride}
        membership={state.membership}
        onMembershipChange={state.setMembership}
        classOverride={state.classOverride}
        onClassOverrideChange={state.setClassOverride}
        conquestOverride={state.conquestOverride}
        profileConquestRank={state.profileConquestRank}
        onConquestOverrideChange={state.setConquestOverride}
        ascensionBuffIds={state.ascensionBuffIds}
        onToggleAscension={state.toggleAscensionBuff}
        onClearAscension={state.clearAscensionBuffs}
        energizingPoolExp={state.energizingPoolExp}
        onEnergizingPoolChange={state.setEnergizingPoolExp}
        baseIdleHours={state.baseIdleHours}
        housingAlchemyHours={state.housingAlchemyHours}
        defaultSessionHours={state.defaultSessionHours}
        customSessionHours={state.customSessionHours}
        onCustomSessionHoursChange={state.setCustomSessionHours}
        sessionHoursSource={state.sessionHoursSource}
        hasWhatIfOverrides={state.hasWhatIfOverrides}
        onResetLoadout={state.resetLoadoutToProfile}
        buffTotals={state.buffTotals}
      />

      <AlchemyStrategyModal
        row={state.selectedRow}
        marketTaxRate={state.buffTotals.marketTaxRate}
        sessionHours={state.effectiveSessionHours}
        ownedCostMode={state.ownedCostMode}
        onClose={state.closeStrategyRow}
        onOpenItem={state.openItemByName}
        onToggleOwned={(materialName) =>
          state.selectedRow && state.toggleOwnedMaterial(state.selectedRow.name, materialName)
        }
        onAddToQueue={state.addToQueue}
      />

      <BackToTop />
    </div>
  );
}

export default function AlchemyPage() {
  return (
    <main className="container" aria-labelledby="alchemy-page-title">
      <Suspense fallback={<Skeleton height="420px" variant="rectangular" />}>
        <AlchemyContent />
      </Suspense>
    </main>
  );
}
