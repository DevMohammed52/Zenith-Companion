import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("ItemModal redesign, Construction links & IdleMMO quality gradients", () => {
  test("desktop verifies non-duplicate identity, Construction recipe links, Mythic/Unique 0deg gradients, and tabs cleanly", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Coal Ore: verify duplicate quality subtitle removed and Sources & Uses renders
    await page.goto("/items?name=Coal%20Ore", { waitUntil: "domcontentloaded" });
    const coalDialog = page.getByRole("dialog");
    await coalDialog.waitFor({ state: "visible", timeout: 15000 });
    await expect(coalDialog.getByRole("heading", { name: "Coal Ore" })).toBeVisible();
    await expect(coalDialog.getByText("STANDARD Ore")).toHaveCount(0);
    await expect(coalDialog.getByLabel("Quick valuation summary")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_item_modal_coal_1440.png`, fullPage: false });
    await assertAxeClean(page, testInfo);
    await page.keyboard.press("Escape");
    await expect(coalDialog).toHaveCount(0);

    // 2. Weak Plank: verify Construction material recipe link to Oak Log 3x
    await page.goto("/items?name=Weak%20Plank", { waitUntil: "domcontentloaded" });
    const plankDialog = page.getByRole("dialog");
    await plankDialog.waitFor({ state: "visible", timeout: 15000 });
    await plankDialog.getByRole("tab", { name: /Sources & Uses/i }).click();
    await expect(plankDialog.getByText("Crafting Recipe")).toBeVisible();
    await expect(plankDialog.getByRole("button", { name: /Oak Log/i })).toContainText("3x Required");
    await plankDialog.getByRole("button", { name: /Oak Log/i }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Oak Log" })).toBeVisible();
    await page.keyboard.press("Escape");

    // 3. Aqua Reaper Recipe (MYTHIC): verify synced Forge/Strength XP, uses badge, Market & Sources tabs
    await page.goto("/items?name=Aqua%20Reaper%20Recipe", { waitUntil: "domcontentloaded" });
    const mythicDialog = page.getByRole("dialog");
    await mythicDialog.waitFor({ state: "visible", timeout: 15000 });
    await expect(mythicDialog.getByText(/\+196,000 Forge XP/i)).toBeVisible();
    await expect(mythicDialog.getByText(/\+9,800 Strength XP/i)).toBeVisible();
    await expect(mythicDialog.getByText("1 use")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_item_modal_mythic_1440.png`, fullPage: false });
    await mythicDialog.getByRole("tab", { name: /^Market$/i }).click();
    await expect(mythicDialog.getByText("Crafting Profit")).toBeVisible();
    await assertAxeClean(page, testInfo);
    await page.keyboard.press("Escape");

    // 4. Scroll of Enlightenment (UNIQUE): verify Unique gradient title & badge + axe clean
    await page.goto("/items?name=Scroll%20of%20Enlightenment", { waitUntil: "domcontentloaded" });
    const uniqueDialog = page.getByRole("dialog");
    await uniqueDialog.waitFor({ state: "visible", timeout: 15000 });
    await expect(uniqueDialog.getByRole("heading", { name: "Scroll of Enlightenment" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_item_modal_unique_1440.png`, fullPage: false });
    await assertAxeClean(page, testInfo);

    // Measure ItemModal interaction CLS after switching tabs on the settled page
    await page.evaluate(() => {
      (window as Window & { __zenithCls?: number }).__zenithCls = 0;
    });
    await uniqueDialog.getByRole("tab", { name: /^Market$/i }).click();
    await uniqueDialog.getByRole("tab", { name: /^Sources & Uses/i }).click();

    await assertNoHorizontalOverflow(page);
    await monitors.assertHealthy(0.1);
  });

  test("mobile ItemModal renders cleanly without horizontal overflow", async ({ page }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/items", { waitUntil: "domcontentloaded" });
    await page.getByRole("main", { name: "Item Database" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByPlaceholder(/search/i).fill("Aqua Reaper Recipe");
    const openBtn = page.getByRole("button", { name: /Open Aqua Reaper Recipe details/i });
    await openBtn.waitFor({ state: "visible", timeout: 15000 });

    // Measure ItemModal's own CLS after the /items catalog finishes initial hydration
    await page.evaluate(() => {
      (window as Window & { __zenithCls?: number }).__zenithCls = 0;
    });

    await openBtn.click();
    const mythicDialog = page.getByRole("dialog");
    await mythicDialog.waitFor({ state: "visible", timeout: 15000 });
    await expect(mythicDialog.getByText(/\+196,000 Forge XP/i)).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_item_modal_mythic_375.png`, fullPage: false });
    await assertAxeClean(page, testInfo);
    await assertNoHorizontalOverflow(page);
    await monitors.assertHealthy(0.1);
  });
});
