import { NextResponse } from "next/server";

const PROFILE_IMPORT_API_URL = (process.env.PROFILE_IMPORT_API_URL || process.env.NEXT_PUBLIC_PROFILE_IMPORT_API_URL || "https://zenith-profile-import.devmohammed52.workers.dev").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function GET() {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Admin dashboard is not configured." } },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }

  const response = await fetch(`${PROFILE_IMPORT_API_URL}/admin/import-health`, {
    cache: "no-store",
    headers: {
      authorization: `Bearer ${adminSecret}`,
    },
  });
  const body = await response.json().catch(() => ({
    error: { code: "bad_gateway", message: "Cloudflare returned an unreadable response." },
  }));

  return NextResponse.json(body, {
    status: response.status,
    headers: { "cache-control": "no-store" },
  });
}
