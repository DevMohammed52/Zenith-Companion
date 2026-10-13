import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type OfflineCacheManifest = {
  count: number;
  generatedAt: string;
  hashes: Record<string, string>;
  totalBytes: number;
  urls: string[];
  version: string;
};

const publicDir = path.join(process.cwd(), "public");
const manifest = JSON.parse(
  readFileSync(path.join(publicDir, "offline-cache-manifest.json"), "utf8"),
) as OfflineCacheManifest;
const manifestUrls = manifest.urls;
const serviceWorkerSource = readFileSync(path.join(publicDir, "sw.js"), "utf8");
const guildPageSource = readFileSync(path.join(process.cwd(), "src/app/guilds/page.tsx"), "utf8");

const essentialPublicData = [
  "/all-items-db.json",
  "/conquest-data.json",
  "/gear-data.json",
  "/global-search-index.json",
  "/guild-list.json",
  "/guild-search-index.json",
  "/idlemmo-patch-notes.json",
  "/market-data.json",
  "/pet-database.json",
  "/search-index.json",
  "/static-data.json",
  "/usage-map.json",
  "/world-locations.json",
];

const intentionallyBypassedPublicFiles = [
  "/guild-database.json",
  "/guild-details.json",
  "/guild-refresh-plan.json",
  "/items-map.json",
  "/scraper-priority.json",
  "/scraper-status.json",
  "/sw.js",
];

const sensitiveRuntimePrefixes = [
  "/admin/",
  "/api/admin/",
  "/api/debug/",
  "/api/profile-import/",
  "/api/usage/",
  "/error-preview",
  "/loading-preview",
];

function publicPathFor(url: string) {
  return path.join(publicDir, ...url.replace(/^\//, "").split("/"));
}

describe("offline cache contract", () => {
  it("keeps manifest metadata and per-URL hashes consistent with the URL list", () => {
    expect(typeof manifest.generatedAt).toBe("string");
    expect(manifest.version).toMatch(/^[a-f0-9]{16}$/);
    expect(manifest.count).toBe(manifestUrls.length);
    expect(manifest.totalBytes).toBeGreaterThan(10_000_000);
    expect(new Set(manifestUrls).size, "Offline cache manifest should not contain duplicate URLs").toBe(
      manifestUrls.length,
    );
    expect([...manifestUrls].sort((a, b) => a.localeCompare(b))).toEqual(manifestUrls);
    expect(typeof manifest.hashes).toBe("object");
    expect(manifest.hashes).not.toBeNull();
    expect(Object.keys(manifest.hashes).sort((a, b) => a.localeCompare(b))).toEqual(manifestUrls);
    for (const url of manifestUrls) {
      expect(manifest.hashes[url], `Missing hash for ${url}`).toMatch(/^[a-f0-9]{16}$/);
    }
  });

  it("keeps essential public datasets cacheable for offline use and excludes promotional screenshots", () => {
    for (const url of essentialPublicData) {
      expect(manifestUrls, `${url} should be part of the offline public-data bundle`).toContain(url);
    }

    expect(manifestUrls.length, "Default offline install should stay below the large guild-detail shard count").toBeLessThan(75);
    expect(
      manifestUrls.some((url) => /^\/guild-details\/\d+\.json$/.test(url)),
      "Guild detail shards should not be auto pre-cached; they remain runtime network-first cache entries when opened.",
    ).toBe(false);
    expect(
      manifestUrls.some((url) => url.startsWith("/readme/") || url.startsWith("/pwa/screenshots/")),
      "README and PWA marketing screenshots should not bloat the offline precache manifest.",
    ).toBe(false);
  });

  it("does not pre-cache sensitive runtime routes or intentionally blocked raw files", () => {
    for (const url of intentionallyBypassedPublicFiles) {
      expect(manifestUrls, `${url} should not be pre-cached`).not.toContain(url);
    }

    for (const url of manifestUrls) {
      expect(url.startsWith("/"), `${url} should be an origin-relative URL`).toBe(true);
      expect(url.includes(".."), `${url} should not contain path traversal segments`).toBe(false);

      for (const prefix of sensitiveRuntimePrefixes) {
        expect(url.startsWith(prefix), `${url} should not cache sensitive prefix ${prefix}`).toBe(false);
      }
    }
  });

  it("only lists public files that exist on disk", () => {
    for (const url of manifestUrls) {
      expect(existsSync(publicPathFor(url)), `${url} is listed in the offline manifest but missing from public/`).toBe(
        true,
      );
    }
  });

  it("keeps service worker bypass rules aligned with private runtime routes", () => {
    for (const prefix of sensitiveRuntimePrefixes) {
      expect(serviceWorkerSource, `Service worker should bypass ${prefix}`).toContain(`"${prefix}"`);
    }

    const publicApiPrefixes = serviceWorkerSource.match(/const PUBLIC_API_PREFIXES = \[([^\]]*)\];/);
    expect(publicApiPrefixes?.[1]).toContain('"/api/items/"');
    expect(publicApiPrefixes?.[1]).not.toContain('"/api/"');
  });

  it("keeps large guild detail shards behind an explicit offline cache action", () => {
    expect(serviceWorkerSource).toContain("ZENITH_CACHE_GUILD_DETAILS");
    expect(serviceWorkerSource).toContain("GUILD_DETAIL_URL_PATTERN");
    expect(serviceWorkerSource).toContain("cacheGuildDetailUrls");
    expect(serviceWorkerSource).toContain("GUILD_DETAIL_URL_PATTERN.test(requestUrl.pathname)");

    expect(guildPageSource).toContain("OfflineGuildDetailsCache");
    expect(guildPageSource).toContain("Cache shown");
    expect(guildPageSource).toContain("Cache all");
  });

  it("incrementally refreshes only changed or missing URLs in refreshPublicDataCache", async () => {
    const origin = "https://zenith-companion.vercel.app";
    const storedEntries = new Map<string, { json: () => Promise<unknown> }>();
    const fetchedUrls: string[] = [];

    const previousManifest = {
      version: "aaaa1111bbbb2222",
      urls: ["/all-items-db.json", "/market-data.json", "/old-removed.json"],
      hashes: {
        "/all-items-db.json": "1111111111111111",
        "/market-data.json": "2222222222222222",
        "/old-removed.json": "3333333333333333",
      },
    };

    const nextManifest = {
      version: "cccc3333dddd4444",
      urls: ["/all-items-db.json", "/market-data.json", "/static-data.json"],
      hashes: {
        "/all-items-db.json": "1111111111111111", // unchanged & cached
        "/market-data.json": "9999999999999999", // hash changed
        "/static-data.json": "4444444444444444", // missing from cache
      },
    };

    storedEntries.set("/offline-cache-manifest.json", {
      json: async () => previousManifest,
    });
    storedEntries.set(`${origin}/all-items-db.json`, {
      json: async () => ({}),
    });
    storedEntries.set(`${origin}/market-data.json`, {
      json: async () => ({}),
    });
    storedEntries.set(`${origin}/old-removed.json`, {
      json: async () => ({}),
    });

    const fakeCache = {
      match: async (req: string | { url: string }) => {
        const key = typeof req === "string" ? req : req.url;
        return storedEntries.get(key) ?? null;
      },
      put: async (req: string | { url: string }, res: { json: () => Promise<unknown> }) => {
        const key = typeof req === "string" ? req : req.url;
        storedEntries.set(key, res);
      },
      delete: async (req: string | { url: string }) => {
        const key = typeof req === "string" ? req : req.url;
        return storedEntries.delete(key);
      },
    };

    const sandbox: Record<string, unknown> = {
      URL,
      Request: class FakeRequest {
        url: string;
        constructor(input: string | URL) {
          this.url = String(input);
        }
      },
      Response: class FakeResponse {},
      self: {
        location: { origin },
        addEventListener: () => {},
        clients: { claim: async () => {} },
        skipWaiting: async () => {},
      },
      caches: {
        open: async () => fakeCache,
        keys: async () => [],
        delete: async () => true,
        match: async () => null,
      },
      fetch: async (input: string | { url: string }) => {
        const rawUrl = typeof input === "string" ? input : input.url;
        const pathname = rawUrl.startsWith("http") ? new URL(rawUrl).pathname : rawUrl;
        fetchedUrls.push(pathname);
        const payload = pathname === "/offline-cache-manifest.json" ? nextManifest : { ok: pathname };
        return {
          ok: true,
          clone() {
            return this;
          },
          json: async () => payload,
        };
      },
    };

    vm.createContext(sandbox);
    vm.runInContext(serviceWorkerSource, sandbox);

    const refreshFn = sandbox.refreshPublicDataCache as () => Promise<void>;
    await refreshFn();

    expect(fetchedUrls).toContain("/offline-cache-manifest.json");
    expect(fetchedUrls).toContain("/market-data.json");
    expect(fetchedUrls).toContain("/static-data.json");
    expect(fetchedUrls).not.toContain("/all-items-db.json");
    expect(storedEntries.has(`${origin}/old-removed.json`)).toBe(false);

    // Simulate /settings or install overwriting /offline-cache-manifest.json in cache before a 3rd manifest update is synced,
    // and simulate a transient 503 failure on /market-data.json followed by a successful retry.
    const thirdManifest = {
      version: "eeee5555ffff6666",
      urls: ["/all-items-db.json", "/market-data.json", "/static-data.json"],
      hashes: {
        "/all-items-db.json": "1111111111111111",
        "/market-data.json": "7777777777777777",
        "/static-data.json": "4444444444444444",
      },
    };
    storedEntries.set("/offline-cache-manifest.json", {
      json: async () => thirdManifest,
    });

    let failMarketData = true;
    sandbox.fetch = async (input: string | { url: string }) => {
      const rawUrl = typeof input === "string" ? input : input.url;
      const pathname = rawUrl.startsWith("http") ? new URL(rawUrl).pathname : rawUrl;
      fetchedUrls.push(pathname);
      if (pathname === "/market-data.json" && failMarketData) {
        return { ok: false, clone() { return this; }, json: async () => ({}) };
      }
      const payload = pathname === "/offline-cache-manifest.json" ? thirdManifest : { ok: pathname };
      return {
        ok: true,
        clone() {
          return this;
        },
        json: async () => payload,
      };
    };

    fetchedUrls.length = 0;
    await refreshFn();
    // Even though /offline-cache-manifest.json in cache was already thirdManifest, MANIFEST_META_URL detected the /market-data.json hash change
    expect(fetchedUrls).toEqual(["/offline-cache-manifest.json", "/market-data.json"]);

    // Because /market-data.json failed with ok: false on the previous attempt, the next refresh must retry /market-data.json
    failMarketData = false;
    fetchedUrls.length = 0;
    await refreshFn();
    expect(fetchedUrls).toEqual(["/offline-cache-manifest.json", "/market-data.json"]);

    // Once /market-data.json succeeds, a subsequent refresh with no hash changes fetches nothing except the manifest
    fetchedUrls.length = 0;
    await refreshFn();
    expect(fetchedUrls).toEqual(["/offline-cache-manifest.json"]);
  });
});
