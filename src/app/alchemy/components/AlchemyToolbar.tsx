"use client";

import {
  Badge,
  Button,
  Icon,
  NumberInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SearchInput,
  SegmentedControl,
  Select,
  Tab,
  TabList,
  Tabs,
  Tag,
} from "@/components/ui";
import {
  ALCHEMY_CATEGORY_TABS,
  ALCHEMY_LIQUIDITY_FILTERS,
  ALCHEMY_SORT_SELECT_OPTIONS,
  type AlchemyCategory,
  type AlchemyLiquidityFilter,
  type AlchemyRateMode,
  type AlchemySortKey,
  type AlchemyViewMode,
} from "../types";
import styles from "../page.module.css";

interface AlchemyToolbarProps {
  activeCategory: AlchemyCategory;
  onCategoryChange: (next: string) => void;
  categoryCounts: Record<AlchemyCategory, number>;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  sortCol: AlchemySortKey;
  sortDesc: boolean;
  onSortSelect: (composite: string) => void;
  onToggleSortDirection: () => void;
  rateMode: AlchemyRateMode;
  onRateModeChange: (val: AlchemyRateMode) => void;
  viewMode: AlchemyViewMode;
  onViewModeChange: (val: AlchemyViewMode) => void;
  minLevel: number | "";
  onMinLevelChange: (val: number | "") => void;
  maxLevel: number | "";
  onMaxLevelChange: (val: number | "") => void;
  minProfit: number | "";
  onMinProfitChange: (val: number | "") => void;
  minVolume: number | "";
  onMinVolumeChange: (val: number | "") => void;
  liquidityFilter: AlchemyLiquidityFilter;
  onLiquidityChange: (val: AlchemyLiquidityFilter) => void;
  onlyProfitable: boolean;
  onToggleOnlyProfitable: () => void;
  hideAboveLevel: boolean;
  onToggleHideAboveLevel: () => void;
  hasProfileAlchemyLevel: boolean;
  profileAlchemyLevel: number;
  ownedCostMode: boolean;
  onToggleOwnedMode: () => void;
  hideMissing: boolean;
  onToggleHideMissing: () => void;
  advancedFilterCount: number;
  hasActiveFilters: boolean;
  filteredRowCount: number;
  totalRowCount: number;
  profitableRowCount: number;
  onReset: () => void;
}

export function AlchemyToolbar({
  activeCategory,
  onCategoryChange,
  categoryCounts,
  searchTerm,
  onSearchChange,
  sortCol,
  sortDesc,
  onSortSelect,
  onToggleSortDirection,
  rateMode,
  onRateModeChange,
  viewMode,
  onViewModeChange,
  minLevel,
  onMinLevelChange,
  maxLevel,
  onMaxLevelChange,
  minProfit,
  onMinProfitChange,
  minVolume,
  onMinVolumeChange,
  liquidityFilter,
  onLiquidityChange,
  onlyProfitable,
  onToggleOnlyProfitable,
  hideAboveLevel,
  onToggleHideAboveLevel,
  hasProfileAlchemyLevel,
  profileAlchemyLevel,
  ownedCostMode,
  onToggleOwnedMode,
  hideMissing,
  onToggleHideMissing,
  advancedFilterCount,
  hasActiveFilters,
  filteredRowCount,
  totalRowCount,
  profitableRowCount,
  onReset,
}: AlchemyToolbarProps) {
  const activeSortComposite = `${sortCol}:${sortDesc ? "desc" : "asc"}`;
  const sortSelectValue = ALCHEMY_SORT_SELECT_OPTIONS.some((o) => o.value === activeSortComposite)
    ? activeSortComposite
    : `${sortCol}:desc`;

  return (
    <section className={styles.toolbarCard} aria-label="Alchemy filters and controls">
      <div className={styles.toolbarTopRow}>
        <Tabs
          value={activeCategory}
          onValueChange={onCategoryChange}
          variant="pill"
          sharedPanelId="alchemy-results-panel"
          className={styles.categoryTabs}
        >
          <TabList aria-label="Alchemy recipe categories">
            {ALCHEMY_CATEGORY_TABS.map((tab) => (
              <Tab key={tab.id} value={tab.id}>
                {tab.label} ({categoryCounts[tab.id]})
              </Tab>
            ))}
          </TabList>
        </Tabs>

        <div className={styles.toolbarControlsGroup}>
          <SegmentedControl
            ariaLabel="Rate calculation window"
            value={rateMode}
            onChange={(val) => onRateModeChange(val as AlchemyRateMode)}
            options={[
              { value: "hourly", label: "Hourly" },
              { value: "session", label: "Session" },
            ]}
          />
          <div className={styles.desktopOnly}>
            <SegmentedControl
              ariaLabel="Results layout view"
              value={viewMode}
              onChange={(val) => onViewModeChange(val as AlchemyViewMode)}
              options={[
                { value: "table", label: "Table" },
                { value: "cards", label: "Cards" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className={styles.toolbarSearchRow}>
        <div className={styles.searchSlot}>
          <SearchInput
            ariaLabel="Search alchemy recipes"
            placeholder="Search potion, crystal, ingredient, or vial..."
            showShortcutHint={false}
            value={searchTerm}
            onChange={(val) => onSearchChange(val)}
            onClear={() => onSearchChange("")}
          />
        </div>

        <div className={styles.sortSlot}>
          <Select
            ariaLabel="Sort alchemy recipes"
            value={sortSelectValue}
            onChange={onSortSelect}
            options={ALCHEMY_SORT_SELECT_OPTIONS}
          />
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Sort ${sortDesc ? "descending" : "ascending"}. Toggle direction.`}
            onClick={onToggleSortDirection}
          >
            <Icon name={sortDesc ? "sortDesc" : "sortAsc"} size="sm" aria-hidden="true" />
          </Button>
        </div>

        <Popover placement="bottom-end">
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm">
              <Icon name="filter" size="sm" aria-hidden="true" />
              <span>Filters</span>
              {advancedFilterCount > 0 && (
                <Badge size="sm" variant="refined">
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent ariaLabel="More alchemy filters">
            <div className={styles.popoverBody}>
              <div className={styles.popoverRow}>
                <NumberInput
                  label="Min Level"
                  min={0}
                  max={89}
                  value={minLevel === "" ? 0 : Number(minLevel)}
                  onChange={(val) => onMinLevelChange(val)}
                />
                <NumberInput
                  label="Max Level"
                  min={1}
                  max={89}
                  value={maxLevel === "" ? 89 : Number(maxLevel)}
                  onChange={(val) => onMaxLevelChange(val)}
                />
              </div>
              <div className={styles.popoverRow}>
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="alchemy-min-profit">
                    Min Profit / pc
                  </label>
                  <NumberInput
                    id="alchemy-min-profit"
                    showSteppers={false}
                    value={minProfit === "" ? 0 : Number(minProfit)}
                    onChange={(val) => onMinProfitChange(val === 0 ? "" : val)}
                  />
                </div>
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="alchemy-min-vol">
                    Min 3d Volume
                  </label>
                  <NumberInput
                    id="alchemy-min-vol"
                    min={0}
                    showSteppers={false}
                    value={minVolume === "" ? 0 : Number(minVolume)}
                    onChange={(val) => onMinVolumeChange(val <= 0 ? "" : val)}
                  />
                </div>
              </div>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Liquidity Signal</span>
                <Select
                  ariaLabel="Filter by liquidity signal"
                  value={liquidityFilter}
                  onChange={(val) => onLiquidityChange(val as AlchemyLiquidityFilter)}
                  options={ALCHEMY_LIQUIDITY_FILTERS.map((f) => ({
                    value: f.value,
                    label: f.label,
                  }))}
                />
              </div>
              <div className={styles.popoverActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!hasActiveFilters}
                  onClick={onReset}
                >
                  <Icon name="undo" size="sm" aria-hidden="true" />
                  <span>Reset all</span>
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className={styles.filterTagsRow}>
        <div className={styles.tagGroup} role="group" aria-label="Quick recipe filters">
          <Tag
            label="Profitable only"
            selected={onlyProfitable}
            onSelect={onToggleOnlyProfitable}
          />
          <Tag
            label={hasProfileAlchemyLevel ? `My level (<= ${profileAlchemyLevel})` : "My level"}
            selected={hasProfileAlchemyLevel && hideAboveLevel}
            onSelect={hasProfileAlchemyLevel ? onToggleHideAboveLevel : undefined}
          />
          <Tag
            label="Owned inputs (0g cost)"
            selected={ownedCostMode}
            onSelect={onToggleOwnedMode}
          />
          <Tag
            label="Hide missing prices"
            selected={hideMissing}
            onSelect={onToggleHideMissing}
          />
        </div>

        <div className={styles.statusMetaGroup} aria-live="polite">
          <span>
            Showing {filteredRowCount} of {totalRowCount}
          </span>
          <span className={styles.hairlineDivider} aria-hidden="true" />
          <span>{profitableRowCount} profitable</span>
          {hasActiveFilters && (
            <>
              <span className={styles.hairlineDivider} aria-hidden="true" />
              <Button variant="ghost" size="sm" onClick={onReset}>
                <Icon name="undo" size="xs" aria-hidden="true" />
                <span>Reset</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
