"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { useProfiles } from "@/lib/profiles";
import { normalizeLocationKey, type WorldLocation } from "@/lib/locations";
import { type ConquestData } from "@/lib/conquest";
import {
  BASE_MOVEMENT_SPEED,
  calculateTeleportCost,
  calculateTravelSeconds,
  getBossRouteDistance,
  getProfileEconomicTeleportLevel,
  isTeleportDiscountClass,
} from "@/lib/world-boss-routing";
import {
  buildEnrichedEnemies,
  isFavorableWeather,
  isPenalizedWeather,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import {
  buildDropSummaries,
  buildGatheredResources,
  buildPointsOfInterest,
  formatCount,
  getCurrentWeather,
  getLocationLevel,
  getWeatherTimeline,
  MAP_TABS,
  safeDate,
  type DropSourceEntity,
  type ForecastDay,
  type MapConquestSummary,
  type MapLocation,
  type MapTab,
} from "../types";

export const DROPS_PAGE_SIZE = 18;

export function useMapState() {
  const searchParams = useSearchParams();
  const { staticData, marketData, allItemsDb, worldLocations, loading } = useData();
  const { activeProfile } = useProfiles();
  const { openItemByName } = useItemModal();

  const quickRailRef = useRef<HTMLDivElement | null>(null);
  const mapStageRef = useRef<HTMLDivElement | null>(null);
  const dossierRef = useRef<HTMLElement | null>(null);
  const intelRef = useRef<HTMLElement | null>(null);

  const locationParam = normalizeLocationKey(searchParams.get("location"));
  const tabParamRaw = searchParams.get("tab")?.trim().toLowerCase() as MapTab | undefined;
  const initialTab: MapTab = MAP_TABS.some((t) => t.id === tabParamRaw) ? (tabParamRaw as MapTab) : "overview";

  const [selectedKey, setSelectedKey] = useState(() => locationParam);
  const [activeTab, setActiveTab] = useState<MapTab>(initialTab);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [activeForecastKey, setActiveForecastKey] = useState<string | null>(null);
  const [dropsPage, setDropsPage] = useState(1);
  const [conquestByZone, setConquestByZone] = useState<Record<string, MapConquestSummary>>({});
  const [travelDestinationKey, setTravelDestinationKey] = useState<string>("");
  const [selectedEnemy, setSelectedEnemy] = useState<EnrichedEnemy | null>(null);

  const enrichedEnemies = useMemo(
    () => buildEnrichedEnemies({ staticData, worldLocations, marketData }),
    [marketData, staticData, worldLocations],
  );

  // Load current conquest holders once cleanly for regional territory banners
  useEffect(() => {
    let cancelled = false;
    fetch("/conquest-data.json", { cache: "no-cache" })
      .then((res) => (res.ok ? (res.json() as Promise<ConquestData>) : null))
      .then((payload) => {
        if (cancelled || !payload || !Array.isArray(payload.zones)) return;
        const next: Record<string, MapConquestSummary> = {};
        for (const zone of payload.zones) {
          const key = normalizeLocationKey(zone.key || zone.name);
          if (!key) continue;
          const topRow = zone.guild_leaderboard?.[0];
          const totalXp = Math.max(0, Number(zone.experience || 0));
          const topXp = Math.max(0, Number(topRow?.experience || 0));
          const sharePct = totalXp > 0 ? Math.round((topXp / totalXp) * 100) : 0;
          next[key] = {
            zoneKey: key,
            leadingGuildName: topRow?.guild?.name || "Unclaimed",
            leadingGuildTag: topRow?.guild?.tag || null,
            leadingSharePct: sharePct,
            isAssailed: Number(zone.active_assaults_count || 0) > 0 || (zone.active_assaults?.length || 0) > 0,
            assaultEndsAt: zone.active_assaults?.[0]?.ends_at || null,
          };
        }
        setConquestByZone(next);
      })
      .catch(() => {
        // Conquest data is optional enrichment on /map
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sort locations by progression level ascending for easy dropdown/rail lookup
  const locations = useMemo<MapLocation[]>(() => {
    const locationRows = Array.isArray(worldLocations) ? worldLocations : [];
    const fallbackByName = new Map<string, WorldLocation>();

    for (const groupName of ["enemies", "dungeons", "world_bosses"] as const) {
      for (const entity of staticData?.[groupName] || []) {
        if (!entity.location?.name) continue;
        const key = normalizeLocationKey(entity.location.key || entity.location.name || entity.location.id);
        if (!fallbackByName.has(key)) {
          fallbackByName.set(key, {
            id: entity.location.id,
            key,
            name: entity.location.name,
            forecast: [],
          });
        }
      }
    }

    const sourceLocations = locationRows.length > 0 ? locationRows : Array.from(fallbackByName.values());

    return sourceLocations
      .map((location, index) => {
        const key = normalizeLocationKey(location.key || location.name || location.id);
        const name = String(location.name || location.key || location.id || "Unknown");
        const hasMapCoordinates = Number.isFinite(Number(location.x)) && Number.isFinite(Number(location.y));
        const fallbackX = 170 + (index % 4) * 220;
        const fallbackY = 150 + Math.floor(index / 4) * 230;
        const matchesLocation = (entity: any) => {
          const entityKey = normalizeLocationKey(entity.location?.key || entity.location?.name || entity.location?.id);
          return entityKey === key;
        };
        const enemies = enrichedEnemies.filter((enemy) => enemy.locationKey === key);
        const dungeons = (staticData?.dungeons || []).filter(matchesLocation);
        const bosses = (staticData?.world_bosses || []).filter(matchesLocation);
        const { current, next } = getCurrentWeather(location);
        const dropSources: DropSourceEntity[] = [
          ...enemies.map((entity: any) => ({ entity, type: "Enemy" as const })),
          ...dungeons.map((entity: any) => ({ entity, type: "Dungeon" as const })),
          ...bosses.map((entity: any) => ({ entity, type: "World Boss" as const })),
        ];

        return {
          ...location,
          key,
          name,
          x: hasMapCoordinates ? Number(location.x) : fallbackX,
          y: hasMapCoordinates ? Number(location.y) : fallbackY,
          forecast: (location.forecast || []) as ForecastDay[],
          enemies,
          favoredEnemies: enemies.filter((enemy) => isFavorableWeather(enemy.currentWeatherMatch)),
          penalizedEnemies: enemies.filter((enemy) => isPenalizedWeather(enemy.currentWeatherMatch)),
          dungeons,
          bosses,
          level: getLocationLevel(enemies, dungeons, bosses),
          drops: buildDropSummaries(dropSources, marketData, allItemsDb),
          resources: buildGatheredResources(key, marketData, allItemsDb),
          currentWeather: current,
          nextWeather: next,
        };
      })
      .sort((a, b) => {
        const aLevel = a.level ?? Number.MAX_SAFE_INTEGER;
        const bLevel = b.level ?? Number.MAX_SAFE_INTEGER;
        if (aLevel !== bLevel) return aLevel - bLevel;
        return a.name.localeCompare(b.name);
      });
  }, [allItemsDb, enrichedEnemies, marketData, staticData, worldLocations]);

  // Sync inbound URL params (?location, ?tab, ?resource, ?loot)
  useEffect(() => {
    const key = normalizeLocationKey(searchParams.get("location"));
    const tab = searchParams.get("tab")?.trim().toLowerCase() as MapTab | undefined;
    const resource = searchParams.get("resource")?.trim();
    const loot = searchParams.get("loot")?.trim();
    if (key) setSelectedKey(key);
    if (tab && MAP_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    } else if (resource) {
      setQuery(resource);
      setActiveTab("resources");
    } else if (loot) {
      setQuery(loot);
      setActiveTab("drops");
    }
  }, [searchParams]);

  // Default selected location once locations load (defaults to active profile's location or first lowest-level location)
  useEffect(() => {
    if (locations.length === 0) return;
    const targetKey = selectedKey || normalizeLocationKey(searchParams.get("location"));
    if (targetKey && locations.some((location) => location.key === targetKey)) {
      if (selectedKey !== targetKey) setSelectedKey(targetKey);
      return;
    }
    const profileLocKey = normalizeLocationKey(activeProfile?.location?.name);
    if (profileLocKey && locations.some((location) => location.key === profileLocKey)) {
      setSelectedKey(profileLocKey);
      return;
    }
    if (!selectedKey && locations.length > 0) {
      setSelectedKey(locations[0].key);
    }
  }, [activeProfile?.location?.name, locations, searchParams, selectedKey]);

  // Default travel destination ("To") cleanly to a different region (housing location or Citadel/Bluebell)
  useEffect(() => {
    if (locations.length === 0) return;
    setTravelDestinationKey((prev) => {
      if (prev && prev !== selectedKey && locations.some((loc) => loc.key === prev)) {
        return prev;
      }
      const fallbackLoc =
        locations.find((loc) => loc.key === "the-citadel" && loc.key !== selectedKey) ||
        locations.find((loc) => loc.key !== selectedKey) ||
        locations[0];
      return fallbackLoc.key;
    });
  }, [locations, selectedKey]);

  // Sync ?location= and ?tab= to URL via replaceState for shareable links
  useEffect(() => {
    if (typeof window === "undefined" || !selectedKey) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const currentLoc = params.get("location");
      const currentTab = params.get("tab");
      const desiredTab = activeTab === "overview" ? null : activeTab;
      if (currentLoc === selectedKey && currentTab === desiredTab) return;

      params.set("location", selectedKey);
      if (desiredTab) params.set("tab", desiredTab);
      else params.delete("tab");
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", nextUrl);
    } catch {
      // Ignore history API blocks in test environments
    }
  }, [activeTab, selectedKey]);

  useEffect(() => {
    setActiveForecastKey(null);
    setDropsPage(1);
  }, [selectedKey, deferredQuery]);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return locations.filter((location) => {
      if (!normalizedQuery) return true;
      const haystack = [
        location.name,
        location.description || "",
        location.currentWeather?.name || "",
        location.nextWeather?.name || "",
        ...location.enemies.map((enemy) => enemy.name),
        ...location.dungeons.map((dungeon) => dungeon.name),
        ...location.bosses.map((boss) => boss.name),
        ...location.favoredEnemies.map((enemy) => enemy.name),
        ...location.penalizedEnemies.map((enemy) => enemy.name),
        ...location.drops.map((drop) => drop.name),
        ...location.resources.map((resource) => resource.name),
      ].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [locations, deferredQuery]);

  const selectedLocation = useMemo(
    () => filteredLocations.find((location) => location.key === selectedKey) || filteredLocations[0] || null,
    [filteredLocations, selectedKey],
  );

  const selectedConquest = useMemo<MapConquestSummary | null>(() => {
    if (!selectedLocation) return null;
    return conquestByZone[selectedLocation.key] || null;
  }, [conquestByZone, selectedLocation]);

  const profileHouseMatch = useMemo(() => {
    if (!selectedLocation || !activeProfile?.housing) return null;
    const homeKey = normalizeLocationKey(activeProfile.housing.location);
    if (homeKey && homeKey === selectedLocation.key) {
      return activeProfile.housing.mode === "guest" ? "Guest house located here" : "Your house is located here";
    }
    return null;
  }, [activeProfile?.housing, selectedLocation]);

  // Travel from selectedLocation -> chosen travelDestinationKey
  const travelEstimate = useMemo(() => {
    if (!selectedLocation || locations.length === 0) return null;
    const destLoc = locations.find((loc) => loc.key === travelDestinationKey) || locations[0];
    if (!destLoc) return null;

    const distanceMeters = getBossRouteDistance(selectedLocation.name, destLoc.name);
    const economicLevel = getProfileEconomicTeleportLevel(activeProfile);
    const classDiscount = isTeleportDiscountClass(activeProfile?.className);
    const moveSpeed = Number(activeProfile?.secondaryStats?.movementSpeed) || BASE_MOVEMENT_SPEED;

    const teleportCost = distanceMeters !== null && distanceMeters > 0
      ? calculateTeleportCost(distanceMeters, economicLevel, classDiscount)
      : distanceMeters === 0 ? 0 : null;
    const travelSeconds = distanceMeters !== null && distanceMeters > 0
      ? calculateTravelSeconds(distanceMeters, moveSpeed)
      : distanceMeters === 0 ? 0 : null;

    return {
      destinationKey: destLoc.key,
      destinationName: destLoc.name,
      sameLocation: destLoc.key === selectedLocation.key,
      distanceMeters,
      teleportCost,
      travelSeconds,
      economicLevel,
      classDiscount,
      profileName: activeProfile?.name || null,
    };
  }, [activeProfile, locations, selectedLocation, travelDestinationKey]);

  const selectedPointsOfInterest = useMemo(
    () => (selectedLocation ? buildPointsOfInterest(selectedLocation) : []),
    [selectedLocation],
  );

  const filteredDrops = useMemo(() => {
    if (!selectedLocation) return [];
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return selectedLocation.drops;
    const matchingDrops = selectedLocation.drops.filter((drop) => drop.name.toLowerCase().includes(normalizedQuery));
    return matchingDrops.length > 0 ? matchingDrops : selectedLocation.drops;
  }, [deferredQuery, selectedLocation]);

  const dropsTotalPages = Math.max(1, Math.ceil(filteredDrops.length / DROPS_PAGE_SIZE));
  const safeDropsPage = Math.min(dropsPage, dropsTotalPages);
  const selectedVisibleDrops = useMemo(() => {
    const start = (safeDropsPage - 1) * DROPS_PAGE_SIZE;
    return filteredDrops.slice(start, start + DROPS_PAGE_SIZE);
  }, [filteredDrops, safeDropsPage]);

  const selectedWeatherTimeline = useMemo(() => {
    if (!selectedLocation) return [];
    const timeline = getWeatherTimeline(selectedLocation);
    const now = Date.now();
    const upcoming = timeline.filter((weather) => {
      const endMs = safeDate(weather.ends_at)?.getTime();
      return endMs === undefined ? true : endMs > now;
    });
    return upcoming.length > 0 ? upcoming : timeline;
  }, [selectedLocation]);

  const selectedWeatherKey = String(
    selectedLocation?.currentWeather?.key || selectedLocation?.nextWeather?.key || "OVERCAST",
  ).toUpperCase();

  const selectedWeatherLabel = selectedLocation
    ? selectedLocation.currentWeather?.name || selectedLocation.nextWeather?.name || "Weather unknown"
    : "No location selected";

  const selectedLevelLabel = selectedLocation
    ? selectedLocation.level !== null && selectedLocation.level !== undefined
      ? `Lv. ${selectedLocation.level}+`
      : "Level n/a"
    : "Level n/a";

  const selectedActivityLabel = selectedLocation
    ? [
      formatCount(selectedLocation.enemies.length, "enemy", "enemies"),
      formatCount(selectedLocation.dungeons.length, "dungeon"),
      formatCount(selectedLocation.bosses.length, "boss", "bosses"),
    ].join(", ")
    : "No sources selected";

  useEffect(() => {
    const rail = quickRailRef.current;
    const activeChip = rail?.querySelector<HTMLElement>("[data-active='true']");
    if (!rail || !activeChip) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = activeChip.offsetLeft - (rail.clientWidth - activeChip.clientWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: reducedMotion ? "auto" : "smooth" });
  }, [selectedLocation?.key, filteredLocations.length]);

  const scrollToSection = (target: HTMLElement | null) => {
    if (!target) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  const resetFilters = () => {
    setQuery("");
  };

  return {
    loading,
    marketData,
    quickRailRef,
    mapStageRef,
    dossierRef,
    intelRef,
    selectedKey,
    setSelectedKey,
    activeTab,
    setActiveTab,
    query,
    setQuery,
    resetFilters,
    activeForecastKey,
    setActiveForecastKey,
    locations,
    filteredLocations,
    selectedLocation,
    selectedConquest,
    profileHouseMatch,
    travelDestinationKey,
    setTravelDestinationKey,
    travelEstimate,
    selectedPointsOfInterest,
    filteredDrops,
    selectedVisibleDrops,
    dropsPage: safeDropsPage,
    dropsTotalPages,
    setDropsPage,
    selectedWeatherTimeline,
    selectedWeatherKey,
    selectedWeatherLabel,
    selectedLevelLabel,
    selectedActivityLabel,
    selectedEnemy,
    setSelectedEnemy,
    scrollToSection,
    openItemByName,
  };
}
