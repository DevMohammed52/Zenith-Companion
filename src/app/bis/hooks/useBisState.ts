"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { useProfiles } from "@/lib/profiles";
import { useToast } from "@/components/ui/Toast";
import { getQualityRank } from "@/lib/quality";
import {
  PRIORITIES,
  SEARCH_ALIASES,
  STYLE_OPTIONS,
  activeStyleSlots,
  clampTier,
  compareBestGear,
  compareStats,
  evaluateScore,
  getPrice,
  getRequirementLevel,
  normalizeCombatStyle,
  numberValue,
  profileSlotForType,
  requirementStatus,
  slotLabel,
  totalPositiveStats,
  type AdvisorSortKey,
  type BisTab,
  type CombatStyle,
  type Direction,
  type GearItem,
  type GearType,
  type GearView,
  type Priority,
  type SortKey,
} from "../types";
import {
  buildNextBestUpgrades,
  buildPerSlotBestUpgrades,
  calculateGearStatsAtTier,
  calculateUpgradeCostBetweenTiers,
  computeOptimalTierAnalysis,
  getActiveEquippedBaselines,
  normalizeCombatCatalog,
  type OptimalTierAnalysis,
  type TierMode,
} from "../utils/bis-math";

const VALID_SLOTS = new Set<GearType>([
  "SWORD",
  "DAGGER",
  "BOW",
  "SHIELD",
  "HELMET",
  "CHESTPLATE",
  "GREAVES",
  "BOOTS",
  "GAUNTLETS",
]);

function matchesQuery(item: GearItem, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  const tokens = query.split(/\s+/).filter(Boolean);
  const statText = Object.keys(item.stats || {})
    .map((key) => key.replace(/_/g, " "))
    .join(" ")
    .toLowerCase();
  const baseText = `${item.name} ${item.type} ${slotLabel(item.type)} ${item.quality} ${statText}`.toLowerCase();
  return tokens.every((token) => {
    const aliases = SEARCH_ALIASES[token] || [];
    return baseText.includes(token) || aliases.some((alias) => baseText.includes(alias));
  });
}

export interface TableGearRow {
  view: GearView;
  optimal: OptimalTierAnalysis | undefined;
  overallRank: number;
  qualityRank: number;
  goldPerStat: number | null;
  totalBuildCost: number | null;
  stoneCostToTier: number;
  isEquipped: boolean;
  equippedTier: number | null;
  equippedSlotLabel: string | null;
}

export function useBisState() {
  const { marketData, allItemsDb, loading: dataLoading, ensureMarketLoaded } = useData();
  const { activeProfile, updateProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const { toast } = useToast();

  const [fallbackCatalog, setFallbackCatalog] = useState<GearItem[]>([]);
  const [fallbackError, setFallbackError] = useState(false);

  // Page navigation & overlays
  const [activeTab, setActiveTab] = useState<BisTab>("table");
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Local What-If loadout overrides (never mutates saved profile automatically)
  const [whatIfStyle, setWhatIfStyle] = useState<CombatStyle | null>(null);
  const [whatIfLevels, setWhatIfLevels] = useState<Partial<{
    combat: number;
    strength: number;
    dexterity: number;
    defence: number;
  }> | null>(null);
  const [priority, setPriority] = useState<Priority>("balanced");
  const [tierMode, setTierMode] = useState<TierMode>("base");

  // Gear Table controls (always scoped to one clean gear slot)
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [slotFilter, setSlotFilter] = useState<GearType>("SWORD");
  const [usableOnly, setUsableOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("stats");
  const [direction, setDirection] = useState<Direction>("desc");

  // Compare Modal state
  const [selectedId, setSelectedId] = useState("");
  const [candidateTier, setCandidateTier] = useState<number>(1);
  const [compareTier, setCompareTier] = useState<number>(1);
  const [daggerSlotTarget, setDaggerSlotTarget] = useState<"weapon" | "offhandWeapon">("weapon");

  // Next Upgrades controls (1 row per equipped slot)
  const [advisorKindFilter, setAdvisorKindFilter] = useState<"all" | "upgrade" | "equip">("all");
  const [advisorSort, setAdvisorSort] = useState<AdvisorSortKey>("efficiency");
  const [advisorIncludeLocked, setAdvisorIncludeLocked] = useState(false);
  const [advisorBudget, setAdvisorBudget] = useState<string>("all");
  const [advisorCustomBudget, setAdvisorCustomBudget] = useState<number>(2_000_000);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void ensureMarketLoaded();
  }, [ensureMarketLoaded]);

  useEffect(() => {
    setWhatIfStyle(null);
    setWhatIfLevels(null);
  }, [activeProfile?.id]);

  // Keep default weapon slot synced with profile combat style until user manually picks another slot
  const userPickedSlotRef = useRef(false);
  const savedCombatStyle = normalizeCombatStyle(activeProfile?.combatStyle);
  const activeCombatStyle = whatIfStyle ?? savedCombatStyle;

  useEffect(() => {
    if (userPickedSlotRef.current) return;
    if (activeCombatStyle === "dualDaggers") setSlotFilter("DAGGER");
    else if (activeCombatStyle === "bow") setSlotFilter("BOW");
    else setSlotFilter("SWORD");
  }, [activeCombatStyle]);

  useEffect(() => {
    if (allItemsDb && Object.keys(allItemsDb).length > 0) return;
    let active = true;
    fetch("/gear-data.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Missing gear-data"))))
      .then((raw) => {
        if (!active || !raw || typeof raw !== "object") return;
        const list = Array.isArray(raw) ? raw : Object.values(raw);
        setFallbackCatalog(list as GearItem[]);
      })
      .catch(() => {
        if (active) setFallbackError(true);
      });
    return () => {
      active = false;
    };
  }, [allItemsDb]);

  // URL hydration
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "table" || tabParam === "explorer") setActiveTab("table");
    else if (tabParam === "upgrades" || tabParam === "advisor") setActiveTab("upgrades");

    const slotParam = params.get("slot")?.toUpperCase() as GearType | undefined;
    if (slotParam && VALID_SLOTS.has(slotParam)) {
      userPickedSlotRef.current = true;
      setSlotFilter(slotParam);
    }

    const tierParam = params.get("tierMode") as TierMode | null;
    if (tierParam === "base" || tierParam === "optimal" || tierParam === "max") setTierMode(tierParam);

    const itemParam = params.get("item");
    if (itemParam) setSelectedId(itemParam);
    const qParam = params.get("q");
    if (qParam) setSearch(qParam);
  }, []);

  // URL sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (activeTab === "table") params.delete("tab");
    else params.set("tab", activeTab);

    params.set("slot", slotFilter);

    if (tierMode === "base") params.delete("tierMode");
    else params.set("tierMode", tierMode);

    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");

    if (isCompareOpen && selectedId) params.set("item", selectedId);
    else params.delete("item");

    const qs = params.toString();
    const targetUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (targetUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [activeTab, slotFilter, tierMode, search, isCompareOpen, selectedId]);

  const combatItems = useMemo(
    () => normalizeCombatCatalog(allItemsDb, fallbackCatalog),
    [allItemsDb, fallbackCatalog],
  );

  const catalogByName = useMemo(() => {
    const map: Record<string, GearItem> = {};
    for (const item of combatItems) {
      map[item.name.toLowerCase()] = item;
    }
    return map;
  }, [combatItems]);

  const itemsByType = useMemo(() => {
    const grouped: Record<string, GearItem[]> = {};
    for (const item of combatItems) {
      const t = String(item.type).toUpperCase();
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(item);
    }
    return grouped;
  }, [combatItems]);

  const savedLevels = useMemo(
    () => ({
      combat: Math.max(1, numberValue(activeProfile?.levels?.combat) || 1),
      strength: Math.max(1, numberValue(activeProfile?.levels?.strength) || 1),
      dexterity: Math.max(1, numberValue(activeProfile?.levels?.dexterity) || 1),
      defence: Math.max(1, numberValue(activeProfile?.levels?.defence) || 1),
    }),
    [activeProfile],
  );

  const levels = useMemo(
    () => ({
      combat: whatIfLevels?.combat ?? savedLevels.combat,
      strength: whatIfLevels?.strength ?? savedLevels.strength,
      dexterity: whatIfLevels?.dexterity ?? savedLevels.dexterity,
      defence: whatIfLevels?.defence ?? savedLevels.defence,
    }),
    [savedLevels, whatIfLevels],
  );

  const hasWhatIfChanges = Boolean(
    whatIfStyle !== null ||
      (whatIfLevels &&
        ((whatIfLevels.combat !== undefined && whatIfLevels.combat !== savedLevels.combat) ||
          (whatIfLevels.strength !== undefined && whatIfLevels.strength !== savedLevels.strength) ||
          (whatIfLevels.dexterity !== undefined && whatIfLevels.dexterity !== savedLevels.dexterity) ||
          (whatIfLevels.defence !== undefined && whatIfLevels.defence !== savedLevels.defence))),
  );

  const resetToProfile = () => {
    setWhatIfStyle(null);
    setWhatIfLevels(null);
    userPickedSlotRef.current = false;
    toast.info("Reset loadout levels and combat style to your saved profile.");
  };

  const updateWhatIfLevel = (key: "combat" | "strength" | "dexterity" | "defence", val: number) => {
    const clean = Math.max(1, Math.min(120, Math.round(Number(val || 1))));
    setWhatIfLevels((prev) => ({ ...(prev || {}), [key]: clean }));
  };

  const optimalByItemId = useMemo(() => {
    const map: Record<string, OptimalTierAnalysis> = {};
    for (const item of combatItems) {
      const peers = itemsByType[String(item.type).toUpperCase()] || [];
      map[item.hashed_id] = computeOptimalTierAnalysis(item, peers, priority, marketData, allItemsDb);
    }
    return map;
  }, [combatItems, itemsByType, priority, marketData, allItemsDb]);

  // Equipped baselines across active style slots (including offhandWeapon for Dual Daggers)
  const equippedBaselines = useMemo(
    () => getActiveEquippedBaselines(activeProfile, activeCombatStyle, catalogByName, priority),
    [activeProfile, activeCombatStyle, catalogByName, priority],
  );

  const equippedLookup = useMemo(() => {
    const map = new Map<string, { tier: number; label: string; slotKey: string }>();
    for (const base of equippedBaselines) {
      if (base.item) {
        map.set(base.item.hashed_id, { tier: base.tier, label: base.label, slotKey: base.slotKey });
      }
    }
    return map;
  }, [equippedBaselines]);

  // Build ranked rows strictly for the selected slot tab (clean, fast, zero mixed-column clutter)
  const slotGearRows = useMemo<TableGearRow[]>(() => {
    const rawSlotItems = itemsByType[slotFilter] || [];

    const evaluated = rawSlotItems.map((item) => {
      const opt = optimalByItemId[item.hashed_id];
      const maxTier = Math.max(1, Number(item.max_tier || 1));
      const effectiveTier =
        tierMode === "max"
          ? maxTier
          : tierMode === "optimal"
            ? opt?.optimalTier || 1
            : 1;
      const stats = calculateGearStatsAtTier(item, effectiveTier);
      const statTotal = totalPositiveStats(stats);
      const weightedStats = evaluateScore(stats, priority);
      const requirementLevel = getRequirementLevel(item);
      const unmet = requirementStatus(item, levels);
      const priceInfo = getPrice(item, marketData);
      const upgSummary = calculateUpgradeCostBetweenTiers(item, 1, effectiveTier, marketData, allItemsDb);
      const marketBuy = priceInfo.label === "Market" && priceInfo.value ? priceInfo.value : null;
      const totalBuildCost =
        marketBuy !== null && upgSummary.hasAllPrices ? marketBuy + upgSummary.totalStoneCost : null;
      const goldPerStat =
        totalBuildCost !== null && statTotal > 0 ? totalBuildCost / statTotal : null;

      const view: GearView = {
        item,
        stats,
        weightedStats,
        statTotal,
        requirementLevel,
        eligible: unmet.length === 0,
        unmet,
        price: priceInfo.value,
        priceLabel: priceInfo.label,
        effectiveTier,
      };

      const equippedMeta = equippedLookup.get(item.hashed_id);

      return {
        view,
        optimal: opt,
        overallRank: 0,
        qualityRank: 0,
        goldPerStat,
        totalBuildCost,
        stoneCostToTier: upgSummary.totalStoneCost,
        isEquipped: Boolean(equippedMeta),
        equippedTier: equippedMeta?.tier ?? null,
        equippedSlotLabel: equippedMeta?.label ?? null,
      };
    });

    // Assign overall BiS #1..N and per-quality BiS #1..N based on Total Stats in this slot
    const byPower = [...evaluated].sort(
      (a, b) => b.view.statTotal - a.view.statTotal || compareBestGear(a.view, b.view),
    );
    const qualityCounters: Record<string, number> = {};
    byPower.forEach((row, index) => {
      row.overallRank = index + 1;
      const q = String(row.view.item.quality || "STANDARD").toUpperCase();
      qualityCounters[q] = (qualityCounters[q] || 0) + 1;
      row.qualityRank = qualityCounters[q];
    });

    const filtered = evaluated.filter((row) => {
      if (usableOnly && !row.view.eligible) return false;
      return matchesQuery(row.view.item, deferredSearch);
    });

    const mult = direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "stats") {
        return mult * (a.view.statTotal - b.view.statTotal) || a.overallRank - b.overallRank;
      }
      if (sortKey === "price") {
        const ag = a.goldPerStat ?? (direction === "asc" ? Number.MAX_SAFE_INTEGER : -1);
        const bg = b.goldPerStat ?? (direction === "asc" ? Number.MAX_SAFE_INTEGER : -1);
        return mult * (ag - bg) || a.overallRank - b.overallRank;
      }
      if (sortKey === "level") {
        return mult * (a.view.requirementLevel - b.view.requirementLevel) || a.overallRank - b.overallRank;
      }
      if (sortKey === "quality") {
        return (
          mult * (getQualityRank(a.view.item.quality) - getQualityRank(b.view.item.quality)) ||
          a.overallRank - b.overallRank
        );
      }
      return mult * a.view.item.name.localeCompare(b.view.item.name);
    });
  }, [
    itemsByType,
    slotFilter,
    optimalByItemId,
    tierMode,
    priority,
    levels,
    marketData,
    allItemsDb,
    equippedLookup,
    usableOnly,
    deferredSearch,
    sortKey,
    direction,
  ]);

  // Smart 1-row-per-slot Next Upgrades (max 6-7 crisp rows total)
  const effectiveMaxBudget = useMemo<number | null>(() => {
    if (advisorBudget === "all") return null;
    if (advisorBudget === "500k") return 500_000;
    if (advisorBudget === "2m") return 2_000_000;
    if (advisorBudget === "5m") return 5_000_000;
    if (advisorBudget === "custom") return Math.max(0, advisorCustomBudget);
    return null;
  }, [advisorBudget, advisorCustomBudget]);

  const allUpgradeMoves = useMemo(
    () =>
      buildNextBestUpgrades({
        baselines: equippedBaselines,
        allItems: combatItems,
        optimalByItemId,
        levels,
        priority,
        marketData,
        allItemsDb,
        includeLocked: advisorIncludeLocked,
        maxBudget: effectiveMaxBudget,
      }),
    [
      equippedBaselines,
      combatItems,
      optimalByItemId,
      levels,
      priority,
      marketData,
      allItemsDb,
      advisorIncludeLocked,
      effectiveMaxBudget,
    ],
  );

  const filteredMoves = useMemo(
    () =>
      allUpgradeMoves.filter((m) =>
        advisorKindFilter === "all" ? true : m.kind === advisorKindFilter,
      ),
    [allUpgradeMoves, advisorKindFilter],
  );

  const perSlotUpgrades = useMemo(
    () =>
      buildPerSlotBestUpgrades({
        baselines: equippedBaselines,
        moves: filteredMoves,
        sortBy: advisorSort,
      }),
    [equippedBaselines, filteredMoves, advisorSort],
  );

  const actionableUpgradeCount = useMemo(
    () => perSlotUpgrades.filter((row) => row.bestMove !== null).length,
    [perSlotUpgrades],
  );

  // Compare Modal selection
  const selected = useMemo<GearView | null>(() => {
    if (!selectedId) return null;
    const foundItem = combatItems.find(
      (item) =>
        item.hashed_id === selectedId || item.name.toLowerCase() === selectedId.toLowerCase(),
    );
    if (!foundItem) return null;
    const opt = optimalByItemId[foundItem.hashed_id];
    const maxTier = Math.max(1, Number(foundItem.max_tier || 1));
    const effectiveTier =
      tierMode === "max" ? maxTier : tierMode === "optimal" ? opt?.optimalTier || 1 : 1;
    const stats = calculateGearStatsAtTier(foundItem, effectiveTier);
    const unmet = requirementStatus(foundItem, levels);
    const priceInfo = getPrice(foundItem, marketData);

    return {
      item: foundItem,
      stats,
      weightedStats: evaluateScore(stats, priority),
      statTotal: totalPositiveStats(stats),
      requirementLevel: getRequirementLevel(foundItem),
      eligible: unmet.length === 0,
      unmet,
      price: priceInfo.value,
      priceLabel: priceInfo.label,
      effectiveTier,
    };
  }, [selectedId, combatItems, optimalByItemId, tierMode, levels, marketData, priority]);

  const selectedOptimal = useMemo(
    () => (selected ? optimalByItemId[selected.item.hashed_id] || null : null),
    [selected, optimalByItemId],
  );

  const selectedType = selected ? (String(selected.item.type).toUpperCase() as GearType) : undefined;
  const selectedProfileSlot = useMemo(() => {
    if (!selectedType) return "";
    if (selectedType === "DAGGER" && activeCombatStyle === "dualDaggers") return daggerSlotTarget;
    return profileSlotForType(selectedType);
  }, [selectedType, activeCombatStyle, daggerSlotTarget]);

  const currentProfileItem = useMemo(() => {
    if (!activeProfile || !selectedProfileSlot) return undefined;
    const name = activeProfile.gear?.[selectedProfileSlot as keyof typeof activeProfile.gear];
    if (!name) return undefined;
    return catalogByName[name.toLowerCase()];
  }, [activeProfile, selectedProfileSlot, catalogByName]);

  const selectedMaxTier = Math.max(1, Number(selected?.item.max_tier || 1));
  const currentMaxTier = Math.max(1, Number(currentProfileItem?.max_tier || 1));

  useEffect(() => {
    if (!selected) return;
    const optTier = optimalByItemId[selected.item.hashed_id]?.optimalTier || 1;
    const initialTier = tierMode === "max" ? selectedMaxTier : tierMode === "optimal" ? optTier : 1;
    setCandidateTier(Number(clampTier(initialTier, selectedMaxTier) || 1));
  }, [selected?.item.hashed_id, selectedMaxTier, tierMode, optimalByItemId]);

  useEffect(() => {
    const savedTier = selectedProfileSlot ? Number(activeProfile?.gearTiers?.[selectedProfileSlot] || 1) : 1;
    setCompareTier(Number(clampTier(savedTier, currentMaxTier) || 1));
  }, [activeProfile?.id, selectedProfileSlot, currentMaxTier, activeProfile?.gearTiers]);

  const effectiveCandidateTier = Number(clampTier(candidateTier, selectedMaxTier) || 1);
  const effectiveCompareTier = Number(clampTier(compareTier, currentMaxTier) || 1);

  const candidateStatsAtTier = useMemo(
    () => calculateGearStatsAtTier(selected?.item, effectiveCandidateTier),
    [selected?.item, effectiveCandidateTier],
  );
  const currentStatsAtTier = useMemo(
    () => calculateGearStatsAtTier(currentProfileItem, effectiveCompareTier),
    [currentProfileItem, effectiveCompareTier],
  );
  const statComparison = useMemo(
    () => compareStats(candidateStatsAtTier, currentStatsAtTier),
    [candidateStatsAtTier, currentStatsAtTier],
  );

  const candidateUpgradeCost = useMemo(() => {
    const fromTier =
      currentProfileItem && selected?.item.hashed_id === currentProfileItem.hashed_id
        ? Math.min(effectiveCandidateTier, effectiveCompareTier)
        : 1;
    return calculateUpgradeCostBetweenTiers(
      selected?.item,
      fromTier,
      effectiveCandidateTier,
      marketData,
      allItemsDb,
    );
  }, [
    selected?.item,
    currentProfileItem,
    effectiveCandidateTier,
    effectiveCompareTier,
    marketData,
    allItemsDb,
  ]);

  const saveGearToSlot = (item: GearItem, tier: number, slotKey: string) => {
    if (!activeProfile || !slotKey) return;
    const maxTier = Math.max(1, Number(item.max_tier || 1));
    const safeTier = Math.min(maxTier, Math.max(1, Math.round(tier)));
    const existingName = activeProfile.gear?.[slotKey as keyof typeof activeProfile.gear] || "";
    const existingTier = Number(activeProfile.gearTiers?.[slotKey] || 1);
    const isSameItem = existingName.toLowerCase() === item.name.toLowerCase();

    if (isSameItem && existingTier === safeTier) {
      return;
    }

    updateProfile(activeProfile.id, {
      ...activeProfile,
      combatStyle: activeCombatStyle,
      gear: {
        ...activeProfile.gear,
        [slotKey]: item.name,
      },
      gearTiers: {
        ...activeProfile.gearTiers,
        [slotKey]: safeTier,
      },
    });
    toast.success(
      isSameItem
        ? `Updated ${item.name} to T${safeTier} on ${activeProfile.name}.`
        : `Equipped ${item.name} (T${safeTier}) to ${activeProfile.name}.`,
    );
  };

  const unequipSlot = (slotKey: string, itemName?: string) => {
    if (!activeProfile || !slotKey) return;
    updateProfile(activeProfile.id, {
      ...activeProfile,
      combatStyle: activeCombatStyle,
      gear: {
        ...activeProfile.gear,
        [slotKey]: "",
      },
      gearTiers: {
        ...activeProfile.gearTiers,
        [slotKey]: 1,
      },
    });
    toast.info(itemName ? `Removed ${itemName} from ${activeProfile.name}.` : `Cleared ${slotKey} slot.`);
  };

  const toggleEquipFromTable = (item: GearItem, tier: number) => {
    if (!activeProfile) {
      toast.info("Create or select a character profile to save equipped gear.");
      return;
    }
    const maxTier = Math.max(1, Number(item.max_tier || 1));
    const safeTier = Math.min(maxTier, Math.max(1, Math.round(tier)));
    const equippedMeta = equippedLookup.get(item.hashed_id);

    if (equippedMeta) {
      if (equippedMeta.tier === safeTier) {
        unequipSlot(equippedMeta.slotKey, item.name);
      } else {
        saveGearToSlot(item, safeTier, equippedMeta.slotKey);
      }
      return;
    }

    const type = String(item.type).toUpperCase() as GearType;
    const slotKey = profileSlotForType(type);
    if (!slotKey) return;
    saveGearToSlot(item, safeTier, slotKey);
  };

  const openCompareFor = (item: GearItem, initialTier?: number, slotKey?: string) => {
    setSelectedId(item.hashed_id);
    if (slotKey === "offhandWeapon" || slotKey === "weapon") {
      setDaggerSlotTarget(slotKey);
    }
    if (initialTier) {
      setCandidateTier(Math.min(Math.max(1, Number(item.max_tier || 1)), Math.max(1, initialTier)));
    }
    setIsCompareOpen(true);
  };

  const changeSlotTab = (slot: GearType) => {
    userPickedSlotRef.current = true;
    setSlotFilter(slot);
  };

  const equippedTotals = useMemo(() => {
    let totalStats = 0;
    let filledCount = 0;
    for (const s of equippedBaselines) {
      if (s.item) {
        filledCount += 1;
        totalStats += totalPositiveStats(s.stats);
      }
    }
    return {
      totalStats,
      filledCount,
      totalSlots: equippedBaselines.length,
    };
  }, [equippedBaselines]);

  const activeSlots = useMemo(() => activeStyleSlots(activeCombatStyle), [activeCombatStyle]);
  const activeStyleLabel = STYLE_OPTIONS.find((s) => s.id === activeCombatStyle)?.label || "Sword + Shield";
  const priorityLabel = PRIORITIES.find((p) => p.id === priority)?.label || "All Stats";
  const isLoading = dataLoading && combatItems.length === 0 && !fallbackError;

  return {
    combatItems,
    isLoading,
    fallbackError,
    activeTab,
    setActiveTab,
    isLoadoutOpen,
    setIsLoadoutOpen,
    isCompareOpen,
    setIsCompareOpen,
    searchInputRef,

    activeProfile,
    activeProfileName: activeProfile?.name || "Guest Profile",
    activeCombatStyle,
    setCombatStyle: (style: CombatStyle) => {
      userPickedSlotRef.current = false;
      setWhatIfStyle(style);
    },
    activeStyleLabel,
    priority,
    setPriority,
    priorityLabel,
    tierMode,
    setTierMode,
    levels,
    updateWhatIfLevel,
    hasWhatIfChanges,
    resetToProfile,
    activeSlots,
    equippedBaselines,
    equippedTotals,

    // Table tab
    search,
    setSearch,
    slotFilter,
    changeSlotTab,
    usableOnly,
    setUsableOnly,
    sortKey,
    setSortKey,
    direction,
    setDirection,
    slotGearRows,

    // Upgrades tab
    advisorKindFilter,
    setAdvisorKindFilter,
    advisorSort,
    setAdvisorSort,
    advisorIncludeLocked,
    setAdvisorIncludeLocked,
    advisorBudget,
    setAdvisorBudget,
    advisorCustomBudget,
    setAdvisorCustomBudget,
    perSlotUpgrades,
    actionableUpgradeCount,

    // Compare Modal
    selected,
    selectedOptimal,
    selectedType,
    selectedProfileSlot,
    daggerSlotTarget,
    setDaggerSlotTarget,
    currentProfileItem,
    selectedMaxTier,
    currentMaxTier,
    effectiveCandidateTier,
    effectiveCompareTier,
    setCandidateTier,
    setCompareTier,
    candidateStatsAtTier,
    currentStatsAtTier,
    statComparison,
    candidateUpgradeCost,

    // Actions
    saveGearToSlot,
    unequipSlot,
    toggleEquipFromTable,
    openCompareFor,
    openItemByName,
    prefetchGearItem: prefetchItem,
  };
}

export type UseBisStateResult = ReturnType<typeof useBisState>;
