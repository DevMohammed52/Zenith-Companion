import { describe, expect, it } from 'vitest';
import {
  buildItemSearchText,
  descriptionMarksNonTradeable,
  EQUIPMENT_TYPES,
  formatGold,
  formatLabel,
  formatRequirements,
  getGatheringActionSource,
  getMarketConfidence,
  getMarketWarningLabel,
  getNumericRequirementEntries,
  getRequiredLevel,
  isDefaultAlchemyCraft,
  isRareManualMarketItem,
  isRareOrLimitedHistoryItem,
  matchesSearchToken,
  tokenizeSearchText,
  type EnrichedItem,
  type MarketConfidence,
  type SignalFilter,
  type SortKey,
} from '@/app/items/types';
import { getMarketLiquidity, type MarketLiquidityInfo } from '@/lib/market-pricing';
import { getQualityRank } from '@/lib/quality';

function createMockEnrichedItem(overrides: Partial<EnrichedItem> = {}): EnrichedItem {
  const baseLiquidity: MarketLiquidityInfo = getMarketLiquidity({
    price: 500,
    vol_3: 150,
    daily_sales_median_30: 50,
    is_tradeable: true,
  });

  const baseConfidence: MarketConfidence = {
    label: 'Likely market',
    tone: 'good',
    note: 'Clear market exit path',
  };

  const item: EnrichedItem = {
    id: 'item-iron-sword',
    name: 'Iron Sword',
    type: 'SWORD',
    quality: 'STANDARD',
    image: '/images/items/iron-sword.png',
    description: 'A sharp iron blade forged for soldiers.',
    marketPrice: 500,
    marketVolume: 150,
    stableMarketVolume: 150,
    liquidity: baseLiquidity,
    marketConfidence: baseConfidence,
    requiredLevel: 10,
    requirementsText: 'Attack 10',
    vendorPrice: 50,
    merchantBuyPrice: 0,
    tradeable: true,
    hasMarket: true,
    isLegacy: false,
    hasRecipe: true,
    hasDefaultCraft: false,
    isSecondaryProduction: false,
    hasStats: true,
    hasEffects: false,
    hasLore: true,
    loreCount: 2,
    dropLocations: ['Iron Mine', 'Goblin Camp'],
    dropLocationKeys: ['iron_mine', 'goblin_camp'],
    resourceLocations: [],
    gatheringActionSource: null,
    hasFarmableSource: false,
    droppedByCount: 2,
    usedInCount: 1,
    usageScore: 4,
    searchText: '',
    searchWords: [],
    ...overrides,
  };

  item.searchText = buildItemSearchText(item);
  item.searchWords = tokenizeSearchText(item.searchText);
  return item;
}

describe('adversarial-items-ui: item search, filtering, and calculation invariants', () => {
  describe('Dimension 1: Search Tokenization and Matching Invariance', () => {
    it('handles adversarial search inputs: empty, punctuation, special symbols, whitespace', () => {
      expect(tokenizeSearchText('')).toEqual([]);
      expect(tokenizeSearchText('    ')).toEqual([]);
      expect(tokenizeSearchText('!@#$%^&*()_+~`{}|[]\\:";\'<>?,./')).toEqual([]);
      expect(tokenizeSearchText('Iron   Sword   +5')).toEqual(['iron', 'sword', '5']);
      expect(tokenizeSearchText('Potion-of-Invisibility_v2.0')).toEqual(['potion', 'of', 'invisibility', 'v2', '0']);
    });

    it('matches short prefix tokens (<= 3 chars) on search words', () => {
      const item = createMockEnrichedItem({ name: 'Iron Sword' });
      expect(matchesSearchToken(item, 'iro')).toBe(true);
      expect(matchesSearchToken(item, 'swo')).toBe(true);
      expect(matchesSearchToken(item, 'ron')).toBe(false);
      expect(matchesSearchToken(item, 'ord')).toBe(false);
    });

    it('matches longer tokens (> 3 chars) via word prefix or substring inclusion', () => {
      const item = createMockEnrichedItem({ name: 'Mystic Elixir of Dragon Breath' });
      expect(matchesSearchToken(item, 'mystic')).toBe(true);
      expect(matchesSearchToken(item, 'elixir')).toBe(true);
      expect(matchesSearchToken(item, 'dragon')).toBe(true);
      expect(matchesSearchToken(item, 'breath')).toBe(true);
      expect(matchesSearchToken(item, 'ragon')).toBe(true);
      expect(matchesSearchToken(item, 'nonexistent')).toBe(false);
    });

    it('buildItemSearchText comprehensively indexes all facets', () => {
      const item = createMockEnrichedItem({
        name: 'Gilded Shield',
        type: 'SHIELD',
        quality: 'LEGENDARY',
        description: 'Forged in gold.',
        requirementsText: 'Defense 45',
        hasFarmableSource: true,
        hasRecipe: true,
        hasDefaultCraft: true,
        isSecondaryProduction: true,
        hasMarket: true,
        hasStats: true,
        hasEffects: true,
        hasLore: true,
      });

      const text = buildItemSearchText(item);
      expect(text).toContain('gilded shield');
      expect(text).toContain('shield');
      expect(text).toContain('legendary');
      expect(text).toContain('defense 45');
      expect(text).toContain('farmable');
      expect(text).toContain('craftable');
      expect(text).toContain('default alchemy craft');
      expect(text).toContain('secondary production');
      expect(text).toContain('stats');
      expect(text).toContain('effects');
      expect(text).toContain('lore');
    });
  });

  describe('Dimension 2: Market Confidence & Liquidity Invariants', () => {
    const dummyLiquidity: MarketLiquidityInfo = getMarketLiquidity({
      price: 100,
      vol_3: 150,
      daily_sales_median_30: 50,
      is_tradeable: true,
    });

    it('untradable items always return "No market" with muted tone', () => {
      const confidence = getMarketConfidence({
        name: 'Quest Amulet',
        type: 'AMULET',
        quality: 'UNIQUE',
        marketPrice: 999999,
        vendorValue: 500,
        liquidity: dummyLiquidity,
        tradeable: false,
      });
      expect(confidence.label).toBe('No market');
      expect(confidence.tone).toBe('muted');
    });

    it('zero market price returns "Check listings" for rare/mythic items or eggs', () => {
      const petEggConf = getMarketConfidence({
        name: 'Dragon Pet Egg',
        type: 'PET_EGG',
        quality: 'STANDARD',
        marketPrice: 0,
        vendorValue: 10,
        liquidity: { ...dummyLiquidity, stableVolume3d: 0, label: 'No sales' },
        tradeable: true,
      });
      expect(petEggConf.label).toBe('Check listings');
      expect(petEggConf.tone).toBe('warn');

      const mythicConf = getMarketConfidence({
        name: 'Crown of Valaron',
        type: 'HELMET',
        quality: 'MYTHIC',
        marketPrice: 0,
        vendorValue: 100,
        liquidity: { ...dummyLiquidity, stableVolume3d: 0, label: 'No sales' },
        tradeable: true,
      });
      expect(mythicConf.label).toBe('Check listings');
      expect(mythicConf.tone).toBe('warn');
    });

    it('zero market price returns "Vendor safer" when vendorValue > 0 for standard items', () => {
      const conf = getMarketConfidence({
        name: 'Old Boot',
        type: 'BOOTS',
        quality: 'STANDARD',
        marketPrice: 0,
        vendorValue: 15,
        liquidity: { ...dummyLiquidity, stableVolume3d: 0, label: 'No sales' },
        tradeable: true,
      });
      expect(conf.label).toBe('Vendor safer');
      expect(conf.tone).toBe('warn');
    });

    it('items with no recent sales return "Needs recent sales" with bad tone', () => {
      const conf = getMarketConfidence({
        name: 'Obscure Ring',
        type: 'RING',
        quality: 'REFINED',
        marketPrice: 1000,
        vendorValue: 10,
        liquidity: { ...dummyLiquidity, stableVolume3d: 0, label: 'No sales' },
        tradeable: true,
      });
      expect(conf.label).toBe('Needs recent sales');
      expect(conf.tone).toBe('bad');
    });

    it('vendor safer when vendorValue >= 85% of market price on thin/unstable markets', () => {
      const conf = getMarketConfidence({
        name: 'Silver Ingot',
        type: 'METAL_BAR',
        quality: 'STANDARD',
        marketPrice: 100,
        vendorValue: 90,
        liquidity: { ...dummyLiquidity, tone: 'thin', stableVolume3d: 5 },
        tradeable: true,
      });
      expect(conf.label).toBe('Vendor safer');
      expect(conf.tone).toBe('warn');
    });

    it('healthy steady or active markets return "Likely market"', () => {
      const conf = getMarketConfidence({
        name: 'Healing Potion',
        type: 'POTION',
        quality: 'STANDARD',
        marketPrice: 50,
        vendorValue: 10,
        liquidity: { ...dummyLiquidity, tone: 'active', stableVolume3d: 500 },
        tradeable: true,
      });
      expect(conf.label).toBe('Likely market');
      expect(conf.tone).toBe('good');
    });
  });

  describe('Dimension 3: Market Warning Labels & Currency Formatting', () => {
    it('generates accurate volume and price swing warning labels', () => {
      const baseLiq = getMarketLiquidity({ price: 100, vol_3: 150 });
      const bothSwings = createMockEnrichedItem({
        liquidity: {
          ...baseLiq,
          hasVolumeSwings: true,
          hasPriceSwings: true,
        },
      });
      expect(getMarketWarningLabel(bothSwings)).toBe('Volume and price swings');

      const volumeOnly = createMockEnrichedItem({
        liquidity: {
          ...baseLiq,
          hasVolumeSwings: true,
          hasPriceSwings: false,
        },
      });
      expect(getMarketWarningLabel(volumeOnly)).toBe('Volume swings');

      const priceOnly = createMockEnrichedItem({
        liquidity: {
          ...baseLiq,
          hasVolumeSwings: false,
          hasPriceSwings: true,
        },
      });
      expect(getMarketWarningLabel(priceOnly)).toBe('Price swings');

      const noSwings = createMockEnrichedItem();
      expect(getMarketWarningLabel(noSwings)).toBe('');
    });

    it('formats gold values with decimal precision below 100 and comma grouping', () => {
      expect(formatGold(0)).toBe('-');
      expect(formatGold(12.5)).toBe('12.5g');
      expect(formatGold(99.95)).toBe('99.95g');
      expect(formatGold(100)).toBe('100g');
      expect(formatGold(2540)).toBe('2,540g');
      expect(formatGold(1000000)).toBe('1,000,000g');
    });
  });

  describe('Dimension 4: Item Requirements & Parsing Invariance', () => {
    it('extracts numeric requirement entries correctly', () => {
      expect(getNumericRequirementEntries({})).toEqual([]);
      expect(getNumericRequirementEntries({ requirements: null })).toEqual([]);
      expect(getNumericRequirementEntries({ requirements: ['invalid'] })).toEqual([]);
      expect(getNumericRequirementEntries({ requirements: { attack: 25, defense: 40, strength: 0 } })).toEqual([
        ['attack', 25],
        ['defense', 40],
      ]);
    });

    it('calculates highest required level across multiple fields', () => {
      expect(getRequiredLevel({})).toBe(0);
      expect(getRequiredLevel({ required_level: 15 })).toBe(15);
      expect(getRequiredLevel({ requiredLevel: 25, item_level: 20 })).toBe(25);
      expect(getRequiredLevel({ requirements: { woodcutting: 42 }, level: 30 })).toBe(42);
    });

    it('formats readable requirement labels', () => {
      expect(formatRequirements({})).toBe('');
      expect(formatRequirements({ requirements: { attack: 20 } })).toBe('Attack 20');
      expect(formatRequirements({ requirements: { attack: 20, defense: 30 } })).toBe('Attack 20 / Defense 30');
    });

    it('identifies description non-tradeable markers accurately', () => {
      expect(descriptionMarksNonTradeable('This item is bound to account. Cannot sell on the market.')).toBe(true);
      expect(descriptionMarksNonTradeable('Not tradeable by players.')).toBe(true);
      expect(descriptionMarksNonTradeable('Untradable artifact.')).toBe(true);
      expect(descriptionMarksNonTradeable('Standard tradeable ore.')).toBe(false);
    });

    it('identifies rare manual market items and gathering action sources', () => {
      expect(isRareManualMarketItem('Pet Egg', 'PET_EGG', 'STANDARD')).toBe(true);
      expect(isRareManualMarketItem('Ancient Dragon Egg', 'MISC', 'MYTHIC')).toBe(true);
      expect(isRareManualMarketItem('Iron Sword', 'SWORD', 'STANDARD')).toBe(false);

      expect(isRareOrLimitedHistoryItem('RELIC', 'STANDARD')).toBe(true);
      expect(isRareOrLimitedHistoryItem('SWORD', 'UNIQUE')).toBe(true);
      expect(isRareOrLimitedHistoryItem('SWORD', 'MYTHIC')).toBe(true);
      expect(isRareOrLimitedHistoryItem('SWORD', 'STANDARD')).toBe(false);

      expect(getGatheringActionSource('clay')?.skill).toBe('Construction');
      expect(getGatheringActionSource('sand')?.skill).toBe('Construction');
      expect(getGatheringActionSource('iron ore')).toBeNull();

      expect(isDefaultAlchemyCraft({ source: 'DEFAULT_ALCHEMY' })).toBe(true);
      expect(isDefaultAlchemyCraft({ source: 'OTHER' })).toBe(false);
      expect(isDefaultAlchemyCraft(null)).toBe(false);
    });
  });

  describe('Dimension 5: Multi-Column Sorting and Tie-Breaking Invariants', () => {
    function compareItems(
      a: EnrichedItem,
      b: EnrichedItem,
      sortBy: SortKey,
      sortDesc: boolean,
      selectedSignal: SignalFilter = 'ALL',
    ): number {
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
    }

    it('sinks legacy items to the bottom unless selectedSignal is LEGACY', () => {
      const activeItem = createMockEnrichedItem({ name: 'Active Sword', isLegacy: false, marketPrice: 100 });
      const legacyItem = createMockEnrichedItem({ name: 'Legacy Sword', isLegacy: true, marketPrice: 9999 });

      const list1 = [legacyItem, activeItem].sort((a, b) => compareItems(a, b, 'price', true, 'ALL'));
      expect(list1[0].name).toBe('Active Sword');
      expect(list1[1].name).toBe('Legacy Sword');

      const list2 = [legacyItem, activeItem].sort((a, b) => compareItems(a, b, 'price', true, 'LEGACY'));
      expect(list2[0].name).toBe('Legacy Sword');
      expect(list2[1].name).toBe('Active Sword');
    });

    it('breaks requiredLevel ties with rarity and then alphabetical name', () => {
      const itemLowRarity = createMockEnrichedItem({ name: 'A-Iron Sword', requiredLevel: 50, quality: 'STANDARD' });
      const itemHighRarity = createMockEnrichedItem({ name: 'B-Dragon Sword', requiredLevel: 50, quality: 'LEGENDARY' });
      const itemSameRarityAlpha = createMockEnrichedItem({ name: 'C-Mithril Sword', requiredLevel: 50, quality: 'STANDARD' });

      const sorted = [itemLowRarity, itemSameRarityAlpha, itemHighRarity]
        .sort((a, b) => compareItems(a, b, 'requiredLevel', true));

      expect(sorted[0].name).toBe('B-Dragon Sword');
      expect(sorted[1].name).toBe('A-Iron Sword');
      expect(sorted[2].name).toBe('C-Mithril Sword');
    });

    it('breaks quality ties with level and alphabetical name', () => {
      const highLevel = createMockEnrichedItem({ name: 'High Bow', quality: 'EPIC', requiredLevel: 80 });
      const lowLevel = createMockEnrichedItem({ name: 'Low Bow', quality: 'EPIC', requiredLevel: 20 });
      const sameLevelAlpha = createMockEnrichedItem({ name: 'Alpha Bow', quality: 'EPIC', requiredLevel: 20 });

      const sortedDesc = [lowLevel, highLevel, sameLevelAlpha]
        .sort((a, b) => compareItems(a, b, 'quality', true));

      expect(sortedDesc[0].name).toBe('High Bow');
      expect(sortedDesc[1].name).toBe('Alpha Bow');
      expect(sortedDesc[2].name).toBe('Low Bow');
    });

    it('sorts numeric fields stably across volume, price, vendor, and usage', () => {
      const item1 = createMockEnrichedItem({ name: 'Item 1', stableMarketVolume: 10, marketPrice: 100, vendorPrice: 5, usageScore: 2 });
      const item2 = createMockEnrichedItem({ name: 'Item 2', stableMarketVolume: 500, marketPrice: 20, vendorPrice: 50, usageScore: 10 });

      const byVol = [item1, item2].sort((a, b) => compareItems(a, b, 'volume', true));
      expect(byVol[0].name).toBe('Item 2');

      const byPrice = [item1, item2].sort((a, b) => compareItems(a, b, 'price', false));
      expect(byPrice[0].name).toBe('Item 2');

      const byVendor = [item1, item2].sort((a, b) => compareItems(a, b, 'vendor', true));
      expect(byVendor[0].name).toBe('Item 2');

      const byUsage = [item1, item2].sort((a, b) => compareItems(a, b, 'usage', true));
      expect(byUsage[0].name).toBe('Item 2');
    });
  });

  describe('Dimension 6: Advanced Signal Tag and Market Visibility Invariants', () => {
    function matchesItemFilters(
      item: EnrichedItem,
      {
        searchTerm = '',
        selectedType = 'ALL',
        selectedQuality = 'ALL',
        selectedSignal = 'ALL' as SignalFilter,
        selectedLocation = 'ALL',
        hideNonMarket = false,
      }: {
        searchTerm?: string;
        selectedType?: string;
        selectedQuality?: string;
        selectedSignal?: SignalFilter;
        selectedLocation?: string;
        hideNonMarket?: boolean;
      },
    ): boolean {
      const q = searchTerm.trim().toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);

      const matchSearch = tokens.length === 0 || tokens.every((token) => matchesSearchToken(item, token));
      const matchType = selectedType === 'ALL' || item.type === selectedType;
      const matchQuality = selectedQuality === 'ALL' || item.quality === selectedQuality;
      const matchLocation = selectedLocation === 'ALL' || item.dropLocationKeys.includes(selectedLocation);
      const matchMarketVisibility =
        !hideNonMarket
        || item.hasMarket
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

      return matchSearch && matchType && matchQuality && matchLocation && matchMarketVisibility && matchSignal;
    }

    it('filters accurately across all 13 signal tag types', () => {
      const base = createMockEnrichedItem({
        hasMarket: false,
        merchantBuyPrice: 0,
        tradeable: true,
        isLegacy: false,
        hasRecipe: false,
        isSecondaryProduction: false,
        usedInCount: 0,
        droppedByCount: 0,
        hasFarmableSource: false,
        hasStats: false,
        hasEffects: false,
        hasLore: false,
        type: 'MISC',
      });

      expect(matchesItemFilters(createMockEnrichedItem({ ...base, hasMarket: true }), { selectedSignal: 'MARKET' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, liquidity: { ...base.liquidity, hasPriceSwings: true } }), { selectedSignal: 'PRICE_SWINGS' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, merchantBuyPrice: 50 }), { selectedSignal: 'VENDOR' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, tradeable: false }), { selectedSignal: 'UNTRADABLE' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, isLegacy: true }), { selectedSignal: 'LEGACY' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, hasRecipe: true }), { selectedSignal: 'CRAFTABLE' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, isSecondaryProduction: true }), { selectedSignal: 'PRODUCED' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, usedInCount: 3 }), { selectedSignal: 'USED' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, droppedByCount: 2 }), { selectedSignal: 'DROPPED' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, hasFarmableSource: true }), { selectedSignal: 'FARMABLE' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, type: 'SWORD' }), { selectedSignal: 'EQUIPMENT' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, hasEffects: true }), { selectedSignal: 'EFFECTS' })).toBe(true);
      expect(matchesItemFilters(createMockEnrichedItem({ ...base, hasLore: true }), { selectedSignal: 'LORE' })).toBe(true);
    });

    it('hideNonMarket preserves items when specific tags are selected', () => {
      const nonMarketItem = createMockEnrichedItem({ hasMarket: false, merchantBuyPrice: 20 });
      expect(matchesItemFilters(nonMarketItem, { hideNonMarket: true, selectedSignal: 'ALL' })).toBe(false);
      expect(matchesItemFilters(nonMarketItem, { hideNonMarket: true, selectedSignal: 'VENDOR' })).toBe(true);

      const untradableItem = createMockEnrichedItem({ hasMarket: false, tradeable: false });
      expect(matchesItemFilters(untradableItem, { hideNonMarket: true, selectedSignal: 'UNTRADABLE' })).toBe(true);

      const legacyItem = createMockEnrichedItem({ hasMarket: false, isLegacy: true });
      expect(matchesItemFilters(legacyItem, { hideNonMarket: true, selectedSignal: 'LEGACY' })).toBe(true);
    });
  });

  describe('Dimension 7: Adversarial URL Query String and Deep-Link Robustness', () => {
    it('safely handles malformed percent encodings without throwing URIError', () => {
      const safeGetParam = (search: string, key: string): string | null => {
        try {
          const params = new URLSearchParams(search);
          return params.get(key);
        } catch {
          return null;
        }
      };

      expect(safeGetParam('?name=%E0%A4%A&id=12', 'name')).toBeDefined();
      expect(safeGetParam('?q=%99&id=12', 'q')).toBeDefined();
      expect(safeGetParam('?id=test-item-42', 'id')).toBe('test-item-42');
      expect(safeGetParam('', 'name')).toBeNull();
    });

    it('correctly matches item names case-insensitively for catalog deep-linking', () => {
      const catalog = [
        { id: '1', name: 'Iron Sword', type: 'SWORD', quality: 'STANDARD', image: '' },
        { id: '2', name: 'Potion of Wisdom', type: 'POTION', quality: 'SUPERIOR', image: '' },
      ];

      const findInCatalog = (name: string) => {
        return catalog.find((i) => i.name.toLowerCase() === name.trim().toLowerCase());
      };

      expect(findInCatalog('iron sword')?.id).toBe('1');
      expect(findInCatalog('IRON SWORD')?.id).toBe('1');
      expect(findInCatalog('  potion of wisdom  ')?.id).toBe('2');
      expect(findInCatalog('Nonexistent Item')).toBeUndefined();
    });

    it('safely trims whitespace from id and name query parameters', () => {
      const cleanParam = (val: string | null) => (val ? val.trim() : null);

      expect(cleanParam('  item-iron-sword  ')).toBe('item-iron-sword');
      expect(cleanParam('   ')).toBe('');
      expect(cleanParam(null)).toBeNull();
    });

    it('gives id parameter precedence over name parameter when resolving initial search', () => {
      const resolveInitialSearch = (idParam: string | null, nameParam: string | null) => {
        return (!idParam ? (nameParam || '') : '').trim();
      };

      expect(resolveInitialSearch('item-iron-sword', 'Iron Sword')).toBe('');
      expect(resolveInitialSearch(null, '  Iron Sword  ')).toBe('Iron Sword');
      expect(resolveInitialSearch('', 'Iron Sword')).toBe('Iron Sword');
      expect(resolveInitialSearch(null, null)).toBe('');
    });
  });

  describe('Dimension 8: ItemFilterPicker & Interaction State Bounds', () => {
    function computeCircularIndex(current: number, direction: number, length: number): number {
      if (length <= 0) return 0;
      return ((current + direction) % length + length) % length;
    }

    it('calculates circular keyboard navigation index without negative modulo errors', () => {
      expect(computeCircularIndex(0, 1, 5)).toBe(1);
      expect(computeCircularIndex(4, 1, 5)).toBe(0);
      expect(computeCircularIndex(0, -1, 5)).toBe(4);
      expect(computeCircularIndex(4, -1, 5)).toBe(3);
      expect(computeCircularIndex(-1, -1, 5)).toBe(3);
      expect(computeCircularIndex(-10, -1, 5)).toBe(4);
      expect(computeCircularIndex(0, 0, 0)).toBe(0);
    });

    it('opens keyboard navigation at selectedIndex for ArrowDown and last index for ArrowUp', () => {
      const getInitialOpenIndex = (key: 'ArrowDown' | 'ArrowUp', selectedIndex: number, length: number) => {
        if (length === 0) return 0;
        return key === 'ArrowDown' ? selectedIndex : length - 1;
      };

      expect(getInitialOpenIndex('ArrowDown', 2, 8)).toBe(2);
      expect(getInitialOpenIndex('ArrowUp', 2, 8)).toBe(7);
      expect(getInitialOpenIndex('ArrowDown', 0, 1)).toBe(0);
      expect(getInitialOpenIndex('ArrowUp', 0, 1)).toBe(0);
    });

    it('clamps activeIndex when options array shrinks dynamically', () => {
      const clampActiveIndex = (activeIndex: number, selectedIndex: number, newLength: number) => {
        if (newLength === 0) return 0;
        if (activeIndex >= newLength || activeIndex < 0) {
          return Math.min(selectedIndex, newLength - 1);
        }
        return activeIndex;
      };

      expect(clampActiveIndex(7, 2, 4)).toBe(2);
      expect(clampActiveIndex(7, 5, 4)).toBe(3);
      expect(clampActiveIndex(2, 2, 4)).toBe(2);
      expect(clampActiveIndex(-1, 1, 4)).toBe(1);
    });

    it('guards trigger click and list keyboard navigation when options array is empty', () => {
      let isOpen = false;
      const handleTriggerClick = (optionsLength: number) => {
        if (optionsLength === 0) return;
        isOpen = !isOpen;
      };

      handleTriggerClick(0);
      expect(isOpen).toBe(false);

      handleTriggerClick(5);
      expect(isOpen).toBe(true);

      let closedWithFocus = false;
      const handleListKeyDown = (key: string, optionsLength: number) => {
        if (optionsLength === 0) {
          if (key === 'Escape' || key === 'Tab') {
            closedWithFocus = key === 'Escape';
          }
          return;
        }
      };

      handleListKeyDown('ArrowDown', 0);
      expect(closedWithFocus).toBe(false);

      handleListKeyDown('Escape', 0);
      expect(closedWithFocus).toBe(true);
    });

    it('normalizes corrupted or non-array network payloads defensively', () => {
      const sanitizeIndexData = (payload: unknown): unknown[] => {
        return Array.isArray(payload) ? payload : [];
      };

      const sanitizeUsageData = (payload: unknown): Record<string, unknown> => {
        return payload && typeof payload === 'object' && !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};
      };

      expect(sanitizeIndexData(null)).toEqual([]);
      expect(sanitizeIndexData({ error: 'not found' })).toEqual([]);
      expect(sanitizeIndexData(['valid'])).toEqual(['valid']);

      expect(sanitizeUsageData(null)).toEqual({});
      expect(sanitizeUsageData([])).toEqual({});
      expect(sanitizeUsageData('string')).toEqual({});
      expect(sanitizeUsageData({ item1: {} })).toEqual({ item1: {} });
    });
  });
});
