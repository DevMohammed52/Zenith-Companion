"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { formatCountdown, formatDateTime, formatDuration, formatGold, formatTime } from "@/lib/format";
import {
    getPhaseClass,
    getSignalClass,
    needsBossValueReview,
    type ValuedBossRow,
} from "../types";

export interface BossCardProps {
    row: ValuedBossRow;
    now: number;
    onOpen: (row: ValuedBossRow) => void;
}

export function BossCard({ row, now, onOpen }: BossCardProps) {
    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(row);
        }
    };

    return (
        <div
            aria-label={`Open ${row.name} boss details`}
            className="mobile-alchemy-card boss-mobile-card"
            onClick={() => onOpen(row)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className="m-card-header">
                <div className="m-card-title">
                    <div className="boss-mobile-name">
                        {row.image_url && <img src={row.image_url} alt="" />}
                        <span className="m-name">{row.name}</span>
                    </div>
                    <span className="m-lvl">{row.location?.name || "Unknown"} - LVL {row.level}</span>
                </div>
                <div className="m-roi pos">
                    ~{formatGold(row.ev)}g
                    {needsBossValueReview(row) && <span className="boss-mobile-review">Review price</span>}
                </div>
            </div>
            <div className="m-card-body">
                <div className="m-stat">
                    <span className="m-label">Status</span>
                    <span className={`boss-phase ${getPhaseClass(row.phase)}`}>{row.statusLabel}</span>
                </div>
                <div className="m-stat">
                    <span className="m-label">{row.countdownLabel}</span>
                    <span className="m-val pos font-bold">{formatCountdown(row.countdownTarget, now)}</span>
                </div>
                <div className="m-stat">
                    <span className="m-label">Battle Ends</span>
                    <span className="m-val text-muted">{formatTime(row.battleEndTime)}</span>
                </div>
                <div className="m-stat">
                    <span className="m-label">Fight Duration</span>
                    <span className="m-val text-muted">{formatDuration(row.battleLengthSeconds)}</span>
                </div>
            </div>
        </div>
    );
}

export interface BossTableRowProps {
    row: ValuedBossRow;
    now: number;
    onOpen: (row: ValuedBossRow) => void;
}

export function BossTableRow({ row, now, onOpen }: BossTableRowProps) {
    const handleKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(row);
        }
    };

    return (
        <tr
            aria-label={`Open ${row.name} boss details`}
            className="clickable-row"
            onClick={() => onOpen(row)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <td className="item-name left-align">
                <div className="boss-name-cell">
                    {row.image_url && <img src={row.image_url} alt="" />}
                    <div>
                        <span>{row.name}</span>
                        <small>{row.dropsCount} drops - {row.scheduleInfo?.respawnHours || "?"}h cycle - {formatDuration(row.battleLengthSeconds)} fight</small>
                    </div>
                </div>
            </td>
            <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
            <td className="mono">{row.level}</td>
            <td>
                <div className="boss-status-cell">
                    <span className={`boss-phase ${getPhaseClass(row.phase)}`}>{row.statusLabel}</span>
                    <strong>{row.countdownLabel} {formatCountdown(row.countdownTarget, now)}</strong>
                    <small>
                        {row.phase === "active"
                            ? `Ends ${formatTime(row.battleEndTime)} - ${formatCountdown(row.battleEndTime, now)}`
                            : `Starts ${formatDateTime(row.nextSpawnTime)} - in ${formatCountdown(row.nextSpawnTime, now)}`}
                    </small>
                </div>
            </td>
            <td className="mono profit-positive font-bold">
                <span className="boss-ev-cell">
                    ~{formatGold(row.ev)}
                    {needsBossValueReview(row) && <em>Review price</em>}
                </span>
            </td>
            <td>
                <span className={`boss-signal ${getSignalClass(row.liquiditySignal)}`}>{row.liquiditySignal}</span>
            </td>
        </tr>
    );
}

export default BossCard;
