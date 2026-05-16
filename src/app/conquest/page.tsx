"use client";

import {
  Crown,
  Crosshair,
  ExternalLink,
  Flag,
  Flame,
  MapPinned,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  formatConquestAge,
  formatConquestDecimal,
  formatConquestNumber,
  formatConquestPercent,
  getConquestRatio,
  getGuildDatabaseUrl,
  getIdleMmoCharacterUrl,
  getStatusLabel,
  getZoneIntensity,
  type ConquestContributorRow,
  type ConquestData,
  type ConquestGuild,
  type ConquestGuildRow,
  type ConquestZone,
} from "@/lib/conquest";
import styles from "./page.module.css";

type ZoneFilter = "all" | "active" | "contested" | "dominated";
type DetailTab = "guilds" | "contributors" | "assaults";

const FILTERS: Array<{ key: ZoneFilter; label: string }> = [
  { key: "all", label: "All Zones" },
  { key: "active", label: "Active Assaults" },
  { key: "contested", label: "Contested" },
  { key: "dominated", label: "Dominated" },
];

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "guilds", label: "Guilds" },
  { key: "contributors", label: "Contributors" },
  { key: "assaults", label: "Assaults" },
];

const fallbackZoneBackground = "linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(20, 184, 166, 0.12))";

function zoneMatchesFilter(zone: ConquestZone, filter: ZoneFilter) {
  if (filter === "active") return zone.active_assaults_count > 0;
  if (filter === "contested") return zone.status === "CONTESTED";
  if (filter === "dominated") return zone.status === "DOMINATED";
  return true;
}

function getZoneStyle(zone: ConquestZone): CSSProperties {
  return {
    "--zone-image": zone.image_url ? `url(${zone.image_url})` : fallbackZoneBackground,
    "--detail-image": zone.image_url ? `url(${zone.image_url})` : fallbackZoneBackground,
    "--zone-color": zone.colour || "#8b5cf6",
  } as CSSProperties;
}

function getDominantGuild(zone: ConquestZone) {
  return zone.guild_leaderboard[0]?.guild ?? null;
}

function getRunnerUp(zone: ConquestZone) {
  return zone.guild_leaderboard[1] ?? null;
}

function getLeaderShare(zone: ConquestZone) {
  return getConquestRatio(zone.guild_leaderboard[0]?.experience ?? 0, zone.experience);
}

function getLeaderMargin(zone: ConquestZone) {
  const leader = zone.guild_leaderboard[0];
  const runnerUp = getRunnerUp(zone);
  if (!leader || !runnerUp) return null;
  return Math.max(0, leader.experience - runnerUp.experience);
}

function getXpPerKill(zone: ConquestZone) {
  if (!zone.kills) return null;
  return zone.experience / zone.kills;
}

function getPressureLabel(zone: ConquestZone) {
  if (zone.active_assaults_count > 0) return "Under attack";
  if (zone.status === "CONTESTED") return "Contested";
  const share = getLeaderShare(zone);
  if (share >= 95) return "Controlled";
  if (share >= 70) return "Leading";
  return "Close race";
}

function getPressureTone(zone: ConquestZone) {
  if (zone.active_assaults_count > 0) return "hot";
  if (zone.status === "CONTESTED") return "warn";
  if (getLeaderShare(zone) >= 95) return "calm";
  return "active";
}

function GuildIcon({ guild }: { guild: ConquestGuild | null }) {
  if (guild?.icon_url) {
    return <img className={styles.guildIcon} src={guild.icon_url} alt="" loading="lazy" />;
  }

  return (
    <div className={styles.guildIcon} aria-hidden="true">
      <Shield size={18} />
    </div>
  );
}

function CharacterAvatar({ row }: { row: ConquestContributorRow }) {
  const image = row.character?.image_url;
  if (image) return <img className={styles.avatar} src={image} alt="" loading="lazy" />;

  return (
    <div className={styles.avatar} aria-hidden="true">
      <Users size={17} />
    </div>
  );
}

function GuildRow({ row }: { row: ConquestGuildRow }) {
  const guild = row.guild;
  return (
    <a className={styles.leaderRow} href={getGuildDatabaseUrl(guild)}>
      <span className={styles.rank}>#{row.position ?? "-"}</span>
      <GuildIcon guild={guild} />
      <span className={styles.rowMain}>
        <strong>{guild?.name ?? "Unknown Guild"}</strong>
        <span>{guild?.tag ? `${guild.tag} - Guild Database` : "Open Guild Database"}</span>
      </span>
      <span className={styles.rowStats}>
        <span>{formatConquestNumber(row.experience)} XP</span>
        <span>{formatConquestNumber(row.kills)} kills</span>
      </span>
    </a>
  );
}

function ContributorRow({ row, zoneName }: { row: ConquestContributorRow; zoneName?: string }) {
  const character = row.character;
  const name = character?.name ?? "Unknown Player";
  const href = character?.name ? getIdleMmoCharacterUrl(character.name) : undefined;
  const body = (
    <>
      <CharacterAvatar row={row} />
      <span className={styles.rowMain}>
        <strong>{name}</strong>
        <span>
          {character?.total_level ? `TL ${formatConquestNumber(character.total_level)}` : "Total level unknown"}
          {zoneName ? ` - ${zoneName}` : ""}
        </span>
      </span>
      <span className={styles.rowStats}>
        <span>{formatConquestNumber(row.experience)} XP</span>
        <span>{formatConquestNumber(row.kills)} kills</span>
        <span>{formatConquestDecimal(row.kills ? row.experience / row.kills : null)} XP/kill</span>
        {href && <ExternalLink size={14} aria-hidden="true" />}
      </span>
    </>
  );

  if (!href) return <div className={styles.contributorRow}>{body}</div>;

  return (
    <a className={styles.contributorRow} href={href} target="_blank" rel="noreferrer">
      {body}
    </a>
  );
}

function AssaultRow({ assault, index }: { assault: ConquestZone["active_assaults"][number]; index: number }) {
  return (
    <div className={styles.assaultRow}>
      <span className={styles.rank}>#{index + 1}</span>
      <GuildIcon guild={assault.guild} />
      <span className={styles.rowMain}>
        <strong>{assault.guild?.name ?? "Unknown Guild"}</strong>
        <span>{assault.guild?.tag ?? "Active assault"}</span>
      </span>
      <span className={styles.rowStats}>
        <span>{formatConquestNumber(assault.experience)} XP</span>
        <span>{formatConquestNumber(assault.kills)} kills</span>
      </span>
    </div>
  );
}

function ControlBar({ row, total }: { row: ConquestGuildRow; total: number }) {
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

export default function ConquestPage() {
  const [data, setData] = useState<ConquestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<ZoneFilter>("all");
  const [detailTab, setDetailTab] = useState<DetailTab>("guilds");

  useEffect(() => {
    let cancelled = false;

    fetch("/conquest-data.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Conquest data returned ${response.status}`);
        return response.json() as Promise<ConquestData>;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        const startingZone =
          payload.zones.find((zone) => zone.active_assaults_count > 0) ??
          [...payload.zones].sort((a, b) => getZoneIntensity(b) - getZoneIntensity(a))[0] ??
          null;
        setSelectedZoneKey(startingZone?.key ?? null);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Unable to load conquest data.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredZones = useMemo(() => {
    return [...(data?.zones ?? [])]
      .filter((zone) => zoneMatchesFilter(zone, filter))
      .sort((a, b) => {
        if (b.active_assaults_count !== a.active_assaults_count) return b.active_assaults_count - a.active_assaults_count;
        return getZoneIntensity(b) - getZoneIntensity(a);
      });
  }, [data, filter]);

  const selectedZone = useMemo(() => {
    if (!data?.zones.length) return null;
    return data.zones.find((zone) => zone.key === selectedZoneKey) ?? filteredZones[0] ?? data.zones[0];
  }, [data, filteredZones, selectedZoneKey]);
  const zoneStatus = data
    ? `${formatConquestNumber(filteredZones.length)} conquest zone${filteredZones.length === 1 ? "" : "s"} shown. ${selectedZone?.name ?? "No zone"} selected.`
    : "Conquest data is loading.";

  const seasonLeaders = useMemo(() => {
    return (data?.zones ?? [])
      .map((zone) => ({ zone, row: zone.guild_leaderboard[0] }))
      .filter((entry): entry is { zone: ConquestZone; row: ConquestGuildRow } => Boolean(entry.row?.guild))
      .sort((a, b) => b.row.experience - a.row.experience);
  }, [data]);

  const activeAssaults = useMemo(() => {
    return (data?.zones ?? []).flatMap((zone) =>
      zone.active_assaults.map((assault) => ({
        zone,
        assault,
      })),
    );
  }, [data]);

  const tightestRace = useMemo(() => {
    return [...(data?.zones ?? [])]
      .filter((zone) => zone.guild_leaderboard.length > 1)
      .sort((a, b) => (getLeaderMargin(a) ?? Number.MAX_SAFE_INTEGER) - (getLeaderMargin(b) ?? Number.MAX_SAFE_INTEGER))[0] ?? null;
  }, [data]);

  const lockedZones = useMemo(() => {
    return (data?.zones ?? []).filter((zone) => getLeaderShare(zone) >= 95);
  }, [data]);

  const highestYieldZone = useMemo(() => {
    return [...(data?.zones ?? [])].sort((a, b) => (getXpPerKill(b) ?? 0) - (getXpPerKill(a) ?? 0))[0] ?? null;
  }, [data]);

  if (error) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <div className={styles.empty}>{error}</div>
        </section>
      </main>
    );
  }

  if (!data || !selectedZone) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <div className={styles.empty}>Loading conquest data...</div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}><ZenithIcon name="conquest" size={15} /> Guild Conquest</div>
          <h1 className={styles.title}>Conquest</h1>
          <p className={styles.subtitle}>
            See who controls each zone, where fights are active, and which players are carrying the season.
          </p>
        </div>
        <div className={styles.freshness}>
          <span>Updated</span>
          <strong>{formatConquestAge(data.meta.generated_at)}</strong>
          <span>{new Date(data.meta.generated_at).toLocaleString()}</span>
          <span>{data.meta.season_number ? `Season ${data.meta.season_number}` : "Current season"}</span>
        </div>
      </section>

      <section className={styles.commandGrid} aria-label="Conquest highlights">
        <article className={styles.commandCard} data-tone={activeAssaults.length > 0 ? "hot" : "calm"}>
          <div className={styles.commandIcon}>
            <Flame size={18} />
          </div>
          <div>
            <span>Active Now</span>
            <strong>{activeAssaults[0]?.zone.name ?? "None"}</strong>
            <p>
              {activeAssaults[0]?.assault.guild?.name
                ? `${activeAssaults[0].assault.guild.name} is attacking this zone.`
                : "No active assault in the latest data."}
            </p>
          </div>
        </article>
        <article className={styles.commandCard} data-tone="warn">
          <div className={styles.commandIcon}>
            <Crosshair size={18} />
          </div>
          <div>
            <span>Closest Zone</span>
            <strong>{tightestRace?.name ?? "None"}</strong>
            <p>
              {tightestRace
                ? `${getDominantGuild(tightestRace)?.name ?? "Leader"} leads by ${formatConquestNumber(getLeaderMargin(tightestRace))} XP.`
                : "No close race found."}
            </p>
          </div>
        </article>
        <article className={styles.commandCard} data-tone="active">
          <div className={styles.commandIcon}>
            <Trophy size={18} />
          </div>
          <div>
            <span>Most Rewarding</span>
            <strong>{highestYieldZone?.name ?? "None"}</strong>
            <p>
              {highestYieldZone
                ? `${formatConquestDecimal(getXpPerKill(highestYieldZone))} XP per kill.`
                : "No zone data available."}
            </p>
          </div>
        </article>
        <article className={styles.commandCard} data-tone="calm">
          <div className={styles.commandIcon}>
            <Shield size={18} />
          </div>
          <div>
            <span>Strong Holds</span>
            <strong>{formatConquestNumber(lockedZones.length)}</strong>
            <p>Zones where one guild has almost full control.</p>
          </div>
        </article>
      </section>

      <section className={styles.toolbar} aria-label="Zone filters">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            data-active={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </section>
      <p className="sr-only" role="status" aria-live="polite">{zoneStatus}</p>

      <section className={styles.layout}>
        <div className={styles.zoneGrid} aria-label="Conquest zones">
          {filteredZones.map((zone) => {
            const guild = getDominantGuild(zone);
            const leaderShare = getLeaderShare(zone);
            return (
              <article
                key={zone.key}
                className={styles.zoneCard}
                style={getZoneStyle(zone)}
                data-selected={selectedZone.key === zone.key}
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
                  aria-pressed={selectedZone.key === zone.key}
                  onClick={() => setSelectedZoneKey(zone.key)}
                >
                  <div className={styles.zoneBody}>
                    <div className={styles.zoneTop}>
                      <h2 className={styles.zoneName}>{zone.name}</h2>
                      <span className={styles.zoneActions}>
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
                          <span>{guild ? (guild.tag ? `${guild.tag} - leading guild` : "Leading guild") : "No public leader in snapshot"}</span>
                        </span>
                      </div>

                      <div className={styles.zoneControl} aria-label={`${formatConquestPercent(leaderShare)} control share`}>
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
                          <strong>{formatConquestNumber(zone.leaderboard_count)} / {formatConquestNumber(zone.guilds_count)}</strong>
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
        </div>

        <aside className={styles.panel} aria-label={`${selectedZone.name} details`}>
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
                <a className={styles.detailMapLink} href={`/map?location=${encodeURIComponent(selectedZone.key)}`} aria-label={`Open ${selectedZone.name} on the world map`}>
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
                  <strong>{formatConquestNumber(selectedZone.leaderboard_count)} / {formatConquestNumber(selectedZone.guilds_count)}</strong>
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
                <strong>{getRunnerUp(selectedZone)?.guild?.name ?? "No challenger returned"}</strong>
                <p>
                  {getRunnerUp(selectedZone)
                    ? `${formatConquestNumber(getLeaderMargin(selectedZone))} XP behind.`
                    : "No challenger shown."}
                </p>
              </div>
            </div>

            {selectedZone.guild_leaderboard.length > 0 && (
              <div className={styles.controlStack} aria-label={`${selectedZone.name} control distribution`}>
                {selectedZone.guild_leaderboard.slice(0, 5).map((row) => (
                  <ControlBar key={`${selectedZone.key}-control-${row.position}-${row.guild?.id ?? row.guild?.name}`} row={row} total={selectedZone.experience} />
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
                  aria-controls={detailTab === item.key ? `conquest-panel-${item.key}` : undefined}
                  aria-selected={detailTab === item.key}
                  data-active={detailTab === item.key}
                  tabIndex={detailTab === item.key ? 0 : -1}
                  onClick={() => setDetailTab(item.key)}
                  onKeyDown={(event) => {
                    const currentIndex = DETAIL_TABS.findIndex((tab) => tab.key === item.key);
                    const activateTab = (nextTab: DetailTab) => {
                      setDetailTab(nextTab);
                      window.requestAnimationFrame(() => document.getElementById(`conquest-tab-${nextTab}`)?.focus());
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

            {detailTab === "guilds" && (
              <div className={styles.rowList} id="conquest-panel-guilds" role="tabpanel" aria-labelledby="conquest-tab-guilds">
                {selectedZone.guild_leaderboard.length > 0 ? (
                  selectedZone.guild_leaderboard.map((row) => (
                    <GuildRow key={`${selectedZone.key}-${row.position}-${row.guild?.id ?? row.guild?.name}`} row={row} />
                  ))
                ) : (
                  <div className={styles.empty}>No guilds are shown for this zone.</div>
                )}
              </div>
            )}

            {detailTab === "contributors" && (
              <div className={styles.rowList} id="conquest-panel-contributors" role="tabpanel" aria-labelledby="conquest-tab-contributors">
                {selectedZone.top_contributors.length > 0 ? (
                  selectedZone.top_contributors.map((row, index) => (
                    <ContributorRow
                      key={`${selectedZone.key}-${row.id ?? `${row.character?.name ?? "player"}-${index}`}`}
                      row={row}
                    />
                  ))
                ) : (
                  <div className={styles.empty}>No players are shown for this zone.</div>
                )}
              </div>
            )}

            {detailTab === "assaults" && (
              <div className={styles.rowList} id="conquest-panel-assaults" role="tabpanel" aria-labelledby="conquest-tab-assaults">
                {selectedZone.active_assaults.length > 0 ? (
                  selectedZone.active_assaults.map((assault, index) => (
                    <AssaultRow key={`${selectedZone.key}-assault-${assault.guild?.id ?? index}`} assault={assault} index={index} />
                  ))
                ) : (
                  <div className={styles.empty}>No active fight in this zone right now.</div>
                )}
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className={styles.globalGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>
              <Trophy size={18} />
              Season Zone Leaders
            </h3>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.rowList}>
              {seasonLeaders.map(({ zone, row }) => (
                <a key={`${zone.key}-${row.guild?.id ?? row.guild?.name}`} className={styles.leaderRow} href={getGuildDatabaseUrl(row.guild)}>
                  <span className={styles.rank}>#{row.position ?? "-"}</span>
                  <GuildIcon guild={row.guild} />
                  <span className={styles.rowMain}>
                    <strong>{row.guild?.name ?? "Unknown Guild"}</strong>
                    <span>{zone.name} - {formatConquestPercent(getConquestRatio(row.experience, zone.experience))} share</span>
                  </span>
                  <span className={styles.rowStats}>
                    <span>{formatConquestNumber(row.experience)} XP</span>
                    <span>{formatConquestNumber(row.kills)} kills</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>
              <Crown size={18} />
              Top Contributors
            </h3>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.rowList}>
              {data.top_contributors.slice(0, 12).map((row, index) => (
                <ContributorRow
                  key={`global-${row.zone.key}-${row.id ?? `${row.character?.name ?? "player"}-${index}`}`}
                  row={row}
                  zoneName={row.zone.name}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
