import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { buildForgeRecipeOptions } from "@/lib/forge-planner";

const ITEMS_FILE = path.join(process.cwd(), "public", "all-items-db.json");
const ITEMS_MAP_FILE = path.join(process.cwd(), "public", "items-map.json");

// All official IdleMMO items with type === "FISH"
const GAME_FISH_NAMES = new Set([
  "Cod",
  "Crab",
  "Great White Shark",
  "Herring",
  "Lantern Fish",
  "Lobster",
  "Perch",
  "Salmon",
  "Sardines",
  "Stingray",
  "Trout",
  "Tuna",
  "Turtle",
]);

type RecipeEntry = {
  name: string;
  type: string;
  quality?: string;
  recipe?: {
    skill?: string;
    level_required?: number;
    experience?: number;
    materials?: Array<{
      hashed_item_id?: string;
      item_name?: string;
      quantity?: number;
    }>;
    result?: {
      hashed_item_id?: string;
      item_name?: string;
    };
  };
};

describe("Forge Recipes Post-Rework Verification Contracts", () => {
  const allItems: Record<string, RecipeEntry> = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf8"));
  const itemsMap: Record<string, RecipeEntry> = JSON.parse(fs.readFileSync(ITEMS_MAP_FILE, "utf8"));

  const forgeRecipes: RecipeEntry[] = Object.values(allItems).filter(
    (item) => item.type === "RECIPE" && item.recipe?.skill === "Forge"
  );

  const mapForgeRecipes: RecipeEntry[] = Object.values(itemsMap).filter(
    (item) => item.type === "RECIPE" && item.recipe?.skill === "Forge"
  );

  it("loads all 252 Forge recipes from all-items-db and items-map", () => {
    expect(forgeRecipes.length).toBeGreaterThanOrEqual(250);
    expect(mapForgeRecipes.length).toBe(forgeRecipes.length);
  });

  it("verifies 0 Forge recipes contain deprecated fish materials in all-items-db", () => {
    const recipesWithFish = forgeRecipes.filter((item) => {
      const materials = item.recipe?.materials || [];
      return materials.some((m) => m.item_name && GAME_FISH_NAMES.has(m.item_name));
    });

    if (recipesWithFish.length > 0) {
      const offending = recipesWithFish.map((r) => ({
        name: r.name,
        materials: r.recipe?.materials?.map((m) => m.item_name),
      }));
      console.warn("Recipes still containing fish in all-items-db:", offending);
    }

    expect(recipesWithFish).toHaveLength(0);
  });

  it("verifies 0 Forge recipes contain deprecated fish materials in items-map", () => {
    const recipesWithFish = mapForgeRecipes.filter((item) => {
      const materials = item.recipe?.materials || [];
      return materials.some((m) => m.item_name && GAME_FISH_NAMES.has(m.item_name));
    });

    expect(recipesWithFish).toHaveLength(0);
  });

  it("verifies all Forge recipes have valid result item and materials list", () => {
    for (const recipe of forgeRecipes) {
      expect(recipe.recipe?.result).toBeDefined();
      expect(recipe.recipe?.result?.item_name).toBeTruthy();
      expect(Array.isArray(recipe.recipe?.materials)).toBe(true);
      expect(recipe.recipe?.materials?.length).toBeGreaterThan(0);
      for (const mat of recipe.recipe?.materials || []) {
        expect(mat.item_name).toBeTruthy();
        expect(mat.quantity).toBeGreaterThan(0);
      }
    }
  });

  it("verifies mythic Forge recipes have level requirements between 90 and 96", () => {
    const mythicRecipes = forgeRecipes.filter((item) => item.quality === "MYTHIC");
    for (const recipe of mythicRecipes) {
      expect(recipe.recipe?.level_required).toBeGreaterThanOrEqual(90);
      expect(recipe.recipe?.level_required).toBeLessThanOrEqual(96);
    }
  });

  it("verifies buildForgeRecipeOptions parses all recipes without errors", () => {
    const options = buildForgeRecipeOptions(allItems as any);
    expect(options.length).toBe(forgeRecipes.length);
    for (const opt of options) {
      expect(opt.recipeName).toBeTruthy();
      expect(opt.resultName).toBeTruthy();
      expect(opt.materials.length).toBeGreaterThan(0);
      // No material in options should be a fish
      for (const mat of opt.materials) {
        expect(GAME_FISH_NAMES.has(mat.name)).toBe(false);
      }
    }
  });
});
