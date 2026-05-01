/**
 * process-db.mjs
 * 
 * Transforms raw all-items-db.json into optimized, relational structures.
 * 1. items-map.json: Instant lookup by hashed_id.
 * 2. search-index.json: Minified data for fast fuzzy search.
 * 3. usage-map.json: Tracks what materials are used in which recipes.
 * 4. scraper-priority.json: Defines Tier 1 items for frequent updates.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'public');
const RAW_FILE = path.join(DATA_DIR, 'all-items-db.json');

// Priority types that always get updated frequently
const PRIORITY_TYPES = [
    "MATERIAL", "CONSUMABLE", "FOOD", "POTION", "ESSENCE_CRYSTAL", 
    "LOG", "FISH", "ORE", "METAL_BAR", "CONSTRUCTION_MATERIAL", 
    "UPGRADE_STONE", "CHEST"
];

function processDb() {
    if (!fs.existsSync(RAW_FILE)) {
        console.error("Error: public/all-items-db.json not found!");
        return;
    }

    console.log("Processing Item Database...");
    const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
    
    // Ensure we handle both array and object formats
    const items = Array.isArray(rawData) ? rawData : Object.values(rawData);
    
    const itemsMap = {};
    const searchIndex = [];
    const usageMap = {}; // material_name -> [result_names]
    const priorityItems = new Set();

    items.forEach(item => {
        if (!item.hashed_id) return;

        // 1. Build Items Map
        itemsMap[item.hashed_id] = item;

        // 2. Build Search Index (Minified)
        searchIndex.push({
            id: item.hashed_id,
            name: item.name,
            type: item.type,
            quality: item.quality,
            image: item.image_url
        });

        // 3. Build Usage Map & Identify Materials
        if (item.recipe && item.recipe.ingredients) {
            item.recipe.ingredients.forEach(ing => {
                const materialName = ing.name;
                if (!usageMap[materialName]) usageMap[materialName] = [];
                if (!usageMap[materialName].includes(item.name)) {
                    usageMap[materialName].push(item.name);
                }
                // If it's used in a recipe, it's a priority item!
                priorityItems.add(materialName);
            });
        }

        // 4. Add items based on Priority Types
        if (PRIORITY_TYPES.includes(item.type)) {
            priorityItems.add(item.name);
        }
    });

    // Finalize Usage Map sorting
    Object.keys(usageMap).forEach(key => {
        usageMap[key].sort();
    });

    // Save optimized files
    fs.writeFileSync(path.join(DATA_DIR, 'items-map.json'), JSON.stringify(itemsMap));
    fs.writeFileSync(path.join(DATA_DIR, 'search-index.json'), JSON.stringify(searchIndex));
    fs.writeFileSync(path.join(DATA_DIR, 'usage-map.json'), JSON.stringify(usageMap, null, 2));
    
    // Save Scraper Priority List (as array of names)
    const priorityList = Array.from(priorityItems).sort();
    fs.writeFileSync(path.join(DATA_DIR, 'scraper-priority.json'), JSON.stringify({
        high_priority_items: priorityList,
        total_priority: priorityList.length,
        last_updated: new Date().toISOString()
    }, null, 2));

    console.log("\nDatabase Processing Complete!");
    console.log(`Total Items: ${items.length}`);
    console.log(`Priority Items identified: ${priorityList.length}`);
    console.log(`Optimized files saved to: ${DATA_DIR}`);
}

processDb();
