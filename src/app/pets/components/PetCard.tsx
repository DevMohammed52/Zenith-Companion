"use client";

import React, { type CSSProperties } from "react";
import { Swords, Gauge, Clock, Zap } from "lucide-react";
import { QUALITY_COLORS, getQualityPalette } from "@/lib/quality";
import { Badge } from "@/components/ui/Badge";
import type { PetRecord, StatKey } from "../types";
import {
  formatGold,
  formatNumber,
  secondsToDuration,
  getPetSourceLabel,
  qualityLabel,
} from "../utils/pet-helpers";
import { PetImage } from "@/components/pets/PetImage";
import styles from "./PetCard.module.css";

export function PetCard({
  pet,
  stats,
  totalPower,
  huntingTime,
  ownedCount,
  onInspect,
}: {
  pet: PetRecord;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  ownedCount: number;
  onInspect: () => void;
}) {
  const accent = QUALITY_COLORS[pet.quality] || QUALITY_COLORS.UNKNOWN;
  const battleZoneCount = pet.battle?.zones?.length || 0;
  const palette = getQualityPalette(pet.quality);

  return (
    <button
      type="button"
      className={styles.card}
      onClick={onInspect}
      style={{ "--quality-accent": accent } as CSSProperties}
      aria-label={`Open details for ${pet.name}`}
    >
      {/* 1. Header: Avatar, Name, Source & Badges */}
      <div className={styles.cardHeader}>
        <PetImage pet={pet} size={44} />
        <div className={styles.petInfo}>
          <span className={styles.petName}>{pet.name}</span>
          <span className={styles.petSource}>{getPetSourceLabel(pet)}</span>
        </div>
        <div className={styles.badgeStack}>
          <Badge
            variant="neutral"
            size="sm"
            style={{
              color: palette.textColor,
              borderColor: palette.border,
              backgroundColor: palette.background,
            }}
          >
            {qualityLabel(pet.quality)}
          </Badge>
          {ownedCount > 0 && (
            <span className={styles.ownedBadge}>Owned ({ownedCount})</span>
          )}
        </div>
      </div>

      {/* 2. Key Stats Strip (Tabular numbers, no layout shifts) */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>
            <Swords size={12} aria-hidden="true" /> Power
          </span>
          <span className={styles.statValue}>{formatNumber(totalPower)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>
            <Gauge size={12} aria-hidden="true" /> Speed
          </span>
          <span className={styles.statValue}>{formatNumber(stats.movement_speed, 2)}m/s</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>
            <Clock size={12} aria-hidden="true" /> Hunt
          </span>
          <span className={styles.statValue}>{secondsToDuration(huntingTime)}</span>
        </div>
      </div>

      {/* 3. Footer: Floor Price & Combat Zones */}
      <div className={styles.footerRow}>
        <div className={styles.marketInfo}>
          <span className={styles.marketLabel}>Lowest Listing:</span>
          <span className={styles.marketPrice}>
            {formatGold(pet.exchange?.minPrice)}
          </span>
        </div>

        <div className={`${styles.zoneIndicator} ${battleZoneCount > 0 ? styles.zoneIndicatorActive : ""}`}>
          <Zap size={12} aria-hidden="true" />
          <span>
            {battleZoneCount > 0
              ? `${battleZoneCount} zone${battleZoneCount === 1 ? "" : "s"}`
              : "No zones"}
          </span>
        </div>
      </div>
    </button>
  );
}
