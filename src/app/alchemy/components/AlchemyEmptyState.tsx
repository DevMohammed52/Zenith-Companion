"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export function AlchemyEmptyState({
  mythicSearchMatches,
}: {
  mythicSearchMatches: string[];
}) {
  return (
    <div className="alchemy-empty-state">
      <Search size={28} />
      <h3>No alchemy strategies match those filters</h3>
      {mythicSearchMatches.length > 0 ? (
        <>
          <p>
            {mythicSearchMatches.slice(0, 2).join(", ")} matches level 90 mythic alchemy instead.
          </p>
          <Link className="alchemy-empty-link" href="/alchemy/mythic">
            Open Mythic Lab
          </Link>
        </>
      ) : (
        <p>
          Relax the profit, volume, liquidity, level, or search filters to bring recipes back.
        </p>
      )}
    </div>
  );
}
