import React, { type RefObject } from "react";
import { Card, EmptyState, Icon } from "@/components/ui";
import {
  getLocationPosition,
  weatherIcon,
  WEATHER_COLORS,
  WORLD_MAP_IMAGE_URL,
  type MapLocation,
} from "../types";
import styles from "../page.module.css";

interface MapStageProps {
  mapStageRef: RefObject<HTMLDivElement | null>;
  quickRailRef: RefObject<HTMLDivElement | null>;
  filteredLocations: MapLocation[];
  selectedLocation: MapLocation | null;
  setSelectedKey: (key: string) => void;
  resetFilters: () => void;
}

export function MapStage({
  mapStageRef,
  quickRailRef,
  filteredLocations,
  selectedLocation,
  setSelectedKey,
  resetFilters,
}: MapStageProps) {
  return (
    <Card padding="md" className={styles.stageCard}>
      {/* Panoramic atmospheric viewport with centered 1:1 calibrated Solaris Isle canvas */}
      <div className={styles.mapViewport} ref={mapStageRef}>
        <div className={styles.mapOverlayTitle}>
          <Icon name="map" size="sm" aria-hidden="true" />
          <span>Solaris Isle</span>
        </div>

        <img
          className={styles.mapAmbientBackdrop}
          src={WORLD_MAP_IMAGE_URL}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
        <div className={styles.mapViewportVignette} aria-hidden="true" />

        <div className={styles.mapCanvas}>
          <img
            className={styles.worldMapArt}
            src={WORLD_MAP_IMAGE_URL}
            alt=""
            aria-hidden="true"
            decoding="async"
          />

          {filteredLocations.map((location) => {
            const position = getLocationPosition(location);
            const active = selectedLocation?.key === location.key;
            const weatherKey = String(
              location.currentWeather?.key || location.nextWeather?.key || "OVERCAST",
            ).toUpperCase();
            const weatherDotColor = WEATHER_COLORS[weatherKey] || "#94a3b8";

            const pinClassName = [
              styles.mapPin,
              active ? styles.mapPinActive : "",
              position.x > 78 ? styles.pinEdgeRight : "",
              position.x < 18 ? styles.pinEdgeLeft : "",
              position.y > 78 ? styles.pinEdgeBottom : "",
              position.y < 12 ? styles.pinEdgeTop : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                type="button"
                key={location.key}
                className={pinClassName}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                aria-pressed={active}
                aria-label={`${location.name}${location.level !== null ? `, Level ${location.level}` : ""}, ${location.currentWeather?.name || location.nextWeather?.name || "weather unknown"}`}
                onClick={() => setSelectedKey(location.key)}
              >
                <span className={styles.pinPill}>
                  <span
                    className={styles.pinWeatherDot}
                    style={{ backgroundColor: weatherDotColor }}
                    aria-hidden="true"
                  />
                  <span className={styles.pinName}>{location.name}</span>
                  {location.level !== null && (
                    <span className={styles.pinLevel}>Lv.{location.level}</span>
                  )}
                </span>
              </button>
            );
          })}

          {filteredLocations.length === 0 && (
            <div className={styles.mapEmptyOverlay}>
              <EmptyState
                variant="search-empty"
                size="sm"
                title="No matching locations"
                description="No regions match your current search filter."
                action={{ label: "Reset filter", onClick: resetFilters }}
              />
            </div>
          )}
        </div>

        <div className={styles.mapCompass} aria-hidden="true">
          <Icon name="map" size="lg" />
          <span>N</span>
        </div>
      </div>

      {filteredLocations.length > 0 && (
        <nav className={styles.quickRail} ref={quickRailRef} aria-label="Region selector">
          {filteredLocations.map((location) => {
            const active = selectedLocation?.key === location.key;
            const weatherKey = String(
              location.currentWeather?.key || location.nextWeather?.key || "OVERCAST",
            ).toUpperCase();

            return (
              <button
                type="button"
                key={`rail-${location.key}`}
                data-location-key={location.key}
                data-active={active ? "true" : undefined}
                className={`${styles.railChip} ${active ? styles.railChipActive : ""}`}
                aria-pressed={active}
                onClick={() => setSelectedKey(location.key)}
              >
                <span className={styles.railChipWeather} aria-hidden="true">
                  {weatherIcon(weatherKey, 13)}
                </span>
                <span className={styles.railChipName}>{location.name}</span>
                {location.level !== null && (
                  <span className={styles.railChipLevel}>Lv.{location.level}</span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </Card>
  );
}
