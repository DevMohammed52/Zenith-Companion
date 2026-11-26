"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon, ShardIcon } from "@/components/GoldIcon";
import { Badge, Icon, TableCell, TableRow, type BadgeVariant } from "@/components/ui";
import { formatGoldUnit, formatNumber, formatSignedGold } from "@/lib/format";
import {
  type ValuedDungeonRow,
  getDungeonKey,
  getDungeonRowLabel,
  getReadinessText,
} from "../types";
import styles from "../Dungeons.module.css";

function getReadinessBadgeVariant(row: ValuedDungeonRow, hasProfile: boolean): BadgeVariant {
  if (row.profileReady) return "success";
  if (hasProfile) return "warning";
  return "neutral";
}

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
  const netClass = row.netProfitPerRun >= 0 ? styles.profitPositive : styles.profitNegative;

  return (
    <article
      aria-label={getDungeonRowLabel(row, hasProfile)}
      className={styles.mobileDungeonCard}
    >
      <div className={styles.mobileCardTop}>
        <button
          type="button"
          className={styles.mobileOpenTrigger}
          onClick={() => onOpen(row)}
        >
          <span className={styles.dungeonThumb} aria-hidden="true">
            <GameImage
              src={row.image_url}
              alt=""
              width={34}
              height={34}
              sizes="34px"
              fallback={<Icon name="dungeon" size="sm" />}
            />
          </span>
          <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
            <span className={styles.pickerPrimary}>
              {row.name}{" "}
              {row.isSeasonal && (
                <Badge size="sm" variant="neutral">
                  Event
                </Badge>
              )}
            </span>
            <span className={styles.cellSubline}>
              {row.location?.name || "Unknown"} • {Math.round(row.effectiveDurationMins)}m
            </span>
          </span>
        </button>

        <Badge size="sm" variant={getReadinessBadgeVariant(row, hasProfile)}>
          {getReadinessText(row, hasProfile)}
        </Badge>
      </div>

      <div className={styles.mobileCardStats}>
        <div className={styles.mobileCardStatCell}>
          <span className={styles.statLabel}>EV / Run</span>
          <strong className={`${styles.currencyReadout} ${netClass}`}>
            <GoldIcon size={13} />
            <span>{formatSignedGold(row.netProfitPerRun)}</span>
          </strong>
        </div>
        <div className={styles.mobileCardStatCell}>
          <span className={styles.statLabel}>Entry / Shard</span>
          <strong className={styles.currencyReadout}>
            {row.shardCount > 0 && row.shardValue > 0 ? (
              <>
                <GoldIcon size={13} />
                <span>{formatGoldUnit(row.shardValue)}</span>
              </>
            ) : (
              <span className={styles.fieldMeta}>No shards</span>
            )}
          </strong>
        </div>
        <div className={styles.mobileCardStatCell}>
          <span className={styles.statLabel}>Runs / Action</span>
          <strong className={styles.statValue}>
            {row.runsInIdleAction} <small className={styles.fieldMeta}>({row.dailyRunsByPlaytime}/day)</small>
          </strong>
        </div>
        <div className={styles.mobileCardStatCell}>
          <span className={styles.statLabel}>Entry Cost</span>
          <strong className={styles.currencyReadout}>
            <GoldIcon size={13} />
            <span>{formatGoldUnit(row.entryCost)}</span>
          </strong>
        </div>
      </div>

      <label className={styles.mobileDoneField}>
        <span>Completed runs (/{row.completionRequirement || 0})</span>
        <input
          aria-label={`${row.name} completed runs`}
          className={styles.doneInput}
          type="number"
          min="0"
          inputMode="numeric"
          pattern="[0-9]*"
          value={completedRuns ?? ""}
          placeholder={String(row.completionRequirement || 0)}
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
  const netClass = row.netProfitPerRun >= 0 ? styles.profitPositive : styles.profitNegative;

  return (
    <TableRow
      aria-label={getDungeonRowLabel(row, hasProfile)}
      className="clickable-row"
      onClick={() => onOpen(row)}
    >
      <TableCell>
        <div className={styles.dungeonCell}>
          <span className={styles.dungeonThumb} aria-hidden="true">
            <GameImage
              src={row.image_url}
              alt=""
              width={34}
              height={34}
              sizes="34px"
              fallback={<Icon name="dungeon" size="sm" />}
            />
          </span>
          <div style={{ minWidth: 0 }}>
            <button
              type="button"
              className={styles.dungeonNameBtn}
              onClick={(event) => {
                event.stopPropagation();
                onOpen(row);
              }}
            >
              {row.name}
            </button>
            <div className={styles.cellSubline}>
              <span>Lv {row.level_required || 0}</span>
              <span>• {Math.round(row.effectiveDurationMins)}m</span>
              <span>• {row.dropsCount} drops</span>
              {row.isSeasonal && (
                <Badge size="sm" variant="neutral">
                  Event
                </Badge>
              )}
              {row.shardCount > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  • <ShardIcon size={12} /> {formatNumber(row.shardCount)}
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className={styles.cellSubline}>
          <Icon name="mapPin" size="xs" aria-hidden="true" />
          <span>{row.location?.name || "Unknown"}</span>
        </span>
      </TableCell>
      <TableCell>
        <Badge size="sm" variant={getReadinessBadgeVariant(row, hasProfile)}>
          {getReadinessText(row, hasProfile)}
        </Badge>
      </TableCell>
      <TableCell align="right">
        <span className={`${styles.currencyReadout} ${netClass}`}>
          <GoldIcon size={13} />
          <span>{formatSignedGold(row.netProfitPerRun)}</span>
        </span>
      </TableCell>
      <TableCell align="right">
        <span className={styles.currencyReadout}>
          {row.shardCount > 0 && row.shardValue > 0 ? (
            <>
              <GoldIcon size={13} />
              <span>{formatGoldUnit(row.shardValue)}</span>
            </>
          ) : (
            <span className={styles.fieldMeta}>No shards</span>
          )}
        </span>
      </TableCell>
      <TableCell align="right">
        <span className={styles.statValue} style={{ fontSize: "0.9rem" }}>
          {row.runsInIdleAction}
        </span>
      </TableCell>
      <TableCell align="center">
        <input
          aria-label={`${row.name} completed runs`}
          className={styles.doneInput}
          type="number"
          min="0"
          inputMode="numeric"
          pattern="[0-9]*"
          value={completedRuns ?? ""}
          placeholder={`/${row.completionRequirement || 0}`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0);
            onUpdateCompletedRuns(dungeonKey, value);
          }}
        />
      </TableCell>
      <TableCell align="right">
        <span className={styles.statValue} style={{ fontSize: "0.9rem" }}>
          {row.runsToDrop === Infinity ? "—" : row.runsToDrop.toFixed(1)}
        </span>
      </TableCell>
    </TableRow>
  );
}

export default DungeonCard;
