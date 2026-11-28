"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCrafting } from "@/context/CraftingContext";
import { useData } from "@/context/DataContext";
import { calculateCraftingQueuePlan, type QueueItemLookup, type QueueMarketData } from "@/lib/crafting-queue";
import {
  SUPPORTED_ESSENCE_SKILLS,
  calculateEssenceSession,
  type EssenceSession,
  type EssenceSkillName,
} from "@/lib/essences";
import {
  FORGE_PLANNER_STORAGE_KEY,
  sanitizeForgePlannerLines,
  type ForgePlannerLine,
} from "@/lib/forge-planner";
import {
  SKILL_TO_HOUSING_ACTIVITY,
  calculateHousingBuffs,
  getProfileBaseIdleActionHours,
} from "@/lib/housing";
import type { WorldLocation } from "@/lib/locations";
import { MYTHIC_ACTIVE_RECIPES_STORAGE_KEY } from "@/lib/mythic-alchemy";
import { usePreferences } from "@/lib/preferences";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  DEFAULT_PROFILE_BACKGROUND_IMAGE_URL,
  DEFAULT_PROFILE_SKIN_IMAGE_URL,
  isStarterProfile,
  useProfiles,
} from "@/lib/profiles";
import type { QualityName } from "@/lib/quality";
import { getTopVisitedRoutes } from "@/lib/route-history";
import {
  calculateSkillProfitRows,
  DEFAULT_TOOL_SELECTIONS,
  SKILLS,
  type SkillName,
  type SkillProfitRow,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import { APP_RELEASE_DATE, APP_VERSION } from "@/lib/version";
import {
  buildToolDirectoryGroups,
  DEFAULT_PERSISTED_SKILL_PROFIT,
  deriveLiveBossPulse,
  formatBossCountdown,
  getPetShowcaseProfile,
  getRankedProfitPerHour,
  mapWeatherConditionToIcon,
  PET_SPECIES_COUNT,
  readMythicNamesFromKey,
  readSkillProfitStateFromKey,
  SKILL_PROFIT_STORAGE_KEY,
  type ActivePetHighlight,
  type LatestReleaseHighlight,
  type LiveWeatherPulse,
  type MarketMoverItem,
  type PersistedSkillProfitDashboardState,
  type RankedRouteDisplay,
  type ToolDirectoryItem,
  type UseDashboardStateReturn,
  type WeatherZoneSlide,
  type WorldBossSummary,
} from "../types";

interface ForecastDay {
  weathers?: Array<{
    name?: string;
    key?: string;
    buffs?: string[];
    starts_at?: string;
    ends_at?: string;
  }>;
}

function extractWorldWeatherPulse(locations: WorldLocation[] | null, nowMs: number): LiveWeatherPulse | null {
  if (!Array.isArray(locations) || locations.length === 0) return null;

  let upcomingStormLocation: string | null = null;
  let upcomingStormStartIso: string | undefined;
  let upcomingStormMs = Number.POSITIVE_INFINITY;

  const sortedZones = [...locations].sort((a, b) => Number(a.id ?? 999) - Number(b.id ?? 999));
  const slides: WeatherZoneSlide[] = [];

  for (const loc of sortedZones) {
    const forecastDays: ForecastDay[] = Array.isArray((loc as { forecast?: ForecastDay[] }).forecast)
      ? ((loc as { forecast?: ForecastDay[] }).forecast ?? [])
      : [];

    let activeCond = "Clear";
    let activeBuffs: string[] = [];
    let isMagicStorm = false;
    let activeEndIso: string | undefined;

    for (const day of forecastDays) {
      const weathers = Array.isArray(day.weathers) ? day.weathers : [];
      for (const w of weathers) {
        const startMs = w.starts_at ? new Date(w.starts_at).getTime() : Number.NaN;
        const endMs = w.ends_at ? new Date(w.ends_at).getTime() : Number.NaN;
        const condName = w.name || w.key || "";
        const normalized = condName.toLowerCase();

        if (Number.isFinite(startMs) && Number.isFinite(endMs) && startMs <= nowMs && endMs > nowMs) {
          activeCond = condName || "Clear";
          activeBuffs = Array.isArray(w.buffs) ? w.buffs.slice(0, 2) : [];
          isMagicStorm = normalized.includes("magic storm");
          activeEndIso = w.ends_at;
        } else if (
          Number.isFinite(startMs) &&
          startMs > nowMs &&
          normalized.includes("magic storm") &&
          startMs < upcomingStormMs
        ) {
          upcomingStormMs = startMs;
          upcomingStormLocation = loc.name ?? null;
          upcomingStormStartIso = w.starts_at;
        }
      }
    }

    const changeCountdown = activeEndIso ? formatBossCountdown(activeEndIso, nowMs) : null;
    slides.push({
      zoneId: Number(loc.id ?? slides.length + 1),
      zoneName: loc.name || `Zone ${slides.length + 1}`,
      zoneImageUrl: loc.image_url ?? undefined,
      condition: activeCond,
      icon: mapWeatherConditionToIcon(activeCond),
      buffs: activeBuffs,
      isMagicStorm,
      nextChangeLabel:
        changeCountdown && changeCountdown.diffMs > 0
          ? `Ends ${changeCountdown.label.toLowerCase()}`
          : null,
    });
  }

  return {
    slides,
    upcomingStormLocation,
    upcomingStormCountdown: upcomingStormStartIso ? formatBossCountdown(upcomingStormStartIso, nowMs).label : null,
  };
}

function computeMarketMovers(marketData: Record<string, any> | null, minVolume = 100): MarketMoverItem[] {
  if (!marketData) return [];
  const movers: MarketMoverItem[] = [];

  for (const [name, entry] of Object.entries(marketData)) {
    if (name === "_meta" || !entry || typeof entry !== "object") continue;
    const price3d = Number(entry.safe_price ?? entry.avg_3 ?? entry.price ?? 0);
    const avg30 = Number(entry.avg_30 ?? 0);
    const vol3 = Number(entry.stable_vol_3 ?? entry.vol_3 ?? 0);
    if (!Number.isFinite(price3d) || !Number.isFinite(avg30) || price3d < 10 || avg30 < 10) continue;
    if (!Number.isFinite(vol3) || vol3 < minVolume) continue;

    const deltaPercent = ((price3d - avg30) / avg30) * 100;
    if (!Number.isFinite(deltaPercent) || Math.abs(deltaPercent) < 3) continue;

    movers.push({
      name,
      imageUrl: typeof entry.image_url === "string" ? entry.image_url : undefined,
      price3d,
      avg30,
      deltaPercent,
      volume3d: vol3,
    });
  }

  return movers
    .sort((a, b) => b.deltaPercent - a.deltaPercent)
    .slice(0, 4);
}

function normalizePetQuality(raw?: string): QualityName {
  const upper = String(raw || "STANDARD").toUpperCase();
  const valid: QualityName[] = ["UNKNOWN", "STANDARD", "REFINED", "PREMIUM", "EPIC", "LEGENDARY", "MYTHIC", "UNIQUE"];
  return valid.includes(upper as QualityName) ? (upper as QualityName) : "STANDARD";
}

export function useDashboardState(): UseDashboardStateReturn {
  const { preferences } = usePreferences();
  const { activeProfile, loaded: profilesLoaded } = useProfiles();
  const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;
  const needsProfileSetup = !configuredProfile;
  const { queue } = useCrafting();
  const { marketData, allItemsDb, ensureMarketLoaded, ensureLoaded, staticData, worldLocations } =
    useData({ autoLoad: false });

  const [hydrated, setHydrated] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [activeMythicNames, setActiveMythicNames] = useState<string[]>([]);
  const [forgeLines, setForgeLines] = useState<ForgePlannerLine[]>([]);
  const [persistedSkillProfit, setPersistedSkillProfit] = useState<PersistedSkillProfitDashboardState>(
    DEFAULT_PERSISTED_SKILL_PROFIT,
  );
  const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
  const [localBosses, setLocalBosses] = useState<WorldBossSummary[] | null>(null);
  const [localLocations, setLocalLocations] = useState<WorldLocation[] | null>(null);
  const [localPets, setLocalPets] = useState<Array<{ name?: string; quality?: string; imageUrl?: string }> | null>(null);
  const [latestRelease, setLatestRelease] = useState<LatestReleaseHighlight | null>(null);

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
    setHydrated(true);
    setRecentHrefs(getTopVisitedRoutes(4));
    const handleVisitUpdate = () => setRecentHrefs(getTopVisitedRoutes(4));
    window.addEventListener("zenith-route-visits-updated", handleVisitUpdate);
    return () => window.removeEventListener("zenith-route-visits-updated", handleVisitUpdate);
  }, []);

  useEffect(() => {
    if (!profilesLoaded || typeof document === "undefined") return;
    document.documentElement.dataset.profileSetup = !activeProfile || isStarterProfile(activeProfile) ? "needed" : "ready";
  }, [activeProfile, profilesLoaded]);

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
    return () => window.removeEventListener("storage", handleStorage);
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

  useEffect(() => {
    let cancelled = false;
    const needBosses = !Array.isArray(staticData?.world_bosses);
    const needLocations = !Array.isArray(worldLocations);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [bossRes, locRes, petRes, relRes] = await Promise.all([
            needBosses ? fetch("/static-data.json", { cache: "no-cache" }).catch(() => null) : Promise.resolve(null),
            needLocations ? fetch("/world-locations.json", { cache: "no-cache" }).catch(() => null) : Promise.resolve(null),
            fetch("/pet-database.json", { cache: "no-cache" }).catch(() => null),
            fetch("/zenith-changelog.json", { cache: "no-cache" }).catch(() => null),
          ]);
          if (cancelled) return;
          if (bossRes?.ok) {
            const payload = (await bossRes.json()) as { world_bosses?: WorldBossSummary[] };
            if (!cancelled && Array.isArray(payload?.world_bosses)) {
              setLocalBosses(payload.world_bosses);
            }
          }
          if (locRes?.ok) {
            const payload = (await locRes.json()) as { locations?: WorldLocation[] };
            if (!cancelled && Array.isArray(payload?.locations)) {
              setLocalLocations(payload.locations);
            }
          }
          if (petRes?.ok) {
            const payload = (await petRes.json()) as {
              pets?: Array<{ name?: string; quality?: string; imageUrl?: string }>;
            };
            if (!cancelled && Array.isArray(payload?.pets)) {
              setLocalPets(payload.pets);
            }
          }
          if (relRes?.ok) {
            const payload = (await relRes.json()) as {
              releases?: Array<{
                version?: string;
                date?: string;
                isUnreleased?: boolean;
                totalChanges?: number;
                sections?: Record<string, string[]>;
              }>;
            };
            const firstPublished =
              payload?.releases?.find((r) => !r.isUnreleased) || payload?.releases?.[0];
            if (!cancelled && firstPublished) {
              const allItems = Object.values(firstPublished.sections || {}).flat();
              const firstBullet = typeof allItems[0] === "string"
                ? allItems[0].replace(/\*\*/g, "").slice(0, 120)
                : "Latest Zenith Companion release";
              setLatestRelease({
                version: firstPublished.version || APP_VERSION,
                date: firstPublished.date || APP_RELEASE_DATE,
                headline: firstBullet,
                totalChanges: Number(firstPublished.totalChanges) || allItems.length,
              });
            }
          }
        } catch {
          // Optional enhancement
        }
      })();
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [staticData, worldLocations]);

  const effectiveBosses = useMemo(
    () => (Array.isArray(staticData?.world_bosses) ? (staticData.world_bosses as WorldBossSummary[]) : localBosses),
    [localBosses, staticData],
  );
  const effectiveLocations = useMemo(
    () => (Array.isArray(worldLocations) ? worldLocations : localLocations),
    [localLocations, worldLocations],
  );

  const locationImagesByName = useMemo(() => {
    const map = new Map<string, string>();
    if (!Array.isArray(effectiveLocations)) return map;
    for (const loc of effectiveLocations) {
      if (loc.name && loc.image_url) {
        map.set(loc.name.toLowerCase(), loc.image_url);
      }
    }
    return map;
  }, [effectiveLocations]);

  useEffect(() => {
    const intervalMs = effectiveBosses && effectiveBosses.length > 0 ? 1000 : 60_000;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setNowMs(Date.now());
      }
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [effectiveBosses]);

  const housingIdleHoursBySkill = useMemo(
    () =>
      Object.fromEntries(
        SKILLS.map((skill) => {
          const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
          return [skill, activity ? Number(housingSummary.idleHours[activity] || 0) : 0];
        }),
      ) as Partial<Record<SkillName, number>>,
    [housingSummary],
  );

  const baseIdleActionHours = configuredProfile
    ? getProfileBaseIdleActionHours(configuredProfile, preferences.membership)
    : 8;

  const idleActionHoursBySkill = useMemo(
    () =>
      Object.fromEntries(
        SKILLS.map((skill) => [skill, baseIdleActionHours + Number(housingIdleHoursBySkill[skill] || 0)]),
      ) as Partial<Record<SkillName, number>>,
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

  const rankedRoutes = useMemo<RankedRouteDisplay[]>(() => {
    if (!marketData) return [];
    const minVolume = persistedSkillProfit.minVolume;
    const rows = calculateSkillProfitRows(marketData, allItemsDb, skillProfitSettings, [], minVolume);
    const eligible: SkillProfitRow[] = [];

    for (const row of rows) {
      const rankedProfit = getRankedProfitPerHour(row);
      if (row.skill === "Forge" || row.saleSource === "missing" || rankedProfit <= 0) continue;
      const excludedByLiquidity = row.saleSource === "market" ? (!row.isLiquid || row.stableVolume3d < minVolume) : false;
      if (excludedByLiquidity) continue;
      eligible.push(row);
    }

    return eligible
      .sort((a, b) => getRankedProfitPerHour(b) - getRankedProfitPerHour(a))
      .slice(0, 4)
      .map((row) => ({
        name: row.name,
        skill: row.skill,
        level: Number(row.level) || 1,
        profitPerHour: getRankedProfitPerHour(row),
        expPerHour: Number(row.expPerHour) || 0,
        saleSource: row.saleSource,
        volume3d: Number(row.stableVolume3d) || 0,
        imageUrl: typeof marketData?.[row.name]?.image_url === "string" ? marketData[row.name].image_url : undefined,
      }));
  }, [allItemsDb, marketData, persistedSkillProfit.minVolume, skillProfitSettings]);

  const barteringBoost = configuredProfile
    ? getProfileBarteringBoost(configuredProfile)
    : Number(preferences.barteringBoost || 0);

  const queuePlan = useMemo(
    () =>
      calculateCraftingQueuePlan(queue, marketData as QueueMarketData, allItemsDb as QueueItemLookup, {
        ...preferences,
        barteringBoost,
      }),
    [allItemsDb, barteringBoost, marketData, preferences, queue],
  );

  const forgeCraftsCount = useMemo(
    () => forgeLines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity) || 0), 0),
    [forgeLines],
  );

  const queuedCount = useMemo(
    () => Object.values(queue).reduce((sum, qty) => sum + Math.max(0, Number(qty) || 0), 0),
    [queue],
  );

  const isOwnerWithoutFoundation = housingSummary.mode === "owner" && !activeProfile?.housing?.foundationBuilt;
  const housingStatusLabel =
    housingSummary.mode === "none"
      ? "Not configured"
      : isOwnerWithoutFoundation
        ? "Foundation needed"
        : housingSummary.activeComponentCount === 0
          ? "No active buffs"
          : housingSummary.mode === "guest"
            ? `${housingSummary.activeComponentCount} guest buff${housingSummary.activeComponentCount === 1 ? "" : "s"}`
            : `${housingSummary.activeComponentCount}/${housingSummary.slotCapacity || 0} slots`;

  const housingConduitNote =
    housingSummary.mode === "none"
      ? "Set owner or guest rooms for idle timer buffs."
      : isOwnerWithoutFoundation
        ? "Build a Foundation to unlock room slots and idle timers."
        : housingSummary.activeComponentCount === 0
          ? "No active buffs selected for this house."
          : housingSummary.locationLimited
            ? "Local zone only (no Remote Conduit)."
            : "Remote Conduit active across all zones.";

  const equippedGearCount = useMemo(
    () => Object.values(activeProfile?.gear || {}).filter((val) => typeof val === "string" && val.trim().length > 0).length,
    [activeProfile?.gear],
  );

  const ownedPetsCount = Array.isArray(activeProfile?.ownedPets) ? activeProfile.ownedPets.length : 0;

  const petCatalogByName = useMemo(() => {
    const map = new Map<string, { imageUrl?: string; quality?: string }>();
    if (!Array.isArray(localPets)) return map;
    for (const pet of localPets) {
      if (pet?.name) {
        map.set(pet.name.trim().toLowerCase(), {
          imageUrl: pet.imageUrl,
          quality: pet.quality,
        });
      }
    }
    return map;
  }, [localPets]);

  const activePet = useMemo<ActivePetHighlight | null>(() => {
    const owned = Array.isArray(activeProfile?.ownedPets) ? activeProfile.ownedPets : [];
    const equippedOwned = owned.find((p) => p.active || p.equipped);
    const configuredSpecies = activeProfile?.pet?.species?.trim() || "";

    // Respect explicit Companion Pet selection (`activeProfile.pet.species`, e.g. from /profiles#profile-pet)
    // unless an owned pet is marked active/equipped for that same species (preserving custom nickname/snapshot).
    if (
      equippedOwned &&
      (!configuredSpecies || equippedOwned.species.trim().toLowerCase() === configuredSpecies.toLowerCase())
    ) {
      const catalog = petCatalogByName.get(equippedOwned.species.trim().toLowerCase());
      const quality = normalizePetQuality(equippedOwned.quality || catalog?.quality);
      return {
        species: equippedOwned.species,
        displayName: equippedOwned.nickname?.trim() || equippedOwned.species,
        level: Math.max(1, Number(equippedOwned.level) || 1),
        quality,
        imageUrl: equippedOwned.imageUrl || catalog?.imageUrl,
        showcase: getPetShowcaseProfile(equippedOwned.species, quality),
      };
    }

    if (configuredSpecies) {
      const ownedMatch = owned.find((p) => p.species.trim().toLowerCase() === configuredSpecies.toLowerCase());
      const catalog = petCatalogByName.get(configuredSpecies.toLowerCase());
      const quality = normalizePetQuality(activeProfile?.pet?.quality || ownedMatch?.quality || catalog?.quality);
      return {
        species: configuredSpecies,
        displayName: configuredSpecies,
        level: Math.max(1, Number(activeProfile?.pet?.level) || 1),
        quality,
        imageUrl: ownedMatch?.imageUrl || catalog?.imageUrl,
        showcase: getPetShowcaseProfile(configuredSpecies, quality),
      };
    }

    const fallback = equippedOwned || owned[0];
    if (!fallback) return null;
    const catalog = petCatalogByName.get(fallback.species.trim().toLowerCase());
    const quality = normalizePetQuality(fallback.quality || catalog?.quality);
    return {
      species: fallback.species,
      displayName: fallback.nickname?.trim() || fallback.species,
      level: Math.max(1, Number(fallback.level) || 1),
      quality,
      imageUrl: fallback.imageUrl || catalog?.imageUrl,
      showcase: getPetShowcaseProfile(fallback.species, quality),
    };
  }, [activeProfile?.ownedPets, activeProfile?.pet, petCatalogByName]);

  const liveBossPulse = useMemo(
    () => deriveLiveBossPulse(effectiveBosses || undefined, nowMs, locationImagesByName),
    [effectiveBosses, locationImagesByName, nowMs],
  );
  const worldWeatherPulse = useMemo(
    () => extractWorldWeatherPulse(effectiveLocations, nowMs),
    [effectiveLocations, nowMs],
  );
  const marketMovers = useMemo(
    () => computeMarketMovers(marketData, persistedSkillProfit.minVolume),
    [marketData, persistedSkillProfit.minVolume],
  );

  const directoryGroups = useMemo(() => buildToolDirectoryGroups(recentHrefs), [recentHrefs]);

  const recentTools = useMemo(() => {
    const byHref = new Map<string, ToolDirectoryItem>();
    for (const group of directoryGroups) {
      for (const item of group.items) {
        byHref.set(item.href, item);
      }
    }
    return recentHrefs
      .map((href) => byHref.get(href))
      .filter((item): item is ToolDirectoryItem => Boolean(item));
  }, [directoryGroups, recentHrefs]);

  const totalLevel = configuredProfile ? Math.max(1, Number(configuredProfile.levels?.totalLevel) || 20) : 20;
  const combatLevel = configuredProfile ? Math.max(1, Number(configuredProfile.levels?.combat) || 1) : 1;
  const museumItemCount = Number(configuredProfile?.museum?.itemCount ?? configuredProfile?.museum?.items?.length ?? 0);

  return {
    isReady: hydrated && profilesLoaded,
    needsProfileSetup,
    hasConfiguredProfile: Boolean(configuredProfile),
    hasMembership: Boolean(preferences.membership),
    activeProfileName: configuredProfile?.name?.trim() || "IdleMMO Companion",
    activeProfileClass: configuredProfile?.className || "Adventurer",
    activeProfileImageUrl: configuredProfile?.imageUrl || DEFAULT_PROFILE_SKIN_IMAGE_URL,
    activeProfileBackgroundUrl:
      configuredProfile?.backgroundUrl &&
      configuredProfile.backgroundUrl !== DEFAULT_PROFILE_BACKGROUND_IMAGE_URL
        ? configuredProfile.backgroundUrl
        : locationImagesByName.get("bluebell hollow") ||
          locationImagesByName.get("whispering woods") ||
          "",
    guildLabel: configuredProfile?.guild?.tag ? `[${configuredProfile.guild.tag}]` : null,
    totalLevel,
    combatLevel,
    idleActionHours: baseIdleActionHours,
    activePet,
    equippedGearCount,
    ownedPetsCount,
    museumItemCount,
    petSpeciesCount: PET_SPECIES_COUNT,
    rankedRoutes,
    queuedCount,
    queueProfit: queuePlan.totalProfit,
    queuePlanEntriesCount: queuePlan.entries.length,
    forgeCraftsCount,
    activeMythicCount: activeMythicNames.length,
    housingStatusLabel,
    housingConduitNote,
    liveBossPulse,
    worldWeatherPulse,
    marketMovers,
    recentTools,
    latestRelease: latestRelease || {
      version: APP_VERSION,
      date: APP_RELEASE_DATE,
      headline: "Best-in-Slot Gear Comparison, Crafting Cart & Dashboard Hub",
      totalChanges: 1,
    },
  };
}
