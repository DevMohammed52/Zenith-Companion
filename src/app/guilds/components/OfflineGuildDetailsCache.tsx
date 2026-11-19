"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { formatGuildNumber, type GuildRecord } from "@/lib/guilds";
import styles from "../page.module.css";
import {
  getGuildDetailUrls,
  requestGuildDetailCache,
  type GuildCacheMode,
  type GuildCacheProgress,
} from "../types";

export interface OfflineGuildDetailsCacheProps {
  shownGuilds: Array<Pick<GuildRecord, "id">>;
  allGuilds: Array<Pick<GuildRecord, "id">>;
}

export function OfflineGuildDetailsCache({
  shownGuilds,
  allGuilds,
}: OfflineGuildDetailsCacheProps) {
  const [supportChecked, setSupportChecked] = useState(false);
  const [cacheSupported, setCacheSupported] = useState(false);
  const [activeMode, setActiveMode] = useState<GuildCacheMode | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("Details stay network-first until you cache them.");
  const [progress, setProgress] = useState<GuildCacheProgress>({ cached: 0, failed: 0, total: 0 });
  const shownUrls = useMemo(() => getGuildDetailUrls(shownGuilds), [shownGuilds]);
  const allUrls = useMemo(() => getGuildDetailUrls(allGuilds), [allGuilds]);
  const completed = Math.min(progress.total, progress.cached + progress.failed);
  const percent = progress.total > 0 ? Math.round((completed / progress.total) * 100) : 0;
  const isBusy = activeMode !== null;
  const canCache = supportChecked && cacheSupported && !isBusy;

  useEffect(() => {
    let active = true;

    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setSupportChecked(true);
      setCacheSupported(false);
      return;
    }

    const markSupported = (registration?: ServiceWorkerRegistration | null) => {
      if (!active) return;
      setCacheSupported(Boolean(registration?.active || navigator.serviceWorker.controller));
      setSupportChecked(true);
    };

    const markUnsupported = () => {
      if (!active) return;
      setCacheSupported(false);
      setSupportChecked(true);
    };

    const handleControllerChange = () => {
      markSupported();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    navigator.serviceWorker
      .getRegistration()
      .then(markSupported)
      .catch(markUnsupported);

    navigator.serviceWorker.ready.then(markSupported).catch(markUnsupported);

    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const cacheGuilds = useCallback(async (mode: GuildCacheMode, urls: string[]) => {
    if (!urls.length) return;

    setActiveMode(mode);
    setStatus("running");
    setProgress({ cached: 0, failed: 0, total: urls.length });
    setMessage(mode === "shown" ? "Caching shown guild detail files..." : "Caching every guild detail file...");

    try {
      const result = await requestGuildDetailCache(urls, setProgress);
      const failedText = result.failed > 0 ? ` ${formatGuildNumber(result.failed)} failed.` : "";
      setProgress(result);
      setStatus("done");
      setMessage(`Cached ${formatGuildNumber(result.cached)} guild detail files.${failedText}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Guild detail offline cache failed.");
    } finally {
      setActiveMode(null);
    }
  }, []);

  const statusLabel = !supportChecked
    ? "Checking support"
    : !cacheSupported
      ? "Offline cache unavailable"
      : status === "running"
        ? `Caching ${formatGuildNumber(completed)}/${formatGuildNumber(progress.total)}`
        : status === "done"
          ? "Ready offline"
          : status === "error"
            ? "Needs retry"
            : "Opt-in cache";
  const displayMessage =
    supportChecked && !cacheSupported
      ? "Reload after offline support finishes installing, or use this from the deployed app."
      : message;

  return (
    <div className={styles.offlineCachePanel} data-state={status} aria-live="polite">
      <div className={styles.offlineCacheCopy}>
        <span>Offline guild details</span>
        <strong>{statusLabel}</strong>
        <small>{displayMessage}</small>
      </div>

      <div className={styles.offlineCacheActions}>
        <button
          type="button"
          className={styles.offlineCacheButton}
          disabled={!canCache || shownUrls.length === 0}
          onClick={() => cacheGuilds("shown", shownUrls)}
          aria-label={`Cache ${shownUrls.length} shown guild detail files offline`}
        >
          <Database size={15} aria-hidden="true" />
          <span>Cache shown</span>
          <small>{formatGuildNumber(shownUrls.length)}</small>
        </button>
        <button
          type="button"
          className={styles.offlineCacheButton}
          disabled={!canCache || allUrls.length === 0}
          onClick={() => cacheGuilds("all", allUrls)}
          aria-label={`Cache all ${allUrls.length} guild detail files offline`}
        >
          <Database size={15} aria-hidden="true" />
          <span>Cache all</span>
          <small>{formatGuildNumber(allUrls.length)}</small>
        </button>
      </div>

      {status === "running" && (
        <div
          className={styles.offlineCacheProgress}
          role="progressbar"
          aria-label="Guild detail offline cache progress"
          aria-valuemin={0}
          aria-valuemax={progress.total || 1}
          aria-valuenow={completed}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
