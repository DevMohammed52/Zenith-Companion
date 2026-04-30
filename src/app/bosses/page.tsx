"use client";
import { useEffect, useState, useMemo } from "react";
import { Activity, X, Info, Skull, ChevronUp, ChevronDown, Clock } from "lucide-react";
import Link from 'next/link';
import { BOSS_SCHEDULES, EVENT_BOSSES } from "../../constants/events";
import { usePreferences } from "@/lib/preferences";

export default function BossesPage() {
    const [staticData, setStaticData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const [selectedBoss, setSelectedBoss] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("");
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const { preferences, setPreferences } = usePreferences();
    const [minLevel, setMinLevel] = useState(0);
    const [minDrops, setMinDrops] = useState(0);
    const [minEv, setMinEv] = useState(0);

    useEffect(() => {
        fetch('/static-data.json').then(r => r.json()).then(setStaticData);
        
        const fetchMarket = async () => {
            try {
                const res = await fetch("/market-data.json?t=" + Date.now());
                if (res.ok) setMarketData(await res.json());
            } catch (e) {}
        };
        fetchMarket();
        const interval = setInterval(fetchMarket, 3000);
        return () => clearInterval(interval);
    }, []);

    const rows = useMemo(() => {
        if (!staticData || !marketData) return [];
        const calculated = [];

        const allBosses = preferences.showEventBosses ? [...staticData.world_bosses, ...EVENT_BOSSES] : staticData.world_bosses;

        for (const boss of allBosses) {
            let evPerRun = 0;

            if (boss.loot) {
                for (const drop of boss.loot) {
                    const mData = marketData[drop.name];
                    const price = mData ? mData.avg_3 : 0;
                    const dropChance = (drop.chance || 0) / 100;
                    evPerRun += dropChance * (drop.quantity || 1) * price;
                }
            }

            const scheduleInfo = boss.isEvent ? { respawnHours: boss.respawnHours, lengthSeconds: boss.lengthSeconds } : BOSS_SCHEDULES[boss.name];
            
            let nextSpawnTime = null;
            let deathTime = null;
            if (scheduleInfo && boss.battle_starts_at) {
                const start = new Date(boss.battle_starts_at).getTime();
                const cycle = scheduleInfo.respawnHours * 3600000;
                const now = Date.now();
                let next = start;
                // If the provided start time is in the past, align to the next future cycle
                if (next < now) {
                    const diff = now - next;
                    const cyclesMissed = Math.floor(diff / cycle);
                    next += (cyclesMissed + 1) * cycle;
                }
                nextSpawnTime = new Date(next);
                deathTime = new Date(next + scheduleInfo.lengthSeconds * 1000);
            }

            calculated.push({
                ...boss,
                ev: evPerRun,
                dropsCount: boss.loot?.length || 0,
                scheduleInfo,
                nextSpawnTime,
                deathTime,
                lootDetails: boss.loot?.map((drop: any) => {
                    const price = marketData[drop.name]?.avg_3 || 0;
                    const dropChance = (drop.chance || 0) / 100;
                    const expectedVal = dropChance * (drop.quantity || 1) * price;
                    return { ...drop, price, expectedVal };
                }) || []
            });
        }

        const filtered = calculated.filter((row) => {
            const hasMarket = Object.keys(marketData).length > 0;
            if ((row.level || 0) < minLevel) return false;
            if ((row.dropsCount || 0) < minDrops) return false;
            if (hasMarket && (row.ev || 0) < minEv) return false;
            return true;
        });

        filtered.sort((a, b) => {
            if (!sortCol) return b.ev - a.ev;
            
            let valA: any = a[sortCol];
            let valB: any = b[sortCol];
            
            // Special case for location object
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
    }, [staticData, marketData, preferences.showEventBosses, sortCol, sortDesc, minLevel, minDrops, minEv]);

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDesc(!sortDesc);
        else { setSortCol(col); setSortDesc(true); }
    };

    const renderSortIcon = (col: string) => {
        if (sortCol !== col) return null;
        return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    const generateTimetable = (boss: any) => {
        if (!boss.nextSpawnTime || !boss.scheduleInfo) return [];
        const times = [];
        let current = boss.nextSpawnTime.getTime();
        for (let i = 0; i < 5; i++) {
            times.push(new Date(current));
            current += boss.scheduleInfo.respawnHours * 3600000;
        }
        return times;
    };

    return (
        <main className="container">
            <div className="header">
                <h1 className="header-title">
                    <Skull size={24} color="var(--text-accent)" /> WORLD BOSSES
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">
                        {staticData ? `${staticData.world_bosses.length} BOSSES LOADED` : "INITIALIZING..."}
                    </span>
                </div>
            </div>

            <div className="controls" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end', background: 'transparent', border: 'none' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: preferences.showEventBosses ? '#fff' : 'var(--text-muted)', fontWeight: 500, userSelect: 'none' }}>
                    <div style={{ position: 'relative', width: '36px', height: '20px', background: preferences.showEventBosses ? 'var(--text-accent)' : 'var(--border-focus)', borderRadius: '10px', transition: '0.2s' }}>
                        <div style={{ position: 'absolute', top: '2px', left: preferences.showEventBosses ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s' }}></div>
                    </div>
                    <input type="checkbox" checked={preferences.showEventBosses} onChange={e => setPreferences({ showEventBosses: e.target.checked })} style={{ display: 'none' }} />
                    Show Event Bosses
                </label>
                <div className="control-group" style={{ marginLeft: '1rem' }}>
                    <label className="control-label">Min Level</label>
                    <input type="number" className="control-input" value={minLevel} onChange={e => setMinLevel(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div className="control-group" style={{ marginLeft: '0.75rem' }}>
                    <label className="control-label">Min Drops</label>
                    <input type="number" className="control-input" value={minDrops} onChange={e => setMinDrops(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div className="control-group" style={{ marginLeft: '0.75rem' }}>
                    <label className="control-label">Min EV / Kill</label>
                    <input type="number" className="control-input" value={minEv} onChange={e => setMinEv(Math.max(0, Number(e.target.value) || 0))} />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th className="sortable left-align" onClick={() => handleSort("name")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>World Boss {renderSortIcon("name")}</div>
                            </th>
                            <th className="sortable left-align" onClick={() => handleSort("location")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>Location {renderSortIcon("location")}</div>
                            </th>
                            <th className="sortable" onClick={() => handleSort("level")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>Level Req {renderSortIcon("level")}</div>
                            </th>
                            <th>Status / Next Spawn</th>
                            <th className="sortable" onClick={() => handleSort("dropsCount")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>Loot Drops {renderSortIcon("dropsCount")}</div>
                            </th>
                            <th className="sortable" onClick={() => handleSort("ev")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>EV / Kill {renderSortIcon("ev")}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="clickable-row" onClick={() => setSelectedBoss(row)}>
                                <td className="item-name left-align">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {row.image_url ? <img src={row.image_url} alt={row.name} style={{ width: '24px', height: '24px' }} /> : <Skull size={20} color="var(--text-muted)" />}
                                        {row.name} {row.isEvent && <span className="action-badge action-vendor" style={{ fontSize: '0.6rem', minWidth: 0, padding: '0.1rem 0.3rem' }}>EVENT</span>}
                                    </div>
                                </td>
                                <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
                                <td className="mono">{row.level}</td>
                                <td>
                                    {row.nextSpawnTime ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                                            <span style={{ color: 'var(--text-accent)' }}>{row.nextSpawnTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span className="text-muted">Dies ~{row.deathTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted">Unknown</span>
                                    )}
                                </td>
                                <td className="mono">{row.dropsCount}</td>
                                <td className="mono profit-positive font-bold">
                                    ~{row.ev.toLocaleString(undefined, {maximumFractionDigits:0})}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <Activity className="animate-spin" style={{ margin: '0 auto', marginBottom: '1rem' }} />
                                    Loading Boss Data & Real-Time Market Prices...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedBoss && (
                <div className="modal-overlay" onClick={() => setSelectedBoss(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {selectedBoss.image_url && (
                                    <div style={{ width: '48px', height: '48px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                        <img src={selectedBoss.image_url} alt={selectedBoss.name} style={{ maxWidth: '36px', maxHeight: '36px', margin: 'auto' }} />
                                    </div>
                                )}
                                <div>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                        {selectedBoss.name}
                                    </h2>
                                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                        {selectedBoss.location?.name} • Level {selectedBoss.level}
                                    </span>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedBoss(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card highlight">
                                    <div className="stat-label">Expected Value / Kill</div>
                                    <div className="stat-value profit-positive">
                                        ~{selectedBoss.ev.toLocaleString(undefined, {maximumFractionDigits:0})}g
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Total Drops Available</div>
                                    <div className="stat-value">{selectedBoss.dropsCount} Unique Items</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Spawn Cycle</div>
                                    <div className="stat-value mono">Every {selectedBoss.scheduleInfo?.respawnHours || "?"}h</div>
                                </div>
                            </div>
                            
                            {selectedBoss.nextSpawnTime && (
                                <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={16} color="var(--text-accent)" /> Upcoming Spawns
                                    </h3>
                                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                        {generateTimetable(selectedBoss).map((time, idx) => (
                                            <div key={idx} style={{ 
                                                flexShrink: 0, padding: '0.75rem', background: 'var(--bg-base)', 
                                                border: '1px solid var(--border-focus)', borderRadius: '4px', textAlign: 'center', minWidth: '100px' 
                                            }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                                    {idx === 0 ? 'Next Spawn' : time.toLocaleDateString(undefined, {weekday: 'short'})}
                                                </div>
                                                <div className="mono" style={{ color: idx === 0 ? 'var(--text-accent)' : '#fff', fontWeight: idx === 0 ? 600 : 400 }}>
                                                    {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Loot Table</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {selectedBoss.lootDetails?.sort((a:any, b:any) => b.expectedVal - a.expectedVal).map((drop: any, i: number) => (
                                    <div key={i} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                                        borderRadius: '6px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {drop.image_url && <img src={drop.image_url} alt={drop.name} style={{ width: '32px', height: '32px' }} />}
                                            <div>
                                                <div style={{ fontWeight: 500, color: '#fff' }}>{drop.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>x{drop.quantity || 1}</span></div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{drop.chance}% Drop Rate</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--text-success)', fontWeight: 600 }}>
                                                ~{drop.expectedVal.toLocaleString(undefined, {maximumFractionDigits:2})}g <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>EV/kill</span>
                                            </div>
                                            <Link href={`/items?name=${encodeURIComponent(drop.name)}`} 
                                                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                                                View Market ({drop.price.toLocaleString()}g avg)
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
