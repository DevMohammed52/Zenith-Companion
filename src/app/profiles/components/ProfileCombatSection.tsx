"use client";

import React from "react";
import { Shield } from "lucide-react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { ProfileNumberField } from "./ProfileControls";

export const SECONDARY_FIELDS: Array<[keyof CharacterProfile["secondaryStats"], string]> = [
  ["attackPower", "Attack Power"],
  ["protection", "Protection"],
  ["agility", "Agility"],
  ["accuracy", "Accuracy"],
  ["criticalChance", "Crit Chance"],
  ["criticalDamage", "Crit Damage"],
  ["movementSpeed", "Movement Speed"],
  ["damage", "Damage"],
];

export interface ProfileCombatSectionProps {
  secondaryStats: CharacterProfile["secondaryStats"];
  calculatedSecondary: Record<string, number> | null;
  combatStatTotal: number;
  onChangeSecondaryStat: (key: keyof CharacterProfile["secondaryStats"], value: number | "") => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
}

export function ProfileCombatSection({
  secondaryStats,
  calculatedSecondary,
  combatStatTotal,
  onChangeSecondaryStat,
  fieldSource,
}: ProfileCombatSectionProps) {
  return (
    <section id="profile-combat" className="profile-panel" tabIndex={-1}>
      <div className="profile-panel-heading">
        <div>
          <h2>Combat Snapshot</h2>
          <p>Calculated from core levels, selected gear tiers, pet stats, and active class talents. You can still edit any final value manually.</p>
        </div>
        <div className="profile-stat-pill"><Shield size={14} /> {combatStatTotal.toLocaleString()} calculated dungeon stats</div>
      </div>
      <div className="profile-auto-card">
        {SECONDARY_FIELDS.map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{calculatedSecondary?.[key]?.toLocaleString() || 0}</strong>
          </div>
        ))}
      </div>
      <div className="profile-grid compact">
        {SECONDARY_FIELDS.map(([key, label]) => (
          <ProfileNumberField
            key={key}
            label={label}
            value={secondaryStats[key]}
            step={key === "movementSpeed" ? "0.01" : "1"}
            min={key === "movementSpeed" ? 3 : key === "criticalChance" || key === "criticalDamage" || key === "damage" ? 0 : 2}
            onChange={(value) => onChangeSecondaryStat(key, value)}
            source={fieldSource(`secondaryStats.${key}`)}
          />
        ))}
      </div>
    </section>
  );
}
