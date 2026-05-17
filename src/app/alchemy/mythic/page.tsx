"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, DollarSign, Hammer, Plus, Search, TrendingUp, X } from "lucide-react";
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from "@/lib/preferences";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { useItemModal } from "@/context/ItemModalContext";
import { useData } from "@/context/DataContext";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { getAssaultBuff } from "@/lib/skill-profit";
import {
  MYTHIC_ACTIVE_RECIPES_STORAGE_KEY,
  MYTHIC_CRAFT_TIME_SECONDS,
  MYTHIC_STORAGE_KEYS,
  buildMythicAlchemyRecipes,
  buildRecommendedMythicRecipes,
  calculateMythicProjectRows,
  clampMythicUses,
  isMythicRecipeCostMode,
  isNonNegativeNumber,
  parseOptionalMythicPrice,
  type MythicDbItem,
  type MythicMarketItem,
  type MythicPriceSource,
  type MythicRecipe,
  type MythicRecipeCostMode,
} from "@/lib/mythic-alchemy";

const formatGold = (value: number, _digits = 0) =>
  Math.round(value).toLocaleString();

const formatSignedGold = (value: number, digits = 0) =>
  `${value >= 0 ? "+" : ""}${formatGold(value, digits)}g`;

const formatSource = (source: MythicPriceSource) => {
  if (source === "custom") return "Card custom";
  if (source === "settings") return "Settings custom";
  if (source === "merchant") return "Merchant buy cost";
  if (source === "vendor") return "Vendor sell fallback";
  if (source === "guarded") return "Guarded market value";
  if (source === "none") return "No price data";
  return `${source.toUpperCase()} market avg`;
};

const RECIPE_COST_MODE_HELP: Record<MythicRecipeCostMode, string> = {
  full: "Full recipe spreads the recipe buy price over every listed use.",
  remaining: "Remaining uses spreads the recipe buy price over the uses left on your copy.",
  owned: "Owned ignores recipe purchase cost and only counts materials.",
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

export default function MythicAlchemyPage() {
  const { marketData: data, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName } = useItemModal();
  const searchDropdownId = useId();
  const [activeRecipeNames, setActiveRecipeNames] = useState<string[]>([]);
  const [customRecipePrices, setCustomRecipePrices] = useState<Record<string, number>>({});
  const [usesLeft, setUsesLeft] = useState<Record<string, number>>({});
  const [customMaterialPrices, setCustomMaterialPrices] = useState<Record<string, Record<string, number>>>({});
  const [customSellPrices, setCustomSellPrices] = useState<Record<string, number>>({});
  const [recipeCostMode, setRecipeCostMode] = useState<MythicRecipeCostMode>("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedProjectNames, setExpandedProjectNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const marketData = useMemo(() => (data || {}) as Record<string, MythicMarketItem>, [data]);
  const itemsByName = useMemo(() => (allItemsDb || {}) as Record<string, MythicDbItem>, [allItemsDb]);
  const settingsPrices = useMemo(() => preferences.customPrices || {}, [preferences.customPrices]);
  const activeProfileId = activeProfile?.id || null;
  const profileBarteringBoost = Number(activeProfile ? getProfileBarteringBoost(activeProfile) : 0) || 0;
  const conquestRank = activeProfile ? getProfileConquestRank(activeProfile) : preferences.assaultRank;
  const conquestBuff = getAssaultBuff(conquestRank);
  const alchemyEfficiencyBonus = (preferences.membership ? 10 : 0) + conquestBuff.efficiency;
  const mythicCraftTimeSeconds = MYTHIC_CRAFT_TIME_SECONDS / Math.max(0.01, (100 + alchemyEfficiencyBonus) / 100);
  const profileStorageKeys = useMemo(() => ({
    active: getProfileStorageKey(MYTHIC_STORAGE_KEYS.active, activeProfile?.id),
    recipePrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.recipePrices, activeProfile?.id),
    uses: getProfileStorageKey(MYTHIC_STORAGE_KEYS.uses, activeProfile?.id),
    materialPrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.materialPrices, activeProfile?.id),
    sellPrices: getProfileStorageKey(MYTHIC_STORAGE_KEYS.sellPrices, activeProfile?.id),
    costMode: getProfileStorageKey(MYTHIC_STORAGE_KEYS.costMode, activeProfile?.id),
  }), [activeProfile?.id]);

  const mythicRecipes = useMemo(() => buildMythicAlchemyRecipes(itemsByName), [itemsByName]);

  const recipeByResult = useMemo(() => {
    const map = new Map<string, MythicRecipe>();
    mythicRecipes.forEach((recipe) => map.set(recipe.resultName, recipe));
    return map;
  }, [mythicRecipes]);

  useEffect(() => {
    setLoaded(false);
    const legacyActive = activeProfileId ? [] : readJson(MYTHIC_STORAGE_KEYS.active, [], isStringArray);
    const legacyRecipePrices = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.recipePrices, {}, isNumberRecord);
    const legacyUses = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.uses, {}, isNumberRecord);
    const legacyMaterialPrices = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.materialPrices, {}, isNestedNumberRecord);
    const legacySellPrices = activeProfileId ? {} : readJson(MYTHIC_STORAGE_KEYS.sellPrices, {}, isNumberRecord);

    setActiveRecipeNames(readJson(profileStorageKeys.active, legacyActive, isStringArray));
    setCustomRecipePrices(readJson(profileStorageKeys.recipePrices, legacyRecipePrices, isNumberRecord));
    setUsesLeft(readJson(profileStorageKeys.uses, legacyUses, isNumberRecord));
    setCustomMaterialPrices(readJson(profileStorageKeys.materialPrices, legacyMaterialPrices, isNestedNumberRecord));
    setCustomSellPrices(readJson(profileStorageKeys.sellPrices, legacySellPrices, isNumberRecord));

    const storedCostMode = localStorage.getItem(profileStorageKeys.costMode) ?? (activeProfileId ? null : localStorage.getItem(MYTHIC_STORAGE_KEYS.costMode));
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
  }, [activeRecipeNames, customMaterialPrices, customRecipePrices, customSellPrices, loaded, profileStorageKeys, recipeCostMode, usesLeft]);

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

  const recommendedRecipes = useMemo(() => buildRecommendedMythicRecipes({
    mythicRecipes,
    activeRecipeNames,
    settingsPrices,
    marketData,
    itemsByName,
  }), [activeRecipeNames, itemsByName, marketData, mythicRecipes, settingsPrices]);

  const activeRows = useMemo(() => calculateMythicProjectRows({
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
  }), [
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
    setExpandedProjectNames((current) => current.filter((name) => name !== resultName));
  };

  const toggleProjectDetails = (resultName: string) => {
    setExpandedProjectNames((current) => (
      current.includes(resultName)
        ? current.filter((name) => name !== resultName)
        : [...current, resultName]
    ));
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
    setUsesLeft((current) => ({ ...current, [recipe.resultName]: clampMythicUses(raw, recipe.maxUses) }));
  };

  const taxRate = getMarketTaxRate(preferences.membership);
  const taxNetPercent = Math.round(getMarketTaxMultiplier(preferences.membership) * 100);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1 className="header-title">
            <ZenithIcon name="spark" size={24} style={{ color: "var(--text-accent)" }} /> Mythic Lab
          </h1>
          <p className="header-subtitle">Workbench for level 90 alchemy recipe projects powered by the live item database.</p>
        </div>

        <div className="workbench-actions" ref={searchRef}>
          <button
            type="button"
            className="search-trigger"
            aria-expanded={isSearchOpen}
            aria-controls={searchDropdownId}
            onClick={() => setIsSearchOpen((open) => !open)}
          >
            <Plus size={16} /> Add Project
          </button>
          {isSearchOpen && (
            <div className="search-dropdown custom-scrollbar" id={searchDropdownId} role="dialog" aria-label="Add mythic recipe project">
              <label className="dropdown-input">
                <Search size={14} />
                <input
                  autoFocus
                  aria-label="Search mythic recipe, result, or material"
                  placeholder="Search recipe, result, material..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <div className="dropdown-results">
                {availableMythics.length > 0 ? (
                  availableMythics.map((recipe) => (
                    <button
                      key={recipe.resultName}
                      type="button"
                      className="result-item"
                      aria-label={`Add ${recipe.resultName}. Level ${recipe.level}, ${recipe.maxUses} uses. Recipe: ${recipe.recipeName}`}
                      onClick={() => addToLab(recipe)}
                    >
                      <span>{recipe.resultName}</span>
                      <small>{recipe.recipeName} - Lvl {recipe.level} - {recipe.maxUses} uses</small>
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
          <p className="mode-helper">{RECIPE_COST_MODE_HELP[recipeCostMode]}</p>
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
            {recommendedRecipes.length > 0 && (
              <div className="recipe-index" aria-label="Recommended mythic recipes to review">
                <span className="recipe-index-label">Recommended to review</span>
                {recommendedRecipes.map(({ recipe, outputPrice, recipePrice, missingInputs, liquidity, complete }) => (
                  <button
                    key={recipe.resultName}
                    type="button"
                    className="recipe-index-row"
                    onClick={() => addToLab(recipe)}
                    aria-label={`Pin ${recipe.resultName}. ${complete ? "Prices complete" : `${missingInputs} missing input prices`}. ${liquidity.label}.`}
                  >
                    {recipe.imageUrl ? <img src={recipe.imageUrl} alt="" /> : <span className="recipe-index-fallback" />}
                    <span>
                      <strong>{recipe.resultName}</strong>
                      <small>Lvl {recipe.level} - {recipe.maxUses} uses - {liquidity.label}</small>
                    </span>
                    <em>{complete ? "Ready" : outputPrice.price <= 0 || recipePrice.price <= 0 ? "Needs prices" : `${missingInputs} missing`}</em>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          activeRows.map((row) => {
            const isProjectExpanded = expandedProjectNames.includes(row.recipe.resultName);
            const detailsId = `mythic-project-${row.recipe.resultName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-details`;

            return (
            <article key={row.recipe.resultName} className={`mythic-card ${isProjectExpanded ? "project-expanded" : ""}`}>
              <button className="remove-btn" onClick={() => removeFromLab(row.recipe.resultName)} aria-label={`Remove ${row.recipe.resultName} project`} type="button">
                <X size={18} />
              </button>

              <div className="card-header">
                {row.recipe.imageUrl && <img className="result-art" src={row.recipe.imageUrl} alt="" />}
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
                    <span>{row.outputLiquidity.label}</span>
                  </div>
                </div>
                <div className={`profit-badge ${row.profitPerHour >= 0 ? "pos" : "neg"}`}>
                  <strong>{formatSignedGold(row.profitPerHour)}/hr</strong>
                  <span>{formatSignedGold(row.profit)}/craft</span>
                </div>
              </div>

              <div className="mobile-card-summary" aria-label={`${row.recipe.resultName} project summary`}>
                <div>
                  <span>Remaining</span>
                  <strong className={row.totalRemainingProfit >= 0 ? "text-success" : "text-danger"}>{formatSignedGold(row.totalRemainingProfit)}</strong>
                </div>
                <div>
                  <span>Best path</span>
                  <strong className={`path-${row.bestPath.toLowerCase()}`}>{row.bestPath}</strong>
                </div>
                <div>
                  <span>Warnings</span>
                  <strong>{row.marketWarnings.length}</strong>
                </div>
              </div>

              <button
                type="button"
                className="mobile-details-toggle"
                aria-expanded={isProjectExpanded}
                aria-controls={detailsId}
                onClick={() => toggleProjectDetails(row.recipe.resultName)}
              >
                <span>{isProjectExpanded ? "Hide details" : "Show details"}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>

              <div className="card-grid" id={detailsId}>
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
                            aria-label={`Recipe acquisition price for ${row.recipe.recipeName}`}
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
                          aria-label={`Uses remaining for ${row.recipe.resultName}`}
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
                              aria-label={`Custom unit price for ${material.name}`}
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
                    {row.marketWarnings.length > 0 && (
                      <div className={`market-warning-row ${row.outputLiquidity.tone}`}>
                        <AlertTriangle size={14} aria-hidden="true" />
                        <div className="market-warning-copy">
                          <span>{row.marketWarnings.join(" - ")}</span>
                          <small>{row.outputLiquidity.note}</small>
                        </div>
                      </div>
                    )}
                    <div className="revenue-manager">
                      <label className="market-revenue-box">
                        <span>Gross Sell Price</span>
                        <div className="input-row compact">
                          <input
                            type="number"
                            min="0"
                            aria-label={`Gross sell price for ${row.recipe.resultName}`}
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
                          <div className="vendor-label">Vendor path (+{profileBarteringBoost}% profile bartering)</div>
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
          );
          })
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
        .mode-helper { color: var(--text-muted); font-size: 0.78rem; font-weight: 750; line-height: 1.45; margin: 0.75rem 0 0; }

        .lab-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .empty-bench {
          min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          background: rgba(255,255,255,0.015); border: 2px dashed var(--border-subtle); border-radius: 28px; padding: 4rem 2rem;
        }
        .empty-icon { margin-bottom: 1.25rem; opacity: 0.25; }
        .empty-bench h2 { color: #fff; font-size: 1.75rem; margin-bottom: 0.75rem; }
        .empty-bench p { font-size: 0.95rem; margin-bottom: 2rem; max-width: 520px; color: var(--text-muted); }
        .recipe-index { display: grid; gap: 0.55rem; margin-top: 2rem; max-width: 760px; width: 100%; }
        .recipe-index-label { color: var(--text-accent); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
        .recipe-index-row {
          align-items: center; background: rgba(255,255,255,0.022); border: 1px solid var(--border-subtle); border-radius: 12px;
          color: inherit; cursor: pointer; display: grid; gap: 0.65rem; grid-template-columns: 38px minmax(0, 1fr) auto;
          min-height: 54px; padding: 0.55rem 0.7rem; text-align: left; width: 100%;
        }
        .recipe-index-row:hover, .recipe-index-row:focus-visible { background: rgba(255,255,255,0.05); border-color: var(--text-accent); outline: none; }
        .recipe-index-row img, .recipe-index-fallback { background: rgba(255,255,255,0.05); border-radius: 8px; display: block; height: 38px; width: 38px; }
        .recipe-index-row strong { color: #fff; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .recipe-index-row small { color: var(--text-muted); display: block; font-size: 0.72rem; line-height: 1.35; margin-top: 0.12rem; }
        .recipe-index-row em { color: var(--text-accent); font-size: 0.72rem; font-style: normal; font-weight: 900; white-space: nowrap; }

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
        .result-art { background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: 14px; flex: 0 0 auto; height: 64px; object-fit: cover; width: 64px; }
        .title-area { flex: 1 1 auto; min-width: 0; }
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
        .mobile-card-summary, .mobile-details-toggle { display: none; }

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
        .market-warning-row {
          align-items: flex-start; background: rgba(251,191,36,0.07); border: 1px solid rgba(251,191,36,0.22);
          border-radius: 12px; color: #f8e7bd; display: flex; gap: 0.65rem;
          padding: 0.75rem 0.85rem;
        }
        .market-warning-row svg { color: #fbbf24; flex: 0 0 auto; margin-top: 0.1rem; }
        .market-warning-copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: 0.35rem; min-width: 0; text-align: left; }
        .market-warning-copy span { color: #fff; display: block; font-size: 0.76rem; font-weight: 900; line-height: 1.35; text-transform: uppercase; white-space: normal; }
        .market-warning-copy small { color: var(--text-muted); display: block; line-height: 1.4; }
        .market-warning-row.active, .market-warning-row.steady { background: rgba(56,189,248,0.06); border-color: rgba(56,189,248,0.2); color: var(--text-main); }
        .market-warning-row.active svg, .market-warning-row.steady svg { color: var(--text-accent); }
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
          .result-art { height: 56px; width: 56px; }
          .summary-value { font-size: 1.55rem; }
          .mode-toggle { grid-template-columns: 1fr; }
          .recipe-index-row { grid-template-columns: 34px minmax(0, 1fr); }
          .recipe-index-row em { grid-column: 2; }
          .mythic-card { border-radius: 20px; padding: 1.1rem; }
          .mythic-card:not(.project-expanded) .card-grid { display: none; }
          .profit-badge { min-width: 0; align-items: flex-start; }
          .mobile-card-summary {
            display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; margin: 1rem 0 0;
          }
          .mobile-card-summary div {
            background: rgba(255,255,255,0.018); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px;
            min-width: 0; padding: 0.7rem 0.55rem;
          }
          .mobile-card-summary span {
            color: var(--text-muted); display: block; font-size: 0.58rem; font-weight: 900; letter-spacing: 0.08em;
            margin-bottom: 0.35rem; text-transform: uppercase;
          }
          .mobile-card-summary strong {
            display: block; font-family: var(--font-mono); font-size: 0.82rem; font-weight: 900; overflow-wrap: anywhere;
          }
          .mobile-details-toggle {
            align-items: center; background: rgba(255,255,255,0.028); border: 1px solid var(--border-subtle);
            border-radius: 12px; color: #fff; cursor: pointer; display: flex; font-weight: 900; gap: 0.5rem;
            justify-content: center; margin-top: 0.85rem; min-height: 44px; padding: 0.75rem 1rem; width: 100%;
          }
          .mobile-details-toggle:focus-visible, .mobile-details-toggle:hover { border-color: var(--text-accent); outline: none; }
          .mobile-details-toggle svg { transition: transform 0.2s; }
          .project-expanded .mobile-details-toggle svg { transform: rotate(180deg); }
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
