import type {
  GuildDatabase,
  GuildDetails,
  GuildRecord,
  GuildRefreshTier,
  GuildSortKey,
} from "@/lib/guilds";

export type TierFilter = "all" | GuildRefreshTier;
export type GuildViewMode = "table" | "cards";
export type SearchableGuildRecord = GuildRecord & { searchText: string };

export type GuildConquestZone = {
  zoneKey: string;
  zoneName: string;
  position: number | null;
  kills: number;
  experience: number;
  sharePct: number;
  activeAssault: boolean;
  status: string | null;
};

export type EnrichedGuildRecord = SearchableGuildRecord & {
  maxMembers: number;
  openSlots: number;
  capacityPct: number;
  conquestZones: GuildConquestZone[];
  isConquestRuler: boolean;
  hasActiveAssault: boolean;
  isMyGuild: boolean;
};

export type GuildCacheMode = "shown" | "all";
export type GuildCacheProgress = {
  cached: number;
  failed: number;
  total: number;
};

export const DESKTOP_GUILD_BATCH_SIZE = 24;
export const MOBILE_GUILD_BATCH_SIZE = 18;
export const GUILD_PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
export const GUILD_COMPACT_QUERY = "(max-width: 900px)";
export const GUILD_LIST_URL = "/guild-list.json";
export const CONQUEST_DATA_URL = "/conquest-data.json";
export const GUILD_DETAILS_CACHE_MESSAGE = "ZENITH_CACHE_GUILD_DETAILS";
export const GUILD_DETAILS_CACHE_PROGRESS_MESSAGE = "ZENITH_GUILD_DETAILS_CACHE_PROGRESS";
export const GUILD_DETAILS_CACHE_DONE_MESSAGE = "ZENITH_GUILD_DETAILS_CACHE_DONE";
export const GUILD_DETAILS_CACHE_TIMEOUT_MS = 10 * 60 * 1000;

export const SORT_OPTIONS: Array<{ id: GuildSortKey; label: string }> = [
  { id: "activity", label: "Activity" },
  { id: "season", label: "Season rank" },
  { id: "level", label: "Level" },
  { id: "members", label: "Members" },
  { id: "marks", label: "Marks" },
  { id: "name", label: "Name" },
  { id: "id", label: "Guild ID" },
];

export const TIER_FILTERS: Array<{ id: TierFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "hot", label: "Active" },
  { id: "warm", label: "Tracked" },
  { id: "cold", label: "Archive" },
];

/**
 * Member capacity milestones verified from IdleMMO Wiki (guilds/overview.md).
 */
export const GUILD_MEMBER_CAP_TIERS: Array<{ minLevel: number; maxMembers: number }> = [
  { minLevel: 100, maxMembers: 25 },
  { minLevel: 85, maxMembers: 24 },
  { minLevel: 70, maxMembers: 23 },
  { minLevel: 60, maxMembers: 22 },
  { minLevel: 35, maxMembers: 21 },
  { minLevel: 1, maxMembers: 20 },
];

export const GUILD_PROGRESSION_NOTES: Array<{ label: string; detail: string }> = [
  { label: "Season cycle", detail: "60 days; top 25 guilds earn 20 Marks" },
  { label: "Guild Hall unlock", detail: "Requires Guild Lv. 10 (1 free slot included)" },
  { label: "Armoury & Beacon", detail: "Unlocks at Guild Lv. 60 for siege items and discounted teleports" },
  { label: "Conquest assaults", detail: "1 Mark per 1-hour wave; top 10 guilds hold seasonal zone buffs" },
];

export function getGuildMemberCap(level?: number | null): number {
  const numeric = Number(level || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 20;
  for (const tier of GUILD_MEMBER_CAP_TIERS) {
    if (numeric >= tier.minLevel) return tier.maxMembers;
  }
  return 20;
}

export function getSafeExternalHref(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getSearchText(guild: GuildRecord): string {
  return [guild.id, guild.name, guild.tag, ...guild.leader_names, ...guild.top_member_names]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getGuildDetailUrls(guilds: Array<Pick<GuildRecord, "id">>): string[] {
  return [...new Set(guilds.map((guild) => `/guild-details/${guild.id}.json`))];
}

export function readCacheProgress(value: unknown): GuildCacheProgress {
  const progress = (value || {}) as Partial<GuildCacheProgress>;
  return {
    cached: Number(progress.cached) || 0,
    failed: Number(progress.failed) || 0,
    total: Number(progress.total) || 0,
  };
}

export async function requestGuildDetailCache(
  urls: string[],
  onProgress: (progress: GuildCacheProgress) => void,
): Promise<GuildCacheProgress> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Offline cache is not available in this browser.");
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const worker = registration?.active ?? navigator.serviceWorker.controller ?? registration?.waiting ?? registration?.installing;
  if (!worker) {
    throw new Error("Offline cache is not ready yet. Reload after the app finishes installing offline support.");
  }

  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    let settled = false;
    const timeout = window.setTimeout(() => {
      settle(() => reject(new Error("Guild detail offline cache timed out.")));
    }, GUILD_DETAILS_CACHE_TIMEOUT_MS);

    function settle(callback: () => void) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      channel.port1.close();
      callback();
    }

    channel.port1.onmessage = (event) => {
      const payload = event.data as { type?: string; ok?: boolean; error?: string } & Partial<GuildCacheProgress>;

      if (payload?.type === GUILD_DETAILS_CACHE_PROGRESS_MESSAGE) {
        onProgress(readCacheProgress(payload));
        return;
      }

      if (payload?.type === GUILD_DETAILS_CACHE_DONE_MESSAGE) {
        const progress = readCacheProgress(payload);
        if (payload.ok) {
          settle(() => resolve(progress));
        } else {
          settle(() => reject(new Error(payload.error || "Guild detail offline cache failed.")));
        }
      }
    };

    worker.postMessage({ type: GUILD_DETAILS_CACHE_MESSAGE, urls }, [channel.port2]);
  });
}

export type UseGuildsStateReturn = {
  database: GuildDatabase | null;
  conquestFetchedAt: string | null;
  detailsById: Map<number, GuildDetails> | null;
  detailsLoading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  tier: TierFilter;
  setTier: (value: TierFilter) => void;
  sortBy: GuildSortKey;
  setSortBy: (value: GuildSortKey) => void;
  onlyOpenSlots: boolean;
  setOnlyOpenSlots: React.Dispatch<React.SetStateAction<boolean>>;
  onlyConquest: boolean;
  setOnlyConquest: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: GuildViewMode;
  setViewMode: (mode: GuildViewMode) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  isCompactViewport: boolean;
  visibleLimit: number;
  setVisibleLimit: React.Dispatch<React.SetStateAction<number>>;
  inspectingGuild: EnrichedGuildRecord | null;
  setInspectingGuild: (guild: EnrichedGuildRecord | null) => void;
  detailsError: string | null;
  setDetailsError: (error: string | null) => void;
  guildBatchSize: number;
  showCardLayout: boolean;
  showTableLayout: boolean;
  guilds: EnrichedGuildRecord[];
  filteredGuilds: EnrichedGuildRecord[];
  visibleGuilds: EnrichedGuildRecord[];
  yourGuild: EnrichedGuildRecord | null;
  seasonTopThree: EnrichedGuildRecord[];
  openSlotsGuildCount: number;
  conquestGuildCount: number;
  hiddenGuildCount: number;
  tierCounts: Record<GuildRefreshTier, number>;
  currentSortLabel: string;
  hasSearch: boolean;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  selectedDetails: GuildDetails | null;
  resultStatus: string;
  getTierFilterCount: (filter: TierFilter) => number;
  resetFilters: () => void;
  retryLoad: () => void;
  loadDetails: (guild: GuildRecord) => Promise<void>;
};
