import type { CSSProperties } from "react";
import {
  getConquestRatio,
  getStatusLabel,
  type ConquestData,
  type ConquestGuild,
  type ConquestGuildRow,
  type ConquestSeasonIndex,
  type ConquestZone,
} from "@/lib/conquest";

export type ZoneFilter = "all" | "active" | "contested" | "dominated";
export type DetailTab = "guilds" | "contributors" | "assaults";

export const FILTERS: Array<{ key: ZoneFilter; label: string }> = [
  { key: "all", label: "All Zones" },
  { key: "active", label: "Active Assaults" },
  { key: "contested", label: "Contested" },
  { key: "dominated", label: "Dominated" },
];

export const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "guilds", label: "Guilds" },
  { key: "contributors", label: "Contributors" },
  { key: "assaults", label: "Assaults" },
];

export function zoneMatchesFilter(zone: ConquestZone, filter: ZoneFilter): boolean {
  if (filter === "active") return zone.active_assaults_count > 0;
  if (filter === "contested") return zone.status === "CONTESTED";
  if (filter === "dominated") return zone.status === "DOMINATED";
  return true;
}

export function getFilterEmptyLabel(filter: ZoneFilter): string {
  if (filter === "active") return "No active assaults in the latest snapshot.";
  if (filter === "contested") return "No contested zones in the latest snapshot.";
  if (filter === "dominated") return "No dominated zones in the latest snapshot.";
  return "No conquest zones matched the current search.";
}

export function zoneMatchesSearch(zone: ConquestZone, query: string): boolean {
  if (!query) return true;
  const haystack = [
    zone.name,
    zone.key,
    getStatusLabel(zone.status),
    ...zone.guild_leaderboard.flatMap((row) => [row.guild?.name, row.guild?.tag]),
    ...zone.top_contributors.flatMap((row) => [row.character?.name, row.guild?.name, row.guild?.tag]),
    ...zone.active_assaults.flatMap((assault) => [assault.guild?.name, assault.guild?.tag]),
  ];
  return haystack.some((value) => String(value || "").toLowerCase().includes(query));
}

export function getZoneStyle(zone: ConquestZone): CSSProperties {
  return {
    "--zone-color": zone.colour || "#8b5cf6",
  } as CSSProperties;
}

export function getDominantGuild(zone: ConquestZone): ConquestGuild | null {
  return zone.guild_leaderboard[0]?.guild ?? null;
}

export function getRunnerUp(zone: ConquestZone): ConquestGuildRow | null {
  return zone.guild_leaderboard[1] ?? null;
}

export function getLeaderShare(zone: ConquestZone): number {
  return getConquestRatio(zone.guild_leaderboard[0]?.experience ?? 0, zone.experience);
}

export function getLeaderMargin(zone: ConquestZone): number | null {
  const leader = zone.guild_leaderboard[0];
  const runnerUp = getRunnerUp(zone);
  if (!leader || !runnerUp) return null;
  return Math.max(0, leader.experience - runnerUp.experience);
}

export function getXpPerKill(zone: ConquestZone): number | null {
  if (!zone.kills) return null;
  return zone.experience / zone.kills;
}

export function getPressureLabel(zone: ConquestZone): string {
  if (zone.active_assaults_count > 0) return "Under attack";
  if (zone.status === "CONTESTED") return "Contested";
  const share = getLeaderShare(zone);
  if (share >= 95) return "Controlled";
  if (share >= 70) return "Leading";
  return "Close race";
}

export function getPressureTone(zone: ConquestZone): "hot" | "warn" | "calm" | "active" {
  if (zone.active_assaults_count > 0) return "hot";
  if (zone.status === "CONTESTED") return "warn";
  if (getLeaderShare(zone) >= 95) return "calm";
  return "active";
}

export type UseConquestStateReturn = {
  data: ConquestData | null;
  error: string | null;
  seasonIndex: ConquestSeasonIndex | null;
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  seasonLoading: boolean;
  isHistoricalSeason: boolean;
  guildLevels: Record<number, number>;
  zoneDescriptions: Record<string, string>;
  selectedZoneKey: string | null;
  setSelectedZoneKey: (key: string | null) => void;
  filter: ZoneFilter;
  setFilter: (filter: ZoneFilter) => void;
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredZones: ConquestZone[];
  selectedZone: ConquestZone | null;
  searchActive: boolean;
  zoneStatus: string;
  seasonLeaders: Array<{ zone: ConquestZone; row: ConquestGuildRow }>;
  activeAssaults: Array<{ zone: ConquestZone; assault: ConquestZone["active_assaults"][number] }>;
};
