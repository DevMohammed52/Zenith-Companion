"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import styles from "./OfflineSupport.module.css";

type NetworkStatus = "online" | "offline" | "restored";

export default function OfflineSupport() {
  const [status, setStatus] = useState<NetworkStatus>("online");
  const wasOffline = useRef(false);
  const restoreTimer = useRef<number | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
        if (navigator.onLine) {
          const worker = registration.active || registration.waiting || registration.installing;
          worker?.postMessage({ type: "ZENITH_REFRESH_PUBLIC_DATA_CACHE" });
        }
      }).catch(() => {
        // The app remains usable without offline navigation fallback support.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
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
