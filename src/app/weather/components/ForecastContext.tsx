import React from "react";
import Link from "next/link";
import type { WeatherData } from "@/constants/weatherData";
import type { EnrichedLocation } from "@/lib/world-intelligence";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatForecastAriaLabel,
  formatForecastTime,
  formatRelativeCountdown,
  type LocationWeatherCounts,
} from "../types";
import styles from "../Weather.module.css";

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
  const countdown = formatRelativeCountdown(weather);

  return (
    <Link
      href={`/map?location=${encodeURIComponent(location.key)}`}
      className={styles.forecastLocationCard}
      aria-label={formatForecastAriaLabel(weather?.name || "Weather", mode === "current" ? "now" : "next", location, weather)}
    >
      <div className={styles.forecastLocationTop}>
        <strong>{location.name}</strong>
        <span className={styles.forecastCountdownPill}>{countdown.label}</span>
      </div>
      <div className={styles.forecastLocationBottom}>
        <small>{formatForecastTime(weather)}</small>
        <div className={styles.forecastLocationBadges}>
          {counts.favored > 0 && (
            <Badge variant="success" size="sm" icon={<Icon name="xp" size="xs" />} title={`${counts.favored} favored enemies`}>
              {counts.favored}
            </Badge>
          )}
          {counts.penalized > 0 && (
            <Badge variant="danger" size="sm" icon={<Icon name="combat" size="xs" />} title={`${counts.penalized} penalized enemies`}>
              {counts.penalized}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ForecastContext({
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
    <Card variant="default" className={styles.liveCard}>
      <div className={`${styles.cardHeader} ${styles.cardHeaderCompact}`}>
        <Icon name="map" size="md" />
        <h3>Location Forecast</h3>
      </div>
      <div className={styles.laneStack}>
        <section>
          <div className={styles.laneTitle}>
            <span>Active now</span>
            <Badge variant="success" size="sm">
              {currentLocations.length}
            </Badge>
          </div>
          <div className={styles.laneList}>
            {currentLocations.slice(0, 4).map((location) => (
              <ForecastLocationCard key={`current-${location.key}`} location={location} mode="current" counts={getCounts(location)} />
            ))}
            {currentLocations.length === 0 && (
              <EmptyState
                variant="no-data"
                title={`No active ${activeWeather.name} regions`}
                description="Check upcoming windows or select another weather pattern."
                size="sm"
              />
            )}
          </div>
        </section>

        <section>
          <div className={styles.laneTitle}>
            <span>Coming next</span>
            <Badge variant="neutral" size="sm">
              {nextLocations.length}
            </Badge>
          </div>
          <div className={styles.laneList}>
            {nextLocations.slice(0, 4).map((location) => (
              <ForecastLocationCard key={`next-${location.key}`} location={location} mode="next" counts={getCounts(location)} />
            ))}
            {nextLocations.length === 0 && (
              <EmptyState
                variant="no-data"
                title={`No upcoming ${activeWeather.name} regions`}
                description="Forecast cycle does not project this weather in the next window."
                size="sm"
              />
            )}
          </div>
        </section>
      </div>
    </Card>
  );
}
