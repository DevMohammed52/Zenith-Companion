"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DollarSign, Hammer, Plus, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from "@/lib/preferences";
import { useItemModal } from "@/context/ItemModalContext";
import { useData } from "@/context/DataContext";
import { getMerchantBuyPrice } from "@/constants";

type PriceSource = "custom" | "settings" | "3d" | "7d" | "14d" | "30d" | "merchant" | "vendor" | "none";
type RecipeCostMode = "full" | "remaining" | "owned";
type BestPath = "MARKET" | "VENDOR" | "CUSTOM";

type MarketItem = {
  avg_3?: number;
  avg_7?: number;
  avg_14?: number;
  avg_30?: number;
  vol_3?: number;
  vendor_price?: number;
};

type DbRecipeMaterial = {
  item_name?: string;
  name?: string;
  quantity?: number;
  qty?: number;
};

type DbRecipe = {
  skill?: string;
  level_required?: number;
  max_uses?: number;
  experience?: number;
  materials?: DbRecipeMaterial[];
  result?: {
    item_name?: string;
  };
};

type DbItem = {
  name?: string;
  type?: string;
  quality?: string;
  image_url?: string;
  vendor_price?: number;
  is_tradeable?: boolean;
  recipe?: DbRecipe | null;
};

type MythicRecipe = {
  resultName: string;
  recipeName: string;
  level: number;
  maxUses: number;
  experience: number;
  recipeQuality: string;
  resultQuality: string;
  recipeTradeable: boolean;
  imageUrl?: string;
  materials: { name: string; qty: number }[];
};

const STORAGE_KEYS = {
  active: "zenith_mythic_active_recipes",
  recipePrices: "zenith_mythic_recipe_prices",
  uses: "zenith_mythic_uses",
  materialPrices: "zenith_mythic_mat_prices",
  sellPrices: "zenith_mythic_sell_prices",
  costMode: "zenith_mythic_recipe_cost_mode",
};

const MYTHIC_CRAFT_TIME_SECONDS = 1363.6;

const isFinitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const formatGold = (value: number, digits = 0) =>
  value.toLocaleString(undefined, { maximumFractionDigits: digits });

const formatSignedGold = (value: number, digits = 0) =>
  `${value >= 0 ? "+" : ""}${formatGold(value, digits)}g`;

const formatSource = (source: PriceSource) => {
  if (source === "custom") return "Card custom";
  if (source === "settings") return "Settings custom";
  if (source === "merchant") return "Merchant buy cost";
  if (source === "vendor") return "Vendor sell fallback";
  if (source === "none") return "No price data";
  return `${source.toUpperCase()} market avg`;
};

function readJson<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNumberRecord = (value: unknown): value is Record<string, number> =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.values(value as Record<string, unknown>).every(isNonNegativeNumber);

const isNestedNumberRecord = (value: unknown): value is Record<string, Record<string, number>> =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.values(value as Record<string, unknown>).every(isNumberRecord);

const isRecipeCostMode = (value: unknown): value is RecipeCostMode =>
  value === "full" || value === "remaining" || value === "owned";

const parseOptionalPrice = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, value);
};

const clampUses = (value: string | number, maxUses: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(1, Math.floor(parsed)), Math.max(1, maxUses));
};

export default function MythicAlchemyPage() {
  const { marketData: data, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const { openItemByName } = useItemModal();
  const [activeRecipeNames, setActiveRecipeNames] = useState<string[]>([]);
  const [customRecipePrices, setCustomRecipePrices] = useState<Record<string, number>>({});
  const [usesLeft, setUsesLeft] = useState<Record<string, number>>({});
  const [customMaterialPrices, setCustomMaterialPrices] = useState<Record<string, Record<string, number>>>({});
  const [customSellPrices, setCustomSellPrices] = useState<Record<string, number>>({});
  const [recipeCostMode, setRecipeCostMode] = useState<RecipeCostMode>("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const marketData = useMemo(() => (data || {}) as Record<string, MarketItem>, [data]);
  const itemsByName = useMemo(() => (allItemsDb || {}) as Record<string, DbItem>, [allItemsDb]);
  const settingsPrices = useMemo(() => preferences.customPrices || {}, [preferences.customPrices]);

  const mythicRecipes = useMemo(() => {
    const grouped = new Map<string, MythicRecipe>();

    for (const item of Object.values(itemsByName)) {
      const recipe = item.recipe;
      const resultName = recipe?.result?.item_name;
      const level = Number(recipe?.level_required) || 0;
      const maxUses = Number(recipe?.max_uses) || 0;
      const skill = String(recipe?.skill || "").toLowerCase();

      if (!item.name || item.type !== "RECIPE" || skill !== "alchemy" || !resultName || level < 90 || maxUses <= 0) {
        continue;
      }

      const materials = (recipe?.materials || [])
        .map((material) => ({
          name: material.item_name || material.name || "",
          qty: Number(material.quantity ?? material.qty ?? 0),
        }))
        .filter((material) => material.name && material.qty > 0);

      if (materials.length === 0) continue;

      const resultItem = itemsByName[resultName];
      const candidate: MythicRecipe = {
        resultName,
        recipeName: item.name,
        level,
        maxUses,
        experience: Number(recipe?.experience) || 0,
        recipeQuality: item.quality || "MYTHIC",
        resultQuality: resultItem?.quality || "MYTHIC",
        recipeTradeable: item.is_tradeable !== false && !/\(Untradable\)$/i.test(item.name),
        imageUrl: resultItem?.image_url || item.image_url,
        materials,
      };

      const existing = grouped.get(resultName);
      if (!existing || (!existing.recipeTradeable && candidate.recipeTradeable)) {
        grouped.set(resultName, candidate);
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.resultName.localeCompare(b.resultName));
  }, [itemsByName]);

  const recipeByResult = useMemo(() => {
    const map = new Map<string, MythicRecipe>();
    mythicRecipes.forEach((recipe) => map.set(recipe.resultName, recipe));
    return map;
  }, [mythicRecipes]);

  useEffect(() => {
    setActiveRecipeNames(readJson(STORAGE_KEYS.active, [], isStringArray));
    setCustomRecipePrices(readJson(STORAGE_KEYS.recipePrices, {}, isNumberRecord));
    setUsesLeft(readJson(STORAGE_KEYS.uses, {}, isNumberRecord));
    setCustomMaterialPrices(readJson(STORAGE_KEYS.materialPrices, {}, isNestedNumberRecord));
    setCustomSellPrices(readJson(STORAGE_KEYS.sellPrices, {}, isNumberRecord));

    const storedCostMode = localStorage.getItem(STORAGE_KEYS.costMode);
    if (isRecipeCostMode(storedCostMode)) setRecipeCostMode(storedCostMode);

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    setLoaded(true);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.active, JSON.stringify(activeRecipeNames));
    localStorage.setItem(STORAGE_KEYS.recipePrices, JSON.stringify(customRecipePrices));
    localStorage.setItem(STORAGE_KEYS.uses, JSON.stringify(usesLeft));
    localStorage.setItem(STORAGE_KEYS.materialPrices, JSON.stringify(customMaterialPrices));
    localStorage.setItem(STORAGE_KEYS.sellPrices, JSON.stringify(customSellPrices));
    localStorage.setItem(STORAGE_KEYS.costMode, recipeCostMode);
  }, [activeRecipeNames, customMaterialPrices, customRecipePrices, customSellPrices, loaded, recipeCostMode, usesLeft]);

  useEffect(() => {
    if (!loaded || mythicRecipes.length === 0) return;
    setActiveRecipeNames((current) => current.filter((name) => recipeByResult.has(name)));
  }, [loaded, mythicRecipes.length, recipeByResult]);

  const getMarketAverage = useCallback((itemName: string): { price: number; source: PriceSource } => {
    const item = marketData[itemName];
    if (!item) return { price: 0, source: "none" };
    if (isFinitePositive(item.avg_3)) return { price: item.avg_3, source: "3d" };
    if (isFinitePositive(item.avg_7)) return { price: item.avg_7, source: "7d" };
    if (isFinitePositive(item.avg_14)) return { price: item.avg_14, source: "14d" };
    if (isFinitePositive(item.avg_30)) return { price: item.avg_30, source: "30d" };
    return { price: 0, source: "none" };
  }, [marketData]);

  const getVendorPrice = useCallback((itemName: string) => {
    const marketVendor = marketData[itemName]?.vendor_price;
    if (isFinitePositive(marketVendor)) return marketVendor;
    const dbVendor = itemsByName[itemName]?.vendor_price;
    return isFinitePositive(dbVendor) ? dbVendor : 0;
  }, [itemsByName, marketData]);

  const getInputFallbackPrice = useCallback((itemName: string): { price: number; source: PriceSource } => {
    const merchantBuyPrice = getMerchantBuyPrice(itemName);
    if (merchantBuyPrice > 0) return { price: merchantBuyPrice, source: "merchant" };

    const vendorSellPrice = getVendorPrice(itemName);
    if (vendorSellPrice > 0) return { price: vendorSellPrice, source: "vendor" };

    return { price: 0, source: "none" };
  }, [getVendorPrice]);

  const getPricedItem = useCallback((
    itemName: string,
    localOverride: number | null,
    allowVendorFallback: boolean,
  ): { price: number; source: PriceSource; settingsPrice: number } => {
    if (localOverride !== null) return { price: localOverride, source: "custom", settingsPrice: 0 };

    const settingsPrice = settingsPrices[itemName];
    if (isFinitePositive(settingsPrice)) return { price: settingsPrice, source: "settings", settingsPrice };

    const market = getMarketAverage(itemName);
    if (market.price > 0) return { ...market, settingsPrice: 0 };

    if (allowVendorFallback) {
      const fallback = getInputFallbackPrice(itemName);
      if (fallback.price > 0) return { ...fallback, settingsPrice: 0 };
    }

    return { price: 0, source: "none", settingsPrice: 0 };
  }, [getInputFallbackPrice, getMarketAverage, settingsPrices]);

  const availableMythics = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return mythicRecipes.filter((recipe) => {
      if (activeRecipeNames.includes(recipe.resultName)) return false;
      if (!query) return true;
      return (
        recipe.resultName.toLowerCase().includes(query) ||
        recipe.recipeName.toLowerCase().includes(query) ||
        recipe.materials.some((material) => material.name.toLowerCase().includes(query))
      );
    });
  }, [activeRecipeNames, mythicRecipes, searchTerm]);

  const activeRows = useMemo(() => {
    const parsedBartering = Number(preferences.barteringBoost) || 0;
    const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);

    return activeRecipeNames
      .map((name) => recipeByResult.get(name))
      .filter((recipe): recipe is MythicRecipe => Boolean(recipe))
      .map((recipe) => {
        const maxUses = Math.max(1, recipe.maxUses);
        const currentUses = clampUses(usesLeft[recipe.resultName] || maxUses, maxUses);
        const localRecipePrice = customRecipePrices[recipe.resultName] ?? null;
        const recipePrice = getPricedItem(recipe.recipeName, localRecipePrice, false);
        const recipeCostDivisor = recipeCostMode === "remaining" ? currentUses : maxUses;
        const recipeCostPerCraft = recipeCostMode === "owned" ? 0 : recipePrice.price / recipeCostDivisor;

        const materialBreakdown = recipe.materials.map((material) => {
          const localPrice = customMaterialPrices[recipe.resultName]?.[material.name] ?? null;
          const price = getPricedItem(material.name, localPrice, true);
          return {
            name: material.name,
            qty: material.qty,
            unitPrice: price.price,
            priceSource: price.source,
            localPrice,
            settingsPrice: price.settingsPrice,
            total: price.price * material.qty,
          };
        });

        const materialCost = materialBreakdown.reduce((sum, material) => sum + material.total, 0);
        const localSellPrice = customSellPrices[recipe.resultName] ?? null;
        const salePrice = getPricedItem(recipe.resultName, localSellPrice, false);
        const marketGross = salePrice.price;
        const revenue = marketGross * marketTaxMultiplier;
        const vendorRevenue = getVendorPrice(recipe.resultName) * (1 + parsedBartering / 100);
        const bestRevenue = Math.max(revenue, vendorRevenue);
        const bestPath: BestPath =
          vendorRevenue > revenue ? "VENDOR" : salePrice.source === "custom" || salePrice.source === "settings" ? "CUSTOM" : "MARKET";
        const totalCostPerCraft = materialCost + recipeCostPerCraft;
        const profit = bestRevenue - totalCostPerCraft;
        const craftsPerHour = 3600 / MYTHIC_CRAFT_TIME_SECONDS;
        const profitPerHour = profit * craftsPerHour;
        const roi = totalCostPerCraft > 0 ? (profit / totalCostPerCraft) * 100 : 0;
        const totalRemainingProfit = profit * currentUses;

        return {
          recipe,
          materialCost,
          recipePrice: recipePrice.price,
          recipePriceSource: recipePrice.source,
          localRecipePrice,
          recipeCostPerCraft,
          totalCostPerCraft,
          revenue,
          marketGross,
          marketPriceSource: salePrice.source,
          localSellPrice,
          vendorRevenue,
          bestRevenue,
          profit,
          profitPerHour,
          roi,
          totalRemainingProfit,
          vol_3: marketData[recipe.resultName]?.vol_3 || 0,
          bestPath,
          usesLeft: currentUses,
          materialBreakdown,
        };
      })
      .sort((a, b) => b.profitPerHour - a.profitPerHour);
  }, [
    activeRecipeNames,
    customMaterialPrices,
    customRecipePrices,
    customSellPrices,
    getPricedItem,
    getVendorPrice,
    marketData,
    preferences.barteringBoost,
    preferences.membership,
    recipeByResult,
    recipeCostMode,
    usesLeft,
  ]);

  const labSummary = useMemo(() => {
    const totalPotentialProfit = activeRows.reduce((sum, row) => sum + row.totalRemainingProfit, 0);
    const best = activeRows[0];
    return { totalPotentialProfit, best };
  }, [activeRows]);

  const addToLab = (recipe: MythicRecipe) => {
    setActiveRecipeNames((current) => (current.includes(recipe.resultName) ? current : [...current, recipe.resultName]));
    setUsesLeft((current) => ({ ...current, [recipe.resultName]: current[recipe.resultName] || recipe.maxUses }));
    setSearchTerm("");
    setIsSearchOpen(false);
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
  };

  const updateRecipePrice = (resultName: string, raw: string) => {
    const parsed = parseOptionalPrice(raw);
    setCustomRecipePrices((current) => {
      const next = { ...current };
      if (parsed === null) delete next[resultName];
      else next[resultName] = parsed;
      return next;
    });
  };

  const updateMaterialPrice = (resultName: string, materialName: string, raw: string) => {
    const parsed = parseOptionalPrice(raw);
    setCustomMaterialPrices((current) => {
      const recipePrices = { ...(current[resultName] || {}) };
      if (parsed === null) delete recipePrices[materialName];
      else recipePrices[materialName] = parsed;
      return { ...current, [resultName]: recipePrices };
    });
  };

  const updateSellPrice = (resultName: string, raw: string) => {
    const parsed = parseOptionalPrice(raw);
    setCustomSellPrices((current) => {
      const next = { ...current };
      if (parsed === null) delete next[resultName];
      else next[resultName] = parsed;
      return next;
    });
  };

  const setRecipeUses = (recipe: MythicRecipe, raw: string) => {
    setUsesLeft((current) => ({ ...current, [recipe.resultName]: clampUses(raw, recipe.maxUses) }));
  };

  const taxRate = getMarketTaxRate(preferences.membership);
  const taxNetPercent = Math.round(getMarketTaxMultiplier(preferences.membership) * 100);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1 className="header-title">
            <Sparkles size={24} color="var(--text-accent)" /> MYTHIC WORKBENCH
          </h1>
          <p className="header-subtitle">Level 90 alchemy recipe projects powered by the live item database.</p>
        </div>

        <div className="workbench-actions" ref={searchRef}>
          <button type="button" className="search-trigger" onClick={() => setIsSearchOpen((open) => !open)}>
            <Plus size={16} /> Add Project
          </button>
          {isSearchOpen && (
            <div className="search-dropdown custom-scrollbar">
              <label className="dropdown-input">
                <Search size={14} />
                <input
                  autoFocus
                  placeholder="Search recipe, result, material..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <div className="dropdown-results">
                {availableMythics.length > 0 ? (
                  availableMythics.map((recipe) => (
                    <button key={recipe.resultName} type="button" className="result-item" onClick={() => addToLab(recipe)}>
                      <span>{recipe.resultName}</span>
                      <small>{recipe.recipeName}</small>
                    </button>
                  ))
                ) : (
                  <div className="no-results">{mythicRecipes.length === 0 ? "Loading item database..." : "No matching mythic recipes"}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lab-summary">
        <div className="summary-card">
          <div className="summary-content">
            <span className="summary-label">Combined Remaining Profit</span>
            <span className={`summary-value ${labSummary.totalPotentialProfit >= 0 ? "text-success" : "text-danger"}`}>
              {formatSignedGold(labSummary.totalPotentialProfit)}
            </span>
          </div>
          <div className="summary-hint">
            {activeRows.length > 0
              ? `Best rate: ${labSummary.best.recipe.resultName} at ${formatSignedGold(labSummary.best.profitPerHour)}/hr`
              : `${mythicRecipes.length} database recipes available`}
          </div>
        </div>

        <div className="mode-card">
          <span className="summary-label">Recipe Cost Mode</span>
          <div className="mode-toggle" role="group" aria-label="Recipe cost mode">
            <button type="button" className={recipeCostMode === "full" ? "active" : ""} onClick={() => setRecipeCostMode("full")}>
              Full recipe
            </button>
            <button type="button" className={recipeCostMode === "remaining" ? "active" : ""} onClick={() => setRecipeCostMode("remaining")}>
              Remaining uses
            </button>
            <button type="button" className={recipeCostMode === "owned" ? "active" : ""} onClick={() => setRecipeCostMode("owned")}>
              Owned
            </button>
          </div>
        </div>
      </div>

      <div className="lab-grid">
        {activeRows.length === 0 ? (
          <div className="empty-bench">
            <div className="empty-icon">
              <Hammer size={48} />
            </div>
            <h2>No Active Projects</h2>
            <p>Pin a mythic alchemy recipe to evaluate materials, recipe cost, market/vendor revenue, and remaining-use value.</p>
            <button type="button" className="empty-add-btn" onClick={() => setIsSearchOpen(true)}>
              <Plus size={18} /> Add Your First Recipe
            </button>
          </div>
        ) : (
          activeRows.map((row) => (
            <article key={row.recipe.resultName} className="mythic-card">
              <button className="remove-btn" onClick={() => removeFromLab(row.recipe.resultName)} title="Remove project" type="button">
                <X size={18} />
              </button>

              <div className="card-header">
                <div className="title-area">
                  <button type="button" className="title-button" onClick={() => openItemByName(row.recipe.resultName)}>
                    {row.recipe.resultName}
                  </button>
                  <button type="button" className="recipe-link" onClick={() => openItemByName(row.recipe.recipeName)}>
                    {row.recipe.recipeName}
                  </button>
                  <div className="meta-pills">
                    <span>Lvl {row.recipe.level}</span>
                    <span>{row.recipe.resultQuality}</span>
                    <span>{row.recipe.maxUses} uses</span>
                    <span>{row.vol_3.toLocaleString()} 3d vol</span>
                  </div>
                </div>
                <div className={`profit-badge ${row.profitPerHour >= 0 ? "pos" : "neg"}`}>
                  <strong>{formatSignedGold(row.profitPerHour)}/hr</strong>
                  <span>{formatSignedGold(row.profit)}/craft</span>
                </div>
              </div>

              <div className="card-grid">
                <section className="card-left">
                  <div className="card-section">
                    <div className="section-label">
                      <TrendingUp size={12} /> Project Overhead
                    </div>
                    <div className="investment-input-group">
                      <label className="input-wrapper">
                        <span>Recipe Acquisition Price</span>
                        <div className="input-row">
                          <input
                            type="number"
                            min="0"
                            placeholder={row.recipePrice > 0 ? row.recipePrice.toLocaleString() : "No market data"}
                            value={row.localRecipePrice ?? ""}
                            onChange={(event) => updateRecipePrice(row.recipe.resultName, event.target.value)}
                          />
                          <span className="currency">Gold</span>
                        </div>
                        <div className="input-hint-row">
                          <span>{formatSource(row.recipePriceSource)}</span>
                          <span className="fee-split">{formatGold(row.recipeCostPerCraft, 2)}g / craft</span>
                        </div>
                      </label>

                      <label className="uses-control">
                        <input
                          type="number"
                          min="1"
                          max={row.recipe.maxUses}
                          value={row.usesLeft}
                          onChange={(event) => setRecipeUses(row.recipe, event.target.value)}
                        />
                        <span>Uses remaining</span>
                      </label>
                    </div>
                  </div>

                  <div className="card-section">
                    <div className="section-label">
                      <Hammer size={12} /> Material Ledger
                    </div>
                    <div className="materials-ledger">
                      {row.materialBreakdown.map((material) => (
                        <div key={material.name} className="ledger-row">
                          <div className="ledger-info">
                            <span className="mat-qty">{material.qty}x</span>
                            <button type="button" className="mat-name" onClick={() => openItemByName(material.name)}>
                              {material.name}
                            </button>
                          </div>
                          <div className="ledger-input">
                            <div className="input-source-hint">{formatSource(material.priceSource)}</div>
                            <input
                              type="number"
                              min="0"
                              placeholder={material.unitPrice > 0 ? material.unitPrice.toLocaleString() : "Missing"}
                              value={material.localPrice ?? ""}
                              onChange={(event) => updateMaterialPrice(row.recipe.resultName, material.name, event.target.value)}
                            />
                            <div className="ledger-total">{formatGold(material.total, 2)}g</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="card-right">
                  <div className="card-section">
                    <div className="section-label">
                      <DollarSign size={12} /> Revenue Strategy
                    </div>
                    <div className="revenue-manager">
                      <label className="market-revenue-box">
                        <span>Gross Sell Price</span>
                        <div className="input-row compact">
                          <input
                            type="number"
                            min="0"
                            placeholder={row.marketGross > 0 ? row.marketGross.toLocaleString() : "No market data"}
                            value={row.localSellPrice ?? ""}
                            onChange={(event) => updateSellPrice(row.recipe.resultName, event.target.value)}
                          />
                          <span className="currency">g</span>
                        </div>
                        <div className="market-meta">
                          <span>{formatSource(row.marketPriceSource)}</span>
                          <span>
                            {taxNetPercent}% Net: <b>{formatGold(row.revenue)}g</b>
                          </span>
                        </div>
                      </label>

                      <div className={`vendor-revenue-box ${row.bestPath === "VENDOR" ? "highlight" : ""}`}>
                        <div>
                          <div className="vendor-label">Vendor path (+{preferences.barteringBoost || 0}%)</div>
                          <div className="vendor-note">Market tax is {Math.round(taxRate * 100)}%</div>
                        </div>
                        <div className="vendor-val">{formatGold(row.vendorRevenue)}g</div>
                      </div>
                    </div>
                  </div>

                  <div className="footer-stats-modern">
                    <div className="stat-group">
                      <span className="label">Best Path</span>
                      <span className={`value path-${row.bestPath.toLowerCase()}`}>{row.bestPath}</span>
                    </div>
                    <div className="stat-group">
                      <span className="label">ROI</span>
                      <span className={`value ${row.roi >= 0 ? "text-success" : "text-danger"}`}>{row.roi.toFixed(1)}%</span>
                    </div>
                    <div className="stat-group highlight">
                      <span className="label">Remaining Project Gain ({row.usesLeft} crafts)</span>
                      <span className={`value large ${row.totalRemainingProfit >= 0 ? "text-success" : "text-danger"}`}>
                        {formatSignedGold(row.totalRemainingProfit)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </article>
          ))
        )}
      </div>

      <style jsx>{`
        .container { padding-bottom: 5rem; }
        .header { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
        .header-title { font-size: 2.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; color: #fff; }
        .header-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem; }

        .workbench-actions { position: relative; z-index: 100; }
        .search-trigger, .empty-add-btn {
          background: var(--text-accent); color: #000; border: none; padding: 0.75rem 1.25rem; border-radius: 12px;
          font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: transform 0.2s, filter 0.2s;
        }
        .search-trigger:hover, .empty-add-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }

        .search-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0; width: min(440px, calc(100vw - 2rem)); background: #0f0f0f;
          border: 1px solid var(--border-subtle); border-radius: 18px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); overflow: hidden;
        }
        .dropdown-input { padding: 1rem; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); }
        .dropdown-input input { background: none; border: none; color: #fff; font-size: 0.95rem; width: 100%; outline: none; }
        .dropdown-results { max-height: 370px; overflow-y: auto; padding: 0.35rem; }
        .result-item {
          width: 100%; padding: 0.85rem 1rem; border: none; border-radius: 12px; cursor: pointer; background: transparent; color: rgba(255,255,255,0.78);
          text-align: left; display: flex; flex-direction: column; gap: 0.25rem; transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .result-item:hover, .result-item:focus-visible { background: rgba(255,255,255,0.06); color: var(--text-accent); outline: none; transform: translateX(3px); }
        .result-item span { font-weight: 800; }
        .result-item small { color: var(--text-muted); font-size: 0.72rem; }
        .no-results { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; }

        .lab-summary { margin-bottom: 2rem; display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 380px); gap: 1rem; }
        .summary-card, .mode-card {
          background: linear-gradient(135deg, color-mix(in srgb, var(--text-accent), transparent 96%), rgba(255,255,255,0.015));
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 88%); padding: 1.4rem; border-radius: 22px;
        }
        .summary-content { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
        .summary-label { font-size: 0.72rem; font-weight: 900; color: var(--text-accent); letter-spacing: 0.08em; text-transform: uppercase; }
        .summary-value { font-size: 2.2rem; font-weight: 900; color: #fff; font-family: var(--font-mono); }
        .summary-hint { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.5rem; }
        .mode-toggle { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem; margin-top: 0.85rem; }
        .mode-toggle button { border: 1px solid var(--border-subtle); border-radius: 10px; background: rgba(0,0,0,0.25); color: var(--text-muted); padding: 0.65rem 0.5rem; font-weight: 800; cursor: pointer; }
        .mode-toggle button.active { background: var(--text-accent); border-color: var(--text-accent); color: #000; }

        .lab-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .empty-bench {
          min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          background: rgba(255,255,255,0.015); border: 2px dashed var(--border-subtle); border-radius: 28px; padding: 4rem 2rem;
        }
        .empty-icon { margin-bottom: 1.25rem; opacity: 0.25; }
        .empty-bench h2 { color: #fff; font-size: 1.75rem; margin-bottom: 0.75rem; }
        .empty-bench p { font-size: 0.95rem; margin-bottom: 2rem; max-width: 520px; color: var(--text-muted); }

        .mythic-card {
          background: #080808; border: 1px solid rgba(255,255,255,0.07); border-radius: 26px; padding: 2rem; position: relative;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s; animation: card-in 0.28s ease both;
        }
        .mythic-card:hover { border-color: color-mix(in srgb, var(--text-accent), transparent 76%); box-shadow: 0 18px 50px rgba(0,0,0,0.28); transform: translateY(-2px); }
        @keyframes card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .remove-btn {
          position: absolute; top: -10px; right: -10px; width: 34px; height: 34px; border-radius: 50%; background: #ef4444; border: 3px solid #080808;
          color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s, filter 0.2s; z-index: 10;
        }
        .remove-btn:hover { transform: scale(1.08); filter: brightness(1.08); }

        .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 2rem; }
        .title-area { min-width: 0; }
        .title-button { display: block; border: none; background: transparent; padding: 0; color: #fff; font-size: 1.85rem; font-weight: 900; text-align: left; cursor: pointer; overflow-wrap: anywhere; }
        .title-button:hover { color: var(--text-accent); }
        .recipe-link { border: none; background: transparent; padding: 0.25rem 0 0; color: var(--text-muted); font-size: 0.82rem; cursor: pointer; text-align: left; }
        .recipe-link:hover { color: var(--text-accent); }
        .meta-pills { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.8rem; }
        .meta-pills span { border: 1px solid var(--border-subtle); border-radius: 999px; color: var(--text-muted); padding: 0.28rem 0.55rem; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; }
        .profit-badge {
          min-width: 190px; padding: 0.8rem 1rem; border-radius: 14px; font-family: var(--font-mono); display: flex; flex-direction: column; align-items: flex-end; gap: 0.15rem;
        }
        .profit-badge strong { font-size: 1.05rem; }
        .profit-badge span { font-size: 0.75rem; opacity: 0.75; }
        .profit-badge.pos { background: rgba(34,197,94,0.1); color: #8ff0bf; border: 1px solid rgba(34,197,94,0.2); }
        .profit-badge.neg { background: rgba(239,68,68,0.1); color: #ff9d9d; border: 1px solid rgba(239,68,68,0.2); }

        .card-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr); gap: 2rem; }
        .card-section { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .section-label { font-size: 0.68rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; display: flex; align-items: center; gap: 8px; }
        .investment-input-group { display: grid; grid-template-columns: minmax(0, 1fr) 160px; gap: 0.85rem; align-items: end; }
        .input-wrapper { display: flex; flex-direction: column; gap: 0.55rem; }
        .input-wrapper > span, .market-revenue-box > span { font-size: 0.78rem; color: var(--text-muted); font-weight: 700; }
        .input-row { position: relative; display: flex; align-items: center; }
        .input-row input {
          width: 100%; background: rgba(255,255,255,0.025); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.9rem 4rem 0.9rem 1rem;
          color: #fff; font-family: var(--font-mono); font-weight: 800; font-size: 1rem; transition: border-color 0.2s, background 0.2s;
        }
        .input-row input:focus { border-color: var(--text-accent); background: rgba(255,255,255,0.05); outline: none; }
        .input-row.compact input { padding: 0.65rem 2.5rem 0.65rem 0.85rem; }
        .input-row .currency { position: absolute; right: 16px; font-size: 0.72rem; color: var(--text-muted); font-weight: 900; }
        .input-hint-row, .market-meta { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.72rem; color: var(--text-muted); }
        .fee-split, .market-meta b { color: var(--text-accent); }
        .uses-control { display: flex; flex-direction: column; gap: 0.55rem; }
        .uses-control input {
          width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.9rem 0.75rem;
          color: var(--text-accent); font-weight: 900; text-align: center; font-family: var(--font-mono);
        }
        .uses-control span { font-size: 0.68rem; color: var(--text-muted); font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }

        .materials-ledger { display: flex; flex-direction: column; gap: 0.55rem; }
        .ledger-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.75rem 0.9rem; background: rgba(255,255,255,0.018); border: 1px solid rgba(255,255,255,0.04); border-radius: 14px; }
        .ledger-info { display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
        .mat-qty { font-size: 0.75rem; color: var(--text-muted); font-weight: 900; min-width: 28px; }
        .mat-name { border: none; background: transparent; padding: 0; color: #fff; font-weight: 700; cursor: pointer; text-align: left; overflow-wrap: anywhere; }
        .mat-name:hover { color: var(--text-accent); text-decoration: underline; }
        .ledger-input { display: grid; grid-template-columns: 90px 100px 100px; align-items: center; gap: 0.6rem; }
        .input-source-hint { font-size: 0.58rem; font-weight: 900; color: rgba(255,255,255,0.22); text-transform: uppercase; text-align: right; }
        .ledger-input input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.45rem 0.55rem; color: #fff; font-size: 0.8rem; font-family: var(--font-mono); text-align: right; }
        .ledger-input input:focus { border-color: var(--text-accent); outline: none; }
        .ledger-total { text-align: right; font-size: 0.84rem; font-weight: 800; color: rgba(255,255,255,0.48); font-family: var(--font-mono); }

        .revenue-manager { display: flex; flex-direction: column; gap: 1rem; }
        .market-revenue-box { background: rgba(255,255,255,0.018); border: 1px solid var(--border-subtle); border-radius: 18px; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .vendor-revenue-box { background: rgba(255,255,255,0.012); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 1rem 1.1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; opacity: 0.65; transition: opacity 0.25s, border-color 0.25s; }
        .vendor-revenue-box.highlight { background: color-mix(in srgb, var(--text-accent), transparent 96%); border-color: color-mix(in srgb, var(--text-accent), transparent 76%); opacity: 1; }
        .vendor-label { font-size: 0.68rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; }
        .vendor-note { font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 0.25rem; }
        .vendor-val { font-size: 1.05rem; font-weight: 900; color: #fff; font-family: var(--font-mono); }

        .footer-stats-modern { display: grid; gap: 0.85rem; }
        .stat-group { background: rgba(255,255,255,0.014); padding: 1rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.035); }
        .stat-group.highlight { background: linear-gradient(135deg, rgba(34,197,94,0.035), transparent); border-color: rgba(34,197,94,0.12); }
        .stat-group .label { font-size: 0.66rem; color: var(--text-muted); font-weight: 900; text-transform: uppercase; display: block; margin-bottom: 0.35rem; }
        .stat-group .value { font-size: 1.35rem; font-weight: 900; font-family: var(--font-mono); overflow-wrap: anywhere; }
        .stat-group .value.large { font-size: 1.8rem; }
        .path-market, .path-custom { color: #38bdf8; }
        .path-vendor { color: #8ff0bf; }

        @media (max-width: 1200px) {
          .card-grid { grid-template-columns: 1fr; gap: 1.25rem; }
        }

        @media (max-width: 780px) {
          .header { align-items: stretch; flex-direction: column; }
          .header-title { font-size: 1.7rem; }
          .workbench-actions, .search-trigger { width: 100%; }
          .search-dropdown { position: fixed; left: 1rem; right: 1rem; top: 5rem; width: auto; max-height: calc(100vh - 6rem); z-index: 300; }
          .dropdown-results { max-height: calc(100vh - 12rem); }
          .lab-summary { grid-template-columns: 1fr; }
          .summary-content, .card-header { flex-direction: column; align-items: stretch; }
          .summary-value { font-size: 1.55rem; }
          .mode-toggle { grid-template-columns: 1fr; }
          .mythic-card { border-radius: 20px; padding: 1.1rem; }
          .profit-badge { min-width: 0; align-items: flex-start; }
          .investment-input-group { grid-template-columns: 1fr; }
          .ledger-row { align-items: stretch; flex-direction: column; }
          .ledger-input { grid-template-columns: 1fr 110px; }
          .input-source-hint { grid-column: 1 / -1; text-align: left; }
          .vendor-revenue-box { align-items: flex-start; flex-direction: column; }
          .stat-group .value.large { font-size: 1.35rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .mythic-card, .search-trigger, .empty-add-btn, .result-item { animation: none; transition: none; }
        }
      `}</style>
    </main>
  );
}
