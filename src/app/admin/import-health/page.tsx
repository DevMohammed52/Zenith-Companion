"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

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

function formatDate(value?: string) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "None";
}

function formatDuration(seconds: number) {
  if (!seconds) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value || 0);
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function statusTone(status: string) {
  if (status === "complete" || status === "idle" || status === "finished") return "good";
  if (status === "failed" || status === "rate_limited") return "bad";
  if (status === "waiting_for_budget" || status === "running" || status === "started") return "warn";
  return "neutral";
}

export default function ImportHealthPage() {
  const [health, setHealth] = useState<ImportHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadHealth();
  }, []);

  const serviceState = useMemo(() => {
    if (!health) return { label: "Locked", tone: "neutral", icon: Lock };
    if (health.cooldowns.active > 0 || health.last24h.rateLimited > 0) {
      return { label: "Protected", tone: "warn", icon: ShieldCheck };
    }
    if (health.last24h.failed > 0) return { label: "Needs review", tone: "warn", icon: AlertTriangle };
    return { label: "Healthy", tone: "good", icon: CheckCircle2 };
  }, [health]);

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

  const StateIcon = serviceState.icon;

  return (
    <main className="admin-health-page">
      <section className="admin-health-hero">
        <div>
          <span className="eyebrow"><ShieldCheck size={16} /> Private operations</span>
          <h1>Import Health</h1>
          <p>Monitor the Cloudflare profile-import service without exposing profile data, hashes, or raw IdleMMO responses.</p>
        </div>
        <div className={`service-pill ${serviceState.tone}`}>
          <StateIcon size={18} />
          <span>{serviceState.label}</span>
        </div>
      </section>

      <section className="access-panel">
        <div className="access-copy">
          <Lock size={20} />
          <div>
            <h2>Access locked</h2>
            <p>This route requires the private admin password before the page loads. The browser never receives the Worker token.</p>
          </div>
        </div>
        <div className="access-controls">
          <button className="admin-button primary" type="button" onClick={() => void loadHealth()} disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
            Refresh
          </button>
        </div>
        {error ? <div className="admin-error"><AlertTriangle size={16} /> {error}</div> : null}
      </section>

      {health ? (
        <>
          <section className="health-section">
            <div className="section-heading">
              <span className="panel-title"><Activity size={17} /> Live Service</span>
              <span>{health.service.worker}</span>
            </div>
            <div className="metric-grid">
              <Metric icon={Activity} label="Budget mode" value={health.service.budgetMode} detail={`${health.service.importRequestsPerMinute}/min target`} />
              <Metric icon={Clock} label="Import delay" value={`${health.service.importDelayMs}ms`} detail={`Poll every ${Math.round(health.service.pollAfterMs / 1000)}s`} />
              <Metric icon={Database} label="Queue" value={`${health.queue.running} running`} detail={`${health.queue.pending} waiting`} />
              <Metric icon={ShieldCheck} label="Cooldowns" value={String(health.cooldowns.active)} detail="Active protection locks" />
              <Metric icon={CheckCircle2} label="Completed" value={String(health.last24h.completed)} detail="Last 24 hours" />
              <Metric icon={AlertTriangle} label="Failed" value={String(health.last24h.failed)} detail={`${health.last24h.rateLimited} rate limited`} />
              <Metric icon={RefreshCw} label="Avg requests" value={String(health.last24h.avgRequestCount)} detail={`${health.last24h.avgRetryCount} retries avg`} />
              <Metric icon={Clock} label="Avg duration" value={formatDuration(health.last24h.avgDurationSeconds)} detail="Completed jobs" />
            </div>
          </section>

          <section className="health-section">
            <div className="section-heading">
              <span className="panel-title"><Users size={17} /> Import Users & Demand</span>
              <span>Anonymous import activity only</span>
            </div>
            <div className="metric-grid">
              <Metric
                icon={Users}
                label="Active import users"
                value={formatNumber(health.demand.activeImportUsers15m)}
                detail={`${formatNumber(health.demand.activeImportUsers1h)} in the last hour`}
              />
              <Metric
                icon={TrendingUp}
                label="Unique import users"
                value={formatNumber(health.demand.uniqueImportUsers24h)}
                detail={`${formatNumber(health.demand.uniqueImportUsers7d)} in 7d - ${formatNumber(health.demand.uniqueImportUsersAllTime)} total`}
              />
              <Metric
                icon={Database}
                label="Characters requested"
                value={formatNumber(health.demand.uniqueCharacters24h)}
                detail={`${formatNumber(health.demand.uniqueCharacters7d)} in 7d - ${formatNumber(health.demand.uniqueCharactersAllTime)} total`}
              />
              <Metric
                icon={Activity}
                label="Import jobs"
                value={formatNumber(health.demand.jobsLastHour)}
                detail={`${formatNumber(health.demand.jobsLast24h)} in 24h - ${formatNumber(health.demand.jobsLast7d)} in 7d`}
              />
              <Metric
                icon={CheckCircle2}
                label="Completion rate"
                value={formatPercent(health.last24h.completionRate)}
                detail={`${formatNumber(health.last24h.completed)} complete from ${formatNumber(health.last24h.total)} jobs`}
              />
              <Metric
                icon={AlertTriangle}
                label="Failure rate"
                value={formatPercent(health.last24h.failureRate)}
                detail={`${formatNumber(health.last24h.failed)} failed - ${formatNumber(health.last24h.rateLimited)} rate limited`}
              />
              <Metric
                icon={Gauge}
                label="Oldest queued"
                value={formatDuration(health.pressure.oldestQueuedSeconds)}
                detail={`${health.queue.pending} jobs waiting now`}
              />
              <Metric
                icon={Clock}
                label="Oldest running"
                value={formatDuration(health.pressure.oldestRunningSeconds)}
                detail={`${health.queue.running} active or budget-waiting`}
              />
            </div>
          </section>

          <section className="dashboard-grid">
            <Panel title="Scraper Coordinator" icon={Activity}>
              {health.coordinator.length ? health.coordinator.map((state) => (
                <div className="state-row" key={`${state.source}-${state.runId}`}>
                  <div>
                    <strong>{state.source || "Unknown source"}</strong>
                    <span>{state.runId || "No run id"}</span>
                  </div>
                  <div className="state-meta">
                    <span className={`status-chip ${state.active ? "warn" : statusTone(state.status)}`}>
                      {state.active ? "active" : state.status || "unknown"}
                    </span>
                    <small>Seen {formatDate(state.lastSeenAt)}</small>
                  </div>
                </div>
              )) : <EmptyState text="No scraper signal is currently stored. Imports will use conservative mode." />}
            </Panel>

            <Panel title="Recent Jobs" icon={Database}>
              {health.recentJobs.length ? health.recentJobs.map((job, index) => (
                <div className="state-row" key={`${job.createdAt}-${index}`}>
                  <div>
                    <strong>{job.status}</strong>
                    <span>{job.requestCount} requests - {job.retryCount} retries</span>
                  </div>
                  <div className="state-meta">
                    <span className={`status-chip ${statusTone(job.errorCode || job.status)}`}>
                      {job.errorCode || job.budgetMode}
                    </span>
                    <small>{formatDate(job.updatedAt)}</small>
                  </div>
                </div>
              )) : <EmptyState text="No recent import jobs are stored." />}
            </Panel>

            <Panel title="Status Mix" icon={Gauge}>
              {Object.entries(health.last24h.statuses).length ? Object.entries(health.last24h.statuses).map(([status, count]) => (
                <div className="state-row compact" key={status}>
                  <div>
                    <strong>{status}</strong>
                    <span>Last 24 hours</span>
                  </div>
                  <div className="state-meta">
                    <span className={`status-chip ${statusTone(status)}`}>{formatNumber(count)}</span>
                  </div>
                </div>
              )) : <EmptyState text="No status data exists for the last 24 hours." />}
            </Panel>

            <Panel title="Metric Boundaries" icon={ShieldCheck}>
              <div className="boundary-note">
                <strong>What the counts mean</strong>
                <p>Users here means anonymous profile-import requesters. It does not count every site visitor yet because normal browsing stays local and private in the browser.</p>
              </div>
              <div className="boundary-note">
                <strong>What is still private</strong>
                <p>The dashboard never returns character hashes, names, imported profile payloads, pets, museum rows, or raw IdleMMO API responses.</p>
              </div>
            </Panel>
          </section>

          <p className="admin-footnote">Last refreshed {formatDate(health.generatedAt)}. This page intentionally excludes character names, hashes, profile values, pets, museum records, and raw import results.</p>
        </>
      ) : null}

      <style jsx global>{`
        .admin-health-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 2rem;
          color: #f8fafc;
        }
        .admin-health-hero,
        .access-panel,
        .health-section,
        .metric-card,
        .dashboard-panel {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 28rem),
            linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(6, 8, 12, 0.97));
          border-radius: 8px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }
        .admin-health-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.6rem;
        }
        .eyebrow,
        .metric-label,
        .panel-title {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #93c5fd;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        h1,
        h2,
        p {
          margin: 0;
        }
        h1 {
          margin-top: 0.6rem;
          font-size: clamp(2.6rem, 5vw, 5.2rem);
          line-height: 0.95;
        }
        .admin-health-hero p,
        .access-copy p,
        .metric-detail,
        .state-row span,
        .state-row small,
        .admin-footnote {
          color: #a8b3c7;
        }
        .admin-health-hero p {
          max-width: 52rem;
          margin-top: 0.65rem;
          font-size: 1.05rem;
        }
        .service-pill,
        .status-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: fit-content;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.88);
          color: #cbd5e1;
          font-weight: 800;
          white-space: nowrap;
        }
        .service-pill {
          padding: 0.75rem 1rem;
        }
        .good { color: #34d399; border-color: rgba(52, 211, 153, 0.35); background: rgba(16, 185, 129, 0.12); }
        .warn { color: #fbbf24; border-color: rgba(251, 191, 36, 0.34); background: rgba(245, 158, 11, 0.12); }
        .bad { color: #fb7185; border-color: rgba(251, 113, 133, 0.34); background: rgba(244, 63, 94, 0.12); }
        .neutral { color: #cbd5e1; }
        .access-panel {
          display: grid;
          grid-template-columns: minmax(16rem, 1fr) auto;
          gap: 1rem;
          align-items: center;
          padding: 1.15rem 1.25rem;
        }
        .access-copy {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .access-controls {
          display: flex;
          justify-content: flex-end;
        }
        .admin-button {
          min-height: 3rem;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: #020617;
          color: #f8fafc;
          font: inherit;
          font-weight: 800;
        }
        .admin-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0 1rem;
          cursor: pointer;
        }
        .admin-button.primary {
          border-color: rgba(56, 189, 248, 0.42);
          background: rgba(14, 116, 144, 0.22);
        }
        .admin-button.primary:hover {
          border-color: rgba(56, 189, 248, 0.72);
          background: rgba(14, 116, 144, 0.36);
        }
        .admin-button:disabled {
          cursor: wait;
          opacity: 0.7;
        }
        .admin-error {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fecdd3;
          border: 1px solid rgba(244, 63, 94, 0.3);
          background: rgba(244, 63, 94, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-weight: 800;
        }
        .health-section {
          padding: 1rem;
        }
        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.85rem;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.8rem;
        }
        .metric-card {
          min-height: 8.25rem;
          padding: 1rem;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.68), rgba(2, 6, 23, 0.72));
        }
        .metric-value {
          margin-top: 0.55rem;
          font-size: clamp(1.35rem, 1.6vw, 1.85rem);
          font-weight: 900;
          line-height: 1.05;
          overflow-wrap: anywhere;
        }
        .metric-detail {
          margin-top: 0.45rem;
          font-size: 0.9rem;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }
        .dashboard-panel {
          min-height: 11rem;
          padding: 1rem;
        }
        .panel-title {
          margin-bottom: 0.8rem;
        }
        .state-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          padding: 0.9rem 0;
        }
        .state-row.compact {
          padding: 0.68rem 0;
        }
        .state-row:first-of-type {
          border-top: 0;
        }
        .state-row > div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }
        .state-row strong,
        .state-row span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .state-meta {
          align-items: flex-end;
          text-align: right;
        }
        .status-chip {
          padding: 0.3rem 0.65rem;
          font-size: 0.78rem;
        }
        .empty-state {
          color: #94a3b8;
          border: 1px dashed rgba(148, 163, 184, 0.22);
          background: rgba(2, 6, 23, 0.42);
          border-radius: 8px;
          padding: 1rem;
        }
        .boundary-note {
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          padding: 0.9rem 0;
        }
        .boundary-note:first-of-type {
          border-top: 0;
          padding-top: 0;
        }
        .boundary-note strong {
          display: block;
          margin-bottom: 0.35rem;
        }
        .boundary-note p {
          color: #a8b3c7;
          line-height: 1.55;
        }
        .admin-footnote {
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 8px;
          background: rgba(2, 6, 23, 0.55);
          padding: 0.9rem 1rem;
          font-size: 0.9rem;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 980px) {
          .admin-health-page {
            padding: 1rem;
          }
          .admin-health-hero,
          .access-panel,
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .admin-health-hero {
            flex-direction: column;
          }
          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .access-controls {
            justify-content: stretch;
          }
          .admin-button {
            width: 100%;
          }
        }
        @media (max-width: 560px) {
          .admin-health-page {
            padding: 0.8rem;
          }
          h1 {
            font-size: 2.5rem;
          }
          .metric-grid {
            grid-template-columns: 1fr;
          }
          .state-row {
            align-items: flex-start;
            flex-direction: column;
          }
          .state-meta {
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}

function normalizeHealth(value: Partial<ImportHealth>): ImportHealth {
  const last24h = value.last24h || {
    total: 0,
    completed: 0,
    failed: 0,
    waitingForBudget: 0,
    rateLimited: 0,
    avgRequestCount: 0,
    avgRetryCount: 0,
    avgDurationSeconds: 0,
    completionRate: 0,
    failureRate: 0,
    statuses: {},
  };

  return {
    ...(value as ImportHealth),
    last24h: {
      ...last24h,
      completionRate: last24h.completionRate ?? 0,
      failureRate: last24h.failureRate ?? 0,
      statuses: last24h.statuses || {},
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
  };
}

function Metric({ icon: Icon, label, value, detail }: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric-card">
      <span className="metric-label"><Icon size={16} /> {label}</span>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: {
  icon: typeof Activity;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="panel-title"><Icon size={17} /> {title}</h2>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}
