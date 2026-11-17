"use client";

import React, { memo } from "react";
import { AlertTriangle, ArrowDown, Check, ExternalLink, Package, Zap } from "lucide-react";
import { formatGold } from "@/lib/format";
import type { CalculatedLessonMaterial } from "../../types";

export interface MaterialCardProps {
  mat: CalculatedLessonMaterial;
  ownedCount: number;
  inQueueCount: number;
  showExpPerItem: boolean;
  onOpenItem: (name: string) => void;
  onAddToQueue: (name: string, count: number) => void;
  onFillSession: (name: string) => void;
  onUpdateOwned: (name: string, quantity: number) => void;
}

function MaterialCardComponent({
  mat,
  ownedCount,
  inQueueCount,
  showExpPerItem,
  onOpenItem,
  onAddToQueue,
  onFillSession,
  onUpdateOwned,
}: MaterialCardProps) {
  const inputId = `owned-mat-${mat.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <article
      className={`mat-card ${mat.hasPenalty ? "has-penalty" : ""} ${inQueueCount > 0 ? "in-queue" : ""}`}
    >
      <div className="mat-card-header">
        <div className="mat-title-stack">
          <button
            type="button"
            className="mat-name-btn"
            onClick={() => onOpenItem(mat.name)}
            title={`Inspect ${mat.name} details`}
          >
            <span className="mat-name-text">{mat.name}</span>
            <ExternalLink size={11} aria-hidden="true" className="external-icon" />
          </button>
          <div className="mat-meta-tags">
            <span className={`quality-tag ${mat.quality.toLowerCase()}`}>{mat.quality}</span>
            <span className="level-tag">Lv. {mat.reqLvl}</span>
            {mat.mob && <span className="mob-tag">{mat.mob}</span>}
          </div>
        </div>

        <div className="mat-card-badges">
          {ownedCount > 0 && (
            <span className="owned-inventory-badge" title="Tracked in inventory">
              <Package size={10} aria-hidden="true" />
              <span>{ownedCount.toLocaleString()}</span>
            </span>
          )}
          <span
            className={`eff-pill ${mat.hasPenalty ? "warn" : "full"}`}
            title={mat.warningText || (mat.hasPenalty ? "Reduced lesson efficiency" : "Full efficiency")}
          >
            {mat.hasPenalty && <AlertTriangle size={11} className="eff-warn-icon" aria-hidden="true" />}
            <span>{mat.displayedEff}% eff</span>
          </span>
        </div>
      </div>

      {showExpPerItem && (
        <div className="mat-exp-row">
          <span className="exp-label">Lesson EXP:</span>
          <strong className={`exp-val ${mat.hasPenalty ? "penalized" : ""}`}>
            {mat.hasPenalty && <ArrowDown size={12} className="penalty-chevron" aria-hidden="true" />}
            {mat.effectiveExp.toFixed(2)}
          </strong>
          <span className="burn-time-label">({mat.timeSeconds}s burn)</span>
        </div>
      )}

      <div className="mat-metrics-grid">
        <div className="mini-metric">
          <span className="label">Gold / EXP</span>
          <strong className={mat.goldPerExp <= 2.5 ? "good" : ""}>
            {mat.goldPerExp.toFixed(2)}g
          </strong>
        </div>
        <div className="mini-metric">
          <span className="label">Market Price</span>
          <span>{formatGold(mat.liveMarketPrice)}g</span>
        </div>
        <div className="mini-metric">
          <span className="label">EXP / min</span>
          <span>{(mat.expPerSecond * 60).toFixed(0)}</span>
        </div>
      </div>

      <div className="mat-owned-row">
        <div className="mat-owned-label-group">
          <Package size={12} aria-hidden="true" />
          <label htmlFor={inputId} className="owned-label">In Inventory:</label>
        </div>
        <div className="mat-owned-controls">
          <input
            id={inputId}
            name={inputId}
            type="number"
            min={0}
            value={ownedCount || ""}
            placeholder="0"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdateOwned(mat.name, Number.isNaN(val) ? 0 : Math.max(0, val));
            }}
            className="card-owned-input"
            aria-label={`Owned quantity for ${mat.name}`}
          />
        </div>
      </div>

      <div className="mat-actions-row">
        {ownedCount > 0 && (
          <button
            type="button"
            className="queue-owned-btn"
            onClick={() => onAddToQueue(mat.name, ownedCount)}
            title={`Add all ${ownedCount} owned ${mat.name} to lesson queue`}
            aria-label={`Queue ${ownedCount} ${mat.name}`}
          >
            <Package size={13} aria-hidden="true" />
            <span>Queue Owned ({ownedCount.toLocaleString()})</span>
          </button>
        )}

        <button
          type="button"
          className="max-session-btn"
          onClick={() => onFillSession(mat.name)}
          title={`Fill entire target session duration with ${mat.name}`}
        >
          <Zap size={13} aria-hidden="true" />
          <span>Max Session</span>
        </button>
      </div>

      {inQueueCount > 0 && (
        <div className="queued-count-strip">
          <Check size={12} aria-hidden="true" />
          <span>{inQueueCount.toLocaleString()} queued in lesson</span>
        </div>
      )}
    </article>
  );
}

export const MaterialCard = memo(MaterialCardComponent, (prev, next) => {
  return (
    prev.mat === next.mat &&
    prev.ownedCount === next.ownedCount &&
    prev.inQueueCount === next.inQueueCount &&
    prev.showExpPerItem === next.showExpPerItem
  );
});
