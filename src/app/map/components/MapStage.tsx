import React, { type RefObject } from "react";
import {
  Box,
  Castle,
  Compass,
  Crosshair,
  Map as MapIcon,
  MapPin,
  Package,
  Search,
  Skull,
  Swords,
} from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { NoResultsState } from "@/components/StateBlock";
import {
  getLocationPosition,
  weatherIcon,
  WEATHER_COLORS,
  WORLD_MAP_IMAGE_URL,
  type MapLocation,
} from "../types";

export function MapStage({
  mapStageRef,
  dossierRef,
  intelRef,
  mobileRailRef,
  query,
  setQuery,
  scrollToSection,
  locations,
  filteredLocations,
  selectedLocation,
  selectedKey,
  setSelectedKey,
  selectedWeatherKey,
  selectedWeatherLabel,
  selectedLevelLabel,
  selectedActivityLabel,
  totals,
}: {
  mapStageRef: RefObject<HTMLDivElement | null>;
  dossierRef: RefObject<HTMLElement | null>;
  intelRef: RefObject<HTMLElement | null>;
  mobileRailRef: RefObject<HTMLElement | null>;
  query: string;
  setQuery: (q: string) => void;
  scrollToSection: (target: HTMLElement | null) => void;
  locations: MapLocation[];
  filteredLocations: MapLocation[];
  selectedLocation: MapLocation | null;
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  selectedWeatherKey: string;
  selectedWeatherLabel: string;
  selectedLevelLabel: string;
  selectedActivityLabel: string;
  totals: {
    locations: number;
    enemies: number;
    dungeons: number;
    bosses: number;
    resources: number;
    drops: number;
  };
}) {
  return (
    <div className="atlas-panel">
      <div className="atlas-topbar">
        <div className="atlas-title">
          <span><ZenithIcon name="map" size={16} /> IdleMMO World</span>
          <h1>World Map</h1>
          <div className="atlas-context-row" aria-label="Selected map context">
            <span>{filteredLocations.length.toLocaleString()} visible</span>
            <span>{weatherIcon(selectedWeatherKey, 13)} {selectedWeatherLabel}</span>
            <span>{selectedLevelLabel}</span>
            <span>{selectedActivityLabel}</span>
          </div>
        </div>
        <div className="atlas-controls">
          <div className="atlas-search">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search locations and sources"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search location, boss, dungeon, enemy, loot..."
            />
          </div>

          <div className="atlas-control-row">
            <div className="atlas-actions" aria-label="World map quick actions" role="group">
              <button type="button" onClick={() => scrollToSection(mapStageRef.current)}>
                <MapIcon size={15} aria-hidden="true" />
                Map
              </button>
              <button type="button" onClick={() => scrollToSection(dossierRef.current)} disabled={!selectedLocation}>
                <MapPin size={15} aria-hidden="true" />
                Dossier
              </button>
              <button type="button" onClick={() => scrollToSection(intelRef.current)} disabled={!selectedLocation}>
                <Crosshair size={15} aria-hidden="true" />
                Intel
              </button>
            </div>

            <div className="map-result-count" aria-live="polite">
              {filteredLocations.length === locations.length
                ? `${locations.length.toLocaleString()} locations`
                : `${filteredLocations.length.toLocaleString()} matching locations`}
            </div>
          </div>
        </div>
      </div>

      <div className="map-stage" ref={mapStageRef}>
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
          <NoResultsState
            compact
            className="map-empty-state"
            title="No matching locations"
            description="Try adjusting the search query."
          />
        )}

        <div className="map-compass" aria-hidden="true">
          <Compass size={34} />
          <span>N</span>
        </div>

        <div className="map-legend" aria-label="Map marker states" role="group">
          <span><i className="legend-dot weather" aria-hidden="true" /> Weather</span>
          <span><i className="legend-dot active" aria-hidden="true" /> Active</span>
        </div>
      </div>

      <nav className="mobile-location-rail" ref={mobileRailRef} aria-label="Map locations">
        {filteredLocations.map((location) => {
          const active = selectedLocation?.key === location.key;
          const weatherKey = String(location.currentWeather?.key || location.nextWeather?.key || "OVERCAST").toUpperCase();
          return (
            <button
              type="button"
              key={`rail-${location.key}`}
              data-location-key={location.key}
              data-active={active ? "true" : undefined}
              className={active ? "active" : ""}
              aria-pressed={active}
              aria-label={`${location.name}${location.level !== null ? `, Level ${location.level}` : ""}, ${location.currentWeather?.name || location.nextWeather?.name || "weather unknown"}`}
              onClick={() => setSelectedKey(location.key)}
            >
              <span>{weatherIcon(weatherKey, 13)} {location.name}</span>
              {location.level !== null && <small>Lv.{location.level}</small>}
            </button>
          );
        })}
      </nav>

      <div className="atlas-metrics" aria-label="Map totals" role="group">
        <div><MapPin size={16} /><span>Locations</span><strong>{totals.locations}</strong></div>
        <div><Swords size={16} /><span>Enemies</span><strong>{totals.enemies}</strong></div>
        <div><Castle size={16} /><span>Dungeons</span><strong>{totals.dungeons}</strong></div>
        <div><Skull size={16} /><span>Bosses</span><strong>{totals.bosses}</strong></div>
        <div><Package size={16} /><span>Resources</span><strong>{totals.resources}</strong></div>
        <div><Box size={16} /><span>Loot</span><strong>{totals.drops}</strong></div>
      </div>
    </div>
  );
}
