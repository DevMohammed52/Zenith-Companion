"use client";

import { MapPin, PackageOpen, Search, Sparkles, Timer } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatCountdown, formatTime } from "@/lib/format";
import type { BossState } from "../hooks/useBossState";
import { WorldBossItemEffectPicker } from "./WorldBossItemEffectPicker";

export interface BossHeaderProps {
    state: BossState;
}

export function BossHeader({ state }: BossHeaderProps) {
    const {
        activeProfile,
        headerStatusText,
        nextBoss,
        now,
        searchIsActive,
        shownBossCount,
        totalBossCount,
        magicFind,
        activeBossView,
        setActiveBossView,
        detailsCountLabel,
        routineBossKeys,
        routineRows,
        searchTerm,
        setSearchTerm,
        selectedPhase,
        setSelectedPhase,
        calculatedRows,
        displayedWorldBossMagicFind,
        profileWorldBossMagicFindInput,
        worldBossMagicFindDraft,
        setWorldBossMagicFindDraft,
        setWorldBossMagicFindEditing,
        commitWorldBossMagicFind,
        itemMagicFindBonus,
        equippedSpecialMagicFindBonus,
        worldBossItemOptions,
        worldBossItemModifierName,
        setWorldBossItemModifierName,
    } = state;

    return (
        <>
            <div className="header">
                <h1 className="header-title">
                    <ZenithIcon name="boss" size={24} style={{ color: "var(--text-accent)" }} /> ZENITH WORLD BOSSES
                </h1>
                <div className="header-status" aria-live="polite">
                    <div className="status-dot"></div>
                    <span className="mono">
                        {activeProfile ? `${activeProfile.name} - ` : ""}{headerStatusText}
                    </span>
                </div>
            </div>

            <section className="boss-radar">
                <div className="boss-radar-main">
                    <span className="boss-eyebrow"><Timer size={14} /> Boss Radar</span>
                    <h2>{nextBoss ? nextBoss.name : "World Boss Rotation"}</h2>
                    <p>
                        {nextBoss
                            ? `${nextBoss.statusLabel} at ${nextBoss.location?.name || "Unknown"} - ${nextBoss.countdownLabel} ${formatCountdown(nextBoss.countdownTarget, now)}`
                            : "Live timing and value model will appear when boss data is loaded."}
                    </p>
                </div>
                <div className="boss-radar-stats">
                    <div><span>{searchIsActive ? "Shown" : "Tracked"}</span><strong>{searchIsActive ? `${shownBossCount}/${totalBossCount}` : totalBossCount}</strong></div>
                    <div><span>Magic Find</span><strong>+{magicFind}%</strong></div>
                    <div><span>Next Window</span><strong>{nextBoss ? formatTime(nextBoss.nextSpawnTime) : "N/A"}</strong></div>
                </div>
            </section>

            <div className="boss-view-switch" aria-label="World boss views">
                <button
                    type="button"
                    aria-pressed={activeBossView === "details"}
                    className={activeBossView === "details" ? "active" : ""}
                    onClick={() => setActiveBossView("details")}
                >
                    <PackageOpen size={16} />
                    <span>Boss Details</span>
                    <small>{detailsCountLabel}</small>
                </button>
                <button
                    type="button"
                    aria-pressed={activeBossView === "planner"}
                    className={activeBossView === "planner" ? "active" : ""}
                    onClick={() => setActiveBossView("planner")}
                >
                    <MapPin size={16} />
                    <span>Routine Planner</span>
                    <small>{routineBossKeys.length}/{routineRows.length} selected</small>
                </button>
            </div>

            {activeBossView === "details" && (
                <>
                    <div className="controls boss-controls">
                        <div className="control-group boss-search-control">
                            <label className="control-label">Search Bosses</label>
                            <div className="boss-input-shell">
                                <Search aria-hidden="true" size={16} strokeWidth={2.1} />
                                <input
                                    aria-label="Search bosses"
                                    type="text"
                                    className="control-input"
                                    placeholder="Search boss, status, or location..."
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="control-group boss-mf-control">
                            <label className="control-label">World Boss Magic Find</label>
                            <div className="boss-input-shell boss-input-shell-accent">
                                <Sparkles aria-hidden="true" size={16} strokeWidth={2.1} />
                                <input
                                    aria-label="World Boss Magic Find"
                                    type="number"
                                    min="0"
                                    max="500"
                                    className="control-input"
                                    value={displayedWorldBossMagicFind}
                                    onFocus={() => {
                                        setWorldBossMagicFindEditing(true);
                                        setWorldBossMagicFindDraft(String(profileWorldBossMagicFindInput ?? ""));
                                    }}
                                    onChange={(event) => {
                                        const nextDraft = event.target.value;
                                        setWorldBossMagicFindEditing(true);
                                        setWorldBossMagicFindDraft(nextDraft === "" ? "" : String(Math.max(0, Math.min(500, Number(nextDraft) || 0))));
                                    }}
                                    onBlur={() => commitWorldBossMagicFind(worldBossMagicFindDraft)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            commitWorldBossMagicFind(worldBossMagicFindDraft);
                                            event.currentTarget.blur();
                                        }
                                        if (event.key === "Escape") {
                                            setWorldBossMagicFindEditing(false);
                                            setWorldBossMagicFindDraft(String(profileWorldBossMagicFindInput ?? ""));
                                            event.currentTarget.blur();
                                        }
                                    }}
                                />
                            </div>
                            <span className="control-helper">
                                {activeProfile ? `Saved for ${activeProfile.name || "active profile"}` : "Saved as no-profile fallback"}
                            </span>
                        </div>
                    </div>

                    <div className="boss-phase-filters" role="group" aria-label="Filter by phase">
                        {(["all", "active", "ready", "scheduled", "respawning"] as const).map((phase) => (
                            <button
                                key={phase}
                                type="button"
                                className={`boss-phase-pill ${selectedPhase === phase ? "active" : ""}`}
                                aria-pressed={selectedPhase === phase}
                                onClick={() => setSelectedPhase(phase)}
                            >
                                <span>{phase.charAt(0).toUpperCase() + phase.slice(1)}</span>
                                <span className="pill-count">
                                    {phase === "all" ? calculatedRows.length : calculatedRows.filter((r) => r.phase === phase).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <section className="boss-item-modifier-panel" aria-label="World boss item modifier">
                        <div className="boss-item-modifier-copy">
                            <span className="control-label">Confirmed Item Modifier</span>
                            <strong>{itemMagicFindBonus > 0 || equippedSpecialMagicFindBonus > 0 ? `+${itemMagicFindBonus + equippedSpecialMagicFindBonus}% world boss MF` : "No item effect"}</strong>
                            <small>Temporary dropdowns exclude equipped specials; profile gear special adds MF when selected.</small>
                            {worldBossItemOptions.length === 0 && (
                                <small className="boss-empty-menu-hint">No tradeable temporary world-boss MF items found. Equip special gear in Profiles.</small>
                            )}
                        </div>
                        <div className="boss-item-modifier-picker">
                            <WorldBossItemEffectPicker
                                ariaLabel="World boss magic-find item modifier"
                                emptyLabel="No item effect"
                                label="Magic-Find Item"
                                onChange={setWorldBossItemModifierName}
                                options={worldBossItemOptions}
                                value={worldBossItemModifierName}
                            />
                        </div>
                    </section>

                    <div className="boss-results-status" role="status" aria-live="polite">
                        {searchIsActive
                            ? `${shownBossCount} of ${totalBossCount} bosses shown.`
                            : `${totalBossCount} world bosses tracked.`}
                    </div>
                </>
            )}
        </>
    );
}

export default BossHeader;
