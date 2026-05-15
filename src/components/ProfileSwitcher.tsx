"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, UserRound, Users } from "lucide-react";
import { type CharacterProfile, useProfiles } from "@/lib/profiles";

type ProfileSwitcherProps = {
  compact?: boolean;
};

function profileInitial(profile?: Pick<CharacterProfile, "name"> | null) {
  return profile?.name?.slice(0, 1).toUpperCase() || "?";
}

function ProfileSwitcherArt({ profile, compact = false }: { profile?: CharacterProfile | null; compact?: boolean }) {
  const hasImage = Boolean(profile?.imageUrl);
  if (!hasImage) {
    return (
      <span className="profile-switcher-icon">
        {profile ? profileInitial(profile) : <UserRound size={compact ? 16 : 17} />}
      </span>
    );
  }

  return (
    <span className="profile-switcher-portrait" aria-hidden="true">
      {profile?.backgroundUrl && <span className="profile-switcher-portrait-bg" style={{ backgroundImage: `url("${profile.backgroundUrl}")` }} />}
      <img src={profile?.imageUrl} alt="" loading={compact ? "eager" : "lazy"} />
    </span>
  );
}

function ProfileSwitcherOptionArt({ profile }: { profile: CharacterProfile }) {
  if (!profile.backgroundUrl && !profile.imageUrl) return null;
  return (
    <span className="profile-switcher-option-art" aria-hidden="true">
      {profile.backgroundUrl && <span style={{ backgroundImage: `url("${profile.backgroundUrl}")` }} />}
      {profile.imageUrl && <img src={profile.imageUrl} alt="" loading="lazy" />}
    </span>
  );
}

export default function ProfileSwitcher({ compact = false }: ProfileSwitcherProps) {
  const { state, activeProfile, setActiveProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const activeLabel = activeProfile?.name || "No profile";
  const activeMeta = activeProfile
    ? `${activeProfile.kind === "main" ? "Main" : "Alt"} - TL ${activeProfile.levels.totalLevel || 0}`
    : "Create a profile";

  return (
    <div className={`profile-switcher ${compact ? "compact" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="profile-switcher-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch active profile"
      >
        {activeProfile?.backgroundUrl && <span className="profile-switcher-trigger-bg" style={{ backgroundImage: `url("${activeProfile.backgroundUrl}")` }} aria-hidden="true" />}
        <ProfileSwitcherArt profile={activeProfile} compact={compact} />
        <span className="profile-switcher-text">
          <strong>{activeLabel}</strong>
          {!compact && <small>{activeMeta}</small>}
        </span>
        <ChevronDown size={15} className="profile-switcher-chevron" />
      </button>

      {open && (
        <div className="profile-switcher-menu" role="menu">
          <div className="profile-switcher-menu-head">
            <Users size={14} />
            <span>Active Profile</span>
          </div>
          <div className="profile-switcher-list custom-scrollbar">
            {state.profiles.map((profile) => {
              const selected = profile.id === activeProfile?.id;
              const hasArt = Boolean(profile.imageUrl || profile.backgroundUrl);
              return (
                <button
                  key={profile.id}
                  type="button"
                  className={`profile-switcher-option ${hasArt ? "has-art" : ""} ${selected ? "selected" : ""}`}
                  onClick={() => {
                    setActiveProfile(profile.id);
                    setOpen(false);
                  }}
                  role="menuitemradio"
                  aria-checked={selected}
                >
                  <ProfileSwitcherOptionArt profile={profile} />
                  <ProfileSwitcherArt profile={profile} />
                  <span>
                    <strong>{profile.name || "Unnamed profile"}</strong>
                    <small>{profile.kind === "main" ? "Main" : "Alt"} - {profile.className || "Other"} - TL {profile.levels.totalLevel || 0}</small>
                  </span>
                  {selected && <Check size={15} />}
                </button>
              );
            })}
          </div>
          <Link className="profile-switcher-manage" href="/profiles" onClick={() => setOpen(false)}>
            Manage profiles
          </Link>
        </div>
      )}
    </div>
  );
}
