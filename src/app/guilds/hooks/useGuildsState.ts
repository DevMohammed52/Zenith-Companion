"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  compareGuilds,
  formatGuildNumber,
  type GuildDatabase,
  type GuildDetails,
  type GuildRecord,
  type GuildSortKey,
} from "@/lib/guilds";
import {
  DESKTOP_GUILD_BATCH_SIZE,
  getSearchText,
  GUILD_COMPACT_QUERY,
  GUILD_LIST_URL,
  MOBILE_GUILD_BATCH_SIZE,
  SORT_OPTIONS,
  type SearchableGuildRecord,
  type TierFilter,
  type UseGuildsStateReturn,
} from "../types";

export function useGuildsState(): UseGuildsStateReturn {
  const [database, setDatabase] = useState<GuildDatabase | null>(null);
  const [detailsById, setDetailsById] = useState<Map<number, GuildDetails> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [sortBy, setSortBy] = useState<GuildSortKey>("activity");
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(DESKTOP_GUILD_BATCH_SIZE);
  const [inspectingGuild, setInspectingGuild] = useState<GuildRecord | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const initialQueryHandled = useRef(false);
  const deferredSearch = useDeferredValue(search);
  const guildBatchSize = isCompactViewport ? MOBILE_GUILD_BATCH_SIZE : DESKTOP_GUILD_BATCH_SIZE;
  const showCardLayout = isCompactViewport;
  const showTableLayout = !isCompactViewport;

  useEffect(() => {
    let cancelled = false;
    fetch(GUILD_LIST_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load guild database (${response.status})`);
        return response.json() as Promise<GuildDatabase>;
      })
      .then((payload) => {
        if (!cancelled) setDatabase(payload);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Unable to load guild database");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia(GUILD_COMPACT_QUERY);
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    setVisibleLimit(guildBatchSize);
  }, [guildBatchSize, search, tier, sortBy]);

  const guilds = useMemo<SearchableGuildRecord[]>(
    () => (database?.guilds || []).map((guild) => ({ ...guild, searchText: getSearchText(guild) })),
    [database?.guilds],
  );

  const filteredGuilds = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const filtered = guilds
      .filter((guild) => tier === "all" || guild.refresh_tier === tier)
      .filter((guild) => !normalizedSearch || guild.searchText.includes(normalizedSearch));
    return [...filtered].sort((a, b) => compareGuilds(a, b, sortBy));
  }, [deferredSearch, guilds, sortBy, tier]);

  const visibleGuilds = useMemo(() => filteredGuilds.slice(0, visibleLimit), [filteredGuilds, visibleLimit]);
  const hiddenGuildCount = Math.max(0, filteredGuilds.length - visibleGuilds.length);
  const tierCounts = database?.meta.totals.tiers || { hot: 0, warm: 0, cold: 0 };
  const currentSortLabel = SORT_OPTIONS.find((option) => option.id === sortBy)?.label || SORT_OPTIONS[0].label;
  const hasSearch = search.trim().length > 0;
  const activeFilterCount = (hasSearch ? 1 : 0) + (tier !== "all" ? 1 : 0) + (sortBy !== "activity" ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;
  const getTierFilterCount = (filter: TierFilter) => (filter === "all" ? database?.meta.totals.guilds || 0 : tierCounts[filter]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setTier("all");
    setSortBy("activity");
  }, []);

  const loadDetails = useCallback(async (guild: GuildRecord) => {
    setInspectingGuild(guild);
    setDetailsError(null);
    if (detailsById?.has(guild.id)) return;
    setDetailsLoading(true);
    try {
      const response = await fetch(`/guild-details/${guild.id}.json`);
      if (!response.ok) throw new Error(`Unable to load guild details (${response.status})`);
      const payload = (await response.json()) as GuildDetails;
      setDetailsById((current) => {
        const next = new Map(current || []);
        next.set(guild.id, payload);
        return next;
      });
    } catch (detailsFetchError) {
      setDetailsError(detailsFetchError instanceof Error ? detailsFetchError.message : "Unable to load guild details");
    } finally {
      setDetailsLoading(false);
    }
  }, [detailsById]);

  const selectedDetails = inspectingGuild ? detailsById?.get(inspectingGuild.id) || null : null;
  const resultStatus = database
    ? `${formatGuildNumber(filteredGuilds.length)} guild${filteredGuilds.length === 1 ? "" : "s"} match the current filters.`
    : "Guild database is loading.";

  useEffect(() => {
    if (!database || initialQueryHandled.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const guildQuery = params.get("guild");
    const searchQuery = params.get("search");
    const query = guildQuery || searchQuery;
    if (!query?.trim()) return;

    initialQueryHandled.current = true;
    setSearch(query.trim());

    if (guildQuery) {
      const matchingGuild = guilds.find((guild) => String(guild.id) === guildQuery.trim());
      if (matchingGuild) void loadDetails(matchingGuild);
    }
  }, [database, guilds, loadDetails]);

  return {
    database,
    detailsById,
    detailsLoading,
    error,
    search,
    setSearch,
    tier,
    setTier,
    sortBy,
    setSortBy,
    isCompactViewport,
    visibleLimit,
    setVisibleLimit,
    inspectingGuild,
    setInspectingGuild,
    detailsError,
    setDetailsError,
    guildBatchSize,
    showCardLayout,
    showTableLayout,
    guilds,
    filteredGuilds,
    visibleGuilds,
    hiddenGuildCount,
    tierCounts,
    currentSortLabel,
    hasSearch,
    activeFilterCount,
    hasActiveFilters,
    selectedDetails,
    resultStatus,
    getTierFilterCount,
    resetFilters,
    loadDetails,
  };
}
