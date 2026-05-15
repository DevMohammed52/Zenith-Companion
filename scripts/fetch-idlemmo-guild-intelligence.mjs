import path from "path";
import {
  BASE_URL,
  createFetchQueue,
  ensureDir,
  parseArgs,
  readApiKey,
  resolveRateLimitDelayMs,
  safeSlug,
  toArray,
  writeJson,
} from "./idlemmo-fetch-utils.mjs";

const args = parseArgs();

const outDir = path.resolve(String(args.out || "local_data/guild_intelligence"));
const rawDir = path.join(outDir, "raw");
const derivedDir = path.join(outDir, "derived");
const apiKey = readApiKey();
const rateProfile = String(args["rate-profile"] || process.env.IDLEMMO_RATE_PROFILE || "shared").toLowerCase();
const delayMs = resolveRateLimitDelayMs({
  explicitDelayMs: args["delay-ms"],
  explicitRequestsPerMinute: args.rpm || args["requests-per-minute"],
  profile: rateProfile,
});
const seasonNumber = args["season-number"] || args.season;
const includeZoneInspect = args["zone-inspect"] !== false;
const includeHall = Boolean(args["include-hall"] || args["permissioned"]);
const includeEnergizingPool = Boolean(args["include-energizing-pool"] || args["permissioned"]);
const extraGuildIds = toArray(args["guild-id"] || args.id);
const maxGuilds = Number(args["max-guilds"] || 0);
const guildRange = parseGuildRange(args["guild-id-range"] || args["scan-guild-ids"]);
const scanStartId = Number(args["start-id"] || guildRange?.start || 0);
const scanEndId = Number(args["end-id"] || args["max-guild-id"] || guildRange?.end || 0);
const scanAllGuilds = Boolean(args["all-guilds"]);
const stopAfterMisses = Number(args["stop-after-misses"] || (scanAllGuilds ? 300 : 0));
const sourceModes = new Set(
  toArray(args.source || args.sources || (scanAllGuilds || scanEndId ? "range" : "conquest")).map((mode) =>
    mode.toLowerCase(),
  ),
);
const shouldFetchConquest = sourceModes.has("conquest") || sourceModes.has("both");
const shouldScanGuildIds = scanAllGuilds || scanEndId > 0 || sourceModes.has("range") || sourceModes.has("both");

ensureDir(rawDir);
ensureDir(derivedDir);

const queue = createFetchQueue({ apiKey, delayMs, label: "guild-intel" });

function parseGuildRange(value) {
  if (!value) return null;
  const [start, end] = String(value).split(/[:.-]+/).map((part) => Number(part.trim()));
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
    throw new Error(`Invalid guild id range: ${value}. Use a format like --guild-id-range 1:2000`);
  }
  return { start, end };
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

function saveRaw(name, envelope) {
  writeJson(path.join(rawDir, `${name}.json`), envelope);
}

function saveDerived(name, data) {
  writeJson(path.join(derivedDir, `${name}.json`), data);
}

async function fetchAndSave(name, url, metadata = {}) {
  const envelope = await queue.request(name, url, metadata);
  saveRaw(name, envelope);
  return envelope;
}

async function fetchEnvelope(name, url, metadata = {}) {
  return queue.request(name, url, metadata);
}

function normalizeNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function collectGuildFromSummary(guild, guildsById, context = {}) {
  if (!guild?.id) return;
  const id = String(guild.id);
  const existing = guildsById.get(id) || {
    id: guild.id,
    name: guild.name || "",
    tag: guild.tag || null,
    icon_url: guild.icon_url || null,
    background_url: guild.background_url || null,
    discovered_from: [],
    zones: [],
  };

  existing.name = guild.name || existing.name;
  existing.tag = guild.tag ?? existing.tag;
  existing.icon_url = guild.icon_url || existing.icon_url;
  existing.background_url = guild.background_url || existing.background_url;

  if (context.source && !existing.discovered_from.includes(context.source)) {
    existing.discovered_from.push(context.source);
  }
  if (context.zone_key) {
    const hasZone = existing.zones.some((zone) => zone.key === context.zone_key);
    if (!hasZone) {
      existing.zones.push({
        key: context.zone_key,
        id: context.zone_id ?? null,
        name: context.zone_name ?? context.zone_key,
        position: context.position ?? null,
        kills: context.kills ?? null,
        experience: context.experience ?? null,
      });
    }
  }

  guildsById.set(id, existing);
}

function collectGuildFromInformationEnvelope(envelope, guildsById, context = {}) {
  const guild = envelope?.data?.guild;
  if (!guild?.id) return null;
  collectGuildFromSummary(guild, guildsById, context);
  return guildsById.get(String(guild.id));
}

function collectGuildsFromZone(zone, guildsById, source) {
  const location = zone?.location || {};
  const zoneContext = {
    source,
    zone_id: location.id ?? null,
    zone_key: location.key ?? safeSlug(location.name || location.id, "unknown-zone"),
    zone_name: location.name || "",
  };

  for (const assault of zone?.active_assaults || []) {
    collectGuildFromSummary(assault.guild, guildsById, {
      ...zoneContext,
      source: `${source}:active_assault`,
      kills: normalizeNumber(assault.kills),
      experience: normalizeNumber(assault.experience),
    });
  }

  for (const row of zone?.guilds || []) {
    collectGuildFromSummary(row.guild, guildsById, {
      ...zoneContext,
      source: `${source}:leaderboard`,
      position: row.position ?? null,
      kills: normalizeNumber(row.kills),
      experience: normalizeNumber(row.experience),
    });
  }
}

function summarizeConquestZone(zone, inspectedEnvelope = null) {
  const location = zone?.location || {};
  const inspectedZone = inspectedEnvelope?.data?.zone || null;
  const contributions = inspectedZone?.contributions || [];

  return {
    id: location.id ?? null,
    key: location.key ?? safeSlug(location.name || location.id, "unknown-zone"),
    name: location.name || "",
    image_url: location.image_url || null,
    status: zone?.status || null,
    colour: zone?.colour || null,
    kills: normalizeNumber(zone?.kills),
    experience: normalizeNumber(zone?.experience),
    guilds_count: Number(zone?.guilds_count || 0),
    active_assaults_count: Array.isArray(zone?.active_assaults) ? zone.active_assaults.length : 0,
    leaderboard_count: Array.isArray(zone?.guilds) ? zone.guilds.length : 0,
    contribution_count: Array.isArray(contributions) ? contributions.length : 0,
    top_guilds: (zone?.guilds || []).slice(0, 5).map((row) => ({
      position: row.position ?? null,
      kills: normalizeNumber(row.kills),
      experience: normalizeNumber(row.experience),
      guild: row.guild || null,
    })),
    top_contributors: contributions.slice(0, 10).map((row) => ({
      id: row.id,
      guild_conquest_progress_id: row.guild_conquest_progress_id,
      kills: normalizeNumber(row.kills),
      experience: normalizeNumber(row.experience),
      character: row.character
        ? {
            hashed_id: row.character.hashed_id,
            name: row.character.name,
            total_level: row.character.total_level,
            image_url: row.character.image_url,
            background_url: row.character.background_url,
          }
        : null,
    })),
  };
}

function summarizeGuild(guildId, infoEnvelope, membersEnvelope, hallEnvelope, poolEnvelope, discoveredGuild) {
  const guild = infoEnvelope?.data?.guild || discoveredGuild || { id: Number(guildId) };
  const members = membersEnvelope?.data?.members || [];
  const guildHall = hallEnvelope?.data?.guild_hall || null;
  const energizingPool = poolEnvelope?.data?.energizing_pool || null;

  return {
    id: guild.id ?? Number(guildId),
    name: guild.name || discoveredGuild?.name || "",
    tag: guild.tag ?? discoveredGuild?.tag ?? null,
    description: guild.description ?? null,
    experience: normalizeNumber(guild.experience),
    level: guild.level ?? null,
    marks: guild.marks ?? null,
    season_position: guild.season_position ?? null,
    member_count: guild.member_count ?? membersEnvelope?.data?.guild?.member_count ?? members.length,
    icon_url: guild.icon_url || discoveredGuild?.icon_url || null,
    background_url: guild.background_url || discoveredGuild?.background_url || null,
    discovered_from: discoveredGuild?.discovered_from || [],
    zones: discoveredGuild?.zones || [],
    members: members.map((member) => ({
      id: member.id,
      hashed_id: member.hashed_id,
      name: member.name,
      position: member.position,
      total_level: member.total_level,
      image_url: member.image_url,
      background_url: member.background_url,
    })),
    hall: guildHall
      ? {
          id: guildHall.id,
          name: guildHall.name,
          location: guildHall.location || null,
          slots: guildHall.slots || null,
          upgrades_count: Array.isArray(guildHall.upgrades) ? guildHall.upgrades.length : 0,
          blueprints_count: Array.isArray(guildHall.blueprints) ? guildHall.blueprints.length : 0,
        }
      : null,
    energizing_pool: energizingPool
      ? {
          status: energizingPool.status ?? null,
          ends_at: energizingPool.ends_at ?? null,
          ends_in: energizingPool.ends_in ?? null,
          participants_count: Array.isArray(energizingPool.participants) ? energizingPool.participants.length : null,
        }
      : null,
  };
}

async function discoverGuildsByIdRange(guildsById, endpointStatuses, infoEnvelopesByGuildId) {
  if (!shouldScanGuildIds) return [];

  const start = scanStartId || 1;
  const end = scanEndId || Number(args["max-guild-id"] || 5000);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
    throw new Error("Guild ID scan requires a valid --guild-id-range start:end or --start-id/--end-id.");
  }

  console.log(`Scanning guild IDs ${start}..${end}. This costs one request per ID before member fetches.`);
  if (stopAfterMisses > 0) {
    console.log(`Stopping early after ${stopAfterMisses} consecutive missing guild IDs.`);
  }

  const validGuilds = [];
  const statusCounts = {};
  let consecutiveMisses = 0;
  let scannedThrough = start - 1;
  for (let guildId = start; guildId <= end; guildId += 1) {
    scannedThrough = guildId;
    const envelope = await fetchEnvelope(
      `guild_${guildId}_information_scan`,
      `${BASE_URL}/guild/${guildId}/information`,
      { guild_id: guildId, discovery_source: "id_range_scan" },
    );

    statusCounts[envelope.meta.status] = (statusCounts[envelope.meta.status] || 0) + 1;

    if (envelope.meta.ok && envelope.data?.guild?.id) {
      consecutiveMisses = 0;
      const slug = safeSlug(guildId);
      saveRaw(`guild_${slug}_information`, envelope);
      endpointStatuses.push(envelope.meta);
      infoEnvelopesByGuildId.set(String(envelope.data.guild.id), envelope);
      const discovered = collectGuildFromInformationEnvelope(envelope, guildsById, { source: "id_range_scan" });
      validGuilds.push(discovered);
      console.log(`  valid guild ${guildId}: ${discovered?.name || "unknown"}`);
    } else {
      consecutiveMisses += 1;
      if (stopAfterMisses > 0 && consecutiveMisses >= stopAfterMisses) {
        console.log(`  stopping at guild id ${guildId}; ${consecutiveMisses} consecutive misses.`);
        break;
      }
    }
  }

  saveRaw("guild_id_scan_manifest", {
    meta: {
      fetched_at: new Date().toISOString(),
      start_id: start,
      end_id: end,
      scanned_through_id: scannedThrough,
      total_ids_scanned: scannedThrough - start + 1,
      valid_guilds: validGuilds.length,
      stop_after_misses: stopAfterMisses || null,
      stopped_after_consecutive_misses: stopAfterMisses > 0 && consecutiveMisses >= stopAfterMisses,
      status_counts: statusCounts,
      stats: queue.stats(),
    },
    data: {
      guild_ids: validGuilds.map((guild) => guild.id),
      guilds: validGuilds,
    },
  });

  return validGuilds;
}

async function main() {
  console.log(`Writing guild intelligence to ${outDir}`);
  console.log(`Rate profile: ${rateProfile}. Delay: ${delayMs}ms between requests. This stays under the 60 req/min API limit.`);
  console.log(`Discovery sources: ${[...sourceModes].join(", ")}`);
  if (shouldScanGuildIds) {
    console.log("Guild-first mode: scanning guild IDs, then fetching members for valid guilds.");
  }
  if (shouldFetchConquest) {
    console.log("Conquest mode: fetching conquest view and zone inspections.");
  }
  if (includeHall || includeEnergizingPool) {
    console.log("Permission-sensitive guild endpoints enabled.");
  }

  const fetchedAt = new Date().toISOString();
  const guildsById = new Map();
  const inspectedZonesByKey = new Map();
  const endpointStatuses = [];
  const infoEnvelopesByGuildId = new Map();
  let conquest = null;
  let zones = {};

  await discoverGuildsByIdRange(guildsById, endpointStatuses, infoEnvelopesByGuildId);

  if (shouldFetchConquest) {
    conquest = await fetchAndSave(
      "guild_conquest_view",
      addQuery(`${BASE_URL}/guild/conquest/view`, { season_number: seasonNumber }),
      { season_number: seasonNumber || null },
    );

    zones = conquest.data?.zones || {};
    endpointStatuses.push(conquest.meta);
    for (const zone of Object.values(zones)) {
      collectGuildsFromZone(zone, guildsById, "conquest_view");

      if (includeZoneInspect && zone?.location?.id) {
        const key = zone.location.key || safeSlug(zone.location.name || zone.location.id, "unknown-zone");
        const zoneEnvelope = await fetchAndSave(
          `guild_conquest_zone_${safeSlug(key)}`,
          addQuery(`${BASE_URL}/guild/conquest/zone/${zone.location.id}/inspect`, {
            season_number: seasonNumber,
          }),
          { zone_id: zone.location.id, zone_key: key, zone_name: zone.location.name, season_number: seasonNumber || null },
        );

        endpointStatuses.push(zoneEnvelope.meta);
        inspectedZonesByKey.set(key, zoneEnvelope);
        collectGuildsFromZone(zoneEnvelope.data?.zone, guildsById, "zone_inspect");
      }
    }
  }

  for (const guildId of extraGuildIds) {
    collectGuildFromSummary({ id: Number(guildId) || guildId }, guildsById, { source: "manual_arg" });
  }

  const discoveredGuilds = [...guildsById.values()].sort((a, b) => Number(a.id) - Number(b.id));
  const guildsToFetch = maxGuilds > 0 ? discoveredGuilds.slice(0, maxGuilds) : discoveredGuilds;
  const skippedGuilds = discoveredGuilds.slice(guildsToFetch.length);

  const guildSummaries = [];

  for (const discoveredGuild of guildsToFetch) {
    const guildId = String(discoveredGuild.id);
    const slug = safeSlug(guildId);
    const info =
      infoEnvelopesByGuildId.get(guildId) ||
      (await fetchAndSave(`guild_${slug}_information`, `${BASE_URL}/guild/${guildId}/information`, {
        guild_id: guildId,
      }));
    if (!infoEnvelopesByGuildId.has(guildId)) endpointStatuses.push(info.meta);

    const members = await fetchAndSave(`guild_${slug}_members`, `${BASE_URL}/guild/${guildId}/members`, {
      guild_id: guildId,
    });

    let hall = null;
    let pool = null;
    if (includeHall) {
      hall = await fetchAndSave(`guild_${slug}_hall`, `${BASE_URL}/guild/${guildId}/hall`, { guild_id: guildId });
    }
    if (includeEnergizingPool) {
      pool = await fetchAndSave(
        `guild_${slug}_energizing_pool`,
        `${BASE_URL}/guild/${guildId}/energizing-pool/information`,
        { guild_id: guildId },
      );
    }

    endpointStatuses.push(members.meta);
    if (hall) endpointStatuses.push(hall.meta);
    if (pool) endpointStatuses.push(pool.meta);

    guildSummaries.push(summarizeGuild(guildId, info, members, hall, pool, discoveredGuild));
  }

  const zoneSummaries = Object.values(zones).map((zone) => {
    const key = zone?.location?.key || safeSlug(zone?.location?.name || zone?.location?.id, "unknown-zone");
    return summarizeConquestZone(zone, inspectedZonesByKey.get(key));
  });

  const allMembers = guildSummaries.flatMap((guild) =>
    guild.members.map((member) => ({
      ...member,
      guild_id: guild.id,
      guild_name: guild.name,
      guild_tag: guild.tag,
    })),
  );
  const uniqueMembersByHash = new Map();
  for (const member of allMembers) {
    const key = member.hashed_id || `${member.guild_id}:${member.id || member.name}`;
    uniqueMembersByHash.set(key, member);
  }

  const summary = {
    meta: {
      fetched_at: fetchedAt,
      output_dir: outDir,
      season_number: seasonNumber || null,
      delay_ms: delayMs,
      stats: queue.stats(),
      options: {
        sources: [...sourceModes],
        all_guilds: scanAllGuilds,
        scan_start_id: shouldScanGuildIds ? scanStartId || 1 : null,
        scan_end_id: shouldScanGuildIds ? scanEndId || Number(args["max-guild-id"] || 5000) : null,
        stop_after_misses: shouldScanGuildIds ? stopAfterMisses || null : null,
        zone_inspect: includeZoneInspect,
        include_hall: includeHall,
        include_energizing_pool: includeEnergizingPool,
        extra_guild_ids: extraGuildIds,
        max_guilds: maxGuilds || null,
      },
    },
    totals: {
      conquest_zones: zoneSummaries.length,
      inspected_zones: inspectedZonesByKey.size,
      discovered_guilds: discoveredGuilds.length,
      fetched_guilds: guildSummaries.length,
      skipped_guilds: skippedGuilds.length,
      member_rows: allMembers.length,
      unique_member_keys: uniqueMembersByHash.size,
      active_assaults: zoneSummaries.reduce((sum, zone) => sum + zone.active_assaults_count, 0),
    },
    endpoints: [
      ...endpointStatuses,
    ].map((meta) => ({
      endpoint_url: meta.endpoint_url,
      status: meta.status,
      ok: meta.ok,
      count: meta.count,
      endpoint_updates_at: meta.endpoint_updates_at,
    })),
    data: {
      zones: zoneSummaries,
      guilds: guildSummaries,
      skipped_guild_ids: skippedGuilds.map((guild) => guild.id),
      members: [...uniqueMembersByHash.values()].sort((a, b) => Number(b.total_level || 0) - Number(a.total_level || 0)),
    },
  };

  saveDerived("guild_intelligence_summary", summary);
  saveDerived("guilds", guildSummaries);
  saveDerived("conquest_zones", zoneSummaries);
  saveDerived("guild_members", summary.data.members);
  saveRaw("guild_intelligence_manifest", {
    meta: summary.meta,
    data: {
      totals: summary.totals,
      endpoints: summary.endpoints,
      derived_files: [
        "guild_intelligence_summary.json",
        "guilds.json",
        "conquest_zones.json",
        "guild_members.json",
      ],
    },
  });

  console.log("Done.");
  console.log(`Raw payloads: ${rawDir}`);
  console.log(`Derived summaries: ${derivedDir}`);
  console.log(
    `Fetched ${summary.totals.fetched_guilds}/${summary.totals.discovered_guilds} discovered guilds, ` +
      `${summary.totals.member_rows} member rows, ${summary.totals.conquest_zones} conquest zones.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
