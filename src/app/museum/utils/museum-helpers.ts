import type { IconConcept } from "@/lib/icons";

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatDateTime(value?: string): string {
  if (!value) return "Not imported yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Import timestamp unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeAge(value?: string): string {
  if (!value) return "Not synced";
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return "Sync unknown";
  const diffMin = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

export function formatPageList(pages?: number[]): string {
  if (!pages?.length) return "None";
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  if (sorted.length <= 6) return sorted.join(", ");
  return `${sorted.slice(0, 5).join(", ")} +${sorted.length - 5}`;
}

export function formatWarningKey(value: string): string {
  const normalized = value.trim();
  const museumPage = normalized.match(/^museum\.page\.(\d+)$/i);
  if (museumPage) return `Museum page ${museumPage[1]} was skipped`;
  if (/^metrics\.private$/i.test(normalized)) return "Metrics were private";
  if (/^museum\.private$/i.test(normalized)) return "Museum was private";
  return normalized
    .replace(/^museum\./i, "Museum ")
    .replace(/^metrics\./i, "Metrics ")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function museumStatusLabel(status?: string): string {
  switch (status) {
    case "imported":
      return "Imported";
    case "partial":
      return "Partial import";
    case "empty":
      return "Imported empty";
    case "private":
      return "Private";
    case "unavailable":
      return "Unavailable";
    default:
      return "Not imported";
  }
}

export function museumEmptyState(status?: string): {
  icon: IconConcept;
  variant: "default" | "error";
  title: string;
  body: string;
} {
  switch (status) {
    case "empty":
      return {
        icon: "check",
        variant: "default",
        title: "Museum snapshot is empty",
        body: "This character has a museum snapshot, but no unlocked entries were returned.",
      };
    case "private":
      return {
        icon: "locked",
        variant: "default",
        title: "Museum is private",
        body: "This character's museum is set to private in IdleMMO. Make it public or re-import with permission to browse entries here.",
      };
    case "unavailable":
      return {
        icon: "error",
        variant: "error",
        title: "Museum unavailable",
        body: "The museum snapshot could not be imported on the last sync. Try re-importing your character profile.",
      };
    case "partial":
      return {
        icon: "warning",
        variant: "default",
        title: "Partial museum snapshot",
        body: "The import recorded a partial museum result without saved entries.",
      };
    default:
      return {
        icon: "museum",
        variant: "default",
        title: "No museum snapshot yet",
        body: "Each character keeps their own museum collection. Import a character on Profiles to inspect their unlocked entries here.",
      };
  }
}
