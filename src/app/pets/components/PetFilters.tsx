"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronsUp,
  Database,
  HeartPulse,
  PawPrint,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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
import { PetNumberField } from "./PetNumberField";
import { PetSelect } from "./PetSelect";

export function PetFilters({
  hasActiveFilters,
  activeFilterCount,
  visibleCount,
  primaryControlsModified,
  resetPetControls,
  searchTerm,
  setSearchTerm,
  isCompactViewport,
  qualityFilter,
  setQualityFilter,
  sourceFilter,
  setSourceFilter,
  sortBy,
  setSortBy,
  sortDesc,
  setSortDesc,
  openPetSelect,
  setOpenPetSelect,
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
  ownedPetCount,
}: {
  hasActiveFilters: boolean;
  activeFilterCount: number;
  visibleCount: number;
  primaryControlsModified: boolean;
  resetPetControls: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isCompactViewport: boolean;
  qualityFilter: Quality | "ALL";
  setQualityFilter: (value: Quality | "ALL") => void;
  sourceFilter: SourceFilter;
  setSourceFilter: (value: SourceFilter) => void;
  sortBy: SortKey;
  setSortBy: (value: SortKey) => void;
  sortDesc: boolean;
  setSortDesc: Dispatch<SetStateAction<boolean>>;
  openPetSelect: string | null;
  setOpenPetSelect: (value: string | null) => void;
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
  ownedPetCount: number;
}) {
  return (
    <>
      <section className="pets-toolbar">
        <div className="pet-toolbar-title">
          <span>
            <SlidersHorizontal size={15} aria-hidden="true" /> Filters
          </span>
          <small>
            {hasActiveFilters
              ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
              : `${visibleCount.toLocaleString()} visible`}
          </small>
          <button
            type="button"
            onClick={resetPetControls}
            disabled={!primaryControlsModified}
            aria-label="Reset pet filters and sorting"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </button>
        </div>
        <label className="pet-search">
          <Search size={18} />
          <input
            aria-label="Search pets"
            value={searchTerm}
            placeholder="Search pets, eggs, bosses, sources..."
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <details className="pet-filter-panel" open={!isCompactViewport ? true : undefined}>
          <summary>
            <span>
              <SlidersHorizontal size={15} aria-hidden="true" /> Pet filters
            </span>
            <small>{primaryControlsModified ? "Customized" : "Default"}</small>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className="pet-filter-grid">
            <PetSelect
              label="Quality"
              value={qualityFilter}
              options={QUALITY_OPTIONS}
              onChange={setQualityFilter}
              open={openPetSelect === "quality"}
              onOpenChange={(open) => setOpenPetSelect(open ? "quality" : null)}
            />
            <PetSelect
              label="Source"
              value={sourceFilter}
              options={SOURCE_OPTIONS}
              onChange={setSourceFilter}
              open={openPetSelect === "source"}
              onOpenChange={(open) => setOpenPetSelect(open ? "source" : null)}
            />
            <PetSelect
              label="Sort"
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={setSortBy}
              open={openPetSelect === "sort"}
              onOpenChange={(open) => setOpenPetSelect(open ? "sort" : null)}
            />
            <button
              type="button"
              className="pet-icon-button"
              aria-pressed={sortDesc}
              aria-label={`Toggle sort direction, currently ${sortDesc ? "descending" : "ascending"}`}
              onClick={() => setSortDesc((value) => !value)}
              title="Toggle sort direction"
            >
              <ArrowDownUp size={17} />
              <span>{sortDesc ? "Desc" : "Asc"}</span>
            </button>
          </div>
        </details>
        <div className="pet-segment" aria-label="View mode">
          <button
            type="button"
            className={viewMode === "cards" ? "active" : ""}
            aria-pressed={viewMode === "cards"}
            onClick={() => setViewMode("cards")}
          >
            Cards
          </button>
          <button
            type="button"
            className={viewMode === "table" ? "active" : ""}
            aria-pressed={viewMode === "table"}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
        </div>
      </section>

      <details className="pets-calculator">
        <summary className="calculator-title">
          <ChevronsUp size={18} />
          <div>
            <strong>Pet setup</strong>
            <span>
              Lv {petLevel} / Mastery {masteryLevel} / Evo {evolutionStage} /{" "}
              {battleProfitMode === "noSleep" ? "No sleep" : "With sleep"}
            </span>
          </div>
        </summary>
        <div className="calculator-fields">
          <PetNumberField label="Pet Level" value={petLevel} min={1} max={100} onChange={setPetLevel} />
          <PetNumberField label="Pet Mastery" value={masteryLevel} min={1} max={100} onChange={setMasteryLevel} />
          <PetNumberField label="Evolution" value={evolutionStage} min={0} max={5} onChange={setEvolutionStage} />
          <PetSelect
            label="Evolution stat"
            value={evolutionStat}
            options={EVOLUTION_STAT_OPTIONS}
            onChange={setEvolutionStat}
            open={openPetSelect === "evolution"}
            onOpenChange={(open) => setOpenPetSelect(open ? "evolution" : null)}
          />
          <PetSelect
            label="Battle sample mode"
            value={battleProfitMode}
            options={BATTLE_PROFIT_OPTIONS}
            onChange={setBattleProfitMode}
            open={openPetSelect === "profit"}
            onOpenChange={(open) => setOpenPetSelect(open ? "profit" : null)}
          />
          <PetSelect
            label="Food"
            value={foodPolicy}
            options={FOOD_OPTIONS}
            onChange={setFoodPolicy}
            open={openPetSelect === "food"}
            onOpenChange={(open) => setOpenPetSelect(open ? "food" : null)}
          />
          <button
            className={`pet-toggle ${patBonus ? "active" : ""}`}
            aria-label="Toggle pet pat bonus"
            aria-pressed={patBonus}
            onClick={() => setPatBonus((value) => !value)}
          >
            <HeartPulse size={16} />
            Pat +5%
          </button>
          <button
            className={`pet-toggle ${beastmaster ? "active" : ""}`}
            aria-label="Toggle Beastmaster context"
            aria-pressed={beastmaster}
            onClick={() => setBeastmaster((value) => !value)}
          >
            <PawPrint size={16} />
            Beastmaster
          </button>
          {activeProfile?.pet?.species ? (
            <button className="pet-toggle" onClick={applyProfilePet}>
              <Database size={16} />
              Use profile pet
            </button>
          ) : null}
          {ownedPetCount > 0 ? (
            <button
              className={`pet-toggle ${sourceFilter === "OWNED" ? "active" : ""}`}
              aria-label="Show owned pets from the active profile"
              aria-pressed={sourceFilter === "OWNED"}
              onClick={() => {
                setSourceFilter("OWNED");
                setSearchTerm("");
              }}
            >
              <PawPrint size={16} />
              Owned pets
            </button>
          ) : null}
        </div>
        <div className="pet-effect-note">
          Stats update from this setup. Market values and battle notes stay separate.
        </div>
      </details>
    </>
  );
}
