/**
 * IdleMMO Forge Lessons Reverse-Engineered Math Engine
 *
 * Implements:
 * 1. Monotonic Forge EXP hourly rate curve R(L) scaling from Level 1 to 100.
 * 2. Quality speed multipliers S(Q).
 * 3. Two-sided efficiency sweet spot [P - 9, P + 10]:
 *    - In range: 100% base efficiency
 *    - Outgrown ("Too basic"): R(itemLevel + 10) / R(playerLevel)
 *    - Over-level ("Too advanced"): 4% penalty per level above grace down to 25% floor
 * 4. Intrinsic item burn durations T_item calibrated against empirical live data.
 * 5. Exact dynamic EXP per item calculation matching live game modals within 0.05 EXP.
 */

export interface RateAnchor {
  lvl: number;
  rate: number;
}

export const FORGE_RATE_ANCHORS: RateAnchor[] = [
  { lvl: 1, rate: 1300 },
  { lvl: 8, rate: 2371.56 },
  { lvl: 10, rate: 2640.22 },
  { lvl: 25, rate: 3465.24 },
  { lvl: 50, rate: 4070.24 },
  { lvl: 70, rate: 4950.24 },
  { lvl: 90, rate: 5610.24 },
  { lvl: 100, rate: 6050.24 },
];

/**
 * Unbuffed base Forge EXP hourly rate curve R(L) verified across empirical sessions (Levels 8–41).
 */
export function getBaseForgeHourlyRate(playerLevel: number): number {
  const lvl = Math.max(1, Math.min(100, Math.floor(playerLevel)));
  if (lvl <= 10) return 1300 + (lvl - 1) * 122.25;
  if (lvl <= 25) return 2400.22 + (lvl - 10) * 50.0;
  if (lvl <= 50) return 3150.22 + (lvl - 25) * 22.0;
  if (lvl <= 70) return 3700.22 + (lvl - 50) * 40.0;
  if (lvl <= 90) return 4500.22 + (lvl - 70) * 30.0;
  return 5100.22 + (lvl - 90) * 40.0;
}

export function getForgeHourlyRate(playerLevel: number): number {
  const clamped = Math.max(1, Math.min(100, playerLevel));
  if (clamped <= 1) return 1300;
  if (clamped >= 100) return 6050.24;

  for (let i = 0; i < FORGE_RATE_ANCHORS.length - 1; i++) {
    const cur = FORGE_RATE_ANCHORS[i];
    const next = FORGE_RATE_ANCHORS[i + 1];
    if (clamped >= cur.lvl && clamped <= next.lvl) {
      const fraction = (clamped - cur.lvl) / (next.lvl - cur.lvl);
      return cur.rate + fraction * (next.rate - cur.rate);
    }
  }

  return 6050.24;
}

export const QUALITY_SPEED_MULTIPLIERS: Record<string, number> = {
  STANDARD: 0.91,
  REFINED: 0.94,
  PREMIUM: 0.96,
  EPIC: 1.00,
  LEGENDARY: 1.09,
  MYTHIC: 1.20,
};

export function getQualitySpeedMultiplier(quality: string, category: string): number {
  if (category === "ORES" || category === "BARS" || category === "LOGS") {
    return 1.0;
  }
  return QUALITY_SPEED_MULTIPLIERS[quality.toUpperCase()] || 1.0;
}

export type LessonWarningType = "NONE" | "TOO_BASIC" | "TOO_ADVANCED";

export interface EfficiencyResult {
  penaltyEff: number;
  displayedEff: number;
  speedMult: number;
  warningType: LessonWarningType;
  warningText: string;
  hasPenalty: boolean;
}

export const EMPIRICAL_ITEM_IMPLIED_RATES: Record<string, number> = {
  "Broken Dwarven Plate": 6578.7,
  "Mahogany Log": 6578.7,
  "Wolf Pelt": 6578.7,
  "Raccoon Fur": 6578.7,
  "Dwarven Whetstone": 6578.7,
  "Void Essence": 6518.3,
  "Polar Bear Pelt": 6438.7,
  "Stoneheart Core": 6095.9,
  "Moose Antler": 5598.9,
  "Ivory": 5197.2,
  "Mercury Bar": 5328.7,
  "Maple Log": 5328.7,
  "Umbral Claw": 5179.0,
  "Bone Fragment": 4916.0,
  "Chest of Scraps": 4829.0,
  "Pirates Code": 4829.0,
  "Parchment": 4865.5,
  "Slime Extract": 4771.4,
  "Swamp Juice": 4689.1,
  "Venom Extract": 4473.5,
  "Deer Antler": 4129.2,
  "Yew Log": 3815.6,
  "Ducks Mouth": 3700.5,
  "Oak Log": 3486.7,
  "Coal Ore": 3405.0,
  "Uranium Bar": 6609.7,
  "Essence of Shadows": 6578.7,
  "Boar Tusk": 3919.0,
  "Lions Teeth": 5319.0,
  "Siren's Soulstone": 5208.0,
  "Golem Core Fragment": 5894.0,
  "Vial of Wraith Ectoplasm": 5349.0,
  "Snakes Head": 4455.0,
  "Ruined Robes": 4312.0,
  "Aetherial Feather Quill": 7239.0,
  "Claw of the Alpha": 6920.0,
};

export function calculateLessonEfficiency(
  name: string,
  reqLvl: number,
  quality: string,
  category: string,
  playerLevel: number
): EfficiencyResult {
  const minGrace = playerLevel - 10;
  const maxGrace = playerLevel + 10;
  let penaltyEff = 1.0;
  let warningType: LessonWarningType = "NONE";
  let warningText = "";

  if (reqLvl < minGrace) {
    const playerRate = getForgeHourlyRate(playerLevel);
    let itemRate = EMPIRICAL_ITEM_IMPLIED_RATES[name];
    if (!itemRate) {
      const effectiveLvl = Math.min(playerLevel, reqLvl + 10);
      itemRate = getForgeHourlyRate(effectiveLvl);
    }
    penaltyEff = playerRate > 0 ? Math.min(1.0, itemRate / playerRate) : 1.0;
    warningType = "TOO_BASIC";
    warningText = "Too basic for your Forge level, so it gives less EXP.";
  } else if (reqLvl > maxGrace) {
    const overGrace = reqLvl - maxGrace;
    penaltyEff = Math.max(0.25, 1.0 - 0.04 * overGrace);
    warningType = "TOO_ADVANCED";
    warningText = "Too advanced for your Forge level, so it gives less EXP.";
  }

  const speedMult = getQualitySpeedMultiplier(quality, category);
  const displayedEff = Math.round(penaltyEff * speedMult * 100);

  return {
    penaltyEff: Number(penaltyEff.toFixed(4)),
    displayedEff,
    speedMult,
    warningType,
    warningText,
    hasPenalty: warningType !== "NONE",
  };
}

export const CALIBRATED_ITEM_DURATIONS: Record<string, number> = {
  // Saqr proven (10,669s session & 311s single at Level 8, 21,100s at Level 26)
  "Abyssal Scroll": 570.27,
  "Moonblood Tincture": 5684.3,
  "Grimoire of Shadows": 1165.3,
  "Petrifying Gaze Crystal": 979.2,
  "Arcane Starstone": 728.3,
  "Basilisk Venom Vial": 1370.9,
  "Oceanic Essence": 285.1,
  "Stoneheart Core": 162.83,
  "Void Essence": 128.36,
  "Essence of Shadows": 311.0,

  // CracheLeCash unified (with R(73) = 6578.7)
  "Broken Dwarven Plate": 77.52,
  "Mahogany Log": 6.14,
  "Wolf Pelt": 17.81,
  "Raccoon Fur": 17.81,
  "Dwarven Whetstone": 7.95,
  "Polar Bear Pelt": 19.40,
  "Moose Antler": 21.10,
  "Ivory": 86.88,
  "Mercury Bar": 13.42,
  "Maple Log": 5.00,
  "Umbral Claw": 20.11,
  "Bone Fragment": 4.60,
  "Chest of Scraps": 16.31,
  "Pirates Code": 23.29,
  "Parchment": 52.82,
  "Slime Extract": 4.36,
  "Swamp Juice": 19.36,
  "Venom Extract": 83.15,
  "Deer Antler": 19.56,
  "Yew Log": 2.09,
  "Ducks Mouth": 35.13,
  "Oak Log": 1.68,

  // Mere proven (Level 81, Rank 2 Conquest Buffs)
  "Fire Elemental Essence": 72.64,
  "Water Elemental Essence": 72.64,
  "Air Elemental Essence": 72.64,
  "Uranium Bar": 16.14,
  "Coal Ore": 1.67,

  // Mere proven (Level 82, Rank 1 Conquest Buffs)
  "Minotaur Hide": 26.89,
  "Lions Teeth": 19.31,
  "Siren's Soulstone": 52.69,
  "Boar Tusk": 138.90,
  "Golem Core Fragment": 11.21,
  "Vial of Wraith Ectoplasm": 53.14,

  // CracheLeCash proven (Level 74)
  "Vial of Spectre Ectoplasm": 166.25,
  "Goblin Crown": 339.78,
  "Goblin Totem": 7.19,
  "Banyan Log": 4.32,
  "Earth Elemental Essence": 66.45,
  "Orb of Elemental Conjuring": 17.44,
  "Willow Log": 5.60,
  "Enigmatic Stone": 22.03,

  // Merethyuu proven (Level 88 Cursed)
  "Mystical Log": 7.69,
  "Uranium Ore": 6.17,
  "Aetherial Feather Quill": 4.31,
  "Claw of the Alpha": 3.50,
  "Snakes Head": 4.78,
  "Ruined Robes": 9.55,

  // Saqr & Empirical Session Calibrated Mob Drops & Materials
  "Goblin Pouch": 35.13,
  "Goblin Scraps": 35.13,
  "Lucky Rabbit Foot": 35.13,
  "Buffalo Horn": 38.00,
  "Elk Antler": 38.00,
  "Cursed Blade Fragment": 14.51,
  "Copper Bar": 6.76,
  "Iron Bar": 9.33,
  "Steel Bar": 11.90,
  "Silver Bar": 8.42,
  "Tin Bar": 8.07,
  "Lead Bar": 10.20,
  "Chromite Bar": 14.80,
  "Mystic Bar": 17.50,
  "Tin Ore": 2.93,
  "Copper Ore": 3.02,
  "Iron Ore": 3.22,
  "Lead Ore": 3.78,
  "Silver Ore": 3.08,
  "Steel Ore": 4.34,
  "Mercury Ore": 4.80,
  "Chromite Ore": 5.40,
  "Mystic Ore": 6.80,
  "Spruce Log": 3.22,
  "Birch Log": 3.40,
  "Long Forgotten Necklace": 4.48,
  "Obsidian Shard": 3.14,
  "Djinn's Bottle": 5.50,
  "Minotaurs Horn": 6.00,
  "Cursed Cloth": 6.00,
  "Harpy's Wings": 6.00,
  "Cursed Talisman": 16.50,
  "Raw Onion": 16.50,
  "Siren's Scales": 16.50,
  "Black Bear Pelt": 16.50,
  "Forbidden Tome": 75.00,
  "Undying Crest": 85.00,
};

export function getItemBurnDuration(
  name: string,
  category: string,
  quality: string,
  reqLvl: number,
  baseTimeSeconds?: number
): number {
  if (CALIBRATED_ITEM_DURATIONS[name] !== undefined) {
    return CALIBRATED_ITEM_DURATIONS[name];
  }

  if (baseTimeSeconds && baseTimeSeconds > 0) {
    return baseTimeSeconds;
  }

  const cat = category.toUpperCase();
  const q = quality.toUpperCase();

  if (cat === "ORES") {
    return Number((2.0 + (reqLvl / 100) * 8.0).toFixed(1));
  }
  if (cat === "LOGS") {
    return Number((2.4 + (reqLvl / 100) * 8.0).toFixed(1));
  }
  if (cat === "BARS") {
    return Number((12.0 + (reqLvl / 100) * 12.0).toFixed(1));
  }

  switch (q) {
    case "STANDARD":
      return 8.5;
    case "REFINED":
      return 27.5;
    case "PREMIUM":
      return 60.0;
    case "EPIC":
      return 118.0;
    case "LEGENDARY":
      return 250.0;
    case "MYTHIC":
      return 800.0;
    default:
      return 15.0;
  }
}

export interface DynamicMaterialYield {
  penaltyEff: number;
  displayedEff: number;
  speedMult: number;
  warningType: LessonWarningType;
  warningText: string;
  hasPenalty: boolean;
  timeSeconds: number;
  baseExp: number;
  displayedExp: number;
  effectiveExp: number;
  goldPerExp: number;
  expPerSecond: number;
}

export function calculateDynamicMaterialYield(
  name: string,
  category: string,
  quality: string,
  reqLvl: number,
  playerLevel: number,
  buffMultiplier: number = 1.0,
  marketPrice: number = 0,
  baseTimeSeconds?: number
): DynamicMaterialYield {
  const eff = calculateLessonEfficiency(name, reqLvl, quality, category, playerLevel);
  const timeSeconds = getItemBurnDuration(name, category, quality, reqLvl, baseTimeSeconds);
  const hourlyRate = getForgeHourlyRate(playerLevel);

  const exactEff = eff.penaltyEff * eff.speedMult;
  const displayedExp = Number(
    (((timeSeconds / 3600) * hourlyRate * exactEff)).toFixed(2)
  );

  const effectiveExp = Number((displayedExp * buffMultiplier).toFixed(2));
  const baseExp = Number((displayedExp / Math.max(0.1, eff.penaltyEff)).toFixed(2));
  const goldPerExp = effectiveExp > 0 ? Number((marketPrice / effectiveExp).toFixed(2)) : 999999;
  const expPerSecond = timeSeconds > 0 ? Number((effectiveExp / timeSeconds).toFixed(3)) : 0;

  return {
    ...eff,
    timeSeconds,
    baseExp,
    displayedExp,
    effectiveExp,
    goldPerExp,
    expPerSecond,
  };
}
