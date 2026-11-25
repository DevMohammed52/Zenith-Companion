"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { DEFAULT_PROFILE_BACKGROUND_IMAGE_URL, type CharacterProfile, useProfiles } from "@/lib/profiles";
import { Avatar, Icon, Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import styles from "./ProfileSwitcher.module.css";

type ProfileSwitcherProps = {
  compact?: boolean;
};

function profileInitial(profile?: Pick<CharacterProfile, "name"> | null) {
  return profile?.name?.slice(0, 1).toUpperCase() || "?";
}

export default function ProfileSwitcher({ compact = false }: ProfileSwitcherProps) {
  const { state, activeProfile, setActiveProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const idPrefix = useId().replace(/:/g, "");
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const activeLabel = activeProfile?.name || "No profile";
  const activeMeta = activeProfile
    ? `${activeProfile.kind === "main" ? "Main" : "Alt"} - TL ${activeProfile.levels.totalLevel || 0}`
    : "Create a profile";

  const triggerId = `${idPrefix}-profile-switcher-trigger`;

  return (
    <div className={`${styles.wrapper} profile-switcher ${compact ? "compact" : ""}`}>
      <Popover open={open} onOpenChange={setOpen} placement="bottom-end" offset={8}>
        <PopoverTrigger>
          <button
            id={triggerId}
            ref={triggerRef}
            type="button"
            className={`${styles.trigger} profile-switcher-trigger`}
            aria-label={`Switch active profile. Current profile: ${activeLabel}`}
          >
            <Avatar
              src={activeProfile?.imageUrl}
              alt={activeLabel}
              size="sm"
              shape="rounded"
              fallback={activeProfile ? profileInitial(activeProfile) : <Icon name="profile" size={16} />}
            />
            <span className={`${styles.triggerText} profile-switcher-text`}>
              <strong className={styles.name}>{activeLabel}</strong>
              <small className={`${styles.meta} profile-switcher-meta`}>{activeMeta}</small>
            </span>
            <Icon
              name="chevronDown"
              size={14}
              className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className={styles.popoverMenu} showArrow={false}>
          <div className={styles.menuHeader}>
            <div className={styles.headerLeft}>
              <Icon name="profileSwitch" size={14} />
              <span>Active Profile</span>
            </div>
            <span className={styles.countBadge} aria-label={`${state.profiles.length} profiles saved`}>
              {state.profiles.length}
            </span>
          </div>

          <div
            className={`${styles.profileList} custom-scrollbar`}
            role="radiogroup"
            aria-label="Character profiles"
          >
            {state.profiles.length === 0 ? (
              <div className={styles.emptyNotice}>
                No characters imported yet.
              </div>
            ) : (
              state.profiles.map((profile) => {
                const isSelected = profile.id === activeProfile?.id;
                const hasCustomBg = Boolean(
                  profile.backgroundUrl && profile.backgroundUrl !== DEFAULT_PROFILE_BACKGROUND_IMAGE_URL
                );

                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`${styles.option} ${isSelected ? styles.selected : ""}`}
                    onClick={() => {
                      setActiveProfile(profile.id);
                      setOpen(false);
                      triggerRef.current?.focus({ preventScroll: true });
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Select ${profile.name || "Unnamed"}, ${profile.kind === "main" ? "Main" : "Alt"} ${profile.className || "Adventurer"} level ${profile.levels.totalLevel || 0}`}
                  >
                    <div className={styles.optionArt}>
                      {hasCustomBg && (
                        <div
                          className={styles.optionArtBg}
                          style={{ backgroundImage: `url("${profile.backgroundUrl}")` }}
                          aria-hidden="true"
                        />
                      )}
                      {profile.imageUrl ? (
                        <img
                          src={profile.imageUrl}
                          alt=""
                          className={styles.optionArtImg}
                          loading="lazy"
                          fetchPriority="low"
                        />
                      ) : (
                        <span className={styles.optionInitial}>
                          {profileInitial(profile)}
                        </span>
                      )}
                    </div>

                    <div className={styles.optionText}>
                      <span className={styles.optionName}>
                        {profile.name || "Unnamed profile"}
                      </span>
                      <span className={styles.optionMeta}>
                        {profile.kind === "main" ? "Main" : "Alt"} · {profile.className || "Adventurer"} · TL {profile.levels.totalLevel || 0}
                      </span>
                    </div>

                    {isSelected && (
                      <Icon name="check" size={16} className={styles.checkIcon} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className={styles.menuFooter}>
            <Link
              href="/profiles"
              className={styles.manageLink}
              onClick={() => setOpen(false)}
            >
              <span>Manage all profiles</span>
              <Icon name="chevronRight" size={14} />
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
