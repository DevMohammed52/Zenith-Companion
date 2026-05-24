"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Clock3,
    FlaskConical,
    Minus,
    Package,
    Plus,
    ReceiptText,
    Search,
    ShoppingCart,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { ALCHEMY_ITEMS } from "../../constants";
import { useItemModal } from "@/context/ItemModalContext";
import { useCrafting } from "@/context/CraftingContext";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { useProfiles } from "@/lib/profiles";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import {
    calculateCraftingQueuePlan,
    isCraftingQueueRecipe,
    type QueueNeedRow,
    type QueueRecipeNeedRow,
    type QueueSaleSource,
} from "@/lib/crafting-queue";

type CraftingItemRecord = {
    image?: string;
    image_url?: string;
};

export default function CraftingPage() {
    const { openItemByName, prefetchItem } = useItemModal();
    const { queue, setQueueQty, addToQueue, clearQueue } = useCrafting();
    const { preferences } = usePreferences();
    const { activeProfile } = useProfiles();
    const { marketData, allItemsDb } = useData();
    const [adding, setAdding] = useState("");
    const [recipeSearch, setRecipeSearch] = useState("");
    const deferredRecipeSearch = useDeferredValue(recipeSearch);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
    const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({});
    const [clearedQueue, setClearedQueue] = useState<Record<string, number> | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const recipeOptions = useMemo(
        () => Object.entries(ALCHEMY_ITEMS)
            .filter(([name]) => isCraftingQueueRecipe(name))
            .map(([name, recipe]) => {
                const materialNames = Object.keys(recipe.materials);
                return {
                    name,
                    recipe,
                    materialNames,
                    searchText: `${name} ${recipe.vial} ${materialNames.join(" ")} lvl ${recipe.level}`.toLowerCase(),
                };
            })
            .sort((a, b) => a.recipe.level - b.recipe.level || a.name.localeCompare(b.name)),
        [],
    );

    const filteredRecipeOptions = useMemo(() => {
        const q = deferredRecipeSearch.trim().toLowerCase();
        const matches = q
            ? recipeOptions.filter((option) => option.searchText.includes(q))
            : recipeOptions;
        return matches;
    }, [deferredRecipeSearch, recipeOptions]);

    const selectedRecipe = useMemo(
        () => recipeOptions.find((option) => option.name === adding) || null,
        [adding, recipeOptions],
    );
    const profileBarteringBoost = activeProfile ? getProfileBarteringBoost(activeProfile) : 0;

    const plan = useMemo(
        () => calculateCraftingQueuePlan(queue, marketData, allItemsDb, {
            ...preferences,
            barteringBoost: profileBarteringBoost,
        }),
        [allItemsDb, marketData, preferences, profileBarteringBoost, queue],
    );

    const recipeTypeCount = plan.entries.length;
    const missingItemCount = plan.missingItems.length;
    const profitableEntryCount = plan.entries.filter((entry) => entry.totalProfit >= 0).length;
    const warningEntryCount = plan.entries.filter((entry) => entry.warnings.length > 0).length;
    const bestEntry = plan.entries.length > 0
        ? plan.entries.reduce((best, entry) => (entry.totalProfit > best.totalProfit ? entry : best), plan.entries[0])
        : null;
    const marketNetPercent = Math.round(getMarketTaxMultiplier(preferences.membership) * 100);
    const queueReadiness = missingItemCount > 0
        ? `${missingItemCount.toLocaleString()} price gap${missingItemCount === 1 ? "" : "s"}`
        : plan.entries.length > 0
            ? "Ready to shop"
            : "Waiting for recipes";
    const itemImages = useMemo(() => (allItemsDb || {}) as Record<string, CraftingItemRecord>, [allItemsDb]);
    const getItemImage = (name: string) => itemImages[name]?.image_url || itemImages[name]?.image || "";

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) {
                setPickerOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    useEffect(() => {
        setActiveRecipeIndex(0);
    }, [deferredRecipeSearch]);

    useEffect(() => {
        return () => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        };
    }, []);

    const chooseRecipe = (name: string) => {
        if (!isCraftingQueueRecipe(name)) return;
        setAdding(name);
        setRecipeSearch(name);
        setPickerOpen(false);
    };

    const clearRecipePicker = () => {
        setAdding("");
        setRecipeSearch("");
        setPickerOpen(true);
        inputRef.current?.focus();
    };

    const updateRecipeSearch = (value: string) => {
        setRecipeSearch(value);
        setPickerOpen(true);
        const exact = recipeOptions.find((option) => option.name.toLowerCase() === value.trim().toLowerCase());
        setAdding(exact?.name || "");
    };

    const handleRecipeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setPickerOpen(true);
            setActiveRecipeIndex((index) => Math.min(index + 1, Math.max(filteredRecipeOptions.length - 1, 0)));
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setPickerOpen(true);
            setActiveRecipeIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            const activeOption = filteredRecipeOptions[activeRecipeIndex];
            if (pickerOpen && activeOption && activeOption.name !== adding) {
                chooseRecipe(activeOption.name);
                return;
            }
            if (adding) {
                addRecipe(adding);
                return;
            }
            if (filteredRecipeOptions.length === 1) {
                addRecipe(filteredRecipeOptions[0].name);
            }
            return;
        }

        if (event.key === "Escape") {
            setPickerOpen(false);
        }
    };

    const addRecipe = (name: string) => {
        if (!name || !isCraftingQueueRecipe(name)) return;
        addToQueue(name);
        setAdding("");
        setRecipeSearch("");
        setPickerOpen(false);
        setClearedQueue(null);
    };

    const updateQuantityDraft = (name: string, value: string) => {
        if (!/^\d*$/.test(value)) return;
        setQtyDrafts((current) => ({ ...current, [name]: value }));
    };

    const commitQuantityDraft = (name: string, fallback: number) => {
        const draft = qtyDrafts[name];
        setQtyDrafts((current) => {
            const next = { ...current };
            delete next[name];
            return next;
        });
        if (draft === undefined || draft.trim() === "") return;
        const parsed = Number(draft);
        setQueueQty(name, Number.isFinite(parsed) ? parsed : fallback);
    };

    const handleClearQueue = () => {
        const previousQueue = { ...queue };
        if (Object.keys(previousQueue).length === 0) return;
        clearQueue();
        setQtyDrafts({});
        setClearedQueue(previousQueue);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setClearedQueue(null), 9000);
    };

    const undoClearQueue = () => {
        if (!clearedQueue) return;
        clearQueue();
        Object.entries(clearedQueue).forEach(([name, qty]) => addToQueue(name, qty));
        setClearedQueue(null);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };

    return (
        <main className="container crafting-page-shell" aria-label="Crafting Queue">
            <div className="header craft-hero">
                <div className="craft-hero-copy">
                    <div className="craft-eyebrow">Alchemy Batch Planner</div>
                    <h1 className="header-title craft-title">
                        <ZenithIcon name="crafting" size={24} style={{ color: "var(--text-accent)" }} /> Crafting Queue
                    </h1>
                    <p className="craft-subtitle">Plan recipe copies, vials, materials, and sale paths before committing to a long craft.</p>
                    <div className="craft-context-chips" aria-label="Crafting queue context">
                        <span>{activeProfile ? `${activeProfile.name || "Active profile"} synced` : "Global queue"}</span>
                        <span>{marketNetPercent}% market net</span>
                        <span>{profileBarteringBoost}% bartering</span>
                    </div>
                </div>
                <div className="header-status craft-count-pill">
                    <div className="status-dot" aria-hidden="true"></div>
                    <span className="mono">{plan.totalCrafts.toLocaleString()} crafts queued</span>
                </div>
            </div>

            <section className="craft-summary-grid" aria-label="Crafting queue summary">
                <div className="craft-summary-card">
                    <span>Crafts</span>
                    <strong>{plan.totalCrafts.toLocaleString()}</strong>
                    <small>{recipeTypeCount.toLocaleString()} recipe type{recipeTypeCount === 1 ? "" : "s"}</small>
                </div>
                <div className="craft-summary-card">
                    <span>Inputs</span>
                    <strong>{(plan.shoppingList.length + plan.vialList.length + plan.recipeList.length).toLocaleString()}</strong>
                    <small>{queueReadiness}</small>
                </div>
                <div className={`craft-summary-card ${missingItemCount > 0 || warningEntryCount > 0 ? "warn" : ""}`}>
                    <span>Risk</span>
                    <strong>{warningEntryCount > 0 ? warningEntryCount.toLocaleString() : missingItemCount > 0 ? missingItemCount.toLocaleString() : "Clear"}</strong>
                    <small>{warningEntryCount > 0 ? "review sale warnings" : missingItemCount > 0 ? "missing price data" : "pricing looks complete"}</small>
                </div>
                <div className={`craft-summary-card ${plan.totalProfit >= 0 ? "positive" : "negative"}`}>
                    <span>Net Position</span>
                    <strong>{formatSignedGold(plan.totalProfit)}</strong>
                    <small>{bestEntry ? `Best: ${bestEntry.name}` : `${profitableEntryCount.toLocaleString()} profitable`}</small>
                </div>
            </section>

            <div className="main-craft-layout">
                <div className="craft-stack">
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
                                        aria-expanded={pickerOpen}
                                        aria-controls={pickerOpen ? "craft-recipe-options" : undefined}
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
                                <Plus size={16} /> {selectedRecipe ? `Add ${selectedRecipe.name}` : "Add"}
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

                    <div className="table-container craft-panel">
                        <h3 className="craft-panel-title">
                            <span><Clock3 size={14} /> Craft Queue</span>
                            <em>{plan.totalCrafts.toLocaleString()} crafts</em>
                        </h3>
                        {plan.entries.length === 0 ? (
                            <div className="craft-empty-state">
                                <FlaskConical size={28} aria-hidden="true" />
                                <strong>Queue is empty</strong>
                                <span>Add recipes above to start planning your batch.</span>
                            </div>
                        ) : (
                            <div className="craft-queue-list">
                                {plan.entries.map((entry) => (
                                    <div key={entry.name} className="craft-entry-row">
                                        <button
                                            type="button"
                                            onClick={() => openItemByName(entry.name)}
                                            onMouseEnter={() => prefetchItem(entry.name)}
                                            className="craft-row-main group"
                                        >
                                            {getItemImage(entry.name) ? (
                                                <img className="craft-row-image" src={getItemImage(entry.name)} alt="" loading="lazy" decoding="async" />
                                            ) : (
                                                <span className="craft-row-image craft-row-image-fallback" aria-hidden="true">
                                                    <FlaskConical size={17} />
                                                </span>
                                            )}
                                            <div className="craft-row-title group-hover:text-accent">{entry.name}</div>
                                            <div className="craft-row-meta">
                                                <span className={`craft-row-profit ${entry.totalProfit >= 0 ? "profit-positive" : "profit-negative"}`}>{formatSignedGold(entry.totalProfit)} total</span>
                                                <span>{formatSaleSource(entry.bestSaleSource)}</span>
                                                {entry.warnings.length > 0 && <span>{entry.warnings[0]}</span>}
                                            </div>
                                        </button>
                                        <div className="craft-row-controls">
                                            <button
                                                type="button"
                                                aria-label={`Decrease ${entry.name} quantity`}
                                                onClick={() => setQueueQty(entry.name, entry.quantity - 1)}
                                                className="queue-icon-button"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <input
                                                aria-label={`${entry.name} quantity`}
                                                inputMode="numeric"
                                                type="text"
                                                value={qtyDrafts[entry.name] ?? String(entry.quantity)}
                                                min={1}
                                                onFocus={() => setQtyDrafts((current) => ({ ...current, [entry.name]: String(entry.quantity) }))}
                                                onChange={event => updateQuantityDraft(entry.name, event.target.value)}
                                                onBlur={() => commitQuantityDraft(entry.name, entry.quantity)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.currentTarget.blur();
                                                    }
                                                    if (event.key === "Escape") {
                                                        setQtyDrafts((current) => {
                                                            const next = { ...current };
                                                            delete next[entry.name];
                                                            return next;
                                                        });
                                                        event.currentTarget.blur();
                                                    }
                                                }}
                                                className="queue-qty-input"
                                            />
                                            <button
                                                type="button"
                                                aria-label={`Increase ${entry.name} quantity`}
                                                onClick={() => setQueueQty(entry.name, entry.quantity + 1)}
                                                className="queue-icon-button"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${entry.name} from queue`}
                                            onClick={() => setQueueQty(entry.name, 0)}
                                            className="queue-remove-button"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    aria-label="Clear all recipes from crafting queue"
                                    onClick={handleClearQueue}
                                    className="craft-clear-button"
                                >
                                    <Trash2 size={13} /> Clear All
                                </button>
                            </div>
                        )}
                        {clearedQueue && (
                            <div className="craft-undo-toast" role="status" aria-live="polite">
                                <span>Crafting queue cleared.</span>
                                <button type="button" onClick={undoClearQueue}>Undo</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="craft-stack">
                    <div className="stats-grid craft-finance-grid">
                        <div className="stat-card">
                            <div className="stat-label">Total Cost</div>
                            <div className="stat-value mono" style={{ color: "var(--text-danger)" }}>
                                {formatGold(plan.totalCost)}g
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Best Revenue</div>
                            <div className="stat-value mono">{formatGold(plan.totalRevenue)}g</div>
                        </div>
                        <div className={`stat-card ${plan.totalProfit >= 0 ? "highlight" : ""}`}>
                            <div className="stat-label">Net Profit</div>
                            <div className={`stat-value mono ${plan.totalProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                                {formatSignedGold(plan.totalProfit)}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Profitable</div>
                            <div className="stat-value mono">
                                {profitableEntryCount.toLocaleString()} / {Math.max(recipeTypeCount, 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {plan.missingItems.length > 0 && (
                        <div className="table-container craft-panel craft-missing-panel">
                            <div className="craft-warning-copy">
                                <AlertTriangle size={16} color="var(--text-warning)" />
                                <div>
                                    <strong>Missing price data</strong>
                                    <div className="craft-missing-chip-list" aria-label="Items missing price data">
                                        {plan.missingItems.map((item) => (
                                            <button key={item} type="button" onClick={() => openItemByName(item)} onMouseEnter={() => prefetchItem(item)}>
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {plan.recipeList.length > 0 && (
                        <NeedPanel
                            title="RECIPES NEEDED"
                            icon={<ReceiptText size={14} />}
                            rows={plan.recipeList}
                            renderSubline={(row) => `${row.maxUses} uses each - covers ${row.craftQuantity.toLocaleString()} crafts`}
                            getItemImage={getItemImage}
                            openItemByName={openItemByName}
                            prefetchItem={prefetchItem}
                        />
                    )}

                    {plan.vialList.length > 0 && (
                        <NeedPanel
                            title="VIALS NEEDED"
                            icon={<Package size={14} />}
                            rows={plan.vialList}
                            getItemImage={getItemImage}
                            openItemByName={openItemByName}
                            prefetchItem={prefetchItem}
                        />
                    )}

                    <NeedPanel
                        title="SHOPPING LIST"
                        icon={<ShoppingCart size={14} />}
                        rows={plan.shoppingList}
                        emptyText="Your shopping list will appear here once you add recipes."
                        footerLabel="Materials Total"
                        getItemImage={getItemImage}
                        openItemByName={openItemByName}
                        prefetchItem={prefetchItem}
                    />
                </div>
            </div>

            <style jsx global>{`
                .crafting-page-shell {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    overflow-x: clip;
                    padding-bottom: 5rem;
                    -webkit-tap-highlight-color: transparent;
                }

                .crafting-page-shell :where(button, input, [role="button"]) {
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                }

                .crafting-page-shell button {
                    -webkit-appearance: none;
                    appearance: none;
                    font: inherit;
                }

                .crafting-page-shell .craft-hero {
                    align-items: flex-start;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    gap: 1rem;
                    margin-bottom: 0;
                    padding-bottom: 1.25rem;
                }

                .craft-hero-copy {
                    min-width: 0;
                }

                .craft-eyebrow {
                    color: var(--text-accent);
                    font-size: 0.72rem;
                    font-weight: 900;
                    letter-spacing: 0.12em;
                    margin-bottom: 0.45rem;
                    text-transform: uppercase;
                }

                .crafting-page-shell .craft-title {
                    font-size: clamp(2rem, 4vw, 2.75rem);
                    font-weight: 950;
                    letter-spacing: 0;
                    line-height: 1.04;
                    margin: 0;
                    text-transform: none;
                    text-wrap: balance;
                }

                .craft-subtitle {
                    color: var(--text-muted);
                    font-size: 0.94rem;
                    line-height: 1.55;
                    margin: 0.55rem 0 0;
                    max-width: 680px;
                }

                .craft-context-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.45rem;
                    margin-top: 0.85rem;
                }

                .craft-context-chips span,
                .craft-count-pill {
                    background: rgba(255,255,255,0.035);
                    border: 1px solid rgba(255,255,255,0.075);
                    border-radius: 999px;
                    color: rgba(255,255,255,0.78);
                    font-size: 0.68rem;
                    font-weight: 900;
                    line-height: 1;
                    padding: 0.42rem 0.62rem;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                .crafting-page-shell .craft-count-pill {
                    align-items: center;
                    display: inline-flex;
                    min-height: 36px;
                }

                .craft-summary-grid {
                    display: grid;
                    gap: 0.75rem;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                }

                .craft-summary-card {
                    background: linear-gradient(180deg, rgba(255,255,255,0.038), rgba(255,255,255,0.014));
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 8px;
                    min-height: 106px;
                    overflow: hidden;
                    padding: 1rem;
                    position: relative;
                }

                .craft-summary-card::before {
                    background: linear-gradient(90deg, var(--text-accent), transparent);
                    content: "";
                    height: 2px;
                    inset: 0 0 auto;
                    opacity: 0.7;
                    position: absolute;
                }

                .craft-summary-card.warn::before {
                    background: linear-gradient(90deg, var(--text-warning), transparent);
                }

                .craft-summary-card.negative::before {
                    background: linear-gradient(90deg, var(--text-danger), transparent);
                }

                .craft-summary-card span,
                .craft-panel-title,
                .craft-panel-title span {
                    align-items: center;
                    display: flex;
                    gap: 0.45rem;
                }

                .craft-summary-card span,
                .craft-panel-title {
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    font-weight: 900;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .craft-summary-card strong {
                    color: #fff;
                    display: block;
                    font-family: var(--font-mono);
                    font-size: clamp(1.45rem, 2.4vw, 1.9rem);
                    font-weight: 950;
                    margin-top: 0.45rem;
                    overflow-wrap: anywhere;
                }

                .craft-summary-card small {
                    color: var(--text-muted);
                    display: block;
                    font-size: 0.74rem;
                    line-height: 1.35;
                    margin-top: 0.25rem;
                }

                .craft-summary-card.positive strong {
                    color: var(--text-success);
                }

                .craft-summary-card.warn strong {
                    color: #f8d586;
                }

                .craft-summary-card.negative strong {
                    color: var(--text-danger);
                }

                .crafting-page-shell .main-craft-layout {
                    align-items: start;
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.85fr);
                }

                .craft-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    min-width: 0;
                }

                .crafting-page-shell .craft-panel {
                    background:
                        linear-gradient(180deg, rgba(255,255,255,0.026), rgba(255,255,255,0.01)),
                        rgba(8,10,11,0.72);
                    border: 1px solid rgba(255,255,255,0.075);
                    border-radius: 8px;
                    box-shadow: 0 18px 48px rgba(0,0,0,0.2);
                    overflow: visible;
                    padding: 1.1rem;
                }

                .craft-panel-title {
                    justify-content: space-between;
                    margin: 0 0 1rem;
                }

                .craft-panel-title em {
                    color: var(--text-muted);
                    font-style: normal;
                    font-weight: 800;
                    letter-spacing: 0;
                    text-transform: none;
                    white-space: nowrap;
                }

                .crafting-page-shell .recipe-combobox-menu {
                    animation: craftMenuIn 180ms cubic-bezier(0.2, 0.9, 0.3, 1) both;
                    background: rgba(9,13,15,0.96);
                    border-radius: 8px;
                    box-shadow: 0 24px 70px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.025) inset;
                }

                @supports (backdrop-filter: blur(16px)) {
                    .crafting-page-shell .recipe-combobox-menu {
                        backdrop-filter: blur(18px) saturate(1.18);
                    }
                }

                @keyframes craftMenuIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.985); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .crafting-page-shell .recipe-combobox-shell {
                    min-height: 48px;
                }

                .crafting-page-shell .recipe-option-row,
                .crafting-page-shell .craft-entry-row,
                .crafting-page-shell .source-row {
                    transition: background 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
                }

                .crafting-page-shell .recipe-option-row:hover,
                .crafting-page-shell .recipe-option-row.is-active,
                .crafting-page-shell .recipe-option-row:focus-visible,
                .crafting-page-shell .source-row:hover,
                .crafting-page-shell .source-row:focus-visible {
                    transform: translateY(-1px);
                }

                .crafting-page-shell .craft-add-button {
                    background: linear-gradient(135deg, var(--text-accent), #8de8ff);
                    box-shadow: 0 12px 28px rgba(245,176,65,0.16);
                    color: #041015;
                    min-height: 48px;
                }

                .crafting-page-shell .craft-add-button:hover:not(:disabled) {
                    box-shadow: 0 16px 36px rgba(245,176,65,0.24);
                    transform: translateY(-1px);
                }

                .crafting-page-shell .craft-add-button:active:not(:disabled),
                .crafting-page-shell .queue-icon-button:active,
                .crafting-page-shell .queue-remove-button:active,
                .crafting-page-shell .craft-clear-button:active,
                .crafting-page-shell .recipe-combobox-clear:active,
                .crafting-page-shell .source-row:active,
                .crafting-page-shell .recipe-option-row:active {
                    transform: scale(0.985);
                }

                .craft-selected-recipe {
                    animation: craftCardIn 220ms ease both;
                    border-radius: 8px;
                }

                @keyframes craftCardIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .craft-empty-state {
                    align-items: center;
                    background: rgba(255,255,255,0.018);
                    border: 1px dashed color-mix(in srgb, var(--text-accent), transparent 72%);
                    border-radius: 8px;
                    color: var(--text-muted);
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                    justify-content: center;
                    min-height: 178px;
                    padding: 1.6rem;
                    text-align: center;
                }

                .craft-empty-state svg {
                    color: var(--text-accent);
                    opacity: 0.62;
                }

                .craft-empty-state strong {
                    color: #fff;
                    font-size: 1rem;
                }

                .craft-empty-state.compact {
                    min-height: 120px;
                }

                .crafting-page-shell .craft-entry-row {
                    background: rgba(255,255,255,0.022);
                    border-radius: 8px;
                }

                .crafting-page-shell .craft-row-title {
                    font-size: 0.95rem;
                    font-weight: 850;
                }

                .crafting-page-shell .craft-row-controls {
                    background: rgba(0,0,0,0.18);
                    border: 1px solid rgba(255,255,255,0.055);
                    border-radius: 8px;
                    padding: 0.25rem;
                }

                .crafting-page-shell .queue-icon-button,
                .crafting-page-shell .queue-remove-button {
                    border-radius: 8px;
                    min-height: 34px;
                    min-width: 34px;
                    transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;
                }

                .crafting-page-shell .queue-icon-button:hover,
                .crafting-page-shell .queue-remove-button:hover {
                    border-color: color-mix(in srgb, var(--text-accent), transparent 66%);
                    color: #fff;
                }

                .crafting-page-shell .queue-qty-input {
                    border-radius: 8px;
                    min-height: 34px;
                    transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
                    width: 58px;
                }

                .crafting-page-shell .queue-qty-input:focus {
                    border-color: var(--text-accent);
                    box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 84%);
                    outline: none;
                }

                .crafting-page-shell .craft-clear-button {
                    border-radius: 8px;
                    transition: border-color 180ms ease, color 180ms ease, background 180ms ease, transform 180ms ease;
                }

                .crafting-page-shell .craft-clear-button:hover {
                    background: color-mix(in srgb, var(--text-danger), transparent 92%);
                }

                .crafting-page-shell .craft-finance-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .crafting-page-shell .stat-card {
                    background: rgba(255,255,255,0.022);
                    border-radius: 8px;
                    min-width: 0;
                }

                .crafting-page-shell .stat-card:hover {
                    border-color: color-mix(in srgb, var(--text-accent), transparent 74%);
                }

                .craft-warning-copy {
                    align-items: flex-start;
                    color: var(--text-muted);
                    display: flex;
                    gap: 0.75rem;
                }

                .craft-warning-copy > svg {
                    flex: 0 0 auto;
                    margin-top: 0.1rem;
                }

                .craft-warning-copy strong {
                    color: var(--text-main);
                }

                .craft-need-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                }

                .crafting-page-shell .source-row {
                    border-radius: 8px;
                    gap: 0.75rem;
                    min-height: 52px;
                }

                .craft-need-name {
                    color: #fff;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .craft-need-price {
                    flex: 0 0 auto;
                    text-align: right;
                }

                .craft-need-price .mono {
                    font-size: 0.9rem;
                    font-weight: 850;
                }

                .craft-need-subline {
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    line-height: 1.35;
                }

                .craft-need-footer {
                    border-top: 1px solid var(--border-subtle);
                    display: flex;
                    font-weight: 700;
                    justify-content: space-between;
                    margin-top: 0.25rem;
                    padding: 0.75rem;
                }

                .text-accent {
                    color: var(--text-accent);
                }

                .text-danger {
                    color: var(--text-danger);
                }

                .crafting-page-shell :where(.recipe-combobox-clear, .recipe-option-row, .craft-add-button, .craft-clear-button, .craft-undo-toast button, .craft-missing-chip-list button, .queue-icon-button, .queue-remove-button, .source-row, .craft-row-main, .queue-qty-input):focus-visible {
                    border-color: var(--text-accent);
                    box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 82%);
                    outline: none;
                }

                @media (max-width: 1200px) {
                    .craft-summary-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    .crafting-page-shell .main-craft-layout {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 760px) {
                    .crafting-page-shell .craft-hero {
                        align-items: stretch;
                        flex-direction: column;
                    }

                    .crafting-page-shell .craft-count-pill {
                        justify-content: center;
                        width: 100%;
                    }

                    .crafting-page-shell .craft-picker {
                        align-items: stretch;
                        flex-direction: column;
                    }

                    .crafting-page-shell .craft-add-button {
                        width: 100%;
                    }

                    .crafting-page-shell .recipe-combobox-menu {
                        max-height: min(420px, 56vh);
                    }

                    .crafting-page-shell .craft-finance-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 520px) {
                    .craft-summary-grid,
                    .crafting-page-shell .craft-finance-grid {
                        grid-template-columns: 1fr;
                    }

                    .crafting-page-shell .craft-panel {
                        padding: 1rem;
                    }

                    .craft-panel-title {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 0.35rem;
                    }

                    .crafting-page-shell .craft-entry-row {
                        align-items: stretch;
                    }

                    .crafting-page-shell .craft-row-controls {
                        justify-content: space-between;
                    }

                    .crafting-page-shell .queue-qty-input {
                        flex: 1;
                        width: auto;
                    }

                    .crafting-page-shell .source-row {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .craft-need-price {
                        text-align: left;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .crafting-page-shell *,
                    .crafting-page-shell *::before,
                    .crafting-page-shell *::after {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </main>
    );
}

function NeedPanel({
    title,
    icon,
    rows,
    emptyText,
    footerLabel,
    renderSubline,
    getItemImage,
    openItemByName,
    prefetchItem,
}: {
    title: string;
    icon: ReactNode;
    rows: QueueNeedRow[] | QueueRecipeNeedRow[];
    emptyText?: string;
    footerLabel?: string;
    renderSubline?: (row: QueueRecipeNeedRow) => string;
    getItemImage: (name: string) => string;
    openItemByName: (name: string) => void;
    prefetchItem: (name: string) => void;
}) {
    const total = rows.reduce((sum, row) => sum + row.totalPrice, 0);

    return (
        <div className="table-container craft-panel craft-need-panel">
            <h3 className="craft-panel-title">
                <span>{icon} {title}</span>
                <em>{rows.length.toLocaleString()} line{rows.length === 1 ? "" : "s"}</em>
            </h3>
            {rows.length === 0 ? (
                <div className="craft-empty-state compact">
                    <Package size={22} aria-hidden="true" />
                    {emptyText || "Nothing needed for the current queue."}
                </div>
            ) : (
                <div className="craft-need-list">
                    {rows.map((row) => (
                        <button
                            type="button"
                            key={row.name}
                            onClick={() => openItemByName(row.name)}
                            onMouseEnter={() => prefetchItem(row.name)}
                            className="source-row group"
                        >
                            <div className="craft-need-main">
                                {getItemImage(row.name) ? (
                                    <img className="craft-need-image" src={getItemImage(row.name)} alt="" loading="lazy" decoding="async" />
                                ) : (
                                    <span className="craft-need-image craft-need-image-fallback" aria-hidden="true">
                                        <Package size={13} />
                                    </span>
                                )}
                                <span className="craft-need-name group-hover:text-accent transition-colors">
                                    <span className="text-muted">{row.quantity.toLocaleString()}x</span> {row.name}
                                </span>
                            </div>
                            <div className="craft-need-price">
                                <div className={`mono ${row.source === "missing" ? "text-danger" : "text-accent"}`}>
                                    {row.totalPrice > 0 ? `${formatGold(row.totalPrice)}g` : "-"}
                                </div>
                                <div className="craft-need-subline">
                                    {row.unitPrice > 0 ? `${formatGold(row.unitPrice)}g ea - ${formatPriceSource(row.source)}` : "No data"}
                                </div>
                                {renderSubline && "maxUses" in row && (
                                    <div className="craft-need-subline">{renderSubline(row)}</div>
                                )}
                            </div>
                        </button>
                    ))}
                    {footerLabel && (
                        <div className="craft-need-footer">
                            <span>{footerLabel}</span>
                            <span className="mono text-accent">{formatGold(total)}g</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatGold(value: number) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatDuration(seconds: number) {
    const wholeSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(wholeSeconds / 60);
    const remainingSeconds = wholeSeconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function formatSignedGold(value: number) {
    return `${value >= 0 ? "+" : ""}${formatGold(value)}g`;
}

function formatSaleSource(source: QueueSaleSource) {
    if (source === "custom") return "CUSTOM";
    if (source === "market") return "MARKET";
    if (source === "vendor") return "VENDOR";
    return "NO SALE";
}

function formatPriceSource(source: string) {
    if (source === "custom") return "custom";
    if (source === "vendor") return "vendor";
    if (source === "market") return "market";
    return "missing";
}
