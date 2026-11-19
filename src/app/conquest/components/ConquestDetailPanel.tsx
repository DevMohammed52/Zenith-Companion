"use client";

import { Flag, MapPinned } from "lucide-react";
import { NoResultsState } from "@/components/StateBlock";
import {
  formatConquestDecimal,
  formatConquestNumber,
  formatConquestPercent,
  getStatusLabel,
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
  getZoneStyle,
  type DetailTab,
  type UseConquestStateReturn,
} from "../types";
import { AssaultRow, ContributorRow, ControlBar, GuildRow } from "./ConquestRows";
import styles from "../page.module.css";

export default function ConquestDetailPanel({
  selectedZone,
  state,
}: {
  selectedZone: ConquestZone;
  state: Pick<UseConquestStateReturn, "detailTab" | "setDetailTab">;
}) {
  const { detailTab, setDetailTab } = state;

  return (
    <aside
      className={`${styles.panel} ${styles.detailPanel}`}
      aria-label={`${selectedZone.name} details`}
    >
      <div className={styles.panelHeader}>
        <h2>
          <Flag size={18} />
          Zone Details
        </h2>
        <span className={styles.statusPill} data-tone={getPressureTone(selectedZone)}>
          {getStatusLabel(selectedZone.status)}
        </span>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.detailHero} style={getZoneStyle(selectedZone)}>
          <div className={styles.detailHeroTop}>
            <div>
              <h2>{selectedZone.name}</h2>
              <p>{getPressureLabel(selectedZone)}</p>
            </div>
            <a
              className={styles.detailMapLink}
              href={`/map?location=${encodeURIComponent(selectedZone.key)}`}
              aria-label={`Open ${selectedZone.name} on the world map`}
            >
              <MapPinned size={16} />
              Open Map
            </a>
          </div>
          <div className={styles.detailGrid}>
            <div>
              <span>XP</span>
              <strong>{formatConquestNumber(selectedZone.experience)}</strong>
            </div>
            <div>
              <span>Kills</span>
              <strong>{formatConquestNumber(selectedZone.kills)}</strong>
            </div>
            <div>
              <span>Guilds</span>
              <strong>
                {formatConquestNumber(selectedZone.leaderboard_count)} / {formatConquestNumber(selectedZone.guilds_count)}
              </strong>
            </div>
            <div>
              <span>Assaults</span>
              <strong>{formatConquestNumber(selectedZone.active_assaults_count)}</strong>
            </div>
            <div>
              <span>Control</span>
              <strong>{formatConquestPercent(getLeaderShare(selectedZone))}</strong>
            </div>
            <div>
              <span>Lead</span>
              <strong>{formatConquestNumber(getLeaderMargin(selectedZone))}</strong>
            </div>
            <div>
              <span>XP/Kill</span>
              <strong>{formatConquestDecimal(getXpPerKill(selectedZone))}</strong>
            </div>
            <div>
              <span>Contributors</span>
              <strong>{formatConquestNumber(selectedZone.contribution_count)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.briefingGrid}>
          <div className={styles.briefingCard}>
            <span>Leader</span>
            <strong>{getDominantGuild(selectedZone)?.name ?? "Unknown Guild"}</strong>
            <p>{formatConquestPercent(getLeaderShare(selectedZone))} of zone XP.</p>
          </div>
          <div className={styles.briefingCard}>
            <span>Challenger</span>
            <strong>{getRunnerUp(selectedZone)?.guild?.name ?? "No challenger"}</strong>
            <p>
              {getRunnerUp(selectedZone)
                ? `${formatConquestNumber(getLeaderMargin(selectedZone))} XP behind.`
                : "Zone is uncontested."}
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
          {selectedZone.guild_leaderboard.length > 0 ? (
            selectedZone.guild_leaderboard.map((row) => (
              <GuildRow
                key={`${selectedZone.key}-${row.position}-${row.guild?.id ?? row.guild?.name}`}
                row={row}
              />
            ))
          ) : (
            <NoResultsState
              compact
              title="No guilds shown"
              description="The latest conquest snapshot did not include guild rows for this zone."
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
          {selectedZone.top_contributors.length > 0 ? (
            selectedZone.top_contributors.map((row, index) => (
              <ContributorRow
                key={`${selectedZone.key}-${row.id ?? `${row.character?.name ?? "player"}-${index}`}`}
                row={row}
              />
            ))
          ) : (
            <NoResultsState
              compact
              title="No players shown"
              description="The latest conquest snapshot did not include player contribution rows for this zone."
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
          {selectedZone.active_assaults.length > 0 ? (
            selectedZone.active_assaults.map((assault, index) => (
              <AssaultRow
                key={`${selectedZone.key}-assault-${assault.guild?.id ?? index}`}
                assault={assault}
                index={index}
              />
            ))
          ) : (
            <NoResultsState
              compact
              title="No active fight"
              description="No guild is actively assaulting this zone in the latest snapshot."
            />
          )}
        </div>
      </div>
    </aside>
  );
}
