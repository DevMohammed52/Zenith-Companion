import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("/crafting interactive verification", () => {
  test("desktop exercises minimal empty cart, combobox add-to-cart, steppers, bank checkboxes, undo clear, and 1024px tablet", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context(), { className: "Alchemist" });
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/crafting", { waitUntil: "domcontentloaded" });

    await page.getByRole("heading", { level: 1, name: "Crafting Cart" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.getByRole("combobox", { name: "Search a potion or essence to add" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.getByRole("combobox", { name: "Search a potion or essence to add" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await assertNoHorizontalOverflow(page);

    const shell = page.locator('[class*="pageShell"]');
    await expect(shell).not.toContainText("Recipe scrolls");
    await expect(shell).not.toContainText("Idle session");
    await expect(shell).not.toContainText("Ctrl K");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_crafting_empty_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Pick Battle Potion from Combobox and Add to Cart
    const picker = page.getByRole("combobox", { name: "Search a potion or essence to add" });
    await picker.click();
    await picker.fill("Battle Potion");
    await page.getByRole("option", { name: /Battle Potion/i }).first().click();
    await page.getByRole("button", { name: "Add to Cart", exact: true }).click();

    await expect(page.getByText(/Recipes \(1\)/i)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Shopping List" })).toBeVisible();

    // Adjust stepper on cart recipe
    const rowSpin = page.getByRole("spinbutton", { name: "Battle Potion quantity" });
    const beforeVal = Number(await rowSpin.inputValue());
    await rowSpin.locator("../..").getByRole("button", { name: /^Increase/i }).click();
    await expect(rowSpin).toHaveValue(String(beforeVal + 1));

    // Check Cheap Vial in Shopping List as owned
    const listAside = page.locator("aside[aria-label='Shopping list and cost summary']");
    const vialCheckbox = listAside.getByRole("checkbox", { name: /Cheap Vial/i });
    await listAside.locator("label", { hasText: "Cheap Vial" }).click();
    await expect(vialCheckbox).toBeChecked();
    await expect(listAside.getByText(/Uncheck \(1\)/i)).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_crafting_active_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Clear All and test Undo
    await page.getByRole("button", { name: "Clear All" }).click();
    await expect(page.getByRole("button", { name: "Undo clear" })).toBeVisible();
    await page.getByRole("button", { name: "Undo clear" }).click();
    await expect(page.getByText(/Recipes \(1\)/i)).toBeVisible();

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_crafting_tablet_1024.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
  });

  test("mobile 320px/375px renders empty cart cleanly and handles touch targets without overflow", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context(), { className: "Alchemist" });
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 320, height: 727 });
    await page.goto("/crafting", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Crafting Cart" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.getByRole("combobox", { name: "Search a potion or essence to add" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_crafting_mobile_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    await page.setViewportSize({ width: 375, height: 812 });
    const picker = page.getByRole("combobox", { name: "Search a potion or essence to add" });
    await picker.scrollIntoViewIfNeeded();
    await picker.click();
    await picker.fill("Battle Potion");
    await page.getByRole("option", { name: /Battle Potion/i }).first().click();
    await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
    await expect(page.getByText(/Recipes \(1\)/i)).toBeVisible();

    const inspectBtn = page.getByRole("button", { name: /Inspect Cheap Vial market details/i });
    const inspectBox = await inspectBtn.boundingBox();
    expect(inspectBox?.height ?? 0).toBeGreaterThanOrEqual(43.5);

    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_crafting_mobile_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
