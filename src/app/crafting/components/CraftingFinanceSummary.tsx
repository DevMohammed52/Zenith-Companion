"use client";

import { AlertTriangle, Package, ReceiptText, ShoppingCart } from "lucide-react";
import { formatGold, formatSignedGold } from "@/lib/format";
import type { UseCraftingPageStateReturn } from "../types";
import NeedPanel from "./NeedPanel";

export default function CraftingFinanceSummary({
    state,
}: {
    state: Pick<
        UseCraftingPageStateReturn,
        | "plan"
        | "recipeTypeCount"
        | "profitableEntryCount"
        | "openItemByName"
        | "prefetchItem"
        | "getItemImage"
    >;
}) {
    const {
        plan,
        recipeTypeCount,
        profitableEntryCount,
        openItemByName,
        prefetchItem,
        getItemImage,
    } = state;

    return (
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
                        <AlertTriangle size={16} color="var(--text-warning)" aria-hidden="true" />
                        <div>
                            <strong>Missing price data</strong>
                            <div className="craft-missing-chip-list" aria-label="Items missing price data">
                                {plan.missingItems.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => openItemByName(item)}
                                        onMouseEnter={() => prefetchItem(item)}
                                    >
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
                    title="Recipe scrolls"
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
                    title="Vials"
                    icon={<Package size={14} />}
                    rows={plan.vialList}
                    getItemImage={getItemImage}
                    openItemByName={openItemByName}
                    prefetchItem={prefetchItem}
                />
            )}

            <NeedPanel
                title="Shopping list"
                icon={<ShoppingCart size={14} />}
                rows={plan.shoppingList}
                emptyText="Your shopping list will appear here once you add recipes."
                footerLabel="Materials Total"
                getItemImage={getItemImage}
                openItemByName={openItemByName}
                prefetchItem={prefetchItem}
            />
        </div>
    );
}
