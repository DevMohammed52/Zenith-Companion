"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton, SkeletonContainer } from "@/components/ui/Skeleton";
import { ActivePetSpotlight } from "./ActivePetSpotlight";
import { MissingPetsSection } from "./MissingPetsSection";
import { OwnedPetCard } from "./OwnedPetCard";
import { OwnedPetTable } from "./OwnedPetTable";
import { SOURCE_FILTERS } from "../types";
import { petKey } from "../utils/owned-pet-helpers";
import type { useOwnedPetsState } from "../hooks/useOwnedPetsState";
import styles from "../page.module.css";

type OwnedPetsState = ReturnType<typeof useOwnedPetsState>;

export function OwnedPetsWorkspace({ state }: { state: OwnedPetsState }) {
  if (!state.loaded) {
    return (
      <SkeletonContainer className={styles.skeletonStack}>
        <Skeleton variant="rectangular" width="100%" className={styles.spotlightSkeleton} />
        <div className={styles.grid}>
          <Skeleton variant="rectangular" width="100%" height={300} />
          <Skeleton variant="rectangular" width="100%" height={300} />
          <Skeleton variant="rectangular" width="100%" height={300} />
        </div>
      </SkeletonContainer>
    );
  }

  if (!state.activeProfile) {
    return (
      <EmptyState
        variant="no-data"
        title="No active profile"
        description="Create or select a profile before saving owned pets."
        action={
          <Link href="/profiles" className={styles.emptyActionLink}>
            Open profiles
          </Link>
        }
      />
    );
  }

  const activeSpotlightSummary = state.activeOwnedPet
    ? state.getCatalogSummary(state.activeOwnedPet)
    : null;

  return (
    <>
      {state.activeTab === "owned" && state.activeOwnedPet && activeSpotlightSummary && (
        <ActivePetSpotlight
          ownedPet={state.activeOwnedPet}
          databasePet={activeSpotlightSummary.databasePet}
          power={activeSpotlightSummary.power}
          bestBattle={activeSpotlightSummary.bestBattle}
          onOpenDetails={() => state.setDetailPetId(state.activeOwnedPet!.id)}
        />
      )}

      {state.activeTab === "owned" && !state.ownedPets.length && (
        <EmptyState
          variant="no-data"
          title="No owned pets saved"
          description="Select a pet on your profile or import your character to populate your saved pets."
          action={
            <Link href="/profiles" className={styles.emptyActionLink}>
              Open profiles
            </Link>
          }
        />
      )}

      {state.activeTab === "owned" && state.ownedPets.length > 0 && (
        <>
          <section className={styles.resultHeader} aria-live="polite">
            <span>{state.visiblePets.length} shown</span>
            <strong>
              {state.sourceFilter === "all"
                ? "All saved pets"
                : SOURCE_FILTERS.find((option) => option.id === state.sourceFilter)?.label}
            </strong>
          </section>

          {state.visiblePets.length > 0 ? (
            state.viewMode === "cards" ? (
              <section className={styles.grid} aria-label={`${state.activeProfile.name} owned pets`}>
                {state.paginatedPets.map((ownedPet) => {
                  const summary = state.getCatalogSummary(ownedPet);
                  const isActive =
                    petKey(ownedPet) === state.activePetKey ||
                    Boolean(ownedPet.active || ownedPet.equipped);
                  return (
                    <OwnedPetCard
                      key={ownedPet.id}
                      ownedPet={ownedPet}
                      databasePet={summary.databasePet}
                      power={summary.power}
                      bestBattle={summary.bestBattle}
                      isActive={isActive}
                      isSelectedForCompare={state.selectedCompareIds.includes(ownedPet.id)}
                      onToggleCompare={() => state.toggleCompareSelection(ownedPet.id)}
                      onUseAsActive={() => state.handleUseAsActivePet(ownedPet)}
                      onOpenDetails={() => state.setDetailPetId(ownedPet.id)}
                      onRemove={() => state.removePet(ownedPet)}
                    />
                  );
                })}
              </section>
            ) : (
              <OwnedPetTable
                pets={state.paginatedPets}
                activePetKey={state.activePetKey}
                selectedCompareIds={state.selectedCompareIds}
                onToggleCompare={state.toggleCompareSelection}
                getCatalogSummary={state.getCatalogSummary}
                onUseAsActive={state.handleUseAsActivePet}
                onOpenDetails={(pet) => state.setDetailPetId(pet.id)}
              />
            )
          ) : (
            <EmptyState
              variant="search-empty"
              title="No owned pets match"
              description="Adjust your search text or source filter to see saved pets."
              action={
                <Button variant="secondary" size="md" onClick={state.resetControls}>
                  Clear filters
                </Button>
              }
            />
          )}
        </>
      )}

      {state.activeTab === "missing" && (
        <>
          <section className={styles.resultHeader} aria-live="polite">
            <span>{state.missingCatalogPets.length} missing</span>
            <strong>Unowned catalog pets</strong>
          </section>

          {state.missingCatalogPets.length > 0 ? (
            <MissingPetsSection pets={state.paginatedMissingPets} viewMode={state.viewMode} />
          ) : (
            <EmptyState
              variant="no-data"
              title={state.query.trim() ? "No missing pets match" : "Collection complete"}
              description={
                state.query.trim()
                  ? "Clear your search text to see all missing pets."
                  : "You own every pet currently listed in the database."
              }
              action={
                state.query.trim() ? (
                  <Button variant="secondary" size="md" onClick={state.resetControls}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      )}

      {state.totalPages > 1 && (
        <div className={styles.paginationWrap}>
          <Pagination
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onPageChange={state.setCurrentPage}
            pageSize={state.pageSize}
            onPageSizeChange={state.setPageSize}
            pageSizeOptions={[12, 24, 48]}
            showPageSize={true}
            itemLabel="pets"
          />
        </div>
      )}
    </>
  );
}
