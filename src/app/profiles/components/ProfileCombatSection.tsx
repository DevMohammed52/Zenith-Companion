"use client";

import React from "react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import styles from "../Profiles.module.css";
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
    <section id="profile-combat" className={styles.panel} tabIndex={-1}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Combat Snapshot</h2>
          <p>
            Derived automatically from core levels, equipped gear tiers, pet stats, and active class talents.
          </p>
        </div>
        <Badge
          variant="neutral"
          size="md"
          icon={<Icon name="defense" size="xs" aria-hidden="true" />}
        >
          {combatStatTotal.toLocaleString()} dungeon power
        </Badge>
      </div>

      <div className={styles.statStrip} aria-label="Calculated combat stats">
        {SECONDARY_FIELDS.map(([key, label]) => (
          <div key={key} className={styles.statCell}>
            <span>{label}</span>
            <strong>{calculatedSecondary?.[key]?.toLocaleString() || 0}</strong>
          </div>
        ))}
      </div>

      <div className={styles.subHeading} style={{ marginTop: "0.75rem", paddingTop: "0.95rem" }}>
        <div>
          <h3>Manual Stat Overrides</h3>
          <p>Adjust any visible stat below to override calculator totals for simulation.</p>
        </div>
      </div>

      <div className={styles.gridFour}>
        {SECONDARY_FIELDS.map(([key, label]) => (
          <ProfileNumberField
            key={key}
            label={label}
            value={secondaryStats[key]}
            step={key === "movementSpeed" ? "0.01" : "1"}
            min={
              key === "movementSpeed"
                ? 3
                : key === "criticalChance" || key === "criticalDamage" || key === "damage"
                  ? 0
                  : 2
            }
            onChange={(value) => onChangeSecondaryStat(key, value)}
            source={fieldSource(`secondaryStats.${key}`)}
          />
        ))}
      </div>
    </section>
  );
}
