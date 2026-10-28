"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { getProfileSkillLevel } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
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
  type EssenceSession,
  type EssenceSkillName,
} from "@/lib/essences";
import {
  DEFAULT_TOOL_SELECTIONS,
  GearData,
  ItemRegistry,
  SKILLS,
  SkillName,
  SkillProfitRow,
  SkillProfitSettings,
  buildForgeRecipes,
  calculateSkillProfitRows,
  getBuffTotals,
} from "@/lib/skill-profit";
import {
  SALE_MODE_OPTIONS,
  getRankedProfitPerHour,
  getSortValue,
  isExcludedFromTop,
  isLiquid,
  rowMatchesSearch,
  type SkillProfitRowModel,
  type UseSkillProfitCalculationsReturn,
  type UseSkillProfitStateReturn,
} from "../types";

export function useSkillProfitCalculations(state: UseSkillProfitStateReturn): UseSkillProfitCalculationsReturn {
  const { marketData, allItemsDb, itemRegistry } = useData();
  const [gearData, setGearData] = useState<GearData | null>(null);

  const {
    settings,
    activeSkill,
    sortKey,
    sortDesc,
    searchTokens,
    minVolume,
    hideAboveLevel,
    includeForgeInfoRows,
    compactResults,
    visibleRowLimit,
    configuredProfile,
    preferences,
    profileLabel,
  } = state;

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
    () => calculateHousingBuffs(configuredProfile?.housing, { profileClassName: configuredProfile?.className }),
    [configuredProfile?.className, configuredProfile?.housing],
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

  const baseIdleActionHours = configuredProfile ? getProfileBaseIdleActionHours(configuredProfile, preferences.membership) : 8;

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

  const effectiveSettings = useMemo<SkillProfitSettings>(() => {
    const base = {
      membership: preferences.membership,
      saleMode: settings.saleMode,
      energizingPoolExp: settings.energizingPoolExp,
      ascensionBuffIds: settings.ascensionBuffIds,
      customPrices: preferences.customPrices,
      essenceBySkill: settings.essenceBySkill,
      essenceBuffsBySkill,
      essencePricesBySkill,
      idleActionHoursBySkill,
    };
    if (!configuredProfile) {
      return {
        ...base,
        tools: { ...DEFAULT_TOOL_SELECTIONS, ...preferences.skillTools },
        classBonus: preferences.skillClassBonus,
        barteringBoost: Number(preferences.barteringBoost || 0),
        assaultRank: preferences.assaultRank,
        profileClassName: undefined,
      };
    }
    return {
      ...base,
      tools: {
        Woodcutting: configuredProfile.tools?.woodcutting ?? "",
        Mining: configuredProfile.tools?.mining ?? "",
        Fishing: configuredProfile.tools?.fishing ?? "",
      },
      classBonus: false,
      barteringBoost: getProfileBarteringBoost(configuredProfile),
      assaultRank: getProfileConquestRank(configuredProfile),
      profileClassName: configuredProfile.className,
    };
  }, [
    configuredProfile,
    essenceBuffsBySkill,
    essencePricesBySkill,
    idleActionHoursBySkill,
    preferences.assaultRank,
    preferences.barteringBoost,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
    settings.ascensionBuffIds,
    settings.energizingPoolExp,
    settings.essenceBySkill,
    settings.saleMode,
  ]);

  const effectiveToolSelections = effectiveSettings.tools;
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

  const rowModel = useMemo<SkillProfitRowModel>(() => {
    const topBySkill = new Map<SkillName, SkillProfitRow>();
    let topOverall: SkillProfitRow | null = null;

    for (const row of rows) {
      if (!isExcludedFromTop(row, minVolume)) {
        if (hideAboveLevel && configuredProfile) {
          const playerLevel = getProfileSkillLevel(configuredProfile, row.skill);
          if (playerLevel !== null && row.level > playerLevel) continue;
        }
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
      .filter((row) => {
        if (!hideAboveLevel || !configuredProfile) return true;
        const playerLevel = getProfileSkillLevel(configuredProfile, row.skill);
        if (playerLevel === null) return true;
        return row.level <= playerLevel;
      })
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
  }, [activeSkill, configuredProfile, hideAboveLevel, includeForgeInfoRows, minVolume, rows, searchTokens, sortDesc, sortKey]);

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

  const housingWindowAllValue = !configuredProfile
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

  const housingWindowAllSub = !configuredProfile
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

  const housingWindowSub = !configuredProfile
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

  const saleModeLabel = SALE_MODE_OPTIONS.find((option) => option.value === (settings.saleMode || "best"))?.label || "Auto";
  const scopeLabel = activeSkill === "All" ? "All skills" : activeSkill;

  return {
    rows,
    rowModel,
    visibleRows,
    hiddenRowCount,
    liquidRouteCount,
    needsPriceCount,
    effectiveSettings,
    effectiveToolSelections,
    buffTotals,
    marketData,
    allItemsDb,
    itemRegistry,
    marketAgeMinutes,
    profileLabel,
    scopeLabel,
    saleModeLabel,
    housingSummary,
    housingIdleHoursBySkill,
    rawHousingIdleHoursBySkill,
    baseIdleActionHours,
    idleActionHoursBySkill,
    appliedHousingWindows,
    rawHousingWindows,
    visibleHousingWindows,
    activeSkillHousingHours,
    activeSkillHousingLabel,
    housingWindowSub,
    housingWindowAllValue,
    housingWindowAllSub,
    hasAnyLocationLimitedHousing,
    essenceSessionsBySkill,
    activeEssenceCount,
    forgeRecipes,
    searchTokens,
  };
}
