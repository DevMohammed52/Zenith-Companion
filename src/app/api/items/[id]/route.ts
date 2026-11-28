import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getMerchantBuyPrice } from '@/constants';
import { getSafeMarketValue } from '@/lib/market-pricing';

export const runtime = 'nodejs';

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

// Singleton caches with timestamps (drops static-data.json by precomputing recipe sources in usage-map.json)
const caches: Record<'itemsMap' | 'allItems' | 'market' | 'usage', CacheEntry> = {
  itemsMap: { data: null, mtime: 0 },
  allItems: { data: null, mtime: 0 },
  market: { data: null, mtime: 0 },
  usage: { data: null, mtime: 0 },
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

function enrichIngredientsPricing(list: any[], marketData: JsonObject, nameKey: 'name' | 'item_name' = 'name') {
  return list.map((entry: any) => {
    const name = nameKey === 'item_name'
      ? (entry.item_name || entry.name)
      : (entry.name || entry.item_name);
    const entryMarket = marketData[name] || {};
    return { ...entry, price: getMerchantBuyPrice(name) || getSafeMarketValue(entryMarket) || 0 };
  });
}

function computeItemEtag(id: string): string {
  const version = [
    Math.trunc(caches.allItems.mtime),
    Math.trunc(caches.itemsMap.mtime),
    Math.trunc(caches.market.mtime),
    Math.trunc(caches.usage.mtime),
  ].join('.');
  return `W/"${id}-${version}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ITEM_ID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: { code: 'invalid_item_id', message: 'Invalid item id.' } },
      { status: 400, headers: ITEM_ERROR_HEADERS },
    );
  }

  try {
    const dataDir = path.join(process.cwd(), 'public');

    const itemsMap = getCachedData(path.join(dataDir, 'items-map.json'), 'itemsMap');
    const allItems = getCachedData(path.join(dataDir, 'all-items-db.json'), 'allItems');
    const marketData = getCachedData(path.join(dataDir, 'market-data.json'), 'market');
    const usageMap = getCachedData(path.join(dataDir, 'usage-map.json'), 'usage');
    const itemsByName = getItemsByName(allItems, itemsMap);

    const rawItem = itemsMap?.[id] || allItems?.[id] || null;
    if (!rawItem) {
      return NextResponse.json(
        { error: { code: 'not_found', message: 'Item not found in any registry.' } },
        { status: 404, headers: ITEM_ERROR_HEADERS },
      );
    }

    const etag = computeItemEtag(id);
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch.split(',').map((v) => v.trim()).includes(etag)) {
      return new Response(null, {
        status: 304,
        headers: { ...ITEM_RESPONSE_HEADERS, etag },
      });
    }

    const item = structuredClone(rawItem);

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

    if (!item.recipe_yield && item.recipe?.result?.item_name) {
      item.recipe_yield = {
        item_name: item.recipe.result.item_name,
        uses: Number(item.recipe.max_uses || 0) > 0 ? Number(item.recipe.max_uses) : 'Infinite'
      };
    }

    if (marketData) {
      const marketItem = marketData[item.name];
      if (marketItem) {
        Object.assign(item, marketItem);
        item.market_price = getSafeMarketValue(marketItem) || marketItem.price || 0;
      }

      if (item.recipe) {
        if (item.recipe.ingredients) {
          item.recipe.ingredients = enrichIngredientsPricing(item.recipe.ingredients, marketData, 'name');
        }
        if (item.recipe.materials) {
          item.recipe.materials = enrichIngredientsPricing(item.recipe.materials, marketData, 'item_name');
        }
      }

      if (item.produced_from) {
        if (item.produced_from.mats) {
          item.produced_from.mats = enrichIngredientsPricing(item.produced_from.mats, marketData, 'name');
        }
        if (item.produced_from.materials) {
          item.produced_from.materials = enrichIngredientsPricing(item.produced_from.materials, marketData, 'name');
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

      if (item.recipe_yield) {
        const yieldMarket = marketData[item.recipe_yield.item_name] || {};
        const yieldItem = itemsByName[item.recipe_yield.item_name] || {};
        item.recipe_yield.market_price = getSafeMarketValue(yieldMarket) || 0;
        item.recipe_yield.vendor_price = Number(yieldItem.vendor_price || yieldMarket.vendor_price || 0);
        item.recipe_yield.type = yieldItem.type || yieldMarket.type;
        item.recipe_yield.quality = yieldItem.quality || yieldMarket.quality;
        item.recipe_yield.is_tradeable = yieldItem.is_tradeable ?? yieldMarket.is_tradeable;
      }
    }

    return NextResponse.json(item, { headers: { ...ITEM_RESPONSE_HEADERS, etag } });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { code: 'internal_error', message: 'Failed to load item details.' } },
      { status: 500, headers: ITEM_ERROR_HEADERS },
    );
  }
}
