import { NextResponse } from "next/server";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Admin dashboard is not configured." } },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }

  const result = await fetchProfileImportJson("/admin/import-health", {
    method: "GET",
    headers: {
      authorization: `Bearer ${adminSecret}`,
    },
  }, "Cloudflare returned an unreadable response.");

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}
