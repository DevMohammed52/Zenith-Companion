import { NextResponse, type NextRequest } from "next/server";
import {
  executeProfileImportAdminAction,
  fetchProfileImportJson,
  parseAdminActionPayload,
} from "@/lib/profile-import-proxy";
import { ADMIN_REALM, verifyAdminBasicAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ADMIN_POST_BODY_LIMIT = 4 * 1024;

function privateHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    ...extra,
  };
}

function unauthorizedResponse() {
  return NextResponse.json(
    { error: { code: "unauthorized", message: "Authentication required" } },
    {
      status: 401,
      headers: privateHeaders({
        "www-authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
      }),
    },
  );
}

function isSameOriginMutation(request: Request): boolean {
  const secFetchSite = (request.headers.get("sec-fetch-site") || "").trim().toLowerCase();
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return false;
  }

  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return true;
  }

  try {
    const requestOrigin = new URL(request.url).origin;
    const headerOrigin = new URL(originHeader).origin;
    return requestOrigin === headerOrigin;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Admin dashboard is not configured." } },
      { status: 404, headers: privateHeaders() },
    );
  }

  const authorized = await verifyAdminBasicAuth(request.headers.get("authorization"), adminSecret);
  if (!authorized) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const search = url.search;
  const isFresh = url.searchParams.get("fresh") === "true";
  const headers: Record<string, string> = {
    authorization: `Bearer ${adminSecret}`,
  };

  if (isFresh) {
    headers["cache-control"] = "no-cache";
  } else {
    const rawCacheControl = (request.headers.get("cache-control") || "").toLowerCase();
    if (rawCacheControl) {
      const filtered = rawCacheControl
        .split(",")
        .map((part) => part.trim())
        .filter((part) => (
          !part.includes("no-store") &&
          !part.includes("no-cache") &&
          !part.includes("max-age=0")
        ))
        .join(", ");
      if (filtered) {
        headers["cache-control"] = filtered;
      }
    }
  }

  const result = await fetchProfileImportJson(`/admin/import-health${search}`, {
    method: "GET",
    headers,
    cache: isFresh ? "no-store" : "default",
  }, "Cloudflare returned an unreadable response.");

  const extraHeaders: Record<string, string> = {};
  const adminCache = result.headers?.get("x-admin-cache");
  if (adminCache) {
    extraHeaders["x-admin-cache"] = adminCache;
  }

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: privateHeaders(extraHeaders),
  });
}

export async function POST(request: NextRequest | Request) {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Admin dashboard is not configured." } },
      { status: 404, headers: privateHeaders() },
    );
  }

  const authorized = await verifyAdminBasicAuth(request.headers.get("authorization"), adminSecret);
  if (!authorized) {
    return unauthorizedResponse();
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Cross-origin admin mutations are not allowed." } },
      { status: 403, headers: privateHeaders() },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > ADMIN_POST_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "request_too_large", message: "Admin action payload exceeds limit." } },
      { status: 413, headers: privateHeaders() },
    );
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Request body could not be read." } },
      { status: 400, headers: privateHeaders() },
    );
  }

  if (bodyText.length > ADMIN_POST_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "request_too_large", message: "Admin action payload exceeds limit." } },
      { status: 413, headers: privateHeaders() },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Request body must be valid JSON." } },
      { status: 400, headers: privateHeaders() },
    );
  }

  const validated = parseAdminActionPayload(body);
  if (!validated.ok) {
    return NextResponse.json(validated.payload, {
      status: validated.status,
      headers: privateHeaders(),
    });
  }

  const result = await executeProfileImportAdminAction(validated.payload, adminSecret);

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: privateHeaders(),
  });
}
