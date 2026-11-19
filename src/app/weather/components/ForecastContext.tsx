import React from "react";
import Link from "next/link";
import { MapPin, Sparkles, Swords } from "lucide-react";
import type { WeatherData } from "@/constants/weatherData";
import type { EnrichedLocation } from "@/lib/world-intelligence";
import {
  formatForecastAriaLabel,
  formatForecastTime,
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
