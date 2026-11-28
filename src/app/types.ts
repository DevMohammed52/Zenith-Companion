import type { ZenithIconName } from "@/components/icons/ZenithIcon";
import { DATA_DELAYED_AFTER_MS } from "@/lib/data-freshness";
import { SUPPORTED_ESSENCE_SKILLS } from "@/lib/essences";
import { FORGE_PLANNER_STORAGE_KEY } from "@/lib/forge-planner";
import type { IconConcept } from "@/lib/icons";
import { ALL_NAV_ITEMS, findNavItemByHref, NAV_GROUPS, type NavItem } from "@/lib/navigation";
import { MYTHIC_ACTIVE_RECIPES_STORAGE_KEY } from "@/lib/mythic-alchemy";
import type { QualityName } from "@/lib/quality";
import {
  mapNavIconToConcept,
  NAV_ICON_TO_CONCEPT,
  ROUTE_SUMMARIES,
} from "@/lib/route-recovery";
import type { SaleMode, SkillName, SkillProfitRow } from "@/lib/skill-profit";

export const SKILL_PROFIT_STORAGE_KEY = "zenith_skill_profit_finder";
export const DEFAULT_INDEXED_ITEMS_COUNT = 1353;
export const PET_SPECIES_COUNT = 47;
export const DELAYED_THRESHOLD_MINUTES = Math.round(DATA_DELAYED_AFTER_MS / 60_000);
export const MEMBERSHIP_BADGE_URL =
  "https://cdn.idle-mmo.com/cdn-cgi/image/width=20,height=20,format=auto/global/membership.png";

export { FORGE_PLANNER_STORAGE_KEY, MYTHIC_ACTIVE_RECIPES_STORAGE_KEY };

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

export interface WorldBossSummary {
  id: number;
  name: string;
  image_url?: string;
  level: number;
  location?: {
    id?: number;
    name?: string;
  };
  status?: string;
  battle_starts_at?: string;
  battle_ends_at?: string;
}

export interface ModuleLink {
  href: string;
  label: string;
  icon: ZenithIconName;
  badge?: string;
}

export interface ModuleGroup {
  title: string;
  description: string;
  icon: ZenithIconName;
  links: ModuleLink[];
}

export interface ToolDirectoryItem {
  href: string;
  label: string;
  summary: string;
  icon: IconConcept;
  groupLabel: string;
  badge?: string;
  isRecent?: boolean;
}

export interface ToolDirectoryGroup {
  label: string;
  eyebrow: string;
  icon: IconConcept;
  items: ToolDirectoryItem[];
}

export interface LiveBossPulse {
  name: string;
  level: number;
  imageUrl?: string;
  locationName: string;
  locationImageUrl?: string;
  statusLabel: string;
  countdownLabel: string;
  isActiveNow: boolean;
  totalTracked: number;
}

export interface WeatherZoneSlide {
  zoneId: number;
  zoneName: string;
  zoneImageUrl?: string;
  condition: string;
  icon: IconConcept;
  buffs: string[];
  isMagicStorm: boolean;
  nextChangeLabel: string | null;
}

export interface LiveWeatherPulse {
  slides: WeatherZoneSlide[];
  upcomingStormLocation: string | null;
  upcomingStormCountdown: string | null;
}

export interface RankedRouteDisplay {
  name: string;
  skill: string;
  level: number;
  profitPerHour: number;
  expPerHour: number;
  saleSource: string;
  volume3d: number;
  imageUrl?: string;
}

export interface MarketMoverItem {
  name: string;
  imageUrl?: string;
  price3d: number;
  avg30: number;
  deltaPercent: number;
  volume3d: number;
}

export interface PetShowcaseProfile {
  sizePx: number;
  hoverPx: number;
  isUpsideDown: boolean;
  placement: "behind" | "side";
}

export interface ActivePetHighlight {
  species: string;
  displayName: string;
  level: number;
  quality: QualityName;
  imageUrl?: string;
  showcase: PetShowcaseProfile;
}

export interface LatestReleaseHighlight {
  version: string;
  date: string;
  headline: string;
  totalChanges: number;
}

export { mapNavIconToConcept, NAV_ICON_TO_CONCEPT, ROUTE_SUMMARIES };

export function mapWeatherConditionToIcon(condition: string): IconConcept {
  const key = condition.toLowerCase();
  if (key.includes("magic storm")) return "weatherMagicStorm";
  if (key.includes("storm") || key.includes("thunder")) return "weatherStorm";
  if (key.includes("rain")) return "weatherRain";
  if (key.includes("fog") || key.includes("mist")) return "weatherFog";
  if (key.includes("snow") || key.includes("blizzard")) return "weatherSnow";
  if (key.includes("wind")) return "weatherWindy";
  if (key.includes("heat") || key.includes("drought")) return "weatherHeatwave";
  if (key.includes("overcast") || key.includes("cloud")) return "weatherOvercast";
  return "weatherClear";
}

function navLink(href: string, fallbackLabel: string, fallbackIcon: ZenithIconName): ModuleLink {
  const nav = findNavItemByHref(href);
  return {
    href,
    label: nav?.label || fallbackLabel,
    icon: nav?.icon || fallbackIcon,
    badge: nav?.badge,
  };
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "Economy",
    description: "Potion margins, skill rates, crafting batches, and item market history.",
    icon: "market",
    links: [
      navLink("/skill-profit", "Skill Profit Finder", "skillProfit"),
      navLink("/alchemy", "Alchemy Profit", "alchemy"),
      navLink("/crafting", "Crafting Queue", "craftingQueue"),
      navLink("/items", "Items Database", "items"),
    ],
  },
  {
    title: "Character",
    description: "Manage characters, Best-in-Slot gear, housing buffs, pets, and forging.",
    icon: "profile",
    links: [
      navLink("/profiles", "Profiles", "profile"),
      navLink("/bis", "BiS Recommender", "bis"),
      navLink("/housing", "Housing", "housing"),
      navLink("/pets/owned", "Owned Pets", "petsOwned"),
      navLink("/pets/compare", "Pet Comparison", "petCompare"),
      navLink("/forge/craft", "Forge Crafting", "forgeCraft"),
    ],
  },
  {
    title: "World & Encounters",
    description: "Explore zones, forecasts, dungeons, world bosses, and conquest tiles.",
    icon: "world",
    links: [
      navLink("/map", "World Map", "map"),
      navLink("/weather", "Weather Guide", "weather"),
      navLink("/bosses", "World Bosses", "boss"),
      navLink("/dungeons", "Dungeons", "castle"),
      navLink("/enemies", "Enemy Database", "enemy"),
      navLink("/conquest", "Conquest", "conquest"),
    ],
  },
  {
    title: "Guild & Archive",
    description: "Track guild stats, museum completion, lore notes, pets, and game patches.",
    icon: "archive",
    links: [
      navLink("/guilds", "Guild Database", "guild"),
      navLink("/museum", "Museum", "museum"),
      navLink("/pets", "Pet Database", "pets"),
      navLink("/patch-notes", "IdleMMO Patch Notes", "patchNotes"),
      navLink("/lore", "Lore Wiki", "lore"),
      navLink("/whats-new", "What's New", "spark"),
    ],
  },
];

export function buildToolDirectoryGroups(
  recentHrefs: string[] = [],
): ToolDirectoryGroup[] {
  const recentSet = new Set(recentHrefs);
  return NAV_GROUPS.map((group) => {
    const items: ToolDirectoryItem[] = group.items
      .filter((item) => item.href !== "/")
      .map((item: NavItem) => ({
        href: item.href,
        label: item.label,
        summary: ROUTE_SUMMARIES[item.href] || `Open ${item.label} in ${group.label}.`,
        icon: mapNavIconToConcept(item.icon),
        groupLabel: group.label,
        badge: item.badge,
        isRecent: recentSet.has(item.href),
      }));

    return {
      label: group.label,
      eyebrow: group.eyebrow,
      icon: mapNavIconToConcept(group.icon),
      items,
    };
  }).filter((group) => group.items.length > 0);
}

export function getTotalDashboardToolCount(): number {
  return ALL_NAV_ITEMS.filter((item) => item.href !== "/").length;
}

export function getRankedProfitPerHour(row: SkillProfitRow): number {
  if (row.essenceActive && row.profitWithEssencePerHour !== null) {
    return row.profitWithEssencePerHour;
  }
  if (row.essenceActive && row.essenceNeedsPrice) {
    return row.baseProfitPerHour;
  }
  return row.profitPerHour;
}

export function readMythicNamesFromKey(key: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  } catch {
    return null;
  }
}

export function readSkillProfitStateFromKey(key: string): PersistedSkillProfitDashboardState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const rawSettings =
      parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings)
        ? parsed.settings
        : parsed;
    const saleMode: SaleMode =
      rawSettings?.saleMode === "market" || rawSettings?.saleMode === "vendor" || rawSettings?.saleMode === "best"
        ? rawSettings.saleMode
        : "best";
    const minVolume =
      typeof parsed?.minVolume === "number" && Number.isFinite(parsed.minVolume)
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
    const rawEssences =
      rawSettings?.essenceBySkill && typeof rawSettings.essenceBySkill === "object" && !Array.isArray(rawSettings.essenceBySkill)
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
    const efficiencyBoosts =
      parsed?.efficiencyBoosts && typeof parsed.efficiencyBoosts === "object" ? parsed.efficiencyBoosts : {};
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

export function formatAge(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return "Waiting";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  const rem = Math.floor(minutes % 60);
  return rem > 0 ? `${hours}h ${rem}m ago` : `${hours}h ago`;
}

export function formatBossCountdown(targetIso: string | undefined, nowMs: number): {
  label: string;
  diffMs: number;
} {
  if (!targetIso) return { label: "Scheduled", diffMs: Number.POSITIVE_INFINITY };
  const targetMs = new Date(targetIso).getTime();
  if (!Number.isFinite(targetMs)) return { label: "Scheduled", diffMs: Number.POSITIVE_INFINITY };
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) return { label: "Active now", diffMs: 0 };

  const totalSec = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) return { label: `In ${hours}h ${mins}m`, diffMs };
  if (mins > 0) return { label: `In ${mins}m ${secs}s`, diffMs };
  return { label: `In ${secs}s`, diffMs };
}

export function deriveLiveBossPulse(
  bosses: WorldBossSummary[] | undefined,
  nowMs: number,
  locationImagesByName?: Map<string, string>,
): LiveBossPulse | null {
  if (!Array.isArray(bosses) || bosses.length === 0) return null;

  let bestBoss: WorldBossSummary | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let countdown = "Scheduled";

  for (const boss of bosses) {
    const startMs = boss.battle_starts_at ? new Date(boss.battle_starts_at).getTime() : Number.NaN;
    const endMs = boss.battle_ends_at ? new Date(boss.battle_ends_at).getTime() : Number.NaN;
    const isLobby = boss.status === "READY_FOR_LOBBY" || boss.status === "IN_PROGRESS";
    const isLive =
      isLobby &&
      Number.isFinite(startMs) &&
      startMs <= nowMs &&
      (!Number.isFinite(endMs) || endMs > nowMs);

    if (isLive) {
      const locName = boss.location?.name || "World Arena";
      return {
        name: boss.name,
        level: Number.isFinite(Number(boss.level)) ? Number(boss.level) : 1,
        imageUrl: boss.image_url,
        locationName: locName,
        locationImageUrl: locationImagesByName?.get(locName.toLowerCase()),
        statusLabel: boss.status === "IN_PROGRESS" ? "In progress" : "Lobby open",
        countdownLabel: "Live now",
        isActiveNow: true,
        totalTracked: bosses.length,
      };
    }

    if (Number.isFinite(startMs) && startMs > nowMs) {
      const waitMs = startMs - nowMs;
      if (waitMs < bestScore) {
        bestScore = waitMs;
        bestBoss = boss;
        countdown = formatBossCountdown(boss.battle_starts_at, nowMs).label;
      }
    }
  }

  const chosen = bestBoss || bosses[0];
  const locName = chosen.location?.name || "World Arena";
  return {
    name: chosen.name,
    level: Number.isFinite(Number(chosen.level)) ? Number(chosen.level) : 1,
    imageUrl: chosen.image_url,
    locationName: locName,
    locationImageUrl: locationImagesByName?.get(locName.toLowerCase()),
    statusLabel: bestBoss ? "Next spawn" : "Tracker ready",
    countdownLabel: bestBoss ? countdown : `${bosses.length} tracked`,
    isActiveNow: false,
    totalTracked: bosses.length,
  };
}

export interface UseDashboardStateReturn {
  isReady: boolean;
  needsProfileSetup: boolean;
  hasConfiguredProfile: boolean;
  hasMembership: boolean;

  activeProfileName: string;
  activeProfileClass: string;
  activeProfileImageUrl: string;
  activeProfileBackgroundUrl: string;
  guildLabel: string | null;
  totalLevel: number;
  combatLevel: number;
  idleActionHours: number;
  activePet: ActivePetHighlight | null;
  equippedGearCount: number;
  ownedPetsCount: number;
  museumItemCount: number;
  petSpeciesCount: number;

  rankedRoutes: RankedRouteDisplay[];
  queuedCount: number;
  queueProfit: number;
  queuePlanEntriesCount: number;
  forgeCraftsCount: number;
  activeMythicCount: number;
  housingStatusLabel: string;
  housingConduitNote: string;

  liveBossPulse: LiveBossPulse | null;
  worldWeatherPulse: LiveWeatherPulse | null;

  marketMovers: MarketMoverItem[];
  recentTools: ToolDirectoryItem[];
  latestRelease: LatestReleaseHighlight | null;
}

/**
 * Calibrated from actual transparent bounding boxes across all 47 pet sprites:
 * wide dragons/mythics (Lunark, Shardback, Wyrmshadow, Ollo) get height compensation
 * so wingspan creatures look imposing beside the hero rather than miniature.
 */
const PET_SHOWCASE_OVERRIDES: Record<
  string,
  { sizePx: number; hoverPx?: number; isUpsideDown?: boolean; placement?: "behind" | "side" }
> = {
  // Colossal Mythic beasts & dragons (framed ahead-left over cape hem)
  lunark: { sizePx: 116, hoverPx: 8, placement: "behind" },
  wyrmshadow: { sizePx: 114, hoverPx: 4, placement: "behind" },
  "dead wyrmshadow": { sizePx: 112, hoverPx: 4, isUpsideDown: true, placement: "behind" },
  shardback: { sizePx: 112, hoverPx: 0, placement: "behind" },
  thunderhoof: { sizePx: 106, hoverPx: 0, placement: "behind" },
  orthrus: { sizePx: 104, hoverPx: 0, placement: "behind" },

  // Large dragons, wyverns & heavy beasts
  shadowscale: { sizePx: 96, hoverPx: 2, placement: "behind" },
  drakeling: { sizePx: 94, hoverPx: 4, placement: "behind" },
  sauronix: { sizePx: 94, hoverPx: 2, placement: "behind" },
  scalethorn: { sizePx: 92, hoverPx: 0, placement: "behind" },
  draconis: { sizePx: 88, hoverPx: 0, placement: "behind" },
  vexalia: { sizePx: 88, hoverPx: 4, placement: "behind" },
  raptora: { sizePx: 86, hoverPx: 0, placement: "behind" },
  leovar: { sizePx: 88, hoverPx: 0, placement: "behind" },
  solarix: { sizePx: 88, hoverPx: 2, placement: "behind" },
  zephyrix: { sizePx: 88, hoverPx: 2, placement: "behind" },
  starmane: { sizePx: 86, hoverPx: 2, placement: "behind" },
  blooplord: { sizePx: 84, hoverPx: 0, placement: "behind" },

  // Medium companions (wolves, hounds, winged panther, stag, aquatic beasts — hugged beside boots)
  snowrunner: { sizePx: 68, hoverPx: 0, placement: "side" },
  aquarion: { sizePx: 62, hoverPx: 4, placement: "side" },
  fangor: { sizePx: 60, hoverPx: 0, placement: "side" },
  wrex: { sizePx: 60, hoverPx: 0, placement: "side" },
  ravenwing: { sizePx: 58, hoverPx: 4, placement: "side" },
  splash: { sizePx: 58, hoverPx: 0, placement: "side" },
  florien: { sizePx: 56, hoverPx: 0, placement: "side" },

  // Small critters & compact familiars (proportional ankle/calf height beside warrior)
  ollo: { sizePx: 54, hoverPx: 0, placement: "side" },
  fluffy: { sizePx: 52, hoverPx: 0, placement: "side" },
  vulpina: { sizePx: 52, hoverPx: 0, placement: "side" },
  shelly: { sizePx: 52, hoverPx: 0, placement: "side" },
  furbella: { sizePx: 50, hoverPx: 0, placement: "side" },
  tin: { sizePx: 50, hoverPx: 0, placement: "side" },
  aquastar: { sizePx: 50, hoverPx: 0, placement: "side" },
  rattles: { sizePx: 50, hoverPx: 0, placement: "side" },
  nutmeg: { sizePx: 48, hoverPx: 0, placement: "side" },
  whiskers: { sizePx: 46, hoverPx: 0, placement: "side" },
  nutwhisker: { sizePx: 46, hoverPx: 0, placement: "side" },
  nyx: { sizePx: 46, hoverPx: 0, placement: "side" },
  thistlehop: { sizePx: 46, hoverPx: 0, placement: "side" },
  leafy: { sizePx: 46, hoverPx: 0, placement: "side" },

  // Tiny owls, birds, wisps & floating sprites (real shoulder/hip scale, never oversized!)
  aerion: { sizePx: 50, hoverPx: 10, placement: "side" },
  pyroflare: { sizePx: 50, hoverPx: 10, placement: "side" },
  stardust: { sizePx: 50, hoverPx: 6, placement: "side" },
  emberwhisp: { sizePx: 48, hoverPx: 10, placement: "side" },
  wingsley: { sizePx: 46, hoverPx: 8, placement: "side" },
  nova: { sizePx: 46, hoverPx: 10, placement: "side" },
  lovebuzz: { sizePx: 44, hoverPx: 10, placement: "side" },
  lumi: { sizePx: 44, hoverPx: 10, placement: "side" },
};

export function getPetShowcaseProfile(species: string, quality?: QualityName): PetShowcaseProfile {
  const key = species.trim().toLowerCase();
  const matched = PET_SHOWCASE_OVERRIDES[key];
  if (matched) {
    return {
      sizePx: matched.sizePx,
      hoverPx: matched.hoverPx ?? 0,
      isUpsideDown: Boolean(matched.isUpsideDown),
      placement: matched.placement ?? "side",
    };
  }
  const isLargeRarity = quality === "MYTHIC" || quality === "UNIQUE" || quality === "LEGENDARY";
  return {
    sizePx: quality === "MYTHIC" || quality === "UNIQUE" ? 106 : quality === "LEGENDARY" ? 90 : 54,
    hoverPx: 0,
    isUpsideDown: key === "dead wyrmshadow",
    placement: isLargeRarity ? "behind" : "side",
  };
}
