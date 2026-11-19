"use client";

import Link from "next/link";
import { formatAge } from "../types";

export interface DashboardHeroProps {
  timeSince: number | null;
  marketFreshness: string;
  registryCount: number;
  registryCountLabel: string;
  activeProfileLabel: string;
  profileDetail: string;
}

export function DashboardHero({
  timeSince,
  marketFreshness,
  registryCount,
  registryCountLabel,
  activeProfileLabel,
  profileDetail,
}: DashboardHeroProps) {
  return (
    <section className="command-hero">
      <div className="command-hero-copy">
        <h1>IdleMMO Companion &amp; Market Tools</h1>
        <p>Live market prices, skilling profit/hr, crafting queues, and character planners.</p>
      </div>
      <div className="command-status-grid" role="group" aria-label="App status">
        <div className="command-status-card">
          <span>Market snapshot</span>
          <strong>{formatAge(timeSince)}</strong>
          <em>{marketFreshness}</em>
        </div>
        <Link href="/items" className="command-status-card">
          <span>Item index</span>
          <strong>{registryCount.toLocaleString()}</strong>
          <em>{registryCountLabel}</em>
        </Link>
        <Link href="/profiles" className="command-status-card">
          <span>Active profile</span>
          <strong title={activeProfileLabel}>{activeProfileLabel}</strong>
          <em title={profileDetail}>{profileDetail}</em>
        </Link>
      </div>
    </section>
  );
}
