"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Gauge,
  Hand,
  HardHat,
  Layers,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Sword,
  Target,
  Zap,
} from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { useItemModal } from "@/context/ItemModalContext";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { useData } from "@/context/DataContext";
import { getSafeMarketValue, type MarketPriceDatum } from "@/lib/market-pricing";
import { calculateGearStats, formatStatName } from "@/lib/profile-calculations";

type GearType =
  | "SWORD"
  | "DAGGER"
  | "BOW"
  | "SHIELD"
  | "HELMET"
  | "CHESTPLATE"
  | "GREAVES"
  | "BOOTS"
  | "GAUNTLETS";

type CombatStyle = "swordShield" | "dualDaggers" | "bow";
type SortKey = "level" | "stats" | "price" | "quality" | "name";
type Direction = "asc" | "desc";
type Priority = "balanced" | "damage" | "defence" | "speed";

type GearItem = {
  name: string;
  hashed_id: string;
  type: GearType | string;
  quality: string;
  image_url?: string;
  vendor_price?: number | null;
  is_tradeable?: boolean;
  combat_req?: number | null;
  requirements?: Record<string, number | null> | null;
  stats?: Record<string, number> | null;
  tier_modifiers?: Record<string, number> | null;
  max_tier?: number;
};

type GearView = {
  item: GearItem;
  stats: Record<string, number>;
  weightedStats: number;
  statTotal: number;
  requirementLevel: number;
  eligible: boolean;
  unmet: string[];
  price: number | null;
  priceLabel: string;
  effectiveTier: number;
};

type StatComparison = {
  key: string;
  candidate: number;
  current: number;
  delta: number;
};

const COMBAT_TYPES = new Set<GearType>([
  "SWORD",
  "DAGGER",
  "BOW",
  "SHIELD",
  "HELMET",
  "CHESTPLATE",
  "GREAVES",
  "BOOTS",
  "GAUNTLETS",
]);

const SLOT_CONFIG: Record<GearType, { label: string; profileSlot: string; icon: React.ReactNode }> = {
  SWORD: { label: "Sword", profileSlot: "weapon", icon: <Sword size={16} /> },
  DAGGER: { label: "Dagger", profileSlot: "weapon", icon: <Zap size={16} /> },
  BOW: { label: "Bow", profileSlot: "bow", icon: <Target size={16} /> },
  SHIELD: { label: "Shield", profileSlot: "shield", icon: <Shield size={16} /> },
  HELMET: { label: "Helmet", profileSlot: "helmet", icon: <HardHat size={16} /> },
  CHESTPLATE: { label: "Chestplate", profileSlot: "chestplate", icon: <Shield size={16} /> },
  GREAVES: { label: "Greaves", profileSlot: "greaves", icon: <Layers size={16} /> },
  BOOTS: { label: "Boots", profileSlot: "boots", icon: <ArrowDown size={16} /> },
  GAUNTLETS: { label: "Gauntlets", profileSlot: "gauntlets", icon: <Hand size={16} /> },
};

const SLOT_FILTERS: Array<{ id: "ALL" | GearType; label: string }> = [
  { id: "ALL", label: "All gear" },
  { id: "SWORD", label: "Swords" },
  { id: "DAGGER", label: "Daggers" },
  { id: "BOW", label: "Bows" },
  { id: "SHIELD", label: "Shields" },
  { id: "HELMET", label: "Helmets" },
  { id: "CHESTPLATE", label: "Chestplates" },
  { id: "GREAVES", label: "Greaves" },
  { id: "BOOTS", label: "Boots" },
  { id: "GAUNTLETS", label: "Gauntlets" },
];

const STYLE_OPTIONS: Array<{ id: CombatStyle; label: string; slots: GearType[] }> = [
  { id: "swordShield", label: "Sword + Shield", slots: ["SWORD", "SHIELD"] },
  { id: "dualDaggers", label: "Dual Daggers", slots: ["DAGGER"] },
  { id: "bow", label: "Bow", slots: ["BOW"] },
];

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "level", label: "Level" },
  { id: "stats", label: "Stats" },
  { id: "price", label: "Price" },
  { id: "quality", label: "Rarity" },
  { id: "name", label: "Name" },
];

const PRIORITIES: Array<{ id: Priority; label: string }> = [
  { id: "balanced", label: "Balanced" },
  { id: "damage", label: "Damage" },
  { id: "defence", label: "Defence" },
  { id: "speed", label: "Speed" },
];

const SEARCH_ALIASES: Record<string, string[]> = {
  chest: ["chestplate"],
  gloves: ["gauntlets"],
  hat: ["helmet"],
  helm: ["helmet"],
  legs: ["greaves"],
  shoes: ["boots"],
};

const QUALITY_ORDER = ["REFINED", "PREMIUM", "EPIC", "LEGENDARY", "MYTHIC"];
const QUALITY_COLOR: Record<string, string> = {
  REFINED: "#22c55e",
  PREMIUM: "#38bdf8",
  EPIC: "#a855f7",
  LEGENDARY: "#f59e0b",
  MYTHIC: "#ef4444",
};
const INITIAL_VISIBLE_GEAR_ROWS = 120;

const WEIGHTS: Record<Priority, Record<string, number>> = {
  balanced: {
    attack_power: 1,
    damage: 8,
    accuracy: 0.75,
    agility: 0.55,
    protection: 0.6,
    critical_chance: 6,
    critical_damage: 1.25,
    movement_speed: 12,
    max_health: 0.2,
  },
  damage: {
    attack_power: 1.25,
    damage: 10,
    accuracy: 0.9,
    agility: 0.35,
    protection: 0.2,
    critical_chance: 8,
    critical_damage: 1.6,
    movement_speed: 7,
  },
  defence: {
    attack_power: 0.45,
    damage: 5,
    accuracy: 0.45,
    agility: 0.55,
    protection: 1.25,
    critical_chance: 3,
    critical_damage: 0.65,
    movement_speed: 6,
    max_health: 0.45,
  },
  speed: {
    attack_power: 0.55,
    damage: 5,
    accuracy: 0.65,
    agility: 1.15,
    protection: 0.35,
    critical_chance: 5,
    critical_damage: 0.8,
    movement_speed: 22,
  },
};

const ARMOR_SLOTS: GearType[] = ["HELMET", "CHESTPLATE", "GREAVES", "BOOTS", "GAUNTLETS"];

function normalizeCombatStyle(value: string | undefined): CombatStyle {
  if (value === "dualDaggers" || value === "dual_daggers") return "dualDaggers";
  if (value === "bow") return "bow";
  return "swordShield";
}

function numberValue(value: number | "" | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRequirementLevel(item: GearItem) {
  return Math.max(0, ...Object.values(item.requirements || {}).map((value) => Number(value || 0)));
}

function getQualityRank(quality: string | undefined) {
  const index = QUALITY_ORDER.indexOf(String(quality || "").toUpperCase());
  return index === -1 ? -1 : index;
}

function formatGold(value: number | null | undefined) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "-";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}g`;
}

function evaluateScore(stats: Record<string, number>, priority: Priority) {
  const weights = WEIGHTS[priority];
  return Object.entries(stats).reduce((total, [key, value]) => total + Number(value || 0) * (weights[key] || 0.25), 0);
}

function totalPositiveStats(stats: Record<string, number>) {
  return Object.values(stats).reduce((total, value) => total + Math.max(0, Number(value || 0)), 0);
}

function compareBestGear(a: GearView, b: GearView) {
  return (
    b.requirementLevel - a.requirementLevel ||
    getQualityRank(b.item.quality) - getQualityRank(a.item.quality) ||
    b.weightedStats - a.weightedStats ||
    b.statTotal - a.statTotal ||
    Number(a.price || Number.MAX_SAFE_INTEGER) - Number(b.price || Number.MAX_SAFE_INTEGER) ||
    a.item.name.localeCompare(b.item.name)
  );
}

function requirementStatus(item: GearItem, levels: Record<string, number>) {
  const unmet: string[] = [];
  for (const [key, required] of Object.entries(item.requirements || {})) {
    const req = Number(required || 0);
    if (req > 0 && (levels[key] || 0) < req) unmet.push(`${formatStatName(key)} ${req}`);
  }
  const combatReq = Number(item.combat_req || 0);
  if (combatReq > 0 && (levels.combat || 0) < combatReq && !unmet.some((entry) => entry.startsWith("Combat "))) {
    unmet.push(`Combat ${combatReq}`);
  }
  return unmet;
}

function getPrice(item: GearItem, marketData: unknown) {
  const marketLookup = marketData as Record<string, MarketPriceDatum | undefined> | null | undefined;
  const market = getSafeMarketValue(marketLookup?.[item.name]);
  if (Number.isFinite(Number(market)) && Number(market) > 0) return { value: Number(market), label: "Market" };
  const vendor = Number(item.vendor_price || 0);
  if (vendor > 0) return { value: vendor, label: "Vendor" };
  return { value: null, label: "No price" };
}

function activeStyleSlots(style: CombatStyle) {
  const weaponSlots = STYLE_OPTIONS.find((option) => option.id === style)?.slots || ["SWORD", "SHIELD"];
  return [...weaponSlots, ...ARMOR_SLOTS];
}

function slotLabel(type: string) {
  return SLOT_CONFIG[type as GearType]?.label || type;
}

function profileSlotForType(type: GearType) {
  return SLOT_CONFIG[type]?.profileSlot || "";
}

function compareStats(candidate: Record<string, number>, current: Record<string, number>): StatComparison[] {
  const keys = Array.from(new Set([...Object.keys(candidate), ...Object.keys(current)])).sort();
  return keys.map((key) => {
    const candidateValue = Number(candidate[key] || 0);
    const currentValue = Number(current[key] || 0);
    return { key, candidate: candidateValue, current: currentValue, delta: candidateValue - currentValue };
  });
}

function clampTier(value: number | "", maxTier: number) {
  if (value === "") return "";
  return Math.min(Math.max(1, Number(value || 1)), Math.max(1, maxTier));
}

export default function BisPage() {
  const { marketData } = useData();
  const { preferences, setPreferences } = usePreferences();
  const { activeProfile, updateProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const comparePanelRef = useRef<HTMLElement | null>(null);
  const recommendationPanelRef = useRef<HTMLElement | null>(null);
  const gearListPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const slotButtonRefs = useRef<Partial<Record<"ALL" | GearType, HTMLButtonElement | null>>>({});

  const [gearData, setGearData] = useState<GearItem[]>([]);
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState<"ALL" | GearType>("ALL");
  const [usableOnly, setUsableOnly] = useState(false);
  const [priority, setPriority] = useState<Priority>("balanced");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [direction, setDirection] = useState<Direction>("asc");
  const [selectedId, setSelectedId] = useState<string>("");
  const [candidateTier, setCandidateTier] = useState<number | "">(1);
  const [compareTier, setCompareTier] = useState<number | "">(1);
  const [visibleGearCount, setVisibleGearCount] = useState(INITIAL_VISIBLE_GEAR_ROWS);
  const [mobileSelectionHint, setMobileSelectionHint] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const profileCombatLevel = activeProfile ? activeProfile.levels.combat : preferences.combatLevel;
  const profileStrength = activeProfile ? activeProfile.levels.strength : preferences.strStat;
  const profileDexterity = activeProfile ? activeProfile.levels.dexterity : preferences.dexStat;
  const profileDefence = activeProfile ? activeProfile.levels.defence : preferences.defStat;
  const activeCombatStyle = normalizeCombatStyle(activeProfile?.combatStyle || preferences.combatStyle);

  const levels = useMemo(() => ({
    combat: numberValue(profileCombatLevel),
    strength: numberValue(profileStrength),
    dexterity: numberValue(profileDexterity),
    defence: numberValue(profileDefence),
  }), [profileCombatLevel, profileStrength, profileDexterity, profileDefence]);
  const activeSlots = useMemo(() => activeStyleSlots(activeCombatStyle), [activeCombatStyle]);

  useEffect(() => {
    let cancelled = false;
    fetch("/gear-data.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : Object.values(data || {}).flat();
        setGearData(rows.filter((item: GearItem) => COMBAT_TYPES.has(item.type as GearType)));
      })
      .catch(() => {
        if (!cancelled) setGearData([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const itemByName = useMemo(() => {
    const map: Record<string, GearItem> = {};
    for (const item of gearData) map[item.name] = item;
    return map;
  }, [gearData]);

  const gearViews = useMemo<GearView[]>(() => {
    return gearData.map((item) => {
      const effectiveTier = 1;
      const stats = calculateGearStats(item, effectiveTier);
      const weightedStats = evaluateScore(stats, priority);
      const statTotal = totalPositiveStats(stats);
      const unmet = requirementStatus(item, levels);
      const price = getPrice(item, marketData);
      return {
        item,
        stats,
        weightedStats,
        statTotal,
        requirementLevel: getRequirementLevel(item),
        eligible: unmet.length === 0,
        unmet,
        price: price.value,
        priceLabel: price.label,
        effectiveTier,
      };
    });
  }, [gearData, priority, levels, marketData]);

  const recommendations = useMemo(() => {
    const result: Partial<Record<GearType, GearView>> = {};
    for (const type of activeSlots) {
      const best = gearViews
        .filter((view) => view.item.type === type && view.eligible)
        .sort(compareBestGear)[0];
      if (best) result[type] = best;
    }
    return result;
  }, [gearViews, activeSlots]);

  const filteredGear = useMemo(() => {
    const term = search.trim().toLowerCase();
    const searchTerms = term ? [term, ...(SEARCH_ALIASES[term] || [])] : [];
    const rows = gearViews.filter((view) => {
      if (slotFilter !== "ALL" && view.item.type !== slotFilter) return false;
      if (usableOnly && !view.eligible) return false;
      if (!term) return true;
      const haystack = [
        view.item.name,
        view.item.type,
        view.item.quality,
        ...Object.keys(view.stats),
        ...Object.keys(view.item.requirements || {}),
      ].join(" ").toLowerCase();
      return searchTerms.some((value) => haystack.includes(value));
    });

    return [...rows].sort((a, b) => {
      let delta = 0;
      if (sortKey === "level") delta = a.requirementLevel - b.requirementLevel;
      if (sortKey === "stats") delta = a.weightedStats - b.weightedStats;
      if (sortKey === "price") delta = Number(a.price || 0) - Number(b.price || 0);
      if (sortKey === "quality") delta = getQualityRank(a.item.quality) - getQualityRank(b.item.quality);
      if (sortKey === "name") delta = a.item.name.localeCompare(b.item.name);
      if (delta === 0) delta = a.requirementLevel - b.requirementLevel || a.item.name.localeCompare(b.item.name);
      return direction === "asc" ? delta : -delta;
    });
  }, [gearViews, search, slotFilter, usableOnly, sortKey, direction]);

  const visibleGear = useMemo(
    () => filteredGear.slice(0, visibleGearCount),
    [filteredGear, visibleGearCount],
  );

  useEffect(() => {
    if (filteredGear.length === 0) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !filteredGear.some((view) => view.item.hashed_id === selectedId)) {
      setSelectedId((filteredGear.find((view) => view.eligible) || filteredGear[0]).item.hashed_id);
    }
  }, [filteredGear, selectedId]);

  useEffect(() => {
    setVisibleGearCount(INITIAL_VISIBLE_GEAR_ROWS);
  }, [search, slotFilter, usableOnly, sortKey, direction, priority]);

  useEffect(() => {
    slotButtonRefs.current[slotFilter]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [slotFilter]);

  const selected = filteredGear.find((view) => view.item.hashed_id === selectedId) || filteredGear[0] || null;
  const selectedType = selected?.item.type as GearType | undefined;
  const selectedProfileSlot = selectedType ? profileSlotForType(selectedType) : "";
  const currentProfileItemName = selectedProfileSlot ? activeProfile?.gear?.[selectedProfileSlot] : "";
  const currentProfileItem = currentProfileItemName ? itemByName[currentProfileItemName] : undefined;
  const savedProfileTier = selectedProfileSlot ? activeProfile?.gearTiers?.[selectedProfileSlot] || 1 : 1;
  const selectedMaxTier = Math.max(1, Number(selected?.item.max_tier || 1));
  const currentMaxTier = Math.max(1, Number(currentProfileItem?.max_tier || 1));
  const effectiveCandidateTier = clampTier(candidateTier, selectedMaxTier) || 1;
  const effectiveCompareTier = clampTier(compareTier, currentMaxTier) || 1;
  const candidateStats = selected ? calculateGearStats(selected.item, effectiveCandidateTier) : {};
  const currentStats = currentProfileItem ? calculateGearStats(currentProfileItem, effectiveCompareTier) : {};
  const statComparison = selected ? compareStats(candidateStats, currentStats) : [];
  const totalRecommendedCost = activeSlots.reduce((total, type) => {
    const view = recommendations[type];
    const multiplier = type === "DAGGER" && activeCombatStyle === "dualDaggers" ? 2 : 1;
    return total + Number(view?.price || 0) * multiplier;
  }, 0);
  const activeProfileName = activeProfile?.name?.trim() || "Manual planner";
  const activeStyleLabel = STYLE_OPTIONS.find((option) => option.id === activeCombatStyle)?.label || "Sword + Shield";
  const priorityLabel = PRIORITIES.find((option) => option.id === priority)?.label || "Balanced";
  const usableGearCount = gearViews.filter((view) => view.eligible).length;
  const recommendedSlotCount = activeSlots.filter((type) => recommendations[type]).length;
  const recommendationReadinessLabel = `${recommendedSlotCount}/${activeSlots.length} slots ready`;
  const selectedDeltaTotal = statComparison.reduce((total, entry) => total + entry.delta, 0);
  const positiveDeltaCount = statComparison.filter((entry) => entry.delta > 0).length;
  const negativeDeltaCount = statComparison.filter((entry) => entry.delta < 0).length;
  const comparisonTone = !currentProfileItem ? "neutral" : selectedDeltaTotal >= 0 ? "positive" : "negative";
  const comparisonSummaryLabel = currentProfileItem
    ? `${positiveDeltaCount} gain${positiveDeltaCount === 1 ? "" : "s"} / ${negativeDeltaCount} drop${negativeDeltaCount === 1 ? "" : "s"}`
    : "Save a baseline item first";
  const dataSourceLabel = activeProfile ? "Profile levels" : "Manual levels";

  const handleLevelChange = (key: "combatLevel" | "strStat" | "dexStat" | "defStat", value: string) => {
    const parsed = Number(value);
    if (value !== "" && !Number.isFinite(parsed)) return;
    const next = value === "" ? "" : Math.max(0, Math.floor(parsed));
    if (activeProfile) {
      const profileKey = key === "combatLevel" ? "combat" : key === "strStat" ? "strength" : key === "dexStat" ? "dexterity" : "defence";
      updateProfile(activeProfile.id, { levels: { ...activeProfile.levels, [profileKey]: next } });
    } else {
      setPreferences({ [key]: next });
    }
  };

  const setCombatStyle = (style: CombatStyle) => {
    if (activeProfile) updateProfile(activeProfile.id, { combatStyle: style });
    else setPreferences({ combatStyle: style });
  };

  const changeSlotFilter = (slot: "ALL" | GearType) => {
    setSlotFilter(slot);
    setStatusMessage(`${slot === "ALL" ? "All gear" : slotLabel(slot)} filter selected.`);
  };

  const selectGear = (view: GearView) => {
    setSelectedId(view.item.hashed_id);
    setCandidateTier(1);
    setMobileSelectionHint(`${view.item.name} comparison opened`);
    setStatusMessage(`${view.item.name} comparison opened.`);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1180px)").matches) {
      window.setTimeout(() => {
        comparePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  };

  const prefetchGearItem = (name: string) => {
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    prefetchItem(name);
  };

  const saveGearToProfile = (slot: string) => {
    if (!activeProfile || !selected) return;
    updateProfile(activeProfile.id, {
      gear: { ...activeProfile.gear, [slot]: selected.item.name },
      gearTiers: {
        ...activeProfile.gearTiers,
        [slot]: effectiveCandidateTier,
      },
    });
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
    setStatusMessage("Search focused.");
  };

  const showUsableRecommendations = () => {
    setUsableOnly(true);
    setStatusMessage("Usable gear filter enabled.");
    gearListPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jumpToComparison = () => {
    comparePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatusMessage(selected ? `${selected.item.name} comparison focused.` : "Comparison panel focused.");
  };

  useEffect(() => {
    if (!selected) return;
    setCandidateTier((value) => clampTier(value, selectedMaxTier) || 1);
  }, [selected, selectedMaxTier]);

  useEffect(() => {
    setCompareTier(clampTier(savedProfileTier, currentMaxTier) || 1);
  }, [currentProfileItem?.hashed_id, savedProfileTier, currentMaxTier]);

  return (
    <main className="container bis-page">
      <div className="sr-only" role="status" aria-live="polite">{statusMessage}</div>
      <div className="header bis-hero">
        <div className="bis-hero-copy">
          <div className="eyebrow"><ZenithIcon name="shield" size={15} /> Gear Recommender</div>
          <h1 className="header-title">Gear Recommender</h1>
          <p className="hero-copy">Profile-aware combat gear list with tier-by-tier stat comparison across every item stat.</p>
          <div className="bis-hero-chips" aria-label="Recommendation context">
            <span><Shield size={14} aria-hidden="true" /> {activeProfileName}</span>
            <span><Sword size={14} aria-hidden="true" /> {activeStyleLabel}</span>
            <span><Sparkles size={14} aria-hidden="true" /> {priorityLabel} ranking</span>
          </div>
          <div className="bis-quick-actions" aria-label="Gear recommender quick actions">
            <button type="button" onClick={focusSearch}>
              <Search size={15} aria-hidden="true" /> Search
            </button>
            <button type="button" onClick={showUsableRecommendations}>
              <Check size={15} aria-hidden="true" /> Usable
            </button>
            <button type="button" onClick={jumpToComparison}>
              <Gauge size={15} aria-hidden="true" /> Compare
            </button>
          </div>
        </div>
        <div className="hero-stat">
          <span>{dataSourceLabel}</span>
          <strong>{filteredGear.length.toLocaleString()} shown</strong>
          <div className="hero-stat-grid" aria-label="Gear recommendation summary">
            <span><small>Usable</small><b>{usableGearCount.toLocaleString()}</b></span>
            <span><small>Picks</small><b>{recommendationReadinessLabel}</b></span>
            <span><small>Set value</small><b>{formatGold(totalRecommendedCost)}</b></span>
          </div>
        </div>
      </div>

      <section className="bis-toolbar" aria-label="Gear controls">
        <label className="search-field">
          <span>Search</span>
          <div className="search-wrap">
            <Search size={17} aria-hidden="true" />
            <input ref={searchInputRef} aria-label="Search gear" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Gear, stat, rarity..." />
          </div>
        </label>

        <ControlGroup label="Style">
          {STYLE_OPTIONS.map((option) => (
            <button key={option.id} type="button" className={activeCombatStyle === option.id ? "is-active" : ""} aria-pressed={activeCombatStyle === option.id} onClick={() => setCombatStyle(option.id)}>
              {option.label}
            </button>
          ))}
        </ControlGroup>

        <ControlGroup label="Ranking">
          {PRIORITIES.map((option) => (
            <button key={option.id} type="button" className={priority === option.id ? "is-active" : ""} aria-pressed={priority === option.id} onClick={() => setPriority(option.id)}>
              {option.label}
            </button>
          ))}
        </ControlGroup>
      </section>

      <section className="level-strip" aria-label="Profile levels">
        {[
          ["combatLevel", "Combat", profileCombatLevel],
          ["strStat", "Strength", profileStrength],
          ["dexStat", "Dexterity", profileDexterity],
          ["defStat", "Defence", profileDefence],
        ].map(([key, label, value]) => (
          <label key={key}>
            <span>{label}</span>
            <input
              value={value}
              inputMode="numeric"
              aria-label={String(label)}
              onChange={(event) => handleLevelChange(key as "combatLevel" | "strStat" | "dexStat" | "defStat", event.target.value)}
            />
          </label>
        ))}
      </section>

      <section ref={recommendationPanelRef} className="recommendation-panel" aria-label="Current style picks">
        <div className="panel-title">
          <span><Sparkles size={16} /> Current Style Picks</span>
          <strong>{formatGold(totalRecommendedCost)}</strong>
        </div>
        <div className="recommendation-summary" aria-label="Recommendation readiness">
          <span><Shield size={15} aria-hidden="true" /> {recommendationReadinessLabel}</span>
          <span><Target size={15} aria-hidden="true" /> {priorityLabel} score</span>
          <span><ShoppingCart size={15} aria-hidden="true" /> {formatGold(totalRecommendedCost)} estimated</span>
        </div>
        <p className="ranking-note">Based on current levels, style, ranking priority, and base-tier stats. Compare tiers before saving.</p>
        <div className="recommendation-grid">
          {activeSlots.map((type) => {
            const view = recommendations[type];
            const multiplier = type === "DAGGER" && activeCombatStyle === "dualDaggers" ? "x2" : "";
            return (
              <button
                key={type}
                type="button"
                className="pick-card"
                aria-label={view ? `Compare ${view.item.name} for ${slotLabel(type)}` : `No eligible ${slotLabel(type)} pick`}
                onClick={() => view && selectGear(view)}
                disabled={!view}
              >
                <span className="slot-line">{SLOT_CONFIG[type].icon}{slotLabel(type)} {multiplier}</span>
                {view ? (
                  <>
                    <strong>{view.item.name}</strong>
                    <small>{view.item.quality} | Lv.{view.requirementLevel} | Max T{view.item.max_tier || 1}</small>
                  </>
                ) : (
                  <strong>No eligible item</strong>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bis-layout">
        <div ref={gearListPanelRef} className="gear-list-panel">
          <div className="list-command-strip" aria-label="Gear list status">
            <div>
              <span>Gear library</span>
              <strong>{filteredGear.length.toLocaleString()} matching</strong>
            </div>
            <span>{usableOnly ? `${usableGearCount.toLocaleString()} usable from profile levels` : "Showing usable and locked gear"}</span>
          </div>
          <div className="filter-row" aria-label="Gear filters">
            <div className="chip-scroll-shell">
            <div className="chip-scroll" aria-label="Slot filters">
              {SLOT_FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  ref={(element) => {
                    slotButtonRefs.current[option.id] = element;
                  }}
                  className={slotFilter === option.id ? "is-active" : ""}
                  aria-pressed={slotFilter === option.id}
                  onClick={() => changeSlotFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            </div>
            <button type="button" className={usableOnly ? "toggle is-active" : "toggle"} aria-pressed={usableOnly} onClick={() => setUsableOnly((value) => !value)}>
              <Check size={15} /> Usable
            </button>
          </div>

          <div className="sort-row" aria-label="Sort controls">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={sortKey === option.id ? "is-active" : ""}
                aria-pressed={sortKey === option.id}
                onClick={() => {
                  setSortKey(option.id);
                  if (option.id === "stats" || option.id === "quality") setDirection("desc");
                  if (option.id === "level" || option.id === "price" || option.id === "name") setDirection("asc");
                }}
              >
                {option.label}
              </button>
            ))}
            <button type="button" className="direction" aria-label={`Sort ${direction === "asc" ? "ascending" : "descending"}`} onClick={() => setDirection(direction === "asc" ? "desc" : "asc")}>
              {direction === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
              {direction === "asc" ? "Asc" : "Desc"}
            </button>
          </div>

          {mobileSelectionHint && <div className="selection-hint" role="status">{mobileSelectionHint}</div>}

          <p className="ranking-note list-note">List sorting uses base-tier stats. Use the comparison panel for candidate and saved tier differences.</p>

          <div className="gear-list" aria-label="Combat gear list">
            {visibleGear.map((view) => {
              const isSelected = selected?.item.hashed_id === view.item.hashed_id;
              return (
              <button
                key={view.item.hashed_id}
                type="button"
                className={isSelected ? "gear-row is-selected" : "gear-row"}
                aria-label={`Compare ${view.item.name}, ${slotLabel(view.item.type)}, level ${view.requirementLevel}, ${view.eligible ? "usable" : "locked"}`}
                aria-pressed={isSelected}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => selectGear(view)}
                onMouseEnter={() => prefetchGearItem(view.item.name)}
              >
                <img src={view.item.image_url || "/favicon.ico"} alt="" loading="lazy" decoding="async" />
                <span className="gear-main">
                  <strong>{view.item.name}</strong>
                  <small>
                    {slotLabel(view.item.type)} | Lv.{view.requirementLevel} | Max T{view.item.max_tier || 1}
                  </small>
                </span>
                <span className="gear-meta">
                  <strong>{formatGold(view.price)}</strong>
                  <small style={{ color: QUALITY_COLOR[view.item.quality] || "var(--text-muted)" }}>{view.item.quality}</small>
                </span>
                <span className={view.eligible ? "status ok" : "status locked"}>{view.eligible ? "Usable" : "Locked"}</span>
              </button>
            );})}
            {filteredGear.length === 0 && (
              <div className="empty-state">
                <strong>No gear matches these filters.</strong>
                <span>Try slot names like Helmet, rarity names, stat names, or aliases like hat, chest, gloves, and boots.</span>
              </div>
            )}
          </div>
          {visibleGear.length < filteredGear.length && (
            <div className="gear-list-more">
              <span>Showing {visibleGear.length.toLocaleString()} of {filteredGear.length.toLocaleString()} matching items.</span>
              <button type="button" onClick={() => setVisibleGearCount((count) => Math.min(filteredGear.length, count + INITIAL_VISIBLE_GEAR_ROWS))}>
                Show more gear
              </button>
            </div>
          )}
        </div>

        <aside ref={comparePanelRef} className="compare-panel" aria-label="Selected gear comparison">
          {selected ? (
            <>
              <div className="compare-head">
                <img src={selected.item.image_url || "/favicon.ico"} alt="" loading="eager" decoding="async" />
                <div>
                  <span style={{ color: QUALITY_COLOR[selected.item.quality] || "var(--text-muted)" }}>{selected.item.quality}</span>
                  <h2>{selected.item.name}</h2>
                  <p>{slotLabel(selected.item.type)} | Level {selected.requirementLevel} | {selected.priceLabel}</p>
                </div>
              </div>

              <div className="compare-stats compact">
                <Metric icon={<Layers size={16} />} label="Tier" value={`T${effectiveCandidateTier}/${selectedMaxTier}`} />
                <Metric icon={<Gauge size={16} />} label="Level" value={`Lv.${selected.requirementLevel}`} />
                <Metric icon={<ShoppingCart size={16} />} label="Value" value={formatGold(selected.price)} />
                <Metric icon={<Shield size={16} />} label="Status" value={selected.eligible ? "Usable" : "Locked"} />
              </div>

              <div className="tier-compare-grid">
                <TierStepper
                  label="Candidate tier"
                  value={candidateTier}
                  max={selectedMaxTier}
                  onChange={setCandidateTier}
                />
                {currentProfileItem ? (
                  <TierStepper
                    label="Saved gear tier"
                    value={compareTier}
                    max={currentMaxTier}
                    onChange={setCompareTier}
                  />
                ) : (
                  <div className="compare-empty-chip" role="note">
                    <span>Saved gear tier</span>
                    <strong>No saved item</strong>
                    <small>Save gear in this slot to compare tiers.</small>
                  </div>
                )}
              </div>

              {!selected.eligible && (
                <div className="notice danger">
                  Needs {selected.unmet.join(", ")}
                </div>
              )}

              <div className="current-box">
                <span>Profile comparison</span>
                <strong>{currentProfileItem ? currentProfileItem.name : "No saved item"}</strong>
                <small>{currentProfileItem ? `${slotLabel(currentProfileItem.type)} | T${effectiveCompareTier}/${currentMaxTier}` : "No profile gear saved in this slot yet."}</small>
              </div>

              <div className={`compare-result-strip ${comparisonTone}`} aria-label="Net stat comparison">
                <span>Net stat delta</span>
                <strong>{currentProfileItem ? `${selectedDeltaTotal > 0 ? "+" : ""}${selectedDeltaTotal.toLocaleString()}` : "No baseline"}</strong>
                <small>{comparisonSummaryLabel}</small>
              </div>

              <div className="stat-compare-table">
                <div className="stat-compare-head">
                  <span>Stat</span>
                  <span>Selected</span>
                  <span>Saved</span>
                  <span>Delta</span>
                </div>
                {statComparison.map((entry) => (
                  <div key={entry.key}>
                    <span>{formatStatName(entry.key)}</span>
                    <strong>{entry.candidate.toLocaleString()}</strong>
                    <strong>{entry.current.toLocaleString()}</strong>
                    <strong className={entry.delta >= 0 ? "positive" : "negative"}>{entry.delta > 0 ? "+" : ""}{entry.delta.toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div className="action-row">
                <button type="button" onClick={() => openItemByName(selected.item.name)}>
                  Item details <ExternalLink size={14} />
                </button>
                {activeProfile && selectedType === "DAGGER" && activeCombatStyle === "dualDaggers" ? (
                  <>
                    <button type="button" disabled={!selected.eligible} onClick={() => saveGearToProfile("weapon")}>Save main</button>
                    <button type="button" disabled={!selected.eligible} onClick={() => saveGearToProfile("offhandWeapon")}>Save offhand</button>
                  </>
                ) : activeProfile && selectedProfileSlot ? (
                  <button type="button" disabled={!selected.eligible} onClick={() => saveGearToProfile(selectedProfileSlot)}>Save to profile</button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="empty-state">Select a gear item to compare it.</div>
          )}
        </aside>
      </section>

      <style jsx global>{`
        .bis-page {
          max-width: 1680px;
        }
        .eyebrow,
        .panel-title,
        .slot-line {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }
        .eyebrow {
          color: var(--text-accent);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
        }
        .hero-copy {
          color: var(--text-muted);
          margin-top: -0.25rem;
          max-width: 760px;
        }
        .hero-stat {
          min-width: 210px;
          padding: 1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.13), rgba(14, 165, 233, 0.05));
        }
        .hero-stat span,
        .hero-stat strong {
          display: block;
        }
        .hero-stat span {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .hero-stat strong {
          color: var(--text-primary);
          font-size: 1.35rem;
          margin-top: 0.35rem;
        }
        .bis-toolbar,
        .level-strip,
        .recommendation-panel,
        .gear-list-panel,
        .compare-panel {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(15, 15, 18, 0.78);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
        }
        .bis-toolbar {
          display: grid;
          grid-template-columns: minmax(260px, 1.15fr) minmax(250px, 1fr) minmax(250px, 1fr);
          gap: 0.85rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .search-field,
        .tier-control,
        .level-strip label,
        .tier-stepper {
          display: grid;
          gap: 0.45rem;
          min-width: 0;
        }
        .search-field > span,
        .tier-control > span,
        .tier-stepper > span,
        .level-strip span,
        .control-group > span {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .search-wrap {
          position: relative;
        }
        .search-wrap svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-wrap input,
        .level-strip input,
        .tier-control input,
        .tier-stepper input {
          width: 100%;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.42);
          color: var(--text-primary);
          font: inherit;
          font-weight: 700;
          min-height: 46px;
        }
        .search-wrap input {
          padding: 0.75rem 0.9rem 0.75rem 2.45rem;
        }
        .level-strip input {
          padding: 0.7rem 0.8rem;
        }
        .control-group {
          min-width: 0;
          display: grid;
          gap: 0.45rem;
        }
        .control-group > div {
          min-width: 0;
        }
        .control-group div,
        .tier-control div,
        .tier-stepper div,
        .chip-scroll,
        .sort-row,
        .action-row {
          display: flex;
          gap: 0.45rem;
        }
        .bis-page button {
          min-height: 40px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
          color: var(--text-muted);
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease, transform 0.16s ease;
        }
        .bis-page button:hover:not(:disabled) {
          border-color: rgba(168, 139, 250, 0.55);
          color: var(--text-primary);
        }
        .bis-page button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .control-group button,
        .sort-row button,
        .chip-scroll button,
        .toggle,
        .direction {
          padding: 0.55rem 0.75rem;
          white-space: nowrap;
        }
        .control-group button {
          flex: 1 0 max-content;
          min-width: max-content;
        }
        .bis-page button.is-active,
        .toggle.is-active {
          color: #fff;
          border-color: rgba(168, 139, 250, 0.75);
          background: rgba(139, 92, 246, 0.34);
        }
        .tier-control div {
          align-items: center;
        }
        .tier-stepper div {
          align-items: center;
        }
        .tier-control button {
          width: 42px;
          flex: 0 0 auto;
        }
        .tier-stepper button {
          width: 42px;
          flex: 0 0 auto;
        }
        .tier-control input {
          text-align: center;
          padding: 0.65rem 0.2rem;
        }
        .tier-stepper input {
          text-align: center;
          padding: 0.65rem 0.2rem;
        }
        .tier-stepper small {
          color: var(--text-muted);
          font-size: 0.72rem;
        }
        .level-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.85rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .recommendation-panel {
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .panel-title {
          width: 100%;
          justify-content: space-between;
          color: var(--text-primary);
          font-weight: 900;
          margin-bottom: 0.85rem;
        }
        .panel-title span {
          color: var(--text-accent);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
        }
        .ranking-note {
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 700;
          line-height: 1.45;
          margin: -0.25rem 0 0.85rem;
        }
        .list-note {
          margin: 0 0 0.75rem;
        }
        .recommendation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 0.65rem;
        }
        .pick-card {
          text-align: left;
          padding: 0.85rem;
        }
        .pick-card strong,
        .pick-card small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pick-card strong {
          color: var(--text-primary);
          margin: 0.45rem 0 0.15rem;
        }
        .pick-card small,
        .slot-line {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .bis-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.75fr);
          gap: 1rem;
          align-items: start;
        }
        .gear-list-panel,
        .compare-panel {
          padding: 1rem;
          min-width: 0;
        }
        .filter-row,
        .sort-row {
          display: flex;
          gap: 0.55rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .chip-scroll-shell {
          flex: 1;
          min-width: 0;
          position: relative;
        }
        .chip-scroll-shell:before,
        .chip-scroll-shell:after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0.15rem;
          width: 1.6rem;
          pointer-events: none;
          z-index: 1;
        }
        .chip-scroll-shell:before {
          left: 0;
          background: linear-gradient(90deg, rgba(15, 15, 18, 0.94), transparent);
        }
        .chip-scroll-shell:after {
          right: 0;
          background: linear-gradient(270deg, rgba(15, 15, 18, 0.94), transparent);
        }
        .chip-scroll {
          align-items: center;
          overflow-x: auto;
          scrollbar-width: thin;
          padding: 0 1.9rem 0.15rem 0.15rem;
          min-width: 0;
          scroll-padding-inline: 1.8rem;
        }
        .chip-scroll button {
          flex: 0 0 auto;
          min-width: max-content;
        }
        .toggle,
        .direction {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          flex: 0 0 auto;
        }
        .selection-hint {
          display: none;
          margin-bottom: 0.75rem;
          padding: 0.75rem 0.85rem;
          border: 1px solid rgba(34, 211, 238, 0.35);
          border-radius: 8px;
          background: rgba(8, 145, 178, 0.14);
          color: var(--text-primary);
          font-weight: 800;
        }
        .sort-row {
          flex-wrap: wrap;
        }
        .gear-list {
          display: grid;
          gap: 0.55rem;
          max-height: 860px;
          overflow: auto;
          padding-right: 0.2rem;
        }
        .gear-list-more {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.8rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.72rem 0.85rem;
          background: rgba(255, 255, 255, 0.035);
          color: var(--text-muted);
          font-size: 0.86rem;
          font-weight: 800;
        }
        .gear-list-more span {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .gear-list-more button {
          flex: 0 0 auto;
        }
        .gear-row {
          display: grid;
          grid-template-columns: 54px minmax(0, 1fr) minmax(88px, 0.25fr) 82px;
          gap: 0.8rem;
          align-items: center;
          width: 100%;
          padding: 0.7rem;
          text-align: left;
        }
        .gear-row.is-selected {
          border-color: rgba(34, 211, 238, 0.75);
          background: rgba(8, 145, 178, 0.14);
        }
        .gear-row img,
        .compare-head img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
        }
        .gear-main,
        .gear-meta {
          display: grid;
          gap: 0.18rem;
          min-width: 0;
        }
        .gear-main strong,
        .gear-main small,
        .gear-meta strong,
        .gear-meta small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gear-main strong {
          color: var(--text-primary);
        }
        .gear-main small,
        .gear-meta small {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .gear-meta {
          text-align: right;
        }
        .gear-meta strong {
          color: var(--text-accent);
        }
        .status {
          justify-self: end;
          padding: 0.28rem 0.48rem;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 900;
        }
        .status.ok {
          color: #34d399;
          background: rgba(16, 185, 129, 0.13);
          border: 1px solid rgba(16, 185, 129, 0.28);
        }
        .status.locked {
          color: #fb7185;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.28);
        }
        .compare-panel {
          position: sticky;
          top: 1rem;
          scroll-margin-top: 6rem;
        }
        .compare-head {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .compare-head h2 {
          color: var(--text-primary);
          margin: 0.1rem 0;
          font-size: 1.35rem;
        }
        .compare-head span,
        .compare-head p,
        .current-box span,
        .current-box small {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 800;
        }
        .compare-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.65rem;
          margin: 1rem 0;
        }
        .compare-stats.compact {
          grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        }
        .tier-compare-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .compare-empty-chip {
          display: grid;
          gap: 0.3rem;
          min-width: 0;
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          padding: 0.75rem;
        }
        .compare-empty-chip span {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .compare-empty-chip strong {
          color: var(--text-primary);
        }
        .compare-empty-chip small {
          color: var(--text-muted);
          font-size: 0.75rem;
          line-height: 1.35;
        }
        .metric,
        .current-box,
        .notice,
        .delta-list div,
        .stat-pills span {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
        }
        .metric {
          padding: 0.75rem;
          display: grid;
          gap: 0.35rem;
          min-width: 0;
          align-content: start;
        }
        .metric span {
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .metric span svg {
          flex: 0 0 auto;
        }
        .metric strong,
        .current-box strong {
          color: var(--text-primary);
          min-width: 0;
          overflow-wrap: anywhere;
          line-height: 1.2;
        }
        .notice {
          padding: 0.8rem;
          margin-bottom: 1rem;
        }
        .notice.danger {
          color: #fecdd3;
          border-color: rgba(244, 63, 94, 0.35);
          background: rgba(244, 63, 94, 0.1);
        }
        .current-box {
          display: grid;
          gap: 0.25rem;
          padding: 0.85rem;
          margin-bottom: 0.85rem;
        }
        .delta-list {
          display: grid;
          gap: 0.45rem;
          margin-bottom: 0.85rem;
        }
        .delta-list div {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.6rem 0.75rem;
        }
        .delta-list span {
          color: var(--text-muted);
        }
        .stat-compare-table {
          display: grid;
          gap: 0.35rem;
          margin-bottom: 1rem;
          min-width: 0;
        }
        .stat-compare-table > div {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(56px, 74px) minmax(56px, 74px) minmax(56px, 74px);
          gap: 0.55rem;
          align-items: center;
          padding: 0.58rem 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
          min-width: 0;
        }
        .stat-compare-table .stat-compare-head {
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .stat-compare-table strong {
          text-align: right;
          color: var(--text-primary);
        }
        .stat-compare-table span {
          color: var(--text-muted);
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .stat-compare-table strong {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .positive {
          color: #34d399;
        }
        .negative {
          color: #fb7185;
        }
        .stat-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-bottom: 1rem;
        }
        .stat-pills span {
          color: var(--text-muted);
          padding: 0.45rem 0.6rem;
          font-size: 0.8rem;
        }
        .stat-pills strong {
          color: var(--text-primary);
        }
        .action-row {
          flex-wrap: wrap;
        }
        .action-row button {
          flex: 1 1 150px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 0.75rem;
          color: var(--text-primary);
        }
        .empty-state {
          padding: 1rem;
          color: var(--text-muted);
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          text-align: center;
        }
        .empty-state strong,
        .empty-state span {
          display: block;
        }
        .empty-state strong {
          color: var(--text-primary);
          margin-bottom: 0.3rem;
        }
        .empty-state span {
          line-height: 1.45;
        }
        @media (max-width: 1500px) {
          .bis-toolbar {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 1180px) {
          .bis-toolbar {
            grid-template-columns: 1fr;
          }
          .bis-layout {
            grid-template-columns: 1fr;
          }
          .compare-panel {
            position: static;
          }
        }
        @media (max-width: 1180px) {
          .selection-hint {
            display: block;
          }
        }
        @media (max-width: 760px) {
          .header {
            align-items: stretch;
          }
          .hero-stat {
            width: 100%;
          }
          .bis-toolbar,
          .level-strip {
            grid-template-columns: 1fr;
          }
          .control-group div {
            overflow-x: auto;
            padding-bottom: 0.1rem;
          }
          .recommendation-grid {
            grid-template-columns: 1fr;
          }
          .filter-row {
            align-items: stretch;
            flex-direction: column;
          }
          .chip-scroll-shell {
            width: 100%;
          }
          .gear-row {
            grid-template-columns: 46px minmax(0, 1fr) auto;
          }
          .gear-list-more {
            align-items: stretch;
            flex-direction: column;
          }
          .gear-list-more button {
            width: 100%;
          }
          .gear-row img {
            width: 42px;
            height: 42px;
          }
          .gear-meta {
            grid-column: 2 / 3;
            text-align: left;
          }
          .status {
            grid-column: 3 / 4;
            grid-row: 1 / 3;
            align-self: center;
          }
          .compare-stats {
            grid-template-columns: 1fr;
          }
          .compare-stats.compact,
          .tier-compare-grid {
            grid-template-columns: 1fr;
          }
          .stat-compare-table > div {
            grid-template-columns: minmax(0, 1fr) minmax(48px, 58px) minmax(48px, 58px) minmax(48px, 58px);
            gap: 0.4rem;
            font-size: 0.8rem;
          }
        }
        .bis-page {
          --bis-gold: #f5b041;
          --bis-mint: #34d399;
          --bis-sky: #38bdf8;
          --bis-rose: #fb7185;
          --bis-panel: rgba(9, 13, 18, 0.78);
          -webkit-tap-highlight-color: transparent;
          padding-bottom: clamp(5rem, 7vh, 7rem);
        }
        .bis-page :where(button, input, [role="button"]) {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .bis-page .bis-hero {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 370px);
          gap: clamp(1rem, 2vw, 1.5rem);
          align-items: stretch;
          border: 1px solid rgba(56, 189, 248, 0.18);
          border-radius: 8px;
          background:
            linear-gradient(145deg, rgba(56, 189, 248, 0.08), rgba(7, 12, 17, 0.88)),
            radial-gradient(circle at 88% 0%, rgba(245, 176, 65, 0.16), transparent 34%);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26);
          margin-bottom: 1rem;
          padding: clamp(1rem, 2.2vw, 1.45rem);
        }
        .bis-page .bis-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(115deg, rgba(245, 176, 65, 0.13), rgba(52, 211, 153, 0.05) 42%, transparent 68%),
            radial-gradient(circle at 8% 0%, rgba(56, 189, 248, 0.13), transparent 28%);
        }
        .bis-page .bis-hero > * {
          position: relative;
          z-index: 1;
        }
        .bis-page .bis-hero-copy {
          min-width: 0;
          display: grid;
          gap: 0.78rem;
          align-content: start;
        }
        .bis-page .bis-hero-copy .eyebrow,
        .bis-page .bis-hero-copy .hero-copy {
          margin: 0;
        }
        .bis-page .bis-hero-copy .hero-copy {
          max-width: 72ch;
          line-height: 1.62;
        }
        .bis-page .bis-hero-chips,
        .bis-page .bis-quick-actions,
        .bis-page .recommendation-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-width: 0;
        }
        .bis-page .bis-hero-chips span,
        .bis-page .recommendation-summary span {
          min-height: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          max-width: 100%;
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.08);
          color: #bae6fd;
          font-size: 0.74rem;
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1.15;
          padding: 0.45rem 0.72rem;
        }
        .bis-page .bis-hero-chips span:first-child,
        .bis-page .recommendation-summary span:first-child {
          border-color: rgba(52, 211, 153, 0.24);
          background: rgba(52, 211, 153, 0.09);
          color: #bbf7d0;
        }
        .bis-page .bis-hero-chips svg,
        .bis-page .recommendation-summary svg {
          flex: 0 0 auto;
          color: var(--bis-gold);
        }
        .bis-page .bis-quick-actions {
          margin-top: 0.08rem;
        }
        .bis-page .bis-quick-actions button {
          min-height: 2.45rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-color: rgba(245, 176, 65, 0.22);
          background: rgba(245, 176, 65, 0.08);
          color: #fde68a;
          padding: 0.62rem 0.86rem;
        }
        .bis-page .hero-stat {
          display: grid;
          gap: 0.78rem;
          border-color: rgba(56, 189, 248, 0.22);
          background:
            linear-gradient(145deg, rgba(56, 189, 248, 0.1), rgba(0, 0, 0, 0.26)),
            rgba(5, 10, 13, 0.54);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 56px rgba(0, 0, 0, 0.22);
        }
        .bis-page .hero-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.5rem;
        }
        .bis-page .hero-stat-grid span {
          min-width: 0;
          display: grid;
          gap: 0.18rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.045);
          padding: 0.55rem;
        }
        .bis-page .hero-stat-grid small,
        .bis-page .hero-stat-grid b {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bis-page .hero-stat-grid small {
          color: var(--text-muted);
          font-size: 0.66rem;
          font-weight: 850;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .bis-page .hero-stat-grid b {
          color: var(--text-primary);
          font-size: 0.84rem;
          line-height: 1.15;
        }
        .bis-page .bis-toolbar,
        .bis-page .level-strip,
        .bis-page .recommendation-panel,
        .bis-page .gear-list-panel,
        .bis-page .compare-panel {
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.046), rgba(0, 0, 0, 0.2)),
            var(--bis-panel);
          backdrop-filter: blur(16px);
        }
        .bis-page .recommendation-summary {
          margin: -0.2rem 0 0.85rem;
        }
        .bis-page .list-command-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
          border: 1px solid rgba(56, 189, 248, 0.16);
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.055);
          padding: 0.72rem 0.8rem;
        }
        .bis-page .list-command-strip div {
          min-width: 0;
          display: grid;
          gap: 0.18rem;
        }
        .bis-page .list-command-strip span {
          color: var(--text-muted);
          font-size: 0.74rem;
          font-weight: 850;
          line-height: 1.25;
        }
        .bis-page .list-command-strip strong {
          color: var(--text-primary);
          line-height: 1.2;
        }
        .bis-page .list-command-strip > span {
          flex: 0 1 auto;
          text-align: right;
        }
        .bis-page .compare-result-strip {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.25rem 0.7rem;
          align-items: center;
          margin: -0.1rem 0 0.9rem;
          border: 1px solid rgba(56, 189, 248, 0.18);
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.07);
          padding: 0.82rem;
        }
        .bis-page .compare-result-strip span,
        .bis-page .compare-result-strip small {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 850;
          line-height: 1.3;
        }
        .bis-page .compare-result-strip strong {
          color: var(--text-primary);
          font-size: 1.05rem;
          line-height: 1.15;
        }
        .bis-page .compare-result-strip small {
          grid-column: 1 / -1;
        }
        .bis-page .compare-result-strip.positive {
          border-color: rgba(52, 211, 153, 0.26);
          background: rgba(52, 211, 153, 0.08);
        }
        .bis-page .compare-result-strip.positive strong {
          color: var(--bis-mint);
        }
        .bis-page .compare-result-strip.negative {
          border-color: rgba(251, 113, 133, 0.28);
          background: rgba(251, 113, 133, 0.08);
        }
        .bis-page .compare-result-strip.negative strong {
          color: var(--bis-rose);
        }
        .bis-page .compare-result-strip.neutral strong {
          color: var(--bis-gold);
        }
        .bis-page .bis-toolbar,
        .bis-page .level-strip,
        .bis-page .recommendation-panel,
        .bis-page .gear-list-panel,
        .bis-page .compare-panel,
        .bis-page .pick-card,
        .bis-page .gear-row,
        .bis-page button {
          transition:
            transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            color 180ms ease;
        }
        .bis-page button:active:not(:disabled),
        .bis-page .gear-row:active,
        .bis-page .pick-card:active:not(:disabled) {
          transform: scale(0.985);
        }
        .bis-page button:hover:not(:disabled) {
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
        }
        .bis-page .bis-quick-actions button:hover:not(:disabled) {
          border-color: rgba(56, 189, 248, 0.38);
          background: rgba(56, 189, 248, 0.1);
          color: #e0f2fe;
        }
        .bis-page .gear-row.is-selected {
          box-shadow: inset 3px 0 0 var(--bis-sky), 0 14px 34px rgba(0, 0, 0, 0.18);
        }
        .bis-page .gear-row img,
        .bis-page .compare-head img {
          image-rendering: auto;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .bis-page .bis-quick-actions button:focus-visible,
        .bis-page button:focus-visible,
        .bis-page input:focus-visible,
        .bis-page .gear-row:focus-visible,
        .bis-page .pick-card:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--bis-sky), white 12%);
          outline-offset: 3px;
          box-shadow: 0 0 0 5px rgba(56, 189, 248, 0.11);
        }
        @media (hover: hover) and (pointer: fine) {
          .bis-page .recommendation-panel:hover,
          .bis-page .gear-list-panel:hover,
          .bis-page .compare-panel:hover,
          .bis-page .pick-card:hover:not(:disabled),
          .bis-page .gear-row:hover {
            transform: translateY(-1px);
            border-color: rgba(245, 176, 65, 0.22);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bis-page *,
          .bis-page *::before,
          .bis-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
        @media (max-width: 1180px) {
          .bis-page .bis-hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .bis-page .hero-stat-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .bis-page {
            padding-bottom: 9rem;
          }
          .bis-page .bis-hero {
            margin-left: -0.15rem;
            margin-right: -0.15rem;
            padding: 1rem;
          }
          .bis-page .bis-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .bis-page .bis-quick-actions button {
            min-width: 0;
            padding-inline: 0.55rem;
          }
          .bis-page .hero-stat-grid,
          .bis-page .list-command-strip {
            grid-template-columns: minmax(0, 1fr);
          }
          .bis-page .list-command-strip {
            display: grid;
          }
          .bis-page .list-command-strip > span {
            text-align: left;
          }
          .bis-page .bis-hero-chips span,
          .bis-page .recommendation-summary span {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="control-group">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <span>{icon}{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TierStepper({
  label,
  value,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number | "";
  max: number;
  disabled?: boolean;
  onChange: (value: number | "") => void;
}) {
  const numericValue = clampTier(value, max) || 1;
  return (
    <label className="tier-stepper">
      <span>{label}</span>
      <div>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={disabled || numericValue <= 1}
          onClick={() => onChange(clampTier(numericValue - 1, max))}
        >
          -
        </button>
        <input
          value={disabled ? "" : value}
          disabled={disabled}
          inputMode="numeric"
          aria-label={label}
          placeholder="-"
          onChange={(event) => {
            const next = event.target.value;
            onChange(next === "" ? "" : clampTier(Number(next || 1), max));
          }}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={disabled || numericValue >= max}
          onClick={() => onChange(clampTier(numericValue + 1, max))}
        >
          +
        </button>
      </div>
      <small>{disabled ? "No saved item" : `Max ${max}`}</small>
    </label>
  );
}
