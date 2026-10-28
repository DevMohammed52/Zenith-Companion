import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  LIVE_IMPORT_STEPS,
  formatWaitTime,
  getPollAfterMs,
  getRetryAfterMs,
  isRecord,
  resolveLiveImportStep,
} from "@/app/profiles/page";
import {
  ascensionLevel,
  dailyStreakMagicFind,
} from "@/lib/profile-calculations";
import {
  currentUtcResetDate,
  daysBetweenUtcDates,
  updateMagicFindFromStreak,
  profilePetSnapshotKey,
} from "@/app/profiles/hooks/useProfileState";
import { numberFromInput, formatFieldSourceLabel } from "@/app/profiles/components/ProfileControls";
import { getSkillInputLevel } from "@/app/profiles/components/ProfileSkillsSection";
import { formatProfileSourceMode } from "@/app/profiles/components/ProfileLiveImportModal";
import { formatShortStats, formatItemEffects } from "@/app/profiles/components/ProfileGearSection";

describe("profiles architecture and modularization contracts", () => {
  const profilesDir = path.join(process.cwd(), "src", "app", "profiles");
  const pagePath = path.join(profilesDir, "page.tsx");
  const componentsDir = path.join(profilesDir, "components");
  const hooksDir = path.join(profilesDir, "hooks");

  it("orchestrator page.tsx is strictly under 250 lines", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(250);
  });

  it("exports dedicated custom hooks", () => {
    expect(existsSync(path.join(hooksDir, "useProfileState.ts"))).toBe(true);
    expect(existsSync(path.join(hooksDir, "useLiveProfileImport.ts"))).toBe(true);
  });

  it("contains all required feature and section components", () => {
    const requiredComponents = [
      "ProfileControls.tsx",
      "ProfileHeader.tsx",
      "ProfileLiveImportModal.tsx",
      "ProfileBackupModal.tsx",
      "ProfileLevelsSection.tsx",
      "ProfileSkillsSection.tsx",
      "ProfileCombatSection.tsx",
      "ProfileGearSection.tsx",
      "ProfilePetSection.tsx",
      "ProfileIdentitySection.tsx",
      "ProfileMagicSection.tsx",
      "ProfileHousingSection.tsx",
      "ProfilesLoadingShell.tsx",
    ];
    for (const comp of requiredComponents) {
      expect(existsSync(path.join(componentsDir, comp)), `Missing component: ${comp}`).toBe(true);
    }
  });

  it("orchestrator defines layout containment and min-height to guarantee CLS <= 0.1", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('contain: "layout"');
    expect(pageContent).toMatch(/minHeight:\s*["']560px["']/);
  });

  it("preserves backward-compatible helper exports on page.tsx", () => {
    expect(typeof isRecord).toBe("function");
    expect(typeof formatWaitTime).toBe("function");
    expect(typeof getRetryAfterMs).toBe("function");
    expect(typeof getPollAfterMs).toBe("function");
    expect(typeof resolveLiveImportStep).toBe("function");
    expect(Array.isArray(LIVE_IMPORT_STEPS)).toBe(true);
    expect(LIVE_IMPORT_STEPS.length).toBe(4);
    expect(LIVE_IMPORT_STEPS.map((s) => s.key)).toEqual([
      "root_baseline",
      "account_museum",
      "alt_characters",
      "final_assembly",
    ]);
  });

  describe("live import helper logic contracts", () => {
    it("isRecord correctly validates record types", () => {
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord([])).toBe(false);
      expect(isRecord("str")).toBe(false);
      expect(isRecord(42)).toBe(false);
      expect(isRecord({})).toBe(true);
      expect(isRecord({ foo: "bar" })).toBe(true);
    });

    it("formatWaitTime properly scales seconds and minutes", () => {
      expect(formatWaitTime()).toBe("");
      expect(formatWaitTime(0)).toBe("");
      expect(formatWaitTime(-100)).toBe("");
      expect(formatWaitTime(15000)).toBe("15 sec");
      expect(formatWaitTime(59000)).toBe("59 sec");
      expect(formatWaitTime(60000)).toBe("1 min");
      expect(formatWaitTime(125000)).toBe("3 min");
    });

    it("getRetryAfterMs extracts explicit numeric cooldowns", () => {
      expect(getRetryAfterMs(null)).toBeNull();
      expect(getRetryAfterMs({ retryAfterMs: 30000 })).toBe(30000);
      expect(getRetryAfterMs({ pollAfterMs: 2000 })).toBeNull();
    });

    it("getPollAfterMs honors defaultMs and extracts payload pollAfterMs", () => {
      expect(getPollAfterMs(null)).toBe(3500);
      expect(getPollAfterMs(null, 5000)).toBe(5000);
      expect(getPollAfterMs({ pollAfterMs: 2000 })).toBe(2000);
    });

    it("resolveLiveImportStep correctly maps steps and statuses", () => {
      const step1 = resolveLiveImportStep({ stepIndex: 1, stepTotal: 4 }, "running");
      expect(step1.step).toBe("root_baseline");
      expect(step1.stepIndex).toBe(1);
      expect(step1.badge).toBe("Step 1 of 4: Reading root character");

      const doneStep = resolveLiveImportStep(null, "done");
      expect(doneStep.step).toBe("final_assembly");
      expect(doneStep.stepIndex).toBe(4);
      expect(doneStep.detail).toBe("Profile assembled and ready to save.");
    });
  });

  describe("game math and calculation invariance", () => {
    it("preserves ascensionLevel calculation", () => {
      expect(ascensionLevel(100)).toBe(0);
      expect(ascensionLevel(101)).toBe(1);
      expect(ascensionLevel(250)).toBe(150);
      expect(ascensionLevel("")).toBe(0);
      expect(ascensionLevel(0)).toBe(0);
    });

    it("preserves dailyStreakMagicFind scaling and 10% cap", () => {
      expect(dailyStreakMagicFind(0)).toBe(0);
      expect(dailyStreakMagicFind(9)).toBe(0);
      expect(dailyStreakMagicFind(10)).toBe(1);
      expect(dailyStreakMagicFind(50)).toBe(5);
      expect(dailyStreakMagicFind(100)).toBe(10);
      expect(dailyStreakMagicFind(200)).toBe(10);
    });

    it("preserves updateMagicFindFromStreak auto-advancement logic", () => {
      const initial = {
        combat: 0,
        dungeon: 2,
        worldBoss: 15, // manual override higher than bonus
        dailyStreak: 0,
        dailyStreakLastAutoDate: "2026-10-01",
      };

      const updated = updateMagicFindFromStreak(initial, 20); // 20 days -> +2% bonus
      expect(updated.dailyStreak).toBe(20);
      expect(updated.combat).toBe(2); // 0 bumped to 2
      expect(updated.dungeon).toBe(2); // 2 stays 2
      expect(updated.worldBoss).toBe(15); // manual override > 2 preserved!
      expect(updated.dailyStreakLastAutoDate).toBe(currentUtcResetDate());
    });

    it("preserves daysBetweenUtcDates difference calculations", () => {
      expect(daysBetweenUtcDates("2026-10-01", "2026-10-05")).toBe(4);
      expect(daysBetweenUtcDates("2026-10-05", "2026-10-01")).toBe(0);
      expect(daysBetweenUtcDates("2026-10-01", "2026-10-01")).toBe(0);
    });

    it("preserves profilePetSnapshotKey formatting", () => {
      expect(profilePetSnapshotKey({ species: "Fire Dragon", level: 50, evolution: 2 }))
        .toBe("fire dragon::50::2");
      expect(profilePetSnapshotKey({ species: "Wolf", level: 1, evolution: 0 }))
        .toBe("wolf::1::");
    });

    it("preserves getSkillInputLevel resolution", () => {
      const skills = {
        woodcutting: { level: 85, experience: "" as const },
        "guild-mastery": { level: 25, experience: "" as const },
      };
      expect(getSkillInputLevel(skills, "woodcutting")).toBe(85);
      expect(getSkillInputLevel(skills, "guild_mastery")).toBe(25);
      expect(getSkillInputLevel(skills, "mining")).toBe("");
      expect(getSkillInputLevel(undefined, "woodcutting")).toBe("");
    });

    it("preserves helper formatting utilities", () => {
      expect(numberFromInput("")).toBe("");
      expect(numberFromInput("42")).toBe(42);

      expect(formatFieldSourceLabel("imported")).toBe("Imported");
      expect(formatFieldSourceLabel("calculated")).toBe("Calculated");
      expect(formatFieldSourceLabel("manual")).toBe("Manual");

      expect(formatProfileSourceMode("imported")).toBe("Imported");
      expect(formatProfileSourceMode("mixed")).toBe("Mixed");
      expect(formatProfileSourceMode("manual")).toBe("Manual");

      expect(formatShortStats({ attackPower: 10, protection: 5, speed: 0 })).toBe("Attack Power 10 / Protection 5");
      expect(formatShortStats({})).toBe("");

      const effects = [
        { target: "combat", attribute: "magic_find", value: 5, value_type: "percentage" },
      ];
      expect(formatItemEffects(effects)).toBe("combat MF +5%");
    });
  });
});
