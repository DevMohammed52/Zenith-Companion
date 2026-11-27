import { describe, expect, it } from "vitest";
import { ALCHEMY_ITEMS } from "@/constants";
import {
  ALCHEMY_RECIPE_META,
  calculateAlchemyBuffTotals,
  calculateAlchemyRow,
  calculateCraftingBreakEven,
} from "@/lib/alchemy-profit";

describe("alchemy-profit calculations & data completeness", () => {
  it("provides verified EXP, Speed EXP, and category metadata for every Lv 1-89 recipe", () => {
    const basicNames = Object.entries(ALCHEMY_ITEMS)
      .filter(([, recipe]) => recipe.level < 90)
      .map(([name]) => name);

    expect(basicNames.length).toBe(51);
    for (const name of basicNames) {
      const meta = ALCHEMY_RECIPE_META[name];
      expect(meta, `Missing ALCHEMY_RECIPE_META entry for ${name}`).toBeDefined();
      expect(meta.alchemyExp).toBeGreaterThan(0);
      expect(meta.speedExp).toBeGreaterThan(0);
      expect(["potion", "essence_crystal", "stat_essence"]).toContain(meta.category);
    }
  });

  it("applies Membership, Alchemist class, Conquest, Ascension, Energizing Pool, and Cursed penalty accurately", () => {
    const alchemist = calculateAlchemyBuffTotals({
      membership: true,
      alchemistClass: true,
      penaltyClass: false,
      assaultRank: "first",
      ascensionBuffIds: ["exp-1", "eff-2"],
      energizingPoolExp: 20,
    });

    // Efficiency: Membership (10) + Alchemist (10) + Conquest 1st (5) + Ascension Lv2 (3) = 28%
    expect(alchemist.efficiencyBonus).toBe(28);
    // EXP: Membership (15) + Alchemist (10) + Conquest 1st (25) + Ascension Lv1 (5) + Pool (20) = 75%
    expect(alchemist.expBonus).toBe(75);
    expect(alchemist.marketTaxRate).toBe(0.12);
    expect(alchemist.marketTaxMultiplier).toBe(0.88);

    const cursed = calculateAlchemyBuffTotals({
      membership: false,
      alchemistClass: true,
      penaltyClass: true,
      assaultRank: "none",
      ascensionBuffIds: [],
      energizingPoolExp: 0,
    });

    expect(cursed.efficiencyBonus).toBe(0);
    expect(cursed.expBonus).toBe(-50);
    expect(cursed.expMultiplier).toBeCloseTo(0.5, 5);
    expect(cursed.marketTaxMultiplier).toBe(0.85);
  });

  it("solves break-even against craft revenue rather than liquidation revenue on LIQUIDATE rows", () => {
    const buffs = calculateAlchemyBuffTotals({
      membership: true,
      alchemistClass: false,
      penaltyClass: false,
      assaultRank: "none",
      ascensionBuffIds: [],
      energizingPoolExp: 0,
    });

    const row = calculateAlchemyRow({
      name: "Battle Potion",
      recipe: ALCHEMY_ITEMS["Battle Potion"],
      marketData: {
        "Battle Potion": { avg_3: 100, price: 100, vendor_price: 50, vol_3: 200 },
        "Lucky Rabbit Foot": { avg_3: 500, price: 500, vol_3: 500 },
      },
      itemDatabase: {},
      customPrices: {},
      ownedMaterials: {},
      ownedCostMode: false,
      buffTotals: buffs,
      barteringBoost: 0,
      sessionHours: 8,
    });

    expect(row.action).toBe("LIQUIDATE");
    expect(row.marketNet).toBe(88);
    expect(row.craftRevenue).toBe(88);

    const breakEven = calculateCraftingBreakEven(row, false, null);
    // Craft net = 88g; vial = 5g; 2x Lucky Rabbit Foot => max (88 - 5) / 2 = 41g each
    expect(breakEven.craftRevenue).toBe(88);
    expect(breakEven.perIngredient[0].maxUnitForBreakEven).toBe(41);
  });

  it("calculates session crafts cleanly from idle hours and EXP/hr from buffed EXP", () => {
    const buffs = calculateAlchemyBuffTotals({
      membership: true, // +10% eff, +15% EXP, 0.88 net
      alchemistClass: true, // +10% eff, +10% EXP => +20% eff, +25% EXP
      penaltyClass: false,
      assaultRank: "none",
      ascensionBuffIds: [],
      energizingPoolExp: 0,
    });

    const row = calculateAlchemyRow({
      name: "Battle Potion",
      recipe: ALCHEMY_ITEMS["Battle Potion"], // baseTime: 150s, baseAlchemyExp: 45
      marketData: {
        "Battle Potion": { avg_3: 300, price: 300, vendor_price: 50, vol_3: 500 },
        "Lucky Rabbit Foot": { avg_3: 80, price: 80, vol_3: 500 },
      },
      itemDatabase: {},
      customPrices: {},
      ownedMaterials: {},
      ownedCostMode: false,
      buffTotals: buffs,
      barteringBoost: 0,
      sessionHours: 10, // e.g., 8h + Distillation Rig III (+2h)
    });

    // time = 150 / 1.2 = 125s => 28.8 crafts/hr; 10h * 3600 / 125 = 288 crafts/session
    expect(row.time).toBe(125);
    expect(row.craftsPerHour).toBeCloseTo(28.8, 5);
    expect(row.craftsPerSession).toBe(288);
    expect(row.alchemyExpEach).toBeCloseTo(45 * 1.25, 5);
    expect(row.expPerHour).toBeCloseTo(45 * 1.25 * 28.8, 4);
    expect(row.sessionExp).toBe(Math.round(45 * 1.25 * 288));
  });
});
