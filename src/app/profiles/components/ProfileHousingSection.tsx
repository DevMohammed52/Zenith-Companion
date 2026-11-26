"use client";

import React from "react";
import Link from "next/link";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { formatHours, getHousingActivityLabel, type HousingBuffSummary } from "@/lib/housing";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TextArea } from "@/components/ui/TextArea";
import styles from "../Profiles.module.css";
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
    <section id="profile-housing" className={styles.panel} tabIndex={-1}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Housing Snapshot</h2>
          <p>Housing is profile-scoped and powers connected idle timers and skill bonuses.</p>
        </div>
        <Link href="/housing" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="sm" icon={<Icon name="housing" size="sm" aria-hidden="true" />}>
            Open Housing
          </Button>
        </Link>
      </div>

      <div className={styles.statStrip}>
        <div className={styles.statCell}>
          <span>Reach</span>
          <strong>
            {housingSummary.availableAnywhere
              ? "Available anywhere"
              : housingSummary.locationLimited
                ? "Location-limited"
                : "Inactive"}
          </strong>
          <small>
            {housingSummary.strongestIdleBonus
              ? `${getHousingActivityLabel(housingSummary.strongestIdleBonus.activity)} +${formatHours(
                  housingSummary.strongestIdleBonus.hours,
                )}`
              : "No active idle-time bonus"}
          </small>
        </div>

        <div className={styles.statCell}>
          <span>Active Components</span>
          <strong>{housingSummary.activeComponentCount} active</strong>
          <small>
            {housingSummary.guestCapacity
              ? `${housingSummary.guestCapacity} guest slots`
              : "No guest capacity"}
          </small>
        </div>
      </div>

      <div className={styles.field} style={{ marginBottom: "1rem" }}>
        <div className={styles.labelRow}>
          <span className={styles.labelText}>Housing Mode</span>
          <span className={styles.labelMetaGroup}>
            <FieldSourceChip source={fieldSource("housing.mode")} />
          </span>
        </div>
        <SegmentedControl<CharacterProfile["housing"]["mode"]>
          ariaLabel="Housing mode"
          value={profile.housing.mode}
          onChange={(mode) => updateNested("housing", "mode", mode)}
          fullWidth
          options={[
            { value: "none", label: "None" },
            { value: "owner", label: "Owner" },
            { value: "guest", label: "Guest", disabled: !canUseGuestHousing },
          ]}
        />
        {!canUseGuestHousing && (
          <p className={styles.fieldHint}>
            {profile.className} characters cannot activate guest housing buffs.
          </p>
        )}
      </div>

      <TextArea
        label="Housing Notes"
        minRows={3}
        value={profile.housing.notes}
        placeholder="Notes about house layout, guest access, or timers..."
        onChange={(event) => updateNested("housing", "notes", event.target.value)}
      />
    </section>
  );
}
