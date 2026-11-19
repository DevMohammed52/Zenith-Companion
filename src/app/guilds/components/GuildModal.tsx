"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  BadgeInfo,
  ChevronDown,
  Crown,
  Medal,
  Sparkles,
  X,
} from "lucide-react";
import { GameImage } from "@/components/GameImage";
import {
  formatGuildAge,
  formatGuildNumber,
  GUILD_TIER_LABELS,
  type GuildDetails,
  type GuildRecord,
} from "@/lib/guilds";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { getTrustedCssImageUrl } from "@/lib/trusted-image";
import styles from "../page.module.css";
import { GuildMarkdown } from "./GuildMarkdown";
import { MemberLink } from "./MemberLink";

export interface GuildModalProps {
  guild: GuildRecord;
  details: GuildDetails | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function GuildModal({
  guild,
  details,
  loading,
  error,
  onClose,
}: GuildModalProps) {
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useModalA11y<HTMLElement>(mounted, onClose, { initialFocusRef: closeButtonRef });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const trustedBackgroundImage = getTrustedCssImageUrl(guild.background_url);

  const modal = (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      onMouseDown={onClose}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guild-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={styles.modalArt}
          style={{
            backgroundImage: trustedBackgroundImage || undefined,
            backgroundColor: trustedBackgroundImage ? "#0a0a0c" : "rgba(20, 184, 166, 0.12)",
          }}
        >
          <button ref={closeButtonRef} type="button" className={styles.closeButton} onClick={onClose} aria-label="Close guild details">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <header className={styles.modalHeader}>
            <GameImage
              src={guild.icon_url}
              alt=""
              width={54}
              height={54}
              sizes="54px"
              fallback={<span className={styles.guildIcon} />}
            />
            <div>
              <h2 id="guild-modal-title">{guild.name}</h2>
              <p>
                #{guild.id}
                {guild.tag ? ` - ${guild.tag}` : ""} - {GUILD_TIER_LABELS[guild.refresh_tier]}
              </p>
            </div>
          </header>

          <div className={styles.modalStats}>
            <div>
              <span>Season</span>
              <strong>{guild.season_position ? `#${guild.season_position}` : "-"}</strong>
            </div>
            <div>
              <span>Level</span>
              <strong>{formatGuildNumber(guild.level)}</strong>
            </div>
            <div>
              <span>Members</span>
              <strong>{formatGuildNumber(guild.member_count)}</strong>
            </div>
            <div>
              <span>Marks</span>
              <strong>{formatGuildNumber(guild.marks)}</strong>
            </div>
            <div>
              <span>Average TL</span>
              <strong>{formatGuildNumber(guild.average_total_level)}</strong>
            </div>
            <div>
              <span>Highest TL</span>
              <strong>{formatGuildNumber(details?.member_summary.highest_total_level ?? guild.highest_total_level)}</strong>
            </div>
          </div>

          {error ? (
            <ErrorState compact title="Guild details unavailable" description={error} />
          ) : loading ? (
            <LoadingState compact title="Loading guild details" description="Fetching guild bio, members, zones, and refresh metadata." />
          ) : (
            <div className={styles.modalGrid}>
              <section className={styles.bioPanel}>
                <h3 className={styles.sectionTitle}>
                  <BadgeInfo size={16} /> Guild Bio
                </h3>
                <GuildMarkdown text={details?.description || null} />
              </section>

              <section className={styles.peoplePanel}>
                <h3 className={styles.sectionTitle}>
                  <Crown size={16} /> Leadership
                </h3>
                <div className={styles.memberList}>
                  {details?.member_summary.leaders.length ? (
                    details.member_summary.leaders.map((member, index) => (
                      <MemberLink member={member} key={`${guild.id}-leader-${index}-${member.name}`} />
                    ))
                  ) : (
                    <p className={styles.mutedText}>No leadership roles were returned for this guild.</p>
                  )}
                </div>

                <div className={styles.memberSummaryChips} aria-label="Member roster summary">
                  <span>{formatGuildNumber(details?.member_summary.leaders.length || 0)} leaders</span>
                  <span>Avg TL {formatGuildNumber(details?.member_summary.average_total_level ?? guild.average_total_level)}</span>
                  <span>Highest TL {formatGuildNumber(details?.member_summary.highest_total_level ?? guild.highest_total_level)}</span>
                  <span>Members refreshed {formatGuildAge(details?.last_members_fetch_at || guild.last_members_fetch_at)}</span>
                </div>

                <details className={styles.memberDetails}>
                  <summary>
                    <span className={styles.sectionTitle}>
                      <Medal size={16} /> Members ({formatGuildNumber(details?.members.length || guild.member_count)})
                    </span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </summary>
                  <div className={styles.memberList}>
                    {(details?.members || []).map((member, index) => (
                      <MemberLink member={member} key={`${guild.id}-member-${index}-${member.name}`} />
                    ))}
                  </div>
                </details>

                <h3 className={styles.sectionTitle}>
                  <Activity size={16} /> Last Refreshed
                </h3>
                <div className={styles.refreshGrid}>
                  <div>
                    <span>Guild info</span>
                    <strong>{formatGuildAge(details?.last_info_fetch_at || guild.last_info_fetch_at)}</strong>
                  </div>
                  <div>
                    <span>Members</span>
                    <strong>{formatGuildAge(details?.last_members_fetch_at || guild.last_members_fetch_at)}</strong>
                  </div>
                </div>

                {!!details?.zones.length && (
                  <>
                    <h3 className={styles.sectionTitle}>
                      <Sparkles size={16} /> Conquest Presence
                    </h3>
                    <div className={styles.memberList}>
                      {details.zones.map((zone) => (
                        <div className={styles.zoneRow} key={`${guild.id}-${zone.key || zone.id}`}>
                          <strong>{zone.name || zone.key || "Unknown zone"}</strong>
                          <span>{zone.position ? `Rank #${zone.position}` : "Observed in conquest"}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
