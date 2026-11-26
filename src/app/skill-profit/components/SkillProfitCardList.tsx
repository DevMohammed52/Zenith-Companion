"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Badge, EmptyState, Icon, Pagination } from "@/components/ui";
import { formatGold } from "@/lib/format";
import { getProfileSkillLevel, type CharacterProfile } from "@/lib/profiles";
import type { SkillProfitRow } from "@/lib/skill-profit";
import styles from "../page.module.css";
import {
  formatDurationSeconds,
  formatOptionalNumber,
  formatPriceSource,
  formatSignedGold,
  getDisplayProfitPerHour,
  getMatchedIngredient,
  getProfitCellValue,
  getRankedProfitPerHour,
  isLiquid,
  PAGE_SIZE_OPTIONS,
  type RateMode,
} from "../types";

export interface SkillProfitCardListProps {
  visibleRows: SkillProfitRow[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  minVolume: number;
  rateMode: RateMode;
  baseIdleActionHours: number;
  configuredProfile: CharacterProfile | null;
  searchTokens: string[];
  allItemsDb?: Record<string, any> | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectRow: (row: SkillProfitRow) => void;
  prefetchItem: (name: string) => void;
  onResetFilters: () => void;
}

export function SkillProfitCardList({
  visibleRows,
  totalFilteredCount,
  currentPage,
  totalPages,
  pageSize,
  minVolume,
  rateMode,
  baseIdleActionHours,
  configuredProfile,
  searchTokens,
  allItemsDb,
  onPageChange,
  onPageSizeChange,
  onSelectRow,
  prefetchItem,
  onResetFilters,
}: SkillProfitCardListProps) {
  if (totalFilteredCount === 0) {
    return (
      <EmptyState
        variant="search-empty"
        title="No routes match this search"
        description="Try clearing the search query or relaxing Liquid / Volume / Level filters."
        action={{ label: "Reset filters", onClick: onResetFilters }}
      />
    );
  }

  return (
    <div>
      <section className={styles.mobileResults} aria-label="Skill profit routes">
        {visibleRows.map((row) => {
          const displayProfit = getDisplayProfitPerHour(row);
          const rankedProfit = getRankedProfitPerHour(row);
          const idleHours = baseIdleActionHours + row.housingWindowHours;
          const sessionProfit =
            displayProfit === null
              ? null
              : Math.round(displayProfit * idleHours);
          const shownRate = rateMode === "session" ? sessionProfit : displayProfit;
          const matchedIngredient = getMatchedIngredient(row, searchTokens);
          const itemImage = allItemsDb?.[row.name]?.image_url;
          const playerSkillLevel = configuredProfile ? getProfileSkillLevel(configuredProfile, row.skill) : null;
          const isLocked = playerSkillLevel !== null && row.level > playerSkillLevel;

          const liquidityBadge = row.liquidityRisk
            ? { label: row.liquidityLabel === "Spike risk" ? "Spike" : "Low vol", variant: "warning" as const }
            : row.priceSwingRisk
              ? { label: "Swing", variant: "warning" as const }
              : isLiquid(row, minVolume)
                ? { label: "Liquid", variant: "success" as const }
                : { label: "Thin", variant: "warning" as const };

          return (
            <article className={styles.mobileResultCard} key={`card-${row.skill}-${row.name}`}>
              <div className={styles.mobileCardTop}>
                <button
                  aria-label={`Open ${row.name} ${row.skill} strategy`}
                  className={styles.mobileCardTrigger}
                  onClick={() => onSelectRow(row)}
                  onMouseEnter={() => prefetchItem(row.name)}
                  type="button"
                >
                  <span className={styles.itemThumb} aria-hidden="true">
                    <GameImage
                      src={itemImage}
                      alt=""
                      width={30}
                      height={30}
                      sizes="30px"
                      fallback={<Icon name="items" size="xs" />}
                    />
                  </span>
                  <span className={styles.itemTextGroup}>
                    <span className={styles.itemButton}>{row.name}</span>
                    <span className={styles.itemMeta}>
                      {row.skill} Lv {row.level}
                      {isLocked ? " (Locked)" : ""}
                    </span>
                  </span>
                </button>

                <div className={styles.mobileCardBadges}>
                  <Badge
                    size="sm"
                    variant={
                      row.bestSaleSource === "vendor"
                        ? "success"
                        : row.bestSaleSource === "missing"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {formatPriceSource(row.bestSaleSource)}
                  </Badge>
                  <Badge size="sm" variant={liquidityBadge.variant}>
                    {liquidityBadge.label}
                  </Badge>
                </div>
              </div>

              <div className={styles.mobileResultProfit}>
                <strong
                  className={`${styles.currencyReadout} ${
                    shownRate === null
                      ? styles.mutedValue
                      : (rateMode === "session" ? shownRate : rankedProfit) >= 0
                        ? styles.positive
                        : styles.negative
                  }`}
                >
                  {shownRate !== null && <GoldIcon size={13} />}
                  <span>
                    {shownRate === null
                      ? "Needs price"
                      : rateMode === "session"
                        ? `${formatGold(shownRate)}g`
                        : getProfitCellValue(row)}
                  </span>
                </strong>
                <small>
                  {rateMode === "session"
                    ? `${idleHours.toFixed(1)}h idle session`
                    : `${row.itemsPerHour.toLocaleString()} actions/hr`}
                </small>
              </div>

              <div className={styles.mobileResultGrid}>
                <div className={styles.mobileStatCell}>
                  <span>EXP / hr</span>
                  <strong>{formatOptionalNumber(row.expPerHour)}</strong>
                </div>
                <div className={styles.mobileStatCell}>
                  <span>Profit each</span>
                  <strong className={row.profitEach >= 0 ? styles.positive : styles.negative}>
                    {formatSignedGold(row.profitEach)}
                  </strong>
                </div>
                <div className={styles.mobileStatCell}>
                  <span>Cost</span>
                  <strong>{formatGold(row.inputCost)}g</strong>
                </div>
                <div className={styles.mobileStatCell}>
                  <span>Action time</span>
                  <strong>{formatDurationSeconds(row.finalDuration)}</strong>
                </div>
                <div className={styles.mobileStatCell}>
                  <span>3d Vol</span>
                  <strong>{row.stableVolume3d.toLocaleString()}</strong>
                </div>
              </div>

              {(row.note || matchedIngredient) && (
                <p className={styles.mobileResultNote}>
                  {matchedIngredient ? `Uses ${matchedIngredient}` : row.note}
                </p>
              )}
            </article>
          );
        })}
      </section>

      <div className={styles.paginationWrap}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalFilteredCount}
          pageSize={pageSize}
          pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          showPageSize
          showSummary
          itemLabel="routes"
        />
      </div>
    </div>
  );
}
