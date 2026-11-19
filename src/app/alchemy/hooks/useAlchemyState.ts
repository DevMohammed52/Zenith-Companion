"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../../../constants";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { usePreferences, getMarketTaxMultiplier, getMarketTaxRate } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { getMarketLiquidity } from "@/lib/market-pricing";
import { getAssaultBuff } from "@/lib/skill-profit";
import {
  ALCHEMY_SETTINGS_STORAGE_KEY,
  ALCHEMY_SORT_LABELS,
  OWNED_MODE_STORAGE_KEY,
  OWNED_STORAGE_KEY,
  type ActionPath,
  type AlchemyLiquidityFilter,
  type AlchemyRow,
  type AlchemySortKey,
  type AlchemySummary,
  type DbItem,
  type MarketData,
  type PersistedAlchemySettings,
} from "../types";
import {
  formatGold,
  formatSignedGold,
  getItemPrice,
  getSellThroughNote,
  getSignal,
  getTrend,
  isAlchemyLiquidityFilter,
  isAlchemySortKey,
  makeSearchText,
  readAlchemySettings,
  readOwnedMaterials,
} from "../utils/alchemy-helpers";

export function useAlchemyState() {
  const { marketData: data, scraperStatus, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [minLevel, setMinLevel] = useState<number | "">(0);
  const [maxLevel, setMaxLevel] = useState<number | "">(89);
  const [minProfit, setMinProfit] = useState<number | "">("");
  const [minVolume, setMinVolume] = useState<number | "">("");
  const [liquidityFilter, setLiquidityFilter] = useState<AlchemyLiquidityFilter>("ALL");
  const [onlyProfitable, setOnlyProfitable] = useState(false);
  const [hideMissing, setHideMissing] = useState(true);
  const [ownedCostMode, setOwnedCostMode] = useState(false);
  const [ownedMaterials, setOwnedMaterials] = useState<Record<string, string[]>>({});
  const [sortCol, setSortCol] = useState<AlchemySortKey>("profitPerHour");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedRow, setSelectedRow] = useState<AlchemyRow | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const activeProfileId = activeProfile?.id || null;
  const ownedStorageKey = useMemo(
    () => getProfileStorageKey(OWNED_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );
  const ownedModeStorageKey = useMemo(
    () => getProfileStorageKey(OWNED_MODE_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );

  useEffect(() => {
    setSettingsLoaded(false);
    const saved = readAlchemySettings();
    if (saved.minLevel !== undefined) setMinLevel(saved.minLevel);
    if (saved.maxLevel !== undefined) setMaxLevel(saved.maxLevel);
    if (saved.minProfit !== undefined) setMinProfit(saved.minProfit);
    if (saved.minVolume !== undefined) setMinVolume(saved.minVolume);
    if (isAlchemyLiquidityFilter(saved.liquidityFilter)) setLiquidityFilter(saved.liquidityFilter);
    if (typeof saved.onlyProfitable === "boolean") setOnlyProfitable(saved.onlyProfitable);
    if (typeof saved.hideMissing === "boolean") setHideMissing(saved.hideMissing);
    if (saved.sortCol === "craftsPerHour" || saved.sortCol === "roi") setSortCol("profitPerHour");
    else if (isAlchemySortKey(saved.sortCol)) setSortCol(saved.sortCol);
    if (typeof saved.sortDesc === "boolean") setSortDesc(saved.sortDesc);

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
  }, [activeProfileId, ownedModeStorageKey, ownedStorageKey]);

  useEffect(() => {
    if (!settingsLoaded) return;
    const next: PersistedAlchemySettings = {
      minLevel,
      maxLevel,
      minProfit,
      minVolume,
      liquidityFilter,
      onlyProfitable,
      hideMissing,
      sortCol,
      sortDesc,
    };
    localStorage.setItem(ALCHEMY_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  }, [
    hideMissing,
    liquidityFilter,
    maxLevel,
    minLevel,
    minProfit,
    minVolume,
    onlyProfitable,
    settingsLoaded,
    sortCol,
    sortDesc,
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

  const marketData = useMemo(() => (data || {}) as Record<string, MarketData>, [data]);
  const itemDatabase = useMemo(() => (allItemsDb || {}) as Record<string, DbItem>, [allItemsDb]);
  const parsedActiveHours = Number(activeProfile?.timers.activeHours || 0) || 0;
  const activeProfileName = activeProfile?.name?.trim() || "Active profile";
  const activeHoursSource = activeProfile ? `${activeProfileName} playtime` : "No active profile";
  const parsedBartering = Number(activeProfile ? getProfileBarteringBoost(activeProfile) : 0) || 0;
  const marketTaxRate = getMarketTaxRate(preferences.membership);
  const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);
  const conquestRank = activeProfile
    ? getProfileConquestRank(activeProfile)
    : preferences.assaultRank;
  const conquestBuff = getAssaultBuff(conquestRank);
  const alchemyEfficiencyBonus = (preferences.membership ? 10 : 0) + conquestBuff.efficiency;
  const alchemyDurationMultiplier = Math.max(0.01, (100 + alchemyEfficiencyBonus) / 100);

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
        )
          return false;
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
    const rowsList: AlchemyRow[] = [];
    if (!data) return rowsList;

    for (const [name, recipe] of Object.entries(ALCHEMY_ITEMS)) {
      if (recipe.level >= 90) continue;

      const item = marketData[name];
      const outputPrice = getItemPrice(name, marketData, preferences.customPrices || {});
      const outputMissing = outputPrice.price <= 0;
      const recipeOwnedSet = new Set(ownedMaterials[name] || []);

      const ingredientCosts = Object.entries(recipe.materials).map(([materialName, quantity]) => {
        const priceInfo = getItemPrice(materialName, marketData, preferences.customPrices || {});
        const owned = recipeOwnedSet.has(materialName);
        return {
          name: materialName,
          quantity,
          unitPrice: priceInfo.price,
          totalPrice: priceInfo.price * quantity,
          source: priceInfo.source,
          owned,
        };
      });

      const inputMissing = ingredientCosts
        .filter((ingredient) => ingredient.unitPrice <= 0)
        .map((ingredient) => ingredient.name);
      const missing = outputMissing || inputMissing.length > 0;

      const materialCost = ingredientCosts.reduce(
        (sum, ingredient) => sum + ingredient.totalPrice,
        0,
      );
      const cashMaterialCost = ingredientCosts.reduce(
        (sum, ingredient) =>
          sum + (ownedCostMode && ingredient.owned ? 0 : ingredient.totalPrice),
        0,
      );
      const vialCost = VIAL_COSTS[recipe.vial] || 0;
      const recipeName = `Recipe: ${name}`;
      const recipePrice = getItemPrice(
        recipeName,
        marketData,
        preferences.customPrices || {},
      ).price;
      const recipeCostShare = item?.quality === "MYTHIC" && recipePrice > 0 ? recipePrice / 30 : 0;

      const opportunityCost = materialCost + vialCost + recipeCostShare;
      const cashCost = cashMaterialCost + vialCost + recipeCostShare;
      const cost = ownedCostMode ? cashCost : opportunityCost;
      const marketGross = outputPrice.source === "missing" ? 0 : outputPrice.price;
      const marketTax = marketGross * marketTaxRate;
      const marketNet = marketGross * marketTaxMultiplier;
      const vendorNet = (item?.vendor_price || 0) * (1 + parsedBartering / 100);
      const liquidationNet = ingredientCosts.reduce((sum, ingredient) => {
        if (ingredient.unitPrice <= 0) return sum;
        return sum + ingredient.unitPrice * marketTaxMultiplier * ingredient.quantity;
      }, 0);

      const bestRevenue = Math.max(marketNet, vendorNet, liquidationNet);
      const profit = missing ? 0 : bestRevenue - cost;
      const opportunityProfit = missing ? 0 : bestRevenue - opportunityCost;
      const effectiveTime =
        recipe.time > 0 ? recipe.time / alchemyDurationMultiplier : recipe.time;
      const craftsPerHour = effectiveTime > 0 ? 3600 / effectiveTime : 0;
      const profitPerHour = profit * craftsPerHour;
      const craftsPerDay = craftsPerHour * parsedActiveHours;
      const dailyProfit = profitPerHour * parsedActiveHours;

      let action: ActionPath = "LIQUIDATE";
      if (bestRevenue === vendorNet && vendorNet > liquidationNet) action = "VENDOR";
      else if (bestRevenue === marketNet && marketNet > liquidationNet) action = "MARKET";

      const liquidity = getMarketLiquidity(item);
      const signal = getSignal(action, item, missing);
      const stableVol_3 = liquidity.stableVolume3d || item?.vol_3 || 0;
      const sellThroughNote = missing
        ? ""
        : getSellThroughNote(
            action,
            profit,
            stableVol_3,
            craftsPerDay,
            parsedActiveHours,
            liquidity.hasVolumeSwings,
          );
      const sellThroughRisk = Boolean(sellThroughNote);
      const warnings: string[] = [];
      if (missing)
        warnings.push(
          outputMissing ? "Missing result price" : `Missing inputs: ${inputMissing.join(", ")}`,
        );
      if (!missing && action === "MARKET" && liquidity.isSpikeRisk) {
        warnings.push("Bulk-sale spike risk");
      }
      if (sellThroughRisk) {
        warnings.push("Sell-through risk");
      }
      if (!missing && action === "MARKET" && liquidity.hasVolumeSwings) {
        warnings.push("Volume swings");
      }
      if (!missing && action === "MARKET" && liquidity.hasPriceSwings) {
        warnings.push("Price swings");
      }
      if (
        !missing &&
        action === "MARKET" &&
        liquidity.stableVolume3d < 40 &&
        signal !== "THIN" &&
        signal !== "NO SALES"
      ) {
        warnings.push("Thin market");
      }
      if (!missing && profit > 0 && opportunityProfit < 0 && ownedCostMode)
        warnings.push("Only profitable with owned inputs");
      if (!missing && preferences.customPrices?.[name]) warnings.push("Custom sell price");
      if (!missing && ingredientCosts.some((ingredient) => ingredient.source === "custom"))
        warnings.push("Custom input price");

      const reason = missing
        ? warnings[0] || "Missing market data"
        : action === "MARKET"
          ? `Market net beats vendor by ${formatGold(marketNet - vendorNet)}g and liquidation by ${formatGold(marketNet - liquidationNet)}g.`
          : action === "VENDOR"
            ? `Vendor wins by ${formatGold(vendorNet - Math.max(marketNet, liquidationNet))}g over the next best path.`
            : `Selling the ingredients beats crafting by ${formatGold(liquidationNet - Math.max(marketNet, vendorNet))}g.`;
      const materialNames = ingredientCosts.map((ingredient) => ingredient.name);
      const searchText = makeSearchText(
        name,
        `Recipe: ${name}`,
        recipe.vial,
        materialNames,
        action,
        signal,
        warnings,
        reason,
        liquidity.note,
      );

      rowsList.push({
        status: missing ? "missing" : "ok",
        name,
        level: recipe.level,
        vialName: recipe.vial,
        materialNames,
        searchText,
        baseTime: recipe.time,
        time: effectiveTime,
        efficiencyBonus: alchemyEfficiencyBonus,
        craftsPerHour,
        craftsPerDay,
        trend: getTrend(item),
        action,
        signal,
        warnings,
        reason,
        formula: `${formatGold(bestRevenue, 2)}g best revenue - ${formatGold(cost, 2)}g cost = ${formatSignedGold(profit, 2)}`,
        cost,
        cashCost,
        opportunityCost,
        materialCost,
        cashMaterialCost,
        vialCost,
        recipeCostShare,
        marketGross,
        marketTax,
        marketNet,
        vendorNet,
        liquidationNet,
        bestRevenue,
        profit,
        profitPerHour,
        opportunityProfit,
        dailyProfit,
        vol_3: item?.vol_3 || 0,
        stableVol_3,
        liquidityNote: liquidity.note,
        liquidityRisk:
          liquidity.isSpikeRisk || liquidity.hasVolumeSwings || liquidity.hasPriceSwings,
        sellThroughRisk,
        sellThroughNote,
        outputSource:
          outputPrice.source === "custom"
            ? "custom"
            : outputPrice.source === "market"
              ? "market"
              : "missing",
        inputMissing,
        ingredientCosts,
      });
    }

    return rowsList;
  }, [
    data,
    marketData,
    ownedCostMode,
    ownedMaterials,
    alchemyDurationMultiplier,
    alchemyEfficiencyBonus,
    parsedActiveHours,
    parsedBartering,
    preferences.customPrices,
    marketTaxMultiplier,
    marketTaxRate,
  ]);

  const rows = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const profitLimit = minProfit === "" ? -Infinity : Number(minProfit);
    const volumeLimit = minVolume === "" ? 0 : Number(minVolume);

    const filtered = allRows.filter((row) => {
      if (query && !row.searchText.includes(query)) return false;
      if (minLevel !== "" && row.level < Number(minLevel)) return false;
      if (maxLevel !== "" && row.level > Number(maxLevel)) return false;
      if (hideMissing && row.status === "missing") return false;
      if (onlyProfitable && row.profit <= 0) return false;
      if (liquidityFilter === "VOLUME SWINGS" && !row.warnings.includes("Volume swings"))
        return false;
      if (liquidityFilter === "PRICE SWINGS" && !row.warnings.includes("Price swings")) return false;
      if (
        liquidityFilter !== "ALL" &&
        liquidityFilter !== "VOLUME SWINGS" &&
        liquidityFilter !== "PRICE SWINGS" &&
        row.signal !== liquidityFilter
      )
        return false;
      if (row.status === "ok" && row.profit < profitLimit) return false;
      if (row.status === "ok" && row.stableVol_3 < volumeLimit) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.status === "missing" && b.status !== "missing") return 1;
      if (a.status !== "missing" && b.status === "missing") return -1;
      const valA = sortCol === "vol_3" ? a.stableVol_3 : a[sortCol];
      const valB = sortCol === "vol_3" ? b.stableVol_3 : b[sortCol];
      if (typeof valA === "number" && typeof valB === "number")
        return sortDesc ? valB - valA : valA - valB;
      return sortDesc
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });

    return filtered;
  }, [
    allRows,
    deferredSearchTerm,
    hideMissing,
    liquidityFilter,
    maxLevel,
    minLevel,
    minProfit,
    minVolume,
    onlyProfitable,
    sortCol,
    sortDesc,
  ]);

  const summary = useMemo<AlchemySummary>(() => {
    return allRows.reduce<AlchemySummary>((acc, row) => {
      if (row.status !== "ok") return acc;
      if (!acc.best || row.profit > acc.best.profit) acc.best = row;
      if (!acc.hourly || row.profitPerHour > acc.hourly.profitPerHour) acc.hourly = row;
      if (row.action === "MARKET" && (!acc.market || row.profit > acc.market.profit))
        acc.market = row;
      if (row.action === "VENDOR" && (!acc.vendor || row.profit > acc.vendor.profit))
        acc.vendor = row;
      if (!acc.volume || row.stableVol_3 > acc.volume.stableVol_3) acc.volume = row;
      const isRiskyProfit =
        row.profit > 0 &&
        (row.liquidityRisk ||
          row.sellThroughRisk ||
          (row.stableVol_3 > 0 && row.stableVol_3 < 40));
      if (isRiskyProfit && (!acc.risky || row.profit > acc.risky.profit)) acc.risky = row;
      return acc;
    }, {});
  }, [allRows]);

  useEffect(() => {
    setSelectedRow((currentRow) => {
      if (!currentRow) return null;
      return (
        allRows.find((row) => row.name === currentRow.name && row.status === "ok") || currentRow
      );
    });
  }, [allRows]);

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
    } else {
      autoOpenedRef.current = null;
    }
  }, [allRows, searchParams]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedRow(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSort = (col: AlchemySortKey) => {
    if (sortCol === col) setSortDesc((prev) => !prev);
    else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const activeFilterCount = [
    searchTerm.trim().length > 0,
    minLevel !== "" && minLevel !== 0,
    maxLevel !== "" && maxLevel !== 89,
    minProfit !== "",
    minVolume !== "",
    liquidityFilter !== "ALL",
    onlyProfitable,
    !hideMissing,
    ownedCostMode,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const profitableRowCount = rows.filter((row) => row.status === "ok" && row.profit > 0).length;
  const marketRowCount = rows.filter((row) => row.status === "ok" && row.action === "MARKET").length;
  const currentSortLabel = ALCHEMY_SORT_LABELS[sortCol];

  const resetAlchemyControls = () => {
    setSearchTerm("");
    setMinLevel(0);
    setMaxLevel(89);
    setMinProfit("");
    setMinVolume("");
    setLiquidityFilter("ALL");
    setOnlyProfitable(false);
    setHideMissing(true);
    setOwnedMode(false);
    setSortCol("profitPerHour");
    setSortDesc(true);
  };

  const updatedAt = scraperStatus?.last_updated || data?._meta?.last_updated;
  const dataAgeMinutes = updatedAt
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000)
    : null;
  const staleMarket = dataAgeMinutes !== null && dataAgeMinutes > 90;

  return {
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
    hideMissing,
    setHideMissing,
    ownedCostMode,
    setOwnedMode,
    sortCol,
    setSortCol,
    sortDesc,
    setSortDesc,
    handleSort,
    selectedRow,
    setSelectedRow,
    toggleOwnedMaterial,
    resetAlchemyControls,
    parsedActiveHours,
    activeHoursSource,
    parsedBartering,
    activeProfileName,
    marketTaxRate,
    rows,
    allRows,
    summary,
    mythicSearchMatches,
    staleMarket,
    dataAgeMinutes,
    activeFilterCount,
    hasActiveFilters,
    profitableRowCount,
    marketRowCount,
    currentSortLabel,
    openItemByName,
    prefetchItem,
  };
}
