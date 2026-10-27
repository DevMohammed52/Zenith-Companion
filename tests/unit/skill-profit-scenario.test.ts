import { describe, expect, it } from "vitest";
import { calculateSkillProfitRow, DEFAULT_TOOL_SELECTIONS, SkillProfitSettings, SkillRecipe } from "@/lib/skill-profit";

describe("Skill Profit Strategy Scenario & Break-Even Math", () => {
  const mockRecipe: SkillRecipe = {
    name: "Iron Bar",
    skill: "Smelting",
    level: 10,
    baseDuration: 10,
    experience: 25,
    ingredients: [
      { name: "Iron Ore", quantity: 2 },
      { name: "Coal Ore", quantity: 1 },
    ],
  };

  const mockMarketData: Record<string, any> = {
    "Iron Bar": { price: 200, vol_3: 1500 },
    "Iron Ore": { price: 40, vol_3: 5000 },
    "Coal Ore": { price: 20, vol_3: 8000 },
  };

  const mockItems: Record<string, any> = {
    "Iron Bar": { name: "Iron Bar", vendor_price: 50, is_tradeable: true },
    "Iron Ore": { name: "Iron Ore", vendor_price: 10, is_tradeable: true },
    "Coal Ore": { name: "Coal Ore", vendor_price: 5, is_tradeable: true },
  };

  const baseSettings: SkillProfitSettings = {
    membership: true, // 12% market tax + 10% member efficiency
    classBonus: false,
    saleMode: "best",
    energizingPoolExp: 0,
    assaultRank: "none",
    ascensionBuffIds: [],
    tools: { ...DEFAULT_TOOL_SELECTIONS },
    barteringBoost: 0,
    customPrices: {},
    scenarioPrices: {},
  };

  it("calculates default profit without scenario prices", () => {
    const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);

    // Inputs: 2 Iron Ore @ 40g + 1 Coal Ore @ 20g = 100g input cost
    expect(row.inputCost).toBe(100);

    // Sale: 200g market price * 0.88 (member tax 12%) = 176g net revenue
    expect(row.marketRevenue).toBe(176);
    expect(row.netRevenue).toBe(176);
    expect(row.saleSource).toBe("market");

    // Profit each = 176 - 100 = 76g
    expect(row.profitEach).toBe(76);

    // Duration: 10s base with +10% member efficiency -> 396 items/hr
    expect(row.itemsPerHour).toBe(396);
    expect(row.profitPerHour).toBe(76 * 396);
  });

  it("overrides output sale price with scenarioPrices and updates profit", () => {
    const scenarioSettings: SkillProfitSettings = {
      ...baseSettings,
      scenarioPrices: {
        "Iron Bar": 300, // Try selling at 300g gross
      },
    };

    const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, scenarioSettings);

    // Output sale should be from scenario
    expect(row.salePrice).toBe(300);
    expect(row.saleSource).toBe("scenario");

    // Market net: 300 * 0.88 = 264g
    expect(row.marketRevenue).toBe(264);
    expect(row.netRevenue).toBe(264);

    // Profit each = 264 - 100 = 164g
    expect(row.profitEach).toBe(164);
    expect(row.profitPerHour).toBe(164 * 396);
  });

  it("calculates exact break-even gross market price covering inputs", () => {
    const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
    const taxMultiplier = 0.88; // Membership 12%

    // Total cost per action = 100g (no essence)
    const totalCost = row.inputCost;
    const breakEvenGross = Math.ceil(totalCost / taxMultiplier);

    // Math.ceil(100 / 0.88) = Math.ceil(113.636...) = 114g
    expect(breakEvenGross).toBe(114);

    // At 114g gross, net revenue after 12% tax:
    const netAtBreakEven = Math.round(breakEvenGross * taxMultiplier);
    expect(netAtBreakEven).toBe(100);
    expect(netAtBreakEven).toBeGreaterThanOrEqual(totalCost);

    // At 113g gross (1g lower), net revenue would be 99g (a loss):
    const netBelowBreakEven = Math.round((breakEvenGross - 1) * taxMultiplier);
    expect(netBelowBreakEven).toBeLessThan(totalCost);
  });

  it("calculates exact break-even gross market price for non-members (15% tax)", () => {
    const nonMemberSettings: SkillProfitSettings = {
      ...baseSettings,
      membership: false,
    };
    const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, nonMemberSettings);
    const taxMultiplier = 0.85; // Non-membership 15%

    const totalCost = row.inputCost; // 100g
    const breakEvenGross = Math.ceil(totalCost / taxMultiplier);

    // Math.ceil(100 / 0.85) = Math.ceil(117.647...) = 118g
    expect(breakEvenGross).toBe(118);

    const netAtBreakEven = Math.round(breakEvenGross * taxMultiplier);
    expect(netAtBreakEven).toBe(100);
    expect(netAtBreakEven).toBeGreaterThanOrEqual(totalCost);
  });

  it("calculates target gross sell price required for target gold per hour", () => {
    const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
    const actionRate = row.itemsPerHour; // 396 items/hr
    const targetGoldPerHour = 72000; // Want 72,000g / hr
    const targetPerAction = targetGoldPerHour / actionRate; // 181.818...g profit per action
    const taxMultiplier = 0.88;

    // Gross price needed: Math.ceil((inputCost + targetPerAction) / taxMultiplier)
    // Math.ceil((100 + 181.818...) / 0.88) = Math.ceil(281.818... / 0.88) = Math.ceil(320.248...) = 321g
    const targetGrossPrice = Math.ceil((row.inputCost + targetPerAction) / taxMultiplier);
    expect(targetGrossPrice).toBe(321);

    // Verify when scenario price is set to targetGrossPrice:
    const targetRow = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, {
      ...baseSettings,
      scenarioPrices: {
        "Iron Bar": targetGrossPrice,
      },
    });

    // Net revenue = 321 * 0.88 = 282.48 -> 282g
    // Profit each = 282 - 100 = 182g
    // Profit per hour = 182 * 396 = 72,072g/hr >= 72,000g/hr
    expect(targetRow.profitEach).toBeGreaterThanOrEqual(Math.floor(targetPerAction));
    expect(targetRow.profitPerHour).toBeGreaterThanOrEqual(targetGoldPerHour);
  });

  it("allows simultaneous try buy price on inputs and try sell price on output", () => {
    const combinedSettings: SkillProfitSettings = {
      ...baseSettings,
      scenarioPrices: {
        "Iron Bar": 250, // Try sell price
        "Iron Ore": 30,  // Try buy price (down from 40g)
      },
    };

    const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, combinedSettings);

    // Input cost: 2 Iron Ore @ 30g + 1 Coal Ore @ 20g = 80g
    expect(row.inputCost).toBe(80);

    // Net revenue: 250 * 0.88 = 220g
    expect(row.netRevenue).toBe(220);

    // Profit each = 220 - 80 = 140g
    expect(row.profitEach).toBe(140);
    expect(row.profitPerHour).toBe(140 * 396);
  });
});
