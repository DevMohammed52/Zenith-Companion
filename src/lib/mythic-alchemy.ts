import { getMerchantBuyPrice } from "@/constants";
import { getMarketTaxMultiplier } from "@/lib/preferences";
import { getMarketLiquidity, getSafeMarketPrice, type MarketLiquidityInfo } from "@/lib/market-pricing";

export type MythicPriceSource = "custom" | "settings" | "guarded" | "3d" | "7d" | "14d" | "30d" | "merchant" | "vendor" | "none";
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
  experience?: number;
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

export type MythicRecipe = {
  resultName: string;
  recipeName: string;
  searchText: string;
  level: number;
  maxUses: number;
  experience: number;
  recipeQuality: string;
  resultQuality: string;
  recipeTradeable: boolean;
  imageUrl?: string;
  materials: { name: string; qty: number }[];
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
};

export type MythicMaterialBreakdown = {
  name: string;
  qty: number;
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
  craftTimeSeconds: number;
  efficiencyBonus: number;
  vol_3: number;
  outputLiquidity: MarketLiquidityInfo;
  marketWarnings: string[];
  bestPath: MythicBestPath;
  usesLeft: number;
  materialBreakdown: MythicMaterialBreakdown[];
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
export const MYTHIC_CRAFT_TIME_SECONDS = 1363.6;

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

export function buildMythicAlchemyRecipes(itemsByName: Record<string, MythicDbItem>) {
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
      searchText: [
        resultName,
        item.name,
        ...materials.map((material) => material.name),
      ].join(" ").toLowerCase(),
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
}

export function getMythicMarketAverage(itemName: string, marketData: Record<string, MythicMarketItem>): { price: number; source: MythicPriceSource } {
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

export function getMythicVendorPrice(itemName: string, marketData: Record<string, MythicMarketItem>, itemsByName: Record<string, MythicDbItem>) {
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

export function buildRecommendedMythicRecipes({
  mythicRecipes,
  activeRecipeNames,
  settingsPrices,
  marketData,
  itemsByName,
  limit = 5,
}: {
  mythicRecipes: MythicRecipe[];
  activeRecipeNames: string[];
  settingsPrices: Record<string, number>;
  marketData: Record<string, MythicMarketItem>;
  itemsByName: Record<string, MythicDbItem>;
  limit?: number;
}): MythicRecommendedRecipe[] {
  return mythicRecipes
    .filter((recipe) => !activeRecipeNames.includes(recipe.resultName))
    .map((recipe) => {
      const priceContext = { settingsPrices, marketData, itemsByName };
      const outputPrice = resolveMythicPrice({ itemName: recipe.resultName, localOverride: null, allowVendorFallback: false, ...priceContext });
      const recipePrice = resolveMythicPrice({ itemName: recipe.recipeName, localOverride: null, allowVendorFallback: false, ...priceContext });
      const missingInputs = recipe.materials.filter((material) => (
        resolveMythicPrice({ itemName: material.name, localOverride: null, allowVendorFallback: true, ...priceContext }).price <= 0
      )).length;
      const liquidity = getMarketLiquidity(marketData[recipe.resultName]);
      return {
        recipe,
        outputPrice,
        recipePrice,
        missingInputs,
        liquidity,
        complete: outputPrice.price > 0 && recipePrice.price > 0 && missingInputs === 0,
      };
    })
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? -1 : 1;
      if (a.outputPrice.price !== b.outputPrice.price) return b.outputPrice.price - a.outputPrice.price;
      return a.recipe.resultName.localeCompare(b.recipe.resultName);
    })
    .slice(0, limit);
}

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
  mythicCraftTimeSeconds: number;
  alchemyEfficiencyBonus: number;
}): MythicProjectRow[] {
  const marketTaxMultiplier = getMarketTaxMultiplier(membership);
  const priceContext = { settingsPrices, marketData, itemsByName };

  return activeRecipeNames
    .map((name) => recipeByResult.get(name))
    .filter((recipe): recipe is MythicRecipe => Boolean(recipe))
    .map((recipe) => {
      const maxUses = Math.max(1, recipe.maxUses);
      const currentUses = clampMythicUses(usesLeft[recipe.resultName] || maxUses, maxUses);
      const localRecipePrice = customRecipePrices[recipe.resultName] ?? null;
      const recipePrice = resolveMythicPrice({
        itemName: recipe.recipeName,
        localOverride: localRecipePrice,
        allowVendorFallback: false,
        ...priceContext,
      });
      const recipeCostDivisor = recipeCostMode === "remaining" ? currentUses : maxUses;
      const recipeCostPerCraft = recipeCostMode === "owned" ? 0 : recipePrice.price / recipeCostDivisor;

      const materialBreakdown = recipe.materials.map((material) => {
        const localPrice = customMaterialPrices[recipe.resultName]?.[material.name] ?? null;
        const price = resolveMythicPrice({
          itemName: material.name,
          localOverride: localPrice,
          allowVendorFallback: true,
          ...priceContext,
        });
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
      const salePrice = resolveMythicPrice({
        itemName: recipe.resultName,
        localOverride: localSellPrice,
        allowVendorFallback: false,
        ...priceContext,
      });
      const marketGross = salePrice.price;
      const revenue = marketGross * marketTaxMultiplier;
      const vendorRevenue = getMythicVendorPrice(recipe.resultName, marketData, itemsByName) * (1 + profileBarteringBoost / 100);
      const bestRevenue = Math.max(revenue, vendorRevenue);
      const bestPath: MythicBestPath =
        vendorRevenue > revenue ? "VENDOR" : salePrice.source === "custom" || salePrice.source === "settings" ? "CUSTOM" : "MARKET";
      const totalCostPerCraft = materialCost + recipeCostPerCraft;
      const profit = bestRevenue - totalCostPerCraft;
      const craftsPerHour = 3600 / mythicCraftTimeSeconds;
      const profitPerHour = profit * craftsPerHour;
      const roi = totalCostPerCraft > 0 ? (profit / totalCostPerCraft) * 100 : 0;
      const totalRemainingProfit = profit * currentUses;
      const outputLiquidity = getMarketLiquidity({
        ...marketData[recipe.resultName],
        is_tradeable: itemsByName[recipe.resultName]?.is_tradeable,
      });
      const marketWarnings = [
        salePrice.source === "guarded" ? "Guarded price" : "",
        outputLiquidity.label,
        outputLiquidity.hasVolumeSwings ? "Volume swings" : "",
        outputLiquidity.hasPriceSwings ? "Price swings" : "",
      ].filter((warning, index, warnings) => warning && warnings.indexOf(warning) === index);

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
        craftTimeSeconds: mythicCraftTimeSeconds,
        efficiencyBonus: alchemyEfficiencyBonus,
        vol_3: marketData[recipe.resultName]?.vol_3 || 0,
        outputLiquidity,
        marketWarnings,
        bestPath,
        usesLeft: currentUses,
        materialBreakdown,
      };
    })
    .sort((a, b) => b.profitPerHour - a.profitPerHour);
}
