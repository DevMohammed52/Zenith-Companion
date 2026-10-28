"use client";

import React from "react";
import { Copy, Sparkles, Trash2, UserRound } from "lucide-react";
import { GameImage } from "@/components/GameImage";
import {
  DEFAULT_PROFILE_BACKGROUND_IMAGE_URL,
  MAX_PROFILES,
  type CharacterProfile,
  type ProfileFieldSource,
  type ProfileUpdateOptions,
} from "@/lib/profiles";
import { CLASS_DATA, type ClassInfo } from "@/lib/profile-calculations";
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
    <section id="profile-identity" className="profile-panel profile-identity-panel" tabIndex={-1}>
      <div className="profile-panel-heading">
        <div>
          <h2>Identity</h2>
          <p>Stable profile data used by calculators.</p>
        </div>
        <div className="profile-inline-actions">
          <button type="button" onClick={() => {
            const created = duplicateProfile(profile.id);
            if (created) setToast("Profile duplicated.");
          }} disabled={profilesCount >= MAX_PROFILES} aria-label="Duplicate active profile">
            <Copy size={15} />
          </button>
          <button type="button" onClick={handleDeleteProfile} aria-label="Delete active profile">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div
        className={`profile-game-hero ${profileBackgroundUrl ? "has-background" : ""}`}
        style={profileBackgroundUrl ? { backgroundImage: `url(${profileBackgroundUrl})` } : undefined}
      >
        <div className="profile-game-hero-character">
          {profile.imageUrl ? (
            <GameImage
              src={profile.imageUrl}
              alt=""
              width={144}
              height={168}
              sizes="144px"
              priority
              fetchPriority="high"
            />
          ) : <UserRound size={38} />}
        </div>
        <div className="profile-game-hero-panel">
          <div className="profile-game-hero-title">
            <h3>{profile.name || "Unnamed Character"}</h3>
            <span>{profile.kind === "main" ? "Main" : "Alt"}</span>
          </div>
          <div className="profile-chip-row">
            <span>{profile.className}</span>
            <span>Total Lv. {profile.levels.totalLevel || 0}</span>
            <span>{profile.location?.name || "No location imported"}</span>
            {profile.guild?.tag && <span>Guild {profile.guild.tag}</span>}
          </div>
          <div className="profile-copy-row" aria-label="Copy profile values">
            <button type="button" onClick={() => handleCopyValue("Profile summary", buildProfileCopySummary(profile))}>
              <Copy size={14} /> Summary
            </button>
            <button type="button" onClick={() => handleCopyValue("Profile name", profile.name || "")}>
              <Copy size={14} /> Name
            </button>
            {profile.importSource.characterHashTail && (
              <button type="button" onClick={() => handleCopyValue("Character hash tail", profile.importSource.characterHashTail || "")}>
                <Copy size={14} /> Hash tail
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="profile-grid identity-grid">
        <ProfileTextField label="Character Name" value={profile.name} onChange={(name) => patchActive({ name })} placeholder="Character name" source={fieldSource("name")} />
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
            searchText: `${entry.id} ${entry.category}`,
            value: entry.id,
          }))}
          openId={openPicker}
          setOpenId={setOpenPicker}
          onSelect={(value) => patchActive({ className: String(value || "Other") })}
          source={fieldSource("className")}
        />
        <label className="profile-field">
          <span className="profile-field-labelrow">
            <span>Character Type</span>
            <FieldSourceChip source={fieldSource("kind")} />
          </span>
          <div className="profile-segmented">
            <button type="button" className={profile.kind === "main" ? "active" : ""} onClick={() => patchActive({ kind: "main" })}>Main</button>
            <button type="button" className={profile.kind === "alt" ? "active" : ""} onClick={() => patchActive({ kind: "alt" })}>Alt</button>
          </div>
        </label>
      </div>
      <details className="profile-media-details">
        <summary>Media</summary>
        <div className="profile-grid identity-grid">
          <ProfileTextField label="Character Image URL" value={profile.imageUrl} onChange={(imageUrl) => patchActive({ imageUrl })} placeholder="Imported image URL" source={fieldSource("imageUrl")} />
          <ProfileTextField label="Background URL" value={profile.backgroundUrl} onChange={(backgroundUrl) => patchActive({ backgroundUrl })} placeholder="Imported background URL" source={fieldSource("backgroundUrl")} />
        </div>
      </details>
      <div className="profile-class-card">
        <span className="profile-class-icon">{classInfo.icon ? <img src={classInfo.icon} alt="" /> : <Sparkles size={22} />}</span>
        <div>
          <h3>{classInfo.id}</h3>
          <p>{classInfo.summary}</p>
          <div className="profile-chip-row">
            {classInfo.effects.map((effect) => <span key={effect}>{effect}</span>)}
          </div>
          <div className="profile-talent-list">
            {classInfo.talents.length ? classInfo.talents.map((talent) => {
              const active = Number(profile.levels.combat || 0) >= talent.level;
              return <em key={talent.name} className={active ? "active" : ""}>{talent.name} Lv.{talent.level}: {talent.description}</em>;
            }) : <em>No battle talents.</em>}
          </div>
          {classInfo.notes.map((note) => <small key={note}>{note}</small>)}
        </div>
      </div>
      <label className="profile-field profile-field-wide">
        <span className="profile-field-labelrow">
          <span>Notes</span>
          <FieldSourceChip source={fieldSource("notes")} />
        </span>
        <textarea className="control-input" value={profile.notes} onChange={(event) => patchActive({ notes: event.target.value })} />
      </label>
    </section>
  );
}
