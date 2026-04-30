"use client";

import { useEffect, useState, useMemo } from "react";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../../constants";
import { ChevronUp, ChevronDown, Minus, Info, X, Activity, Target } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/lib/preferences";

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

export default function AlchemyPage() {
  const [data, setData] = useState<AllData | null>(null);
  const { preferences, setPreferences } = usePreferences();
  const [minRoi, setMinRoi] = useState<number | "">(-999);
  const [minVolume, setMinVolume] = useState<number | "">(0);
  const [showProfitableOnly, setShowProfitableOnly] = useState(false);
  const [sortCol, setSortCol] = useState<keyof RowData | "">("");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/market-data.json?t=" + Date.now());
        if (res.ok) setData(await res.json());
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (col: keyof RowData) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(true); }
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const calculated = [];
    const parsedBartering = Number(preferences.barteringBoost) || 0;
    const parsedActiveHours = Number(preferences.activeHours) || 0;

    for (const [name, recipe] of Object.entries(ALCHEMY_ITEMS)) {
      const pData = data?.[name];
      const price = pData?.avg_3 || 0;

      if (!pData || price <= 0) {
        calculated.push({ name, loading: true } as RowData);
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
        if (mPrice <= 0) { matsValid = false; break; }
        matCost += mPrice * qty;
        matsSellVal += (mPrice * 0.88) * qty;
      }

      if (!matsValid) {
        calculated.push({ name, loading: true } as RowData);
        continue;
      }

      const rev = price * 0.88;
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
        name, trend, cost: matCost, rev: bestRev, vendorRev, profit, roi, dailyProfit, vol_3: pData.vol_3 || 0, action, loading: false, matsSellVal, vialCost: VIAL_COSTS[recipe.vial] || 0
      });
    }

    const roiLimit = minRoi === "" ? -Infinity : minRoi;
    const volLimit = minVolume === "" ? 0 : minVolume;

    const filtered = calculated.filter(row => {
      if (row.loading) return true;
      if (showProfitableOnly && row.profit <= 0) return false;
      if (row.roi < roiLimit) return false;
      if (row.vol_3 < volLimit) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.loading) return 1;
      if (b.loading) return -1;
      if (!sortCol) return b.profit - a.profit;
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [data, preferences.barteringBoost, preferences.activeHours, sortCol, sortDesc, showProfitableOnly, minRoi, minVolume]);

  const renderSortIcon = (col: keyof RowData) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  return (
    <main className="container">
      <div className="header">
        <h1 className="header-title">
          <Activity size={24} color="var(--text-accent)" /> ALCHEMY PROFIT FINDER
        </h1>
        <div className="header-status">
            <div className="status-dot"></div>
            <span className="mono">{rows.length} STRATEGIES</span>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
            <label className="control-label">Bartering Boost (%)</label>
            <input type="number" className="control-input" value={preferences.barteringBoost} onChange={(e) => setPreferences({ barteringBoost: e.target.value === "" ? "" : Math.min(20, Math.max(0, Number(e.target.value) || 0)) })} />
        </div>
        </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="sortable left-align" onClick={() => handleSort("name")}>Asset {renderSortIcon("name")}</th>
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
              <tr key={i} onClick={() => !row.loading && setSelectedRow(row)} className="clickable-row">
                <td className="item-name left-align">{row.name}</td>
                {row.loading ? <td colSpan={8}><div className="skeleton-text"></div></td> : (
                  <>
                    <td>
                      {row.trend === "up" && <span className="trend-up"><ChevronUp size={14} /> RISING</span>}
                      {row.trend === "down" && <span className="trend-down"><ChevronDown size={14} /> FALLING</span>}
                      {row.trend === "flat" && <span className="trend-flat"><Minus size={14} /> STABLE</span>}
                    </td>
                    <td className="mono text-muted">{row.cost.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    <td className="mono text-muted">{row.rev.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    <td className={`mono ${row.profit > 0 ? 'profit-positive' : 'profit-negative'}`}>{row.profit > 0 ? '+' : ''}{row.profit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    <td className={`mono ${row.dailyProfit > 0 ? 'profit-positive' : 'profit-negative'}`}>{row.dailyProfit > 0 ? '+' : ''}{row.dailyProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    <td className={`mono ${row.roi > 0 ? 'profit-positive' : 'profit-negative'}`}>{row.roi > 0 ? '+' : ''}{row.roi.toLocaleString(undefined, {maximumFractionDigits:1})}%</td>
                    <td className="mono text-main">{row.vol_3.toLocaleString()}</td>
                    <td>
                      {row.action === "CRAFT" && <span className="action-badge action-craft">MARKET</span>}
                      {row.action === "VENDOR" && <span className="action-badge action-vendor">VENDOR</span>}
                      {row.action === "LIQUIDATE" && <span className="action-badge action-liquidate">LIQUIDATE</span>}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2>{selectedRow.name} Strategy</h2>
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
                                                <Link 
                                                    href={`/items?name=${encodeURIComponent(m)}`} 
                                                    style={{ fontWeight: 600, color: '#fff', textDecoration: 'none' }}
                                                    className="hover-underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {m}
                                                </Link>
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
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MARKET NET (AFTER 12% TAX)</span>
                                <span className="mono" style={{ fontWeight: 700 }}>{selectedRow.rev.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENDOR NET (W/ BARTERING)</span>
                                <span className="mono" style={{ fontWeight: 700 }}>{selectedRow.vendorRev.toLocaleString()}</span>
                            </div>
                            
                            <div style={{ margin: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TARGET LIST PRICE</span>
                                <span className="mono" style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{(selectedRow.rev / 0.88).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
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
    </main>
  );
}
