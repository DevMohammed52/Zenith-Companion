"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ExternalLink,
  Flame,
  LayoutGrid,
  LayoutList,
  Package,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
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

const QUALITY_OPTIONS = ["ALL", "STANDARD", "REFINED", "PREMIUM", "EPIC", "LEGENDARY", "MYTHIC"] as const;

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
    forgeLevel,
  } = lessons;

  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [usableOnly, setUsableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [visibleCount, setVisibleCount] = useState<number>(24);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Restore saved view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zenith_forge_catalog_view");
      if (saved === "list" || saved === "cards") {
        setViewMode(saved);
      }
    }
  }, []);

  const handleSetViewMode = (mode: "list" | "cards") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("zenith_forge_catalog_view", mode);
      } catch {}
    }
  };

  // Click outside and Escape key listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target as Node)) {
        setQualityMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
        setQualityMenuOpen(false);
      }
    }
    if (sortMenuOpen || qualityMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortMenuOpen, qualityMenuOpen]);

  // Reset pagination count whenever filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, categoryFilter, qualityFilter, usableOnly, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allCalculatedMaterials.length, ORES: 0, BARS: 0, LOGS: 0, MOB_DROPS: 0 };
    for (const m of allCalculatedMaterials) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [allCalculatedMaterials]);

  // Usable materials count: players can burn right now with 100% full efficiency
  const usableCount = useMemo(() => {
    return allCalculatedMaterials.filter((m) => m.reqLvl <= forgeLevel && !m.hasPenalty).length;
  }, [allCalculatedMaterials, forgeLevel]);

  // Apply "Usable at My Level" filter if toggled
  const displayMaterials = useMemo(() => {
    if (!usableOnly) return visibleMaterials;
    return visibleMaterials.filter((m) => m.reqLvl <= forgeLevel && !m.hasPenalty);
  }, [visibleMaterials, usableOnly, forgeLevel]);

  // Progressive pagination
  const paginatedMaterials = useMemo(() => {
    return displayMaterials.slice(0, visibleCount);
  }, [displayMaterials, visibleCount]);

  useEffect(() => {
    if (visibleCount >= displayMaterials.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(displayMaterials.length, prev + 24));
        }
      },
      { rootMargin: "250px" }
    );
    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [visibleCount, displayMaterials.length]);

  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== "ALL" || qualityFilter !== "ALL" || usableOnly;

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setQualityFilter("ALL");
    setUsableOnly(false);
  };

  return (
    <section className="material-catalog-section" aria-label="Forge lesson material catalog">
      <div className="catalog-header-bar">
        <div className="catalog-title-group">
          <span className="panel-kicker">
            <SlidersHorizontal size={14} aria-hidden="true" /> Lesson Materials{" "}
            <span className="sr-only">Material Catalog</span>
          </span>
          <h2>Catalog ({displayMaterials.length} items)</h2>
        </div>

        <div className="catalog-header-actions">
          {/* View mode toggle */}
          <div className="view-mode-toggle" role="group" aria-label="Catalog view mode">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => handleSetViewMode("list")}
              title="Compact list view"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <LayoutList size={15} aria-hidden="true" />
              <span>List</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => handleSetViewMode("cards")}
              title="Card grid view"
              aria-label="Cards view"
              aria-pressed={viewMode === "cards"}
            >
              <LayoutGrid size={15} aria-hidden="true" />
              <span>Cards</span>
            </button>
          </div>

          {/* Show EXP per item toggle (accessible & preserved for contract test) */}
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
      </div>

      {/* Streamlined 2-Row Filter & Search Controls */}
      <div className="catalog-filters-bar">
        {/* Row 1: Search, Sort Dropdown, and Quality Dropdown */}
        <div className="filter-controls-row">
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
            {searchQuery.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear material search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="catalog-dropdowns-group">
            {/* Sort Picker */}
            <div className="catalog-sort-wrap" ref={sortMenuRef}>
              <div className="custom-sort-dropdown">
                <button
                  type="button"
                  className={`sort-trigger-btn ${sortMenuOpen ? "open" : ""}`}
                  onClick={() => setSortMenuOpen(!sortMenuOpen)}
                  aria-haspopup="listbox"
                  aria-label="Sort lesson materials by"
                  aria-expanded={sortMenuOpen}
                >
                  <span className="dropdown-label">Sort:</span>
                  <span className="dropdown-val">
                    {FORGE_LESSON_SORTS.find((s) => s.id === sortBy)?.label || "Sort"}
                  </span>
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

            {/* Compact Quality Picker */}
            <div className="catalog-sort-wrap" ref={qualityMenuRef}>
              <div className="custom-sort-dropdown quality-dropdown">
                <button
                  type="button"
                  className={`sort-trigger-btn ${qualityMenuOpen ? "open" : ""} ${qualityFilter !== "ALL" ? "filtered" : ""}`}
                  onClick={() => setQualityMenuOpen(!qualityMenuOpen)}
                  aria-haspopup="listbox"
                  aria-label="Filter by material quality"
                  aria-expanded={qualityMenuOpen}
                >
                  <span className="dropdown-label">Tier:</span>
                  <span className="dropdown-val">{qualityFilter}</span>
                  <ChevronDown size={14} className={`chevron-icon ${qualityMenuOpen ? "flipped" : ""}`} />
                </button>
                {qualityMenuOpen && (
                  <div className="sort-popover-menu" role="listbox">
                    {QUALITY_OPTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className={`sort-option-btn ${qualityFilter === q ? "active" : ""}`}
                        onClick={() => {
                          setQualityFilter(q);
                          setQualityMenuOpen(false);
                        }}
                        role="option"
                        aria-selected={qualityFilter === q}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Category Chips & "Usable (Lv. X)" Quick Filter */}
        <div className="filter-chips-row">
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

          <div className="secondary-filters-row">
            {/* Usable at Current Level Button */}
            <button
              type="button"
              className={`usable-filter-btn ${usableOnly ? "active" : ""}`}
              onClick={() => setUsableOnly(!usableOnly)}
              title="Show only materials you can burn right now with 100% full EXP efficiency"
              aria-pressed={usableOnly}
            >
              <Sparkles size={13} aria-hidden="true" />
              <span>Usable (Lv. {forgeLevel})</span>
              <small className="usable-count-pill">{usableCount}</small>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="reset-filters-btn"
                onClick={handleResetFilters}
                title="Reset all filters and search"
                aria-label="Reset all filters"
              >
                <RotateCcw size={12} aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Materials List or Grid Display */}
      <div
        className={viewMode === "list" ? "materials-list" : "materials-grid"}
        aria-label="Materials catalog list"
      >
        {displayMaterials.length === 0 ? (
          <div className="no-matches-box">
            <p>No materials match your current category, quality, or search criteria.</p>
            {hasActiveFilters && (
              <button
                type="button"
                className="reset-search-btn"
                onClick={handleResetFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          paginatedMaterials.map((mat) => (
            <MaterialCard
              key={mat.name}
              mat={mat}
              ownedCount={ownedMaterials[mat.name] || 0}
              inQueueCount={lessonQueue[mat.name] || 0}
              showExpPerItem={showExpPerItem}
              viewMode={viewMode}
              onOpenItem={openItemByName}
              onAddToQueue={addToQueue}
              onFillSession={fillSessionWithMaterial}
              onUpdateOwned={updateOwnedMaterial}
            />
          ))
        )}
      </div>

      {/* Sentinel for infinite scroll */}
      {visibleCount < displayMaterials.length && (
        <div ref={sentinelRef} className="catalog-sentinel" aria-hidden="true" style={{ height: "1px" }} />
      )}

      {/* Progressive load more controls */}
      {displayMaterials.length > 24 && (
        <div className="catalog-pagination-bar">
          <span className="pagination-status">
            Showing <strong>{Math.min(visibleCount, displayMaterials.length)}</strong> of <strong>{displayMaterials.length}</strong> materials
          </span>
          {visibleCount < displayMaterials.length && (
            <div className="pagination-actions">
              <button
                type="button"
                className="load-more-btn"
                onClick={() => setVisibleCount((prev) => Math.min(displayMaterials.length, prev + 24))}
              >
                Load More (+{Math.min(24, displayMaterials.length - visibleCount)})
              </button>
              <button
                type="button"
                className="show-all-btn"
                onClick={() => setVisibleCount(displayMaterials.length)}
              >
                Show All ({displayMaterials.length})
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
