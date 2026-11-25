import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const ARTIFACT_DIR = "C:\\Users\\msi\\.gemini\\antigravity\\brain\\3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("shell chrome and primitives interactive verification", () => {
  test("verifies desktop & mobile navigation chrome, overlays, touch targets, a11y, and primitives", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await seedPopulatedProfile(page.context());

    const isMobileProject = testInfo.project.name.includes("mobile");
    const monitors = await attachRuntimeMonitors(page);

    if (!isMobileProject) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.getByRole("navigation", { name: /Primary|Main/i }).or(page.locator("#app-sidebar")).waitFor({
        state: "visible",
        timeout: 15_000,
      });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible", timeout: 15_000 });
      await page.waitForTimeout(300);

      await assertNoHorizontalOverflow(page);

      // Capture expanded desktop shell chrome
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "shell_desktop_expanded_1440.png"),
        fullPage: false,
      });

      // Toggle Sidebar rail mode and capture
      const collapseBtn = page.getByRole("button", { name: /Collapse sidebar/i });
      await expect(collapseBtn).toBeVisible();
      await collapseBtn.click();
      const expandBtn = page.getByRole("button", { name: "Expand sidebar" });
      await expect(expandBtn).toBeVisible();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "shell_desktop_rail_1440.png"),
        fullPage: false,
      });
      await expandBtn.click();
      await expect(collapseBtn).toBeVisible();

      // Open ProfileSwitcher & DataFreshnessIndicator cleanly
      const profileBtn = page.getByRole("button", { name: /Switch active profile/i });
      await profileBtn.click();
      await expect(page.getByRole("radiogroup", { name: "Character profiles" })).toBeVisible();
      await page.keyboard.press("Escape");

      const freshnessBtn = page.getByRole("button", { name: /Data freshness:/i });
      await freshnessBtn.click();
      await expect(page.getByRole("link", { name: "Settings" }).last()).toBeVisible();
      await page.keyboard.press("Escape");

      // Open GlobalSearch palette and verify ui EmptyState on no-results query
      await page.getByRole("button", { name: "Open global search" }).click();
      const searchDialog = page.getByRole("dialog", { name: "Global search" });
      await expect(searchDialog).toBeVisible();
      const combobox = searchDialog.getByRole("combobox");
      await combobox.fill("zzzx_no_match_999");
      await expect(searchDialog.getByText("No matches found")).toBeVisible();
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "shell_desktop_search_empty_1440.png"),
        fullPage: false,
      });
      await page.keyboard.press("Escape");
      await expect(searchDialog).toHaveCount(0);

      await assertAxeClean(page, testInfo, "serious");

      // Check /ui-preview primitives visual state & axe cleanly
      await page.goto("/ui-preview", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "primitives_preview_1440.png"),
        fullPage: false,
      });
      await assertAxeClean(page, testInfo, "serious");
      await monitors.assertHealthy();
      return;
    }

    // Mobile project (375x812): verify Home shell CLS <= 0.1, footer targets >= 44px, drawer, & axe
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("nav[aria-label='Mobile primary navigation']").waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertNoHorizontalOverflow(page);

    const footerBoxHeights = await page.locator("footer a, footer button").evaluateAll((els) =>
      els.filter((el) => (el as HTMLElement).offsetParent !== null).map((el) => Math.round(el.getBoundingClientRect().height)),
    );
    for (const h of footerBoxHeights) {
      expect(h).toBeGreaterThanOrEqual(44);
    }

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy();

    // Verify /alchemy mobile dock labels & touch targets cleanly
    await page.goto("/alchemy", { waitUntil: "domcontentloaded" });
    await page.locator("nav[aria-label='Mobile primary navigation']").waitFor({ state: "visible", timeout: 15_000 });
    await assertNoHorizontalOverflow(page);

    const dockNav = page.locator("nav[aria-label='Mobile primary navigation']");
    await expect(dockNav.getByText("Home")).toBeVisible();
    await expect(dockNav.getByText("Menu")).toBeVisible();
    const alchemyDockLink = dockNav.getByRole("link", { name: /Alchemy/i });
    if (await alchemyDockLink.count()) {
      await expect(alchemyDockLink.first()).toContainText("Alchemy");
    }

    const dockRects = await dockNav.locator("a, button").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { label: el.textContent?.trim(), width: Math.round(r.width), height: Math.round(r.height) };
      }),
    );
    for (const item of dockRects) {
      expect(item.height, `Dock target ${item.label} height`).toBeGreaterThanOrEqual(44);
      expect(item.width, `Dock target ${item.label} width`).toBeGreaterThanOrEqual(44);
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "shell_mobile_dock_alchemy_375.png"),
      fullPage: false,
    });

    await page.locator("#app-mobile-menu-button").click();
    const sidebar = page.locator("#app-sidebar");
    await expect(sidebar).toBeVisible();
    const closeBtnBox = await page.getByRole("button", { name: "Close navigation menu" }).first().boundingBox();
    expect(closeBtnBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(closeBtnBox?.width ?? 0).toBeGreaterThanOrEqual(44);

    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "shell_mobile_drawer_375.png"),
      fullPage: false,
    });

    await page.keyboard.press("Escape");
    await expect(page.locator("#app-mobile-menu-button")).toBeVisible();
  });
});
