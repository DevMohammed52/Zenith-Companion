"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Swords, X, ChevronDown, ChevronUp, Search, MapPin, Shield, Heart, ExternalLink, Clock, Utensils, Calculator, Target } from "lucide-react";
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePreferences } from "@/lib/preferences";
import { useItemModal } from "@/context/ItemModalContext";
import { useData } from "@/context/DataContext";
import MobileSortControls from "@/components/MobileSortControls";
import ZenithIcon from "@/components/icons/ZenithIcon";
import LoreThreadPanel from "@/components/LoreThreadPanel";
import { getLoreHintsForNames } from "@/lib/lore-links";
import { getItemTrueValue } from "@/lib/ev-logic";
import { getSafeMarketValue } from "@/lib/market-pricing";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { useModalA11y } from "@/lib/use-modal-a11y";

const COMBAT_CONTROLS_STORAGE_KEY = "zenith_combat_controls_v1";
const COMBAT_SESSION_STORAGE_KEY = "zenith_combat_session_v1";
const DEFAULT_KILLS_PER_HOUR = 360;

type CombatView = "ev" | "session";

type EnemySessionEntry = {
    found: number | "";
    killed: number | "";
    timePerEnemy: number | "";
};

type CombatSessionState = {
    location: string;
    huntHours: number | "";
    huntMinutes: number | "";
    overheadMinutes: number | "";
    scaleLevel: number | "";
    magicFind: number | "";
    foodName: string;
    foodUsed: number | "";
    extraCosts: number | "";
    actualDropValue: number | "";
    enemies: Record<string, EnemySessionEntry>;
};

const DEFAULT_COMBAT_SESSION: CombatSessionState = {
    location: "",
    huntHours: "",
    huntMinutes: "",
    overheadMinutes: "",
    scaleLevel: "",
    magicFind: "",
    foodName: "",
    foodUsed: "",
    extraCosts: "",
    actualDropValue: "",
    enemies: {},
};

function safeNumber(value: number | "") {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatGold(value: number, digits = 0) {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: digits })}g`;
}

function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
}

function cleanSessionInput(input: unknown): CombatSessionState {
    if (!input || typeof input !== "object") return DEFAULT_COMBAT_SESSION;
    const raw = input as Partial<CombatSessionState>;
    return {
        ...DEFAULT_COMBAT_SESSION,
        ...raw,
        foodName: typeof raw.foodName === "string" ? raw.foodName : "",
        location: typeof raw.location === "string" ? raw.location : "",
        enemies: raw.enemies && typeof raw.enemies === "object" ? raw.enemies : {},
    };
}

function CombatContent() {
    const router = useRouter();
    const { openItemByName } = useItemModal();
    const searchParams = useSearchParams();
    const { staticData, marketData, allItemsDb } = useData();
    const { preferences } = usePreferences();
    const { activeProfile } = useProfiles();
    const activeProfileId = activeProfile?.id || null;
    const combatControlsStorageKey = useMemo(
        () => getProfileStorageKey(COMBAT_CONTROLS_STORAGE_KEY, activeProfile?.id),
        [activeProfile?.id],
    );
    const combatSessionStorageKey = useMemo(
        () => getProfileStorageKey(COMBAT_SESSION_STORAGE_KEY, activeProfile?.id),
        [activeProfile?.id],
    );
    const [activeView, setActiveView] = useState<CombatView>("ev");
    const [selectedEnemy, setSelectedEnemy] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("ev");
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [killsPerHour, setKillsPerHour] = useState<number | "">(DEFAULT_KILLS_PER_HOUR);
    const [session, setSession] = useState<CombatSessionState>(DEFAULT_COMBAT_SESSION);
    const [sessionHydratedKey, setSessionHydratedKey] = useState("");
    const selectedEnemyDialogRef = useModalA11y<HTMLDivElement>(Boolean(selectedEnemy), () => setSelectedEnemy(null));

    useEffect(() => {
        try {
            const stored = localStorage.getItem(combatControlsStorageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                setKillsPerHour(parsed.killsPerHour === "" ? "" : Math.max(0, Number(parsed.killsPerHour) || 0));
                return;
            }
        } catch {}
        setKillsPerHour(activeProfileId ? DEFAULT_KILLS_PER_HOUR : (preferences.killsPerHour || DEFAULT_KILLS_PER_HOUR));
    }, [activeProfileId, combatControlsStorageKey, preferences.killsPerHour]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            localStorage.setItem(combatControlsStorageKey, JSON.stringify({ killsPerHour }));
        }, 200);
        return () => window.clearTimeout(timeout);
    }, [combatControlsStorageKey, killsPerHour]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(combatSessionStorageKey);
            setSession(stored ? cleanSessionInput(JSON.parse(stored)) : DEFAULT_COMBAT_SESSION);
        } catch {
            setSession(DEFAULT_COMBAT_SESSION);
        }
        setSessionHydratedKey(combatSessionStorageKey);
    }, [combatSessionStorageKey]);

    useEffect(() => {
        if (sessionHydratedKey !== combatSessionStorageKey) return;
        const timeout = window.setTimeout(() => {
            localStorage.setItem(combatSessionStorageKey, JSON.stringify(session));
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [combatSessionStorageKey, session, sessionHydratedKey]);

    useEffect(() => {
        const search = searchParams.get("search");
        if (search) setSearchTerm(search);
    }, [searchParams]);

    // Keyboard support for Esc
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedEnemy(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 150);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    const combatRows = useMemo(() => {
        if (!staticData || !marketData || !allItemsDb) return [];
        const calculated = [];
        const parsedKph = Number(killsPerHour) || 0;
        const evOptions = {
            customPrices: preferences.customPrices,
            marketTaxMultiplier: preferences.membership ? 0.88 : 0.85,
            barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
        };

        for (const enemy of staticData.enemies) {
            const chanceOfLoot = (enemy.chance_of_loot || 0) / 100;
            let evPerKill = 0;

            if (enemy.loot) {
                for (const drop of enemy.loot) {
                    const trueValue = getItemTrueValue(drop.name, marketData, allItemsDb, 0, evOptions);
                    const dropChance = (drop.chance || 0) / 100;
                    evPerKill += dropChance * (drop.quantity || 1) * trueValue;
                }
            }
            
            const finalEv = evPerKill * chanceOfLoot;

            calculated.push({
                ...enemy,
                ev: finalEv,
                profitPerHour: finalEv * parsedKph,
                dropsCount: enemy.loot?.length || 0,
                lootDetails: enemy.loot?.map((drop: any) => {
                    const price = getSafeMarketValue(marketData[drop.name]);
                    const trueValue = getItemTrueValue(drop.name, marketData, allItemsDb, 0, evOptions);
                    const dropChance = (drop.chance || 0) / 100;
                    const expectedVal = dropChance * (drop.quantity || 1) * trueValue * chanceOfLoot;
                    return { ...drop, price, trueValue, expectedVal };
                }) || []
            });
        }

        return calculated;
    }, [
        staticData,
        marketData,
        allItemsDb,
        activeProfile,
        preferences.customPrices,
        preferences.membership,
        killsPerHour,
    ]);

    const areaSummaries = useMemo(() => {
        const grouped = new Map<string, any[]>();

        for (const row of combatRows) {
            const area = row.location?.name || "Unknown";
            const existing = grouped.get(area) || [];
            existing.push(row);
            grouped.set(area, existing);
        }

        return Array.from(grouped.entries())
            .map(([area, enemies]) => {
                const totalGoldPerHour = enemies.reduce((sum, enemy) => sum + enemy.profitPerHour, 0);
                const totalEv = enemies.reduce((sum, enemy) => sum + enemy.ev, 0);
                const avgGoldPerHour = totalGoldPerHour / enemies.length;
                const avgEv = totalEv / enemies.length;
                const levels = enemies.map(enemy => Number(enemy.level) || 0).filter(Boolean);
                const bestEnemy = [...enemies].sort((a, b) => b.profitPerHour - a.profitPerHour)[0];

                return {
                    area,
                    enemies,
                    enemyCount: enemies.length,
                    totalGoldPerHour,
                    avgGoldPerHour,
                    avgEv,
                    minLevel: levels.length ? Math.min(...levels) : 0,
                    maxLevel: levels.length ? Math.max(...levels) : 0,
                    bestEnemy,
                };
            })
            .sort((a, b) => {
                if (a.minLevel !== b.minLevel) return a.minLevel - b.minLevel;
                if (a.maxLevel !== b.maxLevel) return a.maxLevel - b.maxLevel;
                return a.area.localeCompare(b.area);
            });
    }, [combatRows]);

    const selectedAreaSummary = useMemo(() => {
        if (!selectedArea) return null;
        return areaSummaries.find(summary => summary.area === selectedArea) || null;
    }, [areaSummaries, selectedArea]);

    const sessionEnemies = useMemo(() => {
        const location = session.location || selectedArea || areaSummaries[0]?.area || "";
        return combatRows.filter((enemy) => (enemy.location?.name || "Unknown") === location);
    }, [areaSummaries, combatRows, selectedArea, session.location]);

    const sessionLocation = session.location || selectedArea || areaSummaries[0]?.area || "";

    const itemNameLookup = useMemo(() => {
        const lookup = new Map<string, string>();
        for (const source of [allItemsDb, marketData]) {
            for (const name of Object.keys(source || {})) lookup.set(name.toLowerCase(), name);
        }
        return lookup;
    }, [allItemsDb, marketData]);

    const sessionFoodPrice = useMemo(() => {
        const name = session.foodName.trim();
        if (!name || !marketData || !allItemsDb) return 0;
        const canonicalName = itemNameLookup.get(name.toLowerCase()) || name;
        return getItemTrueValue(canonicalName, marketData, allItemsDb, 0, {
            customPrices: preferences.customPrices,
            marketTaxMultiplier: preferences.membership ? 0.88 : 0.85,
            barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
        });
    }, [
        activeProfile,
        allItemsDb,
        itemNameLookup,
        marketData,
        preferences.customPrices,
        preferences.membership,
        session.foodName,
    ]);

    const sessionSummary = useMemo(() => {
        const huntSeconds = safeNumber(session.huntHours) * 3600 + safeNumber(session.huntMinutes) * 60;
        const overheadSeconds = safeNumber(session.overheadMinutes) * 60;
        const battleSeconds = sessionEnemies.reduce((sum, enemy) => {
            const entry = session.enemies[enemy.name];
            return sum + safeNumber(entry?.killed || "") * safeNumber(entry?.timePerEnemy || "");
        }, 0);
        const expectedGross = sessionEnemies.reduce((sum, enemy) => {
            const entry = session.enemies[enemy.name];
            return sum + safeNumber(entry?.killed || "") * Number(enemy.ev || 0);
        }, 0);
        const killedTotal = sessionEnemies.reduce((sum, enemy) => sum + safeNumber(session.enemies[enemy.name]?.killed || ""), 0);
        const foundTotal = sessionEnemies.reduce((sum, enemy) => sum + safeNumber(session.enemies[enemy.name]?.found || ""), 0);
        const foodCost = safeNumber(session.foodUsed) * sessionFoodPrice;
        const extraCosts = safeNumber(session.extraCosts);
        const actualGross = safeNumber(session.actualDropValue);
        const expectedNet = expectedGross - foodCost - extraCosts;
        const actualNet = actualGross ? actualGross - foodCost - extraCosts : 0;
        const totalSeconds = huntSeconds + battleSeconds + overheadSeconds;
        const hourlyDivisor = totalSeconds > 0 ? totalSeconds / 3600 : 0;

        return {
            huntSeconds,
            battleSeconds,
            overheadSeconds,
            totalSeconds,
            expectedGross,
            expectedNet,
            actualGross,
            actualNet,
            foodCost,
            extraCosts,
            killedTotal,
            foundTotal,
            expectedPerHour: hourlyDivisor ? expectedNet / hourlyDivisor : 0,
            actualPerHour: hourlyDivisor && actualGross ? actualNet / hourlyDivisor : 0,
        };
    }, [session, sessionEnemies, sessionFoodPrice]);

    useEffect(() => {
        if (selectedArea && areaSummaries.length && !areaSummaries.some(summary => summary.area === selectedArea)) {
            setSelectedArea(null);
        }
    }, [areaSummaries, selectedArea]);

    const rows = useMemo(() => {
        const areaFiltered = selectedArea
            ? combatRows.filter(e => (e.location?.name || "Unknown") === selectedArea)
            : [...combatRows];

        // Search Filter
        const q = debouncedSearch.toLowerCase();
        const filtered = q
            ? areaFiltered.filter(e => e.name.toLowerCase().includes(q) || (e.location?.name || '').toLowerCase().includes(q))
            : areaFiltered;

        // Sort
        filtered.sort((a, b) => {
            if (!sortCol) return b.ev - a.ev;
            
            let valA: any = a[sortCol];
            let valB: any = b[sortCol];
            
            if (sortCol === "location") {
                valA = a.location?.name || "";
                valB = b.location?.name || "";
            }

            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB || '').toLowerCase();
                return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
            }
            
            valA = valA || 0;
            valB = valB || 0;
            return sortDesc ? valB - valA : valA - valB;
        });

        return filtered;
    }, [combatRows, selectedArea, sortCol, sortDesc, debouncedSearch]);
    const resultCountText = `${rows.length} ${rows.length === 1 ? "enemy" : "enemies"} shown${selectedArea ? ` in ${selectedArea}` : " across all zones"}${debouncedSearch ? ` for "${debouncedSearch}"` : ""}`;

    const autoOpenedRef = useRef<string | null>(null);

    useEffect(() => {
        if (rows.length === 0) return;
        const search = searchParams.get("search");
        if (search) {
            if (search === autoOpenedRef.current) return; // Already handled this search param
            
            const found = rows.find(r => r.name.toLowerCase() === search.toLowerCase());
            if (found) {
                setSelectedEnemy(found);
                autoOpenedRef.current = search;
            }
        } else {
            autoOpenedRef.current = null;
        }
    }, [rows, searchParams]);

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDesc(!sortDesc);
        else { setSortCol(col); setSortDesc(true); }
    };

    const updateSession = (patch: Partial<CombatSessionState>) => {
        setSession((current) => ({ ...current, ...patch }));
    };

    const updateSessionNumber = (key: keyof CombatSessionState, value: string) => {
        updateSession({ [key]: value === "" ? "" : Math.max(0, Number(value) || 0) } as Partial<CombatSessionState>);
    };

    const updateEnemySession = (enemyName: string, key: keyof EnemySessionEntry, value: string) => {
        setSession((current) => ({
            ...current,
            enemies: {
                ...current.enemies,
                [enemyName]: {
                    ...(current.enemies[enemyName] || { found: "", killed: "", timePerEnemy: "" }),
                    [key]: value === "" ? "" : Math.max(0, Number(value) || 0),
                },
            },
        }));
    };

    const resetCombatSession = () => {
        setSession({
            ...DEFAULT_COMBAT_SESSION,
            location: sessionLocation,
        });
    };

    const selectedEnemyLore = useMemo(() => {
        if (!selectedEnemy) return [];
        return getLoreHintsForNames([
            { name: selectedEnemy.name, source: "entity" },
            { name: selectedEnemy.location?.name, source: "location" },
            ...(selectedEnemy.lootDetails || []).map((drop: any) => ({ name: drop.name, source: "drop" as const })),
        ], 5);
    }, [selectedEnemy]);

    const openLoreThread = (entryId: string) => {
        setSelectedEnemy(null);
        router.push(`/lore?thread=${entryId}`);
    };

    const renderSortIcon = (col: string) => {
        if (sortCol !== col) return null;
        return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    return (
        <main className="container combat-page">
            <div className="header">
                <h1 className="header-title">
                    <ZenithIcon name="combat" size={24} style={{ color: "var(--text-accent)" }} /> ZENITH COMBAT
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">
                        {staticData ? `${staticData.enemies.length} ENEMIES LOADED` : "INITIALIZING..."}
                    </span>
                </div>
            </div>

            <section className="combat-dev-notice" role="status" aria-label="Combat feature status">
                <span className="combat-dev-pill mono">Feature in Development</span>
                <div>
                    <strong>Combat planning is still being calibrated.</strong>
                    <p>Current values use loot EV from enemy drops and manual kills/hour. Full hit chance, damage, food, and time-to-kill modeling are not final yet.</p>
                </div>
            </section>

            <div className="combat-view-tabs" role="tablist" aria-label="Combat views">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeView === "ev"}
                    className={activeView === "ev" ? "active" : ""}
                    onClick={() => setActiveView("ev")}
                >
                    Enemy EV
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeView === "session"}
                    className={activeView === "session" ? "active" : ""}
                    onClick={() => setActiveView("session")}
                >
                    Combat Session
                </button>
            </div>

            {activeView === "ev" && (
                <>
            <div className="controls">
                <div className="control-group">
                    <label className="control-label">Kills Per Hour</label>
                    <input 
                        aria-label="Kills per hour"
                        type="number" 
                        className="control-input"
                        value={killsPerHour}
                        onChange={(e) => {
                            const val = e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0);
                            setKillsPerHour(val);
                        }}
                    />
                    <span className="control-helper">
                        {activeProfile ? `Saved for ${activeProfile.name || "active profile"}` : "Saved as no-profile fallback"}
                    </span>
                </div>
                <div className="control-group" style={{ flex: 1 }}>
                    <label className="control-label">Search</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                        <input 
                            aria-label="Search enemies or locations"
                            type="text" 
                            className="control-input"
                            placeholder="Search enemy or location..."
                            style={{ width: '100%', paddingLeft: '2rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="combat-result-count" aria-live="polite">{resultCountText}</span>
                </div>
            </div>

            <section className="combat-zone-panel" aria-label="Zone and enemy browser">
                <div className="zone-picker-panel">
                    <div className="zone-panel-header">
                        <div>
                            <h2>
                                <MapPin size={18} color="var(--text-accent)" /> Zones
                            </h2>
                            <p>Location-scoped enemy list.</p>
                        </div>
                        <span className="zone-count-pill mono">{areaSummaries.length} zones</span>
                    </div>

                    <div className="zone-button-list" aria-label="Combat zones">
                        <button
                            type="button"
                            className={`zone-select-button ${!selectedArea ? "selected" : ""}`}
                            onClick={() => setSelectedArea(null)}
                            aria-pressed={!selectedArea}
                        >
                            <span>
                                <strong>All zones</strong>
                                <small>{combatRows.length} enemies</small>
                            </span>
                            <em className="mono">All</em>
                        </button>
                        {areaSummaries.map((summary) => (
                            <button
                                key={summary.area}
                                type="button"
                                className={`zone-select-button ${selectedArea === summary.area ? "selected" : ""}`}
                                onClick={() => setSelectedArea(summary.area)}
                                aria-pressed={selectedArea === summary.area}
                            >
                                <span>
                                    <strong>{summary.area}</strong>
                                    <small>{summary.enemyCount} enemies - L{summary.minLevel}-{summary.maxLevel}</small>
                                </span>
                                <em className="mono">{summary.avgGoldPerHour.toLocaleString(undefined, { maximumFractionDigits: 0 })}/h</em>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="zone-mob-panel">
                    <div className="zone-panel-header">
                        <div>
                            <h2>
                                <Swords size={18} color="var(--text-accent)" />
                                {selectedAreaSummary ? selectedAreaSummary.area : "All Enemies"}
                            </h2>
                            <p>
                                {rows.length} shown
                                {selectedAreaSummary ? ` from ${selectedAreaSummary.enemyCount} zone enemies` : " across every zone"}
                                {debouncedSearch ? " after search" : ""}
                            </p>
                        </div>
                        {selectedAreaSummary && (
                            <button
                                type="button"
                                className="zone-clear-button"
                                onClick={() => setSelectedArea(null)}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="selected-zone-stats">
                        <span>
                            <small>Best enemy</small>
                            <strong>{(selectedAreaSummary?.bestEnemy || rows[0])?.name || "None"}</strong>
                        </span>
                        <span>
                            <small>Level range</small>
                            <strong>
                                {selectedAreaSummary
                                    ? `${selectedAreaSummary.minLevel}-${selectedAreaSummary.maxLevel}`
                                    : areaSummaries.length
                                        ? `${Math.min(...areaSummaries.map(summary => summary.minLevel))}-${Math.max(...areaSummaries.map(summary => summary.maxLevel))}`
                                        : "-"}
                            </strong>
                        </span>
                        <span>
                            <small>Avg loot/hour</small>
                            <strong className="profit-positive">
                                {(selectedAreaSummary
                                    ? selectedAreaSummary.avgGoldPerHour
                                    : rows.length
                                        ? rows.reduce((sum, row) => sum + row.profitPerHour, 0) / rows.length
                                        : 0
                                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}g
                            </strong>
                        </span>
                    </div>

                    <div className="zone-mob-list" aria-label="Enemies matching current zone and search">
                        {rows.slice(0, 6).map((row) => (
                            <button
                                key={`${row.location?.name || "Unknown"}-${row.name}`}
                                type="button"
                                className="zone-mob-button"
                                onClick={() => setSelectedEnemy(row)}
                            >
                                <span className="zone-mob-main">
                                    {row.image_url && <img src={row.image_url} alt="" />}
                                    <span>
                                        <strong>{row.name}</strong>
                                        <small>{row.location?.name || "Unknown"} - Level {row.level}</small>
                                    </span>
                                </span>
                                <span className="zone-mob-value mono">{row.profitPerHour.toLocaleString(undefined, { maximumFractionDigits: 0 })}g/h</span>
                            </button>
                        ))}
                        {rows.length === 0 && (
                            <div className="zone-empty-state">
                                No enemies match the current zone and search.
                            </div>
                        )}
                    </div>
                </div>
                </section>

            <section className="table-wrapper">
                {/* Desktop View */}
                <div className="desktop-only">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th className="sortable left-align" onClick={() => handleSort('name')}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>Enemy {renderSortIcon('name')}</div>
                                    </th>
                                    <th className="sortable left-align" onClick={() => handleSort('location')}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>Location {renderSortIcon('location')}</div>
                                    </th>
                                    <th className="sortable" onClick={() => handleSort('level')}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-end'}}>Level {renderSortIcon('level')}</div>
                                    </th>
                                    <th className="sortable" onClick={() => handleSort('dropsCount')}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-end'}}>Drops {renderSortIcon('dropsCount')}</div>
                                    </th>
                                    <th className="sortable" onClick={() => handleSort('ev')}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-end'}}>EV / Kill {renderSortIcon('ev')}</div>
                                    </th>
                                    <th className="sortable" onClick={() => handleSort('profitPerHour')}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-end'}}>Loot EV / Hr {renderSortIcon('profitPerHour')}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr
                                        aria-label={`Open ${row.name} enemy details`}
                                        key={i}
                                        className="clickable-row"
                                        onClick={() => setSelectedEnemy(row)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                setSelectedEnemy(row);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <td className="item-name left-align">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {row.image_url && <img src={row.image_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
                                                <span>{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
                                        <td className="mono">{row.level}</td>
                                        <td className="mono">{row.dropsCount}</td>
                                        <td className="mono profit-positive">
                                            ~{row.ev.toLocaleString(undefined, {maximumFractionDigits:1})}
                                        </td>
                                        <td className="mono profit-positive font-bold">
                                            {row.profitPerHour.toLocaleString(undefined, {maximumFractionDigits:0})}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="mobile-only">
                    <MobileSortControls
                        label="Sort Enemies"
                        value={sortCol || "ev"}
                        descending={sortDesc}
                        onSort={handleSort}
                        onToggleDirection={() => setSortDesc((prev) => !prev)}
                        options={[
                            { value: "profitPerHour", label: "Loot EV / Hr" },
                            { value: "ev", label: "EV / Kill" },
                            { value: "level", label: "Level" },
                            { value: "dropsCount", label: "Drops" },
                            { value: "name", label: "Name" },
                            { value: "location", label: "Location" },
                        ]}
                    />
                    <div className="mobile-card-grid">
                        {rows.map((row, i) => (
                            <div
                                aria-label={`Open ${row.name} enemy details`}
                                key={i}
                                className="mobile-alchemy-card"
                                onClick={() => setSelectedEnemy(row)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setSelectedEnemy(row);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="m-card-header">
                                    <div className="m-card-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {row.image_url && <img src={row.image_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />}
                                            <span className="m-name">{row.name}</span>
                                        </div>
                                        <span className="m-lvl">{row.location?.name || "Unknown"} - LVL {row.level}</span>
                                    </div>
                                    <div className="m-roi pos">{row.dropsCount} DROPS</div>
                                </div>
                                <div className="m-card-body">
                                    <div className="m-stat">
                                        <span className="m-label">EV / KILL</span>
                                        <span className="m-val pos">~{row.ev.toLocaleString(undefined, {maximumFractionDigits:1})}g</span>
                                    </div>
                                    <div className="m-stat">
                                        <span className="m-label">LOOT EV / HR</span>
                                        <span className="m-val pos font-bold">
                                            {row.profitPerHour.toLocaleString(undefined, {maximumFractionDigits:0})}g
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
                </>
            )}

            {activeView === "session" && (
                <section className="combat-session-panel" aria-label="Combat session planner">
                    <div className="session-hero">
                        <div>
                            <span className="combat-dev-pill mono">Manual Session</span>
                            <h2>Combat Session</h2>
                            <p>Record one hunt and battle run. Zenith handles prices, food cost, expected loot value, and combined gold per hour.</p>
                        </div>
                        <button type="button" className="zone-clear-button" onClick={resetCombatSession}>
                            Reset
                        </button>
                    </div>

                    <div className="session-location-wrap">
                        <p className="session-location-hint">Swipe locations</p>
                        <div className="session-location-strip" aria-label="Session location">
                            {areaSummaries.map((summary) => (
                                <button
                                    key={summary.area}
                                    type="button"
                                    className={sessionLocation === summary.area ? "active" : ""}
                                    onClick={() => updateSession({ location: summary.area })}
                                    aria-label={`${summary.area}, ${summary.enemyCount} enemies, levels ${summary.minLevel} to ${summary.maxLevel}`}
                                    aria-pressed={sessionLocation === summary.area}
                                >
                                    <strong>{summary.area}</strong>
                                    <span>{summary.enemyCount} enemies</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="session-summary-grid">
                        <article className="session-metric-card highlight">
                            <span><Calculator size={15} /> Expected net</span>
                            <strong className={sessionSummary.expectedNet < 0 ? "profit-negative" : "profit-positive"}>{formatGold(sessionSummary.expectedNet)}</strong>
                            <small>{formatGold(sessionSummary.expectedPerHour)}/h combined</small>
                        </article>
                        <article className="session-metric-card">
                            <span><Target size={15} /> Enemies</span>
                            <strong>{sessionSummary.killedTotal.toLocaleString()} killed</strong>
                            <small>{sessionSummary.foundTotal ? `${sessionSummary.foundTotal.toLocaleString()} found` : "Found count optional"}</small>
                        </article>
                        <article className="session-metric-card">
                            <span><Clock size={15} /> Total time</span>
                            <strong>{formatDuration(sessionSummary.totalSeconds)}</strong>
                            <small>Hunt + battle + overhead</small>
                        </article>
                        <article className="session-metric-card">
                            <span><Utensils size={15} /> Food cost</span>
                            <strong>{formatGold(sessionSummary.foodCost)}</strong>
                            <small>{sessionFoodPrice ? `${formatGold(sessionFoodPrice)} each` : "Enter exact food name"}</small>
                        </article>
                    </div>

                    <div className="session-form-grid">
                        <section className="session-card">
                            <h3>Run Setup</h3>
                            <div className="session-fields two-col">
                                <label>
                                    <span>Hunt hours</span>
                                    <input aria-label="Hunt hours" className="control-input" type="number" min="0" value={session.huntHours} onChange={(event) => updateSessionNumber("huntHours", event.target.value)} />
                                </label>
                                <label>
                                    <span>Hunt minutes</span>
                                    <input aria-label="Hunt minutes" className="control-input" type="number" min="0" value={session.huntMinutes} onChange={(event) => updateSessionNumber("huntMinutes", event.target.value)} />
                                </label>
                                <label>
                                    <span>Scale level</span>
                                    <input aria-label="Scale level" className="control-input" type="number" min="0" value={session.scaleLevel} onChange={(event) => updateSessionNumber("scaleLevel", event.target.value)} />
                                </label>
                                <label>
                                    <span>Magic Find shown</span>
                                    <input aria-label="Magic Find shown" className="control-input" type="number" min="0" value={session.magicFind} onChange={(event) => updateSessionNumber("magicFind", event.target.value)} />
                                </label>
                            </div>
                            <p className="session-note">Magic Find is saved with the run but not applied to EV yet. Current evidence says it affects the inner loot table, and the exact trimming order still needs validation.</p>
                        </section>

                        <section className="session-card">
                            <h3>Costs & Actual Drops</h3>
                            <div className="session-fields">
                                <label>
                                    <span>Food item</span>
                                    <input aria-label="Food item" className="control-input" type="text" value={session.foodName} placeholder="Cooked Lantern Fish" onChange={(event) => updateSession({ foodName: event.target.value })} />
                                </label>
                                <div className="session-fields two-col">
                                    <label>
                                        <span>Food used</span>
                                        <input aria-label="Food used" className="control-input" type="number" min="0" value={session.foodUsed} onChange={(event) => updateSessionNumber("foodUsed", event.target.value)} />
                                    </label>
                                    <label>
                                        <span>Extra costs</span>
                                        <input aria-label="Extra costs" className="control-input" type="number" min="0" value={session.extraCosts} onChange={(event) => updateSessionNumber("extraCosts", event.target.value)} />
                                    </label>
                                </div>
                                <label>
                                    <span>Actual drops value</span>
                                    <input aria-label="Actual drops value" className="control-input" type="number" min="0" value={session.actualDropValue} onChange={(event) => updateSessionNumber("actualDropValue", event.target.value)} />
                                </label>
                            </div>
                            <div className="actual-result">
                                <span>Actual net</span>
                                <strong className={sessionSummary.actualNet < 0 ? "profit-negative" : "profit-positive"}>
                                    {sessionSummary.actualGross ? `${formatGold(sessionSummary.actualNet)} (${formatGold(sessionSummary.actualPerHour)}/h)` : "Add drop value"}
                                </strong>
                            </div>
                        </section>
                    </div>

                    <section className="session-card session-enemies-card">
                        <div className="session-card-header">
                            <div>
                                <h3>{sessionLocation || "Choose a location"}</h3>
                                <p>Use the enemy stacks and preview time shown by IdleMMO. If you only know killed count, leave found blank.</p>
                            </div>
                            <span className="zone-count-pill mono">{sessionEnemies.length} enemies</span>
                        </div>
                        <div className="session-enemy-grid">
                            {sessionEnemies.map((enemy) => {
                                const entry = session.enemies[enemy.name] || { found: "", killed: "", timePerEnemy: "" };
                                const killed = safeNumber(entry.killed);
                                const expected = killed * Number(enemy.ev || 0);
                                return (
                                    <article key={`${sessionLocation}-${enemy.name}`} className="session-enemy-row">
                                        <div className="session-enemy-title">
                                            {enemy.image_url && <img src={enemy.image_url} alt="" />}
                                            <div>
                                                <strong>{enemy.name}</strong>
                                                <span>L{enemy.level} - {formatGold(enemy.ev, 1)} EV/kill</span>
                                            </div>
                                        </div>
                                        <label>
                                            <span>Found</span>
                                            <input aria-label={`${enemy.name} found`} className="control-input" type="number" min="0" value={entry.found} onChange={(event) => updateEnemySession(enemy.name, "found", event.target.value)} />
                                        </label>
                                        <label>
                                            <span>Killed</span>
                                            <input aria-label={`${enemy.name} killed`} className="control-input" type="number" min="0" value={entry.killed} onChange={(event) => updateEnemySession(enemy.name, "killed", event.target.value)} />
                                        </label>
                                        <label>
                                            <span>Sec / kill</span>
                                            <input aria-label={`${enemy.name} seconds per kill`} className="control-input" type="number" min="0" step="0.01" value={entry.timePerEnemy} onChange={(event) => updateEnemySession(enemy.name, "timePerEnemy", event.target.value)} />
                                        </label>
                                        <div className="session-row-result">
                                            <span>Expected</span>
                                            <strong>{formatGold(expected)}</strong>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section className="session-confidence">
                        <strong>What this can trust</strong>
                        <span>Loot EV, market/custom prices, food cost, and combined time math.</span>
                        <strong>What stays manual</strong>
                        <span>Damage, food use, Magic Find adjustment, weather mix, and battle preview timing.</span>
                    </section>
                </section>
            )}

            {selectedEnemy && (
                <div className="modal-overlay" onClick={() => setSelectedEnemy(null)}>
                    <div
                        aria-labelledby="combat-enemy-title"
                        aria-modal="true"
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        ref={selectedEnemyDialogRef}
                        role="dialog"
                        tabIndex={-1}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {selectedEnemy.image_url && (
                                    <div style={{ width: '48px', height: '48px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                        <img src={selectedEnemy.image_url} alt={selectedEnemy.name} style={{ maxWidth: '36px', maxHeight: '36px', margin: 'auto' }} />
                                    </div>
                                )}
                                <div>
                                    <h2 id="combat-enemy-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                        {selectedEnemy.name}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                            <MapPin size={12} color="var(--text-accent)" /> {selectedEnemy.location?.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                            <Shield size={12} color="var(--text-accent)" /> Level {selectedEnemy.level}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                            <Heart size={12} color="#f87171" /> {selectedEnemy.health} HP
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button aria-label="Close enemy details" className="close-btn" onClick={() => setSelectedEnemy(null)} type="button">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Loot Chance</div>
                                    <div className="stat-value">{selectedEnemy.chance_of_loot}%</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Experience</div>
                                    <div className="stat-value">{selectedEnemy.experience}</div>
                                </div>
                                <div className="stat-card highlight">
                                    <div className="stat-label">Loot EV Estimate</div>
                                    <div className="stat-value profit-positive">~{selectedEnemy.ev.toLocaleString(undefined, {maximumFractionDigits:1})}/kill</div>
                                </div>
                            </div>

                            <LoreThreadPanel hints={selectedEnemyLore} title="Combat Lore Thread" onOpenThread={openLoreThread} />
                            
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Loot Table</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {selectedEnemy.lootDetails?.sort((a:any, b:any) => b.expectedVal - a.expectedVal).map((drop: any, i: number) => (
                                     <div 
                                         key={i} 
                                         onClick={() => openItemByName(drop.name)}
                                         className="clickable-row group-loot"
                                         style={{ 
                                             display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                             padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', 
                                             borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                         }}
                                     >
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                             {drop.image_url && <img src={drop.image_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />}
                                             <div>
                                                <div className="loot-item-name" style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', transition: 'color 0.2s' }}>
                                                    {drop.name}
                                                    {(Number(drop.quantity) || 1) > 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}> x{drop.quantity}</span>}
                                                </div>
                                                 <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)' }}>{drop.chance}% Drop Rate</div>
                                             </div>
                                         </div>
                                         <div style={{ textAlign: 'right' }}>
                                             <div style={{ color: 'var(--text-success)', fontWeight: 600, fontSize: '0.9rem' }}>
                                                 ~{drop.expectedVal.toLocaleString(undefined, {maximumFractionDigits:2})}g <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>EV/kill</span>
                                             </div>
                                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                 Inspect Item ({(drop.trueValue || drop.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}g value) <ExternalLink size={10} />
                                             </div>
                                         </div>
                                     </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .clickable-row:hover .loot-item-name { color: var(--text-accent) !important; }
                .combat-dev-notice {
                    align-items: center;
                    background: linear-gradient(135deg, color-mix(in srgb, var(--text-accent), transparent 94%), rgba(255,255,255,0.015));
                    border: 1px solid color-mix(in srgb, var(--text-accent), transparent 78%);
                    border-radius: 8px;
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 0.9rem 1rem;
                }
                .combat-dev-notice strong {
                    color: #fff;
                    display: block;
                    font-size: 0.92rem;
                    margin-bottom: 0.2rem;
                }
                .combat-dev-notice p {
                    color: var(--text-muted);
                    font-size: 0.82rem;
                    line-height: 1.45;
                    margin: 0;
                }
                .combat-dev-pill {
                    background: color-mix(in srgb, #f6c85f, transparent 88%);
                    border: 1px solid color-mix(in srgb, #f6c85f, transparent 58%);
                    border-radius: 999px;
                    color: #f6c85f;
                    flex: 0 0 auto;
                    font-size: 0.7rem;
                    font-weight: 900;
                    letter-spacing: 0.04em;
                    padding: 0.34rem 0.72rem;
                    text-transform: uppercase;
                }
                .combat-view-tabs {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    display: inline-grid;
                    gap: 0.25rem;
                    grid-template-columns: repeat(2, minmax(9rem, 1fr));
                    margin-bottom: 1rem;
                    padding: 0.25rem;
                }
                .combat-view-tabs button {
                    background: transparent;
                    border: 0;
                    border-radius: 6px;
                    color: var(--text-muted);
                    cursor: pointer;
                    font-family: var(--font-sans);
                    font-weight: 900;
                    min-height: 2.55rem;
                    padding: 0.6rem 1rem;
                }
                .combat-view-tabs button:hover,
                .combat-view-tabs button:focus-visible {
                    color: #fff;
                    outline: 1px solid var(--border-focus);
                    outline-offset: 0;
                }
                .combat-view-tabs button.active {
                    background: color-mix(in srgb, var(--text-accent), transparent 76%);
                    color: #fff;
                }
                .combat-result-count {
                    color: var(--text-muted);
                    display: block;
                    font-size: 0.76rem;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    margin-top: 0.45rem;
                    text-transform: uppercase;
                }
                .combat-session-panel {
                    display: grid;
                    gap: 1rem;
                }
                .session-hero,
                .session-card,
                .session-confidence {
                    background: rgba(255,255,255,0.018);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                }
                .session-hero {
                    align-items: center;
                    display: flex;
                    gap: 1rem;
                    justify-content: space-between;
                    padding: 1.2rem;
                }
                .session-hero h2 {
                    color: #fff;
                    font-size: clamp(1.6rem, 3vw, 2.4rem);
                    margin: 0.5rem 0 0.3rem;
                }
                .session-hero p,
                .session-card p,
                .session-card-header p,
                .session-note {
                    color: var(--text-muted);
                    line-height: 1.45;
                    margin: 0;
                }
                .session-location-wrap {
                    position: relative;
                }
                .session-location-wrap::after {
                    background: linear-gradient(90deg, rgba(10,13,20,0), rgba(10,13,20,0.62));
                    bottom: 0.2rem;
                    content: "";
                    pointer-events: none;
                    position: absolute;
                    right: 0;
                    top: 1.4rem;
                    width: 2rem;
                }
                .session-location-hint {
                    color: var(--text-muted);
                    display: none;
                    font-size: 0.7rem;
                    font-weight: 900;
                    letter-spacing: 0.06em;
                    margin: 0 0 0.45rem;
                    text-transform: uppercase;
                }
                .session-location-strip {
                    display: grid;
                    gap: 0.6rem;
                    grid-auto-columns: minmax(12rem, 1fr);
                    grid-auto-flow: column;
                    overflow-x: auto;
                    padding-bottom: 0.2rem;
                }
                .session-location-strip button {
                    background: rgba(255,255,255,0.018);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: grid;
                    gap: 0.25rem;
                    min-height: 4rem;
                    padding: 0.75rem 0.9rem;
                    text-align: left;
                }
                .session-location-strip button:hover,
                .session-location-strip button.active {
                    background: color-mix(in srgb, var(--text-accent), transparent 94%);
                    border-color: var(--border-focus);
                    color: #fff;
                }
                .session-location-strip span {
                    font-size: 0.76rem;
                }
                .session-summary-grid {
                    display: grid;
                    gap: 0.75rem;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                }
                .session-metric-card {
                    background: rgba(255,255,255,0.018);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    min-width: 0;
                    padding: 0.95rem 1rem;
                }
                .session-metric-card.highlight {
                    border-color: color-mix(in srgb, var(--text-success), transparent 58%);
                    background: color-mix(in srgb, var(--text-success), transparent 94%);
                }
                .session-metric-card span,
                .session-row-result span,
                .actual-result span {
                    align-items: center;
                    color: var(--text-muted);
                    display: flex;
                    font-size: 0.76rem;
                    font-weight: 900;
                    gap: 0.4rem;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }
                .session-metric-card strong {
                    color: #fff;
                    display: block;
                    font-size: 1.35rem;
                    margin-top: 0.45rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .session-metric-card small {
                    color: var(--text-muted);
                    display: block;
                    margin-top: 0.25rem;
                }
                .session-form-grid {
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                }
                .session-card {
                    padding: 1rem;
                }
                .session-card h3 {
                    color: #fff;
                    font-size: 1rem;
                    margin: 0 0 0.85rem;
                }
                .session-card-header {
                    align-items: center;
                    display: flex;
                    gap: 1rem;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                .session-fields {
                    display: grid;
                    gap: 0.75rem;
                }
                .session-fields.two-col {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .session-fields label,
                .session-enemy-row label {
                    display: grid;
                    gap: 0.35rem;
                    min-width: 0;
                }
                .session-fields label span,
                .session-enemy-row label span {
                    color: var(--text-muted);
                    font-size: 0.73rem;
                    font-weight: 900;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }
                .session-note {
                    border-top: 1px solid var(--border-subtle);
                    font-size: 0.8rem;
                    margin-top: 0.9rem;
                    padding-top: 0.85rem;
                }
                .actual-result {
                    align-items: center;
                    background: rgba(0,0,0,0.22);
                    border: 1px solid var(--border-subtle);
                    border-radius: 7px;
                    display: flex;
                    gap: 1rem;
                    justify-content: space-between;
                    margin-top: 0.9rem;
                    padding: 0.75rem;
                }
                .actual-result strong {
                    color: #fff;
                    text-align: right;
                }
                .session-enemy-grid {
                    display: grid;
                    gap: 0.65rem;
                }
                .session-enemy-row {
                    align-items: center;
                    background: rgba(0,0,0,0.18);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    display: grid;
                    gap: 0.75rem;
                    grid-template-columns: minmax(14rem, 1.2fr) repeat(3, minmax(6.5rem, 0.55fr)) minmax(7rem, 0.55fr);
                    padding: 0.75rem;
                }
                .session-enemy-title {
                    align-items: center;
                    display: flex;
                    gap: 0.7rem;
                    min-width: 0;
                }
                .session-enemy-title img {
                    border-radius: 6px;
                    height: 38px;
                    width: 38px;
                }
                .session-enemy-title strong,
                .session-enemy-title span {
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .session-enemy-title strong {
                    color: #fff;
                }
                .session-enemy-title span {
                    color: var(--text-muted);
                    font-size: 0.78rem;
                    margin-top: 0.15rem;
                }
                .session-row-result {
                    text-align: right;
                }
                .session-row-result strong {
                    color: var(--text-success);
                    display: block;
                    margin-top: 0.3rem;
                    white-space: nowrap;
                }
                .session-confidence {
                    display: grid;
                    gap: 0.45rem 1rem;
                    grid-template-columns: auto minmax(0, 1fr);
                    padding: 0.9rem 1rem;
                }
                .session-confidence strong {
                    color: #fff;
                }
                .session-confidence span {
                    color: var(--text-muted);
                }
                .combat-zone-panel {
                    background: rgba(255,255,255,0.015);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: minmax(220px, 0.85fr) minmax(0, 1.4fr);
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                }
                .zone-picker-panel,
                .zone-mob-panel {
                    min-width: 0;
                }
                .zone-panel-header {
                    align-items: center;
                    display: flex;
                    gap: 1rem;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                .zone-panel-header h2 {
                    align-items: center;
                    display: flex;
                    font-size: 0.95rem;
                    gap: 0.5rem;
                    margin: 0;
                }
                .zone-panel-header p {
                    color: var(--text-muted);
                    font-size: 0.78rem;
                    margin-top: 0.2rem;
                }
                .zone-count-pill,
                .zone-clear-button {
                    background: color-mix(in srgb, var(--text-accent), transparent 92%);
                    border: 1px solid var(--border-focus);
                    border-radius: 999px;
                    color: var(--text-accent);
                    font-size: 0.72rem;
                    font-weight: 700;
                    padding: 0.3rem 0.7rem;
                    white-space: nowrap;
                }
                .zone-clear-button {
                    cursor: pointer;
                    font-family: var(--font-sans);
                }
                .zone-clear-button:hover {
                    background: color-mix(in srgb, var(--text-accent), transparent 86%);
                }
                .zone-button-list,
                .zone-mob-list {
                    display: grid;
                    gap: 0.5rem;
                }
                .zone-button-list {
                    max-height: 25rem;
                    overflow-y: auto;
                    padding-right: 0.2rem;
                }
                .zone-select-button,
                .zone-mob-button {
                    align-items: center;
                    background: rgba(255,255,255,0.018);
                    border: 1px solid var(--border-subtle);
                    border-radius: 7px;
                    color: inherit;
                    cursor: pointer;
                    display: grid;
                    gap: 0.75rem;
                    grid-template-columns: minmax(0, 1fr) auto;
                    min-width: 0;
                    padding: 0.78rem 0.85rem;
                    text-align: left;
                    transition: all 0.15s ease;
                }
                .zone-select-button:hover,
                .zone-select-button.selected,
                .zone-mob-button:hover,
                .zone-mob-button:focus-visible {
                    background: color-mix(in srgb, var(--text-accent), transparent 96%);
                    border-color: var(--border-focus);
                }
                .zone-select-button.selected {
                    box-shadow: inset 3px 0 0 var(--text-accent);
                }
                .zone-select-button strong,
                .zone-mob-button strong {
                    color: #fff;
                    display: block;
                    font-size: 0.82rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .zone-select-button small,
                .zone-mob-button small {
                    color: var(--text-muted);
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    margin-top: 0.18rem;
                }
                .zone-select-button em {
                    color: var(--text-success);
                    font-size: 0.72rem;
                    font-style: normal;
                    font-weight: 800;
                    white-space: nowrap;
                }
                .selected-zone-stats {
                    display: grid;
                    gap: 0.65rem;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    margin-bottom: 0.85rem;
                }
                .selected-zone-stats span {
                    background: rgba(255,255,255,0.018);
                    border: 1px solid var(--border-subtle);
                    border-radius: 6px;
                    min-width: 0;
                    padding: 0.65rem;
                }
                .selected-zone-stats small {
                    color: var(--text-muted);
                    display: block;
                    font-size: 0.68rem;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                }
                .selected-zone-stats strong {
                    color: #fff;
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .zone-mob-main {
                    align-items: center;
                    display: flex;
                    min-width: 0;
                    gap: 0.65rem;
                }
                .zone-mob-main img {
                    border-radius: 4px;
                    height: 26px;
                    width: 26px;
                }
                .zone-mob-value {
                    color: var(--text-success);
                    font-size: 0.78rem;
                    font-weight: 800;
                    white-space: nowrap;
                }
                .zone-empty-state {
                    border: 1px dashed var(--border-subtle);
                    border-radius: 7px;
                    color: var(--text-muted);
                    font-size: 0.82rem;
                    padding: 1rem;
                }
                @media (max-width: 768px) {
                    .combat-view-tabs {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        width: 100%;
                    }
                    .combat-dev-notice {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                    .session-hero,
                    .session-card-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                    .session-summary-grid,
                    .session-form-grid,
                    .session-fields.two-col,
                    .session-confidence {
                        grid-template-columns: 1fr;
                    }
                    .session-enemy-row {
                        align-items: stretch;
                        grid-template-columns: 1fr;
                    }
                    .session-location-hint {
                        display: block;
                    }
                    .session-row-result,
                    .actual-result strong {
                        text-align: left;
                    }
                    .actual-result {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                    .combat-zone-panel {
                        grid-template-columns: 1fr;
                        padding: 0.85rem;
                    }
                    .zone-panel-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                    .zone-button-list {
                        display: grid;
                        grid-auto-columns: minmax(11rem, 68vw);
                        grid-auto-flow: column;
                        max-height: none;
                        overflow-x: auto;
                        overflow-y: hidden;
                        padding: 0 0 0.25rem;
                        scroll-snap-type: x proximity;
                    }
                    .selected-zone-stats {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                    .zone-select-button {
                        scroll-snap-align: start;
                    }
                    .zone-mob-button {
                        align-items: start;
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </main>
    );
}

export default function CombatPage() {
    return (
        <Suspense fallback={<div>Loading Combat Data...</div>}>
            <CombatContent />
        </Suspense>
    );
}
