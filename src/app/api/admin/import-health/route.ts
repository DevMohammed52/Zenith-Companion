import { NextResponse } from "next/server";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

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
