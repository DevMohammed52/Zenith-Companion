export type ConquestGuild = {
  id: number | null;
  name: string;
  tag: string | null;
  icon_url: string | null;
  background_url: string | null;
};

export type ConquestCharacter = {
  name: string;
  total_level: number | null;
  image_url: string | null;
  background_url: string | null;
};

export type ConquestGuildRow = {
  position: number | null;
  kills: number;
  experience: number;
  guild: ConquestGuild | null;
};

export type ConquestContributorRow = {
  id: number | null;
  guild_conquest_progress_id: number | null;
  kills: number;
  experience: number;
  guild: ConquestGuild | null;
  character: ConquestCharacter | null;
};

export type ConquestZone = {
  id: number | null;
  key: string;
  name: string;
  image_url: string | null;
  status: string | null;
  colour: string | null;
  kills: number;
  experience: number;
  guilds_count: number;
  active_assaults_count: number;
  leaderboard_count: number;
  contribution_count: number;
  active_assaults: Array<{
    kills: number;
    experience: number;
    guild: ConquestGuild | null;
  }>;
  guild_leaderboard: ConquestGuildRow[];
  top_contributors: ConquestContributorRow[];
};

export type ConquestData = {
  meta: {
    generated_at: string;
    fetched_at: string;
    season_number: string | number | null;
    endpoint_updates_at: string | null;
    rate_profile: string;
    delay_ms: number;
    stats: {
      completed: number;
      estimated_total: number;
      elapsed_ms: number;
    };
    totals: {
      zones: number;
      active_assaults: number;
      leaderboard_rows: number;
      contribution_rows: number;
      guilds_observed: number;
    };
  };
  zones: ConquestZone[];
  top_contributors: Array<ConquestContributorRow & { zone: { id: number | null; key: string; name: string } }>;
};

export function formatConquestNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatConquestAge(value: string | null | undefined) {
  if (!value) return "Unknown";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getZoneIntensity(zone: ConquestZone) {
  return zone.experience + zone.kills * 3 + zone.contribution_count * 1000 + zone.active_assaults_count * 200000;
}

export function getConquestRatio(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

export function formatConquestPercent(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (value >= 99.95) return "100%";
  if (value < 10) return `${value.toFixed(1)}%`;
  return `${Math.round(value)}%`;
}

export function formatConquestDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function getGuildDatabaseUrl(guild: ConquestGuild | null | undefined) {
  if (!guild) return "/guilds";
  if (!guild.id && guild.name) return `/guilds?search=${encodeURIComponent(guild.name)}`;
  if (!guild.id) return "/guilds";
  return `/guilds?guild=${encodeURIComponent(String(guild.id))}`;
}

export function getStatusLabel(status: string | null | undefined) {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getIdleMmoCharacterUrl(name: string) {
  return `https://web.idle-mmo.com/@${encodeURIComponent(name.trim())}`;
}
