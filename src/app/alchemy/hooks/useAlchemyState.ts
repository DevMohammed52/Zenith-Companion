"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCrafting } from "@/context/CraftingContext";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import {
  PENALTY_CLASSES,
  calculateAlchemyBuffTotals,
  calculateAlchemyRows,
  summarizeAlchemyRows,
  type AlchemyDbItemEntry,
} from "@/lib/alchemy-profit";
import {
  calculateHousingBuffs,
  getProfileBaseIdleActionHours,
} from "@/lib/housing";
import { usePreferences } from "@/lib/preferences";
import {
  getProfileBarteringBoost,
  getProfileConquestRank,
} from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { getProfileSkillLevel, isStarterProfile, useProfiles } from "@/lib/profiles";
import type { AssaultRank } from "@/lib/skill-profit";
import {
  ALCHEMY_SETTINGS_STORAGE_KEY,
  ALCHEMY_SORT_LABELS,
  OWNED_MODE_STORAGE_KEY,
  OWNED_STORAGE_KEY,
  type AlchemyCategory,
  type AlchemyDbItem,
  type AlchemyLiquidityFilter,
  type AlchemyMarketItem,
  type AlchemyRateMode,
  type AlchemyRow,
  type AlchemySortKey,
  type AlchemyViewMode,
  type PersistedAlchemySettings,
  type WhatIfClassOverride,
} from "../types";
import {
  isAlchemyCategory,
  isAlchemyLiquidityFilter,
  isAlchemySortKey,
  makeSearchText,
  readAlchemySettings,
  readOwnedMaterials,
} from "../utils/alchemy-helpers";

export const DEFAULT_ALCHEMY_PAGE_SIZE = 25;

export function useAlchemyState() {
  const { marketData: data, scraperStatus, allItemsDb, loading: dataLoading } = useData();
  const { preferences, setPreferences } = usePreferences();
  const { activeProfile, loaded: profilesLoaded } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const { queue, addToQueue } = useCrafting();
  const searchParams = useSearchParams();

  const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;
  const activeProfileId = configuredProfile?.id || null;

  const [activeCategory, setActiveCategory] = useState<AlchemyCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [minLevel, setMinLevel] = useState<number | "">(0);
  const [maxLevel, setMaxLevel] = useState<number | "">(89);
  const [minProfit, setMinProfit] = useState<number | "">("");
  const [minVolume, setMinVolume] = useState<number | "">("");
  const [liquidityFilter, setLiquidityFilter] = useState<AlchemyLiquidityFilter>("ALL");
  const [onlyProfitable, setOnlyProfitable] = useState(false);
  const [hideAboveLevel, setHideAboveLevel] = useState(false);
  const [hideMissing, setHideMissing] = useState(true);
  const [ownedCostMode, setOwnedCostMode] = useState(false);
  const [ownedMaterials, setOwnedMaterials] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<AlchemyViewMode>("table");
  const [rateMode, setRateMode] = useState<AlchemyRateMode>("hourly");
  const [sortCol, setSortCol] = useState<AlchemySortKey>("profitPerHour");
  const [sortDesc, setSortDesc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_ALCHEMY_PAGE_SIZE);
  const [selectedRow, setSelectedRow] = useState<AlchemyRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Loadout & Boosts modifiers (defaulted from Profile, temporarily editable as What-If simulations)
  const [ascensionBuffIds, setAscensionBuffIds] = useState<string[]>([]);
  const [energizingPoolExp, setEnergizingPoolExp] = useState(0);
  const [classOverride, setClassOverride] = useState<WhatIfClassOverride>("profile");
  const [conquestOverride, setConquestOverride] = useState<AssaultRank | "profile">("profile");
  const [barteringOverride, setBarteringOverride] = useState<number | "">("");
  const [customSessionHours, setCustomSessionHours] = useState<number | "">("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const ownedStorageKey = useMemo(
    () => getProfileStorageKey(OWNED_STORAGE_KEY, activeProfileId || undefined),
    [activeProfileId],
  );
  const ownedModeStorageKey = useMemo(
    () => getProfileStorageKey(OWNED_MODE_STORAGE_KEY, activeProfileId || undefined),
    [activeProfileId],
  );

  // Load saved preferences and per-profile owned stock
  useEffect(() => {
    setSettingsLoaded(false);
    const saved = readAlchemySettings();
    if (saved.minLevel !== undefined) setMinLevel(saved.minLevel);
    if (saved.maxLevel !== undefined) setMaxLevel(saved.maxLevel);
    if (saved.minProfit !== undefined) setMinProfit(saved.minProfit);
    if (saved.minVolume !== undefined) setMinVolume(saved.minVolume);
    if (isAlchemyLiquidityFilter(saved.liquidityFilter)) setLiquidityFilter(saved.liquidityFilter);
    if (isAlchemyCategory(saved.activeCategory)) setActiveCategory(saved.activeCategory);
    if (typeof saved.onlyProfitable === "boolean") setOnlyProfitable(saved.onlyProfitable);
    if (typeof saved.hideAboveLevel === "boolean") setHideAboveLevel(saved.hideAboveLevel);
    if (typeof saved.hideMissing === "boolean") setHideMissing(saved.hideMissing);
    if (saved.viewMode === "table" || saved.viewMode === "cards") setViewMode(saved.viewMode);
    if (saved.rateMode === "hourly" || saved.rateMode === "session") setRateMode(saved.rateMode);
    if (saved.sortCol === "roi") setSortCol("profitPerHour");
    else if (saved.sortCol === "dailyProfit") setSortCol("sessionProfit");
    else if (isAlchemySortKey(saved.sortCol)) setSortCol(saved.sortCol);
    if (typeof saved.sortDesc === "boolean") setSortDesc(saved.sortDesc);
    if (typeof saved.pageSize === "number" && [15, 25, 51].includes(saved.pageSize)) {
      setPageSize(saved.pageSize);
    }
    if (Array.isArray(saved.ascensionBuffIds)) {
      setAscensionBuffIds(saved.ascensionBuffIds.slice(0, 5));
    }
    if (typeof saved.energizingPoolExp === "number" && Number.isFinite(saved.energizingPoolExp)) {
      setEnergizingPoolExp(Math.max(0, Math.min(50, saved.energizingPoolExp)));
    }
    if (
      saved.classOverride === "profile" ||
      saved.classOverride === "alchemist" ||
      saved.classOverride === "standard" ||
      saved.classOverride === "penalty"
    ) {
      setClassOverride(saved.classOverride);
    } else if (saved.manualPenaltyClass) {
      setClassOverride("penalty");
    } else if (saved.manualAlchemistClass) {
      setClassOverride("alchemist");
    }
    if (typeof saved.conquestOverride === "string") {
      setConquestOverride(saved.conquestOverride as AssaultRank | "profile");
    } else if (typeof saved.manualConquestRank === "string") {
      setConquestOverride(
        activeProfileId ? "profile" : (saved.manualConquestRank as AssaultRank),
      );
    }
    if (saved.barteringOverride !== undefined) {
      setBarteringOverride(saved.barteringOverride);
    }
    if (saved.customSessionHours !== undefined) {
      setCustomSessionHours(saved.customSessionHours);
    }

    const urlTab = searchParams.get("tab");
    if (isAlchemyCategory(urlTab)) {
      setActiveCategory(urlTab);
    }

    setOwnedMaterials(
      readOwnedMaterials(ownedStorageKey, activeProfileId ? undefined : OWNED_STORAGE_KEY),
    );
    const storedOwnedMode = localStorage.getItem(ownedModeStorageKey);
    const legacyOwnedMode = activeProfileId ? null : localStorage.getItem(OWNED_MODE_STORAGE_KEY);
    const savedOwnedMode =
      storedOwnedMode !== null
        ? storedOwnedMode === "true"
        : legacyOwnedMode !== null
          ? legacyOwnedMode === "true"
          : Boolean(saved.ownedCostMode);
    setOwnedCostMode(savedOwnedMode);
    setSettingsLoaded(true);
    // Intentionally omit preferences.assaultRank & searchParams after hydration so manual edits hold
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId, ownedModeStorageKey, ownedStorageKey]);

  // Persist user filter and loadout choices
  useEffect(() => {
    if (!settingsLoaded) return;
    const next: PersistedAlchemySettings = {
      minLevel,
      maxLevel,
      minProfit,
      minVolume,
      liquidityFilter,
      activeCategory,
      onlyProfitable,
      hideAboveLevel,
      hideMissing,
      viewMode,
      rateMode,
      sortCol,
      sortDesc,
      pageSize,
      ascensionBuffIds,
      energizingPoolExp,
      classOverride,
      conquestOverride,
      barteringOverride,
      customSessionHours,
    };
    localStorage.setItem(ALCHEMY_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  }, [
    activeCategory,
    ascensionBuffIds,
    barteringOverride,
    classOverride,
    conquestOverride,
    customSessionHours,
    energizingPoolExp,
    hideAboveLevel,
    hideMissing,
    liquidityFilter,
    maxLevel,
    minLevel,
    minProfit,
    minVolume,
    onlyProfitable,
    pageSize,
    rateMode,
    settingsLoaded,
    sortCol,
    sortDesc,
    viewMode,
  ]);

  const persistOwnedMaterials = (next: Record<string, string[]>) => {
    setOwnedMaterials(next);
    localStorage.setItem(ownedStorageKey, JSON.stringify(next));
  };

  const toggleOwnedMaterial = (recipeName: string, materialName: string) => {
    const current = new Set(ownedMaterials[recipeName] || []);
    if (current.has(materialName)) current.delete(materialName);
    else current.add(materialName);
    const next = { ...ownedMaterials, [recipeName]: Array.from(current) };
    persistOwnedMaterials(next);
    setSelectedRow((currentRow) => {
      if (!currentRow || currentRow.name !== recipeName) return currentRow;
      return {
        ...currentRow,
        ingredientCosts: currentRow.ingredientCosts.map((ingredient) =>
          ingredient.name === materialName
            ? { ...ingredient, owned: !ingredient.owned }
            : ingredient,
        ),
      };
    });
  };

  const setOwnedMode = (next: boolean) => {
    setOwnedCostMode(next);
    localStorage.setItem(ownedModeStorageKey, String(next));
  };

  const toggleAscensionBuff = (id: string) => {
    setAscensionBuffIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const clearAscensionBuffs = () => setAscensionBuffIds([]);

  const marketData = useMemo(() => (data || {}) as Record<string, AlchemyMarketItem>, [data]);
  const itemDatabase = useMemo(() => (allItemsDb || {}) as Record<string, AlchemyDbItem>, [allItemsDb]);

  // Active profile & housing idle cap resolution
  const activeProfileName = configuredProfile?.name?.trim() || "No active profile";
  const profileAlchemyLevel = configuredProfile
    ? Number(getProfileSkillLevel(configuredProfile, "alchemy") ?? 0)
    : 0;
  const hasProfileAlchemyLevel = Boolean(configuredProfile && profileAlchemyLevel > 0);

  const housingSummary = useMemo(
    () =>
      calculateHousingBuffs(configuredProfile?.housing, {
        profileClassName: configuredProfile?.className,
      }),
    [configuredProfile?.className, configuredProfile?.housing],
  );
  const baseIdleHours = configuredProfile
    ? getProfileBaseIdleActionHours(configuredProfile, preferences.membership)
    : preferences.membership
      ? 8
      : 6;
  const housingAlchemyHours = configuredProfile ? Number(housingSummary.idleHours.alchemy || 0) : 0;
  const defaultSessionHours = baseIdleHours + housingAlchemyHours;
  const effectiveSessionHours =
    customSessionHours !== "" && Number.isFinite(Number(customSessionHours))
      ? Math.max(0.5, Math.min(24, Number(customSessionHours)))
      : defaultSessionHours;
  const sessionHoursSource =
    customSessionHours !== ""
      ? "Custom window"
      : configuredProfile
        ? housingAlchemyHours > 0
          ? `${baseIdleHours}h base + ${housingAlchemyHours}h Distillation Rig`
          : `${activeProfileName} (${baseIdleHours}h cap)`
        : preferences.membership
          ? "8h Member default"
          : "6h Free default";

  const profileBartering = Number(
    configuredProfile ? getProfileBarteringBoost(configuredProfile) : preferences.barteringBoost || 0,
  ) || 0;
  const parsedBartering =
    barteringOverride !== "" && Number.isFinite(Number(barteringOverride))
      ? Math.max(0, Math.min(20, Number(barteringOverride)))
      : profileBartering;

  const profileClassName = configuredProfile?.className || "";
  const profileClassIsAlchemist = profileClassName === "Alchemist";
  const profileClassIsPenalty = PENALTY_CLASSES.has(profileClassName);

  const isAlchemistClass =
    classOverride === "profile" ? profileClassIsAlchemist : classOverride === "alchemist";
  const isPenaltyClass =
    classOverride === "profile" ? profileClassIsPenalty : classOverride === "penalty";

  const profileConquestRank: AssaultRank = configuredProfile
    ? getProfileConquestRank(configuredProfile)
    : preferences.assaultRank || "none";
  const effectiveConquestRank: AssaultRank =
    conquestOverride === "profile" ? profileConquestRank : conquestOverride;

  const hasWhatIfOverrides =
    classOverride !== "profile" ||
    conquestOverride !== "profile" ||
    barteringOverride !== "" ||
    customSessionHours !== "" ||
    energizingPoolExp > 0 ||
    ascensionBuffIds.length > 0;

  const resetLoadoutToProfile = () => {
    setClassOverride("profile");
    setConquestOverride("profile");
    setBarteringOverride("");
    setCustomSessionHours("");
    setEnergizingPoolExp(0);
    setAscensionBuffIds([]);
  };

  const buffTotals = useMemo(
    () =>
      calculateAlchemyBuffTotals({
        membership: preferences.membership,
        alchemistClass: isAlchemistClass,
        penaltyClass: isPenaltyClass,
        assaultRank: effectiveConquestRank,
        ascensionBuffIds,
        energizingPoolExp,
      }),
    [
      ascensionBuffIds,
      effectiveConquestRank,
      energizingPoolExp,
      isAlchemistClass,
      isPenaltyClass,
      preferences.membership,
    ],
  );

  // Level 90 mythic matches surfaced cleanly in empty state if user searches for one
  const mythicSearchMatches = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) return [];
    return Object.values(itemDatabase)
      .filter((item) => {
        const recipe = item.recipe;
        const level = Number(recipe?.level_required) || 0;
        const skill = String(recipe?.skill || "").toLowerCase();
        const resultName = recipe?.result?.item_name || recipe?.result?.name || "";
        if (
          !item.name ||
          item.type !== "RECIPE" ||
          skill !== "alchemy" ||
          level < 90 ||
          !resultName
        ) {
          return false;
        }
        const searchText = makeSearchText(
          item.name,
          resultName,
          (recipe?.materials || []).map((material) => material.item_name || material.name || ""),
          "mythic level 90",
        );
        return searchText.includes(query);
      })
      .slice(0, 3)
      .map((item) => item.recipe?.result?.item_name || item.recipe?.result?.name || item.name || "")
      .filter(Boolean);
  }, [deferredSearchTerm, itemDatabase]);

  const allRows = useMemo(() => {
    if (!data) return [];
    return calculateAlchemyRows({
      marketData,
      itemDatabase: itemDatabase as Record<string, AlchemyDbItemEntry>,
      customPrices: preferences.customPrices || {},
      ownedMaterials,
      ownedCostMode,
      buffTotals,
      barteringBoost: parsedBartering,
      sessionHours: effectiveSessionHours,
    });
  }, [
    buffTotals,
    data,
    effectiveSessionHours,
    itemDatabase,
    marketData,
    ownedCostMode,
    ownedMaterials,
    parsedBartering,
    preferences.customPrices,
  ]);

  const categoryCounts = useMemo(() => {
    const counts: Record<AlchemyCategory, number> = {
      all: allRows.length,
      potion: 0,
      essence_crystal: 0,
      stat_essence: 0,
    };
    for (const row of allRows) {
      counts[row.category] += 1;
    }
    return counts;
  }, [allRows]);

  const rows = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const profitLimit = minProfit === "" ? -Infinity : Number(minProfit);
    const volumeLimit = minVolume === "" ? 0 : Number(minVolume);

    const filtered = allRows.filter((row) => {
      if (activeCategory !== "all" && row.category !== activeCategory) return false;
      if (query && !row.searchText.includes(query)) return false;
      if (minLevel !== "" && row.level < Number(minLevel)) return false;
      if (maxLevel !== "" && row.level > Number(maxLevel)) return false;
      if (hideAboveLevel && hasProfileAlchemyLevel && row.level > profileAlchemyLevel) return false;
      if (hideMissing && row.status === "missing") return false;
      if (onlyProfitable && row.profit <= 0) return false;
      if (liquidityFilter === "VOLUME SWINGS" && !row.warnings.includes("Volume swings")) {
        return false;
      }
      if (liquidityFilter === "PRICE SWINGS" && !row.warnings.includes("Price swings")) {
        return false;
      }
      if (
        liquidityFilter !== "ALL" &&
        liquidityFilter !== "VOLUME SWINGS" &&
        liquidityFilter !== "PRICE SWINGS" &&
        row.signal !== liquidityFilter
      ) {
        return false;
      }
      if (row.status === "ok" && row.profit < profitLimit) return false;
      if (row.status === "ok" && row.stableVol_3 < volumeLimit) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.status === "missing" && b.status !== "missing") return 1;
      if (a.status !== "missing" && b.status === "missing") return -1;
      const valA = sortCol === "vol_3" ? a.stableVol_3 : a[sortCol];
      const valB = sortCol === "vol_3" ? b.stableVol_3 : b[sortCol];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDesc ? valB - valA : valA - valB;
      }
      return sortDesc
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });

    return filtered;
  }, [
    activeCategory,
    allRows,
    deferredSearchTerm,
    hasProfileAlchemyLevel,
    hideAboveLevel,
    hideMissing,
    liquidityFilter,
    maxLevel,
    minLevel,
    minProfit,
    minVolume,
    onlyProfitable,
    profileAlchemyLevel,
    sortCol,
    sortDesc,
  ]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [pageSize, rows, safePage]);

  // Reset pagination when filters/sort/category change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeCategory,
    deferredSearchTerm,
    hideAboveLevel,
    hideMissing,
    liquidityFilter,
    maxLevel,
    minLevel,
    minProfit,
    minVolume,
    onlyProfitable,
    sortCol,
    sortDesc,
    pageSize,
  ]);

  // Summary spotlights respect category tab when narrowed, fallback to all
  const summary = useMemo(
    () =>
      summarizeAlchemyRows(
        activeCategory === "all"
          ? allRows
          : allRows.filter((row) => row.category === activeCategory),
      ),
    [activeCategory, allRows],
  );

  // Sync open strategy row when data updates
  useEffect(() => {
    setSelectedRow((currentRow) => {
      if (!currentRow) return null;
      return (
        allRows.find((row) => row.name === currentRow.name && row.status === "ok") || currentRow
      );
    });
  }, [allRows]);

  // URL ?recipe= deep link sync (no history pollution or Escape re-open loop)
  const autoOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    const recipeParam = searchParams.get("recipe");
    if (recipeParam && allRows.length > 0) {
      if (recipeParam === autoOpenedRef.current) return;
      const found = allRows.find((row) => row.name.toLowerCase() === recipeParam.toLowerCase());
      if (found && found.status === "ok") {
        setSelectedRow(found);
        autoOpenedRef.current = recipeParam;
      }
    } else if (!recipeParam) {
      autoOpenedRef.current = null;
    }
  }, [allRows, searchParams]);

  const handleCategoryChange = useCallback((nextCategory: string) => {
    if (!isAlchemyCategory(nextCategory)) return;
    setActiveCategory(nextCategory);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (nextCategory === "all") params.delete("tab");
      else params.set("tab", nextCategory);
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/alchemy?${qs}` : "/alchemy");
    }
  }, []);

  const openStrategyRow = useCallback((row: AlchemyRow) => {
    setSelectedRow(row);
    autoOpenedRef.current = row.name;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("recipe", row.name);
      window.history.pushState(null, "", `/alchemy?${params.toString()}`);
    }
  }, []);

  const closeStrategyRow = useCallback(() => {
    setSelectedRow(null);
    autoOpenedRef.current = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("recipe")) {
        params.delete("recipe");
        const qs = params.toString();
        window.history.replaceState(null, "", qs ? `/alchemy?${qs}` : "/alchemy");
      }
    }
  }, []);

  // Support browser back button closing strategy modal
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.get("recipe")) {
        setSelectedRow(null);
        autoOpenedRef.current = null;
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSort = (col: AlchemySortKey) => {
    if (sortCol === col) setSortDesc((prev) => !prev);
    else {
      setSortCol(col);
      setSortDesc(col !== "name" && col !== "cost");
    }
  };

  const handleSortSelect = (composite: string) => {
    const [col, dir] = composite.split(":");
    if (isAlchemySortKey(col)) {
      setSortCol(col);
      setSortDesc(dir !== "asc");
    }
  };

  const advancedFilterCount = [
    minLevel !== "" && minLevel !== 0,
    maxLevel !== "" && maxLevel !== 89,
    minProfit !== "",
    minVolume !== "",
    liquidityFilter !== "ALL",
  ].filter(Boolean).length;

  const activeFilterCount =
    advancedFilterCount +
    [
      activeCategory !== "all",
      searchTerm.trim().length > 0,
      onlyProfitable,
      hideAboveLevel,
      !hideMissing,
      ownedCostMode,
    ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;
  const profitableRowCount = rows.filter((row) => row.status === "ok" && row.profit > 0).length;
  const queuedRecipeCount = Object.keys(queue).length;
  const queuedTotalUnits = Object.values(queue).reduce((sum, n) => sum + Number(n || 0), 0);
  const currentSortLabel = ALCHEMY_SORT_LABELS[sortCol];

  const resetAlchemyControls = () => {
    setActiveCategory("all");
    setSearchTerm("");
    setMinLevel(0);
    setMaxLevel(89);
    setMinProfit("");
    setMinVolume("");
    setLiquidityFilter("ALL");
    setOnlyProfitable(false);
    setHideAboveLevel(false);
    setHideMissing(true);
    setOwnedMode(false);
    setSortCol("profitPerHour");
    setSortDesc(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("tab");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/alchemy?${qs}` : "/alchemy");
    }
  };

  const updatedAt = scraperStatus?.last_updated || data?._meta?.last_updated;
  const dataAgeMinutes = updatedAt
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000)
    : null;
  const staleMarket = dataAgeMinutes !== null && dataAgeMinutes > 90;

  return {
    isLoading: !profilesLoaded || (dataLoading && !data),
    activeCategory,
    handleCategoryChange,
    categoryCounts,
    searchTerm,
    setSearchTerm,
    deferredSearchTerm,
    minLevel,
    setMinLevel,
    maxLevel,
    setMaxLevel,
    minProfit,
    setMinProfit,
    minVolume,
    setMinVolume,
    liquidityFilter,
    setLiquidityFilter,
    onlyProfitable,
    setOnlyProfitable,
    hideAboveLevel,
    setHideAboveLevel,
    hideMissing,
    setHideMissing,
    ownedCostMode,
    setOwnedMode,
    viewMode,
    setViewMode,
    rateMode,
    setRateMode,
    sortCol,
    sortDesc,
    handleSort,
    toggleSortDirection: () => setSortDesc((prev) => !prev),
    handleSortSelect,
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    selectedRow,
    openStrategyRow,
    closeStrategyRow,
    drawerOpen,
    setDrawerOpen,
    toggleOwnedMaterial,
    resetAlchemyControls,
    // Profile, buff & session context
    configuredProfile,
    activeProfileName,
    profileClassName,
    profileAlchemyLevel,
    hasProfileAlchemyLevel,
    parsedBartering,
    profileBartering,
    barteringOverride,
    setBarteringOverride,
    membership: preferences.membership,
    setMembership: (membership: boolean) => setPreferences({ membership }),
    isAlchemistClass,
    isPenaltyClass,
    classOverride,
    setClassOverride,
    effectiveConquestRank,
    profileConquestRank,
    conquestOverride,
    setConquestOverride,
    hasWhatIfOverrides,
    resetLoadoutToProfile,
    ascensionBuffIds,
    toggleAscensionBuff,
    clearAscensionBuffs,
    energizingPoolExp,
    setEnergizingPoolExp,
    baseIdleHours,
    housingAlchemyHours,
    defaultSessionHours,
    effectiveSessionHours,
    customSessionHours,
    setCustomSessionHours,
    sessionHoursSource,
    buffTotals,
    // Results & summary
    rows,
    pagedRows,
    allRows,
    summary,
    mythicSearchMatches,
    staleMarket,
    dataAgeMinutes,
    advancedFilterCount,
    activeFilterCount,
    hasActiveFilters,
    profitableRowCount,
    currentSortLabel,
    // Cross-route helpers
    queue,
    queuedRecipeCount,
    queuedTotalUnits,
    addToQueue,
    openItemByName,
    prefetchItem,
  };
}

export type UseAlchemyStateReturn = ReturnType<typeof useAlchemyState>;
