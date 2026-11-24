"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { ZenithMark, ZenithWordmark } from "@/components/brand/ZenithBrand";
import { getActiveNavGroup, isNavItemActive, NAV_GROUPS, type NavItem } from "@/lib/navigation";
import { usePreferences } from "@/lib/preferences";
import { useSidebar } from "@/context/SidebarContext";
import { Tooltip } from "@/components/ui/Tooltip";
import styles from "./Sidebar.module.css";

const DEFAULT_EXPANDED_GROUPS: Record<string, boolean> = {
  'General': true,
  'Databases': true,
  'Planning Tools': true,
  'World & Encounters': true,
};
const SIDEBAR_GROUP_STORAGE_KEY = "zenith.sidebar.expandedGroups.v1";

export default function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen, railMode, toggleRailMode } = useSidebar();
  const { preferences } = usePreferences();
  const previousPathname = useRef(pathname);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeGroupLabel = useMemo(() => getActiveNavGroup(pathname)?.label, [pathname]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(DEFAULT_EXPANDED_GROUPS);
  const [mobileViewport, setMobileViewport] = useState(false);
  const [viewportResolved, setViewportResolved] = useState(false);
  const [groupsHydrated, setGroupsHydrated] = useState(false);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Mobile focus trap
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const sidebar = document.getElementById("app-sidebar");
      if (!sidebar) return;

      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null || element === document.activeElement);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      } else if (!sidebar.contains(document.activeElement)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.getElementById("app-mobile-menu-button")?.focus({ preventScroll: true });
    };
  }, [mobileOpen, setMobileOpen]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1180px)");
    const updateViewport = () => {
      setMobileViewport(query.matches);
      setViewportResolved(true);
    };
    updateViewport();
    query.addEventListener("change", updateViewport);
    return () => query.removeEventListener("change", updateViewport);
  }, []);

  // Always keep the group of the active route open
  useEffect(() => {
    if (!activeGroupLabel) return;
    setExpandedGroups((prev) => (prev[activeGroupLabel] ? prev : { ...prev, [activeGroupLabel]: true }));
  }, [activeGroupLabel]);

  // Hydrate saved group accordion states with guard against all-collapsed state
  useEffect(() => {
    try {
      const savedGroups = window.localStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY);
      if (savedGroups) {
        const parsedGroups = JSON.parse(savedGroups) as unknown;
        if (parsedGroups && typeof parsedGroups === "object" && !Array.isArray(parsedGroups)) {
          const record = parsedGroups as Record<string, unknown>;
          const nextGroups = NAV_GROUPS.reduce<Record<string, boolean>>((acc, group) => {
            acc[group.label] =
              typeof record[group.label] === "boolean"
                ? (record[group.label] as boolean)
                : (DEFAULT_EXPANDED_GROUPS[group.label] ?? true);
            return acc;
          }, {});

          // Safety guard: if all groups are saved as false, reset them to true
          const hasAnyExpanded = Object.values(nextGroups).some(Boolean);
          const finalGroups = hasAnyExpanded ? nextGroups : { ...DEFAULT_EXPANDED_GROUPS };

          setExpandedGroups(activeGroupLabel ? { ...finalGroups, [activeGroupLabel]: true } : finalGroups);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(SIDEBAR_GROUP_STORAGE_KEY);
      } catch {}
    } finally {
      setGroupsHydrated(true);
    }
  }, [activeGroupLabel]);

  // Persist group accordion states
  useEffect(() => {
    if (!groupsHydrated) return;
    try {
      window.localStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, JSON.stringify(expandedGroups));
    } catch {}
  }, [expandedGroups, groupsHydrated]);

  const standardSidebarOpen = mobileOpen;
  const hideClosedSidebar = !standardSidebarOpen && (!viewportResolved || mobileViewport);
  const isRail = railMode && !mobileViewport;

  const renderNavLink = (item: NavItem) => {
    const active = isNavItemActive(pathname, item);
    const linkElement = (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        className={`${styles.link} ${active ? styles.linkActive : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={closeMobileMenu}
      >
        <span className={styles.linkMain}>
          <ZenithIcon name={item.icon} size={16} />
          <span className={styles.linkLabel}>{item.label}</span>
        </span>
        {item.badge && (
          <span className={styles.badge}>
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (railMode && !mobileViewport) {
      const tooltipLabel = item.badge ? `${item.label} (${item.badge})` : item.label;
      return (
        <Tooltip key={item.href} content={tooltipLabel} placement="right">
          {linkElement}
        </Tooltip>
      );
    }

    return linkElement;
  };

  return (
    <>
      {standardSidebarOpen && (
        <div
          onClick={closeMobileMenu}
          className={styles.mobileBackdrop}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`${styles.sidebar} ${isRail ? styles.rail : ""} ${standardSidebarOpen ? styles.sidebarOpen : ""}`}
        data-rail={isRail ? "true" : "false"}
        aria-label="Primary navigation"
        aria-hidden={hideClosedSidebar ? true : undefined}
        inert={hideClosedSidebar ? true : undefined}
      >
        {/* Pinned Brand Header (56px) */}
        <div className={styles.brand}>
          {!isRail ? (
            <>
              <Link href="/" className={styles.brandLink} onClick={closeMobileMenu}>
                <div className={styles.brandIconShell} aria-hidden="true">
                  <ZenithMark size={22} variant="shaded" idPrefix="sb-logo" />
                </div>
                <div className={styles.brandText}>
                  <div className={styles.brandWordmarkWrapper}>
                    <ZenithWordmark height={14} />
                  </div>
                  <span className={styles.brandSubtitle}>COMPANION</span>
                </div>
              </Link>

              <div className={styles.brandActions}>
                <Tooltip content="Collapse to rail" placement="right">
                  <button
                    type="button"
                    onClick={toggleRailMode}
                    className={styles.railToggle}
                    aria-label="Collapse sidebar (Rail mode)"
                  >
                    <PanelLeftClose size={16} />
                  </button>
                </Tooltip>

                <button
                  ref={closeButtonRef}
                  onClick={closeMobileMenu}
                  className={styles.mobileClose}
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.railBrandHeader}>
              <Tooltip content="Expand sidebar" placement="right">
                <button
                  type="button"
                  onClick={toggleRailMode}
                  className={styles.railHeaderToggle}
                  aria-label="Expand sidebar"
                >
                  <PanelLeft size={18} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <nav className={styles.nav}>
          {NAV_GROUPS.map((group, groupIdx) => {
            const isExpanded = expandedGroups[group.label] ?? true;
            const groupPanelId = `sidebar-group-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

            return (
              <div
                key={group.label}
                className={styles.group}
              >
                {groupIdx > 0 && <div className={styles.railDivider} aria-hidden="true" />}

                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.label} section`}
                  aria-controls={groupPanelId}
                  className={styles.groupHeader}
                  data-expanded={isExpanded ? "true" : "false"}
                >
                  <span className={styles.groupTitle}>
                    <ZenithIcon name={group.icon} size={13} />
                    <span>{group.label}</span>
                  </span>
                  <span
                    className={`${styles.groupChevron} ${isExpanded ? styles.chevronExpanded : ""}`}
                    aria-hidden="true"
                  >
                    <ChevronDown size={12} />
                  </span>
                </button>

                <div
                  id={groupPanelId}
                  className={`${styles.panel} ${!isExpanded ? styles.panelCollapsed : ""}`}
                  data-expanded={isExpanded ? "true" : "false"}
                >
                  <div className={styles.panelContent}>
                    {group.items.map(renderNavLink)}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
