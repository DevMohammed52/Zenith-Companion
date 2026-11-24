import { expect, test } from "@playwright/test";
import {
  assertAxeClean,
  assertNoHorizontalOverflow,
  attachRuntimeMonitors,
  openUnclippedListboxOption,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

test.describe("pet directory interactive checks", () => {
  test.beforeEach(async ({ context }) => {
    await seedPopulatedProfile(context);
  });

  test("populated simulator steppers increment, dropdown opens unclipped, table clears avatars, pagination centers, and CLS/a11y stay clean", async ({
    page,
  }, testInfo) => {
    const isMobile = /mobile/i.test(testInfo.project.name);
    const monitors = await attachRuntimeMonitors(page);

    await page.goto("/pets", { waitUntil: "domcontentloaded" });

    // Wait for populated pet catalog cards and seeded owned count pill
    await expect(page.locator("button[aria-label^='Open details for']").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/2 pets \(2 species\)/)).toBeVisible();

    // 1. Open Pet Simulator Setup accordion and click + / - on Evolution Stage
    const accordionTrigger = page.locator("button[aria-controls='pet-setup-accordion']");
    await accordionTrigger.click();
    await expect(accordionTrigger).toHaveAttribute("aria-expanded", "true");

    const stepUp = page.getByRole("button", { name: "Increase Evolution Stage" });
    await stepUp.click();
    await expect(accordionTrigger).toContainText("Evo 1");

    const stepDown = page.getByRole("button", { name: "Decrease Evolution Stage" });
    await stepDown.click();
    await expect(accordionTrigger).toContainText("Evo 0");

    // 2. Open Evolution Focus dropdown and confirm it is unclipped and clickable on top
    const evoFocusTrigger = page.getByRole("combobox", { name: "Evolution Focus" });
    const listbox = page.getByRole("listbox", { name: "Evolution Focus" });
    const agiOption = await openUnclippedListboxOption(page, evoFocusTrigger, listbox, "Agility");
    await agiOption.click();
    await expect(evoFocusTrigger).toContainText("Agility");

    // 3. Switch to Table view and confirm avatar + name spacing and zero document overflow
    await page.getByRole("tab", { name: "Table" }).click();
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const avatarClearsName = await page.evaluate(() => {
      const firstRow = document.querySelector("table tbody tr");
      const cellWrap = firstRow?.querySelector("td:first-child > div");
      const avatarEl = cellWrap?.children[0] as HTMLElement | undefined;
      const nameSpan = cellWrap?.children[1] as HTMLElement | undefined;
      const avatarRect = avatarEl?.getBoundingClientRect();
      const nameRect = nameSpan?.getBoundingClientRect();
      return avatarRect && nameRect ? avatarRect.right <= nameRect.left - 4 : false;
    });
    expect(avatarClearsName).toBe(true);

    // 4. Switch back to Cards and verify summary-free pagination controls are centered on desktop
    await page.getByRole("tab", { name: "Cards" }).click();
    if (!isMobile) {
      const nav = page.getByRole("navigation", { name: "Pagination" });
      await expect(nav).toBeVisible();
      const paginationCentered = await nav.evaluate((navEl) => {
        const controls = navEl.children[0] as HTMLElement | undefined;
        if (!controls) return false;
        const navRect = navEl.getBoundingClientRect();
        const ctrlRect = controls.getBoundingClientRect();
        const navCenter = navRect.left + navRect.width / 2;
        const ctrlCenter = ctrlRect.left + ctrlRect.width / 2;
        return Math.abs(navCenter - ctrlCenter) <= 4;
      });
      expect(paginationCentered).toBe(true);
    }

    // 5. Open pet modal and confirm Escape dismisses cleanly
    const firstPetBtn = page.locator("button[aria-label^='Open details for']").first();
    await firstPetBtn.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // 6. Verify WCAG serious+ a11y, zero console/page errors, and CLS <= 0.1
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
