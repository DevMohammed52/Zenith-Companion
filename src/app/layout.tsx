import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ShellHeader from "@/components/ShellHeader";
import SiteFooter from "@/components/SiteFooter";
import shellStyles from "./Shell.module.css";
import ZenithAudio from "@/components/ZenithAudio";
import ZenithHaptics from "@/components/ZenithHaptics";
import FirstRunSetup from "@/components/FirstRunSetup";
import LocalBackupReminder from "@/components/LocalBackupReminder";
import UsageTracker from "@/components/UsageTracker";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import OfflineSupport from "@/components/OfflineSupport";
import PwaInstallPromptCapture from "@/components/PwaInstallPromptCapture";

export const metadata: Metadata = {
  metadataBase: new URL("https://zenith-companion.vercel.app"),
  applicationName: "Zenith Companion",
  title: {
    default: "Zenith Companion — IdleMMO Market & Character Tools",
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
    title: "Zenith Companion — IdleMMO Market & Character Tools",
    description:
      "Profile-aware IdleMMO tools for market checks, skilling routes, item intelligence, combat planning, and world boss decisions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenith Companion — IdleMMO Market & Character Tools",
    description:
      "Profile-aware IdleMMO tools for market checks, skilling routes, item intelligence, combat planning, and world boss decisions.",
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
  themeColor: "#0a0d14",
  colorScheme: "dark",
};

import { ItemModalProvider } from "@/context/ItemModalContext";
import { DataProvider } from "@/context/DataContext";
import { CraftingProvider } from "@/context/CraftingContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ProfileProvider } from "@/lib/profiles";
import { ToastProvider } from "@/components/ui/Toast";
import MobileBottomDock from "@/components/MobileBottomDock";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://zenith-companion.vercel.app/#website",
      "url": "https://zenith-companion.vercel.app",
      "name": "Zenith Companion",
      "alternateName": ["IdleMMO Companion", "Zenith IdleMMO"],
      "description":
        "Profile-aware IdleMMO companion for live market prices, alchemy profit calculations, world boss timers, combat simulation, and character planning.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://zenith-companion.vercel.app/items?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://zenith-companion.vercel.app/#webapp",
      "url": "https://zenith-companion.vercel.app",
      "name": "Zenith Companion",
      "applicationCategory": "GameApplication, UtilityApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "description":
        "Comprehensive web companion and market analytics toolkit for IdleMMO players.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "featureList": [
        "IdleMMO Alchemy Profit Calculator",
        "IdleMMO Item Market Prices and Volume Analytics",
        "IdleMMO World Boss Timers and Respawn Trackers",
        "IdleMMO Combat Simulator",
        "IdleMMO Skill Profit Optimizers",
      ],
    },
  ],
};

const PRE_PAINT_INIT_SCRIPT = `(function(){var d=document.documentElement;d.dataset.theme="ember";d.dataset.desktopNavigation="sidebar";d.dataset.mobileNavigation="standard";d.dataset.profileSetup="needed";try{var rawPref=localStorage.getItem("zenith_preferences");var pref=rawPref?JSON.parse(rawPref):null;if(pref&&typeof pref.theme==="string")d.dataset.theme=pref.theme;if(pref&&pref.desktopNavigationStyle==="dock")d.dataset.desktopNavigation="dock";if(pref&&pref.mobileNavigationStyle==="command")d.dataset.mobileNavigation="command";}catch(e){}try{var rawProf=localStorage.getItem("zenith_character_profiles_v1");var profState=rawProf?JSON.parse(rawProf):null;var list=profState&&Array.isArray(profState.profiles)?profState.profiles:[];var active=list.find(function(p){return p&&p.id===profState.activeProfileId;})||list[0]||null;var totalLvl=active&&active.levels&&active.levels.totalLevel!==undefined?Number(active.levels.totalLevel):20;var combatLvl=active&&active.levels&&active.levels.combat!==undefined?Number(active.levels.combat):1;var barterLvl=active&&active.boosts&&active.boosts.barteringLevel!==undefined?Number(active.boosts.barteringLevel):0;var cls=active&&typeof active.className==="string"&&active.className?active.className:"Warrior";var isStarter=!active||(String(active.name||"Main Character").trim()==="Main Character"&&cls==="Warrior"&&totalLvl===20&&combatLvl===1&&barterLvl===0&&(!active.importSource||active.importSource.mode==="manual")&&(!active.importSource||!Array.isArray(active.importSource.importedSections)||active.importSource.importedSections.length===0)&&(!active.fieldSources||Object.keys(active.fieldSources).length===0));d.dataset.profileSetup=isStarter?"needed":"ready";}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="zenith-pre-paint-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: PRE_PAINT_INIT_SCRIPT }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <DataProvider>
          <ProfileProvider>
            <ToastProvider>
              <CraftingProvider>
                <ItemModalProvider>
                  <SidebarProvider>
                    <div className={`${shellStyles.layoutRoot} layout-root`}>
                      <Sidebar />
                      <MobileBottomDock />
                      <ZenithAudio />
                      <ZenithHaptics />
                      <FirstRunSetup />
                      <LocalBackupReminder />
                      <UsageTracker />
                      <WebVitalsReporter />
                      <PwaInstallPromptCapture />
                      <OfflineSupport />
                      <div className={`${shellStyles.mainContent} main-content`}>
                        <ShellHeader />
                        <div className={`${shellStyles.contentWrapper} content-wrapper`}>
                          {children}
                          <SiteFooter />
                          <div id="zenith-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
                        </div>
                      </div>
                    </div>
                  </SidebarProvider>
                </ItemModalProvider>
              </CraftingProvider>
            </ToastProvider>
          </ProfileProvider>
        </DataProvider>
      </body>
    </html>
  );
}
