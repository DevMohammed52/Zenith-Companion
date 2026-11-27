"use client";

import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
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
import { formatGold, formatSignedGold } from "@/lib/alchemy-profit";
import type { AlchemyRateMode, AlchemyRow, AlchemySummary } from "../types";
import styles from "../page.module.css";

interface AlchemyHeaderProps {
  isLoading: boolean;
  activeProfileName: string;
  profileAlchemyLevel: number;
  hasProfileAlchemyLevel: boolean;
  membership: boolean;
  marketTaxRate: number;
  efficiencyBonus: number;
  expBonus: number;
  effectiveSessionHours: number;
  activeModifierCount: number;
  hasWhatIfOverrides: boolean;
  rateMode: AlchemyRateMode;
  summary: AlchemySummary;
  strategyCount: number;
  queuedRecipeCount: number;
  queuedTotalUnits: number;
  staleMarket: boolean;
  dataAgeMinutes: number | null;
  onOpenDrawer: () => void;
  onSelectRow: (row: AlchemyRow) => void;
}

function SpotlightCell({
  icon,
  label,
  row,
  value,
  subLeft,
  subRight,
  onSelect,
}: {
  icon: "gold" | "xp" | "skillProfit";
  label: string;
  row?: AlchemyRow;
  value: string;
  subLeft?: string;
  subRight?: string;
  onSelect: (row: AlchemyRow) => void;
}) {
  return (
    <button
      aria-label={row ? `${label}: ${value} for ${row.name}. Open strategy.` : `${label}: none`}
      className={styles.spotlightCell}
      disabled={!row}
      onClick={() => row && onSelect(row)}
      type="button"
    >
      <div className={styles.itemThumb}>
        {row?.imageUrl ? (
          <GameImage src={row.imageUrl} alt={row.name} width={26} height={26} sizes="26px" />
        ) : (
          <Icon name={icon} size="sm" aria-hidden="true" />
        )}
      </div>
      <div className={styles.spotlightMeta}>
        <div className={styles.spotlightLabelRow}>
          <span className={styles.spotlightLabel}>{label}</span>
          <span className={styles.spotlightValue}>
            {icon === "gold" && row && <GoldIcon size={12} />}
            <span>{value}</span>
          </span>
        </div>
        <div className={styles.spotlightItemName}>
          {row ? <QualityText value={row.quality}>{row.name}</QualityText> : "No matching recipe"}
        </div>
        {(subLeft || subRight) && (
          <div className={styles.spotlightSubPair}>
            {subLeft && <span>{subLeft}</span>}
            {subLeft && subRight && <span className={styles.hairlineDivider} aria-hidden="true" />}
            {subRight && <span>{subRight}</span>}
          </div>
        )}
      </div>
    </button>
  );
}

export function AlchemyHeader({
  isLoading,
  activeProfileName,
  profileAlchemyLevel,
  hasProfileAlchemyLevel,
  membership,
  marketTaxRate,
  efficiencyBonus,
  expBonus,
  effectiveSessionHours,
  activeModifierCount,
  hasWhatIfOverrides,
  rateMode,
  summary,
  strategyCount,
  queuedRecipeCount,
  queuedTotalUnits,
  staleMarket,
  dataAgeMinutes,
  onOpenDrawer,
  onSelectRow,
}: AlchemyHeaderProps) {
  const hourlyBest = summary.hourly;
  const bestGoldValue = hourlyBest
    ? rateMode === "session"
      ? `${formatSignedGold(Math.round(hourlyBest.sessionProfit))} (${effectiveSessionHours}h)`
      : `${formatSignedGold(Math.round(hourlyBest.profitPerHour))}/hr`
    : "N/A";

  const bestXpRow = summary.xp;
  const bestXpValue = bestXpRow
    ? rateMode === "session"
      ? `${formatGold(bestXpRow.sessionExp)} XP`
      : `${formatGold(Math.round(bestXpRow.expPerHour))} XP/hr`
    : "N/A";

  const volumeRow = summary.volume;
  const effLabel = efficiencyBonus >= 0 ? `+${efficiencyBonus}%` : `${efficiencyBonus}%`;
  const expLabel = expBonus >= 0 ? `+${expBonus}%` : `${expBonus}%`;

  return (
    <header className={styles.headerBlock}>
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>
            <Icon name="alchemy" size="sm" aria-hidden="true" />
            <span>{activeProfileName}</span>
            {hasProfileAlchemyLevel && (
              <>
                <span className={styles.hairlineDivider} aria-hidden="true" />
                <span>Alchemy Lv {profileAlchemyLevel}</span>
              </>
            )}
            <span className={styles.hairlineDivider} aria-hidden="true" />
            <span>{strategyCount} recipes</span>
          </span>
          <div className={styles.recipeTitleLine}>
            <h1 className={styles.title} id="alchemy-page-title">
              Alchemy Profit
            </h1>
            <TooltipProvider skipDelayDuration={300}>
              <Tooltip placement="bottom" delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="How Alchemy profit is calculated"
                  >
                    <Icon name="info" size="sm" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Compares selling brewed potions/crystals on the Market (after{" "}
                  {Math.round(marketTaxRate * 100)}% tax) or Vendor (with Bartering) against buying
                  or selling the raw ingredients.
                  {staleMarket && dataAgeMinutes !== null
                    ? ` Market sync was about ${dataAgeMinutes} minutes ago.`
                    : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Badge size="sm" variant={membership ? "success" : "neutral"}>
            {membership ? "12% Member tax" : "15% Free tax"}
          </Badge>

          <Link href="/crafting" className={styles.navPillLink}>
            <Icon name="market" size="sm" aria-hidden="true" />
            <span>
              Crafting Queue{queuedRecipeCount > 0 ? ` (${queuedTotalUnits.toLocaleString()})` : ""}
            </span>
          </Link>

          <Link href="/alchemy/mythic" className={styles.navPillLink}>
            <Icon name="xp" size="sm" aria-hidden="true" />
            <span>Mythic Lab (Lv 90)</span>
          </Link>

          <Button variant="secondary" size="sm" onClick={onOpenDrawer}>
            <span className={styles.drawerBtnInner}>
              <Icon name="filter" size="sm" aria-hidden="true" />
              <span>Loadout &amp; Boosts</span>
              <Badge size="sm" variant={hasWhatIfOverrides ? "warning" : activeModifierCount > 0 ? "refined" : "neutral"}>
                {effLabel} Eff / {expLabel} EXP
              </Badge>
            </span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.spotlightStrip} aria-busy="true">
          <div className={styles.spotlightCell}>
            <Skeleton width="32px" height="32px" variant="rectangular" />
            <div className={styles.spotlightMeta}>
              <Skeleton width="120px" height="12px" />
              <Skeleton width="150px" height="16px" />
            </div>
          </div>
          <div className={styles.spotlightCell}>
            <Skeleton width="32px" height="32px" variant="rectangular" />
            <div className={styles.spotlightMeta}>
              <Skeleton width="110px" height="12px" />
              <Skeleton width="140px" height="16px" />
            </div>
          </div>
          <div className={styles.spotlightCell}>
            <Skeleton width="32px" height="32px" variant="rectangular" />
            <div className={styles.spotlightMeta}>
              <Skeleton width="130px" height="12px" />
              <Skeleton width="140px" height="16px" />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.spotlightStrip} role="region" aria-label="Top alchemy routes">
          <SpotlightCell
            icon="gold"
            label={rateMode === "session" ? "Best Session Profit" : "Best Profit / Hr"}
            row={hourlyBest}
            value={bestGoldValue}
            subLeft={hourlyBest ? `${formatSignedGold(hourlyBest.profit)}/pc` : undefined}
            subRight={hourlyBest ? `${hourlyBest.craftsPerHour.toFixed(1)} crafts/hr` : undefined}
            onSelect={onSelectRow}
          />
          <SpotlightCell
            icon="xp"
            label={rateMode === "session" ? "Highest Session EXP" : "Highest EXP / Hr"}
            row={bestXpRow}
            value={bestXpValue}
            subLeft={bestXpRow ? `+${formatGold(Math.round(bestXpRow.alchemyExpEach))} Alchemy XP` : undefined}
            subRight={bestXpRow ? `+${bestXpRow.baseSpeedExp} Speed XP` : undefined}
            onSelect={onSelectRow}
          />
          <SpotlightCell
            icon="skillProfit"
            label="Highest 3D Volume"
            row={volumeRow}
            value={volumeRow ? `${formatGold(volumeRow.stableVol_3)} sold` : "N/A"}
            subLeft={volumeRow ? `${formatSignedGold(volumeRow.profit)}/pc` : undefined}
            subRight={volumeRow ? `Lv ${volumeRow.level}` : undefined}
            onSelect={onSelectRow}
          />
        </div>
      )}
    </header>
  );
}
