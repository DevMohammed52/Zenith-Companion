export type ProfileClassRule = {
  value: string;
  label: string;
  iconUrl?: string;
  category: string;
  dropdownDetail: string;
  description: string;
  permanentEffects: string[];
  notes?: string[];
  battleTalents: Array<{
    name: string;
    level: number;
    effect: string;
    statDeltas?: Partial<Record<ProfileStatKey, number>>;
  }>;
};

export type ProfileStatKey =
  | "attackPower"
  | "protection"
  | "agility"
  | "accuracy"
  | "criticalChance"
  | "criticalDamage"
  | "movementSpeed"
  | "damage";

export type RawItemLike = {
  name?: string;
  type?: string;
  quality?: string;
  max_tier?: number;
  image_url?: string | null;
  requirements?: Record<string, number | string | null> | null;
  stats?: Record<string, number | string | null> | null;
  effects?: Array<{ value?: number | string; target?: string; attribute?: string; value_type?: string }> | null;
  tier_modifiers?: Record<string, number | string | null> | null;
  upgrade_requirements?: Array<{ item_name?: string; quantity?: number | string }> | null;
};

export type ProfilePrimaryLevels = {
  strength?: number | "";
  defence?: number | "";
  speed?: number | "";
  dexterity?: number | "";
};

export const QUALITY_ORDER: Record<string, number> = {
  STANDARD: 1,
  REFINED: 2,
  PREMIUM: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
  UNIQUE: 7,
};

export const STAT_LABELS: Record<ProfileStatKey, string> = {
  attackPower: "Attack Power",
  protection: "Protection",
  agility: "Agility",
  accuracy: "Accuracy",
  criticalChance: "Crit Chance",
  criticalDamage: "Crit Damage",
  movementSpeed: "Movement Speed",
  damage: "Damage",
};

export const CLASS_RULES: ProfileClassRule[] = [
  {
    value: "Warrior",
    label: "Warrior",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/warrior.png",
    category: "Combat",
    dropdownDetail: "Melee combat",
    description: "Strength-focused combat class built around close-quarters damage and durability.",
    permanentEffects: ["+10% Strength EXP", "+5% Battle EXP", "+5% Hunting Efficiency"],
    battleTalents: [
      { name: "Mighty Strike", level: 10, effect: "+2 Damage", statDeltas: { damage: 2 } },
      { name: "Rampage", level: 35, effect: "+10 Critical Attack", statDeltas: { criticalDamage: 10 } },
      { name: "Shield Wall", level: 70, effect: "+40 Protection", statDeltas: { protection: 40 } },
    ],
  },
  {
    value: "Shadowblade",
    label: "Shadowblade",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/shadowblade.png",
    category: "Combat",
    dropdownDetail: "Dexterity combat",
    description: "Agile combat class focused on speed, dexterity, critical hits, and evasion.",
    permanentEffects: ["+5% Speed EXP", "+10% Hunting Efficiency", "+5% Battle EXP"],
    battleTalents: [
      { name: "Backstab", level: 10, effect: "+2% Critical Chance", statDeltas: { criticalChance: 2 } },
      { name: "Shadow Piercer", level: 35, effect: "+10% Critical Damage", statDeltas: { criticalDamage: 10 } },
      { name: "Shadow's Veil", level: 70, effect: "+40 Agility", statDeltas: { agility: 40 } },
    ],
  },
  {
    value: "Ranger",
    label: "Ranger",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/ranger.png",
    category: "Combat",
    dropdownDetail: "Ranged combat",
    description: "Bow-focused combat class with dexterity and hunting bonuses.",
    permanentEffects: ["+7% Dexterity Experience", "+8% Hunting Efficiency", "+5% Battle EXP"],
    battleTalents: [
      { name: "Piercing Shot", level: 10, effect: "+2 Damage", statDeltas: { damage: 2 } },
      { name: "Eagles Eye", level: 35, effect: "+3% Critical Chance", statDeltas: { criticalChance: 3 } },
      { name: "Nature's Aid", level: 70, effect: "+10% Critical Damage", statDeltas: { criticalDamage: 10 } },
    ],
  },
  {
    value: "Miner",
    label: "Miner",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/CwqOzwaWgR9ooe0BVEpgtKCAduFpka-metabWluaW5nLnBuZw==-.png",
    category: "Skill",
    dropdownDetail: "Mining",
    description: "Mining-focused class for ore gathering and mining experience.",
    permanentEffects: ["+10% Mining Efficiency", "+10% Mining Experience"],
    battleTalents: [],
  },
  {
    value: "Angler",
    label: "Angler",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/aFjVlrHK2um38ufObrBRXGOZOxGHsj-metaZmlzaGluZy5wbmc=-.png",
    category: "Skill",
    dropdownDetail: "Fishing",
    description: "Fishing-focused class for catch speed and fishing experience.",
    permanentEffects: ["+10% Fishing Efficiency", "+10% Fishing Experience"],
    battleTalents: [],
  },
  {
    value: "Chef",
    label: "Chef",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/wI2XxGzeSRX6AFMRUADAnKji9NgOIK-metaY29va2luZy5wbmc=-.png",
    category: "Skill",
    dropdownDetail: "Cooking",
    description: "Cooking-focused class for food production and cooking experience.",
    permanentEffects: ["+10% Cooking Efficiency", "+10% Cooking Experience"],
    battleTalents: [],
  },
  {
    value: "Lumberjack",
    label: "Lumberjack",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/DKC4LgMAyoUlDmo99LJOVbtUZsezIi-metad29vZGN1dHRpbmcucG5n-.png",
    category: "Skill",
    dropdownDetail: "Woodcutting",
    description: "Woodcutting-focused class for timber gathering and woodcutting experience.",
    permanentEffects: ["+10% Woodcutting Efficiency", "+10% Woodcutting Experience"],
    battleTalents: [],
  },
  {
    value: "Smelter",
    label: "Smelter",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01JRWSP42RZ5G3BJ0GHANYYEWQ.png",
    category: "Skill",
    dropdownDetail: "Smelting",
    description: "Smelting-focused class for turning raw ores into bars and smelting experience.",
    permanentEffects: ["+10% Smelting Efficiency", "+10% Smelting Experience"],
    battleTalents: [],
  },
  {
    value: "Beastmaster",
    label: "Beastmaster",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01KF18A1Y2ZPVX1BBYF4FNZV39.png",
    category: "Pet",
    dropdownDetail: "Pet training",
    description: "Pet-focused class that improves pet mastery and pet experience.",
    permanentEffects: ["+10% Pet Mastery Experience", "+10% Pet Experience"],
    notes: ["Pet experience applies to each pet individually."],
    battleTalents: [],
  },
  {
    value: "Banished",
    label: "Banished",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01J8MJ7P4MGEYANXQQW3DCEQRP.png",
    category: "Restricted",
    dropdownDetail: "No market/trading",
    description: "Restricted class without market or barter access.",
    permanentEffects: ["This class has no permanent effects."],
    notes: ["Cannot access market or trading systems.", "Locked class.", "Receives a 50% teleport cost discount."],
    battleTalents: [],
  },
  {
    value: "Forsaken",
    label: "Forsaken",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/forsaken.png",
    category: "Challenge",
    dropdownDetail: "Reduced EXP",
    description: "Challenge class with severe experience penalties.",
    permanentEffects: ["-50% Skill Experience (when obtaining skill items)", "-50% Battle Experience", "-50% Dungeon Experience"],
    notes: ["Locked class."],
    battleTalents: [],
  },
  {
    value: "Cursed",
    label: "Cursed",
    iconUrl: "https://cdn.idle-mmo.com/cdn-cgi/image/width=100/uploaded/skins/01J8MJ7D822Z5CR3DMCY1C9QNQ.png",
    category: "Restricted",
    dropdownDetail: "No market/trading",
    description: "Challenge class that combines trade restrictions with experience penalties.",
    permanentEffects: ["-50% Skill Experience (when obtaining skill items)", "-50% Battle Experience", "-50% Dungeon Experience"],
    notes: ["Cannot access market or trading systems.", "Locked class.", "Receives a 50% teleport cost discount."],
    battleTalents: [],
  },
  {
    value: "Other",
    label: "Other",
    category: "Custom",
    dropdownDetail: "Manual setup",
    description: "Use this when the profile class is unknown or not covered by the current class data.",
    permanentEffects: ["Manual class effects"],
    battleTalents: [],
  },
];

export const CLASS_OPTION_VALUES = new Set(CLASS_RULES.map((option) => option.value));

export function qualityRank(quality?: string | null) {
  return QUALITY_ORDER[String(quality || "").toUpperCase()] || 99;
}

export function cleanQuality(quality?: string | null) {
  const raw = String(quality || "").trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : "";
}

export function statLabel(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getRequirementLevel(item?: RawItemLike | null) {
  if (!item?.requirements) return 0;
  return Math.max(0, ...Object.values(item.requirements).map((value) => Number(value || 0)).filter(Number.isFinite));
}

const STAT_KEY_MAP: Record<string, ProfileStatKey> = {
  attack_power: "attackPower",
  protection: "protection",
  agility: "agility",
  accuracy: "accuracy",
  critical_chance: "criticalChance",
  critical_damage: "criticalDamage",
  movement_speed: "movementSpeed",
  damage: "damage",
};

const DEFAULT_SECONDARY_STATS: Record<ProfileStatKey, number> = {
  attackPower: 2,
  protection: 2,
  agility: 2,
  accuracy: 2,
  criticalChance: 0,
  criticalDamage: 0,
  movementSpeed: 3,
  damage: 0,
};

const CORE_STAT_MULTIPLIER = 2.4;

function coreStatValue(level: number | "" | undefined) {
  return Math.floor(Math.max(1, Number(level || 1)) * CORE_STAT_MULTIPLIER);
}

export function getUnlockedClassTalents(className: string, combatLevel: number) {
  const rule = CLASS_RULES.find((option) => option.value === className);
  return (rule?.battleTalents || []).filter((talent) => combatLevel >= talent.level);
}

export function getNextClassTalent(className: string, combatLevel: number) {
  const rule = CLASS_RULES.find((option) => option.value === className);
  return (rule?.battleTalents || []).find((talent) => combatLevel < talent.level) || null;
}

export function getClassTalentStats(className: string, combatLevel: number) {
  const totals: Record<ProfileStatKey, number> = { ...DEFAULT_SECONDARY_STATS };
  for (const talent of getUnlockedClassTalents(className, combatLevel)) {
    for (const [key, value] of Object.entries(talent.statDeltas || {}) as Array<[ProfileStatKey, number]>) {
      totals[key] += value;
    }
  }
  return totals;
}

export function getCoreStatTotals(levels?: ProfilePrimaryLevels | null) {
  return {
    ...DEFAULT_SECONDARY_STATS,
    attackPower: coreStatValue(levels?.strength),
    protection: coreStatValue(levels?.defence),
    agility: coreStatValue(levels?.speed),
    accuracy: coreStatValue(levels?.dexterity),
  };
}

export function getClassEfficiencyBonus(className: string) {
  const rule = CLASS_RULES.find((option) => option.value === className);
  const bonuses: Record<string, number> = {};
  for (const effect of rule?.permanentEffects || []) {
    const match = effect.match(/([+-]?\d+(?:\.\d+)?)%\s+(.+?)\s+Efficiency/i);
    if (!match) continue;
    const skill = match[2].toLowerCase().replace(/\s+/g, "");
    bonuses[skill] = (bonuses[skill] || 0) + Number(match[1]);
  }
  return bonuses;
}

export function getItemStatTotals(item: RawItemLike | null | undefined, tierValue: number | "" = "") {
  const tier = Math.max(1, Number(tierValue || 1));
  const upgradeSteps = Math.max(0, tier - 1);
  const totals: Partial<Record<ProfileStatKey, number>> = {};
  const sources = [item?.stats || {}, item?.tier_modifiers || {}];
  for (const [rawKey, mappedKey] of Object.entries(STAT_KEY_MAP)) {
    const base = Number((sources[0] as Record<string, unknown>)[rawKey] || 0);
    const modifier = Number((sources[1] as Record<string, unknown>)[rawKey] || 0);
    const total = base + modifier * upgradeSteps;
    if (total) totals[mappedKey] = Number(total.toFixed(2));
  }
  return totals;
}

export function addStatTotals(target: Record<ProfileStatKey, number>, addition: Partial<Record<ProfileStatKey, number>>) {
  for (const [key, value] of Object.entries(addition) as Array<[ProfileStatKey, number]>) {
    target[key] = Number((target[key] + Number(value || 0)).toFixed(2));
  }
  return target;
}

export function getGearStatTotals(
  items: Array<{ item?: RawItemLike | null; tier?: number | "" }>,
  className: string,
  combatLevel: number,
  primaryLevels?: ProfilePrimaryLevels | null,
) {
  const totals = getCoreStatTotals(primaryLevels);
  addStatTotals(totals, getClassTalentStats(className, combatLevel));
  totals.attackPower -= DEFAULT_SECONDARY_STATS.attackPower;
  totals.protection -= DEFAULT_SECONDARY_STATS.protection;
  totals.agility -= DEFAULT_SECONDARY_STATS.agility;
  totals.accuracy -= DEFAULT_SECONDARY_STATS.accuracy;
  totals.movementSpeed -= DEFAULT_SECONDARY_STATS.movementSpeed;
  for (const entry of items) {
    addStatTotals(totals, getItemStatTotals(entry.item, entry.tier));
  }
  return totals;
}

export function getToolEfficiency(item?: RawItemLike | null) {
  const effect = item?.effects?.find((entry) => String(entry.value_type || "").toLowerCase() === "efficiency");
  return Number(effect?.value || 0);
}

export function getItemEffectSummary(item?: RawItemLike | null) {
  if (!item?.effects?.length) return "";
  return item.effects
    .map((effect) => {
      const target = String(effect.target || "").replaceAll("_", " ");
      const value = Number(effect.value || 0);
      return `${value > 0 ? "+" : ""}${value}% ${target} efficiency`;
    })
    .join(", ");
}

export function formatRequirements(item?: RawItemLike | null) {
  if (!item?.requirements) return "No requirement";
  return Object.entries(item.requirements)
    .map(([key, value]) => `${statLabel(key)} ${value}`)
    .join(", ");
}

export function formatStatSummary(stats: Partial<Record<ProfileStatKey, number>>) {
  return (Object.entries(stats) as Array<[ProfileStatKey, number]>)
    .filter(([, value]) => Number(value || 0) !== 0)
    .map(([key, value]) => `${STAT_LABELS[key]} ${Number(value) > 0 ? "+" : ""}${value}`)
    .join(", ");
}
