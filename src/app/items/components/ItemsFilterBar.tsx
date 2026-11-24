'use client';

import React, { useState } from 'react';
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ChevronDown,
  Coins,
  HelpCircle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ItemFilterPicker } from './ItemFilterPicker';
import { ItemSearchBox } from './ItemSearchBox';
import {
  SIGNAL_OPTIONS,
  SORT_OPTIONS,
  type FilterOption,
  type SignalFilter,
  type SortKey,
  type ViewMode,
} from '../types';

export interface ItemsFilterBarState {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortBy: SortKey;
  sortDesc: boolean;
  handleSortPickerChange: (key: SortKey) => void;
  setSortDesc: React.Dispatch<React.SetStateAction<boolean>>;
  hideNonMarket: boolean;
  setHideNonMarket: React.Dispatch<React.SetStateAction<boolean>>;
  isCompactViewport: boolean;
  advancedFilterStatus: string;
  activeAdvancedFilterCount?: number;
  resetFilters?: () => void;
  selectedType: string;
  typeOptions: FilterOption<string>[];
  handleTypeChange: (type: string) => void;
  selectedQuality: string;
  qualityOptions: FilterOption<string>[];
  setSelectedQuality: (quality: string) => void;
  selectedSignal: SignalFilter;
  setSelectedSignal: (signal: SignalFilter) => void;
  selectedLocation: string;
  locationOptions: FilterOption<string>[];
  setSelectedLocation: (location: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function ItemsFilterBar({ state }: { state: ItemsFilterBarState }) {
  const [showTagGuide, setShowTagGuide] = useState(false);
  const activeCount =
    state.activeAdvancedFilterCount ??
    [
      state.selectedType !== 'ALL',
      state.selectedQuality !== 'ALL',
      state.selectedSignal !== 'ALL',
      state.selectedLocation !== 'ALL',
    ].filter(Boolean).length;

  return (
    <>
      {showTagGuide && (
        <aside className="item-tag-guide-banner" aria-label="Item tag definitions">
          <div className="tag-guide-header">
            <div className="tag-guide-title">
              <HelpCircle size={15} style={{ color: 'var(--text-accent)' }} />
              <strong>Item Tag Guide</strong>
            </div>
            <button
              type="button"
              className="tag-guide-close"
              aria-label="Close tag guide"
              onClick={() => setShowTagGuide(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div className="tag-guide-grid">
            <div className="tag-guide-item">
              <span className="guide-pill good">Likely market</span>
              <p>Active trading volume with predictable market prices.</p>
            </div>
            <div className="tag-guide-item">
              <span className="guide-pill warning">Volume swings</span>
              <p>Occasional sales or bulk trades; prices may fluctuate.</p>
            </div>
            <div className="tag-guide-item">
              <span className="guide-pill muted">Vendor safer</span>
              <p>NPC vendor payout is higher or more reliable than thin market demand.</p>
            </div>
            <div className="tag-guide-item">
              <span className="guide-pill unranked">Untradable</span>
              <p>Soulbound or account-locked; cannot be traded on the player market.</p>
            </div>
            <div className="tag-guide-item">
              <span className="guide-pill info">Farmable</span>
              <p>Can be gathered from world locations, dungeons, or regular enemies.</p>
            </div>
          </div>
        </aside>
      )}

      <section className="db-controls" aria-label="Item filters and view controls">
        <div className="control-group search-control">
          <label className="control-label" htmlFor="item-catalog-search">Search</label>
          <ItemSearchBox
            value={state.searchTerm}
            onChange={state.setSearchTerm}
            placeholder="Search equipment, materials, potions, recipes..."
          />
        </div>

        <div className="control-group sort-control">
          <label className="control-label">Sort</label>
          <div className="sort-input-cluster">
            <ItemFilterPicker
              ariaLabel="Item sort property"
              options={SORT_OPTIONS}
              value={state.sortBy}
              onChange={state.handleSortPickerChange}
            />
            <button
              type="button"
              className="icon-toggle sort-direction-toggle"
              aria-label={`Sort ${state.sortDesc ? 'descending (highest first)' : 'ascending (lowest first)'}. Click to reverse.`}
              title={`Sort ${state.sortDesc ? 'descending' : 'ascending'}`}
              onClick={() => state.setSortDesc((prev) => !prev)}
            >
              {state.sortDesc ? (
                <ArrowDownNarrowWide size={15} aria-hidden="true" />
              ) : (
                <ArrowUpNarrowWide size={15} aria-hidden="true" />
              )}
              <span className="sort-direction-label">{state.sortDesc ? 'Desc' : 'Asc'}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className={`control-input icon-toggle market-toggle ${state.hideNonMarket ? 'active' : ''}`}
          aria-pressed={state.hideNonMarket}
          title="Filter to tradeable items with active market price data"
          onClick={() => state.setHideNonMarket((prev) => !prev)}
        >
          <Coins size={15} aria-hidden="true" />
          <span>Tradeable only</span>
        </button>

        <details className="advanced-filter-panel" open={!state.isCompactViewport ? true : undefined}>
          <summary>
            <div className="summary-left">
              <SlidersHorizontal size={15} aria-hidden="true" />
              <span>Filters</span>
              {activeCount > 0 ? (
                <span className="active-filter-pill">{activeCount} active</span>
              ) : null}
            </div>
            <div className="summary-right">
              <button
                type="button"
                className="tag-guide-trigger-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTagGuide((prev) => !prev);
                }}
                title="Explain market and item tags"
              >
                <HelpCircle size={13} aria-hidden="true" />
                <span>Tag Guide</span>
              </button>
              <ChevronDown size={15} aria-hidden="true" className="filter-panel-chevron" />
            </div>
          </summary>

          <div className="advanced-filter-grid">
            <div className="control-group">
              <label className="control-label">Type</label>
              <ItemFilterPicker
                ariaLabel="Item type filter"
                options={state.typeOptions}
                value={state.selectedType}
                onChange={state.handleTypeChange}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Quality</label>
              <ItemFilterPicker
                ariaLabel="Item quality filter"
                options={state.qualityOptions}
                value={state.selectedQuality}
                onChange={state.setSelectedQuality}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Tag</label>
              <ItemFilterPicker
                ariaLabel="Item tag filter"
                options={SIGNAL_OPTIONS}
                value={state.selectedSignal}
                onChange={state.setSelectedSignal}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Source</label>
              <ItemFilterPicker
                ariaLabel="Item source location filter"
                options={state.locationOptions}
                value={state.selectedLocation}
                onChange={state.setSelectedLocation}
              />
            </div>
          </div>
        </details>

        <div className="view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={state.viewMode === 'table' ? 'active' : ''}
            aria-pressed={state.viewMode === 'table'}
            onClick={() => state.setViewMode('table')}
          >
            Table
          </button>
          <button
            type="button"
            className={state.viewMode === 'cards' ? 'active' : ''}
            aria-pressed={state.viewMode === 'cards'}
            onClick={() => state.setViewMode('cards')}
          >
            Grid
          </button>
        </div>
      </section>
    </>
  );
}
