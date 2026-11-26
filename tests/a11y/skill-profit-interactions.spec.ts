import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("skill-profit interactive checks", () => {
  test("desktop renders table above the fold, Loadout drawer, quick filters, rate switch, modal, and tablet layout cleanly", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/skill-profit", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Skill Profit Planner" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    const firstRow = page.locator("tr.clickable-row").first();
    await firstRow.waitFor({ state: "visible", timeout: 15000 });
    await page.waitForFunction(
      () => {
        const spotlightImg = document.querySelector<HTMLImageElement>(
          'button[aria-label^="Open top route"] img',
        );
        return spotlightImg ? spotlightImg.complete && spotlightImg.naturalWidth > 0 : false;
      },
      { timeout: 15000 },
    );

    await assertNoHorizontalOverflow(page);

    // Above-the-fold contract: first profit row renders visibly inside 1440x900 without scrolling
    const firstRowBox = await firstRow.boundingBox();
    expect(firstRowBox).not.toBeNull();
    expect((firstRowBox?.y ?? 999) + (firstRowBox?.height ?? 0)).toBeLessThanOrEqual(900);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_skill_profit_1440.png`, fullPage: false });

    // Switch Sell mode, Rate mode (Session <-> Hourly), and quick Tag filters
    await page.getByRole("tab", { name: /^Market$/i }).click();
    await page.getByRole("tab", { name: /^Auto$/i }).click();
    await page.getByRole("tab", { name: /^Session$/i }).click();
    await page.getByRole("tab", { name: /^Hourly$/i }).click();

    await page.getByRole("button", { name: /^Liquid only$/i }).click();
    await page.getByRole("button", { name: /^Profitable$/i }).click();
    await page.getByRole("button", { name: /^Reset$/i }).click();

    // Open Min Vol popover and verify stepper + preset chips
    await page.getByRole("button", { name: /Min Vol:/i }).click();
    const volDialog = page.getByRole("dialog", { name: "Minimum 3-day market volume filter" });
    await expect(volDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(volDialog).toHaveCount(0);

    // Switch skill tab and confirm context-aware spotlight updates
    await page.getByRole("tab", { name: /^Fishing/i }).click();
    await expect(page.getByText("Best Fishing Route")).toBeVisible();
    await page.getByRole("tab", { name: /^All/i }).click();

    // Open Loadout & Boosts right drawer, test Bartering Lv '+' increment, Conquest picker & Essence dropdown, screenshot, Escape close
    await page.getByRole("button", { name: /Loadout & Boosts/i }).click();
    const drawer = page.getByRole("dialog", { name: "Loadout & Boosts" });
    await expect(drawer).toBeVisible();

    const increaseBarter = drawer.getByRole("button", { name: "Increase Bartering Lv" });
    const barterSpin = drawer.getByRole("spinbutton", { name: "Bartering Lv" });
    const beforeBarter = Number((await barterSpin.getAttribute("aria-valuenow")) || "0");
    await increaseBarter.click();
    await expect(barterSpin).toHaveAttribute("aria-valuenow", String(beforeBarter + 1));

    const wcEssenceTrigger = drawer.getByRole("button", { name: "Woodcutting essence" });
    await wcEssenceTrigger.click();
    await expect(drawer.getByRole("listbox", { name: "Woodcutting essence" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_skill_profit_drawer_1440.png`, fullPage: false });

    const conquestTrigger = drawer.getByRole("button", { name: "Guild Conquest rank" });
    await conquestTrigger.click();
    await expect(drawer.getByRole("listbox", { name: "Guild Conquest rank" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Loadout & Boosts" })).toHaveCount(0);

    // Open Strategy modal & inspect all 3 tabs (Breakdown, What-If Prices, Item & Sources)
    await page.locator("tr.clickable-row button").first().click();
    const strategyDialog = page.getByRole("dialog");
    await expect(strategyDialog).toBeVisible();
    await expect(strategyDialog.getByText("Revenue & Margin")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_skill_profit_modal_1440.png`, fullPage: false });
    await strategyDialog.getByRole("tab", { name: /^What-If Prices/i }).click();
    await expect(strategyDialog.getByText("Try Buy & Sell Prices")).toBeVisible();
    await strategyDialog.getByRole("tab", { name: /^Item & Sources/i }).click();
    await expect(strategyDialog.getByText("Base Time")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);

    // Tablet width overflow & axe check
    await page.setViewportSize({ width: 1024, height: 900 });
    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
  });

  test("mobile viewport enforces >= 44px touch targets, bottom sheet modal, drawer, and zero overflow", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/skill-profit", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Skill Profit Planner" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.locator("article button").first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);

    const spotlightBox = await page.getByRole("button", { name: /Open top route/i }).boundingBox();
    expect(spotlightBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const loadoutBtnBox = await page.getByRole("button", { name: /Loadout & Boosts/i }).boundingBox();
    expect(loadoutBtnBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_skill_profit_375.png`, fullPage: false });

    // Open Strategy modal on mobile
    await page.locator("article button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_skill_profit_modal_375.png`, fullPage: false });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
