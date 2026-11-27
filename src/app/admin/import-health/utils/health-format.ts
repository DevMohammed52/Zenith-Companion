import type {
  ImportHealth,
  TimeframeKey,
  Tone,
  TrendRow,
  WebVitalRating,
} from "../types";

export function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "-";
}

export function formatShortDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTimeOnly(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
    Number.isFinite(value) ? value : 0,
  );
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

export function vitalTargetThreshold(metricName: string): string {
  switch (metricName.toUpperCase()) {
    case "LCP":
      return "Good <= 2,500ms";
    case "CLS":
      return "Good <= 0.10";
    case "INP":
      return "Good <= 200ms";
    case "FCP":
      return "Good <= 1,800ms";
    case "TTFB":
      return "Good <= 800ms";
    default:
      return "Target <= good";
  }
}

export function statusTone(status: string): Tone {
  const normalized = (status || "").toLowerCase();
  if (
    normalized === "complete" ||
    normalized === "completed" ||
    normalized === "idle" ||
    normalized === "finished" ||
    normalized === "good"
  ) {
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
  if (
    anyCoordinatorActive ||
    health.service.budgetMode === "github-active" ||
    health.minuteUsage.budgetMode === "github-active"
  ) {
    return {
      label: "Scraper Throttled",
      detail: `Shared budget (${health.minuteUsage.limit || health.service.importRequestsPerMinute}/min)`,
      tone: "warn",
    };
  }

  if (health.queue.running > 0 || health.queue.pending > 0) {
    return {
      label: "Processing Queue",
      detail: `${health.queue.running} running | ${health.queue.pending} queued`,
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

export function roundOneDecimal(value: number): number {
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

export function buildMarkdownHealthReport(health: ImportHealth, frameKey: TimeframeKey): string {
  const status = deriveOperationalHealth(health, false);
  const usageFrame = findFrame(health.usage.timeframes, frameKey) || health.usage.timeframes[0];
  const importFrame = findFrame(health.imports.timeframes, frameKey) || health.imports.timeframes[0];
  const totalD1 = Object.values(health.databaseStats).reduce((acc, val) => acc + Number(val || 0), 0);
  const topPagesText = health.usage.topPages
    .slice(0, 5)
    .map((p) => `  - ${p.path}: ${formatNumber(p.views)} views (${formatNumber(p.users)} users)`)
    .join("\n");

  return [
    `# Zenith Operations Snapshot (${health.generatedAt})`,
    `- Status: ${status.label} (${status.detail})`,
    `- Minute Budget: ${health.minuteUsage.usedRequests}/${health.minuteUsage.limit} req/min (${health.minuteUsage.budgetMode})`,
    `- Queue: ${health.queue.running} running, ${health.queue.pending} pending, ${health.cooldowns.activeCount} cooldowns`,
    usageFrame
      ? `- Traffic (${usageFrame.label}): ${formatNumber(usageFrame.users)} users, ${formatNumber(usageFrame.sessions)} sessions, ${formatNumber(usageFrame.pageviews)} views`
      : "",
    importFrame
      ? `- Imports (${importFrame.label}): ${formatNumber(importFrame.attempts)} attempts, ${formatNumber(importFrame.completed)} completed (${formatPercent(importFrame.completionRate)}), ${formatNumber(importFrame.failed)} failed`
      : "",
    `- Errors & Vitals (30d): ${formatNumber(health.appErrors.events30d)} errors (${formatNumber(health.appErrors.events24h)} in 24h), ${formatPercent(health.webVitals.poorRate30d)} poor RUM samples`,
    `- D1 Total Rows: ${formatNumber(totalD1)}`,
    topPagesText ? `- Top Routes (30d):\n${topPagesText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
