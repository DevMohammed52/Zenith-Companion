import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("/bis interactive verification", () => {
  test("desktop exercises Gear Table, equip toggle without duplicates, Compare Modal without overflow, ItemModal market link, Next Upgrades, and What-If Drawer", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context(), { className: "Warrior" });

    await page.context().addInitScript(() => {
      try {
        const raw = window.localStorage.getItem("zenith_character_profiles_v1");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.profiles) && parsed.profiles[0]) {
          parsed.profiles[0].gear = {
            ...(parsed.profiles[0].gear || {}),
            weapon: "Grimslayer",
            shield: "Aegis of the Seraph",
            chestplate: "Bloodforged Harness",
          };
          parsed.profiles[0].gearTiers = {
            ...(parsed.profiles[0].gearTiers || {}),
            weapon: 4,
            shield: 1,
            chestplate: 2,
          };
          window.localStorage.setItem("zenith_character_profiles_v1", JSON.stringify(parsed));
        }
      } catch {
        // Ignore storage seed error
      }
    });

    const monitors = await attachRuntimeMonitors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/bis", { waitUntil: "domcontentloaded" });

    await page.getByRole("tablist", { name: "Gear planner sections" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await expect(page.getByRole("heading", { level: 1, name: "Best-in-Slot Gear" })).toBeVisible();
    await expect(page.getByText(/3\/7 equipped/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("row", { name: /Excalibur/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("columnheader", { name: "Crit %" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Crit Dmg" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Zero inline Ctrl K hints, zero middots, zero jargon ("Delta" / "Weighted Score")
    const mainEl = page.locator("main");
    await expect(mainEl).not.toContainText("Ctrl K");
    await expect(mainEl).not.toContainText("·");
    await expect(mainEl).not.toContainText("Weighted Score");
    await expect(mainEl).not.toContainText("Delta");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_bis_table_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Switch to Max Tier on Gear Table -> click Bloodthirst row to open Compare Modal
    await page.getByRole("tab", { name: "Max Tier" }).click();
    await page.getByRole("row", { name: /Bloodthirst/i }).click();
    const modal = page.getByRole("dialog", { name: "Bloodthirst" });
    await expect(modal).toBeVisible();
    await expect(modal.getByText("27x Dragon Soulstone")).toBeVisible();
    await expect(modal.getByRole("columnheader", { name: "Gain" })).toBeVisible();

    // Verify compare table fits inside modal with zero horizontal overflow
    const tableOverflow = await modal.evaluate((el) => {
      const wrap = el.querySelector("[class*='statTableWrap']");
      return wrap ? wrap.scrollWidth - wrap.clientWidth : 0;
    });
    expect(tableOverflow).toBeLessThanOrEqual(1);

    // Equip Bloodthirst from Compare Modal -> button flips to Equipped (Unequip), preventing duplicate equip
    await modal.getByRole("button", { name: "Equip to Profile" }).click();
    await expect(modal.getByRole("button", { name: /Equipped \(Unequip\)/i })).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_bis_modal_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Open Item Details from Compare Modal and verify Buy on Market external IdleMMO link
    await modal.getByRole("button", { name: "Item Details" }).click();
    const itemModal = page.getByRole("dialog", { name: /Bloodthirst/i });
    const marketLink = itemModal.getByRole("link", { name: /Buy on Market/i });
    await expect(marketLink).toHaveAttribute(
      "href",
      "https://web.idle-mmo.com/item/inspect/1rZXlwg5YvDGQk9joDmG",
    );
    await page.keyboard.press("Escape");

    // Switch to Next Upgrades tab (shows max 7 clean per-slot rows; no Style Compare tab)
    await expect(page.getByRole("tab", { name: "Style Compare" })).toHaveCount(0);
    await page.getByRole("tab", { name: /Next Upgrades/i }).click();
    await expect(page).toHaveURL(/tab=upgrades/);
    await expect(page.getByRole("listitem")).toHaveCount(7);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_bis_upgrades_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Open Loadout Setup drawer -> switch temporarily to Dual Daggers -> Reset to Profile
    await page.getByRole("button", { name: /Loadout Setup/i }).click();
    const drawer = page.getByRole("dialog", { name: /Loadout & What-If Setup/i });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Dual Daggers" }).click();
    await expect(page.getByText("What-If Active")).toBeVisible();
    await drawer.getByRole("button", { name: /Reset to Profile/i }).click();
    await drawer.getByRole("button", { name: "Done", exact: true }).click();
    await expect(drawer).toBeHidden();

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);

    // Tablet 1024px check
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.getByRole("tab", { name: "Gear Table" }).click();
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_bis_tablet_1024.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
  });

  test("mobile 375px and 320px render clean slot cards, compare sheet, and unclipped drawer without overflow", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await seedPopulatedProfile(page.context(), { className: "Shadowblade" });
    const monitors = await attachRuntimeMonitors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/bis", { waitUntil: "domcontentloaded" });
    await page.getByRole("tablist", { name: "Gear planner sections" }).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_bis_mobile_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    // Tap Excalibur mobile card -> open Compare modal (must show No market listings, never Vendor sell)
    await page.getByRole("button", { name: /Excalibur/i }).first().click();
    const mobileModal = page.getByRole("dialog", { name: "Excalibur" });
    await expect(mobileModal).toBeVisible();
    await expect(mobileModal).not.toContainText("Vendor sell");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_bis_modal_375.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });
    await page.keyboard.press("Escape");

    // 320px narrow check + Loadout Drawer footer bounds check
    await page.setViewportSize({ width: 320, height: 720 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);

    await page.getByRole("button", { name: /Loadout Setup/i }).click();
    const drawer = page.getByRole("dialog", { name: /Loadout & What-If Setup/i });
    await expect(drawer).toBeVisible();
    await page.waitForTimeout(320);
    const doneBtn = drawer.getByRole("button", { name: "Done", exact: true });
    const box = await doneBtn.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_bis_drawer_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 15000,
    });

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
