import type { ProfileOwnedPet, ProfilePetStats } from "@/lib/profiles";
import type { BattleProfitMode, FoodPolicy, PetRecord, StatKey } from "@/lib/pets";
import {
  BATTLE_OPTIONS,
  DATABASE_OPTION_PREFIX,
  OWNED_OPTION_PREFIX,
  PROFILE_STAT_TO_COMPARE_STAT,
  type ComparedPet,
} from "../types";

export function databaseOptionId(name: string) {
  return `${DATABASE_OPTION_PREFIX}${name}`;
}

export function ownedOptionId(id: string) {
  return `${OWNED_OPTION_PREFIX}${id}`;
}

export function toStatNumber(value: number | "") {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function ownedPetStatsToComparisonStats(stats: ProfilePetStats): Partial<Record<StatKey, number>> {
  return Object.fromEntries(
    PROFILE_STAT_TO_COMPARE_STAT.map(([profileKey, compareKey]) => [
      compareKey,
      toStatNumber(stats[profileKey]),
    ]),
  ) as Partial<Record<StatKey, number>>;
}

export function ownedPetMissingStatCount(stats: ProfilePetStats) {
  return PROFILE_STAT_TO_COMPARE_STAT.filter(([profileKey]) => stats[profileKey] === "").length;
}

export function ownedPetSearchText(ownedPet: ProfileOwnedPet) {
  return [
    ownedPet.nickname,
    ownedPet.species,
    ownedPet.quality,
    ownedPet.source,
    ownedPet.location?.name,
    ownedPet.hashTail,
    ownedPet.apiId,
    ownedPet.petId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function formatOwnedPetMeta(ownedPet: ProfileOwnedPet) {
  const level = ownedPet.level === "" ? "Lv. ?" : `Lv. ${ownedPet.level}`;
  const evolution = ownedPet.evolution === "" ? "Evo ?" : `Evo ${ownedPet.evolution}`;
  const source = ownedPet.source === "imported" ? "Imported" : "Manual";
  return `${source} snapshot - ${level} - ${evolution}`;
}

export function metricValue(row: ComparedPet, key: string) {
  if (key === "power") return row.totalPower;
  if (key === "hunt") return row.huntingTime;
  if (key === "battle") return row.battle.value;
  if (key === "market") return row.pet.exchange?.minPrice || 0;
  return Number(row.stats[key as StatKey] || 0);
}

export function getBattleModeLabel(mode: BattleProfitMode) {
  return BATTLE_OPTIONS.find((option) => option.value === mode)?.label || "Battle sample";
}

export function getFoodPolicyLabel(policy: FoodPolicy) {
  return policy === "standard" ? "Food cost included" : "Food cost ignored";
}

export function formatBattleEv(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value === 0) return "0g";
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "" : "-";
  return `${sign}${Math.abs(rounded).toLocaleString()}g`;
}

export function getRecordedZoneCount(pet: PetRecord) {
  return pet.battle?.zones?.filter((zone) => zone.zone).length || 0;
}

export function getRecordedDropCount(pet: PetRecord, zoneName: string | null) {
  if (!zoneName) return 0;
  const zone = pet.battle?.zones?.find((entry) => entry.zone === zoneName);
  return zone?.drops?.filter((drop) => drop.itemName).length || 0;
}
