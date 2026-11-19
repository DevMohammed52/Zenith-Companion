import type { CSSProperties } from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { LoreEntry } from "@/data/lore";
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
  return (
    <>
      <section className="lore-toolbar" aria-label="Lore controls">
        <div className="lore-search">
          <Search size={17} />
          <span id="lore-search-label" className="sr-only">Search lore records</span>
          <input
            aria-labelledby="lore-search-label"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search names, factions, places, artifacts..."
          />
          {hasSearch && (
            <button type="button" className="lore-search-clear" onClick={() => setSearch("")} aria-label="Clear lore search">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="lore-view-tabs" role="group" aria-label="Lore view filter">
          {VIEW_OPTIONS.map((view) => (
            <button
              key={view.id}
              type="button"
              className={activeView === view.id ? "active" : ""}
              onClick={() => setActiveView(view.id)}
              aria-pressed={activeView === view.id}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>
        <div className="lore-toolbar-status" aria-live="polite">
          <div>
            <span><SlidersHorizontal size={15} aria-hidden="true" /> Current view</span>
            <strong>{activeViewLabel}</strong>
          </div>
          <div>
            <span>Showing</span>
            <strong>{visibleEntryCount} {activeView === "board" ? "links" : "records"}</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>{activeCategoryLabel}</strong>
          </div>
          <button type="button" onClick={resetLoreControls} disabled={!hasActiveControls} aria-label="Reset lore filters and view">
            <RotateCcw size={15} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      {categoryFilterApplies && (
        <section className="category-rail" aria-label="Lore categories">
          <button className={activeCategory === "all" ? "active" : ""} aria-pressed={activeCategory === "all"} onClick={() => setActiveCategory("all")} type="button">
            <Filter size={15} /> All <span>{entriesCount}</span>
          </button>
          {(Object.keys(CATEGORY_META) as LoreEntry["category"][]).map((category) => (
            <button
              key={category}
              type="button"
              style={{ "--tone": CATEGORY_META[category].tone } as CSSProperties}
              className={activeCategory === category ? "active" : ""}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {CATEGORY_META[category].icon}
              {CATEGORY_META[category].label}
              <span>{categoryCounts[category] || 0}</span>
            </button>
          ))}
        </section>
      )}
    </>
  );
}
