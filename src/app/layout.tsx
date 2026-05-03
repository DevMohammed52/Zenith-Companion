import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";

export const metadata: Metadata = {
  title: "Zenith Companion",
  description: "Helpful Tools for Idle MMO",
};

import { ItemModalProvider } from "@/context/ItemModalContext";
import { DataProvider } from "@/context/DataContext";
import { CraftingProvider } from "@/context/CraftingContext";
import { SidebarProvider } from "@/context/SidebarContext";
import MobileMenuBtn from "@/components/MobileMenuBtn";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <DataProvider>
          <CraftingProvider>
            <ItemModalProvider>
              <SidebarProvider>
                <div className="layout-root">
                  <Sidebar />
                  <div className="main-content">
                    <header className="top-navigation">
                      <MobileMenuBtn />
                      <GlobalSearch />
                    </header>
                    <div className="content-wrapper">
                      <div className="shell-desktop-search">
                        <GlobalSearch />
                      </div>
                      {children}
                    </div>
                  </div>
                </div>
              </SidebarProvider>
            </ItemModalProvider>
          </CraftingProvider>
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
              overflow: hidden;
            }
            .top-navigation .global-search-trigger {
              flex: 1 1 auto;
              margin: 0;
              max-width: none;
              min-width: 0;
              width: auto;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
