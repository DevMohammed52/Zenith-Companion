import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const DATA_FILE = path.join(__dirname, 'public', 'static-data.json');

const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "User-Agent": "IdleMMO-ZenithWeb/1.0",
    "Accept": "application/json"
};

async function fetchStaticData() {
    if (!API_KEY) {
        console.error("No IDLEMMO_API_KEY provided in .env.");
        process.exit(1);
    }

    console.log("Fetching static combat data...");
    const data = {
        enemies: [],
        dungeons: [],
        world_bosses: []
    };

    try {
        console.log("-> Fetching Enemies...");
        const resEnemies = await fetch(`${BASE_URL}/combat/enemies/list`, { headers });
        if (resEnemies.ok) {
            const json = await resEnemies.json();
            data.enemies = json.enemies || [];
        } else {
            console.error("Failed to fetch enemies:", resEnemies.status);
        }

        console.log("-> Fetching Dungeons...");
        const resDungeons = await fetch(`${BASE_URL}/combat/dungeons/list`, { headers });
        if (resDungeons.ok) {
            const json = await resDungeons.json();
            data.dungeons = json.dungeons || [];
        } else {
            console.error("Failed to fetch dungeons:", resDungeons.status);
        }

        console.log("-> Fetching World Bosses...");
        const resBosses = await fetch(`${BASE_URL}/combat/world_bosses/list`, { headers });
        if (resBosses.ok) {
            const json = await resBosses.json();
            data.world_bosses = json.world_bosses || [];
        } else {
            console.error("Failed to fetch world bosses:", resBosses.status);
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(`Successfully saved ${data.enemies.length} enemies, ${data.dungeons.length} dungeons, and ${data.world_bosses.length} bosses to public/static-data.json`);
    } catch (e) {
        console.error("Error fetching static data:", e.message);
    }
}

fetchStaticData();
