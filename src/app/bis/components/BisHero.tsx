"use client";

import React from "react";
import { Check, Gauge, Search, Shield, Sparkles, Sword } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatGold } from "../types";

export interface BisHeroProps {
  statusMessage: string;
  activeProfileName: string;
  activeStyleLabel: string;
  priorityLabel: string;
  dataSourceLabel: string;
  filteredGearCount: number;
  usableGearCount: number;
  recommendationReadinessLabel: string;
  totalRecommendedCost: number;
  focusSearch: () => void;
  showUsableRecommendations: () => void;
  jumpToComparison: () => void;
}

export function BisHero({
  statusMessage,
  activeProfileName,
  activeStyleLabel,
  priorityLabel,
  dataSourceLabel,
  filteredGearCount,
  usableGearCount,
  recommendationReadinessLabel,
  totalRecommendedCost,
  focusSearch,
  showUsableRecommendations,
  jumpToComparison,
}: BisHeroProps) {
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">{statusMessage}</div>
      <div className="header bis-hero">
        <div className="bis-hero-copy">
          <div className="eyebrow"><ZenithIcon name="shield" size={15} /> IdleMMO loadouts</div>
          <h1 id="bis-page-title" className="header-title">Combat Gear Recommender</h1>
          <p className="hero-copy">Rank weapons and armor against your saved profile levels, equipment tiers, and stat priorities.</p>
          <div className="bis-hero-chips" aria-label="Recommendation context">
            <span><Shield size={14} aria-hidden="true" /> {activeProfileName}</span>
            <span><Sword size={14} aria-hidden="true" /> {activeStyleLabel}</span>
            <span><Sparkles size={14} aria-hidden="true" /> {priorityLabel} ranking</span>
          </div>
          <div className="bis-quick-actions" aria-label="Gear recommender quick actions">
            <button type="button" onClick={focusSearch}>
              <Search size={15} aria-hidden="true" /> Search
            </button>
            <button type="button" onClick={showUsableRecommendations}>
              <Check size={15} aria-hidden="true" /> Usable
            </button>
            <button type="button" onClick={jumpToComparison}>
              <Gauge size={15} aria-hidden="true" /> Compare
            </button>
          </div>
        </div>
        <div className="hero-stat">
          <span>{dataSourceLabel}</span>
          <strong>{filteredGearCount.toLocaleString()} shown</strong>
          <div className="hero-stat-grid" aria-label="Gear recommendation summary">
            <span><small>Usable</small><b>{usableGearCount.toLocaleString()}</b></span>
            <span><small>Picks</small><b>{recommendationReadinessLabel}</b></span>
            <span><small>Set value</small><b>{formatGold(totalRecommendedCost)}</b></span>
          </div>
        </div>
      </div>
    </>
  );
}
