"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  CalendarDays,
  Castle,
  ChevronDown,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Compass,
  Crosshair,
  ExternalLink,
  Flame,
  Landmark,
  Map as MapIcon,
  MapPin,
  Package,
  Search,
  Skull,
  Sparkles,
  Sun,
  Swords,
  Wind,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { getSafeMarketValue } from "@/lib/market-pricing";
import {
  GATHERED_RESOURCE_SOURCE_NOTE,
  getGatheredResourcesForLocation,
  normalizeLocationKey,
  type GatheredResourceSource,
  type WorldLocation,
} from "@/lib/locations";
import {
  buildEnrichedEnemies,
  getWeatherPreferenceKind,
  getWeatherPreferenceLabel,
  isFavorableWeather,
  isPenalizedWeather,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";

type PoiKind = "shrine" | "bank" | "dungeons" | "bosses" | "enemies";

type ForecastWeather = {
  key?: string;
  icon?: string;
  name?: string;
  window?: string;
  starts_at?: string;
  starts_at_time?: string;
  ends_at?: string;
  buffs?: string[];
};

type ForecastDay = {
  day_name?: string;
  date?: string;
  weathers?: ForecastWeather[];
};

type DropSummary = {
  name: string;
  count: number;
  marketValue: number;
  imageUrl?: string;
  bestChance?: number;
  sourceTypes: string[];
};

type GatheredResource = GatheredResourceSource & {
  marketValue: number;
  imageUrl?: string;
  kind: "Log" | "Ore" | "Fish" | "Material" | "Resource";
};

type DropSourceEntity = {
  entity: any;
  type: "Enemy" | "Dungeon" | "World Boss";
};

type MapLocation = WorldLocation & {
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

type PointOfInterest = {
  kind: PoiKind;
  label: string;
  detail: string;
};

const LOCATION_FACILITIES: Record<string, PoiKind[]> = {
  "bluebell-hollow": ["shrine"],
  "eldoria": ["shrine", "bank"],
  "floating-gardens-of-aetheria": ["shrine", "bank"],
  "isle-of-whispers": ["shrine"],
  "skyreach-peak": ["shrine"],
  "the-citadel": ["shrine", "bank"],
};

const WEATHER_COLORS: Record<string, string> = {
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

const WORLD_MAP_IMAGE_URL = "https://cdn.idle-mmo.com/global/world-map.png";
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 1000;

function weatherIcon(key?: string, size = 16) {
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

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function formatGold(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

function formatChance(value?: number) {
  if (!value || !Number.isFinite(value)) return null;
  return `${Number.isInteger(value) ? value : value.toFixed(1)}% best`;
}

function safeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatWindow(weather: ForecastWeather | null) {
  if (!weather) return "No active window";
  const start = safeDate(weather.starts_at);
  const end = safeDate(weather.ends_at);
  if (!start || !end) return weather.window || "Window unknown";
  return `${start.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function getForecastEnemyCrosscheck(weather: ForecastWeather, enemies: EnrichedEnemy[]) {
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

function ForecastEnemyGroup({
  label,
  enemies,
  tone,
}: {
  label: string;
  enemies: EnrichedEnemy[];
  tone: "favored" | "neutral" | "penalized";
}) {
  return (
    <div className={`forecast-enemy-group ${tone}`}>
      <strong>
        {label}
        <span>{enemies.length}</span>
      </strong>
      <div className="forecast-enemy-list">
        {enemies.length === 0 ? (
          <span className="forecast-none">None mapped</span>
        ) : (
          enemies.slice(0, 4).map((enemy) => (
            <Link
              className="forecast-enemy-chip"
              href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
              key={`${tone}-${enemy.name}`}
            >
              {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" /> : <Swords size={13} />}
              <span>{enemy.name}</span>
            </Link>
          ))
        )}
        {enemies.length > 4 && <span className="forecast-more">+{enemies.length - 4} more</span>}
      </div>
    </div>
  );
}

function getWeatherTimeline(location: { forecast?: ForecastDay[] }) {
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

function getCurrentWeather(location: WorldLocation) {
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

function getLocationPosition(location: WorldLocation) {
  const x = Math.max(4, Math.min(96, (Number(location.x || 0) / MAP_WIDTH) * 100));
  const y = Math.max(4, Math.min(96, (Number(location.y || 0) / MAP_HEIGHT) * 100));
  return { x, y };
}

function getNumericField(row: any, fields: string[]) {
  for (const field of fields) {
    const value = Number(row?.[field]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function getLocationLevel(enemies: any[], dungeons: any[], bosses: any[]) {
  const enemyLevels = enemies
    .map((enemy) => getNumericField(enemy, ["level"]))
    .filter((level): level is number => level !== null);
  if (enemyLevels.length > 0) return Math.min(...enemyLevels);

  const requirementLevels = [...dungeons, ...bosses]
    .map((row) => getNumericField(row, ["required_level", "required_stats", "difficulty", "level"]))
    .filter((level): level is number => level !== null);
  return requirementLevels.length > 0 ? Math.min(...requirementLevels) : null;
}

function poiIcon(kind: PoiKind, size = 15) {
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

function buildPointsOfInterest(location: MapLocation): PointOfInterest[] {
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

function buildDropSummaries(sources: DropSourceEntity[], marketData: Record<string, any> | null, allItemsDb: Record<string, any> | null) {
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

function getResourceKind(item: any): GatheredResource["kind"] {
  const type = String(item?.type || "").toUpperCase();
  if (type === "LOG") return "Log";
  if (type === "ORE") return "Ore";
  if (type === "FISH") return "Fish";
  if (type === "CONSTRUCTION_MATERIAL") return "Material";
  return "Resource";
}

function buildGatheredResources(
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

function WeatherEnemyStrip({ title, enemies, empty }: { title: string; enemies: EnrichedEnemy[]; empty: string }) {
  return (
    <div className="weather-enemy-strip">
      <h3>{title}</h3>
      <div className="weather-enemy-list">
        {enemies.slice(0, 6).map((enemy) => (
          <Link
            key={`${title}-${enemy.locationKey}-${enemy.name}`}
            href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
            className={`weather-enemy-chip ${isFavorableWeather(enemy.currentWeatherMatch) ? "good" : "bad"}`}
          >
            {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" /> : <Swords size={18} />}
            <span>
              <strong>{enemy.name}</strong>
              <small>{getWeatherPreferenceLabel(enemy.currentWeatherMatch)}</small>
            </span>
          </Link>
        ))}
        {enemies.length === 0 && <p className="muted-empty">{empty}</p>}
      </div>
    </div>
  );
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const { staticData, marketData, allItemsDb, worldLocations, loading } = useData();
  const { openItemByName } = useItemModal();
  const [selectedKey, setSelectedKey] = useState("");
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
    if (selectedKey && locations.some((location) => location.key === selectedKey)) return;
    if (locations.length > 0) setSelectedKey(locations[0].key);
  }, [locations, selectedKey]);

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

  const selectedPointsOfInterest = selectedLocation ? buildPointsOfInterest(selectedLocation) : [];
  const selectedVisibleDrops = useMemo(() => {
    if (!selectedLocation) return [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return selectedLocation.drops.slice(0, 12);
    const matchingDrops = selectedLocation.drops.filter((drop) => drop.name.toLowerCase().includes(normalizedQuery));
    return (matchingDrops.length > 0 ? matchingDrops : selectedLocation.drops).slice(0, 12);
  }, [query, selectedLocation]);

  if (!selectedLocation && loading) {
    return (
      <main className="map-page">
        <div className="map-loading">Loading atlas data...</div>
      </main>
    );
  }

  return (
    <main className="map-page">
      <section className="atlas-shell" aria-label="World map">
        <div className="atlas-panel">
          <div className="atlas-topbar">
            <div className="atlas-title">
              <span><ZenithIcon name="map" size={16} /> Zenith Atlas</span>
              <h1>Valaron Map</h1>
            </div>
            <div className="atlas-search">
              <Search size={15} aria-hidden="true" />
              <input
                aria-label="Search locations and sources"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search location, boss, dungeon, enemy, loot..."
              />
            </div>
          </div>

          <div className="map-result-count" aria-live="polite">
            {filteredLocations.length === locations.length
              ? `${locations.length.toLocaleString()} locations`
              : `${filteredLocations.length.toLocaleString()} matching locations`}
          </div>

          <div className="map-stage">
            <img className="world-map-art" src={WORLD_MAP_IMAGE_URL} alt="" aria-hidden="true" />

            {filteredLocations.map((location) => {
              const position = getLocationPosition(location);
              const active = selectedLocation?.key === location.key;
              const weatherKey = String(location.currentWeather?.key || location.nextWeather?.key || "OVERCAST").toUpperCase();
              const accent = WEATHER_COLORS[weatherKey] || "#f5b041";
              const edgeClass = [
                position.x > 78 ? "edge-right" : "",
                position.x < 18 ? "edge-left" : "",
                position.y > 78 ? "edge-bottom" : "",
                position.y < 12 ? "edge-top" : "",
              ].filter(Boolean).join(" ");

              return (
                <button
                  type="button"
                  key={location.key}
                  className={`map-pin ${edgeClass} ${active ? "active" : ""}`}
                  style={{ left: `${position.x}%`, top: `${position.y}%`, "--pin-accent": accent } as React.CSSProperties}
                  aria-pressed={active}
                  aria-label={`${location.name} map location${location.level !== null ? `, Level ${location.level}` : ""}`}
                  onClick={() => setSelectedKey(location.key)}
                >
                  <span className="pin-title">
                    <span className="pin-name">{location.name}</span>
                    <span className="pin-weather" aria-hidden="true">{weatherIcon(weatherKey, 14)}</span>
                  </span>
                  {location.level !== null && <span className="pin-level">Level {location.level}</span>}
                </button>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="map-empty-state" role="status">
                <Search size={18} />
                <strong>No matching locations</strong>
                <span>Adjust the search query.</span>
              </div>
            )}

            <div className="map-compass" aria-hidden="true">
              <Compass size={34} />
              <span>N</span>
            </div>
          </div>

          <div className="mobile-location-rail" aria-label="Map locations">
            {filteredLocations.map((location) => {
              const active = selectedLocation?.key === location.key;
              const weatherKey = String(location.currentWeather?.key || location.nextWeather?.key || "OVERCAST").toUpperCase();
              return (
                <button
                  type="button"
                  key={`rail-${location.key}`}
                  className={active ? "active" : ""}
                  aria-pressed={active}
                  onClick={() => setSelectedKey(location.key)}
                >
                  <span>{weatherIcon(weatherKey, 13)} {location.name}</span>
                  {location.level !== null && <small>Lv.{location.level}</small>}
                </button>
              );
            })}
          </div>

          <div className="atlas-metrics" aria-label="Map totals">
            <div><MapPin size={16} /><span>Locations</span><strong>{totals.locations}</strong></div>
            <div><Swords size={16} /><span>Enemies</span><strong>{totals.enemies}</strong></div>
            <div><Castle size={16} /><span>Dungeons</span><strong>{totals.dungeons}</strong></div>
            <div><Skull size={16} /><span>Bosses</span><strong>{totals.bosses}</strong></div>
            <div><Package size={16} /><span>Resources</span><strong>{totals.resources}</strong></div>
            <div><Box size={16} /><span>Loot</span><strong>{totals.drops}</strong></div>
          </div>
        </div>

        {selectedLocation && (
          <aside className="location-dossier" aria-label={`${selectedLocation.name} details`}>
            <div className="location-image">
              {selectedLocation.image_url ? <img src={selectedLocation.image_url} alt={`${selectedLocation.name} location art`} /> : <MapPin size={42} />}
            </div>
            <div className="location-heading">
              <span>Location</span>
              <h2>{selectedLocation.name}</h2>
              <p>{selectedLocation.description || "Browse nearby enemies, dungeons, bosses, gathered resources, loot drops, and weather windows."}</p>
            </div>

            <div className="weather-card" style={{ "--weather-accent": WEATHER_COLORS[String(selectedLocation.currentWeather?.key || selectedLocation.nextWeather?.key || "OVERCAST").toUpperCase()] || "#f5b041" } as React.CSSProperties}>
              <div className="weather-card-head">
                {weatherIcon(selectedLocation.currentWeather?.key || selectedLocation.nextWeather?.key, 24)}
                <div>
                  <span>{selectedLocation.currentWeather ? "Current Weather" : "Next Weather"}</span>
                  <strong>{selectedLocation.currentWeather?.name || selectedLocation.nextWeather?.name || "Unknown"}</strong>
                </div>
              </div>
              <p>{formatWindow(selectedLocation.currentWeather || selectedLocation.nextWeather)}</p>
              <div className="buff-list">
                {(selectedLocation.currentWeather?.buffs || selectedLocation.nextWeather?.buffs || []).slice(0, 5).map((buff) => (
                  <span key={buff}>{buff}</span>
                ))}
                {!(selectedLocation.currentWeather?.buffs || selectedLocation.nextWeather?.buffs || []).length && <span>No listed buffs</span>}
              </div>
            </div>

            <div className="weather-match-card">
              <header>
                <span><Swords size={15} /> Enemy Weather Match</span>
                <strong>{selectedLocation.favoredEnemies.length} / {selectedLocation.penalizedEnemies.length}</strong>
              </header>
              <WeatherEnemyStrip
                title="Favored now"
                enemies={selectedLocation.favoredEnemies}
                empty="No favored enemies in the current weather."
              />
              <WeatherEnemyStrip
                title="Penalized now"
                enemies={selectedLocation.penalizedEnemies}
                empty="No penalized enemies in the current weather."
              />
            </div>

            <div className="poi-card">
              <header>
                <span><Landmark size={15} /> Points of Interest</span>
                <strong>{selectedPointsOfInterest.length}</strong>
              </header>
              <div className="poi-list" role="list" aria-label={`${selectedLocation.name} points of interest`}>
                {selectedPointsOfInterest.map((point) => (
                  <span
                    key={`${selectedLocation.key}-${point.kind}`}
                    className="poi-chip"
                    role="listitem"
                  >
                    {poiIcon(point.kind)}
                    <span>
                      <strong>{point.label}</strong>
                      <small>{point.detail}</small>
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="source-strip">
              <div><Swords size={15} /><span>Enemies</span><strong>{selectedLocation.enemies.length}</strong></div>
              <div><Castle size={15} /><span>Dungeons</span><strong>{selectedLocation.dungeons.length}</strong></div>
              <div><Skull size={15} /><span>Bosses</span><strong>{selectedLocation.bosses.length}</strong></div>
              <div><Package size={15} /><span>Resources</span><strong>{selectedLocation.resources.length}</strong></div>
              <div><Box size={15} /><span>Loot</span><strong>{selectedLocation.drops.length}</strong></div>
            </div>

            <div className="quick-links">
              <Link href={`/combat?search=${encodeURIComponent(selectedLocation.name)}`}><Swords size={14} /> Combat <ExternalLink size={12} /></Link>
              <Link href={`/enemies?location=${encodeURIComponent(selectedLocation.key)}`}><Swords size={14} /> Enemies <ExternalLink size={12} /></Link>
              <Link href={`/dungeons?search=${encodeURIComponent(selectedLocation.name)}`}><Castle size={14} /> Dungeons <ExternalLink size={12} /></Link>
              <Link href={`/bosses?search=${encodeURIComponent(selectedLocation.name)}`}><Skull size={14} /> Bosses <ExternalLink size={12} /></Link>
            </div>
          </aside>
        )}
      </section>

      {selectedLocation && (
        <section className="intel-grid" aria-label={`${selectedLocation.name} source intelligence`}>
          <div className="intel-section source-list">
            <header>
              <span><Crosshair size={15} /> Regional Sources</span>
              <strong>{selectedLocation.name}</strong>
            </header>
            <div className="source-columns">
              <SourceColumn title="Enemies" icon={<Swords size={15} />} rows={selectedLocation.enemies} hrefBase="/enemies" />
              <SourceColumn title="Dungeons" icon={<Castle size={15} />} rows={selectedLocation.dungeons} hrefBase="/dungeons" />
              <SourceColumn title="Bosses" icon={<Skull size={15} />} rows={selectedLocation.bosses} hrefBase="/bosses" />
            </div>
          </div>

          <div className="intel-section drop-board">
            <header>
              <span><Box size={15} /> Loot Drops</span>
              <strong>{formatCount(selectedLocation.drops.length, "drop")}</strong>
            </header>
            <div className="drop-grid">
              {selectedVisibleDrops.map((drop) => (
                <button
                  type="button"
                  key={drop.name}
                  onClick={() => openItemByName(drop.name)}
                  className="drop-chip"
                  aria-label={`${drop.name}, ${formatGold(drop.marketValue)}, ${formatCount(drop.count, "source")}${formatChance(drop.bestChance) ? `, ${formatChance(drop.bestChance)}` : ""}`}
                >
                  {drop.imageUrl ? <img src={drop.imageUrl} alt="" /> : <Package size={18} />}
                  <span className="drop-copy">
                    <span className="drop-name">{drop.name}</span>
                    <small>{formatCount(drop.count, "source")}{formatChance(drop.bestChance) ? ` - ${formatChance(drop.bestChance)}` : ""}</small>
                  </span>
                  <strong>{formatGold(drop.marketValue)}</strong>
                </button>
              ))}
              {selectedLocation.drops.length === 0 && <p className="muted-empty">No confirmed combat, dungeon, or boss loot drops for this location yet.</p>}
            </div>
            {selectedLocation.drops.length > selectedVisibleDrops.length && (
              <p className="board-note">Showing {selectedVisibleDrops.length.toLocaleString()} of {selectedLocation.drops.length.toLocaleString()} mapped drops. Use search to narrow the list.</p>
            )}
          </div>

          <div className="intel-section resource-board">
            <header>
              <span><Package size={15} /> Gathered Resources</span>
              <strong>{formatCount(selectedLocation.resources.length, "resource")}</strong>
            </header>
            {selectedLocation.resources.length > 0 && (
              <p className="source-note">{GATHERED_RESOURCE_SOURCE_NOTE}</p>
            )}
            <div className="resource-grid">
              {selectedLocation.resources.map((resource) => (
                <button
                  type="button"
                  key={`${selectedLocation.key}-${resource.name}`}
                  onClick={() => openItemByName(resource.name)}
                  className="resource-chip"
                  aria-label={`${resource.name}, level ${resource.level}, ${resource.kind}${resource.marketValue > 0 ? `, ${formatGold(resource.marketValue)}` : ""}`}
                >
                  {resource.imageUrl ? <img src={resource.imageUrl} alt="" /> : <Package size={18} />}
                  <span className="resource-copy">
                    <span className="resource-name">{resource.name}</span>
                    <small>{resource.kind}{resource.marketValue > 0 ? ` - ${formatGold(resource.marketValue)}` : ""}</small>
                  </span>
                  <strong>Lv.{resource.level}</strong>
                </button>
              ))}
              {selectedLocation.resources.length === 0 && <p className="muted-empty">No gathered resources mapped for this location yet.</p>}
            </div>
          </div>

          <div className="intel-section forecast-board">
            <header>
              <span><CalendarDays size={15} /> Forecast Windows</span>
              <strong>{formatCount(getWeatherTimeline(selectedLocation).length, "window")}</strong>
            </header>
            <div className="forecast-list">
              {getWeatherTimeline(selectedLocation).length === 0 && (
                <p className="muted-empty">No forecast windows mapped for this location yet.</p>
              )}
              {getWeatherTimeline(selectedLocation).slice(0, 10).map((weather, index) => {
                const key = String(weather.key || "").toUpperCase();
                const forecastKey = `${weather.starts_at || "window"}-${index}`;
                const crosscheck = getForecastEnemyCrosscheck(weather, selectedLocation.enemies);
                const expanded = activeForecastKey === forecastKey;
                return (
                  <div
                    className={`forecast-item ${expanded ? "active" : ""}`}
                    key={forecastKey}
                    style={{ "--weather-accent": WEATHER_COLORS[key] || "#f5b041" } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className="forecast-row"
                      aria-expanded={expanded}
                      aria-controls={`forecast-crosscheck-${index}`}
                      onClick={() => setActiveForecastKey(expanded ? null : forecastKey)}
                    >
                      <span className="forecast-weather-name">{weatherIcon(key, 15)} {weather.name || "Weather"}</span>
                      <strong className="forecast-window-time">{formatWindow(weather)}</strong>
                      <span className="forecast-counts" aria-label={`${crosscheck.favored.length} favored enemies and ${crosscheck.penalized.length} penalized enemies`}>
                        <em className="favored">{crosscheck.favored.length} favored</em>
                        <em className="penalized">{crosscheck.penalized.length} penalized</em>
                      </span>
                      <ChevronDown className="forecast-chevron" aria-hidden="true" size={17} />
                    </button>
                    <div className="forecast-crosscheck" id={`forecast-crosscheck-${index}`} aria-hidden={!expanded}>
                      <ForecastEnemyGroup label="Favored" enemies={crosscheck.favored} tone="favored" />
                      <ForecastEnemyGroup label="Penalized" enemies={crosscheck.penalized} tone="penalized" />
                      <ForecastEnemyGroup label="Neutral" enemies={crosscheck.neutral} tone="neutral" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        .map-page {
          position: relative;
          min-height: calc(100vh - 40px);
          padding: clamp(1rem, 2vw, 2rem);
          overflow-x: hidden;
          background:
            linear-gradient(135deg, rgba(8, 31, 45, 0.86), rgba(5, 5, 5, 0.96) 44%, rgba(36, 24, 8, 0.9)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 96px),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 96px),
            var(--bg-base);
        }
        .map-page,
        .map-page * {
          box-sizing: border-box;
        }
        .map-loading {
          display: grid;
          min-height: 60vh;
          place-items: center;
          color: var(--text-muted);
          font-weight: 800;
        }
        .map-page :where(button, a, input):focus-visible {
          outline: 2px solid var(--border-focus) !important;
          outline-offset: 2px;
        }
        .atlas-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1rem;
          max-width: 1680px;
          margin: 0 auto;
          align-items: start;
        }
        .atlas-panel,
        .location-dossier,
        .intel-section {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(7, 9, 12, 0.72);
          box-shadow: 0 24px 70px rgba(0,0,0,0.32);
          backdrop-filter: blur(18px);
        }
        .atlas-panel {
          min-width: 0;
          align-self: start;
          border-radius: 12px;
          padding: clamp(0.85rem, 1.5vw, 1.2rem);
          overflow: hidden;
        }
        .atlas-topbar {
          display: grid;
          grid-template-columns: minmax(240px, 1fr) minmax(280px, 470px);
          gap: 1rem;
          align-items: end;
          margin-bottom: 0.85rem;
        }
        .atlas-title span,
        .location-heading span,
        .intel-section header span,
        .poi-card header span,
        .weather-card-head span {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .atlas-title h1 {
          margin-top: 0.15rem;
          color: #fff;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 1;
          letter-spacing: 0;
        }
        .atlas-search {
          position: relative;
          min-width: 0;
        }
        .atlas-search svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .atlas-search input {
          width: 100%;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          background: rgba(0,0,0,0.34);
          color: #fff;
          font: inherit;
          font-weight: 750;
          outline: none;
          padding: 0 0.85rem 0 2.45rem;
        }
        .atlas-search input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 82%);
        }
        .quick-links a,
        .drop-chip,
        .resource-chip,
        .poi-chip,
        .source-card,
        .map-pin {
          color: inherit;
          font: inherit;
        }
        .map-result-count {
          display: flex;
          justify-content: flex-end;
          min-height: 1rem;
          margin: -0.3rem 0 0.55rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 850;
        }
        .map-stage {
          position: relative;
          width: min(100%, 1040px);
          aspect-ratio: 1 / 1;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          background: #063d65;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.035), 0 20px 55px rgba(0,0,0,0.38);
        }
        .world-map-art {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          user-select: none;
        }
        .map-stage::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.2)),
            radial-gradient(circle at 54% 45%, transparent 0 48%, rgba(0,0,0,0.16) 78%, rgba(0,0,0,0.32) 100%);
          pointer-events: none;
          z-index: 1;
        }
        .map-empty-state {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 5;
          display: grid;
          justify-items: center;
          gap: 0.35rem;
          width: min(82%, 280px);
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          background: rgba(6, 10, 16, 0.82);
          box-shadow: 0 18px 48px rgba(0,0,0,0.42);
          color: #fff;
          padding: 1rem;
          text-align: center;
        }
        .map-empty-state svg {
          color: var(--text-accent);
        }
        .map-empty-state span {
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 750;
        }
        .map-pin {
          position: absolute;
          z-index: 3;
          display: inline-grid;
          gap: 0.32rem;
          min-width: 124px;
          width: clamp(124px, 13vw, 178px);
          max-width: 178px;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--pin-accent), rgba(255,255,255,0.14) 22%);
          border-radius: 8px;
          background: rgba(14, 22, 34, 0.78);
          box-shadow: 0 12px 34px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.035);
          backdrop-filter: blur(7px);
          cursor: pointer;
          transform: translate(-50%, -50%);
          padding: 0.55rem 0.62rem 0.6rem;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
        }
        .pin-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.28rem;
          min-width: 0;
          color: #fff;
          font-size: 0.86rem;
          font-weight: 900;
          line-height: 1.12;
          text-align: center;
        }
        .pin-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pin-weather {
          display: inline-grid;
          place-items: center;
          flex: 0 0 auto;
          color: var(--pin-accent);
          opacity: 0.92;
        }
        .pin-level {
          justify-self: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.72);
          font-size: 0.75rem;
          font-weight: 850;
          line-height: 1;
          padding: 0.36rem 0.6rem;
        }
        .map-pin:hover,
        .map-pin:focus-visible,
        .map-pin.active {
          border-color: color-mix(in srgb, var(--pin-accent), white 15%);
          background: rgba(13, 22, 35, 0.9);
          box-shadow: 0 18px 40px rgba(0,0,0,0.42), 0 0 0 3px color-mix(in srgb, var(--pin-accent), transparent 78%);
        }
        .map-pin:focus-visible {
          outline: none;
        }
        .map-pin.edge-left {
          transform: translate(-18%, -50%);
        }
        .map-pin.edge-right {
          transform: translate(-82%, -50%);
        }
        .map-pin.edge-top {
          transform: translate(-50%, -18%);
        }
        .map-pin.edge-bottom {
          transform: translate(-50%, -82%);
        }
        .map-pin.edge-left.edge-top {
          transform: translate(-18%, -18%);
        }
        .map-pin.edge-left.edge-bottom {
          transform: translate(-18%, -82%);
        }
        .map-pin.edge-right.edge-top {
          transform: translate(-82%, -18%);
        }
        .map-pin.edge-right.edge-bottom {
          transform: translate(-82%, -82%);
        }
        .map-compass {
          position: absolute;
          right: 1rem;
          bottom: 1rem;
          z-index: 4;
          display: grid;
          place-items: center;
          width: 72px;
          height: 72px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 50%;
          background: rgba(0,0,0,0.36);
          color: var(--text-accent);
        }
        .map-compass span {
          position: absolute;
          top: 7px;
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 900;
        }
        .atlas-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.55rem;
          width: min(100%, 1040px);
          margin: 0.8rem auto 0;
        }
        .mobile-location-rail {
          display: none;
        }
        .atlas-metrics div,
        .source-strip div {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 0.45rem;
          align-items: center;
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 0.65rem;
        }
        .atlas-metrics span,
        .source-strip span {
          min-width: 0;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .atlas-metrics strong,
        .source-strip strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .location-dossier {
          min-width: 0;
          border-radius: 12px;
          overflow: hidden;
        }
        .location-image {
          display: grid;
          width: 100%;
          aspect-ratio: 16 / 9;
          height: auto;
          min-height: 0;
          place-items: center;
          background: rgba(255,255,255,0.035);
          overflow: hidden;
        }
        .location-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }
        .location-heading,
        .weather-card,
        .weather-match-card,
        .poi-card,
        .source-strip,
        .quick-links {
          margin: 0.85rem;
        }
        .location-heading h2 {
          margin-top: 0.25rem;
          color: #fff;
          font-size: 1.85rem;
          line-height: 1.05;
          overflow-wrap: anywhere;
        }
        .location-heading p {
          margin-top: 0.55rem;
          color: var(--text-muted);
          line-height: 1.45;
        }
        .weather-card {
          border: 1px solid color-mix(in srgb, var(--weather-accent), transparent 62%);
          border-radius: 10px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--weather-accent), transparent 88%), rgba(255,255,255,0.018));
          padding: 0.85rem;
        }
        .weather-card-head {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          color: var(--weather-accent);
        }
        .weather-card-head strong {
          display: block;
          color: #fff;
          font-size: 1.25rem;
          line-height: 1.1;
        }
        .weather-card p {
          margin-top: 0.55rem;
          color: var(--text-muted);
          font-size: 0.82rem;
        }
        .buff-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.7rem;
        }
        .buff-list span {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(0,0,0,0.24);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
        }
        .weather-match-card {
          display: grid;
          gap: 0.7rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          padding: 0.78rem;
        }
        .weather-match-card header {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: center;
        }
        .weather-match-card header span {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .weather-match-card header strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }
        .weather-enemy-strip h3 {
          margin-bottom: 0.4rem;
          color: var(--text-muted);
          font-size: 0.74rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .weather-enemy-list {
          display: grid;
          gap: 0.4rem;
        }
        .weather-enemy-chip {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          gap: 0.5rem;
          align-items: center;
          min-height: 42px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          color: inherit;
          padding: 0.4rem;
          text-decoration: none;
        }
        .weather-enemy-chip.good {
          border-color: rgba(45, 212, 191, 0.24);
          background: rgba(45, 212, 191, 0.07);
        }
        .weather-enemy-chip.bad {
          border-color: rgba(248, 113, 113, 0.24);
          background: rgba(248, 113, 113, 0.07);
        }
        .weather-enemy-chip img {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }
        .weather-enemy-chip span {
          display: grid;
          gap: 0.08rem;
          min-width: 0;
        }
        .weather-enemy-chip strong,
        .weather-enemy-chip small {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .weather-enemy-chip strong {
          color: #fff;
          font-size: 0.8rem;
        }
        .weather-enemy-chip small {
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 850;
        }
        .source-strip {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.5rem;
        }
        .poi-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          padding: 0.78rem;
        }
        .poi-card header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }
        .poi-card header strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .poi-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.45rem;
        }
        .poi-chip {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.5rem;
          align-items: center;
          min-height: 50px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
          color: var(--text-main);
          padding: 0.55rem;
          text-align: left;
        }
        .poi-chip > svg {
          color: var(--text-accent);
        }
        .poi-chip > span {
          display: grid;
          gap: 0.08rem;
          min-width: 0;
        }
        .poi-chip strong,
        .poi-chip small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .poi-chip strong {
          color: #fff;
          font-size: 0.78rem;
          font-weight: 900;
        }
        .poi-chip small {
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 800;
        }
        .quick-links {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.45rem;
        }
        .quick-links a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          color: #fff;
          font-weight: 850;
          padding: 0 0.7rem;
          text-decoration: none;
        }
        .quick-links a:hover,
        .quick-links a:focus-visible {
          border-color: var(--border-focus);
        }
        .intel-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
          gap: 1rem;
          max-width: 1680px;
          margin: 1rem auto 0;
        }
        .intel-section {
          min-width: 0;
          border-radius: 12px;
          padding: 0.9rem;
        }
        .intel-section header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .intel-section header strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          text-align: right;
        }
        .source-list {
          grid-column: span 2;
        }
        .source-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.65rem;
        }
        .source-column {
          min-width: 0;
        }
        .source-column h3 {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.45rem;
          color: #fff;
          font-size: 0.84rem;
        }
        .source-stack {
          display: grid;
          gap: 0.45rem;
        }
        .source-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 18px;
          gap: 0.8rem;
          align-items: center;
          min-height: 54px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          color: var(--text-main);
          text-align: left;
          text-decoration: none;
          padding: 0.6rem;
        }
        .source-card > span {
          display: grid;
          grid-template-columns: minmax(0, 1fr) max-content;
          gap: 0.75rem;
          align-items: center;
          min-width: 0;
        }
        .source-card strong,
        .drop-name {
          min-width: 0;
          overflow: hidden;
          color: #fff;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .source-card small {
          justify-self: end;
          max-width: 100%;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 850;
          line-height: 1;
          padding: 0.28rem 0.46rem;
          text-align: right;
          white-space: nowrap;
        }
        .source-card > svg {
          justify-self: end;
          color: var(--text-muted);
        }
        .source-card:hover,
        .source-card:focus-visible,
        .drop-chip:hover,
        .drop-chip:focus-visible,
        .resource-chip:hover,
        .resource-chip:focus-visible {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
        }
        .drop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 0.5rem;
        }
        .board-note {
          margin: 0.65rem 0 0;
          color: var(--text-muted);
          font-size: 0.76rem;
          font-weight: 750;
        }
        .drop-chip {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr) minmax(58px, auto);
          gap: 0.55rem;
          align-items: center;
          min-height: 48px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          padding: 0.45rem;
          text-align: left;
        }
        .drop-chip img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
        .drop-copy {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }
        .drop-copy small {
          min-width: 0;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .drop-chip strong {
          color: var(--text-success);
          font-family: var(--font-mono);
          font-size: 0.76rem;
          text-align: right;
          white-space: nowrap;
        }
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
          gap: 0.5rem;
        }
        .resource-chip {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) auto;
          gap: 0.55rem;
          align-items: center;
          min-height: 58px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          padding: 0.5rem;
          text-align: left;
        }
        .resource-chip:focus-visible {
          outline: none;
        }
        .resource-chip img {
          width: 38px;
          height: 38px;
          object-fit: contain;
        }
        .resource-copy {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }
        .resource-name {
          min-width: 0;
          overflow: hidden;
          color: #fff;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .resource-copy small {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 850;
        }
        .resource-chip strong {
          align-self: start;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          background: rgba(255,255,255,0.08);
          color: var(--text-accent);
          font-family: var(--font-mono);
          font-size: 0.74rem;
          font-weight: 950;
          line-height: 1;
          padding: 0.28rem 0.38rem;
          white-space: nowrap;
        }
        .forecast-list {
          display: grid;
          gap: 0.45rem;
        }
        .forecast-item {
          display: grid;
          border: 1px solid color-mix(in srgb, var(--weather-accent), transparent 78%);
          border-radius: 8px;
          background: color-mix(in srgb, var(--weather-accent), transparent 95%);
          overflow: hidden;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .forecast-row {
          display: grid;
          grid-template-columns: minmax(8rem, 0.75fr) minmax(11rem, 1fr) max-content 1.25rem;
          gap: 0.6rem;
          align-items: center;
          width: 100%;
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0.58rem 0.65rem;
          text-align: left;
        }
        .forecast-weather-name {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          color: #fff;
          font-weight: 850;
        }
        .forecast-window-time {
          min-width: 0;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.78rem;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forecast-counts {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 0.32rem;
          justify-self: end;
          min-width: 0;
        }
        .forecast-counts em {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(0,0,0,0.24);
          font-size: 0.68rem;
          font-weight: 900;
          font-style: normal;
          line-height: 1;
          padding: 0.32rem 0.45rem;
          white-space: nowrap;
        }
        .forecast-counts .favored {
          border-color: rgba(52, 211, 153, 0.28);
          color: #7cf2c0;
        }
        .forecast-counts .penalized {
          border-color: rgba(251, 113, 133, 0.26);
          color: #ff9bad;
        }
        .forecast-chevron {
          justify-self: end;
          color: var(--text-muted);
          transition: color 160ms ease, transform 160ms ease;
        }
        .forecast-item:hover,
        .forecast-item.active {
          border-color: color-mix(in srgb, var(--weather-accent), white 8%);
          background: color-mix(in srgb, var(--weather-accent), transparent 91%);
        }
        .forecast-item:hover {
          transform: translateY(-1px);
        }
        .forecast-item.active .forecast-chevron {
          color: #fff;
          transform: rotate(180deg);
        }
        .forecast-crosscheck {
          display: none;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
          border-top: 1px solid color-mix(in srgb, var(--weather-accent), transparent 82%);
          padding: 0.6rem 0.65rem 0.65rem;
        }
        .forecast-item.active .forecast-crosscheck {
          display: grid;
        }
        .forecast-enemy-group {
          display: grid;
          align-content: start;
          gap: 0.42rem;
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          background: rgba(0,0,0,0.18);
          padding: 0.52rem;
        }
        .forecast-enemy-group.favored {
          border-color: rgba(52, 211, 153, 0.16);
        }
        .forecast-enemy-group.penalized {
          border-color: rgba(251, 113, 133, 0.16);
        }
        .forecast-enemy-group strong {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          color: var(--text-muted);
          font-size: 0.66rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .forecast-enemy-group strong span {
          display: inline-grid;
          min-width: 1.35rem;
          place-items: center;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.64rem;
          line-height: 1;
          padding: 0.22rem 0.3rem;
        }
        .forecast-enemy-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          min-width: 0;
        }
        .forecast-enemy-chip {
          display: inline-grid;
          grid-template-columns: 1.35rem minmax(0, 1fr);
          align-items: center;
          gap: 0.35rem;
          max-width: 100%;
          min-height: 1.75rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 850;
          padding: 0.18rem 0.5rem 0.18rem 0.22rem;
          text-decoration: none;
          transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
        }
        .forecast-enemy-chip:hover,
        .forecast-enemy-chip:focus-visible {
          border-color: color-mix(in srgb, var(--weather-accent), white 10%);
          background: rgba(255,255,255,0.08);
          transform: translateY(-1px);
        }
        .forecast-enemy-chip img,
        .forecast-enemy-chip svg {
          width: 1.35rem;
          height: 1.35rem;
          object-fit: contain;
        }
        .forecast-enemy-chip span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forecast-none,
        .forecast-more {
          display: inline-flex;
          align-items: center;
          min-height: 1.75rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.18rem 0.55rem;
        }
        .muted-empty {
          color: var(--text-muted);
        }
        .source-note {
          margin: -0.15rem 0 0.7rem;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.35;
        }
        @media (min-width: 1280px) {
          .atlas-shell {
            grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
          }
        }
        @media (max-width: 1279px) {
          .atlas-shell,
          .intel-grid {
            grid-template-columns: 1fr;
          }
          .source-list {
            grid-column: auto;
          }
          .location-dossier {
            display: block;
            width: min(100%, 1040px);
            margin-inline: auto;
          }
          .location-image {
            height: auto;
            min-height: 0;
          }
          .source-strip,
          .poi-card,
          .quick-links,
          .weather-card {
            grid-column: auto;
          }
        }
        @media (max-width: 860px) {
          .map-page {
            padding: 0.75rem;
          }
          .atlas-topbar {
            grid-template-columns: 1fr;
          }
          .atlas-title h1 {
            font-size: 2rem;
          }
          .map-pin {
            min-width: 116px;
            width: 140px;
            max-width: 150px;
            padding: 0.45rem 0.5rem;
          }
          .pin-title {
            font-size: 0.74rem;
          }
          .pin-level {
            font-size: 0.68rem;
            padding: 0.28rem 0.45rem;
          }
          .atlas-metrics,
          .source-columns,
          .poi-list,
          .source-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .location-dossier {
            display: block;
          }
          .location-image {
            height: auto;
            min-height: 0;
          }
          .forecast-row {
            grid-template-columns: minmax(0, 1fr) 1.4rem;
            gap: 0.42rem 0.5rem;
          }
          .forecast-weather-name {
            grid-column: 1;
          }
          .forecast-chevron {
            grid-column: 2;
            grid-row: 1;
          }
          .forecast-window-time,
          .forecast-counts {
            grid-column: 1 / -1;
            justify-self: start;
            text-align: left;
            white-space: normal;
          }
          .forecast-counts {
            justify-content: flex-start;
          }
          .forecast-crosscheck {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .atlas-panel,
          .intel-section {
            padding: 0.65rem;
          }
          .atlas-metrics,
          .source-columns,
          .poi-list,
          .source-strip,
          .drop-grid,
          .resource-grid {
            grid-template-columns: 1fr;
          }
          .map-pin {
            width: 44px;
            min-width: 0;
            max-width: none;
            height: 44px;
            border-radius: 50%;
            padding: 0;
            transform: translate(-50%, -50%);
          }
          .map-pin.edge-left,
          .map-pin.edge-right,
          .map-pin.edge-top,
          .map-pin.edge-bottom,
          .map-pin.edge-left.edge-top,
          .map-pin.edge-left.edge-bottom,
          .map-pin.edge-right.edge-top,
          .map-pin.edge-right.edge-bottom {
            transform: translate(-50%, -50%);
          }
          .pin-title {
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            font-size: 0;
          }
          .pin-weather {
            color: var(--pin-accent);
          }
          .pin-level {
            display: none;
          }
          .mobile-location-rail {
            display: flex;
            gap: 0.45rem;
            width: 100%;
            margin: 0.65rem 0 0;
            overflow-x: auto;
            overscroll-behavior-x: contain;
            padding: 0 0.05rem 0.35rem;
            scrollbar-width: thin;
          }
          .mobile-location-rail button {
            display: grid;
            gap: 0.16rem;
            flex: 0 0 auto;
            min-width: 138px;
            max-width: 176px;
            min-height: 48px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(255,255,255,0.035);
            color: var(--text-main);
            font: inherit;
            padding: 0.45rem 0.55rem;
            text-align: left;
          }
          .mobile-location-rail button.active {
            border-color: var(--border-focus);
            background: color-mix(in srgb, var(--text-accent), transparent 84%);
            color: #fff;
          }
          .mobile-location-rail span {
            display: flex;
            align-items: center;
            gap: 0.32rem;
            min-width: 0;
            overflow: hidden;
            font-size: 0.76rem;
            font-weight: 900;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mobile-location-rail small {
            color: var(--text-muted);
            font-family: var(--font-mono);
            font-size: 0.66rem;
            font-weight: 900;
          }
          .map-compass {
            width: 54px;
            height: 54px;
          }
          .drop-chip {
            grid-template-columns: 32px minmax(0, 1fr);
          }
          .drop-chip strong {
            grid-column: 2;
            text-align: left;
          }
          .resource-chip {
            grid-template-columns: 38px minmax(0, 1fr);
          }
          .resource-chip strong {
            grid-column: 2;
            justify-self: start;
          }
          .source-card > span {
            grid-template-columns: 1fr;
            gap: 0.35rem;
          }
          .source-card small {
            justify-self: start;
          }
          .quick-links {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function SourceColumn({
  title,
  icon,
  rows,
  hrefBase,
}: {
  title: string;
  icon: ReactNode;
  rows: any[];
  hrefBase: "/combat" | "/enemies" | "/dungeons" | "/bosses";
}) {
  return (
    <div className="source-column">
      <h3>{icon} {title}</h3>
      <div className="source-stack">
        {rows.slice(0, 8).map((row) => (
          <Link key={`${title}-${row.id || row.name}`} href={`${hrefBase}?search=${encodeURIComponent(row.name)}`} className="source-card">
            <span>
              <strong>{row.name}</strong>
              <small>{row.level ? `Level ${row.level}` : row.difficulty ? `Difficulty ${row.difficulty}` : row.status || "Source"}</small>
            </span>
            <ExternalLink size={13} />
          </Link>
        ))}
        {rows.length === 0 && <p className="muted-empty">No entries found.</p>}
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<main className="map-page"><div className="map-loading">Loading atlas data...</div></main>}>
      <MapPageContent />
    </Suspense>
  );
}
