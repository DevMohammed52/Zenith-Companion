"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { Badge, Button, Card, Icon, ProgressBar } from "@/components/ui";
import { formatGuildNumber } from "@/lib/guilds";
import type { EnrichedGuildRecord } from "../types";
import styles from "../page.module.css";

export interface GuildSpotlightProps {
  yourGuild: EnrichedGuildRecord | null;
  seasonTopThree: EnrichedGuildRecord[];
  onInspect: (guild: EnrichedGuildRecord) => void;
}

function SpotlightCard({
  guild,
  eyebrow,
  highlightOwn = false,
  onInspect,
}: {
  guild: EnrichedGuildRecord;
  eyebrow: string;
  highlightOwn?: boolean;
  onInspect: (guild: EnrichedGuildRecord) => void;
}) {
  const topZone = guild.conquestZones[0] || null;

  return (
    <article className={`${styles.spotlightCard} ${highlightOwn ? styles.spotlightCardOwn : ""}`.trim()}>
      {guild.background_url && (
        <div className={styles.spotlightBgWrap} aria-hidden="true">
          <GameImage
            src={guild.background_url}
            alt=""
            width={640}
            height={220}
            className={styles.spotlightBgImg}
          />
        </div>
      )}
      <div className={styles.spotlightScrim} aria-hidden="true" />

      <div className={styles.spotlightContent}>
        <div className={styles.spotlightTopRow}>
          <span className={styles.spotlightEyebrow}>{eyebrow}</span>
          <div className={styles.spotlightTopBadges}>
            {guild.season_position && guild.season_position > 0 && (
              <Badge variant={guild.season_position <= 3 ? "warning" : "neutral"} size="sm">
                #{guild.season_position}
              </Badge>
            )}
            {guild.openSlots > 0 && (
              <Badge variant="success" size="sm">
                {guild.openSlots} open
              </Badge>
            )}
          </div>
        </div>

        <button
          type="button"
          className={styles.spotlightIdentityBtn}
          onClick={() => onInspect(guild)}
          aria-label={`Inspect ${guild.name} guild details`}
        >
          <div className={styles.spotlightIdentity}>
            <GameImage
              src={guild.icon_url}
              alt=""
              width={44}
              height={44}
              className={styles.spotlightIcon}
              fallback={
                <span className={styles.spotlightIconFallback}>
                  <Icon name="guilds" size="md" aria-hidden="true" />
                </span>
              }
            />
            <div className={styles.spotlightTitleWrap}>
              <strong>{guild.name}</strong>
              <span className={styles.spotlightSub}>
                {guild.tag ? `[${guild.tag}] | ` : ""}Lv. {formatGuildNumber(guild.level)} | {formatGuildNumber(guild.marks)} marks
              </span>
            </div>
          </div>
        </button>

        <div className={styles.spotlightRosterBlock}>
          <ProgressBar
            value={guild.member_count}
            max={guild.maxMembers}
            label={`Roster: ${guild.member_count}/${guild.maxMembers} | Avg TL ${formatGuildNumber(guild.average_total_level)}`}
            showReadout={false}
            size="sm"
          />
        </div>

        <div className={styles.spotlightFooter}>
          {topZone ? (
            <Link
              href={`/conquest?zone=${encodeURIComponent(topZone.zoneKey)}`}
              className={styles.zoneChipLink}
              title={`View ${topZone.zoneName} in Conquest (${topZone.sharePct}% control)`}
            >
              <Icon name="conquest" size="xs" aria-hidden="true" />
              <span>
                {topZone.zoneName} {topZone.position ? `#${topZone.position}` : ""}
              </span>
            </Link>
          ) : (
            <span className={styles.spotlightMutedTag}>No current Conquest territory</span>
          )}

          <button
            type="button"
            className={styles.spotlightActionLink}
            onClick={() => onInspect(guild)}
          >
            <span>Inspect</span>
            <Icon name="chevronRight" size="xs" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function GuildSpotlight({
  yourGuild,
  seasonTopThree,
  onInspect,
}: GuildSpotlightProps) {
  const [expanded, setExpanded] = useState(true);

  if (!yourGuild && seasonTopThree.length === 0) return null;

  const displayedTopThree = yourGuild
    ? seasonTopThree.filter((guild) => guild.id !== yourGuild.id).slice(0, 3)
    : seasonTopThree;

  return (
    <Card padding="md" className={styles.spotlightSection}>
      <div className={styles.spotlightHeader}>
        <div className={styles.spotlightHeaderTitle}>
          <Icon name="conquest" size="sm" aria-hidden="true" />
          <span>{yourGuild ? "Your Guild & Season Podium" : "Season Podium"}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          iconTrailing={<Icon name={expanded ? "chevronUp" : "chevronDown"} size="sm" />}
        >
          {expanded ? "Hide highlights" : "Show highlights"}
        </Button>
      </div>

      <div
        className={`${styles.drawerShell} ${expanded ? styles.drawerShellOpen : ""}`.trim()}
        aria-hidden={!expanded}
        inert={!expanded || undefined}
      >
        <div className={styles.drawerInner}>
          <div
            className={`${styles.spotlightGrid} ${yourGuild ? styles.spotlightGridFour : styles.spotlightGridThree}`.trim()}
          >
            {yourGuild && (
              <SpotlightCard
                key={`own-${yourGuild.id}`}
                guild={yourGuild}
                eyebrow="Your Guild"
                highlightOwn
                onInspect={onInspect}
              />
            )}
            {displayedTopThree.map((guild, index) => (
              <SpotlightCard
                key={`podium-${guild.id}`}
                guild={guild}
                eyebrow={`Season #${guild.season_position || index + 1}`}
                onInspect={onInspect}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
