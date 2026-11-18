"use client";

import { ShieldCheck } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatGold } from "@/lib/format";
import { GoldIcon } from "@/components/GoldIcon";
import { useSafeProfiles } from "@/lib/profiles";
import type { ForgeState, ForgeTab } from "../types";
import type { UseForgeLessonsReturn } from "../hooks/useForgeLessons";

export function ForgeHeader({
  state,
  lessons,
  activeTab: explicitActiveTab,
  title,
}: {
  state?: Partial<ForgeState>;
  lessons?: UseForgeLessonsReturn;
  activeTab?: ForgeTab;
  title?: string;
}) {
  const profiles = useSafeProfiles();
  const profileName = state?.activeProfileName || profiles?.activeProfile?.name || "Global settings";
  const activeTab = explicitActiveTab || state?.activeTab || (lessons ? "lessons" : "craft");
  const plan = state?.plan;
  const showCraftMetrics = activeTab === "craft" && plan && plan.totalCrafts > 0;

  const headerTitle = title || "Forge Planner";

  return (
    <header className="forge-header-bar forge-hero" role="banner">
      <div className="forge-title-stack">
        <h1 id="forge-page-title" className="forge-title">
          <ZenithIcon name="forge" size={18} aria-hidden="true" />
          <span>{headerTitle}</span>
        </h1>
        <div className="forge-context-chip" aria-label="Active profile context">
          <ShieldCheck size={13} aria-hidden="true" />
          <span>{profileName}</span>
        </div>
      </div>

      {showCraftMetrics && plan && (
        <div className="craft-inline-metrics" aria-label="Plan summary">
          <span className="craft-metric-pill">
            <strong>{plan.totalCrafts.toLocaleString()}</strong> crafts
          </span>
          {plan.totalMissingCost > 0 && (
            <span className="craft-metric-pill">
              Missing: <strong>{formatGold(plan.totalMissingCost)}</strong>
              <GoldIcon size={12} />
            </span>
          )}
        </div>
      )}
    </header>
  );
}
