import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("museum interactive checks", () => {
  test("renders populated collection, filters categories, paginates, opens snapshot modal, and keeps CLS/a11y clean", async ({
    page,
  }, testInfo) => {
    await seedPopulatedProfile(page.context());

    // Populate museum items onto the seeded active profile cleanly before page scripts boot
    await page.addInitScript(() => {
      const raw = window.localStorage.getItem("zenith_character_profiles_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const profile = parsed.profiles[0];
      const items = [
        { category: "COLLECTIBLES", id: "ElzPeorXNVq3QaW0kv53", name: "Green Scroll", quantity: 538, imageUrl: "" },
        { category: "PETS", id: 24, name: "Orthrus", quantity: 1, imageUrl: "" },
        { category: "BESTIARY", id: 46, name: "Basilisk", quantity: 12, imageUrl: "" },
        ...Array.from({ length: 28 }, (_, idx) => ({
          category: "SKINS",
          id: 900 + idx,
          name: `Test Skin ${idx + 1}`,
          quantity: idx + 1,
          imageUrl: "",
        })),
      ];
      profile.museum = {
        status: "imported",
        sourceHashTail: "playwright123",
        importedAt: new Date().toISOString(),
        endpointUpdatedAt: new Date().toISOString(),
        pageCount: 2,
        itemCount: items.length,
        pagination: { currentPage: 1, lastPage: 2, fetchedPages: [1, 2], failedPages: [] },
        missingOrPrivate: [],
        items,
      };
      window.localStorage.setItem("zenith_character_profiles_v1", JSON.stringify(parsed));
    });

    const monitors = await attachRuntimeMonitors(page);
    await page.goto("/museum", { waitUntil: "domcontentloaded" });
    await page.locator("#museum-page-title").waitFor({ state: "visible", timeout: 15000 });
    await page.locator('[aria-label="Museum items"]').waitFor({ state: "visible", timeout: 15000 });

    await assertNoHorizontalOverflow(page);

    // Bounded pagination defaults to 24 items per page
    await expect(page.locator('[aria-label="Museum items"] article')).toHaveCount(24);
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.locator('[aria-label="Museum items"] article')).toHaveCount(7);

    // Open & close Snapshot Info modal
    await page.getByRole("button", { name: /Snapshot Info/i }).click();
    await expect(page.getByRole("dialog", { name: /Museum Snapshot Info/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Change sort option via Select
    await page.getByRole("combobox", { name: "Sort museum items" }).click();
    await page.getByRole("option", { name: "Sort: Quantity" }).click();

    // Filter by category and search
    await page.getByRole("button", { name: /Collectibles/i }).click();
    await expect(page.locator('[aria-label="Museum items"] article')).toHaveCount(1);
    await page.getByRole("button", { name: /All/i }).click();
    await page.getByPlaceholder("Search by item name, category, or ID...").fill("Basilisk");
    await expect(page.locator('[aria-label="Museum items"] article')).toHaveCount(1);
    await page.getByRole("button", { name: /Reset/i }).click();
    await expect(page.locator('[aria-label="Museum items"] article')).toHaveCount(24);

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
