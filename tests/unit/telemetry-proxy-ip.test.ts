import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as pingRoute } from "@/app/api/usage/ping/route";
import { POST as vitalsRoute } from "@/app/api/usage/vitals/route";
import { POST as errorRoute } from "@/app/api/error/report/route";
import { readProfileImportStartBody, extractForwardedClientIp } from "@/lib/profile-import-proxy";

describe("Telemetry & Proxy Client IP Resolution", () => {
  const originalFetch = globalThis.fetch;
  const originalPingSecret = process.env.USAGE_PING_SECRET;
  const originalErrorSecret = process.env.ERROR_REPORT_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.USAGE_PING_SECRET = "test-usage-secret";
    process.env.ERROR_REPORT_SECRET = "test-error-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalPingSecret !== undefined) process.env.USAGE_PING_SECRET = originalPingSecret;
    else delete process.env.USAGE_PING_SECRET;
    if (originalErrorSecret !== undefined) process.env.ERROR_REPORT_SECRET = originalErrorSecret;
    else delete process.env.ERROR_REPORT_SECRET;
  });

  it("extractForwardedClientIp extracts x-forwarded-for or x-real-ip", () => {
    const req1 = new Request("http://localhost:3000/", {
      headers: { "x-forwarded-for": "198.51.100.1" },
    });
    expect(extractForwardedClientIp(req1)).toBe("198.51.100.1");

    const req2 = new Request("http://localhost:3000/", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(extractForwardedClientIp(req2)).toBe("198.51.100.2");

    const req3 = new Request("http://localhost:3000/", {
      headers: {
        "x-forwarded-for": "198.51.100.3",
        "x-real-ip": "198.51.100.4",
      },
    });
    expect(extractForwardedClientIp(req3)).toBe("198.51.100.3");

    const req4 = new Request("http://localhost:3000/");
    expect(extractForwardedClientIp(req4)).toBe("");

    const req5 = new Request("http://localhost:3000/", {
      headers: { "cf-connecting-ip": "198.51.100.9" },
    });
    expect(extractForwardedClientIp(req5)).toBe("198.51.100.9");
  });

  it("readProfileImportStartBody forwards x-forwarded-for from client request", async () => {
    const req = new Request("http://localhost:3000/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.5",
        origin: "https://zenith.example",
      },
      body: JSON.stringify({ characterHash: "FixtureHash0000000001" }),
    });
    const parsed = await readProfileImportStartBody(req);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect((parsed.originHeaders as Record<string, string>)?.["x-forwarded-for"]).toBe("198.51.100.5");
      expect((parsed.originHeaders as Record<string, string>)?.origin).toBe("https://zenith.example");
    }
  });

  it("usage/ping reliably forwards client IP from x-forwarded-for or x-real-ip", async () => {
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 }));
    });

    const req = new NextRequest("http://localhost:3000/api/usage/ping", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "203.0.113.77",
      },
      body: JSON.stringify({
        visitorId: "v1",
        sessionId: "s1",
        eventType: "pageview",
        path: "/items",
      }),
    });
    const res = await pingRoute(req);
    expect(res.status).toBe(202);
    expect((capturedHeaders as Record<string, string>)?.["x-forwarded-for"]).toBe("203.0.113.77");
  });

  it("usage/vitals reliably forwards client IP from x-forwarded-for", async () => {
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 }));
    });

    const req = new NextRequest("http://localhost:3000/api/usage/vitals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.88",
      },
      body: JSON.stringify({
        name: "LCP",
        value: 1200,
        rating: "good",
        path: "/alchemy",
      }),
    });
    const res = await vitalsRoute(req);
    expect(res.status).toBe(202);
    expect((capturedHeaders as Record<string, string>)?.["x-forwarded-for"]).toBe("203.0.113.88");
  });

  it("error/report reliably forwards client IP from x-real-ip", async () => {
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 }));
    });

    const req = new NextRequest("http://localhost:3000/api/error/report", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "203.0.113.99",
      },
      body: JSON.stringify({
        source: "client",
        eventType: "route_error",
        path: "/combat",
        digest: "DIGEST_1",
      }),
    });
    const res = await errorRoute(req);
    expect(res.status).toBe(202);
    expect((capturedHeaders as Record<string, string>)?.["x-forwarded-for"]).toBe("203.0.113.99");
  });

  it("profile-import/status reliably forwards client IP from x-real-ip", async () => {
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(new Response(JSON.stringify({ id: "imp_0123456789012345678901", status: "queued" }), { status: 200 }));
    });

    const { GET: statusRoute } = await import("@/app/api/profile-import/status/[jobId]/route");
    const req = new NextRequest("http://localhost:3000/api/profile-import/status/imp_0123456789012345678901", {
      headers: {
        "x-real-ip": "203.0.113.123",
      },
    });
    const res = await statusRoute(req, { params: Promise.resolve({ jobId: "imp_0123456789012345678901" }) });
    expect(res.status).toBe(200);
    expect((capturedHeaders as Record<string, string>)?.["x-forwarded-for"]).toBe("203.0.113.123");
  });
});
