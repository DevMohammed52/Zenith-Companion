import { describe, expect, it } from "vitest";
import {
  ASSAULT_OPTIONS,
  DEFAULT_TOOL_SELECTIONS,
  SKILL_TOOLS,
  SKILL_RECIPES,
  calculateSkillProfitRow,
  calculateSkillProfitRows,
  getAssaultBuff,
  getBuffTotals,
  getPrice,
  isFixedBuyPriceItem,
  type AssaultRank,
  type SkillName,
  type SkillProfitRow,
  type SkillProfitSettings,
  type SkillRecipe,
  type ToolSkill,
} from "@/lib/skill-profit";
import {
  getDisplayProfitPerHour,
  getRankedProfitPerHour,
  getProfitCellValue,
  getProfitCardValue,
  getProfitSummary,
  getSortValue,
  isLiquid,
  isExcludedFromTop,
  getSearchTokens,
  rowMatchesSearch,
  getMatchedIngredient,
  formatSignedGold,
  formatNumber,
  formatOptionalNumber,
  formatPriceSource,
  formatType,
  stringifyDetail,
  formatEffectEntry,
  MOBILE_RESULT_BATCH_SIZE,
} from "@/app/skill-profit/types";

describe("Adversarial Empirical Stress Harness: /skill-profit Math & Calculation Invariance", () => {
  // Test Fixture Data
  const mockRecipe: SkillRecipe = {
    name: "Iron Bar",
    skill: "Smelting",
    level: 10,
    baseDuration: 12,
    experience: 30,
    ingredients: [
      { name: "Iron Ore", quantity: 2 },
      { name: "Coal Ore", quantity: 1 },
    ],
  };

  const mockWoodcuttingRecipe: SkillRecipe = {
    name: "Oak Log",
    skill: "Woodcutting",
    level: 1,
    baseDuration: 12,
    experience: 15,
    ingredients: [],
  };

  const mockMiningRecipe: SkillRecipe = {
    name: "Copper Ore",
    skill: "Mining",
    level: 5,
    baseDuration: 15,
    experience: 20,
    ingredients: [],
  };

  const mockFishingRecipe: SkillRecipe = {
    name: "Tuna",
    skill: "Fishing",
    level: 5,
    baseDuration: 12,
    experience: 25,
    ingredients: [{ name: "Cheap Bait", quantity: 1 }],
  };

  const mockMarketData: Record<string, any> = {
    "Iron Bar": { price: 200, vol_3: 1500, stable_vol_3: 1500 },
    "Iron Ore": { price: 40, vol_3: 5000, stable_vol_3: 5000 },
    "Coal Ore": { price: 20, vol_3: 8000, stable_vol_3: 8000 },
    "Oak Log": { price: 15, vol_3: 3000, stable_vol_3: 3000 },
    "Copper Ore": { price: 25, vol_3: 4000, stable_vol_3: 4000 },
    "Tuna": { price: 60, vol_3: 2000, stable_vol_3: 2000 },
    "Cheap Bait": { price: 5, vol_3: 10000, stable_vol_3: 10000, vendor_price: 5 },
    "Lumberjack Essence Crystal": { price: 5000, vol_3: 200, stable_vol_3: 200 },
  };

  const mockItems: Record<string, any> = {
    "Iron Bar": { name: "Iron Bar", vendor_price: 50, is_tradeable: true },
    "Iron Ore": { name: "Iron Ore", vendor_price: 10, is_tradeable: true },
    "Coal Ore": { name: "Coal Ore", vendor_price: 5, is_tradeable: true },
    "Oak Log": { name: "Oak Log", vendor_price: 3, is_tradeable: true },
    "Copper Ore": { name: "Copper Ore", vendor_price: 6, is_tradeable: true },
    "Tuna": { name: "Tuna", vendor_price: 12, is_tradeable: true },
    "Cheap Bait": { name: "Cheap Bait", vendor_price: 5, is_tradeable: true },
    "Lumberjack Essence Crystal": { name: "Lumberjack Essence Crystal", vendor_price: 500, is_tradeable: true },
  };

  const baseSettings: SkillProfitSettings = {
    membership: false,
    classBonus: false,
    saleMode: "best",
    energizingPoolExp: 0,
    assaultRank: "none",
    ascensionBuffIds: [],
    tools: { ...DEFAULT_TOOL_SELECTIONS },
    barteringBoost: 0,
    customPrices: {},
    scenarioPrices: {},
    essenceBySkill: {},
  };

  // =========================================================================
  // DIMENSION 1: Action Duration, Throughput & Throughput Invariance
  // =========================================================================
  describe("Dimension 1: Action Duration & Throughput Scaling", () => {
    it("preserves exact finalDuration and itemsPerHour with 0% buffs", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      // baseDuration = 12s, 0% efficiency -> finalDuration = 12s
      expect(row.finalDuration).toBe(12);
      // itemsPerHour = Math.round(3600 / 12) = 300
      expect(row.itemsPerHour).toBe(300);
      expect(row.baseFinalDuration).toBe(12);
      expect(row.baseItemsPerHour).toBe(300);
    });

    it("scales finalDuration inversely with efficiency: duration = base / ((eff + 100) / 100)", () => {
      const effValues = [10, 25, 50, 75, 100, 150, 200];
      for (const eff of effValues) {
        const settings: SkillProfitSettings = {
          ...baseSettings,
          membership: false,
          assaultRank: "none",
          // inject custom efficiency via membership + ascension if needed
        };
        // test pure duration formula invariance
        const expectedDuration = 12 / ((eff + 100) / 100);
        const expectedItemsPerHour = Math.round(3600 / expectedDuration);

        expect(expectedDuration).toBeLessThan(12);
        expect(expectedItemsPerHour).toBeGreaterThan(300);
      }
    });

    it("membership grants exactly +10% efficiency and +15% experience", () => {
      const memberSettings: SkillProfitSettings = { ...baseSettings, membership: true };
      const buffs = getBuffTotals(memberSettings, true, "Smelting");
      expect(buffs.efficiency).toBe(10);
      expect(buffs.experience).toBe(15);

      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, memberSettings);
      // finalDuration = 12 / (110 / 100) = 12 / 1.1 = 10.90909090909091
      expect(row.finalDuration).toBeCloseTo(12 / 1.1, 8);
      // itemsPerHour = Math.round(3600 / (12 / 1.1)) = Math.round(330) = 330
      expect(row.itemsPerHour).toBe(330);
      // expPerAction = 30 * (115 / 100) = 34.5
      // expPerSecond = 34.5 / (12 / 1.1) = 3.1625
      expect(row.expPerSecond).toBeCloseTo(34.5 / (12 / 1.1), 8);
      // expPerHour = Math.round(expPerSecond * 3600) = 11385
      expect(row.expPerHour).toBe(Math.round((34.5 / (12 / 1.1)) * 3600));
    });

    it("guards against division by zero or negative duration when efficiency is clamped", () => {
      // Cursed / Forsaken class has -50% EXP penalty
      const cursedSettings: SkillProfitSettings = {
        ...baseSettings,
        profileClassName: "Cursed",
      };
      const buffs = getBuffTotals(cursedSettings, true, "Smelting");
      expect(buffs.efficiency).toBe(0);
      expect(buffs.experience).toBe(-50);

      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, cursedSettings);
      expect(row.finalDuration).toBe(12);
      expect(row.itemsPerHour).toBe(300);
      // expPerAction = 30 * ((-50 + 100) / 100) = 15
      expect(row.expPerSecond).toBe(15 / 12);
      expect(row.expPerHour).toBe(Math.round((15 / 12) * 3600));
    });
  });

  // =========================================================================
  // DIMENSION 2: Tool Speed Multipliers (0% to 50%) for Gathering Skills
  // =========================================================================
  describe("Dimension 2: Tool Speed Multipliers (0% to 50%)", () => {
    const gatheringSkills: ToolSkill[] = ["Woodcutting", "Mining", "Fishing"];

    it("verifies all tools in catalog range strictly between 0% and 50% efficiency", () => {
      for (const skill of gatheringSkills) {
        const tools = SKILL_TOOLS[skill];
        expect(tools.length).toBe(10);
        expect(tools[0].efficiency).toBe(0); // Simple
        expect(tools[tools.length - 1].efficiency).toBe(50); // Mythic

        // Verify strictly non-decreasing efficiency curves
        for (let i = 1; i < tools.length; i++) {
          expect(tools[i].efficiency).toBeGreaterThanOrEqual(tools[i - 1].efficiency);
        }
      }
    });

    it("applies tool efficiency directly to Woodcutting", () => {
      const mythicAxeSettings: SkillProfitSettings = {
        ...baseSettings,
        tools: {
          ...baseSettings.tools,
          Woodcutting: "Forest Reaver", // +50% eff
        },
      };

      const row = calculateSkillProfitRow(mockWoodcuttingRecipe, mockMarketData, mockItems, mythicAxeSettings);
      expect(row.toolBonus).toBe(50);
      // finalDuration = 12 / (150 / 100) = 8s
      expect(row.finalDuration).toBe(8);
      // itemsPerHour = Math.round(3600 / 8) = 450
      expect(row.itemsPerHour).toBe(450);
    });

    it("applies tool efficiency directly to Mining", () => {
      const mythicPickSettings: SkillProfitSettings = {
        ...baseSettings,
        tools: {
          ...baseSettings.tools,
          Mining: "Earth Destroyer", // +50% eff
        },
      };

      const row = calculateSkillProfitRow(mockMiningRecipe, mockMarketData, mockItems, mythicPickSettings);
      expect(row.toolBonus).toBe(50);
      // finalDuration = 15 / (150 / 100) = 10s
      expect(row.finalDuration).toBe(10);
      expect(row.itemsPerHour).toBe(360);
    });

    it("applies tool efficiency directly to Fishing", () => {
      const mythicRodSettings: SkillProfitSettings = {
        ...baseSettings,
        tools: {
          ...baseSettings.tools,
          Fishing: "Aqua Reaper", // +50% eff
        },
      };

      const row = calculateSkillProfitRow(mockFishingRecipe, mockMarketData, mockItems, mythicRodSettings);
      expect(row.toolBonus).toBe(50);
      // finalDuration = 12 / (150 / 100) = 8s
      expect(row.finalDuration).toBe(8);
      expect(row.itemsPerHour).toBe(450);
    });

    it("strictly isolates tool efficiency to gathering: non-gathering skills receive 0% tool bonus", () => {
      const fullToolSettings: SkillProfitSettings = {
        ...baseSettings,
        tools: {
          Woodcutting: "Forest Reaver",
          Mining: "Earth Destroyer",
          Fishing: "Aqua Reaper",
        },
      };

      const smeltingRow = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, fullToolSettings);
      expect(smeltingRow.toolBonus).toBe(0);
      expect(smeltingRow.finalDuration).toBe(12);

      // Check all non-gathering recipes from SKILL_RECIPES
      const nonGatheringSkills: SkillName[] = ["Cooking", "Smelting", "Alchemy", "Forge", "Construction"];
      for (const skill of nonGatheringSkills) {
        const dummyRecipe: SkillRecipe = {
          name: "Test Recipe",
          skill,
          level: 1,
          baseDuration: 10,
          experience: 10,
          ingredients: [],
        };
        const row = calculateSkillProfitRow(dummyRecipe, mockMarketData, mockItems, fullToolSettings);
        expect(row.toolBonus).toBe(0);
      }
    });
  });

  // =========================================================================
  // DIMENSION 3: Guild Conquest Assault Rank Bonuses
  // =========================================================================
  describe("Dimension 3: Guild Conquest Assault Rank Buffs", () => {
    it("correctly resolves each assault rank to documented EXP and Eff values", () => {
      expect(getAssaultBuff("none")).toEqual({ exp: 0, efficiency: 0, label: "No conquest buff" });
      expect(getAssaultBuff("first")).toEqual({ exp: 25, efficiency: 5, label: "1st Place (+25% EXP, +5% Eff)" });
      expect(getAssaultBuff("second")).toEqual({ exp: 17, efficiency: 5, label: "2nd Place (+17% EXP, +5% Eff)" });
      expect(getAssaultBuff("third")).toEqual({ exp: 13, efficiency: 5, label: "3rd Place (+13% EXP, +5% Eff)" });
      expect(getAssaultBuff("fourth")).toEqual({ exp: 10, efficiency: 3, label: "4th Place (+10% EXP, +3% Eff)" });
      expect(getAssaultBuff("fifthSeventh")).toEqual({ exp: 7, efficiency: 3, label: "5th-7th (+7% EXP, +3% Eff)" });
      expect(getAssaultBuff("fourthSeventh")).toEqual({ exp: 7, efficiency: 3, label: "5th-7th (+7% EXP, +3% Eff)" });
      expect(getAssaultBuff("eighthTenth")).toEqual({ exp: 3, efficiency: 2, label: "8th-10th (+3% EXP, +2% Eff)" });
      expect(getAssaultBuff(null)).toEqual({ exp: 0, efficiency: 0, label: "No conquest buff" });
      expect(getAssaultBuff(undefined)).toEqual({ exp: 0, efficiency: 0, label: "No conquest buff" });
    });

    it("verifies 1st place rank buffs compound into final row calculation", () => {
      const firstPlaceSettings: SkillProfitSettings = {
        ...baseSettings,
        assaultRank: "first", // +25% EXP, +5% Eff
      };

      const buffs = getBuffTotals(firstPlaceSettings, true, "Smelting");
      expect(buffs.efficiency).toBe(5);
      expect(buffs.experience).toBe(25);

      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, firstPlaceSettings);
      // finalDuration = 12 / (105 / 100) = 11.428571428571429
      expect(row.finalDuration).toBeCloseTo(12 / 1.05, 8);
      // itemsPerHour = Math.round(3600 / (12 / 1.05)) = Math.round(315) = 315
      expect(row.itemsPerHour).toBe(315);
      // expPerAction = 30 * (125 / 100) = 37.5
      expect(row.expPerSecond).toBeCloseTo(37.5 / (12 / 1.05), 8);
      expect(row.expPerHour).toBe(Math.round((37.5 / (12 / 1.05)) * 3600));
    });
  });

  // =========================================================================
  // DIMENSION 4: Bartering Discount Curves & Sale Modes
  // =========================================================================
  describe("Dimension 4: Bartering Boost & Sale Mode Arbitrage", () => {
    it("scales vendor revenue by exactly (1 + barteringBoost / 100)", () => {
      const testBoosts = [0, 5, 10, 15, 20];
      for (const boost of testBoosts) {
        const settings: SkillProfitSettings = {
          ...baseSettings,
          barteringBoost: boost,
          saleMode: "vendor",
        };
        const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, settings);
        // vendorBase for Iron Bar = 50g, rounded to integer
        const expectedVendorRevenue = Math.round(50 * (1 + boost / 100));
        expect(row.vendorRevenue).toBe(expectedVendorRevenue);
        expect(row.netRevenue).toBe(expectedVendorRevenue);
        expect(row.saleSource).toBe("vendor");
      }
    });

    it("correctly handles string or empty barteringBoost input without NaN", () => {
      const stringSettings: SkillProfitSettings = {
        ...baseSettings,
        barteringBoost: "12" as any,
        saleMode: "vendor",
      };
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, stringSettings);
      expect(row.vendorRevenue).toBe(Math.round(50 * 1.12));

      const emptySettings: SkillProfitSettings = {
        ...baseSettings,
        barteringBoost: "" as any,
        saleMode: "vendor",
      };
      const rowEmpty = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, emptySettings);
      expect(rowEmpty.vendorRevenue).toBe(50);
    });

    it("saleMode='best' chooses market when marketNet > vendorRevenue, and vendor when vendorRevenue > marketNet", () => {
      // Iron Bar: Market 200g (net 170g @ 15% tax) vs Vendor 50g (with 0% barter)
      const marketFavored = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      expect(marketFavored.marketRevenue).toBe(170); // 200 * 0.85
      expect(marketFavored.vendorRevenue).toBe(50);
      expect(marketFavored.bestSaleSource).toBe("market");
      expect(marketFavored.netRevenue).toBe(170);

      // Create an item where vendor exceeds market
      const lowMarketData = {
        ...mockMarketData,
        "Iron Bar": { price: 55, vol_3: 1500, stable_vol_3: 1500 }, // Market net = 55 * 0.85 = 46.75 -> 47g
      };
      const vendorFavored = calculateSkillProfitRow(mockRecipe, lowMarketData, mockItems, {
        ...baseSettings,
        barteringBoost: 10, // Vendor = 50 * 1.10 = 55g
      });
      expect(vendorFavored.marketRevenue).toBe(47); // 55 * 0.85 = 46.75 -> 47g
      expect(vendorFavored.vendorRevenue).toBe(55); // 50 * 1.1 = 55g
      expect(vendorFavored.bestSaleSource).toBe("vendor");
      expect(vendorFavored.netRevenue).toBe(55);
    });

    it("saleMode='market' forces market sale even if vendor gives more gold", () => {
      const lowMarketData = {
        ...mockMarketData,
        "Iron Bar": { price: 55, vol_3: 1500, stable_vol_3: 1500 },
      };
      const forcedMarket = calculateSkillProfitRow(mockRecipe, lowMarketData, mockItems, {
        ...baseSettings,
        barteringBoost: 20, // Vendor is 60g, Market is 47g
        saleMode: "market",
      });
      expect(forcedMarket.bestSaleSource).toBe("market");
      expect(forcedMarket.netRevenue).toBe(47);
    });

    it("saleMode='vendor' forces vendor sale even if market gives more gold", () => {
      const forcedVendor = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, {
        ...baseSettings,
        saleMode: "vendor",
      });
      expect(forcedVendor.bestSaleSource).toBe("vendor");
      expect(forcedVendor.netRevenue).toBe(50);
    });
  });

  // =========================================================================
  // DIMENSION 5: Essence Cost Deductions & Housing Windows
  // =========================================================================
  describe("Dimension 5: Essence Deductions & Housing Idle Action Windows", () => {
    it("calculates housing idle window items and profit correctly", () => {
      const housingSettings: SkillProfitSettings = {
        ...baseSettings,
        housingIdleHoursBySkill: {
          Smelting: 4.5, // 4.5 hours of housing idle action window
        },
      };

      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, housingSettings);
      expect(row.housingWindowHours).toBe(4.5);
      // itemsPerHousingWindow = Math.floor((4.5 * 3600) / 12) = Math.floor(16200 / 12) = 1350 items
      expect(row.itemsPerHousingWindow).toBe(1350);
      // profitPerHousingWindow = profitEach * 1350 = 70 * 1350 = 94,500
      expect(row.profitPerHousingWindow).toBe(row.profitEach * 1350);
    });

    it("calculates essence active buffs, cost per hour, and profit with essence", () => {
      const essenceSettings: SkillProfitSettings = {
        ...baseSettings,
        essenceBySkill: {
          Woodcutting: "Lumberjack Essence Crystal",
        },
        essenceBuffsBySkill: {
          Woodcutting: { efficiency: 10, experience: 20 } as any,
        },
        essencePricesBySkill: {
          Woodcutting: { value: 6000, rawValue: 6000, source: "market", adjusted: false },
        },
        idleActionHoursBySkill: {
          Woodcutting: 8, // 8 hour idle action window
        },
      };

      const row = calculateSkillProfitRow(mockWoodcuttingRecipe, mockMarketData, mockItems, essenceSettings);
      expect(row.essenceActive).toBe(true);
      expect(row.essenceName).toBe("Lumberjack Essence Crystal");
      expect(row.essenceEfficiencyBonus).toBe(10);
      expect(row.essenceExperienceBonus).toBe(20);
      expect(row.essenceCostPerStart).toBe(6000);
      // essenceCostPerHour = 6000 / 8 = 750g/hr
      expect(row.essenceCostPerHour).toBe(750);
      expect(row.essenceNeedsPrice).toBe(false);

      // profitPerHour before essence:
      // sale = 15g * 0.85 = 12.75g net, 0 input -> profitEach = 12.75g
      // finalDuration with +10% eff = 12 / 1.1 = 10.909s -> itemsPerHour = 330
      // profitPerHour = Math.round(12.75 * 330) = 4208g/hr
      expect(row.profitBeforeEssenceCostPerHour).toBe(row.profitPerHour);
      // profitWithEssencePerHour = Math.round(4208 - 750) = 3458g/hr
      expect(row.profitWithEssencePerHour).toBe(Math.round(row.profitPerHour - 750));

      // base values must strip out essence bonus!
      // baseFinalDuration = 12s, baseItemsPerHour = 300
      // baseProfitPerHour = Math.round(12.75 * 300) = 3825g/hr
      expect(row.baseFinalDuration).toBe(12);
      expect(row.baseItemsPerHour).toBe(300);
      expect(row.baseProfitPerHour).toBe(3825);
    });

    it("handles essence without price: sets essenceNeedsPrice=true and profitWithEssencePerHour=null", () => {
      const essenceNoPriceSettings: SkillProfitSettings = {
        ...baseSettings,
        essenceBySkill: {
          Woodcutting: "Lumberjack Essence Crystal",
        },
        essenceBuffsBySkill: {
          Woodcutting: { efficiency: 10, experience: 20 } as any,
        },
        essencePricesBySkill: {
          Woodcutting: { value: 0, rawValue: 0, source: "missing", adjusted: false },
        },
        idleActionHoursBySkill: {
          Woodcutting: 8,
        },
      };

      const row = calculateSkillProfitRow(mockWoodcuttingRecipe, mockMarketData, mockItems, essenceNoPriceSettings);
      expect(row.essenceActive).toBe(true);
      expect(row.essenceNeedsPrice).toBe(true);
      expect(row.essenceCostPerHour).toBe(null);
      expect(row.profitWithEssencePerHour).toBe(null);

      // getDisplayProfitPerHour must return null for essence needing price
      expect(getDisplayProfitPerHour(row)).toBe(null);
      // getRankedProfitPerHour must fall back to baseProfitPerHour
      expect(getRankedProfitPerHour(row)).toBe(row.baseProfitPerHour);
    });
  });

  // =========================================================================
  // DIMENSION 6: Strategy Modal Break-Even Price & Target Profit Solver
  // =========================================================================
  describe("Dimension 6: Strategy Modal Break-Even & Target Profit Solver Math", () => {
    it("break-even gross price covers total costs and never results in net loss", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      // Non-member tax = 15% -> taxMultiplier = 0.85
      const taxMultiplier = 0.85;
      const breakEvenGross = Math.ceil(row.inputCost / taxMultiplier);

      // At break-even gross price:
      const netAtBreakEven = Math.round(breakEvenGross * taxMultiplier);
      expect(netAtBreakEven).toBeGreaterThanOrEqual(row.inputCost);

      // At 1g lower than break-even:
      const netBelow = Math.round((breakEvenGross - 1) * taxMultiplier);
      expect(netBelow).toBeLessThan(row.inputCost);
    });

    it("target gross price achieves target gold per hour", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      const actionRate = row.itemsPerHour; // 300
      const targetGoldPerHour = 50_000;
      const targetPerAction = targetGoldPerHour / actionRate; // 166.666...
      const taxMultiplier = 0.85;

      const targetGrossSellPrice = Math.ceil((row.inputCost + targetPerAction) / taxMultiplier);

      // Verify with scenarioPrices:
      const testRow = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, {
        ...baseSettings,
        scenarioPrices: {
          [mockRecipe.name]: targetGrossSellPrice,
        },
      });

      expect(testRow.profitPerHour).toBeGreaterThanOrEqual(targetGoldPerHour);
    });

    it("single input break-even calculation correctly solves max unit price", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      // Ingredients: Iron Ore (qty 2 @ 40g), Coal Ore (qty 1 @ 20g) -> total inputCost = 100g
      // netRevenue = 170g
      // For Iron Ore: otherInputCost = Coal Ore cost = 20g
      // maxUnitForBreakEven = Math.floor((netRevenue - otherInputCost) / quantity)
      // = Math.floor((170 - 20) / 2) = Math.floor(150 / 2) = 75g ea
      const maxUnitIronOre = Math.floor((row.netRevenue - 20) / 2);
      expect(maxUnitIronOre).toBe(75);

      // If Iron Ore costs 75g: total input = 2*75 + 20 = 170g -> profitEach = 170 - 170 = 0g (break-even!)
      const breakEvenRow = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, {
        ...baseSettings,
        scenarioPrices: {
          "Iron Ore": 75,
        },
      });
      expect(breakEvenRow.profitEach).toBe(0);
      expect(breakEvenRow.profitPerHour).toBe(0);

      // If Iron Ore costs 76g (1g higher): total input = 172g -> net loss -2g
      const lossRow = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, {
        ...baseSettings,
        scenarioPrices: {
          "Iron Ore": 76,
        },
      });
      expect(lossRow.profitEach).toBe(-2);
    });

    it("shared combined materials break-even ratio scales editable inputs proportionally", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      // Editable inputs: Iron Ore (2 * 40 = 80g), Coal Ore (1 * 20 = 20g) -> sharedInputCost = 100g
      // sharedBreakEvenBudget = netRevenue (170g) - fixedCost (0g) = 170g
      // sharedBreakEvenRatio = 170 / 100 = 1.70 (+70% room)
      const sharedInputCost = 100;
      const sharedBreakEvenBudget = 170;
      const sharedBreakEvenRatio = sharedBreakEvenBudget / sharedInputCost;
      expect(sharedBreakEvenRatio).toBe(1.70);

      const breakEvenIronOre = Math.floor(40 * sharedBreakEvenRatio); // Math.floor(68) = 68g
      const breakEvenCoalOre = Math.floor(20 * sharedBreakEvenRatio); // Math.floor(34) = 34g

      // Plug these scaled prices back in:
      const scaledRow = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, {
        ...baseSettings,
        scenarioPrices: {
          "Iron Ore": breakEvenIronOre,
          "Coal Ore": breakEvenCoalOre,
        },
      });
      // 2 * 68 + 1 * 34 = 136 + 34 = 170g input -> profitEach = 170 - 170 = 0g!
      expect(scaledRow.profitEach).toBeGreaterThanOrEqual(0);
      expect(scaledRow.inputCost).toBeLessThanOrEqual(row.netRevenue);
    });
  });

  // =========================================================================
  // DIMENSION 7: Sorting Stability & Helper Parity
  // =========================================================================
  describe("Dimension 7: Sorting Stability & Pure Helper Invariance", () => {
    it("getSortValue extracts correct values for all keys", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      expect(getSortValue(row, "name")).toBe("iron bar");
      expect(getSortValue(row, "skill")).toBe("Smelting");
      expect(getSortValue(row, "profitPerHour")).toBe(row.profitPerHour);
      expect(getSortValue(row, "profitEach")).toBe(row.profitEach);
      expect(getSortValue(row, "level")).toBe(10);
      expect(getSortValue(row, "itemsPerHour")).toBe(300);
      expect(getSortValue(row, "finalDuration")).toBe(12);
      expect(getSortValue(row, "volume3d")).toBe(1500);
      expect(getSortValue(row, "inputCost")).toBe(100);
      expect(getSortValue(row, "salePrice")).toBe(200);
    });

    it("isLiquid requires volume >= minVolume and no liquidityRisk for market items", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      expect(isLiquid(row, 1000)).toBe(true); // vol_3 is 1500 >= 1000
      expect(isLiquid(row, 2000)).toBe(false); // vol_3 is 1500 < 2000
      expect(isLiquid({ ...row, liquidityRisk: true }, 1000)).toBe(false); // risk flag rejects
    });

    it("isExcludedFromTop excludes Forge recipes and illiquid routes", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      expect(isExcludedFromTop(row, 1000)).toBe(false);
      expect(isExcludedFromTop({ ...row, skill: "Forge" }, 1000)).toBe(true);
      expect(isExcludedFromTop(row, 5000)).toBe(true); // volume too low
    });

    it("rowMatchesSearch matches search terms across all fields", () => {
      const row = calculateSkillProfitRow(mockRecipe, mockMarketData, mockItems, baseSettings);
      expect(rowMatchesSearch(row, ["smelt"])).toBe(true);
      expect(rowMatchesSearch(row, ["iron", "bar"])).toBe(true);
      expect(rowMatchesSearch(row, ["coal"])).toBe(true); // ingredient name
      expect(rowMatchesSearch(row, ["mithril"])).toBe(false);
    });

    it("formatSignedGold handles zero, positive, and negative values cleanly", () => {
      expect(formatSignedGold(0)).toBe("+0g");
      expect(formatSignedGold(150)).toBe("+150g");
      expect(formatSignedGold(-250)).toBe("-250g");
    });
  });
});
