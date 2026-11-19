"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatGold } from "@/lib/format";
import type { SkillProfitRow } from "@/lib/skill-profit";
import type { CraftingQueuePlan } from "@/lib/crafting-queue";
import { getRankedProfitPerHour } from "../types";

export interface DashboardPriorityToolsProps {
  bestSkillRoute: SkillProfitRow | null;
  queuePlan: CraftingQueuePlan;
  housingLabel: string;
  housingDescription: string;
  forgeCraftsCount: number;
  forgeLinesLength: number;
}

export function DashboardPriorityTools({
  bestSkillRoute,
  queuePlan,
  housingLabel,
  housingDescription,
  forgeCraftsCount,
  forgeLinesLength,
}: DashboardPriorityToolsProps) {
  return (
    <section className="command-primary-grid" aria-label="Priority tools">
      <Link href="/skill-profit" className="command-priority-card command-priority-strong">
        <div className="command-card-top">
          <ZenithIcon name="skill" size={18} />
          <span>Best Skill Route</span>
        </div>
        <strong>{bestSkillRoute?.name || "Open Finder"}</strong>
        <p>
          {bestSkillRoute
            ? `${bestSkillRoute.skill} • ${formatGold(getRankedProfitPerHour(bestSkillRoute))}g/hr (${bestSkillRoute.saleSource === "vendor" ? "vendor" : "market"})`
            : "Compare gathering and crafting routes once market data loads."}
        </p>
        <ArrowRight size={16} />
      </Link>

      <Link href="/crafting" className="command-priority-card">
        <div className="command-card-top">
          <ZenithIcon name="crafting" size={18} />
          <span>Crafting Queue</span>
        </div>
        <strong>{queuePlan.totalCrafts.toLocaleString()} craft{queuePlan.totalCrafts === 1 ? "" : "s"}</strong>
        <p>{queuePlan.entries.length > 0 ? `${queuePlan.entries.length} planned item${queuePlan.entries.length === 1 ? "" : "s"}` : "Build multi-step material lists and craft batches."}</p>
        <ArrowRight size={16} />
      </Link>

      <Link href="/housing" className="command-priority-card">
        <div className="command-card-top">
          <ZenithIcon name="housing" size={18} />
          <span>Housing</span>
        </div>
        <strong>{housingLabel}</strong>
        <p>{housingDescription}</p>
        <ArrowRight size={16} />
      </Link>

      <Link href="/forge" className="command-priority-card">
        <div className="command-card-top">
          <ZenithIcon name="forge" size={18} />
          <span>Forge Planner</span>
        </div>
        <strong>{forgeCraftsCount.toLocaleString()} craft{forgeCraftsCount === 1 ? "" : "s"}</strong>
        <p>
          {forgeLinesLength > 0
            ? `${forgeLinesLength} planned recipe${forgeLinesLength === 1 ? "" : "s"}. Track scroll costs and material gaps.`
            : "Track scroll costs, material gaps, and craft margins."}
        </p>
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
