import fs from "fs";
import path from "path";

const args = parseArgs();
const cacheDir = path.resolve(String(args.cache || "local_data/idle_mmo_cache"));
const rawDir = path.join(cacheDir, "raw");
const derivedDir = path.join(cacheDir, "derived");

const now = new Date().toISOString();
const warnings = [];

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [key, inlineValue] = token.slice(2).split("=");
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
    } else {
      const next = argv[index + 1];
      parsed[key] = next && !next.startsWith("--") ? next : true;
      if (parsed[key] === next) index += 1;
    }
  }
  return parsed;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readRaw(name) {
  return readJsonIfExists(path.join(rawDir, `${name}.json`));
}

function listRawFiles(pattern) {
  if (!fs.existsSync(rawDir)) return [];
  return fs.readdirSync(rawDir)
    .filter((file) => file.endsWith(".json") && pattern.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function writeDerived(name, data) {
  ensureDir(derivedDir);
  const filePath = path.join(derivedDir, `${name}.json`);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function asString(value) {
  return value === null || value === undefined ? null : String(value);
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactObject(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function envelopeMeta(name, envelope) {
  return {
    raw_file: `${name}.json`,
    fetched_at: envelope?.meta?.fetched_at ?? null,
    endpoint_updates_at: envelope?.meta?.endpoint_updates_at ?? envelope?.data?.endpoint_updates_at ?? null,
    endpoint_url: envelope?.meta?.endpoint_url ?? null,
    status: envelope?.meta?.status ?? null,
    ok: envelope?.meta?.ok ?? null,
  };
}

function normalizeLocation(location) {
  if (!location) return null;
  return compactObject({
    id: asNumber(location.id),
    key: location.key ?? slug(location.name),
    name: location.name ?? null,
    image_url: location.image_url ?? null,
  });
}

function normalizeLoot(loot = []) {
  return loot.map((drop) => compactObject({
    hashed_item_id: drop.hashed_item_id ?? null,
    name: drop.name ?? null,
    image_url: drop.image_url ?? null,
    quality: drop.quality ?? null,
    quantity: asNumber(drop.quantity),
    chance: asNumber(drop.chance),
  }));
}

function addLocation(locationsById, location, source) {
  const normalized = normalizeLocation(location);
  if (!normalized?.id) return null;
  const existing = locationsById.get(normalized.id) || { ...normalized, sources: [] };
  locationsById.set(normalized.id, {
    ...existing,
    ...Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== null)),
    sources: [...new Set([...(existing.sources || []), source])],
  });
  return normalized;
}

function addLootSources(itemDropsByHash, entityType, entity, loot) {
  for (const drop of loot) {
    if (!drop.hashed_item_id) continue;
    const existing = itemDropsByHash.get(drop.hashed_item_id) || {
      hashed_item_id: drop.hashed_item_id,
      name: drop.name,
      image_url: drop.image_url,
      quality: drop.quality,
      sources: [],
    };
    existing.sources.push(compactObject({
      source_type: entityType,
      source_id: entity.id,
      source_name: entity.name,
      location_id: entity.location?.id ?? null,
      location_name: entity.location?.name ?? null,
      chance: drop.chance,
      quantity: drop.quantity,
    }));
    itemDropsByHash.set(drop.hashed_item_id, existing);
  }
}

function buildCombatCaches() {
  const locationsById = new Map();
  const itemDropsByHash = new Map();

  const enemiesEnvelope = readRaw("combat_enemies_list");
  const dungeonsEnvelope = readRaw("combat_dungeons_list");
  const worldBossesEnvelope = readRaw("combat_world_bosses_list");

  const enemies = (enemiesEnvelope?.data?.enemies || []).map((enemy) => {
    const location = addLocation(locationsById, enemy.location, "enemy");
    const loot = normalizeLoot(enemy.loot || []);
    addLootSources(itemDropsByHash, "enemy", { ...enemy, location }, loot);
    return compactObject({
      id: asNumber(enemy.id),
      name: enemy.name,
      image_url: enemy.image_url,
      level: asNumber(enemy.level),
      experience: asNumber(enemy.experience),
      health: asNumber(enemy.health),
      chance_of_loot: asNumber(enemy.chance_of_loot),
      location,
      loot,
    });
  }).sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || String(a.name).localeCompare(String(b.name)));

  const dungeons = (dungeonsEnvelope?.data?.dungeons || []).map((dungeon) => {
    const location = addLocation(locationsById, dungeon.location, "dungeon");
    const loot = normalizeLoot(dungeon.loot || []);
    addLootSources(itemDropsByHash, "dungeon", { ...dungeon, location }, loot);
    return compactObject({
      id: asNumber(dungeon.id),
      name: dungeon.name,
      description: dungeon.description ?? null,
      image_url: dungeon.image_url,
      level_required: asNumber(dungeon.level_required),
      difficulty: asNumber(dungeon.difficulty),
      length_ms: asNumber(dungeon.length),
      length_minutes: dungeon.length ? Math.round(asNumber(dungeon.length) / 60000) : null,
      cost: asNumber(dungeon.cost),
      shards: asNumber(dungeon.shards),
      completion_requirement: asNumber(dungeon.completion_requirement),
      location,
      experience: dungeon.experience ?? null,
      loot,
    });
  }).sort((a, b) => (a.level_required ?? 0) - (b.level_required ?? 0) || String(a.name).localeCompare(String(b.name)));

  const worldBosses = (worldBossesEnvelope?.data?.world_bosses || []).map((boss) => {
    const location = addLocation(locationsById, boss.location, "world_boss");
    const loot = normalizeLoot(boss.loot || []);
    addLootSources(itemDropsByHash, "world_boss", { ...boss, location }, loot);
    return compactObject({
      id: asNumber(boss.id),
      name: boss.name,
      image_url: boss.image_url,
      level: asNumber(boss.level),
      location,
      status: boss.status ?? null,
      battle_starts_at: boss.battle_starts_at ?? null,
      battle_ends_at: boss.battle_ends_at ?? null,
      loot,
    });
  }).sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || String(a.name).localeCompare(String(b.name)));

  return {
    enemies,
    dungeons,
    worldBosses,
    locations: [...locationsById.values()].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
    itemDrops: [...itemDropsByHash.values()].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    sourceMeta: {
      enemies: envelopeMeta("combat_enemies_list", enemiesEnvelope),
      dungeons: envelopeMeta("combat_dungeons_list", dungeonsEnvelope),
      world_bosses: envelopeMeta("combat_world_bosses_list", worldBossesEnvelope),
    },
  };
}

function buildCompanionExchange() {
  const allEnvelope = readRaw("companion_exchange_listings_all");
  const pageFiles = listRawFiles(/^companion_exchange_listings_page_\d+\.json$/);
  const listings = [];
  const pages = [];

  for (const file of pageFiles) {
    const name = file.replace(/\.json$/, "");
    const envelope = readRaw(name);
    const page = envelope?.data?.pagination?.current_page ?? envelope?.meta?.page ?? null;
    const pageListings = envelope?.data?.listings || [];
    pages.push({
      page,
      file,
      count: pageListings.length,
      has_more: envelope?.data?.pagination?.has_more ?? null,
      next_page: envelope?.data?.pagination?.next_page ?? null,
      fetched_at: envelope?.meta?.fetched_at ?? null,
      endpoint_updates_at: envelope?.meta?.endpoint_updates_at ?? envelope?.data?.endpoint_updates_at ?? null,
    });

    for (const listing of pageListings) {
      listings.push(normalizeCompanionListing(listing, page));
    }
  }

  if (listings.length === 0 && allEnvelope?.data?.listings) {
    listings.push(...allEnvelope.data.listings.map((listing) => normalizeCompanionListing(listing, null)));
  }

  const bySpecies = new Map();
  for (const listing of listings) {
    const key = listing.pet.name || `pet-${listing.pet.pet_id}`;
    const bucket = bySpecies.get(key) || {
      pet_id: listing.pet.pet_id,
      name: listing.pet.name,
      listing_count: 0,
      min_price: null,
      max_price: null,
      total_price: 0,
      by_quality: {},
    };
    bucket.listing_count += 1;
    bucket.total_price += listing.cost.amount ?? 0;
    bucket.min_price = bucket.min_price === null ? listing.cost.amount : Math.min(bucket.min_price, listing.cost.amount ?? bucket.min_price);
    bucket.max_price = bucket.max_price === null ? listing.cost.amount : Math.max(bucket.max_price, listing.cost.amount ?? bucket.max_price);

    const quality = listing.pet.quality || "UNKNOWN";
    const qualityBucket = bucket.by_quality[quality] || { count: 0, min_price: null, max_price: null, total_price: 0 };
    qualityBucket.count += 1;
    qualityBucket.total_price += listing.cost.amount ?? 0;
    qualityBucket.min_price = qualityBucket.min_price === null ? listing.cost.amount : Math.min(qualityBucket.min_price, listing.cost.amount ?? qualityBucket.min_price);
    qualityBucket.max_price = qualityBucket.max_price === null ? listing.cost.amount : Math.max(qualityBucket.max_price, listing.cost.amount ?? qualityBucket.max_price);
    bucket.by_quality[quality] = qualityBucket;

    bySpecies.set(key, bucket);
  }

  const marketSummary = [...bySpecies.values()]
    .map((entry) => ({
      ...entry,
      average_price: entry.listing_count ? Math.round(entry.total_price / entry.listing_count) : null,
      by_quality: Object.fromEntries(Object.entries(entry.by_quality).map(([quality, value]) => [
        quality,
        {
          ...value,
          average_price: value.count ? Math.round(value.total_price / value.count) : null,
        },
      ])),
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return {
    listings: listings.sort((a, b) => (a.cost.amount ?? 0) - (b.cost.amount ?? 0)),
    marketSummary,
    pages,
    sourceMeta: {
      all_file: envelopeMeta("companion_exchange_listings_all", allEnvelope),
      page_count: pageFiles.length,
    },
  };
}

function normalizeCompanionListing(listing, page) {
  const pet = listing.pet || {};
  const cost = listing.cost || {};
  return {
    pet: compactObject({
      character_pet_id: asNumber(pet.character_pet_id),
      pet_id: asNumber(pet.pet_id),
      name: pet.name ?? null,
      quality: pet.quality ?? null,
      level: asNumber(pet.level),
      image_url: pet.image_url ?? null,
    }),
    cost: compactObject({
      currency: cost.currency ?? null,
      amount: asNumber(cost.amount),
    }),
    source_page: page,
  };
}

function buildGuildCaches() {
  const conquestEnvelope = readRaw("guild_conquest_view");
  const zoneFiles = listRawFiles(/^guild_conquest_zone_.+\.json$/);
  const infoFiles = listRawFiles(/^guild_\d+_information\.json$/);
  const memberFiles = listRawFiles(/^guild_\d+_members\.json$/);

  const zones = [];
  const guildsById = new Map();
  const membersByGuildId = new Map();
  const contributions = [];

  for (const [key, zone] of Object.entries(conquestEnvelope?.data?.zones || {})) {
    zones.push(normalizeConquestZone(zone, key, "view"));
    collectGuildRows(guildsById, zone.guilds || [], zone.location, "view");
    collectActiveAssaultGuilds(guildsById, zone.active_assaults || []);
  }

  for (const file of zoneFiles) {
    const name = file.replace(/\.json$/, "");
    const envelope = readRaw(name);
    const zone = envelope?.data?.zone;
    if (!zone) continue;
    zones.push(normalizeConquestZone(zone, zone.location?.key, "inspect", file));
    collectGuildRows(guildsById, zone.guilds || [], zone.location, "inspect");
    collectActiveAssaultGuilds(guildsById, zone.active_assaults || []);
    for (const contribution of zone.contributions || []) {
      contributions.push(normalizeContribution(contribution, zone.location, null));
    }
    for (const guildRow of zone.guilds || []) {
      for (const contribution of guildRow.contributions || []) {
        contributions.push(normalizeContribution(contribution, zone.location, guildRow.guild));
      }
    }
  }

  for (const file of infoFiles) {
    const guildId = asNumber(file.match(/^guild_(\d+)_information\.json$/)?.[1]);
    const envelope = readRaw(file.replace(/\.json$/, ""));
    const guild = envelope?.data?.guild;
    if (!guild || !guildId) continue;
    const existing = guildsById.get(guildId) || { id: guildId };
    guildsById.set(guildId, {
      ...existing,
      ...normalizeGuildInfo(guild),
      source_files: [...new Set([...(existing.source_files || []), file])],
    });
  }

  for (const file of memberFiles) {
    const guildId = asNumber(file.match(/^guild_(\d+)_members\.json$/)?.[1]);
    const envelope = readRaw(file.replace(/\.json$/, ""));
    const members = (envelope?.data?.members || []).map((member) => compactObject({
      name: member.name ?? null,
      position: member.position ?? null,
      avatar_url: member.avatar_url ?? null,
      background_url: member.background_url ?? null,
      total_level: asNumber(member.total_level),
    }));
    if (guildId) membersByGuildId.set(guildId, members);
    const guild = envelope?.data?.guild;
    if (guild && guildId) {
      const existing = guildsById.get(guildId) || { id: guildId };
      guildsById.set(guildId, {
        ...existing,
        id: guildId,
        name: existing.name ?? guild.name ?? null,
        member_count: existing.member_count ?? asNumber(guild.member_count),
        source_files: [...new Set([...(existing.source_files || []), file])],
      });
    }
  }

  const guilds = [...guildsById.values()].map((guild) => ({
    ...guild,
    members: membersByGuildId.get(guild.id) || [],
  })).sort((a, b) => (a.season_position ?? 999999) - (b.season_position ?? 999999) || String(a.name).localeCompare(String(b.name)));

  return {
    conquest: {
      zones: dedupeZones(zones),
      contributions: dedupeContributions(contributions),
    },
    guilds,
    sourceMeta: {
      conquest_view: envelopeMeta("guild_conquest_view", conquestEnvelope),
      zone_files: zoneFiles.length,
      guild_information_files: infoFiles.length,
      guild_members_files: memberFiles.length,
    },
  };
}

function normalizeConquestZone(zone, fallbackKey, source, file) {
  return compactObject({
    source,
    source_file: file,
    location: normalizeLocation(zone.location),
    key: zone.location?.key ?? fallbackKey ?? null,
    status: zone.status ?? null,
    colour: zone.colour ?? null,
    kills: asNumber(zone.kills),
    experience: asNumber(zone.experience),
    guilds_count: asNumber(zone.guilds_count),
    active_assaults: (zone.active_assaults || []).map((assault) => compactObject({
      guild: normalizeGuildSummary(assault.guild),
      kills: asNumber(assault.kills),
      experience: asNumber(assault.experience),
      starts_at: assault.starts_at ?? null,
      ends_at: assault.ends_at ?? null,
    })),
    guild_rankings: (zone.guilds || []).map((row) => compactObject({
      progress_id: asNumber(row.id),
      position: asNumber(row.position),
      kills: asNumber(row.kills),
      experience: asNumber(row.experience),
      guild: normalizeGuildSummary(row.guild),
      contribution_count: Array.isArray(row.contributions) ? row.contributions.length : null,
    })),
  });
}

function normalizeGuildSummary(guild) {
  if (!guild) return null;
  return compactObject({
    id: asNumber(guild.id),
    name: guild.name ?? null,
    tag: guild.tag ?? null,
    icon_url: guild.icon_url ?? null,
    background_url: guild.background_url ?? null,
  });
}

function normalizeGuildInfo(guild) {
  return compactObject({
    id: asNumber(guild.id),
    name: guild.name ?? null,
    tag: guild.tag ?? null,
    description: guild.description ?? null,
    experience: asNumber(guild.experience),
    level: asNumber(guild.level),
    icon_url: guild.icon_url ?? null,
    background_url: guild.background_url ?? null,
    member_count: asNumber(guild.member_count),
    season_position: asNumber(guild.season_position),
    marks: asNumber(guild.marks),
  });
}

function collectGuildRows(guildsById, rows, location, source) {
  for (const row of rows) {
    const guild = normalizeGuildSummary(row.guild);
    if (!guild?.id) continue;
    const existing = guildsById.get(guild.id) || { id: guild.id };
    const conquestRow = compactObject({
      source,
      location: normalizeLocation(location),
      progress_id: asNumber(row.id),
      position: asNumber(row.position),
      kills: asNumber(row.kills),
      experience: asNumber(row.experience),
    });
    guildsById.set(guild.id, {
      ...existing,
      ...guild,
      conquest_rows: [...(existing.conquest_rows || []), conquestRow],
    });
  }
}

function collectActiveAssaultGuilds(guildsById, assaults) {
  for (const assault of assaults) {
    const guild = normalizeGuildSummary(assault.guild);
    if (!guild?.id) continue;
    const existing = guildsById.get(guild.id) || { id: guild.id };
    guildsById.set(guild.id, {
      ...existing,
      ...guild,
      active_assault_count: (existing.active_assault_count || 0) + 1,
    });
  }
}

function normalizeContribution(contribution, location, guild) {
  return compactObject({
    id: asNumber(contribution.id),
    guild_conquest_progress_id: asNumber(contribution.guild_conquest_progress_id),
    guild: normalizeGuildSummary(guild),
    location: normalizeLocation(location),
    character: contribution.character ? compactObject({
      id: asNumber(contribution.character.id),
      hashed_id: contribution.character.hashed_id ?? null,
      name: contribution.character.name ?? null,
      total_level: asNumber(contribution.character.total_level),
      image_url: contribution.character.image_url ?? null,
      background_url: contribution.character.background_url ?? null,
    }) : null,
    kills: asNumber(contribution.kills),
    experience: asNumber(contribution.experience),
  });
}

function dedupeZones(zones) {
  const byKeyAndSource = new Map();
  for (const zone of zones) {
    const key = `${zone.key || zone.location?.id || "unknown"}:${zone.source}`;
    byKeyAndSource.set(key, zone);
  }
  return [...byKeyAndSource.values()].sort((a, b) => (a.location?.id ?? 0) - (b.location?.id ?? 0) || String(a.source).localeCompare(String(b.source)));
}

function dedupeContributions(contributions) {
  const byKey = new Map();
  for (const contribution of contributions) {
    const key = [
      contribution.id,
      contribution.guild_conquest_progress_id,
      contribution.location?.id,
      contribution.character?.id,
    ].join(":");
    byKey.set(key, contribution);
  }
  return [...byKey.values()].sort((a, b) => (b.experience ?? 0) - (a.experience ?? 0));
}

function buildCoverage(combat, exchange, guild) {
  const rawFiles = listRawFiles(/.+/);
  const failedRawFiles = rawFiles.filter((file) => {
    const envelope = readRaw(file.replace(/\.json$/, ""));
    return envelope?.meta?.ok === false || (envelope?.meta?.status && envelope.meta.status >= 400);
  });

  const missingFields = {
    enemies: [
      "enemy attack/protection/agility/accuracy are not present",
      "derived hit chance, damage dealt, damage received, battle time are not present",
    ],
    dungeons: [
      "health-loss formula is not present",
      "over-difficulty magic-find formula is not present",
    ],
    world_bosses: [
      "loot EV needs market/custom prices",
      "boss route distances are not present in API response",
    ],
    companion_exchange: [
      "listing endpoint gives listed pet summary only; no full stat/evolution details beyond quality/level in public listing response",
    ],
    guilds: [
      "guild member endpoint does not include hashed character IDs",
      "guild info/member cache only covers guilds discoverable from conquest/current explicit ids",
    ],
  };

  return {
    generated_at: now,
    raw_dir: rawDir,
    derived_dir: derivedDir,
    raw_file_count: rawFiles.length,
    failed_raw_files: failedRawFiles,
    counts: {
      enemies: combat.enemies.length,
      dungeons: combat.dungeons.length,
      world_bosses: combat.worldBosses.length,
      locations: combat.locations.length,
      item_drop_records: combat.itemDrops.length,
      companion_exchange_listings: exchange.listings.length,
      companion_exchange_species: exchange.marketSummary.length,
      conquest_zones: guild.conquest.zones.length,
      conquest_contributions: guild.conquest.contributions.length,
      guilds: guild.guilds.length,
      guild_members: guild.guilds.reduce((sum, entry) => sum + (entry.members?.length || 0), 0),
    },
    source_meta: {
      ...combat.sourceMeta,
      companion_exchange: exchange.sourceMeta,
      guild: guild.sourceMeta,
    },
    missing_fields: missingFields,
    warnings,
  };
}

function main() {
  if (!fs.existsSync(rawDir)) {
    throw new Error(`Raw cache directory does not exist: ${rawDir}`);
  }

  ensureDir(derivedDir);

  const combat = buildCombatCaches();
  const exchange = buildCompanionExchange();
  const guild = buildGuildCaches();
  const coverage = buildCoverage(combat, exchange, guild);

  writeDerived("enemies", { meta: coverage.source_meta.enemies, data: combat.enemies });
  writeDerived("dungeons", { meta: coverage.source_meta.dungeons, data: combat.dungeons });
  writeDerived("world_bosses", { meta: coverage.source_meta.world_bosses, data: combat.worldBosses });
  writeDerived("locations", { meta: { generated_at: now }, data: combat.locations });
  writeDerived("item_drops", { meta: { generated_at: now }, data: combat.itemDrops });
  writeDerived("companion_exchange", {
    meta: { generated_at: now, ...exchange.sourceMeta },
    data: {
      listings: exchange.listings,
      market_summary: exchange.marketSummary,
      pages: exchange.pages,
    },
  });
  writeDerived("guild_conquest", {
    meta: { generated_at: now, ...guild.sourceMeta },
    data: guild.conquest,
  });
  writeDerived("guilds", {
    meta: { generated_at: now, ...guild.sourceMeta },
    data: guild.guilds,
  });
  writeDerived("coverage_report", { meta: { generated_at: now }, data: coverage });
  writeDerived("manifest", {
    meta: { generated_at: now },
    data: {
      files: [
        "coverage_report.json",
        "locations.json",
        "enemies.json",
        "dungeons.json",
        "world_bosses.json",
        "item_drops.json",
        "companion_exchange.json",
        "guild_conquest.json",
        "guilds.json",
      ],
      counts: coverage.counts,
    },
  });

  console.log("Derived cache generated.");
  console.log(`Raw files: ${coverage.raw_file_count}`);
  console.log(`Output: ${derivedDir}`);
  console.log(JSON.stringify(coverage.counts, null, 2));
  if (failedRawFilesMessage(coverage)) console.warn(failedRawFilesMessage(coverage));
}

function failedRawFilesMessage(coverage) {
  if (!coverage.failed_raw_files.length) return "";
  return `Warning: ${coverage.failed_raw_files.length} raw files had non-OK responses. See coverage_report.json.`;
}

main();
