import type { ReactNode } from "react";
import { getQualityTextStyle, normalizeQuality } from "@/lib/quality";

type QualityTextProps = {
  value: unknown;
  children?: ReactNode;
  className?: string;
};

export default function QualityText({ value, children, className }: QualityTextProps) {
  const normalized = normalizeQuality(value);
  const label = children ?? (normalized === "UNKNOWN" ? "Unknown" : normalized);

  return (
    <span className={className} data-quality={normalized} style={getQualityTextStyle(normalized)}>
      {label}
    </span>
  );
}
