import { getQualityRank } from "@/lib/quality";
import type {
  ForgeDbItem,
  ForgeItemLookup,
  ForgeMarketData,
  ForgeMaterialNeed,
  ForgePlanEntry,
  ForgePlannerLine,
  ForgePlannerOwnedMaterials,
  ForgePlannerSettings,
  ForgePlannerSummary,
  ForgeQuality,
  ForgeRecipeNeed,
  ForgeRecipeOption,
} from "@/lib/forge-planner";
import type { RefObject } from "react";
import type { CharacterProfile } from "@/lib/profiles";

export type {
  ForgeDbItem,
  ForgeItemLookup,
  ForgeMarketData,
  ForgeMaterialNeed,
  ForgePlanEntry,
  ForgePlannerLine,
  ForgePlannerOwnedMaterials,
  ForgePlannerSettings,
  ForgePlannerSummary,
  ForgeQuality,
  ForgeRecipeNeed,
  ForgeRecipeOption,
};

export type ForgeTab = "lessons" | "craft";

export interface ForgeTabDefinition {
  id: ForgeTab;
  label: string;
  hint: string;
}

export const FORGE_TABS: ForgeTabDefinition[] = [
  { id: "lessons", label: "Lessons", hint: "Training queue & progression roadmap" },
  { id: "craft", label: "Craft Item", hint: "Recipe planner & shopping list" },
];

export const FORGE_OWNED_STORAGE_KEY = "zenith_forge_owned_materials_v1";
export const FORGE_OWNED_SYNC_EVENT = "zenith_forge_owned_update";

export const QUALITY_OPTIONS = ["ALL", "MYTHIC", "LEGENDARY", "EPIC", "PREMIUM", "REFINED"] as const;
export type ForgeQualityFilter = (typeof QUALITY_OPTIONS)[number];

export const SORT_OPTIONS = [
  { id: "value", label: "Value" },
  { id: "level", label: "Level" },
  { id: "name", label: "Name" },
  { id: "materials", label: "Materials" },
] as const;
export type ForgeSortBy = (typeof SORT_OPTIONS)[number]["id"];

export type PlannerDraft = {
  lines: Array<Omit<ForgePlannerLine, "quantity" | "ownedRecipes"> & { quantity: number | ""; ownedRecipes: number | "" }>;
  ownedMaterials: ForgePlannerOwnedMaterials;
};

export type QtyField = "quantity" | "ownedRecipes";

export function getRecipeDisplayValue(recipe: ForgeRecipeOption): number {
  return getQualityRank(recipe.quality) * 1_000_000 + recipe.levelRequired * 1_000 - recipe.materials.length;
}

export interface ForgeState {
  activeTab: ForgeTab;
  setActiveTab: (tab: ForgeTab) => void;
  tabButtonRefs: RefObject<Record<string, HTMLButtonElement | null>>;
  handleTabKeyDown: (event: React.KeyboardEvent, index: number) => void;

  pickerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;

  draft: PlannerDraft;
  setDraft: React.Dispatch<React.SetStateAction<PlannerDraft>>;
  recipeSearch: string;
  setRecipeSearch: (search: string) => void;
  updateRecipeSearch: (value: string) => void;
  qualityFilter: ForgeQualityFilter;
  setQualityFilter: (quality: ForgeQualityFilter) => void;
  sortBy: ForgeSortBy;
  setSortBy: (sort: ForgeSortBy) => void;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  openFilterPicker: "quality" | "sort" | "";
  setOpenFilterPicker: (picker: "quality" | "sort" | "") => void;
  activeOptionIndex: number;
  setActiveOptionIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedRecipeName: string;
  setSelectedRecipeName: (name: string) => void;
  focusedEntryKey: string;
  setFocusedEntryKey: (key: string) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  clearedDraft: PlannerDraft | null;

  recipes: ForgeRecipeOption[];
  recipesByName: Map<string, ForgeRecipeOption>;
  visibleRecipeOptions: ForgeRecipeOption[];
  selectedRecipe: ForgeRecipeOption | null;
  selectedEntry: ForgePlanEntry | null;
  profileBarteringBoost: number;
  plan: ForgePlannerSummary;

  activeProfile: CharacterProfile | null;
  activeProfileName: string;
  marketNetPercent: number;
  warningCount: number;
  planHealthLabel: string;
  loading: boolean;

  chooseRecipe: (recipe: ForgeRecipeOption) => void;
  addRecipe: (recipeName?: string) => void;
  updateLine: (recipeName: string, field: QtyField, value: string) => void;
  removeLine: (recipeName: string) => void;
  setOwnedMaterial: (name: string, value: string) => void;
  clearPlan: () => void;
  undoClearPlan: () => void;
  handlePickerKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  openItemByName: (name: string) => void;
  prefetchItem: (name: string) => void;
}

export type ForgeLessonCategory = "ALL" | "ORES" | "BARS" | "LOGS" | "MOB_DROPS";

export const FORGE_LESSON_CATEGORIES: Array<{ id: ForgeLessonCategory; label: string }> = [
  { id: "ALL", label: "All Items" },
  { id: "ORES", label: "Ores" },
  { id: "BARS", label: "Bars" },
  { id: "LOGS", label: "Logs" },
  { id: "MOB_DROPS", label: "Mob Drops" },
];

export const FORGE_LESSON_SORTS = [
  { id: "lowest_gold", label: "Cheapest (Gold / EXP)" },
  { id: "highest_exp", label: "Highest EXP" },
  { id: "slowest_burn", label: "Slowest (Long AFK)" },
  { id: "fastest_burn", label: "Fastest (Quick Burn)" },
  { id: "market_price", label: "Market Price" },
  { id: "level", label: "Level Required" },
  { id: "name", label: "Name" },
] as const;

export type ForgeLessonSort = (typeof FORGE_LESSON_SORTS)[number]["id"];

export interface ForgeLessonMaterial {
  id: string;
  name: string;
  category: "ORES" | "BARS" | "LOGS" | "MOB_DROPS";
  quality: "STANDARD" | "REFINED" | "PREMIUM" | "EPIC" | "LEGENDARY" | "MYTHIC";
  reqLvl: number;
  baseExp: number;
  timeSeconds: number;
  marketPrice: number;
  mob?: string;
  imageUrl?: string;
}

export interface CalculatedLessonMaterial extends ForgeLessonMaterial {
  penaltyEff: number;
  displayedEff: number;
  displayedExp: number;
  effectiveExp: number;
  goldPerExp: number;
  expPerSecond: number;
  hasPenalty: boolean;
  warningType: "NONE" | "TOO_BASIC" | "TOO_ADVANCED";
  warningText?: string;
  liveMarketPrice: number;
  priceSource: "live" | "baseline";
}

export interface QueuedLessonItem {
  material: CalculatedLessonMaterial;
  quantity: number;
  totalExp: number;
  totalDurationSeconds: number;
  totalCost: number;
}

export interface LessonSessionSummary {
  queuedItems: QueuedLessonItem[];
  totalForgeExp: number;
  totalStrengthExp: number;
  totalDurationSeconds: number;
  totalCost: number;
  projectedLevel: number;
  projectedLevelProgress: number;
  hasOverlevelWarning: boolean;
  hasRareDropWarning: boolean;
  exceedsCap: boolean;
}

export interface GoalProgressionStep {
  fromLevel: number;
  toLevel: number;
  material: CalculatedLessonMaterial;
  quantityNeeded: number;
  cost: number;
  durationSeconds: number;
}

export interface GoalEstimateResult {
  currentLevel: number;
  targetLevel: number;
  expNeeded: number;
  cheapestOption: {
    material: CalculatedLessonMaterial;
    quantityNeeded: number;
    totalCost: number;
    totalDurationSeconds: number;
  } | null;
  bestOption?: {
    material: CalculatedLessonMaterial;
    quantityNeeded: number;
    totalCost: number;
    totalDurationSeconds: number;
  } | null;
  fastestOption: {
    material: CalculatedLessonMaterial;
    quantityNeeded: number;
    totalCost: number;
    totalDurationSeconds: number;
  } | null;
  cheapestSteps?: GoalProgressionStep[];
  bestSteps?: GoalProgressionStep[];
  fastestSteps?: GoalProgressionStep[];
  totalCheapestCost?: number;
  totalBestCost?: number;
  totalFastestCost?: number;
  totalCheapestDurationSeconds?: number;
  totalBestDurationSeconds?: number;
  totalFastestDurationSeconds?: number;
}

