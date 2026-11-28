"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { PetImage } from "@/components/pets/PetImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { getQualityPalette } from "@/lib/quality";
import type { ProfileOwnedPet } from "@/lib/profiles";
import { QUALITY_COLORS, formatNumber, qualityLabel, type PetRecord } from "@/lib/pets";
import { PET_STAT_LABELS } from "../types";
import {
  formatSourceMode,
  formatValue,
  missingStatCount,
} from "../utils/owned-pet-helpers";
import styles from "../page.module.css";

export function OwnedPetCard({
  ownedPet,
  databasePet,
  power,
  bestBattle,
  isActive,
  isSelectedForCompare,
  onToggleCompare,
  onUseAsActive,
  onOpenDetails,
  onRemove,
}: {
  ownedPet: ProfileOwnedPet;
  databasePet: PetRecord | null | undefined;
  power: number;
  bestBattle: { zone: string | null; value: number } | null;
  isActive: boolean;
  isSelectedForCompare: boolean;
  onToggleCompare: () => void;
  onUseAsActive: () => void;
  onOpenDetails: () => void;
  onRemove: () => void;
}) {
  const missingStats = missingStatCount(ownedPet.stats);
  const displayName = ownedPet.nickname || ownedPet.species;
  const resolvedQuality = ownedPet.quality || databasePet?.quality || "UNKNOWN";
  const palette = getQualityPalette(resolvedQuality);
  const accent =
    QUALITY_COLORS[resolvedQuality.toUpperCase() as keyof typeof QUALITY_COLORS] ||
    QUALITY_COLORS.UNKNOWN;

  return (
    <article
      className={`${styles.card} ${isActive ? styles.activeCard : ""}`}
      style={{ "--accent": accent } as CSSProperties}
    >
      <div className={styles.cardTop}>
        <PetImage
          pet={{
            name: displayName,
            imageUrl: ownedPet.imageUrl || databasePet?.imageUrl || "",
            egg: databasePet?.egg,
          }}
          size={44}
        />
        <div className={styles.cardIdentity}>
          <h2 className={styles.cardTitle}>{displayName}</h2>
          <p className={styles.cardSubtitle}>
            Lv. {ownedPet.level || 1} | Evo {ownedPet.evolution || 0}
            {ownedPet.nickname && ownedPet.nickname !== ownedPet.species
              ? ` | ${ownedPet.species}`
              : ""}
          </p>
        </div>
        <div className={styles.cardBadges}>
          {isActive && (
            <Badge variant="success" size="sm">
              Equipped
            </Badge>
          )}
          <Badge
            variant="neutral"
            size="sm"
            style={{
              color: palette.textColor,
              borderColor: palette.border,
              backgroundColor: palette.background,
            }}
          >
            {qualityLabel(resolvedQuality)}
          </Badge>
        </div>
      </div>

      <div className={styles.statGrid}>
        {PET_STAT_LABELS.slice(0, 6).map(([key, label]) => (
          <div key={key} className={styles.statTile}>
            <span className={styles.statTileLabel}>{label}</span>
            <strong className={styles.statTileValue}>{formatValue(ownedPet.stats[key])}</strong>
          </div>
        ))}
      </div>

      <div className={styles.metaRow}>
        <Badge variant="neutral" size="sm">
          {formatSourceMode(ownedPet.source)}
        </Badge>
        <span className={styles.metaText}>Power {formatNumber(power)}</span>
        {bestBattle?.zone && (
          <span className={styles.metaText}>
            {formatNumber(bestBattle.value)}g/hr
          </span>
        )}
        <span className={styles.metaText}>
          {ownedPet.location?.name || databasePet?.acquisition?.[0]?.boss || "With character"}
        </span>
        {!databasePet && <span className={styles.warningMeta}>No catalog match</span>}
        {missingStats > 0 && <span className={styles.warningMeta}>{missingStats} missing stats</span>}
      </div>

      <div className={styles.cardBottomBar}>
        <Checkbox
          label="Compare"
          checked={isSelectedForCompare}
          onChange={onToggleCompare}
          aria-label={`Select ${displayName} for comparison`}
        />

        <div className={styles.cardActions}>
          <Button
            variant={isActive ? "secondary" : "primary"}
            size="sm"
            disabled={isActive}
            onClick={onUseAsActive}
            icon={isActive ? <Icon name="check" size="sm" aria-hidden="true" /> : undefined}
            aria-label={
              isActive
                ? `${displayName} is already the active pet`
                : `Set ${displayName} as active pet`
            }
          >
            {isActive ? "Equipped" : "Equip"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenDetails}
            aria-label={`View details for ${displayName}`}
          >
            Details
          </Button>

          <Link
            href={`/pets/compare?pets=${encodeURIComponent(`owned:${ownedPet.id}`)}`}
            className={styles.cardIconAction}
            aria-label={`Compare ${displayName} in Pet Comparison`}
            title="Open in Pet Comparison"
          >
            <Icon name="petCompare" size="sm" aria-hidden="true" />
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            icon={<Icon name="trash" size="sm" aria-hidden="true" />}
            aria-label={`Remove ${displayName} from owned pets`}
          >
            Remove
          </Button>
        </div>
      </div>
    </article>
  );
}
