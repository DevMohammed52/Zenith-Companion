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
              <div style={{ display: 'flex' }}>
                <Sidebar />
                <div className="main-content">
                  <GlobalSearch />
                  {children}
                </div>
              </div>
            </ItemModalProvider>
          </CraftingProvider>
        </DataProvider>
        <style>{`
          .main-content {
            margin-left: var(--sidebar-width);
            width: 100%;
            min-height: 100vh;
            transition: margin-left 0.3s ease;
          }
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
