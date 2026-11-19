import React from "react";
import { TrendingUp, Trophy } from "lucide-react";
import type { WeatherData } from "@/constants/weatherData";
import { formatPercent, getWeatherIcon, modifierTone } from "../types";

export function WeatherHero({ activeWeather }: { activeWeather: WeatherData }) {
  return (
    <>
      <div className="weather-hero">
        <div className="hero-icon-shell" aria-hidden="true">
          <div className="weather-seal" />
          <div className="hero-icon" style={{ color: activeWeather.theme.primary }}>
            {getWeatherIcon(activeWeather.theme.icon, 80)}
          </div>
        </div>
        <div className="hero-text">
          <h2 style={{ color: activeWeather.theme.primary }}>{activeWeather.name}</h2>
          <p className="description">{activeWeather.description}</p>
        </div>
      </div>

      <div className="impact-grid">
        {activeWeather.id === "magic-storm" ? (
          <div className="mf-card">
            <div className="card-header">
              <Trophy size={18} />
              <h3>Magic Find Bonuses</h3>
            </div>
            <div className="mf-stats">
              <div className="mf-stat">
                <span className="label">Battle MF</span>
                <span className="value">+{activeWeather.magicFind?.battle}%</span>
              </div>
              <div className="mf-stat">
                <span className="label">Dungeon MF</span>
                <span className="value">+{activeWeather.magicFind?.dungeon}%</span>
              </div>
              <div className="mf-stat">
                <span className="label">World Boss MF</span>
                <span className="value">+{activeWeather.magicFind?.worldBoss}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="impact-card modifiers">
            <div className="card-header">
              <TrendingUp size={18} />
              <h3>Skill Modifiers</h3>
            </div>
            <div className="modifier-list">
              {activeWeather.impacts.map((imp) => (
                <div key={imp.skill} className="modifier-row">
                  <span className="modifier-skill">{imp.skill}</span>
                  <span className={`modifier-chip ${modifierTone(imp.efficiency)}`}>
                    <span>Eff</span>
                    <strong>{formatPercent(imp.efficiency)}</strong>
                  </span>
                  <span className={`modifier-chip ${modifierTone(imp.experience)}`}>
                    <span>XP</span>
                    <strong>{formatPercent(imp.experience)}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
