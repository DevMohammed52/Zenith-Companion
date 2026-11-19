"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { useCrafting } from "@/context/CraftingContext";
import {
  FORGE_PLANNER_STORAGE_KEY,
  sanitizeForgePlannerLines,
  type ForgePlannerLine,
} from "@/lib/forge-planner";
import { usePreferences } from "@/lib/preferences";
import { isStarterProfile, useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  calculateSkillProfitRows,
  DEFAULT_TOOL_SELECTIONS,
  SKILLS,
  type SkillName,
  type SkillProfitRow,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import { calculateCraftingQueuePlan } from "@/lib/crafting-queue";
import {
  SKILL_TO_HOUSING_ACTIVITY,
  calculateHousingBuffs,
  getProfileBaseIdleActionHours,
} from "@/lib/housing";
import {
  SUPPORTED_ESSENCE_SKILLS,
  calculateEssenceSession,
  type EssenceSession,
  type EssenceSkillName,
} from "@/lib/essences";
import { MYTHIC_ACTIVE_RECIPES_STORAGE_KEY } from "@/lib/mythic-alchemy";
import {
  DEFAULT_INDEXED_ITEMS_COUNT,
  DEFAULT_PERSISTED_SKILL_PROFIT,
  DELAYED_THRESHOLD_MINUTES,
  getRankedProfitPerHour,
  readMythicNamesFromKey,
  readSkillProfitStateFromKey,
  SKILL_PROFIT_STORAGE_KEY,
  type PersistedSkillProfitDashboardState,
  type UseDashboardStateReturn,
} from "../types";

export function useDashboardState(): UseDashboardStateReturn {
  const { preferences } = usePreferences();
  const { activeProfile, state: profileState, loaded: profilesLoaded } = useProfiles();
  const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;
  const needsProfileSetup = !configuredProfile;
  const { queue } = useCrafting();
  const { marketData, allItemsDb, ensureMarketLoaded } = useData({ autoLoad: false });
  const { ensureLoaded } = useData({ autoLoad: false });

  const [now, setNow] = useState(() => Date.now());
  const [activeMythicNames, setActiveMythicNames] = useState<string[]>([]);
  const [forgeLines, setForgeLines] = useState<ForgePlannerLine[]>([]);
  const [persistedSkillProfit, setPersistedSkillProfit] = useState<PersistedSkillProfitDashboardState>(
    DEFAULT_PERSISTED_SKILL_PROFIT,
  );

  const activeMythicStorageKey = useMemo(
    () => getProfileStorageKey(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );
  const skillProfitStorageKey = useMemo(
    () => getProfileStorageKey(SKILL_PROFIT_STORAGE_KEY, activeProfile?.id) ?? SKILL_PROFIT_STORAGE_KEY,
    [activeProfile?.id],
  );
  const housingSummary = useMemo(
    () => calculateHousingBuffs(activeProfile?.housing, { profileClassName: activeProfile?.className }),
    [activeProfile?.className, activeProfile?.housing],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profilesLoaded || typeof document === "undefined") return;
    document.documentElement.dataset.profileSetup = needsProfileSetup ? "needed" : "ready";
  }, [needsProfileSetup, profilesLoaded]);

  const syncLocalDashboardStorage = useCallback(() => {
    setActiveMythicNames(
      readMythicNamesFromKey(activeMythicStorageKey)
        ?? readMythicNamesFromKey(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY)
        ?? [],
    );

    try {
      const savedForge = localStorage.getItem(FORGE_PLANNER_STORAGE_KEY);
      if (!savedForge) {
        setForgeLines([]);
      } else {
        const parsed = JSON.parse(savedForge);
        setForgeLines(sanitizeForgePlannerLines(parsed?.lines));
      }
    } catch {
      setForgeLines([]);
    }

    setPersistedSkillProfit(
      readSkillProfitStateFromKey(skillProfitStorageKey)
        ?? readSkillProfitStateFromKey(SKILL_PROFIT_STORAGE_KEY)
        ?? DEFAULT_PERSISTED_SKILL_PROFIT,
    );
  }, [activeMythicStorageKey, skillProfitStorageKey]);

  useEffect(() => {
    syncLocalDashboardStorage();
    const handleStorage = (event: StorageEvent) => {
      if (
        !event.key ||
        event.key === activeMythicStorageKey ||
        event.key === MYTHIC_ACTIVE_RECIPES_STORAGE_KEY ||
        event.key === FORGE_PLANNER_STORAGE_KEY ||
        event.key === skillProfitStorageKey ||
        event.key === SKILL_PROFIT_STORAGE_KEY
      ) {
        syncLocalDashboardStorage();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [activeMythicStorageKey, skillProfitStorageKey, syncLocalDashboardStorage]);

  const hasConfiguredEssence = useMemo(
    () => SUPPORTED_ESSENCE_SKILLS.some((skill) => Boolean(persistedSkillProfit.essenceBySkill?.[skill])),
    [persistedSkillProfit.essenceBySkill],
  );

  useEffect(() => {
    void ensureMarketLoaded();
  }, [ensureMarketLoaded]);

  useEffect(() => {
    if (hasConfiguredEssence && !allItemsDb) {
      void ensureLoaded();
    }
  }, [allItemsDb, ensureLoaded, hasConfiguredEssence]);

  const housingIdleHoursBySkill = useMemo(
    () => Object.fromEntries(SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      return [skill, activity ? Number(housingSummary.idleHours[activity] || 0) : 0];
    })) as Partial<Record<SkillName, number>>,
    [housingSummary],
  );

  const baseIdleActionHours = configuredProfile ? getProfileBaseIdleActionHours(configuredProfile, preferences.membership) : 8;

  const idleActionHoursBySkill = useMemo(
    () => Object.fromEntries(SKILLS.map((skill) => [
      skill,
      baseIdleActionHours + Number(housingIdleHoursBySkill[skill] || 0),
    ])) as Partial<Record<SkillName, number>>,
    [baseIdleActionHours, housingIdleHoursBySkill],
  );

  const essenceSessionsBySkill = useMemo(() => {
    const entries = SUPPORTED_ESSENCE_SKILLS.map((skill) => [
      skill,
      calculateEssenceSession({
        essenceName: persistedSkillProfit.essenceBySkill?.[skill] || "",
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
    persistedSkillProfit.essenceBySkill,
    preferences.customPrices,
  ]);

  const skillProfitSettings = useMemo<SkillProfitSettings>(() => {
    const essenceBuffsBySkill: SkillProfitSettings["essenceBuffsBySkill"] = {};
    const essencePricesBySkill: SkillProfitSettings["essencePricesBySkill"] = {};
    for (const skill of SUPPORTED_ESSENCE_SKILLS) {
      const session = essenceSessionsBySkill[skill];
      if (session?.buff) essenceBuffsBySkill[skill] = session.buff;
      if (session?.price) essencePricesBySkill[skill] = session.price;
    }

    return {
      membership: preferences.membership,
      classBonus: configuredProfile ? false : preferences.skillClassBonus,
      saleMode: persistedSkillProfit.saleMode,
      profileClassName: configuredProfile?.className || undefined,
      energizingPoolExp: persistedSkillProfit.energizingPoolExp,
      assaultRank: configuredProfile ? getProfileConquestRank(configuredProfile) : preferences.assaultRank,
      ascensionBuffIds: persistedSkillProfit.ascensionBuffIds,
      tools: configuredProfile
        ? {
            Woodcutting: configuredProfile.tools.woodcutting ?? "",
            Mining: configuredProfile.tools.mining ?? "",
            Fishing: configuredProfile.tools.fishing ?? "",
          }
        : {
            ...DEFAULT_TOOL_SELECTIONS,
            ...preferences.skillTools,
          },
      customPrices: preferences.customPrices,
      barteringBoost: configuredProfile
        ? getProfileBarteringBoost(configuredProfile)
        : Number(preferences.barteringBoost !== "" ? preferences.barteringBoost : persistedSkillProfit.barteringBoost) || 0,
      housingIdleHoursBySkill,
      essenceBySkill: persistedSkillProfit.essenceBySkill,
      essenceBuffsBySkill,
      essencePricesBySkill,
      idleActionHoursBySkill,
    };
  }, [
    configuredProfile,
    essenceSessionsBySkill,
    housingIdleHoursBySkill,
    idleActionHoursBySkill,
    persistedSkillProfit.ascensionBuffIds,
    persistedSkillProfit.barteringBoost,
    persistedSkillProfit.energizingPoolExp,
    persistedSkillProfit.essenceBySkill,
    persistedSkillProfit.saleMode,
    preferences.assaultRank,
    preferences.barteringBoost,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
  ]);

  const bestSkillRoute = useMemo(() => {
    if (!marketData) return null;
    const minVolume = persistedSkillProfit.minVolume;
    const rows = calculateSkillProfitRows(marketData, allItemsDb, skillProfitSettings, [], minVolume);
    let best: SkillProfitRow | null = null;
    for (const row of rows) {
      const rankedProfit = getRankedProfitPerHour(row);
      if (row.skill === "Forge" || row.saleSource === "missing" || rankedProfit <= 0) continue;
      const excludedByLiquidity = row.saleSource === "market" ? (!row.isLiquid || row.stableVolume3d < minVolume) : false;
      if (excludedByLiquidity) continue;
      if (!best || rankedProfit > getRankedProfitPerHour(best)) best = row;
    }
    return best;
  }, [allItemsDb, marketData, persistedSkillProfit.minVolume, skillProfitSettings]);

  const queuePlan = useMemo(
    () => calculateCraftingQueuePlan(queue, marketData, allItemsDb, {
      ...preferences,
      barteringBoost: configuredProfile ? getProfileBarteringBoost(configuredProfile) : Number(preferences.barteringBoost || 0),
    }),
    [allItemsDb, configuredProfile, marketData, preferences, queue],
  );

  const forgeCraftsCount = useMemo(
    () => forgeLines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity) || 0), 0),
    [forgeLines],
  );

  const lastUpdated = marketData?._meta?.last_updated;
  const lastUpdatedMs = lastUpdated ? new Date(lastUpdated).getTime() : NaN;
  const timeSince = Number.isFinite(lastUpdatedMs) ? Math.max(0, Math.floor((now - lastUpdatedMs) / 60_000)) : null;
  const registryCount = allItemsDb ? Object.keys(allItemsDb).length : DEFAULT_INDEXED_ITEMS_COUNT;
  const marketFreshness = timeSince === null
    ? "Loading snapshot"
    : timeSince < DELAYED_THRESHOLD_MINUTES
      ? "Current"
      : "Stale (>2.5h)";
  const registryCountLabel = "items indexed";
  const hasStarterProfile = Boolean(activeProfile && isStarterProfile(activeProfile));
  const activeProfileLabel = hasStarterProfile ? "Starter profile" : activeProfile?.name?.trim() || "No profile";
  const profileDetail = hasStarterProfile
    ? "Set character stats for exact math"
    : activeProfile
      ? `${activeProfile.className || "Character"} profile active`
      : `${profileState.profiles.length}/5 saved profiles`;

  const isOwnerWithoutFoundation = housingSummary.mode === "owner" && !activeProfile?.housing?.foundationBuilt;
  const housingLabel = housingSummary.mode === "none"
    ? "Not configured"
    : isOwnerWithoutFoundation
      ? "Foundation needed"
      : housingSummary.activeComponentCount === 0
        ? "No active buffs"
        : housingSummary.mode === "guest"
          ? `${housingSummary.activeComponentCount} guest buff${housingSummary.activeComponentCount === 1 ? "" : "s"}`
          : `${housingSummary.activeComponentCount}/${housingSummary.slotCapacity || 0} slots`;
  const housingDescription = housingSummary.mode === "none"
    ? "Set owner or guest rooms for idle timer buffs."
    : isOwnerWithoutFoundation
      ? "Build a Foundation to unlock room slots and idle timers."
      : housingSummary.activeComponentCount === 0
        ? "No active buffs selected for this house."
        : housingSummary.locationLimited
          ? "Local zone only (no Remote Conduit)."
          : "Remote Conduit active — buffs apply in all zones.";

  return {
    activeProfile,
    profileState,
    profilesLoaded,
    configuredProfile,
    needsProfileSetup,
    activeMythicNames,
    forgeLines,
    persistedSkillProfit,
    housingSummary,
    skillProfitSettings,
    bestSkillRoute,
    queuePlan,
    forgeCraftsCount,
    timeSince,
    registryCount,
    marketFreshness,
    registryCountLabel,
    activeProfileLabel,
    profileDetail,
    housingLabel,
    housingDescription,
  };
}
