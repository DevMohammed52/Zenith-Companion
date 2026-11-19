"use client";

import React from "react";
import { Activity, AlertTriangle, BarChart3, Coins, PackageCheck } from "lucide-react";
import type { AlchemyRow, AlchemySummary } from "../types";
import { formatGold, formatSignedGold } from "../utils/alchemy-helpers";

function SummaryCard({
  icon,
  label,
  row,
  value,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  row?: AlchemyRow;
  value: string;
  onSelect: (row: AlchemyRow) => void;
}) {
  return (
    <button
      aria-label={
        row
          ? `${label}: ${value} for ${row.name}. Open strategy.`
          : `${label}: no available strategy.`
      }
      className="alchemy-summary-card"
      disabled={!row}
      onClick={() => row && onSelect(row)}
      type="button"
    >
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <em>{row?.name || "No match"}</em>
    </button>
  );
}

export function AlchemySummaryGrid({
  summary,
  onSelectRow,
}: {
  summary: AlchemySummary;
  onSelectRow: (row: AlchemyRow) => void;
}) {
  return (
    <div className="alchemy-summary-grid">
      <SummaryCard
        icon={<Coins size={16} />}
        label="Best Market Craft"
        row={summary.market}
        value={summary.market ? formatSignedGold(summary.market.profit) : "N/A"}
        onSelect={onSelectRow}
      />
      <SummaryCard
        icon={<PackageCheck size={16} />}
        label="Best Vendor Craft"
        row={summary.vendor}
        value={summary.vendor ? formatSignedGold(summary.vendor.profit) : "N/A"}
        onSelect={onSelectRow}
      />
      <SummaryCard
        icon={<BarChart3 size={16} />}
        label="Best Profit/Hr"
        row={summary.hourly}
        value={summary.hourly ? `${formatSignedGold(summary.hourly.profitPerHour)}/hr` : "N/A"}
        onSelect={onSelectRow}
      />
      <SummaryCard
        icon={<Activity size={16} />}
        label="Highest 3D Volume"
        row={summary.volume}
        value={summary.volume ? `${formatGold(summary.volume.stableVol_3)} vol` : "N/A"}
        onSelect={onSelectRow}
      />
      <SummaryCard
        icon={<AlertTriangle size={16} />}
        label="Risky High Profit"
        row={summary.risky}
        value={summary.risky ? formatSignedGold(summary.risky.profit) : "None"}
        onSelect={onSelectRow}
      />
    </div>
  );
}
