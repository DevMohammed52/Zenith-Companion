"use client";

import React, { type Dispatch, type SetStateAction } from "react";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { NumberInput } from "@/components/ui/NumberInput";
import { Switch } from "@/components/ui/Switch";
import type { CharacterProfile } from "@/lib/profiles";
import {
  BATTLE_PROFIT_OPTIONS,
  EVOLUTION_STAT_OPTIONS,
  FOOD_OPTIONS,
  QUALITY_OPTIONS,
  SORT_OPTIONS,
  SOURCE_OPTIONS,
  type BattleProfitMode,
  type FoodPolicy,
  type Quality,
  type SortKey,
  type SourceFilter,
  type StatKey,
  type ViewMode,
} from "../types";
import { qualityLabel } from "../utils/pet-helpers";
import styles from "../Pets.module.css";

export function PetFilters({
  searchTerm,
  setSearchTerm,
  qualityFilter,
  setQualityFilter,
  sourceFilter,
  setSourceFilter,
  sortBy,
  setSortBy,
  sortDesc,
  setSortDesc,
  viewMode,
  setViewMode,
  petLevel,
  setPetLevel,
  masteryLevel,
  setMasteryLevel,
  evolutionStage,
  setEvolutionStage,
  evolutionStat,
  setEvolutionStat,
  battleProfitMode,
  setBattleProfitMode,
  foodPolicy,
  setFoodPolicy,
  patBonus,
  setPatBonus,
  beastmaster,
  setBeastmaster,
  activeProfile,
  applyProfilePet,
  hasActiveFilters,
  clearPetFilters,
  primaryControlsModified,
  resetPetControls,
  scenarioIsModified,
  scenarioLabel,
  isSetupOpen,
  setIsSetupOpen,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  qualityFilter: Quality | "ALL";
  setQualityFilter: (value: Quality | "ALL") => void;
  sourceFilter: SourceFilter;
  setSourceFilter: (value: SourceFilter) => void;
  sortBy: SortKey;
  setSortBy: (value: SortKey) => void;
  sortDesc: boolean;
  setSortDesc: Dispatch<SetStateAction<boolean>>;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  petLevel: number;
  setPetLevel: (value: number) => void;
  masteryLevel: number;
  setMasteryLevel: (value: number) => void;
  evolutionStage: number;
  setEvolutionStage: (value: number) => void;
  evolutionStat: StatKey | "all";
  setEvolutionStat: (value: StatKey | "all") => void;
  battleProfitMode: BattleProfitMode;
  setBattleProfitMode: (value: BattleProfitMode) => void;
  foodPolicy: FoodPolicy;
  setFoodPolicy: (value: FoodPolicy) => void;
  patBonus: boolean;
  setPatBonus: Dispatch<SetStateAction<boolean>>;
  beastmaster: boolean;
  setBeastmaster: Dispatch<SetStateAction<boolean>>;
  activeProfile: CharacterProfile | null;
  applyProfilePet: () => void;
  hasActiveFilters: boolean;
  clearPetFilters: () => void;
  primaryControlsModified: boolean;
  resetPetControls: () => void;
  scenarioIsModified: boolean;
  scenarioLabel: string;
  isSetupOpen: boolean;
  setIsSetupOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const qualitySelectOptions = QUALITY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const sourceSelectOptions = SOURCE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const sortSelectOptions = SORT_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const viewModeOptions = [
    { value: "cards", label: "Cards" },
    { value: "table", label: "Table" },
  ];

  return (
    <div className={styles.toolbarCard}>
      {/* 1. Primary Filter Controls Row */}
      <div className={styles.toolbarRow}>
        <div className={styles.searchWrap}>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm("")}
            placeholder="Search pets, eggs, bosses, sources..."
            ariaLabel="Search pets"
            showShortcutHint={false}
          />
        </div>

        <div className={styles.filterControls}>
          <Select
            value={qualityFilter}
            onChange={(val) => setQualityFilter(val as Quality | "ALL")}
            options={qualitySelectOptions}
            ariaLabel="Filter by quality"
            className={styles.filterSelect}
          />

          <Select
            value={sourceFilter}
            onChange={(val) => setSourceFilter(val as SourceFilter)}
            options={sourceSelectOptions}
            ariaLabel="Filter by source"
            className={styles.filterSelect}
          />

          <div className={styles.sortGroup}>
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as SortKey)}
              options={sortSelectOptions}
              ariaLabel="Sort pets by"
              className={styles.filterSelect}
            />

            <Button
              variant="secondary"
              size="md"
              onClick={() => setSortDesc((prev) => !prev)}
              aria-label={`Toggle sort direction, currently ${sortDesc ? "descending" : "ascending"}`}
              title={`Sort direction: ${sortDesc ? "Descending" : "Ascending"}`}
              icon={<Icon name="sort" size={16} aria-hidden="true" />}
              className={styles.sortDirectionButton}
            >
              {sortDesc ? "Desc" : "Asc"}
            </Button>
          </div>

          {primaryControlsModified && (
            <Button
              variant="ghost"
              size="md"
              onClick={resetPetControls}
              aria-label="Reset filters and sorting"
              icon={<Icon name="undo" size={14} aria-hidden="true" />}
            >
              Reset
            </Button>
          )}
        </div>

        <div className={styles.viewModeWrap}>
          <SegmentedControl
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            options={viewModeOptions}
            ariaLabel="View mode"
          />
        </div>
      </div>

      {/* 2. Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className={styles.activeFilterBar} aria-label="Active filters">
          <span className={styles.activeFilterLabel}>Active filters:</span>
          {searchTerm.trim() !== "" && (
            <button
              type="button"
              className={styles.filterChip}
              onClick={() => setSearchTerm("")}
              aria-label={`Remove search filter: ${searchTerm}`}
            >
              <span>Search: "{searchTerm}"</span>
              <Icon name="close" size={12} aria-hidden="true" />
            </button>
          )}

          {qualityFilter !== "ALL" && (
            <button
              type="button"
              className={styles.filterChip}
              onClick={() => setQualityFilter("ALL")}
              aria-label={`Remove quality filter: ${qualityLabel(qualityFilter)}`}
            >
              <span>Quality: {qualityLabel(qualityFilter)}</span>
              <Icon name="close" size={12} aria-hidden="true" />
            </button>
          )}

          {sourceFilter !== "ALL" && (
            <button
              type="button"
              className={styles.filterChip}
              onClick={() => setSourceFilter("ALL")}
              aria-label={`Remove source filter`}
            >
              <span>Source: {SOURCE_OPTIONS.find((o) => o.value === sourceFilter)?.label || sourceFilter}</span>
              <Icon name="close" size={12} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            className={styles.clearAllButton}
            onClick={clearPetFilters}
          >
            Clear all
          </button>
        </div>
      )}

      {/* 3. Collapsible Pet Setup Simulator */}
      <div className={styles.setupCard}>
        <button
          type="button"
          className={styles.setupHeader}
          onClick={() => setIsSetupOpen((prev) => !prev)}
          aria-expanded={isSetupOpen}
          aria-controls="pet-setup-accordion"
        >
          <div className={styles.setupHeaderTitle}>
            <div className={styles.setupIcon}>
              <Icon name="filter" size={16} aria-hidden="true" />
            </div>
            <div className={styles.setupTitleText}>
              <span className={styles.setupTitleMain}>Pet Simulator Setup</span>
              <span className={styles.setupTitleSub}>
                {scenarioLabel}
                {scenarioIsModified && (
                  <span className={styles.setupTitleModified}>Custom Setup Active</span>
                )}
              </span>
            </div>
          </div>
          <div className={`${styles.setupChevron} ${isSetupOpen ? styles.setupChevronOpen : ""}`}>
            <Icon name="chevronDown" size={18} aria-hidden="true" />
          </div>
        </button>

        <div
          id="pet-setup-accordion"
          aria-hidden={!isSetupOpen}
          inert={!isSetupOpen ? true : undefined}
          className={`${styles.setupAccordionContent} ${isSetupOpen ? styles.setupAccordionOpen : ""}`}
        >
          <div className={styles.setupInnerWrapper}>
            <div className={styles.setupFieldsGrid}>
              <NumberInput
                label="Pet Level"
                value={petLevel}
                min={1}
                max={100}
                onChange={setPetLevel}
              />
              <NumberInput
                label="Pet Mastery"
                value={masteryLevel}
                min={1}
                max={100}
                onChange={setMasteryLevel}
              />
              <NumberInput
                label="Evolution Stage"
                value={evolutionStage}
                min={0}
                max={5}
                onChange={setEvolutionStage}
              />
              <div className={styles.setupField}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Evolution Focus
                </label>
                <Select
                  ariaLabel="Evolution Focus"
                  value={evolutionStat}
                  options={EVOLUTION_STAT_OPTIONS}
                  onChange={(val) => setEvolutionStat(val as StatKey | "all")}
                />
              </div>

              <div className={styles.setupField}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Food Buff
                </label>
                <Select
                  ariaLabel="Food Buff"
                  value={foodPolicy}
                  options={FOOD_OPTIONS}
                  onChange={(val) => setFoodPolicy(val as FoodPolicy)}
                />
              </div>

              <div className={styles.setupField}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Battle Sample Mode
                </label>
                <Select
                  ariaLabel="Battle Sample Mode"
                  value={battleProfitMode}
                  options={BATTLE_PROFIT_OPTIONS}
                  onChange={(val) => setBattleProfitMode(val as BattleProfitMode)}
                />
              </div>
            </div>

            <div className={styles.setupSwitchGroup}>
              <Switch
                checked={patBonus}
                onChange={(e) => setPatBonus(e.target.checked)}
                label="Pat Buff (+5% stats)"
              />
              <Switch
                checked={beastmaster}
                onChange={(e) => setBeastmaster(e.target.checked)}
                label="Beastmaster Class"
              />
            </div>

            <div className={styles.setupActionsRow}>
              <span>Adjusting setup updates pet stats dynamically across all cards and tables.</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {activeProfile?.pet?.species && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="profile" size={14} aria-hidden="true" />}
                    onClick={applyProfilePet}
                  >
                    Use my pet's setup
                  </Button>
                )}
                {scenarioIsModified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="undo" size={14} aria-hidden="true" />}
                    onClick={() => {
                      setPetLevel(100);
                      setMasteryLevel(100);
                      setEvolutionStage(0);
                      setEvolutionStat("all");
                      setPatBonus(false);
                      setBattleProfitMode("withSleep");
                      setFoodPolicy("standard");
                      setBeastmaster(false);
                    }}
                  >
                    Reset setup
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
