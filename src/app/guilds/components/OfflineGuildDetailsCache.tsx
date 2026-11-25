"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Icon, ProgressBar } from "@/components/ui";
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
      ? "Offline unavailable"
      : status === "running"
        ? `Caching ${formatGuildNumber(completed)}/${formatGuildNumber(progress.total)}`
        : status === "done"
          ? "Ready offline"
          : status === "error"
            ? "Needs retry"
            : "Opt-in cache";

  const statusBadgeVariant =
    status === "done" ? "success" : status === "error" ? "danger" : status === "running" ? "refined" : "neutral";

  const displayMessage =
    supportChecked && !cacheSupported
      ? "Offline detail caching activates once the service worker finishes installing."
      : message;

  return (
    <div className={styles.offlineCachePanel} data-state={status} aria-live="polite">
      <div className={styles.offlineCacheHeader}>
        <div className={styles.offlineCacheCopy}>
          <span className={styles.offlineCacheTitle}>Offline Guild Details</span>
          <small>{displayMessage}</small>
        </div>
        <Badge variant={statusBadgeVariant} size="sm">{statusLabel}</Badge>
      </div>

      <div className={styles.offlineCacheActions}>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canCache || shownUrls.length === 0}
          loading={activeMode === "shown"}
          icon={<Icon name="download" size="sm" />}
          onClick={() => cacheGuilds("shown", shownUrls)}
          aria-label={`Cache ${shownUrls.length} shown guild detail files offline`}
        >
          Cache shown ({formatGuildNumber(shownUrls.length)})
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canCache || allUrls.length === 0}
          loading={activeMode === "all"}
          icon={<Icon name="download" size="sm" />}
          onClick={() => cacheGuilds("all", allUrls)}
          aria-label={`Cache all ${allUrls.length} guild detail files offline`}
        >
          Cache all ({formatGuildNumber(allUrls.length)})
        </Button>
      </div>

      {status === "running" && (
        <ProgressBar
          value={completed}
          max={progress.total || 1}
          label={`Caching guild details: ${formatGuildNumber(completed)} of ${formatGuildNumber(progress.total)}`}
          size="sm"
        />
      )}
    </div>
  );
}
