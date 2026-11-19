"use client";

import React, { useId, type RefObject, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Plus, Search, X } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import type { CharacterProfile } from "@/lib/profiles";
import type { MythicRecipe } from "../types";
import { formatCraftWindow } from "../utils/mythic-helpers";
import styles from "../page.module.css";

export function MythicHeader({
  activeProfile,
  taxNetPercent,
  mythicCraftTimeSeconds,
  isSearchOpen,
  setIsSearchOpen,
  searchRef,
  searchTriggerRef,
  availableMythics,
  searchTerm,
  setSearchTerm,
  activeRecipeIndex,
  setActiveRecipeIndex,
  activeRecipeOptionId,
  handleRecipeSearchKeyDown,
  addToLab,
  mythicRecipesCount,
}: {
  activeProfile: CharacterProfile | null;
  taxNetPercent: number;
  mythicCraftTimeSeconds: number;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  searchRef: RefObject<HTMLDivElement | null>;
  searchTriggerRef: RefObject<HTMLButtonElement | null>;
  availableMythics: MythicRecipe[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeRecipeIndex: number;
  setActiveRecipeIndex: (index: number) => void;
  activeRecipeOptionId?: string;
  handleRecipeSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  addToLab: (recipe: MythicRecipe) => void;
  mythicRecipesCount: number;
}) {
  const searchDropdownId = useId();
  const searchListboxId = `${searchDropdownId}-results`;

  return (
    <div className={styles.header}>
      <div className={styles.headerCopy}>
        <div className={styles.headerEyebrow}>Level 90 Recipe Planner</div>
        <h1 className={styles.headerTitle} id="mythic-lab-page-title">
          <ZenithIcon name="spark" size={24} style={{ color: "var(--text-accent)" }} /> Mythic Lab
        </h1>
        <p className={styles.headerSubtitle}>
          Pin level 90 recipes, enter your copy costs and uses left, then compare market and vendor
          paths before crafting.
        </p>
        <div className={styles.headerChips} aria-label="Current mythic lab context">
          <span>
            {activeProfile
              ? `${activeProfile.name || "Active profile"} synced`
              : "Global fallback"}
          </span>
          <span>{taxNetPercent}% market net</span>
          <span>{formatCraftWindow(mythicCraftTimeSeconds)} per craft</span>
        </div>
      </div>

      <div className={styles.workbenchActions} ref={searchRef}>
        <button
          type="button"
          className={styles.searchTrigger}
          aria-expanded={isSearchOpen}
          aria-controls={searchDropdownId}
          aria-haspopup="listbox"
          onClick={() => setIsSearchOpen((open) => !open)}
          ref={searchTriggerRef}
        >
          <Plus size={16} /> Add Project
        </button>
        {isSearchOpen && (
          <div
            className={`${styles.searchDropdown} custom-scrollbar`}
            id={searchDropdownId}
            aria-label="Add mythic recipe project"
          >
            <div className={styles.dropdownHead}>
              <div>
                <span>Add Mythic Recipe</span>
                <strong>{availableMythics.length.toLocaleString()} available</strong>
              </div>
              <button
                type="button"
                className={styles.dropdownClose}
                aria-label="Close mythic recipe search"
                onClick={() => {
                  setIsSearchOpen(false);
                  searchTriggerRef.current?.focus();
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div className={styles.dropdownInput}>
              <Search size={14} aria-hidden="true" />
              <input
                autoFocus
                aria-activedescendant={activeRecipeOptionId}
                aria-autocomplete="list"
                aria-controls={searchListboxId}
                aria-expanded={isSearchOpen}
                aria-label="Search mythic recipe, result, or material"
                placeholder="Search recipe, result, material..."
                role="combobox"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleRecipeSearchKeyDown}
                spellCheck={false}
              />
              {searchTerm.trim().length > 0 && (
                <button
                  type="button"
                  className={styles.searchClear}
                  aria-label="Clear mythic recipe search"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div
              className={styles.dropdownResults}
              id={searchListboxId}
              role="listbox"
              aria-label="Available mythic recipes"
            >
              {availableMythics.length > 0 ? (
                availableMythics.map((recipe, index) => {
                  const optionId = `mythic-recipe-option-${recipe.resultName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")}`;
                  const isActive = index === activeRecipeIndex;
                  return (
                    <button
                      key={recipe.resultName}
                      id={optionId}
                      type="button"
                      className={`${styles.resultItem} ${isActive ? styles.active : ""}`}
                      aria-label={`Add ${recipe.resultName}. Level ${recipe.level}, ${recipe.maxUses} uses. Recipe: ${recipe.recipeName}`}
                      aria-selected={isActive}
                      onClick={() => addToLab(recipe)}
                      onMouseEnter={() => setActiveRecipeIndex(index)}
                      role="option"
                      tabIndex={-1}
                    >
                      <span>{recipe.resultName}</span>
                      <small>
                        {recipe.recipeName} - Lvl {recipe.level} - {recipe.maxUses} uses
                      </small>
                    </button>
                  );
                })
              ) : (
                <div className={styles.noResults}>
                  {mythicRecipesCount === 0
                    ? "Loading item database..."
                    : "No matching mythic recipes"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
