"use client";

import React from "react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
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
      <div className="profile-panel-heading" style={{ marginTop: "1.75rem" }}>
        <div>
          <h2>Primary Skilling Levels</h2>
          <p>Gathering, refining, and crafting skills. Levels can exceed 100 via ascension.</p>
        </div>
      </div>
      <div className="profile-grid compact">
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
              hint={asc ? `Ascension ${asc}` : undefined}
              source={fieldSource(`skills.${key}.level`) || fieldSource(`skills.${key}`)}
            />
          );
        })}
      </div>

      <div className="profile-panel-heading" style={{ marginTop: "1.75rem" }}>
        <div>
          <h2>Masteries & Special Skills</h2>
          <p>Guild, meditation, and seasonal masteries exempt from economic penalties.</p>
        </div>
      </div>
      <div className="profile-grid compact">
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
              hint={asc ? `Ascension ${asc}` : undefined}
              source={fieldSource(`skills.${key}.level`) || fieldSource(`skills.${key}`)}
            />
          );
        })}
      </div>
    </>
  );
}
