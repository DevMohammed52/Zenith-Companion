import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Singleton caches with timestamps
let caches: Record<string, { data: any, mtime: number }> = {
  itemsMap: { data: null, mtime: 0 },
  allItems: { data: null, mtime: 0 },
  market: { data: null, mtime: 0 },
  usage: { data: null, mtime: 0 }
};

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const dataDir = path.join(process.cwd(), 'public');
    
    const itemsMap = getCachedData(path.join(dataDir, 'items-map.json'), 'itemsMap');
    const allItems = getCachedData(path.join(dataDir, 'all-items-db.json'), 'allItems');
    const marketData = getCachedData(path.join(dataDir, 'market-data.json'), 'market');
    const usageMap = getCachedData(path.join(dataDir, 'usage-map.json'), 'usage');

    // 3. Lookup Item (clone to prevent cache mutation)
    const rawItem = itemsMap?.[id] || allItems?.[id] || null;
    if (!rawItem) {
      return NextResponse.json({ error: 'Item not found in any registry' }, { status: 404 });
    }
    
    const item = structuredClone(rawItem);

    // 4. Attach relational data (Drops, Utility, & Produce) from Cache
    if (usageMap) {
      const relations = usageMap[item.name];
      if (relations) {
        item.dropped_by = relations.dropped_by || [];
        item.required_for = relations.required_for || [];
        item.produced_from = relations.produced_from || null;
      } else {
        item.dropped_by = [];
        item.required_for = [];
        item.produced_from = null;
      }
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
            const ingMarket = marketData[ing.name || ing.item_name] || {};
            return { ...ing, price: ingMarket.avg_3 || 0 };
          });
        }
        if (item.recipe.materials) {
          item.recipe.materials = item.recipe.materials.map((mat: any) => {
            const matMarket = marketData[mat.item_name || mat.name] || {};
            return { ...mat, price: matMarket.avg_3 || 0 };
          });
        }
      }

      // Inject pricing into produced_from materials (Reverse Recipe)
      if (item.produced_from) {
        if (item.produced_from.mats) {
          item.produced_from.mats = item.produced_from.mats.map((mat: any) => {
            const matMarket = marketData[mat.name] || {};
            return { ...mat, price: matMarket.avg_3 || 0 };
          });
        }
        if (item.produced_from.name) {
          const recipeMarket = marketData[item.produced_from.name] || {};
          item.produced_from.recipe_price = recipeMarket.avg_3 || 0;
          // Also try to find the recipe's quality for 'uses' logic
          const recipeObj = itemsMap?.[item.produced_from.name] || allItems?.[item.produced_from.name];
          if (recipeObj) {
            item.produced_from.recipe_quality = recipeObj.quality;
          }
        }
      }

      // Inject Result Price for Recipes
      if (item.recipe_yield) {
        const yieldMarket = marketData[item.recipe_yield.item_name] || {};
        item.recipe_yield.market_price = yieldMarket.avg_3 || 0;
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
