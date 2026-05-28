"use client";

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

function deviceType() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
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
    return true;
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

function sendWebVital(path: string, metric: WebVitalMetric) {
  if (shouldSkipVitals()) return;
  if (!VITAL_METRICS.has(metric.name)) return;
  const value = roundedVitalValue(metric.value);
  if (value === null) return;

  const payload = {
    metricName: metric.name,
    value,
    rating: normalizeRating(metric.rating),
    path,
    deviceType: deviceType(),
    navigationType: normalizeNavigationType(metric.navigationType),
  };

  void fetch("/api/usage/vitals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}

export default function WebVitalsReporter() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    sendWebVital(pathname || "/", metric as WebVitalMetric);
  });

  return null;
}
