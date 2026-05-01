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

  // 2. Map ALL Recipes and Chests (from all-items-db.json)
  Object.values(allItemsDb).forEach(item => {
    // --- RECIPE LOGIC ---
    if (item.type === 'RECIPE' || item.recipe) {
      const isAlchemy = item.name?.toLowerCase().includes('essence') || item.name?.toLowerCase().includes('elixir') || item.name?.toLowerCase().includes('potion') || item.recipe?.skill === 'ALCHEMY';
      const isMythic = item.quality === 'MYTHIC';
      const isForge = item.recipe?.skill === 'FORGING' || item.name?.toLowerCase().includes('forging');
      
      let uses = 'Infinite';
      if (isForge) uses = 1;
      if (isAlchemy && isMythic) uses = 30;

      // Map what this recipe creates (if it's a recipe item)
      if (item.type === 'RECIPE') {
        const resultName = item.name
          .replace(/^Recipe:\s*/i, '')
          .replace(/\s*Recipe$/i, '')
          .replace(/\s*\(Untradable\)$/i, '')
          .trim();
          
        const entry = getEntry(item.name);
        entry.recipe_yield = {
          item_name: resultName,
          uses: uses
        };
      }

      // Map ingredients (Where-used)
      const recipeData = item.recipe;
      if (recipeData) {
        const skill = recipeData.skill || 'CRAFTING';
        const mats = recipeData.ingredients || recipeData.materials || [];
        mats.forEach(mat => {
          const mName = mat.item_name || mat.name;
          const entry = getEntry(mName);
          if (!entry.required_for.find(r => r.name === item.name)) {
            entry.required_for.push({
              type: skill.toUpperCase(),
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
      
      // Link chest back to dungeon if data exists
      if (item.where_to_find?.dungeons) {
        item.where_to_find.dungeons.forEach(d => {
          if (!entry.dropped_by.find(existing => existing.name === d.name)) {
            const realDungeon = staticData.dungeons?.find(rd => rd.name === d.name);
            entry.dropped_by.push({
              type: 'DUNGEON',
              name: d.name,
              chance: 'Unknown',
              location: realDungeon?.location?.name || d.name
            });
          }
        });
      }
    }

    // --- PRODUCES LOGIC (Reverse Recipe) ---
    if (item.recipe && (item.recipe.ingredients || item.recipe.materials)) {
      let resultName = item.recipe.result?.item_name;
      
      if (!resultName) {
        // If no explicit result, and it's a blueprint-style item, the result is the item name without suffixes
        resultName = item.name
          .replace(/^Recipe:\s*/i, '')
          .replace(/\s*Recipe$/i, '')
          .replace(/\s*\(Untradable\)$/i, '')
          .trim();
      }

      if (resultName) {
        const entry = getEntry(resultName);
        const mats = item.recipe.ingredients || item.recipe.materials || [];
        entry.produced_from = {
          skill: item.recipe.skill || 'CRAFTING',
          level: item.recipe.level_required || item.recipe.level || 1,
          recipe_name: item.name, // Store the blueprint name explicitly
          mats: mats.map(m => ({
            name: m.item_name || m.name,
            amount: m.quantity || m.amount || 1
          }))
        };
      }
    }
  });

  fs.writeFileSync(path.join(PUBLIC_DIR, 'usage-map.json'), JSON.stringify(usageMap, null, 2));
  console.log('--- Zenith Relational Linker Finished ---');
  console.log(`Mapped ${Object.keys(usageMap).length} items.`);
}

rebuild();
