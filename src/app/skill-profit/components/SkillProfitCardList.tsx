"use client";

import { formatGold } from "@/lib/format";
import type { SkillProfitRow } from "@/lib/skill-profit";
import styles from "../page.module.css";
import {
  MOBILE_RESULT_BATCH_SIZE,
  formatSignedGold,
  getDisplayProfitPerHour,
  getMatchedIngredient,
  getProfitCellValue,
  getRankedProfitPerHour,
  isLiquid,
} from "../types";

export interface SkillProfitCardListProps {
  visibleRows: SkillProfitRow[];
  hiddenRowCount: number;
  totalFilteredCount: number;
  minVolume: number;
  searchTokens: string[];
  onSelectRow: (row: SkillProfitRow) => void;
  prefetchItem: (name: string) => void;
  onShowMore: () => void;
  onResetFilters: () => void;
}

export function SkillProfitCardList({
  visibleRows,
  hiddenRowCount,
  totalFilteredCount,
  minVolume,
  searchTokens,
  onSelectRow,
  prefetchItem,
  onShowMore,
  onResetFilters,
}: SkillProfitCardListProps) {
  return (
    <section className={styles.mobileResults} aria-label="Skill profit routes">
      {visibleRows.map((row) => {
        const displayProfit = getDisplayProfitPerHour(row);
        const matchedIngredient = getMatchedIngredient(row, searchTokens);
        const liquidityText = row.skill === "Forge"
          ? "Info"
          : row.liquidityRisk
            ? row.liquidityLabel === "Spike risk" ? "Spike risk" : "Volume risk"
            : row.priceSwingRisk
              ? "Price risk"
              : isLiquid(row, minVolume) ? "Liquid" : "Thin";
        return (
          <button
            aria-label={`Open ${row.name} ${row.skill} strategy`}
            className={styles.mobileResultCard}
            key={`mobile-${row.skill}-${row.name}`}
            onClick={() => onSelectRow(row)}
            onMouseEnter={() => prefetchItem(row.name)}
            type="button"
          >
            <span className={styles.mobileResultTop}>
              <span>{row.skill} Lvl {row.level}</span>
              <span className={`${styles.saleBadge} ${row.bestSaleSource === "vendor" ? styles.saleVendor : row.bestSaleSource === "custom" ? styles.saleCustom : styles.saleMarket}`}>
                {row.bestSaleSource}
              </span>
            </span>
            <strong>{row.name}</strong>
            <span className={styles.mobileResultProfit}>
              <span className={displayProfit === null ? styles.mutedValue : getRankedProfitPerHour(row) >= 0 ? styles.positive : styles.negative}>
                {getProfitCellValue(row)}
              </span>
              <small>{row.essenceActive && row.essenceNeedsPrice ? `${formatGold(row.baseProfitPerHour)}g/hr base` : `${row.itemsPerHour.toLocaleString()} actions/hr`}</small>
            </span>
            <span className={styles.mobileResultGrid}>
              <span><em>Each</em>{formatSignedGold(row.profitEach)}</span>
              <span><em>Cost</em>{formatGold(row.inputCost)}g</span>
              <span><em>Volume</em>{row.stableVolume3d.toLocaleString()}</span>
              <span><em>Status</em>{liquidityText}</span>
            </span>
            {(row.note || matchedIngredient) && (
              <small className={styles.mobileResultNote}>
                {matchedIngredient ? `Uses ${matchedIngredient}` : row.note}
              </small>
            )}
          </button>
        );
      })}
      {hiddenRowCount > 0 && (
        <div className={styles.resultBatchMore} role="status">
          <span>
            Showing {visibleRows.length.toLocaleString()} of {totalFilteredCount.toLocaleString()} routes.
          </span>
          <button
            type="button"
            onClick={onShowMore}
          >
            Show {Math.min(MOBILE_RESULT_BATCH_SIZE, hiddenRowCount).toLocaleString()} more
          </button>
        </div>
      )}
      {totalFilteredCount === 0 && (
        <div className={styles.emptyRoutes} role="status">
          <strong>No routes match this search</strong>
          <span>Try an item name, skill, material, essence, sale source, or liquidity label.</span>
          <button
            onClick={onResetFilters}
            type="button"
          >
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
