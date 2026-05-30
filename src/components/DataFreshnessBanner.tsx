"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, DatabaseZap, RefreshCw } from "lucide-react";
import { useData } from "@/context/DataContext";
import {
  formatPublicDataAge,
  getPublicDataFreshnessLevel,
  getPublicDataProgress,
  parsePublicDataTimestamp,
  type PublicDataFreshnessLevel,
  type PublicDataStatus,
} from "@/lib/data-freshness";
import styles from "./DataFreshnessBanner.module.css";

type FetchState = "idle" | "ok" | "error";

function isPublicDataStatus(value: unknown): value is PublicDataStatus {
  return Boolean(value && typeof value === "object");
}

function titleForLevel(level: PublicDataFreshnessLevel) {
  if (level === "running") return "Data refresh running";
  if (level === "delayed") return "Data delayed";
  if (level === "stale") return "Data stale";
  if (level === "old") return "Data old";
  if (level === "unavailable") return "Freshness check unavailable";
  return "Data fresh";
}

function copyForLevel(level: PublicDataFreshnessLevel, ageLabel: string) {
  if (level === "running") {
    return `A generated-data refresh is currently writing core public snapshots. Some pages may mix fresh and previous data until it finishes.`;
  }
  if (level === "delayed") {
    return `Last generated-data sync was ${ageLabel}. Most pages still work, but fast-moving market and world state may lag.`;
  }
  if (level === "stale") {
    return `Last generated-data sync was ${ageLabel}. Confirm live market listings and game state before acting on planner results.`;
  }
  if (level === "old") {
    return `Last generated-data sync was ${ageLabel}. Treat market, boss, pet, conquest, and location views as historical snapshots.`;
  }
  return "Zenith could not verify scraper-status.json. Cached core public data may still load, but freshness is unknown.";
}

export default function DataFreshnessBanner() {
  const { scraperStatus } = useData({ autoLoad: false });
  const [status, setStatus] = useState<PublicDataStatus | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(() => Date.now());

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

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      if (!navigator.onLine) return;
      try {
        const response = await fetch(`/scraper-status.json?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("status unavailable");
        const payload: unknown = await response.json();
        if (!cancelled && isPublicDataStatus(payload)) {
          setStatus(payload);
          setFetchState("ok");
        }
      } catch {
        if (!cancelled) setFetchState("error");
      }
    };

    void fetchStatus();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchStatus();
    }, 300_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const model = useMemo(() => {
    const timestamp = parsePublicDataTimestamp(status);
    const baseLevel: PublicDataFreshnessLevel = fetchState === "error" && !timestamp
      ? "unavailable"
      : getPublicDataFreshnessLevel(status, now);
    const progress = getPublicDataProgress(status);
    const ageLabel = formatPublicDataAge(timestamp, now);
    return { level: baseLevel, progress, ageLabel, timestamp };
  }, [fetchState, now, status]);

  if (!online || model.level === "fresh") return null;

  const Icon = model.level === "running"
    ? RefreshCw
    : model.level === "unavailable"
      ? DatabaseZap
      : model.level === "delayed"
        ? Clock3
        : AlertTriangle;
  const progressText = model.progress
    ? `${Math.min(model.progress.current, model.progress.total).toLocaleString()} / ${model.progress.total.toLocaleString()}${model.progress.item ? ` - ${model.progress.item}` : ""}`
    : null;
  const statusTitle = titleForLevel(model.level);
  const statusCopy = copyForLevel(model.level, model.ageLabel);
  const metaText = model.level === "running" && progressText
    ? `Progress ${progressText}`
    : `Last sync ${model.ageLabel}`;

  return (
    <aside
      className={styles.banner}
      data-level={model.level}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${statusTitle}. ${statusCopy} ${metaText}.`}
      title={`${statusCopy} ${metaText}.`}
    >
      <span className={styles.iconShell} aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className={styles.copy}>
        <strong>{statusTitle}</strong>
        <span className={styles.meta}>{metaText}</span>
      </span>
    </aside>
  );
}
