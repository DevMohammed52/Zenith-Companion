import {
  getWeatherPreferenceLabel,
  isFavorableWeather,
  isPenalizedWeather,
  type EnrichedEnemy,
  type WeatherPreferenceKind,
} from "@/lib/world-intelligence";

export type SortKey = "level" | "name" | "location" | "lootCount" | "lootEv";
export type MatchFilter = "all" | "favorable" | "penalized" | "loves" | "likes" | "neutral" | "dislikes" | "hates" | "unknown";

export type Option<T extends string> = {
  value: T;
  label: string;
};

export const SORT_OPTIONS: Option<SortKey>[] = [
  { value: "level", label: "Level" },
  { value: "name", label: "Name" },
  { value: "location", label: "Location" },
  { value: "lootCount", label: "Loot count" },
  { value: "lootEv", label: "Loot EV" },
];

export const MATCH_OPTIONS: Option<MatchFilter>[] = [
  { value: "all", label: "All weather" },
  { value: "favorable", label: "Favored now" },
  { value: "penalized", label: "Penalized now" },
  { value: "loves", label: "Loves current" },
  { value: "likes", label: "Likes current" },
  { value: "neutral", label: "Neutral current" },
  { value: "dislikes", label: "Dislikes current" },
  { value: "hates", label: "Hates current" },
  { value: "unknown", label: "Unknown current" },
];

export const LEVEL_OPTIONS: Option<string>[] = [
  { value: "all", label: "All levels" },
  { value: "1-10", label: "Lv. 1-10" },
  { value: "11-25", label: "Lv. 11-25" },
  { value: "26-50", label: "Lv. 26-50" },
  { value: "51-75", label: "Lv. 51-75" },
  { value: "76-100", label: "Lv. 76-100" },
];

export function formatGold(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

export function formatWindow(enemy: EnrichedEnemy) {
  if (isFavorableWeather(enemy.currentWeatherMatch)) {
    return `${enemy.currentWeather?.name || "Favorable"} active now`;
  }
  const weather = enemy.nextFavorableWeather;
  if (!weather) return "No forecast match";
  const start = weather.starts_at ? new Date(weather.starts_at) : null;
  if (!start || !Number.isFinite(start.getTime())) return weather.name || "Favorable";
  return `${weather.name || "Favorable"} ${start.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

export function getEnemyCardLabel(enemy: EnrichedEnemy) {
  const weatherName = enemy.currentWeather?.name || "unknown weather";
  const weatherMatch = getWeatherPreferenceLabel(enemy.currentWeatherMatch).toLowerCase();
  return [
    `Open ${enemy.name}`,
    `level ${enemy.level}`,
    enemy.locationName,
    `${weatherName}: ${weatherMatch}`,
    `${enemy.lootCount} drops`,
    `loot EV ${formatGold(enemy.lootEv)}`,
  ].join(", ");
}

export function matchTone(kind: WeatherPreferenceKind) {
  if (kind === "loves" || kind === "likes") return "good";
  if (kind === "dislikes" || kind === "hates") return "bad";
  if (kind === "neutral") return "neutral";
  return "muted";
}

export function enemyMatchesFilter(enemy: EnrichedEnemy, filter: MatchFilter) {
  if (filter === "all") return true;
  if (filter === "favorable") return isFavorableWeather(enemy.currentWeatherMatch);
  if (filter === "penalized") return isPenalizedWeather(enemy.currentWeatherMatch);
  return enemy.currentWeatherMatch === filter;
}

export function levelMatches(enemy: EnrichedEnemy, levelFilter: string) {
  if (levelFilter === "all") return true;
  const [min, max] = levelFilter.split("-").map(Number);
  return enemy.level >= min && enemy.level <= max;
}
