import React from "react";
import {
  ArrowDownUp,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  LEVEL_OPTIONS,
  MATCH_OPTIONS,
  SORT_OPTIONS,
  type MatchFilter,
  type Option,
  type SortKey,
} from "../types";
import { CustomSelect } from "./CustomSelect";

export function EnemiesControls({
  query,
  setQuery,
  selectedLocation,
  setSelectedLocation,
  matchFilter,
  setMatchFilter,
  levelFilter,
  setLevelFilter,
  sortKey,
  setSortKey,
  sortDesc,
  setSortDesc,
  locationOptions,
  activeFilterCount,
  hasCustomSort,
  hasActiveControls,
  resetControls,
  filteredCount,
  isCompactViewport,
}: {
  query: string;
  setQuery: (val: string) => void;
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  matchFilter: MatchFilter;
  setMatchFilter: (val: MatchFilter) => void;
  levelFilter: string;
  setLevelFilter: (val: string) => void;
  sortKey: SortKey;
  setSortKey: (val: SortKey) => void;
  sortDesc: boolean;
  setSortDesc: React.Dispatch<React.SetStateAction<boolean>>;
  locationOptions: Option<string>[];
  activeFilterCount: number;
  hasCustomSort: boolean;
  hasActiveControls: boolean;
  resetControls: () => void;
  filteredCount: number;
  isCompactViewport: boolean;
}) {
  return (
    <section className="enemy-controls" aria-label="Enemy filters">
      <div className="controls-heading">
        <span><SlidersHorizontal size={15} aria-hidden="true" /> Filters</span>
        <small>
          {activeFilterCount > 0
            ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
            : `${filteredCount.toLocaleString()} visible`}
        </small>
        <button
          type="button"
          onClick={resetControls}
          disabled={!hasActiveControls}
          aria-label="Reset enemy filters and sorting"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
      </div>

      <label className="search-control">
        <span>Search</span>
        <div>
          <span className="search-icon" aria-hidden="true">
            <Search size={16} />
          </span>
          <input
            aria-label="Search enemies, locations, drops, or weather"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enemy, location, drop, weather..."
          />
        </div>
      </label>

      <details className="enemy-filter-panel" open={!isCompactViewport ? true : undefined}>
        <summary tabIndex={0}>
          <span><SlidersHorizontal size={15} aria-hidden="true" /> Filters and sort</span>
          <small>{activeFilterCount > 0 || hasCustomSort ? "Customized" : "Default"}</small>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="enemy-filter-grid">
          <CustomSelect
            label="Location"
            value={selectedLocation}
            options={locationOptions}
            onChange={setSelectedLocation}
          />
          <CustomSelect
            label="Weather"
            value={matchFilter}
            options={MATCH_OPTIONS}
            onChange={setMatchFilter}
          />
          <CustomSelect
            label="Level"
            value={levelFilter}
            options={LEVEL_OPTIONS}
            onChange={setLevelFilter}
          />
          <CustomSelect
            label="Sort"
            value={sortKey}
            options={SORT_OPTIONS}
            onChange={setSortKey}
          />
          <button
            type="button"
            className="sort-direction"
            aria-pressed={sortDesc}
            aria-label={`Change sort direction, currently ${sortDesc ? "descending" : "ascending"}`}
            onClick={() => setSortDesc((prev) => !prev)}
          >
            <ArrowDownUp size={16} />
            {sortDesc ? "Desc" : "Asc"}
          </button>
        </div>
      </details>
    </section>
  );
}
