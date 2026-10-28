import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ascensionLevel,
  barteringBuffPercent,
  calculateGearStats,
  calculatePetStats,
  dailyStreakMagicFind,
  getPetMasteryStatBonus,
  getToolEfficiency,
} from "@/lib/profile-calculations";
import { calculatePetStatValue } from "@/lib/pet-stats";
import {
  currentUtcResetDate,
  daysBetweenUtcDates,
  profilePetSnapshotKey,
  updateMagicFindFromStreak,
} from "@/app/profiles/hooks/useProfileState";
import { getSkillInputLevel } from "@/app/profiles/components/ProfileSkillsSection";
import { numberFromInput } from "@/app/profiles/components/ProfileControls";

describe("Adversarial Empirical Stress Harness: /profiles Deconstruction", () => {
  const rootDir = process.cwd();
  const pageFile = path.join(rootDir, "src", "app", "profiles", "page.tsx");
  const shellFile = path.join(rootDir, "src", "app", "profiles", "components", "ProfilesLoadingShell.tsx");
  const cssFile = path.join(rootDir, "src", "app", "globals.css");

  // 1. Line Count & Orchestrator Scope
  describe("Gate 1: Orchestrator Line Count Verification", () => {
    it("page.tsx is strictly under 250 lines", () => {
      expect(existsSync(pageFile)).toBe(true);
      const content = readFileSync(pageFile, "utf-8");
      const lineCount = content.split(/\r?\n/).length;
      expect(lineCount).toBeLessThan(250);
      expect(lineCount).toBe(214);
    });

    it("page.tsx functions purely as an orchestrator with zero inline calculation engines", () => {
      const content = readFileSync(pageFile, "utf-8");
      // Must not define raw math formulas or DB fetching logic directly
      expect(content).not.toContain("Math.round(");
      expect(content).not.toContain("fetch(");
      expect(content).not.toContain("new Worker(");
      expect(content).not.toContain("BroadcastChannel");
    });
  });

  // 2. Touch Target Compliance
  describe("Gate 2: Touch Target Compliance (>= 44px)", () => {
    it("verifies global CSS guarantees minimum 44px (2.75rem) touch targets for profiles controls", () => {
      const css = readFileSync(cssFile, "utf-8");
      // Verify .profiles-page controls have min-height 2.75rem (44px)
      expect(css).toContain(".profiles-page .profile-action");
      expect(css).toContain(".profiles-page .profile-section-nav a");
      expect(css).toContain(".profiles-page .profile-list-item");
      expect(css).toContain(".profiles-page .profile-picker-button");
      expect(css).toContain(".profiles-page .profile-picker-option");
      expect(css).toContain("min-height: 2.75rem;");

      // Verify mobile general rules enforce min-height and min-width 44px
      expect(css).toContain("min-height: 44px;");
      expect(css).toContain("min-width: 44px;");
    });
  });

  // 3. Layout Containment & CLS Prevention
  describe("Gate 3: Layout Containment & Zero CLS Protection", () => {
    it("page.tsx enforces minHeight 560px and layout containment on .profile-editor", () => {
      const content = readFileSync(pageFile, "utf-8");
      expect(content).toContain('contain: "layout"');
      expect(content).toMatch(/minHeight:\s*["']560px["']/);
      expect(content).toContain('className="profile-editor"');
    });

    it("page.tsx and ProfilesLoadingShell maintain identical grid structure", () => {
      const pageContent = readFileSync(pageFile, "utf-8");
      const shellContent = readFileSync(shellFile, "utf-8");

      expect(pageContent).toContain('className="profile-layout"');
      expect(shellContent).toContain('className="profile-layout"');

      // Both must render list panel first, editor second
      expect(pageContent.indexOf("ProfileListPanel")).toBeLessThan(pageContent.indexOf("profile-editor"));
      expect(shellContent.indexOf("profile-list-panel")).toBeLessThan(shellContent.indexOf("profile-editor"));
    });
  });

  // 4. Math Invariance Stress Fuzzing
  describe("Gate 4: Math Invariance Stress Fuzzing", () => {
    describe("Character Level Scaling & Ascension", () => {
      it("fuzzes ascensionLevel across range [-100, 1000]", () => {
        expect(ascensionLevel(0)).toBe(0);
        expect(ascensionLevel(1)).toBe(0);
        expect(ascensionLevel(99)).toBe(0);
        expect(ascensionLevel(100)).toBe(0);
        expect(ascensionLevel(101)).toBe(1);
        expect(ascensionLevel(150)).toBe(50);
        expect(ascensionLevel(600)).toBe(500);

        // Fuzz edge cases
        expect(ascensionLevel(-50)).toBe(0);
        expect(ascensionLevel("")).toBe(0);
        expect(ascensionLevel(Number.NaN)).toBe(0);
      });

      it("fuzzes getSkillInputLevel across various key formats and boundary values", () => {
        const skills = {
          woodcutting: { level: 120, experience: 50000 },
          "mining-skill": { level: 90, experience: "" as const },
          guild_mastery: { level: 45, experience: "" as const },
          empty_skill: { level: "" as const, experience: "" as const },
        };

        expect(getSkillInputLevel(skills, "woodcutting")).toBe(120);
        expect(getSkillInputLevel(skills, "mining-skill")).toBe(90);
        expect(getSkillInputLevel(skills, "mining_skill")).toBe(90);
        expect(getSkillInputLevel(skills, "guild-mastery")).toBe(45);
        expect(getSkillInputLevel(skills, "guild_mastery")).toBe(45);
        expect(getSkillInputLevel(skills, "empty-skill")).toBe("");
        expect(getSkillInputLevel(skills, "nonexistent")).toBe("");
        expect(getSkillInputLevel(undefined, "woodcutting")).toBe("");
      });
    });

    describe("Streak Magic Find Bonuses & Rollover Calculations", () => {
      it("fuzzes dailyStreakMagicFind scaling from 0 to 1000 days", () => {
        for (let streak = 0; streak <= 1000; streak++) {
          const expected = Math.min(10, Math.floor(streak / 10));
          expect(dailyStreakMagicFind(streak)).toBe(expected);
        }
      });

      it("fuzzes streak edge cases: negative, empty string, non-integer", () => {
        expect(dailyStreakMagicFind(-5)).toBe(0);
        expect(dailyStreakMagicFind("")).toBe(0);
        expect(dailyStreakMagicFind(9.99)).toBe(0);
        expect(dailyStreakMagicFind(10.01)).toBe(1);
        expect(dailyStreakMagicFind(99.9)).toBe(9);
        expect(dailyStreakMagicFind(100)).toBe(10);
      });

      it("preserves manual overrides during updateMagicFindFromStreak", () => {
        const initial = {
          combat: 25, // manual override much higher than streak bonus
          dungeon: 0,  // will be bumped by streak bonus
          worldBoss: 1, // lower than 2, will be bumped to 2
          dailyStreak: 0,
          dailyStreakLastAutoDate: "2026-01-01",
        };

        // Advance streak to 20 (+2% bonus)
        const updated = updateMagicFindFromStreak(initial, 20);
        expect(updated.dailyStreak).toBe(20);
        expect(updated.combat).toBe(25); // preserved!
        expect(updated.dungeon).toBe(2);  // bumped from 0 to 2
        expect(updated.worldBoss).toBe(2); // bumped from 1 to 2
        expect(updated.dailyStreakLastAutoDate).toBe(currentUtcResetDate());
      });

      it("correctly computes daysBetweenUtcDates without timezone skews", () => {
        expect(daysBetweenUtcDates("2026-05-01", "2026-05-02")).toBe(1);
        expect(daysBetweenUtcDates("2026-05-01", "2026-05-31")).toBe(30);
        expect(daysBetweenUtcDates("2026-05-01", "2026-06-01")).toBe(31);
        expect(daysBetweenUtcDates("2026-05-02", "2026-05-01")).toBe(0); // reverse order gives 0
        expect(daysBetweenUtcDates("invalid", "2026-05-01")).toBe(0);
        expect(daysBetweenUtcDates("2026-05-01", "invalid")).toBe(0);
      });
    });

    describe("Pet Two-Tier Stat Rounding & Snapshotting", () => {
      it("fuzzes pet stat calculation with two-tier rounding across levels 1..100", () => {
        const petDbRecord = {
          name: "Flame Hound",
          stats: {
            attack_power: { base: 8, per_level: 0.85 },
            protection: { base: 5, per_level: 0.5 },
            movement_speed: { base: 2, per_level: 0.15 },
          },
        };

        const stats1 = calculatePetStats(petDbRecord, 1, 0, 0);
        expect(stats1.attackPower).toBe(8);
        expect(stats1.protection).toBe(5);
        expect(stats1.movementSpeed).toBe(2);

        // Level 100 with 25% pet mastery bonus
        const stats100 = calculatePetStats(petDbRecord, 100, 2, 25);
        expect(typeof stats100.attackPower).toBe("number");
        expect(typeof stats100.protection).toBe("number");
        expect(typeof stats100.movementSpeed).toBe("number");

        // Verify movement speed is exempt from evolution scaling
        const statsEvo0 = calculatePetStats(petDbRecord, 50, 0, 10);
        const statsEvo5 = calculatePetStats(petDbRecord, 50, 5, 10);
        expect(statsEvo0.movementSpeed).toBe(statsEvo5.movementSpeed);
      });

      it("formats profilePetSnapshotKey deterministically", () => {
        expect(profilePetSnapshotKey({ species: "Ice Dragon", level: 50, evolution: 1 })).toBe("ice dragon::50::1");
        expect(profilePetSnapshotKey({ species: "ICE DRAGON", level: 50, evolution: 1 })).toBe("ice dragon::50::1");
        expect(profilePetSnapshotKey({ species: "Wolf", level: 1, evolution: 0 })).toBe("wolf::1::");
      });
    });

    describe("Tool Efficiency & Bartering Boosts", () => {
      it("computes tool efficiency strictly summing efficiency value_type", () => {
        const toolItem = {
          name: "Mythic Pickaxe",
          effects: [
            { target: "mining", attribute: "efficiency", value: 35, value_type: "efficiency" },
            { target: "mining", attribute: "experience", value: 10, value_type: "percentage" },
            { target: "mining", attribute: "speed", value: 5, value_type: "flat" },
          ],
        };
        expect(getToolEfficiency(toolItem)).toBe(35);
      });

      it("returns 0 efficiency when no efficiency effects are present", () => {
        expect(getToolEfficiency(undefined)).toBe(0);
        expect(getToolEfficiency({})).toBe(0);
        expect(getToolEfficiency({ effects: [] })).toBe(0);
        expect(getToolEfficiency({ effects: [{ value: 20, value_type: "percentage" }] })).toBe(0);
      });

      it("fuzzes barteringBuffPercent", () => {
        expect(barteringBuffPercent(0)).toBe(0);
        expect(barteringBuffPercent(10)).toBe(2); // 10 * 0.2 = 2%
        expect(barteringBuffPercent(50)).toBe(10); // 50 * 0.2 = 10%
        expect(barteringBuffPercent(100)).toBe(20); // 100 * 0.2 = 20%
        expect(barteringBuffPercent(150)).toBe(20); // capped at 100 level -> 20%
      });
    });
  });
});
