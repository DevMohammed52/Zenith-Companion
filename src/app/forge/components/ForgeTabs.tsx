"use client";

import type { KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FORGE_TABS, type ForgeState, type ForgeTab } from "../types";

function useSafePathname(): string | null {
  try {
    return usePathname();
  } catch {
    return null;
  }
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export interface ForgeTabsProps {
  state?: Partial<ForgeState>;
  activeTab?: ForgeTab;
  onTabChange?: (tab: ForgeTab) => void;
}

export function ForgeTabs({ state, activeTab: explicitTab, onTabChange }: ForgeTabsProps) {
  const pathname = useSafePathname();
  const router = useSafeRouter();
  const activeTab = explicitTab || state?.activeTab || "lessons";
  const isCraftRoute = pathname?.includes("/forge/craft");
  const effectiveTab = isCraftRoute ? "craft" : activeTab;

  const handleTabClick = (tabId: "lessons" | "craft") => {
    if (onTabChange) {
      onTabChange(tabId);
    } else if (state?.setActiveTab) {
      state.setActiveTab(tabId);
    }
    if (router) {
      if (tabId === "craft" && !isCraftRoute) {
        router.push("/forge/craft");
      } else if (tabId === "lessons" && isCraftRoute) {
        router.push("/forge/lessons");
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (state?.handleTabKeyDown) {
      state.handleTabKeyDown(event, index);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (index + 1) % FORGE_TABS.length;
      handleTabClick(FORGE_TABS[nextIndex].id as "lessons" | "craft");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (index - 1 + FORGE_TABS.length) % FORGE_TABS.length;
      handleTabClick(FORGE_TABS[prevIndex].id as "lessons" | "craft");
    }
  };

  return (
    <nav className="forge-tabs" aria-label="Forge sections" role="tablist" aria-orientation="horizontal">
      {FORGE_TABS.map((tab, tabIndex) => {
        const isActive = effectiveTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`forge-tab-${tab.id}`}
            ref={(element) => {
              if (state?.tabButtonRefs?.current) {
                state.tabButtonRefs.current[tab.id] = element;
              }
            }}
            type="button"
            role="tab"
            className={isActive ? "active" : ""}
            aria-selected={isActive}
            aria-controls={`forge-tab-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabClick(tab.id as "lessons" | "craft")}
            onKeyDown={(event) => handleKeyDown(event, tabIndex)}
          >
            <span>{tab.label}</span>
            <small>{tab.hint}</small>
          </button>
        );
      })}
    </nav>
  );
}
