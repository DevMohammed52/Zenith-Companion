'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useItemModal } from '@/context/ItemModalContext';
import { useData } from '@/context/DataContext';
import {
  getAllLoreForItem,
  getCachedLoreDataset,
  loadLoreData,
  type LoreDataset,
} from '@/data/lore';
import { isForcedUntradableItem, isLegacyItem } from '@/lib/item-display';
import {
  buildDropLocationOptions,
  getDropSourceLocation,
  getResourceLocationsForItem,
  type DropSourceWithLocation,
} from '@/lib/locations';
import { getMarketLiquidity, getSafeMarketValue } from '@/lib/market-pricing';
import { getMerchantBuyPrice } from '@/constants';
import { loadUsageMap } from '@/lib/usage-map';
import { getQualityRank } from '@/lib/quality';
import {
  buildItemSearchText,
  CONSTRUCTION_OUTPUT_PATTERN,
  descriptionMarksNonTradeable,
  formatLabel,
  formatRequirements,
  getGatheringActionSource,
  getMarketConfidence,
  getRequiredLevel,
  isDefaultAlchemyCraft,
  SECONDARY_PRODUCTION_TYPES,
  tokenizeSearchText,
  type EnrichedItem,
  type FilterOption,
  type ItemDbStats,
  type SearchIndexItem,
  type UsageEntry,
} from '../types';

export function useItemsData() {
  const searchParams = useSearchParams();
  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, UsageEntry>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loreDataset, setLoreDataset] = useState<LoreDataset | null>(() => getCachedLoreDataset());
  const { openItem } = useItemModal();
  const { marketData, allItemsDb, loading } = useData();

  useEffect(() => {
    let cancelled = false;
    loadLoreData()
      .then((data) => {
        if (!cancelled) setLoreDataset(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/search-index.json').then((r) => (r.ok ? r.json() : Promise.reject(new Error('Search index unavailable')))),
      loadUsageMap<Record<string, UsageEntry>>(),
    ])
      .then(([indexData, usageData]) => {
        if (cancelled) return;
        setIndex(Array.isArray(indexData) ? indexData : []);
        setUsageMap(usageData && typeof usageData === 'object' && !Array.isArray(usageData) ? usageData : {});
        setLoadError(null);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Item index failed to load.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (index.length === 0) return;
    try {
      const idParam = searchParams.get('item') || searchParams.get('id');
      const nameParam = searchParams.get('name') || searchParams.get('q');

      if (idParam && idParam.trim()) {
        openItem(idParam.trim());
      } else if (nameParam && nameParam.trim()) {
        const cleanName = nameParam.trim().toLowerCase();
        const found = index.find((i: SearchIndexItem) => i.name.toLowerCase() === cleanName);
        if (found) openItem(found.id);
      }
    } catch {
      // Safe fallback if searchParams contains malformed URI encoding
    }
  }, [searchParams, index, openItem]);

  const enrichedItems = useMemo<EnrichedItem[]>(() => {
    return index.map((item) => {
      const full = allItemsDb?.[item.name] || {};
      const market = marketData?.[item.name] || {};
      const usage = usageMap[item.name] || {};
      const dropSources = Array.isArray(usage.dropped_by)
        ? usage.dropped_by.filter((source): source is DropSourceWithLocation => Boolean(source && typeof source === 'object'))
        : [];
      const dropLocationRefs = dropSources
        .map(getDropSourceLocation)
        .filter((location) => location.key && location.name && location.name !== 'Unknown');
      const resourceLocations = getResourceLocationsForItem(item.name);
      const gatheringActionSource = getGatheringActionSource(item.name);
      const hasFarmableSource = resourceLocations.length > 0 || Boolean(gatheringActionSource);
      const hasDefaultCraft = isDefaultAlchemyCraft(usage.produced_from);
      const dropLocations = Array.from(
        new Set([
          ...dropLocationRefs.map((location) => location.name).filter(Boolean),
          ...resourceLocations.map((location) => location.name),
          ...(gatheringActionSource ? [gatheringActionSource.skill] : []),
        ]),
      ) as string[];
      const dropLocationKeys = Array.from(
        new Set([
          ...dropLocationRefs.map((location) => location.key).filter(Boolean),
          ...resourceLocations.map((location) => location.key),
          ...(gatheringActionSource ? [gatheringActionSource.skill.toLowerCase()] : []),
        ]),
      ) as string[];
      const droppedByCount = dropSources.length;
      const usedInCount = Array.isArray(usage.required_for) ? usage.required_for.length : 0;
      const merchantBuyPrice = getMerchantBuyPrice(item.name);
      const vendorPrice = Number(market.vendor_price || full.vendor_price || 0);
      const rawMarketPrice = getSafeMarketValue(market);
      const marketVolume = Number(market.vol_3 || 0);
      const description = full.description || '';
      const tradeable =
        !isForcedUntradableItem(item.name)
        && Boolean(full.is_tradeable ?? rawMarketPrice > 0)
        && !descriptionMarksNonTradeable(description);
      const marketPrice = tradeable ? rawMarketPrice : 0;
      const liquidity = getMarketLiquidity({ ...market, is_tradeable: tradeable });
      const marketConfidence = getMarketConfidence({
        name: item.name,
        type: item.type,
        quality: item.quality,
        marketPrice,
        vendorValue: Math.max(vendorPrice, merchantBuyPrice),
        liquidity,
        tradeable,
      });
      const loreCount = getAllLoreForItem(item.name, loreDataset).length;
      const requiredLevel = getRequiredLevel(full);
      const isSecondaryProduction =
        SECONDARY_PRODUCTION_TYPES.has(item.type)
        || (item.type === 'CONSTRUCTION_MATERIAL' && CONSTRUCTION_OUTPUT_PATTERN.test(item.name));
      const isLegacy = isLegacyItem({
        name: item.name,
        type: item.type,
        tradeable,
        usedInCount,
      });

      const enriched = {
        ...item,
        description,
        marketPrice,
        marketVolume,
        stableMarketVolume: liquidity.stableVolume3d || marketVolume,
        liquidity,
        requiredLevel,
        requirementsText: formatRequirements(full),
        vendorPrice,
        merchantBuyPrice,
        tradeable,
        hasMarket: tradeable && marketPrice > 0,
        isLegacy,
        marketConfidence,
        hasRecipe: Boolean(full.recipe || usage.produced_from),
        hasDefaultCraft,
        isSecondaryProduction,
        hasStats: Boolean(full.stats && Object.keys(full.stats).length > 0),
        hasEffects: Boolean(
          full.effects && (Array.isArray(full.effects) ? full.effects.length > 0 : Object.keys(full.effects).length > 0),
        ),
        hasLore: loreCount > 0,
        loreCount,
        dropLocations,
        dropLocationKeys,
        resourceLocations,
        gatheringActionSource,
        hasFarmableSource,
        droppedByCount,
        usedInCount,
        usageScore:
          droppedByCount
          + usedInCount
          + resourceLocations.length
          + (gatheringActionSource ? 1 : 0)
          + (usage.produced_from ? 1 : 0),
      };
      const searchText = buildItemSearchText(enriched);
      return {
        ...enriched,
        searchText,
        searchWords: tokenizeSearchText(searchText),
      };
    });
  }, [index, allItemsDb, marketData, usageMap, loreDataset]);

  const types = useMemo(() => {
    const t = new Set(enrichedItems.map((i) => i.type).filter(Boolean));
    return ['ALL', ...Array.from(t).sort()];
  }, [enrichedItems]);

  const qualities = useMemo(() => {
    const q = new Set(enrichedItems.map((i) => i.quality).filter(Boolean));
    return ['ALL', ...Array.from(q).sort((a, b) => getQualityRank(a) - getQualityRank(b))];
  }, [enrichedItems]);

  const typeOptions = useMemo<FilterOption<string>[]>(
    () => types.map((type) => ({ value: type, label: type === 'ALL' ? 'All types' : formatLabel(type) })),
    [types],
  );

  const qualityOptions = useMemo<FilterOption<string>[]>(
    () =>
      qualities.map((quality) => ({
        value: quality,
        label: quality === 'ALL' ? 'All qualities' : quality,
        qualityTone: quality === 'ALL' ? undefined : quality,
      })),
    [qualities],
  );

  const locationOptions = useMemo<FilterOption<string>[]>(
    () =>
      buildDropLocationOptions(usageMap, true).map((option) => ({
        value: option.value,
        label: option.value === 'ALL' ? 'All source locations' : option.label,
      })),
    [usageMap],
  );

  const stats = useMemo<ItemDbStats>(() => {
    return enrichedItems.reduce(
      (counts, item) => {
        if (item.hasMarket) counts.marketListed += 1;
        if (item.hasRecipe) counts.craftable += 1;
        if (item.usedInCount > 0) counts.used += 1;
        if (item.hasLore) counts.loreLinked += 1;
        return counts;
      },
      { marketListed: 0, craftable: 0, used: 0, loreLinked: 0 },
    );
  }, [enrichedItems]);

  return {
    index,
    usageMap,
    loadError,
    loading,
    enrichedItems,
    types,
    qualities,
    typeOptions,
    qualityOptions,
    locationOptions,
    stats,
    openItem,
  };
}
