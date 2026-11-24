import React from "react";
import Link from "next/link";
import { WEATHER_DATA, type WeatherData } from "@/constants/weatherData";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Icon } from "@/components/ui/Icon";
import { getWeatherConcept } from "../types";
import type { EnrichedLocation, ForecastWeather } from "@/lib/world-intelligence";

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
    <header className="page-header">
      {magicStormAlert && (
        <div className="weather-storm-alert-slot">
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
                className="weather-storm-action-link"
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

      <div className="header-text">
        <div className="header-eyebrow-row">
          <span className="eyebrow">
            <Icon name="weather" size="sm" /> IdleMMO Weather Index
          </span>
          {currentSeason && (
            <Badge variant="neutral" size="sm" icon={<Icon name="calendar" size="xs" />}>
              {currentSeason.name} ({currentSeason.months})
            </Badge>
          )}
        </div>

        <h1>Weather Guide</h1>
        <p>
          Read current and next weather by region, then check skill modifiers and enemy reactions before choosing where to farm.
        </p>

        <div className="weather-snapshot-grid" aria-label={`${activeWeather.name} weather summary`}>
          <div className="weather-snapshot-card">
            <Icon name="timer" size="sm" />
            <span data-short="Active">Active windows</span>
            <strong>{currentWeatherLocationsCount}</strong>
          </div>
          <div className="weather-snapshot-card">
            <Icon name="map" size="sm" />
            <span data-short="Next">Coming next</span>
            <strong>{nextWeatherLocationsCount}</strong>
          </div>
          <div className="weather-snapshot-card good">
            <Icon name="xp" size="sm" />
            <span data-short="Favored">Favored enemies</span>
            <strong>{favoredPreferenceCount}</strong>
          </div>
          <div className="weather-snapshot-card bad">
            <Icon name="combat" size="sm" />
            <span data-short="Penalized">Penalized enemies</span>
            <strong>{penalizedPreferenceCount}</strong>
          </div>
        </div>
      </div>

      <div className="weather-selector-shell">
        <span className="weather-selector-heading">Select weather condition:</span>
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
