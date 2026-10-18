"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AriaAttributes, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useItemModal } from "@/context/ItemModalContext";
import { formatCountdown } from "@/lib/format";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import {
    getItemEffectBonus,
    getProfileBarteringBoost,
    getProfileEquippedSpecialItem,
    type ProfileItemRecord,
} from "@/lib/profile-calculations";
import { useData } from "@/context/DataContext";
import type { LoreNameInput } from "@/lib/lore-links";
import { useModalA11y } from "@/lib/use-modal-a11y";
import type { TravelMode } from "@/lib/world-boss-routing";
import {
    BASE_MOVEMENT_SPEED,
    DEFAULT_RELEVANT_TELEPORT_LEVEL,
    DEFAULT_MOVEMENT_SPEED,
    MAX_RELEVANT_TELEPORT_LEVEL,
    buildWorldBossRoutinePlan,
    getRoutineBossKey,
} from "@/lib/world-boss-routing";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
    WORLD_BOSS_ROUTINE_STORAGE_KEY,
    WORLD_BOSS_ITEM_MODIFIER_STORAGE_KEY,
    clampNumber,
    getBossKey,
    getBossWindow,
    applyMagicFindToDrops,
    getValueBreakdown,
    getLiquiditySignal,
    getBossMarketNote,
    isRareMarketDrop,
    getConfirmedWorldBossItemModifiers,
    isFiniteDate,
    generateTimetable,
    type BossPhase,
    type BossView,
    type ValuedBossRow,
} from "../types";

export function useBossState() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { marketData, staticData, allItemsDb } = useData();
    const { preferences, setPreferences } = usePreferences();
    const { activeProfile, updateProfile } = useProfiles();
    const { openItemByName, prefetchItem } = useItemModal();

    const [selectedBoss, setSelectedBoss] = useState<ValuedBossRow | null>(null);
    const [sortCol, setSortCol] = useState<string>("nextSpawnTime");
    const [sortDesc, setSortDesc] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPhase, setSelectedPhase] = useState<BossPhase | "all">("all");
    const [activeBossView, setActiveBossView] = useState<BossView>("details");
    const [now, setNow] = useState(() => Date.now());

    // Routine Planner state
    const [routineBossKeys, setRoutineBossKeys] = useState<string[]>([]);
    const [routineInitialized, setRoutineInitialized] = useState(false);
    const [routineSettingsLoaded, setRoutineSettingsLoaded] = useState(false);
    const [routineStartLocation, setRoutineStartLocation] = useState("The Citadel");
    const [routineTeleportLevel, setRoutineTeleportLevel] = useState<number | "">(DEFAULT_RELEVANT_TELEPORT_LEVEL);
    const [routineMovementSpeed, setRoutineMovementSpeed] = useState<number | "">(DEFAULT_MOVEMENT_SPEED);
    const [routineClassDiscount, setRoutineClassDiscount] = useState(false);
    const [routineTravelMode, setRoutineTravelMode] = useState<TravelMode>("teleport");
    const [routineLocationOpen, setRoutineLocationOpen] = useState(false);
    const [routineLocationPlacement, setRoutineLocationPlacement] = useState<"down" | "up">("down");

    // World boss item modifier and magic find
    const [worldBossItemModifierName, setWorldBossItemModifierName] = useState("");
    const [worldBossMagicFindDraft, setWorldBossMagicFindDraft] = useState("");
    const [worldBossMagicFindEditing, setWorldBossMagicFindEditing] = useState(false);

    const routineLocationRef = useRef<HTMLDivElement | null>(null);
    const routineLocationTriggerRef = useRef<HTMLButtonElement | null>(null);
    const routineLocationOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const profileDefaultsAppliedRef = useRef<string | null>(null);

    const activeProfileId = activeProfile?.id || null;
    const routineStorageKey = useMemo(
        () => getProfileStorageKey(WORLD_BOSS_ROUTINE_STORAGE_KEY, activeProfile?.id),
        [activeProfile?.id],
    );
    const worldBossItemStorageKey = useMemo(
        () => getProfileStorageKey(WORLD_BOSS_ITEM_MODIFIER_STORAGE_KEY, activeProfile?.id),
        [activeProfile?.id],
    );

    // Live 1-second timer tick
    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, []);

    // Load routine planner profile settings
    useEffect(() => {
        setRoutineSettingsLoaded(false);
        try {
            const stored = localStorage.getItem(routineStorageKey) ?? (activeProfileId ? null : localStorage.getItem(WORLD_BOSS_ROUTINE_STORAGE_KEY));
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
                    setRoutineTeleportLevel(clampNumber(Number(saved.routineTeleportLevel), 0, MAX_RELEVANT_TELEPORT_LEVEL));
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
            } else {
                setRoutineBossKeys([]);
                setRoutineInitialized(false);
                setRoutineStartLocation("The Citadel");
                setRoutineTeleportLevel(DEFAULT_RELEVANT_TELEPORT_LEVEL);
                setRoutineMovementSpeed(DEFAULT_MOVEMENT_SPEED);
                setRoutineClassDiscount(false);
                setRoutineTravelMode("teleport");
            }
        } catch {
            // Ignore malformed local planner settings and fall back to defaults.
            setRoutineBossKeys([]);
            setRoutineInitialized(false);
            setRoutineStartLocation("The Citadel");
            setRoutineTeleportLevel(DEFAULT_RELEVANT_TELEPORT_LEVEL);
            setRoutineMovementSpeed(DEFAULT_MOVEMENT_SPEED);
            setRoutineClassDiscount(false);
            setRoutineTravelMode("teleport");
        } finally {
            setRoutineSettingsLoaded(true);
        }
    }, [activeProfileId, routineStorageKey]);

    // Save routine planner settings
    useEffect(() => {
        if (!routineSettingsLoaded) return;
        try {
            localStorage.setItem(routineStorageKey, JSON.stringify({
                routineBossKeys,
                routineStartLocation,
                routineTeleportLevel,
                routineMovementSpeed,
                routineClassDiscount,
                routineTravelMode,
            }));
        } catch {
            // Ignore storage write errors (e.g. quota exceeded, incognito restrictions)
        }
    }, [
        routineBossKeys,
        routineClassDiscount,
        routineMovementSpeed,
        routineStorageKey,
        routineSettingsLoaded,
        routineStartLocation,
        routineTeleportLevel,
        routineTravelMode,
    ]);

    // Load item modifier profile setting
    useEffect(() => {
        try {
            const stored = localStorage.getItem(worldBossItemStorageKey) ?? (activeProfileId ? null : localStorage.getItem(WORLD_BOSS_ITEM_MODIFIER_STORAGE_KEY));
            setWorldBossItemModifierName(typeof stored === "string" ? stored : "");
        } catch {
            setWorldBossItemModifierName("");
        }
    }, [activeProfileId, worldBossItemStorageKey]);

    // Save item modifier
    useEffect(() => {
        try {
            localStorage.setItem(worldBossItemStorageKey, worldBossItemModifierName);
        } catch {
            // Ignore storage write errors
        }
    }, [worldBossItemModifierName, worldBossItemStorageKey]);

    // URL search param sync
    useEffect(() => {
        const searchParam = searchParams.get("search");
        if (searchParam) setSearchTerm(searchParam);
    }, [searchParams]);

    // Escape key modal/picker dismissal
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

    // Pointer-down outside routine location picker
    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!routineLocationRef.current?.contains(event.target as Node)) {
                setRoutineLocationOpen(false);
            }
        };
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    // Routine location placement calculation (up/down)
    useEffect(() => {
        if (!routineLocationOpen) return;
        const updatePlacement = () => {
            const triggerRect = routineLocationTriggerRef.current?.getBoundingClientRect();
            if (!triggerRect) return;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const spaceAbove = triggerRect.top;
            setRoutineLocationPlacement(spaceBelow < 300 && spaceAbove > spaceBelow ? "up" : "down");
        };
        updatePlacement();
        window.addEventListener("resize", updatePlacement);
        window.addEventListener("scroll", updatePlacement, true);
        return () => {
            window.removeEventListener("resize", updatePlacement);
            window.removeEventListener("scroll", updatePlacement, true);
        };
    }, [routineLocationOpen]);

    // Apply profile default movement speed
    useEffect(() => {
        if (!routineSettingsLoaded || !activeProfile || profileDefaultsAppliedRef.current === activeProfile.id) return;
        if (activeProfile.secondaryStats.movementSpeed !== "" && Number(routineMovementSpeed) === DEFAULT_MOVEMENT_SPEED) {
            setRoutineMovementSpeed(clampNumber(Number(activeProfile.secondaryStats.movementSpeed), 0.1, 500));
        }
        profileDefaultsAppliedRef.current = activeProfile.id;
    }, [activeProfile, routineMovementSpeed, routineSettingsLoaded]);

    const profileWorldBossMagicFindInput = activeProfile
        ? activeProfile.magicFind.worldBoss
        : preferences.worldBossMagicFind;
    const displayedWorldBossMagicFind = worldBossMagicFindEditing
        ? worldBossMagicFindDraft
        : profileWorldBossMagicFindInput;

    useEffect(() => {
        if (worldBossMagicFindEditing) return;
        setWorldBossMagicFindDraft(String(profileWorldBossMagicFindInput ?? ""));
    }, [profileWorldBossMagicFindInput, worldBossMagicFindEditing]);

    const commitWorldBossMagicFind = (value: string) => {
        const next = value === "" ? "" : clampNumber(Number(value) || 0, 0, 500);
        if (activeProfile) {
            updateProfile(activeProfile.id, { magicFind: { ...activeProfile.magicFind, worldBoss: next } });
        } else {
            setPreferences({ worldBossMagicFind: next });
        }
        setWorldBossMagicFindEditing(false);
    };

    const itemByName = useMemo(() => (allItemsDb || {}) as Record<string, ProfileItemRecord>, [allItemsDb]);
    const equippedWorldBossSpecial = useMemo(
        () => getProfileEquippedSpecialItem(activeProfile, itemByName),
        [activeProfile, itemByName],
    );
    const equippedSpecialMagicFindBonus = useMemo(
        () => getItemEffectBonus(equippedWorldBossSpecial, "world_boss", "magic_find"),
        [equippedWorldBossSpecial],
    );
    const worldBossItemOptions = useMemo(() => getConfirmedWorldBossItemModifiers(allItemsDb), [allItemsDb]);
    const selectedWorldBossItemModifier = useMemo(
        () => worldBossItemOptions.find((option) => option.name === worldBossItemModifierName) || null,
        [worldBossItemModifierName, worldBossItemOptions],
    );
    const itemMagicFindBonus = selectedWorldBossItemModifier?.magicFind || 0;
    const baseMagicFind = clampNumber(Number(displayedWorldBossMagicFind) || 0, 0, 500);
    const magicFind = clampNumber(baseMagicFind + itemMagicFindBonus + equippedSpecialMagicFindBonus, 0, 500);

    useEffect(() => {
        if (!worldBossItemModifierName || worldBossItemOptions.length === 0 || selectedWorldBossItemModifier) return;
        setWorldBossItemModifierName("");
    }, [selectedWorldBossItemModifier, worldBossItemModifierName, worldBossItemOptions]);

    const valuedBossRows = useMemo(() => {
        if (!staticData?.world_bosses || !marketData || !allItemsDb) return [];
        const valuedRows = [];
        const evOptions = {
            customPrices: preferences.customPrices,
            marketTaxMultiplier: getMarketTaxMultiplier(preferences.membership),
            barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
        };

        for (const boss of staticData.world_bosses) {
            const adjustedDrops = applyMagicFindToDrops(boss.loot || [], magicFind);

            const lootDetails = adjustedDrops.map((drop: any) => {
                const value = getValueBreakdown(drop.name, marketData, allItemsDb, evOptions);
                const expectedVal = (drop.adjustedChance / 100) * (drop.quantity || 1) * value.trueValue;
                const dbItem = allItemsDb?.[drop.name];
                const signal = getLiquiditySignal(value.source, value.volume, value.trueValue, isRareMarketDrop(drop, dbItem));

                return {
                    ...drop,
                    ...value,
                    expectedVal,
                    signal,
                    magicFindGain: drop.adjustedChance - drop.baseChance,
                };
            });
            const evPerClear = lootDetails.reduce((sum: number, drop: any) => sum + drop.expectedVal, 0);
            const marketNote = getBossMarketNote(lootDetails.map((drop: any) => drop.signal));

            const warnings = [];
            if (lootDetails.some((drop: any) => drop.signal === "THIN" || drop.signal === "NO SALES")) {
                warnings.push("Some rare loot uses thin market prices.");
            }
            if (lootDetails.some((drop: any) => drop.signal === "RARE MARKET")) {
                warnings.push("Rare pet eggs need manual market review; vendor value is only a floor.");
            }
            if (lootDetails.some((drop: any) => drop.signal === "MISSING")) {
                warnings.push("Some loot has missing value data.");
            }
            if (magicFind > 0 && lootDetails.some((drop: any) => drop.magicFindGain <= 0 && drop.baseChance > 0)) {
                warnings.push("Magic Find cap trimming reduced common drops.");
            }

            valuedRows.push({
                ...boss,
                ev: evPerClear,
                dropsCount: boss.loot?.length || 0,
                liquiditySignal: marketNote,
                warnings,
                lootDetails,
            });
        }

        return valuedRows;
    }, [
        allItemsDb,
        magicFind,
        marketData,
        activeProfile,
        preferences.customPrices,
        preferences.membership,
        staticData,
    ]);

    const calculatedRows: ValuedBossRow[] = useMemo(() => {
        return valuedBossRows.map((boss) => ({
            ...boss,
            ...getBossWindow(boss, now),
        }));
    }, [now, valuedBossRows]);

    const rows = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        let filtered = calculatedRows;

        if (selectedPhase !== "all") {
            filtered = filtered.filter((row) => row.phase === selectedPhase);
        }

        if (normalizedSearch) {
            filtered = filtered.filter((row) => (
                row.name.toLowerCase().includes(normalizedSearch) ||
                row.location?.name?.toLowerCase().includes(normalizedSearch) ||
                row.statusLabel.toLowerCase().includes(normalizedSearch) ||
                row.lootDetails?.some((drop: any) => String(drop.name || "").toLowerCase().includes(normalizedSearch))
            ));
        }

        filtered = [...filtered];
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
    }, [calculatedRows, searchTerm, selectedPhase, sortCol, sortDesc]);

    const searchIsActive = searchTerm.trim().length > 0 || selectedPhase !== "all";
    const shownBossCount = rows.length;
    const totalBossCount = calculatedRows.length;
    const detailsCountLabel = searchIsActive
        ? `${shownBossCount}/${totalBossCount} shown`
        : `${totalBossCount} tracked`;

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

    const focusRoutineLocationOption = (index: number) => {
        window.requestAnimationFrame(() => {
            routineLocationOptionRefs.current[index]?.focus();
        });
    };

    const handleRoutineLocationTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
        event.preventDefault();
        setRoutineLocationOpen(true);
        const selectedIndex = Math.max(0, routineLocations.indexOf(routineStartLocation));
        focusRoutineLocationOption(event.key === "ArrowUp" ? routineLocations.length - 1 : selectedIndex);
    };

    const handleRoutineLocationOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setRoutineLocationOpen(false);
            routineLocationTriggerRef.current?.focus();
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            focusRoutineLocationOption((index + 1) % routineLocations.length);
            return;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            focusRoutineLocationOption((index - 1 + routineLocations.length) % routineLocations.length);
            return;
        }
        if (event.key === "Home") {
            event.preventDefault();
            focusRoutineLocationOption(0);
            return;
        }
        if (event.key === "End") {
            event.preventDefault();
            focusRoutineLocationOption(routineLocations.length - 1);
        }
    };

    const routinePlan = useMemo(() => buildWorldBossRoutinePlan(routineRows, {
        startLocation: routineStartLocation,
        selectedBossKeys: routineBossKeys,
        relevantTeleportLevel: routineTeleportLevel === ""
            ? DEFAULT_RELEVANT_TELEPORT_LEVEL
            : clampNumber(Number(routineTeleportLevel) || 0, 0, MAX_RELEVANT_TELEPORT_LEVEL),
        movementSpeed: routineMovementSpeed === ""
            ? BASE_MOVEMENT_SPEED
            : clampNumber(Number(routineMovementSpeed) || BASE_MOVEMENT_SPEED, 0.1, 500),
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
                setActiveBossView("details");
                autoOpenedRef.current = bossParam;
            }
        } else {
            autoOpenedRef.current = null;
        }
    }, [rows, searchParams]);

    const selectedBossData = useMemo(() => {
        if (!selectedBoss) return null;
        const key = getBossKey(selectedBoss);
        return calculatedRows.find((row) => getBossKey(row) === key) || selectedBoss;
    }, [calculatedRows, selectedBoss]);

    const bossDialogRef = useModalA11y<HTMLDivElement>(Boolean(selectedBossData), () => setSelectedBoss(null));

    const selectedBossLoreNames = useMemo<LoreNameInput[]>(() => {
        if (!selectedBossData) return [];
        return [
            { name: selectedBossData.name, source: "entity" },
            { name: selectedBossData.location?.name, source: "location" },
            ...(selectedBossData.lootDetails || []).map((drop: any) => ({ name: drop.name, source: "drop" as const })),
        ];
    }, [selectedBossData]);

    const activeCount = calculatedRows.filter((row) => row.phase === "active" || row.phase === "ready").length;
    const nextBoss = useMemo(() => {
        const withValidSpawn = calculatedRows.filter((row) => isFiniteDate(row.nextSpawnTime));
        const upcomingOrActive = withValidSpawn.filter((row) => {
            const end = row.battleEndTime?.getTime() ?? 0;
            const start = row.nextSpawnTime?.getTime() ?? 0;
            return end > now || start >= now;
        });
        const pool = upcomingOrActive.length > 0 ? upcomingOrActive : withValidSpawn;
        return [...pool].sort((a, b) => (a.nextSpawnTime?.getTime() || 0) - (b.nextSpawnTime?.getTime() || 0))[0] || null;
    }, [calculatedRows, now]);

    const headerStatusText = searchIsActive
        ? `${shownBossCount}/${totalBossCount} SHOWN`
        : activeCount > 0
            ? `${activeCount} ACTIVE / READY`
            : nextBoss
                ? `NEXT ${formatCountdown(nextBoss.nextSpawnTime, now)}`
                : `${totalBossCount} BOSSES LOADED`;

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

    const openBoss = (row: ValuedBossRow) => setSelectedBoss(row);

    const handleKeyboardOpen = (event: ReactKeyboardEvent<HTMLElement>, row: ValuedBossRow) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openBoss(row);
        }
    };

    const getSortDirection = (col: string): AriaAttributes["aria-sort"] => {
        if (sortCol !== col) return "none";
        return sortDesc ? "descending" : "ascending";
    };

    return {
        // Data & context
        marketData,
        staticData,
        allItemsDb,
        activeProfile,
        preferences,
        openItemByName,
        prefetchItem,

        // Time
        now,

        // Views, filters & sorting
        activeBossView,
        setActiveBossView,
        searchTerm,
        setSearchTerm,
        selectedPhase,
        setSelectedPhase,
        sortCol,
        setSortCol,
        sortDesc,
        setSortDesc,
        handleSort,
        getSortDirection,

        // Rows and counts
        calculatedRows,
        rows,
        searchIsActive,
        shownBossCount,
        totalBossCount,
        detailsCountLabel,
        activeCount,
        nextBoss,
        headerStatusText,

        // Selection & modal
        selectedBoss,
        setSelectedBoss,
        selectedBossData,
        bossDialogRef,
        selectedBossLoreNames,
        openBoss,
        handleKeyboardOpen,
        openLoreThread,
        generateTimetable,

        // Magic Find & item modifiers
        profileWorldBossMagicFindInput,
        displayedWorldBossMagicFind,
        worldBossMagicFindEditing,
        worldBossMagicFindDraft,
        setWorldBossMagicFindEditing,
        setWorldBossMagicFindDraft,
        commitWorldBossMagicFind,
        worldBossItemOptions,
        worldBossItemModifierName,
        setWorldBossItemModifierName,
        selectedWorldBossItemModifier,
        baseMagicFind,
        itemMagicFindBonus,
        equippedSpecialMagicFindBonus,
        equippedWorldBossSpecial,
        magicFind,

        // Routine Planner
        routineRows,
        routinePickerRows,
        routineLocations,
        routineBossKeys,
        setRoutineBossKeys,
        toggleRoutineBoss,
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
    };
}

export type BossState = ReturnType<typeof useBossState>;
