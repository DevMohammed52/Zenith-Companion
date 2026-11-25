"use client";

import { Icon } from '@/components/ui/Icon';
import { useSidebar } from '@/context/SidebarContext';

export default function MobileMenuBtn() {
    const { mobileOpen, toggleMobile } = useSidebar();

    return (
        <button
            id="app-mobile-menu-button"
            type="button"
            onClick={toggleMobile}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            aria-controls="app-sidebar"
            aria-expanded={mobileOpen}
        >
            <Icon name={mobileOpen ? "close" : "menu"} size={20} />
        </button>
    );
}
