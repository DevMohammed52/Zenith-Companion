import React, { type RefObject } from "react";
import Link from "next/link";
import {
  Box,
  Castle,
  ExternalLink,
  Landmark,
  MapPin,
  Package,
  Skull,
  Swords,
} from "lucide-react";
import {
  getWeatherPreferenceLabel,
  isFavorableWeather,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import {
  formatWindow,
  poiIcon,
  weatherIcon,
  WEATHER_COLORS,
  type MapLocation,
  type PointOfInterest,
} from "../types";

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
            {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" loading="lazy" decoding="async" /> : <Swords size={18} />}
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

export function LocationDossier({
  dossierRef,
  selectedLocation,
  selectedPointsOfInterest,
}: {
  dossierRef: RefObject<HTMLElement | null>;
  selectedLocation: MapLocation;
  selectedPointsOfInterest: PointOfInterest[];
}) {
  const weatherKey = String(
    selectedLocation.currentWeather?.key || selectedLocation.nextWeather?.key || "OVERCAST",
  ).toUpperCase();
  const weatherAccent = WEATHER_COLORS[weatherKey] || "#f5b041";

  return (
    <section className="location-dossier" ref={dossierRef} aria-label={`${selectedLocation.name} details`}>
      <div className="location-image">
        {selectedLocation.image_url ? (
          <img src={selectedLocation.image_url} alt={`${selectedLocation.name} location art`} />
        ) : (
          <MapPin size={42} />
        )}
      </div>
      <div className="location-heading">
        <span>Location</span>
        <h2>{selectedLocation.name}</h2>
        <p>{selectedLocation.description || "Browse nearby enemies, dungeons, bosses, gathered resources, loot drops, and weather windows."}</p>
      </div>

      <div className="weather-card" style={{ "--weather-accent": weatherAccent } as React.CSSProperties}>
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
        <Link href={`/enemies?location=${encodeURIComponent(selectedLocation.key)}`}><Swords size={14} /> Enemies <ExternalLink size={12} /></Link>
        <Link href={`/dungeons?search=${encodeURIComponent(selectedLocation.name)}`}><Castle size={14} /> Dungeons <ExternalLink size={12} /></Link>
        <Link href={`/bosses?search=${encodeURIComponent(selectedLocation.name)}`}><Skull size={14} /> Bosses <ExternalLink size={12} /></Link>
      </div>
    </section>
  );
}
