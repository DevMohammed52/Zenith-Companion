"use client";

import { useId } from "react";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Badge, Banner, Button, EmptyState, Icon, SegmentedControl, type BadgeVariant } from "@/components/ui";
import { formatDuration, formatGold } from "@/lib/format";
import {
    DEFAULT_RELEVANT_TELEPORT_LEVEL,
    DEFAULT_MOVEMENT_SPEED,
    MAX_RELEVANT_TELEPORT_LEVEL,
    getRoutineBossKey,
    type RoutineTimingStatus,
    type TravelMode,
} from "@/lib/world-boss-routing";
import type { BossState } from "../hooks/useBossState";
import { clampNumber, getBossKey, type BossPhase } from "../types";
import styles from "../Bosses.module.css";

function getPhaseBadgeVariant(phase: BossPhase): BadgeVariant {
    if (phase === "active") return "success";
    if (phase === "ready") return "standard";
    if (phase === "respawning") return "warning";
    return "neutral";
}

function getTimingBadgeVariant(status: RoutineTimingStatus): BadgeVariant {
    if (status === "missed" || status === "overlap") return "danger";
    if (status === "tight") return "warning";
    return "neutral";
}

function getTimingLabel(status: RoutineTimingStatus): string | null {
    if (status === "missed") return "Misses window";
    if (status === "overlap") return "Overlaps battle";
    if (status === "tight") return "Tight window";
    return null;
}

type WorldBossRoutinePlannerProps = {
    state: BossState;
};

export function WorldBossRoutinePlanner({ state }: WorldBossRoutinePlannerProps) {
    const {
        calculatedRows,
        routineRows,
        routinePickerRows,
        routineLocations,
        routineBossKeys,
        toggleRoutineBoss,
        selectAllRoutineBosses,
        selectActiveReadyRoutineBosses,
        clearRoutineBosses,
        routineStartLocation,
        setRoutineStartLocation,
        routineTeleportLevel,
        setRoutineTeleportLevel,
        routineMovementSpeed,
        setRoutineMovementSpeed,
        routineClassDiscount,
        setRoutineClassDiscount,
        routineTravelMode,
        setRoutineTravelMode,
        routinePlan,
        isRestrictedRoutine,
        routineDisplayNet,
        routineProfitLabel,
        routineLocationOpen,
        setRoutineLocationOpen,
        routineLocationPlacement,
        routineLocationRef,
        routineLocationTriggerRef,
        routineLocationOptionRefs,
        handleRoutineLocationTriggerKeyDown,
        handleRoutineLocationOptionKeyDown,
        openBoss,
    } = state;

    const locationLabelId = useId();
    const locationListboxId = useId();
    const totalDistanceMeters = routinePlan.legs.reduce((sum, leg) => sum + (leg.distanceMeters ?? 0), 0);

    return (
        <section className={styles.routinePanel} aria-label="World boss routine planner">
            <div className={styles.routineHeader}>
                <div className={styles.titleGroup}>
                    <span className={styles.eyebrow}>
                        <Icon name="route" size="sm" aria-hidden="true" />
                        <span>Route &amp; Teleport Planner</span>
                    </span>
                    <h2 className={styles.pageTitle} style={{ fontSize: "1.35rem" }}>
                        World Boss Circuit
                    </h2>
                    <p className={styles.subtitle}>
                        Orders upcoming bosses by spawn window and estimates teleport cost or travel duration from your
                        starting zone.
                    </p>
                </div>

                <div className={styles.routineSummaryStrip}>
                    <div className={styles.statCell}>
                        <span className={styles.statLabel}>Gross Loot Value</span>
                        <strong className={styles.statValue} style={{ color: "var(--text-accent)" }}>
                            <GoldIcon size={14} />
                            <span>~{formatGold(routinePlan.grossEv)}g</span>
                        </strong>
                        <span className={styles.statHint}>{routinePlan.legs.length} scheduled stops</span>
                    </div>
                    <div className={styles.statCell}>
                        <span className={styles.statLabel}>
                            {routineTravelMode === "teleport" ? "Teleport Cost" : "Travel Time"}
                        </span>
                        <strong className={styles.statValue}>
                            {routineTravelMode === "teleport" ? (
                                <>
                                    <GoldIcon size={14} />
                                    <span>{formatGold(routinePlan.teleportCost)}g</span>
                                </>
                            ) : (
                                <span>{formatDuration(routinePlan.travelSeconds)}</span>
                            )}
                        </strong>
                        <span className={styles.statHint}>
                            {routineTravelMode === "teleport"
                                ? `TP Lv. ${routineTeleportLevel === "" ? DEFAULT_RELEVANT_TELEPORT_LEVEL : routineTeleportLevel}`
                                : `Speed ${routineMovementSpeed === "" ? DEFAULT_MOVEMENT_SPEED : routineMovementSpeed}`}
                        </span>
                    </div>
                    <div className={styles.statCell}>
                        <span className={styles.statLabel}>{routineProfitLabel}</span>
                        <strong className={styles.statValue}>
                            <GoldIcon size={14} />
                            <span>~{formatGold(routineDisplayNet)}g</span>
                        </strong>
                        <span className={styles.statHint}>
                            {routineTravelMode === "teleport" ? "Gross EV minus TP" : "Zero teleport fee"}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.routineControlsGrid}>
                <div className={styles.controlField} ref={routineLocationRef}>
                    <span id={locationLabelId} className={styles.fieldLabel}>
                        <span>Start Location</span>
                        <span className={styles.fieldMeta}>{routineLocations.length} zones</span>
                    </span>
                    <div className={styles.pickerWrap}>
                        <button
                            ref={routineLocationTriggerRef}
                            type="button"
                            className={styles.pickerTrigger}
                            aria-expanded={routineLocationOpen}
                            aria-haspopup="listbox"
                            aria-controls={routineLocationOpen ? locationListboxId : undefined}
                            aria-labelledby={locationLabelId}
                            onClick={() => setRoutineLocationOpen((current) => !current)}
                            onKeyDown={handleRoutineLocationTriggerKeyDown}
                        >
                            <span className={styles.pickerTriggerContent}>
                                <span className={styles.pickerTriggerIcon} aria-hidden="true">
                                    <Icon name="mapPin" size="sm" />
                                </span>
                                <span className={styles.pickerPrimary}>{routineStartLocation}</span>
                            </span>
                            <Icon name="chevronDown" size="sm" aria-hidden="true" />
                        </button>

                        {routineLocationOpen && (
                            <div
                                id={locationListboxId}
                                role="listbox"
                                aria-label="Routine start location"
                                className={`${styles.pickerMenu} ${routineLocationPlacement === "up" ? styles.pickerMenuUp : ""}`.trim()}
                            >
                                {routineLocations.map((locationName, index) => {
                                    const selected = locationName === routineStartLocation;
                                    return (
                                        <button
                                            key={locationName}
                                            ref={(el) => {
                                                routineLocationOptionRefs.current[index] = el;
                                            }}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            className={`${styles.pickerOption} ${selected ? styles.pickerOptionSelected : ""}`.trim()}
                                            onClick={() => {
                                                setRoutineStartLocation(locationName);
                                                setRoutineLocationOpen(false);
                                                routineLocationTriggerRef.current?.focus();
                                            }}
                                            onKeyDown={(event) => handleRoutineLocationOptionKeyDown(event, index)}
                                        >
                                            <span className={styles.pickerOptionMain}>
                                                <Icon name="mapPin" size="sm" aria-hidden="true" />
                                                <span className={styles.pickerPrimary}>{locationName}</span>
                                            </span>
                                            {selected && <Icon name="check" size="sm" aria-hidden="true" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.controlField}>
                    <label htmlFor="routine-tp-level" className={styles.fieldLabel}>
                        <span>Economic TL</span>
                        <span className={styles.fieldMeta}>0-{MAX_RELEVANT_TELEPORT_LEVEL}</span>
                    </label>
                    <div className={styles.numberFieldWrap}>
                        <input
                            id="routine-tp-level"
                            type="number"
                            min={0}
                            max={MAX_RELEVANT_TELEPORT_LEVEL}
                            step={1}
                            inputMode="numeric"
                            className={styles.numberFieldInput}
                            value={routineTeleportLevel}
                            placeholder={String(DEFAULT_RELEVANT_TELEPORT_LEVEL)}
                            onChange={(event) => {
                                const raw = event.target.value;
                                if (raw === "") {
                                    setRoutineTeleportLevel("");
                                    return;
                                }
                                const parsed = Number(raw);
                                if (Number.isFinite(parsed)) {
                                    setRoutineTeleportLevel(clampNumber(parsed, 0, MAX_RELEVANT_TELEPORT_LEVEL));
                                }
                            }}
                        />
                    </div>
                </div>

                <div className={styles.controlField}>
                    <label htmlFor="routine-move-speed" className={styles.fieldLabel}>
                        <span>Move Speed</span>
                        <span className={styles.fieldMeta}>units/s</span>
                    </label>
                    <div className={styles.numberFieldWrap}>
                        <input
                            id="routine-move-speed"
                            type="number"
                            min={0.1}
                            max={500}
                            step={0.5}
                            inputMode="decimal"
                            className={styles.numberFieldInput}
                            value={routineMovementSpeed}
                            placeholder={String(DEFAULT_MOVEMENT_SPEED)}
                            onChange={(event) => {
                                const raw = event.target.value;
                                if (raw === "") {
                                    setRoutineMovementSpeed("");
                                    return;
                                }
                                const parsed = Number(raw);
                                if (Number.isFinite(parsed)) {
                                    setRoutineMovementSpeed(clampNumber(parsed, 0.1, 500));
                                }
                            }}
                        />
                    </div>
                </div>

                <div className={styles.controlField}>
                    <span className={styles.fieldLabel}>
                        <span>Travel Method</span>
                    </span>
                    <SegmentedControl<TravelMode>
                        ariaLabel="Travel mode"
                        value={routineTravelMode}
                        onChange={setRoutineTravelMode}
                        options={[
                            { value: "teleport", label: "Teleport" },
                            { value: "travel", label: "Travel" },
                        ]}
                    />
                </div>

                <div className={styles.controlField}>
                    <span className={styles.fieldLabel}>
                        <span>Market Status</span>
                    </span>
                    <button
                        type="button"
                        className={`${styles.discountToggle} ${routineClassDiscount ? styles.discountToggleActive : ""}`.trim()}
                        aria-pressed={routineClassDiscount}
                        onClick={() => setRoutineClassDiscount((current) => !current)}
                    >
                        <Icon name={routineClassDiscount ? "check" : "minus"} size="sm" aria-hidden="true" />
                        <span>{routineClassDiscount ? "Cursed / Banished" : "Standard Market"}</span>
                    </button>
                </div>
            </div>

            {isRestrictedRoutine && (
                <Banner variant="warning" icon="warning">
                    <strong>Cursed / Banished</strong> applies the 50% teleport discount and uses vendor floor values instead
                    of standard marketplace sell assumptions.
                </Banner>
            )}

            <div className={styles.bossPickerSection}>
                <div className={styles.bossPickerHeader}>
                    <span className={styles.fieldLabel}>
                        <span>Included Bosses ({routineBossKeys.length}/{routineRows.length})</span>
                    </span>
                    <div className={styles.bossPickerActions}>
                        <Button variant="ghost" size="sm" onClick={selectAllRoutineBosses}>
                            Select all
                        </Button>
                        <Button variant="ghost" size="sm" onClick={selectActiveReadyRoutineBosses}>
                            Active / Ready only
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearRoutineBosses}>
                            Clear
                        </Button>
                    </div>
                </div>

                <div className={styles.routineBossGrid}>
                    {routinePickerRows.map((boss) => {
                        const bossKey = getRoutineBossKey(boss);
                        const checked = routineBossKeys.includes(bossKey);
                        return (
                            <button
                                key={bossKey}
                                type="button"
                                aria-pressed={checked}
                                className={`${styles.routineBossToggle} ${checked ? styles.routineBossToggleSelected : ""}`.trim()}
                                onClick={() => toggleRoutineBoss(bossKey)}
                            >
                                <span className={styles.routineBossMain}>
                                    <span className={styles.pickerTriggerIcon} aria-hidden="true">
                                        <GameImage
                                            src={boss.image_url}
                                            alt=""
                                            width={22}
                                            height={22}
                                            sizes="22px"
                                            fallback={<Icon name="boss" size="xs" />}
                                        />
                                    </span>
                                    <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                                        <span className={styles.routineBossName}>{boss.name}</span>
                                        <span className={styles.routineBossSub}>
                                            Lv. {boss.level} | ~{formatGold(boss.ev)}g
                                        </span>
                                    </span>
                                </span>
                                <Badge
                                    size="sm"
                                    variant={getPhaseBadgeVariant(boss.phase)}
                                    className={
                                        checked && (boss.phase === "scheduled" || boss.phase === "unknown")
                                            ? styles.routineBossBadgeNeutral
                                            : undefined
                                    }
                                >
                                    {boss.statusLabel}
                                </Badge>
                            </button>
                        );
                    })}
                </div>
            </div>

            {routinePlan.legs.length === 0 ? (
                <EmptyState
                    variant="default"
                    icon="route"
                    title="No bosses selected"
                    description="Pick one or more world bosses above to plot travel legs, teleport costs, and spawn arrival order."
                    action={{
                        label: "Select all bosses",
                        onClick: selectAllRoutineBosses,
                    }}
                />
            ) : (
                <div className={styles.bossPickerSection}>
                    <div className={styles.bossPickerHeader}>
                        <h3 className={styles.modalSectionHeading}>
                            <Icon name="route" size="sm" aria-hidden="true" />
                            <span>Planned Circuit ({routinePlan.legs.length} stops)</span>
                        </h3>
                        <span className={styles.fieldMeta}>
                            Total distance: {formatGold(totalDistanceMeters)} units
                        </span>
                    </div>

                    {(routinePlan.conflictLegs > 0 || routinePlan.missingLegs > 0) && (
                        <Banner variant="warning" icon="warning">
                            <div>
                                {routinePlan.conflictLegs > 0 && (
                                    <div>
                                        {routinePlan.conflictLegs} stop(s) have tight overlaps or missed spawn windows under
                                        the current travel settings.
                                    </div>
                                )}
                                {routinePlan.missingLegs > 0 && (
                                    <div>
                                        {routinePlan.missingLegs} stop(s) do not have mapped coordinate distances yet.
                                    </div>
                                )}
                            </div>
                        </Banner>
                    )}

                    <div className={styles.timelineList}>
                        {routinePlan.legs.map((leg, index) => {
                            const bossKey = getRoutineBossKey(leg.boss);
                            const fullBossRow =
                                calculatedRows.find((row) => getBossKey(row) === bossKey || row.name === leg.boss.name) ||
                                null;
                            const timingLabel = getTimingLabel(leg.timingStatus);

                            return (
                                <div key={`${bossKey}-${index}`} className={styles.timelineLeg}>
                                    <span className={styles.legStep} aria-hidden="true">
                                        {index + 1}
                                    </span>

                                    <div className={styles.legBody}>
                                        <div className={styles.legTitleRow}>
                                            <button
                                                type="button"
                                                className={styles.legTitleBtn}
                                                onClick={() => fullBossRow && openBoss(fullBossRow)}
                                                disabled={!fullBossRow}
                                            >
                                                {leg.boss.name}
                                            </button>
                                            {fullBossRow && (
                                                <Badge size="sm" variant={getPhaseBadgeVariant(fullBossRow.phase)}>
                                                    {fullBossRow.statusLabel}
                                                </Badge>
                                            )}
                                            {timingLabel && (
                                                <Badge size="sm" variant={getTimingBadgeVariant(leg.timingStatus)}>
                                                    {timingLabel}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className={styles.legMetaRow}>
                                            <span>
                                                {leg.origin} → {leg.destination}
                                            </span>
                                            <span>
                                                {leg.distanceMeters !== null
                                                    ? `${formatGold(leg.distanceMeters)} dist`
                                                    : "Unknown dist"}
                                            </span>
                                            <span>
                                                {leg.travelSeconds !== null && leg.travelSeconds > 0
                                                    ? `${formatDuration(leg.travelSeconds)} travel`
                                                    : "Same zone"}
                                            </span>
                                            {leg.waitSeconds !== null && leg.waitSeconds > 0 && (
                                                <span>Wait {formatDuration(leg.waitSeconds)}</span>
                                            )}
                                            {leg.timingNote && <span>{leg.timingNote}</span>}
                                        </div>
                                    </div>

                                    <div className={styles.legOutcomeCol}>
                                        <span className={styles.evValue}>
                                            <GoldIcon size={13} />
                                            <span>~{formatGold(leg.ev)}g</span>
                                        </span>
                                        <span className={styles.cellMuted}>
                                            {routineTravelMode === "teleport" ? (
                                                <>
                                                    TP cost:{" "}
                                                    {leg.teleportCost !== null ? `${formatGold(leg.teleportCost)}g` : "--"}
                                                </>
                                            ) : (
                                                <>
                                                    Walked (
                                                    {leg.travelSeconds !== null
                                                        ? formatDuration(leg.travelSeconds)
                                                        : "--"}
                                                    )
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
