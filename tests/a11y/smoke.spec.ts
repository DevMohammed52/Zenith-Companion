import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  { path: "/", name: "Dashboard" },
  { path: "/items", name: "Item Database" },
  { path: "/profiles#profile-transfer", name: "Profile Import" },
  { path: "/settings", name: "Settings" },
];

const impactOrder = ["minor", "moderate", "serious", "critical"] as const;
const failImpact = process.env.A11Y_FAIL_IMPACT || "critical";
const failIndex = impactOrder.indexOf(failImpact as typeof impactOrder[number]);
const turnstileScriptPattern = /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js.*/;

test.describe("accessibility smoke audit", () => {
  for (const route of routes) {
    test(`${route.name} has no ${failImpact}+ axe violations`, async ({ page }, testInfo) => {
      await page.route(turnstileScriptPattern, async (turnstileRoute) => {
        await turnstileRoute.fulfill({
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

      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const violations = results.violations.filter((violation) => {
        const impact = violation.impact || "minor";
        const index = impactOrder.indexOf(impact as typeof impactOrder[number]);
        return index >= Math.max(0, failIndex);
      });

      await testInfo.attach("axe-summary", {
        body: JSON.stringify(results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          nodes: violation.nodes.length,
        })), null, 2),
        contentType: "application/json",
      });

      expect(violations).toEqual([]);
    });
  }
});
