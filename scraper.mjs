import fs from 'fs';
import path from 'path';
import { execSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { DEFAULT_ALCHEMY_RECIPES } from './src/lib/default-alchemy-recipes.mjs';
import { computeRateLimitWaitMs } from './scripts/idlemmo-fetch-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded natively via --env-file=.env

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const CLI_DELAY_MS = (() => {
    const flag = process.argv.find((arg) => arg.startsWith('--delay-ms='));
    return flag ? Number(flag.slice('--delay-ms='.length)) : undefined;
})();
// Upgraded API key supports 80 req/min; shared default 1000ms (60 req/min) leaves 20 req/min headroom for live user imports & probes.
const API_DELAY_MS = Math.max(readPositiveNumber(CLI_DELAY_MS ?? process.env.IDLEMMO_API_DELAY_MS, 1000), 850);
const API_MAX_RETRIES = Math.floor(readPositiveNumber(process.env.IDLEMMO_API_MAX_RETRIES, 5));
const API_MAX_BACKOFF_MS = readPositiveNumber(process.env.IDLEMMO_API_MAX_BACKOFF_MS, 5 * 60 * 1000);
const SCRAPE_INTERVAL_MS = Number(process.env.SCRAPE_INTERVAL_MS || 6 * 60 * 60 * 1000);
const ZERO_HISTORY_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const LISTINGS_ORDERS_RECHECK_MS = 12 * 60 * 60 * 1000;
const DATA_FILE = path.join(__dirname, 'public', 'market-data.json');
const STATIC_DATA_FILE = path.join(__dirname, 'public', 'static-data.json');
const PET_DATABASE_FILE = path.join(__dirname, 'public', 'pet-database.json');
const WORLD_LOCATIONS_FILE = path.join(__dirname, 'public', 'world-locations.json');
const CONQUEST_DATA_FILE = path.join(__dirname, 'public', 'conquest-data.json');
const ALL_ITEMS_DB_FILE = path.join(__dirname, 'public', 'all-items-db.json');
const STATUS_FILE = path.join(__dirname, 'public', 'scraper-status.json');
const PRIORITY_FILE = path.join(__dirname, 'public', 'scraper-priority.json');
const MARKET_SPIKE_MULTIPLIER = 3;
const MARKET_SPIKE_MIN_DELTA = 25;
const MARKET_SPIKE_MIN_RATIO = 1.5;

function readPositiveNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const ALCHEMY_ITEMS = DEFAULT_ALCHEMY_RECIPES;

const IS_PRIORITY_ONLY = process.argv.includes('--priority');
const IS_PETS_ONLY = process.argv.includes('--pets-only');
const IS_WORLD_LOCATIONS_ONLY = process.argv.includes('--world-locations-only');
const IS_CONQUEST_ONLY = process.argv.includes('--conquest-only');
const IS_FORCE_FULL_MARKET = process.argv.includes('--force-full-market');
const IS_SCRAPE_ONCE = process.env.SCRAPE_ONCE === "true" || process.argv.includes('--once');
const SHOULD_RUN_DISCOVERY = process.argv.includes('--discover');

const itemLookupByName = new Map();
let itemsArray = [];

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

const MARKET_MATERIAL_FIELDS = [
    'hashed_id',
    'image_url',
    'price',
    'safe_price',
    'avg_3',
    'avg_7',
    'avg_14',
    'avg_30',
    'raw_price',
    'raw_avg_3',
    'raw_avg_7',
    'raw_avg_14',
    'raw_avg_30',
    'price_adjusted',
    'price_warning',
    'price_outlier_rows',
    'latest_sale_median',
    'latest_sale_min',
    'latest_sale_max',
    'latest_sale_spread_ratio',
    'latest_sale_sample_size',
    'vol_3',
    'vol_7',
    'vol_30',
    'stable_vol_3',
    'daily_sales_avg_30',
    'daily_sales_trimmed_avg_30',
    'daily_sales_median_30',
    'daily_sales_max_30',
    'sales_outlier_days_30',
    'sales_spike_ratio',
    'liquidity_warning',
    'vendor_price',
];

export function hasMarketItemChanged(prevEntry, nextEntry) {
    if (!prevEntry || typeof prevEntry !== 'object') return true;
    if (!nextEntry || typeof nextEntry !== 'object') return true;
    for (const field of MARKET_MATERIAL_FIELDS) {
        if (prevEntry[field] !== nextEntry[field]) {
            return true;
        }
    }
    return false;
}

export function mergeMarketItemEntry(prevEntry, nextEntry) {
    if (!hasMarketItemChanged(prevEntry, nextEntry)) {
        return {
            ...nextEntry,
            last_updated: prevEntry.last_updated || nextEntry.last_updated,
        };
    }
    return nextEntry;
}

export function shouldScrapeMarketItem(itemName, itemRecord) {
    if (!itemName) return false;
    if (itemRecord && itemRecord.is_tradeable === false) return false;
    return true;
}

export function isOnCooldown(checkedAtMap, hashedId, cooldownMs, nowMs = Date.now()) {
    if (!hashedId || !checkedAtMap || typeof checkedAtMap !== 'object') return false;
    const rawSec = Number(checkedAtMap[hashedId]);
    if (!Number.isFinite(rawSec) || rawSec <= 0) return false;
    return (nowMs - (rawSec * 1000)) < cooldownMs;
}

/** @param {{ itemRecord?: { hashed_id?: string }; marketMeta?: { zero_history_checked_at?: Record<string, number> }; forceFullMarket?: boolean; nowMs?: number }} [opts] */
export function shouldSkipZeroHistoryItem({ itemRecord, marketMeta, forceFullMarket = false, nowMs = Date.now() } = {}) {
    if (forceFullMarket) return false;
    if (!itemRecord?.hashed_id) return false;
    return isOnCooldown(marketMeta?.zero_history_checked_at, itemRecord.hashed_id, ZERO_HISTORY_COOLDOWN_MS, nowMs);
}

/** @param {{ itemRecord?: { hashed_id?: string }; marketMeta?: { listings_only_checked_at?: Record<string, number> }; forceFullMarket?: boolean; nowMs?: number }} [opts] */
export function shouldQueryOrdersFirst({ itemRecord, marketMeta, forceFullMarket = false, nowMs = Date.now() } = {}) {
    if (forceFullMarket) return true;
    if (!itemRecord?.hashed_id) return true;
    return !isOnCooldown(marketMeta?.listings_only_checked_at, itemRecord.hashed_id, LISTINGS_ORDERS_RECHECK_MS, nowMs);
}

/** @param {{ alchemyItems?: Record<string, { materials?: Record<string, number> }>; staticData?: { enemies?: any[]; dungeons?: any[]; world_bosses?: any[] } | null; allItemsDb?: Record<string, any> | null; isPriorityOnly?: boolean; priorityData?: { high_priority_items?: string[] } | null }} [opts] */
export function collectMarketCandidateNames({
    alchemyItems = ALCHEMY_ITEMS,
    staticData = null,
    allItemsDb = null,
    isPriorityOnly = false,
    priorityData = null,
} = {}) {
    const itemsToFetch = new Set();
    const lookupByName = new Map();

    if (allItemsDb && typeof allItemsDb === 'object') {
        for (const item of Object.values(allItemsDb)) {
            if (item?.name) {
                lookupByName.set(item.name.toLowerCase(), item);
            }
        }
    }

    // 1. Add Alchemy potions, materials, and ONLY real Recipe items present in all-items-db (avoids phantom search misses).
    for (const [potion, data] of Object.entries(alchemyItems || {})) {
        const potionLower = potion.toLowerCase();
        if (shouldScrapeMarketItem(potion, lookupByName.get(potionLower))) {
            itemsToFetch.add(potion);
        }
        const recipeName = `Recipe: ${potion}`;
        const recipeRecord = lookupByName.get(recipeName.toLowerCase());
        if (recipeRecord && shouldScrapeMarketItem(recipeName, recipeRecord)) {
            itemsToFetch.add(recipeRecord.name);
        }
        for (const mat of Object.keys(data?.materials || {})) {
            if (shouldScrapeMarketItem(mat, lookupByName.get(mat.toLowerCase()))) {
                itemsToFetch.add(mat);
            }
        }
    }

    // 2. Add drops from enemies/dungeons/bosses
    if (staticData) {
        for (const entityList of [staticData.enemies, staticData.dungeons, staticData.world_bosses]) {
            if (!Array.isArray(entityList)) continue;
            for (const entity of entityList) {
                if (!Array.isArray(entity?.loot)) continue;
                for (const drop of entity.loot) {
                    const dropName = drop?.name;
                    if (!dropName) continue;
                    if (isPriorityOnly && !priorityData?.high_priority_items?.includes(dropName)) continue;
                    if (shouldScrapeMarketItem(dropName, lookupByName.get(dropName.toLowerCase()))) {
                        itemsToFetch.add(dropName);
                    }
                }
            }
        }
    }

    // 3. Add remaining tradeable items from global DB
    if (allItemsDb && typeof allItemsDb === 'object') {
        for (const item of Object.values(allItemsDb)) {
            const name = item?.name;
            if (!name) continue;
            if (isPriorityOnly && !priorityData?.high_priority_items?.includes(name)) continue;
            if (shouldScrapeMarketItem(name, item)) {
                itemsToFetch.add(name);
            }
        }
    }

    return {
        itemsArray: Array.from(itemsToFetch),
        itemLookupByName: lookupByName,
    };
}

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

function initializeCatalogTargets() {
    if (IS_PETS_ONLY || IS_WORLD_LOCATIONS_ONLY || IS_CONQUEST_ONLY) return;
    const staticData = loadJson(STATIC_DATA_FILE);
    const priorityData = loadJson(PRIORITY_FILE);
    const allItemsDb = loadJson(ALL_ITEMS_DB_FILE);
    const result = collectMarketCandidateNames({
        alchemyItems: ALCHEMY_ITEMS,
        staticData,
        allItemsDb,
        isPriorityOnly: IS_PRIORITY_ONLY,
        priorityData,
    });
    itemLookupByName.clear();
    for (const [k, v] of result.itemLookupByName.entries()) {
        itemLookupByName.set(k, v);
    }
    itemsArray = result.itemsArray;
    if (IS_PRIORITY_ONLY) {
        console.log(`Running in PRIORITY mode. Targeting ${itemsArray.length} tradeable velocity items.`);
    } else {
        console.log(`Running in FULL mode. Targeting ${itemsArray.length} tradeable items (skipping untradeable items).`);
    }
}

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
let rateLimitCooldownUntil = 0;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function getRetryDelayMs(response, attempt = 0) {
    const retryAfter = response.headers.get("retry-after");
    const exponentialBackoffMs = API_DELAY_MS * (2 ** Math.max(1, attempt + 1));
    const jitterMs = Math.floor(Math.random() * API_DELAY_MS);
    if (!retryAfter) return Math.min(exponentialBackoffMs + jitterMs, API_MAX_BACKOFF_MS);

    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
        return Math.min(Math.max(seconds * 1000, exponentialBackoffMs) + jitterMs, API_MAX_BACKOFF_MS);
    }

    const retryDate = new Date(retryAfter).getTime();
    if (Number.isFinite(retryDate)) {
        return Math.min(Math.max(retryDate - Date.now(), exponentialBackoffMs) + jitterMs, API_MAX_BACKOFF_MS);
    }

    return Math.min(exponentialBackoffMs + jitterMs, API_MAX_BACKOFF_MS);
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
        && value >= Math.max(
            anchor * MARKET_SPIKE_MULTIPLIER,
            anchor + Math.max(MARKET_SPIKE_MIN_DELTA, anchor * MARKET_SPIKE_MIN_RATIO),
        );
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
    const targetAt = Math.max(lastApiRequestAt + API_DELAY_MS, rateLimitCooldownUntil);
    const waitMs = targetAt - Date.now();
    if (waitMs > 0) {
        await sleep(waitMs);
    }
    lastApiRequestAt = Date.now();

    try {
        const response = await fetch(url, {
            ...options,
            signal: options.signal ?? AbortSignal.timeout(20000),
        });
        const headerWaitMs = computeRateLimitWaitMs(response.headers, { reserveRemaining: 10 });
        if (headerWaitMs > 0) {
            rateLimitCooldownUntil = Math.max(rateLimitCooldownUntil, Date.now() + headerWaitMs);
        }

        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < API_MAX_RETRIES) {
            const delayMs = getRetryDelayMs(response, attempt);
            console.warn(`API returned ${response.status}. Retrying attempt ${attempt + 1}/${API_MAX_RETRIES} in ${formatDuration(delayMs)}...`);
            await sleep(delayMs);
            return apiFetch(url, options, attempt + 1);
        }

        if (response.status === 429) {
            console.warn(`API rate limit persisted after ${API_MAX_RETRIES} retries.`);
        }

        return response;
    } catch (e) {
        if (attempt < API_MAX_RETRIES) {
            const delayMs = Math.min(API_DELAY_MS * (2 ** Math.max(1, attempt + 1)), API_MAX_BACKOFF_MS);
            console.warn(`API request failed (${e.message}). Retrying attempt ${attempt + 1}/${API_MAX_RETRIES} in ${formatDuration(delayMs)}...`);
            await sleep(delayMs);
            return apiFetch(url, options, attempt + 1);
        }
        throw e;
    }
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

function mergeDungeonsCollection(currentItems = [], liveItems = [], sourceLabel) {
    const liveByKey = new Map();
    for (const live of liveItems) {
        const key = live.id || live.name;
        if (key) liveByKey.set(key, live);
    }

    const seenKeys = new Set();
    const updatedItems = [];

    for (const item of currentItems) {
        const key = item.id || item.name;
        const live = liveByKey.get(key) || liveItems.find(liveItem => liveItem.id === item.id || liveItem.name === item.name);
        if (live) {
            seenKeys.add(live.id || live.name);
            const isSeasonal = Boolean(item.is_seasonal || Number(live.id) > 18);
            updatedItems.push({
                ...item,
                ...live,
                loot: live.loot || item.loot || [],
                _source: sourceLabel,
                ...(isSeasonal ? { is_seasonal: true, event_active: true } : {}),
            });
            continue;
        }

        // Preserve seasonal/event dungeons between campaigns rather than deleting them when off-season.
        if (item.is_seasonal || Number(item.id) > 18) {
            updatedItems.push({
                ...item,
                is_seasonal: true,
                event_active: false,
            });
            continue;
        }

        if (item._source !== sourceLabel) {
            updatedItems.push(item);
        }
    }

    for (const live of liveItems) {
        const key = live.id || live.name;
        if (!key || seenKeys.has(key)) continue;
        const isSeasonal = Number(live.id) > 18;
        updatedItems.push({
            ...live,
            loot: live.loot || [],
            _source: sourceLabel,
            ...(isSeasonal ? { is_seasonal: true, event_active: true } : {}),
        });
    }

    return updatedItems;
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

            currentStatic.dungeons = mergeDungeonsCollection(
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
            forecast: normalizeWorldLocationForecast(location.forecast),
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

const WEATHER_FORECAST_BUFFS = {
    CLEAR: [
        "+10% Hunt Efficiency",
        "+10% Fishing Efficiency",
        "+10% Woodcutting Efficiency",
        "+5% Mining Efficiency",
        "+5% Construction Efficiency",
    ],
    FOG: [
        "-10% Hunt Efficiency",
        "+20% Hunting Mastery EXP",
        "-10% Fishing Efficiency",
        "+20% Fishing EXP",
        "-10% Woodcutting Efficiency",
        "+20% Woodcutting EXP",
        "-5% Mining Efficiency",
        "+10% Mining EXP",
        "-5% Construction Efficiency",
        "+10% Construction EXP",
    ],
    HEATWAVE: [
        "-5% Hunt Efficiency",
        "+15% Hunting Mastery EXP",
        "-15% Fishing Efficiency",
        "+30% Fishing EXP",
        "-10% Woodcutting Efficiency",
        "+25% Woodcutting EXP",
        "-15% Mining Efficiency",
        "+30% Mining EXP",
        "-15% Construction Efficiency",
        "+30% Construction EXP",
    ],
    MAGIC_STORM: [
        "+25% Battle Magic Find",
        "+20% Dungeon Magic Find",
        "+20% World Boss Magic Find",
    ],
    OVERCAST: [],
    RAIN: [
        "-5% Hunt Efficiency",
        "+10% Hunting Mastery EXP",
        "-5% Fishing Efficiency",
        "+10% Fishing EXP",
        "-5% Woodcutting Efficiency",
        "+10% Woodcutting EXP",
        "-5% Mining Efficiency",
        "+10% Mining EXP",
        "-5% Construction Efficiency",
        "+10% Construction EXP",
    ],
    SNOW: [
        "-10% Hunt Efficiency",
        "+20% Hunting Mastery EXP",
        "-15% Fishing Efficiency",
        "+30% Fishing EXP",
        "-15% Woodcutting Efficiency",
        "+30% Woodcutting EXP",
        "-10% Mining Efficiency",
        "+20% Mining EXP",
        "-10% Construction Efficiency",
        "+20% Construction EXP",
    ],
    STORM: [
        "-15% Hunt Efficiency",
        "+35% Hunting Mastery EXP",
        "-20% Fishing Efficiency",
        "+40% Fishing EXP",
        "-20% Woodcutting Efficiency",
        "+40% Woodcutting EXP",
        "-10% Mining Efficiency",
        "+25% Mining EXP",
        "-10% Construction Efficiency",
        "+25% Construction EXP",
    ],
    WINDY: [
        "+15% Hunt Efficiency",
        "-10% Fishing Efficiency",
        "+20% Fishing EXP",
        "-10% Woodcutting Efficiency",
        "+25% Woodcutting EXP",
        "-5% Construction Efficiency",
        "+10% Construction EXP",
    ],
};

function getWeatherBuffKey(weather) {
    const rawKey = weather?.key || weather?.name || weather?.icon || "";
    return String(rawKey)
        .trim()
        .toUpperCase()
        .replace(/[-\s]+/g, "_");
}

function normalizeWorldLocationForecast(forecast) {
    if (!Array.isArray(forecast)) return [];

    return forecast.map(day => ({
        ...day,
        weathers: Array.isArray(day?.weathers)
            ? day.weathers.map(weather => ({
                ...weather,
                buffs: Object.hasOwn(WEATHER_FORECAST_BUFFS, getWeatherBuffKey(weather))
                    ? [...WEATHER_FORECAST_BUFFS[getWeatherBuffKey(weather)]]
                    : Array.isArray(weather?.buffs) ? weather.buffs : [],
            }))
            : [],
    }));
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

function addQuery(url, params) {
    const nextUrl = new URL(url);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== false && value !== "") {
            nextUrl.searchParams.set(key, String(value));
        }
    }
    return nextUrl.toString();
}

function normalizeApiNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return 0;
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function compactConquestGuild(guild) {
    if (!guild) return null;
    return {
        id: guild.id ?? null,
        name: guild.name || "Unknown guild",
        tag: guild.tag ?? null,
        icon_url: guild.icon_url || null,
        background_url: guild.background_url || null,
    };
}

function compactConquestCharacter(character) {
    if (!character) return null;
    return {
        hashed_id: character.hashed_id ?? null,
        name: character.name || "Unknown",
        total_level: character.total_level ?? null,
        image_url: character.image_url || null,
        background_url: character.background_url || null,
    };
}

function summarizeConquestZone(zone, inspectedZone) {
    const location = inspectedZone?.location || zone?.location || {};
    const contributions = Array.isArray(inspectedZone?.contributions) ? inspectedZone.contributions : [];
    const activeAssaults = Array.isArray(zone?.active_assaults) ? zone.active_assaults : [];
    const leaderboard = Array.isArray(zone?.guilds) ? zone.guilds : [];

    const progressGuildMap = new Map();
    for (const row of leaderboard) {
        if (row?.id != null && row?.guild) {
            progressGuildMap.set(row.id, compactConquestGuild(row.guild));
        }
    }

    const contributionRows = contributions.map(row => ({
        id: row.id ?? null,
        guild_conquest_progress_id: row.guild_conquest_progress_id ?? null,
        kills: normalizeApiNumber(row.kills),
        experience: normalizeApiNumber(row.experience),
        guild: compactConquestGuild(row.guild) ?? progressGuildMap.get(row.guild_conquest_progress_id) ?? null,
        character: compactConquestCharacter(row.character),
    }));

    return {
        id: location.id ?? null,
        key: location.key || String(location.name || location.id || "unknown-zone").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        name: location.name || "Unknown zone",
        image_url: location.image_url || null,
        status: zone?.status || inspectedZone?.status || null,
        colour: zone?.colour || inspectedZone?.colour || null,
        kills: normalizeApiNumber(zone?.kills ?? inspectedZone?.kills),
        experience: normalizeApiNumber(zone?.experience ?? inspectedZone?.experience),
        guilds_count: Number(zone?.guilds_count || leaderboard.length || 0),
        active_assaults_count: activeAssaults.length,
        leaderboard_count: leaderboard.length,
        contribution_count: contributionRows.length,
        active_assaults: activeAssaults.map(row => ({
            kills: normalizeApiNumber(row.kills),
            experience: normalizeApiNumber(row.experience),
            starts_at: row.starts_at || null,
            ends_at: row.ends_at || null,
            guild: compactConquestGuild(row.guild),
        })),
        guild_leaderboard: leaderboard.slice(0, 25).map(row => ({
            id: row.id ?? null,
            position: row.position ?? null,
            kills: normalizeApiNumber(row.kills),
            experience: normalizeApiNumber(row.experience),
            contributions: row.contributions ?? null,
            guild: compactConquestGuild(row.guild),
        })),
        top_contributors: contributionRows
            .sort((a, b) => b.experience - a.experience || b.kills - a.kills)
            .slice(0, 50),
    };
}

async function fetchJsonEndpoint(url, label) {
    const res = await apiFetch(url, { headers });
    if (!res.ok) {
        console.error(`Failed to fetch ${label}: ${res.status}`);
        return null;
    }
    return res.json();
}

async function fetchConquestData() {
    try {
        console.log("Fetching conquest data...");
        const startedAt = new Date().toISOString();
        let requestCount = 1;
        const conquest = await fetchJsonEndpoint(`${BASE_URL}/guild/conquest/view`, "conquest view");
        if (!conquest) return false;

        const zones = Object.values(conquest.zones || {});
        const inspectedByKey = new Map();
        for (const zone of zones) {
            if (!zone?.location?.id) continue;
            const key = zone.location.key || String(zone.location.name || zone.location.id);
            const inspected = await fetchJsonEndpoint(
                addQuery(`${BASE_URL}/guild/conquest/zone/${zone.location.id}/inspect`, {}),
                `conquest zone ${key}`,
            );
            requestCount += 1;
            if (inspected?.zone) inspectedByKey.set(key, inspected.zone);
        }

        const zoneSummaries = zones.map(zone => {
            const key = zone?.location?.key || String(zone?.location?.name || zone?.location?.id || "unknown-zone");
            return summarizeConquestZone(zone, inspectedByKey.get(key));
        });

        const guildIds = new Set();
        for (const zone of zoneSummaries) {
            for (const row of zone.guild_leaderboard) if (row.guild?.id) guildIds.add(row.guild.id);
            for (const row of zone.active_assaults) if (row.guild?.id) guildIds.add(row.guild.id);
            for (const row of zone.top_contributors) if (row.guild?.id) guildIds.add(row.guild.id);
        }

        const topContributors = zoneSummaries
            .flatMap(zone => zone.top_contributors.map(row => ({
                ...row,
                zone: {
                    id: zone.id,
                    key: zone.key,
                    name: zone.name,
                },
            })))
            .sort((a, b) => b.experience - a.experience || b.kills - a.kills)
            .slice(0, 75);

        const data = {
            meta: {
                generated_at: new Date().toISOString(),
                fetched_at: startedAt,
                season_number: null,
                endpoint_updates_at: conquest.endpoint_updates_at ?? null,
                rate_profile: "scraper",
                delay_ms: API_DELAY_MS,
                stats: {
                    completed: requestCount,
                    estimated_total: requestCount,
                    elapsed_ms: Date.now() - new Date(startedAt).getTime(),
                },
                totals: {
                    zones: zoneSummaries.length,
                    active_assaults: zoneSummaries.reduce((sum, zone) => sum + zone.active_assaults_count, 0),
                    leaderboard_rows: zoneSummaries.reduce((sum, zone) => sum + zone.leaderboard_count, 0),
                    contribution_rows: zoneSummaries.reduce((sum, zone) => sum + zone.contribution_count, 0),
                    guilds_observed: guildIds.size,
                },
            },
            zones: zoneSummaries,
            top_contributors: topContributors,
        };

        await safeWriteJson(CONQUEST_DATA_FILE, data);
        console.log(`Conquest data updated: ${zoneSummaries.length} zones, ${requestCount} requests.`);

        if (process.env.CONQUEST_SKIP_ARCHIVE !== "true") {
            try {
                execFileSync(
                    process.execPath,
                    ["scripts/archive-conquest-seasons.mjs", "--delay-ms", String(API_DELAY_MS)],
                    { stdio: "inherit" },
                );
            } catch (archiveErr) {
                console.error("Incremental conquest season archive check failed:", archiveErr.message);
            }
        }
        return true;
    } catch (e) {
        console.error("Error updating conquest data:", e.message);
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

async function fetchItem(itemName, cycleHistoryCache, marketMeta) {
    try {
        let itemRecord = itemLookupByName.get(itemName.toLowerCase());
        if (!shouldScrapeMarketItem(itemName, itemRecord)) {
            return null;
        }

        if (!itemRecord?.hashed_id) {
            const searchRes = await apiFetch(`${BASE_URL}/item/search?query=${encodeURIComponent(itemName)}`, { headers });
            if (!searchRes.ok) return null;
            const searchData = await searchRes.json();
            if (!searchData.items || searchData.items.length === 0) return null;

            itemRecord = searchData.items.find(i => i.name.toLowerCase() === itemName.toLowerCase())
                || searchData.items.find(i => i.vendor_price > 0 || i.vendor_price === null);
            if (!itemRecord?.hashed_id || !shouldScrapeMarketItem(itemName, itemRecord)) return null;
        }

        if (shouldSkipZeroHistoryItem({ itemRecord, marketMeta, forceFullMarket: IS_FORCE_FULL_MARKET })) {
            return null;
        }

        if (cycleHistoryCache.has(itemRecord.hashed_id)) {
            return cycleHistoryCache.get(itemRecord.hashed_id);
        }

        // Since Patch 279 (0.82.03-PB, Sep 17 2026), direct listing purchases are disabled.
        // All active market transactions execute via Purchase Orders (type=orders).
        // Query type=orders first (unless item recently showed 0 orders & active listings within cooldown),
        // falling back to type=listings when orders has 0 history.
        const ordersFirst = shouldQueryOrdersFirst({ itemRecord, marketMeta, forceFullMarket: IS_FORCE_FULL_MARKET });
        let histRes;
        let histData = null;
        let history = [];
        let fromListingsOnly = false;

        if (ordersFirst) {
            histRes = await apiFetch(`${BASE_URL}/item/${itemRecord.hashed_id}/market-history?tier=0&type=orders`, { headers });
            histData = histRes.ok ? await histRes.json() : null;
            history = histData?.history_data || [];

            if (history.length === 0) {
                const fallbackRes = await apiFetch(`${BASE_URL}/item/${itemRecord.hashed_id}/market-history?tier=0&type=listings`, { headers });
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData?.history_data?.length > 0) {
                        histData = fallbackData;
                        history = fallbackData.history_data;
                        fromListingsOnly = true;
                    }
                }
            }
        } else {
            histRes = await apiFetch(`${BASE_URL}/item/${itemRecord.hashed_id}/market-history?tier=0&type=listings`, { headers });
            histData = histRes.ok ? await histRes.json() : null;
            history = histData?.history_data || [];
            if (history.length > 0) {
                fromListingsOnly = true;
            }
        }

        const nowSec = Math.floor(Date.now() / 1000);
        if (history.length === 0) {
            marketMeta.zero_history_checked_at[itemRecord.hashed_id] = nowSec;
            delete marketMeta.listings_only_checked_at[itemRecord.hashed_id];
            return null;
        }

        delete marketMeta.zero_history_checked_at[itemRecord.hashed_id];
        if (ordersFirst) {
            if (fromListingsOnly) {
                marketMeta.listings_only_checked_at[itemRecord.hashed_id] = nowSec;
            } else {
                delete marketMeta.listings_only_checked_at[itemRecord.hashed_id];
            }
        }

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

    if (IS_CONQUEST_ONLY) {
        const ok = await fetchConquestData();
        console.log("Conquest data scrape completed. Exiting.");
        process.exitCode = ok ? 0 : 1;
        return;
    }

    while (true) {
        if (SHOULD_RUN_DISCOVERY) {
            console.log("Running catalog discovery before market scrape...");
            try {
                execSync('node scripts/discover-idlemmo-catalog.mjs --skip-derivatives', { stdio: 'inherit' });
            } catch (e) {
                console.error("Catalog discovery failed:", e.message);
            }
        }

        // Fetch live combat data at the start of each cycle so seasonal entities appear without hardcoded placeholders.
        await fetchWorldLocations();
        await fetchLiveWorldBosses();
        await fetchLiveEnemies();
        await fetchLiveDungeons();
        await fetchConquestData();
        await updatePetDatabaseExchange();

        initializeCatalogTargets();

        const latestStaticData = loadJson(STATIC_DATA_FILE);
        const rawCycleCandidates = Array.from(new Set([
            ...itemsArray,
            ...collectLootItemNames(latestStaticData),
        ]));
        const cycleItemsArray = rawCycleCandidates.filter((itemName) =>
            shouldScrapeMarketItem(itemName, itemLookupByName.get(String(itemName).toLowerCase()))
        );

        const cycleHistoryCache = new Map();
        const existingMeta = marketData["_meta"] && typeof marketData["_meta"] === "object" ? marketData["_meta"] : {};
        const marketMeta = {
            currently_fetching: existingMeta.currently_fetching || null,
            last_updated: existingMeta.last_updated || new Date().toISOString(),
            zero_history_checked_at: existingMeta.zero_history_checked_at && typeof existingMeta.zero_history_checked_at === "object"
                ? { ...existingMeta.zero_history_checked_at }
                : {},
            listings_only_checked_at: existingMeta.listings_only_checked_at && typeof existingMeta.listings_only_checked_at === "object"
                ? { ...existingMeta.listings_only_checked_at }
                : {},
        };

        let updatedCount = 0;
        let changedCount = 0;
        for (let i = 0; i < cycleItemsArray.length; i++) {
            const item = cycleItemsArray[i];

            if (!IS_SCRAPE_ONCE || i === 0 || i === cycleItemsArray.length - 1 || i % 50 === 0) {
                try {
                    fs.writeFileSync(STATUS_FILE, JSON.stringify({
                        currentItem: item,
                        currentIndex: i + 1,
                        totalItems: cycleItemsArray.length,
                        timestamp: new Date().toISOString(),
                    }));
                } catch {}
            }

            const data = await fetchItem(item, cycleHistoryCache, marketMeta);
            if (data) {
                const prevEntry = marketData[item];
                const merged = mergeMarketItemEntry(prevEntry, data);
                if (hasMarketItemChanged(prevEntry, data)) {
                    changedCount++;
                }
                marketData[item] = merged;
                updatedCount++;
            }

            const isFinalItem = i === cycleItemsArray.length - 1;
            const shouldCheckpoint = !IS_SCRAPE_ONCE && i % 50 === 0;
            if (isFinalItem || shouldCheckpoint) {
                marketMeta.currently_fetching = isFinalItem ? null : item;
                if (changedCount > 0 || !marketMeta.last_updated) {
                    marketMeta.last_updated = new Date().toISOString();
                }
                marketData["_meta"] = marketMeta;
                await safeWriteJson(DATA_FILE, marketData);
            }
        }

        console.log(`Market cycle finished: ${updatedCount} priced items inspected (${changedCount} materially changed) out of ${cycleItemsArray.length} candidates.`);

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

export {
    buildSafeMarketAverages,
    buildLiquidityMetrics,
};

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
    start();
}
