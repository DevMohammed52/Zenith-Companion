
/**
 * Shared Expected Value (EV) logic for Zenith Companion.
 * Calculates the "True Value" of an item by recursively looking into 
 * chests, recipes, and market prices.
 */

export function getItemTrueValue(
    itemName: string, 
    marketData: any, 
    allItemsDb: any, 
    depth = 0
): number {
    if (depth > 3) return 0; // Prevent infinite recursion

    const mData = marketData[itemName];
    const dbItem = allItemsDb[itemName];
    
    // Base market price
    const marketPrice = mData?.avg_3 || 0;

    if (!dbItem) return marketPrice;

    // 1. If it's a Chest, calculate weighted EV of contents
    const loot = dbItem.loot_table || dbItem.chest_drops;
    if (loot && loot.length > 0) {
        let chestEV = 0;
        for (const drop of loot) {
            const dropName = drop.item_name || drop.name;
            const dropChance = (drop.chance || 0) / 100;
            const dropQty = drop.quantity || 1;
            const dropVal = getItemTrueValue(dropName, marketData, allItemsDb, depth + 1);
            chestEV += dropChance * dropQty * dropVal;
        }
        // If chest is tradable, return max of market price or content EV
        if (dbItem.is_tradeable) {
            return Math.max(marketPrice, chestEV);
        }
        return chestEV;
    }

    // 2. If it's a Recipe/Blueprint, calculate ROI
    if (dbItem.type === 'RECIPE' || dbItem.recipe_yield) {
        const yieldData = dbItem.recipe_yield;
        if (!yieldData) return marketPrice;

        const resultName = yieldData.item_name;
        const resultVal = getItemTrueValue(resultName, marketData, allItemsDb, depth + 1);
        
        // Calculate mat costs
        let matCosts = 0;
        const mats = dbItem.recipe?.ingredients || dbItem.recipe?.materials || [];
        for (const mat of mats) {
            const matPrice = marketData[mat.name]?.avg_3 || 0;
            matCosts += matPrice * (mat.amount || mat.quantity || 1);
        }

        const uses = yieldData.uses === 'Infinite' ? 1 : Number(yieldData.uses);
        const craftingROI = (resultVal * 0.88 - matCosts) * (uses || 1);

        // For recipes, we take max of selling recipe or crafting
        // If untradable, we only have crafting ROI
        if (dbItem.is_tradeable) {
            return Math.max(marketPrice * 0.88, craftingROI);
        }
        return Math.max(0, craftingROI);
    }

    // 3. Normal Item
    return marketPrice;
}
