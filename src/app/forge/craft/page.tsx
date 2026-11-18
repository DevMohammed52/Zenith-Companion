"use client";

import { useForgeState } from "../hooks/useForgeState";
import { ForgeHeader } from "../components/ForgeHeader";
import { ForgeTabs } from "../components/ForgeTabs";
import { CraftItemTab } from "../components/craft/CraftItemTab";
import { ForgeStyles } from "../components/ForgeStyles";

export default function ForgeCraftPage() {
  const state = useForgeState();
  const { statusMessage } = state;
  const craftState = { ...state, activeTab: "craft" as const };

  return (
    <main className="container forge-page" aria-labelledby="forge-page-title">
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
      <ForgeHeader state={craftState} />
      <ForgeTabs state={craftState} />

      <div className="forge-tab-viewport" style={{ minHeight: "480px" }}>
        <CraftItemTab state={craftState} />
      </div>

      <ForgeStyles />
    </main>
  );
}
