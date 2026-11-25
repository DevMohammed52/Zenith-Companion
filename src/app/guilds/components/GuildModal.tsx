"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import {
  Badge,
  EmptyState,
  Icon,
  ModalSheet,
  ProgressBar,
  SearchInput,
  Separator,
  Skeleton,
  SkeletonContainer,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/ui";
import {
  formatGuildAge,
  formatGuildNumber,
  GUILD_TIER_LABELS,
  type GuildDetails,
  type GuildRecord,
} from "@/lib/guilds";
import type { EnrichedGuildRecord, GuildConquestZone } from "../types";
import { GuildMarkdown } from "./GuildMarkdown";
import { MemberLink } from "./MemberLink";
import styles from "../page.module.css";

type GuildModalTab = "overview" | "roster" | "conquest";

export interface GuildModalProps {
  guild: EnrichedGuildRecord;
  details: GuildDetails | null;
  loading: boolean;
  error: string | null;
  onRetry: (guild: GuildRecord) => void;
  onClose: () => void;
}

export function GuildModal({
  guild,
  details,
  loading,
  error,
  onRetry,
  onClose,
}: GuildModalProps) {
  const [activeTab, setActiveTab] = useState<GuildModalTab>("overview");
  const [memberQuery, setMemberQuery] = useState("");

  // Merge live Conquest zones with any fallback zone entries stored on the guild detail snapshot
  const mergedZones = useMemo<GuildConquestZone[]>(() => {
    const map = new Map<string, GuildConquestZone>();
    for (const z of guild.conquestZones) {
      map.set(z.zoneKey, z);
    }
    for (const z of details?.zones || []) {
      const key = String(z.key || z.name || z.id || "").toLowerCase().replace(/\s+/g, "-");
      if (!key || map.has(key)) continue;
      map.set(key, {
        zoneKey: key,
        zoneName: z.name || z.key || "Unknown zone",
        position: z.position ?? null,
        kills: Number(z.kills || 0),
        experience: Number(z.experience || 0),
        sharePct: 0,
        activeAssault: false,
        status: null,
      });
    }
    return [...map.values()].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  }, [details?.zones, guild.conquestZones]);

  const allMembers = details?.members || [];
  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return allMembers;
    return allMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(q) ||
        String(member.position || "").toLowerCase().includes(q),
    );
  }, [allMembers, memberQuery]);

  const memberDisplayCount = allMembers.length || guild.member_count;

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={guild.name}
      description={`#${guild.id}${guild.tag ? ` · [${guild.tag}]` : ""} · ${GUILD_TIER_LABELS[guild.refresh_tier]}`}
      maxWidth="xl"
    >
      <div className={styles.modalStack}>
        {/* 1. Scenic Guild Banner Header */}
        <div className={styles.modalBanner}>
          {guild.background_url && (
            <div className={styles.modalBannerBgWrap} aria-hidden="true">
              <GameImage
                src={guild.background_url}
                alt=""
                width={960}
                height={260}
                className={styles.modalBannerBgImg}
              />
            </div>
          )}
          <div className={styles.modalBannerScrim} aria-hidden="true" />

          <div className={styles.modalBannerInner}>
            <GameImage
              src={guild.icon_url}
              alt=""
              width={60}
              height={60}
              sizes="60px"
              className={styles.modalGuildIcon}
              fallback={
                <span className={styles.modalGuildIconFallback}>
                  <Icon name="guilds" size="lg" aria-hidden="true" />
                </span>
              }
            />

            <div className={styles.modalBannerCopy}>
              <div className={styles.modalBannerBadges}>
                {guild.season_position && guild.season_position > 0 && (
                  <Badge variant={guild.season_position <= 3 ? "warning" : "neutral"} size="sm">
                    Season #{guild.season_position}
                  </Badge>
                )}
                {guild.openSlots > 0 ? (
                  <Badge variant="success" size="sm">
                    {guild.openSlots} open {guild.openSlots === 1 ? "slot" : "slots"}
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Roster Full</Badge>
                )}
                {guild.hasActiveAssault && (
                  <Badge variant="danger" size="sm">Assault Active</Badge>
                )}
                {guild.isMyGuild && (
                  <Badge variant="refined" size="sm">Your Guild</Badge>
                )}
              </div>

              <div className={styles.modalBannerTitleRow}>
                <h3>{guild.name}</h3>
                {guild.tag && <span className={styles.modalTagPill}>[{guild.tag}]</span>}
              </div>
              <p className={styles.modalBannerSub}>
                Guild Level {formatGuildNumber(guild.level)} · Max Roster {guild.maxMembers} members
              </p>
            </div>
          </div>
        </div>

        {/* 2. Key Metrics Strip (Flat hairline separation) */}
        <div className={styles.modalMetricStrip} aria-label="Guild key stats">
          <div className={styles.modalStatCell}>
            <span>Season Rank</span>
            <strong>{guild.season_position ? `#${guild.season_position}` : "-"}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.modalStatCell}>
            <span>Level</span>
            <strong>{formatGuildNumber(guild.level)}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.modalStatCell}>
            <span>Roster</span>
            <strong>
              {guild.member_count}/{guild.maxMembers}
            </strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.modalStatCell}>
            <span>Marks</span>
            <strong>{formatGuildNumber(guild.marks)}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.modalStatCell}>
            <span>Avg TL</span>
            <strong>{formatGuildNumber(details?.member_summary.average_total_level ?? guild.average_total_level)}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.modalStatCell}>
            <span>Highest TL</span>
            <strong>{formatGuildNumber(details?.member_summary.highest_total_level ?? guild.highest_total_level)}</strong>
          </div>
        </div>

        {/* 3. Details States & Tabbed Deep Inspection */}
        {error ? (
          <EmptyState
            variant="error"
            size="sm"
            title="Guild details unavailable"
            description={error}
            action={{ label: "Retry fetch", onClick: () => onRetry(guild) }}
          />
        ) : loading ? (
          <SkeletonContainer busy className={styles.modalSkeletonStack}>
            <Skeleton height={38} width="65%" />
            <Skeleton height={120} width="100%" />
            <Skeleton height={90} width="100%" />
          </SkeletonContainer>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(next) => setActiveTab(next as GuildModalTab)}
            variant="pill"
          >
            <TabList aria-label="Guild detail sections">
              <Tab value="overview">Overview</Tab>
              <Tab value="roster" badge={memberDisplayCount}>
                Roster
              </Tab>
              <Tab value="conquest" badge={mergedZones.length}>
                Conquest
              </Tab>
            </TabList>

            <TabPanel value="overview" className={styles.modalTabPanel}>
              <div className={styles.modalOverviewGrid}>
                <section className={styles.modalSubPanel}>
                  <h4 className={styles.sectionTitle}>
                    <Icon name="info" size="sm" aria-hidden="true" />
                    <span>Guild Charter</span>
                  </h4>
                  <GuildMarkdown text={details?.description || null} />
                </section>

                <section className={styles.modalSubPanel}>
                  <h4 className={styles.sectionTitle}>
                    <Icon name="guilds" size="sm" aria-hidden="true" />
                    <span>Leadership ({details?.member_summary.leaders.length || 0})</span>
                  </h4>
                  <div className={styles.memberList}>
                    {details?.member_summary.leaders.length ? (
                      details.member_summary.leaders.map((member, index) => (
                        <MemberLink member={member} key={`${guild.id}-leader-${index}-${member.name}`} />
                      ))
                    ) : (
                      <p className={styles.mutedNote}>No leadership roles returned for this guild.</p>
                    )}
                  </div>

                  <Separator orientation="horizontal" decorative />

                  <div className={styles.refreshStrip}>
                    <div>
                      <span>Guild info refreshed</span>
                      <strong>{formatGuildAge(details?.last_info_fetch_at || guild.last_info_fetch_at)}</strong>
                    </div>
                    <span className={styles.vDividerTall} aria-hidden="true" />
                    <div>
                      <span>Roster refreshed</span>
                      <strong>{formatGuildAge(details?.last_members_fetch_at || guild.last_members_fetch_at)}</strong>
                    </div>
                  </div>
                </section>
              </div>
            </TabPanel>

            <TabPanel value="roster" className={styles.modalTabPanel}>
              {allMembers.length > 0 ? (
                <>
                  <div className={styles.rosterFilterBar}>
                    <SearchInput
                      ariaLabel="Filter guild members"
                      value={memberQuery}
                      onChange={setMemberQuery}
                      onClear={() => setMemberQuery("")}
                      showShortcutHint={false}
                      placeholder="Filter members by name or role..."
                    />
                  </div>
                  {filteredMembers.length > 0 ? (
                    <div className={styles.rosterGrid}>
                      {filteredMembers.map((member, index) => (
                        <MemberLink member={member} key={`${guild.id}-member-${index}-${member.name}`} />
                      ))}
                    </div>
                  ) : (
                    <p className={styles.mutedNote}>No roster members match &quot;{memberQuery}&quot;.</p>
                  )}
                </>
              ) : (
                <p className={styles.mutedNote}>No roster list stored for this guild snapshot.</p>
              )}
            </TabPanel>

            <TabPanel value="conquest" className={styles.modalTabPanel}>
              {mergedZones.length > 0 ? (
                <div className={styles.conquestZoneStack}>
                  {mergedZones.map((zone) => (
                    <div key={`${guild.id}-${zone.zoneKey}`} className={styles.conquestZoneCard}>
                      <div className={styles.conquestZoneHead}>
                        <div className={styles.conquestZoneTitle}>
                          <Icon name="conquest" size="sm" aria-hidden="true" />
                          <strong>{zone.zoneName}</strong>
                          {zone.position && (
                            <Badge variant={zone.position <= 3 ? "warning" : "neutral"} size="sm">
                              Rank #{zone.position}
                            </Badge>
                          )}
                          {zone.activeAssault && (
                            <Badge variant="danger" size="sm">Assault active</Badge>
                          )}
                        </div>

                        <div className={styles.conquestZoneActions}>
                          <Link
                            href={`/conquest?zone=${encodeURIComponent(zone.zoneKey)}`}
                            className={styles.zoneActionLink}
                          >
                            <span>Conquest</span>
                            <Icon name="externalLink" size="xs" aria-hidden="true" />
                          </Link>
                          <Link
                            href={`/map?location=${encodeURIComponent(zone.zoneKey)}`}
                            className={styles.zoneActionLink}
                          >
                            <span>World Map</span>
                            <Icon name="externalLink" size="xs" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>

                      {zone.sharePct > 0 && (
                        <ProgressBar
                          value={zone.sharePct}
                          max={100}
                          label={`Control share: ${zone.sharePct}%`}
                          showReadout={false}
                          size="sm"
                        />
                      )}

                      {(zone.experience > 0 || zone.kills > 0) && (
                        <div className={styles.conquestZoneMetrics}>
                          <span>{formatGuildNumber(zone.experience)} XP</span>
                          <span className={styles.vDivider} aria-hidden="true" />
                          <span>{formatGuildNumber(zone.kills)} kills</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  variant="no-data"
                  size="sm"
                  title="No active Conquest placements"
                  description="This guild does not currently appear on the seasonal Conquest zone leaderboards."
                  action={{ label: "Open Conquest Tracker", onClick: () => { window.location.assign("/conquest"); } }}
                />
              )}
            </TabPanel>
          </Tabs>
        )}
      </div>
    </ModalSheet>
  );
}
