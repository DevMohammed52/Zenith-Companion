"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const SIDEBAR_RAIL_STORAGE_KEY = 'zenith.sidebar.railMode.v1';

interface SidebarContextType {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    toggleMobile: () => void;
    railMode: boolean;
    setRailMode: (rail: boolean) => void;
    toggleRailMode: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [railMode, setRailModeState] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(SIDEBAR_RAIL_STORAGE_KEY);
            if (saved === 'true') {
                setRailModeState(true);
                document.documentElement.dataset.sidebarRail = 'true';
            } else {
                document.documentElement.dataset.sidebarRail = 'false';
            }
        } catch {}
        setHydrated(true);
    }, []);

    const setRailMode = (rail: boolean) => {
        setRailModeState(rail);
        try {
            window.localStorage.setItem(SIDEBAR_RAIL_STORAGE_KEY, rail ? 'true' : 'false');
            document.documentElement.dataset.sidebarRail = rail ? 'true' : 'false';
        } catch {}
    };

    const toggleRailMode = () => setRailMode(!railMode);
    const toggleMobile = () => setMobileOpen((open) => !open);

    return (
        <SidebarContext.Provider
            value={{
                mobileOpen,
                setMobileOpen,
                toggleMobile,
                railMode,
                setRailMode,
                toggleRailMode,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
