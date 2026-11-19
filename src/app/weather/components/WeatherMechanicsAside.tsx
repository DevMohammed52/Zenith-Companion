import React from "react";
import {
  Calendar,
  Clock,
  Info,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export function WeatherMechanicsAside() {
  return (
    <aside className="mechanics-panel">
      <div className="mechanics-card">
        <div className="card-header">
          <Info size={18} color="var(--text-accent)" />
          <h3>Weather Mechanics</h3>
        </div>
        <div className="mechanics-content">
          <div className="mech-item">
            <MapIcon size={16} />
            <div>
              <h4>Regional Geography</h4>
              <p>Weather isn&apos;t global. It changes depending on where you are, based on the area&apos;s geography and the current season.</p>
            </div>
          </div>
          <div className="mech-item">
            <Calendar size={16} />
            <div>
              <h4>Seasonal Dates</h4>
              <p>Seasons follow real-world northern hemisphere dates. Winter (Dec-Feb) sees heavy snow in places like <strong>Skyreach Peak</strong>, which ease up in summer.</p>
            </div>
          </div>
          <div className="mech-item">
            <TrendingUp size={16} />
            <div>
              <h4>Additive Modifiers</h4>
              <p>Efficiency is additive. You can offset some of the negatives with things like <strong>potions</strong>.</p>
            </div>
          </div>
          <div className="mech-item">
            <Users size={16} />
            <div>
              <h4>Creature Behavior</h4>
              <p>Enemy preferences are mapped from confirmed in-game reactions and are shown below each weather type.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="weather-tip">
        <Sparkles size={16} color="var(--text-accent)" />
        <p>Magic Storms are rare conditions that boost magic find for battles, dungeons, and world bosses.</p>
      </div>

      <div className="confidence-card">
        <div className="confidence-row">
          <ShieldCheck size={16} />
          <span>Known skill modifiers</span>
        </div>
        <div className="confidence-row">
          <Users size={16} />
          <span>Confirmed enemy reactions</span>
        </div>
        <div className="confidence-row">
          <Clock size={16} />
          <span>Forecast windows refresh with game data</span>
        </div>
      </div>
    </aside>
  );
}
