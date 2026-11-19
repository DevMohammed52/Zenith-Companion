"use client";

import { useBisState } from "./hooks/useBisState";
import { BisStyles } from "./components/BisStyles";
import { BisHero } from "./components/BisHero";
import { BisToolbar } from "./components/BisToolbar";
import { BisRecommendations } from "./components/BisRecommendations";
import { BisGearList } from "./components/BisGearList";
import { BisComparePanel } from "./components/BisComparePanel";

export default function BisPage() {
  const state = useBisState();

  return (
    <main className="container bis-page" aria-labelledby="bis-page-title">
      <BisHero
        statusMessage={state.statusMessage}
        activeProfileName={state.activeProfileName}
        activeStyleLabel={state.activeStyleLabel}
        priorityLabel={state.priorityLabel}
        dataSourceLabel={state.dataSourceLabel}
        filteredGearCount={state.filteredGear.length}
        usableGearCount={state.usableGearCount}
        recommendationReadinessLabel={state.recommendationReadinessLabel}
        totalRecommendedCost={state.totalRecommendedCost}
        focusSearch={state.focusSearch}
        showUsableRecommendations={state.showUsableRecommendations}
        jumpToComparison={state.jumpToComparison}
      />

      <BisToolbar
        search={state.search}
        setSearch={state.setSearch}
        searchInputRef={state.searchInputRef}
        activeCombatStyle={state.activeCombatStyle}
        setCombatStyle={state.setCombatStyle}
        priority={state.priority}
        setPriority={state.setPriority}
        profileCombatLevel={state.profileCombatLevel}
        profileStrength={state.profileStrength}
        profileDexterity={state.profileDexterity}
        profileDefence={state.profileDefence}
        handleLevelChange={state.handleLevelChange}
      />

      <BisRecommendations
        recommendationPanelRef={state.recommendationPanelRef}
        totalRecommendedCost={state.totalRecommendedCost}
        recommendationReadinessLabel={state.recommendationReadinessLabel}
        priorityLabel={state.priorityLabel}
        activeSlots={state.activeSlots}
        recommendations={state.recommendations}
        activeCombatStyle={state.activeCombatStyle}
        onSelectGear={state.selectGear}
      />

      <section className="bis-layout">
        <BisGearList
          gearListPanelRef={state.gearListPanelRef}
          filteredGear={state.filteredGear}
          visibleGear={state.visibleGear}
          selected={state.selected}
          usableOnly={state.usableOnly}
          setUsableOnly={state.setUsableOnly}
          usableGearCount={state.usableGearCount}
          slotFilter={state.slotFilter}
          slotButtonRefs={state.slotButtonRefs}
          changeSlotFilter={state.changeSlotFilter}
          sortKey={state.sortKey}
          setSortKey={state.setSortKey}
          direction={state.direction}
          setDirection={state.setDirection}
          mobileSelectionHint={state.mobileSelectionHint}
          selectGear={state.selectGear}
          prefetchGearItem={state.prefetchGearItem}
          setVisibleGearCount={state.setVisibleGearCount}
        />

        <BisComparePanel
          comparePanelRef={state.comparePanelRef}
          selected={state.selected}
          effectiveCandidateTier={state.effectiveCandidateTier}
          selectedMaxTier={state.selectedMaxTier}
          candidateTier={state.candidateTier}
          setCandidateTier={state.setCandidateTier}
          currentProfileItem={state.currentProfileItem}
          compareTier={state.compareTier}
          setCompareTier={state.setCompareTier}
          currentMaxTier={state.currentMaxTier}
          effectiveCompareTier={state.effectiveCompareTier}
          comparisonTone={state.comparisonTone}
          selectedDeltaTotal={state.selectedDeltaTotal}
          comparisonSummaryLabel={state.comparisonSummaryLabel}
          statComparison={state.statComparison}
          openItemByName={state.openItemByName}
          activeProfile={state.activeProfile}
          selectedType={state.selectedType}
          activeCombatStyle={state.activeCombatStyle}
          selectedProfileSlot={state.selectedProfileSlot}
          saveGearToProfile={state.saveGearToProfile}
        />
      </section>

      <BisStyles />
    </main>
  );
}
