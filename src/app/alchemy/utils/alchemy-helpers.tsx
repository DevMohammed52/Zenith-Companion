import React from "react";
import { VIAL_COSTS } from "../../../constants";
import { getMarketLiquidity, getSafeMarketValue } from "@/lib/market-pricing";
import {
  ALCHEMY_LIQUIDITY_FILTERS,
  ALCHEMY_SETTINGS_STORAGE_KEY,
  ALCHEMY_SORT_KEYS,
  type ActionPath,
  type AlchemyLiquidityFilter,
  type AlchemyRow,
  type AlchemySortKey,
  type IngredientCost,
  type LiquiditySignal,
  type MarketData,
  type PersistedAlchemySettings,
  type Trend,
} from "../types";

export const formatGold = (value: number, digits = 0): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: digits });

export const formatSignedGold = (value: number, digits = 0): string =>
  `${value >= 0 ? "+" : ""}${formatGold(value, digits)}g`;

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const minutes = seconds / 60;
  return `${minutes.toFixed(minutes >= 10 ? 0 : 1)}m`;
};

export const formatMinutes = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0";
  const minutes = seconds / 60;
  return minutes >= 10 ? minutes.toFixed(0) : minutes.toFixed(1);
};

export const getCustomPrice = (customPrices: Record<string, number>, name: string): number => {
  const price = customPrices?.[name];
  return typeof price === "number" && price > 0 ? price : 0;
};

export const getItemPrice = (
  name: string,
  marketData: Record<string, MarketData>,
  customPrices: Record<string, number>,
): { price: number; source: IngredientCost["source"] | "custom" | "market" } => {
  const custom = getCustomPrice(customPrices, name);
  if (custom > 0) return { price: custom, source: "custom" };

  const market = getSafeMarketValue(marketData?.[name]);
  if (market > 0) return { price: market, source: "market" };

  const vendor = VIAL_COSTS[name] || 0;
  if (vendor > 0) return { price: vendor, source: "vendor" };

  return { price: 0, source: "missing" };
};

export const getTrend = (item?: MarketData): Trend => {
  const avg3 = item?.avg_3 || 0;
  const avg14 = item?.avg_14 || 0;
  if (avg3 > 0 && avg14 > 0 && avg3 > avg14 * 1.05) return "up";
  if (avg3 > 0 && avg14 > 0 && avg3 < avg14 * 0.95) return "down";
  return "flat";
};

export const getSignal = (
  action: ActionPath,
  item: MarketData | undefined,
  missing: boolean,
): LiquiditySignal => {
  if (missing) return "MISSING";
  if (action === "VENDOR") return "VENDOR SAFE";
  const liquidity = getMarketLiquidity(item);
  if (liquidity.isSpikeRisk) return "SPIKE RISK";
  if (liquidity.tone === "active") return "LIQUID";
  if (liquidity.tone === "steady") return "STEADY";
  if (liquidity.rawVolume3d > 0 || liquidity.stableVolume3d > 0) return "THIN";
  return "NO SALES";
};

export const getSignalClass = (signal: LiquiditySignal): string => {
  if (signal === "LIQUID" || signal === "VENDOR SAFE") return "action-craft";
  if (signal === "STEADY") return "action-vendor";
  return "action-liquidate";
};

export const getVisibleAlchemyWarnings = (row: AlchemyRow): string[] => {
  const repeatedBySignal = new Set<string>();
  if (row.signal === "SPIKE RISK") repeatedBySignal.add("Bulk-sale spike risk");
  if (row.signal === "VOLUME SWINGS") repeatedBySignal.add("Volume swings");
  if (row.signal === "THIN") repeatedBySignal.add("Thin market");
  return row.warnings.filter((warning) => !repeatedBySignal.has(warning));
};

export const getActionLabel = (action: ActionPath): string => {
  if (action === "MARKET") return "Market";
  if (action === "VENDOR") return "Vendor";
  return "Sell inputs";
};

export const makeSearchText = (...parts: Array<string | string[] | undefined>): string =>
  parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase();

export const getAlchemyMatchHint = (row: AlchemyRow, query: string): string => {
  const normalized = query.trim().toLowerCase();
  if (!normalized || row.name.toLowerCase().includes(normalized)) return "";
  const material = row.ingredientCosts.find((ingredient) =>
    ingredient.name.toLowerCase().includes(normalized),
  );
  if (material) return `Uses ${material.name}`;
  if (row.vialName.toLowerCase().includes(normalized)) return `Uses ${row.vialName}`;
  if (`recipe: ${row.name}`.toLowerCase().includes(normalized))
    return `Recipe scroll: Recipe: ${row.name}`;
  if (getActionLabel(row.action).toLowerCase().includes(normalized))
    return `Best path: ${getActionLabel(row.action)}`;
  if (row.signal.toLowerCase().includes(normalized)) return `Liquidity: ${row.signal}`;
  const warning = row.warnings.find((item) => item.toLowerCase().includes(normalized));
  if (warning) return warning;
  return "";
};

export const getSellThroughNote = (
  action: ActionPath,
  profit: number,
  stableVolume3d: number,
  craftsPerDay: number,
  activeHours: number,
  hasVolumeSwings: boolean,
): string => {
  if (action !== "MARKET" || profit <= 0) return "";
  const stableDailySales = stableVolume3d / 3;
  if (stableVolume3d <= 0) {
    return "Market profit is based on price history, but recent sold volume is missing. Treat it as a listing target, not a fast-sale estimate.";
  }
  if (activeHours > 0 && craftsPerDay > stableDailySales) {
    return `This setup can make about ${formatGold(craftsPerDay)} pcs/day while stable sold pace is about ${formatGold(stableDailySales)} pcs/day. Bulk output may need smaller batches or private buyers.`;
  }
  if (hasVolumeSwings) {
    return "Recent sold volume includes unusual bulk-sale days. Use the stable sold pace instead of the raw spike before mass crafting.";
  }
  if (stableVolume3d < 40) {
    return "Stable sold pace is low. This may still profit, but it can take longer to exit through the market.";
  }
  return "";
};

export const isAlchemySortKey = (value: unknown): value is AlchemySortKey =>
  typeof value === "string" && ALCHEMY_SORT_KEYS.includes(value as AlchemySortKey);

export const isAlchemyLiquidityFilter = (value: unknown): value is AlchemyLiquidityFilter =>
  typeof value === "string" &&
  ALCHEMY_LIQUIDITY_FILTERS.some((filter) => filter.value === value);

export const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="search-mark">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

export function readOwnedMaterials(
  storageKey: string,
  legacyKey?: string,
): Record<string, string[]> {
  try {
    const stored =
      localStorage.getItem(storageKey) ??
      (legacyKey ? localStorage.getItem(legacyKey) : null);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readAlchemySettings(): Partial<PersistedAlchemySettings> {
  try {
    const stored = localStorage.getItem(ALCHEMY_SETTINGS_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
