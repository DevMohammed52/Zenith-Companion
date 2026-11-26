"use client";

import LoreThreadPanel from "@/components/LoreThreadPanel";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { Badge, Banner, Icon, ModalSheet, type BadgeVariant } from "@/components/ui";
import { formatCountdown, formatDuration, formatGold, formatTime } from "@/lib/format";
import type { BossState } from "../hooks/useBossState";
import { getBossDropSourceLabel, getSignalClass, getWorldBossItemModifierSummary, type BossPhase } from "../types";
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

type BossDetailsModalProps = {
    state: BossState;
};

export function BossDetailsModal({ state }: BossDetailsModalProps) {
    const {
        selectedBossData,
        setSelectedBoss,
        now,
        activeCombatLevel,
        magicFind,
        baseMagicFind,
        itemMagicFindBonus,
        equippedSpecialMagicFindBonus,
        equippedWorldBossSpecial,
        selectedWorldBossItemModifier,
        selectedBossLoreNames,
        openLoreThread,
        generateTimetable,
        openItemByName,
        prefetchItem,
    } = state;

    const levelTooHigh =
        selectedBossData && activeCombatLevel !== null && Number(selectedBossData.level) > activeCombatLevel;

    const sortedLoot = selectedBossData
        ? [...(selectedBossData.lootDetails || [])].sort((a: any, b: any) => b.expectedVal - a.expectedVal)
        : [];

    const mfSummary =
        [
            `${baseMagicFind}% base`,
            equippedSpecialMagicFindBonus > 0 ? `${equippedSpecialMagicFindBonus}% special` : "",
            itemMagicFindBonus > 0 ? `${itemMagicFindBonus}% item` : "",
        ]
            .filter(Boolean)
            .join(" + ") || "Base MF only";

    return (
        <ModalSheet
            isOpen={Boolean(selectedBossData)}
            onClose={() => setSelectedBoss(null)}
            title={selectedBossData?.name || "World Boss Details"}
            description={
                selectedBossData
                    ? `${selectedBossData.location?.name || "Unknown"} • Level ${selectedBossData.level}`
                    : undefined
            }
            maxWidth="lg"
        >
            {selectedBossData ? (
                <div className={styles.modalBodyStack}>
                    <div className={styles.modalHero}>
                        <span className={styles.modalAvatar} aria-hidden="true">
                            <GameImage
                                src={selectedBossData.image_url}
                                alt=""
                                width={54}
                                height={54}
                                sizes="54px"
                                fallback={<Icon name="boss" size="xl" />}
                            />
                        </span>
                        <div className={styles.modalTagRow}>
                            <span>
                                <Icon name="mapPin" size="xs" aria-hidden="true" />{" "}
                                {selectedBossData.location?.name || "Unknown"}
                            </span>
                            <Badge size="sm" variant="neutral">
                                Lv. {selectedBossData.level}
                            </Badge>
                            {levelTooHigh && (
                                <Badge size="sm" variant="warning">
                                    Needs Combat Lv. {selectedBossData.level}
                                </Badge>
                            )}
                            <Badge size="sm" variant={getPhaseBadgeVariant(selectedBossData.phase)}>
                                {selectedBossData.statusLabel}
                            </Badge>
                        </div>
                    </div>

                    <div className={styles.modalStatStrip}>
                        <div className={styles.statCell}>
                            <span className={styles.statLabel}>Expected Loot</span>
                            <strong className={styles.statValue} style={{ color: "var(--text-accent)" }}>
                                <GoldIcon size={14} />
                                <span>~{formatGold(selectedBossData.ev)}g</span>
                            </strong>
                            <span className={styles.statHint}>Per kill</span>
                        </div>
                        <div className={styles.statCell}>
                            <span className={styles.statLabel}>{selectedBossData.countdownLabel}</span>
                            <strong className={styles.statValue}>
                                {formatCountdown(selectedBossData.countdownTarget, now)}
                            </strong>
                            <span className={styles.statHint}>Live timer</span>
                        </div>
                        <div className={styles.statCell}>
                            <span className={styles.statLabel}>Spawn Cycle</span>
                            <strong className={styles.statValue}>
                                Every {selectedBossData.scheduleInfo?.respawnHours || "?"}h
                            </strong>
                            <span className={styles.statHint}>+ server jitter</span>
                        </div>
                        <div className={styles.statCell}>
                            <span className={styles.statLabel}>Fight Duration</span>
                            <strong className={styles.statValue}>
                                {formatDuration(selectedBossData.battleLengthSeconds)}
                            </strong>
                            <span className={styles.statHint}>Combat window</span>
                        </div>
                        <div className={styles.statCell}>
                            <span className={styles.statLabel}>Magic Find</span>
                            <strong className={styles.statValue}>+{magicFind}%</strong>
                            <span className={styles.statHint}>{mfSummary}</span>
                        </div>
                    </div>

                    {selectedWorldBossItemModifier && (
                        <Banner variant="info" icon="magic">
                            <strong>{selectedWorldBossItemModifier.name}</strong>:{" "}
                            {getWorldBossItemModifierSummary(selectedWorldBossItemModifier)} applied to this preview.
                        </Banner>
                    )}

                    {equippedSpecialMagicFindBonus > 0 && equippedWorldBossSpecial && (
                        <Banner variant="info" icon="magic">
                            <strong>{equippedWorldBossSpecial.name}</strong>: +{equippedSpecialMagicFindBonus}% world
                            boss MF from equipped special gear.
                        </Banner>
                    )}

                    {selectedBossData.warnings?.length > 0 && (
                        <Banner variant="warning" icon="warning">
                            <div>
                                {selectedBossData.warnings.map((warning: string) => (
                                    <div key={warning}>{warning}</div>
                                ))}
                            </div>
                        </Banner>
                    )}

                    <LoreThreadPanel
                        names={selectedBossLoreNames}
                        title="Boss Lore Thread"
                        onOpenThread={openLoreThread}
                    />

                    <section className={styles.modalSection}>
                        <h3 className={styles.modalSectionHeading}>
                            <Icon name="timer" size="sm" aria-hidden="true" />
                            <span>Upcoming Spawn Windows</span>
                        </h3>
                        <div className={styles.spawnsGrid}>
                            {generateTimetable(selectedBossData).map((window, index) => (
                                <div
                                    key={window.start.toISOString()}
                                    className={`${styles.spawnWindowItem} ${index === 0 ? styles.spawnWindowNext : ""}`.trim()}
                                >
                                    <span className={styles.spawnDay}>
                                        {index === 0
                                            ? "NEXT"
                                            : window.start.toLocaleDateString(undefined, { weekday: "short" })}
                                    </span>
                                    <strong className={styles.spawnTime}>{formatTime(window.start)}</strong>
                                    <span className={styles.spawnEnd}>to {formatTime(window.end)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.modalSection}>
                        <h3 className={styles.modalSectionHeading}>
                            <Icon name="items" size="sm" aria-hidden="true" />
                            <span>Loot Table ({sortedLoot.length})</span>
                        </h3>
                        <div className={styles.lootList}>
                            {sortedLoot.map((drop: any) => (
                                <button
                                    key={`${drop.name}-${drop.index ?? drop.baseChance}`}
                                    type="button"
                                    className={styles.lootRowBtn}
                                    aria-label={`Open ${drop.name} item details`}
                                    onClick={() => openItemByName(drop.name)}
                                    onMouseEnter={() => prefetchItem(drop.name)}
                                    onFocus={() => prefetchItem(drop.name)}
                                >
                                    <div className={styles.lootMain}>
                                        <span className={styles.lootIcon} aria-hidden="true">
                                            <GameImage
                                                src={drop.image_url}
                                                alt=""
                                                width={32}
                                                height={32}
                                                sizes="32px"
                                                fallback={<Icon name="items" size="sm" />}
                                            />
                                        </span>
                                        <div>
                                            <div className={styles.lootNameLine}>
                                                <QualityText value={drop.quality}>{drop.name}</QualityText>
                                                {(Number(drop.quantity) || 1) > 1 && (
                                                    <Badge size="sm" variant="neutral">
                                                        x{drop.quantity}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className={styles.lootRateLine}>
                                                <span>
                                                    {drop.adjustedChance.toFixed(drop.adjustedChance >= 10 ? 1 : 2)}%
                                                    adjusted
                                                </span>
                                                {magicFind > 0 && <span>• {drop.baseChance}% base</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.lootValueCol}>
                                        <span className={styles.lootEvText}>
                                            <GoldIcon size={13} />
                                            <span>~{formatGold(drop.expectedVal, 2)}g EV</span>
                                        </span>
                                        <span className={styles.lootSourceText}>
                                            <span>
                                                {getBossDropSourceLabel(drop)} • {formatGold(drop.trueValue)}g ea
                                            </span>
                                            <Icon name="externalLink" size="xs" aria-hidden="true" />
                                        </span>
                                        <Badge size="sm" variant={getSignalBadgeVariant(getSignalClass(drop.signal))}>
                                            {drop.signal}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            ) : null}
        </ModalSheet>
    );
}

export default BossDetailsModal;
