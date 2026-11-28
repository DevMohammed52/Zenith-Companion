import { expect, type BrowserContext, type Locator, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const impactOrder = ["minor", "moderate", "serious", "critical"] as const;
export type AxeImpact = (typeof impactOrder)[number];

/**
 * Seeds a clean realistic character profile into localStorage so Playwright tests
 * exercise Populated state (active pet, owned pets, mastery, custom prices, skills).
 */
export async function seedPopulatedProfile(
  context: BrowserContext,
  options: {
    profileName?: string;
    className?: string;
    petMastery?: number;
    ownedPets?: Array<Record<string, unknown>>;
    customPrices?: Record<string, number>;
  } = {},
) {
  const now = new Date().toISOString();
  const profileId = "playwright-seeded-profile-1";
  const ownedPets = options.ownedPets ?? [
    {
      id: "pet-orthrus-1",
      species: "Orthrus",
      nickname: "Cerberus",
      quality: "MYTHIC",
      level: 100,
      experience: 0,
      totalExperience: 0,
      evolution: 2,
      evolutionTargets: [],
      active: true,
      equipped: true,
      source: "imported",
      stats: {
        agility: 145,
        accuracy: 150,
        protection: 138,
        attackPower: 142,
        movementSpeed: 29.16,
        maxHealth: 2450,
        maxStamina: 380,
        criticalDamage: 52,
        criticalChance: 14,
      },
      notes: "",
    },
    {
      id: "pet-drakeling-2",
      species: "Drakeling",
      nickname: "",
      quality: "LEGENDARY",
      level: 85,
      experience: 0,
      totalExperience: 0,
      evolution: 1,
      evolutionTargets: [],
      active: false,
      equipped: false,
      source: "manual",
      stats: {
        agility: 110,
        accuracy: 108,
        protection: 102,
        attackPower: 112,
        movementSpeed: 25.56,
        maxHealth: 1900,
        maxStamina: 310,
        criticalDamage: 40,
        criticalChance: 10,
      },
      notes: "",
    },
  ];

  const seededState = {
    schemaVersion: 1,
    activeProfileId: profileId,
    profiles: [
      {
        schemaVersion: 1,
        id: profileId,
        name: options.profileName ?? "TestValkyrie",
        kind: "main",
        className: options.className ?? "Beastmaster",
        imageUrl: "",
        backgroundUrl: "",
        currentStatus: "Idle",
        combatStyle: "swordShield",
        notes: "",
        levels: {
          totalLevel: 950,
          combat: 95,
          strength: 95,
          defence: 95,
          speed: 95,
          dexterity: 95,
          huntingMastery: 95,
          dungeoneering: 95,
          petMastery: options.petMastery ?? 100,
        },
        secondaryStats: {
          attackPower: 100,
          protection: 100,
          agility: 100,
          accuracy: 100,
          criticalChance: 15,
          criticalDamage: 50,
          movementSpeed: 10,
          damage: 250,
        },
        magicFind: { combat: 10, dungeon: 10, worldBoss: 10, dailyStreak: 3 },
        efficiency: { hunting: 10, dungeon: 10 },
        boosts: { conquestRank: "none", barteringLevel: 10 },
        timers: { activeHours: 8, idleTimerHours: 8 },
        pet: {
          species: "Orthrus",
          quality: "MYTHIC",
          level: 100,
          evolution: 2,
          stats: ownedPets[0].stats,
          notes: "",
        },
        ownedPets,
        skills: {
          alchemy: { level: 90, experience: 0 },
          forge: { level: 90, experience: 0 },
          smelting: { level: 90, experience: 0 },
          cooking: { level: 90, experience: 0 },
        },
        gear: {},
        gearTiers: {},
        tools: {},
        importSource: { mode: "manual", importedSections: [], missingOrPrivate: [], notes: "" },
        fieldSources: {},
        createdAt: now,
        updatedAt: now,
      },
    ],
  };

  await context.addInitScript(
    ({ state, customPrices }) => {
      window.localStorage.setItem("zenith_disable_analytics", "true");
      window.localStorage.setItem("zenith.firstRunSetup.dismissed.v1", new Date().toISOString());
      window.localStorage.setItem("zenith_character_profiles_v1", JSON.stringify(state));
      if (customPrices && Object.keys(customPrices).length > 0) {
        window.localStorage.setItem(
          "zenith_preferences",
          JSON.stringify({ customPrices }),
        );
      }
    },
    { state: seededState, customPrices: options.customPrices ?? {} },
  );
}

/**
 * Installs runtime collectors on a Playwright page for console errors, page errors,
 * same-origin failed requests, and cumulative layout shift (CLS).
 */
export async function attachRuntimeMonitors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  await page.addInitScript(() => {
    (window as Window & { __zenithCls?: number }).__zenithCls = 0;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!entry.hadRecentInput && typeof entry.value === "number") {
            (window as Window & { __zenithCls?: number }).__zenithCls =
              ((window as Window & { __zenithCls?: number }).__zenithCls ?? 0) + entry.value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    } catch {
      // Layout-shift observation unavailable in some browser builds.
    }
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("was preloaded using link preload")) return;
    consoleErrors.push(text);
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    if (["document", "script", "stylesheet", "fetch", "xhr"].includes(request.resourceType())) {
      failedRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  return {
    async assertHealthy(maxCls = 0.1) {
      const cls = await page.evaluate(() => (window as Window & { __zenithCls?: number }).__zenithCls ?? 0);
      expect(consoleErrors, "Unexpected console.error messages").toEqual([]);
      expect(pageErrors, "Unexpected uncaught page errors").toEqual([]);
      expect(failedRequests, "Unexpected failed network requests").toEqual([]);
      expect(cls, `CLS exceeded budget (${cls} > ${maxCls})`).toBeLessThanOrEqual(maxCls);
    },
  };
}

/**
 * Runs axe-core WCAG 2.1 AA audit failing on failImpact+ (default "serious" for migrated routes).
 */
export async function assertAxeClean(page: Page, testInfo: TestInfo, failImpact: AxeImpact = "serious") {
  const failIndex = impactOrder.indexOf(failImpact);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violations = results.violations.filter((v) => {
    const impact = (v.impact || "minor") as AxeImpact;
    return impactOrder.indexOf(impact) >= failIndex;
  });

  await testInfo.attach("axe-summary", {
    body: JSON.stringify(
      violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
      null,
      2,
    ),
    contentType: "application/json",
  });

  expect(violations).toEqual([]);
}

/**
 * Verifies the document does not introduce unintended horizontal scrolling.
 */
export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
}

/**
 * Opens a Select/Combobox trigger, verifies an option inside the listbox has touch-safe
 * height and is not occluded/clipped by neighboring panels or cards, then returns its locator.
 */
export async function openUnclippedListboxOption(
  page: Page,
  trigger: Locator,
  listbox: Locator,
  optionName: string,
) {
  await trigger.click();
  await expect(listbox).toBeVisible();
  const option = listbox.getByRole("option", { name: optionName });
  const box = await option.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(40);

  const hitInsideListbox = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return Boolean(el && el.closest("[role='listbox']"));
    },
    { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
  );
  expect(hitInsideListbox).toBe(true);
  return option;
}
