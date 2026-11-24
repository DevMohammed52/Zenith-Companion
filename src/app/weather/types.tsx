import React from "react";
import type { IconConcept } from "@/lib/icons";
import { WEATHER_DATA, type WeatherData } from "@/constants/weatherData";
import {
  isFavorableWeather,
  isPenalizedWeather,
  normalizeWeatherKey,
  type EnrichedEnemy,
  type EnrichedLocation,
  type ForecastWeather,
  type WeatherPreferenceKind,
} from "@/lib/world-intelligence";

export const formatPercent = (value: number | null) => {
  if (!value) return "0%";
  return value > 0 ? `+${value}%` : `${value}%`;
};

export const modifierTone = (value: number | null) => {
  if (!value) return "neutral";
  return value > 0 ? "pos" : "neg";
};

export type WeatherEnemyBuckets = {
  loves: EnrichedEnemy[];
  likes: EnrichedEnemy[];
  dislikes: EnrichedEnemy[];
  hates: EnrichedEnemy[];
};

export type LocationWeatherCounts = {
  favored: number;
  penalized: number;
};

export const EMPTY_WEATHER_BUCKETS: WeatherEnemyBuckets = {
  loves: [],
  likes: [],
  dislikes: [],
  hates: [],
};

export function preferenceIncludes(enemy: EnrichedEnemy, kind: WeatherPreferenceKind, weatherName: string) {
  const preference = enemy.weatherPreference;
  if (!preference || kind === "unknown") return false;
  const weatherKey = normalizeWeatherKey(weatherName);
  return preference[kind].some((weather) => normalizeWeatherKey(weather) === weatherKey);
}

function createWeatherBuckets(): WeatherEnemyBuckets {
  return { loves: [], likes: [], dislikes: [], hates: [] };
}

export function buildWeatherPreferenceIndex(enemies: EnrichedEnemy[]) {
  const index = new Map<string, WeatherEnemyBuckets>();
  for (const weather of WEATHER_DATA) {
    index.set(normalizeWeatherKey(weather.name), createWeatherBuckets());
  }

  for (const enemy of enemies) {
    const preference = enemy.weatherPreference;
    if (!preference) continue;
    for (const weather of preference.loves) index.get(normalizeWeatherKey(weather))?.loves.push(enemy);
    for (const weather of preference.likes) index.get(normalizeWeatherKey(weather))?.likes.push(enemy);
    for (const weather of preference.dislikes) index.get(normalizeWeatherKey(weather))?.dislikes.push(enemy);
    for (const weather of preference.hates) index.get(normalizeWeatherKey(weather))?.hates.push(enemy);
  }

  return index;
}

export function buildCurrentWeatherEnemyIndex(enemies: EnrichedEnemy[]) {
  const index = new Map<string, { favored: EnrichedEnemy[]; penalized: EnrichedEnemy[] }>();
  for (const enemy of enemies) {
    const weatherKey = normalizeWeatherKey(enemy.currentWeather?.name || enemy.currentWeather?.key || enemy.currentWeather?.icon);
    if (!weatherKey) continue;
    const group = index.get(weatherKey) || { favored: [], penalized: [] };
    if (isFavorableWeather(enemy.currentWeatherMatch)) group.favored.push(enemy);
    if (isPenalizedWeather(enemy.currentWeatherMatch)) group.penalized.push(enemy);
    index.set(weatherKey, group);
  }
  return index;
}

export function getLocationWeatherCounts(location: EnrichedLocation, weatherName: string): LocationWeatherCounts {
  let favored = 0;
  let penalized = 0;
  for (const enemy of location.enemies) {
    if (preferenceIncludes(enemy, "loves", weatherName) || preferenceIncludes(enemy, "likes", weatherName)) favored += 1;
    if (preferenceIncludes(enemy, "dislikes", weatherName) || preferenceIncludes(enemy, "hates", weatherName)) penalized += 1;
  }
  return { favored, penalized };
}

export function weatherMatches(weather: ForecastWeather | null | undefined, activeWeather: WeatherData) {
  if (!weather) return false;
  const activeKey = normalizeWeatherKey(activeWeather.name);
  return normalizeWeatherKey(weather.name || weather.key || weather.icon) === activeKey;
}

export function formatForecastTime(weather: ForecastWeather | null | undefined) {
  if (!weather) return "No window";
  const start = weather.starts_at ? new Date(weather.starts_at) : null;
  const end = weather.ends_at ? new Date(weather.ends_at) : null;
  if (!start || !end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return weather.window || "Window pending";
  }
  const sameDay = start.toDateString() === end.toDateString();
  const startText = start.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const endText = end.toLocaleString(undefined, sameDay ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return `${startText} - ${endText}`;
}

export function formatForecastAriaLabel(weatherName: string, mode: string, location: EnrichedLocation, weather: ForecastWeather | null | undefined) {
  return `${weatherName} ${mode.toLowerCase()} in ${location.name}, ${formatForecastTime(weather)}`;
}

export function getEnemyWeatherLabel(enemy: EnrichedEnemy, context: string) {
  return `${enemy.name}, level ${enemy.level}, ${enemy.locationName}, ${context}`;
}

export function formatRelativeCountdown(weather: ForecastWeather | null | undefined, now = Date.now()) {
  if (!weather?.starts_at || !weather?.ends_at) {
    return { label: weather?.window || "Window pending", isLive: false, mode: "pending" as const };
  }
  const start = new Date(weather.starts_at).getTime();
  const end = new Date(weather.ends_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { label: weather.window || "Window pending", isLive: false, mode: "pending" as const };
  }
  if (start <= now && now < end) {
    const mins = Math.max(1, Math.round((end - now) / 60_000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const label = h > 0 ? `${h}h ${m}m left` : `${m}m left`;
    return { label, isLive: true, mode: "active" as const };
  }
  if (now < start) {
    const mins = Math.max(1, Math.round((start - now) / 60_000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const label = h > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${m}m`;
    return { label, isLive: false, mode: "upcoming" as const };
  }
  return { label: "Window ended", isLive: false, mode: "ended" as const };
}

export function getWeatherConcept(weatherIdOrIcon: string): IconConcept {
  switch (weatherIdOrIcon) {
    case "clear":
    case "sun":
      return "weatherClear";
    case "overcast":
    case "cloud":
      return "weatherOvercast";
    case "rain":
    case "cloud-rain":
      return "weatherRain";
    case "fog":
    case "cloud-fog":
      return "weatherFog";
    case "storm":
    case "cloud-lightning":
      return "weatherStorm";
    case "magic-storm":
    case "zap":
      return "weatherMagicStorm";
    case "windy":
    case "wind":
      return "weatherWindy";
    case "snow":
    case "cloud-snow":
      return "weatherSnow";
    case "heatwave":
    case "thermometer-sun":
      return "weatherHeatwave";
    default:
      return "weather";
  }
}


