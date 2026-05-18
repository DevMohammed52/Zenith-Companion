"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { getActiveNavGroup, isNavItemActive, NAV_GROUPS } from "@/lib/navigation";
import { usePreferences } from "@/lib/preferences";

const MAGNET_DISTANCE = 86;
const BASE_SIZE = 54;
const MAX_GROWTH = 17;
const MAX_LIFT = 9;
const DEFAULT_DOCK_MOTION = { size: BASE_SIZE, shiftX: 0, shiftY: 0 };

export default function DesktopDock() {
  const pathname = usePathname();
  const { preferences, loaded } = usePreferences();
  const [dockMotions, setDockMotions] = useState(() => NAV_GROUPS.map(() => DEFAULT_DOCK_MOTION));
  const [openGroupLabel, setOpenGroupLabel] = useState<string | null>(null);
  const [pinnedGroupLabel, setPinnedGroupLabel] = useState<string | null>(null);
  const shellRef = useRef<HTMLElement | null>(null);
  const dockRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeGroup = useMemo(() => getActiveNavGroup(pathname) ?? NAV_GROUPS[0], [pathname]);
  const dockEnabled = loaded && preferences.desktopNavigationStyle === "dock";
  const dockPosition = preferences.desktopDockPosition ?? "bottom";
  const verticalDock = dockPosition === "left" || dockPosition === "right";
  const openGroup = NAV_GROUPS.find((group) => group.label === (openGroupLabel ?? activeGroup.label)) ?? activeGroup;
  const denseShelf = openGroup.items.length > 5;
  const hasOddShelfTail = !verticalDock && openGroup.items.length % 2 === 1;

  useEffect(() => {
    if (!loaded || preferences.desktopNavigationStyle !== "dock") return;
    const root = document.documentElement;
    root.dataset.desktopNavigation = "dock";
    return () => {
      if (root.dataset.desktopNavigation === "dock") root.dataset.desktopNavigation = "sidebar";
    };
  }, [loaded, preferences.desktopNavigationStyle]);

  useEffect(() => {
    if (!dockEnabled) return;
    setOpenGroupLabel(null);
    setPinnedGroupLabel(null);
  }, [activeGroup.label, dockEnabled]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!dockEnabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && shellRef.current?.contains(target)) return;
      closeDockNow();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [dockEnabled]);

  const openDockGroup = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setOpenGroupLabel(label);
  };

  const previewDockGroup = (label: string) => {
    openDockGroup(label);
    if (pinnedGroupLabel) setPinnedGroupLabel(label);
  };

  const closeDock = () => {
    if (pinnedGroupLabel) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      resetDockMotion();
      setOpenGroupLabel(null);
    }, 110);
  };

  function closeDockNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    resetDockMotion();
    setOpenGroupLabel(null);
    setPinnedGroupLabel(null);
  }

  function resetDockMotion() {
    setDockMotions(NAV_GROUPS.map(() => DEFAULT_DOCK_MOTION));
  }

  const pinDockGroup = (label: string) => {
    if (pinnedGroupLabel === label) {
      closeDockNow();
      return;
    }
    openDockGroup(label);
    setPinnedGroupLabel(label);
  };

  const focusDockGroup = (index: number) => {
    const normalized = (index + NAV_GROUPS.length) % NAV_GROUPS.length;
    const nextGroup = NAV_GROUPS[normalized];
    dockRefs.current[normalized]?.focus();
    openDockGroup(nextGroup.label);
    if (pinnedGroupLabel) setPinnedGroupLabel(nextGroup.label);
  };

  const handleDockKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const activeIndex = dockRefs.current.findIndex((node) => node === document.activeElement);
    const currentIndex = activeIndex >= 0 ? activeIndex : NAV_GROUPS.findIndex((group) => group.label === openGroup.label);
    const horizontalNext = event.key === "ArrowRight" || event.key === "ArrowDown";
    const horizontalPrevious = event.key === "ArrowLeft" || event.key === "ArrowUp";

    if (horizontalNext || horizontalPrevious) {
      event.preventDefault();
      focusDockGroup(currentIndex + (horizontalNext ? 1 : -1));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pinDockGroup(openGroup.label);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDockNow();
    }
  };

  const updateDockMotion = (pointerCoordinate: number) => {
    setDockMotions(NAV_GROUPS.map((_, index) => {
      const node = dockRefs.current[index];
      if (!node) return DEFAULT_DOCK_MOTION;
      const rect = node.getBoundingClientRect();
      const center = verticalDock ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      const influence = Math.max(0, 1 - Math.abs(pointerCoordinate - center) / MAGNET_DISTANCE);
      const outward = influence * MAX_LIFT;
      return {
        size: BASE_SIZE + influence * MAX_GROWTH,
        shiftX: verticalDock ? (dockPosition === "left" ? outward : -outward) : 0,
        shiftY: verticalDock ? 0 : -outward,
      };
    }));
  };

  if (!dockEnabled) return null;

  return (
    <nav
      ref={shellRef}
      className={`desktop-dock-shell desktop-dock-position-${dockPosition} ${openGroupLabel ? "desktop-dock-shell-open" : ""} ${pinnedGroupLabel ? "desktop-dock-shell-pinned" : ""}`}
      aria-label="Zenith desktop dock"
      onPointerEnter={() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }}
      onMouseLeave={closeDock}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        closeDock();
      }}
    >
      <div
        className={`desktop-dock-shelf ${denseShelf ? "desktop-dock-shelf-dense" : ""}`}
        aria-label={`${openGroup.label} destinations`}
      >
        <div className="desktop-dock-shelf-heading">
          <span>
            <ZenithIcon name={openGroup.icon} size={16} />
            <strong>{openGroup.label}</strong>
          </span>
          <small>{openGroup.items.length} links</small>
        </div>
        <div className="desktop-dock-links">
          {openGroup.items.map((item, itemIndex) => {
            const active = isNavItemActive(pathname, item);
            const stretchTail = hasOddShelfTail && itemIndex === openGroup.items.length - 1;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`desktop-dock-link ${active ? "desktop-dock-link-active" : ""} ${stretchTail ? "desktop-dock-link-span" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  closeDockNow();
                  event.currentTarget.blur();
                }}
              >
                <ZenithIcon name={item.icon} size={15} />
                <span>{item.label}</span>
                {item.badge && <em>{item.badge}</em>}
              </Link>
            );
          })}
        </div>
      </div>

      <div
        className="desktop-dock"
        role="toolbar"
        aria-label="Navigation categories"
        onKeyDown={handleDockKeyDown}
        onPointerLeave={resetDockMotion}
        onPointerMove={(event) => updateDockMotion(verticalDock ? event.clientY : event.clientX)}
      >
        {NAV_GROUPS.map((group, index) => {
          const active = group.label === activeGroup.label;
          const motion = dockMotions[index] ?? DEFAULT_DOCK_MOTION;
          return (
            <button
              key={group.label}
              type="button"
              ref={(node) => {
                dockRefs.current[index] = node;
              }}
              aria-label={`${group.label}: ${group.eyebrow}`}
              aria-expanded={openGroupLabel === group.label}
              className={`desktop-dock-item ${active ? "desktop-dock-item-active" : ""}`}
              style={{
                ["--dock-size" as string]: `${motion.size}px`,
                ["--dock-shift-x" as string]: `${motion.shiftX}px`,
                ["--dock-shift-y" as string]: `${motion.shiftY}px`,
              }}
              onFocus={() => previewDockGroup(group.label)}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => previewDockGroup(group.label)}
              onClick={() => pinDockGroup(group.label)}
            >
              <ZenithIcon name={group.icon} size={22} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
