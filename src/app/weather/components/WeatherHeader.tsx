import React from "react";
import Link from "next/link";
import { WEATHER_DATA, type WeatherData } from "@/constants/weatherData";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Icon } from "@/components/ui/Icon";
import { getWeatherConcept } from "../types";
import type { EnrichedLocation, ForecastWeather } from "@/lib/world-intelligence";
import styles from "../Weather.module.css";

export interface WeatherHeaderProps {
  activeWeather: WeatherData;
  setActiveWeather: (weather: WeatherData) => void;
  currentWeatherLocationsCount: number;
  nextWeatherLocationsCount: number;
  favoredPreferenceCount: number;
  penalizedPreferenceCount: number;
  magicStormAlert?: {
    type: "active" | "upcoming";
    location: EnrichedLocation;
    weather: ForecastWeather | null | undefined;
  } | null;
  currentSeason?: {
    name: string;
    months: string;
    note: string;
  } | null;
}

export function WeatherHeader({
  activeWeather,
  setActiveWeather,
  currentWeatherLocationsCount,
  nextWeatherLocationsCount,
  favoredPreferenceCount,
  penalizedPreferenceCount,
  magicStormAlert,
  currentSeason,
}: WeatherHeaderProps) {
  const weatherOptions = WEATHER_DATA.map((w) => ({
    value: w.id,
    label: w.name,
    icon: <Icon name={getWeatherConcept(w.id)} size="sm" />,
  }));

  const handleWeatherChange = (val: string) => {
    const selected = WEATHER_DATA.find((w) => w.id === val);
    if (selected) {
      setActiveWeather(selected);
    }
  };

  return (
    <header className={styles.pageHeader}>
      {magicStormAlert && (
        <div className={styles.stormAlertSlot}>
          <Banner
            variant="announcement"
            title={
              magicStormAlert.type === "active"
                ? `Magic Storm active in ${magicStormAlert.location.name}`
                : `Magic Storm upcoming in ${magicStormAlert.location.name}`
            }
            action={
              <Link
                href={`/map?location=${encodeURIComponent(magicStormAlert.location.key)}`}
                className={styles.stormActionLink}
              >
                View on map
              </Link>
            }
          >
            {magicStormAlert.type === "active"
              ? "+25% Battle MF, +20% Dungeon MF, and +20% World Boss MF currently active."
              : "Prepare your dungeon keys and boss fights before the window begins."}
          </Banner>
        </div>
      )}

      <div className={styles.headerText}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>
            <Icon name="weather" size="sm" /> IdleMMO Weather Index
          </span>
          {currentSeason && (
            <Badge variant="neutral" size="sm" icon={<Icon name="calendar" size="xs" />}>
              {currentSeason.name} ({currentSeason.months})
            </Badge>
          )}
        </div>

        <h1 className={styles.headerTitle}>Weather Guide</h1>
        <p className={styles.headerDesc}>
          Read current and next weather by region, then check skill modifiers and enemy reactions before choosing where to farm.
        </p>

        <div className={styles.snapshotStrip} aria-label={`${activeWeather.name} weather summary`}>
          <div className={styles.snapshotCell}>
            <span className={styles.snapshotLabelRow}>
              <Icon name="timer" size="xs" />
              <span>Active</span>
            </span>
            <strong className={styles.snapshotVal}>{currentWeatherLocationsCount}</strong>
          </div>
          <div className={styles.snapshotCell}>
            <span className={styles.snapshotLabelRow}>
              <Icon name="map" size="xs" />
              <span>Next</span>
            </span>
            <strong className={styles.snapshotVal}>{nextWeatherLocationsCount}</strong>
          </div>
          <div className={`${styles.snapshotCell} ${styles.snapshotGood}`}>
            <span className={styles.snapshotLabelRow}>
              <Icon name="xp" size="xs" />
              <span>Favored</span>
            </span>
            <strong className={styles.snapshotVal}>{favoredPreferenceCount}</strong>
          </div>
          <div className={`${styles.snapshotCell} ${styles.snapshotBad}`}>
            <span className={styles.snapshotLabelRow}>
              <Icon name="combat" size="xs" />
              <span>Penalized</span>
            </span>
            <strong className={styles.snapshotVal}>{penalizedPreferenceCount}</strong>
          </div>
        </div>
      </div>

      <div className={styles.selectorShell}>
        <span className={styles.selectorHeading}>Select weather condition</span>
        <SegmentedControl
          options={weatherOptions}
          value={activeWeather.id}
          onChange={handleWeatherChange}
          ariaLabel="IdleMMO weather types"
        />
      </div>
    </header>
  );
}
