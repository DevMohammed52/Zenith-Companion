import assert from "node:assert/strict";
import { handleRequest } from "../src/index.mjs";

class MemoryKV {
  constructor() {
    this.map = new Map();
    this.gets = 0;
    this.puts = 0;
  }
  async put(key, value) {
    this.puts += 1;
    this.map.set(key, value);
  }
  async get(key) {
    this.gets += 1;
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

class ListLimitedKV extends MemoryKV {
  async list() {
    throw new Error("KV list() limit exceeded for the day.");
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
  async all() {
    return this.db.all(this.sql, this.args);
  }
}

class MemoryD1 {
  constructor() {
    this.jobs = new Map();
    this.cooldowns = new Map();
    this.usageEvents = new Map();
    this.appErrorEvents = new Map();
    this.webVitalEvents = new Map();
    this.minuteBudgets = new Map();
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
    if (sql.includes("INSERT INTO usage_events")) {
      const [id, visitorFingerprint, sessionFingerprint, eventType, path, referrerHost, deviceType, timezone, country, userAgentFamily, createdAt] = args;
      this.usageEvents.set(id, {
        id,
        visitor_fingerprint: visitorFingerprint,
        session_fingerprint: sessionFingerprint,
        event_type: eventType,
        path,
        referrer_host: referrerHost,
        device_type: deviceType,
        timezone,
        country,
        user_agent_family: userAgentFamily,
        created_at: createdAt,
      });
    }
    if (sql.includes("INSERT INTO app_error_events")) {
      const [id, source, eventType, path, digest, appVersion, browserClass, userAgentFamily, createdAt] = args;
      this.appErrorEvents.set(id, {
        id,
        source,
        event_type: eventType,
        path,
        digest,
        app_version: appVersion,
        browser_class: browserClass,
        user_agent_family: userAgentFamily,
        created_at: createdAt,
      });
    }
    if (sql.includes("INSERT INTO web_vital_events")) {
      const [id, metricName, metricValue, metricRating, path, deviceType, navigationType, userAgentFamily, createdAt] = args;
      this.webVitalEvents.set(id, {
        id,
        metric_name: metricName,
        metric_value: metricValue,
        metric_rating: metricRating,
        path,
        device_type: deviceType,
        navigation_type: navigationType,
        user_agent_family: userAgentFamily,
        created_at: createdAt,
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
    if (sql.includes("DELETE FROM minute_budgets")) {
      const [updatedBefore] = args;
      for (const [key, budget] of this.minuteBudgets) {
        if (budget.updated_at <= updatedBefore) this.minuteBudgets.delete(key);
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
    if (sql.includes("INSERT INTO minute_budgets")) {
      const [minuteKey, source, updatedAt, maxPerMinute] = args;
      const key = `${minuteKey}:${source}`;
      const existing = this.minuteBudgets.get(key);
      if (existing && Number(existing.used_requests || 0) >= Number(maxPerMinute || 0)) {
        return null;
      }
      const usedRequests = existing ? Number(existing.used_requests || 0) + 1 : 1;
      const row = {
        minute_key: minuteKey,
        source,
        used_requests: usedRequests,
        mode: "rate_limit",
        updated_at: updatedAt,
      };
      this.minuteBudgets.set(key, row);
      return { used_requests: usedRequests };
    }
    if (sql.includes("FROM cooldowns")) {
      const [scope, fingerprint, now] = args;
      const cooldown = this.cooldowns.get(`${scope}:${fingerprint}`);
      return cooldown && cooldown.until_at > now ? cooldown : null;
    }
    if (sql.includes("unique_import_users_all_time")) {
      const [dayAgo, weekAgo, fifteenAgo, hourAgo, usersDayAgo, usersWeekAgo, charactersDayAgo, charactersWeekAgo] = args;
      const jobs = Array.from(this.jobs.values());
      return {
        jobs_last_24h: jobs.filter((job) => job.created_at >= dayAgo).length,
        jobs_last_7d: jobs.filter((job) => job.created_at >= weekAgo).length,
        active_import_users_15m: distinctCount(jobs.filter((job) => job.created_at >= fifteenAgo), "requester_fingerprint"),
        active_import_users_1h: distinctCount(jobs.filter((job) => job.created_at >= hourAgo), "requester_fingerprint"),
        unique_import_users_24h: distinctCount(jobs.filter((job) => job.created_at >= usersDayAgo), "requester_fingerprint"),
        unique_import_users_7d: distinctCount(jobs.filter((job) => job.created_at >= usersWeekAgo), "requester_fingerprint"),
        unique_import_users_all_time: distinctCount(jobs, "requester_fingerprint"),
        unique_characters_24h: distinctCount(jobs.filter((job) => job.created_at >= charactersDayAgo), "target_hash_fingerprint"),
        unique_characters_7d: distinctCount(jobs.filter((job) => job.created_at >= charactersWeekAgo), "target_hash_fingerprint"),
        unique_characters_all_time: distinctCount(jobs, "target_hash_fingerprint"),
      };
    }
    if (sql.includes("unique_users_all_time")) {
      const [eventsDayAgo, pageviewsDayAgo, fifteenAgo, hourAgo, usersDayAgo, usersWeekAgo, sessionsDayAgo, sessionsWeekAgo] = args;
      const events = Array.from(this.usageEvents.values());
      return {
        events_24h: events.filter((event) => event.created_at >= eventsDayAgo).length,
        pageviews_24h: events.filter((event) => event.event_type === "pageview" && event.created_at >= pageviewsDayAgo).length,
        active_users_15m: distinctCount(events.filter((event) => event.created_at >= fifteenAgo), "visitor_fingerprint"),
        active_users_1h: distinctCount(events.filter((event) => event.created_at >= hourAgo), "visitor_fingerprint"),
        unique_users_24h: distinctCount(events.filter((event) => event.created_at >= usersDayAgo), "visitor_fingerprint"),
        unique_users_7d: distinctCount(events.filter((event) => event.created_at >= usersWeekAgo), "visitor_fingerprint"),
        unique_users_all_time: distinctCount(events, "visitor_fingerprint"),
        sessions_24h: distinctCount(events.filter((event) => event.created_at >= sessionsDayAgo), "session_fingerprint"),
        sessions_7d: distinctCount(events.filter((event) => event.created_at >= sessionsWeekAgo), "session_fingerprint"),
      };
    }
    if (sql.includes("unique_digests_24h")) {
      const [dayAgo, weekAgo, monthAgo, digestDayAgo] = args;
      const events = Array.from(this.appErrorEvents.values());
      return {
        events_24h: events.filter((event) => event.created_at >= dayAgo).length,
        events_7d: events.filter((event) => event.created_at >= weekAgo).length,
        events_30d: events.filter((event) => event.created_at >= monthAgo).length,
        unique_digests_24h: distinctCount(events.filter((event) => event.created_at >= digestDayAgo && event.digest), "digest"),
      };
    }
    if (sql.includes("FROM web_vital_events") && sql.includes("events_30d")) {
      const [dayAgo, weekAgo, monthAgo, poorDayAgo, poorMonthAgo] = args;
      const events = Array.from(this.webVitalEvents.values());
      return {
        events_24h: events.filter((event) => event.created_at >= dayAgo).length,
        events_7d: events.filter((event) => event.created_at >= weekAgo).length,
        events_30d: events.filter((event) => event.created_at >= monthAgo).length,
        poor_24h: events.filter((event) => event.metric_rating === "poor" && event.created_at >= poorDayAgo).length,
        poor_30d: events.filter((event) => event.metric_rating === "poor" && event.created_at >= poorMonthAgo).length,
      };
    }
    if (sql.includes("SELECT COUNT(*) AS count") && sql.includes("FROM import_jobs")) {
      const [createdAfter] = args;
      return { count: Array.from(this.jobs.values()).filter((job) => job.created_at >= createdAfter).length };
    }
    if (sql.includes("oldest_queued_at")) {
      const [now] = args;
      const active = Array.from(this.jobs.values()).filter((job) => job.expires_at > now);
      const queued = active.filter((job) => job.status === "queued").sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
      const running = active
        .filter((job) => ["running", "waiting_for_budget"].includes(job.status))
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at))[0];
      return {
        oldest_queued_at: queued?.created_at || null,
        oldest_running_at: running?.updated_at || null,
      };
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
    if (sql.includes("COUNT(*) AS total") && sql.includes("avg_duration_seconds")) {
      const [createdAfter] = args;
      const jobs = Array.from(this.jobs.values()).filter((job) => job.created_at >= createdAfter);
      const completed = jobs.filter((job) => job.status === "complete");
      return {
        total: jobs.length,
        completed: completed.length,
        failed: jobs.filter((job) => job.status === "failed").length,
        waiting_for_budget: jobs.filter((job) => job.status === "waiting_for_budget").length,
        rate_limited: jobs.filter((job) => job.error_code === "rate_limited").length,
        avg_request_count: average(completed.map((job) => Number(job.request_count || 0))),
        avg_retry_count: average(completed.map((job) => Number(job.retry_count || 0))),
        avg_duration_seconds: average(completed.map((job) => {
          const start = new Date(job.created_at).getTime();
          const end = new Date(job.updated_at).getTime();
          return Number.isFinite(start) && Number.isFinite(end) ? (end - start) / 1000 : 0;
        })),
      };
    }
    if (sql.includes("SELECT id FROM import_jobs") && sql.includes("LIMIT 1")) {
      const [now] = args;
      return Array.from(this.jobs.values())
        .filter((job) => job.status === "queued" && job.expires_at > now)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0] || null;
    }
    if (sql.includes("WHERE status = 'running'")) {
      const [now] = args;
      return Array.from(this.jobs.values())
        .filter((job) => job.status === "running" && job.expires_at > now)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] || null;
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
  async all(sql, args) {
    if (sql.includes("FROM web_vital_events") && sql.includes("GROUP BY metric_name") && !sql.includes("path")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.webVitalEvents.values()) {
        if (event.created_at < createdAfter) continue;
        const row = grouped.get(event.metric_name) || { metric_name: event.metric_name, values: [], events: 0, poor: 0 };
        row.events += 1;
        row.values.push(Number(event.metric_value || 0));
        if (event.metric_rating === "poor") row.poor += 1;
        grouped.set(event.metric_name, row);
      }
      return {
        results: Array.from(grouped.values()).map((row) => ({
          metric_name: row.metric_name,
          events: row.events,
          poor: row.poor,
          avg_value: average(row.values),
          max_value: row.values.length ? Math.max(...row.values) : 0,
        })),
      };
    }
    if (sql.includes("FROM web_vital_events") && sql.includes("ORDER BY created_at DESC")) {
      const [createdAfter] = args;
      return {
        results: Array.from(this.webVitalEvents.values())
          .filter((event) => event.created_at >= createdAfter)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 10000)
          .map((event) => ({ metric_name: event.metric_name, metric_value: event.metric_value })),
      };
    }
    if (sql.includes("FROM web_vital_events") && sql.includes("GROUP BY path, metric_name")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.webVitalEvents.values()) {
        if (event.created_at < createdAfter) continue;
        const key = `${event.path}:${event.metric_name}`;
        const row = grouped.get(key) || { path: event.path, metric_name: event.metric_name, events: 0, poor: 0 };
        row.events += 1;
        if (event.metric_rating === "poor") row.poor += 1;
        grouped.set(key, row);
      }
      return {
        results: Array.from(grouped.values())
          .sort((a, b) => (b.poor - a.poor) || (b.events - a.events))
          .slice(0, 10),
      };
    }
    if (sql.includes("FROM web_vital_events") && sql.includes("GROUP BY device_type")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.webVitalEvents.values()) {
        if (event.created_at < createdAfter) continue;
        const row = grouped.get(event.device_type) || { device_type: event.device_type, events: 0, poor: 0 };
        row.events += 1;
        if (event.metric_rating === "poor") row.poor += 1;
        grouped.set(event.device_type, row);
      }
      return {
        results: Array.from(grouped.values())
          .sort((a, b) => (b.poor - a.poor) || (b.events - a.events)),
      };
    }
    if (sql.includes("FROM app_error_events") && sql.includes("GROUP BY path")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.appErrorEvents.values()) {
        if (event.created_at < createdAfter) continue;
        const row = grouped.get(event.path) || { path: event.path, events: 0, digests: new Set() };
        row.events += 1;
        if (event.digest) row.digests.add(event.digest);
        grouped.set(event.path, row);
      }
      return {
        results: Array.from(grouped.values())
          .map((row) => ({ path: row.path, events: row.events, digests: row.digests.size }))
          .sort((a, b) => b.events - a.events)
          .slice(0, 10),
      };
    }
    if (sql.includes("FROM app_error_events") && sql.includes("GROUP BY digest")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.appErrorEvents.values()) {
        if (event.created_at < createdAfter || !event.digest) continue;
        const row = grouped.get(event.digest) || { digest: event.digest, events: 0, paths: new Set(), last_seen_at: "" };
        row.events += 1;
        row.paths.add(event.path);
        row.last_seen_at = row.last_seen_at && row.last_seen_at > event.created_at ? row.last_seen_at : event.created_at;
        grouped.set(event.digest, row);
      }
      return {
        results: Array.from(grouped.values())
          .map((row) => ({ digest: row.digest, events: row.events, paths: row.paths.size, last_seen_at: row.last_seen_at }))
          .sort((a, b) => b.events - a.events)
          .slice(0, 10),
      };
    }
    if (sql.includes("FROM app_error_events") && sql.includes("GROUP BY browser_class")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.appErrorEvents.values()) {
        if (event.created_at < createdAfter) continue;
        grouped.set(event.browser_class, (grouped.get(event.browser_class) || 0) + 1);
      }
      return {
        results: Array.from(grouped, ([browser_class, events]) => ({ browser_class, events })),
      };
    }
    if (sql.includes("FROM app_error_events") && sql.includes("ORDER BY created_at DESC")) {
      return {
        results: Array.from(this.appErrorEvents.values())
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 10),
      };
    }
    if (sql.includes("FROM usage_events") && sql.includes("GROUP BY path")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.usageEvents.values()) {
        if (event.event_type !== "pageview" || event.created_at < createdAfter) continue;
        const row = grouped.get(event.path) || { path: event.path, views: 0, visitors: new Set() };
        row.views += 1;
        row.visitors.add(event.visitor_fingerprint);
        grouped.set(event.path, row);
      }
      return {
        results: Array.from(grouped.values())
          .map((row) => ({ path: row.path, views: row.views, users: row.visitors.size }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 8),
      };
    }
    if (sql.includes("FROM usage_events") && sql.includes("GROUP BY device_type")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.usageEvents.values()) {
        if (event.created_at < createdAfter) continue;
        const row = grouped.get(event.device_type) || new Set();
        row.add(event.visitor_fingerprint);
        grouped.set(event.device_type, row);
      }
      return {
        results: Array.from(grouped, ([device_type, users]) => ({ device_type, users: users.size })),
      };
    }
    if (sql.includes("FROM usage_events") && sql.includes("GROUP BY referrer_host")) {
      const [createdAfter] = args;
      const grouped = new Map();
      for (const event of this.usageEvents.values()) {
        if (event.created_at < createdAfter || !event.referrer_host) continue;
        const row = grouped.get(event.referrer_host) || new Set();
        row.add(event.visitor_fingerprint);
        grouped.set(event.referrer_host, row);
      }
      return {
        results: Array.from(grouped, ([referrer_host, users]) => ({ referrer_host, users: users.size })),
      };
    }
    if (sql.includes("GROUP BY status")) {
      const [createdAfter] = args;
      const counts = new Map();
      for (const job of this.jobs.values()) {
        if (job.created_at < createdAfter) continue;
        counts.set(job.status, (counts.get(job.status) || 0) + 1);
      }
      return { results: Array.from(counts, ([status, count]) => ({ status, count })) };
    }
    if (sql.includes("ORDER BY created_at DESC") && sql.includes("LIMIT 10")) {
      return {
        results: Array.from(this.jobs.values())
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 10),
      };
    }
    return { results: [] };
  }
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function distinctCount(rows, key) {
  return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
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
    ADMIN_DASHBOARD_SECRET: "admin-secret",
    USAGE_PING_SECRET: "usage-secret",
    USAGE_PING_MAX_PER_MINUTE: "120",
    USAGE_VITALS_MAX_PER_MINUTE: "80",
    ERROR_REPORT_SECRET: "error-secret",
    ERROR_REPORT_MAX_PER_MINUTE: "120",
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
  const now = new Date();
  e.DB.jobs.set("imp_recent_1", {
    id: "imp_recent_1",
    status: "complete",
    target_hash_fingerprint: "hash-a",
    requester_fingerprint: "user-a",
    request_count: 14,
    retry_count: 1,
    budget_mode: "normal",
    created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    expires_at: new Date(now.getTime() + 50 * 60 * 1000).toISOString(),
  });
  e.DB.jobs.set("imp_recent_2", {
    id: "imp_recent_2",
    status: "queued",
    target_hash_fingerprint: "hash-b",
    requester_fingerprint: "user-b",
    request_count: 0,
    retry_count: 0,
    budget_mode: "normal",
    created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    expires_at: new Date(now.getTime() + 55 * 60 * 1000).toISOString(),
  });
  const unauthorized = await handleRequest(new Request("https://worker.test/admin/import-health"), e);
  assert.equal(unauthorized.status, 401);

  const response = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  assert.equal(response.status, 200);
  const body = await json(response);
  assert.equal(body.ok, true);
  assert.equal(body.service.worker, "zenith-profile-import");
  assert.equal(typeof body.queue.pending, "number");
  assert.equal(body.demand.activeImportUsers15m, 2);
  assert.equal(body.demand.uniqueCharacters24h, 2);
  assert.equal(body.last24h.completionRate, 50);
  assert.equal(typeof body.usage.activeUsers15m, "number");
  assert.equal(typeof body.pressure.oldestQueuedSeconds, "number");
  assert.equal(Array.isArray(body.recentJobs), true);
  assert.equal(JSON.stringify(body).includes("target_hash"), false);
  assert.equal(JSON.stringify(body).includes("result_json"), false);
}

{
  const e = env();
  const unauthorized = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      visitorId: "visitor-fixture",
      sessionId: "session-fixture",
      eventType: "pageview",
      path: "/profiles",
    }),
  }), e);
  assert.equal(unauthorized.status, 401);
  assert.equal(e.DB.usageEvents.size, 0);

  const response = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "user-agent": "Mozilla/5.0 Chrome/126.0",
      "cf-ipcountry": "IN",
    },
    body: JSON.stringify({
      visitorId: "visitor-fixture",
      sessionId: "session-fixture",
      eventType: "pageview",
      path: "/profiles?tab=import",
      referrer: "https://discord.com/channels/1/2",
      deviceType: "mobile",
      timezone: "Asia/Calcutta",
    }),
  }), e);
  assert.equal(response.status, 202);
  assert.equal((await json(response)).ok, true);
  assert.equal(e.DB.usageEvents.size, 1);

  const health = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  const body = await json(health);
  assert.equal(body.usage.activeUsers15m, 1);
  assert.equal(body.usage.pageviews24h, 1);
  assert.equal(body.usage.topPages[0].path, "/profiles");
  assert.equal(body.usage.devices[0].type, "mobile");
}

{
  const e = env();
  const unauthorized = await handleRequest(new Request("https://worker.test/usage/vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      metricName: "LCP",
      value: 2512.3456,
      rating: "poor",
      path: "/items",
    }),
  }), e);
  assert.equal(unauthorized.status, 401);
  assert.equal(e.DB.webVitalEvents.size, 0);

  const response = await handleRequest(new Request("https://worker.test/usage/vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "user-agent": "Mozilla/5.0 Edg/126.0",
    },
    body: JSON.stringify({
      metricName: "lcp",
      value: 2512.3456,
      rating: "poor",
      path: "/items?search=private#row",
      deviceType: "desktop",
      navigationType: "reload",
      id: "metric-id-must-not-be-stored",
      attribution: { element: "#private-selector" },
    }),
  }), e);
  assert.equal(response.status, 202);
  assert.equal((await json(response)).ok, true);
  assert.equal(e.DB.webVitalEvents.size, 1);
  const event = Array.from(e.DB.webVitalEvents.values())[0];
  assert.equal(event.metric_name, "LCP");
  assert.equal(event.metric_value, 2512.346);
  assert.equal(event.metric_rating, "poor");
  assert.equal(event.path, "/items");
  assert.equal(event.device_type, "desktop");
  assert.equal(event.navigation_type, "reload");
  assert.equal(event.user_agent_family, "edge");
  assert.equal(JSON.stringify(event).includes("metric-id-must-not-be-stored"), false);
  assert.equal(JSON.stringify(event).includes("private-selector"), false);

  const bad = await handleRequest(new Request("https://worker.test/usage/vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      metricName: "CUSTOM",
      value: -1,
      path: "/items",
    }),
  }), e);
  assert.equal(bad.status, 400);
  assert.equal(e.DB.webVitalEvents.size, 1);

  const health = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  const body = await json(health);
  assert.equal(body.webVitals.events24h, 1);
  assert.equal(body.webVitals.poor24h, 1);
  assert.equal(body.webVitals.metrics[0].name, "LCP");
  assert.equal(body.webVitals.topPaths[0].path, "/items");
}

{
  const e = env();
  const unauthorized = await handleRequest(new Request("https://worker.test/error/report", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      source: "client",
      eventType: "route_error",
      path: "/items",
      digest: "NEXT_DIGEST_1",
      message: "raw message must not be stored",
      stack: "raw stack must not be stored",
    }),
  }), e);
  assert.equal(unauthorized.status, 401);
  assert.equal(e.DB.appErrorEvents.size, 0);

  const response = await handleRequest(new Request("https://worker.test/error/report", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer error-secret",
      origin: "https://zenith.example",
      "user-agent": "Mozilla/5.0 Firefox/126.0",
    },
    body: JSON.stringify({
      source: "client",
      eventType: "route_error",
      path: "/items?search=private#hash",
      digest: "NEXT_DIGEST_1:abc/def",
      appVersion: "abc123",
      browserClass: "firefox",
      message: "raw message must not be stored",
      stack: "raw stack must not be stored",
    }),
  }), e);
  assert.equal(response.status, 202);
  assert.equal((await json(response)).ok, true);
  assert.equal(e.DB.appErrorEvents.size, 1);
  const event = Array.from(e.DB.appErrorEvents.values())[0];
  assert.equal(event.path, "/items");
  assert.equal(event.digest, "NEXT_DIGEST_1:abc/def");
  assert.equal(event.browser_class, "firefox");
  assert.equal(JSON.stringify(event).includes("raw message"), false);
  assert.equal(JSON.stringify(event).includes("raw stack"), false);

  const health = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  const body = await json(health);
  assert.equal(body.appErrors.events24h, 1);
  assert.equal(body.appErrors.topPaths[0].path, "/items");
  assert.equal(body.appErrors.topDigests[0].digest, "NEXT_DIGEST_1:abc/def");
}

{
  const e = env({ USAGE_PING_MAX_PER_MINUTE: "1" });
  const requestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.10",
    },
    body: JSON.stringify({
      visitorId: "visitor-fixture",
      sessionId: "session-fixture",
      eventType: "heartbeat",
      path: "/items",
    }),
  };
  const first = await handleRequest(new Request("https://worker.test/usage/ping", requestInit), e);
  const second = await handleRequest(new Request("https://worker.test/usage/ping", requestInit), e);
  assert.equal(first.status, 202);
  assert.equal(second.status, 429);
  assert.equal(e.DB.usageEvents.size, 1);
  assert.equal(e.DB.minuteBudgets.size, 1);
  assert.equal(e.ZENITH_COORDINATOR.gets, 0);
  assert.equal(e.ZENITH_COORDINATOR.puts, 0);
}

{
  const e = env({ USAGE_VITALS_MAX_PER_MINUTE: "1" });
  const requestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.15",
    },
    body: JSON.stringify({
      metricName: "INP",
      value: 420,
      rating: "poor",
      path: "/guilds",
    }),
  };
  const first = await handleRequest(new Request("https://worker.test/usage/vitals", requestInit), e);
  const second = await handleRequest(new Request("https://worker.test/usage/vitals", requestInit), e);
  assert.equal(first.status, 202);
  assert.equal(second.status, 429);
  assert.equal(e.DB.webVitalEvents.size, 1);
  assert.equal(e.DB.minuteBudgets.size, 1);
  assert.equal(e.ZENITH_COORDINATOR.gets, 0);
  assert.equal(e.ZENITH_COORDINATOR.puts, 0);
}

{
  const e = env({ ERROR_REPORT_MAX_PER_MINUTE: "1" });
  const requestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer error-secret",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.20",
    },
    body: JSON.stringify({
      source: "client",
      eventType: "app_shell_error",
      path: "/profiles",
      digest: "SHELL_DIGEST",
    }),
  };
  const first = await handleRequest(new Request("https://worker.test/error/report", requestInit), e);
  const second = await handleRequest(new Request("https://worker.test/error/report", requestInit), e);
  assert.equal(first.status, 202);
  assert.equal(second.status, 429);
  assert.equal(e.DB.appErrorEvents.size, 1);
  assert.equal(e.DB.minuteBudgets.size, 1);
  assert.equal(e.ZENITH_COORDINATOR.gets, 0);
  assert.equal(e.ZENITH_COORDINATOR.puts, 0);
}

{
  const e = env({ ZENITH_COORDINATOR: null });
  const response = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.30",
    },
    body: JSON.stringify({
      visitorId: "visitor-no-kv",
      sessionId: "session-no-kv",
      eventType: "pageview",
      path: "/settings",
    }),
  }), e);
  assert.equal(response.status, 202);
  assert.equal(e.DB.usageEvents.size, 1);
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
      characterHash: "FixtureHash0000000001",
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
  const e = env({ TURNSTILE_SECRET_KEY: "turnstile-secret" });
  const response = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.37",
    },
    body: JSON.stringify({
      characterHash: "FixtureHash0000000001",
    }),
  }), e);
  const body = await json(response);
  assert.equal(response.status, 403);
  assert.equal(body.error.code, "turnstile_failed");
  assert.equal(e.DB.jobs.size, 0);
}

{
  const e = env({ TURNSTILE_SECRET_KEY: "turnstile-secret" });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
      return Response.json({ success: true });
    }
    return new Response("{}", { status: 404 });
  };
  try {
    const response = await handleRequest(new Request("https://worker.test/profile-import/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://zenith.example",
        "cf-connecting-ip": "203.0.113.38",
      },
      body: JSON.stringify({
        characterHash: "FixtureHash0000000001",
        turnstileToken: "valid-turnstile-token",
      }),
    }), e);
    const body = await json(response);
    assert.equal(response.status, 202);
    assert.match(body.jobId, /^imp_/);
    assert.equal(body.status, "queued");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

{
  const e = env();
  const first = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.27",
    },
    body: JSON.stringify({
      characterHash: "FixtureHash0000000001",
    }),
  }), e);
  const firstBody = await json(first);

  const second = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.28",
    },
    body: JSON.stringify({
      characterHash: "FixtureHash0000000002",
    }),
  }), e);
  const secondBody = await json(second);
  assert.equal(second.status, 202);
  e.DB.jobs.get(firstBody.jobId).status = "running";

  const process = await handleRequest(new Request("https://worker.test/internal/process-next", {
    method: "POST",
    headers: { authorization: "Bearer coordinator-secret" },
  }), e);
  const body = await json(process);
  assert.equal(body.result.status, "busy");
  assert.equal(body.result.activeJobId, firstBody.jobId);
  assert.equal(e.DB.jobs.get(secondBody.jobId).status, "queued");
}

{
  const e = env({ ZENITH_COORDINATOR: new ListLimitedKV() });
  const response = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.17",
    },
    body: JSON.stringify({
      characterHash: "FixtureHash0000000001",
    }),
  }), e);
  const body = await json(response);
  assert.equal(response.status, 202);
  assert.equal(body.budgetMode, "unknown");
}

{
  const e = env({ IMPORT_MAX_PENDING: "1" });
  const first = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.47",
    },
    body: JSON.stringify({
      characterHash: "FixtureHash0000000047",
    }),
  }), e);
  assert.equal(first.status, 202);

  const second = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.48",
    },
    body: JSON.stringify({
      characterHash: "FixtureHash0000000048",
    }),
  }), e);
  const body = await json(second);
  assert.equal(second.status, 429);
  assert.equal(body.error.code, "queue_busy");
  assert.equal(typeof body.retryAfterMs, "number");
  assert.ok(body.retryAfterMs >= 60000);
  assert.match(body.error.message, /try again in about/i);
}

{
  const response = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
    },
    body: JSON.stringify({ characterHash: "FixtureHash0000000001" }),
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
            combat: path.includes("altHash")
              ? { level: 100, ascension_level: 2, experience: 1 }
              : path.includes("dokidexhash")
                ? { level: 100, ascension_level: 1, experience: 1 }
                : { level: 100, experience: 23_878_925 },
            strength: { level: 90, experience: 1 },
            speed: { level: 100, experience: 23_878_925 },
          },
          skills: {
            cooking: { level: 95, experience: 10 },
            smelting: { level: 100, experience: 105_006_542 },
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
      body: JSON.stringify({ characterHash: "FixtureHash0000000001" }),
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
    assert.equal(body.result.characters[0].draft.levels.speed, 100);
    assert.equal(body.result.characters[0].draft.skills.smelting.level, 189);
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
      body: JSON.stringify({ characterHash: "FixtureHash0000000001" }),
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
