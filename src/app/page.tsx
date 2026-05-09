"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, BookOpen, Castle, Package,
  Skull, Star, Swords, TrendingUp, Hammer, Sparkles,
  AlertCircle, ShoppingCart, Target, PawPrint, UserRound, Home
} from "lucide-react";
import { ALCHEMY_ITEMS, getMerchantBuyPrice } from "../constants";
import { formatGold } from "@/lib/format";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { useCrafting } from "@/context/CraftingContext";
import { useRouter } from "next/navigation";
import {
  calculateSkillProfitRows,
  DEFAULT_TOOL_SELECTIONS,
  SKILLS,
  type SkillName,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import { calculateCraftingQueuePlan } from "@/lib/crafting-queue";
import { getSafeMarketValue } from "@/lib/market-pricing";
import { LORE_ENTRIES, LORE_RELATIONS, LORE_THEORIES, type LoreRelation } from "@/data/lore";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  SKILL_TO_HOUSING_ACTIVITY,
  calculateHousingBuffs,
  formatHours,
  getHousingActivityLabel,
  getHousingIdleHoursForActivity,
} from "@/lib/housing";

const MYTHIC_ACTIVE_RECIPES_STORAGE_KEY = "zenith_mythic_active_recipes";

function getDashboardInputPrice(
  name: string,
  marketData: Record<string, { avg_3?: number; avg_7?: number; avg_14?: number; avg_30?: number; price?: number }> | null,
  customPrices?: Record<string, number>,
) {
  const custom = Number(customPrices?.[name] || 0);
  if (custom > 0) return custom;
  return getMerchantBuyPrice(name) || getSafeMarketValue(marketData?.[name]);
}

export default function DashboardPage() {
  const router = useRouter();
  const { marketData, allItemsDb } = useData();
  const { openItemByName } = useItemModal();
  const { preferences } = usePreferences();
  const { activeProfile, state: profileState } = useProfiles();
  const { queue } = useCrafting();

  const [activeMythicNames, setActiveMythicNames] = useState<string[]>([]);
  const [petDatabaseCount, setPetDatabaseCount] = useState(0);
  const activeMythicStorageKey = useMemo(
    () => getProfileStorageKey(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );
  const activeProfileId = activeProfile?.id || null;
  const housingSummary = useMemo(() => calculateHousingBuffs(activeProfile?.housing), [activeProfile?.housing]);
  const dashboardHousingSlotStatus = useMemo(() => {
    if (housingSummary.mode === "none") return "Not set";
    if (housingSummary.mode === "guest") {
      const count = housingSummary.activeComponentCount;
      return count > 0 ? `Guest · ${count} buff${count === 1 ? "" : "s"}` : "Guest · No buffs";
    }
    if (housingSummary.slotCapacity <= 0) return "Owner · No foundation";
    const overage = Math.max(0, housingSummary.activeComponentCount - housingSummary.slotCapacity);
    if (overage > 0) return `Owner · ${overage} over`;
    return `Owner · ${housingSummary.activeComponentCount}/${housingSummary.slotCapacity} slots`;
  }, [housingSummary]);
  
  const dashboardHousingStatus = useMemo(() => {
    if (housingSummary.mode === "none") return "Not set";
    const strongest = housingSummary.strongestIdleBonus;
    if (strongest) {
      const scope = housingSummary.availableAnywhere ? "anywhere" : housingSummary.location ? housingSummary.location : "location-limited";
      return `${housingSummary.mode === "guest" ? "Guest" : "Owner"} ${getHousingActivityLabel(strongest.activity)} +${formatHours(strongest.hours)} (${scope})`;
    }
    if (housingSummary.mode === "guest") return "Guest - No buffs";
    if (housingSummary.slotCapacity <= 0) return "Owner - No foundation";
    if (housingSummary.remoteConduit) return "Remote access";
    if (housingSummary.petQuarters) return "Pet Quarters";
    if (housingSummary.houseLedger) return "House Ledger";
    return dashboardHousingSlotStatus.includes("over") ? "Slot over limit" : "Owner - No buffs";
  }, [dashboardHousingSlotStatus, housingSummary]);

  useEffect(() => {
    const saved = localStorage.getItem(activeMythicStorageKey) ?? (activeProfileId ? null : localStorage.getItem(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY));
    if (saved) {
      try { setActiveMythicNames(JSON.parse(saved)); } catch {}
    } else {
      setActiveMythicNames([]);
    }
  }, [activeMythicStorageKey, activeProfileId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (cancelled) return;
        const pets = Array.isArray(payload?.pets) ? payload.pets : [];
        setPetDatabaseCount(pets.length);
      })
      .catch(() => {
        if (!cancelled) setPetDatabaseCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const profitableAlchemy = useMemo(() => {
    if (!marketData) return [];

    const barter = (Number(activeProfile ? getProfileBarteringBoost(activeProfile) : 0) || 0) / 100;
    const marketTaxMultiplier = getMarketTaxMultiplier(preferences.membership);

    return Object.entries(ALCHEMY_ITEMS)
      .map(([name, recipe]) => {
        const itemInfo = allItemsDb?.[name] || marketData[name] || {};
        const isMythic = itemInfo.quality === 'MYTHIC';
        if (isMythic) return null; // Filter out mythics for the basic list

        const customSellPrice = Number(preferences.customPrices?.[name] || 0);
        const sellPrice = customSellPrice || getSafeMarketValue(marketData[name]);
        let matCost = getDashboardInputPrice(recipe.vial, marketData, preferences.customPrices);
        let hasAllPrices = sellPrice > 0 || (itemInfo.vendor_price > 0);

        // Add material costs
        for (const [material, qty] of Object.entries(recipe.materials)) {
          const materialPrice = getDashboardInputPrice(material, marketData, preferences.customPrices);
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
  }, [activeProfile, marketData, allItemsDb, preferences.customPrices, preferences.membership]);

  const queuePlan = useMemo(
    () => calculateCraftingQueuePlan(queue, marketData, allItemsDb, {
      ...preferences,
      barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
    }),
    [activeProfile, allItemsDb, marketData, preferences, queue],
  );
  const queueEntries = queuePlan.entries;

  const skillProfitSettings = useMemo<SkillProfitSettings>(() => ({
    membership: preferences.membership,
    classBonus: activeProfile ? false : preferences.skillClassBonus,
    profileClassName: activeProfile?.className || undefined,
    energizingPoolExp: 0,
    assaultRank: activeProfile ? getProfileConquestRank(activeProfile) : preferences.assaultRank,
    ascensionBuffIds: [],
    tools: activeProfile
      ? {
          Woodcutting: activeProfile.tools.woodcutting ?? "",
          Mining: activeProfile.tools.mining ?? "",
          Fishing: activeProfile.tools.fishing ?? "",
        }
      : {
          ...DEFAULT_TOOL_SELECTIONS,
          ...preferences.skillTools,
        },
    customPrices: preferences.customPrices,
    barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
    housingIdleHoursBySkill: Object.fromEntries(SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      return [skill, activity ? getHousingIdleHoursForActivity(housingSummary, activity) : 0];
    })) as Partial<Record<SkillName, number>>,
  }), [
    activeProfile,
    housingSummary,
    preferences.assaultRank,
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
          <div className="metric-tile clickable" onClick={() => router.push('/profiles')}>
            <div className="tile-icon"><UserRound size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Active Profile</span>
              <span className="tile-value">{activeProfile?.name?.trim() || `${profileState.profiles.length}/5`}</span>
            </div>
          </div>
          <div className="metric-tile clickable" onClick={() => router.push('/pets')}>
            <div className="tile-icon"><PawPrint size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Pet Database</span>
              <span className="tile-value">{petDatabaseCount || "Open"}</span>
            </div>
          </div>
          <div className="metric-tile clickable" onClick={() => router.push('/housing')}>
            <div className="tile-icon"><Home size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Housing</span>
              <span className="tile-value">{dashboardHousingStatus}</span>
            </div>
          </div>
          <div className="metric-tile clickable" onClick={() => router.push('/crafting')}>
            <div className="tile-icon"><Hammer size={20} /></div>
            <div className="tile-info">
              <span className="tile-label">Queue Crafts</span>
              <span className="tile-value">{queuePlan.totalCrafts}</span>
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
                      <span className="q-label">Crafts Remaining</span>
                      <span className="q-val">{queuePlan.totalCrafts.toLocaleString()} crafts</span>
                    </div>
                    <div className="q-stat">
                      <span className="q-label">Potential Profit</span>
                      <span className={`q-val ${queuePlan.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                        {queuePlan.totalProfit >= 0 ? '+' : ''}{formatGold(queuePlan.totalProfit)}g
                      </span>
                    </div>
                  </div>
                  <div className="queue-preview-list">
                    {queueEntries.slice(0, 5).map((entry) => (
                      <div key={entry.name} className="preview-item-row" onClick={() => openItemByName(entry.name)}>
                        <div className="preview-dot"></div>
                        <span className="preview-name">{entry.name}</span>
                        <span className="preview-qty">x{entry.quantity}</span>
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
                 <Link href="/profiles" className="s-card">
                    <UserRound size={20} />
                    <span>Profiles</span>
                 </Link>
                 <Link href="/pets" className="s-card">
                    <PawPrint size={20} />
                    <span>Pet Database</span>
                 </Link>
                 <Link href="/housing" className="s-card">
                    <Home size={20} />
                    <span>Housing</span>
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
