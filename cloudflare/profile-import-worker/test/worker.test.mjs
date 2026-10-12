import assert from "node:assert/strict";
import {
  handleRequest,
  processNextImportJob,
  timingSafeEqualString,
  hasBearerSecret,
  verifyTurnstile,
  importBudgetMode,
  isExpiredIso,
  DEFAULT_IMPORT_STATUS_MAX_PER_MINUTE,
  TERMINAL_STATUS_CACHE_CONTROL,
  NOT_FOUND_STATUS_CACHE_CONTROL,
  isValidIp,
  requesterKey,
  isTrustedProxyRequest,
  checkInMemoryRateLimit,
  resetTelemetryRateLimits,
  cleanupTelemetryRateLimits,
  checkUsagePingRateLimit,
  checkUsageVitalsRateLimit,
  checkErrorReportRateLimit,
  checkImportStatusRateLimit,
} from "../src/index.mjs";

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
    this.usageVisitors = new Map();
    this.appErrorEvents = new Map();
    this.webVitalEvents = new Map();
    this.minuteBudgets = new Map();
  }
  prepare(sql) {
    return new Statement(this, sql);
  }
  async batch(statements) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
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
    if (sql.includes("INSERT INTO usage_visitors")) {
      const [visitorFingerprint, firstSeenAt, lastSeenAt, totalPageviews, deviceType, country] = args;
      const existing = this.usageVisitors.get(visitorFingerprint);
      if (!existing) {
        this.usageVisitors.set(visitorFingerprint, {
          visitor_fingerprint: visitorFingerprint,
          first_seen_at: firstSeenAt,
          last_seen_at: lastSeenAt,
          total_events: 1,
          total_pageviews: Number(totalPageviews || 0),
          device_type: deviceType,
          country,
        });
      } else {
        const lastSeenMs = new Date(existing.last_seen_at).getTime();
        const incomingMs = new Date(lastSeenAt).getTime();
        if (incomingMs - lastSeenMs >= 15 * 60 * 1000) {
          existing.last_seen_at = lastSeenAt;
          existing.total_events += 1;
          existing.total_pageviews += Number(totalPageviews || 0);
          if (deviceType && deviceType !== "unknown") existing.device_type = deviceType;
          if (country) existing.country = country;
        }
      }
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
    if (sql.includes("UPDATE import_jobs") && sql.includes("error_code = 'timeout'")) {
      const [errorMessage, updatedAt, staleThreshold] = args;
      let count = 0;
      for (const job of this.jobs.values()) {
        if (job.status === "running" && job.updated_at < staleThreshold) {
          Object.assign(job, {
            status: "failed",
            error_code: "timeout",
            error_message: errorMessage,
            updated_at: updatedAt,
          });
          count += 1;
        }
      }
      return { success: true, changes: count, meta: { changes: count } };
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = 'running'")) {
      const [budgetMode, updatedAt, id] = args;
      const job = this.jobs.get(id);
      if (job && ["queued", "waiting_for_budget"].includes(job.status)) {
        Object.assign(job, {
          status: "running",
          budget_mode: budgetMode,
          updated_at: updatedAt,
        });
        return { success: true, changes: 1, meta: { changes: 1 } };
      }
      return { success: true, changes: 0, meta: { changes: 0 } };
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = 'failed'")) {
      const [errorCode, errorMessage, updatedAt, id] = args;
      const job = this.jobs.get(id);
      if (job) {
        Object.assign(job, {
          status: "failed",
          error_code: errorCode,
          error_message: errorMessage,
          updated_at: updatedAt,
        });
        return { success: true, changes: 1, meta: { changes: 1 } };
      }
      return { success: true, changes: 0, meta: { changes: 0 } };
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = 'waiting_for_budget'")) {
      const [errorCode, errorMessage, updatedAt, id] = args;
      const job = this.jobs.get(id);
      if (job) {
        Object.assign(job, {
          status: "waiting_for_budget",
          retry_count: Number(job.retry_count || 0) + 1,
          error_code: errorCode,
          error_message: errorMessage,
          updated_at: updatedAt,
        });
        return { success: true, changes: 1, meta: { changes: 1 } };
      }
      return { success: true, changes: 0, meta: { changes: 0 } };
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET request_count = ?")) {
      const [requestCount, updatedAt, id] = args;
      const job = this.jobs.get(id);
      if (job) {
        Object.assign(job, {
          request_count: requestCount,
          updated_at: updatedAt,
        });
        return { success: true, changes: 1, meta: { changes: 1 } };
      }
      return { success: true, changes: 0, meta: { changes: 0 } };
    }
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = ?")) {
      const [status, budgetMode, updatedAt, id] = args;
      const job = this.jobs.get(id);
      if (job) {
        Object.assign(job, {
          status,
          budget_mode: budgetMode,
          updated_at: updatedAt,
        });
        return { success: true, changes: 1, meta: { changes: 1 } };
      }
      return { success: true, changes: 0, meta: { changes: 0 } };
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
    return { success: true, changes: 1, meta: { changes: 1 } };
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
    if (sql.includes("FROM usage_visitors")) {
      const visitors = Array.from(this.usageVisitors.values());
      if (sql.includes("WHERE last_seen_at >=")) {
        const [since] = args;
        const count = visitors.filter((v) => v.last_seen_at >= since).length;
        return { count };
      }
      return { count: visitors.length };
    }
    if (sql.includes("sessions_30d") && !sql.includes("unique_users_30d")) {
      const [eventsDayAgo, pageviewsDayAgo, sessionsDayAgo, sessionsWeekAgo, createdAfter] = args;
      const events = Array.from(this.usageEvents.values());
      const boundEvents = createdAfter ? events.filter((e) => e.created_at >= createdAfter) : events;
      return {
        events_24h: events.filter((event) => event.created_at >= eventsDayAgo).length,
        pageviews_24h: events.filter((event) => event.event_type === "pageview" && event.created_at >= pageviewsDayAgo).length,
        sessions_24h: distinctCount(events.filter((event) => event.created_at >= sessionsDayAgo), "session_fingerprint"),
        sessions_7d: distinctCount(events.filter((event) => event.created_at >= sessionsWeekAgo), "session_fingerprint"),
        sessions_30d: distinctCount(boundEvents, "session_fingerprint"),
      };
    }
    if (sql.includes("unique_users_30d") || sql.includes("unique_users_all_time")) {
      const [eventsDayAgo, pageviewsDayAgo, fifteenAgo, hourAgo, usersDayAgo, usersWeekAgo, sessionsDayAgo, sessionsWeekAgo, createdAfter] = args;
      const events = Array.from(this.usageEvents.values());
      const boundEvents = createdAfter ? events.filter((e) => e.created_at >= createdAfter) : events;
      return {
        events_24h: events.filter((event) => event.created_at >= eventsDayAgo).length,
        pageviews_24h: events.filter((event) => event.event_type === "pageview" && event.created_at >= pageviewsDayAgo).length,
        active_users_15m: distinctCount(events.filter((event) => event.created_at >= fifteenAgo), "visitor_fingerprint"),
        active_users_1h: distinctCount(events.filter((event) => event.created_at >= hourAgo), "visitor_fingerprint"),
        unique_users_24h: distinctCount(events.filter((event) => event.created_at >= usersDayAgo), "visitor_fingerprint"),
        unique_users_7d: distinctCount(events.filter((event) => event.created_at >= usersWeekAgo), "visitor_fingerprint"),
        unique_users_30d: distinctCount(boundEvents, "visitor_fingerprint"),
        ...(sql.includes("unique_users_all_time") ? { unique_users_all_time: distinctCount(events, "visitor_fingerprint") } : {}),
        sessions_24h: distinctCount(events.filter((event) => event.created_at >= sessionsDayAgo), "session_fingerprint"),
        sessions_7d: distinctCount(events.filter((event) => event.created_at >= sessionsWeekAgo), "session_fingerprint"),
        sessions_30d: distinctCount(boundEvents, "session_fingerprint"),
      };
    }
    if (sql.includes("FROM usage_events") && sql.includes("SUM(CASE WHEN event_type = 'pageview'")) {
      const [since] = args;
      const events = Array.from(this.usageEvents.values()).filter((event) => !since || event.created_at >= since);
      const pageviews = events.filter((e) => e.event_type === "pageview").length;
      const sessions = distinctCount(events, "session_fingerprint");
      return {
        events: events.length,
        pageviews,
        heartbeats: events.filter((e) => e.event_type === "heartbeat").length,
        users: distinctCount(events, "visitor_fingerprint"),
        sessions,
      };
    }
    if (sql.includes("unique_digests_24h")) {
      const [dayAgo, weekAgo, digestDayAgo, monthAgo] = args;
      const events = Array.from(this.appErrorEvents.values());
      const boundEvents = monthAgo ? events.filter((e) => e.created_at >= monthAgo) : events;
      return {
        events_24h: events.filter((event) => event.created_at >= dayAgo).length,
        events_7d: events.filter((event) => event.created_at >= weekAgo).length,
        events_30d: boundEvents.length,
        unique_digests_24h: distinctCount(events.filter((event) => event.created_at >= digestDayAgo && event.digest), "digest"),
      };
    }
    if (sql.includes("FROM web_vital_events") && (sql.includes("events_30d") || sql.includes("poor_30d"))) {
      const [dayAgo, weekAgo, poorDayAgo, monthAgo] = args;
      const events = Array.from(this.webVitalEvents.values());
      const boundEvents = monthAgo ? events.filter((e) => e.created_at >= monthAgo) : events;
      return {
        events_24h: events.filter((event) => event.created_at >= dayAgo).length,
        events_7d: events.filter((event) => event.created_at >= weekAgo).length,
        events_30d: boundEvents.length,
        poor_24h: events.filter((event) => event.metric_rating === "poor" && event.created_at >= poorDayAgo).length,
        poor_30d: boundEvents.filter((event) => event.metric_rating === "poor").length,
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
    if (sql.includes("target_hash_fingerprint = ?")) {
      const [fingerprint, now] = args;
      return Array.from(this.jobs.values())
        .filter((job) =>
          job.target_hash_fingerprint === fingerprint &&
          ["queued", "running", "waiting_for_budget"].includes(job.status) &&
          job.expires_at > now
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
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
    IMPORT_STATUS_MAX_PER_MINUTE: "120",
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
  // Phase 3: Web Vitals batching and Cross-device character linkage
  const e = env();
  const batchResponse = await handleRequest(new Request("https://worker.test/usage/vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify([
      { metricName: "CLS", value: 0.05, rating: "good", path: "/overview" },
      { metricName: "FCP", value: 800, rating: "good", path: "/overview" },
      { metricName: "INP", value: 50, rating: "good", path: "/overview" },
    ]),
  }), e);
  assert.equal(batchResponse.status, 202);
  assert.equal((await json(batchResponse)).ok, true);
  assert.equal(e.DB.webVitalEvents.size, 3);

  // Reject batches with > 50 items
  const oversizedBatch = Array.from({ length: 51 }, () => ({
    metricName: "CLS",
    value: 0.01,
    rating: "good",
    path: "/overview",
  }));
  const oversizedResponse = await handleRequest(new Request("https://worker.test/usage/vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify(oversizedBatch),
  }), e);
  assert.equal(oversizedResponse.status, 400);

  // Accept mixed valid and invalid items in batch
  const mixedBatchResponse = await handleRequest(new Request("https://worker.test/usage/vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify([
      { metricName: "TTFB", value: 120, rating: "good", path: "/overview" },
      { metricName: "INVALID", value: -1, path: "bad" },
    ]),
  }), e);
  assert.equal(mixedBatchResponse.status, 202);
  assert.equal(e.DB.webVitalEvents.size, 4);

  const pingDesktop = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      visitorId: "vis_desktop_device_1",
      sessionId: "ses_desk_1",
      eventType: "pageview",
      path: "/combat",
      characterDigest: "cross_device_char_digest_abc",
    }),
  }), e);
  assert.equal(pingDesktop.status, 202);

  const pingMobile = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      visitorId: "vis_mobile_device_2",
      sessionId: "ses_mob_2",
      eventType: "heartbeat",
      path: "/combat",
      characterDigest: "cross_device_char_digest_abc",
    }),
  }), e);
  assert.equal(pingMobile.status, 202);
  // Both pings had distinct visitorIds, but sharing characterDigest deduplicated them to the same visitor row
  assert.equal(e.DB.usageVisitors.size, 1);
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
  resetTelemetryRateLimits();
  const first = await handleRequest(new Request("https://worker.test/usage/ping", requestInit), e);
  const second = await handleRequest(new Request("https://worker.test/usage/ping", requestInit), e);
  assert.equal(first.status, 202);
  assert.equal(second.status, 429);
  assert.equal(e.DB.usageEvents.size, 1);
  assert.equal(e.DB.minuteBudgets.size, 0);
  assert.equal(e.ZENITH_COORDINATOR.gets, 0);
  assert.equal(e.ZENITH_COORDINATOR.puts, 0);
}

{
  const e = env({ USAGE_VITALS_MAX_PER_MINUTE: "1" });
  resetTelemetryRateLimits();
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
  assert.equal(e.DB.minuteBudgets.size, 0);
  assert.equal(e.ZENITH_COORDINATOR.gets, 0);
  assert.equal(e.ZENITH_COORDINATOR.puts, 0);
}

{
  const e = env({ ERROR_REPORT_MAX_PER_MINUTE: "1" });
  resetTelemetryRateLimits();
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
  assert.equal(e.DB.minuteBudgets.size, 0);
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
  assert.equal(body.budgetMode, "github-idle");

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
  let siteverifyCall = null;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
      siteverifyCall = { url, init };
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
    assert.ok(siteverifyCall, "Turnstile siteverify should have been called");
    assert.equal(siteverifyCall.init.method, "POST");
    const formData = siteverifyCall.init.body;
    assert.equal(formData.get("secret"), "turnstile-secret");
    assert.equal(formData.get("response"), "valid-turnstile-token");
    assert.equal(formData.has("remoteip"), false);
    assert.equal(formData.get("remoteip"), null);
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
  assert.equal(body.budgetMode, "github-idle");
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
    assert.equal(typeof body.result.characters[1].draft.importSource.characterHashDigest, "string");
    assert.equal(body.result.characters[1].draft.importSource.characterHashDigest.length, 64);
    assert.equal(body.result.characters[1].draft.levels.combat, 102);
    assert.equal(body.result.characters[1].draft.museum.items[0].name, "Alt Familiar");
    assert.equal(body.result.characters[1].draft.importSource.importedSections.includes("museum"), true);
    assert.equal(body.result.characters[2].draft.name, "DokiDex");
    assert.equal(body.result.characters[2].draft.importSource.characterHashTail, "dokidexhash");
    assert.equal(typeof body.result.characters[2].draft.importSource.characterHashDigest, "string");
    assert.equal(body.result.characters[2].draft.importSource.characterHashDigest.length, 64);
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

{
  const e = env();

  // Seed usage event
  await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "user-agent": "Mozilla/5.0 Chrome/126.0",
      "cf-ipcountry": "US",
    },
    body: JSON.stringify({
      visitorId: "cache-test-visitor-1",
      sessionId: "cache-test-session-1",
      eventType: "pageview",
      path: "/admin",
    }),
  }), e);

  // 1. Initial request: cache MISS
  const res1 = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  assert.equal(res1.status, 200);
  assert.equal(res1.headers.get("x-admin-cache"), "MISS");
  const data1 = await json(res1);
  assert.equal(data1.ok, true);
  assert.equal(typeof data1.generatedAt, "string");
  assert.equal(typeof data1.usage.uniqueUsers30d, "number");
  assert.equal(typeof data1.usage.uniqueUsersAllTime, "number");
  assert.equal(data1.usage.activeUsers15m, 1);
  assert.equal(typeof data1.webVitals.events30d, "number");
  assert.equal(typeof data1.appErrors.events30d, "number");
  assert.equal(Array.isArray(data1.imports.timeframes), true);

  // Seed another usage event
  await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "user-agent": "Mozilla/5.0 Chrome/126.0",
      "cf-ipcountry": "US",
    },
    body: JSON.stringify({
      visitorId: "cache-test-visitor-2",
      sessionId: "cache-test-session-2",
      eventType: "pageview",
      path: "/admin",
    }),
  }), e);

  // 2. Second request within TTL: cache HIT (activeUsers15m is still 1 from cached payload)
  const res2 = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  assert.equal(res2.status, 200);
  assert.equal(res2.headers.get("x-admin-cache"), "HIT");
  const data2 = await json(res2);
  assert.equal(data2.generatedAt, data1.generatedAt);
  assert.equal(data2.usage.activeUsers15m, 1);

  // 3. Third request with ?fresh=true: cache BYPASS (sees new visitor, activeUsers15m is now 2)
  const resFresh = await handleRequest(new Request("https://worker.test/admin/import-health?fresh=true", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  assert.equal(resFresh.status, 200);
  assert.equal(resFresh.headers.get("x-admin-cache"), "BYPASS");
  const dataFresh = await json(resFresh);
  assert.equal(dataFresh.usage.activeUsers15m, 2);

  // 4. Fourth request with cache-control: no-cache: cache BYPASS
  const resNoCache = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: {
      authorization: "Bearer admin-secret",
      "cache-control": "no-cache",
    },
  }), e);
  assert.equal(resNoCache.status, 200);
  assert.equal(resNoCache.headers.get("x-admin-cache"), "BYPASS");

  // 5. Fifth request after cache expiration: cache MISS
  e.__adminHealthCache.expiresAt = Date.now() - 5000;
  const resExpired = await handleRequest(new Request("https://worker.test/admin/import-health", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  assert.equal(resExpired.status, 200);
  assert.equal(resExpired.headers.get("x-admin-cache"), "MISS");
}

{
  // Test Cloudflare Workers Cache API (caches.default) integration and ctx.waitUntil
  const store = new Map();
  const memoryCache = {
    async match(req) {
      const url = typeof req === "string" ? req : req.url;
      const resp = store.get(url);
      return resp ? resp.clone() : null;
    },
    async put(req, resp) {
      const url = typeof req === "string" ? req : req.url;
      store.set(url, resp.clone());
    },
  };
  globalThis.caches = { default: memoryCache };

  try {
    const e = env();
    const waitPromises = [];
    const mockCtx = {
      waitUntil(p) {
        waitPromises.push(p);
      },
    };

    // 1. Initial request with empty caches: MISS and putPromise added to waitUntil
    const res1 = await handleRequest(new Request("https://worker.test/admin/import-health", {
      headers: { authorization: "Bearer admin-secret" },
    }), e, mockCtx);
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get("x-admin-cache"), "MISS");
    assert.equal(waitPromises.length, 1);
    await Promise.all(waitPromises);
    const data1 = await json(res1);
    assert.equal(data1.ok, true);

    // 2. Wipe in-memory cache to force reading exclusively from caches.default
    delete e.__adminHealthCache;

    const res2 = await handleRequest(new Request("https://worker.test/admin/import-health", {
      headers: { authorization: "Bearer admin-secret" },
    }), e, mockCtx);
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get("x-admin-cache"), "HIT");
    const data2 = await json(res2);
    assert.equal(data2.generatedAt, data1.generatedAt);
    // In-memory cache should now be re-populated
    assert.equal(Boolean(e.__adminHealthCache?.payload), true);

    // 3. Bypass via ?fresh=true
    const resFresh = await handleRequest(new Request("https://worker.test/admin/import-health?fresh=true", {
      headers: { authorization: "Bearer admin-secret" },
    }), e, mockCtx);
    assert.equal(resFresh.status, 200);
    assert.equal(resFresh.headers.get("x-admin-cache"), "BYPASS");

    // 4. Stale cache in caches.default is ignored
    delete e.__adminHealthCache;
    const stalePayload = {
      ...data1,
      generatedAt: new Date(Date.now() - 70000).toISOString(),
    };
    await memoryCache.put(
      new Request("https://worker.test/admin/import-health"),
      new Response(JSON.stringify(stalePayload), {
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );
    const resStale = await handleRequest(new Request("https://worker.test/admin/import-health", {
      headers: { authorization: "Bearer admin-secret" },
    }), e, mockCtx);
    // 5. Failing caches.default.put does not crash or throw unhandled rejection in waitUntil
    memoryCache.put = async () => { throw new Error("cache quota exceeded"); };
    const resPutErr = await handleRequest(new Request("https://worker.test/admin/import-health?fresh=true", {
      headers: { authorization: "Bearer admin-secret" },
    }), e, mockCtx);
    assert.equal(resPutErr.status, 200);
    // Ensure all wait promises resolve cleanly without throwing
    await Promise.all(waitPromises);
  } finally {
    delete globalThis.caches;
  }
}

{
  // 1. Concurrent admission while running: queue.running >= maxConcurrent must NOT block admission when pending < maxPending,
  // but queue.pending >= maxPending MUST block admission with 429 queue_busy.
  const e = env({ IMPORT_MAX_CONCURRENT: "1", IMPORT_MAX_PENDING: "2" });
  const first = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.81",
    },
    body: JSON.stringify({ characterHash: "FixtureHashRunning01" }),
  }), e);
  const firstBody = await json(first);
  assert.equal(first.status, 202);

  // Transition first job to running (so queue.running = 1 >= maxConcurrent)
  e.DB.jobs.get(firstBody.jobId).status = "running";

  // Second job must be admitted as queued (pending = 1 < maxPending = 2)
  const second = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.82",
    },
    body: JSON.stringify({ characterHash: "FixtureHashRunning02" }),
  }), e);
  const secondBody = await json(second);
  assert.equal(second.status, 202);
  assert.equal(secondBody.status, "queued");
  assert.equal(e.DB.jobs.get(secondBody.jobId).status, "queued");

  // Third job must be admitted as queued (pending = 2 = maxPending = 2)
  const third = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.83",
    },
    body: JSON.stringify({ characterHash: "FixtureHashRunning03" }),
  }), e);
  const thirdBody = await json(third);
  assert.equal(third.status, 202);
  assert.equal(thirdBody.status, "queued");

  // Fourth job must be rejected with 429 queue_busy because pending (2) >= maxPending (2)
  const fourth = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.84",
    },
    body: JSON.stringify({ characterHash: "FixtureHashRunning04" }),
  }), e);
  assert.equal(fourth.status, 429);
  const fourthBody = await json(fourth);
  assert.equal(fourthBody.error.code, "queue_busy");
}

{
  // 2. In-flight duplicate protection: returns 202 with existing jobId, status, pollAfterMs, and does not insert duplicate
  const e = env();

  const first = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.91",
    },
    body: JSON.stringify({ characterHash: "FixtureHashDupe001" }),
  }), e);
  const firstBody = await json(first);
  assert.equal(first.status, 202);
  const initialJobCount = e.DB.jobs.size;

  // Duplicate request while job is queued (with mockCtx triggering dispatch)
  let dupeDispatched = false;
  const mockCtx = {
    waitUntil(promise) {
      dupeDispatched = true;
      assert.ok(promise instanceof Promise);
    },
  };
  const duplicateQueued = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.92",
    },
    body: JSON.stringify({ characterHash: "FixtureHashDupe001" }),
  }), e, mockCtx);
  const dupeQueuedBody = await json(duplicateQueued);
  assert.equal(duplicateQueued.status, 202);
  assert.equal(dupeQueuedBody.jobId, firstBody.jobId);
  assert.equal(dupeQueuedBody.status, "queued");
  assert.equal(typeof dupeQueuedBody.pollAfterMs, "number");
  assert.equal(e.DB.jobs.size, initialJobCount);
  assert.equal(dupeDispatched, true);

  // Duplicate request while job is running
  e.DB.jobs.get(firstBody.jobId).status = "running";
  const duplicateRunning = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.93",
    },
    body: JSON.stringify({ characterHash: "FixtureHashDupe001" }),
  }), e);
  const dupeRunningBody = await json(duplicateRunning);
  assert.equal(duplicateRunning.status, 202);
  assert.equal(dupeRunningBody.jobId, firstBody.jobId);
  assert.equal(dupeRunningBody.status, "running");
  assert.equal(typeof dupeRunningBody.pollAfterMs, "number");
  assert.equal(e.DB.jobs.size, initialJobCount);

  // Duplicate request while job is waiting_for_budget
  e.DB.jobs.get(firstBody.jobId).status = "waiting_for_budget";
  const duplicateBudget = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.94",
    },
    body: JSON.stringify({ characterHash: "FixtureHashDupe001" }),
  }), e);
  const dupeBudgetBody = await json(duplicateBudget);
  assert.equal(duplicateBudget.status, 202);
  assert.equal(dupeBudgetBody.jobId, firstBody.jobId);
  assert.equal(dupeBudgetBody.status, "waiting_for_budget");
  assert.equal(typeof dupeBudgetBody.pollAfterMs, "number");
  assert.equal(e.DB.jobs.size, initialJobCount);
}

{
  // 3. Stale zombie job reaping: running jobs older than 3m are transitioned to failed with error_code 'timeout',
  // while active running jobs (< 3m old) are preserved.
  const e = env();
  const zombieJobId = "imp_zombie000000000000000000000001";
  const staleTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  e.DB.jobs.set(zombieJobId, {
    id: zombieJobId,
    status: "running",
    target_hash_encrypted: "test_enc",
    target_hash_fingerprint: "zombie_fp",
    requester_fingerprint: "zombie_req",
    requested_options_json: "{}",
    budget_mode: "unknown",
    created_at: staleTime,
    updated_at: staleTime,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    request_count: 0,
    retry_count: 0,
  });

  const activeRunningJobId = "imp_activerun000000000000000001";
  const freshTime = new Date(Date.now() - 30 * 1000).toISOString();
  e.DB.jobs.set(activeRunningJobId, {
    id: activeRunningJobId,
    status: "running",
    target_hash_encrypted: "test_enc2",
    target_hash_fingerprint: "active_fp",
    requester_fingerprint: "active_req",
    requested_options_json: "{}",
    budget_mode: "unknown",
    created_at: freshTime,
    updated_at: freshTime,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    request_count: 1,
    retry_count: 0,
  });

  // Execute processNextImportJob - zombie should be reaped, active job preserved, returns busy because active job is running
  const busyResult = await processNextImportJob(e);
  assert.equal(busyResult.status, "busy");
  assert.equal(busyResult.activeJobId, activeRunningJobId);

  // Verify zombie reaped to failed with 'timeout'
  const reapedZombie = e.DB.jobs.get(zombieJobId);
  assert.equal(reapedZombie.status, "failed");
  assert.equal(reapedZombie.error_code, "timeout");

  // Verify active running job was NOT reaped
  const activeJob = e.DB.jobs.get(activeRunningJobId);
  assert.equal(activeJob.status, "running");

  // Complete active job
  activeJob.status = "complete";

  // Now queue a new job
  const queued = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.101",
    },
    body: JSON.stringify({ characterHash: "FixtureHashReap0001" }),
  }), e);
  const queuedBody = await json(queued);
  assert.equal(queued.status, 202);

  // Trigger process-next with mock fetch so the queued job processes cleanly
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    character: {
      name: "Reap Chef",
      class: "CHEF",
      total_level: 100,
      stats: { combat: { level: 1 } },
    },
  });
  try {
    const process = await handleRequest(new Request("https://worker.test/internal/process-next", {
      method: "POST",
      headers: { authorization: "Bearer coordinator-secret" },
    }), e);
    assert.equal(process.status, 200);

    const queuedJob = e.DB.jobs.get(queuedBody.jobId);
    assert.equal(queuedJob.status, "complete");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

{
  // 4. Rate limit retry cap: transitions from retrying (waiting_for_budget) to failed (rate_limit_exhausted)
  // when exceeding MAX_IMPORT_RETRIES (3), and sets global cooldown on 429.
  const e = env();
  const start = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.125",
    },
    body: JSON.stringify({ characterHash: "FixtureHashRetry0001" }),
  }), e);
  const startBody = await json(start);
  assert.equal(start.status, 202);

  const retryJobId = startBody.jobId;
  const job = e.DB.jobs.get(retryJobId);
  job.retry_count = 2; // Retried twice so far (< MAX_IMPORT_RETRIES = 3)
  job.status = "waiting_for_budget";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 429 });
  try {
    // Attempt 3 (retry_count 2 -> 3): must transition to waiting_for_budget and increment retry_count to 3
    const process1 = await handleRequest(new Request("https://worker.test/internal/process-next", {
      method: "POST",
      headers: { authorization: "Bearer coordinator-secret" },
    }), e);
    assert.equal(process1.status, 200);
    const body1 = await json(process1);
    assert.equal(body1.result.status, "waiting_for_budget");
    assert.equal(job.retry_count, 3);
    assert.equal(job.status, "waiting_for_budget");

    // Clear global cooldown so we can trigger the next retry immediately
    e.DB.cooldowns.clear();

    // Attempt 4 (retry_count 3 >= MAX_IMPORT_RETRIES = 3): must fail permanently with rate_limit_exhausted
    const process2 = await handleRequest(new Request("https://worker.test/internal/process-next", {
      method: "POST",
      headers: { authorization: "Bearer coordinator-secret" },
    }), e);
    assert.equal(process2.status, 200);
    const body2 = await json(process2);
    assert.equal(body2.result.status, "failed");
    assert.equal(body2.result.code, "rate_limit_exhausted");

    const failedJob = e.DB.jobs.get(retryJobId);
    assert.equal(failedJob.status, "failed");
    assert.equal(failedJob.error_code, "rate_limit_exhausted");

    // Verify global cooldown was set even when retries were exhausted
    const globalCooldown = await e.DB.prepare(`
      SELECT until_at FROM cooldowns WHERE scope = ? AND key_fingerprint = ? AND until_at > ?
    `).bind("global", "global", new Date().toISOString()).first();
    assert.ok(globalCooldown);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

{
  // 5. Immediate dispatch: ctx.waitUntil is called when starting an import
  const e = env();
  let dispatched = false;
  const mockCtx = {
    waitUntil(promise) {
      dispatched = true;
      assert.ok(promise instanceof Promise);
    },
  };

  const start = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.111",
    },
    body: JSON.stringify({ characterHash: "FixtureHashDispatch1" }),
  }), e, mockCtx);

  assert.equal(start.status, 202);
  assert.equal(dispatched, true);
}

{
  // 6. Atomic claim: changes count prevents concurrent claims and handles race conditions safely
  const e = env();
  const jobId = "imp_atomic000000000000000000000001";
  const nowIso = new Date().toISOString();
  e.DB.jobs.set(jobId, {
    id: jobId,
    status: "queued",
    target_hash_encrypted: "enc",
    target_hash_fingerprint: "atomic_fp",
    requester_fingerprint: "atomic_req",
    requested_options_json: "{}",
    budget_mode: "unknown",
    created_at: nowIso,
    updated_at: nowIso,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    request_count: 0,
    retry_count: 0,
  });

  const res1 = await e.DB.prepare(`
    UPDATE import_jobs
    SET status = 'running', budget_mode = ?, updated_at = ?
    WHERE id = ? AND status IN ('queued', 'waiting_for_budget')
  `).bind("normal", nowIso, jobId).run();
  assert.equal(res1.meta.changes, 1);
  assert.equal(res1.changes, 1);

  // Second claim fails because status is already 'running'
  const res2 = await e.DB.prepare(`
    UPDATE import_jobs
    SET status = 'running', budget_mode = ?, updated_at = ?
    WHERE id = ? AND status IN ('queued', 'waiting_for_budget')
  `).bind("normal", nowIso, jobId).run();
  assert.equal(res2.meta.changes, 0);
  assert.equal(res2.changes, 0);

  // Verify processNextImportJob handles claim collision (changes === 0) by returning { status: 'busy' }
  const raceJobId = "imp_atomic000000000000000000000002";
  e.DB.jobs.set(raceJobId, {
    id: raceJobId,
    status: "queued",
    target_hash_encrypted: "enc2",
    target_hash_fingerprint: "atomic_fp2",
    requester_fingerprint: "atomic_req2",
    requested_options_json: "{}",
    budget_mode: "unknown",
    created_at: nowIso,
    updated_at: nowIso,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    request_count: 0,
    retry_count: 0,
  });

  // Mark first job as complete so there is no currently running job blocking claims
  e.DB.jobs.get(jobId).status = "complete";

  // Temporarily simulate another worker winning the race for the UPDATE claim
  const origRun = e.DB.run.bind(e.DB);
  let raceSimulated = false;
  e.DB.run = async (sql, args) => {
    if (sql.includes("UPDATE import_jobs") && sql.includes("SET status = 'running'")) {
      raceSimulated = true;
      return { success: true, changes: 0, meta: { changes: 0 } };
    }
    return origRun(sql, args);
  };
  const busyResult = await processNextImportJob(e);
  assert.equal(raceSimulated, true);
  assert.equal(busyResult.status, "busy");
  assert.equal(typeof busyResult.pollAfterMs, "number");
  e.DB.run = origRun;
}

{
  // 7. Completed job preserves prior retry_count in DB
  const e = env();
  const start = await handleRequest(new Request("https://worker.test/profile-import/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://zenith.example",
      "cf-connecting-ip": "203.0.113.131",
    },
    body: JSON.stringify({ characterHash: "FixtureHashRetried1" }),
  }), e);
  const startBody = await json(start);
  assert.equal(start.status, 202);

  const retriedJobId = startBody.jobId;
  const job = e.DB.jobs.get(retriedJobId);
  job.retry_count = 2; // Had 2 previous retries

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    character: {
      name: "Retried Hero",
      class: "WARRIOR",
      total_level: 50,
      stats: { combat: { level: 25 } },
    },
  });
  try {
    const res = await processNextImportJob(e);
    assert.equal(res.status, "complete");
    const completedJob = e.DB.jobs.get(retriedJobId);
    assert.equal(completedJob.status, "complete");
    assert.equal(completedJob.retry_count, 2); // Must NOT be overwritten to 0
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ============================================================================
// Unit Tests: Constant-Time Secret Token Verification (timingSafeEqualString & hasBearerSecret)
// ============================================================================
{
  // timingSafeEqualString
  assert.equal(await timingSafeEqualString("secret", "secret"), true);
  assert.equal(await timingSafeEqualString("very-long-secret-key-1234567890", "very-long-secret-key-1234567890"), true);
  assert.equal(await timingSafeEqualString("", ""), true);
  assert.equal(await timingSafeEqualString("secret1", "secret2"), false);
  assert.equal(await timingSafeEqualString("short", "longer-string"), false);
  assert.equal(await timingSafeEqualString("", "not-empty"), false);
  assert.equal(await timingSafeEqualString("not-empty", ""), false);
  assert.equal(await timingSafeEqualString(null, "secret"), false);
  assert.equal(await timingSafeEqualString("secret", null), false);
  assert.equal(await timingSafeEqualString(undefined, undefined), false);
  assert.equal(await timingSafeEqualString(12345, "12345"), false);

  assert.equal(await timingSafeEqualString("token-with-🔑", "token-with-🔑"), true);
  assert.equal(await timingSafeEqualString("token-with-🔑", "token-with-🔒"), false);
  assert.equal(await timingSafeEqualString("a".repeat(1024), "a".repeat(1024)), true);
  assert.equal(await timingSafeEqualString("a".repeat(1024), "a".repeat(1023) + "b"), false);

  // hasBearerSecret
  const reqWithAuth = (token) => new Request("https://worker.test/protected", {
    headers: token !== null ? { authorization: token } : {},
  });

  assert.equal(await hasBearerSecret(reqWithAuth("Bearer correct-secret"), "correct-secret"), true);
  assert.equal(await hasBearerSecret(reqWithAuth("Bearer correct-secret"), "  correct-secret  "), true);
  assert.equal(await hasBearerSecret(reqWithAuth("Bearer wrong-secret"), "correct-secret"), false);
  assert.equal(await timingSafeEqualString("Bearer correct-secret", "Bearer correct-secret-tampered"), false);
  assert.equal(await hasBearerSecret(reqWithAuth("Basic correct-secret"), "correct-secret"), false);
  assert.equal(await hasBearerSecret(reqWithAuth("correct-secret"), "correct-secret"), false);
  assert.equal(await hasBearerSecret(reqWithAuth(""), "correct-secret"), false);
  assert.equal(await hasBearerSecret(reqWithAuth(null), "correct-secret"), false);
  assert.equal(await hasBearerSecret(reqWithAuth("Bearer "), "correct-secret"), false);
  assert.equal(await hasBearerSecret(reqWithAuth("Bearer correct-secret"), ""), false);
  assert.equal(await hasBearerSecret(reqWithAuth("Bearer correct-secret"), null), false);
  assert.equal(await hasBearerSecret(null, "correct-secret"), false);

  // Plain object headers support
  assert.equal(await hasBearerSecret({ headers: { authorization: "Bearer plain-secret" } }, "plain-secret"), true);
  assert.equal(await hasBearerSecret({ headers: { authorization: "Bearer wrong-secret" } }, "plain-secret"), false);
}

// ============================================================================
// Unit Tests: isExpiredIso date parsing robustness
// ============================================================================
{
  assert.equal(isExpiredIso(null), true);
  assert.equal(isExpiredIso(undefined), true);
  assert.equal(isExpiredIso(""), true);
  assert.equal(isExpiredIso("invalid-date-string"), true);
  assert.equal(isExpiredIso("not-a-date"), true);
  assert.equal(isExpiredIso(new Date(Date.now() - 60000).toISOString()), true);
  assert.equal(isExpiredIso(new Date(Date.now() + 60000).toISOString()), false);
}

// ============================================================================
// Unit Tests: Turnstile siteverify payload structure & remoteip exclusion
// ============================================================================
{
  const originalFetch = globalThis.fetch;
  let siteverifyCalls = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
      siteverifyCalls.push({ url: String(url), init });
      return Response.json({ success: true });
    }
    return new Response("{}", { status: 404 });
  };

  try {
    const dummyEnv = { TURNSTILE_SECRET_KEY: "my-turnstile-secret" };
    const dummyReq = new Request("https://worker.test/verify", {
      headers: { "cf-connecting-ip": "198.51.100.42" },
    });

    const res = await verifyTurnstile(dummyEnv, "client-cf-turnstile-token", dummyReq);
    assert.equal(res.ok, true);
    assert.equal(siteverifyCalls.length, 1);
    const call = siteverifyCalls[0];
    assert.equal(call.init.method, "POST");
    const fd = call.init.body;
    assert.equal(fd.get("secret"), "my-turnstile-secret");
    assert.equal(fd.get("response"), "client-cf-turnstile-token");
    // Explicitly verify remoteip is omitted to prevent Vercel proxy datacenter IP mismatches
    assert.equal(fd.has("remoteip"), false);
    assert.equal(fd.get("remoteip"), null);

    // Rejection on invalid token without making network request
    const invalidTokenRes = await verifyTurnstile(dummyEnv, "", dummyReq);
    assert.equal(invalidTokenRes.ok, false);
    assert.equal(siteverifyCalls.length, 1); // No new network call
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ============================================================================
// Unit Tests: Coordinator "Unknown" Mode Slowdown Elimination (importBudgetMode)
// ============================================================================
{
  const e = env();

  // 1. When coordinator KV is completely empty, must safely default to "github-idle"
  const emptyBudget = await importBudgetMode(e);
  assert.equal(emptyBudget.mode, "github-idle");
  assert.equal(emptyBudget.requestsPerMinute, 35);
  assert.equal(emptyBudget.pollAfterMs, 2000);

  // 2. When coordinator KV has an active unexpired scraper run, throttle to "github-active"
  await e.ZENITH_COORDINATOR.put("idlemmo-api-job:github-actions:update_data", JSON.stringify({
    source: "github-actions",
    active: true,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }));
  const activeBudget = await importBudgetMode(e);
  assert.equal(activeBudget.mode, "github-active");
  assert.equal(activeBudget.requestsPerMinute, 6);
  assert.equal(activeBudget.pollAfterMs, 10000);

  // 3. When coordinator KV has an active but EXPIRED scraper run, must default to "github-idle"
  await e.ZENITH_COORDINATOR.put("idlemmo-api-job:github-actions:update_data", JSON.stringify({
    source: "github-actions",
    active: true,
    expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
  }));
  const expiredBudget = await importBudgetMode(e);
  assert.equal(expiredBudget.mode, "github-idle");
  assert.equal(expiredBudget.requestsPerMinute, 35);
  assert.equal(expiredBudget.pollAfterMs, 2000);

  // 4. When coordinator KV has an inactive scraper run, must default to "github-idle"
  await e.ZENITH_COORDINATOR.put("idlemmo-api-job:github-actions:update_data", JSON.stringify({
    source: "github-actions",
    active: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }));
  const inactiveBudget = await importBudgetMode(e);
  assert.equal(inactiveBudget.mode, "github-idle");
  assert.equal(inactiveBudget.requestsPerMinute, 35);
  assert.equal(inactiveBudget.pollAfterMs, 2000);

  // 5. When coordinator KV has an active run but with corrupted/invalid expiresAt date, must default to "github-idle"
  await e.ZENITH_COORDINATOR.put("idlemmo-api-job:github-actions:update_data", JSON.stringify({
    source: "github-actions",
    active: true,
    expiresAt: "corrupted-non-iso-date",
  }));
  const corruptedDateBudget = await importBudgetMode(e);
  assert.equal(corruptedDateBudget.mode, "github-idle");
  assert.equal(corruptedDateBudget.requestsPerMinute, 35);
  assert.equal(corruptedDateBudget.pollAfterMs, 2000);

  // 6. When coordinator binding is missing (empty env object), must safely default to "github-idle" without throwing
  const missingKvBudget = await importBudgetMode({});
  assert.equal(missingKvBudget.mode, "github-idle");
  assert.equal(missingKvBudget.requestsPerMinute, 35);
  assert.equal(missingKvBudget.pollAfterMs, 2000);
}

// ============================================================================
// Unit Tests: Constant-Time Bearer Auth Enforcement Across All Endpoints
// ============================================================================
{
  const e = env();

  // /internal/process-next
  const procUnauthorized = await handleRequest(new Request("https://worker.test/internal/process-next", {
    method: "POST",
    headers: { authorization: "Bearer wrong-secret" },
  }), e);
  assert.equal(procUnauthorized.status, 401);

  // /admin/import-health
  const adminUnauthorized = await handleRequest(new Request("https://worker.test/admin/import-health", {
    method: "GET",
    headers: { authorization: "Bearer wrong-admin-secret" },
  }), e);
  assert.equal(adminUnauthorized.status, 401);

  // /usage/ping
  const pingUnauthorized = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      origin: "https://zenith.example",
      authorization: "Bearer wrong-usage-secret",
    },
    body: JSON.stringify({ visitorId: "v1", sessionId: "s1", path: "/test" }),
  }), e);
  assert.equal(pingUnauthorized.status, 401);

  // /usage/vitals
  const vitalsUnauthorized = await handleRequest(new Request("https://worker.test/usage/vitals", {
    method: "POST",
    headers: {
      origin: "https://zenith.example",
      authorization: "Bearer wrong-usage-secret",
    },
    body: JSON.stringify({ name: "FCP", value: 100, path: "/test" }),
  }), e);
  assert.equal(vitalsUnauthorized.status, 401);

  // /error/report
  const errUnauthorized = await handleRequest(new Request("https://worker.test/error/report", {
    method: "POST",
    headers: {
      origin: "https://zenith.example",
      authorization: "Bearer wrong-error-secret",
    },
    body: JSON.stringify({ path: "/test" }),
  }), e);
  assert.equal(errUnauthorized.status, 401);

  // /internal/scraper-status
  const scraperUnauthorized = await handleRequest(new Request("https://worker.test/internal/scraper-status", {
    method: "POST",
    headers: { authorization: "Bearer wrong-coordinator-secret" },
    body: JSON.stringify({ status: "started", source: "test", runId: "r1" }),
  }), e);
  assert.equal(scraperUnauthorized.status, 401);

  const scraperAuthorized = await handleRequest(new Request("https://worker.test/internal/scraper-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer coordinator-secret",
    },
    body: JSON.stringify({ status: "started", source: "test", runId: "r1" }),
  }), e);
  assert.equal(scraperAuthorized.status, 200);
}

{
  // Status endpoint cache headers test:
  // In-progress: queued, running, waiting_for_budget -> "no-store"
  // Terminal: complete (done), failed (error), expired (410) -> "public, max-age=15, s-maxage=30, stale-while-revalidate=60"
  // Not found: 404 -> "public, max-age=5, s-maxage=10"
  const e = env();
  const now = Date.now();
  const validExpiry = new Date(now + 60 * 60 * 1000).toISOString();
  const pastExpiry = new Date(now - 10 * 1000).toISOString();

  // 1. Queued job -> in-progress no-store
  e.DB.jobs.set("imp_cache_test_queued_0000001", {
    id: "imp_cache_test_queued_0000001",
    status: "queued",
    target_hash_fingerprint: "hash-q",
    requester_fingerprint: "user-q",
    request_count: 0,
    retry_count: 0,
    budget_mode: "normal",
    created_at: new Date(now - 1000).toISOString(),
    updated_at: new Date(now - 1000).toISOString(),
    expires_at: validExpiry,
  });
  const resQueued = await handleRequest(new Request("https://worker.test/profile-import/status/imp_cache_test_queued_0000001"), e);
  assert.equal(resQueued.status, 200);
  assert.equal((await json(resQueued)).status, "queued");
  assert.equal(resQueued.headers.get("cache-control"), "no-store");

  // 2. Running job -> in-progress no-store
  e.DB.jobs.set("imp_cache_test_running_000001", {
    id: "imp_cache_test_running_000001",
    status: "running",
    target_hash_fingerprint: "hash-r",
    requester_fingerprint: "user-r",
    request_count: 5,
    retry_count: 0,
    budget_mode: "normal",
    created_at: new Date(now - 5000).toISOString(),
    updated_at: new Date(now - 1000).toISOString(),
    expires_at: validExpiry,
  });
  const resRunning = await handleRequest(new Request("https://worker.test/profile-import/status/imp_cache_test_running_000001"), e);
  assert.equal(resRunning.status, 200);
  assert.equal((await json(resRunning)).status, "running");
  assert.equal(resRunning.headers.get("cache-control"), "no-store");

  // 3. Waiting for budget job -> in-progress no-store
  e.DB.jobs.set("imp_cache_test_waiting_000001", {
    id: "imp_cache_test_waiting_000001",
    status: "waiting_for_budget",
    target_hash_fingerprint: "hash-w",
    requester_fingerprint: "user-w",
    request_count: 2,
    retry_count: 1,
    budget_mode: "normal",
    created_at: new Date(now - 5000).toISOString(),
    updated_at: new Date(now - 1000).toISOString(),
    expires_at: validExpiry,
  });
  const resWaiting = await handleRequest(new Request("https://worker.test/profile-import/status/imp_cache_test_waiting_000001"), e);
  assert.equal(resWaiting.status, 200);
  assert.equal((await json(resWaiting)).status, "waiting_for_budget");
  assert.equal(resWaiting.headers.get("cache-control"), "no-store");

  // 4. Completed job (done) -> Terminal public cache-control
  e.DB.jobs.set("imp_cache_test_complete_00001", {
    id: "imp_cache_test_complete_00001",
    status: "complete",
    result_json: JSON.stringify({ characters: [{ name: "Hero" }] }),
    target_hash_fingerprint: "hash-c",
    requester_fingerprint: "user-c",
    request_count: 10,
    retry_count: 0,
    budget_mode: "normal",
    created_at: new Date(now - 10000).toISOString(),
    updated_at: new Date(now - 1000).toISOString(),
    expires_at: validExpiry,
  });
  const resDone = await handleRequest(new Request("https://worker.test/profile-import/status/imp_cache_test_complete_00001"), e);
  assert.equal(resDone.status, 200);
  assert.equal((await json(resDone)).status, "done");
  assert.equal(resDone.headers.get("cache-control"), TERMINAL_STATUS_CACHE_CONTROL);

  // 5. Failed job (error) -> Terminal public cache-control
  e.DB.jobs.set("imp_cache_test_failed_0000001", {
    id: "imp_cache_test_failed_0000001",
    status: "failed",
    error_code: "upstream_error",
    error_message: "Upstream service error.",
    target_hash_fingerprint: "hash-f",
    requester_fingerprint: "user-f",
    request_count: 3,
    retry_count: 2,
    budget_mode: "normal",
    created_at: new Date(now - 10000).toISOString(),
    updated_at: new Date(now - 1000).toISOString(),
    expires_at: validExpiry,
  });
  const resError = await handleRequest(new Request("https://worker.test/profile-import/status/imp_cache_test_failed_0000001"), e);
  assert.equal(resError.status, 200);
  assert.equal((await json(resError)).status, "error");
  assert.equal(resError.headers.get("cache-control"), TERMINAL_STATUS_CACHE_CONTROL);

  // 6. Expired job -> Terminal public cache-control and 410 status
  e.DB.jobs.set("imp_cache_test_expired_000001", {
    id: "imp_cache_test_expired_000001",
    status: "queued",
    target_hash_fingerprint: "hash-e",
    requester_fingerprint: "user-e",
    request_count: 0,
    retry_count: 0,
    budget_mode: "normal",
    created_at: new Date(now - 70 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 70 * 60 * 1000).toISOString(),
    expires_at: pastExpiry,
  });
  const resExpired = await handleRequest(new Request("https://worker.test/profile-import/status/imp_cache_test_expired_000001"), e);
  assert.equal(resExpired.status, 410);
  assert.equal((await json(resExpired)).status, "expired");
  assert.equal(resExpired.headers.get("cache-control"), TERMINAL_STATUS_CACHE_CONTROL);

  // 7. Not found job (404 valid pattern)
  const resNotFoundValidPattern = await handleRequest(new Request("https://worker.test/profile-import/status/imp_nonexistent_job_00000001"), e);
  assert.equal(resNotFoundValidPattern.status, 404);
  assert.equal(resNotFoundValidPattern.headers.get("cache-control"), NOT_FOUND_STATUS_CACHE_CONTROL);

  // 8. Not found job (404 invalid pattern)
  const resNotFoundInvalid = await handleRequest(new Request("https://worker.test/profile-import/status/invalid_id"), e);
  assert.equal(resNotFoundInvalid.status, 404);
  assert.equal(resNotFoundInvalid.headers.get("cache-control"), NOT_FOUND_STATUS_CACHE_CONTROL);
}

{
  // Status endpoint rate limiting test
  const e = env({ IMPORT_STATUS_MAX_PER_MINUTE: "2" });
  const now = Date.now();
  const validExpiry = new Date(now + 60 * 60 * 1000).toISOString();

  e.DB.jobs.set("imp_ratelimit_status_00000001", {
    id: "imp_ratelimit_status_00000001",
    status: "queued",
    target_hash_fingerprint: "hash-rl",
    requester_fingerprint: "user-rl",
    request_count: 0,
    retry_count: 0,
    budget_mode: "normal",
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
    expires_at: validExpiry,
  });

  const ipAHeaders = { "cf-connecting-ip": "203.0.113.88" };
  const req1 = await handleRequest(new Request("https://worker.test/profile-import/status/imp_ratelimit_status_00000001", {
    headers: ipAHeaders,
  }), e);
  assert.equal(req1.status, 200);

  const req2 = await handleRequest(new Request("https://worker.test/profile-import/status/imp_ratelimit_status_00000001", {
    headers: ipAHeaders,
  }), e);
  assert.equal(req2.status, 200);

  // 3rd request from same IP exceeds limit (max 2) -> 429
  const req3 = await handleRequest(new Request("https://worker.test/profile-import/status/imp_ratelimit_status_00000001", {
    headers: ipAHeaders,
  }), e);
  assert.equal(req3.status, 429);
  const body3 = await json(req3);
  assert.equal(body3.error?.code, "rate_limited");
  assert.equal(body3.error?.message, "Too many status requests. Please slow down.");
  assert.equal(req3.headers.get("cache-control"), "no-store");
  const retryAfter = Number(req3.headers.get("retry-after"));
  assert.equal(Number.isInteger(retryAfter) && retryAfter >= 1 && retryAfter <= 60, true);

  // Different IP is not blocked by IP A's rate limit
  const reqOtherIp = await handleRequest(new Request("https://worker.test/profile-import/status/imp_ratelimit_status_00000001", {
    headers: { "cf-connecting-ip": "203.0.113.89" },
  }), e);
  assert.equal(reqOtherIp.status, 200);

  // Rate limiting with x-forwarded-for when sent from a trusted proxy
  const trustedProxyHeaders = {
    "x-forwarded-for": "198.51.100.12",
    authorization: "Bearer coordinator-secret",
  };
  const xffReq1 = await handleRequest(new Request("https://worker.test/profile-import/status/imp_ratelimit_status_00000001", {
    headers: trustedProxyHeaders,
  }), e);
  assert.equal(xffReq1.status, 200);

  const xffReq2 = await handleRequest(new Request("https://worker.test/profile-import/status/imp_ratelimit_status_00000001", {
    headers: trustedProxyHeaders,
  }), e);
  assert.equal(xffReq2.status, 200);

  const xffReq3 = await handleRequest(new Request("https://worker.test/profile-import/status/imp_ratelimit_status_00000001", {
    headers: trustedProxyHeaders,
  }), e);
  assert.equal(xffReq3.status, 429);
  const xffBody3 = await json(xffReq3);
  assert.equal(xffBody3.error?.code, "rate_limited");
}

// ============================================================================
// Unit Tests: Proxy Client IP Resolution & Validation (isValidIp & requesterKey)
// ============================================================================
{
  // isValidIp IPv4
  assert.equal(isValidIp("127.0.0.1"), true);
  assert.equal(isValidIp("198.51.100.42"), true);
  assert.equal(isValidIp("0.0.0.0"), true);
  assert.equal(isValidIp("255.255.255.255"), true);
  assert.equal(isValidIp("256.0.0.1"), false);
  assert.equal(isValidIp("1.2.3.4.5"), false);
  assert.equal(isValidIp("1.2.3"), false);
  assert.equal(isValidIp("not-an-ip"), false);
  assert.equal(isValidIp(""), false);
  assert.equal(isValidIp(null), false);
  assert.equal(isValidIp(undefined), false);

  // isValidIp IPv6
  assert.equal(isValidIp("::1"), true);
  assert.equal(isValidIp("::"), true);
  assert.equal(isValidIp("2001:db8::1"), true);
  assert.equal(isValidIp("fe80::1"), true);
  assert.equal(isValidIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334"), true);
  assert.equal(isValidIp("::ffff:192.0.2.128"), true);
  assert.equal(isValidIp("12345::1"), false);
  assert.equal(isValidIp(":::"), false);
  assert.equal(isValidIp("2001:db8:::1"), false);

  // requesterKey with trusted proxy (isTrustedProxy = true)
  const trustedWithXff = new Request("https://worker.test/", {
    headers: {
      "x-forwarded-for": "198.51.100.42, 10.0.0.1",
      "cf-connecting-ip": "203.0.113.1",
    },
  });
  assert.equal(requesterKey(trustedWithXff, true), "198.51.100.42");

  const trustedWithIpv6 = new Request("https://worker.test/", {
    headers: {
      "x-forwarded-for": "2001:db8::8a2e:370:7334",
      "cf-connecting-ip": "203.0.113.1",
    },
  });
  assert.equal(requesterKey(trustedWithIpv6, true), "2001:db8::8a2e:370:7334");

  // Invalid XFF falls back to valid cf-connecting-ip
  const trustedInvalidXff = new Request("https://worker.test/", {
    headers: {
      "x-forwarded-for": "malicious-header-injection",
      "cf-connecting-ip": "203.0.113.5",
    },
  });
  assert.equal(requesterKey(trustedInvalidXff, true), "203.0.113.5");

  // Missing XFF falls back to cf-connecting-ip
  const trustedNoXff = new Request("https://worker.test/", {
    headers: {
      "cf-connecting-ip": "203.0.113.6",
    },
  });
  assert.equal(requesterKey(trustedNoXff, true), "203.0.113.6");

  // requesterKey with untrusted/public client (isTrustedProxy = false)
  // Strictly ignores x-forwarded-for and uses cf-connecting-ip
  const untrustedWithSpoofedXff = new Request("https://worker.test/", {
    headers: {
      "x-forwarded-for": "1.2.3.4",
      "cf-connecting-ip": "203.0.113.50",
    },
  });
  assert.equal(requesterKey(untrustedWithSpoofedXff, false), "203.0.113.50");

  // Untrusted request without cf-connecting-ip must return "unknown-requester"
  const untrustedNoCf = new Request("https://worker.test/", {
    headers: {
      "x-forwarded-for": "1.2.3.4",
    },
  });
  assert.equal(requesterKey(untrustedNoCf, false), "unknown-requester");

  // IPv6 with brackets stripped
  const trustedBracketedIpv6 = new Request("https://worker.test/", {
    headers: {
      "x-forwarded-for": "[2001:db8::1]",
      "cf-connecting-ip": "203.0.113.1",
    },
  });
  assert.equal(requesterKey(trustedBracketedIpv6, true), "2001:db8::1");

  // Invalid IPv4/IPv6 edge cases rejected
  assert.equal(isValidIp("192.168.01.1"), false);
  assert.equal(isValidIp("fe80::1%eth0"), false);
  assert.equal(isValidIp("198.51.100.1:8080"), false);

  // isTrustedProxyRequest helper
  const e = env();
  assert.equal(await isTrustedProxyRequest(new Request("https://worker.test/", {
    headers: { authorization: "Bearer usage-secret" },
  }), e), true);
  assert.equal(await isTrustedProxyRequest(new Request("https://worker.test/", {
    headers: { authorization: "Bearer coordinator-secret" },
  }), e), true);
  assert.equal(await isTrustedProxyRequest(new Request("https://worker.test/", {
    headers: { authorization: "Bearer wrong-secret" },
  }), e), false);
  assert.equal(await isTrustedProxyRequest(new Request("https://worker.test/", {
    headers: { authorization: "Basic some-token" },
  }), e), false);
  assert.equal(await isTrustedProxyRequest(new Request("https://worker.test/"), e), false);
}

// ============================================================================
// Unit Tests: In-Memory Sliding Window Telemetry Rate Limiting (Zero D1 Writes)
// ============================================================================
{
  const testStore = new Map();
  // 1. Within limit allows requests
  const res1 = checkInMemoryRateLimit("test-key", 2, testStore, 1000);
  assert.equal(res1.ok, true);
  const res2 = checkInMemoryRateLimit("test-key", 2, testStore, 2000);
  assert.equal(res2.ok, true);

  // 2. Exceeding limit returns 429 retryAfter
  const res3 = checkInMemoryRateLimit("test-key", 2, testStore, 3000);
  assert.equal(res3.ok, false);
  assert.equal(typeof res3.retryAfterSeconds, "number");
  assert.ok(res3.retryAfterSeconds > 0 && res3.retryAfterSeconds <= 60);

  // 3. After window expiry (60s), resets and allows requests again
  const res4 = checkInMemoryRateLimit("test-key", 2, testStore, 1000 + 61000);
  assert.equal(res4.ok, true);

  // 4. Hard cap store eviction: exceeds MAX_TELEMETRY_STORE_ENTRIES (2000)
  const largeStore = new Map();
  for (let i = 0; i < 2050; i++) {
    largeStore.set(`key-${i}`, { count: 1, resetAt: Date.now() + 60000 });
  }
  assert.equal(largeStore.size, 2050);
  cleanupTelemetryRateLimits(largeStore, Date.now());
  assert.ok(largeStore.size <= 2000);

  // 5. End-to-end telemetry ping never executes writes against minute_budgets
  const e = env({ USAGE_PING_MAX_PER_MINUTE: "2" });
  resetTelemetryRateLimits();
  const pingReq = (ip) => new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify({ visitorId: "v1", sessionId: "s1", path: "/test" }),
  });

  const p1 = await handleRequest(pingReq("203.0.113.100"), e);
  const p2 = await handleRequest(pingReq("203.0.113.100"), e);
  const p3 = await handleRequest(pingReq("203.0.113.100"), e);
  assert.equal(p1.status, 202);
  assert.equal(p2.status, 202);
  assert.equal(p3.status, 429);
  assert.equal(p3.headers.get("retry-after") !== null, true);
  const p3Body = await json(p3);
  assert.equal(p3Body.error.code, "rate_limited");
  assert.equal(e.DB.minuteBudgets.size, 0); // ZERO writes to minute_budgets
}

// Test Phase 2: Usage visitors registry and 15-minute touch gate
{
  const e = env();
  resetTelemetryRateLimits();

  // 1. Initial usage ping creates a record in usageVisitors
  const ping1 = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "cf-ipcountry": "DE",
    },
    body: JSON.stringify({
      visitorId: "touchgate-visitor-1",
      sessionId: "session-1",
      eventType: "pageview",
      path: "/tools/alchemy",
      deviceType: "desktop",
    }),
  }), e);
  assert.equal(ping1.status, 202);
  assert.equal(e.DB.usageEvents.size, 1);
  assert.equal(e.DB.usageVisitors.size, 1);

  const visitorRecord = Array.from(e.DB.usageVisitors.values())[0];
  assert.equal(visitorRecord.total_events, 1);
  assert.equal(visitorRecord.total_pageviews, 1);
  assert.equal(visitorRecord.device_type, "desktop");
  assert.equal(visitorRecord.country, "DE");

  // 2. Second ping within 15 minutes: gated by 15-minute touch gate
  visitorRecord.last_seen_at = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const initialLastSeen = visitorRecord.last_seen_at;

  const ping2 = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      visitorId: "touchgate-visitor-1",
      sessionId: "session-1",
      eventType: "heartbeat",
      path: "/tools/alchemy",
    }),
  }), e);
  assert.equal(ping2.status, 202);
  assert.equal(e.DB.usageEvents.size, 2);
  // Touch gate prevented update
  assert.equal(visitorRecord.total_events, 1);
  assert.equal(visitorRecord.last_seen_at, initialLastSeen);

  // 3. Third ping after 15 minutes: touch gate passes, last_seen_at and totals update
  visitorRecord.last_seen_at = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const ping3 = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      visitorId: "touchgate-visitor-1",
      sessionId: "session-2",
      eventType: "pageview",
      path: "/tools/alchemy",
    }),
  }), e);
  assert.equal(ping3.status, 202);
  assert.equal(e.DB.usageEvents.size, 3);
  assert.equal(visitorRecord.total_events, 2);
  assert.equal(visitorRecord.total_pageviews, 2);
  assert.notEqual(visitorRecord.last_seen_at, initialLastSeen);
  // Preserved desktop & DE when ping3 omitted deviceType and country
  assert.equal(visitorRecord.device_type, "desktop");
  assert.equal(visitorRecord.country, "DE");

  // 3b. Ping after another 15+ minutes with explicit new deviceType & country updates them
  visitorRecord.last_seen_at = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const ping4 = await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
      "cf-ipcountry": "US",
    },
    body: JSON.stringify({
      visitorId: "touchgate-visitor-1",
      sessionId: "session-3",
      eventType: "heartbeat",
      path: "/tools/alchemy",
      deviceType: "mobile",
    }),
  }), e);
  assert.equal(ping4.status, 202);
  assert.equal(visitorRecord.total_events, 3);
  assert.equal(visitorRecord.device_type, "mobile");
  assert.equal(visitorRecord.country, "US");

  // 4. Test admin health summary pulls from usage_visitors
  const healthRes = await handleRequest(new Request("https://worker.test/admin/import-health?fresh=true", {
    headers: { authorization: "Bearer admin-secret" },
  }), e);
  assert.equal(healthRes.status, 200);
  const healthBody = await json(healthRes);
  assert.equal(healthBody.usage.activeUsers15m, 1);
  assert.equal(healthBody.usage.uniqueUsers24h, 1);
  assert.equal(healthBody.usage.uniqueUsersAllTime, 1);
  const tf15m = healthBody.usage.timeframes.find((f) => f.key === "15m");
  const tf24h = healthBody.usage.timeframes.find((f) => f.key === "24h");
  const tfAll = healthBody.usage.timeframes.find((f) => f.key === "all");
  assert.equal(tf15m?.users, 1);
  assert.equal(tf24h?.users, 1);
  assert.equal(tfAll?.users, 1);

  // 5. Test fallback when usage_visitors is unavailable/missing
  const fallbackEnv = env();
  resetTelemetryRateLimits();
  const originalPrepare = fallbackEnv.DB.prepare.bind(fallbackEnv.DB);
  fallbackEnv.DB.prepare = (sql) => {
    if (sql.includes("FROM usage_visitors") || sql.includes("INSERT INTO usage_visitors")) {
      return {
        bind: () => ({
          first: async () => { throw new Error("no such table: usage_visitors"); },
          run: async () => { throw new Error("no such table: usage_visitors"); },
        }),
        first: async () => { throw new Error("no such table: usage_visitors"); },
        run: async () => { throw new Error("no such table: usage_visitors"); },
      };
    }
    return originalPrepare(sql);
  };

  // Add event to usage_events
  await handleRequest(new Request("https://worker.test/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer usage-secret",
      origin: "https://zenith.example",
    },
    body: JSON.stringify({
      visitorId: "fallback-visitor",
      sessionId: "fallback-session",
      eventType: "pageview",
      path: "/leaderboards",
    }),
  }), fallbackEnv);

  const fallbackHealth = await handleRequest(new Request("https://worker.test/admin/import-health?fresh=true", {
    headers: { authorization: "Bearer admin-secret" },
  }), fallbackEnv);
  assert.equal(fallbackHealth.status, 200);
  const fallbackBody = await json(fallbackHealth);
  assert.equal(fallbackBody.usage.activeUsers15m, 1);
  assert.equal(fallbackBody.usage.pageviews24h, 1);
  assert.equal(fallbackBody.usage.uniqueUsersAllTime, 1);
  const fb15m = fallbackBody.usage.timeframes.find((f) => f.key === "15m");
  assert.equal(fb15m?.users, 1);
}

console.log("Profile import Worker scaffold tests passed.");
