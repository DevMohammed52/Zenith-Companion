"use client";

import { useEffect, useState } from "react";
import { AssaultRank, DEFAULT_TOOL_SELECTIONS, ToolSelections } from "@/lib/skill-profit";

export type ThemeName = "ember" | "forest" | "arcane" | "frost";
export type DesktopNavigationStyle = "sidebar" | "dock";
export type DesktopDockPosition = "bottom" | "left" | "right";
export type MobileNavigationStyle = "standard" | "command";
export type MobileCommandTriggerSide = "left" | "right";

export type Preferences = {
  membership: boolean;
  skillClassBonus: boolean;
  assaultRank: AssaultRank;
  skillTools: ToolSelections;
  customPrices: Record<string, number>;
  barteringBoost: number | "";
  activeHours: number | "";
  killsPerHour: number | "";
  worldBossMagicFind: number | "";
  theme: ThemeName;
  combatLevel: number | "";
  strStat: number | "";
  dexStat: number | "";
  defStat: number | "";
  combatStyle: string;
  desktopNavigationStyle: DesktopNavigationStyle;
  desktopDockPosition: DesktopDockPosition;
  mobileNavigationStyle: MobileNavigationStyle;
  mobileCommandTriggerSide: MobileCommandTriggerSide;
  inAppNotifications: boolean;
  soundEffects: boolean;
  notificationSounds: boolean;
  ambientMusic: boolean;
  audioVolume: number;
  mobileHaptics: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  membership: false,
  skillClassBonus: false,
  assaultRank: "none",
  skillTools: DEFAULT_TOOL_SELECTIONS,
  customPrices: {},
  barteringBoost: 0,
  activeHours: 0,
  killsPerHour: 360,
  worldBossMagicFind: 0,
  theme: "ember",
  combatLevel: 96,
  strStat: 80,
  dexStat: 80,
  defStat: 80,
  combatStyle: "sword_shield",
  desktopNavigationStyle: "sidebar",
  desktopDockPosition: "bottom",
  mobileNavigationStyle: "standard",
  mobileCommandTriggerSide: "left",
  inAppNotifications: true,
  soundEffects: true,
  notificationSounds: true,
  ambientMusic: false,
  audioVolume: 35,
  mobileHaptics: true,
};

export const PREFERENCE_STORAGE_KEY = "zenith_preferences";
export const WATCHLIST_STORAGE_KEY = "zenith_watchlist";

const VALID_THEMES = new Set<ThemeName>(["ember", "forest", "arcane", "frost"]);
const VALID_DESKTOP_NAV_STYLES = new Set<DesktopNavigationStyle>(["sidebar", "dock"]);
const VALID_DESKTOP_DOCK_POSITIONS = new Set<DesktopDockPosition>(["bottom", "left", "right"]);
const VALID_MOBILE_NAV_STYLES = new Set<MobileNavigationStyle>(["standard", "command"]);
const VALID_MOBILE_TRIGGER_SIDES = new Set<MobileCommandTriggerSide>(["left", "right"]);
const VALID_ASSAULT_RANKS = new Set<AssaultRank>([
  "none",
  "first",
  "second",
  "third",
  "fourthSeventh",
  "eighthTenth",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

let cachedPreferences: Preferences | null = null;
let cachedPreferencesRaw: string | null | undefined = undefined;
let lastInvalidatedEvent: Event | null = null;
let hasUnpersistedPreferencesFallback = false;

export function invalidatePreferencesCache(event?: Event) {
  if (!event) {
    lastInvalidatedEvent = null;
    hasUnpersistedPreferencesFallback = false;
    cachedPreferences = null;
    cachedPreferencesRaw = undefined;
    return;
  }
  if (event === lastInvalidatedEvent) return;
  lastInvalidatedEvent = event;
  if (hasUnpersistedPreferencesFallback) return;
  cachedPreferences = null;
  cachedPreferencesRaw = undefined;
}

export const readPreferences = (): Preferences => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
  } catch {
    if (cachedPreferences !== null) return cachedPreferences;
    const fallback: Preferences = {
      ...DEFAULT_PREFERENCES,
      skillTools: { ...DEFAULT_TOOL_SELECTIONS },
      customPrices: {},
    };
    cachedPreferences = fallback;
    return fallback;
  }

  if (cachedPreferences !== null && stored === cachedPreferencesRaw) {
    return cachedPreferences;
  }

  const next: Preferences = {
    ...DEFAULT_PREFERENCES,
    skillTools: { ...DEFAULT_TOOL_SELECTIONS },
    customPrices: {},
  };
  let shouldNormalizeStoredPreferences = false;
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isPlainObject(parsed)) {
        if (
          typeof parsed.desktopNavigationStyle !== "undefined" &&
          !VALID_DESKTOP_NAV_STYLES.has(parsed.desktopNavigationStyle as DesktopNavigationStyle)
        ) {
          shouldNormalizeStoredPreferences = true;
        }
        Object.assign(next, parsed);
        next.theme = VALID_THEMES.has(parsed.theme as ThemeName)
          ? (parsed.theme as ThemeName)
          : DEFAULT_PREFERENCES.theme;
        next.desktopNavigationStyle = VALID_DESKTOP_NAV_STYLES.has(parsed.desktopNavigationStyle as DesktopNavigationStyle)
          ? (parsed.desktopNavigationStyle as DesktopNavigationStyle)
          : DEFAULT_PREFERENCES.desktopNavigationStyle;
        next.desktopDockPosition = VALID_DESKTOP_DOCK_POSITIONS.has(parsed.desktopDockPosition as DesktopDockPosition)
          ? (parsed.desktopDockPosition as DesktopDockPosition)
          : DEFAULT_PREFERENCES.desktopDockPosition;
        next.mobileNavigationStyle = VALID_MOBILE_NAV_STYLES.has(parsed.mobileNavigationStyle as MobileNavigationStyle)
          ? (parsed.mobileNavigationStyle as MobileNavigationStyle)
          : DEFAULT_PREFERENCES.mobileNavigationStyle;
        next.mobileCommandTriggerSide = VALID_MOBILE_TRIGGER_SIDES.has(parsed.mobileCommandTriggerSide as MobileCommandTriggerSide)
          ? (parsed.mobileCommandTriggerSide as MobileCommandTriggerSide)
          : DEFAULT_PREFERENCES.mobileCommandTriggerSide;
        next.assaultRank = VALID_ASSAULT_RANKS.has(parsed.assaultRank as AssaultRank)
          ? (parsed.assaultRank as AssaultRank)
          : DEFAULT_PREFERENCES.assaultRank;
        next.audioVolume = Math.max(0, Math.min(100, Number(parsed.audioVolume ?? DEFAULT_PREFERENCES.audioVolume) || 0));
        next.skillTools = isPlainObject(parsed.skillTools)
          ? {
              Woodcutting: typeof parsed.skillTools.Woodcutting === "string" ? parsed.skillTools.Woodcutting : DEFAULT_TOOL_SELECTIONS.Woodcutting,
              Mining: typeof parsed.skillTools.Mining === "string" ? parsed.skillTools.Mining : DEFAULT_TOOL_SELECTIONS.Mining,
              Fishing: typeof parsed.skillTools.Fishing === "string" ? parsed.skillTools.Fishing : DEFAULT_TOOL_SELECTIONS.Fishing,
            }
          : { ...DEFAULT_TOOL_SELECTIONS };
        if (isPlainObject(parsed.customPrices)) {
          const cleanCustomPrices: Record<string, number> = {};
          for (const [key, value] of Object.entries(parsed.customPrices)) {
            const numericValue = Number(value);
            if (typeof key === "string" && key && Number.isFinite(numericValue) && numericValue >= 0) {
              cleanCustomPrices[key] = numericValue;
            }
          }
          next.customPrices = cleanCustomPrices;
        } else {
          next.customPrices = {};
        }
      }
    } catch {
      // Malformed JSON falls back to DEFAULT_PREFERENCES.
    }
  }
  let finalRaw = stored;
  if (shouldNormalizeStoredPreferences) {
    const serialized = JSON.stringify(next);
    try {
      localStorage.setItem(PREFERENCE_STORAGE_KEY, serialized);
      finalRaw = serialized;
    } catch {}
  }
  hasUnpersistedPreferencesFallback = false;
  cachedPreferences = next;
  cachedPreferencesRaw = finalRaw;
  return next;
};

export function writePreferences(next: Preferences): Preferences {
  cachedPreferences = next;
  try {
    const serialized = JSON.stringify(next);
    localStorage.setItem(PREFERENCE_STORAGE_KEY, serialized);
    cachedPreferencesRaw = serialized;
    hasUnpersistedPreferencesFallback = false;
  } catch {
    try {
      cachedPreferencesRaw = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    } catch {
      cachedPreferencesRaw = undefined;
    }
    hasUnpersistedPreferencesFallback = true;
  }
  applyTheme(next.theme);
  return next;
}

export const getMarketTaxRate = (membership: boolean) => membership ? 0.12 : 0.15;
export const getMarketTaxMultiplier = (membership: boolean) => 1 - getMarketTaxRate(membership);

export const applyTheme = (theme: ThemeName) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
};

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  // Load initial and listen for cross-tab/cross-component updates
  useEffect(() => {
    const handleUpdate = (event?: Event) => {
      if (event) invalidatePreferencesCache(event);
      const next = readPreferences();
      setPreferencesState(next);
      applyTheme(next.theme);
    };

    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === PREFERENCE_STORAGE_KEY || e.key === null) handleUpdate(e);
    };

    handleUpdate(); // Initial load
    setLoaded(true);

    window.addEventListener("zenith-preferences-updated", handleUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener("zenith-preferences-updated", handleUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const setPreferences = (patch: Partial<Preferences>) => {
    setPreferencesState(current => {
      const next = { ...current, ...patch };
      return writePreferences(next);
    });
    window.setTimeout(() => {
      window.dispatchEvent(new Event("zenith-preferences-updated"));
    }, 0);
  };

  return { preferences, setPreferences, loaded };
}

export function useWatchlist() {
  const [watchlist, setWatchlistState] = useState<string[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setWatchlistState(parsed.filter((item): item is string => typeof item === "string"));
          } else {
            setWatchlistState([]);
          }
        } else {
          setWatchlistState([]);
        }
      } catch {
        setWatchlistState([]);
      }
    };
    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === WATCHLIST_STORAGE_KEY || event.key === null) handleUpdate();
    };
    handleUpdate();
    window.addEventListener("zenith-watchlist-updated", handleUpdate);
    window.addEventListener("storage", handleStorageUpdate);
    return () => {
      window.removeEventListener("zenith-watchlist-updated", handleUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const setWatchlist = (next: string[]) => {
    const deduped = Array.from(new Set(next.filter((item): item is string => typeof item === "string"))).sort();
    setWatchlistState(deduped);
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(deduped));
    } catch {}
    window.dispatchEvent(new Event("zenith-watchlist-updated"));
  };

  const toggleWatch = (name: string) => {
    setWatchlist(watchlist.includes(name)
      ? watchlist.filter(item => item !== name)
      : [...watchlist, name]);
  };

  return { watchlist, toggleWatch, setWatchlist };
}
