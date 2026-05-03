import { ALCHEMY_ITEMS, VENDOR_ITEMS, getMerchantBuyPrice, parseVendorGoldPrice } from "@/constants";

export type SkillName =
  | "Woodcutting"
  | "Mining"
  | "Fishing"
  | "Cooking"
  | "Smelting"
  | "Alchemy"
  | "Forge"
  | "Construction";

export type SkillProfitSortKey =
  | "name"
  | "skill"
  | "profitPerHour"
  | "profitEach"
  | "expPerHour"
  | "expPerSecond"
  | "roi"
  | "level"
  | "itemsPerHour"
  | "finalDuration"
  | "volume3d"
  | "inputCost"
  | "salePrice";

export type MarketDatum = {
  avg_3?: number;
  avg_7?: number;
  avg_14?: number;
  avg_30?: number;
  price?: number;
  vol_3?: number;
  vendor_price?: number;
};

export type MarketData = Record<string, MarketDatum>;

export type ItemLookup = Record<string, { vendor_price?: number; quality?: string; type?: string }>;

export type GearData = Record<string, {
  name: string;
  type: string;
  quality: string;
  combat_req?: number | null;
  vendor_price?: number;
  recipe_hashed_id?: string;
}>;

export type ItemRegistry = Record<string, {
  name: string;
  type?: string;
  quality?: string;
  vendor_price?: number;
  recipe?: {
    skill?: string;
    level_required?: number;
    experience?: number;
    materials?: Array<{
      item_name?: string;
      name?: string;
      quantity?: number;
    }>;
  } | null;
}>;

export type SkillProfitSettings = {
  membership: boolean;
  classBonus: boolean;
  energizingPoolExp: number;
  assaultRank: AssaultRank;
  ascensionBuffIds: string[];
  tools: ToolSelections;
  customPrices?: Record<string, number>;
  barteringBoost: number | "";
};

export type Ingredient = {
  name: string;
  quantity: number;
};

export type SkillRecipe = {
  skill: SkillName;
  name: string;
  level: number;
  baseDuration: number;
  experience: number;
  ingredients: Ingredient[];
  note?: string;
};

export type SkillProfitRow = SkillRecipe & {
  salePrice: number;
  saleSource: "custom" | "market" | "vendor" | "missing";
  marketRevenue: number;
  vendorRevenue: number;
  bestSaleSource: "custom" | "market" | "vendor" | "missing";
  netRevenue: number;
  inputCost: number;
  inputMissing: string[];
  ingredientCosts: Array<Ingredient & { unitPrice: number; totalPrice: number; source: "custom" | "market" | "vendor" | "missing" }>;
  profitEach: number;
  finalDuration: number;
  itemsPerHour: number;
  profitPerHour: number;
  expPerSecond: number;
  expPerHour: number;
  roi: number;
  volume3d: number;
  isLiquid: boolean;
  excludedFromTop: boolean;
  toolBonus: number;
};

export type AssaultRank = "none" | "first" | "second" | "third" | "fourthSeventh" | "eighthTenth";
export type ToolSkill = "Woodcutting" | "Mining" | "Fishing";
export type ToolSelections = Record<ToolSkill, string>;

export const SKILLS: SkillName[] = [
  "Woodcutting",
  "Mining",
  "Fishing",
  "Cooking",
  "Smelting",
  "Alchemy",
  "Forge",
  "Construction",
];

export const DEFAULT_TOOL_SELECTIONS: ToolSelections = {
  Woodcutting: "Simple Felling Axe",
  Mining: "Simple Pickaxe",
  Fishing: "Simple Fishing Rod",
};

export const SKILL_TOOLS: Record<ToolSkill, Array<{
  name: string;
  quality: string;
  level: number;
  vendorValue: number;
  efficiency: number;
}>> = {
  Woodcutting: [
    { name: "Simple Felling Axe", quality: "Standard", level: 1, vendorValue: 1, efficiency: 0 },
    { name: "Improved Felling Axe", quality: "Refined", level: 5, vendorValue: 4, efficiency: 5 },
    { name: "Timberfall Talon", quality: "Refined", level: 10, vendorValue: 6, efficiency: 10 },
    { name: "Wildwood Chopper", quality: "Refined", level: 20, vendorValue: 10, efficiency: 15 },
    { name: "Leafblade", quality: "Premium", level: 35, vendorValue: 25, efficiency: 20 },
    { name: "Grove Cleaver", quality: "Premium", level: 45, vendorValue: 50, efficiency: 25 },
    { name: "Branchbane Hatchet", quality: "Epic", level: 60, vendorValue: 75, efficiency: 30 },
    { name: "Silvan Splitter", quality: "Epic", level: 70, vendorValue: 150, efficiency: 35 },
    { name: "Arboreal Ender", quality: "Legendary", level: 85, vendorValue: 500, efficiency: 40 },
    { name: "Forest Reaver", quality: "Mythic", level: 99, vendorValue: 1000, efficiency: 50 },
  ],
  Mining: [
    { name: "Simple Pickaxe", quality: "Standard", level: 1, vendorValue: 1, efficiency: 0 },
    { name: "Improved Pickaxe", quality: "Refined", level: 5, vendorValue: 4, efficiency: 5 },
    { name: "Veinseeker", quality: "Refined", level: 10, vendorValue: 6, efficiency: 10 },
    { name: "Ironbite", quality: "Refined", level: 20, vendorValue: 10, efficiency: 15 },
    { name: "Boulder Breaker", quality: "Premium", level: 35, vendorValue: 25, efficiency: 20 },
    { name: "Earthshaker", quality: "Premium", level: 45, vendorValue: 50, efficiency: 25 },
    { name: "Stone Splinter", quality: "Epic", level: 60, vendorValue: 75, efficiency: 30 },
    { name: "Corestrike", quality: "Epic", level: 70, vendorValue: 150, efficiency: 35 },
    { name: "Boulder's Bane", quality: "Legendary", level: 85, vendorValue: 500, efficiency: 40 },
    { name: "Earth Destroyer", quality: "Mythic", level: 99, vendorValue: 1000, efficiency: 50 },
  ],
  Fishing: [
    { name: "Simple Fishing Rod", quality: "Standard", level: 1, vendorValue: 1, efficiency: 0 },
    { name: "Improved Fishing Rod", quality: "Refined", level: 5, vendorValue: 4, efficiency: 5 },
    { name: "Rivertamer", quality: "Refined", level: 10, vendorValue: 6, efficiency: 10 },
    { name: "Seasong's Lure", quality: "Refined", level: 20, vendorValue: 10, efficiency: 15 },
    { name: "Hydra's Coil", quality: "Premium", level: 35, vendorValue: 25, efficiency: 20 },
    { name: "Moonshimmer Hook", quality: "Premium", level: 45, vendorValue: 50, efficiency: 25 },
    { name: "Ocean's Whisper", quality: "Epic", level: 60, vendorValue: 75, efficiency: 30 },
    { name: "Rune-Etched Reeler", quality: "Epic", level: 70, vendorValue: 150, efficiency: 35 },
    { name: "Kraken's Grasp", quality: "Legendary", level: 85, vendorValue: 500, efficiency: 40 },
    { name: "Aqua Reaper", quality: "Mythic", level: 99, vendorValue: 1000, efficiency: 50 },
  ],
};

const ALCHEMY_EXPERIENCE: Record<string, number> = {
  "Battle Potion": 52,
  "Lumberjack Essence Crystal": 61,
  "Miners Essence Crystal": 69,
  "Anglers Essence Crystal": 77,
  "Smelting Essence Crystal": 86,
  "Chefs Essence Crystal": 100,
  "Dungeon Potion": 266,
  "Timberfall Essence Crystal": 266,
  "Rocksplitter Essence Crystal": 298,
  "Deepsea Essence Crystal": 330,
  "Bastion Essence": 362,
  "Falcon's Grace Essence": 362,
  "Galeforce Speed Essence": 362,
  "Herculean Strength Essence": 362,
  "Hammerfell Essence Crystal": 362,
  "Flavorburst Essence Crystal": 394,
  "Protection Potion": 805,
  "Felling Essence Crystal": 805,
  "Attack Power Potion": 865,
  "Merfolk Essence Crystal": 865,
  "Precision Essence": 865,
  "Quickstep Essence": 865,
  "Fortified Essence": 865,
  "Titan Power Essence": 865,
  "Oreseeker Essence Crystal": 865,
  "Molten Core Essence Crystal": 1263,
  "Vortex Brew": 1346,
  "Spicefinder Essence Crystal": 1328,
  "Bulwark Brew": 1449,
  "Bladeburst Elixir": 1449,
  "Ironclad Essence": 1553,
  "Acrobatic's Essence": 1863,
  "Strike Essence": 1863,
  "Impenetrable Essence": 1863,
  "Windrider Essence": 1863,
  "Dungeon Master's Tonic": 2277,
  "Yggdrasil Essence Crystal": 2381,
  "Earthcore Essence Crystal": 3312,
  "Riverbend Essence Crystal": 3531,
  "Tampering Essence Crystal": 3623,
  "Shieldbearer's Infusion": 3738,
  "Unyielding Fortitude": 3738,
  "Lightning Sprint": 3738,
  "Twinstrike Elixir": 3738,
  "Stoneheart Solution": 3738,
  "Frenzy Potion": 3853,
};

export const ASCENSION_BUFFS = [
  { id: "exp-1", label: "Lvl 1", type: "Exp", value: 5 },
  { id: "eff-2", label: "Lvl 2", type: "Eff", value: 3 },
  { id: "exp-3", label: "Lvl 3", type: "Exp", value: 7 },
  { id: "eff-4", label: "Lvl 4", type: "Eff", value: 4 },
  { id: "exp-5", label: "Lvl 5", type: "Exp", value: 9 },
  { id: "eff-7", label: "Lvl 7", type: "Eff", value: 5 },
  { id: "exp-10", label: "Lvl 10", type: "Exp", value: 11 },
  { id: "eff-15", label: "Lvl 15", type: "Eff", value: 6 },
  { id: "exp-20", label: "Lvl 20", type: "Exp", value: 13 },
  { id: "eff-35", label: "Lvl 35", type: "Eff", value: 7 },
  { id: "exp-50", label: "Lvl 50", type: "Exp", value: 15 },
  { id: "eff-65", label: "Lvl 65", type: "Eff", value: 8 },
  { id: "exp-75", label: "Lvl 75", type: "Exp", value: 17 },
  { id: "eff-90", label: "Lvl 90", type: "Eff", value: 9 },
  { id: "exp-125", label: "Lvl 125", type: "Exp", value: 19 },
  { id: "eff-140", label: "Lvl 140", type: "Eff", value: 11 },
  { id: "exp-150", label: "Lvl 150", type: "Exp", value: 21 },
  { id: "eff-170", label: "Lvl 170", type: "Eff", value: 12 },
  { id: "exp-190", label: "Lvl 190", type: "Exp", value: 23 },
  { id: "eff-200", label: "Lvl 200", type: "Eff", value: 13 },
  { id: "exp-250", label: "Lvl 250", type: "Exp", value: 25 },
  { id: "eff-300", label: "Lvl 300", type: "Eff", value: 14 },
  { id: "exp-350", label: "Lvl 350", type: "Exp", value: 27 },
  { id: "eff-400", label: "Lvl 400", type: "Eff", value: 15 },
  { id: "exp-450", label: "Lvl 450", type: "Exp", value: 30 },
  { id: "eff-500", label: "Lvl 500", type: "Eff", value: 20 },
] as const;

const ASSAULT_BUFFS: Record<AssaultRank, { exp: number; efficiency: number; label: string }> = {
  none: { exp: 0, efficiency: 0, label: "No conquest buff" },
  first: { exp: 15, efficiency: 3, label: "1st Place (+15% EXP, +3% Eff)" },
  second: { exp: 10, efficiency: 3, label: "2nd Place (+10% EXP, +3% Eff)" },
  third: { exp: 8, efficiency: 3, label: "3rd Place (+8% EXP, +3% Eff)" },
  fourthSeventh: { exp: 6, efficiency: 2, label: "4th-7th (+6% EXP, +2% Eff)" },
  eighthTenth: { exp: 2, efficiency: 1, label: "8th-10th (+2% EXP, +1% Eff)" },
};

export const ASSAULT_OPTIONS = Object.entries(ASSAULT_BUFFS).map(([value, config]) => ({
  value: value as AssaultRank,
  label: config.label,
}));

const gatheringRecipes: SkillRecipe[] = [
  ...[
    ["Oak Log", 1, 12, 3],
    ["Yew Log", 5, 15, 5],
    ["Spruce Log", 10, 23, 10],
    ["Birch Log", 15, 27, 15],
    ["Banyan Log", 25, 31, 21],
    ["Maple Log", 40, 36, 27],
    ["Willow Log", 60, 40, 35],
    ["Mahogany Log", 70, 44, 40],
    ["Mystical Log", 90, 55, 55],
  ].map(([name, level, baseDuration, experience]) => ({
    skill: "Woodcutting" as const,
    name: String(name),
    level: Number(level),
    baseDuration: Number(baseDuration),
    experience: Number(experience),
    ingredients: [],
  })),
  ...[
    ["Coal Ore", 1, 12, 3],
    ["Tin Ore", 1, 12, 3],
    ["Copper Ore", 5, 15, 5],
    ["Iron Ore", 10, 23, 10],
    ["Lead Ore", 15, 27, 15],
    ["Steel Ore", 25, 31, 21],
    ["Mercury Ore", 40, 36, 27],
    ["Chromite Ore", 60, 40, 35],
    ["Uranium Ore", 70, 44, 40],
    ["Mystic Ore", 90, 55, 55],
  ].map(([name, level, baseDuration, experience]) => ({
    skill: "Mining" as const,
    name: String(name),
    level: Number(level),
    baseDuration: Number(baseDuration),
    experience: Number(experience),
    ingredients: [],
  })),
  ...[
    ["Cod", 1, 7, 2, "Cheap Bait"],
    ["Salmon", 3, 10, 4, "Cheap Bait"],
    ["Tuna", 5, 12, 6, "Cheap Bait"],
    ["Trout", 8, 14, 8, "Tarnished Bait"],
    ["Perch", 11, 16, 10, "Tarnished Bait"],
    ["Herring", 15, 18, 13, "Gleaming Bait"],
    ["Sardines", 25, 21, 16, "Gleaming Bait"],
    ["Lobster", 30, 24, 19, "Elemental Bait"],
    ["Crab", 40, 27, 22, "Elemental Bait"],
    ["Turtle", 50, 32, 27, "Eldritch Bait"],
    ["Stingray", 60, 40, 35, "Eldritch Bait"],
    ["Lantern Fish", 80, 41, 40, "Arcane Bait"],
    ["Great White Shark", 90, 45, 55, "Arcane Bait"],
  ].map(([name, level, baseDuration, experience, bait]) => ({
    skill: "Fishing" as const,
    name: String(name),
    level: Number(level),
    baseDuration: Number(baseDuration),
    experience: Number(experience),
    ingredients: [{ name: String(bait), quantity: 1 }],
  })),
  ...[
    ["Clay", 1, 50, 10],
    ["Sand", 1, 50, 10],
  ].map(([name, level, baseDuration, experience]) => ({
    skill: "Construction" as const,
    name: String(name),
    level: Number(level),
    baseDuration: Number(baseDuration),
    experience: Number(experience),
    ingredients: [],
    note: "Gathering resource",
  })),
];

const refiningRecipes: SkillRecipe[] = [
  ...[
    ["Tin Bar", 1, 12, 3, "Tin Ore"],
    ["Copper Bar", 5, 15, 5, "Copper Ore"],
    ["Iron Bar", 10, 23, 10, "Iron Ore"],
    ["Lead Bar", 15, 27, 15, "Lead Ore"],
    ["Steel Bar", 25, 31, 21, "Steel Ore"],
    ["Mercury Bar", 40, 36, 27, "Mercury Ore"],
    ["Chromite Bar", 60, 40, 35, "Chromite Ore"],
    ["Uranium Bar", 70, 44, 40, "Uranium Ore"],
    ["Mystic Bar", 90, 55, 55, "Mystic Ore"],
  ].map(([name, level, baseDuration, experience, ore]) => ({
    skill: "Smelting" as const,
    name: String(name),
    level: Number(level),
    baseDuration: Number(baseDuration),
    experience: Number(experience),
    ingredients: [
      { name: String(ore), quantity: 1 },
      { name: "Coal Ore", quantity: 1 },
    ],
  })),
  ...[
    ["Cooked Cod", 1, 8, 2, "Cod"],
    ["Cooked Salmon", 3, 12, 4, "Salmon"],
    ["Cooked Tuna", 5, 14, 6, "Tuna"],
    ["Cooked Trout", 8, 17, 8, "Trout"],
    ["Cooked Perch", 11, 19, 10, "Perch"],
    ["Cooked Herring", 15, 22, 13, "Herring"],
    ["Cooked Sardines", 25, 25, 16, "Sardines"],
    ["Cooked Lobster", 30, 28, 19, "Lobster"],
    ["Cooked Crab", 40, 30, 22, "Crab"],
    ["Cooked Turtle", 50, 35, 27, "Turtle"],
    ["Cooked Stingray", 60, 40, 35, "Stingray"],
    ["Cooked Lantern Fish", 80, 42, 40, "Lantern Fish"],
    ["Cooked Great White Shark", 90, 55, 55, "Great White Shark"],
  ].map(([name, level, baseDuration, experience, fish]) => ({
    skill: "Cooking" as const,
    name: String(name),
    level: Number(level),
    baseDuration: Number(baseDuration),
    experience: Number(experience),
    ingredients: [
      { name: String(fish), quantity: 1 },
      { name: "Coal Ore", quantity: 1 },
    ],
  })),
  ...[
    ["Weak Plank", 1, 60, 15, [{ name: "Oak Log", quantity: 3 }]],
    ["Weak Beam", 15, 135, 75, [{ name: "Birch Log", quantity: 3 }, { name: "Banyan Log", quantity: 3 }]],
    ["Robust Plank", 30, 155, 105, [{ name: "Banyan Log", quantity: 3 }]],
    ["Robust Beam", 45, 190, 150, [{ name: "Maple Log", quantity: 3 }, { name: "Willow Log", quantity: 3 }]],
    ["Strong Plank", 65, 210, 190, [{ name: "Willow Log", quantity: 3 }]],
    ["Strong Beam", 75, 240, 225, [{ name: "Mahogany Log", quantity: 3 }, { name: "Mystical Log", quantity: 3 }]],
    ["Brick", 10, 115, 50, [{ name: "Clay", quantity: 3 }]],
    ["Glass", 15, 135, 75, [{ name: "Sand", quantity: 3 }, { name: "Limestone", quantity: 3 }]],
    ["Iron Fitting", 10, 115, 50, [{ name: "Iron Bar", quantity: 3 }]],
  ].map(([name, level, baseDuration, experience, ingredients]) => ({
    skill: "Construction" as const,
    name: String(name),
    level: Number(level),
    baseDuration: Number(baseDuration),
    experience: Number(experience),
    ingredients: ingredients as Ingredient[],
    note: "3:1 material refining",
  })),
];

const alchemyRecipes: SkillRecipe[] = Object.entries(ALCHEMY_ITEMS)
  .filter(([, recipe]) => recipe.level < 90)
  .map(([name, recipe]) => ({
    skill: "Alchemy",
    name,
    level: recipe.level,
    baseDuration: recipe.time,
    experience: ALCHEMY_EXPERIENCE[name] || 0,
    ingredients: [
      ...Object.entries(recipe.materials).map(([material, quantity]) => ({
        name: material,
        quantity,
      })),
      { name: recipe.vial, quantity: 1 },
    ],
  }));

export const SKILL_RECIPES: SkillRecipe[] = [
  ...gatheringRecipes,
  ...refiningRecipes,
  ...alchemyRecipes,
];

export function buildForgeRecipes(
  gearData: GearData | null,
  itemRegistry: ItemRegistry | null,
): SkillRecipe[] {
  if (!gearData || !itemRegistry) return [];

  return Object.values(gearData)
    .filter((gear) => {
      if (!gear.recipe_hashed_id) return false;
      if (gear.quality === "MYTHIC") return false;
      if (["FISHING_ROD", "PICKAXE", "FELLING_AXE"].includes(gear.type)) {
        return ["REFINED", "PREMIUM"].includes(gear.quality);
      }
      return typeof gear.combat_req === "number" && gear.combat_req >= 60 && gear.combat_req <= 70;
    })
    .flatMap((gear) => {
      const recipeItem = itemRegistry[gear.recipe_hashed_id || ""];
      const recipe = recipeItem?.recipe;
      if (!recipe || recipe.skill !== "Forge") return [];
      return [{
        skill: "Forge" as const,
        name: gear.name,
        level: recipe.level_required || 1,
        baseDuration: 60,
        experience: recipe.experience || 0,
        ingredients: [
          ...(recipe.materials || []).map((material) => ({
            name: material.item_name || material.name || "Unknown",
            quantity: material.quantity || 1,
          })),
          { name: recipeItem.name, quantity: 1 },
        ].filter((ingredient) => ingredient.name !== "Unknown"),
        note: `${gear.quality.toLowerCase()} ${gear.type.replace(/_/g, " ").toLowerCase()} recipe`,
      }];
    })
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export function getBuffTotals(settings: SkillProfitSettings, includeAscension = true, skill?: SkillName | "All") {
  const ascension = settings.ascensionBuffIds
    .map((id) => ASCENSION_BUFFS.find((buff) => buff.id === id))
    .filter((buff): buff is (typeof ASCENSION_BUFFS)[number] => Boolean(buff));

  const ascensionEfficiency = includeAscension ? ascension
    .filter((buff) => buff.type === "Eff")
    .reduce((sum, buff) => sum + buff.value, 0) : 0;
  const ascensionExp = includeAscension ? ascension
    .filter((buff) => buff.type === "Exp")
    .reduce((sum, buff) => sum + buff.value, 0) : 0;
  const assault = ASSAULT_BUFFS[settings.assaultRank];
  const supportsClass = !skill || skill === "All" || (skill !== "Alchemy" && skill !== "Forge" && skill !== "Construction");

  return {
    efficiency:
      (settings.membership ? 10 : 0) +
      (settings.classBonus && supportsClass ? 10 : 0) +
      assault.efficiency +
      ascensionEfficiency,
    experience:
      (settings.membership ? 15 : 0) +
      (settings.classBonus && supportsClass ? 10 : 0) +
      settings.energizingPoolExp +
      assault.exp +
      ascensionExp,
  };
}

export function calculateSkillProfitRows(
  marketData: MarketData | null,
  items: ItemLookup | null,
  settings: SkillProfitSettings,
  dynamicRecipes: SkillRecipe[] = [],
  minVolume = 0,
) {
  const taxMultiplier = settings.membership ? 0.88 : 0.85;
  const barterMultiplier = 1 + ((Number(settings.barteringBoost) || 0) / 100);

  return [...SKILL_RECIPES, ...dynamicRecipes].map((recipe): SkillProfitRow => {
    const buffs = getBuffTotals(settings, recipe.skill !== "Construction", recipe.skill);
    const toolBonus = getToolEfficiencyBonus(settings, recipe.skill);
    const sale = getPrice(recipe.name, marketData, items, settings.customPrices);
    const vendorBase = getVendorPrice(recipe.name, marketData, items);
    const ingredientPrices = recipe.ingredients.map((ingredient) => ({
      ingredient,
      price: getPrice(ingredient.name, marketData, items, settings.customPrices),
    }));
    const inputMissing = ingredientPrices
      .filter(({ price }) => price.source === "missing")
      .map(({ ingredient }) => ingredient.name);
    const ingredientCosts = ingredientPrices.map(({ ingredient, price }) => ({
      ...ingredient,
      unitPrice: price.value,
      totalPrice: price.value * ingredient.quantity,
      source: price.source,
    }));
    const inputCost = ingredientPrices.reduce(
      (sum, { ingredient, price }) => sum + price.value * ingredient.quantity,
      0,
    );
    const marketRevenue = sale.source === "market" || sale.source === "custom" ? sale.value * taxMultiplier : 0;
    const vendorRevenue = vendorBase * barterMultiplier;
    const bestSaleSource = marketRevenue <= 0 && vendorRevenue <= 0
      ? "missing"
      : vendorRevenue > marketRevenue
        ? "vendor"
        : sale.source === "custom" ? "custom" : "market";
    const netRevenue = bestSaleSource === "vendor" ? vendorRevenue : marketRevenue;
    const profitEach = netRevenue - inputCost;
    const finalDuration = recipe.baseDuration / ((buffs.efficiency + toolBonus + 100) / 100);
    const itemsPerHour = Math.round(3600 / finalDuration);
    const profitPerHour = Math.round(profitEach * itemsPerHour);
    const expPerAction = recipe.experience * ((buffs.experience + 100) / 100);
    const expPerSecond = expPerAction / finalDuration;
    const volume3d = marketData?.[recipe.name]?.vol_3 || 0;
    const isLiquid = sale.source !== "market" || volume3d >= minVolume;

    return {
      ...recipe,
      salePrice: sale.value,
      saleSource: sale.source,
      marketRevenue: Math.round(marketRevenue),
      vendorRevenue: Math.round(vendorRevenue),
      bestSaleSource,
      netRevenue: Math.round(netRevenue),
      inputCost: Math.round(inputCost),
      inputMissing,
      ingredientCosts,
      profitEach: Math.round(profitEach),
      finalDuration,
      itemsPerHour,
      profitPerHour,
      expPerSecond,
      expPerHour: Math.round(expPerSecond * 3600),
      roi: inputCost > 0 ? (profitEach / inputCost) * 100 : profitEach > 0 ? 100 : 0,
      volume3d,
      isLiquid,
      excludedFromTop: recipe.skill === "Forge" || !isLiquid,
      toolBonus,
    };
  });
}

function getToolEfficiencyBonus(settings: SkillProfitSettings, skill: SkillName) {
  if (skill !== "Woodcutting" && skill !== "Mining" && skill !== "Fishing") return 0;
  const selectedTool = settings.tools?.[skill] || DEFAULT_TOOL_SELECTIONS[skill];
  return SKILL_TOOLS[skill].find((tool) => tool.name === selectedTool)?.efficiency || 0;
}

function getPrice(
  name: string,
  marketData: MarketData | null,
  items: ItemLookup | null,
  customPrices?: Record<string, number>,
): { value: number; source: "custom" | "market" | "vendor" | "missing" } {
  const customPrice = customPrices?.[name];
  if (Number(customPrice) > 0) return { value: Number(customPrice), source: "custom" };

  const marketPrice = marketData?.[name]?.avg_3 || marketData?.[name]?.price || 0;
  if (marketPrice > 0) return { value: marketPrice, source: "market" };

  const merchantBuyPrice = getMerchantBuyPrice(name);
  if (merchantBuyPrice > 0) return { value: merchantBuyPrice, source: "vendor" };

  const vendorPrice = items?.[name]?.vendor_price || marketData?.[name]?.vendor_price || 0;
  if (vendorPrice > 0) return { value: vendorPrice, source: "vendor" };

  return { value: 0, source: "missing" };
}

function getVendorPrice(
  name: string,
  marketData: MarketData | null,
  items: ItemLookup | null,
) {
  const directVendor = marketData?.[name]?.vendor_price || items?.[name]?.vendor_price || 0;
  if (directVendor > 0) return directVendor;
  const vendorItem = VENDOR_ITEMS[name];
  if (vendorItem?.currency === "Gold") {
    return parseVendorGoldPrice(name);
  }
  return 0;
}
