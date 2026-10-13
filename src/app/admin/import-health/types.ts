export type TimeframeKey = "15m" | "1h" | "24h" | "48h" | "7d" | "14d" | "30d" | "all";

export type AdminTabKey = "engine" | "imports" | "traffic" | "vitals" | "database";

export type AutoRefreshSeconds = 0 | 15 | 30 | 60;

export type Tone = "good" | "warn" | "bad" | "neutral";

export type UsageFrame = {
  key: TimeframeKey;
  label: string;
  events: number;
  pageviews: number;
  heartbeats: number;
  users: number;
  sessions: number;
  pageviewsPerSession: number;
};

export type ImportFrame = {
  key: TimeframeKey;
  label: string;
  events: number;
  attempts: number;
  queued: number;
  completed: number;
  failed: number;
  expired: number;
  waitingForBudget: number;
  queueBusy: number;
  cooldown: number;
  turnstileFailed: number;
  rateLimited: number;
  users: number;
  characters: number;
  avgDurationSeconds: number;
  maxDurationSeconds: number;
  avgRequestCount: number;
  avgRetryCount: number;
  completionRate: number;
  failureRate: number;
};

export type TrendRow = {
  day?: string;
  hour?: string;
  events: number;
  pageviews?: number;
  attempts?: number;
  completed?: number;
  failed?: number;
  waitingForBudget?: number;
  rateLimited?: number;
  users: number;
  sessions?: number;
  characters?: number;
  avgDurationSeconds?: number;
};

export type WebVitalRating = "good" | "needs-improvement" | "poor";

export type WebVitalMetricSummary = {
  name: string;
  events: number;
  poor: number;
  poorRate: number;
  goodRate: number;
  avgValue: number;
  p75Value: number;
  maxValue: number;
  rating: WebVitalRating;
};

export type WebVitalsSummary = {
  events24h: number;
  events7d: number;
  events30d: number;
  poor24h: number;
  poor30d: number;
  poorRate30d: number;
  metrics: WebVitalMetricSummary[];
  topPaths: Array<{
    path: string;
    metricName: string;
    p75Value?: number;
    events: number;
    poor: number;
    poorRate: number;
  }>;
  devices: Array<{
    type: string;
    events: number;
    poor: number;
    poorRate: number;
  }>;
};

export type MinuteUsageSource = {
  source: string;
  usedRequests: number;
  mode: string;
  updatedAt?: string;
};

export type MinuteUsage = {
  minuteKey: string;
  used: number;
  usedRequests: number;
  limit: number;
  budgetMode: string;
  sources: MinuteUsageSource[];
};

export type DatabaseStats = {
  usage_events: number;
  usage_visitors: number;
  import_events: number;
  import_jobs: number;
  cooldowns: number;
  minute_budgets: number;
  web_vital_events: number;
  app_error_events: number;
};

export type CooldownItem = {
  scope: string;
  keyFingerprint: string;
  reason: string;
  untilAt: string;
  remainingSeconds: number;
};

export type CooldownSummary = {
  active: number;
  activeCount: number;
  items: CooldownItem[];
};

export type CoordinatorStateRow = {
  active: boolean;
  status: string;
  source: string;
  runId: string;
  startedAt: string;
  finishedAt: string;
  lastSeenAt: string;
  updatedAt: string;
  expiresAt: string;
  stale: boolean;
};

export type RecentJobRow = {
  id: string;
  targetHashFingerprint: string;
  status: string;
  errorCode: string;
  errorMessage: string;
  requestCount: number;
  retryCount: number;
  budgetMode: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  expired: boolean;
};

export type ImportHealth = {
  ok: boolean;
  generatedAt: string;
  service: {
    worker: string;
    budgetMode: string;
    rateLimitStore?: string;
    importRequestsPerMinute: number;
    pollAfterMs: number;
    importDelayMs: number;
    jobTtlMinutes: number;
  };
  queue: {
    pending: number;
    running: number;
  };
  active: {
    queued: number;
    running: number;
  };
  cooldowns: CooldownSummary;
  minuteUsage: MinuteUsage;
  databaseStats: DatabaseStats;
  last24h: {
    total: number;
    attempts?: number;
    completed: number;
    failed: number;
    waitingForBudget: number;
    rateLimited: number;
    avgRequestCount: number;
    avgRetryCount: number;
    avgDurationSeconds: number;
    completionRate: number;
    failureRate: number;
    statuses: Record<string, number>;
  };
  demand: {
    jobsLastHour: number;
    jobsLast24h: number;
    jobsLast7d: number;
    activeImportUsers15m: number;
    activeImportUsers1h: number;
    uniqueImportUsers24h: number;
    uniqueImportUsers7d: number;
    uniqueImportUsersAllTime: number;
    uniqueCharacters24h: number;
    uniqueCharacters7d: number;
    uniqueCharactersAllTime: number;
  };
  pressure: {
    oldestQueuedSeconds: number;
    oldestRunningSeconds: number;
  };
  usage: {
    activeUsers15m: number;
    activeUsers1h: number;
    uniqueUsers24h: number;
    uniqueUsers7d: number;
    uniqueUsers30d: number;
    uniqueUsersAllTime: number;
    sessions24h: number;
    sessions7d: number;
    sessions30d: number;
    events24h: number;
    pageviews24h: number;
    pageviewsPerSession24h: number;
    timeframes: UsageFrame[];
    daily: TrendRow[];
    hourly: TrendRow[];
    topPages: Array<{ path: string; views: number; users: number }>;
    devices: Array<{ type: string; users: number }>;
    referrers: Array<{ host: string; users: number }>;
    countries: Array<{ country: string; users: number; events: number }>;
    browsers: Array<{ family: string; users: number }>;
    timezones: Array<{ timezone: string; users: number }>;
  };
  appErrors: {
    events24h: number;
    events7d: number;
    events30d: number;
    uniqueDigests24h: number;
    topPaths: Array<{ path: string; events: number; digests: number }>;
    topDigests: Array<{ digest: string; events: number; paths: number; lastSeenAt: string }>;
    browsers: Array<{ family: string; events: number }>;
    recentEvents: Array<{
      eventType: string;
      path: string;
      digest: string;
      appVersion: string;
      browserClass: string;
      createdAt: string;
    }>;
  };
  webVitals: WebVitalsSummary;
  imports: {
    timeframes: ImportFrame[];
    daily: TrendRow[];
    hourly: TrendRow[];
    errors: Array<{ code: string; count: number }>;
    budgets: Array<{ mode: string; events: number }>;
    busiestTargets: Array<{ fingerprintTail: string; events: number; users: number }>;
    recentEvents: Array<{
      eventType: string;
      status: string;
      errorCode: string;
      budgetMode: string;
      requestCount: number;
      retryCount: number;
      durationSeconds: number;
      createdAt: string;
    }>;
  };
  coordinator: CoordinatorStateRow[];
  recentJobs: RecentJobRow[];
};

export type AdminActionRequest =
  | { action: "process_queue" }
  | { action: "clear_coordinator"; source?: string }
  | { action: "cancel_job"; jobId: string }
  | { action: "clear_cooldown"; scope: string; keyFingerprint: string };

export const TIMEFRAME_ORDER: TimeframeKey[] = ["15m", "1h", "24h", "48h", "7d", "14d", "30d", "all"];

export const DEFAULT_COORDINATOR_SOURCES = [
  "github-actions:update_data",
  "github-actions:update_guild_data",
] as const;

export const CORE_WEB_VITAL_NAMES = ["LCP", "CLS", "INP", "FCP", "TTFB"] as const;

export type D1TablePolicy = {
  table: keyof DatabaseStats;
  label: string;
  category: "Telemetry" | "Import Engine" | "Rate Limiting";
  role: string;
  ttlPolicy: string;
  cleanupMechanism: string;
};

export const D1_RETENTION_POLICIES: D1TablePolicy[] = [
  {
    table: "usage_events",
    label: "usage_events",
    category: "Telemetry",
    role: "Anonymous pageview and heartbeat events with route path, device class, country, and browser family.",
    ttlPolicy: "30-day rolling query window (durable raw log)",
    cleanupMechanism: "Indexed by created_at; queried over 15m–30d windows",
  },
  {
    table: "usage_visitors",
    label: "usage_visitors",
    category: "Telemetry",
    role: "Deduplicated anonymous visitor registry tracking first_seen_at, last_seen_at, and aggregate counters.",
    ttlPolicy: "Permanent anonymous registry (15m write-dedup)",
    cleanupMechanism: "Upserted on ping when last_seen_at > 15m old",
  },
  {
    table: "web_vital_events",
    label: "web_vital_events",
    category: "Telemetry",
    role: "Real User Monitoring (RUM) samples for LCP, CLS, INP, FCP, and TTFB per route and device.",
    ttlPolicy: "30-day active window",
    cleanupMechanism: "Indexed by created_at and metric_name + metric_rating",
  },
  {
    table: "import_events",
    label: "import_events",
    category: "Import Engine",
    role: "Permanent operational audit log of profile import lifecycle transitions, durations, and error codes.",
    ttlPolicy: "Permanent operational history",
    cleanupMechanism: "Append-only operational ledger (zero PII/payloads)",
  },
  {
    table: "app_error_events",
    label: "app_error_events",
    category: "Telemetry",
    role: "Client and server error boundary reports grouped by Next.js error digest and route path.",
    ttlPolicy: "30-day active diagnostic window",
    cleanupMechanism: "Indexed by created_at, path, and digest",
  },
  {
    table: "minute_budgets",
    label: "minute_budgets",
    category: "Rate Limiting",
    role: "Per-minute request counters enforcing shared IdleMMO API budget caps (35/min idle, 6/min active).",
    ttlPolicy: "2-hour retention",
    cleanupMechanism: "Purged automatically by scheduled cron (updated_at <= now - 2h)",
  },
  {
    table: "import_jobs",
    label: "import_jobs",
    category: "Import Engine",
    role: "Ephemeral queue and encrypted character payload staging for active and recently finished imports.",
    ttlPolicy: "60-minute strict TTL",
    cleanupMechanism: "Purged by scheduled cron when expires_at <= now",
  },
  {
    table: "cooldowns",
    label: "cooldowns",
    category: "Rate Limiting",
    role: "Active rate-limit and target/requester backoff locks triggered by upstream 429s or burst guards.",
    ttlPolicy: "Expires at until_at (typically 3m)",
    cleanupMechanism: "Purged by scheduled cron when until_at <= now or via Admin Unblock",
  },
];

export function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "—";
}

export function formatShortDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTimeOnly(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remaining = rounded % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}

export function formatVitalValue(metricName: string, value: number): string {
  if (!Number.isFinite(value)) return "0";
  return metricName.toUpperCase() === "CLS"
    ? new Intl.NumberFormat("en", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(value)
    : `${formatNumber(value)}ms`;
}

export function deriveVitalRating(metricName: string, p75Value: number, events = 1): WebVitalRating {
  if (events <= 0) return "good";
  const upper = metricName.toUpperCase();
  const val = Number(p75Value || 0);
  switch (upper) {
    case "LCP":
      return val <= 2500 ? "good" : val <= 4000 ? "needs-improvement" : "poor";
    case "CLS":
      return val <= 0.1 ? "good" : val <= 0.25 ? "needs-improvement" : "poor";
    case "INP":
      return val <= 200 ? "good" : val <= 500 ? "needs-improvement" : "poor";
    case "FCP":
      return val <= 1800 ? "good" : val <= 3000 ? "needs-improvement" : "poor";
    case "TTFB":
      return val <= 800 ? "good" : val <= 1800 ? "needs-improvement" : "poor";
    default:
      return "good";
  }
}

export function vitalRatingTone(rating: WebVitalRating): Tone {
  if (rating === "good") return "good";
  if (rating === "needs-improvement") return "warn";
  return "bad";
}

export function statusTone(status: string): Tone {
  const normalized = (status || "").toLowerCase();
  if (normalized === "complete" || normalized === "completed" || normalized === "idle" || normalized === "finished" || normalized === "good") {
    return "good";
  }
  if (
    normalized === "failed" ||
    normalized === "rate_limited" ||
    normalized === "rate_limit_exhausted" ||
    normalized === "turnstile_failed" ||
    normalized === "expired" ||
    normalized === "cancelled_by_admin" ||
    normalized === "poor"
  ) {
    return "bad";
  }
  if (
    normalized === "waiting_for_budget" ||
    normalized === "running" ||
    normalized === "queued" ||
    normalized === "started" ||
    normalized === "queue_busy" ||
    normalized === "cooldown" ||
    normalized === "active" ||
    normalized === "needs-improvement"
  ) {
    return "warn";
  }
  return "neutral";
}

export function findFrame<T extends { key: TimeframeKey }>(frames: T[], key: TimeframeKey): T | undefined {
  return frames.find((frame) => frame.key === key);
}

const regionDisplayNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function countryCodeToFlagEmoji(code: string): string {
  const clean = (code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean) || clean === "XX" || clean === "ZZ") {
    return "🌐";
  }
  const first = 0x1f1e6 + (clean.charCodeAt(0) - 65);
  const second = 0x1f1e6 + (clean.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}

export function formatCountryDisplay(rawCountry: string): {
  code: string;
  name: string;
  flag: string;
  fullLabel: string;
} {
  const clean = (rawCountry || "").trim().toUpperCase();
  if (!clean || clean === "UNKNOWN" || clean === "XX" || clean === "T1") {
    return {
      code: clean || "UNK",
      name: clean === "T1" ? "Tor / Anonymous" : "Unknown Region",
      flag: "🌐",
      fullLabel: clean === "T1" ? "🌐 Tor / Anonymous (T1)" : "🌐 Unknown Region",
    };
  }
  const flag = countryCodeToFlagEmoji(clean);
  let name = clean;
  if (/^[A-Z]{2}$/.test(clean) && regionDisplayNames) {
    try {
      name = regionDisplayNames.of(clean) || clean;
    } catch {
      name = clean;
    }
  }
  return {
    code: clean,
    name,
    flag,
    fullLabel: `${flag} ${name} (${clean})`,
  };
}

export type OperationalHealthState = {
  label: string;
  detail: string;
  tone: Tone;
};

/**
 * Computes live operational status strictly from real-time queue, pressure,
 * cooldown, minute budget, and scraper coordinator signals.
 * Historical failed imports in `last24h` or `imports.timeframes` must NOT
 * degrade the live operational status badge.
 */
export function deriveOperationalHealth(health: ImportHealth | null, loading: boolean): OperationalHealthState {
  if (!health) {
    return loading
      ? { label: "Syncing", detail: "Loading telemetry", tone: "neutral" }
      : { label: "Standby", detail: "Awaiting telemetry", tone: "neutral" };
  }

  if (health.cooldowns.activeCount > 0) {
    return {
      label: "Cooldown Active",
      detail: `${health.cooldowns.activeCount} active lock${health.cooldowns.activeCount === 1 ? "" : "s"}`,
      tone: "warn",
    };
  }

  if (health.pressure.oldestQueuedSeconds >= 180 || health.queue.pending >= 5) {
    return {
      label: "Queue Backpressure",
      detail: `${health.queue.pending} queued (${formatDuration(health.pressure.oldestQueuedSeconds)} oldest)`,
      tone: "warn",
    };
  }

  if (health.pressure.oldestRunningSeconds >= 300) {
    return {
      label: "Queue Backpressure",
      detail: `${health.queue.running} running (${formatDuration(health.pressure.oldestRunningSeconds)} oldest)`,
      tone: "warn",
    };
  }

  if (health.minuteUsage.limit > 0 && health.minuteUsage.usedRequests >= health.minuteUsage.limit) {
    return {
      label: "Budget Saturated",
      detail: `${health.minuteUsage.usedRequests}/${health.minuteUsage.limit} req/min used`,
      tone: "warn",
    };
  }

  const anyCoordinatorActive = health.coordinator.some((c) => c.active && !c.stale);
  if (anyCoordinatorActive || health.service.budgetMode === "github-active" || health.minuteUsage.budgetMode === "github-active") {
    return {
      label: "Scraper Throttled",
      detail: `Shared budget (${health.minuteUsage.limit || health.service.importRequestsPerMinute}/min)`,
      tone: "warn",
    };
  }

  if (health.queue.running > 0 || health.queue.pending > 0) {
    return {
      label: "Processing Queue",
      detail: `${health.queue.running} running · ${health.queue.pending} queued`,
      tone: "good",
    };
  }

  return {
    label: "Operational",
    detail: `Idle (${health.minuteUsage.limit || health.service.importRequestsPerMinute}/min budget)`,
    tone: "good",
  };
}

export type ImportTrendBarMetrics = {
  label: string;
  rawBucket: string;
  attempts: number;
  completed: number;
  failed: number;
  other: number;
  completedPct: number;
  failedPct: number;
  otherPct: number;
};

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Computes non-overflowing bar segment percentages for Import Pipeline trends.
 * Completed + Failed + Other (queued/in-flight/protected) never exceed 100% of the row track.
 */
export function computeImportTrendBars(rows: TrendRow[]): ImportTrendBarMetrics[] {
  if (!rows.length) return [];
  const rowTotals = rows.map((row) => {
    const completed = Math.max(0, Number(row.completed || 0));
    const failed = Math.max(0, Number(row.failed || 0));
    const attempts = Math.max(0, Number(row.attempts || 0));
    return Math.max(attempts, completed + failed);
  });
  const maxScale = Math.max(1, ...rowTotals);

  return rows.map((row) => {
    const completed = Math.max(0, Number(row.completed || 0));
    const failed = Math.max(0, Number(row.failed || 0));
    const attempts = Math.max(0, Number(row.attempts || 0));
    const totalOutcome = completed + failed;
    const other = Math.max(0, attempts - totalOutcome);

    const completedPct = Math.max(0, Math.min(100, roundOneDecimal((completed / maxScale) * 100)));
    const remainingAfterCompleted = roundOneDecimal(Math.max(0, 100 - completedPct));
    const failedPct = Math.max(
      0,
      Math.min(remainingAfterCompleted, roundOneDecimal((failed / maxScale) * 100)),
    );
    const remainingAfterFailed = roundOneDecimal(Math.max(0, remainingAfterCompleted - failedPct));
    const otherPct = Math.max(
      0,
      Math.min(remainingAfterFailed, roundOneDecimal((other / maxScale) * 100)),
    );

    const rawBucket = row.day || row.hour || "";
    const label = row.day
      ? formatShortDate(row.day)
      : String(row.hour || "").slice(11, 16) || rawBucket;

    return {
      label,
      rawBucket,
      attempts,
      completed,
      failed,
      other,
      completedPct,
      failedPct,
      otherPct,
    };
  });
}

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
    topCharacters?: Array<{ fingerprintTail?: string; targetHashFingerprint?: string; events?: number; users?: number }>;
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
      runId: "—",
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
      runId: String(item.runId || "—"),
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
    keyFingerprint: String(item.keyFingerprint || (item as Record<string, unknown>).key_fingerprint || "global"),
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
      events > 0
        ? Number(m.poorRate ?? roundOneDecimal((poor / events) * 100))
        : 0;
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

  const normalizedVitalPaths = (Array.isArray(value.webVitals?.topPaths) ? value.webVitals.topPaths : []).map(
    (row) => {
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
    },
  );

  const normalizedVitalDevices = (Array.isArray(value.webVitals?.devices) ? value.webVitals.devices : []).map(
    (dev) => {
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
    },
  );

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
    value.minuteUsage?.limit ||
      (minuteBudgetMode === "github-active" ? 6 : serviceLimit) ||
      35,
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
