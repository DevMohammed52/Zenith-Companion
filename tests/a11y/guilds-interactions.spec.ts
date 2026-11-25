import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("guilds interactive checks", () => {
  test("filters, sorts, toggles view mode, paginates, opens GuildModal tabs & Guide modal cleanly", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());

    const monitors = await attachRuntimeMonitors(page);
    await page.goto("/guilds", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Guild Database" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText(/Season #/i).first().waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);

    // Open Guild Rules & Offline Guide modal
    await page.getByRole("button", { name: /Guild Rules & Offline/i }).click();
    const guideDialog = page.getByRole("dialog");
    await expect(guideDialog).toBeVisible();
    await expect(guideDialog.getByText(/Member Limit by Guild Level/i)).toBeVisible();
    await expect(guideDialog.getByText(/25 members/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Test quick filter chips (Open Slots + Conquest Rulers)
    await page.getByRole("button", { name: /^Open Slots$/i }).click();
    await page.getByRole("button", { name: /Conquest Rulers/i }).click();
    await expect(page).toHaveURL(/open=1/);
    await expect(page).toHaveURL(/conquest=1/);

    // Reset filters
    await page.getByRole("button", { name: "Reset guild filters" }).click();
    await expect(page).not.toHaveURL(/open=1/);

    // Tier filter SegmentedControl + Sort Select
    await page.getByRole("tab", { name: /^Active/i }).click();
    await expect(page).toHaveURL(/tier=hot/);

    await page.getByRole("combobox", { name: "Sort guilds by" }).click();
    await page.getByRole("option", { name: "Season rank" }).click();
    await expect(page).toHaveURL(/sort=season/);

    // Pagination page change
    const page2Btn = page.getByRole("button", { name: "Go to page 2" });
    if (await page2Btn.isVisible()) {
      await page2Btn.click();
      await expect(page.getByRole("button", { name: /Page 2|Go to page 2/i })).toHaveAttribute("aria-current", "page");
    }

    // Desktop view switch (if present)
    const cardsTab = page.getByRole("tab", { name: /^Cards$/i });
    if (await cardsTab.isVisible()) {
      await cardsTab.click();
      await expect(page).toHaveURL(/view=cards/);
    }

    // Inspect Buffalo Grill via search + GuildModal tabs
    await page.getByRole("button", { name: "Reset guild filters" }).click();
    await page.getByRole("searchbox", { name: "Search guilds" }).fill("Buffalo Grill");
    await page.getByRole("button", { name: /Inspect Buffalo Grill|View Buffalo Grill guild details/i }).first().click();

    const guildDialog = page.getByRole("dialog");
    await expect(guildDialog).toBeVisible();
    await expect(guildDialog.getByRole("heading", { level: 3, name: "Buffalo Grill" })).toBeVisible();

    // Wait for details load and switch through modal tabs
    await guildDialog.getByRole("tab", { name: /Roster/i }).waitFor({ state: "visible", timeout: 10000 });
    await guildDialog.getByRole("tab", { name: /Roster/i }).click();
    await expect(guildDialog.getByRole("searchbox", { name: "Filter guild members" })).toBeVisible();

    await guildDialog.getByRole("tab", { name: /Conquest/i }).click();
    await expect(guildDialog.getByText(/Isle of Whispers/i)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
