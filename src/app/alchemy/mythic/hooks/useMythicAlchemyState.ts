"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { usePreferences, getMarketTaxMultiplier, getMarketTaxRate } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { getAssaultBuff } from "@/lib/skill-profit";
import {
  MYTHIC_CRAFT_TIME_SECONDS,
  MYTHIC_STORAGE_KEYS,
  buildMythicAlchemyRecipes,
  buildRecommendedMythicRecipes,
  calculateMythicProjectRows,
  clampMythicUses,
  isMythicRecipeCostMode,
  parseOptionalMythicPrice,
  type MythicDbItem,
  type MythicMarketItem,
  type MythicRecipe,
  type MythicRecipeCostMode,
} from "@/lib/mythic-alchemy";
import type { MythicLabStats, MythicLabSummary } from "../types";
import {
  isNestedNumberRecord,
  isNumberRecord,
  isStringArray,
  readJson,
} from "../utils/mythic-helpers";

export function useMythicAlchemyState() {
  const { marketData: data, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName } = useItemModal();

  const [activeRecipeNames, setActiveRecipeNames] = useState<string[]>([]);
  const [customRecipePrices, setCustomRecipePrices] = useState<Record<string, number>>({});
  const [usesLeft, setUsesLeft] = useState<Record<string, number>>({});
  const [customMaterialPrices, setCustomMaterialPrices] = useState<
    Record<string, Record<string, number>>
  >({});
  const [customSellPrices, setCustomSellPrices] = useState<Record<string, number>>({});
  const [recipeCostMode, setRecipeCostMode] = useState<MythicRecipeCostMode>("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [expandedProjectNames, setExpandedProjectNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  const marketData = useMemo(() => (data || {}) as Record<string, MythicMarketItem>, [data]);
  const itemsByName = useMemo(
    () => (allItemsDb || {}) as Record<string, MythicDbItem>,
    [allItemsDb],
  );
  const settingsPrices = useMemo(
    () => preferences.customPrices || {},
    [preferences.customPrices],
  );
  const activeProfileId = activeProfile?.id || null;
  const profileBarteringBoost =
    Number(activeProfile ? getProfileBarteringBoost(activeProfile) : 0) || 0;
  const conquestRank = activeProfile
    ? getProfileConquestRank(activeProfile)
    : preferences.assaultRank;
  const conquestBuff = getAssaultBuff(conquestRank);
  const alchemyEfficiencyBonus = (preferences.membership ? 10 : 0) + conquestBuff.efficiency;
  const mythicCraftTimeSeconds =
    MYTHIC_CRAFT_TIME_SECONDS / Math.max(0.01, (100 + alchemyEfficiencyBonus) / 100);

  const profileStorageKeys = useMemo(
    () => ({
      active: getProfileStorageKey(MYTHIC_STORAGE_KEYS.active, activeProfile?.id),
      recipePrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.recipePrices, activeProfile?.id),
      uses: getProfileStorageKey(MYTHIC_STORAGE_KEYS.uses, activeProfile?.id),
      materialPrices: getProfileStorageKey(
        MYTHIC_STORAGE_KEYS.materialPrices,
        activeProfile?.id,
      ),
      sellPrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.sellPrices, activeProfile?.id),
      costMode: getProfileStorageKey(MYTHIC_STORAGE_KEYS.costMode, activeProfile?.id),
    }),
    [activeProfile?.id],
  );

  const mythicRecipes = useMemo(() => buildMythicAlchemyRecipes(itemsByName), [itemsByName]);

  const recipeByResult = useMemo(() => {
    const map = new Map<string, MythicRecipe>();
    mythicRecipes.forEach((recipe) => map.set(recipe.resultName, recipe));
    return map;
  }, [mythicRecipes]);

  useEffect(() => {
    setLoaded(false);
    const legacyActive = activeProfileId
      ? []
      : readJson(MYTHIC_STORAGE_KEYS.active, [], isStringArray);
    const legacyRecipePrices = activeProfileId
      ? {}
      : readJson(MYTHIC_STORAGE_KEYS.recipePrices, {}, isNumberRecord);
    const legacyUses = activeProfileId
      ? {}
      : readJson(MYTHIC_STORAGE_KEYS.uses, {}, isNumberRecord);
    const legacyMaterialPrices = activeProfileId
      ? {}
      : readJson(MYTHIC_STORAGE_KEYS.materialPrices, {}, isNestedNumberRecord);
    const legacySellPrices = activeProfileId
      ? {}
      : readJson(MYTHIC_STORAGE_KEYS.sellPrices, {}, isNumberRecord);

    setActiveRecipeNames(readJson(profileStorageKeys.active, legacyActive, isStringArray));
    setCustomRecipePrices(
      readJson(profileStorageKeys.recipePrices, legacyRecipePrices, isNumberRecord),
    );
    setUsesLeft(readJson(profileStorageKeys.uses, legacyUses, isNumberRecord));
    setCustomMaterialPrices(
      readJson(profileStorageKeys.materialPrices, legacyMaterialPrices, isNestedNumberRecord),
    );
    setCustomSellPrices(readJson(profileStorageKeys.sellPrices, legacySellPrices, isNumberRecord));

    const storedCostMode =
      localStorage.getItem(profileStorageKeys.costMode) ??
      (activeProfileId ? null : localStorage.getItem(MYTHIC_STORAGE_KEYS.costMode));
    if (isMythicRecipeCostMode(storedCostMode)) setRecipeCostMode(storedCostMode);
    else setRecipeCostMode("full");

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSearchOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    setLoaded(true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeProfileId, profileStorageKeys]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(profileStorageKeys.active, JSON.stringify(activeRecipeNames));
    localStorage.setItem(profileStorageKeys.recipePrices, JSON.stringify(customRecipePrices));
    localStorage.setItem(profileStorageKeys.uses, JSON.stringify(usesLeft));
    localStorage.setItem(profileStorageKeys.materialPrices, JSON.stringify(customMaterialPrices));
    localStorage.setItem(profileStorageKeys.sellPrices, JSON.stringify(customSellPrices));
    localStorage.setItem(profileStorageKeys.costMode, recipeCostMode);
  }, [
    activeRecipeNames,
    customMaterialPrices,
    customRecipePrices,
    customSellPrices,
    loaded,
    profileStorageKeys,
    recipeCostMode,
    usesLeft,
  ]);

  useEffect(() => {
    if (!loaded || mythicRecipes.length === 0) return;
    setActiveRecipeNames((current) => current.filter((name) => recipeByResult.has(name)));
  }, [loaded, mythicRecipes.length, recipeByResult]);

  const availableMythics = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return mythicRecipes.filter((recipe) => {
      if (activeRecipeNames.includes(recipe.resultName)) return false;
      if (!query) return true;
      return recipe.searchText.includes(query);
    });
  }, [activeRecipeNames, mythicRecipes, searchTerm]);

  const recommendedRecipes = useMemo(
    () =>
      buildRecommendedMythicRecipes({
        mythicRecipes,
        activeRecipeNames,
        settingsPrices,
        marketData,
        itemsByName,
      }),
    [activeRecipeNames, itemsByName, marketData, mythicRecipes, settingsPrices],
  );

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
        membership: preferences.membership,
        profileBarteringBoost,
        mythicCraftTimeSeconds,
        alchemyEfficiencyBonus,
      }),
    [
      activeRecipeNames,
      alchemyEfficiencyBonus,
      customMaterialPrices,
      customRecipePrices,
      customSellPrices,
      itemsByName,
      marketData,
      mythicCraftTimeSeconds,
      preferences.membership,
      profileBarteringBoost,
      recipeByResult,
      recipeCostMode,
      settingsPrices,
      usesLeft,
    ],
  );

  const labSummary = useMemo<MythicLabSummary>(() => {
    const totalPotentialProfit = activeRows.reduce(
      (sum, row) => sum + row.totalRemainingProfit,
      0,
    );
    const best = activeRows[0];
    return { totalPotentialProfit, best };
  }, [activeRows]);

  const labStats = useMemo<MythicLabStats>(() => {
    const warningProjects = activeRows.filter((row) => row.marketWarnings.length > 0).length;
    const priceGapProjects = activeRows.filter(
      (row) =>
        row.recipePrice <= 0 ||
        row.marketGross <= 0 ||
        row.materialBreakdown.some((material) => material.unitPrice <= 0),
    ).length;
    const usesRemaining = activeRows.reduce((sum, row) => sum + row.usesLeft, 0);
    return {
      warningProjects,
      priceGapProjects,
      usesRemaining,
      profitableProjects: activeRows.filter((row) => row.profitPerHour >= 0).length,
    };
  }, [activeRows]);

  const recommendedPreview = recommendedRecipes.slice(0, activeRows.length > 0 ? 4 : 5);
  const activeRecipe = availableMythics[activeRecipeIndex] || null;
  const activeRecipeOptionId = activeRecipe
    ? `mythic-recipe-option-${activeRecipe.resultName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    : undefined;

  useEffect(() => {
    if (!isSearchOpen) {
      setActiveRecipeIndex(0);
      return;
    }
    setActiveRecipeIndex((current) =>
      Math.min(Math.max(current, 0), Math.max(availableMythics.length - 1, 0)),
    );
  }, [availableMythics.length, isSearchOpen]);

  const addToLab = (recipe: MythicRecipe) => {
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
    setSearchTerm("");
    setIsSearchOpen(false);
  };

  const handleRecipeSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setIsSearchOpen(false);
      searchTriggerRef.current?.focus();
      return;
    }
    if (availableMythics.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveRecipeIndex((current) => (current + 1) % availableMythics.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveRecipeIndex(
        (current) => (current - 1 + availableMythics.length) % availableMythics.length,
      );
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveRecipeIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveRecipeIndex(availableMythics.length - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const recipe = availableMythics[activeRecipeIndex];
      if (recipe) addToLab(recipe);
    }
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

  const setRecipeUses = (recipe: MythicRecipe, raw: string) => {
    setUsesLeft((current) => ({
      ...current,
      [recipe.resultName]: clampMythicUses(raw, recipe.maxUses),
    }));
  };

  const taxRate = getMarketTaxRate(preferences.membership);
  const taxNetPercent = Math.round(getMarketTaxMultiplier(preferences.membership) * 100);

  return {
    activeProfile,
    activeRows,
    availableMythics,
    expandedProjectNames,
    isSearchOpen,
    labStats,
    labSummary,
    mythicCraftTimeSeconds,
    mythicRecipes,
    profileBarteringBoost,
    recipeCostMode,
    recommendedPreview,
    recommendedRecipes,
    searchTerm,
    searchRef,
    searchTriggerRef,
    activeRecipeIndex,
    activeRecipeOptionId,
    taxNetPercent,
    taxRate,
    addToLab,
    handleRecipeSearchKeyDown,
    openItemByName,
    removeFromLab,
    setIsSearchOpen,
    setRecipeCostMode,
    setRecipeUses,
    setSearchTerm,
    setActiveRecipeIndex,
    toggleProjectDetails,
    updateMaterialPrice,
    updateRecipePrice,
    updateSellPrice,
  };
}
