"use client";

import { useEffect, useState } from "react";

export type ThemeName = "ember" | "forest" | "arcane" | "frost";

export type Preferences = {
  barteringBoost: number | "";
  activeHours: number | "";
  killsPerHour: number | "";
  theme: ThemeName;
  combatLevel: number | "";
  strStat: number | "";
  dexStat: number | "";
  defStat: number | "";
  combatStyle: string;
};

export const DEFAULT_PREFERENCES: Preferences = {
  barteringBoost: 0,
  activeHours: 18,
  killsPerHour: 360,
  theme: "ember",
  combatLevel: 96,
  strStat: 80,
  dexStat: 80,
  defStat: 80,
  combatStyle: "sword_shield",
};

export const PREFERENCE_STORAGE_KEY = "zenith_preferences";
export const WATCHLIST_STORAGE_KEY = "zenith_watchlist";

const readPreferences = (): Preferences => {
  const next = { ...DEFAULT_PREFERENCES };
  try {
    const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (stored) Object.assign(next, JSON.parse(stored));
  } catch (e) {}
  return next;
};

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
    const handleUpdate = () => {
      const next = readPreferences();
      setPreferencesState(next);
      applyTheme(next.theme);
    };

    const handleStorageUpdate = (e: StorageEvent) => {
        if (e.key === PREFERENCE_STORAGE_KEY) handleUpdate();
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
      localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(next));
      applyTheme(next.theme);
      // Notify other instances of usePreferences in the same tab
      window.dispatchEvent(new Event("zenith-preferences-updated"));
      return next;
    });
  };

  return { preferences, setPreferences, loaded };
}

export function useWatchlist() {
  const [watchlist, setWatchlistState] = useState<string[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
        try {
            const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
            if (stored) setWatchlistState(JSON.parse(stored));
        } catch (e) {}
    };
    handleUpdate();
    window.addEventListener("zenith-watchlist-updated", handleUpdate);
    return () => window.removeEventListener("zenith-watchlist-updated", handleUpdate);
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
