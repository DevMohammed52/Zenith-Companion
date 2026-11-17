"use client";

import { ShieldCheck } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatGold } from "@/lib/format";
import type { ForgeState } from "../types";
import type { UseForgeLessonsReturn } from "../hooks/useForgeLessons";
import { Metric } from "./craft/ForgeControls";

function formatTimeHoursMinutes(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function ForgeHeader({
  state,
  lessons,
}: {
  state: ForgeState;
  lessons?: UseForgeLessonsReturn;
}) {
  const {
    activeProfile,
    activeProfileName,
    plan,
    activeTab,
  } = state;

  const showCraftMetrics = activeTab === "craft";
  const showLessonMetrics = activeTab === "lessons" && lessons;

  return (
    <header className={`forge-hero ${showCraftMetrics || showLessonMetrics ? "has-metrics" : "no-metrics"}`}>
      <div className="hero-copy-stack">
        <p className="eyebrow"><ZenithIcon name="forge" size={16} /> Skills</p>
        <h1 id="forge-page-title">Forge Planner</h1>
        <p className="hero-copy">
          Train skills through material lessons or plan equipment recipe crafting.
        </p>
        <div className="forge-context-chips" aria-label="Forge planner context">
          <span><ShieldCheck size={14} aria-hidden="true" /> {activeProfile ? activeProfileName : "Global settings"}</span>
        </div>
      </div>
      {showCraftMetrics && (
        <div className="hero-metrics" aria-label="Plan summary">
          <Metric label="Planned crafts" value={plan.totalCrafts.toLocaleString()} />
          <Metric label="Missing cost" value={`${formatGold(plan.totalMissingCost)}g`} />
          <Metric label="Recipe copies" value={plan.missingRecipeCopies.toLocaleString()} />
          <Metric label="Projected net" value={`${formatGold(plan.projectedNet)}g`} tone={plan.projectedNet >= 0 ? "good" : "warn"} />
        </div>
      )}
      {showLessonMetrics && (
        <div className="hero-metrics" aria-label="Lesson session summary">
          <Metric label="Forge Level" value={`Lv. ${lessons.forgeLevel}`} />
          <Metric label="Session duration" value={formatTimeHoursMinutes(lessons.sessionSummary.totalDurationSeconds)} />
          <Metric label="Projected EXP" value={`+${lessons.sessionSummary.totalForgeExp.toLocaleString()}`} />
          <Metric label="Temper gain" value={`+${lessons.sessionSummary.temperPercentGain}%`} tone="good" />
        </div>
      )}
    </header>
  );
}
