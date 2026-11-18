"use client";

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Compass, DollarSign, FastForward, Layers, Sparkles } from "lucide-react";
import { formatGold } from "@/lib/format";
import { GoldIcon } from "@/components/GoldIcon";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import type { GoalProgressionStep } from "../../types";

function formatLongDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const totalMinutes = Math.floor(totalSeconds / 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    if (remainingMinutes > 0) {
      return `${days}d ${remainingHours}h ${remainingMinutes}m`;
    }
    return `${days}d ${remainingHours}h`;
  }
  if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m ${Math.floor(totalSeconds % 60)}s`;
}

export function LessonTargetGoalCard({ lessons }: { lessons: UseForgeLessonsReturn }) {
  const {
    forgeLevel,
    targetGoalLevel,
    setTargetGoalLevel,
    goalEstimate,
    addToQueue,
  } = lessons;

  const {
    expNeeded,
    cheapestOption,
    bestOption,
    fastestOption,
    cheapestSteps = [],
    bestSteps = [],
    fastestSteps = [],
    totalCheapestCost = 0,
    totalBestCost = 0,
    totalFastestCost = 0,
    totalCheapestDurationSeconds = 0,
    totalBestDurationSeconds = 0,
    totalFastestDurationSeconds = 0,
  } = goalEstimate;

  const isMaxLevel = forgeLevel >= 100;

  const [rawTargetStr, setRawTargetStr] = useState(String(targetGoalLevel));
  useEffect(() => {
    setRawTargetStr(String(targetGoalLevel));
  }, [targetGoalLevel]);

  const applyPathToQueue = (steps: GoalProgressionStep[]) => {
    for (const step of steps) {
      if (step.material?.name && step.quantityNeeded > 0) {
        addToQueue(step.material.name, step.quantityNeeded);
      }
    }
  };

  const routes = [
    {
      key: "cheapest" as const,
      tagClass: "cheap",
      icon: DollarSign,
      title: "Cheapest Route",
      subtitle: "Lowest Gold Cost",
      option: cheapestOption,
      steps: cheapestSteps,
      totalCost: totalCheapestCost || cheapestOption?.totalCost || 0,
      totalDurationSeconds: totalCheapestDurationSeconds || cheapestOption?.totalDurationSeconds || 0,
    },
    {
      key: "best" as const,
      tagClass: "best",
      icon: Sparkles,
      title: "Balanced Route",
      subtitle: "Optimal Speed & Cost",
      option: bestOption || cheapestOption,
      steps: bestSteps.length > 0 ? bestSteps : cheapestSteps,
      totalCost: totalBestCost || bestOption?.totalCost || totalCheapestCost || 0,
      totalDurationSeconds: totalBestDurationSeconds || bestOption?.totalDurationSeconds || totalCheapestDurationSeconds || 0,
    },
    {
      key: "fastest" as const,
      tagClass: "fast",
      icon: FastForward,
      title: "Fastest Route",
      subtitle: "Maximum EXP Speed",
      option: fastestOption,
      steps: fastestSteps,
      totalCost: totalFastestCost || fastestOption?.totalCost || 0,
      totalDurationSeconds: totalFastestDurationSeconds || fastestOption?.totalDurationSeconds || 0,
    },
  ];

  return (
    <section className="lesson-target-goal-card" aria-label="Level target estimator">
      <div className="goal-card-topbar">
        <div className="goal-title-group">
          <span className="panel-kicker"><Compass size={14} aria-hidden="true" /> Progression Routes <span className="sr-only">Level Target Estimator</span></span>
          <h2>Training Plan: Lv. {forgeLevel} to {targetGoalLevel}</h2>
        </div>

        {!isMaxLevel && (
          <div className="target-stepper-wrap">
            <div className="target-direct-group">
              <label htmlFor="target-level-input" className="sr-only">Target Level</label>
              <span className="target-label">Target Lv:</span>
              <div className="stepper-wrap compact">
                <button
                  type="button"
                  className="stepper-btn mini"
                  onClick={() => {
                    const next = Math.max(forgeLevel + 1, targetGoalLevel - 1);
                    setTargetGoalLevel(next);
                    setRawTargetStr(String(next));
                  }}
                  disabled={targetGoalLevel <= forgeLevel + 1}
                  aria-label="Decrease target level"
                >
                  -
                </button>
                <div className="number-display-wrap compact">
                  <span className="level-prefix">Lv.</span>
                  <input
                    id="target-level-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={rawTargetStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setRawTargetStr(raw);
                      if (raw !== "") {
                        const parsed = parseInt(raw, 10);
                        if (!Number.isNaN(parsed)) {
                          const clamped = Math.min(100, parsed);
                          if (clamped >= forgeLevel + 1) {
                            setTargetGoalLevel(clamped);
                          }
                        }
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(rawTargetStr, 10);
                      const clamped = Number.isNaN(parsed) || parsed < forgeLevel + 1
                        ? Math.min(100, forgeLevel + 1)
                        : Math.min(100, parsed);
                      setRawTargetStr(String(clamped));
                      setTargetGoalLevel(clamped);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const parsed = parseInt(rawTargetStr, 10);
                        const clamped = Number.isNaN(parsed) || parsed < forgeLevel + 1
                          ? Math.min(100, forgeLevel + 1)
                          : Math.min(100, parsed);
                        setRawTargetStr(String(clamped));
                        setTargetGoalLevel(clamped);
                      }
                    }}
                    className="direct-number-input compact"
                  />
                </div>
                <button
                  type="button"
                  className="stepper-btn mini"
                  onClick={() => {
                    const next = Math.min(100, targetGoalLevel + 1);
                    setTargetGoalLevel(next);
                    setRawTargetStr(String(next));
                  }}
                  disabled={targetGoalLevel >= 100}
                  aria-label="Increase target level"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="goal-exp-banner">
        <div className="exp-metric-block">
          <span className="metric-label">EXP Required</span>
          <strong>{isMaxLevel ? "Cap Reached" : `${expNeeded.toLocaleString()} EXP`}</strong>
        </div>
        <div className="level-jump-badge">
          <span>Lv. {forgeLevel}</span>
          <ArrowRight size={14} aria-hidden="true" />
          <strong>{isMaxLevel ? "MAX (100)" : `Lv. ${targetGoalLevel}`}</strong>
        </div>
      </div>

      {isMaxLevel ? (
        <div className="max-level-reached-banner">
          <CheckCircle2 size={24} className="good-val" aria-hidden="true" />
          <div>
            <strong>Maximum Forge Level Reached</strong>
            <p>Your Forge mastery is at the Level 100 cap.</p>
          </div>
        </div>
      ) : (
        <div className="goal-routes-grid">
          {routes.map((route) => {
            const Icon = route.icon;
            const option = route.option;
            if (!option) return null;

            return (
              <div key={route.key} className={`route-card ${route.key}-route`}>
                <div className="route-header">
                  <div className="route-tag-group">
                    <span className={`route-tag ${route.tagClass}`}>
                      <Icon size={13} aria-hidden="true" />
                      <span>{route.title}</span>
                    </span>
                    <span className="route-subtitle">{route.subtitle}</span>
                  </div>
                  <div className="route-cost-wrap">
                    <span className="route-cost-val">
                      {formatGold(route.totalCost)}
                      <GoldIcon size={13} />
                    </span>
                    {route.totalDurationSeconds > 0 && (
                      <span className="route-time-val">{formatLongDuration(route.totalDurationSeconds)}</span>
                    )}
                  </div>
                </div>

                <div className="route-body">
                  <div className="bracket-steps-container">
                    <div className="bracket-list">
                      {route.steps.map((step, idx) => (
                        <div key={idx} className="bracket-item">
                          <span className="bracket-level-range">Lv. {step.fromLevel}&ndash;{step.toLevel}</span>
                          <span className="bracket-material-name">{step.material.name}</span>
                          <span className="bracket-qty"><strong>{step.quantityNeeded.toLocaleString()}x</strong></span>
                          <span className="bracket-cost">
                            {formatGold(step.cost)}
                            <GoldIcon size={11} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="route-actions-row">
                  <button
                    type="button"
                    className="route-action-btn"
                    onClick={() => applyPathToQueue(route.steps)}
                    aria-label={`Queue entire ${route.title}`}
                  >
                    <Layers size={14} aria-hidden="true" />
                    <span>Queue {route.title}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
