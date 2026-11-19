"use client";

import { PawPrint } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateBlock";
import { usePetCompareState } from "./hooks/usePetCompareState";
import { CompareHero } from "./components/CompareHero";
import { SharedSetupPanel } from "./components/SharedSetupPanel";
import { CompareSlotsPanel } from "./components/CompareSlotsPanel";
import { CompareCards } from "./components/CompareCards";
import { CompareMetricsTable } from "./components/CompareMetricsTable";
import styles from "./page.module.css";

export default function PetComparisonPage() {
  const state = usePetCompareState();

  return (
    <main className={styles.page} aria-labelledby="pet-compare-page-title">
      <CompareHero
        selectedCount={state.rows.length}
        ownedPoolCount={state.activeProfile?.ownedPets?.length || 0}
        petsWithBattleCount={state.battleCoverage.petsWithBattle || 0}
        onClearComparison={state.clearAllSelected}
      />

      {state.loadError && (
        <ErrorState title="Pet comparison data unavailable" description={state.loadError} />
      )}
      {!state.database && !state.loadError && (
        <LoadingState
          title="Loading pet comparison data"
          description="Preparing pet stats, sources, battle samples, and market listings."
        />
      )}

      {state.database && (
        <>
          <SharedSetupPanel
            activeProfile={state.activeProfile}
            profilePetOption={state.profilePetOption}
            scenarioModified={state.scenarioModified}
            scenarioSummary={state.scenarioSummary}
            isCompactViewport={state.isCompactViewport}
            petLevel={state.petLevel}
            setPetLevel={state.setPetLevel}
            masteryLevel={state.masteryLevel}
            setMasteryLevel={state.setMasteryLevel}
            evolutionStage={state.evolutionStage}
            setEvolutionStage={state.setEvolutionStage}
            evolutionStat={state.evolutionStat}
            setEvolutionStat={state.setEvolutionStat}
            battleMode={state.battleMode}
            setBattleMode={state.setBattleMode}
            battleZone={state.battleZone}
            setBattleZone={state.setBattleZone}
            battleZoneOptions={state.battleZoneOptions}
            foodPolicy={state.foodPolicy}
            setFoodPolicy={state.setFoodPolicy}
            patBonus={state.patBonus}
            setPatBonus={state.setPatBonus}
            openMenu={state.openMenu}
            setOpenMenu={state.setOpenMenu}
            battleCoverage={state.battleCoverage}
            rowsCount={state.rows.length}
            onAddPet={state.addPet}
            onResetScenario={state.resetScenario}
          />

          <CompareSlotsPanel
            slots={state.slots}
            compareOptions={state.compareOptions}
            openMenu={state.openMenu}
            setOpenMenu={state.setOpenMenu}
            onSetSlot={state.setSlot}
            onClearSlot={state.clearSlot}
            unavailableSelectedIds={state.unavailableSelectedIds}
            onRemoveUnavailable={() =>
              state.setSelectedIds((current) =>
                current.filter((id) => !state.unavailableSelectedIds.includes(id)),
              )
            }
            unmatchedOwnedPetCount={state.unmatchedOwnedPetCount}
            unmatchedOwnedPetNames={state.unmatchedOwnedPetNames}
            topPicks={state.topPicks}
            selectedIds={state.selectedIds}
            onAddPet={state.addPet}
            comparisonSummary={state.comparisonSummary}
            rowsCount={state.rows.length}
          />

          {state.rows.length === 0 ? (
            <EmptyState
              title="Select a pet to preview, add another to compare"
              description="Use the quick picks or search by pet, boss, source, rarity, or exchange listing."
              icon={PawPrint}
            />
          ) : (
            <>
              <CompareCards rows={state.rows} battleZone={state.battleZone} />
              <CompareMetricsTable rows={state.rows} metricBounds={state.metricBounds} />
            </>
          )}
        </>
      )}
    </main>
  );
}
