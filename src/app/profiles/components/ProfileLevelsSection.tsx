"use client";

import React from "react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { ascensionLevel } from "@/lib/profile-calculations";
import styles from "../Profiles.module.css";
import { ProfileNumberField } from "./ProfileControls";

export const LEVEL_FIELDS: Array<[keyof CharacterProfile["levels"], string, { min: number; max: number }]> = [
  ["totalLevel", "Total Level", { min: 20, max: 2300 }],
  ["combat", "Combat", { min: 1, max: 600 }],
  ["strength", "Strength", { min: 1, max: 100 }],
  ["defence", "Defence", { min: 1, max: 100 }],
  ["speed", "Speed", { min: 1, max: 100 }],
  ["dexterity", "Dexterity", { min: 1, max: 100 }],
  ["huntingMastery", "Hunting Mastery", { min: 1, max: 600 }],
  ["dungeoneering", "Dungeoneering", { min: 1, max: 600 }],
  ["petMastery", "Pet Mastery", { min: 1, max: 100 }],
];

export const ASCENSION_LEVEL_FIELDS = new Set<keyof CharacterProfile["levels"]>([
  "combat",
  "huntingMastery",
  "dungeoneering",
]);

export interface ProfileLevelsSectionProps {
  levels: CharacterProfile["levels"];
  onChangeLevel: (key: keyof CharacterProfile["levels"], value: number | "") => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
}

export function ProfileLevelsSection({
  levels,
  onChangeLevel,
  fieldSource,
}: ProfileLevelsSectionProps) {
  return (
    <>
      <div className={styles.panelHeading}>
        <div>
          <h2>Combat & Core Levels</h2>
          <p>Combat, Hunting Mastery, and Dungeoneering store ascension levels above 100.</p>
        </div>
      </div>

      <div className={styles.gridFour}>
        {LEVEL_FIELDS.map(([key, label, limits]) => {
          const asc = ASCENSION_LEVEL_FIELDS.has(key) ? ascensionLevel(levels[key]) : 0;
          return (
            <ProfileNumberField
              key={key}
              label={label}
              value={levels[key]}
              min={limits.min}
              max={limits.max}
              onChange={(value) => onChangeLevel(key, value)}
              badge={asc ? `Asc. ${asc}` : undefined}
              source={fieldSource(`levels.${key}`)}
            />
          );
        })}
      </div>
    </>
  );
}
