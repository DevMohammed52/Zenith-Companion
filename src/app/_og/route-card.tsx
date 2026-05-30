import { ImageResponse } from "next/og";

export const routeOgSize = {
  width: 1200,
  height: 630,
};

type RouteOgImageInput = {
  accent: string;
  description: string;
  eyebrow: string;
  stats: string[];
  title: string;
};

const baseText = "#f8fafc";
const mutedText = "#a1a1aa";
const panel = "#0b111d";
const border = "rgba(148, 163, 184, 0.22)";

function StatPill({ accent, label }: { accent: string; label: string }) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(255,255,255,0.045)",
        border: `1px solid ${border}`,
        borderRadius: 16,
        color: baseText,
        display: "flex",
        fontSize: 24,
        fontWeight: 700,
        gap: 12,
        lineHeight: 1.2,
        padding: "18px 22px",
      }}
    >
      <span
        style={{
          background: accent,
          borderRadius: 999,
          display: "flex",
          height: 12,
          width: 12,
        }}
      />
      {label}
    </div>
  );
}

export function createRouteOgImage({ accent, description, eyebrow, stats, title }: RouteOgImageInput) {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#05070d",
          color: baseText,
          display: "flex",
          fontFamily: "Inter, Arial, sans-serif",
          height: "100%",
          overflow: "hidden",
          padding: 54,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: accent,
            display: "flex",
            height: 630,
            left: 0,
            opacity: 0.18,
            position: "absolute",
            top: 0,
            width: 18,
          }}
        />
        <div
          style={{
            background: "rgba(255,255,255,0.055)",
            borderRadius: 999,
            display: "flex",
            height: 420,
            opacity: 0.2,
            position: "absolute",
            right: -132,
            top: -172,
            width: 420,
          }}
        />
        <div
          style={{
            background: accent,
            borderRadius: 999,
            bottom: -190,
            display: "flex",
            height: 360,
            opacity: 0.12,
            position: "absolute",
            right: 70,
            width: 360,
          }}
        />

        <div
          style={{
            border: `1px solid ${border}`,
            borderRadius: 26,
            display: "flex",
            flexDirection: "column",
            gap: 38,
            height: "100%",
            justifyContent: "space-between",
            padding: 42,
            position: "relative",
            width: "100%",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
              <div
                style={{
                  alignItems: "center",
                  background: panel,
                  border: `1px solid ${accent}`,
                  borderRadius: 16,
                  color: accent,
                  display: "flex",
                  fontSize: 32,
                  fontWeight: 900,
                  height: 66,
                  justifyContent: "center",
                  width: 66,
                }}
              >
                Z
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ color: mutedText, fontSize: 21, fontWeight: 700 }}>Zenith Companion</span>
                <span style={{ color: accent, fontSize: 17, fontWeight: 900, letterSpacing: 2 }}>
                  UNOFFICIAL IDLEMMO COMPANION
                </span>
              </div>
            </div>
            <span
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${border}`,
                borderRadius: 999,
                color: mutedText,
                fontSize: 20,
                fontWeight: 800,
                padding: "12px 18px",
              }}
            >
              zenith-companion.vercel.app
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 850 }}>
            <span
              style={{
                color: accent,
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </span>
            <h1
              style={{
                color: baseText,
                fontSize: 84,
                fontWeight: 950,
                letterSpacing: -2,
                lineHeight: 0.92,
                margin: 0,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                color: "#d4d4d8",
                fontSize: 31,
                fontWeight: 500,
                lineHeight: 1.22,
                margin: 0,
                maxWidth: 910,
              }}
            >
              {description}
            </p>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            {stats.map((stat) => (
              <StatPill accent={accent} key={stat} label={stat} />
            ))}
          </div>
        </div>
      </div>
    ),
    routeOgSize,
  );
}
