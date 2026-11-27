"use client";

import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import {
  Badge,
  Button,
  Icon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import type { AlchemyBuffTotals } from "@/lib/alchemy-profit";
import { formatCraftWindow, formatGold, formatSignedGold } from "../utils/mythic-helpers";
import type { MythicLabStats, MythicLabSummary, MythicWorkspaceTab } from "../types";
import styles from "../page.module.css";

interface MythicHeaderProps {
  isLoading: boolean;
  activeProfileName: string;
  hasConfiguredProfile: boolean;
  hasProfileAlchemyLevel: boolean;
  profileAlchemyLevel: number;
  effectiveMembership: boolean;
  taxRate: number;
  buffTotals: AlchemyBuffTotals;
  hasWhatIfOverrides: boolean;
  mythicCraftTimeSeconds: number;
  mythicRecipesCount: number;
  activeRowsCount: number;
  labStats: MythicLabStats;
  labSummary: MythicLabSummary;
  queuedTotalUnits: number;
  staleMarket: boolean;
  dataAgeMinutes: number | null;
  onOpenDrawer: () => void;
  onSelectTab: (tab: MythicWorkspaceTab) => void;
  onOpenItem: (name: string) => void;
}

export function MythicHeader({
  isLoading,
  activeProfileName,
  hasConfiguredProfile,
  hasProfileAlchemyLevel,
  profileAlchemyLevel,
  effectiveMembership,
  taxRate,
  buffTotals,
  hasWhatIfOverrides,
  mythicCraftTimeSeconds,
  mythicRecipesCount,
  activeRowsCount,
  labStats,
  labSummary,
  queuedTotalUnits,
  staleMarket,
  dataAgeMinutes,
  onOpenDrawer,
  onSelectTab,
  onOpenItem,
}: MythicHeaderProps) {
  const effLabel =
    buffTotals.efficiencyBonus >= 0 ? `+${buffTotals.efficiencyBonus}%` : `${buffTotals.efficiencyBonus}%`;
  const expLabel =
    buffTotals.expBonus >= 0 ? `+${buffTotals.expBonus}%` : `${buffTotals.expBonus}%`;

  const bestCatalog = labSummary.bestCatalog;
  const bestExp = labSummary.bestExpCatalog;

  return (
    <header className={styles.headerBlock}>
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrow}>
            <span>{hasConfiguredProfile ? activeProfileName : "Guest Mode"}</span>
            {hasProfileAlchemyLevel && (
              <>
                <span className={styles.hairlineDivider} aria-hidden="true" />
                <span>Alchemy Lv {profileAlchemyLevel}</span>
              </>
            )}
            <span className={styles.hairlineDivider} aria-hidden="true" />
            <span>{mythicRecipesCount} Lv 90 Recipes</span>
            <span className={styles.hairlineDivider} aria-hidden="true" />
            <span>{formatCraftWindow(mythicCraftTimeSeconds)} / craft</span>
          </div>

          <div className={styles.titleLine}>
            <span className={styles.titleIconWrap} aria-hidden="true">
              <Icon name="xp" size="lg" />
            </span>
            <h1 className={styles.title} id="mythic-lab-page-title">
              Mythic Lab
            </h1>
            <TooltipProvider skipDelayDuration={300}>
              <Tooltip placement="bottom" delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="How Mythic Alchemy Lab calculations work"
                  >
                    <Icon name="info" size="sm" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Level 90 Mythic recipes start at 25m base craft speed (reduced by Alchemy
                  Efficiency) and yield 8,000 Alchemy EXP plus 570 Speed EXP. Compare all 21
                  recipes or pin your active 30-use copies against market ({Math.round(taxRate * 100)}%
                  tax) and vendor paths.
                  {staleMarket && dataAgeMinutes !== null
                    ? ` Last market sync was about ${dataAgeMinutes} minutes ago.`
                    : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Badge size="sm" variant={effectiveMembership ? "success" : "neutral"}>
            {effectiveMembership ? "12% Member tax" : "15% Free tax"}
          </Badge>

          <Link href="/alchemy" className={styles.navPillLink}>
            <Icon name="alchemy" size="sm" aria-hidden="true" />
            <span>Alchemy Profit</span>
          </Link>

          <Link href="/crafting" className={styles.navPillLink}>
            <Icon name="market" size="sm" aria-hidden="true" />
            <span>
              Crafting Queue{queuedTotalUnits > 0 ? ` (${queuedTotalUnits.toLocaleString()})` : ""}
            </span>
          </Link>

          <Button variant="secondary" size="sm" onClick={onOpenDrawer}>
            <span className={styles.drawerBtnInner}>
              <Icon name="filter" size="sm" aria-hidden="true" />
              <span>Loadout &amp; Boosts</span>
              <Badge
                size="sm"
                variant={
                  hasWhatIfOverrides
                    ? "warning"
                    : buffTotals.activeModifierCount > 0
                      ? "refined"
                      : "neutral"
                }
              >
                {effLabel} Eff | {expLabel} EXP
              </Badge>
            </span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.spotlightStrip} aria-busy="true">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={styles.spotlightCellStatic}>
              <Skeleton width="32px" height="32px" variant="rectangular" />
              <div className={styles.spotlightMeta}>
                <Skeleton width="96px" height="11px" />
                <Skeleton width="136px" height="16px" />
                <Skeleton width="110px" height="11px" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.spotlightStrip}>
          <button
            type="button"
            className={styles.spotlightCell}
            disabled={!bestCatalog}
            onClick={() => bestCatalog && onOpenItem(bestCatalog.recipe.resultName)}
          >
            {bestCatalog?.recipe.imageUrl ? (
              <GameImage
                src={bestCatalog.recipe.imageUrl}
                alt={bestCatalog.recipe.resultName}
                width={34}
                height={34}
                className={styles.spotlightIcon}
              />
            ) : (
              <span className={styles.spotlightIconFallback}>
                <Icon name="skillProfit" size="md" aria-hidden="true" />
              </span>
            )}
            <div className={styles.spotlightMeta}>
              <span className={styles.spotlightLabel}>Best Profit / Hr</span>
              <strong className={styles.spotlightValue}>
                <GoldIcon size={14} />
                <span className={bestCatalog && bestCatalog.profitPerHour >= 0 ? "text-success" : "text-danger"}>
                  {bestCatalog ? `${formatSignedGold(bestCatalog.profitPerHour)}/hr` : "--"}
                </span>
              </strong>
              <span className={styles.spotlightSub}>
                {bestCatalog
                  ? `${bestCatalog.recipe.resultName} (${formatSignedGold(bestCatalog.profit)}/ea)`
                  : "No complete recipes"}
              </span>
            </div>
          </button>

          <button
            type="button"
            className={styles.spotlightCell}
            disabled={!bestExp}
            onClick={() => bestExp && onOpenItem(bestExp.recipe.resultName)}
          >
            {bestExp?.recipe.imageUrl ? (
              <GameImage
                src={bestExp.recipe.imageUrl}
                alt={bestExp.recipe.resultName}
                width={34}
                height={34}
                className={styles.spotlightIcon}
              />
            ) : (
              <span className={styles.spotlightIconFallback}>
                <Icon name="xp" size="md" aria-hidden="true" />
              </span>
            )}
            <div className={styles.spotlightMeta}>
              <span className={styles.spotlightLabel}>Max EXP / Hr</span>
              <strong className={styles.spotlightValue}>
                <span>{bestExp ? `${formatGold(bestExp.expPerHour)} XP/hr` : "--"}</span>
              </strong>
              <span className={styles.spotlightSub}>
                {bestExp
                  ? `+${formatGold(bestExp.alchemyExpEach)} Alchemy, +${formatGold(bestExp.speedExpPerCraft)} Speed`
                  : "No recipe data"}
              </span>
            </div>
          </button>

          <button
            type="button"
            className={styles.spotlightCell}
            onClick={() => onSelectTab("pinned")}
          >
            <span className={styles.spotlightIconFallback}>
              <Icon name="alchemy" size="md" aria-hidden="true" />
            </span>
            <div className={styles.spotlightMeta}>
              <span className={styles.spotlightLabel}>Pinned Return</span>
              <strong className={styles.spotlightValue}>
                {activeRowsCount > 0 && <GoldIcon size={14} />}
                <span
                  className={
                    activeRowsCount === 0
                      ? ""
                      : labSummary.totalPotentialProfit >= 0
                        ? "text-success"
                        : "text-danger"
                  }
                >
                  {activeRowsCount > 0 ? formatSignedGold(labSummary.totalPotentialProfit) : "0 pinned"}
                </span>
              </strong>
              <span className={styles.spotlightSub}>
                {activeRowsCount > 0
                  ? `${activeRowsCount} active | ${labStats.usesRemaining} uses left`
                  : "Pin recipes to track uses"}
              </span>
            </div>
          </button>

          <div className={styles.spotlightCellStatic}>
            <span className={styles.spotlightIconFallback}>
              <Icon
                name={labStats.priceGapProjects > 0 || staleMarket ? "warning" : "checkCircle"}
                size="md"
                aria-hidden="true"
              />
            </span>
            <div className={styles.spotlightMeta}>
              <span className={styles.spotlightLabel}>Catalog Pulse</span>
              <strong className={styles.spotlightValue}>
                <span>{labStats.catalogProfitableCount} / {mythicRecipesCount} profitable</span>
              </strong>
              <span className={styles.spotlightSub}>
                {labStats.priceGapProjects > 0
                  ? `${labStats.priceGapProjects} pinned need prices`
                  : staleMarket && dataAgeMinutes !== null
                    ? `Market synced ${dataAgeMinutes}m ago`
                    : labStats.catalogMissingCount > 0
                      ? `${labStats.catalogMissingCount} missing recipe avg`
                      : "All prices complete"}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
