"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "zenith_usage_visitor_id";
const SESSION_KEY = "zenith_usage_session_id";

function randomId(prefix: string) {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}_${cryptoApi.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function getStorageId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const next = randomId(prefix);
  storage.setItem(key, next);
  return next;
}

function deviceType() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const width = window.innerWidth;
  if (coarse && width < 768) return "mobile";
  if (coarse && width < 1180) return "tablet";
  return "desktop";
}

function sendUsagePing(path: string, eventType: "pageview" | "heartbeat") {
  if (document.visibilityState === "hidden" && eventType !== "pageview") return;

  const payload = {
    visitorId: getStorageId(window.localStorage, VISITOR_KEY, "vis"),
    sessionId: getStorageId(window.sessionStorage, SESSION_KEY, "ses"),
    eventType,
    path,
    referrer: document.referrer,
    deviceType: deviceType(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  };

  void fetch("/api/usage/ping", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}

export default function UsageTracker() {
  const pathname = usePathname();
  const latestPathRef = useRef(pathname || "/");

  useEffect(() => {
    const path = pathname || "/";
    latestPathRef.current = path;
    sendUsagePing(path, "pageview");
  }, [pathname]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      sendUsagePing(latestPathRef.current, "heartbeat");
    }, 60_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sendUsagePing(latestPathRef.current, "heartbeat");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
