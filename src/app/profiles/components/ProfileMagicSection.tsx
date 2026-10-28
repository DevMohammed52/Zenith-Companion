"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { ASSAULT_OPTIONS, getAssaultBuff, type AssaultRank } from "@/lib/skill-profit";
import { ProfileNumberField, ProfilePicker } from "./ProfileControls";

export interface ProfileMagicSectionProps {
  profile: CharacterProfile;
  dailyBonus: number;
  barteringPercent: number;
  openPicker: string | null;
  setOpenPicker: (id: string | null) => void;
  updateNested: <Section extends keyof CharacterProfile, Key extends keyof CharacterProfile[Section]>(
    section: Section,
    key: Key,
    value: CharacterProfile[Section][Key],
  ) => void;
  updateDailyStreak: (value: number | "") => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
}

export function ProfileMagicSection({
  profile,
  dailyBonus,
  barteringPercent,
  openPicker,
  setOpenPicker,
  updateNested,
  updateDailyStreak,
  fieldSource,
}: ProfileMagicSectionProps) {
  return (
    <section id="profile-magic" className="profile-panel" tabIndex={-1}>
      <div className="profile-panel-heading">
        <div>
          <h2>Magic, Efficiency, Timers</h2>
          <p>Daily streak, conquest, bartering level, efficiencies, and playtime belong to this character. Page-specific potions, shrine, essence, and weather stay on the relevant page.</p>
        </div>
        <div className="profile-stat-pill"><Sparkles size={14} /> +{dailyBonus}% streak MF</div>
      </div>
      <div className="profile-grid compact">
        <ProfileNumberField label="Combat Magic Find" value={profile.magicFind.combat} min={0} onChange={(value) => updateNested("magicFind", "combat", value)} source={fieldSource("magicFind.combat")} />
        <ProfileNumberField label="Dungeon Magic Find" value={profile.magicFind.dungeon} min={0} onChange={(value) => updateNested("magicFind", "dungeon", value)} source={fieldSource("magicFind.dungeon")} />
        <ProfileNumberField label="World Boss Magic Find" value={profile.magicFind.worldBoss} min={0} onChange={(value) => updateNested("magicFind", "worldBoss", value)} source={fieldSource("magicFind.worldBoss")} />
        <ProfileNumberField
          label="Daily Streak"
          value={profile.magicFind.dailyStreak}
          min={0}
          onChange={updateDailyStreak}
          hint="1% magic find every 10 days, capped at 10%. Tracked once per UTC reset day after you enter it."
          source={fieldSource("magicFind.dailyStreak")}
        />
        <ProfileNumberField label="Hunting Efficiency" value={profile.efficiency.hunting} min={0} onChange={(value) => updateNested("efficiency", "hunting", value)} source={fieldSource("efficiency.hunting")} />
        <ProfileNumberField label="Dungeon Efficiency" value={profile.efficiency.dungeon} min={0} onChange={(value) => updateNested("efficiency", "dungeon", value)} source={fieldSource("efficiency.dungeon")} />
        <ProfileNumberField label="Playtime (hours/day)" value={profile.timers.activeHours} min={0} max={24} onChange={(value) => updateNested("timers", "activeHours", value)} source={fieldSource("timers.activeHours")} />
        <ProfilePicker<AssaultRank>
          id="conquest-buff"
          label="Conquest Buff"
          placeholder="Select conquest buff"
          selected={{
            id: profile.boosts.conquestRank,
            title: ASSAULT_OPTIONS.find((option) => option.value === profile.boosts.conquestRank)?.label || getAssaultBuff(profile.boosts.conquestRank).label,
            subtitle: "Alchemy efficiency and tax effects",
            searchText: profile.boosts.conquestRank,
            value: profile.boosts.conquestRank,
          }}
          options={ASSAULT_OPTIONS.map((option) => ({
            id: option.value,
            title: option.label,
            subtitle: "Conquest buff",
            searchText: `${option.value} ${option.label}`,
            value: option.value as AssaultRank,
          }))}
          openId={openPicker}
          setOpenId={setOpenPicker}
          onSelect={(value) => updateNested("boosts", "conquestRank", value || "none")}
          source={fieldSource("boosts.conquestRank")}
        />
        <ProfileNumberField
          label="Bartering Level"
          value={profile.boosts.barteringLevel}
          min={0}
          max={100}
          onChange={(value) => updateNested("boosts", "barteringLevel", value === "" ? "" : Math.min(100, Math.max(0, Number(value))))}
          hint={`Vendor bonus: +${barteringPercent}%`}
          source={fieldSource("boosts.barteringLevel")}
        />
      </div>
    </section>
  );
}
