"use client";

import React from "react";
import { ExternalLink, Gauge, Layers, Shield, ShoppingCart } from "lucide-react";
import { getQualityTextStyle } from "@/lib/quality";
import { formatStatName } from "@/lib/profile-calculations";
import type { CharacterProfile } from "@/lib/profiles";
import { Metric, TierStepper } from "./BisPrimitives";
import {
  formatGold,
  slotLabel,
  type CombatStyle,
  type GearItem,
  type GearType,
  type GearView,
  type StatComparison,
} from "../types";

export interface BisComparePanelProps {
  comparePanelRef: React.RefObject<HTMLElement | null>;
  selected: GearView | null;
  effectiveCandidateTier: number;
  selectedMaxTier: number;
  candidateTier: number | "";
  setCandidateTier: (value: number | "") => void;
  currentProfileItem: GearItem | undefined;
  compareTier: number | "";
  setCompareTier: (value: number | "") => void;
  currentMaxTier: number;
  effectiveCompareTier: number;
  comparisonTone: "neutral" | "positive" | "negative";
  selectedDeltaTotal: number;
  comparisonSummaryLabel: string;
  statComparison: StatComparison[];
  openItemByName: (name: string) => void;
  activeProfile: CharacterProfile | null;
  selectedType: GearType | undefined;
  activeCombatStyle: CombatStyle;
  selectedProfileSlot: string;
  saveGearToProfile: (slot: string) => void;
}

export function BisComparePanel({
  comparePanelRef,
  selected,
  effectiveCandidateTier,
  selectedMaxTier,
  candidateTier,
  setCandidateTier,
  currentProfileItem,
  compareTier,
  setCompareTier,
  currentMaxTier,
  effectiveCompareTier,
  comparisonTone,
  selectedDeltaTotal,
  comparisonSummaryLabel,
  statComparison,
  openItemByName,
  activeProfile,
  selectedType,
  activeCombatStyle,
  selectedProfileSlot,
  saveGearToProfile,
}: BisComparePanelProps) {
  return (
    <aside ref={comparePanelRef} className="compare-panel" aria-label="Selected gear comparison">
      {selected ? (
        <>
          <div className="compare-head">
            <img src={selected.item.image_url || "/favicon.ico"} alt="" width={48} height={48} loading="eager" decoding="async" />
            <div>
              <span style={getQualityTextStyle(selected.item.quality)}>{selected.item.quality}</span>
              <h2>{selected.item.name}</h2>
              <p>{slotLabel(selected.item.type)} | Level {selected.requirementLevel} | {selected.priceLabel}</p>
            </div>
          </div>

          <div className="compare-stats compact">
            <Metric icon={<Layers size={16} />} label="Tier" value={`T${effectiveCandidateTier}/${selectedMaxTier}`} />
            <Metric icon={<Gauge size={16} />} label="Level" value={`Lv.${selected.requirementLevel}`} />
            <Metric icon={<ShoppingCart size={16} />} label="Value" value={formatGold(selected.price)} />
            <Metric icon={<Shield size={16} />} label="Status" value={selected.eligible ? "Usable" : "Locked"} />
          </div>

          <div className="tier-compare-grid">
            <TierStepper
              label="Candidate tier"
              value={candidateTier}
              max={selectedMaxTier}
              onChange={setCandidateTier}
            />
            {currentProfileItem ? (
              <TierStepper
                label="Saved gear tier"
                value={compareTier}
                max={currentMaxTier}
                onChange={setCompareTier}
              />
            ) : (
              <div className="compare-empty-chip" role="note">
                <span>Saved gear tier</span>
                <strong>No saved item</strong>
                <small>Save gear in this slot to compare tiers.</small>
              </div>
            )}
          </div>

          {!selected.eligible && (
            <div className="notice danger">
              Needs {selected.unmet.join(", ")}
            </div>
          )}

          <div className="current-box">
            <span>Profile comparison</span>
            <strong>{currentProfileItem ? currentProfileItem.name : "No saved item"}</strong>
            <small>{currentProfileItem ? `${slotLabel(currentProfileItem.type)} | T${effectiveCompareTier}/${currentMaxTier}` : "No profile gear saved in this slot yet."}</small>
          </div>

          <div className={`compare-result-strip ${comparisonTone}`} aria-label="Net stat comparison">
            <span>Net stat delta</span>
            <strong>{currentProfileItem ? `${selectedDeltaTotal > 0 ? "+" : ""}${selectedDeltaTotal.toLocaleString()}` : "No baseline"}</strong>
            <small>{comparisonSummaryLabel}</small>
          </div>

          <div className="stat-compare-table">
            <div className="stat-compare-head">
              <span>Stat</span>
              <span>Selected</span>
              <span>Saved</span>
              <span>Delta</span>
            </div>
            {statComparison.map((entry) => (
              <div key={entry.key}>
                <span>{formatStatName(entry.key)}</span>
                <strong>{entry.candidate.toLocaleString()}</strong>
                <strong>{entry.current.toLocaleString()}</strong>
                <strong className={entry.delta >= 0 ? "positive" : "negative"}>{entry.delta > 0 ? "+" : ""}{entry.delta.toLocaleString()}</strong>
              </div>
            ))}
          </div>

          <div className="action-row">
            <button type="button" onClick={() => openItemByName(selected.item.name)}>
              Item details <ExternalLink size={14} />
            </button>
            {activeProfile && selectedType === "DAGGER" && activeCombatStyle === "dualDaggers" ? (
              <>
                <button type="button" disabled={!selected.eligible} onClick={() => saveGearToProfile("weapon")}>Save main</button>
                <button type="button" disabled={!selected.eligible} onClick={() => saveGearToProfile("offhandWeapon")}>Save offhand</button>
              </>
            ) : activeProfile && selectedProfileSlot ? (
              <button type="button" disabled={!selected.eligible} onClick={() => saveGearToProfile(selectedProfileSlot)}>Save to profile</button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="empty-state">Select a gear item to compare it.</div>
      )}
    </aside>
  );
}
