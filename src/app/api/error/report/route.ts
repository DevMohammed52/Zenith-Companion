import { NextResponse } from "next/server";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

const ERROR_BODY_LIMIT = 1024;
const NO_STORE_HEADERS = { "cache-control": "no-store" };

type ErrorReportInput = {
  source?: unknown;
  eventType?: unknown;
  path?: unknown;
  digest?: unknown;
  appVersion?: unknown;
  browserClass?: unknown;
};

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isRecord(value: unknown): value is ErrorReportInput {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePath(value: unknown) {
  const text = cleanString(value, 160);
  if (!text.startsWith("/")) return "";
  return text.split(/[?#]/)[0].slice(0, 120) || "/";
}

function normalizeSource(value: unknown) {
  return cleanString(value, 24).toLowerCase() === "server" ? "server" : "client";
}

function normalizeEventType(value: unknown) {
  const text = cleanString(value, 32).toLowerCase();
  return text === "app_shell_error" ? "app_shell_error" : "route_error";
}

function normalizeDigest(value: unknown) {
  return cleanString(value, 128).replace(/[^A-Za-z0-9_./:-]/g, "");
}

function normalizeBrowserClass(value: unknown) {
  const text = cleanString(value, 24).toLowerCase();
  return ["chrome", "edge", "firefox", "safari", "bot", "other", "unknown"].includes(text) ? text : "unknown";
}

function appVersion() {
  return (
    cleanString(process.env.VERCEL_GIT_COMMIT_SHA, 12)
    || cleanString(process.env.NEXT_PUBLIC_APP_VERSION, 64)
    || cleanString(process.env.npm_package_version, 64)
    || "unknown"
  );
}

function errorReportSecret() {
  return process.env.ERROR_REPORT_SECRET?.trim() || process.env.USAGE_PING_SECRET?.trim() || "";
}

export async function POST(request: Request) {
  const secret = errorReportSecret();
  if (!secret) {
    return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > ERROR_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "request_too_large", message: "Error report is too large." } },
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  const text = await request.text().catch(() => "");
  if (!text || text.length > ERROR_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid error report." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  let parsed: ErrorReportInput;
  try {
    const raw = JSON.parse(text) as unknown;
    parsed = isRecord(raw) ? raw : {};
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid error report." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  const path = normalizePath(parsed.path);
  if (!path) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid error report." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const body = JSON.stringify({
    source: normalizeSource(parsed.source),
    eventType: normalizeEventType(parsed.eventType),
    path,
    digest: normalizeDigest(parsed.digest),
    appVersion: appVersion(),
    browserClass: normalizeBrowserClass(parsed.browserClass),
  });

  const origin = request.headers.get("origin");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");

  const result = await fetchProfileImportJson("/error/report", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
      ...(origin ? { origin } : {}),
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      ...(userAgent ? { "user-agent": userAgent } : {}),
      ...(country ? { "cf-ipcountry": country } : {}),
    },
    body,
  }, "Error reporting service returned an unreadable response.");

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: NO_STORE_HEADERS,
  });
}
