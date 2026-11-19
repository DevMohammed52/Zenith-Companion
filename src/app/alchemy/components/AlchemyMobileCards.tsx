"use client";

import React from "react";
import { Eye } from "lucide-react";
import MobileSortControls from "@/components/MobileSortControls";
import {
  ALCHEMY_MOBILE_SORT_OPTIONS,
  type AlchemyRow,
  type AlchemySortKey,
} from "../types";
import {
  formatGold,
  formatMinutes,
  formatSignedGold,
  getAlchemyMatchHint,
  getSignalClass,
  getVisibleAlchemyWarnings,
  highlightMatch,
} from "../utils/alchemy-helpers";
import { PathBadge } from "./AlchemyBadges";

export function AlchemyMobileCards({
  rows,
  sortCol,
  sortDesc,
  onSort,
  onToggleDirection,
  deferredSearchTerm,
  onSelectRow,
}: {
  rows: AlchemyRow[];
  sortCol: AlchemySortKey;
  sortDesc: boolean;
  onSort: (col: AlchemySortKey) => void;
  onToggleDirection: () => void;
  deferredSearchTerm: string;
  onSelectRow: (row: AlchemyRow) => void;
}) {
  return (
    <div className="mobile-only">
      <MobileSortControls
        label="Sort Strategy"
        value={sortCol}
        descending={sortDesc}
        onSort={(value) => onSort(value as AlchemySortKey)}
        onToggleDirection={onToggleDirection}
        options={ALCHEMY_MOBILE_SORT_OPTIONS}
      />
      <div className="mobile-card-grid">
        {rows.map((row) => (
          <button
            aria-label={`Open ${row.name} alchemy strategy`}
            key={row.name}
            className="mobile-alchemy-card rich"
            disabled={row.status !== "ok"}
            onClick={() => row.status === "ok" && onSelectRow(row)}
            type="button"
          >
            <div className="m-card-header">
              <div className="m-card-title">
                <span className="m-name">{highlightMatch(row.name, deferredSearchTerm)}</span>
                <span className="m-lvl">LVL {row.level}</span>
              </div>
              {row.status === "ok" && (
                <div className={`m-profit-rate ${row.profitPerHour > 0 ? "pos" : "neg"}`}>
                  {formatSignedGold(row.profitPerHour)}/hr
                </div>
              )}
            </div>
            {getAlchemyMatchHint(row, deferredSearchTerm) && (
              <div className="alchemy-match-hint mobile">
                {getAlchemyMatchHint(row, deferredSearchTerm)}
              </div>
            )}
            {row.status === "missing" ? (
              <p className="alchemy-card-note">{row.warnings[0] || "Missing market data"}</p>
            ) : (
              <>
                <div className="m-card-body">
                  <div className="m-stat">
                    <span className="m-label">PATH</span>
                    <PathBadge action={row.action} />
                  </div>
                  <div className="m-stat">
                    <span className="m-label">COST</span>
                    <span className="m-val">{formatGold(row.cost)}g</span>
                  </div>
                  <div className="m-stat">
                    <span className="m-label">RETURN</span>
                    <span className="m-val">{formatGold(row.bestRevenue)}g</span>
                  </div>
                  <div className="m-stat">
                    <span className="m-label">PROFIT/HR</span>
                    <span className={`m-val ${row.profitPerHour > 0 ? "pos" : "neg"}`}>
                      {formatSignedGold(row.profitPerHour)}
                    </span>
                  </div>
                  <div className="m-stat">
                    <span className="m-label">PROFIT / PC</span>
                    <span className={`m-val ${row.profit > 0 ? "pos" : "neg"}`}>
                      {formatSignedGold(row.profit)}
                    </span>
                  </div>
                  <div className="m-stat">
                    <span className="m-label">STABLE VOL</span>
                    <span className="m-val">{formatGold(row.stableVol_3)}</span>
                  </div>
                </div>
                <div className="m-card-footer">
                  <span className={`action-badge ${getSignalClass(row.signal)}`}>
                    {row.signal}
                  </span>
                  <div className="m-vol">{formatMinutes(row.time)} min each</div>
                  <span className="alchemy-card-cta">
                    <Eye size={14} /> Details
                  </span>
                </div>
                {getVisibleAlchemyWarnings(row).length > 0 && (
                  <div className="m-card-warnings">
                    {getVisibleAlchemyWarnings(row)
                      .slice(0, 3)
                      .map((warning) => (
                        <span key={warning} className="alchemy-warning-chip">
                          {warning}
                        </span>
                      ))}
                  </div>
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
