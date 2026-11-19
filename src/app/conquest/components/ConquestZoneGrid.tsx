"use client";

import { Check, MapPinned } from "lucide-react";
import { NoResultsState } from "@/components/StateBlock";
import {
  formatConquestDecimal,
  formatConquestNumber,
  formatConquestPercent,
} from "@/lib/conquest";
import {
  getDominantGuild,
  getFilterEmptyLabel,
  getLeaderShare,
  getPressureLabel,
  getPressureTone,
  getXpPerKill,
  getZoneStyle,
  type UseConquestStateReturn,
} from "../types";
import { GuildIcon } from "./ConquestRows";
import styles from "../page.module.css";

export default function ConquestZoneGrid({
  state,
}: {
  state: Pick<
    UseConquestStateReturn,
    | "filteredZones"
    | "selectedZone"
    | "setSelectedZoneKey"
    | "filter"
    | "setFilter"
    | "searchActive"
    | "searchTerm"
    | "setSearchTerm"
  >;
}) {
  const {
    filteredZones,
    selectedZone,
    setSelectedZoneKey,
    filter,
    setFilter,
    searchActive,
    searchTerm,
    setSearchTerm,
  } = state;

  return (
    <section className={styles.zoneGrid} aria-label="Conquest zones">
      {filteredZones.map((zone) => {
        const guild = getDominantGuild(zone);
        const leaderShare = getLeaderShare(zone);
        const isSelected = selectedZone?.key === zone.key;

        return (
          <article
            key={zone.key}
            className={styles.zoneCard}
            style={getZoneStyle(zone)}
            data-selected={isSelected}
          >
            <a
              className={styles.zoneMapLink}
              href={`/map?location=${encodeURIComponent(zone.key)}`}
              aria-label={`Open ${zone.name} on the world map`}
            >
              <MapPinned size={16} />
            </a>
            <button
              type="button"
              className={styles.zoneSelectButton}
              aria-label={`Select ${zone.name}. ${getPressureLabel(zone)}. ${guild?.name ?? "No guild"} leads with ${formatConquestPercent(leaderShare)} control share.`}
              aria-pressed={isSelected}
              onClick={() => setSelectedZoneKey(zone.key)}
            >
              <div className={styles.zoneBody}>
                <div className={styles.zoneTop}>
                  <h2 className={styles.zoneName}>{zone.name}</h2>
                  <span className={styles.zoneActions}>
                    {isSelected && (
                      <span className={styles.selectedPill}>
                        <Check size={12} />
                        Selected
                      </span>
                    )}
                    <span className={styles.statusPill} data-tone={getPressureTone(zone)}>
                      {getPressureLabel(zone)}
                    </span>
                  </span>
                </div>

                <div>
                  <div className={styles.dominantGuild}>
                    <GuildIcon guild={guild} />
                    <span>
                      <strong>{guild?.name ?? "No guild data"}</strong>
                      <span>
                        {guild
                          ? guild.tag
                            ? `${guild.tag} - leading guild`
                            : "Leading guild"
                          : "No public leader in snapshot"}
                      </span>
                    </span>
                  </div>

                  <div
                    className={styles.zoneControl}
                    aria-label={`${formatConquestPercent(leaderShare)} control share`}
                  >
                    <span style={{ width: `${leaderShare}%` }} />
                  </div>

                  <div className={styles.zoneMetrics}>
                    <div>
                      <span>XP</span>
                      <strong>{formatConquestNumber(zone.experience)}</strong>
                    </div>
                    <div>
                      <span>Kills</span>
                      <strong>{formatConquestNumber(zone.kills)}</strong>
                    </div>
                    <div>
                      <span>Guilds</span>
                      <strong>
                        {formatConquestNumber(zone.leaderboard_count)} / {formatConquestNumber(zone.guilds_count)}
                      </strong>
                    </div>
                    <div>
                      <span>Share</span>
                      <strong>{formatConquestPercent(leaderShare)}</strong>
                    </div>
                    <div>
                      <span>XP/Kill</span>
                      <strong>{formatConquestDecimal(getXpPerKill(zone))}</strong>
                    </div>
                    <div>
                      <span>Players</span>
                      <strong>{formatConquestNumber(zone.contribution_count)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </article>
        );
      })}

      {filteredZones.length === 0 && (
        <NoResultsState
          title={getFilterEmptyLabel(filter)}
          description={
            searchActive
              ? `No zone, guild, or player matched "${searchTerm.trim()}".`
              : "Try another conquest filter."
          }
          action={
            searchActive || filter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
              >
                Reset filters
              </button>
            ) : null
          }
        />
      )}
    </section>
  );
}
