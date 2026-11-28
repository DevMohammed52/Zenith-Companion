"use client";

import {
  Badge,
  Banner,
  Button,
  Card,
  Icon,
  Select,
  type BadgeVariant,
  type ItemRarity,
} from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import QualityText from "@/components/QualityText";
import { QUALITY_OPTIONS, SORT_OPTIONS, type ForgeState } from "../../types";
import styles from "../../Forge.module.css";

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

  const qualitySelectOptions = QUALITY_OPTIONS.map((q) => ({
    value: q,
    label: q === "ALL" ? "All tiers" : q.charAt(0) + q.slice(1).toLowerCase(),
    rarity: q === "ALL" ? undefined : (q.toLowerCase() as ItemRarity),
  }));

  const sortSelectOptions = SORT_OPTIONS.map((opt) => ({
    value: opt.id,
    label: opt.label,
  }));

  return (
    <Card padding="md" overflowVisible aria-label="Forge recipe builder">
      <div className={styles.sectionTopRow} style={{ alignItems: "center", marginBottom: "0.85rem" }}>
        <div>
          <span className={styles.kicker}>
            <Icon name="scroll" size="xs" aria-hidden="true" /> Add saved recipe
          </span>
          <h2 className={styles.sectionTitle}>Session setup</h2>
        </div>

        <div className={styles.actionsCluster}>
          <Badge variant={warningCount > 0 ? "warning" : "neutral"} size="sm">
            {planHealthLabel}
          </Badge>
          {draft.lines.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Icon name="trash" size="xs" aria-hidden="true" />}
              aria-label="Clear all recipes from forge plan"
              onClick={clearPlan}
            >
              Clear plan
            </Button>
          )}
        </div>
      </div>

      {clearedDraft && (
        <div style={{ marginBottom: "0.85rem" }}>
          <Banner
            variant="info"
            action={{ label: "Undo", onClick: undoClearPlan }}
          >
            Forge plan cleared.
          </Banner>
        </div>
      )}

      <div className={styles.builderRow}>
        <div className={styles.comboboxWrapper} ref={pickerRef}>
          <label htmlFor="forge-recipe-search" className={styles.fieldLabel}>
            Recipe
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                display: "inline-flex",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            >
              <Icon name="search" size="sm" aria-hidden="true" />
            </span>
            <input
              id="forge-recipe-search"
              ref={inputRef}
              role="combobox"
              aria-label="Forge recipe"
              aria-expanded={pickerOpen}
              aria-controls={pickerOpen ? "forge-recipe-options" : undefined}
              aria-activedescendant={
                pickerOpen && visibleRecipeOptions[activeOptionIndex]
                  ? `forge-recipe-option-${activeOptionIndex}`
                  : undefined
              }
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
              style={{
                width: "100%",
                minHeight: "44px",
                padding: "0.55rem 2.25rem 0.55rem 2.2rem",
                background: "var(--bg-panel)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                fontSize: "0.9rem",
              }}
            />
            {recipeSearch ? (
              <button
                type="button"
                aria-label="Clear recipe search"
                onClick={() => {
                  setRecipeSearch("");
                  setSelectedRecipeName("");
                  setPickerOpen(true);
                  inputRef.current?.focus();
                }}
                style={{
                  position: "absolute",
                  right: "0.35rem",
                  display: "grid",
                  placeItems: "center",
                  width: "32px",
                  height: "32px",
                  border: 0,
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <Icon name="close" size="sm" aria-hidden="true" />
              </button>
            ) : (
              <span
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  display: "inline-flex",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              >
                <Icon name="chevronDown" size="sm" aria-hidden="true" />
              </span>
            )}
          </div>

          {pickerOpen && (
            <div className={styles.comboboxMenu} id="forge-recipe-options" role="listbox">
              {visibleRecipeOptions.length === 0 ? (
                <div style={{ padding: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No matching forge recipes
                </div>
              ) : (
                visibleRecipeOptions.slice(0, 80).map((recipe, index) => (
                  <button
                    type="button"
                    id={`forge-recipe-option-${index}`}
                    key={recipe.recipeName}
                    role="option"
                    aria-selected={selectedRecipeName === recipe.recipeName}
                    className={`${styles.comboboxOption} ${index === activeOptionIndex ? styles.comboboxOptionActive : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveOptionIndex(index)}
                    onClick={() => {
                      chooseRecipe(recipe);
                      addRecipe(recipe.recipeName);
                    }}
                  >
                    <GameImage
                      src={recipe.resultImageUrl || recipe.imageUrl}
                      alt=""
                      width={34}
                      height={34}
                    />
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <QualityText value={recipe.quality}>{recipe.resultName}</QualityText>
                      <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        {recipe.quality} | Lv.{recipe.levelRequired} | {recipe.materials.length} mats
                        {recipe.forgeExpEach > 0 ? ` | +${recipe.forgeExpEach.toLocaleString()} XP` : ""}
                      </small>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.comboboxWrapper}>
          <span className={styles.fieldLabel}>Quality</span>
          <Select
            options={qualitySelectOptions}
            value={qualityFilter}
            onChange={(value) => setQualityFilter(value as typeof qualityFilter)}
            ariaLabel="Quality"
          />
        </div>

        <div className={styles.comboboxWrapper}>
          <span className={styles.fieldLabel}>Sort</span>
          <Select
            options={sortSelectOptions}
            value={sortBy}
            onChange={(value) => setSortBy(value as typeof sortBy)}
            ariaLabel="Sort"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={!selectedRecipe}
          icon={<Icon name="plus" size="sm" aria-hidden="true" />}
          onClick={() => addRecipe()}
        >
          Add recipe
        </Button>
      </div>

      {selectedRecipe && (
        <div
          className={styles.statStrip}
          style={{ marginTop: "0.85rem", alignItems: "center" }}
          aria-live="polite"
        >
          <div className={styles.statStripCell}>
            <button
              type="button"
              className={styles.itemTitleBtn}
              aria-label={`Open result item details for ${selectedRecipe.resultName}`}
              onMouseEnter={() => prefetchItem(selectedRecipe.resultName)}
              onClick={() => openItemByName(selectedRecipe.resultName)}
            >
              <GameImage
                src={selectedRecipe.resultImageUrl || selectedRecipe.imageUrl}
                alt=""
                width={32}
                height={32}
              />
              <QualityText value={selectedRecipe.quality}>{selectedRecipe.resultName}</QualityText>
            </button>
            <div className={styles.matCellMeta}>
              <Badge variant={selectedRecipe.quality.toLowerCase() as BadgeVariant} size="sm">
                {selectedRecipe.quality}
              </Badge>
              <span>Lv.{selectedRecipe.levelRequired}</span>
              <span>{selectedRecipe.resultType || "Forge result"}</span>
            </div>
          </div>

          <div className={styles.statStripCell}>
            <span className={styles.statLabel}>Uses &amp; Mats</span>
            <strong className={styles.statValue}>
              {selectedRecipe.maxUses.toLocaleString()} uses | {selectedRecipe.materials.length.toLocaleString()} mats
            </strong>
          </div>

          {selectedRecipe.forgeExpEach > 0 && (
            <div className={styles.statStripCell}>
              <span className={styles.statLabel}>EXP per Craft</span>
              <strong className={`${styles.statValue} ${styles.statValueGood}`}>
                +{selectedRecipe.forgeExpEach.toLocaleString()} Forge
                {selectedRecipe.strengthExpEach > 0 ? ` | +${selectedRecipe.strengthExpEach.toLocaleString()} Str` : ""}
              </strong>
            </div>
          )}

          <div className={styles.statStripCell}>
            <span className={styles.statLabel}>Source</span>
            <span className={styles.statSub}>{selectedRecipe.sourceSummary}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
