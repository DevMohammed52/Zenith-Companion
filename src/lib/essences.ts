import { ALCHEMY_ITEMS } from "@/constants";
import { getSafeMarketPrice, type MarketPriceDatum } from "@/lib/market-pricing";

export const SUPPORTED_ESSENCE_SKILLS = [
  "Woodcutting",
  "Mining",
  "Fishing",
  "Smelting",
  "Cooking",
] as const;

export type EssenceSkillName = (typeof SUPPORTED_ESSENCE_SKILLS)[number];

export type EssenceBuff = {
  efficiency: number;
  experience: number;
};

export type EssencePriceSource = "custom" | "market" | "vendor" | "missing";

export type EssencePriceInfo = {
  value: number;
  source: EssencePriceSource;
  adjusted: boolean;
  rawValue: number;
};

export type EssenceItemRecord = {
  name?: string;
  type?: string;
  quality?: string;
  vendor_price?: number;
  is_tradeable?: boolean;
  effects?: Array<{
    value?: number;
    target?: string;
    attribute?: string;
    value_type?: string;
  }>;
} & Record<string, unknown>;

export type EssenceItemLookup = Record<string, EssenceItemRecord>;
export type EssenceMarketLookup = Record<string, MarketPriceDatum | undefined>;

export type EssenceOption = {
  value: string;
  label: string;
  hint: string;
  quality: string;
  level: number | null;
  tradeable: boolean;
  buff: EssenceBuff;
  price: EssencePriceInfo;
};

export type EssenceSession = {
  active: boolean;
  essenceName: string;
  skill: EssenceSkillName | null;
  buff: EssenceBuff | null;
  price: EssencePriceInfo;
  actionHours: number;
  costPerStart: number;
  costPerHour: number | null;
  needsPrice: boolean;
};

const QUALITY_RANK: Record<string, number> = {
  MYTHIC: 6,
  LEGENDARY: 5,
  EPIC: 4,
  PREMIUM: 3,
  REFINED: 2,
  STANDARD: 1,
};

const EMPTY_PRICE: EssencePriceInfo = {
  value: 0,
  source: "missing",
  adjusted: false,
  rawValue: 0,
};

function normalizeSkill(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizeQuality(value: string | null | undefined) {
  return String(value || "").trim().toUpperCase();
}

function isPositiveNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function baseTradableName(name: string) {
  return name.replace(/\s+\(Untradable\)$/i, "");
}

function findEssenceItem(name: string, items: EssenceItemLookup | null | undefined) {
  if (!items || !name) return null;
  const direct = items[name];
  if (direct) return direct;
  return Object.values(items).find((item) => item?.name === name) || null;
}

function getEssenceName(item: EssenceItemRecord) {
  return typeof item.name === "string" ? item.name : "";
}

function isTradeableEssenceItem(item: EssenceItemRecord | null | undefined) {
  const name = getEssenceName(item || {});
  return Boolean(item && item.is_tradeable !== false && !/\(Untradable\)$/i.test(name));
}

export function isEssenceSupportedSkill(skill: string | null | undefined): skill is EssenceSkillName {
  return SUPPORTED_ESSENCE_SKILLS.includes(skill as EssenceSkillName);
}

export function getEssenceCraftLevel(name: string) {
  const direct = ALCHEMY_ITEMS[name]?.level;
  if (typeof direct === "number") return direct;
  const base = ALCHEMY_ITEMS[baseTradableName(name)]?.level;
  return typeof base === "number" ? base : null;
}

export function getEssenceBuffForSkill(
  essenceName: string,
  skill: string | null | undefined,
  items: EssenceItemLookup | null | undefined,
): EssenceBuff | null {
  if (!essenceName || !isEssenceSupportedSkill(skill)) return null;
  const item = findEssenceItem(essenceName, items);
  if (item?.type !== "ESSENCE_CRYSTAL" || !Array.isArray(item.effects)) return null;
  if (!isTradeableEssenceItem(item)) return null;

  const target = normalizeSkill(skill);
  const buff: EssenceBuff = { efficiency: 0, experience: 0 };
  for (const effect of item.effects) {
    if (normalizeSkill(effect?.target) !== target) continue;
    const value = isPositiveNumber(effect?.value);
    if (!value) continue;

    const attribute = normalizeSkill(effect?.attribute);
    const valueType = normalizeSkill(effect?.value_type);
    if (attribute === "wait_length" || valueType === "efficiency") {
      buff.efficiency += value;
    } else if (attribute === "experience") {
      buff.experience += value;
    }
  }

  return buff.efficiency > 0 || buff.experience > 0 ? buff : null;
}

export function getEssencePrice(
  essenceName: string,
  marketData: EssenceMarketLookup | null | undefined,
  items: EssenceItemLookup | null | undefined,
  customPrices: Record<string, number> | null | undefined,
): EssencePriceInfo {
  if (!essenceName) return EMPTY_PRICE;

  const custom = isPositiveNumber(customPrices?.[essenceName]);
  if (custom) return { value: custom, source: "custom", adjusted: false, rawValue: custom };

  const marketPrice = getSafeMarketPrice(marketData?.[essenceName]);
  if (marketPrice.value > 0) {
    return {
      value: marketPrice.value,
      source: "market",
      adjusted: marketPrice.adjusted,
      rawValue: marketPrice.rawValue,
    };
  }

  return EMPTY_PRICE;
}

export function formatEssenceBuff(buff: EssenceBuff | null | undefined) {
  if (!buff) return "No matching boost";
  const parts = [];
  if (buff.efficiency > 0) parts.push(`+${buff.efficiency}% efficiency`);
  if (buff.experience > 0) parts.push(`+${buff.experience}% EXP`);
  return parts.length ? parts.join(" / ") : "No matching boost";
}

export function getEssenceOptionsForSkill(
  skill: string | null | undefined,
  items: EssenceItemLookup | null | undefined,
  marketData: EssenceMarketLookup | null | undefined,
  customPrices: Record<string, number> | null | undefined,
) {
  if (!items || !isEssenceSupportedSkill(skill)) return [] as EssenceOption[];

  const seen = new Set<string>();
  const options = Object.values(items).flatMap((item) => {
    const name = getEssenceName(item);
    if (!name || seen.has(name)) return [];
    seen.add(name);
    if (item.type !== "ESSENCE_CRYSTAL") return [];
    if (!isTradeableEssenceItem(item)) return [];

    const buff = getEssenceBuffForSkill(name, skill, items);
    if (!buff) return [];

    const price = getEssencePrice(name, marketData, items, customPrices);
    const quality = normalizeQuality(item.quality) || "UNKNOWN";
    const level = getEssenceCraftLevel(name);
    const tradeable = true;
    const priceHint = price.value > 0
      ? `${Math.round(price.value).toLocaleString()}g ${price.source === "market" ? "market" : price.source}`
      : "Needs price/data";
    return [{
      value: name,
      label: name,
      hint: [
        quality !== "UNKNOWN" ? quality : "",
        level !== null ? `Lvl ${level}` : "",
        formatEssenceBuff(buff),
        priceHint,
      ].filter(Boolean).join(" - "),
      quality,
      level,
      tradeable,
      buff,
      price,
    }];
  });

  return options.sort((a, b) => {
    const rarity = (QUALITY_RANK[a.quality] || 0) - (QUALITY_RANK[b.quality] || 0);
    if (rarity !== 0) return rarity;
    const levelA = a.level ?? Number.MAX_SAFE_INTEGER;
    const levelB = b.level ?? Number.MAX_SAFE_INTEGER;
    if (levelA !== levelB) return levelA - levelB;
    return a.label.localeCompare(b.label);
  });
}

export function calculateEssenceSession({
  essenceName,
  skill,
  items,
  marketData,
  customPrices,
  actionHours,
}: {
  essenceName: string;
  skill: string | null | undefined;
  items: EssenceItemLookup | null | undefined;
  marketData: EssenceMarketLookup | null | undefined;
  customPrices: Record<string, number> | null | undefined;
  actionHours: number;
}): EssenceSession {
  const supportedSkill = isEssenceSupportedSkill(skill) ? skill : null;
  const buff = essenceName && supportedSkill
    ? getEssenceBuffForSkill(essenceName, supportedSkill, items)
    : null;
  const active = Boolean(essenceName && supportedSkill && buff);
  const price = active ? getEssencePrice(essenceName, marketData, items, customPrices) : EMPTY_PRICE;
  const safeActionHours = Math.max(0, Number(actionHours) || 0);
  const costPerStart = active ? price.value : 0;
  const costPerHour = active && safeActionHours > 0 && price.value > 0
    ? price.value / safeActionHours
    : null;

  return {
    active,
    essenceName: active ? essenceName : "",
    skill: supportedSkill,
    buff,
    price,
    actionHours: safeActionHours,
    costPerStart,
    costPerHour,
    needsPrice: active && price.value <= 0,
  };
}
