"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Castle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  ExternalLink,
  MapPin,
  PackageOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { getItemTrueValueBreakdown } from "@/lib/ev-logic";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { getMarketLiquidity, getSafeMarketPrice } from "@/lib/market-pricing";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { usePreferences } from "@/lib/preferences";
import { getProfileDungeonStatTotal, useProfiles } from "@/lib/profiles";
import {
  getItemEffectBonus,
  getProfileBarteringBoost,
  getProfileEquippedSpecialItem,
  type ProfileItemRecord,
} from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { useModalA11y } from "@/lib/use-modal-a11y";
import {
  calculateHousingBuffs,
  formatHours,
  getHousingAvailabilityText,
  getHousingIdleHoursForActivity,
  getProfileBaseIdleActionHours,
} from "@/lib/housing";
import MobileSortControls from "@/components/MobileSortControls";
import LoreThreadPanel from "@/components/LoreThreadPanel";
import { getLoreHintsForNames } from "@/lib/lore-links";

type ReadinessFilter = "all" | "ready" | "blocked";
type DungeonDropValuationMode = "safe-market" | "vendor" | "manual" | "exclude";

const DUNGEON_COMPLETIONS_STORAGE_KEY = "zenith_dungeon_completed_runs_v1";
const EVENT_DUNGEON_COMPLETIONS_STORAGE_KEY = "zenith_event_dungeon_completion_count_v1";
const DUNGEON_ITEM_MODIFIERS_STORAGE_KEY = "zenith_dungeon_item_modifiers_v1";
const EMPTY_DUNGEON_ITEM_MODIFIERS = { efficiencyItem: "", magicFindItem: "" };
type DungeonItemModifierSelections = typeof EMPTY_DUNGEON_ITEM_MODIFIERS;
type DungeonItemModifier = {
  name: string;
  type: string;
  quality: string;
  imageUrl: string;
  efficiency: number;
  magicFind: number;
  durationMs: number;
  isTradeable: boolean;
};
const DROP_VALUATION_OPTIONS: Array<{ value: DungeonDropValuationMode; label: string }> = [
  { value: "safe-market", label: "Modeled market" },
  { value: "vendor", label: "Vendor" },
  { value: "manual", label: "Manual" },
  { value: "exclude", label: "Exclude" },
];
const DROP_VALUATION_LABELS: Record<DungeonDropValuationMode, string> = {
  "safe-market": "Modeled market",
  vendor: "Vendor",
  manual: "Manual",
  exclude: "Excluded",
};

const formatGold = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value).toLocaleString()}g`;
const formatPlainGold = (value: number) => `${Math.round(value).toLocaleString()}g`;
const formatNumber = (value: number) => Number.isFinite(value) ? Math.round(value).toLocaleString() : "-";

const VALUE_PATH_LABELS: Record<string, string> = {
  market: "Sell on market",
  vendor: "Sell to vendor",
  chest_ev: "Open alchemy chest",
  recipe_craft: "Crafted-output value",
  manual: "Manual value",
  excluded: "Excluded",
  missing: "Missing price",
};

const EQUIPMENT_DROP_PATTERN = /\b(armor|amulet|bow|breastplate|boots|buckler|chestplate|crown|cuirass|gauntlets|gloves|greaves|helm|helmet|legplates|plate|ring|shield|shinplates|soulplate|staff|striders|sword|treads)\b/i;
const POTION_DROP_PATTERN = /\b(elixir|infusion|potion)\b/i;

function getRecipeOutputName(item: any) {
  return String(item?.recipe?.result?.item_name || item?.recipe?.result?.name || "").trim();
}

function isHighTierQuality(quality: unknown) {
  const normalized = String(quality || "").toUpperCase();
  return normalized === "LEGENDARY" || normalized === "MYTHIC";
}

function isMarketSensitiveDungeonDrop(itemName: string, item: any) {
  const type = String(item?.type || "").toUpperCase();
  const quality = String(item?.quality || "").toUpperCase();
  const text = `${itemName} ${item?.description || ""} ${getRecipeOutputName(item)} ${type}`;
  const highTier = isHighTierQuality(quality);
  const isGearRecipe = type === "RECIPE" && highTier && EQUIPMENT_DROP_PATTERN.test(text);
  const isDirectGear = highTier && EQUIPMENT_DROP_PATTERN.test(text) && type !== "CHEST";
  const isMythicPotionStyle = quality === "MYTHIC" && POTION_DROP_PATTERN.test(text);
  return isGearRecipe || isDirectGear || isMythicPotionStyle;
}

function resolveDungeonDropValue(
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
      valuationNote = manualMissingValue ? "Enter a manual value to include this drop." : `${formatPlainGold(manualValue)} per drop is used.`;
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

function getValuePathLabel(path?: string) {
  return VALUE_PATH_LABELS[path || ""] || "Value";
}

function getDungeonLengthMinutes(dungeon: any) {
  if (Number.isFinite(Number(dungeon.length_minutes))) return Number(dungeon.length_minutes);
  if (Number.isFinite(Number(dungeon.length))) return Math.round(Number(dungeon.length) / 60000);
  if (Number.isFinite(Number(dungeon.length_ms))) return Math.round(Number(dungeon.length_ms) / 60000);
  return 0;
}

function getDungeonKey(dungeon: any) {
  return String(dungeon?.id || dungeon?.name || "").trim();
}

function getReadinessText(row: any, hasProfile: boolean) {
  if (!hasProfile) return "No profile";
  if (row.profileReady) return "Ready";
  if (row.statGap > 0 && row.dungeoneeringGap > 0) return `Need ${row.statGap} stats +${row.dungeoneeringGap} Dungeoneering`;
  if (row.statGap > 0) return `Need ${row.statGap} stats`;
  return `Dungeoneering +${row.dungeoneeringGap}`;
}

function isSpecialEquipmentModifier(item: { type?: string }) {
  return String(item.type || "").toUpperCase() === "SPECIAL";
}

function getTradeableVariantKey(name: string) {
  return name.replace(/\s*\(Untradable\)\s*$/i, "").trim().toLowerCase();
}

function removeUntradeableDuplicateModifiers(options: DungeonItemModifier[]) {
  const tradeableVariantKeys = new Set(
    options
      .filter((item) => item.isTradeable)
      .map((item) => getTradeableVariantKey(item.name)),
  );
  return options.filter((item) => item.isTradeable || !tradeableVariantKeys.has(getTradeableVariantKey(item.name)));
}

function getTradeableTemporaryModifiers(options: DungeonItemModifier[]) {
  return removeUntradeableDuplicateModifiers(options).filter((item) => item.isTradeable);
}

function getOptionalNumber(value: number | "") {
  return value === "" ? null : Number(value);
}

function normalizeCompletionCount(value: unknown) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function getConfirmedDungeonItemModifiers(allItemsDb: any): DungeonItemModifier[] {
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

function getStoredDungeonModifierSelections(payload: string | null): DungeonItemModifierSelections {
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

function formatDungeonModifierDuration(durationMs: number) {
  if (!durationMs) return "Passive";
  const minutes = Math.max(1, Math.round(durationMs / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function getDungeonItemModifierSummary(option: DungeonItemModifier) {
  const parts = [];
  if (option.efficiency > 0) parts.push(`+${option.efficiency}% speed`);
  if (option.magicFind > 0) parts.push(`+${option.magicFind}% MF`);
  parts.push(formatDungeonModifierDuration(option.durationMs));
  return parts.join(" - ");
}

function getHousingDungeonHoursForDungeon(profile: ReturnType<typeof useProfiles>["activeProfile"], dungeon: any) {
  if (!profile) return 0;
  const dungeonLocation = String(dungeon?.location?.name || dungeon?.location || "").trim();
  return getHousingIdleHoursForActivity(profile.housing, "dungeon", dungeonLocation, { profileClassName: profile.className });
}

function getProfileIdleActionHoursForDungeon(profile: ReturnType<typeof useProfiles>["activeProfile"], dungeon: any) {
  return getProfileBaseIdleActionHours(profile) + getHousingDungeonHoursForDungeon(profile, dungeon);
}

function getHousingDungeonScopeText(profile: ReturnType<typeof useProfiles>["activeProfile"]) {
  if (!profile) return "Select a profile.";
  const summary = calculateHousingBuffs(profile.housing, { profileClassName: profile.className });
  const hours = summary.idleHours.dungeon;
  return getHousingAvailabilityText(summary, hours, "dungeon housing bonus");
}

function DungeonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { marketData, staticData, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const [selectedDungeonKey, setSelectedDungeonKey] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<string>("netProfitPerRun");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("all");
  const [minimumProfit, setMinimumProfit] = useState<number | "">("");
  const [dungeonEfficiency, setDungeonEfficiency] = useState<number | "">("");
  const [dungeonMagicFind, setDungeonMagicFind] = useState<number | "">("");
  const [dropValuationMode, setDropValuationMode] = useState<DungeonDropValuationMode>("safe-market");
  const [manualSensitiveDropValue, setManualSensitiveDropValue] = useState<number | "">("");
  const [completedRunsByDungeon, setCompletedRunsByDungeon] = useState<Record<string, number | "">>({});
  const [eventDungeonCompletionCount, setEventDungeonCompletionCount] = useState<number | "">("");
  const [dungeonItemModifierSelections, setDungeonItemModifierSelections] = useState<DungeonItemModifierSelections>(EMPTY_DUNGEON_ITEM_MODIFIERS);
  const [includeMagicFindEv, setIncludeMagicFindEv] = useState(false);
  const completionsStorageKey = useMemo(
    () => getProfileStorageKey(DUNGEON_COMPLETIONS_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );
  const eventCompletionsStorageKey = useMemo(
    () => getProfileStorageKey(EVENT_DUNGEON_COMPLETIONS_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );
  const itemModifiersStorageKey = useMemo(
    () => getProfileStorageKey(DUNGEON_ITEM_MODIFIERS_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );

  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) setSearchTerm(searchParam);
  }, [searchParams]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDungeonKey(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(completionsStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(DUNGEON_COMPLETIONS_STORAGE_KEY));
      if (stored) setCompletedRunsByDungeon(JSON.parse(stored));
      else setCompletedRunsByDungeon({});
    } catch {}
  }, [activeProfile?.id, completionsStorageKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(completionsStorageKey, JSON.stringify(completedRunsByDungeon));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [completedRunsByDungeon, completionsStorageKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(eventCompletionsStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(EVENT_DUNGEON_COMPLETIONS_STORAGE_KEY));
      if (!stored) {
        setEventDungeonCompletionCount("");
        return;
      }
      const parsed = normalizeCompletionCount(JSON.parse(stored));
      setEventDungeonCompletionCount(parsed > 0 ? parsed : "");
    } catch {
      setEventDungeonCompletionCount("");
    }
  }, [activeProfile?.id, eventCompletionsStorageKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(eventCompletionsStorageKey, JSON.stringify(normalizeCompletionCount(eventDungeonCompletionCount)));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [eventDungeonCompletionCount, eventCompletionsStorageKey]);

  useEffect(() => {
    const stored = localStorage.getItem(itemModifiersStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(DUNGEON_ITEM_MODIFIERS_STORAGE_KEY));
    setDungeonItemModifierSelections(getStoredDungeonModifierSelections(stored));
  }, [activeProfile?.id, itemModifiersStorageKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(itemModifiersStorageKey, JSON.stringify(dungeonItemModifierSelections));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [dungeonItemModifierSelections, itemModifiersStorageKey]);

  const staticDungeons = staticData?.dungeons;
  const listedCompletionMagicFindBonus = useMemo(() => {
    if (!staticDungeons) return 0;
    return (staticDungeons || []).filter((dungeon: any) => {
      const requirement = Number(dungeon.completion_requirement || 0);
      const completed = Number(completedRunsByDungeon[getDungeonKey(dungeon)] || 0);
      return requirement > 0 && completed >= requirement;
    }).length;
  }, [completedRunsByDungeon, staticDungeons]);
  const eventCompletionMagicFindBonus = useMemo(
    () => normalizeCompletionCount(eventDungeonCompletionCount),
    [eventDungeonCompletionCount],
  );
  const completionMagicFindBonus = listedCompletionMagicFindBonus + eventCompletionMagicFindBonus;
  const dungeonItemModifierOptions = useMemo(() => getConfirmedDungeonItemModifiers(allItemsDb), [allItemsDb]);
  const itemByName = useMemo(() => (allItemsDb || {}) as Record<string, ProfileItemRecord>, [allItemsDb]);
  const equippedDungeonSpecial = useMemo(
    () => getProfileEquippedSpecialItem(activeProfile, itemByName),
    [activeProfile, itemByName],
  );
  const equippedDungeonSpecialMagicFind = useMemo(
    () => getItemEffectBonus(equippedDungeonSpecial, "dungeon", "magic_find"),
    [equippedDungeonSpecial],
  );
  const dungeonEfficiencyItemOptions = useMemo(
    () => getTradeableTemporaryModifiers(dungeonItemModifierOptions.filter((item) => item.efficiency > 0))
      .sort((a, b) => b.efficiency - a.efficiency || a.name.localeCompare(b.name)),
    [dungeonItemModifierOptions],
  );
  const dungeonMagicFindItemOptions = useMemo(
    () => getTradeableTemporaryModifiers(dungeonItemModifierOptions)
      .filter((item) => item.magicFind > 0 && !isSpecialEquipmentModifier(item))
      .sort((a, b) => b.magicFind - a.magicFind || a.name.localeCompare(b.name)),
    [dungeonItemModifierOptions],
  );
  const selectedDungeonEfficiencyItem = useMemo(
    () => dungeonEfficiencyItemOptions.find((item) => item.name === dungeonItemModifierSelections.efficiencyItem) || null,
    [dungeonEfficiencyItemOptions, dungeonItemModifierSelections.efficiencyItem],
  );
  const selectedDungeonMagicFindItem = useMemo(
    () => dungeonMagicFindItemOptions.find((item) => item.name === dungeonItemModifierSelections.magicFindItem) || null,
    [dungeonMagicFindItemOptions, dungeonItemModifierSelections.magicFindItem],
  );
  const itemEfficiencyBonus = Number(selectedDungeonEfficiencyItem?.efficiency || 0);
  const itemMagicFindBonus = Number(selectedDungeonMagicFindItem?.magicFind || 0);

  useEffect(() => {
    setDungeonItemModifierSelections((current) => {
      const next = { ...current };
      if (next.efficiencyItem && !dungeonEfficiencyItemOptions.some((item) => item.name === next.efficiencyItem)) {
        next.efficiencyItem = "";
      }
      if (next.magicFindItem && !dungeonMagicFindItemOptions.some((item) => item.name === next.magicFindItem)) {
        next.magicFindItem = "";
      }
      return next.efficiencyItem === current.efficiencyItem && next.magicFindItem === current.magicFindItem
        ? current
        : next;
    });
  }, [dungeonEfficiencyItemOptions, dungeonMagicFindItemOptions]);

  const rows = useMemo(() => {
    if (!staticData?.dungeons || !marketData || !allItemsDb) return [];
    const calculated = [];
    const evOptions = {
      customPrices: preferences.customPrices,
      marketTaxMultiplier: preferences.membership ? 0.88 : 0.85,
      barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
    };
    const profileDungeonStats = getProfileDungeonStatTotal(activeProfile);
    const profileDungeoneering = Number(activeProfile?.levels.dungeoneering || 0);
    const playtimeHours = Math.max(0, Number(activeProfile?.timers.activeHours || 0));
    const manualEfficiency = getOptionalNumber(dungeonEfficiency);
    const manualMagicFind = getOptionalNumber(dungeonMagicFind);
    const manualDropValue = Math.max(0, getOptionalNumber(manualSensitiveDropValue) ?? 0);
    const baseEfficiency = Math.max(0, manualEfficiency ?? Number(activeProfile?.efficiency.dungeon || 0));
    const baseMagicFind = Math.max(0, manualMagicFind ?? Number(activeProfile?.magicFind.dungeon || 0));
    const efficiency = Math.max(0, baseEfficiency + itemEfficiencyBonus);
    const totalMagicFind = Math.max(
      0,
      baseMagicFind + completionMagicFindBonus + itemMagicFindBonus + equippedDungeonSpecialMagicFind,
    );

    for (const dungeon of staticData.dungeons) {
      let lootEv = 0;
      let combinedDropChance = 0;
      let marketSensitiveDropCount = 0;
      let manualMissingValueCount = 0;
      const entryCost = Number(dungeon.cost || 0);
      const lootDetails = (dungeon.loot || []).map((drop: any) => {
        const dropValue = resolveDungeonDropValue(drop.name, marketData, allItemsDb, evOptions, dropValuationMode, manualDropValue);
        const trueValue = dropValue.trueValue;
        const marketPriceInfo = dropValue.marketPriceInfo;
        const marketPrice = dropValue.marketPrice;
        const baseChancePercent = Number(drop.chance) || 0;
        const adjustedChancePercent = includeMagicFindEv
          ? Math.min(100, baseChancePercent * (1 + totalMagicFind / 100))
          : baseChancePercent;
        const dropChance = adjustedChancePercent / 100;
        const expectedVal = dropChance * (Number(drop.quantity) || 1) * trueValue;
        lootEv += expectedVal;
        combinedDropChance += dropChance;
        marketSensitiveDropCount += Number(dropValue.sensitiveCount || 0);
        manualMissingValueCount += Number(dropValue.manualMissingCount || 0);
        return {
          ...drop,
          trueValue,
          marketPrice,
          expectedVal,
          valueBreakdown: dropValue.valueBreakdown,
          marketPriceInfo,
          marketLiquidity: dropValue.marketLiquidity,
          marketSensitive: dropValue.marketSensitive,
          valuationModeApplied: dropValue.valuationModeApplied,
          chestAdjusted: dropValue.chestAdjusted,
          valuationLabel: dropValue.valuationLabel,
          valuationNote: dropValue.valuationNote,
          manualMissingValue: dropValue.manualMissingValue,
          baseChancePercent,
          adjustedChancePercent,
        };
      });
      const shardCount = Number(dungeon.shards || 0);
      const shardValuePerUnit = shardCount > 0 ? entryCost / shardCount : 0;
      const shardEv = shardCount > 0 ? entryCost : 0;
      const totalEv = lootEv + shardEv;

      const durationMins = getDungeonLengthMinutes(dungeon);
      const durationHours = durationMins / 60;
      const effectiveDurationMins = durationMins / (1 + efficiency / 100);
      const effectiveDurationHours = effectiveDurationMins / 60;
      const housingDungeonHours = getHousingDungeonHoursForDungeon(activeProfile, dungeon);
      const idleActionLimitHours = getProfileIdleActionHoursForDungeon(activeProfile, dungeon);
      const netProfitPerRun = totalEv - entryCost;
      const runsToDrop = combinedDropChance > 0 ? 1 / combinedDropChance : Infinity;
      const requiredDungeonStats = Math.ceil(Number(dungeon.difficulty || 0) * 0.7);
      const statGap = Math.max(0, requiredDungeonStats - profileDungeonStats);
      const dungeoneeringGap = Math.max(0, Number(dungeon.level_required || 0) - profileDungeoneering);
      const runsInIdleAction = idleActionLimitHours > 0 && effectiveDurationHours > 0 ? Math.floor(idleActionLimitHours / effectiveDurationHours) : 0;
      const dailyRunsByPlaytime = runsInIdleAction > 0 && playtimeHours > 0 && effectiveDurationHours > 0
        ? Math.floor(playtimeHours / effectiveDurationHours)
        : 0;
      const actionsNeededForDailyRuns = runsInIdleAction > 0 && dailyRunsByPlaytime > 0
        ? Math.ceil(dailyRunsByPlaytime / runsInIdleAction)
        : 0;
      const idleActionBaseHours = durationHours * runsInIdleAction;
      const idleActionEffectiveHours = effectiveDurationHours * runsInIdleAction;
      const idleActionCost = entryCost * runsInIdleAction;
      const idleActionNetProfit = netProfitPerRun * runsInIdleAction;
      const idleActionGapHours = Math.max(0, idleActionLimitHours - idleActionEffectiveHours);
      const completionRequirement = Number(dungeon.completion_requirement || 0);
      const completedRuns = Number(completedRunsByDungeon[getDungeonKey(dungeon)] || 0);
      const completionMagicFindActive = completionRequirement > 0 && completedRuns >= completionRequirement;

      calculated.push({
        ...dungeon,
        ev: totalEv,
        lootEv,
        shardCount,
        shardValue: shardValuePerUnit,
        shardEv,
        durationMins,
        durationHours,
        effectiveDurationMins,
        effectiveDurationHours,
        entryCost,
        netProfitPerRun,
        runsToDrop,
        requiredDungeonStats,
        profileDungeonStats,
        profileDungeoneering,
        profileReady: Boolean(activeProfile) && statGap === 0 && dungeoneeringGap === 0,
        statGap,
        dungeoneeringGap,
        dropsCount: lootDetails.length,
        lootDetails,
        playtimeHours,
        idleActionLimitHours,
        housingDungeonHours,
        runsInIdleAction,
        dailyRunsByPlaytime,
        actionsNeededForDailyRuns,
        idleActionBaseHours,
        idleActionEffectiveHours,
        idleActionCost,
        idleActionNetProfit,
        idleActionGapHours,
        completedRuns,
        completionRequirement,
        completionMagicFindActive,
        completedDungeonBonus: completionMagicFindBonus,
        listedCompletionMagicFindBonus,
        eventCompletionMagicFindBonus,
        dropValuationMode,
        marketSensitiveDropCount,
        manualMissingValueCount,
        baseDungeonEfficiency: baseEfficiency,
        dungeonEfficiency: efficiency,
        itemEfficiencyBonus,
        dungeonEfficiencyItemName: selectedDungeonEfficiencyItem?.name || "",
        baseDungeonMagicFind: baseMagicFind,
        dungeonMagicFind: totalMagicFind,
        itemMagicFindBonus,
        equippedSpecialMagicFindBonus: equippedDungeonSpecialMagicFind,
        equippedSpecialName: equippedDungeonSpecial?.name || "",
        dungeonMagicFindItemName: selectedDungeonMagicFindItem?.name || "",
        includeMagicFindEv,
        combatExp: Number(dungeon.experience?.skills?.combat || 0),
        dungeoneeringExp: Number(dungeon.experience?.skills?.dungeoneering || 0),
      });
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = calculated.filter((row) => {
      const matchesSearch = !normalizedSearch ||
        row.name.toLowerCase().includes(normalizedSearch) ||
        (row.location?.name || "").toLowerCase().includes(normalizedSearch);
      const matchesReadiness =
        readinessFilter === "all" ||
        (readinessFilter === "ready" && row.profileReady) ||
        (readinessFilter === "blocked" && activeProfile && !row.profileReady);
      const matchesProfit = minimumProfit === "" || row.netProfitPerRun >= Number(minimumProfit);
      return matchesSearch && matchesReadiness && matchesProfit;
    });

    filtered.sort((a, b) => {
      let valA: any = a[sortCol];
      let valB: any = b[sortCol];
      if (sortCol === "location") {
        valA = a.location?.name || "";
        valB = b.location?.name || "";
      }
      if (sortCol === "readiness") {
        valA = a.profileReady ? 0 : a.statGap + a.dungeoneeringGap * 1000;
        valB = b.profileReady ? 0 : b.statGap + b.dungeoneeringGap * 1000;
      }
      if (typeof valA === "string") {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortDesc ? valB - valA : valA - valB;
    });

    return filtered;
  }, [
    activeProfile,
    allItemsDb,
    completionMagicFindBonus,
    completedRunsByDungeon,
    dungeonEfficiency,
    dungeonMagicFind,
    dropValuationMode,
    equippedDungeonSpecial,
    equippedDungeonSpecialMagicFind,
    eventCompletionMagicFindBonus,
    includeMagicFindEv,
    itemEfficiencyBonus,
    itemMagicFindBonus,
    listedCompletionMagicFindBonus,
    marketData,
    manualSensitiveDropValue,
    minimumProfit,
    preferences.customPrices,
    preferences.membership,
    readinessFilter,
    searchTerm,
    selectedDungeonEfficiencyItem,
    selectedDungeonMagicFindItem,
    sortCol,
    sortDesc,
    staticData,
  ]);

  const selectedDungeon = useMemo(() => {
    if (!selectedDungeonKey) return null;
    return rows.find((row) => getDungeonKey(row) === selectedDungeonKey) ?? null;
  }, [rows, selectedDungeonKey]);
  const dungeonDialogRef = useModalA11y<HTMLDivElement>(Boolean(selectedDungeon), () => setSelectedDungeonKey(null));

  const autoOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (rows.length === 0) return;
    const dungeonParam = searchParams.get("dungeon") || searchParams.get("search");
    if (dungeonParam) {
      if (dungeonParam === autoOpenedRef.current) return;
      const found = rows.find((row) => row.name.toLowerCase() === dungeonParam.toLowerCase());
      if (found) {
        setSelectedDungeonKey(getDungeonKey(found));
        autoOpenedRef.current = dungeonParam;
      }
    } else {
      autoOpenedRef.current = null;
    }
  }, [rows, searchParams]);

  const summary = useMemo(() => {
    const readyRows = rows.filter((row) => row.profileReady);
    const bestProfit = rows.reduce((best, row) => row.netProfitPerRun > (best?.netProfitPerRun ?? -Infinity) ? row : best, null as any);
    const bestReady = readyRows.reduce((best, row) => row.netProfitPerRun > (best?.netProfitPerRun ?? -Infinity) ? row : best, null as any);
    const cheapest = rows.reduce((best, row) => row.entryCost < (best?.entryCost ?? Infinity) ? row : best, null as any);
    return { readyRows, bestProfit, bestReady, cheapest };
  }, [rows]);

  const actionLimitSummary = useMemo(() => {
    const base = getProfileBaseIdleActionHours(activeProfile);
    const housingRows = rows.filter((row) => Number(row.housingDungeonHours || 0) > 0);
    const maxHousing = housingRows.reduce((max, row) => Math.max(max, Number(row.housingDungeonHours || 0)), 0);
    const matchingLocations = Array.from(new Set(
      housingRows
        .map((row) => String(row.location?.name || row.location || "").trim())
        .filter(Boolean),
    ));
    const visibleLocationText = matchingLocations.length > 0
      ? `${matchingLocations.slice(0, 2).join(", ")}${matchingLocations.length > 2 ? ` +${matchingLocations.length - 2}` : ""}`
      : "";
    return {
      base,
      maxHousing,
      maxLimit: base + maxHousing,
      matchingRows: housingRows.length,
      matchingLocationText: visibleLocationText,
    };
  }, [activeProfile, rows]);

  const selectedDungeonLore = useMemo(() => {
    if (!selectedDungeon) return [];
    return getLoreHintsForNames([
      { name: selectedDungeon.name, source: "entity" },
      { name: selectedDungeon.location?.name, source: "location" },
      ...(selectedDungeon.lootDetails || []).map((drop: any) => ({ name: drop.name, source: "drop" as const })),
    ], 5);
  }, [selectedDungeon]);

  const openLoreThread = (entryId: string) => {
    setSelectedDungeonKey(null);
    router.push(`/lore?thread=${entryId}`);
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDesc((current) => !current);
    else {
      setSortCol(col);
      setSortDesc(col !== "name" && col !== "location" && col !== "readiness");
    }
  };

  const renderSortIcon = (col: string) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  const getSortDirection = (col: string): "ascending" | "descending" | "none" => {
    if (sortCol !== col) return "none";
    return sortDesc ? "descending" : "ascending";
  };

  const renderSortHeader = (col: string, label: string, align: "left" | "center" = "center") => (
    <th className={`sortable ${align === "left" ? "left-align" : ""}`} aria-sort={getSortDirection(col)}>
      <button type="button" className="dungeon-sort-button" onClick={() => handleSort(col)}>
        <span>{label}</span>
        {renderSortIcon(col)}
      </button>
    </th>
  );

  return (
    <main className="container dungeons-page">
      <div className="header">
        <h1 className="header-title">
          <ZenithIcon name="castle" size={24} style={{ color: "var(--text-accent)" }} /> ZENITH DUNGEONS
        </h1>
        <div className="header-status">
          <div className="status-dot"></div>
          <span className="mono">{activeProfile ? `${activeProfile.name} - ` : ""}{rows.length} FILTERED</span>
        </div>
      </div>

      <section className="dungeon-command">
        <div className="dungeon-command-main">
          <span className="dungeon-eyebrow"><ShieldCheck size={14} /> Dungeon Planner</span>
          <h2>{summary.bestReady?.name || summary.bestProfit?.name || "Build a dungeon plan"}</h2>
          <p>
            Compare entry readiness, expected value, run costs, speed-style dungeon efficiency, gold per shard from cost and payout, and magic-find adjusted EV.
          </p>
        </div>
        <div className="dungeon-command-stats">
          <div><span>Ready</span><strong>{activeProfile ? `${summary.readyRows.length}/${rows.length}` : "No profile"}</strong></div>
          <div><span>Best Ready EV</span><strong>{summary.bestReady ? formatGold(summary.bestReady.netProfitPerRun) : "-"}</strong></div>
          <div><span>Cheapest</span><strong>{summary.cheapest ? formatPlainGold(summary.cheapest.entryCost) : "-"}</strong></div>
        </div>
      </section>

      <section className="dungeon-planner">
        <div className="dungeon-planner-field dungeon-search-field">
          <label className="control-label">Search</label>
          <div className="dungeon-input-icon">
            <Search size={14} />
            <input
              aria-label="Search dungeons"
              type="text"
              className="control-input"
              placeholder="Search dungeon or location"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        <div className="dungeon-planner-field dungeon-readonly-field dungeon-action-limit-field">
          <span className="control-label">Best Action Limit</span>
          <strong>{actionLimitSummary.maxHousing > 0 ? `Up to ${formatHours(actionLimitSummary.maxLimit)}` : formatHours(actionLimitSummary.base)}</strong>
          <small>
            {activeProfile
              ? actionLimitSummary.maxHousing > 0
                ? `${activeProfile.kind === "main" ? "Main" : "Alt"} base ${formatHours(actionLimitSummary.base)}. Housing applies per matching row${actionLimitSummary.matchingLocationText ? ` (${actionLimitSummary.matchingLocationText})` : ""}.`
                : `${activeProfile.kind === "main" ? "Main" : "Alt"} base. ${getHousingDungeonScopeText(activeProfile)}`
              : "Select a profile."}
          </small>
        </div>
        <div className="dungeon-planner-field dungeon-readonly-field dungeon-playtime-field">
          <span className="control-label">Playtime</span>
          <strong>{Number(activeProfile?.timers.activeHours || 0).toLocaleString()}h/day</strong>
          <small>Used for daily repeat capacity, not one queued action.</small>
        </div>
        <label className="dungeon-planner-field dungeon-profit-field">
          <span className="control-label">Min Profit / Run</span>
          <input aria-label="Minimum profit per run" className="control-input" type="number" value={minimumProfit} onChange={(event) => setMinimumProfit(event.target.value === "" ? "" : Number(event.target.value))} />
        </label>
        <label className="dungeon-planner-field dungeon-efficiency-field">
          <span className="control-label">Dungeon Efficiency</span>
          <input aria-label="Dungeon Efficiency" className="control-input" type="number" min="0" value={dungeonEfficiency} placeholder={activeProfile?.efficiency.dungeon ? String(activeProfile.efficiency.dungeon) : "0"} onChange={(event) => setDungeonEfficiency(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))} />
        </label>
        <label className="dungeon-planner-field dungeon-mf-field">
          <span className="control-label">Dungeon MF</span>
          <input aria-label="Dungeon Magic Find" className="control-input" type="number" min="0" value={dungeonMagicFind} placeholder={activeProfile?.magicFind.dungeon ? String(activeProfile.magicFind.dungeon) : "0"} onChange={(event) => setDungeonMagicFind(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))} />
        </label>
        <div className="dungeon-planner-field dungeon-readonly-field dungeon-completion-field">
          <span className="control-label">Completion MF</span>
          <strong>+{completionMagicFindBonus}%</strong>
          <small>{listedCompletionMagicFindBonus}% current list + {eventCompletionMagicFindBonus}% limited-time.</small>
        </div>
        <label className="dungeon-planner-field dungeon-event-completion-field">
          <span className="control-label">Limited-Time Completions</span>
          <input
            aria-label="Limited-time dungeon completions"
            className="control-input"
            type="number"
            min="0"
            value={eventDungeonCompletionCount}
            placeholder="0"
            onChange={(event) => setEventDungeonCompletionCount(event.target.value === "" ? "" : normalizeCompletionCount(event.target.value))}
          />
          <small>Adds completion MF for completed limited-time dungeons.</small>
        </label>
        <div className="dungeon-planner-field dungeon-filter-field">
          <span className="control-label">Profile Filter</span>
          <div className="dungeon-segmented">
            {(["all", "ready", "blocked"] as ReadinessFilter[]).map((mode) => (
              <button key={mode} type="button" className={readinessFilter === mode ? "active" : ""} onClick={() => setReadinessFilter(mode)}>
                {mode === "all" ? "All" : mode === "ready" ? "Ready" : "Blocked"}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`dungeon-check-toggle dungeon-mf-toggle ${includeMagicFindEv ? "active" : ""}`}
          aria-pressed={includeMagicFindEv}
          onClick={() => setIncludeMagicFindEv((value) => !value)}
        >
          <span className="dungeon-check-box">{includeMagicFindEv && <Check size={13} />}</span>
          <span>
            <strong>Apply dungeon MF</strong>
            <small>Adjust loot EV with profile and completion magic find.</small>
          </span>
        </button>
      </section>

      <div className="dungeon-advanced-row">
        <section className="dungeon-modifier-panel" aria-label="Dungeon item modifiers">
          <div className="dungeon-modifier-copy">
            <span className="control-label">Confirmed Item Modifiers</span>
            <strong>
              {itemEfficiencyBonus > 0 || itemMagicFindBonus > 0 || equippedDungeonSpecialMagicFind > 0
                ? `${itemEfficiencyBonus > 0 ? `+${itemEfficiencyBonus}% speed` : "No speed"} / ${itemMagicFindBonus + equippedDungeonSpecialMagicFind > 0 ? `+${itemMagicFindBonus + equippedDungeonSpecialMagicFind}% MF` : "No MF"}`
                : "No item effect"}
            </strong>
            <small>Temporary dropdowns exclude equipped specials; profile gear special adds MF when selected.</small>
          </div>
          <div className="dungeon-modifier-pickers">
            <DungeonItemEffectPicker
              ariaLabel="Active dungeon efficiency item"
              emptyLabel="No speed item"
              label="Efficiency Item"
              onChange={(value) => setDungeonItemModifierSelections((current) => ({ ...current, efficiencyItem: value }))}
              options={dungeonEfficiencyItemOptions}
              value={dungeonItemModifierSelections.efficiencyItem}
            />
            <DungeonItemEffectPicker
              ariaLabel="Active dungeon magic find item"
              emptyLabel="No magic-find item"
              label="Magic-Find Item"
              onChange={(value) => setDungeonItemModifierSelections((current) => ({ ...current, magicFindItem: value }))}
              options={dungeonMagicFindItemOptions}
              value={dungeonItemModifierSelections.magicFindItem}
            />
          </div>
        </section>

        <section className="dungeon-valuation-panel" aria-label="Dungeon drop valuation">
          <div className="dungeon-valuation-copy">
            <span className="control-label">Gear & Mythic Potion Value</span>
            <strong>{DROP_VALUATION_LABELS[dropValuationMode]}</strong>
            <small>Uses safe market prices plus modeled chest/recipe paths for high-tier gear recipes and mythic potion-style drops. Loot EV, shard EV, and entry cost stay separated.</small>
          </div>
          <div className="dungeon-valuation-controls">
            <div className="dungeon-segmented dungeon-valuation-segmented" role="group" aria-label="Sensitive drop valuation mode">
              {DROP_VALUATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={dropValuationMode === option.value ? "active" : ""}
                  aria-pressed={dropValuationMode === option.value}
                  onClick={() => setDropValuationMode(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {dropValuationMode === "manual" && (
              <label className="dungeon-manual-value-field">
                <span className="control-label">Manual Value / Drop</span>
                <input
                  aria-label="Manual value for sensitive dungeon drops"
                  className="control-input"
                  type="number"
                  min="0"
                  value={manualSensitiveDropValue}
                  placeholder="0"
                  onChange={(event) => setManualSensitiveDropValue(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))}
                />
              </label>
            )}
          </div>
        </section>
      </div>

      <section className="dungeon-insights">
        <button type="button" className="dungeon-insight" onClick={() => summary.bestProfit && setSelectedDungeonKey(getDungeonKey(summary.bestProfit))}>
          <BarChart3 size={16} />
          <span>Best EV/run</span>
          <strong>{summary.bestProfit ? summary.bestProfit.name : "-"}</strong>
          <small>{summary.bestProfit ? formatGold(summary.bestProfit.netProfitPerRun) : "No data"}</small>
        </button>
        <button type="button" className="dungeon-insight" onClick={() => summary.bestReady && setSelectedDungeonKey(getDungeonKey(summary.bestReady))}>
          <ShieldCheck size={16} />
          <span>Best Ready</span>
          <strong>{summary.bestReady ? summary.bestReady.name : "-"}</strong>
          <small>{summary.bestReady ? getReadinessText(summary.bestReady, Boolean(activeProfile)) : "No ready dungeon"}</small>
        </button>
        <div className="dungeon-insight passive">
          <Timer size={16} />
          <span>Best Action Limit</span>
          <strong>{actionLimitSummary.maxHousing > 0 ? `Up to ${formatHours(actionLimitSummary.maxLimit)}` : `${formatHours(actionLimitSummary.base)} action limit`}</strong>
          <small>
            {actionLimitSummary.maxHousing > 0
              ? `Base ${formatHours(actionLimitSummary.base)}; housing applies only on ${actionLimitSummary.matchingRows} matching row${actionLimitSummary.matchingRows === 1 ? "" : "s"}.`
              : "No dungeon housing bonus applied."}
          </small>
        </div>
      </section>

      <section className="table-wrapper dungeon-table-wrapper">
        <div className="desktop-only">
          <div className="table-container dungeon-table">
            <table>
              <thead>
                <tr>
                  {renderSortHeader("name", "Dungeon", "left")}
                  {renderSortHeader("location", "Location", "left")}
                  {renderSortHeader("readiness", "Profile")}
                  {renderSortHeader("netProfitPerRun", "EV / Run")}
                  {renderSortHeader("shardValue", "Gold / Shard")}
                  {renderSortHeader("runsInIdleAction", "Runs / Action")}
                  <th>Done</th>
                  {renderSortHeader("runsToDrop", "Runs / Drop")}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    aria-label={`Open ${row.name} dungeon details`}
                    key={row.id || row.name}
                    className="clickable-row"
                    onClick={() => setSelectedDungeonKey(getDungeonKey(row))}
                  >
                    <td className="item-name left-align">
                      <button
                        type="button"
                        className="dungeon-name-cell dungeon-open-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedDungeonKey(getDungeonKey(row));
                        }}
                      >
                        {row.image_url && <img src={row.image_url} alt="" />}
                        <div>
                          <span>{row.name}</span>
                          <small>Lv {row.level_required || 0} - {row.durationMins}m - {row.dropsCount} drops</small>
                        </div>
                      </button>
                    </td>
                    <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
                    <td><span className={`dungeon-readiness ${row.profileReady ? "ready" : activeProfile ? "blocked" : "neutral"}`}>{getReadinessText(row, Boolean(activeProfile))}</span></td>
                    <td className={`mono ${row.netProfitPerRun >= 0 ? "profit-positive" : "profit-negative"}`}>{formatGold(row.netProfitPerRun)}</td>
                    <td className="mono text-muted">{row.shardValue > 0 ? formatPlainGold(row.shardValue) : "-"}</td>
                    <td className="mono text-muted">{row.runsInIdleAction}</td>
                    <td>
                      <input
                        aria-label={`${row.name} completed runs`}
                        className="dungeon-completed-input"
                        type="number"
                        min="0"
                        value={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                        placeholder={`/${row.completionRequirement || 0}`}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0);
                          setCompletedRunsByDungeon((current) => ({ ...current, [getDungeonKey(row)]: value }));
                        }}
                      />
                    </td>
                    <td className="mono text-muted">{row.runsToDrop === Infinity ? "-" : row.runsToDrop.toFixed(1)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="dungeon-empty-state">
                        <strong>No dungeons match these filters.</strong>
                        <span>Relax the profile filter, search term, or minimum profit target.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mobile-only">
          <MobileSortControls
            label="Sort Dungeons"
            value={sortCol}
            descending={sortDesc}
            onSort={handleSort}
            onToggleDirection={() => setSortDesc((prev) => !prev)}
            options={[
              { value: "netProfitPerRun", label: "EV / Run" },
              { value: "shardValue", label: "Gold / Shard" },
              { value: "runsInIdleAction", label: "Runs / Action" },
              { value: "readiness", label: "Profile Gap" },
              { value: "durationMins", label: "Duration" },
              { value: "name", label: "Name" },
            ]}
          />
          <div className="dungeon-mobile-grid">
            {rows.length === 0 && (
              <div className="dungeon-empty-state">
                <strong>No dungeons match these filters.</strong>
                <span>Relax the profile filter, search term, or minimum profit target.</span>
              </div>
            )}
            {rows.map((row) => (
              <div
                aria-label={`Open ${row.name} dungeon details`}
                key={row.id || row.name}
                className="dungeon-card"
                onClick={() => setSelectedDungeonKey(getDungeonKey(row))}
              >
                <div className="dungeon-card-top">
                  <button
                    type="button"
                    className="dungeon-name-cell dungeon-open-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedDungeonKey(getDungeonKey(row));
                    }}
                  >
                    {row.image_url && <img src={row.image_url} alt="" />}
                    <div>
                      <strong>{row.name}</strong>
                          <small>{row.location?.name || "Unknown"} - {Math.round(row.effectiveDurationMins)}m</small>
                    </div>
                  </button>
                  <span className={`dungeon-readiness ${row.profileReady ? "ready" : activeProfile ? "blocked" : "neutral"}`}>
                    {getReadinessText(row, Boolean(activeProfile))}
                  </span>
                </div>
                <div className="dungeon-card-stats">
                  <span><small>EV/run</small><strong className={row.netProfitPerRun >= 0 ? "profit-positive" : "profit-negative"}>{formatGold(row.netProfitPerRun)}</strong></span>
                  <span><small>Gold / Shard</small><strong>{row.shardValue > 0 ? formatPlainGold(row.shardValue) : "-"}</strong></span>
                  <span><small>Runs / Action</small><strong>{row.runsInIdleAction}</strong></span>
                  <span><small>Daily Runs</small><strong>{row.dailyRunsByPlaytime}</strong></span>
                  <span><small>Cost</small><strong>{formatPlainGold(row.entryCost)}</strong></span>
                </div>
                <label className="dungeon-mobile-completed" onClick={(event) => event.stopPropagation()}>
                  <span>Completed runs</span>
                  <input
                    aria-label={`${row.name} completed runs`}
                    type="number"
                    min="0"
                    value={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                    placeholder={`Requirement ${row.completionRequirement || 0}`}
                    onKeyDown={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0);
                      setCompletedRunsByDungeon((current) => ({ ...current, [getDungeonKey(row)]: value }));
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedDungeon && (
        <div className="modal-overlay" onClick={() => setSelectedDungeonKey(null)}>
          <div
            aria-labelledby="dungeon-details-title"
            aria-modal="true"
            className="modal-content dungeon-modal"
            onClick={(event) => event.stopPropagation()}
            ref={dungeonDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="modal-header">
              <div className="dungeon-modal-title">
                {selectedDungeon.image_url && <img src={selectedDungeon.image_url} alt="" />}
                <div>
                  <h2 id="dungeon-details-title">{selectedDungeon.name}</h2>
                  <div className="dungeon-modal-tags">
                    <span><MapPin size={12} /> {selectedDungeon.location?.name || "Unknown"}</span>
                    <span><Zap size={12} /> Difficulty {selectedDungeon.difficulty}</span>
                    <span><Clock size={12} /> {selectedDungeon.durationMins}m</span>
                  </div>
                </div>
              </div>
              <button className="close-btn" type="button" aria-label="Close dungeon details" onClick={() => setSelectedDungeonKey(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="stats-grid dungeon-modal-stats">
                <div className="stat-card">
                  <div className="stat-label">Entry Cost</div>
                  <div className="stat-value" style={{ color: "#f87171" }}>-{formatPlainGold(selectedDungeon.entryCost)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">EV / Run</div>
                  <div className="stat-value" style={{ color: selectedDungeon.netProfitPerRun >= 0 ? "var(--text-success)" : "#f87171" }}>{formatGold(selectedDungeon.netProfitPerRun)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Gold / Shard</div>
                  <div className="stat-value">{selectedDungeon.shardValue > 0 ? formatPlainGold(selectedDungeon.shardValue) : "-"}</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-label">Action Net</div>
                  <div className="stat-value" style={{ color: selectedDungeon.idleActionNetProfit >= 0 ? "var(--text-success)" : "#f87171" }}>{formatGold(selectedDungeon.idleActionNetProfit)}</div>
                </div>
              </div>

              <div className="dungeon-modal-grid">
                <section className="dungeon-modal-panel">
                  <h3><ShieldCheck size={15} /> Profile Readiness</h3>
                  <div className="dungeon-detail-row"><span>Status</span><strong>{getReadinessText(selectedDungeon, Boolean(activeProfile))}</strong></div>
                  <div className="dungeon-detail-row"><span>Profile stats</span><strong>{formatNumber(selectedDungeon.profileDungeonStats)}</strong></div>
                  <div className="dungeon-detail-row"><span>Required stats</span><strong>{formatNumber(selectedDungeon.requiredDungeonStats)}</strong></div>
                  <div className="dungeon-detail-row"><span>Dungeoneering</span><strong>{selectedDungeon.profileDungeoneering || 0} / {selectedDungeon.level_required || 0}</strong></div>
                </section>
                <section className="dungeon-modal-panel">
                  <h3><Target size={15} /> Idle Action Plan</h3>
                  <div className="dungeon-detail-row"><span>Action limit</span><strong>{selectedDungeon.idleActionLimitHours.toFixed(1)}h</strong></div>
                  <div className="dungeon-detail-row"><span>Housing bonus</span><strong>{formatHours(selectedDungeon.housingDungeonHours || 0)}</strong></div>
                  <div className="dungeon-detail-row"><span>Playtime</span><strong>{selectedDungeon.playtimeHours.toFixed(1)}h/day</strong></div>
                  <div className="dungeon-detail-row"><span>Runs fit</span><strong>{selectedDungeon.runsInIdleAction}</strong></div>
                  <div className="dungeon-detail-row"><span>Daily repeat capacity</span><strong>{selectedDungeon.dailyRunsByPlaytime} runs in {selectedDungeon.actionsNeededForDailyRuns} actions</strong></div>
                  <div className="dungeon-detail-row"><span>Base time used</span><strong>{selectedDungeon.idleActionBaseHours.toFixed(1)}h</strong></div>
                  <div className="dungeon-detail-row"><span>Effective time used</span><strong>{selectedDungeon.idleActionEffectiveHours.toFixed(1)}h</strong></div>
                  <div className="dungeon-detail-row"><span>Action gap</span><strong>{selectedDungeon.idleActionGapHours.toFixed(1)}h</strong></div>
                </section>
                <section className="dungeon-modal-panel">
                  <h3><Sparkles size={15} /> Rewards</h3>
                  <div className="dungeon-detail-row"><span>Combat EXP</span><strong>{formatNumber(selectedDungeon.combatExp)}</strong></div>
                  <div className="dungeon-detail-row"><span>Dungeoneering EXP</span><strong>{formatNumber(selectedDungeon.dungeoneeringExp)}</strong></div>
                  <div className="dungeon-detail-row"><span>Shards</span><strong>{formatNumber(selectedDungeon.shardCount)}</strong></div>
                  <div className="dungeon-detail-row"><span>Gold / shard</span><strong>{selectedDungeon.shardValue > 0 ? `${formatPlainGold(selectedDungeon.shardValue)} each` : "-"}</strong></div>
                  <div className="dungeon-detail-row"><span>Completion requirement</span><strong>{selectedDungeon.completedRuns || 0} / {selectedDungeon.completionRequirement || 0}</strong></div>
                  <div className="dungeon-detail-row"><span>This dungeon MF</span><strong>{selectedDungeon.completionMagicFindActive ? "+1% active" : "Not active"}</strong></div>
                  <div className="dungeon-detail-row"><span>Total completion MF</span><strong>+{selectedDungeon.completedDungeonBonus}%</strong></div>
                  <div className="dungeon-detail-row"><span>Limited-time MF</span><strong>+{selectedDungeon.eventCompletionMagicFindBonus || 0}%</strong></div>
                  <div className="dungeon-detail-row"><span>Item speed</span><strong>{selectedDungeon.itemEfficiencyBonus > 0 ? `+${selectedDungeon.itemEfficiencyBonus}%${selectedDungeon.dungeonEfficiencyItemName ? ` (${selectedDungeon.dungeonEfficiencyItemName})` : ""}` : "None"}</strong></div>
                  <div className="dungeon-detail-row"><span>Temporary item MF</span><strong>{selectedDungeon.itemMagicFindBonus > 0 ? `+${selectedDungeon.itemMagicFindBonus}%${selectedDungeon.dungeonMagicFindItemName ? ` (${selectedDungeon.dungeonMagicFindItemName})` : ""}` : "None"}</strong></div>
                  <div className="dungeon-detail-row"><span>Equipped special MF</span><strong>{selectedDungeon.equippedSpecialMagicFindBonus > 0 ? `+${selectedDungeon.equippedSpecialMagicFindBonus}%${selectedDungeon.equippedSpecialName ? ` (${selectedDungeon.equippedSpecialName})` : ""}` : "None"}</strong></div>
                </section>
                <section className="dungeon-modal-panel">
                  <h3><Coins size={15} /> Cost Model</h3>
                  <p className="dungeon-model-note">Craft paths are modeled value and may require your own skill/materials or a trusted service.</p>
                  <div className="dungeon-detail-row"><span>Queued action entry cost</span><strong>{formatPlainGold(selectedDungeon.idleActionCost)}</strong></div>
                  <div className="dungeon-detail-row"><span>Drop value mode</span><strong>{DROP_VALUATION_LABELS[selectedDungeon.dropValuationMode as DungeonDropValuationMode]}</strong></div>
                  <div className="dungeon-detail-row"><span>Sensitive drops</span><strong>{selectedDungeon.marketSensitiveDropCount > 0 ? `${selectedDungeon.marketSensitiveDropCount} checked` : "None"}</strong></div>
                  <div className="dungeon-detail-row"><span>Loot EV / run</span><strong>{formatPlainGold(selectedDungeon.lootEv)}</strong></div>
                  <div className="dungeon-detail-row"><span>Shard EV / run</span><strong>{selectedDungeon.shardValue > 0 ? `${formatPlainGold(selectedDungeon.shardEv)} (${formatPlainGold(selectedDungeon.entryCost)} / ${formatNumber(selectedDungeon.shardCount)} shards)` : "-"}</strong></div>
                  <div className="dungeon-detail-row"><span>Gross EV / run</span><strong>{formatPlainGold(selectedDungeon.ev)}</strong></div>
                  <div className="dungeon-detail-row"><span>Dungeon MF in EV</span><strong>{selectedDungeon.includeMagicFindEv ? `${selectedDungeon.dungeonMagicFind}%` : "Off"}</strong></div>
                  <div className="dungeon-detail-row"><span>Effective speed</span><strong>{selectedDungeon.dungeonEfficiency}%</strong></div>
                  <div className="dungeon-detail-row"><span>Runs / any drop</span><strong>{selectedDungeon.runsToDrop === Infinity ? "-" : selectedDungeon.runsToDrop.toFixed(1)}</strong></div>
                </section>
              </div>

              <LoreThreadPanel hints={selectedDungeonLore} title="Dungeon Lore Thread" onOpenThread={openLoreThread} />

              <h3 className="dungeon-loot-heading"><PackageOpen size={16} /> Loot Table</h3>
              <div className="dungeon-loot-list">
                {[...(selectedDungeon.lootDetails || [])]
                  .sort((a: any, b: any) => (b.expectedVal || 0) - (a.expectedVal || 0))
                  .map((drop: any, index: number) => (
                    <button
                      key={`${drop.name}-${index}`}
                      type="button"
                      className="dungeon-loot-row"
                      onClick={() => openItemByName(drop.name)}
                      onMouseEnter={() => prefetchItem(drop.name)}
                    >
                      <div className="dungeon-loot-main">
                        {drop.image_url && <img src={drop.image_url} alt="" />}
                        <div>
                          <strong>
                            {drop.name}
                            {(Number(drop.quantity) || 1) > 1 && <span> x{drop.quantity}</span>}
                          </strong>
                          <small>{drop.adjustedChancePercent !== drop.baseChancePercent ? `${drop.baseChancePercent}% -> ${drop.adjustedChancePercent.toFixed(2)}%` : `${drop.chance}% drop`} - {drop.quality || "Unknown"}</small>
                        </div>
                      </div>
                      <div className="dungeon-loot-value">
                        <strong>{formatPlainGold(drop.expectedVal || 0)}</strong>
                        <span>
                          {getValuePathLabel(drop.valueBreakdown?.chosenPath)} {formatPlainGold(drop.trueValue || 0)}
                          {drop.marketPriceInfo?.adjusted ? " safe" : ""} <ExternalLink size={10} />
                        </span>
                        {(drop.marketSensitive || drop.chestAdjusted) && (
                          <small className={`dungeon-market-note ${drop.manualMissingValue ? "risk" : drop.marketLiquidity?.tone || "none"}`}>
                            {drop.valuationModeApplied || drop.chestAdjusted
                              ? `${drop.valuationLabel}. ${drop.valuationNote || "Sensitive loot value adjusted."}`
                              : drop.valuationNote}
                          </small>
                        )}
                        {drop.valueBreakdown?.recipe && !drop.valuationModeApplied && (
                          <small>
                            Crafted item value: {formatPlainGold(drop.valueBreakdown.recipe.resultValue)}
                            {" - "}
                            material cost {formatPlainGold(drop.valueBreakdown.recipe.materialCost)}
                          </small>
                        )}
                        {drop.valueBreakdown?.chest && (
                          <small>
                            Chest contents EV: {formatPlainGold(drop.valueBreakdown.chest.expectedValue)}
                          </small>
                        )}
                      </div>
                      {drop.valueBreakdown?.chest && (
                        <div className="dungeon-chest-breakdown" onClick={(event) => event.stopPropagation()}>
                          <div className="dungeon-chest-summary">
                            <span>
                              <strong>Alchemy chest breakdown</strong>
                              <small>Each row is chance x quantity x best item value.</small>
                            </span>
                            <em>{formatPlainGold(drop.valueBreakdown.chest.expectedValue)} total</em>
                          </div>
                          {[...drop.valueBreakdown.chest.drops]
                            .sort((a: any, b: any) => (b.expectedValue || 0) - (a.expectedValue || 0))
                            .slice(0, 6)
                            .map((chestDrop: any) => (
                              <div className="dungeon-chest-row" key={`${drop.name}-${chestDrop.name}`}>
                                <span>
                                  <strong>{chestDrop.name}</strong>
                                  <small>
                                    {getValuePathLabel(chestDrop.path)}
                                    {chestDrop.valuationModeApplied ? ` - ${chestDrop.valuationLabel}` : ""}
                                  </small>
                                </span>
                                <span>
                                  <em>{formatPlainGold(chestDrop.expectedValue)}</em>
                                  <small>
                                    {Number(chestDrop.chance || 0)}% x {(Number(chestDrop.quantity) || 1) > 1 ? `${chestDrop.quantity} x ` : ""}{formatPlainGold(chestDrop.value || 0)}
                                  </small>
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dungeons-page {
          max-width: 1460px;
        }
        .dungeon-command,
        .dungeon-planner,
        .dungeon-insights {
          margin-bottom: 1rem;
          animation: settingsPanelIn 220ms ease both;
        }
        .dungeon-command {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(22rem, 0.75fr);
          gap: 1rem;
          padding: 1.25rem;
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(56,189,248,0.08), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012));
        }
        .dungeon-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-accent);
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .dungeon-command h2 {
          margin: 0;
          color: #fff;
          font-size: clamp(1.45rem, 2.5vw, 2.2rem);
        }
        .dungeon-command p {
          margin: 0.65rem 0 0;
          color: var(--text-muted);
          max-width: 620px;
          line-height: 1.5;
        }
        .dungeon-command-stats,
        .dungeon-insights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .dungeon-command-stats div,
        .dungeon-insight {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          padding: 0.85rem;
        }
        .dungeon-command-stats span,
        .dungeon-insight span {
          display: block;
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }
        .dungeon-command-stats strong,
        .dungeon-insight strong {
          color: #fff;
          font-size: 1rem;
          overflow-wrap: anywhere;
        }
        .dungeon-planner {
          display: grid;
          grid-template-columns: minmax(16rem, 1.6fr) repeat(4, minmax(0, 1fr));
          grid-template-areas:
            "search action playtime profit efficiency"
            "mf completion event filter toggle";
          gap: 0.65rem;
          padding: 0.9rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          align-items: stretch;
        }
        .dungeon-search-field { grid-area: search; }
        .dungeon-action-limit-field { grid-area: action; }
        .dungeon-playtime-field { grid-area: playtime; }
        .dungeon-profit-field { grid-area: profit; }
        .dungeon-efficiency-field { grid-area: efficiency; }
        .dungeon-mf-field { grid-area: mf; }
        .dungeon-completion-field { grid-area: completion; }
        .dungeon-event-completion-field { grid-area: event; }
        .dungeon-filter-field { grid-area: filter; }
        .dungeon-mf-toggle { grid-area: toggle; }
        .dungeon-planner-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          min-width: 0;
          justify-content: flex-end;
        }
        .dungeon-planner-field .control-input {
          width: 100%;
          min-width: 0;
          min-height: 42px;
        }
        .dungeon-planner-field > small {
          color: var(--text-muted);
          font-size: 0.68rem;
          line-height: 1.25;
        }
        .dungeon-readonly-field {
          justify-content: center;
          min-height: 4.1rem;
          padding: 0.55rem 0.7rem;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.025);
        }
        .dungeon-readonly-field strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.95rem;
        }
        .dungeon-readonly-field small {
          color: var(--text-muted);
          font-size: 0.68rem;
          line-height: 1.25;
        }
        .dungeon-check-toggle {
          display: grid;
          grid-template-columns: 1.8rem minmax(0, 1fr);
          align-items: center;
          gap: 0.65rem;
          min-height: 4.1rem;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.025);
          color: var(--text-muted);
          text-align: left;
          cursor: pointer;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .dungeon-check-toggle:hover,
        .dungeon-check-toggle.active {
          border-color: color-mix(in srgb, var(--text-accent), transparent 48%);
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
        }
        .dungeon-check-toggle:active {
          transform: translateY(1px);
        }
        .dungeon-check-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.35rem;
          height: 1.35rem;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 50%);
          border-radius: 5px;
          color: #000;
          background: rgba(0,0,0,0.24);
        }
        .dungeon-check-toggle.active .dungeon-check-box {
          background: var(--text-accent);
        }
        .dungeon-check-toggle strong {
          display: block;
          color: #fff;
          font-size: 0.78rem;
          line-height: 1.2;
        }
        .dungeon-check-toggle small {
          display: block;
          margin-top: 0.15rem;
          color: var(--text-muted);
          font-size: 0.68rem;
          line-height: 1.25;
        }
        .dungeon-input-icon {
          position: relative;
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          min-height: 42px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), var(--bg-base);
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .dungeon-input-icon:focus-within {
          border-color: var(--text-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 84%);
        }
        .dungeon-input-icon svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          z-index: 1;
          pointer-events: none;
          flex: 0 0 auto;
        }
        .dungeon-input-icon .control-input {
          display: block;
          width: 100%;
          min-width: 0;
          height: 40px;
          min-height: 40px;
          padding: 0 0.75rem 0 2.35rem;
          border: 0;
          background: transparent;
          box-shadow: none;
          font-size: 0.86rem;
        }
        .dungeon-input-icon .control-input:focus {
          box-shadow: none;
        }
        .dungeon-segmented {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          min-height: 38px;
          padding: 0.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: var(--bg-base);
        }
        .dungeon-segmented button {
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.74rem;
          font-weight: 900;
          cursor: pointer;
        }
        .dungeon-segmented button.active {
          background: var(--text-accent);
          color: #000;
        }
        .dungeon-advanced-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 0.85rem;
          margin-bottom: 1rem;
          align-items: stretch;
        }
        .dungeon-modifier-panel {
          display: grid;
          grid-template-columns: minmax(14rem, 0.65fr) minmax(0, 1.35fr);
          align-items: stretch;
          gap: 0.75rem;
          min-width: 0;
          margin-bottom: 0;
          padding: 0.9rem 1rem;
          border: 1px solid color-mix(in srgb, #a78bfa, transparent 78%);
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(167,139,250,0.08), transparent 42%),
            rgba(255,255,255,0.025);
        }
        .dungeon-modifier-copy,
        .dungeon-modifier-pickers {
          min-width: 0;
        }
        .dungeon-modifier-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.3rem;
        }
        .dungeon-modifier-copy strong {
          color: #fff;
          font-family: var(--font-mono);
          overflow-wrap: anywhere;
        }
        .dungeon-modifier-copy small {
          color: var(--text-muted);
          line-height: 1.35;
        }
        .dungeon-modifier-pickers {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        :global(.dungeon-effect-picker) {
          position: relative;
          min-width: 0;
        }
        :global(.dungeon-effect-trigger) {
          width: 100%;
          min-height: 4.4rem;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.03);
          color: #fff;
          padding: 0.65rem 0.75rem;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        :global(.dungeon-effect-trigger:hover),
        :global(.dungeon-effect-trigger:focus-visible),
        :global(.dungeon-effect-picker.open .dungeon-effect-trigger) {
          border-color: color-mix(in srgb, #a78bfa, transparent 45%);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.14);
          outline: none;
        }
        :global(.dungeon-effect-trigger span) {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.18rem;
        }
        :global(.dungeon-effect-trigger small),
        :global(.dungeon-effect-trigger em) {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-style: normal;
          line-height: 1.25;
        }
        :global(.dungeon-effect-trigger strong) {
          color: #fff;
          overflow-wrap: anywhere;
        }
        :global(.dungeon-effect-menu) {
          position: absolute;
          z-index: 45;
          inset-inline: 0;
          top: calc(100% + 0.35rem);
          display: grid;
          gap: 0.35rem;
          max-height: min(22rem, 60vh);
          overflow-y: auto;
          padding: 0.45rem;
          border: 1px solid color-mix(in srgb, #a78bfa, transparent 48%);
          border-radius: 8px;
          background: #07080d;
          box-shadow: 0 18px 50px rgba(0,0,0,0.48);
        }
        :global(.dungeon-effect-picker.drop-up .dungeon-effect-menu) {
          top: auto;
          bottom: calc(100% + 0.35rem);
        }
        :global(.dungeon-effect-option) {
          min-height: 42px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.6rem;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          padding: 0.5rem;
          text-align: left;
          cursor: pointer;
        }
        :global(.dungeon-effect-option:hover),
        :global(.dungeon-effect-option.active) {
          border-color: color-mix(in srgb, #a78bfa, transparent 56%);
          background: rgba(167,139,250,0.12);
          color: #fff;
        }
        :global(.dungeon-effect-option img),
        :global(.dungeon-effect-icon-placeholder) {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          object-fit: cover;
          background: rgba(255,255,255,0.06);
        }
        :global(.dungeon-effect-option span) {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.16rem;
        }
        :global(.dungeon-effect-option strong) {
          color: inherit;
          overflow-wrap: anywhere;
        }
        :global(.dungeon-effect-option small),
        :global(.dungeon-effect-option em) {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-style: normal;
          line-height: 1.25;
        }
        :global(.dungeon-effect-option em) {
          grid-column: 2 / -1;
        }
        .dungeon-valuation-panel {
          display: grid;
          grid-template-columns: minmax(14rem, 0.75fr) minmax(0, 1.25fr);
          align-items: stretch;
          gap: 0.75rem;
          min-width: 0;
          margin-bottom: 0;
          padding: 0.9rem 1rem;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 78%);
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(56,189,248,0.08), transparent 42%),
            rgba(255,255,255,0.025);
        }
        .dungeon-valuation-copy,
        .dungeon-valuation-controls {
          min-width: 0;
        }
        .dungeon-valuation-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.3rem;
        }
        .dungeon-valuation-copy strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .dungeon-valuation-copy small {
          color: var(--text-muted);
          line-height: 1.35;
        }
        .dungeon-valuation-controls {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(10rem, 0.4fr);
          align-items: end;
          gap: 0.75rem;
        }
        .dungeon-valuation-segmented {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          min-height: 42px;
        }
        .dungeon-manual-value-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          min-width: 0;
        }
        .dungeon-manual-value-field .control-input {
          width: 100%;
          min-height: 42px;
        }
        .dungeon-insight {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          column-gap: 0.75rem;
          text-align: left;
          color: inherit;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .dungeon-insight:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--text-accent), transparent 65%);
        }
        .dungeon-insight svg {
          grid-row: span 3;
          color: var(--text-accent);
          margin-top: 0.1rem;
        }
        .dungeon-insight span,
        .dungeon-insight strong,
        .dungeon-insight small {
          grid-column: 2;
          min-width: 0;
        }
        .dungeon-insight strong {
          line-height: 1.15;
        }
        .dungeon-insight small {
          display: block;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .dungeon-insight.passive {
          cursor: default;
        }
        .dungeon-insight.passive:hover {
          transform: none;
        }
        .dungeon-table-wrapper {
          margin-top: 1rem;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .dungeon-table {
          max-width: 100%;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scrollbar-gutter: stable both-edges;
          -webkit-overflow-scrolling: touch;
        }
        .dungeon-table th,
        .dungeon-table td {
          vertical-align: middle;
        }
        .dungeon-sort-button {
          width: 100%;
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          cursor: pointer;
          padding: 0;
        }
        .dungeon-table th.left-align .dungeon-sort-button {
          justify-content: flex-start;
        }
        .dungeon-sort-button:focus-visible {
          outline: none;
          color: #fff;
          text-shadow: 0 0 12px rgba(56,189,248,0.7);
        }
        .dungeon-table table {
          width: max(100%, 1060px);
          min-width: 1060px;
        }
        .dungeon-completed-input,
        .dungeon-mobile-completed input {
          width: 6.5rem;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-base);
          color: #fff;
          padding: 0.45rem 0.55rem;
          font-family: var(--font-mono);
          font-size: 0.82rem;
        }
        .dungeon-name-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        .dungeon-open-button {
          width: 100%;
          min-height: 44px;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          padding: 0;
        }
        .dungeon-open-button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
          border-radius: 8px;
        }
        .dungeon-name-cell img {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          flex: 0 0 auto;
        }
        .dungeon-name-cell div {
          min-width: 0;
        }
        .dungeon-name-cell span,
        .dungeon-name-cell strong {
          color: #fff;
          overflow-wrap: anywhere;
        }
        .dungeon-name-cell small {
          display: block;
          color: var(--text-muted);
          margin-top: 0.2rem;
          font-size: 0.7rem;
        }
        .dungeon-readiness {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          max-width: 13rem;
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          border: 1px solid var(--border-subtle);
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: normal;
        }
        .dungeon-readiness.ready {
          color: #86efac;
          border-color: rgba(34,197,94,0.28);
          background: rgba(34,197,94,0.1);
        }
        .dungeon-readiness.blocked {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.26);
          background: rgba(239,68,68,0.09);
        }
        .dungeon-readiness.neutral {
          color: var(--text-muted);
          background: rgba(255,255,255,0.03);
        }
        .dungeon-mobile-grid {
          display: grid;
          gap: 0.75rem;
        }
        .dungeon-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          min-height: 8rem;
          padding: 1.25rem;
          color: var(--text-muted);
          text-align: center;
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
        }
        .dungeon-empty-state strong {
          color: #fff;
          font-size: 0.95rem;
        }
        .dungeon-empty-state span {
          font-size: 0.8rem;
        }
        .dungeon-card {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
          padding: 0.9rem;
          text-align: left;
          color: inherit;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
        }
        .dungeon-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .dungeon-card-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .dungeon-card-stats span {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding: 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255,255,255,0.02);
        }
        .dungeon-card-stats small {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .dungeon-card-stats strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .dungeon-mobile-completed {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.6fr);
          align-items: center;
          gap: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .dungeon-modal {
          max-width: min(980px, calc(100vw - 2rem));
          max-height: min(90dvh, calc(100dvh - 2rem));
        }
        .modal-overlay:has(.dungeon-modal) {
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: max(1rem, env(safe-area-inset-top)) clamp(0.75rem, 2vw, 1.5rem) max(1rem, env(safe-area-inset-bottom));
        }
        .dungeon-modal-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
        }
        .dungeon-modal-title img {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          object-fit: cover;
          flex: 0 0 auto;
        }
        .dungeon-modal-title h2 {
          margin: 0;
          overflow-wrap: anywhere;
        }
        .dungeon-modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.5rem;
        }
        .dungeon-modal-tags span {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          min-width: 0;
          max-width: 100%;
          border: 1px solid var(--border-subtle);
          border-radius: 5px;
          color: var(--text-muted);
          background: rgba(255,255,255,0.03);
          padding: 0.2rem 0.5rem;
          font-size: 0.75rem;
          overflow-wrap: anywhere;
          white-space: normal;
        }
        .dungeon-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .dungeon-modal-panel {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 1rem;
        }
        .dungeon-modal-panel h3,
        .dungeon-loot-heading {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 0.75rem;
          color: var(--text-accent);
          font-size: 0.86rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .dungeon-model-note {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 650;
          line-height: 1.45;
          margin: -0.25rem 0 0.55rem;
        }
        .dungeon-detail-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.45rem 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .dungeon-detail-row span {
          color: var(--text-muted);
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .dungeon-detail-row strong {
          color: #fff;
          min-width: 0;
          overflow-wrap: anywhere;
          text-align: right;
        }
        .dungeon-loot-heading {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }
        .dungeon-loot-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .dungeon-loot-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(10rem, auto);
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          color: inherit;
          text-align: left;
          cursor: pointer;
        }
        .dungeon-loot-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        .dungeon-loot-main img {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          object-fit: cover;
          flex: 0 0 auto;
        }
        .dungeon-loot-main strong {
          color: #fff;
          overflow-wrap: anywhere;
        }
        .dungeon-loot-main span,
        .dungeon-loot-main small {
          color: var(--text-muted);
        }
        .dungeon-loot-main small {
          display: block;
          margin-top: 0.2rem;
        }
        .dungeon-loot-value {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
          min-width: 9rem;
          text-align: right;
        }
        .dungeon-loot-value strong {
          color: var(--text-success);
        }
        .dungeon-loot-value span {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-muted);
          font-size: 0.72rem;
        }
        .dungeon-loot-value small {
          display: block;
          color: var(--text-muted);
          font-size: 0.66rem;
          line-height: 1.25;
        }
        .dungeon-loot-value .dungeon-market-note {
          color: #fde68a;
        }
        .dungeon-loot-value .dungeon-market-note.thin,
        .dungeon-loot-value .dungeon-market-note.risk,
        .dungeon-loot-value .dungeon-market-note.none {
          color: #fca5a5;
        }
        .dungeon-loot-value .dungeon-market-note.steady,
        .dungeon-loot-value .dungeon-market-note.active {
          color: #bfdbfe;
        }
        .dungeon-chest-breakdown {
          grid-column: 1 / -1;
          display: grid;
          gap: 0.55rem;
          padding: 0.8rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-radius: 7px;
          background: rgba(56,189,248,0.045);
        }
        .dungeon-chest-summary,
        .dungeon-chest-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(9rem, auto);
          align-items: center;
          gap: 0.75rem;
        }
        .dungeon-chest-summary {
          padding-bottom: 0.55rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .dungeon-chest-summary strong {
          color: var(--text-accent);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .dungeon-chest-summary small,
        .dungeon-chest-row small {
          display: block;
          margin-top: 0.15rem;
          color: var(--text-muted);
          font-size: 0.66rem;
          line-height: 1.25;
        }
        .dungeon-chest-summary em {
          justify-self: end;
          color: #fff;
          font-style: normal;
          font-family: var(--font-mono);
          font-weight: 900;
        }
        .dungeon-chest-row {
          padding: 0.55rem 0.65rem;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          background: rgba(0,0,0,0.14);
        }
        .dungeon-chest-row strong {
          color: #fff;
          overflow-wrap: anywhere;
        }
        .dungeon-chest-row em {
          justify-self: end;
          color: var(--text-success);
          font-style: normal;
          font-family: var(--font-mono);
          font-weight: 900;
          white-space: nowrap;
        }
        .dungeon-chest-row span:last-child {
          text-align: right;
        }
        @media (max-width: 1100px) {
          .dungeon-planner {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .dungeon-planner {
            grid-template-areas:
              "search search"
              "action playtime"
              "profit efficiency"
              "mf completion"
              "event event"
              "filter filter"
              "toggle toggle";
          }
          .dungeon-command {
            grid-template-columns: 1fr;
          }
          .dungeon-command-stats,
          .dungeon-insights {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .dungeon-modifier-panel,
          .dungeon-valuation-panel,
          .dungeon-modifier-pickers,
          .dungeon-valuation-controls {
            grid-template-columns: 1fr;
          }
          .dungeon-advanced-row {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 1101px) and (max-width: 1500px) {
          .dungeon-planner {
            grid-template-columns: minmax(16rem, 1.6fr) repeat(4, minmax(0, 1fr));
            grid-template-areas:
              "search action playtime profit efficiency"
              "mf completion event filter toggle";
          }
          .dungeon-modifier-pickers {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .dungeon-command,
          .dungeon-planner {
            padding: 0.85rem;
          }
          .dungeon-planner {
            gap: 0.6rem;
          }
          .dungeon-command-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.5rem;
          }
          .dungeon-command-stats div {
            padding: 0.65rem;
          }
          .dungeon-command-stats span {
            font-size: 0.6rem;
            letter-spacing: 0.06em;
          }
          .dungeon-command-stats strong {
            font-size: 0.86rem;
            line-height: 1.2;
          }
          .dungeon-insights,
          .dungeon-modal-grid {
            grid-template-columns: 1fr;
          }
          .dungeon-valuation-panel {
            padding: 0.8rem;
          }
          .dungeon-modifier-panel {
            padding: 0.8rem;
          }
          .dungeon-valuation-segmented {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .dungeon-card-top,
          .dungeon-loot-row {
            align-items: stretch;
          }
          .dungeon-card-top {
            flex-direction: column;
          }
          .dungeon-loot-row {
            grid-template-columns: 1fr;
          }
          .dungeon-card-stats {
            grid-template-columns: 1fr;
          }
          .dungeon-loot-value {
            align-items: flex-start;
            min-width: 0;
            text-align: left;
          }
          .dungeon-chest-summary,
          .dungeon-chest-row {
            grid-template-columns: 1fr;
          }
          .dungeon-chest-summary em,
          .dungeon-chest-row em,
          .dungeon-chest-row span:last-child {
            justify-self: start;
            text-align: left;
          }
          .dungeon-readiness {
            width: fit-content;
            max-width: 100%;
          }
          .dungeon-detail-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.2rem;
          }
          .dungeon-detail-row strong {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}

function DungeonItemEffectPicker({
  ariaLabel,
  emptyLabel,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  emptyLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: DungeonItemModifier[];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"down" | "up">("down");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.name === value) || null;

  const focusOption = (index: number) => {
    window.requestAnimationFrame(() => {
      optionRefs.current[index]?.focus();
    });
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectedIndex = Math.max(0, options.findIndex((option) => option.name === value) + 1);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    focusOption(event.key === "ArrowUp" ? options.length : selectedIndex);
  };

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const optionCount = options.length + 1;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption((index + 1) % optionCount);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption((index - 1 + optionCount) % optionCount);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusOption(optionCount - 1);
    }
  };

  useEffect(() => {
    if (!open) return;
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (triggerRect) {
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      setMenuPlacement(spaceBelow < 280 && spaceAbove > spaceBelow ? "up" : "down");
    }
    const handlePointer = (event: MouseEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={`dungeon-effect-picker ${open ? "open" : ""} ${menuPlacement === "up" ? "drop-up" : ""}`} ref={pickerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="dungeon-effect-trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>
          <small>{label}</small>
          <strong>{selected?.name || emptyLabel}</strong>
          <em>{selected ? getDungeonItemModifierSummary(selected) : "No item effect applied."}</em>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="dungeon-effect-menu" role="listbox" aria-label={ariaLabel}>
          <button
            type="button"
            ref={(node) => { optionRefs.current[0] = node; }}
            className={`dungeon-effect-option ${!value ? "active" : ""}`}
            role="option"
            aria-selected={!value}
            onKeyDown={(event) => handleOptionKeyDown(event, 0)}
            onClick={() => selectOption("")}
          >
            <span className="dungeon-effect-icon-placeholder" aria-hidden="true" />
            <span>
              <strong>{emptyLabel}</strong>
              <small>Use only the profile/manual field.</small>
            </span>
            {!value && <Check size={14} />}
          </button>
          {options.map((option, index) => {
            const active = option.name === value;
            return (
              <button
                type="button"
                ref={(node) => { optionRefs.current[index + 1] = node; }}
                className={`dungeon-effect-option ${active ? "active" : ""}`}
                key={option.name}
                role="option"
                aria-selected={active}
                onKeyDown={(event) => handleOptionKeyDown(event, index + 1)}
                onClick={() => selectOption(option.name)}
              >
                {option.imageUrl ? <img src={option.imageUrl} alt="" /> : <span className="dungeon-effect-icon-placeholder" aria-hidden="true" />}
                <span>
                  <strong>{option.name}</strong>
                  <small>{option.quality} {option.type}</small>
                </span>
                <em>{getDungeonItemModifierSummary(option)}</em>
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DungeonsPage() {
  return (
    <Suspense fallback={<div>Loading Dungeons...</div>}>
      <DungeonsContent />
    </Suspense>
  );
}
