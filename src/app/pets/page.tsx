"use client";

import { ErrorState, LoadingState } from "@/components/StateBlock";
import { usePetsState } from "./hooks/usePetsState";
import { PetHero } from "./components/PetHero";
import { PetFilters } from "./components/PetFilters";
import { PetSignalRow } from "./components/PetSignalRow";
import { PetGrid } from "./components/PetGrid";
import { PetDetailModal } from "./components/PetDetailModal";
import { PetBattleModal } from "./components/PetBattleModal";

export default function PetsPage() {
  const state = usePetsState();

  return (
    <main className="pets-page">
      <PetHero
        database={state.database}
        counts={state.counts}
        masteryBonus={state.masteryBonus}
        ownedSpeciesCount={state.ownedSpeciesCount}
      />

      <PetFilters
        hasActiveFilters={state.hasActiveFilters}
        activeFilterCount={state.activeFilterCount}
        visibleCount={state.petRows.length}
        primaryControlsModified={state.primaryControlsModified}
        resetPetControls={state.resetPetControls}
        searchTerm={state.searchTerm}
        setSearchTerm={state.setSearchTerm}
        isCompactViewport={state.isCompactViewport}
        qualityFilter={state.qualityFilter}
        setQualityFilter={state.setQualityFilter}
        sourceFilter={state.sourceFilter}
        setSourceFilter={state.setSourceFilter}
        sortBy={state.sortBy}
        setSortBy={state.setSortBy}
        sortDesc={state.sortDesc}
        setSortDesc={state.setSortDesc}
        openPetSelect={state.openPetSelect}
        setOpenPetSelect={state.setOpenPetSelect}
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
        ownedPetCount={state.ownedPetCount}
      />

      {state.loadError && (
        <ErrorState title="Pet database unavailable" description={state.loadError} />
      )}
      {!state.database && !state.loadError && (
        <LoadingState
          title="Loading pet database"
          description="Preparing pet stats, exchange listings, ownership matches, and battle samples."
        />
      )}

      {state.database && (
        <>
          <PetSignalRow
            petRowsCount={state.petRows.length}
            bestHunter={state.bestHunter}
            battleResearchPetCount={state.battleResearchPetCount}
            bestMarket={state.bestMarket}
            ownedPetCount={state.ownedPetCount}
            ownedSpeciesCount={state.ownedSpeciesCount}
            resultAnnouncement={state.resultAnnouncement}
            scenarioIsModified={state.scenarioIsModified}
            scenarioLabel={state.scenarioLabel}
          />

          <div className="pets-content">
            <PetGrid
              petRows={state.petRows}
              visiblePetRows={state.visiblePetRows}
              hiddenPetCount={state.hiddenPetCount}
              viewMode={state.viewMode}
              hasActiveFilters={state.hasActiveFilters}
              searchTerm={state.searchTerm}
              qualityFilter={state.qualityFilter}
              sourceFilter={state.sourceFilter}
              clearPetFilters={state.clearPetFilters}
              setSelectedPetName={state.setSelectedPetName}
              setVisiblePetCount={state.setVisiblePetCount}
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
          </div>

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
        </>
      )}
    </main>
  );
}
