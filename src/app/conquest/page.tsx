"use client";

import ZenithIcon from "@/components/icons/ZenithIcon";
import { ErrorState } from "@/components/StateBlock";
import { useConquestState } from "./hooks/useConquestState";
import ConquestHero from "./components/ConquestHero";
import ConquestCommandGrid from "./components/ConquestCommandGrid";
import ConquestToolbar from "./components/ConquestToolbar";
import ConquestZoneGrid from "./components/ConquestZoneGrid";
import ConquestDetailPanel from "./components/ConquestDetailPanel";
import ConquestGlobalLeaders from "./components/ConquestGlobalLeaders";
import styles from "./page.module.css";

export default function ConquestPage() {
  const state = useConquestState();
  const { data, error, selectedZone, filteredZones, seasonLeaders } = state;

  if (error) {
    return (
      <main className={styles.page} aria-label="Conquest">
        <section className={styles.panel}>
          <ErrorState
            title="Conquest data unavailable"
            description={error}
            action={<button type="button" onClick={() => window.location.reload()}>Retry</button>}
          />
        </section>
      </main>
    );
  }

  if (!data || !selectedZone) {
    return (
      <main className={`${styles.page} ${styles.loadingPage}`} aria-labelledby="conquest-page-title" aria-busy="true">
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}><ZenithIcon name="conquest" size={15} /> Guild Conquest</div>
            <h1 id="conquest-page-title" className={styles.title}>Conquest</h1>
            <p className={styles.subtitle}>
              Loading zone control, guild leaders, and active assault rows from the latest conquest snapshot.
            </p>
          </div>
          <div className={`${styles.freshness} ${styles.loadingFreshness}`} aria-hidden="true">
            <span>Updated</span>
            <strong>Loading</strong>
            <span>Snapshot time</span>
            <span>Current season</span>
          </div>
        </section>

        <div className={styles.loadingReserve} aria-hidden="true" />
        <p className="sr-only" role="status" aria-live="polite">Loading conquest data.</p>
      </main>
    );
  }

  return (
    <main className={styles.page} aria-labelledby="conquest-page-title">
      <ConquestHero data={data} />
      <ConquestCommandGrid state={state} />
      <ConquestToolbar state={state} />

      <section className={styles.layout}>
        <ConquestZoneGrid state={state} />
        {filteredZones.length > 0 && (
          <ConquestDetailPanel selectedZone={selectedZone} state={state} />
        )}
      </section>

      <ConquestGlobalLeaders data={data} seasonLeaders={seasonLeaders} />
    </main>
  );
}
