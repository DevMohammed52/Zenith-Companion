import { describe, expect, it } from "vitest";
import {
  enemyMatchesFilter,
  formatGold,
  formatWindow,
  getEnemyCardLabel,
  levelMatches,
  matchTone,
  LEVEL_OPTIONS,
  MATCH_OPTIONS,
  SORT_OPTIONS,
} from "@/app/enemies/types";
import type { EnrichedEnemy } from "@/lib/world-intelligence";

const mockEnemy = (overrides: Partial<EnrichedEnemy> = {}): EnrichedEnemy => ({
  id: 1,
  name: "Cave Bat",
  key: "cave_bat",
  imageUrl: "https://cdn.example.com/bat.png",
  level: 8,
  health: 45,
  experience: 12,
  chanceOfLoot: 85,
  locationName: "Dark Cave",
  locationKey: "dark_cave",
  loot: [
    { name: "Bat Wing", chance: 80, quantity: 1, image_url: "https://cdn.example.com/wing.png" },
    { name: "Small Fang", chance: 15, quantity: 1, image_url: "https://cdn.example.com/fang.png" },
  ],
  lootCount: 2,
  lootEv: 125.4,
  weatherPreference: {
    enemy_id: 1,
    enemy_name: "Cave Bat",
    enemy_key: "cave_bat",
    enemy_level: 8,
    location_name: "Dark Cave",
    location_key: "dark_cave",
    confidence: "high",
    notes: null,
    loves: ["Rain", "Fog"],
    likes: ["Overcast"],
    neutral: ["Clear"],
    dislikes: ["Sun"],
    hates: ["Heatwave"],
  },
  currentWeather: { name: "Rain", starts_at: "2026-11-24T12:00:00Z" },
  nextWeather: null,
  currentWeatherMatch: "loves",
  nextFavorableWeather: null,
  searchText: "cave bat dark cave bat wing small fang rain fog overcast",
  ...overrides,
});

describe("adversarial-enemies-ui test suite", () => {
  describe("gold formatting edge cases", () => {
    it("handles zero, negative, NaN, infinity, and decimals", () => {
      expect(formatGold(0)).toBe("-");
      expect(formatGold(-1)).toBe("-");
      expect(formatGold(-99999)).toBe("-");
      expect(formatGold(Number.NaN)).toBe("-");
      expect(formatGold(Number.POSITIVE_INFINITY)).toBe("-");
      expect(formatGold(Number.NEGATIVE_INFINITY)).toBe("-");
      expect(formatGold(0.4)).toBe("0g"); // wait: Math.round(0.4) is 0, so if value > 0: formatGold(0.4) => Math.round(0.4) = 0g
      expect(formatGold(1)).toBe("1g");
      expect(formatGold(999.4)).toBe("999g");
      expect(formatGold(999.5)).toBe("1,000g");
      expect(formatGold(1000000)).toBe("1,000,000g");
    });
  });

  describe("levelMatches edge cases and boundaries", () => {
    it("matches all levels when filter is 'all'", () => {
      expect(levelMatches(mockEnemy({ level: 1 }), "all")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 100 }), "all")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 999 }), "all")).toBe(true);
    });

    it("evaluates boundary inclusivity for each defined level band", () => {
      // 1-10 band
      expect(levelMatches(mockEnemy({ level: 1 }), "1-10")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 10 }), "1-10")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 0 }), "1-10")).toBe(false);
      expect(levelMatches(mockEnemy({ level: 11 }), "1-10")).toBe(false);

      // 11-25 band
      expect(levelMatches(mockEnemy({ level: 11 }), "11-25")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 25 }), "11-25")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 10 }), "11-25")).toBe(false);
      expect(levelMatches(mockEnemy({ level: 26 }), "11-25")).toBe(false);

      // 26-50 band
      expect(levelMatches(mockEnemy({ level: 26 }), "26-50")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 50 }), "26-50")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 25 }), "26-50")).toBe(false);
      expect(levelMatches(mockEnemy({ level: 51 }), "26-50")).toBe(false);

      // 51-75 band
      expect(levelMatches(mockEnemy({ level: 51 }), "51-75")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 75 }), "51-75")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 50 }), "51-75")).toBe(false);
      expect(levelMatches(mockEnemy({ level: 76 }), "51-75")).toBe(false);

      // 76-100 band
      expect(levelMatches(mockEnemy({ level: 76 }), "76-100")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 100 }), "76-100")).toBe(true);
      expect(levelMatches(mockEnemy({ level: 75 }), "76-100")).toBe(false);
      expect(levelMatches(mockEnemy({ level: 101 }), "76-100")).toBe(false);
    });
  });

  describe("enemyMatchesFilter weather logic", () => {
    it("correctly identifies favorable weather conditions", () => {
      const lovesEnemy = mockEnemy({ currentWeatherMatch: "loves" });
      const likesEnemy = mockEnemy({ currentWeatherMatch: "likes" });
      const neutralEnemy = mockEnemy({ currentWeatherMatch: "neutral" });

      expect(enemyMatchesFilter(lovesEnemy, "favorable")).toBe(true);
      expect(enemyMatchesFilter(likesEnemy, "favorable")).toBe(true);
      expect(enemyMatchesFilter(neutralEnemy, "favorable")).toBe(false);
    });

    it("correctly identifies penalized weather conditions", () => {
      const hatesEnemy = mockEnemy({ currentWeatherMatch: "hates" });
      const dislikesEnemy = mockEnemy({ currentWeatherMatch: "dislikes" });
      const neutralEnemy = mockEnemy({ currentWeatherMatch: "neutral" });

      expect(enemyMatchesFilter(hatesEnemy, "penalized")).toBe(true);
      expect(enemyMatchesFilter(dislikesEnemy, "penalized")).toBe(true);
      expect(enemyMatchesFilter(neutralEnemy, "penalized")).toBe(false);
    });

    it("correctly identifies exact matches and unknown weather", () => {
      const unknownEnemy = mockEnemy({ currentWeatherMatch: "unknown" });
      expect(enemyMatchesFilter(unknownEnemy, "unknown")).toBe(true);
      expect(enemyMatchesFilter(unknownEnemy, "neutral")).toBe(false);
      expect(enemyMatchesFilter(unknownEnemy, "favorable")).toBe(false);
      expect(enemyMatchesFilter(unknownEnemy, "penalized")).toBe(false);
    });
  });

  describe("matchTone and formatWindow helpers", () => {
    it("returns correct tone classes", () => {
      expect(matchTone("loves")).toBe("good");
      expect(matchTone("likes")).toBe("good");
      expect(matchTone("dislikes")).toBe("bad");
      expect(matchTone("hates")).toBe("bad");
      expect(matchTone("neutral")).toBe("neutral");
      expect(matchTone("unknown")).toBe("muted");
    });

    it("formats favorable active window correctly", () => {
      const active = mockEnemy({
        currentWeatherMatch: "loves",
        currentWeather: { name: "Thunderstorm" },
      });
      expect(formatWindow(active)).toBe("Thunderstorm active now");
    });

    it("handles next favorable window with valid and missing timestamps", () => {
      const futureWithDate = mockEnemy({
        currentWeatherMatch: "neutral",
        nextFavorableWeather: {
          name: "Rain",
          starts_at: "2026-12-01T15:30:00Z",
        },
      });
      const formatted = formatWindow(futureWithDate);
      expect(formatted).toContain("Rain");

      const futureNoDate = mockEnemy({
        currentWeatherMatch: "neutral",
        nextFavorableWeather: {
          name: "Fog",
          starts_at: undefined,
        },
      });
      expect(formatWindow(futureNoDate)).toBe("Fog");

      const noMatch = mockEnemy({
        currentWeatherMatch: "neutral",
        nextFavorableWeather: null,
      });
      expect(formatWindow(noMatch)).toBe("No forecast match");
    });
  });

  describe("accessibility labels", () => {
    it("generates comprehensive enemy card aria-label", () => {
      const enemy = mockEnemy({
        name: "Shadow Drake",
        level: 45,
        locationName: "Sunken Temple",
        lootCount: 5,
        lootEv: 4200,
      });
      const label = getEnemyCardLabel(enemy);
      expect(label).toContain("Open Shadow Drake");
      expect(label).toContain("level 45");
      expect(label).toContain("Sunken Temple");
      expect(label).toContain("5 drops");
      expect(label).toContain("loot EV 4,200g");
    });
  });

  describe("pagination slicing math", () => {
    it("correctly slices items for given page and pageSize", () => {
      const items = Array.from({ length: 47 }, (_, i) => i + 1);
      const pageSize = 24;
      const totalPages = Math.ceil(items.length / pageSize);
      expect(totalPages).toBe(2);

      const page1 = items.slice(0, 24);
      expect(page1.length).toBe(24);
      expect(page1[0]).toBe(1);
      expect(page1[23]).toBe(24);

      const page2 = items.slice(24, 48);
      expect(page2.length).toBe(23);
      expect(page2[0]).toBe(25);
      expect(page2[22]).toBe(47);
    });
  });
});
