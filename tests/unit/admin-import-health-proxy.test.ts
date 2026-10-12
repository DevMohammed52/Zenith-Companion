import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/admin/import-health/route";

describe("/api/admin/import-health route proxy", () => {
  const originalFetch = globalThis.fetch;
  const originalSecret = process.env.ADMIN_DASHBOARD_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_DASHBOARD_SECRET = "test-admin-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalSecret !== undefined) {
      process.env.ADMIN_DASHBOARD_SECRET = originalSecret;
    } else {
      delete process.env.ADMIN_DASHBOARD_SECRET;
    }
  });

  it("returns 404 when ADMIN_DASHBOARD_SECRET is not configured", async () => {
    delete process.env.ADMIN_DASHBOARD_SECRET;
    const request = new NextRequest("http://localhost:3000/api/admin/import-health");
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.error?.code).toBe("not_configured");
  });

  it("strips client cache-control no-store / no-cache headers when forwarding to worker", async () => {
    let capturedHeaders: HeadersInit | undefined;
    let capturedCache: RequestCache | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      capturedCache = init?.cache;
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true, generatedAt: new Date().toISOString() }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-admin-cache": "HIT",
          },
        }),
      );
    });

    const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
      headers: {
        "cache-control": "no-store, no-cache, max-age=0",
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    // Request sent to worker must NOT contain no-store / no-cache
    expect((capturedHeaders as Record<string, string>)?.["cache-control"]).toBeUndefined();
    expect((capturedHeaders as Record<string, string>)?.["authorization"]).toBe("Bearer test-admin-secret");
    // Cache option sent to fetch must be "default" so node/undici fetch does not force no-cache upstream
    expect(capturedCache).toBe("default");
    // Response to client has no-store and x-admin-cache
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-admin-cache")).toBe("HIT");
  });

  it("forwards cache-control: no-cache when fresh=true search param is present", async () => {
    let capturedHeaders: HeadersInit | undefined;
    let capturedCache: RequestCache | undefined;
    let capturedUrl: string | undefined;
    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init?.headers;
      capturedCache = init?.cache;
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true, generatedAt: new Date().toISOString() }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-admin-cache": "BYPASS",
          },
        }),
      );
    });

    const request = new NextRequest("http://localhost:3000/api/admin/import-health?fresh=true");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(capturedUrl).toContain("fresh=true");
    expect((capturedHeaders as Record<string, string>)?.["cache-control"]).toBe("no-cache");
    expect((capturedHeaders as Record<string, string>)?.["authorization"]).toBe("Bearer test-admin-secret");
    expect(capturedCache).toBe("no-store");
    expect(response.headers.get("x-admin-cache")).toBe("BYPASS");
  });
});
