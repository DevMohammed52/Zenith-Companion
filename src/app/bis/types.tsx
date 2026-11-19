import React from "react";
import {
  ArrowDown,
  Hand,
  HardHat,
  Layers,
  Shield,
  Sword,
  Target,
  Zap,
} from "lucide-react";
import { getSafeMarketValue, type MarketPriceDatum } from "@/lib/market-pricing";
import { formatStatName } from "@/lib/profile-calculations";
import { getQualityRank } from "@/lib/quality";
import type { CharacterProfile } from "@/lib/profiles";

export type GearType =
  | "SWORD"
  | "DAGGER"
  | "BOW"
  | "SHIELD"
  | "HELMET"
  | "CHESTPLATE"
  | "GREAVES"
  | "BOOTS"
  | "GAUNTLETS";

export type CombatStyle = "swordShield" | "dualDaggers" | "bow";
export type SortKey = "level" | "stats" | "price" | "quality" | "name";
export type Direction = "asc" | "desc";
export type Priority = "balanced" | "damage" | "defence" | "speed";

export type GearItem = {
  name: string;
  hashed_id: string;
  type: GearType | string;
  quality: string;
  image_url?: string;
  vendor_price?: number | null;
  is_tradeable?: boolean;
  combat_req?: number | null;
  requirements?: Record<string, number | null> | null;
  stats?: Record<string, number> | null;
  tier_modifiers?: Record<string, number> | null;
  max_tier?: number;
};

export type GearView = {
  item: GearItem;
  stats: Record<string, number>;
  weightedStats: number;
  statTotal: number;
  requirementLevel: number;
  eligible: boolean;
  unmet: string[];
  price: number | null;
  priceLabel: string;
  effectiveTier: number;
};

export type StatComparison = {
  key: string;
  candidate: number;
  current: number;
  delta: number;
};

export const COMBAT_TYPES = new Set<GearType>([
  "SWORD",
  "DAGGER",
  "BOW",
  "SHIELD",
  "HELMET",
  "CHESTPLATE",
  "GREAVES",
  "BOOTS",
  "GAUNTLETS",
]);

export const SLOT_CONFIG: Record<GearType, { label: string; profileSlot: string; icon: React.ReactNode }> = {
  SWORD: { label: "Sword", profileSlot: "weapon", icon: <Sword size={16} /> },
  DAGGER: { label: "Dagger", profileSlot: "weapon", icon: <Zap size={16} /> },
  BOW: { label: "Bow", profileSlot: "bow", icon: <Target size={16} /> },
  SHIELD: { label: "Shield", profileSlot: "shield", icon: <Shield size={16} /> },
  HELMET: { label: "Helmet", profileSlot: "helmet", icon: <HardHat size={16} /> },
  CHESTPLATE: { label: "Chestplate", profileSlot: "chestplate", icon: <Shield size={16} /> },
  GREAVES: { label: "Greaves", profileSlot: "greaves", icon: <Layers size={16} /> },
  BOOTS: { label: "Boots", profileSlot: "boots", icon: <ArrowDown size={16} /> },
  GAUNTLETS: { label: "Gauntlets", profileSlot: "gauntlets", icon: <Hand size={16} /> },
};

export const SLOT_FILTERS: Array<{ id: "ALL" | GearType; label: string }> = [
  { id: "ALL", label: "All gear" },
  { id: "SWORD", label: "Swords" },
  { id: "DAGGER", label: "Daggers" },
  { id: "BOW", label: "Bows" },
  { id: "SHIELD", label: "Shields" },
  { id: "HELMET", label: "Helmets" },
  { id: "CHESTPLATE", label: "Chestplates" },
  { id: "GREAVES", label: "Greaves" },
  { id: "BOOTS", label: "Boots" },
  { id: "GAUNTLETS", label: "Gauntlets" },
];

export const STYLE_OPTIONS: Array<{ id: CombatStyle; label: string; slots: GearType[] }> = [
  { id: "swordShield", label: "Sword + Shield", slots: ["SWORD", "SHIELD"] },
  { id: "dualDaggers", label: "Dual Daggers", slots: ["DAGGER"] },
  { id: "bow", label: "Bow", slots: ["BOW"] },
];

export const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "level", label: "Level" },
  { id: "stats", label: "Stats" },
  { id: "price", label: "Price" },
  { id: "quality", label: "Rarity" },
  { id: "name", label: "Name" },
];

export const PRIORITIES: Array<{ id: Priority; label: string }> = [
  { id: "balanced", label: "Balanced" },
  { id: "damage", label: "Damage" },
  { id: "defence", label: "Defence" },
  { id: "speed", label: "Speed" },
];

export const SEARCH_ALIASES: Record<string, string[]> = {
  chest: ["chestplate"],
  gloves: ["gauntlets"],
  hat: ["helmet"],
  helm: ["helmet"],
  legs: ["greaves"],
  shoes: ["boots"],
};

export const INITIAL_VISIBLE_GEAR_ROWS = 120;

export const WEIGHTS: Record<Priority, Record<string, number>> = {
  balanced: {
    attack_power: 1,
    damage: 8,
    accuracy: 0.75,
    agility: 0.55,
    protection: 0.6,
    critical_chance: 6,
    critical_damage: 1.25,
    movement_speed: 12,
    max_health: 0.2,
  },
  damage: {
    attack_power: 1.25,
    damage: 10,
    accuracy: 0.9,
    agility: 0.35,
    protection: 0.2,
    critical_chance: 8,
    critical_damage: 1.6,
    movement_speed: 7,
  },
  defence: {
    attack_power: 0.45,
    damage: 5,
    accuracy: 0.45,
    agility: 0.55,
    protection: 1.25,
    critical_chance: 3,
    critical_damage: 0.65,
    movement_speed: 6,
    max_health: 0.45,
  },
  speed: {
    attack_power: 0.55,
    damage: 5,
    accuracy: 0.65,
    agility: 1.15,
    protection: 0.35,
    critical_chance: 5,
    critical_damage: 0.8,
    movement_speed: 22,
  },
};

export const ARMOR_SLOTS: GearType[] = ["HELMET", "CHESTPLATE", "GREAVES", "BOOTS", "GAUNTLETS"];

export function normalizeCombatStyle(value: string | undefined): CombatStyle {
  if (value === "dualDaggers" || value === "dual_daggers") return "dualDaggers";
  if (value === "bow") return "bow";
  return "swordShield";
}

export function numberValue(value: number | "" | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getRequirementLevel(item: GearItem) {
  return Math.max(0, ...Object.values(item.requirements || {}).map((value) => Number(value || 0)));
}

export function formatGold(value: number | null | undefined) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "-";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}g`;
}

export function evaluateScore(stats: Record<string, number>, priority: Priority) {
  const weights = WEIGHTS[priority];
  return Object.entries(stats).reduce((total, [key, value]) => total + Number(value || 0) * (weights[key] || 0.25), 0);
}

export function totalPositiveStats(stats: Record<string, number>) {
  return Object.values(stats).reduce((total, value) => total + Math.max(0, Number(value || 0)), 0);
}

export function compareBestGear(a: GearView, b: GearView) {
  return (
    b.requirementLevel - a.requirementLevel ||
    getQualityRank(b.item.quality) - getQualityRank(a.item.quality) ||
    b.weightedStats - a.weightedStats ||
    b.statTotal - a.statTotal ||
    Number(a.price || Number.MAX_SAFE_INTEGER) - Number(b.price || Number.MAX_SAFE_INTEGER) ||
    a.item.name.localeCompare(b.item.name)
  );
}

export function requirementStatus(item: GearItem, levels: Record<string, number>) {
  const unmet: string[] = [];
  for (const [key, required] of Object.entries(item.requirements || {})) {
    const req = Number(required || 0);
    if (req > 0 && (levels[key] || 0) < req) unmet.push(`${formatStatName(key)} ${req}`);
  }
  const combatReq = Number(item.combat_req || 0);
  if (combatReq > 0 && (levels.combat || 0) < combatReq && !unmet.some((entry) => entry.startsWith("Combat "))) {
    unmet.push(`Combat ${combatReq}`);
  }
  return unmet;
}

export function getPrice(item: GearItem, marketData: unknown) {
  const marketLookup = marketData as Record<string, MarketPriceDatum | undefined> | null | undefined;
  const market = getSafeMarketValue(marketLookup?.[item.name]);
  if (Number.isFinite(Number(market)) && Number(market) > 0) return { value: Number(market), label: "Market" };
  const vendor = Number(item.vendor_price || 0);
  if (vendor > 0) return { value: vendor, label: "Vendor" };
  return { value: null, label: "No price" };
}

export function activeStyleSlots(style: CombatStyle) {
  const weaponSlots = STYLE_OPTIONS.find((option) => option.id === style)?.slots || ["SWORD", "SHIELD"];
  return [...weaponSlots, ...ARMOR_SLOTS];
}

export function slotLabel(type: string) {
  return SLOT_CONFIG[type as GearType]?.label || type;
}

export function profileSlotForType(type: GearType) {
  return SLOT_CONFIG[type]?.profileSlot || "";
}

export function compareStats(candidate: Record<string, number>, current: Record<string, number>): StatComparison[] {
  const keys = Array.from(new Set([...Object.keys(candidate), ...Object.keys(current)])).sort();
  return keys.map((key) => {
    const candidateValue = Number(candidate[key] || 0);
    const currentValue = Number(current[key] || 0);
    return { key, candidate: candidateValue, current: currentValue, delta: candidateValue - currentValue };
  });
}

export function clampTier(value: number | "", maxTier: number) {
  if (value === "") return "";
  return Math.min(Math.max(1, Number(value || 1)), Math.max(1, maxTier));
}

export type UseBisStateReturn = {
  // Refs
  comparePanelRef: React.RefObject<HTMLElement | null>;
  recommendationPanelRef: React.RefObject<HTMLElement | null>;
  gearListPanelRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  slotButtonRefs: React.MutableRefObject<Partial<Record<"ALL" | GearType, HTMLButtonElement | null>>>;

  // State
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  slotFilter: "ALL" | GearType;
  setSlotFilter: React.Dispatch<React.SetStateAction<"ALL" | GearType>>;
  usableOnly: boolean;
  setUsableOnly: React.Dispatch<React.SetStateAction<boolean>>;
  priority: Priority;
  setPriority: React.Dispatch<React.SetStateAction<Priority>>;
  sortKey: SortKey;
  setSortKey: React.Dispatch<React.SetStateAction<SortKey>>;
  direction: Direction;
  setDirection: React.Dispatch<React.SetStateAction<Direction>>;
  selectedId: string;
  candidateTier: number | "";
  setCandidateTier: React.Dispatch<React.SetStateAction<number | "">>;
  compareTier: number | "";
  setCompareTier: React.Dispatch<React.SetStateAction<number | "">>;
  visibleGearCount: number;
  setVisibleGearCount: React.Dispatch<React.SetStateAction<number>>;
  mobileSelectionHint: string;
  statusMessage: string;

  // Derivations
  activeProfile: CharacterProfile | null;
  profileCombatLevel: number | "" | undefined;
  profileStrength: number | "" | undefined;
  profileDexterity: number | "" | undefined;
  profileDefence: number | "" | undefined;
  activeCombatStyle: CombatStyle;
  levels: { combat: number; strength: number; dexterity: number; defence: number };
  activeSlots: GearType[];
  gearViews: GearView[];
  recommendations: Partial<Record<GearType, GearView>>;
  filteredGear: GearView[];
  visibleGear: GearView[];
  selected: GearView | null;
  selectedType: GearType | undefined;
  selectedProfileSlot: string;
  currentProfileItem: GearItem | undefined;
  effectiveCandidateTier: number;
  effectiveCompareTier: number;
  selectedMaxTier: number;
  currentMaxTier: number;
  candidateStats: Record<string, number>;
  currentStats: Record<string, number>;
  statComparison: StatComparison[];
  totalRecommendedCost: number;
  activeProfileName: string;
  activeStyleLabel: string;
  priorityLabel: string;
  usableGearCount: number;
  recommendedSlotCount: number;
  recommendationReadinessLabel: string;
  selectedDeltaTotal: number;
  positiveDeltaCount: number;
  negativeDeltaCount: number;
  comparisonTone: "neutral" | "positive" | "negative";
  comparisonSummaryLabel: string;
  dataSourceLabel: string;

  // Handlers & Actions
  handleLevelChange: (key: "combatLevel" | "strStat" | "dexStat" | "defStat", value: string) => void;
  setCombatStyle: (style: CombatStyle) => void;
  changeSlotFilter: (slot: "ALL" | GearType) => void;
  selectGear: (view: GearView) => void;
  prefetchGearItem: (name: string) => void;
  openItemByName: (name: string) => void;
  saveGearToProfile: (slot: string) => void;
  focusSearch: () => void;
  showUsableRecommendations: () => void;
  jumpToComparison: () => void;
};
