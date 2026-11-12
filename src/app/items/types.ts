import type { DropSourceWithLocation, GatheredResourceLocation } from '@/lib/locations';
import type { MarketLiquidityInfo } from '@/lib/market-pricing';
import { formatItemTypeLabel } from '@/lib/item-display';

export interface SearchIndexItem {
  id: string;
  name: string;
  type: string;
  quality: string;
  image: string;
}

export type SortKey = 'volume' | 'price' | 'name' | 'quality' | 'type' | 'vendor' | 'usage' | 'requiredLevel';
export type SignalFilter = 'ALL' | 'MARKET' | 'PRICE_SWINGS' | 'VENDOR' | 'UNTRADABLE' | 'LEGACY' | 'CRAFTABLE' | 'PRODUCED' | 'USED' | 'DROPPED' | 'FARMABLE' | 'EQUIPMENT' | 'EFFECTS' | 'LORE';
export type ViewMode = 'table' | 'cards';
export type FilterOption<T extends string> = { value: T; label: string; qualityTone?: string };

export type UsageEntry = {
  dropped_by?: DropSourceWithLocation[];
  required_for?: unknown[];
  produced_from?: unknown;
  shops?: unknown[];
};

export type GatheringActionSource = {
  skill: string;
  level: number;
  note: string;
};

export type MarketConfidence = {
  label: 'Likely market' | 'Check listings' | 'Vendor safer' | 'Needs recent sales' | 'No market';
  tone: 'good' | 'warn' | 'bad' | 'muted';
  note: string;
};

export type EnrichedItem = SearchIndexItem & {
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

export interface ItemDbStats {
  marketListed: number;
  craftable: number;
  used: number;
  loreLinked: number;
}

export const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: 'requiredLevel', label: 'Required Level' },
  { value: 'quality', label: 'Rarity' },
  { value: 'volume', label: 'Stable Volume' },
  { value: 'price', label: 'Market Price' },
  { value: 'usage', label: 'Usage' },
  { value: 'vendor', label: 'Vendor Value' },
  { value: 'type', label: 'Type' },
  { value: 'name', label: 'Name' },
];

export const SIGNAL_OPTIONS: FilterOption<SignalFilter>[] = [
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

export const EQUIPMENT_TYPES = new Set([
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

export const SECONDARY_PRODUCTION_TYPES = new Set(['METAL_BAR', 'FOOD']);
export const CONSTRUCTION_OUTPUT_PATTERN = /\b(plank|beam|brick|glass|fitting)\b/i;

export const GATHERING_ACTION_ITEMS: Record<string, GatheringActionSource> = {
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

export const ITEM_DB_VIEW_STORAGE_KEY = 'zenith_items_view_mode';
export const DESKTOP_ITEM_BATCH_SIZE = 48;
export const MOBILE_ITEM_BATCH_SIZE = 36;
export const COMPACT_BADGE_LIMIT = 4;

export const formatLabel = formatItemTypeLabel;

export function formatGold(value: number): string {
  if (!value) return '-';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: value < 100 ? 2 : 0 })}g`;
}

export function getNumericRequirementEntries(item: Record<string, any>): readonly (readonly [string, number])[] {
  const requirements = item.requirements;
  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) return [];
  return Object.entries(requirements)
    .map(([name, value]) => [name, Number(value)] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0);
}

export function getRequiredLevel(item: Record<string, any>): number {
  const requirementValues = getNumericRequirementEntries(item).map(([, value]) => value);
  const directValues = [item.required_level, item.requiredLevel, item.item_level, item.level]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return Math.max(0, ...requirementValues, ...directValues);
}

export function formatRequirements(item: Record<string, any>): string {
  const entries = getNumericRequirementEntries(item);
  if (entries.length === 0) return '';
  return entries
    .map(([name, value]) => `${formatLabel(name)} ${value}`)
    .join(' / ');
}

export function isRareManualMarketItem(name: string, type: string, quality: string): boolean {
  const normalizedType = String(type || '').toUpperCase();
  const normalizedQuality = String(quality || '').toUpperCase();
  return normalizedType === 'PET_EGG' || (/ Egg$/i.test(name) && normalizedQuality === 'MYTHIC');
}

export function isRareOrLimitedHistoryItem(type: string, quality: string): boolean {
  const normalizedType = String(type || '').toUpperCase();
  const normalizedQuality = String(quality || '').toUpperCase();
  return normalizedQuality === 'UNIQUE'
    || normalizedQuality === 'MYTHIC'
    || normalizedType === 'RELIC'
    || normalizedType === 'PET_EGG';
}

export function descriptionMarksNonTradeable(description: string): boolean {
  return /cannot sell (?:it )?on the market|not tradable|not tradeable|untradable/i.test(description);
}

export function getMarketConfidence({
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

export function getGatheringActionSource(itemName: string): GatheringActionSource | null {
  return GATHERING_ACTION_ITEMS[itemName.trim().toLowerCase()] || null;
}

export function isDefaultAlchemyCraft(producedFrom: unknown): boolean {
  return Boolean(
    producedFrom
    && typeof producedFrom === 'object'
    && 'source' in producedFrom
    && (producedFrom as { source: unknown }).source === 'DEFAULT_ALCHEMY',
  );
}

export function tokenizeSearchText(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

export function buildItemSearchText(item: {
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
}): string {
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

export function matchesSearchToken(item: EnrichedItem, token: string): boolean {
  if (token.length <= 3) {
    return item.searchWords.some((word) => word.startsWith(token));
  }
  return item.searchWords.some((word) => word.startsWith(token)) || item.name.toLowerCase().includes(token);
}

export function getMarketWarningLabel(item: EnrichedItem): string {
  if (item.liquidity.hasVolumeSwings && item.liquidity.hasPriceSwings) return 'Volume and price swings';
  if (item.liquidity.hasVolumeSwings) return 'Volume swings';
  if (item.liquidity.hasPriceSwings) return 'Price swings';
  return '';
}
