"use client";

import ZenithIcon from "@/components/icons/ZenithIcon";
import type { UseCraftingPageStateReturn } from "../types";

export default function CraftingHero({
    state,
}: {
    state: Pick<
        UseCraftingPageStateReturn,
        "activeProfile" | "marketNetPercent" | "profileBarteringBoost" | "plan"
    >;
}) {
    const { activeProfile, marketNetPercent, profileBarteringBoost, plan } = state;

    return (
        <div className="header craft-hero">
            <div className="craft-hero-copy">
                <div className="craft-eyebrow">Alchemy Batch Planner</div>
                <h1 id="crafting-page-title" className="header-title craft-title">
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
    );
}
