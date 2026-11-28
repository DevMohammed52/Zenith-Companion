"use client";

import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Skeleton, SkeletonContainer } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { formatCompactNumber } from "@/lib/format";
import type { RankedRouteDisplay } from "../types";
import styles from "../page.module.css";

interface DashboardPriorityToolsProps {
  rankedRoutes: RankedRouteDisplay[];
  queuedCount: number;
  queueProfit: number;
  queuePlanEntriesCount: number;
  forgeCraftsCount: number;
  housingStatusLabel: string;
  housingConduitNote: string;
}

export function DashboardPriorityTools({
  rankedRoutes,
  queuedCount,
  queueProfit,
  queuePlanEntriesCount,
  forgeCraftsCount,
  housingStatusLabel,
  housingConduitNote,
}: DashboardPriorityToolsProps) {
  const getRouteHref = (route: RankedRouteDisplay) =>
    route.skill === "Alchemy"
      ? `/alchemy?search=${encodeURIComponent(route.name)}`
      : `/skill-profit?search=${encodeURIComponent(route.name)}`;

  return (
    <article className={styles.bentoPanel} aria-label="Top gold routes">
      <header className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <Icon name="skillProfit" size="md" className={styles.panelIcon} aria-hidden="true" />
          <h2 className={styles.panelTitle}>Top Gold Routes</h2>
        </div>

        <Link href="/skill-profit" className={styles.textActionLink}>
          View all
          <Icon name="arrowRight" size="xs" aria-hidden="true" />
        </Link>
      </header>

      <div className={styles.profitStage}>
        {rankedRoutes.length === 0 ? (
          <SkeletonContainer busy={true}>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </SkeletonContainer>
        ) : (
          <>
            <div className={styles.routeTableHead} aria-hidden="true">
              <span>#</span>
              <span />
              <span>Activity</span>
              <span className={styles.routeHeadRight}>Gold / hr</span>
              <span className={styles.routeHeadRight}>EXP / hr</span>
            </div>

            {rankedRoutes.map((row, idx) => (
              <Link
                key={`${row.skill}-${row.name}`}
                href={getRouteHref(row)}
                className={
                  idx === 0
                    ? `${styles.routeLedgerRow} ${styles.routeLedgerRowTop}`
                    : styles.routeLedgerRow
                }
              >
                <span className={idx === 0 ? `${styles.rankPill} ${styles.rankPillTop}` : styles.rankPill}>
                  {idx + 1}
                </span>

                <GameImage
                  src={row.imageUrl}
                  alt=""
                  width={28}
                  height={28}
                  loading="eager"
                  className={styles.borderlessSprite}
                  fallback={
                    <Icon
                      name={row.skill === "Alchemy" ? "alchemy" : "skillProfit"}
                      size="sm"
                      aria-hidden="true"
                    />
                  }
                />

                <span className={styles.routeMainCell}>
                  <span className={styles.routeNameText}>{row.name}</span>
                  <span className={styles.routeMetaText}>
                    {row.skill} | Lv. {row.level}
                  </span>
                </span>

                <span className={styles.routeGoldCell}>
                  <GoldIcon size={13} />
                  <span>{formatCompactNumber(row.profitPerHour)}</span>
                </span>

                <span className={styles.routeExpCell}>
                  {formatCompactNumber(row.expPerHour)}
                </span>
              </Link>
            ))}
          </>
        )}
      </div>

      <div className={styles.plannerFooterStrip}>
        <Link href="/crafting" className={styles.plannerFooterTile}>
          <span className={styles.plannerFooterLabel}>Crafting Queue</span>
          <strong className={styles.plannerFooterVal}>{queuedCount.toLocaleString()} queued</strong>
          <span className={styles.plannerFooterSub}>
            {queuedCount > 0 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <GoldIcon size={12} />
                {formatCompactNumber(queueProfit)} net | {queuePlanEntriesCount} {queuePlanEntriesCount === 1 ? "item" : "items"}
              </span>
            ) : (
              "Queue empty"
            )}
          </span>
        </Link>

        <Link href="/forge" className={styles.plannerFooterTile}>
          <span className={styles.plannerFooterLabel}>Forge Planner</span>
          <strong className={styles.plannerFooterVal}>{forgeCraftsCount.toLocaleString()} crafts</strong>
          <span className={styles.plannerFooterSub}>Saved weapon recipes</span>
        </Link>

        <Link href="/housing" className={styles.plannerFooterTile}>
          <span className={styles.plannerFooterLabel}>Housing</span>
          <strong className={styles.plannerFooterVal}>{housingStatusLabel}</strong>
          <span className={styles.plannerFooterSub}>{housingConduitNote}</span>
        </Link>
      </div>
    </article>
  );
}
