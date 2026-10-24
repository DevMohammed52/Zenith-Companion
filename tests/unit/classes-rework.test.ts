import { describe, expect, it } from "vitest";
import { CLASS_DATA, getClassInfo } from "@/lib/profile-calculations";
import {
  API_CLASS_TO_PROFILE_CLASS,
  ASCENSION_SKILL_KEYS,
  normalizeApiClassName,
  normalizeIdleMmoProfileImport,
} from "@/lib/profile-import";
import {
  SKILL_CLASS_EFFECTS,
  getBuffTotals,
  type SkillProfitSettings,
} from "@/lib/skill-profit";

describe("Skilling Classes (v0.84.0-PB) Rework Verification Contracts", () => {
  describe("Gate 1: Class Name Normalization Contracts", () => {
    it("maps all 4 new skilling classes in API_CLASS_TO_PROFILE_CLASS", () => {
      expect(API_CLASS_TO_PROFILE_CLASS.ALCHEMIST).toBe("Alchemist");
      expect(API_CLASS_TO_PROFILE_CLASS.BLACKSMITH).toBe("Blacksmith");
      expect(API_CLASS_TO_PROFILE_CLASS.BUILDER).toBe("Builder");
      expect(API_CLASS_TO_PROFILE_CLASS.MONK).toBe("Monk");
    });

    it("normalizes diverse casing and hyphenation to standard profile class names", () => {
      expect(normalizeApiClassName("ALCHEMIST")).toBe("Alchemist");
      expect(normalizeApiClassName("alchemist")).toBe("Alchemist");
      expect(normalizeApiClassName("BLACKSMITH")).toBe("Blacksmith");
      expect(normalizeApiClassName("black-smith")).toBe("Blacksmith");
      expect(normalizeApiClassName("blacksmith")).toBe("Blacksmith");
      expect(normalizeApiClassName("BUILDER")).toBe("Builder");
      expect(normalizeApiClassName("builder")).toBe("Builder");
      expect(normalizeApiClassName("MONK")).toBe("Monk");
      expect(normalizeApiClassName("monk")).toBe("Monk");
    });

    it("preserves legacy classes unchanged", () => {
      expect(normalizeApiClassName("WARRIOR")).toBe("Warrior");
      expect(normalizeApiClassName("SHADOWBLADE")).toBe("Shadowblade");
      expect(normalizeApiClassName("RANGER")).toBe("Ranger");
      expect(normalizeApiClassName("MINER")).toBe("Miner");
      expect(normalizeApiClassName("ANGLER")).toBe("Angler");
      expect(normalizeApiClassName("CHEF")).toBe("Chef");
      expect(normalizeApiClassName("LUMBERJACK")).toBe("Lumberjack");
      expect(normalizeApiClassName("SMELTER")).toBe("Smelter");
      expect(normalizeApiClassName("BEASTMASTER")).toBe("Beastmaster");
      expect(normalizeApiClassName("BANISHED")).toBe("Banished");
      expect(normalizeApiClassName("FORSAKEN")).toBe("Forsaken");
      expect(normalizeApiClassName("CURSED")).toBe("Cursed");
    });

    it("normalizes imported profile drafts with the new classes", () => {
      const alchemistDraft = normalizeIdleMmoProfileImport({
        information: { character: { name: "Brewmaster", class: "ALCHEMIST" } },
      });
      expect(alchemistDraft.className).toBe("Alchemist");

      const blacksmithDraft = normalizeIdleMmoProfileImport({
        information: { character: { name: "AnvilLord", class: "BLACKSMITH" } },
      });
      expect(blacksmithDraft.className).toBe("Blacksmith");

      const builderDraft = normalizeIdleMmoProfileImport({
        information: { character: { name: "Mason", class: "BUILDER" } },
      });
      expect(builderDraft.className).toBe("Builder");

      const monkDraft = normalizeIdleMmoProfileImport({
        information: { character: { name: "ZenWalker", class: "MONK" } },
      });
      expect(monkDraft.className).toBe("Monk");
    });
  });

  describe("Gate 2: Profile Calculations & CLASS_DATA Registry", () => {
    it("contains all 4 new classes in CLASS_DATA under Skill category with official CDN skin icons", () => {
      const classIds = CLASS_DATA.map((c) => c.id);
      expect(classIds).toContain("Alchemist");
      expect(classIds).toContain("Blacksmith");
      expect(classIds).toContain("Builder");
      expect(classIds).toContain("Monk");

      const alchemist = getClassInfo("Alchemist");
      expect(alchemist.category).toBe("Skill");
      expect(alchemist.effects).toEqual(["+10% Alchemy Efficiency", "+10% Alchemy Experience"]);
      expect(alchemist.icon).toContain("01M3HW3QFMGFDPBFYK8AS3X36A.png");
      expect(alchemist.talents).toHaveLength(0);

      const blacksmith = getClassInfo("Blacksmith");
      expect(blacksmith.category).toBe("Skill");
      expect(blacksmith.effects).toEqual(["+10% Forge Efficiency", "+10% Forge Experience"]);
      expect(blacksmith.icon).toContain("01M3HW3FC686DQVC3KV7BMM36K.png");
      expect(blacksmith.talents).toHaveLength(0);

      const builder = getClassInfo("Builder");
      expect(builder.category).toBe("Skill");
      expect(builder.effects).toEqual(["+10% Construction Efficiency", "+10% Construction Experience"]);
      expect(builder.icon).toContain("01M3HW395D2NVHV85T1GABQ0EN.png");
      expect(builder.talents).toHaveLength(0);

      const monk = getClassInfo("Monk");
      expect(monk.category).toBe("Skill");
      expect(monk.effects).toEqual(["+10% Meditation Efficiency", "+10% Meditation Experience"]);
      expect(monk.icon).toContain("01M3HW311PD7KG83DPAZBRXWAY.png");
      expect(monk.talents).toHaveLength(0);
    });
  });

  describe("Gate 3: Skill Profit & Expected Value Math Invariance", () => {
    const baseSettings: SkillProfitSettings = {
      membership: false,
      classBonus: false,
      energizingPoolExp: 0,
      assaultRank: "none",
      ascensionBuffIds: [],
      tools: {
        Woodcutting: "",
        Mining: "",
        Fishing: "",
      },
      barteringBoost: 0,
    };

    it("maps new classes in SKILL_CLASS_EFFECTS with +10% Eff / +10% EXP", () => {
      expect(SKILL_CLASS_EFFECTS.Alchemist).toEqual({ skill: "Alchemy", exp: 10, efficiency: 10 });
      expect(SKILL_CLASS_EFFECTS.Blacksmith).toEqual({ skill: "Forge", exp: 10, efficiency: 10 });
      expect(SKILL_CLASS_EFFECTS.Builder).toEqual({ skill: "Construction", exp: 10, efficiency: 10 });
      expect(SKILL_CLASS_EFFECTS.Monk).toEqual({ skill: "Meditation", exp: 10, efficiency: 10 });
    });

    it("applies Alchemist buff specifically to Alchemy, but zero for other skills", () => {
      const alchemistSettings: SkillProfitSettings = {
        ...baseSettings,
        profileClassName: "Alchemist",
      };

      const alchemyBuffs = getBuffTotals(alchemistSettings, false, "Alchemy");
      expect(alchemyBuffs.efficiency).toBe(10);
      expect(alchemyBuffs.experience).toBe(10);

      const miningBuffs = getBuffTotals(alchemistSettings, false, "Mining");
      expect(miningBuffs.efficiency).toBe(0);
      expect(miningBuffs.experience).toBe(0);
    });

    it("applies Blacksmith buff specifically to Forge, but zero for other skills", () => {
      const blacksmithSettings: SkillProfitSettings = {
        ...baseSettings,
        profileClassName: "Blacksmith",
      };

      const forgeBuffs = getBuffTotals(blacksmithSettings, false, "Forge");
      expect(forgeBuffs.efficiency).toBe(10);
      expect(forgeBuffs.experience).toBe(10);

      const alchemyBuffs = getBuffTotals(blacksmithSettings, false, "Alchemy");
      expect(alchemyBuffs.efficiency).toBe(0);
      expect(alchemyBuffs.experience).toBe(0);
    });

    it("applies Builder buff specifically to Construction", () => {
      const builderSettings: SkillProfitSettings = {
        ...baseSettings,
        profileClassName: "Builder",
      };

      const constructionBuffs = getBuffTotals(builderSettings, false, "Construction");
      expect(constructionBuffs.efficiency).toBe(10);
      expect(constructionBuffs.experience).toBe(10);
    });

    it("supports generic classBonus toggle for Alchemy, Forge, and Construction", () => {
      const genericBonusSettings: SkillProfitSettings = {
        ...baseSettings,
        classBonus: true,
      };

      expect(getBuffTotals(genericBonusSettings, false, "Alchemy").efficiency).toBe(10);
      expect(getBuffTotals(genericBonusSettings, false, "Forge").efficiency).toBe(10);
      expect(getBuffTotals(genericBonusSettings, false, "Construction").efficiency).toBe(10);
      expect(getBuffTotals(genericBonusSettings, false, "Mining").efficiency).toBe(10);
    });
  });

  describe("Gate 4: Ascension Support Contracts", () => {
    it("includes meditation in ASCENSION_SKILL_KEYS", () => {
      expect(ASCENSION_SKILL_KEYS.has("meditation")).toBe(true);
      expect(ASCENSION_SKILL_KEYS.has("alchemy")).toBe(true);
      expect(ASCENSION_SKILL_KEYS.has("forge")).toBe(true);
      expect(ASCENSION_SKILL_KEYS.has("construction")).toBe(true);
    });
  });
});
