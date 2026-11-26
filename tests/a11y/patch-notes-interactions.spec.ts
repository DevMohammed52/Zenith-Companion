import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("patch-notes interactive checks", () => {
  test("desktop search, category/year selects, quick topics, drawer toggle, and pagination work cleanly", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/patch-notes", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "IdleMMO Patch Notes" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.getByText(/0\.88\.0-PB/i).first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);

    // Ensure sanitized HTML-free text renders inside the latest entry
    const timelineText = await page.locator("main ol").first().innerText();
    expect(timelineText).not.toContain("<p>");
    expect(timelineText).not.toContain("<strong>");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_patch_notes_1440.png`, fullPage: false });

    // Quick topic chip filter & URL sync
    await page.getByRole("button", { name: /^Combat/i }).first().click();
    await expect(page).toHaveURL(/category=combat/);

    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(page).not.toHaveURL(/category=/);

    // Select comboboxes for category & year
    await page.getByRole("combobox", { name: "Filter patch notes by category" }).click();
    await page.getByRole("option", { name: /Forge/i }).first().click();
    await expect(page).toHaveURL(/category=forge/);

    await page.getByRole("combobox", { name: "Filter patch notes by year" }).click();
    await page.getByRole("option", { name: "2025" }).click();
    await expect(page).toHaveURL(/year=2025/);

    await page.getByRole("button", { name: "Reset filters" }).click();

    // Search filter + highlight + bulk expand/collapse
    const search = page.getByRole("searchbox", { name: "Search patch notes" });
    await search.fill("Forging");
    await expect(page).toHaveURL(/q=Forging/);
    await expect(page.locator("main mark").first()).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).click();

    // Pagination page change
    const page2Btn = page.getByRole("button", { name: "Page 2", exact: true });
    await page2Btn.click();
    await expect(page).toHaveURL(/page=2/);
    await page.getByRole("button", { name: "Expand page" }).click();
    await page.getByRole("button", { name: "Collapse all" }).click();

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });

  test("mobile viewport enforces >= 44px touch targets and zero overflow", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/patch-notes", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "IdleMMO Patch Notes" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.getByText(/0\.88\.0-PB/i).first().waitFor({ state: "visible", timeout: 15000 });

    const allTopicsBox = await page.getByRole("button", { name: "All topics" }).boundingBox();
    expect(allTopicsBox?.height).toBeGreaterThanOrEqual(44);

    const firstTrigger = page.locator("ol li button[aria-expanded]").first();
    const triggerBox = await firstTrigger.boundingBox();
    expect(triggerBox?.height).toBeGreaterThanOrEqual(44);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify_patch_notes_375.png`, fullPage: false });

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
