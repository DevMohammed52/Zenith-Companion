import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  BASE_URL,
  createFetchQueue,
  parseArgs,
  readApiKey,
  writeJson,
} from "./idlemmo-fetch-utils.mjs";

const args = parseArgs();
const isDryRun = Boolean(args["dry-run"]);
const fishOnly = Boolean(args["fish-only"]);
const limit = Number(args.limit || 0);
const targetHash = args.hash ? String(args.hash).trim() : null;
const skipDerivatives = Boolean(args["skip-derivatives"]);

const ITEMS_FILE = path.join(process.cwd(), "public", "all-items-db.json");
const ITEMS_MAP_FILE = path.join(process.cwd(), "public", "items-map.json");
const apiKey = readApiKey();

if (!apiKey) {
  console.error("Error: IDLEMMO_API_KEY is required in .env");
  process.exit(1);
}

// 1. Pre-flight GitHub Action check
try {
  const ghStatus = execSync("gh run list --limit 1", { encoding: "utf8" });
  if (ghStatus.includes("in_progress")) {
    console.error("❌ SAFETY ABORT: A GitHub Actions workflow is currently in_progress!");
    console.error(ghStatus);
    console.error("Wait for the workflow to complete before running local API updates.");
    process.exit(1);
  }
} catch {
  // If gh is not installed or unavailable in PATH, proceed with caution
}

const allItems = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf8"));
const itemsMap = fs.existsSync(ITEMS_MAP_FILE)
  ? JSON.parse(fs.readFileSync(ITEMS_MAP_FILE, "utf8"))
  : null;

// Fish regex for detecting deprecated fish materials
const FISH_REGEX = /fish|sardine|herring|salmon|cod|tuna|pike|trout|bass|swordfish|shark/i;

// Filter candidate forge recipe items
let candidateEntries = Object.entries(allItems).filter(([id, item]) => {
  if (item.type !== "RECIPE" || item.recipe?.skill !== "Forge") return false;
  if (targetHash && item.hashed_id !== targetHash && id !== targetHash) return false;
  if (fishOnly) {
    const materials = item.recipe?.materials || [];
    return materials.some((m) => FISH_REGEX.test(m.item_name || ""));
  }
  return true;
});

if (limit > 0) {
  candidateEntries = candidateEntries.slice(0, limit);
}

console.log(`=== IdleMMO Forge Recipe Refresh ===`);
console.log(`Total candidate forge recipes to inspect: ${candidateEntries.length}`);
console.log(`Mode: ${isDryRun ? "DRY-RUN (no files modified)" : "LIVE WRITE"}`);
console.log(`Fish-only filter: ${fishOnly ? "YES" : "NO"}`);
console.log(`API Key Rate Budget: 60 req/min (using 1100ms safe spacing)`);
console.log(`Target files: all-items-db.json${itemsMap ? " & items-map.json" : ""}`);
console.log(`====================================\n`);

// Create safe queue with 1100ms delay (~54 req/min, safely below 60 req/min)
const queue = createFetchQueue({
  apiKey,
  delayMs: 1100,
  label: "forge-sync",
});

queue.addEstimated(candidateEntries.length);

const changes = [];
const missingMaterialWarnings = [];
let unchangedCount = 0;
let errorCount = 0;

for (let i = 0; i < candidateEntries.length; i++) {
  const [key, item] = candidateEntries[i];
  const hash = item.hashed_id || key;
  const name = item.name || hash;

  try {
    const url = `${BASE_URL}/item/${encodeURIComponent(hash)}/inspect`;
    const envelope = await queue.request(name, url, { hashed_id: hash });

    if (!envelope.meta.ok || !envelope.data?.item) {
      console.warn(`  [WARN] Failed to fetch item ${hash} (${name}): HTTP ${envelope.meta.status}`);
      errorCount++;
      continue;
    }

    const liveItem = envelope.data.item;
    const oldRecipe = item.recipe;
    const newRecipe = liveItem.recipe;

    if (!newRecipe) {
      console.warn(`  [WARN] Live item ${hash} has no recipe!`);
      continue;
    }

    // Verify all returned materials exist in our database
    for (const mat of newRecipe.materials || []) {
      const matId = mat.hashed_item_id;
      const matName = mat.item_name;
      const exists = (matId && allItems[matId]) || Object.values(allItems).some((x) => x.name === matName);
      if (!exists) {
        missingMaterialWarnings.push({ recipe: name, material: matName, materialId: matId });
        console.warn(`    ⚠️ Unknown material in ${name}: ${matName} (${matId})`);
      }
    }

    // Detect changes
    const oldMats = (oldRecipe?.materials || []).map((m) => `${m.item_name} x${m.quantity}`).join(", ");
    const newMats = (newRecipe?.materials || []).map((m) => `${m.item_name} x${m.quantity}`).join(", ");
    const hadFish = (oldRecipe?.materials || []).some((m) => FISH_REGEX.test(m.item_name || ""));
    const hasFish = (newRecipe?.materials || []).some((m) => FISH_REGEX.test(m.item_name || ""));

    const levelChanged = oldRecipe?.level_required !== newRecipe?.level_required;
    const expChanged = oldRecipe?.experience !== newRecipe?.experience;
    const matsChanged = oldMats !== newMats;

    if (matsChanged || levelChanged || expChanged || hadFish !== hasFish) {
      changes.push({
        hash,
        name,
        hadFish,
        hasFish,
        oldLevel: oldRecipe?.level_required,
        newLevel: newRecipe?.level_required,
        oldExp: oldRecipe?.experience,
        newExp: newRecipe?.experience,
        oldMats,
        newMats,
      });

      console.log(`  [CHANGED] ${name}`);
      if (hadFish && !hasFish) {
        console.log(`    -> PURGED FISH! Replaced with: ${newMats}`);
      }
      if (levelChanged) {
        console.log(`    -> Level: ${oldRecipe?.level_required} -> ${newRecipe?.level_required}`);
      }
      if (expChanged) {
        console.log(`    -> Exp: ${oldRecipe?.experience} -> ${newRecipe?.experience}`);
      }

      // Update all-items-db in memory
      if (!isDryRun) {
        item.recipe = newRecipe;
        if (liveItem.where_to_find) item.where_to_find = liveItem.where_to_find;
        if (liveItem.vendor_price !== undefined) item.vendor_price = liveItem.vendor_price;
        item._is_detailed = true;
        item._last_detailed_at = new Date().toISOString();

        // Also update items-map if present
        if (itemsMap) {
          const mapItem = itemsMap[hash] || itemsMap[key];
          if (mapItem) {
            mapItem.recipe = newRecipe;
            if (liveItem.where_to_find) mapItem.where_to_find = liveItem.where_to_find;
            if (liveItem.vendor_price !== undefined) mapItem.vendor_price = liveItem.vendor_price;
            mapItem._is_detailed = true;
            mapItem._last_detailed_at = item._last_detailed_at;
          }
        }
      }
    } else {
      unchangedCount++;
    }
  } catch (err) {
    console.error(`  [ERROR] Item ${hash} (${name}):`, err.message);
    errorCount++;
  }
}

console.log(`\n====================================`);
console.log(`Forge Recipe Refresh Summary:`);
console.log(`  Total Inspected: ${candidateEntries.length}`);
console.log(`  Changed Recipes: ${changes.length}`);
console.log(`  Fish Purged Count: ${changes.filter((c) => c.hadFish && !c.hasFish).length}`);
console.log(`  Unchanged Recipes: ${unchangedCount}`);
console.log(`  Material Warnings: ${missingMaterialWarnings.length}`);
console.log(`  Errors: ${errorCount}`);
console.log(`====================================\n`);

if (!isDryRun && changes.length > 0) {
  console.log(`Writing updated items to ${ITEMS_FILE}...`);
  writeJson(ITEMS_FILE, allItems);
  console.log(`Successfully saved ${ITEMS_FILE}!`);

  if (itemsMap) {
    console.log(`Writing synchronized items to ${ITEMS_MAP_FILE}...`);
    fs.writeFileSync(ITEMS_MAP_FILE, JSON.stringify(itemsMap));
    console.log(`Successfully saved ${ITEMS_MAP_FILE}!`);
  }

  if (!skipDerivatives) {
    console.log(`\nRebuilding derivative maps & manifests...`);
    execSync("node scripts/rebuild-usage-map.mjs", { stdio: "inherit" });
    execSync("node scripts/build-item-lore-signals.mjs", { stdio: "inherit" });
    execSync("node scripts/build-offline-cache-manifest.mjs", { stdio: "inherit" });
    console.log(`All relational maps & manifests regenerated!`);
  }
} else if (isDryRun) {
  console.log(`Dry-run complete. No files were modified.`);
}
