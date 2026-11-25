import type { CSSProperties } from "react";
import { PetImage } from "@/components/pets/PetImage";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { getQualityPalette } from "@/lib/quality";
import {
  QUALITY_COLORS,
  formatNumber,
  qualityLabel,
  secondsToDuration,
} from "@/lib/pets";
import type { ComparedPet } from "../types";
import { formatBattleEv } from "../utils/compare-helpers";
import styles from "../page.module.css";

export function CompareCards({ rows }: { rows: ComparedPet[] }) {
  return (
    <section className={styles.compareCards} aria-label="Selected pet comparison cards">
      {rows.map((row) => {
        const palette = getQualityPalette(row.pet.quality);
        const accent = QUALITY_COLORS[row.pet.quality] || QUALITY_COLORS.UNKNOWN;

        return (
          <article
            key={row.id}
            className={styles.compareCard}
            style={{ "--accent": accent } as CSSProperties}
          >
            <div className={styles.cardTop}>
              <PetImage pet={row.pet} size={44} />
              <div className={styles.cardIdentity}>
                <h3 className={styles.cardTitle}>{row.label}</h3>
                <p className={styles.cardSubtitle}>{row.subtitle}</p>
              </div>
              <Badge
                variant="neutral"
                size="sm"
                style={{
                  color: palette.textColor,
                  borderColor: palette.border,
                  backgroundColor: palette.background,
                }}
              >
                {row.source === "owned" ? "Snapshot" : qualityLabel(row.pet.quality)}
              </Badge>
            </div>

            <div className={styles.cardStats}>
              <div className={styles.cardStatItem}>
                <span className={styles.cardStatLabel}>
                  <Icon name="combat" size="xs" aria-hidden="true" />
                  Power
                </span>
                <strong className={styles.cardStatValue}>{formatNumber(row.totalPower)}</strong>
              </div>
              <div className={styles.cardStatItem}>
                <span className={styles.cardStatLabel}>
                  <Icon name="speed" size="xs" aria-hidden="true" />
                  Move
                </span>
                <strong className={styles.cardStatValue}>
                  {formatNumber(row.stats.movement_speed, 2)}m/s
                </strong>
              </div>
              <div className={styles.cardStatItem}>
                <span className={styles.cardStatLabel}>
                  <Icon name="timer" size="xs" aria-hidden="true" />
                  Hunt
                </span>
                <strong className={styles.cardStatValue}>
                  {secondsToDuration(row.huntingTime)}
                </strong>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.cardZone}>
                {row.battle.zone || "No recorded battle zone"}
              </span>
              <strong className={row.battle.value < 0 ? styles.lossValue : styles.evValue}>
                {row.battle.zone ? `${formatBattleEv(row.battle.value)}/hr` : "No EV"}
              </strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}
