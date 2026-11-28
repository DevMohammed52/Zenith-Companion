"use client";

import React from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { Badge, Button, Icon, ProgressBar } from "@/components/ui";
import { formatGuildNumber, GUILD_TIER_LABELS } from "@/lib/guilds";
import type { EnrichedGuildRecord } from "../types";
import styles from "../page.module.css";

export interface GuildMobileCardProps {
  guild: EnrichedGuildRecord;
  onInspect: (guild: EnrichedGuildRecord) => void;
}

export function GuildMobileCard({ guild, onInspect }: GuildMobileCardProps) {
  const topZone = guild.conquestZones[0] || null;

  return (
    <article className={`${styles.guildCard} ${guild.isMyGuild ? styles.guildCardOwn : ""}`.trim()}>
      <div className={styles.guildCardBanner}>
        {guild.background_url && (
          <div className={styles.guildCardBgWrap} aria-hidden="true">
            <GameImage
              src={guild.background_url}
              alt=""
              width={480}
              height={160}
              className={styles.guildCardBgImg}
            />
          </div>
        )}
        <div className={styles.guildCardScrim} aria-hidden="true" />

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
              fallback={
                <span className={styles.guildIconFallback}>
                  <Icon name="guilds" size="md" aria-hidden="true" />
                </span>
              }
            />
            <div className={styles.nameBlock}>
              <strong>{guild.name}</strong>
              <span>
                #{guild.id}
                {guild.tag ? ` [${guild.tag}]` : ""}
              </span>
            </div>
          </div>

          <div className={styles.cardTopBadges}>
            {guild.isMyGuild && (
              <Badge variant="refined" size="sm">Yours</Badge>
            )}
            <Badge
              variant={guild.refresh_tier === "hot" ? "success" : "neutral"}
              size="sm"
            >
              {GUILD_TIER_LABELS[guild.refresh_tier]}
            </Badge>
          </div>
        </div>
      </div>

      <div className={styles.guildCardBody}>
        <div className={styles.cardMetricStrip}>
          <div className={styles.cardMetricCell}>
            <span>Season</span>
            <strong>{guild.season_position ? `#${guild.season_position}` : "-"}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.cardMetricCell}>
            <span>Level</span>
            <strong>{formatGuildNumber(guild.level)}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.cardMetricCell}>
            <span>Marks</span>
            <strong>{formatGuildNumber(guild.marks)}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.cardMetricCell}>
            <span>Avg TL</span>
            <strong>{formatGuildNumber(guild.average_total_level)}</strong>
          </div>
        </div>

        <ProgressBar
          value={guild.member_count}
          max={guild.maxMembers}
          label={`Roster: ${guild.member_count}/${guild.maxMembers}${guild.openSlots > 0 ? ` (${guild.openSlots} open)` : " (Full)"}`}
          showReadout={false}
          variant={guild.openSlots > 0 ? "success" : "default"}
          size="sm"
        />

        <div className={styles.cardFooterRow}>
          {topZone ? (
            <Link
              href={`/conquest?zone=${encodeURIComponent(topZone.zoneKey)}`}
              className={styles.zoneChipLink}
            >
              <Icon name="conquest" size="xs" aria-hidden="true" />
              <span>
                {topZone.zoneName} {topZone.position ? `#${topZone.position}` : ""}
                {guild.conquestZones.length > 1 ? ` +${guild.conquestZones.length - 1}` : ""}
              </span>
            </Link>
          ) : guild.leader_names.length > 0 ? (
            <span className={styles.cardLeaderNote}>
              Leader: {guild.leader_names[0]}
            </span>
          ) : (
            <span className={styles.cardLeaderNote}>No territory held</span>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="view" size="sm" />}
            onClick={() => onInspect(guild)}
            aria-label={`View ${guild.name} guild details`}
          >
            Inspect
          </Button>
        </div>
      </div>
    </article>
  );
}
