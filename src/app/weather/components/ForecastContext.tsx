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
      className="forecast-location-card"
      aria-label={formatForecastAriaLabel(weather?.name || "Weather", mode === "current" ? "now" : "next", location, weather)}
    >
      <div className="forecast-location-top">
        <strong>{location.name}</strong>
        <span className="forecast-countdown-pill">{countdown.label}</span>
      </div>
      <div className="forecast-location-bottom">
        <small>{formatForecastTime(weather)}</small>
        <div className="forecast-location-badges">
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
    <Card variant="default" className="forecast-context-card">
      <div className="card-header compact">
        <Icon name="map" size="md" />
        <h3>Location Forecast</h3>
      </div>
      <div className="forecast-lanes">
        <section className="forecast-lane">
          <div className="forecast-lane-title">
            <span>Active now</span>
            <Badge variant="success" size="sm">
              {currentLocations.length}
            </Badge>
          </div>
          <div className="forecast-location-list">
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

        <section className="forecast-lane">
          <div className="forecast-lane-title">
            <span>Coming next</span>
            <Badge variant="neutral" size="sm">
              {nextLocations.length}
            </Badge>
          </div>
          <div className="forecast-location-list">
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
