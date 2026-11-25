'use client';

import React from 'react';
import ZenithIcon from '@/components/icons/ZenithIcon';
import type { ItemDbStats } from '../types';
import styles from '../Items.module.css';

export interface ItemsHeaderProps {
  totalCataloged: number;
  stats?: ItemDbStats;
  filteredCount: number;
}

export function ItemsHeader({ totalCataloged, filteredCount }: ItemsHeaderProps) {
  const isFiltered = filteredCount !== totalCataloged;

  return (
    <header className={styles.header}>
      <div className={styles.headerBrandRow}>
        <h1 className={styles.headerTitle}>
          <ZenithIcon name="items" size={24} className={styles.headerIcon} />
          <span>Item Directory</span>
        </h1>
        <span className={styles.countBadge}>
          {isFiltered
            ? `${filteredCount.toLocaleString()} of ${totalCataloged.toLocaleString()} items`
            : `${totalCataloged.toLocaleString()} items`}
        </span>
      </div>
      <p className={styles.headerDescription}>
        Browse equipment, materials, potions, and recipes with live market values, drop sources, and crafting costs.
      </p>
    </header>
  );
}
