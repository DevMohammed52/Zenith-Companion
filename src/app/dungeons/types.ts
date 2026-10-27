import { getItemTrueValueBreakdown } from "@/lib/ev-logic";
import { getMarketLiquidity, getSafeMarketPrice } from "@/lib/market-pricing";
import { formatGoldUnit } from "@/lib/format";
import {
  calculateHousingBuffs,
  getHousingAvailabilityText,
  getHousingIdleHoursForActivity,
  getProfileBaseIdleActionHours,
} from "@/lib/housing";
import type { useProfiles } from "@/lib/profiles";

export type ReadinessFilter = "all" | "ready" | "blocked";
export type DungeonDropValuationMode = "safe-market" | "vendor" | "manual" | "exclude";

export const DUNGEON_COMPLETIONS_STORAGE_KEY = "zenith_dungeon_completed_runs_v1";
export const EVENT_DUNGEON_COMPLETIONS_STORAGE_KEY = "zenith_event_dungeon_completion_count_v1";
export const DUNGEON_ITEM_MODIFIERS_STORAGE_KEY = "zenith_dungeon_item_modifiers_v1";
export const EMPTY_DUNGEON_ITEM_MODIFIERS = { efficiencyItem: "", magicFindItem: "" };
export type DungeonItemModifierSelections = typeof EMPTY_DUNGEON_ITEM_MODIFIERS;

export type DungeonItemModifier = {
  name: string;
  type: string;
  quality: string;
  imageUrl: string;
  efficiency: number;
  magicFind: number;
  durationMs: number;
  isTradeable: boolean;
};

export const DROP_VALUATION_OPTIONS: Array<{ value: DungeonDropValuationMode; label: string }> = [
  { value: "safe-market", label: "Modeled market" },
  { value: "vendor", label: "Vendor" },
  { value: "manual", label: "Manual" },
  { value: "exclude", label: "Exclude" },
];

export const DROP_VALUATION_LABELS: Record<DungeonDropValuationMode, string> = {
  "safe-market": "Modeled market",
  vendor: "Vendor",
  manual: "Manual",
  exclude: "Excluded",
};

export const VALUE_PATH_LABELS: Record<string, string> = {
  market: "Sell on market",
  vendor: "Sell to vendor",
  chest_ev: "Open alchemy chest",
  recipe_craft: "Crafted-output value",
  manual: "Manual value",
  excluded: "Excluded",
  missing: "Missing price",
};

export const EQUIPMENT_DROP_PATTERN = /\b(armor|amulet|bow|breastplate|boots|buckler|chestplate|crown|cuirass|gauntlets|gloves|greaves|helm|helmet|legplates|plate|ring|shield|shinplates|soulplate|staff|striders|sword|treads)\b/i;
export const POTION_DROP_PATTERN = /\b(elixir|infusion|potion)\b/i;

export function getRecipeOutputName(item: any): string {
  return String(item?.recipe?.result?.item_name || item?.recipe?.result?.name || "").trim();
}

export function isHighTierQuality(quality: unknown): boolean {
  const normalized = String(quality || "").toUpperCase();
  return normalized === "LEGENDARY" || normalized === "MYTHIC";
}

export function isMarketSensitiveDungeonDrop(itemName: string, item: any): boolean {
  const type = String(item?.type || "").toUpperCase();
  const quality = String(item?.quality || "").toUpperCase();
  const text = `${itemName} ${item?.description || ""} ${getRecipeOutputName(item)} ${type}`;
  const highTier = isHighTierQuality(quality);
  const isGearRecipe = type === "RECIPE" && highTier && EQUIPMENT_DROP_PATTERN.test(text);
  const isDirectGear = highTier && EQUIPMENT_DROP_PATTERN.test(text) && type !== "CHEST";
  const isMythicPotionStyle = quality === "MYTHIC" && POTION_DROP_PATTERN.test(text);
  return isGearRecipe || isDirectGear || isMythicPotionStyle;
}

export function resolveDungeonDropValue(
  itemName: string,
  marketData: any,
  allItemsDb: any,
  evOptions: any,
  valuationMode: DungeonDropValuationMode,
  manualValue: number,
  depth = 0,
): any {
  const item = allItemsDb?.[itemName];
  const marketItem = marketData?.[itemName];
  const marketPriceInfo = getSafeMarketPrice(marketItem);
  const marketLiquidity = getMarketLiquidity(marketItem);
  let valueBreakdown: any = getItemTrueValueBreakdown(itemName, marketData, allItemsDb, depth, evOptions);
  let trueValue = Number(valueBreakdown.value || 0);
  const marketSensitive = isMarketSensitiveDungeonDrop(itemName, item);
  let valuationModeApplied = false;
  let chestAdjusted = false;
  let manualMissingValue = false;
  let sensitiveCount = marketSensitive ? 1 : 0;
  let manualMissingCount = 0;
  let valuationNote = marketSensitive ? `${marketLiquidity.label}. Check listings before treating this as fast-sale value.` : "";

  if (valuationMode !== "safe-market" && valueBreakdown.chest?.drops?.length && depth < 3) {
    const adjustedDrops = valueBreakdown.chest.drops.map((chestDrop: any) => {
      const adjusted = resolveDungeonDropValue(
        chestDrop.name,
        marketData,
        allItemsDb,
        evOptions,
        valuationMode,
        manualValue,
        depth + 1,
      );
      const chance = Number(chestDrop.chance || 0);
      const quantity = Number(chestDrop.quantity || 1);
      const expectedValue = (chance / 100) * quantity * adjusted.trueValue;
      chestAdjusted = chestAdjusted || adjusted.valuationModeApplied || adjusted.chestAdjusted;
      sensitiveCount += Number(adjusted.sensitiveCount || 0);
      manualMissingCount += Number(adjusted.manualMissingCount || 0);
      return {
        ...chestDrop,
        value: adjusted.trueValue,
        expectedValue,
        path: adjusted.valueBreakdown?.chosenPath || chestDrop.path,
        valuationModeApplied: adjusted.valuationModeApplied,
        valuationLabel: adjusted.valuationLabel,
      };
    });
    const chestExpectedValue = adjustedDrops.reduce((sum: number, chestDrop: any) => sum + Number(chestDrop.expectedValue || 0), 0);
    const vendorNet = Number(valueBreakdown.vendorNet || 0);
    trueValue = Math.max(chestExpectedValue, vendorNet);
    valueBreakdown = {
      ...valueBreakdown,
      value: trueValue,
      chosenPath: chestExpectedValue >= vendorNet ? "chest_ev" : "vendor",
      chest: {
        expectedValue: chestExpectedValue,
        drops: adjustedDrops,
      },
    };
  }

  if (marketSensitive && valuationMode !== "safe-market") {
    valuationModeApplied = true;
    if (valuationMode === "vendor") {
      trueValue = Math.max(0, Number(valueBreakdown.vendorNet || item?.vendor_price || marketItem?.vendor_price || 0));
      valueBreakdown = { ...valueBreakdown, value: trueValue, chosenPath: "vendor" };
      valuationNote = "Vendor value is used for this sensitive drop.";
    } else if (valuationMode === "manual") {
      trueValue = manualValue;
      manualMissingValue = manualValue <= 0;
      manualMissingCount += manualMissingValue ? 1 : 0;
      valueBreakdown = { ...valueBreakdown, value: trueValue, chosenPath: "manual" };
      valuationNote = manualMissingValue ? "Enter a manual value to include this drop." : `${formatGoldUnit(manualValue)} per drop is used.`;
    } else {
      trueValue = 0;
      valueBreakdown = { ...valueBreakdown, value: trueValue, chosenPath: "excluded" };
      valuationNote = "This sensitive drop is excluded from EV.";
    }
  }

  return {
    trueValue,
    marketPrice: marketPriceInfo.value,
    marketPriceInfo,
    marketLiquidity,
    marketSensitive,
    sensitiveCount,
    manualMissingCount,
    valueBreakdown,
    valuationModeApplied,
    chestAdjusted,
    valuationLabel: DROP_VALUATION_LABELS[valuationMode],
    valuationNote,
    manualMissingValue,
  };
}

export function getValuePathLabel(path?: string): string {
  return VALUE_PATH_LABELS[path || ""] || "Value";
}

export function getDungeonLengthMinutes(dungeon: any): number {
  if (Number.isFinite(Number(dungeon.length_minutes))) return Number(dungeon.length_minutes);
  if (Number.isFinite(Number(dungeon.length))) return Math.round(Number(dungeon.length) / 60000);
  if (Number.isFinite(Number(dungeon.length_ms))) return Math.round(Number(dungeon.length_ms) / 60000);
  return 0;
}

export function getDungeonKey(dungeon: any): string {
  return String(dungeon?.id || dungeon?.name || "").trim();
}

export function getReadinessText(row: any, hasProfile: boolean): string {
  if (!hasProfile) return "No profile";
  if (row.profileReady) return "Ready";
  if (row.statGap > 0 && row.dungeoneeringGap > 0) return `Need ${row.statGap} stats +${row.dungeoneeringGap} Dungeoneering`;
  if (row.statGap > 0) return `Need ${row.statGap} stats`;
  return `Dungeoneering +${row.dungeoneeringGap}`;
}

export function isSpecialEquipmentModifier(item: { type?: string }): boolean {
  return String(item.type || "").toUpperCase() === "SPECIAL";
}

export function getTradeableVariantKey(name: string): string {
  return name.replace(/\s*\(Untradable\)\s*$/i, "").trim().toLowerCase();
}

export function removeUntradeableDuplicateModifiers(options: DungeonItemModifier[]): DungeonItemModifier[] {
  const tradeableVariantKeys = new Set(
    options
      .filter((item) => item.isTradeable)
      .map((item) => getTradeableVariantKey(item.name)),
  );
  return options.filter((item) => item.isTradeable || !tradeableVariantKeys.has(getTradeableVariantKey(item.name)));
}

export function getTradeableTemporaryModifiers(options: DungeonItemModifier[]): DungeonItemModifier[] {
  return removeUntradeableDuplicateModifiers(options).filter((item) => item.isTradeable);
}

export function getOptionalNumber(value: number | string | null | undefined): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeCompletionCount(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function getConfirmedDungeonItemModifiers(allItemsDb: any): DungeonItemModifier[] {
  const records = Object.values(allItemsDb || {});
  return records
    .map((item: any) => {
      const effects = Array.isArray(item?.effects)
        ? item.effects.filter((effect: any) => String(effect?.target || "").toLowerCase() === "dungeon")
        : [];
      if (effects.length === 0) return null;
      const efficiency = effects.reduce((total: number, effect: any) => {
        const attribute = String(effect?.attribute || "").toLowerCase();
        const valueType = String(effect?.value_type || "").toLowerCase();
        return attribute === "wait_length" || valueType === "efficiency"
          ? total + Number(effect?.value || 0)
          : total;
      }, 0);
      const magicFind = effects.reduce((total: number, effect: any) => {
        const attribute = String(effect?.attribute || "").toLowerCase();
        return attribute === "magic_find" ? total + Number(effect?.value || 0) : total;
      }, 0);
      if (efficiency <= 0 && magicFind <= 0) return null;
      return {
        name: String(item?.name || ""),
        type: String(item?.type || "ITEM"),
        quality: String(item?.quality || "UNKNOWN"),
        imageUrl: String(item?.image_url || ""),
        efficiency,
        magicFind,
        durationMs: effects.reduce((max: number, effect: any) => Math.max(max, Number(effect?.length || 0)), 0),
        isTradeable: item?.is_tradeable !== false,
      };
    })
    .filter((item): item is DungeonItemModifier => Boolean(item?.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getStoredDungeonModifierSelections(payload: string | null): DungeonItemModifierSelections {
  if (!payload) return { ...EMPTY_DUNGEON_ITEM_MODIFIERS };
  try {
    const parsed = JSON.parse(payload);
    return {
      efficiencyItem: typeof parsed?.efficiencyItem === "string" ? parsed.efficiencyItem : "",
      magicFindItem: typeof parsed?.magicFindItem === "string" ? parsed.magicFindItem : "",
    };
  } catch {
    return { ...EMPTY_DUNGEON_ITEM_MODIFIERS };
  }
}

export function formatDungeonModifierDuration(durationMs: number): string {
  if (!durationMs) return "Passive";
  const minutes = Math.max(1, Math.round(durationMs / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function getDungeonItemModifierSummary(option: DungeonItemModifier): string {
  const parts = [];
  if (option.efficiency > 0) parts.push(`+${option.efficiency}% speed`);
  if (option.magicFind > 0) parts.push(`+${option.magicFind}% MF`);
  parts.push(formatDungeonModifierDuration(option.durationMs));
  return parts.join(" - ");
}

export function getDungeonRowLabel(row: any, hasProfile: boolean): string {
  const locationName = row.location?.name || "Unknown location";
  const readiness = getReadinessText(row, hasProfile);
  const duration = Math.round(Number(row.effectiveDurationMins || row.durationMins || 0));
  const profit = `${Number(row.netProfitPerRun || 0) >= 0 ? "+" : ""}${Math.round(Number(row.netProfitPerRun || 0)).toLocaleString()}g`;
  const shardValue = row.shardValue > 0 ? formatGoldUnit(row.shardValue) : "no shard value";
  return `${row.name}, level ${row.level_required || 0}, ${duration} minutes, ${row.dropsCount || 0} drops, ${locationName}, ${readiness}, ${profit} EV per run, ${shardValue} per shard. Open dungeon details.`;
}

export function getHousingDungeonHoursForDungeon(profile: ReturnType<typeof useProfiles>["activeProfile"], dungeon: any): number {
  if (!profile) return 0;
  const dungeonLocation = String(dungeon?.location?.name || dungeon?.location || "").trim();
  return getHousingIdleHoursForActivity(profile.housing, "dungeon", dungeonLocation, { profileClassName: profile.className });
}

export function getProfileIdleActionHoursForDungeon(
  profile: ReturnType<typeof useProfiles>["activeProfile"],
  dungeon: any,
  isMembership = false,
): number {
  return getProfileBaseIdleActionHours(profile, isMembership) + getHousingDungeonHoursForDungeon(profile, dungeon);
}

export function getHousingDungeonScopeText(profile: ReturnType<typeof useProfiles>["activeProfile"]): string {
  if (!profile) return "Select a profile.";
  const summary = calculateHousingBuffs(profile.housing, { profileClassName: profile.className });
  const hours = summary.idleHours.dungeon;
  return getHousingAvailabilityText(summary, hours, "dungeon housing bonus");
}

export interface ValuedDungeonDrop {
  name: string;
  chance: number;
  quantity?: number;
  quality?: string;
  image_url?: string;
  trueValue: number;
  marketPrice: number;
  expectedVal: number;
  valueBreakdown: any;
  marketPriceInfo: any;
  marketLiquidity: any;
  marketSensitive: boolean;
  valuationModeApplied: boolean;
  chestAdjusted: boolean;
  valuationLabel: string;
  valuationNote: string;
  manualMissingValue: boolean;
  baseChancePercent: number;
  adjustedChancePercent: number;
}

export interface ValuedDungeonRow {
  id?: number | string;
  name: string;
  image_url?: string;
  difficulty?: number;
  level_required?: number;
  cost?: number;
  shards?: number;
  completion_requirement?: number;
  location?: { name?: string; [key: string]: any };
  loot?: any[];
  experience?: { skills?: { combat?: number; dungeoneering?: number } };
  ev: number;
  lootEv: number;
  shardCount: number;
  shardValue: number;
  shardEv: number;
  durationMins: number;
  durationHours: number;
  effectiveDurationMins: number;
  effectiveDurationHours: number;
  entryCost: number;
  netProfitPerRun: number;
  runsToDrop: number;
  requiredDungeonStats: number;
  profileDungeonStats: number;
  profileDungeoneering: number;
  profileReady: boolean;
  statGap: number;
  dungeoneeringGap: number;
  dropsCount: number;
  lootDetails: ValuedDungeonDrop[];
  playtimeHours: number;
  idleActionLimitHours: number;
  housingDungeonHours: number;
  runsInIdleAction: number;
  dailyRunsByPlaytime: number;
  actionsNeededForDailyRuns: number;
  idleActionBaseHours: number;
  idleActionEffectiveHours: number;
  idleActionCost: number;
  idleActionNetProfit: number;
  idleActionGapHours: number;
  completedRuns: number;
  completionRequirement: number;
  completionMagicFindActive: boolean;
  completedDungeonBonus: number;
  listedCompletionMagicFindBonus: number;
  eventCompletionMagicFindBonus: number;
  dropValuationMode: DungeonDropValuationMode;
  marketSensitiveDropCount: number;
  manualMissingValueCount: number;
  baseDungeonEfficiency: number;
  dungeonEfficiency: number;
  itemEfficiencyBonus: number;
  dungeonEfficiencyItemName: string;
  baseDungeonMagicFind: number;
  dungeonMagicFind: number;
  itemMagicFindBonus: number;
  equippedSpecialMagicFindBonus: number;
  equippedSpecialName: string;
  dungeonMagicFindItemName: string;
  includeMagicFindEv: boolean;
  combatExp: number;
  dungeoneeringExp: number;
  [key: string]: any;
}
