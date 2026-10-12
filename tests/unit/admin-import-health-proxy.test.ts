import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/admin/import-health/route";

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

  describe("POST /api/admin/import-health route proxy", () => {
    it("returns 404 when ADMIN_DASHBOARD_SECRET is not configured for POST", async () => {
      delete process.env.ADMIN_DASHBOARD_SECRET;
      const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        body: JSON.stringify({ action: "process_queue" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const body = await response.json();
      expect(body.error?.code).toBe("not_configured");
    });

    it("returns 401 when Basic Auth credentials are missing or invalid for POST", async () => {
      // 1. Missing auth header
      const reqNoAuth = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        body: JSON.stringify({ action: "process_queue" }),
      });
      const resNoAuth = await POST(reqNoAuth);
      expect(resNoAuth.status).toBe(401);
      expect(resNoAuth.headers.get("www-authenticate")).toContain("Basic realm=");
      const bodyNoAuth = await resNoAuth.json();
      expect(bodyNoAuth.error?.code).toBe("unauthorized");

      // 2. Wrong password
      const badAuth = "Basic " + Buffer.from("zenith:wrong-password").toString("base64");
      const reqBadAuth = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: { authorization: badAuth },
        body: JSON.stringify({ action: "process_queue" }),
      });
      const resBadAuth = await POST(reqBadAuth);
      expect(resBadAuth.status).toBe(401);

      // 3. Wrong username
      const badUser = "Basic " + Buffer.from("admin:test-admin-secret").toString("base64");
      const reqBadUser = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: { authorization: badUser },
        body: JSON.stringify({ action: "process_queue" }),
      });
      const resBadUser = await POST(reqBadUser);
      expect(resBadUser.status).toBe(401);
    });

    it("forwards valid Basic Auth request to worker POST /admin/actions and returns result", async () => {
      let capturedUrl: string | undefined;
      let capturedInit: RequestInit | undefined;
      globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        capturedUrl = url;
        capturedInit = init;
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true, message: "Queue processing triggered" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      });

      const validAuth = "Basic " + Buffer.from("zenith:test-admin-secret").toString("base64");
      const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: validAuth,
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "process_queue" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(capturedUrl).toContain("/admin/actions");
      expect(capturedInit?.method).toBe("POST");
      expect((capturedInit?.headers as Record<string, string>)?.["authorization"]).toBe("Bearer test-admin-secret");
      expect(JSON.parse(capturedInit?.body as string)).toEqual({ action: "process_queue" });
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.message).toBe("Queue processing triggered");
    });

    it("returns 400 when request body is invalid JSON", async () => {
      const validAuth = "Basic " + Buffer.from("zenith:test-admin-secret").toString("base64");
      const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: validAuth,
          "content-type": "application/json",
        },
        body: "invalid-json-body{",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error?.code).toBe("invalid_json");
    });

    it("properly forwards non-200 worker responses", async () => {
      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { code: "not_found", message: "Job imp_123 not found." } }), {
            status: 404,
            headers: { "content-type": "application/json" },
          }),
        );
      });

      const validAuth = "Basic " + Buffer.from("zenith:test-admin-secret").toString("base64");
      const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: validAuth,
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "cancel_job", jobId: "imp_123" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error?.code).toBe("not_found");
    });
  });
});

