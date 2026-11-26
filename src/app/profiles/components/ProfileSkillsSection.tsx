"use client";

import React from "react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import styles from "../Profiles.module.css";
import { ProfileNumberField } from "./ProfileControls";

export const SKILL_FIELDS: Array<[string, string]> = [
  ["woodcutting", "Woodcutting"],
  ["mining", "Mining"],
  ["fishing", "Fishing"],
  ["cooking", "Cooking"],
  ["smelting", "Smelting"],
  ["alchemy", "Alchemy"],
  ["forge", "Forge"],
  ["construction", "Construction"],
];

export const MASTERY_FIELDS: Array<[string, string]> = [
  ["meditation", "Meditation"],
  ["guild-mastery", "Guild Mastery"],
  ["shadow-mastery", "Shadow Mastery"],
  ["lunar-mastery", "Lunar Mastery"],
  ["springtide-mastery", "Springtide Mastery"],
  ["yule-mastery", "Yule Mastery"],
];

export function getSkillInputLevel(
  skills: CharacterProfile["skills"] | undefined,
  skillKey: string,
): number | "" {
  if (!skills) return "";
  const entry =
    skills[skillKey] ??
    skills[skillKey.replace(/-/g, "_")] ??
    skills[skillKey.replace(/_/g, "-")];
  return typeof entry?.level === "number" || entry?.level === "" ? entry.level : "";
}

export interface ProfileSkillsSectionProps {
  skills: CharacterProfile["skills"] | undefined;
  getSkillInputLevel?: (skillKey: string) => number | "";
  onUpdateSkill: (skillKey: string, levelValue: number | "") => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
}

export function ProfileSkillsSection({
  skills,
  getSkillInputLevel: customGetLevel,
  onUpdateSkill,
  fieldSource,
}: ProfileSkillsSectionProps) {
  const resolveLevel = (key: string) => {
    if (customGetLevel) return customGetLevel(key);
    return getSkillInputLevel(skills, key);
  };

  return (
    <>
      <div className={styles.subHeading}>
        <div>
          <h3>Primary Skilling Levels</h3>
          <p>Gathering, refining, and crafting skills. Levels above 100 count as ascension.</p>
        </div>
      </div>

      <div className={styles.gridFour}>
        {SKILL_FIELDS.map(([key, label]) => {
          const currentLevel = resolveLevel(key);
          const asc = typeof currentLevel === "number" && currentLevel > 100 ? currentLevel - 100 : 0;
          return (
            <ProfileNumberField
              key={key}
              label={label}
              value={currentLevel}
              min={1}
              max={600}
              onChange={(value) => onUpdateSkill(key, value)}
              badge={asc ? `Asc. ${asc}` : undefined}
              source={fieldSource(`skills.${key}.level`) || fieldSource(`skills.${key}`)}
            />
          );
        })}
      </div>

      <div className={styles.subHeading}>
        <div>
          <h3>Masteries & Special Skills</h3>
          <p>Guild, meditation, and seasonal masteries exempt from market price penalties.</p>
        </div>
      </div>

      <div className={styles.gridFour}>
        {MASTERY_FIELDS.map(([key, label]) => {
          const currentLevel = resolveLevel(key);
          const asc = typeof currentLevel === "number" && currentLevel > 100 ? currentLevel - 100 : 0;
          return (
            <ProfileNumberField
              key={key}
              label={label}
              value={currentLevel}
              min={1}
              max={600}
              onChange={(value) => onUpdateSkill(key, value)}
              badge={asc ? `Asc. ${asc}` : undefined}
              source={fieldSource(`skills.${key}.level`) || fieldSource(`skills.${key}`)}
            />
          );
        })}
      </div>
    </>
  );
}
