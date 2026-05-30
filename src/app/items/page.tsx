'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense, useDeferredValue } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  Hammer,
  LockKeyhole,
  MapPin,
  Package,
  Search,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import { useItemModal } from '@/context/ItemModalContext';
import { useData } from '@/context/DataContext';
import { GameImage } from '@/components/GameImage';
import { ErrorState, LoadingState, NoResultsState } from '@/components/StateBlock';
import ZenithIcon from '@/components/icons/ZenithIcon';
import { getAllLoreForItem } from '@/data/lore';
import { formatItemTypeLabel, isForcedUntradableItem, isLegacyItem } from '@/lib/item-display';
import {
  buildDropLocationOptions,
  getDropSourceLocation,
  getResourceLocationsForItem,
  type DropSourceWithLocation,
  type GatheredResourceLocation,
} from '@/lib/locations';
import { getMarketLiquidity, getSafeMarketValue, type MarketLiquidityInfo } from '@/lib/market-pricing';
import { getMerchantBuyPrice } from '@/constants';
import { loadUsageMap } from '@/lib/usage-map';
import { getQualityColor, getQualityRank, getQualityTextStyle } from '@/lib/quality';

interface SearchIndexItem {
  id: string;
  name: string;
  type: string;
  quality: string;
  image: string;
}

type SortKey = 'volume' | 'price' | 'name' | 'quality' | 'type' | 'vendor' | 'usage' | 'requiredLevel';
type SignalFilter = 'ALL' | 'MARKET' | 'PRICE_SWINGS' | 'VENDOR' | 'UNTRADABLE' | 'LEGACY' | 'CRAFTABLE' | 'PRODUCED' | 'USED' | 'DROPPED' | 'FARMABLE' | 'EQUIPMENT' | 'EFFECTS' | 'LORE';
type ViewMode = 'table' | 'cards';
type FilterOption<T extends string> = { value: T; label: string; qualityTone?: string };

type UsageEntry = {
  dropped_by?: DropSourceWithLocation[];
  required_for?: unknown[];
  produced_from?: unknown;
  shops?: unknown[];
};

type EnrichedItem = SearchIndexItem & {
  description: string;
  marketPrice: number;
  marketVolume: number;
  stableMarketVolume: number;
  liquidity: MarketLiquidityInfo;
  marketConfidence: MarketConfidence;
  requiredLevel: number;
  requirementsText: string;
  vendorPrice: number;
  merchantBuyPrice: number;
  tradeable: boolean;
  hasMarket: boolean;
  isLegacy: boolean;
  hasRecipe: boolean;
  hasDefaultCraft: boolean;
  isSecondaryProduction: boolean;
  hasStats: boolean;
  hasEffects: boolean;
  hasLore: boolean;
  loreCount: number;
  dropLocations: string[];
  dropLocationKeys: string[];
  resourceLocations: GatheredResourceLocation[];
  gatheringActionSource: GatheringActionSource | null;
  hasFarmableSource: boolean;
  droppedByCount: number;
  usedInCount: number;
  usageScore: number;
  searchText: string;
  searchWords: string[];
};

type GatheringActionSource = {
  skill: string;
  level: number;
  note: string;
};

type MarketConfidence = {
  label: 'Likely market' | 'Check listings' | 'Vendor safer' | 'Needs recent sales' | 'No market';
  tone: 'good' | 'warn' | 'bad' | 'muted';
  note: string;
};

function getNumericRequirementEntries(item: Record<string, any>) {
  const requirements = item.requirements;
  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) return [];
  return Object.entries(requirements)
    .map(([name, value]) => [name, Number(value)] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0);
}

function getRequiredLevel(item: Record<string, any>) {
  const requirementValues = getNumericRequirementEntries(item).map(([, value]) => value);
  const directValues = [item.required_level, item.requiredLevel, item.item_level, item.level]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return Math.max(0, ...requirementValues, ...directValues);
}

function formatRequirements(item: Record<string, any>) {
  const entries = getNumericRequirementEntries(item);
  if (entries.length === 0) return '';
  return entries
    .map(([name, value]) => `${formatLabel(name)} ${value}`)
    .join(' / ');
}

function isRareManualMarketItem(name: string, type: string, quality: string) {
  const normalizedType = String(type || '').toUpperCase();
  const normalizedQuality = String(quality || '').toUpperCase();
  return normalizedType === 'PET_EGG' || (/ Egg$/i.test(name) && normalizedQuality === 'MYTHIC');
}

function isRareOrLimitedHistoryItem(type: string, quality: string) {
  const normalizedType = String(type || '').toUpperCase();
  const normalizedQuality = String(quality || '').toUpperCase();
  return normalizedQuality === 'UNIQUE'
    || normalizedQuality === 'MYTHIC'
    || normalizedType === 'RELIC'
    || normalizedType === 'PET_EGG';
}

function descriptionMarksNonTradeable(description: string) {
  return /cannot sell (?:it )?on the market|not tradable|not tradeable|untradable/i.test(description);
}

function getMarketConfidence({
  name,
  type,
  quality,
  marketPrice,
  vendorValue,
  liquidity,
  tradeable,
}: {
  name: string;
  type: string;
  quality: string;
  marketPrice: number;
  vendorValue: number;
  liquidity: MarketLiquidityInfo;
  tradeable: boolean;
}): MarketConfidence {
  if (!tradeable) {
    return {
      label: 'No market',
      tone: 'muted',
      note: 'This item is not tradeable, so market history is not a sell path.',
    };
  }
  const rareManualMarketItem = isRareManualMarketItem(name, type, quality);
  if (marketPrice <= 0) {
    if (rareManualMarketItem || isRareOrLimitedHistoryItem(type, quality)) {
      return {
        label: 'Check listings',
        tone: 'warn',
        note: 'Rare or limited-history items need manual review; vendor value is only a floor, not the recommended exit.',
      };
    }
    return vendorValue > 0
      ? {
        label: 'Vendor safer',
        tone: 'warn',
        note: 'No usable market price was found; vendor value is the clearer fallback.',
      }
      : {
        label: 'No market',
        tone: 'muted',
        note: 'No usable market price or vendor fallback was found.',
      };
  }
  if (liquidity.label === 'No sales' || liquidity.stableVolume3d <= 0) {
    return {
      label: 'Needs recent sales',
      tone: 'bad',
      note: 'A market price exists, but recent sold volume is missing. Check current listings before treating market as the best exit.',
    };
  }
  if (
    !rareManualMarketItem
    && vendorValue > 0
    && vendorValue >= marketPrice * 0.85
    && (liquidity.tone === 'thin' || liquidity.tone === 'none' || liquidity.tone === 'risk' || liquidity.hasVolumeSwings || liquidity.hasPriceSwings)
  ) {
    return {
      label: 'Vendor safer',
      tone: 'warn',
      note: 'Vendor value is close enough to the market price that it may be safer than waiting on an unstable or thin market.',
    };
  }
  if (liquidity.tone === 'active' && !liquidity.hasVolumeSwings && !liquidity.hasPriceSwings && !liquidity.isSpikeRisk) {
    return {
      label: 'Likely market',
      tone: 'good',
      note: 'Recent stable sold pace is high enough that market is the clearer public exit path.',
    };
  }
  if (liquidity.tone === 'steady' && !liquidity.hasVolumeSwings && !liquidity.hasPriceSwings && !liquidity.isSpikeRisk) {
    return {
      label: 'Likely market',
      tone: 'good',
      note: 'Recent stable sold pace is moderate; market is plausible, but still check current listings for expensive batches.',
    };
  }
  return {
    label: 'Check listings',
    tone: 'warn',
    note: 'Market data has low volume, price spread, volume spikes, or guarded price history. Check current listings before using market as the best path.',
  };
}

const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: 'requiredLevel', label: 'Required Level' },
  { value: 'quality', label: 'Rarity' },
  { value: 'volume', label: 'Stable Volume' },
  { value: 'price', label: 'Market Price' },
  { value: 'usage', label: 'Usage' },
  { value: 'vendor', label: 'Vendor Value' },
  { value: 'type', label: 'Type' },
  { value: 'name', label: 'Name' },
];

const SIGNAL_OPTIONS: FilterOption<SignalFilter>[] = [
  { value: 'ALL', label: 'All tags' },
  { value: 'MARKET', label: 'Market listed' },
  { value: 'PRICE_SWINGS', label: 'Price swings' },
  { value: 'VENDOR', label: 'Merchant source' },
  { value: 'UNTRADABLE', label: 'Untradable' },
  { value: 'LEGACY', label: 'Legacy / old' },
  { value: 'CRAFTABLE', label: 'Craftable' },
  { value: 'PRODUCED', label: 'Produced' },
  { value: 'USED', label: 'Used in recipes' },
  { value: 'DROPPED', label: 'Dropped by enemies' },
  { value: 'FARMABLE', label: 'Farmable' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'EFFECTS', label: 'Has effects' },
  { value: 'LORE', label: 'Has lore' },
];

const EQUIPMENT_TYPES = new Set([
  'SWORD',
  'DAGGER',
  'BOW',
  'SHIELD',
  'HELMET',
  'CHESTPLATE',
  'GREAVES',
  'BOOTS',
  'GAUNTLETS',
  'AMULET',
  'RING',
]);

const SECONDARY_PRODUCTION_TYPES = new Set(['METAL_BAR', 'FOOD']);
const CONSTRUCTION_OUTPUT_PATTERN = /\b(plank|beam|brick|glass|fitting)\b/i;
const GATHERING_ACTION_ITEMS: Record<string, GatheringActionSource> = {
  clay: {
    skill: 'Construction',
    level: 1,
    note: 'Gathered directly through Construction; no world location is currently mapped.',
  },
  sand: {
    skill: 'Construction',
    level: 1,
    note: 'Gathered directly through Construction; no world location is currently mapped.',
  },
};

function getGatheringActionSource(itemName: string): GatheringActionSource | null {
  return GATHERING_ACTION_ITEMS[itemName.trim().toLowerCase()] || null;
}

function isDefaultAlchemyCraft(producedFrom: unknown) {
  return Boolean(
    producedFrom
    && typeof producedFrom === 'object'
    && 'source' in producedFrom
    && producedFrom.source === 'DEFAULT_ALCHEMY',
  );
}

function tokenizeSearchText(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function buildItemSearchText(item: {
  name: string;
  type: string;
  quality: string;
  description: string;
  requirementsText: string;
  dropLocations: string[];
  requiredLevel: number;
  hasFarmableSource: boolean;
  hasRecipe: boolean;
  hasDefaultCraft: boolean;
  isSecondaryProduction: boolean;
  hasMarket: boolean;
  marketConfidence: MarketConfidence;
  liquidity: MarketLiquidityInfo;
  tradeable: boolean;
  isLegacy: boolean;
  merchantBuyPrice: number;
  hasStats: boolean;
  hasEffects: boolean;
  hasLore: boolean;
}) {
  return [
    item.name,
    item.type,
    formatLabel(item.type),
    item.quality,
    item.description,
    item.requirementsText,
    item.dropLocations.join(' '),
    item.hasFarmableSource ? 'farmable gathered resource map location skill action construction' : '',
    item.requiredLevel ? `level ${item.requiredLevel}` : '',
    item.hasRecipe ? 'craftable recipe' : '',
    item.hasDefaultCraft ? 'default alchemy craft learned by default no recipe item required' : '',
    item.isSecondaryProduction ? 'produced secondary production processed output bar food construction material' : '',
    item.hasMarket ? 'market listed tradeable' : '',
    item.marketConfidence.label,
    item.liquidity.label,
    item.liquidity.hasPriceSwings ? 'price swings wide price spread unstable sale prices recent trades' : '',
    item.liquidity.hasVolumeSwings ? 'volume swings bulk sale unusual sales outlier' : '',
    !item.tradeable ? 'untradable non tradeable' : '',
    item.isLegacy ? 'legacy deprecated old unused retired archive' : '',
    item.merchantBuyPrice > 0 ? 'merchant source merchant item vendor buy vendor linked' : '',
    item.hasStats ? 'stats equipment gear' : '',
    item.hasEffects ? 'effects buff potion essence' : '',
    item.hasLore ? 'lore thread valaron archive' : '',
  ].join(' ').toLowerCase();
}

function matchesSearchToken(item: EnrichedItem, token: string) {
  if (token.length <= 3) {
    return item.searchWords.some((word) => word.startsWith(token));
  }
  return item.searchWords.some((word) => word.startsWith(token)) || item.name.toLowerCase().includes(token);
}

function getMarketWarningLabel(item: EnrichedItem) {
  if (item.liquidity.hasVolumeSwings && item.liquidity.hasPriceSwings) return 'Volume and price swings';
  if (item.liquidity.hasVolumeSwings) return 'Volume swings';
  if (item.liquidity.hasPriceSwings) return 'Price swings';
  return '';
}

const formatGold = (value: number) => {
  if (!value) return '-';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: value < 100 ? 2 : 0 })}g`;
};

const formatLabel = formatItemTypeLabel;
const ITEM_DB_VIEW_STORAGE_KEY = 'zenith_items_view_mode';
const DESKTOP_ITEM_BATCH_SIZE = 48;
const MOBILE_ITEM_BATCH_SIZE = 36;
const COMPACT_BADGE_LIMIT = 4;

function ItemsArchiveContent() {
  const searchParams = useSearchParams();
  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, UsageEntry>>({});
  const [searchTerm, setSearchTerm] = useState('');
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const { openItem } = useItemModal();
  const { marketData, allItemsDb, loading } = useData();
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
    let cancelled = false;
    Promise.all([
      fetch('/search-index.json').then(r => r.ok ? r.json() : Promise.reject(new Error('Search index unavailable'))),
      loadUsageMap<Record<string, UsageEntry>>(),
    ])
      .then(([indexData, usageData]) => {
        if (cancelled) return;
        setIndex(indexData);
        setUsageMap(usageData);
        setLoadError(null);

        const nameParam = searchParams.get('name');
        const idParam = searchParams.get('id');

        if (idParam) {
          openItem(idParam);
        } else if (nameParam) {
          setSearchTerm(nameParam);
          const found = indexData.find((i: SearchIndexItem) => i.name.toLowerCase() === nameParam.toLowerCase());
          if (found) openItem(found.id);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Item index failed to load.');
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, openItem]);

  useEffect(() => {
    setVisibleCount(itemBatchSize);
  }, [itemBatchSize, searchTerm, selectedType, selectedQuality, selectedSignal, selectedLocation, sortBy, sortDesc, hideNonMarket]);

  const enrichedItems = useMemo<EnrichedItem[]>(() => {
    return index.map(item => {
      const full = allItemsDb?.[item.name] || {};
      const market = marketData?.[item.name] || {};
      const usage = usageMap[item.name] || {};
      const dropSources = Array.isArray(usage.dropped_by)
        ? usage.dropped_by.filter((source): source is DropSourceWithLocation => Boolean(source && typeof source === 'object'))
        : [];
      const dropLocationRefs = dropSources.map(getDropSourceLocation).filter(location => location.key && location.name && location.name !== 'Unknown');
      const resourceLocations = getResourceLocationsForItem(item.name);
      const gatheringActionSource = getGatheringActionSource(item.name);
      const hasFarmableSource = resourceLocations.length > 0 || Boolean(gatheringActionSource);
      const hasDefaultCraft = isDefaultAlchemyCraft(usage.produced_from);
      const dropLocations = Array.from(new Set([
        ...dropLocationRefs.map(location => location.name).filter(Boolean),
        ...resourceLocations.map(location => location.name),
        ...(gatheringActionSource ? [gatheringActionSource.skill] : []),
      ])) as string[];
      const dropLocationKeys = Array.from(new Set([
        ...dropLocationRefs.map(location => location.key).filter(Boolean),
        ...resourceLocations.map(location => location.key),
        ...(gatheringActionSource ? [gatheringActionSource.skill.toLowerCase()] : []),
      ])) as string[];
      const droppedByCount = dropSources.length;
      const usedInCount = Array.isArray(usage.required_for) ? usage.required_for.length : 0;
      const merchantBuyPrice = getMerchantBuyPrice(item.name);
      const vendorPrice = Number(market.vendor_price || full.vendor_price || 0);
      const rawMarketPrice = getSafeMarketValue(market);
      const marketVolume = Number(market.vol_3 || 0);
      const description = full.description || '';
      const tradeable = !isForcedUntradableItem(item.name)
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
      const loreCount = getAllLoreForItem(item.name).length;
      const requiredLevel = getRequiredLevel(full);
      const isSecondaryProduction = SECONDARY_PRODUCTION_TYPES.has(item.type)
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
        hasEffects: Boolean(full.effects && (Array.isArray(full.effects) ? full.effects.length > 0 : Object.keys(full.effects).length > 0)),
        hasLore: loreCount > 0,
        loreCount,
        dropLocations,
        dropLocationKeys,
        resourceLocations,
        gatheringActionSource,
        hasFarmableSource,
        droppedByCount,
        usedInCount,
        usageScore: droppedByCount + usedInCount + resourceLocations.length + (gatheringActionSource ? 1 : 0) + (usage.produced_from ? 1 : 0),
      };
      const searchText = buildItemSearchText(enriched);
      return {
        ...enriched,
        searchText,
        searchWords: tokenizeSearchText(searchText),
      };
    });
  }, [index, allItemsDb, marketData, usageMap]);

  const types = useMemo(() => {
    const t = new Set(enrichedItems.map(i => i.type).filter(Boolean));
    return ['ALL', ...Array.from(t).sort()];
  }, [enrichedItems]);

  const qualities = useMemo(() => {
    const q = new Set(enrichedItems.map(i => i.quality).filter(Boolean));
    return ['ALL', ...Array.from(q).sort((a, b) => getQualityRank(a) - getQualityRank(b))];
  }, [enrichedItems]);
  const typeOptions = useMemo<FilterOption<string>[]>(
    () => types.map((type) => ({ value: type, label: type === 'ALL' ? 'All types' : formatLabel(type) })),
    [types],
  );
  const qualityOptions = useMemo<FilterOption<string>[]>(
    () => qualities.map((quality) => ({
      value: quality,
      label: quality === 'ALL' ? 'All qualities' : quality,
      qualityTone: quality === 'ALL' ? undefined : quality,
    })),
    [qualities],
  );
  const locationOptions = useMemo<FilterOption<string>[]>(
    () => buildDropLocationOptions(usageMap, true).map((option) => ({
      value: option.value,
      label: option.value === 'ALL' ? 'All source locations' : option.label,
    })),
    [usageMap],
  );

  useEffect(() => {
    if (selectedLocation === 'ALL') return;
    if (!locationOptions.some(option => option.value === selectedLocation)) {
      setSelectedLocation('ALL');
    }
  }, [locationOptions, selectedLocation]);

  const filteredItems = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    const filtered = enrichedItems.filter(item => {
      const matchSearch = tokens.length === 0 || tokens.every(token => matchesSearchToken(item, token));
      const matchType = selectedType === 'ALL' || item.type === selectedType;
      const matchQuality = selectedQuality === 'ALL' || item.quality === selectedQuality;
      const matchLocation = selectedLocation === 'ALL' || item.dropLocationKeys.includes(selectedLocation);
      const matchMarketVisibility = !hideNonMarket
        || item.hasMarket
        || (selectedSignal === 'VENDOR' && item.merchantBuyPrice > 0)
        || (selectedSignal === 'UNTRADABLE' && !item.tradeable)
        || (selectedSignal === 'LEGACY' && item.isLegacy);
      const matchSignal =
        selectedSignal === 'ALL' ||
        (selectedSignal === 'MARKET' && item.hasMarket) ||
        (selectedSignal === 'PRICE_SWINGS' && item.liquidity.hasPriceSwings) ||
        (selectedSignal === 'VENDOR' && item.merchantBuyPrice > 0) ||
        (selectedSignal === 'UNTRADABLE' && !item.tradeable) ||
        (selectedSignal === 'LEGACY' && item.isLegacy) ||
        (selectedSignal === 'CRAFTABLE' && item.hasRecipe) ||
        (selectedSignal === 'PRODUCED' && item.isSecondaryProduction) ||
        (selectedSignal === 'USED' && item.usedInCount > 0) ||
        (selectedSignal === 'DROPPED' && item.droppedByCount > 0) ||
        (selectedSignal === 'FARMABLE' && item.hasFarmableSource) ||
        (selectedSignal === 'EQUIPMENT' && (EQUIPMENT_TYPES.has(item.type) || item.hasStats)) ||
        (selectedSignal === 'EFFECTS' && item.hasEffects) ||
        (selectedSignal === 'LORE' && item.hasLore);

      return matchSearch && matchType && matchQuality && matchLocation && matchMarketVisibility && matchSignal;
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
  }, [enrichedItems, deferredSearchTerm, selectedType, selectedQuality, selectedSignal, selectedLocation, hideNonMarket, sortBy, sortDesc]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );
  const showCardLayout = isCompactViewport || viewMode === 'cards';
  const showTableLayout = !isCompactViewport && viewMode === 'table';

  const stats = useMemo(() => {
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
  const activeAdvancedFilterCount = [
    selectedType !== 'ALL',
    selectedQuality !== 'ALL',
    selectedSignal !== 'ALL',
    selectedLocation !== 'ALL',
  ].filter(Boolean).length;
  const advancedFilterStatus = activeAdvancedFilterCount > 0
    ? `${activeAdvancedFilterCount} active`
    : 'All items';

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(prev => !prev);
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

  const open = (item: EnrichedItem) => openItem(item.id);

  const renderSortHeader = (key: SortKey, label: string, align: 'left' | 'right' = 'right') => {
    const active = sortBy === key;
    return (
      <th className={align === 'left' ? 'left' : undefined} aria-sort={active ? (sortDesc ? 'descending' : 'ascending') : 'none'}>
        <button
          type="button"
          className={`sort-header-button ${active ? 'active' : ''}`}
          aria-label={`Sort by ${label}${active ? `, currently ${sortDesc ? 'descending' : 'ascending'}` : ''}`}
          onClick={() => handleSort(key)}
        >
          <span>{label}</span>
          <span aria-hidden="true" className="sort-indicator">
            {active ? (sortDesc ? <ArrowDown size={13} /> : <ArrowUp size={13} />) : <ArrowDownUp size={13} />}
          </span>
        </button>
      </th>
    );
  };

  const renderBadges = (item: EnrichedItem) => (
    <div className="item-badges">
      {item.tradeable && (
        <span className={`badge market ${item.liquidity.tone}`} title={item.liquidity.note}>
          <ShoppingCart size={12} aria-hidden="true" /> <span>{item.liquidity.label}</span>
        </span>
      )}
      {item.tradeable && (
        <span className={`badge confidence ${item.marketConfidence.tone}`} title={item.marketConfidence.note}>
          {item.marketConfidence.label === 'Likely market'
            ? <Check size={12} aria-hidden="true" />
            : item.marketConfidence.label === 'Vendor safer'
              ? <Store size={12} aria-hidden="true" />
              : <AlertTriangle size={12} aria-hidden="true" />}
          <span>{item.marketConfidence.label}</span>
        </span>
      )}
      {item.liquidity.hasVolumeSwings && (
        <span className="badge warning" title="Sold volume has unusual bulk-sale days. This is a volume warning, not a price-stability label.">
          <AlertTriangle size={12} aria-hidden="true" /> <span>Volume swings</span>
        </span>
      )}
      {item.liquidity.hasPriceSwings && (
        <span className="badge warning" title={`Recent sold prices range from ${formatGold(item.liquidity.latestSaleMin)} to ${formatGold(item.liquidity.latestSaleMax)}. Check recent trades/listings before bulk buying or crafting.`}>
          <AlertTriangle size={12} aria-hidden="true" /> <span>Price swings</span>
        </span>
      )}
      {item.merchantBuyPrice > 0 && <span className="badge vendor" title={`Merchant purchase price: ${formatGold(item.merchantBuyPrice)}`}><Store size={12} aria-hidden="true" /> <span>Merchant item</span></span>}
      {!item.tradeable && <span className="badge untradable"><LockKeyhole size={12} aria-hidden="true" /> <span>Untradable</span></span>}
      {item.isLegacy && (
        <span className="badge legacy" title="Old or retired item data. It is kept searchable, but sorted below active items by default.">
          <Package size={12} aria-hidden="true" /> <span>Legacy</span>
        </span>
      )}
      {item.hasRecipe && (
        <span className="badge craft" title={item.hasDefaultCraft ? 'Learned by default; no recipe item required.' : 'Crafted from a recipe or production source.'}>
          <Hammer size={12} aria-hidden="true" /> <span>{item.hasDefaultCraft ? 'Default craft' : 'Craft'}</span>
        </span>
      )}
      {item.isSecondaryProduction && <span className="badge produced"><Boxes size={12} aria-hidden="true" /> <span>Produced</span></span>}
      {item.hasFarmableSource && (
        <span className="badge source" title={item.gatheringActionSource?.note || 'Mapped gathered resource location.'}>
          {item.gatheringActionSource ? <Hammer size={12} aria-hidden="true" /> : <MapPin size={12} aria-hidden="true" />}
          <span>Farmable</span>
        </span>
      )}
      {(EQUIPMENT_TYPES.has(item.type) || item.hasStats) && <span className="badge gear"><Shield size={12} aria-hidden="true" /> <span>Gear</span></span>}
      {item.hasEffects && <span className="badge effect"><Boxes size={12} aria-hidden="true" /> <span>Effect</span></span>}
      {item.hasLore && <span className="badge lore"><BookOpen size={12} aria-hidden="true" /> <span>Lore</span></span>}
    </div>
  );

  const renderCompactBadges = (item: EnrichedItem) => {
    const badges: { key: string; label: string; className: string; title?: string }[] = [];
    if (item.tradeable) {
      badges.push({
        key: 'confidence',
        label: item.marketConfidence.label,
        className: `confidence ${item.marketConfidence.tone}`,
        title: item.marketConfidence.note,
      });
    }
    if (item.merchantBuyPrice > 0) {
      badges.push({ key: 'vendor', label: 'Merchant', className: 'vendor', title: `Merchant purchase price: ${formatGold(item.merchantBuyPrice)}` });
    }
    if (!item.tradeable) {
      badges.push({ key: 'untradable', label: 'Untradable', className: 'untradable' });
    }
    if (item.hasRecipe) {
      badges.push({ key: 'craft', label: item.hasDefaultCraft ? 'Default craft' : 'Craft', className: 'craft' });
    }
    if (item.hasFarmableSource) {
      badges.push({ key: 'source', label: 'Farmable', className: 'source', title: item.gatheringActionSource?.note || 'Mapped gathered resource location.' });
    }
    if (item.liquidity.hasPriceSwings || item.liquidity.hasVolumeSwings) {
      badges.push({ key: 'warning', label: getMarketWarningLabel(item), className: 'warning', title: item.liquidity.note });
    }
    if (item.hasLore) {
      badges.push({ key: 'lore', label: `Lore${item.loreCount > 1 ? ` ${item.loreCount}` : ''}`, className: 'lore' });
    }
    if (item.isLegacy) {
      badges.push({ key: 'legacy', label: 'Legacy', className: 'legacy' });
    }

    const visibleBadges = badges.slice(0, COMPACT_BADGE_LIMIT);
    const hiddenCount = badges.length - visibleBadges.length;

    return (
      <div className="item-badges compact">
        {visibleBadges.map((badge) => (
          <span key={badge.key} className={`badge ${badge.className}`} title={badge.title}>
            <span>{badge.label}</span>
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="badge muted" title={badges.slice(COMPACT_BADGE_LIMIT).map((badge) => badge.label).join(', ')}>
            <span>+{hiddenCount}</span>
          </span>
        )}
      </div>
    );
  };

  return (
    <main className="container items-db-page">
      <div className="header">
        <h1 className="header-title">
          <ZenithIcon name="items" size={24} style={{ color: "var(--text-accent)" }} /> Item Database
        </h1>
        <div className="header-status">
          <div className="status-dot"></div>
          <span className="mono">{index.length.toLocaleString()} ITEMS CATALOGED</span>
        </div>
      </div>

      <section aria-label="Item database summary metrics" className="db-summary" tabIndex={0}>
        <div>
          <span className="summary-label">Market listed</span>
          <strong>{stats.marketListed.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Craftable</span>
          <strong>{stats.craftable.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Recipe uses</span>
          <strong>{stats.used.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Lore linked</span>
          <strong>{stats.loreLinked.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Filtered items</span>
          <strong>{filteredItems.length.toLocaleString()}</strong>
        </div>
      </section>

      <details className="item-help">
        <summary>
          <ShoppingCart size={16} />
          <span>Market labels</span>
        </summary>
        <div className="item-help-body" aria-label="Item tag definitions">
          <span><strong>No sales</strong> means tradeable, but no usable recent sale volume.</span>
          <span><strong>Vendor safer</strong> means vendor value is clearer than a thin market.</span>
          <span><strong>Merchant item</strong> means bought from an NPC merchant.</span>
          <span><strong>Untradable</strong> means the item is not a market exit path.</span>
        </div>
      </details>

      <section className="db-controls">
        <div className="control-group search-control">
          <label className="control-label">Search</label>
          <ItemSearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search item, material, or source"
          />
        </div>

        <div className="control-group sort-control">
          <label className="control-label">Sort</label>
          <ItemFilterPicker
            ariaLabel="Item sort"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={handleSortPickerChange}
          />
        </div>

        <button type="button" className="control-input icon-toggle sort-direction-toggle" onClick={() => setSortDesc(prev => !prev)}>
          <ArrowDownUp size={15} /> {sortDesc ? 'Desc' : 'Asc'}
        </button>

        <button
          type="button"
          className={`control-input icon-toggle market-toggle ${hideNonMarket ? 'active' : ''}`}
          aria-pressed={hideNonMarket}
          onClick={() => setHideNonMarket(prev => !prev)}
        >
          <ShoppingCart size={15} /> Market
        </button>

        <details className="advanced-filter-panel" open={!isCompactViewport ? true : undefined}>
          <summary>
            <span>
              <SlidersHorizontal size={15} aria-hidden="true" />
              Filters
            </span>
            <small>{advancedFilterStatus}</small>
            <ChevronDown size={15} aria-hidden="true" />
          </summary>
          <div className="advanced-filter-grid">
            <div className="control-group">
              <label className="control-label">Type</label>
              <ItemFilterPicker
                ariaLabel="Item type filter"
                options={typeOptions}
                value={selectedType}
                onChange={handleTypeChange}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Quality</label>
              <ItemFilterPicker
                ariaLabel="Item quality filter"
                options={qualityOptions}
                value={selectedQuality}
                onChange={setSelectedQuality}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Tag</label>
              <ItemFilterPicker
                ariaLabel="Item tag filter"
                options={SIGNAL_OPTIONS}
                value={selectedSignal}
                onChange={setSelectedSignal}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Source</label>
              <ItemFilterPicker
                ariaLabel="Item source location filter"
                options={locationOptions}
                value={selectedLocation}
                onChange={setSelectedLocation}
              />
            </div>
          </div>
        </details>

        <div className="view-toggle" role="group" aria-label="View mode">
          <button type="button" className={viewMode === 'table' ? 'active' : ''} aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')}>Table</button>
          <button type="button" className={viewMode === 'cards' ? 'active' : ''} aria-pressed={viewMode === 'cards'} onClick={() => setViewMode('cards')}>Grid</button>
        </div>
      </section>

      {loadError && (
        <ErrorState title="Item data unavailable" description={loadError} />
      )}

      {!loadError && (loading || index.length === 0) && (
        <LoadingState title="Loading item data" description="Preparing the item index, market rows, and relationship map." />
      )}

      {!loadError && index.length > 0 && filteredItems.length === 0 && (
        <NoResultsState
          title="No items match the current filters"
          description="Clear the search, market-only view, or advanced filters to widen the catalog."
          action={(
            <button type="button" className="reset-btn" onClick={() => {
              setSearchTerm('');
              setSelectedType('ALL');
              setSelectedQuality('ALL');
              setSelectedSignal('ALL');
              setSelectedLocation('ALL');
              setHideNonMarket(false);
              setSortBy('volume');
              setSortDesc(true);
            }}>
              Reset filters
            </button>
          )}
        />
      )}

      {!loadError && filteredItems.length > 0 && (
        <>
          <div className="result-meta">
            <span>{visibleItems.length.toLocaleString()} of {filteredItems.length.toLocaleString()} shown</span>
            <span>Sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
          </div>

          {showTableLayout && (
          <div className="desktop-table-shell">
            <table className="items-table">
              <thead>
                <tr>
                  <th className="left">Item</th>
                  {renderSortHeader('type', 'Type')}
                  {renderSortHeader('quality', 'Quality')}
                  {renderSortHeader('requiredLevel', 'Level')}
                  {renderSortHeader('price', 'Market')}
                  {renderSortHeader('vendor', 'Vendor')}
                  {renderSortHeader('volume', 'Stable Vol')}
                  {renderSortHeader('usage', 'Usage')}
                  <th className="center">Tags</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map(item => (
                  <tr
                    aria-label={`Open ${item.name} item details`}
                    key={item.id}
                    onClick={() => open(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        open(item);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <td className="item-cell">
                      <div className="item-cell-inner">
                        <GameImage
                          src={item.image}
                          alt=""
                          width={34}
                          height={34}
                          sizes="34px"
                          loading="lazy"
                          fallbackSrc="/favicon.ico"
                        />
                        <div className="item-copy">
                          <strong>{item.name}</strong>
                          <small>{item.description || 'No description available'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{formatLabel(item.type)}</td>
                    <td style={getQualityTextStyle(item.quality)}>{item.quality}</td>
                    <td className="mono" title={item.requirementsText || undefined}>{item.requiredLevel || '-'}</td>
                    <td className="mono" title={item.marketConfidence.note}>{formatGold(item.marketPrice)}</td>
                    <td className="mono">{formatGold(item.vendorPrice)}</td>
                    <td className={`mono liquidity-volume ${item.liquidity.tone}`} title={item.stableMarketVolume !== item.marketVolume || item.liquidity.hasPriceSwings ? item.liquidity.note : `Raw 3-day volume: ${item.marketVolume.toLocaleString()}`}>
                      {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '-'}
                      {getMarketWarningLabel(item) ? <span className="volume-warning-dot" aria-label={getMarketWarningLabel(item)}>!</span> : null}
                    </td>
                    <td className="mono">{item.usageScore ? item.usageScore.toLocaleString() : '-'}</td>
                    <td className="signals-cell">{renderCompactBadges(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {showCardLayout && (
          <div className="item-grid forced">
            {visibleItems.map(item => (
              <button aria-label={`Open ${item.name} item details`} key={item.id} type="button" onClick={() => open(item)} className="item-card">
                <div className="quality-strip" style={{ '--quality-color': getQualityColor(item.quality) } as React.CSSProperties} />
                <GameImage
                  src={item.image}
                  alt=""
                  width={44}
                  height={44}
                  sizes="44px"
                  loading="lazy"
                  fallbackSrc="/favicon.ico"
                />
                <div className="item-card-body">
                  <div className="card-topline">
                    <span className="card-item-name">{item.name}</span>
                    <ChevronRight size={16} />
                  </div>
                  <div className="card-meta">
                    <span>{formatLabel(item.type)}</span>
                    <span style={getQualityTextStyle(item.quality)}>{item.quality}</span>
                  </div>
                  <div className="card-stats">
                    <span><small>Market</small><strong title={item.marketConfidence.note}>{formatGold(item.marketPrice)}</strong></span>
                    <span><small>Level</small><strong title={item.requirementsText || undefined}>{item.requiredLevel || '-'}</strong></span>
                    <span><small>Stable Vol</small><strong className={`liquidity-volume ${item.liquidity.tone}`}>{item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '-'}{getMarketWarningLabel(item) ? <span className="volume-warning-dot" aria-label={getMarketWarningLabel(item)}>!</span> : null}</strong></span>
                    <span><small>Usage</small><strong>{item.usageScore || '-'}</strong></span>
                  </div>
                  {item.resourceLocations.length > 0 && (
                    <div className="source-preview" aria-label={`${item.name} gathered locations`}>
                      <MapPin size={13} aria-hidden="true" />
                      <span>{item.resourceLocations.slice(0, 2).map(location => location.name).join(', ')}{item.resourceLocations.length > 2 ? ` +${item.resourceLocations.length - 2}` : ''}</span>
                    </div>
                  )}
                  {item.resourceLocations.length === 0 && item.gatheringActionSource && (
                    <div className="source-preview" aria-label={`${item.name} gathered source`}>
                      <Hammer size={13} aria-hidden="true" />
                      <span>{item.gatheringActionSource.skill} Lv.{item.gatheringActionSource.level}</span>
                    </div>
                  )}
                  {renderBadges(item)}
                </div>
              </button>
            ))}
          </div>
          )}

          {visibleItems.length < filteredItems.length && (
            <button type="button" className="load-more" onClick={() => setVisibleCount(count => count + itemBatchSize)}>
              Load {itemBatchSize} more
            </button>
          )}
        </>
      )}

      <style jsx>{`
        .items-db-page {
          padding-bottom: 4rem;
          overflow-x: hidden;
        }
        .db-summary {
          animation: itemSurfaceIn 0.34s ease-out both;
          display: grid;
          gap: 0.55rem;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          margin-bottom: 0.7rem;
        }
        .db-summary div {
          background: rgba(255,255,255,0.018);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          min-height: 70px;
          padding: 0.68rem 0.8rem;
        }
        .db-summary:focus-visible {
          border-radius: 10px;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.18);
          outline: none;
        }
        .summary-label {
          color: var(--text-muted);
          display: block;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .db-summary strong {
          color: #fff;
          display: block;
          font-family: var(--font-mono);
          font-size: 1.12rem;
          margin-top: 0.25rem;
        }
        .item-help {
          animation: itemSurfaceIn 0.34s 0.04s ease-out both;
          background: rgba(56,189,248,0.045);
          border: 1px solid rgba(56,189,248,0.18);
          border-radius: 8px;
          color: var(--text-muted);
          margin: 0 0 0.7rem;
        }
        .item-help summary {
          align-items: center;
          cursor: pointer;
          display: flex;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          list-style: none;
          padding: 0.58rem 0.75rem;
          text-transform: uppercase;
        }
        .item-help summary::-webkit-details-marker {
          display: none;
        }
        .item-help summary svg {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .item-help-body {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          padding: 0 0.75rem 0.7rem;
        }
        .item-help-body span {
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1.25;
          padding: 0.38rem 0.58rem;
        }
        .item-help-body strong {
          color: var(--text-main);
          font-weight: 900;
        }
        .db-controls {
          align-items: end;
          animation: itemSurfaceIn 0.34s 0.08s ease-out both;
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          gap: 0.65rem;
          grid-template-columns:
            minmax(190px, 1fr)
            minmax(190px, 1fr)
            minmax(150px, 0.85fr)
            minmax(96px, 0.45fr)
            minmax(126px, 0.55fr);
          grid-template-areas:
            "search search sort direction view"
            "filters filters filters filters market";
          max-width: 100%;
          min-width: 0;
          padding: 0.75rem;
          position: relative;
          z-index: 30;
        }
        .search-control { grid-area: search; }
        .sort-control { grid-area: sort; }
        .sort-direction-toggle { grid-area: direction; }
        .market-toggle { grid-area: market; }
        .advanced-filter-panel { grid-area: filters; }
        .view-toggle { grid-area: view; }
        .control-group {
          min-width: 0;
        }
        .advanced-filter-panel {
          min-width: 0;
          overflow: visible;
          position: relative;
          z-index: 1;
        }
        .advanced-filter-panel summary {
          display: none;
        }
        .advanced-filter-grid {
          display: grid;
          gap: 0.65rem;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: visible;
        }
        .advanced-filter-panel:not([open]) .advanced-filter-grid {
          display: grid;
        }
        :global(.items-db-page .search-shell) {
          position: relative;
        }
        :global(.items-db-page .search-shell svg) {
          color: var(--text-muted);
          left: 0.75rem;
          pointer-events: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
        }
        :global(.items-db-page .search-shell input) {
          padding-left: 2.35rem;
          width: 100%;
        }
        .db-controls :global(.control-input) {
          min-width: 0;
          width: 100%;
        }
        :global(.items-db-page .item-select) {
          min-width: 0;
          position: relative;
          z-index: 8;
        }
        :global(.items-db-page .item-select.open) {
          z-index: 120;
        }
        :global(.items-db-page .item-select-trigger) {
          align-items: center;
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.012)), var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          color: var(--text-main);
          cursor: pointer;
          display: flex;
          font: inherit;
          font-size: 0.84rem;
          font-weight: 800;
          gap: 0.55rem;
          justify-content: space-between;
          min-height: 38px;
          min-width: 0;
          padding: 0.45rem 0.62rem;
          text-align: left;
          transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
          width: 100%;
        }
        :global(.items-db-page .item-select-trigger:hover) {
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018)), var(--bg-base);
          border-color: rgba(255,255,255,0.14);
        }
        :global(.items-db-page .item-select-trigger:active) {
          transform: translateY(1px);
        }
        :global(.items-db-page .item-select-trigger span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.items-db-page .item-select-trigger svg) {
          color: var(--text-muted);
          flex: 0 0 auto;
        }
        :global(.items-db-page .item-select.open .item-select-trigger),
        :global(.items-db-page .item-select-trigger:focus-visible) {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
          outline: none;
        }
        :global(.items-db-page .item-select-menu) {
          background: color-mix(in srgb, var(--bg-base), black 18%);
          border: 1px solid var(--border-focus);
          border-radius: 8px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.42);
          display: grid;
          gap: 0.25rem;
          left: 0;
          margin-top: 0.35rem;
          max-height: min(var(--item-select-max-height, 320px), 58vh);
          min-width: min(250px, calc(100vw - 2rem));
          overflow-y: auto;
          padding: 0.35rem;
          position: absolute;
          right: auto;
          top: 100%;
          transform-origin: top center;
          animation: itemMenuReveal 0.16s ease-out both;
          z-index: 130;
        }
        :global(.items-db-page .item-select.open-up .item-select-menu) {
          bottom: 100%;
          margin-bottom: 0.35rem;
          margin-top: 0;
          top: auto;
          transform-origin: bottom center;
        }
        :global(.items-db-page .item-select-option) {
          align-items: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: var(--text-main);
          cursor: pointer;
          display: flex;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 800;
          gap: 0.55rem;
          justify-content: space-between;
          min-height: 36px;
          padding: 0.45rem 0.55rem;
          text-align: left;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
          width: 100%;
        }
        :global(.items-db-page .item-select-option:hover),
        :global(.items-db-page .item-select-option.active) {
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
          border-color: rgba(56,189,248,0.24);
        }
        :global(.items-db-page .item-select-option:active) {
          transform: scale(0.99);
        }
        :global(.items-db-page .item-select-option svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .icon-toggle {
          align-items: center;
          cursor: pointer;
          display: flex;
          flex: 0 1 132px;
          gap: 0.4rem;
          justify-content: center;
          min-width: 88px !important;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
          white-space: nowrap;
        }
        .icon-toggle:hover {
          border-color: rgba(255,255,255,0.16);
          color: var(--text-main);
        }
        .icon-toggle:active {
          transform: translateY(1px);
        }
        .market-toggle {
          border-color: rgba(255,255,255,0.08);
          color: var(--text-muted);
        }
        .market-toggle.active {
          border-color: rgba(34,197,94,0.35);
          background: rgba(34,197,94,0.1);
          color: var(--text-success);
        }
        .view-toggle {
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          align-self: end;
          display: flex;
          justify-self: end;
          min-height: 38px;
          overflow: hidden;
          width: max-content;
        }
        .view-toggle button {
          background: transparent;
          border: 0;
          color: var(--text-muted);
          cursor: pointer;
          font-weight: 800;
          min-width: 58px;
          padding: 0 0.8rem;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .view-toggle button:not(.active):hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-main);
        }
        .view-toggle button:active {
          transform: translateY(1px);
        }
        .view-toggle button.active {
          background: var(--text-accent);
          color: #050505;
        }
        .result-meta {
          animation: itemSurfaceIn 0.28s 0.12s ease-out both;
          color: var(--text-muted);
          display: flex;
          font-size: 0.8rem;
          justify-content: space-between;
          margin: 1rem 0 0.65rem;
          position: relative;
          z-index: 1;
        }
        .desktop-table-shell {
          animation: itemSurfaceIn 0.34s 0.14s ease-out both;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          contain: layout paint;
          min-height: 640px;
          overflow: auto;
          position: relative;
          z-index: 1;
        }
        .desktop-table-shell:focus-visible {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
          outline: none;
        }
        .desktop-table-shell.hidden {
          display: none;
        }
        .items-table {
          border-collapse: collapse;
          min-width: 1140px;
          table-layout: fixed;
          width: 100%;
        }
        .items-table th {
          background: #050505;
          color: var(--text-muted);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          padding: 0.85rem;
          text-align: right;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .items-table th.left {
          text-align: left;
        }
        .items-table th.center {
          text-align: center;
        }
        .sort-header-button,
        :global(.items-db-page .sort-header-button) {
          align-items: center;
          background: transparent;
          border: 0;
          color: inherit;
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-weight: 900;
          gap: 0.35rem;
          justify-content: flex-end;
          letter-spacing: inherit;
          padding: 0;
          text-align: inherit;
          text-transform: inherit;
          width: 100%;
        }
        .items-table th:not(.left) .sort-header-button {
          justify-content: center;
        }
        .sort-header-button.active,
        :global(.items-db-page .sort-header-button.active) {
          color: var(--text-accent);
        }
        .sort-header-button:focus-visible,
        :global(.items-db-page .sort-header-button:focus-visible) {
          border-radius: 4px;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.16);
          outline: none;
        }
        .sort-indicator,
        :global(.items-db-page .sort-indicator) {
          align-items: center;
          color: currentColor;
          display: inline-flex;
          flex: 0 0 auto;
          height: 16px;
          justify-content: center;
          line-height: 1;
          opacity: 0.75;
          width: 16px;
        }
        .items-table td {
          background: rgba(255,255,255,0.012);
          border-top: 1px solid rgba(255,255,255,0.035);
          color: var(--text-main);
          font-size: 0.84rem;
          padding: 0.9rem 0.85rem;
          text-align: center;
          vertical-align: middle;
        }
        .items-table th:nth-child(1),
        .items-table td:nth-child(1) { width: 30%; }
        .items-table th:nth-child(2),
        .items-table td:nth-child(2) { width: 11%; }
        .items-table th:nth-child(3),
        .items-table td:nth-child(3) { width: 9%; }
        .items-table th:nth-child(4),
        .items-table td:nth-child(4) { width: 7%; }
        .items-table th:nth-child(5),
        .items-table td:nth-child(5),
        .items-table th:nth-child(6),
        .items-table td:nth-child(6),
        .items-table th:nth-child(7),
        .items-table td:nth-child(7),
        .items-table th:nth-child(8),
        .items-table td:nth-child(8) { width: 8%; }
        .items-table th:nth-child(9),
        .items-table td:nth-child(9) { width: 11%; }
        .items-table tr {
          cursor: pointer;
          transition: background 0.16s ease;
        }
        .items-table tr:hover td,
        .items-table tr:focus-visible td {
          background: color-mix(in srgb, var(--text-accent), transparent 96%);
        }
        .items-table tr:focus-visible td:first-child {
          box-shadow: inset 3px 0 0 var(--text-accent);
        }
        .item-cell {
          min-width: 0;
          text-align: left !important;
        }
        .item-cell-inner {
          align-items: center;
          display: flex;
          gap: 0.75rem;
          min-width: 0;
        }
        .item-cell-inner img {
          border-radius: 6px;
          flex: 0 0 auto;
          height: 34px;
          width: 34px;
        }
        .item-copy {
          min-width: 0;
        }
        .item-copy strong {
          color: #fff;
          display: block;
          font-size: 0.9rem;
          line-height: 1.2;
        }
        .item-copy small {
          color: var(--text-muted);
          display: block;
          margin-top: 0.2rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .signals-cell {
          overflow: hidden;
          text-align: center !important;
        }
        .liquidity-volume.thin {
          color: #fbbf24;
        }
        .liquidity-volume.none {
          color: var(--text-muted);
        }
        .liquidity-volume.steady {
          color: var(--text-accent);
        }
        .liquidity-volume.active {
          color: var(--text-success);
        }
        .liquidity-volume.risk {
          color: var(--text-danger);
        }
        .volume-warning-dot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1rem;
          height: 1rem;
          margin-left: 0.35rem;
          border-radius: 999px;
          background: rgba(251,191,36,0.14);
          color: #fbbf24;
          font-size: 0.68rem;
          font-weight: 900;
          line-height: 1;
          vertical-align: middle;
        }
        :global(.items-db-page .item-badges) {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          justify-content: flex-start;
          min-width: 0;
        }
        :global(.items-db-page .item-badges.compact) {
          align-content: center;
          align-items: center;
          gap: 0.28rem;
          justify-content: center;
          overflow: visible;
        }
        :global(.items-db-page .badge) {
          align-items: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          color: var(--text-muted);
          display: inline-flex;
          font-size: 0.64rem;
          font-weight: 800;
          gap: 0.28rem;
          line-height: 1;
          max-width: 100%;
          min-width: 0;
          padding: 0.25rem 0.5rem;
          text-transform: uppercase;
          white-space: nowrap;
        }
        :global(.items-db-page .badge span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        :global(.items-db-page .badge svg) {
          flex: 0 0 auto;
          stroke-width: 2.2;
        }
        :global(.items-db-page .badge.market) { color: var(--text-success); background: rgba(34,197,94,0.08); }
        :global(.items-db-page .badge.market.none) { color: var(--text-muted); background: rgba(255,255,255,0.04); }
        :global(.items-db-page .badge.market.thin) { color: #fbbf24; background: rgba(251,191,36,0.08); }
        :global(.items-db-page .badge.market.steady) { color: var(--text-accent); background: rgba(234,179,8,0.08); }
        :global(.items-db-page .badge.market.risk) { color: var(--text-danger); background: rgba(239,68,68,0.08); }
        :global(.items-db-page .badge.confidence.good) { color: var(--text-success); background: rgba(34,197,94,0.1); }
        :global(.items-db-page .badge.confidence.warn) { color: #fbbf24; background: rgba(251,191,36,0.1); }
        :global(.items-db-page .badge.confidence.bad) { color: #f87171; background: rgba(248,113,113,0.1); }
        :global(.items-db-page .badge.confidence.muted) { color: var(--text-muted); background: rgba(255,255,255,0.045); }
        :global(.items-db-page .badge.warning) { color: #fbbf24; background: rgba(251,191,36,0.08); }
        :global(.items-db-page .badge.vendor) { color: #fbbf24; background: rgba(251,191,36,0.08); }
        :global(.items-db-page .badge.untradable) { color: #f87171; background: rgba(248,113,113,0.08); }
        :global(.items-db-page .badge.produced) { color: #93c5fd; background: rgba(147,197,253,0.08); }
        :global(.items-db-page .badge.craft) { color: #60a5fa; background: rgba(96,165,250,0.08); }
        :global(.items-db-page .badge.source) { color: #22d3ee; background: rgba(34,211,238,0.08); }
        :global(.items-db-page .badge.gear) { color: #a78bfa; background: rgba(167,139,250,0.08); }
        :global(.items-db-page .badge.effect) { color: #f472b6; background: rgba(244,114,182,0.08); }
        :global(.items-db-page .badge.lore) { color: #f5b041; background: rgba(245,176,65,0.1); }
        :global(.items-db-page .badge.legacy) { color: #c4b5fd; background: rgba(167,139,250,0.08); }
        :global(.items-db-page .badge.muted) { color: var(--text-muted); background: rgba(255,255,255,0.045); }
        .item-grid {
          animation: itemSurfaceIn 0.34s 0.14s ease-out both;
          display: none;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 310px), 1fr));
          margin-top: 1rem;
          max-width: 100%;
          min-width: 0;
          position: relative;
          z-index: 1;
        }
        .item-grid.forced {
          display: grid;
        }
        .item-card {
          background: rgba(255,255,255,0.018);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: inherit;
          cursor: pointer;
          display: flex;
          gap: 0.85rem;
          min-width: 0;
          overflow: hidden;
          padding: 0.95rem;
          position: relative;
          text-align: left;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
          width: 100%;
        }
        .item-card:hover,
        .item-card:focus-visible {
          background: color-mix(in srgb, var(--text-accent), transparent 96%);
          border-color: var(--border-focus);
          outline: none;
          transform: translateY(-1px);
        }
        .item-card:active {
          transform: translateY(0) scale(0.997);
        }
        .quality-strip {
          bottom: 0;
          left: 0;
          position: absolute;
          top: 0;
          width: 3px;
          background: var(--quality-color);
          box-shadow: 0 0 18px color-mix(in srgb, var(--quality-color), transparent 45%);
        }
        .item-card img {
          border-radius: 7px;
          flex: 0 0 auto;
          height: 44px;
          width: 44px;
        }
        .item-card-body {
          flex: 1;
          min-width: 0;
        }
        .card-topline {
          align-items: flex-start;
          display: flex;
          gap: 0.5rem;
          justify-content: space-between;
        }
        .card-item-name {
          color: #fff;
          font-size: 0.95rem;
          font-weight: 800;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .card-meta {
          color: var(--text-muted);
          display: flex;
          flex-wrap: wrap;
          font-size: 0.7rem;
          font-weight: 800;
          gap: 0.5rem;
          letter-spacing: 0.04em;
          margin-top: 0.35rem;
          text-transform: uppercase;
        }
        .card-stats {
          display: grid;
          gap: 0.4rem;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin: 0.8rem 0;
        }
        .card-stats span {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 6px;
          min-width: 0;
          padding: 0.45rem;
        }
        .card-stats small {
          color: var(--text-muted);
          display: block;
          font-size: 0.62rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .card-stats strong {
          color: #fff;
          display: block;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          margin-top: 0.2rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .source-preview {
          align-items: center;
          background: rgba(34,211,238,0.055);
          border: 1px solid rgba(34,211,238,0.16);
          border-radius: 7px;
          color: var(--text-muted);
          display: flex;
          font-size: 0.76rem;
          font-weight: 800;
          gap: 0.42rem;
          margin: 0 0 0.75rem;
          min-width: 0;
          padding: 0.48rem 0.55rem;
        }
        .source-preview svg {
          color: #22d3ee;
          flex: 0 0 auto;
        }
        .source-preview span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .load-more,
        .reset-btn {
          background: var(--text-accent);
          border: 0;
          border-radius: 7px;
          color: #050505;
          cursor: pointer;
          display: block;
          font-weight: 900;
          margin: 1.25rem auto 0;
          padding: 0.75rem 1.2rem;
        }
        .state-panel {
          align-items: center;
          background: rgba(255,255,255,0.014);
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-top: 1rem;
          padding: 4rem 1rem;
          text-align: center;
        }
        .advanced-filter-panel summary:focus-visible,
        .icon-toggle:focus-visible,
        .view-toggle button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.16);
        }
        @keyframes itemSurfaceIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes itemMenuReveal {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .db-summary,
          .item-help,
          .db-controls,
          .result-meta,
          .desktop-table-shell,
          .item-grid,
          :global(.items-db-page .item-select-menu),
          .advanced-filter-panel[open] .advanced-filter-grid {
            animation: none !important;
          }
          .icon-toggle,
          .view-toggle button,
          :global(.items-db-page .item-select-trigger),
          :global(.items-db-page .item-select-option),
          .item-card {
            transition: none !important;
          }
          .icon-toggle:active,
          .view-toggle button:active,
          :global(.items-db-page .item-select-trigger:active),
          :global(.items-db-page .item-select-option:active),
          .item-card:hover,
          .item-card:focus-visible {
            transform: none !important;
          }
        }
        @media (max-width: 1200px) {
          .db-summary {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .db-controls {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            grid-template-areas: none;
          }
          .db-controls > * {
            grid-area: auto;
          }
          .db-controls > .search-control {
            grid-column: span 2;
          }
          .advanced-filter-panel {
            grid-column: 1 / -1 !important;
          }
          .advanced-filter-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .icon-toggle,
          .view-toggle {
            justify-self: stretch;
            width: 100%;
          }
          .view-toggle button {
            min-width: 0;
          }
          .view-toggle button {
            flex: 1;
          }
        }
        @media (max-width: 980px) {
          .db-controls > .search-control {
            grid-area: auto / 1 / auto / -1 !important;
          }
        }
        @media (max-width: 820px) {
          .db-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .db-controls {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-areas: none;
          }
          .db-controls > * {
            grid-area: auto;
          }
          .search-control {
            grid-column: 1 / -1 !important;
          }
          .advanced-filter-panel {
            background: rgba(255,255,255,0.018);
            border: 1px solid var(--border-subtle);
            border-radius: 7px;
            grid-column: 1 / -1 !important;
          }
          .advanced-filter-panel summary {
            align-items: center;
            color: var(--text-main);
            cursor: pointer;
            display: grid;
            font-size: 0.82rem;
            font-weight: 900;
            gap: 0.55rem;
            grid-template-columns: minmax(0, 1fr) auto auto;
            min-height: 42px;
            padding: 0.55rem 0.65rem;
          }
          .advanced-filter-panel summary::-webkit-details-marker {
            display: none;
          }
          .advanced-filter-panel summary > span {
            align-items: center;
            display: inline-flex;
            gap: 0.45rem;
            min-width: 0;
          }
          .advanced-filter-panel summary small {
            color: var(--text-muted);
            font: inherit;
            font-size: 0.72rem;
            font-weight: 800;
            white-space: nowrap;
          }
          .advanced-filter-panel summary svg {
            color: var(--text-accent);
          }
          .advanced-filter-panel summary > svg {
            color: var(--text-muted);
            transition: transform 0.18s ease;
          }
          .advanced-filter-panel[open] summary > svg {
            transform: rotate(180deg);
          }
          .advanced-filter-panel:not([open]) .advanced-filter-grid {
            display: none;
          }
          .advanced-filter-panel[open] .advanced-filter-grid {
            animation: itemMenuReveal 0.16s ease-out both;
            border-top: 1px solid var(--border-subtle);
            display: grid;
            gap: 0.55rem;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 0.62rem;
          }
          .control-group,
          .icon-toggle,
          .market-toggle {
            width: 100%;
          }
          :global(.items-db-page .item-select-menu) {
            min-width: 100%;
          }
          .result-meta {
            flex-direction: column;
            gap: 0.3rem;
          }
          .desktop-table-shell {
            display: none;
          }
          .item-grid {
            display: grid;
          }
          .view-toggle {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .db-summary {
            display: flex;
            gap: 0.5rem;
            margin-left: -0.2rem;
            margin-right: -0.2rem;
            overflow-x: auto;
            padding: 0 0.2rem 0.1rem;
            scroll-snap-type: x proximity;
            scrollbar-width: none;
          }
          .db-summary::-webkit-scrollbar {
            display: none;
          }
          .db-summary div {
            flex: 0 0 116px;
            min-height: auto;
            padding: 0.58rem 0.65rem;
            scroll-snap-align: start;
          }
          .summary-label {
            font-size: 0.62rem;
          }
          .db-summary strong {
            font-size: 1rem;
          }
          .db-controls {
            gap: 0.55rem;
            padding: 0.62rem;
          }
          .advanced-filter-panel[open] .advanced-filter-grid {
            grid-template-columns: 1fr;
          }
          .item-help summary {
            padding: 0.55rem 0.65rem;
          }
          .item-card {
            padding: 0.85rem;
          }
          .card-stats {
            gap: 0.3rem;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .card-stats span {
            padding: 0.4rem 0.35rem;
          }
          .card-stats strong {
            font-size: 0.7rem;
          }
          :global(.items-db-page .search-shell input) {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </main>
  );
}

function ItemFilterPicker<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [placement, setPlacement] = useState<'down' | 'up'>('down');
  const [menuMaxHeight, setMenuMaxHeight] = useState(320);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.value === value) || options[0] || null;
  const renderOptionLabel = (option: FilterOption<T> | null) => {
    if (!option) return 'Select';
    if (option.qualityTone) {
      return <span style={getQualityTextStyle(option.qualityTone)}>{option.label}</span>;
    }
    return option.label;
  };

  const closePicker = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const selectOption = (option: FilterOption<T> | undefined) => {
    if (!option) return;
    onChange(option.value);
    closePicker(true);
  };

  const moveActive = (direction: number) => {
    setActiveIndex((current) => {
      const next = (current + direction + options.length) % options.length;
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportPadding = 12;
      const preferredHeight = 320;
      const isCompactPicker = window.matchMedia('(max-width: 820px)').matches;
      const spaceBelow = Math.max(48, window.innerHeight - rect.bottom - viewportPadding);
      const spaceAbove = Math.max(48, rect.top - viewportPadding);
      const nextPlacement = !isCompactPicker && spaceBelow < preferredHeight && spaceAbove > spaceBelow ? 'up' : 'down';
      setPlacement(nextPlacement);
      setMenuMaxHeight(Math.min(preferredHeight, nextPlacement === 'up' ? spaceAbove : spaceBelow));
    };
    updatePlacement();

    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(selectedIndex);
      return;
    }
    setActiveIndex(selectedIndex);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(event.key === 'ArrowDown' ? selectedIndex : options.length - 1);
    }
  };

  const handleTriggerClick = () => {
    const nextOpen = !open;
    if (nextOpen && window.matchMedia('(max-width: 820px)').matches) {
      triggerRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
    setOpen(nextOpen);
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closePicker(true);
    }
  };

  return (
    <div className={`item-select ${open ? 'open' : ''} ${open && placement === 'up' ? 'open-up' : ''}`} ref={pickerRef}>
      <button
        type="button"
        className="item-select-trigger"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{renderOptionLabel(selected)}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="item-select-menu"
          role="listbox"
          aria-label={ariaLabel}
          onKeyDown={handleListKeyDown}
          style={{ '--item-select-max-height': `${menuMaxHeight}px` } as React.CSSProperties}
        >
          {options.map((option, index) => {
            const active = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                className={`item-select-option ${active ? 'active' : ''}`}
                role="option"
                aria-selected={active}
                tabIndex={index === activeIndex ? 0 : -1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  selectOption(option);
                }}
              >
                <span>{renderOptionLabel(option)}</span>
                {active && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemSearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const lastCommittedRef = useRef(value);

  useEffect(() => {
    if (value === lastCommittedRef.current) return;
    lastCommittedRef.current = value;
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localValue === lastCommittedRef.current) return;
      lastCommittedRef.current = localValue;
      onChange(localValue);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="search-shell">
      <Search size={15} />
      <input
        aria-label="Search items"
        type="text"
        className="control-input"
        placeholder={placeholder}
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
      />
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="skeleton-text" style={{ width: '200px', margin: '0 auto' }} />
      </div>
    }>
      <ItemsArchiveContent />
    </Suspense>
  );
}
