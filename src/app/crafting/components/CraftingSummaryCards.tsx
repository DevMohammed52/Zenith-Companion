"use client";

import { formatSignedGold } from "@/lib/format";
import type { UseCraftingPageStateReturn } from "../types";

export default function CraftingSummaryCards({
    state,
}: {
    state: Pick<
        UseCraftingPageStateReturn,
        | "plan"
        | "recipeTypeCount"
        | "queueReadiness"
        | "missingItemCount"
        | "warningEntryCount"
        | "profitableEntryCount"
        | "bestEntry"
    >;
}) {
    const {
        plan,
        recipeTypeCount,
        queueReadiness,
        missingItemCount,
        warningEntryCount,
        profitableEntryCount,
        bestEntry,
    } = state;

    return (
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
                <small>{warningEntryCount > 0 ? "review sale warnings" : missingItemCount > 0 ? "missing price data" : "market/vendor prices ready"}</small>
            </div>
            <div className={`craft-summary-card ${plan.totalProfit >= 0 ? "positive" : "negative"}`}>
                <span>Net Position</span>
                <strong>{formatSignedGold(plan.totalProfit)}</strong>
                <small>{bestEntry ? `Best: ${bestEntry.name}` : `${profitableEntryCount.toLocaleString()} profitable`}</small>
            </div>
        </section>
    );
}
