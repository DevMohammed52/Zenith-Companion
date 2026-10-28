"use client";

import { BarChart3, Eye, Info, PackageSearch } from "lucide-react";
import { formatGold } from "@/lib/format";
import type { SkillProfitRow, SkillProfitSortKey } from "@/lib/skill-profit";
import styles from "../page.module.css";
import { SortableTh } from "./SkillProfitControls";
import {
  MOBILE_RESULT_BATCH_SIZE,
  formatSignedGold,
  getDisplayProfitPerHour,
  getMatchedIngredient,
  getProfitCellValue,
  getRankedProfitPerHour,
  isLiquid,
} from "../types";

export interface SkillProfitTableProps {
  visibleRows: SkillProfitRow[];
  hiddenRowCount: number;
  totalFilteredCount: number;
  minVolume: number;
  searchTokens: string[];
  sortKey: SkillProfitSortKey;
  sortDesc: boolean;
  onSort: (key: SkillProfitSortKey) => void;
  onSelectRow: (row: SkillProfitRow) => void;
  prefetchItem: (name: string) => void;
  onShowMore: () => void;
  onResetFilters: () => void;
}

export function SkillProfitTable({
  visibleRows,
  hiddenRowCount,
  totalFilteredCount,
  minVolume,
  searchTokens,
  sortKey,
  sortDesc,
  onSort,
  onSelectRow,
  prefetchItem,
  onShowMore,
  onResetFilters,
}: SkillProfitTableProps) {
  return (
    <section className={styles.tableWrap} aria-label="Skill profit route results table" role="region" tabIndex={0}>
      <table aria-label="Skill profit route results">
        <thead>
          <tr>
            <SortableTh sortKey="name" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} align="left" />
            <SortableTh sortKey="skill" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
            <SortableTh sortKey="level" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
            <SortableTh sortKey="profitPerHour" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
            <SortableTh sortKey="profitEach" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
            <SortableTh sortKey="inputCost" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
            <SortableTh sortKey="volume3d" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
            <th scope="col">Sell</th>
            <th scope="col">Liquidity</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const matchedIngredient = getMatchedIngredient(row, searchTokens);
            return (
              <tr
                key={`${row.skill}-${row.name}`}
                onClick={() => onSelectRow(row)}
              >
                <td className="left-align">
                  <div className={styles.nameCell}>
                    <button
                      className={styles.itemButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectRow(row);
                      }}
                      onMouseEnter={() => prefetchItem(row.name)}
                      type="button"
                    >
                      <PackageSearch size={14} />
                      {row.name}
                    </button>
                    <span className={styles.itemMeta}>
                      {row.note || `Return ${formatGold(row.netRevenue)}g - cost ${formatGold(row.inputCost)}g`}
                    </span>
                    {matchedIngredient && (
                      <span className={styles.materialMatchHint}>Uses {matchedIngredient}</span>
                    )}
                  </div>
                </td>
                <td>{row.skill}</td>
                <td className="mono">{row.level}</td>
                <td className={`mono ${getDisplayProfitPerHour(row) === null ? styles.mutedValue : getRankedProfitPerHour(row) >= 0 ? styles.positive : styles.negative}`}>
                  <div className={styles.profitCell}>
                    <strong>{getProfitCellValue(row)}</strong>
                    {row.essenceActive && (
                      <span>{row.essenceNeedsPrice ? `${formatGold(row.baseProfitPerHour)}g/hr base` : "with essence"}</span>
                    )}
                  </div>
                </td>
                <td className={`mono ${row.profitEach >= 0 ? styles.positive : styles.negative}`}>{formatSignedGold(row.profitEach)}</td>
                <td className="mono">{formatGold(row.inputCost)}g</td>
                <td className="mono" title={row.stableVolume3d !== row.volume3d ? `Raw 3-day volume: ${row.volume3d.toLocaleString()}` : undefined}>
                  {row.stableVolume3d.toLocaleString()}
                </td>
                <td>
                  <span className={`${styles.saleBadge} ${row.bestSaleSource === "vendor" ? styles.saleVendor : row.bestSaleSource === "custom" ? styles.saleCustom : styles.saleMarket}`}>
                    {row.bestSaleSource}
                  </span>
                </td>
                <td>
                  {row.skill === "Forge" ? (
                    <span className={`${styles.liquidityBadge} ${styles.liquidityInfo}`}><Info size={12} /> Info</span>
                  ) : row.liquidityRisk ? (
                    <>
                      <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`} title={row.liquidityNote}>
                        <Eye size={12} /> {row.liquidityLabel === "Spike risk" ? "Spike" : "Volume"}
                      </span>
                      {row.priceSwingRisk && (
                        <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`} title={row.priceSwingNote}>
                          <Eye size={12} /> Price
                        </span>
                      )}
                    </>
                  ) : row.priceSwingRisk ? (
                    <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`} title={row.priceSwingNote}>
                      <Eye size={12} /> Price
                    </span>
                  ) : isLiquid(row, minVolume) ? (
                    <span className={`${styles.liquidityBadge} ${styles.liquidityGood}`}><BarChart3 size={12} /> Liquid</span>
                  ) : (
                    <span className={`${styles.liquidityBadge} ${styles.liquidityWarn}`}><Eye size={12} /> Thin</span>
                  )}
                </td>
              </tr>
            );
          })}
          {hiddenRowCount > 0 && (
            <tr>
              <td colSpan={9}>
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
              </td>
            </tr>
          )}
          {totalFilteredCount === 0 && (
            <tr>
              <td colSpan={9}>
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
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
