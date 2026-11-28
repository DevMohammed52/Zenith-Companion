import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("/ dashboard bento hub interactive verification", () => {
  test("desktop configured state: verifies membership gradient & icon, Top Gold Routes without filter tabs/Liquid min, rotating Current Weather (Bluebell -> Whispering Woods) + canvas, scenic World Boss, CLS <= 0.1, and axe checks", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context(), { className: "Beastmaster" });

    await page.context().addInitScript(() => {
      try {
        window.localStorage.setItem("zenith.firstRunSetup.dismissed.v1", "1");
        const raw = window.localStorage.getItem("zenith_character_profiles_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.profiles) && parsed.profiles[0]) {
            parsed.profiles[0].guild = { tag: "ZEN", level: 42, position: "Officer" };
            parsed.profiles[0].gear = {
              weapon: "Grimslayer",
              shield: "Aegis of the Seraph",
              chestplate: "Bloodforged Harness",
            };
            parsed.profiles[0].currentStatus = "Woodcutting";
            parsed.profiles[0].location = { name: "Whispering Woods" };
            parsed.profiles[0].pet = {
              species: "Wyrmshadow",
              level: 97,
              quality: "MYTHIC",
              evolution: 0,
              stats: {},
            };
            parsed.profiles[0].ownedPets = [
              {
                id: "fluffy-test-1",
                species: "Fluffy",
                level: 5,
                quality: "STANDARD",
                active: false,
                equipped: false,
                stats: {},
              },
            ];
            window.localStorage.setItem("zenith_character_profiles_v1", JSON.stringify(parsed));
          }
        }
        const prefsRaw = window.localStorage.getItem("zenith_preferences");
        const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
        prefs.membership = true;
        window.localStorage.setItem("zenith_preferences", JSON.stringify(prefs));

        const queuePayload = JSON.stringify({ "Battle Potion": 12 });
        window.localStorage.setItem("zenith_craft_queue", queuePayload);
        window.localStorage.setItem(
          "zenith_craft_queue__profile__playwright-seeded-profile-1",
          queuePayload,
        );
      } catch {
        // Ignore seed error
      }
    });

    const monitors = await attachRuntimeMonitors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const mainEl = page.locator("main");
    await expect(mainEl.getByRole("heading", { level: 1, name: /TestValkyrie/ })).toBeVisible({
      timeout: 30000,
    });
    await expect(mainEl.getByRole("img", { name: "Active membership" })).toBeVisible();
    await expect(mainEl.getByText("[ZEN]")).toBeVisible();
    await expect(mainEl.getByText(/Wyrmshadow \(Lv\. 97\)/)).toBeVisible();
    await expect(mainEl).not.toContainText("Fluffy (Lv. 5)");
    await expect(mainEl.getByRole("link", { name: /^Active companion pet: Wyrmshadow/ })).toBeVisible();
    await expect(mainEl.getByRole("link", { name: /^Crafting Queue/i })).toContainText("12 queued");
    await expect(mainEl.getByRole("link", { name: /^Pets/i }).last()).toContainText("1 owned");

    // Verify clean simpler copy and removed clutter
    await expect(mainEl.getByRole("heading", { level: 2, name: "Top Gold Routes" })).toBeVisible();
    await expect(mainEl.getByRole("heading", { level: 2, name: "World Boss" })).toBeVisible();
    await expect(mainEl.getByRole("heading", { level: 2, name: "Current Weather" })).toBeVisible();
    await expect(mainEl.getByRole("combobox")).toHaveCount(0);
    await expect(mainEl.getByRole("tab")).toHaveCount(0);
    await expect(mainEl).not.toContainText("Liquid min");
    await expect(mainEl).not.toContainText("All Routes");
    await expect(mainEl).not.toContainText("+10 Cart");
    await expect(mainEl).not.toContainText("Next Storm:");
    await expect(mainEl).not.toContainText("Woodcutting at Whispering Woods");
    await expect(mainEl).not.toContainText("Offline at");
    await expect(mainEl).not.toContainText("Chest of Upgrade Stones");
    await expect(mainEl).not.toContainText("Rain: ");
    await expect(mainEl).not.toContainText("Ctrl K");
    await expect(mainEl).not.toContainText("·");
    await assertNoHorizontalOverflow(page);

    // Wait for Bluebell Hollow Weather slide + Canvas + World Boss image decode
    const weatherCard = mainEl.getByRole("article", { name: "Current weather" });
    await expect(weatherCard).toContainText("Bluebell Hollow");
    await expect(weatherCard.locator("canvas")).toHaveCount(1);
    await expect(mainEl.getByRole("link", { name: "World boss", exact: true })).not.toContainText("undefined");

    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll("main img"));
      await Promise.race([
        Promise.all(
          imgs.map((img) =>
            (img as HTMLImageElement).complete
              ? Promise.resolve()
              : new Promise((res) => {
                  img.addEventListener("load", res, { once: true });
                  img.addEventListener("error", res, { once: true });
                }),
          ),
        ),
        new Promise((res) => setTimeout(res, 2500)),
      ]);
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_dashboard_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    // Advance Current Weather rotation manually -> verifies Bluebell Hollow -> Whispering Woods transition
    await weatherCard.getByRole("button", { name: "Next location weather" }).click();
    await expect(weatherCard).toContainText("Whispering Woods");
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_dashboard_filtered_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    await page.setViewportSize({ width: 320, height: 740 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await expect(mainEl).not.toContainText("Idle cap");
    const weatherMetaBox = await weatherCard.getByText(/^(Next Magic Storm:|\d+\s*\/\s*\d+$)/).boundingBox();
    expect(weatherMetaBox?.height ?? 0).toBeGreaterThan(0);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_dashboard_configured_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(100);
    await monitors.assertHealthy(0.1);
    await assertAxeClean(page, testInfo, "serious");
  });

  test("guest state & responsive viewports (1024px, 375px, 320px): verifies setup banner, touch targets >= 44px, and zero horizontal overflow", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await page.context().addInitScript(() => {
      try {
        window.localStorage.setItem("zenith.firstRunSetup.dismissed.v1", "1");
      } catch {
        // Ignore storage seed error
      }
    });

    const monitors = await attachRuntimeMonitors(page);
    const mainEl = page.locator("main");

    // 1. Desktop guest view shows clean command hub + setup reminder
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(mainEl.getByRole("heading", { level: 1, name: "IdleMMO Companion" })).toBeVisible({
      timeout: 30000,
    });
    await expect(mainEl.getByRole("region", { name: "Profile setup reminder" })).toBeVisible();
    await expect(mainEl.getByRole("link", { name: "Create or import profile", exact: true })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_dashboard_guest_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    // 2. Tablet 1024px
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_dashboard_tablet_1024.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    // 3. Mobile 375px + >= 44px touch targets
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(250);
    await assertNoHorizontalOverflow(page);

    const setupLinkBox = await mainEl.getByRole("link", { name: "Create or import profile", exact: true }).boundingBox();
    expect(setupLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    const nextWeatherBox = await mainEl.getByRole("button", { name: "Next location weather" }).boundingBox();
    expect(nextWeatherBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_dashboard_mobile_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    // 4. Compact mobile 320px
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_dashboard_mobile_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    await monitors.assertHealthy(0.1);
    await assertAxeClean(page, testInfo, "serious");
  });

  test("verifies ?search= filtering from dashboard links on /items, /alchemy, /skill-profit and post-cleanup /settings layout", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context(), { className: "Alchemist" });
    const monitors = await attachRuntimeMonitors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/items?search=Chestplate%20Upgrade%20Stone", { waitUntil: "domcontentloaded" });
    const itemsMain = page.locator("main");
    await expect(itemsMain.getByText("Chestplate Upgrade Stone").first()).toBeVisible({ timeout: 30000 });
    await expect(itemsMain.getByText("Coal Ore")).toHaveCount(0);

    await page.goto("/alchemy?search=Wraithbane%20Essence", { waitUntil: "domcontentloaded" });
    const alchemyTable = page.locator("main table");
    await expect(alchemyTable.getByText("Wraithbane Essence").first()).toBeVisible({ timeout: 30000 });
    await expect(alchemyTable.getByText("Battle Potion")).toHaveCount(0);

    await page.goto("/skill-profit?search=Coal", { waitUntil: "domcontentloaded" });
    const skillTable = page.locator("main table");
    await expect(skillTable.getByText(/Coal/i).first()).toBeVisible({ timeout: 30000 });

    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
    await assertNoHorizontalOverflow(page);

    await monitors.assertHealthy(0.1);
  });
});
