import { expect, type BrowserContext, type Page, test } from "@playwright/test";

type PreferenceSeed = {
  ambientMusic?: boolean;
  desktopNavigationStyle?: "sidebar" | "dock";
  inAppNotifications?: boolean;
  mobileCommandTriggerSide?: "left" | "right";
  mobileNavigationStyle?: "standard" | "command";
  notificationSounds?: boolean;
  soundEffects?: boolean;
  theme?: "ember" | "forest" | "arcane" | "frost";
};

type InstallPromptEventStub = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type WindowWithZenithInstallPrompt = Window & {
  __zenithInstallPromptEvent?: InstallPromptEventStub | null;
};

const defaultPreferenceSeed: PreferenceSeed = {
  ambientMusic: false,
  desktopNavigationStyle: "sidebar",
  inAppNotifications: false,
  notificationSounds: false,
  soundEffects: false,
  theme: "ember",
};

async function seedBrowserState(context: BrowserContext, preferences: PreferenceSeed = {}) {
  await context.addInitScript((preferenceSeed) => {
    window.localStorage.setItem("zenith_disable_analytics", "true");
    window.localStorage.setItem("zenith.firstRunSetup.dismissed.v1", new Date().toISOString());
    window.localStorage.setItem("zenith.tips.snoozedUntil.v1", String(Date.now() + 24 * 60 * 60 * 1000));
    window.localStorage.setItem("zenith.tips.seenPages.v1", JSON.stringify(["/", "/items", "/settings", "/profiles"]));
    window.localStorage.setItem("zenith.localBackupReminder.lastShown.v1", String(Date.now()));
    window.localStorage.setItem("zenith_preferences", JSON.stringify(preferenceSeed));
  }, { ...defaultPreferenceSeed, ...preferences });
}

async function installImportSafetyRoutes(page: Page) {
  await page.route("**/api/profile-import/start", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: 400,
      body: JSON.stringify({
        error: {
          code: "smoke_blocked",
          message: "Smoke blocked live import.",
        },
      }),
    });
  });
  await page.route("**/api/profile-import/status/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: 400,
      body: JSON.stringify({
        error: {
          code: "smoke_blocked",
          message: "Smoke blocked live import status.",
        },
      }),
    });
  });
  await page.route("https://zenith-profile-import.devmohammed52.workers.dev/**", async (route) => {
    await route.abort();
  });
}

test.describe("core product flows", () => {
  test.beforeEach(async ({ context }) => {
    await seedBrowserState(context);
  });

  test("global search opens a core tool route", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Open global search" }).click();
    const palette = page.getByRole("dialog", { name: "Global search" });
    await expect(palette).toBeVisible();

    const searchInput = palette.getByRole("combobox", {
      name: "Search tools, items, recipes, enemies, and lore",
    });
    await expect(searchInput).toBeFocused();
    await searchInput.fill("Skill Profit Finder");
    await palette
      .getByRole("option", { name: /^Skill Profit Finder\. Skill routes, tools, buffs, and prices\. Page\.$/ })
      .click();

    await expect(page).toHaveURL(/\/skill-profit$/);
    await expect(page.getByRole("main", { name: "Skill Profit Finder" })).toBeVisible();
  });

  test("item database search opens and closes item details", async ({ page }) => {
    await page.goto("/items", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Item Database/ })).toBeVisible();

    await page.getByRole("textbox", { name: "Search items" }).fill("Weapon Upgrade Stone");
    await page.getByRole("button", { name: "Open Weapon Upgrade Stone item details" }).click();

    const modal = page.getByRole("dialog", { name: "Weapon Upgrade Stone" });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("status", { name: "Loading item details" })).toHaveCount(0);
    await expect(modal.getByText("PREMIUM", { exact: true })).toBeVisible();
    await expect(modal.getByRole("link", { name: /View Official Listings/i })).toHaveAttribute(
      "href",
      /web\.idle-mmo\.com\/item\/inspect\/XjEaOeBkLadJYlGwxVPq/,
    );

    await modal.getByRole("button", { name: "Close item details" }).click();
    await expect(modal).toBeHidden();
  });

  test("profile import validation blocks invalid hashes before any live request", async ({ page }) => {
    await installImportSafetyRoutes(page);
    const startRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/profile-import/start")) startRequests.push(request.url());
    });

    await page.goto("/profiles#profile-transfer", { waitUntil: "domcontentloaded" });

    const importPanel = page.locator("#profile-transfer");
    await expect(importPanel.getByRole("heading", { name: "Import from IdleMMO" })).toBeVisible();
    await expect(importPanel.getByLabel("Saved IdleMMO import status")).toContainText("No IdleMMO import saved yet");
    await expect(importPanel.locator(".profile-turnstile")).toHaveCount(0);

    const hashInput = importPanel.getByLabel("Character hashed ID");
    await hashInput.fill("https://web.idle-mmo.com/profile/not-a-hash");
    await importPanel.getByRole("button", { name: "Start import" }).click();

    await expect(importPanel.locator("#profile-live-import-error")).toContainText(
      "Paste only the character hashed ID, not a full profile URL.",
    );
    await expect(hashInput).toHaveAttribute("aria-invalid", "true");
    expect(startRequests).toEqual([]);
  });

  test("settings persist theme changes and expose install/offline controls", async ({ page }, testInfo) => {
    test.skip(!/desktop/i.test(testInfo.project.name), "Settings persistence smoke runs once on desktop.");

    await page.goto("/settings", { waitUntil: "domcontentloaded" });

    await page.getByRole("radio", { name: "Arcane" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "arcane");
    await expect(page.locator(".theme-option.theme-option-active")).toContainText("Arcane");
    await expect(page.getByRole("radio", { name: "Arcane" })).toHaveAttribute("aria-checked", "true");
    await expect.poll(async () => page.evaluate(() => JSON.parse(window.localStorage.getItem("zenith_preferences") || "{}").theme))
      .toBe("arcane");

    const installPanel = page.locator(".settings-install-panel");
    await expect(installPanel.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(installPanel.getByText("Manual install", { exact: true })).toBeVisible();
    await expect(installPanel.getByRole("button", { name: "Install Zenith Companion as an app" })).toBeDisabled();

    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt") as InstallPromptEventStub;
      event.prompt = async () => {};
      event.userChoice = Promise.resolve({ outcome: "dismissed", platform: "web" });
      (window as WindowWithZenithInstallPrompt).__zenithInstallPromptEvent = event;
      window.dispatchEvent(new Event("zenith-install-prompt-change"));
    });
    await expect(installPanel.getByText("Ready to install", { exact: true })).toBeVisible();
    await installPanel.getByRole("button", { name: "Install Zenith Companion as an app" }).click();
    await expect(installPanel.getByText("Manual install", { exact: true })).toBeVisible();
    await expect(installPanel.getByRole("button", { name: "Install Zenith Companion as an app" })).toBeDisabled();
    await expect.poll(async () => page.evaluate(() => (window as WindowWithZenithInstallPrompt).__zenithInstallPromptEvent ?? null))
      .toBeNull();

    const dataCachePanel = page.locator(".settings-panel-wide", { hasText: "Data Cache" });
    await expect(dataCachePanel.getByText("Offline bundle")).toBeVisible();
    await expect(dataCachePanel.getByText("Browser storage")).toBeVisible();
    await expect(dataCachePanel.getByText("Cached entries")).toBeVisible();
    await expect(dataCachePanel.getByText("Run check")).toBeVisible();
    await expect(dataCachePanel.getByRole("button", { name: "Refresh offline data" })).toBeDisabled();
    await expect(dataCachePanel.getByRole("button", { name: "Clear offline cache" })).toBeDisabled();
    await dataCachePanel.getByRole("button", { name: "Count cached files" }).click();
    await expect(dataCachePanel.getByText(/Offline cache entries counted\.|Offline support is active\./)).toBeVisible();
  });

  test("offline fallback document remains usable", async ({ page }) => {
    await page.goto("/offline.html", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Offline details" })).toContainText("No public data was refreshed.");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open dashboard" })).toHaveAttribute("href", "/");
  });

  test("mobile quick navigation opens the item database", async ({ page }, testInfo) => {
    test.skip(!/mobile/i.test(testInfo.project.name), "Quick navigation smoke runs in the mobile project.");
    await page.addInitScript(() => {
      window.localStorage.setItem("zenith_preferences", JSON.stringify({
        ...JSON.parse(window.localStorage.getItem("zenith_preferences") || "{}"),
        mobileCommandTriggerSide: "left",
        mobileNavigationStyle: "command",
      }));
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Open quick navigation" }).click();

    const wheel = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(wheel).toBeVisible();
    await wheel.getByRole("tab", { name: /Databases/ }).click();
    await wheel.getByRole("link", { name: "Items Database" }).click();

    await expect(page).toHaveURL(/\/items$/);
    await expect(page.locator("#app-command-wheel")).toHaveCount(0);
  });
});
