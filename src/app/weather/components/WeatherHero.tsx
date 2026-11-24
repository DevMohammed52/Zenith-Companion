import React from "react";
import type { WeatherData } from "@/constants/weatherData";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatPercent, getWeatherConcept } from "../types";

export function WeatherHero({ activeWeather }: { activeWeather: WeatherData }) {
  const getBadgeVariant = (val: number | null): BadgeVariant => {
    if (!val) return "neutral";
    return val > 0 ? "success" : "danger";
  };

  return (
    <>
      <Card variant="elevated" className="weather-hero-card">
        <div className="weather-hero">
          <div className="hero-icon-shell" aria-hidden="true">
            <div className="weather-seal" />
            <div className="hero-icon" style={{ color: activeWeather.theme.primary }}>
              <Icon
                name={getWeatherConcept(activeWeather.id)}
                size="xl"
                style={{ width: 64, height: 64 }}
              />
            </div>
          </div>
          <div className="hero-text">
            <h2 style={{ color: activeWeather.theme.primary }}>{activeWeather.name}</h2>
            <p className="description">{activeWeather.description}</p>
          </div>
        </div>
      </Card>

      <div className="impact-grid">
        {activeWeather.id === "magic-storm" ? (
          <Card variant="default" className="mf-card" accent="legendary">
            <div className="card-header">
              <Icon name="weatherMagicStorm" size="md" />
              <h3>Magic Find Bonuses</h3>
            </div>
            <div className="mf-stats">
              <div className="mf-stat">
                <span className="label">Battle MF</span>
                <Badge variant="legendary" size="md">
                  +{activeWeather.magicFind?.battle}%
                </Badge>
              </div>
              <div className="mf-stat">
                <span className="label">Dungeon MF</span>
                <Badge variant="legendary" size="md">
                  +{activeWeather.magicFind?.dungeon}%
                </Badge>
              </div>
              <div className="mf-stat">
                <span className="label">World Boss MF</span>
                <Badge variant="legendary" size="md">
                  +{activeWeather.magicFind?.worldBoss}%
                </Badge>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="default" className="impact-card modifiers">
            <div className="card-header">
              <Icon name="skillProfit" size="md" />
              <h3>Skill Modifiers</h3>
            </div>
            <div className="modifier-list">
              {activeWeather.impacts.map((imp) => (
                <div key={imp.skill} className="modifier-row">
                  <span className="modifier-skill">{imp.skill}</span>
                  <div className="modifier-badges">
                    <Badge variant={getBadgeVariant(imp.efficiency)} size="sm">
                      Eff {formatPercent(imp.efficiency)}
                    </Badge>
                    <Badge variant={getBadgeVariant(imp.experience)} size="sm">
                      XP {formatPercent(imp.experience)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
