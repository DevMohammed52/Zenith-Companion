"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, UserRound, Users } from "lucide-react";
import { DEFAULT_PROFILE_BACKGROUND_IMAGE_URL, type CharacterProfile, useProfiles } from "@/lib/profiles";

type ProfileSwitcherProps = {
  compact?: boolean;
};

function profileInitial(profile?: Pick<CharacterProfile, "name"> | null) {
  return profile?.name?.slice(0, 1).toUpperCase() || "?";
}

function ProfileSwitcherArt({
  profile,
  compact = false,
}: {
  profile?: CharacterProfile | null;
  compact?: boolean;
}) {
  return (
    <span className="profile-switcher-icon">
      {profile ? profileInitial(profile) : <UserRound size={compact ? 16 : 17} />}
    </span>
  );
}

function ProfileSwitcherOptionArt({ profile }: { profile: CharacterProfile }) {
  const backgroundUrl = profile.backgroundUrl && profile.backgroundUrl !== DEFAULT_PROFILE_BACKGROUND_IMAGE_URL
    ? profile.backgroundUrl
    : "";
  if (!backgroundUrl && !profile.imageUrl) return null;
  return (
    <span className="profile-switcher-option-art" aria-hidden="true">
      {backgroundUrl && <span style={{ backgroundImage: `url("${backgroundUrl}")` }} />}
      {profile.imageUrl && <img src={profile.imageUrl} alt="" loading="lazy" fetchPriority="low" />}
    </span>
  );
}

export default function ProfileSwitcher({ compact = false }: ProfileSwitcherProps) {
  const { state, activeProfile, setActiveProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const idPrefix = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const triggerId = `${idPrefix}-profile-switcher-trigger`;
  const menuId = `${idPrefix}-profile-switcher-menu`;

  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus({ preventScroll: true });
      });
    }
  };

  const focusProfileOption = (index: number) => {
    const options = optionRefs.current.filter((option): option is HTMLButtonElement => Boolean(option));
    if (options.length === 0) return;
    const nextIndex = (index + options.length) % options.length;
    options[nextIndex]?.focus({ preventScroll: true });
  };

  const openMenu = (preferredIndex?: number) => {
    setOpen(true);
    window.requestAnimationFrame(() => {
      if (typeof preferredIndex === "number") {
        focusProfileOption(preferredIndex);
        return;
      }
      const selectedIndex = state.profiles.findIndex((profile) => profile.id === activeProfile?.id);
      focusProfileOption(selectedIndex >= 0 ? selectedIndex : 0);
    });
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        window.requestAnimationFrame(() => {
          triggerRef.current?.focus({ preventScroll: true });
        });
      }
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

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(state.profiles.length - 1);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const options = optionRefs.current.filter((option): option is HTMLButtonElement => Boolean(option));
    const currentIndex = options.findIndex((option) => option === document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusProfileOption(currentIndex >= 0 ? currentIndex + 1 : 0);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusProfileOption(currentIndex >= 0 ? currentIndex - 1 : options.length - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusProfileOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusProfileOption(options.length - 1);
    }
  };

  const handleRootBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!open) return;
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && rootRef.current?.contains(nextTarget)) return;
    closeMenu();
  };

  return (
    <div className={`profile-switcher ${compact ? "compact" : ""}`} ref={rootRef} onBlur={handleRootBlur}>
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        className="profile-switcher-trigger"
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Switch active profile. Current profile: ${activeLabel}`}
      >
        <ProfileSwitcherArt profile={activeProfile} compact={compact} />
        <span className="profile-switcher-text">
          <strong>{activeLabel}</strong>
          {!compact && <small>{activeMeta}</small>}
        </span>
        <ChevronDown size={15} className="profile-switcher-chevron" />
      </button>

      {open && (
        <div
          id={menuId}
          className="profile-switcher-menu"
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
        >
          <div className="profile-switcher-menu-head">
            <Users size={14} />
            <span>Active Profile</span>
          </div>
          <div className="profile-switcher-list custom-scrollbar">
            {state.profiles.map((profile, index) => {
              const selected = profile.id === activeProfile?.id;
              const hasCustomBackground = Boolean(profile.backgroundUrl && profile.backgroundUrl !== DEFAULT_PROFILE_BACKGROUND_IMAGE_URL);
              const hasArt = Boolean(profile.imageUrl || hasCustomBackground);
              return (
                <button
                  key={profile.id}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  className={`profile-switcher-option ${hasArt ? "has-art" : ""} ${selected ? "selected" : ""}`}
                  onClick={() => {
                    setActiveProfile(profile.id);
                    closeMenu(true);
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
          <Link className="profile-switcher-manage" href="/profiles" role="menuitem" onClick={() => closeMenu()}>
            Manage profiles
          </Link>
        </div>
      )}
    </div>
  );
}
