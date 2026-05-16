import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const args = parseArgs();
const sourceDir = path.resolve(String(args.source || "local_data/guild_intelligence_all/derived"));
const outFile = path.resolve(String(args.out || "public/guild-database.json"));
const detailsOutFile = path.resolve(String(args["details-out"] || "public/guild-details.json"));
const detailsOutDir = path.resolve(String(args["details-dir"] || "public/guild-details"));
const membersOutFile = path.resolve(String(args["members-out"] || "public/guild-members.json"));
const refreshPlanFile = path.resolve(String(args["refresh-plan-out"] || "public/guild-refresh-plan.json"));
const shouldMergeExisting = Boolean(args["merge-existing"]);

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [rawKey, inlineValue] = token.slice(2).split("=");
    const next = inlineValue ?? argv[index + 1];
    const value = inlineValue === undefined && next && !next.startsWith("--") ? next : inlineValue ?? true;
    if (inlineValue === undefined && value === next) index += 1;
    parsed[rawKey] = value;
  }
  return parsed;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing input file: ${path.relative(repoRoot, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(tempFile, filePath);
}

function stripCharacterHashes(value) {
  if (Array.isArray(value)) return value.map(stripCharacterHashes);
  if (!value || typeof value !== "object") return value;

  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "hashed_id") continue;
    result[key] = stripCharacterHashes(entry);
  }
  return result;
}

function numberValue(value, fallback = 0) {
  const parsed = typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRefreshTier(guild) {
  const members = numberValue(guild.member_count);
  const marks = numberValue(guild.marks);
  const level = numberValue(guild.level);
  const season = numberValue(guild.season_position, 999999);
  if (guild.zones?.length || season <= 100 || members >= 20 || level >= 90) return "hot";
  if ((members >= 10 && marks > 0) || (members >= 5 && level >= 50) || marks >= 10) return "warm";
  return "cold";
}

function getActivityScore(guild) {
  const members = numberValue(guild.member_count);
  const marks = numberValue(guild.marks);
  const level = numberValue(guild.level);
  const season = numberValue(guild.season_position, 999999);
  const conquestBonus = guild.zones?.length ? 160 : 0;
  const seasonScore = season > 0 && season < 999999 ? Math.max(0, 220 - Math.min(season, 220)) : 0;
  return Math.round(
    members * 7 +
      Math.min(marks, 500) * 0.8 +
      level * 2.5 +
      seasonScore +
      conquestBonus,
  );
}

function summarizeMembers(members = []) {
  const totalLevels = members.map((member) => numberValue(member.total_level)).filter((value) => value > 0);
  const sortedMembers = sortMembersForDisplay(members).map(compactMemberProfile);

  return {
    average_total_level: totalLevels.length
      ? Math.round(totalLevels.reduce((sum, value) => sum + value, 0) / totalLevels.length)
      : null,
    highest_total_level: totalLevels.length ? Math.max(...totalLevels) : null,
    leaders: members
      .filter((member) => ["LEADER", "DEPUTY", "OFFICER"].includes(String(member.position || "").toUpperCase()))
      .sort((a, b) => positionRank(a.position) - positionRank(b.position) || numberValue(b.total_level) - numberValue(a.total_level))
      .map(compactMemberProfile),
    top_members: [...sortedMembers].sort((a, b) => numberValue(b.total_level) - numberValue(a.total_level)).slice(0, 5),
  };
}

function positionRank(position) {
  const normalized = String(position || "").toUpperCase();
  if (normalized === "LEADER") return 0;
  if (normalized === "DEPUTY") return 1;
  if (normalized === "OFFICER") return 2;
  if (normalized === "SOLDIER") return 3;
  if (normalized === "RECRUIT") return 4;
  return 5;
}

function compactMemberProfile(member) {
  return {
    name: member.name || "Unknown",
    position: member.position || null,
    total_level: numberValue(member.total_level, null),
    image_url: member.image_url || null,
    background_url: member.background_url || null,
  };
}

function sortMembersForDisplay(members = []) {
  return [...members].sort(
    (a, b) =>
      positionRank(a.position) - positionRank(b.position) ||
      numberValue(b.total_level) - numberValue(a.total_level) ||
      String(a.name || "").localeCompare(String(b.name || "")),
  );
}

function compactGuild(guild, fetchedAt) {
  const tier = getRefreshTier(guild);
  const members = Array.isArray(guild.members) ? guild.members : [];
  const memberSummary = summarizeMembers(members);
  return {
    id: numberValue(guild.id),
    name: guild.name || `Guild ${guild.id}`,
    tag: guild.tag || null,
    level: numberValue(guild.level, null),
    experience: numberValue(guild.experience, null),
    marks: numberValue(guild.marks, null),
    season_position: numberValue(guild.season_position, null),
    member_count: numberValue(guild.member_count, members.length),
    icon_url: guild.icon_url || null,
    background_url: guild.background_url || null,
    discovered_from: Array.isArray(guild.discovered_from) ? guild.discovered_from : [],
    zones: Array.isArray(guild.zones) ? guild.zones : [],
    refresh_tier: tier,
    activity_score: getActivityScore(guild),
    last_info_fetch_at: fetchedAt,
    last_members_fetch_at: fetchedAt,
    average_total_level: memberSummary.average_total_level,
    highest_total_level: memberSummary.highest_total_level,
    leader_names: memberSummary.leaders.map((member) => member.name),
    top_member_names: memberSummary.top_members.slice(0, 3).map((member) => member.name),
  };
}

function compactGuildDetails(guild, fetchedAt) {
  const members = Array.isArray(guild.members) ? guild.members : [];
  return {
    id: numberValue(guild.id),
    description: guild.description || null,
    last_info_fetch_at: fetchedAt,
    last_members_fetch_at: fetchedAt,
    member_summary: summarizeMembers(members),
    members: sortMembersForDisplay(members).map(compactMemberProfile),
    zones: Array.isArray(guild.zones) ? guild.zones : [],
  };
}

function compactMember(guild, member) {
  return {
    guild_id: numberValue(guild.id),
    guild_name: guild.name || `Guild ${guild.id}`,
    guild_tag: guild.tag || null,
    name: member.name || "Unknown",
    position: member.position || null,
    total_level: numberValue(member.total_level, null),
    image_url: member.image_url || null,
    background_url: member.background_url || null,
  };
}

const guilds = readJson(path.join(sourceDir, "guilds.json"));
const summaryPath = path.join(sourceDir, "guild_intelligence_summary.json");
const sourceSummary = fs.existsSync(summaryPath) ? readJson(summaryPath) : null;
const fetchedAt = sourceSummary?.meta?.fetched_at || new Date().toISOString();
const updatedGuilds = guilds.map((guild) => compactGuild(guild, fetchedAt));
const updatedDetails = guilds.map((guild) => compactGuildDetails(guild, fetchedAt));
const updatedGuildIds = new Set(updatedGuilds.map((guild) => guild.id));
const existingDatabase = shouldMergeExisting && fs.existsSync(outFile) ? readJson(outFile) : null;
const compactGuilds = [
  ...(existingDatabase?.guilds || []).filter((guild) => !updatedGuildIds.has(guild.id)),
  ...updatedGuilds,
].sort((a, b) => b.activity_score - a.activity_score);
const guildDetails = updatedDetails.sort((a, b) => a.id - b.id);
const tiers = compactGuilds.reduce(
  (acc, guild) => {
    acc[guild.refresh_tier] += 1;
    return acc;
  },
  { hot: 0, warm: 0, cold: 0 },
);

const database = {
  meta: {
    generated_at: new Date().toISOString(),
    source_fetched_at: fetchedAt,
    source: path.relative(repoRoot, sourceDir).replace(/\\/g, "/"),
    strategy: "Full registry with tiered refresh metadata. Hot and warm guilds can be refreshed more often while cold guilds remain searchable.",
    totals: {
      guilds: compactGuilds.length,
      members: guilds.reduce((sum, guild) => sum + (Array.isArray(guild.members) ? guild.members.length : 0), 0),
      tiers,
    },
  },
  guilds: compactGuilds,
};

const membersDatabase = {
  meta: {
    generated_at: database.meta.generated_at,
    source_fetched_at: fetchedAt,
    guilds: compactGuilds.length,
    members: 0,
  },
  members: [
    ...((shouldMergeExisting && fs.existsSync(membersOutFile) ? readJson(membersOutFile).members || [] : []).filter(
      (member) => !updatedGuildIds.has(member.guild_id),
    ).map(stripCharacterHashes)),
    ...guilds.flatMap((guild) => (Array.isArray(guild.members) ? guild.members.map((member) => compactMember(guild, member)) : [])),
  ],
};
membersDatabase.meta.members = membersDatabase.members.length;
database.meta.totals.guilds = compactGuilds.length;
database.meta.totals.members = membersDatabase.members.length;

const detailsDatabase = {
  meta: {
    generated_at: database.meta.generated_at,
    source_fetched_at: fetchedAt,
    guilds: compactGuilds.length,
    format: "per-guild",
    path_template: "guild-details/{guild_id}.json",
  },
  guild_ids: compactGuilds.map((guild) => guild.id).sort((a, b) => a - b),
};

const refreshPlan = {
  meta: {
    generated_at: database.meta.generated_at,
    source_fetched_at: fetchedAt,
    rate_limit_strategy: {
      isolated_requests_per_minute: 54,
      shared_requests_per_minute: 40,
      note: "Use isolated rate only when API workflows are serialized. Use shared rate when a user-triggered fetch can overlap another API job.",
    },
  },
  tiers: {
    hot: {
      cadence: "every 6-8 hours",
      guild_ids: compactGuilds.filter((guild) => guild.refresh_tier === "hot").map((guild) => guild.id),
    },
    warm: {
      cadence: "daily",
      guild_ids: compactGuilds.filter((guild) => guild.refresh_tier === "warm").map((guild) => guild.id),
    },
    cold: {
      cadence: "weekly or full-baseline only",
      guild_ids: compactGuilds.filter((guild) => guild.refresh_tier === "cold").map((guild) => guild.id),
    },
    discover_new: {
      cadence: "daily",
      start_after_guild_id: Math.max(...compactGuilds.map((guild) => guild.id)),
      stop_after_misses: 75,
    },
  },
};

writeJson(outFile, database);
writeJson(detailsOutFile, detailsDatabase);
for (const detail of guildDetails) {
  writeJson(path.join(detailsOutDir, `${detail.id}.json`), detail);
}
writeJson(membersOutFile, membersDatabase);
writeJson(refreshPlanFile, refreshPlan);

for (const fileName of fs.existsSync(detailsOutDir) ? fs.readdirSync(detailsOutDir) : []) {
  if (!fileName.endsWith(".json")) continue;
  const detailPath = path.join(detailsOutDir, fileName);
  writeJson(detailPath, stripCharacterHashes(readJson(detailPath)));
}

console.log(`Wrote ${path.relative(repoRoot, outFile)} with ${compactGuilds.length} guilds.`);
console.log(`Wrote ${path.relative(repoRoot, detailsOutFile)} and ${guildDetails.length} per-guild detail files.`);
console.log(`Wrote ${path.relative(repoRoot, membersOutFile)} with ${membersDatabase.members.length} members.`);
console.log(`Wrote ${path.relative(repoRoot, refreshPlanFile)}.`);
