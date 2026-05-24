import type { CSSProperties } from "react";

export const QUALITY_ORDER = [
  "UNKNOWN",
  "STANDARD",
  "REFINED",
  "PREMIUM",
  "EPIC",
  "LEGENDARY",
  "MYTHIC",
  "UNIQUE",
] as const;

export type QualityName = (typeof QUALITY_ORDER)[number];

type QualityPaletteEntry = {
  color: string;
  border: string;
  background: string;
  textGradient?: string;
  backgroundGradient?: string;
};

export const QUALITY_PALETTE: Record<QualityName, QualityPaletteEntry> = {
  UNKNOWN: {
    color: "#94a3b8",
    border: "rgba(148, 163, 184, 0.32)",
    background: "#111827",
  },
  STANDARD: {
    color: "#d1d5db",
    border: "#37415166",
    background: "#161d2a",
  },
  REFINED: {
    color: "#4d76d6",
    border: "#4d76d64d",
    background: "#152951",
  },
  PREMIUM: {
    color: "#1fd60b",
    border: "#1fd60b4d",
    background: "#16382b",
  },
  EPIC: {
    color: "#c0392b",
    border: "#c0392b4d",
    background: "#421d25",
  },
  LEGENDARY: {
    color: "#f7bd1e",
    border: "#f7bd1e4d",
    background: "#3d3222",
  },
  MYTHIC: {
    color: "#f48a00",
    border: "#c2410c4d",
    background: "#492f31",
    textGradient: "linear-gradient(90deg, #f48a00, #da5b00)",
    backgroundGradient: "linear-gradient(to bottom right, #764430, #492f31)",
  },
  UNIQUE: {
    color: "#b417f4",
    border: "#7e22ce4d",
    background: "#4e2760",
    textGradient: "linear-gradient(90deg, #b417f4, #8006b5)",
    backgroundGradient: "linear-gradient(to bottom right, #7c598e, #4e2760)",
  },
};

export const QUALITY_RANK: Record<QualityName, number> = QUALITY_ORDER.reduce(
  (ranks, quality, index) => {
    ranks[quality] = index;
    return ranks;
  },
  {} as Record<QualityName, number>,
);

export const QUALITY_COLORS: Record<QualityName, string> = QUALITY_ORDER.reduce(
  (colors, quality) => {
    colors[quality] = QUALITY_PALETTE[quality].color;
    return colors;
  },
  {} as Record<QualityName, string>,
);

export function normalizeQuality(value: unknown): QualityName {
  const normalized = String(value || "").trim().toUpperCase();
  return QUALITY_ORDER.includes(normalized as QualityName) ? (normalized as QualityName) : "UNKNOWN";
}

export function getQualityRank(value: unknown) {
  return QUALITY_RANK[normalizeQuality(value)];
}

export function getQualityColor(value: unknown) {
  return QUALITY_COLORS[normalizeQuality(value)];
}

export function getQualityPalette(value: unknown) {
  return QUALITY_PALETTE[normalizeQuality(value)];
}

export function getQualityTextStyle(value: unknown): CSSProperties {
  const palette = getQualityPalette(value);
  if (!palette.textGradient) return { color: palette.color };
  return {
    background: palette.textGradient,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

export function formatQualityLabel(value: unknown) {
  const quality = normalizeQuality(value);
  if (quality === "UNKNOWN") return "Unknown";
  return quality.charAt(0) + quality.slice(1).toLowerCase();
}
