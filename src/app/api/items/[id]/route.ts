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
  usage: { data: null, mtime: 0 },
  staticData: { data: null, mtime: 0 },
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

function getRecipeDungeonSources(
  item: JsonObject,
  allItems: JsonObject | null,
  itemsMap: JsonObject | null,
  staticData: JsonObject | null
) {
  if (item?.type !== "RECIPE") return [];

  const recipeKey = normalizeRecipeDropName(item.name);
  const dungeons: any[] = staticData?.dungeons || [];
  const sources: any[] = [];
  const seen = new Set<string>();

  // 1. Direct dungeon completion drops
  for (const dungeon of dungeons) {
    const lootList: any[] = dungeon.loot || [];
    const directDrop = lootList.find(
      (loot: any) => normalizeRecipeDropName(loot?.name || loot?.item_name) === recipeKey
    );
    if (directDrop) {
      const key = `DUNGEON:${dungeon.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        sources.push({
          type: "DUNGEON",
          name: dungeon.name,
          chance: directDrop.chance ?? "Unknown",
          location: dungeon.location?.name || "Dungeon",
          source_item_name: dungeon.name,
          note: "Earned as a dungeon completion reward drop.",
        });
      }
    }
  }

  // 2. Chest drops (both Alchemy chests and standard Recipe containers)
  const chests = Object.values({ ...(allItems || {}), ...(itemsMap || {}) }).filter(
    (candidate: any) => candidate?.type === "CHEST"
  );

  for (const chest of chests) {
    const drops = [...(chest.loot_table || []), ...(chest.chest_drops || [])];
    const matchingDrop = drops.find(
      (drop: any) => normalizeRecipeDropName(drop?.item_name || drop?.name) === recipeKey
    );
    if (!matchingDrop) continue;

    // Resolve which dungeon this chest originates from
    const parentDungeon = dungeons.find((d: any) =>
      (d.loot || []).some(
        (l: any) => normalizeRecipeDropName(l?.name || l?.item_name) === normalizeRecipeDropName(chest.name)
      )
    );

    const dungeonLocation = parentDungeon
      ? `${parentDungeon.name}${parentDungeon.location?.name ? ` (${parentDungeon.location.name})` : ''}`
      : chest?.where_to_find?.dungeons?.[0]?.name || "Dungeon Chest";

    const key = `DUNGEON_CHEST:${chest.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      sources.push({
        type: "DUNGEON_CHEST",
        name: chest.name,
        chance: matchingDrop.chance ?? "Unknown",
        location: dungeonLocation,
        source_item_name: chest.name,
        note: `Dropped inside ${chest.name} from dungeons.`,
      });
    }
  }

  return sources;
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
    const staticData = getCachedData(path.join(dataDir, 'static-data.json'), 'staticData');
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

    const recipeDungeonSources = getRecipeDungeonSources(item, allItems, itemsMap, staticData);
    if (recipeDungeonSources.length > 0) {
      const existingSources = Array.isArray(item.dropped_by) ? item.dropped_by : [];
      const existingKeys = new Set(existingSources.map((source: any) => `${source?.type || ""}:${source?.name || ""}`));
      item.dropped_by = [
        ...existingSources,
        ...recipeDungeonSources.filter((source) => !existingKeys.has(`${source.type}:${source.name}`)),
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
        item.market_price = getSafeMarketValue(marketItem) || marketItem.price || 0;
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
            const name = mat.name || mat.item_name;
            const matMarket = marketData[name] || {};
            return { ...mat, price: getMerchantBuyPrice(name) || getSafeMarketValue(matMarket) || 0 };
          });
        }
        if (item.produced_from.materials) {
          item.produced_from.materials = item.produced_from.materials.map((mat: any) => {
            const name = mat.name || mat.item_name;
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
