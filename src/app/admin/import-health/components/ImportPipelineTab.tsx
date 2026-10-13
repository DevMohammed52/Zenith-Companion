"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import {
  computeImportTrendBars,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  statusTone,
  type ImportFrame,
  type ImportHealth,
  type TimeframeKey,
} from "../types";
import { EmptyBlock, MetricCard, Panel, toneClass } from "./DashboardPrimitives";

export function ImportPipelineTab({
  health,
  importFrame,
  selectedFrame,
  selectedLabel,
}: {
  health: ImportHealth;
  importFrame: ImportFrame;
  selectedFrame: TimeframeKey;
  selectedLabel: string;
}) {
  const defaultTrendMode =
    selectedFrame === "15m" || selectedFrame === "1h" || selectedFrame === "24h"
      ? "hourly"
      : "daily";
  const [manualTrendMode, setManualTrendMode] = useState<{
    frame: TimeframeKey;
    mode: "hourly" | "daily";
  } | null>(null);
  const trendMode =
    manualTrendMode && manualTrendMode.frame === selectedFrame
      ? manualTrendMode.mode
      : defaultTrendMode;

  const protectedCount =
    importFrame.rateLimited +
    importFrame.queueBusy +
    importFrame.cooldown +
    importFrame.turnstileFailed;

  const rawTrendRows = (
    trendMode === "daily" ? health.imports.daily : health.imports.hourly
  ).slice(trendMode === "daily" ? -30 : -24);
  const trendBars = computeImportTrendBars(rawTrendRows);

  const maxErrorCount = Math.max(1, ...health.imports.errors.map((e) => e.count));
  const totalErrorCount = health.imports.errors.reduce((sum, e) => sum + e.count, 0);

  const maxTargetEvents = Math.max(1, ...health.imports.busiestTargets.map((t) => t.events));

  return (
    <div
      id="tabpanel-imports"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-imports"
    >
      <Panel
        icon={Activity}
        title="Timeframe Import Summary"
        subtitle={`Selected window: ${selectedLabel}`}
      >
        <div className={styles.grid4}>
          <MetricCard
            icon={TrendingUp}
            label="Attempts"
            value={formatNumber(importFrame.attempts)}
            detail={`${formatNumber(importFrame.users)} users · ${formatNumber(importFrame.characters)} characters`}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completed"
            value={formatNumber(importFrame.completed)}
            detail={`${formatNumber(importFrame.queued)} queued events`}
            tone="good"
          />
          <MetricCard
            icon={XCircle}
            label="Failed"
            value={formatNumber(importFrame.failed)}
            detail={`${formatPercent(importFrame.failureRate)} failure rate`}
            tone={importFrame.failed > 0 ? "bad" : "neutral"}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Protected"
            value={formatNumber(protectedCount)}
            detail={`${formatNumber(importFrame.rateLimited)} rate-limited · ${formatNumber(importFrame.cooldown)} cooldown`}
            tone={protectedCount > 0 ? "warn" : "neutral"}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completion Rate"
            value={formatPercent(importFrame.completionRate)}
            detail={importFrame.attempts === 0 ? "No attempts in window" : "Completed / Attempts"}
            tone={importFrame.completionRate >= 90 || importFrame.attempts === 0 ? "good" : "warn"}
          />
          <MetricCard
            icon={Clock}
            label="Avg Duration"
            value={formatDuration(importFrame.avgDurationSeconds)}
            detail={`Waiting for budget: ${formatNumber(importFrame.waitingForBudget)}`}
          />
          <MetricCard
            icon={Clock}
            label="Max Duration"
            value={formatDuration(importFrame.maxDurationSeconds)}
            detail={`Expired: ${formatNumber(importFrame.expired)}`}
          />
          <MetricCard
            icon={RefreshCw}
            label="Avg Requests"
            value={formatNumber(importFrame.avgRequestCount)}
            detail={`Avg retries: ${formatNumber(importFrame.avgRetryCount)}`}
          />
        </div>
      </Panel>

      <Panel
        icon={Users}
        title="Importer Demand Overview"
        subtitle="Unique anonymous requesters and distinct imported character hashes"
      >
        <div className={styles.grid4}>
          <MetricCard
            icon={Users}
            label="24h Import Users"
            value={formatNumber(health.demand.uniqueImportUsers24h)}
            detail={`Active: ${formatNumber(health.demand.activeImportUsers15m)} (15m) · ${formatNumber(health.demand.activeImportUsers1h)} (1h)`}
          />
          <MetricCard
            icon={Users}
            label="7d Import Users"
            value={formatNumber(health.demand.uniqueImportUsers7d)}
            detail={`${formatNumber(health.demand.jobsLast7d)} jobs in 7d`}
          />
          <MetricCard
            icon={Users}
            label="All-Time Import Users"
            value={formatNumber(health.demand.uniqueImportUsersAllTime)}
            detail={`${formatNumber(health.demand.jobsLast24h)} jobs in last 24h`}
          />
          <MetricCard
            icon={Database}
            label="All-Time Characters"
            value={formatNumber(health.demand.uniqueCharactersAllTime)}
            detail={`24h: ${formatNumber(health.demand.uniqueCharacters24h)} · 7d: ${formatNumber(health.demand.uniqueCharacters7d)}`}
          />
        </div>
      </Panel>

      <Panel
        icon={BarChart3}
        title="Import Volume &amp; Outcome Trend"
        subtitle={
          trendMode === "daily"
            ? "Daily breakdown (30-day rolling window)"
            : "Hourly breakdown (24-hour rolling window)"
        }
        action={
          <div className={styles.segmentedGroup} role="group" aria-label="Import trend granularity">
            <button
              type="button"
              className={`${styles.toggleBtn} ${trendMode === "hourly" ? styles.toggleBtnActive : ""}`}
              aria-pressed={trendMode === "hourly"}
              onClick={() => setManualTrendMode({ frame: selectedFrame, mode: "hourly" })}
            >
              Hourly (24h)
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${trendMode === "daily" ? styles.toggleBtnActive : ""}`}
              aria-pressed={trendMode === "daily"}
              onClick={() => setManualTrendMode({ frame: selectedFrame, mode: "daily" })}
            >
              Daily (30d)
            </button>
          </div>
        }
      >
        {trendBars.length > 0 ? (
          <div className={styles.trendContainer}>
            <div className={styles.trendLegend}>
              <span className={styles.legendItem}>
                <i className={`${styles.legendSwatch} ${styles.swatchGood}`} />
                Completed
              </span>
              <span className={styles.legendItem}>
                <i className={`${styles.legendSwatch} ${styles.swatchBad}`} />
                Failed
              </span>
              <span className={styles.legendItem}>
                <i className={`${styles.legendSwatch} ${styles.swatchAccent}`} />
                Queued / Protected
              </span>
            </div>

            <div className={styles.trendList}>
              {trendBars.map((row) => (
                <div key={row.rawBucket} className={styles.trendRow}>
                  <span className={styles.trendBucket}>{row.label}</span>
                  <div
                    className={styles.trendTrack}
                    title={`${row.rawBucket}: ${row.completed} completed, ${row.failed} failed, ${row.attempts} attempts`}
                  >
                    {row.completedPct > 0 ? (
                      <div
                        className={styles.trendSegmentGood}
                        style={{ width: `${row.completedPct}%` }}
                      />
                    ) : null}
                    {row.failedPct > 0 ? (
                      <div
                        className={styles.trendSegmentBad}
                        style={{ width: `${row.failedPct}%` }}
                      />
                    ) : null}
                    {row.otherPct > 0 ? (
                      <div
                        className={styles.trendSegmentOther}
                        style={{ width: `${row.otherPct}%` }}
                      />
                    ) : null}
                  </div>
                  <div className={styles.trendNumbers}>
                    <span className={styles.chip + " " + styles.toneGood}>
                      {formatNumber(row.completed)} ok
                    </span>
                    <span
                      className={
                        styles.chip + " " + (row.failed > 0 ? styles.toneBad : styles.toneNeutral)
                      }
                    >
                      {formatNumber(row.failed)} fail
                    </span>
                    <span>({formatNumber(row.attempts)} att)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyBlock text="No import trend events recorded for this granularity." />
        )}
      </Panel>

      <div className={styles.grid2}>
        <Panel
          icon={AlertTriangle}
          title="Error Breakdown (byError)"
          subtitle="30-day import error codes by occurrence count"
        >
          {health.imports.errors.length > 0 ? (
            <div className={styles.rankList}>
              {health.imports.errors.map((err) => {
                const share = totalErrorCount > 0 ? (err.count / totalErrorCount) * 100 : 0;
                const widthPct = Math.max(3, (err.count / maxErrorCount) * 100);
                return (
                  <div key={err.code} className={styles.rankItem}>
                    <div className={styles.rankHeader}>
                      <span className={`${styles.rankLabel} ${styles.mono}`}>{err.code}</span>
                      <span className={styles.rankMeta}>
                        {formatNumber(err.count)} events ({formatPercent(share)})
                      </span>
                    </div>
                    <div className={styles.shareBarWrap}>
                      <div className={styles.shareTrack}>
                        <div className={styles.shareFill} style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBlock text="Zero import errors recorded in the last 30 days." />
          )}
        </Panel>

        <Panel
          icon={Database}
          title="Top Imported Character Targets"
          subtitle="Anonymous target fingerprint tails with highest import frequency (30d)"
        >
          {health.imports.busiestTargets.length > 0 ? (
            <div className={styles.rankList}>
              {health.imports.busiestTargets.map((target) => {
                const widthPct = Math.max(3, (target.events / maxTargetEvents) * 100);
                return (
                  <div key={target.fingerprintTail} className={styles.rankItem}>
                    <div className={styles.rankHeader}>
                      <span className={`${styles.rankLabel} ${styles.mono}`}>
                        …{target.fingerprintTail}
                      </span>
                      <span className={styles.rankMeta}>
                        {formatNumber(target.events)} events · {formatNumber(target.users)} users
                      </span>
                    </div>
                    <div className={styles.shareBarWrap}>
                      <div className={styles.shareTrack}>
                        <div className={styles.shareFillGood} style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBlock text="No character target telemetry recorded yet." />
          )}
        </Panel>
      </div>

      <Panel
        icon={Clock}
        title="Recent Durable Import Events"
        subtitle="Last 20 operational transitions in import_events"
      >
        {health.imports.recentEvents.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Status / Error</th>
                  <th>Budget Mode</th>
                  <th>Requests / Retries</th>
                  <th>Duration</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {health.imports.recentEvents.map((ev, index) => {
                  const chipText = ev.errorCode || ev.status || ev.eventType;
                  return (
                    <tr key={`${ev.createdAt}-${index}`}>
                      <td className={styles.mono}>{ev.eventType}</td>
                      <td>
                        <span className={`${styles.chip} ${toneClass(statusTone(chipText))}`}>
                          {chipText}
                        </span>
                      </td>
                      <td className={styles.mono}>{ev.budgetMode}</td>
                      <td className={styles.mono}>
                        {ev.requestCount} req · {ev.retryCount} retry
                      </td>
                      <td className={styles.mono}>
                        {ev.durationSeconds ? formatDuration(ev.durationSeconds) : "—"}
                      </td>
                      <td className={styles.mono}>{formatDate(ev.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock text="No durable import events recorded yet." />
        )}
      </Panel>
    </div>
  );
}
