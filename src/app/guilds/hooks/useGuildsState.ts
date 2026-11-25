"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useProfiles } from "@/lib/profiles";
import { type ConquestData } from "@/lib/conquest";
import {
  compareGuilds,
  formatGuildNumber,
  type GuildDatabase,
  type GuildDetails,
  type GuildRecord,
  type GuildSortKey,
} from "@/lib/guilds";
import {
  CONQUEST_DATA_URL,
  DESKTOP_GUILD_BATCH_SIZE,
  getGuildMemberCap,
  getSearchText,
  GUILD_COMPACT_QUERY,
  GUILD_LIST_URL,
  MOBILE_GUILD_BATCH_SIZE,
  SORT_OPTIONS,
  TIER_FILTERS,
  type EnrichedGuildRecord,
  type GuildConquestZone,
  type GuildViewMode,
  type TierFilter,
  type UseGuildsStateReturn,
} from "../types";

export function useGuildsState(): UseGuildsStateReturn {
  const { activeProfile } = useProfiles();
  const [database, setDatabase] = useState<GuildDatabase | null>(null);
  const [conquestData, setConquestData] = useState<ConquestData | null>(null);
  const [detailsById, setDetailsById] = useState<Map<number, GuildDetails> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [sortBy, setSortBy] = useState<GuildSortKey>("activity");
  const [onlyOpenSlots, setOnlyOpenSlots] = useState(false);
  const [onlyConquest, setOnlyConquest] = useState(false);
  const [viewMode, setViewMode] = useState<GuildViewMode>("table");

  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DESKTOP_GUILD_BATCH_SIZE);
  const [visibleLimit, setVisibleLimit] = useState(DESKTOP_GUILD_BATCH_SIZE);

  const [inspectingGuildId, setInspectingGuildId] = useState<number | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const initialQueryHandled = useRef(false);
  const urlReady = useRef(false);
  const deferredSearch = useDeferredValue(search);

  const guildBatchSize = isCompactViewport ? MOBILE_GUILD_BATCH_SIZE : DESKTOP_GUILD_BATCH_SIZE;
  const showCardLayout = isCompactViewport || viewMode === "cards";
  const showTableLayout = !showCardLayout;

  useEffect(() => {
    let cancelled = false;
    setError(null);

    Promise.all([
      fetch(GUILD_LIST_URL, { cache: "no-cache" }).then((response) => {
        if (!response.ok) throw new Error(`Unable to load guild database (${response.status})`);
        return response.json() as Promise<GuildDatabase>;
      }),
      fetch(CONQUEST_DATA_URL, { cache: "no-cache" })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
    ])
      .then(([guildPayload, rawConquest]) => {
        if (cancelled) return;
        setDatabase(guildPayload);
        setConquestData((rawConquest as ConquestData | null) || null);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Unable to load guild database");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  useEffect(() => {
    const media = window.matchMedia(GUILD_COMPACT_QUERY);
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  // Reset pagination whenever filters change
  useEffect(() => {
    setPage(1);
    setVisibleLimit(guildBatchSize);
  }, [guildBatchSize, pageSize, search, tier, sortBy, onlyOpenSlots, onlyConquest]);

  const conquestByGuildId = useMemo(() => {
    const map = new Map<number, GuildConquestZone[]>();
    if (!conquestData?.zones) return map;

    for (const zone of conquestData.zones) {
      const assaultGuildIds = new Set(
        (zone.active_assaults || [])
          .map((assault) => assault.guild?.id)
          .filter((id): id is number => typeof id === "number" && id > 0),
      );
      const totalZoneExp = Number(zone.experience || 0);

      for (const row of zone.guild_leaderboard || []) {
        const gid = row.guild?.id;
        if (!gid) continue;
        const sharePct =
          totalZoneExp > 0 ? Math.min(100, Math.round((Number(row.experience || 0) / totalZoneExp) * 100)) : 0;
        const entry: GuildConquestZone = {
          zoneKey: zone.key,
          zoneName: zone.name,
          position: row.position ?? null,
          kills: Number(row.kills || 0),
          experience: Number(row.experience || 0),
          sharePct,
          activeAssault: assaultGuildIds.has(gid),
          status: zone.status || null,
        };
        const existing = map.get(gid) || [];
        existing.push(entry);
        map.set(gid, existing);
      }

      // Include guilds with active assault even if not yet placed on zone leaderboard
      for (const gid of assaultGuildIds) {
        const list = map.get(gid) || [];
        if (!list.some((z) => z.zoneKey === zone.key)) {
          list.push({
            zoneKey: zone.key,
            zoneName: zone.name,
            position: null,
            kills: 0,
            experience: 0,
            sharePct: 0,
            activeAssault: true,
            status: zone.status || null,
          });
          map.set(gid, list);
        }
      }
    }

    for (const [gid, entries] of map.entries()) {
      entries.sort((a, b) => (a.position ?? 999) - (b.position ?? 999) || b.experience - a.experience);
      map.set(gid, entries);
    }

    return map;
  }, [conquestData]);

  const guilds = useMemo<EnrichedGuildRecord[]>(() => {
    const profileGuildId = activeProfile?.guild?.id;
    const profileGuildTag = activeProfile?.guild?.tag?.trim().toLowerCase() || "";

    return (database?.guilds || []).map((guild) => {
      const maxMembers = getGuildMemberCap(guild.level);
      const openSlots = Math.max(0, maxMembers - Number(guild.member_count || 0));
      const capacityPct = Math.min(100, Math.round((Number(guild.member_count || 0) / Math.max(1, maxMembers)) * 100));
      const conquestZones = conquestByGuildId.get(guild.id) || [];
      const isMyGuild = Boolean(
        (profileGuildId && guild.id === profileGuildId) ||
          (profileGuildTag && guild.tag && guild.tag.trim().toLowerCase() === profileGuildTag),
      );

      return {
        ...guild,
        searchText: getSearchText(guild),
        maxMembers,
        openSlots,
        capacityPct,
        conquestZones,
        isConquestRuler: conquestZones.length > 0,
        hasActiveAssault: conquestZones.some((zone) => zone.activeAssault),
        isMyGuild,
      };
    });
  }, [activeProfile?.guild?.id, activeProfile?.guild?.tag, conquestByGuildId, database?.guilds]);

  const guildById = useMemo(() => {
    const map = new Map<number, EnrichedGuildRecord>();
    for (const guild of guilds) map.set(guild.id, guild);
    return map;
  }, [guilds]);

  const inspectingGuild = inspectingGuildId !== null ? guildById.get(inspectingGuildId) || null : null;

  const setInspectingGuild = useCallback((guild: EnrichedGuildRecord | null) => {
    setInspectingGuildId(guild ? guild.id : null);
  }, []);

  const filteredGuilds = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const filtered = guilds
      .filter((guild) => tier === "all" || guild.refresh_tier === tier)
      .filter((guild) => !onlyOpenSlots || guild.openSlots > 0)
      .filter((guild) => !onlyConquest || guild.isConquestRuler)
      .filter((guild) => !normalizedSearch || guild.searchText.includes(normalizedSearch));
    return [...filtered].sort((a, b) => compareGuilds(a, b, sortBy));
  }, [deferredSearch, guilds, onlyConquest, onlyOpenSlots, sortBy, tier]);

  const totalPages = Math.max(1, Math.ceil(filteredGuilds.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const visibleGuilds = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredGuilds.slice(start, start + pageSize);
  }, [filteredGuilds, pageSize, safePage]);

  const yourGuild = useMemo(() => guilds.find((guild) => guild.isMyGuild) || null, [guilds]);

  const seasonTopThree = useMemo(
    () =>
      [...guilds]
        .filter((guild) => guild.season_position && guild.season_position > 0)
        .sort((a, b) => compareGuilds(a, b, "season"))
        .slice(0, 3),
    [guilds],
  );

  const openSlotsGuildCount = useMemo(
    () => guilds.filter((guild) => guild.refresh_tier === "hot" && guild.openSlots > 0).length,
    [guilds],
  );
  const conquestGuildCount = useMemo(() => guilds.filter((guild) => guild.isConquestRuler).length, [guilds]);

  const hiddenGuildCount = Math.max(0, filteredGuilds.length - visibleGuilds.length);
  const tierCounts = database?.meta.totals.tiers || { hot: 0, warm: 0, cold: 0 };
  const currentSortLabel = SORT_OPTIONS.find((option) => option.id === sortBy)?.label || SORT_OPTIONS[0].label;
  const hasSearch = search.trim().length > 0;
  const activeFilterCount =
    (hasSearch ? 1 : 0) +
    (tier !== "all" ? 1 : 0) +
    (sortBy !== "activity" ? 1 : 0) +
    (onlyOpenSlots ? 1 : 0) +
    (onlyConquest ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;
  const getTierFilterCount = (filter: TierFilter) => (filter === "all" ? database?.meta.totals.guilds || 0 : tierCounts[filter]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setTier("all");
    setSortBy("activity");
    setOnlyOpenSlots(false);
    setOnlyConquest(false);
  }, []);

  const retryLoad = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  const loadDetails = useCallback(async (guild: GuildRecord) => {
    setInspectingGuildId(guild.id);
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

  // Read initial inbound URL params (?guild, ?search, ?tier, ?sort, ?view, ?open, ?conquest)
  useEffect(() => {
    if (!database || initialQueryHandled.current || typeof window === "undefined") return;
    initialQueryHandled.current = true;

    const params = new URLSearchParams(window.location.search);
    const guildQuery = params.get("guild")?.trim();
    const searchQuery = params.get("search")?.trim();
    const tierParam = params.get("tier")?.trim().toLowerCase() as TierFilter | undefined;
    const sortParam = params.get("sort")?.trim().toLowerCase() as GuildSortKey | undefined;
    const viewParam = params.get("view")?.trim().toLowerCase();

    if (tierParam && TIER_FILTERS.some((f) => f.id === tierParam)) setTier(tierParam);
    if (sortParam && SORT_OPTIONS.some((o) => o.id === sortParam)) setSortBy(sortParam);
    if (viewParam === "cards" || viewParam === "table") setViewMode(viewParam);
    if (params.get("open") === "1") setOnlyOpenSlots(true);
    if (params.get("conquest") === "1") setOnlyConquest(true);

    if (searchQuery) {
      setSearch(searchQuery);
    } else if (guildQuery && !guilds.some((g) => String(g.id) === guildQuery)) {
      setSearch(guildQuery);
    }

    if (guildQuery) {
      const matchingGuild = guilds.find((guild) => String(guild.id) === guildQuery);
      if (matchingGuild) void loadDetails(matchingGuild);
    }

    urlReady.current = true;
  }, [database, guilds, loadDetails]);

  // Keep filter/modal state synced via replaceState (filter hygiene)
  useEffect(() => {
    if (!urlReady.current || typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (inspectingGuildId !== null) params.set("guild", String(inspectingGuildId));
    if (search.trim()) params.set("search", search.trim());
    if (tier !== "all") params.set("tier", tier);
    if (sortBy !== "activity") params.set("sort", sortBy);
    if (viewMode !== "table") params.set("view", viewMode);
    if (onlyOpenSlots) params.set("open", "1");
    if (onlyConquest) params.set("conquest", "1");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [inspectingGuildId, onlyConquest, onlyOpenSlots, search, sortBy, tier, viewMode]);

  return {
    database,
    conquestFetchedAt: conquestData?.meta?.fetched_at || null,
    detailsById,
    detailsLoading,
    error,
    search,
    setSearch,
    tier,
    setTier,
    sortBy,
    setSortBy,
    onlyOpenSlots,
    setOnlyOpenSlots,
    onlyConquest,
    setOnlyConquest,
    viewMode,
    setViewMode,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
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
    yourGuild,
    seasonTopThree,
    openSlotsGuildCount,
    conquestGuildCount,
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
    retryLoad,
    loadDetails,
  };
}
