import React from "react";
import { RotateCcw } from "lucide-react";
import { LoadingState, NoResultsState } from "@/components/StateBlock";
import type { EnrichedEnemy } from "@/lib/world-intelligence";
import { EnemyCard } from "./EnemyCard";

export function EnemiesGrid({
  loading,
  enemiesCount,
  filteredEnemies,
  hasActiveControls,
  resetControls,
  onSelectEnemy,
}: {
  loading: boolean;
  enemiesCount: number;
  filteredEnemies: EnrichedEnemy[];
  hasActiveControls: boolean;
  resetControls: () => void;
  onSelectEnemy: (enemy: EnrichedEnemy) => void;
}) {
  if (loading && enemiesCount === 0) {
    return (
      <LoadingState
        title="Loading enemies"
        description="Preparing enemies, drops, locations, and current weather windows."
      />
    );
  }

  return (
    <section className="enemy-grid" aria-label="Enemy results">
      {filteredEnemies.map((enemy, index) => (
        <EnemyCard
          key={`${enemy.locationKey}-${enemy.name}`}
          enemy={enemy}
          index={index}
          onSelect={onSelectEnemy}
        />
      ))}
      {filteredEnemies.length === 0 && (
        <NoResultsState
          title="No enemies match the current filters"
          description="Clear search, weather, level, or sort controls to widen the enemy list."
          action={
            hasActiveControls ? (
              <button type="button" onClick={resetControls}>
                <RotateCcw size={14} aria-hidden="true" />
                Clear filters
              </button>
            ) : null
          }
        />
      )}
    </section>
  );
}
