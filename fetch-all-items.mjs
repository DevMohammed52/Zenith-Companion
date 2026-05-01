/**
 * fetch-all-items.mjs
 * 
 * PHASE 1: Discover all item IDs via paginated search (by type).
 * PHASE 2: Fetch deep details for every item via the /inspect endpoint.
 * 
 * This creates a comprehensive local database with recipes, stats, and drop info.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const OUT_FILE = path.join(__dirname, 'public', 'all-items-db.json');

// Comprehensive list of item types from game database categories
const ITEM_TYPES = [
    // Armor & Gear
    "HELMET", "CHESTPLATE", "GAUNTLETS", "GREAVES", "BOOTS", "SPECIAL", "SHIELD",
    // Weapons
    "SWORD", "DAGGER", "BOW", "WEAPON", "GEAR",
    // Tools
    "FISHING_ROD", "PICKAXE", "FELLING_AXE", "TOOL",
    // Resources
    "LOG", "FISH", "ORE", "METAL_BAR", "CAMPAIGN_ITEM", "CONSTRUCTION_MATERIAL", "MATERIAL",
    // Consumables
    "FOOD", "POTION", "ESSENCE_CRYSTAL", "CAKE", "CONSUMABLE",
    // Drops & Special
    "CRAFTING_MATERIAL", "PET_EGG", "RECIPE", "COLLECTABLE", "UPGRADE_STONE", "CHEST",
    // Shop & Misc
    "MEMBERSHIP", "TOKEN", "VIAL", "EMPTY_CRYSTAL", "BAIT", "METAMORPHITE", "NAMESTONE", 
    "BLANK_SCROLL", "RELIC", "GUIDANCE_SCROLL", "TELEPORTATION_STONE", "GEMSTONE", "MISC"
];

if (!API_KEY) {
    console.error("Error: IDLEMMO_API_KEY not found in .env");
    process.exit(1);
}

const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "User-Agent": "Zenith-Deep-Fetch/1.0",
    "Accept": "application/json"
};

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function deepFetch() {
    let masterDb = {};
    
    // Load existing data if available to resume
    if (fs.existsSync(OUT_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
            if (Array.isArray(existing)) {
                // Convert old array format to object for easier lookup
                existing.forEach(item => { if (item.hashed_id) masterDb[item.hashed_id] = item; });
            } else {
                masterDb = existing;
            }
            console.log(`Loaded existing database with ${Object.keys(masterDb).length} items.`);
        } catch (e) {
            console.warn("Could not parse existing DB, starting fresh.");
        }
    }

    console.log("Step 1: Discovering all item IDs via Search...");

    for (const type of ITEM_TYPES) {
        let page = 1;
        let lastPage = 1;
        console.log(`Searching type: ${type}...`);

        do {
            try {
                // Guaranteed gap before request
                await sleep(4000); 

                const res = await fetch(`${BASE_URL}/item/search?type=${type}&page=${page}`, { headers });
                
                if (!res.ok) {
                    if (res.status === 429) {
                        console.warn("Rate limited. Waiting 60 seconds to clear window...");
                        await sleep(60000);
                        continue;
                    }
                    console.error(`Search failed for ${type} page ${page}: ${res.status}`);
                    break;
                }

                const data = await res.json();
                const items = data.items || [];
                
                items.forEach(item => {
                    if (!masterDb[item.hashed_id]) {
                        masterDb[item.hashed_id] = { ...item, _is_detailed: false };
                    }
                });

                lastPage = data.pagination.last_page;
                console.log(`   ✅ ${type}: Page ${page}/${lastPage} processed.`);
                page++;

            } catch (err) {
                console.error(`❌ Error during search: ${err.message}`);
                break;
            }
        } while (page <= lastPage);
    }

    const totalFound = Object.keys(masterDb).length;
    console.log(`\nDiscovery complete. Found ${totalFound} unique items.`);
    console.log("Step 2: Fetching Deep Details (Recipes, Stats, Locations)...");

    let count = 0;
    const idsToInspect = Object.keys(masterDb).filter(id => !masterDb[id]._is_detailed);

    if (idsToInspect.length === 0) {
        console.log("All items are already detailed!");
    }

    for (const id of idsToInspect) {
        count++;
        const item = masterDb[id];
        
        try {
            // Hardcore gap before each inspect call
            await sleep(4000); 

            console.log(`[${count}/${idsToInspect.length}] Inspecting: ${item.name}...`);
            const res = await fetch(`${BASE_URL}/item/${id}/inspect`, { headers });

            if (!res.ok) {
                if (res.status === 429) {
                    console.warn("Rate limited. Waiting 60 seconds...");
                    await sleep(60000);
                    // Retry this item
                    const retryRes = await fetch(`${BASE_URL}/item/${id}/inspect`, { headers });
                    if (!retryRes.ok) continue;
                    const detailedData = await retryRes.json();
                    masterDb[id] = { ...item, ...detailedData.item, _is_detailed: true };
                } else {
                    console.error(`   Failed to inspect ${item.name}: ${res.status}`);
                    continue;
                }
            } else {
                const detailedData = await res.json();
                // Merge detailed data into our master record
                masterDb[id] = { 
                    ...item, 
                    ...detailedData.item, 
                    _is_detailed: true,
                    _last_detailed_at: new Date().toISOString()
                };
            }

            // Save progress every 20 items
            if (count % 20 === 0) {
                fs.writeFileSync(OUT_FILE, JSON.stringify(masterDb, null, 2));
                console.log(`   💾 Progress saved (${count} items detailed).`);
            }

        } catch (err) {
            console.error(`   ❌ Network error for ${item.name}: ${err.message}`);
        }
    }

    // Final save
    fs.writeFileSync(OUT_FILE, JSON.stringify(masterDb, null, 2));
    console.log("\nDeep Fetch Complete!");
    console.log(`Final database contains ${Object.keys(masterDb).length} detailed items.`);
    console.log(`Saved to: ${OUT_FILE}`);
}

deepFetch();
