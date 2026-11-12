'use client';

import React, { Suspense } from 'react';
import { useItemsState } from './hooks/useItemsState';
import { ItemsHeader } from './components/ItemsHeader';
import { ItemsFilterBar } from './components/ItemsFilterBar';
import { ItemsTable } from './components/ItemsTable';
import { ItemsCardGrid } from './components/ItemsCardGrid';
import { ItemsStyles } from './components/ItemsStyles';
import { ErrorState, LoadingState, NoResultsState } from '@/components/StateBlock';

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

  return (
    <main className="container items-db-page" aria-label="Item Database">
      <ItemsStyles />

      <ItemsHeader
        totalCataloged={state.index.length}
        stats={state.stats}
        filteredCount={state.filteredItems.length}
      />

      <ItemsFilterBar state={state} />

      {state.loadError && (
        <ErrorState title="Item data unavailable" description={state.loadError} />
      )}

      {!state.loadError && (state.loading || state.index.length === 0) && (
        <LoadingState title="Loading item data" description="Preparing the item index, market rows, and relationship map." />
      )}

      {!state.loadError && state.index.length > 0 && state.filteredItems.length === 0 && (
        <NoResultsState
          title="No items match the current filters"
          description="Clear the search, market-only view, or advanced filters to widen the catalog."
          action={(
            <button
              type="button"
              className="reset-btn"
              onClick={state.resetFilters}
            >
              Reset filters
            </button>
          )}
        />
      )}

      {!state.loadError && state.filteredItems.length > 0 && (
        <div style={{ minHeight: '640px', contain: 'layout' }}>
          <div className="result-meta">
            <span>{state.visibleItems.length.toLocaleString()} of {state.filteredItems.length.toLocaleString()} shown</span>
            <span>Sorted by {state.currentSortLabel}</span>
          </div>

          {state.showTableLayout && (
            <ItemsTable
              items={state.visibleItems}
              sortBy={state.sortBy}
              sortDesc={state.sortDesc}
              onSort={state.handleSort}
              onOpenItem={state.openItemById}
            />
          )}

          {state.showCardLayout && (
            <ItemsCardGrid
              items={state.visibleItems}
              onOpenItem={state.openItemById}
            />
          )}

          {state.visibleItems.length < state.filteredItems.length && (
            <button
              type="button"
              className="load-more"
              onClick={state.loadMore}
            >
              Load {state.itemBatchSize} more
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default function ItemsPage() {
  return (
    <Suspense
      fallback={(
        <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="skeleton-text" style={{ width: '200px', margin: '0 auto' }} />
        </div>
      )}
    >
      <ItemsArchiveContent />
    </Suspense>
  );
}
