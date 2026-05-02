"use client";
import { useEffect, useState, useMemo } from "react";
import { FlaskConical, ShoppingCart, Trash2, Plus, Minus, ChevronDown, Package } from "lucide-react";
import Link from "next/link";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../../constants";
import { useItemModal } from "@/context/ItemModalContext";
import { useCrafting } from "@/context/CraftingContext";

export default function CraftingPage() {
    const { openItemByName, prefetchItem } = useItemModal();
    const { queue, setQueueQty, addToQueue, clearQueue } = useCrafting();
    const [marketData, setMarketData] = useState<any>(null);
    const [adding, setAdding] = useState("");

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const res = await fetch("/market-data.json?t=" + Date.now());
                if (res.ok) {
                    const data = await res.json();
                    setMarketData((prev: any) => {
                        if (prev?._meta?.last_updated === data?._meta?.last_updated) return prev;
                        return data;
                    });
                }
            } catch {}
        };
        fetch_();
        const iv = setInterval(fetch_, 5000);
        return () => clearInterval(iv);
    }, []);

    const addRecipe = (name: string) => {
        if (!name || !ALCHEMY_ITEMS[name]) return;
        addToQueue(name);
        setAdding("");
    };

    // Aggregate all materials needed
    const { shoppingList, recipeList, vialList, totalCost, totalRevenue, totalProfit } = useMemo(() => {
        const materials: Record<string, number> = {};
        const vials: Record<string, number> = {};
        const recipes: Record<string, number> = {};
        let cost = 0;
        let revenue = 0;

        for (const [recipeName, qty] of Object.entries(queue)) {
            const recipe = ALCHEMY_ITEMS[recipeName];
            if (!recipe) continue;
            
            // Vials
            vials[recipe.vial] = (vials[recipe.vial] || 0) + qty;
            const vialCost = (VIAL_COSTS[recipe.vial] || 0) * qty;
            cost += vialCost;

            // Materials
            for (const [mat, matQty] of Object.entries(recipe.materials)) {
                materials[mat] = (materials[mat] || 0) + (matQty * qty);
            }
            // Revenue
            const sellPrice = marketData?.[recipeName]?.avg_3 || 0;
            revenue += sellPrice * 0.88 * qty;
        }

        // Material costs
        for (const [mat, qty] of Object.entries(materials)) {
            const price = marketData?.[mat]?.avg_3 || 0;
            cost += price * qty;
        }

        const sortedMaterials = Object.entries(materials).sort((a, b) => {
            const priceA = (marketData?.[a[0]]?.avg_3 || 0) * a[1];
            const priceB = (marketData?.[b[0]]?.avg_3 || 0) * b[1];
            return priceB - priceA;
        });

        return {
            shoppingList: sortedMaterials,
            recipeList: Object.entries(recipes),
            vialList: Object.entries(vials),
            totalCost: cost,
            totalRevenue: revenue,
            totalProfit: revenue - cost,
        };
    }, [queue, marketData]);

    const queueEntries = Object.entries(queue);

    return (
        <main className="container">
            <div className="header">
                <h1 className="header-title">
                    <FlaskConical size={24} color="var(--text-accent)" /> CRAFTING QUEUE
                </h1>
                <div className="header-status">
                    <div className="status-dot"></div>
                    <span className="mono">{queueEntries.length} RECIPES QUEUED</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left: Queue builder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="table-container" style={{ padding: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                            ADD RECIPE
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                <select
                                    className="control-input"
                                    value={adding}
                                    onChange={e => setAdding(e.target.value)}
                                    style={{ width: '100%', paddingRight: '2rem', appearance: 'none', cursor: 'pointer' }}
                                >
                                    <option value="">— Pick a recipe —</option>
                                    {Object.entries(ALCHEMY_ITEMS)
                                        .filter(([_, r]) => r.level < 90)
                                        .map(([name]) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <button
                                onClick={() => addRecipe(adding)}
                                disabled={!adding}
                                style={{
                                    padding: '0 1rem',
                                    background: adding ? 'var(--text-accent)' : 'var(--bg-card)',
                                    color: adding ? '#000' : 'var(--text-muted)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '6px',
                                    cursor: adding ? 'pointer' : 'not-allowed',
                                    fontWeight: 700,
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    </div>

                    {/* Queue items */}
                    <div className="table-container" style={{ padding: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                            CRAFT QUEUE
                        </h3>
                        {queueEntries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Add recipes above to start planning your batch.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {queueEntries.map(([name, qty]) => {
                                    const recipe = ALCHEMY_ITEMS[name];
                                    const sellPrice = marketData?.[name]?.avg_3 || 0;
                                    let matCost = VIAL_COSTS[recipe?.vial] || 0;
                                    for (const [mat, q] of Object.entries(recipe?.materials || {})) {
                                        matCost += (marketData?.[mat]?.avg_3 || 0) * q;
                                    }
                                    const profit = (sellPrice * 0.88 - matCost) * qty;
                                    return (
                                        <div key={name} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.75rem', background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid var(--border-subtle)', borderRadius: '8px'
                                        }}>
                                            <div 
                                                onClick={() => openItemByName(name)}
                                                onMouseEnter={() => prefetchItem(name)}
                                                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                                className="group"
                                            >
                                                <div className="group-hover:text-accent transition-colors" style={{ fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>{name}</div>
                                                <div style={{ fontSize: '0.75rem', color: profit >= 0 ? 'var(--text-success)' : 'var(--text-danger)', marginTop: '0.15rem' }}>
                                                    {profit >= 0 ? '+' : ''}{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}g total
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <button onClick={() => setQueueQty(name, qty - 1)} style={{ width: '28px', height: '28px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Minus size={12} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={qty}
                                                    min={1}
                                                    onChange={e => setQueueQty(name, Math.max(1, parseInt(e.target.value) || 1))}
                                                    style={{ width: '52px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-focus)', borderRadius: '4px', color: '#fff', padding: '4px', fontSize: '0.9rem' }}
                                                />
                                                <button onClick={() => setQueueQty(name, qty + 1)} style={{ width: '28px', height: '28px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <button onClick={() => setQueueQty(name, 0)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => clearQueue()}
                                    style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                >
                                    <Trash2 size={13} /> Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Shopping list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Summary */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Total Cost</div>
                            <div className="stat-value mono" style={{ color: 'var(--text-danger)' }}>
                                {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}g
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Est. Revenue</div>
                            <div className="stat-value mono">{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}g</div>
                        </div>
                        <div className={`stat-card ${totalProfit >= 0 ? 'highlight' : ''}`}>
                            <div className="stat-label">Net Profit</div>
                            <div className={`stat-value mono ${totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}g
                            </div>
                        </div>
                    </div>

                    {/* Recipes */}
                    {recipeList.length > 0 && (
                        <div className="table-container" style={{ padding: '1.25rem' }}>
                            <h3 style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                                RECIPES NEEDED
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {recipeList.map(([recipe, qty]) => (
                                    <div 
                                        key={recipe} 
                                        onClick={() => openItemByName(recipe)}
                                        onMouseEnter={() => prefetchItem(recipe)}
                                        style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                                        className="group"
                                    >
                                        <span className="group-hover:text-accent transition-colors" style={{ color: '#fff', fontSize: '0.9rem' }}>{qty}x {recipe}</span>
                                        <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {((marketData?.[recipe]?.avg_3 || 0) * qty).toLocaleString()}g
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vials */}
                    {vialList.length > 0 && (
                        <div className="table-container" style={{ padding: '1.25rem' }}>
                            <h3 style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                                VIALS NEEDED
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {vialList.map(([vial, qty]) => (
                                    <div 
                                        key={vial} 
                                        onClick={() => openItemByName(vial)}
                                        onMouseEnter={() => prefetchItem(vial)}
                                        style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                                        className="group"
                                    >
                                        <span className="group-hover:text-accent transition-colors" style={{ color: '#fff', fontSize: '0.9rem' }}>{qty}x {vial}</span>
                                        <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {((VIAL_COSTS[vial] || 0) * qty).toLocaleString()}g
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Materials shopping list */}
                    <div className="table-container" style={{ padding: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingCart size={14} /> SHOPPING LIST
                        </h3>
                        {shoppingList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Your shopping list will appear here once you add recipes.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {shoppingList.map(([mat, qty]) => {
                                    const price = marketData?.[mat]?.avg_3 || 0;
                                    const totalMatCost = price * qty;
                                    return (
                                        <div
                                            key={mat}
                                            onClick={() => openItemByName(mat)}
                                            onMouseEnter={() => prefetchItem(mat)}
                                            className="source-row group"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Package size={13} color="var(--text-muted)" />
                                                <span className="group-hover:text-accent transition-colors" style={{ color: '#fff' }}><span className="text-muted">{qty}x</span> {mat}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="mono" style={{ color: 'var(--text-accent)', fontSize: '0.9rem' }}>
                                                    {totalMatCost > 0 ? totalMatCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g' : '—'}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {price > 0 ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'g ea' : 'No data'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.25rem', fontWeight: 600 }}>
                                    <span>Materials Total</span>
                                    <span className="mono" style={{ color: 'var(--text-accent)' }}>
                                        {shoppingList.reduce((s, [m, q]) => s + (marketData?.[m]?.avg_3 || 0) * q, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}g
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
