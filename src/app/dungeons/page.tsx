"use client";
import { useEffect, useState, useMemo } from "react";
import { Activity, X, Info, Castle, ChevronDown, ChevronUp } from "lucide-react";
import Link from 'next/link';
import { EVENT_DUNGEONS } from "../../constants/events";
import { usePreferences } from "@/lib/preferences";

export default function DungeonsPage() {
    const [staticData, setStaticData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const [selectedDungeon, setSelectedDungeon] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("");
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const { preferences, setPreferences } = usePreferences();
    const [minLevelReq, setMinLevelReq] = useState(0);
    const [maxDurationMins, setMaxDurationMins] = useState(9999);
    const [minNetProfit, setMinNetProfit] = useState(0);
    const [showPositiveOnly, setShowPositiveOnly] = useState(false);

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

        const allDungeons = preferences.showEventDungeons ? [...staticData.dungeons, ...EVENT_DUNGEONS] : staticData.dungeons;

        for (const dungeon of allDungeons) {
            let evPerRun = 0;

            if (dungeon.loot) {
                for (const drop of dungeon.loot) {
                    const mData = marketData[drop.name];
                    const price = mData ? mData.avg_3 : 0;
                    const dropChance = (drop.chance || 0) / 100;
                    evPerRun += dropChance * (drop.quantity || 1) * price;
                }
            }
            
            const cost = dungeon.cost || 0;
            const netProfit = evPerRun - cost;
            const durationMins = (dungeon.length || 0) / 60000;
            const profitPerHour = durationMins > 0 ? netProfit * (60 / durationMins) : 0;

            calculated.push({
                ...dungeon,
                ev: evPerRun,
                netProfit: netProfit,
                durationMins,
                profitPerHour,
                dropsCount: dungeon.loot?.length || 0,
                lootDetails: dungeon.loot?.map((drop: any) => {
                    const price = marketData[drop.name]?.avg_3 || 0;
                    const dropChance = (drop.chance || 0) / 100;
                    const expectedVal = dropChance * (drop.quantity || 1) * price;
                    return { ...drop, price, expectedVal };
                }) || []
            });
        }

        const filtered = calculated.filter((row) => {
            if ((row.level_required || 0) < minLevelReq) return false;
            if ((row.durationMins || 0) > maxDurationMins) return false;
            if ((row.netProfit || 0) < minNetProfit) return false;
            if (showPositiveOnly && (row.netProfit || 0) <= 0) return false;
            return true;
        });

        filtered.sort((a, b) => {
            if (!sortCol) return b.netProfit - a.netProfit;
            let valA = a[sortCol] || 0;
            let valB = b[sortCol] || 0;
            if (sortCol === "name") { valA = a.name; valB = b.name; }
            if (valA < valB) return sortDesc ? 1 : -1;
            if (valA > valB) return sortDesc ? -1 : 1;
            return 0;
        });
        return filtered;
    }, [staticData, marketData, preferences.showEventDungeons, sortCol, sortDesc, minLevelReq, maxDurationMins, minNetProfit, showPositiveOnly]);

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
                    <Castle size={24} color="var(--text-accent)" /> DUNGEONS
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">
                        {staticData ? `${staticData.dungeons.length} DUNGEONS LOADED` : "INITIALIZING..."}
                    </span>
                </div>
            </div>

            <div className="controls" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end', background: 'transparent', border: 'none' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: preferences.showEventDungeons ? '#fff' : 'var(--text-muted)', fontWeight: 500, userSelect: 'none' }}>
                    <div style={{ position: 'relative', width: '36px', height: '20px', background: preferences.showEventDungeons ? 'var(--text-accent)' : 'var(--border-focus)', borderRadius: '10px', transition: '0.2s' }}>
                        <div style={{ position: 'absolute', top: '2px', left: preferences.showEventDungeons ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s' }}></div>
                    </div>
                    <input type="checkbox" checked={preferences.showEventDungeons} onChange={e => setPreferences({ showEventDungeons: e.target.checked })} style={{ display: 'none' }} />
                    Show Event Dungeons
                </label>
                <div className="control-group" style={{ marginLeft: '1rem' }}>
                    <label className="control-label">Min Level Req</label>
                    <input type="number" className="control-input" value={minLevelReq} onChange={e => setMinLevelReq(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div className="control-group" style={{ marginLeft: '0.75rem' }}>
                    <label className="control-label">Max Duration (m)</label>
                    <input type="number" className="control-input" value={maxDurationMins} onChange={e => setMaxDurationMins(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div className="control-group" style={{ marginLeft: '0.75rem' }}>
                    <label className="control-label">Min Net Profit</label>
                    <input type="number" className="control-input" value={minNetProfit} onChange={e => setMinNetProfit(Number(e.target.value) || 0)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginLeft: '1rem' }}>
                    <input type="checkbox" checked={showPositiveOnly} onChange={e => setShowPositiveOnly(e.target.checked)} />
                    <span className="text-muted">Only Positive</span>
                </label>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th className="sortable left-align" onClick={() => handleSort("name")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>Dungeon {renderSortIcon("name")}</div>
                            </th>
                            <th className="sortable" onClick={() => handleSort("level_required")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>Level Req {renderSortIcon("level_required")}</div>
                            </th>
                            <th className="sortable" onClick={() => handleSort("durationMins")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>Duration {renderSortIcon("durationMins")}</div>
                            </th>
                            <th className="sortable" onClick={() => handleSort("cost")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>Cost {renderSortIcon("cost")}</div>
                            </th>
                            <th className="sortable" onClick={() => handleSort("ev")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>EV / Run {renderSortIcon("ev")}</div>
                            </th>
                            <th className="sortable" onClick={() => handleSort("netProfit")}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>Net Profit {renderSortIcon("netProfit")}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="clickable-row" onClick={() => setSelectedDungeon(row)}>
                                <td className="item-name left-align">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {row.image_url ? <img src={row.image_url} alt={row.name} style={{ width: '24px', height: '24px' }} /> : <Castle size={20} color="var(--text-muted)" />}
                                        {row.name} {row.isEvent && <span className="action-badge action-vendor" style={{ fontSize: '0.6rem', minWidth: 0, padding: '0.1rem 0.3rem' }}>EVENT</span>}
                                    </div>
                                </td>
                                <td className="mono">{row.level_required}</td>
                                <td className="mono">{row.durationMins.toLocaleString(undefined, {maximumFractionDigits:0})}m</td>
                                <td className="mono profit-negative">-{row.cost}</td>
                                <td className="mono profit-positive">
                                    ~{row.ev.toLocaleString(undefined, {maximumFractionDigits:0})}
                                </td>
                                <td className={`mono font-bold ${row.netProfit > 0 ? 'profit-positive' : 'profit-negative'}`}>
                                    {row.netProfit > 0 ? '+' : ''}{row.netProfit.toLocaleString(undefined, {maximumFractionDigits:0})}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <Activity className="animate-spin" style={{ margin: '0 auto', marginBottom: '1rem' }} />
                                    Loading Dungeon Data & Real-Time Market Prices...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedDungeon && (
                <div className="modal-overlay" onClick={() => setSelectedDungeon(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {selectedDungeon.image_url && (
                                    <div style={{ width: '48px', height: '48px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                        <img src={selectedDungeon.image_url} alt={selectedDungeon.name} style={{ maxWidth: '36px', maxHeight: '36px', margin: 'auto' }} />
                                    </div>
                                )}
                                <div>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                        {selectedDungeon.name}
                                    </h2>
                                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                        {selectedDungeon.location?.name} • Difficulty: {selectedDungeon.difficulty}
                                    </span>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedDungeon(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Entry Cost</div>
                                    <div className="stat-value profit-negative">-{selectedDungeon.cost}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Duration</div>
                                    <div className="stat-value">{Math.round(selectedDungeon.durationMins)} Mins</div>
                                </div>
                                <div className="stat-card highlight">
                                    <div className="stat-label">Net Profit / Run</div>
                                    <div className={`stat-value ${selectedDungeon.netProfit > 0 ? 'profit-positive' : 'profit-negative'}`}>
                                        {selectedDungeon.netProfit > 0 ? '+' : ''}{selectedDungeon.netProfit.toLocaleString(undefined, {maximumFractionDigits:0})}g
                                    </div>
                                </div>
                            </div>
                            
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Loot Table</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {selectedDungeon.lootDetails?.sort((a:any, b:any) => b.expectedVal - a.expectedVal).map((drop: any, i: number) => (
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
                                                ~{drop.expectedVal.toLocaleString(undefined, {maximumFractionDigits:2})}g <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>EV/run</span>
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
