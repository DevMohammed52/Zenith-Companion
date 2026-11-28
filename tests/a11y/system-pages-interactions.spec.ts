import { test, expect } from "@playwright/test";
import {
  assertAxeClean,
  assertNoHorizontalOverflow,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

test.describe("System pages (404, Error, Loading) verification", () => {
  test("404 Not Found renders interactive route finder, live closest-match suggestions, item fallback search, >= 44px mobile controls, and axe checks", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.addInitScript(() => {
      try {
        const win = window as Window & { __zenithCls?: number };
        win.__zenithCls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
            if (!entry.hadRecentInput && typeof entry.value === "number") {
              win.__zenithCls = (win.__zenithCls ?? 0) + entry.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
      } catch {
        // Ignore PerformanceObserver fallback
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/alchemy-calc-missing", { waitUntil: "domcontentloaded" });

    const mainEl = page.locator("main");
    await expect(mainEl.getByRole("heading", { level: 1, name: "Page not found." })).toBeVisible({
      timeout: 15000,
    });
    await expect(mainEl.getByText("/alchemy-calc-missing")).toBeVisible();
    await expect(mainEl.getByRole("heading", { level: 2, name: "Closest matches" })).toBeVisible();
    await expect(mainEl.getByRole("link", { name: /Alchemy Profit/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.waitForTimeout(250);
    const initialCls = await page.evaluate(
      () => (window as Window & { __zenithCls?: number }).__zenithCls ?? 0,
    );
    expect(initialCls, `Initial 404 CLS exceeded budget (${initialCls})`).toBeLessThanOrEqual(0.1);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_not_found_1440.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    // Interactive search filtering
    const searchInput = mainEl.getByRole("searchbox", { name: "Search Zenith routes or IdleMMO items" });
    await searchInput.fill("magic storm");
    await expect(mainEl.getByRole("heading", { level: 2, name: /Matching routes \(1\)/ })).toBeVisible();
    await expect(mainEl.getByRole("link", { name: /Weather Guide/i })).toBeVisible();

    // Non-route item query fallback
    await searchInput.fill("Grimslayer");
    await expect(mainEl.getByRole("link", { name: /Search .*Grimslayer.* in Items/i })).toBeVisible();

    await searchInput.fill("");
    await assertAxeClean(page, testInfo, "serious");

    // Responsive check at 375px & 320px
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      await page.waitForTimeout(150);
      await assertNoHorizontalOverflow(page);
    }

    const searchBtnBox = await mainEl.getByRole("link", { name: "Dashboard", exact: true }).boundingBox();
    expect(searchBtnBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_not_found_mobile_320.png`,
      fullPage: false,
      animations: "disabled",
      timeout: 30000,
    });

    expect(pageErrors).toEqual([]);
  });

  test("Loading and Error preview routes (when enabled) render cleanly across desktop and mobile", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const loadingRes = await page.goto("/loading-preview", { waitUntil: "domcontentloaded" });
    if (process.env.ENABLE_LOADING_PREVIEW === "1" || (loadingRes && loadingRes.status() === 200)) {
      expect(loadingRes?.status()).toBe(200);
      await expect(page.locator("main [aria-busy='true']")).toBeAttached({ timeout: 10000 });
      await expect(page.getByText("Loading Zenith Companion...")).toBeAttached();
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/verify_loading_1440.png`,
        fullPage: false,
        animations: "disabled",
        timeout: 30000,
      });
      await assertAxeClean(page, testInfo, "serious");

      await page.setViewportSize({ width: 320, height: 812 });
      await page.waitForTimeout(150);
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/verify_loading_mobile_320.png`,
        fullPage: false,
        animations: "disabled",
        timeout: 30000,
      });
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    const errRes = await page.goto("/error-preview", { waitUntil: "domcontentloaded" });
    const hasTryAgain = await page
      .getByRole("button", { name: "Try again" })
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (process.env.ENABLE_ERROR_PREVIEW === "1" || (errRes && errRes.status() !== 404 && hasTryAgain)) {
      await expect(page.getByRole("button", { name: "Try again" })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/could not finish loading/i);
      await assertNoHorizontalOverflow(page);

      await page.getByRole("button", { name: /Troubleshooting and local recovery/i }).click();
      await expect(page.getByRole("button", { name: "Clear transient cache" })).toBeVisible();
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/verify_error_1440.png`,
        fullPage: false,
        animations: "disabled",
        timeout: 30000,
      });
      await assertAxeClean(page, testInfo, "serious");

      await page.setViewportSize({ width: 320, height: 812 });
      await page.waitForTimeout(150);
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/verify_error_mobile_320.png`,
        fullPage: false,
        animations: "disabled",
        timeout: 30000,
      });
    }
  });
});
