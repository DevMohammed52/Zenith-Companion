import type {
  MythicDbItem,
  MythicMarketItem,
  MythicPriceSource,
  MythicProjectRow,
  MythicRecipe,
  MythicRecipeCostMode,
  MythicRecommendedRecipe,
} from "@/lib/mythic-alchemy";

export type {
  MythicDbItem,
  MythicMarketItem,
  MythicPriceSource,
  MythicProjectRow,
  MythicRecipe,
  MythicRecipeCostMode,
  MythicRecommendedRecipe,
};

export const RECIPE_COST_MODE_HELP: Record<MythicRecipeCostMode, string> = {
  full: "Full recipe spreads the recipe buy price over every listed use.",
  remaining: "Remaining uses spreads the recipe buy price over the uses left on your copy.",
  owned: "Owned ignores recipe purchase cost and only counts materials.",
};

export type MythicLabSummary = {
  totalPotentialProfit: number;
  best?: MythicProjectRow;
};

export type MythicLabStats = {
  warningProjects: number;
  priceGapProjects: number;
  usesRemaining: number;
  profitableProjects: number;
};
