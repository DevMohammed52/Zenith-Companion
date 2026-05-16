import assert from "node:assert/strict";
import { handleRequest } from "../src/index.mjs";

class MemoryKV {
  constructor() {
    this.map = new Map();
  }
  async put(key, value) {
    this.map.set(key, value);
  }
  async get(key) {
    return this.map.get(key) || null;
  }
  async list({ prefix = "" } = {}) {
    return {
      keys: Array.from(this.map.keys())
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ name })),
    };
  }
}

class Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    return this;
  }
  async run() {
    return this.db.run(this.sql, this.args);
  }
  async first() {
    return this.db.first(this.sql, this.args);
  }
}

class MemoryD1 {
  constructor() {
    this.jobs = new Map();
    this.cooldowns = new Map();
  }
  prepare(sql) {
    return new Statement(this, sql);
  }
  async run(sql, args) {
    if (sql.includes("INSERT INTO import_jobs")) {
      const [id, encrypted, hashFingerprint, requesterFingerprint, options, budgetMode, createdAt, updatedAt, expiresAt] = args;
      this.jobs.set(id, {
        id,
        status: "queued",
        target_hash_encrypted: encrypted,
        target_hash_fingerprint: hashFingerprint,
        requester_fingerprint: requesterFingerprint,
        requested_options_json: options,
        budget_mode: budgetMode,
        created_at: createdAt,
        updated_at: updatedAt,
        expires_at: expiresAt,
        request_count: 0,
        retry_count: 0,
      });
    }
    if (sql.includes("DELETE FROM import_jobs")) {
      const [now] = args;
      for (const [id, job] of this.jobs) {
        if (job.expires_at <= now) this.jobs.delete(id);
      }
    }
    if (sql.includes("DELETE FROM cooldowns")) {
      const [now] = args;
      for (const [key, cooldown] of this.cooldowns) {
        if (cooldown.until_at <= now) this.cooldowns.delete(key);
      }
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = 'complete'")) {
      const [resultJson, requestCount, retryCount, updatedAt, id] = args;
      Object.assign(this.jobs.get(id), {
        status: "complete",
        result_json: resultJson,
        request_count: requestCount,
        retry_count: retryCount,
        error_code: null,
        error_message: null,
        updated_at: updatedAt,
      });
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = 'failed'")) {
      const [errorCode, errorMessage, updatedAt, id] = args;
      Object.assign(this.jobs.get(id), {
        status: "failed",
        error_code: errorCode,
        error_message: errorMessage,
        updated_at: updatedAt,
      });
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = 'waiting_for_budget'")) {
      const [errorCode, errorMessage, updatedAt, id] = args;
      const job = this.jobs.get(id);
      Object.assign(job, {
        status: "waiting_for_budget",
        retry_count: Number(job.retry_count || 0) + 1,
        error_code: errorCode,
        error_message: errorMessage,
        updated_at: updatedAt,
      });
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET request_count = ?")) {
      const [requestCount, updatedAt, id] = args;
      Object.assign(this.jobs.get(id), {
        request_count: requestCount,
        updated_at: updatedAt,
      });
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = ?")) {
      const [status, budgetMode, updatedAt, id] = args;
      Object.assign(this.jobs.get(id), {
        status,
        budget_mode: budgetMode,
        updated_at: updatedAt,
      });
    }
    if (sql.includes("INSERT OR REPLACE INTO cooldowns")) {
      const [scope, keyFingerprint, untilAt, reason, createdAt] = args;
      this.cooldowns.set(`${scope}:${keyFingerprint}`, {
        scope,
        key_fingerprint: keyFingerprint,
        until_at: untilAt,
        reason,
        created_at: createdAt,
      });
    }
    return { success: true };
  }
  async first(sql, args) {
    if (sql.includes("FROM cooldowns")) {
      const [scope, fingerprint, now] = args;
      const cooldown = this.cooldowns.get(`${scope}:${fingerprint}`);
      return cooldown && cooldown.until_at > now ? cooldown : null;
    }
    if (sql.includes("SUM(CASE WHEN status = 'queued'")) {
      const [now] = args;
      let pending = 0;
      let running = 0;
      for (const job of this.jobs.values()) {
        if (job.expires_at <= now) continue;
        if (job.status === "queued") pending += 1;
        if (job.status === "running" || job.status === "waiting_for_budget") running += 1;
      }
      return { pending, running };
    }
    if (sql.includes("SELECT id FROM import_jobs") && sql.includes("LIMIT 1")) {
      const [now] = args;
      return Array.from(this.jobs.values())
        .filter((job) => job.status === "queued" && job.expires_at > now)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0] || null;
    }
    if (sql.includes("SELECT id, target_hash_encrypted")) {
      const [now] = args;
      return Array.from(this.jobs.values())
        .filter((job) => ["queued", "waiting_for_budget"].includes(job.status) && job.expires_at > now)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0] || null;
    }
    if (sql.includes("FROM import_jobs") && sql.includes("WHERE id = ?")) {
      return this.jobs.get(args[0]) || null;
    }
    return null;
  }
}

function env(overrides = {}) {
  return {
    DB: new MemoryD1(),
    ZENITH_COORDINATOR: new MemoryKV(),
    ALLOWED_ORIGINS: "https://zenith.example,http://localhost:3000",
    IMPORT_MAX_PENDING: "25",
    IMPORT_MAX_CONCURRENT: "1",
    IMPORT_BASELINE_REQUEST_CAP: "45",
    IMPORT_MUSEUM_MAX_PAGES_PER_CHARACTER: "8",
    SCRAPER_COORDINATOR_SECRET: "coordinator-secret",
    IMPORT_SIGNING_SECRET: "signing-secret",
    IMPORT_ENCRYPTION_SECRET: "encryption-secret",
    IDLEMMO_API_KEY: "idlemmo-secret",
    IDLEMMO_IMPORT_DELAY_MS: "0",
    ...overrides,
  };
}

async function json(response) {
  return response.json();
}

{
  const response = await handleRequest(new Request("https://worker.test/health"), env());
  assert.equal(response.status, 200);
  assert.equal((await json(response)).ok, true);
}

{
  const e = env();
  const response = await handleRequest(new Request("https://worker.test/internal/scraper-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer coordinator-secret",
    },
    body: JSON.stringify({
      status: "started",
      source: "github-actions:update_data",
      runId: "123",
      startedAt: "2026-05-15T00:00:00.000Z",
    }),
  }), e);
  assert.equal(response.status, 200);
  assert.equal((await json(response)).state, "active");
  assert.equal(Boolean(await e.ZENITH_COORDINATOR.get("idlemmo-api-job:github-actions:update_data")), true);
}

{
  const e = env();
  await handleRequest(new Request("https://worker.test/internal/scraper-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer coordinator-secret",
    },
    body: JSON.stringify({
      status: "started",
      source: "github-actions:update_data",
      runId: "finish-test",
      startedAt: "2026-05-15T00:00:00.000Z",
    }),
  }), e);

  const response = await handleRequest(new Request("https://worker.test/internal/scraper-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer coordinator-secret",
    },
    body: JSON.stringify({
      status: "finished",
      source: "github-actions:update_data",
      runId: "finish-test",
      finishedAt: "2026-05-15T00:42:00.000Z",
    }),
  }), e);
  assert.equal(response.status, 200);
  assert.equal((await json(response)).state, "idle");

  const record = JSON.parse(await e.ZENITH_COORDINATOR.get("idlemmo-api-job:github-actions:update_data"));
  assert.equal(record.active, false);
  assert.equal(record.startedAt, "2026-05-15T00:00:00.000Z");
  assert.equal(record.finishedAt, "2026-05-15T00:42:00.000Z");
}

{
  const e = env();
  const response = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.7",
    },
    body: JSON.stringify({
      characterHash: "VM29l7kQZZ0JbQ80q6WD",
    }),
  }), e);
  const body = await json(response);
  assert.equal(response.status, 202);
  assert.match(body.jobId, /^imp_/);
  assert.equal(body.status, "queued");
  assert.equal(body.budgetMode, "unknown");

  const status = await handleRequest(new Request(`https://worker.test/profile-import/status/${body.jobId}`, {
    headers: { origin: "https://zenith.example" },
  }), e);
  assert.equal(status.status, 200);
  assert.equal((await json(status)).status, "queued");
}

{
  const response = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
    },
    body: JSON.stringify({ characterHash: "VM29l7kQZZ0JbQ80q6WD" }),
  }), env());
  assert.equal(response.status, 403);
}

{
  const e = env();
  const scraperStart = await handleRequest(new Request("https://worker.test/internal/scraper-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer coordinator-secret",
    },
    body: JSON.stringify({
      status: "started",
      source: "github-actions:update_data",
      runId: "active-import-test",
      startedAt: new Date().toISOString(),
    }),
  }), e);
  assert.equal(scraperStart.status, 200);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/information")) {
      return Response.json({
        character: {
          name: path.includes("altHash")
            ? "Alt Chef"
            : path.includes("dokidexhash")
              ? "DokiDex"
              : "Root Chef",
          class: "CHEF",
          total_level: 1840,
          current_status: "ONLINE",
          stats: {
            combat: { level: 100, ascension_level: path.includes("altHash") ? 2 : path.includes("dokidexhash") ? 1 : 8, experience: 1 },
            strength: { level: 90, experience: 1 },
          },
          skills: {
            cooking: { level: 95, experience: 10 },
          },
        },
      });
    }
    if (path.endsWith("/metrics")) {
      return Response.json({ metrics: { skilling: { cooked_items: 4 } } });
    }
    if (path.endsWith("/pets")) {
      return Response.json({ pets: [] });
    }
    if (path.endsWith("/characters")) {
      return Response.json({
        characters: [
          { hashed_id: "altHash123456", name: "Alt Chef" },
          { hashed_id: "dokidexhash", name: "DokiDex" },
        ],
      });
    }
    if (path.endsWith("/museum")) {
      const isAlt = path.includes("altHash");
      return Response.json({
        endpoint_updates_at: "2026-05-15T00:00:00.000Z",
        items: [{
          id: isAlt ? 202 : 101,
          category: isAlt ? "PETS" : "SKINS",
          name: isAlt ? "Alt Familiar" : "Root Apron",
          quantity: 1,
          image_url: "https://cdn.example/museum.png",
        }],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      });
    }
    return new Response("{}", { status: 404 });
  };
  try {
    const start = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.9",
      },
      body: JSON.stringify({ characterHash: "VM29l7kQZZ0JbQ80q6WD" }),
    }), e);
    const startBody = await json(start);
    assert.equal(startBody.budgetMode, "github-active");
    const { jobId } = startBody;

    const process = await handleRequest(new Request("https://worker.test/internal/process-next", {
      method: "POST",
      headers: { authorization: "Bearer coordinator-secret" },
    }), e);
    assert.equal(process.status, 200);
    assert.equal((await json(process)).result.status, "complete");

    const status = await handleRequest(new Request(`https://worker.test/profile-import/status/${jobId}`), e);
    const body = await json(status);
    assert.equal(body.status, "done");
    assert.equal(body.result.characters.length, 3);
    assert.equal(body.result.characters[0].draft.name, "Root Chef");
    assert.equal(body.result.characters[0].draft.levels.combat, 108);
    assert.equal(body.result.characters[0].draft.museum.items[0].name, "Root Apron");
    assert.equal(body.result.characters[1].draft.importSource.characterHashTail, "ltHash123456");
    assert.equal(body.result.characters[1].draft.levels.combat, 102);
    assert.equal(body.result.characters[1].draft.museum.items[0].name, "Alt Familiar");
    assert.equal(body.result.characters[1].draft.importSource.importedSections.includes("museum"), true);
    assert.equal(body.result.characters[2].draft.name, "DokiDex");
    assert.equal(body.result.characters[2].draft.importSource.characterHashTail, "dokidexhash");
    assert.equal(body.result.characters[2].draft.levels.combat, 101);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

{
  const e = env();
  const scraperStart = await handleRequest(new Request("https://worker.test/internal/scraper-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer coordinator-secret",
    },
    body: JSON.stringify({
      status: "started",
      source: "github-actions:update_data",
      runId: "rate-limit-test",
      startedAt: new Date().toISOString(),
    }),
  }), e);
  assert.equal(scraperStart.status, 200);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 429 });
  try {
    const start = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.11",
      },
      body: JSON.stringify({ characterHash: "VM29l7kQZZ0JbQ80q6WD" }),
    }), e);
    const startBody = await json(start);
    assert.equal(startBody.budgetMode, "github-active");

    const process = await handleRequest(new Request("https://worker.test/internal/process-next", {
      method: "POST",
      headers: { authorization: "Bearer coordinator-secret" },
    }), e);
    assert.equal(process.status, 200);
    assert.equal((await json(process)).result.status, "waiting_for_budget");

    const status = await handleRequest(new Request(`https://worker.test/profile-import/status/${startBody.jobId}`), e);
    const statusBody = await json(status);
    assert.equal(statusBody.status, "waiting_for_budget");
    assert.equal(statusBody.progress.current, 1);

    const cooldownProcess = await handleRequest(new Request("https://worker.test/internal/process-next", {
      method: "POST",
      headers: { authorization: "Bearer coordinator-secret" },
    }), e);
    assert.equal((await json(cooldownProcess)).result.status, "cooling_down");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

console.log("Profile import Worker scaffold tests passed.");
