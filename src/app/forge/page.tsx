"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Hammer,
  Layers,
  Package,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { useItemModal } from "@/context/ItemModalContext";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import { formatGold } from "@/lib/format";
import {
  buildForgeRecipeOptions,
  calculateForgePlanner,
  FORGE_PLANNER_STORAGE_KEY,
  sanitizeForgeOwnedMaterials,
  sanitizeForgePlannerLines,
  sanitizeForgeQuantity,
  type ForgePlannerLine,
  type ForgePlannerOwnedMaterials,
  type ForgeQuality,
  type ForgeRecipeOption,
} from "@/lib/forge-planner";

type PlannerDraft = {
  lines: Array<Omit<ForgePlannerLine, "quantity" | "ownedRecipes"> & { quantity: number | ""; ownedRecipes: number | "" }>;
  ownedMaterials: ForgePlannerOwnedMaterials;
};

type QtyField = "quantity" | "ownedRecipes";

const QUALITY_OPTIONS = ["ALL", "MYTHIC", "LEGENDARY", "EPIC", "PREMIUM", "REFINED"] as const;
const SORT_OPTIONS = [
  { id: "value", label: "Value" },
  { id: "level", label: "Level" },
  { id: "name", label: "Name" },
  { id: "materials", label: "Materials" },
] as const;

export default function ForgePage() {
  const { allItemsDb, marketData, loading } = useData();
  const { openItemByName, prefetchItem } = useItemModal();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<PlannerDraft>({ lines: [], ownedMaterials: {} });
  const [recipeSearch, setRecipeSearch] = useState("");
  const [qualityFilter, setQualityFilter] = useState<(typeof QUALITY_OPTIONS)[number]>("ALL");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["id"]>("value");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openFilterPicker, setOpenFilterPicker] = useState<"quality" | "sort" | "">("");
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const [selectedRecipeName, setSelectedRecipeName] = useState("");
  const [focusedEntryKey, setFocusedEntryKey] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [clearedDraft, setClearedDraft] = useState<PlannerDraft | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recipes = useMemo(() => buildForgeRecipeOptions(allItemsDb), [allItemsDb]);
  const recipesByName = useMemo(() => new Map(recipes.map((recipe) => [recipe.recipeName, recipe])), [recipes]);

  const visibleRecipeOptions = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    const rows = recipes.filter((recipe) => {
      if (qualityFilter !== "ALL" && recipe.quality !== qualityFilter) return false;
      return q ? recipe.searchText.includes(q) : true;
    });
    return [...rows].sort((a, b) => {
      if (sortBy === "level") return b.levelRequired - a.levelRequired || a.resultName.localeCompare(b.resultName);
      if (sortBy === "name") return a.resultName.localeCompare(b.resultName);
      if (sortBy === "materials") return b.materials.length - a.materials.length || a.resultName.localeCompare(b.resultName);
      return getRecipeDisplayValue(b) - getRecipeDisplayValue(a) || b.levelRequired - a.levelRequired || a.resultName.localeCompare(b.resultName);
    });
  }, [qualityFilter, recipeSearch, recipes, sortBy]);

  const selectedRecipe = selectedRecipeName ? recipesByName.get(selectedRecipeName) || null : null;
  const profileBarteringBoost = activeProfile ? getProfileBarteringBoost(activeProfile) : Number(preferences.barteringBoost || 0);

  const plan = useMemo(
    () => calculateForgePlanner(
      draft.lines,
      draft.ownedMaterials,
      recipes,
      marketData,
      allItemsDb,
      {
        customPrices: preferences.customPrices,
        membership: preferences.membership,
        barteringBoost: profileBarteringBoost,
      },
    ),
    [allItemsDb, draft.lines, draft.ownedMaterials, marketData, preferences.customPrices, preferences.membership, profileBarteringBoost, recipes],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FORGE_PLANNER_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<PlannerDraft>;
      setDraft({
        lines: sanitizeForgePlannerLines(parsed.lines),
        ownedMaterials: sanitizeForgeOwnedMaterials(parsed.ownedMaterials),
      });
    } catch {
      setDraft({ lines: [], ownedMaterials: {} });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FORGE_PLANNER_STORAGE_KEY, JSON.stringify({
      lines: sanitizeForgePlannerLines(draft.lines),
      ownedMaterials: sanitizeForgeOwnedMaterials(draft.ownedMaterials),
    }));
  }, [draft]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveOptionIndex(0);
  }, [qualityFilter, recipeSearch, sortBy]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!openFilterPicker) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilterPicker("");
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest(".filter-picker")) {
        setOpenFilterPicker("");
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOnOutsidePointer, true);
    };
  }, [openFilterPicker]);

  const chooseRecipe = (recipe: ForgeRecipeOption) => {
    setSelectedRecipeName(recipe.recipeName);
    setRecipeSearch(recipe.resultName);
    setPickerOpen(false);
  };

  const addRecipe = (recipeName = selectedRecipeName) => {
    const recipe = recipesByName.get(recipeName);
    if (!recipe) return;
    const wasEmpty = draft.lines.length === 0;
    setDraft((current) => {
      const index = current.lines.findIndex((line) => line.recipeName === recipe.recipeName);
      if (index >= 0) {
        const next = [...current.lines];
        next[index] = { ...next[index], quantity: Math.min(999_999, Number(next[index].quantity || 0) + 1) };
        return { ...current, lines: next };
      }
      return {
        ...current,
        lines: [...current.lines, { recipeName: recipe.recipeName, quantity: 1, ownedRecipes: 1 }],
      };
    });
    setFocusedEntryKey(recipe.recipeName);
    setSelectedRecipeName("");
    setRecipeSearch("");
    setClearedDraft(null);
    setStatusMessage(`Added ${recipe.resultName} to the forge plan.`);
    if (wasEmpty) {
      window.setTimeout(() => {
        document.getElementById("forge-plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  const updateLine = (recipeName: string, field: QtyField, value: string) => {
    const clean = sanitizeForgeQuantity(value);
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => line.recipeName === recipeName
        ? { ...line, [field]: clean === "" ? "" : Number(clean || 0) }
        : line),
    }));
  };

  const removeLine = (recipeName: string) => {
    const recipe = recipesByName.get(recipeName);
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.recipeName !== recipeName),
    }));
    if (focusedEntryKey === recipeName) setFocusedEntryKey("");
    setStatusMessage(`Removed ${recipe?.resultName || recipeName} from the forge plan.`);
  };

  const setOwnedMaterial = (name: string, value: string) => {
    const clean = sanitizeForgeQuantity(value);
    setDraft((current) => {
      const next = { ...current.ownedMaterials };
      if (clean === "" || Number(clean || 0) <= 0) delete next[name];
      else next[name] = Number(clean);
      return { ...current, ownedMaterials: next };
    });
  };

  const clearPlan = () => {
    const previousDraft = {
      lines: sanitizeForgePlannerLines(draft.lines),
      ownedMaterials: sanitizeForgeOwnedMaterials(draft.ownedMaterials),
    };
    if (previousDraft.lines.length === 0 && Object.keys(previousDraft.ownedMaterials).length === 0) return;
    setDraft({ lines: [], ownedMaterials: {} });
    setFocusedEntryKey("");
    setClearedDraft(previousDraft);
    setStatusMessage("Forge plan cleared.");
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setClearedDraft(null), 9000);
  };

  const undoClearPlan = () => {
    if (!clearedDraft) return;
    setDraft(clearedDraft);
    setFocusedEntryKey(clearedDraft.lines[0]?.recipeName || "");
    setStatusMessage("Forge plan restored.");
    setClearedDraft(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const handlePickerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPickerOpen(true);
      setActiveOptionIndex((index) => Math.min(index + 1, Math.max(visibleRecipeOptions.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setPickerOpen(true);
      setActiveOptionIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = pickerOpen ? visibleRecipeOptions[activeOptionIndex] : selectedRecipe;
      if (active) {
        chooseRecipe(active);
        addRecipe(active.recipeName);
      }
      return;
    }
    if (event.key === "Escape") setPickerOpen(false);
  };

  const updateRecipeSearch = (value: string) => {
    setRecipeSearch(value);
    setPickerOpen(true);
    setOpenFilterPicker("");
    const exact = recipes.find((recipe) => (
      recipe.recipeName.toLowerCase() === value.trim().toLowerCase()
      || recipe.resultName.toLowerCase() === value.trim().toLowerCase()
    ));
    setSelectedRecipeName(exact?.recipeName || "");
  };

  const selectedEntry = focusedEntryKey
    ? plan.entries.find((entry) => entry.recipe.recipeName === focusedEntryKey) || plan.entries[0] || null
    : plan.entries[0] || null;
  const activeProfileName = activeProfile?.name?.trim() || "Global settings";
  const marketNetPercent = Math.round(getMarketTaxMultiplier(preferences.membership) * 100);
  const warningCount = plan.warnings.length;
  const planHealthLabel = plan.entries.length === 0
    ? `${visibleRecipeOptions.length.toLocaleString()} recipes visible`
    : warningCount > 0
      ? `${warningCount.toLocaleString()} review ${warningCount === 1 ? "flag" : "flags"}`
      : plan.missingMaterialTypes > 0
        ? `${plan.missingMaterialTypes.toLocaleString()} material ${plan.missingMaterialTypes === 1 ? "gap" : "gaps"}`
        : "Ready to forge";

  return (
    <main className="forge-page">
      <div className="sr-only" role="status" aria-live="polite">{statusMessage}</div>
      <header className="forge-hero">
        <div className="hero-copy-stack">
          <p className="eyebrow"><ZenithIcon name="forge" size={16} /> Forge Planner</p>
          <h1>Forge Planner</h1>
          <p className="hero-copy">
            Plan saved legendary and mythic recipe sessions, count owned recipe copies, and see the exact missing materials before a bulk forge push.
          </p>
          <div className="forge-context-chips" aria-label="Forge planner context">
            <span><ShieldCheck size={14} aria-hidden="true" /> {activeProfile ? activeProfileName : "Global settings"}</span>
            <span><ShoppingCart size={14} aria-hidden="true" /> {marketNetPercent}% market net</span>
            <span><Hammer size={14} aria-hidden="true" /> {profileBarteringBoost}% bartering</span>
          </div>
        </div>
        <div className="hero-metrics" aria-label="Plan summary">
          <Metric label="Planned crafts" value={plan.totalCrafts.toLocaleString()} />
          <Metric label="Missing cost" value={`${formatGold(plan.totalMissingCost)}g`} />
          <Metric label="Recipe copies" value={plan.missingRecipeCopies.toLocaleString()} />
          <Metric label="Projected net" value={`${formatGold(plan.projectedNet)}g`} tone={plan.projectedNet >= 0 ? "good" : "warn"} />
        </div>
      </header>

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
                    onClick={() => chooseRecipe(recipe)}
                  >
                    <img src={recipe.resultImageUrl || recipe.imageUrl || "/favicon.ico"} alt="" />
                    <span>
                      <strong>{recipe.resultName}</strong>
                      <small>{recipe.quality} | Lv.{recipe.levelRequired} | {recipe.materials.length} materials</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <CustomPicker
            label="Quality"
            options={QUALITY_OPTIONS.map((quality) => ({ id: quality, label: quality === "ALL" ? "All" : titleCase(quality) }))}
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
              <img src={selectedRecipe.resultImageUrl || selectedRecipe.imageUrl || "/favicon.ico"} alt="" />
              <span>
                <small>Ready to add</small>
                <strong>{selectedRecipe.resultName}</strong>
                <em>{selectedRecipe.quality} | Lv.{selectedRecipe.levelRequired} | {selectedRecipe.resultType || "Forge result"}</em>
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

      <section className={`plan-shell ${selectedEntry ? "" : "no-side"}`} id="forge-plan">
        <div className="plan-main">
          <div className="section-heading">
            <div>
              <p className="panel-kicker"><Layers size={15} /> Planned crafts</p>
              <h2>{plan.entries.length ? `${plan.entries.length} recipe${plan.entries.length === 1 ? "" : "s"}` : "No recipes planned"}</h2>
            </div>
            <div className="plan-summary-pills" aria-label="Forge plan health">
              <span>{recipes.length.toLocaleString()} recipes indexed</span>
              <span>{plan.missingMaterialTypes.toLocaleString()} material gaps</span>
              <span className={warningCount > 0 ? "warn" : ""}>{warningCount.toLocaleString()} warnings</span>
            </div>
          </div>

          {plan.entries.length === 0 ? (
            <div className="empty-panel">
              <ReceiptText size={24} />
              <strong>Add a saved recipe to start planning.</strong>
              <p>Use this for stored legendary/mythic recipes, limited-use copies, and bulk material gathering before you craft.</p>
            </div>
          ) : (
            <div className="entry-list">
              {plan.entries.map((entry) => (
                <article
                  key={entry.key}
                  className={`plan-entry ${focusedEntryKey === entry.recipe.recipeName ? "focused" : ""}`}
                  onMouseEnter={() => prefetchItem(entry.recipe.resultName)}
                  >
                  {entry.warnings.length > 0 && (
                    <div className="warning-row">
                      <AlertTriangle size={15} />
                      <div>
                        <strong>Check before bulk crafting</strong>
                        <p>{entry.warnings.slice(0, 2).join(" | ")}</p>
                      </div>
                    </div>
                  )}

                  <button type="button" className="entry-title" onClick={() => {
                    setFocusedEntryKey(entry.recipe.recipeName);
                    setStatusMessage(`${entry.recipe.resultName} details updated below.`);
                  }}>
                    <img src={entry.recipe.resultImageUrl || entry.recipe.imageUrl || "/favicon.ico"} alt="" />
                    <span>
                      <strong>{entry.recipe.resultName}</strong>
                      <small>{entry.recipe.quality} | Lv.{entry.recipe.levelRequired} | {entry.recipe.resultType || "Forge result"}</small>
                    </span>
                  </button>

                  <div className="entry-controls">
                    <NumberField
                      label="Crafts"
                      ariaLabel={`Craft quantity for ${entry.recipe.recipeName}`}
                      value={draft.lines.find((line) => line.recipeName === entry.recipe.recipeName)?.quantity ?? ""}
                      onChange={(value) => updateLine(entry.recipe.recipeName, "quantity", value)}
                    />
                    <NumberField
                      label="Owned recipes"
                      ariaLabel={`Owned recipe copies for ${entry.recipe.recipeName}`}
                      value={draft.lines.find((line) => line.recipeName === entry.recipe.recipeName)?.ownedRecipes ?? ""}
                      onChange={(value) => updateLine(entry.recipe.recipeName, "ownedRecipes", value)}
                    />
                  </div>

                  <div className="entry-stats">
                    <Stat label="Recipe copies" value={`${entry.recipeCopiesMissing}/${entry.recipeCopiesNeeded} missing`} />
                    <Stat label="Missing materials" value={`${entry.materials.filter((row) => row.missing > 0).length} types`} />
                    <Stat label="Missing cost" value={`${formatGold(entry.totalMissingCost)}g`} />
                    <Stat label="Output value" value={`${formatGold(entry.outputValueTotal)}g`} />
                  </div>

                  <div className="entry-actions">
                    <button type="button" aria-label={`Open result item details for ${entry.recipe.resultName}`} onClick={() => openItemByName(entry.recipe.resultName)}>
                      <Package size={15} /> Result
                    </button>
                    <button type="button" aria-label={`Open recipe item details for ${entry.recipe.recipeName}`} onClick={() => openItemByName(entry.recipe.recipeName)}>
                      <ReceiptText size={15} /> Recipe
                    </button>
                    <button type="button" className="danger" aria-label={`Remove ${entry.recipe.resultName} from forge plan`} onClick={() => removeLine(entry.recipe.recipeName)}>
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>

                </article>
              ))}
            </div>
          )}
        </div>

        {selectedEntry && (
          <aside className="plan-side" aria-label="Selected forge details">
            <div className="detail-card hero-detail">
              <img src={selectedEntry.recipe.resultImageUrl || selectedEntry.recipe.imageUrl || "/favicon.ico"} alt="" />
              <div>
                <p>{selectedEntry.recipe.quality}</p>
                <h3>{selectedEntry.recipe.resultName}</h3>
                <span>{selectedEntry.recipe.description || "Forge recipe result"}</span>
              </div>
            </div>
            <div className="detail-card">
              <h3>Recipe source</h3>
              <p>{selectedEntry.recipe.sourceSummary}</p>
            </div>
            <div className="detail-card">
              <h3>Sell reference</h3>
              <div className="side-stat"><span>Best output value</span><strong>{formatGold(selectedEntry.outputValueEach)}g ea</strong></div>
              <div className="side-stat"><span>Path</span><strong>{selectedEntry.outputSource}</strong></div>
              <div className="side-stat"><span>Liquidity</span><strong>{selectedEntry.liquidity.label}</strong></div>
              <p className="muted">{selectedEntry.liquidity.note}</p>
            </div>
          </aside>
        )}
      </section>

      {plan.entries.length > 0 && (
        <section className="shopping-layout">
          <NeedTable
            title="Missing Materials"
            icon={<ShoppingCart size={16} />}
            rows={plan.materialNeeds}
            ownedMaterials={draft.ownedMaterials}
            onOwnedChange={setOwnedMaterial}
            onOpenItem={openItemByName}
          />
          <RecipeNeedTable
            title="Recipe Copies"
            rows={plan.recipeNeeds}
            onOpenItem={openItemByName}
          />
        </section>
      )}

      <style jsx>{`
        .forge-page {
          max-width: 1680px;
          margin: 0 auto;
          display: grid;
          gap: 1rem;
        }
        .forge-hero,
        .forge-builder,
        .plan-shell,
        .warning-panel,
        .shopping-layout > section {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018));
          box-shadow: 0 18px 45px rgba(0,0,0,0.28);
        }
        .forge-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.7fr);
          gap: 1.25rem;
          align-items: end;
          padding: 1.4rem;
          overflow: hidden;
          position: relative;
        }
        .forge-hero:before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, rgba(139,92,246,0.16), transparent 45%),
            radial-gradient(circle at 85% 10%, rgba(34,211,238,0.12), transparent 30%);
          pointer-events: none;
        }
        .forge-hero > * {
          position: relative;
        }
        .eyebrow,
        .panel-kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #a78bfa;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
          margin: 0 0 0.55rem;
        }
        h1,
        h2,
        h3,
        p {
          margin: 0;
        }
        h1 {
          color: var(--text-primary);
          font-size: clamp(2rem, 5vw, 4.2rem);
          line-height: 0.95;
        }
        h2 {
          color: var(--text-primary);
          font-size: 1.25rem;
        }
        h3 {
          color: var(--text-primary);
          font-size: 1rem;
        }
        .hero-copy {
          color: var(--text-muted);
          max-width: 820px;
          margin-top: 0.85rem;
          line-height: 1.55;
        }
        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .metric,
        .stat,
        .detail-card,
        .empty-panel,
        .plan-entry {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
        }
        .metric {
          padding: 0.9rem;
          display: grid;
          gap: 0.3rem;
          min-width: 0;
        }
        .metric span,
        .stat span,
        .side-stat span,
        .muted {
          color: var(--text-muted);
        }
        .metric span,
        .stat span {
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }
        .metric strong {
          color: var(--text-primary);
          font-size: 1.35rem;
          overflow-wrap: anywhere;
        }
        .metric.good strong {
          color: #34d399;
        }
        .metric.warn strong {
          color: #a78bfa;
        }
        .forge-builder {
          padding: 1rem;
        }
        .builder-topline,
        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .section-heading > span {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 800;
        }
        .builder-grid {
          display: grid;
          grid-template-columns: minmax(360px, 1fr) minmax(520px, 0.75fr) minmax(420px, 0.55fr) auto;
          gap: 0.95rem;
          align-items: start;
        }
        .recipe-combobox {
          position: relative;
          min-width: 0;
          z-index: 6;
        }
        .recipe-combobox label,
        .segmented-label,
        .number-field label {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
          margin-bottom: 0.4rem;
        }
        .combo-shell,
        .number-field input {
          width: 100%;
          min-width: 0;
          min-height: 46px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.38);
          color: var(--text-primary);
        }
        .combo-shell {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.65rem;
          padding: 0 0.75rem;
        }
        .combo-shell.open,
        .combo-shell:focus-within,
        .number-field input:focus {
          border-color: rgba(34,211,238,0.65);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.12);
          outline: none;
        }
        .combo-shell svg,
        .combo-chevron {
          color: var(--text-muted);
          flex: 0 0 auto;
        }
        .combo-shell input,
        .number-field input {
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          min-width: 0;
        }
        .number-field input {
          padding: 0 0.8rem;
          background: rgba(0,0,0,0.38);
          border: 1px solid var(--border-subtle);
        }
        .icon-clear {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
        }
        .combo-menu {
          position: absolute;
          z-index: 30;
          left: 0;
          right: 0;
          top: calc(100% + 0.4rem);
          max-height: min(420px, 62vh);
          overflow: auto;
          border: 1px solid rgba(139,92,246,0.45);
          border-radius: 8px;
          background: rgba(12,12,16,0.98);
          box-shadow: 0 24px 70px rgba(0,0,0,0.55);
          padding: 0.35rem;
        }
        .builder-grid.picker-open .combo-menu {
          position: static;
          margin-top: 0.4rem;
        }
        .combo-option {
          width: 100%;
          min-height: 58px;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 0.65rem;
          align-items: center;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-primary);
          text-align: left;
          padding: 0.45rem;
        }
        .combo-option.active,
        .combo-option:hover {
          background: rgba(139,92,246,0.14);
          border-color: rgba(139,92,246,0.35);
        }
        .combo-option.selected {
          background: rgba(34,211,238,0.12);
          border-color: rgba(34,211,238,0.45);
        }
        .combo-option img,
        .entry-title img,
        .hero-detail img,
        .need-name img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-subtle);
        }
        .combo-option span,
        .entry-title span,
        .need-name span {
          min-width: 0;
        }
        .combo-option strong,
        .entry-title strong,
        .need-name strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .combo-option small,
        .entry-title small,
        .need-name small,
        .option-side {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .combo-empty {
          color: var(--text-muted);
          padding: 1rem;
          text-align: center;
        }
        .segmented-control {
          min-width: 0;
        }
        .segmented-options {
          display: flex;
          gap: 0.35rem;
          min-height: 46px;
          padding: 0.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.3);
          overflow-x: auto;
        }
        .segmented-options button,
        .primary-button,
        .ghost-button,
        .entry-actions button {
          min-height: 40px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.55rem 0.75rem;
          white-space: nowrap;
        }
        .segmented-options button.active,
        .primary-button {
          background: rgba(139,92,246,0.9);
          border-color: rgba(196,181,253,0.65);
        }
        .primary-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .primary-button {
          align-self: end;
        }
        .ghost-button.danger,
        .entry-actions .danger {
          color: #fecdd3;
          border-color: rgba(244,63,94,0.35);
        }
        .plan-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 0.36fr);
          gap: 1rem;
          padding: 1rem;
        }
        .entry-list {
          display: grid;
          gap: 0.75rem;
        }
        .plan-entry {
          display: grid;
          gap: 0.85rem;
          padding: 0.85rem;
        }
        .plan-entry.focused {
          border-color: rgba(34,211,238,0.65);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.1);
        }
        .entry-title {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr);
          gap: 0.75rem;
          align-items: center;
          border: 0;
          background: transparent;
          color: var(--text-primary);
          padding: 0;
          text-align: left;
        }
        .entry-controls,
        .entry-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.65rem;
        }
        .entry-controls {
          grid-template-columns: repeat(2, minmax(120px, 180px));
        }
        .stat {
          padding: 0.65rem;
          display: grid;
          gap: 0.2rem;
          min-width: 0;
        }
        .stat strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        .entry-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .warning-row,
        .warning-panel {
          display: flex;
          gap: 0.65rem;
          align-items: flex-start;
          color: #fbbf24;
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 8px;
          background: rgba(245,158,11,0.08);
          padding: 0.75rem;
        }
        .plan-side {
          display: grid;
          gap: 0.75rem;
          align-content: start;
          position: sticky;
          top: 1rem;
        }
        .detail-card {
          padding: 0.85rem;
          display: grid;
          gap: 0.65rem;
          min-width: 0;
        }
        .hero-detail {
          grid-template-columns: 56px minmax(0, 1fr);
          align-items: center;
        }
        .hero-detail img {
          width: 56px;
          height: 56px;
        }
        .hero-detail p {
          color: #fbbf24;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .hero-detail span,
        .detail-card p {
          color: var(--text-muted);
          line-height: 1.45;
        }
        .side-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border-top: 1px solid var(--border-subtle);
          padding-top: 0.55rem;
        }
        .side-stat strong {
          color: var(--text-primary);
          text-align: right;
        }
        .empty-panel {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.45rem;
          padding: 2rem;
          color: var(--text-muted);
        }
        .empty-panel strong {
          color: var(--text-primary);
          font-size: 1.1rem;
        }
        .shopping-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .shopping-layout > section {
          padding: 1rem;
          min-width: 0;
        }
        .need-list {
          display: grid;
          gap: 0.55rem;
        }
        .need-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 92px 92px 92px 118px;
          gap: 0.6rem;
          align-items: center;
          padding: 0.6rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
        }
        .need-name {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 0.6rem;
          align-items: center;
          border: 0;
          background: transparent;
          color: var(--text-primary);
          text-align: left;
          padding: 0;
          min-width: 0;
        }
        .need-name img {
          width: 40px;
          height: 40px;
        }
        .need-row .number-field input {
          min-height: 40px;
        }
        .need-stat {
          display: grid;
          gap: 0.1rem;
          min-width: 0;
        }
        .need-stat span {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .need-stat strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        @media (max-width: 1720px) {
          .builder-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            align-items: start;
          }
          .recipe-combobox {
            grid-column: 1 / -1;
          }
          .primary-button {
            align-self: end;
            grid-column: 2;
            justify-self: end;
            min-width: 180px;
          }
          .shopping-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 1280px) {
          .forge-hero,
          .plan-shell,
          .shopping-layout {
            grid-template-columns: 1fr;
          }
          .plan-side {
            position: static;
          }
        }
        @media (max-width: 980px) {
          .builder-grid {
            grid-template-columns: 1fr;
          }
          .primary-button {
            grid-column: auto;
            justify-self: stretch;
          }
          .entry-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .need-row {
            grid-template-columns: 1fr 1fr 1fr;
          }
          .need-name {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 620px) {
          .forge-page {
            gap: 0.75rem;
          }
          .forge-hero,
          .forge-builder,
          .plan-shell,
          .shopping-layout > section {
            padding: 0.85rem;
          }
          .hero-metrics,
          .entry-controls,
          .entry-stats,
          .need-row {
            grid-template-columns: 1fr;
          }
          .builder-topline,
          .section-heading {
            align-items: stretch;
            flex-direction: column;
          }
          .combo-option {
            grid-template-columns: 38px minmax(0, 1fr);
          }
          .entry-actions button {
            flex: 1 1 100%;
          }
        }
      `}</style>
      <style jsx global>{`
        .forge-page .metric,
        .forge-page .stat,
        .forge-page .detail-card,
        .forge-page .empty-panel,
        .forge-page .plan-entry {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
        }
        .forge-page .metric {
          padding: 0.9rem;
          display: grid;
          gap: 0.3rem;
          min-width: 0;
        }
        .forge-page .metric span,
        .forge-page .stat span {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }
        .forge-page .metric strong,
        .forge-page .stat strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        .forge-page .metric strong {
          font-size: 1.35rem;
        }
        .forge-page .metric.good strong {
          color: #34d399;
        }
        .forge-page .metric.warn strong {
          color: #fbbf24;
        }
        .forge-page .number-field {
          min-width: 0;
        }
        .forge-page .number-field label,
        .forge-page .segmented-label {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
          margin-bottom: 0.4rem;
        }
        .forge-page .combo-shell input,
        .forge-page .number-field input {
          width: 100%;
          min-width: 0;
          min-height: 42px;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
        }
        .forge-page .number-field input {
          min-height: 46px;
          padding: 0 0.8rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.38);
        }
        .forge-page .number-field input:focus {
          border-color: rgba(34,211,238,0.65);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.12);
        }
        .forge-page .segmented-control {
          min-width: 0;
        }
        .forge-page .segmented-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          min-height: 46px;
          padding: 0.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.3);
          overflow: visible;
        }
        .forge-page .segmented-options button,
        .forge-page .primary-button,
        .forge-page .ghost-button,
        .forge-page .entry-actions button {
          min-height: 40px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.55rem 0.75rem;
          white-space: nowrap;
        }
        .forge-page .segmented-options button.active,
        .forge-page .primary-button {
          background: rgba(139,92,246,0.9);
          border-color: rgba(196,181,253,0.65);
        }
        .forge-page .primary-button {
          align-self: end;
        }
        .forge-page .stat {
          padding: 0.65rem;
          display: grid;
          gap: 0.2rem;
          min-width: 0;
        }
        .forge-page .empty-panel {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.45rem;
          padding: 2rem;
          color: var(--text-muted);
        }
        .forge-page .empty-panel strong {
          color: var(--text-primary);
          font-size: 1.1rem;
        }
        .forge-page .need-list {
          display: grid;
          gap: 0.55rem;
        }
        .forge-page .need-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 92px 92px 92px 118px;
          gap: 0.6rem;
          align-items: center;
          padding: 0.6rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
        }
        .forge-page .need-name {
          min-height: 44px;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 0.6rem;
          align-items: center;
          border: 0;
          background: transparent;
          color: var(--text-primary);
          text-align: left;
          padding: 0;
          min-width: 0;
        }
        .forge-page .need-name img {
          width: 40px;
          height: 40px;
          object-fit: contain;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-subtle);
        }
        .forge-page .need-name span,
        .forge-page .need-stat {
          min-width: 0;
        }
        .forge-page .need-name strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .need-name small,
        .forge-page .need-stat span {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .forge-page .need-stat {
          display: grid;
          gap: 0.1rem;
        }
        .forge-page .need-stat span {
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .forge-page .need-stat strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        @media (max-width: 980px) {
          .forge-page .shopping-layout {
            grid-template-columns: 1fr;
          }
          .forge-page .need-row {
            grid-template-columns: 1fr 1fr 1fr;
          }
          .forge-page .need-name {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 620px) {
          .forge-page .hero-metrics,
          .forge-page .entry-controls,
          .forge-page .entry-stats,
          .forge-page .need-row {
            grid-template-columns: 1fr;
          }
          .forge-page .entry-actions button {
            flex: 1 1 100%;
          }
        }
        .forge-page {
          --forge-ember: #f59e0b;
          --forge-gold: #fbbf24;
          --forge-copper: #b45309;
          --forge-focus: rgba(34, 211, 238, 0.5);
          gap: 1.15rem;
        }
        .forge-page .forge-hero,
        .forge-page .forge-builder,
        .forge-page .plan-shell,
        .forge-page .warning-panel,
        .forge-page .shopping-layout > section {
          border-color: rgba(245, 158, 11, 0.16);
          background:
            linear-gradient(145deg, rgba(37, 27, 18, 0.74), rgba(9, 10, 12, 0.88)),
            radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.06), transparent 34%);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
        }
        .forge-page .forge-hero {
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.56fr);
          gap: 1.5rem;
          align-items: center;
          padding: clamp(1.35rem, 2.4vw, 2.25rem);
          min-height: 260px;
        }
        .forge-page .forge-hero:before {
          background:
            linear-gradient(115deg, rgba(245, 158, 11, 0.18), rgba(180, 83, 9, 0.08) 42%, transparent 66%),
            radial-gradient(circle at 88% 10%, rgba(34, 211, 238, 0.13), transparent 32%);
        }
        .forge-page h1 {
          max-width: 980px;
          font-size: clamp(2.35rem, 4.1vw, 4.05rem);
          line-height: 1.02;
          text-wrap: balance;
          overflow-wrap: normal;
        }
        .forge-page .hero-copy {
          max-width: 760px;
          margin-top: 1rem;
          font-size: 0.98rem;
          line-height: 1.6;
        }
        .forge-page .eyebrow,
        .forge-page .panel-kicker,
        .forge-page .metric.warn strong,
        .forge-page .warning-panel strong,
        .forge-page .warning-row {
          color: var(--forge-gold);
        }
        .forge-page .metric,
        .forge-page .stat,
        .forge-page .detail-card,
        .forge-page .empty-panel,
        .forge-page .plan-entry,
        .forge-page .need-row {
          border-color: rgba(245, 158, 11, 0.13);
          background: linear-gradient(145deg, rgba(255,255,255,0.035), rgba(0,0,0,0.24));
          transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
        }
        .forge-page .metric:hover,
        .forge-page .plan-entry:hover,
        .forge-page .need-row:hover {
          transform: translateY(-1px);
          border-color: rgba(245, 158, 11, 0.28);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
        }
        .forge-page .forge-builder {
          padding: clamp(1rem, 1.8vw, 1.35rem);
        }
        .forge-page .builder-topline,
        .forge-page .section-heading {
          margin-bottom: 1.15rem;
        }
        .forge-page .builder-grid {
          grid-template-columns: minmax(360px, 1.05fr) minmax(460px, 0.72fr) minmax(360px, 0.54fr) auto;
          gap: 1rem;
          align-items: start;
        }
        .forge-page .combo-shell,
        .forge-page .number-field input,
        .forge-page .segmented-options {
          border-color: rgba(245, 158, 11, 0.14);
          background: rgba(0,0,0,0.34);
          transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
        }
        .forge-page .combo-shell.open,
        .forge-page .combo-shell:focus-within,
        .forge-page .number-field input:focus {
          border-color: var(--forge-focus);
          background: rgba(2, 6, 10, 0.58);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.11);
        }
        .forge-page .combo-shell svg,
        .forge-page .combo-chevron {
          color: rgba(251, 191, 36, 0.78);
        }
        .forge-page .combo-menu {
          border-color: rgba(245, 158, 11, 0.34);
          background: rgba(13, 11, 9, 0.985);
          box-shadow: 0 28px 75px rgba(0,0,0,0.64);
          animation: forgeMenuIn 140ms ease-out;
        }
        .forge-page .combo-option {
          transition: transform 140ms ease, background-color 140ms ease, border-color 140ms ease;
        }
        .forge-page .combo-option.active,
        .forge-page .combo-option:hover {
          transform: translateX(2px);
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
        }
        .forge-page .combo-option.selected {
          background: rgba(34, 211, 238, 0.09);
          border-color: rgba(34, 211, 238, 0.35);
        }
        .forge-page .segmented-options {
          gap: 0.4rem;
          padding: 0.3rem;
        }
        .forge-page .segmented-options button,
        .forge-page .primary-button,
        .forge-page .ghost-button,
        .forge-page .entry-actions button,
        .forge-page .icon-clear,
        .forge-page .need-name,
        .forge-page .entry-title {
          transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
        }
        .forge-page .segmented-options button:hover,
        .forge-page .primary-button:hover:not(:disabled),
        .forge-page .ghost-button:hover,
        .forge-page .entry-actions button:hover,
        .forge-page .icon-clear:hover,
        .forge-page .need-name:hover,
        .forge-page .entry-title:hover {
          transform: translateY(-1px);
          border-color: rgba(245, 158, 11, 0.34);
          background: rgba(245, 158, 11, 0.08);
        }
        .forge-page .segmented-options button:active,
        .forge-page .primary-button:active:not(:disabled),
        .forge-page .entry-actions button:active {
          transform: translateY(0);
        }
        .forge-page .segmented-options button.active,
        .forge-page .primary-button {
          color: #111827;
          background: linear-gradient(180deg, #fbbf24, #d97706);
          border-color: rgba(251, 191, 36, 0.72);
          box-shadow: 0 8px 22px rgba(245, 158, 11, 0.18);
        }
        .forge-page .primary-button:disabled {
          color: rgba(255,255,255,0.48);
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
          box-shadow: none;
        }
        .forge-page .plan-shell {
          grid-template-columns: minmax(0, 1fr) minmax(300px, 0.32fr);
          gap: 1.1rem;
          padding: clamp(1rem, 1.7vw, 1.25rem);
        }
        .forge-page .plan-entry {
          gap: 0.95rem;
          padding: 1rem;
        }
        .forge-page .plan-entry.focused {
          border-color: rgba(34, 211, 238, 0.5);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.09), 0 16px 36px rgba(0,0,0,0.26);
        }
        .forge-page .shopping-layout {
          gap: 1.1rem;
        }
        .forge-page .shopping-layout > section {
          padding: clamp(1rem, 1.6vw, 1.2rem);
        }
        .forge-page .need-list {
          gap: 0.7rem;
        }
        .forge-page .need-row {
          grid-template-columns: minmax(250px, 1fr) minmax(90px, 0.24fr) minmax(110px, 0.26fr) minmax(100px, 0.24fr) minmax(130px, 0.28fr);
          gap: 0.75rem;
          padding: 0.75rem;
        }
        .forge-page .need-name img,
        .forge-page .combo-option img,
        .forge-page .entry-title img,
        .forge-page .hero-detail img {
          border-color: rgba(245, 158, 11, 0.16);
          background: rgba(0,0,0,0.24);
        }
        .forge-page .warning-panel,
        .forge-page .warning-row {
          border-color: rgba(245, 158, 11, 0.38);
          background: linear-gradient(145deg, rgba(245, 158, 11, 0.12), rgba(0,0,0,0.22));
        }
        @keyframes forgeMenuIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .forge-page *,
          .forge-page *:before,
          .forge-page *:after {
            animation-duration: 1ms !important;
            transition-duration: 1ms !important;
            scroll-behavior: auto !important;
          }
        }
        @media (max-width: 1720px) {
          .forge-page .builder-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          }
          .forge-page .recipe-combobox {
            grid-column: 1 / -1;
          }
          .forge-page .primary-button {
            grid-column: 2;
            justify-self: end;
            min-width: 180px;
          }
        }
        @media (max-width: 1280px) {
          .forge-page .forge-hero {
            grid-template-columns: 1fr;
            min-height: 0;
          }
          .forge-page h1 {
            font-size: clamp(2.5rem, 7vw, 3.4rem);
          }
          .forge-page .plan-shell {
            grid-template-columns: 1fr;
          }
          .forge-page .plan-side {
            position: static;
          }
        }
        @media (max-width: 980px) {
          .forge-page .builder-grid {
            grid-template-columns: 1fr;
          }
          .forge-page .primary-button {
            grid-column: auto;
            justify-self: stretch;
          }
          .forge-page .need-row {
            grid-template-columns: minmax(0, 1fr) minmax(110px, 0.35fr) minmax(110px, 0.35fr);
          }
          .forge-page .need-name {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 620px) {
          .forge-page {
            gap: 0.85rem;
          }
          .forge-page .forge-hero,
          .forge-page .forge-builder,
          .forge-page .plan-shell,
          .forge-page .shopping-layout > section {
            padding: 1rem;
          }
          .forge-page h1 {
            font-size: clamp(2rem, 14vw, 2.75rem);
            line-height: 1.04;
          }
          .forge-page .hero-copy {
            font-size: 0.92rem;
          }
          .forge-page .need-row {
            padding: 0.85rem;
          }
          .forge-page .need-stat {
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
          }
          .forge-page .need-stat span {
            font-size: 0.72rem;
          }
        }
        .forge-page {
          --forge-ember: #8b5cf6;
          --forge-gold: #a78bfa;
          --forge-copper: #22d3ee;
          --forge-focus: rgba(34, 211, 238, 0.58);
          padding: 0 clamp(1rem, 2vw, 1.5rem) 2rem;
          box-sizing: border-box;
        }
        .forge-page * {
          box-sizing: border-box;
        }
        .forge-page .forge-hero,
        .forge-page .forge-builder,
        .forge-page .plan-shell,
        .forge-page .warning-panel,
        .forge-page .shopping-layout > section {
          border-color: rgba(139, 92, 246, 0.26);
          background:
            linear-gradient(145deg, rgba(139, 92, 246, 0.075), rgba(15, 23, 42, 0.5)),
            radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.07), transparent 34%);
        }
        .forge-page .forge-hero:before {
          background:
            linear-gradient(115deg, rgba(139, 92, 246, 0.18), rgba(34, 211, 238, 0.08) 42%, transparent 66%),
            radial-gradient(circle at 88% 10%, rgba(34, 211, 238, 0.13), transparent 32%);
        }
        .forge-page .eyebrow,
        .forge-page .panel-kicker,
        .forge-page .metric.warn strong,
        .forge-page .hero-detail p {
          color: var(--forge-gold);
        }
        .forge-page .metric,
        .forge-page .stat,
        .forge-page .detail-card,
        .forge-page .empty-panel,
        .forge-page .plan-entry,
        .forge-page .need-row {
          border-color: rgba(139, 92, 246, 0.16);
          background: linear-gradient(145deg, rgba(255,255,255,0.035), rgba(0,0,0,0.24));
        }
        .forge-page .metric:hover,
        .forge-page .plan-entry:hover,
        .forge-page .need-row:hover {
          border-color: rgba(139, 92, 246, 0.32);
        }
        .forge-page .builder-grid {
          grid-template-columns: minmax(360px, 1.05fr) 190px 170px auto;
        }
        .forge-page .recipe-combobox,
        .forge-page .primary-button {
          grid-column: auto;
        }
        .forge-page .combo-shell,
        .forge-page .number-field input,
        .forge-page .segmented-options,
        .forge-page .filter-picker-button {
          border-color: rgba(139, 92, 246, 0.2);
          background: rgba(0,0,0,0.34);
        }
        .forge-page .combo-shell svg,
        .forge-page .combo-chevron {
          color: rgba(167, 139, 250, 0.9);
        }
        .forge-page .combo-menu {
          border-color: rgba(139, 92, 246, 0.42);
          background: rgba(10, 10, 18, 0.985);
        }
        .forge-page .combo-option.active,
        .forge-page .combo-option:hover {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.34);
        }
        .forge-page .segmented-options {
          width: fit-content;
          max-width: 100%;
        }
        .forge-page .filter-picker {
          position: relative;
          min-width: 0;
          z-index: 4;
        }
        .forge-page .filter-picker-button {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          color: var(--text-primary);
          font: inherit;
          font-weight: 900;
          cursor: pointer;
          padding: 0.7rem 0.85rem;
          transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
        }
        .forge-page .filter-picker-button span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .filter-picker-button svg {
          flex: 0 0 auto;
          color: rgba(167, 139, 250, 0.9);
          transition: transform 150ms ease;
        }
        .forge-page .filter-picker-button.open svg {
          transform: rotate(180deg);
        }
        .forge-page .filter-picker-button:hover,
        .forge-page .filter-picker-button.open,
        .forge-page .filter-picker-button:focus-visible {
          border-color: rgba(139, 92, 246, 0.48);
          background: rgba(139, 92, 246, 0.08);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
          outline: none;
        }
        .forge-page .filter-picker-menu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 0.4rem);
          z-index: 20;
          display: grid;
          gap: 0.25rem;
          max-height: 260px;
          overflow-y: auto;
          padding: 0.35rem;
          border: 1px solid rgba(139, 92, 246, 0.42);
          border-radius: 10px;
          background: rgba(10, 10, 18, 0.985);
          box-shadow: 0 18px 44px rgba(0,0,0,0.48);
        }
        .forge-page .filter-picker-menu button {
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-weight: 850;
          cursor: pointer;
          padding: 0.6rem 0.7rem;
          text-align: left;
          transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
        }
        .forge-page .filter-picker-menu button.active,
        .forge-page .filter-picker-menu button:hover {
          border-color: rgba(139, 92, 246, 0.34);
          background: rgba(139, 92, 246, 0.12);
        }
        .forge-page .filter-picker-menu button.selected {
          color: #c4b5fd;
        }
        .forge-page .segmented-options button:hover,
        .forge-page .ghost-button:hover,
        .forge-page .entry-actions button:hover,
        .forge-page .icon-clear:hover {
          border-color: rgba(139, 92, 246, 0.38);
          background: rgba(139, 92, 246, 0.08);
        }
        .forge-page .segmented-options button.active,
        .forge-page .primary-button {
          color: #ffffff;
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.96), rgba(79, 70, 229, 0.94));
          border-color: rgba(196, 181, 253, 0.68);
          box-shadow: 0 8px 22px rgba(139, 92, 246, 0.2);
        }
        .forge-page .primary-button:hover:not(:disabled) {
          background: linear-gradient(180deg, rgba(124, 58, 237, 1), rgba(67, 56, 202, 0.98));
          border-color: rgba(196, 181, 253, 0.78);
        }
        .forge-page .primary-button:disabled {
          color: rgba(255,255,255,0.48);
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
          box-shadow: none;
          transform: none;
          pointer-events: none;
        }
        .forge-page .plan-shell.no-side {
          grid-template-columns: minmax(0, 1fr);
        }
        .forge-page .need-name,
        .forge-page .entry-title {
          border-color: transparent;
        }
        .forge-page .need-name:hover,
        .forge-page .entry-title:hover {
          background: rgba(139, 92, 246, 0.07);
          border-color: rgba(139, 92, 246, 0.18);
          box-shadow: none;
        }
        .forge-page .need-name img,
        .forge-page .combo-option img,
        .forge-page .entry-title img,
        .forge-page .hero-detail img {
          border-color: rgba(139, 92, 246, 0.18);
        }
        .forge-page .warning-panel,
        .forge-page .warning-row {
          border-color: rgba(245, 158, 11, 0.34);
          background: linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.36));
        }
        .forge-page .warning-row {
          align-items: flex-start;
          color: #fbbf24;
        }
        .forge-page .warning-row div {
          min-width: 0;
          display: grid;
          gap: 0.2rem;
        }
        .forge-page .warning-row p {
          margin: 0;
        }
        .forge-page .panel-kicker {
          gap: 0.65rem !important;
          align-items: center;
        }
        .forge-page .panel-kicker svg {
          flex: 0 0 auto;
        }
        .forge-page .panel-kicker > span {
          display: inline-block;
          margin-left: 0.45rem;
        }
        .forge-page {
          width: 100%;
          max-width: min(1680px, 100%);
          overflow-x: clip;
        }
        .forge-page .forge-hero,
        .forge-page .forge-builder,
        .forge-page .plan-shell,
        .forge-page .plan-main,
        .forge-page .plan-side,
        .forge-page .entry-list,
        .forge-page .builder-grid,
        .forge-page .hero-metrics,
        .forge-page .shopping-layout,
        .forge-page .shopping-layout > section {
          min-width: 0;
          max-width: 100%;
        }
        .forge-page .hero-metrics {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr));
        }
        .forge-page .plan-shell {
          grid-template-columns: minmax(0, 1fr) minmax(280px, min(32%, 360px));
          scroll-margin-top: 5.75rem;
        }
        .forge-page .need-row {
          grid-template-columns:
            minmax(0, 1fr)
            minmax(80px, 0.22fr)
            minmax(96px, 0.24fr)
            minmax(86px, 0.22fr)
            minmax(110px, 0.26fr);
        }
        .forge-page .forge-undo-toast {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid rgba(34, 211, 238, 0.22);
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.72);
          color: #e5e7eb;
          padding: 0.75rem 0.85rem;
        }
        .forge-page .forge-undo-toast button {
          border: 1px solid rgba(34, 211, 238, 0.36);
          border-radius: 8px;
          background: rgba(34, 211, 238, 0.1);
          color: #67e8f9;
          cursor: pointer;
          font-weight: 800;
          min-height: 2.35rem;
          padding: 0 0.85rem;
        }
        .forge-page .forge-undo-toast button:hover,
        .forge-page .forge-undo-toast button:focus-visible {
          background: rgba(34, 211, 238, 0.18);
          outline: none;
        }
        .forge-page {
          --forge-ember: #f59e0b;
          --forge-gold: #fbbf24;
          --forge-copper: #22d3ee;
          --forge-focus: rgba(245, 158, 11, 0.46);
          -webkit-tap-highlight-color: transparent;
          padding-bottom: clamp(4.5rem, 8vh, 7rem);
        }
        .forge-page :where(button, input, [role="button"], [role="option"]) {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .forge-page .forge-hero,
        .forge-page .forge-builder,
        .forge-page .plan-shell,
        .forge-page .shopping-layout > section {
          border-color: rgba(245, 158, 11, 0.2);
          background:
            linear-gradient(145deg, rgba(245, 158, 11, 0.06), rgba(15, 23, 42, 0.5)),
            radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.08), transparent 34%);
        }
        .forge-page .forge-hero:before {
          background:
            linear-gradient(115deg, rgba(245, 158, 11, 0.15), rgba(34, 211, 238, 0.07) 42%, transparent 68%),
            radial-gradient(circle at 88% 10%, rgba(34, 211, 238, 0.13), transparent 32%);
        }
        .forge-page .hero-copy-stack {
          min-width: 0;
          display: grid;
          gap: 0.85rem;
          align-content: start;
        }
        .forge-page .forge-context-chips,
        .forge-page .plan-summary-pills,
        .forge-page .selected-recipe-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-width: 0;
        }
        .forge-page .forge-context-chips span,
        .forge-page .plan-summary-pills span,
        .forge-page .forge-builder-badge,
        .forge-page .selected-recipe-meta span {
          min-height: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          max-width: 100%;
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.07);
          color: #fde68a;
          font-size: 0.74rem;
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1.15;
          padding: 0.45rem 0.7rem;
        }
        .forge-page .forge-context-chips svg {
          flex: 0 0 auto;
          color: #67e8f9;
        }
        .forge-page .plan-summary-pills {
          justify-content: flex-end;
        }
        .forge-page .plan-summary-pills span,
        .forge-page .selected-recipe-meta span {
          border-color: rgba(34, 211, 238, 0.18);
          background: rgba(34, 211, 238, 0.055);
          color: #bae6fd;
        }
        .forge-page .plan-summary-pills .warn,
        .forge-page .forge-builder-badge.warn {
          border-color: rgba(245, 158, 11, 0.36);
          background: rgba(245, 158, 11, 0.12);
          color: #fcd34d;
        }
        .forge-page .builder-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.65rem;
          min-width: 0;
        }
        .forge-page .forge-builder-badge {
          white-space: nowrap;
        }
        .forge-page .selected-recipe-card {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
          gap: 0.85rem;
          align-items: center;
          margin-top: 0.95rem;
          border: 1px solid rgba(34, 211, 238, 0.18);
          border-radius: 8px;
          background:
            linear-gradient(145deg, rgba(34, 211, 238, 0.055), rgba(245, 158, 11, 0.055)),
            rgba(255, 255, 255, 0.025);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
          padding: 0.8rem;
        }
        .forge-page .selected-recipe-title {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.25rem;
          text-align: left;
        }
        .forge-page .selected-recipe-title img {
          width: 3rem;
          height: 3rem;
          flex: 0 0 auto;
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.28);
          object-fit: contain;
        }
        .forge-page .selected-recipe-title span {
          min-width: 0;
          display: grid;
          gap: 0.12rem;
        }
        .forge-page .selected-recipe-title small,
        .forge-page .selected-recipe-title em {
          overflow: hidden;
          color: rgba(244, 244, 245, 0.64);
          font-size: 0.74rem;
          font-style: normal;
          font-weight: 800;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .forge-page .selected-recipe-title strong {
          overflow: hidden;
          color: #fff7ed;
          font-size: 1rem;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .selected-recipe-title:hover {
          border-color: rgba(245, 158, 11, 0.24);
          background: rgba(245, 158, 11, 0.06);
        }
        .forge-page .selected-recipe-meta {
          justify-content: flex-end;
        }
        .forge-page .selected-recipe-meta span {
          overflow: hidden;
          max-width: 100%;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .metric,
        .forge-page .plan-entry,
        .forge-page .need-row,
        .forge-page .detail-card,
        .forge-page .selected-recipe-card {
          transition:
            transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease;
        }
        .forge-page .combo-shell:focus-within,
        .forge-page .number-field input:focus-visible,
        .forge-page .filter-picker-button:focus-visible,
        .forge-page .filter-picker-menu button:focus-visible,
        .forge-page .combo-option:focus-visible,
        .forge-page .primary-button:focus-visible,
        .forge-page .ghost-button:focus-visible,
        .forge-page .entry-actions button:focus-visible,
        .forge-page .entry-title:focus-visible,
        .forge-page .need-name:focus-visible,
        .forge-page .icon-clear:focus-visible,
        .forge-page .selected-recipe-title:focus-visible,
        .forge-page .forge-undo-toast button:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--forge-copper), white 12%);
          outline-offset: 3px;
          box-shadow: 0 0 0 5px rgba(34, 211, 238, 0.1);
        }
        .forge-page .primary-button:active:not(:disabled),
        .forge-page .ghost-button:active,
        .forge-page .entry-actions button:active,
        .forge-page .need-name:active,
        .forge-page .selected-recipe-title:active,
        .forge-page .filter-picker-button:active {
          transform: scale(0.985);
        }
        @media (hover: hover) and (pointer: fine) {
          .forge-page .metric:hover,
          .forge-page .selected-recipe-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
          }
          .forge-page .plan-entry:hover,
          .forge-page .need-row:hover {
            transform: translateY(-1px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .forge-page *,
          .forge-page *::before,
          .forge-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
        @media (max-width: 1380px) {
          .forge-page .forge-hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .plan-shell {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .plan-side {
            position: static;
          }
        }
        @media (max-width: 1320px) {
          .forge-page .builder-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          }
          .forge-page .recipe-combobox {
            grid-column: 1 / -1;
          }
          .forge-page .primary-button {
            grid-column: 1 / -1;
            width: 100%;
          }
          .forge-page .filter-picker {
            width: min(100%, 220px);
          }
          .forge-page .segmented-options {
            width: 100%;
          }
        }
        @media (max-width: 620px) {
          .forge-page {
            padding: 0 0.85rem 8.5rem;
          }
          .forge-page .forge-context-chips,
          .forge-page .plan-summary-pills,
          .forge-page .builder-actions,
          .forge-page .selected-recipe-meta {
            justify-content: flex-start;
          }
          .forge-page .builder-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .recipe-combobox,
          .forge-page .primary-button {
            grid-column: 1 / -1;
            width: 100%;
          }
          .forge-page .filter-picker {
            width: 100%;
            z-index: 30;
          }
          .forge-page .filter-picker-menu {
            max-height: min(18rem, calc(100vh - 8rem));
          }
          .forge-page .builder-actions {
            width: 100%;
            align-items: stretch;
            flex-direction: column;
          }
          .forge-page .forge-builder-badge,
          .forge-page .ghost-button {
            width: 100%;
            justify-content: center;
          }
          .forge-page .selected-recipe-card {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .selected-recipe-title {
            width: 100%;
          }
          .forge-page .need-list,
          .forge-page .need-row,
          .forge-page .need-name,
          .forge-page .need-name span {
            min-width: 0;
            max-width: 100%;
          }
          .forge-page .need-row {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .need-name {
            width: 100%;
          }
          .forge-page .forge-undo-toast {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className={`metric ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NumberField({
  label,
  ariaLabel,
  value,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number | "";
  onChange: (value: string) => void;
}) {
  const inputId = useId();
  return (
    <div className="number-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        aria-label={ariaLabel || label}
        value={value}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
      />
    </div>
  );
}

function CustomPicker({
  label,
  options,
  value,
  onChange,
  pickerKey,
  openPicker,
  setOpenPicker,
  onPointerToggle,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  pickerKey: "quality" | "sort";
  openPicker: "quality" | "sort" | "";
  setOpenPicker: (value: "quality" | "sort" | "") => void;
  onPointerToggle?: () => void;
}) {
  const pickerId = useId();
  const open = openPicker === pickerKey;
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.id === value)));
  const selected = options.find((option) => option.id === value) || options[0] || { id: "", label: "Choose" };

  useEffect(() => {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.id === value)));
  }, [options, value]);

  const choose = (option: { id: string; label: string }) => {
    onChange(option.id);
    setOpenPicker("");
  };

  return (
    <div
      className="filter-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpenPicker("");
        }
      }}
    >
      <span className="segmented-label" id={`${pickerId}-label`}>{label}</span>
      <button
        type="button"
        className={`filter-picker-button ${open ? "open" : ""}`}
        id={`${pickerId}-button`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${pickerId}-label ${pickerId}-button`}
        onPointerDown={(event) => {
          event.preventDefault();
          onPointerToggle?.();
          setOpenPicker(open ? "" : pickerKey);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpenPicker("");
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpenPicker(pickerKey);
            setActiveIndex((current) => {
              const delta = event.key === "ArrowDown" ? 1 : -1;
              return (current + delta + options.length) % options.length;
            });
            return;
          }
          if (event.key === "Enter" && open) {
            event.preventDefault();
            choose(options[activeIndex] || selected);
          }
        }}
      >
        <span>{selected?.label || "Choose"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="filter-picker-menu" role="listbox" aria-labelledby={`${pickerId}-label`}>
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
              role="option"
              aria-selected={value === option.id}
              className={`${value === option.id ? "selected" : ""} ${options[activeIndex]?.id === option.id ? "active" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(options.findIndex((item) => item.id === option.id))}
              onClick={() => choose(option)}
          >
              <span>{option.label}</span>
              {value === option.id ? <Check size={15} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      )}
    </div>
  );
}

function NeedTable({
  title,
  icon,
  rows,
  ownedMaterials,
  onOwnedChange,
  onOpenItem,
}: {
  title: string;
  icon: ReactNode;
  rows: Array<{
    name: string;
    imageUrl: string;
    quality: ForgeQuality;
    required: number;
    owned: number;
    missing: number;
    unitPrice: number;
    totalCost: number;
    source: string;
  }>;
  ownedMaterials: ForgePlannerOwnedMaterials;
  onOwnedChange: (name: string, value: string) => void;
  onOpenItem: (name: string) => void;
}) {
  return (
    <section aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="panel-kicker">{icon}<span>{title}</span></p>
          <h2>{rows.filter((row) => row.missing > 0).length} missing types</h2>
        </div>
      </div>
      <div className="need-list">
        {rows.map((row) => (
          <div className="need-row" key={row.name}>
            <button type="button" className="need-name" aria-label={`Open item details for ${row.name}`} onClick={() => onOpenItem(row.name)}>
              <img src={row.imageUrl || "/favicon.ico"} alt="" />
              <span>
                <strong>{row.name}</strong>
                <small>{row.quality} | {row.source}</small>
              </span>
            </button>
            <div className="need-stat"><span>Required</span><strong>{row.required.toLocaleString()}</strong></div>
            <NumberField
              label="Owned"
              ariaLabel={`Owned quantity for ${row.name}`}
              value={ownedMaterials[row.name] || ""}
              onChange={(value) => onOwnedChange(row.name, value)}
            />
            <div className="need-stat"><span>Missing</span><strong>{row.missing.toLocaleString()}</strong></div>
            <div className="need-stat"><span>Cost</span><strong>{formatGold(row.totalCost)}g</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecipeNeedTable({
  title,
  rows,
  onOpenItem,
}: {
  title: string;
  rows: Array<{
    recipeName: string;
    imageUrl: string;
    quality: ForgeQuality;
    copiesNeeded: number;
    ownedCopies: number;
    missingCopies: number;
    unitPrice: number;
    totalCost: number;
    source: string;
  }>;
  onOpenItem: (name: string) => void;
}) {
  return (
    <section aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="panel-kicker"><ReceiptText size={16} /> <span>{title}</span></p>
          <h2>{rows.reduce((sum, row) => sum + row.missingCopies, 0).toLocaleString()} copies missing</h2>
        </div>
      </div>
      <div className="need-list">
        {rows.map((row) => (
          <div className="need-row" key={row.recipeName}>
            <button type="button" className="need-name" aria-label={`Open item details for ${row.recipeName}`} onClick={() => onOpenItem(row.recipeName)}>
              <img src={row.imageUrl || "/favicon.ico"} alt="" />
              <span>
                <strong>{row.recipeName}</strong>
                <small>{row.quality} | {row.source}</small>
              </span>
            </button>
            <div className="need-stat"><span>Needed</span><strong>{row.copiesNeeded.toLocaleString()}</strong></div>
            <div className="need-stat"><span>Owned</span><strong>{row.ownedCopies.toLocaleString()}</strong></div>
            <div className="need-stat"><span>Missing</span><strong>{row.missingCopies.toLocaleString()}</strong></div>
            <div className="need-stat"><span>Cost</span><strong>{formatGold(row.totalCost)}g</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRecipeDisplayValue(recipe: ForgeRecipeOption) {
  const qualityRank: Record<string, number> = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, PREMIUM: 2, REFINED: 1 };
  return (qualityRank[recipe.quality] || 0) * 1_000_000 + recipe.levelRequired * 1_000 - recipe.materials.length;
}
