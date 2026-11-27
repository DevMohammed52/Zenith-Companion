import type { AssaultRank } from "@/lib/skill-profit";

export type Trend = "up" | "down" | "flat";
export type ActionPath = "MARKET" | "VENDOR" | "LIQUIDATE";
export type RowStatus = "ok" | "missing";
export type AlchemyItemCategory = "potion" | "essence_crystal" | "stat_essence";
export type AlchemyCategory = "all" | AlchemyItemCategory;
export type AlchemyViewMode = "table" | "cards";
export type AlchemyRateMode = "hourly" | "session";

export type LiquiditySignal =
  | "LIQUID"
  | "STEADY"
  | "VOLUME SWINGS"
  | "PRICE SWINGS"
  | "SPIKE RISK"
  | "THIN"
  | "NO SALES"
  | "VENDOR SAFE"
  | "MISSING";

export type AlchemyLiquidityFilter = LiquiditySignal | "ALL";

export type AlchemyMarketItem = {
  avg_3?: number;
  avg_7?: number;
  avg_14?: number;
  avg_30?: number;
  price?: number;
  safe_price?: number;
  vol_3?: number;
  stable_vol_3?: number;
  daily_sales_trimmed_avg_30?: number;
  daily_sales_median_30?: number;
  daily_sales_max_30?: number;
  sales_outlier_days_30?: number;
  sales_spike_ratio?: number;
  vendor_price?: number;
  quality?: string;
  image_url?: string;
};

export type AlchemyDbItem = {
  name?: string;
  type?: string;
  quality?: string;
  image_url?: string;
  vendor_price?: number;
  effects?: Array<{
    value?: number;
    target?: string;
    attribute?: string;
    value_type?: string;
    length?: number;
  }> | null;
  recipe?: {
    skill?: string;
    level_required?: number;
    max_uses?: number;
    materials?: Array<{ item_name?: string; name?: string }>;
    result?: {
      item_name?: string;
      name?: string;
    };
  } | null;
};

export type IngredientCost = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  source: "custom" | "market" | "vendor" | "missing";
  owned: boolean;
  imageUrl?: string;
  quality?: string;
};

export type AlchemyRow = {
  status: RowStatus;
  name: string;
  level: number;
  category: AlchemyItemCategory;
  quality: string;
  imageUrl: string;
  vialName: string;
  vialImageUrl: string;
  materialNames: string[];
  searchText: string;
  baseTime: number;
  time: number;
  efficiencyBonus: number;
  expBonus: number;
  baseAlchemyExp: number;
  alchemyExpEach: number;
  expPerHour: number;
  baseSpeedExp: number;
  speedExpPerHour: number;
  craftsPerHour: number;
  craftsPerSession: number;
  trend: Trend;
  action: ActionPath;
  signal: LiquiditySignal;
  warnings: string[];
  reason: string;
  formula: string;
  cost: number;
  cashCost: number;
  opportunityCost: number;
  materialCost: number;
  cashMaterialCost: number;
  vialCost: number;
  recipeCostShare: number;
  marketGross: number;
  marketTax: number;
  marketNet: number;
  vendorNet: number;
  liquidationNet: number;
  craftRevenue: number;
  bestRevenue: number;
  profit: number;
  craftProfit: number;
  profitPerHour: number;
  opportunityProfit: number;
  sessionProfit: number;
  sessionExp: number;
  vol_3: number;
  stableVol_3: number;
  liquidityNote: string;
  liquidityRisk: boolean;
  sellThroughRisk: boolean;
  sellThroughNote: string;
  outputSource: "custom" | "market" | "missing";
  inputMissing: string[];
  ingredientCosts: IngredientCost[];
};

export type AlchemySortKey =
  | "name"
  | "level"
  | "action"
  | "cost"
  | "bestRevenue"
  | "profit"
  | "profitPerHour"
  | "sessionProfit"
  | "expPerHour"
  | "vol_3"
  | "craftsPerHour"
  | "time"
  | "signal";

export const ALCHEMY_SORT_KEYS: readonly AlchemySortKey[] = [
  "name",
  "level",
  "action",
  "cost",
  "bestRevenue",
  "profit",
  "profitPerHour",
  "sessionProfit",
  "expPerHour",
  "vol_3",
  "craftsPerHour",
  "time",
  "signal",
];

export const ALCHEMY_CATEGORY_TABS: Array<{ id: AlchemyCategory; label: string }> = [
  { id: "all", label: "All Recipes" },
  { id: "potion", label: "Potions" },
  { id: "essence_crystal", label: "Essence Crystals" },
  { id: "stat_essence", label: "Stat Essences" },
];

export const OWNED_STORAGE_KEY = "zenith_alchemy_owned_materials";
export const OWNED_MODE_STORAGE_KEY = "zenith_alchemy_owned_cost_mode";
export const ALCHEMY_SETTINGS_STORAGE_KEY = "zenith_alchemy_settings";

export const ALCHEMY_LIQUIDITY_FILTERS: { value: AlchemyLiquidityFilter; label: string }[] = [
  { value: "ALL", label: "All Liquidity" },
  { value: "LIQUID", label: "Liquid" },
  { value: "STEADY", label: "Steady" },
  { value: "THIN", label: "Thin" },
  { value: "VOLUME SWINGS", label: "Volume Swings" },
  { value: "PRICE SWINGS", label: "Price Swings" },
  { value: "SPIKE RISK", label: "Spike Risk" },
  { value: "VENDOR SAFE", label: "Vendor Safe" },
  { value: "MISSING", label: "Missing Price" },
];

export const ALCHEMY_SORT_LABELS: Record<AlchemySortKey, string> = {
  name: "Name",
  level: "Level",
  action: "Best path",
  cost: "Cost",
  bestRevenue: "Return",
  profit: "Profit / pc",
  profitPerHour: "Profit/Hr",
  sessionProfit: "Session Profit",
  expPerHour: "EXP/Hr",
  vol_3: "3d Volume",
  craftsPerHour: "Crafts/hr",
  time: "Time",
  signal: "Liquidity",
};

export const ALCHEMY_SORT_SELECT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "profitPerHour:desc", label: "Profit/Hr (high-low)" },
  { value: "profit:desc", label: "Profit / pc (high-low)" },
  { value: "sessionProfit:desc", label: "Session Profit (high-low)" },
  { value: "expPerHour:desc", label: "EXP/Hr (high-low)" },
  { value: "vol_3:desc", label: "3d Volume (high-low)" },
  { value: "cost:asc", label: "Cost (low-high)" },
  { value: "bestRevenue:desc", label: "Return (high-low)" },
  { value: "craftsPerHour:desc", label: "Crafts/hr (high-low)" },
  { value: "level:asc", label: "Level (low-high)" },
  { value: "level:desc", label: "Level (high-low)" },
  { value: "name:asc", label: "Name (A-Z)" },
];

export type WhatIfClassOverride = "profile" | "alchemist" | "standard" | "penalty";

export type PersistedAlchemySettings = {
  minLevel: number | "";
  maxLevel: number | "";
  minProfit: number | "";
  minVolume: number | "";
  liquidityFilter?: AlchemyLiquidityFilter;
  activeCategory?: AlchemyCategory;
  onlyProfitable: boolean;
  hideAboveLevel?: boolean;
  hideMissing: boolean;
  ownedCostMode?: boolean;
  viewMode?: AlchemyViewMode;
  rateMode?: AlchemyRateMode;
  sortCol: AlchemySortKey | "roi" | "dailyProfit";
  sortDesc: boolean;
  pageSize?: number;
  ascensionBuffIds?: string[];
  energizingPoolExp?: number;
  classOverride?: WhatIfClassOverride;
  conquestOverride?: AssaultRank | "profile";
  barteringOverride?: number | "";
  manualAlchemistClass?: boolean;
  manualPenaltyClass?: boolean;
  manualConquestRank?: AssaultRank;
  customSessionHours?: number | "";
};

export type AlchemySummary = {
  market?: AlchemyRow;
  vendor?: AlchemyRow;
  hourly?: AlchemyRow;
  xp?: AlchemyRow;
  volume?: AlchemyRow;
  risky?: AlchemyRow;
  best?: AlchemyRow;
};
