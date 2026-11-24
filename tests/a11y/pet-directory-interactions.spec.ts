import { expect, test } from "@playwright/test";

test.describe("pet directory interactive checks", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem("zenith_disable_analytics", "true");
      window.localStorage.setItem("zenith.firstRunSetup.dismissed.v1", new Date().toISOString());
    });
  });

  test("simulator steppers increment, dropdown opens unclipped above cards, and pagination is centered", async ({
    page,
  }, testInfo) => {
    const isMobile = /mobile/i.test(testInfo.project.name);
    await page.goto("/pets", { waitUntil: "domcontentloaded" });

    // Wait for pet catalog cards to load
    await expect(page.locator("button[aria-label^='Open details for']").first()).toBeVisible({
      timeout: 15000,
    });

    // 1. Open Pet Simulator Setup accordion and click + on Evolution Stage
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
    await evoFocusTrigger.click();
    const listbox = page.getByRole("listbox", { name: "Evolution Focus" });
    await expect(listbox).toBeVisible();

    const agiOption = listbox.getByRole("option", { name: "Agility" });
    const box = await agiOption.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(40);

    // Ensure the option point hits the option itself rather than an underlying card
    const hitInsideOption = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return Boolean(el && el.closest("[role='listbox']"));
      },
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
    );
    expect(hitInsideOption).toBe(true);
    await agiOption.click();
    await expect(evoFocusTrigger).toContainText("Agility");

    // 3. Switch to Table view and confirm avatar + name spacing and no mobile document overflow
    await page.getByRole("tab", { name: "Table" }).click();
    const table = page.locator("table");
    await expect(table).toBeVisible();

    const layoutCheck = await page.evaluate(() => {
      const firstRow = document.querySelector("table tbody tr");
      const cellWrap = firstRow?.querySelector("td:first-child > div");
      const avatarEl = cellWrap?.children[0] as HTMLElement | undefined;
      const nameSpan = cellWrap?.children[1] as HTMLElement | undefined;
      const avatarRect = avatarEl?.getBoundingClientRect();
      const nameRect = nameSpan?.getBoundingClientRect();
      return {
        docOverflow: document.documentElement.scrollWidth > window.innerWidth,
        avatarClearsName: avatarRect && nameRect ? avatarRect.right <= nameRect.left - 4 : false,
      };
    });
    expect(layoutCheck.docOverflow).toBe(false);
    expect(layoutCheck.avatarClearsName).toBe(true);

    // 4. Verify summary-free pagination controls are centered horizontally inside <nav>
    if (!isMobile) {
      await page.getByRole("tab", { name: "Cards" }).click();
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

    // 5. Switch back to Cards on mobile and open pet modal, confirming Escape dismisses cleanly
    await page.getByRole("tab", { name: "Cards" }).click();
    const firstPetBtn = page.locator("button[aria-label^='Open details for']").first();
    await expect(firstPetBtn).toBeVisible({ timeout: 15000 });
    await firstPetBtn.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
