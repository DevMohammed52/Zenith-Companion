import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("conquest interactive checks", () => {
  test("filters zones, opens Buffs & Shards modal, paginates contributors, switches seasons, and keeps CLS/a11y clean", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());
    const monitors = await attachRuntimeMonitors(page);
    await page.goto("/conquest", { waitUntil: "domcontentloaded" });
    await page.locator("#conquest-page-title").waitFor({ state: "visible", timeout: 15000 });
    await page.locator('[aria-label="Conquest zones"]').waitFor({ state: "visible", timeout: 15000 });

    const notNow = page.getByRole("button", { name: "Not now" });
    if (await notNow.count()) {
      await notNow.click();
    }

    await assertNoHorizontalOverflow(page);

    // Open & close the page-level Buffs & Shards reference modal
    await page.getByRole("button", { name: /Buffs & Shards/i }).click();
    await expect(page.getByRole("dialog", { name: /Conquest Territory Buffs & Shards/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Switch through all 3 dynamic detail tabs
    await page.getByRole("tab", { name: "Contributors" }).click();
    await expect(page.locator("#conquest-panel-contributors")).toBeVisible();

    await page.getByRole("tab", { name: "Assaults" }).click();
    await expect(page.locator("#conquest-panel-assaults")).toBeVisible();

    await page.getByRole("tab", { name: "Guilds" }).click();
    await expect(page.locator("#conquest-panel-guilds")).toBeVisible();

    // Filter & Search
    await page.getByRole("button", { name: "Dominated" }).click();
    await page.getByRole("button", { name: "All Zones" }).click();
    const search = page.getByPlaceholder("Search zone, guild, player...");
    await search.fill("Bluebell");
    await expect(page.locator('[aria-label="Conquest zones"] article')).toHaveCount(1);
    await page.getByRole("button", { name: /Clear/i }).click();

    // Historical Season Switcher
    const seasonTrigger = page.getByRole("combobox", { name: "Select conquest season" });
    await seasonTrigger.click();
    await page.getByRole("option", { name: /Season 12/i }).click();
    await expect(page.locator('[aria-label="Season summary"]')).toContainText("Season 12 Archive");

    // Verify paginated contributors inside Season 12 Whispering Woods
    await page.getByRole("tab", { name: "Contributors" }).click();
    await expect(page.locator("#conquest-panel-contributors a")).toHaveCount(10);

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
