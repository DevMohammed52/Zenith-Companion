export const formatGold = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString(undefined, { maximumFractionDigits });
