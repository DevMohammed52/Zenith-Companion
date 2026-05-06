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
const guildIds = toArray(args["guild-id"] || args.id || args._[0]);

if (guildIds.length === 0) {
  console.error("Usage: node --env-file=.env scripts/fetch-idlemmo-guild.mjs --guild-id <id>[,<id>]");
  process.exit(1);
}

const outDir = path.resolve(String(args.out || "local_data/idle_mmo_cache"));
const rawDir = path.join(outDir, "raw");
const apiKey = readApiKey();
const queue = createFetchQueue({ apiKey, label: "guild" });

ensureDir(rawDir);

function saveRaw(name, envelope) {
  writeJson(path.join(rawDir, `${name}.json`), envelope);
}

async function fetchAndSave(name, url, metadata = {}) {
  const envelope = await queue.request(name, url, metadata);
  saveRaw(name, envelope);
  return envelope;
}

async function main() {
  console.log(`Writing targeted guild data to ${rawDir}`);

  const results = [];
  for (const guildId of guildIds) {
    const slug = safeSlug(guildId);
    results.push(await fetchAndSave(
      `guild_${slug}_information`,
      `${BASE_URL}/guild/${encodeURIComponent(guildId)}/information`,
      { guild_id: guildId },
    ));
    results.push(await fetchAndSave(
      `guild_${slug}_members`,
      `${BASE_URL}/guild/${encodeURIComponent(guildId)}/members`,
      { guild_id: guildId },
    ));
  }

  saveRaw("guild_targeted_fetch_manifest", {
    meta: {
      fetched_at: new Date().toISOString(),
      output_dir: outDir,
      stats: queue.stats(),
      guild_ids: guildIds,
    },
    data: {
      files: guildIds.flatMap((guildId) => {
        const slug = safeSlug(guildId);
        return [`guild_${slug}_information`, `guild_${slug}_members`];
      }),
      statuses: results.map((result) => ({
        endpoint_url: result.meta.endpoint_url,
        status: result.meta.status,
        ok: result.meta.ok,
      })),
    },
  });

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
