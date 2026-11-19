"use client";

import type { CSSProperties } from "react";
import { Trash2 } from "lucide-react";
import type { ProfileOwnedPet } from "@/lib/profiles";
import type { PetRecord } from "@/lib/pets";
import { PET_STAT_LABELS } from "../types";
import {
  formatDateTime,
  formatOptionalDateTime,
  formatOptionalNumber,
  formatSourceMode,
  formatValue,
  getQualityColor,
  missingStatCount,
} from "../utils/owned-pet-helpers";
import { OwnedPetImage } from "./OwnedPetImage";
import styles from "../page.module.css";

export function OwnedPetCard({
  ownedPet,
  databasePet,
  isActive,
  onUseAsActive,
  onRemove,
}: {
  ownedPet: ProfileOwnedPet;
  databasePet: PetRecord | null | undefined;
  isActive: boolean;
  onUseAsActive: () => void;
  onRemove: () => void;
}) {
  const missingStats = missingStatCount(ownedPet.stats);
  const displayName = ownedPet.nickname || ownedPet.species;

  return (
    <article
      className={`${styles.card} ${isActive ? styles.activeCard : ""}`}
      style={
        {
          "--owned-pet-quality": getQualityColor(ownedPet.quality || databasePet?.quality),
        } as CSSProperties
      }
    >
      <div className={styles.cardTop}>
        <div className={styles.petImage}>
          <OwnedPetImage src={ownedPet.imageUrl || databasePet?.imageUrl || ""} />
        </div>
        <div>
          <h2>{displayName}</h2>
          <p>
            {ownedPet.quality || databasePet?.quality || "Unknown quality"} - Lv.{" "}
            {ownedPet.level || 1} - Evo {ownedPet.evolution || 0}
          </p>
        </div>
        {isActive && <span className={styles.activePill}>Active</span>}
      </div>
      <div className={styles.statGrid}>
        {PET_STAT_LABELS.slice(0, 6).map(([key, label]) => (
          <span key={key}>
            {label}
            <strong>{formatValue(ownedPet.stats[key])}</strong>
          </span>
        ))}
      </div>
      <div className={styles.metaRow}>
        <span className={ownedPet.source === "imported" ? styles.importedMeta : styles.manualMeta}>
          {formatSourceMode(ownedPet.source)}
        </span>
        <span>
          {ownedPet.location?.name || databasePet?.acquisition?.[0]?.boss || "Source unknown"}
        </span>
        {!databasePet && <span className={styles.warningMeta}>No database match</span>}
        {missingStats > 0 && <span className={styles.warningMeta}>{missingStats} missing stats</span>}
        {ownedPet.totalExperience !== "" && (
          <span>{Number(ownedPet.totalExperience).toLocaleString()} pet XP</span>
        )}
      </div>
      <details className={styles.detailPanel}>
        <summary aria-label={`View details for ${displayName}`}>
          <span>Details</span>
          <strong>{databasePet ? "Linked data" : "Local snapshot"}</strong>
        </summary>
        <div className={styles.detailGrid}>
          <div>
            <strong>All Stats</strong>
            <div className={styles.fullStatGrid}>
              {PET_STAT_LABELS.map(([key, label]) => (
                <span key={key}>
                  {label}
                  <b>{formatValue(ownedPet.stats[key])}</b>
                </span>
              ))}
            </div>
          </div>
          <div>
            <strong>Evolution</strong>
            <span>
              State <b>{formatOptionalNumber(ownedPet.evolution)}</b>
            </span>
            <span>
              Max <b>{formatOptionalNumber(ownedPet.evolutionMax)}</b>
            </span>
            <span>
              Next bonus <b>{formatOptionalNumber(ownedPet.evolutionNextBonus)}</b>
            </span>
            <span>
              Can evolve <b>{ownedPet.evolutionCanEvolve ? "Yes" : "No"}</b>
            </span>
          </div>
          <div>
            <strong>Import Source</strong>
            <span>
              Source <b>{formatSourceMode(ownedPet.source)}</b>
            </span>
            <span>
              Imported <b>{formatDateTime(ownedPet.importedAt)}</b>
            </span>
            <span>
              Hash <b>{ownedPet.hashTail ? `...${ownedPet.hashTail}` : "None"}</b>
            </span>
            <span>
              API ID <b>{ownedPet.apiId ? String(ownedPet.apiId) : "None"}</b>
            </span>
          </div>
          <div>
            <strong>State</strong>
            <span>
              Equipped <b>{ownedPet.equipped ? "Yes" : "No"}</b>
            </span>
            <span>
              Location <b>{ownedPet.location?.name || "Unknown"}</b>
            </span>
            <span>
              Health{" "}
              <b>
                {ownedPet.health
                  ? `${formatOptionalNumber(ownedPet.health.current)} / ${formatOptionalNumber(ownedPet.health.maximum)}`
                  : "Unknown"}
              </b>
            </span>
            <span>
              Battle ends <b>{formatOptionalDateTime(ownedPet.battle?.endsAt)}</b>
            </span>
          </div>
        </div>
        {ownedPet.evolutionTargets.length > 0 && (
          <div className={styles.targetRow}>
            <strong>Evolution targets</strong>
            <span>
              {ownedPet.evolutionTargets.map((target) => target.label || target.key).join(" / ")}
            </span>
          </div>
        )}
      </details>
      {ownedPet.notes && <p className={styles.notes}>{ownedPet.notes}</p>}
      <div className={styles.cardActions}>
        <button
          type="button"
          aria-label={
            isActive
              ? `${displayName} is already the active pet`
              : `Set ${displayName} as active pet`
          }
          disabled={isActive}
          onClick={onUseAsActive}
        >
          {isActive ? "Current active" : "Set active pet"}
        </button>
        <button
          type="button"
          aria-label={`Remove ${displayName} from owned pets`}
          onClick={onRemove}
        >
          <Trash2 size={15} /> Remove
        </button>
      </div>
    </article>
  );
}
