import { NextResponse } from "next/server";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

const USAGE_BODY_LIMIT = 2048;
const NO_STORE_HEADERS = { "cache-control": "no-store" };

export async function POST(request: Request) {
  const usagePingSecret = process.env.USAGE_PING_SECRET?.trim();
  if (!usagePingSecret) {
    return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > USAGE_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "request_too_large", message: "Usage ping is too large." } },
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  const body = await request.text().catch(() => "");
  if (!body || body.length > USAGE_BODY_LIMIT) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid usage ping." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const origin = request.headers.get("origin");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");

  const result = await fetchProfileImportJson("/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${usagePingSecret}`,
      ...(origin ? { origin } : {}),
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      ...(userAgent ? { "user-agent": userAgent } : {}),
      ...(country ? { "cf-ipcountry": country } : {}),
    },
    body,
  }, "Usage service returned an unreadable response.");

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: NO_STORE_HEADERS,
  });
}
