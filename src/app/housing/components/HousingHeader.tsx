"use client";

import { Clock, Coins, Home, MapPin, Package, TrendingUp, Users } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { HOUSING_TABS } from "../types";
import type { HousingState } from "../hooks/useHousingState";

export function HousingHeader({ state }: { state: HousingState }) {
  const {
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
        <div className="housing-hero-copy">
          <p className="eyebrow"><ZenithIcon name="housing" size={16} /> Housing Manager</p>
          <h1 id="housing-page-title">House Planner</h1>
          <p className="muted">
            Save this character&apos;s own house, guest host, room tiers, repair condition, and ROI assumptions in one local profile.
          </p>
          <div className="housing-hero-chips" aria-label="Housing context">
            <span><Users size={14} aria-hidden="true" /> {activeProfileName}</span>
            <span><Home size={14} aria-hidden="true" /> {housingModeLabel}</span>
            <span className={summary.availableAnywhere ? "good" : ""}><MapPin size={14} aria-hidden="true" /> {housingScopeLabel}</span>
          </div>
          {activeProfile && (
            <div className="housing-quick-actions" aria-label="Housing quick actions">
              <button type="button" aria-pressed={activeHousingTab === "setup"} onClick={() => setActiveHousingTab("setup")}>
                <Home size={15} aria-hidden="true" /> Setup
              </button>
              <button
                type="button"
                aria-pressed={activeHousingTab === (housing.mode === "guest" ? "guest" : "components")}
                onClick={() => setActiveHousingTab(housing.mode === "guest" ? "guest" : "components")}
              >
                <Package size={15} aria-hidden="true" /> {housing.mode === "guest" ? "Guest" : "Rooms"}
              </button>
              <button type="button" aria-pressed={activeHousingTab === "profit"} disabled={housing.mode !== "owner"} onClick={() => setActiveHousingTab("profit")}>
                <TrendingUp size={15} aria-hidden="true" /> ROI
              </button>
            </div>
          )}
        </div>
        <div className="housing-status-card">
          <span>{activeProfile?.name || "No profile"}</span>
          <strong>{housing.mode === "owner" ? "Owner" : housing.mode === "guest" ? "Guest" : "No house"}</strong>
          <em>{housing.mode === "guest" && housing.guestHostName ? `Host: ${housing.guestHostName}` : strongestBonusLabel}</em>
          <div className="housing-status-details" aria-label="Housing summary">
            <span><Clock size={14} aria-hidden="true" /> {strongestBonusLabel}</span>
            <span><Package size={14} aria-hidden="true" /> {housingReadinessLabel}</span>
            <span className={selectedBuildCost.missingMaterials.length ? "needs-data" : ""}><Coins size={14} aria-hidden="true" /> {selectedCostStatus}</span>
          </div>
        </div>
      </section>

      {activeProfile && (
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
