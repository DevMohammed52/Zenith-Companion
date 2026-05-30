import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import SiteFooter from "@/components/SiteFooter";
import RotatingTips from "@/components/RotatingTips";
import ZenithAudio from "@/components/ZenithAudio";
import ZenithHaptics from "@/components/ZenithHaptics";
import FirstRunSetup from "@/components/FirstRunSetup";
import LocalBackupReminder from "@/components/LocalBackupReminder";
import UsageTracker from "@/components/UsageTracker";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import OfflineSupport from "@/components/OfflineSupport";
import DataFreshnessBanner from "@/components/DataFreshnessBanner";
import PwaInstallPromptCapture from "@/components/PwaInstallPromptCapture";

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
                    <RotatingTips />
                    <ZenithAudio />
                    <ZenithHaptics />
                    <FirstRunSetup />
                    <LocalBackupReminder />
                    <UsageTracker />
                    <WebVitalsReporter />
                    <PwaInstallPromptCapture />
                    <OfflineSupport />
                    <DataFreshnessBanner />
                    <div className="main-content">
                      <header className="top-navigation">
                        <MobileMenuBtn />
                        <GlobalSearch />
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
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 0.85rem 1.4rem;
            margin: clamp(2.5rem, 5vw, 4rem) 0 0;
            padding: 1.15rem clamp(1rem, 2.8vw, 2.4rem) calc(1.15rem + env(safe-area-inset-bottom));
            border-top: 1px solid rgba(148, 163, 184, 0.14);
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.026), rgba(255, 255, 255, 0)),
              rgba(5, 8, 15, 0.42);
            color: var(--text-muted);
          }
          .site-footer-brand {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: start;
            gap: 0.7rem;
            min-width: 0;
          }
          .site-footer-mark {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: 1px solid rgba(56, 189, 248, 0.24);
            border-radius: 8px;
            background: rgba(14, 165, 233, 0.08);
            color: rgb(125, 211, 252);
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
          .site-footer-copy span {
            max-width: 64rem;
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
            transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
          }
          a.site-footer-pill:hover,
          a.site-footer-pill:focus-visible {
            border-color: rgba(59, 130, 246, 0.44);
            color: var(--text-primary);
            background: rgba(59, 130, 246, 0.1);
            outline: none;
            transform: translateY(-1px);
          }
          a.site-footer-pill:active {
            transform: scale(0.985);
          }
          .site-footer-disclaimer {
            grid-column: 1 / -1;
            margin: 0;
            max-width: 70rem;
            color: rgba(148, 163, 184, 0.72);
            font-size: 0.75rem;
            line-height: 1.45;
          }
          .rotating-tip {
            position: fixed;
            right: 1rem;
            bottom: 1rem;
            z-index: 950;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            gap: 0.75rem;
            align-items: start;
            width: min(380px, calc(100vw - 2rem));
            padding: 0.85rem;
            border: 1px solid rgba(96, 165, 250, 0.24);
            border-radius: 8px;
            background: rgba(7, 12, 23, 0.94);
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38);
            color: var(--text-secondary);
            backdrop-filter: blur(16px);
            isolation: isolate;
            overflow: hidden;
            transform-origin: bottom right;
            transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
            will-change: transform;
            animation: rotatingTipIn 180ms ease-out;
          }
          .rotating-tip::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 0;
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0) 42%),
              radial-gradient(circle at 18% 0%, rgba(96, 165, 250, 0.18), transparent 34%);
            opacity: 0.6;
            pointer-events: none;
            transition: opacity 180ms ease;
          }
          .rotating-tip > * {
            position: relative;
            z-index: 1;
          }
          .rotating-tip:hover,
          .rotating-tip:focus-within {
            border-color: rgba(125, 211, 252, 0.42);
            box-shadow: 0 22px 52px rgba(0, 0, 0, 0.44), 0 0 0 1px rgba(56, 189, 248, 0.08);
            transform: translateY(-2px);
          }
          .rotating-tip:hover::before,
          .rotating-tip:focus-within::before {
            opacity: 0.9;
          }
          .rotating-tip-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 7px;
            background: rgba(59, 130, 246, 0.14);
            color: rgb(147, 197, 253);
          }
          .rotating-tip-success .rotating-tip-icon {
            background: rgba(34, 197, 94, 0.14);
            color: rgb(134, 239, 172);
          }
          .rotating-tip-warning .rotating-tip-icon {
            background: rgba(245, 158, 11, 0.15);
            color: rgb(252, 211, 77);
          }
          .rotating-tip-contact .rotating-tip-icon {
            background: rgba(99, 102, 241, 0.16);
            color: rgb(165, 180, 252);
          }
          .rotating-tip-copy {
            display: grid;
            gap: 0.2rem;
            min-width: 0;
            font-size: 0.82rem;
            line-height: 1.4;
          }
          .rotating-tip-copy strong {
            color: var(--text-primary);
            font-size: 0.86rem;
          }
          .rotating-tip-copy span {
            overflow-wrap: anywhere;
          }
          .rotating-tip-action {
            align-items: center;
            border: 1px solid rgba(96, 165, 250, 0.34);
            border-radius: 7px;
            color: rgb(191, 219, 254);
            display: inline-flex;
            font-size: 0.78rem;
            font-weight: 800;
            justify-content: center;
            justify-self: start;
            line-height: 1;
            margin-top: 0.25rem;
            min-height: 32px;
            padding: 0.45rem 0.65rem;
            text-decoration: none;
            transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
          }
          .rotating-tip-action:hover,
          .rotating-tip-action:focus-visible {
            background: rgba(59, 130, 246, 0.14);
            border-color: rgba(147, 197, 253, 0.58);
            color: #fff;
            outline: none;
            transform: translateY(-1px);
          }
          .rotating-tip-action:active {
            transform: scale(0.985);
          }
          .rotating-tip button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 7px;
            background: rgba(255, 255, 255, 0.04);
            color: var(--text-muted);
            cursor: pointer;
            transition: border-color 160ms ease, background 160ms ease, color 160ms ease, transform 160ms ease;
          }
          .rotating-tip button:hover,
          .rotating-tip button:focus-visible {
            color: var(--text-primary);
            border-color: rgba(148, 163, 184, 0.38);
            outline: none;
          }
          .rotating-tip button:active {
            transform: scale(0.96);
          }
          @keyframes rotatingTipIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .rotating-tip {
              animation: none;
              transition: none;
            }
            .rotating-tip-action,
            .rotating-tip button {
              transition: none;
            }
            .rotating-tip:hover,
            .rotating-tip:focus-within {
              transform: none;
            }
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
              grid-template-columns: 1fr;
              margin: 1rem;
              padding: 1rem 0 1.2rem;
            }
            .site-footer-actions {
              justify-content: flex-start;
            }
            .rotating-tip {
              right: 0.75rem;
              bottom: calc(5.65rem + env(safe-area-inset-bottom));
              width: calc(100vw - 1.5rem);
            }
          }
          @media (max-width: 640px) {
            .site-footer {
              margin: 1rem 0 0;
              padding: 1rem 1rem calc(5.2rem + env(safe-area-inset-bottom));
            }
            .site-footer-brand {
              gap: 0.6rem;
            }
            .site-footer-mark {
              width: 32px;
              height: 32px;
            }
            .site-footer-actions {
              display: grid;
              grid-template-columns: 1fr;
              gap: 0.45rem;
            }
            .site-footer-pill {
              justify-content: flex-start;
              min-height: 38px;
              white-space: normal;
            }
            .rotating-tip {
              align-items: center;
              bottom: calc(4.5rem + env(safe-area-inset-bottom));
              gap: 0.55rem;
              padding: 0.6rem;
              width: calc(100vw - 1rem);
              right: 0.5rem;
            }
            .rotating-tip-icon {
              width: 28px;
              height: 28px;
            }
            .rotating-tip-copy {
              gap: 0.08rem;
              font-size: 0.74rem;
              line-height: 1.28;
            }
            .rotating-tip-copy strong {
              font-size: 0.78rem;
            }
            .rotating-tip-copy span {
              display: -webkit-box;
              overflow: hidden;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
            }
            .rotating-tip-action {
              min-height: 34px;
              padding: 0.42rem 0.58rem;
            }
            .rotating-tip button {
              width: 34px;
              height: 34px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
