import { expect, test } from "@playwright/test";
import {
  assertAxeClean,
  assertNoHorizontalOverflow,
  attachRuntimeMonitors,
  openUnclippedListboxOption,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("owned pets interactive checks", () => {
  test.beforeEach(async ({ context }) => {
    await seedPopulatedProfile(context);
  });

  test("manages spotlight, tabs, cards/table views, multi-select compare, detail modal, and keeps CLS/a11y clean", async ({
    page,
  }, testInfo) => {
    const monitors = await attachRuntimeMonitors(page);

    await page.goto("/pets/owned", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Owned Pets" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("region", { name: "Equipped pet spotlight" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);

    // 1. Multi-select compare tray
    await page.locator("label", { has: page.getByRole("checkbox", { name: /Select Cerberus for comparison/ }) }).click();
    await page.locator("label", { has: page.getByRole("checkbox", { name: /Select Drakeling for comparison/ }) }).click();
    const compareTray = page.getByRole("region", { name: "Selected pets for comparison" });
    await expect(compareTray).toBeVisible();
    await expect(compareTray.getByRole("link", { name: /Compare selected \(2\)/ })).toHaveAttribute(
      "href",
      /\/pets\/compare\?pets=owned/,
    );
    await compareTray.getByRole("button", { name: "Clear selection" }).click();

    // 2. Open Source & Sort on mobile if collapsed, open Sort Select unclipped, and filter
    const filterTrigger = page.locator("button[aria-controls='owned-pet-filter-accordion']");
    const expanded = await filterTrigger.getAttribute("aria-expanded");
    if (expanded !== "true") {
      await filterTrigger.click();
      await expect(filterTrigger).toHaveAttribute("aria-expanded", "true");
    }

    const sortTrigger = page.getByRole("combobox", { name: "Sort by" });
    const sortListbox = page.getByRole("listbox", { name: "Sort by" });
    const powerOption = await openUnclippedListboxOption(page, sortTrigger, sortListbox, "Power");
    await powerOption.click();
    await expect(sortTrigger).toContainText("Power");

    await page.getByRole("tab", { name: "Imported" }).click();
    const searchbox = page.getByRole("searchbox", { name: "Search owned pets" });
    await searchbox.click();
    await searchbox.pressSequentially("Orthrus");
    await expect(searchbox).toBeFocused();
    await expect(page.getByRole("article")).toHaveCount(1);

    await page.getByRole("button", { name: /Reset owned pet search/ }).click();
    await expect(page.getByRole("article")).toHaveCount(2);

    // 3. Switch to Table view and back to Cards
    await page.getByRole("tab", { name: "Table" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.getByRole("tab", { name: "Cards" }).click();

    // 4. Open Details ModalSheet and equip Drakeling
    await page.getByRole("button", { name: /View details for Cerberus/ }).click();
    const detailDialog = page.getByRole("dialog", { name: "Cerberus" });
    await expect(detailDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(detailDialog).toBeHidden();

    await page.getByRole("button", { name: /Set Drakeling as active pet/ }).click();
    await expect(page.getByRole("button", { name: /Drakeling is already the active pet/ })).toBeVisible();

    // 5. Switch to Missing Pets tab
    await page.getByRole("tab", { name: /Missing Pets/ }).click();
    await expect(page.getByRole("region", { name: "Unowned catalog pets" }).or(page.getByLabel("Missing pets from your collection"))).toBeVisible();

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
