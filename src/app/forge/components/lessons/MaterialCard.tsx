"use client";

import { memo } from "react";
import { Badge, Button, Card, Icon, type BadgeVariant } from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import type { CalculatedLessonMaterial } from "../../types";
import styles from "../../Forge.module.css";

export interface MaterialCardProps {
  mat: CalculatedLessonMaterial;
  ownedCount: number;
  inQueueCount: number;
  showExpPerItem?: boolean;
  onOpenItem: (name: string) => void;
  onAddToQueue: (name: string, count: number) => void;
  onFillSession: (name: string) => void;
}

function MaterialCardComponent({
  mat,
  ownedCount,
  inQueueCount,
  showExpPerItem = true,
  onOpenItem,
  onAddToQueue,
  onFillSession,
}: MaterialCardProps) {
  const hourlyExp = Math.round(mat.expPerSecond * 3600);
  const rarityVariant = mat.quality.toLowerCase() as BadgeVariant;

  return (
    <Card
      padding="md"
      accent={inQueueCount > 0 ? "success" : mat.hasPenalty ? "warning" : undefined}
    >
      <div className={styles.matCardTop}>
        <div className={styles.matCellIdentity}>
          <div className={styles.itemThumb}>
            <GameImage src={mat.imageUrl} alt={mat.name} width={28} height={28} />
          </div>
          <div className={styles.matCellText}>
            <div className={styles.actionsCluster}>
              <button
                type="button"
                className={styles.itemTitleBtn}
                onClick={() => onOpenItem(mat.name)}
                title={`Inspect ${mat.name} details`}
              >
                <QualityText value={mat.quality}>{mat.name}</QualityText>
                <Icon name="externalLink" size="xs" aria-hidden="true" />
              </button>
              <Badge variant={rarityVariant} size="sm">{mat.quality}</Badge>
              <Badge variant="neutral" size="sm">Lv. {mat.reqLvl}</Badge>
            </div>

            <div className={styles.matCellMeta}>
              <span>{mat.mob ? `Dropped by ${mat.mob}` : mat.category.replace("_", " ")}</span>
              {ownedCount > 0 && (
                <Badge variant="neutral" size="sm" icon={<Icon name="items" size="xs" aria-hidden="true" />}>
                  {ownedCount.toLocaleString()} owned
                </Badge>
              )}
              {inQueueCount > 0 && (
                <Badge variant="success" size="sm" icon={<Icon name="check" size="xs" aria-hidden="true" />}>
                  {inQueueCount.toLocaleString()} queued
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Badge
          variant={mat.hasPenalty ? "warning" : "success"}
          size="sm"
          icon={mat.hasPenalty ? <Icon name="warning" size="xs" aria-hidden="true" /> : undefined}
        >
          {mat.displayedEff}%
        </Badge>
      </div>

      <div className={styles.statStrip} style={{ marginTop: "0.65rem" }}>
        <div className={styles.statStripCell}>
          <span className={styles.statLabel}>EXP / hr</span>
          <strong className={styles.statValue}>~{hourlyExp.toLocaleString()}</strong>
        </div>
        <div className={styles.statStripCell}>
          <span className={styles.statLabel}>Gold / EXP</span>
          <strong className={`${styles.statValue} ${mat.goldPerExp <= 2.5 ? styles.statValueGood : ""}`}>
            {mat.goldPerExp.toFixed(2)}
            <GoldIcon size={11} />
          </strong>
        </div>
        <div className={styles.statStripCell}>
          <span className={styles.statLabel}>Price</span>
          <strong className={styles.statValue}>
            {formatGold(mat.liveMarketPrice)}
            <GoldIcon size={11} />
          </strong>
        </div>
        {showExpPerItem && (
          <div className={styles.statStripCell}>
            <span className={styles.statLabel}>EXP / item</span>
            <strong className={`${styles.statValue} ${mat.hasPenalty ? styles.statValueWarn : ""}`}>
              {mat.effectiveExp.toFixed(1)} ({mat.timeSeconds.toFixed(1).replace(/\.0$/, "")}s)
            </strong>
          </div>
        )}
      </div>

      <div className={styles.actionsCluster} style={{ marginTop: "0.65rem" }}>
        <Button
          variant="primary"
          size="sm"
          icon={<Icon name="speed" size="xs" aria-hidden="true" />}
          onClick={() => onFillSession(mat.name)}
          aria-label={`Fill session with ${mat.name}`}
        >
          Fill Session
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="plus" size="xs" aria-hidden="true" />}
          onClick={() => onAddToQueue(mat.name, 100)}
          aria-label={`Add 100 ${mat.name} to queue`}
        >
          +100
        </Button>
        {ownedCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="items" size="xs" aria-hidden="true" />}
            onClick={() => onAddToQueue(mat.name, ownedCount)}
            aria-label={`Queue ${ownedCount} owned ${mat.name}`}
          >
            Queue ({ownedCount.toLocaleString()})
          </Button>
        )}
      </div>
    </Card>
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
