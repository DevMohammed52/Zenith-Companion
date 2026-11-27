import React from "react";
import {
  formatDuration,
  formatGold,
  formatMinutes,
  formatSignedGold,
  getActionLabel,
  getAlchemyItemPrice,
  getCategoryLabel,
  getCustomPrice,
  getSellThroughNote,
  getSignal,
  getTrend,
  makeSearchText,
} from "@/lib/alchemy-profit";
import {
  ALCHEMY_LIQUIDITY_FILTERS,
  ALCHEMY_SETTINGS_STORAGE_KEY,
  ALCHEMY_SORT_KEYS,
  type AlchemyCategory,
  type AlchemyLiquidityFilter,
  type AlchemyRow,
  type AlchemySortKey,
  type LiquiditySignal,
  type PersistedAlchemySettings,
} from "../types";

export {
  formatDuration,
  formatGold,
  formatMinutes,
  formatSignedGold,
  getActionLabel,
  getAlchemyItemPrice,
  getCategoryLabel,
  getCustomPrice,
  getSellThroughNote,
  getSignal,
  getTrend,
  makeSearchText,
};

export const getSignalVariant = (
  signal: LiquiditySignal,
): "success" | "refined" | "warning" | "danger" | "neutral" => {
  if (signal === "LIQUID" || signal === "VENDOR SAFE") return "success";
  if (signal === "STEADY") return "refined";
  if (signal === "THIN" || signal === "VOLUME SWINGS" || signal === "PRICE SWINGS") return "warning";
  if (signal === "SPIKE RISK" || signal === "NO SALES" || signal === "MISSING") return "danger";
  return "neutral";
};

export const getActionVariant = (
  action: AlchemyRow["action"],
): "success" | "refined" | "warning" | "danger" | "neutral" => {
  if (action === "MARKET") return "success";
  if (action === "VENDOR") return "refined";
  return "warning";
};

export const getVisibleAlchemyWarnings = (row: AlchemyRow): string[] => {
  const repeatedBySignal = new Set<string>();
  if (row.signal === "SPIKE RISK") repeatedBySignal.add("Bulk-sale spike risk");
  if (row.signal === "VOLUME SWINGS") repeatedBySignal.add("Volume swings");
  if (row.signal === "THIN") repeatedBySignal.add("Thin market");
  return row.warnings.filter((warning) => !repeatedBySignal.has(warning));
};

export const getAlchemyMatchHint = (row: AlchemyRow, query: string): string => {
  const normalized = query.trim().toLowerCase();
  if (!normalized || row.name.toLowerCase().includes(normalized)) return "";
  const material = row.ingredientCosts.find((ingredient) =>
    ingredient.name.toLowerCase().includes(normalized),
  );
  if (material) return `Uses ${material.name}`;
  if (row.vialName.toLowerCase().includes(normalized)) return `Uses ${row.vialName}`;
  if (`recipe: ${row.name}`.toLowerCase().includes(normalized)) return `Recipe: ${row.name}`;
  if (getActionLabel(row.action).toLowerCase().includes(normalized))
    return `Best path: ${getActionLabel(row.action)}`;
  if (row.signal.toLowerCase().includes(normalized)) return `Liquidity: ${row.signal}`;
  const warning = row.warnings.find((item) => item.toLowerCase().includes(normalized));
  if (warning) return warning;
  return "";
};

export const isAlchemySortKey = (value: unknown): value is AlchemySortKey =>
  typeof value === "string" && ALCHEMY_SORT_KEYS.includes(value as AlchemySortKey);

export const isAlchemyLiquidityFilter = (value: unknown): value is AlchemyLiquidityFilter =>
  typeof value === "string" &&
  ALCHEMY_LIQUIDITY_FILTERS.some((filter) => filter.value === value);

export const isAlchemyCategory = (value: unknown): value is AlchemyCategory =>
  value === "all" || value === "potion" || value === "essence_crystal" || value === "stat_essence";

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
