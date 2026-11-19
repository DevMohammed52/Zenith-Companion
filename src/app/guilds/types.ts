import type {
  GuildDatabase,
  GuildDetails,
  GuildRecord,
  GuildRefreshTier,
  GuildSortKey,
} from "@/lib/guilds";

export type TierFilter = "all" | GuildRefreshTier;
export type SearchableGuildRecord = GuildRecord & { searchText: string };
export type GuildCacheMode = "shown" | "all";
export type GuildCacheProgress = {
  cached: number;
  failed: number;
  total: number;
};

export const DESKTOP_GUILD_BATCH_SIZE = 60;
export const MOBILE_GUILD_BATCH_SIZE = 36;
export const GUILD_COMPACT_QUERY = "(max-width: 900px)";
export const GUILD_LIST_URL = "/guild-list.json";
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
  detailsById: Map<number, GuildDetails> | null;
  detailsLoading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  tier: TierFilter;
  setTier: (value: TierFilter) => void;
  sortBy: GuildSortKey;
  setSortBy: (value: GuildSortKey) => void;
  isCompactViewport: boolean;
  visibleLimit: number;
  setVisibleLimit: React.Dispatch<React.SetStateAction<number>>;
  inspectingGuild: GuildRecord | null;
  setInspectingGuild: (guild: GuildRecord | null) => void;
  detailsError: string | null;
  setDetailsError: (error: string | null) => void;
  guildBatchSize: number;
  showCardLayout: boolean;
  showTableLayout: boolean;
  guilds: SearchableGuildRecord[];
  filteredGuilds: SearchableGuildRecord[];
  visibleGuilds: SearchableGuildRecord[];
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
  loadDetails: (guild: GuildRecord) => Promise<void>;
};
