"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { PetImage } from "@/components/pets/PetImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getQualityPalette } from "@/lib/quality";
import type { ProfileOwnedPet } from "@/lib/profiles";
import { QUALITY_COLORS, formatNumber, qualityLabel, type PetRecord } from "@/lib/pets";
import { formatOptionalNumber } from "../utils/owned-pet-helpers";
import styles from "../page.module.css";

export function ActivePetSpotlight({
  ownedPet,
  databasePet,
  power,
  bestBattle,
  onOpenDetails,
}: {
  ownedPet: ProfileOwnedPet;
  databasePet: PetRecord | null | undefined;
  power: number;
  bestBattle: { zone: string | null; value: number } | null;
  onOpenDetails: () => void;
}) {
  const displayName = ownedPet.nickname || ownedPet.species;
  const resolvedQuality = ownedPet.quality || databasePet?.quality || "UNKNOWN";
  const palette = getQualityPalette(resolvedQuality);
  const accent =
    QUALITY_COLORS[resolvedQuality.toUpperCase() as keyof typeof QUALITY_COLORS] ||
    QUALITY_COLORS.UNKNOWN;

  const compareHref = databasePet
    ? `/pets/compare?pets=${encodeURIComponent(`owned:${ownedPet.id},db:${databasePet.name}`)}`
    : `/pets/compare?pets=${encodeURIComponent(`owned:${ownedPet.id}`)}`;

  return (
    <section
      className={styles.spotlight}
      style={{ "--accent": accent } as CSSProperties}
      aria-label="Equipped pet spotlight"
    >
      <div className={styles.spotlightIdentity}>
        <PetImage
          pet={{
            name: displayName,
            imageUrl: ownedPet.imageUrl || databasePet?.imageUrl || "",
            egg: databasePet?.egg,
          }}
          size={48}
        />
        <div className={styles.spotlightInfo}>
          <div className={styles.spotlightKickerRow}>
            <Badge variant="success" size="sm">
              Equipped
            </Badge>
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
          <h2 className={styles.spotlightTitle}>
            {displayName}
            <span className={styles.spotlightSub}>
              Lv. {ownedPet.level || 1} &middot; Evo {ownedPet.evolution || 0} / {ownedPet.evolutionMax || 5}
            </span>
          </h2>
        </div>
      </div>

      <div className={styles.spotlightMetrics}>
        <div className={styles.spotlightStat}>
          <span className={styles.spotlightLabel}>
            <Icon name="combat" size="xs" aria-hidden="true" />
            <span>Power</span>
          </span>
          <strong className={styles.spotlightValue}>{formatNumber(power)}</strong>
        </div>
        <div className={styles.spotlightStat}>
          <span className={styles.spotlightLabel}>
            <Icon name="health" size="xs" aria-hidden="true" />
            <span>Health</span>
          </span>
          <strong className={styles.spotlightValue}>
            {ownedPet.health
              ? `${formatOptionalNumber(ownedPet.health.current)} / ${formatOptionalNumber(ownedPet.health.maximum)}`
              : "Full / Ready"}
          </strong>
        </div>
        <div className={styles.spotlightStat}>
          <span className={styles.spotlightLabel}>
            <Icon name="map" size="xs" aria-hidden="true" />
            <span>Location</span>
          </span>
          <strong className={styles.spotlightValue}>
            {ownedPet.location?.name || "With character"}
          </strong>
        </div>
        <div className={styles.spotlightStat}>
          <span className={styles.spotlightLabel}>
            <Icon name="skillProfit" size="xs" aria-hidden="true" />
            <span>Best Battle EV</span>
          </span>
          <strong className={styles.spotlightValue}>
            {bestBattle?.zone ? `${formatNumber(bestBattle.value)}g/hr` : "-"}
          </strong>
        </div>
      </div>

      <div className={styles.spotlightActions}>
        <Button variant="secondary" size="sm" onClick={onOpenDetails}>
          Details
        </Button>
        <Link href={compareHref} className={styles.cardLinkAction}>
          <Icon name="petCompare" size="sm" aria-hidden="true" />
          <span>{databasePet ? "Compare vs Catalog" : "Compare"}</span>
        </Link>
      </div>
    </section>
  );
}
