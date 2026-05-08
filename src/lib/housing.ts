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
  guestBuffs: HousingManualBuffs;
  guestRemoteConduit: boolean;
  guestPetQuarters: boolean;
  guestHouseLedger: boolean;
  notes: string;
};

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
    guestBuffs: {},
    guestRemoteConduit: false,
    guestPetQuarters: false,
    guestHouseLedger: false,
    notes: "",
  };
}

export function sanitizeHousing(input: Partial<ProfileHousing> | null | undefined): ProfileHousing {
  const base = createDefaultHousing();
  const mode: HousingMode = input?.mode === "owner" || input?.mode === "guest" ? input.mode : "none";
  if (mode === "none") return base;
  const selectedComponents = Array.isArray(input?.selectedComponents)
    ? Array.from(new Set(input.selectedComponents.filter((id) => typeof id === "string" && HOUSING_COMPONENTS_BY_ID[id])))
    : [];
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
    location: mode === "owner" && typeof input?.location === "string" ? input.location.slice(0, 60) : "",
    foundationBuilt: mode === "owner" ? Boolean(input?.foundationBuilt) : false,
    extraSlots: mode === "owner" && input?.foundationBuilt ? Math.min(15, Math.max(0, Math.floor(Number(input?.extraSlots || 0)))) : 0,
    selectedComponents: mode === "owner" && input?.foundationBuilt ? selectedComponents : [],
    guestBuffs: mode === "guest" ? guestBuffs : {},
    guestRemoteConduit: mode === "guest" ? Boolean(input?.guestRemoteConduit) : false,
    guestPetQuarters: mode === "guest" ? Boolean(input?.guestPetQuarters) : false,
    guestHouseLedger: mode === "guest" ? Boolean(input?.guestHouseLedger) : false,
    notes: typeof input?.notes === "string" ? input.notes.slice(0, 500) : "",
  };
}

export function calculateHousingBuffs(housing: Partial<ProfileHousing> | null | undefined): HousingBuffSummary {
  const safeHousing = sanitizeHousing(housing);
  const idleHours = { ...EMPTY_IDLE_HOURS };
  let remoteConduit = false;
  let petQuarters = false;
  let houseLedger = false;
  let guestCapacity = 0;

  const activeComponentCount = safeHousing.mode === "owner" && safeHousing.foundationBuilt
    ? safeHousing.selectedComponents.filter((id) => HOUSING_COMPONENTS_BY_ID[id]?.category !== "structure").length
    : Object.values(safeHousing.guestBuffs).filter((value) => Number(value || 0) > 0).length;
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
    availableAnywhere: remoteConduit,
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
