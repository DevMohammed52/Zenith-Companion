"use client";

import { useMemo, useState } from "react";
import { BarChart3, Check, Coins, Keyboard, Palette, Plus, Settings, Swords, FlaskConical, Target, Shield, Trash2, Zap } from "lucide-react";
import { ThemeName, usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { ASSAULT_OPTIONS, SKILL_TOOLS, ToolSkill } from "@/lib/skill-profit";

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
  const { allItemsDb, marketData } = useData();
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number | "">("");
  const itemNames = useMemo(() => Object.keys(allItemsDb || {}).sort((a, b) => a.localeCompare(b)), [allItemsDb]);
  const customPriceRows = useMemo(
    () => Object.entries(preferences.customPrices || {}).sort(([a], [b]) => a.localeCompare(b)),
    [preferences.customPrices],
  );

  const handleNumChange = (key: string, val: string) => {
    setPreferences({ [key]: val === "" ? "" : Number(val) });
  };

  const clamp = (key: string, min: number, max: number) => {
    if (preferences[key as keyof typeof preferences] !== "") {
        setPreferences({ [key]: Math.max(min, Math.min(max, Number(preferences[key as keyof typeof preferences]))) });
    }
  };

  const saveCustomPrice = () => {
    const name = customItemName.trim();
    const price = Number(customItemPrice);
    if (!name || !Number.isFinite(price) || price <= 0) return;
    setPreferences({ customPrices: { ...preferences.customPrices, [name]: Math.round(price * 100) / 100 } });
    setCustomItemName("");
    setCustomItemPrice("");
  };

  const removeCustomPrice = (name: string) => {
    const next = { ...preferences.customPrices };
    delete next[name];
    setPreferences({ customPrices: next });
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
              <span><strong>Membership</strong><small>Uses 12% market tax and member skill bonuses.</small></span>
              <button type="button" className="control-input" onClick={() => setPreferences({ membership: !preferences.membership })} style={{ cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                {preferences.membership && <Check size={14} />} {preferences.membership ? "Member active" : "Free account"}
              </button>
            </label>

            <label className="settings-field">
              <span><strong>Class Skill Buff</strong><small>Applies the generic +10% skill class buff where supported.</small></span>
              <button type="button" className="control-input" onClick={() => setPreferences({ skillClassBonus: !preferences.skillClassBonus })} style={{ cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                {preferences.skillClassBonus && <Check size={14} />} {preferences.skillClassBonus ? "Class buff active" : "No class buff"}
              </button>
            </label>

            <label className="settings-field">
              <span><strong>Conquest Buff</strong><small>Default conquest rank for skill profit.</small></span>
              <select className="control-input" value={preferences.assaultRank} onChange={e => setPreferences({ assaultRank: e.target.value as typeof preferences.assaultRank })}>
                {ASSAULT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

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

        <div className="settings-panel settings-panel-wide">
          <h2><BarChart3 size={17} /> Skill Tools</h2>
          <div className="settings-fields">
            {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map(skill => (
              <label className="settings-field" key={skill}>
                <span><strong>{skill} Tool</strong><small>Efficiency tool used by Skill Profit Finder.</small></span>
                <select
                  className="control-input"
                  value={preferences.skillTools[skill]}
                  onChange={e => setPreferences({ skillTools: { ...preferences.skillTools, [skill]: e.target.value } })}
                >
                  {SKILL_TOOLS[skill].map(tool => (
                    <option key={tool.name} value={tool.name}>{tool.name} (+{tool.efficiency}% eff)</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Coins size={17} /> Custom Item Prices</h2>
          <div className="custom-price-builder">
            <label>
              <span>Item</span>
              <input
                className="control-input"
                list="custom-price-items"
                placeholder="Search item name"
                value={customItemName}
                onChange={e => setCustomItemName(e.target.value)}
              />
            </label>
            <label>
              <span>Custom value</span>
              <input
                className="control-input"
                min="0"
                type="number"
                value={customItemPrice}
                onChange={e => setCustomItemPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Gold each"
              />
            </label>
            <button className="control-input custom-price-add" type="button" onClick={saveCustomPrice}>
              <Plus size={14} /> Add
            </button>
            <datalist id="custom-price-items">
              {itemNames.slice(0, 1353).map(name => <option key={name} value={name} />)}
            </datalist>
          </div>

          {customPriceRows.length === 0 ? (
            <p className="settings-empty-note">No custom prices yet. Skill Profit will use market/vendor values until you add one.</p>
          ) : (
            <div className="custom-price-list">
              {customPriceRows.map(([name, price]) => {
                const market = marketData?.[name]?.avg_3 || marketData?.[name]?.price || 0;
                return (
                  <div className="custom-price-row" key={name}>
                    <span>
                      <strong>{name}</strong>
                      <small>{market > 0 ? `Market ${market.toLocaleString()}g` : "No live market price"}</small>
                    </span>
                    <em>{Number(price).toLocaleString()}g</em>
                    <button type="button" onClick={() => removeCustomPrice(name)} aria-label={`Remove ${name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
