"use client";

import { BackToTop } from "@/components/ui";
import { useForgeLessons } from "../hooks/useForgeLessons";
import { ForgeHeader } from "../components/ForgeHeader";
import { ForgeTabs } from "../components/ForgeTabs";
import { ForgeLessonsTab } from "../components/ForgeLessonsTab";
import styles from "../Forge.module.css";

export default function ForgeLessonsPage() {
  const lessons = useForgeLessons();

  return (
    <main className={`container ${styles.page}`} aria-labelledby="forge-page-title">
      <ForgeHeader lessons={lessons} activeTab="lessons" />
      <ForgeTabs activeTab="lessons" />

      <div className={styles.tabViewport} style={{ minHeight: "480px", contain: "layout" }}>
        <ForgeLessonsTab lessons={lessons} />
      </div>

      <BackToTop />
    </main>
  );
}
