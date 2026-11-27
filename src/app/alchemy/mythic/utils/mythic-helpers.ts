import { formatDuration, formatGold, formatSignedGold } from "@/lib/alchemy-profit";
import { isNonNegativeNumber, type MythicBestPath, type MythicPriceSource } from "@/lib/mythic-alchemy";
import type { MarketLiquidityInfo } from "@/lib/market-pricing";
import type { BadgeVariant } from "@/components/ui";
import { DEFAULT_MYTHIC_LOADOUT, type PersistedMythicLoadout } from "../types";

export { formatDuration, formatGold, formatSignedGold };

export const formatCraftWindow = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Waiting";
  return formatDuration(seconds);
};

export const formatSource = (source: MythicPriceSource): string => {
  if (source === "custom") return "Custom override";
  if (source === "settings") return "Settings price";
  if (source === "merchant") return "Merchant buy";
  if (source === "vendor") return "Vendor fallback";
  if (source === "guarded") return "Guarded market";
  if (source === "none") return "No price data";
  return `${source.toUpperCase()} avg`;
};

export const getBestPathLabel = (path: MythicBestPath): string => {
  if (path === "VENDOR") return "Vendor";
  if (path === "CUSTOM") return "Custom Market";
  return "Market";
};

export const getBestPathVariant = (path: MythicBestPath): BadgeVariant => {
  if (path === "VENDOR") return "success";
  if (path === "CUSTOM") return "epic";
  return "refined";
};

export const getLiquidityBadgeVariant = (tone: MarketLiquidityInfo["tone"]): BadgeVariant => {
  if (tone === "active") return "success";
  if (tone === "steady") return "refined";
  if (tone === "thin") return "warning";
  return "danger";
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

export function readMythicLoadoutSettings(key: string): PersistedMythicLoadout {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_MYTHIC_LOADOUT;
    const parsed = JSON.parse(raw) as Partial<PersistedMythicLoadout>;
    return {
      classOverride:
        parsed.classOverride === "alchemist" ||
        parsed.classOverride === "standard" ||
        parsed.classOverride === "penalty"
          ? parsed.classOverride
          : "profile",
      conquestOverride: typeof parsed.conquestOverride === "string" ? parsed.conquestOverride : "profile",
      barteringOverride:
        typeof parsed.barteringOverride === "number" && Number.isFinite(parsed.barteringOverride)
          ? Math.max(0, Math.min(20, parsed.barteringOverride))
          : "",
      customSessionHours:
        typeof parsed.customSessionHours === "number" && Number.isFinite(parsed.customSessionHours)
          ? Math.max(0.5, Math.min(24, parsed.customSessionHours))
          : "",
      ascensionBuffIds: Array.isArray(parsed.ascensionBuffIds)
        ? parsed.ascensionBuffIds.filter((id): id is string => typeof id === "string").slice(0, 5)
        : [],
      energizingPoolExp:
        typeof parsed.energizingPoolExp === "number" && Number.isFinite(parsed.energizingPoolExp)
          ? Math.max(0, Math.min(50, parsed.energizingPoolExp))
          : 0,
      membershipOverride:
        typeof parsed.membershipOverride === "boolean" ? parsed.membershipOverride : null,
    };
  } catch {
    return DEFAULT_MYTHIC_LOADOUT;
  }
}
