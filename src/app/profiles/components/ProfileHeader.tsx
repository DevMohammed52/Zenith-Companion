"use client";

import React from "react";
import { BadgeCheck, Download, FileUp, Plus, UserRound } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { GameImage } from "@/components/GameImage";
import {
  DEFAULT_PROFILE_BACKGROUND_IMAGE_URL,
  MAX_PROFILES,
  type CharacterProfile,
} from "@/lib/profiles";
import { formatProfileBackupAge } from "@/lib/local-backup";
import { PROFILE_SECTIONS, type ProfileSectionId } from "../types";

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
  activeProfileSection,
  openProfileSection,
  onAddProfile,
  onExport,
  backupDue,
  lastBackupAt,
  lastImportedOrRefreshedAt,
}: ProfileHeaderProps) {
  return (
    <>
      <div className="header profile-header">
        <div>
          <h1 className="header-title"><ZenithIcon name="profile" size={24} style={{ color: "var(--text-accent)" }} /> Profiles</h1>
        </div>
        <div className="profile-header-actions">
          <button
            className="profile-action"
            type="button"
            onClick={onAddProfile}
            disabled={profilesCount >= MAX_PROFILES}
          >
            <Plus size={15} /> Add
          </button>
          <button className="profile-action" type="button" onClick={onExport}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <nav className="profile-section-nav" aria-label="Profile sections">
        {PROFILE_SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#profile-${id}`}
            aria-current={activeProfileSection === id ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              openProfileSection(id);
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <a
        className="profile-import-jump-card"
        href="#profile-transfer"
        onClick={(event) => {
          event.preventDefault();
          openProfileSection("transfer");
        }}
      >
        <span>
          <FileUp size={17} />
          <strong>Import from IdleMMO</strong>
        </span>
        <em>
          {lastImportedOrRefreshedAt
            ? `Last import: ${formatProfileSourceDate(lastImportedOrRefreshedAt)}`
            : "Fill visible character details without scrolling through manual setup."}
        </em>
      </a>

      <div className={`profile-backup-reminder ${backupDue ? "profile-backup-reminder-due" : ""}`}>
        <div>
          <strong>Local browser data</strong>
          <span>
            Profiles are saved only in this browser. {formatProfileBackupAge(lastBackupAt)}
          </span>
        </div>
        <button type="button" className="profile-action" onClick={onExport}>
          <Download size={15} /> Copy backup
        </button>
      </div>
    </>
  );
}

export interface ProfileListPanelProps {
  profiles: CharacterProfile[];
  activeProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
}

export function ProfileListPanel({
  profiles,
  activeProfileId,
  onSelectProfile,
}: ProfileListPanelProps) {
  return (
    <section className="profile-list-panel" aria-labelledby="profile-list-heading">
      <div className="profile-count">
        <span>{profiles.length} / {MAX_PROFILES}</span>
        <strong id="profile-list-heading">Local Profiles</strong>
      </div>
      <div className="profile-list">
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
              className={`profile-list-item ${item.imageUrl || itemBackgroundUrl ? "has-art" : ""} ${active ? "active" : ""}`}
              aria-pressed={active}
              aria-label={`${active ? "Active profile" : "Switch to profile"}: ${item.name || "Unnamed Character"}`}
              onClick={() => onSelectProfile(item.id)}
            >
              {itemBackgroundUrl && <span className="profile-list-item-bg" style={{ backgroundImage: `url("${itemBackgroundUrl}")` }} aria-hidden="true" />}
              <span className="profile-avatar">
                {item.imageUrl ? (
                  <GameImage
                    src={item.imageUrl}
                    alt=""
                    width={40}
                    height={48}
                    sizes="40px"
                  />
                ) : <UserRound size={18} />}
              </span>
              <span>
                <strong>{item.name || "Unnamed Character"}</strong>
                <small>{item.kind === "main" ? "Main" : "Alt"} - {item.className}{item.location?.name ? ` - ${item.location.name}` : ""}</small>
              </span>
              {active && <BadgeCheck size={16} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
