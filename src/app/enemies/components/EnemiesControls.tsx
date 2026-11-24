import React from "react";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
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
  isCompactViewport?: boolean;
}) {
  const selectedLocationObj = locationOptions.find((opt) => opt.value === selectedLocation);
  const selectedWeatherObj = MATCH_OPTIONS.find((opt) => opt.value === matchFilter);
  const selectedLevelObj = LEVEL_OPTIONS.find((opt) => opt.value === levelFilter);
  const selectedSortObj = SORT_OPTIONS.find((opt) => opt.value === sortKey);

  return (
    <section className="enemy-controls" aria-label="Enemy filters and search">
      <div className="search-control" role="search">
        <label htmlFor="enemy-search-input" className="search-label">
          Search Enemies
        </label>
        <div className="search-input-wrap">
          <span className="search-icon-box" aria-hidden="true">
            <Search size={16} />
          </span>
          <input
            id="enemy-search-input"
            type="search"
            aria-label="Search enemies by name, location, drop, or weather"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search enemy, location, loot, weather..."
            autoComplete="off"
            spellCheck={false}
          />
          {query.length > 0 && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search input"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

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
          label="Level Band"
          value={levelFilter}
          options={LEVEL_OPTIONS}
          onChange={setLevelFilter}
        />
        <CustomSelect
          label="Sort By"
          value={sortKey}
          options={SORT_OPTIONS}
          onChange={setSortKey}
        />
        <div className="sort-direction-wrap">
          <label className="sort-direction-label">Direction</label>
          <button
            type="button"
            className="sort-direction"
            aria-pressed={sortDesc}
            aria-label={`Sort direction: currently ${sortDesc ? "descending" : "ascending"}. Click to reverse.`}
            onClick={() => setSortDesc((prev) => !prev)}
          >
            {sortDesc ? (
              <ArrowDownNarrowWide size={15} aria-hidden="true" />
            ) : (
              <ArrowUpNarrowWide size={15} aria-hidden="true" />
            )}
            <span>{sortDesc ? "Desc" : "Asc"}</span>
          </button>
        </div>
      </div>

      {hasActiveControls && (
        <div className="active-filters-strip" aria-label="Active filters summary">
          <span className="active-filters-heading">Active:</span>
          {query.trim().length > 0 && (
            <button
              type="button"
              className="active-filter-chip"
              onClick={() => setQuery("")}
              aria-label={`Remove search filter: ${query}`}
            >
              <span>Search: "{query}"</span>
              <X size={12} aria-hidden="true" />
            </button>
          )}
          {selectedLocation !== "all" && (
            <button
              type="button"
              className="active-filter-chip"
              onClick={() => setSelectedLocation("all")}
              aria-label={`Remove location filter: ${selectedLocationObj?.label}`}
            >
              <span>{selectedLocationObj?.label || selectedLocation}</span>
              <X size={12} aria-hidden="true" />
            </button>
          )}
          {matchFilter !== "all" && (
            <button
              type="button"
              className="active-filter-chip"
              onClick={() => setMatchFilter("all")}
              aria-label={`Remove weather filter: ${selectedWeatherObj?.label}`}
            >
              <span>Weather: {selectedWeatherObj?.label || matchFilter}</span>
              <X size={12} aria-hidden="true" />
            </button>
          )}
          {levelFilter !== "all" && (
            <button
              type="button"
              className="active-filter-chip"
              onClick={() => setLevelFilter("all")}
              aria-label={`Remove level filter: ${selectedLevelObj?.label}`}
            >
              <span>Level: {selectedLevelObj?.label || levelFilter}</span>
              <X size={12} aria-hidden="true" />
            </button>
          )}
          {(sortKey !== "level" || sortDesc) && (
            <button
              type="button"
              className="active-filter-chip"
              onClick={() => {
                setSortKey("level");
                setSortDesc(false);
              }}
              aria-label="Reset sort order to default level ascending"
            >
              <span>Sort: {selectedSortObj?.label} ({sortDesc ? "Desc" : "Asc"})</span>
              <X size={12} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="clear-all-filters-btn"
            onClick={resetControls}
            aria-label="Clear all active filters"
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Clear all</span>
          </button>
        </div>
      )}
    </section>
  );
}
