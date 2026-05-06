import fs from "fs";
import path from "path";

export const BASE_URL = "https://api.idle-mmo.com/v1";
export const DEFAULT_DELAY_MS = 1050;

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

export function responseCount(data) {
  if (!data || typeof data !== "object") return undefined;
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) return value.length;
  }
  return undefined;
}

export function createFetchQueue({ apiKey, delayMs = DEFAULT_DELAY_MS, label = "IdleMMO" }) {
  if (!apiKey) {
    throw new Error("IDLEMMO_API_KEY is required. Put it in .env or pass it through the environment.");
  }

  let lastRequestAt = 0;
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
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < delayMs) await sleep(delayMs - elapsed);
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

  async function request(name, url, metadata = {}) {
    estimatedTotal = Math.max(estimatedTotal, completed + 1);
    progress(name, url);
    await waitForSlot();

    const fetchedAt = new Date().toISOString();
    let response = await fetch(url, { headers });
    let text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw_text: text };
    }

    if (response.status === 429) {
      const retryAfter = Number(data?.retry_after || response.headers.get("retry-after") || 60);
      const waitMs = (retryAfter + 2) * 1000;
      console.warn(`  rate limited; waiting ${formatDuration(waitMs)} before retrying ${name}`);
      await sleep(waitMs);
      return request(name, url, metadata);
    }

    completed += 1;
    console.log(`  -> HTTP ${response.status}${response.ok ? "" : " (not ok)"}`);

    return {
      meta: {
        fetched_at: fetchedAt,
        endpoint_url: url,
        status: response.status,
        ok: response.ok,
        endpoint_updates_at: data?.endpoint_updates_at ?? null,
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
