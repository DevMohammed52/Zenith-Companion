"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, FlaskConical, Swords, Package, Loader2, Castle, Skull, Menu, X, LayoutDashboard, Settings, ShoppingCart, Shield, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavItem {
    href: string;
    label: string;
    icon: any;
    matchPrefix?: boolean;
    badge?: string;
}

interface NavGroup {
    label: string;
    icon: any;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'General',
        icon: LayoutDashboard,
        items: [
            { href: '/', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/items', label: 'Items Database', icon: Package, matchPrefix: true },
            { href: '/weather', label: 'Weather Guide', icon: Sparkles },
            { href: '/settings', label: 'Settings', icon: Settings },
        ]
    },
    {
        label: 'Skills',
        icon: FlaskConical,
        items: [
            { href: '/alchemy', label: 'Alchemy Profit', icon: FlaskConical },
            { href: '/alchemy/mythic', label: 'Mythic Lab', icon: Sparkles, badge: 'LVL 90' },
            { href: '/crafting', label: 'Crafting Queue', icon: ShoppingCart },
        ]
    },
    {
        label: 'Combat',
        icon: Swords,
        items: [
            { href: '/combat', label: 'Combat', icon: Swords },
            { href: '/dungeons', label: 'Dungeons', icon: Castle },
            { href: '/bosses', label: 'World Bosses', icon: Skull },
            { href: '/bis', label: 'BiS Recommender', icon: Shield },
        ]
    }
];

import { useData } from '@/context/DataContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { scraperStatus } = useData();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'General': true,
        'Skills': true,
        'Combat': true
    });

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const isActive = (item: NavItem) => {
        if (item.matchPrefix) return pathname === item.href || pathname.startsWith(item.href + '/');
        return pathname === item.href;
    };

    // Calculate age for "Last Updated"
    const updatedAt = scraperStatus?.timestamp ? new Date(scraperStatus.timestamp) : null;
    const ageMs = updatedAt ? Date.now() - updatedAt.getTime() : null;
    const ageMinutes = ageMs === null ? null : Math.max(0, Math.floor(ageMs / 60000));
    const isStale = ageMinutes !== null && ageMinutes >= 10;
    const freshnessText = ageMinutes === null
        ? 'Waiting...'
        : ageMinutes < 1
            ? 'Just now'
            : `${ageMinutes}m ago`;

    return (
        <>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn" aria-label="Toggle menu">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {mobileOpen && <div onClick={() => setMobileOpen(false)} className="mobile-backdrop" />}

            <div className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
                        <Activity size={18} color="var(--text-accent)" /> ZENITH
                    </h2>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem', letterSpacing: '0.1em' }}>COMPANION SUITE</p>
                </div>

                <nav style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    flex: 1, 
                    overflowY: 'auto',
                    paddingRight: '0.5rem', // Space for scrollbar
                    marginRight: '-0.5rem'  // Compensation
                }} className="custom-scrollbar">
                    {NAV_GROUPS.map(group => {
                        const isExpanded = expandedGroups[group.label];
                        const GroupIcon = group.icon;
                        
                        return (
                            <div key={group.label} style={{ display: 'flex', flexDirection: 'column' }}>
                                <button 
                                    onClick={() => toggleGroup(group.label)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.6rem 0.75rem', background: 'transparent', border: 'none',
                                        color: isExpanded ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem',
                                        fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                                        transition: 'color 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <GroupIcon size={14} style={{ opacity: isExpanded ? 0.8 : 0.4 }} />
                                        {group.label}
                                    </div>
                                    <div style={{ transition: 'transform 0.3s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                                        <ChevronDown size={14} />
                                    </div>
                                </button>

                                <div style={{ 
                                    display: 'grid',
                                    gridTemplateRows: isExpanded ? '1fr' : '0fr',
                                    transition: 'grid-template-rows 0.3s ease-in-out',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '0.5rem' }}>
                                        {group.items.map(item => {
                                            const active = isActive(item);
                                            const Icon = item.icon;
                                            return (
                                                <Link 
                                                    key={item.href} 
                                                    href={item.href} 
                                                    className={`nav-link ${active ? 'nav-link-active' : ''}`}
                                                    style={{ 
                                                        paddingLeft: '1.25rem', 
                                                        fontSize: '0.82rem',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {active && (
                                                        <div style={{ 
                                                            position: 'absolute', left: 0, top: '20%', bottom: '20%', 
                                                            width: '2px', background: 'var(--text-accent)', 
                                                            boxShadow: '0 0 10px var(--text-accent)',
                                                            borderRadius: '0 2px 2px 0'
                                                        }} />
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <Icon size={15} style={{ 
                                                            opacity: active ? 1 : 0.5,
                                                            color: active ? 'var(--text-accent)' : 'inherit'
                                                        }} />
                                                        {item.label}
                                                    </div>
                                                    {item.badge && (
                                                        <span style={{ 
                                                            fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', 
                                                            padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' 
                                                        }}>
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

                <div style={{ 
                    padding: '1rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-subtle)', 
                    marginTop: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        position: 'absolute', top: 0, left: 0, width: '2px', height: '100%',
                        background: isStale ? 'var(--text-danger)' : 'var(--text-success)',
                        opacity: 0.5
                    }} />
                    <h3 style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.06em' }}>
                        <Loader2 size={11} className={isStale ? "" : "animate-spin"} /> MARKET SYNC
                    </h3>
                    {scraperStatus ? (
                        <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                {scraperStatus.currentItem}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ color: 'var(--text-accent)', fontWeight: 700 }}>
                                    {scraperStatus.currentIndex} / {scraperStatus.totalItems}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: isStale ? 'var(--text-danger)' : 'var(--text-muted)' }}>
                                    {freshnessText}
                                </span>
                            </div>
                        </div>
                    ) : <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Connecting...</div>}
                </div>
            </div>
        </>
    );
}
