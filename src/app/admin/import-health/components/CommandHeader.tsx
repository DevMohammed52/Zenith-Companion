"use client";

import type { KeyboardEvent } from "react";
import { Badge, Button, Popover, PopoverContent, PopoverTrigger, SegmentedControl } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { IconConcept } from "@/lib/icons";
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
import { toneBadgeVariant } from "./DashboardPrimitives";
import styles from "../AdminDashboard.module.css";

const AUTO_REFRESH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "0", label: "Off" },
  { value: "15", label: "15s" },
  { value: "30", label: "30s" },
  { value: "60", label: "60s" },
];

const TAB_DEFS: Array<{
  key: AdminTabKey;
  label: string;
  icon: IconConcept;
}> = [
  { key: "engine", label: "Live Engine", icon: "cpu" },
  { key: "imports", label: "Import Pipeline", icon: "barChart" },
  { key: "traffic", label: "Traffic & Audience", icon: "globe" },
  { key: "vitals", label: "Errors & Web Vitals", icon: "gauge" },
  { key: "database", label: "D1 & Infra", icon: "database" },
];

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
  isTabHidden = false,
  onChangeAutoRefresh,
  onRefreshNow,
  onRunQueue,
  onCopySummary,
  onDownloadJson,
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
  isTabHidden?: boolean;
  onChangeAutoRefresh: (sec: AutoRefreshSeconds) => void;
  onRefreshNow: () => void;
  onRunQueue: () => void;
  onCopySummary?: () => void;
  onDownloadJson?: () => void;
}) {
  const operationalState = deriveOperationalHealth(health, loading);
  const isCacheHit = cacheHeader.toUpperCase() === "HIT";
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

  function badgeCountForTab(key: AdminTabKey): number {
    switch (key) {
      case "engine":
        return activeEngineSignals;
      case "imports":
        return selectedImportFrame?.attempts || 0;
      case "traffic":
        return selectedUsageFrame?.pageviews || 0;
      case "vitals":
        return errorAndVitalSignals;
      case "database":
        return totalD1Rows;
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = TAB_DEFS.findIndex((t) => t.key === activeTab);
    if (currentIndex < 0) return;

    let nextIndex = -1;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_DEFS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_DEFS.length) % TAB_DEFS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TAB_DEFS.length - 1;
    }

    if (nextIndex >= 0) {
      event.preventDefault();
      const nextTab = TAB_DEFS[nextIndex].key;
      onSelectTab(nextTab);
      document.getElementById(`tab-${nextTab}`)?.focus();
    }
  }

  const timeframeOptions = TIMEFRAME_ORDER.map((key) => {
    const usageFrame = health ? findFrame(health.usage.timeframes, key) : undefined;
    const importFrame = health ? findFrame(health.imports.timeframes, key) : undefined;
    const label = usageFrame?.label || importFrame?.label || key;
    return {
      value: key,
      label,
      badge: usageFrame ? formatNumber(usageFrame.users) : undefined,
    };
  });

  return (
    <section className={styles.commandBlock} aria-label="Operations console controls">
      <header className={styles.commandTopBar}>
        <div className={styles.titleBlock}>
          <div className={styles.titleLine}>
            <Icon name="defense" size="xl" className={styles.titleIcon} aria-hidden="true" />
            <h1 className={styles.title}>Operations Console</h1>
          </div>
          <p className={styles.subtitle}>
            Queue health, shared IdleMMO budget headroom, route telemetry, and D1 diagnostics.
          </p>
        </div>

        <div className={styles.controlsCluster}>
          <div className={styles.autoRefreshGroup}>
            <span className={styles.autoRefreshLabel}>
              <Icon name="timer" size="xs" aria-hidden="true" />
              <span>
                {autoRefreshSec > 0
                  ? isTabHidden
                    ? "Auto (Paused)"
                    : `Auto (${countdownSec}s)`
                  : "Auto"}
              </span>
            </span>
            <SegmentedControl
              ariaLabel="Auto-refresh interval"
              size="sm"
              options={AUTO_REFRESH_OPTIONS}
              value={String(autoRefreshSec)}
              onChange={(val) => onChangeAutoRefresh(Number(val) as AutoRefreshSeconds)}
            />
          </div>

          {health && (onCopySummary || onDownloadJson) ? (
            <Popover placement="bottom-end">
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Icon name="download" size="sm" aria-hidden="true" />}
                >
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className={styles.exportMenu}>
                  {onCopySummary ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      icon={<Icon name="copy" size="sm" aria-hidden="true" />}
                      onClick={onCopySummary}
                    >
                      Copy Markdown Report
                    </Button>
                  ) : null}
                  {onDownloadJson ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      icon={<Icon name="download" size="sm" aria-hidden="true" />}
                      onClick={onDownloadJson}
                    >
                      Download JSON Snapshot
                    </Button>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            loading={isRunningQueue}
            disabled={Boolean(actionBusy) || loading}
            icon={<Icon name="play" size="sm" aria-hidden="true" />}
            onClick={onRunQueue}
          >
            Run Queue
          </Button>

          <Button
            variant="primary"
            size="sm"
            loading={loading}
            disabled={Boolean(actionBusy)}
            icon={<Icon name="refresh" size="sm" aria-hidden="true" />}
            onClick={onRefreshNow}
          >
            Refresh Now
          </Button>
        </div>
      </header>

      <div className={styles.statusStrip} role="region" aria-label="Worker runtime status">
        <div className={styles.statusPills}>
          <Badge variant={toneBadgeVariant(operationalState.tone)} size="sm">
            {operationalState.label}: {operationalState.detail}
          </Badge>
          <span className={styles.hairlineV} aria-hidden="true" />
          <Badge
            variant={isCacheHit ? "neutral" : "success"}
            size="sm"
            title={`x-admin-cache: ${cacheHeader || "LIVE"}`}
          >
            {isCacheHit ? "Cache: HIT" : "LIVE"}
          </Badge>
          {health ? (
            <>
              <span className={styles.hairlineV} aria-hidden="true" />
              <span className={styles.monoInline}>
                Mode: <strong>{health.minuteUsage.budgetMode}</strong> ({health.minuteUsage.usedRequests}/
                {health.minuteUsage.limit} req/m)
              </span>
            </>
          ) : null}
        </div>
        <span className={styles.snapshotTime}>
          {health ? `Snapshot ${formatDate(health.generatedAt)}` : "Connecting to worker..."}
        </span>
      </div>

      <div className={styles.navBarRow}>
        <div
          className={styles.tabList}
          role="tablist"
          aria-label="Console sections"
          onKeyDown={handleTabKeyDown}
        >
          {TAB_DEFS.map((tab) => {
            const selected = activeTab === tab.key;
            const count = badgeCountForTab(tab.key);
            return (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                type="button"
                role="tab"
                tabIndex={selected ? 0 : -1}
                aria-selected={selected}
                aria-controls={`tabpanel-${tab.key}`}
                className={`${styles.tabButton} ${selected ? styles.tabButtonActive : ""}`}
                onClick={() => onSelectTab(tab.key)}
              >
                <Icon name={tab.icon} size="sm" aria-hidden="true" />
                <span>{tab.label}</span>
                <span className={styles.tabBadge}>{formatNumber(count)}</span>
              </button>
            );
          })}
        </div>

        {(activeTab === "imports" || activeTab === "traffic") ? (
          <div className={styles.timeframeWrap}>
            <SegmentedControl
              ariaLabel="Global timeframe selector"
              size="sm"
              options={timeframeOptions}
              value={selectedFrame}
              onChange={onSelectFrame}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
