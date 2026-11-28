import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPetShowcaseProfile } from "@/app/types";
import { calculateCraftingQueuePlan, type QueueItemLookup, type QueueMarketData } from "@/lib/crafting-queue";
import { calculateEssenceSession, type EssenceItemLookup } from "@/lib/essences";

describe("dashboard command center contracts", () => {
  const pagePath = path.join(process.cwd(), "src", "app", "page.tsx");
  const pageCssPath = path.join(process.cwd(), "src", "app", "page.module.css");
  const hookPath = path.join(process.cwd(), "src", "app", "hooks", "useDashboardState.ts");
  const typesPath = path.join(process.cwd(), "src", "app", "types.ts");
  const priorityToolsPath = path.join(process.cwd(), "src", "app", "components", "DashboardPriorityTools.tsx");
  const quickLinksPath = path.join(process.cwd(), "src", "app", "components", "DashboardQuickLinks.tsx");
  const heroPath = path.join(process.cwd(), "src", "app", "components", "DashboardHero.tsx");
  const moduleGridPath = path.join(process.cwd(), "src", "app", "components", "DashboardModuleGrid.tsx");
  const setupReminderPath = path.join(process.cwd(), "src", "app", "components", "DashboardSetupReminder.tsx");

  function getDashboardFilesContent(): string {
    return [
      readFileSync(pagePath, "utf-8"),
      existsSync(hookPath) ? readFileSync(hookPath, "utf-8") : "",
      existsSync(typesPath) ? readFileSync(typesPath, "utf-8") : "",
      existsSync(priorityToolsPath) ? readFileSync(priorityToolsPath, "utf-8") : "",
      existsSync(quickLinksPath) ? readFileSync(quickLinksPath, "utf-8") : "",
      existsSync(heroPath) ? readFileSync(heroPath, "utf-8") : "",
      existsSync(moduleGridPath) ? readFileSync(moduleGridPath, "utf-8") : "",
      existsSync(setupReminderPath) ? readFileSync(setupReminderPath, "utf-8") : "",
    ].join("\n");
  }

  const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
  const globalsCssPath = path.join(process.cwd(), "src", "app", "globals.css");
  const indicatorCssPath = path.join(process.cwd(), "src", "components", "DataFreshnessIndicator.module.css");
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

  it("removes shell duplication, filter tabs, Liquid min 100 text, middots, and inline Ctrl K hints", () => {
    const pageContent = getDashboardFilesContent();
    expect(pageContent).not.toContain("Export local backup");
    expect(pageContent).not.toMatch(/setupBanner[\s\S]*?Upload/);
    expect(pageContent).not.toContain("Switch active character profile");
    expect(pageContent).not.toContain("+10 Cart");
    expect(pageContent).not.toContain("Liquid min");
    expect(pageContent).not.toContain("All Routes");
    expect(pageContent).not.toContain("Ctrl K");
    expect(pageContent).not.toContain("·");
  });

  it("enforces >= 44px touch targets on mobile/coarse viewports for interactive dashboard controls", () => {
    const css = readFileSync(pageCssPath, "utf-8");
    const mobileBlock = getMediaQueryBlock(css, "max-width: 760px", ".recentPill");
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock).toMatch(/\.recentPill,[\s\S]*?\.weatherNextBtn\s*\{[\s\S]*?min-height:\s*44px/);

    const coarseBlock = getMediaQueryBlock(css, "pointer: coarse", ".recentPill");
    expect(coarseBlock).not.toBeNull();
    expect(coarseBlock).toMatch(/\.recentPill,[\s\S]*?\.weatherNextBtn\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it("keeps desktop baseline action heights compact without unconditional 44px bloat", () => {
    const css = readFileSync(pageCssPath, "utf-8");
    expect(css).toMatch(/\.setupActionLink\s*\{[^}]*min-height:\s*2\.55rem/);
    expect(css).toMatch(/\.routeLedgerRow\s*\{[^}]*min-height:\s*46px/);
  });

  it("wires Forge Planner to FORGE_PLANNER_STORAGE_KEY and keeps activeMythicCount separate on /alchemy/mythic", () => {
    const pageContent = getDashboardFilesContent();
    const forgeCard = pageContent.match(/<Link\s+href="\/forge"[\s\S]*?<\/Link>/)?.[0] ?? "";
    const mythicCard = pageContent.match(/<Link\s+href="\/alchemy\/mythic"[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(pageContent).toContain("FORGE_PLANNER_STORAGE_KEY");
    expect(pageContent).toContain("sanitizeForgePlannerLines");
    expect(forgeCard).toContain("forgeCraftsCount.toLocaleString()");
    expect(forgeCard).not.toContain("activeMythicNames");
    expect(mythicCard).toContain("activeMythicCount");
  });

  it("syncs Best Skill Routes with configuredProfile, persisted skill-profit settings, essence sessions, and vendor-safe liquidity filtering", () => {
    const pageContent = getDashboardFilesContent();
    expect(pageContent).toContain("const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;");
    expect(pageContent).toContain("zenith_skill_profit_finder");
    expect(pageContent).toContain("calculateEssenceSession");
    expect(pageContent).toContain("getRankedProfitPerHour");
    expect(pageContent).toContain('row.saleSource === "market" ? (!row.isLiquid || row.stableVolume3d < minVolume) : false');
    expect(pageContent).toMatch(/readMythicNamesFromKey\(activeMythicStorageKey\)[\s\S]*?\?\?\s*readMythicNamesFromKey\(MYTHIC_ACTIVE_RECIPES_STORAGE_KEY\)/);
    expect(pageContent).toMatch(/readSkillProfitStateFromKey\(skillProfitStorageKey\)[\s\S]*?\?\?\s*readSkillProfitStateFromKey\(SKILL_PROFIT_STORAGE_KEY\)/);
  });

  it("passes profileClassName into calculateHousingBuffs and handles foundation, empty buffs, and local zone limits", () => {
    const pageContent = getDashboardFilesContent();
    expect(pageContent).toMatch(/calculateHousingBuffs\(activeProfile\?\.housing,\s*\{\s*profileClassName:\s*activeProfile\?\.className,?\s*\}\)/);
    expect(pageContent).toContain("Foundation needed");
    expect(pageContent).toContain("No active buffs");
    expect(pageContent).toContain("Local zone only (no Remote Conduit)");
  });

  it("guards formatAge against NaN, uses DATA_DELAYED_AFTER_MS, and surfaces Character Spotlight quick-stat links cleanly", () => {
    const pageContent = getDashboardFilesContent();
    expect(pageContent).toContain("!Number.isFinite(minutes)");
    expect(pageContent).toContain("DATA_DELAYED_AFTER_MS");
    expect(pageContent).toContain('aria-label="Character quick stats"');
    expect(pageContent).toContain('href="/bis"');
    expect(pageContent).toContain('href="/pets/owned"');
  });

  it("surfaces membership gradient + icon, scenic boss watch, rotating current weather with canvas, market movers, and accurate pet species count", () => {
    const pageContent = getDashboardFilesContent();
    const css = readFileSync(pageCssPath, "utf-8");
    expect(pageContent).toContain('href="/forge/lessons"');
    expect(pageContent).toContain("Forge Lessons");
    expect(pageContent).toContain("Top Gold Routes");
    expect(pageContent).toContain("World Boss");
    expect(pageContent).toContain("Current Weather");
    expect(pageContent).toContain("Market Movers");
    expect(pageContent).toContain("MEMBERSHIP_BADGE_URL");
    expect(css).toContain("rgb(250, 204, 21)");
    expect(css).toContain("rgb(202, 138, 4)");
    expect(pageContent).toContain("WeatherMiniCanvas");
    expect(pageContent).toContain("locationImageUrl");
    expect(pageContent).toContain("Next Magic Storm:");
    expect(pageContent).not.toContain("Next Storm:");
    expect(pageContent).not.toContain("109 species");
    expect(pageContent).toContain("PET_SPECIES_COUNT");

    const weatherHeaderContent = readFileSync(
      path.join(process.cwd(), "src", "app", "weather", "components", "WeatherHeader.tsx"),
      "utf-8",
    );
    expect(weatherHeaderContent).not.toContain(
      "Prepare your dungeon keys and boss fights before the window begins.",
    );

    const wyrm = getPetShowcaseProfile("Wyrmshadow", "MYTHIC");
    const deadWyrm = getPetShowcaseProfile("Dead Wyrmshadow", "UNIQUE");
    const lunark = getPetShowcaseProfile("Lunark", "MYTHIC");
    const fluffy = getPetShowcaseProfile("Fluffy", "STANDARD");
    const wingsley = getPetShowcaseProfile("Wingsley", "EPIC");
    expect(wyrm.sizePx).toBeGreaterThan(fluffy.sizePx);
    expect(lunark.sizePx).toBeGreaterThan(fluffy.sizePx);
    expect(wingsley.sizePx).toBeLessThanOrEqual(52);
    expect(wyrm.placement).toBe("behind");
    expect(fluffy.placement).toBe("side");
    expect(deadWyrm.isUpsideDown).toBe(true);
    expect(wyrm.isUpsideDown).toBe(false);
    expect(readFileSync(heroPath, "utf-8")).not.toContain("Idle cap");
  });

  it("prevents hydration CLS in page.tsx, layout.tsx, and globals.css and provides root OpenGraph/Twitter image routes", () => {
    const pageContent = getDashboardFilesContent();
    const layoutContent = readFileSync(layoutPath, "utf-8");
    const css = readFileSync(globalsCssPath, "utf-8");
    const indicatorCss = readFileSync(indicatorCssPath, "utf-8");

    expect(pageContent).toContain('if (!profilesLoaded || typeof document === "undefined") return;');
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
    expect(css).not.toContain(".command-wheel-group");
    expect(css).not.toContain(".command-status-grid");
    expect(indicatorCss).toContain(".trigger");
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

    const omittedStarterDataset = runScript({
      zenith_character_profiles_v1: JSON.stringify({
        activeProfileId: "main",
        profiles: [{ id: "main", name: "Main Character" }],
      }),
    });
    expect(omittedStarterDataset.profileSetup).toBe("needed");
  });

  it("loads market data via shared DataContext.ensureMarketLoaded, loads allItemsDb when essences are configured, and passes (queue, marketData, allItemsDb) to calculateCraftingQueuePlan", () => {
    const pageContent = getDashboardFilesContent();
    expect(pageContent).toContain("useData({ autoLoad: false })");
    expect(pageContent).toContain("void ensureMarketLoaded();");
    expect(pageContent).toContain("if (hasConfiguredEssence && !allItemsDb)");
    expect(pageContent).toContain("void ensureLoaded();");
    expect(pageContent).not.toContain('fetch("/market-data.json"');
    expect(pageContent).not.toContain("dashboardMarketData");
    expect(pageContent).toContain("calculateCraftingQueuePlan(");

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
