"use client";
import { useEffect, useState, useMemo } from "react";
import { Castle, X, ChevronDown, ChevronUp, Search, ExternalLink, MapPin, Zap } from "lucide-react";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePreferences } from "@/lib/preferences";
import { useItemModal } from "@/context/ItemModalContext";

function DungeonsContent() {
    const searchParams = useSearchParams();
    const [staticData, setStaticData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const [usageMap, setUsageMap] = useState<any>(null);
    const { preferences } = usePreferences();
    const { openItemByName } = useItemModal();
    const [selectedDungeon, setSelectedDungeon] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("");
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const searchParam = searchParams.get("search");
        if (searchParam) setSearchTerm(searchParam);
    }, [searchParams]);

    useEffect(() => {
        fetch('/static-data.json').then(r => r.json()).then(data => setStaticData(data));
        fetch('/usage-map.json').then(r => r.json()).then(data => setUsageMap(data));

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

    const rows = useMemo(() => {
        if (!staticData || !marketData || !usageMap) return [];
        const calculated = [];

        // Helper to find the "True Value" of an item (handles recipes/chests)
        const getItemTrueValue = (name: string, depth = 0): number => {
            if (depth > 2) return 0; // Prevent infinite loops
            
            const rel = usageMap[name];
            const market = marketData[name];

            // 1. If it's a Recipe, value it by (Result Price * Uses)
            if (rel?.recipe_yield) {
                const resultPrice = marketData[rel.recipe_yield.item_name]?.avg_3 || 0;
                const uses = rel.recipe_yield.uses === 'Infinite' ? 1 : (rel.recipe_yield.uses || 1);
                return resultPrice * uses;
            }

            // 2. If it's a Chest, value it by its loot table EV
            if (rel?.loot_table) {
                let chestEv = 0;
                for (const drop of rel.loot_table) {
                    const val = getItemTrueValue(drop.name, depth + 1);
                    chestEv += (drop.chance / 100) * (drop.quantity || 1) * val;
                }
                return chestEv;
            }

            // 3. Normal Item
            return market?.avg_3 || 0;
        };

        for (const dungeon of staticData.dungeons) {
            if (dungeon.is_event && !preferences.showEventDungeons) continue;

            let totalEv = 0;
            if (dungeon.loot) {
                for (const drop of dungeon.loot) {
                    const trueValue = getItemTrueValue(drop.name);
                    const dropChance = (drop.chance || 0) / 100;
                    totalEv += dropChance * (drop.quantity || 1) * trueValue;
                }
            }
            
            const durationMins = Math.floor((dungeon.length || 0) / 60000);
            const entryCost = dungeon.cost || 0;
            const netProfitPerRun = totalEv - entryCost;
            const runsPerHour = durationMins > 0 ? (60 / durationMins) : 0;
            const profitPerHour = netProfitPerRun * runsPerHour;

            calculated.push({
                ...dungeon,
                ev: totalEv,
                durationMins,
                entryCost,
                netProfitPerRun,
                profitPerHour,
                dropsCount: dungeon.loot?.length || 0,
                lootDetails: dungeon.loot?.map((drop: any) => {
                    const trueValue = getItemTrueValue(drop.name);
                    const marketPrice = marketData[drop.name]?.avg_3 || 0;
                    const dropChance = (drop.chance || 0) / 100;
                    const expectedVal = dropChance * (drop.quantity || 1) * trueValue;
                    return { ...drop, trueValue, marketPrice, expectedVal };
                }) || []
            });
        }

        let filtered = searchTerm 
            ? calculated.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || (e.location?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
            : calculated;

        filtered.sort((a, b) => {
            if (!sortCol) return b.profitPerHour - a.profitPerHour;
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
    }, [staticData, marketData, usageMap, preferences.showEventDungeons, sortCol, sortDesc, searchTerm]);

    const [deepLinkHandled, setDeepLinkHandled] = useState(false);
    useEffect(() => {
        if (deepLinkHandled) return;
        const dungeonParam = searchParams.get("dungeon") || searchParams.get("search");
        if (dungeonParam && rows.length > 0 && !selectedDungeon) {
            const found = rows.find(r => r.name.toLowerCase() === dungeonParam.toLowerCase());
            if (found) {
                setSelectedDungeon(found);
                setDeepLinkHandled(true);
            }
        }
    }, [rows, selectedDungeon, deepLinkHandled, searchParams]);

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
                    <Castle size={24} color="var(--text-accent)" /> ZENITH DUNGEONS
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">{rows.length} DUNGEONS FILTERED</span>
                </div>
            </div>

            <div className="controls">
                <div className="control-group" style={{ flex: 1 }}>
                    <label className="control-label">SEARCH DUNGEONS</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="control-input"
                            placeholder="Search dungeon or location..."
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
                            <th className="sortable left-align" onClick={() => handleSort('name')}>DUNGEON {renderSortIcon('name')}</th>
                            <th className="sortable left-align" onClick={() => handleSort('location')}>LOCATION {renderSortIcon('location')}</th>
                            <th className="sortable" onClick={() => handleSort('durationMins')}>DURATION {renderSortIcon('durationMins')}</th>
                            <th className="sortable" onClick={() => handleSort('netProfitPerRun')}>PROFIT / RUN {renderSortIcon('netProfitPerRun')}</th>
                            <th className="sortable" onClick={() => handleSort('profitPerHour')}>PROFIT / HR {renderSortIcon('profitPerHour')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="clickable-row" onClick={() => setSelectedDungeon(row)}>
                                <td className="item-name left-align">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {row.image_url && <img src={row.image_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
                                        <span>{row.name}</span>
                                        {row.is_event && <span style={{fontSize:'0.6rem', color:'var(--text-accent)', border:'1px solid var(--text-accent)', padding:'1px 4px', borderRadius:'3px', marginLeft:'5px'}}>EVENT</span>}
                                    </div>
                                </td>
                                <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
                                <td className="mono">{row.durationMins}m</td>
                                <td className={`mono ${row.netProfitPerRun >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                    {row.netProfitPerRun >= 0 ? '+' : ''}{(row.netProfitPerRun || 0).toLocaleString(undefined, {maximumFractionDigits:0})}g
                                </td>
                                <td className={`mono font-bold ${row.profitPerHour >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                    {row.profitPerHour >= 0 ? '+' : ''}{(row.profitPerHour || 0).toLocaleString(undefined, {maximumFractionDigits:0})}g
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedDungeon && (
                <div className="modal-overlay" onClick={() => setSelectedDungeon(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {selectedDungeon.image_url && (
                                    <img src={selectedDungeon.image_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '6px' }} />
                                )}
                                <div>
                                    <h2 style={{ margin: 0 }}>{selectedDungeon.name}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                            <MapPin size={12} color="var(--text-accent)" /> {selectedDungeon.location?.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                            <Zap size={12} color="#f5b041" /> Difficulty: {selectedDungeon.difficulty}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedDungeon(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">ENTRY COST</div>
                                    <div className="stat-value" style={{ color: '#f87171' }}>-{selectedDungeon.entryCost.toLocaleString()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">DURATION</div>
                                    <div className="stat-value">{selectedDungeon.durationMins} Mins</div>
                                </div>
                                <div className="stat-card highlight">
                                    <div className="stat-label">NET PROFIT / RUN</div>
                                    <div className="stat-value" style={{ color: selectedDungeon.netProfitPerRun >= 0 ? 'var(--text-success)' : '#f87171' }}>
                                        {selectedDungeon.netProfitPerRun >= 0 ? '+' : ''}{(selectedDungeon.netProfitPerRun || 0).toLocaleString(undefined, {maximumFractionDigits:0})}g
                                    </div>
                                </div>
                            </div>
                            
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Loot Table</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {selectedDungeon.lootDetails?.sort((a:any, b:any) => (b.expectedVal || 0) - (a.expectedVal || 0)).map((drop: any, i: number) => (
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
                                                    ~{(drop.expectedVal || 0).toLocaleString(undefined, {maximumFractionDigits:0})}g <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>EV/run</span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                    View Market ({(drop.marketPrice || 0).toLocaleString()}g avg) <ExternalLink size={10} />
                                                </div>
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

export default function DungeonsPage() {
    return (
        <Suspense fallback={<div>Loading Dungeons...</div>}>
            <DungeonsContent />
        </Suspense>
    );
}
