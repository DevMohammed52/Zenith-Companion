import React, { type ReactNode } from "react";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  ThermometerSun,
  Wind,
  Zap,
} from "lucide-react";
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

export function createWeatherBuckets(): WeatherEnemyBuckets {
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

export function getWeatherIcon(icon: string, size = 18): ReactNode {
  switch (icon) {
    case "sun": return <Sun size={size} />;
    case "cloud-fog": return <CloudFog size={size} />;
    case "thermometer-sun": return <ThermometerSun size={size} />;
    case "zap": return <Zap size={size} />;
    case "cloud": return <Cloud size={size} />;
    case "cloud-rain": return <CloudRain size={size} />;
    case "cloud-snow": return <CloudSnow size={size} />;
    case "cloud-lightning": return <CloudLightning size={size} />;
    case "wind": return <Wind size={size} />;
    default: return <Sun size={size} />;
  }
}
