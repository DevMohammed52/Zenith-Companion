export type Quality =
  | "STANDARD"
  | "REFINED"
  | "PREMIUM"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"
  | "UNIQUE"
  | "UNKNOWN";

export type StatKey =
  | "agility"
  | "accuracy"
  | "protection"
  | "attack_power"
  | "movement_speed"
  | "max_health"
  | "max_stamina"
  | "critical_damage"
  | "critical_chance";

export type BattleProfitMode = "noSleep" | "withSleep" | "healingWithSleep";
export type FoodPolicy = "standard" | "none";

export type PetStat = {
  base: number;
  per_level: number;
};

export type PetEgg = {
  name: string;
  hashedId?: string;
  imageUrl?: string | null;
  quality: Quality;
  vendorPrice?: number | null;
  isTradeable?: boolean;
  worldBosses?: Array<{ id?: number; name: string }>;
};

export type PetAcquisition = {
  boss?: string;
  location?: string;
  levelRequirement?: string;
  egg?: string;
  chancePercent?: number | null;
  quality?: Quality;
};

export type PetExchange = {
  listingCount: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  averagePrice?: number | null;
  medianPrice?: number | null;
  sampleListings?: Array<{ level?: number | null; quality?: Quality; price?: number | null }>;
};

export type PetSourceOverride = {
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

export type BattleDrop = {
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
};

export type BattleZone = {
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
  drops?: BattleDrop[];
  ranking?: {
    rank?: string | null;
    profit_per_hour_pm100?: number | null;
    pet_exp_profit_efficiency_scale?: number | null;
  } | null;
};

export type PetRecord = {
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
    quality?: Quality;
    worldBoss?: string;
    battlePlusRespawnSeconds?: number | null;
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

export type MasteryLevel = {
  level: number;
  stat_bonus_percent?: number | null;
};

export type PetDatabase = {
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

export type OwnedPetMatchInput = {
  petId?: number;
  species?: string;
  nickname?: string;
};

export type PetMatchLookup = {
  byId: Map<number, PetRecord>;
  byName: Map<string, PetRecord>;
};

export const QUALITY_ORDER: Record<Quality, number> = {
  UNKNOWN: 0,
  STANDARD: 1,
  REFINED: 2,
  PREMIUM: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
  UNIQUE: 7,
};

export const QUALITY_COLORS: Record<Quality, string> = {
  UNKNOWN: "#94a3b8",
  STANDARD: "#e4e4e7",
  REFINED: "#60a5fa",
  PREMIUM: "#4ade80",
  EPIC: "#a855f7",
  LEGENDARY: "#f59e0b",
  MYTHIC: "#ef4444",
  UNIQUE: "#ec4899",
};

export const STAT_LABELS: Record<StatKey, string> = {
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

export const CORE_STAT_KEYS: StatKey[] = ["attack_power", "protection", "agility", "accuracy"];
export const COMPARISON_STAT_KEYS: StatKey[] = [
  "attack_power",
  "protection",
  "agility",
  "accuracy",
  "movement_speed",
  "max_health",
  "max_stamina",
  "critical_damage",
  "critical_chance",
];

const BOOSTED_STATS = new Set<StatKey>(["agility", "accuracy", "protection", "attack_power", "movement_speed"]);

export function normalizePetMatchName(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPetRecordMatchKey(pet: Pick<PetRecord, "id" | "name">) {
  return typeof pet.id === "number" && Number.isFinite(pet.id)
    ? `id:${pet.id}`
    : `name:${normalizePetMatchName(pet.name)}`;
}

export function buildPetMatchLookup(pets: PetRecord[]): PetMatchLookup {
  const byId = new Map<number, PetRecord>();
  const byName = new Map<string, PetRecord>();
  for (const pet of pets) {
    if (typeof pet.id === "number" && Number.isFinite(pet.id)) byId.set(pet.id, pet);
    const name = normalizePetMatchName(pet.name);
    if (name) byName.set(name, pet);
  }
  return { byId, byName };
}

export function findPetRecordForOwnedPet(ownedPet: OwnedPetMatchInput, lookup: PetMatchLookup) {
  if (typeof ownedPet.petId === "number" && Number.isFinite(ownedPet.petId)) {
    const byId = lookup.byId.get(ownedPet.petId);
    if (byId) return byId;
  }
  const bySpecies = lookup.byName.get(normalizePetMatchName(ownedPet.species));
  if (bySpecies) return bySpecies;
  return lookup.byName.get(normalizePetMatchName(ownedPet.nickname));
}

export function formatGold(value?: number | null) {
  if (!value || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

export function formatNumber(value?: number | null, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatPercent(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${normalized.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function qualityLabel(quality: string) {
  if (!quality) return "Unknown";
  return quality.charAt(0) + quality.slice(1).toLowerCase();
}

export function secondsToDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const sec = rounded % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${sec}s`;
  return `${sec}s`;
}

export function getMasteryBonus(database: PetDatabase | null, level: number) {
  const levels = database?.mastery?.levels || [];
  const found = levels.find((entry) => Number(entry.level) === level);
  const rawBonus = Number(found?.stat_bonus_percent || 0);
  return rawBonus <= 1 ? rawBonus * 100 : rawBonus;
}

export function calculatePetStats(
  pet: PetRecord,
  level: number,
  masteryBonusPercent: number,
  evolutionStage: number,
  evolutionStat: StatKey | "all",
  patBonus: boolean,
) {
  const stats = pet.stats || {};
  const evolutionBoostPercent = evolutionStage * 5;
  const values: Partial<Record<StatKey, number>> = {};

  (Object.keys(STAT_LABELS) as StatKey[]).forEach((key) => {
    const stat = stats[key];
    if (!stat) return;
    const raw = Number(stat.base || 0) + (level - 1) * Number(stat.per_level || 0);
    const patBoostPercent = patBonus && key !== "movement_speed" ? 5 : 0;
    const boostPercent = masteryBonusPercent + patBoostPercent + (evolutionStat === "all" || evolutionStat === key ? evolutionBoostPercent : 0);
    const boosted = BOOSTED_STATS.has(key) ? raw * (1 + boostPercent / 100) : raw;
    values[key] = key === "movement_speed" || key === "critical_damage" || key === "critical_chance" ? Number(boosted.toFixed(2)) : Math.floor(boosted);
  });

  return values;
}

export function getTotalPower(stats: Partial<Record<StatKey, number>>) {
  return Math.floor(
    Number(stats.attack_power || 0) +
      Number(stats.protection || 0) +
      Number(stats.agility || 0) +
      Number(stats.accuracy || 0),
  );
}

export function getHuntingTimeSeconds(stats: Partial<Record<StatKey, number>>) {
  const agility = Number(stats.agility || 0);
  const movementSpeed = Number(stats.movement_speed || 0);
  return 200 - 125 * (0.7 * Math.min(agility / 120, 1) + 0.3 * Math.min(movementSpeed / 100, 1));
}

export function getZoneProfitValue(zone: BattleZone, mode: BattleProfitMode, foodPolicy: FoodPolicy) {
  let value =
    mode === "noSleep"
      ? Number(zone.expectedProfitPerHourNoSleep || 0)
      : mode === "healingWithSleep"
        ? Number(zone.expectedProfitPerHourHealingWithSleep || 0)
        : Number(zone.expectedProfitPerHourWithSleep || 0);
  if (foodPolicy === "none") value += Number(zone.foodCostPerHourCheapest || 0);
  return value;
}

export function getBestBattleProfit(pet: PetRecord, mode: BattleProfitMode, foodPolicy: FoodPolicy) {
  const zones = pet.battle?.zones || [];
  if (!zones.length) return { value: 0, zone: null as string | null, mode: null as BattleProfitMode | null };
  return zones.reduce(
    (best, zone) => {
      const value = getZoneProfitValue(zone, mode, foodPolicy);
      if (value <= best.value) return best;
      return { value, zone: zone.zone, mode };
    },
    { value: Number.NEGATIVE_INFINITY, zone: null as string | null, mode: null as BattleProfitMode | null },
  );
}

export function petSearchText(pet: PetRecord) {
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getPetSourceLabel(pet: PetRecord) {
  return pet.sourceOverride?.label || pet.rarity?.worldBoss || pet.acquisition?.[0]?.location || "Source pending";
}

export function getPetImage(pet: PetRecord) {
  return pet.imageUrl || pet.egg?.imageUrl || pet.sourceOverride?.imageUrl || null;
}

export function isUpsideDownPet(petOrName: PetRecord | string | null | undefined) {
  const name = typeof petOrName === "string" ? petOrName : petOrName?.name;
  return String(name || "").trim().toLowerCase() === "dead wyrmshadow";
}

export function isDisplayableBattleDrop(drop: BattleDrop | null | undefined) {
  const itemName = String(drop?.itemName || "").trim();
  if (!itemName) return false;
  const normalized = itemName.replace(/[\s_:-]+/g, " ").toLowerCase();
  if (["total", "grand total", "subtotal", "average", "material", "item", "drop"].includes(normalized)) return false;
  return (drop?.expectedDropPercent !== null && drop?.expectedDropPercent !== undefined) || Boolean(drop?.prices);
}
