import { calculatePetStatValue } from "@/lib/pet-stats";
import { formatQualityLabel } from "@/lib/quality";
import type { ProfileOwnedPet } from "@/lib/profiles";
import {
  STAT_LABELS,
  type BattleDrop,
  type BattleProfitMode,
  type BattleZone,
  type FoodPolicy,
  type PetDatabase,
  type PetRecord,
  type PetSourceOverride,
  type StatKey,
} from "../types";

export function isDisplayableBattleDrop(drop: BattleDrop | null | undefined) {
  const itemName = String(drop?.itemName || "").trim();
  if (!itemName) return false;
  const normalized = itemName.replace(/[\s_:-]+/g, " ").toLowerCase();
  if (["total", "grand total", "subtotal", "average", "material", "item", "drop"].includes(normalized)) return false;
  return (drop?.expectedDropPercent !== null && drop?.expectedDropPercent !== undefined) || Boolean(drop?.prices);
}

export function formatGold(value?: number | null) {
  if (!value || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

export function formatCompactGold(value?: number | null) {
  if (!value || value <= 0) return "-";
  return `${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(value))}g`;
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
  return formatQualityLabel(quality);
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

export function calculateStats(
  pet: PetRecord,
  level: number,
  masteryBonusPercent: number,
  evolutionStage: number,
  evolutionStat: StatKey | "all",
  patBonus: boolean,
) {
  const stats = pet.stats || {};
  const values: Partial<Record<StatKey, number>> = {};

  (Object.keys(STAT_LABELS) as StatKey[]).forEach((key) => {
    const stat = stats[key];
    if (!stat) return;
    values[key] = calculatePetStatValue(stat, {
      statKey: key,
      level,
      masteryBonusPercent,
      evolutionStage,
      evolutionApplies: evolutionStat === "all" || evolutionStat === key,
      patBonus,
    });
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
  if (foodPolicy === "none") {
    value += Number(zone.foodCostPerHourCheapest || 0);
  }
  return value;
}

export function getBestBattleProfit(pet: PetRecord, mode: BattleProfitMode, foodPolicy: FoodPolicy) {
  const zones = pet.battle?.zones || [];
  return zones.reduce(
    (best, zone) => {
      const value = getZoneProfitValue(zone, mode, foodPolicy);
      if (value <= best.value) return best;
      return {
        value,
        zone: zone.zone,
        mode,
      };
    },
    { value: 0, zone: null as string | null, mode: null as BattleProfitMode | null },
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

export function ownedPetSearchText(pets: ProfileOwnedPet[]) {
  return pets
    .flatMap((pet) => [pet.nickname, pet.species, pet.quality, pet.source, pet.location?.name, pet.hashTail])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getPetSourceLabel(pet: PetRecord) {
  return pet.sourceOverride?.label || pet.rarity?.worldBoss || pet.acquisition?.[0]?.location || "Source pending";
}

export function getMerchantPrice(source?: PetSourceOverride | null) {
  if (!source?.merchant) return null;
  const price = source.merchant.price;
  if (!price) return source.merchant.name;
  return `${source.merchant.name} - ${price.toLocaleString()} ${source.merchant.currency || "shards"}`;
}

export function formatBattleZoneCount(pet: PetRecord) {
  const count = pet.battle?.zones?.length || 0;
  if (!count) return "-";
  return `${count} zone${count === 1 ? "" : "s"}`;
}

export function getBestBattleZone(pet: PetRecord, mode: BattleProfitMode, foodPolicy: FoodPolicy) {
  return (pet.battle?.zones || []).reduce<BattleZone | null>((best, zone) => {
    if (!best) return zone;
    return getZoneProfitValue(zone, mode, foodPolicy) > getZoneProfitValue(best, mode, foodPolicy) ? zone : best;
  }, null);
}
