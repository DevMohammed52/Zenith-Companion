"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Castle, FlaskConical, Package, Skull, Star, Swords, TrendingUp, X } from "lucide-react";
import { ALCHEMY_ITEMS, VIAL_COSTS } from "../constants";
import { formatGold } from "@/lib/format";
import { useWatchlist } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { useRouter } from "next/navigation";

type MarketItem = {
  avg_3?: number;
  avg_14?: number;
  vol_3?: number;
  last_updated?: string;
};

type MarketData = Record<string, MarketItem> & {
  _meta?: {
    last_updated?: string;
  };
};

type StaticData = {
  enemies?: unknown[];
  dungeons?: unknown[];
  world_bosses?: unknown[];
};

const toolLinks = [
  { href: "/alchemy", label: "Alchemy", icon: FlaskConical, detail: "Profit, ROI, daily yield" },
  { href: "/items", label: "Market Items", icon: Package, detail: "Prices, recipes, drops" },
  { href: "/combat", label: "Combat", icon: Swords, detail: "Enemy drop lookup" },
  { href: "/dungeons", label: "Dungeons", icon: Castle, detail: "Dungeon loot tables" },
  { href: "/bosses", label: "World Bosses", icon: Skull, detail: "Boss drops and locations" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { marketData, staticData } = useData();
  const { openItemByName, prefetchItem } = useItemModal();
  const { watchlist } = useWatchlist();

  const profitableAlchemy = useMemo(() => {
    if (!marketData) return [];

    return Object.entries(ALCHEMY_ITEMS)
      .map(([name, recipe]) => {
        const sellPrice = marketData[name]?.avg_3 || 0;
        let craftCost = VIAL_COSTS[recipe.vial] || 0;
        let hasAllPrices = sellPrice > 0;

        // Add material costs
        for (const [material, qty] of Object.entries(recipe.materials)) {
          const materialPrice = marketData[material]?.avg_3 || 0;
          if (materialPrice <= 0) {
            hasAllPrices = false;
            break;
          }
          craftCost += materialPrice * qty;
        }

        // Add recipe cost for Mythics (amortized over 30 uses)
        const recipeName = `Recipe: ${name}`;
        const recipePrice = marketData[recipeName]?.avg_3 || 0;
        const isMythic = marketData[name]?.quality === 'MYTHIC';
        
        if (isMythic && recipePrice > 0) {
          craftCost += (recipePrice / 30);
        }

        const netRevenue = sellPrice * 0.88;
        const profit = hasAllPrices ? netRevenue - craftCost : 0;
        const roi = craftCost > 0 ? (profit / craftCost) * 100 : 0;
        return { name, profit, roi, volume: marketData[name]?.vol_3 || 0, craftCost, netRevenue };
      })
      .filter(item => item.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [marketData]);

  const marketItems = marketData ? Object.keys(marketData).filter(key => !key.startsWith("_")) : [];
  const watchedRecipes = watchlist.filter(name => ALCHEMY_ITEMS[name]);

  return (
    <main className="container dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <Activity size={24} color="var(--text-accent)" /> Zenith Dashboard
          </h1>
          <p className="dashboard-subtitle">Market cache, tool shortcuts, and the highest-value alchemy opportunities in one place.</p>
        </div>
      </div>

      <section className="dashboard-metrics">
        <div className="stat-card clickable" onClick={() => router.push('/items')}>
          <span className="stat-label">Tracked Items</span>
          <span className="stat-value mono">{marketItems.length.toLocaleString()}</span>
        </div>
        <div className="stat-card highlight clickable" onClick={() => router.push('/alchemy')}>
          <span className="stat-label">Profitable Alchemy</span>
          <span className="stat-value mono">{profitableAlchemy.length.toLocaleString()}</span>
        </div>
        <div className="stat-card clickable" onClick={() => router.push('/combat')}>
          <span className="stat-label">Combat Sources</span>
          <span className="stat-value mono">{((staticData?.enemies?.length || 0) + (staticData?.dungeons?.length || 0) + (staticData?.world_bosses?.length || 0)).toLocaleString()}</span>
        </div>
        <div className="stat-card clickable" onClick={() => router.push('/alchemy')}>
          <span className="stat-label">Alchemy Recipes</span>
          <span className="stat-value mono">{Object.keys(ALCHEMY_ITEMS).length.toLocaleString()}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2><TrendingUp size={17} /> Top Alchemy Profit</h2>
            <Link href="/alchemy" className="panel-link">Open <ArrowRight size={14} /></Link>
          </div>
          <div className="dashboard-list">
            {profitableAlchemy.length > 0 ? profitableAlchemy.map(item => (
              <button 
                key={item.name} 
                type="button" 
                className="dashboard-row dashboard-row-button group" 
                onClick={() => openItemByName(item.name)}
                onMouseEnter={() => prefetchItem(item.name)}
              >
                <span className="group-hover:text-accent transition-colors">{item.name}</span>
                <span className="mono profit-positive">+{formatGold(item.profit)}g</span>
              </button>
            )) : (
              <div className="dashboard-empty">Waiting for enough market data to rank recipes.</div>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2><Package size={17} /> Tool Map</h2>
          </div>
          <div className="tool-grid">
            {toolLinks.map(tool => {
              const Icon = tool.icon;
              return (
                <Link href={tool.href} key={tool.href} className="tool-card">
                  <Icon size={18} color="var(--text-accent)" />
                  <span>
                    <strong>{tool.label}</strong>
                    <small>{tool.detail}</small>
                  </span>
                  <ArrowRight size={14} />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="dashboard-panel dashboard-panel-wide">
          <div className="panel-header">
            <h2><Star size={17} /> Watchlist</h2>
          </div>
          <div className="dashboard-list">
            {watchedRecipes.length > 0 ? watchedRecipes.map(name => {
              const match = profitableAlchemy.find(item => item.name === name);
              return (
                <button 
                    key={name} 
                    type="button" 
                    className="dashboard-row dashboard-row-button group" 
                    onClick={() => openItemByName(name)}
                    onMouseEnter={() => prefetchItem(name)}
                >
                  <span className="group-hover:text-accent transition-colors">{name}</span>
                  <span className={match?.profit ? "mono profit-positive" : "mono text-muted"}>
                    {match?.profit ? `+${formatGold(match.profit)}g` : "Inspect"}
                  </span>
                </button>
              );
            }) : (
              <div className="dashboard-empty">Pin items to your watchlist to track them here.</div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .stat-card.clickable {
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .stat-card.clickable:hover {
            border-color: var(--text-accent);
            background: rgba(255,255,255,0.05);
            transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
