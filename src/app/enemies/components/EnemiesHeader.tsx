import React from "react";
import ZenithIcon from "@/components/icons/ZenithIcon";

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
      <header className="enemy-hero">
        <div className="enemy-hero-content">
          <h1 id="enemy-db-page-title">
            <ZenithIcon name="enemy" size={24} />
            Enemy Database
          </h1>
          <p className="enemy-subtitle">
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
