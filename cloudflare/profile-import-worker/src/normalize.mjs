import { cryptoRandomId, sha256Hex } from "./security.mjs";

const MUSEUM_CATEGORIES = new Set([
  "SKINS",
  "BACKGROUNDS",
  "GUILD_ICONS",
  "PETS",
  "COLLECTIBLES",
  "BESTIARY",
]);

const API_STAT_TO_PROFILE_STAT = {
  agility: "agility",
  accuracy: "accuracy",
  protection: "protection",
  attack_power: "attackPower",
  movement_speed: "movementSpeed",
  max_stamina: "maxStamina",
  critical_damage: "criticalDamage",
  critical_chance: "criticalChance",
};

const API_CLASS_TO_PROFILE_CLASS = {
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
const ASCENSION_SKILL_KEYS = new Set([
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

export async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  return request.json();
}

export async function readJsonBody(request, { allowArray = false } = {}) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { ok: true, value: allowArray ? {} : {} };
  }
  let parsed;
  try {
    parsed = await request.json();
  } catch {
    return { ok: false, message: "Invalid JSON body." };
  }
  const valid = allowArray
    ? (isPlainObject(parsed) || Array.isArray(parsed))
    : isPlainObject(parsed);
  if (!valid) {
    return { ok: false, message: "Request body must be an object." };
  }
  return { ok: true, value: parsed };
}

export function normalizeUsagePath(value) {
  const text = cleanString(value, 160);
  if (!text.startsWith("/")) return "";
  return text.split(/[?#]/)[0].slice(0, 120) || "/";
}

export function normalizeReferrerHost(value) {
  const text = cleanString(value, 260);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return cleanString(parsed.hostname.replace(/^www\./, ""), 120);
  } catch {
    return "";
  }
}

export function normalizeDeviceType(value) {
  const text = cleanString(value, 24).toLowerCase();
  return ["mobile", "tablet", "desktop"].includes(text) ? text : "unknown";
}

export function normalizeWebVitalMetricName(value) {
  const text = cleanString(value, 12).toUpperCase();
  return ["CLS", "FCP", "INP", "LCP", "TTFB"].includes(text) ? text : "";
}

export function normalizeWebVitalValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(Math.min(number, 120000) * 1000) / 1000;
}

export function normalizeWebVitalRating(value) {
  const text = cleanString(value, 32).toLowerCase();
  return ["good", "needs-improvement", "poor"].includes(text) ? text : "unknown";
}

export function normalizeNavigationType(value) {
  const text = cleanString(value, 32).toLowerCase();
  return ["navigate", "reload", "back-forward", "restore", "prerender"].includes(text) ? text : "unknown";
}

export function normalizeErrorSource(value) {
  const text = cleanString(value, 24).toLowerCase();
  return ["client", "server"].includes(text) ? text : "client";
}

export function normalizeErrorEventType(value) {
  const text = cleanString(value, 32).toLowerCase();
  return ["route_error", "app_shell_error", "server_request_error"].includes(text) ? text : "route_error";
}

export function normalizeErrorDigest(value) {
  return cleanString(value, 128).replace(/[^A-Za-z0-9_./:-]/g, "");
}

export function normalizeBrowserClass(value) {
  const text = cleanString(value, 24).toLowerCase();
  return ["chrome", "edge", "firefox", "safari", "bot", "other", "unknown"].includes(text) ? text : "unknown";
}

export function userAgentFamilyFrom(userAgent) {
  const ua = String(userAgent || "").toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome/") || ua.includes("crios/")) return "chrome";
  if (ua.includes("firefox/") || ua.includes("fxios/")) return "firefox";
  if (ua.includes("safari/")) return "safari";
  return ua ? "other" : "unknown";
}

export function cleanString(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanIso(value) {
  const text = cleanString(value, 80);
  return text && Number.isFinite(new Date(text).getTime()) ? text : "";
}

export function isExpiredIso(value) {
  const time = new Date(value).getTime();
  return !value || !Number.isFinite(time) || time <= Date.now();
}

export function safeParseJson(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function readPositiveInt(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : fallback;
}

export function readNonNegativeInt(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? Math.floor(next) : fallback;
}

export function roundMetric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 10) / 10 : 0;
}

export function roundWebVitalMetric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 1000) / 1000 : 0;
}

export function percentile75(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.75) - 1);
  return roundWebVitalMetric(sorted[Math.min(index, sorted.length - 1)]);
}

export function percentage(part, total) {
  const denominator = Number(total);
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return roundMetric((Number(part || 0) / denominator) * 100);
}

export function secondsSince(value, now) {
  if (!value) return 0;
  const started = new Date(value).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.round((now.getTime() - started) / 1000));
}

export function secondsBetween(startValue, endValue) {
  if (!startValue) return 0;
  const started = new Date(startValue).getTime();
  const ended = endValue instanceof Date ? endValue.getTime() : new Date(endValue).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return 0;
  return Math.max(0, Math.round((ended - started) / 1000));
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function cleanNumber(value) {
  if (value === "") return "";
  const next = Number(value);
  return Number.isFinite(next) ? next : "";
}

export function cleanUrl(value) {
  const next = cleanString(value, 500);
  return /^https?:\/\//i.test(next) ? next : "";
}

export function cleanDate(value) {
  const next = cleanString(value, 80);
  return next && Number.isFinite(new Date(next).getTime()) ? next : undefined;
}

export function normalizeMuseumCategory(value) {
  const normalized = cleanString(value, 80)
    .replace(/[-\s]+/g, "_")
    .toUpperCase();
  return MUSEUM_CATEGORIES.has(normalized) ? normalized : "";
}

export function sanitizeMuseumItem(input) {
  if (!isPlainObject(input)) return null;
  const category = normalizeMuseumCategory(input.category || input.type || input.collection);
  const id = input.id ?? input.item_id ?? input.itemId ?? input.key;
  const name = cleanString(input.name || input.item_name || input.label, 120);
  const quantity = Math.max(0, Math.floor(Number(input.quantity ?? input.count ?? 1)));
  const imageUrl = cleanUrl(input.imageUrl || input.image_url || input.icon_url);
  if (!category || !name || (typeof id !== "string" && typeof id !== "number")) return null;
  return { category, id, name, quantity, imageUrl };
}

export function parseMuseumEndpointPage(input) {
  const record = isPlainObject(input) ? input : {};
  const pagination = isPlainObject(record.pagination) ? record.pagination : {};
  const rawItems = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.data)
      ? record.data
      : Array.isArray(record.museum)
        ? record.museum
        : [];
  const currentPage = Math.max(1, Math.floor(Number(pagination.current_page || pagination.currentPage || record.current_page || 1)));
  const lastPage = Math.max(1, Math.floor(Number(pagination.last_page || pagination.lastPage || record.last_page || currentPage)));
  const perPage = Math.max(0, Math.floor(Number(pagination.per_page || pagination.perPage || record.per_page || rawItems.length)));
  const total = Math.max(0, Math.floor(Number(pagination.total || record.total || rawItems.length)));
  return {
    items: rawItems.map(sanitizeMuseumItem).filter(Boolean),
    currentPage,
    lastPage,
    perPage,
    total,
  };
}

export function mapApiPetStats(input) {
  const stats = {
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

export function mapApiSkillMap(input) {
  if (!isPlainObject(input)) return {};
  return Object.fromEntries(Object.entries(input)
    .filter(([, value]) => isPlainObject(value))
    .map(([key, value]) => [
      key,
      {
        level: apiSkillLevel(input, key),
        experience: cleanNumber(value.experience),
      },
    ]));
}

export function normalizeApiClassName(value) {
  const raw = cleanString(value, 40);
  if (!raw) return "";
  const lookupKey = raw.replace(/[\s-]+/g, "_").toUpperCase();
  return API_CLASS_TO_PROFILE_CLASS[lookupKey] || raw;
}

export function apiSkillLevel(skillMap, key) {
  const record = skillMap[key];
  if (!isPlainObject(record)) return "";
  const baseLevel = cleanNumber(record.level);
  if (typeof baseLevel !== "number") return baseLevel;
  const ascensionLevel = apiAscensionLevel(record, key);
  return baseLevel === 100 && ascensionLevel > 0
    ? baseLevel + ascensionLevel
    : baseLevel;
}

export function apiAscensionLevel(record, skillKey) {
  const direct = [
    record.ascension_level,
    record.ascensionLevel,
    record.ascension,
    record.ascended_level,
    record.ascendedLevel,
    record.level_of_ascension,
    record.levelOfAscension,
  ].map(cleanNumber).find((value) => typeof value === "number" && value > 0);
  if (typeof direct === "number") return direct;

  const ascension = record.ascension;
  if (isPlainObject(ascension)) {
    const nested = [
      ascension.level,
      ascension.current_level,
      ascension.currentLevel,
      ascension.value,
    ].map(cleanNumber).find((value) => typeof value === "number" && value > 0);
    if (typeof nested === "number") return nested;
  }

  if (!ASCENSION_SKILL_KEYS.has(skillKey)) return 0;
  const experience = cleanNumber(record.experience);
  return typeof experience === "number" && experience >= LEVEL_100_EXPERIENCE + ASCENSION_EXPERIENCE_STEP
    ? Math.floor((experience - LEVEL_100_EXPERIENCE) / ASCENSION_EXPERIENCE_STEP)
    : 0;
}

export function mapApiMetrics(input, importedAt, endpointUpdatedAt) {
  if (!isPlainObject(input)) return undefined;
  return {
    importedAt,
    endpointUpdatedAt,
    categories: Object.fromEntries(Object.entries(input)
      .filter(([, value]) => isPlainObject(value))
      .map(([category, values]) => [
        category,
        Object.fromEntries(Object.entries(values)
          .map(([key, value]) => [key, Number(value)])
          .filter(([, value]) => Number.isFinite(value))),
      ])),
  };
}

export function mapApiOwnedPets(input, importedAt) {
  const pets = Array.isArray(input) ? input : [];
  return pets.filter(isPlainObject).map((pet) => {
    const evolution = isPlainObject(pet.evolution) ? pet.evolution : {};
    const location = isPlainObject(pet.location) ? pet.location : {};
    const health = isPlainObject(pet.health) ? pet.health : {};
    const battle = isPlainObject(pet.battle) ? pet.battle : {};
    return {
      id: `api_pet_${cleanNumber(pet.id) || cryptoRandomId(6)}`,
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

export function normalizeIdleMmoProfileImport(input) {
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
    museum: input.museum,
    metricsSnapshot: mapApiMetrics(
      isPlainObject(metricsPayload) ? metricsPayload.metrics : undefined,
      importedAt,
      cleanDate(metricsPayload.endpoint_updates_at),
    ),
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
