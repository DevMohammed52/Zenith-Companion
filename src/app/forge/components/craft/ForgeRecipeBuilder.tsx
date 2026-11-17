"use client";

import { ChevronDown, Plus, ReceiptText, Search, Trash2, X } from "lucide-react";
import QualityText from "@/components/QualityText";
import { getTrustedGameImageUrl } from "@/lib/trusted-image";
import { QUALITY_OPTIONS, SORT_OPTIONS, type ForgeState } from "../../types";
import { CustomPicker } from "./ForgeControls";

export function ForgeRecipeBuilder({ state }: { state: ForgeState }) {
  const {
    draft,
    pickerOpen,
    setPickerOpen,
    pickerRef,
    inputRef,
    recipeSearch,
    updateRecipeSearch,
    setRecipeSearch,
    handlePickerKeyDown,
    loading,
    visibleRecipeOptions,
    activeOptionIndex,
    setActiveOptionIndex,
    selectedRecipeName,
    setSelectedRecipeName,
    chooseRecipe,
    qualityFilter,
    setQualityFilter,
    openFilterPicker,
    setOpenFilterPicker,
    sortBy,
    setSortBy,
    selectedRecipe,
    addRecipe,
    clearPlan,
    undoClearPlan,
    clearedDraft,
    warningCount,
    planHealthLabel,
    prefetchItem,
    openItemByName,
  } = state;

  return (
    <section className="forge-builder" aria-label="Forge recipe builder">
      <div className="builder-topline">
        <div>
          <p className="panel-kicker"><ReceiptText size={15} /> Add saved recipe</p>
          <h2>Session setup</h2>
        </div>
        <div className="builder-actions">
          <span className={`forge-builder-badge ${warningCount > 0 ? "warn" : ""}`}>{planHealthLabel}</span>
          {draft.lines.length > 0 && (
            <button type="button" className="ghost-button danger" aria-label="Clear all recipes from forge plan" onClick={clearPlan}>
              <Trash2 size={15} /> Clear plan
            </button>
          )}
        </div>
      </div>

      {clearedDraft && (
        <div className="forge-undo-toast" role="status" aria-live="polite">
          <span>Forge plan cleared.</span>
          <button type="button" onClick={undoClearPlan}>Undo</button>
        </div>
      )}

      <div className={`builder-grid ${pickerOpen ? "picker-open" : ""}`}>
        <div className="recipe-combobox" ref={pickerRef}>
          <label htmlFor="forge-recipe-search">Recipe</label>
          <div className={`combo-shell ${pickerOpen ? "open" : ""}`}>
            <Search size={17} aria-hidden="true" />
            <input
              id="forge-recipe-search"
              ref={inputRef}
              role="combobox"
              aria-label="Forge recipe"
              aria-expanded={pickerOpen}
              aria-controls={pickerOpen ? "forge-recipe-options" : undefined}
              aria-activedescendant={pickerOpen && visibleRecipeOptions[activeOptionIndex] ? `forge-recipe-option-${activeOptionIndex}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
              value={recipeSearch}
              onChange={(event) => updateRecipeSearch(event.target.value)}
              onFocus={() => {
                setPickerOpen(true);
                setOpenFilterPicker("");
              }}
              onKeyDown={handlePickerKeyDown}
              placeholder={loading ? "Loading forge recipes..." : "Search result, recipe, material..."}
            />
            {recipeSearch ? (
              <button
                type="button"
                aria-label="Clear recipe search"
                className="icon-clear"
                onClick={() => {
                  setRecipeSearch("");
                  setSelectedRecipeName("");
                  setPickerOpen(true);
                  inputRef.current?.focus();
                }}
              >
                <X size={15} />
              </button>
            ) : (
              <ChevronDown size={16} className="combo-chevron" aria-hidden="true" />
            )}
          </div>
          {pickerOpen && (
            <div className="combo-menu" id="forge-recipe-options" role="listbox">
              {visibleRecipeOptions.length === 0 ? (
                <div className="combo-empty">No matching forge recipes</div>
              ) : visibleRecipeOptions.slice(0, 80).map((recipe, index) => (
                <button
                  type="button"
                  id={`forge-recipe-option-${index}`}
                  key={recipe.recipeName}
                  role="option"
                  aria-selected={selectedRecipeName === recipe.recipeName}
                  className={`combo-option ${index === activeOptionIndex ? "active" : ""} ${selectedRecipeName === recipe.recipeName ? "selected" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveOptionIndex(index)}
                  onClick={() => {
                    chooseRecipe(recipe);
                    addRecipe(recipe.recipeName);
                  }}
                >
                  <img
                    src={getTrustedGameImageUrl(recipe.resultImageUrl || recipe.imageUrl) || "/favicon.ico"}
                    alt=""
                    width={42}
                    height={42}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                    }}
                  />
                  <span>
                    <strong>{recipe.resultName}</strong>
                    <small><QualityText value={recipe.quality}>{recipe.quality}</QualityText> | Lv.{recipe.levelRequired} | {recipe.materials.length} materials</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <CustomPicker
          label="Quality"
          options={QUALITY_OPTIONS.map((quality) => ({
            id: quality,
            label: quality === "ALL" ? "All" : quality,
            qualityTone: quality === "ALL" ? undefined : quality,
          }))}
          value={qualityFilter}
          onChange={(value) => setQualityFilter(value as typeof qualityFilter)}
          pickerKey="quality"
          openPicker={openFilterPicker}
          setOpenPicker={setOpenFilterPicker}
          onPointerToggle={() => setPickerOpen(false)}
        />
        <CustomPicker
          label="Sort"
          options={SORT_OPTIONS.map((option) => ({ id: option.id, label: option.label }))}
          value={sortBy}
          onChange={(value) => setSortBy(value as typeof sortBy)}
          pickerKey="sort"
          openPicker={openFilterPicker}
          setOpenPicker={setOpenFilterPicker}
          onPointerToggle={() => setPickerOpen(false)}
        />
        <button type="button" className="primary-button" disabled={!selectedRecipe} onClick={() => addRecipe()}>
          <Plus size={16} /> Add recipe
        </button>
      </div>

      {selectedRecipe && (
        <div className="selected-recipe-card" aria-live="polite">
          <button
            type="button"
            className="selected-recipe-title"
            aria-label={`Open result item details for ${selectedRecipe.resultName}`}
            onMouseEnter={() => prefetchItem(selectedRecipe.resultName)}
            onClick={() => openItemByName(selectedRecipe.resultName)}
          >
            <img
              src={getTrustedGameImageUrl(selectedRecipe.resultImageUrl || selectedRecipe.imageUrl) || "/favicon.ico"}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
              }}
            />
            <span>
              <small>Ready to add</small>
              <strong>{selectedRecipe.resultName}</strong>
              <em><QualityText value={selectedRecipe.quality}>{selectedRecipe.quality}</QualityText> | Lv.{selectedRecipe.levelRequired} | {selectedRecipe.resultType || "Forge result"}</em>
            </span>
          </button>
          <div className="selected-recipe-meta" aria-label="Selected recipe summary">
            <span>{selectedRecipe.maxUses.toLocaleString()} uses per copy</span>
            <span>{selectedRecipe.materials.length.toLocaleString()} materials</span>
            <span>{selectedRecipe.sourceSummary}</span>
          </div>
        </div>
      )}
    </section>
  );
}
