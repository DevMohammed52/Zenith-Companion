"use client";

import { useEffect, useMemo, useState } from "react";
import { GameImage } from "@/components/GameImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import {
  formatConquestDecimal,
  formatConquestNumber,
  formatConquestPercent,
  getStatusLabel,
  type ConquestGuild,
  type ConquestZone,
} from "@/lib/conquest";
import {
  DETAIL_TABS,
  getDominantGuild,
  getLeaderMargin,
  getLeaderShare,
  getPressureLabel,
  getPressureTone,
  getRunnerUp,
  getXpPerKill,
  type DetailTab,
  type UseConquestStateReturn,
} from "../types";
import { AssaultRow, ContributorRow, ControlBar, GuildRow } from "./ConquestRows";
import styles from "../page.module.css";

const PAGE_SIZE = 10;

export default function ConquestDetailPanel({
  selectedZone,
  state,
}: {
  selectedZone: ConquestZone;
  state: Pick<
    UseConquestStateReturn,
    "detailTab" | "setDetailTab" | "guildLevels" | "zoneDescriptions" | "isHistoricalSeason" | "selectedSeason"
  >;
}) {
  const { detailTab, setDetailTab, guildLevels, zoneDescriptions, isHistoricalSeason, selectedSeason } = state;
  const [guildsPage, setGuildsPage] = useState(1);
  const [contribPage, setContribPage] = useState(1);

  useEffect(() => {
    setGuildsPage(1);
    setContribPage(1);
  }, [selectedZone.key, selectedSeason]);

  const progressGuildMap = useMemo(() => {
    const map = new Map<number, ConquestGuild>();
    for (const row of selectedZone.guild_leaderboard) {
      if (row.id != null && row.guild) {
        map.set(row.id, row.guild);
      }
    }
    return map;
  }, [selectedZone.guild_leaderboard]);

  const description = zoneDescriptions[selectedZone.key];
  const zoneStatusPillTone = isHistoricalSeason
    ? getLeaderShare(selectedZone) >= 95
      ? "calm"
      : selectedZone.status === "CONTESTED"
        ? "warn"
        : "active"
    : getPressureTone(selectedZone);
  const subtitleLabel = isHistoricalSeason ? "Final season standings" : getPressureLabel(selectedZone);

  const totalGuildPages = Math.max(1, Math.ceil(selectedZone.guild_leaderboard.length / PAGE_SIZE));
  const safeGuildPage = Math.min(guildsPage, totalGuildPages);
  const visibleGuilds = selectedZone.guild_leaderboard.slice(
    (safeGuildPage - 1) * PAGE_SIZE,
    safeGuildPage * PAGE_SIZE,
  );

  const totalContribPages = Math.max(1, Math.ceil(selectedZone.top_contributors.length / PAGE_SIZE));
  const safeContribPage = Math.min(contribPage, totalContribPages);
  const visibleContributors = selectedZone.top_contributors.slice(
    (safeContribPage - 1) * PAGE_SIZE,
    safeContribPage * PAGE_SIZE,
  );

  return (
    <aside
      className={`${styles.panel} ${styles.detailPanel}`}
      aria-label={`${selectedZone.name} details`}
    >
      <div className={styles.panelHeader}>
        <h2>
          <Icon name="conquest" size="md" aria-hidden="true" />
          Zone Details
        </h2>
        <span className={styles.statusPill} data-tone={zoneStatusPillTone}>
          {getStatusLabel(selectedZone.status)}
        </span>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.detailHero}>
          <div className={styles.detailHeroTop}>
            <div className={styles.detailHeroTitleWrap}>
              {selectedZone.image_url && (
                <GameImage
                  src={selectedZone.image_url}
                  alt=""
                  width={44}
                  height={44}
                  className={styles.detailZoneArt}
                  sizes="44px"
                  aria-hidden="true"
                />
              )}
              <div>
                <h2>{selectedZone.name}</h2>
                <p>{subtitleLabel}</p>
              </div>
            </div>
            <a
              className={styles.detailMapLink}
              href={`/map?location=${encodeURIComponent(selectedZone.key)}`}
              aria-label={`Open ${selectedZone.name} on the world map`}
            >
              <Icon name="map" size="sm" aria-hidden="true" />
              Open Map
            </a>
          </div>
          {description && <p className={styles.detailZoneDesc}>{description}</p>}
          <div className={styles.detailGrid}>
            <div>
              <span>Zone XP</span>
              <strong>{formatConquestNumber(selectedZone.experience)}</strong>
            </div>
            <div>
              <span>Total Kills</span>
              <strong>{formatConquestNumber(selectedZone.kills)}</strong>
            </div>
            <div>
              <span>XP / Kill</span>
              <strong>{formatConquestDecimal(getXpPerKill(selectedZone))}</strong>
            </div>
            <div>
              <span>Leader Share</span>
              <strong>{formatConquestPercent(getLeaderShare(selectedZone))}</strong>
            </div>
          </div>
        </div>

        <div className={styles.briefingGrid}>
          <div className={styles.briefingCard}>
            <span>Leader</span>
            <strong>{getDominantGuild(selectedZone)?.name ?? "Unknown Guild"}</strong>
            <p>{formatConquestPercent(getLeaderShare(selectedZone))} of zone XP</p>
          </div>
          <div className={styles.briefingCard}>
            <span>Challenger</span>
            <strong>{getRunnerUp(selectedZone)?.guild?.name ?? "No challenger"}</strong>
            <p>
              {getRunnerUp(selectedZone)
                ? `${formatConquestNumber(getLeaderMargin(selectedZone))} XP behind`
                : "Zone is uncontested"}
            </p>
          </div>
        </div>

        {selectedZone.guild_leaderboard.length > 0 && (
          <div className={styles.controlStack} aria-label={`${selectedZone.name} control distribution`}>
            {selectedZone.guild_leaderboard.slice(0, 5).map((row) => (
              <ControlBar
                key={`${selectedZone.key}-control-${row.position}-${row.guild?.id ?? row.guild?.name}`}
                row={row}
                total={selectedZone.experience}
              />
            ))}
          </div>
        )}

        <div className={styles.tabs} role="tablist" aria-label="Zone detail views">
          {DETAIL_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`conquest-tab-${item.key}`}
              aria-controls={`conquest-panel-${item.key}`}
              aria-selected={detailTab === item.key}
              data-active={detailTab === item.key}
              tabIndex={detailTab === item.key ? 0 : -1}
              onClick={() => setDetailTab(item.key)}
              onKeyDown={(event) => {
                const currentIndex = DETAIL_TABS.findIndex((tab) => tab.key === item.key);
                const activateTab = (nextTab: DetailTab) => {
                  setDetailTab(nextTab);
                  window.requestAnimationFrame(() =>
                    document.getElementById(`conquest-tab-${nextTab}`)?.focus(),
                  );
                };
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  activateTab(DETAIL_TABS[(currentIndex + 1) % DETAIL_TABS.length].key);
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  activateTab(DETAIL_TABS[(currentIndex - 1 + DETAIL_TABS.length) % DETAIL_TABS.length].key);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  activateTab(DETAIL_TABS[0].key);
                } else if (event.key === "End") {
                  event.preventDefault();
                  activateTab(DETAIL_TABS[DETAIL_TABS.length - 1].key);
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className={styles.rowList}
          id="conquest-panel-guilds"
          role="tabpanel"
          aria-labelledby="conquest-tab-guilds"
          hidden={detailTab !== "guilds"}
        >
          {visibleGuilds.length > 0 ? (
            <>
              {visibleGuilds.map((row) => (
                <GuildRow
                  key={`${selectedZone.key}-${row.position}-${row.guild?.id ?? row.guild?.name}`}
                  row={row}
                  guildLevel={row.guild?.id != null ? guildLevels[row.guild.id] : undefined}
                />
              ))}
              {totalGuildPages > 1 && (
                <Pagination
                  currentPage={safeGuildPage}
                  totalPages={totalGuildPages}
                  totalItems={selectedZone.guild_leaderboard.length}
                  pageSize={PAGE_SIZE}
                  itemLabel="guilds"
                  showSummary={false}
                  scrollToTop={false}
                  onPageChange={setGuildsPage}
                />
              )}
            </>
          ) : (
            <EmptyState
              icon="conquest"
              size="sm"
              title="No guilds shown"
              description="This season snapshot did not include guild rows for this zone."
            />
          )}
        </div>

        <div
          className={styles.rowList}
          id="conquest-panel-contributors"
          role="tabpanel"
          aria-labelledby="conquest-tab-contributors"
          hidden={detailTab !== "contributors"}
        >
          {visibleContributors.length > 0 ? (
            <>
              {visibleContributors.map((row, index) => {
                const rank = (safeContribPage - 1) * PAGE_SIZE + index + 1;
                return (
                  <ContributorRow
                    key={`${selectedZone.key}-${row.id ?? `${row.character?.name ?? "player"}-${rank}`}`}
                    row={row}
                    rank={rank}
                    resolvedGuild={
                      row.guild_conquest_progress_id != null
                        ? progressGuildMap.get(row.guild_conquest_progress_id) ?? null
                        : null
                    }
                  />
                );
              })}
              {totalContribPages > 1 && (
                <Pagination
                  currentPage={safeContribPage}
                  totalPages={totalContribPages}
                  totalItems={selectedZone.top_contributors.length}
                  pageSize={PAGE_SIZE}
                  itemLabel="contributors"
                  showSummary={false}
                  scrollToTop={false}
                  onPageChange={setContribPage}
                />
              )}
            </>
          ) : (
            <EmptyState
              icon="guilds"
              size="sm"
              title="No players shown"
              description="This season snapshot did not include player contribution rows for this zone."
            />
          )}
        </div>

        <div
          className={styles.rowList}
          id="conquest-panel-assaults"
          role="tabpanel"
          aria-labelledby="conquest-tab-assaults"
          hidden={detailTab !== "assaults"}
        >
          {!isHistoricalSeason && selectedZone.active_assaults.length > 0 ? (
            selectedZone.active_assaults.map((assault, index) => (
              <AssaultRow
                key={`${selectedZone.key}-assault-${assault.guild?.id ?? index}`}
                assault={assault}
                index={index}
              />
            ))
          ) : (
            <EmptyState
              icon={isHistoricalSeason ? "calendar" : "combat"}
              size="sm"
              title={isHistoricalSeason ? "Season ended" : "No active fight"}
              description={
                isHistoricalSeason
                  ? "Historical archives preserve final guild standings and player rankings, not live assault waves."
                  : "No guild is actively assaulting this zone right now."
              }
            />
          )}
        </div>
      </div>
    </aside>
  );
}
