"use client";
import type { CSSProperties } from 'react';
import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
          >
            {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" /> : <Swords size={20} />}
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
    <Link href={`/map?location=${encodeURIComponent(location.key)}`} className="forecast-location-card">
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
    <div className="forecast-strip" aria-label={`${activeWeather.name} forecast timeline`}>
      <div className="forecast-strip-label">
        <Clock size={15} />
        <span>{activeWeather.name} windows</span>
      </div>
      <div className="forecast-strip-track">
        {windows.length > 0 ? (
          windows.map(({ location, mode, weather }) => (
            <Link
              key={`${mode}-${location.key}`}
              href={`/map?location=${encodeURIComponent(location.key)}`}
              className={`forecast-pill ${mode === "Now" ? "now" : "next"}`}
            >
              <span className="forecast-pill-mode">{mode}</span>
              <strong>{location.name}</strong>
              <small>{formatForecastTime(weather)}</small>
            </Link>
          ))
        ) : (
          <div className="forecast-pill empty">
            <span className="forecast-pill-mode">Quiet</span>
            <strong>No active windows</strong>
            <small>No matching current or next location forecast.</small>
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
    <Link key={`${tone}-${enemy.locationKey}-${enemy.name}`} href={`/enemies?search=${encodeURIComponent(enemy.name)}`} className={`current-enemy-link ${tone}`}>
      {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" /> : <Swords size={18} />}
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
  const enemies = useMemo(() => buildEnrichedEnemies({ staticData, worldLocations, marketData }), [marketData, staticData, worldLocations]);
  const locations = useMemo(
    () => buildEnrichedLocations({ staticData, worldLocations, marketData, allItemsDb }),
    [allItemsDb, marketData, staticData, worldLocations],
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
  const weatherAccent = {
    '--accent': activeWeather.theme.primary,
    '--accent-2': activeWeather.theme.secondary,
  } as CSSProperties;

  return (
    <main className="weather-container" style={weatherAccent}>
      <WeatherCanvas weatherId={activeWeather.id} />
      <div className="weather-glow" aria-hidden="true" />
      <div className="weather-atmosphere" aria-hidden="true" />
      
      <div className="content-wrapper">
        <header className="page-header">
          <div className="header-text">
            <span className="eyebrow">IdleMMO Weather Index</span>
            <h1>Weather Encyclopedia</h1>
            <p>Master the elements and optimize your activities based on the atmospheric conditions of IdleMMO.</p>
          </div>
          <div className="weather-selector-shell">
            <div className="weather-selector" aria-label="Weather types">
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
          background:
            radial-gradient(circle at 80% 6%, color-mix(in srgb, var(--accent), transparent 78%), transparent 34rem),
            radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.1), transparent 25rem),
            #020617;
        }
        .weather-container, .weather-container * { box-sizing: border-box; }
        .weather-container::before,
        .weather-container::after {
          content: "";
          position: fixed;
          inset: auto auto 6% -12%;
          z-index: 1;
          width: min(48vw, 42rem);
          height: min(48vw, 42rem);
          border-radius: 999px;
          pointer-events: none;
          background: radial-gradient(circle, color-mix(in srgb, var(--accent), transparent 84%), transparent 68%);
          filter: blur(8px);
          opacity: 0.7;
          animation: orbit-glow 13s ease-in-out infinite alternate;
        }
        .weather-container::after {
          inset: 8% -16% auto auto;
          width: min(38vw, 34rem);
          height: min(38vw, 34rem);
          background: radial-gradient(circle, color-mix(in srgb, var(--accent-2), transparent 86%), transparent 70%);
          animation-duration: 16s;
          animation-direction: alternate-reverse;
        }

        .weather-glow {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 94%), transparent 45%),
            radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 36rem);
          animation: breathe 7s ease-in-out infinite alternate;
        }
        .weather-atmosphere {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          opacity: 0.45;
          background:
            linear-gradient(110deg, transparent 12%, color-mix(in srgb, var(--accent), transparent 94%) 28%, transparent 44%),
            linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.025) 50%, transparent 56%);
          mask-image: radial-gradient(circle at 50% 0%, black, transparent 72%);
          animation: atmosphere-drift 18s ease-in-out infinite alternate;
        }

        .content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          min-width: 0;
        }

        .page-header { margin-bottom: 2.5rem; text-align: center; animation: rise-in 0.55s ease both; }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .header-text h1 { font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
        .header-text p { color: rgba(255,255,255,0.5); font-size: 1.1rem; max-width: 650px; margin: 0 auto; }

        .weather-selector-shell {
          position: relative;
          margin-top: 2.5rem;
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
          grid-template-columns: repeat(9, minmax(0, 1fr));
          gap: 0.55rem;
          padding: 0.5rem;
          overflow: visible;
        }

        .weather-btn {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 0.78rem 0.9rem;
          border-radius: 16px;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
          transform: translateY(-3px); 
          box-shadow: 0 10px 25px -10px rgba(0,0,0,0.5);
        }
        .weather-btn.active {
          background: color-mix(in srgb, var(--accent), transparent 85%);
          border-color: color-mix(in srgb, var(--accent), transparent 30%);
          color: #fff;
          box-shadow: 0 12px 30px -10px color-mix(in srgb, var(--accent), transparent 50%);
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 2.5rem;
          align-items: start;
        }

        .active-info-panel {
          position: relative;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015)),
            rgba(9, 11, 20, 0.74);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 40px;
          padding: 3.5rem;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
          animation: rise-in 0.65s 0.05s ease both;
          min-width: 0;
          overflow: hidden;
        }
        .active-info-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 92%), transparent 38%),
            radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--accent), transparent 86%), transparent 20rem);
          opacity: 0.85;
        }
        .active-info-panel > * {
          position: relative;
          z-index: 1;
        }

        .weather-hero { display: flex; align-items: center; gap: 3rem; margin-bottom: 4.5rem; }
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
          background:
            radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent), transparent 76%), transparent 58%),
            conic-gradient(from 35deg, transparent 0 18%, color-mix(in srgb, var(--accent), transparent 58%) 20%, transparent 23% 48%, color-mix(in srgb, var(--accent-2), transparent 66%) 51%, transparent 55% 100%);
          border: 1px solid color-mix(in srgb, var(--accent), transparent 72%);
          box-shadow:
            inset 0 0 28px color-mix(in srgb, var(--accent), transparent 84%),
            0 0 44px color-mix(in srgb, var(--accent), transparent 84%);
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
          filter: drop-shadow(0 0 28px color-mix(in srgb, var(--accent), transparent 45%));
          animation: float-icon 4.5s ease-in-out infinite;
        }
        .hero-text h2 { font-size: 4.5rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.05em; }
        .hero-text .description { font-size: 1.3rem; color: rgba(255,255,255,0.6); line-height: 1.6; max-width: 650px; }

        .impact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 2rem; }
        .impact-card, .mf-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 28px;
          padding: 2.5rem;
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
          min-width: 0;
        }

        .enemy-weather-card {
          margin-top: 2rem;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 28px;
          background: rgba(255,255,255,0.02);
          padding: 2rem;
        }
        :global(.forecast-strip) {
          margin-top: 2rem;
          border: 1px solid color-mix(in srgb, var(--accent), transparent 76%);
          border-radius: 22px;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 94%), rgba(255,255,255,0.018)),
            rgba(0,0,0,0.18);
          padding: 1rem;
          overflow: hidden;
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
        :global(.forecast-strip-track) {
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
          border-radius: 16px;
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
          border-radius: 16px 0 0 16px;
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
          transform: translateY(-2px);
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
          border-radius: 24px;
          background:
            linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018)),
            color-mix(in srgb, var(--accent), transparent 96%);
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
          border-radius: 14px;
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
          transform: translateY(-2px);
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
          border-radius: 18px;
          background: rgba(0,0,0,0.16);
          padding: 0.85rem;
        }
        :global(.enemy-pref-group.good) {
          border-color: rgba(74, 222, 128, 0.14);
          background:
            linear-gradient(90deg, rgba(74, 222, 128, 0.08), transparent 42%),
            rgba(74, 222, 128, 0.035);
        }
        :global(.enemy-pref-group.bad) {
          border-color: rgba(248, 113, 113, 0.14);
          background:
            linear-gradient(90deg, rgba(248, 113, 113, 0.08), transparent 42%),
            rgba(248, 113, 113, 0.035);
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
          border-radius: 10px;
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
          border-radius: 10px;
          color: #fff;
          background: color-mix(in srgb, var(--accent), transparent 86%);
          border: 1px solid color-mix(in srgb, var(--accent), transparent 65%);
          font-size: 0.78rem;
          font-weight: 900;
          text-decoration: none;
        }
        .impact-card:hover, .mf-card:hover {
          transform: translateY(-4px);
          border-color: color-mix(in srgb, var(--accent), transparent 70%);
          background: rgba(255,255,255,0.035);
        }

        .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .card-header h3 { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.9); }

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
          border-radius: 18px;
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
          border-radius: 16px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          border: 1px solid rgba(255,255,255,0.02);
        }
        .mf-stat .label { font-size: 0.85rem; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .mf-stat .value { font-size: 1.1rem; font-weight: 800; color: #a78bfa; text-shadow: 0 0 15px rgba(167, 139, 250, 0.4); }

        .mechanics-panel { display: flex; flex-direction: column; gap: 2rem; animation: rise-in 0.65s 0.12s ease both; min-width: 0; }
        .mech-item { display: flex; gap: 1.25rem; }
        .mech-item h4 { color: #fff; font-size: 0.95rem; font-weight: 800; margin-bottom: 0.35rem; }
        .mech-item p { color: rgba(255,255,255,0.5); font-size: 0.85rem; line-height: 1.6; }
        .mech-item strong { color: var(--text-accent); }

        .mechanics-card {
          background:
            linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)),
            rgba(9, 11, 20, 0.66);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 30px;
          padding: 2rem;
        }
        .mechanics-content { display: flex; flex-direction: column; gap: 2rem; }

        .weather-tip {
          background: linear-gradient(135deg, rgba(245, 176, 65, 0.08), rgba(245, 176, 65, 0.02));
          border: 1px solid rgba(245, 176, 65, 0.15);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }
        .weather-tip p { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
        .confidence-card {
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 20px;
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
        }

        @media (max-width: 1100px) {
          .weather-selector { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .weather-hero { flex-direction: column; text-align: center; gap: 2rem; }
          .hero-text h2 { font-size: 3.5rem; }
          .active-info-panel { padding: 2.5rem; border-radius: 30px; }
          .impact-grid { grid-template-columns: 1fr; }
          .enemy-weather-groups { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .weather-container {
            width: 100vw;
            max-width: 100vw;
            padding: 1.25rem;
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
          .weather-btn:last-child:nth-child(odd) {
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
          .impact-card, .mf-card { padding: 1.5rem; border-radius: 20px; }
          :global(.forecast-strip) {
            margin-inline: -0.35rem;
            padding: 0.85rem;
          }
          :global(.forecast-pill) {
            flex-basis: 12rem;
          }
          :global(.forecast-context-card),
          :global(.current-enemy-card) {
            padding: 1rem;
            border-radius: 20px;
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
          .enemy-weather-card { padding: 1.25rem; border-radius: 20px; }
          .mechanics-card { padding: 1.5rem; border-radius: 22px; }
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

/* --- CANVAS ENGINE --- */
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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      // Adaptive particle scaling: Reduce particles on mobile for efficiency
      const multiplier = reducedMotion ? 0.18 : isMobile ? 0.45 : 1;
      
      const count = Math.floor((weatherId === 'storm' ? 350 : 
                   weatherId === 'rain' ? 250 : 
                   weatherId === 'snow' ? 200 : 
                   weatherId === 'magic-storm' ? 180 : 
                   weatherId === 'fog' ? 40 : 60) * multiplier);
      
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    };

    const createParticle = () => {
      const isMobile = width < 768;
      const p: WeatherParticle = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        size: 0,
        opacity: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        wave: Math.random() * Math.PI * 2,
        vortexAngle: Math.random() * Math.PI * 2
      };

      if (weatherId === 'rain' || weatherId === 'storm') {
        p.vy = (Math.random() * 12 + 12) * (isMobile ? 0.8 : 1);
        p.vx = (weatherId === 'storm' ? 4 : 1.5) * (isMobile ? 0.8 : 1);
        p.size = Math.random() * 2 + 1;
      } else if (weatherId === 'snow') {
        p.vy = Math.random() * 1.5 + 0.8;
        p.vx = Math.random() * 2 - 1;
        p.size = Math.random() * 3.5 + 1.5;
        p.drift = Math.random() * 2;
      } else if (weatherId === 'magic-storm') {
        p.vx = (Math.random() - 0.5) * (isMobile ? 4 : 6);
        p.vy = (Math.random() - 0.5) * (isMobile ? 4 : 6);
        p.size = Math.random() * 4 + 1;
        p.pulse = Math.random() * 0.1;
        p.isFlare = Math.random() > 0.9;
      } else if (weatherId === 'windy') {
        p.vx = (Math.random() * 15 + 10) * (isMobile ? 0.7 : 1);
        p.vy = (Math.random() - 0.5) * 6;
        p.size = Math.random() * 6 + 2;
        p.isLeaf = Math.random() > 0.6;
        p.isDebris = !p.isLeaf && Math.random() > 0.5;
        p.isWisp = !p.isLeaf && !p.isDebris && Math.random() > 0.5;
        p.isCloud = !p.isLeaf && !p.isDebris && !p.isWisp;
        p.turbulence = Math.random() * 0.1 + 0.05;
      } else if (weatherId === 'fog') {
        p.vx = Math.random() * 0.4 + 0.1;
        p.vy = (Math.random() - 0.5) * 0.1;
        p.size = Math.random() * (isMobile ? 150 : 250) + 100;
        p.opacity = Math.random() * 0.08 + 0.02;
      } else if (weatherId === 'heatwave') {
        p.vy = Math.random() * -2 - 1;
        p.vx = (Math.random() - 0.5) * 1;
        p.size = Math.random() * 2 + 1;
        p.opacity = Math.random() * 0.3 + 0.1;
        p.waveFreq = Math.random() * 0.05 + 0.02;
      } else if (weatherId === 'clear') {
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = (Math.random() - 0.5) * 0.5;
        p.size = Math.random() * 1.5 + 0.5;
        p.opacity = Math.random() * 0.4 + 0.1;
        p.isGlint = Math.random() > 0.8;
      }
      
      return p;
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

      const now = Date.now();
      ctx.clearRect(0, 0, width, height);
      
      // Global Effects
      if (weatherId === 'storm' && Math.random() > 0.985) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0, 0, width, height);
      }
      
      if (weatherId === 'magic-storm' && Math.random() > 0.99) {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.fillRect(0, 0, width, height);
      }

      if (weatherId === 'clear') {
        // Subtle God Rays
        ctx.save();
        ctx.translate(width * 0.8, height * 0.1);
        ctx.rotate(Math.PI / 6);
        const rayGrad = ctx.createLinearGradient(0, 0, 0, height * 1.5);
        rayGrad.addColorStop(0, 'rgba(251, 191, 36, 0.05)');
        rayGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = rayGrad;
        for (let i = 0; i < 3; i++) {
          ctx.rotate(0.1);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-100, height * 1.5);
          ctx.lineTo(100, height * 1.5);
          ctx.fill();
        }
        ctx.restore();
      }

      particles.forEach(p => {
        if (weatherId === 'rain' || weatherId === 'storm') {
          p.y += p.vy;
          p.x += p.vx;
          ctx.strokeStyle = `rgba(56, 189, 248, ${p.opacity})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
          ctx.stroke();
        } else if (weatherId === 'snow') {
          p.angle += 0.02;
          p.y += p.vy;
          p.x += Math.sin(p.angle) * (p.drift ?? 0);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (weatherId === 'magic-storm') {
          p.vortexAngle += 0.05;
          p.x += p.vx + Math.cos(p.vortexAngle) * 2;
          p.y += p.vy + Math.sin(p.vortexAngle) * 2;
          
          if (p.isFlare) {
            p.size = (Math.sin(now * 0.005) + 1.5) * 5;
            ctx.fillStyle = `rgba(167, 139, 250, 0.3)`;
          } else {
            ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
          }
          
          ctx.shadowBlur = p.isFlare ? 20 : 10;
          ctx.shadowColor = '#8b5cf6';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
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
            ctx.fillStyle = `rgba(74, 222, 128, ${p.opacity})`;
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
            // Parallax Background Clouds
            const cloudSize = p.size * 20;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, cloudSize);
            grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 0.05})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, cloudSize, 0, Math.PI * 2);
            ctx.fill();
            p.x -= p.vx * 0.6; // Parallax effect (slower)
          } else {
            // High Speed Air Wisps
            ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 3, p.y - gustVy);
            ctx.stroke();
          }
        } else if (weatherId === 'fog') {
          p.x += p.vx;
          p.y += p.vy;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(148, 163, 184, ${p.opacity})`);
          grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (weatherId === 'heatwave') {
          p.y += p.vy;
          p.wave += p.waveFreq ?? 0;
          p.x += Math.sin(p.wave) * 2;
          ctx.fillStyle = `rgba(248, 113, 113, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Shimmer line
          ctx.strokeStyle = `rgba(251, 191, 36, ${p.opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.sin(p.wave) * 10, p.y + 15);
          ctx.stroke();
        } else if (weatherId === 'clear') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.isGlint) {
            p.opacity = Math.abs(Math.sin(now * 0.002)) * 0.6 + 0.1;
          }
          ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Wrap around logic
        if (p.y > height + 100) p.y = -100;
        if (p.x > width + 100) p.x = -100;
        if (p.x < -100) p.x = width + 100;
        if (p.y < -100) p.y = height + 100;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    function drawReducedMotionFrame() {
      drawCtx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        const size = weatherId === 'fog' ? Math.min(p.size, 140) : Math.max(p.size, 2);
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

  return <canvas ref={canvasRef} className="weather-canvas" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
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
