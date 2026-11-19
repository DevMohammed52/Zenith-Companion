"use client";

import { formatAge, type UseSettingsStateReturn } from "../types";

export default function SettingsOverview({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    "preferences" | "activeProfile" | "marketMeta" | "customPriceRows"
  >;
}) {
  const { preferences, activeProfile, marketMeta, customPriceRows } = state;

  return (
    <section className="settings-overview" aria-label="Settings summary">
      <div>
        <span>Market tax</span>
        <strong>{preferences.membership ? "12%" : "15%"}</strong>
      </div>
      <div>
        <span>Active profile</span>
        <strong>{activeProfile?.name?.trim() || "None"}</strong>
      </div>
      <div>
        <span>Market cache</span>
        <strong>{formatAge(marketMeta?.last_updated)}</strong>
      </div>
      <div>
        <span>Custom prices</span>
        <strong>{customPriceRows.length.toLocaleString()}</strong>
      </div>
    </section>
  );
}
