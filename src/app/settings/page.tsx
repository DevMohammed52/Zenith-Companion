"use client";

import { Keyboard, Palette, Settings, Swords, FlaskConical, Target, Shield, Zap } from "lucide-react";
import { ThemeName, usePreferences } from "@/lib/preferences";

const themes: { value: ThemeName; label: string; colors: string[] }[] = [
  { value: "ember", label: "Ember", colors: ["#f5b041", "#4ade80", "#f87171"] },
  { value: "forest", label: "Forest", colors: ["#65a30d", "#22c55e", "#38bdf8"] },
  { value: "arcane", label: "Arcane", colors: ["#a78bfa", "#34d399", "#fb7185"] },
  { value: "frost", label: "Frost", colors: ["#38bdf8", "#a7f3d0", "#f472b6"] },
];

const COMBAT_STYLES = [
    { id: "sword_shield", label: "Sword + Shield", icon: <Shield size={14} /> },
    { id: "dual_daggers", label: "Dual Daggers",   icon: <Zap size={14} /> },
    { id: "bow",          label: "Single Bow",     icon: <Target size={14} /> },
];

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferences();

  const handleNumChange = (key: string, val: string) => {
    setPreferences({ [key]: val === "" ? "" : Number(val) });
  };

  const clamp = (key: string, min: number, max: number) => {
    if (preferences[key as keyof typeof preferences] !== "") {
        setPreferences({ [key]: Math.max(min, Math.min(max, Number(preferences[key as keyof typeof preferences]))) });
    }
  };

  return (
    <main className="container settings-page">
      <div className="header">
        <h1 className="header-title">
          <Settings size={24} color="var(--text-accent)" /> SETTINGS
        </h1>
      </div>

      <section className="settings-grid">
        {/* Character & Combat Stats */}
        <div className="settings-panel">
          <h2><Swords size={17} /> Character Stats</h2>
          <div className="settings-fields">
            <label className="settings-field">
              <span>
                <strong>Combat Level</strong>
                <small>Combat tier (60-96).</small>
              </span>
              <input
                type="number"
                className="control-input"
                value={preferences.combatLevel}
                onChange={e => handleNumChange('combatLevel', e.target.value)}
                onBlur={() => clamp('combatLevel', 60, 96)}
              />
            </label>

            <label className="settings-field">
              <span><strong>Strength (STR)</strong><small>Cap: 100.</small></span>
              <input type="number" className="control-input" value={preferences.strStat} onChange={e => handleNumChange('strStat', e.target.value)} onBlur={() => clamp('strStat', 0, 100)} />
            </label>

            <label className="settings-field">
              <span><strong>Dexterity (DEX)</strong><small>Cap: 100.</small></span>
              <input type="number" className="number control-input" value={preferences.dexStat} onChange={e => handleNumChange('dexStat', e.target.value)} onBlur={() => clamp('dexStat', 0, 100)} />
            </label>

            <label className="settings-field">
              <span><strong>Defence (DEF)</strong><small>Cap: 100.</small></span>
              <input type="number" className="control-input" value={preferences.defStat} onChange={e => handleNumChange('defStat', e.target.value)} onBlur={() => clamp('defStat', 0, 100)} />
            </label>

            <label className="settings-field">
              <span><strong>Kills Per Hour</strong><small>Used for combat profit.</small></span>
              <input type="number" className="control-input" value={preferences.killsPerHour} onChange={e => handleNumChange('killsPerHour', e.target.value)} />
            </label>
          </div>
        </div>

        {/* Skill Boosts */}
        <div className="settings-panel">
          <h2><FlaskConical size={17} /> Skill Analytics</h2>
          <div className="settings-fields">
            <label className="settings-field">
              <span><strong>Bartering Boost %</strong><small>Vendor bonus.</small></span>
              <input type="number" className="control-input" min="0" max="20" value={preferences.barteringBoost} onChange={e => handleNumChange('barteringBoost', e.target.value)} onBlur={() => clamp('barteringBoost', 0, 20)} />
            </label>

            <label className="settings-field">
              <span><strong>Active Hours</strong><small>Daily time window.</small></span>
              <input type="number" className="control-input" min="0" max="24" step="0.5" value={preferences.activeHours} onChange={e => handleNumChange('activeHours', e.target.value)} onBlur={() => clamp('activeHours', 0, 24)} />
            </label>

            <div className="settings-field" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ marginBottom: '0.75rem' }}>
                    <strong>Default Combat Style</strong>
                    <small>Active weapon configuration.</small>
                </span>
                <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                    {COMBAT_STYLES.map(s => (
                        <button key={s.id} onClick={() => setPreferences({ combatStyle: s.id })} style={{
                            flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-subtle)',
                            background: preferences.combatStyle === s.id ? 'var(--text-accent)' : 'var(--bg-card)',
                            color: preferences.combatStyle === s.id ? '#000' : 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                        }}>
                            {s.icon} {s.label.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <div className="settings-panel">
          <h2><Palette size={17} /> Appearance</h2>
          <div className="theme-grid">
            {themes.map(theme => (
              <button
                type="button"
                key={theme.value}
                className={`theme-option ${preferences.theme === theme.value ? "theme-option-active" : ""}`}
                onClick={() => setPreferences({ theme: theme.value })}
              >
                <span>{theme.label}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {theme.colors.map(color => <i key={color} style={{ display: 'block', width: '10px', height: '10px', borderRadius: '2px', background: color }} />)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Keyboard size={17} /> Keyboard Shortcuts</h2>
          <div className="shortcut-grid">
            <div><kbd>Ctrl</kbd><kbd>K</kbd><span>Global Search</span></div>
            <div><kbd>Alt</kbd><kbd>1</kbd><span>Dashboard</span></div>
            <div><kbd>Alt</kbd><kbd>2</kbd><span>Alchemy Profit</span></div>
            <div><kbd>Alt</kbd><kbd>3</kbd><span>Items Database</span></div>
            <div><kbd>Alt</kbd><kbd>4</kbd><span>Combat Simulation</span></div>
            <div><kbd>Alt</kbd><kbd>5</kbd><span>Dungeons</span></div>
            <div><kbd>Alt</kbd><kbd>6</kbd><span>World Bosses</span></div>
            <div><kbd>Alt</kbd><kbd>7</kbd><span>BiS Recommender</span></div>
            <div><kbd>Alt</kbd><kbd>8</kbd><span>Crafting Queue</span></div>
            <div><kbd>Alt</kbd><kbd>S</kbd><span>Settings</span></div>
            <div><kbd>Esc</kbd><span>Close search or modal</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
