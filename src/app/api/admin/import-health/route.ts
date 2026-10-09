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
  const headers: Record<string, string> = {
    authorization: `Bearer ${adminSecret}`,
  };
  const cacheControl = request.headers.get("cache-control");
  if (cacheControl) {
    headers["cache-control"] = cacheControl;
  }

  const result = await fetchProfileImportJson(`/admin/import-health${search}`, {
    method: "GET",
    headers,
  }, "Cloudflare returned an unreadable response.");

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}
