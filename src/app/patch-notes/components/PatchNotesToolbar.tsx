"use client";

import { Button, Card, SearchInput, Select, type SelectOption } from "@/components/ui";
import { ALL_FILTER, CATEGORY_LABELS, QUICK_TOPIC_IDS } from "../types";
import styles from "../PatchNotes.module.css";

type PatchNotesToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  categoryOptions: SelectOption[];
  yearOptions: SelectOption[];
  categoryCounts: Record<string, number>;
  hasFilters: boolean;
  onReset: () => void;
  filteredCount: number;
  visibleRangeLabel: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

export function PatchNotesToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  year,
  onYearChange,
  categoryOptions,
  yearOptions,
  categoryCounts,
  isLoading,
  hasFilters,
  onReset,
  filteredCount,
  visibleRangeLabel,
  onExpandAll,
  onCollapseAll,
}: PatchNotesToolbarProps & { isLoading?: boolean }) {
  const availableQuickTopics = isLoading
    ? QUICK_TOPIC_IDS
    : QUICK_TOPIC_IDS.filter((id) => (categoryCounts[id] || 0) > 0 || category === id);

  return (
    <Card padding="md" className={styles.toolbarCard}>
      <div className={styles.controlsGrid}>
        <div className={styles.searchWrap}>
          <SearchInput
            id="patch-notes-search"
            value={query}
            onChange={onQueryChange}
            placeholder="Search versions, bosses, combat, API, items..."
            ariaLabel="Search patch notes"
            showShortcutHint={false}
          />
        </div>

        <div className={styles.selectWrap}>
          <Select
            ariaLabel="Filter patch notes by category"
            options={categoryOptions}
            value={category}
            onChange={onCategoryChange}
            placeholder="All categories"
          />
        </div>

        <div className={styles.selectWrap}>
          <Select
            ariaLabel="Filter patch notes by year"
            options={yearOptions}
            value={year}
            onChange={onYearChange}
            placeholder="All years"
          />
        </div>

        <Button variant="ghost" size="md" onClick={onReset} disabled={!hasFilters}>
          Reset filters
        </Button>
      </div>

      {availableQuickTopics.length > 0 && (
        <div className={styles.topicRail} role="group" aria-label="Quick topic filters">
          <button
            type="button"
            className={`${styles.topicChip} ${category === ALL_FILTER ? styles.topicChipActive : ""}`.trim()}
            aria-pressed={category === ALL_FILTER}
            onClick={() => onCategoryChange(ALL_FILTER)}
          >
            <span>All topics</span>
          </button>

          {availableQuickTopics.map((topicId) => {
            const active = category === topicId;
            return (
              <button
                key={topicId}
                type="button"
                className={`${styles.topicChip} ${active ? styles.topicChipActive : ""}`.trim()}
                aria-pressed={active}
                onClick={() => onCategoryChange(active ? ALL_FILTER : topicId)}
              >
                <span>{CATEGORY_LABELS[topicId] || topicId}</span>
                <span className={styles.topicCount}>{isLoading ? "—" : (categoryCounts[topicId] || 0)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.statusBar}>
        <div className={styles.resultsSummary}>
          <span className={styles.resultsStrong}>{filteredCount}</span> matching patch{" "}
          {filteredCount === 1 ? "note" : "notes"}
          {visibleRangeLabel ? ` | ${visibleRangeLabel}` : ""}
        </div>

        <div className={styles.bulkActions}>
          <Button variant="ghost" size="sm" onClick={onExpandAll} disabled={filteredCount === 0}>
            Expand page
          </Button>
          <Button variant="ghost" size="sm" onClick={onCollapseAll} disabled={filteredCount === 0}>
            Collapse all
          </Button>
        </div>
      </div>
    </Card>
  );
}
