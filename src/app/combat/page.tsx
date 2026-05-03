"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Swords, X, ChevronDown, ChevronUp, Search, MapPin, Shield, Heart, ExternalLink, BarChart3, Trophy } from "lucide-react";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePreferences } from "@/lib/preferences";
import { useItemModal } from "@/context/ItemModalContext";
import MobileSortControls from "@/components/MobileSortControls";

function CombatContent() {
    const { openItemByName, prefetchItem } = useItemModal();
    const searchParams = useSearchParams();
    const [staticData, setStaticData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const { preferences, setPreferences } = usePreferences();
    const [selectedEnemy, setSelectedEnemy] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("ev");
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const search = searchParams.get("search");
        if (search) setSearchTerm(search);
    }, [searchParams]);

    useEffect(() => {
        fetch('/static-data.json').then(r => r.json()).then(setStaticData);
        
        const fetchMarket = async () => {
            try {
                const res = await fetch("/market-data.json?t=" + Date.now());
                if (res.ok) {
                    const data = await res.json();
                    setMarketData((prev: any) => {
                        if (prev?._meta?.last_updated === data?._meta?.last_updated) return prev;
                        return data;
                    });
                }
            } catch (e) {}
        };
        fetchMarket();
        const interval = setInterval(fetchMarket, 30000);
        return () => clearInterval(interval);
    }, []);

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
        if (!staticData || !marketData) return [];
        const calculated = [];
        const parsedKph = Number(preferences.killsPerHour) || 0;

        for (const enemy of staticData.enemies) {
            const chanceOfLoot = (enemy.chance_of_loot || 0) / 100;
            let evPerKill = 0;

            if (enemy.loot) {
                for (const drop of enemy.loot) {
                    const mData = marketData[drop.name];
                    const price = mData ? mData.avg_3 : 0;
                    const dropChance = (drop.chance || 0) / 100;
                    evPerKill += dropChance * (drop.quantity || 1) * price;
                }
            }
            
            const finalEv = evPerKill * chanceOfLoot;

            calculated.push({
                ...enemy,
                ev: finalEv,
                profitPerHour: finalEv * parsedKph,
                dropsCount: enemy.loot?.length || 0,
                lootDetails: enemy.loot?.map((drop: any) => {
                    const price = marketData[drop.name]?.avg_3 || 0;
                    const dropChance = (drop.chance || 0) / 100;
                    const expectedVal = dropChance * (drop.quantity || 1) * price;
                    return { ...drop, price, expectedVal };
                }) || []
            });
        }

        return calculated;
    }, [staticData, marketData, preferences.killsPerHour]);

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
            .sort((a, b) => b.avgGoldPerHour - a.avgGoldPerHour);
    }, [combatRows]);

    const rows = useMemo(() => {
        // Search Filter
        const q = debouncedSearch.toLowerCase();
        let filtered = q
            ? combatRows.filter(e => e.name.toLowerCase().includes(q) || (e.location?.name || '').toLowerCase().includes(q))
            : [...combatRows];

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
    }, [combatRows, sortCol, sortDesc, debouncedSearch]);

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

    const renderSortIcon = (col: string) => {
        if (sortCol !== col) return null;
        return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    return (
        <main className="container">
            <div className="header">
                <h1 className="header-title">
                    <Swords size={24} color="var(--text-accent)" /> ZENITH COMBAT
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">
                        {staticData ? `${staticData.enemies.length} ENEMIES LOADED` : "INITIALIZING..."}
                    </span>
                </div>
            </div>

            <div className="controls">
                <div className="control-group">
                    <label className="control-label">Kills Per Hour</label>
                    <input 
                        type="number" 
                        className="control-input"
                        value={preferences.killsPerHour}
                        onChange={(e) => {
                            const val = e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0);
                            setPreferences({ killsPerHour: val });
                        }}
                    />
                </div>
                <div className="control-group" style={{ flex: 1 }}>
                    <label className="control-label">Search</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="control-input"
                            placeholder="Search enemy or location..."
                            style={{ width: '100%', paddingLeft: '2rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <section className="area-overview" aria-label="Area combat summary">
                <div className="area-overview-header">
                    <div>
                        <h2>
                            <BarChart3 size={18} color="var(--text-accent)" /> Area Profit Overview
                        </h2>
                        <p>Average value across every enemy in each location, using your kills/hour setting.</p>
                    </div>
                    <div className="area-overview-meta mono">
                        {areaSummaries.length} AREAS
                    </div>
                </div>

                <div className="area-summary-grid">
                    {areaSummaries.map((summary, index) => (
                        <button
                            key={summary.area}
                            type="button"
                            className="area-summary-card"
                            onClick={() => setSearchTerm(summary.area)}
                            aria-label={`Filter enemies to ${summary.area}`}
                        >
                            <div className="area-card-top">
                                <span className="area-rank">#{index + 1}</span>
                                <span className="area-name">{summary.area}</span>
                                {index === 0 && <Trophy size={16} color="var(--text-accent)" />}
                            </div>
                            <div className="area-main-stat">
                                <span className="mono">{summary.avgGoldPerHour.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <small>avg gold / hour</small>
                            </div>
                            <div className="area-mini-stats">
                                <span>
                                    <strong>{summary.enemyCount}</strong>
                                    <small>enemies</small>
                                </span>
                                <span>
                                    <strong>{summary.avgEv.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong>
                                    <small>avg EV</small>
                                </span>
                                <span>
                                    <strong>{summary.minLevel}-{summary.maxLevel}</strong>
                                    <small>level</small>
                                </span>
                            </div>
                            <div className="area-best">
                                Best: <strong>{summary.bestEnemy?.name || "Unknown"}</strong>
                                <span className="mono">{(summary.bestEnemy?.profitPerHour || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}/h</span>
                            </div>
                        </button>
                    ))}
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
                                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:'flex-end'}}>Gold / Hour {renderSortIcon('profitPerHour')}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={i} className="clickable-row" onClick={() => setSelectedEnemy(row)} onMouseEnter={() => prefetchItem(row.name)}>
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
                            { value: "profitPerHour", label: "Gold / Hour" },
                            { value: "ev", label: "EV / Kill" },
                            { value: "level", label: "Level" },
                            { value: "dropsCount", label: "Drops" },
                            { value: "name", label: "Name" },
                            { value: "location", label: "Location" },
                        ]}
                    />
                    <div className="mobile-card-grid">
                        {rows.map((row, i) => (
                            <div key={i} className="mobile-alchemy-card" onClick={() => setSelectedEnemy(row)}>
                                <div className="m-card-header">
                                    <div className="m-card-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {row.image_url && <img src={row.image_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />}
                                            <span className="m-name">{row.name}</span>
                                        </div>
                                        <span className="m-lvl">{row.location?.name || "Unknown"} • LVL {row.level}</span>
                                    </div>
                                    <div className="m-roi pos">{row.dropsCount} DROPS</div>
                                </div>
                                <div className="m-card-body">
                                    <div className="m-stat">
                                        <span className="m-label">EV / KILL</span>
                                        <span className="m-val pos">~{row.ev.toLocaleString(undefined, {maximumFractionDigits:1})}g</span>
                                    </div>
                                    <div className="m-stat">
                                        <span className="m-label">GOLD / HOUR</span>
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

            {selectedEnemy && (
                <div className="modal-overlay" onClick={() => setSelectedEnemy(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {selectedEnemy.image_url && (
                                    <div style={{ width: '48px', height: '48px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                        <img src={selectedEnemy.image_url} alt={selectedEnemy.name} style={{ maxWidth: '36px', maxHeight: '36px', margin: 'auto' }} />
                                    </div>
                                )}
                                <div>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
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
                            <button className="close-btn" onClick={() => setSelectedEnemy(null)}>
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
                                    <div className="stat-label">Expected Profit</div>
                                    <div className="stat-value profit-positive">~{selectedEnemy.ev.toLocaleString(undefined, {maximumFractionDigits:1})}/kill</div>
                                </div>
                            </div>
                            
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
                                                 <div className="loot-item-name" style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', transition: 'color 0.2s' }}>{drop.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>x{drop.quantity || 1}</span></div>
                                                 <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)' }}>{drop.chance}% Drop Rate</div>
                                             </div>
                                         </div>
                                         <div style={{ textAlign: 'right' }}>
                                             <div style={{ color: 'var(--text-success)', fontWeight: 600, fontSize: '0.9rem' }}>
                                                 ~{drop.expectedVal.toLocaleString(undefined, {maximumFractionDigits:2})}g <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>EV/kill</span>
                                             </div>
                                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                 Inspect Item ({drop.price.toLocaleString()}g avg) <ExternalLink size={10} />
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
                .area-overview {
                    background: rgba(255,255,255,0.015);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                }
                .area-overview-header {
                    align-items: center;
                    display: flex;
                    gap: 1rem;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                .area-overview-header h2 {
                    align-items: center;
                    display: flex;
                    font-size: 0.95rem;
                    gap: 0.5rem;
                    margin: 0;
                }
                .area-overview-header p {
                    color: var(--text-muted);
                    font-size: 0.78rem;
                    margin-top: 0.2rem;
                }
                .area-overview-meta {
                    background: color-mix(in srgb, var(--text-accent), transparent 92%);
                    border: 1px solid var(--border-focus);
                    border-radius: 999px;
                    color: var(--text-accent);
                    font-size: 0.72rem;
                    font-weight: 700;
                    padding: 0.3rem 0.7rem;
                    white-space: nowrap;
                }
                .area-summary-grid {
                    display: grid;
                    gap: 0.75rem;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                }
                .area-summary-card {
                    background: rgba(255,255,255,0.018);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: inherit;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                    min-width: 0;
                    padding: 1rem;
                    text-align: left;
                    transition: all 0.15s ease;
                }
                .area-summary-card:hover {
                    background: color-mix(in srgb, var(--text-accent), transparent 96%);
                    border-color: var(--border-focus);
                    transform: translateY(-1px);
                }
                .area-card-top {
                    align-items: center;
                    display: flex;
                    gap: 0.5rem;
                    min-width: 0;
                }
                .area-rank {
                    color: var(--text-accent);
                    font-family: var(--font-mono);
                    font-size: 0.74rem;
                    font-weight: 800;
                }
                .area-name {
                    color: #fff;
                    flex: 1;
                    font-weight: 800;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .area-main-stat span {
                    color: var(--text-success);
                    display: block;
                    font-size: 1.35rem;
                    font-weight: 800;
                    line-height: 1;
                }
                .area-main-stat small,
                .area-mini-stats small {
                    color: var(--text-muted);
                    display: block;
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    margin-top: 0.25rem;
                    text-transform: uppercase;
                }
                .area-mini-stats {
                    display: grid;
                    gap: 0.5rem;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .area-mini-stats span {
                    background: rgba(255,255,255,0.018);
                    border: 1px solid var(--border-subtle);
                    border-radius: 6px;
                    padding: 0.55rem;
                }
                .area-mini-stats strong {
                    color: #fff;
                    display: block;
                    font-family: var(--font-mono);
                    font-size: 0.86rem;
                }
                .area-best {
                    align-items: center;
                    border-top: 1px solid var(--border-subtle);
                    color: var(--text-muted);
                    display: flex;
                    gap: 0.35rem;
                    justify-content: space-between;
                    min-width: 0;
                    padding-top: 0.75rem;
                    font-size: 0.78rem;
                }
                .area-best strong {
                    color: #fff;
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .area-best span {
                    color: var(--text-success);
                    font-weight: 800;
                    white-space: nowrap;
                }
                @media (max-width: 768px) {
                    .area-overview {
                        padding: 0.85rem;
                    }
                    .area-overview-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                    .area-summary-grid {
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
