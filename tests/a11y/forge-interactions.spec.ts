import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("forge interactive checks", () => {
  test("desktop exercises full-width Lessons, Table/Cards, Loadout Drawer, Session Queue & Temper Bar, Craft Item 2-pane, and tablet layout", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/forge", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Forge Planner" }).waitFor({
      state: "visible",
      timeout: 15000,
    });

    await expect(page.getByRole("spinbutton", { name: "Forge Level" })).toHaveValue("90", { timeout: 15000 });
    await expect(page.getByRole("columnheader", { name: /Material \(91\)/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Toggle Cards and Table views cleanly in Materials Catalog
    await page.getByRole("tab", { name: /^Cards$/i }).click();
    await expect(page.getByLabel("Materials catalog cards")).toBeVisible();
    await page.getByRole("tab", { name: /^Table$/i }).click();
    await expect(page.getByRole("columnheader", { name: /Material \(91\)/i })).toBeVisible();

    // Above-the-fold density check: first 4 material rows must be visible on 1440x900
    const row4Box = await page.locator("tbody tr").nth(3).boundingBox();
    expect(row4Box).not.toBeNull();
    expect((row4Box?.y ?? 999) + (row4Box?.height ?? 0)).toBeLessThanOrEqual(900);

    // Open Sort picker and close via Escape
    const sortBtn = page.getByRole("combobox", { name: "Sort lesson materials by" });
    await sortBtn.click();
    await expect(page.getByRole("listbox", { name: "Sort lesson materials by" })).toBeVisible();
    await page.keyboard.press("Escape");

    // Step duration +30m and open Loadout & Boosts Drawer
    await page.getByRole("button", { name: "Increase duration 30 minutes" }).click();
    await page.getByRole("button", { name: "Configure EXP and Efficiency buffs" }).click();
    const drawer = page.getByRole("dialog", { name: "Loadout & Boosts" });
    await expect(drawer).toBeVisible();

    await drawer.getByRole("combobox", { name: "Guild Conquest Rank" }).click();
    await page.getByRole("option", { name: /1st Place/i }).click();
    const poolInput = drawer.getByRole("spinbutton", { name: /Energizing Pool EXP/i });
    await poolInput.fill("10");
    await drawer.getByRole("button", { name: "L20 +13%", exact: true }).click();
    await drawer.getByRole("button", { name: "L35 +7%", exact: true }).click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_forge_drawer_1440.png`, fullPage: false, animations: "disabled", timeout: 15000 });

    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);

    await page.waitForFunction(
      () => Array.from(document.querySelectorAll<HTMLImageElement>("#forge-lessons-panel img")).slice(0, 4).every((i) => i.complete && i.naturalWidth > 0),
      { timeout: 3000 },
    ).catch(() => {});

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_forge_lessons_1440.png`, fullPage: false, animations: "disabled", timeout: 15000 });

    // Fill session from first material and inspect Session Queue tab + 24h Temper bar
    await page.locator('button[aria-label^="Fill session with "]').first().click();
    await expect(page.getByRole("button", { name: "Edit Queue" })).toBeVisible();
    await page.getByRole("tab", { name: /^Session Queue/i }).click();
    await expect(page.getByText(/24h Temper bar:/i)).toBeVisible();
    await expect(page.getByText(/Projected Forge Level:/i)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_forge_queue_1440.png`, fullPage: false, animations: "disabled", timeout: 10000 });

    // Check Goal Planner (3-column route comparison) and My Stock sub-tabs
    await page.getByRole("tab", { name: /^Goal Planner$/i }).click();
    await expect(page.getByText("Cheapest Route", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: /^My Stock/i }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Owned Materials" })).toBeVisible();

    // Switch to Craft Item primary tab and verify 2-pane recipe + sticky shopping layout
    await page.getByRole("tab", { name: /^Craft Item$/i }).click();
    await expect(page).toHaveURL(/\/forge\?tab=craft/);
    const recipeInput = page.getByRole("combobox", { name: "Forge recipe" });
    await recipeInput.click();
    const recipeMenu = page.locator("#forge-recipe-options");
    await expect(recipeMenu).toBeVisible({ timeout: 15000 });
    const menuBg = await recipeMenu.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(menuBg).not.toBe("rgba(0, 0, 0, 0)");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_forge_craft_dropdown_1440.png`, fullPage: false, animations: "disabled", timeout: 15000 });
    await page.locator("#forge-recipe-option-0").click();

    await expect(page.getByText("Missing Materials", { exact: true })).toBeVisible();
    await expect(page.getByText("Recipe Copies", { exact: true })).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_forge_craft_1440.png`, fullPage: false, animations: "disabled", timeout: 15000 });

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);

    // Tablet viewport verification (1024px)
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.getByRole("tab", { name: /^Lessons$/i }).click();
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_forge_tablet_1024.png`, fullPage: false, animations: "disabled", timeout: 15000 });
  });

  test("mobile viewport renders cleanly with touch targets >= 44px, zero Loadout button clipping, and working sub-routes", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/forge", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Forge Planner" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await expect(page.getByRole("spinbutton", { name: "Forge Level" })).toHaveValue("90", { timeout: 15000 });
    await page.waitForLoadState("load");

    await assertNoHorizontalOverflow(page);

    // Ensure Loadout & Boosts button fits strictly inside the 375px viewport
    const buffsBtnBox = await page.getByRole("button", { name: "Configure EXP and Efficiency buffs" }).boundingBox();
    expect(buffsBtnBox).not.toBeNull();
    expect((buffsBtnBox?.x ?? 0) + (buffsBtnBox?.width ?? 0)).toBeLessThanOrEqual(375);
    expect(buffsBtnBox?.height ?? 0).toBeGreaterThanOrEqual(36);

    // Verify primary tabs meet >= 44px height
    const lessonsTabBox = await page.locator("#forge-tab-lessons").boundingBox();
    const craftTabBox = await page.locator("#forge-tab-craft").boundingBox();
    expect(lessonsTabBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(craftTabBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_forge_mobile_375.png`, fullPage: false });
    await assertAxeClean(page, testInfo, "serious");

    // Verify direct sub-routes /forge/lessons and /forge/craft render cleanly
    await page.goto("/forge/lessons", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#forge-tab-panel-lessons")).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: "Forge Level" })).toHaveValue("90", { timeout: 15000 });
    await assertNoHorizontalOverflow(page);

    await page.goto("/forge/craft", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#forge-tab-panel-craft")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("combobox", { name: "Forge recipe" })).toBeVisible({ timeout: 15000 });
    await assertNoHorizontalOverflow(page);

    await monitors.assertHealthy(0.1);
  });
});
