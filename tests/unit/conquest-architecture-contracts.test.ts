import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";
import {
  getFilterEmptyLabel,
  getLeaderMargin,
  getLeaderShare,
  getPressureLabel,
  getPressureTone,
  getXpPerKill,
  zoneMatchesFilter,
  zoneMatchesSearch,
} from "../../src/app/conquest/types";
import {
  formatAssaultCountdown,
  getConquestExpShardReward,
  getConquestRulerTier,
  type ConquestZone,
} from "../../src/lib/conquest";

function createMockZone(overrides: Partial<ConquestZone> = {}): ConquestZone {
  return {
    id: 1,
    key: "verdant_fields",
    name: "Verdant Fields",
    image_url: null,
    status: "CONTESTED",
    colour: "#22c55e",
    experience: 10000,
    kills: 500,
    leaderboard_count: 5,
    guilds_count: 10,
    contribution_count: 25,
    active_assaults_count: 0,
    active_assaults: [],
    guild_leaderboard: [
      {
        position: 1,
        experience: 6000,
        kills: 300,
        guild: { id: 1, name: "Alpha Guild", tag: "ALP", icon_url: null, background_url: null },
      },
      {
        position: 2,
        experience: 4000,
        kills: 200,
        guild: { id: 2, name: "Beta Guild", tag: "BET", icon_url: null, background_url: null },
      },
    ],
    top_contributors: [
      {
        id: 1,
        guild_conquest_progress_id: 10,
        experience: 2500,
        kills: 120,
        character: { name: "WarriorBob", total_level: 850, image_url: null, background_url: null },
        guild: { id: 1, name: "Alpha Guild", tag: "ALP", icon_url: null, background_url: null },
      },
    ],
    ...overrides,
  };
}

describe("Conquest Architecture & Math Contracts", () => {
  describe("zoneMatchesFilter", () => {
    it("filters correctly for all, active, contested, and dominated", () => {
      const activeZone = createMockZone({ active_assaults_count: 2 });
      const contestedZone = createMockZone({ status: "CONTESTED", active_assaults_count: 0 });
      const dominatedZone = createMockZone({ status: "DOMINATED", active_assaults_count: 0 });

      expect(zoneMatchesFilter(activeZone, "all")).toBe(true);
      expect(zoneMatchesFilter(activeZone, "active")).toBe(true);
      expect(zoneMatchesFilter(contestedZone, "active")).toBe(false);

      expect(zoneMatchesFilter(contestedZone, "contested")).toBe(true);
      expect(zoneMatchesFilter(dominatedZone, "contested")).toBe(false);

      expect(zoneMatchesFilter(dominatedZone, "dominated")).toBe(true);
      expect(zoneMatchesFilter(contestedZone, "dominated")).toBe(false);
    });
  });

  describe("zoneMatchesSearch", () => {
    it("matches query against zone name, key, guild tag, and contributor name", () => {
      const zone = createMockZone();
      expect(zoneMatchesSearch(zone, "")).toBe(true);
      expect(zoneMatchesSearch(zone, "verdant")).toBe(true);
      expect(zoneMatchesSearch(zone, "alpha")).toBe(true);
      expect(zoneMatchesSearch(zone, "bet")).toBe(true);
      expect(zoneMatchesSearch(zone, "warriorbob")).toBe(true);
      expect(zoneMatchesSearch(zone, "nonexistent999")).toBe(false);
    });
  });

  describe("Conquest Zone Calculations", () => {
    it("calculates leader share accurately", () => {
      const zone = createMockZone({
        experience: 10000,
        guild_leaderboard: [
          { position: 1, experience: 8000, kills: 400, guild: null },
        ],
      });
      expect(getLeaderShare(zone)).toBe(80);
    });

    it("calculates leader margin accurately", () => {
      const zone = createMockZone({
        guild_leaderboard: [
          { position: 1, experience: 7500, kills: 300, guild: null },
          { position: 2, experience: 2500, kills: 100, guild: null },
        ],
      });
      expect(getLeaderMargin(zone)).toBe(5000);
    });

    it("calculates xp per kill accurately", () => {
      const zone = createMockZone({ experience: 10000, kills: 500 });
      expect(getXpPerKill(zone)).toBe(20);

      const zeroKillZone = createMockZone({ experience: 10000, kills: 0 });
      expect(getXpPerKill(zeroKillZone)).toBeNull();
    });

    it("evaluates pressure labels and tones according to threat level", () => {
      const attackZone = createMockZone({ active_assaults_count: 1 });
      expect(getPressureLabel(attackZone)).toBe("Under attack");
      expect(getPressureTone(attackZone)).toBe("hot");

      const contestedZone = createMockZone({ status: "CONTESTED", active_assaults_count: 0 });
      expect(getPressureLabel(contestedZone)).toBe("Contested");
      expect(getPressureTone(contestedZone)).toBe("warn");

      const controlledZone = createMockZone({
        status: "DOMINATED",
        active_assaults_count: 0,
        experience: 10000,
        guild_leaderboard: [{ position: 1, experience: 9800, kills: 400, guild: null }],
      });
      expect(getPressureLabel(controlledZone)).toBe("Controlled");
      expect(getPressureTone(controlledZone)).toBe("calm");
    });
  });

  describe("Modular File Architecture", () => {
    it("page.tsx is a lean orchestrator with under 150 lines", () => {
      const pagePath = join(process.cwd(), "src/app/conquest/page.tsx");
      expect(existsSync(pagePath)).toBe(true);
      const content = readFileSync(pagePath, "utf-8");
      const lines = content.split("\n");
      expect(lines.length).toBeLessThan(150);
    });

    it("all decomposed subcomponents and hooks exist", () => {
      const expectedFiles = [
        "src/app/conquest/types.ts",
        "src/app/conquest/hooks/useConquestState.ts",
        "src/app/conquest/components/ConquestRows.tsx",
        "src/app/conquest/components/ConquestHero.tsx",
        "src/app/conquest/components/ConquestToolbar.tsx",
        "src/app/conquest/components/ConquestZoneGrid.tsx",
        "src/app/conquest/components/ConquestDetailPanel.tsx",
        "src/app/conquest/components/ConquestGlobalLeaders.tsx",
        "src/app/conquest/components/ConquestRewardsModal.tsx",
      ];

      for (const file of expectedFiles) {
        const filePath = join(process.cwd(), file);
        expect(existsSync(filePath)).toBe(true);
      }
    });

    it("enforces clean migrated route architecture (no StateBlock, no direct lucide-react)", () => {
      assertCleanMigratedRoute({
        routeSubpath: "conquest",
        maxPageLines: 150,
        allowStateBlock: false,
        allowDirectLucide: false,
      });
    });

    it("maps territory ruler buffs, shard rewards, and assault countdowns accurately", () => {
      expect(getConquestRulerTier(1)?.primaryExpPercent).toBe(25);
      expect(getConquestRulerTier(5)?.primaryExpPercent).toBe(7);
      expect(getConquestRulerTier(10)?.primaryEffPercent).toBe(2);
      expect(getConquestRulerTier(11)).toBeNull();

      expect(getConquestExpShardReward(1)).toBe(20000);
      expect(getConquestExpShardReward(15)).toBe(1000);
      expect(getConquestExpShardReward(26)).toBe(0);

      expect(formatAssaultCountdown(null)).toBeNull();
      expect(formatAssaultCountdown("2020-01-01T00:00:00Z")).toBe("Ended");
    });
  });
});
