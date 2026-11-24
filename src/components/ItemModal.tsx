'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Zap,
  Package,
  BookOpen,
  MapPin,
  Hammer,
  TrendingUp,
  Target,
  Plus,
  Coins,
  Check,
  AlertTriangle,
  Sparkles,
  Sliders,
  Utensils,
  Heart,
  Activity,
  ArrowRight,
  Castle,
  Crown,
  Swords,
  Pickaxe,
  TrendingDown,
  Minus,
} from 'lucide-react';

import { useItemModal } from '@/context/ItemModalContext';
import { GameImage } from '@/components/GameImage';
import { useCrafting } from '@/context/CraftingContext';
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from '@/lib/preferences';
import { isCraftingQueueRecipe } from '@/lib/crafting-queue';
import { getRecipeUses } from '@/lib/game-logic';
import { getItemTrueValue } from '@/lib/ev-logic';
import { useData } from '@/context/DataContext';
import { getMerchantBuyPrice } from '@/constants';
import {
  getAllLoreForItem,
  getCachedLoreDataset,
  getLoreEntry,
  loadLoreData,
  type LoreDataset,
} from '@/data/lore';
import { getSafeMarketValue, getSafeMarketPrice } from '@/lib/market-pricing';
import { useProfiles } from '@/lib/profiles';
import { getProfileBarteringBoost } from '@/lib/profile-calculations';
import {
  getDropSourceLocation,
  getResourceLocationsForItem,
  normalizeLocationKey,
  type DropSourceWithLocation,
} from '@/lib/locations';
import { formatItemTypeLabel, isForcedUntradableItem } from '@/lib/item-display';
import { loadUsageMap } from '@/lib/usage-map';
import { getQualityColor, getQualityTextStyle } from '@/lib/quality';

import { ModalSheet } from '@/components/ui/ModalSheet';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { formatGold } from '@/lib/format';
import styles from './ItemModal.module.css';

interface ItemModalProps {
  id: string;
  onClose: () => void;
}

type AcquisitionSource = DropSourceWithLocation & {
  type?: string;
  name?: string;
  chance?: number | string;
  source_item_name?: string;
};

async function fetchPublicJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function clonePlainItem(item: unknown) {
  if (!item || typeof item !== 'object') return item;
  return JSON.parse(JSON.stringify(item));
}

async function loadPublicItemFallback(id: string) {
  const [allItemsDb, marketData, usageMap] = await Promise.all([
    fetchPublicJson<Record<string, unknown>>('/all-items-db.json'),
    fetchPublicJson<Record<string, unknown>>('/market-data.json'),
    fetchPublicJson<Record<string, unknown>>('/usage-map.json'),
  ]);

  const rawItem = allItemsDb?.[id];
  if (!rawItem) return null;

  const item = clonePlainItem(rawItem) as Record<string, any>;
  const marketItem = item.name ? (marketData?.[item.name] as Record<string, any>) : null;
  if (marketItem) {
    item.market_price = getSafeMarketValue(marketItem) || marketItem.price || 0;
    item.market_data = marketItem;
    Object.assign(item, marketItem);
  }

  const relations = item.name ? (usageMap?.[item.name] as Record<string, any>) : null;
  if (relations) {
    item.used_in = relations.used_in || relations.required_for || [];
    item.required_for = relations.required_for || relations.used_in || [];
    item.produced_from = relations.produced_from || null;
    item.recipe_yield = relations.recipe_yield || null;
    item.dropped_by = relations.dropped_by || [];
    item.source_bosses = relations.source_bosses || [];
    item.source_dungeons = relations.source_dungeons || [];
  }

  return item;
}

const normalizeSourceType = (type?: string) =>
  (type || '').trim().toUpperCase().replace(/\s+/g, '_');

const getSourceRoute = (source: AcquisitionSource) => {
  const type = normalizeSourceType(source.type);
  return type.includes('BOSS') ? 'bosses' : type.includes('DUNGEON') ? 'dungeons' : 'enemies';
};

const formatSourceType = (type?: string) =>
  normalizeSourceType(type).replace(/_/g, ' ') || 'SOURCE';

const TARGET_LABELS: Record<string, string> = {
  hunt: 'Hunt Efficiency',
  dungeon: 'Dungeon Efficiency',
  dungeoneering: 'Dungeoneering Efficiency',
  combat: 'Combat Efficiency',
  battle: 'Battle Efficiency',
  fishing: 'Fishing Efficiency',
  mining: 'Mining Efficiency',
  woodcutting: 'Woodcutting Efficiency',
  smelting: 'Smelting Efficiency',
  cooking: 'Cooking Efficiency',
  alchemy: 'Alchemy Efficiency',
  forge: 'Forge Efficiency',
  'shadow-mastery': 'Shadow Mastery Efficiency',
  'springtide-mastery': 'Springtide Mastery Efficiency',
  'lunar-mastery': 'Lunar Mastery Efficiency',
  'yule-mastery': 'Yule Mastery Efficiency',
  attack_power: 'Attack Power',
  protection: 'Protection',
  strength: 'Strength',
  defence: 'Defence',
  dexterity: 'Dexterity',
  speed: 'Speed',
  primary_skill: 'Primary Skill',
};

function formatEffectTitle(eff: any): string {
  const value = Number(eff.value) || 0;
  const target = String(eff.target || '').toLowerCase();
  const attr = String(eff.attribute || '').toLowerCase();
  const valType = String(eff.value_type || '').toLowerCase();

  if (attr === 'wait_length' || valType === 'efficiency' || attr === 'speed' || target === 'speed') {
    const rawSkill = TARGET_LABELS[target] || `${target.replace(/[-_]/g, ' ')} Efficiency`;
    const skillName = rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1);
    return `+${value}% ${skillName}`;
  }

  if (attr === 'experience' || target.includes('experience')) {
    const cleanSkill = target.replace(/[-_]/g, ' ');
    const formatted = cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1);
    return `+${value}% ${formatted} XP`;
  }

  if (attr === 'magic_find') {
    const cleanTarget = target.replace(/[-_]/g, ' ');
    const formatted = cleanTarget.charAt(0).toUpperCase() + cleanTarget.slice(1);
    return `+${value}% ${formatted} Magic Find`;
  }

  if (attr === 'final_value') {
    const cleanTarget = target.replace(/[-_]/g, ' ');
    const formatted = cleanTarget.charAt(0).toUpperCase() + cleanTarget.slice(1);
    return `+${value}% ${formatted}`;
  }

  const sign = value > 0 ? `+${value}` : String(value);
  const suffix = valType === 'percentage' ? '%' : '';
  const cleanTarget = target.replace(/_/g, ' ').replace(/-/g, ' ');
  const cleanAttr = attr.replace(/_/g, ' ');
  return `${sign}${suffix} ${cleanTarget} ${cleanAttr}`.trim();
}

function formatLoreTitle(rawTitle?: string, entryId?: string): string {
  if (rawTitle && !rawTitle.includes('-')) return rawTitle;
  const source = rawTitle || entryId || '';
  if (!source) return 'Lore Record';
  const clean = source.replace(/^(world|faction|character|era|pantheon|location|beast|item|event)-/, '').replace(/-/g, ' ');
  return clean
    .split(' ')
    .map((w, idx) => {
      const lower = w.toLowerCase();
      if (idx > 0 && ['of', 'the', 'in', 'and', 'for', 'to', 'a', 'an'].includes(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export default function ItemModal({ id, onClose }: ItemModalProps) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, prefetchItem, getCachedItem, setCachedItem } = useItemModal();
  const { queue, addToQueue } = useCrafting();
  const { marketData, allItemsDb } = useData();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageMap, setUsageMap] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'sources'>('overview');
  const [addedToQueue, setAddedToQueue] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(0);

  // URL Deep-Linking and History Management
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUrl = new URL(window.location.href);
    const existingId = currentUrl.searchParams.get('id') || currentUrl.searchParams.get('item');

    if (existingId !== id) {
      currentUrl.searchParams.set('item', id);
      window.history.pushState({ modalItemId: id }, '', currentUrl.toString());
    }

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      const exitUrl = new URL(window.location.href);
      if (exitUrl.searchParams.get('item') === id) {
        exitUrl.searchParams.delete('item');
        window.history.replaceState({}, '', exitUrl.toString());
      }
    };
  }, [id, onClose]);

  // Load Item Data
  useEffect(() => {
    let active = true;

    async function fetchItem() {
      setLoading(true);
      setError(null);
      setSelectedTier(0);

      const cached = getCachedItem(id);
      if (cached) {
        if (active) {
          setItem(cached);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/items/${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setItem(data);
            setCachedItem(id, data);
            setLoading(false);
          }
          return;
        }

        const fallback = await loadPublicItemFallback(id);
        if (fallback && active) {
          setItem(fallback);
          setCachedItem(id, fallback);
          setLoading(false);
          return;
        }

        throw new Error('Item not found');
      } catch (err: any) {
        const fallback = await loadPublicItemFallback(id);
        if (fallback && active) {
          setItem(fallback);
          setCachedItem(id, fallback);
          setLoading(false);
          return;
        }

        if (active) {
          setError(err.message || 'Failed to load item details');
          setLoading(false);
        }
      }
    }

    fetchItem();
    return () => {
      active = false;
    };
  }, [id, getCachedItem, setCachedItem]);

  // Load Usage Map
  useEffect(() => {
    loadUsageMap().then((map) => setUsageMap(map));
  }, []);

  // Bartering and Intrinsic Value Calculations
  const profileBarteringBoost = activeProfile
    ? getProfileBarteringBoost(activeProfile)
    : preferences.barteringBoost;

  const intrinsicValue = useMemo(() => {
    if (!item || !marketData) return 0;
    return getItemTrueValue(item, marketData, allItemsDb || undefined);
  }, [item, marketData, allItemsDb]);

  const GOLD_ICON =
    'https://cdn.idle-mmo.com/cdn-cgi/image/width=20,height=20,format=auto/global/gold_coin.png';

  const qColor = item ? getQualityColor(item.quality) : getQualityColor('STANDARD');
  const itemName = item?.name;
  const itemIsTradeable = item
    ? !isForcedUntradableItem(item.name) && item.is_tradeable !== false
    : false;

  const [loreDataset, setLoreDataset] = useState<LoreDataset | null>(() => getCachedLoreDataset());

  useEffect(() => {
    if (loreDataset) return;
    let active = true;
    loadLoreData().then((dataset) => {
      if (active) setLoreDataset(dataset);
    });
    return () => {
      active = false;
    };
  }, [loreDataset]);

  const loreLinks = useMemo(() => {
    if (!itemName) return [];
    return getAllLoreForItem(itemName, loreDataset);
  }, [itemName, loreDataset]);

  // Market & Sell Advisor Calculations
  const marketPriceInfo = useMemo(() => {
    if (!item) return { safePrice: 0, rawPrice: 0, adjusted: false };
    const safeResult = getSafeMarketPrice(item);
    const safeVal = safeResult.value || item.market_price || item.safe_price || item.price || 0;
    return {
      safePrice: safeVal,
      rawPrice: safeResult.rawValue || item.raw_price || safeVal,
      adjusted: safeResult.adjusted || item.price_adjusted || false,
    };
  }, [item]);

  const saleInsight = useMemo(() => {
    if (!item) return null;
    const vendorBase = Number(item.vendor_price || 0);
    const barteringPercent = Number(profileBarteringBoost || 0);
    const vendorPrice = vendorBase * (1 + barteringPercent / 100);

    const safeMarket = marketPriceInfo.safePrice;
    const marketTaxRate = getMarketTaxRate(preferences.membership);
    const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);
    const netMarket = safeMarket * marketTaxMultiplier;

    const diff = netMarket - vendorPrice;
    const recommendMarket = itemIsTradeable && netMarket > vendorPrice && safeMarket > 0;

    return {
      vendorPrice,
      vendorBase,
      safeMarket,
      netMarket,
      marketTaxRate,
      diff,
      recommendMarket,
      isTradeable: itemIsTradeable,
    };
  }, [item, profileBarteringBoost, preferences.membership, itemIsTradeable, marketPriceInfo.safePrice]);

  // Acquisition Sources
  const acquisitionSources = useMemo<AcquisitionSource[]>(() => {
    if (!item) return [];
    const sources: AcquisitionSource[] = [];
    const seen = new Set<string>();

    const addSource = (source: AcquisitionSource) => {
      const key = `${source.type || 'SOURCE'}:${source.name || ''}:${source.location || ''}:${source.chance || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      sources.push(source);
    };

    if (Array.isArray(item.dropped_by)) {
      item.dropped_by.forEach((src: any) => {
        if (typeof src === 'string') {
          addSource({ name: src, type: 'ENEMY' });
        } else if (src && typeof src === 'object') {
          const loc = getDropSourceLocation(src);
          addSource({
            ...src,
            type: src.type || 'ENEMY',
            location: loc.name || src.location || '',
          });
        }
      });
    }

    if (Array.isArray(item.source_bosses)) {
      item.source_bosses.forEach((src: any) => {
        if (typeof src === 'string') {
          addSource({ name: src, type: 'BOSS' });
        } else if (src && typeof src === 'object') {
          const loc = getDropSourceLocation(src);
          addSource({
            ...src,
            type: src.type || 'BOSS',
            location: loc.name || src.location || '',
          });
        }
      });
    }

    if (Array.isArray(item.source_dungeons)) {
      item.source_dungeons.forEach((src: any) => {
        if (typeof src === 'string') {
          addSource({ name: src, type: 'DUNGEON' });
        } else if (src && typeof src === 'object') {
          const loc = getDropSourceLocation(src);
          addSource({
            ...src,
            type: src.type || 'DUNGEON',
            location: loc.name || src.location || '',
          });
        }
      });
    }

    return sources;
  }, [item]);

  const gatheredLocations = useMemo(() => {
    if (!item?.name) return [];
    return getResourceLocationsForItem(item.name);
  }, [item?.name]);

  // Reverse Recipe Usage ("Used to Craft")
  const reverseRecipes = useMemo(() => {
    if (!itemName) return [];
    const usage = usageMap?.[itemName];
    const reqList = usage?.required_for || usage?.used_in || item?.required_for || item?.used_in || [];
    if (!Array.isArray(reqList)) return [];
    return reqList.map((entry: any) => ({
      name: entry.name || entry.item_name || 'Unknown Recipe',
      type: entry.type || 'FORGE',
      amount: entry.amount || entry.quantity || 1,
    }));
  }, [itemName, usageMap, item]);

  // Direct Recipe and Crafting Calculations
  const recipeData = useMemo(() => {
    if (!item) return null;
    if (item.recipe && Array.isArray(item.recipe.materials) && item.recipe.materials.length > 0) {
      return item.recipe;
    }
    const mats = item.produced_from?.materials || item.produced_from?.mats;
    if (item.produced_from && Array.isArray(mats) && mats.length > 0) {
      return {
        ...item.produced_from,
        materials: mats.map((m: any) => ({
          ...m,
          name: m.name || m.item_name,
          item_name: m.item_name || m.name,
          amount: m.amount || m.quantity || 1,
        })),
      };
    }
    return null;
  }, [item]);

  const recipeEconomics = useMemo(() => {
    if (!item || !recipeData) return null;
    const recipeMats = recipeData.materials || [];

    const getRecipeMatUnitPrice = (m: any) => {
      const merchantBuyPrice = getMerchantBuyPrice(m.name || m.item_name);
      if (merchantBuyPrice > 0) return merchantBuyPrice;
      const injectedPrice = Number(m.price || 0);
      if (injectedPrice > 0) return injectedPrice;
      return 0;
    };

    const totalMatCost = recipeMats.reduce(
      (acc: number, m: any) =>
        acc + getRecipeMatUnitPrice(m) * (m.amount || m.quantity || 1),
      0
    );

    const rawUses = getRecipeUses(item);
    const uses = rawUses === 'Infinite' ? Infinity : Number(rawUses) || 1;
    const recipePrice =
      item.type === 'RECIPE'
        ? marketPriceInfo.safePrice
        : item.produced_from?.recipe_price || 0;
    const resultPrice =
      item.type === 'RECIPE'
        ? item.recipe_yield?.market_price || 0
        : marketPriceInfo.safePrice;

    const recipeCostPerCraft = uses === Infinity ? 0 : recipePrice / uses;
    const investment = totalMatCost + recipeCostPerCraft;

    const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);
    const marketRevenue = resultPrice * marketTaxMultiplier;
    const vendorBase =
      item.type === 'RECIPE'
        ? item.recipe_yield?.vendor_price || 0
        : item.vendor_price || 0;
    const vendorRevenue =
      vendorBase * (1 + (Number(profileBarteringBoost) || 0) / 100);

    const bestRevenue = Math.max(marketRevenue, vendorRevenue);
    const profit = bestRevenue - investment;

    return {
      totalMatCost,
      investment,
      bestRevenue,
      profit,
      isProfitable: profit > 0,
      uses,
    };
  }, [item, recipeData, preferences.membership, profileBarteringBoost, marketPriceInfo.safePrice]);

  const isUpgradeableEquipment = useMemo(() => {
    if (!item) return false;
    const maxTier = Number(item.max_tier) || 0;
    if (maxTier <= 1) return false;

    const nonUpgradeableTypes = new Set([
      'MATERIAL',
      'ORE',
      'BAR',
      'FISH',
      'LOG',
      'FOOD',
      'POTION',
      'CONSUMABLE',
      'RECIPE',
      'CHEST',
      'KEY',
      'SCROLL',
    ]);
    if (nonUpgradeableTypes.has(String(item.type).toUpperCase())) return false;

    return Boolean(
      item.tier_modifiers ||
      (Array.isArray(item.upgrade_requirements) && item.upgrade_requirements.length > 0)
    );
  }, [item]);

  const dungeonSources = useMemo(() => {
    return acquisitionSources.filter((s) => s.type === 'DUNGEON' || s.type === 'DUNGEON_CHEST' || s.type === 'CHEST');
  }, [acquisitionSources]);

  const bossSources = useMemo(() => {
    return acquisitionSources.filter((s) => s.type === 'BOSS');
  }, [acquisitionSources]);

  const enemySources = useMemo(() => {
    return acquisitionSources.filter(
      (s) => s.type === 'ENEMY' || (Boolean(s.type) && !['DUNGEON', 'DUNGEON_CHEST', 'BOSS', 'CHEST'].includes(s.type || ''))
    );
  }, [acquisitionSources]);

  const priceTrendData = useMemo(() => {
    if (!item) return null;
    const currentPrice = marketPriceInfo.safePrice || Number(item.price || 0);
    if (currentPrice <= 0) return null;

    const p30 = Number(item.avg_30) || Number(item.raw_avg_30) || currentPrice;
    const p14 = Number(item.avg_14) || Number(item.raw_avg_14) || p30;
    const p7 = Number(item.avg_7) || Number(item.raw_avg_7) || p14;
    const pSafe = currentPrice;
    const pRaw = Number(item.raw_avg_3 || item.raw_price || pSafe);

    const points = [p30, p14, p7, pSafe];
    const allValues = [...points, ...(item.price_adjusted ? [pRaw] : [])];
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const diff = maxVal - minVal;
    const padding = diff === 0 ? Math.max(1, minVal * 0.1) : diff * 0.15;
    const plotMin = Math.max(0, minVal - padding);
    const plotMax = maxVal + padding;
    const plotRange = Math.max(1, plotMax - plotMin);

    const svgW = 320;
    const svgH = 80;
    const padX = 20;
    const padY = 14;
    const innerW = svgW - padX * 2;
    const innerH = svgH - padY * 2;

    const getCoords = (val: number, index: number) => {
      const x = padX + (index / 3) * innerW;
      const y = padY + innerH - ((val - plotMin) / plotRange) * innerH;
      return { x, y };
    };

    const coords = points.map((val, idx) => getCoords(val, idx));
    const pathD = coords.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
    const areaD = `${pathD} L ${coords[3].x.toFixed(1)} ${(svgH - 2).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(svgH - 2).toFixed(1)} Z`;

    const rawCoord = item.price_adjusted ? getCoords(pRaw, 3) : null;
    const trendPct = p30 > 0 ? ((pSafe - p30) / p30) * 100 : 0;

    return {
      svgW,
      svgH,
      pathD,
      areaD,
      coords,
      rawCoord,
      trendPct,
      p30,
      p14,
      p7,
      pSafe,
      pRaw,
      adjusted: Boolean(item.price_adjusted),
    };
  }, [item, marketPriceInfo.safePrice]);

  const handleAddToQueue = () => {
    if (!item) return;
    const recipeToQueue = item.recipe || item;
    if (isCraftingQueueRecipe(recipeToQueue)) {
      addToQueue(recipeToQueue);
      setAddedToQueue(true);
      setTimeout(() => setAddedToQueue(false), 2000);
    }
  };

  const navTabOptions = [
    { value: 'overview', label: 'Overview' },
    { value: 'market', label: 'Market' },
    { value: 'sources', label: 'Sources' },
  ];

  const mapQualityToBadge = (quality?: string): BadgeVariant => {
    const q = (quality || '').toLowerCase();
    if (['standard', 'refined', 'premium', 'epic', 'legendary', 'mythic', 'unique'].includes(q)) {
      return q as BadgeVariant;
    }
    return 'neutral';
  };

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={item?.name || 'Item Inspection'}
      maxWidth="lg"
    >
      <div className={styles.modalBody}>
        {loading && (
          <div className={styles.stateContainer}>
            <div className={styles.spinner} />
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Loading item details and market telemetry...</p>
          </div>
        )}

        {error && (
          <div className={styles.stateContainer}>
            <p style={{ margin: 0, color: '#f87171' }}>{error}</p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        )}

        {!loading && !error && item && (
          <>
            {/* Item Header */}
            <div className={styles.itemHeader}>
              <div
                className={styles.thumbnailWrapper}
                style={{
                  '--quality-border': qColor,
                  '--quality-glow': `${qColor}40`,
                } as React.CSSProperties}
              >
                <GameImage
                  src={item.image_url || item.image}
                  alt={item.name}
                  width={48}
                  height={48}
                  sizes="48px"
                  loading="eager"
                  fallbackSrc="/favicon.ico"
                />
              </div>

              <div className={styles.itemHeaderDetails}>
                <h2 className={styles.itemName} style={{ color: qColor }}>
                  {item.name}
                </h2>
                <div className={styles.badgesRow}>
                  <Badge variant="neutral" size="sm">
                    {formatItemTypeLabel(item.type)}
                  </Badge>
                  <Badge variant={mapQualityToBadge(item.quality)} size="sm">
                    {item.quality || 'STANDARD'}
                  </Badge>
                  {item.requirements?.combat && (
                    <Badge variant="neutral" size="sm">
                      Level {item.requirements.combat} Combat
                    </Badge>
                  )}
                  {item.requirements?.level && (
                    <Badge variant="neutral" size="sm">
                      Level {item.requirements.level}
                    </Badge>
                  )}
                  {itemIsTradeable ? (
                    <Badge variant="success" size="sm">
                      Tradeable
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Untradable
                    </Badge>
                  )}
                </div>
              </div>

              {recipeData && isCraftingQueueRecipe(item.recipe || item) && (
                <div className={styles.headerActions}>
                  <Button
                    variant={addedToQueue ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleAddToQueue}
                  >
                    {addedToQueue ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Queue Craft
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Segmented View Navigation */}
            <div className={styles.navTabs}>
              <SegmentedControl
                options={navTabOptions}
                value={activeTab}
                onChange={(val) => setActiveTab(val as any)}
                ariaLabel="Item sections"
              />
            </div>

            {/* Tab 1: Overview & Stats */}
            {activeTab === 'overview' && (
              <div className={styles.tabContent}>
                {item.description && (
                  <div className={styles.descriptionBox}>
                    {item.description}
                  </div>
                )}

                {/* 1. Equipment: Combat Attributes & Interactive Tier Simulator */}
                {item.stats && Object.keys(item.stats).length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Shield size={14} color="#38bdf8" /> Combat Attributes
                    </h3>
                    <div className={styles.statsGrid}>
                      {Object.entries(item.stats).map(([stat, val]) => (
                        <div key={stat} className={styles.statCard}>
                          <span className={styles.statLabel}>
                            {stat.replace(/_/g, ' ')}
                          </span>
                          <span className={styles.statValue}>
                            {Number(val) > 0 ? `+${val}` : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Tier Simulator for Equipment with max_tier */}
                {isUpgradeableEquipment && (
                  <div className={styles.tierSimulator}>
                    <div className={styles.tierHeader}>
                      <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                        <Sliders size={14} color="#38bdf8" /> Tier Upgrade
                      </h3>
                      <span className={styles.tierPill}>
                        Tier +{selectedTier} of {item.max_tier}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={Number(item.max_tier)}
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(Number(e.target.value))}
                      className={styles.tierSlider}
                      aria-label="Tier upgrade level slider"
                    />

                    {/* Dynamic Stat Scaling */}
                    <div className={styles.tierStatsComparison}>
                      {item.stats &&
                        Object.entries(item.stats).map(([stat, val]) => {
                          const base = Number(val) || 0;
                          const modifier = Number(item.tier_modifiers?.[stat] || 0);
                          const upgraded = base + selectedTier * modifier;
                          const diff = upgraded - base;

                          return (
                            <div key={stat} className={styles.tierStatItem}>
                              <span className={styles.tierStatLabel}>
                                {stat.replace(/_/g, ' ')}
                              </span>
                              {modifier === 0 || selectedTier === 0 ? (
                                <div className={styles.tierStatNumbers}>
                                  <span className={styles.tierUpgradedVal}>{base}</span>
                                </div>
                              ) : (
                                <div className={styles.tierStatNumbers}>
                                  <span className={styles.tierBaseVal}>{base}</span>
                                  <ArrowRight size={12} color="var(--text-muted)" />
                                  <span className={styles.tierUpgradedVal}>{upgraded}</span>
                                  {diff > 0 && (
                                    <span className={styles.tierDiff}>+{diff}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Materials Needed for Upgrading */}
                    {Array.isArray(item.upgrade_requirements) &&
                      item.upgrade_requirements.length > 0 && (
                        <div className={styles.tierMatsRequired}>
                          <span style={{ fontWeight: 600 }}>Upgrade Cost:</span>
                          {selectedTier === 0 ? (
                            <span>Base tier (no stones required).</span>
                          ) : (
                            item.upgrade_requirements.map((req: any, idx: number) => (
                              <Badge key={idx} variant="neutral" size="sm">
                                {req.quantity * selectedTier}x {req.item_name}
                              </Badge>
                            ))
                          )}
                        </div>
                      )}
                  </div>
                )}

                {/* 2. Consumable Restoration & Active Buffs */}
                {(Number(item.health_restore) > 0 ||
                  Number(item.hunger_restore) > 0 ||
                  (Array.isArray(item.effects) && item.effects.length > 0)) && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Utensils size={14} color="#4ade80" /> Item Effects
                    </h3>
                    <div className={styles.consumableEffects}>
                      {Number(item.health_restore) > 0 && (
                        <div className={styles.effectCard}>
                          <span className={styles.effectTitle} style={{ color: '#f87171' }}>
                            <Heart size={14} style={{ display: 'inline', marginRight: 4 }} />
                            +{item.health_restore} Health
                          </span>
                          <span className={styles.effectMeta}>Instant health recovery</span>
                        </div>
                      )}

                      {Number(item.hunger_restore) > 0 && (
                        <div className={styles.effectCard}>
                          <span className={styles.effectTitle} style={{ color: '#f5b041' }}>
                            <Utensils size={14} style={{ display: 'inline', marginRight: 4 }} />
                            +{item.hunger_restore} Hunger
                          </span>
                          <span className={styles.effectMeta}>Restores hunger</span>
                        </div>
                      )}

                      {Array.isArray(item.effects) &&
                        item.effects.map((eff: any, idx: number) => {
                          const durationMin = eff.length ? Math.round(eff.length / 60000) : null;
                          return (
                            <div key={idx} className={styles.effectCard}>
                              <span className={styles.effectTitle}>
                                {formatEffectTitle(eff)}
                              </span>
                              <span className={styles.effectMeta}>
                                {durationMin ? `${durationMin} min duration` : 'Permanent passive effect'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 3. Chest Drops / Container Loot Table */}
                {Array.isArray(item.chest_drops) && item.chest_drops.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Package size={14} color="#f5b041" /> Container Drops ({item.chest_drops.length})
                    </h3>
                    <div className={styles.lootGrid}>
                      {item.chest_drops.map((drop: any, idx: number) => (
                        <div
                          key={idx}
                          className={styles.lootRow}
                          onClick={() => drop.item_name && openItemByName(drop.item_name)}
                          title={`Click to inspect ${drop.item_name}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={styles.lootName}>{drop.item_name}</span>
                            {drop.quantity > 1 && (
                              <Badge variant="neutral" size="sm">
                                x{drop.quantity}
                              </Badge>
                            )}
                          </div>
                          <span className={styles.lootChance}>
                            {drop.chance !== undefined ? `${drop.chance}%` : 'Unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Recipe Information (if this item is a recipe) */}
                {item.type === 'RECIPE' && item.recipe_yield && (
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Produces</span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 4,
                        cursor: 'pointer',
                      }}
                      onClick={() => openItemByName(item.recipe_yield.item_name)}
                    >
                      <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>
                        {item.recipe_yield.item_name}
                      </strong>
                      <Badge variant="neutral" size="sm">
                        Inspect Product <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Lore Wiki */}
                {loreLinks.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <BookOpen size={14} color="#38bdf8" /> Lore Wiki
                    </h3>
                    <div className={styles.loreGrid}>
                      {loreLinks.map((link, idx) => {
                        const rawLink = link as any;
                        const entryId = rawLink.entryIds?.[0] || rawLink.entryId || rawLink.id;
                        const primaryEntry = entryId ? getLoreEntry(entryId, loreDataset) : null;
                        const rawTitle = primaryEntry?.title || rawLink.entryTitle || rawLink.title || '';
                        const formattedTitle = formatLoreTitle(rawTitle, entryId);
                        const summary =
                          primaryEntry?.summary ||
                          rawLink.summary ||
                          rawLink.reason ||
                          'Connected lore record.';
                        return (
                          <div
                            key={idx}
                            className={styles.loreCard}
                            onClick={() => entryId && router.push(`/lore?entry=${entryId}`)}
                            title={`Read ${formattedTitle} in Lore Wiki`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                              <span className={styles.loreHeader}>{formattedTitle}</span>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-accent)', display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                Read Wiki <ArrowRight size={11} />
                              </span>
                            </div>
                            <span className={styles.loreSnippet}>{String(summary)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Market & Valuation (Complete Engine) */}
            {activeTab === 'market' && (
              <div className={styles.tabContent}>
                {/* 1. Price Trend Chart with 30-Day Moving Trajectory */}
                {priceTrendData ? (
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      <span className={styles.chartTitle}>
                        <Activity size={14} color="#38bdf8" /> 30-Day Price Trend
                      </span>
                      <span
                        className={`${styles.chartTrendBadge} ${
                          priceTrendData.trendPct > 0.5
                            ? styles.chartTrendUp
                            : priceTrendData.trendPct < -0.5
                            ? styles.chartTrendDown
                            : styles.chartTrendNeutral
                        }`}
                      >
                        {priceTrendData.trendPct > 0.5 ? (
                          <TrendingUp size={12} />
                        ) : priceTrendData.trendPct < -0.5 ? (
                          <TrendingDown size={12} />
                        ) : (
                          <Minus size={12} />
                        )}
                        <span>
                          {priceTrendData.trendPct > 0 ? '+' : ''}
                          {priceTrendData.trendPct.toFixed(1)}% (30d)
                        </span>
                      </span>
                    </div>

                    <div className={styles.chartSvgWrapper}>
                      <svg
                        viewBox={`0 0 ${priceTrendData.svgW} ${priceTrendData.svgH}`}
                        style={{ width: '100%', height: '100%', overflow: 'visible' }}
                      >
                        <defs>
                          <linearGradient id="modalPriceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={priceTrendData.areaD} fill="url(#modalPriceGradient)" />
                        <path
                          d={priceTrendData.pathD}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {priceTrendData.rawCoord && (
                          <>
                            <line
                              x1={priceTrendData.coords[2].x}
                              y1={priceTrendData.coords[2].y}
                              x2={priceTrendData.rawCoord.x}
                              y2={priceTrendData.rawCoord.y}
                              stroke="#f87171"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                            />
                            <circle
                              cx={priceTrendData.rawCoord.x}
                              cy={priceTrendData.rawCoord.y}
                              r="4"
                              fill="#f87171"
                              stroke="#0b101b"
                              strokeWidth="2"
                            />
                          </>
                        )}
                        {priceTrendData.coords.map((pt, idx) => (
                          <circle
                            key={idx}
                            cx={pt.x}
                            cy={pt.y}
                            r="4.5"
                            fill={idx === 3 && priceTrendData.adjusted ? '#4ade80' : '#38bdf8'}
                            stroke="#0b101b"
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                    </div>

                    <div className={styles.chartGridPills}>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>30d Avg</span>
                        <span className={styles.chartPillVal}>{formatGold(priceTrendData.p30)}</span>
                      </div>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>14d Avg</span>
                        <span className={styles.chartPillVal}>{formatGold(priceTrendData.p14)}</span>
                      </div>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>7d Avg</span>
                        <span className={styles.chartPillVal}>{formatGold(priceTrendData.p7)}</span>
                      </div>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>Safe Price</span>
                        <span className={styles.chartPillVal} style={{ color: '#38bdf8' }}>
                          {formatGold(priceTrendData.pSafe)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 2. Recent 10 Sales Transaction Range */}
                {(item.latest_sale_min || item.latest_sale_max || item.latest_sale_median) ? (
                  <div className={styles.spreadContainer}>
                    <div className={styles.spreadHeader}>
                      <span className={styles.statLabel}>Recent 10 Sales Range</span>
                      <span className={styles.spreadRatioBadge}>
                        {item.latest_sale_spread_ratio
                          ? `${((item.latest_sale_spread_ratio - 1) * 100).toFixed(1)}% spread`
                          : '10 sales tracked'}
                      </span>
                    </div>
                    <div className={styles.spreadBarTrack}>
                      <div className={styles.spreadBarRange} />
                      <div
                        className={styles.spreadDiamondWrapper}
                        style={{
                          left: `${Math.min(
                            85,
                            Math.max(
                              15,
                              item.latest_sale_max && item.latest_sale_min && item.latest_sale_max !== item.latest_sale_min
                                ? (((item.latest_sale_median || item.latest_sale_min) - item.latest_sale_min) /
                                    (item.latest_sale_max - item.latest_sale_min)) *
                                    100
                                : 50
                            )
                          )}%`,
                        }}
                      >
                        <span className={styles.markerDiamond} />
                      </div>
                    </div>
                    <div className={styles.spreadColumns}>
                      <div className={`${styles.spreadCol} ${styles.spreadColLeft}`}>
                        <span className={styles.spreadColLabel}>Low Sale</span>
                        <span className={styles.spreadColVal}>{formatGold(item.latest_sale_min || 0)}</span>
                      </div>
                      <div className={`${styles.spreadCol} ${styles.spreadColCenter}`}>
                        <span className={styles.spreadColLabel}>Median Sale</span>
                        <span className={styles.spreadColVal} style={{ color: '#38bdf8' }}>
                          {formatGold(item.latest_sale_median || 0)}
                        </span>
                      </div>
                      <div className={`${styles.spreadCol} ${styles.spreadColRight}`}>
                        <span className={styles.spreadColLabel}>High Sale</span>
                        <span className={styles.spreadColVal}>{formatGold(item.latest_sale_max || 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 3. Volume Depth & Trading Velocity Grid */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>30-Day Volume</span>
                    <span className={styles.statValue}>
                      {item.vol_30 ? Number(item.vol_30).toLocaleString() : '—'}
                    </span>
                    <span className={styles.statSubtext}>
                      {item.vol_7 ? `7d Vol: ${Number(item.vol_7).toLocaleString()}` : 'Monthly turnover'}
                    </span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>3-Day Stable Vol</span>
                    <span className={styles.statValue}>
                      {item.stable_vol_3 ? Number(item.stable_vol_3).toLocaleString() : '—'}
                    </span>
                    <span className={styles.statSubtext}>Outliers filtered</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Daily Median</span>
                    <span className={styles.statValue}>
                      {item.daily_sales_median_30 ? `${item.daily_sales_median_30}/day` : '—'}
                    </span>
                    <span className={styles.statSubtext}>Typical daily trades</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Peak Daily Sales</span>
                    <span className={styles.statValue}>
                      {item.daily_sales_max_30 ? `${item.daily_sales_max_30}/day` : '—'}
                    </span>
                    <span className={styles.statSubtext}>Highest 1-day volume</span>
                  </div>
                </div>

                {/* Spike Filter Confirmation */}
                {item.price_adjusted && (
                  <div
                    style={{
                      background: 'rgba(74, 222, 128, 0.08)',
                      border: '1px solid rgba(74, 222, 128, 0.25)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.8125rem',
                      color: '#4ade80',
                    }}
                  >
                    <Check size={16} style={{ flexShrink: 0 }} />
                    <span>
                      Spike protection filtered {item.price_outlier_rows || 'extreme'} outlier listing(s). Raw 3-day average was{' '}
                      {formatGold(item.raw_avg_3 || item.raw_price || 0)}.
                    </span>
                  </div>
                )}

                {/* Liquidity Alert if Bulk Spikes */}
                {item.liquidity_warning && (
                  <div
                    style={{
                      background: 'rgba(245, 176, 65, 0.1)',
                      border: '1px solid rgba(245, 176, 65, 0.3)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.8125rem',
                      color: '#f5b041',
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>{item.liquidity_warning}</span>
                  </div>
                )}

                {/* 3. Sell Advisor Engine */}
                {saleInsight && (
                  <div className={styles.advisorCard}>
                    <div className={styles.advisorHeader}>
                      <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                        <Coins size={14} color="#f5b041" /> Sell Advice
                      </h3>
                      <span
                        className={`${styles.advisorBadge} ${
                          saleInsight.recommendMarket
                            ? styles.advisorMarket
                            : styles.advisorVendor
                        }`}
                      >
                        {saleInsight.recommendMarket ? 'Sell on Market' : 'Sell to Vendor'}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {saleInsight.recommendMarket
                        ? `Selling on the player market nets ${formatGold(saleInsight.netMarket)} after ${Math.round(
                            saleInsight.marketTaxRate * 100
                          )}% market tax (+${formatGold(Math.abs(saleInsight.diff))} more than vendor).`
                        : `Selling to the NPC vendor yields ${formatGold(
                            saleInsight.vendorPrice
                          )} instantly with zero tax and beats market returns.`}
                    </p>

                    <div className={styles.advisorMetrics}>
                      <div>
                        <span className={styles.statLabel}>Net Market</span>
                        <strong style={{ fontSize: '0.95rem' }}>
                          {formatGold(saleInsight.netMarket)}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          After {Math.round(saleInsight.marketTaxRate * 100)}% tax
                        </span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Vendor Payout</span>
                        <strong style={{ fontSize: '0.95rem', color: '#f5b041' }}>
                          {formatGold(saleInsight.vendorPrice)}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Base: {formatGold(saleInsight.vendorBase)}
                        </span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Extra Profit</span>
                        <strong
                          style={{
                            fontSize: '0.95rem',
                            color: saleInsight.diff > 0 ? '#38bdf8' : '#f5b041',
                          }}
                        >
                          {saleInsight.diff > 0 ? '+' : ''}
                          {formatGold(Math.abs(saleInsight.diff))}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Net advantage
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Crafting Profitability (if craftable) */}
                {recipeEconomics && (
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Crafting Profit</span>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      <div>
                        <span className={styles.statSubtext}>Material Cost:</span>
                        <div style={{ fontWeight: 700 }}>{formatGold(recipeEconomics.totalMatCost)}</div>
                      </div>
                      <div>
                        <span className={styles.statSubtext}>Total Craft Investment:</span>
                        <div style={{ fontWeight: 700 }}>{formatGold(recipeEconomics.investment)}</div>
                      </div>
                      <div>
                        <span className={styles.statSubtext}>Net Profit / Craft:</span>
                        <div
                          style={{
                            fontWeight: 700,
                            color: recipeEconomics.isProfitable ? '#4ade80' : '#f87171',
                          }}
                        >
                          {recipeEconomics.profit > 0 ? '+' : ''}
                          {formatGold(recipeEconomics.profit)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Sources & Crafting */}
            {activeTab === 'sources' && (
              <div className={styles.tabContent}>
                {/* 1. Crafting Recipe (Production) */}
                {recipeData && recipeData.materials && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Hammer size={14} color="#38bdf8" /> Crafting Recipe
                    </h3>
                    <div className={styles.sourceList}>
                      {recipeData.materials.map((m: any, idx: number) => {
                        const mName = m.name || m.item_name;
                        const qty = m.amount || m.quantity || 1;
                        return (
                          <div
                            key={idx}
                            className={styles.sourceCard}
                            onClick={() => openItemByName(mName)}
                            title={`Inspect ${mName}`}
                          >
                            <div className={styles.sourceInfo}>
                              <span className={styles.sourceName}>{mName}</span>
                              <span className={styles.sourceMeta}>Required Material</span>
                            </div>
                            <span className={styles.sourceTag}>{qty}x Required</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Gathering Locations */}
                {gatheredLocations.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <MapPin size={14} color="#38bdf8" /> Gathering Locations
                    </h3>
                    <div className={styles.sourceList}>
                      {gatheredLocations.map((loc, idx) => {
                        const targetKey = loc.key || normalizeLocationKey(loc.name);
                        return (
                          <div
                            key={idx}
                            className={styles.sourceCard}
                            onClick={() => {
                              router.push(`/map?location=${encodeURIComponent(targetKey)}`);
                            }}
                            title={`View ${loc.name} on World Map`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                router.push(`/map?location=${encodeURIComponent(targetKey)}`);
                              }
                            }}
                          >
                            <div className={styles.sourceInfo}>
                              <span className={styles.sourceName}>{loc.name}</span>
                              <span className={styles.sourceMeta}>
                                <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                                View on World Map
                              </span>
                            </div>
                            <span className={styles.sourceTag}>Level {loc.level}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Dungeon Drops */}
                {dungeonSources.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Castle size={14} color="#a855f7" /> Dungeon Drops
                    </h3>
                    <div className={styles.sourceList}>
                      {dungeonSources.map((src, idx) => (
                        <div
                          key={idx}
                          className={styles.sourceCard}
                          onClick={() => {
                            router.push(`/dungeons?search=${encodeURIComponent(src.name || '')}`);
                          }}
                          title={`View ${src.name} in Dungeons`}
                        >
                          <div className={styles.sourceInfo}>
                            <span className={styles.sourceName}>{src.name}</span>
                            <span className={styles.sourceMeta}>
                              {src.type === 'DUNGEON_CHEST' || src.type === 'CHEST' ? 'Dungeon Chest Drop' : 'Dungeon Encounter Drop'}
                              {Boolean(src.location) && (
                                <>
                                  {' • '}
                                  <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
                                  {String(src.location)}
                                </>
                              )}
                            </span>
                          </div>
                          <span className={styles.sourceTag}>
                            {src.chance !== undefined ? `${src.chance}% drop` : 'Drop table'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. World Boss Drops */}
                {bossSources.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Crown size={14} color="#f59e0b" /> World Boss Drops
                    </h3>
                    <div className={styles.sourceList}>
                      {bossSources.map((src, idx) => (
                        <div
                          key={idx}
                          className={styles.sourceCard}
                          onClick={() => {
                            router.push(`/bosses?search=${encodeURIComponent(src.name || '')}`);
                          }}
                          title={`View ${src.name} in Bosses`}
                        >
                          <div className={styles.sourceInfo}>
                            <span className={styles.sourceName}>{src.name}</span>
                            <span className={styles.sourceMeta}>
                              World Boss
                              {Boolean(src.location) && (
                                <>
                                  {' • '}
                                  <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
                                  {String(src.location)}
                                </>
                              )}
                            </span>
                          </div>
                          <span className={styles.sourceTag}>
                            {src.chance !== undefined ? `${src.chance}% drop` : 'Drop table'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Monster Drops */}
                {enemySources.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Swords size={14} color="#ef4444" /> Monster Drops
                    </h3>
                    <div className={styles.sourceList}>
                      {enemySources.map((src, idx) => (
                        <div
                          key={idx}
                          className={styles.sourceCard}
                          onClick={() => {
                            router.push(`/enemies?search=${encodeURIComponent(src.name || '')}`);
                          }}
                          title={`View ${src.name} in Enemies`}
                        >
                          <div className={styles.sourceInfo}>
                            <span className={styles.sourceName}>{src.name}</span>
                            <span className={styles.sourceMeta}>
                              {formatSourceType(src.type)}
                              {Boolean(src.location) && (
                                <>
                                  {' • '}
                                  <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
                                  {String(src.location)}
                                </>
                              )}
                            </span>
                          </div>
                          <span className={styles.sourceTag}>
                            {src.chance !== undefined ? `${src.chance}% drop` : 'Drop pool'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Used in Crafting Recipes (Reverse Recipe Usage) */}
                {reverseRecipes.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <Hammer size={14} color="#4ade80" /> Used in Recipes ({reverseRecipes.length})
                    </h3>
                    <div className={styles.sourceList}>
                      {reverseRecipes.map((rec, idx) => (
                        <div
                          key={idx}
                          className={styles.sourceCard}
                          onClick={() => openItemByName(rec.name)}
                          title={`Inspect ${rec.name}`}
                        >
                          <div className={styles.sourceInfo}>
                            <span className={styles.sourceName}>{rec.name}</span>
                          </div>
                          <span className={styles.sourceTag}>{rec.amount}x required</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {gatheredLocations.length === 0 &&
                  acquisitionSources.length === 0 &&
                  !recipeData &&
                  reverseRecipes.length === 0 && (
                    <div className={styles.stateContainer}>
                      <Package size={24} color="var(--text-muted)" />
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        No drop sources or gathering locations recorded for this item.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </ModalSheet>
  );
}
