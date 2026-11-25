import React, { type RefObject } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import {
  Badge,
  Card,
  Icon,
  ProgressBar,
  Select,
  Separator,
  type SelectOption,
} from "@/components/ui";
import {
  formatDurationCompact,
  formatWindow,
  getLoreRouteHref,
  getWeatherRouteHref,
  poiIcon,
  weatherIcon,
  type MapConquestSummary,
  type MapLocation,
  type PointOfInterest,
} from "../types";
import { WeatherEffectsBreakdown } from "./WeatherEffectsBreakdown";
import styles from "../page.module.css";

interface TravelEstimate {
  destinationKey: string;
  destinationName: string;
  sameLocation: boolean;
  distanceMeters: number | null;
  teleportCost: number | null;
  travelSeconds: number | null;
  economicLevel: number;
  classDiscount: boolean;
  profileName: string | null;
}

interface LocationDossierProps {
  dossierRef: RefObject<HTMLElement | null>;
  locations: MapLocation[];
  selectedLocation: MapLocation;
  selectedPointsOfInterest: PointOfInterest[];
  selectedConquest: MapConquestSummary | null;
  profileHouseMatch: string | null;
  travelDestinationKey: string;
  setTravelDestinationKey: (key: string) => void;
  travelEstimate: TravelEstimate | null;
}

export function LocationDossier({
  dossierRef,
  locations,
  selectedLocation,
  selectedPointsOfInterest,
  selectedConquest,
  profileHouseMatch,
  travelDestinationKey,
  setTravelDestinationKey,
  travelEstimate,
}: LocationDossierProps) {
  const weatherWindow = selectedLocation.currentWeather || selectedLocation.nextWeather;
  const weatherKey = String(weatherWindow?.key || "OVERCAST").toUpperCase();
  const weatherBuffs = weatherWindow?.buffs || [];

  const destinationOptions: SelectOption[] = locations.map((loc) => ({
    value: loc.key,
    label: loc.name,
    badge: loc.level !== null && loc.level !== undefined ? `Lv.${loc.level}+` : undefined,
  }));

  return (
    <Card
      padding="md"
      overflowVisible
      className={styles.dossierCard}
    >
      <section ref={dossierRef} aria-label={`${selectedLocation.name} dossier`} className={styles.dossierInner}>
        {/* 1. Atmospheric Region Banner Header + Quick Tool Links */}
        <div className={styles.dossierHeroBanner}>
          {selectedLocation.image_url && (
            <div className={styles.dossierBannerMedia} aria-hidden="true">
              <GameImage
                src={selectedLocation.image_url}
                alt=""
                width={1200}
                height={360}
                className={styles.dossierBannerImg}
              />
            </div>
          )}
          <div className={styles.dossierBannerScrim} aria-hidden="true" />

          <div className={styles.dossierHeroContent}>
            <div className={styles.dossierIdentity}>
              <div className={styles.dossierTitleBlock}>
                <div className={styles.dossierMetaTop}>
                  <span className={styles.dossierLabel}>Selected Region</span>
                  {selectedLocation.level !== null && (
                    <Badge variant="neutral" size="sm">
                      Lv. {selectedLocation.level}+
                    </Badge>
                  )}
                </div>
                <h2 className={styles.dossierName}>{selectedLocation.name}</h2>
              </div>

              <p className={styles.dossierDesc}>
                {selectedLocation.description || "Browse nearby enemies, dungeons, bosses, gathered resources, loot drops, and weather windows."}
              </p>

              {profileHouseMatch && (
                <Link href="/housing" className={styles.houseMatchLink}>
                  <Icon name="housing" size="sm" aria-hidden="true" />
                  <span>{profileHouseMatch}</span>
                  <Icon name="externalLink" size="xs" aria-hidden="true" />
                </Link>
              )}
            </div>

            <div className={styles.quickLinksGrid} aria-label="Connected tools for this region">
              <Link href={`/enemies?location=${encodeURIComponent(selectedLocation.key)}`} className={styles.routeActionLink}>
                <Icon name="combat" size="sm" aria-hidden="true" />
                <span>Enemies ({selectedLocation.enemies.length})</span>
                <Icon name="externalLink" size="xs" aria-hidden="true" />
              </Link>
              <Link href={`/dungeons?search=${encodeURIComponent(selectedLocation.name)}`} className={styles.routeActionLink}>
                <Icon name="dungeon" size="sm" aria-hidden="true" />
                <span>Dungeons ({selectedLocation.dungeons.length})</span>
                <Icon name="externalLink" size="xs" aria-hidden="true" />
              </Link>
              <Link href={`/bosses?search=${encodeURIComponent(selectedLocation.name)}`} className={styles.routeActionLink}>
                <Icon name="boss" size="sm" aria-hidden="true" />
                <span>Bosses ({selectedLocation.bosses.length})</span>
                <Icon name="externalLink" size="xs" aria-hidden="true" />
              </Link>
              <Link href={getLoreRouteHref(selectedLocation.key, selectedLocation.name)} className={styles.routeActionLink}>
                <Icon name="lore" size="sm" aria-hidden="true" />
                <span>Lore Archive</span>
                <Icon name="externalLink" size="xs" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <Separator orientation="horizontal" decorative />

        {/* 2. Balanced 2-Column Intelligence Body */}
        <div className={styles.dossierColumns}>
          {/* Left Column: Live Weather Breakdown & Conquest Status */}
          <div className={styles.dossierCol}>
            <div className={styles.dossierSection}>
              <div className={styles.dossierSectionHead}>
                <div className={styles.dossierSectionTitle}>
                  {weatherIcon(weatherKey, 16)}
                  <span>{selectedLocation.currentWeather ? "Current Weather" : "Next Weather"}: {weatherWindow?.name || "Unknown"}</span>
                </div>
                <Link
                  href={getWeatherRouteHref(weatherWindow?.key, weatherWindow?.name)}
                  className={styles.subtleRouteLink}
                >
                  <span>Weather Guide</span>
                  <Icon name="externalLink" size="xs" aria-hidden="true" />
                </Link>
              </div>

              <p className={styles.weatherWindowLabel}>{formatWindow(weatherWindow)}</p>
              <WeatherEffectsBreakdown buffs={weatherBuffs} />
            </div>

            {selectedConquest && (
              <>
                <Separator orientation="horizontal" decorative />
                <div className={styles.dossierSection}>
                  <div className={styles.dossierSectionHead}>
                    <div className={styles.dossierSectionTitle}>
                      <Icon name="conquest" size="sm" aria-hidden="true" />
                      <span>
                        Conquest: {selectedConquest.leadingGuildTag ? `[${selectedConquest.leadingGuildTag}] ` : ""}
                        {selectedConquest.leadingGuildName}
                      </span>
                    </div>
                    <Link
                      href={`/conquest?zone=${encodeURIComponent(selectedLocation.key)}`}
                      className={styles.subtleRouteLink}
                    >
                      <span>View Zone</span>
                      <Icon name="externalLink" size="xs" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className={styles.conquestBarRow}>
                    <ProgressBar
                      value={selectedConquest.leadingSharePct}
                      max={100}
                      label={`Control share: ${selectedConquest.leadingSharePct}%${selectedConquest.isAssailed ? " (Assault active)" : ""}`}
                      showReadout={false}
                      variant="default"
                      size="sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Travel & Teleport + Points of Interest */}
          <div className={styles.dossierCol}>
            {travelEstimate && (
              <div className={styles.dossierSection}>
                <div className={styles.dossierSectionHead}>
                  <div className={styles.dossierSectionTitle}>
                    <Icon name="route" size="sm" aria-hidden="true" />
                    <span>Travel &amp; Teleport</span>
                  </div>
                  {travelEstimate.classDiscount && (
                    <Badge variant="refined" size="sm">50% class discount</Badge>
                  )}
                </div>

                <div className={styles.travelOriginNote}>
                  <span>From</span>
                  <strong>{selectedLocation.name}</strong>
                </div>

                <div className={styles.travelOriginRow}>
                  <span className={styles.travelOriginLabel}>To</span>
                  <div className={styles.travelSelectWrap}>
                    <Select
                      options={destinationOptions}
                      value={travelDestinationKey || travelEstimate.destinationKey}
                      onChange={setTravelDestinationKey}
                      ariaLabel="Travel destination region"
                    />
                  </div>
                </div>

                <div className={styles.travelStrip}>
                  <div className={styles.travelStat}>
                    <span>Distance</span>
                    <strong>
                      {travelEstimate.sameLocation
                        ? "Here"
                        : travelEstimate.distanceMeters !== null
                        ? `${travelEstimate.distanceMeters.toLocaleString()}m`
                        : "-"}
                    </strong>
                  </div>
                  <span className={styles.vDividerTall} aria-hidden="true" />
                  <div className={styles.travelStat}>
                    <span>Teleport</span>
                    <strong className={styles.goldValue}>
                      {travelEstimate.sameLocation ? (
                        "0g"
                      ) : travelEstimate.teleportCost !== null ? (
                        <>
                          <GoldIcon size={13} />
                          <span>{travelEstimate.teleportCost.toLocaleString()}g</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </strong>
                  </div>
                  <span className={styles.vDividerTall} aria-hidden="true" />
                  <div className={styles.travelStat}>
                    <span>Walk</span>
                    <strong>
                      {travelEstimate.sameLocation ? "0s" : formatDurationCompact(travelEstimate.travelSeconds)}
                    </strong>
                  </div>
                </div>

                <p className={styles.travelHint}>
                  {travelEstimate.profileName
                    ? `Calculated for ${travelEstimate.profileName} (Economic TL ${travelEstimate.economicLevel.toLocaleString()}).`
                    : `Calculated at Economic TL ${travelEstimate.economicLevel.toLocaleString()}.`}
                </p>
              </div>
            )}

            <Separator orientation="horizontal" decorative />

            <div className={styles.dossierSection}>
              <div className={styles.dossierSectionHead}>
                <div className={styles.dossierSectionTitle}>
                  <Icon name="mapPin" size="sm" aria-hidden="true" />
                  <span>Points of Interest</span>
                </div>
                <span className={styles.mutedCount}>{selectedPointsOfInterest.length}</span>
              </div>
              {selectedPointsOfInterest.length > 0 ? (
                <div className={styles.poiGrid} role="list" aria-label={`${selectedLocation.name} points of interest`}>
                  {selectedPointsOfInterest.map((point) => (
                    <div key={`${selectedLocation.key}-${point.kind}`} className={styles.poiItem} role="listitem">
                      <span className={styles.poiIconWrap}>{poiIcon(point.kind, 15)}</span>
                      <span className={styles.poiText}>
                        <strong>{point.label}</strong>
                        <small>{point.detail}</small>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className={styles.mutedNote}>No mapped facilities or combat encounters.</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </Card>
  );
}
