"use client";

import type { CSSProperties } from "react";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Badge, Icon, TableCell, TableRow, type BadgeVariant } from "@/components/ui";
import { formatCountdown, formatDuration, formatGold } from "@/lib/format";
import { getSignalClass, type BossPhase, type ValuedBossRow } from "../types";
import styles from "../Bosses.module.css";

function getPhaseBadgeVariant(phase: BossPhase): BadgeVariant {
    if (phase === "active") return "success";
    if (phase === "ready") return "standard";
    if (phase === "respawning") return "warning";
    return "neutral";
}

function getSignalBadgeVariant(signalClass: string): BadgeVariant {
    if (signalClass === "boss-signal-good") return "success";
    if (signalClass === "boss-signal-warn") return "warning";
    if (signalClass === "boss-signal-bad") return "danger";
    return "neutral";
}

type BossCardProps = {
    row: ValuedBossRow;
    now: number;
    activeCombatLevel: number | null;
    onSelect: (boss: ValuedBossRow) => void;
};

export function BossCard({ row, now, activeCombatLevel, onSelect }: BossCardProps) {
    const levelTooHigh = activeCombatLevel !== null && Number(row.level) > activeCombatLevel;

    return (
        <button
            type="button"
            className={styles.mobileBossCard}
            onClick={() => onSelect(row)}
            aria-label={`Inspect ${row.name}, Level ${row.level}, ${row.statusLabel}`}
        >
            <div className={styles.mobileCardTop}>
                <div className={styles.mobileCardIdentity}>
                    <span className={styles.bossThumb} aria-hidden="true">
                        <GameImage
                            src={row.image_url}
                            alt=""
                            width={36}
                            height={36}
                            sizes="36px"
                            fallback={<Icon name="boss" size="md" />}
                        />
                    </span>
                    <div className={styles.mobileCardMeta}>
                        <span className={styles.mobileCardName}>{row.name}</span>
                        <span className={styles.bossLocationLine}>
                            <Icon name="mapPin" size="xs" aria-hidden="true" />
                            <span>{row.location?.name || "Unknown"}</span>
                            <span>• Lv. {row.level}</span>
                        </span>
                    </div>
                </div>
                <Badge size="sm" variant={getPhaseBadgeVariant(row.phase)}>
                    {row.statusLabel}
                </Badge>
            </div>

            <div className={styles.mobileCardStats}>
                <div className={styles.mobileCardStatCell}>
                    <span className={styles.statLabel}>{row.countdownLabel}</span>
                    <strong className={styles.cellPrimary}>
                        {formatCountdown(row.countdownTarget, now)}
                    </strong>
                </div>
                <div className={styles.mobileCardStatCell}>
                    <span className={styles.statLabel}>Duration</span>
                    <strong className={styles.cellPrimary}>
                        {formatDuration(row.battleLengthSeconds)}
                    </strong>
                </div>
                <div className={styles.mobileCardStatCell}>
                    <span className={styles.statLabel}>Expected Loot</span>
                    <strong className={styles.evValue}>
                        <GoldIcon size={13} />
                        <span>~{formatGold(row.ev)}g</span>
                    </strong>
                </div>
            </div>

            <div className={styles.mobileCardFooter}>
                <span>
                    {row.phase === "active" ? "Ends" : "Start"}{" "}
                    {(row.phase === "active" ? row.battleEndTime : row.nextSpawnTime)?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }) || "TBA"}
                    {row.scheduleInfo?.respawnHours ? ` • Every ${row.scheduleInfo.respawnHours}h` : ""}
                </span>
                <div className={styles.reviewRow}>
                    {levelTooHigh && (
                        <Badge size="sm" variant="warning">
                            Needs Lv. {row.level}
                        </Badge>
                    )}
                    <Badge size="sm" variant={getSignalBadgeVariant(getSignalClass(row.liquiditySignal))}>
                        {row.liquiditySignal}
                    </Badge>
                </div>
            </div>
        </button>
    );
}

type BossTableRowProps = {
    row: ValuedBossRow;
    now: number;
    activeCombatLevel: number | null;
    onSelect: (boss: ValuedBossRow) => void;
    rowStyle?: CSSProperties;
};

export function BossTableRow({ row, now, activeCombatLevel, onSelect, rowStyle }: BossTableRowProps) {
    const levelTooHigh = activeCombatLevel !== null && Number(row.level) > activeCombatLevel;
    const signalClass = getSignalClass(row.liquiditySignal);

    return (
        <TableRow
            className="clickable-row"
            onClick={() => onSelect(row)}
            style={rowStyle}
        >
            <TableCell>
                <div className={styles.tableBossCell}>
                    <span className={styles.bossThumb} aria-hidden="true">
                        <GameImage
                            src={row.image_url}
                            alt=""
                            width={36}
                            height={36}
                            sizes="36px"
                            fallback={<Icon name="boss" size="md" />}
                        />
                    </span>
                    <div className={styles.bossTitleStack}>
                        <button
                            type="button"
                            className={styles.bossRowNameBtn}
                            onClick={(event) => {
                                event.stopPropagation();
                                onSelect(row);
                            }}
                        >
                            {row.name}
                        </button>
                        <div className={styles.bossLocationLine}>
                            <Icon name="mapPin" size="xs" aria-hidden="true" />
                            <span>{row.location?.name || "Unknown Location"}</span>
                            {levelTooHigh && (
                                <Badge size="sm" variant="warning">
                                    Needs Lv. {row.level}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <span className={styles.cellPrimary}>Lv. {row.level}</span>
            </TableCell>
            <TableCell>
                <div className={styles.statusCell}>
                    <Badge size="sm" variant={getPhaseBadgeVariant(row.phase)}>
                        {row.statusLabel}
                    </Badge>
                    <span className={styles.cellPrimary}>{formatCountdown(row.countdownTarget, now)}</span>
                    <span className={styles.cellMuted}>
                        {row.phase === "active" ? "Ends" : "Start"}{" "}
                        {(row.phase === "active" ? row.battleEndTime : row.nextSpawnTime)?.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }) || "TBA"}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className={styles.statusCell}>
                    <span className={styles.cellPrimary}>
                        Every {row.scheduleInfo?.respawnHours ? `${row.scheduleInfo.respawnHours}h` : "TBA"}
                    </span>
                    <span className={styles.cellMuted}>
                        Fight {formatDuration(row.battleLengthSeconds)}
                    </span>
                </div>
            </TableCell>
            <TableCell align="right">
                <div className={styles.statusCell} style={{ alignItems: "flex-end" }}>
                    <span className={styles.evValue}>
                        <GoldIcon size={14} />
                        <span>~{formatGold(row.ev)}g</span>
                    </span>
                    <Badge size="sm" variant={getSignalBadgeVariant(signalClass)}>
                        {row.liquiditySignal}
                    </Badge>
                </div>
            </TableCell>
        </TableRow>
    );
}
