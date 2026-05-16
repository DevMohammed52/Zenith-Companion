export type GuildRefreshTier = "hot" | "warm" | "cold";

export type GuildMember = {
  name: string;
  position: string | null;
  total_level: number | null;
  image_url: string | null;
  background_url: string | null;
};

export type GuildRecord = {
  id: number;
  name: string;
  tag: string | null;
  level: number | null;
  experience?: number | null;
  marks: number | null;
  season_position: number | null;
  member_count: number;
  icon_url: string | null;
  background_url: string | null;
  discovered_from?: string[];
  zones?: Array<{
    key?: string;
    id?: number | null;
    name?: string;
    position?: number | null;
    kills?: number | null;
    experience?: number | null;
  }>;
  refresh_tier: GuildRefreshTier;
  activity_score: number;
  last_info_fetch_at?: string;
  last_members_fetch_at?: string;
  average_total_level: number | null;
  highest_total_level?: number | null;
  leader_names: string[];
  top_member_names: string[];
};

export type GuildDetails = {
  id: number;
  description: string | null;
  last_info_fetch_at: string;
  last_members_fetch_at: string;
  member_summary: {
    average_total_level: number | null;
    highest_total_level: number | null;
    leaders: GuildMember[];
    top_members: GuildMember[];
  };
  members: GuildMember[];
  zones: NonNullable<GuildRecord["zones"]>;
};

export type GuildDatabase = {
  meta: {
    generated_at: string;
    source_fetched_at: string;
    source: string;
    strategy: string;
    totals: {
      guilds: number;
      members: number;
      tiers: Record<GuildRefreshTier, number>;
    };
  };
  guilds: GuildRecord[];
};

export type GuildDetailsDatabase = {
  meta: {
    generated_at: string;
    source_fetched_at: string;
    guilds: number;
  };
  guilds: GuildDetails[];
};

export type GuildSortKey = "activity" | "season" | "level" | "members" | "marks" | "name" | "id";

export const GUILD_TIER_LABELS: Record<GuildRefreshTier, string> = {
  hot: "Active",
  warm: "Tracked",
  cold: "Archive",
};

export function formatGuildNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatGuildAge(value: string | null | undefined) {
  if (!value) return "Unknown";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function tierRank(tier: GuildRefreshTier) {
  if (tier === "hot") return 0;
  if (tier === "warm") return 1;
  return 2;
}

export function compareGuilds(a: GuildRecord, b: GuildRecord, sortKey: GuildSortKey) {
  if (sortKey === "name") return a.name.localeCompare(b.name);
  if (sortKey === "id") return a.id - b.id;
  if (sortKey === "season") {
    const aSeason = a.season_position ?? Number.MAX_SAFE_INTEGER;
    const bSeason = b.season_position ?? Number.MAX_SAFE_INTEGER;
    return aSeason - bSeason || b.activity_score - a.activity_score;
  }
  if (sortKey === "level") return (b.level ?? 0) - (a.level ?? 0) || b.activity_score - a.activity_score;
  if (sortKey === "members") return b.member_count - a.member_count || b.activity_score - a.activity_score;
  if (sortKey === "marks") return (b.marks ?? 0) - (a.marks ?? 0) || b.activity_score - a.activity_score;
  return b.activity_score - a.activity_score || tierRank(a.refresh_tier) - tierRank(b.refresh_tier);
}

export function formatGuildPosition(value: string | null | undefined) {
  if (!value) return "Member";
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getIdleMmoProfileUrl(name: string) {
  return `https://web.idle-mmo.com/@${encodeURIComponent(name.trim())}`;
}
