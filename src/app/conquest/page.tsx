"use client";

import { useState } from "react";
import { BackToTop } from "@/components/ui/BackToTop";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useConquestState } from "./hooks/useConquestState";
import ConquestHero from "./components/ConquestHero";
import ConquestToolbar from "./components/ConquestToolbar";
import ConquestZoneGrid from "./components/ConquestZoneGrid";
import ConquestDetailPanel from "./components/ConquestDetailPanel";
import ConquestGlobalLeaders from "./components/ConquestGlobalLeaders";
import ConquestRewardsModal from "./components/ConquestRewardsModal";
import styles from "./page.module.css";

export default function ConquestPage() {
  const state = useConquestState();
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const { data, error, selectedZone, filteredZones, seasonLeaders } = state;

  if (error) {
    return (
      <main className={styles.page} aria-label="Conquest">
        <section className={styles.panel}>
          <EmptyState
            icon="error"
            variant="error"
            title="Conquest data unavailable"
            description={error}
            action={{
              label: "Retry",
              onClick: () => window.location.reload(),
            }}
          />
        </section>
      </main>
    );
  }

  if (!data || !selectedZone) {
    return (
      <main className={`${styles.page} ${styles.loadingPage}`} aria-labelledby="conquest-page-title" aria-busy="true">
        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <div className={styles.eyebrow}><Icon name="conquest" size="sm" aria-hidden="true" /> Guild Conquest</div>
            <h1 id="conquest-page-title" className={styles.title}>Conquest</h1>
            <p className={styles.subtitle}>
              Territory control, active assault timers, guild standings, and archived seasons.
            </p>
            <div className={styles.heroStrip} aria-hidden="true">
              <Skeleton variant="text" width={68} height={20} />
              <Skeleton variant="text" width={175} height={20} />
              <Skeleton variant="text" width={96} height={20} />
            </div>
          </div>
          <div className={styles.heroControls} aria-hidden="true">
            <Skeleton variant="rectangular" width={132} height={44} />
            <div className={styles.seasonPicker}>
              <Skeleton variant="rectangular" width="100%" height={44} />
            </div>
          </div>
        </section>

        <div className={styles.loadingToolbar} aria-hidden="true">
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </div>

        <div className={styles.loadingReserve} aria-hidden="true">
          <Skeleton variant="rectangular" width="100%" height={420} />
        </div>
        <p className="sr-only" role="status" aria-live="polite">Loading conquest data.</p>
      </main>
    );
  }

  return (
    <main className={styles.page} aria-labelledby="conquest-page-title">
      <ConquestHero state={state} onOpenRewards={() => setRewardsOpen(true)} />
      <ConquestToolbar state={state} />

      <section className={styles.layout}>
        <ConquestZoneGrid state={state} />
        {filteredZones.length > 0 && (
          <ConquestDetailPanel selectedZone={selectedZone} state={state} />
        )}
      </section>

      <ConquestGlobalLeaders data={data} seasonLeaders={seasonLeaders} guildLevels={state.guildLevels} />

      <ConquestRewardsModal isOpen={rewardsOpen} onClose={() => setRewardsOpen(false)} />

      {state.seasonLoading && (
        <div className={styles.seasonOverlayNote} role="status" aria-live="polite">
          <Button variant="ghost" size="sm" loading>Loading season...</Button>
        </div>
      )}

      <BackToTop />
    </main>
  );
}
