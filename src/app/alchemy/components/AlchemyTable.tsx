"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AlchemyRow, AlchemySortKey } from "../types";
import {
  formatDuration,
  formatGold,
  formatMinutes,
  formatSignedGold,
  getAlchemyMatchHint,
  getSignalClass,
  getVisibleAlchemyWarnings,
  highlightMatch,
} from "../utils/alchemy-helpers";
import { Badge, PathBadge } from "./AlchemyBadges";

export function AlchemyTable({
  rows,
  sortCol,
  sortDesc,
  onSort,
  deferredSearchTerm,
  onSelectRow,
  onOpenItem,
  onPrefetchItem,
}: {
  rows: AlchemyRow[];
  sortCol: AlchemySortKey;
  sortDesc: boolean;
  onSort: (col: AlchemySortKey) => void;
  deferredSearchTerm: string;
  onSelectRow: (row: AlchemyRow) => void;
  onOpenItem: (name: string) => void;
  onPrefetchItem: (name: string) => void;
}) {
  const renderSortIcon = (col: AlchemySortKey) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  const renderSortHeader = (col: AlchemySortKey, label: string, className = "") => {
    const isActive = sortCol === col;
    const nextDirection = isActive && sortDesc ? "ascending" : "descending";
    return (
      <th
        aria-sort={isActive ? (sortDesc ? "descending" : "ascending") : "none"}
        className={`sortable ${className}`.trim()}
      >
        <button
          aria-label={`Sort by ${label} ${nextDirection}`}
          className="alchemy-sort-button"
          onClick={() => onSort(col)}
          type="button"
        >
          <span>{label}</span>
          {renderSortIcon(col) || <span aria-hidden="true" className="alchemy-sort-spacer" />}
        </button>
      </th>
    );
  };

  return (
    <div className="desktop-only">
      <div
        aria-label="Alchemy strategy results table"
        className="table-container"
        role="region"
        tabIndex={0}
      >
        <table className="alchemy-table">
          <thead>
            <tr>
              {renderSortHeader("name", "Recipe", "left-align")}
              {renderSortHeader("level", "Lvl")}
              {renderSortHeader("action", "Best Path")}
              {renderSortHeader("cost", "Cost")}
              {renderSortHeader("bestRevenue", "Return")}
              {renderSortHeader("profitPerHour", "Profit/Hr")}
              {renderSortHeader("profit", "Profit / pc")}
              {renderSortHeader("vol_3", "Stable Vol")}
              {renderSortHeader("time", "Time (min)")}
              <th>Liquidity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                aria-disabled={row.status !== "ok"}
                key={row.name}
                onClick={() => row.status === "ok" && onSelectRow(row)}
                className={`clickable-row ${row.status === "missing" ? "row-muted" : ""}`}
              >
                <td className="item-name left-align">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenItem(row.name);
                    }}
                    onMouseEnter={() => onPrefetchItem(row.name)}
                    className="alchemy-recipe-link"
                  >
                    {highlightMatch(row.name, deferredSearchTerm)}
                  </button>
                  {getAlchemyMatchHint(row, deferredSearchTerm) && (
                    <span className="alchemy-match-hint">
                      {getAlchemyMatchHint(row, deferredSearchTerm)}
                    </span>
                  )}
                  <small>{row.status === "missing" ? row.warnings[0] : row.reason}</small>
                </td>
                <td className="mono text-muted">{row.level}</td>
                <td>
                  {row.status === "missing" ? (
                    <Badge label="NO DATA" tone="bad" />
                  ) : (
                    <PathBadge action={row.action} />
                  )}
                </td>
                <td className="mono text-muted">
                  {row.status === "missing" ? "N/A" : `${formatGold(row.cost)}g`}
                </td>
                <td className="mono text-main">
                  {row.status === "missing" ? "N/A" : `${formatGold(row.bestRevenue)}g`}
                </td>
                <td
                  className={`mono ${
                    row.profitPerHour >= 0 ? "profit-positive" : "profit-negative"
                  }`}
                >
                  {row.status === "missing" ? "N/A" : formatSignedGold(row.profitPerHour)}
                </td>
                <td className={`mono ${row.profit >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {row.status === "missing" ? "N/A" : formatSignedGold(row.profit)}
                </td>
                <td
                  className={`mono ${row.stableVol_3 > 0 ? "text-main" : "text-muted"}`}
                  title={
                    row.stableVol_3 !== row.vol_3
                      ? `Raw 3-day volume: ${formatGold(row.vol_3)}`
                      : row.liquidityNote
                  }
                >
                  {formatGold(row.stableVol_3)}
                </td>
                <td
                  className="mono text-muted"
                  title={
                    row.efficiencyBonus > 0
                      ? `${formatDuration(row.baseTime)} base with +${row.efficiencyBonus}% efficiency`
                      : undefined
                  }
                >
                  {formatMinutes(row.time)}
                </td>
                <td>
                  <div className="alchemy-signal-stack">
                    <span className={`action-badge ${getSignalClass(row.signal)}`}>
                      {row.signal}
                    </span>
                    {getVisibleAlchemyWarnings(row)
                      .slice(0, 2)
                      .map((warning) => (
                        <span key={warning} className="alchemy-warning-chip">
                          {warning}
                        </span>
                      ))}
                    {row.status === "ok" && (
                      <button
                        aria-label={`Open ${row.name} alchemy strategy`}
                        className="alchemy-open-strategy"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectRow(row);
                        }}
                        type="button"
                      >
                        Open strategy
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
