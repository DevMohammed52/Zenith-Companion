"use client";

import { useCallback, useEffect, useState } from "react";
import { Banner, Button, Icon } from "@/components/ui";
import {
  formatAge,
  formatBytes,
  formatPercent,
  initialOfflineStorageState,
  type OfflineStorageState,
  postServiceWorkerMessage,
} from "../types";
import styles from "../Settings.module.css";

export default function OfflineStoragePanel() {
  const [offlineStorage, setOfflineStorage] = useState<OfflineStorageState>(
    initialOfflineStorageState
  );
  const [statusMessage, setStatusMessage] = useState("Checking offline storage.");
  const [busyAction, setBusyAction] = useState<"refresh" | "clear" | "check" | null>(
    null
  );

  const checkOfflineStorage = useCallback(
    async (
      message = "Offline storage checked.",
      options: { countCacheEntries?: boolean } = {}
    ) => {
      const shouldCountCacheEntries = options.countCacheEntries === true;
      if (shouldCountCacheEntries) {
        setBusyAction((current) => current || "check");
      }

      try {
        const storageSupported =
          "storage" in navigator &&
          typeof navigator.storage?.estimate === "function";
        const estimate = storageSupported ? await navigator.storage.estimate() : {};
        const cacheSupported = "caches" in window;
        let cacheEntries: number | null = null;

        if (shouldCountCacheEntries && cacheSupported) {
          const cacheNames = await caches.keys();
          const offlineCacheNames = cacheNames.filter((name) =>
            name.startsWith("zenith-offline-")
          );
          cacheEntries = 0;

          for (const name of offlineCacheNames) {
            const cache = await caches.open(name);
            cacheEntries += (await cache.keys()).length;
          }
        }

        let manifestCount: number | null = null;
        let manifestSize: number | null = null;
        let manifestGeneratedAt: string | undefined;

        try {
          const response = await fetch("/offline-cache-manifest.json", {
            cache: "no-cache",
          });
          if (response.ok) {
            const manifest = (await response.json()) as {
              count?: number;
              generatedAt?: string;
              totalBytes?: number;
            };
            manifestCount = Number.isFinite(manifest.count)
              ? Number(manifest.count)
              : null;
            manifestSize = Number.isFinite(manifest.totalBytes)
              ? Number(manifest.totalBytes)
              : null;
            manifestGeneratedAt = manifest.generatedAt;
          }
        } catch {
          // Keep the rest of the storage status usable if the manifest cannot be fetched.
        }

        let serviceWorkerState = "Not registered";
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          serviceWorkerState =
            registration?.active?.state ||
            registration?.waiting?.state ||
            registration?.installing?.state ||
            "Not registered";
        }

        setOfflineStorage((current) => ({
          cacheEntries: shouldCountCacheEntries ? cacheEntries : current.cacheEntries,
          cacheEntriesChecked: shouldCountCacheEntries
            ? true
            : current.cacheEntriesChecked,
          cacheSupported,
          error: undefined,
          manifestCount,
          manifestGeneratedAt,
          manifestSize,
          quota: estimate.quota,
          serviceWorkerState,
          storageSupported,
          usage: estimate.usage,
        }));
        setStatusMessage(message);
      } catch (error) {
        setOfflineStorage((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : "Could not inspect offline storage.",
        }));
        setStatusMessage("Could not inspect offline storage.");
      } finally {
        if (shouldCountCacheEntries) {
          setBusyAction((current) => (current === "check" ? null : current));
        }
      }
    },
    []
  );

  useEffect(() => {
    void checkOfflineStorage("Offline storage status loaded.");
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready
        .then(() => checkOfflineStorage("Offline support is active."))
        .catch(() => {});
    }
  }, [checkOfflineStorage]);

  const runOfflineAction = async (action: "refresh" | "clear") => {
    setBusyAction(action);
    setStatusMessage(
      action === "refresh"
        ? "Refreshing public offline data."
        : "Clearing public offline cache."
    );

    try {
      await postServiceWorkerMessage(
        action === "refresh"
          ? "ZENITH_REFRESH_PUBLIC_DATA_CACHE"
          : "ZENITH_CLEAR_PUBLIC_DATA_CACHE"
      );
      await checkOfflineStorage(
        action === "refresh"
          ? "Public offline data refreshed."
          : "Public offline cache cleared.",
        { countCacheEntries: true }
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Offline cache action failed."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const canUseOfflineCache =
    offlineStorage.cacheSupported &&
    offlineStorage.serviceWorkerState !== "Not registered";
  const storageUsageLabel = offlineStorage.storageSupported
    ? `${formatBytes(offlineStorage.usage)} / ${formatBytes(offlineStorage.quota)}`
    : "Unsupported";
  const cachedEntriesLabel = !offlineStorage.cacheSupported
    ? "Unsupported"
    : busyAction === "check"
    ? "Counting..."
    : offlineStorage.cacheEntriesChecked
    ? (offlineStorage.cacheEntries ?? 0).toLocaleString()
    : "Run check";

  return (
    <div
      className={`settings-offline-cache ${styles.storagePanel}`}
      aria-live="polite"
      style={{ marginTop: "1rem" }}
    >
      <div className={`settings-summary-grid ${styles.storageMetricsGrid}`}>
        <div className={`settings-summary-card ${styles.storageMetricCard}`}>
          <span className={styles.storageMetricLabel}>Offline bundle</span>
          <strong className={styles.storageMetricValue}>
            {formatBytes(offlineStorage.manifestSize ?? undefined)}
          </strong>
          <small className={styles.storageMetricSub}>
            {offlineStorage.manifestCount !== null
              ? `${offlineStorage.manifestCount.toLocaleString()} public files`
              : "Manifest unavailable"}
          </small>
        </div>

        <div className={`settings-summary-card ${styles.storageMetricCard}`}>
          <span className={styles.storageMetricLabel}>Browser storage</span>
          <strong className={styles.storageMetricValue}>{storageUsageLabel}</strong>
          <small className={styles.storageMetricSub}>
            {formatPercent(offlineStorage.usage, offlineStorage.quota)}
          </small>
        </div>

        <div className={`settings-summary-card ${styles.storageMetricCard}`}>
          <span className={styles.storageMetricLabel}>Cached entries</span>
          <strong className={styles.storageMetricValue}>{cachedEntriesLabel}</strong>
          <small className={styles.storageMetricSub}>
            {offlineStorage.cacheEntriesChecked ? "Service worker" : "Count on demand"}:{" "}
            {offlineStorage.serviceWorkerState}
          </small>
        </div>
      </div>

      <div className={`settings-actions-row settings-offline-actions ${styles.storageActionsRow}`}>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="refresh" size={13} />}
          onClick={() => runOfflineAction("refresh")}
          disabled={!canUseOfflineCache || busyAction !== null}
        >
          Refresh offline data
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Icon name="trash" size={13} />}
          onClick={() => runOfflineAction("clear")}
          disabled={!canUseOfflineCache || busyAction !== null}
        >
          Clear offline cache
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="database" size={13} />}
          onClick={() =>
            checkOfflineStorage("Offline cache entries counted.", {
              countCacheEntries: true,
            })
          }
          disabled={busyAction !== null}
        >
          Count cached files
        </Button>
      </div>

      <Banner variant="info" className={styles.offlineBanner}>
        These controls manage only public app files and cached game data. They never delete character profiles, custom prices, or local settings stored in your browser.
      </Banner>

      <div className={styles.offlineStatusStack}>
        <p className={styles.storageStatusNote}>
          {busyAction ? "Working..." : statusMessage}
        </p>
        {offlineStorage.error && (
          <p className={`settings-warning-note ${styles.offlineErrorNote}`}>
            {offlineStorage.error}
          </p>
        )}
        {offlineStorage.manifestGeneratedAt && (
          <p className={styles.storageStatusSub}>
            Offline manifest generated {formatAge(offlineStorage.manifestGeneratedAt)}.
          </p>
        )}
      </div>
    </div>
  );
}
