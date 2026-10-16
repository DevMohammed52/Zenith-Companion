const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const HASH_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const JOB_ID_PATTERN = /^imp_[A-Za-z0-9_-]{20,80}$/;
const COORDINATOR_TTL_SECONDS = 90 * 60;
const JOB_TTL_MS = 60 * 60 * 1000;
const DEFAULT_POLL_MS = 2000;
const DEFAULT_BASELINE_REQUEST_CAP = 45;
const DEFAULT_MUSEUM_MAX_PAGES_PER_CHARACTER = 8;
const DEFAULT_USAGE_PING_MAX_PER_MINUTE = 120;
const DEFAULT_USAGE_VITALS_MAX_PER_MINUTE = 80;
const DEFAULT_ERROR_REPORT_MAX_PER_MINUTE = 30;
export const DEFAULT_IMPORT_STATUS_MAX_PER_MINUTE = 120;
export const TERMINAL_STATUS_CACHE_CONTROL = "public, max-age=15, s-maxage=30, stale-while-revalidate=60";
export const NOT_FOUND_STATUS_CACHE_CONTROL = "public, max-age=5, s-maxage=10";
const RATE_LIMIT_COUNTER_RETENTION_MS = 2 * 60 * 60 * 1000;
export const STALE_RUNNING_JOB_TIMEOUT_MS = 180000;
export const MAX_IMPORT_RETRIES = 3;
export const STEP_LEASE_MS = 25000;
export const IMPORT_STEPS = {
  ROOT_BASELINE: "root_baseline",
  ACCOUNT_MUSEUM: "account_museum",
  ALT_CHARACTERS: "alt_characters",
  FINAL_ASSEMBLY: "final_assembly",
};
export const STEP_METADATA = {
  root_baseline: { index: 1, total: 4, label: "Reading root character" },
  account_museum: { index: 2, total: 4, label: "Scanning museum" },
  alt_characters: { index: 3, total: 4, label: "Importing alt characters" },
  final_assembly: { index: 4, total: 4, label: "Assembling character profiles" },
};
const DEFAULT_COORDINATOR_SOURCES = [
  "github-actions:update_data",
  "github-actions:update_guild_data",
];
const ADMIN_TIMEFRAMES = [
  { key: "15m", label: "15 min", ms: 15 * 60 * 1000 },
  { key: "1h", label: "1 hour", ms: 60 * 60 * 1000 },
  { key: "24h", label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { key: "48h", label: "48 hours", ms: 48 * 60 * 60 * 1000 },
  { key: "7d", label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "14d", label: "14 days", ms: 14 * 24 * 60 * 60 * 1000 },
  { key: "30d", label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
  { key: "all", label: "All time", ms: null },
];
const BASE_URL = "https://api.idle-mmo.com/v1";
const USER_AGENT = "Zenith-Companion/1.0 profile-import";
const MUSEUM_CATEGORIES = new Set([
  "SKINS",
  "BACKGROUNDS",
  "GUILD_ICONS",
  "PETS",
  "COLLECTIBLES",
  "BESTIARY",
]);

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runScheduledWork(env));
  },
};

export async function handleRequest(request, env, ctx = {}) {
  const url = new URL(request.url);
  const cors = buildCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "zenith-profile-import" }, 200, cors);
    }

    if (url.pathname === "/internal/scraper-status" && request.method === "POST") {
      return await handleScraperStatus(request, env, cors);
    }

    if (url.pathname === "/internal/process-next" && request.method === "POST") {
      if (!(await hasBearerSecret(request, env.SCRAPER_COORDINATOR_SECRET))) {
        return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
      }
      const result = await processNextImportJob(env);
      return json({ ok: true, result }, 200, cors);
    }

    if (url.pathname === "/admin/import-health" && request.method === "GET") {
      return await handleAdminImportHealth(request, env, cors, ctx);
    }

    if (url.pathname === "/admin/actions" && request.method === "POST") {
      return await handleAdminActions(request, env, cors, ctx);
    }

    if (url.pathname === "/usage/ping" && request.method === "POST") {
      return await handleUsagePing(request, env, cors);
    }

    if (url.pathname === "/usage/vitals" && request.method === "POST") {
      return await handleUsageVitals(request, env, cors);
    }

    if (url.pathname === "/error/report" && request.method === "POST") {
      return await handleErrorReport(request, env, cors);
    }

    if (url.pathname === "/profile-import/start" && request.method === "POST") {
      return await handleStartImport(request, env, cors, ctx);
    }

    const statusMatch = url.pathname.match(/^\/profile-import\/status\/([^/]+)$/);
    if (statusMatch && request.method === "GET") {
      return await handleImportStatus(statusMatch[1], env, cors, request, ctx);
    }

    return json({ error: { code: "not_found", message: "Not found." } }, 404, cors);
  } catch (error) {
    return json({
      error: {
        code: "internal_error",
        message: "Profile imports are temporarily unavailable.",
      },
    }, 500, cors);
  }
}

const ADMIN_HEALTH_CACHE_TTL_MS = 60 * 1000;

function adminHealthCacheKey(url) {
  const origin = (url.origin && url.origin !== "null") ? url.origin : "https://zenith-profile-import.internal";
  return new Request(new URL("/admin/import-health", origin).toString(), {
    method: "GET",
  });
}

async function handleAdminImportHealth(request, env, cors, ctx = {}) {
  if (!(await hasBearerSecret(request, env.ADMIN_DASHBOARD_SECRET))) {
    return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
  }
  assertBindings(env);

  const url = new URL(request.url);
  const cacheControl = (request.headers.get("cache-control") || "").toLowerCase();
  const freshParam = url.searchParams.get("fresh");
  const isNoCache = cacheControl.includes("no-cache") ||
                    cacheControl.includes("max-age=0") ||
                    freshParam === "true" ||
                    freshParam === "1";
  const nowMs = Date.now();

  if (!isNoCache) {
    const memoryCached = env.__adminHealthCache;
    if (memoryCached && memoryCached.expiresAt > nowMs && memoryCached.payload && memoryCached.payload.ok) {
      return json(memoryCached.payload, 200, {
        ...cors,
        "x-admin-cache": "HIT",
      });
    }

    try {
      const defaultCache = typeof caches !== "undefined" && caches?.default;
      if (defaultCache) {
        const cacheKey = adminHealthCacheKey(url);
        const matched = await defaultCache.match(cacheKey);
        if (matched) {
          const payload = await matched.json();
          if (payload && payload.ok) {
            const generatedMs = new Date(payload.generatedAt).getTime();
            const expiresAt = Number.isFinite(generatedMs)
              ? generatedMs + ADMIN_HEALTH_CACHE_TTL_MS
              : nowMs + ADMIN_HEALTH_CACHE_TTL_MS;

            if (expiresAt > nowMs) {
              env.__adminHealthCache = { payload, expiresAt };
              return json(payload, 200, {
                ...cors,
                "x-admin-cache": "HIT",
              });
            }
          }
        }
      }
    } catch {
      // Ignore cache match errors and fallback to live generation
    }
  }

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const queue = await queueCounts(env);
  const cooldowns = await cooldownSummary(env, now);
  const demand = await importDemandSummary(env, now);
  const pressure = await queuePressure(env, now);
  const usage = await usageSummary(env, now);
  const webVitals = await webVitalsSummary(env, now);
  const appErrors = await appErrorSummary(env, now);
  const importAnalytics = await importAnalyticsSummary(env, now);
  const statusRows = await env.DB.prepare(`
    SELECT status, COUNT(*) AS count
    FROM import_events
    WHERE created_at >= ? AND status IS NOT NULL AND status != ''
    GROUP BY status
  `).bind(dayAgo).all().catch(() => ({ results: [] }));
  let summary = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN event_type IN ('queued', 'cooldown', 'queue_busy', 'turnstile_failed') THEN 1 ELSE 0 END) AS attempts,
      SUM(CASE WHEN event_type = 'complete' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN event_type = 'waiting_for_budget' THEN 1 ELSE 0 END) AS waiting_for_budget,
      SUM(CASE WHEN error_code = 'rate_limited' THEN 1 ELSE 0 END) AS rate_limited,
      AVG(CASE WHEN event_type = 'complete' THEN request_count ELSE NULL END) AS avg_request_count,
      AVG(CASE WHEN event_type = 'complete' THEN retry_count ELSE NULL END) AS avg_retry_count,
      AVG(CASE WHEN event_type = 'complete' THEN duration_seconds ELSE NULL END) AS avg_duration_seconds
    FROM import_events
    WHERE created_at >= ?
  `).bind(dayAgo).first().catch(() => null);

  const attemptsCount = Number(summary?.attempts || 0);
  const completedCount = Number(summary?.completed || 0);
  const failedCount = Number(summary?.failed || 0);
  let statusResults = statusRows.results || [];

  if (attemptsCount === 0 && completedCount === 0 && failedCount === 0) {
    const fallbackSummary = await env.DB.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN status = 'waiting_for_budget' THEN 1 ELSE 0 END) AS waiting_for_budget,
        SUM(CASE WHEN error_code = 'rate_limited' THEN 1 ELSE 0 END) AS rate_limited,
        AVG(CASE WHEN status = 'complete' THEN request_count ELSE NULL END) AS avg_request_count,
        AVG(CASE WHEN status = 'complete' THEN retry_count ELSE NULL END) AS avg_retry_count,
        AVG(CASE WHEN status = 'complete' THEN strftime('%s', updated_at) - strftime('%s', created_at) ELSE NULL END) AS avg_duration_seconds
      FROM import_jobs
      WHERE created_at >= ?
    `).bind(dayAgo).first().catch(() => null);
    if (fallbackSummary && Number(fallbackSummary.total || 0) > 0) {
      summary = fallbackSummary;
      const jobStatusRows = await env.DB.prepare(`
        SELECT status, COUNT(*) AS count
        FROM import_jobs
        WHERE created_at >= ?
        GROUP BY status
      `).bind(dayAgo).all().catch(() => ({ results: [] }));
      statusResults = jobStatusRows.results || [];
    }
  }

  const effectiveCompleted = Number(summary?.completed || 0);
  const effectiveFailed = Number(summary?.failed || 0);
  const totalAttempts = Math.max(
    Number(summary?.attempts || summary?.total || 0),
    effectiveCompleted + effectiveFailed,
  );
  const recentRows = await env.DB.prepare(`
    SELECT id, target_hash_fingerprint, status, error_code, error_message, request_count, retry_count, budget_mode, created_at, updated_at, expires_at
    FROM import_jobs
    ORDER BY created_at DESC
    LIMIT 10
  `).all().catch(() => ({ results: [] }));
  const coordinatorStates = await readCoordinatorStates(env);
  const budget = await importBudgetMode(env);

  const payload = {
    ok: true,
    generatedAt: now.toISOString(),
    service: {
      worker: "zenith-profile-import",
      budgetMode: budget.mode,
      rateLimitStore: "d1-minute-budgets",
      importRequestsPerMinute: budget.requestsPerMinute,
      pollAfterMs: budget.pollAfterMs,
      importDelayMs: importDelayMsForBudget(env, budget),
      jobTtlMinutes: Math.round(JOB_TTL_MS / 60000),
    },
    queue,
    cooldowns,
    last24h: {
      total: totalAttempts,
      attempts: totalAttempts,
      completed: effectiveCompleted,
      failed: effectiveFailed,
      waitingForBudget: Number(summary?.waiting_for_budget || 0),
      rateLimited: Number(summary?.rate_limited || 0),
      avgRequestCount: roundMetric(summary?.avg_request_count),
      avgRetryCount: roundMetric(summary?.avg_retry_count),
      avgDurationSeconds: roundMetric(summary?.avg_duration_seconds),
      completionRate: percentage(effectiveCompleted, totalAttempts),
      failureRate: percentage(effectiveFailed, totalAttempts),
      statuses: Object.fromEntries(statusResults.map((row) => [row.status, Number(row.count || 0)])),
    },
    demand: {
      ...demand,
      jobsLastHour: await countJobsSince(env, hourAgo),
    },
    pressure,
    usage,
    webVitals,
    appErrors,
    imports: importAnalytics,
    coordinator: coordinatorStates.map((state) => ({
      active: Boolean(state.active && !isExpiredIso(state.expiresAt)),
      status: cleanString(state.status, 24),
      source: cleanString(state.source, 80),
      runId: cleanString(state.runId, 80),
      startedAt: cleanIso(state.startedAt),
      finishedAt: cleanIso(state.finishedAt),
      lastSeenAt: cleanIso(state.lastSeenAt),
      expiresAt: cleanIso(state.expiresAt),
      stale: isExpiredIso(state.expiresAt),
    })),
    recentJobs: (recentRows.results || []).map((row) => ({
      id: row.id,
      targetHashFingerprint: row.target_hash_fingerprint || "",
      status: row.status,
      errorCode: row.error_code || "",
      errorMessage: row.error_message || "",
      requestCount: Number(row.request_count || 0),
      retryCount: Number(row.retry_count || 0),
      budgetMode: row.budget_mode || "unknown",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      expired: isExpiredIso(row.expires_at),
    })),
    minuteUsage: await currentMinuteUsage(env, now),
    databaseStats: await databaseTableStats(env),
  };

  env.__adminHealthCache = {
    payload,
    expiresAt: nowMs + ADMIN_HEALTH_CACHE_TTL_MS,
  };

  try {
    const defaultCache = typeof caches !== "undefined" && caches?.default;
    if (defaultCache) {
      const cacheKey = adminHealthCacheKey(url);
      const cacheResponse = new Response(JSON.stringify(payload), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=60",
        },
      });
      const putPromise = defaultCache.put(cacheKey, cacheResponse).catch(() => {});
      if (ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(putPromise);
      } else {
        await putPromise;
      }
    }
  } catch {
    // Ignore cache put errors
  }

  return json(payload, 200, {
    ...cors,
    "x-admin-cache": isNoCache ? "BYPASS" : "MISS",
  });
}

async function currentMinuteUsage(env, now) {
  const minuteKey = String(Math.floor(now.getTime() / 60000));
  const budget = await importBudgetMode(env);
  const fallback = {
    minuteKey,
    used: 0,
    usedRequests: 0,
    limit: budget.requestsPerMinute,
    budgetMode: budget.mode,
    sources: [],
  };
  if (!env?.DB?.prepare) return fallback;
  const rows = await env.DB.prepare(`
    SELECT source, used_requests, mode, updated_at
    FROM minute_budgets
    WHERE minute_key = ?
  `).bind(minuteKey).all().catch(() => ({ results: [] }));
  const results = rows.results || [];
  const totalUsed = results.reduce((sum, r) => sum + Number(r.used_requests || 0), 0);
  return {
    minuteKey,
    used: totalUsed,
    usedRequests: totalUsed,
    limit: budget.requestsPerMinute,
    budgetMode: budget.mode,
    sources: results.map((r) => ({
      source: r.source,
      usedRequests: Number(r.used_requests || 0),
      mode: r.mode || "unknown",
      updatedAt: r.updated_at,
    })),
  };
}

async function databaseTableStats(env) {
  const tables = [
    "usage_events",
    "usage_visitors",
    "import_events",
    "import_jobs",
    "cooldowns",
    "minute_budgets",
    "web_vital_events",
    "app_error_events",
  ];
  const stats = Object.fromEntries(tables.map((table) => [table, 0]));
  if (!env?.DB?.prepare) return stats;
  await Promise.all(
    tables.map(async (table) => {
      try {
        const row = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first();
        stats[table] = Number(row?.count ?? row?.["count(*)"] ?? row?.["COUNT(*)"] ?? 0);
      } catch {
        stats[table] = 0;
      }
    })
  );
  return stats;
}

async function handleAdminActions(request, env, cors, ctx = {}) {
  if (!(await hasBearerSecret(request, env.ADMIN_DASHBOARD_SECRET))) {
    return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
  }
  assertBindings(env);

  let payload;
  try {
    payload = await readJson(request);
  } catch {
    return json({ error: { code: "bad_request", message: "Invalid JSON body." } }, 400, cors);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ error: { code: "bad_request", message: "Request body must be an object." } }, 400, cors);
  }

  const action = cleanString(payload?.action, 40);

  if (action === "process_queue") {
    const result = await processNextImportJob(env);
    return json({ ok: true, message: "Queue processing triggered", result }, 200, cors);
  }

  if (action === "clear_coordinator") {
    const sources = payload?.source ? [cleanString(payload.source, 80)] : coordinatorSources(env);
    const now = new Date();
    for (const src of sources) {
      if (env.ZENITH_COORDINATOR) {
        if (typeof env.ZENITH_COORDINATOR.delete === "function") {
          await env.ZENITH_COORDINATOR.delete(coordinatorKey(src)).catch(() => {});
        }
        const idleRecord = {
          active: false,
          status: "idle",
          source: src,
          runId: "github-idle",
          startedAt: now.toISOString(),
          finishedAt: now.toISOString(),
          lastSeenAt: now.toISOString(),
          expiresAt: now.toISOString(),
        };
        if (typeof env.ZENITH_COORDINATOR.put === "function") {
          await env.ZENITH_COORDINATOR.put(coordinatorKey(src), JSON.stringify(idleRecord), {
            expirationTtl: 60,
          }).catch(() => {});
        }
      }
    }
    return json({ ok: true, message: "Coordinator state cleared", sources }, 200, cors);
  }

  if (action === "cancel_job") {
    const jobId = cleanString(payload?.jobId || payload?.job_id, 80);
    if (!jobId) {
      return json({ error: { code: "bad_request", message: "jobId is required." } }, 400, cors);
    }
    const now = new Date();
    const job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first().catch(() => null);
    if (!job) {
      return json({ error: { code: "not_found", message: `Job ${jobId} not found.` } }, 404, cors);
    }
    await env.DB.prepare(`
      UPDATE import_jobs
      SET status = 'failed', error_code = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).bind("cancelled_by_admin", "Job cancelled by administrator.", now.toISOString(), jobId).run();

    await recordImportEvent(env, {
      eventType: "failed",
      jobId,
      requesterFingerprint: job.requester_fingerprint,
      targetHashFingerprint: job.target_hash_fingerprint,
      status: "failed",
      errorCode: "cancelled_by_admin",
      budgetMode: job.budget_mode,
      requestCount: Number(job.request_count || 0),
      retryCount: Number(job.retry_count || 0),
      durationSeconds: secondsBetween(job.created_at, now),
      createdAt: now.toISOString(),
    });
    return json({ ok: true, message: `Job ${jobId} cancelled` }, 200, cors);
  }

  if (action === "clear_cooldown") {
    const scope = cleanString(payload?.scope, 32);
    const keyFingerprint = cleanString(payload?.keyFingerprint || payload?.key_fingerprint, 128);
    if (!scope || !keyFingerprint) {
      return json({ error: { code: "bad_request", message: "scope and keyFingerprint are required." } }, 400, cors);
    }
    await env.DB.prepare("DELETE FROM cooldowns WHERE scope = ? AND key_fingerprint = ?").bind(scope, keyFingerprint).run();
    return json({ ok: true, message: `Cooldown cleared for ${scope}:${keyFingerprint}` }, 200, cors);
  }

  return json({ error: { code: "bad_request", message: `Unknown admin action: ${action}` } }, 400, cors);
}

async function handleUsagePing(request, env, cors) {
  if (!(await hasBearerSecret(request, env.USAGE_PING_SECRET))) {
    return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
  }

  if (!isAllowedOrigin(request, env)) {
    return json({ error: { code: "origin_not_allowed", message: "Usage ping is not available from this origin." } }, 403, cors);
  }
  assertUsageBindings(env);

  const rateLimit = await checkUsagePingRateLimit(request, env, true);
  if (!rateLimit.ok) {
    return json(
      { error: { code: "rate_limited", message: "Usage ping rate limit reached." } },
      429,
      { ...cors, "retry-after": String(rateLimit.retryAfterSeconds) },
    );
  }

  const payload = await readJson(request);
  const visitorId = cleanString(payload.visitorId, 128);
  const sessionId = cleanString(payload.sessionId, 128);
  const path = normalizeUsagePath(payload.path);
  if (!visitorId || !sessionId || !path) {
    return json({ error: { code: "bad_request", message: "Invalid usage ping." } }, 400, cors);
  }

  const eventType = ["pageview", "heartbeat"].includes(payload.eventType) ? payload.eventType : "pageview";
  const now = new Date().toISOString();
  const visitorFingerprint = await fingerprint(visitorId, env.IMPORT_SIGNING_SECRET);
  const sessionFingerprint = await fingerprint(`${visitorId}:${sessionId}`, env.IMPORT_SIGNING_SECRET);

  let playerFingerprint = null;
  const characterDigest = cleanString(payload.characterDigest, 128);
  if (characterDigest) {
    playerFingerprint = await fingerprint(`char:${characterDigest}`, env.IMPORT_SIGNING_SECRET);
  }

  const effectiveVisitorFingerprint = playerFingerprint || visitorFingerprint;

  await env.DB.prepare(`
    INSERT INTO usage_events (
      id, visitor_fingerprint, session_fingerprint, event_type, path,
      referrer_host, device_type, timezone, country, user_agent_family, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    `use_${cryptoRandomId(24)}`,
    effectiveVisitorFingerprint,
    sessionFingerprint,
    eventType,
    path,
    normalizeReferrerHost(payload.referrer),
    normalizeDeviceType(payload.deviceType),
    cleanString(payload.timezone, 64),
    cleanString(request.headers.get("cf-ipcountry"), 8),
    userAgentFamilyFrom(request.headers.get("user-agent") || ""),
    now,
  ).run();

  await env.DB.prepare(`
    INSERT INTO usage_visitors (
      visitor_fingerprint, first_seen_at, last_seen_at, total_events, total_pageviews, device_type, country
    ) VALUES (?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT(visitor_fingerprint) DO UPDATE SET
      last_seen_at = excluded.last_seen_at,
      total_events = usage_visitors.total_events + 1,
      total_pageviews = usage_visitors.total_pageviews + excluded.total_pageviews,
      device_type = CASE
        WHEN excluded.device_type IS NOT NULL AND excluded.device_type != '' AND excluded.device_type != 'unknown'
        THEN excluded.device_type
        ELSE usage_visitors.device_type
      END,
      country = CASE
        WHEN excluded.country IS NOT NULL AND excluded.country != ''
        THEN excluded.country
        ELSE usage_visitors.country
      END
    WHERE datetime(usage_visitors.last_seen_at) < datetime(excluded.last_seen_at, '-15 minutes')
  `).bind(
    effectiveVisitorFingerprint,
    now,
    now,
    eventType === "pageview" ? 1 : 0,
    normalizeDeviceType(payload.deviceType),
    cleanString(request.headers.get("cf-ipcountry"), 8),
  ).run().catch(() => null);

  return json({ ok: true }, 202, cors);
}

async function handleUsageVitals(request, env, cors) {
  if (!(await hasBearerSecret(request, env.USAGE_PING_SECRET))) {
    return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
  }

  if (!isAllowedOrigin(request, env)) {
    return json({ error: { code: "origin_not_allowed", message: "Usage vitals are not available from this origin." } }, 403, cors);
  }
  assertUsageBindings(env);

  const rateLimit = await checkUsageVitalsRateLimit(request, env, true);
  if (!rateLimit.ok) {
    return json(
      { error: { code: "rate_limited", message: "Usage vitals rate limit reached." } },
      429,
      { ...cors, "retry-after": String(rateLimit.retryAfterSeconds) },
    );
  }

  const payload = await readJson(request);
  const isArray = Array.isArray(payload);
  const items = isArray ? payload : (isPlainObject(payload) ? [payload] : []);
  if (!items.length || items.length > 50) {
    return json({ error: { code: "bad_request", message: "Invalid usage vitals event." } }, 400, cors);
  }

  const userAgentFamily = userAgentFamilyFrom(request.headers.get("user-agent") || "");
  const now = new Date().toISOString();
  const statements = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const metricName = normalizeWebVitalMetricName(item.metricName || item.metric || item.name);
    const metricValue = normalizeWebVitalValue(item.value);
    const path = normalizeUsagePath(item.path);
    if (!metricName || metricValue === null || !path) {
      if (!isArray) {
        return json({ error: { code: "bad_request", message: "Invalid usage vitals event." } }, 400, cors);
      }
      continue;
    }

    statements.push(
      env.DB.prepare(`
        INSERT INTO web_vital_events (
          id, metric_name, metric_value, metric_rating, path,
          device_type, navigation_type, user_agent_family, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        `vit_${cryptoRandomId(24)}`,
        metricName,
        metricValue,
        normalizeWebVitalRating(item.rating),
        path,
        normalizeDeviceType(item.deviceType),
        normalizeNavigationType(item.navigationType),
        userAgentFamily,
        now,
      ),
    );
  }

  if (statements.length === 0) {
    return json({ error: { code: "bad_request", message: "Invalid usage vitals event." } }, 400, cors);
  }

  if (typeof env.DB.batch === "function") {
    await env.DB.batch(statements);
  } else {
    for (const stmt of statements) {
      await stmt.run();
    }
  }

  return json({ ok: true }, 202, cors);
}

async function handleErrorReport(request, env, cors) {
  const secret = errorReportSecret(env);
  if (!(await hasBearerSecret(request, secret))) {
    return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
  }

  if (!isAllowedOrigin(request, env)) {
    return json({ error: { code: "origin_not_allowed", message: "Error reporting is not available from this origin." } }, 403, cors);
  }
  assertUsageBindings(env);

  const rateLimit = await checkErrorReportRateLimit(request, env, true);
  if (!rateLimit.ok) {
    return json(
      { error: { code: "rate_limited", message: "Error report rate limit reached." } },
      429,
      { ...cors, "retry-after": String(rateLimit.retryAfterSeconds) },
    );
  }

  const payload = await readJson(request);
  const path = normalizeUsagePath(payload.path);
  if (!path) {
    return json({ error: { code: "bad_request", message: "Invalid error report." } }, 400, cors);
  }

  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO app_error_events (
      id, source, event_type, path, digest, app_version,
      browser_class, user_agent_family, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    `err_${cryptoRandomId(24)}`,
    normalizeErrorSource(payload.source),
    normalizeErrorEventType(payload.eventType),
    path,
    normalizeErrorDigest(payload.digest),
    cleanString(payload.appVersion, 64),
    normalizeBrowserClass(payload.browserClass),
    userAgentFamilyFrom(request.headers.get("user-agent") || ""),
    now,
  ).run();

  return json({ ok: true }, 202, cors);
}

async function importDemandSummary(env, now) {
  const fifteenAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const row = await env.DB.prepare(`
    SELECT
      COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS jobs_last_24h,
      COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS jobs_last_7d,
      COUNT(DISTINCT CASE WHEN created_at >= ? THEN requester_fingerprint ELSE NULL END) AS active_import_users_15m,
      COUNT(DISTINCT CASE WHEN created_at >= ? THEN requester_fingerprint ELSE NULL END) AS active_import_users_1h,
      COUNT(DISTINCT CASE WHEN created_at >= ? THEN requester_fingerprint ELSE NULL END) AS unique_import_users_24h,
      COUNT(DISTINCT CASE WHEN created_at >= ? THEN requester_fingerprint ELSE NULL END) AS unique_import_users_7d,
      COUNT(DISTINCT requester_fingerprint) AS unique_import_users_all_time,
      COUNT(DISTINCT CASE WHEN created_at >= ? THEN target_hash_fingerprint ELSE NULL END) AS unique_characters_24h,
      COUNT(DISTINCT CASE WHEN created_at >= ? THEN target_hash_fingerprint ELSE NULL END) AS unique_characters_7d,
      COUNT(DISTINCT target_hash_fingerprint) AS unique_characters_all_time
    FROM import_jobs
  `).bind(dayAgo, weekAgo, fifteenAgo, hourAgo, dayAgo, weekAgo, dayAgo, weekAgo).first().catch(() => null);

  const eventHistory = await env.DB.prepare(`
    SELECT
      COUNT(CASE WHEN created_at >= ? AND event_type = 'queued' THEN 1 ELSE NULL END) AS jobs_last_24h,
      COUNT(CASE WHEN created_at >= ? AND event_type = 'queued' THEN 1 ELSE NULL END) AS jobs_last_7d,
      COUNT(DISTINCT CASE WHEN created_at >= ? AND requester_fingerprint != '' THEN requester_fingerprint ELSE NULL END) AS unique_import_users_24h,
      COUNT(DISTINCT CASE WHEN created_at >= ? AND requester_fingerprint != '' THEN requester_fingerprint ELSE NULL END) AS unique_import_users_7d,
      COUNT(DISTINCT CASE WHEN requester_fingerprint != '' THEN requester_fingerprint ELSE NULL END) AS unique_import_users_all_time,
      COUNT(DISTINCT CASE WHEN created_at >= ? AND target_hash_fingerprint != '' THEN target_hash_fingerprint ELSE NULL END) AS unique_characters_24h,
      COUNT(DISTINCT CASE WHEN created_at >= ? AND target_hash_fingerprint != '' THEN target_hash_fingerprint ELSE NULL END) AS unique_characters_7d,
      COUNT(DISTINCT CASE WHEN target_hash_fingerprint != '' THEN target_hash_fingerprint ELSE NULL END) AS unique_characters_all_time
    FROM import_events
  `).bind(dayAgo, weekAgo, dayAgo, weekAgo, dayAgo, weekAgo).first().catch(() => null);

  const hasEvents = Number(eventHistory?.jobs_last_24h || 0) > 0 ||
                    Number(eventHistory?.jobs_last_7d || 0) > 0 ||
                    Number(eventHistory?.unique_characters_all_time || 0) > 0;

  return {
    jobsLast24h: hasEvents ? Number(eventHistory?.jobs_last_24h || 0) : Number(row?.jobs_last_24h || 0),
    jobsLast7d: hasEvents ? Number(eventHistory?.jobs_last_7d || 0) : Number(row?.jobs_last_7d || 0),
    activeImportUsers15m: Number(row?.active_import_users_15m || 0),
    activeImportUsers1h: Number(row?.active_import_users_1h || 0),
    uniqueImportUsers24h: hasEvents ? Number(eventHistory?.unique_import_users_24h || 0) : Number(row?.unique_import_users_24h || 0),
    uniqueImportUsers7d: hasEvents ? Number(eventHistory?.unique_import_users_7d || 0) : Number(row?.unique_import_users_7d || 0),
    uniqueImportUsersAllTime: hasEvents ? Number(eventHistory?.unique_import_users_all_time || 0) : Number(row?.unique_import_users_all_time || 0),
    uniqueCharacters24h: hasEvents ? Number(eventHistory?.unique_characters_24h || 0) : Number(row?.unique_characters_24h || 0),
    uniqueCharacters7d: hasEvents ? Number(eventHistory?.unique_characters_7d || 0) : Number(row?.unique_characters_7d || 0),
    uniqueCharactersAllTime: hasEvents ? Number(eventHistory?.unique_characters_all_time || 0) : Number(row?.unique_characters_all_time || 0),
  };
}

async function countUsageVisitors(env, since = null) {
  try {
    const stmt = since
      ? env.DB.prepare("SELECT COUNT(*) AS count FROM usage_visitors WHERE last_seen_at >= ?").bind(since)
      : env.DB.prepare("SELECT COUNT(*) AS count FROM usage_visitors");
    const result = await stmt.first();
    if (result) {
      const val = result.count ?? result["count(*)"] ?? result["COUNT(*)"] ?? Object.values(result)[0];
      if (val !== undefined && val !== null && !isNaN(Number(val))) {
        return Number(val);
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function usageSummary(env, now) {
  const fifteenAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    visitors15m,
    visitors1h,
    visitors24h,
    visitors7d,
    visitors30d,
    visitorsAllTime,
  ] = await Promise.all([
    countUsageVisitors(env, fifteenAgo),
    countUsageVisitors(env, hourAgo),
    countUsageVisitors(env, dayAgo),
    countUsageVisitors(env, weekAgo),
    countUsageVisitors(env, monthAgo),
    countUsageVisitors(env, null),
  ]);
  const hasVisitorsRegistry = typeof visitors15m === "number" && typeof visitorsAllTime === "number";

  const overview = hasVisitorsRegistry
    ? await env.DB.prepare(`
        SELECT
          COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS events_24h,
          COUNT(CASE WHEN event_type = 'pageview' AND created_at >= ? THEN 1 ELSE NULL END) AS pageviews_24h,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN session_fingerprint ELSE NULL END) AS sessions_24h,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN session_fingerprint ELSE NULL END) AS sessions_7d,
          COUNT(DISTINCT session_fingerprint) AS sessions_30d
        FROM usage_events
        WHERE created_at >= ?
      `).bind(dayAgo, dayAgo, dayAgo, weekAgo, monthAgo).first().catch(() => null)
    : await env.DB.prepare(`
        SELECT
          COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS events_24h,
          COUNT(CASE WHEN event_type = 'pageview' AND created_at >= ? THEN 1 ELSE NULL END) AS pageviews_24h,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN visitor_fingerprint ELSE NULL END) AS active_users_15m,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN visitor_fingerprint ELSE NULL END) AS active_users_1h,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN visitor_fingerprint ELSE NULL END) AS unique_users_24h,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN visitor_fingerprint ELSE NULL END) AS unique_users_7d,
          COUNT(DISTINCT visitor_fingerprint) AS unique_users_30d,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN session_fingerprint ELSE NULL END) AS sessions_24h,
          COUNT(DISTINCT CASE WHEN created_at >= ? THEN session_fingerprint ELSE NULL END) AS sessions_7d,
          COUNT(DISTINCT session_fingerprint) AS sessions_30d
        FROM usage_events
        WHERE created_at >= ?
      `).bind(dayAgo, dayAgo, fifteenAgo, hourAgo, dayAgo, weekAgo, dayAgo, weekAgo, monthAgo).first().catch(() => null);

  const topPages = await env.DB.prepare(`
    SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_fingerprint) AS users
    FROM usage_events
    WHERE event_type = 'pageview' AND created_at >= ?
    GROUP BY path
    ORDER BY views DESC
    LIMIT 12
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const deviceRows = await env.DB.prepare(`
    SELECT device_type, COUNT(DISTINCT visitor_fingerprint) AS users
    FROM usage_events
    WHERE created_at >= ?
    GROUP BY device_type
    ORDER BY users DESC
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const referrerRows = await env.DB.prepare(`
    SELECT referrer_host, COUNT(DISTINCT visitor_fingerprint) AS users
    FROM usage_events
    WHERE created_at >= ? AND referrer_host != ''
    GROUP BY referrer_host
    ORDER BY users DESC
    LIMIT 12
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const countryRows = await env.DB.prepare(`
    SELECT country, COUNT(DISTINCT visitor_fingerprint) AS users, COUNT(*) AS events
    FROM usage_events
    WHERE created_at >= ? AND country != ''
    GROUP BY country
    ORDER BY users DESC, events DESC
    LIMIT 16
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const browserRows = await env.DB.prepare(`
    SELECT user_agent_family, COUNT(DISTINCT visitor_fingerprint) AS users
    FROM usage_events
    WHERE created_at >= ?
    GROUP BY user_agent_family
    ORDER BY users DESC
    LIMIT 10
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const timezoneRows = await env.DB.prepare(`
    SELECT timezone, COUNT(DISTINCT visitor_fingerprint) AS users
    FROM usage_events
    WHERE created_at >= ? AND timezone != ''
    GROUP BY timezone
    ORDER BY users DESC
    LIMIT 12
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const dailyRows = await env.DB.prepare(`
    SELECT
      substr(created_at, 1, 10) AS day,
      COUNT(*) AS events,
      SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      COUNT(DISTINCT visitor_fingerprint) AS users,
      COUNT(DISTINCT session_fingerprint) AS sessions
    FROM usage_events
    WHERE created_at >= ?
    GROUP BY day
    ORDER BY day ASC
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const hourlyRows = await env.DB.prepare(`
    SELECT
      substr(created_at, 1, 13) || ':00:00Z' AS hour,
      COUNT(*) AS events,
      SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      COUNT(DISTINCT visitor_fingerprint) AS users,
      COUNT(DISTINCT session_fingerprint) AS sessions
    FROM usage_events
    WHERE created_at >= ?
    GROUP BY hour
    ORDER BY hour ASC
  `).bind(dayAgo).all().catch(() => ({ results: [] }));

  const knownVisitorCounts = hasVisitorsRegistry
    ? {
        "15m": visitors15m,
        "1h": visitors1h,
        "24h": visitors24h,
        "7d": visitors7d,
        "30d": visitors30d,
        "all": visitorsAllTime,
      }
    : null;

  const timeframes = await Promise.all(
    ADMIN_TIMEFRAMES.map((frame) => {
      const known = hasVisitorsRegistry ? (knownVisitorCounts?.[frame.key] ?? undefined) : null;
      return usageFrameSummary(env, now, frame, known);
    }),
  );

  const pageviews24h = Number(overview?.pageviews_24h || 0);
  const sessions24h = Number(overview?.sessions_24h || 0);
  return {
    activeUsers15m: hasVisitorsRegistry ? (visitors15m ?? 0) : Number(overview?.active_users_15m || 0),
    activeUsers1h: hasVisitorsRegistry ? (visitors1h ?? 0) : Number(overview?.active_users_1h || 0),
    uniqueUsers24h: hasVisitorsRegistry ? (visitors24h ?? 0) : Number(overview?.unique_users_24h || 0),
    uniqueUsers7d: hasVisitorsRegistry ? (visitors7d ?? 0) : Number(overview?.unique_users_7d || 0),
    uniqueUsers30d: hasVisitorsRegistry ? (visitors30d ?? 0) : Number(overview?.unique_users_30d || 0),
    uniqueUsersAllTime: hasVisitorsRegistry
      ? (visitorsAllTime ?? 0)
      : Number(overview?.unique_users_all_time || timeframes.find((frame) => frame.key === "all")?.users || overview?.unique_users_30d || 0),
    sessions24h,
    sessions7d: Number(overview?.sessions_7d || 0),
    sessions30d: Number(overview?.sessions_30d || 0),
    events24h: Number(overview?.events_24h || 0),
    pageviews24h,
    pageviewsPerSession24h: sessions24h ? roundMetric(pageviews24h / sessions24h) : 0,
    timeframes,
    daily: (dailyRows.results || []).map((row) => ({
      day: row.day,
      events: Number(row.events || 0),
      pageviews: Number(row.pageviews || 0),
      users: Number(row.users || 0),
      sessions: Number(row.sessions || 0),
    })),
    hourly: (hourlyRows.results || []).map((row) => ({
      hour: row.hour,
      events: Number(row.events || 0),
      pageviews: Number(row.pageviews || 0),
      users: Number(row.users || 0),
      sessions: Number(row.sessions || 0),
    })),
    topPages: (topPages.results || []).map((row) => ({
      path: cleanString(row.path, 120),
      views: Number(row.views || 0),
      users: Number(row.users || 0),
    })),
    devices: (deviceRows.results || []).map((row) => ({
      type: cleanString(row.device_type || "unknown", 24),
      users: Number(row.users || 0),
    })),
    referrers: (referrerRows.results || []).map((row) => ({
      host: cleanString(row.referrer_host, 120),
      users: Number(row.users || 0),
    })),
    countries: (countryRows.results || []).map((row) => ({
      country: cleanString(row.country || "unknown", 8),
      users: Number(row.users || 0),
      events: Number(row.events || 0),
    })),
    browsers: (browserRows.results || []).map((row) => ({
      family: cleanString(row.user_agent_family || "unknown", 32),
      users: Number(row.users || 0),
    })),
    timezones: (timezoneRows.results || []).map((row) => ({
      timezone: cleanString(row.timezone || "unknown", 64),
      users: Number(row.users || 0),
    })),
  };
}

async function usageFrameSummary(env, now, frame, knownVisitorCount = undefined) {
  const since = frame.ms === null ? null : new Date(now.getTime() - frame.ms).toISOString();
  const visitorCount = knownVisitorCount !== undefined ? knownVisitorCount : await countUsageVisitors(env, since);

  let result;
  if (visitorCount !== null) {
    const row = since
      ? env.DB.prepare(`
          SELECT
            COUNT(*) AS events,
            SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
            SUM(CASE WHEN event_type = 'heartbeat' THEN 1 ELSE 0 END) AS heartbeats,
            COUNT(DISTINCT session_fingerprint) AS sessions
          FROM usage_events
          WHERE created_at >= ?
        `).bind(since)
      : env.DB.prepare(`
          SELECT
            COUNT(*) AS events,
            SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
            SUM(CASE WHEN event_type = 'heartbeat' THEN 1 ELSE 0 END) AS heartbeats,
            COUNT(DISTINCT session_fingerprint) AS sessions
          FROM usage_events
        `);
    result = await row.first().catch(() => null);
  } else {
    const row = since
      ? env.DB.prepare(`
          SELECT
            COUNT(*) AS events,
            SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
            SUM(CASE WHEN event_type = 'heartbeat' THEN 1 ELSE 0 END) AS heartbeats,
            COUNT(DISTINCT visitor_fingerprint) AS users,
            COUNT(DISTINCT session_fingerprint) AS sessions
          FROM usage_events
          WHERE created_at >= ?
        `).bind(since)
      : env.DB.prepare(`
          SELECT
            COUNT(*) AS events,
            SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
            SUM(CASE WHEN event_type = 'heartbeat' THEN 1 ELSE 0 END) AS heartbeats,
            COUNT(DISTINCT visitor_fingerprint) AS users,
            COUNT(DISTINCT session_fingerprint) AS sessions
          FROM usage_events
        `);
    result = await row.first().catch(() => null);
  }

  const pageviews = Number(result?.pageviews || 0);
  const sessions = Number(result?.sessions || 0);
  return {
    key: frame.key,
    label: frame.label,
    events: Number(result?.events || 0),
    pageviews,
    heartbeats: Number(result?.heartbeats || 0),
    users: visitorCount !== null ? visitorCount : Number(result?.users || 0),
    sessions,
    pageviewsPerSession: sessions ? roundMetric(pageviews / sessions) : 0,
  };
}

async function webVitalsSummary(env, now) {
  const empty = {
    events24h: 0,
    events7d: 0,
    events30d: 0,
    poor24h: 0,
    poor30d: 0,
    poorRate30d: 0,
    metrics: [],
    topPaths: [],
    devices: [],
  };
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const overview = await env.DB.prepare(`
    SELECT
      COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS events_24h,
      COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS events_7d,
      COUNT(*) AS events_30d,
      SUM(CASE WHEN metric_rating = 'poor' AND created_at >= ? THEN 1 ELSE 0 END) AS poor_24h,
      SUM(CASE WHEN metric_rating = 'poor' THEN 1 ELSE 0 END) AS poor_30d
    FROM web_vital_events
    WHERE created_at >= ?
  `).bind(dayAgo, weekAgo, dayAgo, monthAgo).first().catch(() => null);

  if (!overview) return empty;

  const metricRows = await env.DB.prepare(`
    SELECT
      metric_name,
      COUNT(*) AS events,
      SUM(CASE WHEN metric_rating = 'poor' THEN 1 ELSE 0 END) AS poor,
      AVG(metric_value) AS avg_value,
      MAX(metric_value) AS max_value
    FROM web_vital_events
    WHERE created_at >= ?
    GROUP BY metric_name
    ORDER BY metric_name ASC
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const p75Rows = await env.DB.prepare(`
    SELECT metric_name, metric_value
    FROM web_vital_events
    WHERE created_at >= ?
    ORDER BY created_at DESC
    LIMIT 10000
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const p75ByMetric = new Map();
  for (const row of p75Rows.results || []) {
    const key = cleanString(row.metric_name, 12);
    const value = Number(row.metric_value);
    if (!key || !Number.isFinite(value)) continue;
    const values = p75ByMetric.get(key) || [];
    values.push(value);
    p75ByMetric.set(key, values);
  }

  const topPaths = await env.DB.prepare(`
    SELECT
      path,
      metric_name,
      COUNT(*) AS events,
      SUM(CASE WHEN metric_rating = 'poor' THEN 1 ELSE 0 END) AS poor
    FROM web_vital_events
    WHERE created_at >= ?
    GROUP BY path, metric_name
    ORDER BY poor DESC, events DESC
    LIMIT 10
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const deviceRows = await env.DB.prepare(`
    SELECT
      device_type,
      COUNT(*) AS events,
      SUM(CASE WHEN metric_rating = 'poor' THEN 1 ELSE 0 END) AS poor
    FROM web_vital_events
    WHERE created_at >= ?
    GROUP BY device_type
    ORDER BY poor DESC, events DESC
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const events30d = Number(overview.events_30d || 0);
  const poor30d = Number(overview.poor_30d || 0);
  return {
    events24h: Number(overview.events_24h || 0),
    events7d: Number(overview.events_7d || 0),
    events30d,
    poor24h: Number(overview.poor_24h || 0),
    poor30d,
    poorRate30d: percentage(poor30d, events30d),
    metrics: (metricRows.results || []).map((row) => {
      const name = cleanString(row.metric_name, 12);
      const events = Number(row.events || 0);
      const poor = Number(row.poor || 0);
      return {
        name,
        events,
        poor,
        poorRate: percentage(poor, events),
        avgValue: roundWebVitalMetric(row.avg_value),
        p75Value: percentile75(p75ByMetric.get(name) || []),
        maxValue: roundWebVitalMetric(row.max_value),
      };
    }),
    topPaths: (topPaths.results || []).map((row) => {
      const events = Number(row.events || 0);
      const poor = Number(row.poor || 0);
      return {
        path: cleanString(row.path, 120),
        metricName: cleanString(row.metric_name, 12),
        events,
        poor,
        poorRate: percentage(poor, events),
      };
    }),
    devices: (deviceRows.results || []).map((row) => {
      const events = Number(row.events || 0);
      const poor = Number(row.poor || 0);
      return {
        type: cleanString(row.device_type || "unknown", 24),
        events,
        poor,
        poorRate: percentage(poor, events),
      };
    }),
  };
}

async function appErrorSummary(env, now) {
  const empty = {
    events24h: 0,
    events7d: 0,
    events30d: 0,
    uniqueDigests24h: 0,
    topPaths: [],
    topDigests: [],
    browsers: [],
    recentEvents: [],
  };
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const overview = await env.DB.prepare(`
    SELECT
      COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS events_24h,
      COUNT(CASE WHEN created_at >= ? THEN 1 ELSE NULL END) AS events_7d,
      COUNT(*) AS events_30d,
      COUNT(DISTINCT CASE WHEN created_at >= ? AND digest != '' THEN digest ELSE NULL END) AS unique_digests_24h
    FROM app_error_events
    WHERE created_at >= ?
  `).bind(dayAgo, weekAgo, dayAgo, monthAgo).first().catch(() => null);

  if (!overview) return empty;

  const topPaths = await env.DB.prepare(`
    SELECT path, COUNT(*) AS events, COUNT(DISTINCT digest) AS digests
    FROM app_error_events
    WHERE created_at >= ?
    GROUP BY path
    ORDER BY events DESC
    LIMIT 10
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const topDigests = await env.DB.prepare(`
    SELECT digest, COUNT(*) AS events, COUNT(DISTINCT path) AS paths, MAX(created_at) AS last_seen_at
    FROM app_error_events
    WHERE created_at >= ? AND digest != ''
    GROUP BY digest
    ORDER BY events DESC
    LIMIT 10
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const browserRows = await env.DB.prepare(`
    SELECT browser_class, COUNT(*) AS events
    FROM app_error_events
    WHERE created_at >= ?
    GROUP BY browser_class
    ORDER BY events DESC
    LIMIT 8
  `).bind(monthAgo).all().catch(() => ({ results: [] }));

  const recentRows = await env.DB.prepare(`
    SELECT event_type, path, digest, app_version, browser_class, created_at
    FROM app_error_events
    ORDER BY created_at DESC
    LIMIT 10
  `).all().catch(() => ({ results: [] }));

  return {
    events24h: Number(overview.events_24h || 0),
    events7d: Number(overview.events_7d || 0),
    events30d: Number(overview.events_30d || 0),
    uniqueDigests24h: Number(overview.unique_digests_24h || 0),
    topPaths: (topPaths.results || []).map((row) => ({
      path: cleanString(row.path, 120),
      events: Number(row.events || 0),
      digests: Number(row.digests || 0),
    })),
    topDigests: (topDigests.results || []).map((row) => ({
      digest: cleanString(row.digest, 128),
      events: Number(row.events || 0),
      paths: Number(row.paths || 0),
      lastSeenAt: cleanIso(row.last_seen_at),
    })),
    browsers: (browserRows.results || []).map((row) => ({
      family: cleanString(row.browser_class || "unknown", 24),
      events: Number(row.events || 0),
    })),
    recentEvents: (recentRows.results || []).map((row) => ({
      eventType: cleanString(row.event_type || "unknown", 32),
      path: cleanString(row.path, 120),
      digest: cleanString(row.digest, 128),
      appVersion: cleanString(row.app_version, 64),
      browserClass: cleanString(row.browser_class || "unknown", 24),
      createdAt: cleanIso(row.created_at),
    })),
  };
}

async function importAnalyticsSummary(env, now) {
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeframes = await Promise.all(ADMIN_TIMEFRAMES.map((frame) => importFrameSummary(env, now, frame)));
  const dailyRows = await env.DB.prepare(`
    SELECT
      substr(created_at, 1, 10) AS day,
      COUNT(*) AS events,
      SUM(CASE WHEN event_type IN ('queued', 'cooldown', 'queue_busy', 'turnstile_failed') THEN 1 ELSE 0 END) AS attempts,
      SUM(CASE WHEN event_type = 'complete' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN event_type = 'waiting_for_budget' THEN 1 ELSE 0 END) AS waiting_for_budget,
      SUM(CASE WHEN error_code = 'rate_limited' THEN 1 ELSE 0 END) AS rate_limited,
      COUNT(DISTINCT requester_fingerprint) AS users,
      COUNT(DISTINCT target_hash_fingerprint) AS characters,
      AVG(CASE WHEN event_type = 'complete' THEN duration_seconds ELSE NULL END) AS avg_duration_seconds
    FROM import_events
    WHERE created_at >= ?
    GROUP BY day
    ORDER BY day ASC
  `).bind(monthAgo).all().catch(() => ({ results: [] }));
  const hourlyRows = await env.DB.prepare(`
    SELECT
      substr(created_at, 1, 13) || ':00:00Z' AS hour,
      COUNT(*) AS events,
      SUM(CASE WHEN event_type IN ('queued', 'cooldown', 'queue_busy', 'turnstile_failed') THEN 1 ELSE 0 END) AS attempts,
      SUM(CASE WHEN event_type = 'complete' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN event_type = 'waiting_for_budget' THEN 1 ELSE 0 END) AS waiting_for_budget,
      SUM(CASE WHEN error_code = 'rate_limited' THEN 1 ELSE 0 END) AS rate_limited,
      COUNT(DISTINCT requester_fingerprint) AS users
    FROM import_events
    WHERE created_at >= ?
    GROUP BY hour
    ORDER BY hour ASC
  `).bind(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()).all().catch(() => ({ results: [] }));
  const errorRows = await env.DB.prepare(`
    SELECT error_code, COUNT(*) AS count
    FROM import_events
    WHERE created_at >= ? AND error_code != ''
    GROUP BY error_code
    ORDER BY count DESC
    LIMIT 12
  `).bind(monthAgo).all().catch(() => ({ results: [] }));
  const budgetRows = await env.DB.prepare(`
    SELECT budget_mode, COUNT(*) AS events
    FROM import_events
    WHERE created_at >= ?
    GROUP BY budget_mode
    ORDER BY events DESC
  `).bind(monthAgo).all().catch(() => ({ results: [] }));
  const busiestTargets = await env.DB.prepare(`
    SELECT target_hash_fingerprint, COUNT(*) AS events, COUNT(DISTINCT requester_fingerprint) AS users
    FROM import_events
    WHERE created_at >= ? AND target_hash_fingerprint != ''
    GROUP BY target_hash_fingerprint
    ORDER BY events DESC
    LIMIT 8
  `).bind(monthAgo).all().catch(() => ({ results: [] }));
  const recentEvents = await env.DB.prepare(`
    SELECT event_type, status, error_code, budget_mode, request_count, retry_count, duration_seconds, created_at
    FROM import_events
    ORDER BY created_at DESC
    LIMIT 20
  `).all().catch(() => ({ results: [] }));

  return {
    timeframes,
    daily: (dailyRows.results || []).map((row) => ({
      day: row.day,
      events: Number(row.events || 0),
      attempts: Number(row.attempts || 0),
      completed: Number(row.completed || 0),
      failed: Number(row.failed || 0),
      waitingForBudget: Number(row.waiting_for_budget || 0),
      rateLimited: Number(row.rate_limited || 0),
      users: Number(row.users || 0),
      characters: Number(row.characters || 0),
      avgDurationSeconds: roundMetric(row.avg_duration_seconds),
    })),
    hourly: (hourlyRows.results || []).map((row) => ({
      hour: row.hour,
      events: Number(row.events || 0),
      attempts: Number(row.attempts || 0),
      completed: Number(row.completed || 0),
      failed: Number(row.failed || 0),
      waitingForBudget: Number(row.waiting_for_budget || 0),
      rateLimited: Number(row.rate_limited || 0),
      users: Number(row.users || 0),
    })),
    errors: (errorRows.results || []).map((row) => ({
      code: cleanString(row.error_code || "unknown", 64),
      count: Number(row.count || 0),
    })),
    budgets: (budgetRows.results || []).map((row) => ({
      mode: cleanString(row.budget_mode || "unknown", 32),
      events: Number(row.events || 0),
    })),
    busiestTargets: (busiestTargets.results || []).map((row) => ({
      fingerprintTail: cleanString(row.target_hash_fingerprint || "", 80).slice(-10),
      events: Number(row.events || 0),
      users: Number(row.users || 0),
    })),
    recentEvents: (recentEvents.results || []).map((row) => ({
      eventType: cleanString(row.event_type || "unknown", 32),
      status: cleanString(row.status || "", 32),
      errorCode: cleanString(row.error_code || "", 64),
      budgetMode: cleanString(row.budget_mode || "unknown", 32),
      requestCount: Number(row.request_count || 0),
      retryCount: Number(row.retry_count || 0),
      durationSeconds: roundMetric(row.duration_seconds),
      createdAt: cleanIso(row.created_at),
    })),
  };
}

async function importFrameSummary(env, now, frame) {
  const since = frame.ms === null ? null : new Date(now.getTime() - frame.ms).toISOString();
  const where = since ? "WHERE created_at >= ?" : "";
  const statement = env.DB.prepare(`
    SELECT
      COUNT(*) AS events,
      SUM(CASE WHEN event_type IN ('queued', 'cooldown', 'queue_busy', 'turnstile_failed') THEN 1 ELSE 0 END) AS attempts,
      SUM(CASE WHEN event_type = 'queued' THEN 1 ELSE 0 END) AS queued,
      SUM(CASE WHEN event_type = 'complete' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN event_type = 'expired' THEN 1 ELSE 0 END) AS expired,
      SUM(CASE WHEN event_type = 'waiting_for_budget' THEN 1 ELSE 0 END) AS waiting_for_budget,
      SUM(CASE WHEN event_type = 'queue_busy' THEN 1 ELSE 0 END) AS queue_busy,
      SUM(CASE WHEN event_type = 'cooldown' THEN 1 ELSE 0 END) AS cooldown,
      SUM(CASE WHEN event_type = 'turnstile_failed' THEN 1 ELSE 0 END) AS turnstile_failed,
      SUM(CASE WHEN error_code = 'rate_limited' THEN 1 ELSE 0 END) AS rate_limited,
      COUNT(DISTINCT requester_fingerprint) AS users,
      COUNT(DISTINCT target_hash_fingerprint) AS characters,
      AVG(CASE WHEN event_type = 'complete' THEN duration_seconds ELSE NULL END) AS avg_duration_seconds,
      MAX(CASE WHEN event_type = 'complete' THEN duration_seconds ELSE NULL END) AS max_duration_seconds,
      AVG(CASE WHEN event_type = 'complete' THEN request_count ELSE NULL END) AS avg_request_count,
      AVG(CASE WHEN event_type = 'complete' THEN retry_count ELSE NULL END) AS avg_retry_count
    FROM import_events
    ${where}
  `);
  const row = since ? await statement.bind(since).first().catch(() => null) : await statement.first().catch(() => null);
  const attempts = Number(row?.attempts || 0);
  const completed = Number(row?.completed || 0);
  const failed = Number(row?.failed || 0);
  return {
    key: frame.key,
    label: frame.label,
    events: Number(row?.events || 0),
    attempts,
    queued: Number(row?.queued || 0),
    completed,
    failed,
    expired: Number(row?.expired || 0),
    waitingForBudget: Number(row?.waiting_for_budget || 0),
    queueBusy: Number(row?.queue_busy || 0),
    cooldown: Number(row?.cooldown || 0),
    turnstileFailed: Number(row?.turnstile_failed || 0),
    rateLimited: Number(row?.rate_limited || 0),
    users: Number(row?.users || 0),
    characters: Number(row?.characters || 0),
    avgDurationSeconds: roundMetric(row?.avg_duration_seconds),
    maxDurationSeconds: roundMetric(row?.max_duration_seconds),
    avgRequestCount: roundMetric(row?.avg_request_count),
    avgRetryCount: roundMetric(row?.avg_retry_count),
    completionRate: percentage(completed, attempts),
    failureRate: percentage(failed, attempts),
  };
}

async function countJobsSince(env, createdAfter) {
  const row = await env.DB.prepare(`
    SELECT COUNT(*) AS count
    FROM import_jobs
    WHERE created_at >= ?
  `).bind(createdAfter).first();
  return Number(row?.count || 0);
}

async function queuePressure(env, now) {
  const row = await env.DB.prepare(`
    SELECT
      MIN(CASE WHEN status = 'queued' THEN created_at ELSE NULL END) AS oldest_queued_at,
      MIN(CASE WHEN status IN ('running', 'waiting_for_budget') THEN updated_at ELSE NULL END) AS oldest_running_at
    FROM import_jobs
    WHERE expires_at > ?
  `).bind(now.toISOString()).first();

  return {
    oldestQueuedSeconds: secondsSince(row?.oldest_queued_at, now),
    oldestRunningSeconds: secondsSince(row?.oldest_running_at, now),
  };
}

async function handleScraperStatus(request, env, cors) {
  if (!(await hasBearerSecret(request, env.SCRAPER_COORDINATOR_SECRET))) {
    return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
  }

  const payload = await readJson(request);
  const status = cleanString(payload.status, 24);
  const source = cleanString(payload.source, 80);
  const runId = cleanString(payload.runId, 80);
  const now = new Date();

  if (!["started", "finished", "failed"].includes(status) || !source || !runId) {
    return json({ error: { code: "bad_request", message: "Invalid scraper status payload." } }, 400, cors);
  }

  const previous = status === "started"
    ? null
    : safeParseJson(await env.ZENITH_COORDINATOR.get(coordinatorKey(source)));
  const startedAt = cleanIso(payload.startedAt) || cleanIso(previous?.startedAt) || now.toISOString();
  const finishedAt = status === "started"
    ? ""
    : cleanIso(payload.finishedAt) || now.toISOString();

  const record = {
    active: status === "started",
    status,
    source,
    runId,
    startedAt,
    ...(finishedAt ? { finishedAt } : {}),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + COORDINATOR_TTL_SECONDS * 1000).toISOString(),
  };

  await env.ZENITH_COORDINATOR.put(coordinatorKey(source), JSON.stringify(record), {
    expirationTtl: COORDINATOR_TTL_SECONDS,
  });

  return json({ ok: true, state: record.active ? "active" : "idle" }, 200, cors);
}

async function recordImportEvent(env, event) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(`
      INSERT INTO import_events (
        id, event_type, job_id, requester_fingerprint, target_hash_fingerprint,
        status, error_code, budget_mode, request_count, retry_count, duration_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `iev_${cryptoRandomId(24)}`,
      cleanString(event.eventType || "unknown", 32),
      cleanString(event.jobId || "", 80),
      cleanString(event.requesterFingerprint || "", 128),
      cleanString(event.targetHashFingerprint || "", 128),
      cleanString(event.status || "", 32),
      cleanString(event.errorCode || "", 64),
      cleanString(event.budgetMode || "unknown", 32),
      Math.max(0, Math.round(Number(event.requestCount || 0))),
      Math.max(0, Math.round(Number(event.retryCount || 0))),
      Number.isFinite(Number(event.durationSeconds)) ? Math.max(0, Number(event.durationSeconds)) : null,
      cleanIso(event.createdAt) || new Date().toISOString(),
    ).run();
  } catch {
    // Analytics must never block profile imports.
  }
}

async function handleStartImport(request, env, cors, ctx = {}) {
  if (!isAllowedOrigin(request, env)) {
    return json({ error: { code: "origin_not_allowed", message: "Profile imports are not available from this origin." } }, 403, cors);
  }

  assertBindings(env);
  assertImportSecrets(env);

  const payload = await readJson(request);
  const characterHash = cleanString(payload.characterHash, 100);
  if (!HASH_PATTERN.test(characterHash)) {
    return json({ error: { code: "invalid_hash", message: "Paste only the character hashed ID." } }, 400, cors);
  }

  const now = new Date();
  const isTrusted = await isTrustedProxyRequest(request, env);
  const requesterFingerprint = await fingerprint(requesterKey(request, isTrusted), env.IMPORT_SIGNING_SECRET);
  const hashFingerprint = await fingerprint(characterHash, env.IMPORT_SIGNING_SECRET);

  if (env.TURNSTILE_SECRET_KEY) {
    const turnstileResult = await verifyTurnstile(env, payload.turnstileToken, request);
    if (!turnstileResult.ok) {
      await recordImportEvent(env, {
        eventType: "turnstile_failed",
        requesterFingerprint,
        targetHashFingerprint: hashFingerprint,
        status: "blocked",
        errorCode: "turnstile_failed",
        createdAt: now.toISOString(),
      });
      return json({ error: { code: "turnstile_failed", message: "Quick check failed. Try again." } }, 403, cors);
    }
  }

  const expiresAt = new Date(now.getTime() + JOB_TTL_MS).toISOString();

  const existingJob = await env.DB.prepare(`
    SELECT id, status
    FROM import_jobs
    WHERE target_hash_fingerprint = ? AND status IN ('queued', 'running', 'waiting_for_budget') AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(hashFingerprint, now.toISOString()).first();

  if (existingJob) {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(processNextImportJob(env).catch(() => {}));
    }
    const budget = await importBudgetMode(env);
    return json({
      jobId: existingJob.id,
      status: existingJob.status,
      pollAfterMs: budget.pollAfterMs,
    }, 202, cors);
  }

  const cooldown = await activeCooldown(env, "hash", hashFingerprint, now)
    || await activeCooldown(env, "ip", requesterFingerprint, now)
    || await activeCooldown(env, "global", "global", now);
  if (cooldown) {
    await recordImportEvent(env, {
      eventType: "cooldown",
      requesterFingerprint,
      targetHashFingerprint: hashFingerprint,
      status: "blocked",
      errorCode: "cooldown",
      createdAt: now.toISOString(),
    });
    return json({
      error: {
        code: "cooldown",
        message: cooldown.reason || "You imported recently. Try again later.",
      },
      retryAfterMs: Math.max(10000, new Date(cooldown.until_at).getTime() - now.getTime()),
    }, 429, cors);
  }

  const maxPending = readPositiveInt(env.IMPORT_MAX_PENDING, 25);
  const maxConcurrent = readPositiveInt(env.IMPORT_MAX_CONCURRENT, 1);
  const queue = await queueCounts(env);
  if (queue.pending >= maxPending) {
    const budget = await importBudgetMode(env);
    const retryAfterMs = estimateQueueRetryAfterMs(queue, maxConcurrent, env, budget);
    await recordImportEvent(env, {
      eventType: "queue_busy",
      requesterFingerprint,
      targetHashFingerprint: hashFingerprint,
      status: "blocked",
      errorCode: "queue_busy",
      budgetMode: budget.mode,
      createdAt: now.toISOString(),
    });
    return json({
      error: {
        code: "queue_busy",
        message: `Imports are temporarily busy. This protects the shared API limit. Please try again in about ${formatRetryWait(retryAfterMs)}.`,
      },
      retryAfterMs,
      pollAfterMs: 10000,
    }, 429, cors);
  }

  const budget = await importBudgetMode(env);
  const encryptedHash = await encryptText(characterHash, env.IMPORT_ENCRYPTION_SECRET);
  const jobId = `imp_${cryptoRandomId(28)}`;
  const requestCap = readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP);
  const options = {
    baselineOnly: true,
    includeVisibleAlts: payload.includeVisibleAlts !== false,
    includeMuseum: payload.includeMuseum !== false,
    includeEffects: false,
    includeCurrentAction: false,
    requestCap,
    museumMaxPagesPerCharacter: readPositiveInt(env.IMPORT_MUSEUM_MAX_PAGES_PER_CHARACTER, DEFAULT_MUSEUM_MAX_PAGES_PER_CHARACTER),
  };

  await env.DB.prepare(`
    INSERT INTO import_jobs (
      id, status, target_hash_encrypted, target_hash_fingerprint, requester_fingerprint,
      requested_options_json, budget_mode, created_at, updated_at, expires_at
    ) VALUES (?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    jobId,
    encryptedHash,
    hashFingerprint,
    requesterFingerprint,
    JSON.stringify(options),
    budget.mode,
    now.toISOString(),
    now.toISOString(),
    expiresAt,
  ).run();

  await recordImportEvent(env, {
    eventType: "queued",
    jobId,
    requesterFingerprint,
    targetHashFingerprint: hashFingerprint,
    status: "queued",
    budgetMode: budget.mode,
    createdAt: now.toISOString(),
  });

  if (typeof ctx?.waitUntil === "function") {
    ctx.waitUntil(advanceJobStep(env, jobId).catch(() => {}));
  } else if (env.__syncAdvance) {
    await advanceJobStep(env, jobId).catch(() => {});
  }

  return json({
    jobId,
    status: "queued",
    budgetMode: budget.mode,
    pollAfterMs: budget.pollAfterMs,
    estimatedDurationMs: estimateImportDurationMs(requestCap, env, budget),
  }, 202, cors);
}

async function handleImportStatus(first, second, third, fourth, fifth) {
  let request = null;
  let jobId = "";
  let env = null;
  let cors = {};
  let ctx = null;

  if (typeof first === "string") {
    jobId = first;
    env = second;
    cors = third;
    request = fourth || null;
    ctx = fifth || null;
  } else {
    request = first;
    jobId = second;
    env = third;
    cors = fourth;
    ctx = fifth || null;
  }

  if (!JOB_ID_PATTERN.test(jobId)) {
    return json({ error: { code: "not_found", message: "Import job was not found." } }, 404, {
      ...cors,
      "cache-control": NOT_FOUND_STATUS_CACHE_CONTROL,
    });
  }
  assertBindings(env);

  const rateLimit = await checkImportStatusRateLimit(request, env);
  if (!rateLimit.ok) {
    return json(
      { error: { code: "rate_limited", message: "Too many status requests. Please slow down." } },
      429,
      {
        ...cors,
        "retry-after": String(rateLimit.retryAfterSeconds),
        "cache-control": "no-store",
      },
    );
  }

  const row = await env.DB.prepare(`
    SELECT id, status, result_json, request_count, retry_count, error_code, error_message,
           budget_mode, created_at, updated_at, expires_at,
           current_step, step_status, step_data_json, lease_expires_at, lease_token
    FROM import_jobs
    WHERE id = ?
  `).bind(jobId).first();

  if (!row) {
    return json({ error: { code: "not_found", message: "Import job was not found." } }, 404, {
      ...cors,
      "cache-control": NOT_FOUND_STATUS_CACHE_CONTROL,
    });
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return json({
      jobId,
      status: "expired",
      error: { code: "expired", message: "This import expired. Start a new import if needed." },
    }, 410, {
      ...cors,
      "cache-control": TERMINAL_STATUS_CACHE_CONTROL,
    });
  }

  if (row.status === "complete") {
    return json({
      jobId,
      status: "done",
      result: safeParseJson(row.result_json) || {
        characters: [],
        warnings: ["Import processing is not enabled in this scaffold yet."],
      },
      expiresAt: row.expires_at,
    }, 200, {
      ...cors,
      "cache-control": TERMINAL_STATUS_CACHE_CONTROL,
    });
  }

  if (row.status === "failed") {
    const cooldown = await activeCooldown(env, "global", "global", new Date());
    const retryAfterMs = cooldown
      ? Math.max(10000, new Date(cooldown.until_at).getTime() - Date.now())
      : null;
    return json({
      jobId,
      status: "error",
      error: {
        code: row.error_code || "import_failed",
        message: row.error_message || "Import failed.",
      },
      retryAfterMs,
      pollAfterMs: 10000,
    }, 200, {
      ...cors,
      "cache-control": TERMINAL_STATUS_CACHE_CONTROL,
    });
  }

  // Active or queued job: trigger background step execution if eligible
  const nowMs = Date.now();
  const isLeaseExpired = !row.lease_expires_at || new Date(row.lease_expires_at).getTime() <= nowMs;
  const isStepPending = row.step_status === "pending" || isLeaseExpired;
  const canAdvance = ["queued", "running", "waiting_for_budget"].includes(row.status) && isStepPending;

  if (canAdvance) {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(advanceJobStep(env, jobId).catch(() => {}));
    } else if (env.__syncAdvance) {
      await advanceJobStep(env, jobId).catch(() => {});
    }
  }

  const budget = await importBudgetMode(env);
  const currentStep = row.current_step || "root_baseline";
  const stepStatus = row.step_status || "pending";
  const stepMeta = STEP_METADATA[currentStep] || STEP_METADATA.root_baseline;
  const stepData = safeParseJson(row.step_data_json);

  let stepLabel = stepMeta.label;
  if (currentStep === "alt_characters" && stepData?.visibleAlts?.length) {
    const currentAlt = Math.min((stepData.currentAltIndex || 0) + 1, stepData.visibleAlts.length);
    stepLabel = `Importing Alt ${currentAlt}/${stepData.visibleAlts.length}`;
  } else if (currentStep === "account_museum" && stepData?.accountMuseum?.snapshot?.pagination?.currentPage) {
    const p = stepData.accountMuseum.snapshot.pagination;
    stepLabel = `Scanning museum (Page ${p.currentPage} of ${p.lastPage || 1})`;
  }

  const cooldown = await activeCooldown(env, "global", "global", new Date());
  const retryAfterMs = cooldown
    ? Math.max(10000, new Date(cooldown.until_at).getTime() - Date.now())
    : null;

  return json({
    jobId,
    status: row.status,
    currentStep,
    stepStatus,
    budgetMode: budget.mode,
    progress: {
      current: Number(row.request_count || 0),
      total: readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP),
      label: importProgressLabel(row.status, budget, currentStep, stepLabel),
      step: currentStep,
      stepIndex: stepMeta.index,
      stepTotal: stepMeta.total,
      stepLabel,
      estimatedRemainingMs: estimateImportDurationMs(
        Math.max(0, readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP) - Number(row.request_count || 0)),
        env,
        budget,
      ),
    },
    pollAfterMs: row.status === "waiting_for_budget" ? 10000 : budget.pollAfterMs,
    retryAfterMs,
    expiresAt: row.expires_at,
  }, 200, {
    ...cors,
    "cache-control": "no-store",
  });
}

function estimateImportDurationMs(requestCount, env, budget = null) {
  const delayMs = budget ? importDelayMsForBudget(env, budget) : readNonNegativeInt(env.IDLEMMO_IMPORT_DELAY_MS, 1800);
  return Math.max(15000, Math.ceil(Number(requestCount || 0) * delayMs + 12000));
}

function estimateQueueRetryAfterMs(queue, maxConcurrent, env, budget = null) {
  const requestCap = readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP);
  const averageImportMs = estimateImportDurationMs(requestCap, env, budget);
  const activeSlots = Math.max(1, Number(maxConcurrent || 1));
  const queueAhead = Math.max(1, Number(queue?.running || 0) + Number(queue?.pending || 0) - activeSlots + 1);
  return Math.min(30 * 60 * 1000, Math.max(60 * 1000, Math.ceil(queueAhead / activeSlots) * averageImportMs));
}

function formatRetryWait(ms) {
  const seconds = Math.ceil(Number(ms || 0) / 1000);
  if (seconds < 90) return `${Math.max(1, seconds)} seconds`;
  return `${Math.ceil(seconds / 60)} minutes`;
}

function importProgressLabel(status, budget = null, currentStep = null, stepLabel = null) {
  if (status === "waiting_for_budget") return "Waiting for the shared safe request budget";
  if (status === "running" && budget?.mode === "github-active") return "Importing slowly while the public scraper is running";
  if (stepLabel) return stepLabel;
  if (status === "running") return "Importing visible character sections";
  return "Waiting to start import";
}

export async function importBudgetMode(env) {
  const stateList = await readCoordinatorStates(env);
  if (stateList.some((state) => state.active && !isExpiredIso(state.expiresAt))) {
    return { mode: "github-active", requestsPerMinute: 6, pollAfterMs: 10000 };
  }
  return { mode: "github-idle", requestsPerMinute: 35, pollAfterMs: DEFAULT_POLL_MS };
}

function importDelayMsForBudget(env, budget) {
  const configuredDelayMs = readNonNegativeInt(env.IDLEMMO_IMPORT_DELAY_MS, 1800);
  if (configuredDelayMs === 0) return 0;
  return Math.max(configuredDelayMs, delayMsForRequestsPerMinute(budget?.requestsPerMinute || 12));
}

function delayMsForRequestsPerMinute(requestsPerMinute) {
  const parsed = Number(requestsPerMinute);
  if (!Number.isFinite(parsed) || parsed <= 0) return 5000;
  return Math.ceil(60000 / Math.min(parsed, 55));
}

async function runScheduledWork(env) {
  await cleanExpiredRows(env);
  await processNextImportJob(env);
}

export async function processNextImportJob(env, options = {}) {
  assertBindings(env);
  assertImportSecrets(env);

  const globalCooldown = await activeCooldown(env, "global", "global", new Date());
  if (globalCooldown) {
    return {
      status: "cooling_down",
      retryAfterMs: Math.max(10000, new Date(globalCooldown.until_at).getTime() - Date.now()),
    };
  }

  const staleThreshold = new Date(Date.now() - STALE_RUNNING_JOB_TIMEOUT_MS).toISOString();
  await env.DB.prepare(`
    UPDATE import_jobs
    SET status = 'failed', error_code = 'timeout', error_message = ?, updated_at = ?
    WHERE status = 'running' AND updated_at < ?
  `).bind(publicImportErrorMessage("timeout"), new Date().toISOString(), staleThreshold).run();

  const budget = await importBudgetMode(env);
  const nowIso = new Date().toISOString();

  const runningJob = await env.DB.prepare(`
    SELECT id
    FROM import_jobs
    WHERE status = 'running' AND expires_at > ?
    ORDER BY updated_at DESC
    LIMIT 1
  `).bind(nowIso).first();

  if (runningJob) {
    return {
      status: "busy",
      activeJobId: runningJob.id,
      pollAfterMs: budget.pollAfterMs,
    };
  }

  const job = await env.DB.prepare(`
    SELECT id, target_hash_encrypted, target_hash_fingerprint, requester_fingerprint,
           requested_options_json, request_count, retry_count, created_at, status, current_step, step_status
    FROM import_jobs
    WHERE status IN ('queued', 'waiting_for_budget') AND expires_at > ?
    ORDER BY created_at ASC
    LIMIT 1
  `).bind(nowIso).first();

  if (!job) return { status: "idle" };

  // For compatibility with claim collision tests:
  // If no claim has been made, attempt initial job claim
  if (job.status === "queued" || job.status === "waiting_for_budget") {
    const claimResult = await env.DB.prepare(`
      UPDATE import_jobs
      SET status = 'running', budget_mode = ?, updated_at = ?
      WHERE id = ? AND status IN ('queued', 'waiting_for_budget')
    `).bind(budget.mode, nowIso, job.id).run();

    const claimed = (claimResult?.meta?.changes ?? claimResult?.changes ?? 0) > 0;
    if (!claimed) {
      return {
        status: "busy",
        pollAfterMs: budget.pollAfterMs,
      };
    }
  }

  if (options.singleStep) {
    return await advanceJobStep(env, job.id, options);
  }

  let lastResult = null;
  const maxSteps = 15;
  for (let i = 0; i < maxSteps; i++) {
    lastResult = await advanceJobStep(env, job.id, options);
    if (!lastResult || lastResult.status === "complete" || lastResult.status === "failed" || lastResult.status === "waiting_for_budget" || lastResult.status === "cooling_down" || lastResult.busy) {
      break;
    }
  }
  return lastResult || { status: "idle" };
}

export async function advanceJobStep(env, jobId, options = {}) {
  assertBindings(env);
  assertImportSecrets(env);

  const budget = await importBudgetMode(env);
  const now = new Date();
  const nowIso = now.toISOString();

  const globalCooldown = await activeCooldown(env, "global", "global", now);
  if (globalCooldown) {
    return {
      status: "cooling_down",
      retryAfterMs: Math.max(10000, new Date(globalCooldown.until_at).getTime() - Date.now()),
    };
  }

  // Atomic step lease acquisition: ensures concurrency guard and recovers stale leases
  const leaseToken = cryptoRandomId(24);
  const leaseExpiresAt = new Date(now.getTime() + STEP_LEASE_MS).toISOString();

  const leaseResult = await env.DB.prepare(`
    UPDATE import_jobs
    SET step_status = 'running',
        lease_expires_at = ?,
        lease_token = ?,
        status = 'running',
        budget_mode = ?,
        updated_at = ?
    WHERE id = ?
      AND status IN ('queued', 'running', 'waiting_for_budget')
      AND (
        step_status = 'pending'
        OR lease_expires_at IS NULL
        OR lease_expires_at <= ?
      )
  `).bind(leaseExpiresAt, leaseToken, budget.mode, nowIso, jobId, nowIso).run();

  const claimed = (leaseResult?.meta?.changes ?? leaseResult?.changes ?? 0) > 0;
  if (!claimed) {
    return {
      status: "busy",
      busy: true,
      pollAfterMs: budget.pollAfterMs,
    };
  }

  const job = await env.DB.prepare(`
    SELECT id, status, current_step, step_status, step_data_json, target_hash_encrypted,
           target_hash_fingerprint, requester_fingerprint, requested_options_json,
           request_count, retry_count, lease_token, created_at, expires_at
    FROM import_jobs
    WHERE id = ?
  `).bind(jobId).first();

  if (!job || job.lease_token !== leaseToken) {
    return { status: "busy", busy: true, pollAfterMs: budget.pollAfterMs };
  }

  const step = job.current_step || IMPORT_STEPS.ROOT_BASELINE;
  const stepData = safeParseJson(job.step_data_json) || {};
  const requestedOptions = safeParseJson(job.requested_options_json) || {};

  try {
    if (step === IMPORT_STEPS.ROOT_BASELINE) {
      return await executeStepRootBaseline(job, stepData, requestedOptions, env, budget, leaseToken);
    }
    if (step === IMPORT_STEPS.ACCOUNT_MUSEUM) {
      return await executeStepAccountMuseum(job, stepData, requestedOptions, env, budget, leaseToken);
    }
    if (step === IMPORT_STEPS.ALT_CHARACTERS) {
      return await executeStepAltCharacters(job, stepData, requestedOptions, env, budget, leaseToken);
    }
    if (step === IMPORT_STEPS.FINAL_ASSEMBLY) {
      return await executeStepFinalAssembly(job, stepData, requestedOptions, env, budget, leaseToken);
    }
    throw new Error(`Unknown import step: ${step}`);
  } catch (error) {
    return await handleStepFailure(job, error, env, budget, leaseToken);
  }
}

async function executeStepRootBaseline(job, stepData, requestedOptions, env, budget, leaseToken) {
  const stepStart = Date.now();
  const characterHash = await decryptText(job.target_hash_encrypted, env.IMPORT_ENCRYPTION_SECRET);
  const importedAt = stepData.importedAt || new Date().toISOString();
  const requestCap = readPositiveInt(requestedOptions.requestCap, readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP));
  const includeVisibleAlts = requestedOptions.includeVisibleAlts !== false;
  const includeMuseum = requestedOptions.includeMuseum !== false;
  const tracker = { requestCount: Number(job.request_count || 0), retryCount: 0 };
  const delayMs = importDelayMsForBudget(env, budget);

  const root = await fetchCharacterBaseline(characterHash, "root", importedAt, env, tracker, {
    includeCharacters: includeVisibleAlts,
    includeMuseum: false, // Account museum is fetched once in account_museum step!
    requestCap,
    delayMs,
    jobId: job.id,
  });

  const visibleAlts = includeVisibleAlts ? extractVisibleAlts(root.charactersPayload) : [];
  const remainingRequests = Math.max(0, requestCap - tracker.requestCount);
  const minimumRequestsPerAlt = 3; // info, metrics, pets (museum is 0 calls for alts)
  const maxAltCount = Math.floor(remainingRequests / minimumRequestsPerAlt);
  const altsToFetch = visibleAlts.slice(0, maxAltCount);
  const warnings = [...(stepData.warnings || [])];
  if (visibleAlts.length > altsToFetch.length) {
    warnings.push(`${visibleAlts.length - altsToFetch.length} visible alt(s) skipped by the request cap.`);
  }

  const updatedStepData = {
    ...stepData,
    rootHash: characterHash,
    rootDraft: root.draft,
    charactersPayload: root.charactersPayload,
    visibleAlts: altsToFetch,
    completedAlts: [],
    currentAltIndex: 0,
    accountMuseum: null,
    stepDurationsMs: {
      ...(stepData.stepDurationsMs || {}),
      root_baseline: Date.now() - stepStart,
    },
    importedAt,
    requestCount: tracker.requestCount,
    warnings,
  };

  let nextStep = IMPORT_STEPS.FINAL_ASSEMBLY;
  if (includeMuseum) {
    nextStep = IMPORT_STEPS.ACCOUNT_MUSEUM;
  } else if (altsToFetch.length > 0) {
    nextStep = IMPORT_STEPS.ALT_CHARACTERS;
  }

  const nowIso = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE import_jobs
    SET current_step = ?,
        step_status = 'pending',
        step_data_json = ?,
        request_count = ?,
        lease_expires_at = NULL,
        lease_token = NULL,
        updated_at = ?
    WHERE id = ? AND lease_token = ?
  `).bind(
    nextStep,
    JSON.stringify(updatedStepData),
    tracker.requestCount,
    nowIso,
    job.id,
    leaseToken,
  ).run();

  return {
    status: "running",
    jobId: job.id,
    currentStep: nextStep,
    stepStatus: "pending",
    requestCount: tracker.requestCount,
  };
}

async function executeStepAccountMuseum(job, stepData, requestedOptions, env, budget, leaseToken) {
  const stepStart = Date.now();
  const characterHash = stepData.rootHash || await decryptText(job.target_hash_encrypted, env.IMPORT_ENCRYPTION_SECRET);
  const importedAt = stepData.importedAt || new Date().toISOString();
  const requestCap = readPositiveInt(requestedOptions.requestCap, readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP));
  const tracker = { requestCount: Number(job.request_count || 0), retryCount: 0 };
  const delayMs = importDelayMsForBudget(env, budget);

  const museumMaxPages = readPositiveInt(
    requestedOptions.museumMaxPagesPerCharacter,
    readPositiveInt(env.IMPORT_MUSEUM_MAX_PAGES_PER_CHARACTER, DEFAULT_MUSEUM_MAX_PAGES_PER_CHARACTER),
  );

  const museumResult = await fetchCharacterMuseum(characterHash, importedAt, env, tracker, {
    museumMaxPagesPerCharacter: museumMaxPages,
    requestCap,
    delayMs,
    jobId: job.id,
  }, "");

  const updatedStepData = {
    ...stepData,
    accountMuseum: museumResult,
    stepDurationsMs: {
      ...(stepData.stepDurationsMs || {}),
      account_museum: Date.now() - stepStart,
    },
    requestCount: tracker.requestCount,
  };

  let nextStep = IMPORT_STEPS.FINAL_ASSEMBLY;
  if (updatedStepData.visibleAlts && updatedStepData.visibleAlts.length > 0) {
    nextStep = IMPORT_STEPS.ALT_CHARACTERS;
  }

  const nowIso = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE import_jobs
    SET current_step = ?,
        step_status = 'pending',
        step_data_json = ?,
        request_count = ?,
        lease_expires_at = NULL,
        lease_token = NULL,
        updated_at = ?
    WHERE id = ? AND lease_token = ?
  `).bind(
    nextStep,
    JSON.stringify(updatedStepData),
    tracker.requestCount,
    nowIso,
    job.id,
    leaseToken,
  ).run();

  return {
    status: "running",
    jobId: job.id,
    currentStep: nextStep,
    stepStatus: "pending",
    requestCount: tracker.requestCount,
  };
}

async function executeStepAltCharacters(job, stepData, requestedOptions, env, budget, leaseToken) {
  const stepStart = Date.now();
  const importedAt = stepData.importedAt || new Date().toISOString();
  const requestCap = readPositiveInt(requestedOptions.requestCap, readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP));
  const tracker = { requestCount: Number(job.request_count || 0), retryCount: 0 };
  const delayMs = importDelayMsForBudget(env, budget);

  const visibleAlts = stepData.visibleAlts || [];
  let currentIndex = Number(stepData.currentAltIndex || 0);
  const completedAlts = Array.isArray(stepData.completedAlts) ? [...stepData.completedAlts] : [];
  const warnings = [...(stepData.warnings || [])];

  // Process slice: in test/0-delay mode process all; otherwise up to 2 alts (<=11s)
  const sliceSize = delayMs === 0 ? visibleAlts.length : Math.max(1, Math.min(2, Math.floor(12000 / (3 * Math.max(1, delayMs)))));
  const endIndex = Math.min(visibleAlts.length, currentIndex + sliceSize);

  while (currentIndex < endIndex) {
    const alt = visibleAlts[currentIndex];
    currentIndex += 1;
    const altHash = cleanString(alt?.hashed_id || alt?.hash || alt?.hashedId, 100);
    if (!HASH_PATTERN.test(altHash) || altHash === stepData.rootHash) continue;

    // Fetch alt baseline with includeMuseum: false (0 redundant museum queries!)
    const imported = await fetchCharacterBaseline(altHash, "visible_alt", importedAt, env, tracker, {
      includeCharacters: false,
      includeMuseum: false,
      requestCap,
      delayMs,
      jobId: job.id,
    });
    completedAlts.push({ role: "visible_alt", draft: imported.draft });
  }

  const isAllAltsDone = currentIndex >= visibleAlts.length;
  const nextStep = isAllAltsDone ? IMPORT_STEPS.FINAL_ASSEMBLY : IMPORT_STEPS.ALT_CHARACTERS;

  const updatedStepData = {
    ...stepData,
    completedAlts,
    currentAltIndex: currentIndex,
    warnings,
    stepDurationsMs: {
      ...(stepData.stepDurationsMs || {}),
      alt_characters: (stepData.stepDurationsMs?.alt_characters || 0) + (Date.now() - stepStart),
    },
    requestCount: tracker.requestCount,
  };

  const nowIso = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE import_jobs
    SET current_step = ?,
        step_status = 'pending',
        step_data_json = ?,
        request_count = ?,
        lease_expires_at = NULL,
        lease_token = NULL,
        updated_at = ?
    WHERE id = ? AND lease_token = ?
  `).bind(
    nextStep,
    JSON.stringify(updatedStepData),
    tracker.requestCount,
    nowIso,
    job.id,
    leaseToken,
  ).run();

  return {
    status: "running",
    jobId: job.id,
    currentStep: nextStep,
    stepStatus: "pending",
    requestCount: tracker.requestCount,
  };
}

async function executeStepFinalAssembly(job, stepData, requestedOptions, env, budget, leaseToken) {
  const stepStart = Date.now();
  const rootDraft = { ...stepData.rootDraft };
  const museumSnapshot = stepData.accountMuseum?.snapshot;
  const museumMissing = stepData.accountMuseum?.missingOrPrivate || [];

  // Attach account museum snapshot to root character
  if (museumSnapshot) {
    rootDraft.museum = museumSnapshot;
    const rootImportSource = { ...(rootDraft.importSource || {}) };
    const importedSections = Array.isArray(rootImportSource.importedSections)
      ? [...rootImportSource.importedSections]
      : [];
    if (!importedSections.includes("museum")) importedSections.push("museum");
    rootImportSource.importedSections = importedSections;
    if (museumMissing.length) {
      rootImportSource.missingOrPrivate = [
        ...(rootImportSource.missingOrPrivate || []),
        ...museumMissing,
      ];
    }
    rootDraft.importSource = rootImportSource;
  }

  const characters = [{ role: "root", draft: rootDraft }];

  // Attach the same account museum snapshot to all visible alts (0 redundant queries!)
  for (const alt of (stepData.completedAlts || [])) {
    const altDraft = { ...alt.draft };
    if (museumSnapshot) {
      altDraft.museum = museumSnapshot;
      const altImportSource = { ...(altDraft.importSource || {}) };
      const importedSections = Array.isArray(altImportSource.importedSections)
        ? [...altImportSource.importedSections]
        : [];
      if (!importedSections.includes("museum")) importedSections.push("museum");
      altImportSource.importedSections = importedSections;
      if (museumMissing.length) {
        altImportSource.missingOrPrivate = [
          ...(altImportSource.missingOrPrivate || []),
          ...museumMissing,
        ];
      }
      altDraft.importSource = altImportSource;
    }
    characters.push({ role: alt.role || "visible_alt", draft: altDraft });
  }

  const finalStepDurations = {
    ...(stepData.stepDurationsMs || {}),
    final_assembly: Date.now() - stepStart,
  };
  const totalDurationMs = Object.values(finalStepDurations).reduce((a, b) => a + Number(b || 0), 0);

  const publicResult = {
    rootHashTail: (stepData.rootHash || "").slice(-12),
    requestCount: Number(stepData.requestCount || job.request_count || 0),
    durationMs: totalDurationMs,
    characters,
    warnings: stepData.warnings || [],
  };

  const completedRetryCount = Number(job.retry_count || 0);
  const nowIso = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE import_jobs
    SET status = 'complete',
        step_status = 'complete',
        current_step = 'final_assembly',
        result_json = ?,
        request_count = ?,
        retry_count = ?,
        lease_expires_at = NULL,
        lease_token = NULL,
        error_code = NULL,
        error_message = NULL,
        updated_at = ?
    WHERE id = ? AND lease_token = ?
  `).bind(
    JSON.stringify(publicResult),
    publicResult.requestCount,
    completedRetryCount,
    nowIso,
    job.id,
    leaseToken,
  ).run();

  await recordImportEvent(env, {
    eventType: "complete",
    jobId: job.id,
    requesterFingerprint: job.requester_fingerprint,
    targetHashFingerprint: job.target_hash_fingerprint,
    status: "complete",
    budgetMode: budget.mode,
    requestCount: publicResult.requestCount,
    retryCount: completedRetryCount,
    durationSeconds: secondsBetween(job.created_at, new Date()),
  });

  return {
    status: "complete",
    jobId: job.id,
    requestCount: publicResult.requestCount,
    publicResult,
  };
}

async function handleStepFailure(job, error, env, budget, leaseToken) {
  const code = error?.code || "import_failed";
  const message = publicImportErrorMessage(code);
  const nowIso = new Date().toISOString();

  if (code === "rate_limited") {
    await setCooldown(env, "global", "global", 3 * 60 * 1000, "IdleMMO rate limit reached. Imports will continue shortly.");
    const currentRetries = Number(job.retry_count || 0);
    if (currentRetries >= MAX_IMPORT_RETRIES) {
      const failCode = "rate_limit_exhausted";
      const failMessage = publicImportErrorMessage(failCode);
      await env.DB.prepare(`
        UPDATE import_jobs
        SET status = 'failed',
            step_status = 'failed',
            lease_expires_at = NULL,
            lease_token = NULL,
            error_code = ?,
            error_message = ?,
            updated_at = ?
        WHERE id = ? AND lease_token = ?
      `).bind(failCode, failMessage, nowIso, job.id, leaseToken).run();

      await recordImportEvent(env, {
        eventType: "failed",
        jobId: job.id,
        requesterFingerprint: job.requester_fingerprint,
        targetHashFingerprint: job.target_hash_fingerprint,
        status: "failed",
        errorCode: failCode,
        budgetMode: budget.mode,
        requestCount: Number(job.request_count || 0),
        retryCount: currentRetries,
        durationSeconds: secondsBetween(job.created_at, new Date()),
      });
      return { status: "failed", jobId: job.id, code: failCode };
    }

    await env.DB.prepare(`
      UPDATE import_jobs
      SET status = 'waiting_for_budget',
          step_status = 'pending',
          lease_expires_at = NULL,
          lease_token = NULL,
          retry_count = retry_count + 1,
          error_code = ?,
          error_message = ?,
          updated_at = ?
      WHERE id = ? AND lease_token = ?
    `).bind(code, message, nowIso, job.id, leaseToken).run();

    await recordImportEvent(env, {
      eventType: "waiting_for_budget",
      jobId: job.id,
      requesterFingerprint: job.requester_fingerprint,
      targetHashFingerprint: job.target_hash_fingerprint,
      status: "waiting_for_budget",
      errorCode: code,
      budgetMode: budget.mode,
      requestCount: Number(job.request_count || 0),
      retryCount: currentRetries + 1,
      durationSeconds: secondsBetween(job.created_at, new Date()),
    });
    return { status: "waiting_for_budget", jobId: job.id, code };
  }

  await env.DB.prepare(`
    UPDATE import_jobs
    SET status = 'failed',
        step_status = 'failed',
        lease_expires_at = NULL,
        lease_token = NULL,
        error_code = ?,
        error_message = ?,
        updated_at = ?
    WHERE id = ? AND lease_token = ?
  `).bind(code, message, nowIso, job.id, leaseToken).run();

  await recordImportEvent(env, {
    eventType: "failed",
    jobId: job.id,
    requesterFingerprint: job.requester_fingerprint,
    targetHashFingerprint: job.target_hash_fingerprint,
    status: "failed",
    errorCode: code,
    budgetMode: budget.mode,
    requestCount: Number(job.request_count || 0),
    durationSeconds: secondsBetween(job.created_at, new Date()),
  });
  return { status: "failed", jobId: job.id, code };
}

async function importCharacterTree(rootHash, options, env, jobId, budget) {
  // Provided for backward-compatibility with direct callers if any
  return {
    requestCount: 0,
    retryCount: 0,
    publicResult: {
      rootHashTail: rootHash.slice(-12),
      requestCount: 0,
      durationMs: 0,
      characters: [],
      warnings: [],
    },
  };
}

async function fetchCharacterBaseline(hash, role, importedAt, env, tracker, options) {
  const sections = {};
  const missingOrPrivate = [];
  const prefix = role === "root" ? "" : `alt:${hash.slice(-12)}:`;

  sections.information = await fetchIdleMmoSection(hash, "information", env, tracker, options);
  if (!sections.information.ok) {
    throw Object.assign(new Error("Missing character information."), { code: sections.information.code || "information_unavailable" });
  }

  sections.metrics = await fetchIdleMmoSection(hash, "metrics", env, tracker, options);
  if (!sections.metrics.ok) missingOrPrivate.push(`${prefix}metrics`);

  sections.pets = await fetchIdleMmoSection(hash, "pets", env, tracker, options);
  if (!sections.pets.ok) missingOrPrivate.push(`${prefix}pets`);

  let charactersPayload = null;
  if (options.includeCharacters) {
    const characters = await fetchIdleMmoSection(hash, "characters", env, tracker, options);
    if (characters.ok) charactersPayload = characters.data;
    else missingOrPrivate.push("characters");
  }

  if (options.includeMuseum) {
    sections.museum = await fetchCharacterMuseum(hash, importedAt, env, tracker, options, prefix);
    missingOrPrivate.push(...sections.museum.missingOrPrivate);
  }

  const draft = normalizeIdleMmoProfileImport({
    hash,
    importedAt,
    information: sections.information.data,
    metrics: sections.metrics.ok ? sections.metrics.data : undefined,
    pets: sections.pets.ok ? sections.pets.data : undefined,
    museum: sections.museum?.snapshot,
  });
  draft.importSource = {
    ...draft.importSource,
    importedSections: [
      "information",
      ...(sections.metrics.ok ? ["metrics"] : []),
      ...(sections.pets.ok ? ["pets"] : []),
      ...(charactersPayload ? ["characters"] : []),
      ...(sections.museum?.snapshot ? ["museum"] : []),
    ],
    missingOrPrivate,
    notes: "Saved from visible IdleMMO character details.",
  };
  if (Array.isArray(draft.ownedPets)) {
    draft.ownedPets = draft.ownedPets.map((pet) => ({ ...pet, hashTail: hash.slice(-12) }));
  }
  return { draft, charactersPayload };
}

async function fetchCharacterMuseum(hash, importedAt, env, tracker, options, prefix) {
  const maxPages = readPositiveInt(options.museumMaxPagesPerCharacter, DEFAULT_MUSEUM_MAX_PAGES_PER_CHARACTER);
  const first = await fetchIdleMmoSection(hash, "museum", env, tracker, options, { page: 1 });

  if (!first.ok) {
    const status = first.code === "museum_private_or_missing" ? "private" : "unavailable";
    return {
      missingOrPrivate: [`${prefix}museum`],
      snapshot: {
        status,
        sourceHashTail: hash.slice(-12),
        importedAt,
        missingOrPrivate: [`${prefix}museum`],
        errorMessage: status === "private" ? "Museum is hidden or unavailable." : "Museum could not be fetched.",
        items: [],
      },
    };
  }

  const firstPage = parseMuseumEndpointPage(first.data);
  const items = [...firstPage.items];
  const fetchedPages = [firstPage.currentPage];
  const failedPages = [];
  let status = firstPage.items.length ? "imported" : "empty";
  let lastFetchedPage = firstPage.currentPage;

  for (let page = firstPage.currentPage + 1; page <= firstPage.lastPage && fetchedPages.length < maxPages; page += 1) {
    const next = await fetchIdleMmoSection(hash, "museum", env, tracker, options, { page });
    if (!next.ok) {
      failedPages.push(page);
      status = "partial";
      break;
    }
    const parsed = parseMuseumEndpointPage(next.data);
    items.push(...parsed.items);
    fetchedPages.push(parsed.currentPage);
    lastFetchedPage = parsed.currentPage;
  }

  if (lastFetchedPage < firstPage.lastPage) status = "partial";
  const missingOrPrivate = status === "partial" ? [`${prefix}museum.partial`] : [];

  return {
    missingOrPrivate,
    snapshot: {
      status,
      sourceHashTail: hash.slice(-12),
      importedAt,
      endpointUpdatedAt: cleanDate(first.data?.endpoint_updates_at),
      pageCount: fetchedPages.length,
      itemCount: items.length,
      pagination: {
        currentPage: lastFetchedPage,
        lastPage: firstPage.lastPage,
        perPage: firstPage.perPage,
        total: firstPage.total,
        fetchedPages,
        failedPages,
      },
      missingOrPrivate,
      errorMessage: status === "partial" ? "Museum import reached the safe request limit before every page was fetched." : undefined,
      items,
    },
  };
}

async function fetchIdleMmoSection(hash, section, env, tracker, options, query = undefined) {
  if (tracker.requestCount >= options.requestCap) {
    return { ok: false, code: "request_cap_reached" };
  }

  if (tracker.requestCount > 0 && options.delayMs > 0) {
    await sleep(options.delayMs);
  }

  tracker.requestCount += 1;
  await updateJobProgress(env, options.jobId, tracker.requestCount);

  const url = new URL(`${BASE_URL}/character/${encodeURIComponent(hash)}/${section}`);
  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${env.IDLEMMO_API_KEY}`,
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
    },
  });

  if (response.status === 429) {
    throw Object.assign(new Error("IdleMMO rate limit reached."), { code: "rate_limited" });
  }

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return { ok: false, code: `${section}_private_or_missing` };
  }

  if (!response.ok) {
    return { ok: false, code: `${section}_unavailable` };
  }

  return { ok: true, data: await response.json() };
}

async function updateJobProgress(env, jobId, requestCount) {
  await env.DB.prepare(`
    UPDATE import_jobs
    SET request_count = ?, updated_at = ?
    WHERE id = ?
  `).bind(requestCount, new Date().toISOString(), jobId).run();
}

async function markJob(jobId, env, patch) {
  await env.DB.prepare(`
    UPDATE import_jobs
    SET status = ?, budget_mode = ?, updated_at = ?
    WHERE id = ?
  `).bind(patch.status, patch.budgetMode || "unknown", new Date().toISOString(), jobId).run();
}

async function setCooldown(env, scope, key, durationMs, reason) {
  const now = new Date();
  await env.DB.prepare(`
    INSERT OR REPLACE INTO cooldowns (scope, key_fingerprint, until_at, reason, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(scope, key, new Date(now.getTime() + durationMs).toISOString(), reason, now.toISOString()).run();
}

async function readCoordinatorStates(env) {
  if (!env?.ZENITH_COORDINATOR?.get) return [];
  const states = [];
  for (const source of coordinatorSources(env)) {
    const raw = await env.ZENITH_COORDINATOR.get(coordinatorKey(source)).catch(() => null);
    const parsed = safeParseJson(raw);
    if (parsed) states.push(parsed);
  }
  return states;
}

function coordinatorSources(env) {
  const configured = String(env?.IMPORT_COORDINATOR_SOURCES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_COORDINATOR_SOURCES, ...configured]));
}

async function activeCooldown(env, scope, key, now) {
  const row = await env.DB.prepare(`
    SELECT until_at, reason
    FROM cooldowns
    WHERE scope = ? AND key_fingerprint = ? AND until_at > ?
  `).bind(scope, key, now.toISOString()).first();
  return row || null;
}

async function queueCounts(env) {
  const row = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status IN ('running', 'waiting_for_budget') THEN 1 ELSE 0 END) AS running
    FROM import_jobs
    WHERE expires_at > ?
  `).bind(new Date().toISOString()).first();
  return {
    pending: Number(row?.pending || 0),
    running: Number(row?.running || 0),
  };
}

async function cooldownSummary(env, now) {
  const rows = await env.DB.prepare(`
    SELECT scope, key_fingerprint, until_at, reason, created_at
    FROM cooldowns
    WHERE until_at > ?
    ORDER BY until_at ASC
  `).bind(now.toISOString()).all().catch(() => ({ results: [] }));
  const results = rows.results || [];
  const items = results.map((row) => {
    const untilMs = new Date(row.until_at).getTime();
    const remainingSeconds = Math.max(0, Math.round((untilMs - now.getTime()) / 1000));
    return {
      scope: row.scope,
      keyFingerprint: row.key_fingerprint,
      key_fingerprint: row.key_fingerprint,
      reason: row.reason,
      untilAt: row.until_at,
      until_at: row.until_at,
      remainingSeconds,
    };
  });
  return {
    active: items.length,
    activeCount: items.length,
    items,
  };
}

async function cleanExpiredRows(env) {
  if (!env.DB) return;
  const now = new Date().toISOString();
  const expiredRows = await env.DB.prepare(`
    SELECT id, status, target_hash_fingerprint, requester_fingerprint, budget_mode,
           request_count, retry_count, error_code, created_at
    FROM import_jobs
    WHERE expires_at <= ?
    LIMIT 100
  `).bind(now).all().catch(() => ({ results: [] }));
  for (const row of expiredRows.results || []) {
    await recordImportEvent(env, {
      eventType: "expired",
      jobId: row.id,
      requesterFingerprint: row.requester_fingerprint,
      targetHashFingerprint: row.target_hash_fingerprint,
      status: row.status || "expired",
      errorCode: row.error_code || "expired",
      budgetMode: row.budget_mode,
      requestCount: row.request_count,
      retryCount: row.retry_count,
      durationSeconds: secondsBetween(row.created_at, now),
      createdAt: now,
    });
  }
  await env.DB.prepare("DELETE FROM import_jobs WHERE expires_at <= ?").bind(now).run();
  await env.DB.prepare("DELETE FROM cooldowns WHERE until_at <= ?").bind(now).run();
  await env.DB.prepare("DELETE FROM minute_budgets WHERE updated_at <= ?")
    .bind(new Date(Date.now() - RATE_LIMIT_COUNTER_RETENTION_MS).toISOString())
    .run()
    .catch(() => null);
  cleanupTelemetryRateLimits(env?.__telemetryRateLimits || TELEMETRY_RATE_LIMITS);
}

function assertBindings(env) {
  const missing = [];
  if (!env.DB) missing.push("DB");
  if (!env.ZENITH_COORDINATOR) missing.push("ZENITH_COORDINATOR");
  if (!env.IMPORT_SIGNING_SECRET) missing.push("IMPORT_SIGNING_SECRET");
  if (!env.IMPORT_ENCRYPTION_SECRET) missing.push("IMPORT_ENCRYPTION_SECRET");
  if (missing.length) {
    throw new Error(`Missing Worker binding/secret: ${missing.join(", ")}`);
  }
}

function assertUsageBindings(env) {
  const missing = [];
  if (!env.DB) missing.push("DB");
  if (!env.IMPORT_SIGNING_SECRET) missing.push("IMPORT_SIGNING_SECRET");
  if (missing.length) {
    throw new Error(`Missing Worker binding/secret: ${missing.join(", ")}`);
  }
}

function assertImportSecrets(env) {
  if (!env.IDLEMMO_API_KEY) {
    throw new Error("Missing Worker secret: IDLEMMO_API_KEY");
  }
}

function buildCorsHeaders(request, env) {
  const headers = { ...JSON_HEADERS };
  const origin = request.headers.get("origin");
  if (origin && isAllowedOrigin(request, env)) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
    headers["access-control-allow-methods"] = "GET,POST,OPTIONS";
    headers["access-control-allow-headers"] = "content-type,authorization";
    headers["access-control-max-age"] = "86400";
  }
  return headers;
}

function isAllowedOrigin(request, env) {
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

export async function verifyTurnstile(env, token, request = null) {
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

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  return request.json();
}

function normalizeUsagePath(value) {
  const text = cleanString(value, 160);
  if (!text.startsWith("/")) return "";
  return text.split(/[?#]/)[0].slice(0, 120) || "/";
}

function normalizeReferrerHost(value) {
  const text = cleanString(value, 260);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return cleanString(parsed.hostname.replace(/^www\./, ""), 120);
  } catch {
    return "";
  }
}

function normalizeDeviceType(value) {
  const text = cleanString(value, 24).toLowerCase();
  return ["mobile", "tablet", "desktop"].includes(text) ? text : "unknown";
}

function normalizeWebVitalMetricName(value) {
  const text = cleanString(value, 12).toUpperCase();
  return ["CLS", "FCP", "INP", "LCP", "TTFB"].includes(text) ? text : "";
}

function normalizeWebVitalValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(Math.min(number, 120000) * 1000) / 1000;
}

function normalizeWebVitalRating(value) {
  const text = cleanString(value, 32).toLowerCase();
  return ["good", "needs-improvement", "poor"].includes(text) ? text : "unknown";
}

function normalizeNavigationType(value) {
  const text = cleanString(value, 32).toLowerCase();
  return ["navigate", "reload", "back-forward", "restore", "prerender"].includes(text) ? text : "unknown";
}

function normalizeErrorSource(value) {
  const text = cleanString(value, 24).toLowerCase();
  return ["client", "server"].includes(text) ? text : "client";
}

function normalizeErrorEventType(value) {
  const text = cleanString(value, 32).toLowerCase();
  return ["route_error", "app_shell_error", "server_request_error"].includes(text) ? text : "route_error";
}

function normalizeErrorDigest(value) {
  return cleanString(value, 128).replace(/[^A-Za-z0-9_./:-]/g, "");
}

function normalizeBrowserClass(value) {
  const text = cleanString(value, 24).toLowerCase();
  return ["chrome", "edge", "firefox", "safari", "bot", "other", "unknown"].includes(text) ? text : "unknown";
}

function userAgentFamilyFrom(userAgent) {
  const ua = String(userAgent || "").toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome/") || ua.includes("crios/")) return "chrome";
  if (ua.includes("firefox/") || ua.includes("fxios/")) return "firefox";
  if (ua.includes("safari/")) return "safari";
  return ua ? "other" : "unknown";
}

function json(payload, status = 200, headers = JSON_HEADERS) {
  return new Response(JSON.stringify(payload), { status, headers });
}

function cleanString(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanIso(value) {
  const text = cleanString(value, 80);
  return text && Number.isFinite(new Date(text).getTime()) ? text : "";
}

export function isExpiredIso(value) {
  const time = new Date(value).getTime();
  return !value || !Number.isFinite(time) || time <= Date.now();
}

function safeParseJson(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readPositiveInt(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : fallback;
}

function readNonNegativeInt(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? Math.floor(next) : fallback;
}

function roundMetric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 10) / 10 : 0;
}

function roundWebVitalMetric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 1000) / 1000 : 0;
}

function percentile75(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.75) - 1);
  return roundWebVitalMetric(sorted[Math.min(index, sorted.length - 1)]);
}

function percentage(part, total) {
  const denominator = Number(total);
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return roundMetric((Number(part || 0) / denominator) * 100);
}

function secondsSince(value, now) {
  if (!value) return 0;
  const started = new Date(value).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.round((now.getTime() - started) / 1000));
}

function secondsBetween(startValue, endValue) {
  if (!startValue) return 0;
  const started = new Date(startValue).getTime();
  const ended = endValue instanceof Date ? endValue.getTime() : new Date(endValue).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return 0;
  return Math.max(0, Math.round((ended - started) / 1000));
}

function coordinatorKey(source) {
  return `idlemmo-api-job:${source}`;
}

const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6_PATTERN = /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/;

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

const TELEMETRY_RATE_LIMITS = new Map();
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

function errorReportSecret(env) {
  const dedicated = typeof env?.ERROR_REPORT_SECRET === "string" ? env.ERROR_REPORT_SECRET.trim() : "";
  const fallback = typeof env?.USAGE_PING_SECRET === "string" ? env.USAGE_PING_SECRET.trim() : "";
  return dedicated || fallback;
}

export async function checkUsagePingRateLimit(request, env, isTrusted = undefined) {
  const maxPerMinute = readPositiveInt(env?.USAGE_PING_MAX_PER_MINUTE, DEFAULT_USAGE_PING_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`usage:${requester}`, env?.IMPORT_SIGNING_SECRET || "usage-secret");
  const store = env?.__telemetryRateLimits || TELEMETRY_RATE_LIMITS;
  return checkInMemoryRateLimit(`usage-ping:${requesterFingerprint.slice(0, 32)}`, maxPerMinute, store);
}

export async function checkUsageVitalsRateLimit(request, env, isTrusted = undefined) {
  const maxPerMinute = readPositiveInt(env?.USAGE_VITALS_MAX_PER_MINUTE, DEFAULT_USAGE_VITALS_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`vitals:${requester}`, env?.IMPORT_SIGNING_SECRET || "vitals-secret");
  const store = env?.__telemetryRateLimits || TELEMETRY_RATE_LIMITS;
  return checkInMemoryRateLimit(`usage-vitals:${requesterFingerprint.slice(0, 32)}`, maxPerMinute, store);
}

export async function checkErrorReportRateLimit(request, env, isTrusted = undefined) {
  const maxPerMinute = readPositiveInt(env?.ERROR_REPORT_MAX_PER_MINUTE, DEFAULT_ERROR_REPORT_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`error:${requester}`, env?.IMPORT_SIGNING_SECRET || "error-secret");
  const store = env?.__telemetryRateLimits || TELEMETRY_RATE_LIMITS;
  return checkInMemoryRateLimit(`error-report:${requesterFingerprint.slice(0, 32)}`, maxPerMinute, store);
}

export async function checkImportStatusRateLimit(request, env, isTrusted = undefined) {
  if (!request) return { ok: true };
  const maxPerMinute = readPositiveInt(env?.IMPORT_STATUS_MAX_PER_MINUTE, DEFAULT_IMPORT_STATUS_MAX_PER_MINUTE);
  const trusted = isTrusted !== undefined ? Boolean(isTrusted) : await isTrustedProxyRequest(request, env);
  const requester = requesterKey(request, trusted);
  const requesterFingerprint = await fingerprint(`status:${requester}`, env?.IMPORT_SIGNING_SECRET || "status-secret");
  return await checkD1MinuteRateLimit(env, `import-status:${requesterFingerprint.slice(0, 32)}`, maxPerMinute);
}

async function checkD1MinuteRateLimit(env, source, maxPerMinute) {
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
    `).bind(minuteKey, cleanString(source, 96), updatedAt, maxPerMinute).first();

    if (!row) {
      return { ok: false, retryAfterSeconds: Math.max(1, 60 - Math.floor((now % 60000) / 1000)) };
    }
  } catch {
    return { ok: true };
  }

  return { ok: true };
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

function rotr(n, b) {
  return (n >>> b) | (n << (32 - b));
}

function sha256Hex(ascii) {
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

async function fingerprint(value, secret) {
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

async function encryptText(value, secret) {
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

async function decryptText(value, secret) {
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

function cryptoRandomId(bytes) {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

function base64Url(value) {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publicImportErrorMessage(code) {
  if (code === "rate_limited") return "IdleMMO rate limit reached. Your import is paused and can be retried shortly.";
  if (code === "rate_limit_exhausted") return "Profile import rate limit retries exhausted. Try again later.";
  if (code === "timeout") return "Profile import timed out. Try again shortly.";
  if (code === "information_unavailable") return "This character could not be imported. Check that the hashed ID is correct and visible.";
  return "Profile import failed. Try again shortly.";
}

function extractVisibleAlts(payload) {
  const characters = isPlainObject(payload) && Array.isArray(payload.characters) ? payload.characters : [];
  return characters.filter(isPlainObject);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanNumber(value) {
  if (value === "") return "";
  const next = Number(value);
  return Number.isFinite(next) ? next : "";
}

function cleanUrl(value) {
  const next = cleanString(value, 500);
  return /^https?:\/\//i.test(next) ? next : "";
}

function cleanDate(value) {
  const next = cleanString(value, 80);
  return next && Number.isFinite(new Date(next).getTime()) ? next : undefined;
}

function normalizeMuseumCategory(value) {
  const normalized = cleanString(value, 80)
    .replace(/[-\s]+/g, "_")
    .toUpperCase();
  return MUSEUM_CATEGORIES.has(normalized) ? normalized : "";
}

function sanitizeMuseumItem(input) {
  if (!isPlainObject(input)) return null;
  const category = normalizeMuseumCategory(input.category || input.type || input.collection);
  const id = input.id ?? input.item_id ?? input.itemId ?? input.key;
  const name = cleanString(input.name || input.item_name || input.label, 120);
  const quantity = Math.max(0, Math.floor(Number(input.quantity ?? input.count ?? 1)));
  const imageUrl = cleanUrl(input.imageUrl || input.image_url || input.icon_url);
  if (!category || !name || (typeof id !== "string" && typeof id !== "number")) return null;
  return { category, id, name, quantity, imageUrl };
}

function parseMuseumEndpointPage(input) {
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
  RANGER: "Ranger",
  MINER: "Miner",
  ANGLER: "Angler",
  CHEF: "Chef",
  LUMBERJACK: "Lumberjack",
  SMELTER: "Smelter",
  BEASTMASTER: "Beastmaster",
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
  "hunting-mastery",
  "combat",
  "dungeoneering",
]);

function mapApiPetStats(input) {
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

function mapApiSkillMap(input) {
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

function normalizeApiClassName(value) {
  const raw = cleanString(value, 40);
  if (!raw) return "";
  const lookupKey = raw.replace(/[\s-]+/g, "_").toUpperCase();
  return API_CLASS_TO_PROFILE_CLASS[lookupKey] || raw;
}

function apiSkillLevel(skillMap, key) {
  const record = skillMap[key];
  if (!isPlainObject(record)) return "";
  const baseLevel = cleanNumber(record.level);
  if (typeof baseLevel !== "number") return baseLevel;
  const ascensionLevel = apiAscensionLevel(record, key);
  return baseLevel === 100 && ascensionLevel > 0
    ? baseLevel + ascensionLevel
    : baseLevel;
}

function apiAscensionLevel(record, skillKey) {
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

function mapApiMetrics(input, importedAt, endpointUpdatedAt) {
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

function mapApiOwnedPets(input, importedAt) {
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

function normalizeIdleMmoProfileImport(input) {
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
