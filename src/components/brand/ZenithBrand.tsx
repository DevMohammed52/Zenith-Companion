import React from "react";

interface ZenithMarkProps {
  size?: number;
  variant?: "shaded" | "mono";
  className?: string;
  idPrefix?: string;
}

export function ZenithMark({
  size = 24,
  variant = "shaded",
  className,
  idPrefix = "zm",
}: ZenithMarkProps) {
  const isShaded = variant === "shaded";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible" }}
    >
      {isShaded && (
        <defs>
          <linearGradient id={`${idPrefix}-zUpper`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-zLower`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="60%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-star`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.2)" />
            <stop offset="50%" stopColor="rgba(248, 250, 252, 0.95)" />
            <stop offset="100%" stopColor="rgba(148, 163, 184, 0.2)" />
          </linearGradient>
          <radialGradient id={`${idPrefix}-halo`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(248, 250, 252, 0.45)" />
            <stop offset="60%" stopColor="rgba(248, 250, 252, 0.08)" />
            <stop offset="100%" stopColor="rgba(248, 250, 252, 0)" />
          </radialGradient>
        </defs>
      )}

      {isShaded && <circle cx="128" cy="66" r="38" fill={`url(#${idPrefix}-halo)`} />}

      {/* Celestial Horizon Arc */}
      <path
        d="M 24 110 Q 64 56 128 48 Q 192 56 232 110 Q 192 59 128 51.5 Q 64 59 24 110 Z"
        fill={isShaded ? `url(#${idPrefix}-arc)` : "#94a3b8"}
      />

      {/* Apex Star */}
      <path
        d="M 128 20 L 133 58.5 L 152 66 L 133 72 L 128 94 L 123 72 L 104 66 L 123 58.5 Z"
        fill={isShaded ? `url(#${idPrefix}-star)` : "#f8fafc"}
      />

      {/* Upper Z Polygon */}
      <path
        d="M 84 102 L 212 102 L 98 204 L 26 214 L 92 172 L 164 122 L 84 122 L 52 144 Z"
        fill={isShaded ? `url(#${idPrefix}-zUpper)` : "#f8fafc"}
      />

      {/* Lower Z Wing */}
      <path
        d="M 112 204 L 188 204 L 228 160 L 194 178 L 146 178 Z"
        fill={isShaded ? `url(#${idPrefix}-zLower)` : "#f8fafc"}
      />
    </svg>
  );
}

interface ZenithWordmarkProps {
  height?: number;
  color?: string;
  className?: string;
}

export function ZenithWordmark({
  height = 16,
  color = "#f8fafc",
  className,
}: ZenithWordmarkProps) {
  // Total viewBox width = 587.5, height = 100
  const width = Math.round(height * (587.5 / 100));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 587.5 100"
      width={width}
      height={height}
      className={className}
      aria-label="ZENITH"
      role="img"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <g fill={color}>
        {/* Z */}
        <path d="M 0 10.0 L 92.0 10.0 L 24 74.5 L 92.0 74.5 L 92.0 90.0 L 0 90.0 L 68.0 25.5 L 0 25.5 Z" />
        {/* E (custom 3-bar floating stylized E) */}
        <g transform="translate(124.0, 0)">
          <path d="M 0 10.0 L 80.0 10.0 L 80.0 25.5 L 0 25.5 Z M 0 42.25 L 70.0 42.25 L 70.0 57.75 L 0 57.75 Z M 0 74.5 L 80.0 74.5 L 80.0 90.0 L 0 90.0 Z" />
        </g>
        {/* N */}
        <g transform="translate(236.0, 0)">
          <path d="M 0 10.0 L 15.5 10.0 L 68.5 68.0 L 68.5 10.0 L 84.0 10.0 L 84.0 90.0 L 68.5 90.0 L 15.5 32.0 L 15.5 90.0 L 0 90.0 Z" />
        </g>
        {/* I */}
        <g transform="translate(352.0, 0)">
          <path d="M 0 10.0 L 15.5 10.0 L 15.5 90.0 L 0 90.0 Z" />
        </g>
        {/* T */}
        <g transform="translate(399.5, 0)">
          <path d="M 0 10.0 L 74.0 10.0 L 74.0 25.5 L 44.75 25.5 L 44.75 90.0 L 29.25 90.0 L 29.25 25.5 L 0 25.5 Z" />
        </g>
        {/* H */}
        <g transform="translate(505.5, 0)">
          <path d="M 0 10.0 L 15.5 10.0 L 15.5 42.25 L 66.5 42.25 L 66.5 10.0 L 82.0 10.0 L 82.0 90.0 L 66.5 90.0 L 66.5 57.75 L 15.5 57.75 L 15.5 90.0 L 0 90.0 Z" />
        </g>
      </g>
    </svg>
  );
}

interface ZenithLogoProps {
  height?: number;
  variant?: "shaded" | "mono";
  className?: string;
}

export function ZenithLogo({
  height = 24,
  variant = "shaded",
  className,
}: ZenithLogoProps) {
  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: Math.round(height * 0.4) }}
    >
      <ZenithMark size={height} variant={variant} />
      <ZenithWordmark height={Math.round(height * 0.72)} />
    </div>
  );
}
