import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as healthRoute } from "@/app/api/health/route";
import { POST as pingRoute } from "@/app/api/usage/ping/route";
import { GET as itemRoute } from "@/app/api/items/[id]/route";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

describe("API gateway contracts, limits, and caching", () => {
  const originalFetch = globalThis.fetch;
  const originalPingSecret = process.env.USAGE_PING_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.USAGE_PING_SECRET = "test-usage-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalPingSecret !== undefined) process.env.USAGE_PING_SECRET = originalPingSecret;
    else delete process.env.USAGE_PING_SECRET;
  });

  it("GET /api/health returns 200 readiness with private cache headers", async () => {
    const res = await healthRoute();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("zenith-companion");
  });

  it("POST /api/usage/ping rejects malformed payloads at the Next.js edge before hitting Cloudflare", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;

    const reqMissingPath = new NextRequest("https://zenith.example/api/usage/ping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: "vis_1", sessionId: "ses_1", path: "not-a-path" }),
    });
    const res = await pingRoute(reqMissingPath);
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();

    // Multi-byte UTF-8 string under 2048 characters but exceeding 2048 UTF-8 bytes
    const multibyteString = "\u{1F600}".repeat(600);
    const reqOversizedUtf8 = new NextRequest("https://zenith.example/api/usage/ping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: "vis_1", sessionId: "ses_1", path: "/items", timezone: multibyteString }),
    });
    const resOversized = await pingRoute(reqOversizedUtf8);
    expect(resOversized.status).toBe(413);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POST /api/usage/ping sets Secure __zvid cookie on HTTPS requests and propagates x-request-id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 202 }));

    const req = new NextRequest("https://zenith.example/api/usage/ping", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-proto": "https",
        "x-request-id": "req_trace_12345678",
      },
      body: JSON.stringify({ visitorId: "vis_secure_1", sessionId: "ses_1", eventType: "pageview", path: "/items" }),
    });

    const res = await pingRoute(req);
    expect(res.status).toBe(202);
    expect(res.headers.get("x-request-id")).toBe("req_trace_12345678");
    const cookie = res.headers.get("set-cookie") || "";
    expect(cookie).toContain("__zvid=vis_secure_1");
    expect(cookie).toContain("Secure");
    expect(cookie).not.toContain("HttpOnly");
  });

  it("fetchProfileImportJson maps TimeoutError to 504 gateway_timeout", async () => {
    const timeoutErr = new DOMException("Timed out", "TimeoutError");
    globalThis.fetch = vi.fn().mockRejectedValue(timeoutErr);

    const res = await fetchProfileImportJson("/health", { method: "GET" }, "Unreadable");
    expect(res.status).toBe(504);
    expect((res.payload as { error?: { code?: string } })?.error?.code).toBe("gateway_timeout");
  });

  it("GET /api/items/[id] returns ETag + 304 Not Modified and structured error envelopes", async () => {
    const badReq = new Request("http://localhost:3000/api/items/bad!id");
    const badRes = await itemRoute(badReq, { params: Promise.resolve({ id: "bad!id" }) });
    expect(badRes.status).toBe(400);
    const badBody = await badRes.json();
    expect(badBody.error?.code).toBe("invalid_item_id");

    const okReq = new Request("http://localhost:3000/api/items/Rv5g4z1dQnqlLqy32jpG");
    const okRes = await itemRoute(okReq, { params: Promise.resolve({ id: "Rv5g4z1dQnqlLqy32jpG" }) });
    expect(okRes.status).toBe(200);
    const etag = okRes.headers.get("etag");
    expect(etag).toBeTruthy();

    const notModifiedReq = new Request("http://localhost:3000/api/items/Rv5g4z1dQnqlLqy32jpG", {
      headers: { "if-none-match": etag! },
    });
    const notModifiedRes = await itemRoute(notModifiedReq, { params: Promise.resolve({ id: "Rv5g4z1dQnqlLqy32jpG" }) });
    expect(notModifiedRes.status).toBe(304);
  });
});
