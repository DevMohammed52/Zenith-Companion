import React, { type RefObject } from "react";
import {
  Button,
  Card,
  Icon,
  SearchInput,
  Select,
  type SelectOption,
} from "@/components/ui";
import { weatherIcon, type MapLocation } from "../types";
import styles from "../page.module.css";

interface MapHeaderProps {
  query: string;
  setQuery: (q: string) => void;
  resetFilters: () => void;
  locations: MapLocation[];
  filteredLocations: MapLocation[];
  selectedLocation: MapLocation | null;
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  selectedWeatherKey: string;
  selectedWeatherLabel: string;
  selectedLevelLabel: string;
  selectedActivityLabel: string;
  mapStageRef: RefObject<HTMLDivElement | null>;
  dossierRef: RefObject<HTMLElement | null>;
  intelRef: RefObject<HTMLElement | null>;
  scrollToSection: (target: HTMLElement | null) => void;
}

export function MapHeader({
  query,
  setQuery,
  resetFilters,
  locations,
  filteredLocations,
  selectedLocation,
  selectedKey,
  setSelectedKey,
  selectedWeatherKey,
  selectedWeatherLabel,
  selectedLevelLabel,
  selectedActivityLabel,
  mapStageRef,
  dossierRef,
  intelRef,
  scrollToSection,
}: MapHeaderProps) {
  const regionOptions: SelectOption[] = locations.map((loc) => ({
    value: loc.key,
    label: loc.name,
    badge: loc.level !== null ? `Lv.${loc.level}+` : undefined,
  }));

  return (
    <Card padding="md" overflowVisible className={styles.heroCard}>
      <div className={styles.heroTop}>
        <div className={styles.heroTitleBlock}>
          <span className={styles.eyebrow}>
            <Icon name="map" size="sm" aria-hidden="true" />
            <span>World Atlas</span>
          </span>
          <h1 className={styles.pageTitle}>World Map</h1>
          <p className={styles.pageSubtitle}>
            Inspect Solaris Isle regions, live weather buffs, conquest control, enemy sources, loot drops, gathered resources, and teleport costs.
          </p>
          <div className={styles.contextStrip} aria-label="Selected region context">
            <span>
              {filteredLocations.length === locations.length
                ? `${locations.length} locations`
                : `${filteredLocations.length} of ${locations.length} matching`}
            </span>
            <span className={styles.vDivider} aria-hidden="true" />
            <span className={styles.contextItem}>
              {weatherIcon(selectedWeatherKey, 14)}
              <span>{selectedWeatherLabel}</span>
            </span>
            <span className={styles.vDivider} aria-hidden="true" />
            <span>{selectedLevelLabel}</span>
            <span className={styles.vDivider} aria-hidden="true" />
            <span>{selectedActivityLabel}</span>
          </div>
        </div>

        <div className={styles.heroControls}>
          <div className={styles.searchGroup}>
            <div className={styles.searchWrapper}>
              <SearchInput
                value={query}
                onChange={setQuery}
                onClear={resetFilters}
                placeholder="Search location, boss, dungeon, enemy, drop, resource..."
                ariaLabel="Search locations and sources"
                showShortcutHint={false}
              />
            </div>
            {regionOptions.length > 0 && (
              <div className={styles.regionSelectWrapper}>
                <Select
                  options={regionOptions}
                  value={selectedLocation?.key || selectedKey}
                  onChange={setSelectedKey}
                  placeholder="Jump to region..."
                  ariaLabel="Jump to region"
                />
              </div>
            )}
          </div>

          <div className={styles.quickJumpRow} role="group" aria-label="Page sections">
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="map" size="sm" />}
              onClick={() => scrollToSection(mapStageRef.current)}
            >
              Map
            </Button>
            <span className={styles.vDivider} aria-hidden="true" />
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="mapPin" size="sm" />}
              onClick={() => scrollToSection(dossierRef.current)}
              disabled={!selectedLocation}
            >
              Dossier
            </Button>
            <span className={styles.vDivider} aria-hidden="true" />
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="items" size="sm" />}
              onClick={() => scrollToSection(intelRef.current)}
              disabled={!selectedLocation}
            >
              Regional Intel
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
