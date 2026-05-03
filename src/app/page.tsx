"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, BookOpen, Castle, Package,
  Skull, Star, Swords, TrendingUp, Hammer, Sparkles,
  AlertCircle, ShoppingCart, Target
} from "lucide-react";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../constants";
import { formatGold } from "@/lib/format";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { useCrafting } from "@/context/CraftingContext";
import { useRouter } from "next/navigation";
import {
  calculateSkillProfitRows,
  DEFAULT_TOOL_SELECTIONS,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import { LORE_ENTRIES, LORE_RELATIONS, LORE_THEORIES, type LoreRelation } from "@/data/lore";

export default function DashboardPage() {
  const router = useRouter();
  const { marketData, allItemsDb } = useData();
  const { openItemByName } = useItemModal();
  const { preferences } = usePreferences();
  const { queue } = useCrafting();

  const [activeMythicNames, setActiveMythicNames] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem("zenith_mythic_active_recipes");
    if (saved) {
      try { setActiveMythicNames(JSON.parse(saved)); } catch {}
    }
  }, []);

  const profitableAlchemy = useMemo(() => {
    if (!marketData) return [];

    const barter = (Number(preferences.barteringBoost) || 0) / 100;
    const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);

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

        const marketNet = sellPrice * marketTaxMultiplier;
        const vendorNet = (itemInfo.vendor_price || 0) * (1 + barter);
        const bestRevenue = Math.max(marketNet, vendorNet);
        const profit = bestRevenue - matCost;
        const roi = matCost > 0 ? (profit / matCost) * 100 : 0;

        return { name, profit, roi, volume: marketData[name]?.vol_3 || 0, quality: itemInfo.quality };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [marketData, allItemsDb, preferences.barteringBoost, preferences.membership]);

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
      
      totalProfit += (sellPrice * getMarketTaxMultiplier(preferences.membership) - cost) * quantity;
    });

    return { count: queueEntries.length, potentialProfit: totalProfit };
  }, [queueEntries, marketData, preferences.membership]);

  const skillProfitSettings = useMemo<SkillProfitSettings>(() => ({
    membership: preferences.membership,
    classBonus: preferences.skillClassBonus,
    energizingPoolExp: 0,
    assaultRank: preferences.assaultRank,
    ascensionBuffIds: [],
    tools: { ...DEFAULT_TOOL_SELECTIONS, ...preferences.skillTools },
    customPrices: preferences.customPrices,
    barteringBoost: preferences.barteringBoost,
  }), [
    preferences.assaultRank,
    preferences.barteringBoost,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
  ]);

  const topSkillProfitRows = useMemo(() => {
    if (!marketData) return [];
    return calculateSkillProfitRows(marketData, allItemsDb, skillProfitSettings, [], 100)
      .filter((row) => !row.excludedFromTop && row.profitPerHour > 0)
      .sort((a, b) => b.profitPerHour - a.profitPerHour)
      .slice(0, 5);
  }, [allItemsDb, marketData, skillProfitSettings]);

  const loreSpotlight = useMemo(() => {
    const entry = LORE_ENTRIES.find((candidate) => candidate.id === "artifacts-the-runemark-of-eternity") || LORE_ENTRIES[0];
    const visibleLinks = entry ? (LORE_RELATIONS as readonly LoreRelation[]).filter((relation) => relation.source === entry.id || relation.target === entry.id).length : 0;
    return { entry, visibleLinks, theoryCount: LORE_THEORIES.length };
  }, []);

  const lastUpdated = marketData?._meta?.last_updated;
  const timeSince = lastUpdated ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000) : null;
  const spotlightLoreEntry = loreSpotlight.entry;

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
          <div className="metric-tile clickable" onClick={() => router.push('/skill-profit')}>
            <div className="tile-icon"><BarChart3 size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Skill Routes</span>
              <span className="tile-value">{topSkillProfitRows.length}</span>
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

          {/* Skill Profit Radar */}
          <div className="bento-card-dashboard skill-profit-insight">
            <div className="card-header-dashboard">
              <div className="card-title-wrap">
                <BarChart3 size={16} />
                <h3>Skill Profit Radar</h3>
              </div>
              <Link href="/skill-profit" className="view-more">Open Finder <ArrowRight size={14} /></Link>
            </div>
            <div className="skill-profit-dashboard">
              {topSkillProfitRows.length > 0 ? (
                <>
                  <button className="skill-profit-hero" type="button" onClick={() => router.push('/skill-profit')}>
                    <span>Top route now</span>
                    <strong>{topSkillProfitRows[0].name}</strong>
                    <em>{topSkillProfitRows[0].skill} · {topSkillProfitRows[0].bestSaleSource.toUpperCase()} · {topSkillProfitRows[0].volume3d.toLocaleString()} vol</em>
                    <b>+{formatGold(topSkillProfitRows[0].profitPerHour)}g/hr</b>
                  </button>
                  <div className="insight-list">
                    {topSkillProfitRows.slice(1).map(row => (
                      <div key={`${row.skill}-${row.name}`} className="insight-row group" onClick={() => router.push('/skill-profit')}>
                        <div className="insight-name">
                          <span className="name-text">{row.name}</span>
                          <span className="roi-badge">{row.skill} · {Math.round(row.roi)}% ROI</span>
                        </div>
                        <div className="insight-profit">+{formatGold(row.profitPerHour)}g/hr</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state centered">
                  <div className="empty-state-icon-wrap">
                    <BarChart3 size={32} />
                  </div>
                  <p className="empty-text">No liquid skill routes found in the current cache.</p>
                  <Link href="/skill-profit" className="empty-action">
                    <Sparkles size={14} />
                    Tune Skill Settings
                  </Link>
                </div>
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
                  <div className="empty-state-icon-wrap">
                    <AlertCircle size={32} />
                  </div>
                  <p className="empty-text">Your queue is currently empty.</p>
                  <Link href="/alchemy" className="empty-action">
                    <Sparkles size={14} />
                    Find Profitable Recipes
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Lore Archive Fragment */}
          <div className="bento-card-dashboard lore-insight">
            <div className="card-header-dashboard">
              <div className="card-title-wrap">
                <BookOpen size={16} />
                <h3>Lore Archive Fragment</h3>
              </div>
              <Link href="/lore" className="view-more">Read Atlas <ArrowRight size={14} /></Link>
            </div>
            {spotlightLoreEntry ? (
              <button className="lore-dashboard-thread" type="button" onClick={() => router.push(`/lore?thread=${spotlightLoreEntry.id}`)}>
                <span>{spotlightLoreEntry.category}</span>
                <strong>{spotlightLoreEntry.title}</strong>
                <p>{spotlightLoreEntry.summary}</p>
                <div className="lore-dashboard-stats">
                  <em>{LORE_ENTRIES.length} records</em>
                  <em>{loreSpotlight.visibleLinks} linked threads</em>
                  <em>{loreSpotlight.theoryCount} theories</em>
                </div>
              </button>
            ) : (
              <div className="empty-state">Lore archive is still indexing.</div>
            )}
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
               <Link href="/lore" className="s-card">
                  <BookOpen size={20} />
                  <span>Lore Wiki</span>
               </Link>
            </div>
          </div>

        </div>
      </section>

      <div style={{ height: '4rem' }}></div>
    </main>
  );
}
