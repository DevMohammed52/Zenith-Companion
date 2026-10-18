import { describe, expect, it } from "vitest";
import {
  formatCompact,
  formatCompactGold,
  formatCompactNumber,
  formatCondition,
  formatCountdown,
  formatDateTime,
  formatDistance,
  formatDuration,
  formatGold,
  formatGoldUnit,
  formatHours,
  formatPayback,
  formatSignedGold,
  formatStarts,
  formatTime,
  formatNumber,
} from "../../src/lib/format";

describe("formatGold", () => {
  it("formats positive numbers with grouping", () => {
    expect(formatGold(0)).toBe("0");
    expect(formatGold(100)).toBe("100");
    expect(formatGold(1234)).toBe("1,234");
    expect(formatGold(1234567)).toBe("1,234,567");
  });

  it("handles negative numbers and suppresses -0", () => {
    expect(formatGold(-0.001)).toBe("0");
    expect(formatGold(-0.0001, 2)).toBe("0");
    expect(formatGold(-0)).toBe("0");
    expect(formatGold(-500)).toBe("-500");
    expect(formatGold(-1234567)).toBe("-1,234,567");
  });

  it("handles non-finite values safely", () => {
    expect(formatGold(NaN)).toBe("0");
    expect(formatGold(Infinity)).toBe("0");
    expect(formatGold(-Infinity)).toBe("0");
  });

  it("supports maximumFractionDigits as number or options object", () => {
    expect(formatGold(1234.567, 2)).toBe("1,234.57");
    expect(formatGold(1234, 2)).toBe("1,234");
    expect(formatGold(12.34, { maximumFractionDigits: 1 })).toBe("12.3");
    expect(formatGold(100, {})).toBe("100");
  });

  it("supports unit option", () => {
    expect(formatGold(1000, { unit: true })).toBe("1,000g");
    expect(formatGold(1234.567, { maximumFractionDigits: 2, unit: true })).toBe("1,234.57g");
    expect(formatGold(NaN, { unit: true })).toBe("0g");
    expect(formatGold(Infinity, { unit: true })).toBe("0g");
    expect(formatGold(-Infinity, { unit: true })).toBe("0g");
  });

  it("formatGoldUnit appends g correctly and handles non-finite values safely", () => {
    expect(formatGoldUnit(500)).toBe("500g");
    expect(formatGoldUnit(1234.56, 1)).toBe("1,234.6g");
    expect(formatGoldUnit(0)).toBe("0g");
    expect(formatGoldUnit(-0)).toBe("0g");
    expect(formatGoldUnit(NaN)).toBe("0g");
    expect(formatGoldUnit(Infinity)).toBe("0g");
    expect(formatGoldUnit(-Infinity)).toBe("0g");
  });
});

describe("formatSignedGold", () => {
  it("formats positive numbers with + sign and g suffix", () => {
    expect(formatSignedGold(500)).toBe("+500g");
    expect(formatSignedGold(1234567)).toBe("+1,234,567g");
  });

  it("formats zero as +0g and suppresses -0", () => {
    expect(formatSignedGold(0)).toBe("+0g");
    expect(formatSignedGold(-0.001)).toBe("+0g");
    expect(formatSignedGold(-0.0001, 2)).toBe("+0g");
  });

  it("formats negative numbers with - sign and g suffix", () => {
    expect(formatSignedGold(-500)).toBe("-500g");
    expect(formatSignedGold(-1234567)).toBe("-1,234,567g");
  });

  it("supports decimal precision", () => {
    expect(formatSignedGold(500.5, 1)).toBe("+500.5g");
    expect(formatSignedGold(-500.5, 1)).toBe("-500.5g");
  });

  it("handles non-finite numbers safely", () => {
    expect(formatSignedGold(NaN)).toBe("+0g");
    expect(formatSignedGold(Infinity)).toBe("+0g");
    expect(formatSignedGold(-Infinity)).toBe("+0g");
  });
});

describe("formatHours", () => {
  it("formats zero and non-finite values as 0h", () => {
    expect(formatHours(0)).toBe("0h");
    expect(formatHours(-0)).toBe("0h");
    expect(formatHours(NaN)).toBe("0h");
    expect(formatHours(Infinity)).toBe("0h");
    expect(formatHours(-Infinity)).toBe("0h");
  });

  it("formats sub-hour durations in minutes", () => {
    expect(formatHours(0.5)).toBe("30m");
    expect(formatHours(0.25)).toBe("15m");
    expect(formatHours(0.001)).toBe("0h");
    expect(formatHours(-0.001)).toBe("0h");
  });

  it("formats whole and fractional hours", () => {
    expect(formatHours(2)).toBe("2h");
    expect(formatHours(2.5)).toBe("2h 30m");
    expect(formatHours(2.001)).toBe("2h");
    expect(formatHours(2.999)).toBe("3h");
    expect(formatHours(-2.001)).toBe("-2h");
    expect(formatHours(-2.999)).toBe("-3h");
  });

  it("formats negative hours properly", () => {
    expect(formatHours(-0.5)).toBe("-30m");
    expect(formatHours(-2)).toBe("-2h");
    expect(formatHours(-2.5)).toBe("-2h 30m");
  });

  it("preserves hours >= 24 by default", () => {
    expect(formatHours(24)).toBe("24h");
    expect(formatHours(48)).toBe("48h");
  });

  it("scales to days when scaleDays is enabled", () => {
    expect(formatHours(24, true)).toBe("1d");
    expect(formatHours(26, false)).toBe("26h");
    expect(formatHours(26, { scaleDays: true })).toBe("1d 2h");
    expect(formatHours(24.5, true)).toBe("1d 30m");
    expect(formatHours(26.5, true)).toBe("1d 2h 30m");
    expect(formatHours(-24, true)).toBe("-1d");
    expect(formatHours(-26, true)).toBe("-1d 2h");
    expect(formatHours(-24.5, true)).toBe("-1d 30m");
    expect(formatHours(-26.5, true)).toBe("-1d 2h 30m");
  });
});

describe("formatCondition", () => {
  it("formats valid integer condition", () => {
    expect(formatCondition(100)).toBe("100");
    expect(formatCondition(50)).toBe("50");
    expect(formatCondition(0)).toBe("0");
  });

  it("formats fractional condition with 1 decimal place", () => {
    expect(formatCondition(95.5)).toBe("95.5");
    expect(formatCondition(95.54)).toBe("95.5");
    expect(formatCondition(95.56)).toBe("95.6");
    expect(formatCondition(94.99)).toBe("95");
  });

  it("clamps to 0 - 100 percentage boundaries", () => {
    expect(formatCondition(-10)).toBe("0");
    expect(formatCondition(150)).toBe("100");
  });

  it("falls back to 100 for non-finite values", () => {
    expect(formatCondition(NaN)).toBe("100");
    expect(formatCondition(Infinity)).toBe("100");
    expect(formatCondition(-Infinity)).toBe("100");
    expect(formatCondition("invalid" as unknown as number)).toBe("100");
  });
});

describe("formatPayback", () => {
  it("returns Not profitable for null, undefined, non-finite, or <= 0", () => {
    expect(formatPayback(null)).toBe("Not profitable");
    expect(formatPayback(undefined)).toBe("Not profitable");
    expect(formatPayback(NaN)).toBe("Not profitable");
    expect(formatPayback(Infinity)).toBe("Not profitable");
    expect(formatPayback(-Infinity)).toBe("Not profitable");
    expect(formatPayback(0)).toBe("Not profitable");
    expect(formatPayback(-5)).toBe("Not profitable");
  });

  it("returns Under 1 day for positive values < 1", () => {
    expect(formatPayback(0.5)).toBe("Under 1 day");
    expect(formatPayback(0.99)).toBe("Under 1 day");
  });

  it("formats days < 10 with 1 decimal", () => {
    expect(formatPayback(5.23)).toBe("5.2 days");
    expect(formatPayback(9.9)).toBe("9.9 days");
  });

  it("formats days between 10 and 60 as integer days", () => {
    expect(formatPayback(10)).toBe("10 days");
    expect(formatPayback(15.7)).toBe("16 days");
    expect(formatPayback(59.4)).toBe("59 days");
  });

  it("formats days >= 60 in months with 1 decimal", () => {
    expect(formatPayback(60)).toBe("2.0 months");
    expect(formatPayback(75)).toBe("2.5 months");
  });
});

describe("formatStarts", () => {
  it("formats singular and plural starts", () => {
    expect(formatStarts(1)).toBe("1 start/day");
    expect(formatStarts(2)).toBe("2 starts/day");
    expect(formatStarts(5)).toBe("5 starts/day");
  });

  it("handles 0 and invalid numbers safely", () => {
    expect(formatStarts(0)).toBe("0 starts/day");
    expect(formatStarts(-1)).toBe("0 starts/day");
    expect(formatStarts(NaN)).toBe("0 starts/day");
    expect(formatStarts(Infinity)).toBe("0 starts/day");
    expect(formatStarts(-Infinity)).toBe("0 starts/day");
  });
});

describe("compact notation", () => {
  it("formats sub-thousands normally", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(500)).toBe("500");
    expect(formatCompactNumber(12.34, 1)).toBe("12.3");
    expect(formatCompactNumber(12.04, 1)).toBe("12");
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(NaN)).toBe("0");
    expect(formatCompactNumber(Infinity)).toBe("0");
    expect(formatCompactNumber(-Infinity)).toBe("0");
  });

  it("formats thousands (K)", () => {
    expect(formatCompactNumber(1000)).toBe("1K");
    expect(formatCompactNumber(1000, 2)).toBe("1K");
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(1540, 2)).toBe("1.54K");
  });

  it("formats millions (M)", () => {
    expect(formatCompactNumber(1_000_000)).toBe("1M");
    expect(formatCompactNumber(2_500_000)).toBe("2.5M");
  });

  it("formats billions (B)", () => {
    expect(formatCompactNumber(1_000_000_000)).toBe("1B");
    expect(formatCompactNumber(4_200_000_000)).toBe("4.2B");
  });

  it("formats trillions (T)", () => {
    expect(formatCompactNumber(1_000_000_000_000)).toBe("1T");
    expect(formatCompactNumber(3_800_000_000_000)).toBe("3.8T");
  });

  it("handles negative compact numbers and suppresses -0", () => {
    expect(formatCompactNumber(-1500)).toBe("-1.5K");
    expect(formatCompactNumber(-2_500_000)).toBe("-2.5M");
    expect(formatCompactNumber(-0.001)).toBe("0");
    expect(formatCompactNumber(-0)).toBe("0");
    expect(formatCompactGold(-0.001)).toBe("0g");
  });

  it("formats compact gold with g suffix", () => {
    expect(formatCompactGold(1500)).toBe("1.5Kg");
  });

  it("exports formatCompact alias", () => {
    expect(formatCompact).toBe(formatCompactNumber);
  });
});

describe("duration and time formatters", () => {
  it("formats duration safely", () => {
    expect(formatDuration(null)).toBe("Unknown");
    expect(formatDuration(undefined)).toBe("Unknown");
    expect(formatDuration(NaN)).toBe("Unknown");
    expect(formatDuration(Infinity)).toBe("Unknown");
    expect(formatDuration(-5)).toBe("0s");
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(60)).toBe("1m 0s");
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3665)).toBe("1h 1m");
  });

  it("formats countdown safely", () => {
    expect(formatCountdown(null, 1000)).toBe("Unknown");
    expect(formatCountdown(undefined, 1000)).toBe("Unknown");
    expect(formatCountdown(new Date(NaN), 1000)).toBe("Unknown");
    expect(formatCountdown(new Date(1000), 2000)).toBe("now");
    expect(formatCountdown(new Date(1000 + 45000), 1000)).toBe("45s");
    expect(formatCountdown(new Date(1000 + 125000), 1000)).toBe("2m 5s");
    expect(formatCountdown(new Date(1000 + 3665000), 1000)).toBe("1h 1m");
    expect(formatCountdown(new Date(1000 + 90000000), 1000)).toBe("1d 1h");
  });

  it("formats distance safely", () => {
    expect(formatDistance(null)).toBe("Unknown");
    expect(formatDistance(undefined)).toBe("Unknown");
    expect(formatDistance(NaN)).toBe("Unknown");
    expect(formatDistance(Infinity)).toBe("Unknown");
    expect(formatDistance(0)).toBe("Same location");
    expect(formatDistance(1500)).toBe("1,500m");
    expect(formatDistance(-5)).toBe("-5m");
  });

  it("formats time and date time safely", () => {
    expect(formatTime(null)).toBe("Unknown");
    expect(formatTime(new Date(NaN))).toBe("Unknown");
    expect(formatDateTime(null)).toBe("Unknown");
    expect(formatDateTime(new Date(NaN))).toBe("Unknown");

    const date = new Date("2026-03-15T12:30:00Z");
    expect(formatTime(date)).not.toBe("Unknown");
    expect(formatDateTime(date)).not.toBe("Unknown");
  });
});

describe("formatNumber", () => {
  it("formats positive numbers with locale grouping", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(1234567.8)).toBe("1,234,568");
  });

  it("handles non-finite and nullish values safely", () => {
    expect(formatNumber(NaN)).toBe("-");
    expect(formatNumber(Infinity)).toBe("-");
    expect(formatNumber(-Infinity)).toBe("-");
    expect(formatNumber(null)).toBe("-");
    expect(formatNumber(undefined)).toBe("-");
  });
});
