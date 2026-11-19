import { ArrowDownUp, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { museumCategoryLabel } from "@/lib/museum";
import {
  MUSEUM_CATEGORIES,
  SORT_OPTIONS,
  type MuseumCategory,
  type MuseumCategorySummary,
  type MuseumSortDirection,
  type MuseumSortKey,
} from "../types";
import { formatNumber } from "../utils/museum-helpers";
import styles from "../page.module.css";

export function MuseumControls({
  query,
  setQuery,
  category,
  setCategory,
  sortKey,
  setSortKey,
  sortDirection,
  setSortDirection,
  itemsCount,
  visibleItemsCount,
  displayedItemsCount,
  selectedQuantity,
  summaryByCategory,
  activeControlCount,
  hasActiveFilters,
  hasCustomSort,
  resetControls,
}: {
  query: string;
  setQuery: (q: string) => void;
  category: MuseumCategory | "ALL";
  setCategory: (c: MuseumCategory | "ALL") => void;
  sortKey: MuseumSortKey;
  setSortKey: (k: MuseumSortKey) => void;
  sortDirection: MuseumSortDirection;
  setSortDirection: React.Dispatch<React.SetStateAction<MuseumSortDirection>>;
  itemsCount: number;
  visibleItemsCount: number;
  displayedItemsCount: number;
  selectedQuantity: number;
  summaryByCategory: Map<MuseumCategory, MuseumCategorySummary>;
  activeControlCount: number;
  hasActiveFilters: boolean;
  hasCustomSort: boolean;
  resetControls: () => void;
}) {
  return (
    <>
      <section className={styles.museumControls} aria-label="Museum filters">
        <div className={styles.museumControlsHead}>
          <span>
            <SlidersHorizontal size={16} aria-hidden="true" /> Collection controls
          </span>
          <strong>{activeControlCount ? `${activeControlCount} active` : "Default view"}</strong>
        </div>

        <div className={styles.museumSearch}>
          <label htmlFor="museum-search-input">Search</label>
          <div className={styles.museumSearchInputWrap}>
            <Search size={16} aria-hidden="true" />
            <input
              id="museum-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, category, or ID..."
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className={styles.museumSearchClear}
                onClick={() => setQuery("")}
                aria-label="Clear museum search"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className={styles.museumSegment} role="group" aria-label="Category filter">
          <button
            type="button"
            className={category === "ALL" ? styles.active : ""}
            aria-pressed={category === "ALL"}
            onClick={() => setCategory("ALL")}
          >
            <span>All</span>
            <small>{formatNumber(itemsCount)}</small>
          </button>
          {MUSEUM_CATEGORIES.map((option) => (
            <button
              key={option}
              type="button"
              className={category === option ? styles.active : ""}
              aria-pressed={category === option}
              onClick={() => setCategory(option)}
            >
              <span>{museumCategoryLabel(option)}</span>
              <small>
                {formatNumber(summaryByCategory.get(option)?.itemCount || 0)}
              </small>
            </button>
          ))}
        </div>

        <div className={styles.museumSort} role="group" aria-label="Sort controls">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={sortKey === option.key ? styles.active : ""}
              aria-pressed={sortKey === option.key}
              onClick={() => setSortKey(option.key)}
              aria-label={`Sort museum items by ${option.label}`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.museumSortDirection}
            onClick={() =>
              setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
            }
            aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
            aria-pressed={sortDirection === "desc"}
          >
            <ArrowDownUp size={15} aria-hidden="true" />
            {sortDirection === "asc" ? "Asc" : "Desc"}
          </button>
        </div>

        <div className={styles.museumControlStatus}>
          <div>
            <span>Showing</span>
            <strong>
              {formatNumber(displayedItemsCount)} of {formatNumber(visibleItemsCount)}
            </strong>
          </div>
          <div>
            <span>Quantity</span>
            <strong>{formatNumber(selectedQuantity)}</strong>
          </div>
          <button
            type="button"
            className={styles.museumReset}
            onClick={resetControls}
            disabled={!activeControlCount}
            aria-label="Reset museum filters and sort"
          >
            <RotateCcw size={15} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      {(hasActiveFilters || hasCustomSort) && (
        <section
          className={styles.museumFilterChips}
          aria-label="Active museum filters"
        >
          {query.trim() && <span>Search: {query.trim()}</span>}
          {category !== "ALL" && (
            <span>Category: {museumCategoryLabel(category)}</span>
          )}
          {hasCustomSort && (
            <span>
              Sort:{" "}
              {SORT_OPTIONS.find((option) => option.key === sortKey)?.label}{" "}
              {sortDirection}
            </span>
          )}
          <button type="button" onClick={resetControls}>
            Clear all
          </button>
        </section>
      )}
    </>
  );
}
