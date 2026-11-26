/**
 * Base Crafting Recipes for IdleMMO
 *
 * Covers standard unscripted crafts that are available to all players:
 * 1. Smelting: 9 metal bars (1x Ore + 1x Coal Ore)
 * 2. Cooking: 13 cooked fish (1x Fish + 1x Coal Ore)
 * 3. Forge Bows: 9 bows (10x Log + 5x Coal Ore)
 * 4. Forge Weapons & Gear: 72 items across 9 metals and 8 gear slots (10x Bar + 5x Coal Ore)
 */

export const DEFAULT_SMELTING_RECIPES = {
  "Tin Bar": { level: 1, materials: [{ name: "Tin Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Copper Bar": { level: 5, materials: [{ name: "Copper Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Iron Bar": { level: 10, materials: [{ name: "Iron Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Lead Bar": { level: 15, materials: [{ name: "Lead Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Steel Bar": { level: 25, materials: [{ name: "Steel Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Mercury Bar": { level: 40, materials: [{ name: "Mercury Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Chromite Bar": { level: 60, materials: [{ name: "Chromite Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Uranium Bar": { level: 70, materials: [{ name: "Uranium Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Mystic Bar": { level: 90, materials: [{ name: "Mystic Ore", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
};

export const DEFAULT_COOKING_RECIPES = {
  "Cooked Cod": { level: 1, materials: [{ name: "Cod", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Salmon": { level: 3, materials: [{ name: "Salmon", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Tuna": { level: 5, materials: [{ name: "Tuna", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Trout": { level: 8, materials: [{ name: "Trout", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Perch": { level: 11, materials: [{ name: "Perch", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Herring": { level: 15, materials: [{ name: "Herring", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Sardines": { level: 25, materials: [{ name: "Sardines", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Lobster": { level: 30, materials: [{ name: "Lobster", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Crab": { level: 40, materials: [{ name: "Crab", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Turtle": { level: 50, materials: [{ name: "Turtle", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Stingray": { level: 60, materials: [{ name: "Stingray", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Lantern Fish": { level: 80, materials: [{ name: "Lantern Fish", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
  "Cooked Great White Shark": { level: 90, materials: [{ name: "Great White Shark", amount: 1 }, { name: "Coal Ore", amount: 1 }] },
};

export const DEFAULT_FORGE_BOW_RECIPES = {
  "Oak Bow": { level: 1, materials: [{ name: "Oak Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Yew Bow": { level: 5, materials: [{ name: "Yew Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Spruce Bow": { level: 10, materials: [{ name: "Spruce Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Birch Bow": { level: 15, materials: [{ name: "Birch Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Banyan Bow": { level: 25, materials: [{ name: "Banyan Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Maple Bow": { level: 35, materials: [{ name: "Maple Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Willow Bow": { level: 50, materials: [{ name: "Willow Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Mahogany Bow": { level: 65, materials: [{ name: "Mahogany Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
  "Mystical Bow": { level: 70, materials: [{ name: "Mystical Log", amount: 10 }, { name: "Coal Ore", amount: 5 }] },
};

const BASE_METALS = [
  { name: "Tin", level: 1 },
  { name: "Copper", level: 5 },
  { name: "Iron", level: 10 },
  { name: "Lead", level: 15 },
  { name: "Steel", level: 25 },
  { name: "Mercury", level: 35 },
  { name: "Chromite", level: 50 },
  { name: "Uranium", level: 65 },
  { name: "Mystic", level: 70 },
];

const BASE_GEAR_SLOTS = [
  "Sword",
  "Dagger",
  "Shield",
  "Helmet",
  "Chestplate",
  "Greaves",
  "Boots",
  "Gauntlets",
];

export const DEFAULT_FORGE_GEAR_RECIPES = {};

BASE_METALS.forEach((metal) => {
  BASE_GEAR_SLOTS.forEach((slot) => {
    const itemName = `${metal.name} ${slot}`;
    const barName = `${metal.name} Bar`;
    DEFAULT_FORGE_GEAR_RECIPES[itemName] = {
      level: metal.level,
      materials: [
        { name: barName, amount: 10 },
        { name: "Coal Ore", amount: 5 },
      ],
    };
  });
});

export const DEFAULT_CONSTRUCTION_RECIPES = {
  "Weak Plank": {
    level: 1,
    materials: [{ name: "Oak Log", amount: 3 }],
  },
  Brick: {
    level: 10,
    materials: [{ name: "Clay", amount: 3 }],
  },
  "Iron Fitting": {
    level: 10,
    materials: [{ name: "Iron Bar", amount: 3 }],
  },
  "Weak Beam": {
    level: 15,
    materials: [
      { name: "Birch Log", amount: 3 },
      { name: "Banyan Log", amount: 3 },
    ],
  },
  Glass: {
    level: 15,
    materials: [
      { name: "Limestone", amount: 3 },
      { name: "Sand", amount: 3 },
    ],
  },
  "Robust Plank": {
    level: 30,
    materials: [{ name: "Banyan Log", amount: 3 }],
  },
  "Robust Beam": {
    level: 45,
    materials: [
      { name: "Maple Log", amount: 3 },
      { name: "Willow Log", amount: 3 },
    ],
  },
  "Strong Plank": {
    level: 65,
    materials: [{ name: "Willow Log", amount: 3 }],
  },
  "Strong Beam": {
    level: 75,
    materials: [
      { name: "Mahogany Log", amount: 3 },
      { name: "Mystical Log", amount: 3 },
    ],
  },
};
