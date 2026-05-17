"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Castle,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Home,
  MapPin,
  Minus,
  Package,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import ZenithIcon from "@/components/icons/ZenithIcon";
import {
  calculateEssenceSession,
  formatEssenceBuff,
  getEssenceBuffForSkill,
  getEssenceOptionsForSkill,
} from "@/lib/essences";
import { usePreferences } from "@/lib/preferences";
import { getSafeMarketValue } from "@/lib/market-pricing";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import {
  HOUSING_ACTIVITY_TO_SKILL,
  HOUSING_COMPONENTS,
  HOUSING_LOCATIONS,
  calculateRoomProfitProjection,
  calculateHousingBuffs,
  canUseHousingGuestAccess,
  estimateHousingRepairCostSummary,
  formatHours,
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
  DEFAULT_TOOL_SELECTIONS,
  buildForgeRecipes,
  calculateSkillProfitRows,
  type GearData,
  type ItemRegistry,
  type SkillProfitSettings,
} from "@/lib/skill-profit";

const BUFF_ACTIVITIES: HousingActivity[] = [
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

const GUEST_BUFF_GROUPS: Array<{ title: string; activities: HousingActivity[] }> = [
  { title: "Gathering and Crafting", activities: ["woodcutting", "mining", "fishing", "alchemy", "smelting", "cooking", "forge"] },
  { title: "Progression", activities: ["meditation", "eventMastery", "construction"] },
  { title: "Combat and Exploration", activities: ["combat", "dungeon", "hunting"] },
];

const GUEST_BUFF_OPTIONS = [
  { label: "None", hours: 0 },
  { label: "T1", hours: 0.5 },
  { label: "T2", hours: 1 },
  { label: "T3", hours: 2 },
  { label: "T4", hours: 3 },
  { label: "T5", hours: 4 },
] as const;

const MODE_OPTIONS: Array<{ mode: HousingMode; label: string; hint: string }> = [
  { mode: "none", label: "None", hint: "Disable housing buffs" },
  { mode: "owner", label: "Owner", hint: "Use built components" },
  { mode: "guest", label: "Guest", hint: "Enter received buffs" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All components" },
  { value: "idle", label: "Idle rooms" },
  { value: "special", label: "Special" },
  { value: "guest", label: "Guest quarters" },
] as const;

const ROOM_PROFIT_BASE_HORIZONS = [1, 7, 30] as const;
const COST_SHARE_OPTIONS = [1, 2, 3, 4] as const;
const REPAIR_DECAY_DAYS = 90;
const HOUSING_TABS = [
  { id: "overview", label: "Overview", hint: "Current state" },
  { id: "setup", label: "Setup", hint: "Mode and slots" },
  { id: "components", label: "Components", hint: "Rooms and costs" },
  { id: "profit", label: "Profit", hint: "ROI planner" },
  { id: "guest", label: "Guest", hint: "Received buffs" },
] as const;

type HousingTab = (typeof HOUSING_TABS)[number]["id"];
type RepairConditionCard = {
  component: HousingComponent;
  quantity?: number;
  detail: string;
  removable: boolean;
};

const DECAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatGold(value: number) {
  return `${Math.round(value).toLocaleString()}g`;
}

function formatMaterialPrice(unitPrice: number, quantity: number) {
  if (unitPrice <= 0) return "Needs price";
  return `${formatGold(unitPrice)} ea -> ${formatGold(unitPrice * quantity)}`;
}

function formatSignedGold(value: number) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : "-"}${Math.abs(rounded).toLocaleString()}g`;
}

function formatPayback(days: number | null) {
  if (days === null || !Number.isFinite(days)) return "Not profitable";
  if (days < 1) return "Under 1 day";
  if (days < 60) return `${days.toFixed(days < 10 ? 1 : 0)} days`;
  return `${(days / 30).toFixed(1)} months`;
}

function formatStarts(value: number) {
  return `${value} start${value === 1 ? "" : "s"}/day`;
}

function formatCondition(value: number) {
  const condition = normalizeHousingCondition(value, 100);
  return Number.isInteger(condition) ? `${condition}` : condition.toFixed(1);
}

function formatCostStatus(cost: { totalCost: number; missingMaterials: string[] }) {
  return cost.missingMaterials.length ? "Needs price/data" : formatGold(cost.totalCost);
}

function formatKnownCost(value: number, missingMaterials: string[]) {
  return missingMaterials.length ? "Needs price/data" : formatGold(value);
}

function formatFullDecayDate(conditionPercent: number, repairDecayDays: number) {
  const condition = normalizeHousingCondition(conditionPercent, 100);
  if (condition <= 0) return "now";
  const daysRemaining = Math.round((condition / 100) * repairDecayDays);
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysRemaining);
  return DECAY_DATE_FORMATTER.format(date);
}

function getConditionFromRepairGold(fullGoldCost: number, repairGold: number | undefined) {
  if (repairGold === undefined || fullGoldCost <= 0) return undefined;
  const clampedRepairGold = Math.min(fullGoldCost, Math.max(0, repairGold));
  return normalizeHousingCondition(100 - (clampedRepairGold / fullGoldCost) * 100, 100);
}

function getCycleMonthlyValue(totalCost: number, decayDays: number) {
  const cycleDays = Math.max(1, decayDays);
  return Math.round((Math.max(0, totalCost) / cycleDays) * 30);
}

function getExtraIdleTimeNote(extraHoursPerDay: number, extraProfitPerDay: number) {
  return extraHoursPerDay > 0
    ? `${formatGold(extraProfitPerDay)} extra value/day.`
    : "No additional daily gap covered by this tier.";
}

function getDailyGainNote(
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
    return `${formatGold(projection.essenceSavingsPerDay)} essence saved + ${formatGold(projection.extraProfitPerDay)} extra covered value`;
  }
  if (!hasEssence && projection.savedStartsPerDay > 0) {
    return "Fewer starts only become gold savings when an essence is selected.";
  }
  if (projection.extraHoursPerDay <= 0) {
    return "No extra covered time or crystal savings with this setup.";
  }
  return "No daily gold gain with this setup.";
}

function priceForItem(
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

function ChoicePicker<T extends string>({
  label,
  value,
  options,
  open,
  setOpen,
  onChange,
  placeholder = "Select",
}: {
  label?: string;
  value: T | "";
  options: Array<{ value: T; label: string; hint?: string }>;
  open: boolean;
  setOpen: (open: boolean) => void;
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const labelId = useId();
  const valueId = `${listboxId}-value`;
  const selected = options.find((option) => option.value === value);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  const focusOption = (index: number) => {
    if (options.length === 0) return;
    const next = Math.max(0, Math.min(options.length - 1, index));
    setActiveIndex(next);
    window.requestAnimationFrame(() => optionRefs.current[next]?.focus());
  };

  const selectOption = (option: { value: T; label: string; hint?: string }) => {
    onChange(option.value);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, selectedIndex, setOpen]);

  useEffect(() => {
    if (!open) optionRefs.current = [];
  }, [open]);

  return (
    <div
      className="choice-picker"
      ref={rootRef}
    >
      {label && <span className="choice-label">{label}</span>}
      <button
        ref={triggerRef}
        type="button"
        className="choice-trigger"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          window.requestAnimationFrame(() => focusOption(event.key === "ArrowDown" ? 0 : options.length - 1));
          return;
        }
        focusOption(event.key === "ArrowDown" ? activeIndex + 1 : activeIndex - 1);
      }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
      >
        {label && <span id={labelId} className="sr-only">{label}</span>}
        <span id={valueId}>{selected?.label || placeholder}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <>
        <div className="choice-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
        <div className="choice-menu custom-scrollbar" role="listbox" id={listboxId} aria-labelledby={label ? labelId : undefined}>
          <div className="choice-menu-head">
            <span>{label || placeholder}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={15} />
            </button>
          </div>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              ref={(node) => {
                optionRefs.current[options.findIndex((candidate) => candidate.value === option.value)] = node;
              }}
              className={option.value === value ? "active" : ""}
              role="option"
              aria-selected={option.value === value}
              tabIndex={options[activeIndex]?.value === option.value ? 0 : -1}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  focusOption(activeIndex + 1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  focusOption(activeIndex - 1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  focusOption(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  focusOption(options.length - 1);
                } else if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectOption(option);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                  triggerRef.current?.focus();
                }
              }}
              onClick={() => {
                selectOption(option);
              }}
            >
              <strong>{option.label}</strong>
              {option.hint && <small>{option.hint}</small>}
            </button>
          ))}
        </div>
        </>
      )}
    </div>
  );
}

export default function HousingPage() {
  const { activeProfile, updateProfile } = useProfiles();
  const { marketData, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "idle" | "special" | "guest">("all");
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [draftTiers, setDraftTiers] = useState<Record<string, string>>({});
  const [conditionDrafts, setConditionDrafts] = useState<Record<string, string>>({});
  const [conditionSliderDrafts, setConditionSliderDrafts] = useState<Record<string, number>>({});
  const [undoHousing, setUndoHousing] = useState<{ label: string; housing: ProfileHousing } | null>(null);
  const tabButtonRefs = useRef<Partial<Record<HousingTab, HTMLButtonElement | null>>>({});
  const [profitPlannerFamily, setProfitPlannerFamily] = useState("Lumber Store");
  const [profitPlannerRoute, setProfitPlannerRoute] = useState("");
  const [profitPlannerEssence, setProfitPlannerEssence] = useState("");
  const [roomCostShare, setRoomCostShare] = useState(1);
  const [activeHousingTab, setActiveHousingTab] = useState<HousingTab>("overview");
  const [gearData, setGearData] = useState<GearData | null>(null);
  const [itemRegistry, setItemRegistry] = useState<ItemRegistry | null>(null);

  const housing = sanitizeHousing(activeProfile?.housing);
  const summary = useMemo(
    () => calculateHousingBuffs(housing, { profileClassName: activeProfile?.className }),
    [activeProfile?.className, housing],
  );
  const selected = useMemo(() => new Set(housing.selectedComponents), [housing.selectedComponents]);
  const ownerSlotsAvailable = housing.foundationBuilt ? 1 + housing.extraSlots : 0;
  const repairDecayDays = REPAIR_DECAY_DAYS;
  const componentConditions = housing.componentConditions;
  const componentRepairGold = housing.componentRepairGold;
  const roomProfitHorizons = useMemo(
    () => Array.from(new Set([...ROOM_PROFIT_BASE_HORIZONS, repairDecayDays])).sort((a, b) => a - b),
    [repairDecayDays],
  );
  const profitDataActive = activeHousingTab === "profit" && housing.mode === "owner";

  const materialPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    for (const component of HOUSING_COMPONENTS) {
      for (const material of component.materials) {
        prices[material.name] = priceForItem(material.name, marketData, allItemsDb, preferences.customPrices);
      }
    }
    return prices;
  }, [allItemsDb, marketData, preferences.customPrices]);

  useEffect(() => {
    if (!profitDataActive || (gearData && itemRegistry)) return undefined;
    let cancelled = false;
    fetch("/gear-data.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setGearData(data);
      })
      .catch(() => {});

    fetch("/all-items-db.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setItemRegistry(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [gearData, itemRegistry, profitDataActive]);

  const foundationComponent = HOUSING_COMPONENTS.find((component) => component.id === "foundation");
  const slotComponent = HOUSING_COMPONENTS.find((component) => component.id === "slot");

  const selectedSetupEntries = useMemo<HousingCostEntry[]>(() => {
    const entries: HousingCostEntry[] = [];
    if (housing.foundationBuilt && foundationComponent) entries.push({ component: foundationComponent });
    if (slotComponent && housing.extraSlots > 0) entries.push({ component: slotComponent, quantity: housing.extraSlots });
    for (const id of housing.selectedComponents) {
      const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === id);
      if (component) entries.push({ component });
    }
    return entries;
  }, [foundationComponent, housing.extraSlots, housing.foundationBuilt, housing.selectedComponents, slotComponent]);
  const selectedBuildCost = useMemo(
    () => getHousingBuildCostSummary(selectedSetupEntries, materialPrices),
    [materialPrices, selectedSetupEntries],
  );
  const repairSetupEntries = useMemo(
    () => selectedSetupEntries
      .filter((entry) => entry.component.category !== "structure")
      .map((entry) => ({
        ...entry,
        conditionPercent: normalizeHousingCondition(componentConditions[entry.component.id], 100),
        repairGoldOverride: normalizeHousingRepairGold(componentRepairGold[entry.component.id]),
      })),
    [componentConditions, componentRepairGold, selectedSetupEntries],
  );
  const selectedRepairEstimate = useMemo(
    () => estimateHousingRepairCostSummary(repairSetupEntries, materialPrices, 100),
    [materialPrices, repairSetupEntries],
  );
  const selectedCostStatus = formatCostStatus(selectedBuildCost);
  const selectedCostLabel = housing.mode === "owner" ? "Build Cost" : "Saved Setup";

  const selectedComponentDetails = useMemo(() => (
    housing.selectedComponents
      .map((id) => HOUSING_COMPONENTS.find((component) => component.id === id))
      .filter((component): component is NonNullable<typeof component> => Boolean(component))
  ), [housing.selectedComponents]);
  const repairConditionCards = useMemo<RepairConditionCard[]>(() => {
    const cards: RepairConditionCard[] = [];
    for (const component of selectedComponentDetails) {
      cards.push({
        component,
        detail: component.activity
          ? `${component.tier ? `T${component.tier} - ` : ""}${getHousingActivityLabel(component.activity)} +${formatHours(component.idleHours || 0)}`
          : component.description,
        removable: true,
      });
    }
    return cards;
  }, [selectedComponentDetails]);

  const slotOverage = Math.max(0, summary.activeComponentCount - summary.slotCapacity);

  const componentGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const visible = HOUSING_COMPONENTS.filter((component) => {
      if (component.category === "structure") return false;
      if (category !== "all" && component.category !== category) return false;
      if (!needle) return true;
      return [
        component.name,
        component.family,
        component.description,
        component.activity ? getHousingActivityLabel(component.activity) : "",
        component.materials.map((material) => material.name).join(" "),
      ].join(" ").toLowerCase().includes(needle);
    });
    const groups: Array<{ key: string; family: string; category: string; variants: typeof HOUSING_COMPONENTS; selectedId: string | null }> = [];
    const seen = new Set<string>();
    for (const component of visible) {
      if (component.category === "idle" || component.category === "guest") {
        if (seen.has(component.family)) continue;
        const variants = HOUSING_COMPONENTS.filter((candidate) => candidate.family === component.family);
        groups.push({
          key: component.family,
          family: component.family,
          category: component.category,
          variants,
          selectedId: variants.find((variant) => selected.has(variant.id))?.id || draftTiers[component.family] || variants[0]?.id || null,
        });
        seen.add(component.family);
      } else {
        groups.push({
          key: component.id,
          family: component.family,
          category: component.category,
          variants: [component],
          selectedId: component.id,
        });
      }
    }
    return groups;
  }, [category, draftTiers, search, selected]);

  const idleRoomFamilies = useMemo(() => {
    const families = new Map<string, { value: string; label: string; hint: string }>();
    for (const component of HOUSING_COMPONENTS) {
      if (component.category !== "idle" || !component.activity) continue;
      if (families.has(component.family)) continue;
      const skill = HOUSING_ACTIVITY_TO_SKILL[component.activity];
      families.set(component.family, {
        value: component.family,
        label: component.family,
        hint: skill ? `${getHousingActivityLabel(component.activity)} routes available` : `${getHousingActivityLabel(component.activity)} needs a profit source`,
      });
    }
    return Array.from(families.values());
  }, []);

  useEffect(() => {
    if (!idleRoomFamilies.some((family) => family.value === profitPlannerFamily)) {
      setProfitPlannerFamily(idleRoomFamilies[0]?.value || "");
    }
  }, [idleRoomFamilies, profitPlannerFamily]);

  useEffect(() => {
    tabButtonRefs.current[activeHousingTab]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeHousingTab]);

  useEffect(() => {
    if (!undoHousing) return undefined;
    const timeout = setTimeout(() => setUndoHousing(null), 9000);
    return () => clearTimeout(timeout);
  }, [undoHousing]);

  const plannerRoomVariants = useMemo(() => (
    HOUSING_COMPONENTS
      .filter((component) => component.category === "idle" && component.family === profitPlannerFamily)
      .sort((a, b) => Number(a.tier || 0) - Number(b.tier || 0))
  ), [profitPlannerFamily]);
  const plannerActivity = plannerRoomVariants[0]?.activity || null;
  const plannerSkill = plannerActivity ? HOUSING_ACTIVITY_TO_SKILL[plannerActivity] || null : null;
  const plannerBaseIdleHours = getProfileBaseIdleActionHours(activeProfile);
  const plannerPlaytimeHours = Math.min(24, Math.max(0, Number(activeProfile?.timers.activeHours || 0)));
  const plannerOfflineHours = Math.max(0, 24 - plannerPlaytimeHours);

  const forgeRecipes = useMemo(
    () => (profitDataActive ? buildForgeRecipes(gearData, itemRegistry) : []),
    [gearData, itemRegistry, profitDataActive],
  );

  const selectedEssenceSession = useMemo(() => calculateEssenceSession({
    essenceName: profitPlannerEssence,
    skill: plannerSkill,
    items: allItemsDb,
    marketData,
    customPrices: preferences.customPrices,
    actionHours: plannerBaseIdleHours,
  }), [
    allItemsDb,
    marketData,
    plannerBaseIdleHours,
    plannerSkill,
    preferences.customPrices,
    profitPlannerEssence,
  ]);
  const selectedEssenceHasPrice = !profitPlannerEssence || !selectedEssenceSession.needsPrice;
  const selectedEssenceCost = selectedEssenceHasPrice ? selectedEssenceSession.costPerStart : 0;
  const selectedEssenceBuff = useMemo(
    () => selectedEssenceHasPrice ? getEssenceBuffForSkill(profitPlannerEssence, plannerSkill, allItemsDb) : null,
    [allItemsDb, plannerSkill, profitPlannerEssence, selectedEssenceHasPrice],
  );

  const baseSkillProfitSettings = useMemo<SkillProfitSettings>(() => ({
    membership: preferences.membership,
    classBonus: activeProfile ? false : preferences.skillClassBonus,
    profileClassName: activeProfile?.className || undefined,
    energizingPoolExp: 0,
    assaultRank: activeProfile ? getProfileConquestRank(activeProfile) : preferences.assaultRank,
    ascensionBuffIds: [],
    tools: activeProfile
      ? {
          Woodcutting: activeProfile.tools.woodcutting ?? "",
          Mining: activeProfile.tools.mining ?? "",
          Fishing: activeProfile.tools.fishing ?? "",
        }
      : {
          ...DEFAULT_TOOL_SELECTIONS,
          ...preferences.skillTools,
        },
    customPrices: preferences.customPrices,
    barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
  }), [
    activeProfile,
    preferences.assaultRank,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
  ]);

  const skillProfitSettings = useMemo<SkillProfitSettings>(() => ({
    ...baseSkillProfitSettings,
    essenceBuffsBySkill: plannerSkill && selectedEssenceBuff ? {
      [plannerSkill]: selectedEssenceBuff,
    } : undefined,
  }), [
    baseSkillProfitSettings,
    plannerSkill,
    selectedEssenceBuff,
  ]);

  const skillProfitRows = useMemo(
    () => (profitDataActive ? calculateSkillProfitRows(marketData, allItemsDb, skillProfitSettings, forgeRecipes, 0) : []),
    [allItemsDb, forgeRecipes, marketData, profitDataActive, skillProfitSettings],
  );

  const routeRows = useMemo(() => {
    if (!plannerSkill) return [];
    return skillProfitRows
      .filter((row) => row.skill === plannerSkill)
      .filter((row) => row.profitPerHour > 0 && row.inputMissing.length === 0)
      .filter((row) => row.bestSaleSource !== "market" || row.volume3d >= 100)
      .sort((a, b) => b.profitPerHour - a.profitPerHour);
  }, [plannerSkill, skillProfitRows]);

  useEffect(() => {
    if (!routeRows.length) {
      if (profitPlannerRoute) setProfitPlannerRoute("");
      return;
    }
    if (!routeRows.some((row) => row.name === profitPlannerRoute)) {
      setProfitPlannerRoute(routeRows[0].name);
    }
  }, [profitPlannerRoute, routeRows]);

  const selectedRoute = useMemo(
    () => routeRows.find((row) => row.name === profitPlannerRoute) || routeRows[0] || null,
    [profitPlannerRoute, routeRows],
  );

  useEffect(() => {
    if (!profitPlannerEssence || !plannerSkill || !allItemsDb) return;
    if (!getEssenceBuffForSkill(profitPlannerEssence, plannerSkill, allItemsDb)) {
      setProfitPlannerEssence("");
    }
  }, [allItemsDb, plannerSkill, profitPlannerEssence]);

  const essenceOptions = useMemo(() => [
    { value: "", label: "No essence", hint: "No crystal cost or boost" },
    ...getEssenceOptionsForSkill(plannerSkill, allItemsDb, marketData, preferences.customPrices),
  ], [allItemsDb, marketData, plannerSkill, preferences.customPrices]);

  const existingRoomFamilyId = useMemo(() => (
    housing.selectedComponents.find((id) => {
      const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === id);
      return component?.family === profitPlannerFamily;
    }) || null
  ), [housing.selectedComponents, profitPlannerFamily]);

  const selectedRoomFamilyCount = useMemo(() => (
    housing.selectedComponents.filter((id) => {
      const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === id);
      return component?.family === profitPlannerFamily;
    }).length
  ), [housing.selectedComponents, profitPlannerFamily]);

  const plannerSlotNeeded = housing.foundationBuilt && !existingRoomFamilyId && summary.freeSlots <= 0;
  const foundationCost = foundationComponent ? getComponentBuildCost(foundationComponent, materialPrices) : null;
  const slotCost = slotComponent ? getComponentBuildCost(slotComponent, materialPrices) : null;
  const plannerRows = useMemo(() => {
    const essenceMissing = profitPlannerEssence && !selectedEssenceHasPrice ? [profitPlannerEssence] : [];
    const base = {
      label: "No room",
      tier: 0,
      idleHours: 0,
      componentCost: 0,
      prerequisiteCost: 0,
      totalCost: 0,
      missingMaterials: essenceMissing,
      projection: calculateRoomProfitProjection({
        baseIdleHours: plannerBaseIdleHours,
        roomIdleHours: 0,
        playtimeHours: plannerPlaytimeHours,
        profitPerHour: selectedRoute?.profitPerHour || 0,
        buildCost: 0,
        essenceCost: selectedEssenceCost,
        costShare: roomCostShare,
      }),
    };
    const roomRows = plannerRoomVariants.map((component) => {
      const componentCost = getComponentBuildCost(component, materialPrices);
      const needsFoundation = !housing.foundationBuilt;
      const needsSlot = plannerSlotNeeded;
      const prerequisiteCost =
        (needsFoundation ? foundationCost?.totalCost || 0 : 0) +
        (needsSlot ? slotCost?.totalCost || 0 : 0);
      const missingMaterials = [
        ...componentCost.missingMaterials,
        ...(needsFoundation ? foundationCost?.missingMaterials || [] : []),
        ...(needsSlot ? slotCost?.missingMaterials || [] : []),
        ...essenceMissing,
      ];
      const totalCost = componentCost.totalCost + prerequisiteCost;
      return {
        label: `Tier ${component.tier}`,
        tier: component.tier || 0,
        idleHours: component.idleHours || 0,
        componentCost: componentCost.totalCost,
        prerequisiteCost,
        totalCost,
        missingMaterials: Array.from(new Set(missingMaterials)),
        projection: calculateRoomProfitProjection({
          baseIdleHours: plannerBaseIdleHours,
          roomIdleHours: component.idleHours || 0,
          playtimeHours: plannerPlaytimeHours,
          profitPerHour: selectedRoute?.profitPerHour || 0,
          buildCost: totalCost,
          essenceCost: selectedEssenceCost,
          costShare: roomCostShare,
        }),
      };
    });
    return [base, ...roomRows];
  }, [
    foundationCost,
    housing.foundationBuilt,
    materialPrices,
    plannerBaseIdleHours,
    plannerPlaytimeHours,
    plannerRoomVariants,
    plannerSlotNeeded,
    profitPlannerEssence,
    selectedRoute?.profitPerHour,
    selectedEssenceCost,
    selectedEssenceHasPrice,
    roomCostShare,
    slotCost,
  ]);
  const plannerTopTierRow = plannerRows[plannerRows.length - 1] || null;
  const activeIdleBuffs = BUFF_ACTIVITIES.filter((activity) => summary.idleHours[activity] > 0);
  const strongestBonusLabel = summary.strongestIdleBonus
    ? `${getHousingActivityLabel(summary.strongestIdleBonus.activity)} +${formatHours(summary.strongestIdleBonus.hours)}`
    : "No active bonus";
  const guestHostLabel = housing.guestHostName || "Host not recorded";
  const canUseGuestAccess = canUseHousingGuestAccess(activeProfile?.className);
  const guestBlockedClass = activeProfile && !canUseGuestAccess
    ? activeProfile.className
    : "";
  const guestHasLocationLimitedBuffs = housing.mode === "guest" && summary.locationLimited && activeIdleBuffs.length > 0;

  const getSlottedComponents = (componentIds: string[], slotCapacity = ownerSlotsAvailable) => {
    const slotted: string[] = [];
    for (const id of Array.from(new Set(componentIds))) {
      const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === id);
      if (!component || component.category === "structure") continue;
      if (slotted.length >= slotCapacity) break;
      slotted.push(id);
    }
    return slotted;
  };

  const saveHousing = (patch: Partial<typeof housing>) => {
    if (!activeProfile) return;
    const next = sanitizeHousing({ ...housing, ...patch });
    if (next.foundationBuilt) {
      next.selectedComponents = getSlottedComponents(next.selectedComponents, 1 + next.extraSlots);
    }
    updateProfile(activeProfile.id, {
      housing: next,
    });
  };

  const queueHousingUndo = (label: string) => {
    setUndoHousing({ label, housing });
  };

  const restoreHousingUndo = () => {
    if (!activeProfile || !undoHousing) return;
    updateProfile(activeProfile.id, { housing: undoHousing.housing });
    setUndoHousing(null);
  };

  const toggleFoundation = () => {
    const disablingFoundation = housing.foundationBuilt;
    if (disablingFoundation && (housing.selectedComponents.length > 0 || housing.extraSlots > 0)) {
      queueHousingUndo("Foundation removed.");
    }
    saveHousing({
      foundationBuilt: !housing.foundationBuilt,
      extraSlots: !housing.foundationBuilt ? housing.extraSlots : 0,
      selectedComponents: !housing.foundationBuilt ? housing.selectedComponents : [],
      componentConditions: !housing.foundationBuilt ? housing.componentConditions : {},
      componentDecayDays: !housing.foundationBuilt ? housing.componentDecayDays : {},
      componentRepairGold: !housing.foundationBuilt ? housing.componentRepairGold : {},
    });
  };

  const setExtraSlots = (extraSlots: number) => {
    const clampedSlots = Math.min(15, Math.max(0, Math.round(Number(extraSlots) || 0)));
    const nextConditions = { ...housing.componentConditions };
    const nextDecayDays = { ...housing.componentDecayDays };
    const nextRepairGold = { ...housing.componentRepairGold };
    delete nextConditions.slot;
    delete nextDecayDays.slot;
    delete nextRepairGold.slot;
    saveHousing({
      extraSlots: clampedSlots,
      selectedComponents: getSlottedComponents(housing.selectedComponents, 1 + clampedSlots),
      componentConditions: nextConditions,
      componentDecayDays: nextDecayDays,
      componentRepairGold: nextRepairGold,
    });
  };

  const toggleComponent = (componentId: string) => {
    const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === componentId);
    if (!component) return;
    const next = new Set(housing.selectedComponents);
    const nextConditions = { ...housing.componentConditions };
    const nextDecayDays = { ...housing.componentDecayDays };
    const nextRepairGold = { ...housing.componentRepairGold };
    if (next.has(componentId)) {
      queueHousingUndo(`${component.family} removed.`);
      next.delete(componentId);
      delete nextConditions[componentId];
      delete nextDecayDays[componentId];
      delete nextRepairGold[componentId];
    } else {
      if (!housing.foundationBuilt || summary.freeSlots <= 0) return;
      let inheritedCondition: number | undefined = nextConditions[componentId];
      if (component.category === "idle" || component.category === "guest") {
        for (const selectedId of Array.from(next)) {
          const existing = HOUSING_COMPONENTS.find((candidate) => candidate.id === selectedId);
          if (existing?.family === component.family) {
            queueHousingUndo(`${existing.family} replaced.`);
            inheritedCondition = nextConditions[selectedId] ?? inheritedCondition;
            next.delete(selectedId);
            delete nextConditions[selectedId];
            delete nextDecayDays[selectedId];
            delete nextRepairGold[selectedId];
          }
        }
      }
      if (getSlottedComponents([...Array.from(next), componentId]).includes(componentId)) {
        next.add(componentId);
        nextConditions[componentId] = normalizeHousingCondition(inheritedCondition, 100);
        nextDecayDays[componentId] = repairDecayDays;
      }
    }
    saveHousing({
      selectedComponents: Array.from(next),
      componentConditions: nextConditions,
      componentDecayDays: nextDecayDays,
      componentRepairGold: nextRepairGold,
    });
  };

  const removeComponent = (componentId: string) => {
    const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === componentId);
    if (component) queueHousingUndo(`${component.family} removed.`);
    const nextConditions = { ...housing.componentConditions };
    const nextDecayDays = { ...housing.componentDecayDays };
    const nextRepairGold = { ...housing.componentRepairGold };
    delete nextConditions[componentId];
    delete nextDecayDays[componentId];
    delete nextRepairGold[componentId];
    saveHousing({
      selectedComponents: housing.selectedComponents.filter((id) => id !== componentId),
      componentConditions: nextConditions,
      componentDecayDays: nextDecayDays,
      componentRepairGold: nextRepairGold,
    });
  };

  const setComponentTier = (family: string, componentId: string) => {
    const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === componentId);
    if (!component) return;
    setDraftTiers((current) => ({ ...current, [family]: componentId }));
    const next = new Set(housing.selectedComponents);
    const familyAlreadySelected = Array.from(next).some((selectedId) => {
      const existing = HOUSING_COMPONENTS.find((candidate) => candidate.id === selectedId);
      return existing?.family === family;
    });
    if (!familyAlreadySelected) return;
    const nextConditions = { ...housing.componentConditions };
    const nextDecayDays = { ...housing.componentDecayDays };
    const nextRepairGold = { ...housing.componentRepairGold };
    let inheritedCondition: number | undefined = nextConditions[componentId];
    for (const selectedId of Array.from(next)) {
      const existing = HOUSING_COMPONENTS.find((candidate) => candidate.id === selectedId);
      if (existing?.family === family) {
        inheritedCondition = nextConditions[selectedId] ?? inheritedCondition;
        next.delete(selectedId);
        delete nextConditions[selectedId];
        delete nextDecayDays[selectedId];
        delete nextRepairGold[selectedId];
      }
    }
    next.add(componentId);
    nextConditions[componentId] = normalizeHousingCondition(inheritedCondition, 100);
    nextDecayDays[componentId] = repairDecayDays;
    delete nextRepairGold[componentId];
    saveHousing({
      selectedComponents: Array.from(next),
      componentConditions: nextConditions,
      componentDecayDays: nextDecayDays,
      componentRepairGold: nextRepairGold,
    });
  };

  const updateComponentCondition = (componentId: string, condition: number) => {
    if (!Number.isFinite(condition)) return;
    setConditionSliderDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[componentId];
      return nextDrafts;
    });
    setConditionDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[componentId];
      return nextDrafts;
    });
    const nextRepairGold = { ...housing.componentRepairGold };
    delete nextRepairGold[componentId];
    saveHousing({
      componentConditions: {
        ...housing.componentConditions,
        [componentId]: normalizeHousingCondition(condition, 100),
      },
      componentRepairGold: nextRepairGold,
    });
  };

  const updateComponentConditionInput = (componentId: string, rawValue: string) => {
    if (rawValue === "") {
      setConditionDrafts((current) => ({ ...current, [componentId]: "" }));
      return;
    }
    updateComponentCondition(componentId, Number(rawValue));
  };

  const updateComponentConditionSliderDraft = (componentId: string, condition: number) => {
    if (!Number.isFinite(condition)) return;
    setConditionSliderDrafts((current) => ({ ...current, [componentId]: normalizeHousingCondition(condition, 100) }));
  };

  const commitComponentConditionSliderDraft = (componentId: string, directCondition?: number) => {
    const draft = directCondition ?? conditionSliderDrafts[componentId];
    if (draft === undefined) return;
    updateComponentCondition(componentId, draft);
  };

  const resetComponentConditionInput = (componentId: string) => {
    setConditionDrafts((current) => {
      if (current[componentId] !== "") return current;
      const nextDrafts = { ...current };
      delete nextDrafts[componentId];
      return nextDrafts;
    });
  };

  const updateComponentRepairGold = (componentId: string, repairGoldValue: string, fullGoldCost: number) => {
    const nextRepairGold = { ...housing.componentRepairGold };
    const nextConditions = { ...housing.componentConditions };
    const parsedRepairGold = normalizeHousingRepairGold(repairGoldValue);
    if (repairGoldValue.trim() === "" || parsedRepairGold === undefined || fullGoldCost <= 0) {
      delete nextRepairGold[componentId];
    } else {
      const clampedRepairGold = Math.min(fullGoldCost, Math.max(0, parsedRepairGold));
      nextRepairGold[componentId] = clampedRepairGold;
      nextConditions[componentId] = getConditionFromRepairGold(fullGoldCost, clampedRepairGold) ?? 100;
    }
    saveHousing({
      componentConditions: nextConditions,
      componentRepairGold: nextRepairGold,
    });
  };

  const updateGuestBuff = (activity: HousingActivity, hours: number) => {
    const nextGuestBuffs = { ...housing.guestBuffs };
    if (hours > 0) nextGuestBuffs[activity] = hours;
    else delete nextGuestBuffs[activity];
    saveHousing({
      guestBuffs: nextGuestBuffs,
    });
  };

  return (
    <main className="container housing-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow"><ZenithIcon name="housing" size={16} /> Housing Manager</p>
          <h1>House Planner</h1>
          <p className="muted">
            Profile-scoped construction planner for idle-time bonuses, guest buffs, and build cost estimates.
          </p>
        </div>
        <div className="housing-status-card">
          <span>{activeProfile?.name || "No profile"}</span>
          <strong>{housing.mode === "owner" ? "Owner" : housing.mode === "guest" ? "Guest" : "No house"}</strong>
          <em>{housing.mode === "guest" && housing.guestHostName ? `Host: ${housing.guestHostName}` : strongestBonusLabel}</em>
        </div>
      </section>

      {!activeProfile ? (
        <section className="housing-panel empty-panel">
          <Castle size={28} />
          <h2>Create or select a profile first</h2>
          <p>Housing is stored per character profile so alts and mains do not share house setups.</p>
        </section>
      ) : (
        <>
          <nav className="housing-tabs" aria-label="Housing sections">
            {HOUSING_TABS.map((tab) => (
              <button
                key={tab.id}
                ref={(element) => {
                  tabButtonRefs.current[tab.id] = element;
                }}
                type="button"
                className={activeHousingTab === tab.id ? "active" : ""}
                aria-current={activeHousingTab === tab.id ? "page" : undefined}
                onClick={() => setActiveHousingTab(tab.id)}
              >
                <span>{tab.label}</span>
                <small>{tab.hint}</small>
              </button>
            ))}
          </nav>

          {undoHousing && (
            <div className="housing-undo-toast" role="status" aria-live="polite">
              <span>{undoHousing.label}</span>
              <button type="button" onClick={restoreHousingUndo}>Undo</button>
            </div>
          )}

          {activeHousingTab === "overview" && (
            <section className="housing-overview-grid" aria-label="Housing overview">
              <article className="housing-panel overview-card overview-primary-card">
                <div className="overview-card-head">
                  <div>
                    <p className="eyebrow">Status</p>
                    <h2>{housing.mode === "owner" ? "Owner House" : housing.mode === "guest" ? "Guest House" : "Housing Disabled"}</h2>
                  </div>
                  <span className={`access-pill ${summary.availableAnywhere ? "good" : "limited"}`}>
                    {summary.availableAnywhere ? "Anywhere" : housing.mode !== "none" ? "Location-limited" : "Inactive"}
                  </span>
                </div>
                <div className="overview-hero-stat">
                  <span>Strongest buff</span>
                  <strong>{strongestBonusLabel}</strong>
                  <small>
                    {housing.mode === "none"
                      ? "Saved owner and guest setup is preserved, but buffs are off."
                      : housing.mode === "guest"
                        ? `Guest host: ${guestHostLabel}`
                        : `Profile: ${activeProfile.name}`}
                  </small>
                </div>
                <div className="overview-stat-grid compact">
                  <div><span>Components</span><strong>{summary.activeComponentCount}</strong></div>
                  <div><span>Slots</span><strong>{summary.slotCapacity}/16</strong></div>
                  <div>
                    <span>{selectedCostLabel}</span>
                    <strong className={selectedBuildCost.missingMaterials.length ? "needs-data-text" : ""}>{selectedCostStatus}</strong>
                  </div>
                  <div>
                    <span>{housing.mode === "guest" ? "Host" : "Guests"}</span>
                    <strong>{housing.mode === "guest" ? guestHostLabel : summary.guestCapacity}</strong>
                  </div>
                </div>
              </article>

              <article className="housing-panel overview-card">
                <div className="overview-card-head">
                  <div>
                    <p className="eyebrow">Active Buffs</p>
                    <h2>Idle Windows</h2>
                  </div>
                  <button type="button" className="inline-link-button" onClick={() => setActiveHousingTab("setup")}>
                    Edit
                  </button>
                </div>
                {activeIdleBuffs.length ? (
                  <div className="overview-chip-list">
                    {activeIdleBuffs.slice(0, 6).map((activity) => (
                      <span key={activity}>
                        {getHousingActivityLabel(activity)}
                        <strong>+{formatHours(summary.idleHours[activity])}</strong>
                      </span>
                    ))}
                    {activeIdleBuffs.length > 6 && <em>+{activeIdleBuffs.length - 6} more</em>}
                  </div>
                ) : (
                  <p className="overview-empty-copy">No housing buffs are active for this profile.</p>
                )}
              </article>

              <article className="housing-panel overview-card">
                <div className="overview-card-head">
                  <div>
                    <p className="eyebrow">{housing.mode === "guest" ? "Guest Access" : "Build State"}</p>
                    <h2>Setup Checks</h2>
                  </div>
                  <button type="button" className="inline-link-button" onClick={() => setActiveHousingTab(housing.mode === "guest" ? "guest" : "components")}>
                    {housing.mode === "guest" ? "Guest" : "Components"}
                  </button>
                </div>
                <div className="overview-check-list">
                  {housing.mode === "guest" ? (
                    <>
                      <span className={housing.guestHostName ? "done" : ""}><Users size={15} /> Host {guestHostLabel}</span>
                      <span className={summary.availableAnywhere ? "done" : ""}><MapPin size={15} /> {summary.availableAnywhere ? "Remote Conduit active" : `Local to ${housing.location || "host location"}`}</span>
                      <span className={guestBlockedClass ? "" : "done"}><ShieldCheck size={15} /> {guestBlockedClass ? `${guestBlockedClass} cannot be a guest` : "Class can use guest access"}</span>
                      <span><Clock size={15} /> Host repair and decay status is manual</span>
                    </>
                  ) : (
                    <>
                      <span className={housing.foundationBuilt ? "done" : ""}><Check size={15} /> Foundation {housing.foundationBuilt ? "built" : `${formatGold(foundationComponent?.goldCost || 25000)} / 6h`}</span>
                      <span><Clock size={15} /> Repair cycle {repairDecayDays} days after repair</span>
                      <span className={summary.remoteConduit ? "done" : ""}><MapPin size={15} /> Remote Conduit {summary.remoteConduit ? "active" : "not active"}</span>
                      <span className={summary.petQuarters ? "done" : ""}><Sparkles size={15} /> Pet Quarters {summary.petQuarters ? "active" : "not active"}</span>
                      <span className={summary.houseLedger ? "done" : ""}><ShieldCheck size={15} /> House Ledger {summary.houseLedger ? "active" : "not active"}</span>
                    </>
                  )}
                </div>
              </article>
            </section>
          )}

          <section className={`housing-grid top-grid ${activeHousingTab !== "setup" ? "tab-hidden" : ""}`}>
            <div className="housing-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Mode</p>
                  <h2>Profile Housing</h2>
                </div>
                {housing.mode !== "none" && (
                  <button className="ghost-button" type="button" onClick={() => saveHousing({ mode: "none" })}>
                    <X size={16} /> Disable
                  </button>
                )}
              </div>

              <div className="mode-grid">
                {MODE_OPTIONS.map((option) => {
                  const blockedGuestOption = option.mode === "guest" && !canUseGuestAccess;
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      className={`mode-card ${housing.mode === option.mode ? "active" : ""}`}
                      aria-pressed={housing.mode === option.mode}
                      disabled={blockedGuestOption}
                      onClick={() => {
                        if (blockedGuestOption) return;
                        saveHousing(option.mode === "none"
                          ? { mode: "none" }
                          : option.mode === "guest"
                            ? { mode: "guest" }
                            : { mode: "owner" });
                      }}
                    >
                      <strong>{option.label}</strong>
                      <span>{blockedGuestOption ? `${activeProfile?.className || "This class"} cannot use guest access` : option.hint}</span>
                    </button>
                  );
                })}
              </div>

              {housing.mode === "owner" && (
                <div className="owner-setup-grid">
                  <ChoicePicker
                    label="House Location"
                    value={housing.location}
                    options={HOUSING_LOCATIONS.map((location) => ({ value: location, label: location }))}
                    open={openPicker === "location"}
                    setOpen={(open) => setOpenPicker(open ? "location" : null)}
                    onChange={(location) => saveHousing({ location })}
                    placeholder="Select location"
                  />
                  <button
                    type="button"
                    className={`foundation-toggle ${housing.foundationBuilt ? "active" : ""}`}
                    aria-pressed={housing.foundationBuilt}
                    onClick={toggleFoundation}
                  >
                    <strong>Foundation</strong>
                    <span>{housing.foundationBuilt ? "Built - 1 free slot unlocked" : "Build first to unlock slots"}</span>
                  </button>
                  <div className="housing-field compact-field">
                    <span>Extra Slots Built</span>
                    <small>Foundation gives 1 slot. Each extra slot adds 1 more component slot.</small>
                    <div className={`slot-stepper ${!housing.foundationBuilt ? "disabled" : ""}`}>
                      <button
                        type="button"
                        aria-label="Remove one extra slot"
                        disabled={!housing.foundationBuilt || housing.extraSlots <= 0}
                        onClick={() => setExtraSlots(housing.extraSlots - 1)}
                      >
                        <Minus size={15} />
                      </button>
                      <strong>{housing.extraSlots}</strong>
                      <button
                        type="button"
                        aria-label="Add one extra slot"
                        disabled={!housing.foundationBuilt || housing.extraSlots >= 15}
                        onClick={() => setExtraSlots(housing.extraSlots + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {housing.mode === "guest" && (
                <div className="guest-note">
                  <Users size={18} />
                  <span>Enter the host buffs this profile receives. No foundation or slots are needed for guest mode.</span>
                </div>
              )}
              {housing.mode === "none" && (
                <div className="guest-note inactive-note">
                  <Home size={18} />
                  <span>Housing buffs are disabled. Your owner build, guest buffs, and notes are preserved for when you switch back.</span>
                </div>
              )}
            </div>

            <div className="housing-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Summary</p>
                  <h2>Active Buffs</h2>
                </div>
                <span className={`access-pill ${summary.availableAnywhere ? "good" : "limited"}`}>
                  {summary.availableAnywhere ? "Available anywhere" : housing.mode !== "none" ? "Location-limited" : "Inactive"}
                </span>
              </div>

              <div className="stat-strip">
                <div><span>Components</span><strong>{summary.activeComponentCount}</strong></div>
                <div><span>Free Slots</span><strong>{summary.freeSlots}</strong></div>
                <div><span>Total Slots</span><strong>{summary.slotCapacity}/16</strong></div>
                <div>
                  <span>{selectedCostLabel}</span>
                  <strong className={selectedBuildCost.missingMaterials.length ? "needs-data-text" : ""}>{selectedCostStatus}</strong>
                </div>
                <div><span>Guests</span><strong>{summary.guestCapacity}</strong></div>
              </div>

              <div className="flag-grid">
                <span className={summary.remoteConduit ? "enabled" : ""}><MapPin size={15} /> Remote Conduit</span>
                <span className={summary.petQuarters ? "enabled" : ""}><Sparkles size={15} /> Pet Quarters</span>
                <span className={summary.houseLedger ? "enabled" : ""}><ShieldCheck size={15} /> House Ledger</span>
              </div>
            </div>
          </section>

          {housing.mode === "owner" && activeHousingTab === "components" && (
            <section className="housing-panel selected-setup-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Selected Setup</p>
                  <h2>Built Components</h2>
                </div>
                <div className={`slot-meter ${slotOverage ? "warning" : ""}`}>
                  <span>Slots used</span>
                  <strong>{summary.activeComponentCount}/{summary.slotCapacity}</strong>
                </div>
              </div>

              {slotOverage > 0 && (
                <div className="slot-warning">
                  <ShieldCheck size={17} />
                  <span>This setup is {slotOverage} slot{slotOverage === 1 ? "" : "s"} over capacity. Remove components or build more slots.</span>
                </div>
              )}
              <div className="cost-model-strip">
                <div>
                  <span>Foundation</span>
                  <strong>{formatGold(foundationComponent?.goldCost || 25000)} + 6h</strong>
                  <small>Needed before slots, components, and material gathering access.</small>
                </div>
                <div>
                  <span>Build total</span>
                  <strong className={selectedBuildCost.missingMaterials.length ? "needs-data-text" : ""}>{selectedCostStatus}</strong>
                  <small>Fixed gold plus current material prices for this saved setup.</small>
                </div>
                <div>
                  <span>Repair now</span>
                  <strong className={selectedRepairEstimate.missingMaterials.length ? "needs-data-text" : ""}>
                    {formatKnownCost(selectedRepairEstimate.totalCost, selectedRepairEstimate.missingMaterials)}
                  </strong>
                  <small>
                    {selectedRepairEstimate.missingMaterials.length
                      ? "Material prices incomplete."
                      : `${formatGold(selectedRepairEstimate.goldCost)} gold + ${formatGold(selectedRepairEstimate.materialCost)} materials.`}
                  </small>
                </div>
              </div>
              <div className="repair-data-note">
                <ShieldCheck size={16} />
                <span>Set each component condition below. Repair planning uses the 90-day decay cycle for repaired components.</span>
              </div>
              <div className="setup-cost-panel">
                <div className="setup-cost-head">
                  <div>
                    <span>Build materials</span>
                    <strong>{selectedBuildCost.materials.length ? `${selectedBuildCost.materials.length} material${selectedBuildCost.materials.length === 1 ? "" : "s"}` : "Gold only"}</strong>
                  </div>
                  <div className="repair-cycle-pill">
                    <Clock size={15} />
                    <span>{repairDecayDays}-day after repair</span>
                  </div>
                </div>
                <div className="selected-material-breakdown setup-breakdown">
                  <span><Coins size={13} /> Fixed gold <strong>{formatGold(selectedBuildCost.goldCost)}</strong></span>
                  {selectedBuildCost.materials.map((material) => (
                    <span key={`build-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                      {material.quantity.toLocaleString()} {material.name}
                      <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                    </span>
                  ))}
                  {!selectedBuildCost.materials.length && <span>No construction materials recorded for this setup yet.</span>}
                </div>
                <div className="selected-material-breakdown setup-breakdown repair-breakdown">
                  <span><ShieldCheck size={13} /> Repair total <strong className={selectedRepairEstimate.missingMaterials.length ? "needs-data-text" : ""}>{formatKnownCost(selectedRepairEstimate.totalCost, selectedRepairEstimate.missingMaterials)}</strong></span>
                  <span><Coins size={13} /> Repair gold <strong>{formatGold(selectedRepairEstimate.goldCost)}</strong></span>
                  {selectedRepairEstimate.materials.map((material) => (
                    <span key={`repair-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                      {material.quantity.toLocaleString()} {material.name}
                      <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                    </span>
                  ))}
                  {!selectedRepairEstimate.materials.length && <span>No repairable materials until rooms or special components are selected.</span>}
                </div>
              </div>

              <div className="selected-component-grid">
                {repairConditionCards.length ? repairConditionCards.map(({ component, quantity = 1, detail, removable }) => {
                  const fullGoldCost = component.goldCost * quantity;
                  const repairGoldOverride = normalizeHousingRepairGold(componentRepairGold[component.id]);
                  const calibratedCondition = getConditionFromRepairGold(fullGoldCost, repairGoldOverride);
                  const condition = calibratedCondition ?? normalizeHousingCondition(componentConditions[component.id], 100);
                  const cost = getHousingBuildCostSummary([{ component, quantity }], materialPrices);
                  const repairCost = estimateHousingRepairCostSummary(
                    [{ component, quantity, conditionPercent: condition, repairGoldOverride }],
                    materialPrices,
                    100,
                  );
                  const decayDays = repairDecayDays;
                  const fullDecayDate = formatFullDecayDate(condition, decayDays);
                  const cycleMonthlyCost = getCycleMonthlyValue(cost.totalCost, decayDays);
                  const cycleDailyCost = Math.round(cost.totalCost / Math.max(1, decayDays));
                  return (
                    <article key={component.id} className="selected-component-row">
                      <div>
                        <strong>{component.family}</strong>
                        <span>{detail}</span>
                      </div>
                      <div className="selected-row-meta">
                        <small>{cost.missingMaterials.length ? "Build cost needs price/data" : `Build ${formatGold(cost.totalCost)}`}</small>
                        {removable ? (
                          <button type="button" onClick={() => removeComponent(component.id)} aria-label={`Remove ${component.family}`}>
                            <X size={14} /> Remove
                          </button>
                        ) : (
                          <span className="selected-row-lock">Setup</span>
                        )}
                      </div>
                      <div className="component-condition-panel">
                        <div className="condition-readout">
                          <span>Condition</span>
                          <strong>{formatCondition(condition)}%</strong>
                          <small>
                            {repairGoldOverride !== undefined
                              ? `Repair gold matched; decays ${fullDecayDate}`
                              : condition <= 0
                                ? "Fully decayed"
                                : `Fully decays ${fullDecayDate}`}
                          </small>
                        </div>
                        <label className="condition-slider">
                          <span className="sr-only">{component.family} condition</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={conditionSliderDrafts[component.id] ?? condition}
                            aria-label={`${component.family} condition`}
                            onChange={(event) => updateComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber)}
                            onBlur={(event) => commitComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber)}
                            onPointerUp={(event) => commitComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber)}
                            onKeyUp={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                commitComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber);
                              }
                            }}
                          />
                        </label>
                        <label className="condition-number">
                          <span className="sr-only">{component.family} condition percent</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={conditionDrafts[component.id] ?? condition}
                            aria-label={`${component.family} condition percent`}
                            onChange={(event) => updateComponentConditionInput(component.id, event.currentTarget.value)}
                            onBlur={() => resetComponentConditionInput(component.id)}
                          />
                          <span>%</span>
                        </label>
                        <label className="repair-gold-calibration">
                          <span>Game repair gold</span>
                          <input
                            type="number"
                            min="0"
                            max={fullGoldCost}
                            step="1"
                            value={repairGoldOverride ?? ""}
                            placeholder="Optional"
                            aria-label={`${component.family} game repair gold`}
                            onChange={(event) => updateComponentRepairGold(component.id, event.currentTarget.value, fullGoldCost)}
                          />
                        </label>
                      </div>
                      <details className="component-ledger-details">
                        <summary>
                          <span>Build and upkeep details</span>
                          <strong>{repairCost.missingMaterials.length ? "Needs price/data" : `Repair ${formatGold(repairCost.totalCost)}`}</strong>
                        </summary>
                        <div className="selected-material-breakdown">
                          <span><Coins size={13} /> Fixed gold {formatGold(cost.goldCost)}</span>
                          {cost.materials.length ? cost.materials.map((material) => (
                            <span key={`${component.id}-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                              {material.quantity.toLocaleString()} {material.name}
                              <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                            </span>
                          )) : <span>No construction materials recorded.</span>}
                          <span className={`repair-cost-placeholder ${repairCost.missingMaterials.length ? "needs-data" : ""}`}>
                            Repair now
                            <strong className={repairCost.missingMaterials.length ? "needs-data-text" : ""}>
                              {formatKnownCost(repairCost.totalCost, repairCost.missingMaterials)}
                            </strong>
                            <em>{formatGold(repairCost.goldCost)} gold + {repairCost.missingMaterials.length ? "material prices needed" : `${formatGold(repairCost.materialCost)} materials`}</em>
                          </span>
                        </div>
                        <div className="selected-material-breakdown repair-requirement-breakdown">
                          <span><ShieldCheck size={13} /> Repair materials <strong>{repairCost.materials.length ? `${repairCost.materials.length} types` : "None"}</strong></span>
                          {repairCost.materials.map((material) => (
                            <span key={`${component.id}-repair-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                              {material.quantity.toLocaleString()} {material.name}
                              <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                            </span>
                          ))}
                          <span className={repairCost.missingMaterials.length ? "needs-data" : ""}>
                            Material market value
                            <strong>{repairCost.missingMaterials.length ? "Needs price/data" : formatGold(repairCost.materialCost)}</strong>
                          </span>
                        </div>
                        <div className="selected-material-breakdown repair-cycle-breakdown">
                          <span className={cost.missingMaterials.length ? "needs-data" : ""}>
                            Full 90d upkeep value
                            <strong>{formatKnownCost(cost.totalCost, cost.missingMaterials)}</strong>
                            <em>{decayDays}d from 100% to 0%</em>
                          </span>
                          <span className={cost.missingMaterials.length ? "needs-data" : ""}>
                            Average full-cycle upkeep
                            <strong>{formatKnownCost(cycleMonthlyCost, cost.missingMaterials)} / month</strong>
                            <em>{cost.missingMaterials.length ? "Material prices needed" : `${formatGold(cycleDailyCost)} / day`}</em>
                          </span>
                          <span className={repairCost.missingMaterials.length ? "needs-data" : ""}>
                            Current missing condition
                            <strong>{formatCondition(repairCost.repairPercent)}%</strong>
                            <em>Immediate repair uses the current condition only.</em>
                          </span>
                        </div>
                      </details>
                    </article>
                  );
                }) : (
                  <div className="selected-empty">
                    <Package size={20} />
                    <span>No components selected yet. Build the foundation, then add rooms or special components from the planner.</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {housing.mode === "owner" && activeHousingTab === "profit" && (
            <section className="housing-panel room-profit-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow"><TrendingUp size={15} /> Room Profit</p>
                  <h2>Idle-Time Value</h2>
                  <p>
                    Compare room tiers by timer length, starts per day, essence cost, daily gain, and build cost.
                  </p>
                </div>
                <div className="room-profit-summary">
                  <span>{activeProfile?.kind === "main" ? "Main profile" : "Alt profile"}</span>
                  <strong>{formatHours(plannerBaseIdleHours)} base</strong>
                  <small>{formatHours(plannerOfflineHours)} daily gap before housing</small>
                </div>
              </div>

              <div className="room-profit-controls">
                <ChoicePicker
                  label="Room"
                  value={profitPlannerFamily}
                  options={idleRoomFamilies}
                  open={openPicker === "room-profit-family"}
                  setOpen={(open) => setOpenPicker(open ? "room-profit-family" : null)}
                  onChange={(family) => {
                    setProfitPlannerFamily(family);
                    setProfitPlannerRoute("");
                  }}
                />
                <ChoicePicker
                  label="Skill Route"
                  value={selectedRoute?.name || ""}
                  options={routeRows.map((row) => ({
                    value: row.name,
                    label: row.name,
                    hint: `${row.skill} - ${formatGold(row.profitPerHour)}/hr`,
                  }))}
                  open={openPicker === "room-profit-route"}
                  setOpen={(open) => setOpenPicker(open ? "room-profit-route" : null)}
                  onChange={setProfitPlannerRoute}
                  placeholder={plannerSkill ? "No profitable route" : "No profit source"}
                />
                <ChoicePicker
                  label="Essence"
                  value={profitPlannerEssence}
                  options={essenceOptions}
                  open={openPicker === "room-profit-essence"}
                  setOpen={(open) => setOpenPicker(open ? "room-profit-essence" : null)}
                  onChange={setProfitPlannerEssence}
                  placeholder="No essence"
                />
              </div>

              <div className="room-profit-context">
                <span><Clock size={15} /> Profile coverage {formatHours(plannerPlaytimeHours)}/day</span>
                <span><Route size={15} /> {plannerSkill || "No Skill Profit source"}</span>
                <span><Package size={15} /> {housing.foundationBuilt ? `${summary.freeSlots} free slot${summary.freeSlots === 1 ? "" : "s"}` : "Foundation needed"}</span>
              </div>

              <div className="cost-share-card">
                <div>
                  <span>Build cost split</span>
                  <strong>{roomCostShare === 1 ? "Solo" : `${roomCostShare} ways`}</strong>
                  <small>Manual scenario only. Splits one-time build cost; daily profit stays per profile.</small>
                </div>
                <div className="cost-share-row" role="group" aria-label="Build cost split">
                  {COST_SHARE_OPTIONS.map((share) => (
                    <button
                      key={share}
                      type="button"
                      className={roomCostShare === share ? "active" : ""}
                      aria-pressed={roomCostShare === share}
                      onClick={() => setRoomCostShare(share)}
                    >
                      {share === 1 ? "Solo" : `${share}x`}
                    </button>
                  ))}
                </div>
              </div>
              {roomCostShare > summary.guestCapacity + 1 && (
                <div className="room-profit-capacity-warning">
                  <AlertTriangle size={15} />
                  <span>Current Guest Quarters support owner + {summary.guestCapacity} guest{summary.guestCapacity === 1 ? "" : "s"}; this split is a manual what-if.</span>
                </div>
              )}

              {!plannerSkill ? (
                <div className="planner-empty-state compact-empty-state">
                  <Route size={24} />
                  <strong>No profit source yet</strong>
                  <span>{plannerActivity ? `${getHousingActivityLabel(plannerActivity)} room value needs a reliable profit source before ROI can be estimated.` : "Choose an idle room to estimate ROI."}</span>
                </div>
              ) : !selectedRoute ? (
                <div className="planner-empty-state compact-empty-state">
                  <Search size={24} />
                  <strong>No reliable route found</strong>
                  <span>This skill has no profitable route with complete prices and enough market activity right now.</span>
                </div>
              ) : (
                <>
                  <div className="room-profit-explainer">
                    <strong>What this is showing</strong>
                    <span>
                      Daily value starts from the profile hours already covered before housing. Room timer bonus can cover more of the remaining daily gap; if an essence is selected, one crystal is counted per start.
                    </span>
                  </div>
                  <div className="route-value-card">
                    <div>
                      <span>Route value</span>
                      <strong>{selectedRoute.name}</strong>
                      <small>{formatGold(selectedRoute.profitPerHour)}/hr after current prices and profile buffs</small>
                    </div>
                    <div>
                      <span>24h route value</span>
                      <strong>{formatGold(plannerTopTierRow?.projection.fullDayProfit || 0)}</strong>
                      <small>Before essence cost and uncovered profile time.</small>
                    </div>
                    <div>
                      <span>Essence cost</span>
                      <strong>{profitPlannerEssence ? selectedEssenceHasPrice ? formatGold(selectedEssenceCost) : "Needs price/data" : "None"}</strong>
                      <small>{profitPlannerEssence || "Select one to include crystal savings."}</small>
                    </div>
                    <div>
                      <span>Start change</span>
                      <strong>
                        {plannerTopTierRow
                          ? `${formatStarts(plannerTopTierRow.projection.baseStartsPerDay)} -> ${formatStarts(plannerTopTierRow.projection.roomStartsPerDay)}`
                          : "-"}
                      </strong>
                      <small>Tier V comparison for this room.</small>
                    </div>
                    <div>
                      <span>Price data</span>
                      <strong>{selectedRoute.priceWarning ? "Spike-safe" : selectedRoute.bestSaleSource === "vendor" ? "Vendor value" : selectedRoute.bestSaleSource === "custom" ? "Custom price" : "Market value"}</strong>
                      <small>Custom prices are included where saved.</small>
                    </div>
                    <div>
                      <span>Essence boost</span>
                      <strong>{profitPlannerEssence ? selectedEssenceHasPrice ? formatEssenceBuff(selectedEssenceBuff) : "Needs price/data" : "None selected"}</strong>
                      <small>
                        {profitPlannerEssence
                          ? selectedEssenceHasPrice
                            ? "Included in the route value."
                            : "Add custom or market price data before using the boost."
                          : "Select a matching essence to include its boost."}
                      </small>
                    </div>
                  </div>

                  <div className="room-profit-grid">
                    {plannerRows.map((row) => {
                      const canEstimate = row.missingMaterials.length === 0;
                      const isBase = row.tier === 0;
                      return (
                        <article key={row.label} className={`room-profit-card ${isBase ? "baseline" : ""}`}>
                          <div className="room-profit-card-head">
                            <div>
                              <span>{row.label}</span>
                              <strong>{formatHours(row.projection.roomActionHours)} timer</strong>
                            </div>
                            <small>{formatStarts(row.projection.roomStartsPerDay)}</small>
                          </div>

                          <div className="room-profit-metrics">
                            <div>
                              <span>{roomCostShare === 1 ? "Build cost" : "Your build share"}</span>
                              <strong className={`gold-value ${canEstimate ? "" : "needs-data"}`}>
                                {isBase ? "0g" : canEstimate ? formatGold(row.projection.buildCostShare) : "Needs price/data"}
                              </strong>
                              {!isBase && row.prerequisiteCost > 0 && <small>Includes {formatGold(row.prerequisiteCost)} prerequisites</small>}
                              {!isBase && roomCostShare > 1 && <small>{formatGold(row.projection.fullBuildCost)} full build split {row.projection.costShare} ways</small>}
                              {!isBase && existingRoomFamilyId && selectedRoomFamilyCount > 0 && <small>No refund or upgrade discount assumed</small>}
                            </div>
                            <div>
                              <span>Starts per day</span>
                              <strong>{formatStarts(row.projection.roomStartsPerDay)}</strong>
                              <small>{isBase ? "Current timer." : row.projection.savedStartsPerDay > 0 ? `${row.projection.savedStartsPerDay} fewer than no room.` : "Same as no room."}</small>
                            </div>
                            <div>
                              <span>Essence cost per day</span>
                              <strong className={`gold-value ${profitPlannerEssence && !selectedEssenceHasPrice ? "needs-data" : ""}`}>
                                {profitPlannerEssence ? selectedEssenceHasPrice ? formatGold(row.projection.roomEssenceCostPerDay) : "Needs price/data" : "0g"}
                              </strong>
                              <small>
                                {profitPlannerEssence
                                  ? selectedEssenceHasPrice
                                    ? `${row.projection.roomStartsPerDay} x ${formatGold(row.projection.essenceCost)}`
                                    : "Custom or live market price required."
                                  : "No essence selected."}
                              </small>
                            </div>
                            <div>
                              <span>Essence saved per day</span>
                              <strong className="gold-value">{formatGold(row.projection.essenceSavingsPerDay)}</strong>
                              <small>{profitPlannerEssence ? row.projection.essenceSavingsPerDay > 0 ? `${row.projection.savedStartsPerDay} fewer crystal${row.projection.savedStartsPerDay === 1 ? "" : "s"}.` : "No crystal savings." : "Select an essence to count savings."}</small>
                            </div>
                            <div>
                              <span>Daily value after idle gaps</span>
                              <strong className="gold-value">{formatGold(row.projection.roomDailyNetAfterEssence)}</strong>
                              <small>
                                {`${formatHours(row.projection.roomCoveredHoursPerDay)} covered`}
                                {profitPlannerEssence ? ` - ${formatGold(row.projection.roomEssenceCostPerDay)} essence` : ""}
                              </small>
                            </div>
                            <div>
                              <span>Extra covered idle time</span>
                              <strong>{formatHours(row.projection.extraHoursPerDay)}</strong>
                              <small>{getExtraIdleTimeNote(row.projection.extraHoursPerDay, row.projection.extraProfitPerDay)}</small>
                            </div>
                            <div>
                              <span>Daily net gain vs no room</span>
                              <strong className="gold-value">{formatGold(row.projection.netGainPerDay)}</strong>
                              <small>{getDailyGainNote(row.projection, Boolean(profitPlannerEssence && selectedEssenceHasPrice))}</small>
                            </div>
                            <div>
                              <span>Payback from your share</span>
                              <strong>{isBase ? "-" : canEstimate ? formatPayback(row.projection.paybackDays) : "Needs price/data"}</strong>
                            </div>
                          </div>

                          {!canEstimate && (
                            <div className="room-profit-warning">
                              Missing prices: {row.missingMaterials.slice(0, 3).join(", ")}
                              {row.missingMaterials.length > 3 ? ` +${row.missingMaterials.length - 3} more` : ""}
                            </div>
                          )}

                          {isBase ? (
                            <div className="room-profit-note">Baseline: this is what the profile already has before adding this room.</div>
                          ) : canEstimate && row.projection.netGainPerDay > 0 ? (
                            <div className="horizon-list">
                              {roomProfitHorizons.map((days) => {
                                const horizon = row.projection.horizons.find((candidate) => candidate.days === days);
                                return (
                                  <div key={`${row.label}-${days}`} className="horizon-row">
                                    <span>{days === repairDecayDays ? `${days}d cycle` : `${days}d`}</span>
                                    <strong className="gold-value">{formatGold(horizon?.grossProfit || 0)} gain</strong>
                                    <em className={`gold-value ${(horizon?.netProfit || 0) >= 0 ? "positive" : "negative"}`}>
                                      {formatSignedGold(horizon?.netProfit || 0)} after cost
                                    </em>
                                  </div>
                                );
                              })}
                            </div>
                          ) : canEstimate ? (
                            <div className="room-profit-note">
                              {row.projection.savedStartsPerDay > 0
                                ? "This tier reduces starts. Select an essence to price the saved crystals."
                                : "This tier does not reduce starts or cover extra sleep/offline time with the current setup."}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {activeHousingTab === "profit" && housing.mode !== "owner" && (
            <section className="housing-panel guest-disabled-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Room Profit</p>
                  <h2>Owner mode required</h2>
                  <p>Room ROI compares your own foundation, slots, room costs, and Skill Profit routes. Guest mode only tracks received buffs.</p>
                </div>
                <button className="ghost-button" type="button" onClick={() => saveHousing({ mode: "owner" })}>
                  <Home size={16} /> Use Owner Mode
                </button>
              </div>
            </section>
          )}

          {activeHousingTab === "guest" && housing.mode !== "guest" && (
            <section className="housing-panel guest-disabled-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Guest Setup</p>
                  <h2>Guest buffs are inactive</h2>
                  <p>Switch this profile to Guest mode when the character is using another player&apos;s house.</p>
                </div>
                <button
                  className="ghost-button"
                  disabled={!canUseGuestAccess}
                  type="button"
                  onClick={() => saveHousing({ mode: "guest" })}
                >
                  <Users size={16} /> Use Guest Mode
                </button>
              </div>
            </section>
          )}

          {housing.mode === "guest" && activeHousingTab === "guest" && (
            <section className="housing-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Guest Setup</p>
                  <h2>Received Idle-Time Buffs</h2>
                  <p>Choose the tier of each active host component you are using. T1 is 30m, then T2 1h, T3 2h, T4 3h, and T5 4h.</p>
                </div>
                <ChoicePicker
                  label={housing.guestRemoteConduit ? "Guest Scope" : "Guest Buff Location"}
                  value={housing.guestRemoteConduit ? "Available anywhere" : housing.location}
                  options={housing.guestRemoteConduit
                    ? [{ value: "Available anywhere", label: "Available anywhere", hint: "Remote Conduit is active" }]
                    : HOUSING_LOCATIONS.map((location) => ({ value: location, label: location, hint: "Host buffs apply here" }))}
                  open={openPicker === "guest-location"}
                  setOpen={(open) => setOpenPicker(open ? "guest-location" : null)}
                  onChange={(location) => {
                    if (!housing.guestRemoteConduit) saveHousing({ location });
                  }}
                  placeholder="Select buff location"
                />
              </div>
              <div className="guest-context-grid">
                <label className="housing-field guest-host-field">
                  <span>Host / Source</span>
                  <input
                    aria-label="Guest host or source"
                    value={housing.guestHostName}
                    onChange={(event) => saveHousing({ guestHostName: event.target.value })}
                    placeholder="Host character, alt, guild house, or note"
                  />
                </label>
                <div className={`guest-rule-card ${guestBlockedClass ? "warning" : ""}`}>
                  <strong>{guestBlockedClass ? `${guestBlockedClass} cannot be a guest` : "Guest access overrides own house"}</strong>
                  <span>
                    {guestBlockedClass
                      ? "This class cannot use house guest invitations because it cannot access trade systems."
                      : "While this character is a guest, the host setup takes priority over this profile's own house bonuses."}
                  </span>
                </div>
                <div className={`guest-rule-card ${guestHasLocationLimitedBuffs ? "warning" : ""}`}>
                  <strong>{summary.availableAnywhere ? "Remote buffs apply anywhere" : "Local buffs need route location"}</strong>
                  <span>
                    {summary.availableAnywhere
                      ? "Remote Conduit makes these received idle windows available across the world."
                      : "Skill Profit keeps local guest buffs visible but does not apply them until route locations are available."}
                  </span>
                </div>
                <div className="guest-rule-card">
                  <strong>Host condition is manual</strong>
                  <span>Turn off tiers if the host is repairing or has decayed rooms. Pet Quarters and House Ledger are tracked here only.</span>
                </div>
                <div className="guest-rule-card">
                  <strong>Host capacity is not checked</strong>
                  <span>This guest view assumes the host has enough Guest Quarters for your profile.</span>
                </div>
              </div>
              <div className="guest-buff-groups">
                {GUEST_BUFF_GROUPS.map((group) => (
                  <section key={group.title} className="guest-buff-group" aria-labelledby={`guest-${group.title.toLowerCase().replaceAll(" ", "-")}`}>
                    <div className="guest-buff-group-head">
                      <h3 id={`guest-${group.title.toLowerCase().replaceAll(" ", "-")}`}>{group.title}</h3>
                      <span>{group.activities.filter((activity) => Number(housing.guestBuffs[activity] || 0) > 0).length} active</span>
                    </div>
                    <div className="guest-buff-grid">
                      {group.activities.map((activity) => {
                        const currentHours = Number(housing.guestBuffs[activity] || 0);
                        return (
                          <div key={activity} className={`guest-buff-card ${currentHours > 0 ? "active" : ""}`}>
                            <div>
                              <span>{getHousingActivityLabel(activity)}</span>
                              <strong>{currentHours > 0 ? `+${formatHours(currentHours)}` : "No buff"}</strong>
                            </div>
                            <div className="guest-tier-row" role="group" aria-label={`${getHousingActivityLabel(activity)} guest buff tier`}>
                              {GUEST_BUFF_OPTIONS.map((option) => (
                                <button
                                  key={`${activity}-${option.label}`}
                                  type="button"
                                  className={currentHours === option.hours ? "active" : ""}
                                  aria-pressed={currentHours === option.hours}
                                  onClick={() => updateGuestBuff(activity, option.hours)}
                                  title={option.hours > 0 ? `${option.label}: +${formatHours(option.hours)}` : "No received buff"}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              <div className="guest-specials">
                <button
                  type="button"
                  className={housing.guestRemoteConduit ? "active" : ""}
                  aria-pressed={housing.guestRemoteConduit}
                  onClick={() => saveHousing({ guestRemoteConduit: !housing.guestRemoteConduit })}
                >
                  <MapPin size={16} />
                  <span>
                    <strong>Remote Conduit</strong>
                    <small>Host makes these received buffs available anywhere.</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={housing.guestPetQuarters ? "active" : ""}
                  aria-pressed={housing.guestPetQuarters}
                  onClick={() => saveHousing({ guestPetQuarters: !housing.guestPetQuarters })}
                >
                  <Sparkles size={16} />
                  <span>
                    <strong>Pet Quarters</strong>
                    <small>Tracked only until pet sleep planning uses host access.</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={housing.guestHouseLedger ? "active" : ""}
                  aria-pressed={housing.guestHouseLedger}
                  onClick={() => saveHousing({ guestHouseLedger: !housing.guestHouseLedger })}
                >
                  <ShieldCheck size={16} />
                  <span>
                    <strong>House Ledger</strong>
                    <small>Tracked only. Ledger benefits are not two-way.</small>
                  </span>
                </button>
              </div>
            </section>
          )}

          {activeHousingTab === "components" && (
          <section className={`housing-panel planner-panel ${housing.mode !== "owner" ? "planner-disabled" : ""}`}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Planner</p>
                <h2>Components</h2>
                {housing.mode !== "owner" && (
                  <p className="planner-mode-note">Choose Owner mode to build a foundation, add slots, and plan components. Guest mode uses received buffs instead.</p>
                )}
              </div>
              {housing.mode === "owner" && (
              <div className="planner-controls">
                <label className="search-box">
                  <Search size={17} />
                  <input aria-label="Search housing components" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search component, buff, material..." />
                </label>
                <ChoicePicker
                  value={category}
                  options={[...CATEGORY_OPTIONS]}
                  open={openPicker === "category"}
                  setOpen={(open) => setOpenPicker(open ? "category" : null)}
                  onChange={setCategory}
                />
              </div>
              )}
            </div>

            {housing.mode === "owner" ? (
            <div className="component-grid">
              {componentGroups.map((group) => {
                const component = group.variants.find((variant) => variant.id === group.selectedId) || group.variants[0];
                if (!component) return null;
                const cost = getComponentBuildCost(component, materialPrices);
                const materialBreakdown = getComponentCostBreakdown(component, materialPrices);
                const isSelected = selected.has(component.id);
                const canAdd = isSelected || (housing.foundationBuilt && summary.freeSlots > 0);
                return (
                  <article key={group.key} className={`component-card ${isSelected ? "selected" : ""}`}>
                    <div className="component-head">
                      <div className="component-icon"><Package size={19} /></div>
                      <div>
                        <h3>{group.family}</h3>
                        <p>{component.activity ? `${getHousingActivityLabel(component.activity)} +${formatHours(component.idleHours || 0)}` : component.description}</p>
                      </div>
                    </div>

                    {group.variants.length > 1 && (
                      <div className="tier-selector" role="group" aria-label={`${group.family} tier`}>
                        {group.variants.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            className={variant.id === component.id ? "active" : ""}
                            aria-pressed={variant.id === component.id}
                            onClick={() => setComponentTier(group.family, variant.id)}
                          >
                            {variant.tier ? `T${variant.tier}` : variant.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="component-meta">
                      <span><Coins size={14} /> Fixed gold {formatGold(component.goldCost)}</span>
                      {component.levelRequired && <span>Level {component.levelRequired}</span>}
                      {component.guestCapacity && <span>{component.guestCapacity} guest{component.guestCapacity > 1 ? "s" : ""}</span>}
                    </div>

                    <div className="material-list cost-breakdown-list">
                      {materialBreakdown.length ? materialBreakdown.map((material) => (
                        <span key={material.name} className={material.missingPrice ? "needs-data" : ""}>
                          {material.quantity.toLocaleString()} {material.name}
                          <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                        </span>
                      )) : <span>No material data needed</span>}
                    </div>

                    <div className="component-footer">
                      <div>
                        <span className={cost.missingMaterials.length ? "needs-data" : ""}>
                          {cost.missingMaterials.length ? "Needs price/data" : formatGold(cost.totalCost)}
                        </span>
                        <small>{cost.missingMaterials.length ? `${cost.missingMaterials.length} missing prices` : "Build cost: gold + materials"}</small>
                      </div>
                      <button
                        type="button"
                        className={isSelected ? "selected-button" : "add-button"}
                        disabled={!canAdd}
                        onClick={() => toggleComponent(component.id)}
                      >
                        {isSelected ? <><Check size={15} /> Selected</> : !housing.foundationBuilt && housing.mode === "owner" ? "Build foundation first" : summary.freeSlots <= 0 && housing.mode === "owner" ? "No free slot" : "Add"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            ) : (
              <div className="planner-empty-state">
                <Home size={24} />
                <strong>{housing.mode === "guest" ? "Guest buffs are entered above" : "Housing buffs are disabled"}</strong>
                <span>{housing.mode === "guest" ? "Component slots are only needed when this profile owns a house." : "Switch back to Owner or Guest to reactivate the preserved setup."}</span>
              </div>
            )}
          </section>
          )}

          <section className={`housing-panel ${activeHousingTab !== "setup" ? "tab-hidden" : ""}`}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Buffs</p>
                <h2>Idle-Time Breakdown</h2>
              </div>
            </div>
            <div className="buff-grid">
              {BUFF_ACTIVITIES.map((activity) => (
                <div key={activity} className={summary.idleHours[activity] > 0 ? "active" : ""}>
                  <span>{getHousingActivityLabel(activity)}</span>
                  <strong>{formatHours(summary.idleHours[activity])}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className={`housing-panel ${activeHousingTab !== "setup" ? "tab-hidden" : ""}`}>
            <label className="housing-field">
              <span>Notes</span>
              <textarea
                aria-label="Housing notes"
                value={housing.notes}
                onChange={(event) => saveHousing({ notes: event.target.value })}
                placeholder="Private notes about this profile's house, guest host, or planned upgrades."
              />
            </label>
          </section>
        </>
      )}

      <style jsx>{`
        .housing-page {
          padding-bottom: 4rem;
        }
        .page-title-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 1.25rem;
          align-items: stretch;
          margin-bottom: 1.25rem;
        }
        .page-title-row h1 {
          margin: 0.25rem 0 0.45rem;
          font-size: clamp(2rem, 4vw, 3.75rem);
          letter-spacing: 0;
        }
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.78rem;
          font-weight: 800;
          margin: 0;
        }
        .muted,
        .housing-panel p,
        .housing-status-card em,
        .component-card p {
          color: var(--text-muted);
        }
        .housing-status-card,
        .housing-panel,
        .component-card {
          border: 1px solid var(--border-subtle);
          background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018));
          border-radius: 8px;
          box-shadow: 0 16px 45px rgba(0,0,0,0.18);
        }
        .housing-status-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.45rem;
          min-width: 0;
          padding: 1.25rem;
        }
        .housing-status-card span,
        .housing-status-card em {
          font-size: 0.82rem;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-status-card strong {
          color: #fff;
          font-size: 1.4rem;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-tabs {
          position: sticky;
          top: 0.75rem;
          z-index: 20;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.55rem;
          margin: 0 0 1rem;
          padding: 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          background: rgba(5, 10, 13, 0.9);
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 55px rgba(0,0,0,0.18);
        }
        .housing-tabs:before,
        .housing-tabs:after {
          content: "";
          display: none;
          position: sticky;
          top: 0;
          bottom: 0;
          width: 1.65rem;
          pointer-events: none;
          z-index: 1;
        }
        .housing-tabs:before {
          left: 0;
          background: linear-gradient(90deg, rgba(5, 10, 13, 0.96), transparent);
        }
        .housing-tabs:after {
          right: 0;
          background: linear-gradient(270deg, rgba(5, 10, 13, 0.96), transparent);
        }
        .housing-tabs button {
          min-width: 0;
          border: 1px solid transparent;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.7rem 0.75rem;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .housing-tabs button:hover {
          transform: translateY(-1px);
          border-color: rgba(56, 189, 248, 0.32);
          color: #fff;
        }
        .housing-tabs button.active {
          border-color: rgba(56, 189, 248, 0.68);
          background: rgba(56, 189, 248, 0.13);
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.08);
        }
        .housing-tabs span,
        .housing-tabs small {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .housing-tabs span {
          font-weight: 900;
        }
        .housing-tabs small {
          margin-top: 0.18rem;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .tab-hidden {
          display: none !important;
        }
        .housing-undo-toast {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid rgba(34, 211, 238, 0.24);
          border-radius: 8px;
          background: rgba(8, 13, 20, 0.86);
          color: var(--text-primary);
          margin: -0.25rem 0 1rem;
          padding: 0.75rem 0.85rem;
        }
        .housing-undo-toast span {
          font-weight: 800;
        }
        .housing-undo-toast button {
          border: 1px solid rgba(34, 211, 238, 0.38);
          border-radius: 8px;
          background: rgba(34, 211, 238, 0.1);
          color: #67e8f9;
          cursor: pointer;
          font-weight: 900;
          min-height: 2.35rem;
          padding: 0 0.85rem;
        }
        .housing-undo-toast button:hover,
        .housing-undo-toast button:focus-visible {
          background: rgba(34, 211, 238, 0.18);
          outline: none;
        }
        .housing-overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 1rem;
          align-items: stretch;
        }
        .overview-card {
          min-width: 0;
        }
        .overview-primary-card {
          grid-row: span 2;
        }
        .overview-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .overview-card-head h2 {
          margin: 0.2rem 0 0;
          font-size: 1.32rem;
        }
        .inline-link-button {
          border: 1px solid rgba(56, 189, 248, 0.32);
          background: rgba(56, 189, 248, 0.08);
          color: #fff;
          border-radius: 999px;
          padding: 0.45rem 0.72rem;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }
        .overview-hero-stat {
          min-width: 0;
          border: 1px solid rgba(74, 222, 128, 0.22);
          background: rgba(74, 222, 128, 0.055);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .overview-hero-stat span,
        .overview-stat-grid span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .overview-hero-stat strong {
          display: block;
          margin-top: 0.25rem;
          color: #fff;
          font-size: clamp(1.35rem, 3vw, 2.1rem);
          overflow-wrap: anywhere;
        }
        .overview-hero-stat small,
        .overview-empty-copy {
          display: block;
          margin-top: 0.35rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .overview-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.65rem;
        }
        .overview-stat-grid div {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.75rem;
        }
        .overview-stat-grid strong {
          display: block;
          margin-top: 0.22rem;
          color: #fff;
          font-size: 1.05rem;
          overflow-wrap: anywhere;
        }
        .overview-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .overview-chip-list span,
        .overview-chip-list em {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          border-radius: 999px;
          padding: 0.45rem 0.65rem;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-style: normal;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .overview-chip-list strong {
          color: #fff;
          margin-left: 0.35rem;
        }
        .overview-check-list {
          display: grid;
          gap: 0.55rem;
        }
        .overview-check-list span {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .overview-check-list span.done {
          border-color: rgba(74, 222, 128, 0.32);
          color: var(--text-success);
          background: rgba(74, 222, 128, 0.06);
        }
        .housing-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.7fr);
          gap: 1rem;
        }
        .housing-panel {
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        .empty-panel {
          min-height: 260px;
          display: grid;
          place-items: center;
          text-align: center;
          align-content: center;
          gap: 0.75rem;
        }
        .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .panel-heading h2 {
          margin: 0.2rem 0 0;
          font-size: 1.35rem;
        }
        .ghost-button,
        .add-button,
        .selected-button {
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.04);
          color: #fff;
          border-radius: 7px;
          padding: 0.65rem 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-weight: 800;
          cursor: pointer;
        }
        .ghost-button:disabled,
        .add-button:disabled,
        .selected-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .mode-grid,
        .stat-strip,
        .flag-grid,
        .guest-buff-grid,
        .buff-grid {
          display: grid;
          gap: 0.75rem;
        }
        .mode-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
        }
        .mode-card {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.25);
          border-radius: 8px;
          padding: 0.9rem;
          color: var(--text-muted);
          text-align: left;
          cursor: pointer;
          min-width: 0;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .mode-card:hover,
        .component-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.45);
        }
        .mode-card:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .mode-card:disabled:hover {
          transform: none;
          border-color: var(--border-subtle);
        }
        .mode-card strong,
        .mode-card span {
          display: block;
        }
        .mode-card strong {
          color: #fff;
          margin-bottom: 0.3rem;
        }
        .mode-card.active,
        .component-card.selected {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.08);
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .housing-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .housing-field span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .housing-field input,
        .housing-field textarea,
        .search-box input {
          width: 100%;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.35);
          color: #fff;
          border-radius: 7px;
          padding: 0.75rem 0.85rem;
          font: inherit;
          font-weight: 700;
        }
        .housing-field textarea {
          min-height: 110px;
          resize: vertical;
        }
        .housing-field {
          margin-top: 1rem;
        }
        .housing-field small {
          color: var(--text-muted);
          line-height: 1.35;
        }
        .owner-setup-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
          gap: 0.8rem;
          align-items: end;
          margin-top: 1rem;
        }
        .compact-field {
          margin-top: 0;
        }
        :global(.choice-picker) {
          position: relative;
          min-width: 180px;
          color: #fff;
        }
        :global(.choice-label) {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
          margin-bottom: 0.45rem;
        }
        :global(.choice-trigger) {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.25));
          color: #fff;
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          min-width: 0;
        }
        :global(.choice-trigger span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.choice-menu) {
          position: absolute;
          z-index: 40;
          top: calc(100% + 0.45rem);
          left: 0;
          right: 0;
          border: 1px solid rgba(56, 189, 248, 0.35);
          background: rgba(5, 10, 13, 0.98);
          border-radius: 8px;
          padding: 0.4rem;
          box-shadow: 0 18px 50px rgba(0,0,0,0.42);
          max-height: min(320px, 52vh);
          overflow-y: auto;
        }
        :global(.choice-backdrop) {
          display: none;
        }
        :global(.choice-menu-head) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.45rem 0.5rem 0.55rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.68rem;
          font-weight: 900;
        }
        :global(.choice-menu-head button) {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 7px;
          padding: 0;
        }
        :global(.choice-menu button) {
          width: 100%;
          border: 0;
          background: transparent;
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.72rem 0.75rem;
          text-align: left;
          cursor: pointer;
          min-width: 0;
        }
        :global(.choice-menu button.active),
        :global(.choice-menu button:hover) {
          background: rgba(56, 189, 248, 0.12);
          color: #fff;
        }
        :global(.choice-menu .choice-menu-head button) {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 7px;
          padding: 0;
          text-align: center;
        }
        :global(.choice-menu .choice-menu-head button:hover) {
          border-color: rgba(56, 189, 248, 0.45);
          background: rgba(56, 189, 248, 0.12);
        }
        :global(.choice-menu strong),
        :global(.choice-menu small) {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        :global(.choice-menu small) {
          margin-top: 0.25rem;
          color: var(--text-muted);
        }
        .foundation-toggle {
          min-height: 48px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.25);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
          text-align: left;
          cursor: pointer;
        }
        .foundation-toggle strong,
        .foundation-toggle span {
          display: block;
        }
        .foundation-toggle strong {
          color: #fff;
        }
        .foundation-toggle span {
          margin-top: 0.2rem;
          font-size: 0.8rem;
        }
        .foundation-toggle.active {
          border-color: rgba(74, 222, 128, 0.35);
          background: rgba(74, 222, 128, 0.08);
          color: var(--text-success);
        }
        .slot-stepper {
          min-height: 48px;
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr) 44px;
          align-items: center;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.24);
          border-radius: 8px;
          overflow: hidden;
        }
        .slot-stepper.disabled {
          opacity: 0.62;
        }
        .slot-stepper button {
          height: 100%;
          min-height: 48px;
          border: 0;
          background: rgba(255,255,255,0.04);
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .slot-stepper button:disabled {
          cursor: not-allowed;
          color: rgba(255,255,255,0.32);
        }
        .slot-stepper strong {
          text-align: center;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 900;
        }
        .guest-note {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-top: 1rem;
          padding: 0.9rem;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 8px;
          color: #fff;
          background: rgba(56, 189, 248, 0.08);
        }
        .access-pill {
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          padding: 0.45rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 800;
        }
        .access-pill.good {
          color: var(--text-success);
          border-color: rgba(74, 222, 128, 0.35);
        }
        .access-pill.limited {
          color: #fbbf24;
          border-color: rgba(251, 191, 36, 0.35);
        }
        .stat-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 1rem;
        }
        .stat-strip div,
        .flag-grid span,
        .buff-grid div {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .stat-strip span,
        .component-footer small {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }
        .stat-strip strong {
          display: block;
          color: #fff;
          margin-top: 0.25rem;
          font-size: 1.15rem;
        }
        .flag-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .flag-grid span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 800;
        }
        .flag-grid span.enabled {
          color: var(--text-success);
        }
        .selected-setup-panel {
          border-color: rgba(56, 189, 248, 0.24);
        }
        .slot-meter {
          min-width: 120px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
          padding: 0.7rem 0.85rem;
        }
        .slot-meter span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .slot-meter strong {
          display: block;
          margin-top: 0.18rem;
          color: #fff;
          font-size: 1.05rem;
        }
        .slot-meter.warning {
          border-color: rgba(248, 113, 113, 0.55);
          background: rgba(248, 113, 113, 0.08);
        }
        .slot-warning {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border: 1px solid rgba(248, 113, 113, 0.45);
          background: rgba(248, 113, 113, 0.08);
          color: #fecaca;
          border-radius: 8px;
          padding: 0.85rem;
          margin-bottom: 0.85rem;
          font-weight: 750;
        }
        .needs-data-text {
          color: #fbbf24 !important;
        }
        .cost-model-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.85rem;
        }
        .cost-model-strip > div {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
          padding: 0.8rem 0.9rem;
        }
        .cost-model-strip span {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .cost-model-strip strong {
          display: block;
          margin-top: 0.2rem;
          color: #fff;
          font-size: 1rem;
          overflow-wrap: anywhere;
        }
        .cost-model-strip small {
          display: block;
          margin-top: 0.22rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .repair-data-note {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          border: 1px solid rgba(56, 189, 248, 0.22);
          background: rgba(56, 189, 248, 0.07);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.75rem 0.85rem;
          margin-bottom: 0.85rem;
          line-height: 1.4;
          font-size: 0.86rem;
        }
        .repair-data-note svg {
          flex: 0 0 auto;
          color: var(--text-accent);
          margin-top: 0.1rem;
        }
        .setup-cost-panel {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.16);
          padding: 0.85rem;
          margin-bottom: 0.9rem;
        }
        .setup-cost-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.75rem;
        }
        .setup-cost-head span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 850;
        }
        .setup-cost-head strong {
          display: block;
          margin-top: 0.15rem;
          color: #fff;
        }
        .repair-cycle-pill {
          flex: 0 0 auto;
          min-height: 38px;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.65rem;
          font-size: 0.8rem;
          font-weight: 900;
        }
        .setup-breakdown {
          padding-top: 0;
          border-top: 0;
        }
        .setup-breakdown + .setup-breakdown {
          margin-top: 0.55rem;
          padding-top: 0.65rem;
          border-top: 1px solid var(--border-subtle);
        }
        .repair-breakdown span:first-child {
          color: var(--text-accent);
        }
        .selected-component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
          gap: 0.75rem;
        }
        .selected-component-row,
        .selected-empty {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .selected-component-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.85rem;
          align-items: start;
        }
        .selected-component-row strong,
        .selected-component-row span {
          display: block;
        }
        .selected-component-row strong {
          color: #fff;
        }
        .selected-component-row span {
          margin-top: 0.22rem;
          color: var(--text-muted);
          font-size: 0.83rem;
        }
        .selected-row-meta {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-shrink: 0;
        }
        .selected-row-meta small {
          color: #fff;
          font-weight: 900;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .selected-row-meta button {
          border: 1px solid rgba(248, 113, 113, 0.35);
          background: rgba(248, 113, 113, 0.08);
          color: #fecaca;
          border-radius: 7px;
          padding: 0.48rem 0.6rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 800;
          cursor: pointer;
        }
        .selected-row-lock {
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          padding: 0.48rem 0.6rem;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .component-condition-panel {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.35fr);
          gap: 0.6rem;
          align-items: center;
          border: 1px solid rgba(56, 189, 248, 0.24);
          background: rgba(56, 189, 248, 0.07);
          border-radius: 8px;
          padding: 0.7rem;
        }
        .component-ledger-details {
          grid-column: 1 / -1;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
        }
        .component-ledger-details summary {
          min-height: 44px;
          padding: 0.72rem 0.8rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.85rem;
          color: #fff;
          cursor: pointer;
          font-weight: 900;
          list-style-position: inside;
        }
        .component-ledger-details summary span,
        .component-ledger-details summary strong {
          min-width: 0;
        }
        .component-ledger-details summary strong {
          color: var(--text-accent);
          font-size: 0.84rem;
          text-align: right;
          overflow-wrap: anywhere;
        }
        .component-ledger-details[open] summary {
          border-bottom: 1px solid var(--border-subtle);
        }
        .component-ledger-details .selected-material-breakdown {
          margin: 0.72rem;
        }
        .component-ledger-details .selected-material-breakdown + .selected-material-breakdown {
          margin-top: 0;
        }
        @media (max-width: 980px) {
          .component-condition-panel {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
            align-items: stretch;
          }
        }
        .condition-readout span,
        .condition-readout strong,
        .condition-readout small {
          display: block;
        }
        .condition-readout span {
          margin: 0;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.68rem;
          font-weight: 900;
        }
        .condition-readout strong {
          margin-top: 0.12rem;
          color: #fff;
          font-size: 1.05rem;
        }
        .condition-readout small {
          margin-top: 0.12rem;
          color: var(--text-muted);
          font-size: 0.74rem;
          line-height: 1.25;
        }
        .condition-slider {
          min-width: 0;
          display: flex;
          align-items: center;
        }
        .condition-slider input[type="range"] {
          width: 100%;
          accent-color: #38bdf8;
          cursor: pointer;
        }
        .condition-number {
          display: flex;
          align-items: center;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(0,0,0,0.32);
          overflow: hidden;
        }
        .condition-number input {
          min-width: 0;
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: #fff;
          padding: 0.55rem 0.35rem 0.55rem 0.55rem;
          font: inherit;
          font-weight: 900;
          text-align: right;
        }
        .condition-number span {
          margin: 0;
          padding: 0.55rem 0.55rem 0.55rem 0;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 900;
        }
        .repair-gold-calibration {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.25rem;
        }
        .repair-gold-calibration span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.62rem;
          font-weight: 900;
        }
        .repair-gold-calibration input {
          width: 100%;
          min-width: 0;
          min-height: 38px;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(0,0,0,0.32);
          color: #fff;
          padding: 0.55rem 0.65rem;
          font: inherit;
          font-weight: 900;
          outline: none;
        }
        .repair-gold-calibration input:focus-visible {
          border-color: rgba(56, 189, 248, 0.65);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        .selected-material-breakdown {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          gap: 0.45rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
        }
        .selected-material-breakdown span,
        .cost-breakdown-list span {
          min-width: 0;
        }
        .selected-material-breakdown span {
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          border-radius: 7px;
          padding: 0.55rem 0.65rem;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .selected-material-breakdown span:first-child {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: #fff;
        }
        .selected-material-breakdown strong,
        .cost-breakdown-list strong {
          display: block;
          margin-top: 0.14rem;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 900;
        }
        .selected-material-breakdown .needs-data,
        .cost-breakdown-list .needs-data {
          border-color: rgba(251, 191, 36, 0.34);
          color: #fbbf24;
        }
        .repair-cost-placeholder strong {
          color: #fbbf24;
        }
        .repair-cost-placeholder em {
          display: block;
          margin-top: 0.14rem;
          color: var(--text-muted);
          font-style: normal;
          font-size: 0.72rem;
        }
        .repair-requirement-breakdown {
          margin-top: 0.45rem;
        }
        .repair-requirement-breakdown span:first-child {
          color: var(--text-accent);
        }
        .repair-cycle-breakdown {
          margin-top: 0.45rem;
        }
        .repair-cycle-breakdown span:first-child {
          display: block;
          color: var(--text-muted);
        }
        .repair-cycle-breakdown em {
          display: block;
          margin-top: 0.14rem;
          color: var(--text-muted);
          font-style: normal;
          font-size: 0.72rem;
          line-height: 1.35;
        }
        .selected-empty {
          min-height: 78px;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          color: var(--text-muted);
        }
        .guest-context-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
          gap: 0.75rem;
          align-items: stretch;
          margin: 1rem 0;
        }
        .guest-host-field {
          margin-top: 0;
        }
        .guest-rule-card {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          border-radius: 8px;
          padding: 0.8rem;
        }
        .guest-rule-card.warning {
          border-color: rgba(251, 191, 36, 0.38);
          background: rgba(251, 191, 36, 0.08);
        }
        .guest-rule-card strong,
        .guest-rule-card span {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .guest-rule-card strong {
          color: #fff;
          font-size: 0.9rem;
        }
        .guest-rule-card span {
          margin-top: 0.28rem;
          color: var(--text-muted);
          line-height: 1.38;
          font-size: 0.84rem;
        }
        .guest-buff-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
        }
        .guest-buff-groups {
          display: grid;
          gap: 1rem;
        }
        .guest-buff-group {
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 0.85rem;
        }
        .guest-buff-group-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .guest-buff-group-head h3 {
          margin: 0;
          color: #fff;
          font-size: 0.95rem;
        }
        .guest-buff-group-head span {
          flex: 0 0 auto;
          color: var(--text-accent);
          border: 1px solid rgba(56, 189, 248, 0.22);
          background: rgba(56, 189, 248, 0.08);
          border-radius: 999px;
          padding: 0.28rem 0.55rem;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .guest-buff-card {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .guest-buff-card.active {
          border-color: rgba(74, 222, 128, 0.32);
          background: rgba(74, 222, 128, 0.06);
        }
        .guest-buff-card > div:first-child {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: baseline;
          margin-bottom: 0.7rem;
        }
        .guest-buff-card span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .guest-buff-card strong {
          color: #fff;
          white-space: nowrap;
        }
        .guest-tier-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 4.5rem), 1fr));
          gap: 0.35rem;
        }
        .guest-tier-row button {
          min-height: 36px;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          border-radius: 7px;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
          cursor: pointer;
        }
        .guest-tier-row button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .guest-specials {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .guest-specials button {
          min-height: 74px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          text-align: left;
          cursor: pointer;
        }
        .guest-specials button.active {
          border-color: rgba(74, 222, 128, 0.35);
          background: rgba(74, 222, 128, 0.08);
          color: #fff;
        }
        .guest-specials strong,
        .guest-specials small {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .guest-specials small {
          margin-top: 0.2rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .planner-controls {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .room-profit-panel {
          position: relative;
          z-index: 2;
        }
        .room-profit-summary {
          min-width: 190px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.75rem 0.85rem;
          background: rgba(0,0,0,0.22);
        }
        .room-profit-summary span,
        .room-profit-summary small,
        .route-value-card span,
        .room-profit-card span,
        .horizon-list span {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }
        .room-profit-summary strong {
          display: block;
          margin-top: 0.2rem;
          color: #fff;
          font-size: 1.08rem;
        }
        .room-profit-summary small {
          margin-top: 0.2rem;
          text-transform: none;
          letter-spacing: 0;
          font-size: 0.78rem;
        }
        .room-profit-controls {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem;
          margin: 1rem 0 0.85rem;
          align-items: end;
        }
        .room-profit-context,
        .route-value-card,
        .room-profit-grid,
        .room-profit-metrics,
        .horizon-list {
          display: grid;
          gap: 0.75rem;
        }
        .room-profit-context {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          margin-bottom: 0.9rem;
        }
        .room-profit-context span {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.2);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          font-size: 0.84rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .cost-share-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(56, 189, 248, 0.24);
          border-radius: 8px;
          padding: 0.85rem;
          background: rgba(56, 189, 248, 0.06);
          margin-bottom: 0.9rem;
        }
        .cost-share-card > div:first-child {
          min-width: 0;
        }
        .cost-share-card span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .cost-share-card strong {
          display: block;
          color: #fff;
          overflow-wrap: anywhere;
        }
        .cost-share-card small {
          display: block;
          margin-top: 0.18rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .cost-share-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.4rem;
          min-width: min(100%, 260px);
        }
        .cost-share-row button {
          min-height: 40px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.28);
          color: var(--text-muted);
          border-radius: 7px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        .cost-share-row button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .room-profit-capacity-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          border: 1px solid rgba(251, 191, 36, 0.34);
          background: rgba(251, 191, 36, 0.08);
          color: #fde68a;
          border-radius: 8px;
          padding: 0.72rem 0.8rem;
          margin: -0.35rem 0 0.9rem;
          font-size: 0.84rem;
          font-weight: 750;
          line-height: 1.4;
        }
        .room-profit-capacity-warning svg {
          flex: 0 0 auto;
          margin-top: 0.1rem;
        }
        .room-profit-capacity-warning span {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .room-profit-explainer {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          border: 1px solid rgba(245, 158, 11, 0.32);
          background: rgba(245, 158, 11, 0.08);
          border-radius: 8px;
          padding: 0.85rem;
          margin-bottom: 0.9rem;
          color: #fde68a;
        }
        .room-profit-explainer strong {
          color: #fff;
          white-space: nowrap;
        }
        .room-profit-explainer span {
          color: var(--text-muted);
          line-height: 1.4;
        }
        .route-value-card {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          border: 1px solid rgba(56, 189, 248, 0.24);
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.07);
          padding: 0.85rem;
          margin-bottom: 0.9rem;
        }
        .route-value-card > div {
          min-width: 0;
        }
        .route-value-card strong,
        .room-profit-card strong,
        .horizon-list strong,
        .horizon-list em {
          display: block;
          color: #fff;
          overflow-wrap: anywhere;
        }
        .gold-value {
          white-space: normal;
          overflow-wrap: anywhere;
          font-variant-numeric: tabular-nums;
        }
        .route-value-card strong {
          margin-top: 0.2rem;
        }
        .route-value-card small,
        .room-profit-metrics small {
          display: block;
          margin-top: 0.22rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .room-profit-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
        }
        .room-profit-card {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
          padding: 0.9rem;
        }
        .room-profit-card.baseline {
          background: rgba(255,255,255,0.035);
        }
        .room-profit-card-head {
          display: flex;
          justify-content: space-between;
          gap: 0.8rem;
          align-items: flex-start;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .room-profit-card-head strong {
          margin-top: 0.18rem;
          font-size: 1.22rem;
        }
        .room-profit-card-head small {
          color: var(--text-accent);
          font-weight: 900;
          white-space: nowrap;
        }
        .room-profit-metrics {
          grid-template-columns: 1fr;
          margin-top: 0.75rem;
        }
        .room-profit-metrics > div {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.7rem;
          background: rgba(255,255,255,0.035);
        }
        .room-profit-metrics strong {
          margin-top: 0.15rem;
        }
        .room-profit-metrics .needs-data,
        .room-profit-warning {
          color: #fbbf24;
        }
        .room-profit-warning {
          margin-top: 0.75rem;
          border: 1px solid rgba(251, 191, 36, 0.35);
          background: rgba(251, 191, 36, 0.08);
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          font-size: 0.82rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .room-profit-note {
          margin-top: 0.75rem;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.18);
          border-radius: 8px;
          padding: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .horizon-list {
          margin-top: 0.75rem;
          gap: 0.45rem;
        }
        .horizon-row {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(5.2rem, 0.55fr) minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          gap: 0.6rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.62rem 0.7rem;
          background: rgba(0,0,0,0.18);
        }
        .horizon-row strong,
        .horizon-row em {
          margin: 0;
          font-size: 0.88rem;
          font-style: normal;
        }
        .horizon-row .positive {
          color: var(--text-success);
        }
        .horizon-row .negative {
          color: #fecaca;
        }
        .compact-empty-state {
          min-height: 150px;
        }
        .planner-mode-note {
          max-width: 620px;
          margin: 0.35rem 0 0;
          font-size: 0.9rem;
        }
        .planner-empty-state {
          min-height: 180px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 0.55rem;
          text-align: center;
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          color: var(--text-muted);
          background: rgba(0,0,0,0.18);
        }
        .planner-empty-state strong {
          color: #fff;
          font-size: 1.05rem;
        }
        .planner-empty-state span {
          max-width: 420px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: min(420px, 100%);
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.35);
          border-radius: 8px;
          padding: 0 0.75rem;
        }
        .search-box input {
          border: 0;
          background: transparent;
          padding-left: 0;
        }
        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 1rem;
        }
        .component-card {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .component-head {
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr);
          gap: 0.75rem;
          align-items: start;
        }
        .component-icon {
          width: 46px;
          height: 46px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,0.25);
          color: var(--text-accent);
        }
        .component-card h3 {
          margin: 0;
          color: #fff;
          font-size: 1rem;
        }
        .component-card p {
          margin: 0.25rem 0 0;
          font-size: 0.86rem;
        }
        .component-meta,
        .material-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .tier-selector {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.4rem;
        }
        .tier-selector button {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.24);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.45rem 0.35rem;
          font-weight: 900;
          cursor: pointer;
        }
        .tier-selector button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .component-meta span,
        .material-list span {
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.045);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.35rem 0.55rem;
          font-size: 0.76rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
          white-space: normal;
        }
        .cost-breakdown-list span {
          flex: 1 1 11rem;
        }
        .component-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: auto;
          padding-top: 0.8rem;
          border-top: 1px solid var(--border-subtle);
        }
        .component-footer > div {
          min-width: 0;
        }
        .component-footer span {
          color: #fff;
          font-weight: 900;
          overflow-wrap: anywhere;
        }
        .component-footer .needs-data {
          color: #fbbf24;
        }
        .add-button {
          background: rgba(56, 189, 248, 0.13);
          border-color: rgba(56, 189, 248, 0.35);
        }
        .add-button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
          background: rgba(255,255,255,0.035);
          border-color: var(--border-subtle);
        }
        .selected-button {
          background: rgba(74, 222, 128, 0.13);
          border-color: rgba(74, 222, 128, 0.35);
        }
        .buff-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        .buff-grid div {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          color: var(--text-muted);
        }
        .buff-grid div.active {
          border-color: rgba(74, 222, 128, 0.35);
          color: #fff;
        }
        .buff-grid strong {
          color: inherit;
        }
        @media (max-width: 920px) {
          .page-title-row,
          .housing-grid,
          .housing-overview-grid {
            grid-template-columns: 1fr;
          }
          .housing-tabs {
            position: static;
            display: flex;
            overflow-x: auto;
            scrollbar-width: thin;
            scroll-padding-inline: 1.7rem;
          }
          .housing-tabs:before,
          .housing-tabs:after {
            display: block;
            flex: 0 0 1.65rem;
          }
          .housing-tabs button {
            flex: 0 0 min(42vw, 10.5rem);
          }
          .overview-primary-card {
            grid-row: auto;
          }
          .mode-grid,
          .stat-strip,
          .flag-grid,
          .owner-setup-grid,
          .guest-specials {
            grid-template-columns: 1fr;
          }
          .panel-heading {
            flex-direction: column;
            align-items: stretch;
          }
          .planner-controls {
            justify-content: stretch;
          }
          .room-profit-controls,
          .route-value-card,
          .cost-model-strip {
            grid-template-columns: 1fr;
          }
          .cost-share-card {
            align-items: stretch;
            flex-direction: column;
          }
          .cost-share-row {
            width: 100%;
          }
          .room-profit-summary {
            width: 100%;
          }
          .planner-controls,
          .search-box,
          :global(.choice-picker) {
            width: 100%;
          }
          .selected-component-row {
            align-items: stretch;
            grid-template-columns: 1fr;
          }
          .selected-row-meta {
            justify-content: space-between;
          }
        }
        @media (max-width: 640px) {
          .housing-tabs {
            margin-left: -0.25rem;
            margin-right: -0.25rem;
          }
          .housing-tabs button {
            flex-basis: 8.75rem;
            padding: 0.62rem 0.68rem;
          }
          .overview-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .overview-card-head {
            align-items: stretch;
            flex-direction: column;
          }
          .inline-link-button {
            width: fit-content;
          }
          .component-footer {
            align-items: stretch;
            flex-direction: column;
          }
          .room-profit-card-head {
            flex-direction: column;
          }
          .room-profit-card-head small {
            white-space: normal;
          }
          .room-profit-explainer {
            flex-direction: column;
          }
          .room-profit-explainer strong {
            white-space: normal;
          }
          .setup-cost-head {
            align-items: stretch;
            flex-direction: column;
          }
          .repair-cycle-pill {
            width: 100%;
            justify-content: center;
          }
          .housing-undo-toast {
            align-items: stretch;
            flex-direction: column;
          }
          .component-condition-panel {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
          .component-ledger-details summary {
            align-items: stretch;
            flex-direction: column;
          }
          .component-ledger-details summary strong {
            text-align: left;
          }
          .horizon-row {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
        }
        @media (max-width: 520px) {
          .housing-panel {
            padding: 1rem;
          }
          .component-grid {
            grid-template-columns: 1fr;
          }
          .guest-buff-grid {
            grid-template-columns: 1fr;
          }
          .component-footer {
            align-items: stretch;
            flex-direction: column;
          }
          .add-button,
          .selected-button {
            justify-content: center;
          }
          .room-profit-grid {
            grid-template-columns: 1fr;
          }
          .room-profit-context {
            grid-template-columns: 1fr;
          }
          .cost-share-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          :global(.choice-menu) {
            position: fixed;
            z-index: 6010;
            left: 0.75rem;
            right: 0.75rem;
            top: auto;
            bottom: 0.75rem;
            max-height: min(420px, 70dvh);
          }
          :global(.choice-backdrop) {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 6000;
            border: 0;
            background: rgba(0,0,0,0.52);
          }
        }
      `}</style>
    </main>
  );
}
