import fs from "fs";
import path from "path";

export const BASE_URL = "https://api.idle-mmo.com/v1";
export const RATE_LIMIT_KEY_RPM = 80;
export const DEFAULT_DELAY_MS = 1000;
export const RATE_PROFILES = {
  isolated: 68,
  shared: 60,
};

export const ITEM_SEARCH_TYPES = Object.freeze([
  "BAIT",
  "BLANK_SCROLL",
  "BOOTS",
  "BOW",
  "CAKE",
  "CAMPAIGN_ITEM",
  "CHEST",
  "CHESTPLATE",
  "COLLECTABLE",
  "CONSTRUCTION_MATERIAL",
  "CRAFTING_MATERIAL",
  "DAGGER",
  "EMPTY_CRYSTAL",
  "ESSENCE_CRYSTAL",
  "FELLING_AXE",
  "FISH",
  "FISHING_ROD",
  "FOOD",
  "GAUNTLETS",
  "GEMSTONE",
  "GREAVES",
  "HELMET",
  "LOG",
  "MEMBERSHIP",
  "METAL_BAR",
  "METAMORPHITE",
  "NAMESTONE",
  "ORE",
  "PET_EGG",
  "PICKAXE",
  "POTION",
  "RECIPE",
  "RELIC",
  "RESET_STONE",
  "SHIELD",
  "SPECIAL",
  "SWORD",
  "TELEPORTATION_STONE",
  "TOKEN",
  "UPGRADE_STONE",
  "VIAL",
]);

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const [rawKey, rawValue] = token.slice(2).split("=");
    const key = rawKey.trim();
    const next = rawValue ?? argv[index + 1];
    const isFlag = rawValue === undefined && (next === undefined || next.startsWith("--"));
    const value = isFlag ? true : next;
    if (!isFlag && rawValue === undefined) index += 1;

    if (args[key] === undefined) {
      args[key] = value;
    } else if (Array.isArray(args[key])) {
      args[key].push(value);
    } else {
      args[key] = [args[key], value];
    }
  }

  return args;
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readApiKey() {
  if (process.env.IDLEMMO_API_KEY) return process.env.IDLEMMO_API_KEY;

  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return "";

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*IDLEMMO_API_KEY\s*=\s*(.*)\s*$/);
    if (!match) continue;
    return match[1].replace(/^["']|["']$/g, "").trim();
  }

  return "";
}

export function toArray(value) {
  if (value === undefined || value === false) return [];
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function safeSlug(value, fallback = "unknown") {
  const slug = String(value || "")
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || fallback;
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "unknown";
  const seconds = Math.ceil(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tempFile = `${filePath}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(tempFile, filePath);
}

export function delayMsForRequestsPerMinute(requestsPerMinute) {
  const parsed = Number(requestsPerMinute);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DELAY_MS;
  // Cap at 76 req/min on the 80 req/min API key tier to preserve clock-jitter margin.
  return Math.ceil(60000 / Math.min(parsed, 76));
}

function getHeaderValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
}

export function parseRateLimitHeaders(headers) {
  const toFiniteOrNull = (raw) => {
    if (raw === null || raw === undefined || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const limit = toFiniteOrNull(getHeaderValue(headers, "x-ratelimit-limit"));
  const remaining = toFiniteOrNull(getHeaderValue(headers, "x-ratelimit-remaining"));
  const resetEpochSec = toFiniteOrNull(getHeaderValue(headers, "x-ratelimit-reset"));
  const retryAfterRaw = getHeaderValue(headers, "retry-after");
  const retryAfterSec = toFiniteOrNull(retryAfterRaw);
  return {
    limit,
    remaining,
    resetEpochSec,
    resetAtMs: resetEpochSec !== null ? resetEpochSec * 1000 : null,
    retryAfterSec,
  };
}

export function computeRateLimitWaitMs(
  headers,
  { reserveRemaining = 6, maxWaitMs = 75000, nowMs = Date.now() } = {},
) {
  const parsed = parseRateLimitHeaders(headers);
  if (parsed.remaining === null || parsed.remaining > reserveRemaining) {
    return 0;
  }
  if (parsed.resetAtMs !== null && parsed.resetAtMs > nowMs) {
    return Math.min(parsed.resetAtMs - nowMs + 500, maxWaitMs);
  }
  if (parsed.retryAfterSec !== null && parsed.retryAfterSec > 0) {
    return Math.min(parsed.retryAfterSec * 1000 + 500, maxWaitMs);
  }
  return Math.min(5000, maxWaitMs);
}

export function resolveRateLimitDelayMs({ explicitDelayMs, explicitRequestsPerMinute, profile } = {}) {
  if (explicitDelayMs !== undefined) {
    const parsedDelay = Number(explicitDelayMs);
    if (Number.isFinite(parsedDelay) && parsedDelay > 0) return Math.ceil(parsedDelay);
  }

  if (explicitRequestsPerMinute !== undefined) {
    return delayMsForRequestsPerMinute(explicitRequestsPerMinute);
  }

  const normalizedProfile = String(profile || process.env.IDLEMMO_RATE_PROFILE || "shared").toLowerCase();
  return delayMsForRequestsPerMinute(RATE_PROFILES[normalizedProfile] || RATE_PROFILES.shared);
}

export function responseCount(data) {
  if (!data || typeof data !== "object") return undefined;
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) return value.length;
  }
  return undefined;
}

export function createFetchQueue({
  apiKey,
  delayMs = DEFAULT_DELAY_MS,
  label = "IdleMMO",
  reserveRemaining = 8,
  timeoutMs = 20000,
  maxRetries = 4,
} = {}) {
  if (!apiKey) {
    throw new Error("IDLEMMO_API_KEY is required. Put it in .env or pass it through the environment.");
  }

  let lastRequestAt = 0;
  let rateLimitCooldownUntil = 0;
  let completed = 0;
  let estimatedTotal = 0;
  const startedAt = Date.now();

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "User-Agent": "ZenithCompanionResearch/1.0",
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function waitForSlot() {
    const targetAt = Math.max(lastRequestAt + delayMs, rateLimitCooldownUntil);
    const waitMs = targetAt - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    lastRequestAt = Date.now();
  }

  function progress(name, url) {
    const done = completed;
    const total = Math.max(estimatedTotal, done + 1);
    const elapsed = Date.now() - startedAt;
    const avg = done > 0 ? elapsed / done : delayMs;
    const remaining = Math.max(0, total - done);
    const eta = formatDuration(remaining * avg);
    console.log(`[${label}] ${done + 1}/${total} ${name}`);
    console.log(`  ${url}`);
    console.log(`  elapsed ${formatDuration(elapsed)} | ETA ${eta}`);
  }

  async function request(name, url, metadata = {}, attempt = 0) {
    if (attempt === 0) {
      estimatedTotal = Math.max(estimatedTotal, completed + 1);
      progress(name, url);
    }
    await waitForSlot();

    const fetchedAt = new Date().toISOString();
    let response;
    try {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
      if (attempt < maxRetries) {
        const waitMs = Math.min(delayMs * (2 ** (attempt + 1)), 60000);
        console.warn(`  request error (${error.message}); waiting ${formatDuration(waitMs)} before retry ${attempt + 1}/${maxRetries} for ${name}`);
        await sleep(waitMs);
        return request(name, url, metadata, attempt + 1);
      }
      throw error;
    }

    const headerWaitMs = computeRateLimitWaitMs(response.headers, { reserveRemaining });
    if (headerWaitMs > 0) {
      rateLimitCooldownUntil = Math.max(rateLimitCooldownUntil, Date.now() + headerWaitMs);
    }

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw_text: text };
    }

    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(data?.retry_after || response.headers.get("retry-after") || 0);
      const waitMs = retryAfter > 0
        ? (retryAfter + 2) * 1000
        : Math.max(headerWaitMs, Math.min(delayMs * (2 ** (attempt + 1)), 75000));
      console.warn(`  HTTP ${response.status}; waiting ${formatDuration(waitMs)} before retry ${attempt + 1}/${maxRetries} for ${name}`);
      await sleep(waitMs);
      return request(name, url, metadata, attempt + 1);
    }

    completed += 1;
    const rateInfo = parseRateLimitHeaders(response.headers);
    console.log(`  -> HTTP ${response.status}${response.ok ? "" : " (not ok)"}`);

    return {
      meta: {
        fetched_at: fetchedAt,
        endpoint_url: url,
        status: response.status,
        ok: response.ok,
        endpoint_updates_at: data?.endpoint_updates_at ?? null,
        rate_limit_remaining: rateInfo.remaining,
        count: responseCount(data),
        ...metadata,
      },
      data,
    };
  }

  function addEstimated(count) {
    estimatedTotal += count;
  }

  function stats() {
    return {
      completed,
      estimated_total: estimatedTotal,
      elapsed_ms: Date.now() - startedAt,
    };
  }

  return { request, addEstimated, stats };
}

export async function searchItems({ query, type, page = 1, apiKey } = {}) {
  const resolvedApiKey = apiKey || readApiKey();
  if (!resolvedApiKey) {
    throw new Error("IDLEMMO_API_KEY is required to search items.");
  }
  const url = new URL(`${BASE_URL}/item/search`);
  if (query) url.searchParams.set("query", String(query));
  if (type) url.searchParams.set("type", String(type));
  if (page) url.searchParams.set("page", String(page));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${resolvedApiKey}`,
      Accept: "application/json",
      "User-Agent": "ZenithCompanion/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Item search failed with HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

export async function checkAuth({ apiKey } = {}) {
  const resolvedApiKey = apiKey || readApiKey();
  if (!resolvedApiKey) {
    throw new Error("IDLEMMO_API_KEY is required to check auth.");
  }
  const response = await fetch(`${BASE_URL}/auth/check`, {
    headers: {
      Authorization: `Bearer ${resolvedApiKey}`,
      Accept: "application/json",
      "User-Agent": "ZenithCompanion/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Auth check failed with HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

export async function fetchGuildActivity({ guildId, page = 1, characterHashedId, apiKey } = {}) {
  const resolvedApiKey = apiKey || readApiKey();
  if (!resolvedApiKey) {
    throw new Error("IDLEMMO_API_KEY is required to fetch guild activity.");
  }
  const url = new URL(`${BASE_URL}/guild/${encodeURIComponent(guildId)}/activity`);
  if (page) url.searchParams.set("page", String(page));
  if (characterHashedId) url.searchParams.set("character_hashed_id", String(characterHashedId));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${resolvedApiKey}`,
      Accept: "application/json",
      "User-Agent": "ZenithCompanion/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Guild activity fetch failed with HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

export async function fetchCharacterEffects({ characterHash, apiKey } = {}) {
  const resolvedApiKey = apiKey || readApiKey();
  if (!resolvedApiKey) {
    throw new Error("IDLEMMO_API_KEY is required to fetch character effects.");
  }
  const response = await fetch(`${BASE_URL}/character/${encodeURIComponent(characterHash)}/effects`, {
    headers: {
      Authorization: `Bearer ${resolvedApiKey}`,
      Accept: "application/json",
      "User-Agent": "ZenithCompanion/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Character effects fetch failed with HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

export async function fetchCharacterCurrentAction({ characterHash, apiKey } = {}) {
  const resolvedApiKey = apiKey || readApiKey();
  if (!resolvedApiKey) {
    throw new Error("IDLEMMO_API_KEY is required to fetch character current action.");
  }
  const response = await fetch(`${BASE_URL}/character/${encodeURIComponent(characterHash)}/current-action`, {
    headers: {
      Authorization: `Bearer ${resolvedApiKey}`,
      Accept: "application/json",
      "User-Agent": "ZenithCompanion/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Character current action fetch failed with HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}
