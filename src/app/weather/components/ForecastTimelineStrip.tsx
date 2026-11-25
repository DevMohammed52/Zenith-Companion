import React from "react";
import Link from "next/link";
import type { WeatherData } from "@/constants/weatherData";
import type { EnrichedLocation } from "@/lib/world-intelligence";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatForecastAriaLabel, formatForecastTime, formatRelativeCountdown } from "../types";
import styles from "../Weather.module.css";

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
    <section className={styles.forecastStrip} aria-label={`${activeWeather.name} forecast timeline`}>
      <div className={styles.forecastStripLabel}>
        <Icon name="timer" size="sm" />
        <span>{activeWeather.name} windows</span>
      </div>
      {windows.length > 1 && <p className={styles.forecastStripHint}>Scroll to view all upcoming regions</p>}
      <div className={styles.forecastStripTrack}>
        {windows.length > 0 ? (
          windows.map(({ location, mode, weather }) => {
            const countdown = formatRelativeCountdown(weather);
            return (
              <Link
                key={`${mode}-${location.key}`}
                href={`/map?location=${encodeURIComponent(location.key)}`}
                className={styles.forecastPill}
                aria-label={formatForecastAriaLabel(activeWeather.name, mode, location, weather)}
              >
                <div className={styles.forecastPillHeader}>
                  <Badge variant={mode === "Now" ? "success" : "neutral"} size="sm">
                    {mode}
                  </Badge>
                  <span className={styles.forecastCountdown}>{countdown.label}</span>
                </div>
                <strong className={styles.forecastPillName}>{location.name}</strong>
                <small className={styles.forecastPillTime}>{formatForecastTime(weather)}</small>
              </Link>
            );
          })
        ) : (
          <div className={`${styles.forecastPill} ${styles.forecastPillEmpty}`}>
            <Badge variant="neutral" size="sm">Quiet</Badge>
            <strong className={styles.forecastPillName}>No active or upcoming {activeWeather.name} window</strong>
            <small className={styles.forecastPillTime}>No matching location forecast in current rotation.</small>
          </div>
        )}
      </div>
    </section>
  );
}
