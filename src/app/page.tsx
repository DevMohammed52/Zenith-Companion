"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Settings, Upload, UserRound } from "lucide-react";
import ZenithIcon, { type ZenithIconName } from "@/components/icons/ZenithIcon";
import { useData } from "@/context/DataContext";
import { useCrafting } from "@/context/CraftingContext";
import { formatGold } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { isStarterProfile, useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  calculateSkillProfitRows,
  DEFAULT_TOOL_SELECTIONS,
  SKILLS,
  type SkillName,
  type SkillProfitRow,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import { calculateCraftingQueuePlan } from "@/lib/crafting-queue";
import {
  SKILL_TO_HOUSING_ACTIVITY,
  calculateHousingBuffs,
  getHousingIdleHoursForActivity,
} from "@/lib/housing";
import { MYTHIC_ACTIVE_RECIPES_STORAGE_KEY } from "@/lib/mythic-alchemy";

type DashboardMarketData = Record<string, any>;

type ModuleLink = {
  href: string;
  label: string;
  icon: ZenithIconName;
};

type ModuleGroup = {
  title: string;
  text: string;
  icon: ZenithIconName;
  links: ModuleLink[];
};

const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "Economy",
    text: "Prices, sell-through, recipes, and saved queues.",
    icon: "economy",
    links: [
      { href: "/skill-profit", label: "Skill Profit", icon: "skill" },
      { href: "/items", label: "Items", icon: "items" },
      { href: "/alchemy", label: "Alchemy", icon: "alchemy" },
      { href: "/crafting", label: "Queue", icon: "crafting" },
      { href: "/market-alerts", label: "Market Watch", icon: "bell" },
    ],
  },
  {
    title: "Character",
    text: "Local profile, house buffs, gear, tools, and pets.",
    icon: "profile",
    links: [
      { href: "/profiles", label: "Profiles", icon: "profile" },
      { href: "/housing", label: "Housing", icon: "housing" },
      { href: "/pets", label: "Pets", icon: "pets" },
      { href: "/forge", label: "Forge", icon: "forge" },
      { href: "/bis", label: "BiS", icon: "shield" },
    ],
  },
  {
    title: "Combat & World",
    text: "Enemy drops, dungeon runs, boss windows, weather, and travel.",
    icon: "world",
    links: [
      { href: "/map", label: "Map", icon: "map" },
      { href: "/weather", label: "Weather", icon: "weather" },
      { href: "/enemies", label: "Enemies", icon: "enemy" },
      { href: "/dungeons", label: "Dungeons", icon: "castle" },
      { href: "/bosses", label: "Bosses", icon: "boss" },
      { href: "/combat", label: "Combat", icon: "combat" },
    ],
  },
  {
    title: "Guild & Archive",
    text: "Guild reference data, collections, lore, and patch history.",
    icon: "archive",
    links: [
      { href: "/guilds", label: "Guilds", icon: "guild" },
      { href: "/conquest", label: "Conquest", icon: "conquest" },
      { href: "/museum", label: "Museum", icon: "museum" },
      { href: "/lore", label: "Lore", icon: "archive" },
      { href: "/pets/owned", label: "Owned Pets", icon: "pets" },
    ],
  },
];

function formatAge(minutes: number | null) {
  if (minutes === null) return "Waiting";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
}

export default function DashboardPage() {
  const { preferences } = usePreferences();
  const { activeProfile, state: profileState } = useProfiles();
  const needsProfileSetup = !activeProfile || isStarterProfile(activeProfile);
  const { queue } = useCrafting();
  const { marketData: sharedMarketData, allItemsDb } = useData({ autoLoad: false });
  const [dashboardMarketData, setDashboardMarketData] = useState<DashboardMarketData | null>(null);
  const marketData = sharedMarketData ?? dashboardMarketData;

  const [activeMythicNames, setActiveMythicNames] = useState<string[]>([]);
  const activeMythicStorageKey = useMemo(
    () => getProfileStorageKey(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );
  const housingSummary = useMemo(() => calculateHousingBuffs(activeProfile?.housing), [activeProfile?.housing]);

  useEffect(() => {
    const saved = localStorage.getItem(activeMythicStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY));
    if (!saved) {
      setActiveMythicNames([]);
      return;
    }
    try {
      setActiveMythicNames(JSON.parse(saved));
    } catch {
      setActiveMythicNames([]);
    }
  }, [activeMythicStorageKey, activeProfile?.id]);

  useEffect(() => {
    if (sharedMarketData) return;
    const controller = new AbortController();
    fetch("/market-data.json", { cache: "no-cache", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (payload && !controller.signal.aborted) setDashboardMarketData(payload);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [sharedMarketData]);

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

  const bestSkillRoute = useMemo(() => {
    if (!marketData) return null;
    const rows = calculateSkillProfitRows(marketData, allItemsDb, skillProfitSettings, [], 60);
    let best: SkillProfitRow | null = null;
    for (const row of rows) {
      if (row.excludedFromTop || row.profitPerHour <= 0) continue;
      if (!best || row.profitPerHour > best.profitPerHour) best = row;
    }
    return best;
  }, [allItemsDb, marketData, skillProfitSettings]);

  const queuePlan = useMemo(
    () => calculateCraftingQueuePlan(queue, marketData, allItemsDb, {
      ...preferences,
      barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
    }),
    [activeProfile, allItemsDb, marketData, preferences, queue],
  );

  const lastUpdated = marketData?._meta?.last_updated;
  const timeSince = lastUpdated ? Math.max(0, Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000)) : null;
  const registryCount = allItemsDb
    ? Object.keys(allItemsDb).length
    : Object.keys(marketData || {}).filter((key) => !key.startsWith("_")).length;
  const marketFreshness = timeSince === null ? "Waiting for cache" : timeSince < 90 ? "Fresh enough" : "Needs refresh";
  const registryCountLabel = allItemsDb ? "items indexed" : "market entries";
  const hasStarterProfile = Boolean(activeProfile && isStarterProfile(activeProfile));
  const activeProfileLabel = hasStarterProfile ? "Starter profile" : activeProfile?.name?.trim() || "No profile";
  const profileDetail = hasStarterProfile
    ? "Needs setup for reliable numbers"
    : activeProfile
      ? `${activeProfile.className || "Character"} profile active`
      : `${profileState.profiles.length}/5 saved profiles`;
  const housingLabel = housingSummary.mode === "none"
    ? "Not configured"
    : housingSummary.mode === "guest"
      ? `${housingSummary.activeComponentCount} guest buff${housingSummary.activeComponentCount === 1 ? "" : "s"}`
      : `${housingSummary.activeComponentCount}/${housingSummary.slotCapacity || 0} slots`;

  return (
    <main className="container dashboard dashboard-command">
      <section className="command-hero">
        <div className="command-hero-copy">
          <h1>Today's IdleMMO Checks</h1>
          <p>Check market age, profile setup, saved projects, and the next routes worth opening.</p>
        </div>
        <div className="command-status-grid" aria-label="App status">
          <div className="command-status-card">
            <span>Market snapshot</span>
            <strong>{formatAge(timeSince)}</strong>
            <em>{marketFreshness}</em>
          </div>
          <div className="command-status-card">
            <span>Item index</span>
            <strong>{registryCount.toLocaleString()}</strong>
            <em>{registryCountLabel}</em>
          </div>
          <div className="command-status-card">
            <span>Active profile</span>
            <strong title={activeProfileLabel}>{activeProfileLabel}</strong>
            <em title={profileDetail}>{profileDetail}</em>
          </div>
        </div>
      </section>

      {needsProfileSetup && (
        <section className="dashboard-setup-state" aria-label="Profile setup reminder">
          <div>
            <span>Before trusting profit</span>
            <h2>Set the character facts that change route math.</h2>
            <p>Class, tools, bartering, pets, housing, magic find, and timers all change Zenith estimates. Saved profile data stays in this browser.</p>
          </div>
          <div className="dashboard-setup-actions">
            <Link href="/profiles"><UserRound size={16} /> Create or import profile</Link>
            <Link href="/settings"><Settings size={16} /> Check route settings</Link>
            <Link href="/profiles"><Upload size={16} /> Export local backup</Link>
          </div>
        </section>
      )}

      <section className="command-primary-grid" aria-label="Priority tools">
        <Link href="/skill-profit" className="command-priority-card command-priority-strong">
          <div className="command-card-top">
            <ZenithIcon name="skill" size={18} />
            <span>Best Skill Route</span>
          </div>
          <strong>{bestSkillRoute?.name || "Open Finder"}</strong>
          <p>
            {bestSkillRoute
              ? `${bestSkillRoute.skill} route, ${formatGold(bestSkillRoute.profitPerHour)}g/hr estimate`
              : "Compare gathering routes after the market cache loads."}
          </p>
          <ArrowRight size={16} />
        </Link>

        <Link href="/crafting" className="command-priority-card">
          <div className="command-card-top">
            <ZenithIcon name="crafting" size={18} />
            <span>Crafting Queue</span>
          </div>
          <strong>{queuePlan.totalCrafts.toLocaleString()} crafts</strong>
          <p>{queuePlan.entries.length > 0 ? `${queuePlan.entries.length} planned item${queuePlan.entries.length === 1 ? "" : "s"}` : "No active queue yet."}</p>
          <ArrowRight size={16} />
        </Link>

        <Link href="/housing" className="command-priority-card">
          <div className="command-card-top">
            <ZenithIcon name="housing" size={18} />
            <span>Housing</span>
          </div>
          <strong>{housingLabel}</strong>
          <p>{housingSummary.mode === "none" ? "Set owner or guest bonuses for profile planning." : "Profile housing modifiers are available."}</p>
          <ArrowRight size={16} />
        </Link>

        <Link href="/forge" className="command-priority-card">
          <div className="command-card-top">
            <ZenithIcon name="forge" size={18} />
            <span>Forge Planner</span>
          </div>
          <strong>{activeMythicNames.length} lab project{activeMythicNames.length === 1 ? "" : "s"}</strong>
          <p>Plan saved high-rarity recipe sessions and missing materials.</p>
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="command-secondary-strip" aria-label="Quick links">
        <Link href="/pets" className="command-mini-card">
          <ZenithIcon name="pets" size={17} />
          <span>Pet Database</span>
          <strong>Open</strong>
        </Link>
        <Link href="/alchemy/mythic" className="command-mini-card">
          <ZenithIcon name="spark" size={17} />
          <span>Mythic Lab</span>
          <strong>{activeMythicNames.length} active</strong>
        </Link>
        <Link href="/market-alerts" className="command-mini-card">
          <ZenithIcon name="bell" size={17} />
          <span>Market Watch</span>
          <strong>Snapshot rules</strong>
        </Link>
        <Link href="/weather" className="command-mini-card">
          <ZenithIcon name="weather" size={17} />
          <span>Weather</span>
          <strong>Forecasts</strong>
        </Link>
        <Link href="/guilds" className="command-mini-card">
          <ZenithIcon name="guild" size={17} />
          <span>Guild Data</span>
          <strong>Browse</strong>
        </Link>
      </section>

      <section className="command-module-grid" aria-label="Tool groups">
        {MODULE_GROUPS.map((group) => {
          return (
            <article className="command-module-card" key={group.title}>
              <header>
                <ZenithIcon name={group.icon} size={18} />
                <div>
                  <h2>{group.title}</h2>
                  <p>{group.text}</p>
                </div>
              </header>
              <div className="command-module-links">
                {group.links.map((link) => {
                  return (
                    <Link href={link.href} key={link.href}>
                      <ZenithIcon name={link.icon} size={15} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
