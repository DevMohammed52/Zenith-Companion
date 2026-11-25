import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useItemModal } from "@/context/ItemModalContext";
import { useProfiles } from "@/lib/profiles";
import {
  filterMuseumItems,
  isMuseumCategory,
  museumCategoryLabel,
  sortMuseumItems,
  summarizeMuseum,
} from "@/lib/museum";
import {
  MUSEUM_PAGE_SIZE,
  SORT_OPTIONS,
  type MuseumCategory,
  type MuseumSortDirection,
  type MuseumSortKey,
} from "../types";
import {
  formatNumber,
  formatWarningKey,
  museumEmptyState,
} from "../utils/museum-helpers";

export function useMuseumState() {
  const { activeProfile, loaded } = useProfiles();
  const { openItem, openItemByName } = useItemModal();
  const [category, setCategory] = useState<MuseumCategory | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sortKey, setSortKey] = useState<MuseumSortKey>("category");
  const [sortDirection, setSortDirection] = useState<MuseumSortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MUSEUM_PAGE_SIZE);
  const urlInitializedRef = useRef(false);

  useEffect(() => {
    if (urlInitializedRef.current) return;
    urlInitializedRef.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("cat");
      const qParam = params.get("q");
      const sortParam = params.get("sort") as MuseumSortKey | null;
      const dirParam = params.get("dir") as MuseumSortDirection | null;
      if (catParam && isMuseumCategory(catParam)) setCategory(catParam);
      if (qParam) setQuery(qParam);
      if (sortParam && SORT_OPTIONS.some((o) => o.key === sortParam)) setSortKey(sortParam);
      if (dirParam === "asc" || dirParam === "desc") setSortDirection(dirParam);
    } catch {
      // Ignore malformed URL params
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (category !== "ALL") params.set("cat", category);
      else params.delete("cat");
      if (deferredQuery.trim()) params.set("q", deferredQuery.trim());
      else params.delete("q");
      if (sortKey !== "category") params.set("sort", sortKey);
      else params.delete("sort");
      if (sortDirection !== "asc") params.set("dir", sortDirection);
      else params.delete("dir");
      const qs = params.toString();
      const target = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", target);
    } catch {
      // Ignore history sync errors
    }
  }, [category, deferredQuery, sortKey, sortDirection]);

  const museum = activeProfile?.museum;
  const items = useMemo(() => museum?.items || [], [museum]);
  const summaries = useMemo(() => summarizeMuseum(items), [items]);
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const visibleItems = useMemo(() => {
    const filtered = filterMuseumItems({ items, category, query: deferredQuery });
    return sortMuseumItems(filtered, sortKey, sortDirection);
  }, [category, items, deferredQuery, sortDirection, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [category, items, deferredQuery, sortDirection, sortKey, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [activeProfile?.id]);

  const activeSummary =
    category === "ALL"
      ? { itemCount: items.length, totalQuantity }
      : summaries.find((summary) => summary.category === category) || {
          itemCount: 0,
          totalQuantity: 0,
        };

  const summaryByCategory = useMemo(
    () => new Map(summaries.map((summary) => [summary.category, summary])),
    [summaries],
  );

  const selectedQuantity = visibleItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const displayedItems = visibleItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasMuseum = items.length > 0;
  const emptyState = museumEmptyState(museum?.status);
  const importSource = activeProfile?.importSource;
  const profileSourceTail = importSource?.characterHashTail;
  const sourceTail = museum?.sourceHashTail || profileSourceTail;

  const statusWarnings = [
    ...(museum?.missingOrPrivate || []),
    ...(importSource?.missingOrPrivate || []),
  ];
  const uniqueWarnings = Array.from(new Set(statusWarnings));
  const readableWarnings = uniqueWarnings.map(formatWarningKey);

  const expectedItemCount = museum?.itemCount || museum?.pagination?.total || 0;
  const hasCountMismatch = Boolean(
    expectedItemCount && items.length && expectedItemCount !== items.length,
  );

  const coverageText = museum?.pagination
    ? `${formatNumber(museum.pagination.fetchedPages.length)} / ${formatNumber(
        museum.pagination.lastPage ||
          museum.pageCount ||
          museum.pagination.fetchedPages.length ||
          0,
      )} pages`
    : museum?.pageCount
      ? `${formatNumber(museum.pageCount)} pages`
      : "No page data";

  const hasActiveFilters = Boolean(query.trim()) || category !== "ALL";
  const hasCustomSort = sortKey !== "category" || sortDirection !== "asc";
  const activeControlCount =
    (query.trim() ? 1 : 0) +
    (category !== "ALL" ? 1 : 0) +
    (hasCustomSort ? 1 : 0);

  const noMatchTitle =
    category === "ALL"
      ? `No museum entries match "${query.trim()}"`
      : `No ${museumCategoryLabel(category)} entries match "${query.trim()}"`;

  const resetControls = () => {
    setQuery("");
    setCategory("ALL");
    setSortKey("category");
    setSortDirection("asc");
    setPage(1);
  };

  return {
    activeProfile,
    loaded,
    museum,
    items,
    summaries,
    totalQuantity,
    visibleItems,
    displayedItems,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasMuseum,
    category,
    setCategory,
    query,
    setQuery,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    activeSummary,
    summaryByCategory,
    selectedQuantity,
    emptyState,
    sourceTail,
    uniqueWarnings,
    readableWarnings,
    expectedItemCount,
    hasCountMismatch,
    coverageText,
    hasActiveFilters,
    hasCustomSort,
    activeControlCount,
    noMatchTitle,
    resetControls,
    openCollectible: (id: string, name: string) => {
      if (id && Number.isNaN(Number(id))) {
        openItem(id);
      } else {
        openItemByName(name);
      }
    },
  };
}
