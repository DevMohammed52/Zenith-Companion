import type { ReactNode } from "react";

export type Trend = "up" | "down" | "flat";
export type ActionPath = "MARKET" | "VENDOR" | "LIQUIDATE";
export type RowStatus = "ok" | "missing";
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

export type MarketData = {
  avg_3?: number;
  avg_7?: number;
  avg_14?: number;
  avg_30?: number;
  price?: number;
  vol_3?: number;
  stable_vol_3?: number;
  daily_sales_trimmed_avg_30?: number;
  daily_sales_median_30?: number;
  daily_sales_max_30?: number;
  sales_outlier_days_30?: number;
  sales_spike_ratio?: number;
  vendor_price?: number;
  quality?: string;
};

export type IngredientCost = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  source: "custom" | "market" | "vendor" | "missing";
  owned: boolean;
};

export type AlchemyRow = {
  status: RowStatus;
  name: string;
  level: number;
  vialName: string;
  materialNames: string[];
  searchText: string;
  baseTime: number;
  time: number;
  efficiencyBonus: number;
  craftsPerHour: number;
  craftsPerDay: number;
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
  bestRevenue: number;
  profit: number;
  profitPerHour: number;
  opportunityProfit: number;
  dailyProfit: number;
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

export type DbRecipeMaterial = {
  item_name?: string;
  name?: string;
};

export type DbItem = {
  name?: string;
  type?: string;
  recipe?: {
    skill?: string;
    level_required?: number;
    max_uses?: number;
    materials?: DbRecipeMaterial[];
    result?: {
      item_name?: string;
      name?: string;
    };
  } | null;
};

export type AlchemySortKey =
  | "name"
  | "level"
  | "action"
  | "cost"
  | "bestRevenue"
  | "profit"
  | "profitPerHour"
  | "dailyProfit"
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
  "dailyProfit",
  "vol_3",
  "craftsPerHour",
  "time",
  "signal",
];

export const OWNED_STORAGE_KEY = "zenith_alchemy_owned_materials";
export const OWNED_MODE_STORAGE_KEY = "zenith_alchemy_owned_cost_mode";
export const ALCHEMY_SETTINGS_STORAGE_KEY = "zenith_alchemy_settings";

export const ALCHEMY_LIQUIDITY_FILTERS: { value: AlchemyLiquidityFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "LIQUID", label: "Liquid" },
  { value: "STEADY", label: "Steady" },
  { value: "THIN", label: "Thin" },
  { value: "VOLUME SWINGS", label: "Volume" },
  { value: "PRICE SWINGS", label: "Price swings" },
  { value: "SPIKE RISK", label: "Spike" },
  { value: "VENDOR SAFE", label: "Vendor" },
  { value: "MISSING", label: "Missing" },
];

export const ALCHEMY_SORT_LABELS: Record<AlchemySortKey, string> = {
  name: "Name",
  level: "Level",
  action: "Best path",
  cost: "Cost",
  bestRevenue: "Return",
  profit: "Profit / pc",
  profitPerHour: "Profit/Hr",
  dailyProfit: "Daily profit",
  vol_3: "Stable volume",
  craftsPerHour: "Crafts/hr",
  time: "Time",
  signal: "Liquidity",
};

export const ALCHEMY_MOBILE_SORT_OPTIONS: { value: AlchemySortKey; label: string }[] = [
  { value: "profitPerHour", label: "Profit/Hr" },
  { value: "profit", label: "Profit / pc" },
  { value: "cost", label: "Cost" },
  { value: "bestRevenue", label: "Return" },
  { value: "dailyProfit", label: "Daily Profit" },
  { value: "vol_3", label: "Stable Volume" },
  { value: "level", label: "Level" },
  { value: "name", label: "Name" },
];

export type PersistedAlchemySettings = {
  minLevel: number | "";
  maxLevel: number | "";
  minProfit: number | "";
  minVolume: number | "";
  liquidityFilter?: AlchemyLiquidityFilter;
  onlyProfitable: boolean;
  hideMissing: boolean;
  ownedCostMode?: boolean;
  sortCol: AlchemySortKey | "roi";
  sortDesc: boolean;
};

export type AlchemySummary = {
  market?: AlchemyRow;
  vendor?: AlchemyRow;
  hourly?: AlchemyRow;
  volume?: AlchemyRow;
  risky?: AlchemyRow;
  best?: AlchemyRow;
};
