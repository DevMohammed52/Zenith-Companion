"use client";

import { Keyboard, Palette, Settings, SlidersHorizontal, ToggleLeft } from "lucide-react";
import { ThemeName, usePreferences } from "@/lib/preferences";

const themes: { value: ThemeName; label: string; colors: string[] }[] = [
  { value: "ember", label: "Ember", colors: ["#f5b041", "#4ade80", "#f87171"] },
  { value: "forest", label: "Forest", colors: ["#65a30d", "#22c55e", "#38bdf8"] },
  { value: "arcane", label: "Arcane", colors: ["#a78bfa", "#34d399", "#fb7185"] },
  { value: "frost", label: "Frost", colors: ["#38bdf8", "#a7f3d0", "#f472b6"] },
];

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferences();

  return (
    <main className="container settings-page">
      <div className="header">
        <h1 className="header-title">
          <Settings size={24} color="var(--text-accent)" /> SETTINGS
        </h1>
      </div>

      <section className="settings-grid">
        <div className="settings-panel">
          <h2><SlidersHorizontal size={17} /> Calculation Defaults</h2>
          <div className="settings-fields">
            <label className="settings-field">
              <span>
                <strong>Bartering Boost</strong>
                <small>Used by alchemy vendor calculations.</small>
              </span>
              <input
                type="number"
                className="control-input"
                min="0"
                max="20"
                value={preferences.barteringBoost}
                onChange={event => setPreferences({ barteringBoost: Math.min(20, Math.max(0, Number(event.target.value) || 0)) })}
              />
            </label>

            <label className="settings-field">
              <span>
                <strong>Active Hours</strong>
                <small>Used by daily alchemy profit estimates.</small>
              </span>
              <input
                type="number"
                className="control-input"
                min="0"
                max="24"
                step="0.5"
                value={preferences.activeHours}
                onChange={event => setPreferences({ activeHours: Math.min(24, Math.max(0, Number(event.target.value) || 0)) })}
              />
            </label>

            <label className="settings-field">
              <span>
                <strong>Kills Per Hour</strong>
                <small>Used by combat gold per hour estimates.</small>
              </span>
              <input
                type="number"
                className="control-input"
                min="0"
                value={preferences.killsPerHour}
                onChange={event => setPreferences({ killsPerHour: Math.max(0, Number(event.target.value) || 0) })}
              />
            </label>
          </div>
        </div>

        <div className="settings-panel">
          <h2><ToggleLeft size={17} /> Event Content</h2>
          <div className="settings-fields">
            <label className="toggle-row">
              <span>
                <strong>Event Bosses</strong>
                <small>Include temporary bosses in boss EV tables.</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.showEventBosses}
                onChange={event => setPreferences({ showEventBosses: event.target.checked })}
              />
            </label>

            <label className="toggle-row">
              <span>
                <strong>Event Dungeons</strong>
                <small>Include temporary dungeons in dungeon EV tables.</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.showEventDungeons}
                onChange={event => setPreferences({ showEventDungeons: event.target.checked })}
              />
            </label>
          </div>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Palette size={17} /> Theme</h2>
          <div className="theme-grid">
            {themes.map(theme => (
              <button
                type="button"
                key={theme.value}
                className={`theme-option ${preferences.theme === theme.value ? "theme-option-active" : ""}`}
                onClick={() => setPreferences({ theme: theme.value })}
              >
                <span>{theme.label}</span>
                <div>
                  {theme.colors.map(color => <i key={color} style={{ background: color }} />)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Keyboard size={17} /> Keyboard Shortcuts</h2>
          <div className="shortcut-grid">
            <div><kbd>Ctrl</kbd><kbd>K</kbd><span>Open global search</span></div>
            <div><kbd>Alt</kbd><kbd>1</kbd><span>Dashboard</span></div>
            <div><kbd>Alt</kbd><kbd>2</kbd><span>Alchemy</span></div>
            <div><kbd>Alt</kbd><kbd>3</kbd><span>Market Items</span></div>
            <div><kbd>Alt</kbd><kbd>4</kbd><span>Combat</span></div>
            <div><kbd>Alt</kbd><kbd>5</kbd><span>Dungeons</span></div>
            <div><kbd>Alt</kbd><kbd>6</kbd><span>World Bosses</span></div>
            <div><kbd>Alt</kbd><kbd>S</kbd><span>Settings</span></div>
            <div><kbd>Esc</kbd><span>Close search or modal</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
