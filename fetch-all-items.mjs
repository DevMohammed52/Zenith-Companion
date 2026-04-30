/**
 * fetch-all-items.mjs
 * Fetches the base data for every single item in the game using the paginated /items endpoint.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const OUT_FILE = path.join(__dirname, 'public', 'all-items-db.json');

if (!API_KEY) {
    console.error("❌ Error: IDLEMMO_API_KEY not found in .env");
    process.exit(1);
}

const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "User-Agent": "IdleMMO-ZenithWeb/1.0",
    "Accept": "application/json"
};

async function fetchAll() {
    let currentPage = 1;
    let lastPage = 1;
    let allItems = [];

    console.log("🚀 Starting full item database fetch from IdleMMO API...");

    try {
        do {
            const response = await fetch(`${BASE_URL}/items?page=${currentPage}`, { headers });
            
            if (!response.ok) {
                if (response.status === 429) {
                    console.warn("⚠️ Rate limited. Waiting 10 seconds...");
                    await new Promise(r => setTimeout(r, 10000));
                    continue;
                }
                console.error(`❌ Failed to fetch page ${currentPage}: ${response.status}`);
                break;
            }

            const data = await response.json();
            const items = data.items || [];
            
            // Add items to our master list
            allItems = allItems.concat(items);
            
            lastPage = data.pagination.last_page;
            console.log(`📦 Page ${currentPage}/${lastPage} processed. (Total Items: ${allItems.length})`);
            
            currentPage++;
            
            // Small delay to respect API limits
            await new Promise(r => setTimeout(r, 600));

        } while (currentPage <= lastPage);

        // Save the master list
        fs.writeFileSync(OUT_FILE, JSON.stringify(allItems, null, 2));
        console.log(`\n✅ Mission Accomplished!`);
        console.log(`📂 Saved ${allItems.length} items to: ${OUT_FILE}`);

    } catch (error) {
        console.error("❌ An error occurred:", error.message);
    }
}

fetchAll();
