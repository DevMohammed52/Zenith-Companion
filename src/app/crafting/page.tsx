"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    FlaskConical,
    Minus,
    Package,
    Plus,
    ReceiptText,
    Search,
    ShoppingCart,
    Trash2,
    X,
} from "lucide-react";
import { ALCHEMY_ITEMS } from "../../constants";
import { useItemModal } from "@/context/ItemModalContext";
import { useCrafting } from "@/context/CraftingContext";
import { usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import {
    calculateCraftingQueuePlan,
    isCraftingQueueRecipe,
    type QueueNeedRow,
    type QueueRecipeNeedRow,
    type QueueSaleSource,
} from "@/lib/crafting-queue";

export default function CraftingPage() {
    const { openItemByName, prefetchItem } = useItemModal();
    const { queue, setQueueQty, addToQueue, clearQueue } = useCrafting();
    const { preferences } = usePreferences();
    const { marketData, allItemsDb } = useData();
    const [adding, setAdding] = useState("");
    const [recipeSearch, setRecipeSearch] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
    const pickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        const q = recipeSearch.trim().toLowerCase();
        const matches = q
            ? recipeOptions.filter((option) => option.searchText.includes(q))
            : recipeOptions;
        return matches.slice(0, 48);
    }, [recipeOptions, recipeSearch]);

    const selectedRecipe = useMemo(
        () => recipeOptions.find((option) => option.name === adding) || null,
        [adding, recipeOptions],
    );

    const plan = useMemo(
        () => calculateCraftingQueuePlan(queue, marketData, allItemsDb, preferences),
        [allItemsDb, marketData, preferences, queue],
    );

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
    }, [recipeSearch]);

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
            const activeOption = pickerOpen ? filteredRecipeOptions[activeRecipeIndex] : selectedRecipe;
            if (activeOption) {
                chooseRecipe(activeOption.name);
                return;
            }
            addRecipe(adding);
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
    };

    return (
        <main className="container">
            <div className="header">
                <h1 className="header-title">
                    <FlaskConical size={24} color="var(--text-accent)" /> CRAFTING QUEUE
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">{plan.totalCrafts.toLocaleString()} CRAFTS QUEUED</span>
                </div>
            </div>

            <div className="main-craft-layout">
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="table-container craft-add-panel" style={{ padding: "1.25rem" }}>
                        <h3 style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                            ADD RECIPE
                        </h3>
                        <div className="craft-picker">
                            <div className="recipe-combobox" ref={pickerRef}>
                                <div className={`recipe-combobox-shell ${pickerOpen ? "open" : ""}`}>
                                    <Search size={16} className="recipe-combobox-icon" />
                                    <input
                                        ref={inputRef}
                                        role="combobox"
                                        aria-label="Recipe to add"
                                        aria-expanded={pickerOpen}
                                        aria-controls="craft-recipe-options"
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
                                className="craft-add-button"
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    </div>

                    <div className="table-container" style={{ padding: "1.25rem" }}>
                        <h3 style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                            CRAFT QUEUE
                        </h3>
                        {plan.entries.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                Add recipes above to start planning your batch.
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
                                                type="number"
                                                value={entry.quantity}
                                                min={1}
                                                onChange={e => setQueueQty(entry.name, Math.max(1, parseInt(e.target.value) || 1))}
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
                                    onClick={() => clearQueue()}
                                    style={{ marginTop: "0.5rem", padding: "0.5rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                                >
                                    <Trash2 size={13} /> Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="stats-grid">
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
                    </div>

                    {plan.missingItems.length > 0 && (
                        <div className="table-container" style={{ padding: "1rem", borderColor: "rgba(245,158,11,0.35)" }}>
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", color: "var(--text-muted)" }}>
                                <AlertTriangle size={16} color="var(--text-warning)" style={{ marginTop: "0.1rem", flex: "0 0 auto" }} />
                                <div>
                                    <strong style={{ color: "var(--text-main)" }}>Missing price data</strong>
                                    <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>{plan.missingItems.join(", ")}</div>
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
                            openItemByName={openItemByName}
                            prefetchItem={prefetchItem}
                        />
                    )}

                    {plan.vialList.length > 0 && (
                        <NeedPanel
                            title="VIALS NEEDED"
                            icon={<Package size={14} />}
                            rows={plan.vialList}
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
                        openItemByName={openItemByName}
                        prefetchItem={prefetchItem}
                    />
                </div>
            </div>
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
    openItemByName,
    prefetchItem,
}: {
    title: string;
    icon: ReactNode;
    rows: QueueNeedRow[] | QueueRecipeNeedRow[];
    emptyText?: string;
    footerLabel?: string;
    renderSubline?: (row: QueueRecipeNeedRow) => string;
    openItemByName: (name: string) => void;
    prefetchItem: (name: string) => void;
}) {
    const total = rows.reduce((sum, row) => sum + row.totalPrice, 0);

    return (
        <div className="table-container" style={{ padding: "1.25rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {icon} {title}
            </h3>
            {rows.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {emptyText || "Nothing needed for the current queue."}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {rows.map((row) => (
                        <button
                            type="button"
                            key={row.name}
                            onClick={() => openItemByName(row.name)}
                            onMouseEnter={() => prefetchItem(row.name)}
                            className="source-row group"
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                                <Package size={13} color="var(--text-muted)" style={{ flex: "0 0 auto" }} />
                                <span className="group-hover:text-accent transition-colors" style={{ color: "#fff", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                                    <span className="text-muted">{row.quantity.toLocaleString()}x</span> {row.name}
                                </span>
                            </div>
                            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                                <div className="mono" style={{ color: row.source === "missing" ? "var(--text-danger)" : "var(--text-accent)", fontSize: "0.9rem" }}>
                                    {row.totalPrice > 0 ? `${formatGold(row.totalPrice)}g` : "-"}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    {row.unitPrice > 0 ? `${formatGold(row.unitPrice)}g ea - ${formatPriceSource(row.source)}` : "No data"}
                                </div>
                                {renderSubline && "maxUses" in row && (
                                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{renderSubline(row)}</div>
                                )}
                            </div>
                        </button>
                    ))}
                    {footerLabel && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", borderTop: "1px solid var(--border-subtle)", marginTop: "0.25rem", fontWeight: 600 }}>
                            <span>{footerLabel}</span>
                            <span className="mono" style={{ color: "var(--text-accent)" }}>{formatGold(total)}g</span>
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
