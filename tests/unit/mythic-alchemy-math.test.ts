import { describe, expect, it } from "vitest";
import { calculateAlchemyBuffTotals } from "@/lib/alchemy-profit";
import {
  MYTHIC_CRAFT_TIME_SECONDS,
  buildMythicAlchemyRecipes,
  buildRecommendedMythicRecipes,
  calculateMythicCatalogRows,
  calculateMythicProjectRows,
  type MythicDbItem,
  type MythicMarketItem,
} from "@/lib/mythic-alchemy";

const MOCK_ITEMS: Record<string, MythicDbItem> = {
  "Cosmic Barrier Recipe": {
    name: "Cosmic Barrier Recipe",
    type: "RECIPE",
    quality: "MYTHIC",
    is_tradeable: true,
    image_url: "https://cdn.example/cb-recipe.png",
    recipe: {
      skill: "alchemy",
      level_required: 90,
      max_uses: 30,
      experience: { skills: { alchemy: 8000 }, stats: { speed: 570 } },
      result: { item_name: "Cosmic Barrier" },
      materials: [
        { item_name: "Vial of Spectre Ectoplasm", quantity: 15 },
        { item_name: "Lions Teeth", quantity: 30 },
        { item_name: "Arcane Crystal", quantity: 1 },
      ],
    },
  },
  "Cosmic Barrier Recipe (Untradable)": {
    name: "Cosmic Barrier Recipe (Untradable)",
    type: "RECIPE",
    quality: "MYTHIC",
    is_tradeable: false,
    recipe: {
      skill: "alchemy",
      level_required: 90,
      max_uses: 30,
      experience: { skills: { alchemy: 8000 }, stats: { speed: 570 } },
      result: { item_name: "Cosmic Barrier" },
      materials: [{ item_name: "Arcane Crystal", quantity: 1 }],
    },
  },
  "Cosmic Barrier": {
    name: "Cosmic Barrier",
    type: "ESSENCE_CRYSTAL",
    quality: "MYTHIC",
    vendor_price: 20000,
    is_tradeable: true,
    image_url: "https://cdn.example/cb.png",
  },
  "Potion of the Hunter Recipe": {
    name: "Potion of the Hunter Recipe",
    type: "RECIPE",
    quality: "MYTHIC",
    is_tradeable: true,
    recipe: {
      skill: "alchemy",
      level_required: 90,
      max_uses: 30,
      experience: { skills: { alchemy: 8000 }, stats: { speed: 570 } },
      result: { item_name: "Potion of the Hunter" },
      materials: [
        { item_name: "Arcane Starstone", quantity: 7 },
        { item_name: "Goblin Scraps", quantity: 50 },
        { item_name: "Arcane Vial", quantity: 1 },
      ],
    },
  },
  "Potion of the Hunter": {
    name: "Potion of the Hunter",
    type: "POTION",
    quality: "MYTHIC",
    vendor_price: 20000,
    is_tradeable: true,
  },
  "Arcane Crystal": {
    name: "Arcane Crystal",
    type: "EMPTY_CRYSTAL",
    quality: "MYTHIC",
    vendor_price: 20,
    is_tradeable: false,
  },
  "Arcane Vial": {
    name: "Arcane Vial",
    type: "EMPTY_VIAL",
    quality: "MYTHIC",
    vendor_price: 20,
    is_tradeable: false,
  },
};

const MOCK_MARKET: Record<string, MythicMarketItem> = {
  "Cosmic Barrier Recipe": { price: 300000, avg_3: 300000, vol_3: 4 },
  "Cosmic Barrier": { price: 50000, avg_3: 50000, vol_3: 60 },
  "Vial of Spectre Ectoplasm": { price: 1000, avg_3: 1000, vol_3: 300 },
  "Lions Teeth": { price: 100, avg_3: 100, vol_3: 500 },
  "Potion of the Hunter Recipe": { price: 3000000, avg_3: 3000000, vol_3: 2 },
  "Potion of the Hunter": { price: 150000, avg_3: 150000, vol_3: 35 },
  "Arcane Starstone": { price: 2000, avg_3: 2000, vol_3: 100 },
  "Goblin Scraps": { price: 100, avg_3: 100, vol_3: 500 },
};

describe("mythic-alchemy stage 1 math invariants", () => {
  it("uses 1500s (25m) base craft time without double-counting membership", () => {
    expect(MYTHIC_CRAFT_TIME_SECONDS).toBe(1500);

    const recipes = buildMythicAlchemyRecipes(MOCK_ITEMS);
    expect(recipes).toHaveLength(2);
    const byResult = new Map(recipes.map((r) => [r.resultName, r]));

    expect(byResult.get("Cosmic Barrier")?.category).toBe("stat_essence");
    expect(byResult.get("Potion of the Hunter")?.category).toBe("potion");
    expect(byResult.get("Cosmic Barrier")?.experience).toBe(8000);
    expect(byResult.get("Cosmic Barrier")?.speedExp).toBe(570);

    const memberBuffs = calculateAlchemyBuffTotals({
      membership: true,
      alchemistClass: false,
      penaltyClass: false,
      assaultRank: "none",
      ascensionBuffIds: [],
      energizingPoolExp: 0,
    });

    const [row] = calculateMythicProjectRows({
      activeRecipeNames: ["Cosmic Barrier"],
      recipeByResult: byResult,
      usesLeft: { "Cosmic Barrier": 30 },
      customRecipePrices: {},
      customMaterialPrices: {},
      customSellPrices: {},
      settingsPrices: {},
      marketData: MOCK_MARKET,
      itemsByName: MOCK_ITEMS,
      recipeCostMode: "full",
      membership: true,
      profileBarteringBoost: 0,
      buffTotals: memberBuffs,
    });

    // 1500 / 1.10 = 1363.636... seconds (~22.7m), NOT 1363.6 / 1.10 = 1239.6s
    expect(row.craftTimeSeconds).toBeCloseTo(1500 / 1.1, 4);
    expect(row.craftsPerHour).toBeCloseTo((3600 / 1500) * 1.1, 4);
    // Materials: 15*1000 + 30*100 + 2500 Arcane Crystal merchant cost = 20,500
    expect(row.materialCost).toBe(20500);
    // Recipe amortized: 300,000 / 30 = 10,000 -> total cost 30,500
    expect(row.totalCostPerCraft).toBe(30500);
    // Member net: 50,000 * 0.88 = 44,000 -> profit 13,500/craft
    expect(row.revenue).toBe(44000);
    expect(row.profit).toBe(13500);
    // Alchemy EXP: 8000 * 1.15 (Member +15%) = 9200/craft
    expect(row.alchemyExpEach).toBeCloseTo(9200, 4);
    expect(row.expPerHour).toBeCloseTo(9200 * row.craftsPerHour, 2);
  });

  it("applies Alchemist class, Conquest, Ascension, and Energizing Pool buffs consistently", () => {
    const recipes = buildMythicAlchemyRecipes(MOCK_ITEMS);
    const stackedBuffs = calculateAlchemyBuffTotals({
      membership: true,
      alchemistClass: true,
      penaltyClass: false,
      assaultRank: "first",
      ascensionBuffIds: ["eff-2", "exp-1"],
      energizingPoolExp: 20,
    });

    expect(stackedBuffs.ascensionEff).toBe(3);
    expect(stackedBuffs.ascensionExp).toBe(5);

    const rows = calculateMythicCatalogRows({
      mythicRecipes: recipes,
      activeRecipeNames: [],
      settingsPrices: {},
      marketData: MOCK_MARKET,
      itemsByName: MOCK_ITEMS,
      buffTotals: stackedBuffs,
      barteringBoost: 0,
    });

    const cb = rows.find((r) => r.recipe.resultName === "Cosmic Barrier")!;
    expect(cb.efficiencyBonus).toBe(stackedBuffs.efficiencyBonus);
    expect(cb.craftTimeSeconds).toBeCloseTo(1500 / stackedBuffs.durationMultiplier, 4);
    expect(cb.alchemyExpEach).toBeCloseTo(8000 * stackedBuffs.expMultiplier, 4);
    expect(cb.totalBatchProfit).toBeCloseTo(cb.profit * 30, 4);
  });

  it("ranks recommended Mythic recipes by profit per hour instead of raw output sell price", () => {
    const recipes = buildMythicAlchemyRecipes(MOCK_ITEMS);
    const freeBuffs = calculateAlchemyBuffTotals({
      membership: false,
      alchemistClass: false,
      penaltyClass: false,
      assaultRank: "none",
      ascensionBuffIds: [],
      energizingPoolExp: 0,
    });

    const recommended = buildRecommendedMythicRecipes({
      mythicRecipes: recipes,
      activeRecipeNames: [],
      settingsPrices: {},
      marketData: MOCK_MARKET,
      itemsByName: MOCK_ITEMS,
      buffTotals: freeBuffs,
      barteringBoost: 0,
    });

    // Hunter sells for 150k, cost = 7*2k + 50*100 + 2500 + 3M/30 = 121.5k, net = 127.5k (+6k profit)
    // Cosmic Barrier sells for 50k, cost = 20.5k + 10k = 30.5k, net = 42.5k (+12k profit)
    expect(recommended[0].recipe.resultName).toBe("Cosmic Barrier");
    expect(recommended[0].profitPerHour).toBeGreaterThan(recommended[1].profitPerHour);
  });
});
