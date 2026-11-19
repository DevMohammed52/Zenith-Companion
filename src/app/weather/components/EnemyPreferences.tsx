import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Swords } from "lucide-react";
import type { EnrichedEnemy } from "@/lib/world-intelligence";
import {
  getEnemyWeatherLabel,
  type WeatherEnemyBuckets,
} from "../types";

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
    <div className={`enemy-pref-group ${tone}`}>
      <div className="enemy-pref-heading">
        <h4>{title}</h4>
        <span>{enemies.length}</span>
      </div>
      <div className="enemy-pref-list">
        {enemies.slice(0, 8).map((enemy) => (
          <Link
            key={`${title}-${enemy.locationKey}-${enemy.name}`}
            href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
            className="enemy-pref-link"
            aria-label={getEnemyWeatherLabel(enemy, `${title.toLowerCase()}s ${weatherName}`)}
          >
            {enemy.imageUrl ? <Image src={enemy.imageUrl} alt="" width={40} height={40} unoptimized /> : <Swords size={20} />}
            <span>
              <strong>{enemy.name}</strong>
              <small>{enemy.locationName} - Lv.{enemy.level}</small>
            </span>
            <ExternalLink size={12} />
          </Link>
        ))}
        {enemies.length === 0 && <p className="enemy-pref-empty">No confirmed enemies.</p>}
        {hiddenCount > 0 && (
          <Link href={`/enemies?search=${encodeURIComponent(weatherName)}`} className="enemy-pref-more">
            View {hiddenCount} more
            <ExternalLink size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function EnemyPreferences({
  weatherName,
  enemies,
}: {
  weatherName: string;
  enemies: WeatherEnemyBuckets;
}) {
  return (
    <div className="enemy-weather-card">
      <div className="card-header">
        <Swords size={18} />
        <h3>Enemy Preferences</h3>
      </div>
      <div className="enemy-weather-groups">
        <EnemyPreferenceGroup title="Love" tone="good" weatherName={weatherName} enemies={enemies.loves} />
        <EnemyPreferenceGroup title="Like" tone="good" weatherName={weatherName} enemies={enemies.likes} />
        <EnemyPreferenceGroup title="Dislike" tone="bad" weatherName={weatherName} enemies={enemies.dislikes} />
        <EnemyPreferenceGroup title="Hate" tone="bad" weatherName={weatherName} enemies={enemies.hates} />
      </div>
    </div>
  );
}
