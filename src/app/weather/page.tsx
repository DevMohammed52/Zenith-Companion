"use client";

import React from "react";
import { useWeatherState } from "./hooks/useWeatherState";
import { WeatherCanvas } from "./components/WeatherCanvas";
import { WeatherHeader } from "./components/WeatherHeader";
import { WeatherHero } from "./components/WeatherHero";
import { ForecastTimelineStrip } from "./components/ForecastTimelineStrip";
import { ForecastContext } from "./components/ForecastContext";
import { CurrentEnemyContext } from "./components/CurrentEnemyContext";
import { EnemyPreferences } from "./components/EnemyPreferences";
import { WeatherMechanicsAside } from "./components/WeatherMechanicsAside";
import { WeatherStyles } from "./components/WeatherStyles";

export default function WeatherPage() {
  const state = useWeatherState();

  return (
    <main className="weather-container" style={state.weatherAccent}>
      <WeatherCanvas weatherId={state.activeWeather.id} />

      <div className="content-wrapper">
        <WeatherHeader
          activeWeather={state.activeWeather}
          setActiveWeather={state.setActiveWeather}
          currentWeatherLocationsCount={state.currentWeatherLocations.length}
          nextWeatherLocationsCount={state.nextWeatherLocations.length}
          favoredPreferenceCount={state.favoredPreferenceCount}
          penalizedPreferenceCount={state.penalizedPreferenceCount}
        />

        <div className="main-grid">
          <section className="active-info-panel">
            <WeatherHero activeWeather={state.activeWeather} />

            <ForecastTimelineStrip
              activeWeather={state.activeWeather}
              currentLocations={state.currentWeatherLocations}
              nextLocations={state.nextWeatherLocations}
            />

            <div className="weather-live-grid">
              <ForecastContext
                activeWeather={state.activeWeather}
                currentLocations={state.currentWeatherLocations}
                nextLocations={state.nextWeatherLocations}
                locationWeatherCounts={state.locationWeatherCounts}
              />
              <CurrentEnemyContext
                activeWeather={state.activeWeather}
                favoredEnemies={state.currentWeatherEnemyContext.favored}
                penalizedEnemies={state.currentWeatherEnemyContext.penalized}
              />
            </div>

            <EnemyPreferences
              weatherName={state.activeWeather.name}
              enemies={state.activeWeatherEnemies}
            />
          </section>

          <WeatherMechanicsAside />
        </div>
      </div>

      <WeatherStyles />
    </main>
  );
}
