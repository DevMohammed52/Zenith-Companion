"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, DEFAULT_PREFERENCES, PREFERENCE_STORAGE_KEY } from '@/lib/preferences';
import type { WorldLocation } from '@/lib/locations';

type MarketData = Record<string, any>;
type StaticData = Record<string, any>;
type ItemRecord = {
  name?: string;
  vendor_price?: number;
  quality?: string;
  type?: string;
} & Record<string, any>;
type ItemLookup = Record<string, ItemRecord>;
type ScraperStatus = {
  timestamp?: string | number;
  last_updated?: string | number;
  currentItem?: string;
  currentIndex?: string | number;
  totalItems?: string | number;
} & Record<string, unknown>;

type DataContextType = {
  marketData: MarketData | null;
  staticData: StaticData | null;
  allItemsDb: ItemLookup | null;
  worldLocations: WorldLocation[] | null;
  scraperStatus: ScraperStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [staticData, setStaticData] = useState<StaticData | null>(null);
  const [allItemsDb, setAllItemsDb] = useState<ItemLookup | null>(null);
  const [worldLocations, setWorldLocations] = useState<WorldLocation[] | null>(null);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
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
      } catch {
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
      const [marketRes, staticRes, statusRes, itemsRes, worldLocationsRes] = await Promise.all([
        fetch(`/market-data.json?t=${t}`),
        fetch(`/static-data.json?t=${t}`),
        fetch(`/scraper-status.json?t=${t}`),
        fetch(`/all-items-db.json?t=${t}`),
        fetch(`/world-locations.json?t=${t}`)
      ]);

      if (marketRes.ok) setMarketData(await marketRes.json());
      if (staticRes.ok) setStaticData(await staticRes.json());
      if (statusRes.ok) setScraperStatus(await statusRes.json());
      
      if (itemsRes.ok) {
        const data = await itemsRes.json() as ItemLookup;
        const byName: ItemLookup = {};
        Object.values(data).forEach((item) => {
            if (item.name) byName[item.name] = item;
        });
        setAllItemsDb(byName);
      }
      if (worldLocationsRes.ok) {
        const data = await worldLocationsRes.json() as { locations?: WorldLocation[] };
        setWorldLocations(Array.isArray(data.locations) ? data.locations : []);
      }
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
    <DataContext.Provider value={{ marketData, staticData, allItemsDb, worldLocations, scraperStatus, loading, refresh: fetchData }}>
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
