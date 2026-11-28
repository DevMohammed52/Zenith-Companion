"use client";

import React, { Suspense } from "react";
import { BackToTop } from "@/components/ui/BackToTop";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePetsState } from "./hooks/usePetsState";
import { PetHero } from "./components/PetHero";
import { PetFilters } from "./components/PetFilters";
import { PetGrid } from "./components/PetGrid";
import { PetDetailModal } from "./components/PetDetailModal";
import { PetBattleModal } from "./components/PetBattleModal";
import { PetsGridSkeleton, PetsShellFallback } from "./components/PetsLoadingState";
import styles from "./Pets.module.css";

function PetsContent() {
  const state = usePetsState();

  return (
    <main className={styles.page}>
      <PetHero
        database={state.database}
        counts={state.counts}
        masteryBonus={state.masteryBonus}
        ownedPetCount={state.ownedPetCount}
        ownedSpeciesCount={state.ownedSpeciesCount}
        filteredCount={state.petRows.length}
        hasActiveFilters={state.hasActiveFilters}
      />

      <PetFilters
        searchTerm={state.searchTerm}
        setSearchTerm={state.setSearchTerm}
        qualityFilter={state.qualityFilter}
        setQualityFilter={state.setQualityFilter}
        sourceFilter={state.sourceFilter}
        setSourceFilter={state.setSourceFilter}
        sortBy={state.sortBy}
        setSortBy={state.setSortBy}
        sortDesc={state.sortDesc}
        setSortDesc={state.setSortDesc}
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        petLevel={state.petLevel}
        setPetLevel={state.setPetLevel}
        masteryLevel={state.masteryLevel}
        setMasteryLevel={state.setMasteryLevel}
        evolutionStage={state.evolutionStage}
        setEvolutionStage={state.setEvolutionStage}
        evolutionStat={state.evolutionStat}
        setEvolutionStat={state.setEvolutionStat}
        battleProfitMode={state.battleProfitMode}
        setBattleProfitMode={state.setBattleProfitMode}
        foodPolicy={state.foodPolicy}
        setFoodPolicy={state.setFoodPolicy}
        patBonus={state.patBonus}
        setPatBonus={state.setPatBonus}
        beastmaster={state.beastmaster}
        setBeastmaster={state.setBeastmaster}
        activeProfile={state.activeProfile}
        applyProfilePet={state.applyProfilePet}
        hasActiveFilters={state.hasActiveFilters}
        clearPetFilters={state.clearPetFilters}
        primaryControlsModified={state.primaryControlsModified}
        resetPetControls={state.resetPetControls}
        scenarioIsModified={state.scenarioIsModified}
        scenarioLabel={state.scenarioLabel}
        isSetupOpen={state.isSetupOpen}
        setIsSetupOpen={state.setIsSetupOpen}
      />

      {state.loadError && (
        <EmptyState
          variant="error"
          title="Pet database unavailable"
          description={state.loadError}
          action={{ label: "Reload page", onClick: () => window.location.reload() }}
        />
      )}

      {!state.database && !state.loadError && <PetsGridSkeleton />}

      {state.database && (
        <>
          <PetGrid
            petRows={state.petRows}
            paginatedRows={state.paginatedRows}
            viewMode={state.viewMode}
            hasActiveFilters={state.hasActiveFilters}
            clearPetFilters={state.clearPetFilters}
            setSelectedPetName={state.setSelectedPetName}
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onPageChange={state.setCurrentPage}
            pageSize={state.pageSize}
            onPageSizeChange={state.setPageSize}
          />

          {state.modalRootReady && state.selectedRow && (
            <PetDetailModal
              selectedRow={state.selectedRow}
              battleProfitMode={state.battleProfitMode}
              foodPolicy={state.foodPolicy}
              onClose={() => state.setSelectedPetName(null)}
              onSelectBattle={(selection) => state.setSelectedBattle(selection)}
            />
          )}

          {state.modalRootReady && state.selectedBattle && (
            <PetBattleModal
              selectedBattle={state.selectedBattle}
              selectedBattleDrops={state.selectedBattleDrops}
              battleProfitMode={state.battleProfitMode}
              foodPolicy={state.foodPolicy}
              beastmaster={state.beastmaster}
              onClose={() => state.setSelectedBattle(null)}
            />
          )}

          <BackToTop />
        </>
      )}
    </main>
  );
}

export default function PetsPage() {
  return (
    <Suspense fallback={<PetsShellFallback />}>
      <PetsContent />
    </Suspense>
  );
}
