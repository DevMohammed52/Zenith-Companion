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
  getMarketWarningLabel,
  type EnrichedItem,
  type SortKey,
} from '../types';
import styles from '../Items.module.css';

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
    const colClass = align === 'left' ? styles.colLeft : align === 'center' ? styles.colCenter : styles.colRight;
    const alignClass = align === 'left' ? styles.sortLeft : align === 'center' ? styles.sortCenter : styles.sortRight;
    return (
      <th
        className={colClass}
        aria-sort={active ? (sortDesc ? 'descending' : 'ascending') : 'none'}
      >
        <button
          type="button"
          className={`${styles.sortHeaderButton} ${active ? styles.sortActive : ''} ${alignClass}`}
          aria-label={`Sort by ${label}${active ? `, currently ${sortDesc ? 'descending' : 'ascending'}` : ''}`}
          onClick={() => onSort(key)}
        >
          <span>{label}</span>
          <Icon
            name={active ? (sortDesc ? 'sortDesc' : 'sortAsc') : 'sort'}
            size={13}
          />
        </button>
      </th>
    );
  };

  return (
    <div
      className={styles.desktopTableShell}
      role="region"
      aria-label="Item catalog data table"
      tabIndex={0}
    >
      <table className={styles.itemsTable}>
        <colgroup>
          <col style={{ width: '280px', minWidth: '280px' }} />
          <col style={{ width: '100px', minWidth: '90px' }} />
          <col style={{ width: '110px', minWidth: '100px' }} />
          <col style={{ width: '75px', minWidth: '70px' }} />
          <col style={{ width: '115px', minWidth: '105px' }} />
          <col style={{ width: '95px', minWidth: '85px' }} />
          <col style={{ width: '120px', minWidth: '110px' }} />
          <col style={{ width: '80px', minWidth: '75px' }} />
          <col style={{ minWidth: '150px' }} />
        </colgroup>
        <thead>
          <tr>
            <th className={`${styles.colLeft} ${styles.pinnedCol}`}>Item</th>
            {renderSortHeader('type', 'Type', 'left')}
            {renderSortHeader('quality', 'Quality', 'left')}
            {renderSortHeader('requiredLevel', 'Level', 'right')}
            {renderSortHeader('price', 'Market', 'right')}
            {renderSortHeader('vendor', 'Vendor', 'right')}
            {renderSortHeader('volume', 'Stable Vol', 'right')}
            {renderSortHeader('usage', 'Usage', 'right')}
            <th className={styles.colLeft}>Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const warningLabel = getMarketWarningLabel(item);

            return (
              <tr key={item.id} onClick={() => onOpenItem(item.id)}>
                <td className={styles.pinnedCol}>
                  <button
                    type="button"
                    className={styles.rowOpenButton}
                    aria-label={`Open ${item.name} item details`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenItem(item.id);
                    }}
                  >
                    <div
                      className={styles.itemThumbWrapper}
                      style={{ borderColor: getQualityColor(item.quality) }}
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
                    <div className={styles.itemCopy}>
                      <strong
                        className={styles.itemNameText}
                        style={{ color: getQualityTextColor(item.quality) }}
                      >
                        {item.name}
                      </strong>
                      <small className={styles.itemTypeSub}>{formatLabel(item.type)}</small>
                    </div>
                  </button>
                </td>
                <td className={styles.colLeft}>{formatLabel(item.type)}</td>
                <td className={styles.colLeft}>
                  <span
                    className={styles.qualityTag}
                    style={getQualityTextStyle(item.quality)}
                  >
                    {item.quality}
                  </span>
                </td>
                <td className={`${styles.mono} ${styles.colRight}`} title={item.requirementsText || undefined}>
                  {item.requiredLevel || '—'}
                </td>
                <td className={`${styles.mono} ${styles.colRight}`} title={item.marketConfidence.note}>
                  {item.marketPrice > 0 ? (
                    <span className={styles.goldValue}>
                      <GoldIcon size={12} />
                      <span>{formatGold(item.marketPrice)}</span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={`${styles.mono} ${styles.colRight}`}>
                  {item.vendorPrice > 0 ? (
                    <span className={styles.goldValue}>
                      <GoldIcon size={12} />
                      <span>{formatGold(item.vendorPrice)}</span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td
                  className={`${styles.mono} ${styles.colRight}`}
                  title={
                    item.stableMarketVolume !== item.marketVolume || item.liquidity.hasPriceSwings
                      ? item.liquidity.note
                      : `Raw 3-day volume: ${item.marketVolume.toLocaleString()}`
                  }
                >
                  <span>
                    {item.stableMarketVolume ? item.stableMarketVolume.toLocaleString() : '—'}
                  </span>
                  {warningLabel ? (
                    <span className={styles.volumeWarningIcon} role="img" title={warningLabel} aria-label={warningLabel}>
                      <Icon name="warning" size={11} />
                    </span>
                  ) : null}
                </td>
                <td className={`${styles.mono} ${styles.colRight}`}>
                  {item.usageScore ? item.usageScore.toLocaleString() : '—'}
                </td>
                <td className={styles.colLeft}>
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
