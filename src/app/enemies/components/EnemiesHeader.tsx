import React from "react";
import { Cloud, MapPin, Package, Shield } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { ENEMY_WEATHER_META } from "@/lib/world-intelligence";

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
        <div>
          <h1 id="enemy-db-page-title"><ZenithIcon name="enemy" size={24} /> Enemy Database</h1>
          <p>Find IdleMMO enemies by location, drops, level band, and current weather fit.</p>
        </div>
        <div className="hero-meta">
          <span>{stats.enemies.toLocaleString()} enemies</span>
          <small>{ENEMY_WEATHER_META.confirmed_count.toLocaleString()} weather profiles</small>
        </div>
      </header>

      <section className="enemy-summary" aria-label="Enemy database summary">
        <div><MapPin size={16} /><span>Locations</span><strong>{stats.locations}</strong></div>
        <div><Cloud size={16} /><span>Favored now</span><strong>{stats.favored}</strong></div>
        <div><Shield size={16} /><span>Penalized now</span><strong>{stats.penalized}</strong></div>
        <div><Package size={16} /><span>Shown</span><strong>{filteredEnemiesCount}</strong></div>
      </section>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {filteredEnemiesCount === 0
          ? "No enemies match the current filters."
          : `${filteredEnemiesCount} ${filteredEnemiesCount === 1 ? "enemy" : "enemies"} shown.`}
      </div>
    </>
  );
}
