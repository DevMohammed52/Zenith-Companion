import { NextResponse } from "next/server";
import { extractForwardedClientIp, fetchProfileImportJson } from "@/lib/profile-import-proxy";

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

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__zvid=([^;]*)/);
  const hasZvidCookie = Boolean(match && match[1]?.trim());

  let visitorId = "";
  try {
    const parsed = JSON.parse(body) as { visitorId?: unknown };
    if (typeof parsed?.visitorId === "string" && parsed.visitorId.trim()) {
      visitorId = parsed.visitorId.trim().slice(0, 128);
    }
  } catch {}

  const origin = request.headers.get("origin");
  const clientIp = extractForwardedClientIp(request);
  const userAgent = request.headers.get("user-agent");
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");

  const result = await fetchProfileImportJson("/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${usagePingSecret}`,
      ...(origin ? { origin } : {}),
      ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
      ...(userAgent ? { "user-agent": userAgent } : {}),
      ...(country ? { "cf-ipcountry": country } : {}),
    },
    body,
  }, "Usage service returned an unreadable response.");

  const responseHeaders: Record<string, string> = { ...NO_STORE_HEADERS };
  if (!hasZvidCookie && visitorId) {
    responseHeaders["set-cookie"] = `__zvid=${encodeURIComponent(visitorId)}; Path=/; SameSite=Lax; Max-Age=31536000`;
  }

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: responseHeaders,
  });
}
