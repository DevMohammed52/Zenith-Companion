"use client";

import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";

export function AlchemyHeader({
  strategyCount,
  staleMarket,
  dataAgeMinutes,
}: {
  strategyCount: number;
  staleMarket: boolean;
  dataAgeMinutes: number | null;
}) {
  return (
    <>
      <div className="header alchemy-header">
        <h1 className="header-title" id="alchemy-page-title">
          <ZenithIcon name="alchemy" size={24} style={{ color: "var(--text-accent)" }} /> ALCHEMY
          PROFIT FINDER
        </h1>
        <div className="header-status">
          <div className="status-dot"></div>
          <span className="mono">{strategyCount} STRATEGIES</span>
        </div>
      </div>

      {staleMarket && (
        <div className="alchemy-alert">
          <AlertTriangle size={16} />
          Market data looks stale: last sync was about {dataAgeMinutes} minutes ago.
        </div>
      )}

      <details className="alchemy-note-disclosure">
        <summary>
          <Info size={15} />
          <span>Market calculation notes</span>
        </summary>
        <p>
          Market profit is calculated from recent trade history. 3-day volume shows realistic
          trade frequency, though undercutting and market shifts can affect sell speeds.
        </p>
      </details>
    </>
  );
}
