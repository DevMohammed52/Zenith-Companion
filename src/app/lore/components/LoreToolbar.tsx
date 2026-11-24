import { useMemo, type CSSProperties } from "react";
import { Filter, RotateCcw, Search, X } from "lucide-react";
import type { LoreEntry } from "@/data/lore";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import {
  VIEW_OPTIONS,
  CATEGORY_META,
  type LoreView,
  type LoreFilter,
} from "../types";

export function LoreToolbar({
  search,
  setSearch,
  hasSearch,
  activeView,
  setActiveView,
  activeViewLabel,
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
      <section className="lore-toolbar" aria-label="Lore controls">
        <div className="lore-toolbar-top">
          <div className="lore-search">
            <Search size={16} className="lore-search-icon" aria-hidden="true" />
            <span id="lore-search-label" className="sr-only">Search lore records</span>
            <input
              aria-labelledby="lore-search-label"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search civilizations, relics, deities, characters..."
            />
            {hasSearch && (
              <button
                type="button"
                className="lore-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear lore search"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="lore-view-switcher">
            <SegmentedControl
              options={viewOptions}
              value={activeView}
              onChange={setActiveView}
              ariaLabel="Select lore archive view"
              size="sm"
            />
          </div>
        </div>

        <div className="lore-toolbar-status-row" aria-live="polite">
          <div className="lore-status-info">
            <span className="lore-status-count">
              Showing <strong>{visibleEntryCount}</strong> {activeView === "board" ? "connections" : "records"}
            </span>
            {activeCategory !== "all" && categoryFilterApplies && (
              <span className="lore-status-category-tag">
                in <strong>{activeCategoryLabel}</strong>
              </span>
            )}
          </div>
          {hasActiveControls && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} aria-hidden="true" />}
              onClick={resetLoreControls}
              aria-label="Reset all lore filters and return to default view"
              className="lore-reset-btn"
            >
              Reset
            </Button>
          )}
        </div>
      </section>

      {categoryFilterApplies && (
        <section className="category-rail-container" aria-label="Filter by lore category">
          <div className="category-rail">
            <button
              className={`category-pill ${activeCategory === "all" ? "active" : ""}`}
              aria-pressed={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              type="button"
            >
              <Filter size={14} aria-hidden="true" />
              <span>All</span>
              <span className="category-pill-count">{entriesCount}</span>
            </button>
            {(Object.keys(CATEGORY_META) as LoreEntry["category"][]).map((category) => (
              <button
                key={category}
                type="button"
                style={{ "--tone": CATEGORY_META[category].tone } as CSSProperties}
                className={`category-pill ${activeCategory === category ? "active" : ""}`}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                <span className="category-pill-glyph">{CATEGORY_META[category].icon}</span>
                <span>{CATEGORY_META[category].label}</span>
                <span className="category-pill-count">{categoryCounts[category] || 0}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
