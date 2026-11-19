"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { useItemModal } from "@/context/ItemModalContext";
import { useData } from "@/context/DataContext";
import { calculateGearStats } from "@/lib/profile-calculations";
import { getQualityRank } from "@/lib/quality";
import {
  activeStyleSlots,
  clampTier,
  COMBAT_TYPES,
  compareBestGear,
  compareStats,
  evaluateScore,
  getPrice,
  getRequirementLevel,
  INITIAL_VISIBLE_GEAR_ROWS,
  normalizeCombatStyle,
  numberValue,
  profileSlotForType,
  requirementStatus,
  SEARCH_ALIASES,
  slotLabel,
  STYLE_OPTIONS,
  totalPositiveStats,
  type CombatStyle,
  type Direction,
  type GearItem,
  type GearType,
  type GearView,
  type Priority,
  type SortKey,
  type UseBisStateReturn,
} from "../types";

export function useBisState(): UseBisStateReturn {
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
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
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

  return {
    comparePanelRef,
    recommendationPanelRef,
    gearListPanelRef,
    searchInputRef,
    slotButtonRefs,
    search,
    setSearch,
    slotFilter,
    setSlotFilter,
    usableOnly,
    setUsableOnly,
    priority,
    setPriority,
    sortKey,
    setSortKey,
    direction,
    setDirection,
    selectedId,
    candidateTier,
    setCandidateTier,
    compareTier,
    setCompareTier,
    visibleGearCount,
    setVisibleGearCount,
    mobileSelectionHint,
    statusMessage,
    activeProfile,
    profileCombatLevel,
    profileStrength,
    profileDexterity,
    profileDefence,
    activeCombatStyle,
    levels,
    activeSlots,
    gearViews,
    recommendations,
    filteredGear,
    visibleGear,
    selected,
    selectedType,
    selectedProfileSlot,
    currentProfileItem,
    effectiveCandidateTier,
    effectiveCompareTier,
    selectedMaxTier,
    currentMaxTier,
    candidateStats,
    currentStats,
    statComparison,
    totalRecommendedCost,
    activeProfileName,
    activeStyleLabel,
    priorityLabel,
    usableGearCount,
    recommendedSlotCount,
    recommendationReadinessLabel,
    selectedDeltaTotal,
    positiveDeltaCount,
    negativeDeltaCount,
    comparisonTone,
    comparisonSummaryLabel,
    dataSourceLabel,
    handleLevelChange,
    setCombatStyle,
    changeSlotFilter,
    selectGear,
    prefetchGearItem,
    openItemByName,
    saveGearToProfile,
    focusSearch,
    showUsableRecommendations,
    jumpToComparison,
  };
}
