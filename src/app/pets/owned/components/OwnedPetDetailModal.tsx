"use client";

import Link from "next/link";
import { PetImage } from "@/components/pets/PetImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { getQualityPalette } from "@/lib/quality";
import type { ProfileOwnedPet } from "@/lib/profiles";
import { qualityLabel, type PetRecord } from "@/lib/pets";
import { PET_STAT_LABELS } from "../types";
import {
  formatDateTime,
  formatOptionalDateTime,
  formatOptionalNumber,
  formatSourceMode,
  formatValue,
} from "../utils/owned-pet-helpers";
import styles from "../page.module.css";

export function OwnedPetDetailModal({
  ownedPet,
  databasePet,
  isActive,
  onClose,
  onUseAsActive,
  onRemove,
}: {
  ownedPet: ProfileOwnedPet | null;
  databasePet: PetRecord | null | undefined;
  isActive: boolean;
  onClose: () => void;
  onUseAsActive: () => void;
  onRemove: () => void;
}) {
  const displayName = ownedPet ? ownedPet.nickname || ownedPet.species : "Pet Details";
  const resolvedQuality = ownedPet?.quality || databasePet?.quality || "UNKNOWN";
  const palette = getQualityPalette(resolvedQuality);

  return (
    <ModalSheet
      isOpen={Boolean(ownedPet)}
      onClose={onClose}
      title={displayName}
      maxWidth="md"
    >
      {ownedPet && (
        <div className={styles.modalBody}>
          <div className={styles.modalHeroRow}>
            <PetImage
              pet={{
                name: displayName,
                imageUrl: ownedPet.imageUrl || databasePet?.imageUrl || "",
                egg: databasePet?.egg,
              }}
              size={52}
            />
            <div className={styles.modalIdentity}>
              <div className={styles.cardBadgesRow}>
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
                <Badge variant="neutral" size="sm">
                  {formatSourceMode(ownedPet.source)}
                </Badge>
              </div>
              <p className={styles.cardSubtitle}>
                Lv. {ownedPet.level || 1} &middot; Evo {ownedPet.evolution || 0}
                {ownedPet.nickname && ownedPet.nickname !== ownedPet.species
                  ? ` · ${ownedPet.species}`
                  : ""}
              </p>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailBlock}>
              <strong className={styles.detailHeading}>All Stats</strong>
              <div className={styles.fullStatGrid}>
                {PET_STAT_LABELS.map(([key, label]) => (
                  <span key={key} className={styles.fullStatItem}>
                    <span>{label}</span>
                    <b>{formatValue(ownedPet.stats[key])}</b>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.detailBlock}>
              <strong className={styles.detailHeading}>Evolution</strong>
              <div className={styles.detailKv}>
                <span>Stage</span>
                <b>{formatOptionalNumber(ownedPet.evolution)}</b>
              </div>
              <div className={styles.detailKv}>
                <span>Max stage</span>
                <b>{formatOptionalNumber(ownedPet.evolutionMax)}</b>
              </div>
              <div className={styles.detailKv}>
                <span>Next bonus</span>
                <b>{formatOptionalNumber(ownedPet.evolutionNextBonus)}</b>
              </div>
              <div className={styles.detailKv}>
                <span>Can evolve</span>
                <b>{ownedPet.evolutionCanEvolve ? "Yes" : "No"}</b>
              </div>
            </div>

            <div className={styles.detailBlock}>
              <strong className={styles.detailHeading}>Location &amp; State</strong>
              <div className={styles.detailKv}>
                <span>Equipped</span>
                <b>{ownedPet.equipped ? "Yes" : "No"}</b>
              </div>
              <div className={styles.detailKv}>
                <span>Location</span>
                <b>{ownedPet.location?.name || "With character"}</b>
              </div>
              <div className={styles.detailKv}>
                <span>Health</span>
                <b>
                  {ownedPet.health
                    ? `${formatOptionalNumber(ownedPet.health.current)} / ${formatOptionalNumber(ownedPet.health.maximum)}`
                    : "Unknown"}
                </b>
              </div>
              <div className={styles.detailKv}>
                <span>Battle ends</span>
                <b>{formatOptionalDateTime(ownedPet.battle?.endsAt)}</b>
              </div>
            </div>

            <div className={styles.detailBlock}>
              <strong className={styles.detailHeading}>Import Info</strong>
              <div className={styles.detailKv}>
                <span>Source</span>
                <b>{formatSourceMode(ownedPet.source)}</b>
              </div>
              <div className={styles.detailKv}>
                <span>Imported</span>
                <b>{formatDateTime(ownedPet.importedAt)}</b>
              </div>
              <div className={styles.detailKv}>
                <span>Hash</span>
                <b>{ownedPet.hashTail ? `...${ownedPet.hashTail}` : "None"}</b>
              </div>
              <div className={styles.detailKv}>
                <span>API ID</span>
                <b>{ownedPet.apiId ? String(ownedPet.apiId) : "None"}</b>
              </div>
            </div>
          </div>

          {ownedPet.evolutionTargets.length > 0 && (
            <div className={styles.targetRow}>
              <strong>Evolution targets:</strong>{" "}
              <span>
                {ownedPet.evolutionTargets.map((target) => target.label || target.key).join(" / ")}
              </span>
            </div>
          )}

          {ownedPet.notes && <p className={styles.notes}>{ownedPet.notes}</p>}

          <div className={styles.modalActions}>
            <Button
              variant={isActive ? "secondary" : "primary"}
              size="md"
              disabled={isActive}
              onClick={onUseAsActive}
              icon={isActive ? <Icon name="check" size="sm" aria-hidden="true" /> : undefined}
            >
              {isActive ? "Equipped" : "Equip pet"}
            </Button>
            <Link
              href={`/pets/compare?pets=${encodeURIComponent(`owned:${ownedPet.id}`)}`}
              className={styles.cardLinkAction}
            >
              <Icon name="petCompare" size="sm" aria-hidden="true" />
              <span>Compare</span>
            </Link>
            <Button
              variant="ghost"
              size="md"
              onClick={onRemove}
              icon={<Icon name="trash" size="sm" aria-hidden="true" />}
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </ModalSheet>
  );
}
