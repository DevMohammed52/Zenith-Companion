"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Gauge,
  Globe2,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import {
  TIMEFRAME_ORDER,
  deriveOperationalHealth,
  findFrame,
  formatDate,
  formatNumber,
  type AdminTabKey,
  type AutoRefreshSeconds,
  type ImportHealth,
  type TimeframeKey,
} from "../types";
import { toneClass } from "./DashboardPrimitives";

const AUTO_REFRESH_OPTIONS: Array<{ value: AutoRefreshSeconds; label: string }> = [
  { value: 0, label: "Off" },
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
];

const TAB_ORDER: AdminTabKey[] = ["engine", "imports", "traffic", "vitals", "database"];

export function CommandHeader({
  health,
  loading,
  actionBusy,
  cacheHeader,
  selectedFrame,
  onSelectFrame,
  activeTab,
  onSelectTab,
  autoRefreshSec,
  countdownSec,
  onChangeAutoRefresh,
  onRefreshNow,
  onRunQueue,
}: {
  health: ImportHealth | null;
  loading: boolean;
  actionBusy: string | null;
  cacheHeader: string;
  selectedFrame: TimeframeKey;
  onSelectFrame: (frame: TimeframeKey) => void;
  activeTab: AdminTabKey;
  onSelectTab: (tab: AdminTabKey) => void;
  autoRefreshSec: AutoRefreshSeconds;
  countdownSec: number;
  onChangeAutoRefresh: (sec: AutoRefreshSeconds) => void;
  onRefreshNow: () => void;
  onRunQueue: () => void;
}) {
  const operationalState = deriveOperationalHealth(health, loading);
  const isCacheHit = cacheHeader.toUpperCase() === "HIT";
  const hasCacheSignal = Boolean(cacheHeader);
  const isRunningQueue = actionBusy === "process_queue";

  const activeEngineSignals = health
    ? health.queue.pending + health.queue.running + health.cooldowns.activeCount
    : 0;
  const selectedImportFrame = health
    ? findFrame(health.imports.timeframes, selectedFrame)
    : undefined;
  const selectedUsageFrame = health
    ? findFrame(health.usage.timeframes, selectedFrame)
    : undefined;
  const errorAndVitalSignals = health
    ? health.appErrors.events24h + health.webVitals.poor24h
    : 0;
  const totalD1Rows = health
    ? Object.values(health.databaseStats).reduce((sum, n) => sum + Number(n || 0), 0)
    : 0;

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < 0) return;

    let nextIndex = -1;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TAB_ORDER.length - 1;
    }

    if (nextIndex >= 0) {
      event.preventDefault();
      const nextTab = TAB_ORDER[nextIndex];
      onSelectTab(nextTab);
      const btn = document.getElementById(`tab-${nextTab}`);
      btn?.focus();
    }
  }

  return (
    <>
      <header className={styles.commandHeader}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrow}>
                <ShieldCheck size={15} />
                Operations Console
              </span>
            </div>
            <h1 className={styles.title}>Import Health &amp; Telemetry</h1>
            <p className={styles.subtitle}>
              Live worker queue controls, rate-limit budget telemetry, visitor analytics, and D1 database health.
            </p>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.segmentedGroup} role="group" aria-label="Auto-refresh interval">
              <span className={styles.segmentedLabel}>
                <Clock size={14} />
                <span>Auto{autoRefreshSec > 0 ? ` (${countdownSec}s)` : ""}</span>
              </span>
              {AUTO_REFRESH_OPTIONS.map((opt) => {
                const isActive = autoRefreshSec === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.toggleBtn} ${isActive ? styles.toggleBtnActive : ""}`}
                    aria-pressed={isActive}
                    onClick={() => onChangeAutoRefresh(opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.btn}
              disabled={Boolean(actionBusy) || loading}
              onClick={onRunQueue}
            >
              {isRunningQueue ? (
                <Loader2 size={16} className={styles.spin} />
              ) : (
                <Play size={16} />
              )}
              <span>Run Queue</span>
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={loading || Boolean(actionBusy)}
              onClick={onRefreshNow}
            >
              {loading ? (
                <Loader2 size={16} className={styles.spin} />
              ) : (
                <RefreshCw size={16} />
              )}
              <span>Refresh Now</span>
            </button>
          </div>
        </div>

        <div className={styles.statusStrip}>
          <div className={styles.badgeGroup}>
            <div className={`${styles.statusBadge} ${toneClass(operationalState.tone)}`}>
              {operationalState.tone === "good" ? (
                <CheckCircle2 size={15} />
              ) : operationalState.tone === "warn" || operationalState.tone === "bad" ? (
                <AlertTriangle size={15} />
              ) : (
                <Activity size={15} />
              )}
              <span>{operationalState.label}</span>
              <span className={styles.mono}>· {operationalState.detail}</span>
            </div>

            <div
              className={`${styles.cacheBadge} ${!hasCacheSignal || isCacheHit ? styles.toneNeutral : styles.toneGood}`}
              title={`x-admin-cache: ${cacheHeader || "LIVE"}`}
            >
              <span>{isCacheHit ? "Cache: HIT" : "LIVE"}</span>
            </div>

            {health ? (
              <div className={`${styles.cacheBadge} ${styles.toneNeutral}`}>
                <span>
                  Mode: {health.minuteUsage.budgetMode} ({health.minuteUsage.usedRequests}/{health.minuteUsage.limit} req/m)
                </span>
              </div>
            ) : null}
          </div>

          <span className={styles.panelSubtitle}>
            {health ? `Snapshot: ${formatDate(health.generatedAt)}` : "Connecting to worker..."}
          </span>
        </div>
      </header>

      <section className={styles.frameStrip} aria-label="Global timeframe selector">
        {TIMEFRAME_ORDER.map((key) => {
          const usageFrame = health ? findFrame(health.usage.timeframes, key) : undefined;
          const importFrame = health ? findFrame(health.imports.timeframes, key) : undefined;
          const label = usageFrame?.label || importFrame?.label || key;
          const users = usageFrame?.users || 0;
          const isSelected = selectedFrame === key;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.frameBtn} ${isSelected ? styles.frameBtnActive : ""}`}
              aria-pressed={isSelected}
              onClick={() => onSelectFrame(key)}
            >
              <span className={styles.frameLabel}>{label}</span>
              <strong className={styles.frameValue}>{formatNumber(users)}</strong>
              <small className={styles.frameSub}>users</small>
            </button>
          );
        })}
      </section>

      <div
        className={styles.tabBar}
        role="tablist"
        aria-label="Console sections"
        onKeyDown={handleTabKeyDown}
      >
        <button
          id="tab-engine"
          type="button"
          role="tab"
          aria-selected={activeTab === "engine"}
          aria-controls="tabpanel-engine"
          className={`${styles.tabBtn} ${activeTab === "engine" ? styles.tabBtnActive : ""}`}
          onClick={() => onSelectTab("engine")}
        >
          <Cpu size={16} />
          <span>Live Engine &amp; Queue</span>
          <span className={styles.tabCount}>{formatNumber(activeEngineSignals)}</span>
        </button>

        <button
          id="tab-imports"
          type="button"
          role="tab"
          aria-selected={activeTab === "imports"}
          aria-controls="tabpanel-imports"
          className={`${styles.tabBtn} ${activeTab === "imports" ? styles.tabBtnActive : ""}`}
          onClick={() => onSelectTab("imports")}
        >
          <BarChart3 size={16} />
          <span>Import Pipeline</span>
          <span className={styles.tabCount}>{formatNumber(selectedImportFrame?.attempts || 0)}</span>
        </button>

        <button
          id="tab-traffic"
          type="button"
          role="tab"
          aria-selected={activeTab === "traffic"}
          aria-controls="tabpanel-traffic"
          className={`${styles.tabBtn} ${activeTab === "traffic" ? styles.tabBtnActive : ""}`}
          onClick={() => onSelectTab("traffic")}
        >
          <Globe2 size={16} />
          <span>Traffic &amp; Audience</span>
          <span className={styles.tabCount}>{formatNumber(selectedUsageFrame?.pageviews || 0)}</span>
        </button>

        <button
          id="tab-vitals"
          type="button"
          role="tab"
          aria-selected={activeTab === "vitals"}
          aria-controls="tabpanel-vitals"
          className={`${styles.tabBtn} ${activeTab === "vitals" ? styles.tabBtnActive : ""}`}
          onClick={() => onSelectTab("vitals")}
        >
          <Gauge size={16} />
          <span>Errors &amp; Web Vitals</span>
          <span className={styles.tabCount}>{formatNumber(errorAndVitalSignals)}</span>
        </button>

        <button
          id="tab-database"
          type="button"
          role="tab"
          aria-selected={activeTab === "database"}
          aria-controls="tabpanel-database"
          className={`${styles.tabBtn} ${activeTab === "database" ? styles.tabBtnActive : ""}`}
          onClick={() => onSelectTab("database")}
        >
          <Database size={16} />
          <span>D1 &amp; Infrastructure</span>
          <span className={styles.tabCount}>{formatNumber(totalD1Rows)}</span>
        </button>
      </div>
    </>
  );
}
