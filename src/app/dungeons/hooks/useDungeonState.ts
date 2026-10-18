"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  getProfileBaseIdleActionHours,
} from "@/lib/housing";
import type { LoreNameInput } from "@/lib/lore-links";
import {
  DUNGEON_COMPLETIONS_STORAGE_KEY,
  EVENT_DUNGEON_COMPLETIONS_STORAGE_KEY,
  DUNGEON_ITEM_MODIFIERS_STORAGE_KEY,
  EMPTY_DUNGEON_ITEM_MODIFIERS,
  type DungeonDropValuationMode,
  type DungeonItemModifierSelections,
  type ReadinessFilter,
  type ValuedDungeonRow,
  getConfirmedDungeonItemModifiers,
  getDungeonKey,
  getDungeonLengthMinutes,
  getHousingDungeonHoursForDungeon,
  getHousingDungeonScopeText,
  getOptionalNumber,
  getProfileIdleActionHoursForDungeon,
  getReadinessText,
  getStoredDungeonModifierSelections,
  getTradeableTemporaryModifiers,
  isSpecialEquipmentModifier,
  normalizeCompletionCount,
  resolveDungeonDropValue,
} from "../types";

export function useDungeonState() {
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

  const [completionsLoadedKey, setCompletionsLoadedKey] = useState<string | null>(null);
  const completionsLoadedKeyRef = useRef<string | null>(null);
  completionsLoadedKeyRef.current = completionsLoadedKey;

  const [eventLoadedKey, setEventLoadedKey] = useState<string | null>(null);
  const eventLoadedKeyRef = useRef<string | null>(null);
  eventLoadedKeyRef.current = eventLoadedKey;

  const [itemModifiersLoadedKey, setItemModifiersLoadedKey] = useState<string | null>(null);
  const itemModifiersLoadedKeyRef = useRef<string | null>(null);
  itemModifiersLoadedKeyRef.current = itemModifiersLoadedKey;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(completionsStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(DUNGEON_COMPLETIONS_STORAGE_KEY));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setCompletedRunsByDungeon(parsed);
        } else {
          setCompletedRunsByDungeon({});
        }
      } else {
        setCompletedRunsByDungeon({});
      }
    } catch {
      setCompletedRunsByDungeon({});
    } finally {
      setCompletionsLoadedKey(completionsStorageKey);
      completionsLoadedKeyRef.current = completionsStorageKey;
    }
  }, [activeProfile?.id, completionsStorageKey]);

  useEffect(() => {
    if (completionsLoadedKey !== completionsStorageKey) return;
    if (completionsLoadedKeyRef.current !== completionsStorageKey) return;
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(completionsStorageKey, JSON.stringify(completedRunsByDungeon));
      } catch {}
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      try {
        if (completionsLoadedKey === completionsStorageKey && completionsLoadedKeyRef.current === completionsStorageKey) {
          localStorage.setItem(completionsStorageKey, JSON.stringify(completedRunsByDungeon));
        }
      } catch {}
    };
  }, [completedRunsByDungeon, completionsLoadedKey, completionsStorageKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(eventCompletionsStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(EVENT_DUNGEON_COMPLETIONS_STORAGE_KEY));
      if (!stored) {
        setEventDungeonCompletionCount("");
      } else {
        const parsed = normalizeCompletionCount(JSON.parse(stored));
        setEventDungeonCompletionCount(parsed > 0 ? parsed : "");
      }
    } catch {
      setEventDungeonCompletionCount("");
    } finally {
      setEventLoadedKey(eventCompletionsStorageKey);
      eventLoadedKeyRef.current = eventCompletionsStorageKey;
    }
  }, [activeProfile?.id, eventCompletionsStorageKey]);

  useEffect(() => {
    if (eventLoadedKey !== eventCompletionsStorageKey) return;
    if (eventLoadedKeyRef.current !== eventCompletionsStorageKey) return;
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(eventCompletionsStorageKey, JSON.stringify(normalizeCompletionCount(eventDungeonCompletionCount)));
      } catch {}
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      try {
        if (eventLoadedKey === eventCompletionsStorageKey && eventLoadedKeyRef.current === eventCompletionsStorageKey) {
          localStorage.setItem(eventCompletionsStorageKey, JSON.stringify(normalizeCompletionCount(eventDungeonCompletionCount)));
        }
      } catch {}
    };
  }, [eventDungeonCompletionCount, eventLoadedKey, eventCompletionsStorageKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(itemModifiersStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(DUNGEON_ITEM_MODIFIERS_STORAGE_KEY));
      setDungeonItemModifierSelections(getStoredDungeonModifierSelections(stored));
    } catch {
      setDungeonItemModifierSelections({ ...EMPTY_DUNGEON_ITEM_MODIFIERS });
    } finally {
      setItemModifiersLoadedKey(itemModifiersStorageKey);
      itemModifiersLoadedKeyRef.current = itemModifiersStorageKey;
    }
  }, [activeProfile?.id, itemModifiersStorageKey]);

  useEffect(() => {
    if (itemModifiersLoadedKey !== itemModifiersStorageKey) return;
    if (itemModifiersLoadedKeyRef.current !== itemModifiersStorageKey) return;
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(itemModifiersStorageKey, JSON.stringify(dungeonItemModifierSelections));
      } catch {}
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      try {
        if (itemModifiersLoadedKey === itemModifiersStorageKey && itemModifiersLoadedKeyRef.current === itemModifiersStorageKey) {
          localStorage.setItem(itemModifiersStorageKey, JSON.stringify(dungeonItemModifierSelections));
        }
      } catch {}
    };
  }, [dungeonItemModifierSelections, itemModifiersLoadedKey, itemModifiersStorageKey]);

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
    if (!allItemsDb || Object.keys(allItemsDb).length === 0) return;
    setDungeonItemModifierSelections((current) => {
      const next = { ...current };
      if (next.efficiencyItem && dungeonEfficiencyItemOptions.length > 0 && !dungeonEfficiencyItemOptions.some((item) => item.name === next.efficiencyItem)) {
        next.efficiencyItem = "";
      }
      if (next.magicFindItem && dungeonMagicFindItemOptions.length > 0 && !dungeonMagicFindItemOptions.some((item) => item.name === next.magicFindItem)) {
        next.magicFindItem = "";
      }
      return next.efficiencyItem === current.efficiencyItem && next.magicFindItem === current.magicFindItem
        ? current
        : next;
    });
  }, [allItemsDb, dungeonEfficiencyItemOptions, dungeonMagicFindItemOptions]);

  const rows = useMemo(() => {
    if (!staticData?.dungeons || !marketData || !allItemsDb) return [];
    const calculated: ValuedDungeonRow[] = [];
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
      const matchesProfit = minimumProfit === "" || !Number.isFinite(Number(minimumProfit)) || row.netProfitPerRun >= Number(minimumProfit);
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
      if (typeof valA === "string" || typeof valB === "string") {
        const strA = String(valA ?? "");
        const strB = String(valB ?? "");
        return sortDesc ? strB.localeCompare(strA) : strA.localeCompare(strB);
      }
      valA = Number(valA);
      valB = Number(valB);
      if (!Number.isFinite(valA) && !Number.isFinite(valB)) return 0;
      if (!Number.isFinite(valA)) return 1;
      if (!Number.isFinite(valB)) return -1;
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
    const bestProfit = rows.reduce((best, row) => row.netProfitPerRun > (best?.netProfitPerRun ?? -Infinity) ? row : best, null as ValuedDungeonRow | null);
    const bestReady = readyRows.reduce((best, row) => row.netProfitPerRun > (best?.netProfitPerRun ?? -Infinity) ? row : best, null as ValuedDungeonRow | null);
    const cheapest = rows.reduce((best, row) => row.entryCost < (best?.entryCost ?? Infinity) ? row : best, null as ValuedDungeonRow | null);
    const sensitiveRows = rows.filter((row) => Number(row.marketSensitiveDropCount || 0) > 0);
    const sensitiveDropCount = sensitiveRows.reduce((total, row) => total + Number(row.marketSensitiveDropCount || 0), 0);
    return { readyRows, bestProfit, bestReady, cheapest, sensitiveRows, sensitiveDropCount };
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

  const heroDungeon = summary.bestReady ?? summary.bestProfit;
  const heroModeLabel = summary.bestReady
    ? "Top ready EV/run"
    : summary.bestProfit
      ? "Top visible EV/run"
      : "Dungeon planning";
  const heroReason = summary.bestReady
    ? `Showing the highest expected-value dungeon that ${activeProfile?.name || "the active profile"} can enter in the current filters.`
    : summary.bestProfit
      ? "Showing the highest expected-value dungeon in the current filters; it may still be blocked by profile requirements."
      : "Use the filters below to compare entry cost, loot EV, shard value, action capacity, and magic-find EV.";

  const selectedDungeonLoreNames = useMemo<LoreNameInput[]>(() => {
    if (!selectedDungeon) return [];
    return [
      { name: selectedDungeon.name, source: "entity" },
      { name: selectedDungeon.location?.name, source: "location" },
      ...(selectedDungeon.lootDetails || []).map((drop: any) => ({ name: drop.name, source: "drop" as const })),
    ];
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

  const getSortDirection = (col: string): "ascending" | "descending" | "none" => {
    if (sortCol !== col) return "none";
    return sortDesc ? "descending" : "ascending";
  };

  const openDungeon = (dungeonOrKey: string | ValuedDungeonRow) => {
    const key = typeof dungeonOrKey === "string" ? dungeonOrKey : getDungeonKey(dungeonOrKey);
    setSelectedDungeonKey(key);
  };

  const closeDungeon = () => {
    setSelectedDungeonKey(null);
  };

  const updateCompletedRuns = (dungeonKey: string, value: number | "") => {
    const safeValue = value === "" ? "" : Math.max(0, Math.floor(Number(value) || 0));
    setCompletedRunsByDungeon((current) => ({ ...current, [dungeonKey]: safeValue }));
  };

  return {
    activeProfile,
    router,
    searchParams,
    rows,
    totalDungeonCount: staticData?.dungeons?.length || 0,
    selectedDungeonKey,
    setSelectedDungeonKey,
    selectedDungeon,
    dungeonDialogRef,
    openDungeon,
    closeDungeon,
    sortCol,
    setSortCol,
    sortDesc,
    setSortDesc,
    handleSort,
    getSortDirection,
    searchTerm,
    setSearchTerm,
    readinessFilter,
    setReadinessFilter,
    minimumProfit,
    setMinimumProfit,
    dungeonEfficiency,
    setDungeonEfficiency,
    dungeonMagicFind,
    setDungeonMagicFind,
    dropValuationMode,
    setDropValuationMode,
    manualSensitiveDropValue,
    setManualSensitiveDropValue,
    completedRunsByDungeon,
    setCompletedRunsByDungeon,
    updateCompletedRuns,
    eventDungeonCompletionCount,
    setEventDungeonCompletionCount,
    dungeonItemModifierSelections,
    setDungeonItemModifierSelections,
    includeMagicFindEv,
    setIncludeMagicFindEv,
    completionMagicFindBonus,
    listedCompletionMagicFindBonus,
    eventCompletionMagicFindBonus,
    dungeonEfficiencyItemOptions,
    dungeonMagicFindItemOptions,
    selectedDungeonEfficiencyItem,
    selectedDungeonMagicFindItem,
    itemEfficiencyBonus,
    itemMagicFindBonus,
    equippedDungeonSpecialMagicFind,
    summary,
    actionLimitSummary,
    heroDungeon,
    heroModeLabel,
    heroReason,
    selectedDungeonLoreNames,
    openLoreThread,
    openItemByName,
    prefetchItem,
    getHousingDungeonScopeText: () => getHousingDungeonScopeText(activeProfile),
  };
}

export type DungeonState = ReturnType<typeof useDungeonState>;
