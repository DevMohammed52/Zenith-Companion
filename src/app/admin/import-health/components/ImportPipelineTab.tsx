"use client";

import { useState } from "react";
import {
  Badge,
  ProgressBar,
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
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
import {
  EmptyBlock,
  KpiStrip,
  Panel,
  toneBadgeVariant,
} from "./DashboardPrimitives";
import { ImportOutcomeChart } from "./InteractiveCharts";
import styles from "../AdminDashboard.module.css";

type EventFilter = "all" | "completed" | "failed" | "throttled";

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
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

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

  const filteredEvents = health.imports.recentEvents.filter((ev) => {
    const t = `${ev.eventType} ${ev.status}`.toLowerCase();
    if (eventFilter === "completed") return t.includes("complete");
    if (eventFilter === "failed") return t.includes("fail") || Boolean(ev.errorCode);
    if (eventFilter === "throttled") {
      return t.includes("rate_limit") || t.includes("cooldown") || t.includes("waiting_for_budget");
    }
    return true;
  });

  return (
    <div
      id="tabpanel-imports"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-imports"
    >
      <KpiStrip
        ariaLabel={`Import pipeline summary for ${selectedLabel}`}
        items={[
          {
            label: `Attempts (${selectedLabel})`,
            value: formatNumber(importFrame.attempts),
            sublabel: `${formatNumber(importFrame.users)} users | ${formatNumber(importFrame.characters)} chars`,
            icon: "skillProfit",
          },
          {
            label: "Completion Rate",
            value: formatPercent(importFrame.completionRate),
            sublabel: `${formatNumber(importFrame.completed)} completed | ${formatNumber(importFrame.queued)} queued`,
            tone: importFrame.completionRate >= 90 || importFrame.attempts === 0 ? "good" : "warn",
            icon: "checkCircle",
          },
          {
            label: "Failed / Protected",
            value: `${formatNumber(importFrame.failed)} / ${formatNumber(protectedCount)}`,
            sublabel: `${formatPercent(importFrame.failureRate)} failure | ${formatNumber(importFrame.rateLimited)} 429s`,
            tone: importFrame.failed > 0 ? "bad" : protectedCount > 0 ? "warn" : "neutral",
            icon: "defense",
          },
          {
            label: "Avg / Max Duration",
            value: `${formatDuration(importFrame.avgDurationSeconds)} / ${formatDuration(importFrame.maxDurationSeconds)}`,
            sublabel: `${formatNumber(importFrame.avgRequestCount)} avg req | ${formatNumber(importFrame.avgRetryCount)} retries`,
            icon: "timer",
          },
          {
            label: "All-Time Characters",
            value: formatNumber(health.demand.uniqueCharactersAllTime),
            sublabel: `${formatNumber(health.demand.uniqueImportUsersAllTime)} unique users`,
            icon: "database",
          },
        ]}
      />

      <Panel
        icon="barChart"
        title="Import Volume &amp; Outcome Trend"
        subtitle={
          trendMode === "daily"
            ? "Interactive 30-day rolling breakdown (click or hover a column)"
            : "Interactive 24-hour rolling breakdown (click or hover a column)"
        }
        action={
          <SegmentedControl
            ariaLabel="Import trend granularity"
            size="sm"
            options={[
              { value: "hourly", label: "Hourly (24h)" },
              { value: "daily", label: "Daily (30d)" },
            ]}
            value={trendMode}
            onChange={(mode) =>
              setManualTrendMode({ frame: selectedFrame, mode: mode as "hourly" | "daily" })
            }
          />
        }
      >
        {trendBars.length > 0 ? (
          <>
            <ImportOutcomeChart bars={trendBars} />
            <div className={styles.trendBucketGrid}>
              {trendBars.map((row) => (
                <div key={row.rawBucket} className={styles.trendBucketRow}>
                  <span className={styles.mono}>{row.label}</span>
                  <div
                    className={styles.trendTrackMini}
                    title={`${row.rawBucket}: ${row.completed} completed, ${row.failed} failed, ${row.attempts} attempts`}
                  >
                    {row.completedPct > 0 ? (
                      <div className={styles.trendSegGood} style={{ width: `${row.completedPct}%` }} />
                    ) : null}
                    {row.failedPct > 0 ? (
                      <div className={styles.trendSegBad} style={{ width: `${row.failedPct}%` }} />
                    ) : null}
                    {row.otherPct > 0 ? (
                      <div className={styles.trendSegOther} style={{ width: `${row.otherPct}%` }} />
                    ) : null}
                  </div>
                  <div className={styles.trendNumbersCompact}>
                    <span className={styles.toneGood}>{formatNumber(row.completed)} ok</span>
                    <span className={row.failed > 0 ? styles.toneBad : styles.mutedInline}>
                      {formatNumber(row.failed)} fail
                    </span>
                    <span className={styles.mutedInline}>({formatNumber(row.attempts)})</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyBlock text="No import trend events recorded for this granularity." />
        )}
      </Panel>

      <div className={styles.grid2}>
        <Panel
          icon="warning"
          title="Error Breakdown (30d)"
          subtitle="Import error codes ranked by occurrence count"
        >
          {health.imports.errors.length > 0 ? (
            <div className={styles.shareList}>
              {health.imports.errors.map((err) => {
                const share = totalErrorCount > 0 ? Math.round((err.count / totalErrorCount) * 1000) / 10 : 0;
                return (
                  <div key={err.code} className={styles.shareListRow}>
                    <div className={styles.shareListTop}>
                      <span className={`${styles.shareListLabel} ${styles.mono}`}>{err.code}</span>
                      <span className={styles.shareListMeta}>
                        {formatNumber(err.count)} events ({formatPercent(share)})
                      </span>
                    </div>
                    <ProgressBar
                      value={err.count}
                      min={0}
                      max={maxErrorCount}
                      size="sm"
                      variant="danger"
                      showReadout={false}
                      ariaLabel={`${err.code} share`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBlock text="Zero import errors recorded in the last 30 days." />
          )}
        </Panel>

        <Panel
          icon="database"
          title="Top Imported Character Targets"
          subtitle="Anonymous target fingerprint tails with highest frequency (30d)"
        >
          {health.imports.busiestTargets.length > 0 ? (
            <div className={styles.shareList}>
              {health.imports.busiestTargets.map((target) => (
                <div key={target.fingerprintTail} className={styles.shareListRow}>
                  <div className={styles.shareListTop}>
                    <span className={`${styles.shareListLabel} ${styles.mono}`}>
                      ...{target.fingerprintTail}
                    </span>
                    <span className={styles.shareListMeta}>
                      {formatNumber(target.events)} events | {formatNumber(target.users)} users
                    </span>
                  </div>
                  <ProgressBar
                    value={target.events}
                    min={0}
                    max={maxTargetEvents}
                    size="sm"
                    variant="success"
                    showReadout={false}
                    ariaLabel={`Target ${target.fingerprintTail} frequency`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock text="No character target telemetry recorded yet." />
          )}
        </Panel>
      </div>

      <Panel
        icon="timer"
        title="Recent Durable Import Events"
        subtitle="Last 20 transitions recorded in import_events"
        action={
          <SegmentedControl
            ariaLabel="Filter recent import events"
            size="sm"
            options={[
              { value: "all", label: "All" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
              { value: "throttled", label: "Throttled" },
            ]}
            value={eventFilter}
            onChange={(val) => setEventFilter(val as EventFilter)}
          />
        }
      >
        {filteredEvents.length > 0 ? (
          <TableContainer>
            <Table density="compact" aria-label="Durable import events">
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status / Error</TableHead>
                  <TableHead>Budget Mode</TableHead>
                  <TableHead align="right">Reqs / Retries</TableHead>
                  <TableHead align="right">Duration</TableHead>
                  <TableHead align="right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((ev, index) => {
                  const chipText = ev.errorCode || ev.status || ev.eventType;
                  return (
                    <TableRow key={`${ev.createdAt}-${index}`}>
                      <TableCell className={styles.mono}>{ev.eventType}</TableCell>
                      <TableCell>
                        <Badge variant={toneBadgeVariant(statusTone(chipText))} size="sm">
                          {chipText}
                        </Badge>
                      </TableCell>
                      <TableCell className={styles.mono}>{ev.budgetMode}</TableCell>
                      <TableCell align="right" className={styles.mono}>
                        {ev.requestCount} / {ev.retryCount}
                      </TableCell>
                      <TableCell align="right" className={styles.mono}>
                        {ev.durationSeconds ? formatDuration(ev.durationSeconds) : "-"}
                      </TableCell>
                      <TableCell align="right" className={styles.mono}>
                        {formatDate(ev.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyBlock text="No durable import events match this filter." />
        )}
      </Panel>
    </div>
  );
}
