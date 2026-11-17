"use client";

import { FORGE_TABS, type ForgeState } from "../types";

export function ForgeTabs({ state }: { state: ForgeState }) {
  const { activeTab, setActiveTab, tabButtonRefs, handleTabKeyDown } = state;

  return (
    <nav className="forge-tabs" aria-label="Forge sections" role="tablist" aria-orientation="horizontal">
      {FORGE_TABS.map((tab, tabIndex) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`forge-tab-${tab.id}`}
            ref={(element) => {
              if (tabButtonRefs.current) {
                tabButtonRefs.current[tab.id] = element;
              }
            }}
            type="button"
            role="tab"
            className={isActive ? "active" : ""}
            aria-selected={isActive}
            aria-controls={`forge-tab-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, tabIndex)}
          >
            <span>{tab.label}</span>
            <small>{tab.hint}</small>
          </button>
        );
      })}
    </nav>
  );
}
