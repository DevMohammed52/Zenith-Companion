import { getMerchantBuyPrice } from "@/constants";
import { getRecipeExperienceInfo } from "@/lib/logic-core.mjs";
import { calculateAlchemyBuffTotals, type AlchemyBuffTotals } from "@/lib/alchemy-profit";
import { getMarketLiquidity, getSafeMarketPrice, type MarketLiquidityInfo } from "@/lib/market-pricing";
import type { AlchemyItemCategory } from "@/app/alchemy/types";

export type MythicPriceSource =
  | "custom"
  | "settings"
  | "guarded"
  | "3d"
  | "7d"
  | "14d"
  | "30d"
  | "merchant"
  | "vendor"
  | "none";

export type MythicRecipeCostMode = "full" | "remaining" | "owned";
export type MythicBestPath = "MARKET" | "VENDOR" | "CUSTOM";

export type MythicMarketItem = {
  avg_3?: number;
  avg_7?: number;
  avg_14?: number;
  avg_30?: number;
  price?: number;
  safe_price?: number;
  raw_price?: number;
  raw_avg_3?: number;
  raw_avg_7?: number;
  raw_avg_14?: number;
  raw_avg_30?: number;
  price_adjusted?: boolean;
  vol_3?: number;
  stable_vol_3?: number;
  daily_sales_trimmed_avg_30?: number;
  daily_sales_median_30?: number;
  daily_sales_max_30?: number;
  sales_outlier_days_30?: number;
  sales_spike_ratio?: number;
  vendor_price?: number;
  is_tradeable?: boolean;
};

export type MythicDbRecipeMaterial = {
  item_name?: string;
  name?: string;
  quantity?: number;
  qty?: number;
};

export type MythicDbRecipe = {
  skill?: string;
  level_required?: number;
  max_uses?: number;
  experience?: unknown;
  materials?: MythicDbRecipeMaterial[];
  result?: {
    item_name?: string;
  };
};

export type MythicDbItem = {
  name?: string;
  type?: string;
  quality?: string;
  image_url?: string;
  vendor_price?: number;
  is_tradeable?: boolean;
  recipe?: MythicDbRecipe | null;
};

export type MythicRecipeMaterial = {
  name: string;
  qty: number;
  imageUrl?: string;
  quality?: string;
};

export type MythicRecipe = {
  resultName: string;
  recipeName: string;
  searchText: string;
  level: number;
  maxUses: number;
  experience: number;
  speedExp: number;
  category: AlchemyItemCategory;
  recipeQuality: string;
  resultQuality: string;
  recipeTradeable: boolean;
  imageUrl?: string;
  recipeImageUrl?: string;
  materials: MythicRecipeMaterial[];
};

export type MythicResolvedPrice = {
  price: number;
  source: MythicPriceSource;
  settingsPrice: number;
};

export type MythicRecommendedRecipe = {
  recipe: MythicRecipe;
  outputPrice: MythicResolvedPrice;
  recipePrice: MythicResolvedPrice;
  missingInputs: number;
  liquidity: MarketLiquidityInfo;
  complete: boolean;
  profit: number;
  profitPerHour: number;
};

export type MythicMaterialBreakdown = {
  name: string;
  qty: number;
  imageUrl?: string;
  quality?: string;
  unitPrice: number;
  priceSource: MythicPriceSource;
  localPrice: number | null;
  settingsPrice: number;
  total: number;
};

export type MythicProjectRow = {
  recipe: MythicRecipe;
  materialCost: number;
  recipePrice: number;
  recipePriceSource: MythicPriceSource;
  localRecipePrice: number | null;
  recipeCostPerCraft: number;
  totalCostPerCraft: number;
  revenue: number;
  marketGross: number;
  marketPriceSource: MythicPriceSource;
  localSellPrice: number | null;
  vendorRevenue: number;
  bestRevenue: number;
  profit: number;
  profitPerHour: number;
  roi: number;
  totalRemainingProfit: number;
  craftsPerHour: number;
  craftTimeSeconds: number;
  efficiencyBonus: number;
  expBonus: number;
  alchemyExpEach: number;
  expPerHour: number;
  speedExpPerCraft: number;
  speedExpPerHour: number;
  totalRemainingExp: number;
  vol_3: number;
  stableVol_3: number;
  outputLiquidity: MarketLiquidityInfo;
  marketWarnings: string[];
  bestPath: MythicBestPath;
  usesLeft: number;
  missingPriceCount: number;
  materialBreakdown: MythicMaterialBreakdown[];
};

export type MythicCatalogRow = MythicProjectRow & {
  totalBatchProfit: number;
  totalBatchExp: number;
  isComplete: boolean;
  isPinned: boolean;
};

export const MYTHIC_STORAGE_KEYS = {
  active: "zenith_mythic_active_recipes",
  recipePrices: "zenith_mythic_recipe_prices",
  uses: "zenith_mythic_uses",
  materialPrices: "zenith_mythic_mat_prices",
  sellPrices: "zenith_mythic_sell_prices",
  costMode: "zenith_mythic_recipe_cost_mode",
} as const;

export const MYTHIC_ACTIVE_RECIPES_STORAGE_KEY = MYTHIC_STORAGE_KEYS.active;
export const MYTHIC_LOADOUT_STORAGE_KEY = "zenith_mythic_loadout_v1";

/** Base Level 90 Mythic Alchemy craft duration in seconds (25 minutes before Efficiency modifiers). */
export const MYTHIC_CRAFT_TIME_SECONDS = 1500;

const STAT_ESSENCE_NAMES = new Set([
  "Cosmic Barrier",
  "Cosmic Finesse Essence",
  "Flash Velocity Essence",
  "Omnipotent Might Essence",
]);

export const isFinitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const isMythicRecipeCostMode = (value: unknown): value is MythicRecipeCostMode =>
  value === "full" || value === "remaining" || value === "owned";

export const parseOptionalMythicPrice = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, value);
};

export const clampMythicUses = (value: string | number, maxUses: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(1, Math.floor(parsed)), Math.max(1, maxUses));
};

/** Classifies Lv 90 Mythic recipes into Potion, Skill Essence Crystal, or Stat Essence. */
export function getMythicCategory(resultName: string, resultType?: string): AlchemyItemCategory {
  if (STAT_ESSENCE_NAMES.has(resultName)) return "stat_essence";
  if (String(resultType || "").toUpperCase() === "POTION") return "potion";
  return "essence_crystal";
}

/** Builds sorted Lv 90+ Mythic Alchemy recipes from item database entries. */
export function buildMythicAlchemyRecipes(itemsByName: Record<string, MythicDbItem>) {
  const grouped = new Map<string, MythicRecipe>();

  for (const item of Object.values(itemsByName)) {
    const recipe = item.recipe;
    const resultName = recipe?.result?.item_name;
    const level = Number(recipe?.level_required) || 0;
    const maxUses = Number(recipe?.max_uses) || 0;
    const skill = String(recipe?.skill || "").toLowerCase();

    if (
      !item.name ||
      item.type !== "RECIPE" ||
      skill !== "alchemy" ||
      !resultName ||
      level < 90 ||
      maxUses <= 0
    ) {
      continue;
    }

    const materials: MythicRecipeMaterial[] = (recipe?.materials || [])
      .map((material) => {
        const name = material.item_name || material.name || "";
        const matItem = name ? itemsByName[name] : undefined;
        return {
          name,
          qty: Number(material.quantity ?? material.qty ?? 0),
          imageUrl: matItem?.image_url,
          quality: matItem?.quality,
        };
      })
      .filter((material) => material.name && material.qty > 0);

    if (materials.length === 0) continue;

    const resultItem = itemsByName[resultName];
    const expInfo = getRecipeExperienceInfo(recipe?.experience, "alchemy");
    const speedExp = Number((expInfo.stats as Record<string, unknown>)?.speed) || 0;
    const category = getMythicCategory(resultName, resultItem?.type);

    const candidate: MythicRecipe = {
      resultName,
      recipeName: item.name,
      searchText: [
        resultName,
        item.name,
        category,
        ...materials.map((material) => material.name),
      ]
        .join(" ")
        .toLowerCase(),
      level,
      maxUses,
      experience: expInfo.skillExp,
      speedExp,
      category,
      recipeQuality: item.quality || "MYTHIC",
      resultQuality: resultItem?.quality || "MYTHIC",
      recipeTradeable: item.is_tradeable !== false && !/\(Untradable\)$/i.test(item.name),
      imageUrl: resultItem?.image_url || item.image_url,
      recipeImageUrl: item.image_url,
      materials,
    };

    const existing = grouped.get(resultName);
    if (!existing || (!existing.recipeTradeable && candidate.recipeTradeable)) {
      grouped.set(resultName, candidate);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.resultName.localeCompare(b.resultName));
}

export function getMythicMarketAverage(
  itemName: string,
  marketData: Record<string, MythicMarketItem>,
): { price: number; source: MythicPriceSource } {
  const item = marketData[itemName];
  if (!item) return { price: 0, source: "none" };
  const guarded = getSafeMarketPrice(item);
  if (guarded.value > 0 && guarded.adjusted) return { price: guarded.value, source: "guarded" };
  if (guarded.value > 0 && isFinitePositive(item.price)) return { price: guarded.value, source: "3d" };
  if (isFinitePositive(item.avg_3)) return { price: item.avg_3, source: "3d" };
  if (isFinitePositive(item.avg_7)) return { price: item.avg_7, source: "7d" };
  if (isFinitePositive(item.avg_14)) return { price: item.avg_14, source: "14d" };
  if (isFinitePositive(item.avg_30)) return { price: item.avg_30, source: "30d" };
  return { price: 0, source: "none" };
}

export function getMythicVendorPrice(
  itemName: string,
  marketData: Record<string, MythicMarketItem>,
  itemsByName: Record<string, MythicDbItem>,
) {
  const marketVendor = marketData[itemName]?.vendor_price;
  if (isFinitePositive(marketVendor)) return marketVendor;
  const dbVendor = itemsByName[itemName]?.vendor_price;
  return isFinitePositive(dbVendor) ? dbVendor : 0;
}

export function resolveMythicPrice({
  itemName,
  localOverride,
  allowVendorFallback,
  settingsPrices,
  marketData,
  itemsByName,
}: {
  itemName: string;
  localOverride: number | null;
  allowVendorFallback: boolean;
  settingsPrices: Record<string, number>;
  marketData: Record<string, MythicMarketItem>;
  itemsByName: Record<string, MythicDbItem>;
}): MythicResolvedPrice {
  if (localOverride !== null) return { price: localOverride, source: "custom", settingsPrice: 0 };

  const settingsPrice = settingsPrices[itemName];
  if (isFinitePositive(settingsPrice)) return { price: settingsPrice, source: "settings", settingsPrice };

  const market = getMythicMarketAverage(itemName, marketData);
  if (market.price > 0) return { ...market, settingsPrice: 0 };

  if (allowVendorFallback) {
    const merchantBuyPrice = getMerchantBuyPrice(itemName);
    if (merchantBuyPrice > 0) return { price: merchantBuyPrice, source: "merchant", settingsPrice: 0 };

    const vendorSellPrice = getMythicVendorPrice(itemName, marketData, itemsByName);
    if (vendorSellPrice > 0) return { price: vendorSellPrice, source: "vendor", settingsPrice: 0 };
  }

  return { price: 0, source: "none", settingsPrice: 0 };
}

function getDefaultBuffTotals(
  membership: boolean,
  alchemyEfficiencyBonus?: number,
): AlchemyBuffTotals {
  const base = calculateAlchemyBuffTotals({
    membership,
    alchemistClass: false,
    penaltyClass: false,
    assaultRank: "none",
    ascensionBuffIds: [],
    energizingPoolExp: 0,
  });
  if (alchemyEfficiencyBonus === undefined) return base;
  return {
    ...base,
    efficiencyBonus: alchemyEfficiencyBonus,
    durationMultiplier: Math.max(0.01, (100 + alchemyEfficiencyBonus) / 100),
  };
}

function evaluateMythicRecipe({
  recipe,
  usesRemaining,
  localRecipePrice,
  localMaterialPrices,
  localSellPrice,
  settingsPrices,
  marketData,
  itemsByName,
  recipeCostMode,
  buffTotals,
  barteringBoost,
  craftTimeSecondsOverride,
}: {
  recipe: MythicRecipe;
  usesRemaining: number;
  localRecipePrice: number | null;
  localMaterialPrices?: Record<string, number>;
  localSellPrice: number | null;
  settingsPrices: Record<string, number>;
  marketData: Record<string, MythicMarketItem>;
  itemsByName: Record<string, MythicDbItem>;
  recipeCostMode: MythicRecipeCostMode;
  buffTotals: AlchemyBuffTotals;
  barteringBoost: number;
  craftTimeSecondsOverride?: number;
}): MythicProjectRow {
  const maxUses = Math.max(1, recipe.maxUses);
  const currentUses = clampMythicUses(usesRemaining, maxUses);
  const priceContext = { settingsPrices, marketData, itemsByName };

  const recipePrice = resolveMythicPrice({
    itemName: recipe.recipeName,
    localOverride: localRecipePrice,
    allowVendorFallback: false,
    ...priceContext,
  });
  const recipeCostDivisor = recipeCostMode === "remaining" ? currentUses : maxUses;
  const recipeCostPerCraft =
    recipeCostMode === "owned" ? 0 : recipePrice.price / recipeCostDivisor;

  const materialBreakdown: MythicMaterialBreakdown[] = recipe.materials.map((material) => {
    const localPrice = localMaterialPrices?.[material.name] ?? null;
    const price = resolveMythicPrice({
      itemName: material.name,
      localOverride: localPrice,
      allowVendorFallback: true,
      ...priceContext,
    });
    return {
      name: material.name,
      qty: material.qty,
      imageUrl: material.imageUrl || itemsByName[material.name]?.image_url,
      quality: material.quality || itemsByName[material.name]?.quality,
      unitPrice: price.price,
      priceSource: price.source,
      localPrice,
      settingsPrice: price.settingsPrice,
      total: price.price * material.qty,
    };
  });

  const materialCost = materialBreakdown.reduce((sum, material) => sum + material.total, 0);
  const salePrice = resolveMythicPrice({
    itemName: recipe.resultName,
    localOverride: localSellPrice,
    allowVendorFallback: false,
    ...priceContext,
  });

  const marketGross = salePrice.price;
  const revenue = marketGross * buffTotals.marketTaxMultiplier;
  const vendorRevenue =
    getMythicVendorPrice(recipe.resultName, marketData, itemsByName) * (1 + barteringBoost / 100);
  const bestRevenue = Math.max(revenue, vendorRevenue);
  const bestPath: MythicBestPath =
    vendorRevenue > revenue
      ? "VENDOR"
      : salePrice.source === "custom" || salePrice.source === "settings"
        ? "CUSTOM"
        : "MARKET";

  const totalCostPerCraft = materialCost + recipeCostPerCraft;
  const profit = bestRevenue - totalCostPerCraft;

  const craftTimeSeconds =
    craftTimeSecondsOverride && craftTimeSecondsOverride > 0
      ? craftTimeSecondsOverride
      : MYTHIC_CRAFT_TIME_SECONDS / Math.max(0.01, buffTotals.durationMultiplier);
  const craftsPerHour = craftTimeSeconds > 0 ? 3600 / craftTimeSeconds : 0;
  const profitPerHour = profit * craftsPerHour;
  const roi = totalCostPerCraft > 0 ? (profit / totalCostPerCraft) * 100 : 0;
  const totalRemainingProfit = profit * currentUses;

  const alchemyExpEach = recipe.experience * buffTotals.expMultiplier;
  const expPerHour = alchemyExpEach * craftsPerHour;
  const speedExpPerCraft = recipe.speedExp;
  const speedExpPerHour = speedExpPerCraft * craftsPerHour;
  const totalRemainingExp = alchemyExpEach * currentUses;

  const outputMarket = marketData[recipe.resultName];
  const outputLiquidity = getMarketLiquidity({
    ...outputMarket,
    is_tradeable: itemsByName[recipe.resultName]?.is_tradeable,
  });
  const marketWarnings = [
    salePrice.source === "guarded" ? "Guarded price" : "",
    outputLiquidity.label,
    outputLiquidity.hasVolumeSwings ? "Volume swings" : "",
    outputLiquidity.hasPriceSwings ? "Price swings" : "",
  ].filter((warning, index, warnings) => warning && warnings.indexOf(warning) === index);

  const missingMaterialsCount = materialBreakdown.filter((mat) => mat.unitPrice <= 0).length;
  const missingRecipe = recipeCostMode !== "owned" && recipePrice.price <= 0 ? 1 : 0;
  const missingOutput = marketGross <= 0 && vendorRevenue <= 0 ? 1 : 0;
  const missingPriceCount = missingMaterialsCount + missingRecipe + missingOutput;

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
    craftsPerHour,
    craftTimeSeconds,
    efficiencyBonus: buffTotals.efficiencyBonus,
    expBonus: buffTotals.expBonus,
    alchemyExpEach,
    expPerHour,
    speedExpPerCraft,
    speedExpPerHour,
    totalRemainingExp,
    vol_3: outputMarket?.vol_3 || 0,
    stableVol_3: outputLiquidity.stableVolume3d || outputMarket?.vol_3 || 0,
    outputLiquidity,
    marketWarnings,
    bestPath,
    usesLeft: currentUses,
    missingPriceCount,
    materialBreakdown,
  };
}

/** Evaluates pinned Lv 90 Mythic recipe projects with remaining-use amortization and loadout buffs. */
export function calculateMythicProjectRows({
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
  membership,
  profileBarteringBoost,
  mythicCraftTimeSeconds,
  alchemyEfficiencyBonus,
  buffTotals,
}: {
  activeRecipeNames: string[];
  recipeByResult: Map<string, MythicRecipe>;
  usesLeft: Record<string, number>;
  customRecipePrices: Record<string, number>;
  customMaterialPrices: Record<string, Record<string, number>>;
  customSellPrices: Record<string, number>;
  settingsPrices: Record<string, number>;
  marketData: Record<string, MythicMarketItem>;
  itemsByName: Record<string, MythicDbItem>;
  recipeCostMode: MythicRecipeCostMode;
  membership: boolean;
  profileBarteringBoost: number;
  mythicCraftTimeSeconds?: number;
  alchemyEfficiencyBonus?: number;
  buffTotals?: AlchemyBuffTotals;
}): MythicProjectRow[] {
  const resolvedBuffs = buffTotals || getDefaultBuffTotals(membership, alchemyEfficiencyBonus);

  return activeRecipeNames
    .map((name) => recipeByResult.get(name))
    .filter((recipe): recipe is MythicRecipe => Boolean(recipe))
    .map((recipe) =>
      evaluateMythicRecipe({
        recipe,
        usesRemaining: usesLeft[recipe.resultName] || recipe.maxUses,
        localRecipePrice: customRecipePrices[recipe.resultName] ?? null,
        localMaterialPrices: customMaterialPrices[recipe.resultName],
        localSellPrice: customSellPrices[recipe.resultName] ?? null,
        settingsPrices,
        marketData,
        itemsByName,
        recipeCostMode,
        buffTotals: resolvedBuffs,
        barteringBoost: profileBarteringBoost,
        craftTimeSecondsOverride: mythicCraftTimeSeconds,
      }),
    )
    .sort((a, b) => b.profitPerHour - a.profitPerHour);
}

/** Evaluates all Lv 90 Mythic recipes across a fresh 30-use scroll so players can compare before buying. */
export function calculateMythicCatalogRows({
  mythicRecipes,
  activeRecipeNames,
  settingsPrices,
  marketData,
  itemsByName,
  buffTotals,
  barteringBoost,
  includeRecipeCost = true,
}: {
  mythicRecipes: MythicRecipe[];
  activeRecipeNames: string[];
  settingsPrices: Record<string, number>;
  marketData: Record<string, MythicMarketItem>;
  itemsByName: Record<string, MythicDbItem>;
  buffTotals: AlchemyBuffTotals;
  barteringBoost: number;
  includeRecipeCost?: boolean;
}): MythicCatalogRow[] {
  const pinnedSet = new Set(activeRecipeNames);

  return mythicRecipes.map((recipe) => {
    const base = evaluateMythicRecipe({
      recipe,
      usesRemaining: recipe.maxUses,
      localRecipePrice: null,
      localSellPrice: null,
      settingsPrices,
      marketData,
      itemsByName,
      recipeCostMode: includeRecipeCost ? "full" : "owned",
      buffTotals,
      barteringBoost,
    });

    return {
      ...base,
      totalBatchProfit: base.profit * recipe.maxUses,
      totalBatchExp: base.alchemyExpEach * recipe.maxUses,
      isComplete: base.missingPriceCount === 0,
      isPinned: pinnedSet.has(recipe.resultName),
    };
  });
}

/** Recommends unpinned Mythic recipes ranked by Profit/hr (complete priced candidates first). */
export function buildRecommendedMythicRecipes({
  mythicRecipes,
  activeRecipeNames,
  settingsPrices,
  marketData,
  itemsByName,
  buffTotals,
  barteringBoost = 0,
  limit = 5,
}: {
  mythicRecipes: MythicRecipe[];
  activeRecipeNames: string[];
  settingsPrices: Record<string, number>;
  marketData: Record<string, MythicMarketItem>;
  itemsByName: Record<string, MythicDbItem>;
  buffTotals?: AlchemyBuffTotals;
  barteringBoost?: number;
  limit?: number;
}): MythicRecommendedRecipe[] {
  const resolvedBuffs = buffTotals || getDefaultBuffTotals(false);

  return mythicRecipes
    .filter((recipe) => !activeRecipeNames.includes(recipe.resultName))
    .map((recipe) => {
      const priceContext = { settingsPrices, marketData, itemsByName };
      const outputPrice = resolveMythicPrice({
        itemName: recipe.resultName,
        localOverride: null,
        allowVendorFallback: false,
        ...priceContext,
      });
      const recipePrice = resolveMythicPrice({
        itemName: recipe.recipeName,
        localOverride: null,
        allowVendorFallback: false,
        ...priceContext,
      });
      const missingInputs = recipe.materials.filter(
        (material) =>
          resolveMythicPrice({
            itemName: material.name,
            localOverride: null,
            allowVendorFallback: true,
            ...priceContext,
          }).price <= 0,
      ).length;
      const evaluated = evaluateMythicRecipe({
        recipe,
        usesRemaining: recipe.maxUses,
        localRecipePrice: null,
        localSellPrice: null,
        settingsPrices,
        marketData,
        itemsByName,
        recipeCostMode: "full",
        buffTotals: resolvedBuffs,
        barteringBoost,
      });
      return {
        recipe,
        outputPrice,
        recipePrice,
        missingInputs,
        liquidity: evaluated.outputLiquidity,
        complete: outputPrice.price > 0 && recipePrice.price > 0 && missingInputs === 0,
        profit: evaluated.profit,
        profitPerHour: evaluated.profitPerHour,
      };
    })
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? -1 : 1;
      if (a.profitPerHour !== b.profitPerHour) return b.profitPerHour - a.profitPerHour;
      return a.recipe.resultName.localeCompare(b.recipe.resultName);
    })
    .slice(0, limit);
}
