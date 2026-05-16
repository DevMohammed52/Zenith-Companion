"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
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
    statuses: Record<string, number>;
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
      setHealth(body as ImportHealth);
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
          <section className="metric-grid">
            <Metric icon={Activity} label="Budget mode" value={health.service.budgetMode} detail={`${health.service.importRequestsPerMinute}/min target`} />
            <Metric icon={Clock} label="Import delay" value={`${health.service.importDelayMs}ms`} detail={`Poll every ${Math.round(health.service.pollAfterMs / 1000)}s`} />
            <Metric icon={Database} label="Queue" value={`${health.queue.running} running`} detail={`${health.queue.pending} waiting`} />
            <Metric icon={ShieldCheck} label="Cooldowns" value={String(health.cooldowns.active)} detail="Active protection locks" />
            <Metric icon={CheckCircle2} label="Completed" value={String(health.last24h.completed)} detail="Last 24 hours" />
            <Metric icon={AlertTriangle} label="Failed" value={String(health.last24h.failed)} detail={`${health.last24h.rateLimited} rate limited`} />
            <Metric icon={RefreshCw} label="Avg requests" value={String(health.last24h.avgRequestCount)} detail={`${health.last24h.avgRetryCount} retries avg`} />
            <Metric icon={Clock} label="Avg duration" value={formatDuration(health.last24h.avgDurationSeconds)} detail="Completed jobs" />
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
          </section>

          <p className="admin-footnote">Last refreshed {formatDate(health.generatedAt)}. This page intentionally excludes character names, hashes, profile values, pets, museum records, and raw import results.</p>
        </>
      ) : null}

      <style jsx>{`
        .admin-health-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 2rem;
          color: #f8fafc;
        }
        .admin-health-hero,
        .access-panel,
        .metric-card,
        .dashboard-panel {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.78), rgba(6, 8, 12, 0.96));
          border-radius: 8px;
        }
        .admin-health-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.4rem;
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
          font-size: clamp(2.2rem, 5vw, 4.2rem);
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
          font-size: 1rem;
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
          grid-template-columns: minmax(16rem, 1fr) minmax(24rem, 1.25fr);
          gap: 1rem;
          align-items: center;
          padding: 1rem;
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
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.8rem;
        }
        .metric-card {
          padding: 1rem;
        }
        .metric-value {
          margin-top: 0.55rem;
          font-size: 1.65rem;
          font-weight: 900;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }
        .dashboard-panel {
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
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding: 0.85rem 0;
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
          border: 1px dashed rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          padding: 1rem;
        }
        .admin-footnote {
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
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 560px) {
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
