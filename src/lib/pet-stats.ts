export type PetStatKey =
  | "agility"
  | "accuracy"
  | "protection"
  | "attack_power"
  | "movement_speed"
  | "max_health"
  | "max_stamina"
  | "critical_damage"
  | "critical_chance";

export type PetStatFormula = {
  base?: number;
  per_level?: number;
};

export const PET_MASTERY_BOOSTED_STATS = new Set<PetStatKey>([
  "agility",
  "accuracy",
  "protection",
  "attack_power",
  "movement_speed",
]);

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundPetBaseStat(value: number, statKey: PetStatKey) {
  if (statKey === "movement_speed") return roundTo(value, 1);
  return Math.floor(value);
}

export function roundPetBonusStat(value: number, statKey: PetStatKey) {
  if (statKey === "movement_speed") return roundTo(value, 2);
  return Math.round(value);
}

export function calculatePetStatValue(
  formula: PetStatFormula,
  options: {
    statKey: PetStatKey;
    level: number;
    masteryBonusPercent?: number;
    evolutionStage?: number;
    evolutionApplies?: boolean;
    patBonus?: boolean;
  },
) {
  const level = Math.max(1, Number(options.level || 1));
  const raw = Number(formula.base || 0) + (level - 1) * Number(formula.per_level || 0);

  if (!PET_MASTERY_BOOSTED_STATS.has(options.statKey)) {
    if (options.statKey === "critical_damage" || options.statKey === "critical_chance") return roundTo(raw, 2);
    return Math.floor(raw);
  }

  const baseStats = roundPetBaseStat(raw, options.statKey);
  const masteryBonus = Math.max(0, Number(options.masteryBonusPercent || 0)) / 100;
  const evolutionBonus =
    options.statKey !== "movement_speed" && options.evolutionApplies
      ? Math.min(5, Math.max(0, Number(options.evolutionStage || 0))) * 0.05
      : 0;
  const patBonus = options.statKey !== "movement_speed" && options.patBonus ? 0.05 : 0;
  const bonusStats = roundPetBonusStat(baseStats * (masteryBonus + evolutionBonus + patBonus), options.statKey);

  return baseStats + bonusStats;
}
