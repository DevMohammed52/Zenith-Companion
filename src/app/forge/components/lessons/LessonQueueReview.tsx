"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Flame, Play, Sparkles, Trash2, X, Zap } from "lucide-react";
import { formatGold } from "@/lib/format";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import { calculateBankedShardsForLevel, MAX_OFFLINE_SECONDS } from "../../hooks/useForgeLessons";

function formatDurationHms(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function LessonQueueReview({ lessons }: { lessons: UseForgeLessonsReturn }) {
  const {
    forgeLevel,
    queuedItems,
    setQueueQuantity,
    removeFromQueue,
    clearQueue,
    sessionSummary,
    queueAllOwned,
    visibleMaterials,
    fillSessionWithMaterial,
    totalTargetDurationSeconds,
    lastReplacedQueue,
    undoFillQueue,
  } = lessons;

  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  const {
    totalForgeExp,
    totalStrengthExp,
    totalDurationSeconds,
    totalCost,
    projectedLevel,
    projectedLevelProgress,
    temperPercentGain,
    projectedShards,
    hasOverlevelWarning,
    hasRareDropWarning,
    exceedsCap,
  } = sessionSummary;

  const maxBankableShards = calculateBankedShardsForLevel(forgeLevel);

  if (queuedItems.length === 0) {
    return (
      <section className="lesson-queue-shell empty-queue" aria-label="Smithing lesson queue">
        <div className="empty-queue-content">
          <Flame size={32} className="empty-icon" aria-hidden="true" />
          <h2>No Materials Queued for Lesson</h2>
          <p>
            Select materials from the catalog or queue your bank items to calculate training duration, efficiency, and level gains.
          </p>
          <div className="empty-actions-row">
            {visibleMaterials.length > 0 && (
              <button
                type="button"
                className="primary-action-btn"
                onClick={() => fillSessionWithMaterial(visibleMaterials[0].name)}
              >
                <Zap size={14} aria-hidden="true" />
                <span>Fill Session with {visibleMaterials[0].name}</span>
              </button>
            )}
            <button
              type="button"
              className="ghost-action-btn"
              onClick={() => queueAllOwned()}
            >
              <span>Queue All Owned Materials</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-queue-shell active-queue" aria-label="Smithing lesson queue">
      <div className="queue-header-bar">
        <div className="queue-title-stack">
          <span className="panel-kicker"><Flame size={14} aria-hidden="true" /> Active Smithing Lesson</span>
          <h2>{queuedItems.length} Material{queuedItems.length === 1 ? "" : "s"} Queued</h2>
        </div>
        <div className="queue-quick-actions">
          {lastReplacedQueue && (
            <button
              type="button"
              className="ghost-action-btn"
              onClick={() => undoFillQueue()}
              style={{ marginRight: "0.5rem" }}
            >
              Undo Fill
            </button>
          )}
          <button
            type="button"
            className="clear-queue-btn"
            onClick={() => clearQueue()}
            aria-label="Clear lesson queue"
          >
            <Trash2 size={13} aria-hidden="true" />
            <span>Clear Queue</span>
          </button>
        </div>
      </div>

      {/* Queued item list */}
      <div className="queue-items-list" aria-label="Queued materials">
        {queuedItems.map((item) => {
          const { material, quantity, totalExp, totalDurationSeconds: itemDuration } = item;
          return (
            <article key={material.name} className={`queue-item-card ${material.hasPenalty ? "has-penalty" : ""}`}>
              <div className="item-card-left">
                <div className="item-name-row">
                  <strong className="item-title">{material.name}</strong>
                  {material.hasPenalty && (
                    <span className="overlevel-pill" title={`Material req level ${material.reqLvl} exceeds grace level ${forgeLevel + 10}`}>
                      <AlertTriangle size={12} aria-hidden="true" />
                      <span>Over-level</span>
                    </span>
                  )}
                  <span className={`quality-badge ${material.quality.toLowerCase()}`}>
                    {material.quality}
                  </span>
                </div>

                <div className="item-stepper-row">
                  <span className="stepper-label">Count:</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQueueQuantity(material.name, quantity - 1)}
                    aria-label={`Decrease ${material.name} quantity`}
                  >
                    -
                  </button>
                  <label htmlFor={`queue-qty-${material.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} className="sr-only">
                    {material.name} quantity
                  </label>
                  <input
                    id={`queue-qty-${material.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    name={`queue-qty-${material.name}`}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!Number.isNaN(val)) {
                        setQueueQuantity(material.name, Math.max(1, val));
                      }
                    }}
                    className="qty-input"
                    aria-label={`${material.name} quantity`}
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQueueQuantity(material.name, quantity + 1)}
                    aria-label={`Increase ${material.name} quantity`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="step-quick-pill"
                    aria-label={`Add 10 ${material.name}`}
                    onClick={() => setQueueQuantity(material.name, quantity + 10)}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    className="step-quick-pill"
                    aria-label={`Add 100 ${material.name}`}
                    onClick={() => setQueueQuantity(material.name, quantity + 100)}
                  >
                    +100
                  </button>
                </div>

                <div className="item-metric-badges">
                  <div className="metric-badge">
                    <span>Total EXP</span>
                    <strong>{Math.floor(totalExp).toLocaleString()}</strong>
                  </div>
                  <div className={`metric-badge ${material.hasPenalty ? "warn" : ""}`}>
                    <span>Efficiency</span>
                    <strong>{material.displayedEff}%</strong>
                  </div>
                  <div className="metric-badge">
                    <span>EXP / item</span>
                    <strong>{material.effectiveExp.toFixed(2)}</strong>
                  </div>
                  <div className="metric-badge">
                    <span>Duration</span>
                    <span>{formatDurationHms(itemDuration)}</span>
                  </div>
                </div>
              </div>

              <div className="item-card-right">
                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() => removeFromQueue(material.name)}
                  aria-label={`Remove ${material.name} from lesson`}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Advanced Details Toggle & Drawer */}
      <div className="advanced-drawer-card">
        <button
          type="button"
          className="advanced-toggle-bar"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          <span>Advanced Lesson Details & Projections</span>
          {showAdvanced ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>

        {showAdvanced && (
          <div className="advanced-drawer-body">
            {/* Top Stat Row */}
            <div className="summary-stat-grid">
              <div className="summary-stat-box">
                <span className="stat-label">Forge EXP</span>
                <strong className="stat-value highlight">+{totalForgeExp.toLocaleString()} ^</strong>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Strength EXP (5%)</span>
                <strong className="stat-value">+{totalStrengthExp.toLocaleString()} ^</strong>
              </div>
              <div className={`summary-stat-box ${exceedsCap ? "danger-stat" : ""}`}>
                <span className="stat-label">Duration</span>
                <strong className="stat-value">
                  {formatDurationHms(totalDurationSeconds)} / {formatDurationHms(totalTargetDurationSeconds)}
                </strong>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Temper Gain</span>
                <strong className="stat-value good">+{temperPercentGain}%</strong>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Temper Shards</span>
                <strong className="stat-value good">
                  +{projectedShards} / {maxBankableShards}
                  {temperPercentGain >= 100 ? " (Full Bar)" : temperPercentGain >= 50 ? " (Early Claim Ready)" : ""}
                </strong>
              </div>
            </div>

            {/* Level Progression Progress Bar */}
            <div className="level-progression-panel">
              <div className="level-progression-labels">
                <span className="panel-sub-label">Projected Level Gain</span>
                <div className="level-jump-text">
                  <span>Lv. {forgeLevel}</span>
                  <ArrowRight size={13} aria-hidden="true" />
                  <strong>Lv. {projectedLevel}</strong>
                  <span className="progress-hint">({projectedLevelProgress}% to next)</span>
                </div>
              </div>
              <div className="level-progress-track" role="progressbar" aria-valuenow={projectedLevelProgress} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="level-progress-fill"
                  style={{ width: `${projectedLevelProgress}%` }}
                />
              </div>
            </div>

            {/* In-game warning banners */}
            {hasOverlevelWarning && (
              <div className="in-game-warning-banner" role="alert">
                <AlertTriangle size={15} className="warn-icon" aria-hidden="true" />
                <p>
                  This lesson uses materials that are too advanced for you. They are used up once the lesson reaches them.
                </p>
              </div>
            )}

            {hasRareDropWarning && (
              <div className="in-game-warning-banner" role="alert">
                <AlertCircle size={15} className="warn-icon" aria-hidden="true" />
                <p>
                  This lesson uses rare drops. They are used up once the lesson reaches them.
                </p>
              </div>
            )}

            {exceedsCap && (
              <div className="in-game-warning-banner cap-exceeded" role="alert">
                <AlertTriangle size={15} className="warn-icon" aria-hidden="true" />
                <p>
                  Lesson duration exceeds the 12-hour offline limit ({formatDurationHms(totalDurationSeconds)} &gt; 12:00:00). IdleMMO will stop training once 12 hours elapse.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
