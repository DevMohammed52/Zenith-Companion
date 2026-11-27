'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Icon,
  ModalSheet,
  SegmentedControl,
  Select,
  Tag,
  type ItemRarity,
  type SelectOption,
} from '@/components/ui';
import { ItemSearchBox } from './ItemSearchBox';
import {
  SIGNAL_OPTIONS,
  SORT_OPTIONS,
  type FilterOption,
  type SignalFilter,
  type SortKey,
  type ViewMode,
} from '../types';
import styles from '../Items.module.css';

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

function mapQualityTone(tone?: string): ItemRarity | undefined {
  if (!tone) return undefined;
  const upper = tone.toUpperCase();
  if (upper === 'MYTHIC') return 'mythic';
  if (upper === 'LEGENDARY') return 'legendary';
  if (upper === 'EPIC') return 'epic';
  if (upper === 'PREMIUM' || upper === 'RARE') return 'rare';
  if (upper === 'REFINED' || upper === 'UNCOMMON') return 'uncommon';
  if (upper === 'STANDARD' || upper === 'COMMON') return 'common';
  return undefined;
}

function toSelectOptions<T extends string>(options: FilterOption<T>[]): SelectOption[] {
  return options.map((opt) => ({
    value: opt.value,
    label: opt.label,
    rarity: mapQualityTone(opt.qualityTone),
  }));
}

const TAG_GUIDE_ITEMS: Array<{ label: string; tone?: 'success' | 'warning' | 'neutral'; desc: string }> = [
  { label: 'Likely market', tone: 'success', desc: 'Active trading volume with predictable market prices.' },
  { label: 'Volume swings', tone: 'warning', desc: 'Occasional sales or bulk trades; prices may fluctuate.' },
  { label: 'Vendor safer', tone: 'neutral', desc: 'NPC vendor payout is higher or more reliable than thin market demand.' },
  { label: 'Untradable', tone: 'neutral', desc: 'Soulbound or account-locked; cannot be traded on the player market.' },
  { label: 'Farmable', tone: 'neutral', desc: 'Can be gathered from world locations, dungeons, or regular enemies.' },
];

export function ItemsFilterBar({ state }: { state: ItemsFilterBarState }) {
  const [showTagGuide, setShowTagGuide] = useState(false);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  const activeCount =
    state.activeAdvancedFilterCount ??
    [
      state.selectedType !== 'ALL',
      state.selectedQuality !== 'ALL',
      state.selectedSignal !== 'ALL',
      state.selectedLocation !== 'ALL',
    ].filter(Boolean).length;

  const hasAnyFilter = activeCount > 0 || state.hideNonMarket || Boolean(state.searchTerm.trim());

  const sortSelectOptions = useMemo(() => toSelectOptions(SORT_OPTIONS), []);
  const typeSelectOptions = useMemo(() => toSelectOptions(state.typeOptions), [state.typeOptions]);
  const qualitySelectOptions = useMemo(() => toSelectOptions(state.qualityOptions), [state.qualityOptions]);
  const signalSelectOptions = useMemo(() => toSelectOptions(SIGNAL_OPTIONS), []);
  const locationSelectOptions = useMemo(() => toSelectOptions(state.locationOptions), [state.locationOptions]);

  return (
    <>
      <section className={styles.controlsCard} aria-label="Item filters and view controls">
        <div className={`${styles.controlGroup} ${styles.searchControl}`}>
          <label className={styles.controlLabel} htmlFor="item-catalog-search">
            Search
          </label>
          <ItemSearchBox
            id="item-catalog-search"
            value={state.searchTerm}
            onChange={state.setSearchTerm}
            placeholder="Search equipment, materials, potions, recipes..."
          />
        </div>

        <div className={`${styles.controlGroup} ${styles.sortControl}`}>
          <span className={styles.controlLabel}>Sort</span>
          <div className={styles.sortInputCluster}>
            <div className={styles.sortSelectWrap}>
              <Select
                ariaLabel="Item sort property"
                options={sortSelectOptions}
                value={state.sortBy}
                onChange={(nextVal) => state.handleSortPickerChange(nextVal as SortKey)}
              />
            </div>
            <Button
              variant="secondary"
              size="md"
              icon={<Icon name={state.sortDesc ? 'sortDescAlt' : 'sortAscAlt'} size={15} />}
              aria-label={`Sort ${state.sortDesc ? 'descending (highest first)' : 'ascending (lowest first)'}. Click to reverse.`}
              title={`Sort ${state.sortDesc ? 'descending' : 'ascending'}`}
              onClick={() => state.setSortDesc((prev) => !prev)}
            >
              {state.sortDesc ? 'Desc' : 'Asc'}
            </Button>
          </div>
        </div>

        <div className={styles.quickActions}>
          <Button
            variant={state.hideNonMarket ? 'primary' : 'secondary'}
            size="md"
            icon={<Icon name="gold" size={15} />}
            aria-pressed={state.hideNonMarket}
            title="Filter to tradeable items (including items without recent market sales)"
            onClick={() => state.setHideNonMarket((prev) => !prev)}
          >
            Tradeable only
          </Button>
          <Button
            variant="ghost"
            size="md"
            icon={<Icon name="help" size={15} />}
            onClick={() => setShowTagGuide(true)}
          >
            Tag Guide
          </Button>
          {hasAnyFilter && state.resetFilters && (
            <Button
              variant="ghost"
              size="md"
              icon={<Icon name="undo" size={15} />}
              onClick={state.resetFilters}
              aria-label="Reset item filters"
            >
              Reset
            </Button>
          )}
        </div>

        <div className={styles.viewControl}>
          <SegmentedControl
            ariaLabel="View mode"
            value={state.viewMode}
            onChange={(val) => state.setViewMode(val as ViewMode)}
            options={[
              { value: 'table', label: 'Table' },
              { value: 'cards', label: 'Cards' },
            ]}
          />
        </div>

        <div
          className={styles.advancedFilterPanel}
          data-expanded={mobileFiltersExpanded ? 'true' : 'false'}
        >
          <button
            type="button"
            className={styles.advancedFilterSummary}
            aria-expanded={mobileFiltersExpanded}
            aria-controls="items-advanced-filters-grid"
            onClick={() => setMobileFiltersExpanded((prev) => !prev)}
          >
            <span className={styles.summaryLeft}>
              <Icon name="filter" size={15} />
              <span>Filters</span>
              {activeCount > 0 ? (
                <span className={styles.activeFilterPill}>{activeCount} active</span>
              ) : null}
            </span>
            <Icon name="chevronDown" size={15} className={styles.filterPanelChevron} />
          </button>

          <div id="items-advanced-filters-grid" className={styles.advancedFilterGrid}>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Type</span>
              <Select
                ariaLabel="Item type filter"
                options={typeSelectOptions}
                value={state.selectedType}
                onChange={state.handleTypeChange}
              />
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Quality</span>
              <Select
                ariaLabel="Item quality filter"
                options={qualitySelectOptions}
                value={state.selectedQuality}
                onChange={state.setSelectedQuality}
              />
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Tag</span>
              <Select
                ariaLabel="Item tag filter"
                options={signalSelectOptions}
                value={state.selectedSignal}
                onChange={(val) => state.setSelectedSignal(val as SignalFilter)}
              />
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Source</span>
              <Select
                ariaLabel="Item source location filter"
                options={locationSelectOptions}
                value={state.selectedLocation}
                onChange={state.setSelectedLocation}
              />
            </div>
          </div>
        </div>
      </section>

      <ModalSheet
        isOpen={showTagGuide}
        onClose={() => setShowTagGuide(false)}
        title="Item Tag Guide"
        description="Definitions for market confidence and source indicators across the catalog."
        maxWidth="sm"
      >
        <div className={styles.tagGuideGrid}>
          {TAG_GUIDE_ITEMS.map((entry) => (
            <div key={entry.label} className={styles.tagGuideItem}>
              <Tag
                label={entry.label}
                rarity={entry.tone === 'warning' ? 'legendary' : entry.tone === 'success' ? 'rare' : 'common'}
              />
              <p className={styles.tagGuideDesc}>{entry.desc}</p>
            </div>
          ))}
        </div>
      </ModalSheet>
    </>
  );
}
