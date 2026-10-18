"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import { formatGoldUnit, formatSignedGold } from "@/lib/format";
import {
  type ValuedDungeonRow,
  getDungeonKey,
  getDungeonRowLabel,
  getReadinessText,
} from "../types";

export interface DungeonCardProps {
  row: ValuedDungeonRow;
  hasProfile: boolean;
  completedRuns: number | "";
  onOpen: (row: ValuedDungeonRow) => void;
  onUpdateCompletedRuns: (dungeonKey: string, value: number | "") => void;
}

export function DungeonCard({
  row,
  hasProfile,
  completedRuns,
  onOpen,
  onUpdateCompletedRuns,
}: DungeonCardProps) {
  const dungeonKey = getDungeonKey(row);

  return (
    <article
      aria-label={getDungeonRowLabel(row, hasProfile)}
      className="dungeon-card"
    >
      <div className="dungeon-card-top">
        <button
          type="button"
          className="dungeon-name-cell dungeon-open-button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row);
          }}
        >
          {row.image_url && <Image src={row.image_url} alt="" width={32} height={32} unoptimized />}
          <div>
            <strong>{row.name}</strong>
            <small>{row.location?.name || "Unknown"} - {Math.round(row.effectiveDurationMins)}m</small>
          </div>
        </button>
        <span className={`dungeon-readiness ${row.profileReady ? "ready" : hasProfile ? "blocked" : "neutral"}`}>
          {getReadinessText(row, hasProfile)}
        </span>
      </div>
      <div className="dungeon-card-stats">
        <span>
          <small>EV/run</small>
          <strong className={row.netProfitPerRun >= 0 ? "profit-positive" : "profit-negative"}>
            {formatSignedGold(row.netProfitPerRun)}
          </strong>
        </span>
        <span>
          <small>Gold / Shard</small>
          <strong>{row.shardValue > 0 ? formatGoldUnit(row.shardValue) : "-"}</strong>
        </span>
        <span>
          <small>Runs / Action</small>
          <strong>{row.runsInIdleAction}</strong>
        </span>
        <span>
          <small>Daily Runs</small>
          <strong>{row.dailyRunsByPlaytime}</strong>
        </span>
        <span>
          <small>Cost</small>
          <strong>{formatGoldUnit(row.entryCost)}</strong>
        </span>
      </div>
      <label className="dungeon-mobile-completed" onClick={(event) => event.stopPropagation()}>
        <span>Completed runs</span>
        <input
          aria-label={`${row.name} completed runs`}
          type="number"
          min="0"
          value={completedRuns ?? ""}
          placeholder={`Requirement ${row.completionRequirement || 0}`}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0);
            onUpdateCompletedRuns(dungeonKey, value);
          }}
        />
      </label>
    </article>
  );
}

export interface DungeonTableRowProps {
  row: ValuedDungeonRow;
  hasProfile: boolean;
  completedRuns: number | "";
  onOpen: (row: ValuedDungeonRow) => void;
  onUpdateCompletedRuns: (dungeonKey: string, value: number | "") => void;
}

export function DungeonTableRow({
  row,
  hasProfile,
  completedRuns,
  onOpen,
  onUpdateCompletedRuns,
}: DungeonTableRowProps) {
  const dungeonKey = getDungeonKey(row);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(row);
    }
  };

  return (
    <tr
      aria-label={getDungeonRowLabel(row, hasProfile)}
      className="clickable-row"
      onClick={() => onOpen(row)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <td className="item-name left-align">
        <button
          type="button"
          className="dungeon-name-cell dungeon-open-button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row);
          }}
        >
          {row.image_url && <Image src={row.image_url} alt="" width={32} height={32} unoptimized />}
          <div>
            <span>{row.name}</span>
            <small>Lv {row.level_required || 0} - {row.durationMins}m - {row.dropsCount} drops</small>
          </div>
        </button>
      </td>
      <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
      <td>
        <span className={`dungeon-readiness ${row.profileReady ? "ready" : hasProfile ? "blocked" : "neutral"}`}>
          {getReadinessText(row, hasProfile)}
        </span>
      </td>
      <td className={`mono ${row.netProfitPerRun >= 0 ? "profit-positive" : "profit-negative"}`}>
        {formatSignedGold(row.netProfitPerRun)}
      </td>
      <td className="mono text-muted">{row.shardValue > 0 ? formatGoldUnit(row.shardValue) : "-"}</td>
      <td className="mono text-muted">{row.runsInIdleAction}</td>
      <td>
        <input
          aria-label={`${row.name} completed runs`}
          className="dungeon-completed-input"
          type="number"
          min="0"
          value={completedRuns ?? ""}
          placeholder={`/${row.completionRequirement || 0}`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0);
            onUpdateCompletedRuns(dungeonKey, value);
          }}
        />
      </td>
      <td className="mono text-muted">{row.runsToDrop === Infinity ? "-" : row.runsToDrop.toFixed(1)}</td>
    </tr>
  );
}

export default DungeonCard;
