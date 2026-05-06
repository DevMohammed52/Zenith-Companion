"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Coins,
  Database,
  ExternalLink,
  Keyboard,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { ThemeName, usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { useData } from "@/context/DataContext";
import { SKILL_TOOLS, ToolSkill } from "@/lib/skill-profit";
import { getSafeMarketPrice, getSafeMarketValue } from "@/lib/market-pricing";
import { barteringBuffPercent, dailyStreakMagicFind, getProfileConquestRank } from "@/lib/profile-calculations";

const themes: { value: ThemeName; label: string; colors: string[] }[] = [
  { value: "ember", label: "Ember", colors: ["#f5b041", "#4ade80", "#f87171"] },
  { value: "forest", label: "Forest", colors: ["#65a30d", "#22c55e", "#38bdf8"] },
  { value: "arcane", label: "Arcane", colors: ["#a78bfa", "#34d399", "#fb7185"] },
  { value: "frost", label: "Frost", colors: ["#38bdf8", "#a7f3d0", "#f472b6"] },
];

function formatAge(value?: string) {
  if (!value) return "Waiting for cache";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "Unknown age";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferences();
  const { activeProfile, state } = useProfiles();
  const { allItemsDb, marketData, staticData } = useData();
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number | "">("");
  const [itemSearchOpen, setItemSearchOpen] = useState(false);

  const itemNames = useMemo(() => Object.keys(allItemsDb || {}).sort((a, b) => a.localeCompare(b)), [allItemsDb]);
  const itemSuggestions = useMemo(() => {
    const query = customItemName.trim().toLowerCase();
    if (!query) return itemNames.slice(0, 8);
    return itemNames.filter((name) => name.toLowerCase().includes(query)).slice(0, 8);
  }, [customItemName, itemNames]);
  const customPriceRows = useMemo(
    () => Object.entries(preferences.customPrices || {}).sort(([a], [b]) => a.localeCompare(b)),
    [preferences.customPrices],
  );

  const marketMeta = marketData?._meta;
  const suspiciousCustomRows = customPriceRows.filter(([name, price]) => {
    const safe = getSafeMarketPrice(marketData?.[name]);
    return safe.value > 0 && Number(price) > safe.value * 5;
  });
  const profileBarteringPercent = barteringBuffPercent(activeProfile?.boosts.barteringLevel ?? 0);
  const profileDailyBonus = dailyStreakMagicFind(activeProfile?.magicFind.dailyStreak ?? 0);
  const profileConquest = getProfileConquestRank(activeProfile);

  const saveCustomPrice = () => {
    const name = customItemName.trim();
    const price = Number(customItemPrice);
    if (!name || !Number.isFinite(price) || price <= 0) return;
    setPreferences({ customPrices: { ...preferences.customPrices, [name]: Math.round(price) } });
    setCustomItemName("");
    setCustomItemPrice("");
    setItemSearchOpen(false);
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
        <div className="settings-panel settings-panel-wide">
          <h2><UserRound size={17} /> Profile Link</h2>
          <p className="settings-panel-note">Profiles own character-specific values. Settings only owns app-wide defaults and price overrides.</p>
          <div className="settings-summary-grid">
            <div className="settings-summary-card">
              <span>Active Profile</span>
              <strong>{activeProfile?.name?.trim() || "Unnamed Character"}</strong>
              <small>{activeProfile ? `${activeProfile.className || "Other"} - ${activeProfile.kind === "main" ? "Main" : "Alt"}` : "Create a profile to power page defaults."}</small>
            </div>
            <div className="settings-summary-card">
              <span>Playtime</span>
              <strong>{Number(activeProfile?.timers.activeHours || 0).toLocaleString()}h/day</strong>
              <small>Used by daily profit and idle-window views.</small>
            </div>
            <div className="settings-summary-card">
              <span>Profiles</span>
              <strong>{state.profiles.length}/5</strong>
              <small>Combat stats, magic find, pets, gear, tools, and timers live there.</small>
            </div>
          </div>
          <div className="settings-scope-grid">
            <div>
              <strong>Global here</strong>
              <span>Membership, theme, custom prices, scraper cache, keyboard shortcuts.</span>
            </div>
            <div>
              <strong>Profile-owned</strong>
              <span>Class, bartering level, conquest, playtime, magic find, pets, gear, tools.</span>
            </div>
            <div>
              <strong>Page-specific</strong>
              <span>Potions, shrine, essence, dungeon filters, boss route choices, search filters.</span>
            </div>
          </div>
          <div className="settings-actions-row">
            <Link className="settings-link-button" href="/profiles">Manage Profiles <ExternalLink size={14} /></Link>
            <span>Profile values are shown here for clarity, but edited from the Profiles page.</span>
          </div>
        </div>

        <div className="settings-panel">
          <h2><Sparkles size={17} /> Account</h2>
          <div className="settings-fields">
            <label className="settings-field">
              <span><strong>Membership</strong><small>Global account setting. Uses 12% market tax where market sales are calculated.</small></span>
              <button type="button" className="control-input settings-toggle-button" onClick={() => setPreferences({ membership: !preferences.membership })}>
                {preferences.membership && <Check size={14} />} {preferences.membership ? "Member active" : "Free account"}
              </button>
            </label>

            <label className="settings-field">
              <span><strong>Skill Class Helper</strong><small>Fallback for older skill-profit calculations until every skill reads profile class data.</small></span>
              <button type="button" className="control-input settings-toggle-button" onClick={() => setPreferences({ skillClassBonus: !preferences.skillClassBonus })}>
                {preferences.skillClassBonus && <Check size={14} />} {preferences.skillClassBonus ? "Class buff active" : "No class buff"}
              </button>
            </label>

          </div>
        </div>

        <div className="settings-panel">
          <h2><Palette size={17} /> Appearance</h2>
          <div className="theme-grid">
            {themes.map((theme) => (
              <button
                type="button"
                key={theme.value}
                className={`theme-option ${preferences.theme === theme.value ? "theme-option-active" : ""}`}
                onClick={() => setPreferences({ theme: theme.value })}
              >
                <span>{theme.label}</span>
                <div className="theme-swatch-row">
                  {theme.colors.map((color) => <i key={color} style={{ background: color }} />)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-panel">
          <h2><UserRound size={17} /> Active Profile Values</h2>
          <div className="profile-settings-readout">
            <div><span>Bartering Level</span><strong>{Number(activeProfile?.boosts.barteringLevel || 0).toLocaleString()}</strong><small>+{profileBarteringPercent}% vendor value</small></div>
            <div><span>Conquest</span><strong>{profileConquest === "none" ? "None" : profileConquest}</strong><small>Used by supported profit views</small></div>
            <div><span>Daily Streak</span><strong>{Number(activeProfile?.magicFind.dailyStreak || 0).toLocaleString()}</strong><small>+{profileDailyBonus}% magic find cap</small></div>
          </div>
          <Link className="settings-link-button settings-profile-edit-link" href="/profiles#profile-magic">Edit Profile Values <ExternalLink size={14} /></Link>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><BarChart3 size={17} /> Fallback Skill Tools</h2>
          <p className="settings-panel-note">These only apply when a page cannot read a tool from the active profile yet. Profile tools remain the preferred source.</p>
          <div className="settings-fields">
            {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => (
              <label className="settings-field" key={skill}>
                <span><strong>{skill} Tool</strong><small>Fallback tool for Skill Profit Finder when no profile tool is selected.</small></span>
                <select
                  className="control-input"
                  value={preferences.skillTools[skill]}
                  onChange={(e) => setPreferences({ skillTools: { ...preferences.skillTools, [skill]: e.target.value } })}
                >
                  {SKILL_TOOLS[skill].map((tool) => (
                    <option key={tool.name} value={tool.name}>{tool.name} (+{tool.efficiency}% eff)</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Coins size={17} /> Custom Item Prices</h2>
          <p className="settings-panel-note">Custom prices override market cache values everywhere. Use whole gold values; suspicious market outliers are filtered before comparison.</p>
          <div className="custom-price-builder">
            <label className="custom-price-item-field">
              <span>Item</span>
              <div className="custom-price-combobox">
                <input
                  className="control-input"
                  placeholder="Search item name"
                  value={customItemName}
                  onBlur={() => window.setTimeout(() => setItemSearchOpen(false), 120)}
                  onChange={(e) => {
                    setCustomItemName(e.target.value);
                    setItemSearchOpen(true);
                  }}
                  onFocus={() => setItemSearchOpen(true)}
                />
                {itemSearchOpen && itemSuggestions.length > 0 && (
                  <div className="custom-price-suggestions">
                    {itemSuggestions.map((name) => {
                      const item = allItemsDb?.[name];
                      return (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setCustomItemName(name);
                            setItemSearchOpen(false);
                          }}
                        >
                          <span>{name}</span>
                          <small>{item?.type ? String(item.type).replace(/_/g, " ") : "Item"}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </label>
            <label className="custom-price-value-field">
              <span>Custom value</span>
              <input
                className="control-input"
                min="0"
                type="number"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Gold each"
              />
            </label>
            <button className="control-input custom-price-add" type="button" onClick={saveCustomPrice}>
              <Plus size={14} /> Add
            </button>
          </div>

          {customPriceRows.length === 0 ? (
            <p className="settings-empty-note">No custom prices yet. Calculators will use safe market, recipe, or vendor values.</p>
          ) : (
            <div className="custom-price-list">
              {customPriceRows.map(([name, price]) => {
                const market = getSafeMarketValue(marketData?.[name]);
                return (
                  <div className="custom-price-row" key={name}>
                    <span>
                      <strong>{name}</strong>
                      <small>{market > 0 ? `Safe market ${market.toLocaleString()}g` : "No safe market price"}</small>
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
          {suspiciousCustomRows.length > 0 && (
            <p className="settings-warning-note">{suspiciousCustomRows.length} custom price override is far above safe market. That may be intentional, but it will override every calculator.</p>
          )}
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Database size={17} /> Data Cache</h2>
          <div className="settings-summary-grid">
            <div className="settings-summary-card">
              <span>Market Cache</span>
              <strong>{Object.keys(marketData || {}).filter((key) => key !== "_meta").length.toLocaleString()}</strong>
              <small>{formatAge(marketMeta?.last_updated)}</small>
            </div>
            <div className="settings-summary-card">
              <span>Item Database</span>
              <strong>{Object.keys(allItemsDb || {}).length.toLocaleString()}</strong>
              <small>Loaded from local app data.</small>
            </div>
            <div className="settings-summary-card">
              <span>Game Entities</span>
              <strong>{((staticData?.enemies?.length || 0) + (staticData?.dungeons?.length || 0) + (staticData?.worldBosses?.length || 0)).toLocaleString()}</strong>
              <small>Enemies, dungeons, and world bosses.</small>
            </div>
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
