"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../../constants";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Eye,
  Filter,
  Info,
  PackageCheck,
  Search,
  Target,
  X,
} from "lucide-react";
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { useItemModal } from "@/context/ItemModalContext";
import { useSearchParams } from "next/navigation";
import MobileSortControls from "@/components/MobileSortControls";
import { useData } from "@/context/DataContext";
import { getMarketLiquidity, getSafeMarketValue } from "@/lib/market-pricing";
import { useModalA11y } from "@/lib/use-modal-a11y";

type Trend = "up" | "down" | "flat";
type ActionPath = "MARKET" | "VENDOR" | "LIQUIDATE";
type RowStatus = "ok" | "missing";
type LiquiditySignal = "LIQUID" | "STEADY" | "VOLUME SWINGS" | "SPIKE RISK" | "THIN" | "NO SALES" | "VENDOR SAFE" | "MISSING";

type MarketData = {
  avg_3?: number;
  avg_7?: number;
  avg_14?: number;
  avg_30?: number;
  price?: number;
  vol_3?: number;
  stable_vol_3?: number;
  daily_sales_trimmed_avg_30?: number;
  daily_sales_median_30?: number;
  daily_sales_max_30?: number;
  sales_outlier_days_30?: number;
  sales_spike_ratio?: number;
  vendor_price?: number;
  quality?: string;
};

type IngredientCost = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  source: "custom" | "market" | "vendor" | "missing";
  owned: boolean;
};

type AlchemyRow = {
  status: RowStatus;
  name: string;
  level: number;
  time: number;
  craftsPerHour: number;
  craftsPerDay: number;
  trend: Trend;
  action: ActionPath;
  signal: LiquiditySignal;
  warnings: string[];
  reason: string;
  formula: string;
  cost: number;
  cashCost: number;
  opportunityCost: number;
  materialCost: number;
  cashMaterialCost: number;
  vialCost: number;
  recipeCostShare: number;
  marketGross: number;
  marketTax: number;
  marketNet: number;
  vendorNet: number;
  liquidationNet: number;
  bestRevenue: number;
  profit: number;
  profitPerHour: number;
  opportunityProfit: number;
  dailyProfit: number;
  vol_3: number;
  stableVol_3: number;
  liquidityNote: string;
  liquidityRisk: boolean;
  outputSource: "custom" | "market" | "missing";
  inputMissing: string[];
  ingredientCosts: IngredientCost[];
};

type AlchemySortKey =
  | "name"
  | "level"
  | "action"
  | "cost"
  | "bestRevenue"
  | "profit"
  | "profitPerHour"
  | "dailyProfit"
  | "vol_3"
  | "craftsPerHour"
  | "time"
  | "signal";

const ALCHEMY_SORT_KEYS: readonly AlchemySortKey[] = [
  "name",
  "level",
  "action",
  "cost",
  "bestRevenue",
  "profit",
  "profitPerHour",
  "dailyProfit",
  "vol_3",
  "craftsPerHour",
  "time",
  "signal",
];

const OWNED_STORAGE_KEY = "zenith_alchemy_owned_materials";
const OWNED_MODE_STORAGE_KEY = "zenith_alchemy_owned_cost_mode";
const ALCHEMY_SETTINGS_STORAGE_KEY = "zenith_alchemy_settings";

type PersistedAlchemySettings = {
  minLevel: number | "";
  maxLevel: number | "";
  minProfit: number | "";
  minVolume: number | "";
  onlyProfitable: boolean;
  hideMissing: boolean;
  ownedCostMode?: boolean;
  sortCol: AlchemySortKey | "roi";
  sortDesc: boolean;
};

const formatGold = (value: number, _digits = 0) =>
  Math.round(value).toLocaleString();

const formatSignedGold = (value: number, digits = 0) =>
  `${value >= 0 ? "+" : ""}${formatGold(value, digits)}g`;

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const minutes = seconds / 60;
  return `${minutes.toFixed(minutes >= 10 ? 0 : 1)}m`;
};

const getCustomPrice = (customPrices: Record<string, number>, name: string) => {
  const price = customPrices?.[name];
  return typeof price === "number" && price > 0 ? price : 0;
};

const getItemPrice = (
  name: string,
  marketData: Record<string, MarketData>,
  customPrices: Record<string, number>,
): { price: number; source: IngredientCost["source"] | "custom" | "market" } => {
  const custom = getCustomPrice(customPrices, name);
  if (custom > 0) return { price: custom, source: "custom" };

  const market = getSafeMarketValue(marketData?.[name]);
  if (market > 0) return { price: market, source: "market" };

  const vendor = VIAL_COSTS[name] || 0;
  if (vendor > 0) return { price: vendor, source: "vendor" };

  return { price: 0, source: "missing" };
};

const getTrend = (item?: MarketData): Trend => {
  const avg3 = item?.avg_3 || 0;
  const avg14 = item?.avg_14 || 0;
  if (avg3 > 0 && avg14 > 0 && avg3 > avg14 * 1.05) return "up";
  if (avg3 > 0 && avg14 > 0 && avg3 < avg14 * 0.95) return "down";
  return "flat";
};

const getSignal = (action: ActionPath, item: MarketData | undefined, missing: boolean): LiquiditySignal => {
  if (missing) return "MISSING";
  if (action === "VENDOR") return "VENDOR SAFE";
  const liquidity = getMarketLiquidity(item);
  if (liquidity.isSpikeRisk) return "SPIKE RISK";
  if (liquidity.hasVolumeSwings) return "VOLUME SWINGS";
  if (liquidity.tone === "active") return "LIQUID";
  if (liquidity.tone === "steady") return "STEADY";
  if (liquidity.rawVolume3d > 0 || liquidity.stableVolume3d > 0) return "THIN";
  return "NO SALES";
};

const getSignalClass = (signal: LiquiditySignal) => {
  if (signal === "LIQUID" || signal === "VENDOR SAFE") return "action-craft";
  if (signal === "STEADY") return "action-vendor";
  return "action-liquidate";
};

const getVisibleAlchemyWarnings = (row: AlchemyRow) => {
  const repeatedBySignal = new Set<string>();
  if (row.signal === "SPIKE RISK") repeatedBySignal.add("Bulk-sale spike risk");
  if (row.signal === "VOLUME SWINGS") repeatedBySignal.add("Volume swings");
  if (row.signal === "THIN") repeatedBySignal.add("Thin market");
  return row.warnings.filter((warning) => !repeatedBySignal.has(warning));
};

const isAlchemySortKey = (value: unknown): value is AlchemySortKey =>
  typeof value === "string" && ALCHEMY_SORT_KEYS.includes(value as AlchemySortKey);

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="search-mark">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

function readOwnedMaterials(storageKey: string, legacyKey?: string): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(storageKey) ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readAlchemySettings(): Partial<PersistedAlchemySettings> {
  try {
    const stored = localStorage.getItem(ALCHEMY_SETTINGS_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function AlchemyContent() {
  const { marketData: data, scraperStatus } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [minLevel, setMinLevel] = useState<number | "">(0);
  const [maxLevel, setMaxLevel] = useState<number | "">(89);
  const [minProfit, setMinProfit] = useState<number | "">("");
  const [minVolume, setMinVolume] = useState<number | "">("");
  const [onlyProfitable, setOnlyProfitable] = useState(false);
  const [hideMissing, setHideMissing] = useState(true);
  const [ownedCostMode, setOwnedCostMode] = useState(false);
  const [ownedMaterials, setOwnedMaterials] = useState<Record<string, string[]>>({});
  const [sortCol, setSortCol] = useState<AlchemySortKey>("profitPerHour");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedRow, setSelectedRow] = useState<AlchemyRow | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const activeProfileId = activeProfile?.id || null;
  const ownedStorageKey = useMemo(() => getProfileStorageKey(OWNED_STORAGE_KEY, activeProfile?.id), [activeProfile?.id]);
  const ownedModeStorageKey = useMemo(() => getProfileStorageKey(OWNED_MODE_STORAGE_KEY, activeProfile?.id), [activeProfile?.id]);

  useEffect(() => {
    setSettingsLoaded(false);
    const saved = readAlchemySettings();
    if (saved.minLevel !== undefined) setMinLevel(saved.minLevel);
    if (saved.maxLevel !== undefined) setMaxLevel(saved.maxLevel);
    if (saved.minProfit !== undefined) setMinProfit(saved.minProfit);
    if (saved.minVolume !== undefined) setMinVolume(saved.minVolume);
    if (typeof saved.onlyProfitable === "boolean") setOnlyProfitable(saved.onlyProfitable);
    if (typeof saved.hideMissing === "boolean") setHideMissing(saved.hideMissing);
    if (saved.sortCol === "craftsPerHour" || saved.sortCol === "roi") setSortCol("profitPerHour");
    else if (isAlchemySortKey(saved.sortCol)) setSortCol(saved.sortCol);
    if (typeof saved.sortDesc === "boolean") setSortDesc(saved.sortDesc);
    setOwnedMaterials(readOwnedMaterials(ownedStorageKey, activeProfileId ? undefined : OWNED_STORAGE_KEY));
    const storedOwnedMode = localStorage.getItem(ownedModeStorageKey);
    const legacyOwnedMode = activeProfileId ? null : localStorage.getItem(OWNED_MODE_STORAGE_KEY);
    const savedOwnedMode = storedOwnedMode !== null
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
      onlyProfitable,
      hideMissing,
      sortCol,
      sortDesc,
    };
    localStorage.setItem(ALCHEMY_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  }, [hideMissing, maxLevel, minLevel, minProfit, minVolume, onlyProfitable, settingsLoaded, sortCol, sortDesc]);

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
          ingredient.name === materialName ? { ...ingredient, owned: !ingredient.owned } : ingredient,
        ),
      };
    });
  };

  const setOwnedMode = (next: boolean) => {
    setOwnedCostMode(next);
    localStorage.setItem(ownedModeStorageKey, String(next));
  };

  const marketData = useMemo(() => (data || {}) as Record<string, MarketData>, [data]);
  const parsedActiveHours = Number(activeProfile?.timers.activeHours || 0) || 0;
  const activeProfileName = activeProfile?.name?.trim() || "Active profile";
  const activeHoursSource = activeProfile ? `${activeProfileName} playtime` : "No active profile";
  const parsedBartering = Number(activeProfile ? getProfileBarteringBoost(activeProfile) : 0) || 0;
  const marketTaxRate = getMarketTaxRate(preferences.membership);
  const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);

  const allRows = useMemo(() => {
    const rows: AlchemyRow[] = [];
    if (!data) return rows;

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

      const materialCost = ingredientCosts.reduce((sum, ingredient) => sum + ingredient.totalPrice, 0);
      const cashMaterialCost = ingredientCosts.reduce(
        (sum, ingredient) => sum + (ownedCostMode && ingredient.owned ? 0 : ingredient.totalPrice),
        0,
      );
      const vialCost = VIAL_COSTS[recipe.vial] || 0;
      const recipeName = `Recipe: ${name}`;
      const recipePrice = getItemPrice(recipeName, marketData, preferences.customPrices || {}).price;
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
      const craftsPerHour = recipe.time > 0 ? 3600 / recipe.time : 0;
      const profitPerHour = profit * craftsPerHour;
      const craftsPerDay = craftsPerHour * parsedActiveHours;
      const dailyProfit = profitPerHour * parsedActiveHours;

      let action: ActionPath = "LIQUIDATE";
      if (bestRevenue === vendorNet && vendorNet > liquidationNet) action = "VENDOR";
      else if (bestRevenue === marketNet && marketNet > liquidationNet) action = "MARKET";

      const liquidity = getMarketLiquidity(item);
      const signal = getSignal(action, item, missing);
      const warnings: string[] = [];
      if (missing) warnings.push(outputMissing ? "Missing result price" : `Missing inputs: ${inputMissing.join(", ")}`);
      if (!missing && action === "MARKET" && liquidity.isSpikeRisk) {
        warnings.push("Bulk-sale spike risk");
      } else if (!missing && action === "MARKET" && liquidity.hasVolumeSwings) {
        warnings.push("Volume swings");
      } else if (!missing && action === "MARKET" && liquidity.stableVolume3d < 40 && signal !== "THIN" && signal !== "NO SALES") {
        warnings.push("Thin market");
      }
      if (!missing && profit > 0 && opportunityProfit < 0 && ownedCostMode) warnings.push("Only profitable with owned inputs");
      if (!missing && preferences.customPrices?.[name]) warnings.push("Custom sell price");
      if (!missing && ingredientCosts.some((ingredient) => ingredient.source === "custom")) warnings.push("Custom input price");

      const reason = missing
        ? warnings[0] || "Missing market data"
        : action === "MARKET"
          ? `Market net beats vendor by ${formatGold(marketNet - vendorNet)}g and liquidation by ${formatGold(marketNet - liquidationNet)}g.`
          : action === "VENDOR"
            ? `Vendor wins by ${formatGold(vendorNet - Math.max(marketNet, liquidationNet))}g over the next best path.`
            : `Selling the ingredients beats crafting by ${formatGold(liquidationNet - Math.max(marketNet, vendorNet))}g.`;

      rows.push({
        status: missing ? "missing" : "ok",
        name,
        level: recipe.level,
        time: recipe.time,
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
        stableVol_3: liquidity.stableVolume3d || item?.vol_3 || 0,
        liquidityNote: liquidity.note,
        liquidityRisk: liquidity.isSpikeRisk || liquidity.hasVolumeSwings,
        outputSource: outputPrice.source === "custom" ? "custom" : outputPrice.source === "market" ? "market" : "missing",
        inputMissing,
        ingredientCosts,
      });
    }

    return rows;
  }, [
    data,
    marketData,
    ownedCostMode,
    ownedMaterials,
    parsedActiveHours,
    parsedBartering,
    preferences.customPrices,
    marketTaxMultiplier,
    marketTaxRate,
  ]);

  const rows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const profitLimit = minProfit === "" ? -Infinity : Number(minProfit);
    const volumeLimit = minVolume === "" ? 0 : Number(minVolume);

    const filtered = allRows.filter((row) => {
      if (query && !row.name.toLowerCase().includes(query)) return false;
      if (minLevel !== "" && row.level < Number(minLevel)) return false;
      if (maxLevel !== "" && row.level > Number(maxLevel)) return false;
      if (hideMissing && row.status === "missing") return false;
      if (onlyProfitable && row.profit <= 0) return false;
      if (row.status === "ok" && row.profit < profitLimit) return false;
      if (row.status === "ok" && row.stableVol_3 < volumeLimit) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.status === "missing" && b.status !== "missing") return 1;
      if (a.status !== "missing" && b.status === "missing") return -1;
      const valA = sortCol === "vol_3" ? a.stableVol_3 : a[sortCol];
      const valB = sortCol === "vol_3" ? b.stableVol_3 : b[sortCol];
      if (typeof valA === "number" && typeof valB === "number") return sortDesc ? valB - valA : valA - valB;
      return sortDesc
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });

    return filtered;
  }, [allRows, hideMissing, maxLevel, minLevel, minProfit, minVolume, onlyProfitable, searchTerm, sortCol, sortDesc]);

  const summary = useMemo(() => {
    const valid = allRows.filter((row) => row.status === "ok");
    const byProfit = [...valid].sort((a, b) => b.profit - a.profit);
    const hourly = [...valid].sort((a, b) => b.profitPerHour - a.profitPerHour)[0];
    const market = valid.filter((row) => row.action === "MARKET").sort((a, b) => b.profit - a.profit)[0];
    const vendor = valid.filter((row) => row.action === "VENDOR").sort((a, b) => b.profit - a.profit)[0];
    const volume = [...valid].sort((a, b) => b.stableVol_3 - a.stableVol_3)[0];
    const risky = byProfit.find((row) => row.profit > 0 && (row.liquidityRisk || (row.stableVol_3 > 0 && row.stableVol_3 < 40)));
    return { market, vendor, hourly, volume, risky, best: byProfit[0] };
  }, [allRows]);

  useEffect(() => {
    setSelectedRow((currentRow) => {
      if (!currentRow) return null;
      return allRows.find((row) => row.name === currentRow.name && row.status === "ok") || currentRow;
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

  const renderSortIcon = (col: AlchemySortKey) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  const updatedAt = scraperStatus?.last_updated || data?._meta?.last_updated;
  const dataAgeMinutes = updatedAt ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000) : null;
  const staleMarket = dataAgeMinutes !== null && dataAgeMinutes > 90;

  return (
    <>
      <div className="header alchemy-header">
        <h1 className="header-title">
          <Activity size={24} color="var(--text-accent)" /> ALCHEMY PROFIT FINDER
        </h1>
        <div className="header-status">
          <div className="status-dot"></div>
          <span className="mono">{rows.length} STRATEGIES</span>
        </div>
      </div>

      {staleMarket && (
        <div className="alchemy-alert">
          <AlertTriangle size={16} />
          Market data looks stale: last sync was about {dataAgeMinutes} minutes ago.
        </div>
      )}

      <div className="alchemy-summary-grid">
        <SummaryCard icon={<Coins size={16} />} label="Best Market Craft" row={summary.market} value={summary.market ? formatSignedGold(summary.market.profit) : "N/A"} onSelect={setSelectedRow} />
        <SummaryCard icon={<PackageCheck size={16} />} label="Best Vendor Play" row={summary.vendor} value={summary.vendor ? formatSignedGold(summary.vendor.profit) : "N/A"} onSelect={setSelectedRow} />
        <SummaryCard icon={<BarChart3 size={16} />} label="Best Profit/Hr" row={summary.hourly} value={summary.hourly ? `${formatSignedGold(summary.hourly.profitPerHour)}/hr` : "N/A"} onSelect={setSelectedRow} />
        <SummaryCard icon={<Activity size={16} />} label="Highest Stable Volume" row={summary.volume} value={summary.volume ? `${formatGold(summary.volume.stableVol_3)} vol` : "N/A"} onSelect={setSelectedRow} />
        <SummaryCard icon={<AlertTriangle size={16} />} label="Risky High Profit" row={summary.risky} value={summary.risky ? formatSignedGold(summary.risky.profit) : "None"} onSelect={setSelectedRow} />
      </div>

      <div className="alchemy-controls-panel">
        <div className="control-group">
          <label className="control-label">Search Recipe</label>
          <div className="alchemy-search-field">
            <Search size={14} />
            <input
              aria-label="Search alchemy recipes"
              type="text"
              className="control-input"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Level Range</label>
          <div className="alchemy-inline-fields">
            <input aria-label="Minimum alchemy level" type="number" className="control-input" placeholder="Min" value={minLevel} onChange={(e) => setMinLevel(e.target.value === "" ? "" : Number(e.target.value))} />
            <input aria-label="Maximum alchemy level" type="number" className="control-input" placeholder="Max" value={maxLevel} onChange={(e) => setMaxLevel(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Min Profit / Stable Vol</label>
          <div className="alchemy-inline-fields">
            <input aria-label="Minimum profit per piece" type="number" className="control-input" placeholder="Profit/Piece" value={minProfit} onChange={(e) => setMinProfit(e.target.value === "" ? "" : Number(e.target.value))} />
            <input aria-label="Minimum stable volume" type="number" className="control-input" placeholder="Stable Vol" value={minVolume} onChange={(e) => setMinVolume(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Profile Bartering</label>
          <div className="control-input" aria-label="Active profile bartering bonus">
            +{parsedBartering}% {activeProfile ? `from ${activeProfileName}` : "No active profile"}
          </div>
        </div>

        <div className="alchemy-toggle-row">
          <button type="button" className={`alchemy-toggle ${onlyProfitable ? "active" : ""}`} onClick={() => setOnlyProfitable((prev) => !prev)}>
            <CheckCircle2 size={15} /> Profitable only
          </button>
          <button type="button" className={`alchemy-toggle ${hideMissing ? "active" : ""}`} onClick={() => setHideMissing((prev) => !prev)}>
            <Filter size={15} /> Hide missing
          </button>
          <button type="button" className={`alchemy-toggle ${ownedCostMode ? "active" : ""}`} onClick={() => setOwnedMode(!ownedCostMode)}>
            <PackageCheck size={15} /> Owned mode
          </button>
          <span className="alchemy-settings-pill">
            <Clock size={14} /> {parsedActiveHours}h/day - {activeHoursSource}
          </span>
        </div>
      </div>

      <section className="table-wrapper">
        <div className="desktop-only">
          <div className="table-container">
            <table className="alchemy-table">
              <thead>
                <tr>
                  <th className="sortable left-align" onClick={() => handleSort("name")}>Recipe {renderSortIcon("name")}</th>
                  <th className="sortable" onClick={() => handleSort("level")}>Lvl {renderSortIcon("level")}</th>
                  <th className="sortable" onClick={() => handleSort("action")}>Best Path {renderSortIcon("action")}</th>
                  <th className="sortable" onClick={() => handleSort("cost")}>Cost {renderSortIcon("cost")}</th>
                  <th className="sortable" onClick={() => handleSort("bestRevenue")}>Return {renderSortIcon("bestRevenue")}</th>
                  <th className="sortable" onClick={() => handleSort("profitPerHour")}>Profit/Hr {renderSortIcon("profitPerHour")}</th>
                  <th className="sortable" onClick={() => handleSort("profit")}>Profit/Piece {renderSortIcon("profit")}</th>
                  <th className="sortable" onClick={() => handleSort("vol_3")}>Stable Vol {renderSortIcon("vol_3")}</th>
                  <th className="sortable" onClick={() => handleSort("time")}>Time {renderSortIcon("time")}</th>
                  <th>Liquidity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    aria-disabled={row.status !== "ok"}
                    aria-label={`Open ${row.name} alchemy strategy`}
                    key={row.name}
                    onClick={() => row.status === "ok" && setSelectedRow(row)}
                    onKeyDown={(event) => {
                      if (row.status !== "ok" || (event.key !== "Enter" && event.key !== " ")) return;
                      event.preventDefault();
                      setSelectedRow(row);
                    }}
                    className={`clickable-row ${row.status === "missing" ? "row-muted" : ""}`}
                    role="button"
                    tabIndex={row.status === "ok" ? 0 : -1}
                  >
                    <td className="item-name left-align">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemByName(row.name);
                        }}
                        onMouseEnter={() => prefetchItem(row.name)}
                        className="alchemy-recipe-link"
                      >
                        {highlightMatch(row.name, searchTerm)}
                      </button>
                      <small>{row.status === "missing" ? row.warnings[0] : row.reason}</small>
                    </td>
                    <td className="mono text-muted">{row.level}</td>
                    <td>{row.status === "missing" ? <Badge label="NO DATA" tone="bad" /> : <PathBadge action={row.action} />}</td>
                    <td className="mono text-muted">{row.status === "missing" ? "N/A" : `${formatGold(row.cost)}g`}</td>
                    <td className="mono text-main">{row.status === "missing" ? "N/A" : `${formatGold(row.bestRevenue)}g`}</td>
                    <td className={`mono ${row.profitPerHour >= 0 ? "profit-positive" : "profit-negative"}`}>{row.status === "missing" ? "N/A" : formatSignedGold(row.profitPerHour)}</td>
                    <td className={`mono ${row.profit >= 0 ? "profit-positive" : "profit-negative"}`}>{row.status === "missing" ? "N/A" : formatSignedGold(row.profit)}</td>
                    <td className={`mono ${row.stableVol_3 > 0 ? "text-main" : "text-muted"}`} title={row.stableVol_3 !== row.vol_3 ? `Raw 3-day volume: ${formatGold(row.vol_3)}` : row.liquidityNote}>{formatGold(row.stableVol_3)}</td>
                    <td className="mono text-muted">{formatDuration(row.time)}</td>
                    <td>
                      <div className="alchemy-signal-stack">
                        <span className={`action-badge ${getSignalClass(row.signal)}`}>{row.signal}</span>
                        {getVisibleAlchemyWarnings(row).slice(0, 2).map((warning) => <span key={warning} className="alchemy-warning-chip">{warning}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mobile-only">
          <MobileSortControls
            label="Sort Strategy"
            value={sortCol}
            descending={sortDesc}
            onSort={(value) => handleSort(value as AlchemySortKey)}
            onToggleDirection={() => setSortDesc((prev) => !prev)}
            options={[
              { value: "profitPerHour", label: "Profit/Hr" },
              { value: "profit", label: "Profit/Piece" },
              { value: "cost", label: "Cost" },
              { value: "bestRevenue", label: "Return" },
              { value: "dailyProfit", label: "Daily Profit" },
              { value: "vol_3", label: "Stable Volume" },
              { value: "level", label: "Level" },
              { value: "name", label: "Name" },
            ]}
          />
          <div className="mobile-card-grid">
            {rows.map((row) => (
              <div
                aria-disabled={row.status !== "ok"}
                aria-label={`Open ${row.name} alchemy strategy`}
                key={row.name}
                className="mobile-alchemy-card rich"
                onClick={() => row.status === "ok" && setSelectedRow(row)}
                onKeyDown={(event) => {
                  if (row.status !== "ok" || (event.key !== "Enter" && event.key !== " ")) return;
                  event.preventDefault();
                  setSelectedRow(row);
                }}
                role="button"
                tabIndex={row.status === "ok" ? 0 : -1}
              >
                <div className="m-card-header">
                  <div className="m-card-title">
                    <span className="m-name">{highlightMatch(row.name, searchTerm)}</span>
                    <span className="m-lvl">LVL {row.level}</span>
                  </div>
                  {row.status === "ok" && <div className={`m-profit-rate ${row.profitPerHour > 0 ? "pos" : "neg"}`}>{formatSignedGold(row.profitPerHour)}/hr</div>}
                </div>
                {row.status === "missing" ? (
                  <p className="alchemy-card-note">{row.warnings[0] || "Missing market data"}</p>
                ) : (
                  <>
                    <div className="m-card-body">
                      <div className="m-stat"><span className="m-label">PATH</span><PathBadge action={row.action} /></div>
                      <div className="m-stat"><span className="m-label">COST</span><span className="m-val">{formatGold(row.cost)}g</span></div>
                      <div className="m-stat"><span className="m-label">RETURN</span><span className="m-val">{formatGold(row.bestRevenue)}g</span></div>
                      <div className="m-stat"><span className="m-label">PROFIT/HR</span><span className={`m-val ${row.profitPerHour > 0 ? "pos" : "neg"}`}>{formatSignedGold(row.profitPerHour)}</span></div>
                      <div className="m-stat"><span className="m-label">PROFIT/PIECE</span><span className={`m-val ${row.profit > 0 ? "pos" : "neg"}`}>{formatSignedGold(row.profit)}</span></div>
                      <div className="m-stat"><span className="m-label">STABLE VOL</span><span className="m-val">{formatGold(row.stableVol_3)}</span></div>
                    </div>
                    <div className="m-card-footer">
                      <span className={`action-badge ${getSignalClass(row.signal)}`}>{row.signal}</span>
                      <div className="m-vol">{formatDuration(row.time)} each</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {rows.length === 0 && (
          <div className="alchemy-empty-state">
            <Search size={28} />
            <h3>No alchemy strategies match those filters</h3>
            <p>Relax the profit, volume, level, or search filters to bring recipes back.</p>
          </div>
        )}
      </section>

      {selectedRow && (
        <AlchemyStrategyModal
          row={selectedRow}
          marketTaxRate={marketTaxRate}
          activeHours={parsedActiveHours}
          ownedCostMode={ownedCostMode}
          onClose={() => setSelectedRow(null)}
          onOpenItem={openItemByName}
          onToggleOwned={(materialName) => toggleOwnedMaterial(selectedRow.name, materialName)}
        />
      )}
    </>
  );
}

function SummaryCard({
  icon,
  label,
  row,
  value,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  row?: AlchemyRow;
  value: string;
  onSelect: (row: AlchemyRow) => void;
}) {
  return (
    <button type="button" className="alchemy-summary-card" disabled={!row} onClick={() => row && onSelect(row)}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <em>{row?.name || "No match"}</em>
    </button>
  );
}

function Badge({ label, tone }: { label: string; tone: "good" | "warn" | "bad" }) {
  return <span className={`action-badge ${tone === "good" ? "action-craft" : tone === "warn" ? "action-vendor" : "action-liquidate"}`}>{label}</span>;
}

function PathBadge({ action }: { action: ActionPath }) {
  if (action === "MARKET") return <Badge label="MARKET" tone="good" />;
  if (action === "VENDOR") return <Badge label="VENDOR" tone="warn" />;
  return <Badge label="LIQUIDATE" tone="bad" />;
}

function AlchemyStrategyModal({
  row,
  marketTaxRate,
  activeHours,
  ownedCostMode,
  onClose,
  onOpenItem,
  onToggleOwned,
}: {
  row: AlchemyRow;
  marketTaxRate: number;
  activeHours: number;
  ownedCostMode: boolean;
  onClose: () => void;
  onOpenItem: (name: string) => void;
  onToggleOwned: (materialName: string) => void;
}) {
  const dialogRef = useModalA11y<HTMLDivElement>(true, onClose);
  const [targetGoldPerHour, setTargetGoldPerHour] = useState("");
  const target = Number(targetGoldPerHour);
  const targetPerCraft = Number.isFinite(target) && target > 0 && row.craftsPerHour > 0
    ? target / row.craftsPerHour
    : null;

  return (
    <div className="modal-overlay alchemy-strategy-overlay" onClick={onClose}>
      <div
        aria-labelledby="alchemy-strategy-title"
        aria-modal="true"
        className="modal-content alchemy-strategy-modal"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="alchemy-strategy-title">
            <button
              aria-label={`Open ${row.name} item details`}
              onClick={() => onOpenItem(row.name)}
              style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", font: "inherit", padding: 0, textAlign: "left" }}
              type="button"
            >
              {row.name} Strategy
            </button>
          </h2>
          <button aria-label="Close alchemy strategy" className="close-btn" onClick={onClose} type="button"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="alchemy-modal-kpi-grid">
            <div>
              <span>Cost</span>
              <strong className="mono">{formatGold(row.cost)}g</strong>
            </div>
            <div>
              <span>Return</span>
              <strong className="mono">{formatGold(row.bestRevenue)}g</strong>
            </div>
            <div>
              <span>Profit / piece</span>
              <strong className={`mono ${row.profit >= 0 ? "success-value" : "danger-value"}`}>{formatSignedGold(row.profit)}</strong>
            </div>
            <div>
              <span>Profit / hr</span>
              <strong className={`mono ${row.profitPerHour >= 0 ? "success-value" : "danger-value"}`}>{formatSignedGold(row.profitPerHour)}</strong>
            </div>
          </div>
          <div className="alchemy-modal-grid">
            <section className="alchemy-modal-panel">
              <div className="alchemy-modal-panel-title"><Target size={16} /> Inputs</div>
              <label className="alchemy-target-profit-field">
                <span>Target profit / hr</span>
                <input
                  aria-label="Target alchemy profit per hour"
                  inputMode="numeric"
                  min={0}
                  placeholder="Optional"
                  type="number"
                  value={targetGoldPerHour}
                  onChange={(event) => setTargetGoldPerHour(event.target.value)}
                />
              </label>
              {targetPerCraft !== null && (
                <div className="alchemy-target-profit-note">
                  {formatGold(targetPerCraft)}g target profit per craft.
                </div>
              )}
              <div className="alchemy-material-list">
                {row.ingredientCosts.map((ingredient) => {
                  const quantity = Math.max(ingredient.quantity, 1);
                  const ingredientCostUsed = ownedCostMode && ingredient.owned ? 0 : ingredient.totalPrice;
                  const otherCost = row.cost - ingredientCostUsed;
                  const maxUnitForBreakEven = Math.floor((row.bestRevenue - otherCost) / quantity);
                  const maxUnitForTarget = targetPerCraft === null
                    ? null
                    : Math.floor((row.bestRevenue - otherCost - targetPerCraft) / quantity);
                  return (
                    <div key={ingredient.name} className="alchemy-material-card">
                      <div className="alchemy-material-row">
                        <span className="alchemy-material-name">
                          <label className="alchemy-owned-check">
                            <input aria-label={`Mark ${ingredient.name} as owned`} type="checkbox" checked={ingredient.owned} onChange={() => onToggleOwned(ingredient.name)} />
                            <span>{ingredient.quantity}x</span>
                          </label>{" "}
                          <button type="button" className="alchemy-material-button hover-underline" onClick={() => onOpenItem(ingredient.name)}>
                            {ingredient.name}
                          </button>
                        </span>
                        <span className="alchemy-material-price mono">
                          <span>{formatGold(ingredient.unitPrice, 3)} ea</span>
                          <span>{"->"}</span>
                          <strong>{ownedCostMode && ingredient.owned ? "Owned" : `${formatGold(ingredient.totalPrice, 3)}g`}</strong>
                        </span>
                      </div>
                      <div className="alchemy-break-even-grid">
                        <div className="alchemy-break-even-line">
                          <span>Break-even max</span>
                          <strong className={maxUnitForBreakEven > 0 ? "" : "danger-value"}>
                            {maxUnitForBreakEven > 0 ? `${formatGold(maxUnitForBreakEven)}g ea` : "Not profitable"}
                          </strong>
                        </div>
                        {maxUnitForTarget !== null && (
                          <div className="alchemy-break-even-line">
                            <span>Target max</span>
                            <strong className={maxUnitForTarget > 0 ? "" : "danger-value"}>
                              {maxUnitForTarget > 0 ? `${formatGold(maxUnitForTarget)}g ea` : "Not possible"}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="alchemy-modal-total"><span>Material cost</span><strong className="mono">{formatGold(row.materialCost, 3)}g</strong></div>
                <div className="alchemy-modal-total"><span>Cash material cost</span><strong className="mono">{formatGold(row.cashMaterialCost, 3)}g</strong></div>
                <div className="alchemy-modal-total"><span>Vial cost</span><strong className="mono">{formatGold(row.vialCost)}g</strong></div>
                {row.recipeCostShare > 0 && <div className="alchemy-modal-total"><span>Recipe amortization</span><strong className="mono">{formatGold(row.recipeCostShare, 3)}g</strong></div>}
              </div>
            </section>

            <section className="alchemy-modal-panel">
              <div className="alchemy-modal-panel-title"><Info size={16} /> Return Paths</div>
              <div className="alchemy-math-list">
                <div className="alchemy-math-row"><span>Market gross</span><strong className="mono">{formatGold(row.marketGross, 3)}g</strong></div>
                <div className="alchemy-math-row"><span>Market tax ({Math.round(marketTaxRate * 100)}%)</span><strong className="mono">-{formatGold(row.marketTax, 3)}g</strong></div>
                <div className="alchemy-math-row"><span>Market net</span><strong className="mono">{formatGold(row.marketNet, 3)}g</strong></div>
                <div className="alchemy-math-row"><span>Vendor net</span><strong className="mono">{formatGold(row.vendorNet, 3)}g</strong></div>
                <div className="alchemy-math-row"><span>Material liquidation net</span><strong className="mono">{formatGold(row.liquidationNet, 3)}g</strong></div>
                <div className="alchemy-math-divider"></div>
                <div className="alchemy-math-row"><span>Best path</span><PathBadge action={row.action} /></div>
                <div className="alchemy-math-row"><span>Best revenue</span><strong className="mono accent-value">{formatGold(row.bestRevenue, 3)}g</strong></div>
                <div className="alchemy-math-row"><span>Cost used</span><strong className="mono">{formatGold(row.cost, 3)}g</strong></div>
                <div className="alchemy-math-row"><span>Profit per craft</span><strong className={`mono ${row.profit >= 0 ? "success-value" : "danger-value"}`}>{formatSignedGold(row.profit, 3)}</strong></div>
                <div className="alchemy-math-row"><span>Opportunity profit</span><strong className={`mono ${row.opportunityProfit >= 0 ? "success-value" : "danger-value"}`}>{formatSignedGold(row.opportunityProfit, 3)}</strong></div>
                <div className="alchemy-math-row"><span>Craft time</span><strong className="mono">{formatDuration(row.time)}</strong></div>
                <div className="alchemy-math-row"><span>Crafts/hr</span><strong className="mono">{row.craftsPerHour.toFixed(2)}</strong></div>
                <div className="alchemy-math-row"><span>Daily profit ({activeHours}h)</span><strong className={`mono ${row.dailyProfit >= 0 ? "success-value" : "danger-value"}`}>{formatSignedGold(row.dailyProfit, 2)}</strong></div>
                <div className="alchemy-formula-line">{row.formula}</div>
                <div className="alchemy-liquidity-row">
                  <span>Stable liquidity</span>
                  <strong>{formatGold(row.stableVol_3)} <small>sold pace</small></strong>
                </div>
                <div className="alchemy-liquidity-row">
                  <span>Raw 3-day sold</span>
                  <strong>{formatGold(row.vol_3)} <small>sold</small></strong>
                </div>
                {row.liquidityRisk && <p className="alchemy-reason"><AlertTriangle size={14} /> {row.liquidityNote}</p>}
                <p className="alchemy-reason"><Eye size={14} /> {row.reason}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlchemyPage() {
  return (
    <main className="container alchemy-page-shell">
      <Suspense fallback={<div className="loading-state">Loading Alchemy Data...</div>}>
        <AlchemyContent />
      </Suspense>
    </main>
  );
}
