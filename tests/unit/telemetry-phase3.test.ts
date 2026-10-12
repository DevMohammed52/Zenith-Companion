import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as pingRoute } from "@/app/api/usage/ping/route";
import { POST as vitalsRoute } from "@/app/api/usage/vitals/route";
import { getRootPlayerDigest, CharacterProfile, createDefaultProfile } from "@/lib/profiles";
import { normalizeIdleMmoProfileImport, sha256Hex } from "@/lib/profile-import";
import { _usageTrackerTesting } from "@/components/UsageTracker";
import { _webVitalsTesting } from "@/components/WebVitalsReporter";

describe("Phase 3 Telemetry Architecture Tests", () => {
  const originalFetch = globalThis.fetch;
  const originalPingSecret = process.env.USAGE_PING_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.USAGE_PING_SECRET = "test-usage-secret";
    _usageTrackerTesting.resetTestingState();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalPingSecret !== undefined) process.env.USAGE_PING_SECRET = originalPingSecret;
    else delete process.env.USAGE_PING_SECRET;
  });

  describe("A. Cookie Resilience & Storage Fallbacks", () => {
    it("attaches Set-Cookie __zvid when __zvid is not present in incoming Cookie header", async () => {
      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 })),
      );

      const req = new NextRequest("http://localhost:3000/api/usage/ping", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "other_cookie=123",
        },
        body: JSON.stringify({
          visitorId: "vis_abc123",
          sessionId: "ses_xyz789",
          eventType: "pageview",
          path: "/overview",
        }),
      });

      const res = await pingRoute(req);
      expect(res.status).toBe(202);
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("__zvid=vis_abc123");
      expect(setCookie).toContain("Path=/");
      expect(setCookie).toContain("Max-Age=31536000");
      expect(setCookie).toContain("SameSite=Lax");
    });

    it("attaches Set-Cookie when __zvid is present but empty (__zvid=)", async () => {
      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 })),
      );

      const req = new NextRequest("http://localhost:3000/api/usage/ping", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "theme=dark; __zvid=; other=1",
        },
        body: JSON.stringify({
          visitorId: "vis_new_recovered",
          sessionId: "ses_xyz789",
          eventType: "pageview",
          path: "/overview",
        }),
      });

      const res = await pingRoute(req);
      expect(res.status).toBe(202);
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("__zvid=vis_new_recovered");
    });

    it("omits Set-Cookie when __zvid is already present with valid value in incoming Cookie header", async () => {
      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 })),
      );

      const req = new NextRequest("http://localhost:3000/api/usage/ping", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "zenith_theme=dark; __zvid=vis_existing; other=1",
        },
        body: JSON.stringify({
          visitorId: "vis_existing",
          sessionId: "ses_xyz789",
          eventType: "pageview",
          path: "/overview",
        }),
      });

      const res = await pingRoute(req);
      expect(res.status).toBe(202);
      expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("omits Set-Cookie when visitorId is absent in body", async () => {
      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 })),
      );

      const req = new NextRequest("http://localhost:3000/api/usage/ping", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sessionId: "ses_xyz789",
          eventType: "pageview",
          path: "/overview",
        }),
      });

      const res = await pingRoute(req);
      expect(res.status).toBe(202);
      expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("parses cookies robustly with or without spaces and handles values containing =", () => {
      // Mock document.cookie
      let cookieStore = "theme=dark; __zvid=vis_abc%3D123; session=1";
      Object.defineProperty(globalThis, "document", {
        value: {
          get cookie() {
            return cookieStore;
          },
          set cookie(val: string) {
            cookieStore = val;
          },
        },
        configurable: true,
      });

      expect(_usageTrackerTesting.getCookie("__zvid")).toBe("vis_abc=123");
      expect(_usageTrackerTesting.getCookie("theme")).toBe("dark");

      // Without space after semicolon
      cookieStore = "foo=bar;__zvid=vis_compact;baz=qux";
      expect(_usageTrackerTesting.getCookie("__zvid")).toBe("vis_compact");

      // Empty or non-existent
      expect(_usageTrackerTesting.getCookie("nonexistent")).toBeNull();
    });

    it("UsageTracker safely falls back to in-memory store when localStorage throws SecurityError", () => {
      const mockStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new DOMException("The operation is insecure.", "SecurityError");
        }),
        setItem: vi.fn().mockImplementation(() => {
          throw new DOMException("The operation is insecure.", "SecurityError");
        }),
      };

      Object.defineProperty(globalThis, "window", {
        value: {
          localStorage: mockStorage,
          location: { hostname: "zenith.example" },
          matchMedia: () => ({ matches: false }),
          innerWidth: 1024,
        },
        configurable: true,
      });

      // Does not throw DOMException
      expect(() => _usageTrackerTesting.getVisitorId()).not.toThrow();
      const visId = _usageTrackerTesting.getVisitorId();
      expect(visId).toBeTruthy();
      expect(visId.startsWith("vis_")).toBe(true);

      // Value was remembered in inMemoryStore
      expect(_usageTrackerTesting.inMemoryStore.get(_usageTrackerTesting.VISITOR_KEY)).toBe(visId);
      expect(_usageTrackerTesting.getVisitorId()).toBe(visId);
    });

    it("UsageTracker restores visitorId from document.cookie when localStorage was purged by WebKit ITP", () => {
      let cookieVal = "__zvid=vis_itp_restored";
      const localStorageMap = new Map<string, string>();

      Object.defineProperty(globalThis, "document", {
        value: {
          get cookie() {
            return cookieVal;
          },
          set cookie(v: string) {
            cookieVal = v;
          },
        },
        configurable: true,
      });

      Object.defineProperty(globalThis, "window", {
        value: {
          localStorage: {
            getItem: (k: string) => localStorageMap.get(k) ?? null,
            setItem: (k: string, v: string) => localStorageMap.set(k, v),
          },
          location: { hostname: "zenith.example" },
          matchMedia: () => ({ matches: false }),
          innerWidth: 1024,
        },
        configurable: true,
      });

      const visId = _usageTrackerTesting.getVisitorId();
      expect(visId).toBe("vis_itp_restored");
      // Restored into localStorage and inMemoryStore
      expect(localStorageMap.get(_usageTrackerTesting.VISITOR_KEY)).toBe("vis_itp_restored");
      expect(_usageTrackerTesting.inMemoryStore.get(_usageTrackerTesting.VISITOR_KEY)).toBe("vis_itp_restored");
    });
  });

  describe("B. Shared 30-Minute Cross-Tab Rolling Session", () => {
    it("reuses session and updates lastActive if activity within 30 minutes", () => {
      const storageMap = new Map<string, string>();
      Object.defineProperty(globalThis, "window", {
        value: {
          localStorage: {
            getItem: (k: string) => storageMap.get(k) ?? null,
            setItem: (k: string, v: string) => storageMap.set(k, v),
          },
          location: { hostname: "zenith.example" },
        },
        configurable: true,
      });

      const t0 = 1000000;
      const s1 = _usageTrackerTesting.getActiveSessionId(t0);
      expect(s1.startsWith("ses_")).toBe(true);

      // Activity 10 minutes later (< 30 minutes)
      const t1 = t0 + 10 * 60 * 1000;
      const s2 = _usageTrackerTesting.getActiveSessionId(t1);
      expect(s2).toBe(s1);

      const parsed = _usageTrackerTesting.parseSession(storageMap.get(_usageTrackerTesting.SESSION_STORAGE_KEY)!);
      expect(parsed?.id).toBe(s1);
      expect(parsed?.lastActive).toBe(t1);
    });

    it("mints a new session if activity occurs after >= 30 minutes of inactivity", () => {
      const storageMap = new Map<string, string>();
      Object.defineProperty(globalThis, "window", {
        value: {
          localStorage: {
            getItem: (k: string) => storageMap.get(k) ?? null,
            setItem: (k: string, v: string) => storageMap.set(k, v),
          },
          location: { hostname: "zenith.example" },
        },
        configurable: true,
      });

      const t0 = 1000000;
      const s1 = _usageTrackerTesting.getActiveSessionId(t0);

      // Inactivity of 31 minutes
      const t2 = t0 + 31 * 60 * 1000;
      const s3 = _usageTrackerTesting.getActiveSessionId(t2);
      expect(s3).not.toBe(s1);
      expect(s3.startsWith("ses_")).toBe(true);

      const parsed = _usageTrackerTesting.parseSession(storageMap.get(_usageTrackerTesting.SESSION_STORAGE_KEY)!);
      expect(parsed?.id).toBe(s3);
      expect(parsed?.lastActive).toBe(t2);
    });

    it("falls back strictly to in-memory state when storage throws and never touches sessionStorage", () => {
      const mockStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new DOMException("The operation is insecure.", "SecurityError");
        }),
        setItem: vi.fn().mockImplementation(() => {
          throw new DOMException("The operation is insecure.", "SecurityError");
        }),
      };

      const mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
      };

      Object.defineProperty(globalThis, "window", {
        value: {
          localStorage: mockStorage,
          sessionStorage: mockSessionStorage,
          location: { hostname: "zenith.example" },
        },
        configurable: true,
      });

      const t0 = 1000000;
      const s1 = _usageTrackerTesting.getActiveSessionId(t0);
      expect(s1.startsWith("ses_")).toBe(true);
      expect(mockSessionStorage.getItem).not.toHaveBeenCalled();

      // Within 30 minutes in private browsing, preserves in-memory session
      const t1 = t0 + 5 * 60 * 1000;
      const s2 = _usageTrackerTesting.getActiveSessionId(t1);
      expect(s2).toBe(s1);
      expect(mockSessionStorage.getItem).not.toHaveBeenCalled();
    });

    it("parses valid sessions and rejects invalid or corrupted session payloads", () => {
      expect(_usageTrackerTesting.parseSession(null)).toBeNull();
      expect(_usageTrackerTesting.parseSession("")).toBeNull();
      expect(_usageTrackerTesting.parseSession("corrupt json")).toBeNull();
      expect(_usageTrackerTesting.parseSession(JSON.stringify({ id: "", lastActive: 100 }))).toBeNull();
      expect(_usageTrackerTesting.parseSession(JSON.stringify({ id: "ses_1", lastActive: "bad" }))).toBeNull();
      expect(_usageTrackerTesting.parseSession(JSON.stringify({ id: "ses_1", lastActive: NaN }))).toBeNull();
      expect(_usageTrackerTesting.parseSession(JSON.stringify({ id: "ses_1", lastActive: -50 }))).toBeNull();

      const valid = _usageTrackerTesting.parseSession(JSON.stringify({ id: "ses_valid", lastActive: 12345678 }));
      expect(valid).toEqual({ id: "ses_valid", lastActive: 12345678 });
    });
  });

  describe("C. Device Detection Resilience", () => {
    it("handles environment without window.matchMedia gracefully", () => {
      Object.defineProperty(globalThis, "window", {
        value: {
          innerWidth: 600,
          // matchMedia is undefined
        },
        configurable: true,
      });

      expect(() => _usageTrackerTesting.deviceType()).not.toThrow();
      expect(_usageTrackerTesting.deviceType()).toBe("desktop");
      expect(() => _webVitalsTesting.deviceType()).not.toThrow();
      expect(_webVitalsTesting.deviceType()).toBe("desktop");
    });
  });

  describe("D. Privacy-Preserving Character Digest Linkage", () => {
    it("getRootPlayerDigest prefers main profile with characterHashDigest", () => {
      const p1: CharacterProfile = {
        ...createDefaultProfile("Alt 1"),
        kind: "alt",
        importSource: {
          mode: "imported",
          characterHashTail: "alt111",
          characterHashDigest: "digest-alt-1",
          importedSections: [],
          missingOrPrivate: [],
          notes: "",
        },
      };

      const p2: CharacterProfile = {
        ...createDefaultProfile("Main Char"),
        kind: "main",
        importSource: {
          mode: "imported",
          characterHashTail: "main999",
          characterHashDigest: "digest-main-char",
          importedSections: [],
          missingOrPrivate: [],
          notes: "",
        },
      };

      expect(getRootPlayerDigest([p1, p2])).toBe("digest-main-char");
    });

    it("getRootPlayerDigest falls back to first profile with characterHashDigest when main has none", () => {
      const p1: CharacterProfile = {
        ...createDefaultProfile("Main Empty"),
        kind: "main",
        importSource: {
          mode: "manual",
          importedSections: [],
          missingOrPrivate: [],
          notes: "",
        },
      };

      const p2: CharacterProfile = {
        ...createDefaultProfile("Alt Imported"),
        kind: "alt",
        importSource: {
          mode: "imported",
          characterHashTail: "alt123",
          characterHashDigest: "digest-alt-fallback",
          importedSections: [],
          missingOrPrivate: [],
          notes: "",
        },
      };

      expect(getRootPlayerDigest([p1, p2])).toBe("digest-alt-fallback");
    });

    it("getRootPlayerDigest returns undefined when no profile has characterHashDigest", () => {
      const p1: CharacterProfile = {
        ...createDefaultProfile("Manual"),
        kind: "main",
      };

      expect(getRootPlayerDigest([p1])).toBeUndefined();
      expect(getRootPlayerDigest([])).toBeUndefined();
      expect(getRootPlayerDigest(null)).toBeUndefined();
    });

    it("normalizeIdleMmoProfileImport derives deterministic sha256 hex characterHashDigest", () => {
      const draft = normalizeIdleMmoProfileImport({
        hash: "PlayerHash12345",
        importedAt: "2026-05-14T08:00:00.000Z",
      });

      const expectedDigest = sha256Hex("PlayerHash12345");
      expect(draft.importSource?.characterHashTail).toBe("yerHash12345");
      expect(draft.importSource?.characterHashDigest).toBe(expectedDigest);
      expect(draft.importSource?.characterHashDigest).toHaveLength(64);
    });
  });

  describe("E. Web Vitals Batching in /api/usage/vitals", () => {
    it("cleanly accepts a batch array of web vitals and forwards normalized array", async () => {
      let forwardedBody: string | undefined;
      globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        forwardedBody = init?.body as string;
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 }));
      });

      const batch = [
        { metricName: "cls", value: 0.0456, rating: "good", path: "/overview" },
        { metricName: "fcp", value: 1250.8, rating: "good", path: "/overview" },
        { metricName: "inp", value: 42, rating: "good", path: "/overview" },
      ];

      const req = new NextRequest("http://localhost:3000/api/usage/vitals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(batch),
      });

      const res = await vitalsRoute(req);
      expect(res.status).toBe(202);
      expect(forwardedBody).toBeTruthy();

      const parsed = JSON.parse(forwardedBody!) as Array<{ metricName: string; value: number }>;
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].metricName).toBe("CLS");
      expect(parsed[0].value).toBe(0.046);
      expect(parsed[1].metricName).toBe("FCP");
      expect(parsed[2].metricName).toBe("INP");
    });

    it("filters out invalid items in a batch while preserving and forwarding valid items", async () => {
      let forwardedBody: string | undefined;
      globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        forwardedBody = init?.body as string;
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 }));
      });

      const batch = [
        { metricName: "lcp", value: 1500, rating: "good", path: "/overview" },
        { metricName: "INVALID", value: -1, path: "bad" },
        { metricName: "ttfb", value: 80, rating: "good", path: "/overview" },
      ];

      const req = new NextRequest("http://localhost:3000/api/usage/vitals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(batch),
      });

      const res = await vitalsRoute(req);
      expect(res.status).toBe(202);
      expect(forwardedBody).toBeTruthy();

      const parsed = JSON.parse(forwardedBody!) as Array<{ metricName: string; value: number }>;
      expect(parsed).toHaveLength(2);
      expect(parsed[0].metricName).toBe("LCP");
      expect(parsed[1].metricName).toBe("TTFB");
    });

    it("preserves backward compatibility with single web vital object", async () => {
      let forwardedBody: string | undefined;
      globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        forwardedBody = init?.body as string;
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 202 }));
      });

      const single = {
        metricName: "lcp",
        value: 2100.5,
        rating: "good",
        path: "/combat",
      };

      const req = new NextRequest("http://localhost:3000/api/usage/vitals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(single),
      });

      const res = await vitalsRoute(req);
      expect(res.status).toBe(202);
      expect(forwardedBody).toBeTruthy();

      const parsed = JSON.parse(forwardedBody!) as { metricName: string; value: number };
      expect(Array.isArray(parsed)).toBe(false);
      expect(parsed.metricName).toBe("LCP");
      expect(parsed.value).toBe(2100.5);
    });

    it("rejects batch with 400 bad_request when all items are invalid", async () => {
      const invalidBatch = [
        { metricName: "INVALID", value: -10, path: "no-slash" },
      ];

      const req = new NextRequest("http://localhost:3000/api/usage/vitals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(invalidBatch),
      });

      const res = await vitalsRoute(req);
      expect(res.status).toBe(400);
    });

    it("rejects batch exceeding 50 items with 400 bad_request", async () => {
      const oversizedBatch = Array.from({ length: 51 }, () => ({
        metricName: "CLS",
        value: 0.01,
        path: "/overview",
      }));

      const req = new NextRequest("http://localhost:3000/api/usage/vitals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(oversizedBatch),
      });

      const res = await vitalsRoute(req);
      expect(res.status).toBe(400);
    });

    it("WebVitalsReporter shouldSkipVitals does not skip when localStorage throws SecurityError", () => {
      Object.defineProperty(globalThis, "window", {
        value: {
          location: { hostname: "zenith.example" },
          localStorage: {
            getItem: () => {
              throw new DOMException("Security error", "SecurityError");
            },
          },
        },
        configurable: true,
      });

      // Should return false, NOT true
      expect(_webVitalsTesting.shouldSkipVitals()).toBe(false);
    });
  });
});
