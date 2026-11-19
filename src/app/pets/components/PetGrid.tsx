"use client";

import type { Dispatch, SetStateAction } from "react";
import { NoResultsState } from "@/components/StateBlock";
import {
  MOBILE_PET_BATCH_SIZE,
  SOURCE_OPTIONS,
  type PetRow,
  type Quality,
  type SourceFilter,
  type ViewMode,
} from "../types";
import {
  formatBattleZoneCount,
  formatGold,
  formatNumber,
  getPetSourceLabel,
  qualityLabel,
  secondsToDuration,
} from "../utils/pet-helpers";
import { PetCard } from "./PetCard";
import { PetImage } from "./PetImage";

export function PetGrid({
  petRows,
  visiblePetRows,
  hiddenPetCount,
  viewMode,
  hasActiveFilters,
  searchTerm,
  qualityFilter,
  sourceFilter,
  clearPetFilters,
  setSelectedPetName,
  setVisiblePetCount,
}: {
  petRows: PetRow[];
  visiblePetRows: PetRow[];
  hiddenPetCount: number;
  viewMode: ViewMode;
  hasActiveFilters: boolean;
  searchTerm: string;
  qualityFilter: Quality | "ALL";
  sourceFilter: SourceFilter;
  clearPetFilters: () => void;
  setSelectedPetName: (name: string | null) => void;
  setVisiblePetCount: Dispatch<SetStateAction<number>>;
}) {
  return (
    <section className="pets-list" aria-label="Pet results">
      {petRows.length === 0 ? (
        <NoResultsState
          title="No pets found"
          description={
            hasActiveFilters
              ? `Search "${searchTerm || "any"}" with ${qualityFilter === "ALL" ? "all qualities" : qualityLabel(qualityFilter)} and ${SOURCE_OPTIONS.find((option) => option.value === sourceFilter)?.label || "all sources"}.`
              : "The pet database loaded, but no rows matched the current view."
          }
          action={
            hasActiveFilters ? (
              <button type="button" onClick={clearPetFilters}>
                Clear filters
              </button>
            ) : null
          }
        />
      ) : viewMode === "cards" ? (
        <div className="pets-card-grid">
          {visiblePetRows.map((row) => (
            <PetCard
              key={row.pet.name}
              pet={row.pet}
              stats={row.stats}
              totalPower={row.totalPower}
              huntingTime={row.huntingTime}
              ownedCount={row.ownedPets.length}
              onInspect={() => setSelectedPetName(row.pet.name)}
            />
          ))}
        </div>
      ) : (
        <div className="pets-table-wrap">
          <table className="pets-table">
            <thead>
              <tr>
                <th>Pet</th>
                <th>Quality</th>
                <th>Power</th>
                <th>Move</th>
                <th>Hunter</th>
                <th>Battle Samples</th>
                <th>Owned</th>
                <th>Source</th>
                <th>Exchange</th>
              </tr>
            </thead>
            <tbody>
              {visiblePetRows.map((row) => (
                <tr key={row.pet.name}>
                  <td>
                    <span className="table-pet-cell">
                      <PetImage pet={row.pet} />
                      <span>{row.pet.name}</span>
                      <button
                        type="button"
                        aria-label={`Open details for ${row.pet.name}`}
                        onClick={() => setSelectedPetName(row.pet.name)}
                      >
                        Open details
                      </button>
                    </span>
                  </td>
                  <td>{qualityLabel(row.pet.quality)}</td>
                  <td>{formatNumber(row.totalPower)}</td>
                  <td>{formatNumber(row.stats.movement_speed, 2)}m/s</td>
                  <td>{secondsToDuration(row.huntingTime)}</td>
                  <td>{formatBattleZoneCount(row.pet)}</td>
                  <td>{row.ownedPets.length ? `${row.ownedPets.length} saved` : "-"}</td>
                  <td>{getPetSourceLabel(row.pet)}</td>
                  <td>{formatGold(row.pet.exchange?.minPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hiddenPetCount > 0 && (
        <div className="pet-load-more" role="status">
          <span>
            Showing {visiblePetRows.length.toLocaleString()} of {petRows.length.toLocaleString()} pets on mobile.
          </span>
          <button
            type="button"
            onClick={() => setVisiblePetCount((count) => count + MOBILE_PET_BATCH_SIZE)}
          >
            Show {Math.min(MOBILE_PET_BATCH_SIZE, hiddenPetCount).toLocaleString()} more
          </button>
        </div>
      )}
    </section>
  );
}
