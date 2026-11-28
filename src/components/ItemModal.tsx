'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useItemModal } from '@/context/ItemModalContext';
import { GameImage } from '@/components/GameImage';
import { GoldIcon } from '@/components/GoldIcon';
import { useCrafting } from '@/context/CraftingContext';
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from '@/lib/preferences';
import { isCraftingQueueRecipe } from '@/lib/crafting-queue';
import { getRecipeExperienceInfo, getRecipeUses } from '@/lib/game-logic';
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
import QualityText from '@/components/QualityText';
import { formatQualityLabel, getQualityPalette } from '@/lib/quality';
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  Icon,
  ModalSheet,
  Skeleton,
  SkeletonContainer,
  Slider,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
  type BadgeVariant,
} from '@/components/ui';
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

function resolveItemEntry(
  name: string | undefined,
  allItemsDb: Record<string, any> | null | undefined
): any | undefined {
  if (!name || !allItemsDb) return undefined;
  const direct = allItemsDb[name];
  if (direct) return direct;
  const lower = name.toLowerCase();
  return Object.values(allItemsDb).find(
    (cand: any) => typeof cand?.name === 'string' && cand.name.toLowerCase() === lower
  );
}

function resolveItemImage(
  name: string | undefined,
  allItemsDb: Record<string, any> | null | undefined
): string | undefined {
  const matched = resolveItemEntry(name, allItemsDb);
  return matched?.image_url || matched?.image;
}

function formatRecipeSkillLabel(skill?: string): string {
  const clean = String(skill || '').trim();
  if (!clean) return 'Crafting';
  return clean
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const STAT_XP_LABELS: Record<string, string> = {
  strength: 'Strength',
  speed: 'Speed',
  defence: 'Defence',
  dexterity: 'Dexterity',
};

export default function ItemModal({ id, onClose }: ItemModalProps) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, getCachedItem, setCachedItem } = useItemModal();
  const { addToQueue } = useCrafting();
  const { marketData, allItemsDb } = useData();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageMap, setUsageMap] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'sources'>('overview');
  const [addedToQueue, setAddedToQueue] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
    };
  }, []);

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

        // Only download large client-side JSON fallbacks for transient 5xx/offline errors, never for 400/404.
        if (res.status >= 500) {
          const fallback = await loadPublicItemFallback(id);
          if (fallback && active) {
            setItem(fallback);
            setCachedItem(id, fallback);
            setLoading(false);
            return;
          }
        }

        throw new Error('Item not found');
      } catch (err: any) {
        if (err instanceof Error && err.message === 'Item not found') {
          if (active) {
            setError('Item not found');
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

  useMemo(() => {
    if (!item || !marketData) return 0;
    return getItemTrueValue(item, marketData, allItemsDb || undefined);
  }, [item, marketData, allItemsDb]);

  const qualityPalette = getQualityPalette(item?.quality || 'STANDARD');
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
      const mName = m.name || m.item_name;
      const merchantBuyPrice = getMerchantBuyPrice(mName);
      if (merchantBuyPrice > 0) return merchantBuyPrice;
      const injectedPrice = Number(m.price || 0);
      if (injectedPrice > 0) return injectedPrice;
      const marketEntry = mName ? marketData?.[mName] : null;
      const marketVal = marketEntry ? getSafeMarketValue(marketEntry) || Number(marketEntry.price || 0) : 0;
      if (marketVal > 0) return marketVal;
      const fallbackItem = resolveItemEntry(mName, allItemsDb);
      return Number(fallbackItem?.vendor_price || 0);
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
    const yieldName = recipeData.result?.item_name || item.recipe_yield?.item_name;
    const yieldEntry = yieldName ? resolveItemEntry(yieldName, allItemsDb) : null;
    const yieldMarketEntry = yieldName ? marketData?.[yieldName] : null;
    const resultPrice =
      item.type === 'RECIPE'
        ? item.recipe_yield?.market_price ||
          (yieldMarketEntry ? getSafeMarketValue(yieldMarketEntry) || Number(yieldMarketEntry.price || 0) : 0)
        : marketPriceInfo.safePrice;

    const recipeCostPerCraft = uses === Infinity ? 0 : recipePrice / uses;
    const investment = totalMatCost + recipeCostPerCraft;

    const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);
    const marketRevenue = resultPrice * marketTaxMultiplier;
    const vendorBase =
      item.type === 'RECIPE'
        ? item.recipe_yield?.vendor_price || Number(yieldEntry?.vendor_price || 0)
        : item.vendor_price || 0;
    const vendorRevenue =
      vendorBase * (1 + (Number(profileBarteringBoost) || 0) / 100);

    const bestRevenue = Math.max(marketRevenue, vendorRevenue);
    const profit = bestRevenue - investment;
    const xpInfo = getRecipeExperienceInfo(recipeData.experience, recipeData.skill);

    return {
      totalMatCost,
      recipeCostPerCraft,
      investment,
      bestRevenue,
      profit,
      isProfitable: profit > 0,
      uses,
      xpInfo,
      skillLabel: formatRecipeSkillLabel(recipeData.skill),
      levelRequired: Number(recipeData.level_required || recipeData.level || 0),
    };
  }, [allItemsDb, item, marketData, marketPriceInfo.safePrice, preferences.membership, profileBarteringBoost, recipeData]);

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
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
      queueTimerRef.current = setTimeout(() => setAddedToQueue(false), 2000);
    }
  };

  const mapQualityToBadge = (quality?: string): BadgeVariant => {
    const q = (quality || '').toLowerCase();
    if (['standard', 'refined', 'premium', 'epic', 'legendary', 'mythic', 'unique'].includes(q)) {
      return q as BadgeVariant;
    }
    return 'neutral';
  };

  const descriptionSubtitle = item
    ? [
        formatItemTypeLabel(item.type),
        item.requirements?.combat
          ? `Lv. ${item.requirements.combat} Combat`
          : item.requirements?.level
            ? `Lv. ${item.requirements.level}`
            : recipeEconomics?.levelRequired
              ? `Lv. ${recipeEconomics.levelRequired} ${recipeEconomics.skillLabel}`
              : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined;

  const sourcesCount =
    (recipeData?.materials?.length || 0) +
    gatheredLocations.length +
    acquisitionSources.length +
    reverseRecipes.length;

  const stableVol = Number(item?.stable_vol_3 || item?.vol_3 || 0);
  const contextualToolLink = useMemo(() => {
    if (!item) return null;
    const skillLower = String(recipeData?.skill || item.recipe?.skill || '').toLowerCase();
    if (skillLower === 'forge') return { href: '/forge', label: 'Forge Planner' };
    if (skillLower === 'alchemy' || item.type === 'POTION') return { href: '/alchemy', label: 'Alchemy' };
    if (['cooking', 'smelting', 'construction'].includes(skillLower)) {
      return { href: `/skill-profit?q=${encodeURIComponent(item.name)}`, label: 'Skill Profit' };
    }
    if (['ORE', 'LOG', 'FISH', 'METAL_BAR', 'FOOD', 'CONSTRUCTION_MATERIAL'].includes(String(item.type).toUpperCase())) {
      return { href: `/skill-profit?q=${encodeURIComponent(item.name)}`, label: 'Skill Profit' };
    }
    return null;
  }, [item, recipeData]);

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={item ? <QualityText value={item.quality}>{item.name}</QualityText> : 'Item Inspection'}
      description={descriptionSubtitle}
      maxWidth="lg"
    >
      <div className={styles.modalBody}>
        {loading && (
          <SkeletonContainer announcement="Loading item details and market telemetry...">
            <div className={styles.skeletonStack}>
              <div className={styles.skeletonHead}>
                <Skeleton variant="rectangular" width={56} height={56} />
                <div className={styles.skeletonHeadCopy}>
                  <Skeleton variant="text" width="46%" height={18} />
                  <Skeleton variant="text" width="64%" height={14} />
                </div>
              </div>
              <Skeleton variant="rectangular" height={38} />
              <div className={styles.skeletonStrip}>
                <Skeleton variant="rectangular" height={58} />
                <Skeleton variant="rectangular" height={58} />
                <Skeleton variant="rectangular" height={58} />
                <Skeleton variant="rectangular" height={58} />
              </div>
              <Skeleton variant="rectangular" height={110} />
            </div>
          </SkeletonContainer>
        )}

        {error && (
          <EmptyState
            variant="error"
            title="Item unavailable"
            description={error}
            action={{
              label: 'Close Inspector',
              variant: 'secondary',
              onClick: onClose,
            }}
          />
        )}

        {!loading && !error && item && (
          <>
            {/* Compact Identity Hero */}
            <div className={styles.itemHero}>
              <div
                className={styles.thumbnailWrapper}
                style={{
                  '--quality-border': qualityPalette.color,
                  '--quality-bg': qualityPalette.backgroundGradient || qualityPalette.background,
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

              <div className={styles.itemHeroDetails}>
                <div className={styles.badgesRow}>
                  <Badge variant={mapQualityToBadge(item.quality)} size="sm">
                    {formatQualityLabel(item.quality || 'STANDARD')}
                  </Badge>
                  <Badge variant={itemIsTradeable ? 'success' : 'neutral'} size="sm">
                    {itemIsTradeable ? 'Tradeable' : 'Untradable'}
                  </Badge>
                  {recipeEconomics && (
                    <Badge variant="neutral" size="sm">
                      {recipeEconomics.uses === Infinity
                        ? 'Unlimited uses'
                        : `${recipeEconomics.uses} use${recipeEconomics.uses === 1 ? '' : 's'}`}
                    </Badge>
                  )}
                </div>
                {(recipeEconomics && (recipeEconomics.xpInfo.skillExp > 0 || Object.keys(recipeEconomics.xpInfo.stats).length > 0)) && (
                  <div className={styles.recipeXpSummary}>
                    {recipeEconomics.xpInfo.skillExp > 0 && (
                      <span>
                        +{recipeEconomics.xpInfo.skillExp.toLocaleString()} {recipeEconomics.skillLabel} XP
                      </span>
                    )}
                    {Object.entries(recipeEconomics.xpInfo.stats).map(([statKey, statXp]) =>
                      Number(statXp) > 0 ? (
                        <span key={statKey}>
                          +{Number(statXp).toLocaleString()} {STAT_XP_LABELS[statKey] || statKey} XP
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </div>

              <div className={styles.headerActions}>
                {(item.hashed_id || id) && (
                  <a
                    href={`https://web.idle-mmo.com/item/inspect/${encodeURIComponent(String(item.hashed_id || id))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.externalGameLink}
                  >
                    <Icon name="externalLink" size="xs" aria-hidden="true" />
                    <span>{itemIsTradeable ? 'Buy on Market' : 'Inspect in Game'}</span>
                  </a>
                )}
                {contextualToolLink && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      router.push(contextualToolLink.href);
                    }}
                    icon={<Icon name="externalLink" size="xs" aria-hidden="true" />}
                  >
                    {contextualToolLink.label}
                  </Button>
                )}
                {recipeData && isCraftingQueueRecipe(item.recipe || item) && (
                  <Button
                    variant={addedToQueue ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleAddToQueue}
                    icon={<Icon name={addedToQueue ? 'check' : 'plus'} size="sm" aria-hidden="true" />}
                  >
                    {addedToQueue ? 'Added' : 'Queue Craft'}
                  </Button>
                )}
              </div>
            </div>

            {/* 4-Cell Above-Tabs Summary Strip */}
            <div className={styles.statStrip} aria-label="Quick valuation summary">
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Vendor</span>
                <strong className={`${styles.statValue} ${styles.statValueGold}`}>
                  {(saleInsight?.vendorPrice || 0) > 0 && <GoldIcon size={12} />}
                  <span>{saleInsight ? `${formatGold(saleInsight.vendorPrice)}g` : '—'}</span>
                </strong>
                <span className={styles.statSubtext}>
                  {Number(profileBarteringBoost) > 0
                    ? `Bartering +${Number(profileBarteringBoost).toFixed(1)}%`
                    : 'Base NPC value'}
                </span>
              </div>

              <div className={styles.statCell}>
                <span className={styles.statLabel}>Market Net</span>
                <strong className={`${styles.statValue} ${saleInsight?.recommendMarket ? styles.statValueAccent : ''}`}>
                  {itemIsTradeable && (saleInsight?.netMarket || 0) > 0 && <GoldIcon size={12} />}
                  <span>
                    {!itemIsTradeable
                      ? 'Untradable'
                      : (saleInsight?.netMarket || 0) > 0
                        ? `${formatGold(saleInsight!.netMarket)}g`
                        : 'No data'}
                  </span>
                </strong>
                <span className={styles.statSubtext}>
                  {!itemIsTradeable ? (
                    'Account bound'
                  ) : item.price_adjusted ? (
                    <Tooltip content="3-day average ignored due to extreme spike; anchored to median listing history.">
                      <span className={styles.inlineTooltipHint}>Spike-protected</span>
                    </Tooltip>
                  ) : (
                    `After ${Math.round((saleInsight?.marketTaxRate || 0.15) * 100)}% tax`
                  )}
                </span>
              </div>

              <div className={styles.statCell}>
                <span className={styles.statLabel}>
                  {recipeEconomics ? 'Craft Margin' : 'Best Sell'}
                </span>
                {recipeEconomics ? (
                  <>
                    <strong
                      className={`${styles.statValue} ${
                        recipeEconomics.isProfitable ? styles.statValueGood : styles.statValueBad
                      }`}
                    >
                      {Math.abs(recipeEconomics.profit) > 0 && <GoldIcon size={12} />}
                      <span>
                        {recipeEconomics.profit > 0 ? '+' : ''}
                        {formatGold(recipeEconomics.profit)}g
                      </span>
                    </strong>
                    <span className={styles.statSubtext}>
                      Input {formatGold(recipeEconomics.investment)}g
                    </span>
                  </>
                ) : (
                  <>
                    <strong className={styles.statValue}>
                      {saleInsight?.recommendMarket ? 'Market' : 'Vendor'}
                    </strong>
                    <span className={styles.statSubtext}>
                      {saleInsight && saleInsight.safeMarket > 0
                        ? `+${formatGold(Math.abs(saleInsight.diff))}g edge`
                        : 'Direct NPC sell'}
                    </span>
                  </>
                )}
              </div>

              <div className={styles.statCell}>
                <span className={styles.statLabel}>
                  {itemIsTradeable ? '3d Volume' : 'Connections'}
                </span>
                <strong className={styles.statValue}>
                  {itemIsTradeable
                    ? stableVol > 0
                      ? stableVol.toLocaleString()
                      : '—'
                    : `${sourcesCount}`}
                </strong>
                <span className={styles.statSubtext}>
                  {itemIsTradeable
                    ? `${sourcesCount} source${sourcesCount === 1 ? '' : 's'} / uses`
                    : 'Recipes & drops'}
                </span>
              </div>
            </div>

            {/* Primitive Tabs Navigation */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'overview' | 'market' | 'sources')}
              variant="pill"
            >
              <TabList aria-label="Item details sections" className={styles.tabListBar}>
                <Tab value="overview">Overview</Tab>
                <Tab value="market">Market</Tab>
                <Tab value="sources" badge={sourcesCount > 0 ? sourcesCount : undefined}>
                  Sources &amp; Uses
                </Tab>
              </TabList>

              <TabPanel value="overview" className={styles.tabContent}>
                {item.description && (
                  <div className={styles.descriptionBox}>
                    {item.description}
                  </div>
                )}

                {item.stats && Object.keys(item.stats).length > 0 && (
                  <section className={`${styles.sectionBlock} ${!item.description ? styles.sectionBlockFirst : ''}`}>
                    {isUpgradeableEquipment ? (
                      <div className={styles.tierPanel}>
                        <div className={styles.tierHeader}>
                          <h3 className={styles.sectionTitle}>
                            <Icon name="conquest" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                            <span>Stats &amp; Tier Scaling</span>
                          </h3>
                          <Badge variant={selectedTier > 0 ? 'refined' : 'neutral'} size="sm">
                            Tier +{selectedTier} of {item.max_tier}
                          </Badge>
                        </div>

                        <Slider
                          value={selectedTier}
                          onChange={(val) => setSelectedTier(Number(val))}
                          min={0}
                          max={Number(item.max_tier)}
                          step={1}
                          valueFormat={(v) => `+${v}`}
                          aria-label="Tier upgrade level slider"
                        />

                        <div className={styles.attributesGrid}>
                          {Object.entries(item.stats).map(([stat, val]) => {
                            const base = Number(val) || 0;
                            const modifier = Number(item.tier_modifiers?.[stat] || 0);
                            const upgraded = base + selectedTier * modifier;
                            const diff = upgraded - base;

                            return (
                              <div key={stat} className={styles.attributeTile}>
                                <span className={styles.statLabel}>
                                  {stat.replace(/_/g, ' ')}
                                </span>
                                {modifier === 0 || selectedTier === 0 ? (
                                  <div className={styles.tierStatNumbers}>
                                    <span className={styles.tierUpgradedVal}>
                                      {base > 0 ? `+${base}` : base}
                                    </span>
                                  </div>
                                ) : (
                                  <div className={styles.tierStatNumbers}>
                                    <span className={styles.tierBaseVal}>{base}</span>
                                    <Icon name="arrowRight" size="xs" className={styles.sectionIcon} aria-hidden="true" />
                                    <span className={styles.tierUpgradedVal}>{upgraded}</span>
                                    {diff > 0 && <span className={styles.tierDiff}>+{diff}</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {Array.isArray(item.upgrade_requirements) && item.upgrade_requirements.length > 0 && (
                          <div className={styles.tierMatsRequired}>
                            <strong>Upgrade Cost:</strong>
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
                    ) : (
                      <>
                        <h3 className={styles.sectionTitle}>
                          <Icon name="conquest" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                          <span>Combat Attributes</span>
                        </h3>
                        <div className={styles.attributesGrid}>
                          {Object.entries(item.stats).map(([stat, val]) => (
                            <div key={stat} className={styles.attributeTile}>
                              <span className={styles.statLabel}>
                                {stat.replace(/_/g, ' ')}
                              </span>
                              <span className={styles.statValue}>
                                {Number(val) > 0 ? `+${val}` : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                )}

                {(Number(item.health_restore) > 0 ||
                  Number(item.hunger_restore) > 0 ||
                  (Array.isArray(item.effects) && item.effects.length > 0)) && (
                  <section className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="food" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                      <span>Item Effects</span>
                    </h3>
                    <div className={styles.effectsGrid}>
                      {Number(item.health_restore) > 0 && (
                        <div className={styles.effectTile}>
                          <span className={`${styles.effectTitle} ${styles.effectTitleHealth}`}>
                            <Icon name="health" size="sm" aria-hidden="true" />
                            <span>+{item.health_restore} Health</span>
                          </span>
                          <span className={styles.effectMeta}>Instant health recovery</span>
                        </div>
                      )}

                      {Number(item.hunger_restore) > 0 && (
                        <div className={styles.effectTile}>
                          <span className={`${styles.effectTitle} ${styles.effectTitleHunger}`}>
                            <Icon name="food" size="sm" aria-hidden="true" />
                            <span>+{item.hunger_restore} Hunger</span>
                          </span>
                          <span className={styles.effectMeta}>Restores hunger</span>
                        </div>
                      )}

                      {Array.isArray(item.effects) &&
                        item.effects.map((eff: any, idx: number) => {
                          const durationMin = eff.length ? Math.round(eff.length / 60000) : null;
                          return (
                            <div key={idx} className={styles.effectTile}>
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
                  </section>
                )}

                {Array.isArray(item.chest_drops) && item.chest_drops.length > 0 && (
                  <section className={styles.sectionBlock}>
                    <div className={styles.sectionHeaderRow}>
                      <h3 className={styles.sectionTitle}>
                        <Icon name="items" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                        <span>Container Drops</span>
                      </h3>
                      <span className={styles.countMeta}>{item.chest_drops.length}</span>
                    </div>
                    <div className={styles.actionList}>
                      {item.chest_drops.map((drop: any, idx: number) => {
                        const dropEntry = resolveItemEntry(drop.item_name, allItemsDb);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={styles.actionRowBtn}
                            onClick={() => drop.item_name && openItemByName(drop.item_name)}
                          >
                            <span className={styles.rowLeading}>
                              <span className={styles.rowThumb}>
                                <GameImage
                                  src={dropEntry?.image_url || dropEntry?.image}
                                  alt={drop.item_name || 'Drop'}
                                  width={26}
                                  height={26}
                                  fallback={<Icon name="items" size="sm" aria-hidden="true" />}
                                />
                              </span>
                              <span className={styles.rowCopy}>
                                <span className={styles.rowName}>
                                  <QualityText value={dropEntry?.quality || 'STANDARD'}>
                                    {drop.item_name}
                                  </QualityText>
                                </span>
                                {drop.quantity > 1 && (
                                  <span className={styles.rowMeta}>Quantity x{drop.quantity}</span>
                                )}
                              </span>
                            </span>
                            <span className={`${styles.rowTrailingTag} ${styles.rowTrailingGood}`}>
                              {drop.chance !== undefined ? `${drop.chance}%` : 'Unknown'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {item.type === 'RECIPE' && item.recipe_yield && (
                  <section className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="produced" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                      <span>Produces</span>
                    </h3>
                    {(() => {
                      const yieldEntry = resolveItemEntry(item.recipe_yield.item_name, allItemsDb);
                      return (
                        <button
                          type="button"
                          className={styles.actionRowBtn}
                          onClick={() => openItemByName(item.recipe_yield.item_name)}
                        >
                          <span className={styles.rowLeading}>
                            <span className={styles.rowThumb}>
                              <GameImage
                                src={yieldEntry?.image_url || yieldEntry?.image}
                                alt={item.recipe_yield.item_name}
                                width={26}
                                height={26}
                                fallback={<Icon name="items" size="sm" aria-hidden="true" />}
                              />
                            </span>
                            <span className={styles.rowName}>
                              <QualityText value={yieldEntry?.quality || item.quality}>
                                {item.recipe_yield.item_name}
                              </QualityText>
                            </span>
                          </span>
                          <span className={styles.rowTrailingTag}>
                            <span>Inspect Product</span>
                            <Icon name="arrowRight" size="xs" aria-hidden="true" />
                          </span>
                        </button>
                      );
                    })()}
                  </section>
                )}

                {loreLinks.length > 0 && (
                  <section className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="lore" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                      <span>Lore Wiki</span>
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
                          <button
                            key={idx}
                            type="button"
                            className={styles.loreCardBtn}
                            onClick={() => entryId && router.push(`/lore?entry=${entryId}`)}
                          >
                            <div className={styles.loreCardHead}>
                              <span className={styles.loreHeader}>{formattedTitle}</span>
                              <span className={styles.loreActionHint}>
                                <span>Read Wiki</span>
                                <Icon name="arrowRight" size="xs" aria-hidden="true" />
                              </span>
                            </div>
                            <span className={styles.loreSnippet}>{String(summary)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </TabPanel>

              <TabPanel value="market" className={styles.tabContent}>
                {priceTrendData && (
                  <section className={styles.chartPanel} aria-label="30-Day Price Trend">
                    <div className={styles.sectionHeaderRow}>
                      <h3 className={styles.sectionTitle}>
                        <Icon name="skillProfit" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                        <span>30-Day Price Trend</span>
                      </h3>
                      <Badge
                        variant={
                          priceTrendData.trendPct > 0.5
                            ? 'success'
                            : priceTrendData.trendPct < -0.5
                              ? 'danger'
                              : 'neutral'
                        }
                        size="sm"
                        icon={
                          <Icon
                            name={
                              priceTrendData.trendPct > 0.5
                                ? 'skillProfit'
                                : priceTrendData.trendPct < -0.5
                                  ? 'trendDown'
                                  : 'minus'
                            }
                            size="xs"
                          />
                        }
                      >
                        {priceTrendData.trendPct > 0 ? '+' : ''}
                        {priceTrendData.trendPct.toFixed(1)}% (30d)
                      </Badge>
                    </div>

                    <div className={styles.chartSvgWrapper}>
                      <svg
                        viewBox={`0 0 ${priceTrendData.svgW} ${priceTrendData.svgH}`}
                        style={{ width: '100%', height: '100%', overflow: 'visible' }}
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient id="modalPriceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--quality-refined-text)" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="var(--quality-refined-text)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={priceTrendData.areaD} fill="url(#modalPriceGradient)" />
                        <path
                          d={priceTrendData.pathD}
                          fill="none"
                          stroke="var(--quality-refined-text)"
                          strokeWidth="2.2"
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
                              stroke="var(--text-danger)"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                            />
                            <circle
                              cx={priceTrendData.rawCoord.x}
                              cy={priceTrendData.rawCoord.y}
                              r="4"
                              fill="var(--text-danger)"
                              stroke="var(--bg-panel)"
                              strokeWidth="2"
                            />
                          </>
                        )}
                        {priceTrendData.coords.map((pt, idx) => (
                          <circle
                            key={idx}
                            cx={pt.x}
                            cy={pt.y}
                            r="4"
                            fill={idx === 3 && priceTrendData.adjusted ? 'var(--text-success)' : 'var(--quality-refined-text)'}
                            stroke="var(--bg-panel)"
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                    </div>

                    <div className={styles.chartGridPills}>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>30d Avg</span>
                        <span className={styles.chartPillVal}>
                          {priceTrendData.p30 > 0 && <GoldIcon size={11} />}
                          <span>{formatGold(priceTrendData.p30)}</span>
                        </span>
                      </div>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>14d Avg</span>
                        <span className={styles.chartPillVal}>
                          {priceTrendData.p14 > 0 && <GoldIcon size={11} />}
                          <span>{formatGold(priceTrendData.p14)}</span>
                        </span>
                      </div>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>7d Avg</span>
                        <span className={styles.chartPillVal}>
                          {priceTrendData.p7 > 0 && <GoldIcon size={11} />}
                          <span>{formatGold(priceTrendData.p7)}</span>
                        </span>
                      </div>
                      <div className={styles.chartPillItem}>
                        <span className={styles.chartPillLabel}>Safe Price</span>
                        <span className={`${styles.chartPillVal} ${styles.statValueAccent}`}>
                          {priceTrendData.pSafe > 0 && <GoldIcon size={11} />}
                          <span>{formatGold(priceTrendData.pSafe)}</span>
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {(item.latest_sale_min || item.latest_sale_max || item.latest_sale_median) ? (
                  <section className={styles.spreadPanel} aria-label="Recent 10 Sales Range">
                    <div className={styles.sectionHeaderRow}>
                      <h3 className={styles.sectionTitle}>Recent 10 Sales Range</h3>
                      <Badge variant="neutral" size="sm">
                        {item.latest_sale_spread_ratio
                          ? `${((item.latest_sale_spread_ratio - 1) * 100).toFixed(1)}% spread`
                          : '10 sales tracked'}
                      </Badge>
                    </div>

                    <div className={styles.spreadBarTrack} aria-hidden="true">
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
                      <div className={styles.spreadCol}>
                        <span className={styles.spreadColLabel}>Low Sale</span>
                        <span className={styles.spreadColVal}>
                          {(item.latest_sale_min || 0) > 0 && <GoldIcon size={11} />}
                          <span>{formatGold(item.latest_sale_min || 0)}</span>
                        </span>
                      </div>
                      <div className={`${styles.spreadCol} ${styles.spreadColCenter}`}>
                        <span className={styles.spreadColLabel}>Median Sale</span>
                        <span className={`${styles.spreadColVal} ${styles.statValueAccent}`}>
                          {(item.latest_sale_median || 0) > 0 && <GoldIcon size={11} />}
                          <span>{formatGold(item.latest_sale_median || 0)}</span>
                        </span>
                      </div>
                      <div className={`${styles.spreadCol} ${styles.spreadColRight}`}>
                        <span className={styles.spreadColLabel}>High Sale</span>
                        <span className={styles.spreadColVal}>
                          {(item.latest_sale_max || 0) > 0 && <GoldIcon size={11} />}
                          <span>{formatGold(item.latest_sale_max || 0)}</span>
                        </span>
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className={styles.sectionBlock} aria-label="Trading velocity">
                  <div className={styles.statStrip}>
                    <div className={styles.statCell}>
                      <span className={styles.statLabel}>30d Volume</span>
                      <strong className={styles.statValue}>
                        {item.vol_30 ? Number(item.vol_30).toLocaleString() : '—'}
                      </strong>
                      <span className={styles.statSubtext}>
                        {item.vol_7 ? `7d Vol: ${Number(item.vol_7).toLocaleString()}` : 'Monthly turnover'}
                      </span>
                    </div>

                    <div className={styles.statCell}>
                      <span className={styles.statLabel}>3d Stable Vol</span>
                      <strong className={styles.statValue}>
                        {item.stable_vol_3 ? Number(item.stable_vol_3).toLocaleString() : '—'}
                      </strong>
                      <span className={styles.statSubtext}>Outliers filtered</span>
                    </div>

                    <div className={styles.statCell}>
                      <span className={styles.statLabel}>Daily Median</span>
                      <strong className={styles.statValue}>
                        {item.daily_sales_median_30 ? `${Number(item.daily_sales_median_30).toLocaleString()}/day` : '—'}
                      </strong>
                      <span className={styles.statSubtext}>Typical daily trades</span>
                    </div>

                    <div className={styles.statCell}>
                      <span className={styles.statLabel}>Peak Daily</span>
                      <strong className={styles.statValue}>
                        {item.daily_sales_max_30 ? `${Number(item.daily_sales_max_30).toLocaleString()}/day` : '—'}
                      </strong>
                      <span className={styles.statSubtext}>Highest 1-day volume</span>
                    </div>
                  </div>
                </section>

                {item.price_adjusted && (
                  <div className={styles.spikeConfirmedNotice}>
                    <Icon name="check" size="sm" aria-hidden="true" />
                    <span>
                      Spike protection filtered {item.price_outlier_rows || 'extreme'} outlier listing(s). Raw 3-day average was{' '}
                      {formatGold(item.raw_avg_3 || item.raw_price || 0)}.
                    </span>
                  </div>
                )}

                {item.liquidity_warning && (
                  <Banner variant="warning" icon="warning">
                    {item.liquidity_warning}
                  </Banner>
                )}

                {saleInsight && (
                  <section className={styles.sectionBlock} aria-label="Sell Advice">
                    <div className={styles.sectionHeaderRow}>
                      <h3 className={styles.sectionTitle}>
                        <Icon name="gold" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                        <span>Sell Advice</span>
                      </h3>
                      <Badge variant={saleInsight.recommendMarket ? 'refined' : 'warning'} size="sm">
                        {saleInsight.recommendMarket ? 'Sell on Market' : 'Sell to Vendor'}
                      </Badge>
                    </div>

                    <p className={styles.advisorSummary}>
                      {saleInsight.recommendMarket
                        ? `Selling on the player market nets ${formatGold(saleInsight.netMarket)} after ${Math.round(
                            saleInsight.marketTaxRate * 100
                          )}% market tax (+${formatGold(Math.abs(saleInsight.diff))} more than vendor).`
                        : `Selling to the NPC vendor yields ${formatGold(
                            saleInsight.vendorPrice
                          )} instantly with zero tax and beats market returns.`}
                    </p>

                    <div className={`${styles.statStrip} ${styles.statStripThree}`}>
                      <div className={styles.statCell}>
                        <span className={styles.statLabel}>Net Market</span>
                        <strong className={styles.statValue}>
                          {saleInsight.netMarket > 0 && <GoldIcon size={12} />}
                          <span>{formatGold(saleInsight.netMarket)}</span>
                        </strong>
                        <span className={styles.statSubtext}>
                          After {Math.round(saleInsight.marketTaxRate * 100)}% tax
                        </span>
                      </div>

                      <div className={styles.statCell}>
                        <span className={styles.statLabel}>Vendor Payout</span>
                        <strong className={`${styles.statValue} ${styles.statValueGold}`}>
                          {saleInsight.vendorPrice > 0 && <GoldIcon size={12} />}
                          <span>{formatGold(saleInsight.vendorPrice)}</span>
                        </strong>
                        <span className={styles.statSubtext}>
                          Base: {formatGold(saleInsight.vendorBase)}
                        </span>
                      </div>

                      <div className={styles.statCell}>
                        <span className={styles.statLabel}>Extra Profit</span>
                        <strong
                          className={`${styles.statValue} ${
                            saleInsight.diff > 0 ? styles.statValueAccent : styles.statValueGold
                          }`}
                        >
                          {Math.abs(saleInsight.diff) > 0 && <GoldIcon size={12} />}
                          <span>
                            {saleInsight.diff > 0 ? '+' : ''}
                            {formatGold(Math.abs(saleInsight.diff))}
                          </span>
                        </strong>
                        <span className={styles.statSubtext}>Net advantage</span>
                      </div>
                    </div>
                  </section>
                )}

                {recipeEconomics && (
                  <section className={styles.sectionBlock} aria-label="Crafting Profit">
                    <div className={styles.sectionHeaderRow}>
                      <h3 className={styles.sectionTitle}>Crafting Profit</h3>
                      <span className={styles.countMeta}>
                        {recipeEconomics.skillLabel} Lv. {recipeEconomics.levelRequired || 1}
                      </span>
                    </div>
                    <div className={`${styles.statStrip} ${styles.statStripThree}`}>
                      <div className={styles.statCell}>
                        <span className={styles.statLabel}>Material Cost</span>
                        <strong className={styles.statValue}>
                          {recipeEconomics.totalMatCost > 0 && <GoldIcon size={12} />}
                          <span>{formatGold(recipeEconomics.totalMatCost)}</span>
                        </strong>
                      </div>
                      <div className={styles.statCell}>
                        <span className={styles.statLabel}>Total Investment</span>
                        <strong className={styles.statValue}>
                          {recipeEconomics.investment > 0 && <GoldIcon size={12} />}
                          <span>{formatGold(recipeEconomics.investment)}</span>
                        </strong>
                      </div>
                      <div className={styles.statCell}>
                        <span className={styles.statLabel}>Net Profit / Craft</span>
                        <strong
                          className={`${styles.statValue} ${
                            recipeEconomics.isProfitable ? styles.statValueGood : styles.statValueBad
                          }`}
                        >
                          {Math.abs(recipeEconomics.profit) > 0 && <GoldIcon size={12} />}
                          <span>
                            {recipeEconomics.profit > 0 ? '+' : ''}
                            {formatGold(recipeEconomics.profit)}
                          </span>
                        </strong>
                      </div>
                    </div>
                  </section>
                )}
              </TabPanel>

              <TabPanel value="sources" className={styles.tabContent}>
                {recipeData && recipeData.materials && (
                  <section className={`${styles.sectionBlock} ${styles.sectionBlockFirst}`}>
                    <div className={styles.sectionHeaderRow}>
                      <h3 className={styles.sectionTitle}>
                        <Icon name="craftTool" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                        <span>Crafting Recipe</span>
                      </h3>
                      <span className={styles.countMeta}>
                        {formatRecipeSkillLabel(recipeData.skill)} Lv. {recipeData.level_required || recipeData.level || 1}
                      </span>
                    </div>
                    <div className={styles.actionList}>
                      {recipeData.materials.map((m: any, idx: number) => {
                        const mName = m.name || m.item_name;
                        const qty = m.amount || m.quantity || 1;
                        const matEntry = resolveItemEntry(mName, allItemsDb);
                        const matMarket = mName ? marketData?.[mName] : null;
                        const unitCost =
                          getMerchantBuyPrice(mName) ||
                          Number(m.price || 0) ||
                          (matMarket ? getSafeMarketValue(matMarket) || Number(matMarket.price || 0) : 0);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={styles.actionRowBtn}
                            onClick={() => openItemByName(mName)}
                          >
                            <span className={styles.rowLeading}>
                              <span className={styles.rowThumb}>
                                <GameImage
                                  src={matEntry?.image_url || matEntry?.image}
                                  alt={mName}
                                  width={26}
                                  height={26}
                                  fallback={<Icon name="items" size="sm" aria-hidden="true" />}
                                />
                              </span>
                              <span className={styles.rowCopy}>
                                <span className={styles.rowName}>
                                  <QualityText value={matEntry?.quality || 'STANDARD'}>
                                    {mName}
                                  </QualityText>
                                </span>
                                <span className={styles.rowMeta}>
                                  {unitCost > 0 ? `${formatGold(unitCost)}g ea` : 'Required Material'}
                                </span>
                              </span>
                            </span>
                            <span className={styles.rowTrailingTag}>{qty}x Required</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {gatheredLocations.length > 0 && (
                  <section className={`${styles.sectionBlock} ${!recipeData ? styles.sectionBlockFirst : ''}`}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="mapPin" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                      <span>Gathering Locations</span>
                    </h3>
                    <div className={styles.actionList}>
                      {gatheredLocations.map((loc, idx) => {
                        const targetKey = loc.key || normalizeLocationKey(loc.name);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={styles.actionRowBtn}
                            onClick={() => router.push(`/map?location=${encodeURIComponent(targetKey)}`)}
                          >
                            <span className={styles.rowCopy}>
                              <span className={styles.rowName}>{loc.name}</span>
                              <span className={styles.rowMeta}>
                                <Icon name="mapPin" size="xs" aria-hidden="true" />
                                <span>View on World Map</span>
                              </span>
                            </span>
                            <span className={styles.rowTrailingTag}>Lv. {loc.level}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {dungeonSources.length > 0 && (
                  <section className={`${styles.sectionBlock} ${!recipeData && gatheredLocations.length === 0 ? styles.sectionBlockFirst : ''}`}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="dungeon" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                      <span>Dungeon Drops</span>
                    </h3>
                    <div className={styles.actionList}>
                      {dungeonSources.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={styles.actionRowBtn}
                          onClick={() => router.push(`/dungeons?search=${encodeURIComponent(src.name || '')}`)}
                        >
                          <span className={styles.rowCopy}>
                            <span className={styles.rowName}>{src.name}</span>
                            <span className={styles.rowMeta}>
                              <span>
                                {src.type === 'DUNGEON_CHEST' || src.type === 'CHEST' ? 'Dungeon Chest Drop' : 'Dungeon Encounter Drop'}
                              </span>
                              {Boolean(src.location) && (
                                <>
                                  <span>·</span>
                                  <Icon name="mapPin" size="xs" aria-hidden="true" />
                                  <span>{String(src.location)}</span>
                                </>
                              )}
                            </span>
                          </span>
                          <span className={styles.rowTrailingTag}>
                            {src.chance !== undefined ? `${src.chance}% drop` : 'Drop table'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {bossSources.length > 0 && (
                  <section className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="crown" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                      <span>World Boss Drops</span>
                    </h3>
                    <div className={styles.actionList}>
                      {bossSources.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={styles.actionRowBtn}
                          onClick={() => router.push(`/bosses?search=${encodeURIComponent(src.name || '')}`)}
                        >
                          <span className={styles.rowCopy}>
                            <span className={styles.rowName}>{src.name}</span>
                            <span className={styles.rowMeta}>
                              <span>World Boss</span>
                              {Boolean(src.location) && (
                                <>
                                  <span>·</span>
                                  <Icon name="mapPin" size="xs" aria-hidden="true" />
                                  <span>{String(src.location)}</span>
                                </>
                              )}
                            </span>
                          </span>
                          <span className={styles.rowTrailingTag}>
                            {src.chance !== undefined ? `${src.chance}% drop` : 'Drop table'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {enemySources.length > 0 && (
                  <section className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="combat" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                      <span>Monster Drops</span>
                    </h3>
                    <div className={styles.actionList}>
                      {enemySources.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={styles.actionRowBtn}
                          onClick={() => router.push(`/enemies?search=${encodeURIComponent(src.name || '')}`)}
                        >
                          <span className={styles.rowCopy}>
                            <span className={styles.rowName}>{src.name}</span>
                            <span className={styles.rowMeta}>
                              <span>{formatSourceType(src.type)}</span>
                              {Boolean(src.location) && (
                                <>
                                  <span>·</span>
                                  <Icon name="mapPin" size="xs" aria-hidden="true" />
                                  <span>{String(src.location)}</span>
                                </>
                              )}
                            </span>
                          </span>
                          <span className={styles.rowTrailingTag}>
                            {src.chance !== undefined ? `${src.chance}% drop` : 'Drop pool'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {reverseRecipes.length > 0 && (
                  <section
                    className={`${styles.sectionBlock} ${
                      !recipeData && gatheredLocations.length === 0 && acquisitionSources.length === 0
                        ? styles.sectionBlockFirst
                        : ''
                    }`}
                  >
                    <div className={styles.sectionHeaderRow}>
                      <h3 className={styles.sectionTitle}>
                        <Icon name="craftTool" size="sm" className={styles.sectionIcon} aria-hidden="true" />
                        <span>Used in Recipes</span>
                      </h3>
                      <span className={styles.countMeta}>{reverseRecipes.length}</span>
                    </div>
                    <div className={styles.actionGrid}>
                      {reverseRecipes.map((rec, idx) => {
                        const recEntry = resolveItemEntry(rec.name, allItemsDb);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={styles.actionRowBtn}
                            onClick={() => openItemByName(rec.name)}
                          >
                            <span className={styles.rowLeading}>
                              <span className={styles.rowThumb}>
                                <GameImage
                                  src={recEntry?.image_url || recEntry?.image}
                                  alt={rec.name}
                                  width={26}
                                  height={26}
                                  fallback={<Icon name="items" size="sm" aria-hidden="true" />}
                                />
                              </span>
                              <span className={styles.rowCopy}>
                                <span className={styles.rowName}>
                                  <QualityText value={recEntry?.quality || 'STANDARD'}>
                                    {rec.name}
                                  </QualityText>
                                </span>
                                <span className={styles.rowMeta}>
                                  {formatRecipeSkillLabel(rec.type)}
                                </span>
                              </span>
                            </span>
                            <span className={styles.rowTrailingTag}>{rec.amount}x</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {gatheredLocations.length === 0 &&
                  acquisitionSources.length === 0 &&
                  !recipeData &&
                  reverseRecipes.length === 0 && (
                    <EmptyState
                      variant="no-data"
                      title="No recorded sources"
                      description="No drop tables, gathering locations, or recipes are listed for this item."
                    />
                  )}
              </TabPanel>
            </Tabs>
          </>
        )}
      </div>
    </ModalSheet>
  );
}
