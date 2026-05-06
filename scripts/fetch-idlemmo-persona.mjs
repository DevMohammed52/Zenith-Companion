import path from "path";
import fs from "fs";
import {
  BASE_URL,
  createFetchQueue,
  ensureDir,
  parseArgs,
  readApiKey,
  safeSlug,
  writeJson,
} from "./idlemmo-fetch-utils.mjs";

const args = parseArgs();
const characterHash = String(args.hash || args._[0] || "").trim();

if (!characterHash) {
  console.error("Usage: node --env-file=.env scripts/fetch-idlemmo-persona.mjs --hash <hashed_character_id> [--name Saqr] [--museum]");
  process.exit(1);
}

const apiKey = readApiKey();
const queue = createFetchQueue({ apiKey, label: "persona" });
const requestedName = args.name ? safeSlug(args.name) : "";
const initialSlug = requestedName || safeSlug(characterHash);
const personaDir = path.resolve(String(args.out || path.join("local_data", "personas", initialSlug)));
const rawDir = path.join(personaDir, "raw");

ensureDir(rawDir);

function saveRaw(name, envelope) {
  writeJson(path.join(rawDir, `${name}.json`), envelope);
}

async function fetchPersonaEndpoint(name, pathPart, required = false) {
  const url = `${BASE_URL}/character/${characterHash}/${pathPart}`;
  const envelope = await queue.request(name, url, { character_hash: characterHash });
  saveRaw(name, envelope);
  return {
    name,
    ok: envelope.meta.ok,
    status: envelope.meta.status,
    required,
    file: path.join("raw", `${name}.json`),
  };
}

function writeNotes(results, characterName) {
  const missing = results
    .filter((result) => !result.ok)
    .map((result) => ({
      endpoint: result.name,
      status: result.status,
      reason: result.status === 401 || result.status === 403 ? "private_or_missing_scope" : "unavailable_or_error",
      manual_followup_needed: true,
    }));

  writeJson(path.join(personaDir, "notes.json"), {
    persona: {
      requested_name: args.name || null,
      discovered_name: characterName || null,
      hashed_character_id: characterHash,
    },
    fetched_at: new Date().toISOString(),
    files: results,
    missing_or_private: missing,
    manual_notes: {
      profile_baseline_screenshots: [],
      gear_screenshots: [],
      pet_screenshots: [],
      combat_test_threads: [],
      dungeon_test_threads: [],
    },
  });
}

async function main() {
  console.log(`Writing persona data to ${personaDir}`);

  const results = [];
  results.push(await fetchPersonaEndpoint("character_information", "information", true));
  results.push(await fetchPersonaEndpoint("character_metrics", "metrics"));
  results.push(await fetchPersonaEndpoint("character_effects", "effects"));
  results.push(await fetchPersonaEndpoint("character_pets", "pets"));
  results.push(await fetchPersonaEndpoint("character_current_action", "current-action"));
  if (args.museum) results.push(await fetchPersonaEndpoint("character_museum", "museum"));

  let characterName = null;
  try {
    const infoPath = path.join(rawDir, "character_information.json");
    const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
    characterName = info?.data?.character?.name || null;
  } catch {
    characterName = null;
  }

  writeNotes(results, characterName);
  console.log("Done.");
  console.log(`Persona notes: ${path.join(personaDir, "notes.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
