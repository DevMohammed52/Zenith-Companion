"use client";

import { BackToTop, Skeleton, SkeletonContainer } from "@/components/ui";
import { useForgeState } from "../hooks/useForgeState";
import { ForgeHeader } from "../components/ForgeHeader";
import { ForgeTabs } from "../components/ForgeTabs";
import { CraftItemTab } from "../components/craft/CraftItemTab";
import styles from "../Forge.module.css";

export default function ForgeCraftPage() {
  const state = useForgeState();
  const { statusMessage, loading } = state;
  const craftState = { ...state, activeTab: "craft" as const };

  return (
    <main className={`container ${styles.page}`} aria-labelledby="forge-page-title">
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
      <ForgeHeader state={craftState} />
      <ForgeTabs state={craftState} />

      <div className={styles.tabViewport} style={{ minHeight: "480px", contain: "layout" }}>
        {loading ? (
          <SkeletonContainer busy announcement="Loading forge recipes...">
            <div className={styles.skeletonCard}>
              <Skeleton variant="text" width="32%" height={22} />
              <Skeleton variant="rectangular" width="100%" height={48} />
              <Skeleton variant="rectangular" width="100%" height={48} />
            </div>
          </SkeletonContainer>
        ) : (
          <CraftItemTab state={craftState} />
        )}
      </div>

      <BackToTop />
    </main>
  );
}
