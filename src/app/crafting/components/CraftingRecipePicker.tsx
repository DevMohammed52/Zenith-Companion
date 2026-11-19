"use client";

import { Check, ChevronDown, Plus, Search, Sparkles, X } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { UseCraftingPageStateReturn } from "../types";

export default function CraftingRecipePicker({
    state,
}: {
    state: Pick<
        UseCraftingPageStateReturn,
        | "recipeOptions"
        | "filteredRecipeOptions"
        | "selectedRecipe"
        | "adding"
        | "recipeSearch"
        | "pickerOpen"
        | "activeRecipeIndex"
        | "queue"
        | "pickerRef"
        | "inputRef"
        | "setPickerOpen"
        | "setActiveRecipeIndex"
        | "chooseRecipe"
        | "clearRecipePicker"
        | "updateRecipeSearch"
        | "handleRecipeKeyDown"
        | "addRecipe"
    >;
}) {
    const {
        recipeOptions,
        filteredRecipeOptions,
        selectedRecipe,
        adding,
        recipeSearch,
        pickerOpen,
        activeRecipeIndex,
        queue,
        pickerRef,
        inputRef,
        setPickerOpen,
        setActiveRecipeIndex,
        chooseRecipe,
        clearRecipePicker,
        updateRecipeSearch,
        handleRecipeKeyDown,
        addRecipe,
    } = state;

    return (
        <div className="table-container craft-panel craft-add-panel">
            <h2 className="craft-panel-title">
                <span><Sparkles size={14} /> Add Recipe</span>
                <em>{recipeOptions.length.toLocaleString()} available</em>
            </h2>
            <div className="craft-picker">
                <div className="recipe-combobox" ref={pickerRef}>
                    <div className={`recipe-combobox-shell ${pickerOpen ? "open" : ""}`}>
                        <Search size={16} className="recipe-combobox-icon" />
                        <input
                            ref={inputRef}
                            role="combobox"
                            aria-label="Recipe to add"
                            aria-autocomplete="list"
                            aria-expanded={pickerOpen}
                            aria-controls={pickerOpen ? "craft-recipe-options" : undefined}
                            aria-haspopup="listbox"
                            aria-activedescendant={pickerOpen && filteredRecipeOptions[activeRecipeIndex] ? `craft-recipe-option-${activeRecipeIndex}` : undefined}
                            autoComplete="off"
                            value={recipeSearch}
                            onChange={(event) => updateRecipeSearch(event.target.value)}
                            onFocus={() => setPickerOpen(true)}
                            onKeyDown={handleRecipeKeyDown}
                            placeholder="Search recipe, vial, material..."
                        />
                        {recipeSearch ? (
                            <button
                                type="button"
                                className="recipe-combobox-clear"
                                onClick={clearRecipePicker}
                                aria-label="Clear selected recipe"
                            >
                                <X size={14} />
                            </button>
                        ) : (
                            <ChevronDown size={16} className="recipe-combobox-chevron" />
                        )}
                    </div>
                    {pickerOpen && (
                        <div className="recipe-combobox-menu" id="craft-recipe-options" role="listbox">
                            {filteredRecipeOptions.length === 0 ? (
                                <div className="recipe-option-empty">No matching recipes</div>
                            ) : (
                                filteredRecipeOptions.map((option, index) => {
                                    const isSelected = adding === option.name;
                                    const queuedQty = queue[option.name] || 0;
                                    return (
                                        <button
                                            type="button"
                                            id={`craft-recipe-option-${index}`}
                                            key={option.name}
                                            role="option"
                                            aria-selected={isSelected}
                                            tabIndex={-1}
                                            onMouseDown={(event) => event.preventDefault()}
                                            onMouseEnter={() => setActiveRecipeIndex(index)}
                                            onClick={() => chooseRecipe(option.name)}
                                            className={`recipe-option-row ${index === activeRecipeIndex ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
                                        >
                                            <span className="recipe-option-main">
                                                <span className="recipe-option-title">{option.name}</span>
                                                <span className="recipe-option-meta">
                                                    Lvl {option.recipe.level} - {option.recipe.vial} - {option.materialNames.length} inputs
                                                </span>
                                            </span>
                                            <span className="recipe-option-side">
                                                {queuedQty > 0 && <span className="recipe-option-queued">{queuedQty} queued</span>}
                                                {isSelected ? (
                                                    <Check size={15} className="recipe-option-check" />
                                                ) : (
                                                    <span className="recipe-option-time">{formatDuration(option.recipe.time)}</span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => addRecipe(adding)}
                    disabled={!adding}
                    aria-label={selectedRecipe ? `Add ${selectedRecipe.name} to crafting queue` : "Add selected recipe to crafting queue"}
                    className="craft-add-button"
                >
                    <Plus size={16} /> Add recipe
                </button>
            </div>
            {selectedRecipe && (
                <div className="craft-selected-recipe" role="status">
                    <span>Selected</span>
                    <strong>{selectedRecipe.name}</strong>
                    <em>Lvl {selectedRecipe.recipe.level} - {formatDuration(selectedRecipe.recipe.time)} each - {selectedRecipe.materialNames.length} inputs</em>
                </div>
            )}
        </div>
    );
}
