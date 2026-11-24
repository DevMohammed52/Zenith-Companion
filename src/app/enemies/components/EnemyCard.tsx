import React from "react";
import { Cloud, Skull } from "lucide-react";
import { GameImage } from "@/components/GameImage";
import {
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import { formatGold, formatWindow, getEnemyCardLabel, matchTone } from "../types";

export function EnemyCard({
  enemy,
  index,
  onSelect,
}: {
  enemy: EnrichedEnemy;
  index: number;
  onSelect: (enemy: EnrichedEnemy) => void;
}) {
  const tone = matchTone(enemy.currentWeatherMatch);

  return (
    <button
      type="button"
      className={`enemy-card ${tone}`}
      onClick={() => onSelect(enemy)}
      aria-label={getEnemyCardLabel(enemy)}
    >
      <span className="enemy-card-art">
        <GameImage
          src={enemy.imageUrl}
          alt={enemy.name}
          width={48}
          height={48}
          priority={index < 8}
          className="enemy-sprite"
          fallback={<Skull size={26} className="enemy-card-skull" aria-hidden="true" />}
        />
      </span>

      <span className="enemy-card-main">
        <span className="enemy-card-header">
          <strong className="enemy-name">{enemy.name}</strong>
          <span className="enemy-level-badge">Lv. {enemy.level}</span>
        </span>

        <span className="enemy-location">{enemy.locationName}</span>

        <span className="enemy-card-weather-row">
          <span className={`match-chip ${tone}`}>
            {enemy.currentWeather?.name || "Unknown"}: {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
          </span>
          <span className="enemy-card-window">
            <Cloud size={12} aria-hidden="true" />
            <span>{formatWindow(enemy)}</span>
          </span>
        </span>
      </span>

      <span className="enemy-card-stats">
        <span className="enemy-drop-count">{enemy.lootCount} drops</span>
        <strong className="enemy-loot-ev">{formatGold(enemy.lootEv)}</strong>
      </span>
    </button>
  );
}
