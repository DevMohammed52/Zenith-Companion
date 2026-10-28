import type { Dispatch, SetStateAction, KeyboardEvent } from "react";
import { formatGold } from "@/lib/format";
import type {
  AssaultRank,
  SaleMode,
  SkillName,
  SkillProfitRow,
  SkillProfitSettings,
  SkillProfitSortKey,
  ToolSkill,
  ToolSelections,
  ItemRegistry,
  MarketData,
  ItemLookup,
  SkillRecipe,
} from "@/lib/skill-profit";
import { DEFAULT_TOOL_SELECTIONS } from "@/lib/skill-profit";
export { DEFAULT_TOOL_SELECTIONS };
import type { CharacterProfile } from "@/lib/profiles";
import type { Preferences } from "@/lib/preferences";
import type { HousingBuffSummary } from "@/lib/housing";
import type { EssenceSession, EssenceSkillName } from "@/lib/essences";

export const STORAGE_KEY = "zenith_skill_profit_finder";

export const DEFAULT_SETTINGS: SkillProfitSettings = {
  membership: false,
  classBonus: false,
  saleMode: "best",
  energizingPoolExp: 0,
  assaultRank: "none",
  ascensionBuffIds: [],
  tools: DEFAULT_TOOL_SELECTIONS,
  customPrices: {},
  barteringBoost: 0,
  essenceBySkill: {},
};

export type PersistedState = {
  settings: SkillProfitSettings;
  activeSkill: SkillName | "All";
  sortKey: SkillProfitSortKey;
  sortDesc: boolean;
  searchTerm: string;
  minVolume: number;
  ascensionOpen: boolean;
  essenceOpen: boolean;
  hideAboveLevel: boolean;
};

export type DropdownLayer = "tools" | "essences" | "command";

export const DEFAULT_STATE: PersistedState = {
  settings: DEFAULT_SETTINGS,
  activeSkill: "All",
  sortKey: "profitPerHour",
  sortDesc: true,
  searchTerm: "",
  minVolume: 100,
  ascensionOpen: false,
  essenceOpen: false,
  hideAboveLevel: false,
};

export const MOBILE_RESULT_BATCH_SIZE = 48;

export const SORT_LABELS: Record<SkillProfitSortKey, string> = {
  name: "Item",
  skill: "Skill",
  level: "Level",
  profitEach: "Profit/Piece",
  profitPerHour: "Gold/Hr",
  roi: "ROI %",
  itemsPerHour: "Items/Hr",
  expPerSecond: "Exp/S",
  expPerHour: "Exp/Hr",
  finalDuration: "Duration",
  volume3d: "Stable Vol",
  inputCost: "Cost",
  salePrice: "Return",
};

export const CONQUEST_PICKER_OPTIONS: Array<{ value: AssaultRank; label: string; hint: string }> = [
  { value: "none", label: "No conquest", hint: "No profile buff" },
  { value: "first", label: "1st place", hint: "+25% EXP, +5% Eff" },
  { value: "second", label: "2nd place", hint: "+17% EXP, +5% Eff" },
  { value: "third", label: "3rd place", hint: "+13% EXP, +5% Eff" },
  { value: "fourth", label: "4th place", hint: "+10% EXP, +3% Eff" },
  { value: "fifthSeventh", label: "5th-7th", hint: "+7% EXP, +3% Eff" },
  { value: "eighthTenth", label: "8th-10th", hint: "+3% EXP, +2% Eff" },
];

export const SALE_MODE_OPTIONS: Array<{ value: SaleMode; label: string; hint: string }> = [
  { value: "best", label: "Auto", hint: "Use the better net return" },
  { value: "market", label: "Market", hint: "Sell through market after tax" },
  { value: "vendor", label: "Vendor", hint: "Sell to vendor with bartering" },
];

export type OptionPickerOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
  badge?: string;
};

export interface SkillProfitRowModel {
  filtered: SkillProfitRow[];
  topBySkill: Map<SkillName, SkillProfitRow>;
  topOverall: SkillProfitRow | null;
  counts: Map<SkillName, number>;
}

export interface UseSkillProfitStateReturn {
  // Primary State
  settings: SkillProfitSettings;
  activeSkill: SkillName | "All";
  sortKey: SkillProfitSortKey;
  sortDesc: boolean;
  searchTerm: string;
  deferredSearchTerm: string;
  searchTokens: string[];
  minVolume: number;
  hideAboveLevel: boolean;
  includeForgeInfoRows: boolean;
  ascensionOpen: boolean;
  essenceOpen: boolean;
  mobileSetupOpen: boolean;
  compactResults: boolean;
  visibleRowLimit: number;
  selectedRow: SkillProfitRow | null;
  activeDropdownLayer: DropdownLayer | null;

  // Draft Text Inputs
  poolExpDraft: string;
  minVolumeDraft: string;
  barteringLevelDraft: string;

  // Persistence & Hydration Status
  storageKey: string;
  loadedStoredState: boolean;

  // Profile Sync Metadata
  activeProfile: CharacterProfile | null;
  configuredProfile: CharacterProfile | null;
  activeProfileId: string | null;
  hasProfileSkills: boolean;
  activeSkillLevel: number | null;
  profileLabel: string;
  targetBarteringLevel: number;
  preferences: Preferences;

  // Setters & State Updaters
  setSettings: Dispatch<SetStateAction<SkillProfitSettings>>;
  setActiveSkill: (skill: SkillName | "All") => void;
  setSortKey: (key: SkillProfitSortKey) => void;
  setSortDesc: Dispatch<SetStateAction<boolean>>;
  setSearchTerm: (term: string) => void;
  setMinVolume: (vol: number) => void;
  setMinVolumeDraft: (draft: string) => void;
  setPoolExpDraft: (draft: string) => void;
  setBarteringLevelDraft: (draft: string) => void;
  setAscensionOpen: Dispatch<SetStateAction<boolean>>;
  setEssenceOpen: Dispatch<SetStateAction<boolean>>;
  setMobileSetupOpen: Dispatch<SetStateAction<boolean>>;
  setIncludeForgeInfoRows: Dispatch<SetStateAction<boolean>>;
  setHideAboveLevel: Dispatch<SetStateAction<boolean>>;
  setVisibleRowLimit: Dispatch<SetStateAction<number>>;
  setSelectedRow: (row: SkillProfitRow | null) => void;

  // Business Action Handlers
  patchSettings: (patch: Partial<SkillProfitSettings>) => void;
  patchTool: (skill: ToolSkill, toolName: string) => void;
  patchEssence: (skill: EssenceSkillName, essenceName: string) => void;
  toggleAscension: (id: string) => void;
  handleSort: (key: SkillProfitSortKey) => void;
  resetRouteFilters: () => void;
  commitBarteringLevel: (raw: string) => void;
  setDropdownLayerOpen: (layer: DropdownLayer, open: boolean) => void;
  handleToolPickerOpenChange: (open: boolean) => void;
  handleEssencePickerOpenChange: (open: boolean) => void;
  handleCommandPickerOpenChange: (open: boolean) => void;
}

export interface UseSkillProfitCalculationsReturn {
  // Calculated datasets
  rows: SkillProfitRow[];
  rowModel: SkillProfitRowModel;
  visibleRows: SkillProfitRow[];
  hiddenRowCount: number;
  liquidRouteCount: number;
  needsPriceCount: number;

  // Buffs and settings derivations
  effectiveSettings: SkillProfitSettings;
  effectiveToolSelections: ToolSelections;
  buffTotals: { efficiency: number; experience: number };

  // Context metadata
  marketData: MarketData | null;
  allItemsDb: ItemLookup | null;
  itemRegistry: ItemLookup | null;
  marketAgeMinutes: number | null;
  profileLabel: string;
  scopeLabel: string;
  saleModeLabel: string;

  // Housing derivations
  housingSummary: HousingBuffSummary;
  housingIdleHoursBySkill: Partial<Record<SkillName, number>>;
  rawHousingIdleHoursBySkill: Partial<Record<SkillName, number>>;
  baseIdleActionHours: number;
  idleActionHoursBySkill: Partial<Record<SkillName, number>>;
  appliedHousingWindows: Array<{ skill: SkillName; label: string; hours: number }>;
  rawHousingWindows: Array<{ skill: SkillName; label: string; hours: number }>;
  visibleHousingWindows: Array<{ skill: SkillName; label: string; hours: number }>;
  activeSkillHousingHours: number;
  activeSkillHousingLabel: string;
  housingWindowSub: string;
  housingWindowAllValue: string;
  housingWindowAllSub: string;
  hasAnyLocationLimitedHousing: boolean;

  // Essence sessions
  essenceSessionsBySkill: Partial<Record<EssenceSkillName, EssenceSession>>;
  activeEssenceCount: number;

  // Forge data
  forgeRecipes: SkillRecipe[];

  // Search & Batching
  searchTokens: string[];
}

export function stringifyDetail(value: any): string {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyDetail).join(", ");
  if (typeof value === "object") {
    const name = value.name || value.item_name || value.type || value.location || value.value;
    if (name) return String(name);
    return Object.entries(value)
      .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "")
      .slice(0, 3)
      .map(([entryKey, entryValue]) => `${formatType(entryKey)}: ${stringifyDetail(entryValue)}`)
      .join(", ");
  }
  return String(value);
}

export function formatEffectEntry(effect: any, index: number): [string, string] {
  if (!effect || typeof effect !== "object") return [`Effect ${index + 1}`, stringifyDetail(effect)];
  const target = effect.target ? formatType(effect.target) : "";
  const attribute = effect.attribute ? formatType(effect.attribute) : effect.name || effect.type || `Effect ${index + 1}`;
  const label = [target, attribute].filter(Boolean).join(" ");
  const rawValue = Number(effect.value);
  const prefix = Number.isFinite(rawValue) && rawValue > 0 ? "+" : "";
  const suffix = effect.value_type === "percentage"
    ? "%"
    : effect.value_type
      ? ` ${formatType(effect.value_type).toLowerCase()}`
      : "";
  const value = Number.isFinite(rawValue) ? `${prefix}${rawValue.toLocaleString()}${suffix}` : stringifyDetail(effect);
  return [label || `Effect ${index + 1}`, value];
}

export function formatType(value: any): string {
  if (!value) return "Unknown";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatPriceSource(value: string): string {
  if (value === "scenario") return "Try price";
  if (value === "custom") return "Custom";
  if (value === "market") return "Market";
  if (value === "vendor") return "Vendor";
  return "Missing";
}

export function formatSignedGold(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatGold(Math.abs(value))}g`;
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatOptionalNumber(value: number | null): string {
  return value === null ? "Unknown" : formatNumber(value);
}

export function isLiquid(row: SkillProfitRow, minVolume: number): boolean {
  if (row.saleSource === "missing") return false;
  const isMarketLike = row.saleSource === "market" || row.saleSource === "custom" || row.saleSource === "scenario";
  return !isMarketLike || (row.stableVolume3d >= minVolume && !row.liquidityRisk);
}

export function isExcludedFromTop(row: SkillProfitRow, minVolume: number): boolean {
  return row.skill === "Forge" || !isLiquid(row, minVolume);
}

export function getSearchTokens(search: string): string[] {
  return search.split(/\s+/).map((token) => token.trim()).filter(Boolean);
}

export function rowMatchesSearch(row: SkillProfitRow, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const parts = [
    row.name,
    row.skill,
    row.note || "",
    row.bestSaleSource,
    row.saleSource,
    row.liquidityLabel,
    row.liquidityNote,
    row.essenceName,
    ...row.inputMissing,
    ...row.ingredients.map((ingredient) => ingredient.name),
  ].map((part) => part.toLowerCase());

  return tokens.every((token) => parts.some((part) => part.includes(token)));
}

export function getMatchedIngredient(row: SkillProfitRow, tokens: string[]): string | null {
  if (tokens.length === 0) return null;
  return row.ingredients.find((ingredient) => {
    const ingredientName = ingredient.name.toLowerCase();
    return tokens.every((token) => ingredientName.includes(token));
  })?.name ?? null;
}

export function getSortValue(row: SkillProfitRow, key: SkillProfitSortKey): string | number {
  if (key === "name") return row.name.toLowerCase();
  if (key === "skill") return row.skill;
  if (key === "profitPerHour") return getRankedProfitPerHour(row);
  if (key === "volume3d") return row.stableVolume3d;
  return row[key] ?? -Infinity;
}

export function getDisplayProfitPerHour(row: SkillProfitRow): number | null {
  if (row.essenceActive && row.profitWithEssencePerHour !== null) return row.profitWithEssencePerHour;
  if (row.essenceActive && row.essenceNeedsPrice) return null;
  return row.profitPerHour;
}

export function getRankedProfitPerHour(row: SkillProfitRow): number {
  const displayProfit = getDisplayProfitPerHour(row);
  if (displayProfit !== null) return displayProfit;
  return row.baseProfitPerHour;
}

export function getProfitCellValue(row: SkillProfitRow): string {
  const displayProfit = getDisplayProfitPerHour(row);
  return displayProfit === null ? "Needs price/data" : `${formatGold(displayProfit)}g`;
}

export function getProfitCardValue(row: SkillProfitRow): string {
  const displayProfit = getDisplayProfitPerHour(row);
  return displayProfit === null ? "Needs price/data" : `${formatGold(displayProfit)}g/hr`;
}

export function getProfitSummary(row: SkillProfitRow): string {
  const displayProfit = getDisplayProfitPerHour(row);
  if (displayProfit === null) return `Needs price/data - base ${formatGold(row.baseProfitPerHour)}g/hr`;
  return `${formatGold(displayProfit)}g/hr`;
}
