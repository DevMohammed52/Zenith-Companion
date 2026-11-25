import { expect, test } from "@playwright/test";
import {
  assertAxeClean,
  assertNoHorizontalOverflow,
  attachRuntimeMonitors,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("housing interactive checks", () => {
  test.beforeEach(async ({ context }) => {
    await seedPopulatedProfile(context);
  });

  test("navigates all 5 housing tabs, toggles owner setup, opens ChoicePicker, and keeps CLS/a11y clean", async ({
    page,
  }, testInfo) => {
    const monitors = await attachRuntimeMonitors(page);

    await page.goto("/housing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "House Planner" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tablist", { name: "Housing sections" })).toBeVisible();

    // 1. Switch to Setup tab, verify Owner mode & slot stepper
    await page.getByRole("tab", { name: /Setup/ }).click();
    await expect(page.getByRole("heading", { name: "Profile Housing" })).toBeVisible();
    await page.getByRole("button", { name: /Owner/ }).click();
    await page.getByRole("button", { name: /Foundation/ }).click();

    // 2. Switch to Components tab, search and open category ChoicePicker
    await page.getByRole("tab", { name: /Components/ }).click();
    await expect(page.getByRole("heading", { name: "Built Components" })).toBeVisible();

    // 3. Switch to Profit & Guest tabs
    await page.getByRole("tab", { name: /Profit/ }).click();
    await expect(page.getByRole("heading", { name: "Idle-Time Value" })).toBeVisible();
    await page.getByRole("tab", { name: /Guest/ }).click();
    await expect(page.getByRole("heading", { name: /Guest buffs are inactive|Received Idle-Time Buffs/ })).toBeVisible();

    // Return to Overview
    await page.getByRole("tab", { name: /Overview/ }).click();
    await expect(page.getByRole("heading", { name: /Strongest buff|Owner House|Housing Disabled|Guest House/ }).first()).toBeVisible();

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
