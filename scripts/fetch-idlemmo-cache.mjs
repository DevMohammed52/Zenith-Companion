import path from "path";
import {
  BASE_URL,
  createFetchQueue,
  ensureDir,
  parseArgs,
  readApiKey,
  safeSlug,
  toArray,
  writeJson,
} from "./idlemmo-fetch-utils.mjs";

const args = parseArgs();
const outDir = path.resolve(String(args.out || "local_data/idle_mmo_cache"));
const rawDir = path.join(outDir, "raw");
const derivedDir = path.join(outDir, "derived");
const apiKey = readApiKey();

const itemHashes = toArray(args["item-hash"]);
const guildIds = toArray(args["guild-id"]);
const petCharacterHashes = toArray(args["pet-character-hash"] || args["character-pets-hash"]);
const includeZoneInspect = args["zone-inspect"] !== false;
const maxExchangePages = Number(args["max-exchange-pages"] || 0);
const itemTier = Number(args["item-tier"] || 0);
const marketHistoryTypes = toArray(args["market-history-type"] || "listings");
const seasonNumber = args["season-number"] || args.season;
const includeGuildDetails = Boolean(args["guild-details"] || args["all-guild-data"]);

ensureDir(rawDir);
ensureDir(derivedDir);

const queue = createFetchQueue({ apiKey, label: "cache" });

function saveRaw(name, envelope) {
  writeJson(path.join(rawDir, `${name}.json`), envelope);
}

function saveDerivedPlaceholder() {
  writeJson(path.join(derivedDir, "README.json"), {
    note: "Derived app-friendly datasets will be generated here after raw API coverage is reviewed.",
    generated_at: new Date().toISOString(),
  });
}

async function fetchAndSave(name, url, metadata = {}) {
  const envelope = await queue.request(name, url, metadata);
  saveRaw(name, envelope);
  return envelope;
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

async function fetchCompanionExchange() {
  const allListings = [];
  const pageNames = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    if (maxExchangePages > 0 && page > maxExchangePages) break;

    const name = `companion_exchange_listings_page_${page}`;
    const envelope = await fetchAndSave(
      name,
      `${BASE_URL}/pets/companion-exchange/listings?page=${page}`,
      { page },
    );

    const listings = envelope.data?.listings || [];
    allListings.push(...listings);
    pageNames.push(name);
    hasMore = Boolean(envelope.data?.pagination?.has_more);
    page = Number(envelope.data?.pagination?.next_page || page + 1);
  }

  saveRaw("companion_exchange_listings_all", {
    meta: {
      fetched_at: new Date().toISOString(),
      source_pages: pageNames,
      count: allListings.length,
    },
    data: { listings: allListings },
  });
}

function collectGuildIdsFromZone(zone, discoveredGuildIds) {
  for (const assault of zone?.active_assaults || []) {
    if (assault?.guild?.id) discoveredGuildIds.add(String(assault.guild.id));
  }

  for (const row of zone?.guilds || []) {
    if (row?.guild?.id) discoveredGuildIds.add(String(row.guild.id));
  }
}

async function fetchGuildDetailsFromConquest(conquestEnvelope) {
  const zones = conquestEnvelope.data?.zones || {};
  const discoveredGuildIds = new Set(guildIds);
  const inspectedZones = [];

  for (const zone of Object.values(zones)) {
    collectGuildIdsFromZone(zone, discoveredGuildIds);

    if (includeZoneInspect && zone?.location?.id) {
      const zoneEnvelope = await fetchAndSave(
        `guild_conquest_zone_${safeSlug(zone.location.key || zone.location.id)}`,
        addQuery(`${BASE_URL}/guild/conquest/zone/${zone.location.id}/inspect`, {
          season_number: seasonNumber,
        }),
        { zone_id: zone.location.id, zone_name: zone.location.name, season_number: seasonNumber || null },
      );

      inspectedZones.push(zone.location.id);
      collectGuildIdsFromZone(zoneEnvelope.data?.zone, discoveredGuildIds);
    }
  }

  for (const guildId of discoveredGuildIds) {
    const slug = safeSlug(guildId);
    await fetchAndSave(`guild_${slug}_information`, `${BASE_URL}/guild/${guildId}/information`, { guild_id: guildId });
    await fetchAndSave(`guild_${slug}_members`, `${BASE_URL}/guild/${guildId}/members`, { guild_id: guildId });
  }

  saveRaw("guild_discovered_ids", {
    meta: {
      fetched_at: new Date().toISOString(),
      count: discoveredGuildIds.size,
      season_number: seasonNumber || null,
      zone_inspect: includeZoneInspect,
      inspected_zones: inspectedZones,
    },
    data: {
      guild_ids: [...discoveredGuildIds].sort((a, b) => Number(a) - Number(b)),
    },
  });
}

async function fetchCharacterPetCollections() {
  for (const hash of petCharacterHashes) {
    const slug = safeSlug(hash);
    await fetchAndSave(
      `character_${slug}_pets`,
      `${BASE_URL}/character/${encodeURIComponent(hash)}/pets`,
      { hashed_character_id: hash },
    );
  }
}

async function fetchItemDetails() {
  for (const hash of itemHashes) {
    const slug = safeSlug(hash);
    await fetchAndSave(`item_${slug}_inspect`, `${BASE_URL}/item/${hash}/inspect`, { hashed_item_id: hash });

    for (const type of marketHistoryTypes) {
      await fetchAndSave(
        `item_${slug}_market_history_${safeSlug(type)}_tier_${itemTier}`,
        `${BASE_URL}/item/${hash}/market-history?tier=${itemTier}&type=${encodeURIComponent(type)}`,
        { hashed_item_id: hash, tier: itemTier, market_history_type: type },
      );
    }
  }
}

async function main() {
  console.log(`Writing raw API cache to ${rawDir}`);
  console.log("This script uses one request queue and respects the 60/min IdleMMO limit.");

  const enemies = await fetchAndSave("combat_enemies_list", `${BASE_URL}/combat/enemies/list`);
  const dungeons = await fetchAndSave("combat_dungeons_list", `${BASE_URL}/combat/dungeons/list`);
  const worldBosses = await fetchAndSave("combat_world_bosses_list", `${BASE_URL}/combat/world_bosses/list`);
  const conquest = await fetchAndSave(
    "guild_conquest_view",
    addQuery(`${BASE_URL}/guild/conquest/view`, { season_number: seasonNumber }),
    { season_number: seasonNumber || null },
  );

  await fetchCompanionExchange();
  if (includeGuildDetails) await fetchGuildDetailsFromConquest(conquest);
  if (petCharacterHashes.length > 0) await fetchCharacterPetCollections();
  if (itemHashes.length > 0) await fetchItemDetails();

  saveRaw("manifest", {
    meta: {
      fetched_at: new Date().toISOString(),
      output_dir: outDir,
      stats: queue.stats(),
      optional_flags: {
        guild_details: includeGuildDetails,
        zone_inspect: includeZoneInspect,
        season_number: seasonNumber || null,
        item_hashes: itemHashes.length,
        pet_character_hashes: petCharacterHashes.length,
      },
    },
    data: {
      files: [
        "combat_enemies_list",
        "combat_dungeons_list",
        "combat_world_bosses_list",
        "guild_conquest_view",
        "companion_exchange_listings_all",
      ],
      counts: {
        enemies: enemies.meta.count,
        dungeons: dungeons.meta.count,
        world_bosses: worldBosses.meta.count,
      },
    },
  });
  saveDerivedPlaceholder();

  console.log("Done.");
  console.log(`Raw files: ${rawDir}`);
  console.log(`Derived placeholder: ${derivedDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
