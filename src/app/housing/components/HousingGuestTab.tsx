"use client";

import { Icon } from "@/components/ui/Icon";
import { HOUSING_LOCATIONS, getHousingActivityLabel } from "@/lib/housing";
import { formatHours } from "@/lib/format";
import { GUEST_BUFF_GROUPS, GUEST_BUFF_OPTIONS, getHousingActivityIcon } from "../types";
import { ChoicePicker } from "./ChoicePicker";
import type { HousingState } from "../hooks/useHousingState";

export function HousingGuestTab({ state }: { state: HousingState }) {
  const {
    activeProfile,
    housing,
    saveHousing,
    canUseGuestAccess,
    openPicker,
    setOpenPicker,
    guestBlockedClass,
    guestHasLocationLimitedBuffs,
    summary,
    updateGuestBuff,
  } = state;

  if (!activeProfile) return null;

  if (housing.mode !== "guest") {
    return (
      <section
        id="housing-tab-panel-guest"
        className="housing-panel guest-disabled-panel"
        role="tabpanel"
        aria-labelledby="housing-tab-guest"
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Guest Setup</p>
            <h2>Guest buffs are inactive</h2>
            <p>Switch this profile to Guest mode when the character is using another player&apos;s house.</p>
          </div>
          <button
            className="ghost-button"
            disabled={!canUseGuestAccess}
            type="button"
            onClick={() => saveHousing({ mode: "guest" })}
          >
            <Icon name="guilds" size="md" aria-hidden="true" /> Use Guest Mode
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="housing-tab-panel-guest"
      className="housing-panel"
      role="tabpanel"
      aria-labelledby="housing-tab-guest"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Guest Setup</p>
          <h2>Received Idle-Time Buffs</h2>
          <p>Choose the tier of each active host component you are using. T1 is 30m, then T2 1h, T3 2h, T4 3h, and T5 4h.</p>
        </div>
        <ChoicePicker
          label={housing.guestRemoteConduit ? "Guest Scope" : "Guest Buff Location"}
          value={housing.guestRemoteConduit ? "Available anywhere" : housing.location}
          options={housing.guestRemoteConduit
            ? [{ value: "Available anywhere", label: "Available anywhere", hint: "Remote Conduit is active" }]
            : HOUSING_LOCATIONS.map((location) => ({ value: location, label: location, hint: "Host buffs apply here" }))}
          open={openPicker === "guest-location"}
          setOpen={(open) => setOpenPicker(open ? "guest-location" : null)}
          onChange={(location) => {
            if (!housing.guestRemoteConduit) saveHousing({ location });
          }}
          placeholder="Select buff location"
        />
      </div>
      <div className="guest-context-grid">
        <label className="housing-field guest-host-field">
          <span>Host / Source</span>
          <input
            aria-label="Guest host or source"
            value={housing.guestHostName}
            onChange={(event) => saveHousing({ guestHostName: event.target.value })}
            placeholder="Host character, alt, guild house, or note"
          />
        </label>
        <div className={`guest-rule-card ${guestBlockedClass ? "warning" : ""}`}>
          <strong>{guestBlockedClass ? `${guestBlockedClass} cannot be a guest` : "Guest access overrides own house"}</strong>
          <span>
            {guestBlockedClass
              ? "This class cannot use house guest invitations because it cannot access trade systems."
              : "While this character is a guest, the host setup takes priority over this profile's own house bonuses."}
          </span>
        </div>
        <div className={`guest-rule-card ${guestHasLocationLimitedBuffs ? "warning" : ""}`}>
          <strong>{summary.availableAnywhere ? "Remote buffs apply anywhere" : "Local buffs need route location"}</strong>
          <span>
            {summary.availableAnywhere
              ? "Remote Conduit makes these received idle windows available across the world."
              : "Skill Profit keeps local guest buffs visible but does not apply them until route locations are available."}
          </span>
        </div>
        <div className="guest-rule-card">
          <strong>Host condition is manual</strong>
          <span>Turn off tiers if the host is repairing or has decayed rooms. Pet Quarters and House Ledger are tracked here only.</span>
        </div>
        <div className="guest-rule-card">
          <strong>Host capacity is not checked</strong>
          <span>This guest view assumes the host has enough Guest Quarters for your profile.</span>
        </div>
      </div>
      <div className="guest-buff-groups">
        {GUEST_BUFF_GROUPS.map((group) => {
          const activeCount = group.activities.filter((activity) => Number(housing.guestBuffs[activity] || 0) > 0).length;
          return (
            <section key={group.title} className="guest-buff-group" aria-labelledby={`guest-${group.title.toLowerCase().replaceAll(" ", "-")}`}>
              <div className="guest-buff-group-head">
                <h3 id={`guest-${group.title.toLowerCase().replaceAll(" ", "-")}`}>{group.title}</h3>
                <span className={`guest-group-count ${activeCount > 0 ? "active" : ""}`}>{activeCount} active</span>
              </div>
              <div className="guest-buff-grid">
                {group.activities.map((activity) => {
                  const currentHours = Number(housing.guestBuffs[activity] || 0);
                  return (
                    <div key={activity} className={`guest-buff-card ${currentHours > 0 ? "active" : ""}`}>
                      <div>
                        <span className="guest-activity-name">
                          <Icon name={getHousingActivityIcon(activity)} size="sm" aria-hidden="true" />
                          <span>{getHousingActivityLabel(activity)}</span>
                        </span>
                        <strong>{currentHours > 0 ? `+${formatHours(currentHours)}` : "No buff"}</strong>
                      </div>
                      <div className="guest-tier-row" role="group" aria-label={`${getHousingActivityLabel(activity)} guest buff tier`}>
                        {GUEST_BUFF_OPTIONS.map((option) => (
                          <button
                            key={`${activity}-${option.label}`}
                            type="button"
                            className={currentHours === option.hours ? "active" : ""}
                            aria-pressed={currentHours === option.hours}
                            onClick={() => updateGuestBuff(activity, option.hours)}
                            title={option.hours > 0 ? `${option.label}: +${formatHours(option.hours)}` : "No received buff"}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="guest-specials">
        <button
          type="button"
          className={housing.guestRemoteConduit ? "active" : ""}
          aria-pressed={housing.guestRemoteConduit}
          onClick={() => saveHousing({ guestRemoteConduit: !housing.guestRemoteConduit })}
        >
          <Icon name="map" size="md" aria-hidden="true" />
          <span className="guest-special-copy">
            <strong>Remote Conduit</strong>
            <small>Host makes these received buffs available anywhere.</small>
          </span>
          <span className="guest-special-state">{housing.guestRemoteConduit ? "Active" : "Off"}</span>
        </button>
        <button
          type="button"
          className={housing.guestPetQuarters ? "active" : ""}
          aria-pressed={housing.guestPetQuarters}
          onClick={() => saveHousing({ guestPetQuarters: !housing.guestPetQuarters })}
        >
          <Icon name="pets" size="md" aria-hidden="true" />
          <span className="guest-special-copy">
            <strong>Pet Quarters</strong>
            <small>Tracked only until pet sleep planning uses host access.</small>
          </span>
          <span className="guest-special-state">{housing.guestPetQuarters ? "Active" : "Off"}</span>
        </button>
        <button
          type="button"
          className={housing.guestHouseLedger ? "active" : ""}
          aria-pressed={housing.guestHouseLedger}
          onClick={() => saveHousing({ guestHouseLedger: !housing.guestHouseLedger })}
        >
          <Icon name="defense" size="md" aria-hidden="true" />
          <span className="guest-special-copy">
            <strong>House Ledger</strong>
            <small>Tracked only. Ledger benefits are not two-way.</small>
          </span>
          <span className="guest-special-state">{housing.guestHouseLedger ? "Active" : "Off"}</span>
        </button>
      </div>
    </section>
  );
}
