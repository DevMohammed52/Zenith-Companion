"use client";

import { GoldIcon } from "@/components/GoldIcon";
import { Icon } from "@/components/ui/Icon";
import { HOUSING_TABS } from "../types";
import type { HousingState } from "../hooks/useHousingState";

export function HousingHeader({ state }: { state: HousingState }) {
  const {
    loaded,
    activeProfile,
    activeProfileName,
    housingModeLabel,
    housingScopeLabel,
    summary,
    activeHousingTab,
    setActiveHousingTab,
    housing,
    strongestBonusLabel,
    housingReadinessLabel,
    selectedBuildCost,
    selectedCostStatus,
    tabButtonRefs,
    handleHousingTabKeyDown,
  } = state;

  return (
    <>
      <section className="page-title-row">
        <p className="eyebrow">
          <Icon name="housing" size="sm" aria-hidden="true" />
          <span>Housing</span>
        </p>
        <h1 id="housing-page-title">House Planner</h1>
        <p className="muted">
          Configure your house, guest host, room tiers, repairs, and upgrade profits for {activeProfileName}.
        </p>
        <div className="housing-hero-chips" aria-label="Housing context">
          <span>
            <Icon name="profile" size="xs" aria-hidden="true" />
            <span>{activeProfileName}</span>
          </span>
          <span>
            <Icon name="housing" size="xs" aria-hidden="true" />
            <span>{housingModeLabel}</span>
          </span>
          <span className={summary.availableAnywhere ? "good" : ""}>
            <Icon name="map" size="xs" aria-hidden="true" />
            <span>{housingScopeLabel}</span>
          </span>
          <span>
            <Icon name="timer" size="xs" aria-hidden="true" />
            <span>{strongestBonusLabel}</span>
          </span>
          <span>
            <Icon name="items" size="xs" aria-hidden="true" />
            <span>{housingReadinessLabel}</span>
          </span>
          {housing.mode === "owner" && (
            <span className={selectedBuildCost.missingMaterials.length ? "needs-data" : ""}>
              <GoldIcon size={13} />
              <span>{selectedCostStatus}</span>
            </span>
          )}
        </div>
      </section>

      {(!loaded || activeProfile) && (
        <nav className="housing-tabs" aria-label="Housing sections" role="tablist" aria-orientation="horizontal">
          {HOUSING_TABS.map((tab, tabIndex) => (
            <button
              key={tab.id}
              id={`housing-tab-${tab.id}`}
              ref={(element) => {
                tabButtonRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              disabled={!loaded}
              className={activeHousingTab === tab.id ? "active" : ""}
              aria-current={activeHousingTab === tab.id ? "page" : undefined}
              aria-selected={activeHousingTab === tab.id}
              aria-controls={`housing-tab-panel-${tab.id}`}
              tabIndex={activeHousingTab === tab.id ? 0 : -1}
              onClick={() => setActiveHousingTab(tab.id)}
              onKeyDown={(event) => handleHousingTabKeyDown(event, tabIndex)}
            >
              <span>{tab.label}</span>
              <small>{tab.hint}</small>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
