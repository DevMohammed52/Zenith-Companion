"use client";

import { GameImage } from "@/components/GameImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  formatAssaultCountdown,
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
    | "isHistoricalSeason"
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
    isHistoricalSeason,
  } = state;

  if (filteredZones.length === 0) {
    return (
      <section className={styles.zoneEmptyWrap} aria-label="Conquest zones">
        <EmptyState
          icon="searchEmpty"
          title={searchActive ? `No matches for "${searchTerm.trim()}"` : "No zones match this filter"}
          description={getFilterEmptyLabel(filter)}
          action={{
            label: "Reset Filters",
            onClick: () => {
              setFilter("all");
              setSearchTerm("");
            },
          }}
        />
      </section>
    );
  }

  return (
    <section className={styles.zoneGrid} aria-label="Conquest zones">
      {filteredZones.map((zone) => {
        const guild = getDominantGuild(zone);
        const leaderShare = getLeaderShare(zone);
        const isSelected = selectedZone?.key === zone.key;
        const firstAssaultCountdown = isHistoricalSeason
          ? null
          : formatAssaultCountdown(zone.active_assaults[0]?.ends_at);
        const historicalStatusLabel =
          leaderShare >= 95 ? "Controlled" : zone.status === "CONTESTED" ? "Close race" : "Dominated";
        const historicalTone =
          leaderShare >= 95 ? "calm" : zone.status === "CONTESTED" ? "warn" : "active";
        const statusLabel = isHistoricalSeason
          ? historicalStatusLabel
          : firstAssaultCountdown
            ? `Assault | ${firstAssaultCountdown}`
            : getPressureLabel(zone);
        const statusTone = isHistoricalSeason ? historicalTone : getPressureTone(zone);

        return (
          <article
            key={zone.key}
            className={styles.zoneCard}
            data-selected={isSelected}
          >
            <a
              className={styles.zoneMapLink}
              href={`/map?location=${encodeURIComponent(zone.key)}`}
              aria-label={`Open ${zone.name} on the world map`}
              title={`Open ${zone.name} on the world map`}
            >
              <Icon name="map" size="sm" aria-hidden="true" />
            </a>
            <button
              type="button"
              className={styles.zoneSelectButton}
              aria-label={`Select ${zone.name}. ${isHistoricalSeason ? historicalStatusLabel : getPressureLabel(zone)}. ${guild?.name ?? "No guild"} leads with ${formatConquestPercent(leaderShare)} control share.`}
              aria-pressed={isSelected}
              onClick={() => setSelectedZoneKey(zone.key)}
            >
              <div className={styles.zoneBody}>
                <div className={styles.zoneTop}>
                  <div className={styles.zoneTitleGroup}>
                    {zone.image_url && (
                      <GameImage
                        src={zone.image_url}
                        alt=""
                        width={36}
                        height={36}
                        className={styles.zoneArt}
                        sizes="36px"
                        aria-hidden="true"
                      />
                    )}
                    <h2 className={styles.zoneName}>{zone.name}</h2>
                  </div>
                  <span className={styles.zoneActions}>
                    {isSelected && (
                      <span className={styles.selectedPill}>
                        <Icon name="check" size="xs" aria-hidden="true" />
                        Selected
                      </span>
                    )}
                    <span className={styles.statusPill} data-tone={statusTone}>
                      {statusLabel}
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
                            ? `[${guild.tag}] Leading guild`
                            : "Leading guild"
                          : "No public leader"}
                      </span>
                    </span>
                  </div>

                  <div className={styles.zoneControlWrap}>
                    <div className={styles.zoneControlHeader}>
                      <span>Control share</span>
                      <strong>{formatConquestPercent(leaderShare)}</strong>
                    </div>
                    <div
                      className={styles.zoneControl}
                      aria-label={`${formatConquestPercent(leaderShare)} control share`}
                    >
                      <span style={{ width: `${leaderShare}%` }} />
                    </div>
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
                      <span>XP / Kill</span>
                      <strong>{formatConquestDecimal(getXpPerKill(zone))}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </article>
        );
      })}
    </section>
  );
}
