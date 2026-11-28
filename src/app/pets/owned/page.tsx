"use client";

import { BackToTop } from "@/components/ui/BackToTop";
import { Banner } from "@/components/ui/Banner";
import { Icon } from "@/components/ui/Icon";
import { OwnedPetControls } from "./components/OwnedPetControls";
import { OwnedPetDetailModal } from "./components/OwnedPetDetailModal";
import { OwnedPetHeader } from "./components/OwnedPetHeader";
import { OwnedPetsWorkspace } from "./components/OwnedPetsWorkspace";
import { useOwnedPetsState } from "./hooks/useOwnedPetsState";
import { formatSectionList, petKey } from "./utils/owned-pet-helpers";
import styles from "./page.module.css";

export default function OwnedPetsPage() {
  const state = useOwnedPetsState();

  const warningParts: string[] = [];
  if (state.missingOrPrivate.length > 0) {
    warningParts.push(`Private/missing sections: ${formatSectionList(state.missingOrPrivate)}`);
  }
  if (state.unmatchedSpeciesCount > 0) {
    warningParts.push(
      `${state.unmatchedSpeciesCount} pet${state.unmatchedSpeciesCount === 1 ? "" : "s"} not matched to catalog yet`,
    );
  }

  const detailSummary = state.detailPet ? state.getCatalogSummary(state.detailPet) : null;
  const detailIsActive = state.detailPet
    ? petKey(state.detailPet) === state.activePetKey ||
      Boolean(state.detailPet.active || state.detailPet.equipped)
    : false;

  return (
    <main className={`container ${styles.page}`} aria-labelledby="owned-pets-page-title">
      <OwnedPetHeader
        loaded={state.loaded}
        totalSaved={state.ownedPets.length}
        ownedSpeciesCount={state.ownedSpeciesCount}
        totalCatalogSpeciesCount={state.totalCatalogSpeciesCount}
        activeCount={state.activeCount}
        importedCount={state.importedCount}
        manualCount={state.manualCount}
        hasProfile={Boolean(state.activeProfile)}
        onAddCurrentPet={state.addCurrentPet}
      />

      {state.loaded && state.activeProfile && warningParts.length > 0 && (
        <Banner variant="warning" title="Import notice">
          {warningParts.join(" | ")}
        </Banner>
      )}

      {(!state.loaded || Boolean(state.activeProfile)) && (
        <OwnedPetControls
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
          ownedCount={state.ownedPets.length}
          missingCount={state.missingCatalogPets.length}
          viewMode={state.viewMode}
          setViewMode={state.setViewMode}
          query={state.query}
          setQuery={state.setQuery}
          sourceFilter={state.sourceFilter}
          setSourceFilter={state.setSourceFilter}
          sortKey={state.sortKey}
          setSortKey={state.setSortKey}
          sortDirection={state.sortDirection}
          setSortDirection={state.setSortDirection}
          controlsModified={state.controlsModified}
          activeControlCount={state.activeControlCount}
          visibleCount={
            state.activeTab === "owned"
              ? state.visiblePets.length
              : state.missingCatalogPets.length
          }
          sourceFilterLabel={state.sourceFilterLabel}
          sortLabel={state.sortLabel}
          isCompactViewport={state.isCompactViewport}
          selectedCompareCount={state.selectedCompareIds.length}
          compareSelectionHref={state.compareSelectionHref}
          onClearCompareSelection={state.clearCompareSelection}
          resetControls={state.resetControls}
        />
      )}

      <OwnedPetsWorkspace state={state} />

      <OwnedPetDetailModal
        ownedPet={state.detailPet}
        databasePet={detailSummary?.databasePet}
        isActive={detailIsActive}
        onClose={() => state.setDetailPetId(null)}
        onUseAsActive={() => {
          if (state.detailPet) state.handleUseAsActivePet(state.detailPet);
        }}
        onRemove={() => {
          if (state.detailPet) state.removePet(state.detailPet);
        }}
      />

      <BackToTop />
    </main>
  );
}
