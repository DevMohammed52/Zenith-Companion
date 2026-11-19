"use client";

import React from "react";
import { useMythicAlchemyState } from "./hooks/useMythicAlchemyState";
import { MythicHeader } from "./components/MythicHeader";
import { MythicStatusTiles } from "./components/MythicStatusTiles";
import { MythicLabSummary } from "./components/MythicLabSummary";
import { MythicRecommendedRail } from "./components/MythicRecommendedRail";
import { MythicEmptyBench } from "./components/MythicEmptyBench";
import { MythicProjectCard } from "./components/MythicProjectCard";
import styles from "./page.module.css";

export default function MythicAlchemyPage() {
  const state = useMythicAlchemyState();

  return (
    <main className={`container ${styles.container}`} aria-labelledby="mythic-lab-page-title">
      <MythicHeader
        activeProfile={state.activeProfile}
        taxNetPercent={state.taxNetPercent}
        mythicCraftTimeSeconds={state.mythicCraftTimeSeconds}
        isSearchOpen={state.isSearchOpen}
        setIsSearchOpen={state.setIsSearchOpen}
        searchRef={state.searchRef}
        searchTriggerRef={state.searchTriggerRef}
        availableMythics={state.availableMythics}
        searchTerm={state.searchTerm}
        setSearchTerm={state.setSearchTerm}
        activeRecipeIndex={state.activeRecipeIndex}
        setActiveRecipeIndex={state.setActiveRecipeIndex}
        activeRecipeOptionId={state.activeRecipeOptionId}
        handleRecipeSearchKeyDown={state.handleRecipeSearchKeyDown}
        addToLab={state.addToLab}
        mythicRecipesCount={state.mythicRecipes.length}
      />

      <MythicStatusTiles
        activeRowsCount={state.activeRows.length}
        labStats={state.labStats}
        mythicRecipesCount={state.mythicRecipes.length}
      />

      <MythicLabSummary
        labSummary={state.labSummary}
        activeRowsCount={state.activeRows.length}
        mythicRecipesCount={state.mythicRecipes.length}
        recipeCostMode={state.recipeCostMode}
        setRecipeCostMode={state.setRecipeCostMode}
      />

      {state.activeRows.length > 0 && state.recommendedPreview.length > 0 && (
        <MythicRecommendedRail
          recommendedPreview={state.recommendedPreview}
          addToLab={state.addToLab}
        />
      )}

      <div className={styles.labGrid}>
        {state.activeRows.length === 0 ? (
          <MythicEmptyBench
            onOpenSearch={() => state.setIsSearchOpen(true)}
            recommendedRecipes={state.recommendedRecipes}
            recommendedPreview={state.recommendedPreview}
            addToLab={state.addToLab}
          />
        ) : (
          state.activeRows.map((row) => (
            <MythicProjectCard
              key={row.recipe.resultName}
              row={row}
              isProjectExpanded={state.expandedProjectNames.includes(row.recipe.resultName)}
              taxNetPercent={state.taxNetPercent}
              taxRate={state.taxRate}
              profileBarteringBoost={state.profileBarteringBoost}
              onRemove={state.removeFromLab}
              onToggleDetails={state.toggleProjectDetails}
              onOpenItem={state.openItemByName}
              onUpdateRecipePrice={state.updateRecipePrice}
              onUpdateMaterialPrice={state.updateMaterialPrice}
              onUpdateSellPrice={state.updateSellPrice}
              onSetRecipeUses={state.setRecipeUses}
            />
          ))
        )}
      </div>
    </main>
  );
}
