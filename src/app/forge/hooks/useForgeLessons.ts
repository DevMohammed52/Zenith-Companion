"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import rawMaterials from "@/data/normalized-forge-materials.json";
import rawXpLevels from "@/data/skill-xp-levels.json";
import { getProfileSkillLevel, isStarterProfile, useProfiles } from "@/lib/profiles";
import { usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { getSafeMarketPrice } from "@/lib/market-pricing";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  FORGE_OWNED_STORAGE_KEY,
  FORGE_OWNED_SYNC_EVENT,
  type CalculatedLessonMaterial,
  type ForgeLessonCategory,
  type ForgeLessonMaterial,
  type ForgeLessonSort,
  type GoalEstimateResult,
  type GoalProgressionStep,
  type LessonSessionSummary,
  type QueuedLessonItem,
} from "../types";

import {
  calculateDynamicMaterialYield,
  getForgeHourlyRate,
  QUALITY_SPEED_MULTIPLIERS,
} from "@/lib/forge-lesson-math";

export { FORGE_OWNED_STORAGE_KEY };
export const MAX_OFFLINE_SECONDS = 12 * 3600; // Up to 12 hours max session cap (housing + membership)
export const FORGE_LESSON_QUEUE_STORAGE_KEY = "zenith_forge_lesson_queue_v1";
export const FORGE_LESSON_DURATION_STORAGE_KEY = "zenith_forge_lesson_duration_v1";
export const FORGE_LESSON_BUFFS_STORAGE_KEY = "zenith_forge_lesson_buffs_v1";
export const FORGE_LESSON_GOAL_STORAGE_KEY = "zenith_forge_lesson_goal_v1";

const xpTable = rawXpLevels as Record<string, { level: number; expForNextLevel: number; totalExpToReach: number }>;

export function calculateLessonMaterialEfficiency(
  mat: ForgeLessonMaterial,
  playerLevel: number,
  buffMultiplier: number = 1.0,
  livePriceOverride?: number
): CalculatedLessonMaterial {
  const resolvedPrice = livePriceOverride !== undefined && livePriceOverride > 0
    ? livePriceOverride
    : mat.marketPrice;

  const dynamicYield = calculateDynamicMaterialYield(
    mat.name,
    mat.category,
    mat.quality,
    mat.reqLvl,
    playerLevel,
    buffMultiplier,
    resolvedPrice,
    mat.timeSeconds
  );

  return {
    ...mat,
    timeSeconds: dynamicYield.timeSeconds,
    baseExp: dynamicYield.baseExp,
    displayedExp: dynamicYield.displayedExp,
    effectiveExp: dynamicYield.effectiveExp,
    goldPerExp: dynamicYield.goldPerExp,
    expPerSecond: dynamicYield.expPerSecond,
    penaltyEff: dynamicYield.penaltyEff,
    displayedEff: dynamicYield.displayedEff,
    warningType: dynamicYield.warningType,
    warningText: dynamicYield.warningText,
    hasPenalty: dynamicYield.hasPenalty,
    liveMarketPrice: resolvedPrice,
    priceSource: livePriceOverride !== undefined && livePriceOverride > 0 ? "live" : "baseline",
  };
}

export function calculateProjectedLevel(
  currentLevel: number,
  currentLevelXp: number,
  expGained: number
): { projectedLevel: number; progressPercent: number } {
  const currentLvlEntry = xpTable[String(currentLevel)] || { totalExpToReach: 0, expForNextLevel: 139 };
  const startingTotalXp = currentLvlEntry.totalExpToReach + Math.max(0, currentLevelXp);
  const newTotalXp = startingTotalXp + expGained;

  let reachedLevel = currentLevel;
  for (let lvl = currentLevel; lvl <= 100; lvl++) {
    const row = xpTable[String(lvl)];
    if (row && newTotalXp >= row.totalExpToReach) {
      reachedLevel = lvl;
    } else {
      break;
    }
  }

  const reachedEntry = xpTable[String(reachedLevel)] || { totalExpToReach: 0, expForNextLevel: 1 };
  const xpIntoCurrentLvl = newTotalXp - reachedEntry.totalExpToReach;
  const progressPercent = reachedLevel >= 100
    ? 100
    : Math.min(100, Math.max(0, Math.round((xpIntoCurrentLvl / reachedEntry.expForNextLevel) * 100)));

  return {
    projectedLevel: reachedLevel,
    progressPercent,
  };
}

export function calculateSessionSummary(
  queuedItems: QueuedLessonItem[],
  playerLevel: number = 1,
  currentLevelXp: number = 0
): LessonSessionSummary {
  let totalForgeExp = 0;
  let totalDurationSeconds = 0;
  let totalCost = 0;
  let weightedEffSum = 0;

  for (const item of queuedItems) {
    totalForgeExp += item.totalExp;
    totalDurationSeconds += item.totalDurationSeconds;
    totalCost += item.totalCost;
    weightedEffSum += item.material.penaltyEff * item.totalDurationSeconds;
  }

  totalForgeExp = Math.floor(totalForgeExp);
  const totalStrengthExp = Math.floor(totalForgeExp * 0.05);

  const { projectedLevel, progressPercent } = calculateProjectedLevel(playerLevel, currentLevelXp, totalForgeExp);

  const hasOverlevelWarning = queuedItems.some((i) => i.material.hasPenalty);
  const hasRareDropWarning = queuedItems.some(
    (i) => i.material.category === "MOB_DROPS" || ["EPIC", "LEGENDARY", "MYTHIC"].includes(i.material.quality)
  );
  const exceedsCap = totalDurationSeconds > MAX_OFFLINE_SECONDS;

  return {
    queuedItems,
    totalForgeExp,
    totalStrengthExp,
    totalDurationSeconds,
    totalCost,
    projectedLevel,
    projectedLevelProgress: progressPercent,
    hasOverlevelWarning,
    hasRareDropWarning,
    exceedsCap,
  };
}

// Persistent cache across level changes (invalidated only when market prices or buff multiplier change)
const levelSolutionCache = new Map<string, CalculatedLessonMaterial>();

export function clearGoalEstimateCache(): void {
  levelSolutionCache.clear();
}

export function calculateGoalEstimate(
  currentLevel: number,
  targetLevel: number,
  allMaterials: ForgeLessonMaterial[],
  buffMultiplier: number = 1.0,
  currentLevelXp: number = 0,
  marketData?: any,
  effMultiplier: number = 1.0
): GoalEstimateResult {
  const currentEntry = xpTable[String(currentLevel)] || { totalExpToReach: 0, expForNextLevel: 139 };
  const targetEntry = xpTable[String(targetLevel)] || { totalExpToReach: 0, expForNextLevel: 139 };

  const currentTotal = currentEntry.totalExpToReach + currentLevelXp;
  const expNeeded = Math.max(0, targetEntry.totalExpToReach - currentTotal);

  if (expNeeded <= 0) {
    return {
      currentLevel,
      targetLevel,
      expNeeded: 0,
      cheapestOption: null,
      bestOption: null,
      fastestOption: null,
      cheapestSteps: [],
      bestSteps: [],
      fastestSteps: [],
      totalCheapestCost: 0,
      totalBestCost: 0,
      totalFastestCost: 0,
      totalCheapestDurationSeconds: 0,
      totalBestDurationSeconds: 0,
      totalFastestDurationSeconds: 0,
    };
  }

  // Progressive level consideration for multi-level journeys
  const effectiveClimbLevel = targetLevel > currentLevel
    ? Math.min(targetLevel, Math.max(currentLevel, Math.floor((currentLevel + targetLevel) / 2)))
    : currentLevel;

  // Pre-resolve prices once to eliminate thousands of repeated lookups
  const priceMap = new Map<string, number>();
  for (const m of allMaterials) {
    const safePrice = marketData ? getSafeMarketPrice(marketData[m.name]).value : 0;
    priceMap.set(m.name, safePrice > 0 ? safePrice : m.marketPrice);
  }

  const calculated = allMaterials.map((m) => {
    const livePrice = priceMap.get(m.name) || m.marketPrice;
    return calculateLessonMaterialEfficiency(m, effectiveClimbLevel, buffMultiplier, livePrice);
  });

  const firstPrice = priceMap.get(allMaterials[0]?.name || "") || 0;
  const lastPrice = priceMap.get(allMaterials[allMaterials.length - 1]?.name || "") || 0;
  const priceSig = `${firstPrice}_${lastPrice}_${priceMap.size}`;

  const getBestAtLevel = (lvl: number, mode: "cheapest" | "fastest" | "best"): CalculatedLessonMaterial => {
    const cacheKey = `${lvl}_${mode}_${buffMultiplier.toFixed(2)}_${effMultiplier.toFixed(2)}_${priceSig}`;
    const cached = levelSolutionCache.get(cacheKey);
    if (cached) return cached;

    let bestMat: CalculatedLessonMaterial | null = null;
    let bestMetric = mode === "cheapest" ? Infinity : -Infinity;

    for (const m of allMaterials) {
      const livePrice = priceMap.get(m.name) || m.marketPrice;
      const calc = calculateLessonMaterialEfficiency(m, lvl, buffMultiplier, livePrice);
      const effectiveBurnTime = Math.max(1, Math.round(calc.timeSeconds / effMultiplier));
      const effectiveExpPerSec = effectiveBurnTime > 0 ? calc.effectiveExp / effectiveBurnTime : 0;

      let metric: number;
      if (mode === "cheapest") {
        metric = calc.goldPerExp;
        if (metric < bestMetric) {
          bestMetric = metric;
          bestMat = calc;
        }
      } else if (mode === "fastest") {
        metric = effectiveExpPerSec;
        if (metric > bestMetric) {
          bestMetric = metric;
          bestMat = calc;
        }
      } else {
        // "best": Pareto efficiency score = effectiveExpPerSec / sqrt(max(0.2, goldPerExp))
        metric = effectiveExpPerSec / Math.sqrt(Math.max(0.2, calc.goldPerExp));
        if (calc.hasPenalty) metric *= 0.5;
        if (metric > bestMetric) {
          bestMetric = metric;
          bestMat = calc;
        }
      }
    }

    const result = bestMat || calculated[0];
    levelSolutionCache.set(cacheKey, result);
    return result;
  };

  const solveBracketPath = (mode: "cheapest" | "fastest" | "best"): GoalProgressionStep[] => {
    const steps: GoalProgressionStep[] = [];
    let currBracketStart = currentLevel;
    let currMat = getBestAtLevel(currentLevel, mode);
    let bracketQtyAcc = 0;

    for (let lvl = currentLevel; lvl < targetLevel; lvl++) {
      const lvlEntry = xpTable[String(lvl)] || { expForNextLevel: 139 };
      const xpForThisLvl = lvl === currentLevel ? Math.max(0, lvlEntry.expForNextLevel - currentLevelXp) : lvlEntry.expForNextLevel;
      const bestMatAtThisLvl = getBestAtLevel(lvl, mode);

      if (bestMatAtThisLvl.name !== currMat.name && lvl > currBracketStart) {
        const qty = Math.ceil(bracketQtyAcc);
        const itemDuration = Math.max(1, Math.round(currMat.timeSeconds / effMultiplier));
        steps.push({
          fromLevel: currBracketStart,
          toLevel: lvl,
          material: currMat,
          quantityNeeded: qty,
          cost: qty * currMat.liveMarketPrice,
          durationSeconds: qty * itemDuration,
        });
        currBracketStart = lvl;
        currMat = bestMatAtThisLvl;
        bracketQtyAcc = 0;
      }

      const livePrice = priceMap.get(currMat.name) || currMat.marketPrice;
      const matAtLvl = calculateLessonMaterialEfficiency(currMat, lvl, buffMultiplier, livePrice);
      const qtyAtLvl = xpForThisLvl / Math.max(0.1, matAtLvl.effectiveExp);
      bracketQtyAcc += qtyAtLvl;
    }

    if (bracketQtyAcc > 0 && currBracketStart < targetLevel) {
      const qty = Math.ceil(bracketQtyAcc);
      const itemDuration = Math.max(1, Math.round(currMat.timeSeconds / effMultiplier));
      steps.push({
        fromLevel: currBracketStart,
        toLevel: targetLevel,
        material: currMat,
        quantityNeeded: qty,
        cost: qty * currMat.liveMarketPrice,
        durationSeconds: qty * itemDuration,
      });
    }

    return steps;
  };

  const cheapestSteps = solveBracketPath("cheapest");
  const fastestSteps = solveBracketPath("fastest");
  const bestSteps = solveBracketPath("best");

  const totalCheapestCost = cheapestSteps.reduce((sum, s) => sum + s.cost, 0);
  const totalFastestCost = fastestSteps.reduce((sum, s) => sum + s.cost, 0);
  const totalBestCost = bestSteps.reduce((sum, s) => sum + s.cost, 0);

  const totalCheapestDurationSeconds = cheapestSteps.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalFastestDurationSeconds = fastestSteps.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalBestDurationSeconds = bestSteps.reduce((sum, s) => sum + s.durationSeconds, 0);

  // Single-item fallback references for backwards compatibility
  const sortedByCost = [...calculated].sort((a, b) => a.goldPerExp - b.goldPerExp);
  const bestCheap = sortedByCost[0];
  const cheapQty = Math.ceil(expNeeded / Math.max(0.1, bestCheap.effectiveExp));

  const sortedBySpeed = [...calculated].sort((a, b) => b.expPerSecond - a.expPerSecond);
  const bestFast = sortedBySpeed[0];
  const fastQty = Math.ceil(expNeeded / Math.max(0.1, bestFast.effectiveExp));

  const sortedByBest = [...calculated].sort((a, b) => {
    const scoreA = (a.expPerSecond / Math.sqrt(Math.max(0.2, a.goldPerExp))) * (a.hasPenalty ? 0.5 : 1);
    const scoreB = (b.expPerSecond / Math.sqrt(Math.max(0.2, b.goldPerExp))) * (b.hasPenalty ? 0.5 : 1);
    return scoreB - scoreA;
  });
  const bestBalanced = sortedByBest[0];
  const bestBalancedQty = Math.ceil(expNeeded / Math.max(0.1, bestBalanced.effectiveExp));

  return {
    currentLevel,
    targetLevel,
    expNeeded,
    cheapestOption: {
      material: bestCheap,
      quantityNeeded: cheapQty,
      totalCost: cheapQty * bestCheap.liveMarketPrice,
      totalDurationSeconds: Math.ceil(cheapQty * Math.max(1, Math.round(bestCheap.timeSeconds / effMultiplier))),
    },
    bestOption: {
      material: bestBalanced,
      quantityNeeded: bestBalancedQty,
      totalCost: bestBalancedQty * bestBalanced.liveMarketPrice,
      totalDurationSeconds: Math.ceil(bestBalancedQty * Math.max(1, Math.round(bestBalanced.timeSeconds / effMultiplier))),
    },
    fastestOption: {
      material: bestFast,
      quantityNeeded: fastQty,
      totalCost: fastQty * bestFast.liveMarketPrice,
      totalDurationSeconds: Math.ceil(fastQty * Math.max(1, Math.round(bestFast.timeSeconds / effMultiplier))),
    },
    cheapestSteps,
    bestSteps,
    fastestSteps,
    totalCheapestCost,
    totalBestCost,
    totalFastestCost,
    totalCheapestDurationSeconds,
    totalBestDurationSeconds,
    totalFastestDurationSeconds,
  };
}

export function calculateSessionBatchCapacity(
  targetDurationSeconds: number,
  itemTimeSeconds: number
): number {
  if (itemTimeSeconds <= 0) return 0;
  const cappedDuration = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, targetDurationSeconds));
  return Math.floor(cappedDuration / itemTimeSeconds);
}

function useSafeProfiles() {
  try {
    return useProfiles();
  } catch {
    return { activeProfile: null, updateProfile: () => {} } as any;
  }
}

function useSafePreferences() {
  try {
    return usePreferences();
  } catch {
    return { preferences: { membership: false } } as any;
  }
}

function useSafeData() {
  try {
    return useData();
  } catch {
    return { marketData: null } as any;
  }
}

export function getDefaultForgeSessionDuration(
  profile: any,
  hasMembership: boolean
): { hours: number; minutes: number } {
  if (!profile) {
    return hasMembership ? { hours: 8, minutes: 0 } : { hours: 6, minutes: 0 };
  }

  const kind = String(profile.kind || "").toLowerCase();
  const className = String(profile.className || (profile as any)?.class || "").toLowerCase();
  const isCursedOrBanished = className.includes("cursed") || className.includes("banished");

  // Alts have lower cap (6h with membership, 4h without)
  // Main, Cursed, Banished have higher cap (8h with membership, 6h without)
  if (kind === "alt" && !isCursedOrBanished) {
    return hasMembership ? { hours: 6, minutes: 0 } : { hours: 4, minutes: 0 };
  }

  return hasMembership ? { hours: 8, minutes: 0 } : { hours: 6, minutes: 0 };
}

export function detectProfileForgeLevel(profile: any): number {
  if (!profile) return 1;

  // 1. Standard Zenith Companion profile skills dictionary
  const lvl = getProfileSkillLevel(profile, "forge");
  if (lvl && lvl > 0) {
    return Math.max(1, Math.min(100, Math.floor(lvl)));
  }

  // 2. Defensive check if skills is formatted as an array
  if (Array.isArray(profile.skills)) {
    const found = profile.skills.find(
      (s: any) => (s?.name || s?.skill || "").toLowerCase() === "forge"
    );
    if (found && Number(found.level) > 0) {
      return Math.max(1, Math.min(100, Math.floor(Number(found.level))));
    }
  }

  return 1;
}

export function detectProfileForgeAscension(profile: any): number {
  if (!profile?.skills) return 0;
  const entry = profile.skills.forge || profile.skills["forge"] || null;
  if (!entry) {
    if (Array.isArray(profile.skills)) {
      const found = profile.skills.find(
        (s: any) => (s?.name || s?.skill || "").toLowerCase() === "forge"
      );
      const asc = Number(found?.ascension || found?.ascension_level || found?.ascensionLevel || 0);
      if (asc > 0) return asc;
      const lvl = Number(found?.level || 0);
      return lvl > 100 ? lvl - 100 : 0;
    }
    return 0;
  }
  const asc = Number(entry.ascension || entry.ascension_level || entry.ascensionLevel || 0);
  if (asc > 0) return asc;
  const lvl = Number(entry.level || 0);
  return lvl > 100 ? lvl - 100 : 0;
}

export function detectProfileForgeXp(profile: any): number {
  if (!profile?.skills) return 0;
  const entry = profile.skills.forge || profile.skills["forge"] || null;
  if (!entry) {
    if (Array.isArray(profile.skills)) {
      const found = profile.skills.find(
        (s: any) => (s?.name || s?.skill || "").toLowerCase() === "forge"
      );
      return Number(found?.experience || found?.exp || 0) || 0;
    }
    return 0;
  }
  const exp = Number(entry.experience || entry.exp || 0);
  return Number.isFinite(exp) && exp > 0 ? exp : 0;
}

function readScopedStorage<T>(baseKey: string, profileId: string | null | undefined, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const profileKey = getProfileStorageKey(baseKey, profileId);
    let raw = localStorage.getItem(profileKey);
    if (!raw && !profileId) {
      raw = localStorage.getItem(baseKey);
    }
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return fallback;
}

function readScopedLevel(profile: any): number {
  const fromProfile = detectProfileForgeLevel(profile);
  if (fromProfile > 1) return fromProfile;
  if (typeof window !== "undefined") {
    try {
      const profileKey = getProfileStorageKey("zenith_forge_lesson_level", profile?.id);
      let stored = localStorage.getItem(profileKey);
      if (!stored && !profile?.id) {
        stored = localStorage.getItem("zenith_forge_lesson_level");
      }
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 100) return parsed;
      }
    } catch {}
  }
  return fromProfile || 1;
}

function readScopedGoal(profile: any, currentLevel: number): number {
  if (typeof window !== "undefined") {
    try {
      const profileKey = getProfileStorageKey(FORGE_LESSON_GOAL_STORAGE_KEY, profile?.id);
      let stored = localStorage.getItem(profileKey);
      if (!stored && !profile?.id) {
        stored = localStorage.getItem(FORGE_LESSON_GOAL_STORAGE_KEY);
      }
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 100) {
          return Math.max(parsed, Math.min(100, currentLevel + 1));
        }
      }
    } catch {}
  }
  return Math.min(100, currentLevel + 1);
}

export function useForgeLessons() {
  const { activeProfile, updateProfile } = useSafeProfiles();
  const { preferences } = useSafePreferences();
  const { marketData } = useSafeData();
  const activeProfileId = activeProfile?.id;

  // 1. Level detection with profile sync and local storage persistence
  const [forgeLevel, setForgeLevelState] = useState<number>(() => {
    return readScopedLevel(activeProfile);
  });
  const [targetGoalLevel, setTargetGoalLevelState] = useState<number>(() => {
    return readScopedGoal(activeProfile, forgeLevel);
  });

  const profileSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setForgeLevel = useCallback((lvl: number) => {
    const clamped = Math.max(1, Math.min(100, Math.floor(lvl)));
    setForgeLevelState(clamped);
    setTargetGoalLevelState((prev) => (prev <= clamped ? Math.min(100, clamped + 1) : prev));
    if (typeof window !== "undefined") {
      try {
        const key = getProfileStorageKey("zenith_forge_lesson_level", activeProfile?.id);
        localStorage.setItem(key, String(clamped));
      } catch {}
    }

    // Debounce writing to global profile context to eliminate render stutter on stepping
    if (profileSyncTimerRef.current) {
      clearTimeout(profileSyncTimerRef.current);
    }

    if (activeProfile && !isStarterProfile(activeProfile) && typeof updateProfile === "function") {
      profileSyncTimerRef.current = setTimeout(() => {
        try {
          updateProfile(activeProfile.id, {
            skills: {
              ...activeProfile.skills,
              forge: {
                ...(activeProfile.skills?.forge || { experience: 0 }),
                level: clamped,
              },
            },
          });
        } catch {}
      }, 400);
    }
  }, [activeProfile, updateProfile]);

  const setTargetGoalLevel = useCallback((lvl: number) => {
    const clamped = Math.max(1, Math.min(100, Math.floor(lvl)));
    setTargetGoalLevelState(clamped);
    if (typeof window !== "undefined") {
      try {
        const key = getProfileStorageKey(FORGE_LESSON_GOAL_STORAGE_KEY, activeProfile?.id);
        localStorage.setItem(key, String(clamped));
      } catch {}
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    return () => {
      if (profileSyncTimerRef.current) {
        clearTimeout(profileSyncTimerRef.current);
      }
    };
  }, []);

  const detectedXp = useMemo(() => {
    return detectProfileForgeXp(activeProfile);
  }, [activeProfile]);

  const forgeAscensionLevel = useMemo(() => {
    return detectProfileForgeAscension(activeProfile);
  }, [activeProfile]);

  // 2. Buff toggles & inputs
  // Automatically detect membership from user preferences if available
  const membershipFromPrefs = Boolean(preferences?.membership);
  const [hasMembershipBuff, setHasMembershipBuff] = useState<boolean>(membershipFromPrefs);

  useEffect(() => {
    if (preferences?.membership !== undefined) {
      setHasMembershipBuff(Boolean(preferences.membership));
    }
  }, [preferences?.membership]);

  const [hasCampaignBuff, setHasCampaignBuff] = useState<boolean>(false);
  const [shrineBuffPercent, setShrineBuffPercent] = useState<number>(0);
  const [hasDailyBlessing, setHasDailyBlessing] = useState<boolean>(false);
  const [customBuffPercent, setCustomBuffPercent] = useState<number>(0);
  // Uncapped Extra EXP and Efficiency inputs
  const [extraExpBuffPercent, setExtraExpBuffPercent] = useState<number>(0);
  const [extraEffBuffPercent, setExtraEffBuffPercent] = useState<number>(0);

  // Detect Cursed or Forsaken character profile for default -50% EXP penalty
  const profileClassName = String(activeProfile?.className || (activeProfile as any)?.class || "").trim();
  const normalizedClass = profileClassName.toLowerCase();
  const isCursedOrForsaken = normalizedClass.includes("cursed") || normalizedClass.includes("forsaken");

  const totalBuffMultiplier = useMemo(() => {
    // Base EXP multiplier: Cursed & Forsaken have a default -50% primary EXP penalty (0.50x)
    let mult = isCursedOrForsaken ? 0.50 : 1.0;
    if (hasMembershipBuff) mult += 0.15;
    if (hasCampaignBuff) mult += 0.15;
    if (shrineBuffPercent > 0) mult += shrineBuffPercent / 100;
    if (hasDailyBlessing) mult += 0.05;
    if (customBuffPercent > 0) mult += customBuffPercent / 100;
    if (extraExpBuffPercent > 0) mult += extraExpBuffPercent / 100;
    return Number(mult.toFixed(4));
  }, [isCursedOrForsaken, hasMembershipBuff, hasCampaignBuff, shrineBuffPercent, hasDailyBlessing, customBuffPercent, extraExpBuffPercent]);

  const totalEffMultiplier = useMemo(() => {
    let mult = 1.0;
    if (hasMembershipBuff) mult += 0.10;
    if (extraEffBuffPercent > 0) mult += extraEffBuffPercent / 100;
    return mult;
  }, [hasMembershipBuff, extraEffBuffPercent]);

  // 3. Duration planner (Hours & Minutes, NO sliders) with smart defaults and localStorage persistence
  const getInitialDuration = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const profileKey = activeProfile?.id || "default";
        const stored = localStorage.getItem(`zenith_forge_duration_override_v2_${profileKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed?.hours === "number" && typeof parsed?.minutes === "number") {
            return parsed;
          }
        }
      } catch {}
    }
    return getDefaultForgeSessionDuration(activeProfile, hasMembershipBuff);
  }, [activeProfile, hasMembershipBuff]);

  const [targetHours, setTargetHoursState] = useState<number>(() => getInitialDuration().hours);
  const [targetMinutes, setTargetMinutesState] = useState<number>(() => getInitialDuration().minutes);

  const setTargetHours = useCallback((h: number) => {
    const clampedH = Math.max(0, Math.min(12, Math.floor(h)));
    setTargetHoursState(clampedH);
    if (typeof window !== "undefined") {
      try {
        const profileKey = activeProfile?.id || "default";
        localStorage.setItem(
          `zenith_forge_duration_override_v2_${profileKey}`,
          JSON.stringify({ hours: clampedH, minutes: targetMinutes })
        );
      } catch {}
    }
  }, [activeProfile?.id, targetMinutes]);

  const setTargetMinutes = useCallback((m: number) => {
    const clampedM = Math.max(0, Math.min(59, Math.floor(m)));
    setTargetMinutesState(clampedM);
    if (typeof window !== "undefined") {
      try {
        const profileKey = activeProfile?.id || "default";
        localStorage.setItem(
          `zenith_forge_duration_override_v2_${profileKey}`,
          JSON.stringify({ hours: targetHours, minutes: clampedM })
        );
      } catch {}
    }
  }, [activeProfile?.id, targetHours]);

  // Sync default when activeProfile or membership changes, IF user has not manually set an override
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const profileKey = activeProfile?.id || "default";
        const stored = localStorage.getItem(`zenith_forge_duration_override_v2_${profileKey}`);
        if (stored) return; // Respect saved manual choice
      } catch {}
    }
    const def = getDefaultForgeSessionDuration(activeProfile, hasMembershipBuff);
    setTargetHoursState(def.hours);
    setTargetMinutesState(def.minutes);
  }, [activeProfile, hasMembershipBuff]);

  const totalTargetDurationSeconds = useMemo(() => {
    return Math.min(MAX_OFFLINE_SECONDS, targetHours * 3600 + targetMinutes * 60);
  }, [targetHours, targetMinutes]);

  // 4. Search, Filter, Sort
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<ForgeLessonCategory>("ALL");
  const [qualityFilter, setQualityFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<ForgeLessonSort>("lowest_gold");
  const [showExpPerItem, setShowExpPerItem] = useState<boolean>(true);

  // 5. Owned inventory state (with profile-scoped localStorage persistence)
  const [ownedMaterials, setOwnedMaterials] = useState<Record<string, number>>(() => {
    return readScopedStorage<Record<string, number>>(FORGE_OWNED_STORAGE_KEY, activeProfile?.id, {});
  });

  const updateOwnedMaterial = useCallback((name: string, quantity: number) => {
    let nextState: Record<string, number> | null = null;
    const profileId = activeProfile?.id;
    setOwnedMaterials((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[name];
      } else {
        next[name] = Math.max(0, Math.floor(quantity));
      }
      nextState = next;
      try {
        const key = getProfileStorageKey(FORGE_OWNED_STORAGE_KEY, profileId);
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // quota exceeded guard
      }
      return next;
    });

    if (typeof window !== "undefined" && nextState) {
      const payload = { profileId: profileId || null, materials: nextState };
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent(FORGE_OWNED_SYNC_EVENT, { detail: payload }));
      });
    }
  }, [activeProfile?.id]);

  const clearOwnedMaterials = useCallback(() => {
    const profileId = activeProfile?.id;
    setOwnedMaterials({});
    try {
      const key = getProfileStorageKey(FORGE_OWNED_STORAGE_KEY, profileId);
      localStorage.removeItem(key);
    } catch {
      // guard
    }
    if (typeof window !== "undefined") {
      const payload = { profileId: profileId || null, materials: {} };
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent(FORGE_OWNED_SYNC_EVENT, { detail: payload }));
      });
    }
  }, [activeProfile?.id]);

  // 6. Active Lesson Queue state (materialName -> quantity) with persistence
  const [lessonQueue, setLessonQueue] = useState<Record<string, number>>(() => {
    return readScopedStorage<Record<string, number>>(FORGE_LESSON_QUEUE_STORAGE_KEY, activeProfile?.id, {});
  });

  const [lastReplacedQueue, setLastReplacedQueue] = useState<Record<string, number> | null>(null);

  const persistQueue = useCallback((next: Record<string, number>) => {
    try {
      const key = getProfileStorageKey(FORGE_LESSON_QUEUE_STORAGE_KEY, activeProfile?.id);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // guard
    }
  }, [activeProfile?.id]);

  const undoFillQueue = useCallback(() => {
    if (!lastReplacedQueue) return;
    setLessonQueue(lastReplacedQueue);
    persistQueue(lastReplacedQueue);
    setLastReplacedQueue(null);
  }, [lastReplacedQueue, persistQueue]);

  // Profile switch synchronization: cleanly swap all local states to the active profile
  useEffect(() => {
    const newLevel = readScopedLevel(activeProfile);
    setForgeLevelState(newLevel);

    const newGoal = readScopedGoal(activeProfile, newLevel);
    setTargetGoalLevelState(newGoal);

    const profileQueue = readScopedStorage<Record<string, number>>(
      FORGE_LESSON_QUEUE_STORAGE_KEY,
      activeProfileId,
      {}
    );
    setLessonQueue(profileQueue);
    setLastReplacedQueue(null);

    const profileOwned = readScopedStorage<Record<string, number>>(
      FORGE_OWNED_STORAGE_KEY,
      activeProfileId,
      {}
    );
    setOwnedMaterials(profileOwned);

    const dur = getInitialDuration();
    setTargetHoursState(dur.hours);
    setTargetMinutesState(dur.minutes);
  }, [activeProfileId, activeProfile, getInitialDuration]);

  // Cross-tab storage and in-memory event synchronization
  useEffect(() => {
    if (typeof window === "undefined") return;
    const profileId = activeProfile?.id;
    const ownedKey = getProfileStorageKey(FORGE_OWNED_STORAGE_KEY, profileId);
    const queueKey = getProfileStorageKey(FORGE_LESSON_QUEUE_STORAGE_KEY, profileId);

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === ownedKey || (!profileId && e.key === FORGE_OWNED_STORAGE_KEY)) && e.newValue) {
        try {
          setOwnedMaterials(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      } else if ((e.key === queueKey || (!profileId && e.key === FORGE_LESSON_QUEUE_STORAGE_KEY)) && e.newValue) {
        try {
          setLessonQueue(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<
        | { profileId?: string | null; materials: Record<string, number> }
        | Record<string, number>
      >;
      if (!customEvent.detail) return;
      const detail = customEvent.detail;
      const incomingProfileId =
        typeof detail === "object" && detail !== null && "profileId" in detail
          ? (detail as any).profileId
          : undefined;

      let incomingMaterials: Record<string, number> = {};
      if (typeof detail === "object" && detail !== null) {
        if ("materials" in detail && typeof (detail as any).materials === "object" && (detail as any).materials !== null) {
          incomingMaterials = (detail as any).materials;
        } else {
          incomingMaterials = detail as Record<string, number>;
        }
      }

      // Ignore sync events belonging to a different profile
      if (incomingProfileId !== undefined && incomingProfileId !== (profileId || null)) {
        return;
      }

      setOwnedMaterials((prev) => {
        const prevKeys = Object.keys(prev);
        const incomingKeys = Object.keys(incomingMaterials);
        if (
          prevKeys.length === incomingKeys.length &&
          prevKeys.every((k) => prev[k] === incomingMaterials[k])
        ) {
          return prev;
        }
        return incomingMaterials;
      });
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FORGE_OWNED_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FORGE_OWNED_SYNC_EVENT, handleSync);
    };
  }, [activeProfile?.id]);

  const addToQueue = useCallback((name: string, count: number = 1) => {
    setLessonQueue((prev) => {
      const current = prev[name] || 0;
      const nextCount = Math.max(0, current + count);
      let next: Record<string, number>;
      if (nextCount === 0) {
        next = { ...prev };
        delete next[name];
      } else {
        next = { ...prev, [name]: nextCount };
      }
      persistQueue(next);
      return next;
    });
  }, [persistQueue]);

  const addBatchToQueue = useCallback((batch: Record<string, number>) => {
    setLessonQueue((prev) => {
      const next = { ...prev };
      for (const [name, count] of Object.entries(batch)) {
        if (count <= 0) {
          delete next[name];
        } else {
          next[name] = (next[name] || 0) + count;
        }
      }
      persistQueue(next);
      return next;
    });
  }, [persistQueue]);

  const setQueueQuantity = useCallback((name: string, count: number) => {
    setLessonQueue((prev) => {
      let next: Record<string, number>;
      if (count <= 0) {
        next = { ...prev };
        delete next[name];
      } else {
        next = { ...prev, [name]: Math.floor(count) };
      }
      persistQueue(next);
      return next;
    });
  }, [persistQueue]);

  const removeFromQueue = useCallback((name: string) => {
    setLessonQueue((prev) => {
      const next = { ...prev };
      delete next[name];
      persistQueue(next);
      return next;
    });
  }, [persistQueue]);

  const clearQueue = useCallback(() => {
    setLessonQueue({});
    persistQueue({});
  }, [persistQueue]);

  // 8. Calculate materials catalog with live prices and efficiency
  const allCalculatedMaterials = useMemo<CalculatedLessonMaterial[]>(() => {
    return (rawMaterials as ForgeLessonMaterial[]).map((m) => {
      const safePrice = marketData ? getSafeMarketPrice(marketData[m.name]).value : 0;
      const livePrice = safePrice > 0 ? safePrice : m.marketPrice;
      const baseCalc = calculateLessonMaterialEfficiency(m, forgeLevel, totalBuffMultiplier, livePrice);
      const adjustedTimeSeconds = Math.max(1, Math.round(baseCalc.timeSeconds / totalEffMultiplier));
      const adjustedExpPerSec = adjustedTimeSeconds > 0 ? Number((baseCalc.effectiveExp / adjustedTimeSeconds).toFixed(3)) : 0;
      return {
        ...baseCalc,
        timeSeconds: adjustedTimeSeconds,
        expPerSecond: adjustedExpPerSec,
      };
    });
  }, [forgeLevel, totalBuffMultiplier, totalEffMultiplier, marketData]);

  const materialsByName = useMemo(() => {
    return new Map<string, CalculatedLessonMaterial>(
      allCalculatedMaterials.map((m) => [m.name, m])
    );
  }, [allCalculatedMaterials]);

  // 9. Filtered and sorted materials list
  const visibleMaterials = useMemo<CalculatedLessonMaterial[]>(() => {
    return allCalculatedMaterials
      .filter((mat) => {
        if (categoryFilter !== "ALL" && mat.category !== categoryFilter) return false;
        if (qualityFilter !== "ALL" && mat.quality !== qualityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = mat.name.toLowerCase().includes(q);
          const matchMob = mat.mob ? mat.mob.toLowerCase().includes(q) : false;
          if (!matchName && !matchMob) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "lowest_gold":
            return a.goldPerExp - b.goldPerExp;
          case "highest_exp":
            return b.effectiveExp - a.effectiveExp;
          case "slowest_burn":
            return b.timeSeconds - a.timeSeconds;
          case "fastest_burn":
            return a.timeSeconds - b.timeSeconds;
          case "market_price":
            return a.liveMarketPrice - b.liveMarketPrice;
          case "level":
            return a.reqLvl - b.reqLvl;
          case "name":
            return a.name.localeCompare(b.name);
          default:
            return a.goldPerExp - b.goldPerExp;
        }
      });
  }, [allCalculatedMaterials, categoryFilter, qualityFilter, searchQuery, sortBy]);

  // 10. Queue summary & calculations
  const queuedItems = useMemo<QueuedLessonItem[]>(() => {
    const list: QueuedLessonItem[] = [];
    for (const [name, qty] of Object.entries(lessonQueue)) {
      if (qty <= 0) continue;
      const mat = materialsByName.get(name);
      if (!mat) continue;
      list.push({
        material: mat,
        quantity: qty,
        totalExp: Number((mat.effectiveExp * qty).toFixed(2)),
        totalDurationSeconds: mat.timeSeconds * qty,
        totalCost: mat.liveMarketPrice * qty,
      });
    }
    return list;
  }, [lessonQueue, materialsByName]);

  const sessionSummary = useMemo<LessonSessionSummary>(() => {
    return calculateSessionSummary(queuedItems, forgeLevel, detectedXp);
  }, [queuedItems, forgeLevel, detectedXp]);

  // 11. Quick action: Fill session duration with a single material
  const fillSessionWithMaterial = useCallback((materialName: string) => {
    const mat = materialsByName.get(materialName);
    if (!mat || mat.timeSeconds <= 0) return;
    const count = calculateSessionBatchCapacity(totalTargetDurationSeconds, mat.timeSeconds);
    if (count > 0) {
      setLessonQueue((prevQueue) => {
        if (Object.keys(prevQueue).length > 0) {
          setLastReplacedQueue(prevQueue);
        }
        const next = { [materialName]: count };
        persistQueue(next);
        return next;
      });
    }
  }, [materialsByName, totalTargetDurationSeconds, persistQueue]);

  // 12. Quick action: Queue owned inventory items (priority: highest efficiency, then cheapest gold/EXP)
  const queueAllOwned = useCallback((respectDurationCap: boolean = true) => {
    const newQueue: Record<string, number> = {};
    let accumulatedSeconds = 0;
    const targetCapSeconds = respectDurationCap
      ? Math.min(totalTargetDurationSeconds, MAX_OFFLINE_SECONDS)
      : Infinity;

    // Follow IdleMMO priority: Highest efficiency first, then lowest gold/EXP
    const sortedOwned = Object.entries(ownedMaterials)
      .map(([name, qty]) => ({ name, qty, mat: materialsByName.get(name) }))
      .filter((item): item is { name: string; qty: number; mat: CalculatedLessonMaterial } => {
        if (!item.mat || item.qty <= 0) return false;
        if (item.mat.warningType === "TOO_ADVANCED") return false;
        return true;
      })
      .sort((a, b) => {
        if (b.mat.displayedEff !== a.mat.displayedEff) {
          return b.mat.displayedEff - a.mat.displayedEff;
        }
        return a.mat.goldPerExp - b.mat.goldPerExp;
      });

    for (const item of sortedOwned) {
      if (respectDurationCap) {
        const remainingSeconds = targetCapSeconds - accumulatedSeconds;
        if (remainingSeconds <= 0) break;
        const maxCanFit = Math.floor(remainingSeconds / item.mat.timeSeconds);
        const toAdd = Math.min(item.qty, maxCanFit);
        if (toAdd > 0) {
          newQueue[item.name] = toAdd;
          accumulatedSeconds += toAdd * item.mat.timeSeconds;
        }
      } else {
        newQueue[item.name] = item.qty;
      }
    }

    setLessonQueue(newQueue);
    persistQueue(newQueue);
  }, [ownedMaterials, materialsByName, totalTargetDurationSeconds, persistQueue]);

  // 13. Goal estimate computation
  const goalEstimate = useMemo<GoalEstimateResult>(() => {
    return calculateGoalEstimate(
      forgeLevel,
      targetGoalLevel,
      rawMaterials as ForgeLessonMaterial[],
      totalBuffMultiplier,
      detectedXp,
      marketData,
      totalEffMultiplier
    );
  }, [forgeLevel, targetGoalLevel, totalBuffMultiplier, detectedXp, marketData, totalEffMultiplier]);

  return {
    forgeLevel,
    forgeAscensionLevel,
    setForgeLevel,
    hasMembershipBuff,
    setHasMembershipBuff,
    hasCampaignBuff,
    setHasCampaignBuff,
    shrineBuffPercent,
    setShrineBuffPercent,
    hasDailyBlessing,
    setHasDailyBlessing,
    customBuffPercent,
    setCustomBuffPercent,
    extraExpBuffPercent,
    setExtraExpBuffPercent,
    extraEffBuffPercent,
    setExtraEffBuffPercent,
    totalBuffMultiplier,
    totalEffMultiplier,

    targetHours,
    setTargetHours,
    targetMinutes,
    setTargetMinutes,
    totalTargetDurationSeconds,

    targetGoalLevel,
    setTargetGoalLevel,
    goalEstimate,

    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    qualityFilter,
    setQualityFilter,
    sortBy,
    setSortBy,
    showExpPerItem,
    setShowExpPerItem,

    ownedMaterials,
    updateOwnedMaterial,
    clearOwnedMaterials,

    lessonQueue,
    queuedItems,
    lastReplacedQueue,
    undoFillQueue,
    addToQueue,
    addBatchToQueue,
    setQueueQuantity,
    removeFromQueue,
    clearQueue,
    fillSessionWithMaterial,
    queueAllOwned,

    isCursedOrForsaken,
    profileClassName,
    activeProfile,
    allCalculatedMaterials,
    visibleMaterials,
    sessionSummary,
  };
}

export type UseForgeLessonsReturn = ReturnType<typeof useForgeLessons>;
