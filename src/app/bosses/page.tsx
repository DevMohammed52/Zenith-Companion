"use client";
import { useEffect, useState, useMemo } from "react";
import { Skull, X, ChevronDown, ChevronUp, Search, MapPin, Shield, Clock, ExternalLink } from "lucide-react";
import Link from 'next/link';
import { usePreferences } from "@/lib/preferences";
import { BOSS_SCHEDULES, EVENT_BOSSES } from "../../constants/events";

export default function BossesPage() {
    const [staticData, setStaticData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const { preferences } = usePreferences();
    const [selectedBoss, setSelectedBoss] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("");
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");

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

        const filtered = searchTerm 
            ? calculated.filter(row => row.name.toLowerCase().includes(searchTerm.toLowerCase()) || row.location?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
            : calculated;

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
    }, [staticData, marketData, searchTerm, sortCol, sortDesc]);

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
                    <Skull size={24} color="var(--text-accent)" /> ZENITH WORLD BOSSES
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">{rows.length} BOSSES LOADED</span>
                </div>
            </div>

            <div className="controls">
                <div className="control-group" style={{ flex: 1 }}>
                    <label className="control-label">SEARCH BOSSES</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="control-input"
                            placeholder="Search boss or location..."
                            style={{ width: '100%', paddingLeft: '2rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th className="sortable left-align" onClick={() => handleSort('name')}>BOSS {renderSortIcon('name')}</th>
                            <th className="sortable left-align" onClick={() => handleSort('location')}>LOCATION {renderSortIcon('location')}</th>
                            <th className="sortable" onClick={() => handleSort('level')}>LEVEL {renderSortIcon('level')}</th>
                            <th>STATUS / NEXT SPAWN</th>
                            <th className="sortable" onClick={() => handleSort('ev')}>EV / KILL {renderSortIcon('ev')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="clickable-row" onClick={() => setSelectedBoss(row)}>
                                <td className="item-name left-align">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {row.image_url && <img src={row.image_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
                                        <span>{row.name}</span>
                                        {row.isEvent && <span style={{fontSize:'0.6rem', color:'var(--text-accent)', border:'1px solid var(--text-accent)', padding:'1px 4px', borderRadius:'3px', marginLeft:'5px'}}>EVENT</span>}
                                    </div>
                                </td>
                                <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
                                <td className="mono">{row.level}</td>
                                <td>
                                    {row.nextSpawnTime ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                                            <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{row.nextSpawnTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>Dies ~{row.deathTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    ) : <span className="text-muted">Unknown</span>}
                                </td>
                                <td className="mono profit-positive font-bold">
                                    ~{row.ev.toLocaleString(undefined, {maximumFractionDigits:0})}g
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedBoss && (
                <div className="modal-overlay" onClick={() => setSelectedBoss(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {selectedBoss.image_url && (
                                    <img src={selectedBoss.image_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '6px' }} />
                                )}
                                <div>
                                    <h2 style={{ margin: 0 }}>{selectedBoss.name}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                            <MapPin size={12} color="var(--text-accent)" /> {selectedBoss.location?.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                            <Shield size={12} color="var(--text-accent)" /> Level {selectedBoss.level} Boss
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedBoss(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">EXPECTED VALUE / KILL</div>
                                    <div className="stat-value" style={{ color: 'var(--text-accent)' }}>~{selectedBoss.ev.toLocaleString(undefined, {maximumFractionDigits:0})}g</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">TOTAL DROPS AVAILABLE</div>
                                    <div className="stat-value">{selectedBoss.dropsCount} Unique Items</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">SPAWN CYCLE</div>
                                    <div className="stat-value">Every {selectedBoss.scheduleInfo?.respawnHours || "?"}h</div>
                                </div>
                            </div>

                            <div className="upcoming-spawns-section">
                                <div className="section-title">
                                    <Clock size={16} /> Upcoming Spawns
                                </div>
                                <div className="spawns-container scroll-x">
                                    {generateTimetable(selectedBoss).map((time, i) => (
                                        <div key={i} className={`spawn-box ${i === 0 ? 'active' : ''}`}>
                                            <div className="spawn-day">{i === 0 ? 'NEXT SPAWN' : time.toLocaleDateString(undefined, {weekday: 'short'}).toUpperCase()}</div>
                                            <div className="spawn-time">{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Loot Table</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {selectedBoss.lootDetails?.sort((a:any, b:any) => b.expectedVal - a.expectedVal).map((drop: any, i: number) => (
                                    <div key={i} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', 
                                        borderRadius: '6px' 
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {drop.image_url && <img src={drop.image_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />}
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{drop.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>x{drop.quantity || 1}</span></div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)' }}>{drop.chance}% Drop Rate</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--text-success)', fontWeight: 600, fontSize: '0.9rem' }}>
                                                ~{drop.expectedVal.toLocaleString(undefined, {maximumFractionDigits:2})}g <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>EV/kill</span>
                                            </div>
                                            <Link href={`/items?name=${encodeURIComponent(drop.name)}`} 
                                                  style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                                View Market ({drop.price.toLocaleString()}g avg) <ExternalLink size={10} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .upcoming-spawns-section { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); borderRadius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
                .section-title { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-accent); font-weight: 600; }
                .spawns-container { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.75rem; }
                .spawns-container::-webkit-scrollbar { height: 4px; }
                .spawns-container::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }
                .spawn-box { min-width: 110px; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.01); text-align: center; flex-shrink: 0; }
                .spawn-box.active { background: rgba(56,189,248,0.05); border-color: rgba(56,189,248,0.2); }
                .spawn-day { font-size: 0.65rem; color: var(--text-muted); margin-bottom: 0.25rem; letter-spacing: 0.05em; }
                .spawn-time { font-size: 1.1rem; font-weight: 700; color: #fff; font-family: 'Outfit', sans-serif; }
                .spawn-box.active .spawn-time { color: var(--text-accent); }
            `}</style>
        </main>
    );
}
