import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("dungeons interactive checks", () => {
  test("desktop tuning controls, readiness filters, pickers, completed runs, and details modal work cleanly", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dungeons", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Dungeon Planner" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.locator("tr.clickable-row").first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_dungeons_1440.png`, fullPage: false });

    // Toggle Apply MF EV & switch Sensitive Drop Value to Manual and back
    await page.getByRole("button", { name: /Apply MF EV/i }).click();
    await page.getByRole("tab", { name: /^Manual$/i }).click();
    const manualInput = page.getByLabel("Manual value for sensitive dungeon drops");
    await expect(manualInput).toBeVisible();
    await manualInput.fill("25000");
    await page.getByRole("tab", { name: /^Market$/i }).click();

    // Open Efficiency Item picker & confirm unobstructed hit-test above cards/table
    const effTrigger = page.getByRole("button", { name: "Active dungeon efficiency item" });
    await effTrigger.click();
    const effListbox = page.getByRole("listbox", { name: "Active dungeon efficiency item" });
    await expect(effListbox).toBeVisible();
    const listboxUnobscured = await effListbox.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + 24);
      return el.contains(hit);
    });
    expect(listboxUnobscured).toBe(true);
    await page.keyboard.press("Escape");
    await expect(effListbox).toHaveCount(0);

    // Filter Ready -> Blocked -> All
    await page.getByRole("tab", { name: /^Ready$/i }).click();
    await page.getByRole("tab", { name: /^Blocked$/i }).click();
    await page.getByRole("tab", { name: /^All$/i }).click();

    // Update Completed runs input cleanly without opening modal
    const firstDoneInput = page.locator("tr.clickable-row input[type='number']").first();
    await firstDoneInput.fill("5");
    await expect(firstDoneInput).toHaveValue("5");

    // Open DungeonDetailsModal for the first dungeon & inspect chest/loot
    await page.locator("tr.clickable-row button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Loot Table/i })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_dungeons_modal_1440.png`, fullPage: false });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Toggle Tuning drawer collapsed & expanded
    await page.getByRole("button", { name: /^Tuning$/i }).click();
    await page.getByRole("button", { name: /^Tuning$/i }).click();

    // Verify 1024px tablet width too
    await page.setViewportSize({ width: 1024, height: 900 });
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
    await page.goto("/dungeons", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Dungeon Planner" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.locator("article input[type='number']").first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);

    const mfBtnBox = await page.getByRole("button", { name: /Apply MF EV/i }).boundingBox();
    expect(mfBtnBox?.height).toBeGreaterThanOrEqual(44);
    const doneInputBox = await page.locator("article input[type='number']").first().boundingBox();
    expect(doneInputBox?.height).toBeGreaterThanOrEqual(44);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_dungeons_375.png`, fullPage: false });

    // Open mobile details modal sheet
    await page.locator("article button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_dungeons_modal_375.png`, fullPage: false });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
