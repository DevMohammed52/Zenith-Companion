'use client';

import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useSearchParams } from 'next/navigation';
import { getQualityRank } from '@/lib/quality';
import {
  DESKTOP_ITEM_BATCH_SIZE,
  EQUIPMENT_TYPES,
  ITEM_DB_VIEW_STORAGE_KEY,
  matchesSearchToken,
  MOBILE_ITEM_BATCH_SIZE,
  SORT_OPTIONS,
  type EnrichedItem,
  type FilterOption,
  type SignalFilter,
  type SortKey,
  type ViewMode,
} from '../types';

export function useItemsFilter({
  enrichedItems,
  locationOptions,
}: {
  enrichedItems: EnrichedItem[];
  locationOptions: FilterOption<string>[];
}) {
  const searchParams = useSearchParams();
  const getSafeParam = (key: string) => {
    try {
      return searchParams.get(key);
    } catch {
      return null;
    }
  };
  const idParam = getSafeParam('id');
  const initialSearch = (!idParam ? (getSafeParam('name') || getSafeParam('q') || '') : '').trim();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    const currentId = getSafeParam('id');
    const nameParam = getSafeParam('name') || getSafeParam('q');
    if (nameParam && !currentId) {
      setSearchTerm(nameParam.trim());
    }
  }, [searchParams]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [selectedSignal, setSelectedSignal] = useState<SignalFilter>('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [hideNonMarket, setHideNonMarket] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('volume');
  const [sortDesc, setSortDesc] = useState(true);
  const [viewMode, setViewModeState] = useState<ViewMode>('table');
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [visibleCount, setVisibleCount] = useState(DESKTOP_ITEM_BATCH_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const itemBatchSize = isCompactViewport ? MOBILE_ITEM_BATCH_SIZE : DESKTOP_ITEM_BATCH_SIZE;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ITEM_DB_VIEW_STORAGE_KEY);
      if (stored === 'table' || stored === 'cards') setViewModeState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)');
    const updateViewportMode = () => setIsCompactViewport(media.matches);
    updateViewportMode();
    media.addEventListener('change', updateViewportMode);
    return () => media.removeEventListener('change', updateViewportMode);
  }, []);

  const setViewMode = (next: ViewMode) => {
    setViewModeState(next);
    try {
      localStorage.setItem(ITEM_DB_VIEW_STORAGE_KEY, next);
    } catch {}
  };

  useEffect(() => {
    setVisibleCount(itemBatchSize);
    setCurrentPage(1);
  }, [
    itemBatchSize,
    searchTerm,
    selectedType,
    selectedQuality,
    selectedSignal,
    selectedLocation,
    sortBy,
    sortDesc,
    hideNonMarket,
  ]);

  useEffect(() => {
    if (selectedLocation === 'ALL') return;
    if (!locationOptions.some((option) => option.value === selectedLocation)) {
      setSelectedLocation('ALL');
    }
  }, [locationOptions, selectedLocation]);

  const filteredItems = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    const filtered = enrichedItems.filter((item) => {
      const matchSearch = tokens.length === 0 || tokens.every((token) => matchesSearchToken(item, token));
      const matchType = selectedType === 'ALL' || item.type === selectedType;
      const matchQuality = selectedQuality === 'ALL' || item.quality === selectedQuality;
      const matchLocation = selectedLocation === 'ALL' || item.dropLocationKeys.includes(selectedLocation);
      const matchTradeableVisibility =
        !hideNonMarket
        || item.tradeable
        || (selectedSignal === 'VENDOR' && item.merchantBuyPrice > 0)
        || (selectedSignal === 'UNTRADABLE' && !item.tradeable)
        || (selectedSignal === 'LEGACY' && item.isLegacy);
      const matchSignal =
        selectedSignal === 'ALL'
        || (selectedSignal === 'MARKET' && item.hasMarket)
        || (selectedSignal === 'PRICE_SWINGS' && item.liquidity.hasPriceSwings)
        || (selectedSignal === 'VENDOR' && item.merchantBuyPrice > 0)
        || (selectedSignal === 'UNTRADABLE' && !item.tradeable)
        || (selectedSignal === 'LEGACY' && item.isLegacy)
        || (selectedSignal === 'CRAFTABLE' && item.hasRecipe)
        || (selectedSignal === 'PRODUCED' && item.isSecondaryProduction)
        || (selectedSignal === 'USED' && item.usedInCount > 0)
        || (selectedSignal === 'DROPPED' && item.droppedByCount > 0)
        || (selectedSignal === 'FARMABLE' && item.hasFarmableSource)
        || (selectedSignal === 'EQUIPMENT' && (EQUIPMENT_TYPES.has(item.type) || item.hasStats))
        || (selectedSignal === 'EFFECTS' && item.hasEffects)
        || (selectedSignal === 'LORE' && item.hasLore);

      return matchSearch && matchType && matchQuality && matchLocation && matchTradeableVisibility && matchSignal;
    });

    return filtered.sort((a, b) => {
      if (selectedSignal !== 'LEGACY' && a.isLegacy !== b.isLegacy) {
        return a.isLegacy ? 1 : -1;
      }

      let valA: string | number;
      let valB: string | number;

      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'type') {
        valA = a.type.toLowerCase();
        valB = b.type.toLowerCase();
      } else if (sortBy === 'quality') {
        valA = getQualityRank(a.quality);
        valB = getQualityRank(b.quality);
      } else if (sortBy === 'requiredLevel') {
        valA = a.requiredLevel;
        valB = b.requiredLevel;
      } else if (sortBy === 'price') {
        valA = a.marketPrice;
        valB = b.marketPrice;
      } else if (sortBy === 'vendor') {
        valA = a.vendorPrice;
        valB = b.vendorPrice;
      } else if (sortBy === 'usage') {
        valA = a.usageScore;
        valB = b.usageScore;
      } else {
        valA = a.stableMarketVolume;
        valB = b.stableMarketVolume;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const primary = sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        return primary || a.name.localeCompare(b.name);
      }
      const primary = sortDesc ? Number(valB) - Number(valA) : Number(valA) - Number(valB);
      if (primary !== 0) return primary;
      if (sortBy === 'requiredLevel') {
        const rarityTieBreak = getQualityRank(b.quality) - getQualityRank(a.quality);
        if (rarityTieBreak !== 0) return rarityTieBreak;
      }
      if (sortBy === 'quality') {
        const levelTieBreak = b.requiredLevel - a.requiredLevel;
        if (levelTieBreak !== 0) return sortDesc ? levelTieBreak : -levelTieBreak;
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    enrichedItems,
    deferredSearchTerm,
    selectedType,
    selectedQuality,
    selectedSignal,
    selectedLocation,
    hideNonMarket,
    sortBy,
    sortDesc,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Aliased to pageItems to maintain 50-item bounded memory footprint
  const visibleItems = pageItems;

  const showCardLayout = isCompactViewport || viewMode === 'cards';
  const showTableLayout = !isCompactViewport && viewMode === 'table';

  const activeAdvancedFilterCount = [
    selectedType !== 'ALL',
    selectedQuality !== 'ALL',
    selectedSignal !== 'ALL',
    selectedLocation !== 'ALL',
  ].filter(Boolean).length;

  const advancedFilterStatus =
    activeAdvancedFilterCount > 0 ? `${activeAdvancedFilterCount} active` : 'All items';

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Stable Volume';

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc((prev) => !prev);
    } else {
      setSortBy(key);
      setSortDesc(key !== 'name' && key !== 'type');
    }
  };

  const handleSortPickerChange = (key: SortKey) => {
    setSortBy(key);
    setSortDesc(key !== 'name' && key !== 'type');
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (type === 'ALL') {
      setSortBy('volume');
      setSortDesc(true);
      return;
    }
    setSortBy(EQUIPMENT_TYPES.has(type) ? 'requiredLevel' : 'quality');
    setSortDesc(true);
  };

  const handlePageChange = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedQuality('ALL');
    setSelectedSignal('ALL');
    setSelectedLocation('ALL');
    setHideNonMarket(false);
    setSortBy('volume');
    setSortDesc(true);
    setCurrentPage(1);
  };

  const loadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    deferredSearchTerm,
    selectedType,
    setSelectedType,
    handleTypeChange,
    selectedQuality,
    setSelectedQuality,
    selectedSignal,
    setSelectedSignal,
    selectedLocation,
    setSelectedLocation,
    hideNonMarket,
    setHideNonMarket,
    sortBy,
    setSortBy,
    sortDesc,
    setSortDesc,
    handleSort,
    handleSortPickerChange,
    viewMode,
    setViewMode,
    isCompactViewport,
    visibleCount,
    setVisibleCount,
    itemBatchSize,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    pageItems,
    handlePageChange,
    handlePageSizeChange,
    filteredItems,
    visibleItems,
    showCardLayout,
    showTableLayout,
    activeAdvancedFilterCount,
    advancedFilterStatus,
    currentSortLabel,
    resetFilters,
    loadMore,
  };
}
