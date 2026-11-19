import { isNonNegativeNumber, type MythicPriceSource } from "@/lib/mythic-alchemy";

export const formatGold = (value: number, digits = 0): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: digits });

export const formatSignedGold = (value: number, digits = 0): string =>
  `${value >= 0 ? "+" : ""}${formatGold(value, digits)}g`;

export const formatCraftWindow = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Waiting";
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`;
  return `${Math.max(1, Math.round(seconds / 60))}m`;
};

export const formatSource = (source: MythicPriceSource): string => {
  if (source === "custom") return "Card custom";
  if (source === "settings") return "Settings custom";
  if (source === "merchant") return "Merchant buy cost";
  if (source === "vendor") return "Vendor sell fallback";
  if (source === "guarded") return "Guarded market value";
  if (source === "none") return "No price data";
  return `${source.toUpperCase()} market avg`;
};

export function readJson<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const isNumberRecord = (value: unknown): value is Record<string, number> =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.values(value as Record<string, unknown>).every(isNonNegativeNumber);

export const isNestedNumberRecord = (
  value: unknown,
): value is Record<string, Record<string, number>> =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.values(value as Record<string, unknown>).every(isNumberRecord);
