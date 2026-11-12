'use client';

import React from 'react';
import { ArrowDown, ArrowDownUp, ArrowUp } from 'lucide-react';
import { GameImage } from '@/components/GameImage';
import { getQualityTextStyle } from '@/lib/quality';
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
  const renderSortHeader = (key: SortKey, label: string, align: 'left' | 'right' = 'right') => {
    const active = sortBy === key;
    return (
      <th
        className={align === 'left' ? 'left' : undefined}
        aria-sort={active ? (sortDesc ? 'descending' : 'ascending') : 'none'}
      >
        <button
          type="button"
          className={`sort-header-button ${active ? 'active' : ''}`}
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
    <div className="desktop-table-shell">
      <table className="items-table">
        <thead>
          <tr>
            <th className="left">Item</th>
            {renderSortHeader('type', 'Type')}
            {renderSortHeader('quality', 'Quality')}
            {renderSortHeader('requiredLevel', 'Level')}
            {renderSortHeader('price', 'Market')}
            {renderSortHeader('vendor', 'Vendor')}
            {renderSortHeader('volume', 'Stable Vol')}
            {renderSortHeader('usage', 'Usage')}
            <th className="center">Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
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
              <td className="item-cell">
                <div className="item-cell-inner">
                  <GameImage
                    src={item.image}
                    alt=""
                    width={34}
                    height={34}
                    sizes="34px"
                    loading="lazy"
                    fallbackSrc="/favicon.ico"
                  />
                  <div className="item-copy">
                    <strong>{item.name}</strong>
                    <small>{item.description || 'No description available'}</small>
                  </div>
                </div>
              </td>
              <td>{formatLabel(item.type)}</td>
              <td style={getQualityTextStyle(item.quality)}>{item.quality}</td>
              <td className="mono" title={item.requirementsText || undefined}>
                {item.requiredLevel || '-'}
              </td>
              <td className="mono" title={item.marketConfidence.note}>
                {formatGold(item.marketPrice)}
              </td>
              <td className="mono">{formatGold(item.vendorPrice)}</td>
              <td
                className={`mono liquidity-volume ${item.liquidity.tone}`}
                title={
                  item.stableMarketVolume !== item.marketVolume || item.liquidity.hasPriceSwings
                    ? item.liquidity.note
                    : `Raw 3-day volume: ${item.marketVolume.toLocaleString()}`
                }
              >
                {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '-'}
                {getMarketWarningLabel(item) ? (
                  <span className="volume-warning-dot" aria-label={getMarketWarningLabel(item)}>
                    !
                  </span>
                ) : null}
              </td>
              <td className="mono">{item.usageScore ? item.usageScore.toLocaleString() : '-'}</td>
              <td className="signals-cell">
                <ItemCompactBadges item={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
