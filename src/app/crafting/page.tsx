"use client";

import { useCraftingPageState } from "./hooks/useCraftingPageState";
import CraftingStyles from "./components/CraftingStyles";
import CraftingHero from "./components/CraftingHero";
import CraftingSummaryCards from "./components/CraftingSummaryCards";
import CraftingRecipePicker from "./components/CraftingRecipePicker";
import CraftingQueueList from "./components/CraftingQueueList";
import CraftingFinanceSummary from "./components/CraftingFinanceSummary";

export default function CraftingPage() {
    const state = useCraftingPageState();

    return (
        <main className="container crafting-page-shell" aria-labelledby="crafting-page-title">
            <CraftingHero state={state} />
            <CraftingSummaryCards state={state} />

            <div className="main-craft-layout">
                <div className="craft-stack">
                    <CraftingRecipePicker state={state} />
                    <CraftingQueueList state={state} />
                </div>
                <CraftingFinanceSummary state={state} />
            </div>

            <CraftingStyles />
        </main>
    );
}
