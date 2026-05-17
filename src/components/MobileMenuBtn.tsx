"use client";

import { Menu, X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { usePreferences } from '@/lib/preferences';

export default function MobileMenuBtn() {
    const { mobileOpen, toggleMobile } = useSidebar();
    const { preferences, loaded } = usePreferences();
    const commandMode = preferences.mobileNavigationStyle === 'command';

    if (!loaded || commandMode) return null;

    return (
        <>
            <button
                id="app-mobile-menu-button"
                onClick={toggleMobile}
                className="mobile-menu-btn"
                aria-label="Toggle menu"
                aria-controls="app-sidebar"
                aria-expanded={mobileOpen}
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </>
    );
}
