"use client";
import type { CSSProperties } from 'react';
import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ZenithIcon from '@/components/icons/ZenithIcon';
import { WEATHER_DATA, WeatherData } from '@/constants/weatherData';
import { useData } from '@/context/DataContext';
import {
  buildEnrichedLocations,
  buildEnrichedEnemies,
  getWeatherPreferenceLabel,
  isFavorableWeather,
  isPenalizedWeather,
  normalizeWeatherKey,
  type EnrichedEnemy,
  type EnrichedLocation,
  type ForecastWeather,
  type WeatherPreferenceKind,
} from '@/lib/world-intelligence';
import { 
  Sun, CloudFog, ThermometerSun, Zap, Cloud, 
  CloudRain, CloudSnow, CloudLightning, Wind,
  Info, Calendar, Map as MapIcon, Users, Sparkles,
  TrendingUp, Trophy, Swords, ExternalLink, MapPin,
  Clock, ShieldCheck, Activity
} from 'lucide-react';

const formatPercent = (value: number | null) => {
  if (!value) return '0%';
  return value > 0 ? `+${value}%` : `${value}%`;
};

const modifierTone = (value: number | null) => {
  if (!value) return 'neutral';
  return value > 0 ? 'pos' : 'neg';
};

type WeatherEnemyBuckets = {
  loves: EnrichedEnemy[];
  likes: EnrichedEnemy[];
  dislikes: EnrichedEnemy[];
  hates: EnrichedEnemy[];
};

type LocationWeatherCounts = {
  favored: number;
  penalized: number;
};

const EMPTY_WEATHER_BUCKETS: WeatherEnemyBuckets = {
  loves: [],
  likes: [],
  dislikes: [],
  hates: [],
};

function preferenceIncludes(enemy: EnrichedEnemy, kind: WeatherPreferenceKind, weatherName: string) {
  const preference = enemy.weatherPreference;
  if (!preference || kind === "unknown") return false;
  const weatherKey = normalizeWeatherKey(weatherName);
  return preference[kind].some((weather) => normalizeWeatherKey(weather) === weatherKey);
}

function createWeatherBuckets(): WeatherEnemyBuckets {
  return { loves: [], likes: [], dislikes: [], hates: [] };
}

function buildWeatherPreferenceIndex(enemies: EnrichedEnemy[]) {
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

function buildCurrentWeatherEnemyIndex(enemies: EnrichedEnemy[]) {
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

function getLocationWeatherCounts(location: EnrichedLocation, weatherName: string): LocationWeatherCounts {
  let favored = 0;
  let penalized = 0;
  for (const enemy of location.enemies) {
    if (preferenceIncludes(enemy, "loves", weatherName) || preferenceIncludes(enemy, "likes", weatherName)) favored += 1;
    if (preferenceIncludes(enemy, "dislikes", weatherName) || preferenceIncludes(enemy, "hates", weatherName)) penalized += 1;
  }
  return { favored, penalized };
}

function weatherMatches(weather: ForecastWeather | null | undefined, activeWeather: WeatherData) {
  if (!weather) return false;
  const activeKey = normalizeWeatherKey(activeWeather.name);
  return normalizeWeatherKey(weather.name || weather.key || weather.icon) === activeKey;
}

function formatForecastTime(weather: ForecastWeather | null | undefined) {
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

function formatForecastAriaLabel(weatherName: string, mode: string, location: EnrichedLocation, weather: ForecastWeather | null | undefined) {
  return `${weatherName} ${mode.toLowerCase()} in ${location.name}, ${formatForecastTime(weather)}`;
}

function getEnemyWeatherLabel(enemy: EnrichedEnemy, context: string) {
  return `${enemy.name}, level ${enemy.level}, ${enemy.locationName}, ${context}`;
}

function EnemyPreferenceGroup({
  title,
  tone,
  weatherName,
  enemies,
}: {
  title: string;
  tone: "good" | "bad";
  weatherName: string;
  enemies: EnrichedEnemy[];
}) {
  const hiddenCount = Math.max(0, enemies.length - 8);
  return (
    <div className={`enemy-pref-group ${tone}`}>
      <div className="enemy-pref-heading">
        <h4>{title}</h4>
        <span>{enemies.length}</span>
      </div>
      <div className="enemy-pref-list">
        {enemies.slice(0, 8).map((enemy) => (
          <Link
            key={`${title}-${enemy.locationKey}-${enemy.name}`}
            href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
            className="enemy-pref-link"
            aria-label={getEnemyWeatherLabel(enemy, `${title.toLowerCase()}s ${weatherName}`)}
          >
            {enemy.imageUrl ? <Image src={enemy.imageUrl} alt="" width={40} height={40} unoptimized /> : <Swords size={20} />}
            <span>
              <strong>{enemy.name}</strong>
              <small>{enemy.locationName} - Lv.{enemy.level}</small>
            </span>
            <ExternalLink size={12} />
          </Link>
        ))}
        {enemies.length === 0 && <p className="enemy-pref-empty">No confirmed enemies.</p>}
        {hiddenCount > 0 && (
          <Link href={`/enemies?search=${encodeURIComponent(weatherName)}`} className="enemy-pref-more">
            View {hiddenCount} more
            <ExternalLink size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

function ForecastLocationCard({
  location,
  mode,
  counts,
}: {
  location: EnrichedLocation;
  mode: "current" | "next";
  counts: LocationWeatherCounts;
}) {
  const weather = mode === "current" ? location.currentWeather : location.nextWeather;
  return (
    <Link
      href={`/map?location=${encodeURIComponent(location.key)}`}
      className="forecast-location-card"
      aria-label={formatForecastAriaLabel(weather?.name || "Weather", mode === "current" ? "now" : "next", location, weather)}
    >
      <div>
        <strong>{location.name}</strong>
        <small>{formatForecastTime(weather)}</small>
      </div>
      <span>
        <Sparkles size={13} />
        {counts.favored} favored
      </span>
      <span className="penalty">
        <Swords size={13} />
        {counts.penalized} penalized
      </span>
    </Link>
  );
}

function ForecastTimelineStrip({
  activeWeather,
  currentLocations,
  nextLocations,
}: {
  activeWeather: WeatherData;
  currentLocations: EnrichedLocation[];
  nextLocations: EnrichedLocation[];
}) {
  const windows = [
    ...currentLocations.slice(0, 4).map((location) => ({ location, mode: "Now" as const, weather: location.currentWeather })),
    ...nextLocations.slice(0, 4).map((location) => ({ location, mode: "Next" as const, weather: location.nextWeather })),
  ].slice(0, 7);

  return (
    <div className={`forecast-strip ${windows.length > 1 ? "scrollable" : ""}`} aria-label={`${activeWeather.name} forecast timeline`}>
      <div className="forecast-strip-label">
        <Clock size={15} />
        <span>{activeWeather.name} windows</span>
      </div>
      {windows.length > 1 && <p className="forecast-strip-hint">Swipe windows</p>}
      <div className="forecast-strip-track">
        {windows.length > 0 ? (
          windows.map(({ location, mode, weather }) => (
            <Link
              key={`${mode}-${location.key}`}
              href={`/map?location=${encodeURIComponent(location.key)}`}
              className={`forecast-pill ${mode === "Now" ? "now" : "next"}`}
              aria-label={formatForecastAriaLabel(activeWeather.name, mode, location, weather)}
            >
              <span className="forecast-pill-mode">{mode}</span>
              <strong>{location.name}</strong>
              <small>{formatForecastTime(weather)}</small>
            </Link>
          ))
        ) : (
          <div className="forecast-pill empty">
            <span className="forecast-pill-mode">Quiet</span>
            <strong>No current or next {activeWeather.name} window</strong>
            <small>No matching location forecast in the cached snapshot.</small>
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastContext({
  activeWeather,
  currentLocations,
  nextLocations,
  locationWeatherCounts,
}: {
  activeWeather: WeatherData;
  currentLocations: EnrichedLocation[];
  nextLocations: EnrichedLocation[];
  locationWeatherCounts: Map<string, LocationWeatherCounts>;
}) {
  const getCounts = (location: EnrichedLocation) => locationWeatherCounts.get(location.key) || { favored: 0, penalized: 0 };
  return (
    <div className="forecast-context-card">
      <div className="card-header compact">
        <MapPin size={18} />
        <h3>Location Forecast</h3>
      </div>
      <div className="forecast-lanes">
        <section>
          <div className="forecast-lane-title">
            <span>Active now</span>
            <strong>{currentLocations.length}</strong>
          </div>
          <div className="forecast-location-list">
            {currentLocations.slice(0, 4).map((location) => (
              <ForecastLocationCard key={`current-${location.key}`} location={location} mode="current" counts={getCounts(location)} />
            ))}
            {currentLocations.length === 0 && <p className="forecast-empty">No location currently has {activeWeather.name}.</p>}
          </div>
        </section>
        <section>
          <div className="forecast-lane-title">
            <span>Coming next</span>
            <strong>{nextLocations.length}</strong>
          </div>
          <div className="forecast-location-list">
            {nextLocations.slice(0, 4).map((location) => (
              <ForecastLocationCard key={`next-${location.key}`} location={location} mode="next" counts={getCounts(location)} />
            ))}
            {nextLocations.length === 0 && <p className="forecast-empty">No next-window match for {activeWeather.name}.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function CurrentEnemyContext({
  activeWeather,
  favoredEnemies,
  penalizedEnemies,
}: {
  activeWeather: WeatherData;
  favoredEnemies: EnrichedEnemy[];
  penalizedEnemies: EnrichedEnemy[];
}) {
  const renderEnemy = (enemy: EnrichedEnemy, tone: "favored" | "penalized") => (
    <Link
      key={`${tone}-${enemy.locationKey}-${enemy.name}`}
      href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
      className={`current-enemy-link ${tone}`}
      aria-label={getEnemyWeatherLabel(enemy, `${tone} by current ${activeWeather.name}`)}
    >
      {enemy.imageUrl ? <Image src={enemy.imageUrl} alt="" width={34} height={34} unoptimized /> : <Swords size={18} />}
      <span>
        <strong>{enemy.name}</strong>
        <small>{enemy.locationName} - {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}</small>
      </span>
      <em>{tone === "favored" ? "Boosted" : "Risk"}</em>
    </Link>
  );

  return (
    <div className="current-enemy-card">
      <div className="card-header compact">
        <Activity size={18} />
        <h3>Current Enemy Match</h3>
      </div>
      <div className="current-enemy-grid">
        <section>
          <div className="forecast-lane-title good">
            <span>Favored by {activeWeather.name}</span>
            <strong>{favoredEnemies.length}</strong>
          </div>
          <div className="current-enemy-list">
            {favoredEnemies.slice(0, 5).map((enemy) => renderEnemy(enemy, "favored"))}
            {favoredEnemies.length === 0 && <p className="forecast-empty">No current favorable enemy match.</p>}
          </div>
        </section>
        <section>
          <div className="forecast-lane-title bad">
            <span>Penalized by {activeWeather.name}</span>
            <strong>{penalizedEnemies.length}</strong>
          </div>
          <div className="current-enemy-list">
            {penalizedEnemies.slice(0, 5).map((enemy) => renderEnemy(enemy, "penalized"))}
            {penalizedEnemies.length === 0 && <p className="forecast-empty">No current penalty match.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function WeatherPage() {
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
  const locations = useMemo(
    () => {
      void weatherRefreshTick;
      return buildEnrichedLocations({ staticData, worldLocations, marketData, allItemsDb });
    },
    [allItemsDb, marketData, staticData, worldLocations, weatherRefreshTick],
  );
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
    for (const location of locations) counts.set(location.key, getLocationWeatherCounts(location, activeWeather.name));
    return counts;
  }, [activeWeather.name, locations]);
  const currentWeatherEnemyContext = currentWeatherEnemyIndex.get(activeWeatherKey) || { favored: [], penalized: [] };
  const favoredPreferenceCount = activeWeatherEnemies.loves.length + activeWeatherEnemies.likes.length;
  const penalizedPreferenceCount = activeWeatherEnemies.dislikes.length + activeWeatherEnemies.hates.length;
  const weatherAccent = {
    '--accent': activeWeather.theme.primary,
    '--accent-2': activeWeather.theme.secondary,
  } as CSSProperties;

  return (
    <main className="weather-container" style={weatherAccent}>
      <WeatherCanvas weatherId={activeWeather.id} />
      
      <div className="content-wrapper">
        <header className="page-header">
          <div className="header-text">
            <span className="eyebrow"><ZenithIcon name="weather" size={15} /> IdleMMO Weather Index</span>
            <h1>Weather Guide</h1>
            <p>Read current and next weather by region, then check skill modifiers and enemy reactions before choosing where to farm.</p>
            <div className="weather-snapshot-grid" aria-label={`${activeWeather.name} weather summary`}>
              <div className="weather-snapshot-card">
                <Clock size={15} aria-hidden="true" />
                <span data-short="Active">Active windows</span>
                <strong>{currentWeatherLocations.length}</strong>
              </div>
              <div className="weather-snapshot-card">
                <MapPin size={15} aria-hidden="true" />
                <span data-short="Next">Coming next</span>
                <strong>{nextWeatherLocations.length}</strong>
              </div>
              <div className="weather-snapshot-card good">
                <Sparkles size={15} aria-hidden="true" />
                <span data-short="Favored">Favored enemies</span>
                <strong>{favoredPreferenceCount}</strong>
              </div>
              <div className="weather-snapshot-card bad">
                <Swords size={15} aria-hidden="true" />
                <span data-short="Penalized">Penalized enemies</span>
                <strong>{penalizedPreferenceCount}</strong>
              </div>
            </div>
          </div>
          <div className="weather-selector-shell">
            <div className="weather-selector" role="group" aria-label="Weather types">
              {WEATHER_DATA.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveWeather(w)}
                  className={`weather-btn ${activeWeather.id === w.id ? 'active' : ''}`}
                  style={{ '--accent': w.theme.primary } as CSSProperties}
                  aria-pressed={activeWeather.id === w.id}
                >
                  {getWeatherIcon(w.theme.icon)}
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="main-grid">
          {/* Active Weather Info */}
          <section className="active-info-panel">
            <div className="weather-hero">
              <div className="hero-icon-shell" aria-hidden="true">
                <div className="weather-seal" />
                <div className="hero-icon" style={{ color: activeWeather.theme.primary }}>
                  {getWeatherIcon(activeWeather.theme.icon, 80)}
                </div>
              </div>
              <div className="hero-text">
                <h2 style={{ color: activeWeather.theme.primary }}>{activeWeather.name}</h2>
                <p className="description">{activeWeather.description}</p>
              </div>
            </div>

            <div className="impact-grid">
              {activeWeather.id === 'magic-storm' ? (
                <div className="mf-card">
                  <div className="card-header">
                    <Trophy size={18} />
                    <h3>Magic Find Bonuses</h3>
                  </div>
                  <div className="mf-stats">
                    <div className="mf-stat">
                      <span className="label">Battle MF</span>
                      <span className="value">+{activeWeather.magicFind?.battle}%</span>
                    </div>
                    <div className="mf-stat">
                      <span className="label">Dungeon MF</span>
                      <span className="value">+{activeWeather.magicFind?.dungeon}%</span>
                    </div>
                    <div className="mf-stat">
                      <span className="label">World Boss MF</span>
                      <span className="value">+{activeWeather.magicFind?.worldBoss}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="impact-card modifiers">
                  <div className="card-header">
                    <TrendingUp size={18} />
                    <h3>Skill Modifiers</h3>
                  </div>
                  <div className="modifier-list">
                    {activeWeather.impacts.map((imp) => (
                      <div key={imp.skill} className="modifier-row">
                        <span className="modifier-skill">{imp.skill}</span>
                        <span className={`modifier-chip ${modifierTone(imp.efficiency)}`}>
                          <span>Eff</span>
                          <strong>{formatPercent(imp.efficiency)}</strong>
                        </span>
                        <span className={`modifier-chip ${modifierTone(imp.experience)}`}>
                          <span>XP</span>
                          <strong>{formatPercent(imp.experience)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <ForecastTimelineStrip
              activeWeather={activeWeather}
              currentLocations={currentWeatherLocations}
              nextLocations={nextWeatherLocations}
            />

            <div className="weather-live-grid">
              <ForecastContext
                activeWeather={activeWeather}
                currentLocations={currentWeatherLocations}
                nextLocations={nextWeatherLocations}
                locationWeatherCounts={locationWeatherCounts}
              />
              <CurrentEnemyContext
                activeWeather={activeWeather}
                favoredEnemies={currentWeatherEnemyContext.favored}
                penalizedEnemies={currentWeatherEnemyContext.penalized}
              />
            </div>

            <div className="enemy-weather-card">
              <div className="card-header">
                <Swords size={18} />
                <h3>Enemy Preferences</h3>
              </div>
              <div className="enemy-weather-groups">
                <EnemyPreferenceGroup title="Love" tone="good" weatherName={activeWeather.name} enemies={activeWeatherEnemies.loves} />
                <EnemyPreferenceGroup title="Like" tone="good" weatherName={activeWeather.name} enemies={activeWeatherEnemies.likes} />
                <EnemyPreferenceGroup title="Dislike" tone="bad" weatherName={activeWeather.name} enemies={activeWeatherEnemies.dislikes} />
                <EnemyPreferenceGroup title="Hate" tone="bad" weatherName={activeWeather.name} enemies={activeWeatherEnemies.hates} />
              </div>
            </div>
          </section>

          {/* Mechanics Section */}
          <aside className="mechanics-panel">
            <div className="mechanics-card">
              <div className="card-header">
                <Info size={18} color="var(--text-accent)" />
                <h3>Weather Mechanics</h3>
              </div>
              <div className="mechanics-content">
                <div className="mech-item">
                  <MapIcon size={16} />
                  <div>
                    <h4>Regional Geography</h4>
                    <p>Weather isn&apos;t global. It changes depending on where you are, based on the area&apos;s geography and the current season.</p>
                  </div>
                </div>
                <div className="mech-item">
                  <Calendar size={16} />
                  <div>
                    <h4>Seasonal Dates</h4>
                    <p>Seasons follow real-world northern hemisphere dates. Winter (Dec-Feb) sees heavy snow in places like <strong>Skyreach Peak</strong>, which ease up in summer.</p>
                  </div>
                </div>
                <div className="mech-item">
                  <TrendingUp size={16} />
                  <div>
                    <h4>Additive Modifiers</h4>
                    <p>Efficiency is additive. You can offset some of the negatives with things like <strong>potions</strong>.</p>
                  </div>
                </div>
                <div className="mech-item">
                  <Users size={16} />
                  <div>
                    <h4>Creature Behavior</h4>
                    <p>Enemy preferences are mapped from confirmed in-game reactions and are shown below each weather type.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="weather-tip">
              <Sparkles size={16} color="var(--text-accent)" />
              <p>Magic Storms are rare conditions that boost magic find for battles, dungeons, and world bosses.</p>
            </div>

            <div className="confidence-card">
              <div className="confidence-row">
                <ShieldCheck size={16} />
                <span>Known skill modifiers</span>
              </div>
              <div className="confidence-row">
                <Users size={16} />
                <span>Confirmed enemy reactions</span>
              </div>
              <div className="confidence-row">
                <Clock size={16} />
                <span>Forecast windows refresh with game data</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .weather-container {
          position: relative;
          min-height: calc(100vh - 40px);
          width: 100%;
          max-width: 100vw;
          padding: 2rem;
          color: #fff;
          overflow-x: clip;
          background: #020617;
        }
        .weather-container, .weather-container * { box-sizing: border-box; }
        .weather-container {
          -webkit-tap-highlight-color: transparent;
        }
        .weather-container :where(button, a) {
          touch-action: manipulation;
        }
        .weather-container::before,
        .weather-container::after {
          display: none;
        }

        .weather-glow {
          display: none;
        }
        .weather-atmosphere {
          display: none;
        }

        .content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
          min-width: 0;
        }

        .page-header {
          display: grid;
          grid-template-columns: minmax(320px, 0.82fr) minmax(420px, 1.18fr);
          gap: clamp(1rem, 2vw, 1.6rem);
          align-items: stretch;
          margin-bottom: 1.2rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-left: 3px solid color-mix(in srgb, var(--accent), transparent 36%);
          border-radius: 8px;
          background: rgba(8, 10, 18, 0.74);
          padding: clamp(1rem, 1.6vw, 1.35rem);
          text-align: left;
          animation: rise-in 0.55s ease both;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--accent);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .header-text {
          display: grid;
          align-content: center;
          min-width: 0;
        }
        .header-text h1 {
          color: #fff;
          font-size: clamp(2.45rem, 4vw, 4rem);
          font-weight: 850;
          letter-spacing: 0;
          line-height: 0.96;
          margin-bottom: 0.65rem;
        }
        .header-text p {
          color: rgba(255,255,255,0.64);
          font-size: 1.02rem;
          font-weight: 700;
          line-height: 1.45;
          max-width: 42rem;
          margin: 0;
        }
        .weather-snapshot-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
          margin-top: 1rem;
        }
        .weather-snapshot-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          min-height: 2.35rem;
          border: 1px solid rgba(255,255,255,0.075);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.72);
          padding: 0.32rem 0.62rem;
        }
        .weather-snapshot-card svg {
          color: var(--accent);
          flex: 0 0 auto;
        }
        .weather-snapshot-card span {
          min-width: 0;
          overflow: hidden;
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.03em;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .weather-snapshot-card strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.86rem;
          font-weight: 950;
        }
        .weather-snapshot-card.good strong {
          color: #9af5c9;
        }
        .weather-snapshot-card.bad strong {
          color: #fecdd3;
        }

        .weather-selector-shell {
          position: relative;
          display: grid;
          align-content: center;
          margin-top: 0;
          min-width: 0;
        }
        .weather-selector-shell::before,
        .weather-selector-shell::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          z-index: 2;
          width: 2.4rem;
          pointer-events: none;
          display: none;
        }
        .weather-selector-shell::before {
          left: 0;
          background: linear-gradient(90deg, #020617, transparent);
        }
        .weather-selector-shell::after {
          right: 0;
          background: linear-gradient(270deg, #020617, transparent);
        }
        .weather-selector {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
          padding: 0;
          overflow: visible;
        }

        .weather-btn {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 0.72rem 0.82rem;
          border-radius: 8px;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
          white-space: nowrap;
          font-weight: 700;
          font-size: 0.8rem;
          min-width: 0;
        }
        .weather-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
        }
        .weather-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
          transform: translateY(-1px);
        }
        .weather-btn.active {
          background: color-mix(in srgb, var(--accent), transparent 85%);
          border-color: color-mix(in srgb, var(--accent), transparent 30%);
          color: #fff;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(330px, 390px);
          gap: clamp(1rem, 2vw, 1.6rem);
          align-items: start;
        }

        .active-info-panel {
          position: relative;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.034), rgba(255,255,255,0.012)),
            rgba(9, 11, 20, 0.74);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: clamp(1.35rem, 2.2vw, 2.45rem);
          animation: rise-in 0.65s 0.05s ease both;
          min-width: 0;
          overflow: hidden;
        }
        .active-info-panel::before {
          display: none;
        }
        .active-info-panel > * {
          position: relative;
          z-index: 1;
        }

        .weather-hero { display: flex; align-items: center; gap: clamp(1.4rem, 2.4vw, 2.4rem); margin-bottom: clamp(1.7rem, 2.4vw, 2.6rem); }
        .hero-icon-shell {
          position: relative;
          display: grid;
          place-items: center;
          width: 9.25rem;
          min-width: 9.25rem;
          height: 9.25rem;
        }
        .weather-seal {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: conic-gradient(from 35deg, transparent 0 18%, color-mix(in srgb, var(--accent), transparent 58%) 20%, transparent 23% 48%, color-mix(in srgb, var(--accent-2), transparent 66%) 51%, transparent 55% 100%);
          border: 1px solid color-mix(in srgb, var(--accent), transparent 72%);
          opacity: 0.82;
          animation: seal-drift 16s linear infinite;
        }
        .hero-icon {
          position: relative;
          display: grid;
          place-items: center;
          width: 6.3rem;
          height: 6.3rem;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
          animation: float-icon 4.5s ease-in-out infinite;
        }
        .hero-text h2 { font-size: clamp(2.4rem, 4.2vw, 3.6rem); font-weight: 850; margin-bottom: 0.75rem; letter-spacing: 0; }
        .hero-text .description { font-size: 1rem; color: rgba(255,255,255,0.66); line-height: 1.55; max-width: 650px; }

        .impact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 2rem; }
        .impact-card, .mf-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: clamp(1.2rem, 1.8vw, 2rem);
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
          min-width: 0;
        }

        .enemy-weather-card {
          margin-top: 2rem;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          padding: 2rem;
        }
        :global(.forecast-strip) {
          position: relative;
          margin-top: 2rem;
          border: 1px solid color-mix(in srgb, var(--accent), transparent 76%);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          padding: 1rem;
          overflow: hidden;
        }
        :global(.forecast-strip.scrollable::before),
        :global(.forecast-strip.scrollable::after) {
          content: "";
          position: absolute;
          z-index: 1;
          top: 3.85rem;
          bottom: 1.35rem;
          width: 1.25rem;
          pointer-events: none;
        }
        :global(.forecast-strip.scrollable::before) {
          left: 1rem;
          background: linear-gradient(90deg, rgba(18,18,22,0.46), rgba(18,18,22,0));
        }
        :global(.forecast-strip.scrollable::after) {
          right: 1rem;
          background: linear-gradient(90deg, rgba(18,18,22,0), rgba(18,18,22,0.58));
        }
        :global(.forecast-strip-label) {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: rgba(255,255,255,0.72);
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }
        :global(.forecast-strip-label svg) {
          color: var(--accent);
        }
        :global(.forecast-strip-hint) {
          display: none;
          margin: -0.25rem 0 0.65rem;
          color: rgba(255,255,255,0.48);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        :global(.forecast-strip-track) {
          position: relative;
          display: flex;
          gap: 0.7rem;
          overflow-x: auto;
          scroll-snap-type: x proximity;
          padding-bottom: 0.15rem;
          scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--accent), transparent 50%) transparent;
        }
        :global(.forecast-pill) {
          position: relative;
          flex: 0 0 13.5rem;
          display: grid;
          gap: 0.35rem;
          min-height: 6.2rem;
          padding: 0.85rem;
          border-radius: 8px;
          color: inherit;
          text-decoration: none;
          scroll-snap-align: start;
          border: 1px solid rgba(255,255,255,0.065);
          background: rgba(0,0,0,0.2);
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }
        :global(.forecast-pill::before) {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          border-radius: 8px 0 0 8px;
          background: color-mix(in srgb, var(--accent), white 8%);
          opacity: 0.85;
        }
        :global(.forecast-pill.next::before) {
          background: color-mix(in srgb, var(--accent-2), white 8%);
          opacity: 0.62;
        }
        :global(.forecast-pill.empty) {
          flex-basis: 100%;
          min-height: 4.8rem;
          cursor: default;
        }
        :global(.forecast-pill.empty::before) {
          background: rgba(255,255,255,0.18);
        }
        :global(.forecast-pill:hover),
        :global(.forecast-pill:focus-visible) {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--accent), transparent 45%);
          background: color-mix(in srgb, var(--accent), transparent 92%);
        }
        :global(.forecast-pill.empty:hover) {
          transform: none;
          border-color: rgba(255,255,255,0.065);
          background: rgba(0,0,0,0.2);
        }
        :global(.forecast-pill-mode) {
          width: fit-content;
          border-radius: 999px;
          padding: 0.23rem 0.5rem;
          color: #fff;
          background: color-mix(in srgb, var(--accent), transparent 72%);
          border: 1px solid color-mix(in srgb, var(--accent), transparent 50%);
          font-size: 0.67rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        :global(.forecast-pill.next .forecast-pill-mode) {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.08);
        }
        :global(.forecast-pill strong),
        :global(.forecast-pill small) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.forecast-pill strong) {
          color: #fff;
          font-size: 0.92rem;
          font-weight: 900;
        }
        :global(.forecast-pill small) {
          color: rgba(255,255,255,0.52);
          font-size: 0.73rem;
          font-weight: 780;
        }
        .weather-live-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }
        :global(.forecast-context-card),
        :global(.current-enemy-card) {
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 8px;
          background: color-mix(in srgb, var(--accent), transparent 96%);
          padding: 1.25rem;
        }
        :global(.card-header.compact) {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        :global(.forecast-lanes),
        :global(.current-enemy-grid) {
          display: grid;
          gap: 1rem;
        }
        :global(.forecast-lane-title) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.6rem;
          color: rgba(255,255,255,0.55);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        :global(.forecast-lane-title strong) {
          color: #fff;
          min-width: 1.8rem;
          text-align: right;
        }
        :global(.forecast-lane-title.good strong) { color: #34d399; }
        :global(.forecast-lane-title.bad strong) { color: #fb7185; }
        :global(.forecast-location-list),
        :global(.current-enemy-list) {
          display: grid;
          gap: 0.55rem;
        }
        :global(.forecast-location-card),
        :global(.current-enemy-link) {
          display: grid;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          color: inherit;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }
        :global(.forecast-location-card) {
          grid-template-columns: minmax(0, 1fr) auto auto;
          padding: 0.75rem;
        }
        :global(.forecast-location-card:hover),
        :global(.forecast-location-card:focus-visible),
        :global(.current-enemy-link:hover),
        :global(.current-enemy-link:focus-visible) {
          border-color: color-mix(in srgb, var(--accent), transparent 35%);
          background: color-mix(in srgb, var(--accent), transparent 93%);
          transform: translateY(-1px);
        }
        :global(.forecast-location-card div),
        :global(.current-enemy-link span) {
          display: grid;
          min-width: 0;
        }
        :global(.forecast-location-card strong),
        :global(.current-enemy-link strong),
        :global(.forecast-location-card small),
        :global(.current-enemy-link small) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.forecast-location-card strong),
        :global(.current-enemy-link strong) {
          color: #fff;
          font-size: 0.86rem;
        }
        :global(.forecast-location-card small),
        :global(.current-enemy-link small) {
          color: rgba(255,255,255,0.48);
          font-size: 0.74rem;
          font-weight: 760;
        }
        :global(.forecast-location-card > span) {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: #34d399;
          font-size: 0.72rem;
          font-weight: 850;
          white-space: nowrap;
        }
        :global(.forecast-location-card > span.penalty) {
          color: #fb7185;
        }
        :global(.current-enemy-link) {
          position: relative;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          min-height: 48px;
          padding: 0.45rem;
          overflow: hidden;
        }
        :global(.current-enemy-link::before) {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: rgba(255,255,255,0.12);
        }
        :global(.current-enemy-link.favored::before) {
          background: #34d399;
        }
        :global(.current-enemy-link.penalized::before) {
          background: #fb7185;
        }
        :global(.current-enemy-link img) {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }
        :global(.current-enemy-link em) {
          align-self: center;
          border-radius: 999px;
          padding: 0.26rem 0.46rem;
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 0.65rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        :global(.current-enemy-link.favored em) {
          color: #9af5c9;
          border-color: rgba(52, 211, 153, 0.22);
          background: rgba(52, 211, 153, 0.08);
        }
        :global(.current-enemy-link.penalized em) {
          color: #fecdd3;
          border-color: rgba(251, 113, 133, 0.22);
          background: rgba(251, 113, 133, 0.08);
        }
        :global(.forecast-empty) {
          color: rgba(255,255,255,0.46);
          font-size: 0.82rem;
          font-weight: 760;
          line-height: 1.45;
          padding: 0.7rem 0;
        }
        .enemy-weather-groups {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }
        :global(.enemy-pref-group) {
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.045);
          border-radius: 8px;
          background: rgba(0,0,0,0.16);
          padding: 0.85rem;
        }
        :global(.enemy-pref-group.good) {
          border-color: rgba(74, 222, 128, 0.14);
          background: rgba(74, 222, 128, 0.035);
        }
        :global(.enemy-pref-group.bad) {
          border-color: rgba(248, 113, 113, 0.14);
          background: rgba(248, 113, 113, 0.035);
        }
        :global(.enemy-pref-group h4) {
          color: #fff;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        :global(.enemy-pref-heading) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }
        :global(.enemy-pref-heading span) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.8rem;
          height: 1.55rem;
          padding-inline: 0.45rem;
          border-radius: 999px;
          color: #fff;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 0.72rem;
          font-weight: 900;
        }
        :global(.enemy-pref-list) {
          display: grid;
          gap: 0.45rem;
        }
        :global(.enemy-pref-link) {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) auto;
          gap: 0.5rem;
          align-items: center;
          min-height: 42px;
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          color: inherit;
          padding: 0.4rem;
          text-decoration: none;
        }
        :global(.enemy-pref-link:hover),
        :global(.enemy-pref-link:focus-visible) {
          border-color: color-mix(in srgb, var(--accent), white 10%);
        }
        :global(.enemy-pref-link img) {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }
        :global(.enemy-pref-link span) {
          display: grid;
          min-width: 0;
        }
        :global(.enemy-pref-link strong),
        :global(.enemy-pref-link small) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.enemy-pref-link strong) {
          color: #fff;
          font-size: 0.82rem;
        }
        :global(.enemy-pref-link small) {
          color: rgba(255,255,255,0.46);
          font-size: 0.72rem;
          font-weight: 800;
        }
        :global(.enemy-pref-link svg) {
          color: rgba(255,255,255,0.42);
        }
        :global(.enemy-pref-empty) {
          color: rgba(255,255,255,0.42);
          font-size: 0.82rem;
          font-weight: 750;
        }
        :global(.enemy-pref-more) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          min-height: 38px;
          border-radius: 8px;
          color: #fff;
          background: color-mix(in srgb, var(--accent), transparent 86%);
          border: 1px solid color-mix(in srgb, var(--accent), transparent 65%);
          font-size: 0.78rem;
          font-weight: 900;
          text-decoration: none;
        }
        .impact-card:hover, .mf-card:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--accent), transparent 70%);
          background: rgba(255,255,255,0.035);
        }

        .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .card-header h3 { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.9); }

        .stat-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .stat-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .stat-row span:first-child { color: rgba(255,255,255,0.4); }
        .stat-row span:last-child { min-width: 4rem; text-align: right; }
        .stat-row .pos { color: #4ade80; }
        .stat-row .neg { color: #f87171; }

        .impact-card.modifiers {
          grid-column: 1 / -1;
        }
        .modifier-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr));
          gap: 0.85rem;
        }
        .modifier-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 0.7rem;
          min-width: 0;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
        }
        .modifier-skill {
          color: rgba(255,255,255,0.62);
          font-weight: 800;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .modifier-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 4.7rem;
          justify-content: space-between;
          padding: 0.42rem 0.55rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.56);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .modifier-chip span {
          color: rgba(255,255,255,0.38);
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .modifier-chip.pos {
          color: #4ade80;
          background: rgba(74, 222, 128, 0.08);
          border-color: rgba(74, 222, 128, 0.16);
        }
        .modifier-chip.neg {
          color: #f87171;
          background: rgba(248, 113, 113, 0.08);
          border-color: rgba(248, 113, 113, 0.16);
        }

        .mf-stats { display: flex; flex-direction: column; gap: 0.85rem; }
        .mf-stat {
          background: rgba(255,255,255,0.02);
          padding: 1rem 1.25rem;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.02);
        }
        .mf-stat .label { font-size: 0.85rem; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .mf-stat .value { font-size: 1.1rem; font-weight: 800; color: #a78bfa; text-shadow: 0 0 15px rgba(167, 139, 250, 0.4); }

        .mechanics-panel {
          position: sticky;
          top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          animation: rise-in 0.65s 0.12s ease both;
          min-width: 0;
        }
        .mech-item { display: flex; gap: 1.25rem; }
        .mech-item h4 { color: #fff; font-size: 0.95rem; font-weight: 800; margin-bottom: 0.35rem; }
        .mech-item p { color: rgba(255,255,255,0.5); font-size: 0.85rem; line-height: 1.6; }
        .mech-item strong { color: var(--text-accent); }

        .mechanics-card {
          background: rgba(9, 11, 20, 0.66);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 2rem;
        }
        .mechanics-content { display: flex; flex-direction: column; gap: 2rem; }

        .weather-tip {
          background: rgba(245, 176, 65, 0.04);
          border: 1px solid rgba(245, 176, 65, 0.15);
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }
        .weather-tip p { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
        .confidence-card {
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 1rem;
          display: grid;
          gap: 0.65rem;
        }
        .confidence-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-height: 34px;
          color: rgba(255,255,255,0.62);
          font-size: 0.82rem;
          font-weight: 800;
        }
        .confidence-row svg {
          color: var(--accent);
          flex: 0 0 auto;
        }

        @keyframes rise-in {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float-icon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes seal-drift {
          from { transform: rotate(0deg) scale(0.98); }
          to { transform: rotate(360deg) scale(0.98); }
        }

        @keyframes breathe {
          from { opacity: 0.75; }
          to { opacity: 1; }
        }
        @keyframes orbit-glow {
          from { transform: translate3d(0, 0, 0) scale(0.96); opacity: 0.48; }
          to { transform: translate3d(8%, -4%, 0) scale(1.08); opacity: 0.78; }
        }
        @keyframes atmosphere-drift {
          from { transform: translateX(-3%) skewX(-6deg); opacity: 0.28; }
          to { transform: translateX(4%) skewX(-2deg); opacity: 0.5; }
        }

        @media (max-width: 1320px) {
          .main-grid { grid-template-columns: 1fr; }
          .weather-live-grid { grid-template-columns: 1fr; }
          .mechanics-panel { position: static; }
        }

        @media (max-width: 1100px) {
          .page-header {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .header-text p {
            margin-inline: auto;
          }
          .weather-snapshot-grid {
            max-width: 44rem;
            margin-inline: auto;
          }
          .weather-hero { flex-direction: column; text-align: center; gap: 2rem; }
          .hero-text h2 { font-size: 3.5rem; }
          .active-info-panel { padding: 2.5rem; border-radius: 8px; }
          .impact-grid { grid-template-columns: 1fr; }
          .enemy-weather-groups { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .weather-container {
            width: 100vw;
            max-width: 100vw;
            padding: 1.25rem;
          }
          .page-header {
            border-radius: 8px;
            padding: 1rem;
          }
          .content-wrapper,
          .main-grid,
          .active-info-panel,
          .mechanics-panel,
          .mechanics-card,
          .weather-tip {
            width: calc(100vw - 2.5rem);
            max-width: calc(100vw - 2.5rem);
          }
          .impact-card,
          .mf-card {
            width: 100%;
          }
          .header-text h1 {
            font-size: 1.9rem;
            line-height: 1.08;
            max-width: 18rem;
            margin-inline: auto;
            overflow-wrap: anywhere;
          }
          .header-text p { font-size: 0.95rem; padding: 0 0.25rem; max-width: 18.5rem; }
          .weather-selector {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            overflow: visible;
            scroll-snap-type: none;
            margin-inline: 0;
            padding: 0;
            gap: 0.55rem;
          }
          .weather-selector-shell {
            margin-top: 2rem;
            overflow: visible;
          }
          .weather-selector-shell::before,
          .weather-selector-shell::after {
            display: none;
          }
          .weather-selector::-webkit-scrollbar {
            display: none;
          }
          .weather-btn {
            min-width: 0;
            scroll-snap-align: none;
            justify-content: center;
            padding: 0.68rem 0.62rem;
            gap: 0.5rem;
            font-size: 0.78rem;
          }
          .weather-btn:last-child:nth-child(3n + 1) {
            grid-column: 1 / -1;
          }
          .weather-btn svg {
            width: 16px;
            height: 16px;
            flex: 0 0 auto;
          }
          .hero-text h2 { font-size: 2.5rem; }
          .hero-icon-shell {
            width: 7.25rem;
            min-width: 7.25rem;
            height: 7.25rem;
          }
          .hero-icon {
            width: 5.1rem;
            height: 5.1rem;
          }
          .hero-icon svg {
            width: 58px;
            height: 58px;
          }
          .hero-text .description {
            font-size: 1.1rem;
            max-width: 100%;
            overflow-wrap: anywhere;
          }
          .active-info-panel { padding: 1.5rem; overflow: hidden; }
          .weather-hero { gap: 1rem; }
          .impact-card, .mf-card { padding: 1.5rem; border-radius: 8px; }
          .weather-snapshot-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
          }
          .weather-snapshot-card {
            padding: 0.6rem 0.68rem;
            gap: 0.42rem;
          }
          .weather-snapshot-card span {
            font-size: 0;
            letter-spacing: 0;
          }
          .weather-snapshot-card span::after {
            content: attr(data-short);
            font-size: 0.64rem;
            letter-spacing: 0.04em;
          }
          .weather-snapshot-card strong {
            margin-left: auto;
          }
          :global(.forecast-strip) {
            margin-inline: -0.35rem;
            padding: 0.85rem;
          }
          :global(.forecast-strip.scrollable::before) {
            left: 0.85rem;
            width: 0.8rem;
          }
          :global(.forecast-strip.scrollable::after) {
            right: 0.85rem;
            width: 1.15rem;
          }
          :global(.forecast-strip-hint) {
            display: block;
          }
          :global(.forecast-pill) {
            flex-basis: 12rem;
          }
          :global(.forecast-context-card),
          :global(.current-enemy-card) {
            padding: 1rem;
            border-radius: 8px;
          }
          :global(.forecast-location-card) {
            grid-template-columns: minmax(0, 1fr);
            align-items: start;
          }
          :global(.forecast-location-card > span) {
            width: fit-content;
          }
          :global(.current-enemy-link) {
            grid-template-columns: 34px minmax(0, 1fr);
          }
          :global(.current-enemy-link em) {
            width: fit-content;
            margin-left: 34px;
          }
          .enemy-weather-card { padding: 1.25rem; border-radius: 8px; }
          .mechanics-card { padding: 1.5rem; border-radius: 8px; }
          .stat-row { gap: 1rem; padding-right: 1rem; }
          .modifier-list { grid-template-columns: 1fr; }
          .modifier-row {
            grid-template-columns: minmax(0, 1fr) auto auto;
            padding: 0.8rem;
            gap: 0.45rem;
          }
          .modifier-chip {
            min-width: 4.1rem;
            padding-inline: 0.45rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .weather-glow,
          .weather-atmosphere,
          .page-header,
          .active-info-panel,
          .mechanics-panel,
          .hero-icon {
            animation: none;
          }
          .weather-btn,
          .impact-card,
          .mf-card {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

type WeatherParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  angle: number;
  spin: number;
  wave: number;
  vortexAngle: number;
  layer: number;
  length: number;
  life: number;
  kind?: "drop" | "flake" | "mist" | "spark" | "ray" | "leaf" | "wisp" | "cloud" | "ember";
  color?: string;
  drift?: number;
  pulse?: number;
  isFlare?: boolean;
  isLeaf?: boolean;
  isDebris?: boolean;
  isWisp?: boolean;
  isCloud?: boolean;
  turbulence?: number;
  waveFreq?: number;
  isGlint?: boolean;
};

/* --- CANVAS ATMOSPHERE ENGINE --- */
const WEATHER_CANVAS_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
};

function WeatherCanvas({ weatherId }: { weatherId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawCtx = ctx;

    let animationFrameId = 0;
    let particles: WeatherParticle[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let resizeFrameId: number | null = null;
    let isVisible = !document.hidden;
    let isHeroInView = window.scrollY < window.innerHeight * 1.15;
    let isActivelyScrolling = false;
    let lastScrollAt = 0;
    let scrollIdleTimeout: number | null = null;
    let frameSkip = 0;
    let lastPaintAt = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const countByWeather: Record<string, number> = {
      clear: 82,
      fog: 56,
      heatwave: 96,
      "magic-storm": 150,
      overcast: 64,
      rain: 230,
      snow: 190,
      storm: 280,
      windy: 120,
    };

    const weatherPalette: Record<string, { base: string; glow: string; haze: string; shadow: string }> = {
      clear: { base: "251, 191, 36", glow: "245, 158, 11", haze: "56, 189, 248", shadow: "15, 23, 42" },
      fog: { base: "148, 163, 184", glow: "203, 213, 225", haze: "100, 116, 139", shadow: "15, 23, 42" },
      heatwave: { base: "248, 113, 113", glow: "251, 146, 60", haze: "251, 191, 36", shadow: "69, 10, 10" },
      "magic-storm": { base: "167, 139, 250", glow: "139, 92, 246", haze: "34, 211, 238", shadow: "49, 46, 129" },
      overcast: { base: "148, 163, 184", glow: "71, 85, 105", haze: "203, 213, 225", shadow: "2, 6, 23" },
      rain: { base: "96, 165, 250", glow: "59, 130, 246", haze: "125, 211, 252", shadow: "8, 47, 73" },
      snow: { base: "226, 232, 240", glow: "255, 255, 255", haze: "147, 197, 253", shadow: "15, 23, 42" },
      storm: { base: "56, 189, 248", glow: "125, 211, 252", haze: "129, 140, 248", shadow: "12, 18, 36" },
      windy: { base: "74, 222, 128", glow: "34, 197, 94", haze: "187, 247, 208", shadow: "5, 46, 22" },
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      init();
    };

    const scheduleResize = () => {
      if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        resizeFrameId = null;
        resize();
        isHeroInView = window.scrollY < height * 1.15;
        if (reducedMotion) drawReducedMotionFrame();
      });
    };

    const handleScroll = () => {
      isHeroInView = window.scrollY < height * 1.15;
      isActivelyScrolling = true;
      lastScrollAt = performance.now();
      if (scrollIdleTimeout !== null) window.clearTimeout(scrollIdleTimeout);
      scrollIdleTimeout = window.setTimeout(() => {
        isActivelyScrolling = false;
        scrollIdleTimeout = null;
      }, 140);
    };

    const init = () => {
      particles = [];
      const isMobile = width < 768;
      const multiplier = reducedMotion ? 0.16 : isMobile ? 0.38 : 1;
      const count = Math.floor((countByWeather[weatherId] ?? 72) * multiplier);
      
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    };

    const createParticle = (seedFromEdge = false): WeatherParticle => {
      const isMobile = width < 768;
      const p: WeatherParticle = {
        x: seedFromEdge ? Math.random() * width : Math.random() * width,
        y: seedFromEdge ? -80 - Math.random() * 160 : Math.random() * height,
        vx: 0,
        vy: 0,
        size: 0,
        opacity: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        wave: Math.random() * Math.PI * 2,
        vortexAngle: Math.random() * Math.PI * 2,
        layer: Math.random(),
        length: 0,
        life: Math.random(),
      };

      if (weatherId === 'rain' || weatherId === 'storm') {
        p.kind = "drop";
        p.vy = (Math.random() * 16 + (weatherId === 'storm' ? 16 : 11)) * (isMobile ? 0.8 : 1);
        p.vx = (weatherId === 'storm' ? 5.5 : 2.1) * (isMobile ? 0.8 : 1) * (0.7 + p.layer);
        p.size = Math.random() * 1.4 + 0.65 + p.layer * 1.1;
        p.length = Math.random() * 20 + (weatherId === 'storm' ? 18 : 10);
        p.opacity = Math.random() * 0.32 + 0.16;
      } else if (weatherId === 'snow') {
        p.kind = "flake";
        p.vy = Math.random() * 1.35 + 0.45 + p.layer * 0.65;
        p.vx = Math.random() * 1.5 - 0.75;
        p.size = Math.random() * 3.6 + 1.1 + p.layer * 1.3;
        p.drift = Math.random() * 1.75 + 0.4;
        p.opacity = Math.random() * 0.5 + 0.22;
      } else if (weatherId === 'magic-storm') {
        p.kind = Math.random() > 0.78 ? "ray" : "spark";
        p.vx = (Math.random() - 0.5) * (isMobile ? 3.2 : 5.2);
        p.vy = (Math.random() - 0.5) * (isMobile ? 3.2 : 5.2);
        p.size = Math.random() * 3.8 + 1.1 + p.layer * 2;
        p.pulse = Math.random() * 0.12 + 0.03;
        p.isFlare = Math.random() > 0.9;
      } else if (weatherId === 'windy') {
        p.kind = Math.random() > 0.62 ? "leaf" : Math.random() > 0.42 ? "wisp" : "cloud";
        p.vx = (Math.random() * 11 + 7) * (isMobile ? 0.7 : 1) * (0.65 + p.layer);
        p.vy = (Math.random() - 0.5) * 4;
        p.size = Math.random() * 5 + 2 + p.layer * 3;
        p.length = Math.random() * 80 + 60;
        p.isLeaf = p.kind === "leaf";
        p.isWisp = p.kind === "wisp";
        p.isCloud = p.kind === "cloud";
        p.turbulence = Math.random() * 0.08 + 0.035;
      } else if (weatherId === 'fog') {
        p.kind = "mist";
        p.vx = Math.random() * 0.26 + 0.06;
        p.vy = (Math.random() - 0.5) * 0.08;
        p.size = Math.random() * (isMobile ? 130 : 260) + (isMobile ? 100 : 140);
        p.opacity = Math.random() * 0.055 + 0.025;
      } else if (weatherId === 'heatwave') {
        p.kind = Math.random() > 0.55 ? "ember" : "ray";
        p.vy = Math.random() * -1.6 - 0.45;
        p.vx = (Math.random() - 0.5) * 1;
        p.size = Math.random() * 2.3 + 0.8 + p.layer;
        p.opacity = Math.random() * 0.28 + 0.08;
        p.length = Math.random() * 48 + 18;
        p.waveFreq = Math.random() * 0.05 + 0.02;
      } else if (weatherId === 'overcast') {
        p.kind = "cloud";
        p.vx = Math.random() * 0.32 + 0.06;
        p.vy = (Math.random() - 0.5) * 0.05;
        p.size = Math.random() * (isMobile ? 120 : 240) + 120;
        p.opacity = Math.random() * 0.045 + 0.022;
      } else if (weatherId === 'clear') {
        p.kind = Math.random() > 0.82 ? "ray" : "spark";
        p.vx = (Math.random() - 0.5) * 0.42;
        p.vy = (Math.random() - 0.5) * 0.36;
        p.size = Math.random() * 1.7 + 0.45 + p.layer * 0.8;
        p.opacity = Math.random() * 0.36 + 0.08;
        p.isGlint = Math.random() > 0.8;
      }
      
      return p;
    };

    const drawSoftOrb = (x: number, y: number, radius: number, color: string, alpha: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
      gradient.addColorStop(0.45, `rgba(${color}, ${alpha * 0.35})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawAtmosphere = (now: number, intensity = 1) => {
      const palette = weatherPalette[weatherId] ?? weatherPalette.clear;
      const t = now * 0.001;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const vertical = ctx.createLinearGradient(0, 0, width, height);
      vertical.addColorStop(0, `rgba(${palette.shadow}, ${0.16 * intensity})`);
      vertical.addColorStop(0.45, `rgba(${palette.base}, ${0.055 * intensity})`);
      vertical.addColorStop(1, `rgba(${palette.shadow}, ${0.24 * intensity})`);
      ctx.fillStyle = vertical;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "screen";
      const driftX = Math.sin(t * 0.18) * width * 0.04;
      drawSoftOrb(width * 0.78 + driftX, height * 0.08, Math.min(width, height) * 0.52, palette.glow, weatherId === "clear" ? 0.16 : 0.08);
      drawSoftOrb(width * 0.18 - driftX, height * 0.62, Math.min(width, height) * 0.62, palette.base, 0.06);

      if (weatherId === "clear") {
        ctx.translate(width * 0.74, -height * 0.08);
        ctx.rotate(-0.16 + Math.sin(t * 0.12) * 0.025);
        for (let i = 0; i < 5; i++) {
          const ray = ctx.createLinearGradient(0, 0, 0, height * 1.45);
          ray.addColorStop(0, "rgba(251, 191, 36, 0.10)");
          ray.addColorStop(0.45, "rgba(251, 191, 36, 0.035)");
          ray.addColorStop(1, "rgba(251, 191, 36, 0)");
          ctx.fillStyle = ray;
          ctx.beginPath();
          ctx.moveTo(i * 58 - 130, 0);
          ctx.lineTo(i * 58 - 220, height * 1.45);
          ctx.lineTo(i * 58 - 70, height * 1.45);
          ctx.fill();
        }
      } else if (weatherId === "heatwave") {
        for (let i = 0; i < 8; i++) {
          const x = (i / 8) * width + Math.sin(t * 0.9 + i) * 18;
          const shimmer = ctx.createLinearGradient(x, 0, x + 34, height);
          shimmer.addColorStop(0, "rgba(251, 146, 60, 0)");
          shimmer.addColorStop(0.5, "rgba(251, 191, 36, 0.055)");
          shimmer.addColorStop(1, "rgba(248, 113, 113, 0)");
          ctx.fillStyle = shimmer;
          ctx.fillRect(x - 16, 0, 46, height);
        }
      } else if (weatherId === "magic-storm") {
        drawSoftOrb(width * 0.5 + Math.sin(t * 0.3) * 70, height * 0.34, Math.min(width, height) * 0.46, "167, 139, 250", 0.18);
        drawSoftOrb(width * 0.7, height * 0.74, Math.min(width, height) * 0.34, "34, 211, 238", 0.08);
      } else if (weatherId === "storm") {
        const flash = Math.sin(t * 7.7) > 0.985 ? 0.2 : 0;
        if (flash) {
          ctx.fillStyle = `rgba(226, 232, 240, ${flash})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (weatherId === "fog" || weatherId === "overcast") {
        ctx.globalCompositeOperation = "source-over";
        const veil = ctx.createLinearGradient(0, height * 0.1, width, height * 0.88);
        veil.addColorStop(0, `rgba(${palette.haze}, ${weatherId === "fog" ? 0.07 : 0.04})`);
        veil.addColorStop(0.55, `rgba(${palette.base}, ${weatherId === "fog" ? 0.11 : 0.07})`);
        veil.addColorStop(1, "rgba(2, 6, 23, 0)");
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    };

    const recycleParticle = (p: WeatherParticle) => {
      const next = createParticle(true);
      Object.assign(p, next);
      if (weatherId === "rain" || weatherId === "storm") {
        p.x = Math.random() * (width + 220) - 110;
        p.y = -80 - Math.random() * 160;
      } else if (weatherId === "windy") {
        p.x = -140 - Math.random() * 220;
        p.y = Math.random() * height;
      } else if (weatherId === "heatwave") {
        p.x = Math.random() * width;
        p.y = height + 60 + Math.random() * 120;
      }
    };

    const update = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(update);
        return;
      }
      if (isActivelyScrolling && performance.now() - lastScrollAt > 180) {
        isActivelyScrolling = false;
      }
      if (isActivelyScrolling) {
        frameSkip = (frameSkip + 1) % 2;
        if (frameSkip !== 0) {
          animationFrameId = requestAnimationFrame(update);
          return;
        }
      }
      if (!isHeroInView) {
        frameSkip = (frameSkip + 1) % 3;
        if (frameSkip !== 0) {
          animationFrameId = requestAnimationFrame(update);
          return;
        }
      }

      const now = performance.now();
      const targetFrameMs = width < 768 ? 32 : 16;
      if (now - lastPaintAt < targetFrameMs) {
        animationFrameId = requestAnimationFrame(update);
        return;
      }
      lastPaintAt = now;
      ctx.clearRect(0, 0, width, height);
      drawAtmosphere(now);

      particles.forEach(p => {
        if (weatherId === 'rain' || weatherId === 'storm') {
          p.y += p.vy;
          p.x += p.vx;
          ctx.strokeStyle = weatherId === "storm"
            ? `rgba(125, 211, 252, ${p.opacity + 0.08})`
            : `rgba(96, 165, 250, ${p.opacity})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.9, p.y + p.length);
          ctx.stroke();
          if (p.layer > 0.82 && weatherId === "rain") {
            ctx.strokeStyle = `rgba(191, 219, 254, ${p.opacity * 0.24})`;
            ctx.beginPath();
            ctx.ellipse(p.x, height - 12 - p.layer * 18, p.size * 8, p.size * 1.7, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (weatherId === 'snow') {
          p.angle += 0.02;
          p.y += p.vy;
          p.x += Math.sin(p.angle) * (p.drift ?? 0);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.shadowBlur = p.layer > 0.7 ? 10 : 0;
          ctx.shadowColor = "#dbeafe";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (weatherId === 'magic-storm') {
          p.vortexAngle += 0.035 + (p.pulse ?? 0);
          p.x += p.vx + Math.cos(p.vortexAngle) * (1.2 + p.layer * 2.5);
          p.y += p.vy + Math.sin(p.vortexAngle) * (1.2 + p.layer * 2.5);
          
          if (p.kind === "ray") {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.11 + p.opacity * 0.24})`;
            ctx.lineWidth = 1 + p.layer * 1.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.quadraticCurveTo(p.x + Math.sin(p.wave) * 28, p.y - 22, p.x + p.vx * 12, p.y + p.vy * 12);
            ctx.stroke();
          } else {
            const pulse = Math.abs(Math.sin(now * 0.004 + p.wave));
            ctx.fillStyle = p.isFlare
              ? `rgba(167, 139, 250, ${0.18 + pulse * 0.22})`
              : `rgba(167, 139, 250, ${p.opacity})`;
            ctx.shadowBlur = p.isFlare ? 24 : 12;
            ctx.shadowColor = p.layer > 0.65 ? "#22d3ee" : "#8b5cf6";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + pulse * (p.isFlare ? 5 : 1.5), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (weatherId === 'windy') {
          p.angle += p.spin;
          p.wave += p.turbulence ?? 0;
          const gustVy = Math.sin(p.wave) * 3;
          
          p.x += p.vx;
          p.y += p.vy + gustVy;
          
          if (p.isLeaf) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = `rgba(74, 222, 128, ${p.opacity + 0.08})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else if (p.isDebris) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity})`;
            ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
            ctx.restore();
          } else if (p.isCloud) {
            const cloudSize = p.size * 22;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, cloudSize);
            grad.addColorStop(0, `rgba(187, 247, 208, ${p.opacity * 0.08})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, cloudSize, 0, Math.PI * 2);
            ctx.fill();
            p.x -= p.vx * 0.68;
          } else {
            ctx.strokeStyle = `rgba(187, 247, 208, ${p.opacity * 0.34})`;
            ctx.lineWidth = 1 + p.layer * 1.5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.bezierCurveTo(p.x - p.length * 0.2, p.y - 12, p.x - p.length * 0.65, p.y + 18, p.x - p.length, p.y - gustVy);
            ctx.stroke();
          }
        } else if (weatherId === 'fog' || weatherId === 'overcast') {
          p.x += p.vx;
          p.y += p.vy;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, weatherId === "fog" ? `rgba(203, 213, 225, ${p.opacity})` : `rgba(148, 163, 184, ${p.opacity})`);
          grad.addColorStop(0.55, `rgba(148, 163, 184, ${p.opacity * 0.35})`);
          grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 1.4, p.size * 0.55, Math.sin(p.wave) * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else if (weatherId === 'heatwave') {
          p.y += p.vy;
          p.wave += p.waveFreq ?? 0;
          p.x += Math.sin(p.wave) * (1.2 + p.layer * 2.4);
          if (p.kind === "ember") {
            ctx.fillStyle = `rgba(251, 146, 60, ${p.opacity})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#fb923c";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.strokeStyle = `rgba(251, 191, 36, ${p.opacity * 0.48})`;
            ctx.lineWidth = 1 + p.layer;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.bezierCurveTo(p.x + 12, p.y + p.length * 0.25, p.x - 10, p.y + p.length * 0.65, p.x + Math.sin(p.wave) * 18, p.y + p.length);
            ctx.stroke();
          }
        } else if (weatherId === 'clear') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.isGlint) {
            p.opacity = Math.abs(Math.sin(now * 0.002 + p.wave)) * 0.48 + 0.08;
          }
          if (p.kind === "ray") {
            ctx.strokeStyle = `rgba(251, 191, 36, ${p.opacity * 0.32})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x - p.size * 4, p.y);
            ctx.lineTo(p.x + p.size * 4, p.y);
            ctx.moveTo(p.x, p.y - p.size * 4);
            ctx.lineTo(p.x, p.y + p.size * 4);
            ctx.stroke();
          } else {
            ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (p.y > height + 130 || p.x > width + 180 || p.x < -180 || p.y < -160) recycleParticle(p);
      });

      animationFrameId = requestAnimationFrame(update);
    };

    function drawReducedMotionFrame() {
      drawCtx.clearRect(0, 0, width, height);
      drawAtmosphere(performance.now(), 0.72);
      particles.forEach((p) => {
        const size = weatherId === 'fog' || weatherId === "overcast" ? Math.min(p.size, 150) : Math.max(p.size, 2);
        const gradient = drawCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        const color = weatherId === 'rain' || weatherId === 'storm'
          ? '56, 189, 248'
          : weatherId === 'snow'
            ? '255, 255, 255'
            : weatherId === 'magic-storm'
              ? '167, 139, 250'
              : weatherId === 'heatwave'
                ? '251, 191, 36'
                : weatherId === 'windy'
                  ? '148, 163, 184'
                  : weatherId === 'fog' || weatherId === "overcast"
                    ? '148, 163, 184'
                  : '251, 191, 36';
        gradient.addColorStop(0, `rgba(${color}, ${Math.min(p.opacity, 0.16)})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        drawCtx.fillStyle = gradient;
        drawCtx.beginPath();
        drawCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
        drawCtx.fill();
      });
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };

    window.addEventListener('resize', scheduleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resize();
    if (reducedMotion) {
      drawReducedMotionFrame();
    } else {
      update();
    }

    return () => {
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (scrollIdleTimeout !== null) window.clearTimeout(scrollIdleTimeout);
      if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherId]);

  return <canvas ref={canvasRef} className="weather-canvas" aria-hidden="true" style={WEATHER_CANVAS_STYLE} />;
}

function getWeatherIcon(icon: string, size = 18) {
  switch (icon) {
    case 'sun': return <Sun size={size} />;
    case 'cloud-fog': return <CloudFog size={size} />;
    case 'thermometer-sun': return <ThermometerSun size={size} />;
    case 'zap': return <Zap size={size} />;
    case 'cloud': return <Cloud size={size} />;
    case 'cloud-rain': return <CloudRain size={size} />;
    case 'cloud-snow': return <CloudSnow size={size} />;
    case 'cloud-lightning': return <CloudLightning size={size} />;
    case 'wind': return <Wind size={size} />;
    default: return <Sun size={size} />;
  }
}
