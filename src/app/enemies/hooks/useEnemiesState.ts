"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import {
  buildEnrichedEnemies,
  compareEnemiesByProgression,
  isFavorableWeather,
  isPenalizedWeather,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import {
  enemyMatchesFilter,
  levelMatches,
  type MatchFilter,
  type Option,
  type SortKey,
} from "../types";

export function useEnemiesState() {
  const searchParams = useSearchParams();
  const { staticData, worldLocations, marketData, loading } = useData();
  const { openItemByName } = useItemModal();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<EnrichedEnemy | null>(null);
  const [weatherNow, setWeatherNow] = useState(() => Date.now());
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setWeatherNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  const enemies = useMemo(
    () => buildEnrichedEnemies({ staticData, worldLocations, marketData, now: weatherNow }),
    [marketData, staticData, weatherNow, worldLocations],
  );

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
    setSelectedLocation(searchParams.get("location") ?? "all");
  }, [searchParams]);

  const locationOptions = useMemo<Option<string>[]>(() => {
    const locations = Array.from(new Map(enemies.map((enemy) => [enemy.locationKey, enemy.locationName])).entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
    return [{ value: "all", label: "All locations" }, ...locations];
  }, [enemies]);

  const filteredEnemies = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const rows = enemies.filter((enemy) => {
      if (selectedLocation !== "all" && enemy.locationKey !== selectedLocation) return false;
      if (!enemyMatchesFilter(enemy, matchFilter)) return false;
      if (!levelMatches(enemy, levelFilter)) return false;
      if (!normalizedQuery) return true;
      return enemy.searchText.includes(normalizedQuery);
    });

    rows.sort((a, b) => {
      let result = 0;
      if (sortKey === "name") result = a.name.localeCompare(b.name);
      else if (sortKey === "location") result = a.locationName.localeCompare(b.locationName) || compareEnemiesByProgression(a, b);
      else if (sortKey === "lootCount") result = a.lootCount - b.lootCount;
      else if (sortKey === "lootEv") result = a.lootEv - b.lootEv;
      else result = compareEnemiesByProgression(a, b);
      return sortDesc ? -result : result;
    });

    return rows;
  }, [deferredQuery, enemies, levelFilter, matchFilter, selectedLocation, sortDesc, sortKey]);

  const stats = useMemo(() => ({
    enemies: enemies.length,
    locations: new Set(enemies.map((enemy) => enemy.locationKey)).size,
    favored: enemies.filter((enemy) => isFavorableWeather(enemy.currentWeatherMatch)).length,
    penalized: enemies.filter((enemy) => isPenalizedWeather(enemy.currentWeatherMatch)).length,
  }), [enemies]);

  const activeFilterCount = [
    query.trim().length > 0,
    selectedLocation !== "all",
    matchFilter !== "all",
    levelFilter !== "all",
  ].filter(Boolean).length;

  const hasCustomSort = sortKey !== "level" || sortDesc;
  const hasActiveControls = activeFilterCount > 0 || hasCustomSort;

  const resetControls = () => {
    setQuery("");
    setSelectedLocation("all");
    setMatchFilter("all");
    setLevelFilter("all");
    setSortKey("level");
    setSortDesc(false);
  };

  return {
    loading,
    query,
    setQuery,
    selectedLocation,
    setSelectedLocation,
    matchFilter,
    setMatchFilter,
    levelFilter,
    setLevelFilter,
    sortKey,
    setSortKey,
    sortDesc,
    setSortDesc,
    selectedEnemy,
    setSelectedEnemy,
    isCompactViewport,
    enemies,
    locationOptions,
    filteredEnemies,
    stats,
    activeFilterCount,
    hasCustomSort,
    hasActiveControls,
    resetControls,
    openItemByName,
  };
}
