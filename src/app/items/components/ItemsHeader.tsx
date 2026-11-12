'use client';

import React from 'react';
import ZenithIcon from '@/components/icons/ZenithIcon';
import type { ItemDbStats } from '../types';

export interface ItemsHeaderProps {
  totalCataloged: number;
  stats: ItemDbStats;
  filteredCount: number;
}

export function ItemsHeader({ totalCataloged, stats, filteredCount }: ItemsHeaderProps) {
  return (
    <>
      <div className="header">
        <h1 className="header-title">
          <ZenithIcon name="items" size={24} style={{ color: 'var(--text-accent)' }} /> Item Database
        </h1>
        <div className="header-status">
          <div className="status-dot" />
          <span className="mono">{totalCataloged.toLocaleString()} ITEMS CATALOGED</span>
        </div>
      </div>

      <section aria-label="Item database summary metrics" className="db-summary" tabIndex={0}>
        <div>
          <span className="summary-label">Market listed</span>
          <strong>{stats.marketListed.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Craftable</span>
          <strong>{stats.craftable.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Recipe uses</span>
          <strong>{stats.used.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Lore linked</span>
          <strong>{stats.loreLinked.toLocaleString()}</strong>
        </div>
        <div>
          <span className="summary-label">Filtered items</span>
          <strong>{filteredCount.toLocaleString()}</strong>
        </div>
      </section>
    </>
  );
}
