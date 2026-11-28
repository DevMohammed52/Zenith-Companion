"use client";

import React from "react";
import { GameImage } from "@/components/GameImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TextArea } from "@/components/ui/TextArea";
import {
  DEFAULT_PROFILE_BACKGROUND_IMAGE_URL,
  MAX_PROFILES,
  type CharacterProfile,
  type ProfileFieldSource,
  type ProfileUpdateOptions,
} from "@/lib/profiles";
import { CLASS_DATA, type ClassInfo } from "@/lib/profile-calculations";
import styles from "../Profiles.module.css";
import {
  FieldSourceChip,
  ProfilePicker,
  ProfileTextField,
  buildProfileCopySummary,
  type PickerOption,
} from "./ProfileControls";

export interface ProfileIdentitySectionProps {
  profile: CharacterProfile;
  profilesCount: number;
  classInfo: ClassInfo;
  openPicker: string | null;
  setOpenPicker: (id: string | null) => void;
  duplicateProfile: (profileId: string) => CharacterProfile | null;
  handleDeleteProfile: () => void;
  patchActive: (patch: Partial<CharacterProfile>, options?: ProfileUpdateOptions) => void;
  handleCopyValue: (label: string, value: string) => Promise<void>;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
  setToast: (message: string) => void;
}

export function ProfileIdentitySection({
  profile,
  profilesCount,
  classInfo,
  openPicker,
  setOpenPicker,
  duplicateProfile,
  handleDeleteProfile,
  patchActive,
  handleCopyValue,
  fieldSource,
  setToast,
}: ProfileIdentitySectionProps) {
  const selectedClassOption: PickerOption<string> = {
    id: classInfo.id,
    title: classInfo.id,
    subtitle: classInfo.category,
    image: classInfo.icon,
    badge: classInfo.category,
    searchText: `${classInfo.id} ${classInfo.category}`,
    value: classInfo.id,
  };

  const profileBackgroundUrl =
    profile.backgroundUrl && profile.backgroundUrl !== DEFAULT_PROFILE_BACKGROUND_IMAGE_URL
      ? profile.backgroundUrl
      : "";

  return (
    <section id="profile-identity" className={styles.panel} tabIndex={-1}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Identity</h2>
          <p>Core character details shared across all calculators and estimators.</p>
        </div>
        <div className={styles.inlineActions}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="copy" size="sm" aria-hidden="true" />}
            onClick={() => {
              const created = duplicateProfile(profile.id);
              if (created) setToast("Profile duplicated.");
            }}
            disabled={profilesCount >= MAX_PROFILES}
            aria-label="Duplicate active profile"
          >
            Duplicate
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Icon name="trash" size="sm" aria-hidden="true" />}
            onClick={handleDeleteProfile}
            aria-label="Delete active profile"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className={styles.heroBanner}>
        {profileBackgroundUrl && (
          <span
            className={styles.heroBannerBg}
            style={{ backgroundImage: `url("${profileBackgroundUrl}")` }}
            aria-hidden="true"
          />
        )}
        <div className={styles.heroIdentity}>
          <span className={styles.heroAvatar}>
            {profile.imageUrl ? (
              <GameImage
                src={profile.imageUrl}
                alt=""
                width={68}
                height={68}
                sizes="68px"
                priority
                fetchPriority="high"
              />
            ) : (
              <Icon name="profile" size="xl" aria-hidden="true" />
            )}
          </span>
          <div className={styles.heroMeta}>
            <div className={styles.heroTitleLine}>
              <h3>{profile.name || "Unnamed Character"}</h3>
              <Badge variant="neutral" size="sm">
                {profile.kind === "main" ? "Main" : "Alt"}
              </Badge>
              {profile.guild?.tag && (
                <Badge variant="neutral" size="sm">
                  [{profile.guild.tag}]
                </Badge>
              )}
            </div>
            <div className={styles.heroSubline}>
              {profile.className} | Total Lv. {(profile.levels.totalLevel || 0).toLocaleString()} |{" "}
              {profile.location?.name || "No location imported"}
            </div>
          </div>
        </div>

        <div className={styles.heroActions} aria-label="Copy profile values">
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="copy" size="xs" aria-hidden="true" />}
            onClick={() => handleCopyValue("Profile summary", buildProfileCopySummary(profile))}
          >
            Copy summary
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="copy" size="xs" aria-hidden="true" />}
            onClick={() => handleCopyValue("Profile name", profile.name || "")}
          >
            Name
          </Button>
          {profile.importSource.characterHashTail && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="copy" size="xs" aria-hidden="true" />}
              onClick={() =>
                handleCopyValue("Character hash tail", profile.importSource.characterHashTail || "")
              }
            >
              Hash
            </Button>
          )}
        </div>
      </div>

      <div className={styles.gridThree}>
        <ProfileTextField
          label="Character Name"
          value={profile.name}
          onChange={(name) => patchActive({ name })}
          placeholder="Character name"
          source={fieldSource("name")}
        />

        <ProfilePicker
          id="class"
          label="Class"
          placeholder="Select Class"
          selected={selectedClassOption}
          options={CLASS_DATA.map((entry) => ({
            id: entry.id,
            title: entry.id,
            subtitle: entry.category,
            image: entry.icon,
            badge: entry.category,
            searchText: `${entry.id} ${entry.category}`,
            value: entry.id,
          }))}
          openId={openPicker}
          setOpenId={setOpenPicker}
          onSelect={(value) => patchActive({ className: String(value || "Warrior") })}
          source={fieldSource("className")}
        />

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <span className={styles.labelText}>Character Slot</span>
            <span className={styles.labelMetaGroup}>
              <FieldSourceChip source={fieldSource("kind")} />
            </span>
          </div>
          <SegmentedControl<CharacterProfile["kind"]>
            ariaLabel="Character slot type"
            value={profile.kind}
            onChange={(kind) => patchActive({ kind })}
            fullWidth
            options={[
              { value: "main", label: "Main" },
              { value: "alt", label: "Alt", disabled: profilesCount <= 1 && profile.kind === "main" },
            ]}
          />
          {profilesCount <= 1 && profile.kind === "main" && (
            <p className={styles.fieldHint}>First slot stays Main until another profile is added.</p>
          )}
        </div>
      </div>

      <div className={styles.classBanner}>
        {classInfo.icon ? (
          <GameImage
            src={classInfo.icon}
            alt=""
            width={56}
            height={56}
            className={styles.classBannerIcon}
          />
        ) : (
          <span className={styles.classBannerIcon} aria-hidden="true">
            <Icon name="combat" size="lg" />
          </span>
        )}
        <div className={styles.classBannerBody}>
          <strong>{classInfo.id} Bonuses & Talents</strong>
          <p>{classInfo.summary}</p>
          {classInfo.effects.length > 0 && (
            <div className={styles.classBonusTags}>
              {classInfo.effects.map((effect) => (
                <Badge key={effect} variant="neutral" size="sm">
                  {effect}
                </Badge>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gap: "0.25rem", marginTop: "0.25rem" }}>
            {classInfo.talents.length ? (
              classInfo.talents.map((talent) => {
                const active = Number(profile.levels.combat || 0) >= talent.level;
                return (
                  <small
                    key={talent.name}
                    style={{
                      color: active ? "var(--text-accent)" : "var(--text-muted)",
                      fontWeight: active ? 600 : 400,
                      fontSize: "0.81rem",
                    }}
                  >
                    {talent.name} (Combat Lv.{talent.level}): {talent.description}
                  </small>
                );
              })
            ) : (
              <small style={{ color: "var(--text-muted)", fontSize: "0.81rem" }}>
                No battle talents.
              </small>
            )}
            {classInfo.notes.map((note) => (
              <small key={note} style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                {note}
              </small>
            ))}
          </div>
        </div>
      </div>

      <details className={styles.accordionCard} style={{ marginBottom: "1rem" }}>
        <summary className={styles.accordionSummary}>
          <span className={styles.accordionTitleGroup}>
            <strong>Custom Artwork URLs</strong>
            <span>Optional portrait image and profile banner overrides</span>
          </span>
          <span className={styles.accordionCue}>
            <span>Expand</span>
            <Icon name="chevronDown" size="sm" className={styles.accordionChevron} aria-hidden="true" />
          </span>
        </summary>
        <div className={styles.accordionBody}>
          <div className={styles.gridTwo}>
            <ProfileTextField
              label="Character Image URL"
              value={profile.imageUrl}
              onChange={(imageUrl) => patchActive({ imageUrl })}
              placeholder="Imported image URL"
              source={fieldSource("imageUrl")}
            />
            <ProfileTextField
              label="Background URL"
              value={profile.backgroundUrl}
              onChange={(backgroundUrl) => patchActive({ backgroundUrl })}
              placeholder="Imported background URL"
              source={fieldSource("backgroundUrl")}
            />
          </div>
        </div>
      </details>

      <TextArea
        label="Character Notes"
        minRows={3}
        value={profile.notes}
        placeholder="Gear goals, dungeon targets, or character reminders..."
        onChange={(event) => patchActive({ notes: event.target.value })}
      />
    </section>
  );
}
