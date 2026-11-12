'use client';

import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  Check,
  Hammer,
  LockKeyhole,
  MapPin,
  Package,
  Shield,
  ShoppingCart,
  Store,
} from 'lucide-react';
import {
  COMPACT_BADGE_LIMIT,
  EQUIPMENT_TYPES,
  formatGold,
  getMarketWarningLabel,
  type EnrichedItem,
} from '../types';

export function ItemBadges({ item }: { item: EnrichedItem }) {
  return (
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
      {item.merchantBuyPrice > 0 && (
        <span className="badge vendor" title={`Merchant purchase price: ${formatGold(item.merchantBuyPrice)}`}>
          <Store size={12} aria-hidden="true" /> <span>Merchant item</span>
        </span>
      )}
      {!item.tradeable && (
        <span className="badge untradable">
          <LockKeyhole size={12} aria-hidden="true" /> <span>Untradable</span>
        </span>
      )}
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
      {item.isSecondaryProduction && (
        <span className="badge produced">
          <Boxes size={12} aria-hidden="true" /> <span>Produced</span>
        </span>
      )}
      {item.hasFarmableSource && (
        <span className="badge source" title={item.gatheringActionSource?.note || 'Mapped gathered resource location.'}>
          {item.gatheringActionSource ? <Hammer size={12} aria-hidden="true" /> : <MapPin size={12} aria-hidden="true" />}
          <span>Farmable</span>
        </span>
      )}
      {(EQUIPMENT_TYPES.has(item.type) || item.hasStats) && (
        <span className="badge gear">
          <Shield size={12} aria-hidden="true" /> <span>Gear</span>
        </span>
      )}
      {item.hasEffects && (
        <span className="badge effect">
          <Boxes size={12} aria-hidden="true" /> <span>Effect</span>
        </span>
      )}
      {item.hasLore && (
        <span className="badge lore">
          <BookOpen size={12} aria-hidden="true" /> <span>Lore</span>
        </span>
      )}
    </div>
  );
}

export function ItemCompactBadges({ item }: { item: EnrichedItem }) {
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
}
