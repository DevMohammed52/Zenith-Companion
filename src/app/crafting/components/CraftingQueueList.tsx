"use client";

import { Clock3, FlaskConical, Minus, Plus, Trash2 } from "lucide-react";
import { formatSignedGold } from "@/lib/format";
import { formatSaleSource, type UseCraftingPageStateReturn } from "../types";
import CraftItemImage from "./CraftItemImage";

export default function CraftingQueueList({
    state,
}: {
    state: Pick<
        UseCraftingPageStateReturn,
        | "plan"
        | "qtyDrafts"
        | "clearedQueue"
        | "openItemByName"
        | "prefetchItem"
        | "getItemImage"
        | "setQueueQty"
        | "setQtyDrafts"
        | "updateQuantityDraft"
        | "commitQuantityDraft"
        | "handleClearQueue"
        | "undoClearQueue"
    >;
}) {
    const {
        plan,
        qtyDrafts,
        clearedQueue,
        openItemByName,
        prefetchItem,
        getItemImage,
        setQueueQty,
        setQtyDrafts,
        updateQuantityDraft,
        commitQuantityDraft,
        handleClearQueue,
        undoClearQueue,
    } = state;

    return (
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
                                <CraftItemImage
                                    className="craft-row-image"
                                    fallbackClassName="craft-row-image-fallback"
                                    src={getItemImage(entry.name)}
                                    size={38}
                                >
                                    <FlaskConical size={17} />
                                </CraftItemImage>
                                <div className="craft-row-title group-hover:text-accent">{entry.name}</div>
                                <div className="craft-row-meta">
                                    <span className={`craft-row-profit ${entry.totalProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                                        {formatSignedGold(entry.totalProfit)} total
                                    </span>
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
                                    onChange={(event) => updateQuantityDraft(entry.name, event.target.value)}
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
    );
}
