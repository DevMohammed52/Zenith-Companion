'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  COMPACT_BADGE_LIMIT,
  EQUIPMENT_TYPES,
  formatGold,
  getMarketWarningLabel,
  type EnrichedItem,
} from '../types';
import styles from '../Items.module.css';

function toneClassName(tone: string): string {
  if (tone === 'good') return styles.toneGood;
  if (tone === 'warn' || tone === 'warning') return styles.toneWarning;
  return '';
}

export function ItemBadges({ item }: { item: EnrichedItem }) {
  return (
    <div className={styles.badgesWrap}>
      {item.tradeable && (
        <span className={`${styles.badgePill} ${toneClassName(item.liquidity.tone)}`} title={item.liquidity.note}>
          <Icon name="market" size={12} /> <span>{item.liquidity.label}</span>
        </span>
      )}
      {item.tradeable && (
        <span className={`${styles.badgePill} ${toneClassName(item.marketConfidence.tone)}`} title={item.marketConfidence.note}>
          <Icon
            name={
              item.marketConfidence.label === 'Likely market'
                ? 'check'
                : item.marketConfidence.label === 'Vendor safer'
                  ? 'vendor'
                  : 'warning'
            }
            size={12}
          />
          <span>{item.marketConfidence.label}</span>
        </span>
      )}
      {item.liquidity.hasVolumeSwings && (
        <span className={`${styles.badgePill} ${styles.toneWarning}`} title="Sold volume has unusual bulk-sale days. This is a volume warning, not a price-stability label.">
          <Icon name="warning" size={12} /> <span>Volume swings</span>
        </span>
      )}
      {item.liquidity.hasPriceSwings && (
        <span className={`${styles.badgePill} ${styles.toneWarning}`} title={`Recent sold prices range from ${formatGold(item.liquidity.latestSaleMin)} to ${formatGold(item.liquidity.latestSaleMax)}. Check recent trades/listings before bulk buying or crafting.`}>
          <Icon name="warning" size={12} /> <span>Price swings</span>
        </span>
      )}
      {item.merchantBuyPrice > 0 && (
        <span className={`${styles.badgePill} ${styles.toneWarning}`} title={`Merchant purchase price: ${formatGold(item.merchantBuyPrice)}`}>
          <Icon name="vendor" size={12} /> <span>Merchant item</span>
        </span>
      )}
      {!item.tradeable && (
        <span className={styles.badgePill}>
          <Icon name="locked" size={12} /> <span>Untradable</span>
        </span>
      )}
      {item.isLegacy && (
        <span className={styles.badgePill} title="Old or retired item data. It is kept searchable, but sorted below active items by default.">
          <Icon name="items" size={12} /> <span>Legacy</span>
        </span>
      )}
      {item.hasRecipe && (
        <span className={styles.badgePill} title={item.hasDefaultCraft ? 'Learned by default; no recipe item required.' : 'Crafted from a recipe or production source.'}>
          <Icon name="craftTool" size={12} /> <span>{item.hasDefaultCraft ? 'Default craft' : 'Craft'}</span>
        </span>
      )}
      {item.isSecondaryProduction && (
        <span className={styles.badgePill}>
          <Icon name="produced" size={12} /> <span>Produced</span>
        </span>
      )}
      {item.hasFarmableSource && (
        <span className={styles.badgePill} title={item.gatheringActionSource?.note || 'Mapped gathered resource location.'}>
          <Icon name={item.gatheringActionSource ? 'craftTool' : 'mapPin'} size={12} />
          <span>Farmable</span>
        </span>
      )}
      {(EQUIPMENT_TYPES.has(item.type) || item.hasStats) && (
        <span className={styles.badgePill}>
          <Icon name="conquest" size={12} /> <span>Gear</span>
        </span>
      )}
      {item.hasEffects && (
        <span className={styles.badgePill}>
          <Icon name="produced" size={12} /> <span>Effect</span>
        </span>
      )}
      {item.hasLore && (
        <span className={styles.badgePill}>
          <Icon name="lore" size={12} /> <span>Lore</span>
        </span>
      )}
    </div>
  );
}

export function ItemCompactBadges({ item }: { item: EnrichedItem }) {
  const badges: { key: string; label: string; toneClass: string; title?: string }[] = [];
  if (item.tradeable) {
    badges.push({
      key: 'confidence',
      label: item.marketConfidence.label,
      toneClass: toneClassName(item.marketConfidence.tone),
      title: item.marketConfidence.note,
    });
  }
  if (item.merchantBuyPrice > 0) {
    badges.push({
      key: 'vendor',
      label: 'Merchant',
      toneClass: styles.toneWarning,
      title: `Merchant purchase price: ${formatGold(item.merchantBuyPrice)}`,
    });
  }
  if (!item.tradeable) {
    badges.push({ key: 'untradable', label: 'Untradable', toneClass: '' });
  }
  if (item.hasRecipe) {
    badges.push({ key: 'craft', label: item.hasDefaultCraft ? 'Default craft' : 'Craft', toneClass: styles.toneSlate });
  }
  if (item.hasFarmableSource) {
    badges.push({
      key: 'source',
      label: 'Farmable',
      toneClass: styles.toneSlate,
      title: item.gatheringActionSource?.note || 'Mapped gathered resource location.',
    });
  }
  if (item.liquidity.hasPriceSwings || item.liquidity.hasVolumeSwings) {
    badges.push({
      key: 'warning',
      label: getMarketWarningLabel(item),
      toneClass: styles.toneWarning,
      title: item.liquidity.note,
    });
  }
  if (item.hasLore) {
    badges.push({ key: 'lore', label: `Lore${item.loreCount > 1 ? ` ${item.loreCount}` : ''}`, toneClass: '' });
  }
  if (item.isLegacy) {
    badges.push({ key: 'legacy', label: 'Legacy', toneClass: '' });
  }

  const visibleBadges = badges.slice(0, COMPACT_BADGE_LIMIT);
  const hiddenCount = badges.length - visibleBadges.length;

  return (
    <div className={styles.badgesWrap}>
      {visibleBadges.map((badge) => (
        <span key={badge.key} className={`${styles.badgePill} ${badge.toneClass}`} title={badge.title}>
          <span>{badge.label}</span>
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className={styles.badgePill}
          title={badges.slice(COMPACT_BADGE_LIMIT).map((badge) => badge.label).join(', ')}
        >
          <span>+{hiddenCount}</span>
        </span>
      )}
    </div>
  );
}
