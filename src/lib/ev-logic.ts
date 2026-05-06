
import { getMerchantBuyPrice } from "@/constants";
import { getSafeMarketValue } from "@/lib/market-pricing";

export type TrueValueMarketItem = {
    avg_3?: number;
    avg_7?: number;
    avg_14?: number;
    avg_30?: number;
    price?: number;
    vendor_price?: number;
    is_tradeable?: boolean;
    vol_3?: number;
};

export type TrueValueDbItem = {
    name?: string;
    type?: string;
    is_tradeable?: boolean;
    vendor_price?: number;
    loot_table?: TrueValueDrop[];
    chest_drops?: TrueValueDrop[];
    recipe_yield?: {
        item_name?: string;
        uses?: number | string;
    } | null;
    recipe?: {
        max_uses?: number | string;
        result?: {
            item_name?: string;
            name?: string;
        } | null;
        ingredients?: TrueValueIngredient[];
        materials?: TrueValueIngredient[];
    } | null;
};

export type TrueValueDrop = {
    name?: string;
    item_name?: string;
    chance?: number;
    quantity?: number;
};

export type TrueValueIngredient = {
    name?: string;
    item_name?: string;
    amount?: number;
    quantity?: number;
};

export type TrueValueOptions = {
    customPrices?: Record<string, number>;
    marketTaxMultiplier?: number;
    barteringBoost?: number | "";
};

export type TrueValueMarketData = Record<string, TrueValueMarketItem>;
export type TrueValueItemDb = Record<string, TrueValueDbItem>;

export type TrueValuePath = "market" | "vendor" | "chest_ev" | "recipe_craft" | "missing";

export type TrueValueBreakdown = {
    itemName: string;
    value: number;
    directValue: number;
    marketNet: number;
    vendorNet: number;
    chosenPath: TrueValuePath;
    recipe?: {
        resultName: string;
        resultValue: number;
        materialCost: number;
        uses: number;
        craftValue: number;
        materials: Array<{
            name: string;
            quantity: number;
            unitCost: number;
            totalCost: number;
        }>;
    };
    chest?: {
        expectedValue: number;
        drops: Array<{
            name: string;
            chance: number;
            quantity: number;
            value: number;
            expectedValue: number;
            path: TrueValuePath;
        }>;
    };
};

export function getItemTrueValue(
    itemName: string,
    marketData: TrueValueMarketData | null | undefined,
    allItemsDb: TrueValueItemDb | null | undefined,
    depth = 0,
    options: TrueValueOptions = {},
): number {
    return getItemTrueValueBreakdown(itemName, marketData, allItemsDb, depth, options).value;
}

export function getItemTrueValueBreakdown(
    itemName: string,
    marketData: TrueValueMarketData | null | undefined,
    allItemsDb: TrueValueItemDb | null | undefined,
    depth = 0,
    options: TrueValueOptions = {},
): TrueValueBreakdown {
    const empty = {
        itemName,
        value: 0,
        directValue: 0,
        marketNet: 0,
        vendorNet: 0,
        chosenPath: "missing" as const,
    };
    if (depth > 3) return empty; // Prevent infinite recursion
    if (!itemName) return empty;

    const mData = marketData?.[itemName];
    const dbItem = allItemsDb?.[itemName];
    const direct = getDirectSellBreakdown(itemName, mData, dbItem, options);
    const directValue = direct.value;
    let best: TrueValueBreakdown = {
        itemName,
        value: directValue,
        directValue,
        marketNet: direct.marketNet,
        vendorNet: direct.vendorNet,
        chosenPath: direct.chosenPath,
    };

    if (!dbItem) return best;

    // Chests can be worth their contents even when the listed market is thin.
    const loot = dbItem.loot_table || dbItem.chest_drops;
    if (loot && loot.length > 0) {
        let chestEV = 0;
        const chestDrops = [];
        for (const drop of loot) {
            const dropName = drop.item_name || drop.name;
            const dropChance = (drop.chance || 0) / 100;
            const dropQty = drop.quantity || 1;
            const dropBreakdown = getItemTrueValueBreakdown(dropName || "", marketData, allItemsDb, depth + 1, options);
            const dropVal = dropBreakdown.value;
            const expectedValue = dropChance * dropQty * dropVal;
            chestEV += expectedValue;
            chestDrops.push({
                name: dropName || "Unknown item",
                chance: drop.chance || 0,
                quantity: dropQty,
                value: dropVal,
                expectedValue,
                path: dropBreakdown.chosenPath,
            });
        }
        const chest = { expectedValue: chestEV, drops: chestDrops };
        if (chestEV > best.value || dbItem.is_tradeable === false) {
            best = {
                ...best,
                value: Math.max(chestEV, best.vendorNet),
                chosenPath: chestEV >= best.vendorNet ? "chest_ev" : "vendor",
                chest,
            };
        } else {
            best.chest = chest;
        }
        return best;
    }

    // Recipes are valued by either selling the recipe or using its remaining crafts.
    if (dbItem.type === "RECIPE" || dbItem.recipe_yield) {
        const yieldData = dbItem.recipe_yield;
        const resultName = yieldData?.item_name || dbItem.recipe?.result?.item_name || dbItem.recipe?.result?.name;
        if (!resultName) return best;

        const resultVal = getItemTrueValue(resultName, marketData, allItemsDb, depth + 1, options);
        let matCosts = 0;
        const materialBreakdown = [];
        const mats = dbItem.recipe?.ingredients || dbItem.recipe?.materials || [];
        for (const mat of mats) {
            const matName = mat.name || mat.item_name || "";
            const quantity = mat.amount || mat.quantity || 1;
            const matPrice = getAcquisitionCost(matName, marketData, options.customPrices);
            const totalCost = matPrice * quantity;
            matCosts += totalCost;
            materialBreakdown.push({ name: matName, quantity, unitCost: matPrice, totalCost });
        }

        const rawUses = yieldData?.uses || dbItem.recipe?.max_uses;
        const uses = rawUses === "Infinite" ? 1 : Number(rawUses);
        const craftingROI = (resultVal - matCosts) * (Number.isFinite(uses) && uses > 0 ? uses : 1);
        const craftUses = Number.isFinite(uses) && uses > 0 ? uses : 1;

        if (craftingROI > best.value || dbItem.is_tradeable === false) {
            best = {
                ...best,
                value: dbItem.is_tradeable === false ? Math.max(0, best.vendorNet, craftingROI) : Math.max(directValue, craftingROI),
                chosenPath: craftingROI >= Math.max(directValue, best.vendorNet) ? "recipe_craft" : best.chosenPath,
                recipe: {
                    resultName,
                    resultValue: resultVal,
                    materialCost: matCosts,
                    uses: craftUses,
                    craftValue: craftingROI,
                    materials: materialBreakdown,
                },
            };
        } else {
            best.recipe = {
                resultName,
                resultValue: resultVal,
                materialCost: matCosts,
                uses: craftUses,
                craftValue: craftingROI,
                materials: materialBreakdown,
            };
        }

        return best;
    }

    return best;
}

function getDirectSellBreakdown(
    itemName: string,
    marketItem: TrueValueMarketItem | undefined,
    dbItem: TrueValueDbItem | undefined,
    options: TrueValueOptions,
) {
    const customPrice = getCustomPrice(options.customPrices, itemName);
    const marketGross = customPrice || getSafeMarketValue(marketItem);
    const canMarketSell = customPrice > 0 || dbItem?.is_tradeable !== false;
    const marketNet = canMarketSell ? marketGross * (options.marketTaxMultiplier ?? 0.85) : 0;
    const vendorNet = getVendorNet(marketItem, dbItem, options);
    return {
        value: Math.max(marketNet, vendorNet),
        marketNet,
        vendorNet,
        chosenPath: marketNet >= vendorNet ? "market" as const : "vendor" as const,
    };
}

function getVendorNet(
    marketItem: TrueValueMarketItem | undefined,
    dbItem: TrueValueDbItem | undefined,
    options: TrueValueOptions,
) {
    const base = Number(dbItem?.vendor_price || marketItem?.vendor_price || 0);
    const boost = (Number(options.barteringBoost) || 0) / 100;
    return base * (1 + boost);
}

function getAcquisitionCost(
    itemName: string,
    marketData: TrueValueMarketData | null | undefined,
    customPrices?: Record<string, number>,
) {
    const customPrice = getCustomPrice(customPrices, itemName);
    if (customPrice > 0) return customPrice;
    return getMerchantBuyPrice(itemName) || getSafeMarketValue(marketData?.[itemName]);
}

function getCustomPrice(customPrices: Record<string, number> | undefined, itemName: string) {
    const custom = Number(customPrices?.[itemName] || 0);
    return Number.isFinite(custom) && custom > 0 ? custom : 0;
}
