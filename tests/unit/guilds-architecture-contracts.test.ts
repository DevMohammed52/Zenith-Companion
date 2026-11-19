import { describe, expect, it } from "vitest";
import {
  compareGuilds,
  formatGuildAge,
  formatGuildNumber,
  formatGuildPosition,
  getIdleMmoProfileUrl,
  GUILD_TIER_LABELS,
  type GuildRecord,
} from "@/lib/guilds";
import {
  getGuildDetailUrls,
  getSafeExternalHref,
  getSearchText,
  readCacheProgress,
  SORT_OPTIONS,
  TIER_FILTERS,
} from "@/app/guilds/types";

describe("/guilds Architecture Contracts & Calculation Invariance", () => {
  const mockGuildA: GuildRecord = {
    id: 101,
    name: "Iron Vanguard",
    tag: "IV",
    level: 45,
    member_count: 28,
    marks: 15400,
    average_total_level: 820,
    activity_score: 9500,
    season_position: 3,
    refresh_tier: "hot",
    leader_names: ["Ares", "Athena"],
    top_member_names: ["Spartan", "Gladiator"],
    icon_url: "https://example.com/icon1.png",
    background_url: "https://example.com/bg1.png",
    last_info_fetch_at: "2026-11-19T10:00:00Z",
    last_members_fetch_at: "2026-11-19T10:00:00Z",
  };

  const mockGuildB: GuildRecord = {
    id: 202,
    name: "Shadow Syndicate",
    tag: "SS",
    level: 30,
    member_count: 35,
    marks: 9200,
    average_total_level: 750,
    activity_score: 8200,
    season_position: 12,
    refresh_tier: "warm",
    leader_names: ["Nyx"],
    top_member_names: ["Rogue", "Assassin"],
    icon_url: "https://example.com/icon2.png",
    background_url: null,
    last_info_fetch_at: "2026-11-18T10:00:00Z",
    last_members_fetch_at: "2026-11-18T10:00:00Z",
  };

  describe("URL Safety & Search Text Invariance", () => {
    it("safely validates external hrefs and rejects invalid or malicious schemes", () => {
      expect(getSafeExternalHref("https://idle-mmo.com/profile/killua")).toBe("https://idle-mmo.com/profile/killua");
      expect(getSafeExternalHref("http://example.com")).toBe("http://example.com/");
      expect(getSafeExternalHref("javascript:alert(1)")).toBe(null);
      expect(getSafeExternalHref("data:text/html,<html>")).toBe(null);
      expect(getSafeExternalHref("not a url")).toBe(null);
      expect(getSafeExternalHref("")).toBe(null);
    });

    it("generates searchable text combining name, tag, id, leaders, and top members", () => {
      const searchText = getSearchText(mockGuildA);
      expect(searchText).toContain("101");
      expect(searchText).toContain("iron vanguard");
      expect(searchText).toContain("iv");
      expect(searchText).toContain("ares");
      expect(searchText).toContain("athena");
      expect(searchText).toContain("spartan");
      expect(searchText).toContain("gladiator");
    });

    it("generates deduplicated detail URLs", () => {
      const urls = getGuildDetailUrls([mockGuildA, mockGuildB, mockGuildA]);
      expect(urls).toEqual([
        "/guild-details/101.json",
        "/guild-details/202.json",
      ]);
    });

    it("parses cache progress safely with fallbacks", () => {
      expect(readCacheProgress({ cached: 5, failed: 1, total: 10 })).toEqual({
        cached: 5,
        failed: 1,
        total: 10,
      });
      expect(readCacheProgress(null)).toEqual({
        cached: 0,
        failed: 0,
        total: 0,
      });
      expect(readCacheProgress({})).toEqual({
        cached: 0,
        failed: 0,
        total: 0,
      });
    });
  });

  describe("Sorting, Tiers & Comparison Invariance", () => {
    it("sorts guilds by activity score desc", () => {
      expect(compareGuilds(mockGuildA, mockGuildB, "activity")).toBeLessThan(0);
      expect(compareGuilds(mockGuildB, mockGuildA, "activity")).toBeGreaterThan(0);
    });

    it("sorts guilds by season rank asc (lower rank number is better)", () => {
      expect(compareGuilds(mockGuildA, mockGuildB, "season")).toBeLessThan(0);
      expect(compareGuilds(mockGuildB, mockGuildA, "season")).toBeGreaterThan(0);
    });

    it("sorts guilds by level desc", () => {
      expect(compareGuilds(mockGuildA, mockGuildB, "level")).toBeLessThan(0);
      expect(compareGuilds(mockGuildB, mockGuildA, "level")).toBeGreaterThan(0);
    });

    it("sorts guilds by member count desc", () => {
      // Guild B has 35 members vs Guild A's 28
      expect(compareGuilds(mockGuildB, mockGuildA, "members")).toBeLessThan(0);
    });

    it("sorts guilds by marks desc", () => {
      expect(compareGuilds(mockGuildA, mockGuildB, "marks")).toBeLessThan(0);
    });

    it("sorts guilds by name alphabetically asc", () => {
      expect(compareGuilds(mockGuildA, mockGuildB, "name")).toBeLessThan(0);
    });

    it("sorts guilds by id asc", () => {
      expect(compareGuilds(mockGuildA, mockGuildB, "id")).toBeLessThan(0);
    });

    it("preserves all sort options and tier filters", () => {
      expect(SORT_OPTIONS.map((opt) => opt.id)).toEqual([
        "activity",
        "season",
        "level",
        "members",
        "marks",
        "name",
        "id",
      ]);

      expect(TIER_FILTERS.map((f) => f.id)).toEqual(["all", "hot", "warm", "cold"]);
      expect(GUILD_TIER_LABELS.hot).toBe("Active");
      expect(GUILD_TIER_LABELS.warm).toBe("Tracked");
      expect(GUILD_TIER_LABELS.cold).toBe("Archive");
    });
  });

  describe("Guild Formatting Functions", () => {
    it("formats guild numbers with commas and handles fallbacks", () => {
      expect(formatGuildNumber(15400)).toBe("15,400");
      expect(formatGuildNumber(0)).toBe("0");
      expect(formatGuildNumber(null)).toBe("-");
      expect(formatGuildNumber(undefined)).toBe("-");
    });

    it("formats guild positions cleanly", () => {
      expect(formatGuildPosition("Leader")).toBe("Leader");
      expect(formatGuildPosition(null)).toBe("Member");
      expect(formatGuildPosition("")).toBe("Member");
    });

    it("generates IdleMMO profile URL", () => {
      expect(getIdleMmoProfileUrl("Gh0st")).toBe("https://web.idle-mmo.com/@Gh0st");
    });

    it("formats guild age gracefully", () => {
      expect(formatGuildAge(null)).toBe("Unknown");
      expect(formatGuildAge("invalid")).toBe("Unknown");
      // Current date should format as seconds or minutes ago
      expect(formatGuildAge(new Date().toISOString())).toMatch(/ago|just now/i);
    });
  });
});
