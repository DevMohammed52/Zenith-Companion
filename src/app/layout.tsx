import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Zenith Companion",
  description: "Helpful Tools for Idle MMO",
};

import { ItemModalProvider } from "@/context/ItemModalContext";
import { DataProvider } from "@/context/DataContext";
import { CraftingProvider } from "@/context/CraftingContext";

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
      <body className={`${inter.variable} ${jetbrains.variable}`}>
        <DataProvider>
          <CraftingProvider>
            <ItemModalProvider>
              <div className="layout-root">
                <header className="top-navigation">
                  <Sidebar />
                  <GlobalSearch />
                </header>
                <div className="main-content">
                  {children}
                </div>
              </div>
            </ItemModalProvider>
          </CraftingProvider>
        </DataProvider>
        <style>{`
          .layout-root {
            display: flex;
            min-height: 100vh;
          }
          .top-navigation {
            display: none;
          }
          .main-content {
            margin-left: var(--sidebar-width);
            width: 100%;
            transition: margin-left 0.3s ease;
            padding-top: 0;
          }
          @media (max-width: 768px) {
            .layout-root {
              flex-direction: column;
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
            }
            .main-content {
              margin-left: 0;
              padding-top: 64px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
