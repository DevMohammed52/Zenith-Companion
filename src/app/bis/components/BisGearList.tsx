"use client";

import React from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { getQualityTextStyle } from "@/lib/quality";
import {
  formatGold,
  INITIAL_VISIBLE_GEAR_ROWS,
  SLOT_FILTERS,
  slotLabel,
  SORT_OPTIONS,
  type Direction,
  type GearType,
  type GearView,
  type SortKey,
} from "../types";

export interface BisGearListProps {
  gearListPanelRef: React.RefObject<HTMLDivElement | null>;
  filteredGear: GearView[];
  visibleGear: GearView[];
  selected: GearView | null;
  usableOnly: boolean;
  setUsableOnly: React.Dispatch<React.SetStateAction<boolean>>;
  usableGearCount: number;
  slotFilter: "ALL" | GearType;
  slotButtonRefs: React.MutableRefObject<Partial<Record<"ALL" | GearType, HTMLButtonElement | null>>>;
  changeSlotFilter: (slot: "ALL" | GearType) => void;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  direction: Direction;
  setDirection: React.Dispatch<React.SetStateAction<Direction>>;
  mobileSelectionHint: string;
  selectGear: (view: GearView) => void;
  prefetchGearItem: (name: string) => void;
  setVisibleGearCount: React.Dispatch<React.SetStateAction<number>>;
}

export function BisGearList({
  gearListPanelRef,
  filteredGear,
  visibleGear,
  selected,
  usableOnly,
  setUsableOnly,
  usableGearCount,
  slotFilter,
  slotButtonRefs,
  changeSlotFilter,
  sortKey,
  setSortKey,
  direction,
  setDirection,
  mobileSelectionHint,
  selectGear,
  prefetchGearItem,
  setVisibleGearCount,
}: BisGearListProps) {
  return (
    <div ref={gearListPanelRef} className="gear-list-panel">
      <div className="list-command-strip" aria-label="Gear list status">
        <div>
          <span>Gear library</span>
          <strong>{filteredGear.length.toLocaleString()} matching</strong>
        </div>
        <span>{usableOnly ? `${usableGearCount.toLocaleString()} usable from profile levels` : "Showing usable and locked gear"}</span>
      </div>
      <div className="filter-row" aria-label="Gear filters">
        <div className="chip-scroll-shell">
          <div className="chip-scroll" aria-label="Slot filters">
            {SLOT_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                ref={(element) => {
                  slotButtonRefs.current[option.id] = element;
                }}
                className={slotFilter === option.id ? "is-active" : ""}
                aria-pressed={slotFilter === option.id}
                onClick={() => changeSlotFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={usableOnly ? "toggle is-active" : "toggle"}
          aria-pressed={usableOnly}
          onClick={() => setUsableOnly((value) => !value)}
        >
          <Check size={15} /> Usable
        </button>
      </div>

      <div className="sort-row" aria-label="Sort controls">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={sortKey === option.id ? "is-active" : ""}
            aria-pressed={sortKey === option.id}
            onClick={() => {
              setSortKey(option.id);
              if (option.id === "stats" || option.id === "quality") setDirection("desc");
              if (option.id === "level" || option.id === "price" || option.id === "name") setDirection("asc");
            }}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          className="direction"
          aria-label={`Sort ${direction === "asc" ? "ascending" : "descending"}`}
          onClick={() => setDirection((dir) => (dir === "asc" ? "desc" : "asc"))}
        >
          {direction === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          {direction === "asc" ? "Asc" : "Desc"}
        </button>
      </div>

      {mobileSelectionHint && <div className="selection-hint" role="status">{mobileSelectionHint}</div>}

      <p className="ranking-note list-note">List sorting uses base-tier stats. Use the comparison panel for candidate and saved tier differences.</p>

      <div className="gear-list" aria-label="Combat gear list">
        {visibleGear.map((view) => {
          const isSelected = selected?.item.hashed_id === view.item.hashed_id;
          return (
            <button
              key={view.item.hashed_id}
              type="button"
              className={isSelected ? "gear-row is-selected" : "gear-row"}
              aria-label={`Compare ${view.item.name}, ${slotLabel(view.item.type)}, level ${view.requirementLevel}, ${view.eligible ? "usable" : "locked"}`}
              aria-pressed={isSelected}
              aria-current={isSelected ? "true" : undefined}
              onClick={() => selectGear(view)}
              onMouseEnter={() => prefetchGearItem(view.item.name)}
            >
              <img src={view.item.image_url || "/favicon.ico"} alt="" width={48} height={48} loading="lazy" decoding="async" />
              <span className="gear-main">
                <strong>{view.item.name}</strong>
                <small>
                  {slotLabel(view.item.type)} | Lv.{view.requirementLevel} | Max T{view.item.max_tier || 1}
                </small>
              </span>
              <span className="gear-meta">
                <strong>{formatGold(view.price)}</strong>
                <small style={getQualityTextStyle(view.item.quality)}>{view.item.quality}</small>
              </span>
              <span className={view.eligible ? "status ok" : "status locked"}>{view.eligible ? "Usable" : "Locked"}</span>
            </button>
          );
        })}
        {filteredGear.length === 0 && (
          <div className="empty-state">
            <strong>No gear matches these filters.</strong>
            <span>Try slot names like Helmet, rarity names, stat names, or aliases like hat, chest, gloves, and boots.</span>
          </div>
        )}
      </div>
      {visibleGear.length < filteredGear.length && (
        <div className="gear-list-more">
          <span>Showing {visibleGear.length.toLocaleString()} of {filteredGear.length.toLocaleString()} matching items.</span>
          <button
            type="button"
            onClick={() => setVisibleGearCount((count) => Math.min(filteredGear.length, count + INITIAL_VISIBLE_GEAR_ROWS))}
          >
            Show more gear
          </button>
        </div>
      )}
    </div>
  );
}
