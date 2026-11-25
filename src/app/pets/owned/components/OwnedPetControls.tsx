"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import {
  MAX_COMPARE_SELECTION,
  SORT_OPTIONS,
  SOURCE_FILTERS,
  type OwnedTab,
  type OwnedViewMode,
  type SortDirection,
  type SortKey,
  type SourceFilter,
} from "../types";
import styles from "../page.module.css";

export function OwnedPetControls({
  activeTab,
  setActiveTab,
  ownedCount,
  missingCount,
  viewMode,
  setViewMode,
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
  selectedCompareCount,
  compareSelectionHref,
  onClearCompareSelection,
  resetControls,
}: {
  activeTab: OwnedTab;
  setActiveTab: (val: OwnedTab) => void;
  ownedCount: number;
  missingCount: number;
  viewMode: OwnedViewMode;
  setViewMode: (val: OwnedViewMode) => void;
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
  selectedCompareCount: number;
  compareSelectionHref: string;
  onClearCompareSelection: () => void;
  resetControls: () => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <section className={styles.panel} aria-label="Owned pet controls">
      <div className={styles.toolbarHeaderRow}>
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as OwnedTab)}
          options={[
            { value: "owned", label: `Your Pets (${ownedCount})` },
            { value: "missing", label: `Missing Pets (${missingCount})` },
          ]}
          ariaLabel="Pet collection view"
        />

        <div className={styles.toolbarRight}>
          <SegmentedControl
            value={viewMode}
            onChange={(val) => setViewMode(val as OwnedViewMode)}
            options={[
              { value: "cards", label: "Cards" },
              { value: "table", label: "Table" },
            ]}
            ariaLabel="Layout view mode"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetControls}
            disabled={!controlsModified}
            icon={<Icon name="undo" size="sm" aria-hidden="true" />}
            aria-label="Reset owned pet search, filters, and sorting"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder={
            activeTab === "owned"
              ? "Search species, nickname, quality, location..."
              : "Search missing pets by name, boss, or quality..."
          }
          ariaLabel={activeTab === "owned" ? "Search owned pets" : "Search missing pets"}
          showShortcutHint={false}
        />
      </div>

      {activeTab === "owned" && (
        <div className={styles.accordionWrap} data-open={filtersOpen ? "true" : "false"}>
          <button
            type="button"
            className={styles.accordionTrigger}
            aria-expanded={filtersOpen}
            aria-controls="owned-pet-filter-accordion"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <span className={styles.accordionSummary}>
              <Icon name="filter" size="sm" aria-hidden="true" />
              <strong>Source &amp; Sort</strong>
              <span className={styles.accordionPreview}>
                {sourceFilterLabel} / {sortLabel} ({sortDirection === "asc" ? "Asc" : "Desc"})
                {controlsModified ? ` · ${activeControlCount} active` : ` · ${visibleCount} shown`}
              </span>
            </span>
            <span className={styles.accordionChevron} aria-hidden="true">
              <Icon name="chevronDown" size="md" />
            </span>
          </button>

          <div
            id="owned-pet-filter-accordion"
            className={styles.accordionCollapse}
            data-open={filtersOpen ? "true" : "false"}
            aria-hidden={!filtersOpen}
            inert={!filtersOpen}
          >
            <div className={styles.accordionInner}>
              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <span className={styles.controlLabel}>Source</span>
                  <SegmentedControl
                    value={sourceFilter}
                    onChange={(val) => setSourceFilter(val as SourceFilter)}
                    options={SOURCE_FILTERS.map((opt) => ({
                      value: opt.id,
                      label: opt.label,
                    }))}
                    ariaLabel="Source filter"
                  />
                </div>

                <div className={styles.sortControls}>
                  <div className={styles.sortSelectWrap}>
                    <Select
                      ariaLabel="Sort by"
                      value={sortKey}
                      onChange={(val) => setSortKey(val as SortKey)}
                      options={SORT_OPTIONS.map((opt) => ({
                        value: opt.id,
                        label: opt.label,
                      }))}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                    aria-pressed={sortDirection === "desc"}
                    aria-label={`Change sort direction, currently ${sortDirection === "asc" ? "ascending" : "descending"}`}
                    icon={
                      <Icon
                        name={sortDirection === "asc" ? "sortAsc" : "sortDesc"}
                        size="sm"
                        aria-hidden="true"
                      />
                    }
                  >
                    {sortDirection === "asc" ? "Asc" : "Desc"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "owned" && selectedCompareCount > 0 && (
        <div className={styles.compareTray} role="region" aria-label="Selected pets for comparison">
          <span className={styles.compareTrayInfo}>
            <Icon name="petCompare" size="sm" aria-hidden="true" />
            <span>
              <strong>{selectedCompareCount}</strong> / {MAX_COMPARE_SELECTION} selected for comparison
            </span>
          </span>
          <div className={styles.compareTrayActions}>
            <Button variant="ghost" size="sm" onClick={onClearCompareSelection}>
              Clear selection
            </Button>
            <Link href={compareSelectionHref} className={styles.compareTrayLink}>
              <Icon name="petCompare" size="sm" aria-hidden="true" />
              <span>Compare selected ({selectedCompareCount})</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
