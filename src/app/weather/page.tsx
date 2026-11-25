"use client";

import React from "react";
import { BackToTop } from "@/components/ui/BackToTop";
import { useWeatherState } from "./hooks/useWeatherState";
import { WeatherCanvas } from "./components/WeatherCanvas";
import { WeatherHeader } from "./components/WeatherHeader";
import { WeatherHero } from "./components/WeatherHero";
import { ForecastTimelineStrip } from "./components/ForecastTimelineStrip";
import { ForecastContext } from "./components/ForecastContext";
import { CurrentEnemyContext } from "./components/CurrentEnemyContext";
import { EnemyPreferences } from "./components/EnemyPreferences";
import { WeatherMechanicsAside } from "./components/WeatherMechanicsAside";
import styles from "./Weather.module.css";

export default function WeatherPage() {
  const state = useWeatherState();

  return (
    <main className={styles.page} style={state.weatherAccent}>
      <WeatherCanvas weatherId={state.activeWeather.id} />

      <div className={styles.contentWrapper}>
        <WeatherHeader
          activeWeather={state.activeWeather}
          setActiveWeather={state.setActiveWeather}
          currentWeatherLocationsCount={state.currentWeatherLocations.length}
          nextWeatherLocationsCount={state.nextWeatherLocations.length}
          favoredPreferenceCount={state.favoredPreferenceCount}
          penalizedPreferenceCount={state.penalizedPreferenceCount}
          magicStormAlert={state.magicStormAlert}
          currentSeason={state.currentSeason}
        />

        <div className={styles.mainGrid}>
          <section className={styles.activeInfoPanel}>
            <WeatherHero activeWeather={state.activeWeather} />

            <ForecastTimelineStrip
              activeWeather={state.activeWeather}
              currentLocations={state.currentWeatherLocations}
              nextLocations={state.nextWeatherLocations}
            />

            <div className={styles.liveGrid}>
              <ForecastContext
                activeWeather={state.activeWeather}
                currentLocations={state.currentWeatherLocations}
                nextLocations={state.nextWeatherLocations}
                locationWeatherCounts={state.locationWeatherCounts}
              />
              <CurrentEnemyContext
                activeWeather={state.activeWeather}
                favoredEnemies={state.displayedCurrentEnemyContext.favored}
                penalizedEnemies={state.displayedCurrentEnemyContext.penalized}
                characterCombatLevel={state.filterByLevel ? state.characterCombatLevel : null}
              />
            </div>

            <EnemyPreferences
              weatherName={state.activeWeather.name}
              enemies={state.displayedActiveWeatherEnemies}
              characterCombatLevel={state.characterCombatLevel}
              filterByLevel={state.filterByLevel}
              onToggleLevelFilter={state.setFilterByLevel}
            />
          </section>

          <WeatherMechanicsAside />
        </div>
      </div>

      <BackToTop label="Scroll back to top of weather guide" />
    </main>
  );
}
