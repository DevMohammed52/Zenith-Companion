"use client";

import { useState } from "react";
import { GameImage } from "@/components/GameImage";
import { ShardIcon } from "@/components/GoldIcon";
import { Icon } from "@/components/ui/Icon";
import {
  formatAssaultCountdown,
  formatConquestDecimal,
  formatConquestNumber,
  formatConquestPercent,
  getConquestExpShardReward,
  getConquestRatio,
  getConquestRulerTier,
  getGuildDatabaseUrl,
  getIdleMmoCharacterUrl,
  type ConquestContributorRow,
  type ConquestGuild,
  type ConquestGuildRow,
  type ConquestZone,
} from "@/lib/conquest";
import styles from "../page.module.css";

export function GuildIcon({ guild }: { guild: ConquestGuild | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = guild?.icon_url && guild.icon_url !== failedUrl ? guild.icon_url : null;

  if (src) {
    return (
      <GameImage
        className={styles.guildIcon}
        src={src}
        alt=""
        width={38}
        height={38}
        sizes="38px"
        aria-hidden="true"
        onError={() => setFailedUrl(src)}
      />
    );
  }

  return (
    <div className={styles.guildIcon} aria-hidden="true">
      <Icon name="conquest" size="md" aria-hidden="true" />
    </div>
  );
}

export function CharacterAvatar({ row }: { row: ConquestContributorRow }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const image = row.character?.image_url && row.character.image_url !== failedUrl ? row.character.image_url : null;

  if (image) {
    return (
      <GameImage
        className={styles.avatar}
        src={image}
        alt=""
        width={38}
        height={38}
        sizes="38px"
        aria-hidden="true"
        onError={() => setFailedUrl(image)}
      />
    );
  }

  return (
    <div className={styles.avatar} aria-hidden="true">
      <Icon name="guilds" size="md" aria-hidden="true" />
    </div>
  );
}

export function GuildRow({ row, guildLevel }: { row: ConquestGuildRow; guildLevel?: number }) {
  const guild = row.guild;
  const rulerTier = getConquestRulerTier(row.position);

  const metaParts = [
    guild?.tag || null,
    guildLevel ? `Lv ${guildLevel}` : null,
    rulerTier ? `+${rulerTier.primaryExpPercent}% EXP / +${rulerTier.primaryEffPercent}% Eff` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <a className={styles.leaderRow} href={getGuildDatabaseUrl(guild)}>
      <span className={styles.rank}>#{row.position ?? "-"}</span>
      <GuildIcon guild={guild} />
      <span className={styles.rowMain}>
        <strong>{guild?.name ?? "Unknown Guild"}</strong>
        <span className={styles.metaStrip}>
          {metaParts.length > 0 ? (
            metaParts.map((part, idx) => <span key={idx}>{part}</span>)
          ) : (
            <span>Open Guild Database</span>
          )}
        </span>
      </span>
      <span className={`${styles.rowStats} ${styles.statStrip}`}>
        <span>{formatConquestNumber(row.experience)} XP</span>
        <span>{formatConquestNumber(row.kills)} kills</span>
      </span>
    </a>
  );
}

export function ContributorRow({
  row,
  rank,
  zoneName,
  resolvedGuild,
}: {
  row: ConquestContributorRow;
  rank?: number;
  zoneName?: string;
  resolvedGuild?: ConquestGuild | null;
}) {
  const character = row.character;
  const name = character?.name ?? "Unknown Player";
  const href = character?.name ? getIdleMmoCharacterUrl(character.name) : undefined;
  const guild = row.guild ?? resolvedGuild ?? null;
  const expShards = rank ? getConquestExpShardReward(rank) : 0;

  const subParts = [
    guild ? (guild.tag ? `[${guild.tag}] ${guild.name}` : guild.name) : null,
    character?.total_level ? `TL ${formatConquestNumber(character.total_level)}` : "TL unknown",
    zoneName || null,
  ].filter((part): part is string => Boolean(part));

  const body = (
    <>
      <span className={styles.contribHeader}>
        {rank ? <span className={styles.rank}>#{rank}</span> : null}
        <CharacterAvatar row={row} />
        <span className={styles.rowMain}>
          <strong>{name}</strong>
          <span className={styles.metaStrip}>
            {subParts.map((part, idx) => (
              <span key={idx}>{part}</span>
            ))}
          </span>
        </span>
        {href && (
          <span className={styles.contribExt} aria-hidden="true">
            <Icon name="externalLink" size="xs" />
          </span>
        )}
      </span>
      <span className={styles.contribFooter}>
        <span className={`${styles.contribMetrics} ${styles.statStrip}`}>
          <span>{formatConquestNumber(row.experience)} XP</span>
          <span>{formatConquestNumber(row.kills)} kills</span>
          <span>{formatConquestDecimal(row.kills ? row.experience / row.kills : null)} XP/kill</span>
        </span>
        {expShards > 0 && (
          <span className={styles.shardPill} title="Projected EXP Leaderboard Shard reward">
            <ShardIcon size={12} />
            <span>{formatConquestNumber(expShards)}</span>
          </span>
        )}
      </span>
    </>
  );

  const rowClass = rank ? `${styles.contributorRow} ${styles.rankedContributorRow}` : styles.contributorRow;

  if (!href) return <div className={rowClass}>{body}</div>;

  return (
    <a
      className={rowClass}
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
  const countdown = formatAssaultCountdown(assault.ends_at);
  const subParts = [
    assault.guild?.tag || null,
    countdown || "Active assault",
  ].filter((part): part is string => Boolean(part));

  return (
    <div className={styles.assaultRow}>
      <span className={styles.rank}>#{index + 1}</span>
      <GuildIcon guild={assault.guild} />
      <span className={styles.rowMain}>
        <strong>{assault.guild?.name ?? "Unknown Guild"}</strong>
        <span className={styles.metaStrip}>
          {subParts.map((part, idx) => (
            <span key={idx}>{part}</span>
          ))}
        </span>
      </span>
      <span className={`${styles.rowStats} ${styles.statStrip}`}>
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
