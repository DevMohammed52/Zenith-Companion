import React from "react";
import Link from "next/link";
import type { WeatherData } from "@/constants/weatherData";
import type { EnrichedLocation } from "@/lib/world-intelligence";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatForecastAriaLabel, formatForecastTime, formatRelativeCountdown } from "../types";

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
    <section className={`forecast-strip ${windows.length > 1 ? "scrollable" : ""}`} aria-label={`${activeWeather.name} forecast timeline`}>
      <div className="forecast-strip-label">
        <Icon name="timer" size="sm" />
        <span>{activeWeather.name} windows</span>
      </div>
      {windows.length > 1 && <p className="forecast-strip-hint">Scroll to view all upcoming regions</p>}
      <div className="forecast-strip-track">
        {windows.length > 0 ? (
          windows.map(({ location, mode, weather }) => {
            const countdown = formatRelativeCountdown(weather);
            return (
              <Link
                key={`${mode}-${location.key}`}
                href={`/map?location=${encodeURIComponent(location.key)}`}
                className={`forecast-pill ${mode === "Now" ? "now" : "next"}`}
                aria-label={formatForecastAriaLabel(activeWeather.name, mode, location, weather)}
              >
                <div className="forecast-pill-header">
                  <Badge variant={mode === "Now" ? "success" : "neutral"} size="sm">
                    {mode}
                  </Badge>
                  <span className="forecast-countdown">{countdown.label}</span>
                </div>
                <strong>{location.name}</strong>
                <small>{formatForecastTime(weather)}</small>
              </Link>
            );
          })
        ) : (
          <div className="forecast-pill empty">
            <Badge variant="neutral" size="sm">Quiet</Badge>
            <strong>No active or upcoming {activeWeather.name} window</strong>
            <small>No matching location forecast in current rotation.</small>
          </div>
        )}
      </div>
    </section>
  );
}
