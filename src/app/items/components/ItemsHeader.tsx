'use client';

import React from 'react';
import ZenithIcon from '@/components/icons/ZenithIcon';
import type { ItemDbStats } from '../types';

export interface ItemsHeaderProps {
  totalCataloged: number;
  stats?: ItemDbStats;
  filteredCount: number;
}

export function ItemsHeader({ totalCataloged, filteredCount }: ItemsHeaderProps) {
  const isFiltered = filteredCount !== totalCataloged;

  return (
    <div className="header">
      <div className="header-brand-row">
        <h1 className="header-title">
          <ZenithIcon name="items" size={24} style={{ color: 'var(--text-accent)' }} /> Item Directory
        </h1>
        <span className="items-count-badge">
          {isFiltered
            ? `${filteredCount.toLocaleString()} of ${totalCataloged.toLocaleString()} items`
            : `${totalCataloged.toLocaleString()} items`}
        </span>
      </div>
      <p className="header-description">
        Browse equipment, materials, potions, and recipes with live market values, drop sources, and crafting costs.
      </p>
    </div>
  );
}
