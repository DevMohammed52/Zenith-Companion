"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

const DISABLE_ANALYTICS_KEY = "zenith_disable_analytics";
const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const VITAL_METRICS = new Set(["CLS", "FCP", "INP", "LCP", "TTFB"]);

type WebVitalMetric = {
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
};

type WebVitalPayload = {
  metricName: string;
  value: number;
  rating: string;
  path: string;
  deviceType: string;
  navigationType: string;
};

function deviceType() {
  const coarse = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : false;
  const width = window.innerWidth;
  if (coarse && width < 768) return "mobile";
  if (coarse && width < 1180) return "tablet";
  return "desktop";
}

function shouldSkipVitals() {
  if (DEV_HOSTS.has(window.location.hostname)) return true;
  if (navigator.webdriver) return true;
  try {
    return window.localStorage.getItem(DISABLE_ANALYTICS_KEY) === "true";
  } catch {
    return false;
  }
}

function normalizeRating(value: string | undefined) {
  return value === "good" || value === "needs-improvement" || value === "poor" ? value : "unknown";
}

function normalizeNavigationType(value: string | undefined) {
  return value === "navigate" || value === "reload" || value === "back-forward" || value === "restore" || value === "prerender"
    ? value
    : "unknown";
}

function roundedVitalValue(value: number) {
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(Math.min(value, 120000) * 1000) / 1000;
}

function flushBatch(items: WebVitalPayload[]) {
  if (items.length === 0) return;
  if (shouldSkipVitals()) return;

  void fetch("/api/usage/vitals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(items),
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}

export default function WebVitalsReporter() {
  const pathname = usePathname();
  const bufferRef = useRef<Map<string, WebVitalPayload>>(new Map());
  const pathRef = useRef(pathname || "/");

  const flush = () => {
    if (bufferRef.current.size === 0) return;
    const items = Array.from(bufferRef.current.values());
    bufferRef.current.clear();
    flushBatch(items);
  };

  useEffect(() => {
    const current = pathname || "/";
    if (pathRef.current !== current) {
      flush();
      pathRef.current = current;
    }
  }, [pathname]);

  useReportWebVitals((metric) => {
    if (shouldSkipVitals()) return;
    if (!VITAL_METRICS.has(metric.name)) return;
    const value = roundedVitalValue(metric.value);
    if (value === null) return;

    bufferRef.current.set(metric.name, {
      metricName: metric.name,
      value,
      rating: normalizeRating(metric.rating),
      path: pathRef.current,
      deviceType: deviceType(),
      navigationType: normalizeNavigationType(metric.navigationType),
    });
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    const handlePageHide = () => {
      flush();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flush();
    };
  }, []);

  return null;
}

export const _webVitalsTesting = {
  shouldSkipVitals,
  deviceType,
  flushBatch,
  VITAL_METRICS,
  normalizeRating,
  normalizeNavigationType,
  roundedVitalValue,
};
