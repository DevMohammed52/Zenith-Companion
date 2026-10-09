import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/profile-import/status/[jobId]/route";

describe("/api/profile-import/status/[jobId] route proxy", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns 400 with no-store when jobId is malformed", async () => {
    const request = new NextRequest("http://localhost:3000/api/profile-import/status/bad_job_id");
    const response = await GET(request, { params: Promise.resolve({ jobId: "bad_job_id" }) });

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.error?.code).toBe("invalid_job");
  });

  it("propagates public edge caching headers on terminal done response", async () => {
    const validJobId = "imp_12345678901234567890";
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jobId: validJobId,
          status: "done",
          result: { characters: [] },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
          },
        },
      ),
    );

    const request = new NextRequest(`http://localhost:3000/api/profile-import/status/${validJobId}`);
    const response = await GET(request, { params: Promise.resolve({ jobId: validJobId }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
    );
    const body = await response.json();
    expect(body.status).toBe("done");
  });

  it("preserves no-store cache-control for in-progress status responses", async () => {
    const validJobId = "imp_12345678901234567890";
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jobId: validJobId,
          status: "running",
          progress: { current: 5, total: 45 },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        },
      ),
    );

    const request = new NextRequest(`http://localhost:3000/api/profile-import/status/${validJobId}`);
    const response = await GET(request, { params: Promise.resolve({ jobId: validJobId }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.status).toBe("running");
  });

  it("propagates retry-after header and no-store on rate-limited (429) responses", async () => {
    const validJobId = "imp_12345678901234567890";
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "rate_limited", message: "Too many status requests. Please slow down." },
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "retry-after": "42",
          },
        },
      ),
    );

    const request = new NextRequest(`http://localhost:3000/api/profile-import/status/${validJobId}`);
    const response = await GET(request, { params: Promise.resolve({ jobId: validJobId }) });

    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("42");
    const body = await response.json();
    expect(body.error?.code).toBe("rate_limited");
  });

  it("forwards client IP and origin headers to worker", async () => {
    const validJobId = "imp_12345678901234567890";
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(
        new Response(JSON.stringify({ jobId: validJobId, status: "queued" }), {
          status: 200,
          headers: { "cache-control": "no-store" },
        }),
      );
    });

    const request = new NextRequest(`http://localhost:3000/api/profile-import/status/${validJobId}`, {
      headers: {
        "cf-connecting-ip": "203.0.113.50",
        "x-forwarded-for": "198.51.100.25",
        origin: "https://zenith.example",
      },
    });
    await GET(request, { params: Promise.resolve({ jobId: validJobId }) });

    expect(capturedHeaders).toMatchObject({
      "cf-connecting-ip": "203.0.113.50",
      "x-forwarded-for": "198.51.100.25",
      origin: "https://zenith.example",
    });
  });

  it("propagates 404 status and short public edge caching when job is not found", async () => {
    const validJobId = "imp_12345678901234567890";
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "not_found", message: "Import job was not found." },
        }),
        {
          status: 404,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=5, s-maxage=10",
          },
        },
      ),
    );

    const request = new NextRequest(`http://localhost:3000/api/profile-import/status/${validJobId}`);
    const response = await GET(request, { params: Promise.resolve({ jobId: validJobId }) });

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("public, max-age=5, s-maxage=10");
    const body = await response.json();
    expect(body.error?.code).toBe("not_found");
  });

  it("propagates 410 expired status with terminal edge caching header", async () => {
    const validJobId = "imp_12345678901234567890";
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jobId: validJobId,
          status: "expired",
          error: { code: "expired", message: "This import expired. Start a new import if needed." },
        }),
        {
          status: 410,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
          },
        },
      ),
    );

    const request = new NextRequest(`http://localhost:3000/api/profile-import/status/${validJobId}`);
    const response = await GET(request, { params: Promise.resolve({ jobId: validJobId }) });

    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
    );
    const body = await response.json();
    expect(body.status).toBe("expired");
  });

  it("returns 502 with fallback no-store when upstream worker fails to connect", async () => {
    const validJobId = "imp_12345678901234567890";
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Worker connection failure"));

    const request = new NextRequest(`http://localhost:3000/api/profile-import/status/${validJobId}`);
    const response = await GET(request, { params: Promise.resolve({ jobId: validJobId }) });

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.error?.code).toBe("bad_gateway");
  });
});
