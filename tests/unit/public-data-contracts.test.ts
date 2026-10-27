import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { WEATHER_DATA } from "../../src/constants/weatherData";

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

  it("keeps world-location weather modifiers aligned with the reviewed weather table", () => {
    const { raw } = readPublicJson("world-locations.json");
    const payload = JSON.parse(raw) as {
      locations?: Array<{
        name?: string;
        forecast?: Array<{
          weathers?: Array<{
            key?: string;
            name?: string;
            icon?: string;
            buffs?: string[];
          }>;
        }>;
      }>;
    };

    const expectedWeatherBuffs = new Map(
      WEATHER_DATA.map((weather) => [
        weather.id,
        [
          ...weather.impacts.flatMap((impact) => {
            const buffs: string[] = [];
            const efficiencyLabel = impact.skill === "Hunting" ? "Hunt Efficiency" : `${impact.skill} Efficiency`;
            const experienceLabel = impact.skill === "Hunting" ? "Hunting Mastery EXP" : `${impact.skill} EXP`;

            if (impact.efficiency) buffs.push(`${impact.efficiency > 0 ? "+" : ""}${impact.efficiency}% ${efficiencyLabel}`);
            if (impact.experience) buffs.push(`${impact.experience > 0 ? "+" : ""}${impact.experience}% ${experienceLabel}`);

            return buffs;
          }),
          ...(weather.magicFind
            ? [
                `+${weather.magicFind.battle}% Battle Magic Find`,
                `+${weather.magicFind.dungeon}% Dungeon Magic Find`,
                `+${weather.magicFind.worldBoss}% World Boss Magic Find`,
              ]
            : []),
        ],
      ]),
    );

    const weatherWindows =
      payload.locations?.flatMap((location) =>
        (location.forecast || []).flatMap((day) =>
          (day.weathers || [])
            .map((weather) => ({
              location: location.name || "Unknown location",
              id: String(weather.key || weather.name || weather.icon || "")
                .trim()
                .toLowerCase()
                .replace(/[_\s]+/g, "-"),
              name: weather.name || weather.key || "Unknown weather",
              buffs: weather.buffs || [],
            }))
            .filter((weather) => expectedWeatherBuffs.has(weather.id)),
        ),
      ) || [];

    expect(weatherWindows.length, "world-locations.json should include reviewed forecast windows").toBeGreaterThan(0);

    for (const weather of weatherWindows) {
      expect(weather.buffs, `${weather.location} ${weather.name} should match reviewed weather modifiers`).toEqual(expectedWeatherBuffs.get(weather.id));
    }
  });

  it("keeps public/data/lore.json valid, inside budget, and matching schema constraints", () => {
    const lorePath = path.join(publicDir, "data", "lore.json");
    expect(existsSync(lorePath), "public/data/lore.json should exist").toBe(true);

    const raw = readFileSync(lorePath, "utf8");
    const stats = statSync(lorePath);
    expect(stats.size, "public/data/lore.json exceeds 250 KB budget").toBeLessThanOrEqual(250_000);

    for (const secretPattern of secretPatterns) {
      expect(secretPattern.pattern.test(raw), `public/data/lore.json includes ${secretPattern.name}`).toBe(false);
    }

    const payload = JSON.parse(raw) as {
      entries?: Array<{
        id?: string;
        title?: string;
        category?: string;
        summary?: string;
        tags?: string[];
        relatedIds?: string[];
        sections?: Array<{ title?: string; body?: string }>;
        keyFacts?: string[];
        timelineMarkers?: string[];
      }>;
      relations?: Array<{
        source?: string;
        target?: string;
        type?: string;
        confidence?: string;
        evidence?: string;
      }>;
      theories?: Array<{
        id?: string;
        title?: string;
        premise?: string;
        evidenceIds?: string[];
        counterpoints?: string[];
        speculationLevel?: string;
      }>;
      timeline?: Array<{
        id?: string;
        era?: string;
        title?: string;
        summary?: string;
        entryIds?: string[];
      }>;
      itemLinks?: Array<{
        itemName?: string;
        entryIds?: string[];
        reason?: string;
        confidence?: string;
      }>;
    };

    expect(payload).toBeDefined();
    expect(Array.isArray(payload.entries)).toBe(true);
    expect(payload.entries?.length).toBeGreaterThanOrEqual(80);
    expect(Array.isArray(payload.relations)).toBe(true);
    expect(payload.relations?.length).toBeGreaterThanOrEqual(150);
    expect(Array.isArray(payload.theories)).toBe(true);
    expect(payload.theories?.length).toBeGreaterThanOrEqual(10);
    expect(Array.isArray(payload.timeline)).toBe(true);
    expect(payload.timeline?.length).toBeGreaterThanOrEqual(10);
    expect(Array.isArray(payload.itemLinks)).toBe(true);
    expect(payload.itemLinks?.length).toBeGreaterThanOrEqual(20);

    const allowedCategories = ["Index", "Overview", "Civilization", "World", "Concept", "Artifact", "Bestiary", "NPC"];
    for (const entry of payload.entries || []) {
      expect(typeof entry.id).toBe("string");
      expect(entry.id!.length).toBeGreaterThan(0);
      expect(typeof entry.title).toBe("string");
      expect(entry.title!.length).toBeGreaterThan(0);
      expect(allowedCategories).toContain(entry.category);
      expect(typeof entry.summary).toBe("string");
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(Array.isArray(entry.relatedIds)).toBe(true);
      expect(Array.isArray(entry.sections)).toBe(true);
      expect(Array.isArray(entry.keyFacts)).toBe(true);
      expect(Array.isArray(entry.timelineMarkers)).toBe(true);
    }

    for (const relation of payload.relations || []) {
      expect(typeof relation.source).toBe("string");
      expect(typeof relation.target).toBe("string");
      expect(["canon", "inferred", "theory"]).toContain(relation.confidence);
    }

    for (const theory of payload.theories || []) {
      expect(typeof theory.id).toBe("string");
      expect(typeof theory.title).toBe("string");
      expect(["Low", "Medium", "High"]).toContain(theory.speculationLevel);
    }

    for (const link of payload.itemLinks || []) {
      expect(typeof link.itemName).toBe("string");
      expect(Array.isArray(link.entryIds)).toBe(true);
      expect(["canon", "inferred", "theory"]).toContain(link.confidence);
    }
  });

  it("indexes Reset Stone with correct official schema in all-items-db and search-index", () => {
    const allItems = JSON.parse(readPublicJson("all-items-db.json").raw) as Record<string, any>;
    const resetStone = allItems["yeZRGx9YjBkxYB80gWlP"];
    expect(resetStone).toBeDefined();
    expect(resetStone.name).toBe("Reset Stone");
    expect(resetStone.type).toBe("RESET_STONE");
    expect(resetStone.quality).toBe("MYTHIC");
    expect(resetStone.image_url).toBe("https://cdn.idle-mmo.com/uploaded/skins/01M0D7XTAFHV8QXD9G3JVF99RY.png");
    expect(resetStone.vendor_price).toBe(0);
    expect(resetStone.is_tradeable).toBe(false);

    const searchIndex = JSON.parse(readPublicJson("search-index.json").raw) as Array<any>;
    const searchEntry = searchIndex.find((item: any) => item.id === "yeZRGx9YjBkxYB80gWlP");
    expect(searchEntry).toBeDefined();
    expect(searchEntry?.name).toBe("Reset Stone");
  });
});
