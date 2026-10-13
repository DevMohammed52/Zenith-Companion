import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateCraftingQueuePlan, type QueueItemLookup, type QueueMarketData } from "@/lib/crafting-queue";
import { calculateEssenceSession, type EssenceItemLookup } from "@/lib/essences";

describe("dashboard command center contracts", () => {
  const pagePath = path.join(process.cwd(), "src", "app", "page.tsx");
  const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
  const globalsCssPath = path.join(process.cwd(), "src", "app", "globals.css");
  const bannerCssPath = path.join(process.cwd(), "src", "components", "DataFreshnessBanner.module.css");
  const ogImagePath = path.join(process.cwd(), "src", "app", "opengraph-image.tsx");
  const twitterImagePath = path.join(process.cwd(), "src", "app", "twitter-image.tsx");

  function getMediaQueryBlock(css: string, mediaCondition: string, targetSelector: string): string | null {
    const escapedCondition = mediaCondition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`@media\\s*\\(${escapedCondition}\\)\\s*\\{([\\s\\S]*?)\\n\\}`, "g");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(css)) !== null) {
      if (match[1].includes(targetSelector)) {
        return match[1];
      }
    }
    return null;
  }

  it("does not offer redundant local backup export in onboarding prompt", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).not.toContain("Export local backup");
    expect(pageContent).not.toMatch(/dashboard-setup-actions[\s\S]*?Upload/);
  });

  it("enforces mobile status grid typography >= 0.72rem in globals.css", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    const mobileBlock = getMediaQueryBlock(css, "max-width: 760px", "command-status-grid");
    expect(mobileBlock).not.toBeNull();

    expect(mobileBlock).toMatch(/\.command-status-card\s+span\s*\{[^}]*font-size:\s*0\.72rem/);
    expect(mobileBlock).toMatch(/\.command-status-card\s+em\s*\{[^}]*font-size:\s*0\.72rem/);
    expect(mobileBlock).not.toContain("font-size: 0.57rem");
    expect(mobileBlock).not.toContain("font-size: 0.68rem");
  });

  it("enforces 2-column layout for command-status-grid on screens <= 600px", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    const block600 = getMediaQueryBlock(css, "max-width: 600px", "command-status-grid");
    expect(block600).not.toBeNull();

    expect(block600).toMatch(/\.command-status-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(block600).toMatch(/\.command-status-card:last-child:nth-child\(odd\)\s*\{[^}]*grid-column:\s*span\s*2/);
  });

  it("enforces >= 44px touch targets on mobile/touch viewports for dashboard links", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    const mobileBlock = getMediaQueryBlock(css, "max-width: 760px", "command-module-links");
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock).toMatch(/\.command-module-links\s+a[\s\S]*?\.dashboard-setup-actions\s+a\s*\{[^}]*min-height:\s*44px/);

    const coarseBlock = getMediaQueryBlock(css, "pointer: coarse", "command-module-links");
    expect(coarseBlock).not.toBeNull();
    expect(coarseBlock).toMatch(/\.command-module-links\s+a[\s\S]*?\.dashboard-setup-actions\s+a[\s\S]*?min-height:\s*44px/);
  });

  it("keeps desktop baseline heights compact for mouse users without unconditional 44px override", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    expect(css).toMatch(/\.dashboard-setup-actions\s+a\s*\{[^}]*min-height:\s*2\.55rem/);
    expect(css).toMatch(/\.command-module-links\s+a\s*\{[^}]*min-height:\s*2\.25rem/);
    expect(css).not.toMatch(/\.main-content\s+:is\([\s\S]*?\.command-module-links\s+a[\s\S]*?\)\s*\{[^}]*min-height:\s*44px\s*!important/);
  });

  it("wires Forge Planner card to FORGE_PLANNER_STORAGE_KEY and keeps activeMythicNames on /alchemy/mythic", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    const forgeCard = pageContent.match(/<Link\s+href="\/forge"[\s\S]*?<\/Link>/)?.[0] ?? "";
    const mythicCard = pageContent.match(/<Link\s+href="\/alchemy\/mythic"[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(pageContent).toContain("FORGE_PLANNER_STORAGE_KEY");
    expect(pageContent).toContain("sanitizeForgePlannerLines");
    expect(forgeCard).toContain("forgeCraftsCount.toLocaleString()");
    expect(forgeCard).not.toContain("activeMythicNames");
    expect(mythicCard).toContain("activeMythicNames.length");
  });

  it("syncs Best Skill Route with configuredProfile, persisted skill-profit settings, essence sessions, and vendor-safe liquidity filtering", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain("const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;");
    expect(pageContent).toContain("zenith_skill_profit_finder");
    expect(pageContent).toContain("calculateEssenceSession");
    expect(pageContent).toContain("getRankedProfitPerHour");
    expect(pageContent).toContain('row.saleSource === "market" ? (!row.isLiquid || row.stableVolume3d < minVolume) : false');
    expect(pageContent).toMatch(/readMythicNamesFromKey\(activeMythicStorageKey\)[\s\S]*?\?\?\s*readMythicNamesFromKey\(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY\)/);
    expect(pageContent).toMatch(/readSkillProfitStateFromKey\(skillProfitStorageKey\)[\s\S]*?\?\?\s*readSkillProfitStateFromKey\(SKILL_PROFIT_STORAGE_KEY\)/);
  });

  it("passes profileClassName into calculateHousingBuffs and handles foundation, empty buffs, and local zone limits", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toMatch(/calculateHousingBuffs\(activeProfile\?\.housing,\s*\{\s*profileClassName:\s*activeProfile\?\.className\s*\}\)/);
    expect(pageContent).toContain("Foundation needed");
    expect(pageContent).toContain("No active buffs");
    expect(pageContent).toContain("Local zone only (no Remote Conduit)");
  });

  it("guards formatAge against NaN, uses DATA_DELAYED_AFTER_MS, and makes Item index and Active profile clickable links", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain("!Number.isFinite(minutes)");
    expect(pageContent).toContain("DATA_DELAYED_AFTER_MS");
    expect(pageContent).toContain('<div className="command-status-grid" role="group" aria-label="App status">');
    expect(pageContent).toContain('<Link href="/items" className="command-status-card">');
    expect(pageContent).toContain('<Link href="/profiles" className="command-status-card">');
  });

  it("replaces secondary strip placeholders with live data and updates MODULE_GROUPS for Patch Notes and Pet tools", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain("MARKET_WATCH_STORAGE_KEY");
    expect(pageContent).toContain("sanitizeMarketWatchRules");
    expect(pageContent).not.toContain("<strong>Open</strong>");
    expect(pageContent).not.toContain("<strong>Snapshot rules</strong>");
    expect(pageContent).not.toContain("<strong>Forecasts</strong>");
    expect(pageContent).not.toContain("<strong>Browse</strong>");
    expect(pageContent).toContain('{ href: "/patch-notes", label: "Patch Notes"');
    expect(pageContent).toContain('{ href: "/pets/compare", label: "Pet Compare"');
  });

  it("prevents hydration CLS in page.tsx, layout.tsx, and globals.css and provides root OpenGraph/Twitter image routes", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    const layoutContent = readFileSync(layoutPath, "utf-8");
    const css = readFileSync(globalsCssPath, "utf-8");
    const bannerCss = readFileSync(bannerCssPath, "utf-8");

    expect(pageContent).toContain("if (!profilesLoaded || typeof document === \"undefined\") return;");
    expect(layoutContent).toContain("dataset.profileSetup");
    expect(layoutContent).toContain("dataset.desktopNavigation");
    expect(layoutContent).toContain("dataset.mobileNavigation");
    expect(layoutContent).toContain("Zenith Companion — IdleMMO Market & Character Tools");
    expect(layoutContent).not.toContain("transition: all 0.3s ease;");
    expect(existsSync(ogImagePath)).toBe(true);
    expect(existsSync(twitterImagePath)).toBe(true);

    expect(css).toContain("scrollbar-gutter: stable;");
    expect(css).toContain('html[data-profile-setup="ready"] .dashboard-setup-state');
    expect(css).toContain('html[data-mobile-navigation="command"] .mobile-menu-btn');
    expect(css).toMatch(/\.command-wheel-group\s+strong,\s*\.command-wheel-group\s+small\s*\{[^}]*text-overflow:\s*ellipsis/);
    expect(bannerCss).toContain("inset-inline-start: 5.75rem;");
  });

  it("isolates PRE_PAINT_INIT_SCRIPT preferences and profiles parsing and matches sanitizeProfile starter defaults", () => {
    const layoutContent = readFileSync(layoutPath, "utf-8");
    const scriptMatch = layoutContent.match(/const PRE_PAINT_INIT_SCRIPT = `(.*?)`;/);
    expect(scriptMatch).not.toBeNull();
    const script = scriptMatch![1];

    const runScript = (storage: Record<string, string>) => {
      const dataset: Record<string, string> = {};
      const mockDoc = { documentElement: { dataset } };
      const mockStorage = {
        getItem: (key: string) => (key in storage ? storage[key] : null),
      };
      const fn = new Function("document", "localStorage", script);
      fn(mockDoc, mockStorage);
      return dataset;
    };

    // Corrupt preferences JSON does not block profileSetup detection for configured profile
    const configuredDataset = runScript({
      zenith_preferences: "{corrupt_json",
      zenith_character_profiles_v1: JSON.stringify({
        activeProfileId: "p1",
        profiles: [{ id: "p1", name: "My Alchemist", className: "Alchemist" }],
      }),
    });
    expect(configuredDataset.theme).toBe("ember");
    expect(configuredDataset.desktopNavigation).toBe("sidebar");
    expect(configuredDataset.mobileNavigation).toBe("standard");
    expect(configuredDataset.profileSetup).toBe("ready");

    // Starter profile with omitted levels/className still resolves to "needed"
    const omittedStarterDataset = runScript({
      zenith_character_profiles_v1: JSON.stringify({
        activeProfileId: "main",
        profiles: [{ id: "main", name: "Main Character" }],
      }),
    });
    expect(omittedStarterDataset.profileSetup).toBe("needed");
  });

  it("loads market data via shared DataContext.ensureMarketLoaded, loads allItemsDb when essences are configured, and passes (queue, marketData, allItemsDb) to calculateCraftingQueuePlan", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain("const { marketData, allItemsDb, ensureMarketLoaded } = useData({ autoLoad: false });");
    expect(pageContent).toContain("void ensureMarketLoaded();");
    expect(pageContent).toContain("if (hasConfiguredEssence && !allItemsDb)");
    expect(pageContent).toContain("void ensureLoaded();");
    expect(pageContent).not.toContain('fetch("/market-data.json"');
    expect(pageContent).not.toContain("dashboardMarketData");
    expect(pageContent).toContain("calculateCraftingQueuePlan(queue, marketData, allItemsDb,");

    const queue = { "Battle Potion": 10 };
    const marketData: QueueMarketData = {
      "Battle Potion": { avg_3: 200, avg_7: 200, price: 200, vol_3: 500, is_tradeable: true },
      "Lucky Rabbit Foot": { avg_3: 25, avg_7: 25, price: 25, vol_3: 500, is_tradeable: true },
      "Battle Potion Recipe": { avg_3: 100, avg_7: 100, price: 100, vol_3: 100, is_tradeable: true },
    };
    const allItemsDb: QueueItemLookup = {
      "Battle Potion Recipe": {
        name: "Battle Potion Recipe",
        type: "RECIPE",
        is_tradeable: true,
        recipe: { max_uses: 5, result: { item_name: "Battle Potion" } },
      },
    };
    const prefs = { membership: true, barteringBoost: 0, customPrices: {} };

    const validPlan = calculateCraftingQueuePlan(queue, marketData, allItemsDb, prefs);
    expect(validPlan.entries[0]?.marketRevenueEach).toBeGreaterThan(0);
    expect(validPlan.recipeList).toHaveLength(1);
    expect(validPlan.missingItems).toEqual([]);

    const swappedPlan = calculateCraftingQueuePlan(
      queue,
      allItemsDb as unknown as QueueMarketData,
      marketData as unknown as QueueItemLookup,
      prefs,
    );
    expect(swappedPlan.entries[0]?.marketRevenueEach).toBe(0);
    expect(swappedPlan.recipeList).toHaveLength(0);

    const essenceItems: EssenceItemLookup = {
      "Lumberjack Essence Crystal": {
        name: "Lumberjack Essence Crystal",
        type: "ESSENCE_CRYSTAL",
        is_tradeable: true,
        effects: [{ target: "Woodcutting", attribute: "wait_length", value_type: "efficiency", value: 12 }],
      },
    };
    const withoutItems = calculateEssenceSession({
      essenceName: "Lumberjack Essence Crystal",
      skill: "Woodcutting",
      items: null,
      marketData: { "Lumberjack Essence Crystal": { avg_3: 400, avg_7: 400, price: 400 } },
      customPrices: {},
      actionHours: 8,
    });
    expect(withoutItems.active).toBe(false);

    const withItems = calculateEssenceSession({
      essenceName: "Lumberjack Essence Crystal",
      skill: "Woodcutting",
      items: essenceItems,
      marketData: { "Lumberjack Essence Crystal": { avg_3: 400, avg_7: 400, price: 400 } },
      customPrices: {},
      actionHours: 8,
    });
    expect(withItems.active).toBe(true);
    expect(withItems.buff?.efficiency).toBe(12);
    expect(withItems.costPerHour).toBe(50);
  });
});

