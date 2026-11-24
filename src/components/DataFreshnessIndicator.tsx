"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  DatabaseZap,
  RefreshCw,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import {
  formatPublicDataAge,
  getPublicDataFreshnessLevel,
  getPublicDataProgress,
  parsePublicDataTimestamp,
  type PublicDataFreshnessLevel,
  type PublicDataStatus,
} from "@/lib/data-freshness";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import styles from "./DataFreshnessIndicator.module.css";

type FetchState = "idle" | "loading" | "ok" | "error";

function isPublicDataStatus(value: unknown): value is PublicDataStatus {
  return Boolean(value && typeof value === "object");
}

function titleForLevel(level: PublicDataFreshnessLevel): string {
  if (level === "running") return "Data sync in progress";
  if (level === "delayed") return "Data delayed";
  if (level === "stale") return "Data stale";
  if (level === "old") return "Data outdated";
  if (level === "unavailable") return "Status unavailable";
  return "Data fresh";
}

function copyForLevel(level: PublicDataFreshnessLevel, ageLabel: string): string {
  if (level === "running") {
    return "A background scraper sync is updating game databases. Updated market prices and timers will appear shortly.";
  }
  if (level === "delayed") {
    return `Last sync was ${ageLabel}. Calculators function normally, but fast-moving market prices may lag.`;
  }
  if (level === "stale") {
    return `Last sync was ${ageLabel}. Confirm current market prices in IdleMMO before high-value crafting.`;
  }
  if (level === "old") {
    return `Last sync was ${ageLabel}. Market prices, boss timers, and conquest records reflect historical snapshots.`;
  }
  if (level === "unavailable") {
    return "Unable to verify live status endpoint. Offline cached game data remains available.";
  }
  return `Game databases are up to date. Last sync was ${ageLabel}.`;
}

function shortLabelForLevel(level: PublicDataFreshnessLevel, ageLabel: string): string {
  if (level === "running") return "Syncing...";
  if (level === "fresh") return "Fresh";
  if (level === "unavailable") return "Offline";
  return `Sync: ${ageLabel}`;
}

function formatExactDate(timestamp: number | null): string | null {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function DataFreshnessIndicator() {
  const { scraperStatus } = useData({ autoLoad: false });
  const [status, setStatus] = useState<PublicDataStatus | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isPublicDataStatus(scraperStatus)) setStatus(scraperStatus);
  }, [scraperStatus]);

  useEffect(() => {
    const updateOnlineState = () => setOnline(navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!navigator.onLine) {
      setFetchState("error");
      return;
    }
    setFetchState("loading");
    try {
      const response = await fetch(`/scraper-status.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("status unavailable");
      const payload: unknown = await response.json();
      if (isPublicDataStatus(payload)) {
        setStatus(payload);
        setFetchState("ok");
        setNow(Date.now());
      }
    } catch {
      setFetchState("error");
    }
  }, []);

  // Poll automatically every 5 minutes when tab is visible
  useEffect(() => {
    void fetchStatus();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchStatus();
    }, 300_000);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const model = useMemo(() => {
    const timestamp = parsePublicDataTimestamp(status);
    const baseLevel: PublicDataFreshnessLevel =
      (!online || (fetchState === "error" && !timestamp))
        ? "unavailable"
        : getPublicDataFreshnessLevel(status, now);
    const progress = getPublicDataProgress(status);
    const ageLabel = formatPublicDataAge(timestamp, now);
    const exactDate = formatExactDate(timestamp);
    const isActivelySyncing = baseLevel === "running" && progress !== null && !progress.complete;
    return { level: baseLevel, progress, ageLabel, exactDate, isActivelySyncing };
  }, [fetchState, now, online, status]);

  const statusTitle = titleForLevel(model.level);
  const statusCopy = copyForLevel(model.level, model.ageLabel);
  const shortLabel = shortLabelForLevel(model.level, model.ageLabel);

  const StatusIcon = model.level === "running"
    ? RefreshCw
    : model.level === "fresh"
      ? CheckCircle2
      : model.level === "unavailable"
        ? DatabaseZap
        : model.level === "delayed"
          ? Clock3
          : AlertTriangle;

  return (
    <div className={styles.wrapper}>
      <Popover open={open} onOpenChange={setOpen} placement="bottom-end" offset={8}>
        <PopoverTrigger>
          <button
            type="button"
            className={styles.trigger}
            aria-label={`Data freshness: ${statusTitle}. ${shortLabel}. Click to view details.`}
            title={`${statusTitle} (${shortLabel})`}
          >
            <span
              className={styles.dot}
              data-level={model.level}
              aria-hidden="true"
            />
            <span className={styles.label}>{shortLabel}</span>
            <span className={styles.iconOnly} aria-hidden="true">
              <Database size={16} />
              <span
                className={`${styles.dot} ${styles.badgeDot}`}
                data-level={model.level}
              />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent className={styles.popoverCard} showArrow={false}>
          <div className={styles.popoverHeader}>
            <div className={styles.iconShell} data-level={model.level} aria-hidden="true">
              <StatusIcon size={16} className={model.level === "running" ? styles.spin : ""} />
            </div>
            <div className={styles.titleGroup}>
              <span className={styles.title}>{statusTitle}</span>
              <span className={styles.syncAge}>Last sync: {model.ageLabel}</span>
            </div>
          </div>

          <div className={styles.popoverBody}>
            <p className={styles.copyText}>{statusCopy}</p>

            {/* Progress bar ONLY rendered if an active background sync is in flight */}
            {model.isActivelySyncing && model.progress && (
              <div className={styles.progressBarContainer}>
                <div className={styles.progressLabel}>
                  <span>Syncing items...</span>
                  <span>
                    {Math.min(model.progress.current, model.progress.total).toLocaleString()} / {model.progress.total.toLocaleString()}
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${Math.min(100, Math.round((model.progress.current / Math.max(1, model.progress.total)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.popoverFooter}>
            <span className={styles.exactTimestamp}>
              {model.exactDate ? `Snapshot: ${model.exactDate}` : `Updated ${model.ageLabel}`}
            </span>

            <Link
              href="/settings"
              className={styles.settingsLink}
              onClick={() => setOpen(false)}
            >
              <span>Settings</span>
              <ChevronRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
