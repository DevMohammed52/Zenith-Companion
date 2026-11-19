"use client";

import Link from "next/link";
import { PawPrint } from "lucide-react";
import { EmptyState, NoResultsState } from "@/components/StateBlock";
import { findPetRecordForOwnedPet } from "@/lib/pets";
import { SOURCE_FILTERS } from "./types";
import { petKey } from "./utils/owned-pet-helpers";
import { useOwnedPetsState } from "./hooks/useOwnedPetsState";
import { OwnedPetHeader } from "./components/OwnedPetHeader";
import { OwnedPetSummary } from "./components/OwnedPetSummary";
import { OwnedPetImportReadiness } from "./components/OwnedPetImportReadiness";
import { OwnedPetControls } from "./components/OwnedPetControls";
import { OwnedPetCard } from "./components/OwnedPetCard";
import { OwnedPetToast } from "./components/OwnedPetToast";
import styles from "./page.module.css";

export default function OwnedPetsPage() {
  const state = useOwnedPetsState();

  return (
    <main className={`container ${styles.page}`} aria-labelledby="owned-pets-page-title">
      <OwnedPetHeader onAddCurrentPet={state.addCurrentPet} />

      <OwnedPetSummary
        totalSaved={state.ownedPets.length}
        activeCount={state.activeCount}
        manualCount={state.manualCount}
        importedCount={state.importedCount}
      />

      {state.activeProfile && (
        <OwnedPetImportReadiness
          importSource={state.importSource}
          hasImportedPetSection={state.hasImportedPetSection}
          missingOrPrivate={state.missingOrPrivate}
          unmatchedSpeciesCount={state.unmatchedSpeciesCount}
        />
      )}

      {state.activeProfile && state.ownedPets.length > 0 && (
        <OwnedPetControls
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
          visibleCount={state.visiblePets.length}
          sourceFilterLabel={state.sourceFilterLabel}
          sortLabel={state.sortLabel}
          isCompactViewport={state.isCompactViewport}
          resetControls={state.resetControls}
        />
      )}

      {!state.activeProfile && (
        <EmptyState
          title="No active profile"
          description="Create or select a profile before saving owned pets."
          icon={PawPrint}
          action={<Link href="/profiles">Open profiles</Link>}
        />
      )}

      {state.activeProfile && !state.ownedPets.length && (
        <EmptyState
          title="No owned pets saved"
          description="Select a pet in Profiles, set its level/evolution, then add it here as a local snapshot."
          icon={PawPrint}
          action={<Link href="/profiles">Open profiles</Link>}
        />
      )}

      {state.activeProfile && state.ownedPets.length > 0 && (
        <section className={styles.resultHeader} aria-live="polite">
          <span>{state.visiblePets.length} shown</span>
          <strong>
            {state.sourceFilter === "all"
              ? "All saved pets"
              : SOURCE_FILTERS.find((option) => option.id === state.sourceFilter)?.label}
          </strong>
        </section>
      )}

      {state.activeProfile && state.ownedPets.length > 0 && state.visiblePets.length > 0 && (
        <section className={styles.grid} aria-label={`${state.activeProfile.name} owned pets`}>
          {state.visiblePets.map((ownedPet) => {
            const databasePet = findPetRecordForOwnedPet(ownedPet, state.petMatchLookup);
            const isActive =
              petKey(ownedPet) === state.activePetKey || ownedPet.active || ownedPet.equipped;
            return (
              <OwnedPetCard
                key={ownedPet.id}
                ownedPet={ownedPet}
                databasePet={databasePet}
                isActive={isActive}
                onUseAsActive={() => state.handleUseAsActivePet(ownedPet)}
                onRemove={() => state.removePet(ownedPet)}
              />
            );
          })}
        </section>
      )}

      {state.activeProfile && state.ownedPets.length > 0 && !state.visiblePets.length && (
        <NoResultsState
          title="No owned pets match"
          description="Adjust the search text or filter selection."
          action={
            <button type="button" onClick={state.resetControls}>
              Clear controls
            </button>
          }
        />
      )}

      <OwnedPetToast
        toast={state.toast}
        hasPendingRemoval={Boolean(state.pendingRemoval)}
        onUndo={state.undoRemovePet}
      />
    </main>
  );
}
