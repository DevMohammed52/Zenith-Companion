"use client";

import type { KeyboardEvent } from "react";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Badge, Button, Icon, SearchInput, SegmentedControl, type BadgeVariant } from "@/components/ui";
import { formatCountdown, formatGold } from "@/lib/format";
import type { BossState } from "../hooks/useBossState";
import { type BossPhase, type BossView } from "../types";
import { WorldBossItemEffectPicker } from "./WorldBossItemEffectPicker";
import styles from "../Bosses.module.css";

const PHASE_FILTERS: Array<{ id: BossPhase | "all"; label: string }> = [
    { id: "all", label: "All Bosses" },
    { id: "active", label: "In Progress" },
    { id: "ready", label: "Lobby Ready" },
    { id: "scheduled", label: "Scheduled" },
    { id: "respawning", label: "Respawning" },
];

function getRadarBadgeVariant(phase: BossPhase): BadgeVariant {
    if (phase === "active") return "success";
    if (phase === "ready") return "standard";
    if (phase === "respawning") return "warning";
    return "neutral";
}

function getPhaseDotClass(phase: BossPhase | "all") {
    if (phase === "active") return styles.dotActive;
    if (phase === "ready") return styles.dotReady;
    if (phase === "respawning") return styles.dotRespawning;
    if (phase === "scheduled") return styles.dotScheduled;
    return "";
}

type BossHeaderProps = {
    state: BossState;
};

export function BossHeader({ state }: BossHeaderProps) {
    const {
        activeBossView,
        setActiveBossView,
        activeCount,
        shownBossCount,
        totalBossCount,
        detailsCountLabel,
        nextBoss,
        now,
        magicFind,
        baseMagicFind,
        itemMagicFindBonus,
        equippedSpecialMagicFindBonus,
        equippedWorldBossSpecial,
        selectedWorldBossItemModifier,
        searchTerm,
        setSearchTerm,
        selectedPhase,
        setSelectedPhase,
        resetFilters,
        worldBossMagicFindDraft,
        profileWorldBossMagicFindInput,
        setWorldBossMagicFindEditing,
        setWorldBossMagicFindDraft,
        commitWorldBossMagicFind,
        worldBossItemOptions,
        worldBossItemModifierName,
        setWorldBossItemModifierName,
        openBoss,
        activeProfile,
    } = state;

    const searchOrFilterActive = searchTerm.trim().length > 0 || selectedPhase !== "all";
    const mfBonusSummary = [
        itemMagicFindBonus > 0 ? `+${itemMagicFindBonus}% item` : "",
        equippedSpecialMagicFindBonus > 0 ? `+${equippedSpecialMagicFindBonus}% special` : "",
    ]
        .filter(Boolean)
        .join(" • ");

    const handleMfKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitWorldBossMagicFind(worldBossMagicFindDraft);
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            event.preventDefault();
            setWorldBossMagicFindEditing(false);
            setWorldBossMagicFindDraft(String(profileWorldBossMagicFindInput ?? ""));
            event.currentTarget.blur();
        }
    };

    return (
        <header className={styles.headerBlock}>
            <div className={styles.titleRow}>
                <div className={styles.titleGroup}>
                    <span className={styles.eyebrow}>
                        <Icon name="boss" size="sm" aria-hidden="true" />
                        <span>{state.headerStatusText}</span>
                    </span>
                    <h1 className={styles.pageTitle}>World Bosses</h1>
                    <p className={styles.subtitle}>
                        Live spawn countdowns, market-weighted loot expectations, and travel-optimal boss circuits.
                    </p>
                </div>
            </div>

            <section className={styles.radarCard} aria-label="Live world boss radar">
                <div className={styles.radarHero}>
                    <span className={styles.radarAvatar} aria-hidden="true">
                        <GameImage
                            src={nextBoss?.image_url}
                            alt=""
                            width={46}
                            height={46}
                            sizes="46px"
                            fallback={<Icon name="boss" size="lg" />}
                        />
                    </span>
                    <div className={styles.radarMeta}>
                        <div className={styles.radarMetaTop}>
                            <span className={styles.radarLabel}>Next Spotlight</span>
                            {nextBoss && (
                                <Badge size="sm" variant={getRadarBadgeVariant(nextBoss.phase)}>
                                    {nextBoss.statusLabel}
                                </Badge>
                            )}
                        </div>
                        {nextBoss ? (
                            <>
                                <button
                                    type="button"
                                    className={styles.radarBossButton}
                                    onClick={() => openBoss(nextBoss)}
                                >
                                    <span>{nextBoss.name}</span>
                                    <Icon name="chevronRight" size="sm" aria-hidden="true" />
                                </button>
                                <div className={styles.radarSubline}>
                                    <span className={styles.radarCountdown}>
                                        {nextBoss.countdownLabel} {formatCountdown(nextBoss.countdownTarget, now)}
                                    </span>
                                    <span>{nextBoss.location?.name || "Unknown"}</span>
                                    <span className={styles.evValue}>
                                        <GoldIcon size={13} />
                                        <span>~{formatGold(nextBoss.ev)}g EV</span>
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className={styles.radarSubline}>Waiting for world boss schedule sync...</div>
                        )}
                    </div>
                </div>

                <div className={styles.statStrip}>
                    <div className={styles.statCell}>
                        <span className={styles.statLabel}>Shown Bosses</span>
                        <strong className={styles.statValue}>
                            {shownBossCount}/{totalBossCount}
                        </strong>
                        <span className={styles.statHint}>{selectedPhase === "all" ? "All phases" : selectedPhase}</span>
                    </div>
                    <div className={styles.statCell}>
                        <span className={styles.statLabel}>Active / Ready</span>
                        <strong className={styles.statValue}>{activeCount}</strong>
                        <span className={styles.statHint}>{activeCount > 0 ? "Joinable now" : "Queue wait"}</span>
                    </div>
                    <div className={styles.statCell}>
                        <span className={styles.statLabel}>Total Boss MF</span>
                        <strong className={styles.statValue}>+{magicFind}%</strong>
                        <span className={styles.statHint}>
                            {mfBonusSummary || `${baseMagicFind}% base`}
                        </span>
                    </div>
                    <div className={styles.statCell}>
                        <span className={styles.statLabel}>Next Window</span>
                        <strong className={styles.statValue}>
                            {nextBoss ? formatCountdown(nextBoss.countdownTarget, now) : "--"}
                        </strong>
                        <span className={styles.statHint}>
                            {nextBoss?.nextSpawnTime
                                ? nextBoss.nextSpawnTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : "No ETA"}
                        </span>
                    </div>
                </div>
            </section>

            <section className={styles.toolbarPanel} aria-label="Boss filters and magic find controls">
                <div className={styles.toolbarTop}>
                    <div className={styles.viewSwitcherWrap}>
                        <SegmentedControl<BossView>
                            ariaLabel="World boss view"
                            value={activeBossView}
                            onChange={setActiveBossView}
                            options={[
                                {
                                    value: "details",
                                    label: "Boss Details",
                                    icon: <Icon name="boss" size="sm" aria-hidden="true" />,
                                },
                                {
                                    value: "planner",
                                    label: "Routine Planner",
                                    icon: <Icon name="route" size="sm" aria-hidden="true" />,
                                },
                            ]}
                            fullWidth
                        />
                    </div>
                    <div className={styles.mechanicHint}>
                        <Icon name="info" size="sm" aria-hidden="true" />
                        <span>Queues open 2h before fight start and lock when battle begins (10m-3h anti-overlap jitter).</span>
                    </div>
                </div>

                <div className={styles.controlsRow}>
                    {activeBossView === "details" ? (
                        <div className={styles.controlField}>
                            <label htmlFor="boss-search-input" className={styles.fieldLabel}>
                                <span>Search Boss or Loot</span>
                                <span className={styles.fieldMeta}>Name, zone, or drop</span>
                            </label>
                            <SearchInput
                                id="boss-search-input"
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Search bosses, locations, or drops..."
                                ariaLabel="Search world bosses"
                                showShortcutHint={false}
                            />
                        </div>
                    ) : (
                        <div className={styles.controlField}>
                            <span className={styles.fieldLabel}>
                                <span>Active Profile</span>
                                <span className={styles.fieldMeta}>Routine defaults</span>
                            </span>
                            <div className={styles.passiveStrip}>
                                <span className={styles.passiveStripLead}>
                                    <Icon name="profile" size="sm" aria-hidden="true" />
                                    <span>{activeProfile?.name || "Manual configuration"}</span>
                                </span>
                                <span>+{magicFind}% WB MF applied to route EV</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.controlField}>
                        <label htmlFor="boss-mf-input" className={styles.fieldLabel}>
                            <span>Base WB Magic Find</span>
                            <span className={styles.fieldMeta}>0-500%</span>
                        </label>
                        <div className={styles.numberFieldWrap}>
                            <input
                                id="boss-mf-input"
                                type="number"
                                min={0}
                                max={500}
                                step={1}
                                inputMode="numeric"
                                className={styles.numberFieldInput}
                                value={worldBossMagicFindDraft}
                                placeholder="0"
                                onFocus={() => setWorldBossMagicFindEditing(true)}
                                onChange={(event) => setWorldBossMagicFindDraft(event.target.value)}
                                onBlur={() => commitWorldBossMagicFind(worldBossMagicFindDraft)}
                                onKeyDown={handleMfKeyDown}
                            />
                            <span className={styles.numberFieldUnit}>%</span>
                        </div>
                    </div>

                    <WorldBossItemEffectPicker
                        options={worldBossItemOptions}
                        value={worldBossItemModifierName}
                        onChange={setWorldBossItemModifierName}
                    />
                </div>

                {(equippedSpecialMagicFindBonus > 0 && equippedWorldBossSpecial) || selectedWorldBossItemModifier ? (
                    <div className={styles.passiveStrip}>
                        <span className={styles.passiveStripLead}>
                            <Icon name="magic" size="sm" aria-hidden="true" />
                            <span>
                                Active Bonus:{" "}
                                {[
                                    equippedSpecialMagicFindBonus > 0 && equippedWorldBossSpecial
                                        ? `${equippedWorldBossSpecial.name} (+${equippedSpecialMagicFindBonus}%)`
                                        : "",
                                    selectedWorldBossItemModifier
                                        ? `${selectedWorldBossItemModifier.name} (+${selectedWorldBossItemModifier.magicFind}%)`
                                        : "",
                                ]
                                    .filter(Boolean)
                                    .join(" + ")}
                            </span>
                        </span>
                        <span>Effective cap-trimmed MF: +{magicFind}%</span>
                    </div>
                ) : null}

                {activeBossView === "details" && (
                    <div className={styles.filterFooter}>
                        <div className={styles.phaseFilters} role="group" aria-label="Filter bosses by spawn phase">
                            {PHASE_FILTERS.map((filter) => {
                                const isActive = selectedPhase === filter.id;
                                const dotClass = getPhaseDotClass(filter.id);
                                return (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        className={`${styles.phasePill} ${isActive ? styles.phasePillActive : ""}`.trim()}
                                        aria-pressed={isActive}
                                        onClick={() => setSelectedPhase(filter.id)}
                                    >
                                        {dotClass && <span className={`${styles.phaseDot} ${dotClass}`} aria-hidden="true" />}
                                        <span>{filter.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.resultsMeta}>
                            <span>{detailsCountLabel}</span>
                            {searchOrFilterActive && (
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    Reset filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </header>
    );
}
