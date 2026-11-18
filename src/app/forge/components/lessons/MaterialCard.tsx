"use client";

import React, { memo } from "react";
import { AlertTriangle, ArrowDown, Check, Clock, ExternalLink, Package, Plus, Zap } from "lucide-react";
import { formatGold } from "@/lib/format";
import { GoldIcon } from "@/components/GoldIcon";
import type { CalculatedLessonMaterial } from "../../types";

export interface MaterialCardProps {
  mat: CalculatedLessonMaterial;
  ownedCount: number;
  inQueueCount: number;
  showExpPerItem?: boolean;
  viewMode?: "list" | "cards";
  onOpenItem: (name: string) => void;
  onAddToQueue: (name: string, count: number) => void;
  onFillSession: (name: string) => void;
  onUpdateOwned?: (name: string, quantity: number) => void;
}

function MaterialCardComponent({
  mat,
  ownedCount,
  inQueueCount,
  showExpPerItem = true,
  viewMode = "list",
  onOpenItem,
  onAddToQueue,
  onFillSession,
}: MaterialCardProps) {
  const hourlyExp = Math.round(mat.expPerSecond * 3600);

  if (viewMode === "list") {
    return (
      <article
        className={`mat-list-row ${mat.hasPenalty ? "has-penalty" : ""} ${inQueueCount > 0 ? "in-queue" : ""}`}
      >
        {/* Left Column: Avatar & Identity */}
        <div className="list-col-identity">
          {mat.imageUrl && (
            <div className="mat-icon-wrapper">
              <img
                src={mat.imageUrl}
                alt=""
                width={42}
                height={42}
                loading="lazy"
                decoding="async"
                className="mat-item-icon"
              />
            </div>
          )}
          <div className="list-identity-info">
            <div className="list-title-row">
              <button
                type="button"
                className="mat-name-btn"
                onClick={() => onOpenItem(mat.name)}
                title={`Inspect ${mat.name} details`}
              >
                <span className="mat-name-text">{mat.name}</span>
                <ExternalLink size={11} aria-hidden="true" className="external-icon" />
              </button>
              <span className={`quality-tag ${mat.quality.toLowerCase()}`}>{mat.quality}</span>
              <span className="level-tag">Lv. {mat.reqLvl}</span>
            </div>

            <div className="list-source-row">
              {mat.mob ? (
                <span className="mob-tag">Dropped by {mat.mob}</span>
              ) : (
                <span className="category-tag">{mat.category.replace("_", " ")}</span>
              )}
              {ownedCount > 0 && (
                <span className="owned-inventory-badge" title="Tracked in inventory">
                  <Package size={10} aria-hidden="true" />
                  <span>{ownedCount.toLocaleString()} owned</span>
                </span>
              )}
              {inQueueCount > 0 && (
                <span className="queued-count-strip mini">
                  <Check size={10} aria-hidden="true" />
                  <span>{inQueueCount.toLocaleString()} queued</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Training Speed, Efficiency & Hourly Yield (Fills free space) */}
        <div className="list-col-throughput">
          <div className="throughput-metric">
            <span className="metric-label">Training Rate</span>
            <span className="metric-value rate">
              <Zap size={11} aria-hidden="true" />
              <span>~{hourlyExp.toLocaleString()} EXP/hr</span>
            </span>
          </div>
          <div className="throughput-metric">
            <span className="metric-label">Burn Duration</span>
            <span className="metric-value sub">
              <Clock size={11} aria-hidden="true" />
              <span>{mat.timeSeconds}s per item</span>
            </span>
          </div>
          <div className="throughput-metric">
            <span className="metric-label">Efficiency</span>
            <span
              className={`eff-pill mini ${mat.hasPenalty ? "warn" : "full"}`}
              title={mat.warningText || (mat.hasPenalty ? "Reduced lesson efficiency" : "Full efficiency")}
            >
              {mat.hasPenalty && <AlertTriangle size={10} className="eff-warn-icon" aria-hidden="true" />}
              <span>{mat.displayedEff}%</span>
            </span>
          </div>
        </div>

        {/* Right Column: Economics & Actions */}
        <div className="list-col-economics">
          <div className="list-metrics-group">
            <div className="list-metric">
              <span className="metric-label">Price</span>
              <span className="metric-value">
                {formatGold(mat.liveMarketPrice)}
                <GoldIcon size={11} />
              </span>
            </div>
            <div className="list-metric">
              <span className="metric-label">Gold / EXP</span>
              <strong className={`metric-value ${mat.goldPerExp <= 2.5 ? "good" : ""}`}>
                {mat.goldPerExp.toFixed(2)}
                <GoldIcon size={11} />
              </strong>
            </div>
            {showExpPerItem && (
              <div className="list-metric">
                <span className="metric-label">EXP / item</span>
                <span className={`metric-value ${mat.hasPenalty ? "penalized" : ""}`}>
                  {mat.effectiveExp.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="list-actions-group">
            <button
              type="button"
              className="fill-session-btn"
              onClick={() => onFillSession(mat.name)}
              title={`Fill session duration with ${mat.name}`}
              aria-label={`Fill session with ${mat.name}`}
            >
              <Zap size={13} aria-hidden="true" />
              <span>Fill</span>
            </button>
            {ownedCount > 0 && (
              <button
                type="button"
                className="queue-owned-btn mini"
                onClick={() => onAddToQueue(mat.name, ownedCount)}
                title={`Queue all ${ownedCount} owned ${mat.name}`}
                aria-label={`Queue owned ${mat.name}`}
              >
                <Package size={12} aria-hidden="true" />
                <span>Owned ({ownedCount.toLocaleString()})</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Cards View Mode
  return (
    <article
      className={`mat-card ${mat.hasPenalty ? "has-penalty" : ""} ${inQueueCount > 0 ? "in-queue" : ""}`}
    >
      <div className="mat-card-header">
        <div className="mat-card-header-left">
          {mat.imageUrl && (
            <div className="mat-icon-wrapper">
              <img
                src={mat.imageUrl}
                alt=""
                width={42}
                height={42}
                loading="lazy"
                decoding="async"
                className="mat-card-icon"
              />
            </div>
          )}
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
        </div>

        <div className="mat-card-badges">
          <span
            className={`eff-pill ${mat.hasPenalty ? "warn" : "full"}`}
            title={mat.warningText || (mat.hasPenalty ? "Reduced lesson efficiency" : "Full efficiency")}
          >
            {mat.hasPenalty && <AlertTriangle size={11} className="eff-warn-icon" aria-hidden="true" />}
            <span>{mat.displayedEff}%</span>
          </span>
        </div>
      </div>

      <div className="card-status-badges">
        {ownedCount > 0 && (
          <span className="owned-inventory-badge" title="Tracked in inventory">
            <Package size={10} aria-hidden="true" />
            <span>{ownedCount.toLocaleString()} owned</span>
          </span>
        )}
        {inQueueCount > 0 && (
          <span className="queued-count-strip mini">
            <Check size={10} aria-hidden="true" />
            <span>{inQueueCount.toLocaleString()} queued</span>
          </span>
        )}
      </div>

      <div className="mat-metrics-grid">
        <div className="mini-metric">
          <span className="label">Training Rate</span>
          <span className="rate-val">
            <Zap size={11} aria-hidden="true" />
            <span>~{hourlyExp.toLocaleString()}/hr</span>
          </span>
        </div>
        <div className="mini-metric">
          <span className="label">Gold / EXP</span>
          <strong className={mat.goldPerExp <= 2.5 ? "good" : ""}>
            {mat.goldPerExp.toFixed(2)}
            <GoldIcon size={11} />
          </strong>
        </div>
        <div className="mini-metric">
          <span className="label">Price</span>
          <span>
            {formatGold(mat.liveMarketPrice)}
            <GoldIcon size={11} />
          </span>
        </div>
        <div className="mini-metric">
          <span className="label">EXP / item</span>
          <span className={mat.hasPenalty ? "penalized" : ""}>
            {mat.effectiveExp.toFixed(1)}
            <small className="burn-dur">({mat.timeSeconds}s)</small>
          </span>
        </div>
      </div>

      <div className="mat-actions-row">
        <button
          type="button"
          className="fill-session-btn"
          onClick={() => onFillSession(mat.name)}
          title={`Fill session duration with ${mat.name}`}
        >
          <Zap size={13} aria-hidden="true" />
          <span>Fill Session</span>
        </button>

        {ownedCount > 0 && (
          <button
            type="button"
            className="queue-owned-btn"
            onClick={() => onAddToQueue(mat.name, ownedCount)}
            title={`Add all ${ownedCount} owned ${mat.name} to lesson queue`}
            aria-label={`Queue ${ownedCount} ${mat.name}`}
          >
            <Package size={13} aria-hidden="true" />
            <span>Queue ({ownedCount.toLocaleString()})</span>
          </button>
        )}
      </div>
    </article>
  );
}

export const MaterialCard = memo(MaterialCardComponent, (prev, next) => {
  return (
    prev.mat === next.mat &&
    prev.ownedCount === next.ownedCount &&
    prev.inQueueCount === next.inQueueCount &&
    prev.showExpPerItem === next.showExpPerItem &&
    prev.viewMode === next.viewMode
  );
});
