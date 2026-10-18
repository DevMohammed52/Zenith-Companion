export type FormatGoldOptions = {
  maximumFractionDigits?: number;
  unit?: boolean;
};

export function formatGold(
  value: number,
  optionsOrDigits: number | FormatGoldOptions = 0,
): string {
  const maximumFractionDigits =
    typeof optionsOrDigits === "number"
      ? optionsOrDigits
      : optionsOrDigits?.maximumFractionDigits ?? 0;
  const unit = typeof optionsOrDigits === "object" ? Boolean(optionsOrDigits?.unit) : false;

  if (!Number.isFinite(value)) return unit ? "0g" : "0";

  let formatted: string;
  if (maximumFractionDigits > 0) {
    const factor = 10 ** maximumFractionDigits;
    const rounded = Math.round(value * factor) / factor;
    const safe = Object.is(rounded, -0) ? 0 : rounded;
    formatted = safe.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    });
  } else {
    const rounded = Math.round(value);
    const safe = Object.is(rounded, -0) ? 0 : rounded;
    formatted = safe.toLocaleString();
  }

  return unit ? `${formatted}g` : formatted;
}

export function formatGoldUnit(value: number, maximumFractionDigits = 0): string {
  return formatGold(value, { maximumFractionDigits, unit: true });
}

export function formatSignedGold(value: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(value)) return "+0g";
  const factor = maximumFractionDigits > 0 ? 10 ** maximumFractionDigits : 1;
  const rounded = Math.round(value * factor) / factor;
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  const sign = safe >= 0 ? "+" : "-";
  return `${sign}${formatGold(Math.abs(safe), maximumFractionDigits)}g`;
}

export type FormatHoursOptions = {
  scaleDays?: boolean;
};

export function formatHours(
  hours: number,
  options?: FormatHoursOptions | boolean,
): string {
  if (!Number.isFinite(hours)) return "0h";
  const scaleDays = typeof options === "boolean" ? options : Boolean(options?.scaleDays);
  const isNegative = hours < 0;
  const sign = isNegative ? "-" : "";
  const absHours = Math.abs(hours);

  if (absHours === 0) return "0h";
  if (absHours < 1) {
    const minutes = Math.round(absHours * 60);
    return minutes === 0 ? "0h" : `${sign}${minutes}m`;
  }

  if (scaleDays && absHours >= 24) {
    const days = Math.floor(absHours / 24);
    const remainingHours = absHours % 24;
    const wholeHours = Math.floor(remainingHours);
    const minutes = Math.round((remainingHours % 1) * 60);

    if (wholeHours === 0 && minutes === 0) {
      return `${sign}${days}d`;
    }
    if (minutes === 0) {
      return `${sign}${days}d ${wholeHours}h`;
    }
    if (wholeHours === 0) {
      return `${sign}${days}d ${minutes}m`;
    }
    return `${sign}${days}d ${wholeHours}h ${minutes}m`;
  }

  if (Number.isInteger(absHours)) {
    return `${sign}${absHours}h`;
  }

  const wholeHours = Math.floor(absHours);
  const minutes = Math.round((absHours % 1) * 60);
  if (minutes === 0) {
    return `${sign}${wholeHours}h`;
  }
  if (minutes === 60) {
    return `${sign}${wholeHours + 1}h`;
  }
  return `${sign}${wholeHours}h ${minutes}m`;
}

export function formatCondition(value: number): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "100";
  const clamped = Math.min(100, Math.max(0, numeric));
  const rounded = Math.round(clamped * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function formatPayback(days: number | null | undefined): string {
  if (days === null || days === undefined || !Number.isFinite(days) || days <= 0) {
    return "Not profitable";
  }
  if (days < 1) return "Under 1 day";
  if (days < 60) return `${days.toFixed(days < 10 ? 1 : 0)} days`;
  return `${(days / 30).toFixed(1)} months`;
}

export function formatStarts(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0 starts/day";
  return `${value} start${value === 1 ? "" : "s"}/day`;
}

export function formatCompactNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  const sign = value < 0 ? "-" : "";

  const formatWithSuffix = (denominator: number, suffix: string) => {
    const val = abs / denominator;
    const str = val.toFixed(digits);
    const cleaned = str.replace(/\.0+$/, "").replace(/(\.[0-9]*[1-9])0+$/, "$1");
    return `${sign}${cleaned}${suffix}`;
  };

  if (abs >= 1e12) return formatWithSuffix(1e12, "T");
  if (abs >= 1e9) return formatWithSuffix(1e9, "B");
  if (abs >= 1e6) return formatWithSuffix(1e6, "M");
  if (abs >= 1e3) return formatWithSuffix(1e3, "K");

  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  if (safe === 0) return "0";

  return Number.isInteger(safe) ? `${safe}` : safe.toFixed(digits).replace(/\.0+$/, "");
}

export const formatCompact = formatCompactNumber;

export function formatCompactGold(value: number, digits = 1): string {
  return `${formatCompactNumber(value, digits)}g`;
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds)) {
    return "Unknown";
  }
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

const isFiniteDate = (value?: Date | null): value is Date =>
  Boolean(value instanceof Date && Number.isFinite(value.getTime()));

export function formatTime(date?: Date | null): string {
  return isFiniteDate(date)
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Unknown";
}

export function formatDateTime(date?: Date | null): string {
  return isFiniteDate(date)
    ? `${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} ${formatTime(date)}`
    : "Unknown";
}

export function formatCountdown(target: Date | null | undefined, now = Date.now()): string {
  if (!isFiniteDate(target)) return "Unknown";
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  if (totalSeconds <= 0) return "now";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatDistance(distanceMeters: number | null | undefined): string {
  if (distanceMeters === null || distanceMeters === undefined || !Number.isFinite(distanceMeters)) {
    return "Unknown";
  }
  return distanceMeters === 0 ? "Same location" : `${distanceMeters.toLocaleString()}m`;
}

export function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value).toLocaleString()
    : "-";
}
