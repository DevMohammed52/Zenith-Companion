"use client";

import type { KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { FORGE_TABS, type ForgeState, type ForgeTab } from "../types";
import styles from "../Forge.module.css";

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
  const isLessonsRoute = pathname?.includes("/forge/lessons");
  const effectiveTab: ForgeTab = isCraftRoute ? "craft" : isLessonsRoute ? "lessons" : activeTab;

  const handleTabClick = (tabId: ForgeTab) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else if (state?.setActiveTab) {
      state.setActiveTab(tabId);
    }
    if (router) {
      if (tabId === "craft" && isLessonsRoute) {
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
      handleTabClick(FORGE_TABS[nextIndex].id);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (index - 1 + FORGE_TABS.length) % FORGE_TABS.length;
      handleTabClick(FORGE_TABS[prevIndex].id);
    } else if (event.key === "Home") {
      event.preventDefault();
      handleTabClick(FORGE_TABS[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      handleTabClick(FORGE_TABS[FORGE_TABS.length - 1].id);
    }
  };

  return (
    <nav className={styles.primaryTabsBar} aria-label="Forge workspace navigation">
      <div className={styles.primaryTabList} role="tablist" aria-label="Forge sections" aria-orientation="horizontal">
        {FORGE_TABS.map((tab, tabIndex) => {
          const isActive = effectiveTab === tab.id;
          const iconConcept = tab.id === "lessons" ? "forgeLessons" : "craftTool";
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
              className={styles.primaryTabButton}
              aria-selected={isActive}
              aria-controls={`forge-tab-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, tabIndex)}
            >
              <Icon name={iconConcept} size="sm" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
