"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  ensureLoaded: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [staticData, setStaticData] = useState<StaticData | null>(null);
  const [allItemsDb, setAllItemsDb] = useState<ItemLookup | null>(null);
  const [worldLocations, setWorldLocations] = useState<WorldLocation[] | null>(null);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const loadPromiseRef = useRef<Promise<void> | null>(null);

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

  const fetchJson = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T | null> => {
    try {
      const response = await fetch(url, init);
      if (!response.ok) return null;
      return await response.json() as T;
    } catch (error) {
      console.warn(`Failed to sync ${url}:`, error);
      return null;
    }
  }, []);

  const refreshScraperStatus = useCallback(async () => {
    const status = await fetchJson<ScraperStatus>(`/scraper-status.json?t=${Date.now()}`, { cache: "no-store" });
    if (status) setScraperStatus(status);
  }, [fetchJson]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [market, staticPayload, status, items, worldLocationsPayload] = await Promise.all([
      fetchJson<MarketData>("/market-data.json"),
      fetchJson<StaticData>("/static-data.json"),
      fetchJson<ScraperStatus>(`/scraper-status.json?t=${Date.now()}`, { cache: "no-store" }),
      fetchJson<ItemLookup>("/all-items-db.json"),
      fetchJson<{ locations?: WorldLocation[] }>("/world-locations.json"),
    ]);

    if (market) setMarketData(market);
    if (staticPayload) setStaticData(staticPayload);
    if (status) setScraperStatus(status);

    if (items) {
      const byName: ItemLookup = {};
      Object.values(items).forEach((item) => {
        if (item.name) byName[item.name] = item;
      });
      setAllItemsDb(byName);
    }

    if (worldLocationsPayload) {
      setWorldLocations(Array.isArray(worldLocationsPayload.locations) ? worldLocationsPayload.locations : []);
    }

    setLoading(false);
    setLoaded(true);
  }, [fetchJson]);

  const ensureLoaded = useCallback(() => {
    if (loaded) return Promise.resolve();
    if (!loadPromiseRef.current) {
      loadPromiseRef.current = fetchData().finally(() => {
        loadPromiseRef.current = null;
      });
    }
    return loadPromiseRef.current;
  }, [fetchData, loaded]);

  useEffect(() => {
    // Large generated JSON is CDN/browser-cacheable. Only the tiny scraper
    // status is polled so free-tier bandwidth stays focused on live state.
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshScraperStatus();
    }, 300000);

    return () => clearInterval(interval);
  }, [refreshScraperStatus]);

  const value = useMemo(() => ({
    marketData,
    staticData,
    allItemsDb,
    worldLocations,
    scraperStatus,
    loading,
    refresh: fetchData,
    ensureLoaded,
  }), [allItemsDb, ensureLoaded, fetchData, loading, marketData, scraperStatus, staticData, worldLocations]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  useEffect(() => {
    context.ensureLoaded();
  }, [context]);
  return context;
}
