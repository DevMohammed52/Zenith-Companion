"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import {
  calculateEssenceSession,
  getEssenceBuffForSkill,
  getEssenceOptionsForSkill,
} from "@/lib/essences";
import { usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import {
  formatCondition,
  formatGoldUnit,
  formatHours,
  formatPayback,
  formatSignedGold,
  formatStarts,
} from "@/lib/format";
import {
  HOUSING_ACTIVITY_TO_SKILL,
  HOUSING_COMPONENTS,
  calculateRoomProfitProjection,
  calculateHousingBuffs,
  canUseHousingGuestAccess,
  estimateHousingRepairCostSummary,
  getComponentBuildCost,
  getHousingBuildCostSummary,
  getHousingActivityLabel,
  getProfileBaseIdleActionHours,
  normalizeHousingCondition,
  normalizeHousingRepairGold,
  sanitizeHousing,
  type HousingActivity,
  type HousingCostEntry,
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
import {
  BUFF_ACTIVITIES,
  HOUSING_TABS,
  REPAIR_DECAY_DAYS,
  ROOM_PROFIT_BASE_HORIZONS,
  formatCostStatus,
  getConditionFromRepairGold,
  priceForItem,
  type HousingTab,
  type RepairConditionCard,
} from "../types";

export function useHousingState() {
  const { activeProfile, updateProfile } = useProfiles();
  const { marketData, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "idle" | "special" | "guest">("all");
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [draftTiers, setDraftTiers] = useState<Record<string, string>>({});
  const [conditionDrafts, setConditionDrafts] = useState<Record<string, string>>({});
  const [conditionSliderDrafts, setConditionSliderDrafts] = useState<Record<string, number>>({});
  const [undoHousing, setUndoHousing] = useState<{ profileId: string; label: string; housing: ProfileHousing } | null>(null);
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
    const activeTab = tabButtonRefs.current[activeHousingTab];
    if (!activeTab) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    activeTab.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
  }, [activeHousingTab]);

  useEffect(() => {
    if (!undoHousing) return undefined;
    const timeout = setTimeout(() => setUndoHousing(null), 9000);
    return () => clearTimeout(timeout);
  }, [undoHousing]);

  useEffect(() => {
    setUndoHousing(null);
    setDraftTiers({});
    setConditionDrafts({});
    setConditionSliderDrafts({});
    setOpenPicker(null);
  }, [activeProfile?.id]);

  const plannerRoomVariants = useMemo(() => (
    HOUSING_COMPONENTS
      .filter((component) => component.category === "idle" && component.family === profitPlannerFamily)
      .sort((a, b) => Number(a.tier || 0) - Number(b.tier || 0))
  ), [profitPlannerFamily]);
  const plannerActivity = plannerRoomVariants[0]?.activity || null;
  const plannerSkill = plannerActivity ? HOUSING_ACTIVITY_TO_SKILL[plannerActivity] || null : null;
  const plannerBaseIdleHours = getProfileBaseIdleActionHours(activeProfile, preferences.membership);
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
  const activeProfileName = activeProfile?.name?.trim() || "No profile";
  const housingModeLabel = housing.mode === "owner" ? "Owner house" : housing.mode === "guest" ? "Guest access" : "Housing paused";
  const housingScopeLabel = summary.availableAnywhere
    ? "Available anywhere"
    : housing.mode !== "none"
      ? `Local to ${housing.location || "housing location"}`
      : "Inactive";
  const housingReadinessLabel = housing.mode === "owner"
    ? housing.foundationBuilt
      ? `${summary.freeSlots.toLocaleString()} free slot${summary.freeSlots === 1 ? "" : "s"}`
      : "Foundation needed"
    : housing.mode === "guest"
      ? summary.availableAnywhere ? "Remote guest buffs" : "Local guest buffs"
      : "Buffs paused";

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
    if (!activeProfile) return;
    setUndoHousing({ profileId: activeProfile.id, label, housing });
  };

  const restoreHousingUndo = () => {
    if (!activeProfile || !undoHousing || undoHousing.profileId !== activeProfile.id) return;
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

  const focusHousingTab = (tabId: HousingTab) => {
    setActiveHousingTab(tabId);
    window.requestAnimationFrame(() => tabButtonRefs.current[tabId]?.focus());
  };

  const handleHousingTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, tabIndex: number) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = HOUSING_TABS.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? (tabIndex + 1) % HOUSING_TABS.length
          : (tabIndex - 1 + HOUSING_TABS.length) % HOUSING_TABS.length;
    focusHousingTab(HOUSING_TABS[nextIndex].id);
  };

  return {
    activeProfile,
    updateProfile,
    search,
    setSearch,
    category,
    setCategory,
    openPicker,
    setOpenPicker,
    draftTiers,
    conditionDrafts,
    conditionSliderDrafts,
    undoHousing,
    tabButtonRefs,
    profitPlannerFamily,
    setProfitPlannerFamily,
    profitPlannerRoute,
    setProfitPlannerRoute,
    profitPlannerEssence,
    setProfitPlannerEssence,
    roomCostShare,
    setRoomCostShare,
    activeHousingTab,
    setActiveHousingTab,
    housing,
    summary,
    selected,
    ownerSlotsAvailable,
    repairDecayDays,
    componentConditions,
    componentRepairGold,
    roomProfitHorizons,
    profitDataActive,
    materialPrices,
    foundationComponent,
    slotComponent,
    selectedSetupEntries,
    selectedBuildCost,
    repairSetupEntries,
    selectedRepairEstimate,
    selectedCostStatus,
    selectedCostLabel,
    selectedComponentDetails,
    repairConditionCards,
    slotOverage,
    componentGroups,
    idleRoomFamilies,
    plannerRoomVariants,
    plannerActivity,
    plannerSkill,
    plannerBaseIdleHours,
    plannerPlaytimeHours,
    plannerOfflineHours,
    selectedEssenceSession,
    selectedEssenceHasPrice,
    selectedEssenceCost,
    selectedEssenceBuff,
    routeRows,
    selectedRoute,
    essenceOptions,
    existingRoomFamilyId,
    selectedRoomFamilyCount,
    plannerSlotNeeded,
    foundationCost,
    slotCost,
    plannerRows,
    plannerTopTierRow,
    activeIdleBuffs,
    strongestBonusLabel,
    guestHostLabel,
    canUseGuestAccess,
    guestBlockedClass,
    guestHasLocationLimitedBuffs,
    activeProfileName,
    housingModeLabel,
    housingScopeLabel,
    housingReadinessLabel,
    saveHousing,
    restoreHousingUndo,
    toggleFoundation,
    setExtraSlots,
    toggleComponent,
    removeComponent,
    setComponentTier,
    updateComponentCondition,
    updateComponentConditionInput,
    updateComponentConditionSliderDraft,
    commitComponentConditionSliderDraft,
    resetComponentConditionInput,
    updateComponentRepairGold,
    updateGuestBuff,
    focusHousingTab,
    handleHousingTabKeyDown,
  };
}

export type HousingState = ReturnType<typeof useHousingState>;
