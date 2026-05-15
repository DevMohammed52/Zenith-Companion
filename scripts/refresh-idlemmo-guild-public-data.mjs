import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, toArray } from "./idlemmo-fetch-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs();

const planPath = path.resolve(String(args.plan || "public/guild-refresh-plan.json"));
const outDir = path.resolve(String(args.out || "local_data/guild_intelligence_refresh"));
const rateProfile = String(args["rate-profile"] || process.env.IDLEMMO_RATE_PROFILE || "shared");
const tiers = toArray(args.tier || args.tiers || "hot");
const includeDiscovery = Boolean(args["discover-new"]);
const allGuilds = Boolean(args["all-guilds"]);
const maxDiscoverIds = Number(args["max-discover-ids"] || 125);
const stopAfterMisses = Number(args["stop-after-misses"] || 75);
const dryRun = Boolean(args["dry-run"]);

function readJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing refresh plan: ${path.relative(repoRoot, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function runNode(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${path.basename(script)} failed with exit code ${result.status}`);
  }
}

function uniqueNumbers(values) {
  return [...new Set(values.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))].sort(
    (a, b) => a - b,
  );
}

function selectedTierIds(plan) {
  if (allGuilds) return [];
  const ids = [];
  for (const tier of tiers) {
    const tierPlan = plan.tiers?.[tier];
    if (!tierPlan) throw new Error(`Unknown guild refresh tier: ${tier}`);
    ids.push(...(Array.isArray(tierPlan.guild_ids) ? tierPlan.guild_ids : []));
  }
  return uniqueNumbers(ids);
}

function discoveryRange(plan) {
  if (!includeDiscovery || allGuilds) return null;
  const startAfter = Number(plan.tiers?.discover_new?.start_after_guild_id || 0);
  if (!Number.isInteger(startAfter) || startAfter < 1) {
    throw new Error("Refresh plan is missing a valid discover_new.start_after_guild_id value.");
  }
  const start = startAfter + 1;
  return { start, end: start + Math.max(1, maxDiscoverIds) - 1 };
}

function main() {
  const plan = readJson(planPath);
  const ids = selectedTierIds(plan);
  const range = discoveryRange(plan);
  const fetchArgs = ["scripts/fetch-idlemmo-guild-intelligence.mjs", "--out", outDir, "--rate-profile", rateProfile];

  if (allGuilds) {
    fetchArgs.push("--all-guilds", "--source", "range");
  } else {
    if (ids.length > 0) fetchArgs.push("--guild-id", ids.join(","));
    if (range) {
      fetchArgs.push("--source", "range", "--start-id", String(range.start), "--end-id", String(range.end), "--stop-after-misses", String(stopAfterMisses));
    } else {
      fetchArgs.push("--source", "manual");
    }
  }

  if (!allGuilds && ids.length === 0 && !range) {
    console.log("No guild IDs selected and no discovery range requested. Nothing to refresh.");
    return;
  }

  console.log(
    allGuilds
      ? `Refreshing full guild baseline with ${rateProfile} rate profile.`
      : `Refreshing ${ids.length} guilds${range ? ` and scanning new IDs ${range.start}..${range.end}` : ""} with ${rateProfile} rate profile.`,
  );

  if (dryRun) {
    console.log(`Dry run: node ${fetchArgs.join(" ")}`);
    console.log(`Dry run: node scripts/build-guild-public-data.mjs --source ${path.join(outDir, "derived")} --merge-existing`);
    return;
  }

  runNode(path.join(repoRoot, fetchArgs[0]), fetchArgs.slice(1));
  runNode(path.join(repoRoot, "scripts/build-guild-public-data.mjs"), [
    "--source",
    path.join(outDir, "derived"),
    "--merge-existing",
  ]);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
