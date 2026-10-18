"use client";

import { AlertTriangle, Clock, ExternalLink, MapPin, PackageOpen, Shield, Sparkles, X } from "lucide-react";
import LoreThreadPanel from "@/components/LoreThreadPanel";
import { formatCountdown, formatDuration, formatGold, formatTime } from "@/lib/format";
import {
    getBossDropSourceLabel,
    getPhaseClass,
    getSignalClass,
    getWorldBossItemModifierSummary,
} from "../types";
import type { BossState } from "../hooks/useBossState";

export interface BossDetailsModalProps {
    state: BossState;
}

export function BossDetailsModal({ state }: BossDetailsModalProps) {
    const {
        selectedBossData,
        setSelectedBoss,
        bossDialogRef,
        now,
        magicFind,
        baseMagicFind,
        equippedSpecialMagicFindBonus,
        itemMagicFindBonus,
        selectedWorldBossItemModifier,
        equippedWorldBossSpecial,
        selectedBossLoreNames,
        openLoreThread,
        generateTimetable,
        openItemByName,
        prefetchItem,
    } = state;

    if (!selectedBossData) return null;

    return (
        <div className="modal-overlay boss-modal-overlay" onClick={() => setSelectedBoss(null)}>
            <div
                aria-labelledby="boss-details-title"
                aria-modal="true"
                className="modal-content boss-modal"
                onClick={(event) => event.stopPropagation()}
                ref={bossDialogRef}
                role="dialog"
                tabIndex={-1}
            >
                <div className="modal-header">
                    <div className="boss-modal-title">
                        {selectedBossData.image_url && (
                            <img src={selectedBossData.image_url} alt="" />
                        )}
                        <div>
                            <h2 id="boss-details-title">{selectedBossData.name}</h2>
                            <div className="boss-modal-tags">
                                <span><MapPin size={12} /> {selectedBossData.location?.name || "Unknown"}</span>
                                <span><Shield size={12} /> Level {selectedBossData.level}</span>
                                <span className={`boss-phase ${getPhaseClass(selectedBossData.phase)}`}>{selectedBossData.statusLabel}</span>
                            </div>
                        </div>
                    </div>
                    <button className="close-btn" type="button" aria-label="Close boss details" onClick={() => setSelectedBoss(null)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="stats-grid boss-stat-grid">
                        <div className="stat-card">
                            <div className="stat-label">Expected Value / Boss</div>
                            <div className="stat-value" style={{ color: "var(--text-accent)" }}>~{formatGold(selectedBossData.ev)}g</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Timer</div>
                            <div className="stat-value">{selectedBossData.countdownLabel} {formatCountdown(selectedBossData.countdownTarget, now)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Spawn Cycle</div>
                            <div className="stat-value">Every {selectedBossData.scheduleInfo?.respawnHours || "?"}h</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Fight Duration</div>
                            <div className="stat-value">{formatDuration(selectedBossData.battleLengthSeconds)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Magic Find</div>
                            <div className="stat-value">+{magicFind}%</div>
                            <div className="boss-stat-note">
                                {[
                                    `${baseMagicFind}% base`,
                                    equippedSpecialMagicFindBonus > 0 ? `${equippedSpecialMagicFindBonus}% special` : "",
                                    itemMagicFindBonus > 0 ? `${itemMagicFindBonus}% item` : "",
                                ].filter(Boolean).join(" + ") || "Profile/manual only"}
                            </div>
                        </div>
                    </div>

                    {selectedWorldBossItemModifier && (
                        <div className="boss-item-breakdown">
                            <Sparkles size={16} />
                            <div>
                                <strong>{selectedWorldBossItemModifier.name}</strong>
                                <span>{getWorldBossItemModifierSummary(selectedWorldBossItemModifier)} applied to this preview.</span>
                            </div>
                        </div>
                    )}
                    {equippedSpecialMagicFindBonus > 0 && equippedWorldBossSpecial && (
                        <div className="boss-item-breakdown">
                            <Sparkles size={16} />
                            <div>
                                <strong>{equippedWorldBossSpecial.name}</strong>
                                <span>+{equippedSpecialMagicFindBonus}% world boss MF from profile special gear.</span>
                            </div>
                        </div>
                    )}

                    {selectedBossData.warnings?.length > 0 && (
                        <div className="boss-warning-box">
                            <AlertTriangle size={16} />
                            <div>
                                {selectedBossData.warnings.map((warning: string) => <p key={warning}>{warning}</p>)}
                            </div>
                        </div>
                    )}

                    <LoreThreadPanel names={selectedBossLoreNames} title="Boss Lore Thread" onOpenThread={openLoreThread} />

                    <div className="upcoming-spawns-section">
                        <div className="section-title">
                            <Clock size={16} /> Upcoming Windows
                        </div>
                        <div className="spawns-container scroll-x">
                            {generateTimetable(selectedBossData).map((window, index) => (
                                <div key={window.start.toISOString()} className={`spawn-box ${index === 0 ? "active" : ""}`}>
                                    <div className="spawn-day">{index === 0 ? "NEXT" : window.start.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</div>
                                    <div className="spawn-time">{formatTime(window.start)}</div>
                                    <div className="spawn-end">to {formatTime(window.end)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h3 className="boss-loot-heading"><PackageOpen size={16} /> Loot Table</h3>

                    <div className="boss-loot-list">
                        {[...(selectedBossData.lootDetails || [])].sort((a: any, b: any) => b.expectedVal - a.expectedVal).map((drop: any) => (
                            <div
                                aria-label={`Open ${drop.name} item details`}
                                key={`${drop.name}-${drop.index ?? drop.baseChance}`}
                                onClick={() => openItemByName(drop.name)}
                                onMouseEnter={() => prefetchItem(drop.name)}
                                onFocus={() => prefetchItem(drop.name)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openItemByName(drop.name);
                                    }
                                }}
                                className="clickable-row group-loot boss-loot-row"
                                role="button"
                                tabIndex={0}
                            >
                                <div className="boss-loot-main">
                                    {drop.image_url && <img src={drop.image_url} alt="" />}
                                    <div>
                                        <div className="loot-item-name">
                                            {drop.name}
                                            {(Number(drop.quantity) || 1) > 1 && <span>x{drop.quantity}</span>}
                                        </div>
                                        <div className="boss-drop-rate">
                                            {drop.adjustedChance.toFixed(drop.adjustedChance >= 10 ? 1 : 2)}% adjusted
                                            {magicFind > 0 && <span>base {drop.baseChance}%</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="boss-loot-value">
                                    <strong>~{formatGold(drop.expectedVal, 2)}g</strong>
                                    <span>{getBossDropSourceLabel(drop)} - {formatGold(drop.trueValue)}g ea <ExternalLink size={10} /></span>
                                    <em className={`boss-signal ${getSignalClass(drop.signal)}`}>{drop.signal}</em>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BossDetailsModal;
