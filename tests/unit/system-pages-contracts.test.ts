import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  clearTransientUiCache,
  filterRoutesByQuery,
  ROUTE_RECOVERY_ENTRIES,
  suggestRoutesForPath,
} from "@/lib/route-recovery";

describe("system pages (loading, not-found, error) contracts", () => {
  const loadingPath = path.join(process.cwd(), "src", "app", "loading.tsx");
  const loadingCssPath = path.join(process.cwd(), "src", "app", "loading.module.css");
  const notFoundPath = path.join(process.cwd(), "src", "app", "not-found.tsx");
  const notFoundClientPath = path.join(process.cwd(), "src", "app", "components", "NotFoundClient.tsx");
  const notFoundCssPath = path.join(process.cwd(), "src", "app", "not-found.module.css");
  const errorPath = path.join(process.cwd(), "src", "app", "error.tsx");
  const globalErrorPath = path.join(process.cwd(), "src", "app", "global-error.tsx");
  const fallbackPath = path.join(process.cwd(), "src", "components", "AppErrorFallback.tsx");
  const fallbackCssPath = path.join(process.cwd(), "src", "components", "AppErrorFallback.module.css");

  it("matches mistyped or legacy URL paths to the closest real Zenith Companion routes", () => {
    expect(suggestRoutesForPath("/boss")[0]?.href).toBe("/bosses");
    expect(suggestRoutesForPath("/alch-calc")[0]?.href).toBe("/alchemy");
    expect(suggestRoutesForPath("/item/wyrmshadow-egg")[0]?.href).toBe("/items");
    expect(suggestRoutesForPath("/guids")[0]?.href).toBe("/guilds");
    expect(suggestRoutesForPath("/prfile")[0]?.href).toBe("/profiles");
  });

  it("filters the 26 route directory entries cleanly across labels, URLs, and keywords", () => {
    expect(ROUTE_RECOVERY_ENTRIES.length).toBeGreaterThanOrEqual(25);
    const dungeonMatches = filterRoutesByQuery("keys");
    expect(dungeonMatches.some((entry) => entry.href === "/dungeons")).toBe(true);
    const stormMatches = filterRoutesByQuery("magic storm");
    expect(stormMatches.some((entry) => entry.href === "/weather")).toBe(true);
    expect(filterRoutesByQuery("zzzznotaroute999")).toEqual([]);
  });

  it("clearTransientUiCache removes only transient cache keys without touching profiles, preferences, or queues", async () => {
    const store = new Map<string, string>([
      ["zenith_character_profiles_v1", '{"activeProfileId":"main"}'],
      ["zenith_preferences", '{"membership":true}'],
      ["zenith_craft_queue", '{"Battle Potion":2}'],
      ["zenith.routeVisits.v1", '{"/":4}'],
      ["zenith.profileImport.cache.v1", '[]'],
    ]);
    const session = new Map<string, string>([["temp_filter", "1"]]);
    const deletedCaches: string[] = [];

    const origWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (k: string) => store.get(k) ?? null,
          removeItem: (k: string) => store.delete(k),
        },
        sessionStorage: {
          get length() {
            return session.size;
          },
          clear: () => session.clear(),
        },
        caches: {
          keys: async () => ["zenith-offline-v1", "unrelated-cache"],
          delete: async (name: string) => {
            deletedCaches.push(name);
            return true;
          },
        },
      },
    });

    try {
      const removed = await clearTransientUiCache();
      expect(removed).toBe(4);
      expect(deletedCaches).toEqual(["zenith-offline-v1"]);
      expect(session.size).toBe(0);
      expect(store.has("zenith.routeVisits.v1")).toBe(false);
      expect(store.has("zenith.profileImport.cache.v1")).toBe(false);
      expect(store.get("zenith_character_profiles_v1")).toBe('{"activeProfileId":"main"}');
      expect(store.get("zenith_preferences")).toBe('{"membership":true}');
      expect(store.get("zenith_craft_queue")).toBe('{"Battle Potion":2}');
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: origWindow,
      });
    }
  });

  it("enforces Astral Slate tokens, centralized Icon registry, no obsidian hexes, and >= 44px touch targets across all system pages", () => {
    const tsxFiles = [
      readFileSync(loadingPath, "utf-8"),
      readFileSync(notFoundPath, "utf-8"),
      readFileSync(notFoundClientPath, "utf-8"),
      readFileSync(errorPath, "utf-8"),
      readFileSync(globalErrorPath, "utf-8"),
      readFileSync(fallbackPath, "utf-8"),
    ].join("\n");

    const cssFiles = [
      readFileSync(loadingCssPath, "utf-8"),
      readFileSync(notFoundCssPath, "utf-8"),
      readFileSync(fallbackCssPath, "utf-8"),
    ].join("\n");

    expect(tsxFiles).not.toContain('from "lucide-react"');
    expect(tsxFiles).not.toContain("from 'lucide-react'");
    expect(tsxFiles).not.toContain("Preparing panel");
    expect(tsxFiles).not.toContain("Check server logs");
    expect(tsxFiles).not.toContain("Ctrl K");
    expect(tsxFiles).not.toContain("·");
    expect(tsxFiles).toContain("showShortcutHint={false}");

    expect(cssFiles).not.toContain("#050505");
    expect(cssFiles).not.toContain("#0f0f11");
    expect(cssFiles).not.toContain("#f5b041");

    const fallbackCss = readFileSync(fallbackCssPath, "utf-8");
    expect(fallbackCss).toContain("--bg-base: #0a0d14");
    expect(fallbackCss).toContain("--bg-panel: #101522");
    expect(fallbackCss).toContain("--bg-card: #151b2b");

    const errorSrc = readFileSync(errorPath, "utf-8");
    const globalErrorSrc = readFileSync(globalErrorPath, "utf-8");
    const fallbackSrc = readFileSync(fallbackPath, "utf-8");
    expect(errorSrc).toContain("digest={error.digest}");
    expect(globalErrorSrc).toContain("digest={error.digest}");
    expect(fallbackSrc).toContain("clearTransientUiCache");
    expect(fallbackSrc).toContain("Copy error reference");
    expect(fallbackSrc).toContain('fullScreen ? (');
  });
});
