"use client";

import React from "react";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { formatGuildNumber, type GuildRecord, type GuildSortKey } from "@/lib/guilds";
import styles from "../page.module.css";
import { TIER_FILTERS, type SearchableGuildRecord, type TierFilter } from "../types";
import { SortPicker } from "./SortPicker";
import { OfflineGuildDetailsCache } from "./OfflineGuildDetailsCache";

export interface GuildsToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  hasSearch: boolean;
  visibleGuilds: SearchableGuildRecord[];
  filteredGuilds: SearchableGuildRecord[];
  allGuilds: SearchableGuildRecord[];
  currentSortLabel: string;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  tier: TierFilter;
  setTier: (tier: TierFilter) => void;
  sortBy: GuildSortKey;
  setSortBy: (sortBy: GuildSortKey) => void;
  getTierFilterCount: (filter: TierFilter) => number;
  resetFilters: () => void;
  resultStatus: string;
}

export function GuildsToolbar({
  search,
  setSearch,
  hasSearch,
  visibleGuilds,
  filteredGuilds,
  allGuilds,
  currentSortLabel,
  hasActiveFilters,
  activeFilterCount,
  tier,
  setTier,
  sortBy,
  setSortBy,
  getTierFilterCount,
  resetFilters,
  resultStatus,
}: GuildsToolbarProps) {
  return (
    <>
      <section className={styles.toolbar} aria-label="Guild filters">
        <div className={styles.toolbarPrimary}>
          <div className={styles.search}>
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search guilds"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guild, tag, leader, top member, or ID"
            />
            {hasSearch && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearch("")}
                aria-label="Clear guild search"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className={styles.resultBar} aria-label="Visible guild results">
            <span>Showing</span>
            <strong>
              {formatGuildNumber(visibleGuilds.length)} of {formatGuildNumber(filteredGuilds.length)}
            </strong>
            <small>{currentSortLabel}</small>
          </div>
        </div>

        <div className={styles.filterHeader} aria-hidden="true">
          <span>
            <SlidersHorizontal size={16} /> Filters
          </span>
          <span>{hasActiveFilters ? `${activeFilterCount} active` : "Default view"}</span>
        </div>

        <div className={styles.filterControls}>
          <div className={styles.tierTabs} role="group" aria-label="Refresh tier filter">
            {TIER_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={tier === option.id}
                data-active={tier === option.id}
                onClick={() => setTier(option.id)}
              >
                <span className={styles.tierLabel}>{option.label}</span>
                <span className={styles.tierCount}>{formatGuildNumber(getTierFilterCount(option.id))}</span>
              </button>
            ))}
          </div>

          <SortPicker value={sortBy} onChange={setSortBy} />

          <button
            type="button"
            className={styles.resetButton}
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            aria-label="Reset guild filters"
          >
            <RotateCcw size={15} aria-hidden="true" /> Reset
          </button>
        </div>

        <OfflineGuildDetailsCache shownGuilds={visibleGuilds} allGuilds={allGuilds} />
      </section>

      <div className={styles.utilityNotes} aria-label="Guild database help">
        <p>Searches guild names, tags, leaders, top members, and IDs.</p>
        <dl className={styles.tierLegend}>
          <div>
            <dt>Active</dt>
            <dd>refreshed most often</dd>
          </div>
          <div>
            <dt>Tracked</dt>
            <dd>known guild with periodic refresh</dd>
          </div>
          <div>
            <dt>Archive</dt>
            <dd>lower-priority stored record</dd>
          </div>
        </dl>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{resultStatus}</p>
    </>
  );
}
