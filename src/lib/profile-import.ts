import {
  collectProfileFieldPaths,
  markProfileFieldSources,
  sanitizeProfile,
  sanitizeProfileImportSource,
  type CharacterProfile,
  type ProfileImportSource,
  type ProfileOwnedPet,
  type ProfilePetStats,
} from "@/lib/profiles";
import { sanitizeMuseumSnapshot } from "@/lib/museum";

export type ImportedProfileDraft = Partial<Omit<CharacterProfile, "id" | "createdAt" | "updatedAt" | "fieldSources">> & {
  importSource?: Partial<ProfileImportSource>;
};

export type ImportedProfileMergeResult = {
  profile: CharacterProfile;
  appliedPaths: string[];
  skippedManualPaths: string[];
};

const IMPORT_METADATA_ROOTS = new Set([
  "schemaVersion",
  "id",
  "createdAt",
  "updatedAt",
  "fieldSources",
  "importSource",
]);
const IMPORT_REPLACE_ROOTS = new Set([
  "metricsSnapshot",
  "museum",
  "ownedPets",
  "skills",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isPlainObject(current)) return undefined;
    return current[key];
  }, source);
}

function setPathValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    if (!isPlainObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  });
  cursor[parts[parts.length - 1]] = value;
}

function pathRoot(path: string) {
  return path.split(".")[0] || "";
}

function collectImportDraftPaths(importedDraft: ImportedProfileDraft) {
  const rawPaths = collectProfileFieldPaths(importedDraft)
    .filter((path) => !IMPORT_METADATA_ROOTS.has(pathRoot(path)));
  const replaceRoots = new Set(rawPaths.map(pathRoot).filter((root) => IMPORT_REPLACE_ROOTS.has(root)));
  return [
    ...Array.from(replaceRoots),
    ...rawPaths.filter((path) => !replaceRoots.has(pathRoot(path))),
  ];
}

function isEmptyManualValue(value: unknown) {
  return typeof value === "undefined"
    || value === null
    || value === ""
    || value === "Standard"
    || (typeof value === "number" && value === 0);
}

function shouldPreserveManual(existing: CharacterProfile, path: string, nextValue: unknown) {
  if (existing.fieldSources[path]?.source !== "manual") return false;
  if (typeof nextValue === "undefined") return true;
  return !isEmptyManualValue(getPathValue(existing, path));
}

function cleanNumber(value: unknown): number | "" {
  if (value === "") return "";
  const next = Number(value);
  return Number.isFinite(next) ? next : "";
}

function cleanString(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanUrl(value: unknown) {
  const next = cleanString(value, 500);
  return /^https?:\/\//i.test(next) ? next : "";
}

function cleanDate(value: unknown) {
  const next = cleanString(value, 80);
  return next && Number.isFinite(new Date(next).getTime()) ? next : undefined;
}

const API_STAT_TO_PROFILE_STAT: Record<string, keyof ProfilePetStats> = {
  agility: "agility",
  accuracy: "accuracy",
  protection: "protection",
  attack_power: "attackPower",
  movement_speed: "movementSpeed",
  max_stamina: "maxStamina",
  critical_damage: "criticalDamage",
  critical_chance: "criticalChance",
};

export const API_CLASS_TO_PROFILE_CLASS: Record<string, string> = {
  WARRIOR: "Warrior",
  SHADOWBLADE: "Shadowblade",
  SHADOW_BLADE: "Shadowblade",
  RANGER: "Ranger",
  MINER: "Miner",
  ANGLER: "Angler",
  CHEF: "Chef",
  LUMBERJACK: "Lumberjack",
  SMELTER: "Smelter",
  ALCHEMIST: "Alchemist",
  BLACKSMITH: "Blacksmith",
  BLACK_SMITH: "Blacksmith",
  BUILDER: "Builder",
  MONK: "Monk",
  BEASTMASTER: "Beastmaster",
  BEAST_MASTER: "Beastmaster",
  BANISHED: "Banished",
  FORSAKEN: "Forsaken",
  CURSED: "Cursed",
};

const LEVEL_100_EXPERIENCE = 15_878_925;
const ASCENSION_EXPERIENCE_STEP = 1_000_000;
export const ASCENSION_SKILL_KEYS = new Set([
  "woodcutting",
  "mining",
  "fishing",
  "alchemy",
  "smelting",
  "cooking",
  "forge",
  "construction",
  "meditation",
  "hunting-mastery",
  "combat",
  "dungeoneering",
]);

function mapApiPetStats(input: unknown): ProfilePetStats {
  const stats: ProfilePetStats = {
    agility: "",
    accuracy: "",
    protection: "",
    attackPower: "",
    movementSpeed: "",
    maxHealth: "",
    maxStamina: "",
    criticalDamage: "",
    criticalChance: "",
  };
  if (!isPlainObject(input)) return stats;
  for (const [apiKey, profileKey] of Object.entries(API_STAT_TO_PROFILE_STAT)) {
    stats[profileKey] = cleanNumber(input[apiKey]);
  }
  return stats;
}

function mapApiSkillMap(input: unknown) {
  if (!isPlainObject(input)) return {};
  return Object.fromEntries(Object.entries(input).filter(([, value]) => isPlainObject(value)).map(([key, value]) => [
    key,
    {
      level: apiSkillLevel(input, key),
      experience: cleanNumber((value as Record<string, unknown>).experience),
    },
  ]));
}

export function normalizeApiClassName(value: unknown) {
  const raw = cleanString(value, 40);
  if (!raw) return "";
  const lookupKey = raw.replace(/[\s-]+/g, "_").toUpperCase();
  return API_CLASS_TO_PROFILE_CLASS[lookupKey] || raw;
}

function apiSkillLevel(skillMap: Record<string, unknown>, key: string) {
  const record = skillMap[key];
  if (!isPlainObject(record)) return "";
  const baseLevel = cleanNumber(record.level);
  if (typeof baseLevel !== "number") return baseLevel;
  const ascensionLevel = apiAscensionLevel(record, key);
  return baseLevel === 100 && ascensionLevel > 0
    ? baseLevel + ascensionLevel
    : baseLevel;
}

function apiAscensionLevel(record: Record<string, unknown>, skillKey: string) {
  const direct = [
    record.ascension_level,
    record.ascensionLevel,
    record.ascension,
    record.ascended_level,
    record.ascendedLevel,
    record.level_of_ascension,
    record.levelOfAscension,
  ].map(cleanNumber).find((value): value is number => typeof value === "number" && value > 0);
  if (typeof direct === "number") return direct;

  const ascension = record.ascension;
  if (isPlainObject(ascension)) {
    const nested = [
      ascension.level,
      ascension.current_level,
      ascension.currentLevel,
      ascension.value,
    ].map(cleanNumber).find((value): value is number => typeof value === "number" && value > 0);
    if (typeof nested === "number") return nested;
  }

  if (!ASCENSION_SKILL_KEYS.has(skillKey)) return 0;
  const experience = cleanNumber(record.experience);
  return typeof experience === "number" && experience >= LEVEL_100_EXPERIENCE + ASCENSION_EXPERIENCE_STEP
    ? Math.floor((experience - LEVEL_100_EXPERIENCE) / ASCENSION_EXPERIENCE_STEP)
    : 0;
}

function mapApiMetrics(input: unknown, importedAt: string, endpointUpdatedAt?: string) {
  if (!isPlainObject(input)) return undefined;
  return {
    importedAt,
    endpointUpdatedAt,
    categories: Object.fromEntries(Object.entries(input).filter(([, value]) => isPlainObject(value)).map(([category, values]) => [
      category,
      Object.fromEntries(Object.entries(values as Record<string, unknown>)
        .map(([key, value]) => [key, Number(value)])
        .filter(([, value]) => Number.isFinite(value as number))),
    ])),
  };
}

function mapApiOwnedPets(input: unknown, importedAt: string): ProfileOwnedPet[] {
  const pets = Array.isArray(input) ? input : [];
  return pets.filter(isPlainObject).map((pet) => {
    const evolution = isPlainObject(pet.evolution) ? pet.evolution : {};
    const location = isPlainObject(pet.location) ? pet.location : {};
    const health = isPlainObject(pet.health) ? pet.health : {};
    const battle = isPlainObject(pet.battle) ? pet.battle : {};
    return {
      id: `api_pet_${cleanNumber(pet.id) || Math.random().toString(36).slice(2, 10)}`,
      apiId: cleanNumber(pet.id) || undefined,
      petId: cleanNumber(pet.pet_id) || undefined,
      species: cleanString(pet.name, 80),
      nickname: cleanString(pet.custom_name, 80),
      imageUrl: cleanUrl(pet.image_url) || undefined,
      quality: cleanString(pet.quality, 40),
      level: cleanNumber(pet.level),
      experience: cleanNumber(pet.experience),
      totalExperience: cleanNumber(pet.total_experience),
      evolution: cleanNumber(evolution.state),
      evolutionMax: cleanNumber(evolution.max),
      evolutionBonusPerStage: cleanNumber(evolution.bonus_per_stage),
      evolutionCurrentBonus: cleanNumber(evolution.current_bonus),
      evolutionNextBonus: cleanNumber(evolution.next_bonus),
      evolutionCanEvolve: Boolean(evolution.can_evolve),
      evolutionTargets: Array.isArray(evolution.targets)
        ? evolution.targets.filter(isPlainObject).map((target) => ({
            key: cleanString(target.key, 60),
            label: cleanString(target.label, 80),
          }))
        : [],
      active: Boolean(pet.equipped),
      equipped: Boolean(pet.equipped),
      source: "imported",
      importedAt,
      stats: mapApiPetStats(pet.stats),
      health: {
        current: cleanNumber(health.current),
        maximum: cleanNumber(health.maximum),
        percentage: cleanNumber(health.percentage),
      },
      battle: battle.started_at || battle.ends_at ? {
        startedAt: cleanDate(battle.started_at),
        endsAt: cleanDate(battle.ends_at),
      } : undefined,
      location: location.name || location.id ? {
        id: cleanNumber(location.id) || undefined,
        name: cleanString(location.name, 120),
        locked: typeof location.locked === "boolean" ? location.locked : undefined,
      } : undefined,
      createdAt: cleanDate(pet.created_at),
      notes: "",
    };
  });
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, b: number): number {
  return (n >>> b) | (n << (32 - b));
}

export function sha256Hex(ascii: string): string {
  const bytes = new TextEncoder().encode(ascii);
  const bitLen = bytes.length * 8;
  const numBlocks = Math.ceil((bytes.length + 9) / 64);
  const totalBytes = numBlocks * 64;
  const padded = new Uint8Array(totalBytes);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(totalBytes - 8, BigInt(bitLen), false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let i = 0; i < totalBytes; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + s1 + ch + SHA256_K[j] + w[j]) | 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const out = new DataView(new ArrayBuffer(32));
  out.setUint32(0, h0, false);
  out.setUint32(4, h1, false);
  out.setUint32(8, h2, false);
  out.setUint32(12, h3, false);
  out.setUint32(16, h4, false);
  out.setUint32(20, h5, false);
  out.setUint32(24, h6, false);
  out.setUint32(28, h7, false);

  let hex = "";
  const u8 = new Uint8Array(out.buffer);
  for (let i = 0; i < 32; i++) {
    hex += u8[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export function normalizeIdleMmoProfileImport(input: {
  hash?: string;
  characterHashDigest?: string;
  information?: unknown;
  metrics?: unknown;
  pets?: unknown;
  museum?: unknown;
  importedAt?: string;
}): ImportedProfileDraft {
  const importedAt = input.importedAt || new Date().toISOString();
  const info = isPlainObject(input.information) ? input.information : {};
  const character = isPlainObject(info.character) ? info.character : info;
  const metricsPayload = isPlainObject(input.metrics) ? input.metrics : {};
  const petsPayload = isPlainObject(input.pets) ? input.pets : {};
  const equippedPet = isPlainObject(character.equipped_pet) ? character.equipped_pet : undefined;
  const ownedPets = mapApiOwnedPets(isPlainObject(petsPayload) ? petsPayload.pets : [], importedAt);
  const activeOwnedPet = ownedPets.find((pet) => pet.equipped);
  const stats = mapApiSkillMap(character.stats);
  const skills = mapApiSkillMap(character.skills);
  const levelSources = { ...skills, ...stats };

  return {
    name: cleanString(character.name, 40),
    className: normalizeApiClassName(character.class),
    imageUrl: cleanUrl(character.image_url),
    backgroundUrl: cleanUrl(character.background_url),
    currentStatus: cleanString(character.current_status, 40),
    location: isPlainObject(character.location) ? {
      id: cleanNumber(character.location.id) || undefined,
      name: cleanString(character.location.name, 120),
    } : undefined,
    guild: isPlainObject(character.guild) ? {
      id: cleanNumber(character.guild.id) || undefined,
      tag: cleanString(character.guild.tag, 24),
      level: cleanNumber(character.guild.level),
      position: cleanString(character.guild.position, 80),
    } : undefined,
    levels: {
      totalLevel: cleanNumber(character.total_level),
      combat: apiSkillLevel(levelSources, "combat"),
      strength: apiSkillLevel(levelSources, "strength"),
      defence: apiSkillLevel(levelSources, "defence"),
      speed: apiSkillLevel(levelSources, "speed"),
      dexterity: apiSkillLevel(levelSources, "dexterity"),
      huntingMastery: apiSkillLevel(levelSources, "hunting-mastery"),
      dungeoneering: apiSkillLevel(levelSources, "dungeoneering"),
      petMastery: apiSkillLevel(levelSources, "pet-mastery"),
    },
    skills: {
      ...skills,
      ...stats,
    },
    pet: activeOwnedPet ? {
      species: activeOwnedPet.species,
      quality: activeOwnedPet.quality,
      level: activeOwnedPet.level,
      evolution: activeOwnedPet.evolution,
      stats: activeOwnedPet.stats,
      notes: activeOwnedPet.nickname ? `Imported equipped pet: ${activeOwnedPet.nickname}` : "",
    } : equippedPet ? {
      species: cleanString(equippedPet.name, 80),
      quality: "",
      level: cleanNumber(equippedPet.level),
      evolution: "",
      stats: mapApiPetStats({}),
      notes: "",
    } : undefined,
    ownedPets,
    metricsSnapshot: mapApiMetrics(
      isPlainObject(metricsPayload) ? metricsPayload.metrics : undefined,
      importedAt,
      cleanDate(metricsPayload.endpoint_updates_at),
    ),
    museum: input.museum ? sanitizeMuseumSnapshot(input.museum) : undefined,
    importSource: {
      mode: "imported",
      characterHashTail: input.hash?.slice(-12),
      characterHashDigest: typeof input.characterHashDigest === "string" && input.characterHashDigest.trim()
        ? input.characterHashDigest.trim().slice(0, 128)
        : (input.hash?.trim() ? sha256Hex(input.hash.trim()) : undefined),
      importedAt,
      refreshedAt: importedAt,
      importedSections: [
        "information",
        ...(input.metrics ? ["metrics"] : []),
        ...(input.pets ? ["pets"] : []),
        ...(input.museum ? ["museum"] : []),
      ],
      missingOrPrivate: [],
      notes: "Saved from visible IdleMMO character details.",
    },
  };
}

export function mergeImportedProfileDraft(
  existing: CharacterProfile,
  importedDraft: ImportedProfileDraft,
  importedAt = new Date().toISOString(),
): ImportedProfileMergeResult {
  const sanitizedExisting = sanitizeProfile(existing);
  const draftPaths = collectImportDraftPaths(importedDraft);
  const appliedPaths: string[] = [];
  const skippedManualPaths: string[] = [];
  const merged = JSON.parse(JSON.stringify(sanitizedExisting)) as Record<string, unknown>;

  for (const path of draftPaths) {
    const nextValue = getPathValue(importedDraft, path);
    if (typeof nextValue === "undefined") continue;
    if (shouldPreserveManual(sanitizedExisting, path, nextValue)) {
      skippedManualPaths.push(path);
      continue;
    }
    setPathValue(merged, path, nextValue);
    appliedPaths.push(path);
  }

  const previousImportSource = sanitizedExisting.importSource;
  const incomingImportSource = sanitizeProfileImportSource({
    ...previousImportSource,
    ...importedDraft.importSource,
    mode: previousImportSource.mode === "manual" ? "mixed" : previousImportSource.mode,
    refreshedAt: importedAt,
    importedSections: Array.from(new Set([
      ...previousImportSource.importedSections,
      ...(importedDraft.importSource?.importedSections || []),
    ])),
    missingOrPrivate: Array.from(new Set([
      ...previousImportSource.missingOrPrivate,
      ...(importedDraft.importSource?.missingOrPrivate || []),
    ])),
  });

  const profile = sanitizeProfile({
    ...merged,
    importSource: incomingImportSource,
    fieldSources: markProfileFieldSources(
      sanitizedExisting.fieldSources,
      appliedPaths,
      "imported",
      importedAt,
    ),
    updatedAt: importedAt,
  } as Partial<CharacterProfile>);

  return {
    profile,
    appliedPaths,
    skippedManualPaths,
  };
}
