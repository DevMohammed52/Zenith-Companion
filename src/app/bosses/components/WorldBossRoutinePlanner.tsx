"use client";

import { AlertTriangle, Check, ChevronDown, MapPin } from "lucide-react";
import { EmptyState } from "@/components/StateBlock";
import {
    formatCountdown,
    formatDistance,
    formatDuration,
    formatGold,
    formatTime,
} from "@/lib/format";
import {
    BASE_MOVEMENT_SPEED,
    MAX_RELEVANT_TELEPORT_LEVEL,
    getRoutineBossKey,
} from "@/lib/world-boss-routing";
import { clampNumber, isFiniteDate } from "../types";
import type { BossState } from "../hooks/useBossState";

export interface WorldBossRoutinePlannerProps {
    state: BossState;
}

export function WorldBossRoutinePlanner({ state }: WorldBossRoutinePlannerProps) {
    const {
        isRestrictedRoutine,
        now,
        routinePlan,
        routineTravelMode,
        setRoutineTravelMode,
        routineDisplayNet,
        routineProfitLabel,
        searchIsActive,
        routineLocationRef,
        routineLocationTriggerRef,
        routineLocationOpen,
        setRoutineLocationOpen,
        routineStartLocation,
        setRoutineStartLocation,
        routineLocationPlacement,
        routineLocations,
        routineLocationOptionRefs,
        handleRoutineLocationTriggerKeyDown,
        handleRoutineLocationOptionKeyDown,
        routineTeleportLevel,
        setRoutineTeleportLevel,
        routineMovementSpeed,
        setRoutineMovementSpeed,
        routineClassDiscount,
        setRoutineClassDiscount,
        routinePickerRows,
        routineBossKeys,
        toggleRoutineBoss,
    } = state;

    return (
        <section className="boss-routine-planner">
            <div className="boss-routine-header">
                <div>
                    <span className="boss-eyebrow"><MapPin size={14} /> Routine Planner</span>
                    <h2>Route the bosses you actually run</h2>
                    <p>Plan the next rotation by location, travel time, teleport cost, and net expected boss value.</p>
                </div>
                <div className="boss-routine-summary">
                    <div><span>{isRestrictedRoutine ? "Loot Value" : "Gross EV"}</span><strong>~{formatGold(routinePlan.grossEv)}g</strong></div>
                    <div><span>{routineTravelMode === "teleport" ? "TP Cost" : "Travel Time"}</span><strong>{routineTravelMode === "teleport" ? `${formatGold(routinePlan.teleportCost)}g` : formatDuration(routinePlan.travelSeconds)}</strong></div>
                    <div>
                        <span>{routineProfitLabel}</span>
                        {isRestrictedRoutine ? (
                            <strong className="text-muted">N/A</strong>
                        ) : (
                            <strong className={routineDisplayNet >= 0 ? "profit-positive" : "profit-negative"}>~{formatGold(routineDisplayNet)}g</strong>
                        )}
                    </div>
                </div>
            </div>

            {searchIsActive && (
                <div className="boss-scope-note" role="note">
                    Search only filters Boss Details. Routine Planner still routes the full selected boss set.
                </div>
            )}

            <div className="boss-routine-controls">
                <div className="control-group routine-location-field" ref={routineLocationRef}>
                    <span className="control-label">Start Location</span>
                    <button
                        type="button"
                        ref={routineLocationTriggerRef}
                        className={`routine-location-trigger ${routineLocationOpen ? "open" : ""}`}
                        onClick={() => setRoutineLocationOpen((open) => !open)}
                        onKeyDown={handleRoutineLocationTriggerKeyDown}
                        aria-haspopup="listbox"
                        aria-expanded={routineLocationOpen}
                        aria-label="Routine start location"
                    >
                        <span>{routineStartLocation}</span>
                        <ChevronDown size={16} />
                    </button>
                    {routineLocationOpen && (
                        <div
                            className={`routine-location-menu custom-scrollbar ${routineLocationPlacement === "up" ? "drop-up" : ""}`}
                            role="listbox"
                            aria-label="Routine start location"
                        >
                            {routineLocations.map((location, index) => (
                                <button
                                    key={location}
                                    type="button"
                                    ref={(node) => { routineLocationOptionRefs.current[index] = node; }}
                                    role="option"
                                    aria-selected={location === routineStartLocation}
                                    className={location === routineStartLocation ? "selected" : ""}
                                    onKeyDown={(event) => handleRoutineLocationOptionKeyDown(event, index)}
                                    onClick={() => {
                                        setRoutineStartLocation(location);
                                        setRoutineLocationOpen(false);
                                        routineLocationTriggerRef.current?.focus();
                                    }}
                                >
                                    <MapPin size={13} />
                                    <span>{location}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <label className="control-group">
                    <span className="control-label">Economic TL</span>
                    <input
                        aria-label="Routine economic teleport total level"
                        type="number"
                        min="0"
                        max={MAX_RELEVANT_TELEPORT_LEVEL}
                        title="Economic Total Level: Gross TL minus Guild, Shadow, and seasonal masteries. Teleport costs cap at 1,500."
                        className="control-input"
                        value={routineTeleportLevel}
                        onChange={(event) => setRoutineTeleportLevel(event.target.value === "" ? "" : clampNumber(Number(event.target.value) || 0, 0, MAX_RELEVANT_TELEPORT_LEVEL))}
                    />
                    <span className="routine-teleport-hint">Gross TL minus Guild, Shadow &amp; Seasonal (Capped at 1,500)</span>
                </label>

                <label className="control-group">
                    <span className="control-label">Movement Speed</span>
                    <input
                        aria-label="Routine movement speed"
                        type="number"
                        min="0.1"
                        step="0.01"
                        className="control-input"
                        value={routineMovementSpeed}
                        onChange={(event) => setRoutineMovementSpeed(event.target.value === "" ? "" : clampNumber(Number(event.target.value) || BASE_MOVEMENT_SPEED, 0.1, 500))}
                    />
                </label>

                <div className="control-group">
                    <span className="control-label">Route Mode</span>
                    <div className="routine-segmented">
                        <button type="button" className={routineTravelMode === "teleport" ? "active" : ""} onClick={() => setRoutineTravelMode("teleport")}>Teleport</button>
                        <button type="button" className={routineTravelMode === "travel" ? "active" : ""} onClick={() => setRoutineTravelMode("travel")}>Travel</button>
                    </div>
                </div>

                <div className="control-group">
                    <span className="control-label">Class</span>
                    <button type="button" className={`routine-toggle ${routineClassDiscount ? "active" : ""}`} onClick={() => setRoutineClassDiscount((current) => !current)}>
                        {routineClassDiscount ? "Cursed / Banished" : "Standard market"}
                    </button>
                </div>
            </div>

            {isRestrictedRoutine && (
                <div className="boss-warning-box routine-warning routine-class-note">
                    <AlertTriangle size={16} />
                    <p>Cursed and Banished cannot trade or use the market, so loot value is only a reference number here. The planner focuses on route timing and gold spent, not sell profit.</p>
                </div>
            )}

            <div className="routine-boss-picker">
                {routinePickerRows.map((row) => {
                    const bossKey = getRoutineBossKey(row);
                    const selected = routineBossKeys.includes(bossKey);
                    return (
                        <button
                            key={bossKey}
                            type="button"
                            className={selected ? "selected" : ""}
                            aria-pressed={selected}
                            onClick={() => toggleRoutineBoss(bossKey)}
                        >
                            {row.image_url && <img src={row.image_url} alt="" />}
                            <span>{row.name}</span>
                            <small>{row.location?.name || "Unknown"}</small>
                            {selected && (
                                <span className="routine-boss-check" aria-hidden="true">
                                    <Check size={13} />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {routinePlan.legs.length === 0 ? (
                <EmptyState
                    compact
                    title="No route selected"
                    description="Select at least one boss to build a route."
                />
            ) : (
                <div className="routine-timeline">
                    {routinePlan.legs.map((leg, index) => {
                        const legDisplayNet = routineTravelMode === "teleport" ? leg.netAfterTeleport : leg.ev;
                        return (
                            <div className="routine-leg" key={`${getRoutineBossKey(leg.boss)}-${index}`}>
                                <div className="routine-leg-marker">
                                    <span>{index + 1}</span>
                                </div>
                                <div className="routine-leg-main">
                                    <div className="routine-leg-title">
                                        <strong>{leg.boss.name}</strong>
                                        <span>
                                            {formatTime(leg.boss.nextSpawnTime)} at {leg.destination}
                                            {isFiniteDate(leg.boss.countdownTarget) ? ` - ${leg.boss.countdownLabel || "Starts in"} ${formatCountdown(leg.boss.countdownTarget, now)}` : ""}
                                        </span>
                                    </div>
                                    <div className="routine-leg-route">
                                        <span>{leg.origin}</span>
                                        <em>to</em>
                                        <span>{leg.destination}</span>
                                    </div>
                                    <div className="routine-leg-metrics">
                                        <span>{formatDistance(leg.distanceMeters)}</span>
                                        <span>{formatDuration(leg.travelSeconds)}</span>
                                        <span>{leg.teleportCost === null ? "TP unknown" : `${formatGold(leg.teleportCost)}g TP`}</span>
                                        <span>~{formatGold(leg.ev)}g {isRestrictedRoutine ? "value" : "EV"}</span>
                                        {isRestrictedRoutine ? (
                                            <strong className="text-muted">profit N/A</strong>
                                        ) : (
                                            <strong className={legDisplayNet === null || legDisplayNet >= 0 ? "profit-positive" : "profit-negative"}>
                                                {legDisplayNet === null ? "Net unknown" : `~${formatGold(legDisplayNet)}g net`}
                                            </strong>
                                        )}
                                        {leg.timingStatus !== "ok" && (
                                            <strong className={`routine-timing-badge timing-${leg.timingStatus}`}>
                                                {leg.timingNote || "Timing risk"}
                                            </strong>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {routinePlan.missingLegs > 0 && (
                <div className="boss-warning-box routine-warning">
                    <AlertTriangle size={16} />
                    <p>{routinePlan.missingLegs} route leg{routinePlan.missingLegs === 1 ? "" : "s"} need distance data before cost can be trusted.</p>
                </div>
            )}
            {routinePlan.conflictLegs > 0 && (
                <div className="boss-warning-box routine-warning">
                    <AlertTriangle size={16} />
                    <p>{routinePlan.conflictLegs} selected boss window{routinePlan.conflictLegs === 1 ? "" : "s"} need timing review. Some can still be reachable after spawn; check the route timing badges.</p>
                </div>
            )}
        </section>
    );
}

export default WorldBossRoutinePlanner;
