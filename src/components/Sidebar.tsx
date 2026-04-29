"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, FlaskConical, Swords, Package, Loader2, Castle, Skull, Menu, X, LayoutDashboard, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/alchemy', label: 'Alchemy', icon: FlaskConical },
    { href: '/combat', label: 'Combat', icon: Swords },
    { href: '/dungeons', label: 'Dungeons', icon: Castle },
    { href: '/bosses', label: 'World Bosses', icon: Skull },
    { href: '/items', label: 'Market Items', icon: Package, matchPrefix: true },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [scraperStatus, setScraperStatus] = useState<any>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/scraper-status.json?t=" + Date.now());
                if (res.ok) setScraperStatus(await res.json());
            } catch (e) {}
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    // Close on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const isActive = (item: typeof NAV_ITEMS[0]) => {
        if (item.matchPrefix) return pathname === item.href || pathname.startsWith(item.href + '/');
        return pathname === item.href;
    };

    const updatedAt = scraperStatus?.timestamp ? new Date(scraperStatus.timestamp) : null;
    const ageMs = updatedAt ? Date.now() - updatedAt.getTime() : null;
    const ageMinutes = ageMs === null ? null : Math.max(0, Math.floor(ageMs / 60000));
    const isStale = ageMinutes !== null && ageMinutes >= 10;
    const freshnessText = ageMinutes === null
        ? 'Waiting for update'
        : ageMinutes < 1
            ? 'Updated just now'
            : `Updated ${ageMinutes}m ago`;

    return (
        <>
            {/* Mobile hamburger */}
            <button 
                onClick={() => setMobileOpen(!mobileOpen)}
                className="mobile-menu-btn"
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Backdrop for mobile */}
            {mobileOpen && (
                <div 
                    onClick={() => setMobileOpen(false)}
                    className="mobile-backdrop"
                />
            )}

            <div className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '-0.02em' }}>
                        <Activity size={18} color="var(--text-accent)" /> ZENITH
                    </h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', letterSpacing: '0.08em' }}>COMPANION SUITE</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    {NAV_ITEMS.map(item => {
                        const active = isActive(item);
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href} className={`nav-link ${active ? 'nav-link-active' : ''}`}>
                                <Icon size={17} /> {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.06em' }}>
                        <Loader2 size={12} className="animate-spin" /> LIVE SCRAPER
                    </h3>
                    {scraperStatus ? (
                        <>
                            <div style={{ fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {scraperStatus.currentItem}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-accent)', marginTop: '0.2rem' }}>
                                {scraperStatus.currentIndex} / {scraperStatus.totalItems}
                            </div>
                            <div className={isStale ? 'scraper-stale' : 'scraper-fresh'} style={{ fontSize: '0.68rem', marginTop: '0.2rem' }}>
                                {isStale ? 'STALE' : 'LIVE'} - {freshnessText}
                            </div>
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', height: '3px', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${(scraperStatus.currentIndex / scraperStatus.totalItems) * 100}%`, 
                                    background: 'var(--text-accent)', 
                                    height: '100%',
                                    borderRadius: '2px',
                                    transition: 'width 0.5s ease'
                                }}></div>
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initializing...</div>
                    )}
                </div>
            </div>
        </>
    );
}
