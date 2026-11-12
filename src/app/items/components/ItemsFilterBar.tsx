'use client';

import React from 'react';
import {
  ArrowDownUp,
  ChevronDown,
  ShoppingCart,
  SlidersHorizontal,
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
  return (
    <>
      <details className="item-help">
        <summary>
          <ShoppingCart size={16} aria-hidden="true" />
          <span>Market labels</span>
        </summary>
        <div className="item-help-body" aria-label="Item tag definitions">
          <span><strong>No sales</strong> means tradeable, but no usable recent sale volume.</span>
          <span><strong>Vendor safer</strong> means vendor value is clearer than a thin market.</span>
          <span><strong>Merchant item</strong> means bought from an NPC merchant.</span>
          <span><strong>Untradable</strong> means the item is not a market exit path.</span>
        </div>
      </details>

      <section className="db-controls">
        <div className="control-group search-control">
          <label className="control-label">Search</label>
          <ItemSearchBox
            value={state.searchTerm}
            onChange={state.setSearchTerm}
            placeholder="Search item, material, or source"
          />
        </div>

        <div className="control-group sort-control">
          <label className="control-label">Sort</label>
          <ItemFilterPicker
            ariaLabel="Item sort"
            options={SORT_OPTIONS}
            value={state.sortBy}
            onChange={state.handleSortPickerChange}
          />
        </div>

        <button
          type="button"
          className="control-input icon-toggle sort-direction-toggle"
          onClick={() => state.setSortDesc((prev) => !prev)}
        >
          <ArrowDownUp size={15} aria-hidden="true" /> {state.sortDesc ? 'Desc' : 'Asc'}
        </button>

        <button
          type="button"
          className={`control-input icon-toggle market-toggle ${state.hideNonMarket ? 'active' : ''}`}
          aria-pressed={state.hideNonMarket}
          onClick={() => state.setHideNonMarket((prev) => !prev)}
        >
          <ShoppingCart size={15} aria-hidden="true" /> Market
        </button>

        <details className="advanced-filter-panel" open={!state.isCompactViewport ? true : undefined}>
          <summary>
            <span>
              <SlidersHorizontal size={15} aria-hidden="true" />
              Filters
            </span>
            <small>{state.advancedFilterStatus}</small>
            <ChevronDown size={15} aria-hidden="true" />
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
