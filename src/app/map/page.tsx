"use client";

import React, { Suspense } from "react";
import { LoadingState } from "@/components/StateBlock";
import { useMapState } from "./hooks/useMapState";
import { MapStage } from "./components/MapStage";
import { LocationDossier } from "./components/LocationDossier";
import { IntelGrid } from "./components/IntelGrid";
import { MapStyles } from "./components/MapStyles";

function MapPageContent() {
  const state = useMapState();

  if (!state.selectedLocation && state.loading) {
    return (
      <main className="map-page">
        <div className="map-loading">
          <LoadingState
            title="Loading atlas data"
            description="Preparing locations, weather, enemies, dungeons, bosses, and drops."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="map-page">
      <section className="atlas-shell" aria-label="World map">
        <MapStage
          mapStageRef={state.mapStageRef}
          dossierRef={state.dossierRef}
          intelRef={state.intelRef}
          mobileRailRef={state.mobileRailRef}
          query={state.query}
          setQuery={state.setQuery}
          scrollToSection={state.scrollToSection}
          locations={state.locations}
          filteredLocations={state.filteredLocations}
          selectedLocation={state.selectedLocation}
          selectedKey={state.selectedKey}
          setSelectedKey={state.setSelectedKey}
          selectedWeatherKey={state.selectedWeatherKey}
          selectedWeatherLabel={state.selectedWeatherLabel}
          selectedLevelLabel={state.selectedLevelLabel}
          selectedActivityLabel={state.selectedActivityLabel}
          totals={state.totals}
        />

        {state.selectedLocation && (
          <LocationDossier
            dossierRef={state.dossierRef}
            selectedLocation={state.selectedLocation}
            selectedPointsOfInterest={state.selectedPointsOfInterest}
          />
        )}
      </section>

      {state.selectedLocation && (
        <IntelGrid
          intelRef={state.intelRef}
          selectedLocation={state.selectedLocation}
          selectedVisibleDrops={state.selectedVisibleDrops}
          selectedWeatherTimeline={state.selectedWeatherTimeline}
          activeForecastKey={state.activeForecastKey}
          setActiveForecastKey={state.setActiveForecastKey}
          openItemByName={state.openItemByName}
        />
      )}

      <MapStyles />
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={(
        <main className="map-page">
          <div className="map-loading">
            <LoadingState
              title="Loading atlas data"
              description="Preparing locations, weather, enemies, dungeons, bosses, and drops."
            />
          </div>
        </main>
      )}
    >
      <MapPageContent />
    </Suspense>
  );
}
