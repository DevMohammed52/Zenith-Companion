"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  BadgeInfo,
  Check,
  ChevronDown,
  Crown,
  Database,
  ExternalLink,
  Eye,
  Medal,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import styles from "./page.module.css";
import {
  compareGuilds,
  formatGuildAge,
  formatGuildNumber,
  formatGuildPosition,
  getIdleMmoProfileUrl,
  GUILD_TIER_LABELS,
  type GuildDatabase,
  type GuildDetails,
  type GuildRecord,
  type GuildRefreshTier,
  type GuildSortKey,
} from "@/lib/guilds";

type TierFilter = "all" | GuildRefreshTier;

const INITIAL_ROWS = 90;
const ROW_INCREMENT = 90;

const SORT_OPTIONS: Array<{ id: GuildSortKey; label: string }> = [
  { id: "activity", label: "Activity" },
  { id: "season", label: "Season rank" },
  { id: "level", label: "Level" },
  { id: "members", label: "Members" },
  { id: "marks", label: "Marks" },
  { id: "name", label: "Name" },
  { id: "id", label: "Guild ID" },
];

const TIER_FILTERS: Array<{ id: TierFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "hot", label: "Active" },
  { id: "warm", label: "Tracked" },
  { id: "cold", label: "Archive" },
];

function getSearchText(guild: GuildRecord) {
  return [guild.id, guild.name, guild.tag, ...guild.leader_names, ...guild.top_member_names]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (markdownLink) {
          return (
            <a key={`${part}-${index}`} href={markdownLink[2]} target="_blank" rel="noreferrer">
              {markdownLink[1]}
            </a>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          const inner = part.slice(2, -2);
          if (/^https?:\/\//.test(inner)) {
            return (
              <strong key={`${part}-${index}`}>
                <a href={inner} target="_blank" rel="noreferrer">
                  {inner}
                </a>
              </strong>
            );
          }
          return <strong key={`${part}-${index}`}>{inner}</strong>;
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer">
              {part}
            </a>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function GuildMarkdown({ text }: { text: string | null }) {
  if (!text?.trim()) return <p className={styles.mutedText}>No public guild bio was returned by the API.</p>;

  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>
            <InlineMarkdown text={item} />
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      continue;
    }

    flushList();
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length + 2, 5);
      const Heading = `h${level}` as "h3" | "h4" | "h5";
      blocks.push(
        <Heading key={`heading-${blocks.length}`}>
          <InlineMarkdown text={headingMatch[2]} />
        </Heading>,
      );
      continue;
    }

    blocks.push(
      <p key={`paragraph-${blocks.length}`}>
        <InlineMarkdown text={line} />
      </p>,
    );
  }

  flushList();
  return <div className={styles.markdown}>{blocks}</div>;
}

function SortPicker({
  value,
  onChange,
}: {
  value: GuildSortKey;
  onChange: (value: GuildSortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = SORT_OPTIONS.find((option) => option.id === value) || SORT_OPTIONS[0];

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className={styles.sortPicker} ref={rootRef}>
      <button
        type="button"
        className={styles.sortButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>Sort: {selected.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className={styles.sortMenu} role="listbox" aria-label="Sort guilds">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={value === option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {value === option.id && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberLink({
  member,
}: {
  member: { hashed_id?: string | null; name: string; position?: string | null; total_level?: number | null };
}) {
  return (
    <a className={styles.memberRow} href={getIdleMmoProfileUrl(member.name)} target="_blank" rel="noreferrer">
      <div>
        <strong>{member.name}</strong>
        <span>{formatGuildPosition(member.position)}</span>
      </div>
      <span className={styles.memberLevel}>
        {formatGuildNumber(member.total_level)} TL <ExternalLink size={13} aria-hidden="true" />
      </span>
    </a>
  );
}

function GuildModal({
  guild,
  details,
  loading,
  onClose,
}: {
  guild: GuildRecord;
  details: GuildDetails | null;
  loading: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const modal = (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      onMouseDown={onClose}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guild-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={styles.modalArt}
          style={{
            backgroundImage: guild.background_url
              ? `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.78)), url(${guild.background_url})`
              : "linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(148, 163, 184, 0.1))",
          }}
        >
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close guild details">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <header className={styles.modalHeader}>
            {guild.icon_url ? <img src={guild.icon_url} alt="" /> : <span className={styles.guildIcon} />}
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
              <strong>{formatGuildNumber(guild.highest_total_level)}</strong>
            </div>
          </div>

          {loading ? (
            <p className={styles.mutedText}>Loading guild details...</p>
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
                    details.member_summary.leaders.map((member) => (
                      <MemberLink member={member} key={`${guild.id}-leader-${member.hashed_id || member.name}`} />
                    ))
                  ) : (
                    <p className={styles.mutedText}>No leadership roles were returned for this guild.</p>
                  )}
                </div>

                <h3 className={styles.sectionTitle}>
                  <Medal size={16} /> All Members ({formatGuildNumber(details?.members.length || guild.member_count)})
                </h3>
                <div className={styles.memberList}>
                  {(details?.members || []).map((member) => (
                    <MemberLink member={member} key={`${guild.id}-member-${member.hashed_id || member.name}`} />
                  ))}
                </div>

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

export default function GuildsPage() {
  const [database, setDatabase] = useState<GuildDatabase | null>(null);
  const [detailsById, setDetailsById] = useState<Map<number, GuildDetails> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [sortBy, setSortBy] = useState<GuildSortKey>("activity");
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_ROWS);
  const [inspectingGuild, setInspectingGuild] = useState<GuildRecord | null>(null);
  const initialQueryHandled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/guild-database.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load guild database (${response.status})`);
        return response.json() as Promise<GuildDatabase>;
      })
      .then((payload) => {
        if (!cancelled) setDatabase(payload);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Unable to load guild database");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisibleLimit(INITIAL_ROWS);
  }, [search, tier, sortBy]);

  const guilds = database?.guilds || [];
  const filteredGuilds = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return guilds
      .filter((guild) => tier === "all" || guild.refresh_tier === tier)
      .filter((guild) => !normalizedSearch || getSearchText(guild).includes(normalizedSearch))
      .sort((a, b) => compareGuilds(a, b, sortBy));
  }, [guilds, search, sortBy, tier]);
  const visibleGuilds = filteredGuilds.slice(0, visibleLimit);
  const tierCounts = database?.meta.totals.tiers || { hot: 0, warm: 0, cold: 0 };

  const loadDetails = async (guild: GuildRecord) => {
    setInspectingGuild(guild);
    if (detailsById?.has(guild.id)) return;
    setDetailsLoading(true);
    try {
      const response = await fetch(`/guild-details/${guild.id}.json`);
      if (!response.ok) throw new Error(`Unable to load guild details (${response.status})`);
      const payload = (await response.json()) as GuildDetails;
      setDetailsById((current) => {
        const next = new Map(current || []);
        next.set(guild.id, payload);
        return next;
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const selectedDetails = inspectingGuild ? detailsById?.get(inspectingGuild.id) || null : null;

  useEffect(() => {
    if (!database || initialQueryHandled.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const guildQuery = params.get("guild");
    const searchQuery = params.get("search");
    const query = guildQuery || searchQuery;
    if (!query?.trim()) return;

    initialQueryHandled.current = true;
    setSearch(query.trim());

    if (guildQuery) {
      const matchingGuild = guilds.find((guild) => String(guild.id) === guildQuery.trim());
      if (matchingGuild) void loadDetails(matchingGuild);
    }
  }, [database, guilds]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>Guild Intelligence</div>
          <h1 className={styles.title}>Guild Database</h1>
          <p className={styles.subtitle}>
            Search every discovered guild, compare activity signals, and open a focused inspection view for bios,
            leadership, member rosters, and refresh freshness.
          </p>
        </div>

        <div className={styles.freshness}>
          <span>Baseline fetched</span>
          <strong>{formatGuildAge(database?.meta.source_fetched_at)}</strong>
          <span>{database?.meta.source_fetched_at ? new Date(database.meta.source_fetched_at).toLocaleString() : "Waiting for data"}</span>
        </div>
      </section>

      {error ? (
        <div className={styles.empty}>{error}</div>
      ) : (
        <>
          <section className={styles.statsGrid} aria-label="Guild database summary">
            <div className={styles.stat}>
              <span className={styles.statIcon}>
                <Database size={18} />
              </span>
              <div>
                <div className={styles.statValue}>{formatGuildNumber(database?.meta.totals.guilds)}</div>
                <div className={styles.statLabel}>Guilds indexed</div>
              </div>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIcon}>
                <Users size={18} />
              </span>
              <div>
                <div className={styles.statValue}>{formatGuildNumber(database?.meta.totals.members)}</div>
                <div className={styles.statLabel}>Member rows</div>
              </div>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIcon}>
                <Activity size={18} />
              </span>
              <div>
                <div className={styles.statValue}>{formatGuildNumber(tierCounts.hot)}</div>
                <div className={styles.statLabel}>Active refresh tier</div>
              </div>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIcon}>
                <Shield size={18} />
              </span>
              <div>
                <div className={styles.statValue}>{formatGuildNumber(filteredGuilds.length)}</div>
                <div className={styles.statLabel}>Visible results</div>
              </div>
            </div>
          </section>

          <section className={styles.toolbar} aria-label="Guild filters">
            <label className={styles.search}>
              <Search size={17} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guild, tag, leader, top member, or ID"
              />
            </label>

            <div className={styles.tierTabs} role="tablist" aria-label="Refresh tier">
              {TIER_FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-active={tier === option.id}
                  onClick={() => setTier(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <SortPicker value={sortBy} onChange={setSortBy} />
          </section>

          <section className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Guild</th>
                    <th>Tier</th>
                    <th>Season</th>
                    <th>Level</th>
                    <th>Members</th>
                    <th>Marks</th>
                    <th>Avg TL</th>
                    <th>Score</th>
                    <th>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleGuilds.map((guild) => (
                    <tr key={guild.id}>
                      <td>
                        <div className={styles.guildName}>
                          {guild.icon_url ? <img className={styles.guildIcon} src={guild.icon_url} alt="" loading="lazy" /> : <span className={styles.guildIcon} />}
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
                        <button type="button" className={styles.inspectButton} onClick={() => loadDetails(guild)}>
                          <Eye size={15} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredGuilds.length === 0 && <div className={styles.empty}>No guilds match the current filters.</div>}
            </div>
            {visibleGuilds.length < filteredGuilds.length && (
              <div className={styles.showMoreBar}>
                <span>
                  Showing {formatGuildNumber(visibleGuilds.length)} of {formatGuildNumber(filteredGuilds.length)}
                </span>
                <button type="button" onClick={() => setVisibleLimit((current) => current + ROW_INCREMENT)}>
                  Show more
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {inspectingGuild && (
        <GuildModal
          guild={inspectingGuild}
          details={selectedDetails}
          loading={detailsLoading}
          onClose={() => setInspectingGuild(null)}
        />
      )}
    </main>
  );
}
