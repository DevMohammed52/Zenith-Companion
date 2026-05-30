import { expect, type Page, test } from "@playwright/test";

const routes = [
  { path: "/items", name: "Item Database" },
  { path: "/pets", name: "Pet Database" },
  { path: "/skill-profit", name: "Skill Profit" },
  { path: "/settings", name: "Settings" },
];

const minTargetSize = 40;

type TargetIssue = {
  className: string;
  display: string;
  height: number;
  label: string;
  path: string;
  tag: string;
  width: number;
};

async function collectTargetIssues(page: Page) {
  const scrollPositions = await page.evaluate(() => {
    const scrollable = document.scrollingElement || document.documentElement;
    const maxScroll = Math.max(0, scrollable.scrollHeight - window.innerHeight);
    return Array.from(new Set([0, Math.round(maxScroll * 0.33), Math.round(maxScroll * 0.66), maxScroll]));
  });

  const issues = new Map<string, TargetIssue>();

  for (const position of scrollPositions) {
    await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), position);
    await page.waitForTimeout(100);

    const visibleIssues = await page.evaluate((minimum) => {
      const targetSelector = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[role="button"]:not([aria-disabled="true"])',
        '[role="tab"]:not([aria-disabled="true"])',
        '[role="option"]:not([aria-disabled="true"])',
        '[role="menuitem"]:not([aria-disabled="true"])',
      ].join(",");

      const getPath = (element: Element) => {
        const segments: string[] = [];
        let current: Element | null = element;

        while (current && current !== document.body && segments.length < 5) {
          const tag = current.tagName.toLowerCase();
          const id = current.id ? `#${current.id}` : "";
          const className = typeof current.className === "string"
            ? current.className
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 3)
                .map((value) => `.${value}`)
                .join("")
            : "";
          segments.unshift(`${tag}${id}${className}`);
          current = current.parentElement;
        }

        return segments.join(" > ");
      };

      const seen = new Set<Element>();
      const elements = Array.from(document.querySelectorAll<HTMLElement>(targetSelector));

      return elements.flatMap((element) => {
        if (seen.has(element) || element.closest("[hidden], [aria-hidden='true'], [data-target-size-exempt='true']")) {
          return [];
        }
        seen.add(element);

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.bottom < 0 ||
          rect.right < 0 ||
          rect.top > window.innerHeight ||
          rect.left > window.innerWidth ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.pointerEvents === "none"
        ) {
          return [];
        }

        if (element instanceof HTMLAnchorElement && style.display === "inline") {
          return [];
        }

        const requiresSquareTarget = element.matches(
          "button, [role='button'], [role='tab'], [role='option'], [role='menuitem']",
        );
        const tooShort = rect.height < minimum;
        const tooNarrow = requiresSquareTarget && rect.width < minimum;

        if (!tooShort && !tooNarrow) {
          return [];
        }

        const label =
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          element.textContent ||
          element.getAttribute("href") ||
          element.tagName.toLowerCase();

        return [{
          className: typeof element.className === "string" ? element.className : "",
          display: style.display,
          height: Math.round(rect.height * 10) / 10,
          label: label.trim().replace(/\s+/g, " ").slice(0, 90),
          path: getPath(element),
          tag: element.tagName.toLowerCase(),
          width: Math.round(rect.width * 10) / 10,
        }];
      });
    }, minTargetSize);

    for (const issue of visibleIssues) {
      issues.set(`${issue.path}|${issue.label}|${issue.width}x${issue.height}`, issue);
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));

  return Array.from(issues.values());
}

test.describe("mobile target-size audit", () => {
  for (const route of routes) {
    test(`${route.name} visible controls keep touch-friendly targets`, async ({ page }, testInfo) => {
      test.skip(!/mobile/i.test(testInfo.project.name), "Touch target audit runs in the mobile project.");

      await page.addInitScript(() => {
        window.localStorage.setItem("zenith_disable_analytics", "true");
      });

      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      const issues = await collectTargetIssues(page);

      await testInfo.attach("target-size-issues", {
        body: JSON.stringify(issues, null, 2),
        contentType: "application/json",
      });

      expect(issues).toEqual([]);
    });
  }
});
