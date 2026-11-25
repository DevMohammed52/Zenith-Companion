"use client";

import React from "react";
import { Icon, ModalSheet, Separator } from "@/components/ui";
import type { GuildRecord } from "@/lib/guilds";
import {
  GUILD_MEMBER_CAP_TIERS,
  GUILD_PROGRESSION_NOTES,
} from "../types";
import { OfflineGuildDetailsCache } from "./OfflineGuildDetailsCache";
import styles from "../page.module.css";

export interface GuildGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  shownGuilds: Array<Pick<GuildRecord, "id">>;
  allGuilds: Array<Pick<GuildRecord, "id">>;
}

export function GuildGuideModal({
  isOpen,
  onClose,
  shownGuilds,
  allGuilds,
}: GuildGuideModalProps) {
  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Guild Progression & Offline Cache"
      description="IdleMMO member limits, seasonal marks, and optional offline detail caching."
      maxWidth="md"
    >
      <div className={styles.guideBody}>
        <section className={styles.guideSection}>
          <h3 className={styles.sectionTitle}>
            <Icon name="guilds" size="sm" aria-hidden="true" />
            <span>Member Limit by Guild Level</span>
          </h3>
          <div className={styles.capGrid}>
            {GUILD_MEMBER_CAP_TIERS.slice().reverse().map((tier) => (
              <div key={tier.minLevel} className={styles.capTile}>
                <span>Lv. {tier.minLevel}+</span>
                <strong>{tier.maxMembers} members</strong>
              </div>
            ))}
          </div>
        </section>

        <Separator orientation="horizontal" decorative />

        <section className={styles.guideSection}>
          <h3 className={styles.sectionTitle}>
            <Icon name="conquest" size="sm" aria-hidden="true" />
            <span>Key Milestones &amp; Registry Notes</span>
          </h3>
          <div className={styles.guideNotesList}>
            {GUILD_PROGRESSION_NOTES.map((note) => (
              <div key={note.label} className={styles.guideNoteRow}>
                <strong>{note.label}</strong>
                <span>{note.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator orientation="horizontal" decorative />

        <OfflineGuildDetailsCache shownGuilds={shownGuilds} allGuilds={allGuilds} />
      </div>
    </ModalSheet>
  );
}
