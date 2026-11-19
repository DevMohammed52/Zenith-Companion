"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { PetRecord } from "@/lib/pets";
import { MAX_COMPARE, type PetOption } from "../types";
import { databaseOptionId } from "../utils/compare-helpers";
import { PetPicker } from "./PetPicker";
import styles from "../page.module.css";

export function CompareSlotsPanel({
  slots,
  compareOptions,
  openMenu,
  setOpenMenu,
  onSetSlot,
  onClearSlot,
  unavailableSelectedIds,
  onRemoveUnavailable,
  unmatchedOwnedPetCount,
  unmatchedOwnedPetNames,
  topPicks,
  selectedIds,
  onAddPet,
  comparisonSummary,
  rowsCount,
}: {
  slots: Array<string | null>;
  compareOptions: PetOption[];
  openMenu: string | null;
  setOpenMenu: (menu: string | null) => void;
  onSetSlot: (index: number, id: string) => void;
  onClearSlot: (index: number) => void;
  unavailableSelectedIds: string[];
  onRemoveUnavailable: () => void;
  unmatchedOwnedPetCount: number;
  unmatchedOwnedPetNames: string[];
  topPicks: Array<[string, PetRecord]>;
  selectedIds: string[];
  onAddPet: (id: string) => void;
  comparisonSummary: string;
  rowsCount: number;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Selection</span>
          <h2>Pets To Compare</h2>
        </div>
        <div className={styles.countPill} aria-label={comparisonSummary}>
          {rowsCount}/{MAX_COMPARE}
        </div>
      </div>
      <div className={styles.pickerGrid} aria-label="Pet comparison slots">
        {slots.map((name, index) => (
          <PetPicker
            key={index}
            slotIndex={index}
            value={name}
            options={compareOptions}
            open={openMenu === `pet-${index}`}
            onOpen={(open) => setOpenMenu(open ? `pet-${index}` : null)}
            onSelect={(optionId) => onSetSlot(index, optionId)}
            onClear={() => onClearSlot(index)}
          />
        ))}
      </div>
      {unavailableSelectedIds.length > 0 && (
        <div className={styles.warningNotice} role="status">
          <span>
            {unavailableSelectedIds.length} saved comparison slot
            {unavailableSelectedIds.length === 1 ? "" : "s"} could not be restored for this profile
            or database version.
          </span>
          <button type="button" onClick={onRemoveUnavailable}>
            Remove unavailable
          </button>
        </div>
      )}
      {unmatchedOwnedPetCount > 0 && (
        <p className={styles.quickPickNote}>
          {unmatchedOwnedPetCount} owned snapshot{unmatchedOwnedPetCount === 1 ? "" : "s"} cannot be
          compared yet because the species does not match the pet database:{" "}
          {unmatchedOwnedPetNames.slice(0, 3).join(", ")}
          {unmatchedOwnedPetNames.length > 3 ? ` +${unmatchedOwnedPetNames.length - 3}` : ""}.{" "}
          <Link href="/pets/owned">Review owned pets</Link>
        </p>
      )}
      <div className={styles.quickPicks}>
        {topPicks.map(([label, pet]) => {
          const optionId = databaseOptionId(pet.name);
          const isSelected = selectedIds.includes(optionId);
          return (
            <button
              type="button"
              key={label}
              className={isSelected ? styles.quickPickSelected : ""}
              aria-pressed={isSelected}
              onClick={() => onAddPet(optionId)}
            >
              <span>{label}</span>
              <strong>{pet.name}</strong>
              {isSelected && <CheckCircle2 size={15} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <p className={styles.quickPickNote}>
        Quick picks use the shared formula setup and market listings only; they are not personalized
        map or route recommendations.
      </p>
    </section>
  );
}
