"use client";

import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonContainer } from "@/components/ui/Skeleton";
import { usePetCompareState } from "./hooks/usePetCompareState";
import { CompareHero } from "./components/CompareHero";
import { SharedSetupPanel } from "./components/SharedSetupPanel";
import { CompareSlotsPanel } from "./components/CompareSlotsPanel";
import { CompareCards } from "./components/CompareCards";
import { CompareMetricsTable } from "./components/CompareMetricsTable";
import styles from "./page.module.css";

function CompareLoadingSkeleton() {
  return (
    <SkeletonContainer announcement="Loading pet comparison data" className={styles.skeletonStack}>
      <div className={styles.skeletonPanel}>
        <Skeleton variant="text" width="38%" height={22} />
        <div className={styles.skeletonGrid}>
          <Skeleton variant="rectangular" height={64} />
          <Skeleton variant="rectangular" height={64} />
        </div>
      </div>
      <div className={styles.skeletonPanel}>
        <Skeleton variant="text" width="30%" height={20} />
        <div className={styles.skeletonGrid}>
          <Skeleton variant="rectangular" height={72} />
          <Skeleton variant="rectangular" height={72} />
        </div>
      </div>
    </SkeletonContainer>
  );
}

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
        <Banner
          variant="error"
          action={{ label: "Retry", onClick: () => window.location.reload() }}
        >
          {state.loadError}
        </Banner>
      )}

      {!state.database && !state.loadError && <CompareLoadingSkeleton />}

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
            onAddPet={state.addPet}
            onResetScenario={state.resetScenario}
          />

          <CompareSlotsPanel
            slots={state.slots}
            compareOptions={state.compareOptions}
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
              variant="no-data"
              title="Pick pets to compare"
              description="Select up to 4 database pets or owned snapshots above, or tap a quick pick."
            />
          ) : (
            <>
              <CompareCards rows={state.rows} />
              <CompareMetricsTable rows={state.rows} metricBounds={state.metricBounds} />
            </>
          )}
        </>
      )}
    </main>
  );
}
