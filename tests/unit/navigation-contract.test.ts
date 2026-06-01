import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { NAV_GROUPS, getActiveNavGroup, isNavItemActive } from "@/lib/navigation";

const navItems = NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ group, item })));

function routePagePath(href: string) {
  if (href === "/") return path.join(process.cwd(), "src", "app", "page.tsx");
  return path.join(process.cwd(), "src", "app", ...href.replace(/^\//, "").split("/"), "page.tsx");
}

describe("navigation contract", () => {
  it("keeps every public navigation route backed by an app page", () => {
    for (const { item } of navItems) {
      expect(existsSync(routePagePath(item.href)), `${item.href} is missing a matching src/app page`).toBe(true);
    }
  });

  it("keeps public navigation hrefs and labels unique", () => {
    const hrefs = navItems.map(({ item }) => item.href);
    const labels = navItems.map(({ item }) => item.label);

    expect(new Set(hrefs).size, "Duplicate nav hrefs make active-state and route tests ambiguous").toBe(hrefs.length);
    expect(new Set(labels).size, "Duplicate nav labels make command/search tests ambiguous").toBe(labels.length);
  });

  it("matches exact and prefix-active routes predictably", () => {
    const itemsRoute = navItems.find(({ item }) => item.href === "/items")?.item;
    const settingsRoute = navItems.find(({ item }) => item.href === "/settings")?.item;

    expect(itemsRoute).toBeDefined();
    expect(settingsRoute).toBeDefined();
    expect(isNavItemActive("/items/abc123", itemsRoute!)).toBe(true);
    expect(isNavItemActive("/settings/privacy", settingsRoute!)).toBe(false);
    expect(getActiveNavGroup("/alchemy/mythic")?.label).toBe("Planning Tools");
  });
});
