import { describe, it, expect } from "vitest";
import {
  getAssaultBuff,
  ASSAULT_OPTIONS,
  getBuffTotals,
  type AssaultRank,
  type SkillProfitSettings,
} from "@/lib/skill-profit";

describe("Regional Conquest Assault Buffs Alignment (v0.84.0 Rework)", () => {
  it("returns correct buff multipliers for all ranks including reworked 50% values", () => {
    expect(getAssaultBuff("none")).toEqual({
      exp: 0,
      efficiency: 0,
      label: "No conquest buff",
    });

    expect(getAssaultBuff("first")).toEqual({
      exp: 25,
      efficiency: 5,
      label: "1st Place (+25% EXP, +5% Eff)",
    });

    expect(getAssaultBuff("second")).toEqual({
      exp: 17,
      efficiency: 5,
      label: "2nd Place (+17% EXP, +5% Eff)",
    });

    expect(getAssaultBuff("third")).toEqual({
      exp: 13,
      efficiency: 5,
      label: "3rd Place (+13% EXP, +5% Eff)",
    });

    expect(getAssaultBuff("fourth")).toEqual({
      exp: 10,
      efficiency: 3,
      label: "4th Place (+10% EXP, +3% Eff)",
    });

    expect(getAssaultBuff("fifthSeventh")).toEqual({
      exp: 7,
      efficiency: 3,
      label: "5th-7th (+7% EXP, +3% Eff)",
    });

    // Backward compatibility for legacy fourthSeventh
    expect(getAssaultBuff("fourthSeventh")).toEqual({
      exp: 7,
      efficiency: 3,
      label: "5th-7th (+7% EXP, +3% Eff)",
    });

    expect(getAssaultBuff("eighthTenth")).toEqual({
      exp: 3,
      efficiency: 2,
      label: "8th-10th (+3% EXP, +2% Eff)",
    });

    // Defaults to none for null/undefined or unknown string
    expect(getAssaultBuff(null)).toEqual(getAssaultBuff("none"));
    expect(getAssaultBuff(undefined)).toEqual(getAssaultBuff("none"));
    expect(getAssaultBuff("invalid" as AssaultRank)).toEqual(getAssaultBuff("none"));
  });

  it("filters out legacy alias fourthSeventh from ASSAULT_OPTIONS dropdown list", () => {
    const keys = ASSAULT_OPTIONS.map((opt) => opt.value);
    expect(keys).toContain("none");
    expect(keys).toContain("first");
    expect(keys).toContain("second");
    expect(keys).toContain("third");
    expect(keys).toContain("fourth");
    expect(keys).toContain("fifthSeventh");
    expect(keys).toContain("eighthTenth");
    expect(keys).not.toContain("fourthSeventh");
    expect(keys).toHaveLength(7);
  });

  it("applies conquest bonuses accurately in getBuffTotals", () => {
    const baseSettings: SkillProfitSettings = {
      membership: false,
      classBonus: false,
      profileClassName: undefined,
      assaultRank: "first",
      energizingPoolExp: 0,
      ascensionBuffIds: [],
      tools: { Woodcutting: "", Mining: "", Fishing: "" },
      barteringBoost: 0,
    };

    const firstPlaceTotals = getBuffTotals(baseSettings, false, "Woodcutting");
    // 1st place: 25% exp, 5% efficiency
    expect(firstPlaceTotals.efficiency).toBe(5);
    expect(firstPlaceTotals.experience).toBe(25);

    const secondPlaceTotals = getBuffTotals(
      { ...baseSettings, assaultRank: "second" },
      false,
      "Mining"
    );
    expect(secondPlaceTotals.efficiency).toBe(5);
    expect(secondPlaceTotals.experience).toBe(17);

    const fourthPlaceTotals = getBuffTotals(
      { ...baseSettings, assaultRank: "fourth" },
      false,
      "Cooking"
    );
    expect(fourthPlaceTotals.efficiency).toBe(3);
    expect(fourthPlaceTotals.experience).toBe(10);

    const fifthPlaceTotals = getBuffTotals(
      { ...baseSettings, assaultRank: "fifthSeventh" },
      false,
      "Smelting"
    );
    expect(fifthPlaceTotals.efficiency).toBe(3);
    expect(fifthPlaceTotals.experience).toBe(7);

    const legacyTotals = getBuffTotals(
      { ...baseSettings, assaultRank: "fourthSeventh" },
      false,
      "Smelting"
    );
    expect(legacyTotals.efficiency).toBe(3);
    expect(legacyTotals.experience).toBe(7);
  });
});
