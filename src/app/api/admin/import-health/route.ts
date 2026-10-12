import { NextResponse, type NextRequest } from "next/server";
import { executeProfileImportAdminAction, fetchProfileImportJson } from "@/lib/profile-import-proxy";
import { ADMIN_REALM, verifyAdminBasicAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Admin dashboard is not configured." } },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
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

  const responseHeaders: Record<string, string> = {
    "cache-control": "no-store",
  };
  const adminCache = result.headers?.get("x-admin-cache");
  if (adminCache) {
    responseHeaders["x-admin-cache"] = adminCache;
  }

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: responseHeaders,
  });
}

export async function POST(request: NextRequest | Request) {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Admin dashboard is not configured." } },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!verifyAdminBasicAuth(authHeader, adminSecret)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Authentication required" } },
      {
        status: 401,
        headers: {
          "cache-control": "no-store",
          "www-authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Request body must be valid JSON." } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const result = await executeProfileImportAdminAction(body, adminSecret);

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
