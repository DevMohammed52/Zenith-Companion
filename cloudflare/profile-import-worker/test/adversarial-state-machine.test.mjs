import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  handleRequest,
  processNextImportJob,
  advanceJobStep,
  IMPORT_STEPS,
  STEP_LEASE_MS,
  STEP_METADATA,
} from "../src/index.mjs";

// ============================================================================
// Real SQLite D1 Adapter
// ============================================================================

class RealSqliteStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.boundArgs = [];
  }

  bind(...args) {
    this.boundArgs = args.map((arg) => (arg === undefined ? null : arg));
    return this;
  }

  async run() {
    try {
      const stmt = this.db.prepare(this.sql);
      const info = stmt.run(...this.boundArgs);
      const changes = Number(info.changes || 0);
      return {
        success: true,
        changes,
        meta: { changes, last_row_id: info.lastInsertRowid },
      };
    } catch (err) {
      console.error("RealSqliteStatement.run error on SQL:", this.sql, "Args:", this.boundArgs, err);
      throw err;
    }
  }

  async first() {
    try {
      const stmt = this.db.prepare(this.sql);
      const row = stmt.get(...this.boundArgs);
      return row || null;
    } catch (err) {
      console.error("RealSqliteStatement.first error on SQL:", this.sql, "Args:", this.boundArgs, err);
      throw err;
    }
  }

  async all() {
    try {
      const stmt = this.db.prepare(this.sql);
      const rows = stmt.all(...this.boundArgs);
      return { results: rows || [], success: true };
    } catch (err) {
      console.error("RealSqliteStatement.all error on SQL:", this.sql, "Args:", this.boundArgs, err);
      throw err;
    }
  }
}

class RealSqliteD1 {
  constructor() {
    this.sqlite = new DatabaseSync(":memory:");
    this.applyMigrations();
  }

  applyMigrations() {
    const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));
    const migrationFiles = fs.readdirSync(migrationsDir).sort();
    for (const file of migrationFiles) {
      if (file.endsWith(".sql")) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        this.sqlite.exec(sql);
      }
    }
  }

  prepare(sql) {
    return new RealSqliteStatement(this.sqlite, sql);
  }

  async batch(statements) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

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
  async delete(key) {
    this.map.delete(key);
  }
  async list({ prefix = "" } = {}) {
    return {
      keys: Array.from(this.map.keys())
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ name })),
    };
  }
}

function makeRealEnv(overrides = {}) {
  return {
    DB: new RealSqliteD1(),
    ZENITH_COORDINATOR: new MemoryKV(),
    ALLOWED_ORIGINS: "https://zenith.example,http://localhost:3000",
    IMPORT_MAX_PENDING: "25",
    IMPORT_MAX_CONCURRENT: "1",
    IMPORT_BASELINE_REQUEST_CAP: "45",
    IMPORT_MUSEUM_MAX_PAGES_PER_CHARACTER: "8",
    SCRAPER_COORDINATOR_SECRET: "coordinator-secret",
    ADMIN_DASHBOARD_SECRET: "admin-secret",
    USAGE_PING_SECRET: "usage-secret",
    USAGE_PING_MAX_PER_MINUTE: "120",
    USAGE_VITALS_MAX_PER_MINUTE: "80",
    ERROR_REPORT_SECRET: "error-secret",
    ERROR_REPORT_MAX_PER_MINUTE: "120",
    IMPORT_STATUS_MAX_PER_MINUTE: "120",
    IMPORT_SIGNING_SECRET: "signing-secret",
    IMPORT_ENCRYPTION_SECRET: "encryption-secret",
    IDLEMMO_API_KEY: "idlemmo-secret",
    IDLEMMO_IMPORT_DELAY_MS: "0",
    ...overrides,
  };
}

async function json(res) {
  return res.json();
}

console.log("=== STARTING ADVERSARIAL CHALLENGER TEST SUITE ===");

// ============================================================================
// CHALLENGE 1: Multi-Step Job Advancement in Real D1 Moving Through All 4 Steps
// ============================================================================
console.log("\n[CHALLENGE 1] Testing 4-Step Job Advancement & Multi-Alt Chunking on Real SQLite D1...");
{
  const env = makeRealEnv({ IDLEMMO_IMPORT_DELAY_MS: "100" }); // 100ms delay triggers sliceSize chunking
  const urls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url) => {
    const urlStr = String(url);
    urls.push(urlStr);
    const pathName = new URL(urlStr).pathname;

    if (pathName.endsWith("/information")) {
      const isAlt = pathName.includes("Alt");
      const name = isAlt ? pathName.split("/").slice(-2, -1)[0] : "Veteran Master";
      return Response.json({
        character: {
          name,
          class: "KNIGHT",
          total_level: 250,
          stats: { combat: { level: 99 } },
        },
      });
    }
    if (pathName.endsWith("/metrics")) return Response.json({ metrics: {} });
    if (pathName.endsWith("/pets")) return Response.json({ pets: [] });
    if (pathName.endsWith("/characters")) {
      return Response.json({
        characters: [
          { hashed_id: "AltOneHash111", name: "Alt One" },
          { hashed_id: "AltTwoHash222", name: "Alt Two" },
          { hashed_id: "AltThreeHash333", name: "Alt Three" },
          { hashed_id: "AltFourHash444", name: "Alt Four" },
          { hashed_id: "AltFiveHash555", name: "Alt Five" },
        ],
      });
    }
    if (pathName.endsWith("/museum")) {
      return Response.json({
        items: [
          { id: 101, name: "Veteran Trophy 1", category: "COLLECTIBLES" },
          { id: 102, name: "Veteran Trophy 2", category: "COLLECTIBLES" },
        ],
        pagination: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
      });
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    // 1a. Start import
    const startRes = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.1",
      },
      body: JSON.stringify({ characterHash: "VeteranRootHash000" }),
    }), env);
    assert.equal(startRes.status, 202);
    const { jobId } = await json(startRes);

    // Initial state check in Real SQLite
    let job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    assert.equal(job.status, "queued");
    assert.equal(job.current_step, "root_baseline");
    assert.equal(job.step_status, "pending");
    assert.equal(job.lease_token, null);

    // 1b. Advance Step 1: root_baseline
    const t0 = Date.now();
    const resStep1 = await advanceJobStep(env, jobId);
    const dur1 = Date.now() - t0;
    assert.ok(dur1 < 12000, `Step 1 must execute well under 12s, took ${dur1}ms`);
    assert.equal(resStep1.status, "running");
    assert.equal(resStep1.currentStep, "account_museum");
    assert.equal(resStep1.stepStatus, "pending");

    job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    assert.equal(job.current_step, "account_museum");
    assert.equal(job.step_status, "pending");
    assert.equal(job.lease_token, null); // Atomic lease released after step completion!
    const step1Data = JSON.parse(job.step_data_json);
    assert.equal(step1Data.rootDraft.name, "Veteran Master");
    assert.equal(step1Data.visibleAlts.length, 5);

    // 1c. Advance Step 2: account_museum
    const resStep2 = await advanceJobStep(env, jobId);
    assert.equal(resStep2.status, "running");
    assert.equal(resStep2.currentStep, "alt_characters");
    assert.equal(resStep2.stepStatus, "pending");

    job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    assert.equal(job.current_step, "alt_characters");
    assert.equal(job.step_status, "pending");
    const step2Data = JSON.parse(job.step_data_json);
    assert.equal(step2Data.accountMuseum.snapshot.items.length, 2);

    // 1d. Advance Step 3: alt_characters (5 alts with 100ms delay -> chunked slices!)
    let altStepCount = 0;
    while (true) {
      altStepCount++;
      const resAlt = await advanceJobStep(env, jobId);
      if (resAlt.currentStep === "final_assembly") {
        break;
      }
      assert.equal(resAlt.currentStep, "alt_characters");
      assert.ok(altStepCount <= 10, "Alt chunking must terminate");
    }
    assert.ok(altStepCount >= 2, `Multi-alt account must chunk into multiple discrete steps. Total slices: ${altStepCount}`);

    // Verify all 5 alts were collected
    job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    assert.equal(job.current_step, "final_assembly");
    assert.equal(job.step_status, "pending");
    const step3Data = JSON.parse(job.step_data_json);
    assert.equal(step3Data.completedAlts.length, 5);

    // 1e. Advance Step 4: final_assembly
    const resStep4 = await advanceJobStep(env, jobId);
    assert.equal(resStep4.status, "complete");
    assert.ok(resStep4.publicResult);
    assert.equal(resStep4.publicResult.characters.length, 6); // 1 root + 5 alts

    // Verify final state in real SQLite D1
    job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    assert.equal(job.status, "complete");
    assert.equal(job.step_status, "complete");
    assert.equal(job.current_step, "final_assembly");
    assert.equal(job.lease_token, null);
    assert.equal(job.lease_expires_at, null);

    const finalResult = JSON.parse(job.result_json);
    assert.equal(finalResult.characters[0].role, "root");
    assert.equal(finalResult.characters[0].draft.name, "Veteran Master");
    assert.equal(finalResult.characters[0].draft.museum.items.length, 2);

    for (let i = 1; i <= 5; i++) {
      assert.equal(finalResult.characters[i].role, "visible_alt");
      assert.equal(finalResult.characters[i].draft.museum.items.length, 2);
      assert.ok(finalResult.characters[i].draft.importSource.importedSections.includes("museum"));
    }
    console.log("  ✓ Multi-step job moved through all 4 steps and 5 alts chunked seamlessly on Real SQLite D1!");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ============================================================================
// CHALLENGE 2: Multi-Tab Concurrent Polling & Atomic Lease Guard
// ============================================================================
console.log("\n[CHALLENGE 2] Testing Multi-Tab Concurrent Polling & Atomic Lease Acquisition...");
{
  const env = makeRealEnv();
  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;

  globalThis.fetch = async () => {
    fetchCallCount++;
    // Introduce artificial network latency so all concurrent callers are pending simultaneously
    await new Promise((resolve) => setTimeout(resolve, 60));
    return Response.json({
      character: { name: "Atomic Hero", class: "PALADIN", total_level: 100, stats: { combat: { level: 50 } } },
    });
  };

  try {
    const startRes = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.55",
      },
      body: JSON.stringify({ characterHash: "AtomicHash999" }),
    }), env);
    assert.equal(startRes.status, 202);
    const { jobId } = await json(startRes);

    // Simulate 20 browser tabs polling and requesting advance simultaneously!
    const CONCURRENT_TABS = 20;
    const promises = [];
    for (let i = 0; i < CONCURRENT_TABS; i++) {
      promises.push(advanceJobStep(env, jobId));
    }

    const results = await Promise.all(promises);

    const acquired = results.filter((r) => r.status === "running");
    const busy = results.filter((r) => r.status === "busy" && r.busy === true);

    assert.equal(acquired.length, 1, `Exactly 1 tab must acquire atomic lease! Got: ${acquired.length}`);
    assert.equal(busy.length, CONCURRENT_TABS - 1, `All other ${CONCURRENT_TABS - 1} tabs must receive busy status! Got: ${busy.length}`);

    // Verify D1 state: lease was properly assigned to the single winner
    const jobAfterLease = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    // After step finishes, lease is released and step becomes account_museum
    assert.equal(jobAfterLease.current_step, "account_museum");
    assert.equal(jobAfterLease.step_status, "pending");

    // ZERO duplicate API requests were spawned
    // For root_baseline with includeVisibleAlts: exactly 4 fetches (info, metrics, pets, characters)
    assert.equal(fetchCallCount, 4, `Expected exactly 4 fetches for root baseline (info, metrics, pets, characters). Got: ${fetchCallCount}`);

    // Now test concurrent HTTP GET /profile-import/status/:jobId requests
    fetchCallCount = 0;
    const statusPromises = [];
    for (let i = 0; i < 15; i++) {
      statusPromises.push(
        handleRequest(new Request(`https://worker.test/profile-import/status/${jobId}`), env, {
          waitUntil: (p) => p,
        })
      );
    }
    const statusResponses = await Promise.all(statusPromises);
    for (const res of statusResponses) {
      assert.equal(res.status, 200);
      const body = await json(res);
      assert.equal(body.status, "running");
    }

    console.log("  ✓ Multi-tab concurrency confirmed: 20 simultaneous tabs -> exactly 1 lease acquired, 0 duplicate API calls!");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ============================================================================
// CHALLENGE 3: Crashed Isolate Resumption & Expired Lease Recovery
// ============================================================================
console.log("\n[CHALLENGE 3] Testing Crashed Isolate Resumption & Expired Lease Recovery...");
{
  const env = makeRealEnv();
  const crashJobId = "imp_crash_recovery_empirical_0001";
  const now = new Date();
  const expiredIso = new Date(now.getTime() - 10000).toISOString();
  const futureIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  // Insert a crashed job mid-way through step 2 ('account_museum')
  // Root baseline is already saved in checkpoint. Isolate died while holding lease.
  await env.DB.prepare(`
    INSERT INTO import_jobs (
      id, status, current_step, step_status, step_data_json,
      lease_expires_at, lease_token, target_hash_encrypted,
      target_hash_fingerprint, requester_fingerprint, requested_options_json,
      budget_mode, created_at, updated_at, expires_at, request_count, retry_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crashJobId,
    "running",
    "account_museum",
    "running", // Left in 'running' state by crashed worker
    JSON.stringify({
      rootHash: "SurvivorRootHash",
      rootDraft: { name: "Survivor Root", importSource: { importedSections: ["information"] } },
      visibleAlts: [{ hashed_id: "SurvivorAlt1", name: "Survivor Alt" }],
      completedAlts: [],
      currentAltIndex: 0,
      stepDurationsMs: { root_baseline: 3000 },
      importedAt: expiredIso,
      requestCount: 3,
    }),
    expiredIso, // Lease has expired!
    "zombie_token_crashed_worker",
    "enc_hash_survivor",
    "fp_survivor",
    "req_survivor",
    "{}",
    "unknown",
    expiredIso,
    expiredIso,
    futureIso,
    3,
    0
  ).run();

  const originalFetch = globalThis.fetch;
  let museumFetchCount = 0;
  let altFetchCount = 0;

  globalThis.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/museum")) {
      museumFetchCount++;
      return Response.json({
        items: [{ id: 888, name: "Phoenix Relic", category: "COLLECTIBLES" }],
        pagination: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
      });
    }
    altFetchCount++;
    return Response.json({
      character: { name: "Survivor Alt", class: "MAGE", total_level: 90, stats: { combat: { level: 45 } } },
    });
  };

  try {
    // 3a. Verify that an active (non-expired) lease BLOCKS other workers
    const activeLeaseIso = new Date(Date.now() + 20000).toISOString();
    await env.DB.prepare("UPDATE import_jobs SET lease_expires_at = ? WHERE id = ?").bind(activeLeaseIso, crashJobId).run();
    const blockedRes = await advanceJobStep(env, crashJobId);
    assert.equal(blockedRes.status, "busy", "Worker must NOT steal active unexpired lease!");

    // 3b. Expire the lease again (simulate time passage / crashed worker abandoned it)
    await env.DB.prepare("UPDATE import_jobs SET lease_expires_at = ? WHERE id = ?").bind(expiredIso, crashJobId).run();

    // 3c. Recovery worker attempts to advance job
    const recoverRes = await advanceJobStep(env, crashJobId);
    assert.equal(recoverRes.status, "running");
    assert.equal(recoverRes.currentStep, "alt_characters", "Must resume from account_museum and transition to alt_characters!");

    // Verify root_baseline was NOT restarted from scratch!
    const jobAfterRecover = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(crashJobId).first();
    const data = JSON.parse(jobAfterRecover.step_data_json);
    assert.equal(data.rootDraft.name, "Survivor Root", "Root draft checkpoint preserved!");
    assert.equal(data.accountMuseum.snapshot.items[0].name, "Phoenix Relic", "Museum step successfully executed!");
    assert.equal(museumFetchCount, 1, "Museum fetched exactly once on resume");

    // 3d. Stale Token Defense Test:
    // If the crashed worker suddenly resurrects and tries to commit using its old zombie token:
    const zombieUpdate = await env.DB.prepare(`
      UPDATE import_jobs
      SET current_step = 'root_baseline',
          step_status = 'pending',
          updated_at = ?
      WHERE id = ? AND lease_token = ?
    `).bind(new Date().toISOString(), crashJobId, "zombie_token_crashed_worker").run();

    assert.equal(zombieUpdate.changes, 0, "Zombie worker commit with stale lease token MUST be rejected with 0 changes!");

    console.log("  ✓ Crashed isolate recovery confirmed: safely resumes from checkpoint without restarting from step 1, stale token writes rejected!");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ============================================================================
// CHALLENGE 4: Alt Character Import with 0 Redundant Museum Queries
// ============================================================================
console.log("\n[CHALLENGE 4] Testing Alt Character Import Zero-Redundant Museum Queries...");
{
  const env = makeRealEnv();
  const urls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url) => {
    const urlStr = String(url);
    urls.push(urlStr);
    const pathName = new URL(urlStr).pathname;

    if (pathName.endsWith("/information")) {
      const isAlt1 = pathName.includes("Alt1");
      const isAlt2 = pathName.includes("Alt2");
      const isAlt3 = pathName.includes("Alt3");
      const name = isAlt1 ? "Alt 1" : isAlt2 ? "Alt 2" : isAlt3 ? "Alt 3" : "Root Account";
      return Response.json({
        character: { name, class: "WARRIOR", total_level: 150, stats: { combat: { level: 60 } } },
      });
    }
    if (pathName.endsWith("/metrics")) return Response.json({ metrics: {} });
    if (pathName.endsWith("/pets")) return Response.json({ pets: [] });
    if (pathName.endsWith("/characters")) {
      return Response.json({
        characters: [
          { hashed_id: "Alt1Hash", name: "Alt 1" },
          { hashed_id: "Alt2Hash", name: "Alt 2" },
          { hashed_id: "Alt3Hash", name: "Alt 3" },
        ],
      });
    }
    if (pathName.endsWith("/museum")) {
      return Response.json({
        items: [
          { id: 9001, name: "Ancient Relic A", category: "COLLECTIBLES" },
          { id: 9002, name: "Ancient Relic B", category: "COLLECTIBLES" },
        ],
        pagination: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
      });
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    const startRes = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.77",
      },
      body: JSON.stringify({ characterHash: "AccountRootHash" }),
    }), env);
    assert.equal(startRes.status, 202);
    const { jobId } = await json(startRes);

    // Run state machine through all steps to completion
    let stepRes = null;
    for (let i = 0; i < 10; i++) {
      stepRes = await advanceJobStep(env, jobId);
      if (stepRes.status === "complete") break;
    }
    assert.equal(stepRes.status, "complete");

    // Count museum queries across all characters
    const rootMuseumQueries = urls.filter((u) => u.includes("AccountRootHash") && u.includes("/museum"));
    const alt1MuseumQueries = urls.filter((u) => u.includes("Alt1Hash") && u.includes("/museum"));
    const alt2MuseumQueries = urls.filter((u) => u.includes("Alt2Hash") && u.includes("/museum"));
    const alt3MuseumQueries = urls.filter((u) => u.includes("Alt3Hash") && u.includes("/museum"));

    assert.equal(rootMuseumQueries.length, 1, `Root museum must be queried exactly once. Got: ${rootMuseumQueries.length}`);
    assert.equal(alt1MuseumQueries.length, 0, `Alt 1 museum queries must be EXACTLY 0. Got: ${alt1MuseumQueries.length}`);
    assert.equal(alt2MuseumQueries.length, 0, `Alt 2 museum queries must be EXACTLY 0. Got: ${alt2MuseumQueries.length}`);
    assert.equal(alt3MuseumQueries.length, 0, `Alt 3 museum queries must be EXACTLY 0. Got: ${alt3MuseumQueries.length}`);

    // Check payload in status response
    const statusRes = await handleRequest(new Request(`https://worker.test/profile-import/status/${jobId}`), env);
    const statusBody = await json(statusRes);
    assert.equal(statusBody.status, "done");
    assert.equal(statusBody.result.characters.length, 4);

    for (let i = 0; i < 4; i++) {
      const char = statusBody.result.characters[i];
      assert.equal(char.draft.museum.items.length, 2, `Character ${i} (${char.role}) must have 2 museum items attached!`);
      assert.equal(char.draft.museum.items[0].name, "Ancient Relic A");
      assert.equal(char.draft.museum.items[1].name, "Ancient Relic B");
      assert.ok(char.draft.importSource.importedSections.includes("museum"), `Character ${i} must have 'museum' in importedSections`);
    }

    console.log("  ✓ Alt museum queries confirmed: EXACTLY 0 redundant museum queries for 3 alts, all alts received shared museum items!");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ============================================================================
// CHALLENGE 5: Boundary Cases - Zero Alts, Private Museum, Rate Limit Backoff
// ============================================================================
console.log("\n[CHALLENGE 5] Testing Boundary Conditions (0 Alts, Private Museum 403, Rate Limit Backoff)...");
{
  const env = makeRealEnv();
  const originalFetch = globalThis.fetch;

  // 5a. Zero alts skips alt_characters
  globalThis.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.endsWith("/information")) {
      return Response.json({
        character: { name: "Solo Ranger", class: "ARCHER", total_level: 50, stats: { combat: { level: 25 } } },
      });
    }
    if (urlStr.endsWith("/metrics")) return Response.json({ metrics: {} });
    if (urlStr.endsWith("/pets")) return Response.json({ pets: [] });
    if (urlStr.endsWith("/characters")) return Response.json({ characters: [] }); // 0 alts
    if (urlStr.endsWith("/museum")) {
      return Response.json({
        items: [{ id: 1, name: "Solo Trophy", category: "COLLECTIBLES" }],
        pagination: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
      });
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    const startRes = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.101",
      },
      body: JSON.stringify({ characterHash: "SoloRangerHash" }),
    }), env);
    const { jobId } = await json(startRes);

    const step1 = await advanceJobStep(env, jobId);
    assert.equal(step1.currentStep, "account_museum");

    const step2 = await advanceJobStep(env, jobId);
    // Because visibleAlts is empty, account_museum transitions directly to final_assembly!
    assert.equal(step2.currentStep, "final_assembly", "Must skip alt_characters and jump directly to final_assembly when 0 alts!");

    const step3 = await advanceJobStep(env, jobId);
    assert.equal(step3.status, "complete");
    assert.equal(step3.publicResult.characters.length, 1);
    console.log("  ✓ 0-alt account correctly skips alt_characters and completes in 3 steps!");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // 5b. Private museum (403)
  globalThis.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.endsWith("/information")) {
      return Response.json({
        character: { name: "Private Lord", class: "MAGE", total_level: 80, stats: { combat: { level: 40 } } },
      });
    }
    if (urlStr.endsWith("/metrics")) return Response.json({ metrics: {} });
    if (urlStr.endsWith("/pets")) return Response.json({ pets: [] });
    if (urlStr.endsWith("/characters")) {
      return Response.json({
        characters: [{ hashed_id: "PrivateAltHash", name: "Private Alt" }],
      });
    }
    if (urlStr.endsWith("/museum")) {
      return new Response("Forbidden", { status: 403 }); // 403 Private Museum
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    const startRes = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.102",
      },
      body: JSON.stringify({ characterHash: "PrivateLordHash" }),
    }), env);
    const { jobId } = await json(startRes);

    await advanceJobStep(env, jobId); // root_baseline
    const museumStep = await advanceJobStep(env, jobId); // account_museum
    assert.equal(museumStep.currentStep, "alt_characters");

    const job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    const data = JSON.parse(job.step_data_json);
    assert.equal(data.accountMuseum.snapshot.status, "private");

    await advanceJobStep(env, jobId); // alt_characters
    const finalStep = await advanceJobStep(env, jobId); // final_assembly
    assert.equal(finalStep.status, "complete");
    assert.equal(finalStep.publicResult.characters[0].draft.museum.status, "private");
    assert.equal(finalStep.publicResult.characters[1].draft.museum.status, "private");
    console.log("  ✓ Private museum (403) attaches status: 'private' to all characters without failing job!");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // 5c. Upstream 429 Rate Limit Cooldown & Resume
  globalThis.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.endsWith("/information")) {
      return Response.json({
        character: { name: "Cooldown Hero", class: "ROGUE", total_level: 60, stats: { combat: { level: 30 } } },
      });
    }
    if (urlStr.endsWith("/metrics")) return Response.json({ metrics: {} });
    if (urlStr.endsWith("/pets")) return Response.json({ pets: [] });
    if (urlStr.endsWith("/characters")) return Response.json({ characters: [] });
    if (urlStr.includes("/museum")) {
      return new Response("Rate limited", { status: 429 }); // 429 Rate limited
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    const startRes = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.103",
      },
      body: JSON.stringify({ characterHash: "CooldownHeroHash" }),
    }), env);
    const { jobId } = await json(startRes);

    await advanceJobStep(env, jobId); // root_baseline finishes
    const failStep = await advanceJobStep(env, jobId); // account_museum hits 429
    assert.equal(failStep.status, "waiting_for_budget");
    assert.equal(failStep.code, "rate_limited");

    const job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(jobId).first();
    assert.equal(job.status, "waiting_for_budget");
    assert.equal(job.step_status, "pending");
    assert.equal(job.current_step, "account_museum");
    assert.equal(job.retry_count, 1);
    assert.equal(job.lease_token, null); // Lease released so retry can resume later

    // Global cooldown set in D1 cooldowns table
    const cooldown = await env.DB.prepare("SELECT * FROM cooldowns WHERE scope = 'global' AND key_fingerprint = 'global'").first();
    assert.ok(cooldown);
    assert.ok(new Date(cooldown.until_at).getTime() > Date.now());

    // Subsequent advance attempt is rejected by active cooldown
    const cooldownRes = await advanceJobStep(env, jobId);
    assert.equal(cooldownRes.status, "cooling_down");
    assert.ok(cooldownRes.retryAfterMs > 0);

    console.log("  ✓ Upstream 429 rate limit sets global cooldown, releases lease, sets status 'waiting_for_budget' and tracks retries cleanly!");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

console.log("\n=== ALL ADVERSARIAL CHALLENGER VERIFICATION TESTS PASSED SUCCESSFULLY ===");
