/**
 * fetch-gear-data.mjs
 * One-time script to build gear-data.json from all dungeon/boss recipe drops.
 * Run: node --env-file=.env fetch-gear-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.IDLEMMO_API_KEY || "";
const BASE_URL = "https://api.idle-mmo.com/v1";
const API_DELAY_MS = 3100;
const OUT_FILE = path.join(__dirname, 'public', 'gear-data.json');

if (!API_KEY) { console.error("No IDLEMMO_API_KEY in .env"); process.exit(1); }

const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "User-Agent": "IdleMMO-ZenithWeb/1.0",
    "Accept": "application/json"
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. Extract all unique recipe items from static-data.json
const staticData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'static-data.json'), 'utf8'));

const recipeItems = new Map(); // hashed_item_id -> name
const addLoot = (list) => {
    for (const entity of (list || [])) {
        for (const drop of (entity.loot || [])) {
            if (drop.name?.includes('Recipe') && drop.hashed_item_id) {
                recipeItems.set(drop.hashed_item_id, drop.name);
            }
        }
    }
};
addLoot(staticData.dungeons);
addLoot(staticData.world_bosses);
addLoot(staticData.enemies);

console.log(`Found ${recipeItems.size} unique recipe items in static-data.json`);

// 2. Load existing gear data if any (for resume)
let gearData = {};
if (fs.existsSync(OUT_FILE)) {
    try { gearData = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch {}
}

const inspect = async (hashedId) => {
    const res = await fetch(`${BASE_URL}/item/${hashedId}/inspect`, { headers });
    if (!res.ok) { console.warn(`  Inspect ${hashedId} → HTTP ${res.status}`); return null; }
    const d = await res.json();
    return d.item || null;
};

let processed = 0;
let skipped = 0;
const total = recipeItems.size;

for (const [recipeHashedId, recipeName] of recipeItems.entries()) {
    const gearName = recipeName.replace(' Recipe', '').trim();
    processed++;

    // Skip already fetched (only skip if we have correct combat req data)
    if (gearData[gearName]?.combat_req !== undefined) {
        skipped++;
        console.log(`[${processed}/${total}] SKIP (cached): ${gearName}`);
        continue;
    }

    console.log(`[${processed}/${total}] Inspecting recipe: ${recipeName}`);

    // Step 1: Inspect the RECIPE to get the crafted item's hashed_id
    const recipeInspect = await inspect(recipeHashedId);
    await sleep(API_DELAY_MS);

    if (!recipeInspect) {
        console.warn(`  Could not inspect recipe: ${recipeName}`);
        continue;
    }

    const craftedHashedId = recipeInspect.recipe?.result?.hashed_item_id;
    if (!craftedHashedId) {
        console.warn(`  No recipe.result.hashed_item_id for: ${recipeName}`);
        // The item might not be a crafting recipe. Save what we have from recipe inspect.
        gearData[gearName] = {
            name: gearName,
            hashed_id: recipeInspect.hashed_id,
            type: recipeInspect.type,
            quality: recipeInspect.quality,
            image_url: recipeInspect.image_url,
            vendor_price: recipeInspect.vendor_price,
            combat_req: recipeInspect.requirements?.combat ?? null,
            strength_req: recipeInspect.requirements?.strength ?? null,
            requirements: recipeInspect.requirements ?? null,
            stats: null,
            effects: null,
            is_tradeable: recipeInspect.is_tradeable,
            recipe_hashed_id: recipeHashedId,
        };
        fs.writeFileSync(OUT_FILE, JSON.stringify(gearData, null, 2));
        continue;
    }

    console.log(`  → Crafted item hashed_id: ${craftedHashedId}`);

    // Step 2: Inspect the CRAFTED ITEM to get level_req, stats, type
    const itemInspect = await inspect(craftedHashedId);
    await sleep(API_DELAY_MS);

    if (!itemInspect) {
        console.warn(`  Could not inspect crafted item for: ${gearName}`);
        continue;
    }

    gearData[gearName] = {
        name: gearName,
        hashed_id: craftedHashedId,
        type: itemInspect.type,
        quality: itemInspect.quality,
        image_url: itemInspect.image_url,
        vendor_price: itemInspect.vendor_price,
        is_tradeable: itemInspect.is_tradeable,
        combat_req: itemInspect.requirements?.combat ?? null,
        strength_req: itemInspect.requirements?.strength ?? null,
        requirements: itemInspect.requirements ?? null,
        stats: itemInspect.stats ?? null,
        effects: itemInspect.effects ?? null,
        tier_modifiers: itemInspect.tier_modifiers ?? null,
        max_tier: itemInspect.max_tier ?? null,
        recipe_hashed_id: recipeHashedId,
    };

    console.log(`  ✓ ${gearName} | Type: ${itemInspect.type} | Combat Req: ${itemInspect.requirements?.combat ?? 'N/A'} | Str Req: ${itemInspect.requirements?.strength ?? 'N/A'} | Stats: ${JSON.stringify(itemInspect.stats)}`);

    // Save after each item (atomic write)
    const tmpFile = OUT_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(gearData, null, 2));
    fs.renameSync(tmpFile, OUT_FILE);
}

console.log(`\n✅ Done! Fetched ${Object.keys(gearData).length} gear items. Skipped ${skipped} cached.`);
console.log(`Saved to: ${OUT_FILE}`);
