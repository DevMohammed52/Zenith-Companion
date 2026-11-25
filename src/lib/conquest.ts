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
  id?: number | null;
  position: number | null;
  kills: number;
  experience: number;
  contributions?: number | null;
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

export type ConquestAssault = {
  kills: number;
  experience: number;
  starts_at?: string | null;
  ends_at?: string | null;
  guild: ConquestGuild | null;
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
  active_assaults: ConquestAssault[];
  guild_leaderboard: ConquestGuildRow[];
  top_contributors: ConquestContributorRow[];
};

export type ConquestSeasonSummary = {
  season_number: number;
  total_xp: number;
  total_kills: number;
  zones_count: number;
  guilds_observed: number;
  top_guild: {
    id: number | null;
    name: string;
    tag: string | null;
    icon_url: string | null;
    experience: number;
    zones_won: number;
  } | null;
  top_zone: {
    name: string;
    key: string;
    experience: number;
  } | null;
};

export type ConquestSeasonIndex = {
  generated_at: string;
  current_season: number | null;
  seasons: ConquestSeasonSummary[];
};

export type ConquestRulerTier = {
  rankLabel: string;
  minRank: number;
  maxRank: number;
  primaryExpPercent: number;
  primaryEffPercent: number;
  dungeonMagicFindPercent: number;
  worldBossMagicFindPercent: number;
  combatExpPercent: number;
};

export const CONQUEST_RULER_TIERS: ConquestRulerTier[] = [
  { rankLabel: "1st", minRank: 1, maxRank: 1, primaryExpPercent: 25, primaryEffPercent: 5, dungeonMagicFindPercent: 25, worldBossMagicFindPercent: 25, combatExpPercent: 25 },
  { rankLabel: "2nd", minRank: 2, maxRank: 2, primaryExpPercent: 17, primaryEffPercent: 5, dungeonMagicFindPercent: 17, worldBossMagicFindPercent: 17, combatExpPercent: 17 },
  { rankLabel: "3rd", minRank: 3, maxRank: 3, primaryExpPercent: 13, primaryEffPercent: 5, dungeonMagicFindPercent: 13, worldBossMagicFindPercent: 13, combatExpPercent: 13 },
  { rankLabel: "4th", minRank: 4, maxRank: 4, primaryExpPercent: 10, primaryEffPercent: 3, dungeonMagicFindPercent: 10, worldBossMagicFindPercent: 10, combatExpPercent: 10 },
  { rankLabel: "5th-7th", minRank: 5, maxRank: 7, primaryExpPercent: 7, primaryEffPercent: 3, dungeonMagicFindPercent: 7, worldBossMagicFindPercent: 7, combatExpPercent: 7 },
  { rankLabel: "8th-10th", minRank: 8, maxRank: 10, primaryExpPercent: 3, primaryEffPercent: 2, dungeonMagicFindPercent: 3, worldBossMagicFindPercent: 3, combatExpPercent: 3 },
];

export const CONQUEST_SHARD_REWARDS: Array<{
  rankLabel: string;
  minRank: number;
  maxRank: number;
  expShards: number;
  killsShards: number;
}> = [
  { rankLabel: "1st", minRank: 1, maxRank: 1, expShards: 20000, killsShards: 5000 },
  { rankLabel: "2nd", minRank: 2, maxRank: 2, expShards: 15000, killsShards: 3750 },
  { rankLabel: "3rd", minRank: 3, maxRank: 3, expShards: 10000, killsShards: 2500 },
  { rankLabel: "4th", minRank: 4, maxRank: 4, expShards: 5000, killsShards: 1250 },
  { rankLabel: "5th", minRank: 5, maxRank: 5, expShards: 4800, killsShards: 1200 },
  { rankLabel: "6th", minRank: 6, maxRank: 6, expShards: 4500, killsShards: 1125 },
  { rankLabel: "7th", minRank: 7, maxRank: 7, expShards: 4000, killsShards: 1000 },
  { rankLabel: "8th", minRank: 8, maxRank: 8, expShards: 3500, killsShards: 875 },
  { rankLabel: "9th", minRank: 9, maxRank: 9, expShards: 3000, killsShards: 750 },
  { rankLabel: "10th", minRank: 10, maxRank: 10, expShards: 2000, killsShards: 500 },
  { rankLabel: "11th-25th", minRank: 11, maxRank: 25, expShards: 1000, killsShards: 250 },
];

export function getConquestRulerTier(position: number | null | undefined): ConquestRulerTier | null {
  if (!position || position < 1) return null;
  return CONQUEST_RULER_TIERS.find((tier) => position >= tier.minRank && position <= tier.maxRank) ?? null;
}

export function getConquestExpShardReward(rank: number | null | undefined): number {
  if (!rank || rank < 1) return 0;
  return CONQUEST_SHARD_REWARDS.find((tier) => rank >= tier.minRank && rank <= tier.maxRank)?.expShards ?? 0;
}

export function formatAssaultCountdown(endsAt: string | null | undefined): string | null {
  if (!endsAt) return null;
  const target = new Date(endsAt).getTime();
  if (!Number.isFinite(target)) return null;
  const diffMs = target - Date.now();
  if (diffMs <= 0) return "Ended";
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

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
