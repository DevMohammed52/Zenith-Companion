/**
 * Shared Expected Value (EV) logic for Zenith Companion.
 * Values drops by their best practical path: market sale, vendor sale,
 * chest contents, or recipe-to-crafted-output profit.
 */

import { getMerchantBuyPrice } from "@/constants";
import { getSafeMarketPriceInfo } from "@/lib/market-pricing";

const MARKET_TAX_MULTIPLIER = 0.85;

export type ValuePath = "market" | "vendor" | "chest" | "craft" | "missing";

export type ItemValueBreakdown = {
  name: string;
  value: number;
  path: ValuePath;
  marketValue: number;
  vendorValue: number;
  chestValue?: number;
  chestDropDetails?: Array<{
    name: string;
    chance: number;
    quantity: number;
    itemValue: number;
    expectedValue: number;
    path: ValuePath;
    marketValue: number;
    vendorValue: number;
    craftedItemName?: string;
    craftedValue?: number;
    materialCost?: number;
    craftValue?: number;
    warnings?: string[];
  }>;
  craftValue?: number;
  craftedItemName?: string;
  craftedValue?: number;
  materialCost?: number;
  recipeUses?: number;
  craftMaterialDetails?: Array<{
    name: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  marketVolume?: number;
  warnings: string[];
};

type ChestDropValueDetail = NonNullable<ItemValueBreakdown["chestDropDetails"]>[number];
type CraftMaterialValueDetail = NonNullable<ItemValueBreakdown["craftMaterialDetails"]>[number];

type ItemLookup = Record<string, any> | null | undefined;
type MarketLookup = Record<string, any> | null | undefined;

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function getItemByName(itemName: string, allItemsDb: ItemLookup) {
  if (!allItemsDb || !itemName) return null;
  const direct = allItemsDb[itemName];
  if (direct) return direct;
  const wanted = normalizeName(itemName);
  return Object.values(allItemsDb).find((item: any) => normalizeName(String(item?.name || "")) === wanted) || null;
}

function getMarketEntry(itemName: string, marketData: MarketLookup) {
  if (!marketData || !itemName) return null;
  const direct = marketData[itemName];
  if (direct) return direct;
  const wanted = normalizeName(itemName);
  return Object.entries(marketData).find(([name]) => normalizeName(name) === wanted)?.[1] || null;
}

function getSafeMarketGross(itemName: string, marketData: MarketLookup) {
  const entry = getMarketEntry(itemName, marketData);
  if (!entry) return { value: 0, volume: 0, warning: null as string | null };

  const safe = getSafeMarketPriceInfo(entry);
  return { value: safe.value, volume: safe.volume3d, warning: safe.reason };
}

function getVendorValue(itemName: string, item: any, marketData: MarketLookup) {
  const marketEntry = getMarketEntry(itemName, marketData);
  return Number(item?.vendor_price || marketEntry?.vendor_price || 0);
}

function getMarketSellNet(itemName: string, item: any, marketData: MarketLookup) {
  if (item?.is_tradeable === false) return { value: 0, volume: 0, warning: null as string | null };
  const market = getSafeMarketGross(itemName, marketData);
  return {
    value: market.value * MARKET_TAX_MULTIPLIER,
    volume: market.volume,
    warning: market.warning,
  };
}

function getMaterialCost(itemName: string, marketData: MarketLookup, allItemsDb: ItemLookup) {
  const item = getItemByName(itemName, allItemsDb);
  const market = getSafeMarketGross(itemName, marketData);
  if (market.value > 0) return market.value;
  const merchant = getMerchantBuyPrice(itemName);
  if (merchant) return merchant;
  return getVendorValue(itemName, item, marketData);
}

function pickBestBaseValue(itemName: string, item: any, marketData: MarketLookup) {
  const market = getMarketSellNet(itemName, item, marketData);
  const vendorValue = getVendorValue(itemName, item, marketData);
  const warnings = market.warning ? [market.warning] : [];
  if (market.value <= 0 && vendorValue <= 0) {
    return { value: 0, path: "missing" as ValuePath, marketValue: market.value, vendorValue, marketVolume: market.volume, warnings };
  }
  if (vendorValue > market.value) {
    return { value: vendorValue, path: "vendor" as ValuePath, marketValue: market.value, vendorValue, marketVolume: market.volume, warnings };
  }
  return { value: market.value, path: "market" as ValuePath, marketValue: market.value, vendorValue, marketVolume: market.volume, warnings };
}

export function getItemValueBreakdown(
  itemName: string,
  marketData: MarketLookup,
  allItemsDb: ItemLookup,
  depth = 0,
): ItemValueBreakdown {
  if (depth > 4) {
    return {
      name: itemName,
      value: 0,
      path: "missing",
      marketValue: 0,
      vendorValue: 0,
      warnings: ["Value recursion limit"],
    };
  }

  const item = getItemByName(itemName, allItemsDb);
  const base = pickBestBaseValue(itemName, item, marketData);
  const result: ItemValueBreakdown = {
    name: itemName,
    value: base.value,
    path: base.path,
    marketValue: base.marketValue,
    vendorValue: base.vendorValue,
    marketVolume: base.marketVolume,
    warnings: [...base.warnings],
  };

  if (!item) return result;

  const loot = item.loot_table || item.chest_drops;
  if (Array.isArray(loot) && loot.length > 0) {
    const chestDropDetails: ChestDropValueDetail[] = loot.map((drop: any) => {
      const dropName = drop.item_name || drop.name;
      const chance = Number(drop.chance || 0) / 100;
      const quantity = Number(drop.quantity || drop.amount || 1);
      const breakdown = getItemValueBreakdown(dropName, marketData, allItemsDb, depth + 1);
      return {
        name: dropName,
        chance,
        quantity,
        itemValue: breakdown.value,
        expectedValue: chance * quantity * breakdown.value,
        path: breakdown.path,
        marketValue: breakdown.marketValue,
        vendorValue: breakdown.vendorValue,
        craftedItemName: breakdown.craftedItemName,
        craftedValue: breakdown.craftedValue,
        materialCost: breakdown.materialCost,
        craftValue: breakdown.craftValue,
        warnings: breakdown.warnings,
      };
    });
    const chestValue = chestDropDetails.reduce((total: number, drop: ChestDropValueDetail) => total + drop.expectedValue, 0);
    result.chestValue = chestValue;
    result.chestDropDetails = chestDropDetails;
    if (chestValue > result.value) {
      result.value = chestValue;
      result.path = "chest";
    }
  }

  const recipe = item.recipe;
  const craftedItemName = recipe?.result?.item_name || item.recipe_yield?.item_name;
  if ((item.type === "RECIPE" || craftedItemName) && craftedItemName) {
    const crafted = getItemValueBreakdown(craftedItemName, marketData, allItemsDb, depth + 1);
    const uses = Number(recipe?.max_uses || item.recipe_yield?.uses || 1);
    const safeUses = Number.isFinite(uses) && uses > 0 ? uses : 1;
    const materials = Array.isArray(recipe?.materials)
      ? recipe.materials
      : Array.isArray(recipe?.ingredients)
        ? recipe.ingredients
        : [];
    const craftMaterialDetails: CraftMaterialValueDetail[] = materials.map((material: any) => {
      const materialName = material.item_name || material.name;
      const quantity = Number(material.quantity || material.amount || 1);
      const unitCost = getMaterialCost(materialName, marketData, allItemsDb);
      return {
        name: materialName,
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
      };
    });
    const materialCost = craftMaterialDetails.reduce((total: number, material: CraftMaterialValueDetail) => total + material.totalCost, 0);
    const craftValue = Math.max(0, (crafted.value - materialCost) * safeUses);
    result.craftedItemName = craftedItemName;
    result.craftedValue = crafted.value;
    result.materialCost = materialCost * safeUses;
    result.recipeUses = safeUses;
    result.craftMaterialDetails = craftMaterialDetails;
    result.craftValue = craftValue;
    result.warnings.push(...crafted.warnings.map((warning) => `${craftedItemName}: ${warning}`));
    if (craftValue > result.value) {
      result.value = craftValue;
      result.path = "craft";
    }
  }

  return result;
}

export function getItemTrueValue(
  itemName: string,
  marketData: MarketLookup,
  allItemsDb: ItemLookup,
  depth = 0,
): number {
  return getItemValueBreakdown(itemName, marketData, allItemsDb, depth).value;
}
