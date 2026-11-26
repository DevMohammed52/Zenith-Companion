import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("bosses interactive checks", () => {
  test("desktop filters, Magic Find picker, Boss Details modal, and Routine Planner work cleanly", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/bosses", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "World Bosses" }).waitFor({ state: "visible", timeout: 15000 });
    await page.locator("tr.clickable-row").first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_bosses_details_1440.png`, fullPage: false });

    // Exercise Base WB Magic Find input commit
    const mfInput = page.getByLabel(/Base WB Magic Find/i);
    await mfInput.fill("40");
    await mfInput.press("Enter");
    await expect(page.getByText("+40%", { exact: false }).first()).toBeVisible();

    // Open and close WB Consumable / Scroll picker
    const modifierTrigger = page.getByRole("button", { name: /WB Consumable \/ Scroll/i });
    await modifierTrigger.click();
    await expect(page.getByRole("listbox", { name: /WB Consumable \/ Scroll/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox", { name: /WB Consumable \/ Scroll/i })).toHaveCount(0);

    // Filter by phase and reset
    await page.getByRole("button", { name: /^Scheduled$/i }).click();
    await page.getByRole("button", { name: /^All Bosses$/i }).click();

    // Search boss & open BossDetailsModal
    const searchBox = page.getByRole("searchbox", { name: "Search world bosses" });
    const firstBossName = (await page.locator("tr.clickable-row button").first().innerText()).trim();
    await searchBox.fill(firstBossName);
    await page.locator("tr.clickable-row button").first().click();

    const bossDialog = page.getByRole("dialog");
    await expect(bossDialog).toBeVisible();
    await expect(bossDialog.getByRole("heading", { name: firstBossName })).toBeVisible();
    await expect(bossDialog.getByRole("heading", { name: /Upcoming Spawn Windows/i })).toBeVisible();
    await expect(bossDialog.getByRole("heading", { name: /Loot Table/i })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_bosses_modal_1440.png`, fullPage: false });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Reset filters" }).click();

    // Switch to Routine Planner tab
    await page.getByRole("tab", { name: /Routine Planner/i }).click();
    await page.getByRole("heading", { name: "World Boss Circuit" }).waitFor({ state: "visible" });

    // Batch select & Travel mode switch first so warning banner renders below controls
    await page.getByRole("button", { name: "Select all" }).click();
    await page.getByRole("tab", { name: /^Travel$/i }).click();
    await expect(page.getByText(/Walked \(/i).first()).toBeVisible();

    // Open Start Location listbox and verify it paints cleanly above any Banner/cards
    const locationTrigger = page.getByRole("button", { name: /Start Location/i });
    await locationTrigger.click();
    const locationListbox = page.getByRole("listbox", { name: "Routine start location" });
    await expect(locationListbox).toBeVisible();
    const listboxUnobscured = await locationListbox.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const topHit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + 24);
      const bottomHit = document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 24);
      return el.contains(topHit) && el.contains(bottomHit);
    });
    expect(listboxUnobscured).toBe(true);
    await locationListbox.getByRole("option").first().click();
    await expect(locationListbox).toHaveCount(0);

    await page.getByRole("tab", { name: /^Teleport$/i }).click();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_bosses_planner_1440.png`, fullPage: false });

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });

  test("mobile viewport enforces >= 44px touch targets, bottom sheet modal, and zero overflow", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/bosses", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "World Bosses" }).waitFor({ state: "visible", timeout: 15000 });
    await page.locator("button[aria-label^='Inspect ']").first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);

    // Check touch target height >= 44px on phase pills and first mobile boss card
    const phasePillBox = await page.getByRole("button", { name: /^All Bosses$/i }).boundingBox();
    expect(phasePillBox?.height).toBeGreaterThanOrEqual(44);
    const mobileCardBox = await page.locator("button[aria-label^='Inspect ']").first().boundingBox();
    expect(mobileCardBox?.height).toBeGreaterThanOrEqual(44);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_bosses_details_375.png`, fullPage: false });

    // Open first boss card sheet on mobile
    await page.locator("button[aria-label^='Inspect ']").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_bosses_modal_375.png`, fullPage: false });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Switch to Routine Planner on mobile
    await page.getByRole("tab", { name: /Routine Planner/i }).click();
    await page.getByRole("heading", { name: "World Boss Circuit" }).waitFor({ state: "visible" });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_bosses_planner_375.png`, fullPage: false });

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
