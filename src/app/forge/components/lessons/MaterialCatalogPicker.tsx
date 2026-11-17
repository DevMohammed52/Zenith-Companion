"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDown, Check, ChevronDown, ExternalLink, Filter, Package, Plus, Search, SlidersHorizontal, Zap } from "lucide-react";
import { formatGold } from "@/lib/format";
import { useItemModal } from "@/context/ItemModalContext";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import {
  FORGE_LESSON_CATEGORIES,
  FORGE_LESSON_SORTS,
  type CalculatedLessonMaterial,
  type ForgeLessonCategory,
  type ForgeLessonSort,
} from "../../types";
import { MaterialCard } from "./MaterialCard";

const QUALITY_FILTERS = ["ALL", "STANDARD", "REFINED", "PREMIUM", "EPIC", "LEGENDARY", "MYTHIC"] as const;

function useSafeItemModal() {
  try {
    return useItemModal();
  } catch {
    return { openItemByName: () => {}, prefetchItem: () => {} } as any;
  }
}

export function MaterialCatalogPicker({ lessons }: { lessons: UseForgeLessonsReturn }) {
  const { openItemByName } = useSafeItemModal();
  const {
    categoryFilter,
    setCategoryFilter,
    qualityFilter,
    setQualityFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    showExpPerItem,
    setShowExpPerItem,
    visibleMaterials,
    allCalculatedMaterials,
    addToQueue,
    fillSessionWithMaterial,
    lessonQueue,
    ownedMaterials,
    updateOwnedMaterial,
  } = lessons;

  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }
    if (sortMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortMenuOpen]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allCalculatedMaterials.length, ORES: 0, BARS: 0, LOGS: 0, MOB_DROPS: 0 };
    for (const m of allCalculatedMaterials) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [allCalculatedMaterials]);

  return (
    <section className="material-catalog-section" aria-label="Forge lesson material catalog">
      <div className="catalog-header-bar">
        <div className="catalog-title-group">
          <span className="panel-kicker"><SlidersHorizontal size={14} aria-hidden="true" /> Material Catalog</span>
          <h2>Lesson Materials ({allCalculatedMaterials.length})</h2>
        </div>

        {/* In-game "Show EXP per item" toggle recreation */}
        <label className="show-exp-toggle-wrap">
          <input
            type="checkbox"
            checked={showExpPerItem}
            onChange={(e) => setShowExpPerItem(e.target.checked)}
            className="toggle-checkbox"
          />
          <span className="toggle-label">Show EXP per item</span>
        </label>
      </div>

      {/* Filter and search controls */}
      <div className="catalog-filters-bar">
        {/* Category chips */}
        <div className="category-chips-row" role="radiogroup" aria-label="Material categories">
          {FORGE_LESSON_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`filter-chip ${categoryFilter === cat.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(cat.id)}
              aria-checked={categoryFilter === cat.id}
              role="radio"
            >
              <span>{cat.label}</span>
              <small className="chip-count">({categoryCounts[cat.id] || 0})</small>
            </button>
          ))}
        </div>

        {/* Quality chips */}
        <div className="quality-chips-row" role="radiogroup" aria-label="Material quality filter">
          {QUALITY_FILTERS.map((q) => (
            <button
              key={q}
              type="button"
              className={`quality-chip ${q.toLowerCase()} ${qualityFilter === q ? "active" : ""}`}
              onClick={() => setQualityFilter(q)}
              aria-checked={qualityFilter === q}
              role="radio"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Search input & Custom Dark Sort Picker */}
        <div className="search-sort-row">
          <div className="catalog-search-wrap">
            <Search size={15} className="search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search material, enemy, or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="catalog-search-input"
              aria-label="Search material catalog"
            />
          </div>

          <div className="catalog-sort-wrap" ref={sortMenuRef}>
            <span className="sort-label">Sort:</span>
            <div className="custom-sort-dropdown">
              <button
                type="button"
                className={`sort-trigger-btn ${sortMenuOpen ? "open" : ""}`}
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                aria-haspopup="listbox"
                aria-expanded={sortMenuOpen}
              >
                <span>{FORGE_LESSON_SORTS.find((s) => s.id === sortBy)?.label || "Sort"}</span>
                <ChevronDown size={14} className={`chevron-icon ${sortMenuOpen ? "flipped" : ""}`} />
              </button>
              {sortMenuOpen && (
                <div className="sort-popover-menu" role="listbox">
                  {FORGE_LESSON_SORTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`sort-option-btn ${sortBy === s.id ? "active" : ""}`}
                      onClick={() => {
                        setSortBy(s.id);
                        setSortMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={sortBy === s.id}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Materials grid */}
      <div className="materials-grid" aria-label="Materials catalog list">
        {visibleMaterials.length === 0 ? (
          <div className="no-matches-box">
            <p>No materials match your current category, quality, or search criteria.</p>
          </div>
        ) : (
          visibleMaterials.map((mat) => (
            <MaterialCard
              key={mat.name}
              mat={mat}
              ownedCount={ownedMaterials[mat.name] || 0}
              inQueueCount={lessonQueue[mat.name] || 0}
              showExpPerItem={showExpPerItem}
              onOpenItem={openItemByName}
              onAddToQueue={addToQueue}
              onFillSession={fillSessionWithMaterial}
              onUpdateOwned={updateOwnedMaterial}
            />
          ))
        )}
      </div>
    </section>
  );
}
