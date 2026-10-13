"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Settings, UserRound } from "lucide-react";
import ZenithIcon, { type ZenithIconName } from "@/components/icons/ZenithIcon";
import { useData } from "@/context/DataContext";
import { useCrafting } from "@/context/CraftingContext";
import { DATA_DELAYED_AFTER_MS } from "@/lib/data-freshness";
import {
  FORGE_PLANNER_STORAGE_KEY,
  sanitizeForgePlannerLines,
  type ForgePlannerLine,
} from "@/lib/forge-planner";
import { formatGold } from "@/lib/format";
import {
  MARKET_WATCH_RULES_EVENT,
  MARKET_WATCH_STORAGE_KEY,
  sanitizeMarketWatchRules,
} from "@/lib/market-alerts";
import { usePreferences } from "@/lib/preferences";
import { isStarterProfile, useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  calculateSkillProfitRows,
  DEFAULT_TOOL_SELECTIONS,
  SKILLS,
  type SaleMode,
  type SkillName,
  type SkillProfitRow,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import { calculateCraftingQueuePlan } from "@/lib/crafting-queue";
import {
  SKILL_TO_HOUSING_ACTIVITY,
  calculateHousingBuffs,
  getHousingIdleHoursForActivity,
  getProfileBaseIdleActionHours,
} from "@/lib/housing";
import {
  SUPPORTED_ESSENCE_SKILLS,
  calculateEssenceSession,
  type EssenceSession,
  type EssenceSkillName,
} from "@/lib/essences";
import { MYTHIC_ACTIVE_RECIPES_STORAGE_KEY } from "@/lib/mythic-alchemy";

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

type PersistedSkillProfitDashboardState = {
  energizingPoolExp: number;
  ascensionBuffIds: string[];
  saleMode: SaleMode;
  minVolume: number;
  barteringBoost: number | "";
  essenceBySkill: Partial<Record<SkillName, string>>;
  customRows: unknown[];
  skillLevels: Record<string, number>;
  efficiencyBoosts: Record<string, number>;
};

const SKILL_PROFIT_STORAGE_KEY = "zenith_skill_profit_finder";
const DEFAULT_INDEXED_ITEMS_COUNT = 1353;
const DELAYED_THRESHOLD_MINUTES = Math.round(DATA_DELAYED_AFTER_MS / 60_000);

const DEFAULT_PERSISTED_SKILL_PROFIT: PersistedSkillProfitDashboardState = {
  energizingPoolExp: 0,
  ascensionBuffIds: [],
  saleMode: "best",
  minVolume: 100,
  barteringBoost: 0,
  essenceBySkill: {},
  customRows: [],
  skillLevels: {},
  efficiencyBoosts: {},
};

function getRankedProfitPerHour(row: SkillProfitRow) {
  if (row.essenceActive && row.profitWithEssencePerHour !== null) return row.profitWithEssencePerHour;
  if (row.essenceActive && row.essenceNeedsPrice) return row.baseProfitPerHour;
  return row.profitPerHour;
}

function readMythicNamesFromKey(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return null;
  }
}

function readSkillProfitStateFromKey(key: string): PersistedSkillProfitDashboardState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const rawSettings = parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings)
      ? parsed.settings
      : parsed;
    const saleMode: SaleMode = rawSettings?.saleMode === "market" || rawSettings?.saleMode === "vendor" || rawSettings?.saleMode === "best"
      ? rawSettings.saleMode
      : "best";
    const minVolume = typeof parsed?.minVolume === "number" && Number.isFinite(parsed.minVolume)
      ? Math.max(0, parsed.minVolume)
      : 100;
    const energizingPoolExp = Math.max(0, Number(rawSettings?.energizingPoolExp ?? parsed?.energizingPoolExp ?? 0) || 0);
    const rawAscension = Array.isArray(rawSettings?.ascensionBuffIds)
      ? rawSettings.ascensionBuffIds
      : Array.isArray(parsed?.ascensionBuffIds)
        ? parsed.ascensionBuffIds
        : [];
    const ascensionBuffIds = rawAscension.filter((id: unknown): id is string => typeof id === "string");
    const barteringBoost = rawSettings?.barteringBoost ?? parsed?.barteringBoost ?? 0;
    const rawEssences = rawSettings?.essenceBySkill && typeof rawSettings.essenceBySkill === "object" && !Array.isArray(rawSettings.essenceBySkill)
      ? rawSettings.essenceBySkill
      : parsed?.essenceBySkill && typeof parsed.essenceBySkill === "object" && !Array.isArray(parsed.essenceBySkill)
        ? parsed.essenceBySkill
        : {};
    const essenceBySkill: Partial<Record<SkillName, string>> = {};
    for (const skill of SUPPORTED_ESSENCE_SKILLS) {
      const val = rawEssences[skill];
      if (typeof val === "string" && val.trim()) essenceBySkill[skill] = val.trim();
    }
    const customRows = Array.isArray(parsed?.customRows) ? parsed.customRows : [];
    const skillLevels = parsed?.skillLevels && typeof parsed.skillLevels === "object" ? parsed.skillLevels : {};
    const efficiencyBoosts = parsed?.efficiencyBoosts && typeof parsed.efficiencyBoosts === "object" ? parsed.efficiencyBoosts : {};
    return {
      energizingPoolExp,
      ascensionBuffIds,
      saleMode,
      minVolume,
      barteringBoost,
      essenceBySkill,
      customRows,
      skillLevels,
      efficiencyBoosts,
    };
  } catch {
    return null;
  }
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "Economy",
    text: "Market prices, trade volume, alchemy EV, and craft queues.",
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
    text: "Profiles, house rooms, gear loadouts, tools, and pet rosters.",
    icon: "profile",
    links: [
      { href: "/profiles", label: "Profiles", icon: "profile" },
      { href: "/housing", label: "Housing", icon: "housing" },
      { href: "/pets", label: "Pets", icon: "pets" },
      { href: "/pets/owned", label: "Owned Pets", icon: "pets" },
      { href: "/pets/compare", label: "Pet Compare", icon: "pets" },
      { href: "/forge", label: "Forge", icon: "forge" },
      { href: "/bis", label: "BiS", icon: "shield" },
    ],
  },
  {
    title: "Combat & World",
    text: "Drop tables, dungeon requirements, world bosses, weather, and map routes.",
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
    text: "Guild rankings, conquest seasons, museum collections, lore, and patch notes.",
    icon: "archive",
    links: [
      { href: "/guilds", label: "Guilds", icon: "guild" },
      { href: "/conquest", label: "Conquest", icon: "conquest" },
      { href: "/museum", label: "Museum", icon: "museum" },
      { href: "/lore", label: "Lore", icon: "archive" },
      { href: "/patch-notes", label: "Patch Notes", icon: "archive" },
    ],
  },
];

function formatAge(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes)) return "Waiting";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
}

export default function DashboardPage() {
  const { preferences } = usePreferences();
  const { activeProfile, state: profileState, loaded: profilesLoaded } = useProfiles();
  const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;
  const needsProfileSetup = !configuredProfile;
  const { queue } = useCrafting();
  const { marketData, allItemsDb, ensureMarketLoaded } = useData({ autoLoad: false });
  const { ensureLoaded } = useData({ autoLoad: false });

  const [now, setNow] = useState(() => Date.now());
  const [activeMythicNames, setActiveMythicNames] = useState<string[]>([]);
  const [forgeLines, setForgeLines] = useState<ForgePlannerLine[]>([]);
  const [marketWatchCount, setMarketWatchCount] = useState(0);
  const [persistedSkillProfit, setPersistedSkillProfit] = useState<PersistedSkillProfitDashboardState>(
    DEFAULT_PERSISTED_SKILL_PROFIT,
  );

  const activeMythicStorageKey = useMemo(
    () => getProfileStorageKey(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );
  const skillProfitStorageKey = useMemo(
    () => getProfileStorageKey(SKILL_PROFIT_STORAGE_KEY, activeProfile?.id) ?? SKILL_PROFIT_STORAGE_KEY,
    [activeProfile?.id],
  );
  const housingSummary = useMemo(
    () => calculateHousingBuffs(activeProfile?.housing, { profileClassName: activeProfile?.className }),
    [activeProfile?.className, activeProfile?.housing],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profilesLoaded || typeof document === "undefined") return;
    document.documentElement.dataset.profileSetup = needsProfileSetup ? "needed" : "ready";
  }, [needsProfileSetup, profilesLoaded]);

  const syncLocalDashboardStorage = useCallback(() => {
    setActiveMythicNames(
      readMythicNamesFromKey(activeMythicStorageKey)
        ?? readMythicNamesFromKey(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY)
        ?? [],
    );

    try {
      const savedForge = localStorage.getItem(FORGE_PLANNER_STORAGE_KEY);
      if (!savedForge) {
        setForgeLines([]);
      } else {
        const parsed = JSON.parse(savedForge);
        setForgeLines(sanitizeForgePlannerLines(parsed?.lines));
      }
    } catch {
      setForgeLines([]);
    }

    try {
      const savedWatch = localStorage.getItem(MARKET_WATCH_STORAGE_KEY);
      const rules = sanitizeMarketWatchRules(savedWatch ? JSON.parse(savedWatch) : []);
      setMarketWatchCount(rules.length);
    } catch {
      setMarketWatchCount(0);
    }

    setPersistedSkillProfit(
      readSkillProfitStateFromKey(skillProfitStorageKey)
        ?? readSkillProfitStateFromKey(SKILL_PROFIT_STORAGE_KEY)
        ?? DEFAULT_PERSISTED_SKILL_PROFIT,
    );
  }, [activeMythicStorageKey, skillProfitStorageKey]);

  useEffect(() => {
    syncLocalDashboardStorage();
    const handleStorage = (event: StorageEvent) => {
      if (
        !event.key ||
        event.key === activeMythicStorageKey ||
        event.key === MYTHIC_ACTIVE_RECIPES_STORAGE_KEY ||
        event.key === FORGE_PLANNER_STORAGE_KEY ||
        event.key === MARKET_WATCH_STORAGE_KEY ||
        event.key === skillProfitStorageKey ||
        event.key === SKILL_PROFIT_STORAGE_KEY
      ) {
        syncLocalDashboardStorage();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(MARKET_WATCH_RULES_EVENT, syncLocalDashboardStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(MARKET_WATCH_RULES_EVENT, syncLocalDashboardStorage);
    };
  }, [activeMythicStorageKey, skillProfitStorageKey, syncLocalDashboardStorage]);

  const hasConfiguredEssence = useMemo(
    () => SUPPORTED_ESSENCE_SKILLS.some((skill) => Boolean(persistedSkillProfit.essenceBySkill?.[skill])),
    [persistedSkillProfit.essenceBySkill],
  );

  useEffect(() => {
    void ensureMarketLoaded();
  }, [ensureMarketLoaded]);

  useEffect(() => {
    if (hasConfiguredEssence && !allItemsDb) {
      void ensureLoaded();
    }
  }, [allItemsDb, ensureLoaded, hasConfiguredEssence]);

  const housingIdleHoursBySkill = useMemo(
    () => Object.fromEntries(SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      return [skill, activity ? getHousingIdleHoursForActivity(housingSummary, activity) : 0];
    })) as Partial<Record<SkillName, number>>,
    [housingSummary],
  );

  const baseIdleActionHours = configuredProfile ? getProfileBaseIdleActionHours(configuredProfile) : 8;

  const idleActionHoursBySkill = useMemo(
    () => Object.fromEntries(SKILLS.map((skill) => [
      skill,
      baseIdleActionHours + Number(housingIdleHoursBySkill[skill] || 0),
    ])) as Partial<Record<SkillName, number>>,
    [baseIdleActionHours, housingIdleHoursBySkill],
  );

  const essenceSessionsBySkill = useMemo(() => {
    const entries = SUPPORTED_ESSENCE_SKILLS.map((skill) => [
      skill,
      calculateEssenceSession({
        essenceName: persistedSkillProfit.essenceBySkill?.[skill] || "",
        skill,
        items: allItemsDb,
        marketData,
        customPrices: preferences.customPrices,
        actionHours: idleActionHoursBySkill[skill] || baseIdleActionHours,
      }),
    ] as const);
    return Object.fromEntries(entries) as Partial<Record<EssenceSkillName, EssenceSession>>;
  }, [
    allItemsDb,
    baseIdleActionHours,
    idleActionHoursBySkill,
    marketData,
    persistedSkillProfit.essenceBySkill,
    preferences.customPrices,
  ]);

  const skillProfitSettings = useMemo<SkillProfitSettings>(() => {
    const essenceBuffsBySkill: SkillProfitSettings["essenceBuffsBySkill"] = {};
    const essencePricesBySkill: SkillProfitSettings["essencePricesBySkill"] = {};
    for (const skill of SUPPORTED_ESSENCE_SKILLS) {
      const session = essenceSessionsBySkill[skill];
      if (session?.buff) essenceBuffsBySkill[skill] = session.buff;
      if (session?.price) essencePricesBySkill[skill] = session.price;
    }

    return {
      membership: preferences.membership,
      classBonus: configuredProfile ? false : preferences.skillClassBonus,
      saleMode: persistedSkillProfit.saleMode,
      profileClassName: configuredProfile?.className || undefined,
      energizingPoolExp: persistedSkillProfit.energizingPoolExp,
      assaultRank: configuredProfile ? getProfileConquestRank(configuredProfile) : preferences.assaultRank,
      ascensionBuffIds: persistedSkillProfit.ascensionBuffIds,
      tools: configuredProfile
        ? {
            Woodcutting: configuredProfile.tools.woodcutting ?? "",
            Mining: configuredProfile.tools.mining ?? "",
            Fishing: configuredProfile.tools.fishing ?? "",
          }
        : {
            ...DEFAULT_TOOL_SELECTIONS,
            ...preferences.skillTools,
          },
      customPrices: preferences.customPrices,
      barteringBoost: configuredProfile
        ? getProfileBarteringBoost(configuredProfile)
        : Number(preferences.barteringBoost !== "" ? preferences.barteringBoost : persistedSkillProfit.barteringBoost) || 0,
      housingIdleHoursBySkill,
      essenceBySkill: persistedSkillProfit.essenceBySkill,
      essenceBuffsBySkill,
      essencePricesBySkill,
      idleActionHoursBySkill,
    };
  }, [
    configuredProfile,
    essenceSessionsBySkill,
    housingIdleHoursBySkill,
    idleActionHoursBySkill,
    persistedSkillProfit.ascensionBuffIds,
    persistedSkillProfit.barteringBoost,
    persistedSkillProfit.energizingPoolExp,
    persistedSkillProfit.essenceBySkill,
    persistedSkillProfit.saleMode,
    preferences.assaultRank,
    preferences.barteringBoost,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
  ]);

  const bestSkillRoute = useMemo(() => {
    if (!marketData) return null;
    const minVolume = persistedSkillProfit.minVolume;
    const rows = calculateSkillProfitRows(marketData, allItemsDb, skillProfitSettings, [], minVolume);
    let best: SkillProfitRow | null = null;
    for (const row of rows) {
      const rankedProfit = getRankedProfitPerHour(row);
      if (row.skill === "Forge" || row.saleSource === "missing" || rankedProfit <= 0) continue;
      const excludedByLiquidity = row.saleSource === "market" ? (!row.isLiquid || row.stableVolume3d < minVolume) : false;
      if (excludedByLiquidity) continue;
      if (!best || rankedProfit > getRankedProfitPerHour(best)) best = row;
    }
    return best;
  }, [allItemsDb, marketData, persistedSkillProfit.minVolume, skillProfitSettings]);

  const queuePlan = useMemo(
    () => calculateCraftingQueuePlan(queue, marketData, allItemsDb, {
      ...preferences,
      barteringBoost: configuredProfile ? getProfileBarteringBoost(configuredProfile) : Number(preferences.barteringBoost || 0),
    }),
    [allItemsDb, configuredProfile, marketData, preferences, queue],
  );

  const forgeCraftsCount = useMemo(
    () => forgeLines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity) || 0), 0),
    [forgeLines],
  );

  const lastUpdated = marketData?._meta?.last_updated;
  const lastUpdatedMs = lastUpdated ? new Date(lastUpdated).getTime() : NaN;
  const timeSince = Number.isFinite(lastUpdatedMs) ? Math.max(0, Math.floor((now - lastUpdatedMs) / 60_000)) : null;
  const registryCount = allItemsDb ? Object.keys(allItemsDb).length : DEFAULT_INDEXED_ITEMS_COUNT;
  const marketFreshness = timeSince === null
    ? "Loading snapshot"
    : timeSince < DELAYED_THRESHOLD_MINUTES
      ? "Current"
      : "Stale (>2.5h)";
  const registryCountLabel = "items indexed";
  const hasStarterProfile = Boolean(activeProfile && isStarterProfile(activeProfile));
  const activeProfileLabel = hasStarterProfile ? "Starter profile" : activeProfile?.name?.trim() || "No profile";
  const profileDetail = hasStarterProfile
    ? "Set character stats for exact math"
    : activeProfile
      ? `${activeProfile.className || "Character"} profile active`
      : `${profileState.profiles.length}/5 saved profiles`;

  const isOwnerWithoutFoundation = housingSummary.mode === "owner" && !activeProfile?.housing?.foundationBuilt;
  const housingLabel = housingSummary.mode === "none"
    ? "Not configured"
    : isOwnerWithoutFoundation
      ? "Foundation needed"
      : housingSummary.activeComponentCount === 0
        ? "No active buffs"
        : housingSummary.mode === "guest"
          ? `${housingSummary.activeComponentCount} guest buff${housingSummary.activeComponentCount === 1 ? "" : "s"}`
          : `${housingSummary.activeComponentCount}/${housingSummary.slotCapacity || 0} slots`;
  const housingDescription = housingSummary.mode === "none"
    ? "Set owner or guest rooms for idle timer buffs."
    : isOwnerWithoutFoundation
      ? "Build a Foundation to unlock room slots and idle timers."
      : housingSummary.activeComponentCount === 0
        ? "No active buffs selected for this house."
        : housingSummary.locationLimited
          ? "Local zone only (no Remote Conduit)."
          : "Remote Conduit active — buffs apply in all zones.";

  return (
    <main className="container dashboard dashboard-command">
      <section className="command-hero">
        <div className="command-hero-copy">
          <h1>IdleMMO Companion &amp; Market Tools</h1>
          <p>Live market prices, skilling profit/hr, crafting queues, and character planners.</p>
        </div>
        <div className="command-status-grid" role="group" aria-label="App status">
          <div className="command-status-card">
            <span>Market snapshot</span>
            <strong>{formatAge(timeSince)}</strong>
            <em>{marketFreshness}</em>
          </div>
          <Link href="/items" className="command-status-card">
            <span>Item index</span>
            <strong>{registryCount.toLocaleString()}</strong>
            <em>{registryCountLabel}</em>
          </Link>
          <Link href="/profiles" className="command-status-card">
            <span>Active profile</span>
            <strong title={activeProfileLabel}>{activeProfileLabel}</strong>
            <em title={profileDetail}>{profileDetail}</em>
          </Link>
        </div>
      </section>

      {needsProfileSetup && (
        <section className="dashboard-setup-state" aria-label="Profile setup reminder">
          <div>
            <span>Profile setup</span>
            <h2>Set character stats that change route math.</h2>
            <p>Class, tools, bartering, pets, housing, magic find, and idle timers change profit/hr and drop estimates. Profile data stays in your browser.</p>
          </div>
          <div className="dashboard-setup-actions">
            <Link href="/profiles"><UserRound size={16} /> Create or import profile</Link>
            <Link href="/settings"><Settings size={16} /> Route settings</Link>
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
              ? `${bestSkillRoute.skill} • ${formatGold(getRankedProfitPerHour(bestSkillRoute))}g/hr (${bestSkillRoute.saleSource === "vendor" ? "vendor" : "market"})`
              : "Compare gathering and crafting routes once market data loads."}
          </p>
          <ArrowRight size={16} />
        </Link>

        <Link href="/crafting" className="command-priority-card">
          <div className="command-card-top">
            <ZenithIcon name="crafting" size={18} />
            <span>Crafting Queue</span>
          </div>
          <strong>{queuePlan.totalCrafts.toLocaleString()} craft{queuePlan.totalCrafts === 1 ? "" : "s"}</strong>
          <p>{queuePlan.entries.length > 0 ? `${queuePlan.entries.length} planned item${queuePlan.entries.length === 1 ? "" : "s"}` : "Build multi-step material lists and craft batches."}</p>
          <ArrowRight size={16} />
        </Link>

        <Link href="/housing" className="command-priority-card">
          <div className="command-card-top">
            <ZenithIcon name="housing" size={18} />
            <span>Housing</span>
          </div>
          <strong>{housingLabel}</strong>
          <p>{housingDescription}</p>
          <ArrowRight size={16} />
        </Link>

        <Link href="/forge" className="command-priority-card">
          <div className="command-card-top">
            <ZenithIcon name="forge" size={18} />
            <span>Forge Planner</span>
          </div>
          <strong>{forgeCraftsCount.toLocaleString()} craft{forgeCraftsCount === 1 ? "" : "s"}</strong>
          <p>
            {forgeLines.length > 0
              ? `${forgeLines.length} planned recipe${forgeLines.length === 1 ? "" : "s"} — track scroll costs and material gaps.`
              : "Track scroll costs, material gaps, and craft margins."}
          </p>
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="command-secondary-strip" aria-label="Quick links">
        <Link href="/pets" className="command-mini-card">
          <ZenithIcon name="pets" size={17} />
          <span>Pet Database</span>
          <strong>{activeProfile?.ownedPets?.length ? `${activeProfile.ownedPets.length} owned` : "109 species"}</strong>
        </Link>
        <Link href="/alchemy/mythic" className="command-mini-card">
          <ZenithIcon name="spark" size={17} />
          <span>Mythic Lab</span>
          <strong>{activeMythicNames.length} active</strong>
        </Link>
        <Link href="/market-alerts" className="command-mini-card">
          <ZenithIcon name="bell" size={17} />
          <span>Market Watch</span>
          <strong>{marketWatchCount} rule{marketWatchCount === 1 ? "" : "s"}</strong>
        </Link>
        <Link href="/weather" className="command-mini-card">
          <ZenithIcon name="weather" size={17} />
          <span>Weather</span>
          <strong>Zone rotation</strong>
        </Link>
        <Link href="/guilds" className="command-mini-card">
          <ZenithIcon name="guild" size={17} />
          <span>Guild Data</span>
          <strong>Rankings &amp; rosters</strong>
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
