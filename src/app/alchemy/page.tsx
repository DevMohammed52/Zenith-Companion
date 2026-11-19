"use client";

import React, { Suspense } from "react";
import { useAlchemyState } from "./hooks/useAlchemyState";
import { AlchemyHeader } from "./components/AlchemyHeader";
import { AlchemySummaryGrid } from "./components/AlchemySummaryGrid";
import { AlchemyControls } from "./components/AlchemyControls";
import { AlchemyTable } from "./components/AlchemyTable";
import { AlchemyMobileCards } from "./components/AlchemyMobileCards";
import { AlchemyEmptyState } from "./components/AlchemyEmptyState";
import { AlchemyStrategyModal } from "./components/AlchemyStrategyModal";

function AlchemyContent() {
  const state = useAlchemyState();

  return (
    <>
      <AlchemyHeader
        strategyCount={state.rows.length}
        staleMarket={state.staleMarket}
        dataAgeMinutes={state.dataAgeMinutes}
      />

      <AlchemySummaryGrid
        summary={state.summary}
        onSelectRow={state.setSelectedRow}
      />

      <AlchemyControls
        searchTerm={state.searchTerm}
        onSearchChange={state.setSearchTerm}
        onClearSearch={() => state.setSearchTerm("")}
        minLevel={state.minLevel}
        onMinLevelChange={state.setMinLevel}
        maxLevel={state.maxLevel}
        onMaxLevelChange={state.setMaxLevel}
        minProfit={state.minProfit}
        onMinProfitChange={state.setMinProfit}
        minVolume={state.minVolume}
        onMinVolumeChange={state.setMinVolume}
        parsedBartering={state.parsedBartering}
        activeProfileName={state.activeProfileName}
        onlyProfitable={state.onlyProfitable}
        onToggleOnlyProfitable={() => state.setOnlyProfitable((prev) => !prev)}
        hideMissing={state.hideMissing}
        onToggleHideMissing={() => state.setHideMissing((prev) => !prev)}
        ownedCostMode={state.ownedCostMode}
        onToggleOwnedMode={() => state.setOwnedMode(!state.ownedCostMode)}
        parsedActiveHours={state.parsedActiveHours}
        activeHoursSource={state.activeHoursSource}
        liquidityFilter={state.liquidityFilter}
        onSelectLiquidityFilter={state.setLiquidityFilter}
        activeFilterCount={state.activeFilterCount}
        totalRowCount={state.allRows.length}
        filteredRowCount={state.rows.length}
        profitableRowCount={state.profitableRowCount}
        marketRowCount={state.marketRowCount}
        currentSortLabel={state.currentSortLabel}
        sortDesc={state.sortDesc}
        hasActiveFilters={state.hasActiveFilters}
        onReset={state.resetAlchemyControls}
      />

      <section className="table-wrapper">
        <AlchemyTable
          rows={state.rows}
          sortCol={state.sortCol}
          sortDesc={state.sortDesc}
          onSort={state.handleSort}
          deferredSearchTerm={state.deferredSearchTerm}
          onSelectRow={state.setSelectedRow}
          onOpenItem={state.openItemByName}
          onPrefetchItem={state.prefetchItem}
        />

        <AlchemyMobileCards
          rows={state.rows}
          sortCol={state.sortCol}
          sortDesc={state.sortDesc}
          onSort={state.handleSort}
          onToggleDirection={() => state.setSortDesc((prev) => !prev)}
          deferredSearchTerm={state.deferredSearchTerm}
          onSelectRow={state.setSelectedRow}
        />

        {state.rows.length === 0 && (
          <AlchemyEmptyState mythicSearchMatches={state.mythicSearchMatches} />
        )}
      </section>

      {state.selectedRow && (
        <AlchemyStrategyModal
          row={state.selectedRow}
          marketTaxRate={state.marketTaxRate}
          activeHours={state.parsedActiveHours}
          ownedCostMode={state.ownedCostMode}
          onClose={() => state.setSelectedRow(null)}
          onOpenItem={state.openItemByName}
          onToggleOwned={(materialName) =>
            state.toggleOwnedMaterial(state.selectedRow!.name, materialName)
          }
        />
      )}
    </>
  );
}

export default function AlchemyPage() {
  return (
    <main className="container alchemy-page-shell" aria-labelledby="alchemy-page-title">
      <Suspense fallback={<div className="loading-state">Loading Alchemy Data...</div>}>
        <AlchemyContent />
      </Suspense>
    </main>
  );
}
