import {
  getMarketLiquidity,
  getSafeMarketPrice,
  type MarketLiquidityInfo,
  type MarketPriceDatum,
} from "@/lib/market-pricing";

export const MARKET_WATCH_STORAGE_KEY = "zenith_market_watch_rules_v1";
export const MARKET_WATCH_RULES_EVENT = "zenith-market-watch-rules-updated";

export type MarketWatchMetric =
  | "safe_price"
  | "latest_sale_median"
  | "avg_7"
  | "stable_volume_3d"
  | "sales_spike_ratio"
  | "vendor_margin";

export type MarketWatchComparator = "lte" | "gte";

export type MarketWatchRule = {
  id: string;
  itemName: string;
  metric: MarketWatchMetric;
  comparator: MarketWatchComparator;
  threshold: number;
  enabled: boolean;
  notify: boolean;
  createdAt: string;
  lastCheckedKey?: string;
  lastConditionMet?: boolean;
  lastSeenValue?: number;
  lastTriggeredAt?: string;
  lastTriggeredKey?: string;
};

export type MarketWatchItemRecord = {
  name?: string;
  image_url?: string;
  image?: string;
  vendor_price?: number;
  quality?: string;
  type?: string;
  hashed_id?: string;
};

export type MarketWatchEvaluation = {
  rule: MarketWatchRule;
  item?: MarketWatchItemRecord | null;
  market?: MarketPriceDatum | null;
  metricLabel: string;
  comparatorLabel: string;
  value: number;
  threshold: number;
  hasValue: boolean;
  conditionMet: boolean;
  valueLabel: string;
  thresholdLabel: string;
  snapshotKey: string;
  triggerKey: string;
  updatedAt?: string;
  title: string;
  body: string;
  tone: "good" | "warn" | "danger" | "muted";
  liquidity: MarketLiquidityInfo;
  note: string;
};

export type VendorCandidate = {
  itemName: string;
  item?: MarketWatchItemRecord | null;
  market?: MarketPriceDatum | null;
  marketValue: number;
  vendorValue: number;
  margin: number;
  marginPercent: number;
  status: "below_vendor" | "near_vendor";
  liquidity: MarketLiquidityInfo;
};

export type VendorCandidateSummary = {
  marketRows: number;
  pricedRows: number;
  vendorRows: number;
  profitableRows: number;
  nearVendorRows: number;
};

export const MARKET_WATCH_METRIC_OPTIONS: Array<{
  value: MarketWatchMetric;
  label: string;
  detail: string;
  defaultComparator: MarketWatchComparator;
}> = [
  {
    value: "safe_price",
    label: "Market average",
    detail: "Filtered recent sale average from the generated snapshot.",
    defaultComparator: "lte",
  },
  {
    value: "latest_sale_median",
    label: "Latest sold median",
    detail: "Median of the latest sold records captured by the scraper.",
    defaultComparator: "gte",
  },
  {
    value: "avg_7",
    label: "7d average",
    detail: "Seven-day average sale price from market history.",
    defaultComparator: "lte",
  },
  {
    value: "stable_volume_3d",
    label: "Stable volume",
    detail: "Three-day sold volume after trimming unusual daily spikes.",
    defaultComparator: "lte",
  },
  {
    value: "sales_spike_ratio",
    label: "Volume swing",
    detail: "Largest daily sale count compared with stable daily pace.",
    defaultComparator: "gte",
  },
  {
    value: "vendor_margin",
    label: "Vendor margin",
    detail: "Profile-adjusted vendor value minus market average.",
    defaultComparator: "gte",
  },
];

const PRICE_METRICS = new Set<MarketWatchMetric>([
  "safe_price",
  "latest_sale_median",
  "avg_7",
  "vendor_margin",
]);

function asFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asPositiveNumber(value: unknown) {
  const parsed = asFiniteNumber(value);
  return parsed > 0 ? parsed : 0;
}

export function createMarketWatchRule(input: {
  itemName: string;
  metric: MarketWatchMetric;
  comparator: MarketWatchComparator;
  threshold: number;
  notify?: boolean;
}): MarketWatchRule {
  const now = new Date().toISOString();
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `watch_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    itemName: input.itemName,
    metric: input.metric,
    comparator: input.comparator,
    threshold: Math.max(0, asFiniteNumber(input.threshold)),
    enabled: true,
    notify: Boolean(input.notify),
    createdAt: now,
  };
}

export function sanitizeMarketWatchRules(value: unknown): MarketWatchRule[] {
  if (!Array.isArray(value)) return [];
  const validMetrics = new Set(MARKET_WATCH_METRIC_OPTIONS.map((option) => option.value));
  return value
    .map((rule): MarketWatchRule | null => {
      if (!rule || typeof rule !== "object") return null;
      const raw = rule as Partial<MarketWatchRule>;
      const itemName = typeof raw.itemName === "string" ? raw.itemName.trim() : "";
      const metric = raw.metric && validMetrics.has(raw.metric) ? raw.metric : "safe_price";
      const comparator = raw.comparator === "gte" ? "gte" : "lte";
      const threshold = Math.max(0, asFiniteNumber(raw.threshold));
      if (!itemName || !threshold) return null;
      return {
        id: typeof raw.id === "string" && raw.id ? raw.id : `watch_${itemName}_${metric}`,
        itemName,
        metric,
        comparator,
        threshold,
        enabled: raw.enabled !== false,
        notify: Boolean(raw.notify),
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
        lastCheckedKey: typeof raw.lastCheckedKey === "string" ? raw.lastCheckedKey : undefined,
        lastConditionMet: typeof raw.lastConditionMet === "boolean" ? raw.lastConditionMet : undefined,
        lastSeenValue: Number.isFinite(Number(raw.lastSeenValue)) ? Number(raw.lastSeenValue) : undefined,
        lastTriggeredAt: typeof raw.lastTriggeredAt === "string" ? raw.lastTriggeredAt : undefined,
        lastTriggeredKey: typeof raw.lastTriggeredKey === "string" ? raw.lastTriggeredKey : undefined,
      };
    })
    .filter((rule): rule is MarketWatchRule => Boolean(rule))
    .slice(0, 100);
}

export function metricOption(metric: MarketWatchMetric) {
  return MARKET_WATCH_METRIC_OPTIONS.find((option) => option.value === metric) || MARKET_WATCH_METRIC_OPTIONS[0];
}

export function getProfileVendorValue(baseVendorValue: number, barteringBoostPercent = 0) {
  const vendor = asPositiveNumber(baseVendorValue);
  const boost = Math.max(0, asFiniteNumber(barteringBoostPercent));
  return Math.round(vendor * (1 + boost / 100));
}

export function formatMarketWatchValue(metric: MarketWatchMetric, value: number) {
  if (!Number.isFinite(value)) return "-";
  if (PRICE_METRICS.has(metric)) {
    return `${Math.round(value).toLocaleString()}g`;
  }
  if (metric === "sales_spike_ratio") {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}x`;
  }
  return Math.round(value).toLocaleString();
}

export function comparatorLabel(comparator: MarketWatchComparator) {
  return comparator === "gte" ? "at or above" : "at or below";
}

function metricValue(
  metric: MarketWatchMetric,
  market: MarketPriceDatum | null | undefined,
  item: MarketWatchItemRecord | null | undefined,
  barteringBoostPercent: number,
) {
  const safePrice = getSafeMarketPrice(market);
  const liquidity = getMarketLiquidity(market);
  const vendorValue = getProfileVendorValue(
    asPositiveNumber(market?.vendor_price) || asPositiveNumber(item?.vendor_price),
    barteringBoostPercent,
  );

  if (metric === "safe_price") return safePrice.value;
  if (metric === "latest_sale_median") return asPositiveNumber(market?.latest_sale_median);
  if (metric === "avg_7") return asPositiveNumber(market?.avg_7);
  if (metric === "stable_volume_3d") return liquidity.stableVolume3d;
  if (metric === "sales_spike_ratio") return asPositiveNumber(market?.sales_spike_ratio);
  if (metric === "vendor_margin") {
    if (!safePrice.value || !vendorValue) return 0;
    return vendorValue - safePrice.value;
  }
  return 0;
}

function collectVendorCandidates({
  marketData,
  allItemsDb,
  barteringBoostPercent = 0,
  minimumMargin = 1,
  includeNearVendor = false,
}: {
  marketData: Record<string, MarketPriceDatum> | null | undefined;
  allItemsDb: Record<string, MarketWatchItemRecord> | null | undefined;
  barteringBoostPercent?: number;
  minimumMargin?: number;
  includeNearVendor?: boolean;
}) {
  const summary: VendorCandidateSummary = {
    marketRows: 0,
    pricedRows: 0,
    vendorRows: 0,
    profitableRows: 0,
    nearVendorRows: 0,
  };

  const candidates: VendorCandidate[] = [];
  if (!marketData) return { candidates, summary };

  Object.entries(marketData).forEach(([itemName, market]) => {
    if (itemName.startsWith("_")) return;
    summary.marketRows += 1;

    const item = allItemsDb?.[itemName] || null;
    const marketValue = getSafeMarketPrice(market).value;
    const vendorValue = getProfileVendorValue(
      asPositiveNumber(market?.vendor_price) || asPositiveNumber(item?.vendor_price),
      barteringBoostPercent,
    );
    const margin = vendorValue && marketValue ? vendorValue - marketValue : 0;
    const marginPercent = marketValue > 0 ? margin / marketValue : 0;

    if (marketValue > 0) summary.pricedRows += 1;
    if (vendorValue > 0) summary.vendorRows += 1;
    const nearVendor = marketValue > 0 && vendorValue > 0 && marketValue <= vendorValue * 1.1;
    const belowVendor = marketValue > 0 && vendorValue > 0 && margin >= minimumMargin;

    if (nearVendor) {
      summary.nearVendorRows += 1;
    }
    if (!belowVendor && (!includeNearVendor || !nearVendor)) return;

    if (belowVendor) summary.profitableRows += 1;
    candidates.push({
      itemName,
      item,
      market,
      marketValue,
      vendorValue,
      margin,
      marginPercent,
      status: belowVendor ? "below_vendor" : "near_vendor",
      liquidity: getMarketLiquidity(market),
    });
  });

  candidates.sort((a, b) => {
    if (a.status !== b.status) return a.status === "below_vendor" ? -1 : 1;
    const marginDelta = b.margin - a.margin;
    if (marginDelta !== 0) return marginDelta;
    return b.marginPercent - a.marginPercent;
  });

  return { candidates, summary };
}

export function evaluateMarketWatchRule({
  rule,
  market,
  item,
  barteringBoostPercent = 0,
  fallbackUpdatedAt,
}: {
  rule: MarketWatchRule;
  market?: MarketPriceDatum | null;
  item?: MarketWatchItemRecord | null;
  barteringBoostPercent?: number;
  fallbackUpdatedAt?: string;
}): MarketWatchEvaluation {
  const option = metricOption(rule.metric);
  const value = metricValue(rule.metric, market, item, barteringBoostPercent);
  const threshold = Math.max(0, asFiniteNumber(rule.threshold));
  const hasValue = rule.metric === "vendor_margin"
    ? Boolean(
      market
      && getSafeMarketPrice(market).value > 0
      && (asPositiveNumber(market.vendor_price) || asPositiveNumber(item?.vendor_price)),
    )
    : value > 0;
  const conditionMet = rule.enabled && hasValue && (
    rule.comparator === "gte" ? value >= threshold : value <= threshold
  );
  const liquidity = getMarketLiquidity(market);
  const updatedAt = market?.last_updated || fallbackUpdatedAt;
  const snapshotKey = `${rule.id}:${updatedAt || "unknown"}:${rule.metric}:${Math.round(value * 100) / 100}`;
  const triggerKey = `${snapshotKey}:${rule.comparator}:${threshold}`;
  const valueLabel = formatMarketWatchValue(rule.metric, value);
  const thresholdLabel = formatMarketWatchValue(rule.metric, threshold);
  const compareLabel = comparatorLabel(rule.comparator);
  const tone = !hasValue
    ? "muted"
    : conditionMet
      ? rule.comparator === "gte" ? "good" : "warn"
      : "muted";
  const title = `${rule.itemName} ${option.label}`;
  const body = conditionMet
    ? `${valueLabel} is ${compareLabel} ${thresholdLabel} in the latest market-history snapshot.`
    : hasValue
      ? `${valueLabel}; waiting for ${compareLabel} ${thresholdLabel}.`
      : "No usable market-history value in the current snapshot.";

  return {
    rule,
    item,
    market,
    metricLabel: option.label,
    comparatorLabel: compareLabel,
    value,
    threshold,
    hasValue,
    conditionMet,
    valueLabel,
    thresholdLabel,
    snapshotKey,
    triggerKey,
    updatedAt,
    title,
    body,
    tone,
    liquidity,
    note: option.detail,
  };
}

export function buildVendorCandidates({
  marketData,
  allItemsDb,
  barteringBoostPercent = 0,
  minimumMargin = 1,
  includeNearVendor = false,
  limit = 12,
}: {
  marketData: Record<string, MarketPriceDatum> | null | undefined;
  allItemsDb: Record<string, MarketWatchItemRecord> | null | undefined;
  barteringBoostPercent?: number;
  minimumMargin?: number;
  includeNearVendor?: boolean;
  limit?: number;
}): VendorCandidate[] {
  return collectVendorCandidates({
    marketData,
    allItemsDb,
    barteringBoostPercent,
    minimumMargin,
    includeNearVendor,
  }).candidates.slice(0, limit);
}

export function summarizeVendorCandidates({
  marketData,
  allItemsDb,
  barteringBoostPercent = 0,
  minimumMargin = 1,
}: {
  marketData: Record<string, MarketPriceDatum> | null | undefined;
  allItemsDb: Record<string, MarketWatchItemRecord> | null | undefined;
  barteringBoostPercent?: number;
  minimumMargin?: number;
}): VendorCandidateSummary {
  return collectVendorCandidates({
    marketData,
    allItemsDb,
    barteringBoostPercent,
    minimumMargin,
  }).summary;
}
