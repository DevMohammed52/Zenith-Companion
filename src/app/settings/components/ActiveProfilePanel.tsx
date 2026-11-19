"use client";

import Link from "next/link";
import { ExternalLink, UserRound } from "lucide-react";
import type { UseSettingsStateReturn } from "../types";

export default function ActiveProfilePanel({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    | "needsProfileSetup"
    | "activeProfile"
    | "profileLabel"
    | "profileBarteringPercent"
    | "profileConquest"
    | "profileDailyBonus"
  >;
}) {
  const {
    needsProfileSetup,
    activeProfile,
    profileLabel,
    profileBarteringPercent,
    profileConquest,
    profileDailyBonus,
  } = state;

  return (
    <div className="settings-panel">
      <h2><UserRound size={17} /> Active Profile Values</h2>
      <p className="settings-panel-note">Read-only values from the active profile. Edit character-owned stats from Profiles.</p>
      {!needsProfileSetup && activeProfile ? (
        <>
          <div className="settings-active-profile">
            <strong>{activeProfile.name?.trim() || "No active profile"}</strong>
            <span>{profileLabel}</span>
          </div>
          <div className="profile-settings-readout">
            <div>
              <span>Bartering Level</span>
              <strong>{Number(activeProfile.boosts.barteringLevel || 0).toLocaleString()}</strong>
              <small>+{profileBarteringPercent}% vendor value</small>
            </div>
            <div>
              <span>Conquest</span>
              <strong>{profileConquest === "none" ? "None" : profileConquest}</strong>
              <small>Used by supported profit views</small>
            </div>
            <div>
              <span>Daily Streak</span>
              <strong>{Number(activeProfile.magicFind.dailyStreak || 0).toLocaleString()}</strong>
              <small>+{profileDailyBonus}% magic find cap</small>
            </div>
            <div>
              <span>Magic Find</span>
              <strong>
                {Number(activeProfile.magicFind.combat || 0)} / {Number(activeProfile.magicFind.dungeon || 0)} / {Number(activeProfile.magicFind.worldBoss || 0)}
              </strong>
              <small>Combat / dungeon / world boss</small>
            </div>
          </div>
          <Link className="settings-link-button settings-profile-edit-link" href="/profiles#profile-magic">
            Edit Profile Values <ExternalLink size={14} />
          </Link>
        </>
      ) : (
        <div className="settings-empty-state">
          <strong>Profile setup needed</strong>
          <span>Import or create a profile so calculators can use your class, tools, buffs, pets, and magic find instead of generic defaults.</span>
          <Link className="settings-link-button" href="/profiles">
            Set up profile <ExternalLink size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
