"use client";

import { GoldIcon } from "@/components/GoldIcon";
import { Icon } from "@/components/ui/Icon";
import { formatHours, formatGoldUnit } from "@/lib/format";
import { getHousingActivityLabel } from "@/lib/housing";
import { getHousingActivityIcon } from "../types";
import type { HousingState } from "../hooks/useHousingState";

export function HousingOverviewTab({ state }: { state: HousingState }) {
  const {
    activeProfile,
    housing,
    summary,
    strongestBonusLabel,
    guestHostLabel,
    selectedCostLabel,
    selectedCostStatus,
    selectedBuildCost,
    activeIdleBuffs,
    setActiveHousingTab,
    guestBlockedClass,
    foundationComponent,
    repairDecayDays,
  } = state;

  if (!activeProfile) return null;

  return (
    <section
      id="housing-tab-panel-overview"
      className="housing-overview-grid"
      role="tabpanel"
      aria-labelledby="housing-tab-overview"
      aria-label="Housing overview"
    >
      <article className="housing-panel overview-card overview-primary-card">
        <div className="overview-card-head">
          <div>
            <p className="eyebrow">Status</p>
            <h2>{housing.mode === "owner" ? "Owner House" : housing.mode === "guest" ? "Guest House" : "Housing Disabled"}</h2>
          </div>
          <span className={`access-pill ${summary.availableAnywhere ? "good" : "limited"}`}>
            {summary.availableAnywhere ? "Anywhere" : housing.mode !== "none" ? "Location-limited" : "Inactive"}
          </span>
        </div>
        <div className="overview-hero-stat">
          <span>Strongest buff</span>
          <strong>{strongestBonusLabel}</strong>
          <small>
            {housing.mode === "none"
              ? "Saved owner and guest setup is preserved, but buffs are off."
              : housing.mode === "guest"
                ? `Guest host: ${guestHostLabel}`
                : `Profile: ${activeProfile.name}`}
          </small>
        </div>
        <div className="overview-stat-grid compact">
          <div><span>Components</span><strong>{summary.activeComponentCount}</strong></div>
          <div><span>Slots</span><strong>{summary.slotCapacity}/16</strong></div>
          <div>
            <span>{selectedCostLabel}</span>
            <strong className={selectedBuildCost.missingMaterials.length ? "needs-data-text" : "inline-gold-value"}>
              {!selectedBuildCost.missingMaterials.length && <GoldIcon size={14} />}
              <span>{selectedCostStatus}</span>
            </strong>
          </div>
          <div>
            <span>{housing.mode === "guest" ? "Host" : "Guests"}</span>
            <strong>{housing.mode === "guest" ? guestHostLabel : summary.guestCapacity}</strong>
          </div>
        </div>
      </article>

      <article className="housing-panel overview-card">
        <div className="overview-card-head">
          <div>
            <p className="eyebrow">Active Buffs</p>
            <h2>Idle Windows</h2>
          </div>
          <button type="button" className="inline-link-button" onClick={() => setActiveHousingTab("setup")}>
            Edit
          </button>
        </div>
        {activeIdleBuffs.length ? (
          <div className="overview-chip-list">
            {activeIdleBuffs.slice(0, 6).map((activity) => (
              <span key={activity}>
                <Icon name={getHousingActivityIcon(activity)} size="xs" aria-hidden="true" />
                <span>{getHousingActivityLabel(activity)}</span>
                <strong>+{formatHours(summary.idleHours[activity])}</strong>
              </span>
            ))}
            {activeIdleBuffs.length > 6 && <em>+{activeIdleBuffs.length - 6} more</em>}
          </div>
        ) : (
          <p className="overview-empty-copy">No housing buffs are active for this profile.</p>
        )}
      </article>

      <article className="housing-panel overview-card">
        <div className="overview-card-head">
          <div>
            <p className="eyebrow">{housing.mode === "guest" ? "Guest Access" : "Build State"}</p>
            <h2>Setup Checks</h2>
          </div>
          <button type="button" className="inline-link-button" onClick={() => setActiveHousingTab(housing.mode === "guest" ? "guest" : "components")}>
            {housing.mode === "guest" ? "Guest" : "Components"}
          </button>
        </div>
        <div className="overview-check-list">
          {housing.mode === "guest" ? (
            <>
              <span className={housing.guestHostName ? "done" : ""}><Icon name="guilds" size="sm" aria-hidden="true" /> Host {guestHostLabel}</span>
              <span className={summary.availableAnywhere ? "done" : ""}><Icon name="map" size="sm" aria-hidden="true" /> {summary.availableAnywhere ? "Remote Conduit active" : `Local to ${housing.location || "host location"}`}</span>
              <span className={guestBlockedClass ? "" : "done"}><Icon name={guestBlockedClass ? "warning" : "check"} size="sm" aria-hidden="true" /> {guestBlockedClass ? `${guestBlockedClass} cannot be a guest` : "Class can use guest access"}</span>
              <span><Icon name="timer" size="sm" aria-hidden="true" /> Host repair and decay status is manual</span>
            </>
          ) : (
            <>
              <span className={housing.foundationBuilt ? "done" : ""}><Icon name="check" size="sm" aria-hidden="true" /> Foundation {housing.foundationBuilt ? "built" : `${formatGoldUnit(foundationComponent?.goldCost || 25000)} / 6h`}</span>
              <span><Icon name="timer" size="sm" aria-hidden="true" /> Repair cycle {repairDecayDays} days after repair</span>
              <span className={summary.remoteConduit ? "done" : ""}><Icon name="map" size="sm" aria-hidden="true" /> Remote Conduit {summary.remoteConduit ? "active" : "not active"}</span>
              <span className={summary.petQuarters ? "done" : ""}><Icon name="pets" size="sm" aria-hidden="true" /> Pet Quarters {summary.petQuarters ? "active" : "not active"}</span>
              <span className={summary.houseLedger ? "done" : ""}><Icon name="scroll" size="sm" aria-hidden="true" /> House Ledger {summary.houseLedger ? "active" : "not active"}</span>
            </>
          )}
        </div>
      </article>
    </section>
  );
}
