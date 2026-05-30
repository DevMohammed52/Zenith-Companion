import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getMerchantBuyPrice } from '@/constants';
import { getSafeMarketValue } from '@/lib/market-pricing';

type JsonObject = Record<string, any>;
type CacheEntry = {
  data: any;
  mtime: number;
};
type ItemNameCacheEntry = CacheEntry & {
  sourceKey: string;
};

const ITEM_ID_PATTERN = /^[A-Za-z0-9_-]{1,160}$/;
const ITEM_RESPONSE_HEADERS = {
  "cache-control": "public, max-age=3600",
  "cdn-cache-control": "public, max-age=86400, stale-while-revalidate=604800",
  "vercel-cdn-cache-control": "public, max-age=86400, stale-while-revalidate=604800",
  "x-robots-tag": "noindex, nofollow",
};
const ITEM_ERROR_HEADERS = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

// Singleton caches with timestamps
const caches: Record<string, CacheEntry> = {
  itemsMap: { data: null, mtime: 0 },
  allItems: { data: null, mtime: 0 },
  market: { data: null, mtime: 0 },
  usage: { data: null, mtime: 0 }
};
const itemNameCache: ItemNameCacheEntry = { data: null, mtime: 0, sourceKey: "" };

function getCachedData(filePath: string, cacheKey: keyof typeof caches) {
  if (!fs.existsSync(filePath)) return null;
  const stats = fs.statSync(filePath);
  if (!caches[cacheKey].data || stats.mtimeMs > caches[cacheKey].mtime) {
    caches[cacheKey] = {
      data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
      mtime: stats.mtimeMs
    };
  }
  return caches[cacheKey].data;
}

function getItemsByName(allItems: JsonObject | null, itemsMap: JsonObject | null) {
  const sourceKey = `${caches.allItems.mtime}:${caches.itemsMap.mtime}`;
  if (!itemNameCache.data || itemNameCache.sourceKey !== sourceKey) {
    const byName: JsonObject = {};
    for (const source of [allItems, itemsMap]) {
      Object.values(source || {}).forEach((item: any) => {
        if (item?.name && !byName[item.name]) byName[item.name] = item;
      });
    }
    itemNameCache.data = byName;
    itemNameCache.mtime = Math.max(caches.allItems.mtime, caches.itemsMap.mtime);
    itemNameCache.sourceKey = sourceKey;
  }
  return itemNameCache.data as JsonObject;
}

function normalizeRecipeDropName(value: unknown) {
  return String(value || "")
    .replace(/\s+\(Untradable\)$/i, "")
    .trim()
    .toLowerCase();
}

function isAlchemyRecipeItem(item: JsonObject) {
  return item?.type === "RECIPE" && String(item?.recipe?.skill || "").trim().toLowerCase() === "alchemy";
}

function getFirstDungeonSource(chest: JsonObject) {
  const dungeons = chest?.where_to_find?.dungeons;
  return Array.isArray(dungeons) && dungeons.length > 0 ? dungeons[0] : null;
}

function getAlchemyChestSourcesForRecipe(item: JsonObject, allItems: JsonObject | null, itemsMap: JsonObject | null) {
  if (!isAlchemyRecipeItem(item)) return [];

  const recipeKey = normalizeRecipeDropName(item.name);
  const chests = Object.values({ ...(allItems || {}), ...(itemsMap || {}) }).filter((candidate: any) => (
    candidate?.type === "CHEST" && /Alchemy Chest/i.test(String(candidate?.name || ""))
  ));

  return chests.flatMap((chest: any) => {
    const drops = [...(chest.loot_table || []), ...(chest.chest_drops || [])];
    const matchingDrop = drops.find((drop: any) => normalizeRecipeDropName(drop?.item_name || drop?.name) === recipeKey);
    if (!matchingDrop) return [];

    const dungeon = getFirstDungeonSource(chest);
    return [{
      type: "DUNGEON_CHEST",
      name: chest.name,
      chance: matchingDrop.chance ?? "Unknown",
      location: dungeon ? { id: dungeon.id, name: dungeon.name } : "Dungeon reward chest",
      source_item_name: chest.name,
      note: "Dropped from an alchemy chest earned through dungeons.",
    }];
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ITEM_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid item id' }, { status: 400, headers: ITEM_ERROR_HEADERS });
  }
  
  try {
    const dataDir = path.join(process.cwd(), 'public');
    
    const itemsMap = getCachedData(path.join(dataDir, 'items-map.json'), 'itemsMap');
    const allItems = getCachedData(path.join(dataDir, 'all-items-db.json'), 'allItems');
    const marketData = getCachedData(path.join(dataDir, 'market-data.json'), 'market');
    const usageMap = getCachedData(path.join(dataDir, 'usage-map.json'), 'usage');
    const itemsByName = getItemsByName(allItems, itemsMap);

    // 3. Lookup Item (clone to prevent cache mutation)
    const rawItem = itemsMap?.[id] || allItems?.[id] || null;
    if (!rawItem) {
      return NextResponse.json({ error: 'Item not found in any registry' }, { status: 404, headers: ITEM_ERROR_HEADERS });
    }
    
    const item = structuredClone(rawItem);

    // 4. Attach relational data (Drops, Utility, & Produce) from Cache
    if (usageMap) {
      const relations = usageMap[item.name];
      if (relations) {
        item.dropped_by = relations.dropped_by || [];
        item.required_for = relations.required_for || [];
        item.produced_from = relations.produced_from || null;
        item.recipe_yield = relations.recipe_yield || item.recipe_yield || null;
      } else {
        item.dropped_by = [];
        item.required_for = [];
        item.produced_from = null;
        item.recipe_yield = item.recipe_yield || null;
      }
    }

    const alchemyChestSources = getAlchemyChestSourcesForRecipe(item, allItems, itemsMap);
    if (alchemyChestSources.length > 0) {
      const existingSources = Array.isArray(item.dropped_by) ? item.dropped_by : [];
      const existingKeys = new Set(existingSources.map((source: any) => `${source?.type || ""}:${source?.name || ""}`));
      item.dropped_by = [
        ...existingSources,
        ...alchemyChestSources.filter((source) => !existingKeys.has(`${source.type}:${source.name}`)),
      ];
    }

    if (!item.recipe_yield && item.recipe?.result?.item_name) {
      item.recipe_yield = {
        item_name: item.recipe.result.item_name,
        uses: Number(item.recipe.max_uses || 0) > 0 ? Number(item.recipe.max_uses) : 'Infinite'
      };
    }

    // 5. Attach live market data & Inject Ingredient Pricing
    if (marketData) {
      // Update item's own market data
      const marketItem = marketData[item.name];
      if (marketItem) {
        Object.assign(item, marketItem);
      }

      // Inject pricing into direct recipe
      if (item.recipe) {
        if (item.recipe.ingredients) {
          item.recipe.ingredients = item.recipe.ingredients.map((ing: any) => {
            const name = ing.name || ing.item_name;
            const ingMarket = marketData[name] || {};
            return { ...ing, price: getMerchantBuyPrice(name) || getSafeMarketValue(ingMarket) || 0 };
          });
        }
        if (item.recipe.materials) {
          item.recipe.materials = item.recipe.materials.map((mat: any) => {
            const name = mat.item_name || mat.name;
            const matMarket = marketData[name] || {};
            return { ...mat, price: getMerchantBuyPrice(name) || getSafeMarketValue(matMarket) || 0 };
          });
        }
      }

      // Inject pricing into produced_from materials (Reverse Recipe)
      if (item.produced_from) {
        if (item.produced_from.mats) {
          item.produced_from.mats = item.produced_from.mats.map((mat: any) => {
            const name = mat.name;
            const matMarket = marketData[name] || {};
            return { ...mat, price: getMerchantBuyPrice(name) || getSafeMarketValue(matMarket) || 0 };
          });
        }
        
        const rName = item.produced_from.recipe_name;
        if (rName) {
          const recipeMarket = marketData[rName] || {};
          item.produced_from.recipe_price = getSafeMarketValue(recipeMarket) || 0;
          
          const recipeObj = itemsByName[rName];
          if (recipeObj) {
            item.produced_from.recipe_quality = (recipeObj as any).quality;
          }
        }
      }

      // Inject Result Price for Recipes
      if (item.recipe_yield) {
        const yieldMarket = marketData[item.recipe_yield.item_name] || {};
        const yieldItem = allItems?.[item.recipe_yield.item_name] || itemsMap?.[item.recipe_yield.item_name] || {};
        item.recipe_yield.market_price = getSafeMarketValue(yieldMarket) || 0;
        item.recipe_yield.vendor_price = Number(yieldItem.vendor_price || yieldMarket.vendor_price || 0);
        item.recipe_yield.type = yieldItem.type || yieldMarket.type;
        item.recipe_yield.quality = yieldItem.quality || yieldMarket.quality;
        item.recipe_yield.is_tradeable = yieldItem.is_tradeable ?? yieldMarket.is_tradeable;
      }
    }

    return NextResponse.json(item, { headers: ITEM_RESPONSE_HEADERS });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: ITEM_ERROR_HEADERS });
  }
}
