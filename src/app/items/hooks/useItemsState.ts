'use client';

import { useItemsData } from './useItemsData';
import { useItemsFilter } from './useItemsFilter';

export function useItemsState() {
  const data = useItemsData();
  const filter = useItemsFilter({
    enrichedItems: data.enrichedItems,
    locationOptions: data.locationOptions,
  });

  return {
    // Data state
    index: data.index,
    usageMap: data.usageMap,
    loadError: data.loadError,
    loading: data.loading,
    enrichedItems: data.enrichedItems,
    types: data.types,
    qualities: data.qualities,
    typeOptions: data.typeOptions,
    qualityOptions: data.qualityOptions,
    locationOptions: data.locationOptions,
    stats: data.stats,

    // Filter and view state
    searchTerm: filter.searchTerm,
    setSearchTerm: filter.setSearchTerm,
    deferredSearchTerm: filter.deferredSearchTerm,
    selectedType: filter.selectedType,
    setSelectedType: filter.setSelectedType,
    handleTypeChange: filter.handleTypeChange,
    selectedQuality: filter.selectedQuality,
    setSelectedQuality: filter.setSelectedQuality,
    selectedSignal: filter.selectedSignal,
    setSelectedSignal: filter.setSelectedSignal,
    selectedLocation: filter.selectedLocation,
    setSelectedLocation: filter.setSelectedLocation,
    hideNonMarket: filter.hideNonMarket,
    setHideNonMarket: filter.setHideNonMarket,
    sortBy: filter.sortBy,
    setSortBy: filter.setSortBy,
    sortDesc: filter.sortDesc,
    setSortDesc: filter.setSortDesc,
    handleSort: filter.handleSort,
    handleSortPickerChange: filter.handleSortPickerChange,
    viewMode: filter.viewMode,
    setViewMode: filter.setViewMode,
    isCompactViewport: filter.isCompactViewport,
    visibleCount: filter.visibleCount,
    setVisibleCount: filter.setVisibleCount,
    itemBatchSize: filter.itemBatchSize,
    filteredItems: filter.filteredItems,
    visibleItems: filter.visibleItems,
    showCardLayout: filter.showCardLayout,
    showTableLayout: filter.showTableLayout,
    activeAdvancedFilterCount: filter.activeAdvancedFilterCount,
    advancedFilterStatus: filter.advancedFilterStatus,
    currentSortLabel: filter.currentSortLabel,
    resetFilters: filter.resetFilters,
    loadMore: filter.loadMore,

    // Actions
    openItemById: data.openItem,
  };
}

export type ItemsState = ReturnType<typeof useItemsState>;
