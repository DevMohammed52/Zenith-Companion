"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, EmptyState, Icon, NumberInput, type CardAccent } from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import type { GoalProgressionStep } from "../../types";
import styles from "../../Forge.module.css";

function formatLongDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const totalMinutes = Math.floor(totalSeconds / 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    return remainingMinutes > 0
      ? `${days}d ${remainingHours}h ${remainingMinutes}m`
      : `${days}d ${remainingHours}h`;
  }
  if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m ${Math.floor(totalSeconds % 60)}s`;
}

export function LessonTargetGoalCard({
  lessons,
  onSwitchSubView,
}: {
  lessons: UseForgeLessonsReturn;
  onSwitchSubView?: (view: "session" | "planner" | "catalog" | "inventory") => void;
}) {
  const {
    forgeLevel,
    targetGoalLevel,
    setTargetGoalLevel,
    goalEstimate,
    addToQueue,
    addBatchToQueue,
    replaceQueue,
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
  const [queuedRouteKey, setQueuedRouteKey] = useState<string | null>(null);
  const queuedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (queuedTimerRef.current) clearTimeout(queuedTimerRef.current);
    };
  }, []);

  const applyPathToQueue = (steps: GoalProgressionStep[], routeKey: string) => {
    const batch: Record<string, number> = {};
    for (const step of steps) {
      if (step.material?.name && step.quantityNeeded > 0) {
        batch[step.material.name] = (batch[step.material.name] || 0) + step.quantityNeeded;
      }
    }
    if (Object.keys(batch).length > 0) {
      if (typeof replaceQueue === "function") {
        replaceQueue(batch);
      } else if (typeof addBatchToQueue === "function") {
        addBatchToQueue(batch);
      } else {
        for (const [name, qty] of Object.entries(batch)) {
          addToQueue(name, qty);
        }
      }
      setQueuedRouteKey(routeKey);
      if (queuedTimerRef.current) clearTimeout(queuedTimerRef.current);
      queuedTimerRef.current = setTimeout(() => setQueuedRouteKey(null), 3000);
    }
  };

  const routes: Array<{
    key: "cheapest" | "best" | "fastest";
    badgeVariant: "success" | "refined" | "warning";
    accent: CardAccent;
    title: string;
    subtitle: string;
    option: typeof cheapestOption;
    steps: GoalProgressionStep[];
    totalCost: number;
    totalDurationSeconds: number;
  }> = [
    {
      key: "cheapest",
      badgeVariant: "success",
      accent: "success",
      title: "Cheapest Route",
      subtitle: "Lowest gold cost",
      option: cheapestOption,
      steps: cheapestSteps,
      totalCost: totalCheapestCost || cheapestOption?.totalCost || 0,
      totalDurationSeconds: totalCheapestDurationSeconds || cheapestOption?.totalDurationSeconds || 0,
    },
    {
      key: "best",
      badgeVariant: "refined",
      accent: "refined",
      title: "Balanced Route",
      subtitle: "Speed and gold balance",
      option: bestOption || cheapestOption,
      steps: bestSteps.length > 0 ? bestSteps : cheapestSteps,
      totalCost: totalBestCost || bestOption?.totalCost || totalCheapestCost || 0,
      totalDurationSeconds: totalBestDurationSeconds || bestOption?.totalDurationSeconds || totalCheapestDurationSeconds || 0,
    },
    {
      key: "fastest",
      badgeVariant: "warning",
      accent: "warning",
      title: "Fastest Route",
      subtitle: "Maximum EXP rate",
      option: fastestOption,
      steps: fastestSteps,
      totalCost: totalFastestCost || fastestOption?.totalCost || 0,
      totalDurationSeconds: totalFastestDurationSeconds || fastestOption?.totalDurationSeconds || 0,
    },
  ];

  return (
    <section className={styles.queueList} aria-label="Level target estimator">
      <Card padding="md">
        <div className={styles.sectionTopRow} style={{ alignItems: "center" }}>
          <div>
            <span className={styles.kicker}>
              <Icon name="map" size="xs" aria-hidden="true" /> Progression Routes{" "}
              <span className="sr-only">Level Target Estimator</span>
            </span>
            <h2 className={styles.sectionTitle}>
              {isMaxLevel ? "Forge Level 100 Reached" : `Lv. ${forgeLevel} → Lv. ${targetGoalLevel}`}
            </h2>
            <p className={styles.syncText} style={{ margin: "0.25rem 0 0" }}>
              {isMaxLevel ? "Maximum Forge skill level reached." : `${expNeeded.toLocaleString()} EXP required`}
            </p>
          </div>

          {!isMaxLevel && (
            <div style={{ width: "176px" }}>
              <NumberInput
                label="Target Level"
                prefix="Lv."
                min={Math.min(100, forgeLevel + 1)}
                max={100}
                value={targetGoalLevel}
                onChange={(val) => setTargetGoalLevel(val)}
              />
            </div>
          )}
        </div>
      </Card>

      {isMaxLevel ? (
        <EmptyState
          variant="default"
          icon="checkCircle"
          title="Maximum Forge Level Reached"
          description="Your Forge mastery is already at the Level 100 cap."
        />
      ) : (
        <div className={styles.routesGrid}>
          {routes.map((route) => {
            if (!route.option) return null;
            const isQueued = queuedRouteKey === route.key;

            return (
              <Card
                key={route.key}
                padding="md"
                accent={route.accent}
                title={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <Badge variant={route.badgeVariant} size="sm">{route.title}</Badge>
                    <span className={styles.statValue}>
                      {formatGold(route.totalCost)}
                      <GoldIcon size={12} />
                    </span>
                  </div>
                }
                subtitle={
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.2rem" }}>
                    <span>{route.subtitle}</span>
                    {route.totalDurationSeconds > 0 && (
                      <span>{formatLongDuration(route.totalDurationSeconds)}</span>
                    )}
                  </div>
                }
                footer={
                  <div className={styles.actionsCluster} style={{ width: "100%", justifyContent: "space-between" }}>
                    <Button
                      variant={isQueued ? "secondary" : "primary"}
                      size="md"
                      fullWidth={!isQueued || !onSwitchSubView}
                      icon={<Icon name={isQueued ? "checkCircle" : "craftingQueue"} size="sm" aria-hidden="true" />}
                      onClick={() => applyPathToQueue(route.steps, route.key)}
                    >
                      {isQueued ? "Route Queued" : `Queue ${route.title}`}
                    </Button>
                    {isQueued && onSwitchSubView && (
                      <Button
                        variant="ghost"
                        size="md"
                        iconTrailing={<Icon name="arrowRight" size="xs" aria-hidden="true" />}
                        onClick={() => onSwitchSubView("session")}
                      >
                        Session Queue
                      </Button>
                    )}
                  </div>
                }
              >
                <div>
                  {route.steps.map((step, idx) => (
                    <div key={`${step.fromLevel}-${step.material.name}-${idx}`} className={styles.stepRow}>
                      <span className={styles.stepLevelRange}>Lv. {step.fromLevel}&ndash;{step.toLevel}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", minWidth: 0 }}>
                        <GameImage src={step.material.imageUrl} alt="" width={22} height={22} />
                        <QualityText value={step.material.quality}>{step.material.name}</QualityText>
                      </div>
                      <span className={styles.stepQty}>{step.quantityNeeded.toLocaleString()}x</span>
                      <span className={styles.stepCost}>
                        {formatGold(step.cost)}
                        <GoldIcon size={11} />
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
