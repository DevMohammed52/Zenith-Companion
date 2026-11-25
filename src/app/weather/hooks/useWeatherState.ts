"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { WEATHER_DATA, type WeatherData } from "@/constants/weatherData";
import { useData } from "@/context/DataContext";
import { useProfiles } from "@/lib/profiles";
import {
  buildEnrichedEnemies,
  buildEnrichedLocations,
  normalizeWeatherKey,
} from "@/lib/world-intelligence";
import {
  buildCurrentWeatherEnemyIndex,
  buildWeatherPreferenceIndex,
  EMPTY_WEATHER_BUCKETS,
  getLocationWeatherCounts,
  weatherMatches,
  type LocationWeatherCounts,
} from "../types";

export function useWeatherState() {
  const { staticData, worldLocations, marketData, allItemsDb } = useData();
  const { activeProfile } = useProfiles();
  const [activeWeather, setActiveWeatherState] = useState<WeatherData>(WEATHER_DATA[0]);
  const [weatherRefreshTick, setWeatherRefreshTick] = useState(0);
  const [filterByLevel, setFilterByLevel] = useState(false);

  const setActiveWeather = (weather: WeatherData) => {
    setActiveWeatherState(weather);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("weather", weather.id);
      window.history.replaceState(null, "", url.toString());
    } catch {}
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const weatherParam = params.get("weather")?.trim().toLowerCase();
      if (!weatherParam) return;
      const match = WEATHER_DATA.find(
        (w) => w.id.toLowerCase() === weatherParam || normalizeWeatherKey(w.name).toLowerCase() === weatherParam,
      );
      if (match) setActiveWeatherState(match);
    } catch {}
  }, []);

  const characterCombatLevel = useMemo(() => {
    const lvl = activeProfile?.levels?.combat;
    return typeof lvl === "number" && lvl > 0 ? lvl : null;
  }, [activeProfile?.levels?.combat]);

  useEffect(() => {
    const interval = window.setInterval(() => setWeatherRefreshTick((tick) => tick + 1), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const enemies = useMemo(() => {
    void weatherRefreshTick;
    return buildEnrichedEnemies({ staticData, worldLocations, marketData });
  }, [marketData, staticData, worldLocations, weatherRefreshTick]);

  const locations = useMemo(() => {
    void weatherRefreshTick;
    return buildEnrichedLocations({ staticData, worldLocations, marketData, allItemsDb });
  }, [allItemsDb, marketData, staticData, worldLocations, weatherRefreshTick]);

  const weatherPreferenceIndex = useMemo(() => buildWeatherPreferenceIndex(enemies), [enemies]);
  const currentWeatherEnemyIndex = useMemo(() => buildCurrentWeatherEnemyIndex(enemies), [enemies]);

  const activeWeatherKey = normalizeWeatherKey(activeWeather.name);
  const activeWeatherEnemies = weatherPreferenceIndex.get(activeWeatherKey) || EMPTY_WEATHER_BUCKETS;

  const currentWeatherLocations = useMemo(
    () => locations.filter((location) => weatherMatches(location.currentWeather, activeWeather)),
    [activeWeather, locations],
  );

  const nextWeatherLocations = useMemo(
    () => locations.filter((location) => weatherMatches(location.nextWeather, activeWeather)),
    [activeWeather, locations],
  );

  const locationWeatherCounts = useMemo(() => {
    const counts = new Map<string, LocationWeatherCounts>();
    for (const location of locations) {
      counts.set(location.key, getLocationWeatherCounts(location, activeWeather.name));
    }
    return counts;
  }, [activeWeather.name, locations]);

  const currentWeatherEnemyContext = currentWeatherEnemyIndex.get(activeWeatherKey) || { favored: [], penalized: [] };
  const favoredPreferenceCount = activeWeatherEnemies.loves.length + activeWeatherEnemies.likes.length;
  const penalizedPreferenceCount = activeWeatherEnemies.dislikes.length + activeWeatherEnemies.hates.length;

  const magicStormWeather = useMemo(() => WEATHER_DATA.find((w) => w.id === "magic-storm") || null, []);
  const magicStormAlert = useMemo(() => {
    if (!magicStormWeather) return null;
    const activeLoc = locations.find((l) => weatherMatches(l.currentWeather, magicStormWeather));
    if (activeLoc) {
      return {
        type: "active" as const,
        location: activeLoc,
        weather: activeLoc.currentWeather,
      };
    }
    const upcomingLoc = locations.find((l) => weatherMatches(l.nextWeather, magicStormWeather));
    if (upcomingLoc) {
      return {
        type: "upcoming" as const,
        location: upcomingLoc,
        weather: upcomingLoc.nextWeather,
      };
    }
    return null;
  }, [locations, magicStormWeather]);

  const currentSeason = useMemo(() => {
    const month = new Date().getMonth();
    if (month === 11 || month === 0 || month === 1) {
      return { name: "Winter", months: "Dec – Feb", note: "Heavy snow in alpine peaks." };
    }
    if (month >= 2 && month <= 4) {
      return { name: "Spring", months: "Mar – May", note: "Mild winds and variable showers." };
    }
    if (month >= 5 && month <= 7) {
      return { name: "Summer", months: "Jun – Aug", note: "Heatwaves common in arid zones." };
    }
    return { name: "Autumn", months: "Sep – Nov", note: "Frequent rain and coastal fog." };
  }, []);

  const displayedActiveWeatherEnemies = useMemo(() => {
    if (!filterByLevel || characterCombatLevel === null) {
      return activeWeatherEnemies;
    }
    return {
      loves: activeWeatherEnemies.loves.filter((e) => e.level <= characterCombatLevel),
      likes: activeWeatherEnemies.likes.filter((e) => e.level <= characterCombatLevel),
      dislikes: activeWeatherEnemies.dislikes.filter((e) => e.level <= characterCombatLevel),
      hates: activeWeatherEnemies.hates.filter((e) => e.level <= characterCombatLevel),
    };
  }, [activeWeatherEnemies, filterByLevel, characterCombatLevel]);

  const displayedCurrentEnemyContext = useMemo(() => {
    if (!filterByLevel || characterCombatLevel === null) {
      return currentWeatherEnemyContext;
    }
    return {
      favored: currentWeatherEnemyContext.favored.filter((e) => e.level <= characterCombatLevel),
      penalized: currentWeatherEnemyContext.penalized.filter((e) => e.level <= characterCombatLevel),
    };
  }, [currentWeatherEnemyContext, filterByLevel, characterCombatLevel]);

  const weatherAccent = {
    "--accent": activeWeather.theme.primary,
    "--accent-2": activeWeather.theme.secondary,
  } as CSSProperties;

  return {
    activeWeather,
    setActiveWeather,
    activeWeatherEnemies,
    displayedActiveWeatherEnemies,
    currentWeatherLocations,
    nextWeatherLocations,
    locationWeatherCounts,
    currentWeatherEnemyContext,
    displayedCurrentEnemyContext,
    favoredPreferenceCount,
    penalizedPreferenceCount,
    weatherAccent,
    characterCombatLevel,
    characterName: activeProfile?.name || null,
    filterByLevel,
    setFilterByLevel,
    magicStormAlert,
    currentSeason,
  };
}
