"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AssaultRank } from "@/lib/skill-profit";
import { createDefaultHousing, sanitizeHousing, type ProfileHousing } from "@/lib/housing";
import { sanitizeMuseumSnapshot, type ProfileMuseumSnapshot } from "@/lib/museum";

export const PROFILE_STORAGE_KEY = "zenith_character_profiles_v1";
export const PROFILE_UPDATED_EVENT = "zenith-profiles-updated";
export const MAX_PROFILES = 5;
export const DEFAULT_PROFILE_SKIN_IMAGE_URL =
  "https://cdn.idle-mmo.com/uploaded/skins/2h65o3Ag4fa8xWGt1n4ik3xbe0nET7-metaRWltaXIgKHJlcGxhY2UgdGhlIG9sZCBvbmUpLnBuZw==-.png";
export const DEFAULT_PROFILE_BACKGROUND_IMAGE_URL = "https://cdn.idle-mmo.com/skins/backgrounds/default.jpg";

export type ProfileKind = "main" | "alt";
export type CombatStyle = "swordShield" | "dualDaggers" | "bow";
export type ProfileImportSourceMode = "manual" | "imported" | "mixed";

export type ProfileImportSource = {
  mode: ProfileImportSourceMode;
  characterHashTail?: string;
  characterHashDigest?: string;
  importedAt?: string;
  refreshedAt?: string;
  importedSections: string[];
  missingOrPrivate: string[];
  notes: string;
};

export type ProfileFieldSourceKind = "manual" | "imported" | "calculated";

export type ProfileFieldSource = {
  source: ProfileFieldSourceKind;
  updatedAt: string;
  importedAt?: string;
};

export type ProfileSkillSnapshot = {
  level: number | "";
  experience: number | "";
};

export type ProfileLocationSnapshot = {
  id?: number;
  name: string;
  locked?: boolean;
};

export type ProfileGuildSummary = {
  id?: number;
  tag: string;
  level?: number | "";
  position?: string;
};

export type ProfileMetricsSnapshot = {
  importedAt?: string;
  endpointUpdatedAt?: string;
  categories: Record<string, Record<string, number>>;
};

export type ProfilePetStats = {
  agility: number | "";
  accuracy: number | "";
  protection: number | "";
  attackPower: number | "";
  movementSpeed: number | "";
  maxHealth: number | "";
  maxStamina: number | "";
  criticalDamage: number | "";
  criticalChance: number | "";
};

export type ProfileOwnedPet = {
  id: string;
  apiId?: number;
  petId?: number;
  species: string;
  nickname: string;
  imageUrl?: string;
  quality: string;
  level: number | "";
  experience: number | "";
  totalExperience: number | "";
  evolution: number | "";
  evolutionMax?: number | "";
  evolutionBonusPerStage?: number | "";
  evolutionCurrentBonus?: number | "";
  evolutionNextBonus?: number | "";
  evolutionCanEvolve?: boolean;
  evolutionTargets: Array<{ key: string; label: string }>;
  active: boolean;
  equipped: boolean;
  source: ProfileFieldSourceKind;
  importedAt?: string;
  hashTail?: string;
  stats: ProfilePetStats;
  health?: {
    current?: number | "";
    maximum?: number | "";
    percentage?: number | "";
  };
  battle?: {
    startedAt?: string;
    endsAt?: string;
  };
  location?: ProfileLocationSnapshot;
  createdAt?: string;
  notes: string;
};

export type CharacterProfile = {
  schemaVersion: 1;
  id: string;
  name: string;
  kind: ProfileKind;
  className: string;
  imageUrl: string;
  backgroundUrl: string;
  currentStatus: string;
  location?: ProfileLocationSnapshot;
  guild?: ProfileGuildSummary;
  combatStyle: CombatStyle;
  notes: string;
  levels: {
    totalLevel: number | "";
    combat: number | "";
    strength: number | "";
    defence: number | "";
    speed: number | "";
    dexterity: number | "";
    huntingMastery: number | "";
    dungeoneering: number | "";
    petMastery: number | "";
  };
  secondaryStats: {
    attackPower: number | "";
    protection: number | "";
    agility: number | "";
    accuracy: number | "";
    criticalChance: number | "";
    criticalDamage: number | "";
    movementSpeed: number | "";
    damage: number | "";
  };
  magicFind: {
    combat: number | "";
    dungeon: number | "";
    worldBoss: number | "";
    dailyStreak: number | "";
    dailyStreakLastAutoDate?: string;
  };
  efficiency: {
    hunting: number | "";
    dungeon: number | "";
  };
  boosts: {
    conquestRank: AssaultRank;
    barteringLevel: number | "";
  };
  timers: {
    activeHours: number | "";
    idleTimerHours: number | "";
  };
  pet: {
    species: string;
    quality: string;
    level: number | "";
    evolution: number | "";
    stats: ProfilePetStats;
    notes: string;
  };
  ownedPets: ProfileOwnedPet[];
  skills: Record<string, ProfileSkillSnapshot>;
  metricsSnapshot?: ProfileMetricsSnapshot;
  gear: Record<string, string>;
  gearTiers: Record<string, number | "">;
  tools: Record<string, string>;
  housing: ProfileHousing;
  importSource: ProfileImportSource;
  fieldSources: Record<string, ProfileFieldSource>;
  museum?: ProfileMuseumSnapshot;
  createdAt: string;
  updatedAt: string;
};

export type ProfilesState = {
  schemaVersion: 1;
  activeProfileId: string | null;
  profiles: CharacterProfile[];
};

type ProfilesContextValue = {
  state: ProfilesState;
  activeProfile: CharacterProfile | null;
  loaded: boolean;
  addProfile: (name?: string) => CharacterProfile | null;
  duplicateProfile: (profileId: string) => CharacterProfile | null;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;
  updateProfile: (profileId: string, patch: Partial<CharacterProfile>, options?: ProfileUpdateOptions) => void;
  replaceState: (state: ProfilesState) => void;
  exportProfiles: () => string;
  importProfiles: (payload: string) => { ok: boolean; error?: string };
};

export type ProfileUpdateOptions = {
  source?: ProfileFieldSourceKind;
  fieldPaths?: string[];
  markFields?: boolean;
};

const DEFAULT_GEAR = {
  helmet: "",
  chestplate: "",
  greaves: "",
  boots: "",
  gauntlets: "",
  special: "",
  weapon: "",
  offhandWeapon: "",
  shield: "",
  bow: "",
};

const DEFAULT_GEAR_TIERS: Record<string, number | ""> = {
  helmet: 1,
  chestplate: 1,
  greaves: 1,
  boots: 1,
  gauntlets: 1,
  special: 1,
  weapon: 1,
  offhandWeapon: 1,
  shield: 1,
  bow: 1,
};

const DEFAULT_TOOLS = {
  woodcutting: "",
  mining: "",
  fishing: "",
};

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

const makeId = () => (
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `profile_${Date.now()}_${Math.random().toString(16).slice(2)}`
);

const cleanNumber = (value: unknown): number | "" => {
  if (value === "") return "";
  const next = Number(value);
  return Number.isFinite(next) ? next : "";
};

const cleanStringList = (value: unknown, limit = 24) => (
  Array.isArray(value)
    ? value
        .map((entry) => typeof entry === "string" ? entry.trim() : "")
        .filter(Boolean)
        .slice(0, limit)
        .map((entry) => entry.slice(0, 120))
    : []
);

const cleanDateString = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? value : undefined;
};

const cleanUrlString = (value: unknown) => (
  typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim().slice(0, 500) : ""
);

const cleanOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const SOURCE_VALUES = new Set<ProfileFieldSourceKind>(["manual", "imported", "calculated"]);
const UNTRACKED_FIELD_ROOTS = new Set([
  "schemaVersion",
  "id",
  "createdAt",
  "updatedAt",
  "fieldSources",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function collectProfileFieldPaths(input: unknown, prefix = ""): string[] {
  if (!isPlainObject(input)) return [];
  const paths: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (!prefix && UNTRACKED_FIELD_ROOTS.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      const nested = collectProfileFieldPaths(value, path);
      if (nested.length) paths.push(...nested);
      else paths.push(path);
    } else {
      paths.push(path);
    }
  }
  return paths;
}

export function markProfileFieldSources(
  current: Record<string, ProfileFieldSource> | undefined,
  paths: string[],
  source: ProfileFieldSourceKind,
  updatedAt: string,
) {
  const next = { ...(current || {}) };
  for (const path of paths) {
    if (!path) continue;
    next[path] = {
      source,
      updatedAt,
      ...(source === "imported" ? { importedAt: updatedAt } : {}),
    };
  }
  return next;
}

export function sanitizeProfileFieldSources(input: unknown): Record<string, ProfileFieldSource> {
  if (!isPlainObject(input)) return {};
  const next: Record<string, ProfileFieldSource> = {};
  for (const [path, value] of Object.entries(input)) {
    if (!path || path.length > 120 || !isPlainObject(value)) continue;
    const source = SOURCE_VALUES.has(value.source as ProfileFieldSourceKind)
      ? value.source as ProfileFieldSourceKind
      : "manual";
    const updatedAt = cleanDateString(value.updatedAt) || cleanDateString(value.importedAt);
    if (!updatedAt) continue;
    next[path] = {
      source,
      updatedAt,
      importedAt: cleanDateString(value.importedAt),
    };
  }
  return next;
}

export function createDefaultImportSource(): ProfileImportSource {
  return {
    mode: "manual",
    importedSections: [],
    missingOrPrivate: [],
    notes: "",
  };
}

export function sanitizeProfileImportSource(input: Partial<ProfileImportSource> | null | undefined): ProfileImportSource {
  const mode = input?.mode === "imported" || input?.mode === "mixed" ? input.mode : "manual";
  return {
    mode,
    characterHashTail: typeof input?.characterHashTail === "string" && input.characterHashTail.trim()
      ? input.characterHashTail.trim().slice(-12)
      : undefined,
    characterHashDigest: typeof input?.characterHashDigest === "string" && input.characterHashDigest.trim()
      ? input.characterHashDigest.trim().slice(0, 128)
      : undefined,
    importedAt: cleanDateString(input?.importedAt),
    refreshedAt: cleanDateString(input?.refreshedAt),
    importedSections: cleanStringList(input?.importedSections),
    missingOrPrivate: cleanStringList(input?.missingOrPrivate),
    notes: typeof input?.notes === "string" ? input.notes.slice(0, 300) : "",
  };
}

export function sanitizeProfileLocation(input: unknown): ProfileLocationSnapshot | undefined {
  if (!isPlainObject(input)) return undefined;
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 120) : "";
  const id = cleanOptionalNumber(input.id);
  if (!name && typeof id === "undefined") return undefined;
  return {
    ...(typeof id === "undefined" ? {} : { id }),
    name,
    ...(typeof input.locked === "boolean" ? { locked: input.locked } : {}),
  };
}

export function sanitizeProfileGuild(input: unknown): ProfileGuildSummary | undefined {
  if (!isPlainObject(input)) return undefined;
  const tag = typeof input.tag === "string" ? input.tag.trim().slice(0, 24) : "";
  const id = cleanOptionalNumber(input.id);
  if (!tag && typeof id === "undefined") return undefined;
  return {
    ...(typeof id === "undefined" ? {} : { id }),
    tag,
    level: cleanNumber(input.level),
    position: typeof input.position === "string" ? input.position.trim().slice(0, 80) : undefined,
  };
}

export function sanitizeProfileSkills(input: unknown): Record<string, ProfileSkillSnapshot> {
  if (!isPlainObject(input)) return {};
  const next: Record<string, ProfileSkillSnapshot> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!isPlainObject(value)) continue;
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 60);
    if (!cleanKey) continue;
    next[cleanKey] = {
      level: cleanNumber(value.level),
      experience: cleanNumber(value.experience),
    };
  }
  return next;
}

export function sanitizeProfileMetrics(input: unknown): ProfileMetricsSnapshot | undefined {
  if (!isPlainObject(input)) return undefined;
  const rawCategories = isPlainObject(input.categories) ? input.categories : isPlainObject(input.metrics) ? input.metrics : input;
  const categories: Record<string, Record<string, number>> = {};
  for (const [category, metrics] of Object.entries(rawCategories)) {
    if (!isPlainObject(metrics)) continue;
    const cleanCategory = category.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 60);
    if (!cleanCategory) continue;
    const cleanMetrics: Record<string, number> = {};
    for (const [metric, value] of Object.entries(metrics)) {
      const cleanMetric = metric.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 80);
      const numberValue = Number(value);
      if (cleanMetric && Number.isFinite(numberValue)) cleanMetrics[cleanMetric] = numberValue;
    }
    if (Object.keys(cleanMetrics).length) categories[cleanCategory] = cleanMetrics;
  }
  if (!Object.keys(categories).length) return undefined;
  return {
    importedAt: cleanDateString(input.importedAt),
    endpointUpdatedAt: cleanDateString(input.endpointUpdatedAt),
    categories,
  };
}

const createEmptyPetStats = (): ProfilePetStats => ({
  agility: "",
  accuracy: "",
  protection: "",
  attackPower: "",
  movementSpeed: "",
  maxHealth: "",
  maxStamina: "",
  criticalDamage: "",
  criticalChance: "",
});

export function sanitizeProfileOwnedPets(input: unknown): ProfileOwnedPet[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isPlainObject)
    .map((pet) => {
      const stats = { ...createEmptyPetStats(), ...(isPlainObject(pet.stats) ? pet.stats : {}) } as ProfilePetStats;
      for (const key of Object.keys(stats) as Array<keyof ProfilePetStats>) {
        stats[key] = cleanNumber(stats[key]);
      }
      const health = isPlainObject(pet.health)
        ? {
            current: cleanNumber(pet.health.current),
            maximum: cleanNumber(pet.health.maximum),
            percentage: cleanNumber(pet.health.percentage),
          }
        : undefined;
      const battle = isPlainObject(pet.battle)
        ? {
            startedAt: cleanDateString(pet.battle.startedAt) || cleanDateString(pet.battle.started_at),
            endsAt: cleanDateString(pet.battle.endsAt) || cleanDateString(pet.battle.ends_at),
          }
        : undefined;
      const rawEvolutionTargets = Array.isArray(pet.evolutionTargets)
        ? pet.evolutionTargets
        : isPlainObject(pet.evolution) && Array.isArray(pet.evolution.targets)
          ? pet.evolution.targets
          : [];
      return {
        id: typeof pet.id === "string" && pet.id.trim() ? pet.id.trim().slice(0, 80) : makeId(),
        apiId: cleanOptionalNumber(pet.apiId ?? pet.api_id),
        petId: cleanOptionalNumber(pet.petId ?? pet.pet_id),
        species: typeof pet.species === "string" ? pet.species.trim().slice(0, 80) : "",
        nickname: typeof pet.nickname === "string" ? pet.nickname.trim().slice(0, 80) : "",
        imageUrl: cleanUrlString(pet.imageUrl ?? pet.image_url) || undefined,
        quality: typeof pet.quality === "string" ? pet.quality.trim().slice(0, 40) : "",
        level: cleanNumber(pet.level),
        experience: cleanNumber(pet.experience),
        totalExperience: cleanNumber(pet.totalExperience ?? pet.total_experience),
        evolution: cleanNumber(pet.evolution),
        evolutionMax: cleanNumber(pet.evolutionMax ?? (isPlainObject(pet.evolution) ? pet.evolution.max : undefined)),
        evolutionBonusPerStage: cleanNumber(pet.evolutionBonusPerStage ?? (isPlainObject(pet.evolution) ? pet.evolution.bonus_per_stage : undefined)),
        evolutionCurrentBonus: cleanNumber(pet.evolutionCurrentBonus ?? (isPlainObject(pet.evolution) ? pet.evolution.current_bonus : undefined)),
        evolutionNextBonus: cleanNumber(pet.evolutionNextBonus ?? (isPlainObject(pet.evolution) ? pet.evolution.next_bonus : undefined)),
        evolutionCanEvolve: Boolean(pet.evolutionCanEvolve ?? (isPlainObject(pet.evolution) ? pet.evolution.can_evolve : false)),
        evolutionTargets: rawEvolutionTargets.filter(isPlainObject).map((target) => ({
          key: typeof target.key === "string" ? target.key.trim().slice(0, 60) : "",
          label: typeof target.label === "string" ? target.label.trim().slice(0, 80) : "",
        })).filter((target) => target.key || target.label).slice(0, 10),
        active: Boolean(pet.active),
        equipped: Boolean(pet.equipped),
        source: SOURCE_VALUES.has(pet.source as ProfileFieldSourceKind) ? pet.source as ProfileFieldSourceKind : "manual",
        importedAt: cleanDateString(pet.importedAt),
        hashTail: typeof pet.hashTail === "string" && pet.hashTail.trim() ? pet.hashTail.trim().slice(-12) : undefined,
        stats,
        health,
        battle: battle && (battle.startedAt || battle.endsAt) ? battle : undefined,
        location: sanitizeProfileLocation(pet.location),
        createdAt: cleanDateString(pet.createdAt ?? pet.created_at),
        notes: typeof pet.notes === "string" ? pet.notes.slice(0, 300) : "",
      };
    })
    .filter((pet) => pet.species || pet.nickname)
    .slice(0, 200);
}

export function createDefaultProfile(name = "New Character"): CharacterProfile {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: makeId(),
    name,
    kind: "main",
    className: "Warrior",
    imageUrl: DEFAULT_PROFILE_SKIN_IMAGE_URL,
    backgroundUrl: DEFAULT_PROFILE_BACKGROUND_IMAGE_URL,
    currentStatus: "",
    location: undefined,
    guild: undefined,
    combatStyle: "swordShield",
    notes: "",
    levels: {
      totalLevel: 20,
      combat: 1,
      strength: 1,
      defence: 1,
      speed: 1,
      dexterity: 1,
      huntingMastery: 1,
      dungeoneering: 1,
      petMastery: 1,
    },
    secondaryStats: {
      attackPower: 2,
      protection: 2,
      agility: 2,
      accuracy: 2,
      criticalChance: 0,
      criticalDamage: 0,
      movementSpeed: 3,
      damage: 0,
    },
    magicFind: {
      combat: 0,
      dungeon: 0,
      worldBoss: 0,
      dailyStreak: 0,
      dailyStreakLastAutoDate: "",
    },
    efficiency: {
      hunting: 0,
      dungeon: 0,
    },
    boosts: {
      conquestRank: "none",
      barteringLevel: 0,
    },
    timers: {
      activeHours: 0,
      idleTimerHours: 0,
    },
    pet: {
      species: "",
      quality: "",
      level: 1,
      evolution: 0,
      stats: {
        agility: "",
        accuracy: "",
        protection: "",
        attackPower: "",
        movementSpeed: "",
        maxHealth: "",
        maxStamina: "",
        criticalDamage: "",
        criticalChance: "",
      },
      notes: "",
    },
    ownedPets: [],
    skills: {},
    metricsSnapshot: undefined,
    gear: { ...DEFAULT_GEAR },
    gearTiers: { ...DEFAULT_GEAR_TIERS },
    tools: { ...DEFAULT_TOOLS },
    housing: createDefaultHousing(),
    importSource: createDefaultImportSource(),
    fieldSources: {},
    museum: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function sanitizeProfile(input: Partial<CharacterProfile> | null | undefined): CharacterProfile {
  const base = createDefaultProfile(typeof input?.name === "string" && input.name.trim() ? input.name.trim() : "New Character");
  const next: CharacterProfile = {
    ...base,
    ...input,
    schemaVersion: 1,
    id: typeof input?.id === "string" && input.id ? input.id : base.id,
    name: typeof input?.name === "string" ? input.name.slice(0, 40) : base.name,
    kind: input?.kind === "alt" ? "alt" : "main",
    className: typeof input?.className === "string" && input.className.trim() ? input.className.trim().slice(0, 40) : base.className,
    imageUrl: cleanUrlString(input?.imageUrl) || base.imageUrl,
    backgroundUrl: cleanUrlString(input?.backgroundUrl) || base.backgroundUrl,
    currentStatus: typeof input?.currentStatus === "string" ? input.currentStatus.trim().slice(0, 40) : "",
    location: sanitizeProfileLocation(input?.location),
    guild: sanitizeProfileGuild(input?.guild),
    combatStyle: input?.combatStyle === "dualDaggers" || input?.combatStyle === "bow" ? input.combatStyle : "swordShield",
    notes: typeof input?.notes === "string" ? input.notes.slice(0, 500) : "",
    levels: { ...base.levels, ...(input?.levels || {}) },
    secondaryStats: { ...base.secondaryStats, ...(input?.secondaryStats || {}) },
    magicFind: { ...base.magicFind, ...(input?.magicFind || {}) },
    efficiency: { ...base.efficiency, ...(input?.efficiency || {}) },
    boosts: { ...base.boosts, ...((input as Partial<CharacterProfile> | undefined)?.boosts || {}) },
    timers: { ...base.timers, ...(input?.timers || {}) },
    pet: { ...base.pet, ...(input?.pet || {}), stats: { ...base.pet.stats, ...((input?.pet as CharacterProfile["pet"] | undefined)?.stats || {}) } },
    ownedPets: sanitizeProfileOwnedPets(input?.ownedPets),
    skills: sanitizeProfileSkills(input?.skills),
    metricsSnapshot: sanitizeProfileMetrics(input?.metricsSnapshot),
    gear: { ...DEFAULT_GEAR, ...(input?.gear || {}) },
    gearTiers: { ...DEFAULT_GEAR_TIERS, ...(input?.gearTiers || {}) },
    tools: { ...DEFAULT_TOOLS, ...(input?.tools || {}) },
    housing: sanitizeHousing({ ...base.housing, ...(input?.housing || {}) }),
    importSource: sanitizeProfileImportSource(input?.importSource),
    fieldSources: sanitizeProfileFieldSources(input?.fieldSources),
    museum: sanitizeMuseumSnapshot(input?.museum),
    createdAt: typeof input?.createdAt === "string" ? input.createdAt : base.createdAt,
    updatedAt: typeof input?.updatedAt === "string" ? input.updatedAt : base.updatedAt,
  };

  for (const key of Object.keys(next.levels) as Array<keyof CharacterProfile["levels"]>) {
    next.levels[key] = cleanNumber(next.levels[key]);
  }
  for (const key of Object.keys(next.secondaryStats) as Array<keyof CharacterProfile["secondaryStats"]>) {
    next.secondaryStats[key] = cleanNumber(next.secondaryStats[key]);
  }
  const numericMagicFindKeys = ["combat", "dungeon", "worldBoss", "dailyStreak"] as const;
  for (const key of numericMagicFindKeys) {
    next.magicFind[key] = cleanNumber(next.magicFind[key]);
  }
  next.magicFind.dailyStreakLastAutoDate = typeof next.magicFind.dailyStreakLastAutoDate === "string"
    ? next.magicFind.dailyStreakLastAutoDate
    : "";
  for (const key of Object.keys(next.efficiency) as Array<keyof CharacterProfile["efficiency"]>) {
    next.efficiency[key] = cleanNumber(next.efficiency[key]);
  }
  next.boosts.barteringLevel = cleanNumber(next.boosts.barteringLevel);
  if (next.boosts.barteringLevel !== "") {
    next.boosts.barteringLevel = Math.min(100, Math.max(0, Number(next.boosts.barteringLevel)));
  }
  if (!["none", "first", "second", "third", "fourthSeventh", "eighthTenth"].includes(next.boosts.conquestRank)) {
    next.boosts.conquestRank = "none";
  }
  for (const key of Object.keys(next.timers) as Array<keyof CharacterProfile["timers"]>) {
    next.timers[key] = cleanNumber(next.timers[key]);
  }
  next.pet.level = cleanNumber(next.pet.level);
  next.pet.evolution = cleanNumber(next.pet.evolution);
  for (const key of Object.keys(next.pet.stats) as Array<keyof CharacterProfile["pet"]["stats"]>) {
    next.pet.stats[key] = cleanNumber(next.pet.stats[key]);
  }
  for (const key of Object.keys(next.gearTiers)) {
    next.gearTiers[key] = cleanNumber(next.gearTiers[key]);
    if (next.gearTiers[key] !== "") next.gearTiers[key] = Math.max(1, Number(next.gearTiers[key]));
  }
  next.housing = sanitizeHousing(next.housing);

  return next;
}

export function sanitizeProfilesState(input: Partial<ProfilesState> | null | undefined): ProfilesState {
  const profiles = Array.isArray(input?.profiles)
    ? input.profiles.slice(0, MAX_PROFILES).map((profile) => sanitizeProfile(profile))
    : [];
  const explicitMainIndex = profiles.findIndex((profile) => profile.kind === "main");
  const mainIndex = explicitMainIndex >= 0 ? explicitMainIndex : 0;
  const normalizedProfiles = profiles.map((profile, index) => ({
    ...profile,
    kind: index === mainIndex ? "main" as const : "alt" as const,
  }));
  return {
    schemaVersion: 1,
    activeProfileId: normalizedProfiles.some((profile) => profile.id === input?.activeProfileId)
      ? String(input?.activeProfileId)
      : normalizedProfiles[0]?.id || null,
    profiles: normalizedProfiles,
  };
}

export function getActiveProfile(state: ProfilesState): CharacterProfile | null {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || state.profiles[0] || null;
}

export function getProfileDungeonStatTotal(profile: CharacterProfile | null | undefined) {
  if (!profile) return 0;
  return (
    Number(profile.secondaryStats.attackPower || 0) +
    Number(profile.secondaryStats.protection || 0) +
    Number(profile.secondaryStats.agility || 0) +
    Number(profile.secondaryStats.accuracy || 0)
  );
}

export function getProfileCombatPrimary(profile: CharacterProfile | null | undefined) {
  return {
    combatLevel: Number(profile?.levels.combat || 0),
    strength: Number(profile?.levels.strength || 0),
    dexterity: Number(profile?.levels.dexterity || 0),
    defence: Number(profile?.levels.defence || 0),
  };
}

function readProfilesState(): ProfilesState {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) return sanitizeProfilesState(JSON.parse(stored));
  } catch {}
  return sanitizeProfilesState({ profiles: [createDefaultProfile("Main Character")] });
}

function writeProfilesState(state: ProfilesState) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfilesState>(() => sanitizeProfilesState(null));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setState(readProfilesState());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_STORAGE_KEY) handleUpdate();
    };

    const initial = readProfilesState();
    setState(initial);
    if (initial.profiles.length === 0) {
      const fallback = sanitizeProfilesState({ profiles: [createDefaultProfile("Main Character")] });
      writeProfilesState(fallback);
      setState(fallback);
    }
    setLoaded(true);
    window.addEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const replaceState = useCallback((nextState: ProfilesState) => {
    const sanitized = sanitizeProfilesState(nextState);
    const ensured = sanitized.profiles.length ? sanitized : sanitizeProfilesState({ profiles: [createDefaultProfile("Main Character")] });
    setState(ensured);
    writeProfilesState(ensured);
  }, []);

  const addProfile = useCallback((name?: string) => {
    if (state.profiles.length >= MAX_PROFILES) return null;
    const profile = { ...createDefaultProfile(name || `Character ${state.profiles.length + 1}`), kind: "alt" as const };
    replaceState({
      ...state,
      activeProfileId: profile.id,
      profiles: [...state.profiles, profile],
    });
    return profile;
  }, [replaceState, state]);

  const duplicateProfile = useCallback((profileId: string) => {
    if (state.profiles.length >= MAX_PROFILES) return null;
    const source = state.profiles.find((profile) => profile.id === profileId);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy = sanitizeProfile({
      ...source,
      id: makeId(),
      name: `${source.name} Copy`.slice(0, 40),
      kind: "alt",
      createdAt: now,
      updatedAt: now,
    });
    replaceState({ ...state, activeProfileId: copy.id, profiles: [...state.profiles, copy] });
    return copy;
  }, [replaceState, state]);

  const deleteProfile = useCallback((profileId: string) => {
    const profiles = state.profiles.filter((profile) => profile.id !== profileId);
    const nextProfiles = profiles.length ? profiles : [createDefaultProfile("Main Character")];
    replaceState({
      ...state,
      activeProfileId: nextProfiles[0]?.id || null,
      profiles: nextProfiles,
    });
  }, [replaceState, state]);

  const setActiveProfile = useCallback((profileId: string) => {
    if (!state.profiles.some((profile) => profile.id === profileId)) return;
    replaceState({ ...state, activeProfileId: profileId });
  }, [replaceState, state]);

  const updateProfile = useCallback((profileId: string, patch: Partial<CharacterProfile>, options: ProfileUpdateOptions = {}) => {
    const now = new Date().toISOString();
    const source = options.source || "manual";
    const shouldMarkFields = options.markFields !== false;
    const patchPaths = shouldMarkFields ? options.fieldPaths || collectProfileFieldPaths(patch) : [];
    replaceState({
      ...state,
      profiles: state.profiles.map((profile) => {
        if (profile.id === profileId) {
          return sanitizeProfile({
            ...profile,
            ...patch,
            fieldSources: shouldMarkFields
              ? markProfileFieldSources(profile.fieldSources, patchPaths, source, now)
              : patch.fieldSources || profile.fieldSources,
            updatedAt: now,
          });
        }
        if (patch.kind === "main") {
          return sanitizeProfile({ ...profile, kind: "alt", updatedAt: now });
        }
        return profile;
      }),
    });
  }, [replaceState, state]);

  const exportProfiles = useCallback(() => JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
  }, null, 2), [state]);

  const importProfiles = useCallback((payload: string) => {
    try {
      const parsed = JSON.parse(payload);
      const next = sanitizeProfilesState({
        activeProfileId: parsed.activeProfileId,
        profiles: parsed.profiles || [],
      });
      if (!next.profiles.length) return { ok: false, error: "No profiles found in the import payload." };
      replaceState(next);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
    }
  }, [replaceState]);

  const activeProfile = useMemo(() => getActiveProfile(state), [state]);

  const value = useMemo<ProfilesContextValue>(() => ({
    state,
    activeProfile,
    loaded,
    addProfile,
    duplicateProfile,
    deleteProfile,
    setActiveProfile,
    updateProfile,
    replaceState,
    exportProfiles,
    importProfiles,
  }), [
    activeProfile,
    addProfile,
    deleteProfile,
    duplicateProfile,
    exportProfiles,
    importProfiles,
    loaded,
    replaceState,
    setActiveProfile,
    state,
    updateProfile,
  ]);

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfiles() {
  const context = useContext(ProfilesContext);
  if (!context) throw new Error("useProfiles must be used inside ProfileProvider");
  return context;
}
