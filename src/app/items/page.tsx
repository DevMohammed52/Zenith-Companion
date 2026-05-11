'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowDownUp,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Hammer,
  MapPin,
  Package,
  Search,
  Shield,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { useItemModal } from '@/context/ItemModalContext';
import { useData } from '@/context/DataContext';
import { getLoreForItem } from '@/data/lore';
import {
  buildDropLocationOptions,
  getDropSourceLocation,
  getResourceLocationsForItem,
  type DropSourceWithLocation,
  type GatheredResourceLocation,
} from '@/lib/locations';
import { getMarketLiquidity, getSafeMarketValue, type MarketLiquidityInfo } from '@/lib/market-pricing';

interface SearchIndexItem {
  id: string;
  name: string;
  type: string;
  quality: string;
  image: string;
}

type SortKey = 'volume' | 'price' | 'name' | 'quality' | 'type' | 'vendor' | 'usage' | 'requiredLevel';
type SignalFilter = 'ALL' | 'MARKET' | 'VENDOR' | 'CRAFTABLE' | 'USED' | 'DROPPED' | 'FARMABLE' | 'EQUIPMENT' | 'EFFECTS' | 'LORE';
type ViewMode = 'table' | 'cards';
type FilterOption<T extends string> = { value: T; label: string };

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
  requiredLevel: number;
  requirementsText: string;
  vendorPrice: number;
  tradeable: boolean;
  hasMarket: boolean;
  hasRecipe: boolean;
  hasStats: boolean;
  hasEffects: boolean;
  hasLore: boolean;
  loreCount: number;
  dropLocations: string[];
  dropLocationKeys: string[];
  resourceLocations: GatheredResourceLocation[];
  droppedByCount: number;
  usedInCount: number;
  usageScore: number;
};

const QUALITY_ORDER: Record<string, number> = {
  STANDARD: 1,
  REFINED: 2,
  PREMIUM: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
  UNIQUE: 7,
};

const QUALITY_COLORS: Record<string, string> = {
  STANDARD: '#f4f4f5',
  REFINED: '#4ade80',
  PREMIUM: '#60a5fa',
  EPIC: '#a855f7',
  LEGENDARY: '#f59e0b',
  MYTHIC: '#ef4444',
  UNIQUE: '#ec4899',
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
  { value: 'VENDOR', label: 'Vendor value' },
  { value: 'CRAFTABLE', label: 'Craftable' },
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

const formatGold = (value: number) => {
  if (!value) return '-';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: value < 100 ? 2 : 0 })}g`;
};

const formatLabel = (value: string) => value.replace(/_/g, ' ');
const ITEM_DB_VIEW_STORAGE_KEY = 'zenith_items_view_mode';

function ItemsArchiveContent() {
  const searchParams = useSearchParams();
  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, UsageEntry>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [selectedSignal, setSelectedSignal] = useState<SignalFilter>('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('volume');
  const [sortDesc, setSortDesc] = useState(true);
  const [viewMode, setViewModeState] = useState<ViewMode>('table');
  const [visibleCount, setVisibleCount] = useState(150);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { openItem } = useItemModal();
  const { marketData, allItemsDb, loading } = useData();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ITEM_DB_VIEW_STORAGE_KEY);
      if (stored === 'table' || stored === 'cards') setViewModeState(stored);
    } catch {}
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
      fetch('/usage-map.json').then(r => r.ok ? r.json() : {}),
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
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setVisibleCount(150);
  }, [debouncedSearch, selectedType, selectedQuality, selectedSignal, selectedLocation, sortBy, sortDesc]);

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
      const dropLocations = Array.from(new Set([
        ...dropLocationRefs.map(location => location.name).filter(Boolean),
        ...resourceLocations.map(location => location.name),
      ])) as string[];
      const dropLocationKeys = Array.from(new Set([
        ...dropLocationRefs.map(location => location.key).filter(Boolean),
        ...resourceLocations.map(location => location.key),
      ])) as string[];
      const droppedByCount = dropSources.length;
      const usedInCount = Array.isArray(usage.required_for) ? usage.required_for.length : 0;
      const vendorPrice = Number(market.vendor_price || full.vendor_price || 0);
      const marketPrice = getSafeMarketValue(market);
      const marketVolume = Number(market.vol_3 || 0);
      const liquidity = getMarketLiquidity(market);
      const loreCount = getLoreForItem(item.name).length;
      const requiredLevel = getRequiredLevel(full);

      return {
        ...item,
        description: full.description || '',
        marketPrice,
        marketVolume,
        stableMarketVolume: liquidity.stableVolume3d || marketVolume,
        liquidity,
        requiredLevel,
        requirementsText: formatRequirements(full),
        vendorPrice,
        tradeable: Boolean(full.is_tradeable ?? marketPrice > 0),
        hasMarket: marketPrice > 0,
        hasRecipe: Boolean(full.recipe || usage.produced_from),
        hasStats: Boolean(full.stats && Object.keys(full.stats).length > 0),
        hasEffects: Boolean(full.effects && (Array.isArray(full.effects) ? full.effects.length > 0 : Object.keys(full.effects).length > 0)),
        hasLore: loreCount > 0,
        loreCount,
        dropLocations,
        dropLocationKeys,
        resourceLocations,
        droppedByCount,
        usedInCount,
        usageScore: droppedByCount + usedInCount + resourceLocations.length + (usage.produced_from ? 1 : 0),
      };
    });
  }, [index, allItemsDb, marketData, usageMap]);

  const types = useMemo(() => {
    const t = new Set(enrichedItems.map(i => i.type).filter(Boolean));
    return ['ALL', ...Array.from(t).sort()];
  }, [enrichedItems]);

  const qualities = useMemo(() => {
    const q = new Set(enrichedItems.map(i => i.quality).filter(Boolean));
    return ['ALL', ...Array.from(q).sort((a, b) => (QUALITY_ORDER[a] || 0) - (QUALITY_ORDER[b] || 0))];
  }, [enrichedItems]);
  const typeOptions = useMemo<FilterOption<string>[]>(
    () => types.map((type) => ({ value: type, label: type === 'ALL' ? 'All types' : formatLabel(type) })),
    [types],
  );
  const qualityOptions = useMemo<FilterOption<string>[]>(
    () => qualities.map((quality) => ({ value: quality, label: quality === 'ALL' ? 'All qualities' : quality })),
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
    const q = debouncedSearch.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    const filtered = enrichedItems.filter(item => {
      const haystack = [
        item.name,
        item.type,
        item.quality,
        item.description,
        item.requirementsText,
        item.dropLocations.join(' '),
        item.resourceLocations.length > 0 ? 'farmable gathered resource map location' : '',
        item.requiredLevel ? `level ${item.requiredLevel}` : '',
        item.hasRecipe ? 'craftable recipe' : '',
        item.hasMarket ? 'market listed tradeable' : '',
        item.vendorPrice > 0 ? 'vendor value' : '',
        item.hasStats ? 'stats equipment gear' : '',
        item.hasEffects ? 'effects buff potion essence' : '',
        item.hasLore ? 'lore thread valaron archive' : '',
      ].join(' ').toLowerCase();

      const matchSearch = tokens.length === 0 || tokens.every(token => haystack.includes(token));
      const matchType = selectedType === 'ALL' || item.type === selectedType;
      const matchQuality = selectedQuality === 'ALL' || item.quality === selectedQuality;
      const matchLocation = selectedLocation === 'ALL' || item.dropLocationKeys.includes(selectedLocation);
      const matchSignal =
        selectedSignal === 'ALL' ||
        (selectedSignal === 'MARKET' && item.hasMarket) ||
        (selectedSignal === 'VENDOR' && item.vendorPrice > 0) ||
        (selectedSignal === 'CRAFTABLE' && item.hasRecipe) ||
        (selectedSignal === 'USED' && item.usedInCount > 0) ||
        (selectedSignal === 'DROPPED' && item.droppedByCount > 0) ||
        (selectedSignal === 'FARMABLE' && item.resourceLocations.length > 0) ||
        (selectedSignal === 'EQUIPMENT' && (EQUIPMENT_TYPES.has(item.type) || item.hasStats)) ||
        (selectedSignal === 'EFFECTS' && item.hasEffects) ||
        (selectedSignal === 'LORE' && item.hasLore);

      return matchSearch && matchType && matchQuality && matchLocation && matchSignal;
    });

    return filtered.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'type') {
        valA = a.type.toLowerCase();
        valB = b.type.toLowerCase();
      } else if (sortBy === 'quality') {
        valA = QUALITY_ORDER[a.quality] || 0;
        valB = QUALITY_ORDER[b.quality] || 0;
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
        const rarityTieBreak = (QUALITY_ORDER[b.quality] || 0) - (QUALITY_ORDER[a.quality] || 0);
        if (rarityTieBreak !== 0) return rarityTieBreak;
      }
      if (sortBy === 'quality') {
        const levelTieBreak = b.requiredLevel - a.requiredLevel;
        if (levelTieBreak !== 0) return sortDesc ? levelTieBreak : -levelTieBreak;
      }
      return a.name.localeCompare(b.name);
    });
  }, [enrichedItems, debouncedSearch, selectedType, selectedQuality, selectedSignal, selectedLocation, sortBy, sortDesc]);

  const visibleItems = filteredItems.slice(0, visibleCount);

  const stats = useMemo(() => {
    const marketListed = enrichedItems.filter(i => i.hasMarket).length;
    const craftable = enrichedItems.filter(i => i.hasRecipe).length;
    const used = enrichedItems.filter(i => i.usedInCount > 0).length;
    const loreLinked = enrichedItems.filter(i => i.hasLore).length;
    return { marketListed, craftable, used, loreLinked };
  }, [enrichedItems]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(prev => !prev);
    } else {
      setSortBy(key);
      setSortDesc(key !== 'name' && key !== 'type');
    }
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

  const renderBadges = (item: EnrichedItem) => (
    <div className="item-badges">
      {item.hasMarket && (
        <span className={`badge market ${item.liquidity.tone}`} title={item.liquidity.note}>
          <ShoppingCart size={12} aria-hidden="true" /> <span>{item.liquidity.label}</span>
        </span>
      )}
      {!item.tradeable && <span className="badge vendor"><Store size={12} aria-hidden="true" /> <span>Vendor</span></span>}
      {item.hasRecipe && <span className="badge craft"><Hammer size={12} aria-hidden="true" /> <span>Craft</span></span>}
      {item.resourceLocations.length > 0 && <span className="badge source"><MapPin size={12} aria-hidden="true" /> <span>Farmable</span></span>}
      {(EQUIPMENT_TYPES.has(item.type) || item.hasStats) && <span className="badge gear"><Shield size={12} aria-hidden="true" /> <span>Gear</span></span>}
      {item.hasEffects && <span className="badge effect"><Boxes size={12} aria-hidden="true" /> <span>Effect</span></span>}
      {item.hasLore && <span className="badge lore"><BookOpen size={12} aria-hidden="true" /> <span>Lore</span></span>}
    </div>
  );

  return (
    <main className="container items-db-page">
      <div className="header">
        <h1 className="header-title">
          <Database size={24} color="var(--text-accent)" /> Item Database
        </h1>
        <div className="header-status">
          <div className="status-dot"></div>
          <span className="mono">{index.length.toLocaleString()} ITEMS CATALOGED</span>
        </div>
      </div>

      <section className="db-summary">
        <div>
          <span className="summary-label">Market listed</span>
          <strong>{stats.marketListed.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Craftable</span>
          <strong>{stats.craftable.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Used by recipes</span>
          <strong>{stats.used.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Lore linked</span>
          <strong>{stats.loreLinked.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Visible results</span>
          <strong>{filteredItems.length.toLocaleString()}</strong>
        </div>
      </section>

      <section className="db-note" aria-label="Market and tag guidance">
        <ShoppingCart size={16} />
        <span>
          Tags describe what data exists for an item. Market prices are recent snapshots, not guaranteed sell paths; stable volume trims unusual sold-day spikes when available, and rare or expensive items should still be checked against official listings before mass buying or crafting.
        </span>
      </section>

      <section className="db-controls">
        <div className="control-group search-control">
          <label className="control-label">Search</label>
          <div className="search-shell">
            <Search size={15} />
            <input
              aria-label="Search items"
              type="text"
              className="control-input"
              placeholder="Name, type, quality, effects, recipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

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
          <label className="control-label">Source Location</label>
          <ItemFilterPicker
            ariaLabel="Item source location filter"
            options={locationOptions}
            value={selectedLocation}
            onChange={setSelectedLocation}
          />
        </div>

        <div className="control-group">
          <label className="control-label">Sort</label>
          <ItemFilterPicker
            ariaLabel="Item sort"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>

        <button type="button" className="control-input icon-toggle" onClick={() => setSortDesc(prev => !prev)}>
          <ArrowDownUp size={15} /> {sortDesc ? 'Desc' : 'Asc'}
        </button>

        <div className="view-toggle" aria-label="View mode">
          <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
          <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>Cards</button>
        </div>
      </section>

      {loadError && (
        <div className="state-panel">
          <Package size={36} />
          <p>{loadError}</p>
        </div>
      )}

      {!loadError && (loading || index.length === 0) && (
        <div className="state-panel">
          <div className="skeleton-text" style={{ width: '220px' }} />
          <p>Loading item data...</p>
        </div>
      )}

      {!loadError && index.length > 0 && filteredItems.length === 0 && (
        <div className="state-panel">
          <Package size={42} />
          <p>No items found matching your filters.</p>
          <button type="button" className="reset-btn" onClick={() => {
            setSearchTerm('');
            setSelectedType('ALL');
            setSelectedQuality('ALL');
            setSelectedSignal('ALL');
            setSelectedLocation('ALL');
            setSortBy('volume');
            setSortDesc(true);
          }}>
            Reset filters
          </button>
        </div>
      )}

      {!loadError && filteredItems.length > 0 && (
        <>
          <div className="result-meta">
            <span>{visibleItems.length.toLocaleString()} of {filteredItems.length.toLocaleString()} shown</span>
            <span>Sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
          </div>

          <div className={viewMode === 'table' ? 'desktop-table-shell' : 'desktop-table-shell hidden'}>
            <table className="items-table">
              <thead>
                <tr>
                  <th className="left">Item</th>
                  <th onClick={() => handleSort('type')}>Type</th>
                  <th onClick={() => handleSort('quality')}>Quality</th>
                  <th onClick={() => handleSort('requiredLevel')}>Level</th>
                  <th onClick={() => handleSort('price')}>Market</th>
                  <th onClick={() => handleSort('vendor')}>Vendor</th>
                  <th onClick={() => handleSort('volume')}>Stable Vol</th>
                  <th onClick={() => handleSort('usage')}>Usage</th>
                  <th className="left">Tags</th>
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
                        <img src={item.image} alt="" />
                        <div className="item-copy">
                          <strong>{item.name}</strong>
                          <small>{item.description || 'No description available'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{formatLabel(item.type)}</td>
                    <td style={{ color: QUALITY_COLORS[item.quality] || QUALITY_COLORS.STANDARD }}>{item.quality}</td>
                    <td className="mono" title={item.requirementsText || undefined}>{item.requiredLevel || '-'}</td>
                    <td className="mono">{formatGold(item.marketPrice)}</td>
                    <td className="mono">{formatGold(item.vendorPrice)}</td>
                    <td className={`mono liquidity-volume ${item.liquidity.tone}`} title={item.stableMarketVolume !== item.marketVolume ? `Raw 3-day volume: ${item.marketVolume.toLocaleString()}` : item.liquidity.note}>
                      {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '-'}
                    </td>
                    <td className="mono">{item.usageScore ? item.usageScore.toLocaleString() : '-'}</td>
                    <td className="signals-cell">{renderBadges(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={viewMode === 'cards' ? 'item-grid forced' : 'item-grid'}>
            {visibleItems.map(item => (
              <button aria-label={`Open ${item.name} item details`} key={item.id} type="button" onClick={() => open(item)} className="item-card">
                <div className="quality-strip" style={{ '--quality-color': QUALITY_COLORS[item.quality] || QUALITY_COLORS.STANDARD } as React.CSSProperties} />
                <img src={item.image} alt="" />
                <div className="item-card-body">
                  <div className="card-topline">
                    <span className="card-item-name">{item.name}</span>
                    <ChevronRight size={16} />
                  </div>
                  <div className="card-meta">
                    <span>{formatLabel(item.type)}</span>
                    <span style={{ color: QUALITY_COLORS[item.quality] || QUALITY_COLORS.STANDARD }}>{item.quality}</span>
                  </div>
                  <div className="card-stats">
                    <span><small>Market</small><strong>{formatGold(item.marketPrice)}</strong></span>
                    <span><small>Level</small><strong title={item.requirementsText || undefined}>{item.requiredLevel || '-'}</strong></span>
                    <span><small>Stable Vol</small><strong className={`liquidity-volume ${item.liquidity.tone}`}>{item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '-'}</strong></span>
                    <span><small>Usage</small><strong>{item.usageScore || '-'}</strong></span>
                  </div>
                  {item.resourceLocations.length > 0 && (
                    <div className="source-preview" aria-label={`${item.name} gathered locations`}>
                      <MapPin size={13} aria-hidden="true" />
                      <span>{item.resourceLocations.slice(0, 2).map(location => location.name).join(', ')}{item.resourceLocations.length > 2 ? ` +${item.resourceLocations.length - 2}` : ''}</span>
                    </div>
                  )}
                  {renderBadges(item)}
                </div>
              </button>
            ))}
          </div>

          {visibleItems.length < filteredItems.length && (
            <button type="button" className="load-more" onClick={() => setVisibleCount(count => count + 150)}>
              Load 150 more
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
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-bottom: 1rem;
        }
        .db-summary div {
          background: rgba(255,255,255,0.018);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.9rem 1rem;
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
          font-size: 1.35rem;
          margin-top: 0.35rem;
        }
        .db-note {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          border: 1px solid rgba(56,189,248,0.22);
          background: rgba(56,189,248,0.07);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.86rem;
          font-weight: 650;
          line-height: 1.45;
          margin-bottom: 1rem;
          padding: 0.8rem 0.95rem;
        }
        .db-note svg {
          color: var(--text-accent);
          flex: 0 0 auto;
          margin-top: 0.1rem;
        }
        .db-controls {
          align-items: end;
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          gap: 0.85rem;
          grid-template-columns: minmax(240px, 2fr) repeat(5, minmax(128px, 1fr)) minmax(88px, auto) minmax(118px, auto);
          padding: 1rem;
          max-width: 100%;
          min-width: 0;
        }
        .search-shell {
          position: relative;
        }
        .search-shell :global(svg) {
          color: var(--text-muted);
          left: 0.75rem;
          pointer-events: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
        }
        .search-shell :global(input) {
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
          z-index: 80;
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
          width: 100%;
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
          max-height: min(320px, 58vh);
          min-width: min(250px, calc(100vw - 2rem));
          overflow-y: auto;
          padding: 0.35rem;
          position: absolute;
          right: auto;
          top: 100%;
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
          width: 100%;
        }
        :global(.items-db-page .item-select-option:hover),
        :global(.items-db-page .item-select-option.active) {
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
          border-color: rgba(56,189,248,0.24);
        }
        :global(.items-db-page .item-select-option svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .icon-toggle {
          align-items: center;
          cursor: pointer;
          display: flex;
          gap: 0.4rem;
          justify-content: center;
          min-width: 88px !important;
          white-space: nowrap;
        }
        .view-toggle {
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
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
          padding: 0 0.8rem;
        }
        .view-toggle button.active {
          background: var(--text-accent);
          color: #050505;
        }
        .result-meta {
          color: var(--text-muted);
          display: flex;
          font-size: 0.8rem;
          justify-content: space-between;
          margin: 1rem 0 0.65rem;
        }
        .desktop-table-shell {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          overflow: auto;
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
          cursor: pointer;
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
        .items-table td {
          background: rgba(255,255,255,0.012);
          border-top: 1px solid rgba(255,255,255,0.035);
          color: var(--text-main);
          font-size: 0.84rem;
          padding: 0.8rem 0.85rem;
          text-align: right;
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
        .items-table tr:focus td {
          background: color-mix(in srgb, var(--text-accent), transparent 96%);
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
          text-align: left !important;
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
        :global(.items-db-page .item-badges) {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          justify-content: flex-start;
          min-width: 0;
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
          padding: 0.25rem 0.5rem;
          text-transform: uppercase;
          white-space: nowrap;
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
        :global(.items-db-page .badge.vendor) { color: #fbbf24; background: rgba(251,191,36,0.08); }
        :global(.items-db-page .badge.craft) { color: #60a5fa; background: rgba(96,165,250,0.08); }
        :global(.items-db-page .badge.source) { color: #22d3ee; background: rgba(34,211,238,0.08); }
        :global(.items-db-page .badge.gear) { color: #a78bfa; background: rgba(167,139,250,0.08); }
        :global(.items-db-page .badge.effect) { color: #f472b6; background: rgba(244,114,182,0.08); }
        :global(.items-db-page .badge.lore) { color: #f5b041; background: rgba(245,176,65,0.1); }
        .item-grid {
          display: none;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 310px), 1fr));
          margin-top: 1rem;
          max-width: 100%;
          min-width: 0;
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
        @media (max-width: 1200px) {
          .db-controls {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .search-control {
            grid-column: 1 / -1;
          }
          .icon-toggle,
          .view-toggle {
            justify-self: stretch;
            width: 100%;
          }
          .view-toggle button {
            flex: 1;
          }
        }
        @media (max-width: 980px) {
          .db-controls {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .search-control {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 820px) {
          .db-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .db-controls {
            grid-template-columns: 1fr;
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
            grid-template-columns: 1fr;
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
          .search-shell :global(input) {
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
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.value === value) || options[0] || null;

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

    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
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
    <div className={`item-select ${open ? 'open' : ''}`} ref={pickerRef}>
      <button
        type="button"
        className="item-select-trigger"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selected?.label || 'Select'}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="item-select-menu" role="listbox" aria-label={ariaLabel} onKeyDown={handleListKeyDown}>
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
                <span>{option.label}</span>
                {active && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
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
