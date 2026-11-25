"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { usePreferences } from "@/lib/preferences";
import { BottomDock, type BottomDockItem } from "@/components/ui/BottomDock";
import { Icon } from "@/components/ui/Icon";
import { findNavItemByHref, isNavItemActive } from "@/lib/navigation";
import { DEFAULT_DOCK_TABS, getTopVisitedRoutes, recordRouteVisit } from "@/lib/route-history";
import ZenithIcon from "@/components/icons/ZenithIcon";

const DOCK_SHORT_LABELS: Record<string, string> = {
  "/alchemy": "Alchemy",
  "/alchemy/mythic": "Mythic Lab",
  "/skill-profit": "Profit",
  "/pets/compare": "Compare",
  "/pets/owned": "Owned",
  "/forge/lessons": "Forge",
  "/forge/craft": "Craft",
  "/crafting": "Queue",
  "/bosses": "Bosses",
  "/patch-notes": "Patches",
  "/whats-new": "What's New",
  "/dungeons": "Dungeons",
  "/conquest": "Conquest",
  "/profiles": "Profiles",
  "/guilds": "Guilds",
  "/museum": "Museum",
  "/map": "Map",
  "/weather": "Weather",
  "/bis": "BiS",
  "/housing": "Housing",
};

function formatDockLabel(href: string, fullLabel: string): string {
  if (DOCK_SHORT_LABELS[href]) {
    return DOCK_SHORT_LABELS[href];
  }
  return fullLabel
    .replace(" Database", "")
    .replace(" Calculator", "")
    .replace(" Guide", "")
    .replace(" Planner", "")
    .replace(" Finder", "")
    .replace(" Recommender", "")
    .replace(" IdleMMO", "")
    .trim();
}

export default function MobileBottomDock() {
  const pathname = usePathname();
  const { mobileOpen, toggleMobile, setMobileOpen } = useSidebar();
  const { preferences } = usePreferences();
  const [mounted, setMounted] = useState(false);
  const [visitedRoutes, setVisitedRoutes] = useState<string[]>(DEFAULT_DOCK_TABS);

  // Mark mounted and record route visits on client side only (prevents SSR hydration mismatch)
  useEffect(() => {
    setMounted(true);
    if (pathname) {
      recordRouteVisit(pathname);
      setVisitedRoutes(getTopVisitedRoutes(3));
    }
  }, [pathname]);

  // Listen for storage updates across tabs or within session
  useEffect(() => {
    const handleUpdate = () => {
      setVisitedRoutes(getTopVisitedRoutes(3));
    };
    window.addEventListener("zenith-route-visits-updated", handleUpdate);
    return () => window.removeEventListener("zenith-route-visits-updated", handleUpdate);
  }, []);

  const handleNavClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  // Determine the 3 middle tabs: custom user choice or dynamic top 3 visited
  const middleHrefs = useMemo(() => {
    if (!mounted) return DEFAULT_DOCK_TABS;
    if (preferences.mobileDockTabs && preferences.mobileDockTabs.length === 3) {
      return preferences.mobileDockTabs;
    }
    return visitedRoutes;
  }, [mounted, preferences.mobileDockTabs, visitedRoutes]);

  const middleItems = useMemo(() => {
    return middleHrefs.map((href) => {
      const navItem = findNavItemByHref(href);
      if (!navItem) {
        return null;
      }

      const active = isNavItemActive(pathname, navItem) && !mobileOpen;
      const cleanLabel = formatDockLabel(navItem.href, navItem.label);
      const cleanId = `dock-${href.replace(/\//g, "-").replace(/^-/, "")}`;

      const item: BottomDockItem = {
        id: cleanId,
        label: cleanLabel,
        href: navItem.href,
        icon: <ZenithIcon name={navItem.icon} size={20} aria-hidden="true" />,
        isActive: active,
        onClick: handleNavClick,
        "aria-label": navItem.label,
      };
      return item;
    }).filter(Boolean) as BottomDockItem[];
  }, [middleHrefs, pathname, mobileOpen]);

  const isHomeActive = pathname === "/" && !mobileOpen;

  const items: BottomDockItem[] = [
    {
      id: "dock-home",
      label: "Home",
      href: "/",
      icon: <Icon name="dashboard" size={20} />,
      isActive: isHomeActive,
      onClick: handleNavClick,
      "aria-label": "Dashboard",
    },
    ...middleItems,
    {
      id: "dock-menu",
      label: mobileOpen ? "Close" : "Menu",
      icon: <Icon name={mobileOpen ? "close" : "menu"} size={20} />,
      isActive: mobileOpen,
      onClick: toggleMobile,
      "aria-label": mobileOpen ? "Close navigation menu" : "Open navigation menu",
    },
  ];

  return (
    <BottomDock
      items={items}
      hideOnDesktop
      ariaLabel="Mobile primary navigation"
    />
  );
}
