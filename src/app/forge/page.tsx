"use client";

import { BackToTop, Skeleton, SkeletonContainer } from "@/components/ui";
import { useForgeState } from "./hooks/useForgeState";
import { useForgeLessons } from "./hooks/useForgeLessons";
import { ForgeHeader } from "./components/ForgeHeader";
import { ForgeTabs } from "./components/ForgeTabs";
import { ForgeLessonsTab } from "./components/ForgeLessonsTab";
import { CraftItemTab } from "./components/craft/CraftItemTab";
import styles from "./Forge.module.css";

export * from "./types";

export default function ForgePage() {
  const state = useForgeState();
  const lessons = useForgeLessons();
  const { statusMessage, activeTab, loading } = state;

  return (
    <main className={`container ${styles.page}`} aria-labelledby="forge-page-title">
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
      <ForgeHeader state={state} lessons={lessons} />
      <ForgeTabs state={state} />

      <div className={styles.tabViewport} style={{ minHeight: "480px", contain: "layout" }}>
        {loading && activeTab === "craft" ? (
          <SkeletonContainer busy announcement="Loading forge recipes...">
            <div className={styles.skeletonCard}>
              <Skeleton variant="text" width="32%" height={22} />
              <Skeleton variant="rectangular" width="100%" height={48} />
              <Skeleton variant="rectangular" width="100%" height={48} />
              <Skeleton variant="rectangular" width="100%" height={48} />
            </div>
          </SkeletonContainer>
        ) : activeTab === "craft" ? (
          <CraftItemTab state={state} />
        ) : (
          <ForgeLessonsTab lessons={lessons} />
        )}
      </div>

      <BackToTop />
    </main>
  );
}
