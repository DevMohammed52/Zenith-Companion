import React, { type ReactNode } from "react";
import {
  Castle,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Flame,
  Landmark,
  MapPin,
  Skull,
  Sparkles,
  Sun,
  Swords,
  Wind,
} from "lucide-react";
import { getSafeMarketValue } from "@/lib/market-pricing";
import {
  getGatheredResourcesForLocation,
  type GatheredResourceSource,
  type WorldLocation,
} from "@/lib/locations";
import {
  getWeatherPreferenceKind,
  isFavorableWeather,
  isPenalizedWeather,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";

export type PoiKind = "shrine" | "bank" | "dungeons" | "bosses" | "enemies";

export type ForecastWeather = {
  key?: string;
  icon?: string;
  name?: string;
  window?: string;
  starts_at?: string;
  starts_at_time?: string;
  ends_at?: string;
  buffs?: string[];
};

export type ForecastDay = {
  day_name?: string;
  date?: string;
  weathers?: ForecastWeather[];
};

export type DropSummary = {
  name: string;
  count: number;
  marketValue: number;
  imageUrl?: string;
  bestChance?: number;
  sourceTypes: string[];
};

export type GatheredResource = GatheredResourceSource & {
  marketValue: number;
  imageUrl?: string;
  kind: "Log" | "Ore" | "Fish" | "Material" | "Resource";
};

export type DropSourceEntity = {
  entity: any;
  type: "Enemy" | "Dungeon" | "World Boss";
};

export type MapLocation = WorldLocation & {
  key: string;
  name: string;
  image_url?: string | null;
  forecast?: ForecastDay[];
  level: number | null;
  enemies: any[];
  favoredEnemies: EnrichedEnemy[];
  penalizedEnemies: EnrichedEnemy[];
  dungeons: any[];
  bosses: any[];
  drops: DropSummary[];
  resources: GatheredResource[];
  currentWeather: ForecastWeather | null;
  nextWeather: ForecastWeather | null;
};

export type PointOfInterest = {
  kind: PoiKind;
  label: string;
  detail: string;
};

export const LOCATION_FACILITIES: Record<string, PoiKind[]> = {
  "bluebell-hollow": ["shrine"],
  "eldoria": ["shrine", "bank"],
  "floating-gardens-of-aetheria": ["shrine", "bank"],
  "isle-of-whispers": ["shrine"],
  "skyreach-peak": ["shrine"],
  "the-citadel": ["shrine", "bank"],
};

export const WEATHER_COLORS: Record<string, string> = {
  CLEAR: "#f5b041",
  FOG: "#94a3b8",
  HEATWAVE: "#fb923c",
  MAGIC_STORM: "#c084fc",
  OVERCAST: "#64748b",
  RAIN: "#38bdf8",
  SNOW: "#dbeafe",
  STORM: "#818cf8",
  WINDY: "#2dd4bf",
};

export const WORLD_MAP_IMAGE_URL = "https://cdn.idle-mmo.com/global/world-map.png";
export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 1000;

export function weatherIcon(key?: string, size = 16) {
  switch (String(key || "").toUpperCase()) {
    case "CLEAR":
      return <Sun size={size} />;
    case "FOG":
      return <CloudFog size={size} />;
    case "HEATWAVE":
      return <Flame size={size} />;
    case "MAGIC_STORM":
      return <Sparkles size={size} />;
    case "RAIN":
      return <CloudRain size={size} />;
    case "SNOW":
      return <CloudSnow size={size} />;
    case "STORM":
      return <CloudLightning size={size} />;
    case "WINDY":
      return <Wind size={size} />;
    default:
      return <Cloud size={size} />;
  }
}

export function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

export function formatGold(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

export function formatChance(value?: number) {
  if (!value || !Number.isFinite(value)) return null;
  return `${Number.isInteger(value) ? value : value.toFixed(1)}% best`;
}

export function safeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatWindow(weather: ForecastWeather | null) {
  if (!weather) return "No active window";
  const start = safeDate(weather.starts_at);
  const end = safeDate(weather.ends_at);
  if (!start || !end) return weather.window || "Window unknown";
  return `${start.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export function getForecastEnemyCrosscheck(weather: ForecastWeather, enemies: EnrichedEnemy[]) {
  const weatherName = weather.name || weather.key || "";
  const buckets = {
    favored: [] as EnrichedEnemy[],
    neutral: [] as EnrichedEnemy[],
    penalized: [] as EnrichedEnemy[],
  };

  for (const enemy of enemies) {
    const match = getWeatherPreferenceKind(enemy.weatherPreference, weatherName);
    if (isFavorableWeather(match)) buckets.favored.push(enemy);
    if (match === "neutral") buckets.neutral.push(enemy);
    if (isPenalizedWeather(match)) buckets.penalized.push(enemy);
  }

  return buckets;
}

export function getWeatherTimeline(location: { forecast?: ForecastDay[] }) {
  const forecast = (location.forecast || []) as ForecastDay[];
  const seen = new Set<string>();
  return forecast
    .flatMap((day) => (day.weathers || []).map((weather) => ({ ...weather, day_name: day.day_name, date: day.date })))
    .filter((weather) => {
      if (!weather.starts_at || !weather.ends_at) return false;
      const key = `${weather.key || weather.name || "weather"}:${weather.starts_at}:${weather.ends_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime());
}

export function getCurrentWeather(location: WorldLocation) {
  const now = Date.now();
  const timeline = getWeatherTimeline({ forecast: location.forecast as ForecastDay[] | undefined });

  const current = timeline.find((weather) => {
    const start = safeDate(weather.starts_at)?.getTime() ?? 0;
    const end = safeDate(weather.ends_at)?.getTime() ?? 0;
    return start <= now && now < end;
  }) || null;
  const next = timeline.find((weather) => (safeDate(weather.starts_at)?.getTime() ?? 0) > now) || null;
  return { current, next };
}

export function getLocationPosition(location: WorldLocation) {
  const x = Math.max(4, Math.min(96, (Number(location.x || 0) / MAP_WIDTH) * 100));
  const y = Math.max(4, Math.min(96, (Number(location.y || 0) / MAP_HEIGHT) * 100));
  return { x, y };
}

export function getNumericField(row: any, fields: string[]) {
  for (const field of fields) {
    const value = Number(row?.[field]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

export function getLocationLevel(enemies: any[], dungeons: any[], bosses: any[]) {
  const enemyLevels = enemies
    .map((enemy) => getNumericField(enemy, ["level"]))
    .filter((level): level is number => level !== null);
  if (enemyLevels.length > 0) return Math.min(...enemyLevels);

  const requirementLevels = [...dungeons, ...bosses]
    .map((row) => getNumericField(row, ["required_level", "required_stats", "difficulty", "level"]))
    .filter((level): level is number => level !== null);
  return requirementLevels.length > 0 ? Math.min(...requirementLevels) : null;
}

export function poiIcon(kind: PoiKind, size = 15) {
  switch (kind) {
    case "shrine":
      return <Sparkles size={size} />;
    case "bank":
      return <Landmark size={size} />;
    case "enemies":
      return <Swords size={size} />;
    case "dungeons":
      return <Castle size={size} />;
    case "bosses":
      return <Skull size={size} />;
    default:
      return <MapPin size={size} />;
  }
}

export function buildPointsOfInterest(location: MapLocation): PointOfInterest[] {
  const points: PointOfInterest[] = [];
  const facilities = LOCATION_FACILITIES[location.key] || [];
  if (facilities.includes("shrine")) {
    points.push({ kind: "shrine", label: "Shrine", detail: "Point of interest" });
  }
  if (facilities.includes("bank")) {
    points.push({ kind: "bank", label: "Bank", detail: "Point of interest" });
  }
  if (location.dungeons.length > 0) {
    points.push({ kind: "dungeons", label: "Dungeons", detail: formatCount(location.dungeons.length, "dungeon") });
  }
  if (location.bosses.length > 0) {
    points.push({ kind: "bosses", label: "Bosses", detail: formatCount(location.bosses.length, "boss", "bosses") });
  }
  if (location.enemies.length > 0) {
    points.push({ kind: "enemies", label: "Enemies", detail: formatCount(location.enemies.length, "enemy", "enemies") });
  }
  return points;
}

export function buildDropSummaries(sources: DropSourceEntity[], marketData: Record<string, any> | null, allItemsDb: Record<string, any> | null) {
  const drops = new Map<string, DropSummary>();

  for (const source of sources) {
    const entity = source.entity;
    for (const drop of entity.loot || []) {
      if (!drop?.name) continue;
      const existing: DropSummary = drops.get(drop.name) || {
        name: drop.name,
        count: 0,
        marketValue: getSafeMarketValue(marketData?.[drop.name]),
        imageUrl: drop.image_url || allItemsDb?.[drop.name]?.image_url || marketData?.[drop.name]?.image_url,
        bestChance: 0,
        sourceTypes: [],
      };
      existing.count += 1;
      existing.bestChance = Math.max(existing.bestChance || 0, Number(drop.chance || 0));
      if (!existing.sourceTypes.includes(source.type)) existing.sourceTypes.push(source.type);
      drops.set(drop.name, existing);
    }
  }

  return Array.from(drops.values())
    .sort((a, b) => {
      const valueDiff = b.marketValue - a.marketValue;
      if (valueDiff !== 0) return valueDiff;
      return a.name.localeCompare(b.name);
    });
}

export function getResourceKind(item: any): GatheredResource["kind"] {
  const type = String(item?.type || "").toUpperCase();
  if (type === "LOG") return "Log";
  if (type === "ORE") return "Ore";
  if (type === "FISH") return "Fish";
  if (type === "CONSTRUCTION_MATERIAL") return "Material";
  return "Resource";
}

export function buildGatheredResources(
  locationKey: string,
  marketData: Record<string, any> | null,
  allItemsDb: Record<string, any> | null,
) {
  return getGatheredResourcesForLocation(locationKey).map((resource) => {
    const item = allItemsDb?.[resource.name] || marketData?.[resource.name];
    return {
      ...resource,
      marketValue: getSafeMarketValue(marketData?.[resource.name]),
      imageUrl: item?.image_url || item?.image,
      kind: getResourceKind(item),
    };
  });
}

export function getSourceKind(title: string) {
  if (title === "Enemies") return "enemy";
  if (title === "Dungeons") return "dungeon";
  if (title === "Bosses") return "boss";
  return "source";
}
