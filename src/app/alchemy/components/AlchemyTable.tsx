"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import {
  Badge,
  Button,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { formatDuration, formatGold, formatMinutes, formatSignedGold } from "@/lib/alchemy-profit";
import type { AlchemyRateMode, AlchemyRow, AlchemySortKey } from "../types";
import {
  getActionLabel,
  getActionVariant,
  getAlchemyMatchHint,
  getSignalVariant,
  getVisibleAlchemyWarnings,
  highlightMatch,
} from "../utils/alchemy-helpers";
import styles from "../page.module.css";

interface AlchemyTableProps {
  rows: AlchemyRow[];
  sortCol: AlchemySortKey;
  sortDesc: boolean;
  rateMode: AlchemyRateMode;
  effectiveSessionHours: number;
  hasProfileAlchemyLevel: boolean;
  profileAlchemyLevel: number;
  deferredSearchTerm: string;
  queue: Record<string, number>;
  onSort: (col: AlchemySortKey) => void;
  onSelectRow: (row: AlchemyRow) => void;
  onOpenItem: (name: string) => void;
  onPrefetchItem: (name: string) => void;
  onAddToQueue: (name: string, qty: number) => void;
}

export function AlchemyTable({
  rows,
  sortCol,
  sortDesc,
  rateMode,
  effectiveSessionHours,
  hasProfileAlchemyLevel,
  profileAlchemyLevel,
  deferredSearchTerm,
  queue,
  onSort,
  onSelectRow,
  onOpenItem,
  onPrefetchItem,
  onAddToQueue,
}: AlchemyTableProps) {
  const renderSortHead = (
    col: AlchemySortKey,
    label: string,
    align: "left" | "right" = "right",
  ) => {
    const isActive = sortCol === col;
    const direction = isActive ? (sortDesc ? "descending" : "ascending") : "none";
    return (
      <TableHead align={align} aria-sort={direction}>
        <button
          aria-label={`Sort by ${label}`}
          className={styles.sortButton}
          onClick={() => onSort(col)}
          type="button"
        >
          <span>{label}</span>
          <Icon
            name={!isActive ? "sort" : sortDesc ? "sortDesc" : "sortAsc"}
            size="xs"
            aria-hidden="true"
          />
        </button>
      </TableHead>
    );
  };

  return (
    <TableContainer ariaLabel="Alchemy strategy results table" scrollShadows>
      <Table density="compact" hoverable>
        <TableHeader sticky>
          <TableRow>
            {renderSortHead("name", "Recipe", "left")}
            {renderSortHead("action", "Path", "left")}
            {renderSortHead("cost", "Cost", "right")}
            {renderSortHead("bestRevenue", "Return", "right")}
            {renderSortHead(
              rateMode === "session" ? "sessionProfit" : "profitPerHour",
              rateMode === "session" ? `${effectiveSessionHours}h Profit` : "Profit / Hr",
              "right",
            )}
            {renderSortHead("expPerHour", rateMode === "session" ? "Session EXP" : "EXP / Hr", "right")}
            {renderSortHead("vol_3", "Liquidity", "left")}
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => {
            const isLocked = hasProfileAlchemyLevel && row.level > profileAlchemyLevel;
            const primaryProfit =
              rateMode === "session" ? Math.round(row.sessionProfit) : Math.round(row.profitPerHour);
            const primaryExp =
              rateMode === "session" ? row.sessionExp : Math.round(row.expPerHour);
            const queuedQty = queue[row.name] || 0;
            const batchQty = Math.max(1, row.craftsPerSession || Math.round(row.craftsPerHour) || 1);
            const matchHint = getAlchemyMatchHint(row, deferredSearchTerm);

            return (
              <TableRow
                key={`alchemy-row-${rowIndex}`}
                className={`${styles.clickableRow} ${row.status === "missing" ? styles.rowMuted : ""}`}
                onClick={() => row.status === "ok" && onSelectRow(row)}
              >
                <TableCell align="left">
                  <div className={styles.recipeCell}>
                    <div className={styles.itemThumb}>
                      {row.imageUrl ? (
                        <GameImage src={row.imageUrl} alt={row.name} width={26} height={26} sizes="26px" />
                      ) : (
                        <Icon name="alchemy" size="sm" aria-hidden="true" />
                      )}
                    </div>
                    <div className={styles.recipeMeta}>
                      <div className={styles.recipeTitleLine}>
                        <button
                          type="button"
                          className={styles.recipeNameBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenItem(row.name);
                          }}
                          onMouseEnter={() => onPrefetchItem(row.name)}
                        >
                          <QualityText value={row.quality}>
                            {highlightMatch(row.name, deferredSearchTerm)}
                          </QualityText>
                        </button>
                        <span className={styles.metaPill}>Lv {row.level}</span>
                        <span
                          className={styles.metaPill}
                          title={row.efficiencyBonus !== 0 ? `${formatDuration(row.baseTime)} base` : undefined}
                        >
                          {formatMinutes(row.time)}m
                        </span>
                        {isLocked && (
                          <Badge size="sm" variant="warning">
                            Locked
                          </Badge>
                        )}
                        {queuedQty > 0 && (
                          <Badge size="sm" variant="refined">
                            {queuedQty} queued
                          </Badge>
                        )}
                      </div>
                      {matchHint && <span className={styles.matchHint}>{matchHint}</span>}
                      <span className={styles.recipeSubline}>
                        {row.ingredientCosts.map((i) => `${i.quantity}x ${i.name}`).join(" + ")} +{" "}
                        {row.vialName}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell align="left">
                  {row.status === "missing" ? (
                    <Badge size="sm" variant="danger">
                      No data
                    </Badge>
                  ) : (
                    <Badge size="sm" variant={getActionVariant(row.action)}>
                      {getActionLabel(row.action)}
                    </Badge>
                  )}
                </TableCell>

                <TableCell align="right">
                  {row.status === "missing" ? (
                    "N/A"
                  ) : (
                    <span className={styles.moneyValue}>
                      <GoldIcon size={12} />
                      {formatGold(row.cost)}g
                    </span>
                  )}
                </TableCell>

                <TableCell align="right">
                  {row.status === "missing" ? (
                    "N/A"
                  ) : (
                    <span className={styles.moneyValue}>
                      <GoldIcon size={12} />
                      {formatGold(row.bestRevenue)}g
                    </span>
                  )}
                </TableCell>

                <TableCell align="right">
                  {row.status === "missing" ? (
                    "N/A"
                  ) : (
                    <div className={styles.cellStack}>
                      <span
                        className={`${styles.moneyValue} ${
                          primaryProfit >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        <GoldIcon size={12} />
                        {formatSignedGold(primaryProfit)}
                      </span>
                      <span className={styles.cellSub}>
                        <span>{formatSignedGold(row.profit)}/pc</span>
                        <span className={styles.hairlineDivider} aria-hidden="true" />
                        <span>
                          {rateMode === "session"
                            ? `${row.craftsPerSession} crafts`
                            : `${row.craftsPerHour.toFixed(1)}/hr`}
                        </span>
                      </span>
                    </div>
                  )}
                </TableCell>

                <TableCell align="right">
                  <div
                    className={styles.cellStack}
                    title={`+${Math.round(row.alchemyExpEach)} Alchemy EXP and +${row.baseSpeedExp} base Speed EXP per craft`}
                  >
                    <span className={styles.moneyValue}>{formatGold(primaryExp)}</span>
                    <span className={styles.cellSub}>
                      +{formatGold(Math.round(row.alchemyExpEach))}/ea
                    </span>
                  </div>
                </TableCell>

                <TableCell
                  align="left"
                  title={
                    row.stableVol_3 !== row.vol_3
                      ? `Raw 3d volume: ${formatGold(row.vol_3)}`
                      : row.liquidityNote
                  }
                >
                  <div className={styles.signalStack}>
                    <div className={styles.recipeTitleLine}>
                      <Badge size="sm" variant={getSignalVariant(row.signal)}>
                        {row.signal}
                      </Badge>
                      <span className={styles.metaPill}>{formatGold(row.stableVol_3)} sold</span>
                    </div>
                    {getVisibleAlchemyWarnings(row)
                      .slice(0, 1)
                      .map((warning) => (
                        <span key={warning} className={styles.recipeSubline}>
                          {warning}
                        </span>
                      ))}
                  </div>
                </TableCell>

                <TableCell align="right">
                  <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={row.status !== "ok"}
                      aria-label={`Add ${batchQty} ${row.name} to crafting queue`}
                      onClick={() => onAddToQueue(row.name, batchQty)}
                    >
                      <Icon name="plus" size="xs" aria-hidden="true" />
                      <span>Queue</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={row.status !== "ok"}
                      aria-label={`Inspect ${row.name} strategy`}
                      onClick={() => onSelectRow(row)}
                    >
                      <span>Details</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
