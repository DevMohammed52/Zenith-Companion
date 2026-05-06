import fs from "fs";
import path from "path";

const args = parseArgs();
const personaDir = path.resolve(String(args.persona || args._[0] || "local_data/personas/Saqr"));
const rawDir = path.join(personaDir, "raw");
const derivedDir = path.join(personaDir, "derived");

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }
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

function readRaw(name) {
  const filePath = path.join(rawDir, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(name, data) {
  ensureDir(derivedDir);
  const filePath = path.join(derivedDir, `${name}.json`);
  const tempFile = `${filePath}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(tempFile, filePath);
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function compactObject(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function effectKey(effect) {
  return [
    effect.source || "unknown_source",
    effect.target || "unknown_target",
    effect.attribute || "unknown_attribute",
    effect.value_type || "unknown_value_type",
    effect.location_id ?? "global",
  ].join("|");
}

function summarizeEffects(effects) {
  const byKey = new Map();
  for (const effect of effects || []) {
    const key = effectKey(effect);
    const existing = byKey.get(key) || {
      source: effect.source ?? null,
      target: effect.target ?? null,
      attribute: effect.attribute ?? null,
      value_type: effect.value_type ?? null,
      location_id: effect.location_id ?? null,
      total_value: 0,
      entries: 0,
      expires_at: [],
    };
    existing.total_value += asNumber(effect.value) ?? 0;
    existing.entries += 1;
    if (effect.expire_at) existing.expires_at.push(effect.expire_at);
    byKey.set(key, existing);
  }
  return [...byKey.values()].sort((a, b) => (
    String(a.target).localeCompare(String(b.target))
    || String(a.attribute).localeCompare(String(b.attribute))
    || String(a.source).localeCompare(String(b.source))
  ));
}

function calculateSecondaryFromPrimary(stats) {
  const strength = asNumber(stats?.strength?.level);
  const defence = asNumber(stats?.defence?.level);
  const speed = asNumber(stats?.speed?.level);
  const dexterity = asNumber(stats?.dexterity?.level);
  return {
    attack_power_from_strength: strength === null ? null : strength * 2.4,
    protection_from_defence: defence === null ? null : defence * 2.4,
    agility_from_speed: speed === null ? null : speed * 2.4,
    accuracy_from_dexterity: dexterity === null ? null : dexterity * 2.4,
  };
}

function summarizePets(pets) {
  const normalized = (pets || []).map((pet) => compactObject({
    id: asNumber(pet.id),
    pet_id: asNumber(pet.pet_id),
    name: pet.name ?? null,
    custom_name: pet.custom_name ?? null,
    quality: pet.quality ?? null,
    level: asNumber(pet.level),
    experience: asNumber(pet.experience),
    equipped: Boolean(pet.equipped),
    stats: pet.stats ?? null,
    health: pet.health ?? null,
    evolution: pet.evolution ?? null,
    location: pet.location ?? null,
    battle: pet.battle ?? null,
    created_at: pet.created_at ?? null,
  }));

  return {
    count: normalized.length,
    equipped: normalized.find((pet) => pet.equipped) ?? null,
    by_quality: normalized.reduce((acc, pet) => {
      const quality = pet.quality || "UNKNOWN";
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, {}),
    pets: normalized.sort((a, b) => Number(Boolean(b.equipped)) - Number(Boolean(a.equipped)) || (b.level ?? 0) - (a.level ?? 0)),
  };
}

function currentActionSummary(action) {
  if (!action) return null;
  return compactObject({
    type: action.type ?? null,
    title: action.title ?? null,
    started_at: action.started_at ?? null,
    expires_at: action.expires_at ?? null,
    image_url: action.image_url ?? null,
  });
}

function main() {
  if (!fs.existsSync(rawDir)) throw new Error(`Raw persona directory does not exist: ${rawDir}`);

  const infoEnvelope = readRaw("character_information");
  const metricsEnvelope = readRaw("character_metrics");
  const effectsEnvelope = readRaw("character_effects");
  const petsEnvelope = readRaw("character_pets");
  const actionEnvelope = readRaw("character_current_action");
  const museumEnvelope = readRaw("character_museum");

  const character = infoEnvelope?.data?.character || {};
  const effects = effectsEnvelope?.data?.effects || [];
  const petSummary = summarizePets(petsEnvelope?.data?.pets || []);

  const summary = {
    meta: {
      generated_at: new Date().toISOString(),
      persona_dir: personaDir,
      source_statuses: {
        character_information: infoEnvelope?.meta?.status ?? null,
        character_metrics: metricsEnvelope?.meta?.status ?? null,
        character_effects: effectsEnvelope?.meta?.status ?? null,
        character_pets: petsEnvelope?.meta?.status ?? null,
        character_current_action: actionEnvelope?.meta?.status ?? null,
        character_museum: museumEnvelope?.meta?.status ?? null,
      },
    },
    data: {
      profile: compactObject({
        id: asNumber(character.id),
        hashed_id: character.hashed_id ?? null,
        name: character.name ?? null,
        class: character.class ?? null,
        total_level: asNumber(character.total_level),
        location: character.location ?? null,
        current_status: character.current_status ?? null,
        created_at: character.created_at ?? null,
        last_activity: character.last_activity ?? null,
        guild: character.guild ?? null,
      }),
      skills: character.skills ?? {},
      primary_stats: character.stats ?? {},
      calculated_secondary_from_primary: calculateSecondaryFromPrimary(character.stats),
      effects: {
        count: effects.length,
        grouped: summarizeEffects(effects),
      },
      pets: petSummary,
      current_action: currentActionSummary(actionEnvelope?.data),
      metrics: metricsEnvelope?.data?.metrics ?? {},
      museum: {
        first_page_item_count: Array.isArray(museumEnvelope?.data?.items) ? museumEnvelope.data.items.length : null,
        pagination: museumEnvelope?.data?.pagination ?? null,
      },
      still_missing_for_profile_model: [
        "full equipped gear by slot",
        "equipped tools by slot",
        "game-displayed secondary stats after gear/effects/pet",
        "combat, dungeon, and world boss magic-find displayed totals",
        "daily streak count",
        "housing components and housing buffs",
        "active food setup",
        "combat stance and enemy-scaling preference",
        "manual hunting efficiency override if game-displayed value differs from calculated sources",
      ],
    },
  };

  writeJson("summary", summary);
  console.log(`Persona summary generated: ${path.join(derivedDir, "summary.json")}`);
}

main();
