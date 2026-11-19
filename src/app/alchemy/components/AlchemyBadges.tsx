import React from "react";
import type { ActionPath } from "../types";

export function Badge({ label, tone }: { label: string; tone: "good" | "warn" | "bad" }) {
  return (
    <span
      className={`action-badge ${
        tone === "good" ? "action-craft" : tone === "warn" ? "action-vendor" : "action-liquidate"
      }`}
    >
      {label}
    </span>
  );
}

export function PathBadge({ action }: { action: ActionPath }) {
  if (action === "MARKET") return <Badge label="Market" tone="good" />;
  if (action === "VENDOR") return <Badge label="Vendor" tone="warn" />;
  return <Badge label="Sell inputs" tone="bad" />;
}
