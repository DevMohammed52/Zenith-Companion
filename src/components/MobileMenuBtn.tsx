"use client";

import { Menu, X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function MobileMenuBtn() {
    const { mobileOpen, toggleMobile } = useSidebar();

    return (
        <button 
            onClick={toggleMobile} 
            className="mobile-menu-btn" 
            aria-label="Toggle menu"
        >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
    );
}
