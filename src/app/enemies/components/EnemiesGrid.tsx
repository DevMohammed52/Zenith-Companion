import React from "react";
import { RotateCcw } from "lucide-react";
import { LoadingState, NoResultsState } from "@/components/StateBlock";
import type { EnrichedEnemy } from "@/lib/world-intelligence";
import { EnemyCard } from "./EnemyCard";
import { EnemiesPagination } from "./EnemiesPagination";

export function EnemiesGrid({
  loading,
  enemiesCount,
  filteredEnemies,
  paginatedEnemies,
  hasActiveControls,
  resetControls,
  onSelectEnemy,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  loading: boolean;
  enemiesCount: number;
  filteredEnemies: EnrichedEnemy[];
  paginatedEnemies?: EnrichedEnemy[];
  hasActiveControls: boolean;
  resetControls: () => void;
  onSelectEnemy: (enemy: EnrichedEnemy) => void;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  if (loading && enemiesCount === 0) {
    return (
      <LoadingState
        title="Loading enemies"
        description="Preparing enemies, drops, locations, and current weather windows."
      />
    );
  }

  const displayedEnemies = paginatedEnemies ?? filteredEnemies;

  return (
    <section className="enemy-results-section" aria-label="Enemy bestiary results">
      <div className="enemy-grid" aria-label="Monster list">
        {displayedEnemies.map((enemy, index) => (
          <EnemyCard
            key={`${enemy.locationKey}-${enemy.name}`}
            enemy={enemy}
            index={index}
            onSelect={onSelectEnemy}
          />
        ))}

        {filteredEnemies.length === 0 && (
          <NoResultsState
            title="No monsters match the current filters"
            description="Clear search, weather, level, or location controls to widen the bestiary view."
            action={
              hasActiveControls ? (
                <button
                  type="button"
                  onClick={resetControls}
                  className="reset-filters-btn"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Clear filters</span>
                </button>
              ) : null
            }
          />
        )}
      </div>

      {currentPage && totalPages && pageSize && onPageChange && onPageSizeChange && (
        <EnemiesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredEnemies.length}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </section>
  );
}
