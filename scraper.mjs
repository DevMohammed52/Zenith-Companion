import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded natively via --env-file=.env

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const API_DELAY_MS = 3100;
const DATA_FILE = path.join(__dirname, 'public', 'market-data.json');

const ALCHEMY_ITEMS = {
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
    "Dragonblood Tonic": {"materials": {"Lions Teeth": 25, "Minotaurs Horn": 25}},
    "Gourmet Essence": {"materials": {"Elk Antler": 15, "Enigmatic Stone": 12}},
    "Wraithbane Essence": {"materials": {"Moose Antler": 15, "Minotaur Hide": 20}},
    "Thunderfury Brew": {"materials": {"Black Bear Pelt": 25, "Orb of Elemental Conjuring": 20}},
    "Cosmic Tear": {"materials": {"Harpy's Wings": 40, "Air Elemental Essence": 12}}
};

const itemsToFetch = new Set();
for (const [potion, data] of Object.entries(ALCHEMY_ITEMS)) {
    itemsToFetch.add(potion);
    for (const mat of Object.keys(data.materials)) {
        itemsToFetch.add(mat);
    }
}

const STATIC_DATA_FILE = path.join(__dirname, 'public', 'static-data.json');
if (fs.existsSync(STATIC_DATA_FILE)) {
    try {
        const staticData = JSON.parse(fs.readFileSync(STATIC_DATA_FILE, 'utf8'));
        
        const addLootItems = (entityList) => {
            if (!entityList) return;
            for (const entity of entityList) {
                if (entity.loot && Array.isArray(entity.loot)) {
                    for (const drop of entity.loot) {
                        itemsToFetch.add(drop.name);
                    }
                }
            }
        };

        addLootItems(staticData.enemies);
        addLootItems(staticData.dungeons);
        addLootItems(staticData.world_bosses);
        console.log(`Added combat items to scrape list. Total items: ${itemsToFetch.size}`);
    } catch (e) {
        console.error("Error reading static data:", e.message);
    }
}

// Also add crafted gear items from gear-data.json (so they appear in Items DB with live prices)
const SKILL_TOOL_TYPES = new Set(['FISHING_ROD', 'PICKAXE', 'FELLING_AXE']);
const GEAR_DATA_FILE = path.join(__dirname, 'public', 'gear-data.json');
if (fs.existsSync(GEAR_DATA_FILE)) {
    try {
        const gearData = JSON.parse(fs.readFileSync(GEAR_DATA_FILE, 'utf8'));
        let gearCount = 0;
        for (const item of Object.values(gearData)) {
            if (item.is_tradeable && item.name && !SKILL_TOOL_TYPES.has(item.type)) {
                itemsToFetch.add(item.name);
                gearCount++;
            }
        }
        console.log(`Added ${gearCount} gear items to scrape list. Total items: ${itemsToFetch.size}`);
    } catch (e) {
        console.error("Error reading gear data:", e.message);
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

async function fetchItem(itemName) {
    try {
        const searchRes = await fetch(`${BASE_URL}/item/search?query=${encodeURIComponent(itemName)}`, { headers });
        if (!searchRes.ok) return null;
        const searchData = await searchRes.json();
        if (!searchData.items || searchData.items.length === 0) return null;
        
        let tradable = searchData.items.find(i => (i.vendor_price > 0 || i.vendor_price === null) && i.name.toLowerCase() === itemName.toLowerCase());
        if (!tradable) tradable = searchData.items.find(i => i.vendor_price > 0 || i.vendor_price === null);
        if (!tradable) return null;

        await sleep(API_DELAY_MS);

        const histRes = await fetch(`${BASE_URL}/item/${tradable.hashed_id}/market-history?tier=0&type=listings`, { headers });
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
            hashed_id: tradable.hashed_id,
            image_url: tradable.image_url,
            price: a3,
            avg_3: a3,
            avg_7: a7,
            avg_14: a14,
            avg_30: a30,
            vol_3: vol_3,
            vendor_price: tradable.vendor_price || 0,
            last_updated: new Date().toISOString()
        };
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
    console.log("Starting background API scraper...");
    
    // Create public dir if missing
    const publicDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    while (true) {
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
                const tempFile = DATA_FILE + '.tmp';
                fs.writeFileSync(tempFile, JSON.stringify(marketData, null, 2));
                fs.renameSync(tempFile, DATA_FILE);
            }
            await sleep(API_DELAY_MS);
        }
        
        if (process.env.SCRAPE_ONCE === "true") {
            console.log("Full scrape cycle completed. SCRAPE_ONCE is true, exiting.");
            process.exit(0);
        }

        console.log("Completed full scrape cycle. Restarting in 60s...");
        await sleep(60000);
    }
}

start();
