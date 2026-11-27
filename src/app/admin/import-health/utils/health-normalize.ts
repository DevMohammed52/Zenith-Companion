import {
  DEFAULT_COORDINATOR_SOURCES,
  TIMEFRAME_ORDER,
  type CooldownItem,
  type CooldownSummary,
  type CoordinatorStateRow,
  type DatabaseStats,
  type ImportFrame,
  type ImportHealth,
  type MinuteUsage,
  type RecentJobRow,
  type TimeframeKey,
  type UsageFrame,
  type WebVitalMetricSummary,
  type WebVitalsSummary,
} from "../types";
import { deriveVitalRating, roundOneDecimal } from "./health-format";

export type RawHealthInput = {
  ok?: boolean;
  generatedAt?: string;
  service?: Partial<ImportHealth["service"]>;
  queue?: Partial<ImportHealth["queue"]>;
  active?: Partial<ImportHealth["active"]>;
  minuteUsage?: Partial<MinuteUsage>;
  databaseStats?: Partial<DatabaseStats>;
  last24h?: Partial<ImportHealth["last24h"]>;
  demand?: Partial<ImportHealth["demand"]>;
  pressure?: Partial<ImportHealth["pressure"]>;
  usage?: Omit<Partial<ImportHealth["usage"]>, "timeframes"> & {
    timeframes?: Array<Partial<UsageFrame>>;
  };
  appErrors?: Partial<ImportHealth["appErrors"]>;
  webVitals?: Omit<Partial<WebVitalsSummary>, "metrics" | "topPaths" | "devices"> & {
    metrics?: Array<Partial<WebVitalMetricSummary>>;
    topPaths?: Array<Partial<WebVitalsSummary["topPaths"][number]>>;
    devices?: Array<Partial<WebVitalsSummary["devices"][number]>>;
  };
  coordinator?:
    | Array<Partial<CoordinatorStateRow>>
    | {
        mode?: string;
        anyActive?: boolean;
        states?: Array<Partial<CoordinatorStateRow>>;
      };
  cooldowns?: Partial<CooldownSummary>;
  imports?: Omit<Partial<ImportHealth["imports"]>, "timeframes"> & {
    timeframes?: Array<Partial<ImportFrame>>;
    byError?: Array<{ code?: string; errorCode?: string; count?: number }>;
    topCharacters?: Array<{
      fingerprintTail?: string;
      targetHashFingerprint?: string;
      events?: number;
      users?: number;
    }>;
  };
  recentJobs?: Array<Partial<RecentJobRow>>;
};

export function normalizeHealth(value: RawHealthInput): ImportHealth {
  const rawUsageFrames = Array.isArray(value.usage?.timeframes) ? value.usage.timeframes : [];
  const rawImportFrames = Array.isArray(value.imports?.timeframes) ? value.imports.timeframes : [];

  const coordinatorObj =
    !Array.isArray(value.coordinator) && value.coordinator ? value.coordinator : undefined;
  const rawCoordinatorList: Array<Partial<CoordinatorStateRow>> = Array.isArray(value.coordinator)
    ? value.coordinator
    : Array.isArray(coordinatorObj?.states)
      ? coordinatorObj.states
      : [];

  const coordinatorBySource = new Map<string, CoordinatorStateRow>();
  for (const src of DEFAULT_COORDINATOR_SOURCES) {
    coordinatorBySource.set(src, {
      active: false,
      status: "idle",
      source: src,
      runId: "-",
      startedAt: "",
      finishedAt: "",
      lastSeenAt: "",
      updatedAt: "",
      expiresAt: "",
      stale: false,
    });
  }
  for (const item of rawCoordinatorList) {
    const src = String(item.source || "unknown");
    const lastSeen = String(item.lastSeenAt || item.updatedAt || "");
    coordinatorBySource.set(src, {
      active: Boolean(item.active),
      status: String(item.status || (item.active ? "started" : "idle")),
      source: src,
      runId: String(item.runId || "-"),
      startedAt: String(item.startedAt || ""),
      finishedAt: String(item.finishedAt || ""),
      lastSeenAt: lastSeen,
      updatedAt: String(item.updatedAt || lastSeen),
      expiresAt: String(item.expiresAt || ""),
      stale: Boolean(item.stale),
    });
  }

  const normalizedCoordinator = Array.from(coordinatorBySource.values());
  const anyActiveCoordinator =
    Boolean(coordinatorObj?.anyActive) ||
    normalizedCoordinator.some((state) => state.active && !state.stale);

  const serviceBudgetMode =
    coordinatorObj?.mode ||
    (anyActiveCoordinator ? "github-active" : undefined) ||
    value.service?.budgetMode ||
    value.minuteUsage?.budgetMode ||
    "github-idle";
  const serviceLimit = Number(
    value.service?.importRequestsPerMinute || (serviceBudgetMode === "github-active" ? 6 : 35),
  );

  const rawCooldownItems = Array.isArray(value.cooldowns?.items) ? value.cooldowns.items : [];
  const normalizedCooldownItems: CooldownItem[] = rawCooldownItems.map((item) => ({
    scope: String(item.scope || "global"),
    keyFingerprint: String(
      item.keyFingerprint || (item as Record<string, unknown>).key_fingerprint || "global",
    ),
    reason: String(item.reason || "Rate limit cooldown"),
    untilAt: String(item.untilAt || (item as Record<string, unknown>).until_at || ""),
    remainingSeconds: Math.max(0, Number(item.remainingSeconds || 0)),
  }));
  const activeCooldownCount = Number(
    value.cooldowns?.activeCount ?? value.cooldowns?.active ?? normalizedCooldownItems.length,
  );

  const rawMetrics = Array.isArray(value.webVitals?.metrics) ? value.webVitals.metrics : [];
  const normalizedVitalMetrics: WebVitalMetricSummary[] = rawMetrics.map((m) => {
    const events = Math.max(0, Number(m.events || 0));
    const poor = Math.max(0, Number(m.poor || 0));
    const poorRate =
      events > 0 ? Number(m.poorRate ?? roundOneDecimal((poor / events) * 100)) : 0;
    const rawGoodRate = (m as Partial<WebVitalMetricSummary>).goodRate;
    const goodRate =
      events <= 0
        ? 0
        : rawGoodRate !== undefined && Number.isFinite(Number(rawGoodRate))
          ? Math.max(0, Math.min(100, roundOneDecimal(Number(rawGoodRate))))
          : Math.max(0, Math.min(100, roundOneDecimal(100 - poorRate)));
    const p75Value = Number(m.p75Value || 0);
    const name = String(m.name || "").toUpperCase();
    return {
      name,
      events,
      poor,
      poorRate,
      goodRate,
      avgValue: Number(m.avgValue || 0),
      p75Value,
      maxValue: Number(m.maxValue || 0),
      rating: deriveVitalRating(name, p75Value, events),
    };
  });

  const normalizedVitalPaths = (
    Array.isArray(value.webVitals?.topPaths) ? value.webVitals.topPaths : []
  ).map((row) => {
    const events = Math.max(0, Number(row.events || 0));
    const poor = Math.max(0, Number(row.poor || 0));
    const poorRate =
      row.poorRate !== undefined && Number.isFinite(Number(row.poorRate))
        ? Number(row.poorRate)
        : events > 0
          ? roundOneDecimal((poor / events) * 100)
          : 0;
    return {
      path: String(row.path || "/"),
      metricName: String(row.metricName || "LCP").toUpperCase(),
      ...(row.p75Value !== undefined ? { p75Value: Number(row.p75Value) } : {}),
      events,
      poor,
      poorRate,
    };
  });

  const normalizedVitalDevices = (
    Array.isArray(value.webVitals?.devices) ? value.webVitals.devices : []
  ).map((dev) => {
    const events = Math.max(0, Number(dev.events || 0));
    const poor = Math.max(0, Number(dev.poor || 0));
    const poorRate =
      dev.poorRate !== undefined && Number.isFinite(Number(dev.poorRate))
        ? Number(dev.poorRate)
        : events > 0
          ? roundOneDecimal((poor / events) * 100)
          : 0;
    return {
      type: String(dev.type || "unknown"),
      events,
      poor,
      poorRate,
    };
  });

  const rawImportErrors = Array.isArray(value.imports?.errors)
    ? value.imports.errors.map((e) => ({
        code: String(e.code || "unknown"),
        count: Number(e.count || 0),
      }))
    : Array.isArray(value.imports?.byError)
      ? value.imports.byError.map((e) => ({
          code: String(e.code || e.errorCode || "unknown"),
          count: Number(e.count || 0),
        }))
      : [];

  const rawBusiestTargets = Array.isArray(value.imports?.busiestTargets)
    ? value.imports.busiestTargets.map((t) => ({
        fingerprintTail: String(t.fingerprintTail || "unknown").slice(-10),
        events: Number(t.events || 0),
        users: Number(t.users || 0),
      }))
    : Array.isArray(value.imports?.topCharacters)
      ? value.imports.topCharacters.map((t) => ({
          fingerprintTail: String(t.fingerprintTail || t.targetHashFingerprint || "unknown").slice(-10),
          events: Number(t.events || 0),
          users: Number(t.users || 0),
        }))
      : [];

  const usedReqs = Number(value.minuteUsage?.usedRequests ?? value.minuteUsage?.used ?? 0);
  const minuteBudgetMode = String(
    coordinatorObj?.mode ||
      (anyActiveCoordinator ? "github-active" : undefined) ||
      value.minuteUsage?.budgetMode ||
      serviceBudgetMode,
  );
  const minuteLimit = Number(
    value.minuteUsage?.limit || (minuteBudgetMode === "github-active" ? 6 : serviceLimit) || 35,
  );

  const normalizedUsageFrames: UsageFrame[] = rawUsageFrames.length
    ? rawUsageFrames.map((frame) => {
        const pageviews = Number(frame.pageviews || 0);
        const sessions = Number(frame.sessions || 0);
        return {
          key: (frame.key || "24h") as TimeframeKey,
          label: String(frame.label || frame.key || "24h"),
          events: Number(frame.events || 0),
          pageviews,
          heartbeats: Number(frame.heartbeats || 0),
          users: Number(frame.users || 0),
          sessions,
          pageviewsPerSession:
            frame.pageviewsPerSession !== undefined && Number.isFinite(Number(frame.pageviewsPerSession))
              ? Number(frame.pageviewsPerSession)
              : sessions > 0
                ? roundOneDecimal(pageviews / sessions)
                : 0,
        };
      })
    : fallbackUsageFrames(value);

  const normalizedImportFrames: ImportFrame[] = rawImportFrames.length
    ? rawImportFrames.map((frame) => {
        const attempts = Number(frame.attempts || 0);
        const completed = Number(frame.completed || 0);
        const failed = Number(frame.failed || 0);
        return {
          key: (frame.key || "24h") as TimeframeKey,
          label: String(frame.label || frame.key || "24h"),
          events: Number(frame.events || 0),
          attempts,
          queued: Number(frame.queued || 0),
          completed,
          failed,
          expired: Number(frame.expired || 0),
          waitingForBudget: Number(frame.waitingForBudget || 0),
          queueBusy: Number(frame.queueBusy || 0),
          cooldown: Number(frame.cooldown || 0),
          turnstileFailed: Number(frame.turnstileFailed || 0),
          rateLimited: Number(frame.rateLimited || 0),
          users: Number(frame.users || 0),
          characters: Number(frame.characters || 0),
          avgDurationSeconds: Number(frame.avgDurationSeconds || 0),
          maxDurationSeconds: Number(frame.maxDurationSeconds || 0),
          avgRequestCount: Number(frame.avgRequestCount || 0),
          avgRetryCount: Number(frame.avgRetryCount || 0),
          completionRate:
            frame.completionRate !== undefined && Number.isFinite(Number(frame.completionRate))
              ? Number(frame.completionRate)
              : attempts > 0
                ? roundOneDecimal((completed / attempts) * 100)
                : 0,
          failureRate:
            frame.failureRate !== undefined && Number.isFinite(Number(frame.failureRate))
              ? Number(frame.failureRate)
              : attempts > 0
                ? roundOneDecimal((failed / attempts) * 100)
                : 0,
        };
      })
    : fallbackImportFrames(value);

  return {
    ok: Boolean(value.ok),
    generatedAt: value.generatedAt || new Date().toISOString(),
    service: {
      worker: value.service?.worker || "zenith-profile-import",
      budgetMode: serviceBudgetMode,
      rateLimitStore: value.service?.rateLimitStore || "d1-minute-budgets",
      importRequestsPerMinute: serviceLimit,
      pollAfterMs: Number(value.service?.pollAfterMs || 2000),
      importDelayMs: Number(value.service?.importDelayMs || 1800),
      jobTtlMinutes: Number(value.service?.jobTtlMinutes || 60),
    },
    active: {
      queued: Number(value.active?.queued ?? value.queue?.pending ?? 0),
      running: Number(value.active?.running ?? value.queue?.running ?? 0),
    },
    queue: {
      pending: Number(value.queue?.pending ?? value.active?.queued ?? 0),
      running: Number(value.queue?.running ?? value.active?.running ?? 0),
    },
    cooldowns: {
      active: activeCooldownCount,
      activeCount: activeCooldownCount,
      items: normalizedCooldownItems,
    },
    minuteUsage: {
      minuteKey: String(value.minuteUsage?.minuteKey || Math.floor(Date.now() / 60000)),
      used: usedReqs,
      usedRequests: usedReqs,
      limit: minuteLimit,
      budgetMode: minuteBudgetMode,
      sources: Array.isArray(value.minuteUsage?.sources) ? value.minuteUsage.sources : [],
    },
    databaseStats: {
      usage_events: Number(value.databaseStats?.usage_events || 0),
      usage_visitors: Number(value.databaseStats?.usage_visitors || 0),
      import_events: Number(value.databaseStats?.import_events || 0),
      import_jobs: Number(value.databaseStats?.import_jobs || 0),
      cooldowns: Number(value.databaseStats?.cooldowns || 0),
      minute_budgets: Number(value.databaseStats?.minute_budgets || 0),
      web_vital_events: Number(value.databaseStats?.web_vital_events || 0),
      app_error_events: Number(value.databaseStats?.app_error_events || 0),
    },
    last24h: {
      total: Number(value.last24h?.total || 0),
      attempts: Number(value.last24h?.attempts ?? value.last24h?.total ?? 0),
      completed: Number(value.last24h?.completed || 0),
      failed: Number(value.last24h?.failed || 0),
      waitingForBudget: Number(value.last24h?.waitingForBudget || 0),
      rateLimited: Number(value.last24h?.rateLimited || 0),
      avgRequestCount: Number(value.last24h?.avgRequestCount || 0),
      avgRetryCount: Number(value.last24h?.avgRetryCount || 0),
      avgDurationSeconds: Number(value.last24h?.avgDurationSeconds || 0),
      completionRate: Number(value.last24h?.completionRate || 0),
      failureRate: Number(value.last24h?.failureRate || 0),
      statuses: value.last24h?.statuses || {},
    },
    demand: {
      jobsLastHour: Number(value.demand?.jobsLastHour || 0),
      jobsLast24h: Number(value.demand?.jobsLast24h || 0),
      jobsLast7d: Number(value.demand?.jobsLast7d || 0),
      activeImportUsers15m: Number(value.demand?.activeImportUsers15m || 0),
      activeImportUsers1h: Number(value.demand?.activeImportUsers1h || 0),
      uniqueImportUsers24h: Number(value.demand?.uniqueImportUsers24h || 0),
      uniqueImportUsers7d: Number(value.demand?.uniqueImportUsers7d || 0),
      uniqueImportUsersAllTime: Number(value.demand?.uniqueImportUsersAllTime || 0),
      uniqueCharacters24h: Number(value.demand?.uniqueCharacters24h || 0),
      uniqueCharacters7d: Number(value.demand?.uniqueCharacters7d || 0),
      uniqueCharactersAllTime: Number(value.demand?.uniqueCharactersAllTime || 0),
    },
    pressure: {
      oldestQueuedSeconds: Number(value.pressure?.oldestQueuedSeconds || 0),
      oldestRunningSeconds: Number(value.pressure?.oldestRunningSeconds || 0),
    },
    usage: {
      activeUsers15m: Number(value.usage?.activeUsers15m || 0),
      activeUsers1h: Number(value.usage?.activeUsers1h || 0),
      uniqueUsers24h: Number(value.usage?.uniqueUsers24h || 0),
      uniqueUsers7d: Number(value.usage?.uniqueUsers7d || 0),
      uniqueUsers30d: Number(value.usage?.uniqueUsers30d || 0),
      uniqueUsersAllTime: Number(value.usage?.uniqueUsersAllTime || 0),
      sessions24h: Number(value.usage?.sessions24h || 0),
      sessions7d: Number(value.usage?.sessions7d || 0),
      sessions30d: Number(value.usage?.sessions30d || 0),
      events24h: Number(value.usage?.events24h || 0),
      pageviews24h: Number(value.usage?.pageviews24h || 0),
      pageviewsPerSession24h: Number(value.usage?.pageviewsPerSession24h || 0),
      timeframes: normalizedUsageFrames,
      daily: value.usage?.daily || [],
      hourly: value.usage?.hourly || [],
      topPages: value.usage?.topPages || [],
      devices: value.usage?.devices || [],
      referrers: value.usage?.referrers || [],
      countries: value.usage?.countries || [],
      browsers: value.usage?.browsers || [],
      timezones: value.usage?.timezones || [],
    },
    appErrors: {
      events24h: Number(value.appErrors?.events24h || 0),
      events7d: Number(value.appErrors?.events7d || 0),
      events30d: Number(value.appErrors?.events30d || 0),
      uniqueDigests24h: Number(value.appErrors?.uniqueDigests24h || 0),
      topPaths: value.appErrors?.topPaths || [],
      topDigests: value.appErrors?.topDigests || [],
      browsers: value.appErrors?.browsers || [],
      recentEvents: value.appErrors?.recentEvents || [],
    },
    webVitals: {
      events24h: Number(value.webVitals?.events24h || 0),
      events7d: Number(value.webVitals?.events7d || 0),
      events30d: Number(value.webVitals?.events30d || 0),
      poor24h: Number(value.webVitals?.poor24h || 0),
      poor30d: Number(value.webVitals?.poor30d || 0),
      poorRate30d: Number(value.webVitals?.poorRate30d || 0),
      metrics: normalizedVitalMetrics,
      topPaths: normalizedVitalPaths,
      devices: normalizedVitalDevices,
    },
    imports: {
      timeframes: normalizedImportFrames,
      daily: value.imports?.daily || [],
      hourly: value.imports?.hourly || [],
      errors: rawImportErrors,
      budgets: value.imports?.budgets || [],
      busiestTargets: rawBusiestTargets,
      recentEvents: value.imports?.recentEvents || [],
    },
    coordinator: normalizedCoordinator,
    recentJobs: (value.recentJobs || []).map((job, idx) => ({
      id: String(job.id || `job_${idx}`),
      targetHashFingerprint: String(job.targetHashFingerprint || ""),
      status: String(job.status || "unknown"),
      errorCode: String(job.errorCode || ""),
      errorMessage: String(job.errorMessage || ""),
      requestCount: Number(job.requestCount || 0),
      retryCount: Number(job.retryCount || 0),
      budgetMode: String(job.budgetMode || "unknown"),
      createdAt: String(job.createdAt || ""),
      updatedAt: String(job.updatedAt || ""),
      expiresAt: String(job.expiresAt || ""),
      expired: Boolean(job.expired),
    })),
  };
}

function fallbackUsageFrames(value: RawHealthInput): UsageFrame[] {
  return TIMEFRAME_ORDER.map((key) => ({
    key,
    label: key,
    events: key === "24h" ? value.usage?.events24h || 0 : 0,
    pageviews: key === "24h" ? value.usage?.pageviews24h || 0 : 0,
    heartbeats: 0,
    users:
      key === "15m"
        ? value.usage?.activeUsers15m || 0
        : key === "1h"
          ? value.usage?.activeUsers1h || 0
          : key === "24h"
            ? value.usage?.uniqueUsers24h || 0
            : key === "7d"
              ? value.usage?.uniqueUsers7d || 0
              : key === "30d"
                ? value.usage?.uniqueUsers30d || 0
                : key === "all"
                  ? value.usage?.uniqueUsersAllTime || 0
                  : 0,
    sessions: key === "24h" ? value.usage?.sessions24h || 0 : key === "7d" ? value.usage?.sessions7d || 0 : 0,
    pageviewsPerSession: key === "24h" ? value.usage?.pageviewsPerSession24h || 0 : 0,
  }));
}

function fallbackImportFrames(value: RawHealthInput): ImportFrame[] {
  return TIMEFRAME_ORDER.map((key) => ({
    key,
    label: key,
    events: key === "24h" ? value.last24h?.total || 0 : 0,
    attempts: key === "24h" ? value.last24h?.total || 0 : 0,
    queued: 0,
    completed: key === "24h" ? value.last24h?.completed || 0 : 0,
    failed: key === "24h" ? value.last24h?.failed || 0 : 0,
    expired: 0,
    waitingForBudget: key === "24h" ? value.last24h?.waitingForBudget || 0 : 0,
    queueBusy: 0,
    cooldown: 0,
    turnstileFailed: 0,
    rateLimited: key === "24h" ? value.last24h?.rateLimited || 0 : 0,
    users:
      key === "24h"
        ? value.demand?.uniqueImportUsers24h || 0
        : key === "7d"
          ? value.demand?.uniqueImportUsers7d || 0
          : key === "all"
            ? value.demand?.uniqueImportUsersAllTime || 0
            : 0,
    characters:
      key === "24h"
        ? value.demand?.uniqueCharacters24h || 0
        : key === "7d"
          ? value.demand?.uniqueCharacters7d || 0
          : key === "all"
            ? value.demand?.uniqueCharactersAllTime || 0
            : 0,
    avgDurationSeconds: key === "24h" ? value.last24h?.avgDurationSeconds || 0 : 0,
    maxDurationSeconds: 0,
    avgRequestCount: key === "24h" ? value.last24h?.avgRequestCount || 0 : 0,
    avgRetryCount: key === "24h" ? value.last24h?.avgRetryCount || 0 : 0,
    completionRate: key === "24h" ? value.last24h?.completionRate || 0 : 0,
    failureRate: key === "24h" ? value.last24h?.failureRate || 0 : 0,
  }));
}
