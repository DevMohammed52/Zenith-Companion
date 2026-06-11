import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type OfflineCacheManifest = {
  count: number;
  generatedAt: string;
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
  it("keeps manifest metadata consistent with the URL list", () => {
    expect(typeof manifest.generatedAt).toBe("string");
    expect(manifest.version).toMatch(/^[a-f0-9]{16}$/);
    expect(manifest.count).toBe(manifestUrls.length);
    expect(manifest.totalBytes).toBeGreaterThan(10_000_000);
    expect(new Set(manifestUrls).size, "Offline cache manifest should not contain duplicate URLs").toBe(
      manifestUrls.length,
    );
    expect([...manifestUrls].sort((a, b) => a.localeCompare(b))).toEqual(manifestUrls);
  });

  it("keeps essential public datasets cacheable for offline use", () => {
    for (const url of essentialPublicData) {
      expect(manifestUrls, `${url} should be part of the offline public-data bundle`).toContain(url);
    }

    expect(manifestUrls.length, "Default offline install should stay below the large guild-detail shard count").toBeLessThan(75);
    expect(
      manifestUrls.some((url) => /^\/guild-details\/\d+\.json$/.test(url)),
      "Guild detail shards should not be auto pre-cached; they remain runtime network-first cache entries when opened.",
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
});
