"use client";

import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Skeleton } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { formatCompactNumber } from "@/lib/format";
import type { LatestReleaseHighlight, MarketMoverItem, ToolDirectoryItem } from "../types";
import styles from "../page.module.css";

interface DashboardModuleGridProps {
  marketMovers: MarketMoverItem[];
  equippedGearCount: number;
  ownedPetsCount: number;
  petSpeciesCount: number;
  activeMythicCount: number;
  housingStatusLabel: string;
  recentTools: ToolDirectoryItem[];
  latestRelease: LatestReleaseHighlight | null;
}

export function DashboardModuleGrid({
  marketMovers,
  equippedGearCount,
  ownedPetsCount,
  petSpeciesCount,
  activeMythicCount,
  housingStatusLabel,
  recentTools,
  latestRelease,
}: DashboardModuleGridProps) {
  return (
    <section className={styles.intelGrid} aria-label="Market movers and tools">
      <article className={styles.bentoPanel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <Icon name="market" size="md" className={styles.panelIcon} aria-hidden="true" />
            <h2 className={styles.panelTitle}>Market Movers</h2>
          </div>
          <Link href="/items" className={styles.textActionLink}>
            Items
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>
        </header>

        <div className={styles.moverStage}>
          {marketMovers.length === 0 ? (
            <Skeleton height={180} />
          ) : (
            <div className={styles.moverList}>
              {marketMovers.map((item) => (
                <Link
                  key={item.name}
                  href={`/items?search=${encodeURIComponent(item.name)}`}
                  className={styles.moverRow}
                >
                  <GameImage
                    src={item.imageUrl}
                    alt=""
                    width={24}
                    height={24}
                    loading="eager"
                    className={styles.moverSprite}
                    fallback={<Icon name="items" size="xs" aria-hidden="true" />}
                  />
                  <span className={styles.moverName}>{item.name}</span>
                  <span className={styles.moverPrice}>
                    <GoldIcon size={12} />
                    {formatCompactNumber(item.price3d)}
                  </span>
                  <span className={styles.deltaUp}>+{Math.round(item.deltaPercent)}%</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>

      <article className={styles.bentoPanel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <Icon name="bis" size="md" className={styles.panelIcon} aria-hidden="true" />
            <h2 className={styles.panelTitle}>Gear & Tools</h2>
          </div>
          <Link href="/bis" className={styles.textActionLink}>
            Best-in-Slot
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>
        </header>

        <div className={styles.moverList}>
          <Link href="/bis" className={styles.quickRowLink}>
            <span className={styles.quickRowLeft}>
              <Icon name="bis" size="sm" aria-hidden="true" />
              <span>Equipped Gear</span>
            </span>
            <span className={styles.quickRowValue}>{equippedGearCount} / 9 slots</span>
          </Link>

          <Link href="/housing" className={styles.quickRowLink}>
            <span className={styles.quickRowLeft}>
              <Icon name="housing" size="sm" aria-hidden="true" />
              <span>Housing</span>
            </span>
            <span className={styles.quickRowValue}>{housingStatusLabel}</span>
          </Link>

          <Link href="/forge/lessons" className={styles.quickRowLink}>
            <span className={styles.quickRowLeft}>
              <Icon name="forgeLessons" size="sm" aria-hidden="true" />
              <span>Forge Lessons</span>
            </span>
            <span className={styles.quickRowValue}>Lv. 1 to 100 costs</span>
          </Link>

          <Link href="/alchemy/mythic" className={styles.quickRowLink}>
            <span className={styles.quickRowLeft}>
              <Icon name="mythicAlchemy" size="sm" aria-hidden="true" />
              <span>Mythic Lab</span>
            </span>
            <span className={styles.quickRowValue}>
              {activeMythicCount > 0 ? `${activeMythicCount} active` : "21 Lv. 90+ recipes"}
            </span>
          </Link>

          <Link href="/pets" className={styles.quickRowLink}>
            <span className={styles.quickRowLeft}>
              <Icon name="pets" size="sm" aria-hidden="true" />
              <span>Pets</span>
            </span>
            <span className={styles.quickRowValue}>
              {petSpeciesCount} species{ownedPetsCount > 0 ? ` | ${ownedPetsCount} owned` : ""}
            </span>
          </Link>
        </div>
      </article>

      <article className={styles.bentoPanel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <Icon name="history" size="md" className={styles.panelIcon} aria-hidden="true" />
            <h2 className={styles.panelTitle}>Recent & Notes</h2>
          </div>
          <Link href="/whats-new" className={styles.textActionLink}>
            What&apos;s New
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>
        </header>

        {recentTools.length > 0 && (
          <div className={styles.recentPills} aria-label="Recently visited tools">
            {recentTools.map((tool) => (
              <Link key={tool.href} href={tool.href} className={styles.recentPill}>
                <Icon name={tool.icon} size="xs" aria-hidden="true" />
                <span>{tool.label}</span>
              </Link>
            ))}
          </div>
        )}

        {latestRelease && (
          <Link href="/whats-new" className={styles.releaseBox}>
            <span className={styles.releaseVersion}>
              Latest Update: v{latestRelease.version}
            </span>
            <span className={styles.releaseHeadline}>{latestRelease.headline}</span>
          </Link>
        )}

        <div className={styles.inlineLinkFoot}>
          <Link href="/patch-notes" className={styles.textActionLink}>
            IdleMMO Patch Notes
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>
          <Link href="/settings" className={styles.textActionLink}>
            Settings
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </section>
  );
}
