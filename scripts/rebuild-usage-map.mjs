import fs from 'fs';
import path from 'path';
import { normalizeProductName, getRecipeUses } from '../src/lib/logic-core.mjs';
import { DEFAULT_ALCHEMY_RECIPES } from '../src/lib/default-alchemy-recipes.mjs';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function loadOptionalJson(fileName, fallback) {
  const filePath = path.join(PUBLIC_DIR, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`Could not read ${fileName}: ${error.message}`);
    return fallback;
  }
}

function normalizeLocationKey(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return normalizeLocationKey(value.key ?? value.name ?? value.id);
  }
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildLocationLookup(worldLocations = []) {
  const lookup = new Map();
  const register = (location) => {
    if (!location || typeof location !== 'object') return;
    const key = normalizeLocationKey(location.key || location.name || location.id);
    const normalized = {
      id: location.id ?? null,
      key,
      name: String(location.name || location.key || location.id || '').trim(),
    };
    if (!normalized.name || !normalized.key) return;
    lookup.set(normalized.key, normalized);
    if (normalized.id !== null && normalized.id !== undefined) {
      lookup.set(`id:${normalized.id}`, normalized);
    }
    lookup.set(normalizeLocationKey(normalized.name), normalized);
  };

  worldLocations.forEach(register);
  return lookup;
}

function resolveLocation(location, locationLookup) {
  if (!location) return { id: null, key: null, name: 'Unknown' };
  const id = location.id ?? null;
  const rawKey = normalizeLocationKey(location.key || location.name || id);
  const match = (id !== null && id !== undefined ? locationLookup.get(`id:${id}`) : null)
    || locationLookup.get(rawKey);
  const name = match?.name || String(location.name || location.key || id || 'Unknown').trim();
  const key = match?.key || normalizeLocationKey(location.key || name || id);
  return {
    id: match?.id ?? id,
    key: key || null,
    name: name || 'Unknown',
  };
}

async function rebuild() {
  console.log('--- Zenith Relational Linker Started ---');
  
  // Load ALL data sources
  const staticData = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'static-data.json'), 'utf8'));
  const itemsMap = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'items-map.json'), 'utf8'));
  const allItemsDb = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'all-items-db.json'), 'utf8'));
  const worldLocationsPayload = loadOptionalJson('world-locations.json', { locations: [] });
  const locationLookup = buildLocationLookup(worldLocationsPayload.locations || []);
  
  const usageMap = {};

  const getEntry = (name) => {
    if (!usageMap[name]) {
      usageMap[name] = {
        dropped_by: [], 
        required_for: [], 
        shops: []
      };
    }
    return usageMap[name];
  };

  // 1. Map Drops (Enemies, Dungeons, Bosses)
  const mapDrops = (list, type) => {
    list.forEach(entity => {
      if (entity.loot) {
        entity.loot.forEach(drop => {
          const entry = getEntry(drop.name);
          if (!entry.dropped_by.find(d => d.name === entity.name)) {
            const location = resolveLocation(entity.location, locationLookup);
            entry.dropped_by.push({
              type,
              name: entity.name,
              chance: drop.chance,
              location: location.name,
              location_id: location.id,
              location_key: location.key
            });
          }
        });
      }
    });
  };

  mapDrops(staticData.enemies, 'ENEMY');
  mapDrops(staticData.dungeons, 'DUNGEON');
  mapDrops(staticData.world_bosses, 'BOSS');

  // 1. Initialize ALL items from DB to ensure no 'undefined' lookups
  Object.values(allItemsDb).forEach(item => {
    if (item.name) getEntry(item.name);
  });

  // 2. Map ALL Recipes and Chests
  Object.values(allItemsDb).forEach(item => {
    if (item.recipe || item.type === 'RECIPE') {
      const uses = getRecipeUses(item);
      const resultName = normalizeProductName(item.recipe?.result?.item_name || item.name);

      // If we are on the Blueprint, store its yield
      const blueprintEntry = getEntry(item.name);
      blueprintEntry.recipe_yield = {
        item_name: resultName,
        uses: uses
      };

      // If we have actual crafting ingredients, link the Product back to this Blueprint
      if (item.recipe && (item.recipe.ingredients || item.recipe.materials)) {
        const productEntry = getEntry(resultName);
        const mats = item.recipe.ingredients || item.recipe.materials || [];
        const existingRecipe = productEntry.produced_from?.recipe_name
          ? allItemsDb[productEntry.produced_from.recipe_name]
          : null;
        const existingIsUntradable = existingRecipe?.is_tradeable === false || productEntry.produced_from?.recipe_name?.includes('(Untradable)');
        const incomingIsUntradable = item.is_tradeable === false || item.name?.includes('(Untradable)');

        if (!productEntry.produced_from || (existingIsUntradable && !incomingIsUntradable)) {
          productEntry.produced_from = {
            skill: item.recipe.skill || 'CRAFTING',
            level: item.recipe.level_required || item.recipe.level || 1,
            recipe_name: item.name, // Link back to the preferred blueprint
            mats: mats.map(m => ({
              name: m.item_name || m.name,
              amount: m.quantity || m.amount || 1
            }))
          };
        }

        // Map ingredients (Where-used)
        mats.forEach(mat => {
          const mName = mat.item_name || mat.name;
          const matEntry = getEntry(mName);
          if (!matEntry.required_for.find(r => r.name === item.name)) {
            matEntry.required_for.push({
              type: (item.recipe.skill || 'CRAFTING').toUpperCase(),
              name: item.name,
              amount: mat.quantity || mat.amount || 1
            });
          }
        });
      }
    }

    // --- CHEST LOGIC ---
    if (item.type === 'CHEST' && item.chest_drops) {
      const entry = getEntry(item.name);
      entry.loot_table = item.chest_drops.map(d => ({
        name: d.item_name,
        chance: d.chance,
        quantity: d.quantity
      }));
    }
  });

  // 2b. Map default Alchemy crafts. These are learned by every character and do
  // not have physical recipe items in the item API, so they need explicit links.
  Object.entries(DEFAULT_ALCHEMY_RECIPES).forEach(([productName, recipe]) => {
    const productEntry = getEntry(productName);
    if (productEntry.produced_from) return;

    const mats = [
      ...Object.entries(recipe.materials || {}).map(([name, amount]) => ({ name, amount })),
      ...(recipe.vial ? [{ name: recipe.vial, amount: 1 }] : []),
    ];

    productEntry.produced_from = {
      source: 'DEFAULT_ALCHEMY',
      skill: 'ALCHEMY',
      level: recipe.level || 1,
      recipe_name: null,
      recipe_label: 'Default Alchemy craft',
      mats,
    };

    mats.forEach((mat) => {
      const matEntry = getEntry(mat.name);
      if (!matEntry.required_for.find(r => r.name === productName && r.type === 'ALCHEMY')) {
        matEntry.required_for.push({
          type: 'ALCHEMY',
          name: productName,
          amount: mat.amount,
          source: 'DEFAULT_ALCHEMY',
        });
      }
    });
  });

  // 3. Build Search Index
  const searchIndex = Object.values(allItemsDb).map(item => ({
    id: item.hashed_id,
    name: item.name,
    type: item.type,
    quality: item.quality,
    image: item.image_url
  }));

  const globalSearchIndex = [
    ...searchIndex
      .filter(item => item.name)
      .map(item => ({
        label: item.name,
        type: 'Item',
        href: `/items?name=${encodeURIComponent(item.name)}`,
        detail: item.type ? String(item.type).replace(/_/g, ' ') : 'Game Item'
      })),
    ...(staticData.enemies || [])
      .filter(enemy => enemy?.name)
      .map(enemy => ({
        label: enemy.name,
        type: 'Enemy',
        href: `/enemies?search=${encodeURIComponent(enemy.name)}`,
        detail: enemy.location?.name || enemy.location_name || 'Enemy'
      })),
    ...(staticData.dungeons || [])
      .filter(dungeon => dungeon?.name)
      .map(dungeon => ({
        label: dungeon.name,
        type: 'Dungeon',
        href: `/dungeons?search=${encodeURIComponent(dungeon.name)}`,
        detail: dungeon.location?.name || dungeon.location_name || 'Dungeon'
      })),
    ...(staticData.world_bosses || [])
      .filter(boss => boss?.name)
      .map(boss => ({
        label: boss.name,
        type: 'Boss',
        href: `/bosses?search=${encodeURIComponent(boss.name)}`,
        detail: boss.location?.name || boss.location_name || 'World Boss'
      })),
    ...(worldLocationsPayload.locations || [])
      .filter(location => location?.name)
      .map(location => {
        const key = location.key || location.name;
        return {
          label: location.name,
          type: 'Location',
          href: `/map?location=${encodeURIComponent(key)}`,
          detail: 'World map'
        };
      })
  ];

  fs.writeFileSync(path.join(PUBLIC_DIR, 'usage-map.json'), JSON.stringify(usageMap, null, 2));
  fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex));
  fs.writeFileSync(path.join(PUBLIC_DIR, 'global-search-index.json'), JSON.stringify(globalSearchIndex));
  
  console.log('--- Zenith Relational Linker Finished ---');
  console.log(`Mapped ${Object.keys(usageMap).length} items.`);
  console.log(`Indexed ${searchIndex.length} items for search.`);
  console.log(`Indexed ${globalSearchIndex.length} global search entries.`);
}

rebuild();
