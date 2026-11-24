import React from "react";
import Link from "next/link";
import Image from "next/image";
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
      className={`current-enemy-link ${tone}`}
      aria-label={getEnemyWeatherLabel(enemy, `${tone} by current ${activeWeather.name}`)}
    >
      <div className="enemy-avatar-shell">
        {enemy.imageUrl ? (
          <Image src={enemy.imageUrl} alt="" width={36} height={36} unoptimized />
        ) : (
          <Icon name="combat" size="md" />
        )}
      </div>
      <div className="enemy-info-col">
        <div className="enemy-info-top">
          <strong>{enemy.name}</strong>
          <Badge variant="neutral" size="sm">
            Lv.{enemy.level}
          </Badge>
        </div>
        <div className="enemy-info-bottom">
          <small>
            {enemy.locationName} &middot; {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
          </small>
          <Badge variant={tone === "favored" ? "success" : "danger"} size="sm">
            {tone === "favored" ? "Boosted" : "Penalty"}
          </Badge>
        </div>
      </div>
    </Link>
  );

  return (
    <Card variant="default" className="current-enemy-card">
      <div className="card-header compact">
        <Icon name="combat" size="md" />
        <div className="card-header-title-row">
          <h3>Current Enemy Match</h3>
          {characterCombatLevel && (
            <Badge variant="neutral" size="sm">
              Capped to Lv.{characterCombatLevel}
            </Badge>
          )}
        </div>
      </div>
      <div className="current-enemy-grid">
        <section className="current-enemy-lane">
          <div className="forecast-lane-title good">
            <span>Favored by {activeWeather.name}</span>
            <Badge variant="success" size="sm">
              {favoredEnemies.length}
            </Badge>
          </div>
          <div className="current-enemy-list">
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

        <section className="current-enemy-lane">
          <div className="forecast-lane-title bad">
            <span>Penalized by {activeWeather.name}</span>
            <Badge variant="danger" size="sm">
              {penalizedEnemies.length}
            </Badge>
          </div>
          <div className="current-enemy-list">
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
