"use client";

import {
  Activity,
  Ban,
  Clock,
  Cpu,
  Gauge,
  Loader2,
  ShieldAlert,
  Unlock,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatTimeOnly,
  statusTone,
  type AdminActionRequest,
  type ImportHealth,
} from "../types";
import { CopyButton, EmptyBlock, MetricCard, Panel, toneClass } from "./DashboardPrimitives";

export function LiveEngineTab({
  health,
  actionBusy,
  onExecuteAction,
}: {
  health: ImportHealth;
  actionBusy: string | null;
  onExecuteAction: (payload: AdminActionRequest, busyKey: string) => void;
}) {
  const { minuteUsage, service, queue, pressure, coordinator, recentJobs, cooldowns } = health;
  const usageRatio = minuteUsage.limit > 0
    ? Math.min(100, Math.round((minuteUsage.usedRequests / minuteUsage.limit) * 100))
    : 0;
  const fillClass =
    usageRatio >= 90
      ? styles.progressFillBad
      : usageRatio >= 65 || minuteUsage.budgetMode === "github-active"
        ? styles.progressFillWarn
        : styles.progressFill;

  return (
    <div
      id="tabpanel-engine"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-engine"
    >
      <div className={styles.grid4}>
        <MetricCard
          icon={Cpu}
          label="Running Jobs"
          value={formatNumber(queue.running)}
          detail={`Oldest running: ${formatDuration(pressure.oldestRunningSeconds)}`}
          tone={queue.running > 0 ? "warn" : "neutral"}
        />
        <MetricCard
          icon={Clock}
          label="Queued Jobs"
          value={formatNumber(queue.pending)}
          detail={`Oldest queued: ${formatDuration(pressure.oldestQueuedSeconds)}`}
          tone={queue.pending >= 5 || pressure.oldestQueuedSeconds >= 180 ? "warn" : "neutral"}
        />
        <MetricCard
          icon={Gauge}
          label="Minute Budget"
          value={`${minuteUsage.usedRequests} / ${minuteUsage.limit}`}
          detail={`Mode: ${minuteUsage.budgetMode} (${usageRatio}% used)`}
          tone={usageRatio >= 90 ? "bad" : minuteUsage.budgetMode === "github-active" ? "warn" : "good"}
        />
        <MetricCard
          icon={ShieldAlert}
          label="Active Cooldowns"
          value={formatNumber(cooldowns.activeCount)}
          detail={cooldowns.activeCount > 0 ? "Rate-limit backoff active" : "Zero active blocks"}
          tone={cooldowns.activeCount > 0 ? "warn" : "good"}
        />
      </div>

      <div className={styles.grid2}>
        <Panel
          icon={Gauge}
          title="Live Minute Budget Gauge"
          subtitle={`Current bucket #${minuteUsage.minuteKey} · Shared IdleMMO API quota`}
        >
          <div className={styles.gaugeBox}>
            <div className={styles.gaugeTop}>
              <div className={styles.gaugeNumbers}>
                <span className={styles.gaugePrimary}>
                  {minuteUsage.usedRequests} / {minuteUsage.limit}
                </span>
                <span className={styles.gaugeSecondary}>req/min ({usageRatio}%)</span>
              </div>
              <span
                className={`${styles.chip} ${
                  minuteUsage.budgetMode === "github-active" ? styles.toneWarn : styles.toneGood
                }`}
              >
                {minuteUsage.budgetMode === "github-active"
                  ? "github-active (6/min throttled)"
                  : "github-idle (35/min full speed)"}
              </span>
            </div>

            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Minute request budget usage"
              aria-valuenow={minuteUsage.usedRequests}
              aria-valuemin={0}
              aria-valuemax={minuteUsage.limit}
            >
              <div className={fillClass} style={{ width: `${usageRatio}%` }} />
            </div>

            <div className={styles.gaugeMetaGrid}>
              <div className={styles.gaugeMetaItem}>
                <span>Poll Cadence</span>
                <strong>{formatNumber(service.pollAfterMs)}ms</strong>
              </div>
              <div className={styles.gaugeMetaItem}>
                <span>Request Delay</span>
                <strong>{formatNumber(service.importDelayMs)}ms</strong>
              </div>
              <div className={styles.gaugeMetaItem}>
                <span>Job TTL</span>
                <strong>{formatNumber(service.jobTtlMinutes)}m</strong>
              </div>
            </div>

            {minuteUsage.sources.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Used</th>
                      <th>Mode</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {minuteUsage.sources.map((src) => (
                      <tr key={src.source}>
                        <td className={styles.mono}>{src.source}</td>
                        <td className={styles.mono}>{formatNumber(src.usedRequests)}</td>
                        <td>
                          <span className={`${styles.chip} ${toneClass(statusTone(src.mode))}`}>
                            {src.mode}
                          </span>
                        </td>
                        <td className={styles.mono}>{formatTimeOnly(src.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          icon={Activity}
          title="Scraper Coordinator Control"
          subtitle="KV lock states coordinating GitHub Actions scrapers with user imports"
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnCompact}`}
              disabled={Boolean(actionBusy)}
              onClick={() => onExecuteAction({ action: "clear_coordinator" }, "clear_coordinator:all")}
            >
              {actionBusy === "clear_coordinator:all" ? (
                <Loader2 size={14} className={styles.spin} />
              ) : (
                <Unlock size={14} />
              )}
              <span>Force Unlock All</span>
            </button>
          }
        >
          {coordinator.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>State</th>
                    <th>Run ID</th>
                    <th>Updated / Expires</th>
                    <th>Control</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinator.map((state) => {
                    const busyKey = `clear_coordinator:${state.source}`;
                    const isBusy = actionBusy === busyKey;
                    const chipLabel = state.active
                      ? "ACTIVE"
                      : state.stale && state.expiresAt
                        ? "STALE"
                        : state.status || "IDLE";
                    const tone = state.active ? "warn" : statusTone(state.status);
                    return (
                      <tr key={state.source}>
                        <td className={styles.mono}>{state.source}</td>
                        <td>
                          <span className={`${styles.chip} ${toneClass(tone)}`}>{chipLabel}</span>
                        </td>
                        <td className={styles.mono}>{state.runId || "—"}</td>
                        <td className={styles.mono}>
                          <div>Seen: {formatTimeOnly(state.lastSeenAt || state.updatedAt)}</div>
                          <div>Exp: {formatTimeOnly(state.expiresAt)}</div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnCompact}`}
                            disabled={Boolean(actionBusy)}
                            onClick={() =>
                              onExecuteAction(
                                { action: "clear_coordinator", source: state.source },
                                busyKey,
                              )
                            }
                          >
                            {isBusy ? (
                              <Loader2 size={14} className={styles.spin} />
                            ) : (
                              <Unlock size={14} />
                            )}
                            <span>Force Unlock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock text="No scraper coordinator locks active. Engine running in github-idle mode (35 req/min)." />
          )}
        </Panel>
      </div>

      <Panel
        icon={Cpu}
        title="Live &amp; Recent Queue Jobs"
        subtitle="Ephemeral 1-hour import_jobs rows with live cancellation controls"
      >
        {recentJobs.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Target Fingerprint</th>
                  <th>Status</th>
                  <th>Reqs / Retries</th>
                  <th>Budget</th>
                  <th>Created / Updated</th>
                  <th>Error Diagnostics</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => {
                  const canCancel =
                    !job.expired &&
                    (job.status === "queued" ||
                      job.status === "pending" ||
                      job.status === "running" ||
                      job.status === "waiting_for_budget");
                  const busyKey = `cancel_job:${job.id}`;
                  const isBusy = actionBusy === busyKey;
                  return (
                    <tr key={job.id}>
                      <td>
                        <div className={styles.codeCell}>
                          <span className={styles.mono} title={job.id}>
                            {job.id.length > 18 ? `${job.id.slice(0, 10)}…${job.id.slice(-6)}` : job.id}
                          </span>
                          <CopyButton value={job.id} label="Copy" />
                        </div>
                      </td>
                      <td className={styles.mono} title={job.targetHashFingerprint}>
                        {job.targetHashFingerprint
                          ? `…${job.targetHashFingerprint.slice(-12)}`
                          : "—"}
                      </td>
                      <td>
                        <span className={`${styles.chip} ${toneClass(statusTone(job.status))}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className={styles.mono}>
                        {job.requestCount} req · {job.retryCount} retry
                      </td>
                      <td className={styles.mono}>{job.budgetMode}</td>
                      <td className={styles.mono}>
                        <div>In: {formatDate(job.createdAt)}</div>
                        <div>Up: {formatTimeOnly(job.updatedAt)}</div>
                      </td>
                      <td>
                        {job.errorCode || job.errorMessage ? (
                          <div>
                            {job.errorCode ? (
                              <span className={`${styles.chip} ${styles.toneBad}`}>
                                {job.errorCode}
                              </span>
                            ) : null}
                            {job.errorMessage ? (
                              <span className={styles.errorText}>{job.errorMessage}</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className={styles.mono}>—</span>
                        )}
                      </td>
                      <td>
                        {canCancel ? (
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnCompact}`}
                            disabled={Boolean(actionBusy)}
                            onClick={() =>
                              onExecuteAction({ action: "cancel_job", jobId: job.id }, busyKey)
                            }
                          >
                            {isBusy ? (
                              <Loader2 size={14} className={styles.spin} />
                            ) : (
                              <Ban size={14} />
                            )}
                            <span>Cancel</span>
                          </button>
                        ) : (
                          <span className={styles.mono}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock text="No active or recent jobs in the temporary queue table." />
        )}
      </Panel>

      <Panel
        icon={ShieldAlert}
        title="Active Cooldowns"
        subtitle="Rate-limit and target backoff locks currently enforced in D1"
      >
        {cooldowns.items.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>Key Fingerprint</th>
                  <th>Reason</th>
                  <th>Remaining</th>
                  <th>Expires At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cooldowns.items.map((item) => {
                  const busyKey = `clear_cooldown:${item.scope}:${item.keyFingerprint}`;
                  const isBusy = actionBusy === busyKey;
                  return (
                    <tr key={`${item.scope}:${item.keyFingerprint}`}>
                      <td>
                        <span className={`${styles.chip} ${styles.toneWarn}`}>{item.scope}</span>
                      </td>
                      <td className={styles.mono} title={item.keyFingerprint}>
                        {item.keyFingerprint.length > 20
                          ? `${item.keyFingerprint.slice(0, 10)}…${item.keyFingerprint.slice(-8)}`
                          : item.keyFingerprint}
                      </td>
                      <td>{item.reason}</td>
                      <td className={styles.mono}>{formatDuration(item.remainingSeconds)}</td>
                      <td className={styles.mono}>{formatDate(item.untilAt)}</td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnCompact}`}
                          disabled={Boolean(actionBusy)}
                          onClick={() =>
                            onExecuteAction(
                              {
                                action: "clear_cooldown",
                                scope: item.scope,
                                keyFingerprint: item.keyFingerprint,
                              },
                              busyKey,
                            )
                          }
                        >
                          {isBusy ? (
                            <Loader2 size={14} className={styles.spin} />
                          ) : (
                            <Unlock size={14} />
                          )}
                          <span>Unblock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock text="No active cooldowns. All import scopes and targets are unblocked." />
        )}
      </Panel>
    </div>
  );
}
