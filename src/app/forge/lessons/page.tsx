"use client";

import { useForgeLessons } from "../hooks/useForgeLessons";
import { ForgeHeader } from "../components/ForgeHeader";
import { ForgeTabs } from "../components/ForgeTabs";
import { ForgeLessonsTab } from "../components/ForgeLessonsTab";
import { ForgeStyles } from "../components/ForgeStyles";

export default function ForgeLessonsPage() {
  const lessons = useForgeLessons();

  return (
    <main className="container forge-page" aria-labelledby="forge-page-title">
      <ForgeHeader lessons={lessons} activeTab="lessons" />
      <ForgeTabs activeTab="lessons" />

      <div className="forge-tab-viewport" style={{ minHeight: "480px" }}>
        <ForgeLessonsTab lessons={lessons} />
      </div>

      <ForgeStyles />
    </main>
  );
}
