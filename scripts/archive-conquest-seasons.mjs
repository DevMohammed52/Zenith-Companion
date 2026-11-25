import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import {
  BASE_URL,
  ensureDir,
  parseArgs,
  readApiKey,
  resolveRateLimitDelayMs,
  writeJson,
} from "./idlemmo-fetch-utils.mjs";

const args = parseArgs();
const publicDir = path.resolve(String(args.out || "public/conquest-seasons"));
const rateProfile = String(args["rate-profile"] || process.env.IDLEMMO_RATE_PROFILE || "shared").toLowerCase();
const delayMs = resolveRateLimitDelayMs({
  explicitDelayMs: args["delay-ms"],
  explicitRequestsPerMinute: args.rpm || args["requests-per-minute"],
  profile: rateProfile,
});
const forceRefresh = Boolean(args.force);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchView(apiKey, seasonNumber) {
  const url = seasonNumber
    ? `${BASE_URL}/guild/conquest/view?season_number=${encodeURIComponent(String(seasonNumber))}`
    : `${BASE_URL}/guild/conquest/view`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "ZenithCompanion-ConquestArchive/1.0",
    },
  });
  if (!res.ok) return { status: res.status, json: null };
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function summarizeSeasonFile(seasonNumber, data) {
  const zones = Array.isArray(data?.zones) ? data.zones : [];
  const totalXp = zones.reduce((sum, z) => sum + Number(z.experience || 0), 0);
  const totalKills = zones.reduce((sum, z) => sum + Number(z.kills || 0), 0);
  const topZone = [...zones].sort((a, b) => Number(b.experience || 0) - Number(a.experience || 0))[0] || null;

  const guildTotals = new Map();
  for (const zone of zones) {
    for (const row of zone.guild_leaderboard || []) {
      if (!row?.guild?.name) continue;
      const key = row.guild.id ?? row.guild.name;
      const existing = guildTotals.get(key) || {
        id: row.guild.id ?? null,
        name: row.guild.name,
        tag: row.guild.tag ?? null,
        icon_url: row.guild.icon_url ?? null,
        experience: 0,
        zones_won: 0,
      };
      existing.experience += Number(row.experience || 0);
      if (row.position === 1) existing.zones_won += 1;
      guildTotals.set(key, existing);
    }
  }
  const topGuild = [...guildTotals.values()].sort((a, b) => b.zones_won - a.zones_won || b.experience - a.experience)[0] || null;

  return {
    season_number: seasonNumber,
    total_xp: totalXp,
    total_kills: totalKills,
    zones_count: zones.length,
    guilds_observed: Number(data?.meta?.totals?.guilds_observed || 0),
    top_guild: topGuild,
    top_zone: topZone ? { name: topZone.name, key: topZone.key, experience: topZone.experience } : null,
  };
}

async function main() {
  ensureDir(publicDir);
  const apiKey = readApiKey();
  const indexPath = path.join(publicDir, "index.json");
  const existingIndex = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, "utf8"))
    : null;

  const existingLocalSeasons = new Set(
    fs
      .readdirSync(publicDir)
      .map((name) => /^season-(\d+)\.json$/.exec(name))
      .filter(Boolean)
      .map((match) => Number(match[1])),
  );

  const currentRes = await fetchView(apiKey, null);
  const currentZones = Object.values(currentRes.json?.zones || {});
  const currentTotalXp = currentZones.reduce((sum, z) => sum + Number(z.experience || 0), 0);

  let currentSeason = existingIndex?.current_season ?? null;
  const completedSet = new Set(existingLocalSeasons);

  function matchesLiveView(seasonJson) {
    const zones = Object.values(seasonJson?.zones || {});
    const totalXp = zones.reduce((sum, z) => sum + Number(z.experience || 0), 0);
    return (
      totalXp > 0 &&
      currentTotalXp > 0 &&
      Math.abs(totalXp - currentTotalXp) < 100 &&
      zones[0]?.experience === currentZones[0]?.experience
    );
  }

  // Fast incremental path when index already knows current_season and past seasons exist locally
  if (!forceRefresh && currentSeason != null) {
    await sleep(delayMs);
    const knownCurrentRes = await fetchView(apiKey, currentSeason);
    if (knownCurrentRes.status === 200 && matchesLiveView(knownCurrentRes.json)) {
      console.log(
        `Incremental check: Season ${currentSeason} is still active (0 archived seasons re-fetched).`,
      );
    } else {
      // Current season rolled over (or ended): archive old currentSeason and advance forward
      for (let season = currentSeason; season <= currentSeason + 5; season += 1) {
        if (season > currentSeason) await sleep(delayMs);
        const res = season === currentSeason ? knownCurrentRes : await fetchView(apiKey, season);
        if (res.status !== 200 || !res.json?.zones) break;
        const zones = Object.values(res.json.zones || {});
        const totalXp = zones.reduce((sum, z) => sum + Number(z.experience || 0), 0);
        if (totalXp === 0) continue;

        if (matchesLiveView(res.json)) {
          currentSeason = season;
          completedSet.delete(season);
          break;
        }
        completedSet.add(season);
      }
    }
  } else {
    // Full discovery scan (--force or missing index.json), still skipping local file re-fetches unless --force
    currentSeason = null;
    for (let season = 1; season <= 25; season += 1) {
      if (!forceRefresh && existingLocalSeasons.has(season)) {
        completedSet.add(season);
        continue;
      }
      await sleep(delayMs);
      const res = await fetchView(apiKey, season);
      if (res.status !== 200 || !res.json?.zones) {
        if (season > 3) break;
        continue;
      }
      const zones = Object.values(res.json.zones || {});
      const totalXp = zones.reduce((sum, z) => sum + Number(z.experience || 0), 0);
      if (totalXp === 0) continue;

      if (matchesLiveView(res.json)) {
        currentSeason = season;
        continue;
      }

      completedSet.add(season);
    }
  }

  const completedSeasons = [...completedSet].sort((a, b) => a - b);
  console.log(`Detected currentSeason=${currentSeason}, completedSeasons=[${completedSeasons.join(", ")}]`);

  const summaries = [];
  for (const season of completedSeasons) {
    const filePath = path.join(publicDir, `season-${season}.json`);
    if (forceRefresh || !fs.existsSync(filePath)) {
      console.log(`Archiving Season ${season}...`);
      execFileSync(
        process.execPath,
        [
          "scripts/fetch-idlemmo-conquest.mjs",
          "--season-number",
          String(season),
          "--public-out",
          filePath,
          "--out",
          `local_data/conquest_seasons/season_${season}`,
          "--delay-ms",
          String(delayMs),
        ],
        { stdio: "inherit" },
      );
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    summaries.push(summarizeSeasonFile(season, data));
  }

  summaries.sort((a, b) => b.season_number - a.season_number);

  const indexPayload = {
    generated_at: new Date().toISOString(),
    current_season: currentSeason,
    seasons: summaries,
  };

  writeJson(indexPath, indexPayload);
  console.log(`Wrote ${path.relative(process.cwd(), indexPath)} (${summaries.length} archived seasons).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
