"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Wifi, WifiOff, X } from "lucide-react";
import styles from "./OfflineSupport.module.css";

type NetworkStatus = "online" | "offline" | "restored";

export default function OfflineSupport() {
  const [status, setStatus] = useState<NetworkStatus>("online");
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const wasOffline = useRef(false);
  const restoreTimer = useRef<number | null>(null);
  const reloadingForUpdate = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

    const installingWorkerCleanups: Array<() => void> = [];
    let registrationCleanup: (() => void) | null = null;

    const markUpdateReady = (worker: ServiceWorker) => {
      if (!navigator.serviceWorker.controller) return;
      setWaitingWorker(worker);
    };

    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;

      const handleStateChange = () => {
        if (worker.state === "installed") {
          markUpdateReady(worker);
        }
      };

      worker.addEventListener("statechange", handleStateChange);
      installingWorkerCleanups.push(() => worker.removeEventListener("statechange", handleStateChange));
    };

    const refreshPublicDataCache = (registration: ServiceWorkerRegistration) => {
      if (!navigator.onLine) return;
      const worker = registration.active || registration.waiting || registration.installing;
      worker?.postMessage({ type: "ZENITH_REFRESH_PUBLIC_DATA_CACHE" });
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      refreshPublicDataCache(registration);

      if (registration.waiting) {
        markUpdateReady(registration.waiting);
      }

      watchInstallingWorker(registration.installing);

      const handleUpdateFound = () => {
        watchInstallingWorker(registration.installing);
      };

      registration.addEventListener("updatefound", handleUpdateFound);
      registrationCleanup = () => registration.removeEventListener("updatefound", handleUpdateFound);
    };

    const handleControllerChange = () => {
      if (!reloadingForUpdate.current) return;
      window.location.reload();
    };

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(watchRegistration).catch(() => {
        // The app remains usable without offline navigation fallback support.
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      registrationCleanup?.();
      installingWorkerCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    const clearRestoreTimer = () => {
      if (restoreTimer.current !== null) {
        window.clearTimeout(restoreTimer.current);
        restoreTimer.current = null;
      }
    };

    const markOffline = () => {
      clearRestoreTimer();
      wasOffline.current = true;
      setStatus("offline");
    };

    const markOnline = () => {
      clearRestoreTimer();

      if (wasOffline.current) {
        setStatus("restored");
        restoreTimer.current = window.setTimeout(() => {
          setStatus("online");
          wasOffline.current = false;
          restoreTimer.current = null;
        }, 3600);
        return;
      }

      setStatus("online");
    };

    if (!navigator.onLine) {
      markOffline();
    }

    window.addEventListener("offline", markOffline);
    window.addEventListener("online", markOnline);

    return () => {
      clearRestoreTimer();
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", markOnline);
    };
  }, []);

  const activateWaitingWorker = () => {
    if (!waitingWorker) return;
    reloadingForUpdate.current = true;
    waitingWorker.postMessage({ type: "ZENITH_ACTIVATE_WAITING_WORKER" });
  };

  if (status === "online" && waitingWorker) {
    return (
      <aside className={styles.banner} data-status="update" role="status" aria-live="polite">
        <span className={styles.iconShell} aria-hidden="true">
          <RefreshCw size={18} />
        </span>
        <span className={styles.copy}>
          <strong>Update available</strong>
          <span>Reload to use the latest Zenith Companion version.</span>
        </span>
        <span className={styles.actions}>
          <button type="button" className={styles.primaryAction} onClick={activateWaitingWorker}>
            Reload
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => setWaitingWorker(null)}
            aria-label="Dismiss update available message"
          >
            <X size={16} />
          </button>
        </span>
      </aside>
    );
  }

  if (status === "online") return null;

  const isOffline = status === "offline";
  const Icon = isOffline ? WifiOff : Wifi;

  return (
    <aside className={styles.banner} data-status={status} role="status" aria-live="polite">
      <span className={styles.iconShell} aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className={styles.copy}>
        <strong>{isOffline ? "Offline mode" : "Back online"}</strong>
        <span>
          {isOffline
            ? "Fresh public data is paused. Local profiles and settings remain on this device."
            : "Fresh public data can load again."}
        </span>
      </span>
    </aside>
  );
}
