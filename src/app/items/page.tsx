"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { Package, Search, ChevronRight, ExternalLink, FlaskConical, Beaker, Swords } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ALCHEMY_ITEMS, VIAL_COSTS } from '../../constants';

type ItemFilter = 'all' | 'profitable' | 'alchemy' | 'combat' | 'dungeons' | 'bosses';

function ItemsContent() {
    const searchParams = useSearchParams();
    const queryName = searchParams.get('name');
    
    const [staticData, setStaticData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<ItemFilter>('all');

    useEffect(() => {
        fetch('/static-data.json').then(r => r.json()).then(setStaticData);
        fetch('/market-data.json?t=' + Date.now()).then(r => r.json()).then(setMarketData);
    }, []);

    useEffect(() => {
        if (queryName) {
            setSelectedItemName(queryName);
            setSearchTerm(queryName);
        }
    }, [queryName]);

    const sourceTypesByItem = useMemo(() => {
        const map = new Map<string, Set<ItemFilter>>();
        if (!staticData) return map;

        const addSource = (itemName: string, source: ItemFilter) => {
            if (!map.has(itemName)) map.set(itemName, new Set());
            map.get(itemName)?.add(source);
        };

        staticData.enemies?.forEach((enemy: any) => {
            enemy.loot?.forEach((drop: any) => addSource(drop.name, 'combat'));
        });
        staticData.dungeons?.forEach((dungeon: any) => {
            dungeon.loot?.forEach((drop: any) => addSource(drop.name, 'dungeons'));
        });
        staticData.world_bosses?.forEach((boss: any) => {
            boss.loot?.forEach((drop: any) => addSource(drop.name, 'bosses'));
        });

        return map;
    }, [staticData]);

    const profitableAlchemyItems = useMemo(() => {
        const set = new Set<string>();
        if (!marketData) return set;

        for (const [recipeName, recipe] of Object.entries(ALCHEMY_ITEMS)) {
            const outputPrice = marketData[recipeName]?.avg_3 || 0;
            if (outputPrice <= 0) continue;

            let craftCost = VIAL_COSTS[recipe.vial] || 0;
            let hasAllPrices = true;
            for (const [matName, qty] of Object.entries(recipe.materials)) {
                const matPrice = marketData[matName]?.avg_3 || 0;
                if (matPrice <= 0) {
                    hasAllPrices = false;
                    break;
                }
                craftCost += matPrice * qty;
            }

            if (hasAllPrices && outputPrice * 0.88 > craftCost) set.add(recipeName);
        }

        return set;
    }, [marketData]);

    const allItems = marketData ? Object.keys(marketData).filter(item => !item.startsWith('_')).sort() : [];
    const filteredItems = allItems.filter(item => {
        if (!item.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (activeFilter === 'all') return true;
        if (activeFilter === 'alchemy') return Boolean(ALCHEMY_ITEMS[item]);
        if (activeFilter === 'profitable') return profitableAlchemyItems.has(item);
        return sourceTypesByItem.get(item)?.has(activeFilter) || false;
    });

    const mData = selectedItemName && marketData ? marketData[selectedItemName] : null;

    // Find combat sources
    let sources: any[] = [];
    if (staticData && selectedItemName) {
        staticData.enemies?.forEach((e: any) => {
            const drop = e.loot?.find((l: any) => l.name === selectedItemName);
            if (drop) sources.push({ type: 'Enemy', name: e.name, chance: drop.chance, location: e.location?.name, link: '/combat' });
        });
        staticData.dungeons?.forEach((d: any) => {
            const drop = d.loot?.find((l: any) => l.name === selectedItemName);
            if (drop) sources.push({ type: 'Dungeon', name: d.name, chance: drop.chance, location: d.location?.name, link: '/dungeons' });
        });
        staticData.world_bosses?.forEach((b: any) => {
            const drop = b.loot?.find((l: any) => l.name === selectedItemName);
            if (drop) sources.push({ type: 'World Boss', name: b.name, chance: drop.chance, location: b.location?.name, link: '/bosses' });
        });
    }

    // Find alchemy recipes that use this item as a material
    let usedInRecipes: { name: string; qty: number }[] = [];
    if (selectedItemName) {
        for (const [recipeName, recipe] of Object.entries(ALCHEMY_ITEMS)) {
            const qty = recipe.materials[selectedItemName];
            if (qty) usedInRecipes.push({ name: recipeName, qty });
        }
    }

    // Find if this item IS an alchemy recipe output
    const alchemyRecipe = selectedItemName ? ALCHEMY_ITEMS[selectedItemName] : null;

    return (
        <main style={{ display: 'flex', gap: '1.5rem', height: '100vh', overflow: 'hidden', padding: '1.5rem 2rem' }} className="items-layout">
            {/* Left panel */}
            <div className="items-sidebar">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                    <Package size={18} color="var(--text-accent)" /> Items DB
                </h2>
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        className="control-input"
                        style={{ width: '100%', paddingLeft: '2.2rem' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    {[
                        ['all', 'All'],
                        ['profitable', 'Profit'],
                        ['alchemy', 'Alchemy'],
                        ['combat', 'Combat'],
                        ['dungeons', 'Dungeons'],
                        ['bosses', 'Bosses'],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            className={`filter-btn ${activeFilter === key ? 'filter-btn-active' : ''}`}
                            onClick={() => setActiveFilter(key as ItemFilter)}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    {filteredItems.map(item => (
                        <button 
                            key={item}
                            onClick={() => setSelectedItemName(item)}
                            style={{
                                textAlign: 'left', padding: '0.45rem 0.7rem', borderRadius: '5px', border: '1px solid transparent',
                                background: selectedItemName === item ? 'rgba(245, 176, 65, 0.08)' : 'transparent',
                                borderColor: selectedItemName === item ? 'var(--border-focus)' : 'transparent',
                                color: selectedItemName === item ? '#fff' : 'var(--text-muted)',
                                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                transition: 'all 0.12s ease', fontSize: '0.85rem'
                            }}
                            onMouseEnter={e => { if (selectedItemName !== item) { (e.target as any).style.background = 'rgba(255,255,255,0.03)'; (e.target as any).style.color = '#fff'; }}}
                            onMouseLeave={e => { if (selectedItemName !== item) { (e.target as any).style.background = 'transparent'; (e.target as any).style.color = 'var(--text-muted)'; }}}
                        >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                            {selectedItemName === item && <ChevronRight size={13} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right panel */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {selectedItemName ? (
                    mData ? (
                        <div>
                            {/* Item header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    {mData.image_url && (
                                        <div style={{ width: '56px', height: '56px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <img src={mData.image_url} alt={selectedItemName} style={{ maxWidth: '40px', maxHeight: '40px' }} />
                                        </div>
                                    )}
                                    <div>
                                        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{selectedItemName}</h1>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            Last Updated: {new Date(mData.last_updated).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                {mData.hashed_id && (
                                    <a 
                                        href={`https://web.idle-mmo.com/item/inspect/${mData.hashed_id}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '0.45rem 0.9rem', background: 'rgba(245, 176, 65, 0.12)', color: 'var(--text-accent)', 
                                            borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(245, 176, 65, 0.2)',
                                            transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <ExternalLink size={14} /> Inspect In-Game
                                    </a>
                                )}
                            </div>
                            
                            {/* Price cards */}
                            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Vendor Price</div>
                                    <div className="stat-value mono">{mData.vendor_price > 0 ? `${mData.vendor_price.toLocaleString()}g` : 'N/A'}</div>
                                </div>
                                <div className="stat-card highlight">
                                    <div className="stat-label">3-Day Avg</div>
                                    <div className="stat-value mono">{mData.avg_3 ? `${mData.avg_3.toLocaleString()}g` : 'N/A'}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">3D Volume</div>
                                    <div className="stat-value mono">{mData.vol_3 ? mData.vol_3.toLocaleString() : '0'} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>sold</span></div>
                                </div>
                            </div>

                            {/* Extended averages */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                                {[
                                    { label: '7D Avg', val: mData.avg_7 },
                                    { label: '14D Avg', val: mData.avg_14 },
                                    { label: '30D Avg', val: mData.avg_30 },
                                ].map(d => (
                                    <div key={d.label} className="stat-card" style={{ background: 'transparent' }}>
                                        <div className="stat-label">{d.label}</div>
                                        <div className="stat-value mono" style={{ fontSize: '1.05rem' }}>{d.val ? d.val.toLocaleString() : '-'}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Alchemy Recipe Breakdown */}
                            {alchemyRecipe && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FlaskConical size={16} color="var(--text-accent)" /> Crafting Recipe
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {Object.entries(alchemyRecipe.materials).map(([matName, qty]) => {
                                            const matPrice = marketData?.[matName]?.avg_3 || 0;
                                            return (
                                                <Link 
                                                    key={matName} 
                                                    href={`/items?name=${encodeURIComponent(matName)}`}
                                                    className="source-row"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span className="text-muted">{qty}x</span>
                                                        <span style={{ color: '#fff', fontWeight: 500 }}>{matName}</span>
                                                    </div>
                                                    <div className="mono" style={{ fontSize: '0.8rem' }}>
                                                        <span className="text-muted">{matPrice.toLocaleString()}g ea</span>
                                                        <span style={{ margin: '0 0.4rem', color: 'var(--border-focus)' }}>-&gt;</span>
                                                        <span style={{ color: 'var(--text-accent)' }}>{(matPrice * qty).toLocaleString()}g</span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                            <span className="text-muted">Vial: {alchemyRecipe.vial}</span>
                                            <span className="mono">{(VIAL_COSTS[alchemyRecipe.vial] || 0).toLocaleString()}g</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <span>Total Craft Cost</span>
                                            <span className="mono" style={{ color: 'var(--text-accent)' }}>
                                                {(Object.entries(alchemyRecipe.materials).reduce((sum, [m, q]) => sum + (marketData?.[m]?.avg_3 || 0) * q, 0) + (VIAL_COSTS[alchemyRecipe.vial] || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}g
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Used in recipes */}
                            {usedInRecipes.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Beaker size={16} color="var(--text-accent)" /> Used in Alchemy
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {usedInRecipes.map(r => (
                                            <Link 
                                                key={r.name} 
                                                href={`/items?name=${encodeURIComponent(r.name)}`}
                                                className="source-row"
                                            >
                                                <span style={{ color: '#fff', fontWeight: 500 }}>{r.name}</span>
                                                <span className="mono text-muted" style={{ fontSize: '0.8rem' }}>uses {r.qty}x</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Drop Sources */}
                            <h3 style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Swords size={16} color="var(--text-accent)" /> Drop Sources
                            </h3>
                            {sources.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {sources.map((s, i) => (
                                        <Link 
                                            key={i} 
                                            href={s.link}
                                            className="source-row"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span className="action-badge action-vendor" style={{ minWidth: 0, padding: '0.15rem 0.4rem', fontSize: '0.6rem' }}>{s.type}</span>
                                                <span style={{ color: '#fff', fontWeight: 500 }}>{s.name}</span>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{s.location}</span>
                                            </div>
                                            <span className="mono" style={{ color: 'var(--text-accent)', fontSize: '0.85rem' }}>{s.chance}%</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No known combat drop sources. (Might be crafted, gathered, or quest-only)</p>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                            <h3>Item not found in market cache</h3>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>The scraper may not have fetched it yet, or it is untradable.</p>
                        </div>
                    )
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.15 }} />
                        <h3>Select an item</h3>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Search the database to view pricing and drop source data.</p>
                    </div>
                )}
            </div>

        </main>
    );
}

export default function ItemsPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', color: '#fff' }}>Loading DB...</div>}>
            <ItemsContent />
        </Suspense>
    );
}
