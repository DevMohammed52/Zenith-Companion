import { expect, type BrowserContext, type Page, test } from "@playwright/test";

import { NAV_GROUPS } from "../../src/lib/navigation";

const defaultPort = Number(process.env.PLAYWRIGHT_PROD_PORT || 3219);
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${defaultPort}`;
const sameOrigin = new URL(configuredBaseURL).origin;

const publicRoutes = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    group: group.label,
    href: item.href,
    label: item.label,
  })),
);

async function seedProductionState(context: BrowserContext) {
  await context.addInitScript(() => {
    window.localStorage.setItem("zenith_disable_analytics", "true");
    window.localStorage.setItem("zenith.firstRunSetup.dismissed.v1", new Date().toISOString());
    window.localStorage.setItem("zenith.tips.snoozedUntil.v1", String(Date.now() + 24 * 60 * 60 * 1000));
    window.localStorage.setItem("zenith.tips.seenPages.v1", JSON.stringify(["/"]));
    window.localStorage.setItem("zenith.localBackupReminder.lastShown.v1", String(Date.now()));
    window.localStorage.setItem(
      "zenith_preferences",
      JSON.stringify({
        ambientMusic: false,
        desktopNavigationStyle: "dock",
        inAppNotifications: false,
        notificationSounds: false,
        soundEffects: false,
        theme: "ember",
      }),
    );
  });
}

function installPageFailureCollectors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("The resource") && text.includes("was preloaded using link preload")) return;
    consoleErrors.push(text);
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const resourceType = request.resourceType();
    if (!["document", "script", "stylesheet", "fetch", "xhr"].includes(resourceType)) return;

    try {
      if (new URL(request.url()).origin !== sameOrigin) return;
    } catch {
      return;
    }

    failedRequests.push(`${resourceType.toUpperCase()} ${request.url()} - ${request.failure()?.errorText ?? "failed"}`);
  });

  return { consoleErrors, failedRequests, pageErrors };
}

async function getHorizontalOverflowReport(page: Page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

    if (pageWidth <= viewportWidth + 2) {
      return {
        ok: true,
        pageWidth,
        viewportWidth,
        offenders: [],
      };
    }

    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (rect.width === 0 || rect.height === 0 || style.visibility === "hidden" || style.display === "none") {
          return null;
        }
        if (rect.right <= viewportWidth + 2 && rect.left >= -2) return null;

        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === "string" ? element.className.slice(0, 120) : null,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    return {
      ok: false,
      pageWidth,
      viewportWidth,
      offenders,
    };
  });
}

test.describe("production public routes", () => {
  test.beforeEach(async ({ context }) => {
    await seedProductionState(context);
  });

  for (const route of publicRoutes) {
    test(`${route.group} / ${route.label} renders cleanly`, async ({ page }) => {
      const failures = installPageFailureCollectors(page);
      const response = await page.goto(route.href, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${route.href} should return an OK document response`).toBe(200);
      await expect(page.locator("main").first(), `${route.href} should expose a visible main landmark`).toBeVisible();
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);

      const overflowReport = await getHorizontalOverflowReport(page);
      expect(overflowReport.ok, `${route.href} should not create body-level horizontal overflow:\n${JSON.stringify(overflowReport, null, 2)}`).toBe(true);
      expect(failures.pageErrors, `${route.href} should not throw browser page errors`).toEqual([]);
      expect(failures.consoleErrors, `${route.href} should not write console errors`).toEqual([]);
      expect(failures.failedRequests, `${route.href} should not fail same-origin document/script/style/fetch requests`).toEqual([]);
    });
  }
});
