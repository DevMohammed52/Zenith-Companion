"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../../constants";
import { ChevronUp, ChevronDown, Minus, Info, X, Activity, Target, Search } from "lucide-react";
import Link from "next/link";
import { getMarketTaxMultiplier, getMarketTaxRate, usePreferences } from "@/lib/preferences";
import { useItemModal } from "@/context/ItemModalContext";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import MobileSortControls from "@/components/MobileSortControls";

type SearchIndexItem = {
  id: string;
  name: string;
};

type MarketData = {
  price: number;
  avg_3: number;
  avg_7: number;
  avg_14: number;
  avg_30: number;
  vol_3?: number;
  vendor_price?: number;
};

type AllData = Record<string, MarketData> & { _meta?: { last_updated: string } };

type RowData = {
  name: string;
  trend: "up" | "down" | "flat";
  cost: number;
  rev: number;
  vendorRev: number;
  profit: number;
  roi: number;
  dailyProfit: number;
  vol_3: number;
  action: "CRAFT" | "LIQUIDATE" | "VENDOR";
  loading: boolean;
  matsSellVal: number;
  vialCost: number;
};

type AlchemySortKey = keyof (RowData & { level: number });

import { useData } from "@/context/DataContext";

function AlchemyContent() {
  const { marketData: data } = useData();
  const { preferences, setPreferences } = usePreferences();
  const { openItemByName, prefetchItem } = useItemModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [minLevel, setMinLevel] = useState<number | "">(0);
  const [maxLevel, setMaxLevel] = useState<number | "">(100);
  const [minRoi, setMinRoi] = useState<number | "">(-999);
  const [minVolume, setMinVolume] = useState<number | "">(0);
  const [sortCol, setSortCol] = useState<AlchemySortKey | "">("profit");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const calculated: (RowData & { level: number })[] = [];
    const parsedBartering = Number(preferences.barteringBoost) || 0;
    const parsedActiveHours = Number(preferences.activeHours) || 0;
    const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);

    for (const [name, recipe] of Object.entries(ALCHEMY_ITEMS)) {
      // Basic Search & Level Filters
      if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) continue;
      if (recipe.level >= 90) continue; // Mythics are now in the Lab
      if (minLevel !== "" && recipe.level < minLevel) continue;
      if (maxLevel !== "" && recipe.level > maxLevel) continue;

      const pData = data?.[name];
      const price = pData?.avg_3 || 0;

      if (!pData || price <= 0) {
        // Handle items with no market data
        let matCost = VIAL_COSTS[recipe.vial] || 0;
        let matsValid = true;
        for (const [mName, qty] of Object.entries(recipe.materials)) {
            const mPrice = data?.[mName]?.avg_3 || 0;
            if (mPrice <= 0) { matsValid = false; break; }
            matCost += mPrice * qty;
        }

        calculated.push({ 
            name, 
            loading: !matsValid, 
            level: recipe.level,
            cost: matCost,
            rev: 0,
            profit: 0,
            roi: 0,
            dailyProfit: 0,
            vol_3: 0,
            trend: 'flat',
            action: 'LIQUIDATE',
            noMarketData: true
        } as any);
        continue;
      }

      const avg3 = pData.avg_3 || 0;
      const avg14 = pData.avg_14 || 0;
      let trend: "up" | "down" | "flat" = "flat";
      if (avg3 > avg14 * 1.05) trend = "up";
      else if (avg3 < avg14 * 0.95) trend = "down";

      let matCost = VIAL_COSTS[recipe.vial] || 0;
      let matsSellVal = 0;
      let matsValid = true;

      for (const [mName, qty] of Object.entries(recipe.materials)) {
        const mPrice = data?.[mName]?.avg_3 || 0;
        const vPrice = VIAL_COSTS[mName] || 0;
        const finalPrice = mPrice || vPrice;

        if (finalPrice <= 0) { matsValid = false; break; }
        matCost += finalPrice * qty;
        matsSellVal += (finalPrice * marketTaxMultiplier) * qty;
      }

      // Add recipe cost for Mythics (amortized over 30 uses)
      const recipeName = `Recipe: ${name}`;
      const recipePrice = data?.[recipeName]?.avg_3 || 0;
      const isMythic = pData.quality === 'MYTHIC';
      
      if (isMythic && recipePrice > 0) {
        matCost += (recipePrice / 30);
      }

      if (!matsValid) {
        calculated.push({ name, loading: true, level: recipe.level } as RowData & { level: number });
        continue;
      }

      const rev = price * marketTaxMultiplier;
      const baseVendor = pData.vendor_price || 0;
      const vendorRev = baseVendor * (1 + (parsedBartering / 100));
      const bestRev = Math.max(rev, vendorRev, matsSellVal);
      const profit = bestRev - matCost;
      const roi = matCost > 0 ? (profit / matCost) * 100 : 0; 
      const craftsPerDay = (parsedActiveHours * 3600) / (recipe.time || 1090.9);
      const dailyProfit = profit * craftsPerDay;

      let action: "CRAFT" | "LIQUIDATE" | "VENDOR" = "LIQUIDATE";
      if (bestRev === vendorRev && vendorRev > matsSellVal) action = "VENDOR";
      else if (bestRev === rev && rev > matsSellVal) action = "CRAFT";

      calculated.push({
        name, trend, cost: matCost, rev: bestRev, vendorRev, profit, roi, dailyProfit, vol_3: pData.vol_3 || 0, action, loading: false, matsSellVal, vialCost: VIAL_COSTS[recipe.vial] || 0, level: recipe.level
      });
    }

    const roiLimit = minRoi === "" ? -Infinity : minRoi;
    const volLimit = minVolume === "" ? 0 : minVolume;

    const filtered = calculated.filter(row => {
      if (row.loading) return true;
      if (row.roi < roiLimit) return false;
      if (row.vol_3 < volLimit) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.loading && !b.loading) return 1;
      if (!a.loading && b.loading) return -1;
      
      const aNoData = (a as any).noMarketData;
      const bNoData = (b as any).noMarketData;
      if (aNoData && !bNoData) return 1;
      if (!aNoData && bNoData) return -1;

      if (!sortCol) return b.profit - a.profit;
      const valA = (a as any)[sortCol];
      const valB = (b as any)[sortCol];
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [data, preferences.barteringBoost, preferences.activeHours, preferences.membership, sortCol, sortDesc, minRoi, minVolume, searchTerm, minLevel, maxLevel]);

  const autoOpenedRef = useRef<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const recipeParam = searchParams.get("recipe");
    if (recipeParam && rows.length > 0) {
        if (recipeParam === autoOpenedRef.current) return;

        const found = rows.find(r => r.name.toLowerCase() === recipeParam.toLowerCase());
        if (found && !found.loading) {
            setSelectedRow(found as RowData);
            autoOpenedRef.current = recipeParam;
        }
    } else {
        autoOpenedRef.current = null;
    }
  }, [rows, searchParams]);

  // Keyboard support for Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedRow(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSort = (col: AlchemySortKey) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(true); }
  };
  const marketTaxRate = getMarketTaxRate(preferences.membership);
  const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);


  const renderSortIcon = (col: AlchemySortKey) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  return (
    <>
      <div className="header">
        <h1 className="header-title">
          <Activity size={24} color="var(--text-accent)" /> ALCHEMY PROFIT FINDER
        </h1>
        <div className="header-status">
            <div className="status-dot"></div>
            <span className="mono">{rows.length} STRATEGIES</span>
        </div>
      </div>

      <div className="controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="control-group">
            <label className="control-label">Search Recipe</label>
            <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="control-input" style={{ paddingLeft: '2.5rem', width: '100%' }} placeholder="Filter by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>

        <div className="control-group">
            <label className="control-label">Level Range</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input type="number" className="control-input" style={{ width: '50%' }} placeholder="Min" value={minLevel} onChange={(e) => setMinLevel(e.target.value === "" ? "" : Number(e.target.value))} />
                <input type="number" className="control-input" style={{ width: '50%' }} placeholder="Max" value={maxLevel} onChange={(e) => setMaxLevel(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
        </div>

        <div className="control-group">
            <label className="control-label">Bartering Boost (%)</label>
            <input type="number" className="control-input" style={{ width: '100%' }} value={preferences.barteringBoost} onChange={(e) => setPreferences({ barteringBoost: e.target.value === "" ? "" : Math.min(20, Math.max(0, Number(e.target.value) || 0)) })} />
        </div>
      </div>
      <section className="table-wrapper">
        {/* Desktop View */}
        <div className="desktop-only">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="sortable left-align" onClick={() => handleSort("name")}>Asset {renderSortIcon("name")}</th>
                  <th className="sortable" onClick={() => handleSort("level" as any)}>Level {renderSortIcon("level" as any)}</th>
                  <th className="sortable" onClick={() => handleSort("trend")}>Trend {renderSortIcon("trend")}</th>
                  <th className="sortable" onClick={() => handleSort("cost")}>Est. Cost {renderSortIcon("cost")}</th>
                  <th className="sortable" onClick={() => handleSort("rev")}>Best Revenue {renderSortIcon("rev")}</th>
                  <th className="sortable" onClick={() => handleSort("profit")}>Net Profit {renderSortIcon("profit")}</th>
                  <th className="sortable" onClick={() => handleSort("dailyProfit")}>Daily Profit {renderSortIcon("dailyProfit")}</th>
                  <th className="sortable" onClick={() => handleSort("roi")}>ROI % {renderSortIcon("roi")}</th>
                  <th className="sortable" onClick={() => handleSort("vol_3")}>3D Vol {renderSortIcon("vol_3")}</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} onClick={() => !row.loading && setSelectedRow(row)} className="clickable-row group">
                    <td className="item-name left-align">
                      <span 
                        onClick={(e) => { 
                          if (!row.loading) {
                            e.stopPropagation(); 
                            openItemByName(row.name); 
                          }
                        }}
                        onMouseEnter={() => !row.loading && prefetchItem(row.name)}
                        className="hover:text-accent hover:underline cursor-pointer transition-colors"
                      >
                        {row.name}
                      </span>
                    </td>
                    <td className="mono text-muted">{row.level}</td>
                    {row.loading ? (
                      <>
                        <td><div className="skeleton-bar" style={{ width: '40px' }}></div></td>
                        <td><div className="skeleton-bar"></div></td>
                        <td><div className="skeleton-bar"></div></td>
                        <td><div className="skeleton-bar"></div></td>
                        <td><div className="skeleton-bar"></div></td>
                        <td><div className="skeleton-bar"></div></td>
                        <td><div className="skeleton-bar" style={{ width: '30px' }}></div></td>
                        <td><div className="skeleton-bar" style={{ width: '60px' }}></div></td>
                      </>
                    ) : (
                      <>
                        <td>
                          {(row as any).noMarketData ? <span className="text-muted/30">—</span> : (
                            <>
                              {row.trend === "up" && <span className="trend-up"><ChevronUp size={14} /> RISING</span>}
                              {row.trend === "down" && <span className="trend-down"><ChevronDown size={14} /> FALLING</span>}
                              {row.trend === "flat" && <span className="trend-flat"><Minus size={14} /> STABLE</span>}
                            </>
                          )}
                        </td>
                        <td className="mono text-muted">{row.cost.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="mono text-muted">{(row as any).noMarketData ? 'N/A' : row.rev.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className={`mono ${(row as any).noMarketData ? 'text-muted/30' : (row.profit > 0 ? 'profit-positive' : 'profit-negative')}`}>
                            {(row as any).noMarketData ? 'N/A' : (row.profit > 0 ? '+' : '') + row.profit.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </td>
                        <td className={`mono ${(row as any).noMarketData ? 'text-muted/30' : (row.dailyProfit > 0 ? 'profit-positive' : 'profit-negative')}`}>
                            {(row as any).noMarketData ? 'N/A' : (row.dailyProfit > 0 ? '+' : '') + row.dailyProfit.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </td>
                        <td className={`mono ${(row as any).noMarketData ? 'text-muted/30' : (row.roi > 0 ? 'profit-positive' : 'profit-negative')}`}>
                            {(row as any).noMarketData ? 'N/A' : (row.roi > 0 ? '+' : '') + row.roi.toFixed(1) + '%'}
                        </td>
                        <td className={`mono ${row.vol_3 > 0 ? 'text-main' : 'text-muted/30'}`}>{(row as any).noMarketData ? '0' : row.vol_3.toLocaleString()}</td>
                        <td>
                          {(row as any).noMarketData ? <span className="action-badge action-liquidate">NO DATA</span> : (
                            <>
                              {row.action === "CRAFT" && <span className="action-badge action-craft">MARKET</span>}
                              {row.action === "VENDOR" && <span className="action-badge action-vendor">VENDOR</span>}
                              {row.action === "LIQUIDATE" && <span className="action-badge action-liquidate">LIQUIDATE</span>}
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="mobile-only">
          <MobileSortControls
            label="Sort Strategy"
            value={sortCol || "profit"}
            descending={sortDesc}
            onSort={(value) => handleSort(value as AlchemySortKey)}
            onToggleDirection={() => setSortDesc((prev) => !prev)}
            options={[
              { value: "profit", label: "Net Profit" },
              { value: "roi", label: "ROI %" },
              { value: "level", label: "Level" },
              { value: "vol_3", label: "3D Volume" },
              { value: "dailyProfit", label: "Daily Profit" },
              { value: "name", label: "Name" },
            ]}
          />
          <div className="mobile-card-grid">
            {rows.map((row, i) => (
              <div key={i} className="mobile-alchemy-card" onClick={() => !row.loading && setSelectedRow(row)}>
                <div className="m-card-header">
                  <div className="m-card-title">
                    <span className="m-name">{row.name}</span>
                    <span className="m-lvl">LVL {row.level}</span>
                  </div>
                  {!row.loading && (
                    <div className={`m-roi ${row.roi > 0 ? 'pos' : 'neg'}`}>
                      {row.roi.toFixed(1)}% ROI
                    </div>
                  )}
                </div>
                
                <div className="m-card-body">
                  {row.loading ? (
                    <div className="skeleton-bar" style={{ width: '100%', height: '40px' }}></div>
                  ) : (
                    <>
                      <div className="m-stat">
                        <span className="m-label">EST. COST</span>
                        <span className="m-val">{row.cost.toLocaleString()}g</span>
                      </div>
                      <div className="m-stat">
                        <span className="m-label">NET PROFIT</span>
                        <span className={`m-val ${row.profit > 0 ? 'pos' : 'neg'}`}>
                          {row.profit > 0 ? '+' : ''}{row.profit.toLocaleString()}g
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="m-card-footer">
                  {!row.loading && (
                    <>
                      <div className="m-badges">
                        {row.action === "CRAFT" && <span className="action-badge action-craft">MARKET</span>}
                        {row.action === "VENDOR" && <span className="action-badge action-vendor">VENDOR</span>}
                        {row.action === "LIQUIDATE" && <span className="action-badge action-liquidate">LIQUIDATE</span>}
                      </div>
                      <div className="m-vol">{row.vol_3.toLocaleString()} VOL</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2 
                    onClick={() => openItemByName(selectedRow.name)}
                    style={{ cursor: 'pointer' }}
                    className="hover:text-accent transition-colors"
                >
                    {selectedRow.name} Strategy
                </h2>
                <button className="close-btn" onClick={() => setSelectedRow(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Left Column: Acquisition */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                            <Target size={16} /> ACQUISITION STRATEGY
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {Object.entries(ALCHEMY_ITEMS[selectedRow.name]?.materials || {}).map(([m, q]) => {
                                const unitPrice = data?.[m]?.avg_3 || 0;
                                const total = unitPrice * q;
                                return (
                                    <div key={m} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{q}x</span>{" "}
                                                <button 
                                                    onClick={() => openItemByName(m)}
                                                    style={{ fontWeight: 600, color: '#fff', background: 'none', border: 'none', padding: 0, cursor: 'pointer', outline: 'none' }}
                                                    className="hover-underline"
                                                >
                                                    {m}
                                                </button>
                                            </span>
                                            <span className="mono" style={{ fontSize: '0.8rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{unitPrice.toLocaleString()} ea</span>
                                                <span style={{ margin: '0 0.5rem', color: 'var(--text-accent)' }}>→</span>
                                                <span style={{ color: 'var(--text-success)', fontWeight: 600 }}>{total.toLocaleString()}g</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Vial Cost (Fixed)</span>
                                <span className="mono" style={{ fontWeight: 700 }}>{selectedRow.vialCost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Execution */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                            <Info size={16} /> EXECUTION & MATH
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RAW MATERIAL VALUE</span>
                                <span className="mono" style={{ fontWeight: 700 }}>{(selectedRow.cost - selectedRow.vialCost).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MARKET NET (AFTER {Math.round(marketTaxRate * 100)}% TAX)</span>
                                <span className="mono" style={{ fontWeight: 700 }}>{selectedRow.rev.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENDOR NET (W/ BARTERING)</span>
                                <span className="mono" style={{ fontWeight: 700 }}>{selectedRow.vendorRev.toLocaleString()}</span>
                            </div>
                            
                            <div style={{ margin: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TARGET LIST PRICE</span>
                                <span className="mono" style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{(selectedRow.rev / marketTaxMultiplier).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROJECTED NET PROFIT</span>
                                <span className="mono" style={{ fontWeight: 700, color: 'var(--text-success)' }}>+{selectedRow.profit.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EST. DAILY PROFIT ({preferences.activeHours}H)</span>
                                <span className="mono" style={{ fontWeight: 700, color: 'var(--text-success)' }}>+{selectedRow.dailyProfit.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RETURN ON INVESTMENT (ROI)</span>
                                <span className="mono" style={{ fontWeight: 700, color: 'var(--text-success)' }}>+{selectedRow.roi.toFixed(1)}%</span>
                            </div>
                            
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>3-Day Liquidity (Volume)</span>
                                <span style={{ fontWeight: 600 }}><span style={{ color: '#fff' }}>{selectedRow.vol_3}</span> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sold</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AlchemyPage() {
    return (
        <main className="container">
            <Suspense fallback={<div className="loading-state">Loading Alchemy Data...</div>}>
                <AlchemyContent />
            </Suspense>
        </main>
    );
}
