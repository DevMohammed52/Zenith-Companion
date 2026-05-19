import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://zenith-companion.vercel.app"),
  applicationName: "Zenith Companion",
  title: {
    default: "Zenith Companion",
    template: "%s | Zenith Companion",
  },
  description:
    "Profile-aware IdleMMO tools for market checks, skilling routes, item intelligence, combat planning, and world boss decisions.",
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
      "Profile-aware IdleMMO tools for market checks, skilling routes, item intelligence, combat planning, and world boss decisions.",
    images: [
      {
        url: "/readme/social-preview.png",
        width: 1280,
        height: 640,
        alt: "Zenith Companion product preview with dashboard and skill profit screenshots.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenith Companion",
    description:
      "Profile-aware IdleMMO tools for market checks, skilling routes, item intelligence, combat planning, and world boss decisions.",
    images: ["/readme/social-preview.png"],
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
                        <SiteFooter />
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
          .site-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin: 1.5rem clamp(1rem, 2vw, 2rem) 1.25rem;
            padding: 1rem;
            border: 1px solid rgba(148, 163, 184, 0.16);
            border-radius: 8px;
            background: rgba(8, 12, 22, 0.72);
            color: var(--text-muted);
          }
          .site-footer-copy {
            display: grid;
            gap: 0.25rem;
            min-width: 0;
            font-size: 0.82rem;
            line-height: 1.45;
          }
          .site-footer-copy strong {
            color: var(--text-primary);
            font-size: 0.86rem;
          }
          .site-footer-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 0.5rem;
            flex: 0 0 auto;
          }
          .site-footer-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            min-height: 34px;
            padding: 0.45rem 0.65rem;
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 7px;
            background: rgba(255, 255, 255, 0.035);
            color: var(--text-secondary);
            font-size: 0.78rem;
            font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
          }
          a.site-footer-pill:hover {
            border-color: rgba(59, 130, 246, 0.44);
            color: var(--text-primary);
            background: rgba(59, 130, 246, 0.1);
          }
          .site-footer-pill-muted {
            color: rgba(148, 163, 184, 0.66);
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
            .site-footer {
              align-items: stretch;
              flex-direction: column;
              margin: 1rem;
            }
            .site-footer-actions {
              justify-content: flex-start;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
