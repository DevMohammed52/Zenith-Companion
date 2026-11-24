"use client";

const ROUTE_VISITS_KEY = "zenith.routeVisits.v1";

export const DEFAULT_DOCK_TABS = ["/items", "/alchemy", "/bosses"];

export function normalizeRoutePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  if (pathname.startsWith("/forge/craft")) return "/forge/craft";
  if (pathname.startsWith("/forge/lessons")) return "/forge/lessons";
  if (pathname.startsWith("/pets/owned")) return "/pets/owned";
  if (pathname.startsWith("/pets/compare")) return "/pets/compare";
  if (pathname.startsWith("/alchemy/mythic")) return "/alchemy/mythic";
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : "/";
}

export function recordRouteVisit(pathname: string): void {
  if (typeof window === "undefined" || !pathname || pathname === "/") return;
  const normalized = normalizeRoutePath(pathname);
  if (!normalized || normalized === "/" || normalized === "/settings") return;

  try {
    const raw = window.localStorage.getItem(ROUTE_VISITS_KEY);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    counts[normalized] = (counts[normalized] || 0) + 1;
    window.localStorage.setItem(ROUTE_VISITS_KEY, JSON.stringify(counts));
    window.dispatchEvent(new CustomEvent("zenith-route-visits-updated"));
  } catch {}
}

export function getTopVisitedRoutes(limit = 3): string[] {
  if (typeof window === "undefined") return DEFAULT_DOCK_TABS;

  try {
    const raw = window.localStorage.getItem(ROUTE_VISITS_KEY);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    const sorted = Object.entries(counts)
      .filter(([route, count]) => route !== "/" && route !== "/settings" && count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([route]) => route);

    const result = [...sorted];
    for (const def of DEFAULT_DOCK_TABS) {
      if (!result.includes(def) && result.length < limit) {
        result.push(def);
      }
    }

    const fallbacks = ["/skill-profit", "/forge/craft", "/pets", "/dungeons", "/combat"];
    for (const fb of fallbacks) {
      if (!result.includes(fb) && result.length < limit) {
        result.push(fb);
      }
    }

    return result.slice(0, limit);
  } catch {
    return DEFAULT_DOCK_TABS;
  }
}
