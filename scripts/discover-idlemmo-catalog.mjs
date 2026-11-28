import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  BASE_URL,
  ITEM_SEARCH_TYPES,
  createFetchQueue,
  parseArgs,
  readApiKey,
  resolveRateLimitDelayMs,
  writeJson,
} from "./idlemmo-fetch-utils.mjs";

const __filename = fileURLToPath(import.meta.url);

/** @param {{ typesArg?: string | boolean; allTypes?: readonly string[] }} [opts] */
export function normalizeCatalogSearchParams({ typesArg, allTypes = ITEM_SEARCH_TYPES } = {}) {
  if (!typesArg || typesArg === true) {
    return [...allTypes];
  }
  const requested = String(typesArg)
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  return requested.length > 0 ? Array.from(new Set(requested)) : [...allTypes];
}

export function identifyCatalogGaps(discoveredSearchItems, existingAllItemsDb = {}) {
  const newItems = [];
  const undetailedItems = [];
  const seenHashes = new Set();
  let alreadyKnownCount = 0;

  for (const entry of discoveredSearchItems || []) {
    const hash = entry?.hashed_id;
    if (!hash || seenHashes.has(hash)) continue;
    seenHashes.add(hash);

    const existing = existingAllItemsDb[hash];
    if (!existing) {
      newItems.push(entry);
    } else if (existing._is_detailed !== true) {
      undetailedItems.push(entry);
    } else {
      alreadyKnownCount++;
    }
  }

  return {
    newItems,
    undetailedItems,
    alreadyKnownCount,
  };
}

export function mergeDiscoveredItemIntoCatalog(
  allItemsDb,
  itemsMap,
  inspectedItem,
  nowIso = new Date().toISOString(),
) {
  if (!inspectedItem?.hashed_id) {
    throw new Error("Inspected item must include hashed_id");
  }

  const hash = inspectedItem.hashed_id;
  const normalized = {
    hashed_id: hash,
    name: inspectedItem.name,
    description: inspectedItem.description ?? null,
    image_url: inspectedItem.image_url ?? null,
    type: inspectedItem.type,
    quality: inspectedItem.quality,
    vendor_price: inspectedItem.vendor_price ?? null,
    _is_detailed: true,
    is_tradeable: inspectedItem.is_tradeable ?? true,
    max_tier: inspectedItem.max_tier ?? 1,
    requirements: inspectedItem.requirements ?? null,
    stats: inspectedItem.stats ?? null,
    effects: inspectedItem.effects ?? null,
    tier_modifiers: inspectedItem.tier_modifiers ?? null,
    upgrade_requirements: inspectedItem.upgrade_requirements ?? null,
    health_restore: inspectedItem.health_restore ?? null,
    hunger_restore: inspectedItem.hunger_restore ?? null,
    recipe: inspectedItem.recipe ?? null,
    chest_drops: inspectedItem.chest_drops ?? null,
    pet: inspectedItem.pet ?? null,
    where_to_find: Array.isArray(inspectedItem.where_to_find) ? inspectedItem.where_to_find : [],
    _last_detailed_at: nowIso,
  };

  allItemsDb[hash] = normalized;
  if (itemsMap && typeof itemsMap === "object") {
    itemsMap[hash] = normalized;
  }
  return normalized;
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function runCatalogDiscovery() {
  const args = parseArgs();
  const isDryRun = Boolean(args["dry-run"]);
  const refreshUndetailed = args["refresh-existing"] !== false;
  const skipDerivatives = Boolean(args["skip-derivatives"]);
  const limit = Math.max(0, Number(args.limit || 0));
  const rateProfile = String(args["rate-profile"] || "shared").toLowerCase();
  const delayMs = resolveRateLimitDelayMs({
    explicitDelayMs: args["delay-ms"] ?? args.delay,
    explicitRequestsPerMinute: args["rpm"],
    profile: rateProfile,
  });

  const apiKey = readApiKey();
  if (!apiKey) {
    console.error("IDLEMMO_API_KEY is required in .env or environment.");
    process.exitCode = 1;
    return;
  }

  const root = process.cwd();
  const itemsDbPath = path.join(root, "public", "all-items-db.json");
  const itemsMapPath = path.join(root, "public", "items-map.json");
  const staticDataPath = path.join(root, "public", "static-data.json");

  const allItemsDb = readJsonIfExists(itemsDbPath, {});
  const itemsMap = readJsonIfExists(itemsMapPath, null);
  const staticData = readJsonIfExists(staticDataPath, null);

  const types = normalizeCatalogSearchParams({ typesArg: args.types });
  const queue = createFetchQueue({
    apiKey,
    delayMs,
    label: "catalog-discover",
    reserveRemaining: rateProfile === "isolated" ? 6 : 12,
  });

  console.log(`Catalog discovery scanning ${types.length} item types (${rateProfile} profile, ${delayMs}ms spacing, dryRun=${isDryRun})...`);
  queue.addEstimated(types.length);

  const discoveredEntries = [];
  for (const type of types) {
    let page = 1;
    let lastPage = 1;
    while (page <= lastPage) {
      const url = `${BASE_URL}/item/search?type=${encodeURIComponent(type)}&page=${page}`;
      const envelope = await queue.request(`search:${type}:p${page}`, url, { type, page });
      if (!envelope.meta.ok || !Array.isArray(envelope.data?.items)) {
        console.warn(`  [WARN] Failed search for type=${type} page=${page}: HTTP ${envelope.meta.status}`);
        break;
      }

      discoveredEntries.push(...envelope.data.items);
      const nextLastPage = Number(envelope.data?.pagination?.last_page || 1);
      if (page === 1 && nextLastPage > 1) {
        queue.addEstimated(nextLastPage - 1);
      }
      lastPage = nextLastPage;
      page += 1;
    }
  }

  // Also cross-check combat/boss/dungeon loot names against existing catalog in case any entity drop lacked an entry.
  const knownNamesLower = new Set(Object.values(allItemsDb).map((item) => String(item.name || "").toLowerCase()));
  for (const entry of discoveredEntries) {
    if (entry?.name) knownNamesLower.add(entry.name.toLowerCase());
  }

  const missingLootNames = new Set();
  if (staticData) {
    for (const group of [staticData.enemies, staticData.dungeons, staticData.world_bosses]) {
      for (const entity of group || []) {
        for (const drop of entity?.loot || []) {
          if (drop?.name && !knownNamesLower.has(drop.name.toLowerCase())) {
            missingLootNames.add(drop.name);
          }
        }
      }
    }
  }

  for (const lootName of missingLootNames) {
    const url = `${BASE_URL}/item/search?query=${encodeURIComponent(lootName)}`;
    const envelope = await queue.request(`search:loot:${lootName}`, url, { lootName });
    if (envelope.meta.ok && Array.isArray(envelope.data?.items)) {
      const exact = envelope.data.items.find((item) => item.name?.toLowerCase() === lootName.toLowerCase());
      if (exact) discoveredEntries.push(exact);
    }
  }

  const { newItems, undetailedItems, alreadyKnownCount } = identifyCatalogGaps(discoveredEntries, allItemsDb);
  const toInspect = refreshUndetailed ? [...newItems, ...undetailedItems] : [...newItems];
  const boundedInspect = limit > 0 ? toInspect.slice(0, limit) : toInspect;

  console.log(`\nDiscovery summary:`);
  console.log(`  Scanned items across API types: ${discoveredEntries.length}`);
  console.log(`  Already complete in all-items-db: ${alreadyKnownCount}`);
  console.log(`  New items missing from catalog: ${newItems.length}`);
  console.log(`  Existing items lacking full inspect details: ${undetailedItems.length}`);
  console.log(`  Queued for /inspect: ${boundedInspect.length}${isDryRun ? " (dry-run; skipping /inspect calls & writes)" : ""}`);

  if (newItems.length > 0) {
    console.log(`  New item names: ${newItems.map((i) => `${i.name} [${i.hashed_id}]`).join(", ")}`);
  }

  if (isDryRun || boundedInspect.length === 0) {
    return;
  }

  queue.addEstimated(boundedInspect.length);
  let inspectedCount = 0;
  let errorCount = 0;

  for (const entry of boundedInspect) {
    const url = `${BASE_URL}/item/${encodeURIComponent(entry.hashed_id)}/inspect`;
    const envelope = await queue.request(`inspect:${entry.name || entry.hashed_id}`, url, {
      hashed_id: entry.hashed_id,
    });
    if (!envelope.meta.ok || !envelope.data?.item) {
      console.warn(`  [WARN] Failed to inspect ${entry.hashed_id} (${entry.name}): HTTP ${envelope.meta.status}`);
      errorCount++;
      continue;
    }

    mergeDiscoveredItemIntoCatalog(allItemsDb, itemsMap, envelope.data.item);
    inspectedCount++;
  }

  if (inspectedCount > 0) {
    writeJson(itemsDbPath, allItemsDb);
    console.log(`Updated ${itemsDbPath} with ${inspectedCount} discovered/refreshed items.`);

    if (itemsMap) {
      fs.writeFileSync(itemsMapPath, JSON.stringify(itemsMap));
      console.log(`Synchronized ${itemsMapPath}.`);
    }

    if (!skipDerivatives) {
      console.log("Rebuilding usage map and lore signals...");
      execSync("node scripts/rebuild-usage-map.mjs", { stdio: "inherit" });
      execSync("node scripts/build-item-lore-signals.mjs", { stdio: "inherit" });
    }
  }

  console.log(`Done. Inspected=${inspectedCount}, Errors=${errorCount}.`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  runCatalogDiscovery().catch((error) => {
    console.error("Catalog discovery failed:", error);
    process.exit(1);
  });
}
