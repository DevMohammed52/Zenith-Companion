'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { GameImage } from '@/components/GameImage';
import { GoldIcon } from '@/components/GoldIcon';
import { getQualityColor, getQualityTextColor, getQualityTextStyle } from '@/lib/quality';
import { ItemCompactBadges } from './ItemBadges';
import {
  formatGold,
  formatLabel,
  type EnrichedItem,
} from '../types';
import styles from '../Items.module.css';

export interface ItemsCardGridProps {
  items: EnrichedItem[];
  onOpenItem: (id: string) => void;
}

export function ItemsCardGrid({ items, onOpenItem }: ItemsCardGridProps) {
  return (
    <div className={styles.cardsGrid} role="region" aria-label="Item catalog cards">
      {items.map((item) => {
        const qColor = getQualityColor(item.quality);
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Open ${item.name} details`}
            onClick={() => onOpenItem(item.id)}
            className={styles.itemCardButton}
            style={{ '--quality-color': qColor } as React.CSSProperties}
          >
            <div className={styles.cardMainRow}>
              <div className={styles.cardThumbWrap}>
                <GameImage
                  src={item.image}
                  alt=""
                  width={44}
                  height={44}
                  sizes="44px"
                  loading="lazy"
                  fallbackSrc="/favicon.ico"
                />
              </div>

              <div className={styles.cardIdentityCol}>
                <div className={styles.cardHeaderLine}>
                  <h3 className={styles.cardTitle} style={{ color: getQualityTextColor(item.quality) }}>
                    {item.name}
                  </h3>
                  <Icon name="chevronRight" size={16} className={styles.cardChevron} />
                </div>
                <div className={styles.cardPillsRow}>
                  <span className={styles.cardTypePill}>{formatLabel(item.type)}</span>
                  <span
                    className={styles.qualityTag}
                    style={getQualityTextStyle(item.quality)}
                  >
                    {item.quality}
                  </span>
                  <span className={`${styles.badgePill} ${item.tradeable ? styles.toneGood : ''}`}>
                    {item.tradeable ? 'Tradeable' : 'Untradable'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.cardStatsStrip}>
              <div className={styles.cardStatCell}>
                <span className={styles.cardStatLabel}>Market</span>
                <span className={styles.cardStatVal}>
                  {item.marketPrice > 0 ? (
                    <>
                      <GoldIcon size={11} />
                      <span>{formatGold(item.marketPrice)}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className={styles.cardStatCell}>
                <span className={styles.cardStatLabel}>Vendor</span>
                <span className={styles.cardStatVal}>
                  {item.vendorPrice > 0 ? (
                    <>
                      <GoldIcon size={11} />
                      <span>{formatGold(item.vendorPrice)}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className={styles.cardStatCell}>
                <span className={styles.cardStatLabel}>Req Lvl</span>
                <span className={styles.cardStatVal}>{item.requiredLevel || '—'}</span>
              </div>
              <div className={styles.cardStatCell}>
                <span className={styles.cardStatLabel}>30d Vol</span>
                <span className={styles.cardStatVal}>
                  {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {item.resourceLocations.length > 0 && (
              <div className={styles.cardSourceRow} aria-label={`${item.name} gathered locations`}>
                <Icon name="mapPin" size={12} className={styles.cardSourceIcon} />
                <span>
                  {item.resourceLocations.slice(0, 2).map((loc) => loc.name).join(', ')}
                  {item.resourceLocations.length > 2 ? ` +${item.resourceLocations.length - 2}` : ''}
                </span>
              </div>
            )}

            {item.resourceLocations.length === 0 && item.gatheringActionSource && (
              <div className={styles.cardSourceRow} aria-label={`${item.name} gathered source`}>
                <Icon name="craftTool" size={12} className={styles.cardSourceIcon} />
                <span>
                  {item.gatheringActionSource.skill} Lv.{item.gatheringActionSource.level}
                </span>
              </div>
            )}

            <ItemCompactBadges item={item} />
          </button>
        );
      })}
    </div>
  );
}
