"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Flame, Play, Sparkles, Trash2, X, Zap } from "lucide-react";
import { formatGold } from "@/lib/format";
import { GoldIcon } from "@/components/GoldIcon";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import { MAX_OFFLINE_SECONDS } from "../../hooks/useForgeLessons";

function QueueItemQtyField({
  materialName,
  quantity,
  onChangeQuantity,
}: {
  materialName: string;
  quantity: number;
  onChangeQuantity: (name: string, val: number) => void;
}) {
  const [raw, setRaw] = useState(String(quantity));
  useEffect(() => {
    setRaw(String(quantity));
  }, [quantity]);

  const commit = (val: number) => {
    const clamped = Math.min(100000, Math.max(1, val));
    setRaw(String(clamped));
    onChangeQuantity(materialName, clamped);
  };

  return (
    <input
      id={`queue-qty-${materialName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
      name={`queue-qty-${materialName}`}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={raw}
      onChange={(e) => {
        const text = e.target.value.replace(/[^0-9]/g, "");
        setRaw(text);
        if (text !== "") {
          const parsed = parseInt(text, 10);
          if (!Number.isNaN(parsed)) {
            const clamped = Math.min(100000, Math.max(1, parsed));
            onChangeQuantity(materialName, clamped);
          }
        }
      }}
      onBlur={() => {
        const parsed = parseInt(raw, 10);
        const clamped = Number.isNaN(parsed) || parsed < 1 ? 1 : Math.min(100000, parsed);
        commit(clamped);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const parsed = parseInt(raw, 10);
          const clamped = Number.isNaN(parsed) || parsed < 1 ? 1 : Math.min(100000, parsed);
          commit(clamped);
        }
      }}
      className="qty-input"
      aria-label={`${materialName} quantity`}
    />
  );
}

function formatDurationHms(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatDurationSmart(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
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
    allCalculatedMaterials,
    ownedMaterials,
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
  } = sessionSummary;

  // Level-appropriate training material recommendations (no rare drops, no outgrown penalty)
  const trainingPool = (allCalculatedMaterials || visibleMaterials).filter(
    (m) =>
      m.reqLvl <= forgeLevel + 10 &&
      m.displayedEff >= 100 &&
      (m.category === "ORES" ||
        m.category === "BARS" ||
        m.category === "LOGS" ||
        m.quality === "STANDARD" ||
        m.quality === "REFINED")
  );

  const candidates = trainingPool.length > 0
    ? trainingPool
    : (allCalculatedMaterials || visibleMaterials).filter((m) => m.reqLvl <= forgeLevel + 10 && m.displayedEff >= 100);

  const cheapestRec = candidates.length > 0
    ? [...candidates].sort((a, b) => a.goldPerExp - b.goldPerExp)[0]
    : null;

  const fastestRec = candidates.length > 0
    ? [...candidates].sort((a, b) => b.expPerSecond - a.expPerSecond)[0]
    : null;

  const totalOwnedCount = Object.values(ownedMaterials || {}).reduce((acc, q) => acc + q, 0);

  const sessionSeconds = totalTargetDurationSeconds > 0 ? totalTargetDurationSeconds : 6 * 3600;
  const targetHours = Math.floor(sessionSeconds / 3600);
  const targetMins = Math.floor((sessionSeconds % 3600) / 60);
  const targetSessionLabel = targetMins > 0 ? `${targetHours}h ${targetMins}m` : `${targetHours}h`;
  const totalSessionsCount = Math.max(1, Math.ceil(totalDurationSeconds / sessionSeconds));

  if (queuedItems.length === 0) {
    return (
      <section className="lesson-queue-shell empty-queue" aria-label="Smithing lesson queue">
        <div className="empty-queue-content">
          <Flame size={32} className="empty-icon" aria-hidden="true" />
          <h2>No Materials Queued for Lesson</h2>
          <p>
            Select materials from the catalog below, or pick a recommended training material to fill your offline session.
          </p>
          <div className="empty-actions-row">
            {cheapestRec && (
              <button
                type="button"
                className="primary-action-btn"
                onClick={() => fillSessionWithMaterial(cheapestRec.name)}
                title={`Fill session with ${cheapestRec.name} (Cheapest at ${cheapestRec.goldPerExp.toFixed(2)}g/EXP)`}
              >
                <Zap size={14} aria-hidden="true" />
                <span>Fill with {cheapestRec.name} (Cheapest)</span>
              </button>
            )}
            {fastestRec && fastestRec.name !== cheapestRec?.name && (
              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => fillSessionWithMaterial(fastestRec.name)}
                title={`Fill session with ${fastestRec.name} (Fastest at ${(fastestRec.expPerSecond * 60).toFixed(0)} EXP/min)`}
              >
                <Zap size={14} aria-hidden="true" />
                <span>Fill with {fastestRec.name} (Fastest)</span>
              </button>
            )}
            <button
              type="button"
              className="ghost-action-btn"
              onClick={() => queueAllOwned()}
              disabled={totalOwnedCount <= 0}
              title={totalOwnedCount > 0 ? "Queue all tracked items from your inventory" : "No owned items tracked in Inventory Optimizer"}
            >
              <span>Queue All Owned {totalOwnedCount > 0 ? `(${totalOwnedCount.toLocaleString()})` : ""}</span>
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
          <span className="panel-kicker"><Flame size={14} aria-hidden="true" /> Active Training Queue</span>
          <h2>{queuedItems.length} {queuedItems.length === 1 ? "Item" : "Items"} in Queue</h2>
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
            aria-label="Clear Queue"
          >
            <Trash2 size={13} aria-hidden="true" />
            <span>Clear Queue</span>
          </button>
        </div>
      </div>

      {/* Progression Roadmap Overview Strip */}
      <div className="queue-roadmap-strip">
        <span className="roadmap-label">
          Progression Roadmap: <strong>{queuedItems.length} {queuedItems.length === 1 ? "Material" : "Materials"}</strong> · <strong>~{totalSessionsCount} {totalSessionsCount === 1 ? "Session" : "Sessions"}</strong> ({formatDurationSmart(totalDurationSeconds)})
        </span>
      </div>

      {/* Queued item list */}
      <div className="queue-items-list" aria-label="Queued materials">
        {queuedItems.map((item, idx) => {
          const { material, quantity, totalExp, totalDurationSeconds: itemDuration } = item;
          const itemPerSession = Math.max(1, Math.floor(sessionSeconds / material.timeSeconds));
          const itemSessions = Math.ceil(itemDuration / sessionSeconds);

          return (
            <article key={material.name} className={`queue-item-card ${material.hasPenalty ? "has-penalty" : ""}`}>
              {material.imageUrl && (
                <img
                  src={material.imageUrl}
                  alt=""
                  width={34}
                  height={34}
                  loading="lazy"
                  decoding="async"
                  className="queue-item-icon"
                />
              )}
              <div className="item-card-left">
                <div className="item-name-row">
                  <span className="step-badge">Step {idx + 1}</span>
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
                  <QueueItemQtyField
                    materialName={material.name}
                    quantity={quantity}
                    onChangeQuantity={setQueueQuantity}
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
                  <div className="metric-badge session-badge">
                    <span>Sessions</span>
                    <strong>~{itemSessions} ({targetSessionLabel})</strong>
                  </div>
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
                    <span>{itemDuration >= 86400 ? formatDurationSmart(itemDuration) : formatDurationHms(itemDuration)}</span>
                  </div>
                  <div className="metric-badge">
                    <span>Est. Cost</span>
                    <strong>
                      {formatGold(item.totalCost)}
                      <GoldIcon size={11} />
                    </strong>
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

      {/* Session Summary Drawer */}
      <div className="advanced-drawer-card">
        <button
          type="button"
          className="advanced-toggle-bar"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          <span>Session Summary</span>
          {showAdvanced ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>

        {showAdvanced && (
          <div className="advanced-drawer-body">
            {/* Top Stat Row */}
            <div className="summary-stat-grid">
              <div className="summary-stat-box">
                <span className="stat-label">Forge EXP</span>
                <strong className="stat-value highlight">+{totalForgeExp.toLocaleString()}</strong>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Strength EXP (5%)</span>
                <strong className="stat-value">+{totalStrengthExp.toLocaleString()}</strong>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Total Time &amp; Sessions</span>
                <strong className="stat-value">
                  {totalDurationSeconds >= 86400
                    ? formatDurationSmart(totalDurationSeconds)
                    : `${formatDurationHms(totalDurationSeconds)} / ${formatDurationHms(totalTargetDurationSeconds)}`}
                  <small className="sessions-sub"> (~{totalSessionsCount} sessions)</small>
                </strong>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Est. Session Cost</span>
                <strong className="stat-value">
                  {formatGold(totalCost)}
                  <GoldIcon size={13} />
                </strong>
              </div>
            </div>

            {/* Level Progression Progress Bar */}
            <div className="level-progression-panel">
              <div className="level-progression-labels">
                <span className="panel-sub-label">Projected Level</span>
                <div className="level-jump-text">
                  <span>Lv. {forgeLevel}</span>
                  <ArrowRight size={13} aria-hidden="true" />
                  <strong>Lv. {projectedLevel}</strong>
                  <span className="progress-hint">({projectedLevelProgress}% to next)</span>
                </div>
              </div>
              <div
                className="level-progress-track"
                role="progressbar"
                aria-label="Forge level progress"
                aria-valuenow={projectedLevelProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="level-progress-fill"
                  style={{ width: `${projectedLevelProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
