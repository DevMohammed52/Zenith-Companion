import { NextResponse } from "next/server";
import { extractForwardedClientIp, fetchProfileImportJson } from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

const VITALS_BODY_LIMIT = 8192;
const NO_STORE_HEADERS = { "cache-control": "no-store" };
const VITAL_METRICS = new Set(["CLS", "FCP", "INP", "LCP", "TTFB"]);
const VITAL_RATINGS = new Set(["good", "needs-improvement", "poor"]);
const NAVIGATION_TYPES = new Set(["navigate", "reload", "back-forward", "restore", "prerender"]);

type WebVitalInput = {
  metricName?: unknown;
  metric?: unknown;
  name?: unknown;
  value?: unknown;
  rating?: unknown;
  path?: unknown;
  deviceType?: unknown;
  navigationType?: unknown;
};

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isRecord(value: unknown): value is WebVitalInput {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePath(value: unknown) {
  const text = cleanString(value, 160);
  if (!text.startsWith("/")) return "";
  return text.split(/[?#]/)[0].slice(0, 120) || "/";
}

function normalizeMetricName(value: unknown) {
  const text = cleanString(value, 12).toUpperCase();
  return VITAL_METRICS.has(text) ? text : "";
}

function normalizeVitalValue(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(Math.min(number, 120000) * 1000) / 1000;
}

function normalizeRating(value: unknown) {
  const text = cleanString(value, 32).toLowerCase();
  return VITAL_RATINGS.has(text) ? text : "unknown";
}

function normalizeDeviceType(value: unknown) {
  const text = cleanString(value, 24).toLowerCase();
  return ["mobile", "tablet", "desktop"].includes(text) ? text : "unknown";
}

function normalizeNavigationType(value: unknown) {
  const text = cleanString(value, 32).toLowerCase();
  return NAVIGATION_TYPES.has(text) ? text : "unknown";
}

export async function POST(request: Request) {
  const usagePingSecret = process.env.USAGE_PING_SECRET?.trim();
  if (!usagePingSecret) {
    return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > VITALS_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "request_too_large", message: "Usage vitals event is too large." } },
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  const text = await request.text().catch(() => "");
  if (!text || text.length > VITALS_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid usage vitals event." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid usage vitals event." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const isArray = Array.isArray(raw);
  if (Array.isArray(raw) && (raw.length === 0 || raw.length > 50)) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid usage vitals event." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const rawItems: WebVitalInput[] = isArray
    ? (raw as unknown[]).filter(isRecord)
    : (isRecord(raw) ? [raw] : []);

  if (rawItems.length === 0) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid usage vitals event." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const normalizedItems = [];
  for (const item of rawItems) {
    const metricName = normalizeMetricName(item.metricName || item.metric || item.name);
    const metricValue = normalizeVitalValue(item.value);
    const path = normalizePath(item.path);
    if (!metricName || metricValue === null || !path) {
      if (!isArray) {
        return NextResponse.json(
          { error: { code: "bad_request", message: "Invalid usage vitals event." } },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }
      continue;
    }

    normalizedItems.push({
      metricName,
      value: metricValue,
      rating: normalizeRating(item.rating),
      path,
      deviceType: normalizeDeviceType(item.deviceType),
      navigationType: normalizeNavigationType(item.navigationType),
    });
  }

  if (normalizedItems.length === 0) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid usage vitals event." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const body = JSON.stringify(isArray ? normalizedItems : normalizedItems[0]);

  const origin = request.headers.get("origin");
  const clientIp = extractForwardedClientIp(request);
  const userAgent = request.headers.get("user-agent");

  const result = await fetchProfileImportJson("/usage/vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${usagePingSecret}`,
      ...(origin ? { origin } : {}),
      ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
      ...(userAgent ? { "user-agent": userAgent } : {}),
    },
    body,
  }, "Usage vitals service returned an unreadable response.");

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: NO_STORE_HEADERS,
  });
}
