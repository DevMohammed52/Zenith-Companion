"use client";

import { ArrowRight, CheckCircle2, DollarSign, FastForward, Target, Zap } from "lucide-react";
import { formatGold } from "@/lib/format";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";

const TARGET_MILESTONES = [25, 50, 75, 90, 99, 100];

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${Math.floor(totalSeconds % 60)}s`;
}

export function LessonTargetGoalCard({ lessons }: { lessons: UseForgeLessonsReturn }) {
  const {
    forgeLevel,
    targetGoalLevel,
    setTargetGoalLevel,
    goalEstimate,
    fillSessionWithMaterial,
  } = lessons;

  const { expNeeded, cheapestOption, fastestOption } = goalEstimate;

  return (
    <section className="lesson-target-goal-card" aria-label="Level target estimator">
      <div className="goal-card-topbar">
        <div className="goal-title-group">
          <span className="panel-kicker"><Target size={14} aria-hidden="true" /> Level Target Estimator</span>
          <h2>Plan from Level {forgeLevel} to Goal</h2>
        </div>

        <div className="target-stepper-wrap">
          <label htmlFor="target-level-input" className="sr-only">Target Level</label>
          <span className="target-label">Target Lv:</span>
          <button
            type="button"
            className="stepper-btn small"
            onClick={() => setTargetGoalLevel(Math.max(forgeLevel + 1, targetGoalLevel - 1))}
            disabled={targetGoalLevel <= forgeLevel + 1}
            aria-label="-1 target level"
          >
            -1
          </button>
          <input
            id="target-level-input"
            type="number"
            min={forgeLevel + 1}
            max={100}
            value={targetGoalLevel}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) {
                setTargetGoalLevel(Math.min(100, Math.max(forgeLevel + 1, val)));
              }
            }}
            className="direct-number-input small"
          />
          <button
            type="button"
            className="stepper-btn small"
            onClick={() => setTargetGoalLevel(Math.min(100, targetGoalLevel + 1))}
            disabled={targetGoalLevel >= 100}
            aria-label="+1 target level"
          >
            +1
          </button>
          <div className="target-milestones" aria-label="Target level milestones">
            {TARGET_MILESTONES.filter((m) => m > forgeLevel).map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`milestone-pill mini ${targetGoalLevel === lvl ? "active" : ""}`}
                onClick={() => setTargetGoalLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="goal-exp-banner">
        <div className="exp-metric-block">
          <span className="metric-label">Experience Needed</span>
          <strong>{expNeeded.toLocaleString()} EXP</strong>
        </div>
        <div className="level-jump-badge">
          <span>Lv. {forgeLevel}</span>
          <ArrowRight size={14} aria-hidden="true" />
          <strong>Lv. {targetGoalLevel}</strong>
        </div>
      </div>

      <div className="goal-routes-grid">
        {/* Cheapest Route */}
        {cheapestOption && (
          <div className="route-card cheap-route">
            <div className="route-header">
              <span className="route-tag cheap"><DollarSign size={13} aria-hidden="true" /> Cheapest Route</span>
              <span className="route-ratio">{cheapestOption.material.goldPerExp.toFixed(2)}g / EXP</span>
            </div>
            <div className="route-body">
              <h3 className="route-mat-name">{cheapestOption.material.name}</h3>
              <p className="route-details">
                Burn <strong>{cheapestOption.quantityNeeded.toLocaleString()}x</strong>
                {" • "}
                Est. Cost: <strong className="good-val">{formatGold(cheapestOption.totalCost)}g</strong>
              </p>
              <p className="route-subtext">
                Session time: {formatTime(cheapestOption.totalDurationSeconds)}
              </p>
              {cheapestOption.material.reqLvl > forgeLevel + 10 && (
                <p className="route-subtext" style={{ color: "var(--text-accent)" }}>
                  Optimal once you reach Lv. {Math.max(1, cheapestOption.material.reqLvl - 10)}
                </p>
              )}
            </div>
            <button
              type="button"
              className="route-action-btn"
              onClick={() => fillSessionWithMaterial(cheapestOption.material.name)}
            >
              <Zap size={14} aria-hidden="true" />
              <span>Fill Session With This</span>
            </button>
          </div>
        )}

        {/* Fastest Route */}
        {fastestOption && (
          <div className="route-card fast-route">
            <div className="route-header">
              <span className="route-tag fast"><FastForward size={13} aria-hidden="true" /> Fastest Route</span>
              <span className="route-ratio">{(fastestOption.material.expPerSecond * 60).toFixed(0)} EXP / min</span>
            </div>
            <div className="route-body">
              <h3 className="route-mat-name">{fastestOption.material.name}</h3>
              <p className="route-details">
                Burn <strong>{fastestOption.quantityNeeded.toLocaleString()}x</strong>
                {" • "}
                Est. Cost: <strong>{formatGold(fastestOption.totalCost)}g</strong>
              </p>
              <p className="route-subtext">
                Session time: {formatTime(fastestOption.totalDurationSeconds)}
              </p>
              {fastestOption.material.reqLvl > forgeLevel + 10 && (
                <p className="route-subtext" style={{ color: "var(--text-accent)" }}>
                  Optimal once you reach Lv. {Math.max(1, fastestOption.material.reqLvl - 10)}
                </p>
              )}
            </div>
            <button
              type="button"
              className="route-action-btn"
              onClick={() => fillSessionWithMaterial(fastestOption.material.name)}
            >
              <Zap size={14} aria-hidden="true" />
              <span>Fill Session With This</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
