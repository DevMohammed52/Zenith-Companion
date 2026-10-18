"use client";

import { Home, MapPin, Minus, Plus, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { HOUSING_LOCATIONS, getHousingActivityLabel } from "@/lib/housing";
import { formatHours } from "@/lib/format";
import { BUFF_ACTIVITIES, MODE_OPTIONS } from "../types";
import { ChoicePicker } from "./ChoicePicker";
import type { HousingState } from "../hooks/useHousingState";

export function HousingSetupTab({ state }: { state: HousingState }) {
  const {
    activeProfile,
    activeHousingTab,
    housing,
    saveHousing,
    canUseGuestAccess,
    openPicker,
    setOpenPicker,
    toggleFoundation,
    setExtraSlots,
    summary,
    selectedCostLabel,
    selectedBuildCost,
    selectedCostStatus,
  } = state;

  if (!activeProfile) return null;

  return (
    <>
      <section
        id="housing-tab-panel-setup"
        className={`housing-grid top-grid ${activeHousingTab !== "setup" ? "tab-hidden" : ""}`}
        role="tabpanel"
        aria-labelledby="housing-tab-setup"
        hidden={activeHousingTab !== "setup"}
      >
        <div className="housing-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Mode</p>
              <h2>Profile Housing</h2>
            </div>
            {housing.mode !== "none" && (
              <button className="ghost-button" type="button" onClick={() => saveHousing({ mode: "none" })}>
                <X size={16} /> Disable
              </button>
            )}
          </div>

          <div className="mode-grid">
            {MODE_OPTIONS.map((option) => {
              const blockedGuestOption = option.mode === "guest" && !canUseGuestAccess;
              return (
                <button
                  key={option.mode}
                  type="button"
                  className={`mode-card ${housing.mode === option.mode ? "active" : ""}`}
                  aria-pressed={housing.mode === option.mode}
                  disabled={blockedGuestOption}
                  onClick={() => {
                    if (blockedGuestOption) return;
                    saveHousing(option.mode === "none"
                      ? { mode: "none" }
                      : option.mode === "guest"
                        ? { mode: "guest" }
                        : { mode: "owner" });
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{blockedGuestOption ? `${activeProfile?.className || "This class"} cannot use guest access` : option.hint}</span>
                </button>
              );
            })}
          </div>

          {housing.mode === "owner" && (
            <div className="owner-setup-grid">
              <ChoicePicker
                label="House Location"
                value={housing.location}
                options={HOUSING_LOCATIONS.map((location) => ({ value: location, label: location }))}
                open={openPicker === "location"}
                setOpen={(open) => setOpenPicker(open ? "location" : null)}
                onChange={(location) => saveHousing({ location })}
                placeholder="Select location"
              />
              <button
                type="button"
                className={`foundation-toggle ${housing.foundationBuilt ? "active" : ""}`}
                aria-pressed={housing.foundationBuilt}
                onClick={toggleFoundation}
              >
                <strong>Foundation</strong>
                <span>{housing.foundationBuilt ? "Built - 1 free slot unlocked" : "Build first to unlock slots"}</span>
              </button>
              <div className="housing-field compact-field">
                <span>Extra Slots Built</span>
                <small>Foundation gives 1 slot. Each extra slot adds 1 more component slot.</small>
                <div className={`slot-stepper ${!housing.foundationBuilt ? "disabled" : ""}`}>
                  <button
                    type="button"
                    aria-label="Remove one extra slot"
                    disabled={!housing.foundationBuilt || housing.extraSlots <= 0}
                    onClick={() => setExtraSlots(housing.extraSlots - 1)}
                  >
                    <Minus size={15} />
                  </button>
                  <strong>{housing.extraSlots}</strong>
                  <button
                    type="button"
                    aria-label="Add one extra slot"
                    disabled={!housing.foundationBuilt || housing.extraSlots >= 15}
                    onClick={() => setExtraSlots(housing.extraSlots + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {housing.mode === "guest" && (
            <div className="guest-note">
              <Users size={18} />
              <span>Enter the host buffs this profile receives. No foundation or slots are needed for guest mode.</span>
            </div>
          )}
          {housing.mode === "none" && (
            <div className="guest-note inactive-note">
              <Home size={18} />
              <span>Housing buffs are disabled. Your owner build, guest buffs, and notes are preserved for when you switch back.</span>
            </div>
          )}
        </div>

        <div className="housing-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Summary</p>
              <h2>Active Buffs</h2>
            </div>
            <span className={`access-pill ${summary.availableAnywhere ? "good" : "limited"}`}>
              {summary.availableAnywhere ? "Available anywhere" : housing.mode !== "none" ? "Location-limited" : "Inactive"}
            </span>
          </div>

          <div className="stat-strip">
            <div><span>Components</span><strong>{summary.activeComponentCount}</strong></div>
            <div><span>Free Slots</span><strong>{summary.freeSlots}</strong></div>
            <div><span>Total Slots</span><strong>{summary.slotCapacity}/16</strong></div>
            <div>
              <span>{selectedCostLabel}</span>
              <strong className={selectedBuildCost.missingMaterials.length ? "needs-data-text" : ""}>{selectedCostStatus}</strong>
            </div>
            <div><span>Guests</span><strong>{summary.guestCapacity}</strong></div>
          </div>

          <div className="flag-grid">
            <span className={summary.remoteConduit ? "enabled" : ""}><MapPin size={15} /> Remote Conduit</span>
            <span className={summary.petQuarters ? "enabled" : ""}><Sparkles size={15} /> Pet Quarters</span>
            <span className={summary.houseLedger ? "enabled" : ""}><ShieldCheck size={15} /> House Ledger</span>
          </div>
        </div>
      </section>

      <section
        className={`housing-panel ${activeHousingTab !== "setup" ? "tab-hidden" : ""}`}
        hidden={activeHousingTab !== "setup"}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Buffs</p>
            <h2>Idle-Time Breakdown</h2>
          </div>
        </div>
        <div className="buff-grid">
          {BUFF_ACTIVITIES.map((activity) => (
            <div key={activity} className={summary.idleHours[activity] > 0 ? "active" : ""}>
              <span>{getHousingActivityLabel(activity)}</span>
              <strong>{formatHours(summary.idleHours[activity])}</strong>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`housing-panel ${activeHousingTab !== "setup" ? "tab-hidden" : ""}`}
        hidden={activeHousingTab !== "setup"}
      >
        <label className="housing-field">
          <span>Notes</span>
          <textarea
            aria-label="Housing notes"
            value={housing.notes}
            onChange={(event) => saveHousing({ notes: event.target.value })}
            placeholder="Private notes about this profile's house, guest host, or planned upgrades."
          />
        </label>
      </section>
    </>
  );
}
