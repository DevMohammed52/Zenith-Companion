import type { ProfileOwnedPet, ProfilePetStats } from "@/lib/profiles";
import type { BattleProfitMode, FoodPolicy, PetRecord, StatKey, getBestBattleProfit } from "@/lib/pets";

export const STORAGE_KEY = "zenith_pet_compare_state_v1";
export const MAX_COMPARE = 4;
export const BEST_BATTLE_ZONE = "best";
export const DATABASE_OPTION_PREFIX = "db:";
export const OWNED_OPTION_PREFIX = "owned:";

export type CompareState = {
  selectedIds?: string[];
  selectedNames?: string[];
  petLevel?: number;
  masteryLevel?: number;
  evolutionStage?: number;
  evolutionStat?: StatKey | "all";
  patBonus?: boolean;
  battleMode?: BattleProfitMode;
  battleZone?: string;
  foodPolicy?: FoodPolicy;
};

export type ComparedPet = {
  id: string;
  label: string;
  subtitle: string;
  source: "database" | "owned";
  pet: PetRecord;
  ownedPet?: ProfileOwnedPet;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  battle: ReturnType<typeof getBestBattleProfit>;
};

export type PetOption = {
  id: string;
  kind: "database" | "owned";
  pet: PetRecord;
  ownedPet?: ProfileOwnedPet;
  title: string;
  subtitle: string;
  meta: string;
  searchText: string;
};

export const EVOLUTION_OPTIONS: Array<{ value: StatKey | "all"; label: string }> = [
  { value: "all", label: "All-stat preview" },
  { value: "agility", label: "Agility" },
  { value: "accuracy", label: "Accuracy" },
  { value: "protection", label: "Protection" },
  { value: "attack_power", label: "Attack Power" },
  { value: "movement_speed", label: "Move Speed" },
];

export const BATTLE_OPTIONS: Array<{ value: BattleProfitMode; label: string }> = [
  { value: "withSleep", label: "With sleep" },
  { value: "noSleep", label: "No sleep" },
  { value: "healingWithSleep", label: "Healing + sleep" },
];

export const FOOD_OPTIONS: Array<{ value: FoodPolicy; label: string }> = [
  { value: "standard", label: "Food cost" },
  { value: "none", label: "No food cost" },
];

export const PROFILE_STAT_TO_COMPARE_STAT: Array<[keyof ProfilePetStats, StatKey]> = [
  ["agility", "agility"],
  ["accuracy", "accuracy"],
  ["protection", "protection"],
  ["attackPower", "attack_power"],
  ["movementSpeed", "movement_speed"],
  ["maxHealth", "max_health"],
  ["maxStamina", "max_stamina"],
  ["criticalDamage", "critical_damage"],
  ["criticalChance", "critical_chance"],
];
