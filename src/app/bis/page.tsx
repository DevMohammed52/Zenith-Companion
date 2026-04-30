"use client";
import { useEffect, useState, useMemo } from "react";
import { Shield, Sword, Target, Zap, HardHat, Layers, MoveDown, ArrowDown, Hand, ExternalLink, ShoppingCart, Info, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

// Maps API type → display config
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
};

const QUALITY_COLOR: Record<string, string> = {
    LEGENDARY: "#f5b041",
    MYTHIC:    "#a78bfa",
    EPIC:      "#818cf8",
    RARE:      "#38bdf8",
    COMMON:    "#a1a1aa",
};

const SORT_OPTIONS = [
    { key: "auto",          label: "Auto (ATK/DEF)" },
    { key: "total",         label: "Total Power" },
    { key: "attack_power",  label: "Attack Power" },
    { key: "protection",    label: "Protection" },
    { key: "agility",       label: "Agility" },
    { key: "accuracy",      label: "Accuracy" },
    { key: "critical_damage", label: "Crit Damage" },
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
    strength_req: number | null;
    requirements: Record<string, number> | null;
    stats: Record<string, number> | null;
    effects: any[] | null;
    max_tier: number | null;
    recipe_hashed_id: string;
}

function getRankValue(item: GearItem, sortKey: string, defaultStat: string): number {
    if (!item.stats) return 0;
    if (sortKey === "auto") return item.stats[defaultStat] || 0;
    if (sortKey === "total") return Object.values(item.stats).reduce((s, v) => s + v, 0);
    return item.stats[sortKey] || 0;
}

export default function BISPage() {
    const [gearData, setGearData]     = useState<Record<string, GearItem> | null>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const [combatLevel, setCombatLevel] = useState<number | "">(80);
    const [sortBy, setSortBy]         = useState("auto");
    const [isLoaded, setIsLoaded]     = useState(false);
    const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

    useEffect(() => {
        const savedLevel = localStorage.getItem("zenith_bis_level");
        const savedSort  = localStorage.getItem("zenith_bis_sort");
        if (savedLevel !== null) setCombatLevel(Number(savedLevel));
        if (savedSort  !== null) setSortBy(savedSort);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("zenith_bis_level", combatLevel.toString());
        localStorage.setItem("zenith_bis_sort", sortBy);
    }, [combatLevel, sortBy, isLoaded]);

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

    const level = Number(combatLevel) || 1;

    const bisSet = useMemo(() => {
        if (!gearData) return {};
        const groups: Record<string, GearItem[]> = {};
        for (const item of Object.values(gearData)) {
            if (!SLOT_CONFIG[item.type]) continue;
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        }

        const result: Record<string, { best: GearItem; alts: GearItem[]; nextUp: GearItem | null }> = {};
        for (const [type, items] of Object.entries(groups)) {
            const defaultStat = SLOT_CONFIG[type].defaultStat;
            const sorter = (a: GearItem, b: GearItem) => getRankValue(b, sortBy, defaultStat) - getRankValue(a, sortBy, defaultStat);

            const eligible = items.filter(i => i.combat_req === null || i.combat_req <= level).sort(sorter);
            const locked   = items.filter(i => i.combat_req !== null && i.combat_req > level).sort((a, b) => (a.combat_req || 0) - (b.combat_req || 0));

            if (eligible.length === 0) continue;
            result[type] = { best: eligible[0], alts: eligible.slice(1, 5), nextUp: locked[0] || null };
        }
        return result;
    }, [gearData, level, sortBy]);

    const slotOrder = ["SWORD", "DAGGER", "BOW", "SHIELD", "HELMET", "CHESTPLATE", "GREAVES", "BOOTS", "GAUNTLETS"];

    const getPrice = (item: GearItem): number | null => marketData?.[item.name]?.avg_3 || null;

    // Power score = sum of all stats for best item in each slot
    const totalPower = Object.values(bisSet).reduce((sum, { best }) =>
        sum + Object.values(best.stats || {}).reduce((s, v) => s + v, 0), 0);

    // Set cost breakdown
    const setCostItems = useMemo(() => {
        return slotOrder
            .filter(t => bisSet[t])
            .map(t => ({ type: t, item: bisSet[t].best, price: getPrice(bisSet[t].best) }));
    }, [bisSet, marketData]);

    const totalSetCost = setCostItems.reduce((sum, { price }) => sum + (price || 0), 0);
    const missingPrices = setCostItems.filter(({ price }) => !price).length;

    if (!gearData) {
        return (
            <main className="container">
                <div className="header">
                    <h1 className="header-title"><Shield size={24} color="var(--text-accent)" /> BEST-IN-SLOT</h1>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Shield size={48} style={{ margin: '0 auto 1rem', opacity: 0.15 }} />
                    <p>Loading gear database...</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Run <code style={{ background: 'var(--bg-card)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>node --env-file=.env fetch-gear-data.mjs</code> if gear-data.json is missing.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="container">
            <div className="header">
                <h1 className="header-title">
                    <Shield size={24} color="var(--text-accent)" /> BEST-IN-SLOT
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">POWER: {totalPower.toLocaleString()}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="controls" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="control-group">
                    <label className="control-label">Combat Level</label>
                    <input
                        type="number"
                        className="control-input"
                        min={1} max={200}
                        value={combatLevel}
                        onChange={e => setCombatLevel(e.target.value === "" ? "" : Math.max(1, Math.min(200, Number(e.target.value))))}
                        style={{ maxWidth: '100px' }}
                    />
                </div>
                <div className="control-group">
                    <label className="control-label">Rank Items By</label>
                    <div style={{ position: 'relative' }}>
                        <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '11px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <select
                            className="control-input"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{ paddingRight: '2rem', appearance: 'none', cursor: 'pointer', minWidth: '160px' }}
                        >
                            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    <Info size={13} />
                    Power = sum of all stat values for your current BiS set
                </div>
            </div>

            {/* Gear grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
                {slotOrder.map(type => {
                    const entry = bisSet[type];
                    const cfg   = SLOT_CONFIG[type];
                    if (!cfg) return null;
                    const isExpanded = expandedSlots.has(type);

                    return (
                        <div key={type} className="table-container" style={{ padding: '1.25rem' }}>
                            {/* Slot header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-accent)' }}>
                                    {cfg.icon}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.07em', fontWeight: 600 }}>{cfg.label.toUpperCase()}</span>
                                </div>
                                {entry && entry.alts.length > 0 && (
                                    <button
                                        onClick={() => toggleSlot(type)}
                                        style={{ fontSize: '0.68rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                        {entry.alts.length} alt{entry.alts.length !== 1 ? 's' : ''}
                                    </button>
                                )}
                            </div>

                            {!entry ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    No gear available at Level {level}
                                </div>
                            ) : (
                                <>
                                    <GearCard item={entry.best} price={getPrice(entry.best)} sortBy={sortBy} cfg={cfg} isBest />

                                    {isExpanded && entry.alts.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '0.4rem 0 0.1rem' }}>ALTERNATIVES</div>
                                            {entry.alts.map(alt => (
                                                <GearCard key={alt.hashed_id} item={alt} price={getPrice(alt)} sortBy={sortBy} cfg={cfg} isBest={false} />
                                            ))}
                                        </div>
                                    )}

                                    {entry.nextUp && (
                                        <div style={{ marginTop: '0.6rem', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>NEXT UPGRADE</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{entry.nextUp.name}</span>
                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-accent)', marginLeft: '0.5rem' }}>@ Lv.{entry.nextUp.combat_req}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        {getPrice(entry.nextUp) ? getPrice(entry.nextUp)!.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g' : '—'}
                                                    </span>
                                                    <Link href={`/items?name=${encodeURIComponent(entry.nextUp.name)}`} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                                        <ExternalLink size={11} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Full set cost breakdown */}
            <div className="table-container" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingCart size={16} color="var(--text-accent)" /> Full Set Cost Breakdown
                    </h2>
                    {missingPrices > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {missingPrices} item{missingPrices !== 1 ? 's' : ''} without market price
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {setCostItems.map(({ type, item, price }) => {
                        const cfg = SLOT_CONFIG[type];
                        const totalStats = Object.values(item.stats || {}).reduce((s, v) => s + v, 0);
                        return (
                            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', width: '16px', justifyContent: 'center' }}>{cfg.icon}</div>
                                <div style={{ width: '80px', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{cfg.label}</div>
                                <div style={{ flex: 1, fontWeight: 500, color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    PWR {totalStats}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '100px', justifyContent: 'flex-end' }}>
                                    <span className="mono" style={{ fontSize: '0.88rem', color: price ? 'var(--text-success)' : 'var(--text-muted)' }}>
                                        {price ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g' : '—'}
                                    </span>
                                    <Link href={`/items?name=${encodeURIComponent(item.name)}`} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                        <ExternalLink size={11} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Total Set Cost</span>
                        <div style={{ textAlign: 'right' }}>
                            <span className="mono" style={{ color: 'var(--text-accent)', fontWeight: 700, fontSize: '1.1rem' }}>
                                {totalSetCost > 0 ? totalSetCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g' : '—'}
                            </span>
                            {missingPrices > 0 && totalSetCost > 0 && (
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                    + {missingPrices} item{missingPrices !== 1 ? 's' : ''} without data
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// --- Gear Card Component ---
function GearCard({ item, price, sortBy, cfg, isBest }: {
    item: GearItem;
    price: number | null;
    sortBy: string;
    cfg: { label: string; defaultStat: string; icon: React.ReactNode };
    isBest: boolean;
}) {
    const qualityColor = QUALITY_COLOR[item.quality] || '#a1a1aa';
    const rankStat = sortBy === "auto" ? cfg.defaultStat : sortBy === "total" ? null : sortBy;
    const mainValue = rankStat ? (item.stats?.[rankStat] || 0) : Object.values(item.stats || {}).reduce((s, v) => s + v, 0);

    return (
        <div style={{
            padding: '0.75rem',
            background: isBest ? 'rgba(245,176,65,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isBest ? 'rgba(245,176,65,0.18)' : 'var(--border-subtle)'}`,
            borderRadius: '8px',
        }}>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                {item.image_url && (
                    <div style={{ width: '38px', height: '38px', flexShrink: 0, background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={item.image_url} alt={item.name} style={{ maxWidth: '28px', maxHeight: '28px' }} />
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: qualityColor }}>{item.quality}</span>
                                {item.combat_req && (
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Lv.{item.combat_req} / STR {item.strength_req}</span>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isBest ? 'var(--text-accent)' : 'var(--text-muted)' }}>
                                {mainValue} {rankStat ? (STAT_LABELS[rankStat] || rankStat) : 'PWR'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: price ? 'var(--text-success)' : 'var(--text-muted)', marginTop: '0.1rem' }}>
                                {price ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g' : '—'}
                            </div>
                        </div>
                    </div>

                    {/* Stat pills */}
                    {item.stats && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.45rem' }}>
                            {Object.entries(item.stats).map(([stat, val]) => {
                                const isHighlighted = stat === rankStat;
                                return (
                                    <span key={stat} style={{
                                        fontSize: '0.6rem', padding: '0.1rem 0.35rem',
                                        background: isHighlighted ? 'rgba(245,176,65,0.15)' : 'rgba(255,255,255,0.04)',
                                        color: isHighlighted ? 'var(--text-accent)' : 'var(--text-muted)',
                                        borderRadius: '3px',
                                        border: `1px solid ${isHighlighted ? 'rgba(245,176,65,0.2)' : 'var(--border-subtle)'}`,
                                        fontWeight: isHighlighted ? 700 : 400,
                                    }}>
                                        {STAT_LABELS[stat] || stat} {val}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Links */}
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem' }}>
                        <Link href={`/items?name=${encodeURIComponent(item.name)}`}
                            style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderRadius: '3px', textDecoration: 'none', border: '1px solid var(--border-subtle)' }}>
                            Market
                        </Link>
                        <a href={`https://web.idle-mmo.com/item/inspect/${item.hashed_id}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderRadius: '3px', textDecoration: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ExternalLink size={9} /> Game
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
