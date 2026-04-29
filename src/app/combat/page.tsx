"use client";
import { useEffect, useState, useMemo } from "react";
import { Swords, Activity, X, Info, ChevronDown, ChevronUp, Search } from "lucide-react";
import Link from 'next/link';
import { usePreferences } from "@/lib/preferences";

export default function CombatPage() {
    const [staticData, setStaticData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const { preferences, setPreferences } = usePreferences();
    const [selectedEnemy, setSelectedEnemy] = useState<any>(null);
    const [sortCol, setSortCol] = useState<string>("");
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const search = new URLSearchParams(window.location.search).get("search");
        if (search) setSearchTerm(search);
    }, []);

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
        const parsedKph = Number(preferences.killsPerHour) || 0;

        for (const enemy of staticData.enemies) {
            const chanceOfLoot = (enemy.chance_of_loot || 0) / 100;
            let evPerKill = 0;

            if (enemy.loot) {
                for (const drop of enemy.loot) {
                    const mData = marketData[drop.name];
                    const price = mData ? mData.avg_3 : 0;
                    // Formula: (Drop Chance / 100) * Quantity * Market Price
                    const dropChance = (drop.chance || 0) / 100;
                    evPerKill += dropChance * (drop.quantity || 1) * price;
                }
            }
            
            // Multiply by the base chance of getting ANY loot (if that's how IdleMMO works, 
            // usually it is base_chance * individual_chances, but some games treat them as independent.
            // Based on the screenshot math earlier, the total EV is multiplied by Loot Chance)
            const finalEv = evPerKill * chanceOfLoot;

            calculated.push({
                ...enemy, // Keep full enemy data for modal
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

        // Filter by search
        const filtered = searchTerm 
            ? calculated.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || (e.location?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
            : calculated;

        // Sort
        filtered.sort((a, b) => {
            if (!sortCol) return b.ev - a.ev;
            let valA = a[sortCol] || 0;
            let valB = b[sortCol] || 0;
            if (sortCol === 'name' || sortCol === 'location') {
                valA = sortCol === 'location' ? (a.location?.name || '') : a.name;
                valB = sortCol === 'location' ? (b.location?.name || '') : b.name;
            }
            if (valA < valB) return sortDesc ? 1 : -1;
            if (valA > valB) return sortDesc ? -1 : 1;
            return 0;
        });
        return filtered;
    }, [staticData, marketData, preferences.killsPerHour, sortCol, sortDesc, searchTerm]);

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
                            setPreferences({ killsPerHour: Math.max(0, Number(e.target.value) || 0) });
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
                            placeholder="Enemy or location..."
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
                        {rows.slice(0, 50).map((row, i) => (
                            <tr key={i} className="clickable-row" onClick={() => setSelectedEnemy(row)}>
                                <td className="item-name left-align">{row.name}</td>
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
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <Activity className="animate-spin" style={{ margin: '0 auto', marginBottom: '1rem' }} />
                                    Loading Combat Data & Real-Time Market Prices...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
                                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnemy.location?.name} • Level {selectedEnemy.level} • {selectedEnemy.health} HP
                                    </span>
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
                                    <div key={i} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                                        borderRadius: '6px'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#fff' }}>{drop.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>x{drop.quantity || 1}</span></div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{drop.chance}% Drop Rate</div>
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
