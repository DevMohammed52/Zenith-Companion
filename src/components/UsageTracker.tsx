"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getRootPlayerDigest, PROFILE_STORAGE_KEY } from "@/lib/profiles";

const VISITOR_KEY = "zenith_usage_visitor_id";
const COOKIE_VISITOR_NAME = "__zvid";
const SESSION_STORAGE_KEY = "zenith_active_session";
const DISABLE_ANALYTICS_KEY = "zenith_disable_analytics";
const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes rolling session
const HEARTBEAT_INTERVAL_MS = 90_000; // 90 seconds
const HEARTBEAT_COOLDOWN_MS = 60_000; // 60 seconds minimum cooldown
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes interaction timeout

type ActiveSession = {
  id: string;
  lastActive: number;
};

// In-memory fallback for blocked/private storage
const inMemoryStore = new Map<string, string>();
let inMemorySession: ActiveSession | null = null;

function randomId(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}_${cryptoApi.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function safeGetLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return inMemoryStore.get(key) ?? null;
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
  inMemoryStore.set(key, value);
}

function getCookie(name: string): string | null {
  try {
    if (!document.cookie) return null;
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eq = cookie.indexOf("=");
      if (eq === -1) continue;
      const k = cookie.slice(0, eq).trim();
      if (k === name) {
        const v = cookie.slice(eq + 1).trim();
        return v ? decodeURIComponent(v) : null;
      }
    }
  } catch {}
  return null;
}

function setCookie(name: string, value: string, maxAge = 31536000): void {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
  } catch {}
}

function getVisitorId(): string {
  const inMemory = inMemoryStore.get(VISITOR_KEY);
  if (inMemory?.trim()) return inMemory.trim();

  let fromStorage: string | null = null;
  try {
    fromStorage = window.localStorage.getItem(VISITOR_KEY);
  } catch {}

  const cleanStorage = fromStorage?.trim();
  if (cleanStorage) {
    inMemoryStore.set(VISITOR_KEY, cleanStorage);
    setCookie(COOKIE_VISITOR_NAME, cleanStorage);
    return cleanStorage;
  }

  // Fallback: inspect document.cookie for __zvid (WebKit ITP 7-day purge fallback)
  const fromCookie = getCookie(COOKIE_VISITOR_NAME)?.trim();
  if (fromCookie) {
    safeSetLocalStorage(VISITOR_KEY, fromCookie);
    setCookie(COOKIE_VISITOR_NAME, fromCookie);
    return fromCookie;
  }

  // Mint new visitor ID
  const fresh = randomId("vis");
  safeSetLocalStorage(VISITOR_KEY, fresh);
  setCookie(COOKIE_VISITOR_NAME, fresh);
  return fresh;
}

function parseSession(raw: string | null): ActiveSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActiveSession;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      parsed.id.trim().length > 0 &&
      Number.isFinite(parsed.lastActive) &&
      parsed.lastActive > 0
    ) {
      return { id: parsed.id.trim(), lastActive: parsed.lastActive };
    }
  } catch {}
  return null;
}

function getActiveSessionId(now = Date.now()): string {
  let session: ActiveSession | null = null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    session = parseSession(raw);
  } catch {
    // Storage access threw: fall back strictly to in-memory state — do NOT call sessionStorage
    session = inMemorySession;
  }

  if (!session && inMemorySession) {
    session = inMemorySession;
  }

  if (session && now - session.lastActive < SESSION_TIMEOUT_MS && session.lastActive <= now + 60_000) {
    session.lastActive = now;
    inMemorySession = session;
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}
    return session.id;
  }

  const fresh: ActiveSession = {
    id: randomId("ses"),
    lastActive: now,
  };
  inMemorySession = fresh;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fresh));
  } catch {}
  return fresh.id;
}

function getStoredPlayerDigest(): string | undefined {
  try {
    const raw = safeGetLocalStorage(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.profiles)) {
        return getRootPlayerDigest(parsed.profiles);
      }
    }
  } catch {}
  return undefined;
}

function deviceType(): string {
  const coarse = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : false;
  const width = window.innerWidth;
  if (coarse && width < 768) return "mobile";
  if (coarse && width < 1180) return "tablet";
  return "desktop";
}

function shouldSkipAnalytics(): boolean {
  if (DEV_HOSTS.has(window.location.hostname)) return true;
  if (navigator.webdriver) return true;
  return safeGetLocalStorage(DISABLE_ANALYTICS_KEY) === "true";
}

function sendUsagePing(path: string, eventType: "pageview" | "heartbeat"): void {
  if (shouldSkipAnalytics()) return;
  if (document.visibilityState === "hidden" && eventType !== "pageview") return;

  const characterDigest = getStoredPlayerDigest();

  const payload = {
    visitorId: getVisitorId(),
    sessionId: getActiveSessionId(),
    eventType,
    path,
    referrer: document.referrer,
    deviceType: deviceType(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    ...(characterDigest ? { characterDigest } : {}),
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
  const lastPingMsRef = useRef<number>(0);
  const lastInteractionMsRef = useRef<number>(Date.now());

  // Pageviews: MUST NEVER be dropped or throttled on route navigation
  useEffect(() => {
    const path = pathname || "/";
    latestPathRef.current = path;
    const now = Date.now();
    lastPingMsRef.current = now;
    lastInteractionMsRef.current = now;
    sendUsagePing(path, "pageview");
  }, [pathname]);

  // Heartbeats, passive interaction listeners & cross-tab session synchronization
  useEffect(() => {
    const updateInteraction = () => {
      lastInteractionMsRef.current = Date.now();
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    for (const event of interactionEvents) {
      window.addEventListener(event, updateInteraction, { passive: true });
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY) {
        inMemorySession = event.newValue ? parseSession(event.newValue) : null;
      }
    };
    window.addEventListener("storage", handleStorage);

    const maybeSendHeartbeat = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      // Human activity gating: after 15 minutes of zero interaction, suspend heartbeat
      if (now - lastInteractionMsRef.current >= IDLE_TIMEOUT_MS) return;
      // Minimum 60s cooldown
      if (now - lastPingMsRef.current < HEARTBEAT_COOLDOWN_MS) return;

      lastPingMsRef.current = now;
      sendUsagePing(latestPathRef.current, "heartbeat");
    };

    const interval = window.setInterval(maybeSendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        maybeSendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      for (const event of interactionEvents) {
        window.removeEventListener(event, updateInteraction);
      }
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}

export const _usageTrackerTesting = {
  VISITOR_KEY,
  COOKIE_VISITOR_NAME,
  SESSION_STORAGE_KEY,
  SESSION_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_COOLDOWN_MS,
  IDLE_TIMEOUT_MS,
  getCookie,
  setCookie,
  getVisitorId,
  parseSession,
  getActiveSessionId,
  deviceType,
  safeGetLocalStorage,
  safeSetLocalStorage,
  inMemoryStore,
  getInMemorySession: () => inMemorySession,
  setInMemorySession: (s: ActiveSession | null) => {
    inMemorySession = s;
  },
  resetTestingState: () => {
    inMemoryStore.clear();
    inMemorySession = null;
  },
};
