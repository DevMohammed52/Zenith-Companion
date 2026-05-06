export type MarketPriceDatum = {
  avg_3?: number | string | null;
  avg_7?: number | string | null;
  avg_14?: number | string | null;
  avg_30?: number | string | null;
  price?: number | string | null;
  vendor_price?: number | string | null;
  vol_3?: number | string | null;
};

export type SafeMarketPriceInfo = {
  value: number;
  rawValue: number;
  adjusted: boolean;
  reason: string | null;
  baseline: number;
  volume3d: number;
};

const OUTLIER_CAP_MULTIPLIER = 3;
const LOW_VOLUME_THRESHOLD = 3;

function positive(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function getSafeMarketPriceInfo(entry: MarketPriceDatum | null | undefined): SafeMarketPriceInfo {
  if (!entry) {
    return { value: 0, rawValue: 0, adjusted: false, reason: null, baseline: 0, volume3d: 0 };
  }

  const avg3 = positive(entry.avg_3);
  const current = avg3 || positive(entry.price);
  const longerAverages = [positive(entry.avg_7), positive(entry.avg_14), positive(entry.avg_30)].filter((value) => value > 0);
  const baseline = median(longerAverages);
  const volume3d = positive(entry.vol_3);

  if (!current) {
    return {
      value: baseline,
      rawValue: 0,
      adjusted: false,
      reason: null,
      baseline,
      volume3d,
    };
  }

  if (baseline > 0 && current > baseline * OUTLIER_CAP_MULTIPLIER) {
    return {
      value: Math.round(baseline),
      rawValue: current,
      adjusted: true,
      reason: "Recent market average capped because it is far above longer-term prices.",
      baseline,
      volume3d,
    };
  }

  if (volume3d > 0 && volume3d < LOW_VOLUME_THRESHOLD && baseline > 0 && current > baseline) {
    return {
      value: Math.round(baseline),
      rawValue: current,
      adjusted: true,
      reason: "Recent market average capped because recent volume is too thin.",
      baseline,
      volume3d,
    };
  }

  return {
    value: current,
    rawValue: current,
    adjusted: false,
    reason: null,
    baseline,
    volume3d,
  };
}

export function getSafeMarketPrice(entry: MarketPriceDatum | null | undefined) {
  return getSafeMarketPriceInfo(entry).value;
}
