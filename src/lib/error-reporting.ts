"use client";

export type AppErrorEventType = "route_error" | "app_shell_error";

const DISABLE_ANALYTICS_KEY = "zenith_disable_analytics";
const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

type ReportableError = Error & { digest?: string };

function shouldSkipErrorReporting() {
  if (DEV_HOSTS.has(window.location.hostname)) return true;
  if (navigator.webdriver) return true;
  try {
    return window.localStorage.getItem(DISABLE_ANALYTICS_KEY) === "true";
  } catch {
    return true;
  }
}

function browserClass() {
  const ua = navigator.userAgent.toLowerCase();
  if (/bot|crawler|spider|crawling/.test(ua)) return "bot";
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("firefox/") || ua.includes("fxios/")) return "firefox";
  if (ua.includes("chrome/") || ua.includes("crios/")) return "chrome";
  if (ua.includes("safari/")) return "safari";
  return ua ? "other" : "unknown";
}

function errorDigest(error: ReportableError) {
  return typeof error.digest === "string" ? error.digest.slice(0, 128) : "";
}

export function reportAppError(error: ReportableError, eventType: AppErrorEventType) {
  if (shouldSkipErrorReporting()) return;

  const payload = {
    source: "client",
    eventType,
    path: window.location.pathname || "/",
    digest: errorDigest(error),
    browserClass: browserClass(),
  };

  void fetch("/api/error/report", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}
