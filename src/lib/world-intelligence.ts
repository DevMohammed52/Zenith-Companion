import enemyWeatherPreferenceData from "@/data/enemy-weather-preferences.json";
import { getSafeMarketValue } from "@/lib/market-pricing";
import {
  GATHERED_RESOURCE_SOURCE_NOTE,
  getGatheredResourcesForLocation,
  normalizeLocationKey,
  type GatheredResourceSource,
  type WorldLocation,
} from "@/lib/locations";

export type WeatherPreferenceKind = "loves" | "likes" | "neutral" | "dislikes" | "hates" | "unknown";

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

export type EnemyWeatherPreference = {
  enemy_id: number | null;
  enemy_name: string;
  enemy_key: string;
  enemy_level: number;
  location_name: string | null;
  location_key: string;
  confidence: string;
  loves: string[];
  likes: string[];
  neutral: string[];
  dislikes: string[];
  hates: string[];
  notes: string | null;
};

export type EnrichedEnemy = {
  id: number | null;
  name: string;
  key: string;
  imageUrl?: string;
  level: number;
  health: number;
  experience: number;
  chanceOfLoot: number;
  locationName: string;
  locationKey: string;
  loot: any[];
  lootCount: number;
  lootEv: number;
  weatherPreference: EnemyWeatherPreference | null;
  currentWeather: ForecastWeather | null;
  nextWeather: ForecastWeather | null;
  currentWeatherMatch: WeatherPreferenceKind;
  nextFavorableWeather: ForecastWeather | null;
  searchText: string;
};

export type EnrichedResource = GatheredResourceSource & {
  imageUrl?: string;
  marketValue: number;
  kind: "Log" | "Ore" | "Fish" | "Material" | "Resource";
};

export type EnrichedLocation = WorldLocation & {
  key: string;
  name: string;
  enemies: EnrichedEnemy[];
  resources: EnrichedResource[];
  currentWeather: ForecastWeather | null;
  nextWeather: ForecastWeather | null;
  weatherTimeline: ForecastWeather[];
  favoredEnemies: EnrichedEnemy[];
  penalizedEnemies: EnrichedEnemy[];
};

export const ENEMY_WEATHER_PREFERENCES = enemyWeatherPreferenceData.entries as EnemyWeatherPreference[];
export const ENEMY_WEATHER_META = enemyWeatherPreferenceData.meta;
export const GATHERED_RESOURCE_NOTE = GATHERED_RESOURCE_SOURCE_NOTE;

export function normalizeWeatherKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
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

export function getCurrentWeather(location: { forecast?: ForecastDay[] }, now = Date.now()) {
  const timeline = getWeatherTimeline(location);
  const current = timeline.find((weather) => {
    const start = safeDate(weather.starts_at)?.getTime() ?? 0;
    const end = safeDate(weather.ends_at)?.getTime() ?? 0;
    return start <= now && now < end;
  }) || null;
  const next = timeline.find((weather) => (safeDate(weather.starts_at)?.getTime() ?? 0) > now) || null;
  return { current, next, timeline };
}

export function getWeatherPreferenceKind(preference: EnemyWeatherPreference | null, weatherNameOrKey?: string): WeatherPreferenceKind {
  if (!preference || !weatherNameOrKey) return "unknown";
  const weatherKey = normalizeWeatherKey(weatherNameOrKey);
  if (preference.loves.some((weather) => normalizeWeatherKey(weather) === weatherKey)) return "loves";
  if (preference.likes.some((weather) => normalizeWeatherKey(weather) === weatherKey)) return "likes";
  if (preference.neutral.some((weather) => normalizeWeatherKey(weather) === weatherKey)) return "neutral";
  if (preference.dislikes.some((weather) => normalizeWeatherKey(weather) === weatherKey)) return "dislikes";
  if (preference.hates.some((weather) => normalizeWeatherKey(weather) === weatherKey)) return "hates";
  return "unknown";
}

export function getWeatherPreferenceLabel(kind: WeatherPreferenceKind) {
  switch (kind) {
    case "loves":
      return "Loves";
    case "likes":
      return "Likes";
    case "neutral":
      return "Neutral";
    case "dislikes":
      return "Dislikes";
    case "hates":
      return "Hates";
    default:
      return "Unknown";
  }
}

export function isFavorableWeather(kind: WeatherPreferenceKind) {
  return kind === "loves" || kind === "likes";
}

export function isPenalizedWeather(kind: WeatherPreferenceKind) {
  return kind === "dislikes" || kind === "hates";
}

export function compareEnemiesByProgression(a: EnrichedEnemy, b: EnrichedEnemy) {
  return a.level - b.level
    || a.health - b.health
    || a.experience - b.experience
    || a.chanceOfLoot - b.chanceOfLoot
    || a.name.localeCompare(b.name);
}

function preferenceKey(enemyName: string, locationName: string) {
  return `${normalizeLocationKey(enemyName)}:${normalizeLocationKey(locationName)}`;
}

function buildPreferenceLookup() {
  const lookup = new Map<string, EnemyWeatherPreference>();
  for (const preference of ENEMY_WEATHER_PREFERENCES) {
    if (preference.enemy_id !== null && preference.enemy_id !== undefined) {
      lookup.set(`id:${preference.enemy_id}`, preference);
    }
    lookup.set(preferenceKey(preference.enemy_name, preference.location_name || ""), preference);
  }
  return lookup;
}

function buildLocationLookup(worldLocations: WorldLocation[] | null | undefined) {
  const lookup = new Map<string, WorldLocation>();
  for (const location of worldLocations || []) {
    const key = normalizeLocationKey(location.key || location.name || location.id);
    if (!key) continue;
    lookup.set(key, location);
    lookup.set(normalizeLocationKey(location.name), location);
    if (location.id !== undefined && location.id !== null) lookup.set(`id:${location.id}`, location);
  }
  return lookup;
}

function getResourceKind(item: any): EnrichedResource["kind"] {
  const type = String(item?.type || "").toUpperCase();
  if (type === "LOG") return "Log";
  if (type === "ORE") return "Ore";
  if (type === "FISH") return "Fish";
  if (type === "CONSTRUCTION_MATERIAL") return "Material";
  return "Resource";
}

function getLootEv(enemy: any, marketData: Record<string, any> | null | undefined) {
  const chanceOfLoot = Number(enemy.chance_of_loot || 0) / 100;
  return (enemy.loot || []).reduce((sum: number, drop: any) => {
    const dropChance = Number(drop.chance || 0) / 100;
    const quantity = Number(drop.quantity || 1);
    return sum + chanceOfLoot * dropChance * quantity * getSafeMarketValue(marketData?.[drop.name]);
  }, 0);
}

function getNextFavorableWeather(preference: EnemyWeatherPreference | null, timeline: ForecastWeather[], now = Date.now()) {
  if (!preference) return null;
  return timeline.find((weather) => {
    const start = safeDate(weather.starts_at)?.getTime() ?? 0;
    return start > now && isFavorableWeather(getWeatherPreferenceKind(preference, weather.name || weather.key));
  }) || null;
}

export function buildEnrichedEnemies({
  staticData,
  worldLocations,
  marketData,
  now = Date.now(),
}: {
  staticData: Record<string, any> | null | undefined;
  worldLocations: WorldLocation[] | null | undefined;
  marketData?: Record<string, any> | null;
  now?: number;
}) {
  const preferenceLookup = buildPreferenceLookup();
  const locationLookup = buildLocationLookup(worldLocations);

  return ((staticData?.enemies || []) as any[]).map((enemy) => {
    const locationName = String(enemy.location?.name || "Unknown");
    const locationKey = normalizeLocationKey(enemy.location?.key || enemy.location?.name || enemy.location?.id);
    const location = locationLookup.get(locationKey) || locationLookup.get(`id:${enemy.location?.id}`) || null;
    const { current, next, timeline } = location ? getCurrentWeather({ forecast: location.forecast as ForecastDay[] | undefined }, now) : { current: null, next: null, timeline: [] };
    const enemyId = Number.isFinite(Number(enemy.id)) ? Number(enemy.id) : null;
    const weatherPreference = (enemyId !== null ? preferenceLookup.get(`id:${enemyId}`) : null)
      || preferenceLookup.get(preferenceKey(enemy.name, locationName))
      || null;
    const currentWeatherMatch = getWeatherPreferenceKind(weatherPreference, current?.name || current?.key);

    const loot = Array.isArray(enemy.loot) ? enemy.loot : [];
    const enriched = {
      id: enemyId,
      name: String(enemy.name || "Unknown"),
      key: normalizeLocationKey(enemy.name),
      imageUrl: enemy.image_url,
      level: Number(enemy.level || 0),
      health: Number(enemy.health || 0),
      experience: Number(enemy.experience || 0),
      chanceOfLoot: Number(enemy.chance_of_loot || 0),
      locationName,
      locationKey,
      loot,
      lootCount: loot.length,
      lootEv: getLootEv(enemy, marketData),
      weatherPreference,
      currentWeather: current,
      nextWeather: next,
      currentWeatherMatch,
      nextFavorableWeather: getNextFavorableWeather(weatherPreference, timeline, now),
      searchText: "",
    } satisfies EnrichedEnemy;

    enriched.searchText = [
      enriched.name,
      enriched.locationName,
      enriched.currentWeather?.name || "",
      enriched.nextWeather?.name || "",
      ...(weatherPreference?.loves || []),
      ...(weatherPreference?.likes || []),
      ...(weatherPreference?.neutral || []),
      ...(weatherPreference?.dislikes || []),
      ...(weatherPreference?.hates || []),
      ...loot.map((drop: any) => drop.name),
    ].join(" ").toLowerCase();

    return enriched;
  }).sort(compareEnemiesByProgression);
}

export function buildEnrichedResources(
  locationKey: string,
  marketData: Record<string, any> | null | undefined,
  allItemsDb: Record<string, any> | null | undefined,
) {
  return getGatheredResourcesForLocation(locationKey).map((resource) => {
    const item = allItemsDb?.[resource.name] || marketData?.[resource.name];
    return {
      ...resource,
      marketValue: getSafeMarketValue(marketData?.[resource.name]),
      imageUrl: item?.image_url || item?.image,
      kind: getResourceKind(item),
    } satisfies EnrichedResource;
  });
}

export function buildEnrichedLocations({
  staticData,
  worldLocations,
  marketData,
  allItemsDb,
}: {
  staticData: Record<string, any> | null | undefined;
  worldLocations: WorldLocation[] | null | undefined;
  marketData?: Record<string, any> | null;
  allItemsDb?: Record<string, any> | null;
}) {
  const enemies = buildEnrichedEnemies({ staticData, worldLocations, marketData });
  const enemyGroups = new Map<string, EnrichedEnemy[]>();
  for (const enemy of enemies) {
    const group = enemyGroups.get(enemy.locationKey) || [];
    group.push(enemy);
    enemyGroups.set(enemy.locationKey, group);
  }

  return (worldLocations || []).map((location) => {
    const key = normalizeLocationKey(location.key || location.name || location.id);
    const { current, next, timeline } = getCurrentWeather({ forecast: location.forecast as ForecastDay[] | undefined });
    const locationEnemies = enemyGroups.get(key) || [];
    return {
      ...location,
      key,
      name: String(location.name || location.key || location.id || "Unknown"),
      enemies: locationEnemies,
      resources: buildEnrichedResources(key, marketData, allItemsDb),
      currentWeather: current,
      nextWeather: next,
      weatherTimeline: timeline,
      favoredEnemies: locationEnemies.filter((enemy) => isFavorableWeather(enemy.currentWeatherMatch)),
      penalizedEnemies: locationEnemies.filter((enemy) => isPenalizedWeather(enemy.currentWeatherMatch)),
    } satisfies EnrichedLocation;
  });
}
