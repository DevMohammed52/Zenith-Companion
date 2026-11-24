'use client';

import React from 'react';
import { ArrowDown, ArrowDownUp, ArrowUp, AlertTriangle } from 'lucide-react';
import { GameImage } from '@/components/GameImage';
import { getQualityColor, getQualityTextStyle } from '@/lib/quality';
import { ItemCompactBadges } from './ItemBadges';
import {
  formatGold,
  formatLabel,
  getMarketWarningLabel,
  type EnrichedItem,
  type SortKey,
} from '../types';

export interface ItemsTableProps {
  items: EnrichedItem[];
  sortBy: SortKey;
  sortDesc: boolean;
  onSort: (key: SortKey) => void;
  onOpenItem: (id: string) => void;
}

export function ItemsTable({
  items,
  sortBy,
  sortDesc,
  onSort,
  onOpenItem,
}: ItemsTableProps) {
  const renderSortHeader = (key: SortKey, label: string, align: 'left' | 'right' | 'center' = 'right') => {
    const active = sortBy === key;
    return (
      <th
        className={align}
        aria-sort={active ? (sortDesc ? 'descending' : 'ascending') : 'none'}
      >
        <button
          type="button"
          className={`sort-header-button ${active ? 'active' : ''} ${align}`}
          aria-label={`Sort by ${label}${active ? `, currently ${sortDesc ? 'descending' : 'ascending'}` : ''}`}
          onClick={() => onSort(key)}
        >
          <span>{label}</span>
          <span aria-hidden="true" className="sort-indicator">
            {active ? (sortDesc ? <ArrowDown size={13} /> : <ArrowUp size={13} />) : <ArrowDownUp size={13} />}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div
      className="desktop-table-shell"
      role="region"
      aria-label="Item catalog data table"
      tabIndex={0}
    >
      <table className="items-table">
        <colgroup>
          <col style={{ width: '280px', minWidth: '280px' }} />
          <col style={{ width: '100px', minWidth: '90px' }} />
          <col style={{ width: '110px', minWidth: '100px' }} />
          <col style={{ width: '75px', minWidth: '70px' }} />
          <col style={{ width: '110px', minWidth: '100px' }} />
          <col style={{ width: '90px', minWidth: '80px' }} />
          <col style={{ width: '120px', minWidth: '110px' }} />
          <col style={{ width: '80px', minWidth: '75px' }} />
          <col style={{ minWidth: '140px' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="left pinned-item">Item</th>
            {renderSortHeader('type', 'Type', 'left')}
            {renderSortHeader('quality', 'Quality', 'left')}
            {renderSortHeader('requiredLevel', 'Level', 'right')}
            {renderSortHeader('price', 'Market', 'right')}
            {renderSortHeader('vendor', 'Vendor', 'right')}
            {renderSortHeader('volume', 'Stable Vol', 'right')}
            {renderSortHeader('usage', 'Usage', 'right')}
            <th className="left">Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const warningLabel = getMarketWarningLabel(item);

            return (
              <tr
                aria-label={`Open ${item.name} item details`}
                key={item.id}
                onClick={() => onOpenItem(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenItem(item.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td className="item-cell pinned-item">
                  <div className="item-cell-inner">
                    <div
                      className="item-thumb-wrapper"
                      style={{
                        borderColor: getQualityColor(item.quality),
                        boxShadow: `0 0 10px ${getQualityColor(item.quality)}25`,
                      }}
                    >
                      <GameImage
                        src={item.image}
                        alt=""
                        width={36}
                        height={36}
                        sizes="36px"
                        loading="lazy"
                        fallbackSrc="/favicon.ico"
                      />
                    </div>
                    <div className="item-copy">
                      <strong style={{ color: getQualityColor(item.quality) }}>
                        {item.name}
                      </strong>
                      <small>{formatLabel(item.type)}</small>
                    </div>
                  </div>
                </td>
                <td className="left">{formatLabel(item.type)}</td>
                <td className="left">
                  <span className={`quality-tag ${item.quality.toLowerCase()}`} style={getQualityTextStyle(item.quality)}>
                    {item.quality}
                  </span>
                </td>
                <td className="mono right" title={item.requirementsText || undefined}>
                  {item.requiredLevel || '—'}
                </td>
                <td className="mono right gold-cell" title={item.marketConfidence.note}>
                  {formatGold(item.marketPrice)}
                </td>
                <td className="mono right">{formatGold(item.vendorPrice)}</td>
                <td
                  className={`mono right liquidity-volume ${item.liquidity.tone}`}
                  title={
                    item.stableMarketVolume !== item.marketVolume || item.liquidity.hasPriceSwings
                      ? item.liquidity.note
                      : `Raw 3-day volume: ${item.marketVolume.toLocaleString()}`
                  }
                >
                  <span className="volume-number">
                    {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '—'}
                  </span>
                  {warningLabel ? (
                    <span className="volume-warning-icon" title={warningLabel} aria-label={warningLabel}>
                      <AlertTriangle size={11} aria-hidden="true" />
                    </span>
                  ) : null}
                </td>
                <td className="mono right">{item.usageScore ? item.usageScore.toLocaleString() : '—'}</td>
                <td className="signals-cell left">
                  <ItemCompactBadges item={item} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
