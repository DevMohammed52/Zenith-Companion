'use client';

import React, { Suspense } from 'react';
import { useItemsState } from './hooks/useItemsState';
import { ItemsHeader } from './components/ItemsHeader';
import { ItemsFilterBar } from './components/ItemsFilterBar';
import { ItemsTable } from './components/ItemsTable';
import { ItemsCardGrid } from './components/ItemsCardGrid';
import { ItemsPagination } from './components/ItemsPagination';
import { BackToTop, Button, EmptyState, Skeleton } from '@/components/ui';
import styles from './Items.module.css';

export {
  SORT_OPTIONS,
  SIGNAL_OPTIONS,
  EQUIPMENT_TYPES,
  SECONDARY_PRODUCTION_TYPES,
  CONSTRUCTION_OUTPUT_PATTERN,
  GATHERING_ACTION_ITEMS,
  ITEM_DB_VIEW_STORAGE_KEY,
  DESKTOP_ITEM_BATCH_SIZE,
  MOBILE_ITEM_BATCH_SIZE,
  COMPACT_BADGE_LIMIT,
  formatLabel,
  formatGold,
  getNumericRequirementEntries,
  getRequiredLevel,
  formatRequirements,
  isRareManualMarketItem,
  isRareOrLimitedHistoryItem,
  descriptionMarksNonTradeable,
  getMarketConfidence,
  getGatheringActionSource,
  isDefaultAlchemyCraft,
  tokenizeSearchText,
  buildItemSearchText,
  matchesSearchToken,
  getMarketWarningLabel,
} from './types';
export type {
  SearchIndexItem,
  SortKey,
  SignalFilter,
  ViewMode,
  FilterOption,
  UsageEntry,
  GatheringActionSource,
  MarketConfidence,
  EnrichedItem,
  ItemDbStats,
} from './types';

function ItemsArchiveContent() {
  const state = useItemsState();

  const metaCountText =
    state.filteredItems.length > state.pageSize
      ? `Showing ${(state.currentPage - 1) * state.pageSize + 1}–${Math.min(
          state.currentPage * state.pageSize,
          state.filteredItems.length,
        ).toLocaleString()} of ${state.filteredItems.length.toLocaleString()} items`
      : `${state.filteredItems.length.toLocaleString()} items`;

  return (
    <main className={`container items-db-page ${styles.page}`} aria-label="Item Database">
      <ItemsHeader
        totalCataloged={state.index.length}
        stats={state.stats}
        filteredCount={state.filteredItems.length}
      />

      <ItemsFilterBar state={state} />

      {state.loadError && (
        <EmptyState
          variant="error"
          title="Item data unavailable"
          description={state.loadError}
        />
      )}

      {!state.loadError && (
        <div className={styles.resultsStage} style={{ minHeight: '640px', contain: 'layout' }}>
          {(state.loading || state.index.length === 0) ? (
            <div className={styles.skeletonSection} aria-busy="true" aria-label="Loading item catalog">
              <div className={styles.skeletonCardsGrid}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} variant="rectangular" height={112} />
                ))}
              </div>
            </div>
          ) : state.filteredItems.length === 0 ? (
            <EmptyState
              variant="search-empty"
              title="No items match the current filters"
              description="Clear the search, tradable filter, or advanced filters to widen the catalog."
              action={{
                label: 'Reset filters',
                variant: 'primary',
                onClick: state.resetFilters,
              }}
            />
          ) : (
            <>
              <div className={styles.resultMeta}>
                <span>{metaCountText}</span>
                <span>Sorted by {state.currentSortLabel}</span>
              </div>

              {state.showTableLayout && (
                <ItemsTable
                  items={state.pageItems}
                  sortBy={state.sortBy}
                  sortDesc={state.sortDesc}
                  onSort={state.handleSort}
                  onOpenItem={state.openItemById}
                />
              )}

              {state.showCardLayout && (
                <ItemsCardGrid
                  items={state.pageItems}
                  onOpenItem={state.openItemById}
                />
              )}

              <ItemsPagination
                currentPage={state.currentPage}
                totalPages={state.totalPages}
                pageSize={state.pageSize}
                totalItems={state.filteredItems.length}
                onPageChange={state.handlePageChange}
                onPageSizeChange={state.handlePageSizeChange}
              />
            </>
          )}
        </div>
      )}

      <BackToTop label="Scroll back to top of item catalog" />
    </main>
  );
}

export default function ItemsPage() {
  return (
    <Suspense
      fallback={(
        <main className={`container items-db-page ${styles.page}`} aria-busy="true" aria-label="Loading item directory">
          <Skeleton variant="rectangular" height={72} />
          <Skeleton variant="rectangular" height={184} />
          <Skeleton variant="rectangular" height={640} />
        </main>
      )}
    >
      <ItemsArchiveContent />
    </Suspense>
  );
}
