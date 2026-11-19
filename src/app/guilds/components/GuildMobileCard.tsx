"use client";

import React from "react";
import { Eye } from "lucide-react";
import { GameImage } from "@/components/GameImage";
import {
  formatGuildNumber,
  GUILD_TIER_LABELS,
  type GuildRecord,
} from "@/lib/guilds";
import styles from "../page.module.css";

export interface GuildMobileCardProps {
  guild: GuildRecord;
  onInspect: (guild: GuildRecord) => void;
}

export function GuildMobileCard({ guild, onInspect }: GuildMobileCardProps) {
  return (
    <article className={styles.guildCard}>
      <div className={styles.guildCardHeader}>
        <div className={styles.guildName}>
          <GameImage
            src={guild.icon_url}
            alt=""
            width={40}
            height={40}
            sizes="40px"
            className={styles.guildIcon}
            loading="lazy"
            fallback={<span className={styles.guildIcon} />}
          />
          <div className={styles.nameBlock}>
            <strong>{guild.name}</strong>
            <span>
              #{guild.id}
              {guild.tag ? ` - ${guild.tag}` : ""}
            </span>
          </div>
        </div>
        <span className={styles.pill} data-tier={guild.refresh_tier}>
          {GUILD_TIER_LABELS[guild.refresh_tier]}
        </span>
      </div>

      <dl className={styles.guildCardStats}>
        <div>
          <dt>Season</dt>
          <dd>{guild.season_position ? `#${guild.season_position}` : "-"}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{formatGuildNumber(guild.level)}</dd>
        </div>
        <div>
          <dt>Members</dt>
          <dd>{formatGuildNumber(guild.member_count)}</dd>
        </div>
        <div>
          <dt>Activity signal</dt>
          <dd>{formatGuildNumber(guild.activity_score)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className={styles.cardInspectButton}
        onClick={() => onInspect(guild)}
        aria-label={`View ${guild.name} guild details`}
      >
        <Eye size={15} aria-hidden="true" /> View guild
      </button>
    </article>
  );
}
