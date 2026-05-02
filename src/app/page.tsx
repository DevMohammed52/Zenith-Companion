"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  Activity, ArrowRight, Castle, FlaskConical, Package, 
  Skull, Star, Swords, TrendingUp, Hammer, Sparkles, 
  Clock, CheckCircle2, AlertCircle, ShoppingCart, Target
} from "lucide-react";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../constants";
import { formatGold } from "@/lib/format";
import { useWatchlist, usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { useCrafting } from "@/context/CraftingContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { marketData, allItemsDb, staticData } = useData();
  const { openItemByName, prefetchItem } = useItemModal();
  const { watchlist } = useWatchlist();
  const { preferences } = usePreferences();
  const { queue } = useCrafting();

  const [activeMythicNames, setActiveMythicNames] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem("zenith_mythic_active_recipes");
    if (saved) {
      try { setActiveMythicNames(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const profitableAlchemy = useMemo(() => {
    if (!marketData) return [];

    const barter = (Number(preferences.barteringBoost) || 0) / 100;

    return Object.entries(ALCHEMY_ITEMS)
      .map(([name, recipe]) => {
        const itemInfo = allItemsDb?.[name] || marketData[name] || {};
        const isMythic = itemInfo.quality === 'MYTHIC';
        if (isMythic) return null; // Filter out mythics for the basic list

        const sellPrice = marketData[name]?.avg_3 || 0;
        let matCost = VIAL_COSTS[recipe.vial] || 0;
        let hasAllPrices = sellPrice > 0 || (itemInfo.vendor_price > 0);

        // Add material costs
        for (const [material, qty] of Object.entries(recipe.materials)) {
          const materialPrice = marketData[material]?.avg_3 || VIAL_COSTS[material] || 0;
          if (materialPrice <= 0) {
            hasAllPrices = false;
            break;
          }
          matCost += materialPrice * qty;
        }

        if (!hasAllPrices) return null;

        const marketNet = sellPrice * 0.88;
        const vendorNet = (itemInfo.vendor_price || 0) * (1 + barter);
        const bestRevenue = Math.max(marketNet, vendorNet);
        const profit = bestRevenue - matCost;
        const roi = matCost > 0 ? (profit / matCost) * 100 : 0;

        return { name, profit, roi, volume: marketData[name]?.vol_3 || 0, quality: itemInfo.quality };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [marketData, allItemsDb, preferences.barteringBoost]);

  const queueEntries = useMemo(() => Object.entries(queue), [queue]);

  const queueStats = useMemo(() => {
    if (!queueEntries.length || !marketData) return { count: 0, potentialProfit: 0 };
    let totalProfit = 0;
    
    queueEntries.forEach(([name, quantity]) => {
      const recipe = ALCHEMY_ITEMS[name];
      if (!recipe) return;
      
      const sellPrice = marketData[name]?.avg_3 || 0;
      let cost = VIAL_COSTS[recipe.vial] || 0;
      Object.entries(recipe.materials).forEach(([m, q]) => {
        cost += (marketData[m]?.avg_3 || VIAL_COSTS[m] || 0) * q;
      });
      
      totalProfit += (sellPrice * 0.88 - cost) * quantity;
    });

    return { count: queueEntries.length, potentialProfit: totalProfit };
  }, [queueEntries, marketData]);

  const lastUpdated = marketData?._meta?.last_updated;
  const timeSince = lastUpdated ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000) : null;

  return (
    <main className="container dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            Zenith Operations <Sparkles size={20} className="sparkle-icon" />
          </h1>
          <p className="dashboard-subtitle">Real-time intelligence across Alchemy, Mythic Labs, and the Global Market.</p>
        </div>
        
        <div className="market-pulse-card">
          <div className="pulse-label">
             <div className={`pulse-dot ${timeSince !== null && timeSince < 60 ? 'active' : 'stale'}`}></div>
             MARKET PULSE
          </div>
          <div className="pulse-time">{timeSince !== null ? `${timeSince}m ago` : 'Waiting for data...'}</div>
          <div className="pulse-meta">{Object.keys(marketData || {}).length.toLocaleString()} items cached</div>
        </div>
      </div>

      <section className="bento-dashboard">
        {/* Row 1: Key Metrics */}
        <div className="bento-row metrics-row">
          <div className="metric-tile clickable" onClick={() => router.push('/items')}>
            <div className="tile-icon"><Package size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Global Registry</span>
              <span className="tile-value">{(Object.keys(allItemsDb || {}).length || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="metric-tile clickable" onClick={() => router.push('/alchemy')}>
            <div className="tile-icon"><TrendingUp size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Profitable Recipes</span>
              <span className="tile-value">{profitableAlchemy.length}</span>
            </div>
          </div>
          <div className="metric-tile clickable" onClick={() => router.push('/crafting')}>
            <div className="tile-icon"><Hammer size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Queue Items</span>
              <span className="tile-value">{queueEntries.length}</span>
            </div>
          </div>
          <div className="metric-tile clickable" onClick={() => router.push('/alchemy/mythic')}>
            <div className="tile-icon"><Sparkles size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Active Lab Projects</span>
              <span className="tile-value">{activeMythicNames.length}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Deep Insights */}
        <div className="bento-grid-dashboard">
          
          {/* Top Opportunities */}
          <div className="bento-card-dashboard alchemy-insight">
            <div className="card-header-dashboard">
              <div className="card-title-wrap">
                <TrendingUp size={16} />
                <h3>Top Alchemy Margins</h3>
              </div>
              <Link href="/alchemy" className="view-more">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="insight-list">
              {profitableAlchemy.length > 0 ? profitableAlchemy.map(item => (
                <div key={item.name} className="insight-row group" onClick={() => openItemByName(item.name)}>
                  <div className="insight-name">
                    <span className="name-text">{item.name}</span>
                    <span className="roi-badge">{Math.round(item.roi)}% ROI</span>
                  </div>
                  <div className="insight-profit">+{formatGold(item.profit)}g</div>
                </div>
              )) : (
                <div className="empty-state">No profitable opportunities found in current cache.</div>
              )}
            </div>
          </div>

          {/* Crafting Queue Summary */}
          <div className="bento-card-dashboard queue-insight">
            <div className="card-header-dashboard">
                <div className="card-title-wrap">
                  <ShoppingCart size={16} />
                  <h3>Active Crafting Queue</h3>
                </div>
                <Link href="/crafting" className="view-more">Manage <ArrowRight size={14} /></Link>
            </div>
            <div className="queue-content">
              {queueEntries.length > 0 ? (
                <div className="queue-inner-flex">
                  <div className="queue-stats-main">
                    <div className="q-stat">
                      <span className="q-label">Items Remaining</span>
                      <span className="q-val">{queueEntries.length} items</span>
                    </div>
                    <div className="q-stat">
                      <span className="q-label">Potential Profit</span>
                      <span className="q-val profit-positive">+{formatGold(queueStats.potentialProfit)}g</span>
                    </div>
                  </div>
                  <div className="queue-preview-list">
                    {queueEntries.slice(0, 5).map(([name, quantity], i) => (
                      <div key={i} className="preview-item-row" onClick={() => openItemByName(name)}>
                        <div className="preview-dot"></div>
                        <span className="preview-name">{name}</span>
                        <span className="preview-qty">x{quantity}</span>
                      </div>
                    ))}
                    {queueEntries.length > 5 && <div className="preview-more-link">+{queueEntries.length - 5} more items in queue...</div>}
                  </div>
                </div>
              ) : (
                <div className="empty-state centered">
                  <AlertCircle size={24} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                  <p>Your queue is currently empty.</p>
                  <Link href="/alchemy" className="empty-action">Find Profitable Recipes</Link>
                </div>
              )}
            </div>
          </div>

          {/* Mythic Lab Insight */}
          <div className="bento-card-dashboard lab-insight full-width">
            <div className="card-header-dashboard">
                <div className="card-title-wrap">
                  <Target size={16} />
                  <h3>Mythic Laboratory Insights</h3>
                </div>
                <Link href="/alchemy/mythic" className="view-more">Open Lab <ArrowRight size={14} /></Link>
            </div>
            <div className="lab-preview-grid">
               {activeMythicNames.length > 0 ? (
                 <>
                   <div className="lab-status-text">
                     Tracking <strong>{activeMythicNames.length}</strong> mythic projects. High-precision calculations and custom material pricing active.
                   </div>
                   <div className="lab-projects-row">
                      {activeMythicNames.map(name => (
                        <div key={name} className="lab-project-card" onClick={() => openItemByName(name)}>
                          <span className="project-name">{name}</span>
                          <span className="project-tag">ACTIVE</span>
                        </div>
                      ))}
                   </div>
                 </>
               ) : (
                 <div className="lab-empty">
                    <div className="lab-empty-text">No active mythic projects. Start a strategy in the Mythic Lab to track long-term ROI.</div>
                    <button className="lab-btn" onClick={() => router.push('/alchemy/mythic')}>Enter Laboratory</button>
                 </div>
               )}
            </div>
          </div>
          
          {/* Quick Shortcuts */}
          <div className="bento-card-dashboard shortcuts-insight full-width">
            <div className="card-header-dashboard">
                <div className="card-title-wrap">
                  <Activity size={16} />
                  <h3>Operational Tools</h3>
                </div>
            </div>
            <div className="shortcuts-grid">
               <Link href="/combat" className="s-card">
                  <Swords size={20} />
                  <span>Combat & Drops</span>
               </Link>
               <Link href="/dungeons" className="s-card">
                  <Castle size={20} />
                  <span>Dungeon Loot</span>
               </Link>
               <Link href="/bosses" className="s-card">
                  <Skull size={20} />
                  <span>World Bosses</span>
               </Link>
               <Link href="/bis" className="s-card">
                  <Star size={20} />
                  <span>BiS Gear</span>
               </Link>
            </div>
          </div>

        </div>
      </section>

      <div style={{ height: '4rem' }}></div>
    </main>
  );
}
