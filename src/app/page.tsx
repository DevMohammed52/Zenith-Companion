"use client";

import { useDashboardState } from "./hooks/useDashboardState";
import {
  DashboardHero,
  DashboardSetupReminder,
  DashboardPriorityTools,
  DashboardQuickLinks,
  DashboardModuleGrid,
} from "./components";

export default function DashboardPage() {
  const state = useDashboardState();

  return (
    <main className="container dashboard dashboard-command">
      <DashboardHero
        timeSince={state.timeSince}
        marketFreshness={state.marketFreshness}
        registryCount={state.registryCount}
        registryCountLabel={state.registryCountLabel}
        activeProfileLabel={state.activeProfileLabel}
        profileDetail={state.profileDetail}
      />

      {state.needsProfileSetup && <DashboardSetupReminder />}

      <DashboardPriorityTools
        bestSkillRoute={state.bestSkillRoute}
        queuePlan={state.queuePlan}
        housingLabel={state.housingLabel}
        housingDescription={state.housingDescription}
        forgeCraftsCount={state.forgeCraftsCount}
        forgeLinesLength={state.forgeLines.length}
      />

      <DashboardQuickLinks
        ownedPetsCount={state.activeProfile?.ownedPets?.length}
        activeMythicNames={state.activeMythicNames}
      />

      <DashboardModuleGrid />
    </main>
  );
}
