"use client";

import { BackToTop } from "@/components/ui";
import { useDashboardState } from "./hooks/useDashboardState";
import {
  DashboardHero,
  DashboardModuleGrid,
  DashboardPriorityTools,
  DashboardQuickLinks,
  DashboardSetupReminder,
} from "./components";
import styles from "./page.module.css";

export default function Home() {
  const state = useDashboardState();

  return (
    <main className={styles.page}>
      <DashboardHero
        hasConfiguredProfile={state.hasConfiguredProfile}
        hasMembership={state.hasMembership}
        activeProfileName={state.activeProfileName}
        activeProfileClass={state.activeProfileClass}
        activeProfileImageUrl={state.activeProfileImageUrl}
        activeProfileBackgroundUrl={state.activeProfileBackgroundUrl}
        guildLabel={state.guildLabel}
        totalLevel={state.totalLevel}
        combatLevel={state.combatLevel}
        activePet={state.activePet}
        equippedGearCount={state.equippedGearCount}
        ownedPetsCount={state.ownedPetsCount}
        museumItemCount={state.museumItemCount}
        petSpeciesCount={state.petSpeciesCount}
      />

      {state.needsProfileSetup && <DashboardSetupReminder />}

      <section className={styles.bentoGrid} aria-label="Gold routes, world boss, and weather">
        <DashboardPriorityTools
          rankedRoutes={state.rankedRoutes}
          queuedCount={state.queuedCount}
          queueProfit={state.queueProfit}
          queuePlanEntriesCount={state.queuePlanEntriesCount}
          forgeCraftsCount={state.forgeCraftsCount}
          housingStatusLabel={state.housingStatusLabel}
          housingConduitNote={state.housingConduitNote}
        />

        <DashboardQuickLinks
          liveBossPulse={state.liveBossPulse}
          worldWeatherPulse={state.worldWeatherPulse}
        />
      </section>

      <DashboardModuleGrid
        marketMovers={state.marketMovers}
        equippedGearCount={state.equippedGearCount}
        ownedPetsCount={state.ownedPetsCount}
        petSpeciesCount={state.petSpeciesCount}
        activeMythicCount={state.activeMythicCount}
        housingStatusLabel={state.housingStatusLabel}
        recentTools={state.recentTools}
        latestRelease={state.latestRelease}
      />

      <BackToTop />
    </main>
  );
}
