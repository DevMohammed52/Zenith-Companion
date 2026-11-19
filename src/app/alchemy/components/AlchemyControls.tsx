"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Filter,
  PackageCheck,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ALCHEMY_LIQUIDITY_FILTERS, type AlchemyLiquidityFilter } from "../types";

export function AlchemyControls({
  searchTerm,
  onSearchChange,
  onClearSearch,
  minLevel,
  onMinLevelChange,
  maxLevel,
  onMaxLevelChange,
  minProfit,
  onMinProfitChange,
  minVolume,
  onMinVolumeChange,
  parsedBartering,
  activeProfileName,
  onlyProfitable,
  onToggleOnlyProfitable,
  hideMissing,
  onToggleHideMissing,
  ownedCostMode,
  onToggleOwnedMode,
  parsedActiveHours,
  activeHoursSource,
  liquidityFilter,
  onSelectLiquidityFilter,
  activeFilterCount,
  totalRowCount,
  filteredRowCount,
  profitableRowCount,
  marketRowCount,
  currentSortLabel,
  sortDesc,
  hasActiveFilters,
  onReset,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  minLevel: number | "";
  onMinLevelChange: (value: number | "") => void;
  maxLevel: number | "";
  onMaxLevelChange: (value: number | "") => void;
  minProfit: number | "";
  onMinProfitChange: (value: number | "") => void;
  minVolume: number | "";
  onMinVolumeChange: (value: number | "") => void;
  parsedBartering: number;
  activeProfileName: string;
  onlyProfitable: boolean;
  onToggleOnlyProfitable: () => void;
  hideMissing: boolean;
  onToggleHideMissing: () => void;
  ownedCostMode: boolean;
  onToggleOwnedMode: () => void;
  parsedActiveHours: number;
  activeHoursSource: string;
  liquidityFilter: AlchemyLiquidityFilter;
  onSelectLiquidityFilter: (filter: AlchemyLiquidityFilter) => void;
  activeFilterCount: number;
  totalRowCount: number;
  filteredRowCount: number;
  profitableRowCount: number;
  marketRowCount: number;
  currentSortLabel: string;
  sortDesc: boolean;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="alchemy-controls-panel">
      <div className="control-group">
        <label className="control-label">Search Recipe</label>
        <div className="alchemy-search-field">
          <Search size={14} />
          <input
            aria-label="Search alchemy recipes"
            type="text"
            className="control-input"
            placeholder="Recipe, input, vial, path..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              aria-label="Clear alchemy search"
              className="alchemy-search-clear"
              onClick={onClearSearch}
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Level Range</label>
        <div className="alchemy-inline-fields">
          <input
            aria-label="Minimum alchemy level"
            type="number"
            className="control-input"
            placeholder="Min"
            value={minLevel}
            onChange={(e) =>
              onMinLevelChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <input
            aria-label="Maximum alchemy level"
            type="number"
            className="control-input"
            placeholder="Max"
            value={maxLevel}
            onChange={(e) =>
              onMaxLevelChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <Link className="alchemy-helper-link" href="/alchemy/mythic">
          Mythic Lab handles level 90 recipes
        </Link>
      </div>

      <div className="control-group">
        <label className="control-label">Min Profit / 3D Vol</label>
        <div className="alchemy-inline-fields">
          <input
            aria-label="Minimum profit per piece"
            type="number"
            className="control-input"
            placeholder="Profit / pc"
            value={minProfit}
            onChange={(e) =>
              onMinProfitChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <input
            aria-label="Minimum 3-day volume"
            type="number"
            className="control-input"
            placeholder="3D Vol"
            value={minVolume}
            onChange={(e) =>
              onMinVolumeChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Profile Bartering</label>
        <div className="alchemy-readonly-pill" aria-label="Active profile bartering bonus">
          <strong>+{parsedBartering}%</strong>
          <span>
            {activeProfileName !== "Active profile"
              ? `${activeProfileName} profile bonus`
              : "No active profile"}
          </span>
        </div>
      </div>

      <div className="alchemy-toggle-row">
        <button
          type="button"
          aria-pressed={onlyProfitable}
          className={`alchemy-toggle ${onlyProfitable ? "active" : ""}`}
          onClick={onToggleOnlyProfitable}
        >
          <CheckCircle2 size={15} /> Profitable only
        </button>
        <button
          type="button"
          aria-pressed={hideMissing}
          className={`alchemy-toggle ${hideMissing ? "active" : ""}`}
          onClick={onToggleHideMissing}
        >
          <Filter size={15} /> Hide missing
        </button>
        <button
          type="button"
          aria-pressed={ownedCostMode}
          className={`alchemy-toggle ${ownedCostMode ? "active" : ""}`}
          onClick={onToggleOwnedMode}
        >
          <PackageCheck size={15} /> Owned mode
        </button>
        <span className="alchemy-settings-pill">
          <Clock size={14} /> {parsedActiveHours}h/day - {activeHoursSource}
        </span>
      </div>

      <div
        className="alchemy-liquidity-filter"
        aria-label="Filter alchemy rows by liquidity"
        role="group"
      >
        <span>
          <Filter size={14} /> Liquidity
        </span>
        <div className="alchemy-liquidity-filter-options">
          {ALCHEMY_LIQUIDITY_FILTERS.map((filter) => (
            <button
              aria-pressed={liquidityFilter === filter.value}
              className={`alchemy-filter-chip ${
                liquidityFilter === filter.value ? "active" : ""
              }`}
              key={filter.value}
              onClick={() => onSelectLiquidityFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="alchemy-control-status" aria-live="polite">
        <div>
          <span>
            <SlidersHorizontal size={14} /> Filters
          </span>
          <strong>{activeFilterCount === 0 ? "Default" : `${activeFilterCount} active`}</strong>
        </div>
        <div>
          <span>Showing</span>
          <strong>
            {filteredRowCount} of {totalRowCount}
          </strong>
        </div>
        <div>
          <span>Profitable</span>
          <strong>{profitableRowCount}</strong>
        </div>
        <div>
          <span>Market paths</span>
          <strong>{marketRowCount}</strong>
        </div>
        <div>
          <span>Sort</span>
          <strong>
            {currentSortLabel} {sortDesc ? "Desc" : "Asc"}
          </strong>
        </div>
        <button
          className="alchemy-reset-button"
          disabled={!hasActiveFilters}
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={15} /> Reset
        </button>
      </div>
    </div>
  );
}
