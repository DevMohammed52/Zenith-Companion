export const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export const DEFAULT_USAGE_PING_MAX_PER_MINUTE = 120;
export const DEFAULT_USAGE_VITALS_MAX_PER_MINUTE = 80;
export const DEFAULT_ERROR_REPORT_MAX_PER_MINUTE = 30;
export const DEFAULT_IMPORT_STATUS_MAX_PER_MINUTE = 120;

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;
const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6_PATTERN = /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/;

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

function cleanStr(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function readPosInt(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : fallback;
}

export function json(payload, status = 200, headers = JSON_HEADERS) {
  return new Response(JSON.stringify(payload), { status, headers });
}

export function extractRequestId(request) {
  const raw = request?.headers?.get ? request.headers.get("x-request-id") : request?.headers?.["x-request-id"];
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return REQUEST_ID_PATTERN.test(trimmed) ? trimmed : "";
}

export function buildCorsHeaders(request, env) {
  const headers = { ...JSON_HEADERS };
  const requestId = extractRequestId(request);
  if (requestId) {
    headers["x-request-id"] = requestId;
  }
  const origin = request.headers.get("origin");
  if (origin && isAllowedOrigin(request, env)) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
    headers["access-control-allow-methods"] = "GET,POST,OPTIONS";
    headers["access-control-allow-headers"] = "content-type,authorization,x-request-id";
    headers["access-control-max-age"] = "86400";
  }
  return headers;
}

export function isAllowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) return String(env.ALLOW_ORIGINLESS_IMPORTS || "").trim() === "1";
  const allowed = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

export async function timingSafeEqualString(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const encoder = new TextEncoder();
  const subtle = globalThis.crypto?.subtle || crypto?.subtle;
  const [digestA, digestB] = await Promise.all([
    subtle.digest("SHA-256", encoder.encode(a)),
    subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const bufA = new Uint8Array(digestA);
  const bufB = new Uint8Array(digestB);
  let mismatch = bufA.length ^ bufB.length;
  for (let i = 0; i < bufA.length; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }
  return mismatch === 0;
}

export async function hasBearerSecret(request, secret) {
  const auth = (request?.headers?.get ? request.headers.get("authorization") : request?.headers?.authorization) || "";
  const expected = typeof secret === "string" ? secret.trim() : "";
  if (!expected || !auth || !auth.startsWith("Bearer ")) return false;
  return await timingSafeEqualString(auth.slice(7).trim(), expected);
}

export async function verifyTurnstile(env, token, _request = null) {
  if (!token || typeof token !== "string") return { ok: false };
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const result = await response.json().catch(() => ({}));
  return { ok: Boolean(result.success) };
}

export function isValidIp(ip) {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  if (IPV4_PATTERN.test(trimmed)) return true;
  return IPV6_PATTERN.test(trimmed);
}

export function requesterKey(request, isTrustedProxy = false) {
  if (!request) return "unknown-requester";
  const getHeader = (name) => {
    if (typeof request.headers?.get === "function") {
      return request.headers.get(name);
    }
    return request.headers?.[name] || null;
  };

  if (isTrustedProxy) {
    const rawXff = getHeader("x-forwarded-for");
    if (rawXff) {
      const firstIp = rawXff.split(",")[0].trim().replace(/^\[|\]$/g, "");
      if (isValidIp(firstIp)) {
        return firstIp;
      }
    }
  }

  const cfIp = getHeader("cf-connecting-ip");
  if (cfIp) {
    const trimmed = cfIp.trim().replace(/^\[|\]$/g, "");
    if (isValidIp(trimmed)) {
      return trimmed;
    }
  }

  return "unknown-requester";
}

export async function isTrustedProxyRequest(request, env) {
  if (!request || !env) return false;
  const auth = (request?.headers?.get ? request.headers.get("authorization") : request?.headers?.authorization) || "";
  if (!auth || !auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;

  const candidates = [
    env.USAGE_PING_SECRET,
    env.ERROR_REPORT_SECRET,
    env.ADMIN_DASHBOARD_SECRET,
    env.SCRAPER_COORDINATOR_SECRET,
    env.PROFILE_IMPORT_PROXY_SECRET,
  ].filter((s) => typeof s === "string" && s.trim());

  for (const secret of candidates) {
    if (await timingSafeEqualString(token, secret.trim())) {
      return true;
    }
  }
  return false;
}

export const TELEMETRY_RATE_LIMITS = new Map();
const TELEMETRY_WINDOW_MS = 60 * 1000;
const MAX_TELEMETRY_STORE_ENTRIES = 2000;
let lastTelemetryCleanupAt = 0;

export function resetTelemetryRateLimits(store = TELEMETRY_RATE_LIMITS) {
  store.clear();
  lastTelemetryCleanupAt = 0;
}

export function cleanupTelemetryRateLimits(store = TELEMETRY_RATE_LIMITS, now = Date.now()) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
  if (store.size > MAX_TELEMETRY_STORE_ENTRIES) {
    for (const key of store.keys()) {
      store.delete(key);
      if (store.size <= MAX_TELEMETRY_STORE_ENTRIES) break;
    }
  }
  lastTelemetryCleanupAt = now;
}

export function checkInMemoryRateLimit(key, maxPerMinute, store = TELEMETRY_RATE_LIMITS, now = Date.now()) {
  if (!maxPerMinute || maxPerMinute <= 0) return { ok: true };

  let entry = store.get(key);
  if (entry && entry.resetAt <= now) {
    store.delete(key);
    entry = undefined;
  }

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + TELEMETRY_WINDOW_MS });
    if (store.size > 500 && now - lastTelemetryCleanupAt > 5000) {
      cleanupTelemetryRateLimits(store, now);
    }
    return { ok: true };
  }

  if (entry.count >= maxPerMinute) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { ok: true };
}

export function errorReportSecret(env) {
  const dedicated = typeof env?.ERROR_REPORT_SECRET === "string" ? env.ERROR_REPORT_SECRET.trim() : "";
  const fallback = typeof env?.USAGE_PING_SECRET === "string" ? env.USAGE_PING_SECRET.trim() : "";
  return dedicated || fallback;
}

export async function checkUsagePingRateLimit(request, env, isTrusted = undefined) {
  const maxPerMinute = readPosInt(env?.USAGE_PING_MAX_PER_MINUTE, DEFAULT_USAGE_PING_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`usage:${requester}`, env?.IMPORT_SIGNING_SECRET || "usage-secret");
  const store = env?.__telemetryRateLimits || TELEMETRY_RATE_LIMITS;
  return checkInMemoryRateLimit(`usage-ping:${requesterFingerprint.slice(0, 32)}`, maxPerMinute, store);
}

export async function checkUsageVitalsRateLimit(request, env, isTrusted = undefined) {
  const maxPerMinute = readPosInt(env?.USAGE_VITALS_MAX_PER_MINUTE, DEFAULT_USAGE_VITALS_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`vitals:${requester}`, env?.IMPORT_SIGNING_SECRET || "vitals-secret");
  const store = env?.__telemetryRateLimits || TELEMETRY_RATE_LIMITS;
  return checkInMemoryRateLimit(`usage-vitals:${requesterFingerprint.slice(0, 32)}`, maxPerMinute, store);
}

export async function checkErrorReportRateLimit(request, env, isTrusted = undefined) {
  const maxPerMinute = readPosInt(env?.ERROR_REPORT_MAX_PER_MINUTE, DEFAULT_ERROR_REPORT_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`error:${requester}`, env?.IMPORT_SIGNING_SECRET || "error-secret");
  const store = env?.__telemetryRateLimits || TELEMETRY_RATE_LIMITS;
  return checkInMemoryRateLimit(`error-report:${requesterFingerprint.slice(0, 32)}`, maxPerMinute, store);
}

export async function checkImportStatusRateLimit(request, env, isTrusted = undefined) {
  if (!request) return { ok: true };
  const maxPerMinute = readPosInt(env?.IMPORT_STATUS_MAX_PER_MINUTE, DEFAULT_IMPORT_STATUS_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`status:${requester}`, env?.IMPORT_SIGNING_SECRET || "status-secret");
  return await checkD1MinuteRateLimit(env, `import-status:${requesterFingerprint.slice(0, 32)}`, maxPerMinute);
}

export async function checkD1MinuteRateLimit(env, source, maxPerMinute) {
  if (!maxPerMinute || !env.DB) return { ok: true };

  const now = Date.now();
  const minuteKey = String(Math.floor(now / 60000));
  const updatedAt = new Date(now).toISOString();
  try {
    const row = await env.DB.prepare(`
      INSERT INTO minute_budgets (minute_key, source, used_requests, mode, updated_at)
      VALUES (?, ?, 1, 'rate_limit', ?)
      ON CONFLICT(minute_key, source) DO UPDATE SET
        used_requests = minute_budgets.used_requests + 1,
        mode = excluded.mode,
        updated_at = excluded.updated_at
      WHERE minute_budgets.used_requests < ?
      RETURNING used_requests
    `).bind(minuteKey, cleanStr(source, 96), updatedAt, maxPerMinute).first();

    if (!row) {
      return { ok: false, retryAfterSeconds: Math.max(1, 60 - Math.floor((now % 60000) / 1000)) };
    }
  } catch {
    return { ok: true };
  }

  return { ok: true };
}

function rotr(n, b) {
  return (n >>> b) | (n << (32 - b));
}

export function sha256Hex(ascii) {
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

export async function fingerprint(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(signature);
}

export async function encryptText(value, secret) {
  const keyMaterial = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", keyMaterial, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );
  return `${base64Url(iv)}.${base64Url(encrypted)}`;
}

export async function decryptText(value, secret) {
  const [ivText, encryptedText] = String(value || "").split(".");
  if (!ivText || !encryptedText) throw Object.assign(new Error("Invalid encrypted hash."), { code: "invalid_job_payload" });
  const keyMaterial = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", keyMaterial, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(ivText) },
    key,
    base64UrlToBytes(encryptedText),
  );
  return new TextDecoder().decode(decrypted);
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function cryptoRandomId(bytes) {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function base64Url(value) {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
