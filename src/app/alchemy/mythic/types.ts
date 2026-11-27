import type { AlchemyCategory, AlchemyItemCategory, WhatIfClassOverride } from "@/app/alchemy/types";
import type { AssaultRank } from "@/lib/skill-profit";
import type {
  MythicCatalogRow,
  MythicDbItem,
  MythicMarketItem,
  MythicPriceSource,
  MythicProjectRow,
  MythicRecipe,
  MythicRecipeCostMode,
  MythicRecommendedRecipe,
} from "@/lib/mythic-alchemy";

export type {
  AlchemyCategory,
  AlchemyItemCategory,
  MythicCatalogRow,
  MythicDbItem,
  MythicMarketItem,
  MythicPriceSource,
  MythicProjectRow,
  MythicRecipe,
  MythicRecipeCostMode,
  MythicRecommendedRecipe,
  WhatIfClassOverride,
};

export type MythicWorkspaceTab = "catalog" | "pinned";
export type MythicViewMode = "table" | "cards";
export type MythicCatalogSortKey =
  | "profitPerHour"
  | "totalBatchProfit"
  | "expPerHour"
  | "recipePrice"
  | "totalCostPerCraft"
  | "name";

export interface PersistedMythicLoadout {
  classOverride: WhatIfClassOverride;
  conquestOverride: AssaultRank | "profile";
  barteringOverride: number | "";
  customSessionHours: number | "";
  ascensionBuffIds: string[];
  energizingPoolExp: number;
  membershipOverride: boolean | null;
}

export const DEFAULT_MYTHIC_LOADOUT: PersistedMythicLoadout = {
  classOverride: "profile",
  conquestOverride: "profile",
  barteringOverride: "",
  customSessionHours: "",
  ascensionBuffIds: [],
  energizingPoolExp: 0,
  membershipOverride: null,
};

export const RECIPE_COST_MODE_HELP: Record<MythicRecipeCostMode, string> = {
  full: "Full recipe spreads the recipe buy price over all 30 uses.",
  remaining: "Remaining uses spreads the recipe buy price across the uses left on your copy.",
  owned: "Owned ignores the recipe buy cost and only counts materials.",
};

export const MYTHIC_CATEGORY_TABS: Array<{ id: AlchemyCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "potion", label: "Potions" },
  { id: "essence_crystal", label: "Essence Crystals" },
  { id: "stat_essence", label: "Stat Essences" },
];

export const MYTHIC_CATALOG_SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "profitPerHour:desc", label: "Profit / Hr (high-low)" },
  { value: "totalBatchProfit:desc", label: "30-Use Batch (high-low)" },
  { value: "expPerHour:desc", label: "EXP / Hr (high-low)" },
  { value: "totalCostPerCraft:asc", label: "Craft Cost (low-high)" },
  { value: "recipePrice:asc", label: "Recipe Price (low-high)" },
  { value: "name:asc", label: "Name (A-Z)" },
];

export type MythicLabSummary = {
  totalPotentialProfit: number;
  totalRemainingExp: number;
  bestPinned?: MythicProjectRow;
  bestCatalog?: MythicCatalogRow;
  bestExpCatalog?: MythicCatalogRow;
};

export type MythicLabStats = {
  warningProjects: number;
  priceGapProjects: number;
  usesRemaining: number;
  profitableProjects: number;
  catalogProfitableCount: number;
  catalogMissingCount: number;
};
