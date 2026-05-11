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
  vol_7?: number;
  vol_30?: number;
  stable_vol_3?: number;
  daily_sales_trimmed_avg_30?: number;
  daily_sales_median_30?: number;
  daily_sales_max_30?: number;
  sales_outlier_days_30?: number;
  sales_spike_ratio?: number;
  liquidity_warning?: string;
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

function asNonNegativeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
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

export type MarketLiquidityTone = "none" | "thin" | "steady" | "active" | "risk";

export type MarketLiquidityInfo = {
  label: "No market" | "No sales" | "Thin market" | "Steady market" | "Active market" | "Volume swings" | "Spike risk";
  tone: MarketLiquidityTone;
  note: string;
  rawVolume3d: number;
  stableVolume3d: number;
  dailyTrimmedAverage30: number;
  dailyMedian30: number;
  salesSpikeRatio: number;
  salesOutlierDays30: number;
  isSpikeRisk: boolean;
  hasVolumeSwings: boolean;
  hasStableData: boolean;
};

export function getMarketLiquidity(item?: MarketPriceDatum | null): MarketLiquidityInfo {
  const marketValue = getSafeMarketValue(item);
  const rawVolume3d = Math.round(asNonNegativeNumber(item?.vol_3));
  const trimmedDaily = asNonNegativeNumber(item?.daily_sales_trimmed_avg_30);
  const medianDaily = asNonNegativeNumber(item?.daily_sales_median_30);
  const fallbackDaily = rawVolume3d > 0 ? rawVolume3d / 3 : 0;
  const stableDaily = trimmedDaily || medianDaily || fallbackDaily;
  const stableVolume3d = Math.round(asNonNegativeNumber(item?.stable_vol_3) || stableDaily * 3);
  const maxDaily = asNonNegativeNumber(item?.daily_sales_max_30);
  const salesSpikeRatio = asNonNegativeNumber(item?.sales_spike_ratio) || (stableDaily > 0 && maxDaily > 0 ? maxDaily / stableDaily : 0);
  const salesOutlierDays30 = Math.round(asNonNegativeNumber(item?.sales_outlier_days_30));
  const hasStableData = trimmedDaily > 0 || medianDaily > 0 || item?.stable_vol_3 !== undefined;
  const hasVolumeSwings = marketValue > 0
    && hasStableData
    && stableVolume3d > 0
    && salesOutlierDays30 > 0
    && salesSpikeRatio >= 3;
  const isSpikeRisk = marketValue > 0
    && hasStableData
    && rawVolume3d >= 40
    && stableVolume3d > 0
    && salesSpikeRatio >= 3
    && rawVolume3d >= stableVolume3d * 1.5;

  if (marketValue <= 0) {
    return {
      label: "No market",
      tone: "none",
      note: "No recent trade history.",
      rawVolume3d,
      stableVolume3d: 0,
      dailyTrimmedAverage30: trimmedDaily,
      dailyMedian30: medianDaily,
      salesSpikeRatio,
      salesOutlierDays30,
      isSpikeRisk: false,
      hasVolumeSwings: false,
      hasStableData,
    };
  }

  if (rawVolume3d <= 0 && stableVolume3d <= 0) {
    return {
      label: "No sales",
      tone: "none",
      note: "A market price exists, but no recent sold volume was found.",
      rawVolume3d,
      stableVolume3d,
      dailyTrimmedAverage30: trimmedDaily,
      dailyMedian30: medianDaily,
      salesSpikeRatio,
      salesOutlierDays30,
      isSpikeRisk: false,
      hasVolumeSwings: false,
      hasStableData,
    };
  }

  if (isSpikeRisk) {
    return {
      label: "Spike risk",
      tone: "risk",
      note: "Recent volume may be inflated by bulk-sale days. Check the official graph before mass crafting or assuming fast sales.",
      rawVolume3d,
      stableVolume3d,
      dailyTrimmedAverage30: trimmedDaily,
      dailyMedian30: medianDaily,
      salesSpikeRatio,
      salesOutlierDays30,
      isSpikeRisk,
      hasVolumeSwings,
      hasStableData,
    };
  }

  if (hasVolumeSwings) {
    return {
      label: "Volume swings",
      tone: "risk",
      note: "The 30-day sold history has bulk-sale spikes, so stable volume may not mean steady daily buyers. Check the official graph before mass crafting or assuming fast sales.",
      rawVolume3d,
      stableVolume3d,
      dailyTrimmedAverage30: trimmedDaily,
      dailyMedian30: medianDaily,
      salesSpikeRatio,
      salesOutlierDays30,
      isSpikeRisk,
      hasVolumeSwings,
      hasStableData,
    };
  }

  if (stableVolume3d >= 150) {
    return {
      label: "Active market",
      tone: "active",
      note: hasStableData ? "Stable sales pace stays high after trimming unusual daily spikes." : "At least 150 units moved in the last 3 days.",
      rawVolume3d,
      stableVolume3d,
      dailyTrimmedAverage30: trimmedDaily,
      dailyMedian30: medianDaily,
      salesSpikeRatio,
      salesOutlierDays30,
      isSpikeRisk,
      hasVolumeSwings,
      hasStableData,
    };
  }

  if (stableVolume3d >= 40) {
    return {
      label: "Steady market",
      tone: "steady",
      note: hasStableData ? "Stable sales pace is moderate after trimming unusual daily spikes." : "Recent volume is moderate.",
      rawVolume3d,
      stableVolume3d,
      dailyTrimmedAverage30: trimmedDaily,
      dailyMedian30: medianDaily,
      salesSpikeRatio,
      salesOutlierDays30,
      isSpikeRisk,
      hasVolumeSwings,
      hasStableData,
    };
  }

  return {
    label: "Thin market",
    tone: "thin",
    note: "Market price exists, but stable recent volume is low.",
    rawVolume3d,
    stableVolume3d,
    dailyTrimmedAverage30: trimmedDaily,
    dailyMedian30: medianDaily,
    salesSpikeRatio,
    salesOutlierDays30,
    isSpikeRisk,
    hasVolumeSwings,
    hasStableData,
  };
}
