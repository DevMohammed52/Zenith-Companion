export type PublicDataFreshnessLevel = "fresh" | "running" | "delayed" | "stale" | "old" | "unavailable";

export type PublicDataStatus = {
  timestamp?: string | number;
  last_updated?: string | number;
  currentItem?: string;
  currentIndex?: string | number;
  totalItems?: string | number;
} & Record<string, unknown>;

export const DATA_DELAYED_AFTER_MS = 2.5 * 60 * 60 * 1000;
export const DATA_STALE_AFTER_MS = 6 * 60 * 60 * 1000;
export const DATA_OLD_AFTER_MS = 24 * 60 * 60 * 1000;
export const DATA_RUNNING_RECENT_MS = 30 * 60 * 1000;

export function parsePublicDataTimestamp(status: PublicDataStatus | null | undefined) {
  const value = status?.timestamp ?? status?.last_updated;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function getPublicDataProgress(status: PublicDataStatus | null | undefined) {
  const current = Number(status?.currentIndex ?? 0);
  const total = Number(status?.totalItems ?? 0);
  if (!Number.isFinite(current) || !Number.isFinite(total) || current <= 0 || total <= 0) return null;
  return {
    current,
    total,
    item: typeof status?.currentItem === "string" ? status.currentItem : "",
    complete: current >= total,
  };
}

export function getPublicDataFreshnessLevel(status: PublicDataStatus | null | undefined, now = Date.now()) {
  const timestamp = parsePublicDataTimestamp(status);
  if (!timestamp) return "unavailable";

  const ageMs = Math.max(0, now - timestamp);
  const progress = getPublicDataProgress(status);
  if (progress && !progress.complete && ageMs <= DATA_RUNNING_RECENT_MS) return "running";
  if (ageMs >= DATA_OLD_AFTER_MS) return "old";
  if (ageMs >= DATA_STALE_AFTER_MS) return "stale";
  if (ageMs >= DATA_DELAYED_AFTER_MS) return "delayed";
  return "fresh";
}

export function formatPublicDataAge(timestamp: number | null, now = Date.now()) {
  if (!timestamp) return "unknown";
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
