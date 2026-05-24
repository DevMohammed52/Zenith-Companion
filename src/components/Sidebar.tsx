"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, X, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ZenithIcon from '@/components/icons/ZenithIcon';
import { getActiveNavGroup, isNavItemActive, NAV_GROUPS } from '@/lib/navigation';
import { usePreferences } from '@/lib/preferences';
import { useSidebar } from '@/context/SidebarContext';

const DEFAULT_EXPANDED_GROUPS: Record<string, boolean> = {
    'General': true,
    'Databases': true,
    'Planning Tools': false,
    'World & Combat': true,
};
const SIDEBAR_GROUP_STORAGE_KEY = 'zenith.sidebar.expandedGroups.v1';

export default function Sidebar() {
    const pathname = usePathname();
    const { mobileOpen, setMobileOpen } = useSidebar();
    const { preferences } = usePreferences();
    const previousPathname = useRef(pathname);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const activeGroupLabel = useMemo(() => getActiveNavGroup(pathname)?.label, [pathname]);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(DEFAULT_EXPANDED_GROUPS);
    const [mobileViewport, setMobileViewport] = useState(false);
    const [viewportResolved, setViewportResolved] = useState(false);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const closeMobileMenu = () => {
        setMobileOpen(false);
    };

    useEffect(() => {
        if (previousPathname.current === pathname) return;
        previousPathname.current = pathname;
        setMobileOpen(false);
    }, [pathname, setMobileOpen]);

    useEffect(() => {
        if (!mobileOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setMobileOpen(false);
                return;
            }

            if (event.key !== 'Tab') return;

            const sidebar = document.getElementById('app-sidebar');
            if (!sidebar) return;

            const focusable = Array.from(sidebar.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )).filter((element) => element.offsetParent !== null || element === document.activeElement);

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
        window.addEventListener('keydown', handleKeyDown);
        const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
        return () => {
            window.cancelAnimationFrame(focusFrame);
            window.removeEventListener('keydown', handleKeyDown);
            document.getElementById('app-mobile-menu-button')?.focus({ preventScroll: true });
        };
    }, [mobileOpen, setMobileOpen]);

    useEffect(() => {
        const query = window.matchMedia('(max-width: 1180px)');
        const updateViewport = () => {
            setMobileViewport(query.matches);
            setViewportResolved(true);
        };
        updateViewport();
        query.addEventListener('change', updateViewport);
        return () => query.removeEventListener('change', updateViewport);
    }, []);

    useEffect(() => {
        if (!activeGroupLabel) return;
        setExpandedGroups((prev) => prev[activeGroupLabel] ? prev : { ...prev, [activeGroupLabel]: true });
    }, [activeGroupLabel]);

    useEffect(() => {
        try {
            const savedGroups = window.localStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY);
            if (!savedGroups) return;
            const parsedGroups = JSON.parse(savedGroups) as Record<string, unknown>;
            const nextGroups = NAV_GROUPS.reduce<Record<string, boolean>>((acc, group) => {
                acc[group.label] = typeof parsedGroups[group.label] === 'boolean'
                    ? parsedGroups[group.label] as boolean
                    : DEFAULT_EXPANDED_GROUPS[group.label] ?? false;
                return acc;
            }, {});
            setExpandedGroups(activeGroupLabel ? { ...nextGroups, [activeGroupLabel]: true } : nextGroups);
        } catch {
            window.localStorage.removeItem(SIDEBAR_GROUP_STORAGE_KEY);
        }
    }, [activeGroupLabel]);

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, JSON.stringify(expandedGroups));
    }, [expandedGroups]);

    const commandNavigationActive = preferences.mobileNavigationStyle === 'command' && mobileViewport;
    const standardSidebarOpen = mobileOpen && !commandNavigationActive;
    const hideClosedSidebar = !standardSidebarOpen && (!viewportResolved || mobileViewport);

    return (
        <>
            {standardSidebarOpen && <div onClick={() => setMobileOpen(false)} className="mobile-backdrop" aria-hidden="true" />}

            <aside
                id="app-sidebar"
                className={`sidebar ${standardSidebarOpen ? 'sidebar-open' : ''}`}
                aria-label="Primary navigation"
                aria-hidden={hideClosedSidebar ? true : undefined}
                inert={hideClosedSidebar ? true : undefined}
            >
                <div className="sidebar-brand">
                    <div>
                        <div className="sidebar-brand-title">
                            <Activity size={18} /> ZENITH
                        </div>
                        <p>COMPANION SUITE</p>
                    </div>
                    <button 
                        ref={closeButtonRef}
                        onClick={() => setMobileOpen(false)} 
                        className="mobile-sidebar-close"
                        aria-label="Close navigation menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav custom-scrollbar">
                    {NAV_GROUPS.map(group => {
                        const isExpanded = expandedGroups[group.label];
                        const isActiveGroup = activeGroupLabel === group.label;
                        const groupPanelId = `sidebar-group-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                        
                        return (
                            <div
                                key={group.label}
                                className={`sidebar-group ${isActiveGroup ? 'sidebar-group-active' : ''}`}
                                data-active={isActiveGroup ? 'true' : 'false'}
                            >
                                <button 
                                    onClick={() => toggleGroup(group.label)}
                                    aria-expanded={isExpanded}
                                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.label} navigation group`}
                                    aria-controls={groupPanelId}
                                    className="sidebar-group-button"
                                    data-expanded={isExpanded ? 'true' : 'false'}
                                >
                                    <div className="sidebar-group-title">
                                        <ZenithIcon name={group.icon} size={15} />
                                        <span>
                                            <strong>{group.label}</strong>
                                            <small>{group.eyebrow}</small>
                                        </span>
                                    </div>
                                    <div className="sidebar-group-chevron" aria-hidden="true">
                                        <ChevronDown size={14} />
                                    </div>
                                </button>

                                <div
                                    id={groupPanelId}
                                    className="sidebar-group-panel"
                                    data-expanded={isExpanded ? 'true' : 'false'}
                                >
                                    <div className="sidebar-group-items">
                                        {group.items.map(item => {
                                            const active = isNavItemActive(pathname, item);
                                            return (
                                                <Link 
                                                    key={item.href} 
                                                    href={item.href} 
                                                    className={`nav-link ${active ? 'nav-link-active' : ''}`}
                                                    aria-current={active ? 'page' : undefined}
                                                    onClick={closeMobileMenu}
                                                >
                                                    <span className="nav-link-main">
                                                        <ZenithIcon name={item.icon} size={15} />
                                                        {item.label}
                                                    </span>
                                                    {item.badge && (
                                                        <span className="nav-link-badge">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
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
