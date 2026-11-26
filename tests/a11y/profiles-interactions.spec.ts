import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("profiles interactive & visual checks", () => {
  test("exercises all 8 profile sections, pickers, segmented controls, and modals cleanly", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await seedPopulatedProfile(page.context(), {
      profileName: "Zenith Main",
      className: "Shadowblade",
    });

    const isMobile = /mobile/i.test(testInfo.project.name);
    await page.route(/https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js.*/, async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          window.turnstile = {
            render: function(container, options) {
              var node = document.createElement("div");
              node.setAttribute("data-testid", "mock-turnstile");
              node.textContent = "Test safety check";
              container.appendChild(node);
              setTimeout(function() {
                if (options && typeof options.callback === "function") options.callback("test-token");
              }, 0);
              return "test-widget";
            },
            reset: function() {},
            remove: function() {}
          };
        `,
      });
    });
    const monitors = await attachRuntimeMonitors(page);

    await page.goto("/profiles", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: "Profiles" }).waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#profile-identity").waitFor({ state: "visible", timeout: 15000 });
    await page.waitForLoadState("networkidle").catch(() => {});

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");

    if (isMobile) {
      const smallTargets = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll<HTMLElement>("main a, main button"));
        return els
          .filter((el) => getComputedStyle(el).pointerEvents !== "none")
          .map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              role: el.getAttribute("role"),
              text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40),
              w: Math.round(rect.width),
              h: Math.round(rect.height),
            };
          })
          .filter((item) => item.w > 0 && item.h > 0 && (item.w < 44 || item.h < 44));
      });
      expect(smallTargets, "Mobile interactive targets under 44x44px").toEqual([]);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `verify_profiles_identity_${isMobile ? "375" : "1440"}.png`),
      fullPage: false,
    });

    // Open Class modal picker, search, verify Cursed matches, close with Escape
    const classTrigger = page.getByRole("button", { name: /^Class:/i });
    await classTrigger.click();
    const pickerDialog = page.getByRole("dialog", { name: "Choose Class" });
    await expect(pickerDialog).toBeVisible();
    await pickerDialog.getByRole("textbox", { name: "Search class" }).fill("Cursed");
    await expect(pickerDialog.getByRole("button", { name: /Cursed/i })).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `verify_profiles_picker_${isMobile ? "375" : "1440"}.png`),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await expect(pickerDialog).toHaveCount(0);

    // Add second profile (starts as Alt), switch its slot to Main, then test Delete Confirmation ModalSheet
    await page.getByRole("button", { name: "Add profile" }).click();
    await expect(page.getByRole("tab", { name: "Alt" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Main" }).click();
    await expect(page.getByRole("tab", { name: "Main" })).toHaveAttribute("aria-selected", "true");

    const deleteBtn = page.getByRole("button", { name: /Delete active profile/i });
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Traverse remaining 7 sections cleanly
    const nav = page.getByRole("navigation", { name: "Profile sections" });

    await nav.getByRole("link", { name: "Levels" }).click();
    await expect(page.locator("#profile-levels")).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `verify_profiles_levels_${isMobile ? "375" : "1440"}.png`),
      fullPage: false,
    });

    await nav.getByRole("link", { name: "Combat" }).click();
    await expect(page.locator("#profile-combat")).toBeVisible();
    await expect(page.getByLabel("Calculated combat stats")).toBeVisible();

    await nav.getByRole("link", { name: "Magic" }).click();
    await expect(page.locator("#profile-magic")).toBeVisible();
    await page.getByRole("button", { name: /^Conquest Buff:/i }).click();
    const conquestDialog = page.getByRole("dialog", { name: "Choose Conquest Buff" });
    await expect(conquestDialog).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `verify_profiles_conquest_${isMobile ? "375" : "1440"}.png`),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await expect(conquestDialog).toHaveCount(0);

    await nav.getByRole("link", { name: "Pet" }).click();
    await expect(page.locator("#profile-pet")).toBeVisible();
    await page.getByRole("heading", { level: 2, name: "Pet" }).waitFor({ state: "visible" });

    await nav.getByRole("link", { name: "Gear" }).click();
    await expect(page.locator("#profile-gear")).toBeVisible();
    await page.getByRole("tab", { name: "Dual Daggers" }).click();
    await expect(page.getByRole("tab", { name: "Dual Daggers" })).toHaveAttribute("aria-selected", "true");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `verify_profiles_gear_${isMobile ? "375" : "1440"}.png`),
      fullPage: false,
    });
    await assertAxeClean(page, testInfo, "serious");

    await nav.getByRole("link", { name: "Housing" }).click();
    await expect(page.locator("#profile-housing")).toBeVisible();

    await nav.getByRole("link", { name: "Import" }).click();
    await expect(page.locator("#profile-transfer")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `verify_profiles_import_${isMobile ? "375" : "1440"}.png`),
      fullPage: false,
    });

    await assertNoHorizontalOverflow(page);
    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
  });
});
