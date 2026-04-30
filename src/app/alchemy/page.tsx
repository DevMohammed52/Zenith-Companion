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

export default function Home() {
  const [data, setData] = useState<AllData | null>(null);
  const { preferences, setPreferences } = usePreferences();
  const [minRoi, setMinRoi] = useState(0);
  const [minVolume, setMinVolume] = useState(0);
  const [showProfitableOnly, setShowProfitableOnly] = useState(false);
  
  const [sortCol, setSortCol] = useState<keyof RowData | "">("");
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Modal state
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);

  // Poll the JSON file every 3 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/market-data.json?t=" + new Date().getTime());
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        // silent fail on fetch
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (col: keyof RowData) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const rows = useMemo(() => {
    const calculated = [];
    
    const parsedBartering = Number(preferences.barteringBoost) || 0;
    const parsedActiveHours = Number(preferences.activeHours) || 0;

    for (const [name, recipe] of Object.entries(ALCHEMY_ITEMS)) {
      const pData = data?.[name];
      const price = pData?.avg_3 || 0; // Baseline is now 3-day average

      if (!pData || price <= 0) {
        calculated.push({ name, loading: true } as RowData);
        continue;
      }

      // Trend Calculation based on 3-day vs 14-day
      const avg3 = pData.avg_3 || 0;
      const avg14 = pData.avg_14 || 0;
      let trend: "up" | "down" | "flat" = "flat";
      if (avg3 > avg14 * 1.05) trend = "up";
      else if (avg3 < avg14 * 0.95) trend = "down";

      // Cost Calculation
      let matCost = VIAL_COSTS[recipe.vial] || 0;
      let matsSellVal = 0;
      let matsValid = true;

      for (const [mName, qty] of Object.entries(recipe.materials)) {
        const mPrice = data?.[mName]?.avg_3 || 0; // Materials use 3-day average
        if (mPrice <= 0) {
          matsValid = false;
          break;
        }
        matCost += mPrice * qty;
        
        // Liquidating materials on market incurs 12% tax
        matsSellVal += (mPrice * 0.88) * qty;
      }

      if (!matsValid) {
        calculated.push({ name, loading: true } as RowData);
        continue;
      }

      // Profit Calculation (Market)
      const rev = price * 0.88;
      
      // Vendor Alternative
      const baseVendor = pData.vendor_price || 0;
      const vendorRev = baseVendor * (1 + (parsedBartering / 100));

      const bestRev = Math.max(rev, vendorRev, matsSellVal);
      const profit = bestRev - matCost;
      const roi = matCost > 0 ? (profit / matCost) * 100 : 0; 

      // Daily Profit Math
      const craftsPerDay = (parsedActiveHours * 3600) / (recipe.time || 1090.9);
      const dailyProfit = profit * craftsPerDay;

      // Arbitrage Check
      let action: "CRAFT" | "LIQUIDATE" | "VENDOR" = "LIQUIDATE";
      if (bestRev === vendorRev && vendorRev > matsSellVal) {
        action = "VENDOR";
      } else if (bestRev === rev && rev > matsSellVal) {
        action = "CRAFT";
      }

      calculated.push({
        name,
        trend,
        cost: matCost,
        rev: bestRev,
        vendorRev,
        profit,
        roi,
        dailyProfit,
        vol_3: pData.vol_3 || 0,
        action,
        loading: false,
        matsSellVal,
        vialCost: VIAL_COSTS[recipe.vial] || 0
      });
    }

    const filtered = calculated.filter((row) => {
      if (row.loading) return true;
      if (showProfitableOnly && row.profit <= 0) return false;
      if (row.roi < minRoi) return false;
      if (row.vol_3 < minVolume) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (a.loading) return 1;
      if (b.loading) return -1;
      if (!sortCol) return b.profit - a.profit; // default sort
      
      const valA = a[sortCol];
      const valB = b[sortCol];
      
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [data, preferences.barteringBoost, preferences.activeHours, sortCol, sortDesc, showProfitableOnly, minRoi, minVolume]);

  useEffect(() => {
    const recipe = new URLSearchParams(window.location.search).get("recipe");
    if (!recipe || selectedRow || rows.length === 0) return;
    const match = rows.find(row => row.name === recipe && !row.loading);
    if (match) setSelectedRow(match);
  }, [rows, selectedRow]);

  const renderSortIcon = (col: keyof RowData) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  const getTargetBuy = (price: number) => price * 0.95; // 5% below average

  return (
    <main className="container">
      <div className="header">
        <h1 className="header-title">
          <Activity size={24} color="var(--text-accent)" /> ALCHEMY PROFIT FINDER
        </h1>
      </div>

      <div className="controls">
        <div className="control-group">
          <label className="control-label">Bartering Boost (%)</label>
          <input 
            type="number" 
            className="control-input"
            value={preferences.barteringBoost}
            onChange={(e) => {
              setPreferences({ barteringBoost: Math.min(20, Math.max(0, Number(e.target.value) || 0)) });
            }}
            min="0"
            max="20"
          />
        </div>
        <div className="control-group">
          <label className="control-label">Active Hours / Day</label>
          <input 
            type="number" 
            className="control-input"
            value={preferences.activeHours}
            onChange={(e) => {
              setPreferences({ activeHours: Math.min(24, Math.max(0, Number(e.target.value) || 0)) });
            }}
            min="0"
            max="24"
            step="0.5"
          />
        </div>
        <div className="control-group">
          <label className="control-label">Min ROI %</label>
          <input
            type="number"
            className="control-input"
            value={minRoi}
            onChange={(e) => setMinRoi(Math.max(0, Number(e.target.value) || 0))}
            min="0"
            step="0.1"
          />
        </div>
        <div className="control-group">
          <label className="control-label">Min 3D Volume</label>
          <input
            type="number"
            className="control-input"
            value={minVolume}
            onChange={(e) => setMinVolume(Math.max(0, Number(e.target.value) || 0))}
            min="0"
          />
        </div>
        <div className="control-group" style={{ justifyContent: "flex-end" }}>
          <label className="control-label" style={{ marginBottom: "0.5rem" }}>Advanced</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showProfitableOnly}
              onChange={(e) => setShowProfitableOnly(e.target.checked)}
            />
            <span className="text-muted">Only Profitable</span>
          </label>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="sortable left-align" onClick={() => handleSort("name")}>
                Asset {renderSortIcon("name")}
              </th>
              <th className="sortable" onClick={() => handleSort("trend")}>
                Trend {renderSortIcon("trend")}
              </th>
              <th className="sortable" onClick={() => handleSort("cost")}>
                Est. Cost {renderSortIcon("cost")}
              </th>
              <th className="sortable" onClick={() => handleSort("rev")}>
                Best Revenue {renderSortIcon("rev")}
              </th>
              <th className="sortable" onClick={() => handleSort("profit")}>
                Net Profit {renderSortIcon("profit")}
              </th>
              <th className="sortable" onClick={() => handleSort("dailyProfit")}>
                Daily Profit {renderSortIcon("dailyProfit")}
              </th>
              <th className="sortable" onClick={() => handleSort("roi")}>
                ROI % {renderSortIcon("roi")}
              </th>
              <th className="sortable" onClick={() => handleSort("vol_3")}>
                3D Vol {renderSortIcon("vol_3")}
              </th>
              <th>Action</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} onClick={() => !row.loading && setSelectedRow(row)} className="clickable-row">
                <td className="item-name left-align">{row.name}</td>
                {row.loading ? (
                  <>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td></td>
                  </>
                ) : (
                  <>
                    <td>
                      {row.trend === "up" && <span className="trend-up"><ChevronUp size={16} /> RISING</span>}
                      {row.trend === "down" && <span className="trend-down"><ChevronDown size={16} /> FALLING</span>}
                      {row.trend === "flat" && <span className="trend-flat"><Minus size={16} /> STABLE</span>}
                    </td>
                    <td className="mono text-muted">{row.cost.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    <td className="mono text-muted">{row.rev.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    <td className={`mono ${row.profit > 0 ? 'profit-positive' : 'profit-negative'}`}>
                      {row.profit > 0 ? '+' : ''}{row.profit.toLocaleString(undefined, {maximumFractionDigits:0})}
                    </td>
                    <td className={`mono ${row.dailyProfit > 0 ? 'profit-positive' : 'profit-negative'}`}>
                      {row.dailyProfit > 0 ? '+' : ''}{row.dailyProfit.toLocaleString(undefined, {maximumFractionDigits:0})}
                    </td>
                    <td className={`mono ${row.roi > 0 ? 'profit-positive' : 'profit-negative'}`}>
                      {row.roi > 0 ? '+' : ''}{row.roi.toLocaleString(undefined, {maximumFractionDigits:1})}%
                    </td>
                    <td className="mono text-main">{row.vol_3.toLocaleString()}</td>
                    <td>
                      {row.action === "CRAFT" && <span className="action-badge action-craft">MARKET SELL</span>}
                      {row.action === "VENDOR" && <span className="action-badge action-vendor">NPC VENDOR</span>}
                      {row.action === "LIQUIDATE" && <span className="action-badge action-liquidate">LIQUIDATE MATS</span>}
                    </td>
                    <td className="text-muted"><Info size={16} style={{opacity: 0.5}}/></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRow.name} Strategy</h2>
              <button className="close-btn" onClick={() => setSelectedRow(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="strategy-grid">
                
                {/* Buy Strategy */}
                <div className="strategy-card">
                  <div className="section-title">
                    <Target size={16} /> Acquisition Strategy
                  </div>
                  <div className="materials-list">
                    {Object.entries(ALCHEMY_ITEMS[selectedRow.name]?.materials || {}).map(([mName, qty]) => {
                      const mAvg = data?.[mName]?.avg_3 || 0;
                      return (
                        <Link key={mName} href={`/items?name=${encodeURIComponent(mName)}`} className="source-row" style={{ textDecoration: 'none' }}>
                          <div>
                            <span className="text-muted">{qty}x</span> <span style={{ color: '#fff' }}>{mName}</span>
                          </div>
                          <div className="mono" style={{ fontSize: '0.8rem' }}>
                            <span className="text-muted">{mAvg.toLocaleString(undefined, {maximumFractionDigits:0})} ea</span>
                            <span style={{ margin: '0 0.3rem', color: 'var(--border-focus)' }}>-&gt;</span>
                            <span className="buy-target">{(mAvg * qty).toLocaleString(undefined, {maximumFractionDigits:0})}g</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="stat-row mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1rem', paddingTop: '1rem' }}>
                    <span className="stat-label">Vial Cost (Fixed)</span>
                    <span className="mono">{selectedRow.vialCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Sell Strategy */}
                <div className="strategy-card">
                  <div className="section-title">
                    <Info size={16} /> Execution & Math
                  </div>
                  
                  <div className="stat-row">
                    <span className="stat-label">Raw Material Value</span>
                    <span className="mono">{selectedRow.cost.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Market Net (after 12% tax)</span>
                    <span className="mono">{((data?.[selectedRow.name]?.avg_3 || 0) * 0.88).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Vendor Net (w/ Bartering)</span>
                    <span className="mono">{selectedRow.vendorRev.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                  </div>
                  
                  <div className="stat-row mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1rem', paddingTop: '1rem' }}>
                    <span className="stat-label">Target List Price</span>
                    <span className="mono sell-target">
                      {(data?.[selectedRow.name]?.avg_3 || 0).toLocaleString(undefined, {maximumFractionDigits:0})}
                    </span>
                  </div>
                  
                  <div className="stat-row">
                    <span className="stat-label">Projected Net Profit</span>
                    <span className={`mono ${selectedRow.profit > 0 ? 'profit-positive' : 'profit-negative'}`}>
                      {selectedRow.profit > 0 ? '+' : ''}{selectedRow.profit.toLocaleString(undefined, {maximumFractionDigits:0})}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Est. Daily Profit ({preferences.activeHours}h)</span>
                    <span className={`mono ${selectedRow.dailyProfit > 0 ? 'profit-positive' : 'profit-negative'}`}>
                      {selectedRow.dailyProfit > 0 ? '+' : ''}{selectedRow.dailyProfit.toLocaleString(undefined, {maximumFractionDigits:0})}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Return on Investment (ROI)</span>
                    <span className={`mono ${selectedRow.roi > 0 ? 'profit-positive' : 'profit-negative'}`}>
                      {selectedRow.roi > 0 ? '+' : ''}{selectedRow.roi.toLocaleString(undefined, {maximumFractionDigits:1})}%
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">3-Day Liquidity (Volume)</span>
                    <span className="mono">{selectedRow.vol_3.toLocaleString()} Sold</span>
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
