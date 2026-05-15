import path from "path";
import {
  BASE_URL,
  createFetchQueue,
  ensureDir,
  parseArgs,
  readApiKey,
  resolveRateLimitDelayMs,
  safeSlug,
  writeJson,
} from "./idlemmo-fetch-utils.mjs";

const args = parseArgs();
const outDir = path.resolve(String(args.out || "local_data/conquest_snapshot"));
const rawDir = path.join(outDir, "raw");
const publicOut = path.resolve(String(args["public-out"] || "public/conquest-data.json"));
const apiKey = readApiKey();
const rateProfile = String(args["rate-profile"] || process.env.IDLEMMO_RATE_PROFILE || "shared").toLowerCase();
const delayMs = resolveRateLimitDelayMs({
  explicitDelayMs: args["delay-ms"],
  explicitRequestsPerMinute: args.rpm || args["requests-per-minute"],
  profile: rateProfile,
});
const seasonNumber = args["season-number"] || args.season;

ensureDir(rawDir);

const queue = createFetchQueue({ apiKey, delayMs, label: "conquest" });

function addQuery(url, params) {
  const nextUrl = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== false && value !== "") {
      nextUrl.searchParams.set(key, String(value));
    }
  }
  return nextUrl.toString();
}

function normalizeNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function compactGuild(guild) {
  if (!guild) return null;
  return {
    id: guild.id ?? null,
    name: guild.name || "Unknown guild",
    tag: guild.tag ?? null,
    icon_url: guild.icon_url || null,
    background_url: guild.background_url || null,
  };
}

function compactCharacter(character) {
  if (!character) return null;
  return {
    hashed_id: character.hashed_id ?? null,
    name: character.name || "Unknown",
    total_level: character.total_level ?? null,
    image_url: character.image_url || null,
    background_url: character.background_url || null,
  };
}

function summarizeZone(zone, inspectedEnvelope) {
  const inspectedZone = inspectedEnvelope?.data?.zone || null;
  const location = inspectedZone?.location || zone?.location || {};
  const contributions = Array.isArray(inspectedZone?.contributions) ? inspectedZone.contributions : [];
  const activeAssaults = Array.isArray(zone?.active_assaults) ? zone.active_assaults : [];
  const leaderboard = Array.isArray(zone?.guilds) ? zone.guilds : [];
  const contributionRows = contributions.map((row) => ({
    id: row.id ?? null,
    guild_conquest_progress_id: row.guild_conquest_progress_id ?? null,
    kills: normalizeNumber(row.kills),
    experience: normalizeNumber(row.experience),
    guild: compactGuild(row.guild),
    character: compactCharacter(row.character),
  }));

  return {
    id: location.id ?? null,
    key: location.key || safeSlug(location.name || location.id, "unknown-zone"),
    name: location.name || "Unknown zone",
    image_url: location.image_url || null,
    status: zone?.status || inspectedZone?.status || null,
    colour: zone?.colour || inspectedZone?.colour || null,
    kills: normalizeNumber(zone?.kills ?? inspectedZone?.kills),
    experience: normalizeNumber(zone?.experience ?? inspectedZone?.experience),
    guilds_count: Number(zone?.guilds_count || leaderboard.length || 0),
    active_assaults_count: activeAssaults.length,
    leaderboard_count: leaderboard.length,
    contribution_count: contributionRows.length,
    active_assaults: activeAssaults.map((row) => ({
      kills: normalizeNumber(row.kills),
      experience: normalizeNumber(row.experience),
      guild: compactGuild(row.guild),
    })),
    guild_leaderboard: leaderboard.slice(0, 25).map((row) => ({
      position: row.position ?? null,
      kills: normalizeNumber(row.kills),
      experience: normalizeNumber(row.experience),
      guild: compactGuild(row.guild),
    })),
    top_contributors: contributionRows
      .sort((a, b) => b.experience - a.experience || b.kills - a.kills)
      .slice(0, 50),
  };
}

async function fetchAndSave(name, url, metadata = {}) {
  const envelope = await queue.request(name, url, metadata);
  writeJson(path.join(rawDir, `${name}.json`), envelope);
  return envelope;
}

async function main() {
  console.log(`Writing conquest snapshot to ${outDir}`);
  console.log(`Rate profile: ${rateProfile}. Delay: ${delayMs}ms between requests.`);

  const startedAt = new Date().toISOString();
  const conquest = await fetchAndSave(
    "guild_conquest_view",
    addQuery(`${BASE_URL}/guild/conquest/view`, { season_number: seasonNumber }),
    { season_number: seasonNumber || null },
  );
  const zones = Object.values(conquest.data?.zones || {});
  const inspectedByKey = new Map();

  for (const zone of zones) {
    if (!zone?.location?.id) continue;
    const key = zone.location.key || safeSlug(zone.location.name || zone.location.id, "unknown-zone");
    const inspected = await fetchAndSave(
      `guild_conquest_zone_${safeSlug(key)}`,
      addQuery(`${BASE_URL}/guild/conquest/zone/${zone.location.id}/inspect`, { season_number: seasonNumber }),
      { zone_id: zone.location.id, zone_key: key, zone_name: zone.location.name, season_number: seasonNumber || null },
    );
    inspectedByKey.set(key, inspected);
  }

  const zoneSummaries = zones.map((zone) => {
    const key = zone?.location?.key || safeSlug(zone?.location?.name || zone?.location?.id, "unknown-zone");
    return summarizeZone(zone, inspectedByKey.get(key));
  });

  const guildIds = new Set();
  for (const zone of zoneSummaries) {
    for (const row of zone.guild_leaderboard) if (row.guild?.id) guildIds.add(row.guild.id);
    for (const row of zone.active_assaults) if (row.guild?.id) guildIds.add(row.guild.id);
    for (const row of zone.top_contributors) if (row.guild?.id) guildIds.add(row.guild.id);
  }

  const allContributors = zoneSummaries
    .flatMap((zone) =>
      zone.top_contributors.map((row) => ({
        ...row,
        zone: {
          id: zone.id,
          key: zone.key,
          name: zone.name,
        },
      })),
    )
    .sort((a, b) => b.experience - a.experience || b.kills - a.kills)
    .slice(0, 75);

  const data = {
    meta: {
      generated_at: new Date().toISOString(),
      fetched_at: startedAt,
      season_number: seasonNumber || null,
      endpoint_updates_at: conquest.data?.endpoint_updates_at ?? conquest.meta?.endpoint_updates_at ?? null,
      rate_profile: rateProfile,
      delay_ms: delayMs,
      stats: queue.stats(),
      totals: {
        zones: zoneSummaries.length,
        active_assaults: zoneSummaries.reduce((sum, zone) => sum + zone.active_assaults_count, 0),
        leaderboard_rows: zoneSummaries.reduce((sum, zone) => sum + zone.leaderboard_count, 0),
        contribution_rows: zoneSummaries.reduce((sum, zone) => sum + zone.contribution_count, 0),
        guilds_observed: guildIds.size,
      },
    },
    zones: zoneSummaries,
    top_contributors: allContributors,
  };

  writeJson(publicOut, data);
  writeJson(path.join(outDir, "conquest-data.json"), data);
  console.log(`Wrote ${path.relative(process.cwd(), publicOut)} with ${zoneSummaries.length} zones.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
