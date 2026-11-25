import { expect, test } from "@playwright/test";
import {
  assertAxeClean,
  assertNoHorizontalOverflow,
  attachRuntimeMonitors,
  openUnclippedListboxOption,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("pet comparison interactive checks", () => {
  test.beforeEach(async ({ context }) => {
    await seedPopulatedProfile(context);
  });

  test("picks pets via modal, adjusts setup steppers and dropdowns, renders metrics table, and keeps CLS/a11y clean", async ({
    page,
  }, testInfo) => {
    const monitors = await attachRuntimeMonitors(page);

    await page.goto("/pets/compare", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Compare Pets" })).toBeVisible({ timeout: 15000 });

    // 1. Verify Empty state initially when no pets selected
    await expect(page.getByRole("heading", { name: "Pick pets to compare" })).toBeVisible();

    // 2. Open Slot 1 picker ModalSheet, search for Orthrus, and select it
    await page.getByRole("button", { name: /Choose pet for comparison slot 1/ }).click();
    const pickerDialog = page.getByRole("dialog", { name: /Choose Pet for Slot 1/ });
    await expect(pickerDialog).toBeVisible();
    const searchbox = pickerDialog.getByRole("searchbox");
    await searchbox.click();
    await searchbox.pressSequentially("Orthrus");
    await expect(searchbox).toBeFocused();
    await pickerDialog.getByRole("option").first().click();
    await expect(pickerDialog).toBeHidden();

    // 3. Add active profile's pet or quick pick as second comparison entry
    const quickPick = page.getByRole("button", { name: /Highest power/ });
    await quickPick.click();

    // 4. Verify comparison cards + Side-by-Side Metrics table render cleanly
    await expect(page.getByRole("region", { name: "Side-by-side pet comparison metrics" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 5. Open Setup Controls on mobile if collapsed, click + on Evolution Stage, open Evolution Focus Select
    const setupTrigger = page.locator("button[aria-controls='compare-setup-accordion']");
    const expanded = await setupTrigger.getAttribute("aria-expanded");
    if (expanded !== "true") {
      await setupTrigger.click();
      await expect(setupTrigger).toHaveAttribute("aria-expanded", "true");
    }

    await page.getByRole("button", { name: "Increase Evolution Stage" }).click();
    const evoSelectTrigger = page.getByRole("combobox", { name: "Evolution Focus" });
    const evoListbox = page.getByRole("listbox", { name: "Evolution Focus" });
    const agiOption = await openUnclippedListboxOption(page, evoSelectTrigger, evoListbox, "Agility");
    await agiOption.click();
    await expect(evoSelectTrigger).toContainText("Agility");

    // 6. Verify serious+ a11y, zero console/page errors, and CLS <= 0.1
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
