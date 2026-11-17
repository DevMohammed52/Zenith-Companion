"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import rawMaterials from "@/data/normalized-forge-materials.json";
import rawXpLevels from "@/data/skill-xp-levels.json";
import { getProfileSkillLevel, useProfiles } from "@/lib/profiles";
import { useData } from "@/context/DataContext";
import { getSafeMarketPrice } from "@/lib/market-pricing";
import {
  FORGE_OWNED_STORAGE_KEY,
  FORGE_OWNED_SYNC_EVENT,
  type CalculatedLessonMaterial,
  type ForgeLessonCategory,
  type ForgeLessonMaterial,
  type ForgeLessonSort,
  type GoalEstimateResult,
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

export function calculateBankedShardsForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(100, Math.floor(level)));
  if (clamped <= 1) return 5;
  if (clamped <= 25) return Math.round(5 + ((clamped - 1) / (25 - 1)) * (12 - 5));
  if (clamped <= 50) return Math.round(12 + ((clamped - 25) / (50 - 25)) * (25 - 12));
  if (clamped <= 75) return Math.round(25 + ((clamped - 50) / (75 - 50)) * (50 - 25));
  return Math.round(50 + ((clamped - 75) / (100 - 75)) * (100 - 50));
}

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

  const avgEfficiency = totalDurationSeconds > 0 ? weightedEffSum / totalDurationSeconds : 1.0;
  const temperPercentGain = Number(
    Math.min(100, (totalDurationSeconds / 3600) * 4.0 * avgEfficiency).toFixed(1)
  );

  const maxBankableShards = calculateBankedShardsForLevel(playerLevel);
  const projectedShards = Math.round(maxBankableShards * (temperPercentGain / 100));
  const isFullTemper = temperPercentGain >= 100;

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
    temperPercentGain,
    projectedShards,
    isFullTemper,
    hasOverlevelWarning,
    hasRareDropWarning,
    exceedsCap,
  };
}

export function calculateGoalEstimate(
  currentLevel: number,
  targetLevel: number,
  allMaterials: ForgeLessonMaterial[],
  buffMultiplier: number = 1.0,
  currentLevelXp: number = 0,
  marketData?: any
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
      fastestOption: null,
    };
  }

  // Progressive level consideration for multi-level journeys
  const effectiveClimbLevel = targetLevel > currentLevel
    ? Math.min(targetLevel, Math.max(currentLevel, Math.floor((currentLevel + targetLevel) / 2)))
    : currentLevel;

  const calculated = allMaterials.map((m) => {
    const safePrice = marketData ? getSafeMarketPrice(marketData[m.name]).value : 0;
    const livePrice = safePrice > 0 ? safePrice : m.marketPrice;
    return calculateLessonMaterialEfficiency(m, effectiveClimbLevel, buffMultiplier, livePrice);
  });

  // Cheapest: lowest gold/EXP
  const sortedByCost = [...calculated].sort((a, b) => a.goldPerExp - b.goldPerExp);
  const bestCheap = sortedByCost[0];
  const cheapQty = Math.ceil(expNeeded / Math.max(0.1, bestCheap.effectiveExp));

  // Fastest: highest EXP per second
  const sortedBySpeed = [...calculated].sort((a, b) => b.expPerSecond - a.expPerSecond);
  const bestFast = sortedBySpeed[0];
  const fastQty = Math.ceil(expNeeded / Math.max(0.1, bestFast.effectiveExp));

  return {
    currentLevel,
    targetLevel,
    expNeeded,
    cheapestOption: {
      material: bestCheap,
      quantityNeeded: cheapQty,
      totalCost: cheapQty * bestCheap.liveMarketPrice,
      totalDurationSeconds: cheapQty * bestCheap.timeSeconds,
    },
    fastestOption: {
      material: bestFast,
      quantityNeeded: fastQty,
      totalCost: fastQty * bestFast.liveMarketPrice,
      totalDurationSeconds: fastQty * bestFast.timeSeconds,
    },
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
    return { activeProfile: null } as any;
  }
}

function useSafeData() {
  try {
    return useData();
  } catch {
    return { marketData: null } as any;
  }
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

export function useForgeLessons() {
  const { activeProfile } = useSafeProfiles();
  const { marketData } = useSafeData();

  // 1. Level detection from active profile or default to 1
  const detectedLevel = useMemo(() => {
    return detectProfileForgeLevel(activeProfile);
  }, [activeProfile]);

  const detectedXp = useMemo(() => {
    return detectProfileForgeXp(activeProfile);
  }, [activeProfile]);

  const [forgeLevel, setForgeLevel] = useState<number>(detectedLevel);

  useEffect(() => {
    if (detectedLevel > 1) {
      setForgeLevel(detectedLevel);
    }
  }, [detectedLevel]);

  // 2. Buff toggles
  const [hasMembershipBuff, setHasMembershipBuff] = useState<boolean>(true);
  const [hasCampaignBuff, setHasCampaignBuff] = useState<boolean>(false);
  const [shrineBuffPercent, setShrineBuffPercent] = useState<number>(0);
  const [hasDailyBlessing, setHasDailyBlessing] = useState<boolean>(false);
  const [customBuffPercent, setCustomBuffPercent] = useState<number>(0);

  const totalBuffMultiplier = useMemo(() => {
    let mult = 1.0;
    if (hasMembershipBuff) mult += 0.15;
    if (hasCampaignBuff) mult += 0.15;
    if (shrineBuffPercent > 0) mult += shrineBuffPercent / 100;
    if (hasDailyBlessing) mult += 0.05;
    if (customBuffPercent > 0) mult += customBuffPercent / 100;
    return mult;
  }, [hasMembershipBuff, hasCampaignBuff, shrineBuffPercent, hasDailyBlessing, customBuffPercent]);

  // 3. Duration planner (Hours & Minutes, NO sliders)
  const [targetHours, setTargetHours] = useState<number>(2);
  const [targetMinutes, setTargetMinutes] = useState<number>(30);

  const totalTargetDurationSeconds = useMemo(() => {
    return Math.min(MAX_OFFLINE_SECONDS, targetHours * 3600 + targetMinutes * 60);
  }, [targetHours, targetMinutes]);

  // 4. Target Level Goal Estimator
  const [targetGoalLevel, setTargetGoalLevel] = useState<number>(Math.min(100, Math.max(2, forgeLevel + 10)));

  // 5. Search, Filter, Sort
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<ForgeLessonCategory>("ALL");
  const [qualityFilter, setQualityFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<ForgeLessonSort>("lowest_gold");
  const [showExpPerItem, setShowExpPerItem] = useState<boolean>(true);

  // 6. Owned inventory state (with localStorage persistence)
  const [ownedMaterials, setOwnedMaterials] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(FORGE_OWNED_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return {};
  });

  const updateOwnedMaterial = useCallback((name: string, quantity: number) => {
    setOwnedMaterials((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[name];
      } else {
        next[name] = Math.max(0, Math.floor(quantity));
      }
      try {
        localStorage.setItem(FORGE_OWNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // quota exceeded guard
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(FORGE_OWNED_SYNC_EVENT, { detail: next }));
      }
      return next;
    });
  }, []);

  const clearOwnedMaterials = useCallback(() => {
    setOwnedMaterials({});
    try {
      localStorage.removeItem(FORGE_OWNED_STORAGE_KEY);
    } catch {
      // guard
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(FORGE_OWNED_SYNC_EVENT, { detail: {} }));
    }
  }, []);

  // 7. Active Lesson Queue state (materialName -> quantity) with persistence
  const [lessonQueue, setLessonQueue] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(FORGE_LESSON_QUEUE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return {};
  });

  const [lastReplacedQueue, setLastReplacedQueue] = useState<Record<string, number> | null>(null);

  const persistQueue = useCallback((next: Record<string, number>) => {
    try {
      localStorage.setItem(FORGE_LESSON_QUEUE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // guard
    }
  }, []);

  const undoFillQueue = useCallback(() => {
    if (!lastReplacedQueue) return;
    setLessonQueue(lastReplacedQueue);
    persistQueue(lastReplacedQueue);
    setLastReplacedQueue(null);
  }, [lastReplacedQueue, persistQueue]);

  // Cross-tab storage and in-memory event synchronization
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FORGE_OWNED_STORAGE_KEY && e.newValue) {
        try {
          setOwnedMaterials(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      } else if (e.key === FORGE_LESSON_QUEUE_STORAGE_KEY && e.newValue) {
        try {
          setLessonQueue(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, number>>;
      if (customEvent.detail) {
        setOwnedMaterials(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FORGE_OWNED_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FORGE_OWNED_SYNC_EVENT, handleSync);
    };
  }, []);

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

  // 8. Calculate materials catalog with live prices
  const allCalculatedMaterials = useMemo<CalculatedLessonMaterial[]>(() => {
    return (rawMaterials as ForgeLessonMaterial[]).map((m) => {
      const livePrice = marketData ? getSafeMarketPrice(marketData[m.name]).value : m.marketPrice;
      return calculateLessonMaterialEfficiency(m, forgeLevel, totalBuffMultiplier, livePrice);
    });
  }, [forgeLevel, totalBuffMultiplier, marketData]);

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
      marketData
    );
  }, [forgeLevel, targetGoalLevel, totalBuffMultiplier, detectedXp, marketData]);

  return {
    forgeLevel,
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
    totalBuffMultiplier,

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
    setQueueQuantity,
    removeFromQueue,
    clearQueue,
    fillSessionWithMaterial,
    queueAllOwned,

    allCalculatedMaterials,
    visibleMaterials,
    sessionSummary,
  };
}

export type UseForgeLessonsReturn = ReturnType<typeof useForgeLessons>;
