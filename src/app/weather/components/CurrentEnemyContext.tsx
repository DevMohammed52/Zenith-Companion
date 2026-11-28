import React from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import type { WeatherData } from "@/constants/weatherData";
import {
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { getEnemyWeatherLabel } from "../types";
import styles from "../Weather.module.css";

export function CurrentEnemyContext({
  activeWeather,
  favoredEnemies,
  penalizedEnemies,
  characterCombatLevel,
}: {
  activeWeather: WeatherData;
  favoredEnemies: EnrichedEnemy[];
  penalizedEnemies: EnrichedEnemy[];
  characterCombatLevel?: number | null;
}) {
  const renderEnemy = (enemy: EnrichedEnemy, tone: "favored" | "penalized") => (
    <Link
      key={`${tone}-${enemy.locationKey}-${enemy.name}`}
      href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
      className={styles.currentEnemyLink}
      aria-label={getEnemyWeatherLabel(enemy, `${tone} by current ${activeWeather.name}`)}
    >
      <div className={styles.enemyAvatarShell}>
        {enemy.imageUrl ? (
          <GameImage src={enemy.imageUrl} alt="" width={36} height={36} sizes="36px" className={styles.enemyAvatarImg} />
        ) : (
          <Icon name="combat" size="md" />
        )}
      </div>
      <div className={styles.enemyInfoCol}>
        <div className={styles.enemyInfoTop}>
          <strong>{enemy.name}</strong>
          <Badge variant="neutral" size="sm">
            Lv.{enemy.level}
          </Badge>
        </div>
        <div className={styles.enemyInfoBottom}>
          <small>
            {enemy.locationName} | {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
          </small>
          <Badge variant={tone === "favored" ? "success" : "danger"} size="sm">
            {tone === "favored" ? "Boosted" : "Penalty"}
          </Badge>
        </div>
      </div>
    </Link>
  );

  return (
    <Card variant="default" className={styles.liveCard}>
      <div className={`${styles.cardHeader} ${styles.cardHeaderCompact}`}>
        <Icon name="combat" size="md" />
        <div className={styles.cardHeaderTitleRow}>
          <h3>Current Enemy Match</h3>
          {characterCombatLevel && (
            <Badge variant="neutral" size="sm">
              Capped to Lv.{characterCombatLevel}
            </Badge>
          )}
        </div>
      </div>
      <div className={styles.laneStack}>
        <section>
          <div className={styles.laneTitle}>
            <span>Favored by {activeWeather.name}</span>
            <Badge variant="success" size="sm">
              {favoredEnemies.length}
            </Badge>
          </div>
          <div className={styles.laneList}>
            {favoredEnemies.slice(0, 5).map((enemy) => renderEnemy(enemy, "favored"))}
            {favoredEnemies.length === 0 && (
              <EmptyState
                variant="no-data"
                title="No favored enemies found"
                description={`No active location currently spawns enemies that favor ${activeWeather.name}.`}
                size="sm"
              />
            )}
          </div>
        </section>

        <section>
          <div className={styles.laneTitle}>
            <span>Penalized by {activeWeather.name}</span>
            <Badge variant="danger" size="sm">
              {penalizedEnemies.length}
            </Badge>
          </div>
          <div className={styles.laneList}>
            {penalizedEnemies.slice(0, 5).map((enemy) => renderEnemy(enemy, "penalized"))}
            {penalizedEnemies.length === 0 && (
              <EmptyState
                variant="no-data"
                title="No penalized enemies"
                description={`No current enemies in these locations suffer spawn penalties from ${activeWeather.name}.`}
                size="sm"
              />
            )}
          </div>
        </section>
      </div>
    </Card>
  );
}
