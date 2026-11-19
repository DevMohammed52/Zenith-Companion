import React from "react";
import { Cloud, Skull } from "lucide-react";
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
  return (
    <button
      type="button"
      className={`enemy-card ${matchTone(enemy.currentWeatherMatch)}`}
      onClick={() => onSelect(enemy)}
      aria-label={getEnemyCardLabel(enemy)}
    >
      <span className="enemy-card-art">
        {enemy.imageUrl ? (
          <img
            src={enemy.imageUrl}
            alt=""
            width={42}
            height={42}
            loading={index < 8 ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <Skull size={28} />
        )}
      </span>
      <span className="enemy-card-main">
        <span className="enemy-title-row">
          <strong>{enemy.name}</strong>
          <em>Lv.{enemy.level}</em>
        </span>
        <small>{enemy.locationName}</small>
        <span className={`match-chip ${matchTone(enemy.currentWeatherMatch)}`}>
          {enemy.currentWeather?.name || "Unknown"}: {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
        </span>
        <span className="enemy-card-window">
          <Cloud size={13} aria-hidden="true" />
          {formatWindow(enemy)}
        </span>
      </span>
      <span className="enemy-card-stats">
        <span>{enemy.lootCount} drops</span>
        <strong>{formatGold(enemy.lootEv)}</strong>
      </span>
    </button>
  );
}
