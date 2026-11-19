import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Swords } from "lucide-react";
import type { WeatherData } from "@/constants/weatherData";
import {
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import { getEnemyWeatherLabel } from "../types";

export function CurrentEnemyContext({
  activeWeather,
  favoredEnemies,
  penalizedEnemies,
}: {
  activeWeather: WeatherData;
  favoredEnemies: EnrichedEnemy[];
  penalizedEnemies: EnrichedEnemy[];
}) {
  const renderEnemy = (enemy: EnrichedEnemy, tone: "favored" | "penalized") => (
    <Link
      key={`${tone}-${enemy.locationKey}-${enemy.name}`}
      href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
      className={`current-enemy-link ${tone}`}
      aria-label={getEnemyWeatherLabel(enemy, `${tone} by current ${activeWeather.name}`)}
    >
      {enemy.imageUrl ? <Image src={enemy.imageUrl} alt="" width={34} height={34} unoptimized /> : <Swords size={18} />}
      <span>
        <strong>{enemy.name}</strong>
        <small>{enemy.locationName} - {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}</small>
      </span>
      <em>{tone === "favored" ? "Boosted" : "Risk"}</em>
    </Link>
  );

  return (
    <div className="current-enemy-card">
      <div className="card-header compact">
        <Activity size={18} />
        <h3>Current Enemy Match</h3>
      </div>
      <div className="current-enemy-grid">
        <section>
          <div className="forecast-lane-title good">
            <span>Favored by {activeWeather.name}</span>
            <strong>{favoredEnemies.length}</strong>
          </div>
          <div className="current-enemy-list">
            {favoredEnemies.slice(0, 5).map((enemy) => renderEnemy(enemy, "favored"))}
            {favoredEnemies.length === 0 && <p className="forecast-empty">No current favorable enemy match.</p>}
          </div>
        </section>
        <section>
          <div className="forecast-lane-title bad">
            <span>Penalized by {activeWeather.name}</span>
            <strong>{penalizedEnemies.length}</strong>
          </div>
          <div className="current-enemy-list">
            {penalizedEnemies.slice(0, 5).map((enemy) => renderEnemy(enemy, "penalized"))}
            {penalizedEnemies.length === 0 && <p className="forecast-empty">No current penalty match.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
