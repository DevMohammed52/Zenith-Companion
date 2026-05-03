'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ExternalLink, Shield, Zap, Package, BookOpen,
  MapPin, Hammer, TrendingUp, Info, Target, Lock, Plus
} from 'lucide-react';
import { useItemModal } from '@/context/ItemModalContext';
import { useRouter } from 'next/navigation';
import { useCrafting } from '@/context/CraftingContext';
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from '@/lib/preferences';
import { isCraftingQueueRecipe } from '@/lib/crafting-queue';

import { getRecipeUses } from '@/lib/game-logic';
import { getItemTrueValue } from '@/lib/ev-logic';
import { useData } from '@/context/DataContext';
import { VENDOR_ITEMS, getMerchantBuyPrice } from '@/constants';
import { getLoreEntry, getLoreForItem } from '@/data/lore';

interface ItemModalProps {
  id: string;
  onClose: () => void;
}

type AcquisitionSource = {
  type?: string;
  name?: string;
  chance?: number | string;
  location?: string;
};

const formatGold = (value: number) => `${Math.round(value).toLocaleString()}g`;

const normalizeSourceType = (type?: string) => (type || '').trim().toUpperCase().replace(/\s+/g, '_');

const getSourceRoute = (source: AcquisitionSource) => {
  const type = normalizeSourceType(source.type);
  const target = type.includes('BOSS') ? 'bosses' : type === 'DUNGEON' ? 'dungeons' : 'combat';
  return `/${target}?search=${encodeURIComponent(source.name || '')}`;
};

const getRecipeOutputName = (recipeItem: any) => (
  recipeItem?.recipe_yield?.item_name ||
  recipeItem?.recipe?.result?.item_name ||
  recipeItem?.recipe?.result?.name ||
  ''
);

const getPreferredRecipeNameForOutput = (outputName: string, fallbackName: string | undefined, allItemsDb: any) => {
  const candidates = Object.values(allItemsDb || {}).filter((candidate: any) => (
    candidate?.type === 'RECIPE' && getRecipeOutputName(candidate).toLowerCase() === outputName.toLowerCase()
  )) as any[];

  if (candidates.length === 0) return fallbackName || '';

  candidates.sort((a, b) => {
    const aUntradable = a.is_tradeable === false || a.name?.includes('(Untradable)');
    const bUntradable = b.is_tradeable === false || b.name?.includes('(Untradable)');
    if (aUntradable !== bUntradable) return aUntradable ? 1 : -1;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  return candidates[0]?.name || fallbackName || '';
};

export default function ItemModal({ id, onClose }: ItemModalProps) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const { openItemByName, prefetchItem, getCachedItem, setCachedItem } = useItemModal();
  const { queue, addToQueue } = useCrafting();
  const { marketData, allItemsDb } = useData();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageMap, setUsageMap] = useState<any>(null);

  useEffect(() => {
    fetch('/usage-map.json').then(r => r.json()).then(setUsageMap).catch(() => {});
  }, []);

  // Keyboard support for Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    async function fetchItem() {
      // Check cache first
      const cached = getCachedItem(id);
      if (cached) {
        setItem(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/items/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Item not found');
        } else {
          setItem(data);
          setCachedItem(id, data);
        }
      } catch (e) {
        setError('Failed to connect to database');
        console.error('Failed to load item:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id, getCachedItem, setCachedItem]);

  const intrinsicValue = useMemo(() => {
    if (!item || !marketData || !allItemsDb) return 0;
    return getItemTrueValue(item.name, marketData, allItemsDb);
  }, [item, marketData, allItemsDb]);

  const formatStatName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Percent', '%')
      .replace('Chance', 'Chance')
      .trim();
  };

  const GOLD_ICON = "https://cdn.idle-mmo.com/cdn-cgi/image/width=20,height=20,format=auto/global/gold_coin.png";

  const qualityColors: any = {
    STANDARD: 'var(--text-secondary)',
    REFINED: '#4ade80',
    PREMIUM: '#60a5fa',
    EPIC: '#a855f7',
    LEGENDARY: '#f59e0b',
    MYTHIC: '#ef4444',
    UNIQUE: '#ec4899'
  };

  const qColor = item ? qualityColors[item.quality] || qualityColors.STANDARD : qualityColors.STANDARD;
  const itemName = item?.name;
  const loreLinks = useMemo(() => itemName ? getLoreForItem(itemName) : [], [itemName]);
  const recipeData = useMemo(() => item?.recipe || item?.produced_from, [item]);
  const recipeMats = useMemo(() => recipeData?.ingredients || recipeData?.materials || recipeData?.mats || [], [recipeData]);
  const recipeSkill = recipeData?.skill || 'CRAFTING';
  const recipeLevel = recipeData?.level || recipeData?.level_required || 1;
  const recipeOutputName = item?.type === 'RECIPE' ? getRecipeOutputName(item) : item?.name || '';
  const recipeOutputItem = recipeOutputName ? (allItemsDb?.[recipeOutputName] || marketData?.[recipeOutputName]) : null;
  const craftedByRecipeName = useMemo(
    () => item && item.type !== 'RECIPE'
      ? getPreferredRecipeNameForOutput(item.name, item.produced_from?.recipe_name, allItemsDb)
      : '',
    [allItemsDb, item],
  );
  const craftedByRecipeItem = craftedByRecipeName ? allItemsDb?.[craftedByRecipeName] : null;
  const queueRecipeName = recipeSkill?.toUpperCase() === 'ALCHEMY' ? recipeOutputName : '';
  const canQueueRecipe = recipeSkill?.toUpperCase() === 'ALCHEMY' && isCraftingQueueRecipe(queueRecipeName);
  const queuedRecipeCount = queueRecipeName ? queue[queueRecipeName] || 0 : 0;
  const vendorInfo = item ? VENDOR_ITEMS[item.name] : null;

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (typeof val === 'boolean') return val.toString();
    return JSON.stringify(val);
  };

  // Human-readable effect parser
  const parseEffect = (eff: any) => {
    if (!eff || typeof eff !== 'object') return renderValue(eff);
    const valStr = eff.value_type === 'percentage' ? `${eff.value}%` : 
                   eff.value_type === 'efficiency' ? `${eff.value}%` : eff.value;
    const targetStr = eff.target ? ` ${formatStatName(eff.target)}` : '';
    const attrStr = formatStatName(eff.attribute);
    const duration = eff.length ? ` (${Math.floor(eff.length / 60000)}m)` : '';
    return `+${valStr}${targetStr} ${attrStr}${duration}`;
  };

  const relationEntry = useMemo(() => {
    if (!usageMap || !item?.name) return null;
    const entry = usageMap[item.name];
    return entry && typeof entry === 'object' ? entry : null;
  }, [item, usageMap]);

  const acquisitionSources = useMemo(() => {
    const rawSources = [
      ...(Array.isArray(item?.dropped_by) ? item.dropped_by : []),
      ...(Array.isArray(relationEntry?.dropped_by) ? relationEntry.dropped_by : []),
    ];
    const seen = new Set<string>();

    return rawSources.filter((source: AcquisitionSource) => {
      const key = `${normalizeSourceType(source.type)}:${source.name || ''}:${source.location || ''}`;
      if (!source?.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a: AcquisitionSource, b: AcquisitionSource) => Number(b.chance || 0) - Number(a.chance || 0));
  }, [item, relationEntry]);

  const groupedUtility = useMemo(() => {
    const direct = Array.isArray(item?.required_for) ? item.required_for : [];

    // Safety check: usageMap[name] should be an object with a required_for array
    const fromMap = (relationEntry && typeof relationEntry === 'object' && Array.isArray(relationEntry.required_for))
      ? relationEntry.required_for
      : [];
    
    // Combine and normalize
    const combined = [...direct];
    fromMap.forEach((use: any) => {
      // Handle both string array and object array formats
      const name = typeof use === 'string' ? use : use.name;
      if (!combined.find(c => c.name === name)) {
        combined.push({ 
          name, 
          type: typeof use === 'object' ? use.type : 'CRAFTING', 
          amount: typeof use === 'object' ? use.amount : '?' 
        });
      }
    });

    if (combined.length === 0) return {};
    return combined.reduce((acc: any, curr: any) => {
      const type = curr.type || 'OTHER';
      if (!acc[type]) acc[type] = [];
      acc[type].push(curr);
      return acc;
    }, {});
  }, [item, relationEntry]);

  const saleInsight = useMemo(() => {
    if (!item) return null;
    const marketGross = Number(item.avg_3 || item.price || marketData?.[item.name]?.avg_3 || 0);
    const vendorBase = Number(item.vendor_price || 0);
    if (!marketGross && !vendorBase) return null;

    const taxRate = getMarketTaxRate(preferences.membership);
    const marketNet = item.is_tradeable ? marketGross * getMarketTaxMultiplier(preferences.membership) : 0;
    const vendorNet = vendorBase * (1 + ((Number(preferences.barteringBoost) || 0) / 100));
    const bestPath = marketNet >= vendorNet ? 'Market' : 'Vendor';
    const bestRevenue = Math.max(marketNet, vendorNet);

    return {
      bestPath,
      bestRevenue,
      marketGross,
      marketNet,
      vendorNet,
      taxRate,
      volume: Number(item.vol_3 || marketData?.[item.name]?.vol_3 || 0),
    };
  }, [item, marketData, preferences.barteringBoost, preferences.membership]);

  const showUtility = Object.keys(groupedUtility).length > 0;
  const showMarket = item && item.is_tradeable;
  const showAcquisition = acquisitionSources.length > 0;
  const showRecipe = item && (item.recipe || item.produced_from);
  const showYield = item && item.recipe_yield;
  const showLootTable = (item && item.loot_table && item.loot_table.length > 0) || (item && item.chest_drops && item.chest_drops.length > 0);
  const showSellAdvisor = item && saleInsight;
  
  const hasStats = item && item.stats && Object.keys(item.stats).length > 0;
  const hasEffects = item && item.effects && (Array.isArray(item.effects) ? item.effects.length > 0 : Object.keys(item.effects).length > 0);
  const hasRestoration = item && (item.health_restore > 0 || item.hunger_restore > 0);
  const hasRequirements = item && item.requirements && Object.keys(item.requirements).length > 0;

  if (error) {
    return (
      <div className="modal-container">
        <div className="modal-backdrop" onClick={onClose} />
        <div className="error-card">
          <div className="error-label">Registry Error</div>
          <div className="error-msg">{error}</div>
          <button onClick={onClose} className="error-btn">Dismiss</button>
        </div>
        <style jsx>{`
          .modal-container { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem; }
          .modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(20px); }
          .error-card { position: relative; padding: 3rem; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; text-align: center; max-width: 400px; }
          .error-label { color: #f87171; margin-bottom: 0.5rem; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
          .error-msg { color: #fff; font-size: 1.25rem; font-weight: 300; margin-bottom: 2rem; }
          .error-btn { padding: 0.75rem 2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); border-radius: 12px; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="modal-container">
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-card">
        <div className="modal-header-section" style={{ borderBottomColor: qColor + '33' }}>
          <div className="header-flex">
            <div className="header-left">
              {item?.image_url && <img src={item.image_url} alt="" className="item-icon-large" />}
              <div>
                <h2 className="item-title" style={{ color: qColor }}>
                  {item?.name || 'Loading...'}
                </h2>
                <div className="badge-row">
                  <span className="type-badge">{(item?.type || 'UNKNOWN').replace(/_/g, ' ')}</span>
                  <span className="dot">•</span>
                  <span className="quality-text" style={{ color: qColor }}>{item?.quality || 'STANDARD'}</span>
                  {item?.recipe_yield?.uses && (
                    <>
                      <span className="dot">•</span>
                      <span className="uses-badge">
                        {item.recipe_yield.uses === 'Infinite' ? '∞ USES' : `${item.recipe_yield.uses} USES`}
                      </span>
                    </>
                  )}
                  {item?.vendor_price > 0 && (
                    <>
                      <span className="dot">•</span>
                      <span className="vendor-badge">
                        <img src={GOLD_ICON} alt="Gold" />
                        {(item.vendor_price || 0).toLocaleString()}
                      </span>
                    </>
                  )}
                  {item && !item.is_tradeable && (
                    <>
                      <span className="dot">•</span>
                      <span className="untradable-badge">Untradable</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body custom-scrollbar">
          {loading ? (
            <div className="skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-box" />)}
            </div>
          ) : (
            <div className="bento-grid">
              {vendorInfo && (
                <div className="bento-card vendor-info-card full-width">
                  <div className="card-label"><Package size={14} /> VENDOR EXCLUSIVE</div>
                  <div className="vendor-message">
                    This item can only be bought from the vendor at <a href="https://web.idle-mmo.com/merchants?category=GENERAL_GOODS" target="_blank" className="vendor-link">General Goods</a> at the price of <strong>{vendorInfo.price} {vendorInfo.currency}</strong>.
                    <p className="vendor-warning">You cannot obtain this from the market and cannot sell it on the market as well and it is not tradable as well.</p>
                  </div>
                </div>
              )}

              {item?.description && (
                <div className="bento-card description-card full-width" style={{ background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
                  <div className="card-label"><Info size={14} /> Item Description</div>
                  <div className="description-text" style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    &quot;{item.description}&quot;
                  </div>
                </div>
              )}

              {showSellAdvisor && saleInsight && (
                <div className="bento-card sell-advisor-card full-width">
                  <div className="card-label"><Target size={14} /> Sell Advisor</div>
                  <div className="sell-advisor-grid">
                    <div className="sell-advisor-main">
                      <span>Best sell path</span>
                      <strong>{saleInsight.bestPath}</strong>
                      <em>{formatGold(saleInsight.bestRevenue)} net revenue</em>
                    </div>
                    <div className="sell-advisor-metrics">
                      <div>
                        <span>Market net {saleInsight.marketGross ? `(${Math.round(saleInsight.taxRate * 100)}% tax)` : ''}</span>
                        <strong>{saleInsight.marketGross ? formatGold(saleInsight.marketNet) : 'No market'}</strong>
                      </div>
                      <div>
                        <span>Vendor net</span>
                        <strong>{saleInsight.vendorNet ? formatGold(saleInsight.vendorNet) : 'No vendor'}</strong>
                      </div>
                      <div>
                        <span>3-day volume</span>
                        <strong>{saleInsight.volume.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loreLinks.length > 0 && (
                <div className="bento-card lore-thread-card full-width">
                  <div className="card-label"><BookOpen size={14} /> Lore Thread</div>
                  <div className="lore-thread-list">
                    {loreLinks.map((link) => {
                      const primary = getLoreEntry(link.entryIds[0]);
                      const linkedEntries = link.entryIds.map((entryId) => getLoreEntry(entryId)).filter(Boolean);
                      if (!primary) return null;

                      return (
                        <button
                          key={`${link.itemName}-${primary.id}`}
                          type="button"
                          className="lore-thread-row"
                          onClick={() => {
                            onClose();
                            router.push(`/lore?thread=${primary.id}`);
                          }}
                        >
                          <span className={`lore-confidence ${link.confidence}`}>{link.confidence}</span>
                          <strong>{primary.title}</strong>
                          <small>{link.reason}</small>
                          <em>{linkedEntries.map((entry) => entry.title).join(' / ')}</em>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {showMarket && (
                <div className="bento-card market-card">
                  <div className="card-label"><TrendingUp size={14} /> Market Overview</div>
                  {(item.avg_3 || item.price) ? (
                    <>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div className="price-row">
                          <div className="price-main">
                            {(item.avg_3 || item.price || 0).toLocaleString()}g
                          </div>
                          <div className="price-sub">Current Market Price</div>
                        </div>

                        {intrinsicValue > 0 && Math.abs(intrinsicValue - (item.avg_3 || item.price || 0)) > 1 && (
                          <div className="price-row" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                            <div className="price-main" style={{ color: 'var(--text-accent)' }}>
                              {Math.floor(intrinsicValue).toLocaleString()}g
                            </div>
                            <div className="price-sub" style={{ color: 'var(--text-accent)' }}>Intrinsic Valuation</div>
                          </div>
                        )}
                      </div>

                      <div className="market-stats">
                        <div className="m-stat">
                          <span>3D Average</span>
                          <strong>{item.avg_3 ? `${(item.avg_3 || 0).toLocaleString()}g` : '—'}</strong>
                        </div>
                        <div className="m-stat">
                          <span>3D Volume</span>
                          <strong>{(item.vol_3 || 0).toLocaleString()}</strong>
                        </div>
                        <div className="m-stat">
                          <span>Vendor Sell</span>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {(item.vendor_price || 0).toLocaleString()}g
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="market-empty">
                      <div className="empty-title">No Market Data Yet</div>
                      <div className="empty-sub">This item is tradeable but has no recent history.</div>
                    </div>
                  )}
                </div>
              )}

              {hasRequirements && (
                <div className="bento-card req-card">
                  <div className="card-label"><Lock size={14} /> Usage Requirements</div>
                  <div className="stats-mini-grid">
                    {Object.entries(item.requirements).map(([key, val]: [string, any]) => (
                      <div key={key} className="stat-pill req-pill">
                        <span className="stat-val">{val}</span>
                        <span className="stat-key">{formatStatName(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consumable Restoration Card */}
              {hasRestoration && (
                <div className="bento-card restoration-card-box">
                  <div className="card-label"><Zap size={14} /> Consumable Restoration</div>
                  <div className="stats-mini-grid">
                    {item.health_restore > 0 && (
                      <div className="stat-pill health-pill">
                        <span className="stat-val">+{item.health_restore}</span>
                        <span className="stat-key">HEALTH</span>
                      </div>
                    )}
                    {item.hunger_restore > 0 && (
                      <div className="stat-pill hunger-pill">
                        <span className="stat-val">+{item.hunger_restore}</span>
                        <span className="stat-key">HUNGER</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasStats && (
                <div className="bento-card stats-card">
                  <div className="card-label"><Shield size={14} /> Combat Attributes</div>
                  <div className="stats-mini-grid">
                    {Object.entries(item.stats).map(([key, val]: [string, any]) => (
                      <div key={key} className="stat-pill">
                        <span className="stat-val">
                          {typeof val === 'number' && val > 0 ? `+${val}` : renderValue(val)}
                        </span>
                        <span className="stat-key">{formatStatName(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasEffects && (
                <div className="bento-card effects-card">
                  <div className="card-label">
                    {item.type === 'POTION' ? <Zap size={14} /> : <Zap size={14} />} 
                    {item.type === 'POTION' ? ' ACTIVE EFFECTS' : ' PASSIVE EFFECTS'}
                  </div>
                  <div className="stats-mini-grid">
                    {Array.isArray(item.effects) ? (
                      item.effects.map((eff: any, i: number) => (
                        <div key={i} className="stat-pill effect-pill full-width-pill">
                          <span className="stat-val">{parseEffect(eff)}</span>
                        </div>
                      ))
                    ) : (
                      Object.entries(item.effects).map(([key, val]: [string, any]) => (
                        <div key={key} className="stat-pill effect-pill">
                          <span className="stat-val">
                            {typeof val === 'number' && val > 0 ? `+${val}` : parseEffect(val)}
                          </span>
                          <span className="stat-key">{formatStatName(key)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {showYield && (
                <button
                  type="button"
                  className="bento-card yield-card item-link-card"
                  onClick={() => openItemByName?.(item.recipe_yield.item_name)}
                  onMouseEnter={() => prefetchItem?.(item.recipe_yield.item_name)}
                >
                  <div className="card-label"><Zap size={14} color="var(--text-accent)" /> CRAFTS</div>
                  <div className="yield-content">
                    <div className="yield-item-name">{item.recipe_yield.item_name}</div>
                    <div className="yield-details">
                      {recipeOutputItem?.type || 'ITEM'}{recipeOutputItem?.quality ? ` - ${recipeOutputItem.quality}` : ''}
                    </div>
                    <div className="yield-stats">
                        <div className="y-stat">
                            <span>Yield Type</span>
                            <strong>{item.recipe_yield.uses === 'Infinite' ? 'Continuous' : 'Limited'}</strong>
                        </div>
                        <div className="y-stat">
                            <span>Max Production</span>
                            <strong>{item.recipe_yield.uses} units</strong>
                        </div>
                        {(item.recipe_yield.market_price || recipeOutputItem?.avg_3) && (
                          <div className="y-stat">
                              <span>Market</span>
                              <strong>{Math.round(item.recipe_yield.market_price || recipeOutputItem?.avg_3).toLocaleString()}g</strong>
                          </div>
                        )}
                    </div>
                    <div className="yield-action">
                      <span>Open crafted item</span>
                      <ExternalLink size={13} />
                    </div>
                  </div>
                </button>
              )}

              {showLootTable && (
                <div className="bento-card loot-card">
                  <div className="card-label"><Package size={14} /> CHEST CONTENTS</div>
                  <div className="list-container scroll-y">
                    {(item.loot_table || item.chest_drops || []).map((drop: any, i: number) => (
                      <div key={i} className="loot-row" onClick={() => openItemByName?.(drop.item_name || drop.name)}>
                        <div className="loot-info">
                            <div className="loot-name">{drop.item_name || drop.name}</div>
                            <div className="loot-qty">x{drop.quantity}</div>
                        </div>
                        <div className="loot-chance">{drop.chance}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAcquisition && (
                <div className="bento-card acquisition-card">
                  <div className="card-label"><MapPin size={14} /> Acquisition</div>
                  <div className="list-container scroll-y">
                    {acquisitionSources.map((src: any, i: number) => (
                      <div 
                        key={i} 
                        className="source-pill group-source" 
                        onClick={() => {
                          onClose();
                          router.push(getSourceRoute(src));
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="source-meta">
                          <span className="source-type">{src.type}</span>
                          <span className="source-chance">{src.chance === 'Unknown' ? '' : `${src.chance}%`}</span>
                        </div>
                        <div className="source-name">{src.name}</div>
                        <div className="source-loc">{src.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showUtility && (
                <div className="bento-card utility-card">
                  <div className="card-label"><Target size={14} /> Utility</div>
                  <div className="list-container scroll-y">
                    {Object.entries(groupedUtility).map(([type, items]: [string, any]) => (
                      <div key={type} className="utility-group">
                        <div className="utility-group-title">{type}</div>
                        <div className="utility-group-items">
                          {items.map((use: any, i: number) => (
                            <div key={i} className="utility-pill-compact" onClick={() => openItemByName?.(use.name)}>
                              <div className="up-name">{use.name}</div>
                              <div className="up-qty">x{use.amount}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Recipe Card (Unified) */}
              {showRecipe && (() => {
                const getRecipeMatUnitPrice = (m: any) => {
                  const merchantBuyPrice = getMerchantBuyPrice(m.name || m.item_name);
                  if (merchantBuyPrice > 0) return merchantBuyPrice;
                  const injectedPrice = Number(m.price || 0);
                  if (injectedPrice > 0) return injectedPrice;
                  return 0;
                };
                const totalMatCost = recipeMats.reduce((acc: number, m: any) => acc + (getRecipeMatUnitPrice(m) * (m.amount || m.quantity || 1)), 0);
                
                // Uses logic from shared core
                const rawUses = getRecipeUses(item);
                const uses = rawUses === 'Infinite' ? Infinity : Number(rawUses);

                const recipePrice = item.type === 'RECIPE' ? (item.avg_3 || item.price || 0) : (item.produced_from?.recipe_price || 0);
                const resultPrice = item.type === 'RECIPE' ? (item.recipe_yield?.market_price || 0) : (item.avg_3 || item.price || 0);

                // Math
                const recipeCostPerCraft = (uses === Infinity) ? 0 : (recipePrice / uses);
                const investment = totalMatCost + recipeCostPerCraft;
                
                // Compare Market vs Vendor
                const marketTaxRate = getMarketTaxRate(preferences.membership);
                const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);
                const marketRevenue = resultPrice * marketTaxMultiplier;
                const vendorBase = item.type === 'RECIPE' ? (item.recipe_yield?.vendor_price || 0) : (item.vendor_price || 0);
                const vendorRevenue = vendorBase * (1 + ((Number(preferences.barteringBoost) || 0) / 100));
                
                const bestRevenue = Math.max(marketRevenue, vendorRevenue);
                const profit = bestRevenue - investment;
                const isProfitable = profit > 0;
                const bestPath = vendorRevenue > marketRevenue ? 'VENDOR' : 'MARKET';

                // Total ROI for limited uses
                const totalProfit = (uses === Infinity) ? profit : (profit * uses);

                return (
                  <div className="bento-card recipe-card">
                    <div className="card-label"><Hammer size={14} /> {item.produced_from ? 'PRODUCED FROM' : 'CRAFTING RECIPE'}</div>
                    <div className="recipe-box">
                      <div className="recipe-header-flex">
                        <div className="recipe-req">Lvl {recipeLevel} {recipeSkill}</div>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {resultPrice > 0 && (
                            <div className={`roi-badge ${isProfitable ? 'pos' : 'neg'}`} style={{ whiteSpace: 'nowrap' }}>
                              {isProfitable ? 'PROFITABLE' : 'LOSS'}
                            </div>
                          )}
                          {canQueueRecipe && (
                            <button 
                              onClick={() => addToQueue(queueRecipeName)}
                              className="add-queue-btn"
                              aria-label={`Add ${queueRecipeName} to crafting queue`}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              <Plus size={12} /> {queuedRecipeCount > 0 ? `QUEUE (${queuedRecipeCount})` : 'QUEUE'}
                            </button>
                          )}
                        </div>
                      </div>

                      {craftedByRecipeName && (
                        <button
                          type="button"
                          className="recipe-link-button"
                          onClick={() => openItemByName?.(craftedByRecipeName)}
                          onMouseEnter={() => prefetchItem?.(craftedByRecipeName)}
                        >
                          <span>
                            <span className="recipe-link-kicker">Recipe item</span>
                            <strong>{craftedByRecipeName}</strong>
                            {craftedByRecipeItem?.quality && <em>{craftedByRecipeItem.quality}</em>}
                          </span>
                          <ExternalLink size={14} />
                        </button>
                      )}
                      
                      <div className="list-container scroll-y" style={{ maxHeight: '180px' }}>
                        {recipeMats.map((ing: any, idx: number) => (
                          <div key={idx} className="ing-row" onClick={() => openItemByName?.(ing.name || ing.item_name)}>
                            <div className="ing-name-link">
                              {ing?.name || ing?.item_name}
                              <span className="ing-price-sub">@{getRecipeMatUnitPrice(ing).toLocaleString()}g</span>
                            </div>
                            <span className="ing-qty">x{ing?.amount || ing?.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {(resultPrice > 0 || vendorBase > 0) && (
                        <div className="profit-analysis">
                          <div className="analysis-row">
                            <span>Materials Cost</span>
                            <strong>{totalMatCost.toLocaleString()}g</strong>
                          </div>
                          {recipePrice > 0 && (
                            <div className="analysis-row">
                              <span>Recipe Cost {uses !== Infinity && <small>({uses} uses)</small>}</span>
                              <strong>
                                {uses === Infinity ? '0g (Owned)' : `${Math.ceil(recipeCostPerCraft).toLocaleString()}g`}
                                {uses !== Infinity && <small style={{ marginLeft: '4px' }}>({recipePrice.toLocaleString()}g total)</small>}
                              </strong>
                            </div>
                          )}
                          <div className="analysis-row" style={{ color: bestPath === 'MARKET' ? 'var(--text-accent)' : 'rgba(255,255,255,0.4)' }}>
                            <span>Market Net <small>(After {Math.round(marketTaxRate * 100)}% Tax)</small></span>
                            <strong>{marketRevenue.toLocaleString()}g</strong>
                          </div>
                          {vendorBase > 0 && (
                            <div className="analysis-row" style={{ color: bestPath === 'VENDOR' ? 'var(--text-accent)' : 'rgba(255,255,255,0.4)' }}>
                                <span>Vendor Net <small>(w/ {preferences.barteringBoost}% Barter)</small></span>
                                <strong>{vendorRevenue.toLocaleString()}g</strong>
                            </div>
                          )}
                          <div className="profit-footer" style={{ borderTopColor: isProfitable ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }}>
                            <span>{uses === Infinity ? `Profit (${bestPath})` : `Total ROI (${uses} uses)`}</span>
                            <strong style={{ color: isProfitable ? '#22c55e' : '#ef4444' }}>
                              {isProfitable ? '+' : ''}{Math.floor(totalProfit).toLocaleString()}g
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <div style={{ height: '4rem' }}></div>
        </div>

        <div className="modal-footer">
          <div className="item-id">ID: {id}</div>
          {item?.is_tradeable && (
            <a href={`https://web.idle-mmo.com/item/inspect/${id}`} target="_blank" className="market-link">
              View Official Listings <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-container { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .modal-backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(16px); }
        .modal-card { position: relative; width: 100%; max-width: 1200px; max-height: 90vh; background: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.8); }
        
        .modal-header-section { flex-shrink: 0; padding: 2rem 3rem; background: linear-gradient(to bottom, rgba(255,255,255,0.03), transparent); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .header-flex { display: flex; align-items: center; justify-content: space-between; }
        .header-left { display: flex; align-items: center; gap: 1.5rem; }
        .item-icon-large { width: 64px; height: 64px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
        .item-title { font-size: 2.25rem; font-weight: 800; margin: 0; letter-spacing: -0.03em; }
        
        .badge-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
        .type-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); padding: 2px 10px; border-radius: 6px; }
        .quality-text { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .uses-badge { font-size: 10px; font-weight: 800; color: #a855f7; background: rgba(168, 85, 247, 0.1); padding: 2px 8px; border-radius: 4px; }
        .vendor-badge { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #fbbf24; }
        .vendor-badge img { width: 14px; height: 14px; }
        
        .modal-close-btn { background: rgba(255,255,255,0.05); border: none; color: rgba(255,255,255,0.4); padding: 10px; border-radius: 50%; cursor: pointer; transition: all 0.2s; }
        .modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; transform: rotate(90deg); }

        .modal-body { flex: 1; overflow-y: auto; padding: 3rem; position: relative; }
        .bento-grid { display: flex; flex-wrap: wrap; gap: 1.5rem; }
        .bento-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; flex: 1 1 350px; min-width: 300px; min-height: 180px; }
        button.bento-card { color: inherit; font: inherit; text-align: left; width: auto; }
        .item-link-card { transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease; }
        .item-link-card:hover { transform: translateY(-2px); }
        .item-link-card:focus-visible,
        .recipe-link-button:focus-visible,
        .add-queue-btn:focus-visible {
          outline: none;
          border-color: var(--text-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 82%);
        }
        .full-width { flex: 1 1 100% !important; }
        .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.25); display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem; letter-spacing: 0.15em; }

        .market-card { flex: 2 1 600px; background: linear-gradient(135deg, rgba(56,189,248,0.08), transparent); }
        .price-row { margin-bottom: 1.5rem; }
        .price-main { font-size: 3rem; font-weight: 900; color: #fff; letter-spacing: -0.04em; }
        .price-sub { font-size: 0.85rem; color: #38bdf8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .market-stats { display: flex; gap: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .m-stat { display: flex; flex-direction: column; gap: 4px; }
        .m-stat span { font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; }
        .m-stat strong { font-size: 1.1rem; color: #fff; }

        .req-card { border-color: rgba(239, 68, 68, 0.2); background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent); flex: 1 1 300px; }
        .req-pill { border-color: rgba(239, 68, 68, 0.2); }
        .req-pill .stat-val { color: #f87171; }

        .stats-mini-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; width: 100%; }
        .stat-pill { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 12px; display: flex; flex-direction: column; gap: 2px; }
        .stat-val { font-size: 1.1rem; font-weight: 800; color: #fff; }
        .stat-key { font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; }
        .effect-pill { border-color: rgba(168, 85, 247, 0.2); background: rgba(168, 85, 247, 0.02); }
        .effect-pill .stat-val { color: #c084fc; font-size: 0.9rem; }
        .full-width-pill { grid-column: span 1; }

        .description-text { font-size: 1.1rem; line-height: 1.6; color: rgba(255,255,255,0.8); font-style: italic; }

        .sell-advisor-card {
          background:
            radial-gradient(circle at top left, rgba(56,189,248,0.13), transparent 34%),
            linear-gradient(135deg, rgba(74,222,128,0.06), transparent),
            rgba(255,255,255,0.03);
          border-color: rgba(56,189,248,0.22);
        }

        .sell-advisor-grid {
          align-items: stretch;
          display: grid;
          gap: 0.85rem;
          grid-template-columns: minmax(180px, 0.65fr) minmax(0, 1.35fr);
          width: 100%;
        }

        .sell-advisor-main,
        .sell-advisor-metrics > div {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          min-width: 0;
          padding: 1rem;
        }

        .sell-advisor-main {
          border-color: rgba(56,189,248,0.22);
          display: grid;
          gap: 0.5rem;
        }

        .sell-advisor-main span,
        .sell-advisor-metrics span {
          color: rgba(255,255,255,0.45);
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sell-advisor-main strong {
          color: #fff;
          font-size: clamp(1.5rem, 4vw, 2.15rem);
          font-weight: 900;
          line-height: 1;
        }

        .sell-advisor-main em {
          color: rgba(255,255,255,0.45);
          font-style: normal;
          overflow-wrap: anywhere;
        }

        .sell-advisor-metrics {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          min-width: 0;
        }

        .sell-advisor-metrics > div {
          display: grid;
          gap: 0.28rem;
        }

        .sell-advisor-metrics strong {
          color: #fff;
          font-size: 1rem;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .lore-thread-card {
          background:
            linear-gradient(135deg, rgba(245,176,65,0.11), transparent),
            rgba(255,255,255,0.03);
          border-color: rgba(245,176,65,0.2);
        }

        .lore-thread-list {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .lore-thread-row {
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          color: #fff;
          cursor: pointer;
          display: grid;
          gap: 0.25rem;
          min-width: 0;
          padding: 0.85rem;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
        }

        .lore-thread-row:hover {
          background: rgba(245,176,65,0.08);
          border-color: rgba(245,176,65,0.34);
          transform: translateY(-1px);
        }

        .lore-thread-row strong,
        .lore-thread-row small,
        .lore-thread-row em {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .lore-thread-row small,
        .lore-thread-row em {
          color: rgba(255,255,255,0.52);
          font-style: normal;
          line-height: 1.45;
        }

        .lore-confidence {
          border-radius: 999px;
          display: inline-flex;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          padding: 0.18rem 0.52rem;
          text-transform: uppercase;
          width: max-content;
        }

        .lore-confidence.canon { background: rgba(74,222,128,0.12); color: #86efac; }
        .lore-confidence.inferred { background: rgba(245,176,65,0.13); color: #facc15; }
        .lore-confidence.theory { background: rgba(248,113,113,0.13); color: #fca5a5; }
        
        .vendor-info-card { background: linear-gradient(135deg, rgba(251,191,36,0.1), transparent); border-color: rgba(251,191,36,0.2); }
        .vendor-message { font-size: 1rem; line-height: 1.6; color: rgba(255,255,255,0.9); }
        .vendor-link { color: #fbbf24; text-decoration: underline; font-weight: 700; }
        .vendor-warning { margin-top: 0.75rem; color: #f87171; font-weight: 600; font-size: 0.9rem; }

        .restoration-row { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
        .rest-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }
        .rest-badge.health { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .rest-badge.hunger { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

        .yield-card { background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), transparent); border-color: rgba(168, 85, 247, 0.2); cursor: pointer; }
        .yield-card:hover { border-color: rgba(168, 85, 247, 0.45); background: linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(168, 85, 247, 0.02)); }
        .yield-item-name { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
        .yield-details { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-bottom: 1.5rem; }
        .yield-stats { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .y-stat { display: flex; flex-direction: column; gap: 2px; }
        .y-stat span { font-size: 0.65rem; color: rgba(168, 85, 247, 0.6); font-weight: 800; text-transform: uppercase; }
        .y-stat strong { font-size: 0.9rem; color: #fff; }
        .yield-action { align-items: center; color: var(--text-accent); display: flex; font-size: 0.75rem; font-weight: 900; gap: 0.4rem; letter-spacing: 0.06em; margin-top: 1.2rem; text-transform: uppercase; }

        .loot-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 0.5rem; cursor: pointer; transition: 0.2s; }
        .loot-row:hover { border-color: var(--text-accent); background: rgba(255,255,255,0.05); }
        .loot-name { font-size: 0.9rem; font-weight: 600; color: #fff; }
        .loot-qty { font-size: 0.75rem; color: var(--text-accent); font-family: monospace; }
        .loot-chance { font-size: 0.8rem; font-weight: 800; color: var(--text-success); }

        .utility-group { margin-bottom: 1.5rem; width: 100%; }
        .utility-group-title { font-size: 0.65rem; font-weight: 900; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
        .utility-group-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem; }
        .utility-pill-compact { padding: 0.6rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; }
        .utility-pill-compact:hover { border-color: var(--text-accent); background: rgba(255,255,255,0.08); }
        .up-name { font-size: 0.75rem; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .up-qty { font-size: 0.7rem; color: var(--text-accent); font-weight: 800; }

        .list-container { display: flex; flex-direction: column; max-height: 400px; width: 100%; padding: 4px; }
        .scroll-y { overflow-y: auto; padding-right: 0.75rem; }
        .scroll-y::-webkit-scrollbar { width: 4px; }
        .scroll-y::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .source-pill { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 16px; margin-bottom: 0.5rem; width: 100%; transition: all 0.2s ease; }
        .source-pill:hover { border-color: var(--text-accent); background: rgba(255,255,255,0.05); }
        .source-pill:hover .source-name { color: var(--text-accent); }
        .source-meta { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .source-type { font-size: 0.65rem; font-weight: 800; color: var(--text-accent); text-transform: uppercase; }
        .source-chance { font-size: 0.7rem; font-weight: 700; color: var(--text-success); }
        .source-name { font-size: 1rem; font-weight: 600; color: #fff; }
        .source-loc { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 4px; }

        .recipe-box { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
        .recipe-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .recipe-req { font-size: 0.75rem; color: #fbbf24; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .recipe-link-button {
          align-items: center;
          background: rgba(251,191,36,0.05);
          border: 1px solid rgba(251,191,36,0.16);
          border-radius: 14px;
          color: inherit;
          cursor: pointer;
          display: flex;
          font: inherit;
          gap: 0.85rem;
          justify-content: space-between;
          min-width: 0;
          padding: 0.85rem 1rem;
          text-align: left;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
          width: 100%;
        }
        .recipe-link-button:hover {
          background: rgba(251,191,36,0.1);
          border-color: rgba(251,191,36,0.32);
          transform: translateY(-1px);
        }
        .recipe-link-button > span {
          display: flex;
          flex-direction: column;
          gap: 0.18rem;
          min-width: 0;
        }
        .recipe-link-button strong {
          color: #fff;
          font-size: 0.95rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recipe-link-button em {
          color: rgba(255,255,255,0.42);
          font-size: 0.68rem;
          font-style: normal;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .recipe-link-kicker {
          color: #fbbf24;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        
        .roi-badge { font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em; }
        .roi-badge.pos { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .roi-badge.neg { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

        .add-queue-btn { 
          background: var(--bg-base); 
          border: 1px solid var(--border-subtle); 
          color: var(--text-accent); 
          font-size: 0.65rem; 
          font-weight: 700; 
          padding: 3px 8px; 
          border-radius: 4px; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 4px; 
          transition: all 0.2s ease; 
          letter-spacing: 0.05em;
        }
        .add-queue-btn:hover { 
          background: var(--text-accent); 
          color: #000; 
          border-color: var(--text-accent); 
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(56,189,248,0.2);
        }
        .add-queue-btn:active { transform: translateY(0); }

        .ing-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 0.75rem 1rem; 
          border: 1px solid rgba(255,255,255,0.03);
          background: rgba(255,255,255,0.01);
          cursor: pointer; 
          transition: all 0.2s ease; 
          border-radius: 12px; 
          margin-bottom: 0.5rem;
        }
        .ing-row:hover { 
          background: rgba(255,255,255,0.04); 
          border-color: var(--text-accent); 
          transform: translateX(4px);
        }
        .ing-row:hover .ing-name-link { color: var(--text-accent); }
        .ing-name-link { font-size: 0.95rem; color: #fff; display: flex; align-items: baseline; transition: color 0.2s ease; font-weight: 600; }
        .ing-price-sub { font-size: 0.7rem; color: rgba(255,255,255,0.25); margin-left: 8px; font-family: 'JetBrains Mono', monospace; font-weight: 400; }
        .ing-qty { font-weight: 800; color: var(--text-accent); font-family: 'JetBrains Mono', monospace; }

        .profit-analysis { margin-top: 1rem; background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .analysis-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px; color: rgba(255,255,255,0.4); font-weight: 600; }
        .analysis-row strong { color: rgba(255,255,255,0.8); }
        .analysis-row small { font-size: 0.65rem; opacity: 0.6; margin-left: 4px; }
        
        .profit-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: baseline; }
        .profit-footer span { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.4); letter-spacing: 0.05em; }
        .profit-footer strong { font-size: 1.4rem; font-weight: 900; letter-spacing: -0.02em; }

        .modal-footer { flex-shrink: 0; padding: 1.5rem 3rem; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); z-index: 10; }
        .item-id { font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.2); }
        .market-link { font-size: 0.85rem; color: #38bdf8; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .market-link:hover { text-decoration: underline; }

        @media (max-width: 900px) {
          .modal-container { align-items: stretch; padding: 0; }
          .modal-card { max-width: 100vw; max-height: 100dvh; border-radius: 0; }
          .modal-header-section { padding: 1rem; }
          .header-flex { align-items: flex-start; gap: 1rem; }
          .header-left { align-items: flex-start; gap: 0.85rem; min-width: 0; }
          .item-icon-large { border-radius: 10px; height: 46px; width: 46px; }
          .item-title {
            font-size: clamp(1.2rem, 7vw, 1.75rem);
            line-height: 1.1;
            overflow-wrap: anywhere;
          }
          .badge-row { flex-wrap: wrap; gap: 0.45rem; }
          .modal-close-btn { flex-shrink: 0; padding: 0.55rem; }

          .modal-body { padding: 1rem; }
          .bento-grid { gap: 0.85rem; }
          .bento-card {
            border-radius: 12px;
            flex: 1 1 100%;
            min-height: 0;
            min-width: 0;
            padding: 1rem;
          }
          .card-label { margin-bottom: 0.85rem; }
          .market-card { flex-basis: 100%; }
          .price-main {
            font-size: clamp(1.8rem, 11vw, 2.35rem);
            overflow-wrap: anywhere;
          }
          .market-stats,
          .yield-stats,
          .restoration-row {
            display: grid;
            gap: 0.75rem;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .stats-mini-grid,
          .utility-group-items {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .sell-advisor-grid,
          .sell-advisor-metrics {
            grid-template-columns: 1fr;
          }
          .description-text { font-size: 0.95rem; }
          .source-pill,
          .loot-row,
          .ing-row {
            border-radius: 10px;
            gap: 0.75rem;
            padding: 0.75rem;
          }
          .source-meta,
          .loot-row,
          .ing-row,
          .analysis-row,
          .profit-footer {
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 0.45rem;
          }
          .loot-name,
          .source-name,
          .ing-name-link,
          .up-name {
            overflow-wrap: anywhere;
            white-space: normal;
          }
          .ing-price-sub { margin-left: 0; }
          .modal-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem;
          }
          .item-id {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .market-link { font-size: 0.8rem; }
        }

        @media (max-width: 480px) {
          .market-stats,
          .yield-stats,
          .restoration-row,
          .stats-mini-grid,
          .utility-group-items {
            grid-template-columns: 1fr;
          }
          .type-badge,
          .quality-text,
          .uses-badge,
          .vendor-badge {
            font-size: 9px;
          }
          .profit-footer strong { font-size: 1.15rem; }
        }
      `}</style>
    </div>
  );
}
