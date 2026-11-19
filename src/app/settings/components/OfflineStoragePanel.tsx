"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, RefreshCw, Trash2 } from "lucide-react";
import {
  formatAge,
  formatBytes,
  formatPercent,
  initialOfflineStorageState,
  type OfflineStorageState,
  postServiceWorkerMessage,
} from "../types";

export default function OfflineStoragePanel() {
  const [offlineStorage, setOfflineStorage] = useState<OfflineStorageState>(initialOfflineStorageState);
  const [statusMessage, setStatusMessage] = useState("Checking offline storage.");
  const [busyAction, setBusyAction] = useState<"refresh" | "clear" | "check" | null>(null);

  const checkOfflineStorage = useCallback(async (
    message = "Offline storage checked.",
    options: { countCacheEntries?: boolean } = {},
  ) => {
    const shouldCountCacheEntries = options.countCacheEntries === true;
    if (shouldCountCacheEntries) {
      setBusyAction((current) => current || "check");
    }

    try {
      const storageSupported = "storage" in navigator && typeof navigator.storage?.estimate === "function";
      const estimate = storageSupported ? await navigator.storage.estimate() : {};
      const cacheSupported = "caches" in window;
      let cacheEntries: number | null = null;

      if (shouldCountCacheEntries && cacheSupported) {
        const cacheNames = await caches.keys();
        const offlineCacheNames = cacheNames.filter((name) => name.startsWith("zenith-offline-"));
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
        const response = await fetch("/offline-cache-manifest.json", { cache: "no-cache" });
        if (response.ok) {
          const manifest = await response.json() as { count?: number; generatedAt?: string; totalBytes?: number };
          manifestCount = Number.isFinite(manifest.count) ? Number(manifest.count) : null;
          manifestSize = Number.isFinite(manifest.totalBytes) ? Number(manifest.totalBytes) : null;
          manifestGeneratedAt = manifest.generatedAt;
        }
      } catch {
        // Keep the rest of the storage status usable if the manifest cannot be fetched.
      }

      let serviceWorkerState = "Not registered";
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        serviceWorkerState = registration?.active?.state || registration?.waiting?.state || registration?.installing?.state || "Not registered";
      }

      setOfflineStorage((current) => ({
        cacheEntries: shouldCountCacheEntries ? cacheEntries : current.cacheEntries,
        cacheEntriesChecked: shouldCountCacheEntries ? true : current.cacheEntriesChecked,
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
        error: error instanceof Error ? error.message : "Could not inspect offline storage.",
      }));
      setStatusMessage("Could not inspect offline storage.");
    } finally {
      if (shouldCountCacheEntries) {
        setBusyAction((current) => current === "check" ? null : current);
      }
    }
  }, []);

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
    setStatusMessage(action === "refresh" ? "Refreshing public offline data." : "Clearing public offline cache.");

    try {
      await postServiceWorkerMessage(action === "refresh" ? "ZENITH_REFRESH_PUBLIC_DATA_CACHE" : "ZENITH_CLEAR_PUBLIC_DATA_CACHE");
      await checkOfflineStorage(
        action === "refresh" ? "Public offline data refreshed." : "Public offline cache cleared.",
        { countCacheEntries: true },
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Offline cache action failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const canUseOfflineCache = offlineStorage.cacheSupported && offlineStorage.serviceWorkerState !== "Not registered";
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
    <div className="settings-offline-cache" aria-live="polite">
      <div className="settings-summary-grid">
        <div className="settings-summary-card">
          <span>Offline bundle</span>
          <strong>{formatBytes(offlineStorage.manifestSize ?? undefined)}</strong>
          <small>
            {offlineStorage.manifestCount !== null
              ? `${offlineStorage.manifestCount.toLocaleString()} public files`
              : "Manifest unavailable"}
          </small>
        </div>
        <div className="settings-summary-card">
          <span>Browser storage</span>
          <strong>{storageUsageLabel}</strong>
          <small>{formatPercent(offlineStorage.usage, offlineStorage.quota)}</small>
        </div>
        <div className="settings-summary-card">
          <span>Cached entries</span>
          <strong>{cachedEntriesLabel}</strong>
          <small>{offlineStorage.cacheEntriesChecked ? "Service worker" : "Count on demand"}: {offlineStorage.serviceWorkerState}</small>
        </div>
      </div>

      <div className="settings-actions-row settings-offline-actions">
        <button
          type="button"
          className="settings-link-button"
          onClick={() => runOfflineAction("refresh")}
          disabled={!canUseOfflineCache || busyAction !== null}
        >
          <RefreshCw size={14} /> Refresh offline data
        </button>
        <button
          type="button"
          className="settings-link-button settings-danger-link"
          onClick={() => runOfflineAction("clear")}
          disabled={!canUseOfflineCache || busyAction !== null}
        >
          <Trash2 size={14} /> Clear offline cache
        </button>
        <button
          type="button"
          className="settings-link-button settings-secondary-link"
          onClick={() => checkOfflineStorage("Offline cache entries counted.", { countCacheEntries: true })}
          disabled={busyAction !== null}
        >
          <Database size={14} /> Count cached files
        </button>
      </div>

      <p className="settings-panel-note settings-offline-note">
        These controls manage only public app files and generated game data cached for offline use. They do not delete profiles, settings, custom prices, queues, or planner data stored in your browser.
      </p>
      <p className="settings-empty-note">{busyAction ? "Working..." : statusMessage}</p>
      {offlineStorage.error && <p className="settings-warning-note">{offlineStorage.error}</p>}
      {offlineStorage.manifestGeneratedAt && (
        <p className="settings-empty-note">Offline manifest generated {formatAge(offlineStorage.manifestGeneratedAt)}.</p>
      )}
    </div>
  );
}
