'use client';

import React from 'react';
import { ChevronRight, Hammer, MapPin } from 'lucide-react';
import { GameImage } from '@/components/GameImage';
import { getQualityColor, getQualityTextStyle } from '@/lib/quality';
import { ItemCompactBadges } from './ItemBadges';
import {
  formatGold,
  formatLabel,
  type EnrichedItem,
} from '../types';

export interface ItemsCardGridProps {
  items: EnrichedItem[];
  onOpenItem: (id: string) => void;
}

export function ItemsCardGrid({ items, onOpenItem }: ItemsCardGridProps) {
  return (
    <div className="cards-grid" role="feed" aria-label="Item catalog cards">
      {items.map((item) => {
        const qColor = getQualityColor(item.quality);
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Open ${item.name} details`}
            onClick={() => onOpenItem(item.id)}
            className="item-mobile-card"
            style={{ '--quality-color': qColor } as React.CSSProperties}
          >
            <div className="card-main-row">
              <div className="card-thumb-wrap">
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

              <div className="card-identity-col">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                  <h3 className="card-title" style={{ color: qColor }}>
                    {item.name}
                  </h3>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
                </div>
                <div className="card-pills-row">
                  <span className="card-type-pill">{formatLabel(item.type)}</span>
                  <span
                    className="card-quality-badge"
                    style={{
                      ...getQualityTextStyle(item.quality),
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.quality}
                  </span>
                  {item.tradeable ? (
                    <span
                      style={{
                        background: 'rgba(74, 222, 128, 0.1)',
                        border: '1px solid rgba(74, 222, 128, 0.3)',
                        borderRadius: '4px',
                        color: '#4ade80',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.35rem',
                      }}
                    >
                      Tradeable
                    </span>
                  ) : (
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.35rem',
                      }}
                    >
                      Untradable
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="card-stats-grid">
              <div className="card-stat-cell">
                <span className="card-stat-label">Market</span>
                <span className="card-stat-val gold">{formatGold(item.marketPrice)}</span>
              </div>
              <div className="card-stat-cell">
                <span className="card-stat-label">Vendor</span>
                <span className="card-stat-val">{formatGold(item.vendorPrice)}</span>
              </div>
              <div className="card-stat-cell">
                <span className="card-stat-label">Req Lvl</span>
                <span className="card-stat-val">{item.requiredLevel || '—'}</span>
              </div>
              <div className="card-stat-cell">
                <span className="card-stat-label">30d Vol</span>
                <span className="card-stat-val">
                  {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {item.resourceLocations.length > 0 && (
              <div className="card-source-row" aria-label={`${item.name} gathered locations`}>
                <MapPin size={12} color="#38bdf8" aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>
                  {item.resourceLocations.slice(0, 2).map((loc) => loc.name).join(', ')}
                  {item.resourceLocations.length > 2 ? ` +${item.resourceLocations.length - 2}` : ''}
                </span>
              </div>
            )}

            {item.resourceLocations.length === 0 && item.gatheringActionSource && (
              <div className="card-source-row" aria-label={`${item.name} gathered source`}>
                <Hammer size={12} color="#4ade80" aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>
                  {item.gatheringActionSource.skill} Lv.{item.gatheringActionSource.level}
                </span>
              </div>
            )}

            <div className="card-tags-row">
              <ItemCompactBadges item={item} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
