"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  NumberInput,
  ProgressBar,
  type BadgeVariant,
} from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon, ShardIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import { useItemModal } from "@/context/ItemModalContext";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import styles from "../../Forge.module.css";

function useSafeItemModal() {
  try {
    return useItemModal();
  } catch {
    return { openItemByName: () => {}, prefetchItem: () => {} };
  }
}

function formatDurationHms(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDurationSmart(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function LessonQueueReview({
  lessons,
  onSwitchSubView,
}: {
  lessons: UseForgeLessonsReturn;
  onSwitchSubView?: (view: "catalog" | "planner" | "session" | "inventory") => void;
}) {
  const { openItemByName, prefetchItem } = useSafeItemModal();
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

  const [breakdownOpen, setBreakdownOpen] = useState(true);

  const {
    totalForgeExp,
    totalStrengthExp,
    temperBarFullShards,
    temperBarFullHalfShards,
    temperBarExact,
    estimatedTemperBarPercent,
    estimatedTemperShards,
    totalDurationSeconds,
    totalCost,
    projectedLevel,
    projectedLevelProgress,
  } = sessionSummary;

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

  const candidates =
    trainingPool.length > 0
      ? trainingPool
      : (allCalculatedMaterials || visibleMaterials).filter(
          (m) => m.reqLvl <= forgeLevel + 10 && m.displayedEff >= 100
        );

  const cheapestRec =
    candidates.length > 0 ? [...candidates].sort((a, b) => a.goldPerExp - b.goldPerExp)[0] : null;
  const fastestRec =
    candidates.length > 0 ? [...candidates].sort((a, b) => b.expPerSecond - a.expPerSecond)[0] : null;

  const totalOwnedCount = Object.values(ownedMaterials || {}).reduce((acc, q) => acc + q, 0);
  const sessionSeconds = totalTargetDurationSeconds > 0 ? totalTargetDurationSeconds : 6 * 3600;
  const targetHours = Math.floor(sessionSeconds / 3600);
  const targetMins = Math.floor((sessionSeconds % 3600) / 60);
  const targetSessionLabel = targetMins > 0 ? `${targetHours}h ${targetMins}m` : `${targetHours}h`;
  const totalSessionsCount = Math.max(1, Math.ceil(totalDurationSeconds / sessionSeconds));

  if (queuedItems.length === 0) {
    return (
      <Card padding="md" variant="elevated" aria-label="Smithing lesson queue">
        <EmptyState
          variant="no-data"
          icon="critDamage"
          title="Session Queue Empty"
          description="Click Fill or + on any material on the left, or auto-fill with optimal training stock for your target window."
          action={
            cheapestRec
              ? {
                  label: `Fill Cheapest (${cheapestRec.name})`,
                  icon: "speed",
                  onClick: () => fillSessionWithMaterial(cheapestRec.name),
                }
              : undefined
          }
          secondaryAction={
            fastestRec && fastestRec.name !== cheapestRec?.name
              ? {
                  label: `Fill Fastest (${fastestRec.name})`,
                  onClick: () => fillSessionWithMaterial(fastestRec.name),
                }
              : totalOwnedCount > 0
              ? {
                  label: `Queue Owned (${totalOwnedCount.toLocaleString()})`,
                  onClick: () => queueAllOwned(),
                }
              : undefined
          }
        >
          {totalOwnedCount > 0 && fastestRec && fastestRec.name !== cheapestRec?.name && (
            <div className={styles.actionsCluster} style={{ marginTop: "0.65rem", justifyContent: "center" }}>
              <Button variant="ghost" size="sm" onClick={() => queueAllOwned()}>
                Queue Owned ({totalOwnedCount.toLocaleString()})
              </Button>
            </div>
          )}
          {onSwitchSubView && (
            <div className={styles.actionsCluster} style={{ marginTop: "0.5rem", justifyContent: "center" }}>
              <Button variant="secondary" size="sm" onClick={() => onSwitchSubView("catalog")}>
                Browse Materials ({allCalculatedMaterials.length})
              </Button>
            </div>
          )}
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card padding="md" variant="elevated" aria-label="Smithing lesson queue">
      <div className={styles.queueList}>
        <div className={styles.sectionTopRow}>
          <div>
            <span className={styles.kicker}>
              <Icon name="craftingQueue" size="xs" aria-hidden="true" /> Session Queue
            </span>
            <h2 className={styles.sectionTitle}>
              {queuedItems.length} {queuedItems.length === 1 ? "item" : "items"} | ~{totalSessionsCount}{" "}
              {totalSessionsCount === 1 ? "session" : "sessions"} ({formatDurationSmart(totalDurationSeconds)})
            </h2>
          </div>

          <div className={styles.actionsCluster}>
            {lastReplacedQueue && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="undo" size="xs" aria-hidden="true" />}
                onClick={() => undoFillQueue()}
              >
                Undo Fill
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              icon={<Icon name="trash" size="xs" aria-hidden="true" />}
              onClick={() => clearQueue()}
              aria-label="Clear Queue"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Compact Summary Metrics Strip */}
        <div className={styles.statStrip}>
          <div className={styles.statStripCell}>
            <span className={styles.statLabel}>Forge EXP</span>
            <strong className={`${styles.statValue} ${styles.statValueGood}`}>
              +{totalForgeExp.toLocaleString()}
            </strong>
            <span className={styles.statSub}>Str (5%): +{totalStrengthExp.toLocaleString()}</span>
          </div>

          <div className={styles.statStripCell}>
            <span className={styles.statLabel}>Duration</span>
            <strong className={styles.statValue}>
              {totalDurationSeconds >= 86400
                ? formatDurationSmart(totalDurationSeconds)
                : formatDurationHms(totalDurationSeconds)}
            </strong>
            <span className={styles.statSub}>Window: {targetSessionLabel}</span>
          </div>

          <div className={styles.statStripCell}>
            <span className={styles.statLabel}>Est. Cost</span>
            <strong className={styles.statValue}>
              {formatGold(totalCost)}
              <GoldIcon size={12} />
            </strong>
            <span className={styles.statSub}>Market value</span>
          </div>
        </div>

        {/* Temper Bar Estimation (24h meter at 100% eff) */}
        <div className={styles.temperNoteBox}>
          <span>
            24h Temper bar: <strong>~{estimatedTemperBarPercent}%</strong> (~{estimatedTemperShards}{" "}
            <ShardIcon size={12} /> banked)
          </span>
          <span>
            Full: {temperBarExact ? "" : "~"}{temperBarFullShards} | Half claim: ~{Math.floor(temperBarFullHalfShards * 0.75)}
          </span>
        </div>

        <ProgressBar
          value={projectedLevelProgress}
          min={0}
          max={100}
          label={`Projected Forge Level: Lv. ${forgeLevel} → Lv. ${projectedLevel}`}
          valueText={`${projectedLevelProgress}% to next`}
          variant="success"
          size="md"
        />

        <div className={styles.sectionTopRow} style={{ paddingTop: "0.25rem" }}>
          <span className={styles.kicker}>Queued Materials</span>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={breakdownOpen}
            onClick={() => setBreakdownOpen((prev) => !prev)}
            iconTrailing={<Icon name={breakdownOpen ? "chevronUp" : "chevronDown"} size="xs" aria-hidden="true" />}
          >
            {breakdownOpen ? "Collapse items" : `Show items (${queuedItems.length})`}
          </Button>
        </div>

        {breakdownOpen && (
          <div className={styles.queueList} aria-label="Queued materials">
            {queuedItems.map((item, idx) => {
              const { material, quantity, totalExp, totalDurationSeconds: itemDuration } = item;
              const itemSessions = Math.ceil(itemDuration / sessionSeconds);
              const ownedCount = ownedMaterials[material.name] || 0;
              const rarityVariant = material.quality.toLowerCase() as BadgeVariant;

              return (
                <div
                  key={material.name}
                  className={`${styles.queueItemCard} ${material.hasPenalty ? styles.warn : ""}`}
                >
                  <div className={styles.queueItemTop}>
                    <div className={styles.matCellIdentity}>
                      <div className={styles.itemThumb}>
                        <GameImage src={material.imageUrl} alt={material.name} width={28} height={28} />
                      </div>
                      <div className={styles.matCellText}>
                        <div className={styles.actionsCluster}>
                          <Badge variant="neutral" size="sm">#{idx + 1}</Badge>
                          <button
                            type="button"
                            className={styles.itemTitleBtn}
                            onMouseEnter={() => prefetchItem(material.name)}
                            onClick={() => openItemByName(material.name)}
                          >
                            <QualityText value={material.quality}>{material.name}</QualityText>
                            <Icon name="externalLink" size="xs" aria-hidden="true" />
                          </button>
                          <Badge variant={rarityVariant} size="sm">{material.quality}</Badge>
                          {material.hasPenalty && (
                            <Badge variant="warning" size="sm">
                              {material.warningType === "TOO_BASIC" ? "Outgrown" : "Over-level"} ({material.displayedEff}%)
                            </Badge>
                          )}
                        </div>
                        <div className={styles.matCellMeta}>
                          <span>Lv. {material.reqLvl}</span>
                          <span aria-hidden="true">|</span>
                          <span>+{Math.floor(totalExp).toLocaleString()} EXP</span>
                          <span aria-hidden="true">|</span>
                          <span>{formatGold(item.totalCost)}g</span>
                          <span aria-hidden="true">|</span>
                          <span>~{itemSessions} {itemSessions === 1 ? "ses" : "ses"}</span>
                          {ownedCount > 0 && (
                            <>
                              <span aria-hidden="true">|</span>
                              <span>Stock: {ownedCount.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icon name="close" size="sm" aria-hidden="true" />}
                      onClick={() => removeFromQueue(material.name)}
                      aria-label={`Remove ${material.name} from lesson`}
                    />
                  </div>

                  <div className={styles.queueQtyBar}>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={quantity <= 1}
                      aria-label={`Subtract 100 ${material.name}`}
                      onClick={() => setQueueQuantity(material.name, Math.max(1, quantity - 100))}
                    >
                      -100
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={quantity <= 1}
                      aria-label={`Subtract 10 ${material.name}`}
                      onClick={() => setQueueQuantity(material.name, Math.max(1, quantity - 10))}
                    >
                      -10
                    </Button>
                    <div style={{ width: "144px" }}>
                      <NumberInput
                        value={quantity}
                        min={1}
                        max={100000}
                        onChange={(val) => setQueueQuantity(material.name, val)}
                        aria-label={`${material.name} quantity`}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Add 10 ${material.name}`}
                      onClick={() => setQueueQuantity(material.name, quantity + 10)}
                    >
                      +10
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Add 100 ${material.name}`}
                      onClick={() => setQueueQuantity(material.name, quantity + 100)}
                    >
                      +100
                    </Button>
                    {ownedCount > 0 && ownedCount !== quantity && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQueueQuantity(material.name, ownedCount)}
                      >
                        Use Stock
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
