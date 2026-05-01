import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function rebuild() {
  console.log('--- Zenith Relational Linker Started ---');
  
  // Load ALL data sources
  const staticData = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'static-data.json'), 'utf8'));
  const itemsMap = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'items-map.json'), 'utf8'));
  const allItemsDb = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'all-items-db.json'), 'utf8'));
  
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
            entry.dropped_by.push({
              type,
              name: entity.name,
              chance: drop.chance,
              location: entity.location?.name || 'Unknown'
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
    // --- RECIPE LOGIC ---
    // We check item.recipe (for actual crafting data) 
    // OR item.type === 'RECIPE' (for blueprint items)
    if (item.recipe || item.type === 'RECIPE') {
      const isAlchemy = item.recipe?.skill === 'ALCHEMY' || item.name?.toLowerCase().includes('essence') || item.name?.toLowerCase().includes('elixir');
      const isMythic = item.quality === 'MYTHIC';
      const isForge = item.recipe?.skill === 'FORGING';
      
      let uses = 'Infinite';
      if (isForge) uses = 1;
      if (isAlchemy && isMythic) uses = 30;

      // Determine the Product Name (Tradeable version preferred)
      let resultName = item.recipe?.result?.item_name || item.name
        .replace(/^Recipe:\s*/i, '')
        .replace(/\s*Recipe$/i, '')
        .replace(/\s*\(Untradable\)$/i, '')
        .trim();

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
        
        productEntry.produced_from = {
          skill: item.recipe.skill || 'CRAFTING',
          level: item.recipe.level_required || item.recipe.level || 1,
          recipe_name: item.name, // Link back to THIS specific blueprint
          mats: mats.map(m => ({
            name: m.item_name || m.name,
            amount: m.quantity || m.amount || 1
          }))
        };

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

  fs.writeFileSync(path.join(PUBLIC_DIR, 'usage-map.json'), JSON.stringify(usageMap, null, 2));
  console.log('--- Zenith Relational Linker Finished ---');
  console.log(`Mapped ${Object.keys(usageMap).length} items.`);
}

rebuild();
