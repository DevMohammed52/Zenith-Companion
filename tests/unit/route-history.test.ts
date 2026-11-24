import { describe, expect, it, beforeEach } from "vitest";
import {
  DEFAULT_DOCK_TABS,
  getTopVisitedRoutes,
  normalizeRoutePath,
  recordRouteVisit,
} from "../../src/lib/route-history";

describe("route-history helper", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const fakeStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => store.set(key, val),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      length: 0,
      key: () => null,
    } as unknown as Storage;

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: fakeStorage,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: {
        localStorage: fakeStorage,
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });

  describe("normalizeRoutePath", () => {
    it("preserves specialized sub-routes", () => {
      expect(normalizeRoutePath("/forge/craft")).toBe("/forge/craft");
      expect(normalizeRoutePath("/forge/craft/recipe-1")).toBe("/forge/craft");
      expect(normalizeRoutePath("/forge/lessons")).toBe("/forge/lessons");
      expect(normalizeRoutePath("/pets/owned")).toBe("/pets/owned");
      expect(normalizeRoutePath("/pets/compare")).toBe("/pets/compare");
      expect(normalizeRoutePath("/alchemy/mythic")).toBe("/alchemy/mythic");
    });

    it("normalizes root sections for general routes", () => {
      expect(normalizeRoutePath("/items/12345")).toBe("/items");
      expect(normalizeRoutePath("/bosses/behemoth")).toBe("/bosses");
      expect(normalizeRoutePath("/alchemy")).toBe("/alchemy");
      expect(normalizeRoutePath("/")).toBe("/");
      expect(normalizeRoutePath("")).toBe("/");
    });
  });

  describe("recordRouteVisit and getTopVisitedRoutes", () => {
    it("returns default tabs when no history exists", () => {
      const top = getTopVisitedRoutes(3);
      expect(top).toEqual(DEFAULT_DOCK_TABS);
    });

    it("ranks top routes dynamically based on visit frequency", () => {
      recordRouteVisit("/skill-profit");
      recordRouteVisit("/skill-profit");
      recordRouteVisit("/skill-profit");

      recordRouteVisit("/combat");
      recordRouteVisit("/combat");

      recordRouteVisit("/forge/craft");

      const top = getTopVisitedRoutes(3);
      expect(top[0]).toBe("/skill-profit");
      expect(top[1]).toBe("/combat");
      expect(top[2]).toBe("/forge/craft");
    });

    it("ignores home and settings routes", () => {
      recordRouteVisit("/");
      recordRouteVisit("/settings");

      const top = getTopVisitedRoutes(3);
      expect(top).toEqual(DEFAULT_DOCK_TABS);
    });
  });
});
