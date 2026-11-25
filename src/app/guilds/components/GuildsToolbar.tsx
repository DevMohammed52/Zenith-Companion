"use client";

import React from "react";
import {
  Button,
  Card,
  Icon,
  SearchInput,
  SegmentedControl,
  Select,
  Tag,
  type SelectOption,
} from "@/components/ui";
import { formatGuildNumber, type GuildSortKey } from "@/lib/guilds";
import {
  SORT_OPTIONS,
  TIER_FILTERS,
  type EnrichedGuildRecord,
  type GuildViewMode,
  type TierFilter,
} from "../types";
import styles from "../page.module.css";

export interface GuildsToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  visibleGuilds: EnrichedGuildRecord[];
  filteredGuilds: EnrichedGuildRecord[];
  tier: TierFilter;
  setTier: (tier: TierFilter) => void;
  sortBy: GuildSortKey;
  setSortBy: (sortBy: GuildSortKey) => void;
  onlyOpenSlots: boolean;
  setOnlyOpenSlots: React.Dispatch<React.SetStateAction<boolean>>;
  onlyConquest: boolean;
  setOnlyConquest: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: GuildViewMode;
  setViewMode: (mode: GuildViewMode) => void;
  isCompactViewport: boolean;
  hasActiveFilters: boolean;
  getTierFilterCount: (filter: TierFilter) => number;
  resetFilters: () => void;
  resultStatus: string;
}

export function GuildsToolbar({
  search,
  setSearch,
  visibleGuilds,
  filteredGuilds,
  tier,
  setTier,
  sortBy,
  setSortBy,
  onlyOpenSlots,
  setOnlyOpenSlots,
  onlyConquest,
  setOnlyConquest,
  viewMode,
  setViewMode,
  isCompactViewport,
  hasActiveFilters,
  getTierFilterCount,
  resetFilters,
  resultStatus,
}: GuildsToolbarProps) {
  const sortSelectOptions: SelectOption[] = SORT_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  const tierOptions = TIER_FILTERS.map((option) => ({
    value: option.id,
    label: option.label,
    badge: formatGuildNumber(getTierFilterCount(option.id)),
  }));

  return (
    <Card padding="md" overflowVisible className={styles.toolbarCard}>
      <section aria-label="Guild filters" className={styles.toolbarInner}>
        <div className={styles.toolbarTopRow}>
          <div className={styles.searchWrap}>
            <SearchInput
              ariaLabel="Search guilds"
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              showShortcutHint={false}
              placeholder="Search guild name, tag, leader, top member, or ID..."
            />
          </div>

          <div className={styles.toolbarRightCluster}>
            <div className={styles.resultSummary}>
              <strong>{formatGuildNumber(visibleGuilds.length)}</strong>
              <span> of {formatGuildNumber(filteredGuilds.length)} matching</span>
            </div>

            {!isCompactViewport && (
              <SegmentedControl<GuildViewMode>
                size="sm"
                ariaLabel="Directory layout"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: "table", label: "Table" },
                  { value: "cards", label: "Cards" },
                ]}
              />
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="undo" size="sm" />}
                onClick={resetFilters}
                aria-label="Reset guild filters"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className={styles.toolbarControlsRow}>
          <div className={styles.tierScrollWrap}>
            <SegmentedControl<TierFilter>
              size="sm"
              ariaLabel="Refresh tier filter"
              value={tier}
              onChange={setTier}
              options={tierOptions}
            />
          </div>

          <div className={styles.tagFilterGroup} role="group" aria-label="Quick guild filters">
            <Tag
              label="Open Slots"
              selected={onlyOpenSlots}
              onSelect={() => setOnlyOpenSlots((prev) => !prev)}
            />
            <Tag
              label="Conquest Rulers"
              icon={<Icon name="conquest" size="xs" />}
              selected={onlyConquest}
              onSelect={() => setOnlyConquest((prev) => !prev)}
            />
          </div>

          <div className={styles.sortSelectWrap}>
            <Select
              options={sortSelectOptions}
              value={sortBy}
              onChange={(next) => setSortBy(next as GuildSortKey)}
              ariaLabel="Sort guilds by"
            />
          </div>
        </div>
      </section>

      <p className="sr-only" role="status" aria-live="polite">{resultStatus}</p>
    </Card>
  );
}
