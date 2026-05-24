import type { CharacterProfile } from "@/lib/profiles";
import { calculatePetStatValue, type PetStatKey } from "@/lib/pet-stats";

export type ProfileItemRecord = {
  name?: string;
  type?: string;
  quality?: string;
  image_url?: string;
  max_tier?: number;
  requirements?: Record<string, number | null> | null;
  stats?: Record<string, number> | null;
  effects?: Array<{ value?: number; target?: string; attribute?: string; value_type?: string }> | null;
  tier_modifiers?: Record<string, number> | null;
};

export type PetDatabaseRecord = {
  name: string;
  quality?: string;
  imageUrl?: string;
  acquisition?: Array<{ boss?: string; location?: string | null }>;
  stats?: Record<string, { base?: number; per_level?: number }>;
};

export const RARITY_ORDER = ["STANDARD", "REFINED", "PREMIUM", "EPIC", "LEGENDARY", "MYTHIC"];

export type PetMasteryLevelRecord = {
  level?: number;
  stat_bonus_percent?: number;
};

export const STAT_LABELS: Record<string, string> = {
  attack_power: "Attack Power",
  attackPower: "Attack Power",
  protection: "Protection",
  agility: "Agility",
  accuracy: "Accuracy",
  critical_chance: "Crit Chance",
  criticalChance: "Crit Chance",
  critical_damage: "Crit Damage",
  criticalDamage: "Crit Damage",
  movement_speed: "Movement Speed",
  movementSpeed: "Movement Speed",
  max_health: "Max Health",
  maxHealth: "Max Health",
  max_stamina: "Max Stamina",
  maxStamina: "Max Stamina",
  damage: "Damage",
};

export const CLASS_DATA = [
  {
    id: "Warrior",
    category: "Combat",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/warrior.png",
    summary: "Melee combat class focused on strength, damage, and protection.",
    effects: ["+10% Strength EXP", "+5% Battle EXP", "+5% Hunting Efficiency"],
    notes: ["Market-accessible class.", "Battle talents unlock automatically from Combat level."],
    talents: [
      { level: 10, name: "Mighty Strike", description: "+2 damage", stat: "damage", value: 2 },
      { level: 35, name: "Rampage", description: "+10 crit damage", stat: "criticalDamage", value: 10 },
      { level: 70, name: "Shield Wall", description: "+40 protection", stat: "protection", value: 40 },
    ],
  },
  {
    id: "Shadowblade",
    category: "Combat",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/shadowblade.png",
    summary: "Dexterity-style combat class focused on speed, crits, and agility.",
    effects: ["+5% Speed EXP", "+10% Hunting Efficiency", "+5% Battle EXP"],
    notes: ["Market-accessible class.", "Battle talents unlock automatically from Combat level."],
    talents: [
      { level: 10, name: "Backstab", description: "+2% crit chance", stat: "criticalChance", value: 2 },
      { level: 35, name: "Shadow Piercer", description: "+10% crit damage", stat: "criticalDamage", value: 10 },
      { level: 70, name: "Shadow's Veil", description: "+40 agility", stat: "agility", value: 40 },
    ],
  },
  {
    id: "Ranger",
    category: "Combat",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/ranger.png",
    summary: "Ranged combat class focused on dexterity, hunting efficiency, and crits.",
    effects: ["+7% Dexterity EXP", "+8% Hunting Efficiency", "+5% Battle EXP"],
    notes: ["Market-accessible class.", "Keep bow and hunting efficiency connected for future pages."],
    talents: [
      { level: 10, name: "Piercing Shot", description: "+2 damage", stat: "damage", value: 2 },
      { level: 35, name: "Eagles Eye", description: "+3% crit chance", stat: "criticalChance", value: 3 },
      { level: 70, name: "Nature's Aid", description: "+10% crit damage", stat: "criticalDamage", value: 10 },
    ],
  },
  {
    id: "Miner",
    category: "Skill",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/CwqOzwaWgR9ooe0BVEpgtKCAduFpka-metabWluaW5nLnBuZw==-.png",
    summary: "Mining class.",
    effects: ["+10% Mining Efficiency", "+10% Mining Experience"],
    notes: ["No battle talents."],
    talents: [],
  },
  {
    id: "Angler",
    category: "Skill",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/aFjVlrHK2um38ufObrBRXGOZOxGHsj-metaZmlzaGluZy5wbmc=-.png",
    summary: "Fishing class.",
    effects: ["+10% Fishing Efficiency", "+10% Fishing Experience"],
    notes: ["No battle talents."],
    talents: [],
  },
  {
    id: "Chef",
    category: "Skill",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/wI2XxGzeSRX6AFMRUADAnKji9NgOIK-metaY29va2luZy5wbmc=-.png",
    summary: "Cooking class.",
    effects: ["+10% Cooking Efficiency", "+10% Cooking Experience"],
    notes: ["No battle talents."],
    talents: [],
  },
  {
    id: "Lumberjack",
    category: "Skill",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/DKC4LgMAyoUlDmo99LJOVbtUZsezIi-metad29vZGN1dHRpbmcucG5n-.png",
    summary: "Woodcutting class.",
    effects: ["+10% Woodcutting Efficiency", "+10% Woodcutting Experience"],
    notes: ["No battle talents."],
    talents: [],
  },
  {
    id: "Smelter",
    category: "Skill",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01JRWSP42RZ5G3BJ0GHANYYEWQ.png",
    summary: "Smelting class.",
    effects: ["+10% Smelting Efficiency", "+10% Smelting Experience"],
    notes: ["No battle talents."],
    talents: [],
  },
  {
    id: "Beastmaster",
    category: "Pets",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01KF18A1Y2ZPVX1BBYF4FNZV39.png",
    summary: "Pet-focused class.",
    effects: ["+10% Pet Mastery Experience", "+10% Pet Experience"],
    notes: ["Pet EXP effect applies to pets individually.", "No battle talents."],
    talents: [],
  },
  {
    id: "Banished",
    category: "Restricted",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01J8MJ7P4MGEYANXQQW3DCEQRP.png",
    summary: "Market-locked self-found class.",
    effects: ["No permanent stat effects"],
    notes: ["Cannot access market or trading.", "Locked class.", "50% teleport discount."],
    talents: [],
  },
  {
    id: "Forsaken",
    category: "Restricted",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/forsaken.png",
    summary: "Challenge class with severe EXP penalties.",
    effects: ["-50% Skill Experience", "-50% Battle Experience", "-50% Dungeon Experience"],
    notes: ["Market-accessible, so it still counts toward active market-accessible character limits.", "Locked class."],
    talents: [],
  },
  {
    id: "Cursed",
    category: "Restricted",
    icon: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01J8MJ7D822Z5CR3DMCY1C9QNQ.png",
    summary: "Market-locked challenge class with EXP penalties.",
    effects: ["-50% Skill Experience", "-50% Battle Experience", "-50% Dungeon Experience"],
    notes: ["Cannot access market or trading.", "Locked class.", "50% teleport discount."],
    talents: [],
  },
  {
    id: "Other",
    category: "Manual",
    icon: "",
    summary: "Manual class option for unsupported or future class states.",
    effects: ["No automatic class effects"],
    notes: ["Use manual overrides until the class is verified."],
    talents: [],
  },
] as const;

export type ClassInfo = (typeof CLASS_DATA)[number];

export function getClassInfo(className: string): ClassInfo {
  return CLASS_DATA.find((entry) => entry.id === className) || CLASS_DATA[CLASS_DATA.length - 1];
}

export function dailyStreakMagicFind(streak: number | "") {
  const value = Number(streak || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(10, Math.floor(value / 10));
}

export function barteringBuffPercent(level: number | "") {
  const value = Math.min(100, Math.max(0, Number(level || 0)));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 0.2);
}

export function getProfileBarteringBoost(profile: CharacterProfile | null | undefined) {
  return barteringBuffPercent(profile?.boosts?.barteringLevel ?? 0);
}

export function getProfileConquestRank(profile: CharacterProfile | null | undefined) {
  return profile?.boosts?.conquestRank || "none";
}

export function ascensionLevel(value: number | "") {
  const level = Number(value || 0);
  return level > 100 ? level - 100 : 0;
}

export function formatStatName(key: string) {
  return STAT_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function roundStat(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function addStat(target: Record<string, number>, key: string, value: number | undefined) {
  if (!Number.isFinite(Number(value))) return;
  target[key] = roundStat((target[key] || 0) + Number(value));
}

export function getPetMasteryStatBonus(levels: PetMasteryLevelRecord[] | undefined, level: number | "") {
  const masteryLevel = Math.min(100, Math.max(1, Number(level || 1)));
  const found = levels?.find((entry) => Number(entry.level) === masteryLevel);
  const rawBonus = Number(found?.stat_bonus_percent || 0);
  return rawBonus <= 1 ? rawBonus * 100 : rawBonus;
}

export function calculatePetStats(
  pet: PetDatabaseRecord | undefined,
  level: number | "",
  evolution: number | "",
  masteryBonusPercent = 0,
) {
  const stats = {
    agility: "" as number | "",
    accuracy: "" as number | "",
    protection: "" as number | "",
    attackPower: "" as number | "",
    movementSpeed: "" as number | "",
    maxHealth: "" as number | "",
    maxStamina: "" as number | "",
    criticalDamage: "" as number | "",
    criticalChance: "" as number | "",
  };
  if (!pet?.stats) return stats;
  const petLevel = Math.max(1, Number(level || 1));
  const evo = Math.max(0, Number(evolution || 0));
  const mapping: Record<string, keyof typeof stats> = {
    agility: "agility",
    accuracy: "accuracy",
    protection: "protection",
    attack_power: "attackPower",
    movement_speed: "movementSpeed",
    max_health: "maxHealth",
    max_stamina: "maxStamina",
    critical_damage: "criticalDamage",
    critical_chance: "criticalChance",
  };
  for (const [rawKey, formula] of Object.entries(pet.stats)) {
    const key = mapping[rawKey];
    if (!key) continue;
    stats[key] = calculatePetStatValue(formula, {
      statKey: rawKey as PetStatKey,
      level: petLevel,
      masteryBonusPercent,
      evolutionStage: evo,
      evolutionApplies: true,
    });
  }
  return stats;
}

export function getItemRequirementLevel(item: ProfileItemRecord | undefined) {
  if (!item?.requirements) return 0;
  return Math.max(0, ...Object.values(item.requirements).map((value) => Number(value || 0)));
}

export function sortProfileItems(items: ProfileItemRecord[]) {
  return [...items].sort((a, b) => {
    const qualityDelta = RARITY_ORDER.indexOf(String(a.quality || "")) - RARITY_ORDER.indexOf(String(b.quality || ""));
    if (qualityDelta !== 0) return qualityDelta;
    const levelDelta = getItemRequirementLevel(a) - getItemRequirementLevel(b);
    if (levelDelta !== 0) return levelDelta;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function calculateGearStats(item: ProfileItemRecord | undefined, tierValue: number | "") {
  const stats: Record<string, number> = {};
  if (!item) return stats;
  const tier = Math.max(1, Number(tierValue || 1));
  for (const [key, value] of Object.entries(item.stats || {})) addStat(stats, key, value);
  for (const [key, value] of Object.entries(item.tier_modifiers || {})) addStat(stats, key, Number(value) * Math.max(0, tier - 1));
  return stats;
}

export function getToolEfficiency(item: ProfileItemRecord | undefined) {
  if (!item?.effects) return 0;
  return item.effects.reduce((total, effect) => {
    if (effect.value_type === "efficiency") return total + Number(effect.value || 0);
    return total;
  }, 0);
}

export function getItemEffectBonus(
  item: ProfileItemRecord | undefined,
  target: string,
  attribute: string,
) {
  if (!item?.effects) return 0;
  const normalizedTarget = target.toLowerCase();
  const normalizedAttribute = attribute.toLowerCase();
  return item.effects.reduce((total, effect) => {
    const effectTarget = String(effect.target || "").toLowerCase();
    const effectAttribute = String(effect.attribute || "").toLowerCase();
    if (effectTarget !== normalizedTarget || effectAttribute !== normalizedAttribute) return total;
    return total + Number(effect.value || 0);
  }, 0);
}

export function getProfileEquippedSpecialItem(
  profile: CharacterProfile | null | undefined,
  itemByName: Record<string, ProfileItemRecord | undefined>,
) {
  if (!profile) return undefined;
  return itemByName[profile.gear.special || ""];
}

export function getProfileSpecialEffectBonus(
  profile: CharacterProfile | null | undefined,
  itemByName: Record<string, ProfileItemRecord | undefined>,
  target: string,
  attribute: string,
) {
  return getItemEffectBonus(getProfileEquippedSpecialItem(profile, itemByName), target, attribute);
}

export function calculateProfileSecondaryStats(
  profile: CharacterProfile,
  itemByName: Record<string, ProfileItemRecord | undefined>,
) {
  const totals: Record<string, number> = {
    attackPower: Math.round(Number(profile.levels.strength || 0) * 2.4),
    protection: Math.round(Number(profile.levels.defence || 0) * 2.4),
    agility: Math.round(Number(profile.levels.speed || 0) * 2.4),
    accuracy: Math.round(Number(profile.levels.dexterity || 0) * 2.4),
    criticalChance: 0,
    criticalDamage: 0,
    movementSpeed: 3,
    damage: 0,
  };

  const statMap: Record<string, string> = {
    attack_power: "attackPower",
    protection: "protection",
    agility: "agility",
    accuracy: "accuracy",
    critical_chance: "criticalChance",
    critical_damage: "criticalDamage",
    movement_speed: "movementSpeed",
    damage: "damage",
  };
  const activeSlots = new Set([
    "helmet",
    "chestplate",
    "greaves",
    "boots",
    "gauntlets",
    "special",
    ...(profile.combatStyle === "dualDaggers"
      ? ["weapon", "offhandWeapon"]
      : profile.combatStyle === "bow"
        ? ["bow"]
        : ["weapon", "shield"]),
  ]);

  for (const [slot, itemName] of Object.entries(profile.gear)) {
    if (!activeSlots.has(slot)) continue;
    const itemStats = calculateGearStats(itemByName[itemName], profile.gearTiers[slot] || 1);
    for (const [key, value] of Object.entries(itemStats)) addStat(totals, statMap[key] || key, value);
  }

  for (const [key, value] of Object.entries(profile.pet.stats)) addStat(totals, key, Number(value || 0));

  const classInfo = getClassInfo(profile.className);
  const combatLevel = Number(profile.levels.combat || 0);
  for (const talent of classInfo.talents) {
    if (combatLevel >= talent.level) addStat(totals, talent.stat, talent.value);
  }

  return {
    attackPower: roundStat(totals.attackPower),
    protection: roundStat(totals.protection),
    agility: roundStat(totals.agility),
    accuracy: roundStat(totals.accuracy),
    criticalChance: roundStat(totals.criticalChance),
    criticalDamage: roundStat(totals.criticalDamage),
    movementSpeed: roundStat(totals.movementSpeed),
    damage: roundStat(totals.damage),
  };
}
