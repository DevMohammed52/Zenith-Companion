"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  Globe2,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

type TimeframeKey = "15m" | "1h" | "24h" | "48h" | "7d" | "14d" | "30d" | "all";

type UsageFrame = {
  key: TimeframeKey;
  label: string;
  events: number;
  pageviews: number;
  heartbeats: number;
  users: number;
  sessions: number;
  pageviewsPerSession: number;
};

type ImportFrame = {
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

type TrendRow = {
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

type ImportHealth = {
  ok: boolean;
  generatedAt: string;
  service: {
    worker: string;
    budgetMode: string;
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
  cooldowns: {
    active: number;
  };
  last24h: {
    total: number;
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
  coordinator: Array<{
    active: boolean;
    status: string;
    source: string;
    runId: string;
    startedAt: string;
    finishedAt: string;
    lastSeenAt: string;
    expiresAt: string;
    stale: boolean;
  }>;
  recentJobs: Array<{
    status: string;
    requestCount: number;
    retryCount: number;
    errorCode: string;
    budgetMode: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    expired: boolean;
  }>;
};

const TIMEFRAME_ORDER: TimeframeKey[] = ["15m", "1h", "24h", "48h", "7d", "14d", "30d", "all"];

function formatDate(value?: string) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "None";
}

function formatShortDate(value?: string) {
  if (!value) return "None";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDuration(seconds: number) {
  if (!seconds) return "0s";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remaining = rounded % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value || 0);
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function statusTone(status: string) {
  if (status === "complete" || status === "idle" || status === "finished" || status === "queued") return "good";
  if (status === "failed" || status === "rate_limited" || status === "turnstile_failed" || status === "expired") return "bad";
  if (status === "waiting_for_budget" || status === "running" || status === "started" || status === "queue_busy" || status === "cooldown") return "warn";
  return "neutral";
}

function findFrame<T extends { key: TimeframeKey }>(frames: T[], key: TimeframeKey): T | undefined {
  return frames.find((frame) => frame.key === key);
}

function maxValue(rows: TrendRow[], keys: Array<keyof TrendRow>) {
  return Math.max(1, ...rows.flatMap((row) => keys.map((key) => Number(row[key] || 0))));
}

export default function ImportHealthPage() {
  const [health, setHealth] = useState<ImportHealth | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<TimeframeKey>("24h");
  const [trendMode, setTrendMode] = useState<"daily" | "hourly">("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadHealth();
  }, []);

  const serviceState = useMemo(() => {
    if (!health) return loading ? { label: "Loading", tone: "neutral", icon: Loader2 } : { label: "Locked", tone: "neutral", icon: Lock };
    const selectedImport = findFrame(health.imports.timeframes, selectedFrame);
    if (health.cooldowns.active > 0 || Number(selectedImport?.rateLimited || 0) > 0) {
      return { label: "Protected", tone: "warn", icon: ShieldCheck };
    }
    if (Number(selectedImport?.failed || 0) > 0) return { label: "Needs review", tone: "warn", icon: AlertTriangle };
    return { label: "Healthy", tone: "good", icon: CheckCircle2 };
  }, [health, loading, selectedFrame]);

  async function loadHealth() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/import-health", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error?.message || "Could not load import health.");
      }
      setHealth(normalizeHealth(body));
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "Could not load import health.");
    } finally {
      setLoading(false);
    }
  }

  const importFrame = health ? findFrame(health.imports.timeframes, selectedFrame) || health.imports.timeframes[0] : undefined;
  const usageFrame = health ? findFrame(health.usage.timeframes, selectedFrame) || health.usage.timeframes[0] : undefined;
  const selectedLabel = importFrame?.label || usageFrame?.label || selectedFrame;
  const StateIcon = serviceState.icon;
  const isInitialLoading = loading && !health && !error;

  return (
    <main className="admin-health-page">
      <section className="admin-health-hero">
        <div className="hero-copy">
          <span className="eyebrow"><ShieldCheck size={16} /> Private operations</span>
          <h1>Import Health</h1>
          <p>Permanent anonymous import analytics, live queue pressure, and site traffic signals for Zenith Companion.</p>
        </div>
        <div className="hero-actions">
          <div className={`service-pill ${serviceState.tone}`}>
            <StateIcon size={18} className={!health && loading ? "spin" : undefined} />
            <span>{serviceState.label}</span>
          </div>
          <button className="admin-button primary" type="button" onClick={() => void loadHealth()} disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
            Refresh
          </button>
        </div>
      </section>

      <section className="frame-strip" aria-label="Dashboard time range">
        {TIMEFRAME_ORDER.map((key) => {
          const frame = health ? findFrame(health.imports.timeframes, key) || findFrame(health.usage.timeframes, key) : undefined;
          return (
            <button
              key={key}
              type="button"
              className={selectedFrame === key ? "active" : ""}
              aria-pressed={selectedFrame === key}
              aria-label={`Show ${frame?.label || key} admin metrics`}
              onClick={() => setSelectedFrame(key)}
            >
              <span>{frame?.label || key}</span>
              <strong>{formatNumber(findFrame(health?.usage.timeframes || [], key)?.users || 0)}</strong>
              <small>site users</small>
            </button>
          );
        })}
      </section>

      <section className="access-panel">
        <div className="access-copy">
          <Lock size={20} />
          <div>
            <h2>Access locked</h2>
            <p>The page is served through the private admin proxy. The browser never receives the Worker token.</p>
          </div>
        </div>
        <div className="access-copy">
          <ShieldCheck size={20} />
          <div>
            <h2>Privacy boundary</h2>
            <p>Stored analytics use anonymous fingerprints and aggregate metadata. Profile payloads, raw hashes, names, pets, and museum rows are not kept.</p>
          </div>
        </div>
        {error ? <div className="admin-error"><AlertTriangle size={16} /> {error}</div> : null}
      </section>

      {isInitialLoading ? (
        <section className="admin-loading" aria-live="polite" aria-label="Loading import health">
          <Loader2 size={18} className="spin" />
          <div>
            <h2>Loading operational data</h2>
            <p>Requesting private import and traffic metrics from the admin proxy.</p>
          </div>
        </section>
      ) : null}

      {health && importFrame && usageFrame ? (
        <>
          <section className="health-section hero-metrics">
            <Metric icon={Users} label={`${selectedLabel} site users`} value={formatNumber(usageFrame.users)} detail={`${formatNumber(usageFrame.sessions)} sessions, ${formatNumber(usageFrame.pageviews)} pageviews`} />
            <Metric icon={Database} label={`${selectedLabel} imports`} value={formatNumber(importFrame.attempts)} detail={`${formatNumber(importFrame.completed)} complete, ${formatNumber(importFrame.failed)} failed`} />
            <Metric icon={CheckCircle2} label="Import success" value={formatPercent(importFrame.completionRate)} detail={`${formatDuration(importFrame.avgDurationSeconds)} avg complete time`} tone={importFrame.completionRate >= 90 || importFrame.attempts === 0 ? "good" : "warn"} />
            <Metric icon={Gauge} label="Queue pressure" value={`${health.queue.running} running`} detail={`${health.queue.pending} waiting, ${formatDuration(health.pressure.oldestQueuedSeconds)} oldest queued`} tone={health.queue.pending > 0 ? "warn" : "neutral"} />
          </section>

          <section className="health-layout">
            <Panel title="Import Reliability" icon={Activity} detail={`Selected range: ${selectedLabel}`}>
              <div className="metric-grid compact">
                <Metric icon={TrendingUp} label="Attempts" value={formatNumber(importFrame.attempts)} detail={`${formatNumber(importFrame.users)} users, ${formatNumber(importFrame.characters)} characters`} />
                <Metric icon={CheckCircle2} label="Completed" value={formatNumber(importFrame.completed)} detail={`${formatPercent(importFrame.completionRate)} completion`} tone="good" />
                <Metric icon={XCircle} label="Failed" value={formatNumber(importFrame.failed)} detail={`${formatPercent(importFrame.failureRate)} failure`} tone={importFrame.failed > 0 ? "bad" : "neutral"} />
                <Metric icon={ShieldCheck} label="Protected" value={formatNumber(importFrame.rateLimited + importFrame.queueBusy + importFrame.cooldown)} detail={`${formatNumber(importFrame.rateLimited)} rate limited`} tone={importFrame.rateLimited > 0 ? "warn" : "neutral"} />
                <Metric icon={Clock} label="Avg duration" value={formatDuration(importFrame.avgDurationSeconds)} detail={`${formatDuration(importFrame.maxDurationSeconds)} max`} />
                <Metric icon={RefreshCw} label="Requests" value={formatNumber(importFrame.avgRequestCount)} detail={`${formatNumber(importFrame.avgRetryCount)} retries avg`} />
              </div>
            </Panel>

            <Panel title="Site Usage" icon={BarChart3} detail={`Selected range: ${selectedLabel}`}>
              <div className="metric-grid compact">
                <Metric icon={Users} label="Users" value={formatNumber(usageFrame.users)} detail={`${formatNumber(health.usage.activeUsers15m)} active in 15m`} />
                <Metric icon={Activity} label="Pageviews" value={formatNumber(usageFrame.pageviews)} detail={`${formatNumber(usageFrame.heartbeats)} heartbeat events`} />
                <Metric icon={Database} label="Sessions" value={formatNumber(usageFrame.sessions)} detail={`${formatNumber(usageFrame.pageviewsPerSession)} views/session`} />
                <Metric icon={Globe2} label="All-time users" value={formatNumber(health.usage.uniqueUsersAllTime)} detail={`${formatNumber(health.usage.uniqueUsers30d)} in 30d`} />
              </div>
            </Panel>
          </section>

          <section className="dashboard-grid">
            <Panel
              title="Traffic Trend"
              icon={BarChart3}
              detail={trendMode === "daily" ? "Last 30 days" : "Last 24 hours"}
              action={(
                <div className="mini-toggle">
                  <button type="button" className={trendMode === "daily" ? "active" : ""} aria-pressed={trendMode === "daily"} onClick={() => setTrendMode("daily")}>Daily</button>
                  <button type="button" className={trendMode === "hourly" ? "active" : ""} aria-pressed={trendMode === "hourly"} onClick={() => setTrendMode("hourly")}>Hourly</button>
                </div>
              )}
            >
              <TrendBars rows={trendMode === "daily" ? health.usage.daily : health.usage.hourly} keys={["pageviews", "users"]} labels={["Views", "Users"]} />
            </Panel>

            <Panel title="Import Trend" icon={Database} detail={trendMode === "daily" ? "Last 30 days" : "Last 24 hours"}>
              <TrendBars rows={trendMode === "daily" ? health.imports.daily : health.imports.hourly} keys={["attempts", "completed", "failed"]} labels={["Attempts", "Done", "Fail"]} />
            </Panel>

            <Panel title="Top Pages" icon={Activity} detail="Last 30 days">
              <RankList rows={health.usage.topPages.map((page) => ({ label: page.path, value: page.views, meta: `${formatNumber(page.users)} users` }))} empty="No pageview data yet." />
            </Panel>

            <Panel title="Audience" icon={Globe2} detail="Last 30 days">
              <div className="split-grid">
                <RankList rows={health.usage.countries.map((row) => ({ label: row.country, value: row.users, meta: `${formatNumber(row.events)} events` }))} empty="No country data yet." />
                <RankList rows={health.usage.timezones.map((row) => ({ label: row.timezone, value: row.users, meta: "users" }))} empty="No timezone data yet." />
              </div>
            </Panel>

            <Panel title="Devices & Browsers" icon={Smartphone} detail="Last 30 days">
              <div className="split-grid">
                <RankList rows={health.usage.devices.map((row) => ({ label: row.type, value: row.users, meta: "users" }))} empty="No device data yet." />
                <RankList rows={health.usage.browsers.map((row) => ({ label: row.family, value: row.users, meta: "users" }))} empty="No browser data yet." />
              </div>
            </Panel>

            <Panel title="Import Diagnostics" icon={AlertTriangle} detail="Last 30 days">
              <div className="split-grid">
                <RankList rows={health.imports.errors.map((row) => ({ label: row.code, value: row.count, meta: "events" }))} empty="No errors recorded." />
                <RankList rows={health.imports.budgets.map((row) => ({ label: row.mode, value: row.events, meta: "events" }))} empty="No budget data yet." />
              </div>
            </Panel>

            <Panel title="Busiest Imported Characters" icon={Database} detail="Anonymous fingerprint tails">
              <RankList rows={health.imports.busiestTargets.map((row) => ({ label: row.fingerprintTail || "unknown", value: row.events, meta: `${formatNumber(row.users)} users` }))} empty="No durable import events yet." />
            </Panel>

            <Panel title="Referrers" icon={TrendingUp} detail="Last 30 days">
              <RankList rows={health.usage.referrers.map((row) => ({ label: row.host, value: row.users, meta: "users" }))} empty="No external referrers recorded." />
            </Panel>

            <Panel title="Scraper Coordinator" icon={Activity} detail="API budget awareness">
              {health.coordinator.length ? health.coordinator.map((state) => (
                <StateRow
                  key={`${state.source}-${state.runId}`}
                  title={state.source || "Unknown source"}
                  subtitle={state.runId || "No run id"}
                  chip={state.active ? "active" : state.status || "unknown"}
                  tone={state.active ? "warn" : statusTone(state.status)}
                  meta={`Seen ${formatDate(state.lastSeenAt)}`}
                />
              )) : <EmptyState text="No scraper signal is currently stored. Imports use conservative mode." />}
            </Panel>

            <Panel title="Recent Import Events" icon={Clock} detail="Permanent event log">
              {health.imports.recentEvents.length ? health.imports.recentEvents.map((event, index) => (
                <StateRow
                  key={`${event.createdAt}-${index}`}
                  title={event.eventType}
                  subtitle={`${event.requestCount} requests, ${event.retryCount} retries${event.durationSeconds ? `, ${formatDuration(event.durationSeconds)}` : ""}`}
                  chip={event.errorCode || event.status || event.budgetMode}
                  tone={statusTone(event.errorCode || event.eventType)}
                  meta={formatDate(event.createdAt)}
                />
              )) : <EmptyState text="No durable import events have been recorded yet." />}
            </Panel>

            <Panel title="Live Job Rows" icon={Database} detail="Temporary 1-hour import jobs">
              {health.recentJobs.length ? health.recentJobs.map((job, index) => (
                <StateRow
                  key={`${job.createdAt}-${index}`}
                  title={job.status}
                  subtitle={`${job.requestCount} requests, ${job.retryCount} retries`}
                  chip={job.errorCode || job.budgetMode}
                  tone={statusTone(job.errorCode || job.status)}
                  meta={formatDate(job.updatedAt)}
                />
              )) : <EmptyState text="No temporary import jobs are currently stored." />}
            </Panel>

            <Panel title="Metric Boundaries" icon={ShieldCheck} detail="What this page can and cannot prove">
              <div className="boundary-note">
                <strong>Permanent import analytics start after migration 0003.</strong>
                <p>Old temporary jobs were deleted after their one-hour TTL, so true all-time import history starts once the new event table is deployed.</p>
              </div>
              <div className="boundary-note">
                <strong>Traffic analytics are anonymous.</strong>
                <p>Users, sessions, countries, pages, devices, browsers, referrers, and timezones are counted from browser events and Cloudflare metadata.</p>
              </div>
              <div className="boundary-note">
                <strong>Profile data remains temporary.</strong>
                <p>Imported profiles still return to the browser only. The durable table stores operational events, not profile names, pets, museum items, raw hashes, or IdleMMO API responses.</p>
              </div>
            </Panel>
          </section>

          <p className="admin-footnote">Last refreshed {formatDate(health.generatedAt)}. Selected range: {selectedLabel}. Worker: {health.service.worker}, budget mode: {health.service.budgetMode}, target: {health.service.importRequestsPerMinute}/min.</p>
        </>
      ) : null}

      <style jsx global>{`
        .admin-health-page {
          --admin-bg: #090b0f;
          --admin-panel: #11151b;
          --admin-panel-2: #0d1117;
          --admin-border: rgba(210, 218, 230, 0.11);
          --admin-border-strong: rgba(210, 218, 230, 0.2);
          --admin-text: #f2f5f8;
          --admin-muted: #9aa4b2;
          --admin-soft: #c8d0da;
          --admin-accent: #8fb7ff;
          --admin-good: #77d69e;
          --admin-warn: #e5bd62;
          --admin-bad: #ee7b8a;
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 0.9rem;
          box-sizing: border-box;
          min-height: 100vh;
          padding: clamp(0.85rem, 1.8vw, 1.4rem);
          color: var(--admin-text);
          background: var(--admin-bg);
        }

        .admin-health-hero,
        .frame-strip,
        .access-panel,
        .health-section,
        .metric-card,
        .dashboard-panel,
        .admin-loading,
        .admin-footnote {
          border: 1px solid var(--admin-border);
          border-radius: 7px;
          background: var(--admin-panel);
          box-shadow: none;
        }

        .admin-health-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 1rem;
          padding: 1.15rem;
        }

        .hero-copy {
          max-width: 68rem;
        }

        .admin-health-page .eyebrow,
        .admin-health-page .metric-label,
        .admin-health-page .panel-title {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--admin-soft);
          font-size: 0.72rem;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .admin-health-page h1 {
          margin-top: 0.45rem;
          color: var(--admin-text);
          font-size: clamp(2.2rem, 4vw, 3.85rem);
          line-height: 0.98;
        }

        .admin-health-page h2,
        .admin-health-page p {
          color: inherit;
        }

        .admin-health-hero p,
        .access-copy p,
        .metric-detail,
        .state-row span,
        .state-row small,
        .admin-footnote,
        .panel-detail,
        .boundary-note p,
        .rank-row small {
          color: var(--admin-muted);
        }

        .admin-health-hero p {
          max-width: 52rem;
          margin-top: 0.55rem;
          font-size: 0.98rem;
          line-height: 1.55;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .service-pill,
        .status-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: fit-content;
          border-color: var(--admin-border-strong);
          border-radius: 999px;
          background: #0b0f14;
          color: var(--admin-soft);
          font-weight: 800;
          box-shadow: none;
          white-space: nowrap;
        }

        .service-pill {
          min-height: 2.75rem;
          padding: 0 0.85rem;
        }

        .admin-health-page .good {
          border-color: rgba(119, 214, 158, 0.34);
          background: #0e1913;
          color: var(--admin-good);
        }

        .admin-health-page .warn {
          border-color: rgba(229, 189, 98, 0.34);
          background: #19150b;
          color: var(--admin-warn);
        }

        .admin-health-page .bad {
          border-color: rgba(238, 123, 138, 0.34);
          background: #1a1013;
          color: var(--admin-bad);
        }

        .admin-health-page .neutral {
          color: var(--admin-soft);
        }

        .admin-button,
        .frame-strip button,
        .mini-toggle button {
          min-height: 2.85rem;
          border-color: var(--admin-border);
          border-radius: 7px;
          background: #0b0f14;
          color: var(--admin-text);
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
        }

        .admin-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0 1rem;
        }

        .admin-button.primary,
        .frame-strip button.active,
        .mini-toggle button.active {
          border-color: rgba(143, 183, 255, 0.45);
          background: #111a27;
          color: #ffffff;
        }

        .admin-button:focus-visible,
        .frame-strip button:focus-visible,
        .mini-toggle button:focus-visible {
          outline: 2px solid rgba(143, 183, 255, 0.72);
          outline-offset: 3px;
        }

        .admin-button:active,
        .frame-strip button:active,
        .mini-toggle button:active {
          transform: scale(0.99);
        }

        .frame-strip {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 0;
          overflow: hidden;
          padding: 0;
        }

        .frame-strip button {
          display: grid;
          grid-template-columns: 1fr;
          align-content: center;
          gap: 0.1rem;
          min-height: 4.35rem;
          border-width: 0 1px 0 0;
          border-radius: 0;
          background: transparent;
          padding: 0.65rem 0.7rem;
          text-align: left;
        }

        .frame-strip button:last-child {
          border-right: 0;
        }

        .frame-strip button span {
          color: var(--admin-soft);
          font-size: 0.76rem;
        }

        .frame-strip button strong {
          color: var(--admin-text);
          font-size: 1.12rem;
        }

        .frame-strip button small {
          color: var(--admin-muted);
        }

        .access-panel {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          padding: 0;
          gap: 0;
          overflow: hidden;
        }

        .access-copy {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          min-width: 0;
          padding: 0.95rem;
          border-right: 1px solid var(--admin-border);
        }

        .access-copy:last-of-type {
          border-right: 0;
        }

        .access-copy svg {
          color: var(--admin-accent);
        }

        .access-copy h2 {
          color: var(--admin-text);
          font-size: 0.95rem;
        }

        .admin-error {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.85rem;
          border-radius: 7px;
          border-color: rgba(238, 123, 138, 0.34);
          background: #1a1013;
          padding: 0.75rem 1rem;
          color: #ffd7dc;
          font-weight: 800;
        }

        .admin-loading {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
        }

        .admin-loading svg {
          color: var(--admin-accent);
        }

        .admin-loading h2 {
          margin: 0;
          font-size: 1rem;
        }

        .admin-loading p {
          margin-top: 0.25rem;
          color: var(--admin-muted);
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          overflow: hidden;
          padding: 0;
        }

        .hero-metrics .metric-card {
          border-width: 0 1px 0 0;
          border-radius: 0;
        }

        .hero-metrics .metric-card:last-child {
          border-right: 0;
        }

        .health-layout,
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .dashboard-panel {
          min-height: 11rem;
          padding: 1rem;
        }

        .panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.8rem;
          padding-bottom: 0.7rem;
          border-bottom: 1px solid var(--admin-border);
        }

        .panel-title {
          color: var(--admin-text);
        }

        .panel-detail {
          text-transform: none;
          letter-spacing: 0;
          font-weight: 650;
        }

        .metric-card {
          min-height: 7.1rem;
          padding: 0.9rem;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .metric-grid.compact {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .metric-value {
          color: var(--admin-text);
          font-size: clamp(1.25rem, 1.45vw, 1.72rem);
          font-weight: 850;
        }

        .metric-detail {
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .mini-toggle {
          display: inline-flex;
          gap: 0;
          overflow: hidden;
          border: 1px solid var(--admin-border);
          border-radius: 7px;
        }

        .mini-toggle button {
          min-height: 2.2rem;
          border-width: 0 1px 0 0;
          border-radius: 0;
          background: transparent;
        }

        .mini-toggle button:last-child {
          border-right: 0;
        }

        .trend-label {
          color: var(--admin-soft);
        }

        .trend-bars {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .trend-row {
          display: grid;
          grid-template-columns: 5rem 1fr;
          align-items: center;
          gap: 0.75rem;
        }

        .trend-stack {
          display: flex;
          height: 1.7rem;
          overflow: hidden;
          border-color: var(--admin-border);
          border-radius: 5px;
          background: #0b0f14;
        }

        .trend-stack span {
          display: block;
          min-width: 2px;
        }

        .trend-stack span:nth-child(1) {
          background: #7aa7ee;
        }

        .trend-stack span:nth-child(2) {
          background: #70c695;
        }

        .trend-stack span:nth-child(3) {
          background: #dd7684;
        }

        .trend-legend {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
          margin-bottom: 0.7rem;
          color: var(--admin-muted);
          font-size: 0.82rem;
        }

        .trend-legend span {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .trend-legend i {
          width: 0.65rem;
          height: 0.65rem;
          border-radius: 999px;
          background: #7aa7ee;
        }

        .trend-legend span:nth-child(2) i {
          background: #70c695;
        }

        .trend-legend span:nth-child(3) i {
          background: #dd7684;
        }

        .rank-row,
        .state-row,
        .boundary-note {
          border-top: 1px solid var(--admin-border);
          border-color: var(--admin-border);
          padding: 0.72rem 0;
        }

        .rank-row:first-child,
        .state-row:first-child,
        .boundary-note:first-of-type {
          border-top: 0;
          padding-top: 0;
        }

        .rank-list {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .rank-row-main,
        .state-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .rank-row strong,
        .state-row strong,
        .boundary-note strong {
          color: var(--admin-text);
        }

        .rank-row strong,
        .state-row strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rank-bar {
          height: 0.38rem;
          margin-top: 0.45rem;
          overflow: hidden;
          border-radius: 999px;
          background: #0b0f14;
        }

        .rank-bar span {
          display: block;
          height: 100%;
          background: #7aa7ee;
        }

        .state-row > div {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }

        .state-meta {
          align-items: flex-end;
          text-align: right;
        }

        .status-chip {
          padding: 0.3rem 0.65rem;
          font-size: 0.78rem;
        }

        .split-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .empty-state {
          border-color: var(--admin-border-strong);
          border-radius: 7px;
          background: #0b0f14;
          padding: 1rem;
          color: var(--admin-muted);
        }

        .boundary-note strong {
          display: block;
          margin-bottom: 0.35rem;
        }

        .boundary-note p {
          line-height: 1.55;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .admin-footnote {
          padding: 0.85rem 1rem;
          font-size: 0.86rem;
        }

        @media (hover: hover) {
          .admin-button:not(:disabled):hover,
          .frame-strip button:hover,
          .mini-toggle button:hover {
            border-color: rgba(143, 183, 255, 0.42);
            background: #111821;
          }
        }

        @media (max-width: 1200px) {
          .frame-strip {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .frame-strip button:nth-child(4n) {
            border-right: 0;
          }

          .frame-strip button:nth-child(n + 5) {
            border-top: 1px solid var(--admin-border);
          }
        }

        @media (max-width: 920px) {
          .admin-health-page {
            padding: 0.9rem;
          }

          .admin-health-hero,
          .access-panel,
          .health-layout,
          .dashboard-grid,
          .split-grid {
            grid-template-columns: 1fr;
          }

          .hero-actions {
            justify-content: flex-start;
          }

          .access-copy {
            border-right: 0;
            border-bottom: 1px solid var(--admin-border);
          }

          .access-copy:last-of-type {
            border-bottom: 0;
          }
        }

        @media (max-width: 560px) {
          .admin-health-page {
            padding: 0.75rem;
          }

          .admin-health-page h1 {
            font-size: 2.1rem;
          }

          .frame-strip {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x proximity;
          }

          .frame-strip button {
            flex: 0 0 8rem;
            border-right: 1px solid var(--admin-border);
            border-top: 0 !important;
            scroll-snap-align: start;
          }

          .frame-strip button:last-child {
            border-right: 0;
          }

          .hero-metrics,
          .metric-grid,
          .metric-grid.compact {
            grid-template-columns: 1fr;
          }

          .hero-metrics .metric-card {
            border-width: 0 0 1px;
          }

          .hero-metrics .metric-card:last-child {
            border-bottom: 0;
          }

          .panel-head {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

function normalizeHealth(value: Partial<ImportHealth>): ImportHealth {
  const usageFrames = Array.isArray(value.usage?.timeframes) ? value.usage.timeframes : [];
  const importFrames = Array.isArray(value.imports?.timeframes) ? value.imports.timeframes : [];

  return {
    ...(value as ImportHealth),
    ok: Boolean(value.ok),
    generatedAt: value.generatedAt || new Date().toISOString(),
    service: value.service || {
      worker: "unknown",
      budgetMode: "unknown",
      importRequestsPerMinute: 0,
      pollAfterMs: 0,
      importDelayMs: 0,
      jobTtlMinutes: 0,
    },
    active: value.active || {
      queued: 0,
      running: 0,
    },
    queue: value.queue || {
      pending: value.active?.queued || 0,
      running: value.active?.running || 0,
    },
    cooldowns: value.cooldowns || {
      active: 0,
    },
    last24h: {
      total: value.last24h?.total || 0,
      completed: value.last24h?.completed || 0,
      failed: value.last24h?.failed || 0,
      waitingForBudget: value.last24h?.waitingForBudget || 0,
      rateLimited: value.last24h?.rateLimited || 0,
      avgRequestCount: value.last24h?.avgRequestCount || 0,
      avgRetryCount: value.last24h?.avgRetryCount || 0,
      avgDurationSeconds: value.last24h?.avgDurationSeconds || 0,
      completionRate: value.last24h?.completionRate || 0,
      failureRate: value.last24h?.failureRate || 0,
      statuses: value.last24h?.statuses || {},
    },
    demand: value.demand || {
      jobsLastHour: 0,
      jobsLast24h: 0,
      jobsLast7d: 0,
      activeImportUsers15m: 0,
      activeImportUsers1h: 0,
      uniqueImportUsers24h: 0,
      uniqueImportUsers7d: 0,
      uniqueImportUsersAllTime: 0,
      uniqueCharacters24h: 0,
      uniqueCharacters7d: 0,
      uniqueCharactersAllTime: 0,
    },
    pressure: value.pressure || {
      oldestQueuedSeconds: 0,
      oldestRunningSeconds: 0,
    },
    usage: {
      activeUsers15m: value.usage?.activeUsers15m || 0,
      activeUsers1h: value.usage?.activeUsers1h || 0,
      uniqueUsers24h: value.usage?.uniqueUsers24h || 0,
      uniqueUsers7d: value.usage?.uniqueUsers7d || 0,
      uniqueUsers30d: value.usage?.uniqueUsers30d || 0,
      uniqueUsersAllTime: value.usage?.uniqueUsersAllTime || 0,
      sessions24h: value.usage?.sessions24h || 0,
      sessions7d: value.usage?.sessions7d || 0,
      sessions30d: value.usage?.sessions30d || 0,
      events24h: value.usage?.events24h || 0,
      pageviews24h: value.usage?.pageviews24h || 0,
      pageviewsPerSession24h: value.usage?.pageviewsPerSession24h || 0,
      timeframes: usageFrames.length ? usageFrames : fallbackUsageFrames(value),
      daily: value.usage?.daily || [],
      hourly: value.usage?.hourly || [],
      topPages: value.usage?.topPages || [],
      devices: value.usage?.devices || [],
      referrers: value.usage?.referrers || [],
      countries: value.usage?.countries || [],
      browsers: value.usage?.browsers || [],
      timezones: value.usage?.timezones || [],
    },
    imports: {
      timeframes: importFrames.length ? importFrames : fallbackImportFrames(value),
      daily: value.imports?.daily || [],
      hourly: value.imports?.hourly || [],
      errors: value.imports?.errors || [],
      budgets: value.imports?.budgets || [],
      busiestTargets: value.imports?.busiestTargets || [],
      recentEvents: value.imports?.recentEvents || [],
    },
    coordinator: value.coordinator || [],
    recentJobs: value.recentJobs || [],
  };
}

function fallbackUsageFrames(value: Partial<ImportHealth>): UsageFrame[] {
  return TIMEFRAME_ORDER.map((key) => ({
    key,
    label: key,
    events: key === "24h" ? value.usage?.events24h || 0 : 0,
    pageviews: key === "24h" ? value.usage?.pageviews24h || 0 : 0,
    heartbeats: 0,
    users: key === "24h" ? value.usage?.uniqueUsers24h || 0 : key === "7d" ? value.usage?.uniqueUsers7d || 0 : key === "all" ? value.usage?.uniqueUsersAllTime || 0 : 0,
    sessions: key === "24h" ? value.usage?.sessions24h || 0 : key === "7d" ? value.usage?.sessions7d || 0 : 0,
    pageviewsPerSession: key === "24h" ? value.usage?.pageviewsPerSession24h || 0 : 0,
  }));
}

function fallbackImportFrames(value: Partial<ImportHealth>): ImportFrame[] {
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
    users: key === "24h" ? value.demand?.uniqueImportUsers24h || 0 : key === "7d" ? value.demand?.uniqueImportUsers7d || 0 : key === "all" ? value.demand?.uniqueImportUsersAllTime || 0 : 0,
    characters: key === "24h" ? value.demand?.uniqueCharacters24h || 0 : key === "7d" ? value.demand?.uniqueCharacters7d || 0 : key === "all" ? value.demand?.uniqueCharactersAllTime || 0 : 0,
    avgDurationSeconds: key === "24h" ? value.last24h?.avgDurationSeconds || 0 : 0,
    maxDurationSeconds: 0,
    avgRequestCount: key === "24h" ? value.last24h?.avgRequestCount || 0 : 0,
    avgRetryCount: key === "24h" ? value.last24h?.avgRetryCount || 0 : 0,
    completionRate: key === "24h" ? value.last24h?.completionRate || 0 : 0,
    failureRate: key === "24h" ? value.last24h?.failureRate || 0 : 0,
  }));
}

function Metric({ icon: Icon, label, value, detail, tone = "neutral" }: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <span className="metric-label"><Icon size={16} /> {label}</span>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function Panel({ icon: Icon, title, detail, action, children }: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="dashboard-panel">
      <div className="panel-head">
        <h2 className="panel-title"><Icon size={17} /> {title}<span className="panel-detail">{detail}</span></h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TrendBars({ rows, keys, labels }: {
  rows: TrendRow[];
  keys: Array<keyof TrendRow>;
  labels: string[];
}) {
  if (!rows.length) return <EmptyState text="No trend data has been recorded yet." />;
  const max = maxValue(rows, keys);
  const visibleRows = rows.slice(-14);
  return (
    <div className="trend-bars">
      <div className="trend-legend">
        {labels.map((label) => <span key={label}><i /> {label}</span>)}
      </div>
      {visibleRows.map((row) => (
        <div className="trend-row" key={row.day || row.hour}>
          <span className="trend-label">{row.day ? formatShortDate(row.day) : String(row.hour || "").slice(11, 16)}</span>
          <div className="trend-stack" title={`${row.day || row.hour}`}>
            {keys.map((key) => {
              const value = Number(row[key] || 0);
              return <span key={String(key)} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankList({ rows, empty }: {
  rows: Array<{ label: string; value: number; meta: string }>;
  empty: string;
}) {
  if (!rows.length) return <EmptyState text={empty} />;
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="rank-list">
      {rows.slice(0, 8).map((row) => (
        <div className="rank-row" key={row.label}>
          <div className="rank-row-main">
            <strong title={row.label}>{row.label || "Unknown"}</strong>
            <small>{formatNumber(row.value)} {row.meta}</small>
          </div>
          <div className="rank-bar"><span style={{ width: `${Math.max(3, (row.value / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function StateRow({ title, subtitle, chip, tone, meta }: {
  title: string;
  subtitle: string;
  chip: string;
  tone: string;
  meta: string;
}) {
  return (
    <div className="state-row">
      <div>
        <strong title={title}>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className="state-meta">
        <span className={`status-chip ${tone}`}>{chip || "none"}</span>
        <small>{meta}</small>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}
