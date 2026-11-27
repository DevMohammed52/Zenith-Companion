import { ALCHEMY_ITEMS, VIAL_COSTS, type Recipe } from "@/constants";
import { getMarketLiquidity, getSafeMarketValue } from "@/lib/market-pricing";
import { ASCENSION_BUFFS, getAssaultBuff, type AssaultRank } from "@/lib/skill-profit";
import type {
  ActionPath,
  AlchemyCategory,
  AlchemyItemCategory,
  AlchemyMarketItem,
  AlchemyRow,
  AlchemySummary,
  IngredientCost,
  LiquiditySignal,
  Trend,
} from "@/app/alchemy/types";

export interface AlchemyRecipeMeta {
  alchemyExp: number;
  speedExp: number;
  category: AlchemyItemCategory;
}

/**
 * Verified per-craft base Alchemy EXP, Speed EXP, and category for all 51 Lv 1-89 recipes.
 * Matches IdleMMO wiki (alchemy.md) and synced /v1/item inspect metadata.
 */
export const ALCHEMY_RECIPE_META: Record<string, AlchemyRecipeMeta> = {
  "Battle Potion": { alchemyExp: 45, speedExp: 15, category: "potion" },
  "Lumberjack Essence Crystal": { alchemyExp: 53, speedExp: 17, category: "essence_crystal" },
  "Miners Essence Crystal": { alchemyExp: 60, speedExp: 18, category: "essence_crystal" },
  "Anglers Essence Crystal": { alchemyExp: 67, speedExp: 20, category: "essence_crystal" },
  "Smelting Essence Crystal": { alchemyExp: 75, speedExp: 21, category: "essence_crystal" },
  "Chefs Essence Crystal": { alchemyExp: 87, speedExp: 23, category: "essence_crystal" },
  "Dungeon Potion": { alchemyExp: 231, speedExp: 56, category: "potion" },
  "Timberfall Essence Crystal": { alchemyExp: 231, speedExp: 56, category: "essence_crystal" },
  "Rocksplitter Essence Crystal": { alchemyExp: 259, speedExp: 60, category: "essence_crystal" },
  "Deepsea Essence Crystal": { alchemyExp: 287, speedExp: 63, category: "essence_crystal" },
  "Bastion Essence": { alchemyExp: 315, speedExp: 66, category: "stat_essence" },
  "Falcon's Grace Essence": { alchemyExp: 315, speedExp: 66, category: "stat_essence" },
  "Galeforce Speed Essence": { alchemyExp: 315, speedExp: 66, category: "stat_essence" },
  "Herculean Strength Essence": { alchemyExp: 315, speedExp: 66, category: "stat_essence" },
  "Hammerfell Essence Crystal": { alchemyExp: 315, speedExp: 66, category: "essence_crystal" },
  "Flavorburst Essence Crystal": { alchemyExp: 343, speedExp: 70, category: "essence_crystal" },
  "Protection Potion": { alchemyExp: 700, speedExp: 138, category: "potion" },
  "Felling Essence Crystal": { alchemyExp: 700, speedExp: 138, category: "essence_crystal" },
  "Attack Power Potion": { alchemyExp: 752, speedExp: 145, category: "potion" },
  "Merfolk Essence Crystal": { alchemyExp: 752, speedExp: 145, category: "essence_crystal" },
  "Precision Essence": { alchemyExp: 752, speedExp: 145, category: "stat_essence" },
  "Quickstep Essence": { alchemyExp: 752, speedExp: 145, category: "stat_essence" },
  "Fortified Essence": { alchemyExp: 752, speedExp: 145, category: "stat_essence" },
  "Titan Power Essence": { alchemyExp: 752, speedExp: 145, category: "stat_essence" },
  "Oreseeker Essence Crystal": { alchemyExp: 752, speedExp: 145, category: "essence_crystal" },
  "Molten Core Essence Crystal": { alchemyExp: 1098, speedExp: 207, category: "essence_crystal" },
  "Vortex Brew": { alchemyExp: 1170, speedExp: 216, category: "potion" },
  "Spicefinder Essence Crystal": { alchemyExp: 1242, speedExp: 225, category: "essence_crystal" },
  "Bulwark Brew": { alchemyExp: 1260, speedExp: 234, category: "potion" },
  "Bladeburst Elixir": { alchemyExp: 1260, speedExp: 234, category: "potion" },
  "Ironclad Essence": { alchemyExp: 1350, speedExp: 243, category: "stat_essence" },
  "Acrobatic's Essence": { alchemyExp: 1620, speedExp: 252, category: "stat_essence" },
  "Strike Essence": { alchemyExp: 1620, speedExp: 252, category: "potion" },
  "Impenetrable Essence": { alchemyExp: 1620, speedExp: 252, category: "stat_essence" },
  "Windrider Essence": { alchemyExp: 1620, speedExp: 252, category: "stat_essence" },
  "Dungeon Master's Tonic": { alchemyExp: 1980, speedExp: 261, category: "potion" },
  "Yggdrasil Essence Crystal": { alchemyExp: 2070, speedExp: 270, category: "essence_crystal" },
  "Earthcore Essence Crystal": { alchemyExp: 2880, speedExp: 372, category: "essence_crystal" },
  "Riverbend Essence Crystal": { alchemyExp: 3070, speedExp: 384, category: "essence_crystal" },
  "Tampering Essence Crystal": { alchemyExp: 3150, speedExp: 396, category: "essence_crystal" },
  "Shieldbearer's Infusion": { alchemyExp: 3250, speedExp: 408, category: "potion" },
  "Unyielding Fortitude": { alchemyExp: 3250, speedExp: 408, category: "stat_essence" },
  "Lightning Sprint": { alchemyExp: 3250, speedExp: 408, category: "stat_essence" },
  "Twinstrike Elixir": { alchemyExp: 3250, speedExp: 408, category: "stat_essence" },
  "Stoneheart Solution": { alchemyExp: 3250, speedExp: 408, category: "stat_essence" },
  "Frenzy Potion": { alchemyExp: 3350, speedExp: 420, category: "potion" },
  "Dragonblood Tonic": { alchemyExp: 3450, speedExp: 432, category: "potion" },
  "Gourmet Essence Crystal": { alchemyExp: 3450, speedExp: 432, category: "essence_crystal" },
  "Wraithbane Essence": { alchemyExp: 3450, speedExp: 432, category: "potion" },
  "Thunderfury Brew": { alchemyExp: 3600, speedExp: 444, category: "potion" },
  "Cosmic Tear": { alchemyExp: 3600, speedExp: 444, category: "potion" },
};

export interface AlchemyBuffConfig {
  membership: boolean;
  alchemistClass: boolean;
  penaltyClass: boolean;
  assaultRank: AssaultRank;
  ascensionBuffIds: string[];
  energizingPoolExp: number;
}

export interface AlchemyBuffTotals {
  efficiencyBonus: number;
  expBonus: number;
  expMultiplier: number;
  durationMultiplier: number;
  marketTaxRate: number;
  marketTaxMultiplier: number;
  membershipEff: number;
  membershipExp: number;
  classEff: number;
  classExp: number;
  conquestEff: number;
  conquestExp: number;
  ascensionEff: number;
  ascensionExp: number;
  energizingPoolExp: number;
  activeModifierCount: number;
}

export type AlchemyDbItemEntry = {
  name?: string;
  quality?: string;
  image_url?: string;
  vendor_price?: number;
  type?: string;
  effects?: Array<{
    value?: number;
    target?: string;
    attribute?: string;
    value_type?: string;
    length?: number;
  }> | null;
};

export const PENALTY_CLASSES = new Set(["Cursed", "Forsaken"]);

export function calculateAlchemyBuffTotals(config: AlchemyBuffConfig): AlchemyBuffTotals {
  const membershipEff = config.membership ? 10 : 0;
  const membershipExp = config.membership ? 15 : 0;
  const marketTaxRate = config.membership ? 0.12 : 0.15;
  const marketTaxMultiplier = config.membership ? 0.88 : 0.85;

  let classEff = 0;
  let classExp = 0;
  if (config.penaltyClass) {
    classExp = -50;
  } else if (config.alchemistClass) {
    classEff = 10;
    classExp = 10;
  }

  const assault = getAssaultBuff(config.assaultRank);
  const selectedAscension = (config.ascensionBuffIds || [])
    .slice(0, 5)
    .map((id) => ASCENSION_BUFFS.find((buff) => buff.id === id))
    .filter((buff): buff is (typeof ASCENSION_BUFFS)[number] => Boolean(buff));
  const ascensionEff = selectedAscension
    .filter((buff) => buff.type === "Eff")
    .reduce((sum, buff) => sum + buff.value, 0);
  const ascensionExp = selectedAscension
    .filter((buff) => buff.type === "Exp")
    .reduce((sum, buff) => sum + buff.value, 0);
  const energizingPoolExp = Math.max(0, Number(config.energizingPoolExp) || 0);

  const efficiencyBonus = membershipEff + classEff + assault.efficiency + ascensionEff;
  const expBonus = membershipExp + classExp + assault.exp + ascensionExp + energizingPoolExp;
  const durationMultiplier = Math.max(0.01, (100 + efficiencyBonus) / 100);
  const expMultiplier = Math.max(0.1, (100 + expBonus) / 100);

  const activeModifierCount = [
    config.membership,
    config.alchemistClass || config.penaltyClass,
    config.assaultRank !== "none",
    selectedAscension.length > 0,
    energizingPoolExp > 0,
  ].filter(Boolean).length;

  return {
    efficiencyBonus,
    expBonus,
    expMultiplier,
    durationMultiplier,
    marketTaxRate,
    marketTaxMultiplier,
    membershipEff,
    membershipExp,
    classEff,
    classExp,
    conquestEff: assault.efficiency,
    conquestExp: assault.exp,
    ascensionEff,
    ascensionExp,
    energizingPoolExp,
    activeModifierCount,
  };
}

export const formatGold = (value: number, digits = 0): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: digits });

export const formatSignedGold = (value: number, digits = 0): string =>
  `${value >= 0 ? "+" : ""}${formatGold(value, digits)}g`;

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded}s`;
  const minutes = Math.floor(rounded / 60);
  const rem = rounded % 60;
  return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
};

export const formatMinutes = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0";
  const minutes = seconds / 60;
  return minutes >= 10 ? minutes.toFixed(0) : minutes.toFixed(1);
};

export const getCustomPrice = (customPrices: Record<string, number>, name: string): number => {
  const price = customPrices?.[name];
  return typeof price === "number" && price > 0 ? price : 0;
};

export const getAlchemyItemPrice = (
  name: string,
  marketData: Record<string, AlchemyMarketItem>,
  customPrices: Record<string, number>,
): { price: number; source: IngredientCost["source"] } => {
  const custom = getCustomPrice(customPrices, name);
  if (custom > 0) return { price: custom, source: "custom" };

  const market = getSafeMarketValue(marketData?.[name]);
  if (market > 0) return { price: market, source: "market" };

  const vendor = VIAL_COSTS[name] || 0;
  if (vendor > 0) return { price: vendor, source: "vendor" };

  return { price: 0, source: "missing" };
};

export const getTrend = (item?: AlchemyMarketItem): Trend => {
  const avg3 = item?.avg_3 || 0;
  const avg14 = item?.avg_14 || 0;
  if (avg3 > 0 && avg14 > 0 && avg3 > avg14 * 1.05) return "up";
  if (avg3 > 0 && avg14 > 0 && avg3 < avg14 * 0.95) return "down";
  return "flat";
};

export const getSignal = (
  action: ActionPath,
  item: AlchemyMarketItem | undefined,
  missing: boolean,
): LiquiditySignal => {
  if (missing) return "MISSING";
  if (action === "VENDOR") return "VENDOR SAFE";
  const liquidity = getMarketLiquidity(item);
  if (liquidity.isSpikeRisk) return "SPIKE RISK";
  if (liquidity.tone === "active") return "LIQUID";
  if (liquidity.tone === "steady") return "STEADY";
  if (liquidity.rawVolume3d > 0 || liquidity.stableVolume3d > 0) return "THIN";
  return "NO SALES";
};

export const getActionLabel = (action: ActionPath): string => {
  if (action === "MARKET") return "Market";
  if (action === "VENDOR") return "Vendor";
  return "Sell inputs";
};

export const getCategoryLabel = (category: AlchemyCategory): string => {
  if (category === "potion") return "Potions";
  if (category === "essence_crystal") return "Essence Crystals";
  if (category === "stat_essence") return "Stat Essences";
  return "All";
};

export const makeSearchText = (...parts: Array<string | string[] | undefined>): string =>
  parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase();

export const getSellThroughNote = (
  action: ActionPath,
  profit: number,
  stableVolume3d: number,
  craftsPerSession: number,
  sessionHours: number,
  hasVolumeSwings: boolean,
): string => {
  if (action !== "MARKET" || profit <= 0) return "";
  const stableDailySales = stableVolume3d / 3;
  if (stableVolume3d <= 0) {
    return "Market profit is based on price history, but recent sold volume is missing. Treat it as a listing target, not a fast-sale estimate.";
  }
  if (sessionHours > 0 && craftsPerSession > stableDailySales) {
    return `One ${sessionHours.toFixed(1).replace(/\.0$/, "")}h session makes about ${formatGold(craftsPerSession)} pcs while stable sold pace is about ${formatGold(stableDailySales)} pcs/day. Bulk output may take longer to sell.`;
  }
  if (hasVolumeSwings) {
    return "Recent sold volume includes unusual bulk-sale days. Use the stable sold pace before mass crafting.";
  }
  if (stableVolume3d < 40) {
    return "Stable sold pace is low. It can still profit, though sales may take longer.";
  }
  return "";
};

export interface CalculateAlchemyRowParams {
  name: string;
  recipe: Recipe;
  marketData: Record<string, AlchemyMarketItem>;
  itemDatabase: Record<string, AlchemyDbItemEntry>;
  customPrices: Record<string, number>;
  ownedMaterials: Record<string, string[]>;
  ownedCostMode: boolean;
  buffTotals: AlchemyBuffTotals;
  barteringBoost: number;
  sessionHours: number;
}

export function calculateAlchemyRow({
  name,
  recipe,
  marketData,
  itemDatabase,
  customPrices,
  ownedMaterials,
  ownedCostMode,
  buffTotals,
  barteringBoost,
  sessionHours,
}: CalculateAlchemyRowParams): AlchemyRow {
  const item = marketData[name];
  const dbItem = itemDatabase[name];
  const meta = ALCHEMY_RECIPE_META[name] || {
    alchemyExp: 0,
    speedExp: 0,
    category: recipe.vial.includes("Crystal") ? ("essence_crystal" as const) : ("potion" as const),
  };
  const outputPrice = getAlchemyItemPrice(name, marketData, customPrices);
  const outputMissing = outputPrice.price <= 0;
  const recipeOwnedSet = new Set(ownedMaterials[name] || []);

  const ingredientCosts: IngredientCost[] = Object.entries(recipe.materials).map(([materialName, quantity]) => {
    const priceInfo = getAlchemyItemPrice(materialName, marketData, customPrices);
    const matDb = itemDatabase[materialName];
    const matMkt = marketData[materialName];
    const owned = recipeOwnedSet.has(materialName);
    return {
      name: materialName,
      quantity,
      unitPrice: priceInfo.price,
      totalPrice: priceInfo.price * quantity,
      source: priceInfo.source,
      owned,
      imageUrl: matDb?.image_url || matMkt?.image_url || "",
      quality: matDb?.quality || matMkt?.quality || "STANDARD",
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
  const opportunityCost = materialCost + vialCost;
  const cashCost = cashMaterialCost + vialCost;
  const cost = ownedCostMode ? cashCost : opportunityCost;

  const marketGross = outputPrice.source === "missing" ? 0 : outputPrice.price;
  const marketTax = marketGross * buffTotals.marketTaxRate;
  const marketNet = marketGross * buffTotals.marketTaxMultiplier;
  const vendorBase = Number(dbItem?.vendor_price ?? item?.vendor_price ?? 0);
  const vendorNet = vendorBase * (1 + barteringBoost / 100);
  const liquidationNet = ingredientCosts.reduce((sum, ingredient) => {
    if (ingredient.unitPrice <= 0) return sum;
    return sum + ingredient.unitPrice * buffTotals.marketTaxMultiplier * ingredient.quantity;
  }, 0);

  const craftRevenue = Math.max(marketNet, vendorNet);
  const bestRevenue = Math.max(craftRevenue, liquidationNet);
  const profit = missing ? 0 : bestRevenue - cost;
  const craftProfit = missing ? 0 : craftRevenue - cost;
  const opportunityProfit = missing ? 0 : bestRevenue - opportunityCost;

  const effectiveTime =
    recipe.time > 0 ? recipe.time / buffTotals.durationMultiplier : recipe.time;
  const craftsPerHour = effectiveTime > 0 ? 3600 / effectiveTime : 0;
  const profitPerHour = profit * craftsPerHour;
  const craftsPerSession =
    sessionHours > 0 && effectiveTime > 0 ? Math.floor((sessionHours * 3600) / effectiveTime) : 0;
  const sessionProfit = profit * craftsPerSession;

  const alchemyExpEach = meta.alchemyExp * buffTotals.expMultiplier;
  const expPerHour = alchemyExpEach * craftsPerHour;
  const sessionExp = Math.round(alchemyExpEach * craftsPerSession);
  const baseSpeedExp = meta.speedExp;
  const speedExpPerHour = baseSpeedExp * craftsPerHour;

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
        craftsPerSession,
        sessionHours,
        liquidity.hasVolumeSwings,
      );
  const sellThroughRisk = Boolean(sellThroughNote);

  const warnings: string[] = [];
  if (missing) {
    warnings.push(
      outputMissing ? "Missing item price" : `Missing inputs: ${inputMissing.join(", ")}`,
    );
  }
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
  if (!missing && profit > 0 && opportunityProfit < 0 && ownedCostMode) {
    warnings.push("Only profitable with owned inputs");
  }
  if (!missing && customPrices?.[name]) warnings.push("Custom sell price");
  if (!missing && ingredientCosts.some((ingredient) => ingredient.source === "custom")) {
    warnings.push("Custom input price");
  }

  const reason = missing
    ? warnings[0] || "Missing market data"
    : action === "MARKET"
      ? `Market net beats vendor by ${formatGold(marketNet - vendorNet)}g and raw inputs by ${formatGold(marketNet - liquidationNet)}g.`
      : action === "VENDOR"
        ? `Vendor wins by ${formatGold(vendorNet - Math.max(marketNet, liquidationNet))}g over the next best path.`
        : `Selling raw inputs beats crafting by ${formatGold(liquidationNet - craftRevenue)}g.`;

  const materialNames = ingredientCosts.map((ingredient) => ingredient.name);
  const vialDb = itemDatabase[recipe.vial];

  return {
    status: missing ? "missing" : "ok",
    name,
    level: recipe.level,
    category: meta.category,
    quality: dbItem?.quality || item?.quality || "STANDARD",
    imageUrl: dbItem?.image_url || item?.image_url || "",
    vialName: recipe.vial,
    vialImageUrl: vialDb?.image_url || "",
    materialNames,
    searchText: makeSearchText(
      name,
      recipe.vial,
      materialNames,
      action,
      signal,
      warnings,
      reason,
      liquidity.note,
      getCategoryLabel(meta.category),
    ),
    baseTime: recipe.time,
    time: effectiveTime,
    efficiencyBonus: buffTotals.efficiencyBonus,
    expBonus: buffTotals.expBonus,
    baseAlchemyExp: meta.alchemyExp,
    alchemyExpEach,
    expPerHour,
    baseSpeedExp,
    speedExpPerHour,
    craftsPerHour,
    craftsPerSession,
    trend: getTrend(item),
    action,
    signal,
    warnings,
    reason,
    formula: `${formatGold(bestRevenue, 1)}g return - ${formatGold(cost, 1)}g cost = ${formatSignedGold(profit, 1)}`,
    cost,
    cashCost,
    opportunityCost,
    materialCost,
    cashMaterialCost,
    vialCost,
    recipeCostShare: 0,
    marketGross,
    marketTax,
    marketNet,
    vendorNet,
    liquidationNet,
    craftRevenue,
    bestRevenue,
    profit,
    craftProfit,
    profitPerHour,
    opportunityProfit,
    sessionProfit,
    sessionExp,
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
  };
}

export function calculateAlchemyRows({
  marketData,
  itemDatabase,
  customPrices,
  ownedMaterials,
  ownedCostMode,
  buffTotals,
  barteringBoost,
  sessionHours,
}: Omit<CalculateAlchemyRowParams, "name" | "recipe">): AlchemyRow[] {
  const rowsList: AlchemyRow[] = [];
  for (const [name, recipe] of Object.entries(ALCHEMY_ITEMS)) {
    if (recipe.level >= 90) continue;
    rowsList.push(
      calculateAlchemyRow({
        name,
        recipe,
        marketData,
        itemDatabase,
        customPrices,
        ownedMaterials,
        ownedCostMode,
        buffTotals,
        barteringBoost,
        sessionHours,
      }),
    );
  }
  return rowsList;
}

export function summarizeAlchemyRows(rows: AlchemyRow[]): AlchemySummary {
  return rows.reduce<AlchemySummary>((acc, row) => {
    if (row.status !== "ok") return acc;
    if (!acc.best || row.profit > acc.best.profit) acc.best = row;
    if (!acc.hourly || row.profitPerHour > acc.hourly.profitPerHour) acc.hourly = row;
    if (!acc.xp || row.expPerHour > acc.xp.expPerHour) acc.xp = row;
    if (row.action === "MARKET" && (!acc.market || row.profit > acc.market.profit)) {
      acc.market = row;
    }
    if (row.action === "VENDOR" && (!acc.vendor || row.profit > acc.vendor.profit)) {
      acc.vendor = row;
    }
    if (!acc.volume || row.stableVol_3 > acc.volume.stableVol_3) acc.volume = row;
    const isRiskyProfit =
      row.profit > 0 &&
      (row.liquidityRisk ||
        row.sellThroughRisk ||
        (row.stableVol_3 > 0 && row.stableVol_3 < 40));
    if (isRiskyProfit && (!acc.risky || row.profit > acc.risky.profit)) acc.risky = row;
    return acc;
  }, {});
}

export interface AlchemyBreakEvenResult {
  craftRevenue: number;
  targetPerCraft: number | null;
  sharedInputs: Array<{
    ingredient: IngredientCost;
    usedTotal: number;
    breakEvenUnit: number | null;
    targetUnit: number | null;
  }>;
  sharedInputCost: number;
  sharedBreakEvenBudget: number;
  sharedTargetBudget: number | null;
  sharedBreakEvenRatio: number | null;
  sharedTargetRatio: number | null;
  perIngredient: Array<{
    ingredient: IngredientCost;
    maxUnitForBreakEven: number;
    maxUnitForTarget: number | null;
  }>;
}

/**
 * Solves break-even and target gold/hr max buy prices against actual crafting revenue
 * (`Math.max(marketNet, vendorNet)`), so "Sell inputs" rows do not divide against input sale price.
 */
export function calculateCraftingBreakEven(
  row: AlchemyRow,
  ownedCostMode: boolean,
  targetGoldPerHour: number | null,
): AlchemyBreakEvenResult {
  const craftRevenue = Math.max(row.marketNet, row.vendorNet);
  const validTarget =
    targetGoldPerHour !== null && Number.isFinite(targetGoldPerHour) && targetGoldPerHour > 0 && row.craftsPerHour > 0
      ? targetGoldPerHour / row.craftsPerHour
      : null;

  const activeInputs = row.ingredientCosts
    .map((ingredient) => {
      const usedTotal = ownedCostMode && ingredient.owned ? 0 : ingredient.totalPrice;
      return { ingredient, usedTotal };
    })
    .filter(({ ingredient, usedTotal }) => ingredient.unitPrice > 0 && usedTotal > 0);

  const sharedInputCost = activeInputs.reduce((sum, entry) => sum + entry.usedTotal, 0);
  const sharedFixedCost = row.cost - sharedInputCost;
  const sharedBreakEvenBudget = craftRevenue - sharedFixedCost;
  const sharedTargetBudget =
    validTarget === null ? null : craftRevenue - sharedFixedCost - validTarget;

  const sharedBreakEvenRatio =
    sharedInputCost > 0 && sharedBreakEvenBudget > 0 ? sharedBreakEvenBudget / sharedInputCost : null;
  const sharedTargetRatio =
    sharedInputCost > 0 && sharedTargetBudget !== null && sharedTargetBudget > 0
      ? sharedTargetBudget / sharedInputCost
      : null;

  const sharedInputs = activeInputs.map(({ ingredient, usedTotal }) => ({
    ingredient,
    usedTotal,
    breakEvenUnit:
      sharedBreakEvenRatio === null ? null : Math.floor(ingredient.unitPrice * sharedBreakEvenRatio),
    targetUnit:
      sharedTargetRatio === null ? null : Math.floor(ingredient.unitPrice * sharedTargetRatio),
  }));

  const perIngredient = row.ingredientCosts.map((ingredient) => {
    const quantity = Math.max(ingredient.quantity, 1);
    const ingredientCostUsed = ownedCostMode && ingredient.owned ? 0 : ingredient.totalPrice;
    const otherCost = row.cost - ingredientCostUsed;
    const maxUnitForBreakEven = Math.floor((craftRevenue - otherCost) / quantity);
    const maxUnitForTarget =
      validTarget === null
        ? null
        : Math.floor((craftRevenue - otherCost - validTarget) / quantity);

    return {
      ingredient,
      maxUnitForBreakEven,
      maxUnitForTarget,
    };
  });

  return {
    craftRevenue,
    targetPerCraft: validTarget,
    sharedInputs,
    sharedInputCost,
    sharedBreakEvenBudget,
    sharedTargetBudget,
    sharedBreakEvenRatio,
    sharedTargetRatio,
    perIngredient,
  };
}
