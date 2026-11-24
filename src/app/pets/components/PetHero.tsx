"use client";

import React from "react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { Sparkles } from "lucide-react";
import styles from "../Pets.module.css";
import type { PetDatabase } from "../types";

export function PetHero({
  database,
  counts,
  masteryBonus,
  ownedPetCount,
  ownedSpeciesCount,
  filteredCount,
  hasActiveFilters,
}: {
  database: PetDatabase | null;
  counts?: PetDatabase["meta"]["counts"];
  masteryBonus: number;
  ownedPetCount: number;
  ownedSpeciesCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
}) {
  const totalPets = counts?.pets || database?.pets.length || 47;

  return (
    <header className={styles.hero}>
      <div className={styles.kicker}>
        <ZenithIcon name="pets" size={14} /> Companion Bestiary
      </div>
      <h1 className={styles.title}>Pet Database</h1>
      <p className={styles.description}>
        Compare companion stats, evolution milestones, and live exchange prices.
      </p>

      {/* Decluttered Inline Metadata Strip (Eliminating 10 Cluttered Metric Cards) */}
      <div className={styles.metaStrip} aria-label="Database summary">
        <span className={styles.metaPill}>
          <span>Catalog:</span>
          <strong>{totalPets} pets</strong>
        </span>

        <span className={styles.metaPill}>
          <Sparkles size={12} className={styles.setupIcon} />
          <span>Mastery Boost:</span>
          <strong>+{masteryBonus}%</strong>
        </span>

        {ownedPetCount > 0 ? (
          <span className={`${styles.metaPill} ${styles.metaPillActive}`}>
            <span>Owned:</span>
            <strong>{ownedPetCount} pets ({ownedSpeciesCount} species)</strong>
          </span>
        ) : null}

        {hasActiveFilters ? (
          <span className={`${styles.metaPill} ${styles.metaPillActive}`}>
            <span>Showing:</span>
            <strong>{filteredCount} matching</strong>
          </span>
        ) : null}
      </div>
    </header>
  );
}
