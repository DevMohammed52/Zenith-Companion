import { NextResponse } from "next/server";

const PROFILE_IMPORT_API_URL = (process.env.PROFILE_IMPORT_API_URL || process.env.NEXT_PUBLIC_PROFILE_IMPORT_API_URL || "https://zenith-profile-import.devmohammed52.workers.dev").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();

  const response = await fetch(`${PROFILE_IMPORT_API_URL}/profile-import/start`, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body,
  });
  const payload = await response.json().catch(() => ({
    error: { code: "bad_gateway", message: "Profile import service returned an unreadable response." },
  }));

  return NextResponse.json(payload, {
    status: response.status,
    headers: { "cache-control": "no-store" },
  });
}
