"use client";

import React from "react";
import { Shield, ShoppingCart, Sparkles, Target } from "lucide-react";
import {
  formatGold,
  SLOT_CONFIG,
  slotLabel,
  type CombatStyle,
  type GearType,
  type GearView,
} from "../types";

export interface BisRecommendationsProps {
  recommendationPanelRef: React.RefObject<HTMLElement | null>;
  totalRecommendedCost: number;
  recommendationReadinessLabel: string;
  priorityLabel: string;
  activeSlots: GearType[];
  recommendations: Partial<Record<GearType, GearView>>;
  activeCombatStyle: CombatStyle;
  onSelectGear: (view: GearView) => void;
}

export function BisRecommendations({
  recommendationPanelRef,
  totalRecommendedCost,
  recommendationReadinessLabel,
  priorityLabel,
  activeSlots,
  recommendations,
  activeCombatStyle,
  onSelectGear,
}: BisRecommendationsProps) {
  return (
    <section ref={recommendationPanelRef} className="recommendation-panel" aria-label="Current style picks">
      <div className="panel-title">
        <span><Sparkles size={16} /> Current Style Picks</span>
        <strong>{formatGold(totalRecommendedCost)}</strong>
      </div>
      <div className="recommendation-summary" aria-label="Recommendation readiness">
        <span><Shield size={15} aria-hidden="true" /> {recommendationReadinessLabel}</span>
        <span><Target size={15} aria-hidden="true" /> {priorityLabel} score</span>
        <span><ShoppingCart size={15} aria-hidden="true" /> {formatGold(totalRecommendedCost)} estimated</span>
      </div>
      <p className="ranking-note">Based on current levels, style, ranking priority, and base-tier stats. Compare tiers before saving.</p>
      <div className="recommendation-grid">
        {activeSlots.map((type) => {
          const view = recommendations[type];
          const multiplier = type === "DAGGER" && activeCombatStyle === "dualDaggers" ? "x2" : "";
          return (
            <button
              key={type}
              type="button"
              className="pick-card"
              aria-label={view ? `Compare ${view.item.name} for ${slotLabel(type)}` : `No eligible ${slotLabel(type)} pick`}
              onClick={() => view && onSelectGear(view)}
              disabled={!view}
            >
              <span className="slot-line">{SLOT_CONFIG[type].icon}{slotLabel(type)} {multiplier}</span>
              {view ? (
                <>
                  <strong>{view.item.name}</strong>
                  <small>{view.item.quality} | Lv.{view.requirementLevel} | Max T{view.item.max_tier || 1}</small>
                </>
              ) : (
                <strong>No eligible item</strong>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
