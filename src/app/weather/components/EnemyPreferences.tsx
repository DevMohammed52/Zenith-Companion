import React, { useState } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import type { EnrichedEnemy } from "@/lib/world-intelligence";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  getEnemyWeatherLabel,
  type WeatherEnemyBuckets,
} from "../types";
import styles from "../Weather.module.css";

function EnemyPreferenceGroup({
  title,
  tone,
  weatherName,
  enemies,
}: {
  title: string;
  tone: "good" | "bad";
  weatherName: string;
  enemies: EnrichedEnemy[];
}) {
  const hiddenCount = Math.max(0, enemies.length - 8);
  return (
    <div className={styles.enemyPrefGroup}>
      <div className={styles.enemyPrefHeading}>
        <h4>{title}</h4>
        <Badge variant={tone === "good" ? "success" : "danger"} size="sm">
          {enemies.length}
        </Badge>
      </div>
      <div className={styles.enemyPrefList}>
        {enemies.slice(0, 8).map((enemy) => (
          <Link
            key={`${title}-${enemy.locationKey}-${enemy.name}`}
            href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
            className={styles.enemyPrefLink}
            aria-label={getEnemyWeatherLabel(enemy, `${title.toLowerCase()}s ${weatherName}`)}
          >
            <div className={styles.enemyAvatarShell}>
              {enemy.imageUrl ? (
                <GameImage src={enemy.imageUrl} alt="" width={36} height={36} sizes="36px" className={styles.enemyAvatarImg} />
              ) : (
                <Icon name="combat" size="md" />
              )}
            </div>
            <div className={styles.enemyPrefText}>
              <strong>{enemy.name}</strong>
              <small>
                {enemy.locationName} &middot; Lv.{enemy.level}
              </small>
            </div>
            <Icon name="externalLink" size="xs" />
          </Link>
        ))}
        {enemies.length === 0 && (
          <EmptyState
            variant="no-data"
            title={`No ${title} enemies`}
            description={`No enemies currently categorized as ${title.toLowerCase()} in ${weatherName}.`}
            size="sm"
          />
        )}
        {hiddenCount > 0 && (
          <Link href={`/enemies?search=${encodeURIComponent(weatherName)}`} className={styles.enemyPrefMore}>
            <span>View {hiddenCount} more</span>
            <Icon name="externalLink" size="xs" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function EnemyPreferences({
  weatherName,
  enemies,
  characterCombatLevel,
  filterByLevel,
  onToggleLevelFilter,
}: {
  weatherName: string;
  enemies: WeatherEnemyBuckets;
  characterCombatLevel?: number | null;
  filterByLevel?: boolean;
  onToggleLevelFilter?: (enabled: boolean) => void;
}) {
  const [prefFilter, setPrefFilter] = useState<"all" | "favored" | "penalized">("all");

  const totalFavored = enemies.loves.length + enemies.likes.length;
  const totalPenalized = enemies.dislikes.length + enemies.hates.length;

  const filterOptions = [
    { value: "all", label: `All (${totalFavored + totalPenalized})` },
    { value: "favored", label: `Favored (${totalFavored})` },
    { value: "penalized", label: `Penalized (${totalPenalized})` },
  ];

  return (
    <Card variant="default" className={styles.enemyPrefsCard}>
      <div className={styles.enemyPrefsHeaderRow}>
        <div className={styles.cardHeaderLeft}>
          <Icon name="combat" size="md" />
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>Enemy Preferences</h3>
        </div>
        {characterCombatLevel && onToggleLevelFilter && (
          <Button
            variant={filterByLevel ? "primary" : "secondary"}
            size="md"
            onClick={() => onToggleLevelFilter(!filterByLevel)}
            aria-pressed={filterByLevel}
          >
            {filterByLevel ? `Matching Lv.${characterCombatLevel}` : `Cap to Lv.${characterCombatLevel}`}
          </Button>
        )}
      </div>

      <div className={styles.enemyFilterBar}>
        <SegmentedControl
          options={filterOptions}
          value={prefFilter}
          onChange={(val) => setPrefFilter(val as "all" | "favored" | "penalized")}
          ariaLabel="Filter enemy preferences by impact"
        />
      </div>

      <div className={styles.enemyGroupsGrid}>
        {(prefFilter === "all" || prefFilter === "favored") && (
          <>
            <EnemyPreferenceGroup title="Love" tone="good" weatherName={weatherName} enemies={enemies.loves} />
            <EnemyPreferenceGroup title="Like" tone="good" weatherName={weatherName} enemies={enemies.likes} />
          </>
        )}
        {(prefFilter === "all" || prefFilter === "penalized") && (
          <>
            <EnemyPreferenceGroup title="Dislike" tone="bad" weatherName={weatherName} enemies={enemies.dislikes} />
            <EnemyPreferenceGroup title="Hate" tone="bad" weatherName={weatherName} enemies={enemies.hates} />
          </>
        )}
      </div>
    </Card>
  );
}
