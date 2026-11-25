import React from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import {
  LEVEL_OPTIONS,
  MATCH_OPTIONS,
  SORT_OPTIONS,
  type MatchFilter,
  type Option,
  type SortKey,
} from "../types";
import styles from "../Enemies.module.css";

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
  hasActiveControls,
  resetControls,
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
    <section className={styles.controls} aria-label="Enemy filters and search">
      <div className={styles.searchControl} role="search">
        <label htmlFor="enemy-search-input" className={styles.controlLabel}>
          Search Enemies
        </label>
        <SearchInput
          id="enemy-search-input"
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder="Search enemy, location, loot, weather..."
          ariaLabel="Search enemies by name, location, drop, or weather"
          showShortcutHint={false}
          className={styles.searchField}
        />
      </div>

      <div className={styles.filterGrid}>
        <div className={styles.filterField}>
          <span id="enemy-location-label" className={styles.controlLabel}>
            Location
          </span>
          <Select
            ariaLabelledBy="enemy-location-label"
            value={selectedLocation}
            options={locationOptions}
            onChange={setSelectedLocation}
          />
        </div>

        <div className={styles.filterField}>
          <span id="enemy-weather-label" className={styles.controlLabel}>
            Weather
          </span>
          <Select
            ariaLabelledBy="enemy-weather-label"
            value={matchFilter}
            options={MATCH_OPTIONS}
            onChange={(val) => setMatchFilter(val as MatchFilter)}
          />
        </div>

        <div className={styles.filterField}>
          <span id="enemy-level-label" className={styles.controlLabel}>
            Level Band
          </span>
          <Select
            ariaLabelledBy="enemy-level-label"
            value={levelFilter}
            options={LEVEL_OPTIONS}
            onChange={setLevelFilter}
          />
        </div>

        <div className={styles.filterField}>
          <span id="enemy-sort-label" className={styles.controlLabel}>
            Sort By
          </span>
          <Select
            ariaLabelledBy="enemy-sort-label"
            value={sortKey}
            options={SORT_OPTIONS}
            onChange={(val) => setSortKey(val as SortKey)}
          />
        </div>

        <div className={styles.filterField}>
          <span className={styles.controlLabel}>Direction</span>
          <Button
            variant="secondary"
            className={styles.sortDirectionButton}
            aria-pressed={sortDesc}
            aria-label={`Sort direction: currently ${sortDesc ? "descending" : "ascending"}. Click to reverse.`}
            icon={<Icon name={sortDesc ? "sortDescAlt" : "sortAscAlt"} size="sm" />}
            onClick={() => setSortDesc((prev) => !prev)}
          >
            {sortDesc ? "Desc" : "Asc"}
          </Button>
        </div>
      </div>

      {hasActiveControls && (
        <div className={styles.activeFiltersStrip} aria-label="Active filters summary">
          <span className={styles.activeFiltersHeading}>Active:</span>
          {query.trim().length > 0 && (
            <Tag
              label={`Search: "${query}"`}
              selected
              onRemove={() => setQuery("")}
              removeAriaLabel={`Remove search filter: ${query}`}
            />
          )}
          {selectedLocation !== "all" && (
            <Tag
              label={selectedLocationObj?.label || selectedLocation}
              selected
              onRemove={() => setSelectedLocation("all")}
              removeAriaLabel={`Remove location filter: ${selectedLocationObj?.label || selectedLocation}`}
            />
          )}
          {matchFilter !== "all" && (
            <Tag
              label={`Weather: ${selectedWeatherObj?.label || matchFilter}`}
              selected
              onRemove={() => setMatchFilter("all")}
              removeAriaLabel={`Remove weather filter: ${selectedWeatherObj?.label || matchFilter}`}
            />
          )}
          {levelFilter !== "all" && (
            <Tag
              label={`Level: ${selectedLevelObj?.label || levelFilter}`}
              selected
              onRemove={() => setLevelFilter("all")}
              removeAriaLabel={`Remove level filter: ${selectedLevelObj?.label || levelFilter}`}
            />
          )}
          {(sortKey !== "level" || sortDesc) && (
            <Tag
              label={`Sort: ${selectedSortObj?.label} (${sortDesc ? "Desc" : "Asc"})`}
              selected
              onRemove={() => {
                setSortKey("level");
                setSortDesc(false);
              }}
              removeAriaLabel="Reset sort order to default level ascending"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetControls}
            icon={<Icon name="undo" size="xs" />}
            aria-label="Clear all active filters"
          >
            Clear all
          </Button>
        </div>
      )}
    </section>
  );
}
