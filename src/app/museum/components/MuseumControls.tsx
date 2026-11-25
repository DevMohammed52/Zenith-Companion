"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select, type SelectOption } from "@/components/ui/Select";
import { museumCategoryLabel } from "@/lib/museum";
import {
  CATEGORY_ICONS,
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
  summaryByCategory,
  activeControlCount,
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
  summaryByCategory: Map<MuseumCategory, MuseumCategorySummary>;
  activeControlCount: number;
  resetControls: () => void;
}) {
  const sortSelectOptions: SelectOption[] = SORT_OPTIONS.map((option) => ({
    value: option.key,
    label: `Sort: ${option.label}`,
  }));

  return (
    <section className={styles.controlsPanel} aria-label="Museum filters">
      <div className={styles.categoryRow} role="group" aria-label="Category filter">
        <button
          type="button"
          className={styles.categoryButton}
          data-active={category === "ALL"}
          aria-pressed={category === "ALL"}
          onClick={() => setCategory("ALL")}
        >
          <Icon name={CATEGORY_ICONS.ALL} size="sm" aria-hidden="true" />
          <span>All</span>
          <small>{formatNumber(itemsCount)}</small>
        </button>
        {MUSEUM_CATEGORIES.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.categoryButton}
            data-active={category === option}
            aria-pressed={category === option}
            onClick={() => setCategory(option)}
          >
            <Icon name={CATEGORY_ICONS[option]} size="sm" aria-hidden="true" />
            <span>{museumCategoryLabel(option)}</span>
            <small>{formatNumber(summaryByCategory.get(option)?.itemCount || 0)}</small>
          </button>
        ))}
      </div>

      <div className={styles.filterToolbar}>
        <div className={styles.searchWrap}>
          <SearchInput
            ariaLabel="Search museum items"
            showShortcutHint={false}
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
            placeholder="Search by item name, category, or ID..."
          />
        </div>

        <span className={styles.toolbarDivider} aria-hidden="true" />

        <div className={styles.sortControls}>
          <div className={styles.sortSelectWrap}>
            <Select
              options={sortSelectOptions}
              value={sortKey}
              onChange={(val) => setSortKey(val as MuseumSortKey)}
              aria-label="Sort museum items"
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            icon={<Icon name={sortDirection === "asc" ? "sortAsc" : "sortDesc"} size="sm" aria-hidden="true" />}
            onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
            aria-label={`Sort direction: ${sortDirection === "asc" ? "Ascending" : "Descending"}`}
          >
            {sortDirection === "asc" ? "Asc" : "Desc"}
          </Button>
          {activeControlCount > 0 && (
            <Button
              variant="ghost"
              size="md"
              icon={<Icon name="undo" size="sm" aria-hidden="true" />}
              onClick={resetControls}
              aria-label="Reset museum filters and sort"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
