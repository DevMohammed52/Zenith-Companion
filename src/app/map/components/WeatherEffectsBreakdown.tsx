import React from "react";
import { parseWeatherEffects } from "../types";
import styles from "../page.module.css";

interface WeatherEffectsBreakdownProps {
  buffs?: string[] | null;
  compact?: boolean;
}

function getDeltaToneClass(delta?: string): string {
  if (!delta) return "";
  if (delta.startsWith("+")) return styles.effectPositive;
  if (delta.startsWith("-")) return styles.effectNegative;
  return "";
}

export function WeatherEffectsBreakdown({ buffs, compact = false }: WeatherEffectsBreakdownProps) {
  const parsed = parseWeatherEffects(buffs);

  if (parsed.skills.length === 0 && parsed.special.length === 0) {
    return <span className={styles.mutedNote}>Neutral weather (no skill modifiers).</span>;
  }

  return (
    <div className={`${styles.effectsBlock} ${compact ? styles.effectsBlockCompact : ""}`.trim()}>
      {parsed.special.length > 0 && (
        <div className={styles.specialEffectsRow}>
          {parsed.special.map((item) => (
            <span key={`${item.delta}-${item.label}`} className={styles.specialEffectPill}>
              {item.delta && (
                <strong className={getDeltaToneClass(item.delta)}>{item.delta}</strong>
              )}
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      )}

      {parsed.skills.length > 0 && (
        <div className={styles.skillEffectsGrid}>
          {parsed.skills.map((row) => (
            <div key={row.skill} className={styles.skillEffectRow}>
              <span className={styles.skillEffectName}>{row.skill}</span>
              <span className={styles.skillEffectValues}>
                {row.efficiency && (
                  <span className={`${styles.effectValue} ${getDeltaToneClass(row.efficiency)}`}>
                    {row.efficiency} Eff
                  </span>
                )}
                {row.efficiency && row.experience && (
                  <span className={styles.vDividerMini} aria-hidden="true" />
                )}
                {row.experience && (
                  <span className={`${styles.effectValue} ${getDeltaToneClass(row.experience)}`}>
                    {row.experience} EXP
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
