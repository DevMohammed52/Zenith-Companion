import React from "react";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Icon } from "@/components/ui/Icon";
import {
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import { formatGold, formatWindow, getEnemyCardLabel, matchTone } from "../types";
import styles from "../Enemies.module.css";

function getToneClass(tone: ReturnType<typeof matchTone>) {
  if (tone === "good") return styles.toneGood;
  if (tone === "bad") return styles.toneBad;
  if (tone === "neutral") return styles.toneNeutral;
  return styles.toneMuted;
}

export function EnemyCard({
  enemy,
  index,
  onSelect,
}: {
  enemy: EnrichedEnemy;
  index: number;
  onSelect: (enemy: EnrichedEnemy) => void;
}) {
  const toneClass = getToneClass(matchTone(enemy.currentWeatherMatch));
  const hasEv = Number.isFinite(enemy.lootEv) && enemy.lootEv > 0;

  return (
    <button
      type="button"
      className={`${styles.enemyCard} ${toneClass}`}
      onClick={() => onSelect(enemy)}
      aria-label={getEnemyCardLabel(enemy)}
    >
      <span className={styles.enemyCardArt}>
        <GameImage
          src={enemy.imageUrl}
          alt={enemy.name}
          width={48}
          height={48}
          priority={index < 8}
          className={styles.enemySprite}
          fallback={<Icon name="enemy" size="xl" className={styles.enemyCardFallback} aria-hidden="true" />}
        />
      </span>

      <span className={styles.enemyCardMain}>
        <span className={styles.enemyCardHeader}>
          <strong className={styles.enemyName}>{enemy.name}</strong>
          <span className={styles.enemyLevelBadge}>Lv. {enemy.level}</span>
        </span>

        <span className={styles.enemyLocation}>{enemy.locationName}</span>

        <span className={styles.enemyCardWeatherRow}>
          <span className={`${styles.matchChip} ${toneClass}`}>
            {enemy.currentWeather?.name || "Unknown"}: {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
          </span>
          <span className={styles.enemyCardWindow}>
            <Icon name="weatherOvercast" size="xs" aria-hidden="true" />
            <span>{formatWindow(enemy)}</span>
          </span>
        </span>
      </span>

      <span className={styles.enemyCardStats}>
        <span className={styles.enemyDropCount}>{enemy.lootCount} drops</span>
        <strong className={`${styles.enemyLootEv} ${hasEv ? "" : styles.enemyLootEvMuted}`}>
          {hasEv && <GoldIcon size={13} />}
          <span>{formatGold(enemy.lootEv)}</span>
        </strong>
      </span>
    </button>
  );
}
