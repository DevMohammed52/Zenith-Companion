"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCrafting } from "@/context/CraftingContext";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { PENALTY_CLASSES, calculateAlchemyBuffTotals } from "@/lib/alchemy-profit";
import { calculateHousingBuffs, getProfileBaseIdleActionHours } from "@/lib/housing";
import {
  MYTHIC_CRAFT_TIME_SECONDS,
  MYTHIC_LOADOUT_STORAGE_KEY,
  MYTHIC_STORAGE_KEYS,
  buildMythicAlchemyRecipes,
  buildRecommendedMythicRecipes,
  calculateMythicCatalogRows,
  calculateMythicProjectRows,
  clampMythicUses,
  isMythicRecipeCostMode,
  parseOptionalMythicPrice,
  type MythicCatalogRow,
  type MythicDbItem,
  type MythicMarketItem,
  type MythicRecipe,
  type MythicRecipeCostMode,
} from "@/lib/mythic-alchemy";
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from "@/lib/preferences";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { getProfileSkillLevel, isStarterProfile, useProfiles } from "@/lib/profiles";
import type { AssaultRank } from "@/lib/skill-profit";
import {
  DEFAULT_MYTHIC_LOADOUT,
  type AlchemyCategory,
  type MythicCatalogSortKey,
  type MythicLabStats,
  type MythicLabSummary,
  type MythicViewMode,
  type MythicWorkspaceTab,
  type PersistedMythicLoadout,
  type WhatIfClassOverride,
} from "../types";
import {
  isNestedNumberRecord,
  isNumberRecord,
  isStringArray,
  readJson,
  readMythicLoadoutSettings,
} from "../utils/mythic-helpers";

const MARKET_STALE_MINUTES = 90;

export function useMythicAlchemyState() {
  const { marketData: data, scraperStatus, allItemsDb, loading: dataLoading } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const { queue } = useCrafting();
  const searchParams = useSearchParams();

  const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;
  const activeProfileId = configuredProfile?.id || null;

  const [activeTab, setActiveTab] = useState<MythicWorkspaceTab>("catalog");
  const [activeRecipeNames, setActiveRecipeNames] = useState<string[]>([]);
  const [customRecipePrices, setCustomRecipePrices] = useState<Record<string, number>>({});
  const [usesLeft, setUsesLeft] = useState<Record<string, number>>({});
  const [customMaterialPrices, setCustomMaterialPrices] = useState<Record<string, Record<string, number>>>({});
  const [customSellPrices, setCustomSellPrices] = useState<Record<string, number>>({});
  const [recipeCostMode, setRecipeCostMode] = useState<MythicRecipeCostMode>("full");
  const [expandedProjectNames, setExpandedProjectNames] = useState<string[]>([]);

  // Catalog filter & sort controls
  const [catalogCategory, setCatalogCategory] = useState<AlchemyCategory>("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const deferredCatalogSearch = useDeferredValue(catalogSearch);
  const [catalogSortCol, setCatalogSortCol] = useState<MythicCatalogSortKey>("profitPerHour");
  const [catalogSortDesc, setCatalogSortDesc] = useState(true);
  const [catalogViewMode, setCatalogViewMode] = useState<MythicViewMode>("table");
  const [catalogOnlyProfitable, setCatalogOnlyProfitable] = useState(false);
  const [catalogHideMissing, setCatalogHideMissing] = useState(false);
  const [catalogIncludeScrollCost, setCatalogIncludeScrollCost] = useState(true);

  // What-If Loadout & Boosts drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadout, setLoadout] = useState<PersistedMythicLoadout>(DEFAULT_MYTHIC_LOADOUT);
  const [loaded, setLoaded] = useState(false);

  const profileStorageKeys = useMemo(
    () => ({
      active: getProfileStorageKey(MYTHIC_STORAGE_KEYS.active, activeProfileId ?? undefined),
      recipePrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.recipePrices, activeProfileId ?? undefined),
      uses: getProfileStorageKey(MYTHIC_STORAGE_KEYS.uses, activeProfileId ?? undefined),
      materialPrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.materialPrices, activeProfileId ?? undefined),
      sellPrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.sellPrices, activeProfileId ?? undefined),
      costMode: getProfileStorageKey(MYTHIC_STORAGE_KEYS.costMode, activeProfileId ?? undefined),
    }),
    [activeProfileId],
  );

  useEffect(() => {
    setLoaded(false);
    const legacyActive = activeProfileId ? [] : readJson(MYTHIC_STORAGE_KEYS.active, [], isStringArray);
    const legacyRecipePrices = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.recipePrices, {}, isNumberRecord);
    const legacyUses = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.uses, {}, isNumberRecord);
    const legacyMatPrices = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.materialPrices, {}, isNestedNumberRecord);
    const legacySellPrices = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.sellPrices, {}, isNumberRecord);

    const hydratedActive = readJson(profileStorageKeys.active, legacyActive, isStringArray);
    setActiveRecipeNames(hydratedActive);
    setCustomRecipePrices(readJson(profileStorageKeys.recipePrices, legacyRecipePrices, isNumberRecord));
    setUsesLeft(readJson(profileStorageKeys.uses, legacyUses, isNumberRecord));
    setCustomMaterialPrices(readJson(profileStorageKeys.materialPrices, legacyMatPrices, isNestedNumberRecord));
    setCustomSellPrices(readJson(profileStorageKeys.sellPrices, legacySellPrices, isNumberRecord));

    const storedCostMode =
      localStorage.getItem(profileStorageKeys.costMode) ??
      (activeProfileId ? null : localStorage.getItem(MYTHIC_STORAGE_KEYS.costMode));
    setRecipeCostMode(isMythicRecipeCostMode(storedCostMode) ? storedCostMode : "full");
    setLoadout(readMythicLoadoutSettings(MYTHIC_LOADOUT_STORAGE_KEY));

    const urlTab = searchParams.get("tab");
    if (urlTab === "pinned" || urlTab === "catalog") {
      setActiveTab(urlTab);
    } else if (hydratedActive.length > 0) {
      setActiveTab("pinned");
    } else {
      setActiveTab("catalog");
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId, profileStorageKeys]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(profileStorageKeys.active, JSON.stringify(activeRecipeNames));
    localStorage.setItem(profileStorageKeys.recipePrices, JSON.stringify(customRecipePrices));
    localStorage.setItem(profileStorageKeys.uses, JSON.stringify(usesLeft));
    localStorage.setItem(profileStorageKeys.materialPrices, JSON.stringify(customMaterialPrices));
    localStorage.setItem(profileStorageKeys.sellPrices, JSON.stringify(customSellPrices));
    localStorage.setItem(profileStorageKeys.costMode, recipeCostMode);
    localStorage.setItem(MYTHIC_LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
  }, [
    activeRecipeNames,
    customMaterialPrices,
    customRecipePrices,
    customSellPrices,
    loaded,
    loadout,
    profileStorageKeys,
    recipeCostMode,
    usesLeft,
  ]);

  const marketData = useMemo(() => (data || {}) as Record<string, MythicMarketItem>, [data]);
  const itemsByName = useMemo(() => (allItemsDb || {}) as Record<string, MythicDbItem>, [allItemsDb]);
  const settingsPrices = useMemo(() => preferences.customPrices || {}, [preferences.customPrices]);

  const mythicRecipes = useMemo(() => buildMythicAlchemyRecipes(itemsByName), [itemsByName]);
  const recipeByResult = useMemo(() => {
    const map = new Map<string, MythicRecipe>();
    mythicRecipes.forEach((recipe) => map.set(recipe.resultName, recipe));
    return map;
  }, [mythicRecipes]);

  useEffect(() => {
    if (!loaded || mythicRecipes.length === 0) return;
    setActiveRecipeNames((current) => current.filter((name) => recipeByResult.has(name)));
  }, [loaded, mythicRecipes.length, recipeByResult]);

  // Profile & What-If loadout resolution
  const activeProfileName = configuredProfile?.name?.trim() || "Guest mode";
  const profileAlchemyLevel = configuredProfile
    ? Number(getProfileSkillLevel(configuredProfile, "alchemy") ?? 0)
    : 0;
  const hasProfileAlchemyLevel = Boolean(configuredProfile && profileAlchemyLevel > 0);
  const effectiveMembership =
    loadout.membershipOverride !== null ? loadout.membershipOverride : preferences.membership;

  const housingSummary = useMemo(
    () =>
      calculateHousingBuffs(configuredProfile?.housing, {
        profileClassName: configuredProfile?.className,
      }),
    [configuredProfile?.className, configuredProfile?.housing],
  );
  const baseIdleHours = configuredProfile
    ? getProfileBaseIdleActionHours(configuredProfile, effectiveMembership)
    : effectiveMembership
      ? 8
      : 6;
  const housingAlchemyHours = configuredProfile ? Number(housingSummary.idleHours.alchemy || 0) : 0;
  const defaultSessionHours = baseIdleHours + housingAlchemyHours;
  const effectiveSessionHours =
    loadout.customSessionHours !== "" && Number.isFinite(Number(loadout.customSessionHours))
      ? Math.max(0.5, Math.min(24, Number(loadout.customSessionHours)))
      : defaultSessionHours;
  const sessionHoursSource =
    loadout.customSessionHours !== ""
      ? "Custom window"
      : configuredProfile
        ? housingAlchemyHours > 0
          ? `${baseIdleHours}h base + ${housingAlchemyHours}h Distillation Rig`
          : `${activeProfileName} (${baseIdleHours}h cap)`
        : effectiveMembership
          ? "8h Member default"
          : "6h Free default";

  const profileBarteringBoost =
    Number(configuredProfile ? getProfileBarteringBoost(configuredProfile) : preferences.barteringBoost || 0) || 0;
  const effectiveBartering =
    loadout.barteringOverride !== "" && Number.isFinite(Number(loadout.barteringOverride))
      ? Math.max(0, Math.min(20, Number(loadout.barteringOverride)))
      : profileBarteringBoost;

  const profileClassName = configuredProfile?.className || "";
  const isAlchemistClass =
    loadout.classOverride === "profile"
      ? profileClassName === "Alchemist"
      : loadout.classOverride === "alchemist";
  const isPenaltyClass =
    loadout.classOverride === "profile"
      ? PENALTY_CLASSES.has(profileClassName)
      : loadout.classOverride === "penalty";

  const profileConquestRank: AssaultRank = configuredProfile
    ? getProfileConquestRank(configuredProfile)
    : preferences.assaultRank || "none";
  const effectiveConquestRank: AssaultRank =
    loadout.conquestOverride === "profile" ? profileConquestRank : loadout.conquestOverride;

  const buffTotals = useMemo(
    () =>
      calculateAlchemyBuffTotals({
        membership: effectiveMembership,
        alchemistClass: isAlchemistClass,
        penaltyClass: isPenaltyClass,
        assaultRank: effectiveConquestRank,
        ascensionBuffIds: loadout.ascensionBuffIds,
        energizingPoolExp: loadout.energizingPoolExp,
      }),
    [
      effectiveConquestRank,
      effectiveMembership,
      isAlchemistClass,
      isPenaltyClass,
      loadout.ascensionBuffIds,
      loadout.energizingPoolExp,
    ],
  );

  const mythicCraftTimeSeconds =
    MYTHIC_CRAFT_TIME_SECONDS / Math.max(0.01, buffTotals.durationMultiplier);

  const hasWhatIfOverrides =
    loadout.membershipOverride !== null ||
    loadout.classOverride !== "profile" ||
    loadout.conquestOverride !== "profile" ||
    loadout.barteringOverride !== "" ||
    loadout.customSessionHours !== "" ||
    loadout.energizingPoolExp > 0 ||
    loadout.ascensionBuffIds.length > 0;

  const allCatalogRows = useMemo(
    () =>
      calculateMythicCatalogRows({
        mythicRecipes,
        activeRecipeNames,
        settingsPrices,
        marketData,
        itemsByName,
        buffTotals,
        barteringBoost: effectiveBartering,
        includeRecipeCost: catalogIncludeScrollCost,
      }),
    [
      activeRecipeNames,
      buffTotals,
      catalogIncludeScrollCost,
      effectiveBartering,
      itemsByName,
      marketData,
      mythicRecipes,
      settingsPrices,
    ],
  );

  const categoryCounts = useMemo<Record<AlchemyCategory, number>>(() => {
    const counts: Record<AlchemyCategory, number> = {
      all: allCatalogRows.length,
      potion: 0,
      essence_crystal: 0,
      stat_essence: 0,
    };
    for (const row of allCatalogRows) {
      counts[row.recipe.category] += 1;
    }
    return counts;
  }, [allCatalogRows]);

  const filteredCatalogRows = useMemo(() => {
    const query = deferredCatalogSearch.trim().toLowerCase();
    const filtered = allCatalogRows.filter((row) => {
      if (catalogCategory !== "all" && row.recipe.category !== catalogCategory) return false;
      if (catalogOnlyProfitable && (!row.isComplete || row.profit <= 0)) return false;
      if (catalogHideMissing && !row.isComplete) return false;
      if (query && !row.recipe.searchText.includes(query)) return false;
      return true;
    });

    const mult = catalogSortDesc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      if (catalogSortCol === "name") {
        return a.recipe.resultName.localeCompare(b.recipe.resultName) * mult;
      }
      return (a[catalogSortCol] - b[catalogSortCol]) * mult;
    });
  }, [
    allCatalogRows,
    catalogCategory,
    catalogHideMissing,
    catalogOnlyProfitable,
    catalogSortCol,
    catalogSortDesc,
    deferredCatalogSearch,
  ]);

  const activeRows = useMemo(
    () =>
      calculateMythicProjectRows({
        activeRecipeNames,
        recipeByResult,
        usesLeft,
        customRecipePrices,
        customMaterialPrices,
        customSellPrices,
        settingsPrices,
        marketData,
        itemsByName,
        recipeCostMode,
        membership: effectiveMembership,
        profileBarteringBoost: effectiveBartering,
        buffTotals,
      }),
    [
      activeRecipeNames,
      buffTotals,
      customMaterialPrices,
      customRecipePrices,
      customSellPrices,
      effectiveBartering,
      effectiveMembership,
      itemsByName,
      marketData,
      recipeByResult,
      recipeCostMode,
      settingsPrices,
      usesLeft,
    ],
  );

  const recommendedRecipes = useMemo(
    () =>
      buildRecommendedMythicRecipes({
        mythicRecipes,
        activeRecipeNames,
        settingsPrices,
        marketData,
        itemsByName,
        buffTotals,
        barteringBoost: effectiveBartering,
        limit: 5,
      }),
    [activeRecipeNames, buffTotals, effectiveBartering, itemsByName, marketData, mythicRecipes, settingsPrices],
  );

  const labSummary = useMemo<MythicLabSummary>(() => {
    const totalPotentialProfit = activeRows.reduce((sum, row) => sum + row.totalRemainingProfit, 0);
    const totalRemainingExp = activeRows.reduce((sum, row) => sum + row.totalRemainingExp, 0);
    const completeCatalog = allCatalogRows.filter((row) => row.isComplete);
    const bestCatalog = [...completeCatalog].sort((a, b) => b.profitPerHour - a.profitPerHour)[0];
    const bestExpCatalog = [...allCatalogRows].sort((a, b) => b.expPerHour - a.expPerHour)[0];
    return {
      totalPotentialProfit,
      totalRemainingExp,
      bestPinned: activeRows[0],
      bestCatalog,
      bestExpCatalog,
    };
  }, [activeRows, allCatalogRows]);

  const labStats = useMemo<MythicLabStats>(() => {
    const warningProjects = activeRows.filter((row) => row.marketWarnings.length > 0).length;
    const priceGapProjects = activeRows.filter((row) => row.missingPriceCount > 0).length;
    const usesRemaining = activeRows.reduce((sum, row) => sum + row.usesLeft, 0);
    return {
      warningProjects,
      priceGapProjects,
      usesRemaining,
      profitableProjects: activeRows.filter((row) => row.profitPerHour >= 0).length,
      catalogProfitableCount: allCatalogRows.filter((row) => row.isComplete && row.profit > 0).length,
      catalogMissingCount: allCatalogRows.filter((row) => !row.isComplete).length,
    };
  }, [activeRows, allCatalogRows]);

  // URL sync for active tab
  const switchTab = (tab: MythicWorkspaceTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const addToLab = (recipe: MythicRecipe, switchToPinned = false) => {
    setActiveRecipeNames((current) =>
      current.includes(recipe.resultName) ? current : [...current, recipe.resultName],
    );
    setUsesLeft((current) => ({
      ...current,
      [recipe.resultName]: current[recipe.resultName] || recipe.maxUses,
    }));
    setExpandedProjectNames((current) =>
      current.includes(recipe.resultName) ? current : [...current, recipe.resultName],
    );
    if (switchToPinned) switchTab("pinned");
  };

  const removeFromLab = (resultName: string) => {
    setActiveRecipeNames((current) => current.filter((name) => name !== resultName));
    setCustomRecipePrices((current) => {
      const next = { ...current };
      delete next[resultName];
      return next;
    });
    setUsesLeft((current) => {
      const next = { ...current };
      delete next[resultName];
      return next;
    });
    setCustomMaterialPrices((current) => {
      const next = { ...current };
      delete next[resultName];
      return next;
    });
    setCustomSellPrices((current) => {
      const next = { ...current };
      delete next[resultName];
      return next;
    });
    setExpandedProjectNames((current) => current.filter((name) => name !== resultName));
  };

  const toggleProjectDetails = (resultName: string) => {
    setExpandedProjectNames((current) =>
      current.includes(resultName)
        ? current.filter((name) => name !== resultName)
        : [...current, resultName],
    );
  };

  const updateRecipePrice = (resultName: string, raw: string) => {
    const parsed = parseOptionalMythicPrice(raw);
    setCustomRecipePrices((current) => {
      const next = { ...current };
      if (parsed === null) delete next[resultName];
      else next[resultName] = parsed;
      return next;
    });
  };

  const updateMaterialPrice = (resultName: string, materialName: string, raw: string) => {
    const parsed = parseOptionalMythicPrice(raw);
    setCustomMaterialPrices((current) => {
      const recipePrices = { ...(current[resultName] || {}) };
      if (parsed === null) delete recipePrices[materialName];
      else recipePrices[materialName] = parsed;
      return { ...current, [resultName]: recipePrices };
    });
  };

  const updateSellPrice = (resultName: string, raw: string) => {
    const parsed = parseOptionalMythicPrice(raw);
    setCustomSellPrices((current) => {
      const next = { ...current };
      if (parsed === null) delete next[resultName];
      else next[resultName] = parsed;
      return next;
    });
  };

  const setRecipeUses = (recipe: MythicRecipe, value: string | number) => {
    setUsesLeft((current) => ({
      ...current,
      [recipe.resultName]: clampMythicUses(value, recipe.maxUses),
    }));
  };

  const handleCatalogSort = (col: MythicCatalogSortKey) => {
    if (catalogSortCol === col) {
      setCatalogSortDesc((prev) => !prev);
    } else {
      setCatalogSortCol(col);
      setCatalogSortDesc(col !== "name" && col !== "recipePrice" && col !== "totalCostPerCraft");
    }
  };

  const handleCatalogSortSelect = (composite: string) => {
    const [col, dir] = composite.split(":");
    if (col) setCatalogSortCol(col as MythicCatalogSortKey);
    if (dir === "asc" || dir === "desc") setCatalogSortDesc(dir === "desc");
  };

  const resetCatalogFilters = () => {
    setCatalogCategory("all");
    setCatalogSearch("");
    setCatalogOnlyProfitable(false);
    setCatalogHideMissing(false);
  };

  const toggleAscensionBuff = (id: string) => {
    setLoadout((prev) => {
      const ids = prev.ascensionBuffIds;
      if (ids.includes(id)) {
        return { ...prev, ascensionBuffIds: ids.filter((item) => item !== id) };
      }
      if (ids.length >= 5) return prev;
      return { ...prev, ascensionBuffIds: [...ids, id] };
    });
  };

  const resetLoadoutToProfile = () => setLoadout(DEFAULT_MYTHIC_LOADOUT);

  const queuedTotalUnits = Object.values(queue).reduce((sum, qty) => sum + (qty || 0), 0);
  const queuedRecipeCount = Object.keys(queue).length;

  const dataAgeMinutes = useMemo(() => {
    const ts = scraperStatus?.timestamp || scraperStatus?.generated_at;
    if (typeof ts !== "string" && typeof ts !== "number") return null;
    const ms = Date.now() - new Date(ts).getTime();
    return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 60000) : null;
  }, [scraperStatus?.generated_at, scraperStatus?.timestamp]);
  const staleMarket = dataAgeMinutes !== null && dataAgeMinutes >= MARKET_STALE_MINUTES;

  const isLoading = !loaded || dataLoading || !data || mythicRecipes.length === 0;
  const hasActiveCatalogFilters =
    catalogCategory !== "all" ||
    catalogSearch.trim().length > 0 ||
    catalogOnlyProfitable ||
    catalogHideMissing;

  return {
    activeProfile,
    activeProfileName,
    hasConfiguredProfile: Boolean(configuredProfile),
    profileClassName,
    profileAlchemyLevel,
    hasProfileAlchemyLevel,
    profileConquestRank,
    profileBarteringBoost,
    effectiveBartering,
    effectiveMembership,
    preferencesMembership: preferences.membership,
    taxNetPercent: Math.round(getMarketTaxMultiplier(effectiveMembership) * 100),
    taxRate: getMarketTaxRate(effectiveMembership),
    baseIdleHours,
    housingAlchemyHours,
    defaultSessionHours,
    effectiveSessionHours,
    sessionHoursSource,
    buffTotals,
    loadout,
    setLoadout,
    hasWhatIfOverrides,
    toggleAscensionBuff,
    resetLoadoutToProfile,
    drawerOpen,
    setDrawerOpen,
    activeTab,
    switchTab,
    activeRecipeNames,
    activeRows,
    allCatalogRows,
    filteredCatalogRows,
    categoryCounts,
    catalogCategory,
    setCatalogCategory,
    catalogSearch,
    setCatalogSearch,
    deferredCatalogSearch,
    catalogSortCol,
    catalogSortDesc,
    handleCatalogSort,
    handleCatalogSortSelect,
    toggleCatalogSortDirection: () => setCatalogSortDesc((prev) => !prev),
    catalogViewMode,
    setCatalogViewMode,
    catalogOnlyProfitable,
    setCatalogOnlyProfitable,
    catalogHideMissing,
    setCatalogHideMissing,
    catalogIncludeScrollCost,
    setCatalogIncludeScrollCost,
    hasActiveCatalogFilters,
    resetCatalogFilters,
    expandedProjectNames,
    labStats,
    labSummary,
    mythicCraftTimeSeconds,
    mythicRecipes,
    recipeCostMode,
    setRecipeCostMode,
    recommendedPreview: recommendedRecipes.slice(0, activeRows.length > 0 ? 4 : 5),
    recommendedRecipes,
    isLoading,
    staleMarket,
    dataAgeMinutes,
    queuedTotalUnits,
    queuedRecipeCount,
    addToLab,
    openItemByName,
    prefetchItem,
    removeFromLab,
    setRecipeUses,
    toggleProjectDetails,
    updateMaterialPrice,
    updateRecipePrice,
    updateSellPrice,
  };
}

export type MythicCatalogTableRow = MythicCatalogRow;
