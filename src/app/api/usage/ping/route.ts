import { NextResponse } from "next/server";
import {
  buildProxyForwardHeaders,
  fetchProfileImportJson,
  getOrCreateRequestId,
  isHttpsRequest,
  NO_STORE_HEADERS,
  readLimitedJsonBody,
} from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

const USAGE_BODY_LIMIT = 2048;

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeUsagePath(value: unknown): string {
  const text = cleanString(value, 160);
  if (!text.startsWith("/")) return "";
  return text.split(/[?#]/)[0].slice(0, 120) || "/";
}

function normalizeDeviceType(value: unknown): string {
  const text = cleanString(value, 24).toLowerCase();
  return ["mobile", "tablet", "desktop"].includes(text) ? text : "unknown";
}

export async function POST(request: Request) {
  const usagePingSecret = process.env.USAGE_PING_SECRET?.trim();
  if (!usagePingSecret) {
    return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
  }

  const parsed = await readLimitedJsonBody(request, {
    maxBytes: USAGE_BODY_LIMIT,
    emptyMessage: "Invalid usage ping.",
    tooLargeMessage: "Usage ping is too large.",
    invalidJsonCode: "bad_request",
    invalidJsonMessage: "Invalid usage ping.",
    invalidTypeCode: "bad_request",
    invalidTypeMessage: "Invalid usage ping.",
  });
  if (!parsed.ok) {
    return NextResponse.json(parsed.payload, {
      status: parsed.status,
      headers: NO_STORE_HEADERS,
    });
  }

  const raw = parsed.data;
  const visitorId = cleanString(raw.visitorId, 128);
  const sessionId = cleanString(raw.sessionId, 128);
  const path = normalizeUsagePath(raw.path);
  if (!sessionId || !path) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid usage ping." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const eventType = raw.eventType === "heartbeat" ? "heartbeat" : "pageview";
  const characterDigest = cleanString(raw.characterDigest, 128);
  const sanitizedPayload = {
    ...(visitorId ? { visitorId } : {}),
    sessionId,
    eventType,
    path,
    referrer: cleanString(raw.referrer, 260),
    deviceType: normalizeDeviceType(raw.deviceType),
    timezone: cleanString(raw.timezone, 64),
    ...(characterDigest ? { characterDigest } : {}),
  };

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__zvid=([^;]*)/);
  const hasZvidCookie = Boolean(match && match[1]?.trim());

  const requestId = getOrCreateRequestId(request);
  const result = await fetchProfileImportJson(
    "/usage/ping",
    {
      method: "POST",
      headers: buildProxyForwardHeaders(request, {
        authSecret: usagePingSecret,
        contentType: "application/json",
        requestId,
      }),
      body: JSON.stringify(sanitizedPayload),
    },
    "Usage service returned an unreadable response.",
  );

  const responseHeaders: Record<string, string> = {
    ...NO_STORE_HEADERS,
    "x-request-id": requestId,
  };
  if (!hasZvidCookie && visitorId) {
    const secureFlag = isHttpsRequest(request) ? "; Secure" : "";
    responseHeaders["set-cookie"] = `__zvid=${encodeURIComponent(visitorId)}; Path=/; SameSite=Lax; Max-Age=31536000${secureFlag}`;
  }

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: responseHeaders,
  });
}
