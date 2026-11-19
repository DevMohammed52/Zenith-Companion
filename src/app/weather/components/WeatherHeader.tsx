import React, { type CSSProperties } from "react";
import { Clock, MapPin, Sparkles, Swords } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { WEATHER_DATA, type WeatherData } from "@/constants/weatherData";
import { getWeatherIcon } from "../types";

export function WeatherHeader({
  activeWeather,
  setActiveWeather,
  currentWeatherLocationsCount,
  nextWeatherLocationsCount,
  favoredPreferenceCount,
  penalizedPreferenceCount,
}: {
  activeWeather: WeatherData;
  setActiveWeather: (weather: WeatherData) => void;
  currentWeatherLocationsCount: number;
  nextWeatherLocationsCount: number;
  favoredPreferenceCount: number;
  penalizedPreferenceCount: number;
}) {
  return (
    <header className="page-header">
      <div className="header-text">
        <span className="eyebrow"><ZenithIcon name="weather" size={15} /> IdleMMO Weather Index</span>
        <h1>Weather Guide</h1>
        <p>Read current and next weather by region, then check skill modifiers and enemy reactions before choosing where to farm.</p>
        <div className="weather-snapshot-grid" aria-label={`${activeWeather.name} weather summary`}>
          <div className="weather-snapshot-card">
            <Clock size={15} aria-hidden="true" />
            <span data-short="Active">Active windows</span>
            <strong>{currentWeatherLocationsCount}</strong>
          </div>
          <div className="weather-snapshot-card">
            <MapPin size={15} aria-hidden="true" />
            <span data-short="Next">Coming next</span>
            <strong>{nextWeatherLocationsCount}</strong>
          </div>
          <div className="weather-snapshot-card good">
            <Sparkles size={15} aria-hidden="true" />
            <span data-short="Favored">Favored enemies</span>
            <strong>{favoredPreferenceCount}</strong>
          </div>
          <div className="weather-snapshot-card bad">
            <Swords size={15} aria-hidden="true" />
            <span data-short="Penalized">Penalized enemies</span>
            <strong>{penalizedPreferenceCount}</strong>
          </div>
        </div>
      </div>
      <div className="weather-selector-shell">
        <div className="weather-selector" role="group" aria-label="Weather types">
          {WEATHER_DATA.map((w) => (
            <button
              key={w.id}
              onClick={() => setActiveWeather(w)}
              className={`weather-btn ${activeWeather.id === w.id ? "active" : ""}`}
              style={{ "--accent": w.theme.primary } as CSSProperties}
              aria-pressed={activeWeather.id === w.id}
            >
              {getWeatherIcon(w.theme.icon)}
              <span>{w.name}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
