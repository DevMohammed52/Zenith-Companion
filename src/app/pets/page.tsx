"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownUp,
  BadgeInfo,
  BarChart3,
  ChevronDown,
  ChevronsUp,
  Database,
  Dumbbell,
  Egg,
  Gauge,
  HeartPulse,
  PawPrint,
  Search,
  Shield,
  Swords,
  X,
  Zap,
} from "lucide-react";
import { useItemModal } from "@/context/ItemModalContext";

type Quality =
  | "STANDARD"
  | "REFINED"
  | "PREMIUM"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"
  | "UNIQUE"
  | "UNKNOWN";

type StatKey =
  | "agility"
  | "accuracy"
  | "protection"
  | "attack_power"
  | "movement_speed"
  | "max_health"
  | "max_stamina"
  | "critical_damage"
  | "critical_chance";

type PetStat = {
  base: number;
  per_level: number;
};

type PetEgg = {
  name: string;
  hashedId?: string;
  imageUrl?: string | null;
  quality: Quality;
  vendorPrice?: number | null;
  isTradeable?: boolean;
  worldBosses?: Array<{ id?: number; name: string }>;
};

type PetAcquisition = {
  boss?: string;
  location?: string;
  levelRequirement?: string;
  egg?: string;
  chancePercent?: number | null;
  quality?: Quality;
};

type PetExchange = {
  listingCount: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  averagePrice?: number | null;
  medianPrice?: number | null;
  sampleListings?: Array<{ level?: number | null; quality?: Quality; price?: number | null }>;
};

type PetSourceOverride = {
  type: "merchant" | "event" | "unique";
  availability?: string;
  label: string;
  imageUrl?: string | null;
  merchant?: {
    name: string;
    url: string;
    currency?: string | null;
    price?: number | null;
  } | null;
  notes?: string[];
};

type BattleZone = {
  zone: string;
  battleTimeSeconds?: number | null;
  enemiesBattled?: number | null;
  lootPieces?: number | null;
  expectedRevenuePerBattle?: number | null;
  expectedRevenuePerHour?: number | null;
  expectedProfitPerBattle?: number | null;
  expectedProfitPerHourWithSleep?: number | null;
  expectedProfitPerHourNoSleep?: number | null;
  expectedProfitPerHourHealingWithSleep?: number | null;
  profitMargin?: number | null;
  foodCostPerHourCheapest?: number | null;
  cycle?: {
    maxStamina?: number | null;
    staminaDrainPerHour?: number | null;
    staminaDrainPerBattle?: number | null;
    timeBattledForZeroStaminaSeconds?: number | null;
    staminaRecoveryZeroToFullSeconds?: number | null;
    battlesBeforeSleep?: number | null;
    healthRecoveryZeroToFullSeconds?: number | null;
    sleepToBattleForStamina?: number | null;
    battleToSleepForHp?: number | null;
  };
  drops?: Array<{
    itemName?: string | null;
    expectedDropPercent?: number | null;
    totalDrops?: number | null;
    dropValueShareMaxPrice?: number | null;
    dropValueShareVendor?: number | null;
    dropValueShare?: number | null;
    valueShareMaxPrice?: number | null;
    valueSharePercent?: number | null;
    prices?: Record<string, number | null> | null;
    source?: string;
  }>;
  ranking?: {
    rank?: string | null;
    profit_per_hour_pm100?: number | null;
    pet_exp_profit_efficiency_scale?: number | null;
  } | null;
};

type PetRecord = {
  id?: number | null;
  hashedId?: string | null;
  name: string;
  quality: Quality;
  imageUrl?: string | null;
  description?: string | null;
  egg?: PetEgg | null;
  stats?: Partial<Record<StatKey, PetStat>> | null;
  acquisition?: PetAcquisition[];
  sourceOverride?: PetSourceOverride | null;
  rarity?: {
    codexId?: string;
    worldBoss?: string;
    dropChancePercent?: number | null;
  } | null;
  exchange?: PetExchange | null;
  valuation?: {
    eggPrice?: number | null;
    level100Bonus?: number | null;
    samples?: Array<{ level?: number | null; rarity?: string | null; eggPrice?: number | null; roughEstimate?: number | null }>;
  } | null;
  battle?: {
    zones?: BattleZone[];
  };
};

type MasteryLevel = {
  level: number;
  stat_bonus_percent?: number | null;
  loot_chance?: number | null;
  concurrent_battles?: number | null;
};

type PetDatabase = {
  meta: {
    generatedAt: string;
    verificationStatus: string;
    counts?: {
      pets: number;
      petsWithStats: number;
      petsWithEggs: number;
      petsWithExchangeListings: number;
      exchangeListings: number;
      exchangeSpecies: number;
    };
    sources?: string[];
  };
  formulas?: Record<string, string>;
  qualityStamina?: {
    battle?: Array<Record<string, unknown>>;
    hunting?: Array<{ quality: Quality; hunting_stamina_per_second: number }>;
  };
  mastery?: {
    levels?: MasteryLevel[];
  };
  pets: PetRecord[];
};

type SortKey = "name" | "quality" | "power" | "speed" | "battleProfit" | "market" | "drop";
type SourceFilter = "ALL" | "EGG" | "BOSS" | "EXCHANGE" | "MERCHANT" | "EVENT" | "UNIQUE" | "MISSING_EGG";
type ViewMode = "cards" | "table";
type BattleProfitMode = "noSleep" | "withSleep" | "healingWithSleep";
type FoodPolicy = "standard" | "none";
type BattleMapFilter = string;
type BattleDrop = NonNullable<BattleZone["drops"]>[number];

type BattleEstimate = {
  value: number;
  battleTimeSeconds: number;
  enemiesBattled: number;
  lootPieces: number;
  lootChance: number;
  expectedRevenuePerBattle: number;
  expectedRevenuePerHour: number;
  expectedProfitPerBattle: number;
  expectedProfitPerHourNoSleep: number;
  expectedProfitPerHourWithSleep: number;
  expectedProfitPerHourHealingWithSleep: number;
  foodCostPerHourCheapest: number;
  profitMargin: number | null;
  staminaLimited: boolean;
  secondsPerEnemy: number;
  averageEnemyLevel: number | null;
  maxStamina: number;
  staminaDrainPerSecond: number;
  staminaDrainPerHour: number;
  staminaDrainPerBattle: number;
  staminaDurationSeconds: number | null;
  battlesBeforeSleep: number | null;
  sleepMultiplier: number;
  healingMultiplier: number;
};

type BattleProfitResult = {
  value: number;
  zone: string | null;
  mode: BattleProfitMode | null;
  selectedMap: BattleMapFilter;
  isBestMap: boolean;
  missingSelectedMap: boolean;
  estimate?: BattleEstimate | null;
};

type BattleSelection = {
  pet: PetRecord;
  zone: BattleZone;
};

type StoredPetState = {
  searchTerm?: string;
  qualityFilter?: Quality | "ALL";
  sourceFilter?: SourceFilter;
  sortBy?: SortKey;
  sortDesc?: boolean;
  viewMode?: ViewMode;
  petLevel?: number;
  masteryLevel?: number;
  evolutionStage?: number;
  patBonus?: boolean;
  battleProfitMode?: BattleProfitMode;
  foodPolicy?: FoodPolicy | "workbook";
  battleMapFilter?: BattleMapFilter;
  beastmaster?: boolean;
};

const PET_DATABASE_STORAGE_KEY = "zenith_pet_database_state_v1";
const BEST_BATTLE_MAP = "BEST_MAP";

const QUALITY_ORDER: Record<Quality, number> = {
  UNKNOWN: 0,
  STANDARD: 1,
  REFINED: 2,
  PREMIUM: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
  UNIQUE: 7,
};

const QUALITY_COLORS: Record<Quality, string> = {
  UNKNOWN: "#94a3b8",
  STANDARD: "#e4e4e7",
  REFINED: "#4ade80",
  PREMIUM: "#60a5fa",
  EPIC: "#a855f7",
  LEGENDARY: "#f59e0b",
  MYTHIC: "#ef4444",
  UNIQUE: "#ec4899",
};

const isDisplayableBattleDrop = (drop: BattleDrop | null | undefined) => {
  const itemName = String(drop?.itemName || "").trim();
  if (!itemName) return false;
  const normalized = itemName.replace(/[\s_:-]+/g, " ").toLowerCase();
  if (["total", "grand total", "subtotal", "average", "material", "item", "drop"].includes(normalized)) return false;
  return (drop?.expectedDropPercent !== null && drop?.expectedDropPercent !== undefined) || Boolean(drop?.prices);
};

const STAT_LABELS: Record<StatKey, string> = {
  agility: "Agility",
  accuracy: "Accuracy",
  protection: "Protection",
  attack_power: "Attack Power",
  movement_speed: "Move Speed",
  max_health: "Health",
  max_stamina: "Stamina",
  critical_damage: "Crit Damage",
  critical_chance: "Crit Chance",
};

const BOOSTED_STATS = new Set<StatKey>([
  "agility",
  "accuracy",
  "protection",
  "attack_power",
  "movement_speed",
]);

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "power", label: "Total Power" },
  { value: "speed", label: "Movement Speed" },
  { value: "battleProfit", label: "Battle Profit" },
  { value: "market", label: "Exchange Floor" },
  { value: "drop", label: "Drop Chance" },
  { value: "quality", label: "Quality" },
  { value: "name", label: "Name" },
];

const SOURCE_OPTIONS: Array<{ value: SourceFilter; label: string }> = [
  { value: "ALL", label: "All sources" },
  { value: "EGG", label: "Has egg item" },
  { value: "BOSS", label: "World boss drop" },
  { value: "EXCHANGE", label: "Exchange listed" },
  { value: "MERCHANT", label: "Merchant" },
  { value: "EVENT", label: "Event / legacy" },
  { value: "UNIQUE", label: "Unique" },
  { value: "MISSING_EGG", label: "Missing egg data" },
];

const BATTLE_PROFIT_OPTIONS: Array<{ value: BattleProfitMode; label: string }> = [
  { value: "withSleep", label: "With sleep" },
  { value: "noSleep", label: "No sleep" },
  { value: "healingWithSleep", label: "Healing + sleep" },
];

const FOOD_OPTIONS: Array<{ value: FoodPolicy; label: string }> = [
  { value: "standard", label: "Subtract food cost" },
  { value: "none", label: "Ignore food cost" },
];

const QUALITY_OPTIONS: Array<{ value: Quality | "ALL"; label: string }> = [
  { value: "ALL", label: "All qualities" },
  { value: "STANDARD", label: "Standard" },
  { value: "REFINED", label: "Refined" },
  { value: "PREMIUM", label: "Premium" },
  { value: "EPIC", label: "Epic" },
  { value: "LEGENDARY", label: "Legendary" },
  { value: "MYTHIC", label: "Mythic" },
  { value: "UNIQUE", label: "Unique" },
];

function formatGold(value?: number | null) {
  if (!value || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

function formatGoldPerHour(value?: number | null) {
  const gold = formatGold(value);
  return gold === "-" ? "-" : `${gold}/hr`;
}

function formatNumber(value?: number | null, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPercent(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${normalized.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function qualityLabel(quality: string) {
  return quality.charAt(0) + quality.slice(1).toLowerCase();
}

function secondsToDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const sec = rounded % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${sec}s`;
  return `${sec}s`;
}

function getMasteryBonus(database: PetDatabase | null, level: number) {
  const found = getMasteryLevel(database, level);
  const rawBonus = Number(found?.stat_bonus_percent || 0);
  return rawBonus <= 1 ? rawBonus * 100 : rawBonus;
}

function getMasteryLevel(database: PetDatabase | null, level: number) {
  const levels = database?.mastery?.levels || [];
  const target = clampNumber(level, 1, 100);
  return levels.find((entry) => Number(entry.level) === target) || levels.reduce<MasteryLevel | null>((closest, entry) => {
    if (Number(entry.level) > target) return closest;
    if (!closest || Number(entry.level) > Number(closest.level)) return entry;
    return closest;
  }, null);
}

function getMasteryLootChance(database: PetDatabase | null, level: number) {
  const rawChance = Number(getMasteryLevel(database, level)?.loot_chance ?? 0.1);
  return rawChance > 1 ? rawChance / 100 : rawChance;
}

function calculateStats(
  pet: PetRecord,
  level: number,
  masteryBonusPercent: number,
  evolutionStage: number,
  patBonus: boolean,
) {
  const stats = pet.stats || {};
  const globalBoostPercent = masteryBonusPercent + (patBonus ? 5 : 0);
  const evolutionBoostPercent = evolutionStage * 5;
  const values: Partial<Record<StatKey, number>> = {};

  (Object.keys(STAT_LABELS) as StatKey[]).forEach((key) => {
    const stat = stats[key];
    if (!stat) return;
    const raw = Number(stat.base || 0) + (level - 1) * Number(stat.per_level || 0);
    const boostPercent = globalBoostPercent + evolutionBoostPercent;
    const boostMultiplier = 1 + boostPercent / 100;
    const boosted = BOOSTED_STATS.has(key) ? raw * boostMultiplier : raw;
    if (key === "movement_speed" || key === "critical_damage" || key === "critical_chance") {
      values[key] = Number(boosted.toFixed(2));
    } else {
      values[key] = Math.floor(boosted);
    }
  });

  return values;
}

function getTotalPower(stats: Partial<Record<StatKey, number>>) {
  return Math.floor(
    Number(stats.attack_power || 0) +
      Number(stats.protection || 0) +
      Number(stats.agility || 0) +
      Number(stats.accuracy || 0),
  );
}

function getHuntingTimeSeconds(stats: Partial<Record<StatKey, number>>) {
  const agility = Number(stats.agility || 0);
  const movementSpeed = Number(stats.movement_speed || 0);
  return 200 - 125 * (0.7 * Math.min(agility / 120, 1) + 0.3 * Math.min(movementSpeed / 100, 1));
}

function shortBattleZoneLabel(zone?: string | null) {
  if (!zone) return "-";
  return zone.replace(/^Level\s*(\d+)\s*-\s*/i, "Lv. $1 - ").replace(/^Lv\.\s*(\d+)\s*-\s*/, "Lv. $1 - ");
}

function getBattleZoneLevel(zone?: string | null) {
  const level = zone?.match(/Level\s*(\d+)/i)?.[1];
  return level ? Number(level) : null;
}

function battleZoneSortValue(zone: string) {
  return getBattleZoneLevel(zone) || 0;
}

function getBattleMapOptions(database: PetDatabase | null): Array<{ value: BattleMapFilter; label: string }> {
  const zones = new Set<string>();
  for (const pet of database?.pets || []) {
    for (const zone of pet.battle?.zones || []) {
      if (zone.zone) zones.add(zone.zone);
    }
  }

  return [
    { value: BEST_BATTLE_MAP, label: "Best map" },
    ...[...zones]
      .sort((a, b) => battleZoneSortValue(b) - battleZoneSortValue(a) || a.localeCompare(b))
      .map((zone) => ({ value: zone, label: shortBattleZoneLabel(zone) })),
  ];
}

function getQualityBattleStaminaDrain(database: PetDatabase | null, quality: Quality) {
  const defaults: Partial<Record<Quality, number>> = {
    STANDARD: 0.0065,
    REFINED: 0.00475,
    PREMIUM: 0.004,
    EPIC: 0.00375,
    LEGENDARY: 0.003375,
    MYTHIC: 0.0025,
  };
  const found = database?.qualityStamina?.battle?.find((entry) => String(entry.quality || "").toUpperCase() === quality);
  return Number(found?.battle_stamina_per_second || defaults[quality] || 0.004);
}

function getBattleFormulaSeconds(stats: Partial<Record<StatKey, number>>, enemyLevel: number | null) {
  const health = Number(stats.max_health || 0);
  if (!health) return null;
  const effectiveEnemyLevel = enemyLevel || 1;
  const duration = 8 + health * 5.65 + 15 * (getTotalPower(stats) - effectiveEnemyLevel * 3.9);
  return Math.max(8, duration);
}

function getSecondsPerEnemy(level: number) {
  const clamped = clampNumber(level, 1, 100);
  const points = [
    { level: 1, seconds: 75 },
    { level: 25, seconds: 72 },
    { level: 50, seconds: 69 },
    { level: 75, seconds: 67 },
    { level: 100, seconds: 65 },
  ];
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const next = points[index];
    if (clamped <= next.level) {
      const progress = (clamped - prev.level) / (next.level - prev.level);
      return prev.seconds + (next.seconds - prev.seconds) * progress;
    }
  }
  return 65;
}

function getBattleDifficultyMultiplier(enemyLevel: number | null, petLevel: number) {
  const ratio = (enemyLevel || 1) / Math.max(1, petLevel);
  const clampedRatio = clampNumber(ratio, 0.75, 3.3);
  if (clampedRatio <= 1) {
    return 0.75 + ((1 - 0.75) * (clampedRatio - 0.75)) / (1 - 0.75);
  }
  return 1 + ((2.5 - 1) * (clampedRatio - 1)) / (3.3 - 1);
}

function getModeValue(estimate: BattleEstimate, mode: BattleProfitMode) {
  if (mode === "noSleep") return estimate.expectedProfitPerHourNoSleep;
  if (mode === "healingWithSleep") return estimate.expectedProfitPerHourHealingWithSleep;
  return estimate.expectedProfitPerHourWithSleep;
}

function estimateBattleZone(
  database: PetDatabase | null,
  pet: PetRecord,
  zone: BattleZone,
  stats: Partial<Record<StatKey, number>>,
  petLevel: number,
  masteryLootChance: number,
  mode: BattleProfitMode,
  foodPolicy: FoodPolicy,
): BattleEstimate {
  const enemyLevel = getBattleZoneLevel(zone.zone);
  const baselineStats = calculateStats(pet, 100, getMasteryBonus(database, 100), 0, false);
  const baselineFormula = getBattleFormulaSeconds(baselineStats, enemyLevel);
  const currentFormula = getBattleFormulaSeconds(stats, enemyLevel);
  const originalBattleTime = Number(zone.battleTimeSeconds || 0);
  let battleTimeSeconds =
    originalBattleTime && baselineFormula && currentFormula
      ? originalBattleTime * (currentFormula / baselineFormula)
      : currentFormula || originalBattleTime || 0;

  const stamina = Number(stats.max_stamina || 0);
  const staminaDrainPerSecond = getQualityBattleStaminaDrain(database, pet.quality) * getBattleDifficultyMultiplier(enemyLevel, petLevel);
  const staminaDurationSeconds = stamina && staminaDrainPerSecond ? stamina / staminaDrainPerSecond : null;
  const staminaLimited = Boolean(staminaDurationSeconds && battleTimeSeconds > staminaDurationSeconds);
  if (staminaLimited && staminaDurationSeconds) battleTimeSeconds = staminaDurationSeconds;

  const secondsPerEnemy = getSecondsPerEnemy(petLevel);
  battleTimeSeconds = Math.max(secondsPerEnemy, battleTimeSeconds);
  const enemiesBattled = Math.max(0, Math.floor(battleTimeSeconds / secondsPerEnemy));
  const lootChance = Math.max(0, masteryLootChance);
  const lootPieces = Math.max(0, Math.floor(enemiesBattled * lootChance));
  const baselineLootPieces = Math.max(1, Number(zone.lootPieces || 0) || Math.floor(Number(zone.enemiesBattled || 0) * 0.1) || 1);
  const baselineRevenuePerBattle =
    Number(zone.expectedRevenuePerBattle || 0) ||
    (Number(zone.expectedRevenuePerHour || 0) * Number(zone.battleTimeSeconds || 0)) / 3600;
  const revenuePerLootPiece = baselineRevenuePerBattle / baselineLootPieces;
  const expectedRevenuePerBattle = revenuePerLootPiece * lootPieces;
  const expectedRevenuePerHour = battleTimeSeconds > 0 ? (expectedRevenuePerBattle / battleTimeSeconds) * 3600 : 0;
  const foodCostPerHourCheapest = Number(zone.foodCostPerHourCheapest || 0);
  const appliedFoodCostPerHour = foodPolicy === "standard" ? foodCostPerHourCheapest : 0;
  const expectedProfitPerBattle = expectedRevenuePerBattle - (appliedFoodCostPerHour * battleTimeSeconds) / 3600;
  const expectedProfitPerHourNoSleep = expectedRevenuePerHour - appliedFoodCostPerHour;
  const sleepMultiplier = 1 / (1 + Math.max(0, Number(zone.cycle?.sleepToBattleForStamina || 0)));
  const healingMultiplier = Math.max(0, Number(zone.cycle?.battleToSleepForHp || sleepMultiplier));
  const expectedProfitPerHourWithSleep = expectedProfitPerHourNoSleep * sleepMultiplier;
  const expectedProfitPerHourHealingWithSleep = expectedProfitPerHourNoSleep * healingMultiplier;
  const profitMargin = expectedRevenuePerBattle > 0 ? expectedProfitPerBattle / expectedRevenuePerBattle : null;
  const staminaDrainPerBattle = Math.ceil(battleTimeSeconds * staminaDrainPerSecond);
  const battlesBeforeSleep = staminaDrainPerBattle > 0 && stamina ? stamina / staminaDrainPerBattle : null;
  const estimate: BattleEstimate = {
    value: 0,
    battleTimeSeconds,
    enemiesBattled,
    lootPieces,
    lootChance,
    expectedRevenuePerBattle,
    expectedRevenuePerHour,
    expectedProfitPerBattle,
    expectedProfitPerHourNoSleep,
    expectedProfitPerHourWithSleep,
    expectedProfitPerHourHealingWithSleep,
    foodCostPerHourCheapest,
    profitMargin,
    staminaLimited,
    secondsPerEnemy,
    averageEnemyLevel: enemyLevel,
    maxStamina: stamina,
    staminaDrainPerSecond,
    staminaDrainPerHour: staminaDrainPerSecond * 3600,
    staminaDrainPerBattle,
    staminaDurationSeconds,
    battlesBeforeSleep,
    sleepMultiplier,
    healingMultiplier,
  };
  estimate.value = getModeValue(estimate, mode);
  return estimate;
}

function getBattleProfit(
  database: PetDatabase | null,
  pet: PetRecord,
  stats: Partial<Record<StatKey, number>>,
  petLevel: number,
  masteryLootChance: number,
  mode: BattleProfitMode,
  foodPolicy: FoodPolicy,
  battleMapFilter: BattleMapFilter,
): BattleProfitResult {
  const zones = pet.battle?.zones || [];
  if (battleMapFilter !== BEST_BATTLE_MAP) {
    const selectedZone = zones.find((zone) => zone.zone === battleMapFilter);
    const estimate = selectedZone
      ? estimateBattleZone(database, pet, selectedZone, stats, petLevel, masteryLootChance, mode, foodPolicy)
      : null;
    return {
      value: estimate?.value || 0,
      zone: selectedZone?.zone || battleMapFilter,
      mode,
      selectedMap: battleMapFilter,
      isBestMap: false,
      missingSelectedMap: !selectedZone,
      estimate,
    };
  }

  if (!zones.length) {
    return { value: 0, zone: null, mode: null, selectedMap: BEST_BATTLE_MAP, isBestMap: true, missingSelectedMap: false, estimate: null };
  }

  return zones.reduce<BattleProfitResult>(
    (best, zone) => {
      const estimate = estimateBattleZone(database, pet, zone, stats, petLevel, masteryLootChance, mode, foodPolicy);
      const value = estimate.value;
      if (best.zone && value <= best.value) return best;
      return {
        value,
        zone: zone.zone,
        mode,
        selectedMap: BEST_BATTLE_MAP,
        isBestMap: true,
        missingSelectedMap: false,
        estimate,
      };
    },
    { value: Number.NEGATIVE_INFINITY, zone: null, mode: null, selectedMap: BEST_BATTLE_MAP, isBestMap: true, missingSelectedMap: false, estimate: null },
  );
}

function getProfitMetricLabel(foodPolicy: FoodPolicy) {
  return foodPolicy === "none" ? "Gross battle value/hr" : "Net battle profit/hr";
}

function getBattleCardContext(battleProfit: BattleProfitResult) {
  if (battleProfit.missingSelectedMap) return `${shortBattleZoneLabel(battleProfit.selectedMap)} unavailable`;
  if (!battleProfit.zone) return "No battle data";
  return `${battleProfit.isBestMap ? "Best" : "Map"}: ${shortBattleZoneLabel(battleProfit.zone)}`;
}

function petSearchText(pet: PetRecord) {
  return [
    pet.name,
    pet.quality,
    pet.egg?.name,
    pet.rarity?.worldBoss,
    pet.sourceOverride?.label,
    pet.sourceOverride?.merchant?.name,
    pet.sourceOverride?.availability,
    ...(pet.sourceOverride?.notes || []),
    ...(pet.acquisition || []).flatMap((entry) => [entry.boss, entry.location, entry.egg]),
    ...(pet.battle?.zones || []).map((zone) => zone.zone),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPetSourceLabel(pet: PetRecord) {
  return pet.sourceOverride?.label || pet.rarity?.worldBoss || pet.acquisition?.[0]?.location || "Source pending";
}

function getMerchantPrice(source?: PetSourceOverride | null) {
  if (!source?.merchant) return null;
  const price = source.merchant.price;
  if (!price) return source.merchant.name;
  return `${source.merchant.name} - ${price.toLocaleString()} ${source.merchant.currency || "shards"}`;
}

function PetSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  open,
  onOpenChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div className={`pet-field pet-dropdown ${open ? "open" : ""}`}>
      <span>{label}</span>
      <button
        type="button"
        className="pet-select-button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="pet-select-menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={option.value === value ? "selected" : ""}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PetNumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="pet-field">
      <span>{label}</span>
      <input
        className="pet-number"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
      />
    </label>
  );
}

function PetImage({ pet }: { pet: PetRecord }) {
  const image = pet.imageUrl || pet.egg?.imageUrl;
  return (
    <div className="pet-avatar">
      {image ? <img src={image} alt="" /> : <PawPrint size={30} />}
    </div>
  );
}

function PetCard({
  pet,
  stats,
  totalPower,
  huntingTime,
  battleProfit,
  onInspect,
}: {
  pet: PetRecord;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  battleProfit: BattleProfitResult;
  onInspect: () => void;
}) {
  const accent = QUALITY_COLORS[pet.quality] || QUALITY_COLORS.UNKNOWN;
  const battleContext = getBattleCardContext(battleProfit);
  const battleValue = battleProfit.missingSelectedMap ? "No data" : battleProfit.value ? formatGoldPerHour(battleProfit.value) : formatGold(pet.exchange?.minPrice);
  return (
    <button className="pet-card" onClick={onInspect} style={{ "--quality-accent": accent } as React.CSSProperties}>
      <div className="pet-card-top">
        <PetImage pet={pet} />
        <div>
          <div className="pet-card-name">{pet.name}</div>
          <div className="pet-card-source">{getPetSourceLabel(pet)}</div>
        </div>
        <span className="pet-quality-pill">{qualityLabel(pet.quality)}</span>
      </div>
      <div className="pet-card-stats">
        <span>
          <Swords size={14} /> {formatNumber(totalPower)}
        </span>
        <span>
          <Gauge size={14} /> {formatNumber(stats.movement_speed, 2)}m/s
        </span>
        <span>
          <Search size={14} /> {secondsToDuration(huntingTime)}
        </span>
      </div>
      <div className="pet-card-market">
        <span>{battleProfit.zone ? battleContext : pet.exchange?.listingCount ? `${pet.exchange.listingCount} listed` : "No listings"}</span>
        <strong>{battleValue}</strong>
      </div>
      <div className="pet-card-market pet-card-market-secondary">
        <span>{pet.exchange?.listingCount ? `${pet.exchange.listingCount} exchange listings` : "No exchange listings"}</span>
        <strong>{formatGold(pet.exchange?.minPrice)}</strong>
      </div>
    </button>
  );
}

export default function PetsPage() {
  const [database, setDatabase] = useState<PetDatabase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [qualityFilter, setQualityFilter] = useState<Quality | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("power");
  const [sortDesc, setSortDesc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [petLevel, setPetLevel] = useState(100);
  const [masteryLevel, setMasteryLevel] = useState(100);
  const [evolutionStage, setEvolutionStage] = useState(0);
  const [patBonus, setPatBonus] = useState(false);
  const [battleProfitMode, setBattleProfitMode] = useState<BattleProfitMode>("withSleep");
  const [foodPolicy, setFoodPolicy] = useState<FoodPolicy>("standard");
  const [battleMapFilter, setBattleMapFilter] = useState<BattleMapFilter>(BEST_BATTLE_MAP);
  const [beastmaster, setBeastmaster] = useState(false);
  const [openPetSelect, setOpenPetSelect] = useState<string | null>(null);
  const [selectedPetName, setSelectedPetName] = useState<string | null>(null);
  const [selectedBattle, setSelectedBattle] = useState<BattleSelection | null>(null);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [modalRootReady, setModalRootReady] = useState(false);
  const { openItem, openItemByName } = useItemModal();

  useEffect(() => {
    setModalRootReady(true);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PET_DATABASE_STORAGE_KEY);
      if (!raw) {
        setHasLoadedStoredState(true);
        return;
      }
      const stored = JSON.parse(raw) as StoredPetState;
      if (typeof stored.searchTerm === "string") setSearchTerm(stored.searchTerm);
      if (stored.qualityFilter) setQualityFilter(stored.qualityFilter);
      if (stored.sourceFilter) setSourceFilter(stored.sourceFilter);
      if (stored.sortBy) setSortBy(stored.sortBy);
      if (typeof stored.sortDesc === "boolean") setSortDesc(stored.sortDesc);
      if (stored.viewMode) setViewMode(stored.viewMode);
      if (typeof stored.petLevel === "number") setPetLevel(clampNumber(stored.petLevel, 1, 100));
      if (typeof stored.masteryLevel === "number") setMasteryLevel(clampNumber(stored.masteryLevel, 1, 100));
      if (typeof stored.evolutionStage === "number") setEvolutionStage(clampNumber(stored.evolutionStage, 0, 5));
      if (typeof stored.patBonus === "boolean") setPatBonus(stored.patBonus);
      if (stored.battleProfitMode) setBattleProfitMode(stored.battleProfitMode);
      if (stored.foodPolicy) setFoodPolicy(stored.foodPolicy === "workbook" ? "standard" : stored.foodPolicy);
      if (stored.battleMapFilter) setBattleMapFilter(stored.battleMapFilter);
      if (typeof stored.beastmaster === "boolean") setBeastmaster(stored.beastmaster);
    } catch {
      window.localStorage.removeItem(PET_DATABASE_STORAGE_KEY);
    } finally {
      setHasLoadedStoredState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredState) return;
    const stored: StoredPetState = {
      searchTerm,
      qualityFilter,
      sourceFilter,
      sortBy,
      sortDesc,
      viewMode,
      petLevel,
      masteryLevel,
      evolutionStage,
      patBonus,
      battleProfitMode,
      foodPolicy,
      battleMapFilter,
      beastmaster,
    };
    window.localStorage.setItem(PET_DATABASE_STORAGE_KEY, JSON.stringify(stored));
  }, [
    hasLoadedStoredState,
    searchTerm,
    qualityFilter,
    sourceFilter,
    sortBy,
    sortDesc,
    viewMode,
    petLevel,
    masteryLevel,
    evolutionStage,
    patBonus,
    battleProfitMode,
    foodPolicy,
    battleMapFilter,
    beastmaster,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Pet database unavailable"))))
      .then((data: PetDatabase) => {
        if (cancelled) return;
        setDatabase(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Pet database failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPetName && !selectedBattle) return;
    document.body.classList.add("pet-modal-open");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedPetName(null);
      setSelectedBattle(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("pet-modal-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPetName, selectedBattle]);

  useEffect(() => {
    if (!openPetSelect) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".pet-dropdown")) {
        setOpenPetSelect(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPetSelect(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPetSelect]);

  const masteryBonus = useMemo(() => getMasteryBonus(database, masteryLevel), [database, masteryLevel]);
  const masteryLootChance = useMemo(() => getMasteryLootChance(database, masteryLevel), [database, masteryLevel]);
  const battleMapOptions = useMemo(() => getBattleMapOptions(database), [database]);

  useEffect(() => {
    if (!database) return;
    if (battleMapFilter === BEST_BATTLE_MAP) return;
    if (battleMapOptions.some((option) => option.value === battleMapFilter)) return;
    setBattleMapFilter(BEST_BATTLE_MAP);
  }, [battleMapFilter, battleMapOptions, database]);

  const petRows = useMemo(() => {
    const pets = database?.pets || [];
    const query = searchTerm.trim().toLowerCase();
    return pets
      .map((pet) => {
        const stats = calculateStats(pet, petLevel, masteryBonus, evolutionStage, patBonus);
        const totalPower = getTotalPower(stats);
        const huntingTime = getHuntingTimeSeconds(stats);
        const battleProfit = getBattleProfit(database, pet, stats, petLevel, masteryLootChance, battleProfitMode, foodPolicy, battleMapFilter);
        return { pet, stats, totalPower, huntingTime, battleProfit };
      })
      .filter(({ pet }) => {
        const matchesSearch = !query || petSearchText(pet).includes(query);
        const matchesQuality = qualityFilter === "ALL" || pet.quality === qualityFilter;
        const matchesSource =
          sourceFilter === "ALL" ||
          (sourceFilter === "EGG" && Boolean(pet.egg)) ||
          (sourceFilter === "BOSS" && Boolean(pet.rarity?.worldBoss || pet.acquisition?.length)) ||
          (sourceFilter === "EXCHANGE" && Boolean(pet.exchange?.listingCount)) ||
          (sourceFilter === "MERCHANT" && pet.sourceOverride?.type === "merchant") ||
          (sourceFilter === "EVENT" && pet.sourceOverride?.type === "event") ||
          (sourceFilter === "UNIQUE" && pet.sourceOverride?.type === "unique") ||
          (sourceFilter === "MISSING_EGG" && !pet.egg);
        return matchesSearch && matchesQuality && matchesSource;
      })
      .sort((a, b) => {
        let left = 0;
        let right = 0;
        if (sortBy === "power") {
          left = a.totalPower;
          right = b.totalPower;
        } else if (sortBy === "speed") {
          left = Number(a.stats.movement_speed || 0);
          right = Number(b.stats.movement_speed || 0);
        } else if (sortBy === "battleProfit") {
          left = a.battleProfit.value;
          right = b.battleProfit.value;
        } else if (sortBy === "market") {
          left = Number(a.pet.exchange?.minPrice || 0);
          right = Number(b.pet.exchange?.minPrice || 0);
        } else if (sortBy === "drop") {
          left = Number(a.pet.rarity?.dropChancePercent || 0);
          right = Number(b.pet.rarity?.dropChancePercent || 0);
        } else if (sortBy === "quality") {
          left = QUALITY_ORDER[a.pet.quality] || 0;
          right = QUALITY_ORDER[b.pet.quality] || 0;
        } else {
          return sortDesc ? b.pet.name.localeCompare(a.pet.name) : a.pet.name.localeCompare(b.pet.name);
        }
        return sortDesc ? right - left : left - right;
      });
  }, [
    database,
    searchTerm,
    qualityFilter,
    sourceFilter,
    sortBy,
    sortDesc,
    petLevel,
    masteryBonus,
    masteryLootChance,
    evolutionStage,
    patBonus,
    battleProfitMode,
    foodPolicy,
    battleMapFilter,
  ]);

  const selectedRow = useMemo(
    () => (selectedPetName ? petRows.find((row) => row.pet.name === selectedPetName) || null : null),
    [petRows, selectedPetName],
  );
  const selectedBattleDrops = useMemo(
    () => selectedBattle?.zone.drops?.filter(isDisplayableBattleDrop) || [],
    [selectedBattle],
  );
  const selectedBattleEstimate = useMemo(() => {
    if (!selectedBattle) return null;
    const stats = calculateStats(selectedBattle.pet, petLevel, masteryBonus, evolutionStage, patBonus);
    return estimateBattleZone(
      database,
      selectedBattle.pet,
      selectedBattle.zone,
      stats,
      petLevel,
      masteryLootChance,
      battleProfitMode,
      foodPolicy,
    );
  }, [battleProfitMode, database, evolutionStage, foodPolicy, masteryBonus, masteryLootChance, patBonus, petLevel, selectedBattle]);

  const counts = database?.meta.counts;
  const bestHunter = petRows.reduce<(typeof petRows)[number] | null>(
    (best, row) => (!best || row.huntingTime < best.huntingTime ? row : best),
    null,
  );
  const bestMarket = petRows.reduce<(typeof petRows)[number] | null>(
    (best, row) => (!best || Number(row.pet.exchange?.minPrice || 0) > Number(best.pet.exchange?.minPrice || 0) ? row : best),
    null,
  );
  const bestBattleProfit = petRows.reduce<(typeof petRows)[number] | null>(
    (best, row) => (!best || row.battleProfit.value > best.battleProfit.value ? row : best),
    null,
  );

  return (
    <div className="pets-page">
      <section className="pets-hero">
        <div>
          <div className="pets-kicker">
            <PawPrint size={16} /> Pet Database
          </div>
          <h1>Pet Database</h1>
          <p>
            Compare pet stats, sources, exchange listings, and battle or hunting performance in one place.
          </p>
        </div>
        <div className="pets-hero-grid">
          <div>
            <span>Pets</span>
            <strong>{counts?.pets || database?.pets.length || "-"}</strong>
          </div>
          <div>
            <span>Egg Links</span>
            <strong>{counts?.petsWithEggs || "-"}</strong>
          </div>
          <div>
            <span>Listings</span>
            <strong>{counts?.exchangeListings?.toLocaleString() || "-"}</strong>
          </div>
          <div>
            <span>Mastery Bonus</span>
            <strong>{masteryBonus}%</strong>
          </div>
        </div>
      </section>

      <section className="pets-toolbar">
        <label className="pet-search">
          <Search size={18} />
          <input
            value={searchTerm}
            placeholder="Search pet, boss, egg, location..."
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <PetSelect label="Quality" value={qualityFilter} options={QUALITY_OPTIONS} onChange={setQualityFilter} open={openPetSelect === "quality"} onOpenChange={(open) => setOpenPetSelect(open ? "quality" : null)} />
        <PetSelect label="Source" value={sourceFilter} options={SOURCE_OPTIONS} onChange={setSourceFilter} open={openPetSelect === "source"} onOpenChange={(open) => setOpenPetSelect(open ? "source" : null)} />
        <PetSelect label="Sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} open={openPetSelect === "sort"} onOpenChange={(open) => setOpenPetSelect(open ? "sort" : null)} />
        <button className="pet-icon-button" onClick={() => setSortDesc((value) => !value)} title="Toggle sort direction">
          <ArrowDownUp size={17} />
          <span>{sortDesc ? "Desc" : "Asc"}</span>
        </button>
        <div className="pet-segment" aria-label="View mode">
          <button className={viewMode === "cards" ? "active" : ""} onClick={() => setViewMode("cards")}>
            Cards
          </button>
          <button className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")}>
            Table
          </button>
        </div>
      </section>

      <section className="pets-calculator">
        <div className="calculator-title">
          <ChevronsUp size={18} />
          <div>
            <strong>Scenario Preview</strong>
            <span>Adjust level, mastery, evolution, battle map, sleep cycle, food cost, and pet effects.</span>
          </div>
        </div>
        <div className="calculator-fields">
          <PetNumberField label="Pet Level" value={petLevel} min={1} max={100} onChange={setPetLevel} />
          <PetNumberField label="Pet Mastery" value={masteryLevel} min={1} max={100} onChange={setMasteryLevel} />
          <PetNumberField label="Evolution" value={evolutionStage} min={0} max={5} onChange={setEvolutionStage} />
          <PetSelect label="Battle map" value={battleMapFilter} options={battleMapOptions} onChange={setBattleMapFilter} open={openPetSelect === "battle-map"} onOpenChange={(open) => setOpenPetSelect(open ? "battle-map" : null)} />
          <PetSelect label="Cycle mode" value={battleProfitMode} options={BATTLE_PROFIT_OPTIONS} onChange={setBattleProfitMode} open={openPetSelect === "profit"} onOpenChange={(open) => setOpenPetSelect(open ? "profit" : null)} />
          <PetSelect label="Food cost" value={foodPolicy} options={FOOD_OPTIONS} onChange={setFoodPolicy} open={openPetSelect === "food"} onOpenChange={(open) => setOpenPetSelect(open ? "food" : null)} />
          <button className={`pet-toggle ${patBonus ? "active" : ""}`} onClick={() => setPatBonus((value) => !value)}>
            <HeartPulse size={16} />
            Pat +5%
          </button>
          <button className={`pet-toggle ${beastmaster ? "active" : ""}`} onClick={() => setBeastmaster((value) => !value)}>
            <PawPrint size={16} />
            Beastmaster
          </button>
        </div>
        <div className="pet-effect-note">
          Battle ranking uses the selected map and cycle. Subtract food cost shows net profit; ignore food cost shows gross battle value.
        </div>
      </section>

      {loadError && <div className="pet-state">{loadError}</div>}
      {!database && !loadError && <div className="pet-state">Loading pet database...</div>}

      {database && (
        <>
          <section className="pets-signal-row">
            <div>
              <Dumbbell size={18} />
              <span>Visible</span>
              <strong>{petRows.length}</strong>
            </div>
            <div>
              <Search size={18} />
              <span>Fastest Hunter</span>
              <strong>{bestHunter ? `${bestHunter.pet.name} - ${secondsToDuration(bestHunter.huntingTime)}` : "-"}</strong>
            </div>
            <div>
              <BarChart3 size={18} />
              <span>{foodPolicy === "none" ? "Best Gross Battle" : "Best Net Battle"}</span>
              <strong>
                {bestBattleProfit?.battleProfit.value
                  ? `${bestBattleProfit.pet.name} - ${formatGoldPerHour(bestBattleProfit.battleProfit.value)} (${shortBattleZoneLabel(bestBattleProfit.battleProfit.zone)})`
                  : "-"}
              </strong>
            </div>
            <div>
              <Database size={18} />
              <span>Highest Exchange Floor</span>
              <strong>{bestMarket ? `${bestMarket.pet.name} - ${formatGold(bestMarket.pet.exchange?.minPrice)}` : "-"}</strong>
            </div>
          </section>

          <div className="pets-content">
            <section className="pets-list" aria-label="Pet results">
              {viewMode === "cards" ? (
                <div className="pets-card-grid">
                  {petRows.map((row) => (
                    <PetCard
                      key={row.pet.name}
                      pet={row.pet}
                      stats={row.stats}
                      totalPower={row.totalPower}
                      huntingTime={row.huntingTime}
                      battleProfit={row.battleProfit}
                      onInspect={() => setSelectedPetName(row.pet.name)}
                    />
                  ))}
                </div>
              ) : (
                <div className="pets-table-wrap">
                  <table className="pets-table">
                    <thead>
                      <tr>
                        <th>Pet</th>
                        <th>Quality</th>
                        <th>Power</th>
                        <th>Move</th>
                        <th>Hunter</th>
                        <th>Battle/hr</th>
                        <th>Source</th>
                        <th>Exchange</th>
                      </tr>
                    </thead>
                    <tbody>
                      {petRows.map((row) => (
                        <tr key={row.pet.name} onClick={() => setSelectedPetName(row.pet.name)}>
                          <td>
                            <span className="table-pet-cell">
                              <PetImage pet={row.pet} />
                              {row.pet.name}
                            </span>
                          </td>
                          <td>{qualityLabel(row.pet.quality)}</td>
                          <td>{formatNumber(row.totalPower)}</td>
                          <td>{formatNumber(row.stats.movement_speed, 2)}m/s</td>
                          <td>{secondsToDuration(row.huntingTime)}</td>
                          <td>
                            <span className="pet-table-stack">
                              <strong>{row.battleProfit.missingSelectedMap ? "No data" : row.battleProfit.value ? formatGoldPerHour(row.battleProfit.value) : "-"}</strong>
                              <span>{getBattleCardContext(row.battleProfit)}</span>
                            </span>
                          </td>
                          <td>{getPetSourceLabel(row.pet)}</td>
                          <td>{formatGold(row.pet.exchange?.minPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {modalRootReady && selectedRow ? createPortal(
              (
              <div className="pet-modal-backdrop" role="presentation" onClick={() => setSelectedPetName(null)}>
              <article className="pet-detail pet-modal" aria-label="Selected pet details" onClick={(event) => event.stopPropagation()}>
                <button className="pet-detail-close" onClick={() => setSelectedPetName(null)} title="Clear selected pet">
                  <X size={16} />
                </button>
                <div className="pet-detail-head">
                  <PetImage pet={selectedRow.pet} />
                  <div>
                    <span className="pet-quality-line" style={{ color: QUALITY_COLORS[selectedRow.pet.quality] }}>
                      {qualityLabel(selectedRow.pet.quality)}
                    </span>
                    <h2>{selectedRow.pet.name}</h2>
                    <p>{getPetSourceLabel(selectedRow.pet)}</p>
                  </div>
                </div>

                <div className="pet-detail-metrics">
                  <div>
                    <Swords size={15} />
                    <span>Total Power</span>
                    <strong>{formatNumber(selectedRow.totalPower)}</strong>
                  </div>
                  <div>
                    <Gauge size={15} />
                    <span>Movement</span>
                    <strong>{formatNumber(selectedRow.stats.movement_speed, 2)}m/s</strong>
                  </div>
                  <div>
                    <Search size={15} />
                    <span>Hunt Time</span>
                    <strong>{secondsToDuration(selectedRow.huntingTime)}</strong>
                  </div>
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Shield size={15} /> Stats
                  </h3>
                  <div className="pet-stat-grid">
                    {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => (
                      <div key={key}>
                        <span>{STAT_LABELS[key]}</span>
                        <strong>
                          {key === "movement_speed" || key === "critical_damage" || key === "critical_chance"
                            ? formatNumber(selectedRow.stats[key], 2)
                            : formatNumber(selectedRow.stats[key])}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Egg size={15} /> Source
                  </h3>
                  {selectedRow.pet.egg ? (
                    <button
                      className="pet-egg-button"
                      onClick={() => {
                        const egg = selectedRow.pet.egg;
                        if (!egg) return;
                        setSelectedPetName(null);
                        if (egg.hashedId) openItem(egg.hashedId);
                        else openItemByName(egg.name);
                      }}
                    >
                      {selectedRow.pet.egg.imageUrl ? <img src={selectedRow.pet.egg.imageUrl} alt="" /> : <Egg size={18} />}
                      <span>{selectedRow.pet.egg.name}</span>
                      <strong>{selectedRow.pet.egg.worldBosses?.map((boss) => boss.name).join(", ") || "Open item"}</strong>
                    </button>
                  ) : (
                    <p className="pet-muted">No linked egg item in the current public item database.</p>
                  )}
                  {selectedRow.pet.sourceOverride ? (
                    <div className="pet-source-override">
                      <span>{selectedRow.pet.sourceOverride.label}</span>
                      {selectedRow.pet.sourceOverride.merchant?.url ? (
                        <a href={selectedRow.pet.sourceOverride.merchant.url} target="_blank" rel="noreferrer">
                          {getMerchantPrice(selectedRow.pet.sourceOverride)}
                        </a>
                      ) : null}
                      {selectedRow.pet.sourceOverride.notes?.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  ) : null}
                  {selectedRow.pet.acquisition?.length ? (
                    <div className="pet-source-list">
                      {selectedRow.pet.acquisition.map((entry, index) => (
                        <div key={`${entry.egg}-${index}`}>
                          <span>{entry.boss || entry.location || "Unknown source"}</span>
                          <strong>
                            {entry.chancePercent ? `${entry.chancePercent}%` : "Chance pending"} - {entry.levelRequirement || "No level data"}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Database size={15} /> Exchange
                  </h3>
                  <div className="pet-source-list">
                    <div>
                      <span>Listings</span>
                      <strong>{selectedRow.pet.exchange?.listingCount || 0}</strong>
                    </div>
                    <div>
                      <span>Floor</span>
                      <strong>{formatGold(selectedRow.pet.exchange?.minPrice)}</strong>
                    </div>
                    <div>
                      <span>Median</span>
                      <strong>{formatGold(selectedRow.pet.exchange?.medianPrice)}</strong>
                    </div>
                    <div>
                      <span>Average</span>
                      <strong>{formatGold(selectedRow.pet.exchange?.averagePrice)}</strong>
                    </div>
                  </div>
                  {selectedRow.pet.valuation ? (
                    <div className="pet-source-list pet-source-list-spaced">
                      <div>
                        <span>Value egg price</span>
                        <strong>{formatGold(selectedRow.pet.valuation.eggPrice)}</strong>
                      </div>
                      <div>
                        <span>Level 100 bonus</span>
                        <strong>{formatGold(selectedRow.pet.valuation.level100Bonus)}</strong>
                      </div>
                      <div>
                        <span>Sample estimate</span>
                        <strong>{formatGold(selectedRow.pet.valuation.samples?.[0]?.roughEstimate)}</strong>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Zap size={15} /> Battle Data
                  </h3>
                  {selectedRow.pet.battle?.zones?.length ? (
                    <div className="pet-zone-list">
                      {selectedRow.pet.battle.zones.map((zone) => {
                        const zoneEstimate = estimateBattleZone(
                          database,
                          selectedRow.pet,
                          zone,
                          selectedRow.stats,
                          petLevel,
                          masteryLootChance,
                          battleProfitMode,
                          foodPolicy,
                        );
                        return (
                          <button
                            type="button"
                            className={`pet-zone-button ${battleMapFilter === zone.zone ? "selected" : ""}`}
                            key={zone.zone}
                            onClick={() => {
                              setSelectedPetName(null);
                              setSelectedBattle({ pet: selectedRow.pet, zone });
                            }}
                          >
                            <span className="pet-zone-main">
                              <span className="pet-zone-name">{shortBattleZoneLabel(zone.zone)}</span>
                              <span className="pet-zone-meta">
                                {formatNumber(zoneEstimate.enemiesBattled)} enemies - {formatNumber(zoneEstimate.lootPieces)} loot at {formatPercent(zoneEstimate.lootChance)}
                              </span>
                            </span>
                            <strong className="pet-zone-profit">{formatGoldPerHour(zoneEstimate.value)}</strong>
                            <span className="pet-zone-time">{secondsToDuration(zoneEstimate.battleTimeSeconds)}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pet-muted">No battle data is available for this pet yet.</p>
                  )}
                </div>

                <div className="pet-research-note">
                  <BadgeInfo size={15} />
                  <span>Pet stats and battle estimates update from the scenario controls above, including Pet Mastery loot chance and evolution.</span>
                </div>
              </article>
              </div>
              ),
              document.body,
            ) : null}
          </div>

          {modalRootReady && selectedBattle ? createPortal(
            (
            <div className="pet-modal-backdrop pet-battle-backdrop" role="presentation" onClick={() => setSelectedBattle(null)}>
              <article className="pet-battle-modal" aria-label="Pet battle details" onClick={(event) => event.stopPropagation()}>
                <button className="pet-detail-close" onClick={() => setSelectedBattle(null)} title="Close battle details">
                  <X size={16} />
                </button>
                <div className="pet-detail-head">
                  <PetImage pet={selectedBattle.pet} />
                  <div>
                    <span className="pet-quality-line" style={{ color: QUALITY_COLORS[selectedBattle.pet.quality] }}>
                      Battle Data
                    </span>
                    <h2>{selectedBattle.pet.name}</h2>
                    <p>{selectedBattle.zone.zone}</p>
                  </div>
                </div>
                <div className="pet-detail-metrics">
                  <div>
                    <Zap size={15} />
                    <span>Battle Time</span>
                    <strong>{secondsToDuration(selectedBattleEstimate?.battleTimeSeconds)}</strong>
                  </div>
                  <div>
                    <Swords size={15} />
                    <span>Enemies</span>
                    <strong>{formatNumber(selectedBattleEstimate?.enemiesBattled)}</strong>
                  </div>
                  <div>
                    <Database size={15} />
                    <span>Loot Pieces</span>
                    <strong>{formatNumber(selectedBattleEstimate?.lootPieces)}</strong>
                  </div>
                </div>
                <div className="pet-source-list">
                  <div>
                    <span>{getProfitMetricLabel(foodPolicy)}</span>
                    <strong>{formatGoldPerHour(selectedBattleEstimate?.value)}</strong>
                  </div>
                  <div>
                    <span>No sleep</span>
                    <strong>{formatGoldPerHour(selectedBattleEstimate?.expectedProfitPerHourNoSleep)}</strong>
                  </div>
                  <div>
                    <span>With sleep</span>
                    <strong>{formatGoldPerHour(selectedBattleEstimate?.expectedProfitPerHourWithSleep)}</strong>
                  </div>
                  <div>
                    <span>Healing + sleep</span>
                    <strong>{formatGoldPerHour(selectedBattleEstimate?.expectedProfitPerHourHealingWithSleep)}</strong>
                  </div>
                  <div>
                    <span>Gross/battle</span>
                    <strong>{formatGold(selectedBattleEstimate?.expectedRevenuePerBattle)}</strong>
                  </div>
                  <div>
                    <span>{foodPolicy === "none" ? "Value/battle" : "Net/battle"}</span>
                    <strong>{formatGold(selectedBattleEstimate?.expectedProfitPerBattle)}</strong>
                  </div>
                  <div>
                    <span>Food cost/hr</span>
                    <strong>{formatGoldPerHour(selectedBattleEstimate?.foodCostPerHourCheapest)}</strong>
                  </div>
                  <div>
                    <span>Profit margin</span>
                    <strong>{formatPercent(selectedBattleEstimate?.profitMargin)}</strong>
                  </div>
                  <div>
                    <span>Loot chance</span>
                    <strong>{formatPercent(selectedBattleEstimate?.lootChance)}</strong>
                  </div>
                  <div>
                    <span>Seconds / enemy</span>
                    <strong>{formatNumber(selectedBattleEstimate?.secondsPerEnemy, 1)}s</strong>
                  </div>
                </div>
                <div className="pet-detail-section">
                  <h3>
                    <HeartPulse size={15} /> Sleep / Stamina Cycle
                  </h3>
                  <div className="pet-source-list">
                    <div>
                      <span>Max stamina</span>
                      <strong>{formatNumber(selectedBattleEstimate?.maxStamina)}</strong>
                    </div>
                    <div>
                      <span>Stamina / battle</span>
                      <strong>{formatNumber(selectedBattleEstimate?.staminaDrainPerBattle)}</strong>
                    </div>
                    <div>
                      <span>Stamina / hour</span>
                      <strong>{formatNumber(selectedBattleEstimate?.staminaDrainPerHour, 2)}</strong>
                    </div>
                    <div>
                      <span>Battles before sleep</span>
                      <strong>{formatNumber(selectedBattleEstimate?.battlesBeforeSleep, 1)}</strong>
                    </div>
                    <div>
                      <span>Zero stamina battle time</span>
                      <strong>{secondsToDuration(selectedBattleEstimate?.staminaDurationSeconds)}</strong>
                    </div>
                    <div>
                      <span>Stamina recovery</span>
                      <strong>{secondsToDuration(selectedBattle.zone.cycle?.staminaRecoveryZeroToFullSeconds)}</strong>
                    </div>
                    <div>
                      <span>Health recovery</span>
                      <strong>{secondsToDuration(selectedBattle.zone.cycle?.healthRecoveryZeroToFullSeconds)}</strong>
                    </div>
                    <div>
                      <span>Sleep/battle stamina</span>
                      <strong>{formatNumber(selectedBattleEstimate?.sleepMultiplier ? (1 / selectedBattleEstimate.sleepMultiplier) - 1 : null, 2)}</strong>
                    </div>
                    <div>
                      <span>Estimate cap</span>
                      <strong>{selectedBattleEstimate?.staminaLimited ? "Stamina limited" : "Battle formula"}</strong>
                    </div>
                  </div>
                </div>
                <div className="pet-detail-section">
                  <h3>
                    <BarChart3 size={15} /> Expected Drop Breakdown
                  </h3>
                  {selectedBattleDrops.length ? (
                    <div className="pet-drop-table-wrap">
                      <table className="pet-drop-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Drop</th>
                            <th>Value share</th>
                            <th>Best price</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBattleDrops
                            .slice()
                            .sort((a, b) => Number(b.valueShareMaxPrice || b.valueSharePercent || 0) - Number(a.valueShareMaxPrice || a.valueSharePercent || 0))
                            .slice(0, 16)
                            .map((drop, index) => (
                              <tr key={`${drop.itemName}-${drop.source}-${index}`}>
                                <td>{drop.itemName || "-"}</td>
                                <td>{formatPercent(drop.expectedDropPercent, 3)}</td>
                                <td>{formatPercent(drop.valueShareMaxPrice ?? drop.valueSharePercent, 1)}</td>
                                <td>{formatGold(drop.prices?.bestAfterTaxSellValue ?? drop.prices?.megaLastDayPriceAfterTax ?? drop.prices?.marketPrice)}</td>
                                <td>{drop.source === "mega_test_calculator" ? "Battle sample" : "Drop table"}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="pet-muted">No drop breakdown matched this zone yet.</p>
                  )}
                </div>
                <div className="pet-detail-section">
                  <h3>
                    <BadgeInfo size={15} /> Scenario Context
                  </h3>
                  <div className="pet-source-list">
                    <div>
                      <span>Pet level</span>
                      <strong>{petLevel}</strong>
                    </div>
                    <div>
                      <span>Pet Mastery</span>
                      <strong>{masteryLevel} - {formatPercent(masteryLootChance)}</strong>
                    </div>
                    <div>
                      <span>Evolution</span>
                      <strong>{evolutionStage}</strong>
                    </div>
                    <div>
                      <span>Battle map</span>
                      <strong>{battleMapFilter === BEST_BATTLE_MAP ? "Best map" : shortBattleZoneLabel(battleMapFilter)}</strong>
                    </div>
                    <div>
                      <span>Metric</span>
                      <strong>{getProfitMetricLabel(foodPolicy)}</strong>
                    </div>
                    <div>
                      <span>Cycle mode</span>
                      <strong>{BATTLE_PROFIT_OPTIONS.find((option) => option.value === battleProfitMode)?.label}</strong>
                    </div>
                    <div>
                      <span>Food cost</span>
                      <strong>{FOOD_OPTIONS.find((option) => option.value === foodPolicy)?.label}</strong>
                    </div>
                    <div>
                      <span>Beastmaster</span>
                      <strong>{beastmaster ? "+10% pet EXP" : "Off"}</strong>
                    </div>
                  </div>
                </div>
                <div className="pet-research-note">
                  <BadgeInfo size={15} />
                  <span>Profit shown here follows the selected battle map, cycle mode, food cost setting, Pet Mastery loot chance, and current pet stats. Beastmaster is shown as pet EXP context.</span>
                </div>
              </article>
            </div>
            ),
            document.body,
          ) : null}
        </>
      )}
    </div>
  );
}
