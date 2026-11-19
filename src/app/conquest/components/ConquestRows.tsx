"use client";

import { ExternalLink, Shield, Users } from "lucide-react";
import {
  formatConquestDecimal,
  formatConquestNumber,
  formatConquestPercent,
  getConquestRatio,
  getGuildDatabaseUrl,
  getIdleMmoCharacterUrl,
  type ConquestContributorRow,
  type ConquestGuild,
  type ConquestGuildRow,
  type ConquestZone,
} from "@/lib/conquest";
import styles from "../page.module.css";

export function GuildIcon({ guild }: { guild: ConquestGuild | null }) {
  if (guild?.icon_url) {
    return (
      <img
        className={styles.guildIcon}
        src={guild.icon_url}
        alt=""
        width={38}
        height={38}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={styles.guildIcon} aria-hidden="true">
      <Shield size={18} />
    </div>
  );
}

export function CharacterAvatar({ row }: { row: ConquestContributorRow }) {
  const image = row.character?.image_url;
  if (image) {
    return (
      <img
        className={styles.avatar}
        src={image}
        alt=""
        width={38}
        height={38}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={styles.avatar} aria-hidden="true">
      <Users size={17} />
    </div>
  );
}

export function GuildRow({ row }: { row: ConquestGuildRow }) {
  const guild = row.guild;
  return (
    <a className={styles.leaderRow} href={getGuildDatabaseUrl(guild)}>
      <span className={styles.rank}>#{row.position ?? "-"}</span>
      <GuildIcon guild={guild} />
      <span className={styles.rowMain}>
        <strong>{guild?.name ?? "Unknown Guild"}</strong>
        <span>{guild?.tag ? `${guild.tag} - Guild Database` : "Open Guild Database"}</span>
      </span>
      <span className={styles.rowStats}>
        <span>{formatConquestNumber(row.experience)} XP</span>
        <span>{formatConquestNumber(row.kills)} kills</span>
      </span>
    </a>
  );
}

export function ContributorRow({
  row,
  zoneName,
}: {
  row: ConquestContributorRow;
  zoneName?: string;
}) {
  const character = row.character;
  const name = character?.name ?? "Unknown Player";
  const href = character?.name ? getIdleMmoCharacterUrl(character.name) : undefined;
  const body = (
    <>
      <CharacterAvatar row={row} />
      <span className={styles.rowMain}>
        <strong>{name}</strong>
        <span>
          {character?.total_level
            ? `TL ${formatConquestNumber(character.total_level)}`
            : "Total level unknown"}
          {zoneName ? ` - ${zoneName}` : ""}
        </span>
      </span>
      <span className={styles.rowStats}>
        <span>{formatConquestNumber(row.experience)} XP</span>
        <span>{formatConquestNumber(row.kills)} kills</span>
        <span>{formatConquestDecimal(row.kills ? row.experience / row.kills : null)} XP/kill</span>
        {href && <ExternalLink size={14} aria-hidden="true" />}
      </span>
    </>
  );

  if (!href) return <div className={styles.contributorRow}>{body}</div>;

  return (
    <a
      className={styles.contributorRow}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${name} on IdleMMO in a new tab`}
      title={`Open ${name} on IdleMMO in a new tab`}
    >
      {body}
    </a>
  );
}

export function AssaultRow({
  assault,
  index,
}: {
  assault: ConquestZone["active_assaults"][number];
  index: number;
}) {
  return (
    <div className={styles.assaultRow}>
      <span className={styles.rank}>#{index + 1}</span>
      <GuildIcon guild={assault.guild} />
      <span className={styles.rowMain}>
        <strong>{assault.guild?.name ?? "Unknown Guild"}</strong>
        <span>{assault.guild?.tag ?? "Active assault"}</span>
      </span>
      <span className={styles.rowStats}>
        <span>{formatConquestNumber(assault.experience)} XP</span>
        <span>{formatConquestNumber(assault.kills)} kills</span>
      </span>
    </div>
  );
}

export function ControlBar({ row, total }: { row: ConquestGuildRow; total: number }) {
  const share = getConquestRatio(row.experience, total);
  return (
    <div className={styles.controlBar}>
      <div className={styles.controlBarTop}>
        <span>{row.guild?.name ?? "Unknown Guild"}</span>
        <strong>{formatConquestPercent(share)}</strong>
      </div>
      <div className={styles.controlTrack} aria-hidden="true">
        <span style={{ width: `${share}%` }} />
      </div>
      <div className={styles.controlBarMeta}>
        <span>{formatConquestNumber(row.experience)} XP</span>
        <span>{formatConquestNumber(row.kills)} kills</span>
      </div>
    </div>
  );
}
