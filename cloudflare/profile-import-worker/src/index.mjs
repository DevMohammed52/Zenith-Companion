const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const HASH_PATTERN = /^(?=.*[A-Z])(?=.*\d)[A-Za-z0-9_-]{12,80}$/;
const JOB_ID_PATTERN = /^imp_[A-Za-z0-9_-]{20,80}$/;
const COORDINATOR_TTL_SECONDS = 90 * 60;
const JOB_TTL_MS = 60 * 60 * 1000;
const DEFAULT_POLL_MS = 2000;
const DEFAULT_BASELINE_REQUEST_CAP = 45;
const DEFAULT_MUSEUM_MAX_PAGES_PER_CHARACTER = 8;
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

export async function handleRequest(request, env, _ctx = {}) {
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
      return handleScraperStatus(request, env, cors);
    }

    if (url.pathname === "/internal/process-next" && request.method === "POST") {
      if (!hasBearerSecret(request, env.SCRAPER_COORDINATOR_SECRET)) {
        return json({ error: { code: "unauthorized", message: "Unauthorized." } }, 401, cors);
      }
      const result = await processNextImportJob(env);
      return json({ ok: true, result }, 200, cors);
    }

    if (url.pathname === "/profile-import/start" && request.method === "POST") {
      return handleStartImport(request, env, cors);
    }

    const statusMatch = url.pathname.match(/^\/profile-import\/status\/([^/]+)$/);
    if (statusMatch && request.method === "GET") {
      return handleImportStatus(statusMatch[1], env, cors);
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

async function handleScraperStatus(request, env, cors) {
  if (!hasBearerSecret(request, env.SCRAPER_COORDINATOR_SECRET)) {
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

async function handleStartImport(request, env, cors) {
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

  if (env.TURNSTILE_SECRET_KEY) {
    const turnstileResult = await verifyTurnstile(env, payload.turnstileToken, request);
    if (!turnstileResult.ok) {
      return json({ error: { code: "turnstile_failed", message: "Quick check failed. Try again." } }, 403, cors);
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + JOB_TTL_MS).toISOString();
  const requesterFingerprint = await fingerprint(requesterKey(request), env.IMPORT_SIGNING_SECRET);
  const hashFingerprint = await fingerprint(characterHash, env.IMPORT_SIGNING_SECRET);

  const cooldown = await activeCooldown(env, "hash", hashFingerprint, now)
    || await activeCooldown(env, "ip", requesterFingerprint, now)
    || await activeCooldown(env, "global", "global", now);
  if (cooldown) {
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
  if (queue.pending >= maxPending || queue.running >= maxConcurrent) {
    return json({
      error: {
        code: "queue_busy",
        message: "Imports are temporarily busy. This protects the shared API limit.",
      },
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

  return json({
    jobId,
    status: "queued",
    budgetMode: budget.mode,
    pollAfterMs: budget.pollAfterMs,
    estimatedDurationMs: estimateImportDurationMs(requestCap, env, budget),
  }, 202, cors);
}

async function handleImportStatus(jobId, env, cors) {
  if (!JOB_ID_PATTERN.test(jobId)) {
    return json({ error: { code: "not_found", message: "Import job was not found." } }, 404, cors);
  }
  assertBindings(env);

  const row = await env.DB.prepare(`
    SELECT id, status, result_json, request_count, retry_count, error_code, error_message,
           budget_mode, created_at, updated_at, expires_at
    FROM import_jobs
    WHERE id = ?
  `).bind(jobId).first();

  if (!row) {
    return json({ error: { code: "not_found", message: "Import job was not found." } }, 404, cors);
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return json({
      jobId,
      status: "expired",
      error: { code: "expired", message: "This import expired. Start a new import if needed." },
    }, 410, cors);
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
    }, 200, cors);
  }

  if (row.status === "failed") {
    const cooldown = await activeCooldown(env, "global", "global", new Date());
    const retryAfterMs = cooldown
      ? Math.max(10000, new Date(cooldown.until_at).getTime() - Date.now())
      : undefined;
    return json({
      jobId,
      status: "error",
      error: {
        code: row.error_code || "import_failed",
        message: row.error_message || "Import failed.",
      },
      retryAfterMs,
      pollAfterMs: 10000,
    }, 200, cors);
  }

  const budget = await importBudgetMode(env);

  return json({
    jobId,
    status: row.status,
    budgetMode: budget.mode,
    progress: {
      current: Number(row.request_count || 0),
      total: readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP),
      label: importProgressLabel(row.status, budget),
      estimatedRemainingMs: estimateImportDurationMs(
        Math.max(0, readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP) - Number(row.request_count || 0)),
        env,
        budget,
      ),
    },
    pollAfterMs: budget.pollAfterMs,
    expiresAt: row.expires_at,
  }, 200, cors);
}

function estimateImportDurationMs(requestCount, env, budget = null) {
  const delayMs = budget ? importDelayMsForBudget(env, budget) : readNonNegativeInt(env.IDLEMMO_IMPORT_DELAY_MS, 1800);
  return Math.max(15000, Math.ceil(Number(requestCount || 0) * delayMs + 12000));
}

function importProgressLabel(status, budget = null) {
  if (status === "waiting_for_budget") return "Waiting for the shared safe request budget";
  if (status === "running" && budget?.mode === "github-active") return "Importing slowly while the public scraper is running";
  if (status === "running") return "Importing visible character sections";
  return "Waiting to start import";
}

async function importBudgetMode(env) {
  const stateList = await readCoordinatorStates(env);
  if (!stateList.length) return { mode: "unknown", requestsPerMinute: 12, pollAfterMs: 3000 };
  if (stateList.some((state) => state.active && !isExpiredIso(state.expiresAt))) {
    return { mode: "github-active", requestsPerMinute: 12, pollAfterMs: 5000 };
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

async function processNextImportJob(env) {
  assertBindings(env);
  assertImportSecrets(env);

  const budget = await importBudgetMode(env);
  const job = await env.DB.prepare(`
    SELECT id, target_hash_encrypted, requested_options_json, request_count
    FROM import_jobs
    WHERE status IN ('queued', 'waiting_for_budget') AND expires_at > ?
    ORDER BY created_at ASC
    LIMIT 1
  `).bind(new Date().toISOString()).first();

  if (!job) return { status: "idle" };

  await markJob(job.id, env, {
    status: "running",
    budgetMode: budget.mode,
  });

  try {
    const characterHash = await decryptText(job.target_hash_encrypted, env.IMPORT_ENCRYPTION_SECRET);
    const options = safeParseJson(job.requested_options_json) || {};
    const result = await importCharacterTree(characterHash, options, env, job.id, budget);
    await env.DB.prepare(`
      UPDATE import_jobs
      SET status = 'complete', result_json = ?, request_count = ?, retry_count = ?,
          error_code = NULL, error_message = NULL, updated_at = ?
      WHERE id = ?
    `).bind(
      JSON.stringify(result.publicResult),
      result.requestCount,
      result.retryCount,
      new Date().toISOString(),
      job.id,
    ).run();
    return { status: "complete", jobId: job.id, requestCount: result.requestCount };
  } catch (error) {
    const code = error?.code || "import_failed";
    const message = publicImportErrorMessage(code);
    if (code === "rate_limited") {
      await setCooldown(env, "global", "global", 3 * 60 * 1000, "IdleMMO rate limit reached. Imports will continue shortly.");
    }
    await env.DB.prepare(`
      UPDATE import_jobs
      SET status = 'failed', error_code = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).bind(code, message, new Date().toISOString(), job.id).run();
    return { status: "failed", jobId: job.id, code };
  }
}

async function importCharacterTree(rootHash, options, env, jobId, budget) {
  const importedAt = new Date().toISOString();
  const requestCap = readPositiveInt(options.requestCap, readPositiveInt(env.IMPORT_BASELINE_REQUEST_CAP, DEFAULT_BASELINE_REQUEST_CAP));
  const includeVisibleAlts = options.includeVisibleAlts !== false;
  const includeMuseum = options.includeMuseum !== false;
  const tracker = { requestCount: 0, retryCount: 0 };
  const warnings = [];
  const delayMs = importDelayMsForBudget(env, budget);

  const root = await fetchCharacterBaseline(rootHash, "root", importedAt, env, tracker, {
    includeCharacters: includeVisibleAlts,
    includeMuseum,
    museumMaxPagesPerCharacter: readPositiveInt(options.museumMaxPagesPerCharacter, readPositiveInt(env.IMPORT_MUSEUM_MAX_PAGES_PER_CHARACTER, DEFAULT_MUSEUM_MAX_PAGES_PER_CHARACTER)),
    requestCap,
    delayMs,
    jobId,
  });

  const visibleAlts = includeVisibleAlts ? extractVisibleAlts(root.charactersPayload) : [];
  const remainingRequests = Math.max(0, requestCap - tracker.requestCount);
  const minimumRequestsPerAlt = includeMuseum ? 4 : 3;
  const maxAltCount = Math.floor(remainingRequests / minimumRequestsPerAlt);
  const altsToFetch = visibleAlts.slice(0, maxAltCount);
  if (visibleAlts.length > altsToFetch.length) {
    warnings.push(`${visibleAlts.length - altsToFetch.length} visible alt(s) skipped by the request cap.`);
  }

  const characters = [{ role: "root", draft: root.draft }];
  for (const alt of altsToFetch) {
    const altHash = cleanString(alt.hashed_id || alt.hash || alt.hashedId, 100);
    if (!HASH_PATTERN.test(altHash) || altHash === rootHash) continue;
    const imported = await fetchCharacterBaseline(altHash, "visible_alt", importedAt, env, tracker, {
      includeCharacters: false,
      includeMuseum,
      museumMaxPagesPerCharacter: readPositiveInt(options.museumMaxPagesPerCharacter, readPositiveInt(env.IMPORT_MUSEUM_MAX_PAGES_PER_CHARACTER, DEFAULT_MUSEUM_MAX_PAGES_PER_CHARACTER)),
      requestCap,
      delayMs,
      jobId,
    });
    characters.push({ role: "visible_alt", draft: imported.draft });
  }

  return {
    requestCount: tracker.requestCount,
    retryCount: tracker.retryCount,
    publicResult: {
      rootHashTail: rootHash.slice(-12),
      requestCount: tracker.requestCount,
      durationMs: Math.max(0, Date.now() - new Date(importedAt).getTime()),
      characters,
      warnings,
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
  const keys = await env.ZENITH_COORDINATOR.list({ prefix: "idlemmo-api-job:" });
  const states = [];
  for (const key of keys.keys || []) {
    const raw = await env.ZENITH_COORDINATOR.get(key.name);
    const parsed = safeParseJson(raw);
    if (parsed) states.push(parsed);
  }
  return states;
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

async function cleanExpiredRows(env) {
  if (!env.DB) return;
  const now = new Date().toISOString();
  await env.DB.prepare("DELETE FROM import_jobs WHERE expires_at <= ?").bind(now).run();
  await env.DB.prepare("DELETE FROM cooldowns WHERE until_at <= ?").bind(now).run();
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
  if (!origin) return true;
  const allowed = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

function hasBearerSecret(request, secret) {
  const auth = request.headers.get("authorization") || "";
  return Boolean(secret) && auth === `Bearer ${secret}`;
}

async function verifyTurnstile(env, token, request) {
  if (!token || typeof token !== "string") return { ok: false };
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) body.set("remoteip", ip);

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

function isExpiredIso(value) {
  return !value || new Date(value).getTime() <= Date.now();
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

function coordinatorKey(source) {
  return `idlemmo-api-job:${source}`;
}

function requesterKey(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
    || "unknown-requester";
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
  const ascensionLevel = apiAscensionLevel(record);
  return baseLevel === 100 && ascensionLevel > 0
    ? baseLevel + ascensionLevel
    : baseLevel;
}

function apiAscensionLevel(record) {
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
  if (!isPlainObject(ascension)) return 0;
  const nested = [
    ascension.level,
    ascension.current_level,
    ascension.currentLevel,
    ascension.value,
  ].map(cleanNumber).find((value) => typeof value === "number" && value > 0);
  return typeof nested === "number" ? nested : 0;
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
