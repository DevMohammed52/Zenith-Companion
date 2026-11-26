"use client";

import React from "react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { ASSAULT_OPTIONS, getAssaultBuff, type AssaultRank } from "@/lib/skill-profit";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import styles from "../Profiles.module.css";
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
    <section id="profile-magic" className={styles.panel} tabIndex={-1}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Magic, Efficiency & Boosts</h2>
          <p>
            Character bonuses for magic find, skilling efficiency, daily hours, conquest buff, and bartering.
          </p>
        </div>
        <Badge
          variant="neutral"
          size="md"
          icon={<Icon name="xp" size="xs" aria-hidden="true" />}
        >
          +{dailyBonus}% streak MF
        </Badge>
      </div>

      <div className={styles.gridFour}>
        <ProfileNumberField
          label="Combat Magic Find"
          value={profile.magicFind.combat}
          min={0}
          onChange={(value) => updateNested("magicFind", "combat", value)}
          source={fieldSource("magicFind.combat")}
        />
        <ProfileNumberField
          label="Dungeon Magic Find"
          value={profile.magicFind.dungeon}
          min={0}
          onChange={(value) => updateNested("magicFind", "dungeon", value)}
          source={fieldSource("magicFind.dungeon")}
        />
        <ProfileNumberField
          label="World Boss MF"
          value={profile.magicFind.worldBoss}
          min={0}
          onChange={(value) => updateNested("magicFind", "worldBoss", value)}
          source={fieldSource("magicFind.worldBoss")}
        />
        <ProfileNumberField
          label="Daily Streak"
          value={profile.magicFind.dailyStreak}
          min={0}
          onChange={updateDailyStreak}
          badge={dailyBonus ? `+${dailyBonus}% MF` : undefined}
          hint="+1% MF per 10 days (max +10%)."
          source={fieldSource("magicFind.dailyStreak")}
        />
        <ProfileNumberField
          label="Hunting Efficiency"
          value={profile.efficiency.hunting}
          min={0}
          onChange={(value) => updateNested("efficiency", "hunting", value)}
          source={fieldSource("efficiency.hunting")}
        />
        <ProfileNumberField
          label="Dungeon Efficiency"
          value={profile.efficiency.dungeon}
          min={0}
          onChange={(value) => updateNested("efficiency", "dungeon", value)}
          source={fieldSource("efficiency.dungeon")}
        />
        <ProfileNumberField
          label="Playtime (hrs/day)"
          value={profile.timers.activeHours}
          min={0}
          max={24}
          onChange={(value) => updateNested("timers", "activeHours", value)}
          source={fieldSource("timers.activeHours")}
        />
      </div>

      <div className={styles.subHeading}>
        <div>
          <h3>Economy & Conquest Boosts</h3>
          <p>Territory assault rank affects crafting/market efficiency; Bartering increases vendor sell value.</p>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <ProfilePicker<AssaultRank>
          id="conquest-buff"
          label="Conquest Buff"
          placeholder="Select conquest buff"
          selected={{
            id: profile.boosts.conquestRank,
            title:
              ASSAULT_OPTIONS.find((option) => option.value === profile.boosts.conquestRank)?.label ||
              getAssaultBuff(profile.boosts.conquestRank).label,
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
          onChange={(value) =>
            updateNested(
              "boosts",
              "barteringLevel",
              value === "" ? "" : Math.min(100, Math.max(0, Number(value))),
            )
          }
          badge={barteringPercent ? `+${barteringPercent}% vendor` : undefined}
          hint="Caps at Lv. 100 (+20% vendor sell value)."
          source={fieldSource("boosts.barteringLevel")}
        />
      </div>
    </section>
  );
}
