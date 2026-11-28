"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import {
  Badge,
  EmptyState,
  Icon,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
} from "@/components/ui";
import { formatGold } from "@/lib/format";
import { getProfileSkillLevel, type CharacterProfile } from "@/lib/profiles";
import type { SkillProfitRow, SkillProfitSortKey } from "@/lib/skill-profit";
import styles from "../page.module.css";
import { SortableTh } from "./SkillProfitControls";
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

export interface SkillProfitTableProps {
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
  sortKey: SkillProfitSortKey;
  sortDesc: boolean;
  allItemsDb?: Record<string, any> | null;
  onSort: (key: SkillProfitSortKey) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectRow: (row: SkillProfitRow) => void;
  prefetchItem: (name: string) => void;
  onResetFilters: () => void;
}

export function SkillProfitTable({
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
  sortKey,
  sortDesc,
  allItemsDb,
  onSort,
  onPageChange,
  onPageSizeChange,
  onSelectRow,
  prefetchItem,
  onResetFilters,
}: SkillProfitTableProps) {
  if (totalFilteredCount === 0) {
    return (
      <div className={styles.tableWrap}>
        <EmptyState
          variant="search-empty"
          title="No skill routes match these filters"
          description="Try clearing the search query or relaxing Liquid / Volume / Level filters."
          action={{ label: "Reset filters", onClick: onResetFilters }}
        />
      </div>
    );
  }

  return (
    <section className={styles.tableWrap} aria-label="Skill profit route results table">
      <TableContainer ariaLabel="Skill profit route results">
        <Table hoverable>
          <TableHeader>
            <TableRow>
              <SortableTh sortKey="name" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} align="left" />
              <SortableTh sortKey="skill" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} align="left" />
              <SortableTh sortKey="level" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
              <SortableTh
                sortKey="profitPerHour"
                label={rateMode === "session" ? "Session Profit" : "Gold/Hr"}
                activeKey={sortKey}
                sortDesc={sortDesc}
                onSort={onSort}
              />
              <SortableTh sortKey="expPerHour" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
              <SortableTh sortKey="profitEach" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
              <SortableTh sortKey="inputCost" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
              <SortableTh sortKey="volume3d" activeKey={sortKey} sortDesc={sortDesc} onSort={onSort} />
              <TableHead align="left">Sell &amp; Market</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => {
              const matchedIngredient = getMatchedIngredient(row, searchTokens);
              const itemImage = allItemsDb?.[row.name]?.image_url;
              const displayProfit = getDisplayProfitPerHour(row);
              const rankedProfit = getRankedProfitPerHour(row);
              const idleHours = baseIdleActionHours + row.housingWindowHours;
              const sessionActions = Math.floor(row.itemsPerHour * idleHours);
              const sessionProfit =
                displayProfit === null
                  ? null
                  : Math.round(displayProfit * idleHours);

              const shownRateProfit = rateMode === "session" ? sessionProfit : displayProfit;
              const shownRateLabel =
                shownRateProfit === null
                  ? "Needs price"
                  : rateMode === "session"
                    ? `${formatGold(shownRateProfit)}g`
                    : getProfitCellValue(row);
              const profitClass =
                shownRateProfit === null
                  ? styles.mutedValue
                  : (rateMode === "session" ? shownRateProfit : rankedProfit) >= 0
                    ? styles.positive
                    : styles.negative;

              const playerSkillLevel = configuredProfile ? getProfileSkillLevel(configuredProfile, row.skill) : null;
              const isLocked = playerSkillLevel !== null && row.level > playerSkillLevel;

              const statusBadge = row.liquidityRisk
                ? {
                    variant: "warning" as const,
                    label: row.liquidityLabel === "Spike risk" ? "Spike" : "Low vol",
                    note: row.liquidityNote,
                  }
                : row.priceSwingRisk
                  ? { variant: "warning" as const, label: "Swing", note: row.priceSwingNote }
                  : isLiquid(row, minVolume)
                    ? { variant: "success" as const, label: "Liquid", note: `Steady ${row.stableVolume3d.toLocaleString()} / 3d volume` }
                    : { variant: "warning" as const, label: "Thin", note: `Below ${minVolume.toLocaleString()} / 3d min volume` };

              return (
                <TableRow
                  key={`${row.skill}-${row.name}`}
                  className="clickable-row"
                  onClick={() => onSelectRow(row)}
                >
                  <TableCell>
                    <div className={styles.nameCell}>
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
                      <div className={styles.itemTextGroup}>
                        <div className={styles.itemTitleLine}>
                          <button
                            className={styles.itemButton}
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectRow(row);
                            }}
                            onMouseEnter={() => prefetchItem(row.name)}
                            type="button"
                          >
                            {row.name}
                          </button>
                          {row.essenceActive && (
                            <Badge size="sm" variant="refined">
                              Essence
                            </Badge>
                          )}
                        </div>
                        <span className={styles.itemMeta}>
                          {formatDurationSeconds(row.finalDuration)} | {row.itemsPerHour.toLocaleString()}/hr
                          {row.note ? ` | ${row.note}` : ""}
                        </span>
                        {matchedIngredient && (
                          <span className={styles.materialMatchHint}>Uses {matchedIngredient}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{row.skill}</TableCell>
                  <TableCell align="right">
                    <span className={`${styles.levelCell} ${isLocked ? styles.levelLocked : ""}`}>
                      {isLocked && <Icon name="locked" size="xs" aria-label={`Requires level ${row.level}`} />}
                      <span>{row.level}</span>
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <div className={styles.profitCell}>
                      <span className={`${styles.currencyReadout} ${profitClass}`}>
                        {shownRateProfit !== null && <GoldIcon size={13} />}
                        <span>{shownRateLabel}</span>
                      </span>
                      <span className={styles.profitSub}>
                        {rateMode === "session"
                          ? `${sessionActions.toLocaleString()}x over ${idleHours.toFixed(1)}h`
                          : row.essenceActive && row.essenceNeedsPrice
                            ? `${formatGold(row.baseProfitPerHour)}g/hr base`
                            : sessionProfit !== null
                              ? `${formatGold(sessionProfit)}g / ${idleHours.toFixed(1)}h`
                              : null}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    {rateMode === "session" && row.expPerHour !== null
                      ? formatOptionalNumber(Math.round(row.expPerHour * idleHours))
                      : formatOptionalNumber(row.expPerHour)}
                  </TableCell>
                  <TableCell align="right">
                    <span
                      className={`${styles.currencyReadout} ${
                        row.profitEach >= 0 ? styles.positive : styles.negative
                      }`}
                    >
                      <GoldIcon size={12} />
                      <span>{formatSignedGold(row.profitEach)}</span>
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <span className={styles.currencyReadout}>
                      <GoldIcon size={12} />
                      <span>{formatGold(row.inputCost)}g</span>
                    </span>
                  </TableCell>
                  <TableCell align="right">{row.stableVolume3d.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className={styles.liquidityWrap}>
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
                      <Tooltip content={statusBadge.note || statusBadge.label}>
                        <span tabIndex={0}>
                          <Badge size="sm" variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </span>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

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
    </section>
  );
}
