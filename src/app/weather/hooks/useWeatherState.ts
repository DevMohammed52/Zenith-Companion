"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { WEATHER_DATA, type WeatherData } from "@/constants/weatherData";
import { useData } from "@/context/DataContext";
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
  const [activeWeather, setActiveWeather] = useState<WeatherData>(WEATHER_DATA[0]);
  const [weatherRefreshTick, setWeatherRefreshTick] = useState(0);

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

  const weatherAccent = {
    "--accent": activeWeather.theme.primary,
    "--accent-2": activeWeather.theme.secondary,
  } as CSSProperties;

  return {
    activeWeather,
    setActiveWeather,
    activeWeatherEnemies,
    currentWeatherLocations,
    nextWeatherLocations,
    locationWeatherCounts,
    currentWeatherEnemyContext,
    favoredPreferenceCount,
    penalizedPreferenceCount,
    weatherAccent,
  };
}
