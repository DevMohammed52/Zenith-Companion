"use client";

import React from "react";
import { Eye, RotateCcw } from "lucide-react";
import { GameImage } from "@/components/GameImage";
import { NoResultsState } from "@/components/StateBlock";
import {
  formatGuildNumber,
  GUILD_TIER_LABELS,
  type GuildRecord,
} from "@/lib/guilds";
import styles from "../page.module.css";
import type { SearchableGuildRecord } from "../types";
import { GuildMobileCard } from "./GuildMobileCard";

export interface GuildsTableProps {
  showCardLayout: boolean;
  showTableLayout: boolean;
  visibleGuilds: SearchableGuildRecord[];
  filteredGuilds: SearchableGuildRecord[];
  hiddenGuildCount: number;
  guildBatchSize: number;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  loadDetails: (guild: GuildRecord) => void;
  setVisibleLimit: React.Dispatch<React.SetStateAction<number>>;
}

export function GuildsTable({
  showCardLayout,
  showTableLayout,
  visibleGuilds,
  filteredGuilds,
  hiddenGuildCount,
  guildBatchSize,
  hasActiveFilters,
  resetFilters,
  loadDetails,
  setVisibleLimit,
}: GuildsTableProps) {
  return (
    <section className={styles.tableWrap}>
      {showCardLayout && <p className={styles.tableHint}>Mobile view shows key fields as cards; open a guild for full details.</p>}
      {showTableLayout && (
        <div className={styles.tableScroll} tabIndex={0} aria-label="Scrollable guild results table">
          <table className={styles.table}>
            <caption className="sr-only">Guild database results</caption>
            <thead>
              <tr>
                <th>Guild</th>
                <th>Tier</th>
                <th>Season</th>
                <th>Level</th>
                <th>Members</th>
                <th>Marks</th>
                <th>Avg TL</th>
                <th title="Refresh-priority and activity heuristic">Activity signal</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {visibleGuilds.map((guild) => (
                <tr key={guild.id}>
                  <td>
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
                  </td>
                  <td>
                    <span className={styles.pill} data-tier={guild.refresh_tier}>
                      {GUILD_TIER_LABELS[guild.refresh_tier]}
                    </span>
                  </td>
                  <td>{guild.season_position ? `#${guild.season_position}` : "-"}</td>
                  <td>{formatGuildNumber(guild.level)}</td>
                  <td>{formatGuildNumber(guild.member_count)}</td>
                  <td>{formatGuildNumber(guild.marks)}</td>
                  <td>{formatGuildNumber(guild.average_total_level)}</td>
                  <td>{formatGuildNumber(guild.activity_score)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.inspectButton}
                      onClick={() => loadDetails(guild)}
                      aria-label={`View ${guild.name} guild details`}
                    >
                      <Eye size={15} aria-hidden="true" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredGuilds.length === 0 && (
            <NoResultsState
              compact
              title="No guilds match the current filters"
              description="Clear the search term or refresh-tier filter to widen the guild list."
              action={hasActiveFilters ? (
                <button type="button" className={styles.resetButton} onClick={resetFilters}>
                  <RotateCcw size={15} aria-hidden="true" /> Reset filters
                </button>
              ) : null}
            />
          )}
        </div>
      )}
      {showCardLayout && (
        <div className={styles.mobileGuildList} aria-label="Guild results">
          {visibleGuilds.map((guild) => (
            <GuildMobileCard guild={guild} key={`mobile-${guild.id}`} onInspect={loadDetails} />
          ))}
          {filteredGuilds.length === 0 && (
            <NoResultsState
              compact
              title="No guilds match the current filters"
              description="Clear the search term or refresh-tier filter to widen the guild list."
              action={hasActiveFilters ? (
                <button type="button" className={styles.resetButton} onClick={resetFilters}>
                  <RotateCcw size={15} aria-hidden="true" /> Reset filters
                </button>
              ) : null}
            />
          )}
        </div>
      )}
      {visibleGuilds.length < filteredGuilds.length && (
        <div className={styles.showMoreBar}>
          <span>
            Showing {formatGuildNumber(visibleGuilds.length)} of {formatGuildNumber(filteredGuilds.length)}
          </span>
          <button type="button" onClick={() => setVisibleLimit((current) => current + guildBatchSize)}>
            Show {formatGuildNumber(Math.min(guildBatchSize, hiddenGuildCount))} more
          </button>
        </div>
      )}
    </section>
  );
}
