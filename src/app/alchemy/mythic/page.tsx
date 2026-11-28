"use client";

import { Suspense } from "react";
import { BackToTop, Skeleton, Tab, TabList, Tabs } from "@/components/ui";
import { MythicCatalogPanel } from "./components/MythicCatalogPanel";
import { MythicHeader } from "./components/MythicHeader";
import { MythicLoadoutDrawer } from "./components/MythicLoadoutDrawer";
import { MythicPinnedPanel } from "./components/MythicPinnedPanel";
import { useMythicAlchemyState } from "./hooks/useMythicAlchemyState";
import type { MythicWorkspaceTab } from "./types";
import styles from "./page.module.css";

function MythicAlchemyContent() {
  const state = useMythicAlchemyState();

  return (
    <main className={`container ${styles.pageShell}`} aria-labelledby="mythic-lab-page-title">
      <MythicHeader
        isLoading={state.isLoading}
        activeProfileName={state.activeProfileName}
        hasConfiguredProfile={state.hasConfiguredProfile}
        hasProfileAlchemyLevel={state.hasProfileAlchemyLevel}
        profileAlchemyLevel={state.profileAlchemyLevel}
        effectiveMembership={state.effectiveMembership}
        taxRate={state.taxRate}
        buffTotals={state.buffTotals}
        hasWhatIfOverrides={state.hasWhatIfOverrides}
        mythicCraftTimeSeconds={state.mythicCraftTimeSeconds}
        mythicRecipesCount={state.mythicRecipes.length}
        activeRowsCount={state.activeRows.length}
        labStats={state.labStats}
        labSummary={state.labSummary}
        queuedTotalUnits={state.queuedTotalUnits}
        staleMarket={state.staleMarket}
        dataAgeMinutes={state.dataAgeMinutes}
        onOpenDrawer={() => state.setDrawerOpen(true)}
        onSelectTab={state.switchTab}
        onOpenItem={state.openItemByName}
      />

      <Tabs
        value={state.activeTab}
        onValueChange={(val) => state.switchTab(val as MythicWorkspaceTab)}
        sharedPanelId="mythic-workspace-panel"
        className={styles.workspaceTabs}
      >
        <TabList aria-label="Mythic Lab sections">
          <Tab value="catalog">All 21 Recipes ({state.allCatalogRows.length})</Tab>
          <Tab value="pinned">Pinned Projects ({state.activeRows.length})</Tab>
        </TabList>
      </Tabs>

      <section id="mythic-workspace-panel" aria-label="Mythic Lab workspace">
        {state.isLoading ? (
          <div className={styles.skeletonStack} aria-busy="true">
            <Skeleton height="92px" variant="rectangular" />
            <Skeleton height="560px" variant="rectangular" />
          </div>
        ) : state.activeTab === "catalog" ? (
          <MythicCatalogPanel
            rows={state.filteredCatalogRows}
            totalCount={state.allCatalogRows.length}
            categoryCounts={state.categoryCounts}
            category={state.catalogCategory}
            onCategoryChange={state.setCatalogCategory}
            search={state.catalogSearch}
            onSearchChange={state.setCatalogSearch}
            sortCol={state.catalogSortCol}
            sortDesc={state.catalogSortDesc}
            onSort={state.handleCatalogSort}
            onSortSelect={state.handleCatalogSortSelect}
            onToggleSortDirection={state.toggleCatalogSortDirection}
            viewMode={state.catalogViewMode}
            onViewModeChange={state.setCatalogViewMode}
            includeScrollCost={state.catalogIncludeScrollCost}
            onToggleIncludeScrollCost={state.setCatalogIncludeScrollCost}
            onlyProfitable={state.catalogOnlyProfitable}
            onToggleOnlyProfitable={() => state.setCatalogOnlyProfitable((prev) => !prev)}
            hideMissing={state.catalogHideMissing}
            onToggleHideMissing={() => state.setCatalogHideMissing((prev) => !prev)}
            hasActiveFilters={state.hasActiveCatalogFilters}
            onResetFilters={state.resetCatalogFilters}
            onPinRecipe={(recipe) => state.addToLab(recipe, false)}
            onRemovePinned={state.removeFromLab}
            onOpenItem={state.openItemByName}
            onPrefetchItem={state.prefetchItem}
          />
        ) : (
          <MythicPinnedPanel
            activeRows={state.activeRows}
            recommendedPreview={state.recommendedPreview}
            labSummary={state.labSummary}
            recipeCostMode={state.recipeCostMode}
            setRecipeCostMode={state.setRecipeCostMode}
            expandedProjectNames={state.expandedProjectNames}
            taxNetPercent={state.taxNetPercent}
            taxRate={state.taxRate}
            effectiveBartering={state.effectiveBartering}
            onBrowseCatalog={() => state.switchTab("catalog")}
            onPinRecipe={(recipe) => state.addToLab(recipe, true)}
            onRemoveProject={state.removeFromLab}
            onToggleDetails={state.toggleProjectDetails}
            onOpenItem={state.openItemByName}
            onUpdateRecipePrice={state.updateRecipePrice}
            onUpdateMaterialPrice={state.updateMaterialPrice}
            onUpdateSellPrice={state.updateSellPrice}
            onSetRecipeUses={state.setRecipeUses}
          />
        )}
      </section>

      <MythicLoadoutDrawer
        isOpen={state.drawerOpen}
        onClose={() => state.setDrawerOpen(false)}
        hasConfiguredProfile={state.hasConfiguredProfile}
        activeProfileName={state.activeProfileName}
        profileClassName={state.profileClassName}
        profileAlchemyLevel={state.profileAlchemyLevel}
        effectiveBartering={state.effectiveBartering}
        profileBartering={state.profileBarteringBoost}
        effectiveMembership={state.effectiveMembership}
        preferencesMembership={state.preferencesMembership}
        profileConquestRank={state.profileConquestRank}
        loadout={state.loadout}
        onUpdateLoadout={state.setLoadout}
        onToggleAscension={state.toggleAscensionBuff}
        baseIdleHours={state.baseIdleHours}
        housingAlchemyHours={state.housingAlchemyHours}
        defaultSessionHours={state.defaultSessionHours}
        sessionHoursSource={state.sessionHoursSource}
        hasWhatIfOverrides={state.hasWhatIfOverrides}
        onResetLoadout={state.resetLoadoutToProfile}
        buffTotals={state.buffTotals}
      />
      <BackToTop />
    </main>
  );
}

export default function MythicAlchemyPage() {
  return (
    <Suspense fallback={<main className={`container ${styles.pageShell}`}><Skeleton height="1000px" variant="rectangular" /></main>}>
      <MythicAlchemyContent />
    </Suspense>
  );
}
