"use client";

import React from "react";
import { GameImage } from "@/components/GameImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatProfileBackupAge } from "@/lib/local-backup";
import type { IconConcept } from "@/lib/icons";
import {
  DEFAULT_PROFILE_BACKGROUND_IMAGE_URL,
  MAX_PROFILES,
  type CharacterProfile,
} from "@/lib/profiles";
import styles from "../Profiles.module.css";
import { PROFILE_SECTIONS, type ProfileSectionId } from "../types";

const SECTION_ICONS: Record<ProfileSectionId, IconConcept> = {
  identity: "profile",
  levels: "barChart",
  combat: "combat",
  magic: "magic",
  pet: "pets",
  gear: "slotChestplate",
  housing: "housing",
  transfer: "download",
};

export function formatProfileSourceDate(value?: string): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export interface ProfileHeaderProps {
  profilesCount: number;
  activeProfileSection: ProfileSectionId;
  openProfileSection: (section: ProfileSectionId) => void;
  onAddProfile: () => void;
  onExport: () => void;
  backupDue: boolean;
  lastBackupAt: number;
  lastImportedOrRefreshedAt?: string;
}

export function ProfileHeader({
  profilesCount,
  onAddProfile,
  onExport,
}: ProfileHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerCopy}>
        <div className={styles.headerTitleRow}>
          <span className={styles.headerIcon} aria-hidden="true">
            <Icon name="profileSwitch" size="lg" />
          </span>
          <h1 className="header-title" style={{ margin: 0 }}>
            Profiles
          </h1>
        </div>
        <p className={styles.subtitle}>
          Manage character stats, pets, housing, and gear loadouts stored locally in your browser.
        </p>
      </div>

      <div className={styles.headerActions}>
        <Button
          variant="primary"
          size="md"
          icon={<Icon name="plus" size="sm" aria-hidden="true" />}
          onClick={onAddProfile}
          disabled={profilesCount >= MAX_PROFILES}
        >
          Add profile
        </Button>
        <Button
          variant="secondary"
          size="md"
          icon={<Icon name="download" size="sm" aria-hidden="true" />}
          onClick={onExport}
        >
          Export backup
        </Button>
      </div>
    </header>
  );
}

export interface ProfileSectionNavProps {
  activeProfileSection: ProfileSectionId;
  openProfileSection: (section: ProfileSectionId) => void;
}

export function ProfileSectionNav({
  activeProfileSection,
  openProfileSection,
}: ProfileSectionNavProps) {
  return (
    <nav className={styles.sectionNav} aria-label="Profile sections">
      {PROFILE_SECTIONS.map(([id, label]) => (
        <a
          key={id}
          href={`#profile-${id}`}
          className={styles.sectionTab}
          aria-current={activeProfileSection === id ? "page" : undefined}
          onClick={(event) => {
            event.preventDefault();
            openProfileSection(id);
          }}
        >
          <Icon name={SECTION_ICONS[id]} size="sm" aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

export interface ProfileListPanelProps {
  profiles: CharacterProfile[];
  activeProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  backupDue?: boolean;
  lastBackupAt?: number;
  lastImportedOrRefreshedAt?: string;
  onOpenImport?: () => void;
}

export function ProfileListPanel({
  profiles,
  activeProfileId,
  onSelectProfile,
  backupDue,
  lastBackupAt = 0,
  lastImportedOrRefreshedAt,
  onOpenImport,
}: ProfileListPanelProps) {
  return (
    <section className={`${styles.listPanel} profile-list-panel`} aria-labelledby="profile-list-heading">
      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeft}>
          <h2 id="profile-list-heading">Character Roster</h2>
          <Badge variant="neutral" size="sm">
            {profiles.length} / {MAX_PROFILES}
          </Badge>
          {backupDue && (
            <Badge variant="warning" size="sm">
              Backup due
            </Badge>
          )}
        </div>

        <div className={styles.listHeaderRight}>
          <span>
            Sync: {lastImportedOrRefreshedAt ? formatProfileSourceDate(lastImportedOrRefreshedAt) : "Not imported"}
          </span>
          <span>Backup: {formatProfileBackupAge(lastBackupAt)}</span>
          {onOpenImport && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="upload" size="xs" aria-hidden="true" />}
              onClick={onOpenImport}
            >
              IdleMMO sync
            </Button>
          )}
        </div>
      </div>

      <div className={styles.profileList}>
        {profiles.map((item) => {
          const active = item.id === activeProfileId;
          const itemBackgroundUrl =
            item.backgroundUrl && item.backgroundUrl !== DEFAULT_PROFILE_BACKGROUND_IMAGE_URL
              ? item.backgroundUrl
              : "";
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.profileListItem} ${active ? styles.active : ""}`}
              aria-pressed={active}
              aria-label={`${active ? "Active profile" : "Switch to profile"}: ${item.name || "Unnamed Character"}`}
              onClick={() => onSelectProfile(item.id)}
            >
              {itemBackgroundUrl && (
                <span
                  className={styles.profileListItemBg}
                  style={{ backgroundImage: `url("${itemBackgroundUrl}")` }}
                  aria-hidden="true"
                />
              )}
              <span className={styles.profileAvatar}>
                {item.imageUrl ? (
                  <GameImage src={item.imageUrl} alt="" width={40} height={40} sizes="40px" />
                ) : (
                  <Icon name="profile" size="md" aria-hidden="true" />
                )}
              </span>
              <span className={styles.profileItemText}>
                <strong>{item.name || "Unnamed Character"}</strong>
                <small>
                  {item.kind === "main" ? "Main" : "Alt"} | {item.className} | TL{" "}
                  {(item.levels.totalLevel || 0).toLocaleString()}
                </small>
              </span>
              {active && (
                <span className={styles.profileListBadge} aria-hidden="true">
                  <Icon name="membership" size="sm" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
