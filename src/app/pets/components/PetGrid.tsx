"use client";

import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { getQualityPalette } from "@/lib/quality";
import type { PetRow, ViewMode } from "../types";
import {
  formatBattleZoneCount,
  formatGold,
  formatNumber,
  getPetSourceLabel,
  qualityLabel,
  secondsToDuration,
} from "../utils/pet-helpers";
import { PetCard } from "./PetCard";
import { PetImage } from "@/components/pets/PetImage";
import styles from "../Pets.module.css";

export function PetGrid({
  petRows,
  paginatedRows,
  viewMode,
  hasActiveFilters,
  clearPetFilters,
  setSelectedPetName,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: {
  petRows: PetRow[];
  paginatedRows: PetRow[];
  viewMode: ViewMode;
  hasActiveFilters: boolean;
  clearPetFilters: () => void;
  setSelectedPetName: (name: string | null) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}) {
  if (petRows.length === 0) {
    return (
      <EmptyState
        variant="search-empty"
        title="No companions found"
        description={
          hasActiveFilters
            ? "No pets match your current search query or filter combination."
            : "The pet database loaded, but no companion records matched."
        }
        action={
          hasActiveFilters
            ? {
                label: "Reset filters",
                onClick: clearPetFilters,
              }
            : undefined
        }
      />
    );
  }

  return (
    <section className={styles.resultsSection} aria-label="Pet catalog">
      {viewMode === "cards" ? (
        <div className={styles.cardGrid}>
          {paginatedRows.map((row) => (
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
        <div className={styles.tableCard}>
          <table className={styles.petTable}>
            <thead>
              <tr>
                <th>Companion</th>
                <th>Quality</th>
                <th style={{ textAlign: "right" }}>Power</th>
                <th style={{ textAlign: "right" }}>Speed</th>
                <th style={{ textAlign: "right" }}>Hunt Time</th>
                <th>Zones</th>
                <th>Owned</th>
                <th>Source</th>
                <th style={{ textAlign: "right" }}>Floor Price</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr
                  key={row.pet.name}
                  className={styles.petTableRow}
                  onClick={() => setSelectedPetName(row.pet.name)}
                >
                  <td>
                    <div className={styles.tablePetCell}>
                      <PetImage pet={row.pet} size={32} />
                      <span className={styles.tableName}>{row.pet.name}</span>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const palette = getQualityPalette(row.pet.quality);
                      return (
                        <Badge
                          variant="neutral"
                          size="sm"
                          style={{
                            color: palette.textColor,
                            borderColor: palette.border,
                            backgroundColor: palette.background,
                          }}
                        >
                          {qualityLabel(row.pet.quality)}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td className={styles.numCell}>{formatNumber(row.totalPower)}</td>
                  <td className={styles.numCell}>{formatNumber(row.stats.movement_speed, 2)}m/s</td>
                  <td className={styles.numCell}>{secondsToDuration(row.huntingTime)}</td>
                  <td>{formatBattleZoneCount(row.pet)}</td>
                  <td>{row.ownedPets.length > 0 ? `${row.ownedPets.length} owned` : "None"}</td>
                  <td>{getPetSourceLabel(row.pet)}</td>
                  <td className={`${styles.numCell} ${styles.goldText}`}>
                    {formatGold(row.pet.exchange?.minPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Centralized Bounded Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationWrap}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[12, 24, 48]}
            showPageSize={true}
            itemLabel="pets"
          />
        </div>
      )}
    </section>
  );
}
