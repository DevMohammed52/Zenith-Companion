"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { normalizeLocationKey, type WorldLocation } from "@/lib/locations";
import {
  buildEnrichedEnemies,
  isFavorableWeather,
  isPenalizedWeather,
} from "@/lib/world-intelligence";
import {
  buildDropSummaries,
  buildGatheredResources,
  buildPointsOfInterest,
  formatCount,
  getCurrentWeather,
  getLocationLevel,
  getWeatherTimeline,
  type DropSourceEntity,
  type ForecastDay,
  type MapLocation,
} from "../types";

export function useMapState() {
  const searchParams = useSearchParams();
  const { staticData, marketData, allItemsDb, worldLocations, loading } = useData();
  const { openItemByName } = useItemModal();
  const mobileRailRef = useRef<HTMLElement | null>(null);
  const mapStageRef = useRef<HTMLDivElement | null>(null);
  const dossierRef = useRef<HTMLElement | null>(null);
  const intelRef = useRef<HTMLElement | null>(null);
  const locationParam = normalizeLocationKey(searchParams.get("location"));
  const [selectedKey, setSelectedKey] = useState(() => locationParam);
  const [query, setQuery] = useState("");
  const [activeForecastKey, setActiveForecastKey] = useState<string | null>(null);

  const enrichedEnemies = useMemo(
    () => buildEnrichedEnemies({ staticData, worldLocations, marketData }),
    [marketData, staticData, worldLocations],
  );

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
        const ay = Number(a.y || 0);
        const by = Number(b.y || 0);
        if (Math.abs(ay - by) > 80) return ay - by;
        return Number(a.x || 0) - Number(b.x || 0);
      });
  }, [allItemsDb, enrichedEnemies, marketData, staticData, worldLocations]);

  useEffect(() => {
    const key = normalizeLocationKey(searchParams.get("location"));
    const resource = searchParams.get("resource")?.trim();
    const loot = searchParams.get("loot")?.trim();
    if (key) setSelectedKey(key);
    if (resource) {
      setQuery(resource);
    } else if (loot) {
      setQuery(loot);
    }
  }, [searchParams]);

  useEffect(() => {
    if (locations.length === 0) return;
    const targetKey = selectedKey || normalizeLocationKey(searchParams.get("location"));
    if (targetKey && locations.some((location) => location.key === targetKey)) {
      if (selectedKey !== targetKey) setSelectedKey(targetKey);
      return;
    }
    if (!selectedKey && locations.length > 0) {
      setSelectedKey(locations[0].key);
    }
  }, [locations, searchParams, selectedKey]);

  useEffect(() => {
    setActiveForecastKey(null);
  }, [selectedKey]);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
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
  }, [locations, query]);

  const selectedLocation = useMemo(
    () => filteredLocations.find((location) => location.key === selectedKey) || filteredLocations[0] || null,
    [filteredLocations, selectedKey],
  );

  const totals = useMemo(() => ({
    locations: locations.length,
    enemies: locations.reduce((sum, location) => sum + location.enemies.length, 0),
    dungeons: locations.reduce((sum, location) => sum + location.dungeons.length, 0),
    bosses: locations.reduce((sum, location) => sum + location.bosses.length, 0),
    drops: locations.reduce((sum, location) => sum + location.drops.length, 0),
    resources: locations.reduce((sum, location) => sum + location.resources.length, 0),
  }), [locations]);

  const selectedPointsOfInterest = useMemo(
    () => (selectedLocation ? buildPointsOfInterest(selectedLocation) : []),
    [selectedLocation],
  );

  const selectedVisibleDrops = useMemo(() => {
    if (!selectedLocation) return [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return selectedLocation.drops.slice(0, 12);
    const matchingDrops = selectedLocation.drops.filter((drop) => drop.name.toLowerCase().includes(normalizedQuery));
    return (matchingDrops.length > 0 ? matchingDrops : selectedLocation.drops).slice(0, 12);
  }, [query, selectedLocation]);

  const selectedWeatherTimeline = useMemo(
    () => (selectedLocation ? getWeatherTimeline(selectedLocation) : []),
    [selectedLocation],
  );

  const selectedWeatherKey = String(
    selectedLocation?.currentWeather?.key || selectedLocation?.nextWeather?.key || "OVERCAST",
  ).toUpperCase();

  const selectedWeatherLabel = selectedLocation
    ? selectedLocation.currentWeather?.name || selectedLocation.nextWeather?.name || "Weather unknown"
    : "No location selected";

  const selectedLevelLabel = selectedLocation
    ? selectedLocation.level !== null && selectedLocation.level !== undefined
      ? `Level ${selectedLocation.level}`
      : "Level unknown"
    : "Level unknown";

  const selectedActivityLabel = selectedLocation
    ? [
      formatCount(selectedLocation.enemies.length, "enemy", "enemies"),
      formatCount(selectedLocation.dungeons.length, "dungeon"),
      formatCount(selectedLocation.bosses.length, "boss", "bosses"),
    ].join(" / ")
    : "No sources selected";

  useEffect(() => {
    const rail = mobileRailRef.current;
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

  return {
    loading,
    mobileRailRef,
    mapStageRef,
    dossierRef,
    intelRef,
    selectedKey,
    setSelectedKey,
    query,
    setQuery,
    activeForecastKey,
    setActiveForecastKey,
    locations,
    filteredLocations,
    selectedLocation,
    totals,
    selectedPointsOfInterest,
    selectedVisibleDrops,
    selectedWeatherTimeline,
    selectedWeatherKey,
    selectedWeatherLabel,
    selectedLevelLabel,
    selectedActivityLabel,
    scrollToSection,
    openItemByName,
  };
}
