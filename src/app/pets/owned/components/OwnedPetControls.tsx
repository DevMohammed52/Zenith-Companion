"use client";

import type { Dispatch, SetStateAction } from "react";
import { ArrowDownUp, ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import {
  SORT_OPTIONS,
  SOURCE_FILTERS,
  type SortDirection,
  type SortKey,
  type SourceFilter,
} from "../types";
import styles from "../page.module.css";

export function OwnedPetControls({
  query,
  setQuery,
  sourceFilter,
  setSourceFilter,
  sortKey,
  setSortKey,
  sortDirection,
  setSortDirection,
  controlsModified,
  activeControlCount,
  visibleCount,
  sourceFilterLabel,
  sortLabel,
  isCompactViewport,
  resetControls,
}: {
  query: string;
  setQuery: (val: string) => void;
  sourceFilter: SourceFilter;
  setSourceFilter: (val: SourceFilter) => void;
  sortKey: SortKey;
  setSortKey: (val: SortKey) => void;
  sortDirection: SortDirection;
  setSortDirection: Dispatch<SetStateAction<SortDirection>>;
  controlsModified: boolean;
  activeControlCount: number;
  visibleCount: number;
  sourceFilterLabel: string;
  sortLabel: string;
  isCompactViewport: boolean;
  resetControls: () => void;
}) {
  return (
    <section className={styles.controls} aria-label="Owned pet filters">
      <div className={styles.controlsHeader}>
        <span>
          <SlidersHorizontal size={15} aria-hidden="true" /> Controls
        </span>
        <small>
          {controlsModified
            ? `${activeControlCount} active control${activeControlCount === 1 ? "" : "s"}`
            : `${visibleCount} visible`}
        </small>
        <button
          type="button"
          onClick={resetControls}
          disabled={!controlsModified}
          aria-label="Reset owned pet search, filters, and sorting"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
      </div>
      <label className={styles.searchBox} htmlFor="owned-pet-search">
        <span>Search</span>
        <div>
          <Search size={16} />
          <input
            id="owned-pet-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Species, nickname, quality, source..."
            autoComplete="off"
          />
        </div>
      </label>

      <details className={styles.filterPanel} open={!isCompactViewport ? true : undefined}>
        <summary>
          <span>
            <SlidersHorizontal size={15} aria-hidden="true" /> Source & sort
          </span>
          <small>
            {sourceFilterLabel} / {sortLabel} {sortDirection}
          </small>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className={styles.filterGroups}>
          <div className={styles.controlGroup}>
            <span>Source</span>
            <div className={styles.segment} aria-label="Source filter">
              {SOURCE_FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={sourceFilter === option.id ? styles.activeControl : ""}
                  aria-pressed={sourceFilter === option.id}
                  onClick={() => setSourceFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <span>Sort</span>
            <div className={styles.segment} aria-label="Sort controls">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={sortKey === option.id ? styles.activeControl : ""}
                  aria-pressed={sortKey === option.id}
                  onClick={() => setSortKey(option.id)}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className={styles.directionButton}
                aria-pressed={sortDirection === "desc"}
                aria-label={`Change sort direction, currently ${sortDirection === "asc" ? "ascending" : "descending"}`}
                onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
              >
                <ArrowDownUp size={15} /> {sortDirection === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
