"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Clock,
    ExternalLink,
    MapPin,
    PackageOpen,
    Search,
    Shield,
    Skull,
    Sparkles,
    Timer,
    X,
} from "lucide-react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useItemModal } from "@/context/ItemModalContext";
import { BOSS_SCHEDULES } from "../../constants/events";
import { getItemTrueValue } from "@/lib/ev-logic";
import { formatGold } from "@/lib/format";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import MobileSortControls from "@/components/MobileSortControls";
import LoreThreadPanel from "@/components/LoreThreadPanel";
import { getLoreHintsForNames } from "@/lib/lore-links";
import type { TravelMode } from "@/lib/world-boss-routing";
import {
    BASE_MOVEMENT_SPEED,
    DEFAULT_EFFECTIVE_TELEPORT_LEVEL,
    DEFAULT_MOVEMENT_SPEED,
    MAX_EFFECTIVE_TELEPORT_LEVEL,
    buildWorldBossRoutinePlan,
    getRoutineBossKey,
} from "@/lib/world-boss-routing";

type BossPhase = "active" | "ready" | "respawning" | "scheduled" | "unknown";

type BossSchedule = {
    respawnHours?: number;
    lengthSeconds?: number;
};

type BossDrop = {
    name: string;
    chance?: number;
    quantity?: number;
    image_url?: string;
    quality?: string;
};

type ValueSource = "Custom" | "Market" | "Vendor" | "Chest EV" | "Recipe EV" | "True Value" | "Missing";
type LiquiditySignal = "LIQUID" | "STEADY" | "THIN" | "NO SALES" | "VENDOR SAFE" | "CUSTOM" | "EV MODEL" | "MISSING";

const WORLD_BOSS_ROUTINE_STORAGE_KEY = "zenith_world_boss_routine_planner";

const isFiniteDate = (date: Date | null | undefined): date is Date => Boolean(date && Number.isFinite(date.getTime()));

const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatTime = (date?: Date | null) => (
    isFiniteDate(date) ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unknown"
);

const formatDateTime = (date?: Date | null) => (
    isFiniteDate(date)
        ? `${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} ${formatTime(date)}`
        : "Unknown"
);

const formatCountdown = (target: Date | null | undefined, now: number) => {
    if (!isFiniteDate(target)) return "Unknown";
    const totalSeconds = Math.max(0, Math.floor((target.getTime() - now) / 1000));
    if (totalSeconds <= 0) return "now";

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};

const formatDuration = (totalSeconds: number | null | undefined) => {
    if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds)) return "Unknown";
    const seconds = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
};

const formatDistance = (distanceMeters: number | null | undefined) => (
    distanceMeters === null || distanceMeters === undefined
        ? "Unknown"
        : distanceMeters === 0
            ? "Same location"
            : `${distanceMeters.toLocaleString()}m`
);

const getBossKey = (boss: any) => String(boss?.id ?? boss?.name ?? "");

const nearlyEqual = (a: number, b: number) => Math.abs(a - b) < 0.01;

function getBossWindow(boss: any, now: number) {
    const scheduleInfo: BossSchedule | null = BOSS_SCHEDULES[boss.name] || (
        boss.respawnHours ? { respawnHours: boss.respawnHours, lengthSeconds: boss.lengthSeconds || 3600 } : null
    );
    const originalStart = parseDate(boss.battle_starts_at);
    const originalEnd = parseDate(boss.battle_ends_at);
    const inferredLengthSeconds = originalStart && originalEnd
        ? Math.max(1, Math.round((originalEnd.getTime() - originalStart.getTime()) / 1000))
        : scheduleInfo?.lengthSeconds || boss.lengthSeconds || 3600;
    const cycleMs = scheduleInfo?.respawnHours ? scheduleInfo.respawnHours * 3600000 : null;
    const status = String(boss.status || "").toUpperCase();

    if (!isFiniteDate(originalStart)) {
        return {
            scheduleInfo,
            phase: status === "IN_PROGRESS" ? "active" as BossPhase : "unknown" as BossPhase,
            statusLabel: status ? status.replace(/_/g, " ") : "Unknown",
            nextSpawnTime: null,
            battleEndTime: originalEnd,
            countdownTarget: originalEnd,
            countdownLabel: "Ends in",
            battleLengthSeconds: inferredLengthSeconds,
        };
    }

    let nextStart = new Date(originalStart);
    let nextEnd = isFiniteDate(originalEnd)
        ? new Date(originalEnd)
        : new Date(nextStart.getTime() + inferredLengthSeconds * 1000);

    if (cycleMs) {
        while (nextEnd.getTime() <= now) {
            nextStart = new Date(nextStart.getTime() + cycleMs);
            nextEnd = new Date(nextEnd.getTime() + cycleMs);
        }
    }

    const isActive = now >= nextStart.getTime() && now < nextEnd.getTime();
    let phase: BossPhase = "scheduled";
    if (isActive) phase = "active";
    else if (status === "READY_FOR_LOBBY") phase = "ready";
    else if (status === "RESPAWNING") phase = "respawning";

    const statusLabel = phase === "active"
        ? "In Progress"
        : phase === "ready"
            ? "Lobby Ready"
            : phase === "respawning"
                ? "Respawning"
                : "Scheduled";

    return {
        scheduleInfo,
        phase,
        statusLabel,
        nextSpawnTime: nextStart,
        battleEndTime: nextEnd,
        countdownTarget: phase === "active" ? nextEnd : nextStart,
        countdownLabel: phase === "active" ? "Ends in" : "Starts in",
        battleLengthSeconds: inferredLengthSeconds,
    };
}

function applyMagicFindToDrops(drops: BossDrop[], magicFind: number) {
    const multiplier = 1 + clampNumber(Number(magicFind) || 0, 0, 1000) / 100;
    const adjusted = drops.map((drop, index) => {
        const baseChance = Number(drop.chance || 0);
        return {
            ...drop,
            index,
            baseChance,
            adjustedChance: baseChance * multiplier,
        };
    });

    let overCap = adjusted.reduce((sum, drop) => sum + drop.adjustedChance, 0) - 100;
    if (overCap > 0) {
        const commonFirst = [...adjusted].sort((a, b) => b.adjustedChance - a.adjustedChance);
        for (const drop of commonFirst) {
            if (overCap <= 0) break;
            const reduction = Math.min(overCap, drop.adjustedChance);
            adjusted[drop.index].adjustedChance -= reduction;
            overCap -= reduction;
        }
    }

    return adjusted.map((drop) => ({
        ...drop,
        adjustedChance: Math.max(0, drop.adjustedChance),
    }));
}

function getValueBreakdown(
    itemName: string,
    marketData: any,
    allItemsDb: any,
    options: { customPrices?: Record<string, number>; marketTaxMultiplier: number; barteringBoost?: number | "" },
) {
    const marketItem = marketData?.[itemName];
    const dbItem = allItemsDb?.[itemName];
    const trueValue = getItemTrueValue(itemName, marketData, allItemsDb, 0, options);
    const customGross = Number(options.customPrices?.[itemName] || 0);
    const marketGross = customGross || Number(marketItem?.avg_3 || marketItem?.price || 0);
    const marketNet = (customGross > 0 || dbItem?.is_tradeable !== false)
        ? marketGross * options.marketTaxMultiplier
        : 0;
    const vendorNet = Number(dbItem?.vendor_price || marketItem?.vendor_price || 0) * (1 + (Number(options.barteringBoost) || 0) / 100);
    const volume = Number(marketItem?.vol_3 || 0);

    let source: ValueSource = "Missing";
    if (trueValue <= 0) source = "Missing";
    else if (customGross > 0 && nearlyEqual(trueValue, marketNet)) source = "Custom";
    else if (vendorNet > 0 && nearlyEqual(trueValue, vendorNet)) source = "Vendor";
    else if (marketNet > 0 && nearlyEqual(trueValue, marketNet)) source = "Market";
    else if (dbItem?.loot_table?.length || dbItem?.chest_drops?.length) source = "Chest EV";
    else if (dbItem?.type === "RECIPE" || dbItem?.recipe_yield) source = "Recipe EV";
    else source = "True Value";

    return {
        trueValue,
        marketGross,
        marketNet,
        vendorNet,
        volume,
        source,
    };
}

function getLiquiditySignal(source: ValueSource, volume: number, trueValue: number): LiquiditySignal {
    if (trueValue <= 0) return "MISSING";
    if (source === "Vendor") return "VENDOR SAFE";
    if (source === "Custom") return "CUSTOM";
    if (source === "Chest EV" || source === "Recipe EV" || source === "True Value") return "EV MODEL";
    if (volume >= 150) return "LIQUID";
    if (volume >= 40) return "STEADY";
    if (volume > 0) return "THIN";
    return "NO SALES";
}

function getSignalClass(signal: LiquiditySignal) {
    if (signal === "LIQUID" || signal === "VENDOR SAFE" || signal === "CUSTOM") return "boss-signal-good";
    if (signal === "STEADY" || signal === "EV MODEL") return "boss-signal-neutral";
    if (signal === "THIN") return "boss-signal-warn";
    return "boss-signal-bad";
}

const signalRank: Record<LiquiditySignal, number> = {
    "MISSING": 0,
    "NO SALES": 1,
    "THIN": 2,
    "EV MODEL": 3,
    "STEADY": 4,
    "CUSTOM": 5,
    "VENDOR SAFE": 6,
    "LIQUID": 7,
};

function getBestBossSignal(signals: LiquiditySignal[]): LiquiditySignal {
    return signals.reduce<LiquiditySignal>((best, signal) => (
        signalRank[signal] > signalRank[best] ? signal : best
    ), "MISSING");
}

function getPhaseClass(phase: BossPhase) {
    if (phase === "active") return "phase-active";
    if (phase === "ready") return "phase-ready";
    if (phase === "respawning") return "phase-respawning";
    return "phase-scheduled";
}

function BossesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { marketData, staticData, allItemsDb } = useData();
    const { preferences, setPreferences } = usePreferences();
    const { openItemByName, prefetchItem } = useItemModal();
    const [selectedBoss, setSelectedBoss] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("nextSpawnTime");
    const [sortDesc, setSortDesc] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [now, setNow] = useState(() => Date.now());
    const [routineBossKeys, setRoutineBossKeys] = useState<string[]>([]);
    const [routineInitialized, setRoutineInitialized] = useState(false);
    const [routineSettingsLoaded, setRoutineSettingsLoaded] = useState(false);
    const [routineStartLocation, setRoutineStartLocation] = useState("The Citadel");
    const [routineTeleportLevel, setRoutineTeleportLevel] = useState<number | "">(DEFAULT_EFFECTIVE_TELEPORT_LEVEL);
    const [routineMovementSpeed, setRoutineMovementSpeed] = useState<number | "">(DEFAULT_MOVEMENT_SPEED);
    const [routineClassDiscount, setRoutineClassDiscount] = useState(false);
    const [routineTravelMode, setRoutineTravelMode] = useState<TravelMode>("teleport");
    const [routineLocationOpen, setRoutineLocationOpen] = useState(false);
    const routineLocationRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(WORLD_BOSS_ROUTINE_STORAGE_KEY);
            if (stored) {
                const saved = JSON.parse(stored);
                if (Array.isArray(saved.routineBossKeys)) {
                    setRoutineBossKeys(saved.routineBossKeys.map(String));
                    setRoutineInitialized(true);
                }
                if (typeof saved.routineStartLocation === "string") setRoutineStartLocation(saved.routineStartLocation);
                if (saved.routineTeleportLevel === "") {
                    setRoutineTeleportLevel("");
                } else if (Number.isFinite(Number(saved.routineTeleportLevel))) {
                    setRoutineTeleportLevel(clampNumber(Number(saved.routineTeleportLevel), 0, MAX_EFFECTIVE_TELEPORT_LEVEL));
                }
                if (saved.routineMovementSpeed === "") {
                    setRoutineMovementSpeed("");
                } else if (Number.isFinite(Number(saved.routineMovementSpeed))) {
                    setRoutineMovementSpeed(clampNumber(Number(saved.routineMovementSpeed), 0.1, 500));
                }
                if (typeof saved.routineClassDiscount === "boolean") setRoutineClassDiscount(saved.routineClassDiscount);
                if (saved.routineTravelMode === "teleport" || saved.routineTravelMode === "travel") {
                    setRoutineTravelMode(saved.routineTravelMode);
                }
            }
        } catch {
            // Ignore malformed local planner settings and fall back to defaults.
        } finally {
            setRoutineSettingsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!routineSettingsLoaded) return;
        localStorage.setItem(WORLD_BOSS_ROUTINE_STORAGE_KEY, JSON.stringify({
            routineBossKeys,
            routineStartLocation,
            routineTeleportLevel,
            routineMovementSpeed,
            routineClassDiscount,
            routineTravelMode,
        }));
    }, [
        routineBossKeys,
        routineClassDiscount,
        routineMovementSpeed,
        routineSettingsLoaded,
        routineStartLocation,
        routineTeleportLevel,
        routineTravelMode,
    ]);

    useEffect(() => {
        const searchParam = searchParams.get("search");
        if (searchParam) setSearchTerm(searchParam);
    }, [searchParams]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedBoss(null);
                setRoutineLocationOpen(false);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!routineLocationRef.current?.contains(event.target as Node)) {
                setRoutineLocationOpen(false);
            }
        };
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const magicFind = clampNumber(Number(preferences.worldBossMagicFind) || 0, 0, 500);

    const calculatedRows = useMemo(() => {
        if (!staticData?.world_bosses || !marketData || !allItemsDb) return [];
        const calculated = [];
        const evOptions = {
            customPrices: preferences.customPrices,
            marketTaxMultiplier: getMarketTaxMultiplier(preferences.membership),
            barteringBoost: preferences.barteringBoost,
        };

        for (const boss of staticData.world_bosses) {
            const timing = getBossWindow(boss, now);
            const adjustedDrops = applyMagicFindToDrops(boss.loot || [], magicFind);

            const lootDetails = adjustedDrops.map((drop: any) => {
                const value = getValueBreakdown(drop.name, marketData, allItemsDb, evOptions);
                const expectedVal = (drop.adjustedChance / 100) * (drop.quantity || 1) * value.trueValue;
                const signal = getLiquiditySignal(value.source, value.volume, value.trueValue);

                return {
                    ...drop,
                    ...value,
                    expectedVal,
                    signal,
                    magicFindGain: drop.adjustedChance - drop.baseChance,
                };
            });
            const evPerClear = lootDetails.reduce((sum: number, drop: any) => sum + drop.expectedVal, 0);
            const bestSignal = getBestBossSignal(lootDetails.map((drop: any) => drop.signal));

            const warnings = [];
            if (lootDetails.some((drop: any) => drop.signal === "THIN" || drop.signal === "NO SALES")) {
                warnings.push("Some rare loot uses thin market prices.");
            }
            if (lootDetails.some((drop: any) => drop.signal === "MISSING")) {
                warnings.push("Some loot has missing value data.");
            }
            if (magicFind > 0 && lootDetails.some((drop: any) => drop.magicFindGain <= 0 && drop.baseChance > 0)) {
                warnings.push("Magic Find cap trimming reduced common drops.");
            }

            calculated.push({
                ...boss,
                ...timing,
                ev: evPerClear,
                dropsCount: boss.loot?.length || 0,
                liquiditySignal: bestSignal,
                warnings,
                lootDetails,
            });
        }

        return calculated;
    }, [
        allItemsDb,
        magicFind,
        marketData,
        now,
        preferences.barteringBoost,
        preferences.customPrices,
        preferences.membership,
        staticData,
    ]);

    const rows = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const filtered = normalizedSearch
            ? calculatedRows.filter((row) => (
                row.name.toLowerCase().includes(normalizedSearch) ||
                row.location?.name?.toLowerCase().includes(normalizedSearch) ||
                row.statusLabel.toLowerCase().includes(normalizedSearch)
            ))
            : [...calculatedRows];

        filtered.sort((a, b) => {
            let valA: any = a[sortCol];
            let valB: any = b[sortCol];
            if (sortCol === "location") {
                valA = a.location?.name || "";
                valB = b.location?.name || "";
            }
            if (sortCol === "nextSpawnTime") {
                valA = a.nextSpawnTime?.getTime?.() || Number.MAX_SAFE_INTEGER;
                valB = b.nextSpawnTime?.getTime?.() || Number.MAX_SAFE_INTEGER;
            }
            if (typeof valA === "string") {
                valA = valA.toLowerCase();
                valB = (valB || "").toLowerCase();
                return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
            }
            valA = valA || 0;
            valB = valB || 0;
            return sortDesc ? valB - valA : valA - valB;
        });

        return filtered;
    }, [calculatedRows, searchTerm, sortCol, sortDesc]);

    const routineRows = useMemo(() => {
        return calculatedRows
            .filter((row) => row.location?.name)
            .sort((a, b) => {
                const timeA = a.nextSpawnTime?.getTime?.() || Number.MAX_SAFE_INTEGER;
                const timeB = b.nextSpawnTime?.getTime?.() || Number.MAX_SAFE_INTEGER;
                return timeA - timeB || String(a.name).localeCompare(String(b.name));
            });
    }, [calculatedRows]);

    const routinePickerRows = useMemo(() => {
        return [...routineRows].sort((a, b) => {
            const levelA = Number(a.level) || 0;
            const levelB = Number(b.level) || 0;
            return levelA - levelB || String(a.name).localeCompare(String(b.name));
        });
    }, [routineRows]);

    const routineLocations = useMemo(() => {
        const locations = new Set<string>();
        for (const row of calculatedRows) {
            if (row.location?.name) locations.add(row.location.name);
        }
        return Array.from(locations).sort((a, b) => a.localeCompare(b));
    }, [calculatedRows]);

    useEffect(() => {
        if (routineInitialized || routineRows.length === 0) return;
        setRoutineBossKeys(routineRows.map((row) => getRoutineBossKey(row)));
        setRoutineInitialized(true);
    }, [routineInitialized, routineRows]);

    useEffect(() => {
        if (routineLocations.length === 0 || routineLocations.includes(routineStartLocation)) return;
        setRoutineStartLocation(routineLocations[0]);
    }, [routineLocations, routineStartLocation]);

    const routinePlan = useMemo(() => buildWorldBossRoutinePlan(routineRows, {
        startLocation: routineStartLocation,
        selectedBossKeys: routineBossKeys,
        effectiveTeleportLevel: Number(routineTeleportLevel) || DEFAULT_EFFECTIVE_TELEPORT_LEVEL,
        movementSpeed: Number(routineMovementSpeed) || BASE_MOVEMENT_SPEED,
        classDiscount: routineClassDiscount,
        travelMode: routineTravelMode,
        currentTime: now,
    }), [
        now,
        routineBossKeys,
        routineClassDiscount,
        routineMovementSpeed,
        routineRows,
        routineStartLocation,
        routineTeleportLevel,
        routineTravelMode,
    ]);
    const isRestrictedRoutine = routineClassDiscount;
    const routineDisplayNet = routineTravelMode === "teleport" ? routinePlan.netEv : routinePlan.grossEv;
    const routineProfitLabel = isRestrictedRoutine ? "Sell Profit" : "Net EV";

    const toggleRoutineBoss = (bossKey: string) => {
        setRoutineBossKeys((current) => current.includes(bossKey)
            ? current.filter((key) => key !== bossKey)
            : [...current, bossKey]);
    };

    const autoOpenedRef = useRef<string | null>(null);

    useEffect(() => {
        if (rows.length === 0) return;
        const searchParam = searchParams.get("search");
        const bossParam = searchParams.get("boss") || searchParam;
        if (bossParam) {
            if (bossParam === autoOpenedRef.current) return;

            const found = rows.find((row) => row.name.toLowerCase() === bossParam.toLowerCase());
            if (found) {
                setSelectedBoss(found);
                autoOpenedRef.current = bossParam;
            }
        } else {
            autoOpenedRef.current = null;
        }
    }, [rows, searchParams]);

    const selectedBossData = useMemo(() => {
        if (!selectedBoss) return null;
        const key = getBossKey(selectedBoss);
        return rows.find((row) => getBossKey(row) === key) || selectedBoss;
    }, [rows, selectedBoss]);

    const selectedBossLore = useMemo(() => {
        if (!selectedBossData) return [];
        return getLoreHintsForNames([
            { name: selectedBossData.name, source: "entity" },
            { name: selectedBossData.location?.name, source: "location" },
            ...(selectedBossData.lootDetails || []).map((drop: any) => ({ name: drop.name, source: "drop" as const })),
        ], 5);
    }, [selectedBossData]);

    const activeCount = rows.filter((row) => row.phase === "active" || row.phase === "ready").length;
    const nextBoss = rows
        .filter((row) => isFiniteDate(row.nextSpawnTime))
        .sort((a, b) => a.nextSpawnTime.getTime() - b.nextSpawnTime.getTime())[0];

    const generateTimetable = (boss: any) => {
        if (!isFiniteDate(boss.nextSpawnTime) || !boss.scheduleInfo?.respawnHours) return [];
        const times = [];
        let current = boss.nextSpawnTime.getTime();
        for (let i = 0; i < 5; i++) {
            const start = new Date(current);
            const end = new Date(current + boss.battleLengthSeconds * 1000);
            times.push({ start, end });
            current += boss.scheduleInfo.respawnHours * 3600000;
        }
        return times;
    };

    const openLoreThread = (entryId: string) => {
        setSelectedBoss(null);
        router.push(`/lore?thread=${entryId}`);
    };

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDesc(!sortDesc);
        else {
            setSortCol(col);
            setSortDesc(col === "ev" || col === "level");
        }
    };

    const openBoss = (row: any) => setSelectedBoss(row);

    const handleKeyboardOpen = (event: ReactKeyboardEvent<HTMLElement>, row: any) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openBoss(row);
        }
    };

    const renderSortIcon = (col: string) => {
        if (sortCol !== col) return null;
        return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    return (
        <main className="container bosses-page">
            <div className="header">
                <h1 className="header-title">
                    <Skull size={24} color="var(--text-accent)" /> ZENITH WORLD BOSSES
                </h1>
                <div className="header-status" aria-live="polite">
                    <div className="status-dot"></div>
                    <span className="mono">
                        {activeCount > 0 ? `${activeCount} ACTIVE / READY` : nextBoss ? `NEXT ${formatCountdown(nextBoss.nextSpawnTime, now)}` : `${rows.length} BOSSES LOADED`}
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
                    <div><span>Tracked</span><strong>{rows.length}</strong></div>
                    <div><span>Magic Find</span><strong>+{magicFind}%</strong></div>
                    <div><span>Next Window</span><strong>{nextBoss ? formatTime(nextBoss.nextSpawnTime) : "N/A"}</strong></div>
                </div>
            </section>

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

                <div className="boss-routine-controls">
                    <div className="control-group routine-location-field" ref={routineLocationRef}>
                        <span className="control-label">Start Location</span>
                        <button
                            type="button"
                            className={`routine-location-trigger ${routineLocationOpen ? "open" : ""}`}
                            onClick={() => setRoutineLocationOpen((open) => !open)}
                            aria-haspopup="listbox"
                            aria-expanded={routineLocationOpen}
                        >
                            <span>{routineStartLocation}</span>
                            <ChevronDown size={16} />
                        </button>
                        {routineLocationOpen && (
                            <div className="routine-location-menu custom-scrollbar" role="listbox">
                                {routineLocations.map((location) => (
                                    <button
                                        key={location}
                                        type="button"
                                        role="option"
                                        aria-selected={location === routineStartLocation}
                                        className={location === routineStartLocation ? "selected" : ""}
                                        onClick={() => {
                                            setRoutineStartLocation(location);
                                            setRoutineLocationOpen(false);
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
                        <span className="control-label">Teleport Level</span>
                        <input
                            type="number"
                            min="0"
                            max={MAX_EFFECTIVE_TELEPORT_LEVEL}
                            className="control-input"
                            value={routineTeleportLevel}
                            onChange={(event) => setRoutineTeleportLevel(event.target.value === "" ? "" : clampNumber(Number(event.target.value) || 0, 0, MAX_EFFECTIVE_TELEPORT_LEVEL))}
                        />
                    </label>
                    <label className="control-group">
                        <span className="control-label">Movement Speed</span>
                        <input
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
                                onClick={() => toggleRoutineBoss(bossKey)}
                            >
                                {row.image_url && <img src={row.image_url} alt="" />}
                                <span>{row.name}</span>
                                <small>{row.location?.name || "Unknown"}</small>
                            </button>
                        );
                    })}
                </div>

                {routinePlan.legs.length === 0 ? (
                    <div className="routine-empty">Select at least one boss to build a route.</div>
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
                                            <span>{formatTime(leg.boss.nextSpawnTime)} at {leg.destination}</span>
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
                        <p>{routinePlan.conflictLegs} selected boss window{routinePlan.conflictLegs === 1 ? "" : "s"} overlap or start too close to the previous stop. Check the timing badges in the route.</p>
                    </div>
                )}
            </section>

            <div className="controls boss-controls">
                <div className="control-group boss-search-control">
                    <label className="control-label">Search Bosses</label>
                    <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Search boss, status, or location..."
                            style={{ width: "100%", paddingLeft: "2rem" }}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                </div>
                <div className="control-group boss-mf-control">
                    <label className="control-label">World Boss Magic Find</label>
                    <div style={{ position: "relative" }}>
                        <Sparkles size={14} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-accent)" }} />
                        <input
                            type="number"
                            min="0"
                            max="500"
                            className="control-input"
                            style={{ width: "100%", paddingLeft: "2rem" }}
                            value={preferences.worldBossMagicFind}
                            onChange={(event) => {
                                const next = event.target.value === "" ? "" : clampNumber(Number(event.target.value) || 0, 0, 500);
                                setPreferences({ worldBossMagicFind: next });
                            }}
                        />
                    </div>
                </div>
            </div>

            <section className="table-wrapper">
                <div className="desktop-only">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th className="sortable left-align" onClick={() => handleSort("name")}>Boss {renderSortIcon("name")}</th>
                                    <th className="sortable left-align" onClick={() => handleSort("location")}>Location {renderSortIcon("location")}</th>
                                    <th className="sortable" onClick={() => handleSort("level")}>Level {renderSortIcon("level")}</th>
                                    <th className="sortable" onClick={() => handleSort("nextSpawnTime")}>Status / Timer {renderSortIcon("nextSpawnTime")}</th>
                                    <th className="sortable" onClick={() => handleSort("ev")}>EV / Boss {renderSortIcon("ev")}</th>
                                    <th>Signal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr
                                        key={getBossKey(row)}
                                        className="clickable-row"
                                        onClick={() => openBoss(row)}
                                        onKeyDown={(event) => handleKeyboardOpen(event, row)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <td className="item-name left-align">
                                            <div className="boss-name-cell">
                                                {row.image_url && <img src={row.image_url} alt="" />}
                                                <div>
                                                    <span>{row.name}</span>
                                                    <small>{row.dropsCount} drops - {row.scheduleInfo?.respawnHours || "?"}h cycle</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
                                        <td className="mono">{row.level}</td>
                                        <td>
                                            <div className="boss-status-cell">
                                                <span className={`boss-phase ${getPhaseClass(row.phase)}`}>{row.statusLabel}</span>
                                                <strong>{row.countdownLabel} {formatCountdown(row.countdownTarget, now)}</strong>
                                                <small>{row.phase === "active" ? `Ends ${formatTime(row.battleEndTime)}` : `Starts ${formatDateTime(row.nextSpawnTime)}`}</small>
                                            </div>
                                        </td>
                                        <td className="mono profit-positive font-bold">
                                            ~{formatGold(row.ev)}
                                        </td>
                                        <td>
                                            <span className={`boss-signal ${getSignalClass(row.liquiditySignal)}`}>{row.liquiditySignal}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mobile-only">
                    <MobileSortControls
                        label="Sort Bosses"
                        value={sortCol || "nextSpawnTime"}
                        descending={sortDesc}
                        onSort={handleSort}
                        onToggleDirection={() => setSortDesc((prev) => !prev)}
                        options={[
                            { value: "nextSpawnTime", label: "Next Spawn" },
                            { value: "ev", label: "EV / Boss" },
                            { value: "level", label: "Level" },
                            { value: "name", label: "Name" },
                            { value: "location", label: "Location" },
                        ]}
                    />
                    <div className="mobile-card-grid">
                        {rows.map((row) => (
                            <div
                                key={getBossKey(row)}
                                className="mobile-alchemy-card boss-mobile-card"
                                onClick={() => openBoss(row)}
                                onKeyDown={(event) => handleKeyboardOpen(event, row)}
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
                                    <div className="m-roi pos">~{formatGold(row.ev)}g</div>
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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {selectedBossData && (
                <div className="modal-overlay boss-modal-overlay" onClick={() => setSelectedBoss(null)}>
                    <div className="modal-content boss-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div className="boss-modal-title">
                                {selectedBossData.image_url && (
                                    <img src={selectedBossData.image_url} alt="" />
                                )}
                                <div>
                                    <h2>{selectedBossData.name}</h2>
                                    <div className="boss-modal-tags">
                                        <span><MapPin size={12} /> {selectedBossData.location?.name || "Unknown"}</span>
                                        <span><Shield size={12} /> Level {selectedBossData.level}</span>
                                        <span className={`boss-phase ${getPhaseClass(selectedBossData.phase)}`}>{selectedBossData.statusLabel}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="close-btn" aria-label="Close boss details" onClick={() => setSelectedBoss(null)}><X size={20} /></button>
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
                                    <div className="stat-label">Magic Find</div>
                                    <div className="stat-value">+{magicFind}%</div>
                                </div>
                            </div>

                            {selectedBossData.warnings?.length > 0 && (
                                <div className="boss-warning-box">
                                    <AlertTriangle size={16} />
                                    <div>
                                        {selectedBossData.warnings.map((warning: string) => <p key={warning}>{warning}</p>)}
                                    </div>
                                </div>
                            )}

                            <LoreThreadPanel hints={selectedBossLore} title="Boss Lore Thread" onOpenThread={openLoreThread} />

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
                                        key={`${drop.name}-${drop.baseChance}`}
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
                                                <div className="loot-item-name">{drop.name} <span>x{drop.quantity || 1}</span></div>
                                                <div className="boss-drop-rate">
                                                    {drop.adjustedChance.toFixed(drop.adjustedChance >= 10 ? 1 : 2)}% adjusted
                                                    {magicFind > 0 && <span>base {drop.baseChance}%</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="boss-loot-value">
                                            <strong>~{formatGold(drop.expectedVal, 2)}g</strong>
                                            <span>{drop.source} - {formatGold(drop.trueValue)}g ea <ExternalLink size={10} /></span>
                                            <em className={`boss-signal ${getSignalClass(drop.signal)}`}>{drop.signal}</em>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .bosses-page {
                    max-width: min(1500px, calc(100vw - 2rem));
                    overflow-x: hidden;
                }
                .boss-modal-overlay {
                    z-index: 5000;
                }
                .table-wrapper,
                .mobile-only,
                .mobile-card-grid,
                .boss-radar,
                .boss-routine-planner,
                .boss-controls {
                    max-width: 100%;
                    min-width: 0;
                }
                .boss-radar {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: 1.5rem;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding: 1.25rem;
                    border: 1px solid rgba(56, 189, 248, 0.18);
                    border-radius: 8px;
                    background:
                        radial-gradient(circle at 10% 0%, rgba(56, 189, 248, 0.12), transparent 28rem),
                        linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(10, 10, 12, 0.88));
                    animation: boss-rise 0.4s ease both;
                }
                .boss-radar-main { min-width: 0; }
                .boss-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                    color: var(--text-accent);
                    font-size: 0.72rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    margin-bottom: 0.55rem;
                }
                .boss-radar h2 {
                    font-size: clamp(1.4rem, 3vw, 2.2rem);
                    margin: 0 0 0.35rem;
                    overflow-wrap: anywhere;
                }
                .boss-radar p {
                    margin: 0;
                    color: var(--text-muted);
                    line-height: 1.5;
                }
                .boss-routine-planner {
                    margin-bottom: 1.5rem;
                    padding: 1.25rem;
                    border: 1px solid rgba(74, 222, 128, 0.18);
                    border-radius: 8px;
                    background:
                        radial-gradient(circle at 95% 0%, rgba(74, 222, 128, 0.1), transparent 24rem),
                        linear-gradient(135deg, rgba(12, 18, 18, 0.86), rgba(10, 10, 12, 0.92));
                    animation: boss-rise 0.45s ease both;
                }
                .boss-routine-header {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(18rem, 32rem);
                    gap: 1.25rem;
                    align-items: start;
                    margin-bottom: 1rem;
                }
                .boss-routine-header h2 {
                    margin: 0 0 0.35rem;
                    font-size: clamp(1.15rem, 2vw, 1.55rem);
                }
                .boss-routine-header p {
                    margin: 0;
                    color: var(--text-muted);
                    line-height: 1.5;
                }
                .boss-routine-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.65rem;
                }
                .boss-routine-summary div {
                    min-width: 0;
                    padding: 0.75rem;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    background: rgba(255,255,255,0.03);
                }
                .boss-routine-summary span {
                    display: block;
                    margin-bottom: 0.3rem;
                    color: var(--text-muted);
                    font-size: 0.65rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                }
                .boss-routine-summary strong {
                    display: block;
                    color: #fff;
                    font-size: 0.95rem;
                    overflow-wrap: anywhere;
                }
                .boss-routine-controls {
                    display: grid;
                    grid-template-columns: minmax(12rem, 1.25fr) repeat(4, minmax(9rem, 1fr));
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .boss-routine-controls .control-input {
                    width: 100%;
                }
                .routine-location-field {
                    position: relative;
                    z-index: 20;
                }
                .routine-location-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.75rem;
                    width: 100%;
                    min-height: 42px;
                    padding: 0 0.85rem;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    background: rgba(0,0,0,0.32);
                    color: #fff;
                    font: inherit;
                    font-weight: 800;
                    cursor: pointer;
                    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
                }
                .routine-location-trigger span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .routine-location-trigger svg {
                    flex: 0 0 auto;
                    color: var(--text-muted);
                    transition: transform 0.2s ease, color 0.2s ease;
                }
                .routine-location-trigger:hover,
                .routine-location-trigger.open {
                    border-color: rgba(56,189,248,0.35);
                    background: rgba(255,255,255,0.045);
                    box-shadow: 0 0 0 1px rgba(56,189,248,0.08);
                }
                .routine-location-trigger.open svg {
                    color: var(--text-accent);
                    transform: rotate(180deg);
                }
                .routine-location-menu {
                    position: absolute;
                    top: calc(100% + 0.4rem);
                    left: 0;
                    right: 0;
                    max-height: min(18rem, 58vh);
                    overflow-y: auto;
                    padding: 0.35rem;
                    border: 1px solid rgba(56,189,248,0.28);
                    border-radius: 8px;
                    background: rgba(9, 13, 14, 0.98);
                    box-shadow: 0 18px 45px rgba(0,0,0,0.42);
                }
                .routine-location-menu button {
                    display: flex;
                    align-items: center;
                    gap: 0.55rem;
                    width: 100%;
                    min-height: 2.3rem;
                    padding: 0.55rem 0.6rem;
                    border: 0;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--text-muted);
                    text-align: left;
                    cursor: pointer;
                    font-weight: 800;
                }
                .routine-location-menu button svg {
                    flex: 0 0 auto;
                    color: var(--text-accent);
                }
                .routine-location-menu button span {
                    min-width: 0;
                    overflow-wrap: anywhere;
                }
                .routine-location-menu button:hover,
                .routine-location-menu button.selected {
                    color: #fff;
                    background: rgba(56,189,248,0.1);
                }
                .routine-segmented {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.25rem;
                    padding: 0.25rem;
                    min-height: 42px;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    background: rgba(255,255,255,0.02);
                }
                .routine-segmented button,
                .routine-toggle {
                    border: 0;
                    border-radius: 6px;
                    color: var(--text-muted);
                    background: transparent;
                    cursor: pointer;
                    font-weight: 900;
                    font-size: 0.74rem;
                    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
                }
                .routine-segmented button.active,
                .routine-toggle.active {
                    color: #06110a;
                    background: var(--text-success);
                }
                .routine-segmented button:hover,
                .routine-toggle:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.07);
                }
                .routine-toggle {
                    width: 100%;
                    min-height: 42px;
                    padding: 0 0.75rem;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.02);
                }
                .routine-toggle.active:hover {
                    color: #06110a;
                    background: var(--text-success);
                }
                .routine-boss-picker {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    direction: rtl;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }
                .routine-boss-picker button {
                    display: grid;
                    grid-template-columns: 24px minmax(7rem, 1fr);
                    grid-template-rows: auto auto;
                    column-gap: 0.55rem;
                    direction: ltr;
                    min-width: 0;
                    padding: 0.65rem;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    background: rgba(255,255,255,0.025);
                    color: var(--text-muted);
                    text-align: left;
                    cursor: pointer;
                    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
                }
                .routine-boss-picker button:hover,
                .routine-boss-picker button.selected {
                    border-color: rgba(74, 222, 128, 0.35);
                    background: rgba(74, 222, 128, 0.08);
                    transform: translateY(-1px);
                }
                .routine-boss-picker img {
                    grid-row: 1 / span 2;
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    object-fit: cover;
                }
                .routine-boss-picker span {
                    color: #fff;
                    font-weight: 900;
                    font-size: 0.82rem;
                    overflow-wrap: anywhere;
                }
                .routine-boss-picker small {
                    color: var(--text-muted);
                    font-size: 0.68rem;
                    overflow-wrap: anywhere;
                }
                .routine-empty {
                    padding: 1rem;
                    color: var(--text-muted);
                    border: 1px dashed var(--border-subtle);
                    border-radius: 8px;
                    text-align: center;
                }
                .routine-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 0.65rem;
                }
                .routine-leg {
                    display: grid;
                    grid-template-columns: 2rem minmax(0, 1fr);
                    gap: 0.75rem;
                    align-items: stretch;
                }
                .routine-leg-marker {
                    display: flex;
                    justify-content: center;
                    padding-top: 0.75rem;
                }
                .routine-leg-marker span {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.75rem;
                    height: 1.75rem;
                    border-radius: 999px;
                    color: #06110a;
                    background: var(--text-success);
                    font-size: 0.75rem;
                    font-weight: 900;
                }
                .routine-leg-main {
                    min-width: 0;
                    padding: 0.8rem 0.9rem;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    background: rgba(255,255,255,0.025);
                }
                .routine-leg-title,
                .routine-leg-route,
                .routine-leg-metrics {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    align-items: center;
                }
                .routine-leg-title {
                    justify-content: space-between;
                    margin-bottom: 0.45rem;
                }
                .routine-leg-title strong {
                    color: #fff;
                    overflow-wrap: anywhere;
                }
                .routine-leg-title span,
                .routine-leg-route em {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-style: normal;
                }
                .routine-leg-route {
                    margin-bottom: 0.55rem;
                    color: var(--text-accent);
                    font-size: 0.78rem;
                    font-weight: 800;
                }
                .routine-leg-route span {
                    overflow-wrap: anywhere;
                }
                .routine-leg-metrics span,
                .routine-leg-metrics strong {
                    display: inline-flex;
                    align-items: center;
                    min-height: 1.6rem;
                    padding: 0.25rem 0.5rem;
                    border: 1px solid var(--border-subtle);
                    border-radius: 5px;
                    background: rgba(255,255,255,0.025);
                    font-size: 0.72rem;
                    font-weight: 800;
                }
                .routine-leg-metrics span {
                    color: var(--text-muted);
                }
                .routine-warning {
                    margin: 0.9rem 0 0;
                }
                .routine-class-note {
                    margin: 0 0 0.9rem;
                }
                .routine-warning p {
                    margin: 0;
                }
                .routine-timing-badge {
                    border-color: rgba(56,189,248,0.28) !important;
                    color: #7dd3fc !important;
                    background: rgba(56,189,248,0.1) !important;
                }
                .timing-overlap,
                .timing-missed {
                    border-color: rgba(248,113,113,0.35) !important;
                    color: #fca5a5 !important;
                    background: rgba(248,113,113,0.1) !important;
                }
                .timing-tight {
                    border-color: rgba(250,204,21,0.34) !important;
                    color: #fde68a !important;
                    background: rgba(250,204,21,0.1) !important;
                }
                .boss-radar-stats {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(7rem, 1fr));
                    gap: 0.75rem;
                }
                .boss-radar-stats div {
                    padding: 0.85rem;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    background: rgba(255,255,255,0.03);
                }
                .boss-radar-stats span {
                    display: block;
                    color: var(--text-muted);
                    font-size: 0.68rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: 0.35rem;
                }
                .boss-radar-stats strong {
                    color: #fff;
                    font-size: 1.05rem;
                    overflow-wrap: anywhere;
                }
                .boss-controls {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
                }
                .boss-name-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    min-width: 0;
                }
                .boss-name-cell img,
                .boss-mobile-name img {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    object-fit: cover;
                    flex: 0 0 auto;
                }
                .boss-name-cell div {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .boss-name-cell span {
                    overflow-wrap: anywhere;
                }
                .boss-name-cell small {
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    margin-top: 0.2rem;
                }
                .boss-status-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    align-items: flex-end;
                    min-width: 9rem;
                }
                .boss-status-cell strong {
                    color: #fff;
                    font-size: 0.78rem;
                }
                .boss-status-cell small {
                    color: var(--text-muted);
                    font-size: 0.68rem;
                }
                .boss-phase,
                .boss-signal {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: fit-content;
                    border-radius: 5px;
                    padding: 0.25rem 0.45rem;
                    font-size: 0.67rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    border: 1px solid var(--border-subtle);
                    white-space: nowrap;
                }
                .phase-active {
                    color: #86efac;
                    background: rgba(34,197,94,0.12);
                    border-color: rgba(34,197,94,0.28);
                }
                .phase-ready {
                    color: #7dd3fc;
                    background: rgba(56,189,248,0.12);
                    border-color: rgba(56,189,248,0.28);
                }
                .phase-respawning,
                .phase-scheduled {
                    color: #f8c56d;
                    background: rgba(245,176,65,0.1);
                    border-color: rgba(245,176,65,0.25);
                }
                .boss-signal-good {
                    color: #86efac;
                    background: rgba(34,197,94,0.12);
                    border-color: rgba(34,197,94,0.28);
                }
                .boss-signal-neutral {
                    color: #7dd3fc;
                    background: rgba(56,189,248,0.1);
                    border-color: rgba(56,189,248,0.22);
                }
                .boss-signal-warn {
                    color: #facc15;
                    background: rgba(250,204,21,0.1);
                    border-color: rgba(250,204,21,0.24);
                }
                .boss-signal-bad {
                    color: #fca5a5;
                    background: rgba(239,68,68,0.1);
                    border-color: rgba(239,68,68,0.24);
                }
                .boss-mobile-card {
                    cursor: pointer;
                }
                .boss-mobile-card:focus-visible,
                .boss-loot-row:focus-visible,
                tr.clickable-row:focus-visible {
                    outline: 2px solid var(--text-accent);
                    outline-offset: -2px;
                }
                .boss-mobile-name {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    min-width: 0;
                }
                .boss-modal {
                    max-width: min(920px, calc(100vw - 2rem));
                }
                .boss-modal-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    min-width: 0;
                }
                .boss-modal-title img {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                    flex: 0 0 auto;
                }
                .boss-modal-title h2 {
                    margin: 0;
                    overflow-wrap: anywhere;
                }
                .boss-modal-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.45rem;
                    margin-top: 0.5rem;
                }
                .boss-modal-tags span {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    background: rgba(255,255,255,0.03);
                    padding: 3px 8px;
                    border-radius: 5px;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    border: 1px solid var(--border-subtle);
                }
                .boss-stat-grid {
                    margin-bottom: 1rem;
                }
                .boss-warning-box {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                    padding: 0.85rem 1rem;
                    border-radius: 8px;
                    color: #facc15;
                    background: rgba(250, 204, 21, 0.08);
                    border: 1px solid rgba(250, 204, 21, 0.18);
                }
                .boss-warning-box p {
                    margin: 0 0 0.25rem;
                    color: rgba(255,255,255,0.76);
                    font-size: 0.82rem;
                }
                .upcoming-spawns-section {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    padding: 1.25rem;
                    margin-bottom: 1.5rem;
                }
                .section-title,
                .boss-loot-heading {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    color: var(--text-accent);
                    font-weight: 800;
                    font-size: 0.95rem;
                }
                .boss-loot-heading {
                    border-bottom: 1px solid var(--border-subtle);
                    padding-bottom: 0.5rem;
                    color: #fff;
                }
                .spawns-container {
                    display: flex;
                    gap: 0.75rem;
                    overflow-x: auto;
                    padding-bottom: 0.75rem;
                }
                .spawns-container::-webkit-scrollbar { height: 4px; }
                .spawns-container::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }
                .spawn-box {
                    min-width: 118px;
                    padding: 0.75rem;
                    border-radius: 6px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.01);
                    text-align: center;
                    flex-shrink: 0;
                }
                .spawn-box.active {
                    background: rgba(56,189,248,0.05);
                    border-color: rgba(56,189,248,0.2);
                }
                .spawn-day {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    margin-bottom: 0.25rem;
                    letter-spacing: 0.05em;
                }
                .spawn-time {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #fff;
                    font-family: var(--font-sans);
                }
                .spawn-end {
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    margin-top: 0.2rem;
                }
                .spawn-box.active .spawn-time { color: var(--text-accent); }
                .boss-loot-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.55rem;
                }
                .boss-loot-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    padding: 0.8rem 1rem;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
                }
                .boss-loot-row:hover {
                    transform: translateY(-1px);
                    border-color: rgba(56,189,248,0.25);
                    background: rgba(255,255,255,0.035);
                }
                .boss-loot-row:hover .loot-item-name { color: var(--text-accent); }
                .boss-loot-main {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    min-width: 0;
                }
                .boss-loot-main img {
                    width: 34px;
                    height: 34px;
                    border-radius: 6px;
                    object-fit: cover;
                    flex: 0 0 auto;
                }
                .loot-item-name {
                    font-weight: 800;
                    color: #fff;
                    font-size: 0.9rem;
                    transition: color 0.2s ease;
                    overflow-wrap: anywhere;
                }
                .loot-item-name span {
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .boss-drop-rate {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.45rem;
                    margin-top: 0.25rem;
                    font-size: 0.74rem;
                    color: var(--text-accent);
                }
                .boss-drop-rate span {
                    color: var(--text-muted);
                }
                .boss-loot-value {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.25rem;
                    min-width: 9rem;
                    text-align: right;
                }
                .boss-loot-value strong {
                    color: var(--text-success);
                    font-size: 0.9rem;
                }
                .boss-loot-value span {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: var(--text-muted);
                    font-size: 0.7rem;
                }
                @keyframes boss-rise {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 900px) {
                    .boss-radar {
                        grid-template-columns: 1fr;
                    }
                    .boss-routine-header {
                        grid-template-columns: 1fr;
                    }
                    .boss-routine-controls {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .routine-boss-picker {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                    .boss-radar-stats {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                    .boss-controls {
                        grid-template-columns: 1fr;
                    }
                    .boss-mf-control,
                    .boss-search-control {
                        min-width: 0;
                    }
                }
                @media (max-width: 620px) {
                    .bosses-page {
                        max-width: 100%;
                        width: 100%;
                    }
                    .boss-radar,
                    .boss-routine-planner {
                        padding: 1rem;
                    }
                    .boss-radar-stats,
                    .boss-routine-summary,
                    .boss-routine-controls {
                        grid-template-columns: 1fr;
                    }
                    .routine-boss-picker {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .routine-boss-picker button {
                        min-width: 0;
                    }
                    .routine-leg {
                        grid-template-columns: 1.6rem minmax(0, 1fr);
                    }
                    .routine-leg-marker span {
                        width: 1.45rem;
                        height: 1.45rem;
                    }
                    .routine-leg-title {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 0.25rem;
                    }
                    .boss-modal {
                        max-width: calc(100vw - 1rem);
                    }
                    .boss-modal-title {
                        align-items: flex-start;
                    }
                    .boss-modal-tags {
                        gap: 0.35rem;
                    }
                    .boss-loot-row {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                    .boss-mobile-card {
                        width: 100%;
                        max-width: 100%;
                        min-width: 0;
                    }
                    .boss-mobile-card .m-card-header {
                        gap: 0.75rem;
                        min-width: 0;
                    }
                    .boss-mobile-card .m-card-title,
                    .boss-mobile-name {
                        min-width: 0;
                    }
                    .boss-mobile-card .m-name,
                    .boss-mobile-card .m-lvl {
                        overflow-wrap: anywhere;
                    }
                    .bosses-page .mobile-card-grid {
                        padding-left: 0;
                        padding-right: 0;
                    }
                    .boss-loot-value {
                        width: 100%;
                        min-width: 0;
                        align-items: flex-start;
                        text-align: left;
                    }
                }
                @media (max-width: 430px) {
                    .routine-boss-picker {
                        grid-template-columns: 1fr;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .boss-radar,
                    .boss-routine-planner,
                    .routine-boss-picker button,
                    .boss-loot-row {
                        animation: none;
                        transition: none;
                    }
                    .routine-boss-picker button:hover,
                    .boss-loot-row:hover {
                        transform: none;
                    }
                }
            `}</style>
        </main>
    );
}

export default function BossesPage() {
    return (
        <Suspense fallback={<div>Loading Bosses...</div>}>
            <BossesContent />
        </Suspense>
    );
}
