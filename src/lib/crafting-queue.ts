import { ALCHEMY_ITEMS, getMerchantBuyPrice, type Recipe } from "@/constants";
import type { Preferences } from "@/lib/preferences";

export type CraftingQueue = Record<string, number>;
export type QueuePriceSource = "custom" | "market" | "vendor" | "missing";
export type QueueSaleSource = "custom" | "market" | "vendor" | "missing";

export type QueueMarketItem = {
  avg_3?: number;
  price?: number;
  vendor_price?: number;
  vol_3?: number;
  is_tradeable?: boolean;
  quality?: string;
  type?: string;
};

export type QueueDbItem = {
  name?: string;
  type?: string;
  quality?: string;
  vendor_price?: number;
  is_tradeable?: boolean;
  recipe?: {
    max_uses?: number;
    result?: {
      item_name?: string;
    };
  } | null;
};

export type QueueMarketData = Record<string, QueueMarketItem>;
export type QueueItemLookup = Record<string, QueueDbItem>;

export type QueuePrice = {
  value: number;
  source: QueuePriceSource;
};

export type QueueNeedRow = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  source: QueuePriceSource;
};

export type QueueRecipeNeedRow = QueueNeedRow & {
  maxUses: number;
  craftQuantity: number;
};

export type QueueEntryRow = {
  name: string;
  quantity: number;
  recipe: Recipe;
  materialCostEach: number;
  vialCostEach: number;
  recipeCostTotal: number;
  inputCostTotal: number;
  marketRevenueEach: number;
  vendorRevenueEach: number;
  netRevenueEach: number;
  totalRevenue: number;
  totalProfit: number;
  profitEach: number;
  bestSaleSource: QueueSaleSource;
  saleSource: QueuePriceSource;
  missingInputs: string[];
  warnings: string[];
};

export type CraftingQueuePlan = {
  entries: QueueEntryRow[];
  shoppingList: QueueNeedRow[];
  vialList: QueueNeedRow[];
  recipeList: QueueRecipeNeedRow[];
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  totalCrafts: number;
  missingItems: string[];
};

export const CRAFTING_QUEUE_STORAGE_KEY = "zenith_craft_queue";
export const MAX_CRAFTING_QUEUE_QTY = 999_999;
export const MAX_BASIC_ALCHEMY_LEVEL = 89;

export function isCraftingQueueRecipe(name: string): boolean {
  const recipe = ALCHEMY_ITEMS[name];
  return Boolean(recipe && recipe.level <= MAX_BASIC_ALCHEMY_LEVEL);
}

export function sanitizeQueueQty(value: unknown): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, MAX_CRAFTING_QUEUE_QTY);
}

export function sanitizeCraftingQueue(value: unknown): CraftingQueue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<CraftingQueue>((next, [name, qty]) => {
    if (!isCraftingQueueRecipe(name)) return next;
    const safeQty = sanitizeQueueQty(qty);
    if (safeQty > 0) next[name] = safeQty;
    return next;
  }, {});
}

export function calculateCraftingQueuePlan(
  queue: CraftingQueue,
  marketData: QueueMarketData | null,
  items: QueueItemLookup | null,
  preferences: Pick<Preferences, "membership" | "barteringBoost" | "customPrices">,
): CraftingQueuePlan {
  const cleanQueue = sanitizeCraftingQueue(queue);
  const customPrices = preferences.customPrices || {};
  const taxMultiplier = preferences.membership ? 0.88 : 0.85;
  const barterMultiplier = 1 + ((Number(preferences.barteringBoost) || 0) / 100);
  const recipeByOutput = buildRecipeItemByOutput(items);

  const materialTotals = new Map<string, number>();
  const vialTotals = new Map<string, number>();
  const recipeNeeds = new Map<string, { quantity: number; maxUses: number; craftQuantity: number }>();
  const entries: QueueEntryRow[] = [];
  const missingSet = new Set<string>();

  let totalCost = 0;
  let totalRevenue = 0;
  let totalCrafts = 0;

  for (const [name, quantity] of Object.entries(cleanQueue)) {
    const recipe = ALCHEMY_ITEMS[name];
    if (!recipe) continue;

    totalCrafts += quantity;

    const materialRows = Object.entries(recipe.materials).map(([materialName, materialQty]) => {
      const price = getAcquisitionPrice(materialName, marketData, items, customPrices);
      if (price.source === "missing") missingSet.add(materialName);
      addTotal(materialTotals, materialName, materialQty * quantity);
      return {
        name: materialName,
        quantity: materialQty,
        unitPrice: price.value,
        totalPrice: price.value * materialQty,
        source: price.source,
      };
    });

    const vialPrice = getAcquisitionPrice(recipe.vial, marketData, items, customPrices);
    if (vialPrice.source === "missing") missingSet.add(recipe.vial);
    addTotal(vialTotals, recipe.vial, quantity);

    const recipeItem = recipeByOutput.get(name);
    let recipeCostTotal = 0;
    if (recipeItem?.name && Number(recipeItem.recipe?.max_uses || 0) > 0) {
      const maxUses = Number(recipeItem.recipe?.max_uses || 0);
      const recipeQty = Math.ceil(quantity / maxUses);
      const current = recipeNeeds.get(recipeItem.name) || { quantity: 0, maxUses, craftQuantity: 0 };
      recipeNeeds.set(recipeItem.name, {
        quantity: current.quantity + recipeQty,
        maxUses,
        craftQuantity: current.craftQuantity + quantity,
      });

      const recipePrice = getAcquisitionPrice(recipeItem.name, marketData, items, customPrices);
      if (recipePrice.source === "missing") missingSet.add(recipeItem.name);
      recipeCostTotal = recipePrice.value * recipeQty;
    }

    const materialCostEach = materialRows.reduce((sum, row) => sum + row.totalPrice, 0);
    const vialCostEach = vialPrice.value;
    const inputCostTotal = (materialCostEach + vialCostEach) * quantity + recipeCostTotal;
    const sale = getSalePrice(name, marketData, customPrices);
    const itemInfo = items?.[name] || marketData?.[name] || {};
    const canMarketSell = sale.source === "custom" || itemInfo.is_tradeable !== false;
    const marketRevenueEach = canMarketSell && sale.value > 0 ? sale.value * taxMultiplier : 0;
    const vendorRevenueEach = getVendorSellPrice(name, marketData, items) * barterMultiplier;
    const bestSaleSource: QueueSaleSource = marketRevenueEach <= 0 && vendorRevenueEach <= 0
      ? "missing"
      : vendorRevenueEach > marketRevenueEach
        ? "vendor"
        : sale.source === "custom"
          ? "custom"
          : "market";
    const netRevenueEach = bestSaleSource === "vendor" ? vendorRevenueEach : marketRevenueEach;
    const entryRevenue = netRevenueEach * quantity;
    const entryProfit = entryRevenue - inputCostTotal;
    const missingInputs = materialRows
      .filter((row) => row.source === "missing")
      .map((row) => row.name);

    if (sale.source === "missing" && vendorRevenueEach <= 0) {
      missingInputs.push(name);
      missingSet.add(name);
    }

    const warnings: string[] = [];
    if (missingInputs.length > 0) warnings.push(`Missing prices: ${missingInputs.join(", ")}`);
    if (bestSaleSource === "market" && Number(marketData?.[name]?.vol_3 || 0) > 0 && Number(marketData?.[name]?.vol_3 || 0) < 40) {
      warnings.push("Thin market");
    }
    if (sale.source === "custom") warnings.push("Custom sell price");
    if (materialRows.some((row) => row.source === "custom")) warnings.push("Custom input price");

    entries.push({
      name,
      quantity,
      recipe,
      materialCostEach,
      vialCostEach,
      recipeCostTotal,
      inputCostTotal,
      marketRevenueEach,
      vendorRevenueEach,
      netRevenueEach,
      totalRevenue: entryRevenue,
      totalProfit: entryProfit,
      profitEach: entryProfit / quantity,
      bestSaleSource,
      saleSource: sale.source,
      missingInputs,
      warnings,
    });

    totalCost += inputCostTotal;
    totalRevenue += entryRevenue;
  }

  return {
    entries,
    shoppingList: makeNeedRows(materialTotals, marketData, items, customPrices),
    vialList: makeNeedRows(vialTotals, marketData, items, customPrices),
    recipeList: makeRecipeRows(recipeNeeds, marketData, items, customPrices),
    totalCost,
    totalRevenue,
    totalProfit: totalRevenue - totalCost,
    totalCrafts,
    missingItems: Array.from(missingSet).sort((a, b) => a.localeCompare(b)),
  };
}

function getAcquisitionPrice(
  name: string,
  marketData: QueueMarketData | null,
  items: QueueItemLookup | null,
  customPrices: Record<string, number>,
): QueuePrice {
  const customPrice = Number(customPrices?.[name] || 0);
  if (customPrice > 0) return { value: customPrice, source: "custom" };

  const merchantBuyPrice = getMerchantBuyPrice(name);
  if (merchantBuyPrice > 0) return { value: merchantBuyPrice, source: "vendor" };

  const marketPrice = Number(marketData?.[name]?.avg_3 || marketData?.[name]?.price || 0);
  if (marketPrice > 0) return { value: marketPrice, source: "market" };

  const vendorFallback = Number(items?.[name]?.vendor_price || marketData?.[name]?.vendor_price || 0);
  if (vendorFallback > 0) return { value: vendorFallback, source: "vendor" };

  return { value: 0, source: "missing" };
}

function getSalePrice(
  name: string,
  marketData: QueueMarketData | null,
  customPrices: Record<string, number>,
): QueuePrice {
  const customPrice = Number(customPrices?.[name] || 0);
  if (customPrice > 0) return { value: customPrice, source: "custom" };

  const marketPrice = Number(marketData?.[name]?.avg_3 || marketData?.[name]?.price || 0);
  if (marketPrice > 0) return { value: marketPrice, source: "market" };

  return { value: 0, source: "missing" };
}

function getVendorSellPrice(
  name: string,
  marketData: QueueMarketData | null,
  items: QueueItemLookup | null,
) {
  return Number(items?.[name]?.vendor_price || marketData?.[name]?.vendor_price || 0);
}

function buildRecipeItemByOutput(items: QueueItemLookup | null) {
  const map = new Map<string, QueueDbItem>();
  for (const item of Object.values(items || {})) {
    const outputName = item.recipe?.result?.item_name;
    if (!outputName || item.type !== "RECIPE") continue;
    const existing = map.get(outputName);
    if (!existing || (existing.is_tradeable === false && item.is_tradeable !== false)) {
      map.set(outputName, item);
    }
  }
  return map;
}

function addTotal(map: Map<string, number>, name: string, quantity: number) {
  map.set(name, (map.get(name) || 0) + quantity);
}

function makeNeedRows(
  totals: Map<string, number>,
  marketData: QueueMarketData | null,
  items: QueueItemLookup | null,
  customPrices: Record<string, number>,
): QueueNeedRow[] {
  return Array.from(totals.entries())
    .map(([name, quantity]) => {
      const price = getAcquisitionPrice(name, marketData, items, customPrices);
      return {
        name,
        quantity,
        unitPrice: price.value,
        totalPrice: price.value * quantity,
        source: price.source,
      };
    })
    .sort((a, b) => b.totalPrice - a.totalPrice || a.name.localeCompare(b.name));
}

function makeRecipeRows(
  totals: Map<string, { quantity: number; maxUses: number; craftQuantity: number }>,
  marketData: QueueMarketData | null,
  items: QueueItemLookup | null,
  customPrices: Record<string, number>,
): QueueRecipeNeedRow[] {
  return Array.from(totals.entries())
    .map(([name, need]) => {
      const price = getAcquisitionPrice(name, marketData, items, customPrices);
      return {
        name,
        quantity: need.quantity,
        maxUses: need.maxUses,
        craftQuantity: need.craftQuantity,
        unitPrice: price.value,
        totalPrice: price.value * need.quantity,
        source: price.source,
      };
    })
    .sort((a, b) => b.totalPrice - a.totalPrice || a.name.localeCompare(b.name));
}
