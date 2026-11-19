import type { ZenithIconName } from "@/components/icons/ZenithIcon";
import { DATA_DELAYED_AFTER_MS } from "@/lib/data-freshness";
import type { ForgePlannerLine } from "@/lib/forge-planner";
import type { HousingBuffSummary } from "@/lib/housing";
import type {
  SaleMode,
  SkillName,
  SkillProfitRow,
  SkillProfitSettings,
} from "@/lib/skill-profit";
import type { CraftingQueuePlan } from "@/lib/crafting-queue";
import {
  SUPPORTED_ESSENCE_SKILLS,
  type EssenceSession,
  type EssenceSkillName,
} from "@/lib/essences";
import type { CharacterProfile, ProfilesState } from "@/lib/profiles";

export type ModuleLink = {
  href: string;
  label: string;
  icon: ZenithIconName;
};

export type ModuleGroup = {
  title: string;
  text: string;
  icon: ZenithIconName;
  links: ModuleLink[];
};

export type PersistedSkillProfitDashboardState = {
  energizingPoolExp: number;
  ascensionBuffIds: string[];
  saleMode: SaleMode;
  minVolume: number;
  barteringBoost: number | "";
  essenceBySkill: Partial<Record<SkillName, string>>;
  customRows: unknown[];
  skillLevels: Record<string, number>;
  efficiencyBoosts: Record<string, number>;
};

export const SKILL_PROFIT_STORAGE_KEY = "zenith_skill_profit_finder";
export const DEFAULT_INDEXED_ITEMS_COUNT = 1353;
export const DELAYED_THRESHOLD_MINUTES = Math.round(DATA_DELAYED_AFTER_MS / 60_000);

export const DEFAULT_PERSISTED_SKILL_PROFIT: PersistedSkillProfitDashboardState = {
  energizingPoolExp: 0,
  ascensionBuffIds: [],
  saleMode: "best",
  minVolume: 100,
  barteringBoost: 0,
  essenceBySkill: {},
  customRows: [],
  skillLevels: {},
  efficiencyBoosts: {},
};

export function getRankedProfitPerHour(row: SkillProfitRow) {
  if (row.essenceActive && row.profitWithEssencePerHour !== null) return row.profitWithEssencePerHour;
  if (row.essenceActive && row.essenceNeedsPrice) return row.baseProfitPerHour;
  return row.profitPerHour;
}

export function readMythicNamesFromKey(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return null;
  }
}

export function readSkillProfitStateFromKey(key: string): PersistedSkillProfitDashboardState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const rawSettings = parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings)
      ? parsed.settings
      : parsed;
    const saleMode: SaleMode = rawSettings?.saleMode === "market" || rawSettings?.saleMode === "vendor" || rawSettings?.saleMode === "best"
      ? rawSettings.saleMode
      : "best";
    const minVolume = typeof parsed?.minVolume === "number" && Number.isFinite(parsed.minVolume)
      ? Math.max(0, parsed.minVolume)
      : 100;
    const energizingPoolExp = Math.max(0, Number(rawSettings?.energizingPoolExp ?? parsed?.energizingPoolExp ?? 0) || 0);
    const rawAscension = Array.isArray(rawSettings?.ascensionBuffIds)
      ? rawSettings.ascensionBuffIds
      : Array.isArray(parsed?.ascensionBuffIds)
        ? parsed.ascensionBuffIds
        : [];
    const ascensionBuffIds = rawAscension.filter((id: unknown): id is string => typeof id === "string");
    const barteringBoost = rawSettings?.barteringBoost ?? parsed?.barteringBoost ?? 0;
    const rawEssences = rawSettings?.essenceBySkill && typeof rawSettings.essenceBySkill === "object" && !Array.isArray(rawSettings.essenceBySkill)
      ? rawSettings.essenceBySkill
      : parsed?.essenceBySkill && typeof parsed.essenceBySkill === "object" && !Array.isArray(parsed.essenceBySkill)
        ? parsed.essenceBySkill
        : {};
    const essenceBySkill: Partial<Record<SkillName, string>> = {};
    for (const skill of SUPPORTED_ESSENCE_SKILLS) {
      const val = rawEssences[skill];
      if (typeof val === "string" && val.trim()) essenceBySkill[skill] = val.trim();
    }
    const customRows = Array.isArray(parsed?.customRows) ? parsed.customRows : [];
    const skillLevels = parsed?.skillLevels && typeof parsed.skillLevels === "object" ? parsed.skillLevels : {};
    const efficiencyBoosts = parsed?.efficiencyBoosts && typeof parsed.efficiencyBoosts === "object" ? parsed.efficiencyBoosts : {};
    return {
      energizingPoolExp,
      ascensionBuffIds,
      saleMode,
      minVolume,
      barteringBoost,
      essenceBySkill,
      customRows,
      skillLevels,
      efficiencyBoosts,
    };
  } catch {
    return null;
  }
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "Economy",
    text: "Market prices, trade volume, alchemy EV, and craft queues.",
    icon: "economy",
    links: [
      { href: "/skill-profit", label: "Skill Profit", icon: "skill" },
      { href: "/items", label: "Items", icon: "items" },
      { href: "/alchemy", label: "Alchemy", icon: "alchemy" },
      { href: "/crafting", label: "Queue", icon: "crafting" },
    ],
  },
  {
    title: "Character",
    text: "Profiles, house rooms, gear loadouts, tools, and pet rosters.",
    icon: "profile",
    links: [
      { href: "/profiles", label: "Profiles", icon: "profile" },
      { href: "/housing", label: "Housing", icon: "housing" },
      { href: "/pets", label: "Pets", icon: "pets" },
      { href: "/pets/owned", label: "Owned Pets", icon: "pets" },
      { href: "/pets/compare", label: "Pet Compare", icon: "pets" },
      { href: "/forge/lessons", label: "Lessons", icon: "forge" },
      { href: "/forge/craft", label: "Forge Craft", icon: "forge" },
      { href: "/bis", label: "BiS", icon: "shield" },
    ],
  },
  {
    title: "World & Encounters",
    text: "Drop tables, dungeon requirements, world bosses, weather, and map routes.",
    icon: "world",
    links: [
      { href: "/map", label: "Map", icon: "map" },
      { href: "/weather", label: "Weather", icon: "weather" },
      { href: "/enemies", label: "Enemies", icon: "enemy" },
      { href: "/dungeons", label: "Dungeons", icon: "castle" },
      { href: "/bosses", label: "Bosses", icon: "boss" },
    ],
  },
  {
    title: "Guild & Archive",
    text: "Guild rankings, conquest seasons, museum collections, lore, and patch notes.",
    icon: "archive",
    links: [
      { href: "/guilds", label: "Guilds", icon: "guild" },
      { href: "/conquest", label: "Conquest", icon: "conquest" },
      { href: "/museum", label: "Museum", icon: "museum" },
      { href: "/lore", label: "Lore", icon: "archive" },
      { href: "/patch-notes", label: "Patch Notes", icon: "archive" },
    ],
  },
];

export function formatAge(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return "Waiting";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
}

export interface UseDashboardStateReturn {
  activeProfile: CharacterProfile | null;
  profileState: ProfilesState;
  profilesLoaded: boolean;
  configuredProfile: CharacterProfile | null;
  needsProfileSetup: boolean;
  activeMythicNames: string[];
  forgeLines: ForgePlannerLine[];
  persistedSkillProfit: PersistedSkillProfitDashboardState;
  housingSummary: HousingBuffSummary;
  skillProfitSettings: SkillProfitSettings;
  bestSkillRoute: SkillProfitRow | null;
  queuePlan: CraftingQueuePlan;
  forgeCraftsCount: number;
  timeSince: number | null;
  registryCount: number;
  marketFreshness: string;
  registryCountLabel: string;
  activeProfileLabel: string;
  profileDetail: string;
  housingLabel: string;
  housingDescription: string;
}
