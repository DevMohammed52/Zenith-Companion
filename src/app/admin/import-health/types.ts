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
    cleanupMechanism: "Indexed by created_at; queried over 15m-30d windows",
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

export {
  computeImportTrendBars,
  countryCodeToFlagEmoji,
  deriveOperationalHealth,
  deriveVitalRating,
  findFrame,
  formatCountryDisplay,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  formatShortDate,
  formatTimeOnly,
  formatVitalValue,
  statusTone,
  vitalRatingTone,
  buildMarkdownHealthReport,
  type ImportTrendBarMetrics,
  type OperationalHealthState,
} from "./utils/health-format";

export { normalizeHealth, type RawHealthInput } from "./utils/health-normalize";
