export const formatGold = (value: number, _maximumFractionDigits = 0) =>
  Math.round(value).toLocaleString();
