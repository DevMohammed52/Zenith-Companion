"use client";

import { useEffect, useState } from "react";

export type ThemeName = "ember" | "forest" | "arcane" | "frost";

export type Preferences = {
  barteringBoost: number;
  activeHours: number;
  killsPerHour: number;
  showEventBosses: boolean;
  showEventDungeons: boolean;
  theme: ThemeName;
};

export const DEFAULT_PREFERENCES: Preferences = {
  barteringBoost: 0,
  activeHours: 18,
  killsPerHour: 360,
  showEventBosses: true,
  showEventDungeons: true,
  theme: "ember",
};

export const PREFERENCE_STORAGE_KEY = "zenith_preferences";
export const WATCHLIST_STORAGE_KEY = "zenith_watchlist";

const legacyBoolean = (value: string | null, fallback: boolean) => {
  if (value === null) return fallback;
  return value === "true";
};

const readPreferences = (): Preferences => {
  const next = { ...DEFAULT_PREFERENCES };

  try {
    const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (stored) Object.assign(next, JSON.parse(stored));

    const legacyBartering = localStorage.getItem("zenith_bartering");
    const legacyActiveHours = localStorage.getItem("zenith_activeHours");
    const legacyKph = localStorage.getItem("zenith_kph");
    const legacyEvents = localStorage.getItem("zenith_show_events");

    if (!stored && legacyBartering !== null) next.barteringBoost = Number(legacyBartering) || 0;
    if (!stored && legacyActiveHours !== null) next.activeHours = Number(legacyActiveHours) || 18;
    if (!stored && legacyKph !== null) next.killsPerHour = Number(legacyKph) || 360;
    if (!stored && legacyEvents !== null) {
      next.showEventBosses = legacyBoolean(legacyEvents, true);
      next.showEventDungeons = legacyBoolean(legacyEvents, true);
    }
  } catch (e) {}

  next.barteringBoost = Math.min(20, Math.max(0, Number(next.barteringBoost) || 0));
  next.activeHours = Math.min(24, Math.max(0, Number(next.activeHours) || 0));
  next.killsPerHour = Math.max(0, Number(next.killsPerHour) || 0);
  return next;
};

export const applyTheme = (theme: ThemeName) => {
  document.documentElement.dataset.theme = theme;
};

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const next = readPreferences();
    setPreferencesState(next);
    applyTheme(next.theme);
    setLoaded(true);
  }, []);

  const setPreferences = (patch: Partial<Preferences>) => {
    setPreferencesState(current => {
      const next = { ...current, ...patch };
      localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem("zenith_bartering", String(next.barteringBoost));
      localStorage.setItem("zenith_activeHours", String(next.activeHours));
      localStorage.setItem("zenith_kph", String(next.killsPerHour));
      localStorage.setItem("zenith_show_events", String(next.showEventBosses || next.showEventDungeons));
      applyTheme(next.theme);
      window.dispatchEvent(new Event("zenith-preferences-updated"));
      return next;
    });
  };

  return { preferences, setPreferences, loaded };
}

export function useWatchlist() {
  const [watchlist, setWatchlistState] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) setWatchlistState(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const setWatchlist = (next: string[]) => {
    const deduped = Array.from(new Set(next)).sort();
    setWatchlistState(deduped);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(deduped));
    window.dispatchEvent(new Event("zenith-watchlist-updated"));
  };

  const toggleWatch = (name: string) => {
    setWatchlist(watchlist.includes(name)
      ? watchlist.filter(item => item !== name)
      : [...watchlist, name]);
  };

  return { watchlist, toggleWatch, setWatchlist };
}
