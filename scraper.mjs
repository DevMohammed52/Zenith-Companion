import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded natively via --env-file=.env

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const API_DELAY_MS = Number(process.env.IDLEMMO_API_DELAY_MS || 1050); // IdleMMO limit is 60 requests/min for this key; 1.05s keeps us just under it.
const SCRAPE_INTERVAL_MS = Number(process.env.SCRAPE_INTERVAL_MS || 6 * 60 * 60 * 1000);
const DATA_FILE = path.join(__dirname, 'public', 'market-data.json');
const STATIC_DATA_FILE = path.join(__dirname, 'public', 'static-data.json');
const PET_DATABASE_FILE = path.join(__dirname, 'public', 'pet-database.json');
const WORLD_LOCATIONS_FILE = path.join(__dirname, 'public', 'world-locations.json');
const MARKET_SPIKE_MULTIPLIER = 5;
const MARKET_SPIKE_MIN_DELTA = 100;

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
const IS_PETS_ONLY = process.argv.includes('--pets-only');
const IS_WORLD_LOCATIONS_ONLY = process.argv.includes('--world-locations-only');
const IS_SCRAPE_ONCE = process.env.SCRAPE_ONCE === "true" || process.argv.includes('--once');
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
if (!IS_PETS_ONLY && !IS_WORLD_LOCATIONS_ONLY && staticData) {
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

if (!IS_PETS_ONLY && !IS_WORLD_LOCATIONS_ONLY && fs.existsSync(ALL_ITEMS_DB_FILE)) {
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

function getRetryDelayMs(response) {
    const retryAfter = response.headers.get("retry-after");
    if (!retryAfter) return API_DELAY_MS * 2;

    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(seconds * 1000, API_DELAY_MS);

    const retryDate = new Date(retryAfter).getTime();
    if (Number.isFinite(retryDate)) return Math.max(retryDate - Date.now(), API_DELAY_MS);

    return API_DELAY_MS * 2;
}

function asPositiveNumber(value) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function median(values) {
    const clean = values.map(asPositiveNumber).filter(value => value > 0).sort((a, b) => a - b);
    if (clean.length === 0) return 0;
    const mid = Math.floor(clean.length / 2);
    return clean.length % 2 === 0 ? (clean[mid - 1] + clean[mid]) / 2 : clean[mid];
}

function asNonNegativeNumber(value) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function averageIncludingZero(values) {
    const clean = values.map(asNonNegativeNumber);
    if (clean.length === 0) return 0;
    return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function medianIncludingZero(values) {
    const clean = values.map(asNonNegativeNumber).sort((a, b) => a - b);
    if (clean.length === 0) return 0;
    const mid = Math.floor(clean.length / 2);
    return clean.length % 2 === 0 ? (clean[mid - 1] + clean[mid]) / 2 : clean[mid];
}

function trimmedAverageIncludingZero(values, trimPercent = 0.1) {
    const clean = values.map(asNonNegativeNumber).sort((a, b) => a - b);
    if (clean.length === 0) return 0;
    const trimCount = Math.floor(clean.length * trimPercent);
    const trimmed = clean.length - (trimCount * 2) >= 3
        ? clean.slice(trimCount, clean.length - trimCount)
        : clean;
    return averageIncludingZero(trimmed);
}

function weightedAverage(rows) {
    let totalValue = 0;
    let totalSold = 0;
    for (const row of rows) {
        const price = asPositiveNumber(row.average_price);
        const sold = asPositiveNumber(row.total_sold);
        if (price <= 0) continue;
        if (sold > 0) {
            totalValue += price * sold;
            totalSold += sold;
        }
    }
    if (totalSold > 0) return totalValue / totalSold;
    return median(rows.map(row => row.average_price));
}

function recentRows(history, days) {
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    return history.filter(h => new Date(h.date).getTime() >= cutoff);
}

function isMarketSpike(value, anchor) {
    return value > 0
        && anchor > 0
        && value >= anchor * MARKET_SPIKE_MULTIPLIER
        && value - anchor >= MARKET_SPIKE_MIN_DELTA;
}

function latestSoldMedian(latestSold) {
    return median((latestSold || []).slice(0, 10).map(sale => sale.price_per_item));
}

function latestSoldPriceStats(latestSold) {
    const prices = (latestSold || [])
        .slice(0, 20)
        .map(sale => asPositiveNumber(sale.price_per_item))
        .filter(price => price > 0);

    if (prices.length === 0) {
        return {
            sampleSize: 0,
            min: null,
            max: null,
            median: null,
            spreadRatio: 0,
        };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
        sampleSize: prices.length,
        min,
        max,
        median: median(prices),
        spreadRatio: min > 0 ? max / min : 0,
    };
}

function buildLiquidityMetrics(history) {
    const getVolume = (days) => {
        const sales = recentRows(history, days);
        return sales.reduce((sum, row) => sum + asNonNegativeNumber(row.total_sold), 0);
    };
    const rows30 = recentRows(history, 30);
    const soldByDay = rows30.map(row => asNonNegativeNumber(row.total_sold));
    const dailyAverage30 = averageIncludingZero(soldByDay);
    const dailyMedian30 = medianIncludingZero(soldByDay);
    const dailyTrimmedAverage30 = trimmedAverageIncludingZero(soldByDay);
    const dailyMax30 = soldByDay.length > 0 ? Math.max(...soldByDay) : 0;
    const stableDaily = dailyTrimmedAverage30 || dailyMedian30 || dailyAverage30;
    const spikeRatio = stableDaily > 0 && dailyMax30 > 0 ? dailyMax30 / stableDaily : 0;
    const outlierFloor = stableDaily + Math.max(25, stableDaily);
    const outlierDays30 = stableDaily > 0
        ? soldByDay.filter(value => value >= Math.max(stableDaily * 3, outlierFloor)).length
        : 0;

    return {
        vol3: getVolume(3),
        vol7: getVolume(7),
        vol30: getVolume(30),
        stableVol3: Math.round(stableDaily * 3),
        dailyAverage30,
        dailyTrimmedAverage30,
        dailyMedian30,
        dailyMax30,
        salesSpikeRatio: spikeRatio,
        salesOutlierDays30: outlierDays30,
    };
}

function buildSafeMarketAverages(history, latestSold) {
    const latestSaleStats = latestSoldPriceStats(latestSold);
    const recentSaleAnchor = latestSaleStats.median || latestSoldMedian(latestSold);
    const allDailyMedian = median(history.map(row => row.average_price));

    const averageForDays = (days) => {
        const rows = recentRows(history, days);
        if (rows.length === 0) return { raw: null, safe: null, removed: 0 };

        const raw = weightedAverage(rows);
        const windowMedian = median(rows.map(row => row.average_price));
        const anchor = median([recentSaleAnchor, windowMedian, allDailyMedian].filter(value => value > 0));
        const safeRows = anchor > 0
            ? rows.filter(row => !isMarketSpike(asPositiveNumber(row.average_price), anchor))
            : rows;
        const safe = safeRows.length > 0 ? weightedAverage(safeRows) : anchor || raw;

        return {
            raw,
            safe,
            removed: rows.length - safeRows.length,
        };
    };

    const avg3 = averageForDays(3);
    const avg7 = averageForDays(7);
    const avg14 = averageForDays(14);
    const avg30 = averageForDays(30);
    const rawPrice = avg3.raw ?? avg7.raw ?? avg14.raw ?? avg30.raw ?? 0;
    const safePrice = avg3.safe ?? avg7.safe ?? avg14.safe ?? avg30.safe ?? rawPrice;
    const adjusted = rawPrice > 0 && safePrice > 0 && Math.abs(rawPrice - safePrice) > 1;

    return {
        safePrice,
        rawPrice,
        avg3,
        avg7,
        avg14,
        avg30,
        adjusted,
        removedRows: avg3.removed + avg7.removed + avg14.removed + avg30.removed,
        latestSaleMedian: recentSaleAnchor || null,
        latestSaleMin: latestSaleStats.min,
        latestSaleMax: latestSaleStats.max,
        latestSaleSpreadRatio: latestSaleStats.spreadRatio,
        latestSaleSampleSize: latestSaleStats.sampleSize,
    };
}

async function apiFetch(url, options = {}, attempt = 0) {
    const elapsed = Date.now() - lastApiRequestAt;
    if (elapsed < API_DELAY_MS) {
        await sleep(API_DELAY_MS - elapsed);
    }
    lastApiRequestAt = Date.now();

    const response = await fetch(url, options);
    if (response.status === 429 && attempt < 4) {
        const delayMs = getRetryDelayMs(response);
        console.warn(`Rate limited by API. Retrying in ${formatDuration(delayMs)}...`);
        await sleep(delayMs);
        return apiFetch(url, options, attempt + 1);
    }

    return response;
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
                const liveBossKeys = new Set(data.world_bosses.map(boss => boss.id || boss.name).filter(Boolean));
                // Update specific fields from API while preserving our augmented data
                const seenBossKeys = new Set();
                const updatedBosses = currentStatic.world_bosses
                    .filter(boss => boss._source !== "live_world_boss_api" || liveBossKeys.has(boss.id || boss.name))
                    .map(boss => {
                    const live = data.world_bosses.find(lb => lb.id === boss.id || lb.name === boss.name);
                    if (live) {
                        seenBossKeys.add(live.id || live.name);
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

                for (const live of data.world_bosses) {
                    const key = live.id || live.name;
                    if (!key || seenBossKeys.has(key)) continue;
                    updatedBosses.push({
                        ...live,
                        loot: live.loot || [],
                        _source: "live_world_boss_api"
                    });
                }
                
                currentStatic.world_bosses = updatedBosses;
                await safeWriteJson(STATIC_DATA_FILE, currentStatic);
                console.log("World boss status & schedules updated from API.");
            }
        }
    } catch (e) {
        console.error("Error updating world bosses:", e.message);
    }
}

async function fetchLiveEnemies() {
    try {
        console.log("Fetching live enemy data...");
        const res = await apiFetch(`${BASE_URL}/combat/enemies/list`, { headers });
        if (!res.ok) {
            console.error(`Failed to fetch enemies: ${res.status}`);
            return;
        }

        const data = await res.json();
        if (data && data.enemies) {
            const currentStatic = loadJson(STATIC_DATA_FILE);
            if (!currentStatic) return;

            const liveEnemyKeys = new Set(data.enemies.map(enemy => enemy.id || enemy.name).filter(Boolean));
            const seenEnemyKeys = new Set();
            const updatedEnemies = currentStatic.enemies
                .filter(enemy => enemy._source !== "live_enemies_api" || liveEnemyKeys.has(enemy.id || enemy.name))
                .map(enemy => {
                    const live = data.enemies.find(le => le.id === enemy.id || le.name === enemy.name);
                    if (!live) return enemy;

                    seenEnemyKeys.add(live.id || live.name);
                    return {
                        ...enemy,
                        ...live,
                        loot: live.loot || enemy.loot || [],
                    };
                });

            for (const live of data.enemies) {
                const key = live.id || live.name;
                if (!key || seenEnemyKeys.has(key)) continue;
                updatedEnemies.push({
                    ...live,
                    loot: live.loot || [],
                    _source: "live_enemies_api"
                });
            }

            currentStatic.enemies = updatedEnemies;
            await safeWriteJson(STATIC_DATA_FILE, currentStatic);
            console.log("Enemy data updated from API.");
        }
    } catch (e) {
        console.error("Error updating enemies:", e.message);
    }
}

function collectLootItemNames(staticDataSnapshot) {
    const names = new Set();
    const addLootItems = (entityList) => {
        if (!entityList) return;
        for (const entity of entityList) {
            if (!Array.isArray(entity.loot)) continue;
            for (const drop of entity.loot) {
                if (drop?.name) names.add(drop.name);
            }
        }
    };

    addLootItems(staticDataSnapshot?.enemies);
    addLootItems(staticDataSnapshot?.dungeons);
    addLootItems(staticDataSnapshot?.world_bosses);
    return names;
}

function mergeLiveCollection(currentItems = [], liveItems = [], sourceLabel) {
    const liveKeys = new Set(liveItems.map(item => item.id || item.name).filter(Boolean));
    const seenKeys = new Set();
    const updatedItems = currentItems
        .filter(item => item._source !== sourceLabel || liveKeys.has(item.id || item.name))
        .map(item => {
            const live = liveItems.find(liveItem => liveItem.id === item.id || liveItem.name === item.name);
            if (!live) return item;

            seenKeys.add(live.id || live.name);
            return {
                ...item,
                ...live,
                loot: live.loot || item.loot || [],
            };
        });

    for (const live of liveItems) {
        const key = live.id || live.name;
        if (!key || seenKeys.has(key)) continue;
        updatedItems.push({
            ...live,
            loot: live.loot || [],
            _source: sourceLabel,
        });
    }

    return updatedItems;
}

function normalizeQuality(value) {
    if (!value) return "UNKNOWN";
    return String(value).trim().toUpperCase();
}

function medianNumber(values) {
    const sorted = values.filter(value => Number.isFinite(value)).sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function compactCompanionListing(listing) {
    return {
        level: listing.pet?.level ?? null,
        quality: normalizeQuality(listing.pet?.quality),
        price: Number(listing.cost?.amount || 0),
    };
}

function summarizeCompanionExchange(listings) {
    const summaryByPet = new Map();
    const listingsByPet = new Map();

    for (const listing of listings) {
        const petName = listing.pet?.name;
        const price = Number(listing.cost?.amount || 0);
        if (!petName || !Number.isFinite(price) || price <= 0) continue;

        const quality = normalizeQuality(listing.pet?.quality);
        const summary = summaryByPet.get(petName) || {
            petId: listing.pet?.pet_id ?? null,
            listingCount: 0,
            minPrice: price,
            maxPrice: price,
            totalPrice: 0,
            byQuality: {},
        };

        summary.petId = summary.petId ?? listing.pet?.pet_id ?? null;
        summary.listingCount += 1;
        summary.minPrice = Math.min(summary.minPrice, price);
        summary.maxPrice = Math.max(summary.maxPrice, price);
        summary.totalPrice += price;

        const qualitySummary = summary.byQuality[quality] || {
            count: 0,
            min_price: price,
            max_price: price,
            total_price: 0,
            average_price: 0,
        };
        qualitySummary.count += 1;
        qualitySummary.min_price = Math.min(qualitySummary.min_price, price);
        qualitySummary.max_price = Math.max(qualitySummary.max_price, price);
        qualitySummary.total_price += price;
        qualitySummary.average_price = Math.round(qualitySummary.total_price / qualitySummary.count);
        summary.byQuality[quality] = qualitySummary;

        const compactListings = listingsByPet.get(petName) || [];
        compactListings.push(compactCompanionListing(listing));
        listingsByPet.set(petName, compactListings);
        summaryByPet.set(petName, summary);
    }

    for (const summary of summaryByPet.values()) {
        summary.averagePrice = Math.round(summary.totalPrice / summary.listingCount);
        delete summary.totalPrice;
    }

    for (const petListings of listingsByPet.values()) {
        petListings.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    return { summaryByPet, listingsByPet };
}

function buildPetExchangeBlock(petName, summaryByPet, listingsByPet) {
    const summary = summaryByPet.get(petName);
    if (!summary) return null;

    const petListings = listingsByPet.get(petName) || [];
    const prices = petListings.map(listing => listing.price);
    return {
        ...summary,
        medianPrice: medianNumber(prices),
        sampleListings: petListings.slice(0, 12),
    };
}

async function fetchCompanionExchangeListings() {
    const listings = [];
    let page = 1;
    let hasMore = true;

    console.log("Fetching companion exchange listings...");

    while (hasMore) {
        const res = await apiFetch(`${BASE_URL}/pets/companion-exchange/listings?page=${page}`, { headers });
        if (!res.ok) {
            console.error(`Failed to fetch companion exchange page ${page}: ${res.status}`);
            return null;
        }

        const data = await res.json();
        const pageListings = Array.isArray(data.listings) ? data.listings : [];
        listings.push(...pageListings.map(listing => ({ ...listing, source_page: page })));

        const pagination = data.pagination || {};
        hasMore = Boolean(pagination.has_more);
        page = Number(pagination.next_page || page + 1);

        console.log(`Companion exchange: fetched ${listings.length} listings so far.`);
    }

    return {
        fetchedAt: new Date().toISOString(),
        listings,
        pageCount: Math.max(0, page - 1),
    };
}

async function updatePetDatabaseExchange() {
    try {
        if (!fs.existsSync(PET_DATABASE_FILE)) {
            console.log("No pet database file found. Skipping companion exchange merge.");
            return;
        }

        const exchange = await fetchCompanionExchangeListings();
        if (!exchange) return;

        const petDatabase = loadJson(PET_DATABASE_FILE);
        if (!petDatabase || !Array.isArray(petDatabase.pets)) return;

        const { summaryByPet, listingsByPet } = summarizeCompanionExchange(exchange.listings);
        petDatabase.pets = petDatabase.pets.map(pet => ({
            ...pet,
            exchange: buildPetExchangeBlock(pet.name, summaryByPet, listingsByPet),
        }));

        petDatabase.meta = petDatabase.meta || {};
        petDatabase.meta.generatedAt = new Date().toISOString();
        petDatabase.meta.counts = {
            ...(petDatabase.meta.counts || {}),
            pets: petDatabase.pets.length,
            petsWithStats: petDatabase.pets.filter(pet => pet.stats).length,
            petsWithEggs: petDatabase.pets.filter(pet => pet.egg).length,
            petsWithExchangeListings: petDatabase.pets.filter(pet => pet.exchange?.listingCount).length,
            exchangeListings: exchange.listings.length,
            exchangeSpecies: summaryByPet.size,
        };

        petDatabase.exchange = {
            ...(petDatabase.exchange || {}),
            fetchedAt: exchange.fetchedAt,
            listingCount: exchange.listings.length,
            speciesCount: summaryByPet.size,
            pageCount: exchange.pageCount,
        };

        await safeWriteJson(PET_DATABASE_FILE, petDatabase);
        console.log(`Pet database exchange data updated: ${exchange.listings.length} listings across ${summaryByPet.size} pets.`);
    } catch (e) {
        console.error("Error updating pet database exchange data:", e.message);
    }
}

async function fetchLiveDungeons() {
    try {
        console.log("Fetching live dungeon data...");
        const res = await apiFetch(`${BASE_URL}/combat/dungeons/list`, { headers });
        if (!res.ok) {
            console.error(`Failed to fetch dungeons: ${res.status}`);
            return;
        }

        const data = await res.json();
        if (data && data.dungeons) {
            const currentStatic = loadJson(STATIC_DATA_FILE);
            if (!currentStatic) return;

            currentStatic.dungeons = mergeLiveCollection(
                currentStatic.dungeons || [],
                data.dungeons,
                "live_dungeons_api",
            );
            await safeWriteJson(STATIC_DATA_FILE, currentStatic);
            console.log("Dungeon data updated from API.");
        }
    } catch (e) {
        console.error("Error updating dungeons:", e.message);
    }
}

function normalizeWorldLocationPayload(payload) {
    const locations = Array.isArray(payload?.locations)
        ? payload.locations.map(location => ({
            id: location.id,
            name: location.name,
            key: location.key,
            description: location.description ?? null,
            image_url: location.image_url ?? null,
            x: Number(location.x),
            y: Number(location.y),
            forecast: Array.isArray(location.forecast) ? location.forecast : [],
        }))
        : [];

    return {
        _meta: {
            source: "/v1/world/locations/list",
            fetched_at: new Date().toISOString(),
            endpoint_updates_at: payload?.endpoint_updates_at ?? null,
            location_count: locations.length,
        },
        endpoint_updates_at: payload?.endpoint_updates_at ?? null,
        locations,
    };
}

async function fetchWorldLocations() {
    try {
        console.log("Fetching world location data...");
        const res = await apiFetch(`${BASE_URL}/world/locations/list`, { headers });
        if (!res.ok) {
            console.error(`Failed to fetch world locations: ${res.status}`);
            return false;
        }

        const data = await res.json();
        const normalized = normalizeWorldLocationPayload(data);
        await safeWriteJson(WORLD_LOCATIONS_FILE, normalized);
        console.log(`World locations updated: ${normalized.locations.length} locations.`);
        return true;
    } catch (e) {
        console.error("Error updating world locations:", e.message);
        return false;
    }
}

function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

async function fetchItem(itemName, cycleHistoryCache) {
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

        if (cycleHistoryCache.has(itemRecord.hashed_id)) {
            return cycleHistoryCache.get(itemRecord.hashed_id);
        }

        const histRes = await apiFetch(`${BASE_URL}/item/${itemRecord.hashed_id}/market-history?tier=0&type=listings`, { headers });
        if (!histRes.ok) return null;
        
        const histData = await histRes.json();
        const history = histData.history_data || [];
        if (history.length === 0) return null;

        const safeMarket = buildSafeMarketAverages(history, histData.latest_sold || []);
        const liquidity = buildLiquidityMetrics(history);
        
        let latest = history.reduce((latest, current) => new Date(current.date) > new Date(latest.date) ? current : latest, history[0]);
        let latest_price = latest.average_price;

        let a30 = safeMarket.avg30.safe !== null ? safeMarket.avg30.safe : latest_price;
        let a14 = safeMarket.avg14.safe !== null ? safeMarket.avg14.safe : a30;
        let a7 = safeMarket.avg7.safe !== null ? safeMarket.avg7.safe : a14;
        let a3 = safeMarket.avg3.safe !== null ? safeMarket.avg3.safe : a7;

        const result = {
            hashed_id: itemRecord.hashed_id,
            image_url: itemRecord.image_url,
            price: a3,
            safe_price: a3,
            avg_3: a3,
            avg_7: a7,
            avg_14: a14,
            avg_30: a30,
            raw_price: safeMarket.rawPrice,
            raw_avg_3: safeMarket.avg3.raw,
            raw_avg_7: safeMarket.avg7.raw,
            raw_avg_14: safeMarket.avg14.raw,
            raw_avg_30: safeMarket.avg30.raw,
            price_adjusted: safeMarket.adjusted,
            price_warning: safeMarket.adjusted ? "Recent market spike filtered" : undefined,
            price_outlier_rows: safeMarket.removedRows,
            latest_sale_median: safeMarket.latestSaleMedian,
            latest_sale_min: safeMarket.latestSaleMin,
            latest_sale_max: safeMarket.latestSaleMax,
            latest_sale_spread_ratio: safeMarket.latestSaleSpreadRatio,
            latest_sale_sample_size: safeMarket.latestSaleSampleSize,
            vol_3: liquidity.vol3,
            vol_7: liquidity.vol7,
            vol_30: liquidity.vol30,
            stable_vol_3: liquidity.stableVol3,
            daily_sales_avg_30: liquidity.dailyAverage30,
            daily_sales_trimmed_avg_30: liquidity.dailyTrimmedAverage30,
            daily_sales_median_30: liquidity.dailyMedian30,
            daily_sales_max_30: liquidity.dailyMax30,
            sales_outlier_days_30: liquidity.salesOutlierDays30,
            sales_spike_ratio: liquidity.salesSpikeRatio,
            liquidity_warning: liquidity.salesOutlierDays30 > 0 ? "Daily sold volume has bulk-sale spikes" : undefined,
            vendor_price: itemRecord.vendor_price || 0,
            last_updated: new Date().toISOString()
        };
        cycleHistoryCache.set(itemRecord.hashed_id, result);
        return result;
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

    if (IS_PETS_ONLY) {
        await updatePetDatabaseExchange();
        console.log("Pet data scrape completed. Exiting.");
        return;
    }

    if (IS_WORLD_LOCATIONS_ONLY) {
        const ok = await fetchWorldLocations();
        console.log("World location scrape completed. Exiting.");
        process.exitCode = ok ? 0 : 1;
        return;
    }

    while (true) {
        // Fetch live combat data at the start of each cycle so seasonal entities can appear without hardcoded placeholders.
        await fetchWorldLocations();
        await fetchLiveWorldBosses();
        await fetchLiveEnemies();
        await fetchLiveDungeons();
        await updatePetDatabaseExchange();

        const latestStaticData = loadJson(STATIC_DATA_FILE);
        const cycleItemsArray = Array.from(new Set([
            ...itemsArray,
            ...collectLootItemNames(latestStaticData)
        ]));
        const cycleHistoryCache = new Map();

        for (let i = 0; i < cycleItemsArray.length; i++) {
            const item = cycleItemsArray[i];
            
            // Write status
            try {
                fs.writeFileSync(STATUS_FILE, JSON.stringify({
                    currentItem: item,
                    currentIndex: i + 1,
                    totalItems: cycleItemsArray.length,
                    timestamp: new Date().toISOString()
                }));
            } catch(e) {}

            const data = await fetchItem(item, cycleHistoryCache);
            if (data) {
                marketData[item] = data;
                marketData["_meta"] = { currently_fetching: item, last_updated: new Date().toISOString() };
                
                // Batch save every 10 items or at the end
                if (i % 10 === 0 || i === cycleItemsArray.length - 1) {
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
        
        if (IS_SCRAPE_ONCE) {
            console.log("Process complete. Exiting.");
            return;
        }

        console.log(`Cycle finished. Restarting in ${formatDuration(SCRAPE_INTERVAL_MS)}...`);
        await sleep(SCRAPE_INTERVAL_MS);
    }
}

start();
