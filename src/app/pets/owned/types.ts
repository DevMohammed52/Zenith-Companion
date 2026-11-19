import type { ProfileOwnedPet, ProfilePetStats } from "@/lib/profiles";

export const PET_STAT_LABELS: Array<[keyof ProfilePetStats, string]> = [
  ["agility", "Agi"],
  ["accuracy", "Acc"],
  ["protection", "Prot"],
  ["attackPower", "AP"],
  ["movementSpeed", "Move"],
  ["maxHealth", "HP"],
  ["maxStamina", "Stam"],
  ["criticalDamage", "CDmg"],
  ["criticalChance", "Crit"],
];

export const SOURCE_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "imported", label: "Imported" },
  { id: "manual", label: "Manual" },
] as const;

export const SORT_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "level", label: "Level" },
  { id: "quality", label: "Quality" },
  { id: "source", label: "Source" },
] as const;

export type SourceFilter = typeof SOURCE_FILTERS[number]["id"];
export type SortKey = typeof SORT_OPTIONS[number]["id"];
export type SortDirection = "asc" | "desc";
export type PendingRemoval = {
  pet: ProfileOwnedPet;
  index: number;
};

export const FRIENDLY_SECTION_LABELS: Record<string, string> = {
  museum_private: "Museum private",
  pets_private: "Pets private",
  pet_private: "Pets private",
  pets_missing: "No imported pet section",
  pet_missing: "No imported pet section",
};
