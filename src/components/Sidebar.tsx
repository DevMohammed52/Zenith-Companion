"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, X, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ZenithIcon, { type ZenithIconName } from '@/components/icons/ZenithIcon';

interface NavItem {
    href: string;
    label: string;
    icon: ZenithIconName;
    matchPrefix?: boolean;
    badge?: string;
}

interface NavGroup {
    label: string;
    eyebrow: string;
    icon: ZenithIconName;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'General',
        eyebrow: 'Home base',
        icon: 'dashboard',
        items: [
            { href: '/', label: 'Dashboard', icon: 'dashboard' },
            { href: '/profiles', label: 'Profiles', icon: 'profile' },
            { href: '/settings', label: 'Settings', icon: 'settings' },
        ]
    },
    {
        label: 'Databases',
        eyebrow: 'Reference',
        icon: 'items',
        items: [
            { href: '/items', label: 'Items Database', icon: 'items', matchPrefix: true },
            { href: '/enemies', label: 'Enemy Database', icon: 'enemy' },
            { href: '/pets', label: 'Pet Database', icon: 'pets' },
            { href: '/pets/owned', label: 'Owned Pets', icon: 'pets' },
            { href: '/pets/compare', label: 'Pet Comparison', icon: 'skill' },
            { href: '/guilds', label: 'Guild Database', icon: 'guild' },
            { href: '/museum', label: 'Museum', icon: 'museum' },
            { href: '/lore', label: 'Lore Wiki', icon: 'archive', matchPrefix: true },
        ]
    },
    {
        label: 'Planning Tools',
        eyebrow: 'Calculators',
        icon: 'alchemy',
        items: [
            { href: '/alchemy', label: 'Alchemy Profit', icon: 'alchemy' },
            { href: '/skill-profit', label: 'Skill Profit Finder', icon: 'skill' },
            { href: '/alchemy/mythic', label: 'Mythic Lab', icon: 'spark', badge: 'LVL 90' },
            { href: '/crafting', label: 'Crafting Queue', icon: 'crafting' },
            { href: '/forge', label: 'Forge Planner', icon: 'forge' },
            { href: '/housing', label: 'Housing', icon: 'housing' },
            { href: '/bis', label: 'BiS Recommender', icon: 'shield' },
            { href: '/market-alerts', label: 'Market Watch', icon: 'bell' },
        ]
    },
    {
        label: 'World & Combat',
        eyebrow: 'Live route',
        icon: 'combat',
        items: [
            { href: '/map', label: 'World Map', icon: 'map' },
            { href: '/weather', label: 'Weather Guide', icon: 'weather' },
            { href: '/combat', label: 'Combat', icon: 'combat' },
            { href: '/dungeons', label: 'Dungeons', icon: 'castle' },
            { href: '/bosses', label: 'World Bosses', icon: 'boss' },
            { href: '/conquest', label: 'Conquest', icon: 'conquest' },
        ]
    }
];

const DEFAULT_EXPANDED_GROUPS: Record<string, boolean> = {
    'General': true,
    'Databases': true,
    'Planning Tools': false,
    'World & Combat': true,
};
const SIDEBAR_GROUP_STORAGE_KEY = 'zenith.sidebar.expandedGroups.v1';

import { useSidebar } from '@/context/SidebarContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { mobileOpen, setMobileOpen } = useSidebar();
    const previousPathname = useRef(pathname);
    const activeGroupLabel = useMemo(() => {
        return NAV_GROUPS.find((group) => group.items.some((item) => {
            if (item.matchPrefix) return pathname === item.href || pathname.startsWith(item.href + '/');
            return pathname === item.href;
        }))?.label;
    }, [pathname]);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(DEFAULT_EXPANDED_GROUPS);

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
            if (event.key === 'Escape') setMobileOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileOpen, setMobileOpen]);

    const isActive = (item: NavItem) => {
        if (item.matchPrefix) return pathname === item.href || pathname.startsWith(item.href + '/');
        return pathname === item.href;
    };

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

    return (
        <>
            {mobileOpen && <div onClick={() => setMobileOpen(false)} className="mobile-backdrop" aria-hidden="true" />}

            <div id="app-sidebar" className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
                <div className="sidebar-brand">
                    <div>
                        <h2>
                            <Activity size={18} /> ZENITH
                        </h2>
                        <p>COMPANION SUITE</p>
                    </div>
                    <button 
                        onClick={() => setMobileOpen(false)} 
                        className="mobile-sidebar-close"
                        aria-label="Close navigation menu"
                        style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid var(--border-subtle)', 
                            borderRadius: '6px', 
                            width: '40px',
                            height: '40px',
                            minWidth: '40px',
                            minHeight: '40px',
                            padding: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <X size={18} />
                    </button>
                    <style>{`
                        @media (min-width: 1181px) {
                            .mobile-sidebar-close {
                                display: none !important;
                            }
                        }
                        @media (max-width: 1180px) {
                            .mobile-sidebar-close {
                                display: flex !important;
                            }
                        }
                    `}</style>
                </div>

                <nav className="sidebar-nav custom-scrollbar">
                    {NAV_GROUPS.map(group => {
                        const isExpanded = expandedGroups[group.label];
                        const isActiveGroup = activeGroupLabel === group.label;
                        const groupPanelId = `sidebar-group-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                        
                        return (
                            <div key={group.label} className={`sidebar-group ${isActiveGroup ? 'sidebar-group-active' : ''}`}>
                                <button 
                                    onClick={() => toggleGroup(group.label)}
                                    aria-expanded={isExpanded}
                                    aria-controls={groupPanelId}
                                    className="sidebar-group-button"
                                >
                                    <div className="sidebar-group-title">
                                        <ZenithIcon name={group.icon} size={15} />
                                        <span>
                                            <strong>{group.label}</strong>
                                            <small>{group.eyebrow}</small>
                                        </span>
                                    </div>
                                    <div className="sidebar-group-chevron" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                                        <ChevronDown size={14} />
                                    </div>
                                </button>

                                <div
                                    id={groupPanelId}
                                    className="sidebar-group-panel"
                                    data-expanded={isExpanded ? 'true' : 'false'}
                                    style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                                >
                                    <div className="sidebar-group-items">
                                        {group.items.map(item => {
                                            const active = isActive(item);
                                            return (
                                                <Link 
                                                    key={item.href} 
                                                    href={item.href} 
                                                    className={`nav-link ${active ? 'nav-link-active' : ''}`}
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
            </div>
        </>
    );
}
