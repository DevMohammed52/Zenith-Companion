"use client";

import { Database } from "lucide-react";
import { formatAge, type UseSettingsStateReturn } from "../types";
import OfflineStoragePanel from "./OfflineStoragePanel";

export default function DataCachePanel({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    "marketItemCount" | "marketMeta" | "itemCount" | "entityCount"
  >;
}) {
  const { marketItemCount, marketMeta, itemCount, entityCount } = state;

  return (
    <div className="settings-panel settings-panel-wide">
      <h2><Database size={17} /> Data Cache</h2>
      <div className="settings-summary-grid">
        <div className="settings-summary-card">
          <span>Market Cache</span>
          <strong>{marketItemCount.toLocaleString()}</strong>
          <small>{formatAge(marketMeta?.last_updated)}</small>
        </div>
        <div className="settings-summary-card">
          <span>Item Database</span>
          <strong>{itemCount.toLocaleString()}</strong>
          <small>Local app data</small>
        </div>
        <div className="settings-summary-card">
          <span>Game Entities</span>
          <strong>{entityCount.toLocaleString()}</strong>
          <small>Enemies, dungeons, and world bosses.</small>
        </div>
      </div>
      <OfflineStoragePanel />
    </div>
  );
}
