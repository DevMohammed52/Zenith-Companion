'use client';

import React from 'react';
import { ChevronRight, Hammer, MapPin } from 'lucide-react';
import { GameImage } from '@/components/GameImage';
import { getQualityColor, getQualityTextStyle } from '@/lib/quality';
import { ItemBadges } from './ItemBadges';
import {
  formatGold,
  formatLabel,
  getMarketWarningLabel,
  type EnrichedItem,
} from '../types';

export interface ItemsCardGridProps {
  items: EnrichedItem[];
  onOpenItem: (id: string) => void;
}

export function ItemsCardGrid({ items, onOpenItem }: ItemsCardGridProps) {
  return (
    <div className="item-grid forced">
      {items.map((item) => (
        <button
          aria-label={`Open ${item.name} item details`}
          key={item.id}
          type="button"
          onClick={() => onOpenItem(item.id)}
          className="item-card"
        >
          <div
            className="quality-strip"
            style={{ '--quality-color': getQualityColor(item.quality) } as React.CSSProperties}
          />
          <GameImage
            src={item.image}
            alt=""
            width={44}
            height={44}
            sizes="44px"
            loading="lazy"
            fallbackSrc="/favicon.ico"
          />
          <div className="item-card-body">
            <div className="card-topline">
              <span className="card-item-name">{item.name}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </div>
            <div className="card-meta">
              <span>{formatLabel(item.type)}</span>
              <span style={getQualityTextStyle(item.quality)}>{item.quality}</span>
            </div>
            <div className="card-stats">
              <span>
                <small>Market</small>
                <strong title={item.marketConfidence.note}>{formatGold(item.marketPrice)}</strong>
              </span>
              <span>
                <small>Level</small>
                <strong title={item.requirementsText || undefined}>{item.requiredLevel || '-'}</strong>
              </span>
              <span>
                <small>Stable Vol</small>
                <strong className={`liquidity-volume ${item.liquidity.tone}`}>
                  {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '-'}
                  {getMarketWarningLabel(item) ? (
                    <span className="volume-warning-dot" aria-label={getMarketWarningLabel(item)}>
                      !
                    </span>
                  ) : null}
                </strong>
              </span>
              <span>
                <small>Usage</small>
                <strong>{item.usageScore || '-'}</strong>
              </span>
            </div>
            {item.resourceLocations.length > 0 && (
              <div className="source-preview" aria-label={`${item.name} gathered locations`}>
                <MapPin size={13} aria-hidden="true" />
                <span>
                  {item.resourceLocations.slice(0, 2).map((location) => location.name).join(', ')}
                  {item.resourceLocations.length > 2 ? ` +${item.resourceLocations.length - 2}` : ''}
                </span>
              </div>
            )}
            {item.resourceLocations.length === 0 && item.gatheringActionSource && (
              <div className="source-preview" aria-label={`${item.name} gathered source`}>
                <Hammer size={13} aria-hidden="true" />
                <span>
                  {item.gatheringActionSource.skill} Lv.{item.gatheringActionSource.level}
                </span>
              </div>
            )}
            <ItemBadges item={item} />
          </div>
        </button>
      ))}
    </div>
  );
}
