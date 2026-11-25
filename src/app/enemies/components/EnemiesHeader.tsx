import React from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "../Enemies.module.css";

export function EnemiesHeader({
  stats,
  filteredEnemiesCount,
}: {
  stats: {
    enemies: number;
    locations: number;
    favored: number;
    penalized: number;
  };
  filteredEnemiesCount: number;
}) {
  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 id="enemy-db-page-title" className={styles.heroTitle}>
            <Icon name="boss" size="xl" className={styles.heroIcon} aria-hidden="true" />
            <span>Enemy Database</span>
          </h1>
          <p className={styles.subtitle}>
            Browse {stats.enemies} enemies across IdleMMO with combat stats, drop tables, and weather synergies.
          </p>
        </div>
      </header>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {filteredEnemiesCount === 0
          ? "No enemies match the current filters."
          : `${filteredEnemiesCount} ${filteredEnemiesCount === 1 ? "enemy" : "enemies"} shown.`}
      </div>
    </>
  );
}
