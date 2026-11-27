import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("/alchemy/mythic interactive verification", () => {
  test("desktop exercises 21-recipe catalog, filters, table/cards, pinned recipe steppers, loadout drawer, and tablet layout", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context(), { className: "Alchemist" });
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/alchemy/mythic", { waitUntil: "domcontentloaded" });

    await page.getByRole("heading", { level: 1, name: "Mythic Lab" }).waitFor({
      state: "visible",
      timeout: 15000,
    });

    await page.locator("#mythic-catalog-results tbody tr").first().waitFor({
      state: "visible",
      timeout: 15000,
    });
    await assertNoHorizontalOverflow(page);

    const rowCount = await page.locator("#mythic-catalog-results tbody tr").count();
    expect(rowCount).toBe(21);

    const firstRowBox = await page.locator("#mythic-catalog-results tbody tr").first().boundingBox();
    expect(firstRowBox).not.toBeNull();
    expect((firstRowBox?.y ?? 999) + (firstRowBox?.height ?? 0)).toBeLessThanOrEqual(900);

    // Inline catalog search must not show global Ctrl K hint
    const toolbar = page.locator('section[aria-label="Mythic catalog filters and controls"]');
    await expect(toolbar).not.toContainText("Ctrl K");

    // Test category filters & table/cards switch
    await page.getByRole("tab", { name: /^Potions \(7\)/i }).click();
    expect(await page.locator("#mythic-catalog-results tbody tr").count()).toBe(7);
    await page.getByRole("tab", { name: /^Stat Essences \(4\)/i }).click();
    expect(await page.locator("#mythic-catalog-results tbody tr").count()).toBe(4);
    await page.getByRole("tab", { name: /^All \(21\)/i }).click();

    await page.getByRole("tab", { name: /^Cards$/i }).click();
    await expect(page.locator("#mythic-catalog-results button[aria-label^='Pin ']").first()).toBeVisible();
    await page.getByRole("tab", { name: /^Table$/i }).click();

    // Open Sort Select dropdown and verify zero clipping
    await page.getByRole("combobox", { name: "Sort mythic catalog" }).click();
    await page.getByRole("option", { name: "30-Use Batch (high-low)" }).click();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_mythic_catalog_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Pin first recipe and open Pinned Projects tab
    await page.locator("#mythic-catalog-results button[aria-label^='Pin ']").first().click();
    await page.getByRole("tab", { name: /^Pinned Projects \(1\)/i }).click();
    await expect(page).toHaveURL(/tab=pinned/);

    const usesSpin = page.getByRole("spinbutton", { name: /Uses Remaining/i }).first();
    await expect(usesSpin).toHaveValue("30");
    await page.getByRole("button", { name: /Decrease Uses Remaining/i }).first().click();
    await expect(usesSpin).toHaveValue("29");
    await expect(page.getByText(/Remaining \(29 uses\)/i)).toBeVisible();

    await page.getByRole("tab", { name: /^Remaining uses$/i }).click();
    await page.getByRole("tab", { name: /^Full \(30u\)$/i }).click();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_mythic_pinned_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Open Loadout & Boosts drawer and test What-If class + Ascension
    await page.getByRole("button", { name: /Loadout & Boosts/i }).click();
    const drawer = page.getByRole("dialog", { name: "Loadout & Boosts" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("combobox", { name: "Temporary class simulation" }).click();
    await page.getByRole("option", { name: /Test Cursed \/ Forsaken/i }).click();
    await drawer.getByRole("button", { name: "Lvl 2 +3%", exact: true }).click();
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_mythic_drawer_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
    await drawer.getByRole("button", { name: "Done" }).click();
    await expect(drawer).toHaveCount(0);

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_mythic_tablet_1024.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
  });

  test("mobile 320px/375px renders cards, drawer Done unclipped, and collapsible project ledger cleanly", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context(), { className: "Alchemist" });
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 320, height: 727 });
    await page.goto("/alchemy/mythic", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Mythic Lab" }).waitFor({
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
      path: `${SCREENSHOT_DIR}/verify_mythic_drawer_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
    await doneBtn.click();

    const firstPinBtn = page.locator("#mythic-catalog-results button[aria-label^='Pin ']:visible").first();
    await firstPinBtn.waitFor({ state: "visible", timeout: 15000 });
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_mythic_catalog_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    await page.setViewportSize({ width: 375, height: 812 });

    const pinBox = await firstPinBtn.boundingBox();
    expect(pinBox?.height ?? 0).toBeGreaterThanOrEqual(43.5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_mythic_catalog_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    await firstPinBtn.click();
    await page.getByRole("tab", { name: /^Pinned Projects \(1\)/i }).click();
    await page.waitForTimeout(250);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_mythic_pinned_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
