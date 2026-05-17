"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Compass,
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
  Wrench,
  X,
} from "lucide-react";
import { ThemeName, usePreferences } from "@/lib/preferences";
import ZenithIcon from "@/components/icons/ZenithIcon";
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

function ToolPicker({
  skill,
  value,
  open,
  onToggle,
  onChange,
}: {
  skill: ToolSkill;
  value: string;
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const selected = SKILL_TOOLS[skill].find((tool) => tool.name === value) || SKILL_TOOLS[skill][0];
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onToggle();
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle, open]);

  return (
    <div className="settings-tool-picker">
      <button
        type="button"
        ref={triggerRef}
        className={`settings-tool-trigger ${open ? "settings-tool-trigger-open" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`settings-tool-menu-${skill.toLowerCase()}`}
      >
        <span>
          <strong>{skill}</strong>
          <small>{selected.name}</small>
        </span>
        <em>+{selected.efficiency}%</em>
      </button>
      {open && (
        <div className="settings-tool-menu" id={`settings-tool-menu-${skill.toLowerCase()}`} role="listbox" aria-label={`${skill} fallback tool`}>
          {SKILL_TOOLS[skill].map((tool) => (
            <button
              type="button"
              role="option"
              aria-selected={tool.name === value}
              className={tool.name === value ? "settings-tool-option-active" : ""}
              key={tool.name}
              onClick={() => onChange(tool.name)}
            >
              <span>
                <strong>{tool.name}</strong>
                <small>{tool.quality} - Lv. {tool.level}</small>
              </span>
              <em>+{tool.efficiency}%</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { allItemsDb, marketData, staticData } = useData();
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number | "">("");
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [openToolPicker, setOpenToolPicker] = useState<ToolSkill | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const confirmCancelRef = useRef<HTMLButtonElement | null>(null);

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
  const worldBossCount = staticData?.world_bosses?.length || staticData?.worldBosses?.length || 0;
  const entityCount = (staticData?.enemies?.length || 0) + (staticData?.dungeons?.length || 0) + worldBossCount;
  const marketItemCount = Object.keys(marketData || {}).filter((key) => key !== "_meta").length;
  const itemCount = Object.keys(allItemsDb || {}).length;
  const profileLabel = activeProfile
    ? `${activeProfile.kind === "main" ? "Main" : "Alt"} - ${activeProfile.className || "Other"}`
    : "No active profile";

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

  useEffect(() => {
    if (!confirmClearOpen) return;
    window.requestAnimationFrame(() => confirmCancelRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmClearOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmClearOpen]);

  const clearCustomPrices = () => {
    if (customPriceRows.length === 0) return;
    setConfirmClearOpen(true);
  };

  const confirmClearCustomPrices = () => {
    setPreferences({ customPrices: {} });
    setConfirmClearOpen(false);
  };

  return (
    <main className="container settings-page">
      <div className="header settings-header">
        <div>
          <h1 className="header-title">
            <ZenithIcon name="settings" size={24} style={{ color: "var(--text-accent)" }} /> Settings
          </h1>
          <p className="settings-header-copy">App defaults, theme, cache status, and global price overrides.</p>
        </div>
        <Link className="settings-link-button settings-header-action" href="/profiles">
          Manage Profiles <ExternalLink size={14} />
        </Link>
      </div>

      <section className="settings-overview" aria-label="Settings summary">
        <div>
          <span>Market tax</span>
          <strong>{preferences.membership ? "12%" : "15%"}</strong>
        </div>
        <div>
          <span>Active profile</span>
          <strong>{activeProfile?.name?.trim() || "None"}</strong>
        </div>
        <div>
          <span>Market cache</span>
          <strong>{formatAge(marketMeta?.last_updated)}</strong>
        </div>
        <div>
          <span>Custom prices</span>
          <strong>{customPriceRows.length.toLocaleString()}</strong>
        </div>
      </section>

      <section className="settings-grid">
        <div className="settings-primary-column">
          <div className="settings-compact-row">
            <div className="settings-panel">
              <h2><Sparkles size={17} /> Account</h2>
              <div className="settings-fields">
                <label className="settings-field">
                  <span><strong>Membership</strong><small>Switches market tax between 15% and 12%.</small></span>
                  <button
                    type="button"
                    className="control-input settings-toggle-button"
                    aria-pressed={preferences.membership}
                    onClick={() => setPreferences({ membership: !preferences.membership })}
                  >
                    {preferences.membership && <Check size={14} />} {preferences.membership ? "Member active" : "Free account"}
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
              <div className="settings-nav-style" aria-label="Mobile navigation style">
                <span><Compass size={15} /> Mobile navigation</span>
                <div>
                  <button
                    type="button"
                    className={preferences.mobileNavigationStyle !== "command" ? "settings-nav-style-active" : ""}
                    aria-pressed={preferences.mobileNavigationStyle !== "command"}
                    onClick={() => setPreferences({ mobileNavigationStyle: "standard" })}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    className={preferences.mobileNavigationStyle === "command" ? "settings-nav-style-active" : ""}
                    aria-pressed={preferences.mobileNavigationStyle === "command"}
                    onClick={() => setPreferences({ mobileNavigationStyle: "command" })}
                  >
                    Radial menu
                  </button>
                </div>
              </div>
              {preferences.mobileNavigationStyle === "command" && (
                <div className="settings-nav-style" aria-label="Radial menu thumb side">
                  <span><Compass size={15} /> Radial reach</span>
                  <div>
                    <button
                      type="button"
                      className={(preferences.mobileCommandTriggerSide ?? "left") === "left" ? "settings-nav-style-active" : ""}
                      aria-pressed={(preferences.mobileCommandTriggerSide ?? "left") === "left"}
                      onClick={() => setPreferences({ mobileCommandTriggerSide: "left" })}
                    >
                      Left thumb
                    </button>
                    <button
                      type="button"
                      className={preferences.mobileCommandTriggerSide === "right" ? "settings-nav-style-active" : ""}
                      aria-pressed={preferences.mobileCommandTriggerSide === "right"}
                      onClick={() => setPreferences({ mobileCommandTriggerSide: "right" })}
                    >
                      Right thumb
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="settings-panel settings-fallback-panel">
            <h2><Wrench size={17} /> Fallback Tools</h2>
            <div className="settings-fields settings-compat-fields">
              <label className="settings-field">
                <span><strong>Skill Class Helper</strong><small>Used when no active profile class is available.</small></span>
                <button
                  type="button"
                  className="control-input settings-toggle-button"
                  aria-pressed={preferences.skillClassBonus}
                  onClick={() => setPreferences({ skillClassBonus: !preferences.skillClassBonus })}
                >
                  {preferences.skillClassBonus && <Check size={14} />} {preferences.skillClassBonus ? "Class helper active" : "No helper"}
                </button>
              </label>
            </div>
            <div className="settings-tool-grid">
              {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => (
                <ToolPicker
                  key={skill}
                  skill={skill}
                  value={preferences.skillTools[skill]}
                  open={openToolPicker === skill}
                  onToggle={() => setOpenToolPicker((current) => current === skill ? null : skill)}
                  onChange={(value) => {
                    setPreferences({ skillTools: { ...preferences.skillTools, [skill]: value } });
                    setOpenToolPicker(null);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="settings-panel">
          <h2><UserRound size={17} /> Active Profile Values</h2>
          <p className="settings-panel-note">Read-only values from the active profile. Edit character-owned stats from Profiles.</p>
          <div className="settings-active-profile">
            <strong>{activeProfile?.name?.trim() || "No active profile"}</strong>
            <span>{profileLabel}</span>
          </div>
          <div className="profile-settings-readout">
            <div><span>Bartering Level</span><strong>{Number(activeProfile?.boosts.barteringLevel || 0).toLocaleString()}</strong><small>+{profileBarteringPercent}% vendor value</small></div>
            <div><span>Conquest</span><strong>{profileConquest === "none" ? "None" : profileConquest}</strong><small>Used by supported profit views</small></div>
            <div><span>Daily Streak</span><strong>{Number(activeProfile?.magicFind.dailyStreak || 0).toLocaleString()}</strong><small>+{profileDailyBonus}% magic find cap</small></div>
            <div><span>Magic Find</span><strong>{Number(activeProfile?.magicFind.combat || 0)} / {Number(activeProfile?.magicFind.dungeon || 0)} / {Number(activeProfile?.magicFind.worldBoss || 0)}</strong><small>Combat / dungeon / world boss</small></div>
          </div>
          <Link className="settings-link-button settings-profile-edit-link" href="/profiles#profile-magic">Edit Profile Values <ExternalLink size={14} /></Link>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Coins size={17} /> Custom Item Prices</h2>
          <p className="settings-panel-note">Custom prices override market cache values everywhere. Use whole gold values; safe market pricing still filters suspicious market outliers before comparisons.</p>
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
                          aria-label={`${name}, ${item?.type ? String(item.type).replace(/_/g, " ") : "Item"}`}
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
          <div className="settings-actions-row custom-price-actions">
            <span>{customPriceRows.length.toLocaleString()} active override{customPriceRows.length === 1 ? "" : "s"}</span>
            <button type="button" className="settings-link-button settings-danger-link" onClick={clearCustomPrices} disabled={customPriceRows.length === 0}>
              Clear All Overrides
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
              <strong>{marketItemCount.toLocaleString()}</strong>
              <small>{formatAge(marketMeta?.last_updated)}</small>
            </div>
            <div className="settings-summary-card">
              <span>Item Database</span>
              <strong>{itemCount.toLocaleString()}</strong>
              <small>Local app data</small>
            </div>
            <div className="settings-summary-card">
              <span>Game Entities</span>
              <strong>{entityCount.toLocaleString()}</strong>
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
            <div><kbd>Alt</kbd><kbd>4</kbd><span>Combat Planner</span></div>
            <div><kbd>Alt</kbd><kbd>5</kbd><span>Dungeons</span></div>
            <div><kbd>Alt</kbd><kbd>6</kbd><span>World Bosses</span></div>
            <div><kbd>Alt</kbd><kbd>7</kbd><span>BiS Recommender</span></div>
            <div><kbd>Alt</kbd><kbd>8</kbd><span>Crafting Queue</span></div>
            <div><kbd>Alt</kbd><kbd>S</kbd><span>Settings</span></div>
            <div><kbd>Esc</kbd><span>Close search or modal</span></div>
          </div>
        </div>
      </section>

      {confirmClearOpen && (
        <div className="modal-overlay settings-confirm-overlay" role="presentation" onClick={() => setConfirmClearOpen(false)}>
          <div
            className="modal-content settings-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-clear-prices-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="settings-clear-prices-title">Clear Custom Prices</h2>
              <button className="close-btn" type="button" aria-label="Close confirmation" onClick={() => setConfirmClearOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="settings-panel-note">
                Remove all {customPriceRows.length.toLocaleString()} custom price override{customPriceRows.length === 1 ? "" : "s"}?
                Calculators will immediately return to safe market, recipe, or vendor values.
              </p>
              <div className="settings-confirm-actions">
                <button type="button" ref={confirmCancelRef} className="settings-link-button" onClick={() => setConfirmClearOpen(false)} autoFocus>Cancel</button>
                <button type="button" className="settings-link-button settings-danger-link" onClick={confirmClearCustomPrices}>Clear overrides</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
