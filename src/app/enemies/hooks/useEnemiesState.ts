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
  const searchParamVal = searchParams.get("search") ?? "";
  const locationParamVal = searchParams.get("location") ?? "all";
  const [query, setQuery] = useState(() => searchParamVal);
  const deferredQuery = useDeferredValue(query);
  const [selectedLocation, setSelectedLocation] = useState(() => locationParamVal);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedEnemy, setSelectedEnemyState] = useState<EnrichedEnemy | null>(null);
  const [weatherNow, setWeatherNow] = useState(() => Date.now());
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  // Pagination state (default: 24 enemies per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

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
    const currentSearch = searchParams.get("search") ?? "";
    const currentLocation = searchParams.get("location") ?? "all";
    if (query !== currentSearch) setQuery(currentSearch);
    if (selectedLocation !== currentLocation) setSelectedLocation(currentLocation);
  }, [searchParams]);

  // Synchronize search and location params to URL for deep linking
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (deferredQuery.trim()) {
      url.searchParams.set("search", deferredQuery.trim());
    } else {
      url.searchParams.delete("search");
    }
    if (selectedLocation !== "all") {
      url.searchParams.set("location", selectedLocation);
    } else {
      url.searchParams.delete("location");
    }
    window.history.replaceState(null, "", url.toString());
  }, [deferredQuery, selectedLocation]);

  // Deep-linking: auto-select enemy from URL param if present
  useEffect(() => {
    const enemyParam = searchParams.get("enemy");
    if (!enemyParam || enemies.length === 0) return;
    const match = enemies.find(
      (e) =>
        e.name.toLowerCase() === enemyParam.toLowerCase() ||
        String(e.id) === enemyParam ||
        e.key.toLowerCase() === enemyParam.toLowerCase(),
    );
    if (match) {
      setSelectedEnemyState(match);
    }
  }, [enemies, searchParams]);

  // Synchronize URL query parameter when selectedEnemy changes
  const setSelectedEnemy = (enemy: EnrichedEnemy | null) => {
    setSelectedEnemyState(enemy);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (enemy) {
        url.searchParams.set("enemy", enemy.name);
      } else {
        url.searchParams.delete("enemy");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

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

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery, selectedLocation, matchFilter, levelFilter, sortKey, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filteredEnemies.length / pageSize));

  // Clamp currentPage if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedEnemies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEnemies.slice(start, start + pageSize);
  }, [currentPage, filteredEnemies, pageSize]);

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
    setCurrentPage(1);
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
    paginatedEnemies,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    stats,
    activeFilterCount,
    hasCustomSort,
    hasActiveControls,
    resetControls,
    openItemByName,
    marketData,
  };
}
