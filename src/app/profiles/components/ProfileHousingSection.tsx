"use client";

import React from "react";
import { Home } from "lucide-react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { formatHours, getHousingActivityLabel, type HousingBuffSummary } from "@/lib/housing";
import { FieldSourceChip } from "./ProfileControls";

export interface ProfileHousingSectionProps {
  profile: CharacterProfile;
  housingSummary: HousingBuffSummary;
  canUseGuestHousing: boolean;
  updateNested: <Section extends keyof CharacterProfile, Key extends keyof CharacterProfile[Section]>(
    section: Section,
    key: Key,
    value: CharacterProfile[Section][Key],
  ) => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
}

export function ProfileHousingSection({
  profile,
  housingSummary,
  canUseGuestHousing,
  updateNested,
  fieldSource,
}: ProfileHousingSectionProps) {
  return (
    <section id="profile-housing" className="profile-panel" tabIndex={-1}>
      <div className="profile-panel-heading">
        <div>
          <h2>Housing Snapshot</h2>
          <p>Housing is profile-scoped and powers connected timers where available.</p>
        </div>
        <a className="profile-secondary-link" href="/housing"><Home size={16} /> Open Housing</a>
      </div>
      <div className="profile-grid">
        <div className="profile-field profile-field-wide">
          <span className="profile-field-labelrow">
            <span>Mode</span>
            <FieldSourceChip source={fieldSource("housing.mode")} />
          </span>
          <div className="profile-housing-mode-grid" role="group" aria-label="Housing mode">
            {[
              { value: "none", label: "None", hint: "No house buffs" },
              { value: "owner", label: "Owner", hint: "Use built components" },
              { value: "guest", label: "Guest", hint: "Use received buffs" },
            ].map((option) => {
              const blockedGuestOption = option.value === "guest" && !canUseGuestHousing;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={profile.housing.mode === option.value ? "active" : ""}
                  disabled={blockedGuestOption}
                  onClick={() => {
                    if (blockedGuestOption) return;
                    updateNested("housing", "mode", option.value as CharacterProfile["housing"]["mode"]);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{blockedGuestOption ? `${profile.className} cannot use guest access` : option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="profile-info-card">
          <strong>{housingSummary.availableAnywhere ? "Available anywhere" : housingSummary.locationLimited ? "Location-limited" : "Inactive"}</strong>
          <span>
            {housingSummary.strongestIdleBonus
              ? `${getHousingActivityLabel(housingSummary.strongestIdleBonus.activity)} +${formatHours(housingSummary.strongestIdleBonus.hours)}`
              : "No active idle-time bonus"}
          </span>
        </div>
        <div className="profile-info-card">
          <strong>{housingSummary.activeComponentCount} active</strong>
          <span>{housingSummary.guestCapacity ? `${housingSummary.guestCapacity} guest slots` : "No guest capacity"}</span>
        </div>
        <label className="profile-field profile-field-wide">
          <span className="profile-field-labelrow">
            <span>Housing Notes</span>
            <FieldSourceChip source={fieldSource("housing.notes")} />
          </span>
          <textarea className="control-input" value={profile.housing.notes} onChange={(event) => updateNested("housing", "notes", event.target.value)} />
        </label>
      </div>
    </section>
  );
}
