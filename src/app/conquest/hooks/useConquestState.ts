"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  formatConquestNumber,
  getZoneIntensity,
  type ConquestData,
  type ConquestGuildRow,
  type ConquestSeasonIndex,
  type ConquestZone,
} from "@/lib/conquest";
import {
  DETAIL_TABS,
  getZoneStyle,
  zoneMatchesFilter,
  zoneMatchesSearch,
  type DetailTab,
  type UseConquestStateReturn,
  type ZoneFilter,
} from "../types";

export function useConquestState(): UseConquestStateReturn {
  const [data, setData] = useState<ConquestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seasonIndex, setSeasonIndex] = useState<ConquestSeasonIndex | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [guildLevels, setGuildLevels] = useState<Record<number, number>>({});
  const [zoneDescriptions, setZoneDescriptions] = useState<Record<string, string>>({});
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<ZoneFilter>("all");
  const [detailTab, setDetailTab] = useState<DetailTab>("guilds");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const seasonCacheRef = useRef<Record<string, ConquestData>>({});
  const urlInitializedRef = useRef(false);

  useEffect(() => {
    if (urlInitializedRef.current) return;
    urlInitializedRef.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const seasonParam = params.get("season");
      const zoneParam = params.get("zone");
      const tabParam = params.get("tab") as DetailTab | null;
      if (seasonParam) setSelectedSeason(seasonParam);
      if (zoneParam) setSelectedZoneKey(zoneParam);
      if (tabParam && DETAIL_TABS.some((t) => t.key === tabParam)) setDetailTab(tabParam);
    } catch {
      // Ignore malformed URL params
    }
  }, []);

  const initialAuxLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const isCurrent =
      selectedSeason === "current" ||
      (seasonIndex?.current_season != null && selectedSeason === String(seasonIndex.current_season));
    const cacheKey = isCurrent ? "current" : selectedSeason;

    if (seasonCacheRef.current[cacheKey]) {
      const cached = seasonCacheRef.current[cacheKey];
      setData(cached);
      setError(null);
      setSeasonLoading(false);
      return;
    }

    const url = isCurrent
      ? "/conquest-data.json"
      : `/conquest-seasons/season-${encodeURIComponent(selectedSeason)}.json`;

    if (data) setSeasonLoading(true);

    const fetchMain = fetch(url, { cache: isCurrent ? "no-cache" : "force-cache" }).then((response) => {
      if (!response.ok) throw new Error(`Conquest data returned ${response.status}`);
      return response.json() as Promise<ConquestData>;
    });

    const fetchAux = !initialAuxLoadedRef.current
      ? Promise.all([
          fetch("/conquest-seasons/index.json", { cache: "no-cache" })
            .then((res) => (res.ok ? (res.json() as Promise<ConquestSeasonIndex>) : null))
            .catch(() => null),
          fetch("/guild-search-index.json", { cache: "force-cache" })
            .then((res) => (res.ok ? (res.json() as Promise<Array<{ id?: number; level?: number }>>) : null))
            .catch(() => null),
          fetch("/world-locations.json", { cache: "force-cache" })
            .then((res) =>
              res.ok ? (res.json() as Promise<{ locations?: Array<{ key?: string; description?: string }> }>) : null,
            )
            .catch(() => null),
        ])
      : Promise.resolve(null);

    Promise.all([fetchMain, fetchAux])
      .then(([payload, aux]) => {
        if (cancelled) return;
        if (aux) {
          initialAuxLoadedRef.current = true;
          const [index, guilds, worldLocs] = aux;
          if (index) setSeasonIndex(index);
          if (Array.isArray(guilds)) {
            const gMap: Record<number, number> = {};
            for (const g of guilds) {
              if (typeof g.id === "number" && typeof g.level === "number") gMap[g.id] = g.level;
            }
            setGuildLevels(gMap);
          }
          if (Array.isArray(worldLocs?.locations)) {
            const dMap: Record<string, string> = {};
            for (const loc of worldLocs.locations) {
              if (loc.key && loc.description) dMap[loc.key] = loc.description;
            }
            setZoneDescriptions(dMap);
          }
        }
        seasonCacheRef.current[cacheKey] = payload;
        setData(payload);
        setError(null);
        setSeasonLoading(false);
        setSelectedZoneKey((prev) => {
          if (prev && payload.zones.some((z) => z.key === prev)) return prev;
          const startingZone =
            payload.zones.find((zone) => zone.active_assaults_count > 0) ??
            [...payload.zones].sort((a, b) => getZoneIntensity(b) - getZoneIntensity(a))[0] ??
            null;
          return startingZone?.key ?? null;
        });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setSeasonLoading(false);
        if (!isCurrent) {
          setSelectedSeason("current");
          return;
        }
        setError(reason instanceof Error ? reason.message : "Unable to load conquest data.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason, seasonIndex?.current_season]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (selectedSeason && selectedSeason !== "current") {
        params.set("season", selectedSeason);
      } else {
        params.delete("season");
      }
      if (selectedZoneKey) {
        params.set("zone", selectedZoneKey);
      } else {
        params.delete("zone");
      }
      if (detailTab !== "guilds") {
        params.set("tab", detailTab);
      } else {
        params.delete("tab");
      }
      const next = params.toString();
      const target = next ? `${window.location.pathname}?${next}` : window.location.pathname;
      window.history.replaceState(null, "", target);
    } catch {
      // Ignore history sync errors
    }
  }, [detailTab, selectedSeason, selectedZoneKey]);

  const isHistoricalSeason = Boolean(
    selectedSeason !== "current" &&
      (seasonIndex?.current_season == null || selectedSeason !== String(seasonIndex.current_season)),
  );

  const filteredZones = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return [...(data?.zones ?? [])]
      .filter((zone) => {
        if (isHistoricalSeason && filter === "active") return false;
        return zoneMatchesFilter(zone, filter);
      })
      .filter((zone) => zoneMatchesSearch(zone, query))
      .sort((a, b) => {
        if (!isHistoricalSeason && b.active_assaults_count !== a.active_assaults_count) {
          return b.active_assaults_count - a.active_assaults_count;
        }
        return getZoneIntensity(b) - getZoneIntensity(a);
      });
  }, [data, filter, deferredSearch, isHistoricalSeason]);

  useEffect(() => {
    if (!data?.zones.length || filteredZones.length === 0) return;
    if (!selectedZoneKey || !filteredZones.some((zone) => zone.key === selectedZoneKey)) {
      setSelectedZoneKey(filteredZones[0].key);
    }
  }, [data, filteredZones, selectedZoneKey]);

  const selectedZone = useMemo(() => {
    if (!data?.zones.length) return null;
    return (
      data.zones.find((zone) => zone.key === selectedZoneKey) ??
      filteredZones[0] ??
      data.zones[0]
    );
  }, [data, filteredZones, selectedZoneKey]);

  const searchActive = searchTerm.trim().length > 0;

  const zoneStatus = data
    ? `${formatConquestNumber(filteredZones.length)} of ${formatConquestNumber(data.zones.length)} conquest zone${filteredZones.length === 1 ? "" : "s"} shown${searchActive ? ` for ${searchTerm.trim()}` : ""}. ${filteredZones.length > 0 ? `${selectedZone?.name ?? "No zone"} selected.` : "No zone selected."}`
    : "Conquest data is loading.";

  const seasonLeaders = useMemo(() => {
    return (data?.zones ?? [])
      .map((zone) => ({ zone, row: zone.guild_leaderboard[0] }))
      .filter(
        (entry): entry is { zone: ConquestZone; row: ConquestGuildRow } =>
          Boolean(entry.row?.guild),
      )
      .sort((a, b) => b.row.experience - a.row.experience);
  }, [data]);

  const activeAssaults = useMemo(() => {
    if (isHistoricalSeason) return [];
    return (data?.zones ?? []).flatMap((zone) =>
      zone.active_assaults.map((assault) => ({
        zone,
        assault,
      })),
    );
  }, [data, isHistoricalSeason]);

  return {
    data,
    error,
    seasonIndex,
    selectedSeason,
    setSelectedSeason,
    seasonLoading,
    isHistoricalSeason,
    guildLevels,
    zoneDescriptions,
    selectedZoneKey,
    setSelectedZoneKey,
    filter,
    setFilter,
    detailTab,
    setDetailTab,
    searchTerm,
    setSearchTerm,
    filteredZones,
    selectedZone,
    searchActive,
    zoneStatus,
    seasonLeaders,
    activeAssaults,
  };
}
void getZoneStyle;
