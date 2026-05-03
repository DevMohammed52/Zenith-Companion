import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded natively via --env-file=.env

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const API_DELAY_MS = 3100; // IdleMMO limit is 20 requests/min; 3.1s keeps us just under it.
const DATA_FILE = path.join(__dirname, 'public', 'market-data.json');
const STATIC_DATA_FILE = path.join(__dirname, 'public', 'static-data.json');

const ALCHEMY_ITEMS = {
    // Level 1-10
    "Battle Potion": {"materials": {"Lucky Rabbit Foot": 2}},
    "Lumberjack Essence Crystal": {"materials": {"Goblin Totem": 6}},
    "Miners Essence Crystal": {"materials": {"Ducks Mouth": 2}},
    "Anglers Essence Crystal": {"materials": {"Boar Tusk": 1}},
    "Smelting Essence Crystal": {"materials": {"Goblin Pouch": 3}},
    "Chefs Essence Crystal": {"materials": {"Goblin Scraps": 2}},
    "Dungeon Potion": {"materials": {"Goblin Crown": 1}},
    "Timberfall Essence Crystal": {"materials": {"Deer Antler": 5}},

    // Level 12-20
    "Rocksplitter Essence Crystal": {"materials": {"Cursed Talisman": 5}},
    "Deepsea Essence Crystal": {"materials": {"Ruined Robes": 10}},
    "Bastion Essence": {"materials": {"Boar Tusk": 2}},
    "Falcon's Grace Essence": {"materials": {"Snakes Head": 10}},
    "Galeforce Speed Essence": {"materials": {"Forbidden Tome": 2}},
    "Herculean Strength Essence": {"materials": {"Goblin Crown": 1}},
    "Hammerfell Essence Crystal": {"materials": {"Snakes Head": 12}},
    "Flavorburst Essence Crystal": {"materials": {"Snakes Head": 5, "Venom Extract": 1}},
    "Protection Potion": {"materials": {"Raw Onion": 13}},
    "Felling Essence Crystal": {"materials": {"Djinn's Bottle": 23}},

    // Level 25-30
    "Attack Power Potion": {"materials": {"Slime Extract": 20, "Raw Onion": 5}},
    "Merfolk Essence Crystal": {"materials": {"Chest of Scraps": 12}},
    "Precision Essence": {"materials": {"Bone Fragment": 30}},
    "Quickstep Essence": {"materials": {"Pirates Code": 4, "Chest of Scraps": 5}},
    "Fortified Essence": {"materials": {"Buffalo Horn": 8}},
    "Titan Power Essence": {"materials": {"Slime Extract": 38}},
    "Oreseeker Essence Crystal": {"materials": {"Swamp Juice": 12}},
    "Molten Core Essence Crystal": {"materials": {"Long Forgotten Necklace": 38}},
    "Vortex Brew": {"materials": {"Djinn's Bottle": 18, "Venom Extract": 1}},
    "Spicefinder Essence Crystal": {"materials": {"Umbral Claw": 11}},

    // Level 35-50
    "Bulwark Brew": {"materials": {"Goblin Scraps": 3, "Slime Extract": 20}},
    "Bladeburst Elixir": {"materials": {"Goblin Crown": 1, "Siren's Scales": 4}},
    "Ironclad Essence": {"materials": {"Goblin Totem": 12, "Goblin Crown": 1}},
    "Acrobatic's Essence": {"materials": {"Moose Antler": 10}},
    "Strike Essence": {"materials": {"Siren's Soulstone": 6}},
    "Impenetrable Essence": {"materials": {"Goblin Totem": 7, "Goblin Pouch": 9}},
    "Windrider Essence": {"materials": {"Elk Antler": 9}},
    "Dungeon Master's Tonic": {"materials": {"Lions Teeth": 11}},

    // Level 52-70
    "Yggdrasil Essence Crystal": {"materials": {"Goblin Crown": 1, "Bone Fragment": 20}},
    "Earthcore Essence Crystal": {"materials": {"Ivory": 6, "Parchment": 6}},
    "Riverbend Essence Crystal": {"materials": {"Polar Bear Pelt": 20, "Djinn's Bottle": 30}},
    "Tampering Essence Crystal": {"materials": {"Snakes Head": 30, "Golem Core Fragment": 25}},
    "Shieldbearer's Infusion": {"materials": {"Elk Antler": 9, "Siren's Soulstone": 8}},
    "Unyielding Fortitude": {"materials": {"Snakes Head": 15, "Enigmatic Stone": 15}},
    "Lightning Sprint": {"materials": {"Goblin Pouch": 15, "Broken Dwarven Plate": 7}},
    "Twinstrike Elixir": {"materials": {"Dwarven Whetstone": 35, "Cursed Blade Fragment": 25}},
    "Stoneheart Solution": {"materials": {"Raccoon Fur": 10, "Goblin Scraps": 10}},
    "Frenzy Potion": {"materials": {"Wolf Pelt": 14, "Goblin Totem": 60}},

    // Level 80-85
    "Dragonblood Tonic": {"materials": {"Minotaur Hide": 20, "Dragon Bone": 2}},
    "Gourmet Essence": {"materials": {"Snakes Head": 50, "Cursed Blade Fragment": 25}},
    "Wraithbane Essence": {"materials": {"Moose Antler": 15, "Minotaur Hide": 20}},
    "Thunderfury Brew": {"materials": {"Black Bear Pelt": 25, "Orb of Elemental Conjuring": 20}},
    "Cosmic Tear": {"materials": {"Harpy's Wings": 40, "Air Elemental Essence": 12}},
    "Titans Essence": {"materials": {"Fire Elemental Essence": 13, "Goblin Crown": 13}},
    "Cosmic Barrier": {"materials": {"Vial of Spectre Ectoplasm": 15, "Lions Teeth": 30}},
    "Divine Essence Crystal": {"materials": {"Void Essence": 13, "Pirates Code": 50}},
    "Potion of the Hunter": {"materials": {"Arcane Starstone": 7, "Goblin Scraps": 50}},
    "Essence of a Kraken": {"materials": {"Undying Crest": 12, "Goblin Scraps": 50}},
    "Guardian's Soul": {"materials": {"Petrifying Gaze Crystal": 5, "Broken Dwarven Plate": 25}},
    "Cosmic Finesse Essence": {"materials": {"Abyssal Scroll": 5, "Lions Teeth": 55}},
    "Cosmic Crystal": {"materials": {"Abyssal Scroll": 8, "Venom Extract": 20}},
    "Fallen Star Essence": {"materials": {"Basilisk Venom Vial": 3, "Raccoon Fur": 20}},
    "Flash Velocity Essence": {"materials": {"Oceanic Essence": 20, "Snakes Head": 20}},
    "Magma Vein Infusion": {"materials": {"Earth Elemental Essence": 6, "Goblin Crown": 15}},
    "Mjolnir's Essence Crystal": {"materials": {"Void Essence": 12, "Goblin Crown": 15}},
    "Neptune's Soul": {"materials": {"Water Elemental Essence": 45, "Snakes Head": 65}},
    "Omnipotent Might Essence": {"materials": {"Essence of Shadows": 10, "Swamp Juice": 50}},
    "Phoenix Ashes": {"materials": {"Chest of Scraps": 40, "Grimoire of Shadows": 2}},
    "Potion of the Gods": {"materials": {"Goblin Crown": 5, "Moonblood Tincture": 1}},
    "Primordial Timber Crystal": {"materials": {"Void Essence": 8, "Boar Tusk": 30}},
    "Titanwood Crystal": {"materials": {"Stoneheart Core": 6, "Elk Antler": 15, "Moonblood Tincture": 1}},
    "Dragon's Essence": {"materials": {"Ivory": 45, "Vial of Wraith Ectoplasm": 30}},
    "Eternal Feast Essence Crystal": {"materials": {"Goblin Totem": 100, "Arcane Starstone": 6}},
    "Cosmic Finesse Tonic": {"materials": {"Abyssal Scroll": 5, "Lions Teeth": 55}},
    "Eternal Feast Tonic": {"materials": {"Goblin Totem": 100, "Arcane Starstone": 6}},
    "Sun's Light": {"materials": {"Ruined Robes": 25, "Enigmatic Stone": 80}}
};

const IS_PRIORITY_ONLY = process.argv.includes('--priority');
const PRIORITY_FILE = path.join(__dirname, 'public', 'scraper-priority.json');

const itemsToFetch = new Set();
const itemLookupByName = new Map();

// 1. Always add Alchemy-related items (Highest priority)
for (const [potion, data] of Object.entries(ALCHEMY_ITEMS)) {
    itemsToFetch.add(potion);
    itemsToFetch.add(`Recipe: ${potion}`); // Add the recipe item itself
    for (const mat of Object.keys(data.materials)) {
        itemsToFetch.add(mat);
    }
}

// 2. Load static and priority data
function loadJson(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error reading ${path.basename(filePath)}:`, e.message);
        }
    }
    return null;
}

const staticData = loadJson(STATIC_DATA_FILE);
const priorityData = loadJson(PRIORITY_FILE);

async function safeWriteJson(filePath, data) {
    const tempFile = filePath + '.tmp';
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
            fs.renameSync(tempFile, filePath);
            return true;
        } catch (e) {
            attempts++;
            if (e.code === 'EPERM' || e.code === 'EBUSY') {
                // File is locked by another process (likely Next.js reading it)
                await sleep(100 * attempts);
                continue;
            }
            console.error(`Failed to write to ${path.basename(filePath)}:`, e.message);
            return false;
        }
    }
    return false;
}

// 3. Add drops from enemies/dungeons/bosses
if (staticData) {
    const addLootItems = (entityList) => {
        if (!entityList) return;
        for (const entity of entityList) {
            if (entity.loot && Array.isArray(entity.loot)) {
                for (const drop of entity.loot) {
                    // In priority mode, only add if it's in the priority list
                    if (!IS_PRIORITY_ONLY || priorityData?.high_priority_items?.includes(drop.name)) {
                        itemsToFetch.add(drop.name);
                    }
                }
            }
        }
    };
    addLootItems(staticData.enemies);
    addLootItems(staticData.dungeons);
    addLootItems(staticData.world_bosses);

    if (IS_PRIORITY_ONLY) {
        console.log(`Running in PRIORITY mode. Targeting ${itemsToFetch.size} velocity items.`);
    } else {
        console.log(`Running in FULL mode. Starting with ${itemsToFetch.size} gameplay-linked items.`);
    }
    console.log(`Added combat items to scrape list. Current total: ${itemsToFetch.size}`);
}

// 4. Load ALL items from global database to ensure 100% coverage
const ALL_ITEMS_DB_FILE = path.join(__dirname, 'public', 'all-items-db.json');

if (fs.existsSync(ALL_ITEMS_DB_FILE)) {
    try {
        const allItems = JSON.parse(fs.readFileSync(ALL_ITEMS_DB_FILE, 'utf8'));
        let addedCount = 0;
        for (const item of Object.values(allItems)) {
            const name = item.name;
            if (!name) continue;
            itemLookupByName.set(name.toLowerCase(), item);

            if (!IS_PRIORITY_ONLY || priorityData?.high_priority_items?.includes(name)) {
                if (!itemsToFetch.has(name)) {
                    itemsToFetch.add(name);
                    addedCount++;
                }
            }
        }
        console.log(`Added ${addedCount} items from global DB. Total items: ${itemsToFetch.size}`);
    } catch (e) {
        console.error("Error reading global items DB:", e.message);
    }
}

const STATUS_FILE = path.join(__dirname, 'public', 'scraper-status.json');
const itemsArray = Array.from(itemsToFetch);

const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "User-Agent": "IdleMMO-ZenithWeb/1.0",
    "Accept": "application/json"
};

let marketData = {};
if (fs.existsSync(DATA_FILE)) {
    try {
        marketData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        marketData = {};
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
let lastApiRequestAt = 0;

async function apiFetch(url, options = {}) {
    const elapsed = Date.now() - lastApiRequestAt;
    if (elapsed < API_DELAY_MS) {
        await sleep(API_DELAY_MS - elapsed);
    }
    lastApiRequestAt = Date.now();
    return fetch(url, options);
}

async function fetchLiveWorldBosses() {
    try {
        console.log("Fetching live world boss data...");
        const res = await apiFetch(`${BASE_URL}/combat/world_bosses/list`, { headers });
        if (!res.ok) {
            console.error(`Failed to fetch world bosses: ${res.status}`);
            return;
        }
        const data = await res.json();
        if (data && data.world_bosses) {
            const currentStatic = loadJson(STATIC_DATA_FILE);
            if (currentStatic) {
                // Update specific fields from API while preserving our augmented data
                const updatedBosses = currentStatic.world_bosses.map(boss => {
                    const live = data.world_bosses.find(lb => lb.id === boss.id || lb.name === boss.name);
                    if (live) {
                        return {
                            ...boss,
                            status: live.status,
                            battle_starts_at: live.battle_starts_at,
                            battle_ends_at: live.battle_ends_at,
                            // Optionally update level/location if they change
                            level: live.level || boss.level,
                            image_url: live.image_url || boss.image_url
                        };
                    }
                    return boss;
                });
                
                currentStatic.world_bosses = updatedBosses;
                await safeWriteJson(STATIC_DATA_FILE, currentStatic);
                console.log("World boss status & schedules updated from API.");
            }
        }
    } catch (e) {
        console.error("Error updating world bosses:", e.message);
    }
}

async function fetchItem(itemName) {
    try {
        let itemRecord = itemLookupByName.get(itemName.toLowerCase());

        if (!itemRecord?.hashed_id) {
            const searchRes = await apiFetch(`${BASE_URL}/item/search?query=${encodeURIComponent(itemName)}`, { headers });
            if (!searchRes.ok) return null;
            const searchData = await searchRes.json();
            if (!searchData.items || searchData.items.length === 0) return null;

            itemRecord = searchData.items.find(i => i.name.toLowerCase() === itemName.toLowerCase())
                || searchData.items.find(i => i.vendor_price > 0 || i.vendor_price === null);
            if (!itemRecord?.hashed_id) return null;
        }

        const histRes = await apiFetch(`${BASE_URL}/item/${itemRecord.hashed_id}/market-history?tier=0&type=listings`, { headers });
        if (!histRes.ok) return null;
        
        const histData = await histRes.json();
        const history = histData.history_data || [];
        if (history.length === 0) return null;

        const now = Date.now();
        const getAvg = (days) => {
            const cutoff = now - (days * 24 * 60 * 60 * 1000);
            const sales = history.filter(h => new Date(h.date).getTime() >= cutoff);
            if (sales.length === 0) return null;
            return sales.reduce((sum, h) => sum + h.average_price, 0) / sales.length;
        };

        const avg_3 = getAvg(3);
        const avg_7 = getAvg(7);
        const avg_14 = getAvg(14);
        const avg_30 = getAvg(30);

        const getVol = (days) => {
            const cutoff = now - (days * 24 * 60 * 60 * 1000);
            const sales = history.filter(h => new Date(h.date).getTime() >= cutoff);
            return sales.reduce((sum, h) => sum + (h.total_sold || 0), 0);
        };
        const vol_3 = getVol(3);
        
        let latest = history.reduce((latest, current) => new Date(current.date) > new Date(latest.date) ? current : latest, history[0]);
        let latest_price = latest.average_price;

        let a30 = avg_30 !== null ? avg_30 : latest_price;
        let a14 = avg_14 !== null ? avg_14 : a30;
        let a7 = avg_7 !== null ? avg_7 : a14;
        let a3 = avg_3 !== null ? avg_3 : a7;

        return {
            hashed_id: itemRecord.hashed_id,
            image_url: itemRecord.image_url,
            price: a3,
            avg_3: a3,
            avg_7: a7,
            avg_14: a14,
            avg_30: a30,
            vol_3: vol_3,
            vendor_price: itemRecord.vendor_price || 0,
            last_updated: new Date().toISOString()
        };
    } catch (e) {
        console.error(`Error fetching ${itemName}:`, e.message);
        return null;
    }
}

import { execSync } from 'child_process';

async function start() {
    if (!API_KEY) {
        console.log("No IDLEMMO_API_KEY provided in .env. Scraper paused.");
        return;
    }
    
    // Create public dir if missing
    const publicDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    while (true) {
        // Fetch live boss data at the start of each cycle
        await fetchLiveWorldBosses();

        for (let i = 0; i < itemsArray.length; i++) {
            const item = itemsArray[i];
            
            // Write status
            try {
                fs.writeFileSync(STATUS_FILE, JSON.stringify({
                    currentItem: item,
                    currentIndex: i + 1,
                    totalItems: itemsArray.length,
                    timestamp: new Date().toISOString()
                }));
            } catch(e) {}

            const data = await fetchItem(item);
            if (data) {
                marketData[item] = data;
                marketData["_meta"] = { currently_fetching: item, last_updated: new Date().toISOString() };
                
                // Batch save every 10 items or at the end
                if (i % 10 === 0 || i === itemsArray.length - 1) {
                    await safeWriteJson(DATA_FILE, marketData);
                }
            }
        }

        // --- RELATIONAL LINKER TRIGGER ---
        console.log("Full scrape cycle completed. Rebuilding usage map...");
        try {
            execSync('node scripts/rebuild-usage-map.mjs', { stdio: 'inherit' });
            console.log("Usage map rebuilt successfully.");
        } catch (e) {
            console.error("Failed to rebuild usage map:", e.message);
        }
        
        if (process.env.SCRAPE_ONCE === "true") {
            console.log("Process complete. Exiting.");
            process.exit(0);
        }

        console.log("Cycle finished. Restarting in 60s...");
        await sleep(60000);
    }
}

start();
