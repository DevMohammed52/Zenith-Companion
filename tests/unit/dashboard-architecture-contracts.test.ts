import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_NAV_ITEMS } from "@/lib/navigation";
import {
  buildToolDirectoryGroups,
  DEFAULT_INDEXED_ITEMS_COUNT,
  DEFAULT_PERSISTED_SKILL_PROFIT,
  DELAYED_THRESHOLD_MINUTES,
  deriveLiveBossPulse,
  formatAge,
  formatBossCountdown,
  getRankedProfitPerHour,
  getTotalDashboardToolCount,
  MODULE_GROUPS,
  PET_SPECIES_COUNT,
  SKILL_PROFIT_STORAGE_KEY,
  type WorldBossSummary,
} from "../../src/app/types";
import type { SkillProfitRow } from "@/lib/skill-profit";

describe("Dashboard Architecture & Helper Contracts", () => {
  describe("formatAge helper invariance", () => {
    it("handles null and non-finite values safely", () => {
      expect(formatAge(null)).toBe("Waiting");
      expect(formatAge(Number.NaN)).toBe("Waiting");
      expect(formatAge(Number.POSITIVE_INFINITY)).toBe("Waiting");
    });

    it("formats recent minutes correctly", () => {
      expect(formatAge(0)).toBe("Just now");
      expect(formatAge(0.5)).toBe("Just now");
      expect(formatAge(1)).toBe("1m ago");
      expect(formatAge(45)).toBe("45m ago");
      expect(formatAge(59)).toBe("59m ago");
    });

    it("formats hours and minutes cleanly", () => {
      expect(formatAge(60)).toBe("1h ago");
      expect(formatAge(90)).toBe("1h 30m ago");
      expect(formatAge(150)).toBe("2h 30m ago");
      expect(formatAge(180)).toBe("3h ago");
    });
  });

  describe("getRankedProfitPerHour helper invariance", () => {
    const baseRow: SkillProfitRow = {
      name: "Oak Log",
      skill: "Woodcutting",
      level: 1,
      baseDuration: 6,
      experience: 10,
      ingredients: [],
      salePrice: 20,
      vendorPrice: 5,
      marketPrice: 20,
      marketVolume: 500,
      stablePrice3d: 20,
      stableVolume3d: 500,
      isTradeable: true,
      isLiquid: true,
      efficiencyBoost: 0,
      effectiveDuration: 6,
      actionsPerHour: 600,
      expPerHour: 6000,
      vendorProfitPerHour: 3000,
      marketProfitPerHour: 11400,
      profitPerHour: 11400,
      bestSaleSource: "market",
      saleSource: "market",
      usedPrice: 20,
      priceSource: "market",
      dropQuantity: 1,
      essenceActive: false,
      essenceNeedsPrice: false,
      baseProfitPerHour: 11400,
      profitWithEssencePerHour: null,
      essenceName: "",
      essenceCostPerHour: 0,
      essenceBuffEfficiency: 0,
    } as unknown as SkillProfitRow;

    it("returns standard profitPerHour when essence is inactive", () => {
      expect(getRankedProfitPerHour(baseRow)).toBe(11400);
    });

    it("returns profitWithEssencePerHour when essence is active and calculated", () => {
      const essenceRow: SkillProfitRow = {
        ...baseRow,
        essenceActive: true,
        profitWithEssencePerHour: 14500,
      };
      expect(getRankedProfitPerHour(essenceRow)).toBe(14500);
    });

    it("falls back to baseProfitPerHour when essence is active but missing price", () => {
      const essenceNeedsPriceRow: SkillProfitRow = {
        ...baseRow,
        essenceActive: true,
        essenceNeedsPrice: true,
        profitWithEssencePerHour: null,
        baseProfitPerHour: 10000,
      };
      expect(getRankedProfitPerHour(essenceNeedsPriceRow)).toBe(10000);
    });
  });

  describe("Sustainable NAV_GROUPS Directory & Boss Countdown Helpers", () => {
    it("automatically includes every non-root route from NAV_GROUPS in buildToolDirectoryGroups", () => {
      const groups = buildToolDirectoryGroups(["/bis", "/alchemy"]);
      const builtHrefs = new Set(groups.flatMap((g) => g.items.map((i) => i.href)));
      const expectedHrefs = ALL_NAV_ITEMS.filter((item) => item.href !== "/").map((item) => item.href);

      expect(getTotalDashboardToolCount()).toBe(expectedHrefs.length);
      for (const href of expectedHrefs) {
        expect(builtHrefs.has(href)).toBe(true);
      }

      const bisItem = groups.flatMap((g) => g.items).find((i) => i.href === "/bis");
      expect(bisItem?.isRecent).toBe(true);
    });

    it("formats upcoming and live world boss countdowns safely", () => {
      const baseNow = Date.UTC(2026, 10, 27, 12, 0, 0);
      expect(formatBossCountdown("2026-11-27T12:15:30Z", baseNow).label).toBe("In 15m 30s");
      expect(formatBossCountdown("2026-11-27T11:55:00Z", baseNow).label).toBe("Active now");

      const bosses: WorldBossSummary[] = [
        {
          id: 1,
          name: "Isadora",
          level: 1,
          location: { id: 1, name: "Bluebell Hollow" },
          status: "UPCOMING",
          battle_starts_at: "2026-11-27T13:30:00Z",
        },
        {
          id: 2,
          name: "Vorgath",
          level: 85,
          location: { id: 8, name: "Obsidian Reach" },
          status: "READY_FOR_LOBBY",
          battle_starts_at: "2026-11-27T11:58:00Z",
          battle_ends_at: "2026-11-27T12:20:00Z",
        },
      ];

      const pulse = deriveLiveBossPulse(bosses, baseNow);
      expect(pulse?.name).toBe("Vorgath");
      expect(pulse?.isActiveNow).toBe(true);
      expect(pulse?.countdownLabel).toBe("Live now");
    });
  });

  describe("Module Groups & Storage Constants Invariance", () => {
    it("defines valid constants and default persisted state", () => {
      expect(SKILL_PROFIT_STORAGE_KEY).toBe("zenith_skill_profit_finder");
      expect(DEFAULT_INDEXED_ITEMS_COUNT).toBe(1353);
      expect(PET_SPECIES_COUNT).toBe(47);
      expect(DELAYED_THRESHOLD_MINUTES).toBeGreaterThan(0);
      expect(DEFAULT_PERSISTED_SKILL_PROFIT.saleMode).toBe("best");
      expect(DEFAULT_PERSISTED_SKILL_PROFIT.minVolume).toBe(100);
    });

    it("exposes all 4 module groups with complete links", () => {
      expect(MODULE_GROUPS).toHaveLength(4);
      const titles = MODULE_GROUPS.map((g) => g.title);
      expect(titles).toEqual(["Economy", "Character", "World & Encounters", "Guild & Archive"]);

      for (const group of MODULE_GROUPS) {
        expect(group.links.length).toBeGreaterThanOrEqual(4);
        for (const link of group.links) {
          expect(link.href.startsWith("/")).toBe(true);
          expect(link.label.trim().length).toBeGreaterThan(0);
          expect(link.icon).toBeTruthy();
        }
      }
    });
  });

  describe("Modular File Architecture & Migrated Standards", () => {
    it("page.tsx is a lean orchestrator under 100 lines using page.module.css", () => {
      const pagePath = join(process.cwd(), "src/app/page.tsx");
      expect(existsSync(pagePath)).toBe(true);
      const content = readFileSync(pagePath, "utf-8");
      const lines = content.split("\n");
      expect(lines.length).toBeLessThan(100);
      expect(content).toContain("page.module.css");
    });

    it("all decomposed subcomponents, CSS module, types, and hooks exist without legacy imports", () => {
      const expectedFiles = [
        "src/app/types.ts",
        "src/app/page.module.css",
        "src/app/hooks/useDashboardState.ts",
        "src/app/components/DashboardHero.tsx",
        "src/app/components/DashboardSetupReminder.tsx",
        "src/app/components/DashboardPriorityTools.tsx",
        "src/app/components/DashboardQuickLinks.tsx",
        "src/app/components/DashboardModuleGrid.tsx",
        "src/app/components/index.ts",
      ];

      for (const file of expectedFiles) {
        const filePath = join(process.cwd(), file);
        expect(existsSync(filePath), `Missing ${file}`).toBe(true);
        if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          const text = readFileSync(filePath, "utf-8");
          expect(text).not.toMatch(/from\s+["']lucide-react["']/);
          expect(text).not.toContain("@/components/StateBlock");
          expect(text).not.toMatch(/<style\s+jsx/);
        }
      }
    });
  });
});
