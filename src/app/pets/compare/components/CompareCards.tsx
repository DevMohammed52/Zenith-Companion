import type { CSSProperties } from "react";
import { Clock3, Gauge, Swords } from "lucide-react";
import {
  QUALITY_COLORS,
  formatNumber,
  qualityLabel,
  secondsToDuration,
} from "@/lib/pets";
import { BEST_BATTLE_ZONE, type ComparedPet } from "../types";
import {
  formatBattleEv,
  getRecordedDropCount,
  getRecordedZoneCount,
  ownedPetMissingStatCount,
} from "../utils/compare-helpers";
import { PetImage } from "./PetImage";
import styles from "../page.module.css";

export function CompareCards({
  rows,
  battleZone,
}: {
  rows: ComparedPet[];
  battleZone: string;
}) {
  return (
    <section className={styles.compareCards} aria-label="Selected pet comparison cards">
      {rows.map((row) => {
        const recordedZones = getRecordedZoneCount(row.pet);
        const recordedDrops = getRecordedDropCount(row.pet, row.battle.zone);
        return (
          <article
            key={row.id}
            className={styles.compareCard}
            style={{ "--accent": QUALITY_COLORS[row.pet.quality] } as CSSProperties}
          >
            <div className={styles.cardTop}>
              <PetImage pet={row.pet} />
              <div>
                <h3>{row.label}</h3>
                <p>{row.subtitle}</p>
              </div>
              <span>
                {row.source === "owned" ? "Snapshot stats" : qualityLabel(row.pet.quality)}
              </span>
            </div>
            <div className={styles.cardStats}>
              <div>
                <Swords size={15} />
                <strong>{formatNumber(row.totalPower)}</strong>
                <span>Power</span>
              </div>
              <div>
                <Gauge size={15} />
                <strong>{formatNumber(row.stats.movement_speed, 2)}m/s</strong>
                <span>Move</span>
              </div>
              <div>
                <Clock3 size={15} />
                <strong>{secondsToDuration(row.huntingTime)}</strong>
                <span>Hunt</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <span>{row.battle.zone || "No recorded zone"}</span>
              <strong className={row.battle.value < 0 ? styles.lossValue : ""}>
                {row.battle.zone ? `${formatBattleEv(row.battle.value)}/hr` : "No EV"}
              </strong>
            </div>
            <div
              className={styles.sampleBadges}
              aria-label={`${row.label} recorded battle coverage`}
            >
              {row.ownedPet && <span>{qualityLabel(row.pet.quality)} species match</span>}
              {row.ownedPet && <span>Snapshot stats</span>}
              {row.ownedPet && ownedPetMissingStatCount(row.ownedPet.stats) > 0 && (
                <span>
                  {ownedPetMissingStatCount(row.ownedPet.stats)} missing stats count as 0
                </span>
              )}
              <span>{recordedZones} recorded zones</span>
              <span>
                {recordedDrops ? `${recordedDrops} drop rows` : "Drops not recorded"}
              </span>
              <span>
                {battleZone === BEST_BATTLE_ZONE ? "Best recorded only" : "Selected zone"}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
