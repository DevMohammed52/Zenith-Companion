import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { WeatherData } from "@/constants/weatherData";
import type { EnrichedLocation } from "@/lib/world-intelligence";
import { formatForecastAriaLabel, formatForecastTime } from "../types";

export function ForecastTimelineStrip({
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
