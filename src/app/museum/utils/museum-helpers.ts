import { AlertTriangle, CheckCircle2, Database, LockKeyhole } from "lucide-react";
import type { MuseumCategory } from "../types";

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

export function categoryTone(category: MuseumCategory): string {
  switch (category) {
    case "SKINS":
      return "violet";
    case "BACKGROUNDS":
      return "cyan";
    case "GUILD_ICONS":
      return "gold";
    case "PETS":
      return "green";
    case "COLLECTIBLES":
      return "amber";
    case "BESTIARY":
      return "rose";
    default:
      return "violet";
  }
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

export function museumEmptyState(status?: string) {
  switch (status) {
    case "empty":
      return {
        icon: CheckCircle2,
        title: "Museum snapshot is empty",
        body: "This profile has a museum snapshot, but the import did not include any collection items.",
      };
    case "private":
      return {
        icon: LockKeyhole,
        title: "Museum is private",
        body: "Museum profile data is private or not yet imported. You can still use the rest of the profile manually.",
      };
    case "unavailable":
      return {
        icon: AlertTriangle,
        title: "Museum unavailable",
        body: "The museum snapshot could not be imported. The saved status is kept so this is not mistaken for missing setup.",
      };
    case "partial":
      return {
        icon: AlertTriangle,
        title: "Partial museum snapshot",
        body: "The import recorded a partial museum result, but no usable collection items were saved.",
      };
    default:
      return {
        icon: Database,
        title: "No museum snapshot for this character",
        body: "Each character in IdleMMO has their own personal museum collection. To view this character's museum, import their profile using their character hash.",
      };
  }
}
