"use client";

import { useForgeState } from "./hooks/useForgeState";
import { useForgeLessons } from "./hooks/useForgeLessons";
import { ForgeHeader } from "./components/ForgeHeader";
import { ForgeTabs } from "./components/ForgeTabs";
import { ForgeLessonsTab } from "./components/ForgeLessonsTab";
import { CraftItemTab } from "./components/craft/CraftItemTab";
import { ForgeStyles } from "./components/ForgeStyles";

export * from "./types";

export default function ForgePage() {
  const state = useForgeState();
  const lessons = useForgeLessons();
  const { activeTab, statusMessage } = state;

  return (
    <main className="container forge-page" aria-labelledby="forge-page-title">
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
      <ForgeHeader state={state} lessons={lessons} />
      <ForgeTabs state={state} />

      <div className="forge-tab-viewport" style={{ minHeight: "480px", contain: "layout" }}>
        {activeTab === "lessons" && <ForgeLessonsTab lessons={lessons} />}
        {activeTab === "craft" && <CraftItemTab state={state} />}
      </div>

      <ForgeStyles />
    </main>
  );
}
