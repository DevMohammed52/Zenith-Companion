"use client";
import { useEffect, useState, useMemo } from "react";
import { Shield, Sword, Target, Zap, HardHat, Layers, MoveDown, ArrowDown, Hand, ExternalLink, ShoppingCart, Info, ChevronDown, ChevronUp, Swords, Crosshair } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/lib/preferences";
import { useItemModal } from "@/context/ItemModalContext";

const SLOT_CONFIG: Record<string, { label: string; defaultStat: string; icon: React.ReactNode }> = {
    SWORD:      { label: "Sword",      defaultStat: "attack_power", icon: <Sword size={15} /> },
    DAGGER:     { label: "Dagger",     defaultStat: "attack_power", icon: <Zap size={15} /> },
    BOW:        { label: "Bow",        defaultStat: "attack_power", icon: <Target size={15} /> },
    SHIELD:     { label: "Shield",     defaultStat: "protection",   icon: <Shield size={15} /> },
    HELMET:     { label: "Helmet",     defaultStat: "protection",   icon: <HardHat size={15} /> },
    CHESTPLATE: { label: "Chestplate", defaultStat: "protection",   icon: <Layers size={15} /> },
    GREAVES:    { label: "Greaves",    defaultStat: "protection",   icon: <MoveDown size={15} /> },
    BOOTS:      { label: "Boots",      defaultStat: "protection",   icon: <ArrowDown size={15} /> },
    GAUNTLETS:  { label: "Gauntlets",  defaultStat: "protection",   icon: <Hand size={15} /> },
};

const STAT_LABELS: Record<string, string> = {
    attack_power:    "ATK",
    protection:      "DEF",
    agility:         "AGI",
    accuracy:        "ACC",
    critical_damage: "CRIT",
    movement_speed:  "SPD",
    critical_chance: "CRIT CHANCE",
};

const QUALITY_COLOR: Record<string, string> = {
    LEGENDARY: "var(--text-accent)",
    MYTHIC:    "#a78bfa",
    EPIC:      "#818cf8",
    RARE:      "#38bdf8",
    COMMON:    "#a1a1aa",
};

const COMBAT_STYLES = [
    { id: "sword_shield", label: "Sword + Shield", icon: <Shield size={14} /> },
    { id: "dual_daggers", label: "Dual Daggers",   icon: <Zap size={14} /> },
    { id: "bow",          label: "Single Bow",     icon: <Target size={14} /> },
];

interface GearItem {
    name: string;
    hashed_id: string;
    type: string;
    quality: string;
    image_url: string;
    vendor_price: number;
    is_tradeable: boolean;
    combat_req: number | null;
    requirements: Record<string, number> | null;
    stats: Record<string, number> | null;
    effects: any[] | null;
    max_tier: number | null;
    recipe_hashed_id: string;
}

function getRankValue(item: GearItem, sortKey: string, defaultStat: string, marketData: any): number {
    if (sortKey === "price") {
        const p = marketData?.[item.name]?.avg_3;
        return p ? -p : -999999999;
    }
    if (!item.stats) return 0;
    if (sortKey === "auto") return item.stats[defaultStat] || 0;
    if (sortKey === "total") return Object.values(item.stats).reduce((s, v) => s + v, 0);
    return item.stats[sortKey] || 0;
}

export default function BISPage() {
    const { openItemByName, prefetchItem } = useItemModal();
    const [gearData, setGearData]     = useState<Record<string, GearItem> | null>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const { preferences, setPreferences } = usePreferences();
    
    const [sortBy, setSortBy]         = useState("auto");
    const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch("/gear-data.json?t=" + Date.now()).then(r => r.json()).then(setGearData).catch(() => {});
        const fetchMarket = async () => {
            try {
                const res = await fetch("/market-data.json?t=" + Date.now());
                if (res.ok) setMarketData(await res.json());
            } catch {}
        };
        fetchMarket();
        const iv = setInterval(fetchMarket, 5000);
        return () => clearInterval(iv);
    }, []);

    const toggleSlot = (type: string) => {
        setExpandedSlots(prev => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type); else next.add(type);
            return next;
        });
    };

    const bisSet = useMemo(() => {
        if (!gearData) return {};
        const level = Number(preferences.combatLevel) || 0;
        const str = Number(preferences.strStat) || 0;
        const dex = Number(preferences.dexStat) || 0;
        const def = Number(preferences.defStat) || 0;

        const groups: Record<string, GearItem[]> = {};
        for (const item of Object.values(gearData)) {
            if (!SLOT_CONFIG[item.type]) continue;
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        }

        const result: Record<string, { best: GearItem; alts: GearItem[]; nextUp: GearItem | null }> = {};
        for (const [type, items] of Object.entries(groups)) {
            const defaultStat = SLOT_CONFIG[type].defaultStat;
            const sorter = (a: GearItem, b: GearItem) => 
                getRankValue(b, sortBy, defaultStat, marketData) - getRankValue(a, sortBy, defaultStat, marketData);

            const eligible = items.filter(i => {
                if (i.combat_req !== null && i.combat_req > level) return false;
                if (i.requirements) {
                    if (i.requirements.strength !== undefined && i.requirements.strength > str) return false;
                    if (i.requirements.dexterity !== undefined && i.requirements.dexterity > dex) return false;
                    if (i.requirements.defence !== undefined && i.requirements.defence > def) return false;
                }
                return true;
            }).sort(sorter);

            const locked = items.filter(i => i.combat_req !== null && i.combat_req > level)
                .sort((a, b) => (a.combat_req || 0) - (b.combat_req || 0));

            if (eligible.length === 0) continue;
            result[type] = { best: eligible[0], alts: eligible.slice(1, 5), nextUp: locked[0] || null };
        }
        return result;
    }, [gearData, preferences.combatLevel, preferences.strStat, preferences.dexStat, preferences.defStat, sortBy, marketData]);

    const activeSlots = useMemo(() => {
        const slots = ["HELMET", "CHESTPLATE", "GREAVES", "BOOTS", "GAUNTLETS"];
        if (preferences.combatStyle === "sword_shield") {
            slots.unshift("SWORD", "SHIELD");
        } else if (preferences.combatStyle === "dual_daggers") {
            slots.unshift("DAGGER");
        } else if (preferences.combatStyle === "bow") {
            slots.unshift("BOW");
        }
        return slots;
    }, [preferences.combatStyle]);

    const getPrice = (item: GearItem | undefined): number | null => {
        if (!item || !item.name) return null;
        return marketData?.[item.name]?.avg_3 || null;
    };

    const totalPower = useMemo(() => {
        let sum = 0;
        for (const slot of activeSlots) {
            const item = bisSet[slot]?.best;
            if (item && item.stats) {
                const itemPower = Object.values(item.stats).reduce((s, v) => s + v, 0);
                sum += (slot === "DAGGER" && preferences.combatStyle === "dual_daggers") ? itemPower * 2 : itemPower;
            }
        }
        return sum;
    }, [bisSet, activeSlots, preferences.combatStyle]);

    if (!gearData) {
        return <main className="container"><div className="header"><h1 className="header-title">LOADING...</h1></div></main>;
    }

    const handleNumChange = (key: string, val: string) => {
        setPreferences({ [key]: val === "" ? "" : Number(val) });
    };

    const clamp = (key: string, min: number, max: number) => {
        if (preferences[key as keyof typeof preferences] !== "") {
            setPreferences({ [key]: Math.max(min, Math.min(max, Number(preferences[key as keyof typeof preferences]))) });
        }
    };

    return (
        <main className="container">
            <div className="header">
                <h1 className="header-title"><Shield size={24} color="var(--text-accent)" /> BEST-IN-SLOT</h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">SET POWER: {totalPower.toLocaleString()}</span>
                </div>
            </div>

            <div className="controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1.5rem' }}>
                <div className="control-group">
                    <label className="control-label">Level (60-96)</label>
                    <input type="number" className="control-input" value={preferences.combatLevel} 
                        onChange={e => handleNumChange('combatLevel', e.target.value)}
                        onBlur={() => clamp('combatLevel', 60, 96)}
                    />
                </div>
                <div className="control-group">
                    <label className="control-label">STR Stat (0-100)</label>
                    <input type="number" className="control-input" value={preferences.strStat} onChange={e => handleNumChange('strStat', e.target.value)} onBlur={() => clamp('strStat', 0, 100)} />
                </div>
                <div className="control-group">
                    <label className="control-label">DEX Stat (0-100)</label>
                    <input type="number" className="control-input" value={preferences.dexStat} onChange={e => handleNumChange('dexStat', e.target.value)} onBlur={() => clamp('dexStat', 0, 100)} />
                </div>
                <div className="control-group">
                    <label className="control-label">DEF Stat (0-100)</label>
                    <input type="number" className="control-input" value={preferences.defStat} onChange={e => handleNumChange('defStat', e.target.value)} onBlur={() => clamp('defStat', 0, 100)} />
                </div>
                <div className="control-group">
                    <label className="control-label">Combat Style</label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {COMBAT_STYLES.map(s => (
                            <button key={s.id} onClick={() => setPreferences({ combatStyle: s.id })} style={{
                                flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-subtle)',
                                background: preferences.combatStyle === s.id ? 'var(--text-accent)' : 'var(--bg-card)',
                                color: preferences.combatStyle === s.id ? '#000' : 'var(--text-muted)',
                                cursor: 'pointer', transition: '0.2s', fontSize: '0.7rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                            }}>
                                {s.icon} {s.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
                {activeSlots.map(type => {
                    const entry = bisSet[type];
                    const cfg   = SLOT_CONFIG[type];
                    if (!cfg) return null;
                    const isExpanded = expandedSlots.has(type);

                    return (
                        <div key={type} className="table-container" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-accent)' }}>
                                    {cfg.icon}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.07em', fontWeight: 600 }}>
                                        {cfg.label.toUpperCase()} {type === "DAGGER" && preferences.combatStyle === "dual_daggers" && "(DUAL)"}
                                    </span>
                                </div>
                                {entry && entry.alts.length > 0 && (
                                    <button onClick={() => toggleSlot(type)} style={{ fontSize: '0.68rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem 0.5rem' }}>
                                        {isExpanded ? "Close" : `${entry.alts.length} Alts`}
                                    </button>
                                )}
                            </div>
                            {!entry ? <div className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No items meet your requirements</div> : (
                                <>
                                    <GearCard item={entry.best} price={getPrice(entry.best)} sortBy={sortBy} cfg={cfg} isBest openItem={openItemByName} prefetch={prefetchItem} />
                                    {isExpanded && entry.alts.map(alt => <GearCard key={alt.hashed_id} item={alt} price={getPrice(alt)} sortBy={sortBy} cfg={cfg} isBest={false} openItem={openItemByName} prefetch={prefetchItem} />)}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="table-container" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingCart size={16} color="var(--text-accent)" /> Full Set Cost Breakdown
                    </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {activeSlots.map(type => {
                        const item = bisSet[type]?.best;
                        if (!item) return null;
                        const cfg = SLOT_CONFIG[type];
                        const price = getPrice(item);
                        const isDual = type === "DAGGER" && preferences.combatStyle === "dual_daggers";
                        const totalStats = Object.values(item.stats || {}).reduce((s, v) => s + v, 0);

                        return (
                            <div 
                                key={type} 
                                onClick={() => openItemByName(item.name)}
                                onMouseEnter={() => prefetchItem(item.name)}
                                className="clickable-row group"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                            >
                                <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', width: '16px', justifyContent: 'center' }}>{cfg.icon}</div>
                                <div style={{ width: '85px', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{cfg.label}{isDual && " (x2)"}</div>
                                <div className="group-hover:text-accent transition-colors" style={{ flex: 1, fontWeight: 500, color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '60px' }}>
                                    PWR {isDual ? totalStats * 2 : totalStats}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '110px', justifyContent: 'flex-end' }}>
                                    <span className="mono" style={{ fontSize: '0.88rem', color: price ? 'var(--text-success)' : 'var(--text-muted)' }}>
                                        {price ? (isDual ? price * 2 : price).toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g' : '—'}
                                    </span>
                                    <div style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                        <ExternalLink size={11} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Estimated Total Cost</span>
                        <div style={{ textAlign: 'right' }}>
                            <span className="mono" style={{ color: 'var(--text-accent)', fontWeight: 700, fontSize: '1.1rem' }}>
                                {(() => {
                                    let total = 0;
                                    activeSlots.forEach(type => {
                                        const p = getPrice(bisSet[type]?.best);
                                        if (p) total += (type === "DAGGER" && preferences.combatStyle === "dual_daggers") ? p * 2 : p;
                                    });
                                    return total > 0 ? total.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g' : '—';
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function GearCard({ item, price, sortBy, cfg, isBest, openItem, prefetch }: { item: GearItem; price: number | null; sortBy: string; cfg: any; isBest: boolean; openItem: any; prefetch: any }) {
    const qualityColor = QUALITY_COLOR[item.quality] || '#a1a1aa';
    const totalStats = Object.values(item.stats || {}).reduce((s, v) => s + v, 0);

    return (
        <div 
            onClick={() => openItem(item.name)}
            onMouseEnter={() => prefetch(item.name)}
            className="gear-card group"
            style={{
                padding: '0.75rem', marginTop: isBest ? 0 : '0.5rem',
                background: isBest ? 'rgba(245,176,65,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isBest ? 'rgba(245,176,65,0.18)' : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{ display: 'flex', gap: '0.65rem' }}>
                <img src={item.image_url} alt={item.name} style={{ width: '38px', height: '38px', borderRadius: '4px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="group-hover:text-accent transition-colors" style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{item.name}</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{totalStats} PWR</div>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: qualityColor, fontWeight: 700, marginTop: '0.1rem' }}>{item.quality} • LV.{item.combat_req}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.45rem' }}>
                        {Object.entries(item.stats || {}).map(([s, v]) => (
                            <span key={s} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', color: 'var(--text-muted)' }}>
                                {s.replace('_', ' ').toUpperCase()} {v}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .gear-card:hover {
                    border-color: var(--text-accent) !important;
                    background: rgba(245,176,65,0.1) !important;
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
}
