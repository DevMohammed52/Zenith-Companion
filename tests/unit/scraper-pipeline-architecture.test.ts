import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ITEM_SEARCH_TYPES,
  RATE_LIMIT_KEY_RPM,
  RATE_PROFILES,
  computeRateLimitWaitMs,
  delayMsForRequestsPerMinute,
  parseRateLimitHeaders,
  resolveRateLimitDelayMs,
} from "../../scripts/idlemmo-fetch-utils.mjs";
import {
  buildLiquidityMetrics,
  buildSafeMarketAverages,
  collectMarketCandidateNames,
  hasMarketItemChanged,
  isOnCooldown,
  mergeMarketItemEntry,
  shouldQueryOrdersFirst,
  shouldScrapeMarketItem,
  shouldSkipZeroHistoryItem,
} from "../../scraper.mjs";
import {
  identifyCatalogGaps,
  mergeDiscoveredItemIntoCatalog,
  normalizeCatalogSearchParams,
} from "../../scripts/discover-idlemmo-catalog.mjs";

const ROOT = process.cwd();

function extractCrons(yamlText: string): string[] {
  return Array.from(yamlText.matchAll(/^\s*-\s*cron:\s*'([^']+)'/gm), (m) => m[1]);
}

function expandCronHoursAndDays(cronExpr: string) {
  const [minStr, hourStr, , , dowStr] = cronExpr.trim().split(/\s+/);
  const parseField = (field: string, minVal: number, maxVal: number): number[] => {
    if (field === "*") {
      return Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);
    }
    const values: number[] = [];
    for (const part of field.split(",")) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let v = start; v <= end; v += 1) values.push(v);
      } else {
        values.push(Number(part));
      }
    }
    return values;
  };
  const minutes = parseField(minStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const dows = parseField(dowStr, 0, 6);
  const slots: { dow: number; minuteOfWeek: number }[] = [];
  for (const dow of dows) {
    for (const hour of hours) {
      for (const minute of minutes) {
        slots.push({ dow, minuteOfWeek: dow * 1440 + hour * 60 + minute });
      }
    }
  }
  return slots;
}

describe("idlemmo-fetch-utils 80 req/min rate architecture", () => {
  it("uses 80 req/min tier with safe shared and isolated headroom", () => {
    expect(RATE_LIMIT_KEY_RPM).toBe(80);
    expect(RATE_PROFILES.shared).toBe(60);
    expect(RATE_PROFILES.isolated).toBe(68);
    expect(RATE_LIMIT_KEY_RPM - RATE_PROFILES.shared).toBeGreaterThanOrEqual(20);
    expect(RATE_LIMIT_KEY_RPM - RATE_PROFILES.isolated).toBeGreaterThanOrEqual(12);
    expect(resolveRateLimitDelayMs({ profile: "shared" })).toBe(1000);
    expect(resolveRateLimitDelayMs({ profile: "isolated" })).toBe(883);
    expect(delayMsForRequestsPerMinute(120)).toBe(Math.ceil(60000 / 76));
  });

  it("parses rate-limit headers and triggers proactive reset waits only below reserve", () => {
    const nowMs = 1_795_867_560_000;
    const headersLow = new Headers({
      "x-ratelimit-limit": "80",
      "x-ratelimit-remaining": "5",
      "x-ratelimit-reset": "1795867577",
    });
    const parsed = parseRateLimitHeaders(headersLow);
    expect(parsed.limit).toBe(80);
    expect(parsed.remaining).toBe(5);
    expect(parsed.resetEpochSec).toBe(1_795_867_577);
    expect(computeRateLimitWaitMs(headersLow, { reserveRemaining: 8, nowMs })).toBe(17_500);

    const headersHealthy = {
      "x-ratelimit-remaining": "42",
      "x-ratelimit-reset": "1795867577",
    };
    expect(computeRateLimitWaitMs(headersHealthy, { reserveRemaining: 8, nowMs })).toBe(0);
  });

  it("covers all 41 verified item search types including RESET_STONE and RECIPE", () => {
    expect(ITEM_SEARCH_TYPES.length).toBeGreaterThanOrEqual(41);
    expect(ITEM_SEARCH_TYPES).toContain("RECIPE");
    expect(ITEM_SEARCH_TYPES).toContain("RESET_STONE");
    expect(ITEM_SEARCH_TYPES).toContain("POTION");
  });
});

describe("scraper.mjs quota elimination and math invariance", () => {
  it("excludes untradeable items and phantom alchemy recipes absent from all-items-db", () => {
    const mockDb = {
      pot1: { hashed_id: "pot1", name: "Minor Health Potion", is_tradeable: true },
      mat1: { hashed_id: "mat1", name: "Apple", is_tradeable: true },
      realRec: { hashed_id: "realRec", name: "Recipe: Iron Sword", is_tradeable: true },
      soulbound: { hashed_id: "soulbound", name: "Untradeable Relic", is_tradeable: false },
    };
    const result = collectMarketCandidateNames({
      alchemyItems: {
        "Minor Health Potion": { materials: { Apple: 2 } },
      },
      staticData: {
        world_bosses: [
          {
            loot: [
              { name: "Untradeable Relic" },
              { name: "Apple" },
              { name: "Unmapped Boss Drop" },
            ],
          },
        ],
      },
      allItemsDb: mockDb,
      isPriorityOnly: false,
    });

    expect(result.itemsArray).toContain("Minor Health Potion");
    expect(result.itemsArray).toContain("Apple");
    expect(result.itemsArray).toContain("Recipe: Iron Sword");
    expect(result.itemsArray).toContain("Unmapped Boss Drop");
    expect(result.itemsArray).not.toContain("Recipe: Minor Health Potion");
    expect(result.itemsArray).not.toContain("Untradeable Relic");
    expect(shouldScrapeMarketItem("Untradeable Relic", mockDb.soulbound)).toBe(false);
    expect(shouldScrapeMarketItem("Unmapped Boss Drop", undefined)).toBe(true);
  });

  it("applies 12h cooldowns to zero-history and listings-only items cleanly", () => {
    const nowMs = 1_800_000_000_000;
    const twoHoursAgoSec = Math.floor((nowMs - 2 * 60 * 60 * 1000) / 1000);
    const thirteenHoursAgoSec = Math.floor((nowMs - 13 * 60 * 60 * 1000) / 1000);

    const item = { hashed_id: "abc123", name: "Test Item" };
    const marketMeta = {
      zero_history_checked_at: { abc123: twoHoursAgoSec },
      listings_only_checked_at: { def456: twoHoursAgoSec },
    };

    expect(isOnCooldown(marketMeta.zero_history_checked_at, "abc123", 12 * 3600 * 1000, nowMs)).toBe(true);
    expect(shouldSkipZeroHistoryItem({ itemRecord: item, marketMeta, nowMs })).toBe(true);
    expect(shouldSkipZeroHistoryItem({ itemRecord: item, marketMeta, forceFullMarket: true, nowMs })).toBe(false);
    expect(
      shouldSkipZeroHistoryItem({
        itemRecord: item,
        marketMeta: { zero_history_checked_at: { abc123: thirteenHoursAgoSec } },
        nowMs,
      }),
    ).toBe(false);

    expect(shouldQueryOrdersFirst({ itemRecord: { hashed_id: "def456" }, marketMeta, nowMs })).toBe(false);
    expect(shouldQueryOrdersFirst({ itemRecord: { hashed_id: "def456" }, marketMeta, forceFullMarket: true, nowMs })).toBe(true);
    expect(
      shouldQueryOrdersFirst({
        itemRecord: { hashed_id: "def456" },
        marketMeta: { listings_only_checked_at: { def456: thirteenHoursAgoSec } },
        nowMs,
      }),
    ).toBe(true);
  });

  it("preserves spike-suppression and liquidity metrics behavior", () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const history = [
      { date: yesterday, average_price: 100, total_sold: 50 },
      { date: today, average_price: 105, total_sold: 40 },
      { date: today, average_price: 10000, total_sold: 1 },
    ];
    const safe = buildSafeMarketAverages(history, [{ price: 102 }, { price: 104 }, { price: 100 }]);
    const liq = buildLiquidityMetrics(history);

    expect(safe.adjusted).toBe(true);
    expect(safe.removedRows).toBeGreaterThan(0);
    expect(safe.avg3.safe).toBeGreaterThan(95);
    expect(safe.avg3.safe).toBeLessThan(120);
    expect(liq.vol3).toBe(91);
  });
});

describe("discover-idlemmo-catalog helpers", () => {
  it("normalizes type arguments and identifies missing or undetailed items", () => {
    expect(normalizeCatalogSearchParams({ typesArg: "recipe, potion,recipe" })).toEqual(["RECIPE", "POTION"]);
    expect(normalizeCatalogSearchParams({})).toEqual([...ITEM_SEARCH_TYPES]);

    const existing = {
      h1: { hashed_id: "h1", name: "Complete Item", _is_detailed: true },
      h2: { hashed_id: "h2", name: "Partial Item", _is_detailed: false },
    };
    const gaps = identifyCatalogGaps(
      [
        { hashed_id: "h1", name: "Complete Item" },
        { hashed_id: "h2", name: "Partial Item" },
        { hashed_id: "h3", name: "Brand New Item" },
        { hashed_id: "h3", name: "Brand New Item Duplicate" },
      ],
      existing,
    );

    expect(gaps.alreadyKnownCount).toBe(1);
    expect(gaps.undetailedItems).toHaveLength(1);
    expect(gaps.newItems).toHaveLength(1);
    expect(gaps.newItems[0].hashed_id).toBe("h3");
  });

  it("merges discovered inspected items into both allItemsDb and itemsMap", () => {
    const db: Record<string, { name?: string; _last_detailed_at?: string }> = {};
    const map: Record<string, { name?: string; _last_detailed_at?: string }> = {};
    const merged = mergeDiscoveredItemIntoCatalog(
      db,
      map,
      {
        hashed_id: "newHash1",
        name: "Mythic Elixir",
        type: "POTION",
        quality: "MYTHIC",
        vendor_price: 250,
        is_tradeable: true,
        max_tier: 1,
      },
      "2026-11-28T12:00:00.000Z",
    );

    expect(merged._is_detailed).toBe(true);
    expect(db.newHash1.name).toBe("Mythic Elixir");
    expect(map.newHash1._last_detailed_at).toBe("2026-11-28T12:00:00.000Z");
  });
});

describe("GitHub Actions schedule de-collision and budget contracts", () => {
  it("preserves prior last_updated when market item values are unchanged", () => {
    const prev = {
      hashed_id: "h1",
      price: 100,
      safe_price: 100,
      avg_3: 100,
      vol_3: 50,
      vendor_price: 10,
      last_updated: "2026-11-27T00:00:00.000Z",
    };
    const unchanged = {
      ...prev,
      last_updated: "2026-11-28T12:00:00.000Z",
    };
    const priceMoved = {
      ...unchanged,
      price: 112,
    };

    expect(hasMarketItemChanged(prev, unchanged)).toBe(false);
    expect(mergeMarketItemEntry(prev, unchanged).last_updated).toBe("2026-11-27T00:00:00.000Z");
    expect(hasMarketItemChanged(prev, priceMoved)).toBe(true);
    expect(mergeMarketItemEntry(prev, priceMoved).last_updated).toBe("2026-11-28T12:00:00.000Z");
  });

  it("separates update_data and update_guild_data schedules cleanly with zero overlaps and <= 85 daily deploys", () => {
    const dataYml = fs.readFileSync(path.join(ROOT, ".github/workflows/update_data.yml"), "utf8");
    const guildYml = fs.readFileSync(path.join(ROOT, ".github/workflows/update_guild_data.yml"), "utf8");
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));

    const dataCrons = extractCrons(dataYml);
    const guildCrons = extractCrons(guildYml);

    expect(dataCrons).toContain("5 0,4,8,12,16,20 * * *");
    expect(dataCrons).toContain("5 1,2,3,5,6,7,9,10,11,13,14,15,17,18,19,21,22,23 * * *");
    expect(dataCrons).toContain("35 1,3,5,7,9,11,13,15,17,19,21,23 * * *");
    expect(dataCrons).toContain("50 * * * *");
    expect(dataCrons).toContain("22 3 * * 1,4");

    expect(guildCrons).toContain("35 0 * * *");
    expect(guildCrons).toContain("35 4,6,8,10,12,14,16,18,20,22 * * *");
    expect(guildCrons).toContain("35 2 * * 1-6");
    expect(guildCrons).toContain("35 2 * * 0");

    // Verify workflow conditional strings exactly match the declared cron strings
    expect(dataYml).toContain('github.event.schedule }}" = "22 3 * * 1,4"');
    expect(dataYml).toContain('github.event.schedule }}" = "5 1,2,3,5,6,7,9,10,11,13,14,15,17,18,19,21,22,23 * * *"');
    expect(dataYml).toContain('github.event.schedule }}" = "35 1,3,5,7,9,11,13,15,17,19,21,23 * * *"');
    expect(dataYml).toContain('github.event.schedule }}" = "50 * * * *"');
    expect(dataYml).toContain("--ignore-only=public/scraper-status.json");
    expect(guildYml).toContain('github.event.schedule }}" = "35 2 * * 0"');
    expect(guildYml).toContain('github.event.schedule }}" = "35 0 * * *"');

    // Generated-data commits skip duplicate GitHub Actions runs while still publishing public data to Vercel,
    // and vercel.json skips non-app doc/test/workflow commits without blocking data updates.
    expect(dataYml).toContain("[skip ci]");
    expect(guildYml).toContain("[skip ci]");
    expect(vercelConfig.ignoreCommand).toContain("vercel");
    expect(vercelConfig.ignoreCommand).toContain("ROADMAP.md");
    expect(vercelConfig.ignoreCommand).not.toContain("[skip ci]");

    const allSlots = [
      ...dataCrons.flatMap(expandCronHoursAndDays),
      ...guildCrons.flatMap(expandCronHoursAndDays),
    ].sort((a, b) => a.minuteOfWeek - b.minuteOfWeek);

    // Every guild/conquest/market slot must be unique and separated by >= 13 minutes across the entire week
    const WEEK_MINUTES = 7 * 1440;
    for (let i = 0; i < allSlots.length; i++) {
      const curr = allSlots[i];
      const next = allSlots[(i + 1) % allSlots.length];
      const diff = (next.minuteOfWeek - curr.minuteOfWeek + WEEK_MINUTES) % WEEK_MINUTES;
      expect(diff).toBeGreaterThanOrEqual(13);
    }

    // Peak single-day API runs across update_data + update_guild_data stay strictly <= 75/day (leaving headroom <= 100/day Vercel limit)
    for (let dow = 0; dow <= 6; dow++) {
      const dayCount = allSlots.filter((slot) => slot.dow === dow).length;
      expect(dayCount).toBeLessThanOrEqual(73);
      expect(dayCount).toBeGreaterThanOrEqual(72);
    }
  });
});
