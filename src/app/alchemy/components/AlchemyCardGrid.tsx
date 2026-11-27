"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { Badge, Button, Card, Icon } from "@/components/ui";
import { formatGold, formatMinutes, formatSignedGold } from "@/lib/alchemy-profit";
import type { AlchemyRateMode, AlchemyRow } from "../types";
import {
  getActionLabel,
  getActionVariant,
  getAlchemyMatchHint,
  getSignalVariant,
  getVisibleAlchemyWarnings,
  highlightMatch,
} from "../utils/alchemy-helpers";
import styles from "../page.module.css";

interface AlchemyCardGridProps {
  rows: AlchemyRow[];
  rateMode: AlchemyRateMode;
  effectiveSessionHours: number;
  hasProfileAlchemyLevel: boolean;
  profileAlchemyLevel: number;
  deferredSearchTerm: string;
  queue: Record<string, number>;
  onSelectRow: (row: AlchemyRow) => void;
  onOpenItem: (name: string) => void;
  onPrefetchItem: (name: string) => void;
  onAddToQueue: (name: string, qty: number) => void;
}

export function AlchemyCardGrid({
  rows,
  rateMode,
  effectiveSessionHours,
  hasProfileAlchemyLevel,
  profileAlchemyLevel,
  deferredSearchTerm,
  queue,
  onSelectRow,
  onOpenItem,
  onPrefetchItem,
  onAddToQueue,
}: AlchemyCardGridProps) {
  return (
    <div className={styles.cardsGrid}>
      {rows.map((row) => {
        const isLocked = hasProfileAlchemyLevel && row.level > profileAlchemyLevel;
        const primaryProfit =
          rateMode === "session" ? Math.round(row.sessionProfit) : Math.round(row.profitPerHour);
        const primaryProfitLabel =
          rateMode === "session" ? `${effectiveSessionHours}h Profit` : "Profit / Hr";
        const primaryExp =
          rateMode === "session" ? row.sessionExp : Math.round(row.expPerHour);
        const matchHint = getAlchemyMatchHint(row, deferredSearchTerm);
        const queuedQty = queue[row.name] || 0;
        const batchQty = Math.max(1, row.craftsPerSession || Math.round(row.craftsPerHour) || 1);

        return (
          <Card key={row.name} padding="md" className={row.status === "missing" ? styles.rowMuted : undefined}>
            <div className={styles.recipeCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIdentity}>
                  <div className={styles.itemThumb}>
                    {row.imageUrl ? (
                      <GameImage src={row.imageUrl} alt={row.name} width={26} height={26} sizes="26px" />
                    ) : (
                      <Icon name="alchemy" size="sm" aria-hidden="true" />
                    )}
                  </div>
                  <div className={styles.recipeMeta}>
                    <button
                      type="button"
                      className={styles.recipeNameBtn}
                      onClick={() => onOpenItem(row.name)}
                      onMouseEnter={() => onPrefetchItem(row.name)}
                    >
                      <QualityText value={row.quality}>
                        {highlightMatch(row.name, deferredSearchTerm)}
                      </QualityText>
                    </button>
                    <div className={styles.recipeTitleLine}>
                      <span className={styles.metaPill}>Lv {row.level}</span>
                      <span className={styles.metaPill}>{formatMinutes(row.time)}m</span>
                      {isLocked && (
                        <Badge size="sm" variant="warning">
                          Needs Lv {row.level}
                        </Badge>
                      )}
                      {queuedQty > 0 && (
                        <Badge size="sm" variant="refined">
                          {queuedQty} queued
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {row.status === "missing" ? (
                  <Badge size="sm" variant="danger">
                    No data
                  </Badge>
                ) : (
                  <Badge size="sm" variant={getActionVariant(row.action)}>
                    {getActionLabel(row.action)}
                  </Badge>
                )}
              </div>

              {matchHint && <div className={styles.matchHint}>{matchHint}</div>}

              {row.status === "missing" ? (
                <p className={styles.recipeSubline}>{row.warnings[0] || "Missing market prices."}</p>
              ) : (
                <>
                  <div className={styles.cardMetricsStrip}>
                    <div className={styles.cardMetricCell}>
                      <span className={styles.cardMetricLabel}>{primaryProfitLabel}</span>
                      <span
                        className={`${styles.cardMetricVal} ${
                          primaryProfit >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        <GoldIcon size={12} />
                        {formatSignedGold(primaryProfit)}
                      </span>
                      <span className={styles.cellSub}>{formatSignedGold(row.profit)}/pc</span>
                    </div>
                    <div className={styles.cardMetricCell}>
                      <span className={styles.cardMetricLabel}>Cost / Return</span>
                      <span className={styles.cardMetricVal}>
                        <GoldIcon size={12} />
                        {formatGold(row.cost)}g
                      </span>
                      <span className={styles.cellSub}>{formatGold(row.bestRevenue)}g net</span>
                    </div>
                    <div className={styles.cardMetricCell}>
                      <span className={styles.cardMetricLabel}>
                        {rateMode === "session" ? "Session EXP" : "EXP / Hr"}
                      </span>
                      <span className={styles.cardMetricVal}>{formatGold(primaryExp)}</span>
                      <span className={styles.cellSub}>{formatGold(row.stableVol_3)} sold</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.tagGroup}>
                      <Badge size="sm" variant={getSignalVariant(row.signal)}>
                        {row.signal}
                      </Badge>
                      {getVisibleAlchemyWarnings(row)
                        .slice(0, 1)
                        .map((w) => (
                          <Badge key={w} size="sm" variant="warning">
                            {w}
                          </Badge>
                        ))}
                    </div>

                    <div className={styles.cardActions}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddToQueue(row.name, batchQty)}
                        aria-label={`Add ${batchQty} ${row.name} to crafting queue`}
                      >
                        <Icon name="plus" size="xs" aria-hidden="true" />
                        <span>Queue</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectRow(row)}
                      >
                        <span>Strategy</span>
                        <Icon name="chevronRight" size="xs" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
