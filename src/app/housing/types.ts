import {
  HOUSING_ACTIVITY_TO_SKILL,
  HOUSING_COMPONENTS,
  HOUSING_LOCATIONS,
  calculateRoomProfitProjection,
  calculateHousingBuffs,
  canUseHousingGuestAccess,
  estimateHousingRepairCostSummary,
  getComponentBuildCost,
  getComponentCostBreakdown,
  getHousingBuildCostSummary,
  getHousingActivityLabel,
  getProfileBaseIdleActionHours,
  normalizeHousingCondition,
  normalizeHousingRepairGold,
  sanitizeHousing,
  type HousingComponent,
  type HousingCostEntry,
  type HousingActivity,
  type HousingMode,
  type ProfileHousing,
} from "@/lib/housing";
import {
  formatCondition,
  formatGoldUnit,
  formatHours,
  formatPayback,
  formatSignedGold,
  formatStarts,
} from "@/lib/format";
import { getSafeMarketValue } from "@/lib/market-pricing";

export const BUFF_ACTIVITIES: HousingActivity[] = [
  "woodcutting",
  "mining",
  "fishing",
  "alchemy",
  "smelting",
  "cooking",
  "forge",
  "meditation",
  "eventMastery",
  "combat",
  "dungeon",
  "hunting",
  "construction",
];

export const GUEST_BUFF_GROUPS: Array<{ title: string; activities: HousingActivity[] }> = [
  { title: "Gathering and Crafting", activities: ["woodcutting", "mining", "fishing", "alchemy", "smelting", "cooking", "forge"] },
  { title: "Progression", activities: ["meditation", "eventMastery", "construction"] },
  { title: "Combat and Exploration", activities: ["combat", "dungeon", "hunting"] },
];

export const GUEST_BUFF_OPTIONS = [
  { label: "None", hours: 0 },
  { label: "T1", hours: 0.5 },
  { label: "T2", hours: 1 },
  { label: "T3", hours: 2 },
  { label: "T4", hours: 3 },
  { label: "T5", hours: 4 },
] as const;

export const MODE_OPTIONS: Array<{ mode: HousingMode; label: string; hint: string }> = [
  { mode: "none", label: "None", hint: "Disable housing buffs" },
  { mode: "owner", label: "Owner", hint: "Use built components" },
  { mode: "guest", label: "Guest", hint: "Enter received buffs" },
];

export const CATEGORY_OPTIONS = [
  { value: "all", label: "All components" },
  { value: "idle", label: "Idle rooms" },
  { value: "special", label: "Special" },
  { value: "guest", label: "Guest quarters" },
] as const;

export const ROOM_PROFIT_BASE_HORIZONS = [1, 7, 30] as const;
export const COST_SHARE_OPTIONS = [1, 2, 3, 4] as const;
export const REPAIR_DECAY_DAYS = 90;
export const HOUSING_TABS = [
  { id: "overview", label: "Overview", hint: "Current state" },
  { id: "setup", label: "Setup", hint: "Mode and slots" },
  { id: "components", label: "Components", hint: "Rooms and costs" },
  { id: "profit", label: "Profit", hint: "ROI planner" },
  { id: "guest", label: "Guest", hint: "Received buffs" },
] as const;

export type HousingTab = (typeof HOUSING_TABS)[number]["id"];

export type RepairConditionCard = {
  component: HousingComponent;
  quantity?: number;
  detail: string;
  removable: boolean;
};

export const DECAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatMaterialPrice(unitPrice: number, quantity: number) {
  if (unitPrice <= 0) return "Needs price";
  return `${formatGoldUnit(unitPrice)} ea -> ${formatGoldUnit(unitPrice * quantity)}`;
}

export function formatCostStatus(cost: { totalCost: number; missingMaterials: string[] }) {
  return cost.missingMaterials.length ? "Needs price/data" : formatGoldUnit(cost.totalCost);
}

export function formatKnownCost(value: number, missingMaterials: string[]) {
  return missingMaterials.length ? "Needs price/data" : formatGoldUnit(value);
}

export function formatFullDecayDate(conditionPercent: number, repairDecayDays: number) {
  const condition = normalizeHousingCondition(conditionPercent, 100);
  if (condition <= 0) return "now";
  const daysRemaining = Math.round((condition / 100) * repairDecayDays);
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysRemaining);
  return DECAY_DATE_FORMATTER.format(date);
}

export function getConditionFromRepairGold(fullGoldCost: number, repairGold: number | undefined) {
  if (repairGold === undefined || fullGoldCost <= 0) return undefined;
  const clampedRepairGold = Math.min(fullGoldCost, Math.max(0, repairGold));
  return normalizeHousingCondition(100 - (clampedRepairGold / fullGoldCost) * 100, 100);
}

export function getCycleMonthlyValue(totalCost: number, decayDays: number) {
  const cycleDays = Math.max(1, decayDays);
  return Math.round((Math.max(0, totalCost) / cycleDays) * 30);
}

export function getExtraIdleTimeNote(extraHoursPerDay: number, extraProfitPerDay: number) {
  return extraHoursPerDay > 0
    ? `${formatGoldUnit(extraProfitPerDay)} extra value/day.`
    : "No additional daily gap covered by this tier.";
}

export function getDailyGainNote(
  projection: {
    netGainPerDay: number;
    essenceSavingsPerDay: number;
    extraProfitPerDay: number;
    extraHoursPerDay: number;
    savedStartsPerDay: number;
  },
  hasEssence: boolean,
) {
  if (projection.netGainPerDay > 0) {
    return `${formatGoldUnit(projection.essenceSavingsPerDay)} essence saved + ${formatGoldUnit(projection.extraProfitPerDay)} extra covered value`;
  }
  if (!hasEssence && projection.savedStartsPerDay > 0) {
    return "Fewer starts only become gold savings when an essence is selected.";
  }
  if (projection.extraHoursPerDay <= 0) {
    return "No extra covered time or crystal savings with this setup.";
  }
  return "No daily gold gain with this setup.";
}

export function priceForItem(
  name: string,
  marketData: Record<string, any> | null,
  allItemsDb: Record<string, any> | null,
  customPrices: Record<string, number>,
) {
  const custom = Number(customPrices?.[name] || 0);
  if (custom > 0) return custom;
  const market = getSafeMarketValue(marketData?.[name]);
  if (market > 0) return market;
  const vendor = Number(allItemsDb?.[name]?.vendor_price || 0);
  return Number.isFinite(vendor) && vendor > 0 ? vendor : 0;
}
