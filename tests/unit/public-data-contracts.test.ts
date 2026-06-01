import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const publicDir = path.join(process.cwd(), "public");

const reviewedPublicJsonFiles: Record<string, { maxBytes: number; whyPublic: string }> = {
  "all-items-db.json": {
    maxBytes: 2_200_000,
    whyPublic: "derived item database used by item details and planning tools",
  },
  "conquest-data.json": {
    maxBytes: 500_000,
    whyPublic: "derived conquest reference data",
  },
  "gear-data.json": {
    maxBytes: 300_000,
    whyPublic: "derived gear reference for planning tools",
  },
  "global-search-index.json": {
    maxBytes: 250_000,
    whyPublic: "derived global-search rows",
  },
  "guild-database.json": {
    maxBytes: 1_700_000,
    whyPublic: "reduced public guild database for guild pages",
  },
  "guild-details.json": {
    maxBytes: 50_000,
    whyPublic: "curated guild details cache",
  },
  "guild-list.json": {
    maxBytes: 1_200_000,
    whyPublic: "reduced public guild list for guild lookup",
  },
  "guild-refresh-plan.json": {
    maxBytes: 60_000,
    whyPublic: "public refresh metadata for transparency/debugging",
  },
  "guild-search-index.json": {
    maxBytes: 350_000,
    whyPublic: "derived guild search rows",
  },
  "idlemmo-patch-notes.json": {
    maxBytes: 2_800_000,
    whyPublic: "official patch-note archive cache",
  },
  "items-map.json": {
    maxBytes: 1_600_000,
    whyPublic: "derived item map used by item lookup",
  },
  "market-data.json": {
    maxBytes: 1_300_000,
    whyPublic: "public market snapshot used by calculators",
  },
  "offline-cache-manifest.json": {
    maxBytes: 100_000,
    whyPublic: "offline cache manifest consumed by the service worker",
  },
  "pet-database.json": {
    maxBytes: 5_500_000,
    whyPublic: "derived pet reference database",
  },
  "scraper-priority.json": {
    maxBytes: 50_000,
    whyPublic: "public scraper priority snapshot with non-secret IDs",
  },
  "scraper-status.json": {
    maxBytes: 10_000,
    whyPublic: "public freshness timestamp/status",
  },
  "search-index.json": {
    maxBytes: 400_000,
    whyPublic: "derived item-search rows",
  },
  "static-data.json": {
    maxBytes: 300_000,
    whyPublic: "derived static game reference data",
  },
  "usage-map.json": {
    maxBytes: 800_000,
    whyPublic: "derived item usage relationships",
  },
  "world-locations.json": {
    maxBytes: 200_000,
    whyPublic: "derived world map/location data",
  },
};

const secretPatterns = [
  {
    name: "known secret environment variable name",
    pattern:
      /\b(?:ADMIN_DASHBOARD_SECRET|ERROR_REPORT_SECRET|IDLEMMO_API_KEY|IMPORT_ENCRYPTION_SECRET|IMPORT_SIGNING_SECRET|SCRAPER_COORDINATOR_SECRET|TURNSTILE_SECRET_KEY|USAGE_PING_SECRET)\b/i,
  },
  {
    name: "secret-looking JSON field",
    pattern: /"(?:access_token|api[_-]?key|authorization|password|refresh_token|secret|token)"\s*:/i,
  },
  {
    name: "bearer token value",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i,
  },
];

function readPublicJson(fileName: string) {
  const filePath = path.join(publicDir, fileName);
  return {
    filePath,
    raw: readFileSync(filePath, "utf8"),
    stats: statSync(filePath),
  };
}

describe("public JSON data contract", () => {
  it("keeps every public JSON file reviewed explicitly", () => {
    const actualJsonFiles = readdirSync(publicDir)
      .filter((fileName) => fileName.endsWith(".json"))
      .sort();
    const reviewedJsonFiles = Object.keys(reviewedPublicJsonFiles).sort();

    expect(actualJsonFiles).toEqual(reviewedJsonFiles);
  });

  it("keeps reviewed public JSON files parseable and inside size budgets", () => {
    for (const [fileName, review] of Object.entries(reviewedPublicJsonFiles)) {
      const filePath = path.join(publicDir, fileName);
      expect(existsSync(filePath), `${fileName} should exist because it is listed as public: ${review.whyPublic}`).toBe(true);

      const { raw, stats } = readPublicJson(fileName);
      expect(stats.size, `${fileName} grew beyond its reviewed public-data budget`).toBeLessThanOrEqual(review.maxBytes);
      expect(() => JSON.parse(raw), `${fileName} should remain valid JSON`).not.toThrow();
    }
  });

  it("does not expose obvious secrets or auth material in public JSON", () => {
    for (const fileName of Object.keys(reviewedPublicJsonFiles)) {
      const { raw } = readPublicJson(fileName);

      for (const secretPattern of secretPatterns) {
        expect(secretPattern.pattern.test(raw), `${fileName} includes ${secretPattern.name}`).toBe(false);
      }
    }
  });
});
