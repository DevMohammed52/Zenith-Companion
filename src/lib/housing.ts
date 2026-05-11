"use client";

export type HousingMode = "none" | "owner" | "guest";

export type HousingActivity =
  | "woodcutting"
  | "mining"
  | "fishing"
  | "alchemy"
  | "smelting"
  | "cooking"
  | "forge"
  | "meditation"
  | "eventMastery"
  | "combat"
  | "dungeon"
  | "hunting"
  | "construction";

export type HousingManualBuffs = Partial<Record<HousingActivity, number>>;

export type ProfileHousing = {
  mode: HousingMode;
  location: string;
  foundationBuilt: boolean;
  extraSlots: number;
  selectedComponents: string[];
  componentConditions: Record<string, number>;
  componentDecayDays: Record<string, number>;
  componentRepairGold: Record<string, number>;
  guestHostName: string;
  guestBuffs: HousingManualBuffs;
  guestRemoteConduit: boolean;
  guestPetQuarters: boolean;
  guestHouseLedger: boolean;
  notes: string;
};

export const HOUSING_GUEST_BLOCKED_CLASSES = ["Cursed", "Banished"] as const;

const HOUSING_GUEST_BLOCKED_CLASS_SET = new Set<string>(HOUSING_GUEST_BLOCKED_CLASSES);

export function canUseHousingGuestAccess(className: string | null | undefined) {
  return !HOUSING_GUEST_BLOCKED_CLASS_SET.has(String(className || ""));
}

export function getEffectiveHousingForProfileClass(
  housing: Partial<ProfileHousing> | null | undefined,
  profileClassName: string | null | undefined,
) {
  const safeHousing = sanitizeHousing(housing);
  if (safeHousing.mode === "guest" && !canUseHousingGuestAccess(profileClassName)) {
    return { ...safeHousing, mode: "none" as HousingMode };
  }
  return safeHousing;
}

export type HousingComponent = {
  id: string;
  name: string;
  family: string;
  tier?: 1 | 2 | 3 | 4 | 5;
  category: "idle" | "special" | "guest" | "structure";
  description: string;
  activity?: HousingActivity;
  idleHours?: number;
  goldCost: number;
  levelRequired?: number;
  guestCapacity?: number;
  flags?: Array<"remote" | "petQuarters" | "houseLedger">;
  materials: Array<{ name: string; quantity: number }>;
};

export type HousingCostEntry = {
  component: HousingComponent;
  quantity?: number;
  conditionPercent?: number;
  repairGoldOverride?: number;
};

export type HousingCostMaterial = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  missingPrice: boolean;
};

export type HousingCostSummary = {
  goldCost: number;
  materialCost: number;
  totalCost: number;
  materials: HousingCostMaterial[];
  missingMaterials: string[];
};

export type HousingBuffSummary = {
  mode: HousingMode;
  location: string;
  availableAnywhere: boolean;
  locationLimited: boolean;
  idleHours: Record<HousingActivity, number>;
  remoteConduit: boolean;
  petQuarters: boolean;
  houseLedger: boolean;
  guestCapacity: number;
  activeComponentCount: number;
  slotCapacity: number;
  freeSlots: number;
  strongestIdleBonus: { activity: HousingActivity; hours: number } | null;
};

type HousingBuffOptions = {
  profileClassName?: string | null;
};

export type HousingSkillName =
  | "Woodcutting"
  | "Mining"
  | "Fishing"
  | "Cooking"
  | "Smelting"
  | "Alchemy"
  | "Forge"
  | "Construction";

const ACTIVITY_LABELS: Record<HousingActivity, string> = {
  woodcutting: "Woodcutting",
  mining: "Mining",
  fishing: "Fishing",
  alchemy: "Alchemy",
  smelting: "Smelting",
  cooking: "Cooking",
  forge: "Forge",
  meditation: "Meditation",
  eventMastery: "Event Mastery",
  combat: "Combat",
  dungeon: "Dungeon",
  hunting: "Hunting",
  construction: "Construction",
};

const EMPTY_IDLE_HOURS: Record<HousingActivity, number> = {
  woodcutting: 0,
  mining: 0,
  fishing: 0,
  alchemy: 0,
  smelting: 0,
  cooking: 0,
  forge: 0,
  meditation: 0,
  eventMastery: 0,
  combat: 0,
  dungeon: 0,
  hunting: 0,
  construction: 0,
};

export const SKILL_TO_HOUSING_ACTIVITY: Partial<Record<HousingSkillName, HousingActivity>> = {
  Woodcutting: "woodcutting",
  Mining: "mining",
  Fishing: "fishing",
  Cooking: "cooking",
  Smelting: "smelting",
  Alchemy: "alchemy",
  Forge: "forge",
  Construction: "construction",
};

export const HOUSING_ACTIVITY_TO_SKILL = Object.fromEntries(
  Object.entries(SKILL_TO_HOUSING_ACTIVITY).map(([skill, activity]) => [activity, skill]),
) as Partial<Record<HousingActivity, HousingSkillName>>;

export const HOUSING_LOCATIONS = [
  "Bluebell Hollow",
  "Whispering Woods",
  "Eldoria",
  "Crystal Caverns",
  "Skyreach Peak",
  "Enchanted Oasis",
  "Floating Gardens of Aetheria",
  "Celestial Observatory",
  "Isle of Whispers",
  "The Citadel",
];

const ROMAN_BY_TIER = ["", "I", "II", "III", "IV", "V"] as const;
const IDLE_HOURS_BY_TIER = [0, 0.5, 1, 2, 3, 4] as const;

const IDLE_FAMILIES: Array<{
  family: string;
  activity: HousingActivity;
  description: string;
}> = [
  { family: "Lumber Store", activity: "woodcutting", description: "Extends woodcutting idle time." },
  { family: "Ore Cellar", activity: "mining", description: "Extends mining idle time." },
  { family: "Angler's Quarters", activity: "fishing", description: "Extends fishing idle time." },
  { family: "Distillation Rig", activity: "alchemy", description: "Extends alchemy idle time." },
  { family: "Furnace Array", activity: "smelting", description: "Extends smelting idle time." },
  { family: "Culinary Station", activity: "cooking", description: "Extends cooking idle time." },
  { family: "Forge Annex", activity: "forge", description: "Extends forge idle time." },
  { family: "Sanctum", activity: "meditation", description: "Extends meditation idle time." },
  { family: "Ritual Plaza", activity: "eventMastery", description: "Extends event mastery idle time." },
  { family: "Training Grounds", activity: "combat", description: "Extends battle idle time." },
  { family: "Adventurer's Lodge", activity: "dungeon", description: "Extends dungeon idle time." },
  { family: "Trailblazer Camp", activity: "hunting", description: "Extends hunting idle time." },
  { family: "Builder's Workshop", activity: "construction", description: "Extends construction idle time." },
];

const MATERIALS: Record<string, Array<[string, number]>> = {
  "Lumber Store I": [["Weak Plank", 225], ["Weak Beam", 175], ["Brick", 50], ["Iron Fitting", 50]],
  "Lumber Store II": [["Weak Plank", 540], ["Weak Beam", 420], ["Brick", 120], ["Iron Fitting", 120]],
  "Lumber Store III": [["Robust Plank", 240], ["Robust Beam", 185], ["Brick", 125], ["Glass", 105], ["Iron Fitting", 430]],
  "Lumber Store IV": [["Robust Plank", 400], ["Robust Beam", 310], ["Brick", 180], ["Glass", 180], ["Iron Fitting", 710]],
  "Lumber Store V": [["Strong Plank", 450], ["Strong Beam", 350], ["Brick", 200], ["Glass", 200], ["Iron Fitting", 800]],
  "Ore Cellar I": [["Weak Plank", 75], ["Weak Beam", 100], ["Brick", 225], ["Glass", 25], ["Iron Fitting", 75]],
  "Ore Cellar II": [["Weak Plank", 180], ["Weak Beam", 240], ["Brick", 540], ["Glass", 60], ["Iron Fitting", 180]],
  "Ore Cellar III": [["Robust Plank", 180], ["Robust Beam", 240], ["Brick", 550], ["Glass", 65], ["Iron Fitting", 185]],
  "Ore Cellar IV": [["Robust Plank", 300], ["Robust Beam", 400], ["Brick", 900], ["Glass", 100], ["Iron Fitting", 300]],
  "Ore Cellar V": [["Strong Plank", 340], ["Strong Beam", 455], ["Brick", 1020], ["Glass", 115], ["Iron Fitting", 340]],
  "Angler's Quarters I": [["Weak Plank", 175], ["Weak Beam", 150], ["Brick", 75], ["Glass", 50], ["Iron Fitting", 50]],
  "Angler's Quarters II": [["Weak Plank", 420], ["Weak Beam", 360], ["Brick", 180], ["Glass", 120], ["Iron Fitting", 120]],
  "Angler's Quarters III": [["Robust Plank", 300], ["Robust Beam", 260], ["Brick", 185], ["Glass", 125], ["Iron Fitting", 125]],
  "Angler's Quarters IV": [["Robust Plank", 500], ["Robust Beam", 430], ["Brick", 215], ["Glass", 145], ["Iron Fitting", 145]],
  "Angler's Quarters V": [["Strong Plank", 540], ["Strong Beam", 465], ["Brick", 230], ["Glass", 155], ["Iron Fitting", 155]],
  "Distillation Rig I": [["Weak Plank", 75], ["Weak Beam", 75], ["Brick", 100], ["Glass", 175], ["Iron Fitting", 75]],
  "Distillation Rig II": [["Weak Plank", 180], ["Weak Beam", 180], ["Brick", 240], ["Glass", 420], ["Iron Fitting", 180]],
  "Distillation Rig III": [["Robust Plank", 235], ["Robust Beam", 235], ["Brick", 315], ["Glass", 550], ["Iron Fitting", 235]],
  "Distillation Rig IV": [["Robust Plank", 395], ["Robust Beam", 395], ["Brick", 520], ["Glass", 920], ["Iron Fitting", 395]],
  "Distillation Rig V": [["Strong Plank", 470], ["Strong Beam", 470], ["Brick", 630], ["Glass", 1100], ["Iron Fitting", 470]],
  "Furnace Array I": [["Weak Plank", 50], ["Weak Beam", 75], ["Brick", 250], ["Glass", 25], ["Iron Fitting", 100]],
  "Furnace Array II": [["Weak Plank", 120], ["Weak Beam", 180], ["Brick", 600], ["Glass", 60], ["Iron Fitting", 240]],
  "Furnace Array III": [["Robust Plank", 145], ["Robust Beam", 215], ["Brick", 710], ["Glass", 70], ["Iron Fitting", 285]],
  "Furnace Array IV": [["Robust Plank", 240], ["Robust Beam", 355], ["Brick", 1190], ["Glass", 120], ["Iron Fitting", 475]],
  "Furnace Array V": [["Strong Plank", 280], ["Strong Beam", 415], ["Brick", 1390], ["Glass", 140], ["Iron Fitting", 560]],
  "Culinary Station I": [["Weak Plank", 125], ["Weak Beam", 100], ["Brick", 150], ["Glass", 50], ["Iron Fitting", 75]],
  "Culinary Station II": [["Weak Plank", 300], ["Weak Beam", 240], ["Brick", 360], ["Glass", 120], ["Iron Fitting", 180]],
  "Culinary Station III": [["Robust Plank", 265], ["Robust Beam", 210], ["Brick", 365], ["Glass", 125], ["Iron Fitting", 185]],
  "Culinary Station IV": [["Robust Plank", 440], ["Robust Beam", 350], ["Brick", 530], ["Glass", 175], ["Iron Fitting", 265]],
  "Culinary Station V": [["Strong Plank", 490], ["Strong Beam", 390], ["Brick", 590], ["Glass", 195], ["Iron Fitting", 295]],
  "Forge Annex I": [["Weak Plank", 75], ["Weak Beam", 100], ["Brick", 175], ["Glass", 25], ["Iron Fitting", 125]],
  "Forge Annex II": [["Weak Plank", 180], ["Weak Beam", 240], ["Brick", 420], ["Glass", 60], ["Iron Fitting", 300]],
  "Forge Annex III": [["Robust Plank", 180], ["Robust Beam", 240], ["Brick", 422], ["Glass", 65], ["Iron Fitting", 305]],
  "Forge Annex IV": [["Robust Plank", 300], ["Robust Beam", 400], ["Brick", 700], ["Glass", 100], ["Iron Fitting", 500]],
  "Forge Annex V": [["Strong Plank", 340], ["Strong Beam", 455], ["Brick", 800], ["Glass", 115], ["Iron Fitting", 570]],
  "Sanctum I": [["Weak Plank", 150], ["Weak Beam", 125], ["Brick", 100], ["Glass", 75], ["Iron Fitting", 50]],
  "Sanctum II": [["Weak Plank", 360], ["Weak Beam", 300], ["Brick", 240], ["Glass", 180], ["Iron Fitting", 120]],
  "Sanctum III": [["Robust Plank", 295], ["Robust Beam", 245], ["Brick", 245], ["Glass", 185], ["Iron Fitting", 125]],
  "Sanctum IV": [["Robust Plank", 495], ["Robust Beam", 410], ["Brick", 330], ["Glass", 245], ["Iron Fitting", 165]],
  "Sanctum V": [["Strong Plank", 540], ["Strong Beam", 455], ["Brick", 365], ["Glass", 270], ["Iron Fitting", 180]],
  "Ritual Plaza I": [["Weak Plank", 125], ["Weak Beam", 150], ["Brick", 125], ["Glass", 75], ["Iron Fitting", 25]],
  "Ritual Plaza II": [["Weak Plank", 300], ["Weak Beam", 360], ["Brick", 300], ["Glass", 180], ["Iron Fitting", 60]],
  "Ritual Plaza III": [["Robust Plank", 255], ["Robust Beam", 310], ["Brick", 305], ["Glass", 185], ["Iron Fitting", 65]],
  "Ritual Plaza IV": [["Robust Plank", 430], ["Robust Beam", 520], ["Brick", 430], ["Glass", 255], ["Iron Fitting", 85]],
  "Ritual Plaza V": [["Strong Plank", 475], ["Strong Beam", 570], ["Brick", 475], ["Glass", 285], ["Iron Fitting", 95]],
  "Training Grounds I": [["Weak Plank", 100], ["Weak Beam", 175], ["Brick", 150], ["Glass", 25], ["Iron Fitting", 50]],
  "Training Grounds II": [["Weak Plank", 240], ["Weak Beam", 420], ["Brick", 360], ["Glass", 60], ["Iron Fitting", 120]],
  "Training Grounds III": [["Robust Plank", 195], ["Robust Beam", 345], ["Brick", 365], ["Glass", 65], ["Iron Fitting", 125]],
  "Training Grounds IV": [["Robust Plank", 325], ["Robust Beam", 570], ["Brick", 490], ["Glass", 80], ["Iron Fitting", 165]],
  "Training Grounds V": [["Strong Plank", 360], ["Strong Beam", 630], ["Brick", 540], ["Glass", 90], ["Iron Fitting", 180]],
  "Adventurer's Lodge I": [["Weak Plank", 150], ["Weak Beam", 150], ["Brick", 100], ["Glass", 50], ["Iron Fitting", 50]],
  "Adventurer's Lodge II": [["Weak Plank", 360], ["Weak Beam", 360], ["Brick", 240], ["Glass", 120], ["Iron Fitting", 120]],
  "Adventurer's Lodge III": [["Robust Plank", 275], ["Robust Beam", 275], ["Brick", 245], ["Glass", 125], ["Iron Fitting", 125]],
  "Adventurer's Lodge IV": [["Robust Plank", 460], ["Robust Beam", 460], ["Brick", 305], ["Glass", 155], ["Iron Fitting", 155]],
  "Adventurer's Lodge V": [["Strong Plank", 500], ["Strong Beam", 500], ["Brick", 335], ["Glass", 165], ["Iron Fitting", 165]],
  "Trailblazer Camp I": [["Weak Plank", 200], ["Weak Beam", 175], ["Brick", 50], ["Glass", 25], ["Iron Fitting", 50]],
  "Trailblazer Camp II": [["Weak Plank", 480], ["Weak Beam", 420], ["Brick", 120], ["Glass", 60], ["Iron Fitting", 120]],
  "Trailblazer Camp III": [["Robust Plank", 300], ["Robust Beam", 265], ["Brick", 125], ["Glass", 65], ["Iron Fitting", 125]],
  "Trailblazer Camp IV": [["Robust Plank", 500], ["Robust Beam", 440], ["Brick", 130], ["Glass", 70], ["Iron Fitting", 130]],
  "Trailblazer Camp V": [["Strong Plank", 540], ["Strong Beam", 470], ["Brick", 135], ["Glass", 75], ["Iron Fitting", 130]],
  "Builder's Workshop I": [["Weak Plank", 150], ["Weak Beam", 100], ["Brick", 150], ["Glass", 50], ["Iron Fitting", 100]],
  "Builder's Workshop II": [["Weak Plank", 360], ["Weak Beam", 240], ["Brick", 360], ["Glass", 120], ["Iron Fitting", 240]],
  "Builder's Workshop III": [["Robust Plank", 305], ["Robust Beam", 205], ["Brick", 365], ["Glass", 125], ["Iron Fitting", 245]],
  "Builder's Workshop IV": [["Robust Plank", 510], ["Robust Beam", 340], ["Brick", 510], ["Glass", 170], ["Iron Fitting", 348]],
  "Builder's Workshop V": [["Strong Plank", 560], ["Strong Beam", 375], ["Brick", 560], ["Glass", 198], ["Iron Fitting", 375]],
  "Remote Conduit": [["Robust Plank", 330], ["Robust Beam", 270], ["Brick", 180], ["Glass", 150], ["Iron Fitting", 600]],
  "Pet Quarters": [["Robust Plank", 300], ["Robust Beam", 240], ["Brick", 180], ["Glass", 150], ["Iron Fitting", 500]],
  "House Ledger": [["Robust Plank", 440], ["Robust Beam", 350], ["Brick", 220], ["Glass", 180], ["Iron Fitting", 800]],
  "Slot": [["Robust Plank", 150], ["Robust Beam", 75], ["Brick", 100], ["Glass", 50], ["Iron Fitting", 50]],
  "Guest Quarters I": [["Robust Plank", 640], ["Robust Beam", 500], ["Brick", 285], ["Glass", 285], ["Iron Fitting", 1140]],
  "Guest Quarters II": [["Robust Plank", 800], ["Robust Beam", 625], ["Brick", 355], ["Glass", 355], ["Iron Fitting", 1425]],
  "Guest Quarters III": [["Robust Plank", 1025], ["Robust Beam", 800], ["Brick", 455], ["Glass", 455], ["Iron Fitting", 1825]],
};

const GOLD_COST_BY_TIER = [0, 5000, 10000, 20000, 35000, 60000] as const;

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mats(name: string) {
  return (MATERIALS[name] || []).map(([materialName, quantity]) => ({ name: materialName, quantity }));
}

export const HOUSING_COMPONENTS: HousingComponent[] = [
  {
    id: "foundation",
    name: "Foundation",
    family: "Foundation",
    category: "structure",
    description: "Creates the house at the selected location.",
    goldCost: 25000,
    materials: [],
  },
  {
    id: "slot",
    name: "Slot",
    family: "Slot",
    category: "structure",
    description: "Adds one component slot to the house.",
    goldCost: 50000,
    materials: mats("Slot"),
  },
  ...IDLE_FAMILIES.flatMap((family) =>
    ([1, 2, 3, 4, 5] as const).map((tier) => {
      const name = `${family.family} ${ROMAN_BY_TIER[tier]}`;
      const hours = IDLE_HOURS_BY_TIER[tier];
      return {
        id: slug(name),
        name,
        family: family.family,
        tier,
        category: "idle" as const,
        description: `${family.description} Adds ${formatHours(hours)} to ${getHousingActivityLabel(family.activity)}.`,
        activity: family.activity,
        idleHours: hours,
        goldCost: GOLD_COST_BY_TIER[tier],
        materials: mats(name),
      };
    }),
  ),
  {
    id: "remote-conduit",
    name: "Remote Conduit",
    family: "Remote Conduit",
    category: "special",
    description: "Makes house bonuses available anywhere.",
    goldCost: 50000,
    flags: ["remote"],
    materials: mats("Remote Conduit"),
  },
  {
    id: "pet-quarters",
    name: "Pet Quarters",
    family: "Pet Quarters",
    category: "special",
    description: "Automatically sends exhausted pets to sleep.",
    goldCost: 50000,
    flags: ["petQuarters"],
    materials: mats("Pet Quarters"),
  },
  {
    id: "house-ledger",
    name: "House Ledger",
    family: "House Ledger",
    category: "special",
    description: "Reduces trade fees between your own characters.",
    goldCost: 100000,
    levelRequired: 50,
    flags: ["houseLedger"],
    materials: mats("House Ledger"),
  },
  {
    id: "guest-quarters-i",
    name: "Guest Quarters I",
    family: "Guest Quarters",
    tier: 1,
    category: "guest",
    description: "Allows one guest to use your active house bonuses.",
    goldCost: 12000,
    levelRequired: 50,
    guestCapacity: 1,
    materials: mats("Guest Quarters I"),
  },
  {
    id: "guest-quarters-ii",
    name: "Guest Quarters II",
    family: "Guest Quarters",
    tier: 2,
    category: "guest",
    description: "Allows two guests to use your active house bonuses.",
    goldCost: 50000,
    levelRequired: 50,
    guestCapacity: 2,
    materials: mats("Guest Quarters II"),
  },
  {
    id: "guest-quarters-iii",
    name: "Guest Quarters III",
    family: "Guest Quarters",
    tier: 3,
    category: "guest",
    description: "Allows three guests to use your active house bonuses.",
    goldCost: 150000,
    levelRequired: 50,
    guestCapacity: 3,
    materials: mats("Guest Quarters III"),
  },
];

export const HOUSING_COMPONENTS_BY_ID = Object.fromEntries(
  HOUSING_COMPONENTS.map((component) => [component.id, component]),
) as Record<string, HousingComponent>;

export function createDefaultHousing(): ProfileHousing {
  return {
    mode: "none",
    location: "",
    foundationBuilt: false,
    extraSlots: 0,
    selectedComponents: [],
    componentConditions: {},
    componentDecayDays: {},
    componentRepairGold: {},
    guestHostName: "",
    guestBuffs: {},
    guestRemoteConduit: false,
    guestPetQuarters: false,
    guestHouseLedger: false,
    notes: "",
  };
}

export function normalizeHousingCondition(value: unknown, fallback = 100) {
  const numeric = Number(value);
  const safeFallback = Number.isFinite(Number(fallback)) ? Number(fallback) : 100;
  const condition = Number.isFinite(numeric) ? numeric : safeFallback;
  return Math.round(Math.min(100, Math.max(0, condition)) * 10) / 10;
}

export function normalizeHousingDecayDays(value: unknown, fallback = 60) {
  const numeric = Number(value);
  const safeFallback = Number.isFinite(Number(fallback)) ? Number(fallback) : 60;
  return Math.min(365, Math.max(1, Math.round(Number.isFinite(numeric) ? numeric : safeFallback)));
}

export function normalizeHousingRepairGold(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return undefined;
  return Math.round(numeric);
}

export function sanitizeHousing(input: Partial<ProfileHousing> | null | undefined): ProfileHousing {
  const base = createDefaultHousing();
  const mode: HousingMode = input?.mode === "owner" || input?.mode === "guest" ? input.mode : "none";
  const foundationBuilt = Boolean(input?.foundationBuilt);
  const extraSlots = foundationBuilt ? Math.min(15, Math.max(0, Math.floor(Number(input?.extraSlots || 0)))) : 0;
  const slotCapacity = foundationBuilt ? 1 + extraSlots : 0;
  const selectedComponents = Array.isArray(input?.selectedComponents)
    ? Array.from(new Set(input.selectedComponents.filter((id) => typeof id === "string" && HOUSING_COMPONENTS_BY_ID[id])))
        .filter((id) => HOUSING_COMPONENTS_BY_ID[id]?.category !== "structure")
        .slice(0, slotCapacity)
    : [];
  const rawComponentConditions = input?.componentConditions && typeof input.componentConditions === "object"
    ? input.componentConditions
    : {};
  const rawComponentDecayDays = input?.componentDecayDays && typeof input.componentDecayDays === "object"
    ? input.componentDecayDays
    : {};
  const rawComponentRepairGold = input?.componentRepairGold && typeof input.componentRepairGold === "object"
    ? input.componentRepairGold
    : {};
  const conditionIds = new Set(selectedComponents);
  if (extraSlots > 0) conditionIds.add("slot");
  const componentConditions: Record<string, number> = {};
  const componentDecayDays: Record<string, number> = {};
  const componentRepairGold: Record<string, number> = {};
  for (const componentId of conditionIds) {
    const component = HOUSING_COMPONENTS_BY_ID[componentId];
    if (!component || component.id === "foundation") continue;
    const rawCondition = (rawComponentConditions as Record<string, unknown>)[componentId];
    if (rawCondition !== undefined) componentConditions[componentId] = normalizeHousingCondition(rawCondition, 100);
    const rawDecayDays = (rawComponentDecayDays as Record<string, unknown>)[componentId];
    if (rawDecayDays !== undefined) componentDecayDays[componentId] = normalizeHousingDecayDays(rawDecayDays, 60);
    const repairGold = normalizeHousingRepairGold((rawComponentRepairGold as Record<string, unknown>)[componentId]);
    if (repairGold !== undefined) componentRepairGold[componentId] = repairGold;
  }
  const guestBuffs: HousingManualBuffs = {};
  const rawGuestBuffs = input?.guestBuffs && typeof input.guestBuffs === "object" ? input.guestBuffs : {};
  for (const activity of Object.keys(EMPTY_IDLE_HOURS) as HousingActivity[]) {
    const value = Number(rawGuestBuffs[activity] || 0);
    if (Number.isFinite(value) && value > 0) guestBuffs[activity] = Math.min(24, Math.max(0, value));
  }
  return {
    ...base,
    ...input,
    mode,
    location: typeof input?.location === "string" ? input.location.slice(0, 60) : "",
    foundationBuilt,
    extraSlots,
    selectedComponents,
    componentConditions,
    componentDecayDays,
    componentRepairGold,
    guestHostName: typeof input?.guestHostName === "string" ? input.guestHostName.trim().slice(0, 80) : "",
    guestBuffs,
    guestRemoteConduit: Boolean(input?.guestRemoteConduit),
    guestPetQuarters: Boolean(input?.guestPetQuarters),
    guestHouseLedger: Boolean(input?.guestHouseLedger),
    notes: typeof input?.notes === "string" ? input.notes.slice(0, 500) : "",
  };
}

export function calculateHousingBuffs(
  housing: Partial<ProfileHousing> | null | undefined,
  options: HousingBuffOptions = {},
): HousingBuffSummary {
  const safeHousing = getEffectiveHousingForProfileClass(housing, options.profileClassName);
  const idleHours = { ...EMPTY_IDLE_HOURS };
  let remoteConduit = false;
  let petQuarters = false;
  let houseLedger = false;
  let guestCapacity = 0;

  const activeComponentCount = safeHousing.mode === "owner" && safeHousing.foundationBuilt
    ? safeHousing.selectedComponents.filter((id) => HOUSING_COMPONENTS_BY_ID[id]?.category !== "structure").length
    : safeHousing.mode === "guest"
      ? Object.values(safeHousing.guestBuffs).filter((value) => Number(value || 0) > 0).length
      : 0;
  const slotCapacity = safeHousing.mode === "owner" && safeHousing.foundationBuilt ? 1 + safeHousing.extraSlots : 0;

  if (safeHousing.mode === "guest") {
    remoteConduit = safeHousing.guestRemoteConduit;
    petQuarters = safeHousing.guestPetQuarters;
    houseLedger = safeHousing.guestHouseLedger;
    for (const [activity, hours] of Object.entries(safeHousing.guestBuffs) as Array<[HousingActivity, number]>) {
      idleHours[activity] = Math.max(idleHours[activity], Number(hours || 0));
    }
  } else if (safeHousing.mode === "owner" && safeHousing.foundationBuilt) {
    for (const id of safeHousing.selectedComponents) {
      const component = HOUSING_COMPONENTS_BY_ID[id];
      if (!component) continue;
      if (component.activity && component.idleHours) idleHours[component.activity] = Math.max(idleHours[component.activity], component.idleHours);
      if (component.flags?.includes("remote")) remoteConduit = true;
      if (component.flags?.includes("petQuarters")) petQuarters = true;
      if (component.flags?.includes("houseLedger")) houseLedger = true;
      if (component.guestCapacity) guestCapacity = Math.max(guestCapacity, component.guestCapacity);
    }
  }

  const strongestIdleBonus = (Object.entries(idleHours) as Array<[HousingActivity, number]>)
    .filter(([, hours]) => hours > 0)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    mode: safeHousing.mode,
    location: safeHousing.location,
    availableAnywhere: safeHousing.mode !== "none" && remoteConduit,
    locationLimited: safeHousing.mode !== "none" && !remoteConduit,
    idleHours,
    remoteConduit,
    petQuarters,
    houseLedger,
    guestCapacity,
    activeComponentCount,
    slotCapacity,
    freeSlots: Math.max(0, slotCapacity - activeComponentCount),
    strongestIdleBonus: strongestIdleBonus ? { activity: strongestIdleBonus[0], hours: strongestIdleBonus[1] } : null,
  };
}

export function getProfileBaseIdleActionHours(profile: { kind?: string } | null | undefined) {
  if (!profile) return 0;
  return profile.kind === "main" ? 8 : 4;
}

export function getHousingIdleHoursForActivity(
  housing: Partial<ProfileHousing> | HousingBuffSummary | null | undefined,
  activity: HousingActivity,
  location?: string | null,
  options: HousingBuffOptions = {},
) {
  const summary = housing && "idleHours" in housing
    ? housing as HousingBuffSummary
    : calculateHousingBuffs(housing as Partial<ProfileHousing> | null | undefined, options);
  const hours = Number(summary.idleHours[activity] || 0);
  if (hours <= 0) return 0;
  if (summary.availableAnywhere) return hours;
  const requestedLocation = String(location || "").trim().toLowerCase();
  if (!requestedLocation) return 0;
  const houseLocation = String(summary.location || "").trim().toLowerCase();
  return houseLocation && houseLocation === requestedLocation ? hours : 0;
}

export function getHousingAvailabilityText(summary: HousingBuffSummary, hours: number, activityLabel = "housing bonus") {
  if (hours <= 0) return `No ${activityLabel}.`;
  if (summary.availableAnywhere) return `${activityLabel} ${formatHours(hours)} anywhere.`;
  if (summary.mode === "guest") return `Guest ${activityLabel} ${formatHours(hours)} only at ${summary.location || "host location"}.`;
  return `${activityLabel} ${formatHours(hours)} only at ${summary.location || "house location"}.`;
}

export function getHousingActivityLabel(activity: HousingActivity) {
  return ACTIVITY_LABELS[activity];
}

export function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "0h";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return Number.isInteger(hours) ? `${hours}h` : `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
}

export function getComponentBuildCost(
  component: HousingComponent,
  prices: Record<string, number>,
) {
  const materialCost = component.materials.reduce((sum, material) => sum + (Number(prices[material.name] || 0) * material.quantity), 0);
  const missingMaterials = component.materials.filter((material) => Number(prices[material.name] || 0) <= 0).map((material) => material.name);
  return {
    goldCost: component.goldCost,
    materialCost,
    totalCost: component.goldCost + materialCost,
    missingMaterials,
  };
}

export function getComponentCostBreakdown(
  component: HousingComponent,
  prices: Record<string, number>,
) {
  return component.materials.map((material) => {
    const unitPrice = Number(prices[material.name] || 0);
    return {
      ...material,
      unitPrice,
      totalCost: unitPrice > 0 ? unitPrice * material.quantity : 0,
      missingPrice: unitPrice <= 0,
    };
  });
}

function normalizeCostQuantity(quantity: number | undefined) {
  return Math.max(1, Math.floor(Number(quantity) || 1));
}

function addMaterialCost(
  materials: Map<string, { quantity: number; unitPrice: number }>,
  material: { name: string; quantity: number },
  prices: Record<string, number>,
) {
  if (material.quantity <= 0) return;
  const unitPrice = Number(prices[material.name] || 0);
  const current = materials.get(material.name);
  materials.set(material.name, {
    quantity: (current?.quantity || 0) + material.quantity,
    unitPrice: current?.unitPrice || unitPrice,
  });
}

function summarizeHousingCost(goldCost: number, materials: Map<string, { quantity: number; unitPrice: number }>): HousingCostSummary {
  const rows = Array.from(materials.entries()).map(([name, material]) => {
    const unitPrice = Number(material.unitPrice || 0);
    return {
      name,
      quantity: material.quantity,
      unitPrice,
      totalCost: unitPrice > 0 ? unitPrice * material.quantity : 0,
      missingPrice: unitPrice <= 0,
    };
  });
  const materialCost = rows.reduce((sum, material) => sum + material.totalCost, 0);
  return {
    goldCost,
    materialCost,
    totalCost: goldCost + materialCost,
    materials: rows,
    missingMaterials: rows.filter((material) => material.missingPrice).map((material) => material.name),
  };
}

export function getHousingBuildCostSummary(
  entries: HousingCostEntry[],
  prices: Record<string, number>,
): HousingCostSummary {
  const materials = new Map<string, { quantity: number; unitPrice: number }>();
  let goldCost = 0;
  for (const entry of entries) {
    const quantity = normalizeCostQuantity(entry.quantity);
    goldCost += entry.component.goldCost * quantity;
    for (const material of entry.component.materials) {
      addMaterialCost(materials, {
        name: material.name,
        quantity: material.quantity * quantity,
      }, prices);
    }
  }
  return summarizeHousingCost(goldCost, materials);
}

export function estimateHousingRepairCostSummary(
  entries: HousingCostEntry[],
  prices: Record<string, number>,
  conditionPercent: number,
): HousingCostSummary & { conditionPercent: number; repairPercent: number } {
  const fallbackCondition = normalizeHousingCondition(conditionPercent, 100);
  const materials = new Map<string, { quantity: number; unitPrice: number }>();
  let goldCost = 0;
  let weightedCondition = 0;
  let totalQuantity = 0;
  for (const entry of entries) {
    const quantity = normalizeCostQuantity(entry.quantity);
    if (quantity <= 0) continue;
    const fullGoldCost = entry.component.goldCost * quantity;
    const repairGoldOverride = normalizeHousingRepairGold(entry.repairGoldOverride);
    const hasRepairGoldOverride = repairGoldOverride !== undefined && fullGoldCost > 0;
    const clampedRepairGold = hasRepairGoldOverride
      ? Math.min(fullGoldCost, Math.max(0, repairGoldOverride))
      : 0;
    const condition = hasRepairGoldOverride
      ? normalizeHousingCondition(100 - (clampedRepairGold / fullGoldCost) * 100, fallbackCondition)
      : normalizeHousingCondition(entry.conditionPercent, fallbackCondition);
    const repairPercent = hasRepairGoldOverride
      ? (clampedRepairGold / fullGoldCost) * 100
      : Math.max(0, 100 - condition);
    const repairRatio = repairPercent / 100;
    weightedCondition += condition * quantity;
    totalQuantity += quantity;
    goldCost += hasRepairGoldOverride
      ? clampedRepairGold
      : Math.ceil(entry.component.goldCost * quantity * repairRatio);
    for (const material of entry.component.materials) {
      addMaterialCost(materials, {
        name: material.name,
        quantity: Math.ceil(material.quantity * quantity * repairRatio),
      }, prices);
    }
  }
  const condition = totalQuantity > 0 ? normalizeHousingCondition(weightedCondition / totalQuantity, fallbackCondition) : fallbackCondition;
  const repairPercent = Math.max(0, 100 - condition);
  return {
    ...summarizeHousingCost(goldCost, materials),
    conditionPercent: condition,
    repairPercent,
  };
}

export function calculateRecoveredIdleHours(
  baseIdleHours: number,
  roomIdleHours: number,
  playtimeHours: number,
) {
  const roomBonus = Math.max(0, Number(roomIdleHours) || 0);
  const baseCovered = calculateUsefulCoveredIdleHours(0, playtimeHours);
  const roomCovered = calculateUsefulCoveredIdleHours(roomBonus, playtimeHours);
  return Math.max(0, roomCovered - baseCovered);
}

export function calculateUsefulCoveredIdleHours(
  actionHours: number,
  playtimeHours: number,
) {
  const bonusHours = Math.max(0, Number(actionHours) || 0);
  const played = Math.min(24, Math.max(0, Number(playtimeHours) || 0));
  return Math.min(24, played + bonusHours);
}

export function calculateRoomProfitProjection({
  baseIdleHours,
  roomIdleHours,
  playtimeHours,
  profitPerHour,
  buildCost,
  essenceCost = 0,
  costShare = 1,
}: {
  baseIdleHours: number;
  roomIdleHours: number;
  playtimeHours: number;
  profitPerHour: number;
  buildCost: number;
  essenceCost?: number;
  costShare?: number;
}) {
  const baseCap = Math.max(0, Number(baseIdleHours) || 0);
  const roomBonus = Math.max(0, Number(roomIdleHours) || 0);
  const roomCap = baseCap + roomBonus;
  const hourlyProfit = Math.max(0, Number(profitPerHour) || 0);
  const costPerEssence = Math.max(0, Number(essenceCost) || 0);
  const baseCoveredHoursPerDay = calculateUsefulCoveredIdleHours(0, playtimeHours);
  const roomCoveredHoursPerDay = calculateUsefulCoveredIdleHours(roomBonus, playtimeHours);
  const baseMissedHoursPerDay = Math.max(0, 24 - baseCoveredHoursPerDay);
  const roomMissedHoursPerDay = Math.max(0, 24 - roomCoveredHoursPerDay);
  const extraHoursPerDay = calculateRecoveredIdleHours(baseIdleHours, roomIdleHours, playtimeHours);
  const baseCoveredProfitPerDay = Math.round(baseCoveredHoursPerDay * hourlyProfit);
  const roomCoveredProfitPerDay = Math.round(roomCoveredHoursPerDay * hourlyProfit);
  const extraProfitPerDay = Math.max(0, roomCoveredProfitPerDay - baseCoveredProfitPerDay);
  const fullBuildCost = Math.max(0, Number(buildCost) || 0);
  const split = Math.max(1, Math.floor(Number(costShare) || 1));
  const cost = Math.ceil(fullBuildCost / split);
  const baseStartsPerDay = baseCap > 0 && baseCoveredHoursPerDay > 0 ? Math.ceil(baseCoveredHoursPerDay / baseCap) : 0;
  const roomStartsPerDay = roomCap > 0 && roomCoveredHoursPerDay > 0 ? Math.ceil(roomCoveredHoursPerDay / roomCap) : 0;
  const baseEssenceCostPerDay = Math.round(baseStartsPerDay * costPerEssence);
  const roomEssenceCostPerDay = Math.round(roomStartsPerDay * costPerEssence);
  const essenceSavingsPerDay = Math.max(0, baseEssenceCostPerDay - roomEssenceCostPerDay);
  const fullDayProfit = Math.round(hourlyProfit * 24);
  const baseDailyNetAfterEssence = baseCoveredProfitPerDay - baseEssenceCostPerDay;
  const roomDailyNetAfterEssence = roomCoveredProfitPerDay - roomEssenceCostPerDay;
  const netGainPerDay = roomDailyNetAfterEssence - baseDailyNetAfterEssence;
  const paybackDays = netGainPerDay > 0 && cost > 0 ? cost / netGainPerDay : null;
  return {
    baseActionHours: baseCap,
    roomActionHours: roomCap,
    roomBonusHours: roomBonus,
    baseStartsPerDay,
    roomStartsPerDay,
    savedStartsPerDay: Math.max(0, baseStartsPerDay - roomStartsPerDay),
    essenceCost: costPerEssence,
    baseEssenceCostPerDay,
    roomEssenceCostPerDay,
    essenceSavingsPerDay,
    fullDayProfit,
    baseCoveredHoursPerDay,
    roomCoveredHoursPerDay,
    baseMissedHoursPerDay,
    roomMissedHoursPerDay,
    baseCoveredProfitPerDay,
    roomCoveredProfitPerDay,
    baseDailyNetAfterEssence,
    roomDailyNetAfterEssence,
    netGainPerDay,
    profitPerAction: Math.round((hourlyProfit * roomCap) - costPerEssence),
    extraHoursPerDay,
    extraProfitPerDay,
    fullBuildCost,
    costShare: split,
    buildCostShare: cost,
    paybackDays,
    horizons: [1, 7, 30, 60, 90].map((days) => ({
      days,
      grossProfit: netGainPerDay * days,
      netProfit: (netGainPerDay * days) - cost,
    })),
  };
}
