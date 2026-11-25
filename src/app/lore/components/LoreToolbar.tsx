import { useMemo, type CSSProperties } from "react";
import type { LoreEntry } from "@/data/lore";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  VIEW_OPTIONS,
  CATEGORY_META,
  type LoreView,
  type LoreFilter,
} from "../types";
import styles from "../Lore.module.css";

export function LoreToolbar({
  search,
  setSearch,
  activeView,
  setActiveView,
  visibleEntryCount,
  activeCategory,
  setActiveCategory,
  activeCategoryLabel,
  categoryFilterApplies,
  entriesCount,
  categoryCounts,
  hasActiveControls,
  resetLoreControls,
}: {
  search: string;
  setSearch: (value: string) => void;
  hasSearch: boolean;
  activeView: LoreView;
  setActiveView: (view: LoreView) => void;
  activeViewLabel: string;
  visibleEntryCount: number;
  activeCategory: LoreFilter;
  setActiveCategory: (cat: LoreFilter) => void;
  activeCategoryLabel: string;
  categoryFilterApplies: boolean;
  entriesCount: number;
  categoryCounts: Record<string, number>;
  hasActiveControls: boolean;
  resetLoreControls: () => void;
}) {
  const viewOptions = useMemo(
    () =>
      VIEW_OPTIONS.map((view) => ({
        value: view.id,
        label: view.label,
        icon: view.icon,
      })),
    [],
  );

  return (
    <>
      <section className={styles.toolbar} aria-label="Lore controls">
        <div className={styles.toolbarTop}>
          <SearchInput
            id="lore-search-input"
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder="Search civilizations, relics, deities, characters..."
            ariaLabel="Search lore records"
            showShortcutHint={false}
            className={styles.searchField}
          />
          <div className={styles.viewSwitcher}>
            <SegmentedControl
              options={viewOptions}
              value={activeView}
              onChange={setActiveView}
              ariaLabel="Select lore archive view"
              size="sm"
            />
          </div>
        </div>

        <div className={styles.toolbarStatusRow} aria-live="polite">
          <div className={styles.statusInfo}>
            <span>
              Showing <strong>{visibleEntryCount}</strong> {activeView === "board" ? "connections" : "records"}
            </span>
            {activeCategory !== "all" && categoryFilterApplies && (
              <span>
                in <strong>{activeCategoryLabel}</strong>
              </span>
            )}
          </div>
          {hasActiveControls && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Icon name="undo" size="sm" aria-hidden="true" />}
              onClick={resetLoreControls}
              aria-label="Reset all lore filters and return to default view"
            >
              Reset
            </Button>
          )}
        </div>
      </section>

      {categoryFilterApplies && (
        <section className={styles.categoryRailContainer} aria-label="Filter by lore category">
          <div className={styles.categoryRail}>
            <button
              className={`${styles.categoryPill} ${activeCategory === "all" ? styles.categoryPillActive : ""}`}
              aria-pressed={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              type="button"
            >
              <Icon name="filter" size="sm" aria-hidden="true" />
              <span>All</span>
              <span className={styles.categoryPillCount}>{entriesCount}</span>
            </button>
            {(Object.keys(CATEGORY_META) as LoreEntry["category"][]).map((category) => (
              <button
                key={category}
                type="button"
                style={{ "--tone": CATEGORY_META[category].tone } as CSSProperties}
                className={`${styles.categoryPill} ${activeCategory === category ? styles.categoryPillActive : ""}`}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                <span className={styles.categoryPillGlyph}>{CATEGORY_META[category].icon}</span>
                <span>{CATEGORY_META[category].label}</span>
                <span className={styles.categoryPillCount}>{categoryCounts[category] || 0}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
