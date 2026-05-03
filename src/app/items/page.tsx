'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowDownUp,
  BookOpen,
  Boxes,
  ChevronRight,
  Database,
  Hammer,
  Package,
  Search,
  Shield,
  Store,
  TrendingUp,
} from 'lucide-react';
import { useItemModal } from '@/context/ItemModalContext';
import { useData } from '@/context/DataContext';
import { getLoreForItem } from '@/data/lore';

interface SearchIndexItem {
  id: string;
  name: string;
  type: string;
  quality: string;
  image: string;
}

type SortKey = 'volume' | 'price' | 'name' | 'quality' | 'type' | 'vendor' | 'usage';
type SignalFilter = 'ALL' | 'MARKET' | 'VENDOR' | 'CRAFTABLE' | 'USED' | 'DROPPED' | 'EQUIPMENT' | 'EFFECTS' | 'LORE';
type ViewMode = 'table' | 'cards';

type UsageEntry = {
  dropped_by?: unknown[];
  required_for?: unknown[];
  produced_from?: unknown;
  shops?: unknown[];
};

type EnrichedItem = SearchIndexItem & {
  description: string;
  marketPrice: number;
  marketVolume: number;
  vendorPrice: number;
  tradeable: boolean;
  hasMarket: boolean;
  hasRecipe: boolean;
  hasStats: boolean;
  hasEffects: boolean;
  hasLore: boolean;
  loreCount: number;
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

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'volume', label: '3D Volume' },
  { value: 'price', label: 'Market Price' },
  { value: 'usage', label: 'Usage' },
  { value: 'vendor', label: 'Vendor Value' },
  { value: 'quality', label: 'Quality' },
  { value: 'type', label: 'Type' },
  { value: 'name', label: 'Name' },
];

const SIGNAL_OPTIONS: { value: SignalFilter; label: string }[] = [
  { value: 'ALL', label: 'All signals' },
  { value: 'MARKET', label: 'Market listed' },
  { value: 'VENDOR', label: 'Vendor value' },
  { value: 'CRAFTABLE', label: 'Craftable' },
  { value: 'USED', label: 'Used in recipes' },
  { value: 'DROPPED', label: 'Dropped by enemies' },
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
  }, [debouncedSearch, selectedType, selectedQuality, selectedSignal, sortBy, sortDesc]);

  const enrichedItems = useMemo<EnrichedItem[]>(() => {
    return index.map(item => {
      const full = allItemsDb?.[item.name] || {};
      const market = marketData?.[item.name] || {};
      const usage = usageMap[item.name] || {};
      const droppedByCount = Array.isArray(usage.dropped_by) ? usage.dropped_by.length : 0;
      const usedInCount = Array.isArray(usage.required_for) ? usage.required_for.length : 0;
      const vendorPrice = Number(market.vendor_price || full.vendor_price || 0);
      const marketPrice = Number(market.avg_3 || market.price || 0);
      const loreCount = getLoreForItem(item.name).length;

      return {
        ...item,
        description: full.description || '',
        marketPrice,
        marketVolume: Number(market.vol_3 || 0),
        vendorPrice,
        tradeable: Boolean(full.is_tradeable ?? marketPrice > 0),
        hasMarket: marketPrice > 0,
        hasRecipe: Boolean(full.recipe || usage.produced_from),
        hasStats: Boolean(full.stats && Object.keys(full.stats).length > 0),
        hasEffects: Boolean(full.effects && (Array.isArray(full.effects) ? full.effects.length > 0 : Object.keys(full.effects).length > 0)),
        hasLore: loreCount > 0,
        loreCount,
        droppedByCount,
        usedInCount,
        usageScore: droppedByCount + usedInCount + (usage.produced_from ? 1 : 0),
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

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    const filtered = enrichedItems.filter(item => {
      const haystack = [
        item.name,
        item.type,
        item.quality,
        item.description,
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
      const matchSignal =
        selectedSignal === 'ALL' ||
        (selectedSignal === 'MARKET' && item.hasMarket) ||
        (selectedSignal === 'VENDOR' && item.vendorPrice > 0) ||
        (selectedSignal === 'CRAFTABLE' && item.hasRecipe) ||
        (selectedSignal === 'USED' && item.usedInCount > 0) ||
        (selectedSignal === 'DROPPED' && item.droppedByCount > 0) ||
        (selectedSignal === 'EQUIPMENT' && (EQUIPMENT_TYPES.has(item.type) || item.hasStats)) ||
        (selectedSignal === 'EFFECTS' && item.hasEffects) ||
        (selectedSignal === 'LORE' && item.hasLore);

      return matchSearch && matchType && matchQuality && matchSignal;
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
        valA = a.marketVolume;
        valB = b.marketVolume;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return sortDesc ? Number(valB) - Number(valA) : Number(valA) - Number(valB);
    });
  }, [enrichedItems, debouncedSearch, selectedType, selectedQuality, selectedSignal, sortBy, sortDesc]);

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

  const open = (item: EnrichedItem) => openItem(item.id);

  const renderBadges = (item: EnrichedItem) => (
    <div className="item-badges">
      {item.hasMarket && <span className="badge market"><TrendingUp size={12} aria-hidden="true" /> <span>Market</span></span>}
      {!item.tradeable && <span className="badge vendor"><Store size={12} aria-hidden="true" /> <span>Vendor</span></span>}
      {item.hasRecipe && <span className="badge craft"><Hammer size={12} aria-hidden="true" /> <span>Craft</span></span>}
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

      <section className="db-controls">
        <div className="control-group search-control">
          <label className="control-label">Search</label>
          <div className="search-shell">
            <Search size={15} />
            <input
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
          <select className="control-input" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All types' : formatLabel(t)}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Quality</label>
          <select className="control-input" value={selectedQuality} onChange={(e) => setSelectedQuality(e.target.value)}>
            {qualities.map(q => <option key={q} value={q}>{q === 'ALL' ? 'All qualities' : q}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Signal</label>
          <select className="control-input" value={selectedSignal} onChange={(e) => setSelectedSignal(e.target.value as SignalFilter)}>
            {SIGNAL_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Sort</label>
          <select className="control-input" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
            {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
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
                  <th onClick={() => handleSort('price')}>Market</th>
                  <th onClick={() => handleSort('vendor')}>Vendor</th>
                  <th onClick={() => handleSort('volume')}>3D Vol</th>
                  <th onClick={() => handleSort('usage')}>Usage</th>
                  <th className="left">Signals</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map(item => (
                  <tr key={item.id} onClick={() => open(item)} tabIndex={0} onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') open(item);
                  }}>
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
                    <td className="mono">{formatGold(item.marketPrice)}</td>
                    <td className="mono">{formatGold(item.vendorPrice)}</td>
                    <td className="mono">{item.marketVolume ? item.marketVolume.toLocaleString() : '-'}</td>
                    <td className="mono">{item.usageScore ? item.usageScore.toLocaleString() : '-'}</td>
                    <td className="signals-cell">{renderBadges(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={viewMode === 'cards' ? 'item-grid forced' : 'item-grid'}>
            {visibleItems.map(item => (
              <button key={item.id} type="button" onClick={() => open(item)} className="item-card">
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
                    <span><small>Vol</small><strong>{item.marketVolume ? item.marketVolume.toLocaleString() : '-'}</strong></span>
                    <span><small>Usage</small><strong>{item.usageScore || '-'}</strong></span>
                  </div>
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
        .db-controls {
          align-items: end;
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          gap: 0.85rem;
          grid-template-columns: minmax(240px, 2fr) repeat(4, minmax(128px, 1fr)) minmax(88px, auto) minmax(118px, auto);
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
          min-width: 1060px;
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
        .items-table td:nth-child(1) { width: 32%; }
        .items-table th:nth-child(2),
        .items-table td:nth-child(2) { width: 12%; }
        .items-table th:nth-child(3),
        .items-table td:nth-child(3) { width: 10%; }
        .items-table th:nth-child(4),
        .items-table td:nth-child(4),
        .items-table th:nth-child(5),
        .items-table td:nth-child(5),
        .items-table th:nth-child(6),
        .items-table td:nth-child(6),
        .items-table th:nth-child(7),
        .items-table td:nth-child(7) { width: 8%; }
        .items-table th:nth-child(8),
        .items-table td:nth-child(8) { width: 14%; }
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
        :global(.items-db-page .badge.vendor) { color: #fbbf24; background: rgba(251,191,36,0.08); }
        :global(.items-db-page .badge.craft) { color: #60a5fa; background: rgba(96,165,250,0.08); }
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
