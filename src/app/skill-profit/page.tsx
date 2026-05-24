"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  Eye,
  Filter,
  Info,
  PackageSearch,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { formatGold } from "@/lib/format";
import ZenithIcon from "@/components/icons/ZenithIcon";
import QualityText from "@/components/QualityText";
import { usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { barteringBuffPercent, getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  SKILL_TO_HOUSING_ACTIVITY,
  calculateHousingBuffs,
  formatHours,
  getProfileBaseIdleActionHours,
  getHousingIdleHoursForActivity,
  getHousingActivityLabel,
} from "@/lib/housing";
import {
  SUPPORTED_ESSENCE_SKILLS,
  calculateEssenceSession,
  formatEssenceBuff,
  getEssenceOptionsForSkill,
  type EssenceSession,
  type EssenceSkillName,
} from "@/lib/essences";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { useModalA11y } from "@/lib/use-modal-a11y";
import {
  ASCENSION_BUFFS,
  AssaultRank,
  DEFAULT_TOOL_SELECTIONS,
  GearData,
  ItemRegistry,
  SKILLS,
  SKILL_TOOLS,
  SkillName,
  SkillProfitRow,
  SkillProfitSettings,
  SkillProfitSortKey,
  SaleMode,
  ToolSkill,
  buildForgeRecipes,
  calculateSkillProfitRow,
  calculateSkillProfitRows,
  getBuffTotals,
  isFixedBuyPriceItem,
} from "@/lib/skill-profit";
import styles from "./page.module.css";

const STORAGE_KEY = "zenith_skill_profit_finder";

const DEFAULT_SETTINGS: SkillProfitSettings = {
  membership: false,
  classBonus: false,
  saleMode: "best",
  energizingPoolExp: 0,
  assaultRank: "none",
  ascensionBuffIds: [],
  tools: DEFAULT_TOOL_SELECTIONS,
  customPrices: {},
  barteringBoost: 0,
  essenceBySkill: {},
};

type PersistedState = {
  settings: SkillProfitSettings;
  activeSkill: SkillName | "All";
  sortKey: SkillProfitSortKey;
  sortDesc: boolean;
  searchTerm: string;
  minVolume: number;
  ascensionOpen: boolean;
  essenceOpen: boolean;
};

type DropdownLayer = "tools" | "essences" | "command";

const DEFAULT_STATE: PersistedState = {
  settings: DEFAULT_SETTINGS,
  activeSkill: "All",
  sortKey: "profitPerHour",
  sortDesc: true,
  searchTerm: "",
  minVolume: 100,
  ascensionOpen: true,
  essenceOpen: false,
};

const MOBILE_RESULT_BATCH_SIZE = 80;

const SORT_LABELS: Record<SkillProfitSortKey, string> = {
  name: "Item",
  skill: "Skill",
  level: "Level",
  profitEach: "Profit/Piece",
  profitPerHour: "Gold/Hr",
  roi: "Profit/Piece",
  itemsPerHour: "Items/Hr",
  expPerSecond: "Exp/S",
  expPerHour: "Exp/Hr",
  finalDuration: "Duration",
  volume3d: "Stable Vol",
  inputCost: "Cost",
  salePrice: "Return",
};

const CONQUEST_PICKER_OPTIONS: Array<{ value: AssaultRank; label: string; hint: string }> = [
  { value: "none", label: "No conquest", hint: "No profile buff" },
  { value: "first", label: "1st place", hint: "+15% EXP, +3% Eff" },
  { value: "second", label: "2nd place", hint: "+10% EXP, +3% Eff" },
  { value: "third", label: "3rd place", hint: "+8% EXP, +3% Eff" },
  { value: "fourthSeventh", label: "4th-7th", hint: "+6% EXP, +2% Eff" },
  { value: "eighthTenth", label: "8th-10th", hint: "+2% EXP, +1% Eff" },
];

const SALE_MODE_OPTIONS: Array<{ value: SaleMode; label: string; hint: string }> = [
  { value: "best", label: "Auto", hint: "Use the better net return" },
  { value: "market", label: "Market", hint: "Sell through market after tax" },
  { value: "vendor", label: "Vendor", hint: "Sell to vendor with bartering" },
];

export default function SkillProfitPage() {
  const { marketData, allItemsDb, itemRegistry } = useData();
  const { openItemByName, prefetchItem } = useItemModal();
  const { preferences, setPreferences, loaded: preferencesLoaded } = usePreferences();
  const { activeProfile, updateProfile, loaded: profilesLoaded } = useProfiles();
  const [settings, setSettings] = useState<SkillProfitSettings>(DEFAULT_STATE.settings);
  const [activeSkill, setActiveSkill] = useState<SkillName | "All">(DEFAULT_STATE.activeSkill);
  const [sortKey, setSortKey] = useState<SkillProfitSortKey>(DEFAULT_STATE.sortKey);
  const [sortDesc, setSortDesc] = useState(DEFAULT_STATE.sortDesc);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_STATE.searchTerm);
  const [minVolume, setMinVolume] = useState(DEFAULT_STATE.minVolume);
  const [poolExpDraft, setPoolExpDraft] = useState(String(DEFAULT_SETTINGS.energizingPoolExp));
  const [minVolumeDraft, setMinVolumeDraft] = useState(String(DEFAULT_STATE.minVolume));
  const [ascensionOpen, setAscensionOpen] = useState(DEFAULT_STATE.ascensionOpen);
  const [essenceOpen, setEssenceOpen] = useState(DEFAULT_STATE.essenceOpen);
  const [mobileSetupOpen, setMobileSetupOpen] = useState(false);
  const [compactResults, setCompactResults] = useState(false);
  const [visibleRowLimit, setVisibleRowLimit] = useState(MOBILE_RESULT_BATCH_SIZE);
  const [includeForgeInfoRows, setIncludeForgeInfoRows] = useState(false);
  const [loadedStoredState, setLoadedStoredState] = useState(false);
  const [gearData, setGearData] = useState<GearData | null>(null);
  const [selectedRow, setSelectedRow] = useState<SkillProfitRow | null>(null);
  const [activeDropdownLayer, setActiveDropdownLayer] = useState<DropdownLayer | null>(null);
  const loadedStorageKeyRef = useRef<string | null>(null);
  const setDropdownLayerOpen = useCallback((layer: DropdownLayer, open: boolean) => {
    setActiveDropdownLayer((current) => {
      if (open) return layer;
      return current === layer ? null : current;
    });
  }, []);
  const handleToolPickerOpenChange = useCallback((open: boolean) => {
    setDropdownLayerOpen("tools", open);
  }, [setDropdownLayerOpen]);
  const handleEssencePickerOpenChange = useCallback((open: boolean) => {
    setDropdownLayerOpen("essences", open);
  }, [setDropdownLayerOpen]);
  const handleCommandPickerOpenChange = useCallback((open: boolean) => {
    setDropdownLayerOpen("command", open);
  }, [setDropdownLayerOpen]);

  const activeProfileId = activeProfile?.id || null;
  const storageKey = useMemo(
    () => getProfileStorageKey(STORAGE_KEY, activeProfileId),
    [activeProfileId],
  );
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const effectiveToolSelections = useMemo(
    () => activeProfile
      ? {
          Woodcutting: activeProfile.tools.woodcutting ?? "",
          Mining: activeProfile.tools.mining ?? "",
          Fishing: activeProfile.tools.fishing ?? "",
        }
      : settings.tools,
    [activeProfile, settings.tools],
  );
  const displayedBarteringLevel = activeProfile
    ? activeProfile.boosts.barteringLevel
    : settings.barteringBoost === ""
      ? ""
      : Math.min(100, Math.max(0, Math.round((Number(settings.barteringBoost) || 0) / 0.2)));

  useEffect(() => {
    setPoolExpDraft(String(settings.energizingPoolExp));
  }, [settings.energizingPoolExp]);

  useEffect(() => {
    setMinVolumeDraft(String(minVolume));
  }, [minVolume]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const syncCompactResults = () => setCompactResults(media.matches);
    syncCompactResults();
    media.addEventListener("change", syncCompactResults);
    return () => media.removeEventListener("change", syncCompactResults);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded || !profilesLoaded || !loadedStoredState) return;
    const profileTools = activeProfile?.tools || {};
    const profileBarteringBoost = activeProfile ? getProfileBarteringBoost(activeProfile) : 0;
    const syncedTools = activeProfile
      ? {
          Woodcutting: profileTools.woodcutting ?? "",
          Mining: profileTools.mining ?? "",
          Fishing: profileTools.fishing ?? "",
        }
      : {
          ...DEFAULT_TOOL_SELECTIONS,
          ...preferences.skillTools,
        };
    setSettings((current) => ({
      ...current,
      membership: preferences.membership,
      classBonus: activeProfile ? false : preferences.skillClassBonus,
      profileClassName: activeProfile?.className || undefined,
      assaultRank: activeProfile ? getProfileConquestRank(activeProfile) : preferences.assaultRank,
      tools: syncedTools,
      customPrices: preferences.customPrices,
      barteringBoost: profileBarteringBoost,
    }));
  }, [
    activeProfile,
    activeProfile?.tools,
    loadedStoredState,
    preferences.assaultRank,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
    profilesLoaded,
    preferencesLoaded,
  ]);

  useEffect(() => {
    if (!profilesLoaded) return;
    loadedStorageKeyRef.current = null;
    setLoadedStoredState(false);
    setSettings(DEFAULT_STATE.settings);
    setActiveSkill(DEFAULT_STATE.activeSkill);
    setSortKey(DEFAULT_STATE.sortKey);
    setSortDesc(DEFAULT_STATE.sortDesc);
    setSearchTerm(DEFAULT_STATE.searchTerm);
    setMinVolume(DEFAULT_STATE.minVolume);
    setAscensionOpen(DEFAULT_STATE.ascensionOpen);
    setEssenceOpen(DEFAULT_STATE.essenceOpen);
    try {
      const stored = localStorage.getItem(storageKey) || (!activeProfileId ? localStorage.getItem(STORAGE_KEY) : null);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<PersistedState>;
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        tools: { ...DEFAULT_TOOL_SELECTIONS, ...parsed.settings?.tools },
        essenceBySkill: { ...DEFAULT_SETTINGS.essenceBySkill, ...parsed.settings?.essenceBySkill },
        customPrices: DEFAULT_SETTINGS.customPrices,
      });
      if (parsed.activeSkill) setActiveSkill(parsed.activeSkill);
      if (parsed.sortKey) setSortKey(parsed.sortKey === "roi" ? "profitEach" : parsed.sortKey);
      if (typeof parsed.sortDesc === "boolean") setSortDesc(parsed.sortDesc);
      if (typeof parsed.searchTerm === "string") setSearchTerm(parsed.searchTerm);
      if (typeof parsed.minVolume === "number") setMinVolume(parsed.minVolume);
      if (typeof parsed.ascensionOpen === "boolean") setAscensionOpen(parsed.ascensionOpen);
      if (typeof parsed.essenceOpen === "boolean") setEssenceOpen(parsed.essenceOpen);
    } catch {
    } finally {
      loadedStorageKeyRef.current = storageKey;
      setLoadedStoredState(true);
    }
  }, [activeProfileId, profilesLoaded, storageKey]);

  useEffect(() => {
    if (!profilesLoaded || !loadedStoredState) return;
    if (loadedStorageKeyRef.current !== storageKey) return;
    const payload: PersistedState = {
      settings,
      activeSkill,
      sortKey,
      sortDesc,
      searchTerm,
      minVolume,
      ascensionOpen,
      essenceOpen,
    };
    const timeout = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [activeSkill, ascensionOpen, essenceOpen, loadedStoredState, minVolume, profilesLoaded, searchTerm, settings, sortDesc, sortKey, storageKey]);

  useEffect(() => {
    fetch("/gear-data.json")
      .then((res) => (res.ok ? res.json() : null))
      .then(setGearData)
      .catch(() => {});
  }, []);

  const forgeRecipes = useMemo(
    () => buildForgeRecipes(gearData, itemRegistry as ItemRegistry | null),
    [gearData, itemRegistry],
  );
  const housingSummary = useMemo(
    () => calculateHousingBuffs(activeProfile?.housing, { profileClassName: activeProfile?.className }),
    [activeProfile?.className, activeProfile?.housing],
  );
  const rawHousingIdleHoursBySkill = useMemo(() => {
    const entries = SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      return [skill, activity ? Number(housingSummary.idleHours[activity] || 0) : 0] as const;
    });
    return Object.fromEntries(entries) as Partial<Record<SkillName, number>>;
  }, [housingSummary]);
  const hasAnyLocationLimitedHousing = housingSummary.locationLimited
    && Object.values(rawHousingIdleHoursBySkill).some((hours) => Number(hours || 0) > 0);
  const housingIdleHoursBySkill = useMemo(() => {
    const entries = SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      return [skill, activity ? getHousingIdleHoursForActivity(housingSummary, activity) : 0] as const;
    });
    return Object.fromEntries(entries) as Partial<Record<SkillName, number>>;
  }, [housingSummary]);
  const baseIdleActionHours = activeProfile ? getProfileBaseIdleActionHours(activeProfile) : 8;
  const idleActionHoursBySkill = useMemo(() => {
    const entries = SKILLS.map((skill) => [
      skill,
      baseIdleActionHours + Number(housingIdleHoursBySkill[skill] || 0),
    ] as const);
    return Object.fromEntries(entries) as Partial<Record<SkillName, number>>;
  }, [baseIdleActionHours, housingIdleHoursBySkill]);
  const essenceSessionsBySkill = useMemo(() => {
    const entries = SUPPORTED_ESSENCE_SKILLS.map((skill) => [
      skill,
      calculateEssenceSession({
        essenceName: settings.essenceBySkill?.[skill] || "",
        skill,
        items: allItemsDb,
        marketData,
        customPrices: preferences.customPrices,
        actionHours: idleActionHoursBySkill[skill] || baseIdleActionHours,
      }),
    ] as const);
    return Object.fromEntries(entries) as Partial<Record<EssenceSkillName, EssenceSession>>;
  }, [
    allItemsDb,
    baseIdleActionHours,
    idleActionHoursBySkill,
    marketData,
    preferences.customPrices,
    settings.essenceBySkill,
  ]);
  const essenceBuffsBySkill = useMemo(() => {
    const result: SkillProfitSettings["essenceBuffsBySkill"] = {};
    for (const skill of SUPPORTED_ESSENCE_SKILLS) {
      const buff = essenceSessionsBySkill[skill]?.buff;
      if (buff) result[skill] = buff;
    }
    return result;
  }, [essenceSessionsBySkill]);
  const essencePricesBySkill = useMemo(() => {
    const result: SkillProfitSettings["essencePricesBySkill"] = {};
    for (const skill of SUPPORTED_ESSENCE_SKILLS) {
      const price = essenceSessionsBySkill[skill]?.price;
      if (price) result[skill] = price;
    }
    return result;
  }, [essenceSessionsBySkill]);
  const activeEssenceCount = SUPPORTED_ESSENCE_SKILLS.filter((skill) => essenceSessionsBySkill[skill]?.active).length;
  const effectiveSettings = useMemo<SkillProfitSettings>(
    () => ({
      ...settings,
      tools: effectiveToolSelections,
      essenceBuffsBySkill,
      essencePricesBySkill,
      idleActionHoursBySkill,
    }),
    [
      effectiveToolSelections,
      essenceBuffsBySkill,
      essencePricesBySkill,
      idleActionHoursBySkill,
      settings,
    ],
  );
  const deferredSettings = useDeferredValue(effectiveSettings);

  const rows = useMemo(
    () => calculateSkillProfitRows(
      marketData,
      allItemsDb,
      { ...deferredSettings, housingIdleHoursBySkill },
      forgeRecipes,
      0,
    ),
    [marketData, allItemsDb, deferredSettings, forgeRecipes, housingIdleHoursBySkill],
  );

  const rowModel = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    const searchTokens = getSearchTokens(normalizedSearch);
    const topBySkill = new Map<SkillName, SkillProfitRow>();
    let topOverall: SkillProfitRow | null = null;

    for (const row of rows) {
      if (!isExcludedFromTop(row, minVolume)) {
        const currentSkillTop = topBySkill.get(row.skill);
        if (!currentSkillTop || getRankedProfitPerHour(row) > getRankedProfitPerHour(currentSkillTop)) {
          topBySkill.set(row.skill, row);
        }
        if (!topOverall || getRankedProfitPerHour(row) > getRankedProfitPerHour(topOverall)) {
          topOverall = row;
        }
      }
    }

    const filtered = rows
      .filter((row) => activeSkill === "All" || row.skill === activeSkill)
      .filter((row) => row.skill !== "Forge" || activeSkill === "Forge" || includeForgeInfoRows)
      .filter((row) => rowMatchesSearch(row, searchTokens))
      .sort((a, b) => {
        if (activeSkill === "All" && a.skill !== b.skill) {
          if (a.skill === "Forge") return 1;
          if (b.skill === "Forge") return -1;
        }
        const sortResult = getSortValue(a, sortKey) > getSortValue(b, sortKey)
          ? 1
          : getSortValue(a, sortKey) < getSortValue(b, sortKey)
            ? -1
            : a.name.localeCompare(b.name);
        return sortDesc ? -sortResult : sortResult;
      });

    const counts = new Map<SkillName, number>();
    for (const row of rows) counts.set(row.skill, (counts.get(row.skill) || 0) + 1);

    return { filtered, topBySkill, topOverall, counts };
  }, [activeSkill, deferredSearchTerm, includeForgeInfoRows, minVolume, rows, sortDesc, sortKey]);

  useEffect(() => {
    setVisibleRowLimit(MOBILE_RESULT_BATCH_SIZE);
  }, [activeSkill, deferredSearchTerm, includeForgeInfoRows, minVolume, sortDesc, sortKey]);

  const visibleRows = compactResults
    ? rowModel.filtered.slice(0, visibleRowLimit)
    : rowModel.filtered;
  const hiddenRowCount = Math.max(0, rowModel.filtered.length - visibleRows.length);
  const liquidRouteCount = useMemo(
    () => rowModel.filtered.filter((row) => row.skill !== "Forge" && isLiquid(row, minVolume)).length,
    [minVolume, rowModel.filtered],
  );
  const needsPriceCount = useMemo(
    () => rowModel.filtered.filter((row) => row.essenceActive && row.essenceNeedsPrice).length,
    [rowModel.filtered],
  );
  const routeFilterCount = [
    deferredSearchTerm.trim().length > 0,
    activeSkill !== "All",
    minVolume !== DEFAULT_STATE.minVolume,
    includeForgeInfoRows,
    sortKey !== DEFAULT_STATE.sortKey || sortDesc !== DEFAULT_STATE.sortDesc,
    (settings.saleMode || "best") !== DEFAULT_SETTINGS.saleMode,
  ].filter(Boolean).length;

  const buffTotals = useMemo(
    () => getBuffTotals(effectiveSettings, activeSkill !== "Construction", activeSkill),
    [activeSkill, effectiveSettings],
  );
  const housingWindowHours = activeSkill !== "All" ? Number(housingIdleHoursBySkill[activeSkill] || 0) : 0;
  const rawHousingWindowHours = activeSkill !== "All" ? Number(rawHousingIdleHoursBySkill[activeSkill] || 0) : 0;
  const hasLocationLimitedHousing = housingSummary.locationLimited && rawHousingWindowHours > 0 && housingWindowHours <= 0;
  const appliedHousingWindows = useMemo(() => (
    SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      const hours = Number(housingIdleHoursBySkill[skill] || 0);
      return {
        skill,
        label: activity ? getHousingActivityLabel(activity) : skill,
        hours,
      };
    })
      .filter((entry) => entry.hours > 0)
      .sort((a, b) => b.hours - a.hours || a.label.localeCompare(b.label))
  ), [housingIdleHoursBySkill]);
  const rawHousingWindows = useMemo(() => (
    SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      const hours = Number(rawHousingIdleHoursBySkill[skill] || 0);
      return {
        skill,
        label: activity ? getHousingActivityLabel(activity) : skill,
        hours,
      };
    })
      .filter((entry) => entry.hours > 0)
      .sort((a, b) => b.hours - a.hours || a.label.localeCompare(b.label))
  ), [rawHousingIdleHoursBySkill]);
  const visibleHousingWindows = appliedHousingWindows.length ? appliedHousingWindows : rawHousingWindows;
  const housingWindowSummary = visibleHousingWindows
    .slice(0, 3)
    .map((entry) => `${entry.label} +${formatHours(entry.hours)}`)
    .join(", ");
  const housingWindowExtraCount = Math.max(0, visibleHousingWindows.length - 3);
  const housingWindowAllValue = !activeProfile
    ? "Profile needed"
    : visibleHousingWindows.length === 0
      ? "None"
      : visibleHousingWindows.length === 1
        ? `${visibleHousingWindows[0].label} +${formatHours(visibleHousingWindows[0].hours)}`
        : `${visibleHousingWindows.length} housing buffs`;
  const housingWindowAllScope = visibleHousingWindows.length === 0
    ? ""
    : appliedHousingWindows.length
      ? housingSummary.mode === "guest"
        ? " - guest remote, available anywhere"
        : housingSummary.availableAnywhere
          ? " - available anywhere"
          : ""
      : housingSummary.mode === "guest"
        ? " - guest local, not applied"
        : " - location-limited, not applied";
  const housingWindowAllSub = !activeProfile
    ? "load a profile"
    : visibleHousingWindows.length === 0
      ? "no profile bonus"
      : `${housingWindowSummary}${housingWindowExtraCount ? `, +${housingWindowExtraCount} more` : ""}${housingWindowAllScope}`;
  const activeSkillActivity = activeSkill !== "All" ? SKILL_TO_HOUSING_ACTIVITY[activeSkill] : undefined;
  const activeSkillHousingLabel = activeSkillActivity
    ? getHousingActivityLabel(activeSkillActivity)
    : activeSkill !== "All" ? activeSkill : "";
  const activeSkillHousingHours = activeSkill !== "All"
    ? housingWindowHours || (hasLocationLimitedHousing ? rawHousingWindowHours : 0)
    : 0;
  const housingWindowSub = !activeProfile
    ? "profile needed"
    : hasLocationLimitedHousing
      ? housingSummary.mode === "guest" ? "guest local, not applied" : "location-limited, not applied"
      : housingWindowHours <= 0
        ? "no profile bonus"
      : housingSummary.mode === "guest"
        ? "guest remote, available anywhere"
        : housingSummary.availableAnywhere
        ? "available anywhere"
        : "location-limited";
  const lastUpdated = marketData?._meta?.last_updated;
  const marketAgeMinutes = lastUpdated
    ? Math.max(0, Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000))
    : null;

  const selectedBuffs = useMemo(
    () => settings.ascensionBuffIds
      .map((id) => ASCENSION_BUFFS.find((buff) => buff.id === id))
      .filter((buff): buff is (typeof ASCENSION_BUFFS)[number] => Boolean(buff)),
    [settings.ascensionBuffIds],
  );

  const groupedBuffs = useMemo(() => ({
    Eff: ASCENSION_BUFFS.filter((buff) => buff.type === "Eff"),
    Exp: ASCENSION_BUFFS.filter((buff) => buff.type === "Exp"),
  }), []);

  useEffect(() => {
    if (!selectedRow) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRow(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRow]);

  const patchSettings = (patch: Partial<SkillProfitSettings>) => {
    setSettings((current) => ({
      ...current,
      ...patch,
      tools: { ...current.tools, ...patch.tools },
      essenceBySkill: { ...current.essenceBySkill, ...patch.essenceBySkill },
    }));
    if (activeProfile && (patch.assaultRank || patch.barteringBoost !== undefined)) {
      updateProfile(activeProfile.id, {
        boosts: {
          ...activeProfile.boosts,
          ...(patch.assaultRank ? { conquestRank: patch.assaultRank } : {}),
          ...(patch.barteringBoost !== undefined ? { barteringLevel: Math.min(100, Math.max(0, Math.round((Number(patch.barteringBoost) || 0) / 0.2))) } : {}),
        },
      });
    }
    if ("membership" in patch || "classBonus" in patch || (!activeProfile && "tools" in patch) || "customPrices" in patch) {
      setPreferences({
        ...(typeof patch.membership === "boolean" ? { membership: patch.membership } : {}),
        ...(!activeProfile && typeof patch.classBonus === "boolean" ? { skillClassBonus: patch.classBonus } : {}),
        ...(!activeProfile && patch.tools ? { skillTools: { ...preferences.skillTools, ...patch.tools } } : {}),
        ...(patch.customPrices ? { customPrices: patch.customPrices } : {}),
      });
    }
  };

  const patchTool = (skill: ToolSkill, toolName: string) => {
    if (activeProfile) {
      const profileToolKey = skill === "Woodcutting" ? "woodcutting" : skill === "Mining" ? "mining" : "fishing";
      updateProfile(activeProfile.id, { tools: { ...activeProfile.tools, [profileToolKey]: toolName } });
    }
    patchSettings({ tools: { ...settings.tools, [skill]: toolName } });
  };

  const patchEssence = (skill: EssenceSkillName, essenceName: string) => {
    patchSettings({ essenceBySkill: { [skill]: essenceName } });
  };

  const resetRouteFilters = () => {
    setSearchTerm("");
    setActiveSkill(DEFAULT_STATE.activeSkill);
    setMinVolume(DEFAULT_STATE.minVolume);
    setMinVolumeDraft(String(DEFAULT_STATE.minVolume));
    setSortKey(DEFAULT_STATE.sortKey);
    setSortDesc(DEFAULT_STATE.sortDesc);
    setIncludeForgeInfoRows(false);
    patchSettings({ saleMode: DEFAULT_SETTINGS.saleMode });
  };

  const toggleAscension = (id: string) => {
    setSettings((current) => {
      const isSelected = current.ascensionBuffIds.includes(id);
      if (isSelected) {
        return { ...current, ascensionBuffIds: current.ascensionBuffIds.filter((buffId) => buffId !== id) };
      }
      if (current.ascensionBuffIds.length >= 5) return current;
      return { ...current, ascensionBuffIds: [...current.ascensionBuffIds, id] };
    });
  };

  const handleSort = (key: SkillProfitSortKey) => {
    if (sortKey === key) {
      setSortDesc((current) => !current);
      return;
    }
    setSortKey(key);
    setSortDesc(key !== "name" && key !== "skill" && key !== "level" && key !== "finalDuration" && key !== "inputCost");
  };

  const topRoute = rowModel.topOverall;
  const saleModeLabel = SALE_MODE_OPTIONS.find((option) => option.value === (settings.saleMode || "best"))?.label || "Auto";
  const scopeLabel = activeSkill === "All" ? "All skills" : activeSkill;
  const profileLabel = activeProfile ? `${activeProfile.name || "Active profile"} synced` : "Global fallback";

  return (
    <main className={`container ${styles.shell} ${mobileSetupOpen ? styles.mobileSetupOpen : styles.mobileSetupCollapsed}`} aria-label="Skill Profit Finder">
      <section className={styles.hero}>
        <div className={styles.heroIntro}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>Skill Profit Finder</div>
            <h1 className={styles.title}>
              Live Skill Profit <ZenithIcon name="skill" size={22} />
            </h1>
            <p className={styles.heroSubtitle}>
              Compare market returns, vendor fallback, tools, buffs, housing windows, and essence costs in one route board.
            </p>
          </div>
          <div className={styles.heroChips} aria-label="Current skill profit context">
            <span>{profileLabel}</span>
            <span>{scopeLabel}</span>
            <span>{saleModeLabel} sell</span>
          </div>
        </div>
        <button
          aria-label={topRoute ? `Open best liquid route ${topRoute.name}` : "Best liquid route is waiting for data"}
          className={styles.spotlightCard}
          disabled={!topRoute}
          onClick={() => topRoute && setSelectedRow(topRoute)}
          onMouseEnter={() => topRoute && prefetchItem(topRoute.name)}
          type="button"
        >
          <span className={styles.spotlightLabel}>Best liquid route</span>
          <strong>{topRoute?.name || "Waiting for data"}</strong>
          <small>{topRoute ? `${topRoute.skill} Lvl ${topRoute.level} - ${getProfitSummary(topRoute)}` : "Market data is loading"}</small>
          <span className={styles.spotlightMetrics}>
            <span>
              <em>Profit</em>
              <strong>{topRoute ? getProfitCardValue(topRoute) : "0g/hr"}</strong>
            </span>
            <span>
              <em>Cost</em>
              <strong>{topRoute ? `${formatGold(topRoute.inputCost)}g` : "0g"}</strong>
            </span>
            <span>
              <em>Volume</em>
              <strong>{topRoute ? topRoute.stableVolume3d.toLocaleString() : "0"}</strong>
            </span>
          </span>
        </button>
        <div className={styles.heroStats}>
          <Metric label="Market pulse" value={marketAgeMinutes === null ? "Waiting" : marketAgeMinutes < 1 ? "Fresh" : `${marketAgeMinutes}m`} sub={`${rows.length.toLocaleString()} rows`} />
          <Metric label="Buffs" value={`+${buffTotals.efficiency}% eff / +${buffTotals.experience}% exp`} sub={activeSkill === "Construction" ? "ascension ignored" : "active total"} />
          <Metric
            label="Housing window"
            value={activeSkill === "All"
              ? housingWindowAllValue
              : activeSkillHousingHours > 0 ? `${activeSkillHousingLabel} +${formatHours(activeSkillHousingHours)}` : "None"}
            sub={activeSkill === "All"
              ? housingWindowAllSub
              : housingWindowSub}
          />
          <Metric label="Results" value={rowModel.filtered.length.toLocaleString()} sub={`${scopeLabel} routes`} />
        </div>
      </section>

      <section className={styles.overviewGrid}>
        {SKILLS.map((skill) => {
          const top = rowModel.topBySkill.get(skill);
          return (
            <button
              aria-pressed={activeSkill === skill}
              className={`${styles.skillCard} ${activeSkill === skill ? styles.skillCardActive : ""}`}
              key={skill}
              onClick={() => setActiveSkill(skill)}
              title={skill === "Forge" ? `${forgeRecipes.length} forge recipes loaded for display only` : top ? `${top.name}: ${getProfitSummary(top)}` : "No liquid route"}
              type="button"
            >
              <div className={styles.skillCardTop}>
                <span>{skill}</span>
                <span>{(rowModel.counts.get(skill) || 0).toLocaleString()}</span>
              </div>
              <div className={styles.skillCardBody}>
                <span>{skill === "Forge" ? "Info only" : top?.name || "No liquid route"}</span>
                <strong>{skill === "Forge" ? `${forgeRecipes.length} recipes` : top ? getProfitCardValue(top) : "0g/hr"}</strong>
              </div>
            </button>
          );
        })}
      </section>
      <div className={styles.forgeHandoff}>
        <span>Forge recipes are informational here and hidden from All results by default.</span>
        <a href="/forge">Open Forge Planner</a>
      </div>

      <section className={`${styles.commandBar} ${activeDropdownLayer === "command" ? styles.dropdownLayerActive : ""}`}>
        <div className={styles.filterRow} aria-label="Skill profit route filters">
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              aria-label="Search skill profit items"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search item or material"
              spellCheck={false}
            />
            {searchTerm.trim().length > 0 && (
              <button
                aria-label="Clear skill profit search"
                className={styles.searchClear}
                onClick={() => setSearchTerm("")}
                type="button"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className={`${styles.numberField} ${styles.conquestField}`}>
            <span>Conquest</span>
            <OptionPicker
              options={CONQUEST_PICKER_OPTIONS}
              value={settings.assaultRank}
              onChange={(value) => patchSettings({ assaultRank: value as AssaultRank })}
              onOpenChange={handleCommandPickerOpenChange}
            />
          </div>
          <label className={styles.numberField}>
            <span>Pool EXP</span>
            <input
              aria-label="Energizing pool EXP bonus"
              type="number"
              min={0}
              max={15}
              value={poolExpDraft}
              placeholder="0"
              onChange={(event) => {
                const rawValue = event.target.value;
                setPoolExpDraft(rawValue);
                if (rawValue === "") return;
                patchSettings({ energizingPoolExp: Math.min(15, Math.max(0, Number(rawValue) || 0)) });
              }}
              onBlur={() => {
                if (poolExpDraft === "") {
                  patchSettings({ energizingPoolExp: 0 });
                  setPoolExpDraft("0");
                }
              }}
            />
          </label>
          <label className={styles.numberField}>
            <span>Bartering Level</span>
            <input
              aria-label="Bartering Level"
              type="number"
              min={0}
              max={100}
              value={displayedBarteringLevel}
              placeholder="0"
              onChange={(event) => {
                const level = event.target.value === "" ? "" : Math.min(100, Math.max(0, Number(event.target.value) || 0));
                if (activeProfile) {
                  updateProfile(activeProfile.id, { boosts: { ...activeProfile.boosts, barteringLevel: level } });
                } else {
                  patchSettings({ barteringBoost: level === "" ? "" : barteringBuffPercent(level) });
                }
              }}
            />
          </label>
          <label className={styles.numberField}>
            <span>Min Vol</span>
            <input
              aria-label="Minimum stable volume"
              type="number"
              min={0}
              value={minVolumeDraft}
              placeholder="0"
              onChange={(event) => {
                const rawValue = event.target.value;
                setMinVolumeDraft(rawValue);
                if (rawValue === "") return;
                setMinVolume(Math.max(0, Number(rawValue) || 0));
              }}
              onBlur={() => {
                if (minVolumeDraft === "") {
                  setMinVolume(0);
                  setMinVolumeDraft("0");
                }
              }}
            />
          </label>
          <div className={styles.saleModeField}>
            <span>Sell mode</span>
            <div className={styles.segmentGroup} role="group" aria-label="Skill profit sell mode">
              {SALE_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  aria-pressed={(settings.saleMode || "best") === option.value}
                  className={`${styles.segmentButton} ${(settings.saleMode || "best") === option.value ? styles.segmentActive : ""}`}
                  onClick={() => patchSettings({ saleMode: option.value })}
                  title={option.hint}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.toggleRow} aria-label="Skill profit route toggles">
          <button
            className={`${styles.toggle} ${settings.membership ? styles.toggleActive : ""}`}
            onClick={() => patchSettings({ membership: !settings.membership })}
            type="button"
          >
            {settings.membership && <Check size={14} />} Member
          </button>
          <button
            className={`${styles.toggle} ${(activeProfile ? settings.profileClassName : settings.classBonus) ? styles.toggleActive : ""}`}
            onClick={() => {
              if (!activeProfile) patchSettings({ classBonus: !settings.classBonus });
            }}
            disabled={Boolean(activeProfile)}
            title={activeProfile ? `Using ${activeProfile.className} from active profile` : "Fallback class helper when no profile is active"}
            type="button"
          >
            {(activeProfile ? settings.profileClassName : settings.classBonus) && <Check size={14} />} {activeProfile ? activeProfile.className : "Class"}
          </button>
          <div className={`${styles.taxPill} ${settings.membership ? styles.taxMember : ""}`}>
            {settings.membership ? "12% tax" : "15% tax"}
          </div>
          <button
            aria-pressed={includeForgeInfoRows}
            className={`${styles.toggle} ${includeForgeInfoRows ? styles.toggleActive : ""}`}
            onClick={() => setIncludeForgeInfoRows((current) => !current)}
            title="Show Forge informational recipes in the All results table. The Forge tab always stays available."
            type="button"
          >
            {includeForgeInfoRows && <Check size={14} />} Forge rows
          </button>
        </div>
        <div className={styles.commandStatus} aria-live="polite">
          <div className={styles.commandStat}>
            <span>Showing</span>
            <strong>{rowModel.filtered.length.toLocaleString()} / {rows.length.toLocaleString()}</strong>
          </div>
          <div className={styles.commandStat}>
            <span>Liquid</span>
            <strong>{liquidRouteCount.toLocaleString()} routes</strong>
          </div>
          <div className={`${styles.commandStat} ${needsPriceCount > 0 ? styles.commandStatWarning : ""}`}>
            <span>Needs data</span>
            <strong>{needsPriceCount > 0 ? `${needsPriceCount.toLocaleString()} routes` : "Clear"}</strong>
          </div>
          <div className={styles.commandStat}>
            <span>Sort</span>
            <strong>{SORT_LABELS[sortKey]} {sortDesc ? "desc" : "asc"}</strong>
          </div>
          <button
            className={styles.resetFilters}
            disabled={routeFilterCount === 0}
            onClick={resetRouteFilters}
            type="button"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </section>

      <section className={styles.mobileSetupSummary} aria-label="Profile and buff setup summary">
        <div>
          <strong>Profile and buffs</strong>
          <span>
            {activeProfile ? `${activeProfile.name || "Active profile"} synced` : "Global fallback"}
            {" - "}
            {activeEssenceCount > 0 ? `${activeEssenceCount} essence${activeEssenceCount === 1 ? "" : "s"}` : "No essences"}
            {" - "}
            {selectedBuffs.length}/5 ascension
          </span>
        </div>
        <button
          type="button"
          aria-expanded={mobileSetupOpen}
          onClick={() => setMobileSetupOpen((open) => !open)}
        >
          {mobileSetupOpen ? "Hide setup" : "Edit setup"}
          <ChevronDown size={16} className={mobileSetupOpen ? styles.chevronOpen : ""} />
        </button>
      </section>

      <div className={styles.setupGrid}>
        <section className={`${styles.toolPanel} ${activeDropdownLayer === "tools" ? styles.dropdownLayerActive : ""}`}>
          {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => {
            const toolValue = effectiveToolSelections[skill] || "";
            const selectedTool = SKILL_TOOLS[skill].find((tool) => tool.name === toolValue);
            return (
              <div className={styles.toolField} key={skill}>
                <span>{skill} tool</span>
                <ToolPicker
                  options={SKILL_TOOLS[skill]}
                  value={toolValue}
                  onChange={(toolName) => patchTool(skill, toolName)}
                  onOpenChange={handleToolPickerOpenChange}
                />
                <small>
                  {selectedTool ? (
                    <>
                      Lvl {selectedTool.level} - <QualityText value={selectedTool.quality}>{selectedTool.quality}</QualityText>
                    </>
                  ) : activeProfile
                      ? "No tool selected"
                      : "No tool bonus"}
                  {activeProfile ? " - synced with profile" : " - global fallback"}
                </small>
              </div>
            );
          })}
        </section>

        <section className={`${styles.essencePanel} ${activeDropdownLayer === "essences" ? styles.dropdownLayerActive : ""}`}>
          <button className={styles.essenceHeader} onClick={() => setEssenceOpen((open) => !open)} type="button">
            <span><Sparkles size={16} /> Essences</span>
            <span>
              {activeEssenceCount > 0 ? `${activeEssenceCount}/5 active` : "No essence"}
              <ChevronDown size={16} className={essenceOpen ? styles.chevronOpen : ""} />
            </span>
          </button>
          {essenceOpen && (
            <div className={styles.essenceGrid}>
              {SUPPORTED_ESSENCE_SKILLS.map((skill) => {
                const selectedName = settings.essenceBySkill?.[skill] || "";
                const session = essenceSessionsBySkill[skill];
                const actionHours = idleActionHoursBySkill[skill] || baseIdleActionHours;
                return (
                  <div className={styles.essenceField} key={skill}>
                    <span>{skill}</span>
                    <EssencePicker
                      label={`${skill} essence`}
                      options={getEssenceOptionsForSkill(skill, allItemsDb, marketData, preferences.customPrices)}
                      value={selectedName}
                      onChange={(essenceName) => patchEssence(skill, essenceName)}
                      onOpenChange={handleEssencePickerOpenChange}
                    />
                    <small>
                      {session?.active
                        ? session.needsPrice
                          ? "Needs price/data"
                          : `${formatGold(session.costPerStart)}g per start - ${formatGold(session.costPerHour || 0)}g/hr`
                        : `No essence - ${formatHours(actionHours)} timer`}
                    </small>
                  </div>
                );
              })}
            </div>
          )}
          <p className={styles.essenceNote}>
            {(activeProfile
              ? `Cost is counted once per idle start. The timer is ${formatHours(baseIdleActionHours)} base${hasAnyLocationLimitedHousing ? "; location-limited housing time is not added on this page." : ", plus housing time when it is available anywhere."}`
              : "No active profile is loaded, so essence costs use an 8h fallback timer.")}
            {" "}Dungeon, combat, hunting, and world boss potions are future support.
          </p>
        </section>

        <section className={styles.ascensionPanel}>
          <button className={styles.ascensionHeader} onClick={() => setAscensionOpen((open) => !open)} type="button">
            <span><Sparkles size={16} /> Ascension</span>
            <span>{selectedBuffs.length}/5 <ChevronDown size={16} className={ascensionOpen ? styles.chevronOpen : ""} /></span>
          </button>
          <div className={styles.selectedBuffs}>
            {Array.from({ length: 5 }).map((_, index) => {
              const buff = selectedBuffs[index];
              return (
                <button
                  key={index}
                  className={`${styles.selectedSlot} ${buff ? styles.selectedSlotFilled : ""}`}
                  onClick={() => buff && toggleAscension(buff.id)}
                  title={buff ? `${buff.label}: +${buff.value}% ${buff.type === "Eff" ? "efficiency" : "experience"}` : "Empty ascension slot"}
                  type="button"
                >
                  {buff ? `${buff.label.replace("Lvl ", "L")} +${buff.value}% ${buff.type}` : "Empty"}
                </button>
              );
            })}
            {selectedBuffs.length > 0 && (
              <button className={styles.clearBuffs} onClick={() => patchSettings({ ascensionBuffIds: [] })} type="button">
                Clear
              </button>
            )}
          </div>
          {ascensionOpen && (
            <div className={styles.buffGroups}>
              {(["Eff", "Exp"] as const).map((type) => (
                <div className={styles.buffGroup} key={type}>
                  <div className={styles.buffGroupTitle}>{type === "Eff" ? "Efficiency" : "Experience"}</div>
                  <div className={styles.buffRail}>
                    {groupedBuffs[type].map((buff) => {
                      const selected = settings.ascensionBuffIds.includes(buff.id);
                      const disabled = !selected && settings.ascensionBuffIds.length >= 5;
                      return (
                        <button
                          key={buff.id}
                          className={`${styles.buffButton} ${selected ? styles.buffSelected : ""}`}
                          disabled={disabled}
                          onClick={() => toggleAscension(buff.id)}
                          type="button"
                        >
                          {buff.label.replace("Lvl ", "")}
                          <strong>+{buff.value}%</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={styles.tableHeader}>
        <div className={styles.tabRow}>
          {(["All", ...SKILLS] as const).map((skill) => (
            <button
              key={skill}
              aria-pressed={activeSkill === skill}
              className={`${styles.tab} ${activeSkill === skill ? styles.tabActive : ""}`}
              onClick={() => setActiveSkill(skill)}
              type="button"
            >
              {skill}
            </button>
          ))}
        </div>
        <div className={styles.panelMeta}>
          <Filter size={13} /> {rowModel.filtered.length.toLocaleString()} rows
        </div>
      </section>

      <section className={styles.mobileResults} aria-label="Skill profit routes">
        {visibleRows.map((row) => {
          const displayProfit = getDisplayProfitPerHour(row);
          const matchedIngredient = getMatchedIngredient(row, deferredSearchTerm);
          const liquidityText = row.skill === "Forge"
            ? "Info"
            : row.liquidityRisk
              ? row.liquidityLabel === "Spike risk" ? "Spike risk" : "Volume risk"
              : row.priceSwingRisk
                ? "Price risk"
                : isLiquid(row, minVolume) ? "Liquid" : "Thin";
          return (
            <button
              aria-label={`Open ${row.name} ${row.skill} strategy`}
              className={styles.mobileResultCard}
              key={`mobile-${row.skill}-${row.name}`}
              onClick={() => setSelectedRow(row)}
              onMouseEnter={() => prefetchItem(row.name)}
              type="button"
            >
              <span className={styles.mobileResultTop}>
                <span>{row.skill} Lvl {row.level}</span>
                <span className={`${styles.saleBadge} ${row.bestSaleSource === "vendor" ? styles.saleVendor : row.bestSaleSource === "custom" ? styles.saleCustom : styles.saleMarket}`}>
                  {row.bestSaleSource}
                </span>
              </span>
              <strong>{row.name}</strong>
              <span className={styles.mobileResultProfit}>
                <span className={displayProfit === null ? styles.mutedValue : getRankedProfitPerHour(row) >= 0 ? styles.positive : styles.negative}>
                  {getProfitCellValue(row)}
                </span>
                <small>{row.essenceActive && row.essenceNeedsPrice ? `${formatGold(row.baseProfitPerHour)}g/hr base` : `${row.itemsPerHour.toLocaleString()} actions/hr`}</small>
              </span>
              <span className={styles.mobileResultGrid}>
                <span><em>Each</em>{formatSignedGold(row.profitEach)}</span>
                <span><em>Cost</em>{formatGold(row.inputCost)}g</span>
                <span><em>Volume</em>{row.stableVolume3d.toLocaleString()}</span>
                <span><em>Status</em>{liquidityText}</span>
              </span>
              {(row.note || matchedIngredient) && (
                <small className={styles.mobileResultNote}>
                  {matchedIngredient ? `Uses ${matchedIngredient}` : row.note}
                </small>
              )}
            </button>
          );
        })}
        {hiddenRowCount > 0 && (
          <div className={styles.resultBatchMore} role="status">
            <span>
              Showing {visibleRows.length.toLocaleString()} of {rowModel.filtered.length.toLocaleString()} routes.
            </span>
            <button
              type="button"
              onClick={() => setVisibleRowLimit((limit) => limit + MOBILE_RESULT_BATCH_SIZE)}
            >
              Show {Math.min(MOBILE_RESULT_BATCH_SIZE, hiddenRowCount).toLocaleString()} more
            </button>
          </div>
        )}
        {rowModel.filtered.length === 0 && (
          <div className={styles.emptyRoutes} role="status">
            <strong>No routes match this search</strong>
            <span>Try an item name, skill, material, essence, sale source, or liquidity label.</span>
            <button
              onClick={resetRouteFilters}
              type="button"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      <section className={styles.tableWrap} aria-label="Skill profit route results table" role="region" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <SortableTh sortKey="name" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} align="left" />
              <SortableTh sortKey="skill" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="level" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="profitPerHour" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="profitEach" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="inputCost" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="volume3d" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <th>Sell</th>
              <th>Liquidity</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const matchedIngredient = getMatchedIngredient(row, deferredSearchTerm);
              return (
                <tr
                  aria-label={`Open ${row.name} skill strategy`}
                  key={`${row.skill}-${row.name}`}
                  onClick={() => setSelectedRow(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedRow(row);
                    }
                  }}
                  tabIndex={0}
                >
                  <td className="left-align">
                    <div className={styles.nameCell}>
                      <button
                        className={styles.itemButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedRow(row);
                        }}
                        onMouseEnter={() => prefetchItem(row.name)}
                        type="button"
                      >
                        <PackageSearch size={14} />
                        {row.name}
                      </button>
                      <span className={styles.itemMeta}>
                        {row.note || `Return ${formatGold(row.netRevenue)}g - cost ${formatGold(row.inputCost)}g`}
                      </span>
                      {matchedIngredient && (
                        <span className={styles.materialMatchHint}>Uses {matchedIngredient}</span>
                      )}
                    </div>
                  </td>
                  <td>{row.skill}</td>
                  <td className="mono">{row.level}</td>
                  <td className={`mono ${getDisplayProfitPerHour(row) === null ? styles.mutedValue : getRankedProfitPerHour(row) >= 0 ? styles.positive : styles.negative}`}>
                    <div className={styles.profitCell}>
                      <strong>{getProfitCellValue(row)}</strong>
                      {row.essenceActive && (
                        <span>{row.essenceNeedsPrice ? `${formatGold(row.baseProfitPerHour)}g/hr base` : "with essence"}</span>
                      )}
                    </div>
                  </td>
                  <td className={`mono ${row.profitEach >= 0 ? styles.positive : styles.negative}`}>{formatSignedGold(row.profitEach)}</td>
                  <td className="mono">{formatGold(row.inputCost)}g</td>
                  <td className="mono" title={row.stableVolume3d !== row.volume3d ? `Raw 3-day volume: ${row.volume3d.toLocaleString()}` : undefined}>
                    {row.stableVolume3d.toLocaleString()}
                  </td>
                  <td>
                    <span className={`${styles.saleBadge} ${row.bestSaleSource === "vendor" ? styles.saleVendor : row.bestSaleSource === "custom" ? styles.saleCustom : styles.saleMarket}`}>
                      {row.bestSaleSource}
                    </span>
                  </td>
                  <td>
                    {row.skill === "Forge" ? (
                      <span className={`${styles.liquidityBadge} ${styles.liquidityInfo}`}><Info size={12} /> Info</span>
                    ) : row.liquidityRisk ? (
                      <>
                        <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`} title={row.liquidityNote}>
                          <Eye size={12} /> {row.liquidityLabel === "Spike risk" ? "Spike" : "Volume"}
                        </span>
                        {row.priceSwingRisk && (
                          <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`} title={row.priceSwingNote}>
                            <Eye size={12} /> Price
                          </span>
                        )}
                      </>
                    ) : row.priceSwingRisk ? (
                      <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`} title={row.priceSwingNote}>
                        <Eye size={12} /> Price
                      </span>
                    ) : isLiquid(row, minVolume) ? (
                      <span className={`${styles.liquidityBadge} ${styles.liquidityGood}`}><BarChart3 size={12} /> Liquid</span>
                    ) : (
                      <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`}><Eye size={12} /> Thin</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {hiddenRowCount > 0 && (
              <tr>
                <td colSpan={9}>
                  <div className={styles.resultBatchMore} role="status">
                    <span>
                      Showing {visibleRows.length.toLocaleString()} of {rowModel.filtered.length.toLocaleString()} routes on mobile.
                    </span>
                    <button
                      type="button"
                      onClick={() => setVisibleRowLimit((limit) => limit + MOBILE_RESULT_BATCH_SIZE)}
                    >
                      Show {Math.min(MOBILE_RESULT_BATCH_SIZE, hiddenRowCount).toLocaleString()} more
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {rowModel.filtered.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className={styles.emptyRoutes} role="status">
                    <strong>No routes match this search</strong>
                    <span>Try an item name, skill, material, essence, sale source, or liquidity label.</span>
                    <button
                      onClick={resetRouteFilters}
                      type="button"
                    >
                      Reset filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selectedRow && (
        <SkillStrategyModal
          row={selectedRow}
          settings={{ ...effectiveSettings, housingIdleHoursBySkill }}
          membership={settings.membership}
          onClose={() => setSelectedRow(null)}
          onOpenItem={(name) => {
            setSelectedRow(null);
            openItemByName(name);
          }}
        />
      )}
    </main>
  );
}

function SortableTh({
  sortKey,
  activeKey,
  sortDesc,
  onSort,
  align,
}: {
  sortKey: SkillProfitSortKey;
  activeKey: SkillProfitSortKey;
  sortDesc: boolean;
  onSort: (key: SkillProfitSortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === activeKey;
  const directionLabel = active ? (sortDesc ? "descending" : "ascending") : "not sorted";
  return (
    <th
      aria-sort={active ? (sortDesc ? "descending" : "ascending") : "none"}
      className={align === "left" ? styles.sortHeaderLeft : undefined}
    >
      <button
        aria-label={`Sort by ${SORT_LABELS[sortKey]}, currently ${directionLabel}`}
        className={styles.sortButton}
        onClick={() => onSort(sortKey)}
        type="button"
      >
        {SORT_LABELS[sortKey]}
        <span aria-hidden="true" className={styles.sortIndicator}>
          {active ? (sortDesc ? <ArrowDown size={13} /> : <ArrowUp size={13} />) : <ArrowDownUp size={13} />}
        </span>
        <span className={styles.srOnly}>{directionLabel}</span>
      </button>
    </th>
  );
}

function usePickerOpen(onOpenChange?: (open: boolean) => void) {
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  }, [onOpenChange]);

  useEffect(() => () => onOpenChange?.(false), [onOpenChange]);

  return [open, setOpen] as const;
}

function OptionPicker<T extends string>({
  options,
  value,
  onChange,
  onOpenChange,
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T;
  onChange: (value: T) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0] || null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className={`${styles.compactPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.compactTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span>
          <strong>{selected?.label || "Select"}</strong>
          <small>{selected?.hint || "Profile buff"}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={`${styles.toolMenu} ${styles.compactMenu}`} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`${styles.compactOption} ${option.value === value ? styles.toolOptionActive : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>
                <strong>{option.label}</strong>
                <small>{option.hint || "Conquest buff"}</small>
              </span>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
          <button className={styles.toolClose} onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function ToolPicker({
  options,
  value,
  onChange,
  onOpenChange,
}: {
  options: typeof SKILL_TOOLS[ToolSkill];
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.name === value) || null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className={`${styles.toolPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.toolTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span>
          <strong>{selected?.name || "No tool selected"}</strong>
          <small>{selected ? `+${selected.efficiency}% efficiency` : "No tool bonus"}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.toolMenu} role="listbox">
          <button
            aria-selected={!value}
            className={`${styles.toolOption} ${!value ? styles.toolOptionActive : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            role="option"
            type="button"
          >
            <span>
              <strong>No tool selected</strong>
              <small>Use no tool bonus for this profile</small>
            </span>
            <em>+0%</em>
            {!value && <Check size={15} />}
          </button>
          {options.map((option) => (
            <button
              aria-selected={option.name === value}
              className={`${styles.toolOption} ${option.name === value ? styles.toolOptionActive : ""}`}
              key={option.name}
              onClick={() => {
                onChange(option.name);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>
                <strong>{option.name}</strong>
                <small>Lvl {option.level} - <QualityText value={option.quality}>{option.quality}</QualityText></small>
              </span>
              <em>+{option.efficiency}%</em>
              {option.name === value && <Check size={15} />}
            </button>
          ))}
          <button className={styles.toolClose} onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function EssencePicker({
  label,
  options,
  value,
  onChange,
  onOpenChange,
}: {
  label: string;
  options: ReturnType<typeof getEssenceOptionsForSkill>;
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className={`${styles.toolPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={styles.toolTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span>
          <strong>{selected?.label || "No essence"}</strong>
          <small>{selected ? formatEssenceBuff(selected.buff) : "No crystal cost or boost"}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.toolMenu} role="listbox" aria-label={label}>
          <button
            aria-selected={!value}
            className={`${styles.toolOption} ${!value ? styles.toolOptionActive : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            role="option"
            type="button"
          >
            <span>
              <strong>No essence</strong>
              <small>No crystal cost or boost</small>
            </span>
            <em>0g</em>
            {!value && <Check size={15} />}
          </button>
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`${styles.toolOption} ${option.value === value ? styles.toolOptionActive : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
              <em>{option.price.value > 0 ? `${formatGold(option.price.value)}g` : "Data"}</em>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
          {options.length === 0 && (
            <div className={styles.toolEmpty}>No supported essence data yet</div>
          )}
          <button className={styles.toolClose} onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function SkillStrategyModal({
  row,
  settings,
  membership,
  onClose,
  onOpenItem,
}: {
  row: SkillProfitRow;
  settings: SkillProfitSettings;
  membership: boolean;
  onClose: () => void;
  onOpenItem: (name: string) => void;
}) {
  const { marketData, allItemsDb } = useData();
  const { preferences, setPreferences } = usePreferences();
  const [scenarioPrices, setScenarioPrices] = useState<Record<string, string>>({});
  const [targetGoldPerHour, setTargetGoldPerHour] = useState("");
  const [scenarioSaved, setScenarioSaved] = useState(false);
  const cleanScenarioPrices = useMemo(() => {
    return Object.fromEntries(
      Object.entries(scenarioPrices)
        .map(([name, value]) => [name, Number(value)] as const)
        .filter(([, value]) => Number.isFinite(value) && value > 0),
    );
  }, [scenarioPrices]);
  const settingsWithoutRowEssence = useMemo<SkillProfitSettings>(() => {
    const essenceBySkill = { ...settings.essenceBySkill };
    const essenceBuffsBySkill = { ...settings.essenceBuffsBySkill };
    const essencePricesBySkill = { ...settings.essencePricesBySkill };
    delete essenceBySkill[row.skill];
    delete essenceBuffsBySkill[row.skill];
    delete essencePricesBySkill[row.skill];
    return {
      ...settings,
      essenceBySkill,
      essenceBuffsBySkill,
      essencePricesBySkill,
    };
  }, [row.skill, settings]);
  const baseRouteRow = useMemo(
    () => calculateSkillProfitRow(row, marketData, allItemsDb, { ...settingsWithoutRowEssence, scenarioPrices: cleanScenarioPrices }),
    [allItemsDb, cleanScenarioPrices, marketData, row, settingsWithoutRowEssence],
  );
  const activeRow = useMemo(
    () => calculateSkillProfitRow(row, marketData, allItemsDb, { ...settings, scenarioPrices: cleanScenarioPrices }),
    [allItemsDb, cleanScenarioPrices, marketData, row, settings],
  );
  const taxRate = membership ? 12 : 15;
  const hasScenarioPrices = Object.keys(cleanScenarioPrices).length > 0;
  const baseIngredientCosts = useMemo(
    () => new Map(row.ingredientCosts.map((ingredient) => [ingredient.name, ingredient])),
    [row.ingredientCosts],
  );
  const actionRate = Math.max(activeRow.itemsPerHour, 1);
  const target = Number(targetGoldPerHour);
  const targetNeedsEssencePrice = activeRow.essenceActive && activeRow.essenceNeedsPrice;
  const essenceCostPerAction = activeRow.essenceActive && activeRow.essenceCostPerHour !== null
    ? activeRow.essenceCostPerHour / actionRate
    : 0;
  const targetPerAction = !targetNeedsEssencePrice && Number.isFinite(target) && target > 0
    ? (target + (activeRow.essenceActive ? activeRow.essenceCostPerHour || 0 : 0)) / actionRate
    : null;
  const editableInputCount = activeRow.ingredientCosts.filter((ingredient) => !isFixedBuyPriceItem(ingredient.name) && ingredient.source !== "vendor").length;
  const sharedInputs = activeRow.ingredientCosts
    .map((ingredient) => ({
      ingredient,
      usedTotal: ingredient.unitPrice * ingredient.quantity,
    }))
    .filter(({ ingredient, usedTotal }) => !isFixedBuyPriceItem(ingredient.name) && ingredient.source !== "vendor" && ingredient.unitPrice > 0 && usedTotal > 0);
  const sharedInputCost = sharedInputs.reduce((sum, entry) => sum + entry.usedTotal, 0);
  const sharedFixedInputCost = activeRow.inputCost - sharedInputCost;
  const sharedBreakEvenBudget = targetNeedsEssencePrice
    ? null
    : activeRow.netRevenue - sharedFixedInputCost - essenceCostPerAction;
  const sharedTargetBudget = targetPerAction === null ? null : activeRow.netRevenue - sharedFixedInputCost - targetPerAction;
  const sharedBreakEvenRatio = sharedInputCost > 0 && sharedBreakEvenBudget !== null && sharedBreakEvenBudget > 0
    ? sharedBreakEvenBudget / sharedInputCost
    : null;
  const sharedTargetRatio = sharedInputCost > 0 && sharedTargetBudget !== null && sharedTargetBudget > 0
    ? sharedTargetBudget / sharedInputCost
    : null;
  const sharedBreakEvenLabel = sharedBreakEvenRatio === null
    ? targetNeedsEssencePrice ? "Needs price" : "No margin"
    : sharedBreakEvenRatio >= 1
      ? `+${Math.round((sharedBreakEvenRatio - 1) * 100)}% room`
      : `${Math.round((1 - sharedBreakEvenRatio) * 100)}% lower`;
  const displayProfitPerHour = getDisplayProfitPerHour(activeRow);
  const rankedProfitPerHour = getRankedProfitPerHour(activeRow);
  const changeNeedsPriceData = (row.essenceActive && row.essenceNeedsPrice) || (activeRow.essenceActive && activeRow.essenceNeedsPrice);
  const profitPerHourDelta = changeNeedsPriceData ? null : rankedProfitPerHour - getRankedProfitPerHour(row);
  const hasMarketRevenue = activeRow.marketRevenue > 0;
  const grossRevenue = hasMarketRevenue ? Math.round(activeRow.marketRevenue / (1 - taxRate / 100)) : 0;
  const taxPaid = hasMarketRevenue ? grossRevenue - activeRow.marketRevenue : 0;
  const item = allItemsDb?.[activeRow.name];
  const market = marketData?.[activeRow.name] || {};
  const itemStats = item?.stats && typeof item.stats === "object" ? Object.entries(item.stats).filter(([, value]) => value !== null && value !== 0 && value !== "") : [];
  const itemRequirements = item?.requirements && typeof item.requirements === "object" ? Object.entries(item.requirements).filter(([, value]) => value !== null && value !== "") : [];
  const itemEffects = item?.effects
    ? Array.isArray(item.effects)
      ? item.effects.map((effect: any, index: number) => formatEffectEntry(effect, index))
      : Object.entries(item.effects)
        .filter(([, value]) => value !== null && value !== "")
        .map(([key, value]) => [formatType(key), stringifyDetail(value)] as [string, string])
    : [];
  const restorationEntries = [
    ["Health", item?.health_restore ? `+${item.health_restore}` : "0"],
    ["Hunger", item?.hunger_restore ? `+${item.hunger_restore}` : "0"],
  ].filter(([, value]) => value !== "0") as Array<[string, string]>;
  const findSources = Array.isArray(item?.where_to_find) ? item.where_to_find.filter(Boolean).slice(0, 4) : [];
  const dialogRef = useModalA11y<HTMLDivElement>(true, onClose);

  return (
    <div className="modal-overlay skill-profit-strategy-overlay" onClick={onClose}>
      <div
        aria-labelledby="skill-strategy-title"
        aria-modal="true"
        className={`modal-content ${styles.strategyModalContent}`}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="skill-strategy-title">{activeRow.name} Strategy</h2>
          <button aria-label="Close skill strategy" className="close-btn" onClick={onClose} type="button"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className={styles.modalGrid}>
            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><PackageSearch size={16} /> Inputs</div>
              <div className={styles.tryPriceHeader}>
                <div>
                  <strong>Try Buy Prices</strong>
                  <span>Test bulk-buy prices without changing your saved custom prices.</span>
                </div>
                <small>{editableInputCount > 0 ? `${editableInputCount} editable material${editableInputCount === 1 ? "" : "s"}` : "Fixed inputs"}</small>
              </div>
              {hasScenarioPrices && (
                <div className={styles.tryPriceSummary}>
                  <div>
                    <span>With try prices</span>
                    <strong className={displayProfitPerHour === null ? styles.mutedValue : rankedProfitPerHour >= 0 ? styles.goodValue : styles.badValue}>
                      {displayProfitPerHour === null ? "Needs price/data" : `${formatGold(displayProfitPerHour)}g/hr`}
                    </strong>
                  </div>
                  <div>
                    <span>Change</span>
                    <strong className={profitPerHourDelta === null ? styles.mutedValue : profitPerHourDelta >= 0 ? styles.goodValue : styles.badValue}>
                      {profitPerHourDelta === null ? "Needs price/data" : `${formatSignedGold(profitPerHourDelta)}/hr`}
                    </strong>
                  </div>
                  <div>
                    <span>Profit each</span>
                    <strong className={activeRow.profitEach >= 0 ? styles.goodValue : styles.badValue}>{formatSignedGold(activeRow.profitEach)}</strong>
                  </div>
                </div>
              )}
              <div className={styles.materialList}>
                {activeRow.ingredients.length === 0 ? (
                  <div className={styles.materialLine}>
                    <span>Zero input</span>
                    <strong>0g</strong>
                  </div>
                ) : activeRow.ingredientCosts.map((ingredient) => {
                  const baseIngredient = baseIngredientCosts.get(ingredient.name) || ingredient;
                  const canTryBuyPrice = !isFixedBuyPriceItem(ingredient.name) && ingredient.source !== "vendor";
                  const otherInputCost = activeRow.inputCost - ingredient.unitPrice * ingredient.quantity;
                  const maxUnitForBreakEven = targetNeedsEssencePrice
                    ? null
                    : Math.floor((activeRow.netRevenue - otherInputCost - essenceCostPerAction) / Math.max(ingredient.quantity, 1));
                  const maxUnitForTarget = targetPerAction === null
                    ? null
                    : Math.floor((activeRow.netRevenue - otherInputCost - targetPerAction) / Math.max(ingredient.quantity, 1));
                  const currentTryPrice = scenarioPrices[ingredient.name] ?? "";
                  return (
                    <div className={styles.materialScenario} key={ingredient.name}>
                      <button
                        className={styles.materialLine}
                        onClick={() => onOpenItem(ingredient.name)}
                        type="button"
                      >
                        <span className={styles.materialName}>
                          <strong>{ingredient.quantity}x {ingredient.name}</strong>
                          <small>Current {formatGold(baseIngredient.unitPrice)}g ea - {formatPriceSource(baseIngredient.source)}</small>
                        </span>
                        <strong>{formatGold(ingredient.totalPrice)}g</strong>
                      </button>
                      {canTryBuyPrice ? (
                        <div className={styles.tryPriceGrid}>
                          <label className={styles.scenarioInput}>
                            <span>Try buy price</span>
                            <input
                              aria-label={`Try buy price for ${ingredient.name}`}
                              inputMode="numeric"
                              min={0}
                              placeholder={`${formatGold(baseIngredient.unitPrice)}g`}
                              type="number"
                              value={currentTryPrice}
                              onChange={(event) => {
                                const value = event.target.value;
                                setScenarioSaved(false);
                                setScenarioPrices((current) => {
                                  const next = { ...current };
                                  if (value === "") delete next[ingredient.name];
                                  else next[ingredient.name] = value;
                                  return next;
                                });
                              }}
                            />
                          </label>
                          <div className={styles.breakEvenLine}>
                            <span>Break-even</span>
                            <strong>
                              {maxUnitForBreakEven === null
                                ? "Needs essence price"
                                : maxUnitForBreakEven > 0 ? `${formatGold(maxUnitForBreakEven)}g ea` : "Not profitable"}
                            </strong>
                          </div>
                          {maxUnitForTarget !== null && (
                            <div className={styles.breakEvenLine}>
                              <span>Max for target</span>
                              <strong>{maxUnitForTarget > 0 ? `${formatGold(maxUnitForTarget)}g ea` : "Not possible"}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.fixedPriceNote}>Fixed vendor price</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.modalTotal}>
                <span>Total input cost</span>
                <strong>{formatGold(activeRow.inputCost)}g</strong>
              </div>
              <label className={styles.targetProfitField}>
                <span>Target gold per hour</span>
                <input
                  aria-label="Target gold per hour"
                  inputMode="numeric"
                  min={0}
                  placeholder="Optional"
                  type="number"
                  value={targetGoldPerHour}
                  onChange={(event) => setTargetGoldPerHour(event.target.value)}
                />
              </label>
              {sharedInputs.length > 1 && (
                <div className={styles.sharedScenario}>
                  <div className={styles.sharedScenarioHeader}>
                    <div>
                      <strong>Shared material move</strong>
                      <span>Current editable input mix: {formatGold(sharedInputCost)}g</span>
                    </div>
                    <small>{sharedBreakEvenLabel}</small>
                  </div>
                  <div className={styles.sharedScenarioSummary}>
                    <div>
                      <span>Break-even basket</span>
                      <strong className={sharedBreakEvenBudget !== null && sharedBreakEvenBudget > 0 ? styles.goodValue : styles.badValue}>
                        {sharedBreakEvenBudget === null
                          ? "Needs essence price"
                          : sharedBreakEvenBudget > 0 ? `${formatGold(sharedBreakEvenBudget)}g` : "Not profitable"}
                      </strong>
                    </div>
                    <div>
                      <span>Target basket</span>
                      <strong className={sharedTargetBudget === null ? "" : sharedTargetBudget > 0 ? styles.goodValue : styles.badValue}>
                        {sharedTargetBudget === null
                          ? targetNeedsEssencePrice ? "Needs essence price" : "Set target"
                          : sharedTargetBudget > 0 ? `${formatGold(sharedTargetBudget)}g` : "Not possible"}
                      </strong>
                    </div>
                  </div>
                  <div className={styles.sharedScenarioGrid}>
                    {sharedInputs.map(({ ingredient }) => {
                      const breakEvenUnit = sharedBreakEvenRatio === null ? null : Math.floor(ingredient.unitPrice * sharedBreakEvenRatio);
                      const targetUnit = sharedTargetRatio === null ? null : Math.floor(ingredient.unitPrice * sharedTargetRatio);
                      return (
                        <div className={styles.breakEvenLine} key={ingredient.name}>
                          <span>{ingredient.name}</span>
                          <strong className={breakEvenUnit !== null && breakEvenUnit > 0 ? styles.goodValue : styles.badValue}>
                            {breakEvenUnit !== null && breakEvenUnit > 0 ? `${formatGold(breakEvenUnit)}g ea` : "No room"}
                          </strong>
                          {targetPerAction !== null && (
                            <em className={targetUnit !== null && targetUnit > 0 ? styles.goodValue : styles.badValue}>
                              Target {targetUnit !== null && targetUnit > 0 ? `${formatGold(targetUnit)}g ea` : "not possible"}
                            </em>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {targetNeedsEssencePrice && (
                <div className={styles.fixedPriceNote}>Essence price required for boosted caps</div>
              )}
              {hasScenarioPrices && (
                <div className={styles.scenarioActions}>
                  <button type="button" onClick={() => setScenarioPrices({})}>Clear try prices</button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences({
                        customPrices: {
                          ...preferences.customPrices,
                          ...Object.fromEntries(Object.entries(cleanScenarioPrices).map(([name, price]) => [name, Math.round(price)])),
                        },
                      });
                      setScenarioSaved(true);
                    }}
                  >
                    Save as custom prices
                  </button>
                  {scenarioSaved && <span className={styles.scenarioSaved}>Saved to custom prices</span>}
                </div>
              )}
              {activeRow.inputMissing.length > 0 && (
                <div className={styles.modalWarning}>Missing prices: {activeRow.inputMissing.join(", ")}</div>
              )}
            </section>

            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><Info size={16} /> Calculation</div>
              <div className={styles.calcRows}>
                <CalcRow label={hasScenarioPrices ? "Try/market gross" : "Market gross"} value={hasMarketRevenue ? `${formatGold(grossRevenue)}g` : "No market"} muted={!hasMarketRevenue} />
                <CalcRow label={`Market tax (${taxRate}%)`} value={hasMarketRevenue ? `-${formatGold(taxPaid)}g` : "0g"} muted={!hasMarketRevenue} />
                <CalcRow label="Market net" value={`${formatGold(activeRow.marketRevenue)}g`} muted={activeRow.marketRevenue <= 0} />
                <CalcRow label="Vendor net" value={`${formatGold(activeRow.vendorRevenue)}g`} muted={activeRow.vendorRevenue <= 0} />
                <CalcRow label={(settings.saleMode || "best") === "best" ? "Best sell path" : "Selected sell path"} value={formatPriceSource(activeRow.bestSaleSource)} tone={activeRow.bestSaleSource === "vendor" ? "good" : undefined} />
                <CalcRow label="Net revenue used" value={`${formatGold(activeRow.netRevenue)}g`} />
                <CalcRow label="Input cost" value={`-${formatGold(activeRow.inputCost)}g`} />
                <CalcRow label="Profit each" value={`${activeRow.profitEach >= 0 ? "+" : ""}${formatGold(activeRow.profitEach)}g`} tone={activeRow.profitEach >= 0 ? "good" : "bad"} />
                <CalcRow label="Items per hour" value={activeRow.itemsPerHour.toLocaleString()} />
                {activeRow.housingWindowHours > 0 && (
                  <>
                    <CalcRow label={`${activeRow.skill} housing window`} value={`+${formatHours(activeRow.housingWindowHours)}`} />
                    <CalcRow label="Actions per housing window" value={activeRow.itemsPerHousingWindow.toLocaleString()} />
                    <CalcRow label="Gold per housing window" value={`${formatGold(activeRow.profitPerHousingWindow)}g`} tone={activeRow.profitPerHousingWindow >= 0 ? "good" : "bad"} />
                  </>
                )}
                {activeRow.toolBonus > 0 && <CalcRow label="Tool efficiency" value={`+${activeRow.toolBonus}%`} />}
                <CalcRow label={activeRow.essenceActive ? "Boosted before essence cost" : "Gold per hour"} value={`${formatGold(activeRow.profitPerHour)}g`} tone={activeRow.profitPerHour >= 0 ? "good" : "bad"} />
                {activeRow.essenceActive ? (
                  <>
                    <CalcRow label="Base route profit/hr" value={`${formatGold(baseRouteRow.profitPerHour)}g`} />
                    <CalcRow label="Essence effect" value={formatEssenceBuff({ efficiency: activeRow.essenceEfficiencyBonus, experience: activeRow.essenceExperienceBonus })} />
                    <CalcRow label="Idle action window" value={activeRow.essenceIdleActionHours > 0 ? formatHours(activeRow.essenceIdleActionHours) : "Profile needed"} muted={activeRow.essenceIdleActionHours <= 0} />
                    <CalcRow label="Cost per start" value={activeRow.essenceNeedsPrice ? "Needs price/data" : `${formatGold(activeRow.essenceCostPerStart)}g`} muted={activeRow.essenceNeedsPrice} />
                    <CalcRow label="Cost per hour" value={activeRow.essenceCostPerHour === null ? "Needs price/data" : `${formatGold(activeRow.essenceCostPerHour)}g`} muted={activeRow.essenceCostPerHour === null} />
                    <CalcRow
                      label="Profit with essence"
                      value={activeRow.profitWithEssencePerHour === null ? "Needs price/data" : `${formatGold(activeRow.profitWithEssencePerHour)}g`}
                      tone={activeRow.profitWithEssencePerHour === null ? undefined : activeRow.profitWithEssencePerHour >= 0 ? "good" : "bad"}
                      muted={activeRow.profitWithEssencePerHour === null}
                    />
                  </>
                ) : (
                  <CalcRow label="Essence" value="None" muted />
                )}
                <CalcRow label="EXP per second" value={activeRow.expPerSecond === null ? "Unknown" : activeRow.expPerSecond.toFixed(2)} muted={activeRow.expPerSecond === null} />
                <CalcRow label="Stable volume" value={activeRow.stableVolume3d.toLocaleString()} />
                <CalcRow label="Raw 3-day volume" value={activeRow.volume3d.toLocaleString()} muted={activeRow.stableVolume3d === activeRow.volume3d} />
                <CalcRow label="Liquidity" value={activeRow.liquidityLabel} muted={!activeRow.liquidityRisk && activeRow.liquidityLabel === "No market"} />
                {activeRow.liquidityRisk && <CalcRow label="Market caution" value={activeRow.liquidityNote} muted />}
                {activeRow.priceSwingRisk && <CalcRow label="Price caution" value={activeRow.priceSwingNote} muted />}
              </div>
              <div className={styles.formula}>
                {activeRow.essenceActive && activeRow.profitWithEssencePerHour !== null
                  ? `(${formatGold(activeRow.netRevenue)}g net - ${formatGold(activeRow.inputCost)}g input) x ${activeRow.itemsPerHour.toLocaleString()} actions/hr - ${formatGold(activeRow.essenceCostPerHour || 0)}g essence/hr = ${formatGold(activeRow.profitWithEssencePerHour)}g/hr`
                  : activeRow.essenceActive
                    ? `Base route is ${formatGold(baseRouteRow.profitPerHour)}g/hr. Profit with essence needs price/data before it can be ranked.`
                  : `(${formatGold(activeRow.netRevenue)}g net - ${formatGold(activeRow.inputCost)}g input) x ${activeRow.itemsPerHour.toLocaleString()} actions/hr = ${formatGold(activeRow.profitPerHour)}g/hr`}
              </div>
              <button className={styles.openItemButton} onClick={() => onOpenItem(activeRow.name)} type="button">
                Open item database details
              </button>
            </section>

            <section className={`${styles.modalPanel} ${styles.itemDetailsPanel}`}>
              <div className={styles.modalPanelTitle}><Eye size={16} /> Result Item Details</div>
              <div className={styles.itemDetailHeader}>
                {item?.image_url && <img src={item.image_url} alt="" />}
                <div>
                  <strong>{activeRow.name}</strong>
                  <span>{item?.description || activeRow.note || "No item description available in the local database."}</span>
                </div>
              </div>
              <div className={styles.detailGrid}>
                <DetailPill label="Skill" value={activeRow.skill} />
                <DetailPill label="Level" value={activeRow.level.toLocaleString()} />
                <DetailPill label="Base Time" value={`${formatNumber(activeRow.baseDuration)}s`} />
                <DetailPill label="Final Time" value={`${formatNumber(activeRow.finalDuration)}s`} />
                <DetailPill label="Base EXP" value={formatOptionalNumber(activeRow.experience)} muted={activeRow.experience === null} />
                <DetailPill label="EXP/hr" value={formatOptionalNumber(activeRow.expPerHour)} muted={activeRow.expPerHour === null} />
                <DetailPill label="Type" value={formatType(item?.type)} muted={!item?.type} />
                <DetailPill label="Quality" value={formatType(item?.quality)} muted={!item?.quality}>
                  {item?.quality ? <QualityText value={item.quality}>{formatType(item.quality)}</QualityText> : undefined}
                </DetailPill>
                <DetailPill label="Tradeable" value={item ? (item.is_tradeable ? "Yes" : "No") : "Unknown"} muted={!item} />
                <DetailPill label="Vendor Base" value={item?.vendor_price ? `${formatGold(item.vendor_price)}g` : "None"} muted={!item?.vendor_price} />
                <DetailPill label="3d Avg" value={market?.avg_3 ? `${formatGold(market.avg_3)}g` : "No data"} muted={!market?.avg_3} />
                <DetailPill label="7d Avg" value={market?.avg_7 ? `${formatGold(market.avg_7)}g` : "No data"} muted={!market?.avg_7} />
                <DetailPill label="30d Avg" value={market?.avg_30 ? `${formatGold(market.avg_30)}g` : "No data"} muted={!market?.avg_30} />
                <DetailPill label="Stable Volume" value={activeRow.stableVolume3d.toLocaleString()} muted={activeRow.stableVolume3d <= 0} />
                <DetailPill label="Raw 3d Volume" value={activeRow.volume3d.toLocaleString()} muted={activeRow.stableVolume3d === activeRow.volume3d} />
              </div>

              {(itemRequirements.length > 0 || itemStats.length > 0 || itemEffects.length > 0 || findSources.length > 0 || item?.health_restore || item?.hunger_restore) && (
                <div className={styles.extraDetailGrid}>
                  {itemRequirements.length > 0 && <DetailList title="Requirements" entries={itemRequirements} />}
                  {itemStats.length > 0 && <DetailList title="Stats" entries={itemStats} />}
                  {itemEffects.length > 0 && <DetailList title="Effects" entries={itemEffects} />}
                  {(item?.health_restore || item?.hunger_restore) && (
                    <DetailList
                      title="Restoration"
                      entries={restorationEntries}
                    />
                  )}
                  {findSources.length > 0 && (
                    <DetailList
                      title="Where To Find"
                      entries={findSources.map((source: any, index: number) => [
                        source?.type || source?.name || `Source ${index + 1}`,
                        source?.name || source?.location || stringifyDetail(source),
                      ])}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailPill({ label, value, muted, children }: { label: string; value: string; muted?: boolean; children?: ReactNode }) {
  return (
    <div className={styles.detailPill}>
      <span>{label}</span>
      <strong className={muted ? styles.mutedValue : ""}>{children ?? value}</strong>
    </div>
  );
}

function DetailList({ title, entries }: { title: string; entries: Array<[string, any]> }) {
  return (
    <div className={styles.detailList}>
      <strong>{title}</strong>
      {entries.map(([label, value]) => (
        <div key={`${title}-${label}`}>
          <span>{formatType(label)}</span>
          <em>{stringifyDetail(value)}</em>
        </div>
      ))}
    </div>
  );
}

function stringifyDetail(value: any): string {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyDetail).join(", ");
  if (typeof value === "object") {
    const name = value.name || value.item_name || value.type || value.location || value.value;
    if (name) return String(name);
    return Object.entries(value)
      .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "")
      .slice(0, 3)
      .map(([entryKey, entryValue]) => `${formatType(entryKey)}: ${stringifyDetail(entryValue)}`)
      .join(", ");
  }
  return String(value);
}

function formatEffectEntry(effect: any, index: number): [string, string] {
  if (!effect || typeof effect !== "object") return [`Effect ${index + 1}`, stringifyDetail(effect)];
  const target = effect.target ? formatType(effect.target) : "";
  const attribute = effect.attribute ? formatType(effect.attribute) : effect.name || effect.type || `Effect ${index + 1}`;
  const label = [target, attribute].filter(Boolean).join(" ");
  const rawValue = Number(effect.value);
  const prefix = Number.isFinite(rawValue) && rawValue > 0 ? "+" : "";
  const suffix = effect.value_type === "percentage"
    ? "%"
    : effect.value_type
      ? ` ${formatType(effect.value_type).toLowerCase()}`
      : "";
  const value = Number.isFinite(rawValue) ? `${prefix}${rawValue.toLocaleString()}${suffix}` : stringifyDetail(effect);
  return [label || `Effect ${index + 1}`, value];
}

function formatType(value: any): string {
  if (!value) return "Unknown";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPriceSource(value: string): string {
  if (value === "scenario") return "Try price";
  if (value === "custom") return "Custom";
  if (value === "market") return "Market";
  if (value === "vendor") return "Vendor";
  return "Missing";
}

function formatSignedGold(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatGold(Math.abs(value))}g`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? "Unknown" : formatNumber(value);
}

function CalcRow({ label, value, tone, muted }: { label: string; value: string; tone?: "good" | "bad"; muted?: boolean }) {
  return (
    <div className={styles.calcRow}>
      <span>{label}</span>
      <strong className={tone === "good" ? styles.positive : tone === "bad" ? styles.negative : muted ? styles.mutedValue : ""}>{value}</strong>
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "profit" }) {
  return (
    <div className={styles.metric} title={`${label}: ${value} (${sub})`}>
      <span>{label}</span>
      <strong className={tone === "profit" ? styles.metricProfit : ""}>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function isLiquid(row: SkillProfitRow, minVolume: number) {
  if (row.saleSource === "missing") return false;
  const isMarketLike = row.saleSource === "market" || row.saleSource === "custom" || row.saleSource === "scenario";
  return !isMarketLike || (row.stableVolume3d >= minVolume && !row.liquidityRisk);
}

function isExcludedFromTop(row: SkillProfitRow, minVolume: number) {
  return row.skill === "Forge" || !isLiquid(row, minVolume);
}

function getSearchTokens(search: string) {
  return search.split(/\s+/).map((token) => token.trim()).filter(Boolean);
}

function rowMatchesSearch(row: SkillProfitRow, tokens: string[]) {
  if (tokens.length === 0) return true;
  const parts = [
    row.name,
    row.skill,
    row.note || "",
    row.bestSaleSource,
    row.saleSource,
    row.liquidityLabel,
    row.liquidityNote,
    row.essenceName,
    ...row.inputMissing,
    ...row.ingredients.map((ingredient) => ingredient.name),
  ].map((part) => part.toLowerCase());

  return tokens.every((token) => parts.some((part) => part.includes(token)));
}

function getMatchedIngredient(row: SkillProfitRow, search: string) {
  const tokens = getSearchTokens(search.trim().toLowerCase());
  if (tokens.length === 0) return "";
  return row.ingredients.find((ingredient) => {
    const ingredientName = ingredient.name.toLowerCase();
    return tokens.every((token) => ingredientName.includes(token));
  })?.name || "";
}

function getSortValue(row: SkillProfitRow, key: SkillProfitSortKey) {
  if (key === "name") return row.name.toLowerCase();
  if (key === "skill") return row.skill;
  if (key === "profitPerHour") return getRankedProfitPerHour(row);
  if (key === "volume3d") return row.stableVolume3d;
  return row[key] ?? -Infinity;
}

function getDisplayProfitPerHour(row: SkillProfitRow) {
  if (row.essenceActive && row.profitWithEssencePerHour !== null) return row.profitWithEssencePerHour;
  if (row.essenceActive && row.essenceNeedsPrice) return null;
  return row.profitPerHour;
}

function getRankedProfitPerHour(row: SkillProfitRow) {
  const displayProfit = getDisplayProfitPerHour(row);
  if (displayProfit !== null) return displayProfit;
  return row.baseProfitPerHour;
}

function getProfitCellValue(row: SkillProfitRow) {
  const displayProfit = getDisplayProfitPerHour(row);
  return displayProfit === null ? "Needs price/data" : `${formatGold(displayProfit)}g`;
}

function getProfitCardValue(row: SkillProfitRow) {
  const displayProfit = getDisplayProfitPerHour(row);
  return displayProfit === null ? "Needs price/data" : `${formatGold(displayProfit)}g/hr`;
}

function getProfitSummary(row: SkillProfitRow) {
  const displayProfit = getDisplayProfitPerHour(row);
  if (displayProfit === null) return `Needs price/data - base ${formatGold(row.baseProfitPerHour)}g/hr`;
  return `${formatGold(displayProfit)}g/hr`;
}

