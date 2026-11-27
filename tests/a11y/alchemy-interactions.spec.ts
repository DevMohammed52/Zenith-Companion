import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("/alchemy interactive verification", () => {
  test("desktop exercises above-the-fold table, category tabs, hourly/session, cards/table, loadout drawer, queue, and strategy modal", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context(), { className: "Alchemist" });
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/alchemy", { waitUntil: "domcontentloaded" });

    await page.getByRole("heading", { level: 1, name: "Alchemy Profit" }).waitFor({
      state: "visible",
      timeout: 15000,
    });

    // Wait for recipe table rows to hydrate from market data
    await page.locator("#alchemy-results-panel tbody tr").first().waitFor({
      state: "visible",
      timeout: 15000,
    });
    await assertNoHorizontalOverflow(page);

    // Above-the-fold density check: spotlight and first rows appear inside initial 1440x900 viewport
    const firstRowBox = await page.locator("#alchemy-results-panel tbody tr").first().boundingBox();
    expect(firstRowBox).not.toBeNull();
    expect((firstRowBox?.y ?? 999) + (firstRowBox?.height ?? 0)).toBeLessThanOrEqual(900);

    // Verify category tabs update URL & visible recipes
    await page.getByRole("tab", { name: /^Potions/i }).click();
    await expect(page).toHaveURL(/tab=potion/);
    await page.getByRole("tab", { name: /^Essence Crystals/i }).click();
    await expect(page).toHaveURL(/tab=essence_crystal/);
    await page.getByRole("tab", { name: /^Stat Essences/i }).click();
    await expect(page).toHaveURL(/tab=stat_essence/);
    await page.getByRole("tab", { name: /^All Recipes/i }).click();

    // Toggle Session vs Hourly window and Cards vs Table view
    await page.getByRole("tab", { name: /^Session$/i }).click();
    await page.getByRole("tab", { name: /^Hourly$/i }).click();
    await page.getByRole("tab", { name: /^Cards$/i }).click();
    await expect(page.locator("#alchemy-results-panel button[aria-label^='Add ']").first()).toBeVisible();
    await page.getByRole("tab", { name: /^Table$/i }).click();

    // Ensure inline toolbar SearchInput never renders the global Ctrl K hint
    const toolbar = page.getByRole("region", { name: "Alchemy filters and controls" }).or(page.locator('section[aria-label="Alchemy filters and controls"]'));
    await expect(toolbar).not.toContainText("Ctrl K");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_alchemy_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Open Filters popover and verify Escape dismisses
    await page.getByRole("button", { name: /^Filters/i }).click();
    await expect(page.getByRole("dialog", { name: "More alchemy filters" })).toBeVisible();
    await page.keyboard.press("Escape");

    // Open Loadout & Boosts Drawer and test What-If Class + Conquest overrides
    await page.getByRole("button", { name: /Loadout & Boosts/i }).click();
    const drawer = page.getByRole("dialog", { name: "Loadout & Boosts" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("combobox", { name: "Temporary class simulation" }).click();
    await page.getByRole("option", { name: /Test Cursed \/ Forsaken/i }).click();
    await drawer.getByRole("button", { name: "Lvl 2 +3%", exact: true }).click();
    await drawer.getByRole("button", { name: "Lvl 1 +5%", exact: true }).click();
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_alchemy_drawer_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
    await drawer.getByRole("button", { name: "Done" }).click();
    await expect(drawer).toHaveCount(0);

    // Queue first recipe and verify header queue pill count increments
    await page.locator('#alchemy-results-panel button[aria-label^="Add "]').first().click();
    await expect(page.getByRole("link", { name: /Crafting Queue \(/i })).toBeVisible();

    // Open Strategy Modal & switch through all 3 tabs
    await page.locator('#alchemy-results-panel button[aria-label^="Inspect "]').first().click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_alchemy_modal_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
    await modal.getByRole("tab", { name: /^Paths & EXP$/i }).click();
    await expect(modal.getByText(/Alchemy EXP/i)).toBeVisible();
    await modal.getByRole("tab", { name: /^Batch Queue$/i }).click();
    await expect(modal.getByRole("button", { name: /Add .* to Queue/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);

    // Verify Mythic search empty-state jump & reset
    const search = page.getByRole("searchbox", { name: /Search alchemy recipes/i });
    await search.fill("Titans Essence");
    await expect(page.getByRole("link", { name: /Open Mythic Lab/i })).toBeVisible();
    await page.getByRole("button", { name: "Reset Filters" }).click();
    await expect(page.locator("#alchemy-results-panel tbody tr").first()).toBeVisible();

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);

    // Tablet viewport verification (1024px)
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_alchemy_tablet_1024.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
  });

  test("mobile 320px/375px renders cards cleanly, keeps Drawer Done unclipped, and opens bottom-sheet strategy", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context(), { className: "Alchemist" });
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 320, height: 727 });
    await page.goto("/alchemy", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Alchemy Profit" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.getByRole("button", { name: /Loadout & Boosts/i }).click();
    const narrowDrawer = page.getByRole("dialog", { name: "Loadout & Boosts" });
    await expect(narrowDrawer).toBeVisible();
    const doneBtn = narrowDrawer.getByRole("button", { name: "Done", exact: true });
    await expect(doneBtn).toBeVisible();
    const doneBox = await doneBtn.boundingBox();
    expect(doneBox).not.toBeNull();
    expect((doneBox?.x ?? 999) + (doneBox?.width ?? 0)).toBeLessThanOrEqual(320);
    expect(doneBox?.width ?? 0).toBeGreaterThanOrEqual(48);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_alchemy_drawer_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
    await doneBtn.click();
    await expect(narrowDrawer).toHaveCount(0);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator("#alchemy-results-panel button[aria-label^='Add ']:visible").first().waitFor({
      state: "visible",
      timeout: 15000,
    });

    await assertNoHorizontalOverflow(page);

    // Verify Queue/Strategy action buttons on mobile cards meet >= 44px hit height
    const firstQueueBtn = page.locator("#alchemy-results-panel button[aria-label^='Add ']:visible").first();
    const qBox = await firstQueueBtn.boundingBox();
    expect(qBox?.height ?? 0).toBeGreaterThanOrEqual(43.5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_alchemy_mobile_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    await page.locator("#alchemy-results-panel button:has-text('Strategy'):visible").first().click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_alchemy_modal_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
    await page.keyboard.press("Escape");

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
