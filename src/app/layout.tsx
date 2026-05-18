import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import ProfileSwitcher from "@/components/ProfileSwitcher";

export const metadata: Metadata = {
  metadataBase: new URL("https://zenith-companion.vercel.app"),
  applicationName: "Zenith Companion",
  title: {
    default: "Zenith Companion",
    template: "%s | Zenith Companion",
  },
  description:
    "Tools for IdleMMO players to check prices, plan profiles, compare pets, track guilds, and find useful routes.",
  keywords: [
    "IdleMMO",
    "Idle MMO",
    "Zenith Companion",
    "IdleMMO tools",
    "IdleMMO market",
    "IdleMMO profile import",
    "IdleMMO guilds",
    "IdleMMO pets",
    "IdleMMO crafting",
  ],
  authors: [{ name: "Zenith Companion" }],
  creator: "Zenith Companion",
  publisher: "Zenith Companion",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://zenith-companion.vercel.app",
    siteName: "Zenith Companion",
    title: "Zenith Companion",
    description:
      "IdleMMO tools for prices, profiles, pets, guilds, crafting, and routes.",
  },
  twitter: {
    card: "summary",
    title: "Zenith Companion",
    description:
      "Useful IdleMMO tools for prices, profiles, pets, guilds, crafting, and routes.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070d",
  colorScheme: "dark",
};

import { ItemModalProvider } from "@/context/ItemModalContext";
import { DataProvider } from "@/context/DataContext";
import { CraftingProvider } from "@/context/CraftingContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ProfileProvider } from "@/lib/profiles";
import MobileMenuBtn from "@/components/MobileMenuBtn";
import MobileCommandWheelHost from "@/components/MobileCommandWheelHost";
import DesktopDock from "@/components/DesktopDock";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DataProvider>
          <ProfileProvider>
            <CraftingProvider>
              <ItemModalProvider>
                <SidebarProvider>
                  <div className="layout-root">
                    <Sidebar />
                    <MobileCommandWheelHost />
                    <DesktopDock />
                    <div className="main-content">
                      <header className="top-navigation">
                        <MobileMenuBtn />
                        <GlobalSearch hotkeyEnabled={false} />
                        <ProfileSwitcher compact />
                      </header>
                      <div className="content-wrapper">
                        <div className="shell-quickbar">
                          <GlobalSearch />
                          <ProfileSwitcher />
                        </div>
                        {children}
                        <div id="zenith-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
                      </div>
                    </div>
                  </div>
                </SidebarProvider>
              </ItemModalProvider>
            </CraftingProvider>
          </ProfileProvider>
        </DataProvider>
        <style>{`
          .layout-root {
            display: flex;
            min-height: 100vh;
          }
          .main-content {
            flex: 1;
            margin-left: var(--sidebar-width);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            min-width: 0;
            width: calc(100% - var(--sidebar-width));
          }

          @media (max-width: 1180px) {
            .main-content {
              margin-left: 0 !important;
              width: 100% !important;
            }
          }
          .content-wrapper {
            padding: 0;
            width: 100%;
            min-width: 0;
            overflow-x: clip;
          }
          .top-navigation {
            display: none;
          }
          @media (max-width: 1180px) {
            .main-content {
              margin-left: 0 !important;
              padding-top: 64px;
              width: 100% !important;
            }
            .top-navigation {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 0.75rem 1rem;
              background: var(--bg-panel);
              border-bottom: 1px solid var(--border-subtle);
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              z-index: 1000;
              height: 64px;
              backdrop-filter: blur(12px);
              overflow: visible;
            }
            .top-navigation .global-search-trigger {
              flex: 1 1 auto;
              margin: 0;
              max-width: none;
              min-width: 0;
              width: auto;
            }
            .top-navigation .profile-switcher {
              flex: 0 0 auto;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
