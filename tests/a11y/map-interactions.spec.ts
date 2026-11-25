import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("map interactive checks", () => {
  test("selects regions, computes travel To cost, opens EnemyModal & ItemModal, filters Weather Timeline, and keeps CLS/a11y clean", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());

    const monitors = await attachRuntimeMonitors(page);
    await page.goto("/map?location=the-citadel", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "World Map" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { level: 2, name: "The Citadel" }).first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);

    // Travel calculator displays calibrated distance & teleport cost using From -> To selector
    await expect(page.getByText(/Travel & Teleport/i)).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Travel destination region" })).toBeVisible();
    await expect(page.getByText(/47,250m|Distance/i).first()).toBeVisible();

    // Coordinates tag must no longer appear in Dossier
    await expect(page.getByText(/\(\d{2,3},\s*\d{2,3}\)/)).toHaveCount(0);

    // Switch location via map pin
    await page.getByRole("button", { name: /Bluebell Hollow/i }).first().click();
    await expect(page.getByRole("heading", { level: 2, name: "Bluebell Hollow" }).first()).toBeVisible();
    await expect(page).toHaveURL(/location=bluebell-hollow/);

    // Click an Enemy in Overview & Sources -> opens in-place EnemyModal
    await page.getByRole("button", { name: /Rabbit.*enemy/i }).first().click();
    const enemyDialog = page.getByRole("dialog");
    await expect(enemyDialog).toBeVisible();
    await expect(enemyDialog.getByRole("link", { name: /Open in Enemy Database/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Switch intelligence tabs: Resources -> Loot Drops -> Weather Forecast
    await page.getByRole("tab", { name: /Resources/i }).click();
    await expect(page.getByRole("button", { name: /Oak Log/i })).toBeVisible();

    // Click gathered resource -> opens global ItemModal
    await page.getByRole("button", { name: /Oak Log/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Loot Drops tab & pagination
    await page.getByRole("tab", { name: /Loot Drops/i }).click();
    await expect(page.getByRole("tabpanel", { name: /Loot Drops/i })).toBeVisible();

    // Weather Forecast tab & SegmentedControl + Timeline drawer expansion
    await page.getByRole("tab", { name: /Weather Forecast/i }).click();
    const weatherPanel = page.getByRole("tabpanel", { name: /Weather Forecast/i });
    await expect(weatherPanel.getByRole("tablist", { name: "Filter forecast windows" })).toBeVisible();
    const firstReactionsToggle = weatherPanel.locator("button[aria-expanded]").first();
    await firstReactionsToggle.click();
    await expect(firstReactionsToggle).toHaveAttribute("aria-expanded", "true");

    // Region Select dropdown jump (sorted ascending by level: Bluebell Hollow first)
    await page.getByRole("combobox", { name: "Jump to region" }).click();
    const options = page.getByRole("option");
    await expect(options.first()).toContainText(/Bluebell Hollow/i);
    await page.getByRole("option", { name: /Crystal Caverns/i }).click();
    await expect(page).toHaveURL(/location=crystal-caverns/);

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
