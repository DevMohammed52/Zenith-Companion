import { NextResponse } from "next/server";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

const USAGE_BODY_LIMIT = 2048;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > USAGE_BODY_LIMIT) {
    return NextResponse.json({ error: { code: "request_too_large", message: "Usage ping is too large." } }, { status: 413 });
  }

  const body = await request.text().catch(() => "");
  if (!body || body.length > USAGE_BODY_LIMIT) {
    return NextResponse.json({ error: { code: "bad_request", message: "Invalid usage ping." } }, { status: 400 });
  }

  const origin = request.headers.get("origin");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");

  const result = await fetchProfileImportJson("/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      ...(userAgent ? { "user-agent": userAgent } : {}),
      ...(country ? { "cf-ipcountry": country } : {}),
    },
    body,
  }, "Usage service returned an unreadable response.");

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}
