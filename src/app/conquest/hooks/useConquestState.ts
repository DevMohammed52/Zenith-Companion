"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatConquestNumber,
  getZoneIntensity,
  type ConquestData,
  type ConquestGuildRow,
  type ConquestZone,
} from "@/lib/conquest";
import {
  getLeaderMargin,
  getLeaderShare,
  getXpPerKill,
  zoneMatchesFilter,
  zoneMatchesSearch,
  type DetailTab,
  type UseConquestStateReturn,
  type ZoneFilter,
} from "../types";

export function useConquestState(): UseConquestStateReturn {
  const [data, setData] = useState<ConquestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<ZoneFilter>("all");
  const [detailTab, setDetailTab] = useState<DetailTab>("guilds");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/conquest-data.json", { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Conquest data returned ${response.status}`);
        return response.json() as Promise<ConquestData>;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        const startingZone =
          payload.zones.find((zone) => zone.active_assaults_count > 0) ??
          [...payload.zones].sort((a, b) => getZoneIntensity(b) - getZoneIntensity(a))[0] ??
          null;
        setSelectedZoneKey(startingZone?.key ?? null);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Unable to load conquest data.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredZones = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return [...(data?.zones ?? [])]
      .filter((zone) => zoneMatchesFilter(zone, filter))
      .filter((zone) => zoneMatchesSearch(zone, query))
      .sort((a, b) => {
        if (b.active_assaults_count !== a.active_assaults_count) {
          return b.active_assaults_count - a.active_assaults_count;
        }
        return getZoneIntensity(b) - getZoneIntensity(a);
      });
  }, [data, filter, searchTerm]);

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
    return (data?.zones ?? []).flatMap((zone) =>
      zone.active_assaults.map((assault) => ({
        zone,
        assault,
      })),
    );
  }, [data]);

  const tightestRace = useMemo(() => {
    return (
      [...(data?.zones ?? [])]
        .filter((zone) => zone.guild_leaderboard.length > 1)
        .sort(
          (a, b) =>
            (getLeaderMargin(a) ?? Number.MAX_SAFE_INTEGER) -
            (getLeaderMargin(b) ?? Number.MAX_SAFE_INTEGER),
        )[0] ?? null
    );
  }, [data]);

  const lockedZones = useMemo(() => {
    return (data?.zones ?? []).filter((zone) => getLeaderShare(zone) >= 95);
  }, [data]);

  const highestYieldZone = useMemo(() => {
    return (
      [...(data?.zones ?? [])].sort(
        (a, b) => (getXpPerKill(b) ?? 0) - (getXpPerKill(a) ?? 0),
      )[0] ?? null
    );
  }, [data]);

  return {
    data,
    error,
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
    tightestRace,
    lockedZones,
    highestYieldZone,
  };
}
