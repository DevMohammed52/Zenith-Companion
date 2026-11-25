"use client";

import Link from "next/link";
import { useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Icon } from "@/components/ui/Icon";
import type { PetRecord } from "@/lib/pets";
import { MAX_COMPARE, type PetOption } from "../types";
import { databaseOptionId } from "../utils/compare-helpers";
import { PetPicker } from "./PetPicker";
import styles from "../page.module.css";

export function CompareSlotsPanel({
  slots,
  compareOptions,
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
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  return (
    <section className={styles.panel} aria-labelledby="compare-slots-heading">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionKicker}>Selection</span>
          <h2 id="compare-slots-heading" className={styles.panelTitle}>
            Pets To Compare
          </h2>
        </div>
        <span className={styles.countPill} aria-label={comparisonSummary}>
          {rowsCount} / {MAX_COMPARE}
        </span>
      </div>

      <div className={styles.pickerGrid} aria-label="Pet comparison slots">
        {slots.map((id, index) => (
          <PetPicker
            key={index}
            slotIndex={index}
            value={id}
            options={compareOptions}
            open={activeSlot === index}
            onOpen={(open) => setActiveSlot(open ? index : null)}
            onSelect={(optionId) => onSetSlot(index, optionId)}
            onClear={() => onClearSlot(index)}
          />
        ))}
      </div>

      {unavailableSelectedIds.length > 0 && (
        <Banner
          variant="warning"
          action={{ label: "Remove unavailable", onClick: onRemoveUnavailable }}
        >
          {unavailableSelectedIds.length} saved comparison slot
          {unavailableSelectedIds.length === 1 ? "" : "s"} could not be restored for this profile.
        </Banner>
      )}

      {unmatchedOwnedPetCount > 0 && (
        <p className={styles.unmatchedNote}>
          {unmatchedOwnedPetCount} owned snapshot{unmatchedOwnedPetCount === 1 ? "" : "s"} could not
          match the pet catalog: {unmatchedOwnedPetNames.slice(0, 3).join(", ")}
          {unmatchedOwnedPetNames.length > 3 ? ` +${unmatchedOwnedPetNames.length - 3}` : ""}.{" "}
          <Link href="/pets/owned">Review owned pets</Link>
        </p>
      )}

      <div className={styles.quickPicks} aria-label="Quick picks">
        {topPicks.map(([label, pet]) => {
          const optionId = databaseOptionId(pet.name);
          const isSelected = selectedIds.includes(optionId);
          return (
            <button
              type="button"
              key={label}
              className={`${styles.quickPickBtn} ${isSelected ? styles.quickPickSelected : ""}`}
              aria-pressed={isSelected}
              onClick={() => onAddPet(optionId)}
            >
              <span className={styles.quickPickText}>
                <span className={styles.quickPickLabel}>{label}</span>
                <strong className={styles.quickPickName}>{pet.name}</strong>
              </span>
              {isSelected && <Icon name="check" size="sm" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
