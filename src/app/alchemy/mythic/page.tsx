"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../../../constants";
import { ChevronUp, ChevronDown, Minus, Info, X, Activity, Target, Search, Sparkles, TrendingUp, Hammer, DollarSign, Plus, Trash2, Edit3, Save, Clock } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { useItemModal } from "@/context/ItemModalContext";
import { useData } from "@/context/DataContext";

type PriceSource = '3d' | '7d' | '14d' | '30d' | 'vendor' | 'none';

type RowData = {
    name: string;
    level: number;
    matCost: number;
    vialCost: number;
    recipePrice: number;
    recipePriceSource: PriceSource;
    customRecipePrice: number | null;
    revenue: number;
    marketPrice: number;
    marketPriceSource: PriceSource;
    customSellPrice: number | null;
    vendorRevenue: number;
    profit: number;
    roi: number;
    totalRemainingProfit: number;
    vol_3: number;
    bestPath: "MARKET" | "VENDOR" | "CUSTOM";
    loading: boolean;
    usesLeft: number;
    materialBreakdown: { name: string; qty: number; unitPrice: number; priceSource: PriceSource; customPrice: number | null; total: number }[];
};

export default function MythicAlchemyPage() {
    const { marketData: data, allItemsDb } = useData();
    const { preferences } = usePreferences();
    const { openItemByName, prefetchItem } = useItemModal();
    const [activeRecipeNames, setActiveRecipeNames] = useState<string[]>([]);
    const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
    const [usesLeft, setUsesLeft] = useState<Record<string, number>>({});
    const [customMatPrices, setCustomMatPrices] = useState<Record<string, Record<string, number>>>({});
    const [customSellPrices, setCustomSellPrices] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Load state from localStorage on mount
    useEffect(() => {
        const savedNames = localStorage.getItem("zenith_mythic_active_recipes");
        const savedPrices = localStorage.getItem("zenith_mythic_recipe_prices");
        const savedUses = localStorage.getItem("zenith_mythic_uses");
        const savedMatPrices = localStorage.getItem("zenith_mythic_mat_prices");
        const savedSellPrices = localStorage.getItem("zenith_mythic_sell_prices");

        if (savedNames) setActiveRecipeNames(JSON.parse(savedNames));
        if (savedPrices) setCustomPrices(JSON.parse(savedPrices));
        if (savedUses) setUsesLeft(JSON.parse(savedUses));
        if (savedMatPrices) setCustomMatPrices(JSON.parse(savedMatPrices));
        if (savedSellPrices) setCustomSellPrices(JSON.parse(savedSellPrices));

        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const saveState = (names: string[], prices: Record<string, number>, uses: Record<string, number>, mats: Record<string, Record<string, number>>, sells: Record<string, number>) => {
        localStorage.setItem("zenith_mythic_active_recipes", JSON.stringify(names));
        localStorage.setItem("zenith_mythic_recipe_prices", JSON.stringify(prices));
        localStorage.setItem("zenith_mythic_uses", JSON.stringify(uses));
        localStorage.setItem("zenith_mythic_mat_prices", JSON.stringify(mats));
        localStorage.setItem("zenith_mythic_sell_prices", JSON.stringify(sells));
    };

    const addToLab = (name: string) => {
        if (activeRecipeNames.includes(name)) return;
        const nextNames = [...activeRecipeNames, name];
        const nextUses = { ...usesLeft, [name]: 30 };
        setActiveRecipeNames(nextNames);
        setUsesLeft(nextUses);
        saveState(nextNames, customPrices, nextUses, customMatPrices, customSellPrices);
        setSearchTerm("");
        setIsSearchOpen(false);
    };

    const removeFromLab = (name: string) => {
        const nextNames = activeRecipeNames.filter(n => n !== name);
        const nextPrices = { ...customPrices };
        const nextUses = { ...usesLeft };
        const nextMats = { ...customMatPrices };
        const nextSells = { ...customSellPrices };

        delete nextPrices[name];
        delete nextUses[name];
        delete nextMats[name];
        delete nextSells[name];

        setActiveRecipeNames(nextNames);
        setCustomPrices(nextPrices);
        setUsesLeft(nextUses);
        setCustomMatPrices(nextMats);
        setCustomSellPrices(nextSells);
        
        saveState(nextNames, nextPrices, nextUses, nextMats, nextSells);
    };

    const handleCustomPriceChange = (name: string, price: string) => {
        const val = price === "" ? null : Number(price);
        const nextPrices = { ...customPrices };
        if (val === null) delete nextPrices[name];
        else nextPrices[name] = val;
        setCustomPrices(nextPrices);
        saveState(activeRecipeNames, nextPrices, usesLeft, customMatPrices, customSellPrices);
    };

    const handleUsesChange = (name: string, val: string) => {
        const num = Math.max(1, Number(val) || 1);
        const nextUses = { ...usesLeft, [name]: num };
        setUsesLeft(nextUses);
        saveState(activeRecipeNames, customPrices, nextUses, customMatPrices, customSellPrices);
    };

    const handleMatPriceChange = (recipeName: string, matName: string, price: string) => {
        const val = price === "" ? null : Number(price);
        const nextMats = { ...customMatPrices };
        if (!nextMats[recipeName]) nextMats[recipeName] = {};
        if (val === null) delete nextMats[recipeName][matName];
        else nextMats[recipeName][matName] = val;
        setCustomMatPrices(nextMats);
        saveState(activeRecipeNames, customPrices, usesLeft, nextMats, customSellPrices);
    };

    const handleCustomSellPriceChange = (name: string, price: string) => {
        const val = price === "" ? null : Number(price);
        const nextSells = { ...customSellPrices };
        if (val === null) delete nextSells[name];
        else nextSells[name] = val;
        setCustomSellPrices(nextSells);
        saveState(activeRecipeNames, customPrices, usesLeft, customMatPrices, nextSells);
    };

    const getBestPrice = (itemName: string): { price: number; source: PriceSource } => {
        const pData = data?.[itemName];
        if (!pData) return { price: 0, source: 'none' };
        
        if (pData.avg_3) return { price: pData.avg_3, source: '3d' };
        if (pData.avg_7) return { price: pData.avg_7, source: '7d' };
        if (pData.avg_14) return { price: pData.avg_14, source: '14d' };
        if (pData.avg_30) return { price: pData.avg_30, source: '30d' };
        
        const vendor = pData.vendor_price || 0;
        if (vendor > 0) return { price: vendor, source: 'vendor' };
        
        return { price: 0, source: 'none' };
    };

    const availableMythics = useMemo(() => {
        return Object.entries(ALCHEMY_ITEMS)
            .filter(([name, recipe]) => recipe.level === 90 && !activeRecipeNames.includes(name))
            .map(([name]) => name)
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeRecipeNames, searchTerm]);

    const activeRows = useMemo(() => {
        if (!data) return [];
        const calculated: RowData[] = [];
        const parsedBartering = Number(preferences.barteringBoost) || 0;

        for (const name of activeRecipeNames) {
            const recipe = ALCHEMY_ITEMS[name];
            if (!recipe) continue;

            // Name fallback logic (e.g. "Cosmic Barrier" might be "Cosmic Barrier Essence" in market data)
            let pData = data?.[name];
            let effectiveName = name;
            
            if (!pData && !name.toLowerCase().endsWith("essence")) {
                const essenceName = `${name} Essence`;
                if (data?.[essenceName]) {
                    pData = data[essenceName];
                    effectiveName = essenceName;
                }
            }

            const { price: mktPrice, source: mktSource } = getBestPrice(effectiveName);

            const materialBreakdown = [];
            let totalMatCost = 0;

            for (const [mName, qty] of Object.entries(recipe.materials)) {
                const { price: unitPrice, source: priceSource } = getBestPrice(mName);
                const customPrice = customMatPrices[name]?.[mName] ?? null;
                const activeUnitPrice = customPrice !== null ? customPrice : unitPrice;
                const total = activeUnitPrice * qty;
                materialBreakdown.push({ name: mName, qty, unitPrice, priceSource, customPrice, total });
                totalMatCost += total;
            }

            const vialCost = VIAL_COSTS[recipe.vial] || 0;
            const recipeName = `Recipe: ${name}`;
            const { price: mktRecipePrice, source: recipePriceSource } = getBestPrice(recipeName);
            const customPrice = customPrices[name];
            const activeRecipePrice = customPrice !== undefined ? customPrice : mktRecipePrice;
            
            const currentUses = usesLeft[name] || 30;
            const recipeSharePerCraft = activeRecipePrice / 30;

            const customSellPrice = customSellPrices[name] ?? null;
            const activeSellPrice = customSellPrice !== null ? customSellPrice : mktPrice;
            const revMarket = activeSellPrice * 0.88;
            
            // Fallback to allItemsDb if vendor price is missing in market data
            let baseVendor = pData?.vendor_price || 0;
            if (baseVendor === 0 && allItemsDb) {
                const itemMeta = allItemsDb[name] || allItemsDb[effectiveName] || allItemsDb[`${name} Essence`];
                if (itemMeta) baseVendor = itemMeta.vendor_price || 0;
            }
            
            const revVendor = baseVendor * (1 + (parsedBartering / 100));
            
            let bestPath: RowData['bestPath'] = "MARKET";
            if (revVendor > revMarket) bestPath = "VENDOR";
            if (customSellPrice !== null) bestPath = "CUSTOM";

            const bestRev = bestPath === "VENDOR" ? revVendor : revMarket;
            const totalCostPerCraft = totalMatCost + vialCost + recipeSharePerCraft;
            const profit = bestRev - totalCostPerCraft;
            const roi = totalCostPerCraft > 0 ? (profit / totalCostPerCraft) * 100 : 0;
            const totalRemainingProfit = profit * currentUses;

            calculated.push({
                name, level: recipe.level, matCost: totalMatCost, vialCost, 
                recipePrice: mktRecipePrice, recipePriceSource, customRecipePrice: customPrice ?? null,
                marketPrice: mktPrice, marketPriceSource: mktSource, customSellPrice,
                revenue: revMarket, vendorRevenue: revVendor,
                profit, roi, totalRemainingProfit, vol_3: pData?.vol_3 || 0, bestPath, loading: false,
                usesLeft: currentUses, materialBreakdown
            });
        }
        return calculated;
    }, [data, allItemsDb, activeRecipeNames, customPrices, usesLeft, customMatPrices, customSellPrices, preferences.barteringBoost]);

    const labSummary = useMemo(() => {
        return activeRows.reduce((acc, curr) => ({
            totalPotentialProfit: acc.totalPotentialProfit + (curr.loading ? 0 : curr.totalRemainingProfit)
        }), { totalPotentialProfit: 0 });
    }, [activeRows]);

    const getSourceLabel = (src: PriceSource) => {
        if (src === 'vendor') return 'Vendor Price';
        if (src === 'none') return 'No Price Data';
        return `${src} Market Avg`;
    };

    return (
        <main className="container">
            <div className="header">
                <div>
                    <h1 className="header-title">
                        <Sparkles size={24} color="var(--text-accent)" /> MYTHIC WORKBENCH
                    </h1>
                    <p className="header-subtitle">Advanced High-Fidelity Strategic Laboratory</p>
                </div>
                
                <div className="workbench-actions" ref={searchRef}>
                    <div className="search-container">
                        <div className="search-trigger" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                            <Plus size={16} /> ADD PROJECT
                        </div>
                        {isSearchOpen && (
                            <div className="search-dropdown custom-scrollbar">
                                <div className="dropdown-input">
                                    <Search size={14} />
                                    <input 
                                        autoFocus
                                        placeholder="Search Mythic Recipes..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="dropdown-results">
                                    {availableMythics.length > 0 ? (
                                        availableMythics.map(name => (
                                            <div key={name} className="result-item" onClick={() => addToLab(name)}>
                                                {name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-results">No new mythics found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeRecipeNames.length > 0 && (
                <div className="lab-summary">
                    <div className="summary-card full">
                        <div className="summary-content">
                            <span className="summary-label">COMBINED REMAINING PROFIT</span>
                            <span className={`summary-value ${labSummary.totalPotentialProfit > 0 ? 'text-success' : 'text-danger'}`}>
                                {labSummary.totalPotentialProfit > 0 ? '+' : ''}{Math.floor(labSummary.totalPotentialProfit).toLocaleString()}g
                            </span>
                        </div>
                        <div className="summary-hint">Reflecting all material overrides and usage trackers.</div>
                    </div>
                </div>
            )}

            <div className="lab-grid">
                {activeRecipeNames.length === 0 ? (
                    <div className="empty-bench">
                        <div className="empty-icon"><Hammer size={48} /></div>
                        <h2>No Active Projects</h2>
                        <p>Pin a Level 90 recipe to calculate dynamic cycles with custom sell prices.</p>
                        <button className="empty-add-btn" onClick={() => setIsSearchOpen(true)}>
                            <Plus size={18} /> Add Your First Recipe
                        </button>
                    </div>
                ) : (
                    activeRows.map((row) => (
                        <div key={row.name} className={`mythic-card ${row.loading ? 'loading' : ''}`}>
                            {row.loading ? (
                                <div className="card-skeleton" />
                            ) : (
                                <>
                                    <button className="remove-btn" onClick={() => removeFromLab(row.name)} title="Remove Project">
                                        <X size={18} />
                                    </button>
                                    
                                    <div className="card-header">
                                        <div className="title-area">
                                            <h3 onClick={() => openItemByName(row.name)}>{row.name}</h3>
                                            <div className="uses-control">
                                                <input 
                                                    type="number" 
                                                    value={row.usesLeft} 
                                                    onChange={(e) => handleUsesChange(row.name, e.target.value)}
                                                />
                                                <span>USES REMAINING</span>
                                            </div>
                                        </div>
                                        <div className={`profit-badge ${row.profit > 0 ? 'pos' : 'neg'}`}>
                                            {row.profit > 0 ? '+' : ''}{Math.floor(row.profit).toLocaleString()}g / sale
                                        </div>
                                    </div>

                                    <div className="card-grid">
                                        <div className="card-left">
                                            <div className="card-section">
                                                <div className="section-label"><TrendingUp size={12} /> PROJECT OVERHEAD</div>
                                                <div className="investment-input-group">
                                                    <div className="input-wrapper">
                                                        <label>Recipe Acquisition Price</label>
                                                        <div className="input-row">
                                                            <input 
                                                                type="number" 
                                                                placeholder={row.recipePrice.toLocaleString()}
                                                                value={row.customRecipePrice ?? ""}
                                                                onChange={(e) => handleCustomPriceChange(row.name, e.target.value)}
                                                            />
                                                            <span className="currency">Gold</span>
                                                        </div>
                                                        <div className="input-hint-row">
                                                            <span>{row.customRecipePrice !== null ? "Custom Entry" : getSourceLabel(row.recipePriceSource)}</span>
                                                            <span className="fee-split">({( (row.customRecipePrice ?? row.recipePrice) / 30).toLocaleString(undefined, {maximumFractionDigits:0})}g / craft)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-section">
                                                <div className="section-label"><Hammer size={12} /> MATERIAL LEDGER (PER CRAFT)</div>
                                                <div className="materials-ledger">
                                                    {row.materialBreakdown.map(mat => (
                                                        <div key={mat.name} className="ledger-row">
                                                            <div className="ledger-info">
                                                                <span className="mat-qty">{mat.qty}x</span>
                                                                <span className="mat-name" onClick={() => openItemByName(mat.name)}>{mat.name}</span>
                                                            </div>
                                                            <div className="ledger-input">
                                                                <div className="input-source-hint">{mat.customPrice !== null ? "Custom" : mat.priceSource}</div>
                                                                <input 
                                                                    type="number" 
                                                                    placeholder={mat.unitPrice.toLocaleString()}
                                                                    value={mat.customPrice ?? ""}
                                                                    onChange={(e) => handleMatPriceChange(row.name, mat.name, e.target.value)}
                                                                />
                                                                <div className="ledger-total">{mat.total.toLocaleString()}g</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="ledger-row vial-row">
                                                        <div className="ledger-info">
                                                            <span className="mat-qty">1x</span>
                                                            <span className="mat-name" onClick={() => openItemByName(ALCHEMY_ITEMS[row.name].vial)}>{ALCHEMY_ITEMS[row.name].vial}</span>
                                                        </div>
                                                        <div className="ledger-input">
                                                            <div className="ledger-total">{row.vialCost.toLocaleString()}g</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-right">
                                            <div className="card-section">
                                                <div className="section-label"><DollarSign size={12} /> REVENUE STRATEGY</div>
                                                <div className="revenue-manager">
                                                    <div className="market-revenue-box">
                                                        <label>Gross Sell Price (No Tax)</label>
                                                        <div className="input-row compact">
                                                            <input 
                                                                type="number" 
                                                                placeholder={row.marketPrice.toLocaleString()}
                                                                value={row.customSellPrice ?? ""}
                                                                onChange={(e) => handleCustomSellPriceChange(row.name, e.target.value)}
                                                            />
                                                            <span className="currency">g</span>
                                                        </div>
                                                        <div className="market-meta">
                                                            <div className="meta-left">{row.customSellPrice !== null ? "Custom Target" : getSourceLabel(row.marketPriceSource)}</div>
                                                            <div className="meta-right">88% Net: <b>{Math.floor(row.revenue).toLocaleString()}g</b></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className={`vendor-revenue-box ${row.bestPath === 'VENDOR' ? 'highlight' : ''}`}>
                                                        <div className="vendor-label">VENDOR PATH (+{preferences.barteringBoost}%)</div>
                                                        <div className="vendor-val">{Math.floor(row.vendorRevenue).toLocaleString()}g Net</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="footer-stats-modern">
                                                <div className="stat-group">
                                                    <span className="label">ROI</span>
                                                    <span className={`value ${row.roi > 0 ? 'text-success' : 'text-danger'}`}>{row.roi.toFixed(1)}%</span>
                                                </div>
                                                <div className="stat-group highlight">
                                                    <span className="label">REMAINING PROJECT GAIN ({row.usesLeft} SALES)</span>
                                                    <span className={`value large ${row.totalRemainingProfit > 0 ? 'text-success' : 'text-danger'}`}>
                                                        {Math.floor(row.totalRemainingProfit).toLocaleString()}g
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .container { padding-bottom: 5rem; }
                .header { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
                .header-title { font-size: 2.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; color: #fff; letter-spacing: -0.02em; }
                .header-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem; }

                .workbench-actions { position: relative; z-index: 100; }
                .search-trigger { background: var(--text-accent); color: #000; padding: 0.6rem 1.25rem; border-radius: 12px; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s; }
                .search-trigger:hover { transform: translateY(-2px); filter: brightness(1.1); }

                .search-dropdown { position: absolute; top: calc(100% + 10px); right: 0; width: 320px; background: #0f0f0f; border: 1px solid var(--border-subtle); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); overflow: hidden; }
                .dropdown-input { padding: 1.25rem; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.02); }
                .dropdown-input input { background: none; border: none; color: #fff; font-size: 0.9rem; width: 100%; outline: none; }
                .dropdown-results { max-height: 350px; overflow-y: auto; }
                .result-item { padding: 0.85rem 1.25rem; cursor: pointer; font-size: 0.85rem; color: rgba(255,255,255,0.7); transition: all 0.2s; }
                .result-item:hover { background: rgba(255,255,255,0.05); color: var(--text-accent); padding-left: 1.5rem; }
                .no-results { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; }

                .lab-summary { margin-bottom: 2.5rem; }
                .summary-card { background: linear-gradient(135deg, color-mix(in srgb, var(--text-accent), transparent 95%), transparent); border: 1px solid color-mix(in srgb, var(--text-accent), transparent 90%); padding: 1.5rem 2rem; border-radius: 24px; }
                .summary-content { display: flex; justify-content: space-between; align-items: center; }
                .summary-label { font-size: 0.75rem; font-weight: 800; color: var(--text-accent); letter-spacing: 0.1em; }
                .summary-value { font-size: 2.5rem; font-weight: 900; color: #fff; }
                .summary-hint { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem; }

                .lab-grid { display: flex; flex-direction: column; gap: 2rem; }
                .empty-bench { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: rgba(255,255,255,0.01); border: 2px dashed var(--border-subtle); border-radius: 32px; padding: 5rem 2rem; }
                .empty-icon { margin-bottom: 1.5rem; opacity: 0.2; }
                .empty-bench h2 { color: #fff; font-size: 1.75rem; margin-bottom: 0.75rem; }
                .empty-bench p { font-size: 0.95rem; margin-bottom: 2.5rem; max-width: 450px; color: var(--text-muted); }
                .empty-add-btn { background: var(--text-accent); color: #000; padding: 0.8rem 2rem; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; border: none; }
                .empty-add-btn:hover { transform: scale(1.05); filter: brightness(1.1); }

                .mythic-card { background: #080808; border: 1px solid rgba(255,255,255,0.06); border-radius: 32px; padding: 2.5rem; position: relative; transition: border-color 0.3s; }
                .mythic-card:hover { border-color: color-mix(in srgb, var(--text-accent), transparent 80%); }
                
                .remove-btn { position: absolute; top: -12px; right: -12px; width: 36px; height: 36px; border-radius: 50%; background: #ef4444; border: 3px solid #080808; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 10; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); }
                .remove-btn:hover { transform: scale(1.1); filter: brightness(1.1); }

                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
                .title-area h3 { font-size: 2rem; font-weight: 900; color: #fff; margin: 0; cursor: pointer; transition: color 0.2s; }
                .title-area h3:hover { color: var(--text-accent); }
                .uses-control { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
                .uses-control input { width: 60px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 2px 4px; color: var(--text-accent); font-weight: 900; text-align: center; font-size: 0.9rem; }
                .uses-control span { font-size: 10px; font-weight: 900; color: var(--text-muted); letter-spacing: 0.1em; }
                
                .profit-badge { padding: 8px 18px; border-radius: 12px; font-size: 1rem; font-weight: 800; font-family: var(--font-mono); }
                .profit-badge.pos { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
                .profit-badge.neg { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

                .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; }
                .card-section { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem; }
                .section-label { font-size: 10px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; display: flex; align-items: center; gap: 8px; }

                .input-wrapper { display: flex; flex-direction: column; gap: 10px; }
                .input-wrapper label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
                .input-row { position: relative; display: flex; align-items: center; }
                .input-row input { width: 100%; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 1rem 4rem 1rem 1.25rem; color: #fff; font-family: var(--font-mono); font-weight: 800; font-size: 1.25rem; transition: all 0.2s; }
                .input-row input:focus { border-color: var(--text-accent); background: rgba(255,255,255,0.04); outline: none; }
                .input-row.compact input { padding: 0.6rem 2.5rem 0.6rem 1rem; font-size: 1.1rem; border-radius: 12px; }
                .input-row .currency { position: absolute; right: 18px; font-size: 0.8rem; color: var(--text-muted); font-weight: 900; }
                .input-hint-row { display: flex; justify-content: space-between; font-size: 0.75rem; padding: 0 4px; }
                .input-hint-row span:first-child { color: rgba(255,255,255,0.25); }
                .fee-split { color: var(--text-accent); font-weight: 700; opacity: 0.6; }

                .materials-ledger { display: flex; flex-direction: column; gap: 8px; }
                .ledger-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.03); border-radius: 14px; }
                .ledger-info { display: flex; align-items: center; gap: 10px; flex: 1; }
                .mat-qty { font-size: 0.75rem; color: var(--text-muted); font-weight: 800; min-width: 25px; }
                .mat-name { font-size: 0.9rem; color: #fff; font-weight: 600; cursor: pointer; }
                .mat-name:hover { color: var(--text-accent); text-decoration: underline; }
                .ledger-input { display: flex; align-items: center; gap: 12px; }
                .input-source-hint { font-size: 9px; font-weight: 900; color: rgba(255,255,255,0.15); text-transform: uppercase; }
                .ledger-input input { width: 100px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 6px 10px; color: #fff; font-size: 0.85rem; font-family: var(--font-mono); text-align: right; }
                .ledger-input input:focus { border-color: var(--text-accent); outline: none; }
                .ledger-total { min-width: 80px; text-align: right; font-size: 0.9rem; font-weight: 800; color: rgba(255,255,255,0.4); font-family: var(--font-mono); }
                .vial-row { background: rgba(255,255,255,0.01); border-style: dashed; }

                .revenue-manager { display: flex; flex-direction: column; gap: 1rem; }
                .market-revenue-box { background: rgba(255,255,255,0.015); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 1.5rem; }
                .market-revenue-box label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px; font-weight: 700; }
                .market-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 0.75rem; }
                .meta-left { color: rgba(255,255,255,0.2); font-weight: 600; }
                .meta-right { color: var(--text-muted); }
                .meta-right b { color: #38bdf8; }

                .vendor-revenue-box { background: rgba(255,255,255,0.01); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; opacity: 0.4; transition: all 0.3s; }
                .vendor-revenue-box.highlight { background: color-mix(in srgb, var(--text-accent), transparent 97%); border-color: color-mix(in srgb, var(--text-accent), transparent 80%); opacity: 1; }
                .vendor-label { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); }
                .vendor-val { font-size: 1rem; font-weight: 800; color: #fff; }

                .footer-stats-modern { margin-top: auto; display: flex; flex-direction: column; gap: 1.25rem; }
                .stat-group { background: rgba(255,255,255,0.01); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.02); }
                .stat-group.highlight { background: linear-gradient(135deg, rgba(34,197,94,0.03), transparent); border-color: rgba(34,197,94,0.1); }
                .stat-group .label { font-size: 0.65rem; color: var(--text-muted); font-weight: 800; letter-spacing: 0.05em; display: block; margin-bottom: 6px; }
                .stat-group .value { font-size: 1.75rem; font-weight: 900; font-family: var(--font-mono); }
                .stat-group .value.large { font-size: 2.25rem; letter-spacing: -0.02em; }

                @media (max-width: 1200px) {
                    .card-grid { grid-template-columns: 1fr; gap: 2.5rem; }
                }
            `}</style>
        </main>
    );
}
