"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatTimeOnly,
  statusTone,
  type AdminActionRequest,
  type ImportHealth,
  type RecentJobRow,
} from "../types";
import {
  CopyButton,
  EmptyBlock,
  KpiStrip,
  Panel,
  toneBadgeVariant,
} from "./DashboardPrimitives";
import styles from "../AdminDashboard.module.css";

type JobStatusFilter = "all" | "active" | "failed" | "completed";

export function LiveEngineTab({
  health,
  actionBusy,
  onExecuteAction,
  onInspectJob,
  onCopied,
}: {
  health: ImportHealth;
  actionBusy: string | null;
  onExecuteAction: (payload: AdminActionRequest, busyKey: string) => void;
  onInspectJob?: (job: RecentJobRow) => void;
  onCopied?: (value: string, label: string) => void;
}) {
  const [jobFilter, setJobFilter] = useState<JobStatusFilter>("all");
  const [jobQuery, setJobQuery] = useState("");

  const { minuteUsage, service, queue, pressure, coordinator, recentJobs, cooldowns } = health;
  const usageRatio =
    minuteUsage.limit > 0
      ? Math.min(100, Math.round((minuteUsage.usedRequests / minuteUsage.limit) * 100))
      : 0;
  const progressVariant =
    usageRatio >= 90 ? "danger" : minuteUsage.budgetMode === "github-active" ? "default" : "success";

  const filteredJobs = recentJobs.filter((job) => {
    const status = job.status.toLowerCase();
    const isActive =
      !job.expired &&
      (status === "queued" || status === "pending" || status === "running" || status === "waiting_for_budget");
    if (jobFilter === "active" && !isActive) return false;
    if (jobFilter === "failed" && status !== "failed") return false;
    if (jobFilter === "completed" && status !== "complete" && status !== "completed") return false;

    const q = jobQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      job.id.toLowerCase().includes(q) ||
      job.targetHashFingerprint.toLowerCase().includes(q) ||
      job.errorCode.toLowerCase().includes(q) ||
      status.includes(q)
    );
  });

  return (
    <div
      id="tabpanel-engine"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-engine"
    >
      <KpiStrip
        ariaLabel="Live worker engine metrics"
        items={[
          {
            label: "Running Jobs",
            value: formatNumber(queue.running),
            sublabel: `Oldest: ${formatDuration(pressure.oldestRunningSeconds)}`,
            tone: queue.running > 0 ? "warn" : "neutral",
            icon: "cpu",
          },
          {
            label: "Queued Jobs",
            value: formatNumber(queue.pending),
            sublabel: `Oldest wait: ${formatDuration(pressure.oldestQueuedSeconds)}`,
            tone: queue.pending >= 5 || pressure.oldestQueuedSeconds >= 180 ? "warn" : "neutral",
            icon: "timer",
          },
          {
            label: "Minute Budget",
            value: `${minuteUsage.usedRequests} / ${minuteUsage.limit}`,
            sublabel: `${minuteUsage.budgetMode} (${usageRatio}% used)`,
            tone:
              usageRatio >= 90
                ? "bad"
                : minuteUsage.budgetMode === "github-active"
                  ? "warn"
                  : "good",
            icon: "gauge",
          },
          {
            label: "Active Cooldowns",
            value: formatNumber(cooldowns.activeCount),
            sublabel: cooldowns.activeCount > 0 ? "Backoff active" : "All targets clear",
            tone: cooldowns.activeCount > 0 ? "warn" : "good",
            icon: "counterpoint",
          },
        ]}
      />

      <div className={styles.grid2}>
        <Panel
          icon="gauge"
          title="Live Minute Budget"
          subtitle={`Bucket #${minuteUsage.minuteKey} shared against IdleMMO API limit`}
          action={
            <Badge
              variant={minuteUsage.budgetMode === "github-active" ? "warning" : "success"}
              size="sm"
            >
              {minuteUsage.budgetMode === "github-active"
                ? "github-active (6/min)"
                : "github-idle (35/min)"}
            </Badge>
          }
        >
          <ProgressBar
            label="Minute request budget usage"
            value={minuteUsage.usedRequests}
            min={0}
            max={Math.max(1, minuteUsage.limit)}
            valueText={`${minuteUsage.usedRequests} / ${minuteUsage.limit} req/min (${usageRatio}%)`}
            variant={progressVariant}
            size="lg"
          />

          <div className={styles.inlineStrip3}>
            <div className={styles.inlineTile}>
              <span>Poll Cadence</span>
              <strong>{formatNumber(service.pollAfterMs)}ms</strong>
            </div>
            <div className={styles.inlineTile}>
              <span>Request Delay</span>
              <strong>{formatNumber(service.importDelayMs)}ms</strong>
            </div>
            <div className={styles.inlineTile}>
              <span>Job TTL</span>
              <strong>{formatNumber(service.jobTtlMinutes)}m</strong>
            </div>
          </div>

          {minuteUsage.sources.length > 0 ? (
            <TableContainer>
              <Table density="compact" aria-label="Minute budget sources">
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead align="right">Used</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead align="right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minuteUsage.sources.map((src) => (
                    <TableRow key={src.source}>
                      <TableCell className={styles.mono}>{src.source}</TableCell>
                      <TableCell align="right" className={styles.mono}>
                        {formatNumber(src.usedRequests)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={toneBadgeVariant(statusTone(src.mode))} size="sm">
                          {src.mode}
                        </Badge>
                      </TableCell>
                      <TableCell align="right" className={styles.mono}>
                        {formatTimeOnly(src.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Panel>

        <Panel
          icon="cataclysm"
          title="Scraper Coordinator Locks"
          subtitle="KV locks synchronizing GitHub Actions scrapers with user imports"
          action={
            <Button
              variant="secondary"
              size="sm"
              loading={actionBusy === "clear_coordinator:all"}
              disabled={Boolean(actionBusy)}
              icon={<Icon name="unlocked" size="sm" aria-hidden="true" />}
              onClick={() =>
                onExecuteAction({ action: "clear_coordinator" }, "clear_coordinator:all")
              }
            >
              Force Unlock All
            </Button>
          }
        >
          {coordinator.length > 0 ? (
            <div className={styles.lockList}>
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
                  <div key={state.source} className={styles.lockRow}>
                    <div className={styles.lockMeta}>
                      <div className={styles.lockHead}>
                        <span className={styles.monoStrong}>{state.source}</span>
                        <Badge variant={toneBadgeVariant(tone)} size="sm">
                          {chipLabel}
                        </Badge>
                      </div>
                      <div className={styles.lockSubRow}>
                        <span>Run: {state.runId || "-"}</span>
                        <span className={styles.hairlineV} aria-hidden="true" />
                        <span>Exp: {formatTimeOnly(state.expiresAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isBusy}
                      disabled={Boolean(actionBusy)}
                      icon={<Icon name="unlocked" size="xs" aria-hidden="true" />}
                      onClick={() =>
                        onExecuteAction(
                          { action: "clear_coordinator", source: state.source },
                          busyKey,
                        )
                      }
                    >
                      Force Unlock
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBlock text="No scraper locks active. Engine running at full github-idle speed (35 req/min)." />
          )}
        </Panel>
      </div>

      <Panel
        icon="cpu"
        title="Live &amp; Recent Queue Jobs"
        subtitle="Click any job row to inspect full fingerprints, error context, and cancellation controls"
      >
        {recentJobs.length > 0 ? (
          <>
            <div className={styles.filterToolbar}>
              <div className={styles.filterSearch}>
                <SearchInput
                  value={jobQuery}
                  onChange={setJobQuery}
                  placeholder="Filter job ID, fingerprint, status..."
                  showShortcutHint={false}
                />
              </div>
              <SegmentedControl
                ariaLabel="Filter queue jobs"
                size="sm"
                options={[
                  { value: "all", label: `All (${recentJobs.length})` },
                  { value: "active", label: "Active" },
                  { value: "failed", label: "Failed" },
                  { value: "completed", label: "Done" },
                ]}
                value={jobFilter}
                onChange={(val) => setJobFilter(val as JobStatusFilter)}
              />
            </div>

            {filteredJobs.length > 0 ? (
              <TableContainer>
                <Table density="compact" aria-label="Import queue jobs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead align="right">Reqs / Retries</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead align="right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => {
                      const canCancel =
                        !job.expired &&
                        (job.status === "queued" ||
                          job.status === "pending" ||
                          job.status === "running" ||
                          job.status === "waiting_for_budget");
                      const busyKey = `cancel_job:${job.id}`;
                      const isBusy = actionBusy === busyKey;
                      return (
                        <TableRow
                          key={job.id}
                          className={onInspectJob ? styles.clickableRow : undefined}
                          onClick={() => onInspectJob?.(job)}
                        >
                          <TableCell>
                            <div className={styles.codeCell}>
                              {onInspectJob ? (
                                <button
                                  type="button"
                                  className={`${styles.jobLinkBtn} ${styles.mono}`}
                                  title={`Inspect ${job.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onInspectJob(job);
                                  }}
                                >
                                  {job.id.length > 18
                                    ? `${job.id.slice(0, 10)}...${job.id.slice(-6)}`
                                    : job.id}
                                </button>
                              ) : (
                                <span className={styles.mono} title={job.id}>
                                  {job.id.length > 18
                                    ? `${job.id.slice(0, 10)}...${job.id.slice(-6)}`
                                    : job.id}
                                </span>
                              )}
                              <span onClick={(e) => e.stopPropagation()}>
                                <CopyButton value={job.id} label="Copy" onCopied={onCopied} />
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={styles.mono} title={job.targetHashFingerprint}>
                            {job.targetHashFingerprint
                              ? `...${job.targetHashFingerprint.slice(-12)}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={toneBadgeVariant(statusTone(job.status))} size="sm">
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell align="right" className={styles.mono}>
                            {job.requestCount} / {job.retryCount}
                          </TableCell>
                          <TableCell className={styles.mono}>
                            {formatTimeOnly(job.updatedAt)}
                          </TableCell>
                          <TableCell>
                            {job.errorCode || job.errorMessage ? (
                              <div>
                                {job.errorCode ? (
                                  <Badge variant="danger" size="sm">
                                    {job.errorCode}
                                  </Badge>
                                ) : null}
                                {job.errorMessage ? (
                                  <span className={styles.errorCellText}>{job.errorMessage}</span>
                                ) : null}
                              </div>
                            ) : (
                              <span className={styles.mono}>-</span>
                            )}
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            {canCancel ? (
                              <Button
                                variant="danger"
                                size="sm"
                                loading={isBusy}
                                disabled={Boolean(actionBusy)}
                                icon={<Icon name="ban" size="xs" aria-hidden="true" />}
                                onClick={() =>
                                  onExecuteAction({ action: "cancel_job", jobId: job.id }, busyKey)
                                }
                              >
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Icon name="view" size="xs" aria-hidden="true" />}
                                onClick={() => onInspectJob?.(job)}
                              >
                                Inspect
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyBlock text="No jobs match this filter." />
            )}
          </>
        ) : (
          <EmptyBlock text="No active or recent jobs in the temporary queue table." />
        )}
      </Panel>

      <Panel
        icon="counterpoint"
        title="Active Cooldowns"
        subtitle="Rate-limit and target backoff locks currently enforced in D1"
      >
        {cooldowns.items.length > 0 ? (
          <TableContainer>
            <Table density="compact" aria-label="Active rate-limit cooldowns">
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Key Fingerprint</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead align="right">Remaining</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cooldowns.items.map((item) => {
                  const busyKey = `clear_cooldown:${item.scope}:${item.keyFingerprint}`;
                  const isBusy = actionBusy === busyKey;
                  return (
                    <TableRow key={`${item.scope}:${item.keyFingerprint}`}>
                      <TableCell>
                        <Badge variant="warning" size="sm">
                          {item.scope}
                        </Badge>
                      </TableCell>
                      <TableCell className={styles.mono} title={item.keyFingerprint}>
                        {item.keyFingerprint.length > 20
                          ? `${item.keyFingerprint.slice(0, 10)}...${item.keyFingerprint.slice(-8)}`
                          : item.keyFingerprint}
                      </TableCell>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell align="right" className={styles.mono}>
                        {formatDuration(item.remainingSeconds)}
                      </TableCell>
                      <TableCell className={styles.mono}>{formatDate(item.untilAt)}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={isBusy}
                          disabled={Boolean(actionBusy)}
                          icon={<Icon name="unlocked" size="xs" aria-hidden="true" />}
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
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyBlock text="Zero active cooldowns. All import scopes and targets are unblocked." />
        )}
      </Panel>
    </div>
  );
}
