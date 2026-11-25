import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonContainer } from "@/components/ui/Skeleton";
import type { EnrichedEnemy } from "@/lib/world-intelligence";
import { EnemyCard } from "./EnemyCard";
import { EnemiesPagination } from "./EnemiesPagination";
import styles from "../Enemies.module.css";

const SKELETON_COUNT = 12;

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
      <SkeletonContainer announcement="Loading enemies, drops, and weather windows...">
        <div className={styles.enemyGrid}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true">
              <Skeleton variant="rectangular" width={52} height={52} />
              <div className={styles.skeletonBody}>
                <Skeleton variant="text" width="62%" height={16} />
                <Skeleton variant="text" width="44%" height={12} />
                <Skeleton variant="text" width="76%" height={14} />
              </div>
              <div className={styles.skeletonStats}>
                <Skeleton variant="text" width={48} height={12} />
                <Skeleton variant="text" width={56} height={14} />
              </div>
            </div>
          ))}
        </div>
      </SkeletonContainer>
    );
  }

  const displayedEnemies = paginatedEnemies ?? filteredEnemies;

  return (
    <section className={styles.resultsSection} aria-label="Enemy bestiary results">
      <div className={styles.enemyGrid} aria-label="Monster list">
        {displayedEnemies.map((enemy, index) => (
          <EnemyCard
            key={`${enemy.locationKey}-${enemy.name}`}
            enemy={enemy}
            index={index}
            onSelect={onSelectEnemy}
          />
        ))}

        {filteredEnemies.length === 0 && (
          <div className={styles.emptySlot}>
            <EmptyState
              variant="search-empty"
              title="No monsters match the current filters"
              description="Clear search, weather, level, or location controls to widen the bestiary view."
              action={
                hasActiveControls
                  ? {
                      label: "Clear filters",
                      icon: "undo",
                      variant: "secondary",
                      onClick: resetControls,
                    }
                  : undefined
              }
            />
          </div>
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
