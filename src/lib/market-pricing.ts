export type MarketPriceDatum = {
  avg_3?: number;
  avg_7?: number;
  avg_14?: number;
  avg_30?: number;
  price?: number;
  safe_price?: number;
  raw_price?: number;
  raw_avg_3?: number;
  raw_avg_7?: number;
  raw_avg_14?: number;
  raw_avg_30?: number;
  price_adjusted?: boolean;
  price_warning?: string;
  vendor_price?: number;
  vol_3?: number;
};

export type SafeMarketPrice = {
  value: number;
  rawValue: number;
  adjusted: boolean;
  reason: "none" | "cache_guard" | "three_day_spike" | "missing";
  anchor?: number;
};

const SPIKE_MULTIPLIER = 5;
const MIN_SPIKE_DELTA = 100;

function asPositiveNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function getSafeMarketPrice(item?: MarketPriceDatum | null): SafeMarketPrice {
  const cachedSafe = asPositiveNumber(item?.safe_price) || asPositiveNumber(item?.price);
  const cachedRaw = asPositiveNumber(item?.raw_price) || asPositiveNumber(item?.raw_avg_3);
  if (cachedSafe > 0 && item?.price_adjusted) {
    return {
      value: cachedSafe,
      rawValue: cachedRaw || cachedSafe,
      adjusted: true,
      reason: "cache_guard",
      anchor: cachedSafe,
    };
  }

  const avg3 = asPositiveNumber(item?.avg_3);
  const fallback = cachedSafe
    || asPositiveNumber(item?.avg_7)
    || asPositiveNumber(item?.avg_14)
    || asPositiveNumber(item?.avg_30);
  const rawValue = avg3 || fallback;

  if (!rawValue) {
    return { value: 0, rawValue: 0, adjusted: false, reason: "missing" };
  }

  const anchor = median([
    cachedSafe,
    asPositiveNumber(item?.avg_7),
    asPositiveNumber(item?.avg_14),
    asPositiveNumber(item?.avg_30),
    asPositiveNumber(item?.raw_avg_7),
    asPositiveNumber(item?.raw_avg_14),
    asPositiveNumber(item?.raw_avg_30),
  ].filter((value) => value > 0));

  if (
    avg3 > 0
    && anchor > 0
    && avg3 >= anchor * SPIKE_MULTIPLIER
    && avg3 - anchor >= MIN_SPIKE_DELTA
  ) {
    return {
      value: anchor,
      rawValue,
      adjusted: true,
      reason: "three_day_spike",
      anchor,
    };
  }

  return { value: rawValue, rawValue, adjusted: false, reason: "none", anchor: anchor || undefined };
}

export function getSafeMarketValue(item?: MarketPriceDatum | null) {
  return getSafeMarketPrice(item).value;
}
