"use client";

import React, { Suspense } from "react";
import { EnemyModal } from "@/components/EnemyModal";
import { BackToTop, Card, Skeleton, SkeletonContainer } from "@/components/ui";
import { useMapState } from "./hooks/useMapState";
import { MapHeader } from "./components/MapHeader";
import { MapStage } from "./components/MapStage";
import { LocationDossier } from "./components/LocationDossier";
import { IntelGrid } from "./components/IntelGrid";
import styles from "./page.module.css";

function MapLoadingSkeleton() {
  return (
    <main className={styles.page}>
      <SkeletonContainer busy className={styles.shell}>
        <Card padding="md">
          <div className={styles.skeletonStack}>
            <Skeleton height={22} width="160px" />
            <Skeleton height={36} width="260px" />
            <Skeleton height={44} width="100%" />
          </div>
        </Card>
        <div className={styles.atlasGrid}>
          <Card padding="md">
            <Skeleton height={480} width="100%" />
          </Card>
          <Card padding="md">
            <div className={styles.skeletonStack}>
              <Skeleton height={64} width="100%" />
              <Skeleton height={110} width="100%" />
            </div>
          </Card>
        </div>
      </SkeletonContainer>
    </main>
  );
}

function MapPageContent() {
  const state = useMapState();

  if (!state.selectedLocation && state.loading) {
    return <MapLoadingSkeleton />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <MapHeader
          query={state.query}
          setQuery={state.setQuery}
          resetFilters={state.resetFilters}
          locations={state.locations}
          filteredLocations={state.filteredLocations}
          selectedLocation={state.selectedLocation}
          selectedKey={state.selectedKey}
          setSelectedKey={state.setSelectedKey}
          selectedWeatherKey={state.selectedWeatherKey}
          selectedWeatherLabel={state.selectedWeatherLabel}
          selectedLevelLabel={state.selectedLevelLabel}
          selectedActivityLabel={state.selectedActivityLabel}
          mapStageRef={state.mapStageRef}
          dossierRef={state.dossierRef}
          intelRef={state.intelRef}
          scrollToSection={state.scrollToSection}
        />

        <section className={styles.atlasGrid} aria-label="Solaris Isle world map and selected region">
          <MapStage
            mapStageRef={state.mapStageRef}
            quickRailRef={state.quickRailRef}
            filteredLocations={state.filteredLocations}
            selectedLocation={state.selectedLocation}
            setSelectedKey={state.setSelectedKey}
            resetFilters={state.resetFilters}
          />

          {state.selectedLocation && (
            <LocationDossier
              dossierRef={state.dossierRef}
              locations={state.locations}
              selectedLocation={state.selectedLocation}
              selectedPointsOfInterest={state.selectedPointsOfInterest}
              selectedConquest={state.selectedConquest}
              profileHouseMatch={state.profileHouseMatch}
              travelDestinationKey={state.travelDestinationKey}
              setTravelDestinationKey={state.setTravelDestinationKey}
              travelEstimate={state.travelEstimate}
            />
          )}
        </section>

        {state.selectedLocation && (
          <IntelGrid
            intelRef={state.intelRef}
            selectedLocation={state.selectedLocation}
            activeTab={state.activeTab}
            setActiveTab={state.setActiveTab}
            filteredDrops={state.filteredDrops}
            selectedVisibleDrops={state.selectedVisibleDrops}
            dropsPage={state.dropsPage}
            dropsTotalPages={state.dropsTotalPages}
            setDropsPage={state.setDropsPage}
            selectedWeatherTimeline={state.selectedWeatherTimeline}
            activeForecastKey={state.activeForecastKey}
            setActiveForecastKey={state.setActiveForecastKey}
            openItemByName={state.openItemByName}
            onSelectEnemy={state.setSelectedEnemy}
          />
        )}
      </div>

      <EnemyModal
        enemy={state.selectedEnemy}
        marketData={state.marketData}
        onClose={() => state.setSelectedEnemy(null)}
        onOpenItem={(itemName) => {
          state.setSelectedEnemy(null);
          state.openItemByName(itemName);
        }}
      />

      <BackToTop label="Back to top" />
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapLoadingSkeleton />}>
      <MapPageContent />
    </Suspense>
  );
}
