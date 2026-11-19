import React from "react";
import {
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
  type WeatherPreferenceKind,
} from "@/lib/world-intelligence";
import { matchTone } from "../types";

export function PreferencePills({ enemy }: { enemy: EnrichedEnemy }) {
  const preference = enemy.weatherPreference;
  if (!preference) return <span className="empty-inline">No weather data</span>;

  const groups: { kind: WeatherPreferenceKind; values: string[] }[] = [
    { kind: "loves", values: preference.loves },
    { kind: "likes", values: preference.likes },
    { kind: "neutral", values: preference.neutral },
    { kind: "dislikes", values: preference.dislikes },
    { kind: "hates", values: preference.hates },
  ];

  return (
    <div className="preference-pills">
      {groups
        .filter((group) => group.values.length > 0)
        .map((group) => (
          <span key={group.kind} className={`preference-pill ${matchTone(group.kind)}`}>
            <strong>{getWeatherPreferenceLabel(group.kind)}</strong>
            {group.values.join(", ")}
          </span>
        ))}
    </div>
  );
}
