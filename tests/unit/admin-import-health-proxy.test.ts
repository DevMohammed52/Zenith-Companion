import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/admin/import-health/route";
import { sameSecret } from "@/lib/admin-auth";

const VALID_AUTH = "Basic " + Buffer.from("zenith:test-admin-secret").toString("base64");

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

  it("compares secrets cleanly via constant-time digest without length-mismatch crashes", async () => {
    expect(await sameSecret("test-admin-secret", "test-admin-secret")).toBe(true);
    expect(await sameSecret("short", "test-admin-secret")).toBe(false);
    expect(await sameSecret("test-admin-secrex", "test-admin-secret")).toBe(false);
    expect(await sameSecret("", "test-admin-secret")).toBe(false);
  });

  it("returns 404 when ADMIN_DASHBOARD_SECRET is not configured", async () => {
    delete process.env.ADMIN_DASHBOARD_SECRET;
    const request = new NextRequest("http://localhost:3000/api/admin/import-health");
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const body = await response.json();
    expect(body.error?.code).toBe("not_configured");
  });

  it("returns 401 when Basic Auth is missing or invalid on GET (defense-in-depth)", async () => {
    const reqNoAuth = new NextRequest("http://localhost:3000/api/admin/import-health");
    const resNoAuth = await GET(reqNoAuth);
    expect(resNoAuth.status).toBe(401);
    expect(resNoAuth.headers.get("www-authenticate")).toContain("Basic realm=");
    expect(resNoAuth.headers.get("cache-control")).toBe("no-store");
    expect(resNoAuth.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const badAuth = "Basic " + Buffer.from("zenith:wrong").toString("base64");
    const reqBadAuth = new NextRequest("http://localhost:3000/api/admin/import-health", {
      headers: { authorization: badAuth },
    });
    const resBadAuth = await GET(reqBadAuth);
    expect(resBadAuth.status).toBe(401);
  });

  it("strips client cache-control no-store / no-cache headers when forwarding authenticated GET to worker", async () => {
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
        authorization: VALID_AUTH,
        "cache-control": "no-store, no-cache, max-age=0",
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect((capturedHeaders as Record<string, string>)?.["cache-control"]).toBeUndefined();
    expect((capturedHeaders as Record<string, string>)?.["authorization"]).toBe("Bearer test-admin-secret");
    expect(capturedCache).toBe("default");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
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

    const request = new NextRequest("http://localhost:3000/api/admin/import-health?fresh=true", {
      headers: { authorization: VALID_AUTH },
    });
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
      const reqNoAuth = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        body: JSON.stringify({ action: "process_queue" }),
      });
      const resNoAuth = await POST(reqNoAuth);
      expect(resNoAuth.status).toBe(401);
      expect(resNoAuth.headers.get("www-authenticate")).toContain("Basic realm=");
      const bodyNoAuth = await resNoAuth.json();
      expect(bodyNoAuth.error?.code).toBe("unauthorized");

      const badAuth = "Basic " + Buffer.from("zenith:wrong-password").toString("base64");
      const reqBadAuth = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: { authorization: badAuth },
        body: JSON.stringify({ action: "process_queue" }),
      });
      expect((await POST(reqBadAuth)).status).toBe(401);

      const badUser = "Basic " + Buffer.from("admin:test-admin-secret").toString("base64");
      const reqBadUser = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: { authorization: badUser },
        body: JSON.stringify({ action: "process_queue" }),
      });
      expect((await POST(reqBadUser)).status).toBe(401);
    });

    it("blocks cross-origin and cross-site POST mutations with 403", async () => {
      const reqCrossOrigin = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: VALID_AUTH,
          origin: "https://evil.example",
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "process_queue" }),
      });
      const resCrossOrigin = await POST(reqCrossOrigin);
      expect(resCrossOrigin.status).toBe(403);
      expect((await resCrossOrigin.json()).error?.code).toBe("forbidden");

      const reqCrossSite = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: VALID_AUTH,
          "sec-fetch-site": "cross-site",
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "process_queue" }),
      });
      expect((await POST(reqCrossSite)).status).toBe(403);
    });

    it("rejects unknown or malformed admin actions before contacting Cloudflare", async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const reqUnknown = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: { authorization: VALID_AUTH, "content-type": "application/json" },
        body: JSON.stringify({ action: "drop_all_tables" }),
      });
      const resUnknown = await POST(reqUnknown);
      expect(resUnknown.status).toBe(400);
      expect((await resUnknown.json()).error?.code).toBe("invalid_action");
      expect(fetchSpy).not.toHaveBeenCalled();

      const reqBadJob = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: { authorization: VALID_AUTH, "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel_job", jobId: "../../etc/passwd" }),
      });
      const resBadJob = await POST(reqBadJob);
      expect(resBadJob.status).toBe(400);
      expect((await resBadJob.json()).error?.code).toBe("invalid_job_id");
      expect(fetchSpy).not.toHaveBeenCalled();
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

      const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: VALID_AUTH,
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "process_queue", extraUntrusted: "ignored" }),
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
      const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: VALID_AUTH,
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

      const request = new NextRequest("http://localhost:3000/api/admin/import-health", {
        method: "POST",
        headers: {
          authorization: VALID_AUTH,
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
