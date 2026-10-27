import { describe, expect, it } from "vitest";
import { createDefaultProfile, getProfileSkillLevel, type CharacterProfile } from "@/lib/profiles";
import type { SkillProfitRow, SkillName } from "@/lib/skill-profit";

function mockRow(name: string, skill: SkillName, level: number): SkillProfitRow {
  return {
    skill,
    name,
    level,
    baseDuration: 30,
    experience: 10,
    ingredients: [],
    salePrice: 100,
    saleSource: "market",
    marketRevenue: 88,
    vendorRevenue: 50,
    bestSaleSource: "market",
    netRevenue: 88,
    inputCost: 20,
    inputMissing: [],
    ingredientCosts: [],
    profitEach: 68,
    profitPerHour: 10_000,
    roi: 340,
    itemsPerHour: 120,
    expPerHour: 1200,
    expPerSecond: 0.33,
    finalDuration: 30,
    volume3d: 500,
    stableVolume3d: 500,
    isLiquid: true,
    excludedFromTop: false,
    toolBonus: 0,
    priceAdjusted: false,
    housingWindowHours: 0,
    itemsPerHousingWindow: 0,
    profitPerHousingWindow: 0,
    expPerHousingWindow: 0,
    baseFinalDuration: 30,
    baseItemsPerHour: 120,
    baseProfitPerHour: 10_000,
    essenceName: "",
    essenceActive: false,
    essenceEfficiencyBonus: 0,
    essenceExperienceBonus: 0,
    essenceCostPerStart: 0,
    essenceCostPerHour: null,
    essenceIdleActionHours: 8,
    essencePriceSource: "market",
    essencePriceAdjusted: false,
    essenceNeedsPrice: false,
    profitBeforeEssenceCostPerHour: 10_000,
    profitWithEssencePerHour: null,
    liquidityRisk: false,
    liquidityLabel: "Stable",
    liquidityNote: "",
    priceSwingRisk: false,
    priceSwingNote: "",
  };
}

describe("Skill Profit Route Level Filtering Contracts", () => {
  const mockProfile: CharacterProfile = {
    ...createDefaultProfile("Oak Test"),
    skills: {
      alchemy: { level: 50, experience: 100_000 },
      cooking: { level: 30, experience: 20_000 },
      woodcutting: { level: 105, experience: 20_000_000 },
    },
  };

  const sampleRows: SkillProfitRow[] = [
    mockRow("Minor Healing Potion", "Alchemy", 1),
    mockRow("Elixir of Speed", "Alchemy", 50),
    mockRow("Elixir of Power", "Alchemy", 70),
    mockRow("Elixir of Grand Focus", "Alchemy", 85),
    mockRow("Cooked Cod", "Cooking", 1),
    mockRow("Cooked Trout", "Cooking", 8),
    mockRow("Cooked Shark", "Cooking", 45),
    mockRow("Oak Log", "Woodcutting", 1),
    mockRow("Mystical Log", "Woodcutting", 90),
    mockRow("Iron Ore", "Mining", 10), // Mining not in mockProfile
  ];

  function filterRows(
    rows: SkillProfitRow[],
    hideAboveLevel: boolean,
    profile: CharacterProfile | null,
    activeSkill: SkillName | "All" = "All",
  ): SkillProfitRow[] {
    return rows
      .filter((row) => activeSkill === "All" || row.skill === activeSkill)
      .filter((row) => {
        if (!hideAboveLevel || !profile) return true;
        const playerLevel = getProfileSkillLevel(profile, row.skill);
        if (playerLevel === null) return true;
        return row.level <= playerLevel;
      });
  }

  it("returns all routes when hideAboveLevel is false", () => {
    const result = filterRows(sampleRows, false, mockProfile);
    expect(result.length).toBe(sampleRows.length);
  });

  it("returns all routes when hideAboveLevel is true but profile is null", () => {
    const result = filterRows(sampleRows, true, null);
    expect(result.length).toBe(sampleRows.length);
  });

  it("filters out Alchemy routes above player level 50", () => {
    const result = filterRows(sampleRows, true, mockProfile, "Alchemy");
    const names = result.map((r) => r.name);

    expect(names).toContain("Minor Healing Potion"); // Lv 1
    expect(names).toContain("Elixir of Speed"); // Lv 50
    expect(names).not.toContain("Elixir of Power"); // Lv 70
    expect(names).not.toContain("Elixir of Grand Focus"); // Lv 85
    expect(result.length).toBe(2);
  });

  it("filters out Cooking routes above player level 30", () => {
    const result = filterRows(sampleRows, true, mockProfile, "Cooking");
    const names = result.map((r) => r.name);

    expect(names).toContain("Cooked Cod"); // Lv 1
    expect(names).toContain("Cooked Trout"); // Lv 8
    expect(names).not.toContain("Cooked Shark"); // Lv 45
    expect(result.length).toBe(2);
  });

  it("keeps all routes for ascended skills (> Lv 100)", () => {
    const result = filterRows(sampleRows, true, mockProfile, "Woodcutting");
    const names = result.map((r) => r.name);

    expect(names).toContain("Oak Log"); // Lv 1
    expect(names).toContain("Mystical Log"); // Lv 90
    expect(result.length).toBe(2);
  });

  it("does not exclude unranked / missing skills (fallback safety)", () => {
    const result = filterRows(sampleRows, true, mockProfile, "Mining");
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Iron Ore");
  });

  it("filters all skills simultaneously when activeSkill is 'All'", () => {
    const result = filterRows(sampleRows, true, mockProfile, "All");
    const names = result.map((r) => r.name);

    // Kept
    expect(names).toContain("Minor Healing Potion");
    expect(names).toContain("Elixir of Speed");
    expect(names).toContain("Cooked Cod");
    expect(names).toContain("Cooked Trout");
    expect(names).toContain("Oak Log");
    expect(names).toContain("Mystical Log");
    expect(names).toContain("Iron Ore");

    // Filtered
    expect(names).not.toContain("Elixir of Power");
    expect(names).not.toContain("Elixir of Grand Focus");
    expect(names).not.toContain("Cooked Shark");

    expect(result.length).toBe(7);
  });
});
