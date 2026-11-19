import { useEffect, useMemo, useState } from "react";
import { useProfiles } from "@/lib/profiles";
import {
  filterMuseumItems,
  museumCategoryLabel,
  sortMuseumItems,
  summarizeMuseum,
} from "@/lib/museum";
import {
  MUSEUM_RESULT_BATCH_SIZE,
  type MuseumCategory,
  type MuseumSortDirection,
  type MuseumSortKey,
} from "../types";
import {
  formatNumber,
  formatPageList,
  formatWarningKey,
  museumEmptyState,
} from "../utils/museum-helpers";

export function useMuseumState() {
  const { activeProfile, loaded } = useProfiles();
  const [category, setCategory] = useState<MuseumCategory | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<MuseumSortKey>("category");
  const [sortDirection, setSortDirection] = useState<MuseumSortDirection>("asc");
  const [visibleLimit, setVisibleLimit] = useState(MUSEUM_RESULT_BATCH_SIZE);

  const museum = activeProfile?.museum;
  const items = useMemo(() => museum?.items || [], [museum]);
  const summaries = useMemo(() => summarizeMuseum(items), [items]);
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const visibleItems = useMemo(() => {
    const filtered = filterMuseumItems({ items, category, query });
    return sortMuseumItems(filtered, sortKey, sortDirection);
  }, [category, items, query, sortDirection, sortKey]);

  useEffect(() => {
    setVisibleLimit(MUSEUM_RESULT_BATCH_SIZE);
  }, [category, items, query, sortDirection, sortKey]);

  useEffect(() => {
    setQuery("");
    setCategory("ALL");
    setSortKey("category");
    setSortDirection("asc");
    setVisibleLimit(MUSEUM_RESULT_BATCH_SIZE);
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
    [summaries]
  );

  const selectedQuantity = visibleItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const displayedItems = visibleItems.slice(0, visibleLimit);
  const hasMoreItems = displayedItems.length < visibleItems.length;

  const hasMuseum = items.length > 0;
  const emptyState = museumEmptyState(museum?.status);
  const EmptyIcon = emptyState.icon;
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
    expectedItemCount && items.length && expectedItemCount !== items.length
  );

  const coverageText = museum?.pagination
    ? `${formatNumber(museum.pagination.fetchedPages.length)} / ${formatNumber(
        museum.pagination.lastPage ||
          museum.pageCount ||
          museum.pagination.fetchedPages.length ||
          0
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
      ? `No museum items match "${query.trim()}"`
      : `No ${museumCategoryLabel(category)} match "${query.trim()}"`;

  const resetControls = () => {
    setQuery("");
    setCategory("ALL");
    setSortKey("category");
    setSortDirection("asc");
  };

  const showMore = () => {
    setVisibleLimit((current) => current + MUSEUM_RESULT_BATCH_SIZE);
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
    hasMoreItems,
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
    EmptyIcon,
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
    showMore,
  };
}
