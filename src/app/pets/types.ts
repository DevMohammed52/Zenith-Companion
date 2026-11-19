import type { PetStatKey } from "@/lib/pet-stats";
import type { ProfileOwnedPet } from "@/lib/profiles";

export type Quality =
  | "STANDARD"
  | "REFINED"
  | "PREMIUM"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"
  | "UNIQUE"
  | "UNKNOWN";

export type StatKey = PetStatKey;

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

export type SortKey = "name" | "quality" | "power" | "speed" | "battleProfit" | "market" | "drop";
export type SourceFilter = "ALL" | "OWNED" | "EGG" | "BOSS" | "EXCHANGE" | "MERCHANT" | "EVENT" | "UNIQUE" | "MISSING_EGG";
export type ViewMode = "cards" | "table";
export type BattleProfitMode = "noSleep" | "withSleep" | "healingWithSleep";
export type FoodPolicy = "standard" | "none";
export type BattleDrop = NonNullable<BattleZone["drops"]>[number];

export type BattleSelection = {
  pet: PetRecord;
  zone: BattleZone;
};

export type PetRow = {
  pet: PetRecord;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  battleProfit: { value: number; zone: string | null; mode: BattleProfitMode | null };
  ownedPets: ProfileOwnedPet[];
  searchText: string;
};

export type StoredPetState = {
  searchTerm?: string;
  qualityFilter?: Quality | "ALL";
  sourceFilter?: SourceFilter;
  sortBy?: SortKey;
  sortDesc?: boolean;
  viewMode?: ViewMode;
  petLevel?: number;
  masteryLevel?: number;
  evolutionStage?: number;
  evolutionStat?: StatKey | "all";
  patBonus?: boolean;
  battleProfitMode?: BattleProfitMode;
  foodPolicy?: FoodPolicy | "workbook";
  beastmaster?: boolean;
};

export type PetSelectOption<T extends string> = { value: T; label: string; qualityTone?: string };

export const PET_DATABASE_STORAGE_KEY = "zenith_pet_database_state_v1";
export const MOBILE_PET_BATCH_SIZE = 36;

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

export const SORT_OPTIONS: Array<PetSelectOption<SortKey>> = [
  { value: "power", label: "Power" },
  { value: "speed", label: "Move Speed" },
  { value: "battleProfit", label: "Battle Samples" },
  { value: "market", label: "Lowest Listing" },
  { value: "drop", label: "Drop Chance" },
  { value: "quality", label: "Quality" },
  { value: "name", label: "Name" },
];

export const SOURCE_OPTIONS: Array<PetSelectOption<SourceFilter>> = [
  { value: "ALL", label: "All" },
  { value: "OWNED", label: "Owned by active profile" },
  { value: "EGG", label: "Has egg item" },
  { value: "BOSS", label: "World boss drop" },
  { value: "EXCHANGE", label: "Exchange listed" },
  { value: "MERCHANT", label: "Merchant" },
  { value: "EVENT", label: "Event / legacy" },
  { value: "UNIQUE", label: "Unique" },
  { value: "MISSING_EGG", label: "No linked egg item" },
];

export const EVOLUTION_STAT_OPTIONS: Array<PetSelectOption<StatKey | "all">> = [
  { value: "all", label: "All stats" },
  { value: "agility", label: "Agility" },
  { value: "accuracy", label: "Accuracy" },
  { value: "protection", label: "Protection" },
  { value: "attack_power", label: "Attack Power" },
  { value: "movement_speed", label: "Move Speed" },
];

export const BATTLE_PROFIT_OPTIONS: Array<{ value: BattleProfitMode; label: string }> = [
  { value: "withSleep", label: "With sleep" },
  { value: "noSleep", label: "No sleep" },
  { value: "healingWithSleep", label: "Healing + sleep" },
];

export const FOOD_OPTIONS: Array<{ value: FoodPolicy; label: string }> = [
  { value: "standard", label: "Food cost" },
  { value: "none", label: "No food" },
];

export const QUALITY_OPTIONS: Array<PetSelectOption<Quality | "ALL">> = [
  { value: "ALL", label: "All" },
  { value: "STANDARD", label: "STANDARD", qualityTone: "STANDARD" },
  { value: "REFINED", label: "REFINED", qualityTone: "REFINED" },
  { value: "PREMIUM", label: "PREMIUM", qualityTone: "PREMIUM" },
  { value: "EPIC", label: "EPIC", qualityTone: "EPIC" },
  { value: "LEGENDARY", label: "LEGENDARY", qualityTone: "LEGENDARY" },
  { value: "MYTHIC", label: "MYTHIC", qualityTone: "MYTHIC" },
  { value: "UNIQUE", label: "UNIQUE", qualityTone: "UNIQUE" },
];
