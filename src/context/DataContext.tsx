"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, DEFAULT_PREFERENCES, PREFERENCE_STORAGE_KEY } from '@/lib/preferences';

type DataContextType = {
  marketData: any | null;
  staticData: any | null;
  scraperStatus: any | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [marketData, setMarketData] = useState<any>(null);
  const [staticData, setStaticData] = useState<any>(null);
  const [scraperStatus, setScraperStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and Sync Theme
  useEffect(() => {
    const refreshTheme = () => {
      try {
        const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
        if (stored) {
          const theme = JSON.parse(stored).theme || DEFAULT_PREFERENCES.theme;
          applyTheme(theme);
        } else {
          applyTheme(DEFAULT_PREFERENCES.theme);
        }
      } catch (e) {
        applyTheme(DEFAULT_PREFERENCES.theme);
      }
    };

    refreshTheme(); // Initial load
    window.addEventListener("zenith-preferences-updated", refreshTheme);
    window.addEventListener("storage", refreshTheme); // Sync across tabs
    return () => {
      window.removeEventListener("zenith-preferences-updated", refreshTheme);
      window.removeEventListener("storage", refreshTheme);
    };
  }, []);

  const fetchData = async () => {
    try {
      const t = Date.now();
      const [marketRes, staticRes, statusRes] = await Promise.all([
        fetch(`/market-data.json?t=${t}`),
        fetch(`/static-data.json?t=${t}`),
        fetch(`/scraper-status.json?t=${t}`)
      ]);

      if (marketRes.ok) setMarketData(await marketRes.json());
      if (staticRes.ok) setStaticData(await staticRes.json());
      if (statusRes.ok) setScraperStatus(await statusRes.json());
    } catch (e) {
      console.error("Failed to sync Zenith data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DataContext.Provider value={{ marketData, staticData, scraperStatus, loading, refresh: fetchData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
